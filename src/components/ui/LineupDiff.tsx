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

/** Sign → color class for a rounded Elo delta: moss (up) for +, terracotta
 *  (down) for −, gray (flat) at 0. Rounds first so the color matches the
 *  integer that's displayed. */
const eloDirClass = (v: number) => {
  const r = Math.round(v);
  return r === 0 ? "flat" : r < 0 ? "down" : "up";
};

/** Signed Δ chip — moss for an upgrade, terracotta for a downgrade, gray when
 *  flat. Dotted underline flags an estimate (capture predates the freeze). */
function Delta({ elo, pp, exact }: { elo: number | null; pp: number | null; exact: boolean }) {
  if (elo == null) return null;
  return (
    <span
      className={`lud-delta ${exact ? "" : "approx"}`}
      title={exact ? undefined : "estimated from current ratings — captured before this view existed"}
    >
      <span className={eloDirClass(elo)}>
        {elo > 0 ? "+" : elo < 0 ? "−" : ""}
        {Math.abs(Math.round(elo))} Elo
      </span>
      {pp != null && (
        <>
          {" · "}
          <span className={Math.abs(pp) < 1e-9 ? "flat" : pp < 0 ? "down" : "up"}>
            {pp > 0 ? "+" : pp < 0 ? "−" : ""}
            {Math.abs(pp * 100).toFixed(1)}pp
          </span>
        </>
      )}
    </span>
  );
}

/** Signed per-player Elo contribution — moss for +, terracotta for −. */
function EloNum({ v }: { v: number }) {
  const r = Math.round(v);
  return (
    <span className={`lud-elo ${eloDirClass(v)}`}>
      {r > 0 ? "+" : r < 0 ? "−" : ""}
      {Math.abs(r)}
    </span>
  );
}

function EloGroup({
  label,
  rows,
}: {
  label: string;
  rows: { player: string; pos: string; d_elo: number }[];
}) {
  if (rows.length === 0) return null;
  return (
    <div className="lud-grp">
      <span className="eyebrow">{label}</span>
      <ul className="lud-list">
        {rows.map((p) => (
          <li key={p.player} className="lud-row">
            <span className="lud-player">{p.player}</span>
            <span className="pos">{p.pos}</span>
            <EloNum v={p.d_elo} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Side({ side, exact }: { side: LineupSide; exact: boolean }) {
  const expected = new Set(side.expected_xi.map((p) => p.player));
  const hasActual = side.actual_xi != null && side.actual_xi.length > 0;
  const xi = hasActual ? side.actual_xi! : side.expected_xi;
  const sorted = [...xi].sort((a, b) => posRank(a.pos) - posRank(b.pos));
  const confirmed = hasActual ? new Set(side.actual_xi!.map((p) => p.player)) : null;
  const benched = hasActual
    ? side.expected_xi.filter((p) => !confirmed!.has(p.player))
    : [];

  // Per-player Elo attribution (when the capture carries it): the team Δ split
  // into who left the expected XI (negatives) and who came in (positives). The
  // "lineup-certainty + residual" line is everything else — dominated by the
  // minutes reallocated from the uncertain-rotation tail onto the confirmed XI
  // when the lineup locks (a certainty premium, largest for squads with a steep
  // first-XI/bench quality drop-off), plus the first-order attribution's
  // reconciling error so the parts sum to the team Δ implied-Elo.
  const hasAttrib = side.attrib != null && side.attrib.length > 0;
  const attr = new Map((side.attrib ?? []).map((a) => [a.player, a.d_elo]));
  const dElo = (name: string) => attr.get(name) ?? 0;
  const off = benched
    .map((p) => ({ player: p.player, pos: p.pos, d_elo: dElo(p.player) }))
    .sort((a, b) => a.d_elo - b.d_elo);
  const into = (hasActual ? side.actual_xi! : [])
    .filter((p) => !expected.has(p.player))
    .map((p) => ({ player: p.player, pos: p.pos, d_elo: dElo(p.player) }))
    .sort((a, b) => b.d_elo - a.d_elo);
  const shown = [...off, ...into].reduce((s, p) => s + p.d_elo, 0);
  const residual = (side.delta_implied_elo ?? shown) - shown;

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
      {hasActual && hasAttrib ? (
        <div className="lud-attrib">
          <EloGroup label="off the expected XI" rows={off} />
          <EloGroup label="into the XI" rows={into} />
          {Math.abs(residual) >= 1 && (
            <div className="lud-resid">
              <span className="lud-player">lineup-certainty + residual</span>
              <EloNum v={residual} />
            </div>
          )}
        </div>
      ) : hasActual ? (
        benched.length > 0 && (
          <div className="lud-benched">
            <span className="eyebrow">model expected to start</span>
            <div className="lud-benched-names">
              {benched
                .slice()
                .sort((a, b) => (b.min ?? 0) - (a.min ?? 0))
                .map((p) => (
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
  const anyAttrib =
    (ld.home?.attrib?.length ?? 0) > 0 || (ld.away?.attrib?.length ?? 0) > 0;
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
        {anyAttrib
          ? " · per-player Elo = quality × position weight × Δ minutes (off + into + shifts = team Δ Elo)"
          : ""}
        {anyActual && !ld.exact ? " · underlined = estimated from current ratings" : ""}
      </div>
    </div>
  );
}
