import { lazy } from 'react'
import news from '../../content/hisd-news.json'
import PixelSky from '../fx/PixelSky.jsx'
import WhenNear from '../ui/WhenNear.jsx'
import Icon from '../ui/Icon.jsx'

const PixelCity = lazy(() => import('../fx/PixelCity.jsx'))

// 01 Opening: a pixel-art night over Houston. The sky (stars, clouds, the HISD seal as the moon) fills the
// screen; downtown, rebuilt from a real surface scan, rises from the bottom with its windows lighting up.
// Under the tagline: the HISD endorsement, and along the street, the district's latest news
// (scraped from houstonisd.org at build time, see scripts/fetch-hisd-news.mjs).
export default function Hero() {
  const items = news.items.slice(0, 4)
  return (
    <section id="top" className="hero" aria-labelledby="hero-title">
      <PixelSky className="hero__sky" />
      <WhenNear className="hero__city" keep={false} margin="20% 0px">
        <PixelCity />
      </WhenNear>

      <div className="section__inner hero__inner">
        <h1 id="hero-title" className="hero__title">
          Build for <em className="accent accent--yellow">Houston.</em>
        </h1>
        <p className="hero__tag">a student-made digital exhibition</p>
        <a className="hero__endorse" href="https://www.houstonisd.org/" target="_blank" rel="noopener noreferrer">
          <img src="/brand/hisd-seal-teal-192.png" alt="" width="28" height="28" />
          <span>
            Endorsed by <strong>Houston ISD</strong>
          </span>
          <span className="hero__endorse-url">
            houstonisd.org <Icon name="arrowUpRight" size={14} />
          </span>
        </a>
      </div>

      {items.length > 0 && (
        <aside className="hero__news" aria-labelledby="hisd-news-title">
          <div className="section__inner hero__news-inner">
            <p id="hisd-news-title" className="hero__news-title">
              Latest from <em className="accent">HISD</em>
            </p>
            <ul className="hero__news-list">
              {items.map((n) => (
                <li key={n.id}>
                  <a className="news-card" href={n.url} target="_blank" rel="noopener noreferrer">
                    {n.image && <img src={n.image} alt={n.alt} loading="lazy" />}
                    <span className="news-card__title">{n.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      )}
    </section>
  )
}
