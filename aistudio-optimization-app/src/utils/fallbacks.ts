import { LPFormulation } from '../types';

export const FALLBACK_MODELS: Record<'product_mix' | 'diet_problem' | 'transportation_problem', LPFormulation> = {
  product_mix: {
    metadata: {
      status: "success",
      formulation_type: "linear_program",
      confidence: 1.0,
      warnings: [],
      assumptions: [
        "Proportionality: The profit and resources spent scale linearly with the number of chairs and tables produced.",
        "Additivity: The total hours spent on both items is the sum of hours spent on each.",
        "Divisibility: Fractional production values are allowed (relaxed from integer bounds for LP compatibility).",
        "Certainty: Resource parameters and profit coefficients are known and constant."
      ],
      unsupported_features: [
        "Integer requirement: In practice, table and chair production yields discrete counts. This model uses a standard linear relaxation."
      ]
    },
    original_problem: {
      raw_text: "A factory produces chairs and tables. Each chair earns $40 profit and each table earns $70 profit. A chair requires 2 labor hours and 1 unit of wood. A table requires 3 labor hours and 4 units of wood. The factory has 120 labor hours and 100 units of wood available. Formulate an LP to maximize profit.",
      interpreted_goal: "Maximize total production profits from chairs and tables under carpentry time and wood supply resource caps.",
      interpreted_context: "Industrial manufacturing optimization model."
    },
    decision_variables: [
      {
        name: "x_1",
        symbol: "x_{\\text{chair}}",
        description: "Number of chairs to produce",
        unit: "units",
        lower_bound: 0,
        upper_bound: null,
        sign: "nonnegative"
      },
      {
        name: "x_2",
        symbol: "x_{\\text{table}}",
        description: "Number of tables to produce",
        unit: "units",
        lower_bound: 0,
        upper_bound: null,
        sign: "nonnegative"
      }
    ],
    general_form: {
      objective: {
        sense: "maximize",
        expression_latex: "40x_1 + 70x_2",
        coefficients: { "x_1": 40, "x_2": 70 },
        constant: 0,
        explanation: "Maximize total profit where producing each chair yields $40 and producing each table yields $70."
      },
      constraints: [
        {
          id: "const_labor",
          name: "Labor Hour Capacity limit",
          expression_latex: "2x_1 + 3x_2 \\le 120",
          coefficients: { "x_1": 2, "x_2": 3 },
          operator: "<=",
          rhs: 120,
          unit: "hours",
          explanation: "Total labor hours required for chairs (2 hours each) and tables (3 hours each) cannot exceed 120 hours."
        },
        {
          id: "const_wood",
          name: "Wood Supply material limit",
          expression_latex: "x_1 + 4x_2 \\le 100",
          coefficients: { "x_1": 1, "x_2": 4 },
          operator: "<=",
          rhs: 100,
          unit: "units",
          explanation: "Total wood volume units consumed by chairs (1 unit each) and tables (4 units each) cannot exceed 100 units."
        }
      ],
      bounds: [
        {
          variable: "x_1",
          expression_latex: "x_1 \\ge 0",
          explanation: "Cannot produce a negative quantity of chairs."
        },
        {
          variable: "x_2",
          expression_latex: "x_2 \\ge 0",
          explanation: "Cannot produce a negative quantity of tables."
        }
      ],
      latex_block: "\\begin{aligned}\n\\text{Maximize } & z = 40x_1 + 70x_2 \\\\\n\\text{subject to } & 2x_1 + 3x_2 \\le 120 \\quad \\text{(Labor Hours Constraint)} \\\\\n& x_1 + 4x_2 \\le 100 \\quad \\text{(Wood Vol Constraint)} \\\\\n& x_1, x_2 \\ge 0\n\\end{aligned}"
    },
    transformations: [
      {
        step_number: 1,
        title: "Negate Objective Function to Minimization",
        description: "Convert the maximization objective to minimization by multiplying coefficients by -1: minimize -40x_1 - 70x_2.",
        before_latex: "40x_1 + 70x_2",
        after_latex: "-40x_1 - 70x_2",
        affected_constraints: [],
        introduced_variables: []
      },
      {
        step_number: 2,
        title: "Introduce Slacks for Constraints",
        description: "Introduce non-negative slack variables s_1 and s_2 for the Less-Than-or-Equal-To constraints to balance the mathematical equations.",
        before_latex: "2x_1 + 3x_2 \\le 120 \\\\\n x_1 + 4x_2 \\le 100",
        after_latex: "2x_1 + 3x_2 + s_1 = 120 \\\\\n x_1 + 4x_2 + s_2 = 100",
        affected_constraints: ["const_labor", "const_wood"],
        introduced_variables: ["s_1", "s_2"]
      }
    ],
    standard_form: {
      convention: "minimize c^T x subject to A_eq x = b, x >= 0",
      variables_ordered: [
        { name: "x_1", symbol: "x_1", source: "original", description: "Chairs produced" },
        { name: "x_2", symbol: "x_2", source: "original", description: "Tables produced" },
        { name: "s_1", symbol: "s_1", source: "slack", description: "Slack labor hours" },
        { name: "s_2", symbol: "s_2", source: "slack", description: "Slack wood units" }
      ],
      objective: {
        sense: "minimize",
        c: [-40, -70, 0, 0],
        expression_latex: "-40x_1 - 70x_2 + 0s_1 + 0s_2"
      },
      constraints: [
        {
          id: "const_labor",
          expression_latex: "2x_1 + 3x_2 + s_1 = 120",
          coefficients_ordered: [2, 3, 1, 0],
          rhs: 120,
          source_constraint_id: "const_labor"
        },
        {
          id: "const_wood",
          expression_latex: "x_1 + 4x_2 + s_2 = 100",
          coefficients_ordered: [1, 4, 0, 1],
          rhs: 100,
          source_constraint_id: "const_wood"
        }
      ],
      A_eq: [
        [2, 3, 1, 0],
        [1, 4, 0, 1]
      ],
      b_eq: [120, 100],
      c: [-40, -70, 0, 0],
      latex_block: "\\begin{aligned}\n\\text{Minimize } & z' = -40x_1 - 70x_2 + 0s_1 + 0s_2 \\\\\n\\text{subject to } & 2x_1 + 3x_2 + s_1 = 120 \\\\\n& x_1 + 4x_2 + s_2 = 100 \\\\\n& x_1, x_2, s_1, s_2 \\ge 0\n\\end{aligned}"
    },
    matrix_form: {
      variable_vector_latex: "\\begin{pmatrix} x_1 \\\\ x_2 \\\\ s_1 \\\\ s_2 \\end{pmatrix}",
      objective_vector_latex: "\\begin{pmatrix} -40 \\\\ -70 \\\\ 0 \\\\ 0 \\end{pmatrix}",
      matrix_latex: "\\begin{pmatrix} 2 & 3 & 1 & 0 \\\\ 1 & 4 & 0 & 1 \\end{pmatrix}",
      rhs_vector_latex: "\\begin{pmatrix} 120 \\\\ 100 \\end{pmatrix}",
      compact_latex: "\\mathbf{A} \\mathbf{x} = \\mathbf{b}",
      variables: ["x_1", "x_2", "s_1", "s_2"],
      A: [
        [2, 3, 1, 0],
        [1, 4, 0, 1]
      ],
      b: [120, 100],
      c: [-40, -70, 0, 0]
    },
    solver_payload: {
      ready_for_simplex: true,
      ready_for_ipm: true,
      requires_phase_one: false,
      has_artificial_variables: false,
      objective_sense_original: "maximize",
      objective_sense_solver: "minimize",
      variables: ["x_1", "x_2", "s_1", "s_2"],
      A_eq: [
        [2, 3, 1, 0],
        [1, 4, 0, 1]
      ],
      b_eq: [120, 100],
      c: [-40, -70, 0, 0],
      original_variable_indices: { "x_1": 0, "x_2": 1 },
      slack_variable_indices: { "s_1": 2, "s_2": 3 },
      surplus_variable_indices: {},
      artificial_variable_indices: {},
      notes_for_solver_integration: [
        "Since this standard form has a positive identity basis in the slack columns [s1, s2], Phase I Simplex is unnecessary.",
        "We can execute standard Primal Simplex immediately, selecting s_1 and s_2 as the initial basic variables.",
        "The optimal BFS is immediately available using traditional simplex tableaus or standard interior point method algorithms."
      ]
    },
    verification_plan: {
      ortools_compatible: true,
      ortools_notes: [
        "Fully linear configuration can be modeled directly using pywraplp.Solver.CreateSolver('GLOP').",
        "Add continuous variables x1, x2 bounded from below at 0.",
        "Add linear sum constraints matching standard coefficients A_eq."
      ],
      expected_solver_result_shape: {
        objective_value: "number",
        variable_values: "Record<string, number>",
        solver_status: "string"
      }
    }
  },
  diet_problem: {
    metadata: {
      status: "success",
      formulation_type: "linear_program",
      confidence: 0.98,
      warnings: [],
      assumptions: [
        "Chicken and rice can be purchased in exact real values (no integer restriction).",
        "Dietary content (protein/fat) behaves additively."
      ],
      unsupported_features: []
    },
    original_problem: {
      raw_text: "Create a minimum-cost diet using chicken and rice. Chicken costs $4 per serving and rice costs $1 per serving. Each serving of chicken has 30 grams of protein and 5 grams of fat. Each serving of rice has 4 grams of protein and 1 gram of fat. The diet needs at least 60 grams of protein and at most 20 grams of fat.",
      interpreted_goal: "Minimize dietary costs while fulfilling minimum daily protein and maximum fat limits.",
      interpreted_context: "Diet planning cost minimization standard."
    },
    decision_variables: [
      {
        name: "x_1",
        symbol: "x_{\\text{chicken}}",
        description: "Servings of chicken",
        unit: "servings",
        lower_bound: 0,
        upper_bound: null,
        sign: "nonnegative"
      },
      {
        name: "x_2",
        symbol: "x_{\\text{rice}}",
        description: "Servings of rice",
        unit: "servings",
        lower_bound: 0,
        upper_bound: null,
        sign: "nonnegative"
      }
    ],
    general_form: {
      objective: {
        sense: "minimize",
        expression_latex: "4x_1 + x_2",
        coefficients: { "x_1": 4, "x_2": 1 },
        constant: 0,
        explanation: "Minimize daily diet cost where chicken costs $4 per serving and rice costs $1 per serving."
      },
      constraints: [
        {
          id: "const_protein",
          name: "Minimum Protein Requirement",
          expression_latex: "30x_1 + 4x_2 \\ge 60",
          coefficients: { "x_1": 30, "x_2": 4 },
          operator: ">=",
          rhs: 60,
          unit: "grams",
          explanation: "Total protein must be at least 60 grams daily."
        },
        {
          id: "const_fat",
          name: "Maximum Fat Budget Limit",
          expression_latex: "5x_1 + x_2 \\le 20",
          coefficients: { "x_1": 5, "x_2": 1 },
          operator: "<=",
          rhs: 20,
          unit: "grams",
          explanation: "Total fat intake cannot exceed 20 grams daily."
        }
      ],
      bounds: [
        {
          variable: "x_1",
          expression_latex: "x_1 \\ge 0",
          explanation: "Cannot consume negative chicken servings."
        },
        {
          variable: "x_2",
          expression_latex: "x_2 \\ge 0",
          explanation: "Cannot consume negative rice servings."
        }
      ],
      latex_block: "\\begin{aligned}\n\\text{Minimize } & z = 4x_1 + x_2 \\\\\n\\text{subject to } & 30x_1 + 4x_2 \\ge 60 \\quad \\text{(Protein intake)} \\\\\n& 5x_1 + x_2 \\le 20 \\quad \\text{(Fat ceiling)} \\\\\n& x_1, x_2 \\ge 0\n\\end{aligned}"
    },
    transformations: [
      {
        step_number: 1,
        title: "Keep Objective Function Since It Is Already Minimization",
        description: "Objective is already minimization, hence coefficients remain unchanged: minimize 4x_1 + x_2.",
        before_latex: "4x_1 + x_2",
        after_latex: "4x_1 + x_2",
        affected_constraints: [],
        introduced_variables: []
      },
      {
        step_number: 2,
        title: "Incorporate Surplus and Slack Parameters",
        description: "Subtract positive surplus variable s_1 from the protein constraint (lower bound >=), and add slack variable s_2 to the fat constraint (upper bound <=).",
        before_latex: "30x_1 + 4x_2 \\ge 60 \\\\\n 5x_1 + x_2 \\le 20",
        after_latex: "30x_1 + 4x_2 - s_1 = 60 \\\\\n 5x_1 + x_2 + s_2 = 20",
        affected_constraints: ["const_protein", "const_fat"],
        introduced_variables: ["s_1", "s_2"]
      }
    ],
    standard_form: {
      convention: "minimize c^T x subject to A_eq x = b, x >= 0",
      variables_ordered: [
        { name: "x_1", symbol: "x_1", source: "original", description: "Chicken servings" },
        { name: "x_2", symbol: "x_2", source: "original", description: "Rice servings" },
        { name: "s_1", symbol: "s_1", source: "surplus", description: "Surplus protein grams" },
        { name: "s_2", symbol: "s_2", source: "slack", description: "Slack fat grams" }
      ],
      objective: {
        sense: "minimize",
        c: [4, 1, 0, 0],
        expression_latex: "4x_1 + x_2 + 0s_1 + 0s_2"
      },
      constraints: [
        {
          id: "const_protein",
          expression_latex: "30x_1 + 4x_2 - s_1 = 60",
          coefficients_ordered: [30, 4, -1, 0],
          rhs: 60,
          source_constraint_id: "const_protein"
        },
        {
          id: "const_fat",
          expression_latex: "5x_1 + x_2 + s_2 = 20",
          coefficients_ordered: [5, 1, 0, 1],
          rhs: 20,
          source_constraint_id: "const_fat"
        }
      ],
      A_eq: [
        [30, 4, -1, 0],
        [5, 1, 0, 1]
      ],
      b_eq: [60, 20],
      c: [4, 1, 0, 0],
      latex_block: "\\begin{aligned}\n\\text{Minimize } & z = 4x_1 + x_2 + 0s_1 + 0s_2 \\\\\n\\text{subject to } & 30x_1 + 4x_2 - s_1 = 60 \\\\\n& 5x_1 + x_2 + s_2 = 20 \\\\\n& x_1, x_2, s_1, s_2 \\ge 0\n\\end{aligned}"
    },
    matrix_form: {
      variable_vector_latex: "\\begin{pmatrix} x_1 \\\\ x_2 \\\\ s_1 \\\\ s_2 \\end{pmatrix}",
      objective_vector_latex: "\\begin{pmatrix} 4 \\\\ 1 \\\\ 0 \\\\ 0 \\end{pmatrix}",
      matrix_latex: "\\begin{pmatrix} 30 & 4 & -1 & 0 \\\\ 5 & 1 & 0 & 1 \\end{pmatrix}",
      rhs_vector_latex: "\\begin{pmatrix} 60 \\\\ 20 \\end{pmatrix}",
      compact_latex: "\\mathbf{A} \\mathbf{x} = \\mathbf{b}",
      variables: ["x_1", "x_2", "s_1", "s_2"],
      A: [
        [30, 4, -1, 0],
        [5, 1, 0, 1]
      ],
      b: [60, 20],
      c: [4, 1, 0, 0]
    },
    solver_payload: {
      ready_for_simplex: true,
      ready_for_ipm: true,
      requires_phase_one: true,
      has_artificial_variables: true,
      objective_sense_original: "minimize",
      objective_sense_solver: "minimize",
      variables: ["x_1", "x_2", "s_1", "s_2"],
      A_eq: [
        [30, 4, -1, 0],
        [5, 1, 0, 1]
      ],
      b_eq: [60, 20],
      c: [4, 1, 0, 0],
      original_variable_indices: { "x_1": 0, "x_2": 1 },
      slack_variable_indices: { "s_2": 3 },
      surplus_variable_indices: { "s_1": 2 },
      artificial_variable_indices: { "a_1": 4 },
      notes_for_solver_integration: [
        "Contains a surplus variable s_1 with a coefficient of -1, preventing an initial identity basis.",
        "An artificial variable (a_1) with weight +1 is inserted into the protein constraint to run Phase I Simplex.",
        "Alternatively, Big-M approach or Interior Point dual-barrier methods can be applied directly."
      ]
    },
    verification_plan: {
      ortools_compatible: true,
      ortools_notes: [
        "Model easily validated using the standard OR-Tools GLOP optimization wrapper code."
      ],
      expected_solver_result_shape: {
        objective_value: "number",
        variable_values: "Record<string, number>",
        solver_status: "string"
      }
    }
  },
  transportation_problem: {
    metadata: {
      status: "success",
      formulation_type: "linear_program",
      confidence: 1.0,
      warnings: [],
      assumptions: [
        "Total shipped units can be fractional.",
        "The supply capacity at both warehouses is hard-capped.",
        "Sourcing and shipping occurs without intermediate loss or unit shrinkage."
      ],
      unsupported_features: []
    },
    original_problem: {
      raw_text: "A company ships products from two warehouses to three stores. Warehouse 1 has 80 units and Warehouse 2 has 120 units. Store A needs 50 units, Store B needs 70 units, and Store C needs 80 units. Shipping costs are 4, 6, and 8 from Warehouse 1, and 5, 4, and 3 from Warehouse 2. Formulate a minimum-cost LP.",
      interpreted_goal: "Minimize total product transport costs from Warehouses (1, 2) to Stores (A, B, C) honoring supply boundaries and satisfying shop demand targets.",
      interpreted_context: "Transportation logistics model."
    },
    decision_variables: [
      { name: "x_1", symbol: "x_{11}", description: "Units shipped from Warehouse 1 to Store A", unit: "units", lower_bound: 0, upper_bound: null, sign: "nonnegative" },
      { name: "x_2", symbol: "x_{12}", description: "Units shipped from Warehouse 1 to Store B", unit: "units", lower_bound: 0, upper_bound: null, sign: "nonnegative" },
      { name: "x_3", symbol: "x_{13}", description: "Units shipped from Warehouse 1 to Store C", unit: "units", lower_bound: 0, upper_bound: null, sign: "nonnegative" },
      { name: "x_4", symbol: "x_{21}", description: "Units shipped from Warehouse 2 to Store A", unit: "units", lower_bound: 0, upper_bound: null, sign: "nonnegative" },
      { name: "x_5", symbol: "x_{22}", description: "Units shipped from Warehouse 2 to Store B", unit: "units", lower_bound: 0, upper_bound: null, sign: "nonnegative" },
      { name: "x_6", symbol: "x_{23}", description: "Units shipped from Warehouse 2 to Store C", unit: "units", lower_bound: 0, upper_bound: null, sign: "nonnegative" }
    ],
    general_form: {
      objective: {
        sense: "minimize",
        expression_latex: "4x_1 + 6x_2 + 8x_3 + 5x_4 + 4x_5 + 3x_6",
        coefficients: { "x_1": 4, "x_2": 6, "x_3": 8, "x_4": 5, "x_5": 4, "x_6": 3 },
        constant: 0,
        explanation: "Minimize overall shipping cost, sum of cost-per-unit multiplied by transfer counts."
      },
      constraints: [
        { id: "const_supply1", name: "Warehouse 1 Capacity Ceiling", expression_latex: "x_1 + x_2 + x_3 \\le 80", coefficients: { "x_1": 1, "x_2": 1, "x_3": 1 }, operator: "<=", rhs: 80, unit: "units", explanation: "Total shipped from Warehouse 1 cannot exceed its supply of 80." },
        { id: "const_supply2", name: "Warehouse 2 Capacity Ceiling", expression_latex: "x_4 + x_5 + x_6 \\le 120", coefficients: { "x_4": 1, "x_5": 1, "x_6": 1 }, operator: "<=", rhs: 120, unit: "units", explanation: "Total shipped from Warehouse 2 cannot exceed its supply of 120." },
        { id: "const_demandA", name: "Store A Demand Guarantee", expression_latex: "x_1 + x_4 \\ge 50", coefficients: { "x_1": 1, "x_4": 1 }, operator: ">=", rhs: 50, unit: "units", explanation: "At least 50 units must be supplied to Store A." },
        { id: "const_demandB", name: "Store B Demand Guarantee", expression_latex: "x_2 + x_5 \\ge 70", coefficients: { "x_2": 1, "x_5": 1 }, operator: ">=", rhs: 70, unit: "units", explanation: "At least 70 units must be supplied to Store B." },
        { id: "const_demandC", name: "Store C Demand Guarantee", expression_latex: "x_3 + x_6 \\ge 80", coefficients: { "x_3": 1, "x_6": 1 }, operator: ">=", rhs: 80, unit: "units", explanation: "At least 80 units must be supplied to Store C." }
      ],
      bounds: [
        { variable: "x_1", expression_latex: "x_1 \\ge 0", explanation: "Cannot ship a negative number of units from W1 to Store A." },
        { variable: "x_2", expression_latex: "x_2 \\ge 0", explanation: "Cannot ship a negative number of units from W1 to Store B." },
        { variable: "x_3", expression_latex: "x_3 \\ge 0", explanation: "Cannot ship a negative number of units from W1 to Store C." },
        { variable: "x_4", expression_latex: "x_4 \\ge 0", explanation: "Cannot ship a negative number of units from W2 to Store A." },
        { variable: "x_5", expression_latex: "x_5 \\ge 0", explanation: "Cannot ship a negative number of units from W2 to Store B." },
        { variable: "x_6", expression_latex: "x_6 \\ge 0", explanation: "Cannot ship a negative number of units from W2 to Store C." }
      ],
      latex_block: "\\begin{aligned}\n\\text{Minimize } & z = 4x_1 + 6x_2 + 8x_3 + 5x_4 + 4x_5 + 3x_6 \\\\\n\\text{subject to } & x_1 + x_2 + x_3 \\le 80 \\quad \\text{(Supply W1)} \\\\\n& x_4 + x_5 + x_6 \\le 120 \\quad \\text{(Supply W2)} \\\\\n& x_1 + x_4 \\ge 50 \\quad \\text{(Demand A)} \\\\\n& x_2 + x_5 \\ge 70 \\quad \\text{(Demand B)} \\\\\n& x_3 + x_6 \\ge 80 \\quad \\text{(Demand C)} \\\\\n& x_i \\ge 0 \\quad \\forall i \\in \\{1, \\dots, 6\\}\n\\end{aligned}"
    },
    transformations: [
      {
        step_number: 1,
        title: "Retain Minimization Objective Scheme",
        description: "Objective remains as minimization: 4x_1 + 6x_2 + 8x_3 + 5x_4 + 4x_5 + 3x_6.",
        before_latex: "4x_1 + 6x_2 + 8x_3 + 5x_4 + 4x_5 + 3x_6",
        after_latex: "4x_1 + 6x_2 + 8x_3 + 5x_4 + 4x_5 + 3x_6",
        affected_constraints: [],
        introduced_variables: []
      },
      {
        step_number: 2,
        title: "Map Slacks for the Capacity Budgets and Surpluses for Store Demands",
        description: "Add slacks s_1 and s_2 to the capacity limitations, and subtract surplus variables s_3, s_4, and s_5 from the market demand thresholds.",
        before_latex: "x_1 + x_2 + x_3 \\le 80 \\\\\n x_4 + x_5 + x_6 \\le 120 \\\\\n x_1 + x_4 \\ge 50 \\\\\n x_2 + x_5 \\ge 70 \\\\\n x_3 + x_6 \\ge 80",
        after_latex: "x_1 + x_2 + x_3 + s_1 = 80 \\\\\n x_4 + x_5 + x_6 + s_2 = 120 \\\\\n x_1 + x_4 - s_3 = 50 \\\\\n x_2 + x_5 - s_4 = 70 \\\\\n x_3 + x_6 - s_5 = 80",
        affected_constraints: ["const_supply1", "const_supply2", "const_demandA", "const_demandB", "const_demandC"],
        introduced_variables: ["s_1", "s_2", "s_3", "s_4", "s_5"]
      }
    ],
    standard_form: {
      convention: "minimize c^T x subject to A_eq x = b, x >= 0",
      variables_ordered: [
        { name: "x_1", symbol: "x_1", source: "original", description: "Shipment W1->A" },
        { name: "x_2", symbol: "x_2", source: "original", description: "Shipment W1->B" },
        { name: "x_3", symbol: "x_3", source: "original", description: "Shipment W1->C" },
        { name: "x_4", symbol: "x_4", source: "original", description: "Shipment W2->A" },
        { name: "x_5", symbol: "x_5", source: "original", description: "Shipment W2->B" },
        { name: "x_6", symbol: "x_6", source: "original", description: "Shipment W2->C" },
        { name: "s_1", symbol: "s_1", source: "slack", description: "Slack supply Warehouse 1" },
        { name: "s_2", symbol: "s_2", source: "slack", description: "Slack supply Warehouse 2" },
        { name: "s_3", symbol: "s_3", source: "surplus", description: "Surplus demand Store A" },
        { name: "s_4", symbol: "s_4", source: "surplus", description: "Surplus demand Store B" },
        { name: "s_5", symbol: "s_5", source: "surplus", description: "Surplus demand Store C" }
      ],
      objective: {
        sense: "minimize",
        c: [4, 6, 8, 5, 4, 3, 0, 0, 0, 0, 0],
        expression_latex: "4x_1 + 6x_2 + 8x_3 + 5x_4 + 4x_5 + 3x_6 + 0s_1 + 0s_2 + 0s_3 + 0s_4 + 0s_5"
      },
      constraints: [
        { id: "const_supply1", expression_latex: "x_1 + x_2 + x_3 + s_1 = 80", coefficients_ordered: [1, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0], rhs: 80, source_constraint_id: "const_supply1" },
        { id: "const_supply2", expression_latex: "x_4 + x_5 + x_6 + s_2 = 120", coefficients_ordered: [0, 0, 0, 1, 1, 1, 0, 1, 0, 0, 0], rhs: 120, source_constraint_id: "const_supply2" },
        { id: "const_demandA", expression_latex: "x_1 + x_4 - s_3 = 50", coefficients_ordered: [1, 0, 0, 1, 0, 0, 0, 0, -1, 0, 0], rhs: 50, source_constraint_id: "const_demandA" },
        { id: "const_demandB", expression_latex: "x_2 + x_5 - s_4 = 70", coefficients_ordered: [0, 1, 0, 0, 1, 0, 0, 0, 0, -1, 0], rhs: 70, source_constraint_id: "const_demandB" },
        { id: "const_demandC", expression_latex: "x_3 + x_6 - s_5 = 80", coefficients_ordered: [0, 0, 1, 0, 0, 1, 0, 0, 0, 0, -1], rhs: 80, source_constraint_id: "const_demandC" }
      ],
      A_eq: [
        [1, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0],
        [0, 0, 0, 1, 1, 1, 0, 1, 0, 0, 0],
        [1, 0, 0, 1, 0, 0, 0, 0, -1, 0, 0],
        [0, 1, 0, 0, 1, 0, 0, 0, 0, -1, 0],
        [0, 0, 1, 0, 0, 1, 0, 0, 0, 0, -1]
      ],
      b_eq: [80, 120, 50, 70, 80],
      c: [4, 6, 8, 5, 4, 3, 0, 0, 0, 0, 0],
      latex_block: "\\begin{aligned}\n\\text{Minimize } & z = 4x_1 + 6x_2 + 8x_3 + 5x_4 + 4x_5 + 3x_6 + \\sum_{j=1}^5 0s_j \\\\\n\\text{subject to } & x_1 + x_2 + x_3 + s_1 = 80 \\\\\n& x_4 + x_5 + x_6 + s_2 = 120 \\\\\n& x_1 + x_4 - s_3 = 50 \\\\\n& x_2 + x_5 - s_4 = 70 \\\\\n& x_3 + x_6 - s_5 = 80 \\\\\n& x_i, s_j \\ge 0 \\quad \\forall i, j\n\\end{aligned}"
    },
    matrix_form: {
      variable_vector_latex: "\\begin{pmatrix} x_1 \\\\ x_2 \\\\ x_3 \\\\ x_4 \\\\ x_5 \\\\ x_6 \\\\ s_1 \\\\ s_2 \\\\ s_3 \\\\ s_4 \\\\ s_5 \\end{pmatrix}",
      objective_vector_latex: "\\begin{pmatrix} 4 \\\\ 6 \\\\ 8 \\\\ 5 \\\\ 4 \\\\ 3 \\\\ 0 \\\\ 0 \\\\ 0 \\\\ 0 \\\\ 0 \\end{pmatrix}",
      matrix_latex: "\\begin{pmatrix}\n1 & 1 & 1 & 0 & 0 & 0 & 1 & 0 & 0 & 0 & 0 \\\\\n0 & 0 & 0 & 1 & 1 & 1 & 0 & 1 & 0 & 0 & 0 \\\\\n1 & 0 & 0 & 1 & 0 & 0 & 0 & 0 & -1 & 0 & 0 \\\\\n0 & 1 & 0 & 0 & 1 & 0 & 0 & 0 & 0 & -1 & 0 \\\\\n0 & 0 & 1 & 0 & 0 & 1 & 0 & 0 & 0 & 0 & -1\n\\end{pmatrix}",
      rhs_vector_latex: "\\begin{pmatrix} 80 \\\\ 120 \\\\ 50 \\\\ 70 \\\\ 80 \\end{pmatrix}",
      compact_latex: "\\mathbf{A} \\mathbf{x} = \\mathbf{b}",
      variables: ["x_1", "x_2", "x_3", "x_4", "x_5", "x_6", "s_1", "s_2", "s_3", "s_4", "s_5"],
      A: [
        [1, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0],
        [0, 0, 0, 1, 1, 1, 0, 1, 0, 0, 0],
        [1, 0, 0, 1, 0, 0, 0, 0, -1, 0, 0],
        [0, 1, 0, 0, 1, 0, 0, 0, 0, -1, 0],
        [0, 0, 1, 0, 0, 1, 0, 0, 0, 0, -1]
      ],
      b: [80, 120, 50, 70, 80],
      c: [4, 6, 8, 5, 4, 3, 0, 0, 0, 0, 0]
    },
    solver_payload: {
      ready_for_simplex: true,
      ready_for_ipm: true,
      requires_phase_one: true,
      has_artificial_variables: true,
      objective_sense_original: "minimize",
      objective_sense_solver: "minimize",
      variables: ["x_1", "x_2", "x_3", "x_4", "x_5", "x_6", "s_1", "s_2", "s_3", "s_4", "s_5"],
      A_eq: [
        [1, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0],
        [0, 0, 0, 1, 1, 1, 0, 1, 0, 0, 0],
        [1, 0, 0, 1, 0, 0, 0, 0, -1, 0, 0],
        [0, 1, 0, 0, 1, 0, 0, 0, 0, -1, 0],
        [0, 0, 1, 0, 0, 1, 0, 0, 0, 0, -1]
      ],
      b_eq: [80, 120, 50, 70, 80],
      c: [4, 6, 8, 5, 4, 3, 0, 0, 0, 0, 0],
      original_variable_indices: { "x_1": 0, "x_2": 1, "x_3": 2, "x_4": 3, "x_5": 4, "x_6": 5 },
      slack_variable_indices: { "s_1": 6, "s_2": 7 },
      surplus_variable_indices: { "s_3": 8, "s_4": 9, "s_5": 10 },
      artificial_variable_indices: { "a_1": 11, "a_2": 12, "a_3": 13 },
      notes_for_solver_integration: [
        "Transportation instances feature standard sparse matrix structures.",
        "Contains 3 surplus variables (s_3, s_4, s_5) with negative coefficients, necessitating three artificial variables for Two-Phase Simplex basis completion.",
        "Typically modeled as networks and resolved via specialized transportation Simplex or high-speed network flow algorithms."
      ]
    },
    verification_plan: {
      ortools_compatible: true,
      ortools_notes: [
        "Typically verified via OR-Tools Python pywraplp or the specialized MinCostFlow solver package for network logistics mapping."
      ],
      expected_solver_result_shape: {
        objective_value: "number",
        variable_values: "Record<string, number>",
        solver_status: "string"
      }
    }
  }
};
