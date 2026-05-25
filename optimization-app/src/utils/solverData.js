export function solverPayloadToSolverData(formulation) {
  const payload = formulation?.solver_payload || {}
  const standardForm = formulation?.standard_form || {}
  const matrixForm = formulation?.matrix_form || {}
  const variables = payload.variables || matrixForm.variables || []
  const A = payload.A_eq || standardForm.A_eq || matrixForm.A || []
  const b = payload.b_eq || standardForm.b_eq || matrixForm.b || []
  const c = payload.c || standardForm.c || matrixForm.c || []

  return {
    A: toNumberMatrix(A),
    b: toNumberVector(b),
    c: toNumberVector(c),
    variableNames: variables.map(String),
    objectiveType: normalizeObjectiveType(payload.objective_sense_original || formulation?.general_form?.objective?.sense),
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
