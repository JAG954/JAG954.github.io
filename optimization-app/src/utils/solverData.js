// SolverData export contract
// -----------------------------------------------------------------------------
// The exported object is intentionally minimal so it can be handed to an
// external solver (Simplex, IPM, OR-Tools, Gurobi, etc.) without ambiguity:
//
//   A             number[][]  equality coefficient matrix (rows = constraints,
//                              columns = variables in `variableNames` order)
//   b             number[]    right-hand side vector, length = A.length
//   c             number[]    ORIGINAL objective coefficients aligned to
//                              `variableNames`. Sign is NEVER pre-flipped:
//                              for a maximize problem `c` holds the user's
//                              maximization coefficients; for a minimize
//                              problem `c` holds the user's minimization
//                              coefficients. Slack / surplus / artificial
//                              variables carry zero.
//   variableNames string[]    ordered variable names matching the columns of A
//                              and the entries of c
//   objectiveType "maximize" | "minimize"
//
// The intent is: a consumer reading this JSON can implement
//   if objectiveType == "maximize": maximize c^T x s.t. Ax = b, x >= 0
//   if objectiveType == "minimize": minimize c^T x s.t. Ax = b, x >= 0
// and get the user's original problem back, without needing to undo a
// hidden sign flip baked into c.

export function solverPayloadToSolverData(formulation) {
  const payload = formulation?.solver_payload || {}
  const standardForm = formulation?.standard_form || {}
  const matrixForm = formulation?.matrix_form || {}
  const generalObjective = formulation?.general_form?.objective || {}

  const variables = payload.variables || matrixForm.variables || []
  const A = payload.A_eq || standardForm.A_eq || matrixForm.A || []
  const b = payload.b_eq || standardForm.b_eq || matrixForm.b || []

  const objectiveType = normalizeObjectiveType(
    payload.objective_sense_original || generalObjective.sense,
  )

  const originalCoefficients = generalObjective.coefficients || {}
  const cOriginal = variables.map((name) => {
    const raw = originalCoefficients[name]
    return Number.isFinite(Number(raw)) ? Number(raw) : 0
  })

  return {
    A: toNumberMatrix(A),
    b: toNumberVector(b),
    c: cOriginal,
    variableNames: variables.map(String),
    objectiveType,
  }
}

function toNumberMatrix(value) {
  return Array.isArray(value) ? value.map(toNumberVector) : []
}

function toNumberVector(value) {
  return Array.isArray(value) ? value.map((entry) => Number(entry)) : []
}

function normalizeObjectiveType(value = 'minimize') {
  return String(value).toLowerCase().startsWith('max') ? 'maximize' : 'minimize'
}
