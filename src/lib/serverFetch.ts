// First-paint SSR data. Server Components await this so the initial HTML
// carries real content (tables, KPIs, probabilities) instead of the
// "Connecting to the model feed" placeholder — crawlers, link-preview bots
// and no-JS clients all see the dashboard. The client then takes over live
// polling via usePolledJson, seeded with this same payload.
//
// Mirrors the upstream logic of /api/data/[file]/route.ts: same allow-list,
// same R2 path, same `cache: "no-store"` (the Data Cache once pinned a
// stale object for hours — keep freshness on the request, not the cache).
const ALLOWED = new Set([
  "meta",
  "matches",
  "performance",
  "tournament",
  "players",
]);

export async function fetchBlob<T>(file: string): Promise<T | null> {
  if (!ALLOWED.has(file)) return null;
  const base = process.env.DATA_BASE_URL;
  if (!base) return null;
  try {
    const r = await fetch(`${base}/wc26/${file}.json`, { cache: "no-store" });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}
