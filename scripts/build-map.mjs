// Dev-time: turns public government data into the compact map the site renders.
//   node scripts/build-map.mjs
// Inputs (scripts/data, public domain):
//   nces-hisd-schools-2024-25.json       NCES EDGE Public School Locations 2024-25, LEAID 4823640 (Houston ISD)
//   tiger-hisd-boundary.geojson          US Census TIGERweb, Unified School District GEOID 4823640
//   tiger-houston-primary-roads.geojson  US Census TIGERweb, Primary Roads (2.1M scale), Houston bbox
// Output: src/content/hisd-map.json  (projected to a flat x/z plane; north = -z)

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (f) => JSON.parse(fs.readFileSync(path.join(root, 'scripts/data', f), 'utf8'))

// Schools participating so far (match on NCES name)
const PARTICIPATING = ['WESTSIDE H S', 'CARNEGIE VANGUARD H S', 'BELLAIRE H S']

// A few orientation labels (approximate district centers, for annotation only)
const LANDMARKS = [
  { label: 'Downtown', lat: 29.7604, lon: -95.3698 },
  { label: 'Medical Center', lat: 29.7066, lon: -95.397 },
  { label: 'Uptown', lat: 29.749, lon: -95.4617 },
]

const ROAD_KEEP = /Loop Fwy|Sam Houston Pkwy|State Loop 8|Katy Fwy|East Fwy|North Fwy|Gulf Fwy|Southwest Fwy|Eastex Fwy|Northwest Fwy|State Hwy 288|South Fwy|La Porte Fwy|Westpark/
const ROAD_DROP = /Hov|Acc/

const schools = read('nces-hisd-schools-2024-25.json').features.map((f) => f.attributes)
const boundary = read('tiger-hisd-boundary.geojson').features[0].geometry
const roads = read('tiger-houston-primary-roads.geojson').features

// ---- projection: equirectangular around the boundary's center, scaled to WIDTH world units ----
const ring = boundary.type === 'Polygon' ? boundary.coordinates[0] : boundary.coordinates[0][0]
const lons = ring.map((p) => p[0]), lats = ring.map((p) => p[1])
const [minLon, maxLon, minLat, maxLat] = [Math.min(...lons), Math.max(...lons), Math.min(...lats), Math.max(...lats)]
const lon0 = (minLon + maxLon) / 2, lat0 = (minLat + maxLat) / 2
const kx = Math.cos((lat0 * Math.PI) / 180)
const WIDTH = 64
const scale = WIDTH / ((maxLon - minLon) * kx)
const proj = (lon, lat) => [+((lon - lon0) * kx * scale).toFixed(3), +(-(lat - lat0) * scale).toFixed(3)]

// ---- names: NCES abbreviations -> readable ----
const SMALL = new Set(['of', 'at', 'and', 'for', 'the', 'la', 'de'])
function pretty(name) {
  let n = ` ${name} `
    .replace(/ H S /g, ' High School ')
    .replace(/ M S /g, ' Middle School ')
    .replace(/ EL /g, ' Elementary ')
    .replace(/ ES /g, ' Elementary ')
    .replace(/ ED CTR /g, ' Education Center ')
    .replace(/ CTR /g, ' Center ')
    .replace(/ ACAD /g, ' Academy ')
    .trim()
    .toLowerCase()
  n = n.replace(/[a-z][a-z'.-]*/g, (w, i) => (i > 0 && SMALL.has(w) ? w : w[0].toUpperCase() + w.slice(1)))
  return n.replace(/\bK-8\b/i, 'K-8').replace(/\bDaep\b/, 'DAEP').replace(/\bHcc\b/, 'HCC').replace(/\bJ J A E P\b/i, 'JJAEP')
}
const level = (n) =>
  /\bH S\b|HIGH|ECHS/.test(n) ? 'high'
  : /MIDDLE|\bM S\b/.test(n) ? 'middle'
  : /\bEL\b|ELEM|\bES\b|PRIMARY|ECC|EARLY CHILDHOOD/.test(n) ? 'elementary'
  : 'other'

const campuses = schools
  .map((s) => {
    const [x, z] = proj(s.LON, s.LAT)
    return {
      id: s.NCESSCH,
      name: pretty(s.NAME),
      level: level(s.NAME),
      address: `${s.STREET.replace(/\b\w+/g, (w) => w[0] + w.slice(1).toLowerCase())}, ${s.ZIP}`,
      x,
      z,
      participating: PARTICIPATING.includes(s.NAME),
    }
  })
  .sort((a, b) => Number(b.participating) - Number(a.participating) || a.name.localeCompare(b.name))

const missing = PARTICIPATING.filter((p) => !schools.some((s) => s.NAME === p))
if (missing.length) throw new Error('participating schools not found in NCES data: ' + missing.join(', '))

// ---- roads: keep major freeways, clip loosely to the district area ----
const pad = 0.12
const inBox = (lon, lat) =>
  lon > minLon - pad && lon < maxLon + pad && lat > minLat - pad && lat < maxLat + pad
const roadLines = []
for (const f of roads) {
  const name = f.properties.NAME || ''
  if (!ROAD_KEEP.test(name) || ROAD_DROP.test(name)) continue
  const lines = f.geometry.type === 'LineString' ? [f.geometry.coordinates] : f.geometry.coordinates
  for (const line of lines) {
    let cur = []
    for (const [lon, lat] of line) {
      if (inBox(lon, lat)) cur.push(proj(lon, lat))
      else if (cur.length) { if (cur.length > 1) roadLines.push(cur); cur = [] }
    }
    if (cur.length > 1) roadLines.push(cur)
  }
}

const out = {
  source: {
    schools: 'NCES EDGE Public School Locations 2024-25 (LEAID 4823640)',
    boundary: 'US Census Bureau TIGERweb, Unified School Districts (GEOID 4823640)',
    roads: 'US Census Bureau TIGERweb, Primary Roads',
  },
  width: WIDTH,
  boundary: ring.map(([lon, lat]) => proj(lon, lat)),
  roads: roadLines,
  campuses,
  landmarks: LANDMARKS.map((l) => ({ label: l.label, ...Object.fromEntries([['x', proj(l.lon, l.lat)[0]], ['z', proj(l.lon, l.lat)[1]]]) })),
  counts: {
    total: campuses.length,
    participating: campuses.filter((c) => c.participating).length,
    byLevel: campuses.reduce((m, c) => ((m[c.level] = (m[c.level] || 0) + 1), m), {}),
  },
}

const dest = path.join(root, 'src/content/hisd-map.json')
fs.writeFileSync(dest, JSON.stringify(out))
console.log(
  `campuses ${out.counts.total} (${out.counts.participating} participating) | boundary ${out.boundary.length} pts | roads ${roadLines.length} lines, ${roadLines.reduce((s, l) => s + l.length, 0)} pts | ${(fs.statSync(dest).size / 1024).toFixed(1)} KB`,
)
console.log(campuses.filter((c) => c.participating).map((c) => `${c.name} @ ${c.x},${c.z}`).join('\n'))
