import { lazy, useRef } from 'react'
import { facts, rules } from '../../content/details.js'
import { sponsors } from '../../content/media.js'
import WhenNear from '../ui/WhenNear.jsx'
import SponsorStickers from '../fx/SponsorStickers.jsx'
import PeopleCarousels from '../fx/PeopleCarousels.jsx'
import Icon from '../ui/Icon.jsx'

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
      <div className="section__inner">
        <h2 className="section-title details__title reveal">
          The <em className="accent">details</em>
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
            <h2 className="section-title details__title">
              The <em className="accent">prizes</em>
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

        <h2 className="section-title details__title details__title--people reveal">
          The people <em className="accent">behind it</em>
        </h2>
        <PeopleCarousels />

        {/* sponsors: click a sticker to peel it and see who they are */}
        <h2 className="section-title details__title details__title--people reveal">
          Sponsors &amp; <em className="accent">partners</em>
        </h2>
        <SponsorStickers sponsors={sponsors} />
        <p className="sponsors__note">
          Click a sticker to peel it. Want your logo here? <a href="#join">Get in touch</a>
        </p>
      </div>
    </section>
  )
}
