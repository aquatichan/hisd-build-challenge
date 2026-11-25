import { useEffect, useRef, useState } from 'react'
import { primaryCta } from '../../content/event.js'
import { NAV } from '../../content/nav.js'
import Icon from '../ui/Icon.jsx'
import './header.css'

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState('')
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)
  const toggleRef = useRef(null)
  const cta = primaryCta()

  // glass gets denser once you leave the top; scroll-spy picks the section under the header
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24)
      const probe = window.innerHeight * 0.35
      let current = ''
      for (const n of NAV) {
        const el = document.getElementById(n.id)
        if (el && el.getBoundingClientRect().top <= probe) current = n.id
      }
      setActive(current)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // mobile menu: Esc closes, focus stays inside, body doesn't scroll
  useEffect(() => {
    if (!open) return
    const menu = menuRef.current
    const toggle = toggleRef.current
    const focusables = () => [toggle, ...menu.querySelectorAll('a')]
    focusables()[1]?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
      if (e.key === 'Tab') {
        const f = focusables()
        const i = f.indexOf(document.activeElement)
        if (e.shiftKey && i <= 0) {
          e.preventDefault()
          f[f.length - 1].focus()
        } else if (!e.shiftKey && i === f.length - 1) {
          e.preventDefault()
          f[0].focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.documentElement.style.overflow = ''
      toggle?.focus()
    }
  }, [open])

  return (
    <header className={`site-header${scrolled ? ' is-scrolled' : ''}${open ? ' is-open' : ''}`}>
      <div className="site-header__bar glass">
        <a className="site-header__brand" href="#top" aria-label="Houston ISD Build Challenge, back to top">
          <img className="site-header__seal" src="/brand/hisd-seal-teal-192.png" alt="" width="192" height="192" />
          <img className="site-header__wm" src="/brand/build-challenge-wordmark.png" alt="" width="1488" height="240" />
        </a>

        <nav className="site-header__nav" aria-label="Sections">
          {NAV.map((n) => (
            <a key={n.id} href={`#${n.id}`} aria-current={active === n.id ? 'true' : undefined}>
              {n.label}
            </a>
          ))}
        </nav>

        <a className="site-header__cta" href={cta.href || '#join'}>
          {cta.label}
        </a>

        <button
          ref={toggleRef}
          type="button"
          className="site-header__toggle"
          aria-expanded={open}
          aria-controls="site-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((o) => !o)}
        >
          <Icon name={open ? 'close' : 'menu'} />
        </button>
      </div>

      <div id="site-menu" ref={menuRef} className="site-menu glass" hidden={!open}>
        <nav aria-label="Sections">
          {NAV.map((n, i) => (
            <a key={n.id} href={`#${n.id}`} onClick={() => setOpen(false)}>
              <span className="label">{String(i + 1).padStart(2, '0')}</span>
              {n.label}
            </a>
          ))}
        </nav>
        <a className="btn" href={cta.href || '#join'} onClick={() => setOpen(false)}>
          {cta.label}
          <Icon name="arrowRight" />
        </a>
      </div>
    </header>
  )
}
