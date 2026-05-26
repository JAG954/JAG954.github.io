import { useEffect, useMemo, useState } from 'react'
import SourceAttribution from './SourceAttribution.jsx'
import ModelProblemCard from './ModelProblemCard.jsx'

const DATA_URL = `${import.meta.env.BASE_URL}uw-models.json`

const FALLBACK_COLLECTION_URL =
  'https://sites.math.washington.edu/~burke/crs/407/models/'

export default function ModelProblemSection() {
  const [payload, setPayload] = useState(null)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState('')

  useEffect(() => {
    let cancelled = false
    fetch(DATA_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Could not load ${DATA_URL} (status ${response.status})`)
        }
        return response.json()
      })
      .then((data) => {
        if (cancelled) return
        setPayload(data)
        const first = Array.isArray(data?.models) ? data.models[0] : null
        if (first) setSelectedId(first.modelId)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const models = useMemo(
    () => (Array.isArray(payload?.models) ? payload.models : []),
    [payload],
  )

  const selectedModel = useMemo(
    () => models.find((m) => m.modelId === selectedId) || null,
    [models, selectedId],
  )

  const collectionUrl = payload?.sourceCollection || FALLBACK_COLLECTION_URL

  function handleSelect(nextId) {
    setSelectedId(nextId)
  }

  return (
    <section
      className="section-pad border-top bg-soft model-problem-section"
      id="lp-models"
      aria-labelledby="lp-models-heading"
    >
      <div className="container">
        <header className="mb-4">
          <p className="section-kicker mb-2">Reference Catalog</p>
          <h2 id="lp-models-heading" className="h2 mb-3">
            UW Math 407 LP Model Catalog
          </h2>
          <p className="lead mb-0">
            Twenty-nine classic linear programming problem statements with their
            original data tables, ready to be wired into a from-scratch Simplex,
            Interior Point, and Gurobi verification backend.
          </p>
        </header>

        <SourceAttribution sourceUrl={collectionUrl} />

        {error && (
          <div className="alert alert-danger" role="alert">
            Failed to load model catalog: {error}
          </div>
        )}

        {!error && models.length === 0 && (
          <div className="alert alert-secondary" role="status">
            Loading model catalog...
          </div>
        )}

        {models.length > 0 && (
          <>
            <div className="card selector-card mb-4">
              <div className="card-body p-4">
                <label
                  htmlFor="uwModelSelect"
                  className="form-label fw-semibold mb-2"
                >
                  Jump to a model
                </label>
                <select
                  id="uwModelSelect"
                  className="form-select"
                  value={selectedId}
                  onChange={(event) => handleSelect(event.target.value)}
                >
                  {models.map((model) => (
                    <option key={model.modelId} value={model.modelId}>
                      {`Model ${model.modelNumber}: ${stripLeadingModel(model.title)}`}
                    </option>
                  ))}
                </select>

                <div className="model-toggle-grid mt-3" role="group" aria-label="Model quick picker">
                  {models.map((model) => (
                    <button
                      key={model.modelId}
                      type="button"
                      className={`btn btn-sm ${
                        model.modelId === selectedId ? 'btn-dark' : 'btn-outline-dark'
                      }`}
                      onClick={() => handleSelect(model.modelId)}
                      aria-pressed={model.modelId === selectedId}
                    >
                      {model.modelNumber}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <ModelProblemCard model={selectedModel} />
          </>
        )}
      </div>
    </section>
  )
}

function stripLeadingModel(title) {
  return String(title || '').replace(/^Model\s+\d+\s*[:.-]?\s*/i, '')
}
