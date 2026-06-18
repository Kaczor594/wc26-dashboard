// Single source of truth for the dashboard's data origin (Cloudflare R2).
// Both the API proxy (`app/api/data/[file]/route.ts`) and the SSR seed
// (`serverFetch.ts`) read the allow-list and URL shape from here so the two
// can't drift. Storage moved off Vercel Blob 2026-06-18 — its 2k-ops/mo free
// cap blocked the store; R2's free tier is ~10M ops/mo.

export const ALLOWED = new Set<string>([
  "meta",
  "matches",
  "performance",
  "tournament",
  "players",
]);

/** Upstream URL for one data file, or null if DATA_BASE_URL is unset. */
export function dataUrl(file: string): string | null {
  const base = process.env.DATA_BASE_URL;
  return base ? `${base}/wc26/${file}.json` : null;
}
