// Builds the point field from the HISD map data (src/content/hisd-map.json, made by scripts/build-map.mjs).
// Kinds drive color/size in the shader:
//   0 fill: halftone grid inside the district   1 road: freeways   2 edge: district boundary wall
//   3 campus dot   4 participating campus   5 beacon rising from a participating campus

import map from '../../content/hisd-map.json'

export const KIND = { FILL: 0, ROAD: 1, EDGE: 2, CAMPUS: 3, LIT: 4, BEACON: 5 }
export { map }

function rng(seed) {
  let s = seed >>> 0
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)
}

function inPolygon(x, z, poly) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j]
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside
  }
  return inside
}

function alongLine(line, spacing, emit) {
  for (let i = 0; i < line.length - 1; i++) {
    const [x0, z0] = line[i], [x1, z1] = line[i + 1]
    const len = Math.hypot(x1 - x0, z1 - z0)
    const n = Math.max(1, Math.round(len / spacing))
    for (let k = 0; k < n; k++) emit(x0 + ((x1 - x0) * k) / n, z0 + ((z1 - z0) * k) / n)
  }
}

/** @param {number} density 1 = desktop, ~0.6 = phones */
export function buildField(density = 1) {
  const r = rng(42)
  const pts = [] // [x, y, z, kind, campusIndex]
  const push = (x, y, z, kind, ci = -1) => pts.push(x, y, z, kind, ci)

  // halftone grid inside the district
  const grid = 0.34 / Math.sqrt(density)
  const xs = map.boundary.map((p) => p[0]), zs = map.boundary.map((p) => p[1])
  const [minX, maxX, minZ, maxZ] = [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)]
  for (let x = minX; x <= maxX; x += grid)
    for (let z = minZ; z <= maxZ; z += grid) if (inPolygon(x, z, map.boundary)) push(x, 0, z, KIND.FILL)

  // freeways
  for (const line of map.roads)
    alongLine(line, 0.13 / density, (x, z) => push(x + (r() - 0.5) * 0.05, 0, z + (r() - 0.5) * 0.05, KIND.ROAD))

  // district boundary: a low extruded wall, like a model on a drafting table
  alongLine([...map.boundary, map.boundary[0]], 0.05 / density, (x, z) => {
    push(x, 0, z, KIND.EDGE)
    push(x, r() * r() * 0.9, z, KIND.EDGE)
  })

  // campuses
  map.campuses.forEach((c, ci) => {
    if (c.participating) {
      for (let i = 0; i < 320; i++) {
        const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 0.55
        push(c.x + Math.cos(a) * d, 0.02, c.z + Math.sin(a) * d, KIND.LIT, ci)
      }
      for (let i = 0; i < 140; i++) {
        const a = (i / 140) * Math.PI * 2
        push(c.x + Math.cos(a) * 1.25, 0.02, c.z + Math.sin(a) * 1.25, KIND.LIT, ci)
      }
      for (let i = 0; i < 260; i++) {
        const a = r() * Math.PI * 2, d = r() * 0.18
        push(c.x + Math.cos(a) * d, r() * 7, c.z + Math.sin(a) * d, KIND.BEACON, ci)
      }
    } else {
      const n = Math.round(46 * density)
      for (let i = 0; i < n; i++) {
        const a = r() * Math.PI * 2, d = Math.abs(r() + r() - 1) * 0.32
        push(c.x + Math.cos(a) * d, 0.01, c.z + Math.sin(a) * d, KIND.CAMPUS, ci)
      }
    }
  })

  const count = pts.length / 5
  const positions = new Float32Array(count * 3)
  const kind = new Float32Array(count)
  const campus = new Float32Array(count)
  const rand = new Float32Array(count)
  // shuffle order so the assemble stagger is spatially random
  const order = Uint32Array.from({ length: count }, (_, i) => i)
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  for (let o = 0; o < count; o++) {
    const i = order[o]
    positions.set([pts[i * 5], pts[i * 5 + 1], pts[i * 5 + 2]], o * 3)
    kind[o] = pts[i * 5 + 3]
    campus[o] = pts[i * 5 + 4]
    rand[o] = r()
  }

  return {
    count,
    positions,
    kind,
    campus,
    rand,
  }
}
