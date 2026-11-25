import { lazy, useEffect, useRef, useState } from 'react'
import { event, primaryCta } from '../../content/event.js'
import { NAV } from '../../content/nav.js'
import WhenNear from '../ui/WhenNear.jsx'
import Icon from '../ui/Icon.jsx'

const TearTicket = lazy(() => import('../bits/TearTicket.jsx'))
const Lanyard = lazy(() => import('../bits/Lanyard.jsx'))

// The builder pass lives on a full-width layer that is part of the page (it scrolls natively, no lag):
// it starts well above the join section and runs to the bottom of the footer, so the badge can be dragged
// across that whole area. The layer ignores the pointer except over the card.
const CARD_PX = 320 // badge height on screen

function BadgeLayer({ anchorRef }) {
  const ref = useRef(null)
  const [h, setH] = useState(0)
  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setH(e.contentRect.height))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return (
    <div ref={ref} className="badge-layer" aria-hidden="true">
      <WhenNear className="badge-layer__gl" keep={false} margin="20% 0px">
        {h > 0 && (
          <Lanyard
            fullscreen
            anchorRef={anchorRef}
            frontImage="/placeholders/badge-front.jpg"
            backImage="/placeholders/badge-back.jpg"
            strapImage="/placeholders/strap.png"
            strapColor="#00a3af"
            metal="silver"
            finish="matte"
            size={Math.min(0.9, CARD_PX / h)}
            strapLength={0}
            breeze={0.35}
          />
        )}
      </WhenNear>
    </div>
  )
}

// The end of the page is its last impression (peak-end): tear the ticket to get updates.
function Ticket({ cta, onTear }) {
  return (
    <TearTicket
      width={520}
      height={230}
      stubSize={150}
      radius={14}
      background="#06244a"
      stubBackground="#f9d04e"
      color="#ffffff"
      borderColor="rgb(0 163 175 / 0.6)"
      rotate={-3}
      onTear={onTear}
      ariaLabel={`Tear off the stub: ${cta.label}`}
      stub={
        <div className="ticket__stub">
          <Icon name="scissors" size={22} />
          <span className="display">{cta.label}</span>
          <span className="label">Tear here</span>
        </div>
      }
    >
      <div className="ticket__body">
        <span className="label ticket__admit">Admit one builder</span>
        <span className="display ticket__name">
          Houston ISD
          <br />
          <span className="hl-teal">Build Challenge</span>
        </span>
        <span className="label ticket__meta">Kickoff TBA · All HISD campuses</span>
      </div>
    </TearTicket>
  )
}

export default function Footer() {
  const cta = primaryCta()
  const [torn, setTorn] = useState(false)
  const anchorRef = useRef(null)
  const onTear = () => {
    setTorn(true)
    if (cta.href) window.open(cta.href, '_blank', 'noopener')
  }
  return (
    <>
    <footer id="footer" className="site-footer">
      <div id="join" className="section__inner join">
        <div className="join__copy">
          <p className="spaced join__eyebrow">Get in on it</p>
          <p className="display join__title">
            Bring an idea. Find your team. <span className="hl-yellow">Build for Houston.</span>
          </p>
          <p className="lede">
            Tear the stub to get updates: kickoff dates, the official rules and how to register.
          </p>
          <p className="label join__status" aria-live="polite">
            {torn
              ? cta.href
                ? 'Opened the form in a new tab.'
                : 'Torn! The sign-up form isn’t open yet, so check back here soon.'
              : cta.href
                ? ''
                : 'Sign-up link coming soon'}
          </p>
          <WhenNear className="join__ticket" fallback={<div className="join__ticket-ph" />}>
            <Ticket cta={cta} onTear={onTear} />
          </WhenNear>
        </div>

        {/* a sample builder pass on a lanyard: the strap is pinned here (the anchor); the badge itself is drawn by
            BadgeLayer below, so it can be dragged well beyond this column and swings back when let go. */}
        <figure className="join__badge">
          <span ref={anchorRef} className="join__anchor" aria-hidden="true" />
        </figure>
      </div>

      <div className="section__inner site-footer__grid">
        <div className="site-footer__brand">
          <img
            className="site-footer__seal"
            src="/brand/hisd-seal-teal-192.png"
            alt="Houston Independent School District seal"
            width="192"
            height="192"
            loading="lazy"
          />
          <div>
            <img
              src="/brand/hisd-wordmark-white.png"
              alt="Houston ISD"
              width="1080"
              height="270"
              loading="lazy"
              className="site-footer__wordmark"
            />
            <img
              src="/brand/build-challenge-wordmark.png"
              alt="Build Challenge"
              width="1488"
              height="240"
              loading="lazy"
              className="site-footer__bc"
            />
          </div>
        </div>
        <nav aria-label="Footer">
          <p className="label site-footer__h">Explore</p>
          <ul>
            {NAV.map((n) => (
              <li key={n.id}>
                <a href={`#${n.id}`}>{n.label}</a>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <p className="label site-footer__h">Contact</p>
          {event.links.contactEmail ? (
            <a href={`mailto:${event.links.contactEmail}`}>{event.links.contactEmail}</a>
          ) : (
            <p className="site-footer__muted">Contact details coming soon.</p>
          )}
        </div>
      </div>
    </footer>
    <BadgeLayer anchorRef={anchorRef} />
    </>
  )
}
