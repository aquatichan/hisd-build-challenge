// Turns assets-src/houston.obj (a 500k-vertex surface scan of downtown Houston) into a small height grid
// for the hero's pixel city: public/data/houston-city.bin
//
// Format: Float32 [N, maxHeight] header, then N*N Uint8 heights (0..255 -> 0..maxHeight), row-major (z then x).
// Usage: node scripts/build-city.mjs

import { createReadStream, mkdirSync, writeFileSync } from 'node:fs'
import { createInterface } from 'node:readline'

const SRC = new URL('../assets-src/houston.obj', import.meta.url)
const OUT = new URL('../public/data/houston-city.bin', import.meta.url)
const N = 128 // grid cells per side (the scan spans ~127 units)
const GROUND = 1.6 // anything lower is street / ground

const grid = new Float32Array(N * N).fill(-1)
let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
const verts = []

const rl = createInterface({ input: createReadStream(SRC), crlfDelay: Infinity })
for await (const line of rl) {
  if (line.charCodeAt(0) !== 118 || line.charCodeAt(1) !== 32) continue // "v "
  const [, x, y, z] = line.split(/\s+/).map(Number)
  verts.push(x, y, z)
  if (x < minX) minX = x
  if (x > maxX) maxX = x
  if (y < minY) minY = y
  if (y > maxY) maxY = y
}

// rasterize: tallest surface point per cell (a digital surface model keeps roofs)
for (let i = 0; i < verts.length; i += 3) {
  const cx = Math.min(N - 1, Math.floor(((verts[i] - minX) / (maxX - minX)) * N))
  const cz = Math.min(N - 1, Math.floor(((verts[i + 1] - minY) / (maxY - minY)) * N))
  const k = cz * N + cx
  if (verts[i + 2] > grid[k]) grid[k] = verts[i + 2]
}

// fill empty cells from their neighbours (scan holes on glass towers)
for (let pass = 0; pass < 4; pass++) {
  for (let z = 0; z < N; z++)
    for (let x = 0; x < N; x++) {
      const k = z * N + x
      if (grid[k] >= 0) continue
      let best = -1
      for (let dz = -1; dz <= 1; dz++)
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx, zz = z + dz
          if (xx >= 0 && zz >= 0 && xx < N && zz < N) best = Math.max(best, grid[zz * N + xx])
        }
      if (best >= 0) grid[k] = best
    }
}

// the scan includes terrain elevation: treat a low percentile as street level, subtract it, ground the rest
const sorted = Float32Array.from(grid).sort()
const street = sorted[Math.floor(sorted.length * 0.25)]
let maxH = 0
for (let k = 0; k < grid.length; k++) {
  grid[k] = Math.max(0, grid[k] - street)
  if (grid[k] < GROUND) grid[k] = 0
  maxH = Math.max(maxH, grid[k])
}
console.log(`street level ${street.toFixed(2)}`)

const buf = Buffer.alloc(8 + N * N)
buf.writeFloatLE(N, 0)
buf.writeFloatLE(maxH, 4)
let buildings = 0
for (let k = 0; k < grid.length; k++) {
  buf[8 + k] = Math.round((grid[k] / maxH) * 255)
  if (grid[k] > 0) buildings++
}
mkdirSync(new URL('../public/data/', import.meta.url), { recursive: true })
writeFileSync(OUT, buf)
console.log(`wrote houston-city.bin: ${N}x${N}, max height ${maxH.toFixed(1)}, ${buildings} building cells, ${buf.length} bytes`)
