# LP Workbench — Backend Deployment Contract

The static `/optimization/` page works without any backend (cached demo
formulations are bundled). The "Live Gemini" path requires a small server-side
proxy because the Gemini API key must never ship in the client bundle.

This document describes the backend contract so the same frontend build can talk
to a Render, Railway, Fly.io, or Cloud Run deployment without code changes.

## Endpoint

```
POST {VITE_LP_API_BASE_URL}/api/formulate-lp
Content-Type: application/json
Body: { "prompt": "<= MAX_PROMPT_CHARS characters" }
```

Successful response (200):

```json
{
  "ok": true,
  "data": { /* formulation object matching the workbench schema */ }
}
```

The `data` object must include at minimum:
- `metadata.status`, `metadata.warnings`, `metadata.unsupported_features`
- `original_problem.interpreted_goal`, `original_problem.interpreted_context`
- `decision_variables[]`
- `general_form.objective.{ sense, coefficients, expression_latex }`
- `general_form.constraints[]`, `general_form.latex_block`
- `standard_form.{ variables_ordered, constraints, A_eq, b_eq, c, latex_block }`
- `matrix_form.{ A, b, c, variables, ... }`
- `solver_payload.{ variables, A_eq, b_eq, c, objective_sense_original, notes_for_solver_integration }`

Failure responses must use HTTP non-2xx OR `{ "ok": false, "error": "..." }`
so the frontend can degrade to the cached demo formulation.

## Required environment variables

| Variable           | Purpose                                                              | Example                                |
| ------------------ | -------------------------------------------------------------------- | -------------------------------------- |
| `GEMINI_API_KEY`   | Server-side Gemini key. **Never put this in the client.**            | Issue a fresh production key from Google AI Studio. |
| `GEMINI_MODEL`     | Model id to call.                                                    | `gemini-2.5-flash` or `gemini-2.5-pro`  |
| `ALLOWED_ORIGINS`  | Comma-separated CORS allowlist.                                      | `https://jishnughosh.com,https://jag954.github.io` |
| `MAX_PROMPT_CHARS` | Hard cap on prompt length. Match the frontend (currently 2500).       | `2500`                                  |
| `PORT`             | Port the backend listens on (Render/Railway inject this).            | `3000`                                  |

Optional:

| Variable                   | Purpose                                                | Default |
| -------------------------- | ------------------------------------------------------ | ------- |
| `REQUEST_TIMEOUT_MS`       | Server-side timeout when calling Gemini.               | `15000` |
| `RATE_LIMIT_WINDOW_MS`     | Rate limit window per IP.                              | `60000` |
| `RATE_LIMIT_MAX_REQUESTS`  | Max requests per IP per window.                        | `20`    |

## Server responsibilities

A minimal implementation should:

1. Read the JSON body, reject non-`application/json` or empty `prompt`.
2. Reject prompts longer than `MAX_PROMPT_CHARS` with HTTP 413.
3. Enforce CORS using `ALLOWED_ORIGINS` (deny by default).
4. Apply a lightweight per-IP rate limit (`express-rate-limit` is fine).
5. Call Gemini with `GEMINI_MODEL` using `GEMINI_API_KEY`, asking for JSON
   conforming to the workbench schema (provide a system prompt + example).
6. Validate the model's response is well-formed JSON with `solver_payload`.
7. On any failure, return `{ "ok": false, "error": "<message>" }` with HTTP 4xx
   or 5xx so the frontend falls back to the cached demo.
8. Never log the API key. Never echo the API key in responses or error messages.

## Frontend configuration

The frontend resolves the backend URL in this order:

1. Build-time env: `VITE_LP_API_BASE_URL` baked into the bundle at build time.
2. Runtime config: `formulateApiBaseUrl` inside `/optimization/optimization-config.json`.
3. Empty string → page stays in cached-demo mode.

The default `public/optimization-config.json` ships with `formulateApiBaseUrl: ""`
so the public site never reaches out to a private or localhost URL.

When you deploy the backend, either:

- Rebuild with `VITE_LP_API_BASE_URL=https://your-backend.example.com npm run build`, or
- Update `optimization/optimization-config.json` after the build with the deployed URL.

## Security checklist before going live

- [ ] **Issue a dedicated production `GEMINI_API_KEY`** from Google AI Studio
      for the backend. Do not reuse a local development key.
- [ ] Set `GEMINI_API_KEY` only as a backend secret (Render/Railway env vars),
      never in the repo, the frontend bundle, or client-side config files.
- [ ] Confirm `git grep -i "AIza"` returns no matches in the repo or
      `/optimization/` build artifacts.
- [ ] Confirm `ALLOWED_ORIGINS` lists only the production portfolio domains.
- [ ] Confirm the frontend only points at the backend URL, never directly at
      `generativelanguage.googleapis.com`.
- [ ] Confirm the backend strips authentication headers from inbound requests
      (the frontend should not send any).
- [ ] Smoke-test: `curl -X POST https://your-backend/api/formulate-lp` with a
      valid prompt from an allowed origin, then from a disallowed origin.

## Local smoke test (when a server is implemented)

```bash
# In the backend project
GEMINI_API_KEY=... GEMINI_MODEL=gemini-2.5-flash \
  ALLOWED_ORIGINS=http://localhost:5173 PORT=3000 \
  npm start

# In the frontend project
VITE_LP_API_BASE_URL=http://localhost:3000 npm run dev
```

The workbench status badge should switch from "Cached Demo" to "Live Gemini"
after a successful call.
