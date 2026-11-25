import { useEffect, useRef } from 'react'

// Pixel-art night sky over Houston: dithered navy bands, twinkling stars, drifting clouds,
// and the HISD seal as the moon. Drawn at 1/PX resolution on a 2D canvas, scaled up with hard edges.
// Redraws at a low frame rate on purpose (pixel art moves in whole pixels).

const PX = 4
const FPS = 12
// navy ramp, top -> horizon (top is the page navy, so the sky melts into the page)
const BANDS = ['#010e2b', '#03132f', '#051a3a', '#082246', '#0b2a52']
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16)

function rng(seed) {
  let s = seed >>> 0
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)
}

// a cloud bitmap: overlapping blobs, thresholded to hard pixels, lit along the top-left edge
function makeCloud(r, w, h) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')
  g.fillStyle = '#000'
  for (let i = 0; i < 6; i++) {
    const cx = w * (0.15 + r() * 0.7), cy = h * (0.45 + r() * 0.3), rr = h * (0.22 + r() * 0.25)
    g.beginPath()
    g.arc(cx, cy, rr, 0, Math.PI * 2)
    g.fill()
  }
  g.fillRect(w * 0.1, h * 0.6, w * 0.8, h * 0.3)
  const img = g.getImageData(0, 0, w, h)
  const a = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : img.data[(y * w + x) * 4 + 3])
  const out = g.createImageData(w, h)
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (a(x, y) < 128) continue
      const edge = a(x - 1, y - 1) < 128 || a(x, y - 1) < 128
      const [R, G, B] = edge ? [22, 64, 110] : [11, 36, 72]
      const i = (y * w + x) * 4
      out.data[i] = R
      out.data[i + 1] = G
      out.data[i + 2] = B
      out.data[i + 3] = 255
    }
  g.putImageData(out, 0, 0)
  return c
}

// the seal, pixelated and reduced to a 4-colour moon palette
function makeMoon(img, size) {
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  const g = c.getContext('2d', { willReadFrequently: true })
  g.imageSmoothingEnabled = true
  g.drawImage(img, 0, 0, size, size)
  const d = g.getImageData(0, 0, size, size)
  for (let i = 0; i < d.data.length; i += 4) {
    if (d.data[i + 3] < 100) {
      d.data[i + 3] = 0
      continue
    }
    const lum = (d.data[i] + d.data[i + 1] + d.data[i + 2]) / 3
    const [R, G, B] = lum > 200 ? [236, 252, 255] : lum > 150 ? [160, 232, 238] : lum > 90 ? [0, 163, 175] : [0, 96, 106]
    d.data[i] = R
    d.data[i + 1] = G
    d.data[i + 2] = B
    d.data[i + 3] = 255
  }
  g.putImageData(d, 0, 0)
  return c
}

export default function PixelSky({ className = '', moonSrc = '/brand/hisd-seal-teal-192.png' }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let W = 1, H = 1, stars = [], clouds = [], sky = null, moon = null
    const r = rng(7)

    const moonImg = new Image()
    moonImg.src = moonSrc
    moonImg.onload = () => (moon = makeMoon(moonImg, 34))

    const build = () => {
      const host = canvas.parentElement
      W = Math.max(1, Math.round(host.clientWidth / PX))
      H = Math.max(1, Math.round(host.clientHeight / PX))
      canvas.width = W
      canvas.height = H
      canvas.style.width = `${W * PX}px`
      canvas.style.height = `${H * PX}px`

      // static sky: banded + ordered dither between bands
      sky = document.createElement('canvas')
      sky.width = W
      sky.height = H
      const g = sky.getContext('2d')
      for (let y = 0; y < H; y++) {
        const t = Math.min(0.999, (y / H) * 1.15) * (BANDS.length - 1)
        const b = Math.floor(t), f = t - b
        for (let x = 0; x < W; x++) {
          const useNext = f > BAYER[(y % 4) * 4 + (x % 4)]
          g.fillStyle = BANDS[Math.min(BANDS.length - 1, b + (useNext ? 1 : 0))]
          g.fillRect(x, y, 1, 1)
        }
      }

      const rs = rng(11)
      stars = Array.from({ length: Math.round((W * H) / 260) }, () => ({
        x: Math.floor(rs() * W),
        y: Math.floor(rs() * H * 0.72),
        big: rs() < 0.08,
        tint: rs() < 0.25 ? '#8fe6ee' : rs() < 0.1 ? '#f9d04e' : '#e8f6ff',
        phase: rs() * Math.PI * 2,
        speed: 0.6 + rs() * 1.6,
      }))

      clouds = Array.from({ length: 4 }, (_, i) => {
        const w = 40 + Math.floor(r() * 40), h = 14 + Math.floor(r() * 8)
        return { img: makeCloud(r, w, h), x: r() * W, y: Math.floor(H * (0.12 + i * 0.12 + r() * 0.06)), v: 0.6 + r() * 0.8 }
      })
    }

    const draw = (t) => {
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(sky, 0, 0)
      for (const s of stars) {
        const tw = reduce ? 1 : Math.sin(t * s.speed + s.phase)
        if (tw < -0.55) continue // off this beat
        ctx.fillStyle = tw > 0.6 ? s.tint : '#5f7fa6'
        ctx.fillRect(s.x, s.y, 1, 1)
        if (s.big && tw > 0.6) {
          ctx.fillRect(s.x - 1, s.y, 3, 1)
          ctx.fillRect(s.x, s.y - 1, 1, 3)
        }
      }
      // the moon (HISD seal) with a stepped pixel halo
      if (moon) {
        // phones: the headline spans the width, so the moon sits lower, between the copy and the skyline
        const narrow = W * PX < 640
        const mx = Math.floor(W * (narrow ? 0.74 : 0.76)), my = Math.floor(H * (narrow ? 0.42 : 0.16))
        const R = moon.width / 2
        ctx.fillStyle = 'rgb(20 60 100 / 0.35)'
        for (let y = -R - 5; y <= R + 5; y++)
          for (let x = -R - 5; x <= R + 5; x++) {
            const d = Math.hypot(x, y)
            if (d > R && d < R + 5 && BAYER[(((y % 4) + 4) % 4) * 4 + (((x % 4) + 4) % 4)] < (R + 5 - d) / 6) ctx.fillRect(mx + x, my + y, 1, 1)
          }
        ctx.drawImage(moon, mx - R, my - R)
      }
      for (const c of clouds) {
        const x = Math.floor(((c.x + (reduce ? 0 : t * c.v)) % (W + c.img.width)) - c.img.width)
        ctx.drawImage(c.img, x, c.y)
      }
    }

    build()
    let raf = 0, last = 0, visible = true
    const t0 = performance.now()
    const loop = (now) => {
      raf = requestAnimationFrame(loop)
      if (!visible || document.hidden || now - last < 1000 / FPS) return
      last = now
      draw((now - t0) / 1000)
    }
    raf = requestAnimationFrame(loop)
    const ro = new ResizeObserver(() => {
      build()
      draw((performance.now() - t0) / 1000)
    })
    ro.observe(canvas.parentElement)
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
    io.observe(canvas)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      moonImg.onload = null
    }
  }, [moonSrc])

  return <canvas ref={ref} className={`pixel-sky ${className}`} aria-hidden="true" />
}
