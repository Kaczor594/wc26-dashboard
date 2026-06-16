# Claude Code Handoff — wc26-dashboard

> Last updated: 2026-06-16
> Repo: https://github.com/Kaczor594/wc26-dashboard.git
> Branch: main
> Live: https://wc26-dashboard-nu.vercel.app

## Project Summary
Public front-end for the World Cup 2026 prediction model. Next.js 16 (App
Router) + React 19 + TypeScript + Tailwind v4 + Recharts. **Frontend only** —
no backend and no model code lives here. All data is published by the model
repo (`~/claude-projects/worldcup-2026-model`, see its `CLAUDE.md` +
`CLAUDE_HANDOFF.md`) as 5 JSON blobs to Vercel Blob after every matchday-agent
tick; this app reads those blobs and renders them. Design is Isaac's
kaczor-design natural palette.

## Current State
All five pages work and are deployed:
- `/` **Matches** — prelim + final (lineup-conditioned) predictions, excitement,
  divergence-vs-market calls, expandable per-row score-probability matrix.
- `/performance` — Brier/log model-vs-market log.
- `/tournament` — Monte Carlo stage probabilities + staleness banner.
- `/players` — minutes-deficit analysis (ESPN-derived minutes) + expected-vs-
  actual scatter (card title reworded 2026-06-16 to name both directions).
- `/method` — static, prose-first explainer of how the model is calculated
  (audience: ~1–2 stats courses). Live and verified 200.

Working tree clean; `main` is pushed; production is deployed.

## Environment Setup
- `npm install`, then `npm run dev` → **port 3001** (port 3000 is taken by
  dav-prep; Next auto-falls back to 3001).
- `npm run build` before every deploy.
- `.env.local` requires `BLOB_BASE_URL=https://lpk0kojgqwo5via5.public.blob.vercel-storage.com`
  (the upstream Vercel Blob base the API proxy fetches from).
- Vercel CLI is linked (`.vercel/project.json`: project `wc26-dashboard`, team
  kaczor594s-projects). `npx vercel ls` works without extra auth in this env.

## File Structure
- `src/app/layout.tsx` — root shell: `<Rail/>` + `<Header/>` + `<main>` grid,
  Vercel `<Analytics/>`, viewport-fit=cover.
- `src/app/page.tsx` — Matches (largest page; client component, polls blobs).
- `src/app/performance|tournament|players/page.tsx` — the other data pages.
- `src/app/method/page.tsx` — **NEW**. Static server component (no hooks, no
  client JS, prerendered). All content is in-file (FLOW / BARS / GLOSSARY /
  CAVEATS arrays + small `Formula` helper).
- `src/app/api/data/[file]/route.ts` — proxies the 5 blobs with `cache:"no-store"`
  upstream + `max-age=30, s-maxage=60` response header (the Data Cache once
  pinned a stale blob for 7h — freshness lives in the header, not the cache).
- `src/app/globals.css` — the dashboard UI kit (kit port + app styles). The
  `/method` styles live in a single `.mthd-*` block appended at the end.
- `src/styles/tokens.css` — kaczor-design tokens (palette, fonts, scale). Canonical.
- `src/components/shell/Rail.tsx` — left icon nav (`NAV` array). `Header.tsx` —
  top bar (`PAGE_NAME` map + live/stale badge).
- `src/components/ui/` — Card, Kpi, ProbBar, ScoreMatrix primitives.
- `src/lib/` — `fetcher.ts` (60s polling hook), `types.ts` (mirrors the
  publisher's schema_version 1), `format.ts`, `scoreMatrix.ts` (Dixon-Coles grid,
  mirrors the R model), `chartStyles.ts`, `useIsMobile.ts`.
- `scripts/blob_put.mjs` — upload helper the model's publisher shells out to.

## Architecture
- App Router. Data pages are `"use client"` and poll the blob proxy every 60s
  via `usePolledJson`. The new `/method` page is a **server component** (static
  content → prerendered, no hydration cost).
- Data contract: `src/lib/types.ts` ⇄ `worldcup-2026-model/scripts/publish_dashboard.py`
  (schema_version 1). **Change them together.**
- Styling is class-based in `globals.css` using `tokens.css` variables. New UI
  should add semantic classes there, not inline styles. Design rules: no card
  borders (shadow elevation only), hairline internal dividers, mono-caps
  eyebrows, tabular mono numerals, finding-first (claim) card titles, sentence
  case, ≤4 colors/chart (moss focal + gray context), direct labels over legends,
  source line on every chart, no emoji.

