import { lazy, useEffect, useRef, useState } from 'react'
import WhenNear from '../ui/WhenNear.jsx'

const StickerPeel = lazy(() => import('../bits/StickerPeel.jsx'))

// Sponsor stickers.
// On the page: each sticker is a live StickerPeel (its corner curls on hover / press).
// Click one to peel it off: it rides the pointer on a spring (overshoot, swing, stretch with speed) and becomes
// the cursor, revealing the sponsor's card underneath. Click anywhere and it flies back into its slot.
// Keyboard: Enter/Space peels (lifts in place, card shows), Escape or Enter again puts it back. Touch: tap to toggle.

const SPRING = 220 // stiffness
const DAMP = 18 // damping

export default function SponsorStickers({ sponsors }) {
  const [held, setHeld] = useState(-1) // which sticker is off its slot
  const [follow, setFollow] = useState(false) // riding the mouse (vs lifted in place)
  const [returning, setReturning] = useState(false)
  const ghostRef = useRef(null)
  const slotRefs = useRef([])
  const sim = useRef({ x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, rot: 0, vr: 0 })

  // spring physics for the held sticker
  useEffect(() => {
    if (held < 0 || !follow) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const s = sim.current
    const baseRot = sponsors[held].rotate
    let raf = 0, last = performance.now()
    const onMove = (e) => {
      if (returning) return
      s.tx = e.clientX
      s.ty = e.clientY
    }
    const tick = (now) => {
      raf = requestAnimationFrame(tick)
      const dt = Math.min(0.033, (now - last) / 1000)
      last = now
      if (reduce) {
        s.x = s.tx
        s.y = s.ty
      } else {
        s.vx += (SPRING * (s.tx - s.x) - DAMP * s.vx) * dt
        s.vy += (SPRING * (s.ty - s.y) - DAMP * s.vy) * dt
        s.x += s.vx * dt
        s.y += s.vy * dt
        // swing: rotation chases horizontal velocity, with its own spring
        const targetRot = Math.max(-28, Math.min(28, s.vx * 0.03))
        s.vr += (160 * (targetRot - s.rot) - 14 * s.vr) * dt
        s.rot += s.vr * dt
      }
      const speed = Math.hypot(s.vx, s.vy)
      const stretch = reduce ? 1 : 1 + Math.min(0.12, speed / 9000)
      const ang = Math.atan2(s.vy, s.vx)
      const el = ghostRef.current
      if (el)
        el.style.transform =
          `translate3d(${s.x}px, ${s.y}px, 0) translate(-50%, -50%) rotate(${ang}rad) scale(${stretch}, ${2 - stretch}) rotate(${-ang}rad) ` +
          `rotate(${baseRot + s.rot}deg) scale(1.08)`
      // flying home: when it arrives, stick it back
      if (returning && Math.abs(s.x - s.tx) < 2 && Math.abs(s.y - s.ty) < 2 && speed < 40) {
        setHeld(-1)
        setFollow(false)
        setReturning(false)
      }
    }
    const putBack = () => {
      const slot = slotRefs.current[held]?.getBoundingClientRect()
      if (!slot) return setHeld(-1)
      s.tx = slot.left + slot.width / 2
      s.ty = slot.top + slot.height / 2
      setReturning(true)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    const t = setTimeout(() => window.addEventListener('click', putBack, { once: true }), 0)
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(t)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('click', putBack)
    }
  }, [held, follow, returning, sponsors])

  // the sticker is the cursor while it rides the pointer
  useEffect(() => {
    const on = held >= 0 && follow && !returning
    document.documentElement.classList.toggle('is-holding-sticker', on)
    return () => document.documentElement.classList.remove('is-holding-sticker')
  }, [held, follow, returning])

  // Escape puts it back
  useEffect(() => {
    if (held < 0) return
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      setHeld(-1)
      setFollow(false)
      setReturning(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [held])

  const peel = (i) => (e) => {
    if (held === i && !follow) {
      setHeld(-1)
      return
    }
    if (held >= 0) return
    const pointer = e.detail > 0 && window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const slot = slotRefs.current[i].getBoundingClientRect()
    // start the spring at the slot, with a little upward pop, heading for the pointer
    Object.assign(sim.current, { x: slot.left + slot.width / 2, y: slot.top + slot.height / 2, vx: 0, vy: -420, tx: e.clientX, ty: e.clientY, rot: 0, vr: 0 })
    setHeld(i)
    setFollow(pointer)
    setReturning(false)
  }

  return (
    <>
      <ul className="sponsors">
        {sponsors.map((s, i) => {
          const off = held === i
          return (
            <li key={s.src} className={`sponsor${off ? ' is-open' : ''}${off && follow ? ' is-riding' : ''}`}>
              {/* what's under the sticker */}
              <div className="sponsor__card" aria-live="polite">
                <p className="sponsor__name">
                  {s.name}
                  {s.note && <span className="label"> · {s.note}</span>}
                </p>
                {s.pitch ? <p className="sponsor__pitch">{s.pitch}</p> : <p className="sponsor__pitch is-soon">Details coming soon.</p>}
                {s.provides && (
                  <p className="sponsor__provides">
                    <span className="label">Provides</span> {s.provides}
                  </p>
                )}
              </div>

              <div ref={(el) => (slotRefs.current[i] = el)} className="sponsor__slot">
                <button
                  type="button"
                  className="sticker"
                  style={{ '--rot': `${s.rotate}deg`, width: s.width + 40, height: s.width + 40 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    peel(i)(e)
                  }}
                  aria-pressed={off}
                  aria-label={off ? `Put ${s.name} sticker back` : `Peel ${s.name} sticker`}
                >
                  <WhenNear className="sticker__peel" keep={false} fallback={<img src={s.src} alt="" style={{ width: s.width, rotate: `${s.rotate}deg` }} />}>
                    <StickerPeel imageSrc={s.src} width={s.width} rotate={s.rotate} peelDirection={-30} finish="gloss" draggable={false} followPointer intro />
                  </WhenNear>
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      {held >= 0 && follow && (
        <div ref={ghostRef} className="sticker-ghost" style={{ width: sponsors[held].width }} aria-hidden="true">
          <img src={sponsors[held].src} alt="" draggable={false} />
        </div>
      )}
    </>
  )
}
