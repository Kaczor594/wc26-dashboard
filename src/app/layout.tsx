import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Rail from "@/components/shell/Rail";
import Header from "@/components/shell/Header";
import Footer from "@/components/shell/Footer";
import { fetchBlob } from "@/lib/serverFetch";
import type { Meta } from "@/lib/types";

// Render per request so the SSR HTML always carries fresh blob data (the
// dashboard is "live"); the blob CDN + route s-maxage are the cache layers.
export const dynamic = "force-dynamic";

// viewport-fit=cover lets env(safe-area-inset-bottom) work on iOS so the
// bottom nav clears the home indicator
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://wc26-dashboard-nu.vercel.app"),
  title: "WC26 model — live dashboard",
  description:
    "Player-based World Cup 2026 prediction model: live captures, market comparison, tournament simulation.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const meta = await fetchBlob<Meta>("meta");
  return (
    <html lang="en">
      <body>
        <div className="app">
          <Rail />
          <Header initialMeta={meta} />
          <main className="main">
            {children}
            <Footer />
          </main>
        </div>
        <Analytics />
      </body>
    </html>
  );
}
