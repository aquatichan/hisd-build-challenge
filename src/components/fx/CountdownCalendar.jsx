import { useEffect, useMemo, useRef, useState } from 'react'
import { event } from '../../content/event.js'
import Icon from '../ui/Icon.jsx'

// Countdown calendar for the closing section.
// Top: a live countdown to the next milestone in event.timeline (kickoff, build, submit, showcase).
// Below: a month calendar with a holographic header; every day is hoverable/focusable and shows what's on it.
// Dates come from src/content/event.js (ISO 'YYYY-MM-DD'); while they're null the countdown reads "Date TBA".

const DAY = 86400000
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const at = (iso) => new Date(iso + 'T09:00:00') // milestones count down to 9 AM local
const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
const pad = (n) => String(n).padStart(2, '0')
const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

function relative(d, now) {
  const n = Math.round((startOf(d) - startOf(now)) / DAY)
  if (n === 0) return 'Today'
  if (n === 1) return 'Tomorrow'
  if (n === -1) return 'Yesterday'
  return n > 0 ? `In ${n} days` : `${-n} days ago`
}

export default function CountdownCalendar() {
  const [now, setNow] = useState(() => new Date())
  const dated = useMemo(() => event.timeline.filter((m) => m.date).map((m) => ({ ...m, when: at(m.date) })), [])
  const next = dated.find((m) => m.when > now)
  const [month, setMonth] = useState(() => {
    const d = next ? next.when : new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [hover, setHover] = useState(null) // Date under the pointer / focus
  const [spot, setSpot] = useState(null) // milestone id highlighted from the list
  const holoRef = useRef(null)

  // tick once a second only while a countdown is running
  useEffect(() => {
    if (!next) return
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [next])

  // holo header: foil angle follows the pointer across it
  const onHolo = (e) => {
    const b = holoRef.current.getBoundingClientRect()
    holoRef.current.style.setProperty('--hx', ((e.clientX - b.left) / b.width).toFixed(3))
    holoRef.current.style.setProperty('--hy', ((e.clientY - b.top) / b.height).toFixed(3))
  }

  const left = next ? Math.max(0, next.when - now) : 0
  const parts = [
    ['days', Math.floor(left / DAY)],
    ['hours', Math.floor((left % DAY) / 3600000)],
    ['min', Math.floor((left % 3600000) / 60000)],
    ['sec', Math.floor((left % 60000) / 1000)],
  ]

  const first = month.getDay()
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))]
  const label = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const go = (d) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + d, 1))
  const jump = (m) => {
    setMonth(new Date(m.when.getFullYear(), m.when.getMonth(), 1))
    setSpot(m.id)
  }

  const hoverMark = hover && dated.find((x) => sameDay(x.when, hover))

  return (
    <div className="cal">
      <div className="cal__count">
        <p className="cal__eyebrow">{next ? `Until ${next.label.toLowerCase()}` : 'Counting down to kickoff'}</p>
        {next ? (
          <div className="cal__digits" role="timer" aria-live="off">
            {parts.map(([unit, v]) => (
              <span key={unit} className="cal__unit">
                <strong>{unit === 'days' ? v : pad(v)}</strong>
                <span>{unit}</span>
              </span>
            ))}
          </div>
        ) : (
          <p className="cal__tba">
            Date <em className="accent accent--yellow">TBA</em>
          </p>
        )}
      </div>

      <div className="cal__month">
        <div ref={holoRef} className="cal__holo" onPointerMove={onHolo}>
          <button type="button" className="cal__nav" onClick={() => go(-1)} aria-label="Previous month">
            <Icon name="arrowLeft" size={16} />
          </button>
          <p className="cal__label" aria-live="polite">
            {label}
          </p>
          <button type="button" className="cal__nav" onClick={() => go(1)} aria-label="Next month">
            <Icon name="arrowRight" size={16} />
          </button>
        </div>

        <div className="cal__body">
          <div className="cal__grid" role="grid" aria-label={label} onPointerLeave={() => setHover(null)}>
            {WEEKDAYS.map((w) => (
              <span key={w} className="cal__wd" aria-hidden="true">
                {w[0]}
              </span>
            ))}
            {cells.map((d, i) => {
              if (!d) return <span key={`b${i}`} aria-hidden="true" />
              const m = dated.find((x) => sameDay(x.when, d))
              const today = sameDay(d, now)
              const past = startOf(d) < startOf(now)
              const cls = ['cal__day', today && 'is-today', m && 'is-mark', past && 'is-past', m && next && m.id === next.id && 'is-next', m && spot === m.id && 'is-spot']
                .filter(Boolean)
                .join(' ')
              return (
                <button
                  key={i}
                  type="button"
                  role="gridcell"
                  className={cls}
                  onPointerEnter={() => setHover(d)}
                  onFocus={() => setHover(d)}
                  onBlur={() => setHover(null)}
                  aria-label={`${d.toDateString()}${m ? `, ${m.label}` : ''}${today ? ', today' : ''}`}
                >
                  <span className="cal__num">{d.getDate()}</span>
                  {m && <span className="cal__dot" aria-hidden="true" />}
                </button>
              )
            })}
          </div>

          {/* what the hovered day holds */}
          <div className={`cal__peek${hover ? ' is-on' : ''}`} aria-live="polite">
            {hover && (
              <>
                <p className="cal__peek-date">{hover.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                <p className="cal__peek-what">
                  {hoverMark ? <strong>{hoverMark.label}</strong> : <span>No events</span>}
                  <span className="cal__peek-rel">{relative(hover, now)}</span>
                </p>
              </>
            )}
            {!hover && <p className="cal__peek-hint">Hover a day to see what&rsquo;s on it.</p>}
          </div>
        </div>

        <ul className="cal__legend">
          {event.timeline.map((m) => {
            const d = dated.find((x) => x.id === m.id)
            return (
              <li key={m.id}>
                <button
                  type="button"
                  className={`cal__event${next && next.id === m.id ? ' is-next' : ''}`}
                  disabled={!d}
                  onPointerEnter={() => d && setSpot(m.id)}
                  onPointerLeave={() => setSpot(null)}
                  onClick={() => d && jump(d)}
                >
                  <span className="cal__event-name">{m.label}</span>
                  <span className="cal__event-date">{d ? d.when.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBA'}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
