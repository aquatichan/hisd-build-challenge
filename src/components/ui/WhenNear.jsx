import { Component, Suspense, useEffect, useRef, useState } from 'react'

// Error boundary so a failed effect (no WebGL, chunk load error) degrades to the fallback, not a blank page.
class Boundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error) {
    console.warn('effect unavailable:', error)
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

/**
 * Mounts heavy, lazily-imported children only when their slot comes near the viewport.
 * The slot keeps its size (via className/style) so nothing jumps when the effect arrives.
 * keep={false} also unmounts them again once they're far away, which caps how many WebGL
 * canvases are alive at once (browsers drop the oldest past ~16, phones sooner).
 */
export default function WhenNear({ children, fallback = null, className = '', style, margin = '60% 0px', keep = true, ...rest }) {
  const ref = useRef(null)
  const [near, setNear] = useState(false)
  const [gen, setGen] = useState(0)

  // if the browser drops one of our WebGL contexts, remount the effect instead of leaving a dead canvas
  // (webglcontextlost doesn't bubble, so listen in the capture phase)
  useEffect(() => {
    const el = ref.current
    let t = 0
    const onLost = (e) => {
      e.preventDefault()
      clearTimeout(t)
      t = setTimeout(() => setGen((g) => g + 1), 250)
    }
    el.addEventListener('webglcontextlost', onLost, true)
    return () => {
      clearTimeout(t)
      el.removeEventListener('webglcontextlost', onLost, true)
    }
  }, [])

  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => {
        if (keep) {
          if (e.isIntersecting) {
            setNear(true)
            io.disconnect()
          }
        } else setNear(e.isIntersecting)
      },
      { rootMargin: margin },
    )
    io.observe(ref.current)
    return () => io.disconnect()
  }, [margin, keep])

  return (
    <div ref={ref} className={className} style={style} {...rest}>
      {near ? (
        <Boundary key={gen} fallback={fallback}>
          <Suspense fallback={fallback}>{children}</Suspense>
        </Boundary>
      ) : (
        fallback
      )}
    </div>
  )
}
