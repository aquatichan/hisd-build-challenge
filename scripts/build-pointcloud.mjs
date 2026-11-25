// Dev-time: converts the raw Houston OBJ scan into compact, hole-free point-cloud files.
//   node scripts/build-pointcloud.mjs [path/to/houston.obj]
// Output: public/data/houston-points-{hi,lo}.bin
//
// Pipeline (fixes the scan's holes: glass towers return pits/voids, facades are missing):
//   1. Rasterize vertices into a max-height grid.
//   2. Fill empty cells from neighbors (no gaps).
//   3. Morphological closing (dilate -> erode) removes pits inside roofs without growing buildings.
//   4. Light median smoothing removes speckle spikes.
//   5. Emit roof points per cell + wall points at every height drop between neighbor cells.
//   6. Weighted subsample to each LOD budget.
//
// File layout (little-endian):
//   bytes 0-3   magic 'HPC1'
//   bytes 4-7   uint32 point count
//   bytes 8-31  float32 x6: minX, minY, minZ, sizeX, sizeY, sizeZ  (source units; z is up)
//   bytes 32-   uint16 x3 per point (x, y, z), each 0..65535 across its bbox axis

import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const candidates = [process.argv[2], 'assets-src/houston.obj', 'houston.obj']
  .filter(Boolean)
  .map((p) => path.resolve(root, p))
const input = candidates.find((p) => fs.existsSync(p))
if (!input) {
  console.error('houston.obj not found. Tried:\n' + candidates.join('\n'))
  process.exit(1)
}

const LODS = [
  { name: 'hi', target: 230_000 }, // denser so towers read as solid
  { name: 'lo', target: 70_000 },
]
const G = 640 // grid resolution (cells per side)
const CLOSE_R = 3 // closing radius in cells (~0.6 units): fills pits up to ~1.2 units wide
const WALL_MIN_DROP = 0.8 // height step (units) that counts as a wall

// ---- 1. parse + rasterize ----
const text = fs.readFileSync(input, 'utf8')
let minX = Infinity, minY = Infinity, minZ = Infinity, maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity
const verts = []
for (const l of text.split('\n')) {
  if (l.charCodeAt(0) !== 118 || l.charCodeAt(1) !== 32) continue
  const a = l.split(' ')
  const x = +a[1], y = +a[2], z = +a[3]
  verts.push(x, y, z)
  if (x < minX) minX = x; if (x > maxX) maxX = x
  if (y < minY) minY = y; if (y > maxY) maxY = y
  if (z < minZ) minZ = z; if (z > maxZ) maxZ = z
}
const sx = maxX - minX, sy = maxY - minY, sz = maxZ - minZ
const nV = verts.length / 3
console.log(`read ${nV} vertices from ${path.relative(root, input)}`)

let H = new Float32Array(G * G).fill(NaN)
for (let i = 0; i < nV; i++) {
  const cx = Math.min(G - 1, Math.floor(((verts[i * 3] - minX) / sx) * G))
  const cy = Math.min(G - 1, Math.floor(((verts[i * 3 + 1] - minY) / sy) * G))
  const k = cy * G + cx
  const z = verts[i * 3 + 2] - minZ
  if (!(H[k] >= z)) H[k] = z
}

// ---- 2. fill empty cells from neighbors until none remain ----
let empty = H.reduce((n, v) => n + (Number.isNaN(v) ? 1 : 0), 0)
console.log(`empty cells before fill: ${empty} (${((empty / (G * G)) * 100).toFixed(1)}%)`)
while (empty > 0) {
  const next = H.slice()
  empty = 0
  for (let y = 0; y < G; y++)
    for (let x = 0; x < G; x++) {
      const k = y * G + x
      if (!Number.isNaN(H[k])) continue
      let s = 0, c = 0
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy
          if (nx < 0 || ny < 0 || nx >= G || ny >= G) continue
          const v = H[ny * G + nx]
          if (!Number.isNaN(v)) { s += v; c++ }
        }
      if (c) next[k] = s / c
      else empty++
    }
  H = next
}

