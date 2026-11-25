import { photos } from '../../content/media.js'
import GridMotion from '../bits/GridMotion.jsx'

// 02 Student stories: a full-bleed drifting wall of HISD photos (placeholders until real photos with releases arrive).
// The copy sits on a solid-to-clear scrim, so it stays readable whatever photo drifts behind it.
const wall = [...photos, ...photos.slice().reverse()].map((p) => ({ src: p.src, alt: '' }))

export default function Stories() {
  return (
    <section id="stories" className="section stories">
      <div className="stories__wall" aria-hidden="true">
        <GridMotion items={wall} rows={4} angle={-8} gap={12} radius={8} speed={14} dim={0.25} spotlight={0.8} fade={0.25} parallax={0.4} />
      </div>
      <div className="stories__scrim" aria-hidden="true" />

      <div className="section__inner stories__inner">
        <div className="stories__copy reveal">
          <h2 className="section-title stories__title">
            Ideas built by our <em className="accent">students</em>
          </h2>
          <p className="lede">
            Every project starts with a student who noticed something. The teams, the build days and the moments in between
            will live here.
          </p>
        </div>
      </div>
    </section>
  )
}
