import type { LineupSide, Match } from "@/lib/types";

// GK → defenders → midfield → attack, across both vocabularies (ESPN codes
// on confirmed XIs, model position buckets on expected XIs).
const POS_RANK: Record<string, number> = {
  G: 0, GK: 0,
  D: 1, CB: 1, FB: 1, LB: 1, RB: 1, WB: 1,
  M: 2, DM: 2, CM: 2, AM: 2,
  F: 3, ST: 3, W: 3, LW: 3, RW: 3, CF: 3,
};
const posRank = (p: string) => POS_RANK[(p || "").toUpperCase()] ?? 2;

/** Signed Δ chip — moss for an upgrade, terracotta for a downgrade, gray when
 *  flat. Dotted underline flags an estimate (capture predates the freeze). */
function Delta({ elo, pp, exact }: { elo: number | null; pp: number | null; exact: boolean }) {
  if (elo == null) return null;
  const dir = (v: number) => (Math.abs(v) < 1e-9 ? "flat" : v < 0 ? "down" : "up");
  const eloDir = Math.abs(elo) < 1 ? "flat" : elo < 0 ? "down" : "up";
  return (
    <span
      className={`lud-delta ${exact ? "" : "approx"}`}
      title={exact ? undefined : "estimated from current ratings — captured before this view existed"}
    >
      <span className={eloDir}>
        {elo > 0 ? "+" : elo < 0 ? "−" : ""}
        {Math.abs(Math.round(elo))} Elo
      </span>
      {pp != null && (
        <>
          {" · "}
          <span className={dir(pp)}>
            {pp > 0 ? "+" : pp < 0 ? "−" : ""}
            {Math.abs(pp * 100).toFixed(1)}pp
          </span>
        </>
      )}
    </span>
  );
}

function Side({ side, exact }: { side: LineupSide; exact: boolean }) {
  const expected = new Set(side.expected_xi.map((p) => p.player));
  const hasActual = side.actual_xi != null && side.actual_xi.length > 0;
  const xi = hasActual ? side.actual_xi! : side.expected_xi;
  const sorted = [...xi].sort((a, b) => posRank(a.pos) - posRank(b.pos));
  const confirmed = hasActual ? new Set(side.actual_xi!.map((p) => p.player)) : null;
  const benched = hasActual
    ? side.expected_xi
        .filter((p) => !confirmed!.has(p.player))
        .sort((a, b) => (b.min ?? 0) - (a.min ?? 0))
    : [];

  return (
    <div className="lud-side">
      <div className="lud-team">
        <span className="lud-name">{side.team}</span>
        {hasActual && <Delta elo={side.delta_implied_elo} pp={side.delta_pp} exact={exact} />}
      </div>
      <ul className="lud-list">
        {sorted.map((p) => (
          <li key={p.player} className={`lud-row ${hasActual && !expected.has(p.player) ? "new" : ""}`}>
            <span className="lud-player">{p.player}</span>
            <span className="pos">{p.pos}</span>
          </li>
        ))}
      </ul>
      {hasActual ? (
        benched.length > 0 && (
          <div className="lud-benched">
            <span className="eyebrow">model expected to start</span>
            <div className="lud-benched-names">
              {benched.map((p) => (
                <span key={p.player} className="lud-bn">
                  {p.player}
                  {p.min != null && <span className="num"> {Math.round(p.min)}′</span>}
                </span>
              ))}
            </div>
          </div>
        )
      ) : (
        <span className="lud-await eyebrow">awaiting confirmed XI</span>
      )}
    </div>
  );
}

/** Expected XI vs the confirmed XI for one match, with the model's response to
 *  the difference (player-implied Elo move + isolated win-prob swing). Renders
 *  beside the score matrix in the expanded match row. */
export function LineupDiff({ match }: { match: Match }) {
  const ld = match.lineup_diff;
  if (!ld || (!ld.home && !ld.away)) return null;
  const anyActual =
    (ld.home?.actual_xi?.length ?? 0) > 0 || (ld.away?.actual_xi?.length ?? 0) > 0;
  return (
    <div className="lud">
      <div className="lud-head">
        <span className="eyebrow">{anyActual ? "Model XI vs confirmed" : "Model's expected XI"}</span>
      </div>
      <div className="lud-cols">
        {ld.home && <Side side={ld.home} exact={ld.exact} />}
        {ld.away && <Side side={ld.away} exact={ld.exact} />}
      </div>
      <div className="lud-source">
        expected XI = top 11 by model minutes · terracotta = unexpected starter · Δ Elo =
        player-based rating move, opponent-independent · Δpp = win-probability swing from this
        XI alone, opponent held at its expected XI
        {anyActual && !ld.exact ? " · underlined = estimated from current ratings" : ""}
      </div>
    </div>
  );
}
