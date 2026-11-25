import { useEffect, useRef } from 'react'
import { BoxGeometry, InstancedBufferAttribute, InstancedMesh, Matrix4, Mesh, PerspectiveCamera, PlaneGeometry, Scene, ShaderMaterial, WebGLRenderer } from 'three'

// Downtown Houston from a real surface scan (houston.obj -> public/data/houston-city.bin, see scripts/build-city.mjs),
// drawn as pixel art: the 3D frame renders at 1/PX resolution and is scaled up with hard pixel edges.
// The scan is grouped into separate towers with streets between them, seen from street level looking up.
// Three-tone moonlight, darker bases, outlined edges, lit roof rims; windows switch on and off over time.

const PX = 4 // CSS px per art pixel
const GROUP = 4 // merge GROUPxGROUP scan cells into one building plot (big enough to read at 4px pixel art)
const FOOTPRINT = 0.7 // building width as a share of its plot (the rest is street)
const HEIGHT_SCALE = 1.45 // gentle stretch: the scan's towers stay towers without overpowering the frame

const VERT = /* glsl */ `
  attribute float aSeed;
  varying vec3 vWorld;
  varying vec3 vLocal;
  varying vec3 vNormal;
  varying float vSeed;
  varying float vDepth;
  varying float vHeight;
  varying float vWidth;
  void main() {
    vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    vLocal = position;                       // box space: x,z in [-0.5, 0.5], y in [0, 1]
    vNormal = normal;
    vSeed = aSeed;
    vHeight = length(instanceMatrix[1].xyz); // the instance's y scale = building height
    vWidth = length(instanceMatrix[0].xyz);
    vec4 mv = viewMatrix * w;
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`

const FRAG = /* glsl */ `
  uniform float uTime, uFar;
  varying vec3 vWorld;
  varying vec3 vLocal;
  varying vec3 vNormal;
  varying float vSeed;
  varying float vDepth;
  varying float vHeight;
  varying float vWidth;

  float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }

  void main() {
    vec3 n = normalize(vNormal);
    vec3 ink = vec3(0.004, 0.055, 0.169);
    // each building gets one of three navy tints so neighbours read as separate towers
    float tint = floor(hash(vec3(vSeed, 1.0, 2.0)) * 3.0);
    vec3 base = tint < 1.0 ? vec3(0.06, 0.15, 0.29) : tint < 2.0 ? vec3(0.05, 0.13, 0.25) : vec3(0.07, 0.17, 0.31);

    // moonlight from the upper left: lit face / shadow face / deep shadow (flat bands, no gradients)
    float l = dot(n, normalize(vec3(-0.85, 0.35, -0.25)));
    vec3 col = l > 0.3 ? base * 1.45 : l > -0.2 ? base * 0.78 : base * 0.5;

    bool wall = abs(n.y) < 0.5;
    if (!wall) col = base * 1.2; // roofs

    // ambient occlusion: the lowest floors sit in the street's shadow (two hard steps)
    float y = vLocal.y * vHeight;
    if (wall && y < 2.2) col *= 0.62;
    else if (wall && y < 4.5) col *= 0.82;

    // outline every vertical edge and give roofs a lit rim, so each tower has a silhouette
    // edge distance in world units, so outlines stay ~1 art pixel whatever the building size
    float edge = (0.5 - (wall ? (abs(n.x) > 0.5 ? abs(vLocal.z) : abs(vLocal.x)) : max(abs(vLocal.x), abs(vLocal.z)))) * vWidth;
    if (wall && edge < 0.32) col = ink * 0.9;
    if (!wall && edge < 0.4) col = vec3(0.0, 0.64, 0.69) * 0.55;

    // windows: a grid per face, each window with its own slow on/off rhythm; fewer on the shadow side
    if (wall && edge > 0.55 && y > 3.0 && y < vHeight - 0.8) {
      float u = (abs(n.x) > 0.5 ? vWorld.z : vWorld.x) / 0.62;
      float v = y / 1.05;
      vec2 cell = floor(vec2(u, v));
      vec2 f = fract(vec2(u, v));
      if (f.x > 0.3 && f.x < 0.7 && f.y > 0.32 && f.y < 0.68) {
        float h = hash(vec3(cell, vSeed * 17.0));
        float period = 7.0 + h * 20.0;
        float slot = floor((uTime + h * 50.0) / period);
        float on = hash(vec3(cell + slot * 3.1, vSeed));
        float need = l > 0.3 ? 0.84 : 0.9;
        if (on > need) col = h > 0.88 ? vec3(0.82, 0.98, 1.0) : vec3(0.976, 0.816, 0.306);
        else col *= 0.7; // unlit glass is a touch darker than the wall
      }
    }

    // distance haze into the night, banded so it stays pixel-crisp
    float d = floor(clamp(vDepth / uFar, 0.0, 1.0) * 4.0) / 4.0;
    col = mix(col, ink * 1.4, d * 0.6);
    gl_FragColor = vec4(col, 1.0);
  }
`

