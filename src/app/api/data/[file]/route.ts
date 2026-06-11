import { NextRequest, NextResponse } from "next/server";

// Proxy to the Vercel Blob store. Keeps the blob hostname out of the
// client and gives us a 60s shared cache.
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
  const base = process.env.BLOB_BASE_URL;
  if (!base) {
    return NextResponse.json({ error: "BLOB_BASE_URL not set" }, { status: 503 });
  }
  try {
    const r = await fetch(`${base}/wc26/${file}.json`, {
      next: { revalidate: 60 },
    });
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
