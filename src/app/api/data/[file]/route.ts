import { NextRequest, NextResponse } from "next/server";
import { ALLOWED, dataUrl } from "@/lib/dataSource";

// Proxy to the Cloudflare R2 bucket (allow-list + URL shape in dataSource.ts).
// Keeps the storage hostname out of the client and gives us a 60s shared cache.

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;
  if (!ALLOWED.has(file)) {
    return NextResponse.json({ error: "unknown file" }, { status: 404 });
  }
  const url = dataUrl(file);
  if (!url) {
    return NextResponse.json({ error: "DATA_BASE_URL not set" }, { status: 503 });
  }
  try {
    // cache: "no-store" — Next's Data Cache pinned stale entries for hours
    // (revalidation wedged during an invalid-payload episode). The R2 CDN
    // (max-age=60) + this route's s-maxage=60 are the caching layers.
    const r = await fetch(url, { cache: "no-store" });
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
