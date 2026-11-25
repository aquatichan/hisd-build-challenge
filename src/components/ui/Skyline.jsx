// A stylized, generated city skyline (not a trace of any real photo): a hazy back row for depth,
// a front row with roof lines and a few lit windows. Deterministic per seed.
// Sized by aspect ratio (see .skyline in CSS), so the tallest towers are never cropped.

function rng(seed) {
  let s = seed >>> 0
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)
}

const W = 1440
const H = 240
const MAX = H - 46 // room for spires

function row(r, peak, spread, tall, minW, maxW, windows) {
  const towers = []
  let x = -12
  while (x < W + 12) {
    const w = minW + r() * (maxW - minW)
    const core = Math.exp(-(((x - W * peak) / (W * spread)) ** 2))
    const h = Math.min(MAX, 12 + r() * 30 + core * tall * (0.5 + r() * 0.5))
    const roll = r()
    towers.push({ x, w, h, top: roll < 0.12 ? 'spire' : roll < 0.26 ? 'step' : roll < 0.34 ? 'slant' : 'flat' })
    x += w + (r() < 0.3 ? 2 + r() * 7 : 0)
  }
  towers.sort((a, b) => a.h - b.h)
  const bodies = []
  const lit = []
  for (const t of towers) {
    const x0 = t.x, x1 = t.x + t.w, y = H - t.h
    if (t.top === 'spire') {
      const c = x0 + t.w / 2
      bodies.push(`M${x0},${H}V${y}H${c - 2}V${y - 16}L${c},${y - 34}L${c + 2},${y - 16}V${y}H${x1}V${H}Z`)
    } else if (t.top === 'step') {
      const s = t.w * 0.22
      bodies.push(`M${x0},${H}V${y + 12}H${x0 + s}V${y}H${x1 - s}V${y + 12}H${x1}V${H}Z`)
    } else if (t.top === 'slant') bodies.push(`M${x0},${H}V${y + 14}L${x1},${y}V${H}Z`)
    else bodies.push(`M${x0},${H}V${y}H${x1}V${H}Z`)
    if (windows)
      for (let wy = y + 18; wy < H - 8; wy += 10)
        for (let wx = x0 + 5; wx < x1 - 6; wx += 8) if (r() < 0.06) lit.push(`M${wx.toFixed(1)},${wy}h2.5v4h-2.5z`)
  }
  return { bodies, lit: lit.join('') }
}

const cache = new Map()
function build(seed, peak) {
  const r = rng(seed)
  return {
    back: row(r, Math.min(0.9, peak + 0.08), 0.24, 150, 30, 70, false),
    front: row(r, peak, 0.15, 170, 18, 46, true),
  }
}

export default function Skyline({ seed = 7, peak = 0.6, className = '' }) {
  const key = `${seed}:${peak}`
  if (!cache.has(key)) cache.set(key, build(seed, peak))
  const { back, front } = cache.get(key)
  const gid = `sky-${seed}`
  return (
    <svg className={`skyline ${className}`} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b2b54" />
          <stop offset="1" stopColor="#010e2b" />
        </linearGradient>
      </defs>
      <g fill="#0a2246" opacity="0.7">
        {back.bodies.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <g fill={`url(#${gid})`} stroke="rgb(0 163 175 / 0.45)" strokeWidth="1">
        {front.bodies.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <path d={front.lit} fill="#f9d04e" opacity="0.8" />
      <rect x="0" y={H - 1.5} width={W} height="1.5" fill="#00a3af" opacity="0.6" />
    </svg>
  )
}
