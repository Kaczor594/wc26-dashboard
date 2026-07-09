import type { CSSProperties } from "react";

/** Direct-label style for Recharts LabelList (mono numerals, muted ink).
 *  Override `fill` inline where the label carries the finding. */
export const chartLabelStyle: CSSProperties = {
  fontSize: 10.5,
  fontFamily: "var(--font-mono)",
  fill: "var(--fg-2)",
};

/** Inverse-surface tooltip, shared by contentStyle and custom content. */
export const chartTooltipStyle: CSSProperties = {
  background: "var(--bg-inverse)",
  border: "none",
  borderRadius: 6,
  fontFamily: "var(--font-mono)",
  fontSize: 11,
  color: "var(--fg-on-inverse)",
};

/** Tooltip label (the match / fixture line). Explicit color + font is required:
 *  Recharts renders the label as a <p>, so the global `p { color: var(--fg-2) }`
 *  rule wins over the inherited inverse-surface color and washes the label out
 *  (near-invisible in dark theme, low-contrast in light). Inline style beats the
 *  selector. Mono 11px matches the value rows / running-accuracy tooltip. */
export const chartTooltipLabelStyle: CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 11,
  fontWeight: 600,
  color: "var(--fg-on-inverse)",
  marginBottom: 2,
};
