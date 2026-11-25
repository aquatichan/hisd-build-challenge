import { useEffect, useRef } from 'react'
import { map } from '../field/field.js'

// The HISD seal as a living emblem (original component for this site):
// 274 ticks around it, one per campus (participating ones lit yellow), a rotating ring of text,
// three orbiting "builders", and pulse rings expanding outward. Layers drift with the pointer.
// Pure SVG + CSS animation; still for reduced motion.

const N = map.counts.total
// participating schools are lit, spaced evenly around the ring so each one reads on its own
const LIT = new Set(Array.from({ length: map.counts.participating }, (_, k) => Math.round((k * N) / map.counts.participating + N / 12)))
const RING_TEXT = 'HOUSTON ISD ✦ BUILD CHALLENGE ✦ BUILD FOR HOUSTON ✦ '

export default function SealEmblem({ className = '' }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0, tx = 0, ty = 0, x = 0, y = 0
    const onMove = (e) => {
      const b = el.getBoundingClientRect()
      tx = (e.clientX - (b.left + b.width / 2)) / window.innerWidth
      ty = (e.clientY - (b.top + b.height / 2)) / window.innerHeight
    }
    const tick = () => {
      raf = requestAnimationFrame(tick)
      x += (tx - x) * 0.06
      y += (ty - y) * 0.06
      el.style.setProperty('--px', x.toFixed(4))
      el.style.setProperty('--py', y.toFixed(4))
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
    }
  }, [])

  // spread the lit campuses evenly-ish so they read as distinct
  const ticks = Array.from({ length: N }, (_, i) => {
    const a = (i / N) * Math.PI * 2 - Math.PI / 2
    const lit = LIT.has(i)
    const r0 = lit ? 270 : 278, r1 = lit ? 298 : 290
    return { a, lit, r0, r1 }
  })

  return (
    <div ref={ref} className={`emblem ${className}`} role="img" aria-label="Houston Independent School District seal">
      {/* each moving ring is its own layer, so the GPU just rotates it (no per-frame SVG redraw) */}
      <div className="emblem__layer" style={{ '--depth': 18 }} aria-hidden="true">
        <svg className="emblem__svg emblem__rot emblem__rot--ticks" viewBox="-310 -310 620 620">
          <g className="emblem__ticks">
            {ticks.map((t, i) => (
              <line
                key={i}
                x1={Math.cos(t.a) * t.r0}
                y1={Math.sin(t.a) * t.r0}
                x2={Math.cos(t.a) * t.r1}
                y2={Math.sin(t.a) * t.r1}
                className={t.lit ? 'is-lit' : undefined}
              />
            ))}
          </g>
        </svg>
      </div>

      <div className="emblem__layer" style={{ '--depth': 10 }} aria-hidden="true">
        <svg className="emblem__svg emblem__rot emblem__rot--text" viewBox="-310 -310 620 620">
          <defs>
            <path id="emblem-text" d="M 0,-238 a 238,238 0 1,1 0,476 a 238,238 0 1,1 0,-476" />
          </defs>
          <text className="emblem__text">
            <textPath href="#emblem-text">{RING_TEXT.repeat(2)}</textPath>
          </text>
        </svg>
        <svg className="emblem__svg emblem__rot emblem__rot--dash" viewBox="-310 -310 620 620">
          <circle className="emblem__dash" r="258" />
        </svg>
      </div>

      <div className="emblem__layer" style={{ '--depth': 6 }} aria-hidden="true">
        <svg className="emblem__svg" viewBox="-310 -310 620 620">
          <circle className="emblem__orbit-path" r="212" />
          <circle r="200" fill="url(#emblem-core)" />
          <defs>
            <radialGradient id="emblem-core">
              <stop offset="0" stopColor="#00a3af" stopOpacity="0.28" />
              <stop offset="0.7" stopColor="#00a3af" stopOpacity="0.04" />
              <stop offset="1" stopColor="#00a3af" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
        {[0, 1, 2].map((k) => (
          <svg key={k} className={`emblem__svg emblem__rot emblem__orbit--${k}`} viewBox="-310 -310 620 620">
            <circle cx="212" cy="0" r="6" className="emblem__builder" />
            <circle cx="212" cy="0" r="14" className="emblem__builder-halo" />
          </svg>
        ))}
      </div>

      {/* the official seal, crisp, breathing slightly */}
      <img className="emblem__seal emblem__layer" style={{ '--depth': 2 }} src="/brand/hisd-seal-ice.png" alt="" width="640" height="640" />
    </div>
  )
}
