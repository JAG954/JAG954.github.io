export const EXAMPLE_PROMPTS = [
  {
    id: 'product_mix',
    title: 'Product mix',
    label: 'Manufacturing',
    prompt:
      'A factory produces chairs and tables. Each chair earns $40 profit and each table earns $70 profit. A chair requires 2 labor hours and 1 unit of wood. A table requires 3 labor hours and 4 units of wood. The factory has 120 labor hours and 100 units of wood available. Formulate an LP to maximize profit.',
  },
  {
    id: 'diet',
    title: 'Minimum-cost diet',
    label: 'Resource blend',
    prompt:
      'Create a minimum-cost diet using chicken and rice. Chicken costs $4 per serving and rice costs $1 per serving. Each serving of chicken has 30 grams of protein and 5 grams of fat. Each serving of rice has 4 grams of protein and 1 gram of fat. The diet needs at least 60 grams of protein and at most 20 grams of fat.',
  },
  {
    id: 'transportation',
    title: 'Transportation plan',
    label: 'Supply chain',
    prompt:
      'A company ships products from two warehouses to three stores. Warehouse 1 has 80 units and Warehouse 2 has 120 units. Store A needs 50 units, Store B needs 70 units, and Store C needs 80 units. Shipping costs are 4, 6, and 8 from Warehouse 1, and 5, 4, and 3 from Warehouse 2. Formulate a minimum-cost LP.',
  },
  {
    id: 'staffing',
    title: 'Shift staffing',
    label: 'Operations',
    prompt:
      'A warehouse can assign workers to morning and evening shifts. A morning worker costs 120 dollars and handles 18 orders. An evening worker costs 150 dollars and handles 24 orders. At least 420 orders must be handled, at most 20 total workers can be scheduled, and at least 6 evening workers are required. Formulate a linear program that minimizes labor cost.',
  },
]

