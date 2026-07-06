# HEPROBench Site

Static benchmark website for HEPROBench, built with Vue 3, TypeScript, Vite, and Tailwind CSS.

The site is organized into two separate leaderboards:

- Virtual stain methods: loaded from the journal benchmark CSV.
- Pathology foundation models: loaded from original HEPRO cell-level evaluation results.

## Source Data

- Benchmark CSV: `public/data/all_eval_metrics_complete_20260322.csv`
- PFM cell metrics CSV: `public/data/foundation_models_cell_metrics.csv`

The PFM leaderboard is generated from benchmark cell-level evaluation summaries.
It ranks models by Cell PCC, Cell AUROC, and Cell F1.

## Local Development

```bash
npm install
npm run dev
```

The local dev server defaults to `http://localhost:5173/`.

## Production Build

```bash
npm run build
```

The static output is generated in `dist/`.

## Cloudflare Pages Deployment

### Git Integration

1. Push this project directory to a GitHub or GitLab repository.
2. In Cloudflare, open **Workers & Pages**.
3. Create a Pages application from an existing Git repository.
4. Use these build settings:
   - Framework preset: `Vue` or `Vite`
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `/` if this project is the repository root, or `heprobench-site` if it is inside a monorepo.
   - Environment variable: `NODE_VERSION=20` if Cloudflare does not auto-select Node 18+.
5. Save and deploy.

### Direct Upload With Wrangler

```bash
npm run build
npx wrangler pages project create
npx wrangler pages deploy dist
```

Wrangler will prompt for the Pages project name. The deployed site will be available at `<PROJECT_NAME>.pages.dev`.
