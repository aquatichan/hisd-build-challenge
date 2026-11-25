import { useEffect, useRef } from 'react'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  Vector4,
  WebGLRenderer,
} from 'three'
import { buildField, map } from './field.js'
import { bus } from './bus.js'

const VERT = /* glsl */ `
  attribute float aRand;
  attribute float aKind;
  attribute float aCampus;
  uniform float uAssemble, uPixelRatio, uSize, uTime, uHover, uRepel, uRadius;
  uniform vec2 uMouse, uRes;
  varying float vKind, vA, vR, vHover, vPush, vBeam;

  void main() {
    vec3 n = vec3(sin(aRand * 91.0 + uTime), cos(aRand * 57.0 + uTime * 0.8), sin(aRand * 33.0 - uTime * 0.6));

    // beacons stream upward forever
    vec3 p = position;
    vBeam = 0.0;
    if (aKind > 4.5) {
      p.y = mod(position.y + uTime * 1.6, 7.0);
      vBeam = p.y / 7.0;
    }

    // intro: points rain down onto the map, radiating out from downtown
    float d = length(position.xz) / 38.0;
    float ta = clamp((uAssemble * 1.7 - d * 0.7 - aRand * 0.25) / 0.45, 0.0, 1.0);
    ta = ta * ta * (3.0 - 2.0 * ta);
    vec3 start = position + vec3(n.x * 6.0, 16.0 + aRand * 26.0, n.z * 6.0);
    p = mix(start, p, ta);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    // cursor repulsion (campus dots stay put so they can be hovered)
    float movable = 1.0 - step(2.5, aKind);
    vec2 sp = (gl_Position.xy / gl_Position.w * 0.5 + 0.5) * uRes;
    vec2 dv = sp - uMouse;
    float dist = length(dv);
    float f = uRepel * movable * (1.0 - smoothstep(0.0, uRadius, dist));
    vec2 dir = dv / max(dist, 1.0);
    vec2 tang = vec2(-dir.y, dir.x) * (aRand - 0.5) * 0.8;
    sp += (dir + tang) * f * uRadius * 0.38 * (0.45 + 0.9 * aRand);
    gl_Position.xy = (sp / uRes * 2.0 - 1.0) * gl_Position.w;

    float hov = 1.0 - step(0.5, abs(aCampus - uHover));
    float base = aKind < 0.5 ? 0.85 : aKind < 1.5 ? 1.0 : aKind < 2.5 ? 1.15 : aKind < 3.5 ? 1.35 : aKind < 4.5 ? 1.9 : 1.5;
    gl_PointSize = max(1.1 * uPixelRatio, base * (1.0 + hov * 1.6) * uSize * uPixelRatio * (80.0 / -mv.z));

    vKind = aKind;
    vA = mix(0.25, 1.0, ta);
    vR = aRand;
    vHover = hov;
    vPush = f * 0.6;
  }
`

const FRAG = /* glsl */ `
  uniform float uTime, uFeather, uMaskOn;
  uniform vec4 uMask;
  varying float vKind, vA, vR, vHover, vPush, vBeam;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r = length(c);
    if (r > 0.5) discard;
    float soft = 1.0 - smoothstep(0.12, 0.5, r);

    // keep points off the copy block
    float dx = max(max(uMask.x - gl_FragCoord.x, gl_FragCoord.x - uMask.z), 0.0);
    float dy = max(max(uMask.y - gl_FragCoord.y, gl_FragCoord.y - uMask.w), 0.0);
    float keep = mix(1.0, smoothstep(0.0, uFeather, length(vec2(dx, dy))), uMaskOn);
    if (keep <= 0.001) discard;

    vec3 teal = vec3(0.0, 0.639, 0.686);
    vec3 ice = vec3(0.82, 0.98, 1.0);
    vec3 yellow = vec3(0.976, 0.816, 0.306);
    float twinkle = 0.82 + 0.18 * sin(uTime * 2.2 + vR * 40.0);

    vec3 col; float a;
    if (vKind < 0.5)      { col = teal;                 a = 0.22; }
    else if (vKind < 1.5) { col = teal;                 a = 0.55; }
    else if (vKind < 2.5) { col = mix(teal, ice, 0.45); a = 0.85; }
    else if (vKind < 3.5) { col = mix(teal, ice, 0.6);  a = 0.8;  }
    else if (vKind < 4.5) { col = yellow;               a = 0.95 * (0.8 + 0.2 * sin(uTime * 3.0)); }
    else                  { col = yellow;               a = 0.75 * (1.0 - vBeam); }

    col = mix(col, ice, max(vHover, vPush));
    a *= 1.0 + vHover * 1.2 + vPush * 1.5;

    gl_FragColor = vec4(col, soft * vA * keep * a * twinkle);
  }
`