const GROUND_VERT = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`
const GROUND_FRAG = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec3 ink = vec3(0.004, 0.055, 0.169);
    vec3 col = ink * 1.15;
    // streets: faint lamp specks on a grid
    vec2 g = floor(vWorld.xz / 2.0);
    float s = fract(sin(dot(g, vec2(12.9898, 78.233))) * 43758.5453);
    if (s > 0.985 && fract(vWorld.x / 2.0) < 0.2) col = vec3(0.976, 0.816, 0.306) * 0.55;
    gl_FragColor = vec4(col, 1.0);
  }
`

export default function PixelCity({ className = '' }) {
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
    renderer.setPixelRatio(1)
    const canvas = renderer.domElement
    canvas.setAttribute('aria-hidden', 'true')
    canvas.style.imageRendering = 'pixelated'
    host.appendChild(canvas)

    const scene = new Scene()
    const camera = new PerspectiveCamera(32, 1, 0.5, 600)
    const material = new ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms: { uTime: { value: 0 }, uFar: { value: 230 } } })
    let mesh = null
    let alive = true

    // load the height grid, group it into plots, one instanced box per building
    fetch('/data/houston-city.bin')
      .then((r) => r.arrayBuffer())
      .then((buf) => {
        if (!alive) return
        const dv = new DataView(buf)
        const N = dv.getFloat32(0, true), maxH = dv.getFloat32(4, true)
        const hts = new Uint8Array(buf, 8)
        const M = Math.floor(N / GROUP)
        const plots = []
        for (let z = 0; z < M; z++)
          for (let x = 0; x < M; x++) {
            let h = 0
            for (let dz = 0; dz < GROUP; dz++) for (let dx = 0; dx < GROUP; dx++) h = Math.max(h, hts[(z * GROUP + dz) * N + x * GROUP + dx])
            if (h > 0) plots.push([x, z, (h / 255) * maxH * HEIGHT_SCALE])
          }
        const box = new BoxGeometry(1, 1, 1)
        box.translate(0, 0.5, 0)
        mesh = new InstancedMesh(box, material, plots.length)
        const seeds = new Float32Array(plots.length)
        const m = new Matrix4()
        const half = (M * GROUP) / 2
        plots.forEach(([x, z, h], i) => {
          m.makeScale(GROUP * FOOTPRINT, h, GROUP * FOOTPRINT)
          m.setPosition(x * GROUP + GROUP / 2 - half, 0, z * GROUP + GROUP / 2 - half)
          mesh.setMatrixAt(i, m)
          seeds[i] = (x * 31 + z * 17) % 97
        })
        box.setAttribute('aSeed', new InstancedBufferAttribute(seeds, 1))
        mesh.frustumCulled = false
        scene.add(mesh)
        scene.add(new Mesh(new PlaneGeometry(N * 4, N * 4).rotateX(-Math.PI / 2), new ShaderMaterial({ vertexShader: GROUND_VERT, fragmentShader: GROUND_FRAG })))
      })

    let W = 1, H = 1
    const resize = () => {
      W = Math.max(1, Math.round(host.clientWidth / PX))
      H = Math.max(1, Math.round(host.clientHeight / PX))
      renderer.setSize(W, H, false)
      canvas.style.width = `${W * PX}px`
      canvas.style.height = `${H * PX}px`
      camera.aspect = W / H
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(host)

    let visible = true
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
    io.observe(host)

    const mouse = { x: 0, sx: 0 }
    const onMove = (e) => (mouse.x = e.clientX / window.innerWidth - 0.5)
    window.addEventListener('pointermove', onMove, { passive: true })

    let raf = 0
    const t0 = performance.now()
    const frame = (now) => {
      raf = requestAnimationFrame(frame)
      if (!visible || document.hidden || !mesh) return
      const t = (now - t0) / 1000
      mouse.sx += (mouse.x - mouse.sx) * 0.04
      // standing at street level south-west of downtown, looking up at the towers, drifting slowly
      const az = -0.62 + (reduce ? 0 : Math.sin(t * 0.05) * 0.09 + mouse.sx * 0.1)
      const aspect = W / H
      const dist = aspect > 1.4 ? 150 : 210
      camera.position.set(Math.sin(az) * dist, 2.5, Math.cos(az) * dist)
      camera.lookAt(0, 30, 0) // tilted up: the horizon sits low, the towers rise into the sky
      material.uniforms.uTime.value = reduce ? 0 : t
      renderer.render(scene, camera)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      alive = false
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      window.removeEventListener('pointermove', onMove)
      mesh?.geometry.dispose()
      material.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      canvas.remove()
    }
  }, [])

  return <div ref={hostRef} className={`pixel-city ${className}`} aria-hidden="true" />
}