const TEMPLATE_DEFINITIONS = {
  product_mix: {
    context: 'Industrial manufacturing production mix.',
    goal: 'Maximize total contribution margin from chairs and tables subject to labor and wood capacity.',
    objectiveSense: 'maximize',
    variables: [
      { name: 'x_1', symbol: 'x_{chair}', description: 'number of chairs to produce', unit: 'units' },
      { name: 'x_2', symbol: 'x_{table}', description: 'number of tables to produce', unit: 'units' },
    ],
    objective: { x_1: 40, x_2: 70 },
    constraints: [
      {
        id: 'labor_capacity',
        name: 'Labor capacity',
        coefficients: { x_1: 2, x_2: 3 },
        operator: '<=',
        rhs: 120,
        unit: 'hours',
        explanation: 'Total labor hours cannot exceed the available 120 hours.',
      },
      {
        id: 'wood_capacity',
        name: 'Wood capacity',
        coefficients: { x_1: 1, x_2: 4 },
        operator: '<=',
        rhs: 100,
        unit: 'units',
        explanation: 'Total wood usage cannot exceed the available 100 units.',
      },
    ],
  },
  diet: {
    context: 'Diet planning blend model.',
    goal: 'Minimize daily food cost while satisfying protein and fat requirements.',
    objectiveSense: 'minimize',
    variables: [
      { name: 'x_1', symbol: 'x_{chicken}', description: 'servings of chicken', unit: 'servings' },
      { name: 'x_2', symbol: 'x_{rice}', description: 'servings of rice', unit: 'servings' },
    ],
    objective: { x_1: 4, x_2: 1 },
    constraints: [
      {
        id: 'protein_minimum',
        name: 'Protein minimum',
        coefficients: { x_1: 30, x_2: 4 },
        operator: '>=',
        rhs: 60,
        unit: 'grams',
        explanation: 'Total protein must be at least 60 grams.',
      },
      {
        id: 'fat_limit',
        name: 'Fat limit',
        coefficients: { x_1: 5, x_2: 1 },
        operator: '<=',
        rhs: 20,
        unit: 'grams',
        explanation: 'Total fat must not exceed 20 grams.',
      },
    ],
  },
  transportation: {
    context: 'Warehouse-to-store transportation planning.',
    goal: 'Minimize shipping cost while respecting warehouse supply and store demand requirements.',
    objectiveSense: 'minimize',
    variables: [
      { name: 'x_1', symbol: 'x_{1A}', description: 'units shipped from Warehouse 1 to Store A', unit: 'units' },
      { name: 'x_2', symbol: 'x_{1B}', description: 'units shipped from Warehouse 1 to Store B', unit: 'units' },
      { name: 'x_3', symbol: 'x_{1C}', description: 'units shipped from Warehouse 1 to Store C', unit: 'units' },
      { name: 'x_4', symbol: 'x_{2A}', description: 'units shipped from Warehouse 2 to Store A', unit: 'units' },
      { name: 'x_5', symbol: 'x_{2B}', description: 'units shipped from Warehouse 2 to Store B', unit: 'units' },
      { name: 'x_6', symbol: 'x_{2C}', description: 'units shipped from Warehouse 2 to Store C', unit: 'units' },
    ],
    objective: { x_1: 4, x_2: 6, x_3: 8, x_4: 5, x_5: 4, x_6: 3 },
    constraints: [
      {
        id: 'warehouse_1_supply',
        name: 'Warehouse 1 supply',
        coefficients: { x_1: 1, x_2: 1, x_3: 1 },
        operator: '<=',
        rhs: 80,
        unit: 'units',
        explanation: 'Shipments from Warehouse 1 cannot exceed 80 units.',
      },
      {
        id: 'warehouse_2_supply',
        name: 'Warehouse 2 supply',
        coefficients: { x_4: 1, x_5: 1, x_6: 1 },
        operator: '<=',
        rhs: 120,
        unit: 'units',
        explanation: 'Shipments from Warehouse 2 cannot exceed 120 units.',
      },
      {
        id: 'store_a_demand',
        name: 'Store A demand',
        coefficients: { x_1: 1, x_4: 1 },
        operator: '>=',
        rhs: 50,
        unit: 'units',
        explanation: 'Store A must receive at least 50 units.',
      },
      {
        id: 'store_b_demand',
        name: 'Store B demand',
        coefficients: { x_2: 1, x_5: 1 },
        operator: '>=',
        rhs: 70,
        unit: 'units',
        explanation: 'Store B must receive at least 70 units.',
      },
      {
        id: 'store_c_demand',
        name: 'Store C demand',
        coefficients: { x_3: 1, x_6: 1 },
        operator: '>=',
        rhs: 80,
        unit: 'units',
        explanation: 'Store C must receive at least 80 units.',
      },
    ],
  },
  staffing: {
    context: 'Warehouse labor staffing model.',
    goal: 'Minimize labor cost while covering order volume, total headcount, and evening staffing requirements.',
    objectiveSense: 'minimize',
    variables: [
      { name: 'x_1', symbol: 'x_{morning}', description: 'morning shift workers scheduled', unit: 'workers' },
      { name: 'x_2', symbol: 'x_{evening}', description: 'evening shift workers scheduled', unit: 'workers' },
    ],
    objective: { x_1: 120, x_2: 150 },
    constraints: [
      {
        id: 'order_coverage',
        name: 'Order coverage',
        coefficients: { x_1: 18, x_2: 24 },
        operator: '>=',
        rhs: 420,
        unit: 'orders',
        explanation: 'Scheduled labor must handle at least 420 orders.',
      },
      {
        id: 'headcount_cap',
        name: 'Headcount cap',
        coefficients: { x_1: 1, x_2: 1 },
        operator: '<=',
        rhs: 20,
        unit: 'workers',
        explanation: 'At most 20 total workers can be scheduled.',
      },
      {
        id: 'evening_minimum',
        name: 'Evening minimum',
        coefficients: { x_2: 1 },
        operator: '>=',
        rhs: 6,
        unit: 'workers',
        explanation: 'At least 6 evening workers are required.',
      },
    ],
  },
}

export function formulateLocally(prompt) {
  const key = chooseTemplate(prompt)
  const definition = TEMPLATE_DEFINITIONS[key]
  return buildFormulation(definition, prompt)
}

