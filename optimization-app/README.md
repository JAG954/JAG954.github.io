# LP Formulation Workbench

Portfolio subpage for formulating linear programs from natural-language prompts,
reviewing algebraic and standard equality forms, and exporting solver-ready JSON.

## Local Development

```bash
npm install
npm run dev
```

The Vite base path is `/optimization/`, and production builds emit to
`../optimization` for GitHub Pages subpage deployment.

## API Configuration

The public app works without a live NLP endpoint by using deterministic fallback
formulations. To enable a live formulation service, set `VITE_LP_API_BASE_URL`
during build or set `formulateApiBaseUrl` in `public/optimization-config.json`.
The frontend posts to `{baseUrl}/api/formulate-lp`; API keys must stay on the
server side.
