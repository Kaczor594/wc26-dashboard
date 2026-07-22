import type { Probs } from "@/lib/types";

/** W/D/L micro-stack. `model` uses moss/stone/terracotta; `ctx` (market)
 *  is all-gray per the context-series rule; `xw` (post-match xWDL / xG-based
 *  xWDL) uses lighter steps of the model hues. */
export function ProbBar({
  p,
  kind = "model",
  showNums = true,
}: {
  p: Probs;
  kind?: "model" | "ctx" | "xw";
  showNums?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div className={`prob-bar ${kind === "model" ? "" : kind}`}>
        <i className="ph" style={{ width: `${p.home * 100}%` }} />
        <i className="pd" style={{ width: `${p.draw * 100}%` }} />
        <i className="pa" style={{ width: `${p.away * 100}%` }} />
      </div>
      {showNums && (
        <span className="prob-nums">
          {Math.round(p.home * 100)}·{Math.round(p.draw * 100)}·
          {Math.round(p.away * 100)}
        </span>
      )}
    </div>
  );
}
