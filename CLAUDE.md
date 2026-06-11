# wc26-dashboard — Project Instructions

Public dashboard for the World Cup 2026 prediction model. Live at
https://wc26-dashboard-nu.vercel.app. The model, the matchday agent, and
the data publisher live in `~/claude-projects/worldcup-2026-model` (see
its CLAUDE.md + CLAUDE_HANDOFF.md) — this repo is the frontend only.

## Architecture
- Next.js 16 App Router + React 19 + TS + Tailwind v4 + Recharts. No
  backend: route handlers at `src/app/api/data/[file]` proxy 5 JSON blobs
  from Vercel Blob (`BLOB_BASE_URL` env, 60s revalidate); pages poll
  every 60s via `src/lib/fetcher.ts`.
- Data contract: `src/lib/types.ts` mirrors
  `worldcup-2026-model/scripts/publish_dashboard.py` (schema_version 1).
  Change them together.
- `scripts/blob_put.mjs` — upload helper the publisher shells out to
  (`@vercel/blob` SDK; the raw Blob REST API is presigned-only, don't
  replace with plain HTTP PUT).

## Design system
- Isaac's kaczor-design, **natural palette** (paper/stone/moss/terracotta,
  Fraunces + EB Garamond + Geist). Tokens vendored at
  `src/styles/tokens.css`; kit port + app styles in `src/app/globals.css`.
  Source bundle: `~/claude-projects/kaczor-design-system/` (never commit —
  contains personal uploads; the bundle README's graphite/blue palette
  prose is stale, the tokens are canonical).
- Rules: no card borders (shadow elevation only), hairline internal
  dividers, tabular mono numerals, mono-caps eyebrows, sentence case,
  finding-first card titles (claims, not labels), ≤4 colors per chart,
  gray context series + moss focal, direct labels over legends, no pies,
  source line on every chart, no emoji.

## Tooling / deploy
- `npm run dev` (port 3000 is taken by dav-prep — Next falls back to 3001).
- `npm run build` before pushing.
- Vercel project `wc26-dashboard` (team kaczor594s-projects); canonical
  domain **wc26-dashboard-nu.vercel.app** (`wc26-dashboard.vercel.app`
  belongs to someone else). GitHub auto-deploy on push to main; manual:
  `npx vercel --prod`.
- `.env.local`: `BLOB_BASE_URL=https://lpk0kojgqwo5via5.public.blob.vercel-storage.com`

## Key files
- `src/app/page.tsx` — Matches (upcoming + prelim/final predictions, excitement, divergence)
- `src/app/performance/page.tsx` — Brier/log model-vs-market log
- `src/app/tournament/page.tsx` — sim probabilities + staleness banner
- `src/app/players/page.tsx` — minutes-deficit analysis
- `src/components/ui/` — Card/Kpi/ProbBar primitives (kit ports)
