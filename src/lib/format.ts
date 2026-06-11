export const pct = (v: number | null | undefined, digits = 0): string =>
  v == null ? "—" : `${(v * 100).toFixed(digits)}%`;

export const num = (v: number | null | undefined, digits = 2): string =>
  v == null ? "—" : v.toFixed(digits);

export const signed = (v: number | null | undefined, digits = 2): string =>
  v == null ? "—" : `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(digits)}`;

/** Kickoff in the viewer's local time. Render client-side only. */
export const kickoffLocal = (iso: string): string =>
  new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

export const kickoffTime = (iso: string): string =>
  new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

export const agoMinutes = (iso: string): number =>
  Math.round((Date.now() - new Date(iso).getTime()) / 60_000);

export const fixtureLabel = (home: string, away: string): string =>
  `${home} – ${away}`;

/** "in 3h 12m" / "2h ago" relative kickoff. */
export function untilKickoff(iso: string): string {
  const mins = Math.round((new Date(iso).getTime() - Date.now()) / 60_000);
  const fmt = (m: number) =>
    m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
  return mins >= 0 ? `in ${fmt(mins)}` : `${fmt(-mins)} ago`;
}
