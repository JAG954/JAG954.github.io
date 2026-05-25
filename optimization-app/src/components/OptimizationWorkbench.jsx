import { useEffect, useMemo, useState } from 'react'
import Latex from './Latex.jsx'
import { EXAMPLE_PROMPTS } from '../utils/localFormulation.js'
import { PROMPT_MAX_LENGTH, formulatePrompt, getFormulateApiBaseUrl } from '../utils/formulationClient.js'
import { solverPayloadToSolverData } from '../utils/solverData.js'
import { solveSimplex } from '../utils/simplexSolver.js'

const TABS = [
  { id: 'general', label: 'General LP' },
  { id: 'standard', label: 'Standard form' },
  { id: 'matrix', label: 'Matrix payload' },
  { id: 'derivation', label: 'Derivation' },
  { id: 'solver', label: 'Solver results' },
  { id: 'json', label: 'JSON export' },
]

export default function OptimizationWorkbench() {
  const [inputText, setInputText] = useState(EXAMPLE_PROMPTS[0].prompt)
  const [activeTab, setActiveTab] = useState('general')
  const [response, setResponse] = useState(null)
  const [apiUrl, setApiUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [jsonTarget, setJsonTarget] = useState('formulation')
  const [solverResults, setSolverResults] = useState(createInitialSolverResults)

  useEffect(() => {
    getFormulateApiBaseUrl().then(setApiUrl)
    formulatePrompt(EXAMPLE_PROMPTS[0].prompt, { useLiveApi: false }).then(setResponse)
  }, [])

  const formulation = response?.data
  const trimmedInput = inputText.trim()
  const isPromptEmpty = trimmedInput.length === 0
  const isPromptOverLimit = inputText.length > PROMPT_MAX_LENGTH
  const canSubmit = !loading && !isPromptEmpty && !isPromptOverLimit
  const solverData = useMemo(
    () => (formulation ? solverPayloadToSolverData(formulation) : null),
    [formulation],
  )
  const status = useMemo(() => {
    if (!response) return { label: 'Cached Demo', detail: 'Ready for local demo formulation', tone: 'demo' }
    if (response.source === 'live-gemini') {
      return {
        label: 'Live Gemini',
        detail: response.fromSessionCache ? 'Loaded from this session cache' : 'Live endpoint returned a formulation',
        tone: 'live',
      }
    }
    if (response.source === 'api-unavailable') {
      return {
        label: 'API unavailable',
        detail: response.liveError || 'Using deterministic fallback formulation',
        tone: 'unavailable',
      }
    }
    return { label: 'Cached Demo', detail: 'Static fallback formulation active', tone: 'demo' }
  }, [response])

  function handleExample(example) {
    setInputText(example.prompt)
    setError('')
    setActiveTab('general')
    setSolverResults(createInitialSolverResults())
    formulatePrompt(example.prompt, { useLiveApi: false }).then(setResponse)
  }

  async function handleFormulate() {
    if (!canSubmit) return

    setLoading(true)
    setError('')
    setActiveTab('general')
    setSolverResults(createInitialSolverResults())

    try {
      const result = await formulatePrompt(inputText, { useLiveApi: true })
      setResponse(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  function handleCopy(value = formulation) {
    if (!value) return
    navigator.clipboard.writeText(JSON.stringify(value, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  function handleRunSimplex() {
    if (!solverData) return

    setSolverResults((current) => ({
      ...current,
      simplex: { status: 'running' },
    }))

    try {
      const result = solveSimplex(solverData)
      setSolverResults((current) => ({
        ...current,
        simplex: result,
      }))
    } catch (err) {
      setSolverResults((current) => ({
        ...current,
        simplex: {
          method: 'Two-phase Simplex',
          status: 'error',
          message: err instanceof Error ? err.message : String(err),
        },
      }))
    }
  }

  return (
    <section className="section-pad optimization-workbench" id="optimization-workbench" aria-labelledby="optimization-workbench-heading">
      <div className="container">
        <div className="row align-items-end g-4 mb-4">
          <div className="col-lg-8">
            <p className="section-kicker mb-2">Optimization Workbench</p>
            <h1 id="optimization-workbench-heading" className="display-5 fw-semibold mb-3">
              LP Formulation Workbench
            </h1>
            <p className="lead mb-0">
              An AI-assisted workbench that converts natural-language linear program
              descriptions into structured mathematical formulations, then solves them
              with a custom two-phase Simplex implementation and prepares the same
              payload for external solver verification.
            </p>
          </div>
          <div className="col-lg-4">
            <div className={`workbench-status workbench-status-${status.tone}`}>
              <span>Processing mode</span>
              <strong>{status.label}</strong>
              <small>{apiUrl ? status.detail : 'No live API configured. Running in cached demo mode.'}</small>
            </div>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-lg-4">
            <div className="card selector-card h-100">
              <div className="card-body p-4">
                <h2 className="h5 mb-3">Prompt profiles</h2>
                <div className="workbench-example-list">
                  {EXAMPLE_PROMPTS.map((example) => (
                    <button
                      key={example.id}
                      type="button"
                      className="workbench-example"
                      onClick={() => handleExample(example)}
                      disabled={loading}
                    >
                      <span>{example.label}</span>
                      <strong>{example.title}</strong>
                    </button>
                  ))}
                </div>
                <p className="text-muted small mt-3 mb-0">
                  Examples render locally first so public page views do not spend API quota.
                </p>
              </div>
            </div>
          </div>

          <div className="col-lg-8">
            <div className="card solver-card h-100">
              <div className="card-body p-4">
                <label htmlFor="lpPrompt" className="form-label fw-semibold">
                  Optimization problem statement
                </label>
                <textarea
                  id="lpPrompt"
                  className="form-control workbench-prompt"
                  value={inputText}
                  maxLength={PROMPT_MAX_LENGTH}
                  disabled={loading}
                  onChange={(event) => setInputText(event.target.value)}
                />
                <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mt-3">
                  <p className={`small mb-0 ${isPromptOverLimit ? 'text-danger' : 'text-muted'}`}>
                    {inputText.length}/{PROMPT_MAX_LENGTH.toLocaleString()} characters. Live API requests are cached per browser session; the button falls back to the cached demo if no backend is reachable.
                  </p>
                  <button type="button" className="btn btn-dark" onClick={handleFormulate} disabled={!canSubmit} aria-busy={loading}>
                    {loading ? 'Formulating...' : apiUrl ? 'Formulate (live + fallback)' : 'Formulate (cached demo)'}
                  </button>
                </div>
                {isPromptEmpty && (
                  <p className="text-muted small mt-2 mb-0">Enter a prompt to enable live formulation.</p>
                )}
                {error && (
                  <div className="alert alert-danger mt-3 mb-0" role="alert">
                    {error}
                  </div>
                )}
                {response?.liveError && (
                  <div className="alert alert-warning mt-3 mb-0" role="status">
                    API unavailable: {response.liveError}. Showing cached demo data instead.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {formulation && (
          <div className="card formulation-card mt-4">
            <div className="card-body p-4 p-md-5">
              <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-4">
                <div>
                  <p className="section-kicker mb-2">{status.label}</p>
                  <h2 className="h3 mb-2">{formulation.original_problem.interpreted_goal}</h2>
                  <p className="mb-0">{formulation.original_problem.interpreted_context}</p>
                </div>
                <button type="button" className="btn btn-outline-dark align-self-start" onClick={() => handleCopy(formulation)}>
                  {copied ? 'Copied JSON' : 'Copy JSON'}
                </button>
              </div>

              {formulation.metadata?.unsupported_features?.length > 0 && (
                <div className="alert alert-warning" role="status">
                  <strong>Heads up — unsupported features detected:</strong>
                  <ul className="mb-0 mt-2">
                    {formulation.metadata.unsupported_features.map((entry) => (
                      <li key={entry.feature}>
                        <strong>{entry.label}.</strong> {entry.note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="workbench-tabs" role="tablist" aria-label="Formulation views">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={`btn btn-sm ${activeTab === tab.id ? 'btn-dark' : 'btn-outline-dark'}`}
                    onClick={() => setActiveTab(tab.id)}
                    aria-pressed={activeTab === tab.id}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="workbench-tab-panel mt-4">
                {activeTab === 'general' && <GeneralForm formulation={formulation} />}
                {activeTab === 'standard' && <StandardForm formulation={formulation} />}
                {activeTab === 'matrix' && <MatrixForm formulation={formulation} />}
                {activeTab === 'derivation' && <Derivation formulation={formulation} />}
                {activeTab === 'solver' && (
                  <SolverReadiness
                    formulation={formulation}
                    solverData={solverData}
                    solverResults={solverResults}
                    onRunSimplex={handleRunSimplex}
                  />
                )}
                {activeTab === 'json' && (
                  <JsonView
                    formulation={formulation}
                    solverData={solverData}
                    target={jsonTarget}
                    onTargetChange={setJsonTarget}
                    onCopy={handleCopy}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function createInitialSolverResults() {
  return {
    simplex: null,
    ipm: {
      method: 'Interior Point Method',
      status: 'pending',
      message: 'IPM integration pending. No portable browser implementation is wired in this branch yet.',
    },
  }
}

function GeneralForm({ formulation }) {
  return (
    <div className="workbench-stack">
      <LatexBlock math={formulation.general_form.latex_block} />
      <div className="table-responsive">
        <table className="table table-bordered align-middle">
          <thead>
            <tr>
              <th>Variable</th>
              <th>Meaning</th>
              <th>Bounds</th>
              <th>Unit</th>
            </tr>
          </thead>
          <tbody>
            {formulation.decision_variables.map((variable) => (
              <tr key={variable.name}>
                <td><code>{variable.name}</code></td>
                <td>{variable.description}</td>
                <td>{variable.sign}</td>
                <td>{variable.unit || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="constraint-list">
        {formulation.general_form.constraints.map((constraint) => (
          <article key={constraint.id} className="mini-stat">
            <span>{constraint.name}</span>
            <strong><Latex math={constraint.expression_latex} /></strong>
            <p className="mb-0 mt-2">{constraint.explanation}</p>
          </article>
        ))}
      </div>
    </div>
  )
}

function StandardForm({ formulation }) {
  return (
    <div className="workbench-stack">
      <LatexBlock math={formulation.standard_form.latex_block} />
      <div className="row g-3">
        {formulation.standard_form.variables_ordered.map((variable, index) => (
          <div className="col-md-4" key={variable.name}>
            <div className="mini-stat h-100">
              <span>index {index} · {variable.source}</span>
              <strong>{variable.name}</strong>
              <p className="mb-0 mt-2">{variable.description}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="table-responsive">
        <table className="table table-bordered align-middle">
          <thead>
            <tr>
              <th>Constraint</th>
              <th>Equation</th>
              <th>Coefficients</th>
              <th>RHS</th>
            </tr>
          </thead>
          <tbody>
            {formulation.standard_form.constraints.map((constraint) => (
              <tr key={constraint.id}>
                <td><code>{constraint.id}</code></td>
                <td><Latex math={constraint.expression_latex} /></td>
                <td><code>[{constraint.coefficients_ordered.join(', ')}]</code></td>
                <td>{constraint.rhs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MatrixForm({ formulation }) {
  const matrix = formulation.matrix_form

  return (
    <div className="workbench-stack">
      <LatexBlock math={matrix.compact_latex} />
      <div className="row g-3">
        <MatrixPanel title="A matrix" math={`\\mathbf{A} = ${matrix.matrix_latex}`} detail={`${matrix.A.length} x ${matrix.A[0]?.length || 0}`} />
        <MatrixPanel title="x vector" math={`\\mathbf{x} = ${matrix.variable_vector_latex}`} detail={matrix.variables.join(', ')} />
        <MatrixPanel title="c vector" math={`\\mathbf{c} = ${matrix.objective_vector_latex}`} detail={`[${matrix.c.join(', ')}]`} />
        <MatrixPanel title="b vector" math={`\\mathbf{b} = ${matrix.rhs_vector_latex}`} detail={`[${matrix.b.join(', ')}]`} />
      </div>
    </div>
  )
}

function MatrixPanel({ title, math, detail }) {
  return (
    <div className="col-md-6">
      <div className="mini-stat h-100">
        <span>{title}</span>
        <div className="matrix-preview"><Latex math={math} /></div>
        <p className="mb-0 mt-2">{detail}</p>
      </div>
    </div>
  )
}

function Derivation({ formulation }) {
  return (
    <div className="derivation-list">
      {formulation.transformations.map((step) => (
        <article key={step.step_number} className="derivation-step">
          <span>Step {step.step_number}</span>
          <h3 className="h5">{step.title}</h3>
          <p>{step.description}</p>
          {(step.before_latex || step.after_latex) && (
            <div className="row g-3">
              {step.before_latex && <LatexCompare label="Before" math={step.before_latex} />}
              {step.after_latex && <LatexCompare label="After" math={step.after_latex} />}
            </div>
          )}
        </article>
      ))}
    </div>
  )
}

function SolverReadiness({ formulation, solverData, solverResults, onRunSimplex }) {
  const payload = formulation.solver_payload

  return (
    <div className="workbench-stack">
      <div className="row g-3">
        <ReadinessCard label="Simplex" value={payload.ready_for_simplex ? 'Ready' : 'Phase I needed'} />
        <ReadinessCard label="Interior point" value={payload.ready_for_ipm ? 'Matrix ready' : 'Needs repair'} />
        <ReadinessCard label="Artificial variables" value={payload.has_artificial_variables ? 'Recommended' : 'Not required'} />
      </div>
      <div className="technical-export">
        <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
          <div>
            <h3 className="h5 mb-2">Local solver actions</h3>
            <p className="text-muted mb-0">
              Run browser-local methods against the SolverData arrays generated from the current formulation.
            </p>
          </div>
          <div className="solver-action-buttons">
            <button type="button" className="btn btn-dark" onClick={onRunSimplex} disabled={!solverData || solverResults.simplex?.status === 'running'}>
              {solverResults.simplex?.status === 'running' ? 'Running Simplex...' : 'Run Simplex (browser-local)'}
            </button>
            <button type="button" className="btn btn-outline-dark" disabled title="IPM integration pending in this branch">
              Run IPM (pending)
            </button>
          </div>
        </div>
      </div>
      <div className="technical-export">
        <h3 className="h5">SolverData mapping</h3>
        <div className="export-grid">
          <ExportRow label="Objective type" value={solverData.objectiveType} />
          <ExportRow label="Variables" value={`${solverData.variableNames.length} ordered variables`} />
          <ExportRow label="Constraints" value={`${solverData.A.length} equality rows`} />
          <ExportRow label="Matrix shape" value={`${solverData.A.length} x ${solverData.A[0]?.length || 0}`} />
          <ExportRow label="Payload mapping" value="A_eq -> A, b_eq -> b, original objective coefficients -> c (sign preserved), variables -> variableNames" />
        </div>
      </div>
      <SimplexResultPanel result={solverResults.simplex} />
      <IpmPendingPanel result={solverResults.ipm} />
      <MethodComparisonTable simplexResult={solverResults.simplex} ipmResult={solverResults.ipm} />
      <div className="technical-export">
        <h3 className="h5">Integration notes</h3>
        <ul className="mb-0">
          {payload.notes_for_solver_integration.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function SimplexResultPanel({ result }) {
  if (!result) {
    return (
      <div className="solver-result-panel">
        <h3 className="h5">Simplex result</h3>
        <p className="text-muted mb-0">Run Simplex to solve the current SolverData payload locally.</p>
      </div>
    )
  }

  if (result.status === 'error') {
    return (
      <div className="solver-result-panel solver-result-error">
        <h3 className="h5">Simplex result</h3>
        <p className="mb-0">{result.message}</p>
      </div>
    )
  }

  if (result.status === 'running') {
    return (
      <div className="solver-result-panel">
        <h3 className="h5">Simplex result</h3>
        <p className="text-muted mb-0">Running local Simplex...</p>
      </div>
    )
  }

  return (
    <div className="solver-result-panel">
      <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-3">
        <div>
          <h3 className="h5 mb-1">Simplex result</h3>
          <p className="text-muted mb-0">{result.method} · {result.message}</p>
        </div>
        <span className={`solver-status solver-status-${result.status}`}>{result.status}</span>
      </div>
      <div className="export-grid">
        <ExportRow label="Original objective" value={formatNumber(result.objectiveValue)} />
        <ExportRow label="Solver objective" value={formatNumber(result.solverObjectiveValue)} />
        <ExportRow label="Iterations" value={String(result.iterations)} />
        <ExportRow label="Phase I objective" value={formatNumber(result.phaseOneObjective)} />
      </div>
      <VariableValueTable values={result.variableValues} />
    </div>
  )
}

function IpmPendingPanel({ result }) {
  return (
    <div className="solver-result-panel solver-result-pending">
      <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
        <div>
          <h3 className="h5 mb-1">IPM integration pending</h3>
          <p className="mb-0">{result.message}</p>
        </div>
        <span className="solver-status solver-status-pending">pending</span>
      </div>
    </div>
  )
}

function MethodComparisonTable({ simplexResult, ipmResult }) {
  const rows = [
    {
      method: 'Simplex',
      status: simplexResult?.status || 'not run',
      objective: simplexResult?.objectiveValue,
      iterations: simplexResult?.iterations,
      note: simplexResult?.message || 'Run Simplex to populate this row.',
    },
    {
      method: 'IPM',
      status: ipmResult?.status || 'pending',
      objective: null,
      iterations: null,
      note: ipmResult?.message || 'IPM integration pending.',
    },
  ]

  return (
    <div className="technical-export">
      <h3 className="h5">Method comparison</h3>
      <div className="table-responsive">
        <table className="table table-bordered align-middle mb-0">
          <thead>
            <tr>
              <th>Method</th>
              <th>Status</th>
              <th>Objective</th>
              <th>Iterations</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.method}>
                <td>{row.method}</td>
                <td>{row.status}</td>
                <td>{formatNumber(row.objective)}</td>
                <td>{row.iterations ?? 'N/A'}</td>
                <td>{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function VariableValueTable({ values = {} }) {
  const entries = Object.entries(values)

  if (entries.length === 0) return null

  return (
    <div className="table-responsive mt-3">
      <table className="table table-bordered align-middle mb-0">
        <thead>
          <tr>
            <th>Variable</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([name, value]) => (
            <tr key={name}>
              <td><code>{name}</code></td>
              <td>{formatNumber(value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function JsonView({ formulation, solverData, target, onTargetChange, onCopy }) {
  const exportValue = target === 'solverData' ? solverData : formulation

  return (
    <div className="workbench-stack">
      <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
        <div className="btn-group export-toggle" role="group" aria-label="JSON export target">
          <button
            type="button"
            className={`btn btn-sm ${target === 'formulation' ? 'btn-dark' : 'btn-outline-dark'}`}
            onClick={() => onTargetChange('formulation')}
            aria-pressed={target === 'formulation'}
          >
            Formulation JSON
          </button>
          <button
            type="button"
            className={`btn btn-sm ${target === 'solverData' ? 'btn-dark' : 'btn-outline-dark'}`}
            onClick={() => onTargetChange('solverData')}
            aria-pressed={target === 'solverData'}
          >
            SolverData JSON
          </button>
        </div>
        <button type="button" className="btn btn-outline-dark align-self-start" onClick={() => onCopy(exportValue)}>
          Copy export
        </button>
      </div>
      <pre className="json-view mb-0">
        {JSON.stringify(exportValue, null, 2)}
      </pre>
    </div>
  )
}

function LatexBlock({ math }) {
  return (
    <div className="latex-block">
      <Latex math={math} displayMode />
    </div>
  )
}

function LatexCompare({ label, math }) {
  return (
    <div className="col-md-6">
      <div className="latex-compare">
        <span>{label}</span>
        <Latex math={math} />
      </div>
    </div>
  )
}

function ReadinessCard({ label, value }) {
  return (
    <div className="col-md-4">
      <div className="mini-stat h-100">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  )
}

function ExportRow({ label, value }) {
  return (
    <div className="export-row">
      <span>{label}</span>
      <code>{value}</code>
    </div>
  )
}

function formatNumber(value) {
  if (value === null || value === undefined) return 'N/A'
  if (typeof value !== 'number') return String(value)
  if (!Number.isFinite(value)) return String(value)
  return Number.isInteger(value) ? String(value) : value.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')
}
