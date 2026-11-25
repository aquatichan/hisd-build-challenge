import { useEffect, useRef } from 'react'
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, OrthographicCamera, Points, Scene, ShaderMaterial, WebGLRenderer } from 'three'

// Particle trophy + medals for the prizes block. Original component for this site.
// One WebGL canvas behind the row; each form is placed over its HTML slot ([data-prize] children of the stage),
// so the layout stays in CSS. Forms assemble when first seen, turn slowly, and spin up on hover.

function rng(seed) {
  let s = seed >>> 0
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)
}

// surface of revolution from a radius profile r(y), y in [0,1]; points weighted by circumference
function lathe(out, r, profile, n, kind) {
  for (let i = 0; i < n; i++) {
    let y, rad
    do {
      y = r()
      rad = profile(y)
    } while (r() > rad / 0.62)
    const a = r() * Math.PI * 2
    out.push(Math.cos(a) * rad, y - 0.5, Math.sin(a) * rad, kind)
  }
}

function trophy(seed) {
  const r = rng(seed), p = []
  lathe(
    p,
    r,
    (y) => {
      if (y < 0.08) return 0.42
      if (y < 0.13) return 0.34
      if (y < 0.42) return 0.09 + (Math.abs(y - 0.3) < 0.03 ? 0.07 : 0)
      const t = (y - 0.42) / 0.58
      return 0.12 + 0.46 * Math.sqrt(t)
    },
    7000,
    0,
  )
  // handles: half-rings on both sides
  for (let i = 0; i < 1400; i++) {
    const side = i % 2 ? 1 : -1, a = -Math.PI / 2 + r() * Math.PI, tube = r() * Math.PI * 2
    const R = 0.17, w = 0.025
    const cx = side * (0.5 + Math.cos(a) * R), cy = 0.72 + Math.sin(a) * R
    p.push(cx + Math.cos(tube) * w * side, cy - 0.5 + Math.sin(tube) * w, Math.sin(tube) * w, 0)
  }
  return p
}

function medal(seed) {
  const r = rng(seed), p = []
  const R = 0.34, cy = -0.18, th = 0.05
  for (let i = 0; i < 5200; i++) {
    const t = r()
    if (t < 0.55) {
      // both faces
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * R
      p.push(Math.cos(a) * d, cy + Math.sin(a) * d, (r() < 0.5 ? -1 : 1) * th, 0)
    } else if (t < 0.8) {
      // rim
      const a = r() * Math.PI * 2
      p.push(Math.cos(a) * R, cy + Math.sin(a) * R, (r() - 0.5) * 2 * th, 0)
    } else {
      // raised star on the front face
      const k = Math.floor(r() * 10), s = r()
      const a0 = (k / 10) * Math.PI * 2 + Math.PI / 2, a1 = ((k + 1) / 10) * Math.PI * 2 + Math.PI / 2
      const r0 = k % 2 ? 0.09 : 0.22, r1 = k % 2 ? 0.22 : 0.09
      p.push(Math.cos(a0) * r0 * (1 - s) + Math.cos(a1) * r1 * s, cy + Math.sin(a0) * r0 * (1 - s) + Math.sin(a1) * r1 * s, th + 0.03, 2)
    }
  }
  // V-shaped ribbon from the top of the medal
  for (let i = 0; i < 2600; i++) {
    const side = i % 2 ? 1 : -1, u = r(), v = r()
    const x0 = side * 0.05, y0 = cy + R - 0.02
    const x1 = side * 0.3, y1 = 0.5
    const cx = x0 + (x1 - x0) * u, cyy = y0 + (y1 - y0) * u
    const w = 0.11
    p.push(cx + (v - 0.5) * w, cyy, -0.02 + (v - 0.5) * 0.01, Math.abs(v - 0.5) < 0.12 ? 3 : 1)
  }
  return p
}

const VERT = /* glsl */ `
  attribute float aKind, aRand;
  uniform float uScale, uIn, uTime, uPx;
  varying float vKind, vDepth, vRand, vIn;
  void main() {
    vec3 p = position;
    // assemble: drift in from a loose cloud
    vec3 loose = p * 2.6 + vec3(sin(aRand * 91.0), cos(aRand * 57.0), sin(aRand * 33.0)) * 0.6;
    float t = clamp(uIn * 1.6 - aRand * 0.6, 0.0, 1.0);
    t = t * t * (3.0 - 2.0 * t);
    p = mix(loose, p, t);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vec4 c = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    vDepth = (mv.z - c.z) / uScale;           // -0.5 (back) .. 0.5 (front)
    vKind = aKind;
    vRand = aRand;
    vIn = t;
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uPx * (aKind > 1.5 && aKind < 2.5 ? 2.4 : 1.6);
  }
`
const FRAG = /* glsl */ `
  uniform vec3 uMetal, uRibbon, uStripe;
  uniform float uTime, uHot;
  varying float vKind, vDepth, vRand, vIn;
  void main() {
    float r = length(gl_PointCoord - 0.5);
    if (r > 0.5) discard;
    float soft = 1.0 - smoothstep(0.15, 0.5, r);
    vec3 col = vKind < 0.5 ? uMetal : vKind < 1.5 ? uRibbon : vKind < 2.5 ? mix(uMetal, vec3(1.0), 0.45) : uStripe;
    float light = 0.35 + 0.65 * smoothstep(-0.45, 0.45, vDepth);   // front brighter: reads as a solid
    float twinkle = 0.85 + 0.15 * sin(uTime * 3.0 + vRand * 50.0);
    float a = soft * light * twinkle * (0.45 + 0.35 * uHot) * mix(0.3, 1.0, vIn);
    gl_FragColor = vec4(col * light, a);
  }
`

