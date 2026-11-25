import { useEffect, useState } from 'react'

// Liquid glass: real refraction for an element's backdrop.
// A displacement map is generated on a canvas at the element's exact size (edges bend the backdrop inward,
// like light through a thick curved pane), then used by an invisible SVG filter that the element references
// via `backdrop-filter: url(#id)`. Only Chromium renders SVG filters in backdrop-filter; everywhere else the
// CSS falls back to frosted glass (html.lg-on is only set on Chromium).

const BEVEL = 18 // px of curved edge
const STRENGTH = 26 // max displacement in px

function makeMap(w, h) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')
  const img = g.createImageData(w, h)
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      // distance to each edge; the nearest edge decides the bend direction (inward)
      const dl = x, dr = w - 1 - x, dt = y, db = h - 1 - y
      let dx = 0, dy = 0
      const bend = (d) => {
        const t = Math.max(0, 1 - d / BEVEL)
        return t * t
      }
      dx += bend(dl) - bend(dr)
      dy += bend(dt) - bend(db)
      const i = (y * w + x) * 4
      img.data[i] = 128 + Math.round(dx * 127)
      img.data[i + 1] = 128 + Math.round(dy * 127)
      img.data[i + 2] = 128
      img.data[i + 3] = 255
    }
  g.putImageData(img, 0, 0)
  return c.toDataURL()
}

const isChromium = () => !!navigator.userAgentData?.brands?.some((b) => /Chromium/i.test(b.brand))

/** Renders the hidden filter for `targetRef` and keeps its map in sync with the element's size. */
export default function LiquidGlass({ id, targetRef }) {
  const [map, setMap] = useState({ href: '', w: 0, h: 0 })

  useEffect(() => {
    if (!isChromium()) return
    document.documentElement.classList.add('lg-on')
    const el = targetRef.current
    let last = ''
    const ro = new ResizeObserver(() => {
      const w = Math.round(el.offsetWidth), h = Math.round(el.offsetHeight)
      const key = `${w}x${h}`
      if (!w || !h || key === last) return
      last = key
      setMap({ href: makeMap(w, h), w, h })
    })
    ro.observe(el)
    return () => {
      ro.disconnect()
      document.documentElement.classList.remove('lg-on')
    }
  }, [targetRef])

  if (!map.href) return null
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <filter id={id} x="0" y="0" width={map.w} height={map.h} filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feImage href={map.href} x="0" y="0" width={map.w} height={map.h} result="map" preserveAspectRatio="none" />
        <feDisplacementMap in="SourceGraphic" in2="map" scale={STRENGTH} xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  )
}
