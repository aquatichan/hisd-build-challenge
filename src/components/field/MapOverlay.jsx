import { useEffect, useRef } from 'react'
import { bus } from './bus.js'
import { map } from './field.js'
import Icon from '../ui/Icon.jsx'
import './map-overlay.css'

const LEVEL = { elementary: 'Elementary', middle: 'Middle school', high: 'High school', other: 'Campus' }
const lit = map.campuses.map((c, i) => ({ ...c, i })).filter((c) => c.participating)

/** Pins for participating schools and the hover tooltip, tracking the WebGL map (positions from the shared bus).
 *  Names only appear on hover: no standing labels on the map. */
export default function MapOverlay() {
  const rootRef = useRef(null)
  const pinRefs = useRef([])
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

      lit.forEach((c, k) => {
        const pin = pinRefs.current[k]
        if (pin) pin.style.transform = `translate3d(${bus.campusX[c.i]}px, ${bus.campusY[c.i]}px, 0)`
      })

      const h = bus.listHover >= 0 ? bus.listHover : bus.hover
      const tip = tipRef.current
      if (h >= 0 && bus.campusOn[h]) {
        if (h !== shownTip) {
          const c = map.campuses[h]
          tipName.current.textContent = c.name
          tipMeta.current.textContent = `${LEVEL[c.level]} · ${c.address}`
          // explicit display: the .tag class sets display, which would override the hidden attribute
          tipBadge.current.style.display = c.participating ? '' : 'none'
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
      {lit.map((c, k) => (
        <div key={c.id} ref={(el) => (pinRefs.current[k] = el)} className="map-pin">
          <Icon name="pinSolid" size={30} className="map-pin__icon" />
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
