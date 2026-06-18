import { NextRequest, NextResponse } from "next/server";

// Proxy to the Cloudflare R2 bucket (public r2.dev URL in DATA_BASE_URL).
// Keeps the storage hostname out of the client and gives us a 60s shared
// cache. (Moved off Vercel Blob 2026-06-18 — its 2k-ops/mo free cap blocked
// the store; R2's free tier is ~10M ops/mo.)
const ALLOWED = new Set([
  "meta",
  "matches",
  "performance",
  "tournament",
  "players",
]);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;
  if (!ALLOWED.has(file)) {
    return NextResponse.json({ error: "unknown file" }, { status: 404 });
  }
  const base = process.env.DATA_BASE_URL;
  if (!base) {
    return NextResponse.json({ error: "DATA_BASE_URL not set" }, { status: 503 });
  }
  try {
    // cache: "no-store" — Next's Data Cache pinned stale entries for hours
    // (revalidation wedged during an invalid-payload episode). The R2 CDN
    // (max-age=60) + this route's s-maxage=60 are the caching layers.
    const r = await fetch(`${base}/wc26/${file}.json`, { cache: "no-store" });
    if (!r.ok) {
      return NextResponse.json({ error: `upstream ${r.status}` }, { status: 502 });
    }
    const body = await r.json();
    return NextResponse.json(body, {
      headers: { "Cache-Control": "public, max-age=30, s-maxage=60" },
    });
  } catch {
    return NextResponse.json({ error: "fetch failed" }, { status: 502 });
  }
}