function chooseTemplate(prompt) {
  const normalized = String(prompt || '').toLowerCase()

  if (hasAny(normalized, ['worker', 'staff', 'shift', 'orders', 'labor cost', 'headcount'])) {
    return 'staffing'
  }

  if (hasAny(normalized, ['warehouse', 'ship', 'shipping', 'store', 'transport', 'route', 'logistics'])) {
    return 'transportation'
  }

  if (hasAny(normalized, ['diet', 'protein', 'fat', 'chicken', 'rice', 'nutrition'])) {
    return 'diet'
  }

  return 'product_mix'
}

function buildFormulation(definition, rawText) {
  const originalVariables = definition.variables.map((variable) => ({
    ...variable,
    lower_bound: 0,
    upper_bound: null,
    sign: 'nonnegative',
  }))

  const generalConstraints = definition.constraints.map((constraint) => ({
    ...constraint,
    expression_latex: `${formatExpression(constraint.coefficients)} ${operatorLatex(constraint.operator)} ${constraint.rhs}`,
  }))

  const standardVariables = [
    ...definition.variables.map((variable) => ({
      name: variable.name,
      symbol: variable.name,
      source: 'original',
      description: variable.description,
    })),
    ...definition.constraints
      .filter((constraint) => constraint.operator !== '=')
      .map((constraint, index) => ({
        name: `s_${index + 1}`,
        symbol: `s_${index + 1}`,
        source: constraint.operator === '<=' ? 'slack' : 'surplus',
        description:
          constraint.operator === '<='
            ? `unused capacity for ${constraint.name.toLowerCase()}`
            : `excess above ${constraint.name.toLowerCase()}`,
      })),
  ]

  const originalNames = definition.variables.map((variable) => variable.name)
  const standardNames = standardVariables.map((variable) => variable.name)
  const objectiveScale = definition.objectiveSense === 'maximize' ? -1 : 1
  const c = standardNames.map((name) => (definition.objective[name] || 0) * objectiveScale)

  let slackIndex = 0
  const standardConstraints = definition.constraints.map((constraint) => {
    const coefficients = standardNames.map((name) => {
      if (originalNames.includes(name)) return constraint.coefficients[name] || 0
      return 0
    })

    let introducedVariable = null
    if (constraint.operator !== '=') {
      introducedVariable = `s_${slackIndex + 1}`
      const introducedIndex = standardNames.indexOf(introducedVariable)
      coefficients[introducedIndex] = constraint.operator === '<=' ? 1 : -1
      slackIndex += 1
    }

    return {
      id: constraint.id,
      expression_latex: `${formatExpressionFromOrdered(standardNames, coefficients)} = ${constraint.rhs}`,
      coefficients_ordered: coefficients,
      rhs: constraint.rhs,
      source_constraint_id: constraint.id,
      introducedVariable,
    }
  })

  const A = standardConstraints.map((constraint) => constraint.coefficients_ordered)
  const b = standardConstraints.map((constraint) => constraint.rhs)
  const hasSurplus = definition.constraints.some((constraint) => constraint.operator === '>=')
  const slackVariableIndices = {}
  const surplusVariableIndices = {}

  standardVariables.forEach((variable, index) => {
    if (variable.source === 'slack') slackVariableIndices[variable.name] = index
    if (variable.source === 'surplus') surplusVariableIndices[variable.name] = index
  })

  return {
    metadata: {
      status: 'success',
      formulation_type: 'linear_program',
      confidence: 0.88,
      warnings: ['Generated from a local deterministic template when the live NLP API is unavailable or not configured.'],
      assumptions: [
        'Decision variables are continuous and nonnegative.',
        'All coefficients are deterministic and linear.',
        'Integer worker, shipment, or production counts are relaxed for LP compatibility.',
      ],
      unsupported_features: [],
    },
    original_problem: {
      raw_text: rawText,
      interpreted_goal: definition.goal,
      interpreted_context: definition.context,
    },
    decision_variables: originalVariables,
    general_form: {
      objective: {
        sense: definition.objectiveSense,
        expression_latex: formatExpression(definition.objective),
        coefficients: definition.objective,
        constant: 0,
        explanation: `${capitalize(definition.objectiveSense)} the linear objective implied by the prompt.`,
      },
      constraints: generalConstraints,
      bounds: definition.variables.map((variable) => ({
        variable: variable.name,
        expression_latex: `${variable.name} \\ge 0`,
        explanation: `${capitalize(variable.description)} cannot be negative.`,
      })),
      latex_block: buildGeneralLatex(definition),
    },
    transformations: buildTransformationSteps(definition, standardConstraints),
    standard_form: {
      convention: 'minimize c^T x subject to A_eq x = b, x >= 0',
      variables_ordered: standardVariables,
      objective: {
        sense: 'minimize',
        c,
        expression_latex: formatExpressionFromOrdered(standardNames, c),
      },
      constraints: standardConstraints.map((constraint) => ({
        id: constraint.id,
        expression_latex: constraint.expression_latex,
        coefficients_ordered: constraint.coefficients_ordered,
        rhs: constraint.rhs,
        source_constraint_id: constraint.source_constraint_id,
      })),
      A_eq: A,
      b_eq: b,
      c,
      latex_block: buildStandardLatex(standardNames, c, standardConstraints),
    },
    matrix_form: {
      variable_vector_latex: vectorLatex(standardNames),
      objective_vector_latex: vectorLatex(c),
      matrix_latex: matrixLatex(A),
      rhs_vector_latex: vectorLatex(b),
      compact_latex: '\\min \\; \\mathbf{c}^{T}\\mathbf{x} \\quad \\text{s.t.} \\quad \\mathbf{A}\\mathbf{x}=\\mathbf{b},\\; \\mathbf{x}\\ge 0',
      variables: standardNames,
      A,
      b,
      c,
    },
    solver_payload: {
      ready_for_simplex: !hasSurplus,
      ready_for_ipm: true,
      requires_phase_one: hasSurplus,
      has_artificial_variables: hasSurplus,
      objective_sense_original: definition.objectiveSense,
      objective_sense_solver: 'minimize',
      variables: standardNames,
      A_eq: A,
      b_eq: b,
      c,
      original_variable_indices: Object.fromEntries(originalNames.map((name, index) => [name, index])),
      slack_variable_indices: slackVariableIndices,
      surplus_variable_indices: surplusVariableIndices,
      artificial_variable_indices: {},
      notes_for_solver_integration: hasSurplus
        ? [
            'At least one greater-than-or-equal constraint creates a surplus column without an immediate identity basis.',
            'A two-phase Simplex implementation should add artificial variables before Phase II optimization.',
            'An interior point method can consume the equality matrix directly with nonnegative variables.',
          ]
        : [
            'Slack variables provide a natural initial basis for primal Simplex.',
            'The equality matrix and nonnegative variables are ready for Simplex tableau construction.',
            'The same A, b, and c arrays can be passed to an interior point method.',
          ],
    },
    verification_plan: {
      ortools_compatible: true,
      ortools_notes: [
        'Create continuous variables with lower bound 0.',
        'Add each general-form constraint with its original inequality direction.',
        'Set the objective sense to match the original objective.',
      ],
      expected_solver_result_shape: {
        objective_value: 'number',
        variable_values: 'Record<string, number>',
        solver_status: 'string',
      },
    },
  }
}

