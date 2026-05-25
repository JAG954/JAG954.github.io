const PLACEHOLDER_MESSAGE =
  'Placeholder only. Live solve API is not connected yet.'

const SOLVERS = [
  { id: 'simplex', label: 'Solve with Simplex' },
  { id: 'ipm', label: 'Solve with IPM' },
  { id: 'gurobi', label: 'Verify with Gurobi' },
]

export default function SolverPlaceholderButtons({ modelId, onPlaceholder, lastResult }) {
  const handleClick = (solverId) => {
    onPlaceholder?.({
      modelId,
      solverId,
      message: PLACEHOLDER_MESSAGE,
    })
  }

  return (
    <div>
      <div className="solver-placeholder-buttons" role="group" aria-label="Solver actions">
        {SOLVERS.map((solver) => (
          <button
            key={solver.id}
            type="button"
            className="btn btn-outline-dark"
            onClick={() => handleClick(solver.id)}
          >
            {solver.label}
          </button>
        ))}
      </div>

      <p className="text-muted small mt-3 mb-0">
        Solver execution is not enabled yet. These buttons are placeholders for future
        integration with the Simplex, IPM, and Gurobi verification backend.
      </p>

      {lastResult && lastResult.modelId === modelId && (
        <div
          className="alert alert-secondary mt-3 mb-0"
          role="status"
          aria-live="polite"
        >
          <strong>{labelFor(lastResult.solverId)}:</strong> {lastResult.message}
        </div>
      )}
    </div>
  )
}

function labelFor(solverId) {
  const match = SOLVERS.find((s) => s.id === solverId)
  return match ? match.label : 'Solver'
}
