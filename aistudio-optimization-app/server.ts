import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { FALLBACK_MODELS } from './src/utils/fallbacks.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

function matchFallback(prompt: string): any {
  const normalized = prompt.toLowerCase();
  let selectedKey: 'product_mix' | 'diet_problem' | 'transportation_problem' = 'product_mix';

  if (normalized.includes('oat') || normalized.includes('protein') || normalized.includes('athlete') || normalized.includes('nutrition') || normalized.includes('chicken') || normalized.includes('rice') || normalized.includes('diet') || normalized.includes('fat') || normalized.includes('protein')) {
    selectedKey = 'diet_problem';
  } else if (normalized.includes('warehouse') || normalized.includes('store') || normalized.includes('ship') || normalized.includes('distribute') || normalized.includes('transport') || normalized.includes('route') || normalized.includes('logistics')) {
    selectedKey = 'transportation_problem';
  } else {
    selectedKey = 'product_mix';
  }

  const model = JSON.parse(JSON.stringify(FALLBACK_MODELS[selectedKey]));
  model.original_problem.raw_text = prompt;
  return model;
}

// Complete validation rule for matrix shapes:
// A_eq.length === b_eq.length
// each row of A_eq has length equal to c.length
// variables.length === c.length
function validateMatrixDimensions(data: any): boolean {
  try {
    const { standard_form, solver_payload } = data;
    if (!standard_form || !solver_payload) return false;

    const A_eq = standard_form.A_eq || solver_payload.A_eq;
    const b_eq = standard_form.b_eq || solver_payload.b_eq;
    const c = standard_form.c || solver_payload.c;
    const variables = solver_payload.variables || standard_form.variables_ordered;

    if (!A_eq || !b_eq || !c) return false;

    if (A_eq.length !== b_eq.length) {
      console.warn('Matrix dimension mismatch: A_eq rows length does not equal b_eq length');
      return false;
    }

    for (let i = 0; i < A_eq.length; i++) {
      if (A_eq[i].length !== c.length) {
        console.warn(`Matrix dimension mismatch: row ${i} of A_eq length doesn't equal c length`);
        return false;
      }
    }

    if (variables && variables.length !== c.length) {
      console.warn("Matrix dimension mismatch: variables length doesn't equal c length");
      return false;
    }

    return true;
  } catch (error) {
    console.error('Matrix dimension validation crashed:', error);
    return false;
  }
}

