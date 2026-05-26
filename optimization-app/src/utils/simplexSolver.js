const EPSILON = 1e-9
const MAX_ITERATIONS = 500

export function solveSimplex(solverData) {
  const normalized = normalizeSolverData(solverData)
  const { A, b, variableNames, objectiveType } = normalized
  const rowCount = A.length
  const variableCount = normalized.c.length

  // SolverData.c holds the ORIGINAL (sign-preserved) coefficients. The
  // two-phase Simplex below minimizes `c_min^T x`, so we flip sign for
  // maximization here rather than baking that flip into the export.
  const objectiveSign = objectiveType === 'maximize' ? -1 : 1
  const c = normalized.c.map((value) => value * objectiveSign)

  if (rowCount === 0) {
    return solveUnconstrained({ ...normalized, c })
  }

  const rows = A.map((row, rowIndex) => {
    const multiplier = b[rowIndex] < 0 ? -1 : 1
    return [
      ...row.map((value) => value * multiplier),
      ...Array.from({ length: rowCount }, (_, artificialIndex) => (artificialIndex === rowIndex ? 1 : 0)),
    ]
  })
  const rhs = b.map((value) => Math.abs(value))
  const totalColumns = variableCount + rowCount
  const basis = Array.from({ length: rowCount }, (_, index) => variableCount + index)

  const phaseOneCosts = [
    ...Array(variableCount).fill(0),
    ...Array(rowCount).fill(-1),
  ]
  const phaseOne = runPrimalSimplex({
    rows,
    rhs,
    basis,
    costs: phaseOneCosts,
    allowedColumns: Array.from({ length: totalColumns }, (_, index) => index),
  })

  if (phaseOne.status !== 'optimal') {
    return buildTerminalResult('infeasible', normalized, phaseOne, null, 'Phase I could not find a feasible basis.')
  }

  if (phaseOne.objectiveValue < -1e-7) {
    return buildTerminalResult('infeasible', normalized, phaseOne, null, 'The Phase I artificial-variable objective did not reach zero.')
  }

  removeArtificialBasis(rows, rhs, basis, variableCount)

  const phaseTwoCosts = [
    ...c.map((value) => -value),
    ...Array(rowCount).fill(0),
  ]
  const phaseTwo = runPrimalSimplex({
    rows,
    rhs,
    basis,
    costs: phaseTwoCosts,
    allowedColumns: Array.from({ length: variableCount }, (_, index) => index),
  })

  if (phaseTwo.status !== 'optimal') {
    return buildTerminalResult(phaseTwo.status, normalized, phaseOne, phaseTwo, phaseTwo.message)
  }

  const solution = Array(totalColumns).fill(0)
  basis.forEach((basisColumn, rowIndex) => {
    solution[basisColumn] = cleanNumber(rhs[rowIndex])
  })

  const variableValues = Object.fromEntries(
    variableNames.map((name, index) => [name, cleanNumber(solution[index] || 0)]),
  )
  const residual = maxResidual(A, b, solution.slice(0, variableCount))

  if (residual > 1e-7) {
    return {
      method: 'Two-phase Simplex',
      status: 'infeasible',
      objectiveType,
      objectiveValue: null,
      solverObjectiveValue: null,
      variableValues,
      basis: basis.map((column) => column < variableCount ? variableNames[column] : `artificial_${column - variableCount + 1}`),
      iterations: phaseOne.iterations + phaseTwo.iterations,
      phaseOneObjective: cleanNumber(phaseOne.objectiveValue),
      message: `Final basis failed the Ax=b feasibility check; max residual ${cleanNumber(residual)}.`,
    }
  }

  const solverObjectiveValue = cleanNumber(dot(c, solution.slice(0, variableCount)))
  const objectiveValue = cleanNumber(objectiveType === 'maximize' ? -solverObjectiveValue : solverObjectiveValue)

  return {
    method: 'Two-phase Simplex',
    status: 'optimal',
    objectiveType,
    objectiveValue,
    solverObjectiveValue,
    variableValues,
    basis: basis.map((column) => column < variableCount ? variableNames[column] : `artificial_${column - variableCount + 1}`),
    iterations: phaseOne.iterations + phaseTwo.iterations,
    phaseOneObjective: cleanNumber(phaseOne.objectiveValue),
    message: 'Solved locally from the SolverData equality form.',
  }
}

function runPrimalSimplex({ rows, rhs, basis, costs, allowedColumns }) {
  let iterations = 0

  while (iterations < MAX_ITERATIONS) {
    const entering = chooseEnteringColumn(rows, basis, costs, allowedColumns)
    if (entering === null) {
      return {
        status: 'optimal',
        iterations,
        objectiveValue: cleanNumber(currentObjectiveValue(rhs, basis, costs)),
        message: 'Optimality conditions satisfied.',
      }
    }

    const leaving = chooseLeavingRow(rows, rhs, entering)
    if (leaving === null) {
      return {
        status: 'unbounded',
        iterations,
        objectiveValue: cleanNumber(currentObjectiveValue(rhs, basis, costs)),
        message: 'No positive pivot column entries were available for the entering variable.',
      }
    }

    pivot(rows, rhs, basis, leaving, entering)
    iterations += 1
  }

  return {
    status: 'iteration_limit',
    iterations,
    objectiveValue: cleanNumber(currentObjectiveValue(rhs, basis, costs)),
    message: `Stopped after ${MAX_ITERATIONS} simplex pivots.`,
  }
}

