import { useEffect, useMemo, useRef, useState } from 'react'

// Code window that morphs between the same idea written in different languages.
// Original component for this site (inspired by the "code morph" idea): characters scramble and resolve
// left-to-right, line by line. Tabs let people pick a language; it auto-advances while not hovered.

const GLYPHS = '{}[]()<>=+-*/;:._#$%&!?01'
const KEYWORDS = new Set(
  'def return if else elif for while in import from as const let var function async await new class true false True False None null void int float bool long unsigned while loop setup delay and or not of'.split(
    ' ',
  ),
)

// tiny tokenizer: comments, strings, numbers, keywords, function calls
function tokenize(line) {
  const out = []
  const re = /(\/\/.*|#.*|--\s.*|<!--.*)|("[^"]*"?|'[^']*'?|`[^`]*`?)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)(?=\s*\()|([A-Za-z_]\w*)|(\s+)|(.)/g
  let m
  while ((m = re.exec(line))) {
    const [t, com, str, num, call, word, ws] = m
    out.push([com ? 'c' : str ? 's' : num ? 'n' : call ? 'f' : word ? (KEYWORDS.has(word) ? 'k' : 'i') : ws ? 'w' : 'p', t])
  }
  return out
}

const pad = (lines, n) => [...lines, ...Array(Math.max(0, n - lines.length)).fill('')]

export default function CodeMorph({ snippets, interval = 4200, duration = 750, label = 'How you could build it' }) {
  const [active, setActive] = useState(0)
  const [lines, setLines] = useState(() => snippets[0].code.split('\n'))
  const [hover, setHover] = useState(false)
  const shownRef = useRef(snippets[0].code)
  const reduce = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, [])

  // morph from what's on screen to the active snippet
  useEffect(() => {
    const target = snippets[Math.min(active, snippets.length - 1)].code
    const from = shownRef.current.split('\n')
    const to = target.split('\n')
    const n = Math.max(from.length, to.length)
    const A = pad(from, n), B = pad(to, n)
    if (reduce) {
      shownRef.current = target // rendered directly below, no animation
      return
    }
    let raf = 0
    const t0 = performance.now()
    const step = (now) => {
      const t = Math.min(1, (now - t0) / duration)
      const next = B.map((b, li) => {
        const a = A[li]
        const len = Math.max(a.length, b.length)
        let s = ''
        for (let i = 0; i < len; i++) {
          const p = t * 1.8 - (i / Math.max(len, 1)) * 0.5 - (li / n) * 0.3
          if (p >= 1) s += b[i] ?? ''
          else if (p <= 0) s += a[i] ?? ''
          else {
            const ch = b[i] ?? a[i] ?? ''
            s += ch === ' ' || ch === '' ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0]
          }
        }
        return t >= 1 ? b : s
      })
      setLines(t >= 1 ? to : next)
      if (t < 1) raf = requestAnimationFrame(step)
      else shownRef.current = target
    }
    raf = requestAnimationFrame(step)
    return () => {
      cancelAnimationFrame(raf)
      shownRef.current = target
    }
  }, [active, snippets, duration, reduce])

  // auto-advance through languages (paused on hover/focus and for reduced motion)
  useEffect(() => {
    if (hover || reduce || snippets.length < 2) return
    const id = setTimeout(() => setActive((a) => (a + 1) % snippets.length), interval)
    return () => clearTimeout(id)
  }, [active, hover, reduce, snippets, interval])

  // the language index carries across ideas (clamped), so switching ideas morphs in place
  const current = snippets[Math.min(active, snippets.length - 1)]
  const shown = reduce ? current.code.split('\n') : lines

  return (
    <div
      className="code-morph"
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
    >
      <div className="code-morph__bar">
        <span className="code-morph__dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <div className="code-morph__tabs" role="tablist" aria-label="Language">
          {snippets.map((s, i) => (
            <button
              key={s.lang}
              type="button"
              role="tab"
              aria-selected={i === active}
              onClick={() => setActive(i)}
              className="code-morph__tab"
            >
              {s.lang}
            </button>
          ))}
        </div>
      </div>
      <p className="label code-morph__label">
        {label} · <span>{current.note}</span>
      </p>
      <pre className="code-morph__code" aria-hidden="true">
        {shown.map((line, i) => (
          <div key={i} className="code-morph__line">
            <span className="code-morph__ln">{String(i + 1).padStart(2, ' ')}</span>
            <code>
              {tokenize(line).map(([k, t], j) => (
                <span key={j} className={`tk-${k}`}>
                  {t}
                </span>
              ))}
            </code>
          </div>
        ))}
      </pre>
      <pre className="visually-hidden">{current.code}</pre>
      <span className="code-morph__progress" key={`${active}-${hover}`} style={{ '--dur': `${interval}ms` }} data-paused={hover || reduce || undefined} />
    </div>
  )
}
