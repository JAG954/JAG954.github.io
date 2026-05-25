import SolverPlaceholderButtons from './SolverPlaceholderButtons.jsx'

function ProblemTable({ table, index }) {
  const headers = Array.isArray(table.headers) ? table.headers : []
  const rows = Array.isArray(table.rows) ? table.rows : []
  const caption = (table.caption || '').trim()
  const colCount = Math.max(
    headers.length,
    ...rows.map((r) => (Array.isArray(r) ? r.length : 0)),
  )

  return (
    <figure className="model-table-figure mb-4">
      {caption && (
        <figcaption className="model-table-caption">{caption}</figcaption>
      )}
      <div className="table-responsive">
        <table className="table table-bordered model-data-table mb-0">
          {headers.length > 0 && (
            <thead>
              <tr>
                {Array.from({ length: colCount }).map((_, c) => (
                  <th key={c} scope="col">
                    {headers[c] || ''}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {rows.map((row, r) => (
              <tr key={r}>
                {Array.from({ length: colCount }).map((_, c) => (
                  <td key={c}>{(row && row[c]) || ''}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-muted small mt-2 mb-0">
        Table {index + 1} of problem data.
      </p>
    </figure>
  )
}

export default function ModelProblemCard({ model, onPlaceholder, lastResult }) {
  if (!model) return null

  const paragraphs = Array.isArray(model.problemText) ? model.problemText : []
  const tables = Array.isArray(model.tables) ? model.tables : []

  return (
    <article className="card model-problem-card mb-4">
      <div className="card-body p-4 p-md-5">
        <header className="mb-4">
          <p className="section-kicker mb-2">Model {model.modelNumber}</p>
          <h2 className="h3 mb-2">{model.title}</h2>
          <p className="model-source mb-0">
            Source:{' '}
            <a href={model.sourceUrl} target="_blank" rel="noopener noreferrer">
              {model.sourceUrl}
            </a>
          </p>
        </header>

        <section className="mb-4" aria-labelledby={`problem-${model.modelId}`}>
          <h3 id={`problem-${model.modelId}`} className="h5 mb-3">
            Problem Statement
          </h3>
          {paragraphs.length === 0 ? (
            <p className="text-muted mb-0">
              No problem text was extracted for this model.
            </p>
          ) : (
            paragraphs.map((p, i) => (
              <p key={i} className="model-paragraph mb-3">
                {p}
              </p>
            ))
          )}
        </section>

        <section className="mb-4" aria-labelledby={`data-${model.modelId}`}>
          <h3 id={`data-${model.modelId}`} className="h5 mb-3">
            Problem Data
          </h3>
          {tables.length === 0 ? (
            <p className="text-muted mb-0">
              No tabular data accompanies this model on the source page.
            </p>
          ) : (
            tables.map((table, i) => (
              <ProblemTable key={i} table={table} index={i} />
            ))
          )}
        </section>

        <section aria-labelledby={`actions-${model.modelId}`}>
          <h3 id={`actions-${model.modelId}`} className="h5 mb-3">
            Solver Actions
          </h3>
          <SolverPlaceholderButtons
            modelId={model.modelId}
            onPlaceholder={onPlaceholder}
            lastResult={lastResult}
          />
        </section>
      </div>
    </article>
  )
}