function chooseEnteringColumn(rows, basis, costs, allowedColumns) {
  const basisSet = new Set(basis)
  let bestColumn = null
  let bestReducedCost = EPSILON

  allowedColumns.forEach((columnIndex) => {
    if (basisSet.has(columnIndex)) return

    const reducedCost = costs[columnIndex] - rows.reduce(
      (sum, row, rowIndex) => sum + costs[basis[rowIndex]] * row[columnIndex],
      0,
    )

    if (reducedCost > bestReducedCost) {
      bestReducedCost = reducedCost
      bestColumn = columnIndex
    }
  })

  return bestColumn
}

function chooseLeavingRow(rows, rhs, enteringColumn) {
  let bestRow = null
  let bestRatio = Infinity

  rows.forEach((row, rowIndex) => {
    const coefficient = row[enteringColumn]
    if (coefficient <= EPSILON) return

    const ratio = rhs[rowIndex] / coefficient
    if (ratio < bestRatio - EPSILON) {
      bestRatio = ratio
      bestRow = rowIndex
    }
  })

  return bestRow
}

function removeArtificialBasis(rows, rhs, basis, originalColumnCount) {
  for (let rowIndex = 0; rowIndex < basis.length; rowIndex += 1) {
    if (basis[rowIndex] < originalColumnCount) continue

    const basisSet = new Set(basis)
    const replacementColumn = rows[rowIndex].findIndex(
      (coefficient, columnIndex) => (
        columnIndex < originalColumnCount
        && !basisSet.has(columnIndex)
        && Math.abs(coefficient) > EPSILON
      ),
    )

    if (replacementColumn >= 0) {
      pivot(rows, rhs, basis, rowIndex, replacementColumn)
    }
  }
}

function pivot(rows, rhs, basis, leavingRow, enteringColumn) {
  const pivotValue = rows[leavingRow][enteringColumn]

  rows[leavingRow] = rows[leavingRow].map((value) => value / pivotValue)
  rhs[leavingRow] /= pivotValue

  rows.forEach((row, rowIndex) => {
    if (rowIndex === leavingRow) return

    const factor = row[enteringColumn]
    if (Math.abs(factor) <= EPSILON) return

    rows[rowIndex] = row.map((value, columnIndex) => value - factor * rows[leavingRow][columnIndex])
    rhs[rowIndex] -= factor * rhs[leavingRow]
  })

  basis[leavingRow] = enteringColumn
}

function normalizeSolverData(solverData) {
  const A = ensureMatrix(solverData?.A)
  const b = ensureVector(solverData?.b)
  const c = ensureVector(solverData?.c)
  const variableNames = Array.isArray(solverData?.variableNames)
    ? solverData.variableNames.map(String)
    : c.map((_, index) => `x_${index + 1}`)
  const objectiveType = solverData?.objectiveType === 'maximize' ? 'maximize' : 'minimize'

  if (A.length !== b.length) {
    throw new Error('SolverData row count mismatch: A rows must match b length.')
  }

  if (variableNames.length !== c.length) {
    throw new Error('SolverData variable count mismatch: variableNames must match c length.')
  }

  A.forEach((row, rowIndex) => {
    if (row.length !== c.length) {
      throw new Error(`SolverData column count mismatch in A row ${rowIndex + 1}.`)
    }
  })

  return { A, b, c, variableNames, objectiveType }
}

function ensureMatrix(value) {
  if (!Array.isArray(value)) throw new Error('SolverData.A must be a number matrix.')
  return value.map(ensureVector)
}

function ensureVector(value) {
  if (!Array.isArray(value)) throw new Error('SolverData vectors must be arrays.')
  return value.map((entry) => {
    const number = Number(entry)
    if (!Number.isFinite(number)) throw new Error('SolverData contains a non-finite numeric value.')
    return number
  })
}

function solveUnconstrained({ c, variableNames, objectiveType }) {
  const improvingIndex = c.findIndex((coefficient) => coefficient < -EPSILON)
  if (improvingIndex >= 0) {
    return {
      method: 'Two-phase Simplex',
      status: 'unbounded',
      objectiveType,
      objectiveValue: null,
      solverObjectiveValue: null,
      variableValues: Object.fromEntries(variableNames.map((name) => [name, 0])),
      basis: [],
      iterations: 0,
      phaseOneObjective: 0,
      message: `Variable ${variableNames[improvingIndex]} can improve the objective without a binding constraint.`,
    }
  }

  return {
    method: 'Two-phase Simplex',
    status: 'optimal',
    objectiveType,
    objectiveValue: 0,
    solverObjectiveValue: 0,
    variableValues: Object.fromEntries(variableNames.map((name) => [name, 0])),
    basis: [],
    iterations: 0,
    phaseOneObjective: 0,
    message: 'No constraints and no improving negative reduced costs.',
  }
}

function buildTerminalResult(status, solverData, phaseOne, phaseTwo, message) {
  return {
    method: 'Two-phase Simplex',
    status,
    objectiveType: solverData.objectiveType,
    objectiveValue: null,
    solverObjectiveValue: null,
    variableValues: Object.fromEntries(solverData.variableNames.map((name) => [name, null])),
    basis: [],
    iterations: (phaseOne?.iterations || 0) + (phaseTwo?.iterations || 0),
    phaseOneObjective: phaseOne ? cleanNumber(phaseOne.objectiveValue) : null,
    message,
  }
}

function currentObjectiveValue(rhs, basis, costs) {
  return rhs.reduce((sum, value, rowIndex) => sum + costs[basis[rowIndex]] * value, 0)
}

function dot(left, right) {
  return left.reduce((sum, value, index) => sum + value * (right[index] || 0), 0)
}

function maxResidual(A, b, solution) {
  return A.reduce((maximum, row, rowIndex) => {
    const residual = Math.abs(dot(row, solution) - b[rowIndex])
    return Math.max(maximum, residual)
  }, 0)
}

function cleanNumber(value) {
  return Math.abs(value) <= EPSILON ? 0 : Number(value.toFixed(8))
}
