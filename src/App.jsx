import { useEffect } from 'react'
import Header from './components/layout/Header.jsx'
import Hero from './components/sections/Hero.jsx'
import Stories from './components/sections/Stories.jsx'
import Projects from './components/sections/Projects.jsx'
import Schools from './components/sections/Schools.jsx'
import HowItWorks from './components/sections/HowItWorks.jsx'
import Judging from './components/sections/Judging.jsx'
import Details from './components/sections/Details.jsx'
import Footer from './components/sections/Footer.jsx'
import './components/sections/sections.css'
import './components/sections/polish.css'
import './components/fx/fx.css'
import './styles/system.css'

// Reveal-on-scroll. Content is visible without JS; the .js class opts into the effect.
function useReveal() {
  useEffect(() => {
    document.documentElement.classList.add('js')
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in')
            io.unobserve(e.target)
          }
        }),
      { rootMargin: '0px 0px -10% 0px' },
    )
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
}

// debug: ?debug&at=schools scrolls to a section after render (for screenshots / QA)
function useDebugJump() {
  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const at = q.has('debug') && q.get('at')
    if (at) document.getElementById(at)?.scrollIntoView()
  }, [])
}

export default function App() {
  useReveal()
  useDebugJump()

  return (
    <>
      <a className="skip-link" href="#stories">
        Skip to content
      </a>
      <div className="bp-grid" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <Header />
      <main className="page">
        <Hero />
        <Stories />
        <Projects />
        <Schools />
        <HowItWorks />
        <Judging />
        <Details />
      </main>
      <div className="page">
        <Footer />
      </div>
    </>
  )
}
