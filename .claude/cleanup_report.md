# Cleanup Report — 2026-06-16

## Session Summary
Employer-facing pass on the dashboard: added a site-wide colophon footer, a
"How it's built" card + OG image, swapped a Matches KPI to "Model vs market",
then removed two misleading red KPI tones and grayed the `/method` arch labels.
All committed and pushed (commits `a67d269`, `5e4ce33`, `a0b5b1d`); working tree
clean. Audited inline (small additive change set, 8 files) rather than via agents.

## Priority 1: Broken References (will cause errors)
- None. `flagged` was fully removed (no remaining references in `src/`); all new
  CSS classes (`mthd-arch*`, `mthd-stack`, `mthd-chip`, `site-foot*`) are both
  defined in `globals.css` and used.

## Priority 2: Dead Code (safe to remove)
- [x] DONE — `capturedToday` removed: deleted the `const capturedToday = …`
  block and dropped it from the `view` return in `src/app/page.tsx`. Build green.

## Priority 3: Efficiency Improvements (optional but beneficial)
- [x] DONE — covered by the P2 removal (the per-recompute `.filter()` over the
  full matches array is gone).

## Priority 4: Condensation Opportunities (code simplification)
- None warranted. The new code reuses existing primitives (`Card`, `Kpi`,
  `usePolledJson`) and the established `.mthd-*` style vocabulary.

## Notes (intentional — do NOT remove)
- `.site-foot-link` (`globals.css:346`) is defined but only referenced inside a
  commented-out `<a>` in `Footer.tsx:19`. This is deliberate: the GitHub source
  link is pre-staged and bookmarked to be uncommented once the repo goes public.
  Leave both the style and the commented markup in place.

## Files Modified This Session
- `src/app/page.tsx` (Matches KPIs + perf polling)
- `src/app/method/page.tsx` ("How it's built" card)
- `src/app/layout.tsx` (Footer mount + metadataBase)
- `src/app/opengraph-image.tsx` (new — OG image)
- `src/components/shell/Footer.tsx` (new — colophon)
- `src/app/globals.css` (`.mthd-arch*`, `.mthd-stack`, `.mthd-chip`, `.site-foot*`)
- `CLAUDE.md`, `CLAUDE_HANDOFF.md` (docs)
