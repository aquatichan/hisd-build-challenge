import { lazy, useMemo, useRef, useState } from 'react'
import { map } from '../field/field.js'
import { bus } from '../field/bus.js'
import PointField from '../field/PointField.jsx'
import MapOverlay from '../field/MapOverlay.jsx'
import { event } from '../../content/event.js'
import { schoolCards } from '../../content/media.js'
import WhenNear from '../ui/WhenNear.jsx'
import Icon from '../ui/Icon.jsx'

const HoloCard = lazy(() => import('../bits/HoloCard.jsx'))

const LEVEL_NAME = { elementary: 'Elementary', middle: 'Middle', high: 'High', other: 'Campus' }
const litSchools = map.campuses.map((c, i) => ({ ...c, i })).filter((c) => c.participating)

// 04 Your schools: participation across HISD on the live campus map (every dot is a real campus),
// then a collectible holo card for every school that's in.
export default function Schools() {
  const [q, setQ] = useState('')
  const copyRef = useRef(null)

  const results = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return []
    return map.campuses.map((c, i) => ({ ...c, i })).filter((c) => c.name.toLowerCase().includes(s))
  }, [q])

  const lit = (i) => () => (bus.listHover = i)
  const unlit = () => (bus.listHover = -1)
  const pct = (litSchools.length / map.counts.total) * 100

  return (
    <section id="schools" className="section schools">
      <div className="schools__stage">
        <div className="schools__map">
          <PointField maskRef={copyRef} />
          <MapOverlay />
        </div>

        <div className="section__inner schools__inner">
          <div ref={copyRef} className="schools__copy reveal">
            <h2 className="section-title schools__title">
              Your <em className="accent">schools</em>
            </h2>
            <p className="lede">
              A district-wide challenge bringing together students from across Houston ISD. Every dot on the map is one of
              our {map.counts.total} campuses.
            </p>

            <div className="schools__box">
              <p className="display schools__box-title">
                Participating schools: <span>{litSchools.length} so far</span>
              </p>
              <span className="schools__meter" aria-hidden="true">
                <i style={{ width: `${Math.max(pct, 2)}%` }} />
              </span>
              <p className="label schools__box-note">
                {litSchools.length} of {map.counts.total} campuses · collect them below
              </p>
            </div>

            <div className="schools__find">
              <div className="schools__search">
                <Icon name="search" size={18} />
                <label className="visually-hidden" htmlFor="school-search">
                  Find your school
                </label>
                <input
                  id="school-search"
                  type="search"
                  placeholder={`Find your school (${map.counts.total} campuses)`}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  autoComplete="off"
                />
              </div>
              {q.trim() && (
                <ul className="schools__results" aria-label="Matching schools" onMouseLeave={unlit}>
                  {results.slice(0, 8).map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        className={c.participating ? 'is-lit' : ''}
                        onMouseEnter={lit(c.i)}
                        onFocus={lit(c.i)}
                        onBlur={unlit}
                      >
                        <span>{c.name}</span>
                        <span className="label">{c.participating ? 'Participating' : LEVEL_NAME[c.level]}</span>
                      </button>
                    </li>
                  ))}
                  {results.length > 8 && <li className="label schools__more">+{results.length - 8} more, keep typing</li>}
                  {results.length === 0 && <li className="label schools__more">No school matches “{q}”</li>}
                </ul>
              )}
              <a className="schools__bring" href={event.links.bringSchool || '#join'}>
                Not on the list yet? Bring your school
                <Icon name="arrowRight" size={18} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* collectible cards: hover one to light its campus on the map */}
      <div className="section__inner schools__deck">
        <h3 className="subsection-title schools__deck-title">
          The <em className="accent">collection</em>
          <span className="label schools__deck-count">
            {litSchools.length} of {map.counts.total} collected
          </span>
        </h3>
        <ul className="schools__cards">
          {litSchools.map((c) => (
            <li key={c.id} onPointerEnter={lit(c.i)} onPointerLeave={unlit}>
              <WhenNear className="schools__card-slot" keep={false} fallback={<img className="schools__card-still" src={schoolCards[c.name]} alt="" />}>
                <HoloCard image={schoolCards[c.name]} alt={`${c.name} collectible card`} width={250} radius={16} style={{ '--hc-w': '100%' }} preset="shards" intensity={0.38} edgeSparkle={0.5} glare={0.35} foilColor="#d0f9ff" />
              </WhenNear>
              <p className="label schools__card-cap">{c.name}</p>
            </li>
          ))}
          <li className="schools__card-next">
            <a href={event.links.bringSchool || '#join'} className="schools__card-empty">
              <Icon name="school" size={34} />
              <span className="display">Your school</span>
              <span className="label">Card {litSchools.length + 1} is waiting...</span>
            </a>
          </li>
        </ul>
      </div>
    </section>
  )
}