function buildGeneralLatex(definition) {
  const objectiveLabel = definition.objectiveSense === 'maximize' ? 'Maximize' : 'Minimize'
  const constraints = definition.constraints
    .map((constraint) => `& ${formatExpression(constraint.coefficients)} ${operatorLatex(constraint.operator)} ${constraint.rhs}`)
    .join(' \\\\\n')
  const variableNames = definition.variables.map((variable) => variable.name).join(', ')

  return `\\begin{aligned}\n\\text{${objectiveLabel}} \\quad & z = ${formatExpression(definition.objective)} \\\\\n\\text{subject to} \\quad ${constraints} \\\\\n& ${variableNames} \\ge 0\n\\end{aligned}`
}

function buildStandardLatex(names, c, constraints) {
  const rows = constraints
    .map((constraint) => `& ${formatExpressionFromOrdered(names, constraint.coefficients_ordered)} = ${constraint.rhs}`)
    .join(' \\\\\n')

  return `\\begin{aligned}\n\\text{Minimize} \\quad & z = ${formatExpressionFromOrdered(names, c)} \\\\\n\\text{subject to} \\quad ${rows} \\\\\n& ${names.join(', ')} \\ge 0\n\\end{aligned}`
}

function buildTransformationSteps(definition, standardConstraints) {
  const steps = []

  if (definition.objectiveSense === 'maximize') {
    steps.push({
      step_number: steps.length + 1,
      title: 'Convert maximization to minimization',
      description: 'Multiply the objective coefficients by -1 for the solver-facing minimization convention.',
      before_latex: formatExpression(definition.objective),
      after_latex: formatExpressionFromOrdered(
        definition.variables.map((variable) => variable.name),
        definition.variables.map((variable) => -(definition.objective[variable.name] || 0)),
      ),
      affected_constraints: [],
      introduced_variables: [],
    })
  }

  const introduced = standardConstraints
    .filter((constraint) => constraint.introducedVariable)
    .map((constraint) => constraint.introducedVariable)

  if (introduced.length > 0) {
    steps.push({
      step_number: steps.length + 1,
      title: 'Transform inequalities to equalities',
      description: 'Add slack variables to <= constraints and subtract surplus variables from >= constraints.',
      before_latex: definition.constraints
        .map((constraint) => `${formatExpression(constraint.coefficients)} ${operatorLatex(constraint.operator)} ${constraint.rhs}`)
        .join(' \\\\ '),
      after_latex: standardConstraints.map((constraint) => constraint.expression_latex).join(' \\\\ '),
      affected_constraints: definition.constraints.map((constraint) => constraint.id),
      introduced_variables: introduced,
    })
  }

  steps.push({
    step_number: steps.length + 1,
    title: 'Assemble ordered matrix payload',
    description: 'Order original variables first, then slack and surplus variables, and align every row of A with c.',
    before_latex: null,
    after_latex: '\\mathbf{A}\\mathbf{x}=\\mathbf{b}',
    affected_constraints: definition.constraints.map((constraint) => constraint.id),
    introduced_variables: [],
  })

  return steps
}

