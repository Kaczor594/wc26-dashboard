# Claude Code Handoff — wc26-dashboard

> Last updated: 2026-06-18
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
- `.env.local` requires `DATA_BASE_URL=https://pub-093e38680bba4ee492e38e6e66f31161.r2.dev`
  (the public r2.dev base of the Cloudflare R2 bucket the API proxy fetches
  from; was Vercel Blob until the 2026-06-18 migration — see Recent Changes).
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
  mirrors the R model), `chartStyles.ts`, `useIsMobile.ts`, `serverFetch.ts`
  (SSR seed), `dataSource.ts` (the single source of truth for the data origin:
  `ALLOWED` allow-list + `dataUrl(file)` → `<DATA_BASE_URL>/wc26/<file>.json`,
  shared by the API proxy and the SSR seed so the two can't drift).
- Uploads are owned by the model's publisher (`worldcup-2026-model/scripts/
  publish_dashboard.py`, boto3 → Cloudflare R2 S3 API) — no upload helper lives
  in this repo since the 2026-06-18 R2 migration.

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
- **Auto-deploy is on** (since 2026-06-16) — pushing to `main` triggers a
  production build + deploy on Vercel; PRs/other branches get previews. Run
  `npm run build` locally first as a sanity check. `npx vercel --prod` still
  works to force a deploy without pushing.
- Doc-only commits (this handoff, CLAUDE.md) will trigger a (harmless) rebuild
  but don't change the rendered app.

## Recent Changes
### 2026-06-18 (Cloudflare R2 migration — site outage fix)
The site showed "Connecting to the model feed" on all pages: the Vercel Blob
store was **blocked** ("Your store is blocked", public reads 403). Cause: Blob's
free tier caps **advanced operations at 2,000/month**, and each `put` is one —
the matchday agent re-publishes every 5 min and *always* writes `meta.json` (the
liveness ping), so the floor was ~288 puts/day ≈ 8.6k/mo, ~4–5× over. The block
is a fixed **30-day** pause (not a billing reset), so waiting wasn't viable.
- **Migrated storage to Cloudflare R2** (free tier ~10M ops/mo). Bucket
  `wc26-data`, public access via its r2.dev URL. Publisher
  (`worldcup-2026-model/scripts/publish_dashboard.py`) now uploads via **boto3**
  (R2 is S3-compatible); the node `blob_put.mjs` helper and the `@vercel/blob`
  dependency were both removed.
- Dashboard read path is **unchanged** (`<base>/wc26/<file>.json`) — R2 was a
  drop-in. The env var was renamed `BLOB_BASE_URL` → **`DATA_BASE_URL`** (local
  `.env.local` + Vercel Prod/Dev); comments in `route.ts`/`serverFetch.ts`
  updated from "Vercel Blob" to R2.
- Verified: `--force` publish populated all 5 objects, r2.dev serves them (200,
  `application/json`), proxy endpoints 200, SSR carries real data. Redeployed
  `--prod`. The paused Vercel Blob store is now unused — nothing depends on it.
- Post-migration cleanup (commits `c4df3b7`, `5e13184`): dropped `@vercel/blob`
  + the dead Vercel `BLOB_READ_WRITE_TOKEN`; extracted the shared allow-list +
  URL shape into `src/lib/dataSource.ts` (`ALLOWED` + `dataUrl`), now imported by
  both `route.ts` and `serverFetch.ts`. Audit (`.claude/cleanup_report.md`)
  otherwise clean — no orphaned references. Commits: `df621e9` (migration),
  `c4df3b7` (rename + dep drop), `5e13184` (shared module).
- Remaining follow-up: move the r2.dev public URL → a custom domain once the
  personal domain exists (better caching/longevity than the rate-limited r2.dev
  dev URL). Update `DATA_BASE_URL` in `.env.local` + Vercel when that happens.

### 2026-06-16 (employer-facing pass)
The site is now shared with prospective employers (alongside casual friends/
family use). A round of changes to surface authorship and engineering without
cluttering the casual view:
- **Site-wide colophon footer** (`src/components/shell/Footer.tsx`, rendered in
  `layout.tsx` inside `.main` as the last `span-2` row). Name + one-line
  description + stack line. **GitHub source link is bookmarked but commented
  out** — the repo is private; uncomment the `<a>` in `Footer.tsx` once public.
- **"How it's built" card on `/method`** — a 4-node Ingest→Model→Publish→Serve
  data-flow diagram (`.mthd-arch*` styles) + stack chips (`.mthd-chip`, styled
  to match `.badge`) + a closing note mapping the project to production
  analytics work. Surfaces the pipeline/engineering story that was invisible.
- **OG link-preview image** (`src/app/opengraph-image.tsx`, `next/og`). Static,
  no external font fetch (keeps the build deterministic), brand palette, reuses
  the rail `ik` mark. `metadataBase` added to `layout.tsx` so the URL resolves.
- **Matches KPI swap** — "Captured today" replaced with **"Model vs market"**
  (running model vs vig-free-market Brier + n), sourced from the performance
  blob (now polled on the Matches page too). Leads with the strongest
  validation signal instead of an often-zero op stat.
- **Post-review fixes** (after Isaac's review):
  - Arch stage labels (`.mthd-arch-k`) changed moss → `--fg-3` (gray) for
    readability.
  - Dropped two misleading red KPI tones on Matches: "Biggest model–market gap"
    no longer reddens (a gap isn't bad — semantic color is for good/bad deltas,
    not categories), and "Model vs market" greens **only** when the model
    *strictly* beats the market, neutral otherwise (was reddening on a marginal
    at-market result, which overstated a non-problem). Removed the now-unused
    `flagged` computation.
  - Removed dead `capturedToday` (left over from the KPI swap) from `page.tsx`.
- Design audited against the kaczor-design rules; all changes compliant.

### 2026-06-16 (ops)
- **Enabled GitHub→Vercel auto-deploy** via `vercel git connect` (linked the
  project to `Kaczor594/wc26-dashboard`, productionBranch `main`). Pushes to
  `main` now build + deploy automatically; the manual `vercel --prod` step is
  no longer required (still available to force a deploy). Updated `CLAUDE.md`
  + this doc's Git Workflow / Known Issues to match. Not yet exercised by a
  real push as of this edit.

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
- **GitHub→Vercel auto-deploy is connected** (2026-06-16). `git push` to `main`
  now triggers a production build automatically. (Historically it was not
  connected and every deploy was a manual `npx vercel --prod`.)
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
- [x] Draw-overpricing reviewed 2026-06-16 at n=16 (h2h): actual draws 8/16
  (50%) vs market-implied 22.9% / model 25.1% (z≈+2.6/+2.3). The market did
  **not** overprice draws — both under-priced them, but it's a small,
  front-loaded sample driven by two tail draws (ESP 0-0 CPV @7%, QAT 1-1 SUI
  @13%) in cagey openers. No action; consistent with the model repo's standing
  "keep plain Poisson, no draw curve" decision. Revisit after the group stage
  (~n=40+) when front-loading washes out.
- [ ] Custom domain (P6, bookmarked): Isaac plans a personal site; a
  `wc26.<personal-domain>` subdomain is the right path once that exists.
- [x] Arch stage labels on `/method` (`.mthd-arch-k`) changed moss → `--fg-3`
  (gray) for readability, per Isaac's review.
- [x] Removed two misleading red KPIs on Matches: "Biggest model–market gap"
  no longer reddens (a gap isn't bad — semantic color is for good/bad deltas,
  not categories), and "Model vs market" now greens **only** when the model
  strictly beats the market, neutral otherwise (was reddening when marginally
  behind, which overstated a non-problem on a near-tie).
