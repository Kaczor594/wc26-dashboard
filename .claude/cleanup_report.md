# Cleanup Report — 2026-06-18

## Session Summary
Migrated the dashboard's data store from Vercel Blob (whose 2,000-advanced-ops/
month free cap blocked the store, taking the site down) to Cloudflare R2, then
did the post-migration cleanup. Spanned two repos: `wc26-dashboard` (read path +
config + docs) and `worldcup-2026-model` (publisher → boto3/R2). Audited inline
(small, well-understood change set authored this session) rather than via agents.

## Priority 1: Broken References (will cause errors)
- None. `upload_blob`'s changed signature `(client, name, body)` has exactly one
  caller (`publish_dashboard.py:561`, correct). No stale `BLOB_BASE_URL`,
  `@vercel/blob`, `blob_put.mjs`, `BLOB_PREFIX`, `BLOB_PUT_HELPER`, or
  `subprocess`/node references remain in code. `data/matchday/.env` has no stale
  `BLOB_READ_WRITE_TOKEN`. Both repos' working trees were clean before this audit.

## Priority 2: Dead Code (safe to remove)
- [x] DONE this session — stale File-Structure entry for the deleted
  `scripts/blob_put.mjs` at `wc26-dashboard/CLAUDE_HANDOFF.md:60` replaced with a
  note that uploads now live in the model publisher. (This handoff edit is
  uncommitted — fold it into the next commit.)

## Priority 3: Efficiency Improvements (optional but beneficial)
- None introduced or newly exposed. The migration itself is the efficiency win
  (R2 free tier ~10M ops/mo vs Blob's 2,000; per-tick publish uses ~0.1%).

## Priority 4: Condensation Opportunities (code simplification)
- [x] DONE this session — extracted the duplicated allow-list + URL shape from
  `route.ts` and `serverFetch.ts` into `src/lib/dataSource.ts` (`ALLOWED` +
  `dataUrl(file)`). Both read paths now import it, so the two can't drift. Build
  green.

## Notes (intentional — do NOT remove)
- `.site-foot-link` (`globals.css`) is defined but only referenced inside a
  commented-out `<a>` in `Footer.tsx`. Deliberate: the GitHub source link is
  pre-staged to be uncommented once the repo goes public. Leave both in place.
  (Carried forward from the 2026-06-16 report.)

## Cross-File Consistency (verified clean)
- `BLOB_BASE_URL` → `DATA_BASE_URL` rename consistent across `route.ts`,
  `serverFetch.ts`, `.env.local`, Vercel (Prod+Dev), `CLAUDE.md`, `CLAUDE_HANDOFF.md`.
- `@vercel/blob` removed from `package.json` + `package-lock.json`; dead Vercel
  `BLOB_READ_WRITE_TOKEN` removed from the dashboard project.
- Model repo R2 creds documented consistently in `CLAUDE.md`, `CLAUDE_HANDOFF.md`,
  and the `publish_dashboard.py` docstring.

## Follow-ups carried forward (feature work, not cleanup)
- Custom domain for the R2 bucket once a personal domain exists (currently on the
  rate-limited `pub-….r2.dev` dev URL); then update `DATA_BASE_URL`. Bookmarked in
  `CLAUDE_HANDOFF.md`.

## Files Modified This Session
**wc26-dashboard** (commits df621e9, c4df3b7; + uncommitted CLAUDE_HANDOFF.md fix):
- `src/app/api/data/[file]/route.ts`, `src/lib/serverFetch.ts`
- `package.json`, `package-lock.json`
- `scripts/blob_put.mjs` (deleted)
- `.env.local` (gitignored), `CLAUDE.md`, `CLAUDE_HANDOFF.md`

**worldcup-2026-model** (commit 32d8085):
- `scripts/publish_dashboard.py`, `CLAUDE.md`, `CLAUDE_HANDOFF.md`
