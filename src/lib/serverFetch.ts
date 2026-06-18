// First-paint SSR data. Server Components await this so the initial HTML
// carries real content (tables, KPIs, probabilities) instead of the
// "Connecting to the model feed" placeholder — crawlers, link-preview bots
// and no-JS clients all see the dashboard. The client then takes over live
// polling via usePolledJson, seeded with this same payload.
//
// Shares the allow-list + URL shape with the API proxy via dataSource.ts;
// same `cache: "no-store"` (the Data Cache once pinned a stale object for
// hours — keep freshness on the request, not the cache).
import { ALLOWED, dataUrl } from "@/lib/dataSource";

export async function fetchBlob<T>(file: string): Promise<T | null> {
  if (!ALLOWED.has(file)) return null;
  const url = dataUrl(file);
  if (!url) return null;
  try {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}
