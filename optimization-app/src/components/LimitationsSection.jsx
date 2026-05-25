export default function LimitationsSection() {
  return (
    <section
      className="section-pad border-top bg-soft"
      id="limitations"
      aria-labelledby="limitations-heading"
    >
      <div className="container">
        <header className="mb-4">
          <p className="section-kicker mb-2">Limitations &amp; Verification Notes</p>
          <h2 id="limitations-heading" className="h2 mb-3">
            What this page does not (yet) claim
          </h2>
          <p className="lead mb-0">
            This workbench is meant to demonstrate end-to-end LP formulation and a
            from-scratch Simplex implementation, not to replace a production
            optimization stack. The honest scope is captured below.
          </p>
        </header>

        <div className="row g-3">
          <LimitationCard
            title="Live AI formulation is optional"
            tone="warn"
            body={
              <>
                The natural-language formulation step calls Gemini through a
                server-side proxy. When no backend is configured, the page
                automatically uses a deterministic local template and labels the
                output as <em>Cached Demo</em>. When the backend errors, the
                badge switches to <em>API unavailable</em> and a fallback
                formulation is shown so the demo never breaks.
              </>
            }
          />
          <LimitationCard
            title="Simplex runs in the browser"
            tone="info"
            body={
              <>
                The two-phase Simplex executes inside the page in JavaScript on
                the SolverData payload. It is intentionally educational — it has
                no presolve, no scaling, and no advanced anti-degeneracy
                heuristics beyond ratio-test tolerances. For larger or
                ill-conditioned LPs, defer to a production solver.
              </>
            }
          />
          <LimitationCard
            title="IPM and OR-Tools are pending"
            tone="warn"
            body={
              <>
                The Interior Point Method and OR-Tools / Gurobi verification
                buttons are explicit placeholders. The SolverData schema is
                designed to feed them, but neither is integrated in this branch.
                Anywhere the UI says <em>pending</em>, that work is genuinely
                outstanding rather than just hidden.
              </>
            }
          />
          <LimitationCard
            title="Integer, binary, and nonlinear inputs"
            tone="info"
            body={
              <>
                Prompts that mention integer, binary, or nonlinear structure are
                accepted, but the workbench will surface a warning and relax the
                problem to a continuous LP. A real MIP / MINLP solver is not
                wired up.
              </>
            }
          />
          <LimitationCard
            title="Numerical results are illustrative"
            tone="info"
            body={
              <>
                Objective values and variable values shown in the Simplex result
                panel come from the browser solver against the current SolverData
                payload. They have not been independently certified by OR-Tools
                or Gurobi in this branch.
              </>
            }
          />
          <LimitationCard
            title="No secrets in the client"
            tone="ok"
            body={
              <>
                No API keys or model credentials are included in the deployed
                bundle. The frontend only knows the URL of the backend
                formulation endpoint; the Gemini key lives on the server.
              </>
            }
          />
        </div>
      </div>
    </section>
  )
}

function LimitationCard({ title, body, tone = 'info' }) {
  return (
    <div className="col-md-6 col-lg-4">
      <div className={`limitation-card limitation-card-${tone} h-100`}>
        <strong>{title}</strong>
        <p className="mb-0 mt-2">{body}</p>
      </div>
    </div>
  )
}