function formatExpression(coefficients) {
  return formatExpressionFromOrdered(Object.keys(coefficients), Object.values(coefficients))
}

function formatExpressionFromOrdered(names, coefficients) {
  const terms = names
    .map((name, index) => ({ name, coefficient: coefficients[index] || 0 }))
    .filter(({ coefficient }) => Math.abs(coefficient) > 1e-9)
    .map(({ name, coefficient }, index) => formatTerm(name, coefficient, index))

  return terms.length > 0 ? terms.join(' ') : '0'
}

function formatTerm(name, coefficient, index) {
  const abs = Math.abs(coefficient)
  const value = abs === 1 ? '' : cleanNumber(abs)
  const sign = coefficient < 0 ? '-' : '+'
  const rendered = `${value}${name}`

  if (index === 0) return coefficient < 0 ? `-${rendered}` : rendered
  return `${sign} ${rendered}`
}

function matrixLatex(rows) {
  return `\\begin{pmatrix} ${rows.map((row) => row.map(cleanNumber).join(' & ')).join(' \\\\ ')} \\end{pmatrix}`
}

function vectorLatex(values) {
  return `\\begin{pmatrix} ${values.map(cleanNumber).join(' \\\\ ')} \\end{pmatrix}`
}

function cleanNumber(value) {
  if (typeof value === 'string') return value
  return Number.isInteger(value) ? String(value) : Number(value.toFixed(4)).toString()
}

function operatorLatex(operator) {
  if (operator === '<=') return '\\le'
  if (operator === '>=') return '\\ge'
  return '='
}

function hasAny(value, needles) {
  return needles.some((needle) => value.includes(needle))
}

function capitalize(value) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`
}
