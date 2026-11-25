import { useEffect, useRef } from 'react'
import { bus } from './bus.js'
import { map } from './field.js'
import Icon from '../ui/Icon.jsx'
import './map-overlay.css'

const LEVEL = { elementary: 'Elementary', middle: 'Middle school', high: 'High school', other: 'Campus' }
const lit = map.campuses.map((c, i) => ({ ...c, i })).filter((c) => c.participating)

/** Pins, landmark labels and the hover tooltip, tracking the WebGL map (positions from the shared bus). */
export default function MapOverlay() {
  const rootRef = useRef(null)
  const pinRefs = useRef([])
  const landRefs = useRef([])
  const tipRef = useRef(null)
  const tipName = useRef(null)
  const tipMeta = useRef(null)
  const tipBadge = useRef(null)

  useEffect(() => {
    let raf = 0
    let shownTip = -2
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const root = rootRef.current
      if (!root) return
      root.classList.toggle('is-ready', bus.ready)
      if (!bus.ready) return

      const width = root.clientWidth
      lit.forEach((c, k) => {
        const pin = pinRefs.current[k]
        if (!pin) return
        const x = bus.campusX[c.i]
        pin.style.transform = `translate3d(${x}px, ${bus.campusY[c.i]}px, 0)`
        // keep the centered label inside the frame near the edges
        const lab = pin.lastChild
        const w = lab.offsetWidth
        const left = x - w / 2
        const shift = left < 6 ? 6 - left : left + w > width - 6 ? width - 6 - (left + w) : 0
        lab.style.translate = `${shift}px 0`
      })
      map.landmarks.forEach((_, i) => {
        const el = landRefs.current[i]
        if (el) el.style.transform = `translate3d(${bus.landX[i]}px, ${bus.landY[i]}px, 0)`
      })

      const h = bus.listHover >= 0 ? bus.listHover : bus.hover
      const tip = tipRef.current
      if (h >= 0 && bus.campusOn[h]) {
        if (h !== shownTip) {
          const c = map.campuses[h]
          tipName.current.textContent = c.name
          tipMeta.current.textContent = `${LEVEL[c.level]} · ${c.address}`
          tipBadge.current.hidden = !c.participating
          shownTip = h
        }
        // flip to the left near the right edge
        const flip = bus.campusX[h] > root.clientWidth - 300
        tip.style.transform = `translate3d(${bus.campusX[h] + (flip ? -14 : 14)}px, ${bus.campusY[h] - 14}px, 0) translate(${flip ? '-100%' : '0'}, -100%)`
        tip.classList.add('is-on')
      } else {
        tip.classList.remove('is-on')
        shownTip = -2
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div ref={rootRef} className="map-overlay" aria-hidden="true">
      {map.landmarks.map((l, i) => (
        <span key={l.label} ref={(el) => (landRefs.current[i] = el)} className="map-overlay__land label">
          {l.label}
        </span>
      ))}

      {lit.map((c, k) => (
        <div key={c.id} ref={(el) => (pinRefs.current[k] = el)} className="map-pin">
          <Icon name="pinSolid" size={30} className="map-pin__icon" />
          <span className="map-pin__label label">{c.name.replace(' High School', ' HS')}</span>
        </div>
      ))}

      <div ref={tipRef} className="map-tip">
        <span ref={tipBadge} className="tag tag--lit" hidden>
          Participating
        </span>
        <strong ref={tipName} />
        <span ref={tipMeta} className="label" />
      </div>
    </div>
  )
}
