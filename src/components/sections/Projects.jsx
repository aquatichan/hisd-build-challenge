import { useState } from 'react'
import { ideas } from '../../content/ideas.js'
import { code } from '../../content/code.js'
import CodeMorph from '../fx/CodeMorph.jsx'
import Icon from '../ui/Icon.jsx'

// 03 Project in focus: a detailed look at one idea at a time, with simple navigation.
// Every entry is a clearly labeled example idea until real submissions exist.
// The code window shows how the same idea could be built in different languages.
// Layout is a mirrored L: title top-left, mockup image top-right, code window + description along the bottom.

function Mockup({ idea }) {
  if (idea.mockup) return <img src={idea.mockup} alt={`Mockup of ${idea.title}`} loading="lazy" />
  return (
    <div className="focus__mock-ph">
      <Icon name="spark" size={26} />
      <span className="display">{idea.title}</span>
      <span className="label">Mockup coming soon</span>
    </div>
  )
}

export default function Projects() {
  const [i, setI] = useState(0)
  const idea = ideas[i]
  const go = (d) => setI((v) => (v + d + ideas.length) % ideas.length)

  return (
    <section id="projects" className="section projects">
      <div className="section__inner">
        <div className="focus reveal" role="group" aria-roledescription="carousel" aria-label="Example project ideas">
          <article className="focus__card">
            <div className="focus__head">
              <h2 className="section-title focus__title">
                Project in <em className="accent">focus</em>
              </h2>
              <p className="focus__aside">One idea at a time: what it looks like, how it could be built, and why it matters.</p>
              <div className="focus__nav">
                <button type="button" className="focus__arrow" onClick={() => go(-1)} aria-label="Previous idea">
                  <Icon name="arrowLeft" size={18} />
                </button>
                <span className="focus__count label">
                  <strong>{String(i + 1).padStart(2, '0')}</strong> / {String(ideas.length).padStart(2, '0')}
                </span>
                <div className="focus__dots" role="tablist" aria-label="Choose an idea">
                  {ideas.map((d, k) => (
                    <button key={d.title} type="button" role="tab" aria-selected={k === i} aria-label={d.title} onClick={() => setI(k)} />
                  ))}
                </div>
                <button type="button" className="focus__arrow" onClick={() => go(1)} aria-label="Next idea">
                  <Icon name="arrowRight" size={18} />
                </button>
              </div>
            </div>
            <figure className="focus__mock">
              <Mockup idea={idea} />
            </figure>
            <div className="focus__code">
              <CodeMorph snippets={code[idea.title]} />
            </div>
            <div key={idea.title} className="focus__body" aria-live="polite">
              <span className="tag tag--fill">Example idea · not a submission</span>
              <h3 className="display focus__name">{idea.title}</h3>
              <p className="focus__text">{idea.summary}</p>
              <ul className="focus__impact">
                {idea.impact.map((m) => (
                  <li key={m.label}>
                    <Icon name={m.icon} size={26} />
                    <span>{m.label}</span>
                  </li>
                ))}
              </ul>
              <p className="label focus__with">Could be built with: {idea.builtWith}</p>
            </div>
          </article>

        </div>
      </div>
    </section>
  )
}
