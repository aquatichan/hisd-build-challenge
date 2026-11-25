import { Component, lazy, Suspense, useEffect, useRef, useState } from 'react'

// Retry once: a stale dev-server/HMR module URL or a flaky network shouldn't kill the page.
const FieldScene = lazy(() =>
  import('./FieldScene.jsx').catch(() => new Promise((r) => setTimeout(r, 400)).then(() => import('./FieldScene.jsx'))),
)

// If the 3D chunk or WebGL fails, the section still works (copy + school search), just without the map.
class SceneBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error) {
    console.warn('school map unavailable:', error)
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

const DEBUG = new URLSearchParams(window.location.search).has('debug')

/** Loads the WebGL map only when its section gets near the viewport (keeps the opening light). */
export default function PointField({ maskRef }) {
  const ref = useRef(null)
  const [mount, setMount] = useState(false)
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setMount(true)
          io.disconnect()
        }
      },
      { rootMargin: '120% 0px' },
    )
    io.observe(ref.current)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={ref} className="point-field-slot">
      {mount && (
        <SceneBoundary>
          <Suspense fallback={null}>
            <FieldScene debug={DEBUG} reducedMotion={reducedMotion} maskRef={maskRef} />
          </Suspense>
        </SceneBoundary>
      )}
    </div>
  )
}
