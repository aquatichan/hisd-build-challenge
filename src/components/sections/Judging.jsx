import { judging } from '../../content/judging.js'
import Icon from '../ui/Icon.jsx'

const fmt = (iso) => (iso ? new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : 'Deadline TBA')

// Judging: what to submit, and the rubric it's scored on (out of 100).
export default function Judging() {
  const total = judging.rubric.reduce((s, r) => s + r.points, 0)
  return (
    <section id="judging" className="section judging">
      <div className="section__inner">
        <div className="judging__head reveal">
          <h2 className="section-title">
            Four things, <em className="accent">one deadline</em>
          </h2>
          {judging.status === 'draft' && <p className="judging__draft">{judging.note}</p>}
        </div>

        {/* deliverables */}
        <ol className="deliverables">
          {judging.deliverables.map((d, i) => (
            <li key={d.title} className="deliverable reveal" style={{ '--d': `${i * 60}ms` }}>
              <span className="deliverable__n">{String(i + 1).padStart(2, '0')}</span>
              <Icon name={d.icon} size={22} strokeWidth={1.5} />
              <h3 className="deliverable__title">{d.title}</h3>
              <p>{d.text}</p>
            </li>
          ))}
        </ol>
        <p className="judging__meta">
          Due <strong>{fmt(judging.deadline)}</strong>. {judging.aiNote}
        </p>

        {/* rubric */}
        <h3 className="subsection-title judging__rubric-title reveal">
          How it&rsquo;s <em className="accent">scored</em>
          <span className="judging__total">out of {total}</span>
        </h3>
        <table className="rubric reveal">
          <thead>
            <tr>
              <th scope="col">Category</th>
              <th scope="col">Points</th>
              <th scope="col">Full marks look like</th>
            </tr>
          </thead>
          <tbody>
            {judging.rubric.map((r) => (
              <tr key={r.name}>
                <th scope="row">{r.name}</th>
                <td className="rubric__points">
                  <strong>{r.points}</strong>
                  <span className="rubric__bar" aria-hidden="true">
                    <i style={{ width: `${(r.points / 30) * 100}%` }} />
                  </span>
                </td>
                <td>{r.full}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