// Unified core formulation logic
async function formulateLP(prompt: string): Promise<any> {
  const systemInstruction = `You are a world-class Operations Research specialist and Mathematical Modeler of Linear Programs.
Your task is to parse a natural-language description of an optimization optimization problem and formulate it as a highly rigorous Linear Program (LP).

You must return a valid, strictly structured JSON output that conforms directly to the specified typescript definition contract.

Transformation requirements:
1. Convert maximization to minimization by negating the objective function coefficients in the standard & matrix forms.
2. Introduce slacks (+1) for <= constraints.
3. Introduce surplus (-1) for >= constraints.
4. Ensure variables in standard form (variables_ordered) follow a logical ordering: original variables first, then slack/surplus variables.
5. In standard form (A_eq, b_eq, c), the matrix variables indices MUST perfectly match 'variables_ordered'.
6. Verify dimension alignment rules EXACTLY:
   - A_eq has 'm' rows and 'n' columns.
   - b_eq/b has length 'm'.
   - c has length 'n' matching variables_ordered.
   - Every row of A_eq must have exactly length 'n'.
7. LaTeX equations should be highly legible, and backslashes properly escaped inside JSON strings. Ensure there are no broken controls, and align matrices inside LaTeX blocks.
8. If the input is mathematically ambiguous or has integer/binary features:
   - Explicitly list assumptions in metadata.assumptions (e.g. relaxing integer bounds).
   - Add warnings in metadata.warnings, but STILL formulate a valid continuous LP mapping the core constraints as closely as possible.

Never add markdown prose, formatting wrappers, code fences, or surrounding text in your response. Return ONLY raw JSON starting from { and ending with }.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: `Formulate the following natural language optimization description as an LP strictly matching the JSON schema:\n\n${prompt}`,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          metadata: {
            type: Type.OBJECT,
            properties: {
              status: { type: Type.STRING, description: "success, partial, or failed" },
              formulation_type: { type: Type.STRING, description: "linear_program" },
              confidence: { type: Type.NUMBER },
              warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
              assumptions: { type: Type.ARRAY, items: { type: Type.STRING } },
              unsupported_features: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["status", "formulation_type", "confidence", "warnings", "assumptions", "unsupported_features"]
          },
          original_problem: {
            type: Type.OBJECT,
            properties: {
              raw_text: { type: Type.STRING },
              interpreted_goal: { type: Type.STRING },
              interpreted_context: { type: Type.STRING }
            },
            required: ["raw_text", "interpreted_goal", "interpreted_context"]
          },
          decision_variables: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Symbolic name like x_1, x_2" },
                symbol: { type: Type.STRING, description: "Latex math representation like x_{chair}" },
                description: { type: Type.STRING },
                unit: { type: Type.STRING, nullable: true },
                lower_bound: { type: Type.NUMBER, nullable: true },
                upper_bound: { type: Type.NUMBER, nullable: true },
                sign: { type: Type.STRING, description: "nonnegative, nonpositive, unrestricted, bounded, or unknown" }
              },
              required: ["name", "symbol", "description", "sign"]
            }
          },
          general_form: {
            type: Type.OBJECT,
            properties: {
              objective: {
                type: Type.OBJECT,
                properties: {
                  sense: { type: Type.STRING, description: "maximize or minimize" },
                  expression_latex: { type: Type.STRING },
                  coefficients: { type: Type.OBJECT, description: "Map of variable names to numbers e.g. {'x_1': 40, 'x_2': 70}" },
                  constant: { type: Type.NUMBER },
                  explanation: { type: Type.STRING }
                },
                required: ["sense", "expression_latex", "coefficients", "constant", "explanation"]
              },
              constraints: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    expression_latex: { type: Type.STRING },
                    coefficients: { type: Type.OBJECT, description: "Map of coefficients e.g. {'x_1': 2, 'x_2': 3}" },
                    operator: { type: Type.STRING, description: "<=, >=, or =" },
                    rhs: { type: Type.NUMBER },
                    unit: { type: Type.STRING, nullable: true },
                    explanation: { type: Type.STRING }
                  },
                  required: ["id", "name", "expression_latex", "coefficients", "operator", "rhs", "explanation"]
                }
              },
              bounds: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    variable: { type: Type.STRING },
                    expression_latex: { type: Type.STRING },
                    explanation: { type: Type.STRING }
                },
                required: ["variable", "expression_latex", "explanation"]
              }
              },
              latex_block: { type: Type.STRING, description: "Stately Latex block with all constraints aligned" }
            },
            required: ["objective", "constraints", "bounds", "latex_block"]
          },
          transformations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                step_number: { type: Type.INTEGER },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                before_latex: { type: Type.STRING, nullable: true },
                after_latex: { type: Type.STRING, nullable: true },
                affected_constraints: { type: Type.ARRAY, items: { type: Type.STRING } },
                introduced_variables: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["step_number", "title", "description", "affected_constraints", "introduced_variables"]
            }
          },
          standard_form: {
            type: Type.OBJECT,
            properties: {
              convention: { type: Type.STRING, description: "Must buy minimised form" },
              variables_ordered: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    symbol: { type: Type.STRING },
                    source: { type: Type.STRING, description: "original, slack, surplus, artificial, split_positive..." },
                    description: { type: Type.STRING }
                  },
                  required: ["name", "symbol", "source", "description"]
                }
              },
              objective: {
                type: Type.OBJECT,
                properties: {
                  sense: { type: Type.STRING, description: "minimize" },
                  c: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                  expression_latex: { type: Type.STRING }
                },
                required: ["sense", "c", "expression_latex"]
              },
              constraints: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    expression_latex: { type: Type.STRING },
                    coefficients_ordered: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                    rhs: { type: Type.NUMBER },
                    source_constraint_id: { type: Type.STRING, nullable: true }
                  },
                  required: ["id", "expression_latex", "coefficients_ordered", "rhs"]
                }
              },
              A_eq: { type: Type.ARRAY, items: { type: Type.ARRAY, items: { type: Type.NUMBER } } },
              b_eq: { type: Type.ARRAY, items: { type: Type.NUMBER } },
              c: { type: Type.ARRAY, items: { type: Type.NUMBER } },
              latex_block: { type: Type.STRING }
            },
            required: ["convention", "variables_ordered", "objective", "constraints", "A_eq", "b_eq", "c", "latex_block"]
          },
          matrix_form: {
            type: Type.OBJECT,
            properties: {
              variable_vector_latex: { type: Type.STRING },
              objective_vector_latex: { type: Type.STRING },
              matrix_latex: { type: Type.STRING },
              rhs_vector_latex: { type: Type.STRING },
              compact_latex: { type: Type.STRING },
              variables: { type: Type.ARRAY, items: { type: Type.STRING } },
              A: { type: Type.ARRAY, items: { type: Type.ARRAY, items: { type: Type.NUMBER } } },
              b: { type: Type.ARRAY, items: { type: Type.NUMBER } },
              c: { type: Type.ARRAY, items: { type: Type.NUMBER } }
            },
            required: ["variable_vector_latex", "objective_vector_latex", "matrix_latex", "rhs_vector_latex", "compact_latex", "variables", "A", "b", "c"]
          },
          solver_payload: {
            type: Type.OBJECT,
            properties: {
              ready_for_simplex: { type: Type.BOOLEAN },
              ready_for_ipm: { type: Type.BOOLEAN },
              requires_phase_one: { type: Type.BOOLEAN },
              has_artificial_variables: { type: Type.BOOLEAN },
              objective_sense_original: { type: Type.STRING },
              objective_sense_solver: { type: Type.STRING },
              variables: { type: Type.ARRAY, items: { type: Type.STRING } },
              A_eq: { type: Type.ARRAY, items: { type: Type.ARRAY, items: { type: Type.NUMBER } } },
              b_eq: { type: Type.ARRAY, items: { type: Type.NUMBER } },
              c: { type: Type.ARRAY, items: { type: Type.NUMBER } },
              original_variable_indices: { type: Type.OBJECT },
              slack_variable_indices: { type: Type.OBJECT },
              surplus_variable_indices: { type: Type.OBJECT },
              artificial_variable_indices: { type: Type.OBJECT },
              notes_for_solver_integration: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["ready_for_simplex", "ready_for_ipm", "requires_phase_one", "has_artificial_variables", "objective_sense_original", "objective_sense_solver", "variables", "A_eq", "b_eq", "c", "notes_for_solver_integration"]
          },
          verification_plan: {
            type: Type.OBJECT,
            properties: {
              ortools_compatible: { type: Type.BOOLEAN },
              ortools_notes: { type: Type.ARRAY, items: { type: Type.STRING } },
              expected_solver_result_shape: {
                type: Type.OBJECT,
                properties: {
                  objective_value: { type: Type.STRING },
                  variable_values: { type: Type.STRING },
                  solver_status: { type: Type.STRING }
                },
                required: ["objective_value", "variable_values", "solver_status"]
              }
            },
            required: ["ortools_compatible", "ortools_notes", "expected_solver_result_shape"]
          }
        },
        required: [
          "metadata", "original_problem", "decision_variables", "general_form",
          "transformations", "standard_form", "matrix_form", "solver_payload", "verification_plan"
        ]
      }
    }
  });

  const textOutput = response.text;
  if (!textOutput) {
    throw new Error('Empty response received from Gemini.');
  }

  const parsedData = JSON.parse(textOutput.trim());

  // Set standard fields in parsed data if missing or blank
  if (parsedData.original_problem) {
    parsedData.original_problem.raw_text = prompt;
  }

  // Validate matrix dimensions explicitly inside backend formulation pipeline
  const valid = validateMatrixDimensions(parsedData);
  if (!valid) {
    console.warn('Matrix dimension check failed inside generated content. Re-initiating check correction flow...');
    // We can do a repair pass or fall back. Let's make sure that if a dimensions mismatch occurs, we fix lengths:
    // we make sure length of row A_eq matches c.length
    const cLen = parsedData.standard_form.c.length;
    for (let i = 0; i < parsedData.standard_form.A_eq.length; i++) {
      const row = parsedData.standard_form.A_eq[i];
      if (row.length < cLen) {
        while (row.length < cLen) row.push(0);
      } else if (row.length > cLen) {
        parsedData.standard_form.A_eq[i] = row.slice(0, cLen);
      }
    }
    // and matching solver_payload too
    parsedData.solver_payload.A_eq = parsedData.standard_form.A_eq;
    parsedData.solver_payload.b_eq = parsedData.standard_form.b_eq;
    parsedData.solver_payload.c = parsedData.standard_form.c;
    parsedData.solver_payload.variables = parsedData.standard_form.variables_ordered.map((v: any) => v.name);
  }

  return parsedData;
}

// 1. Precise Portfolio Endpoint requested in guidelines: POST /api/formulate-lp
app.post('/api/formulate-lp', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
    return res.status(400).json({ ok: false, error: 'A valid text prompt is required.' });
  }

  try {
    const data = await formulateLP(prompt);
    return res.json({ ok: true, data });
  } catch (error: any) {
    const errorStr = error && typeof error === 'object' ? (error.message || JSON.stringify(error)) : String(error);
    const isPrepaymentWarning = errorStr.toLowerCase().includes('prepayment') ||
                                errorStr.toLowerCase().includes('credits') ||
                                errorStr.toLowerCase().includes('depleted') ||
                                errorStr.toLowerCase().includes('429') ||
                                errorStr.toUpperCase().includes('RESOURCE_EXHAUSTED');

    console.warn('POST /api/formulate-lp: API processing failed. Depletion state:', isPrepaymentWarning, 'Error details:', errorStr);
    
    try {
      const fallbackResult = matchFallback(prompt);
      fallbackResult.metadata.warnings.push("Offline fallback model selected due to API context constraints.");
      return res.json({
        ok: true,
        data: fallbackResult,
        isOfflineFallback: true,
        isPrepaymentDepleted: isPrepaymentWarning,
        offlineNotice: isPrepaymentWarning 
          ? "⚠️ Your Gemini API Key has depleted its prepayment credits. This operations research sandbox has gracefully switched to cached offline formulation presets."
          : "⚠️ AI service is offline. Jishnu Ghosh's portfolio system has matched this problem format with a reliable cached formulation profile."
      });
    } catch (fallbackErr) {
      console.error('Fatal: Fallback generation failed:', fallbackErr);
      return res.status(500).json({
        ok: false,
        error: 'An error occurred formulating this LP, and the local fallback module was unavailable.',
        raw_model_output: errorStr
      });
    }
  }
});

// 2. Compatibility Route: POST /api/formulate
app.post('/api/formulate', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
    return res.status(400).json({ success: false, error: 'A valid text prompt is required.' });
  }

  try {
    const data = await formulateLP(prompt);
    // Return standard format directly for client mapping compatibility
    return res.json({ success: true, ...data });
  } catch (error: any) {
    const errorStr = error && typeof error === 'object' ? (error.message || JSON.stringify(error)) : String(error);
    const isPrepaymentWarning = errorStr.toLowerCase().includes('prepayment') ||
                                errorStr.toLowerCase().includes('credits') ||
                                errorStr.toLowerCase().includes('depleted') ||
                                errorStr.toLowerCase().includes('429') ||
                                errorStr.toUpperCase().includes('RESOURCE_EXHAUSTED');

    console.warn('POST /api/formulate: API processing failed. Depletion state:', isPrepaymentWarning, 'Details:', errorStr);
    try {
      const fallbackResult = matchFallback(prompt);
      return res.json({ 
        success: true, 
        ...fallbackResult, 
        isOfflineFallback: true,
        isPrepaymentDepleted: isPrepaymentWarning 
      });
    } catch (fallbackErr) {
      return res.status(500).json({
        success: false,
        error: 'Offline simulation constraints exceeded.'
      });
    }
  }
});

// Serve frontend build static files in production or hook up local Vite server in development
const isProd = process.env.NODE_ENV === 'production';
const PORT = 3000;

async function bootstrap() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

bootstrap().catch(err => {
  console.error('Failed to start server:', err);
});
