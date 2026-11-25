import { lazy } from 'react'
import { event } from '../../content/event.js'
import Icon from '../ui/Icon.jsx'
import Skyline from '../ui/Skyline.jsx'
import WhenNear from '../ui/WhenNear.jsx'

const PhotonKnot = lazy(() => import('../fx/PhotonKnot.jsx'))

// 05 How it works: a clear, friendly timeline of the Build Challenge journey.
// *words* in text are highlighted in teal.
const STEPS = [
  { icon: 'ideate', title: 'Ideate', text: 'Spot a *real need* at your school or in Houston.' },
  { icon: 'build', title: 'Build', text: 'Design and create a *solution* with your team.' },
  { icon: 'share', title: 'Share', text: 'Document your *process and project* for the digital exhibition.' },
  { icon: 'exhibit', title: 'Exhibit', text: 'Showcase your work *district‑wide* in the HISD Build Challenge.', last: true },
]

const hl = (text) => text.split(/\*(.+?)\*/g).map((part, i) => (i % 2 ? <em key={i}>{part}</em> : part))

const fmt = (iso) =>
  iso ? new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Date TBA'

export default function HowItWorks() {
  return (
    <section id="how" className="section how">
      <div className="section__inner">
        <div className="how__head">
          <div className="reveal">
            <h2 className="section-title how__title">
              How it <em className="accent">works</em>
            </h2>
            <p className="lede how__sub">A simple process for big ideas.</p>
          </div>
          <WhenNear className="how__knot">
            <PhotonKnot />
          </WhenNear>
        </div>

        <ol className="journey">
          {STEPS.map((s, i) => {
            const milestone = event.timeline[i]
            return (
              <li key={s.title} className={`journey__step reveal${s.last ? ' is-last' : ''}`} style={{ '--d': `${i * 110}ms` }}>
                <span className="journey__node">
                  <Icon name={s.icon} size={40} strokeWidth={1.5} />
                </span>
                <h3 className="display journey__name">{s.title}</h3>
                <p className="journey__text">{hl(s.text)}</p>
                <span className="label journey__date">
                  {milestone.label} · {fmt(milestone.date)}
                </span>
              </li>
            )
          })}
        </ol>
      </div>
      <Skyline seed={23} peak={0.42} className="how__skyline" />
    </section>
  )
}
