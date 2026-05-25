export default function ArchitectureSection() {
  return (
    <section
      className="section-pad border-top"
      id="technical-architecture"
      aria-labelledby="technical-architecture-heading"
    >
      <div className="container">
        <header className="mb-4">
          <p className="section-kicker mb-2">Technical Architecture</p>
          <h2 id="technical-architecture-heading" className="h2 mb-3">
            How the workbench is wired together
          </h2>
          <p className="lead mb-0">
            Three layers: a natural-language formulation layer, a deterministic
            standard-form transformation layer, and a browser-local solver layer.
            Each layer is independently inspectable through the result tabs above.
          </p>
        </header>

        <div className="row g-3">
          <ArchCard
            kicker="Layer 1"
            title="Natural-language formulation"
            body={
              <>
                The frontend posts the prompt to a backend
                <code> POST /api/formulate-lp </code>
                endpoint when one is configured. The server proxies the prompt to
                a Gemini model, validates the JSON response against the workbench
                schema, and returns a structured formulation. The Gemini API key
                lives only on the server — it is never embedded in this client
                bundle. When the backend is unreachable, the page falls back to a
                local deterministic template so the demo always renders.
              </>
            }
          />
          <ArchCard
            kicker="Layer 2"
            title="Standard-form transformation"
            body={
              <>
                The formulation JSON carries the general algebraic form, a
                transformation log (objective sign flip, slack / surplus
                introduction, matrix assembly), and the resulting standard-form
                problem <code>{'min c^T x s.t. Ax = b, x >= 0'}</code>. Variable
                ordering, coefficient alignment, and dimension checks are all
                enforced before the matrix is exposed.
              </>
            }
          />
          <ArchCard
            kicker="Layer 3"
            title="Custom solver + verification handoff"
            body={
              <>
                The SolverData export <code>{'{ A, b, c, variableNames, objectiveType }'}</code>
                is consumed by the built-in two-phase Simplex (Phase I with
                artificial variables, Phase II primal pivots, anti-cycling
                guards). The same payload is structured to be handed to an
                external Interior Point solver or to OR-Tools / Gurobi for
                independent verification — those backends are pending in this
                branch.
              </>
            }
          />
        </div>

        <div className="technical-export mt-4">
          <h3 className="h5">Method comparison at a glance</h3>
          <div className="table-responsive">
            <table className="table table-bordered align-middle mb-0">
              <thead>
                <tr>
                  <th>Method</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Two-phase Simplex</td>
                  <td>Browser (this page)</td>
                  <td>Live</td>
                  <td>Custom JavaScript implementation. Runs on the SolverData payload of the current formulation.</td>
                </tr>
                <tr>
                  <td>Interior Point (IPM)</td>
                  <td>Pending</td>
                  <td>Not wired</td>
                  <td>Schema and payload are IPM-ready, but no browser-portable IPM is integrated in this branch yet.</td>
                </tr>
                <tr>
                  <td>OR-Tools / Gurobi verification</td>
                  <td>External</td>
                  <td>Not wired</td>
                  <td>Use the exported SolverData JSON to drive an external solver and compare objective values.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}

function ArchCard({ kicker, title, body }) {
  return (
    <div className="col-md-4">
      <div className="mini-stat h-100">
        <span>{kicker}</span>
        <strong>{title}</strong>
        <p className="mb-0 mt-2">{body}</p>
      </div>
    </div>
  )
}
