"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { usePolledJson } from "@/lib/fetcher";
import { agoMinutes } from "@/lib/format";
import type { Meta } from "@/lib/types";

const PAGE_NAME: Record<string, string> = {
  "/": "Matches",
  "/performance": "Performance",
  "/tournament": "Tournament",
  "/players": "Players",
};

export default function Header() {
  const path = usePathname();
  const { data: meta } = usePolledJson<Meta>("meta", 60_000);
  // re-render the age every 30s without refetching
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  const age = meta ? agoMinutes(meta.generated_at) : null;
  const stale = age == null || age > 15;

  return (
    <header className="dh">
      <div className="dh-left">
        <div className="dh-title">
          <span className="eyebrow">WC26 model</span>
          <span className="dh-page">{PAGE_NAME[path] ?? "Dashboard"}</span>
        </div>
      </div>
      <div className="dh-right">
        {meta && (
          <span className="dh-breadcrumb">
            <span className="eyebrow">
              {meta.counts.captured} captured · {meta.counts.completed} played
            </span>
          </span>
        )}
        <span className={`badge-live ${stale ? "stale" : ""}`}>
          <span className="dot" />
          {age == null ? "connecting" : stale ? `stale · ${age}m` : `live · ${age}m ago`}
        </span>
      </div>
    </header>
  );
}
