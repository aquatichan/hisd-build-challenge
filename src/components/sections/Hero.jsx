import { lazy } from 'react'
import { primaryCta } from '../../content/event.js'
import { map } from '../field/field.js'
import WhenNear from '../ui/WhenNear.jsx'
import Icon from '../ui/Icon.jsx'
import SealEmblem from '../fx/SealEmblem.jsx'

const HalftoneReveal = lazy(() => import('../bits/HalftoneReveal.jsx'))

// 01 Editorial opening. Top: headline + the HISD seal in neon.
// Below, on its own band so nothing covers it: Houston at dusk as a halftone print; the cursor develops the city.

const TICKER = [
  { text: 'Houston' },
  { text: 'Independent' },
  { text: 'School' },
  { text: 'District' },
  { text: '274 schools' },
  { text: '170K+ students', next: true },
]

export default function Hero() {
  const cta = primaryCta()
  const pct = (map.counts.participating / map.counts.total) * 100
  return (
    <section id="top" className="hero" aria-labelledby="hero-title">
      <div className="section__inner hero__inner">
        <div className="hero__copy">
          <h1 id="hero-title" className="display hero__title">
            <span>Build for</span>
            <span className="hero__houston">
              <span className="hl-yellow">Houston</span>
              {/* hand-drawn underline, draws itself in */}
              <svg className="hero__scribble" viewBox="0 0 400 30" preserveAspectRatio="none" aria-hidden="true">
                <path d="M4 20 C 70 8, 150 6, 230 12 S 360 22, 396 9" />
                <path d="M30 26 C 120 17, 240 17, 370 22" />
              </svg>
            </span>
          </h1>
          <p className="hero__tag">a student-made digital exhibition</p>
          <div className="hero__actions">
            <a className="btn" href={cta.href || '#join'}>
              {cta.label}
              <Icon name="arrowRight" />
            </a>
            <a className="btn btn--ghost" href="#schools">
              <Icon name="pin" />
              Find your school
            </a>
          </div>

          {/* goal gradient + quick facts */}
          <dl className="hero__facts">
            <div className="hero__fact hero__fact--meter">
              <dt className="label">Campuses in</dt>
              <dd>
                <strong>{map.counts.participating}</strong>
                <span>/ {map.counts.total}</span>
              </dd>
              <span className="hero__meter-bar" aria-hidden="true">
                <i style={{ width: `${Math.max(pct, 2)}%` }} />
              </span>
            </div>
            <div className="hero__fact">
              <dt className="label">Who</dt>
              <dd>HISD students</dd>
            </div>
            <div className="hero__fact">
              <dt className="label">Kickoff</dt>
              <dd className="hero__tba">TBA</dd>
            </div>
          </dl>
        </div>

        <div className="hero__seal">
          <SealEmblem />
        </div>
      </div>

      {/* ticker: the schools that are in, and the one that could be next */}
      <div className="hero__ticker" aria-hidden="true">
        <div className="hero__ticker-track">
          {[0, 1].map((k) => (
            <span key={k} className="hero__ticker-run">
              {TICKER.map((t, i) => (
                <span key={i} className={t.next ? 'is-next' : undefined}>
                  {t.text}
                  <i>✦</i>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>
      <div className="hero__city"></div>
    </section>
  )
}
