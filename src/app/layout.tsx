import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Rail from "@/components/shell/Rail";
import Header from "@/components/shell/Header";
import Footer from "@/components/shell/Footer";

// The tournament is over (2026-07-19): the site is a static retrospective.
// Every page prerenders at build time from committed data — no runtime
// data dependency, no polling.

// viewport-fit=cover lets env(safe-area-inset-bottom) work on iOS so the
// bottom nav clears the home indicator
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://wc26-dashboard-nu.vercel.app"),
  title: "WC26 model — tournament review",
  description:
    "A player-based World Cup 2026 prediction model, reviewed after the final: model vs market scoreboard, the champion it saw coming, and the tournament's luck table.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="app">
          <Rail />
          <Header />
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