const AIM = new Vector3(0, 0, 2)
const HALF_MAP = 35 // phones: half-width (world units) the camera must fit; the district is ~64 wide

/**
 * The HISD campus map, rendered as points inside its section (section 04).
 * Positions of campuses/landmarks are published on `bus` in this element's local pixels for the HTML overlay.
 */
export default function FieldScene({ debug = false, reducedMotion = false, maskRef }) {
  const hostRef = useRef(null)
  const hudRef = useRef(null)

  useEffect(() => {
    const host = hostRef.current
    let raf = 0
    let renderer, geometry, material, ro, io, cleanupInput

    const mobile = window.matchMedia('(max-width: 767px)').matches
    const data = buildField(mobile ? 0.6 : 1)

    try {
      renderer = new WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' })
    } catch (e) {
      console.warn('WebGL unavailable, schools list still works', e)
      return
    }
    const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.75)
    renderer.setPixelRatio(dpr)
    renderer.domElement.setAttribute('aria-hidden', 'true')
    host.appendChild(renderer.domElement)

    const scene = new Scene()
    const camera = new PerspectiveCamera(36, 1, 1, 900)

    geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(data.positions, 3))
    geometry.setAttribute('aRand', new BufferAttribute(data.rand, 1))
    geometry.setAttribute('aKind', new BufferAttribute(data.kind, 1))
    geometry.setAttribute('aCampus', new BufferAttribute(data.campus, 1))
    material = new ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: {
        uAssemble: { value: reducedMotion ? 1 : 0 },
        uTime: { value: 0 },
        uPixelRatio: { value: dpr },
        uSize: { value: 1.2 },
        uMask: { value: new Vector4() },
        uMaskOn: { value: 0 },
        uFeather: { value: 56 * dpr },
        uHover: { value: -1 },
        uMouse: { value: new Vector2(-1e4, -1e4) },
        uRes: { value: new Vector2(1, 1) },
        uRepel: { value: 0 },
        uRadius: { value: 60 * dpr },
      },
    })
    const points = new Points(geometry, material)
    points.frustumCulled = false
    scene.add(points)

    let W = 1, H = 1
    const resize = () => {
      W = host.clientWidth
      H = host.clientHeight
      renderer.setSize(W, H, false)
      renderer.domElement.style.width = '100%'
      renderer.domElement.style.height = '100%'
      camera.aspect = W / H
      camera.updateProjectionMatrix()
      material.uniforms.uRes.value.set(W * dpr, H * dpr)
    }
    resize()
    ro = new ResizeObserver(resize)
    ro.observe(host)

    // only render while the section is on screen; the intro plays the first time it's really seen
    let inView = false
    let started = reducedMotion
    io = new IntersectionObserver(
      ([e]) => {
        inView = e.isIntersecting
        if (e.intersectionRatio > 0.25) started = true
      },
      { threshold: [0, 0.25] },
    )
    io.observe(host)

    // cursor (mouse/pen only), in viewport px; converted to local px per frame
    const mouse = { x: -1e4, y: -1e4, sx: -1e4, sy: -1e4, on: 0, repel: 0 }
    const onMove = (e) => {
      if (e.pointerType === 'touch') return
      if (!mouse.on) {
        mouse.sx = e.clientX
        mouse.sy = e.clientY
      }
      mouse.x = e.clientX
      mouse.y = e.clientY
      mouse.on = 1
    }
    const onLeave = () => (mouse.on = 0)
    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    cleanupInput = () => {
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
    }

    const campusWorld = map.campuses.map((c) => new Vector3(c.x, 0, c.z))
    const landWorld = map.landmarks.map((l) => new Vector3(l.x, 0, l.z))
    const tmp = new Vector3()
    const toScreen = (v, i, xs, ys, on) => {
      tmp.copy(v).project(camera)
      xs[i] = (tmp.x * 0.5 + 0.5) * W
      ys[i] = (1 - (tmp.y * 0.5 + 0.5)) * H
      if (on) on[i] = tmp.z < 1 && Math.abs(tmp.x) < 1.05 && Math.abs(tmp.y) < 1.05 ? 1 : 0
    }

    const t0 = performance.now()
    let last = t0
    let assembled = reducedMotion ? 1 : 0
    const frames = []
    const camPos = new Vector3()

    const frame = (now) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      if (document.hidden || !inView) return
      const time = (now - t0) / 1000
      const box = host.getBoundingClientRect()

      // tilted drafting-table view with a slow drift (+ a little mouse parallax); far enough to fit the district
      const narrow = W < 768
      const lx = mouse.sx - box.left
      const drift = reducedMotion ? 0 : Math.sin(time / 11) * 0.12
      const par = reducedMotion || !mouse.on ? 0 : (lx / W - 0.5) * 0.08
      const yaw = drift + par
      const el = (narrow ? 60 : 50) * (Math.PI / 180)
      const hfov = 2 * Math.atan(Math.tan((camera.fov * Math.PI) / 360) * camera.aspect)
      // desktop: the district must fit in the ~58% of the width right of the copy
      const tanH = Math.tan(hfov / 2)
      const dist = narrow ? Math.max(96, HALF_MAP / tanH) : Math.max(102, 36 / (0.58 * tanH))
      camPos.set(Math.sin(yaw) * Math.cos(el) * dist, Math.sin(el) * dist, Math.cos(yaw) * Math.cos(el) * dist + 2)
      camera.position.copy(camPos)
      camera.lookAt(AIM)

      // desktop: map sits right of the copy
      const ox = narrow ? 0 : -W * 0.19
      if (ox) camera.setViewOffset(W, H, ox, 0, W, H)
      else camera.clearViewOffset()
      camera.updateMatrixWorld()

      if (started) assembled = Math.min(1, assembled + dt / 3.4)
      bus.ready = assembled > 0.85
      campusWorld.forEach((v, i) => toScreen(v, i, bus.campusX, bus.campusY, bus.campusOn))
      landWorld.forEach((v, i) => toScreen(v, i, bus.landX, bus.landY))

      // hover picking against campus dots (local px)
      const mx = mouse.x - box.left, my = mouse.y - box.top
      let hover = -1
      if (mouse.on && bus.ready) {
        let best = 16 * 16
        for (let i = 0; i < campusWorld.length; i++) {
          if (!bus.campusOn[i]) continue
          const dx = bus.campusX[i] - mx, dy = bus.campusY[i] - my
          const d2 = dx * dx + dy * dy
          if (d2 < best) {
            best = d2
            hover = i
          }
        }
      }
      bus.hover = hover

      const u = material.uniforms
      u.uTime.value = time
      u.uAssemble.value = assembled
      u.uHover.value = bus.listHover >= 0 ? bus.listHover : hover

      const km = 1 - Math.exp(-dt * 14)
      mouse.sx += (mouse.x - mouse.sx) * km
      mouse.sy += (mouse.y - mouse.sy) * km
      const over = mouse.on && my > 0 && my < H
      mouse.repel += ((reducedMotion ? 0 : over ? 1 : 0) - mouse.repel) * (1 - Math.exp(-dt * 5))
      u.uMouse.value.set((mouse.sx - box.left) * dpr, (H - (mouse.sy - box.top)) * dpr)
      u.uRepel.value = mouse.repel

      // copy block keep-out (only where it overlaps the map)
      const m = maskRef?.current
      if (m && !narrow) {
        const r = m.getBoundingClientRect()
        const pad = 24
        u.uMask.value.set(
          (r.left - box.left - pad) * dpr,
          (H - (r.bottom - box.top) - pad) * dpr,
          (r.right - box.left + pad) * dpr,
          (H - (r.top - box.top) + pad) * dpr,
        )
        u.uMaskOn.value = 1
      } else u.uMaskOn.value = 0

      renderer.render(scene, camera)

      if (debug && hudRef.current) {
        frames.push(now)
        while (frames.length && now - frames[0] > 1000) frames.shift()
        hudRef.current.textContent = `${frames.length} fps | ${data.count} pts | dpr ${dpr}`
      }
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      ro?.disconnect()
      io?.disconnect()
      cleanupInput?.()
      geometry?.dispose()
      material?.dispose()
      renderer?.dispose()
      renderer?.forceContextLoss()
      renderer?.domElement.remove()
      bus.ready = false
    }
  }, [debug, reducedMotion, maskRef])

  return (
    <div ref={hostRef} className="point-field" aria-hidden="true">
      {debug && <div ref={hudRef} className="label point-field__hud" />}
    </div>
  )
}
