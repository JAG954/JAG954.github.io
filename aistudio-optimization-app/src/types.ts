export interface SolverData {
  A: number[][];
  b: number[];
  c: number[];
  variableNames: string[];
  objectiveType: 'maximize' | 'minimize';
}

export interface LPVariable {
  name: string;
  symbol: string;
  description: string;
  unit: string | null;
  lower_bound: number | null;
  upper_bound: number | null;
  sign: "nonnegative" | "nonpositive" | "unrestricted" | "bounded" | "unknown";
}

export interface LPGeneralForm {
  objective: {
    sense: "maximize" | "minimize";
    expression_latex: string;
    coefficients: Record<string, number>;
    constant: number;
    explanation: string;
  };

  constraints: Array<{
    id: string;
    name: string;
    expression_latex: string;
    coefficients: Record<string, number>;
    operator: "<=" | ">=" | "=";
    rhs: number;
    unit: string | null;
    explanation: string;
  }>;

  bounds: Array<{
    variable: string;
    expression_latex: string;
    explanation: string;
  }>;

  latex_block: string;
}

export interface LPTransformationStep {
  step_number: number;
  title: string;
  description: string;
  before_latex: string | null;
  after_latex: string | null;
  affected_constraints: string[];
  introduced_variables: string[];
}

export interface LPStandardForm {
  convention: "minimize c^T x subject to A_eq x = b, x >= 0";

  variables_ordered: Array<{
    name: string;
    symbol: string;
    source: "original" | "slack" | "surplus" | "artificial" | "split_positive" | "split_negative" | "shifted";
    description: string;
  }>;

  objective: {
    sense: "minimize";
    c: number[];
    expression_latex: string;
  };

  constraints: Array<{
    id: string;
    expression_latex: string;
    coefficients_ordered: number[];
    rhs: number;
    source_constraint_id: string | null;
  }>;

  A_eq: number[][];
  b_eq: number[];
  c: number[];

  latex_block: string;
}

export interface LPMatrixForm {
  variable_vector_latex: string;
  objective_vector_latex: string;
  matrix_latex: string;
  rhs_vector_latex: string;
  compact_latex: string;

  variables: string[];
  A: number[][];
  b: number[];
  c: number[];
}

export interface LPSolverPayload {
  ready_for_simplex: boolean;
  ready_for_ipm: boolean;
  requires_phase_one: boolean;
  has_artificial_variables: boolean;

  objective_sense_original: "maximize" | "minimize";
  objective_sense_solver: "minimize";

  variables: string[];
  A_eq: number[][];
  b_eq: number[];
  c: number[];

  original_variable_indices: Record<string, number>;
  slack_variable_indices: Record<string, number>;
  surplus_variable_indices: Record<string, number>;
  artificial_variable_indices: Record<string, number>;

  notes_for_solver_integration: string[];
}

export interface LPVerificationPlan {
  ortools_compatible: boolean;
  ortools_notes: string[];
  expected_solver_result_shape: {
    objective_value: "number";
    variable_values: "Record<string, number>";
    solver_status: "string";
  };
}

export interface LPFormulation {
  metadata: {
    status: "success" | "partial" | "failed";
    formulation_type: "linear_program";
    confidence: number;
    warnings: string[];
    assumptions: string[];
    unsupported_features: string[];
  };

  original_problem: {
    raw_text: string;
    interpreted_goal: string;
    interpreted_context: string;
  };

  decision_variables: LPVariable[];
  general_form: LPGeneralForm;
  transformations: LPTransformationStep[];
  standard_form: LPStandardForm;
  matrix_form: LPMatrixForm;
  solver_payload: LPSolverPayload;
  verification_plan: LPVerificationPlan;
}

export interface LPFormulateResponse {
  ok: boolean;
  data?: LPFormulation;
  error?: string;
  raw_model_output?: string;
  isOfflineFallback?: boolean;
  offlineNotice?: string;
  isPrepaymentDepleted?: boolean;
}