const FORMS = {
  trophy: { build: trophy, fit: 0.74, metal: '#f9d04e', ribbon: '#f9d04e', stripe: '#f9d04e' },
  silver: { build: medal, metal: '#e6eef0', ribbon: '#4975bd', stripe: '#d4d4d5' },
  bronze: { build: medal, metal: '#d96364', ribbon: '#00a3af', stripe: '#fffed0' },
}

export default function PrizeParticles({ stageRef }) {
  const hostRef = useRef(null)

  useEffect(() => {
    const host = hostRef.current
    const stage = stageRef.current
    let renderer
    try {
      renderer = new WebGLRenderer({ antialias: false, alpha: true })
    } catch {
      return
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75)
    renderer.setPixelRatio(dpr)
    renderer.domElement.setAttribute('aria-hidden', 'true')
    host.appendChild(renderer.domElement)

    const scene = new Scene()
    const camera = new OrthographicCamera(0, 1, 0, -1, -2000, 2000)
    const slots = [...stage.querySelectorAll('[data-prize]')]
    const objs = slots.map((slot, i) => {
      const f = FORMS[slot.dataset.prize] || FORMS.trophy
      const pts = f.build(11 + i * 17)
      const n = pts.length / 4
      const pos = new Float32Array(n * 3), kind = new Float32Array(n), rand = new Float32Array(n)
      const r = rng(5 + i)
      for (let k = 0; k < n; k++) {
        pos.set([pts[k * 4], pts[k * 4 + 1], pts[k * 4 + 2]], k * 3)
        kind[k] = pts[k * 4 + 3]
        rand[k] = r()
      }
      const geo = new BufferGeometry()
      geo.setAttribute('position', new BufferAttribute(pos, 3))
      geo.setAttribute('aKind', new BufferAttribute(kind, 1))
      geo.setAttribute('aRand', new BufferAttribute(rand, 1))
      const mat = new ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: {
          uScale: { value: 200 },
          uIn: { value: reduce ? 1 : 0 },
          uTime: { value: 0 },
          uPx: { value: dpr * 1.6 },
          uHot: { value: 0 },
          uMetal: { value: new Color(f.metal) },
          uRibbon: { value: new Color(f.ribbon) },
          uStripe: { value: new Color(f.stripe) },
        },
      })
      const obj = new Points(geo, mat)
      obj.frustumCulled = false
      scene.add(obj)
      const state = { obj, mat, geo, slot, fit: f.fit || 0.92, hot: 0, spin: i * 1.7, hover: false }
      slot.addEventListener('pointerenter', () => (state.hover = true))
      slot.addEventListener('pointerleave', () => (state.hover = false))
      return state
    })

    let W = 1, H = 1
    const resize = () => {
      W = host.clientWidth
      H = host.clientHeight
      renderer.setSize(W, H, false)
      renderer.domElement.style.width = '100%'
      renderer.domElement.style.height = '100%'
      camera.right = W
      camera.bottom = -H
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(host)

    let visible = false, started = reduce
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting
        if (e.intersectionRatio > 0.3) started = true
      },
      { threshold: [0, 0.3] },
    )
    io.observe(host)

    let raf = 0, last = performance.now()
    const t0 = last
    const frame = (now) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      if (!visible || document.hidden) return
      const time = (now - t0) / 1000
      const box = host.getBoundingClientRect()
      for (const o of objs) {
        const b = o.slot.getBoundingClientRect()
        const size = Math.min(b.width, b.height) * o.fit
        o.obj.position.set(b.left - box.left + b.width / 2, -(b.top - box.top + b.height * 0.46), 0)
        o.obj.scale.setScalar(size)
        o.hot += ((o.hover ? 1 : 0) - o.hot) * (1 - Math.exp(-dt * 6))
        if (!reduce) o.spin += dt * (0.45 + o.hot * 2.4)
        o.obj.rotation.set(0.12, o.spin, 0)
        const u = o.mat.uniforms
        u.uScale.value = size
        u.uTime.value = time
        u.uHot.value = o.hot
        if (started) u.uIn.value = Math.min(1, u.uIn.value + dt / 2.2)
      }
      renderer.render(scene, camera)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      objs.forEach((o) => {
        o.geo.dispose()
        o.mat.dispose()
      })
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.remove()
    }
  }, [stageRef])

  return <div ref={hostRef} className="prize-particles" aria-hidden="true" />
}