// ---- 3. morphological closing (separable square max then min) ----
const pass = (src, r, fn, horizontal) => {
  const out = new Float32Array(G * G)
  for (let y = 0; y < G; y++)
    for (let x = 0; x < G; x++) {
      let v = src[y * G + x]
      for (let d = -r; d <= r; d++) {
        const nx = horizontal ? x + d : x, ny = horizontal ? y : y + d
        if (nx < 0 || ny < 0 || nx >= G || ny >= G) continue
        v = fn(v, src[ny * G + nx])
      }
      out[y * G + x] = v
    }
  return out
}
const dilate = (s, r) => pass(pass(s, r, Math.max, true), r, Math.max, false)
const erode = (s, r) => pass(pass(s, r, Math.min, true), r, Math.min, false)
H = erode(dilate(H, CLOSE_R), CLOSE_R)

// ---- 4. 3x3 median to kill speckle spikes ----
{
  const out = new Float32Array(G * G)
  const win = new Float32Array(9)
  for (let y = 0; y < G; y++)
    for (let x = 0; x < G; x++) {
      let c = 0
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const nx = Math.min(G - 1, Math.max(0, x + dx)), ny = Math.min(G - 1, Math.max(0, y + dy))
          win[c++] = H[ny * G + nx]
        }
      out[y * G + x] = win.sort()[4]
    }
  H = out
}

// ---- 5. candidate points: roofs + walls ----
let seed = 1234567
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296)
const cw = sx / G, ch = sy / G
const cand = [] // [x, y, z, weight]
const ground = [...H].sort((a, b) => a - b)[Math.floor(G * G * 0.5)]

for (let y = 0; y < G; y++)
  for (let x = 0; x < G; x++) {
    const h = H[y * G + x]
    const rel = Math.max(0, h - ground) / (sz - ground)
    // roof / ground surface: 2 jittered points per cell
    for (let s = 0; s < 2; s++)
      cand.push([minX + (x + rnd()) * cw, minY + (y + rnd()) * ch, minZ + h, 0.15 + 2.5 * rel * rel])
    // walls: toward each lower neighbor
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy
      if (nx < 0 || ny < 0 || nx >= G || ny >= G) continue
      const drop = h - H[ny * G + nx]
      if (drop < WALL_MIN_DROP) continue
      const n = Math.ceil(drop * 3)
      const ex = dx ? x + (dx > 0 ? 1 : 0) : x + rnd()
      const ey = dy ? y + (dy > 0 ? 1 : 0) : y + rnd()
      for (let s = 0; s < n; s++)
        cand.push([minX + ex * cw, minY + ey * ch, minZ + h - rnd() * drop, 1.6])
    }
  }
console.log(`candidates: ${cand.length}`)

// ---- 6. subsample per LOD and write ----
const wsum = cand.reduce((s, c) => s + c[3], 0)
fs.mkdirSync(path.join(root, 'public/data'), { recursive: true })

for (const { name, target } of LODS) {
  const k = target / wsum
  const pts = cand.filter((c) => rnd() < Math.min(1, c[3] * k))
  for (let i = pts.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[pts[i], pts[j]] = [pts[j], pts[i]]
  }
  const count = pts.length
  const buf = Buffer.alloc(32 + count * 6)
  buf.write('HPC1', 0, 'ascii')
  buf.writeUInt32LE(count, 4)
  ;[minX, minY, minZ, sx, sy, sz].forEach((v, i) => buf.writeFloatLE(v, 8 + i * 4))
  let o = 32
  const q = (v) => Math.max(0, Math.min(65535, Math.round(v * 65535)))
  for (const [x, y, z] of pts) {
    buf.writeUInt16LE(q((x - minX) / sx), o)
    buf.writeUInt16LE(q((y - minY) / sy), o + 2)
    buf.writeUInt16LE(q((z - minZ) / sz), o + 4)
    o += 6
  }
  const out = path.join(root, `public/data/houston-points-${name}.bin`)
  fs.writeFileSync(out, buf)
  const br = zlib.brotliCompressSync(buf, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } }).length
  console.log(`${name}: ${count} pts  raw ${(buf.length / 1e6).toFixed(2)} MB  brotli ${(br / 1e6).toFixed(2)} MB`)
}
