import type { Probs } from "@/lib/types";

/** W/D/L micro-stack. Model variant uses moss/stone/terracotta; the
 *  `context` variant (market) is all-gray per the context-series rule. */
export function ProbBar({
  p,
  context = false,
  showNums = true,
}: {
  p: Probs;
  context?: boolean;
  showNums?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div className={`prob-bar ${context ? "ctx" : ""}`}>
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
