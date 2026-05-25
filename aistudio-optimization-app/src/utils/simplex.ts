import { SolverData } from '../types';

export interface SimplexIteration {
  iteration: number;
  phase: number;
  tableau: number[][]; // m + 1 rows, n + 1 columns
  basis: string[]; // Names of the basic variables for each constraint row
  headers: string[]; // Variable names for each column (excluding the RHS)
  objectiveValue: number;
  enteringVar?: string;
  leavingVar?: string;
  pivotRow?: number; // Index in the tableau rows (excluding header, so 1 to m)
  pivotCol?: number; // Index in the tableau columns
}

export interface SimplexResult {
  status: 'optimal' | 'infeasible' | 'unbounded' | 'max_iterations';
  optimalValue: number;
  solution: Record<string, number>;
  iterations: SimplexIteration[];
  shadowPrices: Record<string, number>;
  reducedCosts: Record<string, number>;
}

// EPSILON for floating point comparisons to avoid numerical instability
const EPS = 1e-9;

/**
 * Solves a Linear Program represented by SolverData using the Two-Phase Simplex Algorithm.
 * Standard form assumes:
 *   Optimize: c^T x
 *   Subject to: A x = b, x >= 0
 *   where b >= 0 (strictly non-negative)
 */
export function solveSimplex(data: SolverData, maxIterations = 50): SimplexResult {
  const { A, b, c, variableNames, objectiveType } = data;
  const m = A.length;       // Number of constraints
  const n = A[0].length;    // Number of variables in standard form (decision + slack/surplus)

  const isMinimize = objectiveType === 'minimize';
  // Adjust cost vector for maximization: minimize c^T x is equivalent to maximize -c^T x
  const adjustedC = isMinimize ? c.map(val => -val) : [...c];

  const iterations: SimplexIteration[] = [];
  let currentIteration = 0;

  // Clone A and b to avoid modifying source inputs
  const currentA = A.map(row => [...row]);
  const currentB = [...b];

  // If any b_i is negative, multiply the whole row by -1
  for (let i = 0; i < m; i++) {
    if (currentB[i] < 0) {
      currentB[i] = -currentB[i];
      for (let j = 0; j < n; j++) {
        currentA[i][j] = -currentA[i][j];
      }
    }
  }

  // --- PHASE 1 ---
  // To find an initial basic feasible solution, we add an artificial variable a_i to each constraint:
  //   A_i x + a_i = b_i
  // Phase 1 Objective: Maximize - \sum a_i (or minimize \sum a_i)
  // Let's build the Phase 1 Tableau:
  // Rows:
  //   Row 0: Phase 1 Objective (Max W = -sum a_i) -> 1 row
  //   Row 1: Phase 2 / Original Objective (Max Z = adjustedC^T x) -> 1 row
  //   Rows 2 to m+1: Constraints -> m rows
  // Columns:
  //   Cols 0 to n-1: Standard variables (x_1, s_1, etc.)
  //   Cols n to n+m-1: Artificial variables (a_1 to a_m)
  //   Col n+m: Constant (RHS)
  
  const numVars = n;
  const numArt = m;
  const totalCols = numVars + numArt + 1;
  const totalRows = m + 2; // Row 0 (Phase 1 Obj), Row 1 (Phase 2 Obj), Rows 2..m+1 (Constraints)

  const tab: number[][] = Array.from({ length: totalRows }, () => Array(totalCols).fill(0));

  // Initialize constraints
  // In the tableau, constraint row i corresponds to tab[2 + i]
  for (let i = 0; i < m; i++) {
    // Coefficients of original variables
    for (let j = 0; j < n; j++) {
      tab[2 + i][j] = currentA[i][j];
    }
    // Coefficients of artificial variables
    tab[2 + i][n + i] = 1;
    // RHS
    tab[2 + i][totalCols - 1] = currentB[i];
  }

  // Initialize Row 1: Phase 2 objective: Max Z = adjustedC^T x  ==>  Z - adjustedC^T x = 0
  // So coefficients for x_j in Row 1 are -adjustedC[j]
  for (let j = 0; j < n; j++) {
    tab[1][j] = -adjustedC[j];
  }

  // Initialize Row 0: Phase 1 objective: Max W = -sum(a_i)
  // We have W + sum(a_i) = 0.
  // We need to write W in terms of original variables by substituting a_i = b_i - sum_j(A_ij x_j).
  // W = -sum_i(b_i - sum_j(A_ij x_j)) = sum_j(sum_i(A_ij) x_j) - sum_i(b_i)
  // So W - sum_j(sum_i(A_ij) x_j) = -sum_i(b_i)
  // Coefficients of x_j in Row 0 is -sum_i(A_ij)
  // RHS of Row 0 is -sum_i(b_i)
  for (let j = 0; j < n; j++) {
    let sumA = 0;
    for (let i = 0; i < m; i++) {
      sumA += currentA[i][j];
    }
    tab[0][j] = -sumA;
  }
  let sumB = 0;
  for (let i = 0; i < m; i++) {
    sumB += currentB[i];
  }
  tab[0][totalCols - 1] = -sumB;

  // Basis variable tracker. Artificial variables start as the basis.
  const basis: string[] = [];
  for (let i = 0; i < m; i++) {
    basis.push(`a_${i + 1}`);
  }

  const colHeaders: string[] = [
    ...variableNames,
    ...Array.from({ length: m }, (_, i) => `a_${i + 1}`),
    'RHS'
  ];

  const getIterationTableau = (phase: number, pRow?: number, pCol?: number, ent?: string, leav?: string): SimplexIteration => {
    // Format current tableau for display
    return {
      iteration: currentIteration,
      phase,
      tableau: tab.map(row => [...row]),
      basis: [...basis],
      headers: colHeaders.slice(0, -1),
      objectiveValue: phase === 1 ? -tab[0][totalCols - 1] : tab[1][totalCols - 1],
      enteringVar: ent,
      leavingVar: leav,
      pivotRow: pRow,
      pivotCol: pCol
    };
  };

  // Helper pivot function
  const pivot = (pRow: number, pCol: number) => {
    const pVal = tab[pRow][pCol];
    // Normalize pivot row
    for (let j = 0; j < totalCols; j++) {
      tab[pRow][j] /= pVal;
    }
    // Eliminate pivot column in other rows
    for (let i = 0; i < totalRows; i++) {
      if (i !== pRow) {
        const factor = tab[i][pCol];
        for (let j = 0; j < totalCols; j++) {
          tab[i][j] -= factor * tab[pRow][j];
        }
      }
    }
  };

  // Run Phase 1
  let phase1Success = false;
  while (currentIteration < maxIterations) {
    // Find entering variable in Phase 1 (most negative in Row 0, index 0 to n+m-1)
    let minVal = -EPS;
    let enteringIdx = -1;
    // We can choose from all decision & artificial columns (0 to n+m-1)
    for (let j = 0; j < n + m; j++) {
      if (tab[0][j] < minVal) {
        minVal = tab[0][j];
        enteringIdx = j;
      }
    }

    if (enteringIdx === -1) {
      // Optimal for Phase 1 reached!
      const p1Obj = -tab[0][totalCols - 1];
      if (Math.abs(p1Obj) < 1e-4) {
        phase1Success = true;
      }
      iterations.push(getIterationTableau(1));
      break;
    }

    // Find leaving variable (ratio test on constraint rows 2 to m+1)
    let minRatio = Infinity;
    let leavingRowIdx = -1;
    const enteringColVal = enteringIdx;

    for (let i = 0; i < m; i++) {
      const rowIdx = 2 + i;
      const valInCol = tab[rowIdx][enteringColVal];
      if (valInCol > EPS) {
        const rhs = tab[rowIdx][totalCols - 1];
        const ratio = rhs / valInCol;
        if (ratio < minRatio) {
          minRatio = ratio;
          leavingRowIdx = rowIdx;
        }
      }
    }

    if (leavingRowIdx === -1) {
      // Phase 1 is unbounded (should usually not happen unless problem is structured strangely)
      iterations.push(getIterationTableau(1, undefined, enteringIdx, colHeaders[enteringIdx], 'None'));
      return {
        status: 'unbounded',
        optimalValue: 0,
        solution: {},
        iterations,
        shadowPrices: {},
        reducedCosts: {}
      };
    }

    const leavingVarName = basis[leavingRowIdx - 2];
    const enteringVarName = colHeaders[enteringIdx];

    iterations.push(getIterationTableau(1, leavingRowIdx, enteringIdx, enteringVarName, leavingVarName));

    // Update basis
    basis[leavingRowIdx - 2] = enteringVarName;

    // Pivot
    pivot(leavingRowIdx, enteringIdx);
    currentIteration++;
  }

  if (!phase1Success) {
    return {
      status: 'infeasible',
      optimalValue: 0,
      solution: {},
      iterations,
      shadowPrices: {},
      reducedCosts: {}
    };
  }

  // --- PHASE 2 ---
  // If we reach here, a B.F.S. has been found. We can drop Row 0 and dropping any columns with artificial variables that are non-basic
  // However, for simplicity of matrix indices, we can keep the tableau but strictly ignore Row 0 and any artificial columns (cols containing 'a_i')
  // We formulate Phase 2 using Row 1 as the objective function.
  let isPhase2Optimal = false;

  while (currentIteration < maxIterations) {
    // Find entering variable for original objective (most negative in Row 1 among original/slack variables, cols 0 to n-1)
    let minVal = -EPS;
    let enteringIdx = -1;

    for (let j = 0; j < n; j++) {
      if (tab[1][j] < minVal) {
        minVal = tab[1][j];
        enteringIdx = j;
      }
    }

    if (enteringIdx === -1) {
      isPhase2Optimal = true;
      iterations.push(getIterationTableau(2));
      break;
    }

    // Ratio test (rows 2 to m+1, cols enteringIdx)
    let minRatio = Infinity;
    let leavingRowIdx = -1;

    for (let i = 0; i < m; i++) {
      const rowIdx = 2 + i;
      const valInCol = tab[rowIdx][enteringIdx];
      if (valInCol > EPS) {
        const rhs = tab[rowIdx][totalCols - 1];
        const ratio = rhs / valInCol;
        if (ratio < minRatio) {
          minRatio = ratio;
          leavingRowIdx = rowIdx;
        }
      }
    }

    if (leavingRowIdx === -1) {
      // Unbounded in Phase 2
      iterations.push(getIterationTableau(2, undefined, enteringIdx, colHeaders[enteringIdx], 'None'));
      return {
        status: 'unbounded',
        optimalValue: Infinity,
        solution: {},
        iterations,
        shadowPrices: {},
        reducedCosts: {}
      };
    }

    const leavingVarName = basis[leavingRowIdx - 2];
    const enteringVarName = colHeaders[enteringIdx];

    iterations.push(getIterationTableau(2, leavingRowIdx, enteringIdx, enteringVarName, leavingVarName));

    // Update basis
    basis[leavingRowIdx - 2] = enteringVarName;

    // Pivot
    pivot(leavingRowIdx, enteringIdx);
    currentIteration++;
  }

  if (!isPhase2Optimal) {
    return {
      status: 'max_iterations',
      optimalValue: isMinimize ? -tab[1][totalCols - 1] : tab[1][totalCols - 1],
      solution: {},
      iterations,
      shadowPrices: {},
      reducedCosts: {}
    };
  }

  // Extract solution
  const solution: Record<string, number> = {};
  // Initialize all standard variables with zero
  for (let j = 0; j < n; j++) {
    solution[variableNames[j]] = 0;
  }
  // Basic variable values
  for (let i = 0; i < m; i++) {
    const varName = basis[i];
    // Check if basic variable is one of the standard variables (not artificial)
    if (variableNames.includes(varName)) {
      solution[varName] = Math.max(0, tab[2 + i][totalCols - 1]);
    }
  }

  // Optimal Objective Value
  // Row 1's RHS represents the finalized value of Max Z.
  // Z = tab[1][totalCols - 1].
  // If minimize: Min Z = -Max Z = -tab[1][totalCols - 1]
  const optimalValue = isMinimize ? -tab[1][totalCols - 1] : tab[1][totalCols - 1];

  // Shadow prices:
  // Shadow prices correspond to the updated objective coefficients of the slack/surplus variables in the final tableau.
  // Let's identify which variableNames are slacks or surpluses. Usually slack or surplus are variables like s_1, s_2.
  // The shadow price of a constraint is the marginal change in objective value per unit increase in RHS.
  // In simplex, the reduced cost of the slack variable is equal to the shadow price of the corresponding constraint (adjusted by sign).
  const shadowPrices: Record<string, number> = {};
  const reducedCosts: Record<string, number> = {};

  // Find reduced costs for standard variables
  for (let j = 0; j < n; j++) {
    const varName = variableNames[j];
    // Coefficients in Row 1 are (c_j - z_j), which is the negative of the reduced cost
    // For Max Z, reduced cost = -tab[1][j]. If basic, it is of course 0.
    const rCost = tab[1][j];
    reducedCosts[varName] = Math.abs(rCost) < EPS ? 0 : rCost;

    // Is it a slack variable? E.g., named s_1, s_2, s_3
    if (varName.startsWith('s_')) {
      // In a dual solver framework: shadow price for constraint i corresponds to Row 1 coeff of slack s_i.
      // Let's map s_i directly to the constraint shadow price.
      // Note: Shadow price is the premium of the limit.
      const index = parseInt(varName.split('_')[1], 10);
      if (!isNaN(index)) {
        shadowPrices[`Constraint ${index}`] = Math.abs(tab[1][j]) < EPS ? 0 : tab[1][j] * (isMinimize ? -1 : 1);
      }
    }
  }

  // Fallback map if no slack variables were identified (e.g. they are equalities)
  for (let i = 1; i <= m; i++) {
    const key = `Constraint ${i}`;
    if (!(key in shadowPrices)) {
      // For equalities, the shadow price corresponds to the coefficients of artificial variables or dual values.
      // We can approximate or map it.
      shadowPrices[key] = 0;
    }
  }

  return {
    status: 'optimal',
    optimalValue,
    solution,
    iterations,
    shadowPrices,
    reducedCosts
  };
}
