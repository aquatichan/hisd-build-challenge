// Placeholder for a real student photo. Deliberately NOT a stock or generated person:
// a blueprint-hatched frame with crop marks, clearly labeled until real photos (with releases) arrive.
// When a real photo exists, pass `src` + `alt` and it renders the image instead.
export default function PhotoFrame({ src, alt = '', label = 'Student photo', ratio = '4 / 3', compact = false, className = '' }) {
  return (
    <figure className={`photo-frame${compact ? ' photo-frame--compact' : ''} ${className}`} style={{ aspectRatio: ratio }}>
      {src ? (
        <img src={src} alt={alt} loading="lazy" decoding="async" />
      ) : (
        <figcaption className="photo-frame__ph">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="photo-frame__icon">
            <path d="M4 8h3l1.6-2.2h6.8L17 8h3v11H4z" />
            <circle cx="12" cy="13.2" r="3.4" />
          </svg>
          <span className="label">{label}</span>
          <span className="label photo-frame__soon">Photo coming soon</span>
        </figcaption>
      )}
      <span className="crop crop--tl" aria-hidden="true" />
      <span className="crop crop--tr" aria-hidden="true" />
      <span className="crop crop--bl" aria-hidden="true" />
      <span className="crop crop--br" aria-hidden="true" />
    </figure>
  )
}
