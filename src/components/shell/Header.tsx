"use client";

import { usePathname } from "next/navigation";

const PAGE_NAME: Record<string, string> = {
  "/": "Tournament review",
  "/performance": "Performance",
  "/method": "Method",
};

export default function Header() {
  const path = usePathname();
  return (
    <header className="dh">
      <div className="dh-left">
        <div className="dh-title">
          <span className="eyebrow">WC26 model</span>
          <span className="dh-page">{PAGE_NAME[path] ?? "Dashboard"}</span>
        </div>
      </div>
      <div className="dh-right">
        <span className="dh-breadcrumb">
          <span className="eyebrow">Final · Spain won · 104 matches</span>
        </span>
      </div>
    </header>
  );
}
