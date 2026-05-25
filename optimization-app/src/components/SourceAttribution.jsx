export default function SourceAttribution({ sourceUrl }) {
  return (
    <aside className="card source-attribution mb-4" aria-label="Source attribution">
      <div className="card-body p-4">
        <p className="section-kicker mb-2">Attribution</p>
        <p className="mb-2">
          Problem statements sourced from the University of Washington Department of
          Mathematics, Math 407 LP Models collection.
        </p>
        <p className="mb-0">
          Collection:{' '}
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
            {sourceUrl}
          </a>
        </p>
      </div>
    </aside>
  )
}
