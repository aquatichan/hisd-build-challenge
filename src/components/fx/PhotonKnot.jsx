import { useEffect, useRef } from 'react'
import { AdditiveBlending, BufferAttribute, BufferGeometry, PerspectiveCamera, Points, Scene, ShaderMaterial, WebGLRenderer } from 'three'

// A (2,3) torus knot drawn as a braid of points, with photons (bright pulses) racing along it.
// Original component for this site; teal body, yellow photon heads. Pauses off-screen.

const VERT = /* glsl */ `
  attribute float aT;      // 0..1 along the knot
  attribute float aR;      // random
  uniform float uTime, uPx;
  uniform float uPh[6];
  varying float vGlow, vR;
  void main() {
    float g = 0.0;
    for (int i = 0; i < 6; i++) {
      float d = abs(aT - uPh[i]);
      d = min(d, 1.0 - d);                 // wrap around the loop
      g = max(g, exp(-d * 90.0));
    }
    vGlow = g;
    vR = aR;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uPx * (1.3 + g * 1.6) * (28.0 / -mv.z);
  }
`
const FRAG = /* glsl */ `
  uniform float uTime;
  varying float vGlow, vR;
  void main() {
    float r = length(gl_PointCoord - 0.5);
    if (r > 0.5) discard;
    float soft = 1.0 - smoothstep(0.1, 0.5, r);
    vec3 teal = vec3(0.0, 0.639, 0.686);
    vec3 ice = vec3(0.82, 0.98, 1.0);
    vec3 yellow = vec3(0.976, 0.816, 0.306);
    vec3 col = mix(teal, ice, step(0.97, vR));
    col = mix(col, yellow, vGlow);
    float a = (0.3 + 0.15 * sin(uTime * 2.0 + vR * 30.0)) + vGlow * 0.55;
    gl_FragColor = vec4(col, soft * a);
  }
`

export default function PhotonKnot({ className = '' }) {
  const hostRef = useRef(null)

  useEffect(() => {
    const host = hostRef.current
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

    // knot samples: a few strands twisted around the core curve
    const N = 9000, R = 6.4, r = 2.4
    const pos = new Float32Array(N * 3), at = new Float32Array(N), ar = new Float32Array(N)
    let seed = 7
    const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296)
    for (let i = 0; i < N; i++) {
      const t = i / N
      const u = t * Math.PI * 2
      const k = R + r * Math.cos(3 * u)
      const strand = (i % 5) / 5 * Math.PI * 2 + u * 9
      const w = 0.55 + rnd() * 0.12
      pos[i * 3] = k * Math.cos(2 * u) + Math.cos(strand) * w
      pos[i * 3 + 1] = k * Math.sin(2 * u) + Math.sin(strand) * w
      pos[i * 3 + 2] = r * 1.6 * Math.sin(3 * u) + Math.cos(strand * 1.3) * w
      at[i] = t
      ar[i] = rnd()
    }
    const geo = new BufferGeometry()
    geo.setAttribute('position', new BufferAttribute(pos, 3))
    geo.setAttribute('aT', new BufferAttribute(at, 1))
    geo.setAttribute('aR', new BufferAttribute(ar, 1))
    const mat = new ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uPx: { value: dpr * 2 }, uPh: { value: new Array(6).fill(0) } },
    })
    const knot = new Points(geo, mat)
    const scene = new Scene()
    scene.add(knot)
    const camera = new PerspectiveCamera(40, 1, 1, 200)
    camera.position.set(0, 0, 30)

    const resize = () => {
      const w = host.clientWidth, h = host.clientHeight
      renderer.setSize(w, h, false)
      renderer.domElement.style.width = '100%'
      renderer.domElement.style.height = '100%'
      camera.aspect = w / Math.max(h, 1)
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(host)

    let visible = false
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
    io.observe(host)

    const pointer = { x: 0, y: 0, sx: 0, sy: 0 }
    const onMove = (e) => {
      const b = host.getBoundingClientRect()
      pointer.x = ((e.clientX - b.left) / b.width - 0.5) * 2
      pointer.y = ((e.clientY - b.top) / b.height - 0.5) * 2
    }
    window.addEventListener('pointermove', onMove, { passive: true })

    let raf = 0
    const t0 = performance.now()
    const frame = (now) => {
      raf = requestAnimationFrame(frame)
      if (!visible || document.hidden) return
      const time = reduce ? 4 : (now - t0) / 1000
      pointer.sx += (pointer.x - pointer.sx) * 0.05
      pointer.sy += (pointer.y - pointer.sy) * 0.05
      // face-on trefoil that spins in its own plane, with a gentle tilt (never edge-on)
      knot.rotation.set(0.35 * Math.sin(time * 0.3) + pointer.sy * 0.3, 0.3 * Math.cos(time * 0.23) + pointer.sx * 0.35, time * 0.12)
      const ph = mat.uniforms.uPh.value
      for (let i = 0; i < 6; i++) ph[i] = (time * (0.07 + i * 0.006) + i / 6) % 1
      mat.uniforms.uTime.value = time
      renderer.render(scene, camera)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      window.removeEventListener('pointermove', onMove)
      geo.dispose()
      mat.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.remove()
    }
  }, [])

  return <div ref={hostRef} className={`photon-knot ${className}`} aria-hidden="true" />
}
