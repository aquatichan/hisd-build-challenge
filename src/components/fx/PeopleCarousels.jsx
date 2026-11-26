import { lazy, useState } from 'react'
import { people } from '../../content/details.js'
import WhenNear from '../ui/WhenNear.jsx'

const CircularCarousel = lazy(() => import('../bits/CircularCarousel.jsx'))

// Three people groups, three columns, three circular carousels. Only the group in focus spins; the other two
// hold still and dim. Focus follows hover, keyboard focus or a click, and stays where you last left it, so one
// carousel is always turning.

const itemsFor = (g) =>
  g.members.length
    ? g.members.map((m) => ({ src: m.photo || `/placeholders/people-${g.slug}-1.jpg`, alt: m.name, title: m.name, subtitle: m.role }))
    : Array.from({ length: 5 }, (_, i) => ({ src: `/placeholders/people-${g.slug}-${i + 1}.jpg`, alt: `${g.group} placeholder ${i + 1}` }))

export default function PeopleCarousels() {
  const [focus, setFocus] = useState(0)
  return (
    <div className="people">
      {people.map((g, k) => {
        const on = focus === k
        return (
          <section
            key={g.group}
            className={`people__col${on ? ' is-focus' : ''}`}
            aria-label={g.group}
            onPointerEnter={() => setFocus(k)}
            onFocus={() => setFocus(k)}
            onClick={() => setFocus(k)}
          >
            <h3 className="people__name">{g.group}</h3>
            <WhenNear className="people__stage" keep={false} margin="30% 0px" fallback={<img className="people__still" src={itemsFor(g)[0].src} alt="" />}>
              <CircularCarousel
                items={itemsFor(g)}
                preset="cylinder"
                cardWidth={190}
                aspectRatio={0.8}
                gap={14}
                cornerRadius={2}
                autoplay={on ? 'drift' : 'off'}
                speed={16}
                depthFade={0.6}
                fadeColor="#010e2b"
                captions={g.members.length > 0}
                pauseOnHover={false}
                focusOnClick={false}
              />
            </WhenNear>
            <p className="people__note">{g.members.length ? `${g.members.length} ${g.members.length === 1 ? 'person' : 'people'}` : 'Names coming soon'}</p>
          </section>
        )
      })}
    </div>
  )
}