## Git Workflow
- Single repo, work on `main`, push directly. Commit messages via HEREDOC;
  end with the `Co-Authored-By: Claude Opus 4.8` trailer.
- **Never `git add -A`.** Stage explicit paths. Gitignored (never stage):
  `node_modules/`, `.next/`, `out/`, `.env*`, `.vercel`, `*.tsbuildinfo`,
  `next-env.d.ts`, `.DS_Store`.
- **Deploy is a separate manual step** — pushing to `main` does NOT ship the
  site. After pushing: `npm run build` (sanity) → `npx vercel --prod`.
- Doc-only commits (this handoff, CLAUDE.md) don't need a `vercel --prod` —
  they don't affect the deployed app.

## Recent Changes
### 2026-06-16 (this session — frontend)
- **Reworded the `/players` "Expected vs actual" card title.** Old title
  ("Below the line means the coach disagrees with the model.") implied only
  under-use was divergence; distance from the line in *either* direction is the
  disagreement. New title: *"Off the line, the coach plays a player more (above)
  or less (below) than modeled."* (`src/app/players/page.tsx:125`). Commit
  `b876d91`; pushed + deployed via `npx vercel --prod` (aliased to the canonical
  domain).

> Investigation note (no code change): traced why Spain's title odds appeared to
> move "overnight" after the Cape Verde draw. The sim re-runs after **every**
> result (not overnight) — confirmed in the model repo's matchday-agent log
> (refresh at 18:06Z, ~2 min after the draw). The delayed visible move is the
> known in-tournament **Elo drift**: half the team rating is eloratings.net's
> published Elo, an external feed that updates on a lag, so the rating-driven
> drop landed on a later refresh. All in the **worldcup-2026-model** repo.

### 2026-06-13 (frontend)
- **Added `/method`** — a "how the predictions are calculated" explainer. Four-
  stage pipeline diagram (Players → Team strength → Match model → Tournament),
  per-stage prose + one formula each, WC-specific calibration notes (half host
  advantage; +0.15 goal bump), lineup-conditioning, a truncated/flagged backtest
  bar chart (model 1.003 vs Elo 1.010 vs coin-flip 1.099 log-loss), a limits
  card, and an 8-term statistical glossary (z-score, Elo, Poisson, λ,
  Dixon-Coles, Monte Carlo, log-loss, **vig**). New file `src/app/method/page.tsx`;
  `.mthd-*` styles in `globals.css`; nav wired into `Rail.tsx` (BookOpen icon) +
  `Header.tsx`. Commit `97b6453`.
- **Fixed the deploy note in `CLAUDE.md`** (`5f7bedb`): deploys are manual
  `vercel --prod`, not GitHub auto-deploy (see Known Issues).
- Both changes pushed to `main`; site deployed via `npx vercel --prod` (the
  push alone did nothing — that's how we discovered the auto-deploy gap).

> Note: the model/backtest work referenced elsewhere this session (point-in-time
> backtest, host home-adv 0.14, WC goal bump) is in the **worldcup-2026-model**
> repo and its own handoff — not this one. This repo is frontend only.

## Known Issues
- **No GitHub→Vercel auto-deploy.** The integration was never connected; the
  entire Vercel deployment history is manual CLI deploys. `git push` updates
  GitHub but triggers no build. **Always run `npx vercel --prod` after pushing.**
- **Stale-blob trap (handled).** The Next Data Cache once served a 7h-stale blob;
  the proxy now forces `cache:"no-store"` upstream and sets freshness in the
  response header. Don't reintroduce caching on that upstream fetch.
- `wc26-dashboard.vercel.app` belongs to someone else — the canonical domain is
  **wc26-dashboard-nu.vercel.app** (auto-aliased by `vercel --prod`).
- Port 3000 is dav-prep's; dev runs on 3001.

## Next Steps
- [ ] Optional: the `/method` Validation card uses log-loss (accurate but
  abstract). Isaac may want an "accuracy vs a coin flip" framing instead/as well.
- [ ] Keep `src/lib/types.ts` in sync if the model's `publish_dashboard.py`
  schema changes (e.g. new blob fields).
- [ ] `/performance` draw-overpricing readout becomes meaningful once ≥~15
  matches are logged (tracked in the model repo).
