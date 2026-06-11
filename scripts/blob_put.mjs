// Upload stdin to Vercel Blob at the given pathname. Used by the
// worldcup-2026-model publisher (scripts/publish_dashboard.py) — the raw
// REST wire format changed to a presigned flow, so we go through the SDK.
//   echo '{"a":1}' | BLOB_READ_WRITE_TOKEN=... node blob_put.mjs wc26/meta.json
import { put } from "@vercel/blob";

const pathname = process.argv[2];
if (!pathname) {
  console.error("usage: blob_put.mjs <pathname>  (body on stdin)");
  process.exit(2);
}
const chunks = [];
for await (const c of process.stdin) chunks.push(c);
const res = await put(pathname, Buffer.concat(chunks), {
  access: "public",
  addRandomSuffix: false,
  allowOverwrite: true,
  cacheControlMaxAge: 60,
  contentType: "application/json",
});
console.log(res.url);
