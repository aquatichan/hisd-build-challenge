import { lazy, useRef } from 'react'
import { facts, people, rules } from '../../content/details.js'
import { sponsors } from '../../content/media.js'
import WhenNear from '../ui/WhenNear.jsx'
import Icon from '../ui/Icon.jsx'
import Skyline from '../ui/Skyline.jsx'

const StickerPeel = lazy(() => import('../bits/StickerPeel.jsx'))
const PrizeParticles = lazy(() => import('../fx/PrizeParticles.jsx'))

// Podium order on screen: 2nd, 1st, 3rd. Prize details aren't announced yet.
const PODIUM = [
  { form: 'silver', place: '2nd place', icon: 'exhibit' },
  { form: 'trophy', place: '1st place', icon: 'exhibit', top: true },
  { form: 'bronze', place: '3rd place', icon: 'exhibit' },
]

// 06 Details and people: key info, the prizes, the people, and the sponsors who make it happen.
export default function Details() {
  const stageRef = useRef(null)
  return (
    <section id="details" className="section details">
      <Skyline seed={37} peak={0.78} className="details__skyline" />
      <div className="section__inner">
        <h2 className="display details__title reveal">
          The details <span className="slash">/</span>
        </h2>
        <div className="cards">
          {facts.map((f, i) => (
            <article key={f.title} className="outline-card reveal">
              <div className="outline-card__top">
                <Icon name={f.icon} size={28} strokeWidth={1.5} />
                <span className="outline-card__n">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <h3 className="display">{f.title}</h3>
              <p>{f.text}</p>
            </article>
          ))}
        </div>
        <p className="details__rules label reveal">
          <span className="tag tag--fill">Rules · {rules.status}</span>
          {rules.note}
        </p>

        {/* prizes: particle trophy + medals on a podium */}
        <div className="prizes">
          <div className="prizes__head reveal">
            <h2 className="display details__title">
              The prizes <span className="slash">/</span>
            </h2>
          </div>
          <div ref={stageRef} className="prizes__stage">
            <WhenNear className="prizes__gl" keep={false} margin="40% 0px">
              <PrizeParticles stageRef={stageRef} />
            </WhenNear>
            {PODIUM.map((p) => (
              <div key={p.place} className={`prizes__slot${p.top ? ' is-top' : ''}`}>
                <div className="prizes__form" data-prize={p.form} />
                <div className="prizes__plinth">
                  <span className="display">{p.place}</span>
                  <span className="label">Prize TBA</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <h2 className="display details__title details__title--people reveal">
          The people behind it <span className="slash">/</span>
        </h2>
        <div className="cards cards--people">
          {people.map((g) => (
            <article key={g.group} className="outline-card outline-card--person reveal">
              <div className="outline-card__top">
                <Icon name={g.icon} size={28} strokeWidth={1.5} />
              </div>
              <h3 className="display">{g.group}</h3>
              {g.members.length ? (
                <ul>
                  {g.members.map((m) => (
                    <li key={m.name}>
                      <strong>{m.name}</strong> <span className="label">{m.role}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="outline-card__tbd">Names coming soon</p>
              )}
            </article>
          ))}
        </div>

        {/* sponsors: peelable stickers (placeholder logos) */}
        <h2 className="display details__title details__title--people reveal">
          Sponsors &amp; partners <span className="slash">/</span>
        </h2>
        <ul className="stickers" aria-label="Sponsors (placeholder logos)">
          {sponsors.map((s) => (
            <li key={s.src} className="stickers__cell">
              <WhenNear
                className="stickers__slot"
                keep={false}
                fallback={<img className="stickers__still" src={s.src} alt="" style={{ width: s.width }} />}
              >
                <StickerPeel imageSrc={s.src} width={s.width} rotate={s.rotate} peelDirection={-30} finish="gloss" draggable />
              </WhenNear>
              <span className="visually-hidden">{s.name}</span>
            </li>
          ))}
        </ul>
        <p className="label stickers__note">
          Want your logo here? <a href="#join">Get in touch</a>
        </p>
      </div>
    </section>
  )
}
