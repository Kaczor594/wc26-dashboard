import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Kpi } from "@/components/ui/Kpi";
import { ProbBar } from "@/components/ui/ProbBar";
import {
  BEST_CALLS,
  BREAKOUTS,
  FACTS,
  FAVORITE_BIAS,
  FLOPS,
  GOLDEN_BOOT,
  GROUPS_CALLED,
  HERO,
  KPIS,
  LUCK,
  LUCK_NOTES,
  MESSI_NOTE,
  OVERACHIEVERS,
  SPAIN_ENGINE,
  SPAIN_PATH,
  STAGE_LL,
  THIRDS_LL,
  UNDERWHELMERS,
  VERDICT,
  WORKHORSE_NOTE,
  WORST_CALLS,
} from "@/data/retro";
import type { RetroCall, RetroLLRow, RetroPlayerCard, RetroSurprise } from "@/lib/types";

export const metadata: Metadata = {
  title: "WC26 model — tournament review",
  description:
    "How a player-based World Cup 2026 prediction model actually did: the champion it saw coming, an honest model-vs-market scoreboard, the luck table, and the players who broke the ratings.",
};

/* ---- chart helpers (static markup, no client JS) ---------------------- */

// Log-loss bars share a truncated scale so the model/market gap is visible;
// the ≋ marker + note flag the truncation per the kit rule.
const LL_MIN = 0.75;
const LL_MAX = 1.0;
const llw = (v: number) =>
  `${(((v - LL_MIN) / (LL_MAX - LL_MIN)) * 100).toFixed(1)}%`;

function LLGroup({ row }: { row: RetroLLRow }) {
  return (
    <div className="retro-llgroup">
      <div className="retro-llgroup-name">
        {row.label} <span className="n">n={row.n}</span>
      </div>
      <div className="retro-llbar">
        <span className="who">Model</span>
        <div className="retro-bar-track">
          <div className="retro-bar-fill focal" style={{ width: llw(row.model) }} />
        </div>
        <span className="val">{row.model.toFixed(3)}</span>
      </div>
      <div className="retro-llbar">
        <span className="who">Market</span>
        <div className="retro-bar-track">
          <div className="retro-bar-fill" style={{ width: llw(row.market) }} />
        </div>
        <span className="val">{row.market.toFixed(3)}</span>
      </div>
    </div>
  );
}

function CallRow({ c }: { c: RetroCall }) {
  return (
    <div className="retro-call">
      <div className="retro-call-head">
        <span className="retro-call-match">{c.match}</span>
        <span className="retro-call-outcome">
          {c.stage} · {c.outcomeLabel}
        </span>
      </div>
      <div className="retro-call-bars">
        <div className="retro-call-bar">
          <span className="who">Model</span>
          <ProbBar p={c.model} />
        </div>
        <div className="retro-call-bar">
          <span className="who">Market</span>
          <ProbBar p={c.market} kind="ctx" />
        </div>
        <div className="retro-call-bar">
          <span className="who">xWDL</span>
          <ProbBar p={c.xwdl} kind="xw" />
        </div>
      </div>
      <p className="retro-call-note">{c.note}</p>
    </div>
  );
}

function SurpriseRow({ s }: { s: RetroSurprise }) {
  return (
    <div className="retro-surp">
      <div className="retro-surp-head">
        <span className="retro-surp-team">{s.team}</span>
        <span className="retro-surp-odds">
          {s.modelChampPct}% title odds
          {s.marketChampPct != null && ` · market ${s.marketChampPct}%`}
        </span>
        <span className="retro-surp-finish">{s.finish}</span>
      </div>
      <p className="retro-surp-note">{s.note}</p>
    </div>
  );
}

function PlayerRow({ c }: { c: RetroPlayerCard }) {
  return (
    <div className="retro-player">
      <div className="retro-player-head">
        <span className="retro-player-name">{c.player}</span>
        <span className="retro-player-country">{c.country}</span>
        <span className="retro-player-stat">{c.stat}</span>
      </div>
      <p className="retro-player-note">{c.note}</p>
    </div>
  );
}

// Diverging luck bars: |Pts − xPts| maxes at 2.76, scale to 3.0 per half.
const LUCK_SCALE = 3.0;

/* ---- page ------------------------------------------------------------- */

export default function RetroPage() {
  return (
    <>
      {/* Hero ----------------------------------------------------------- */}
      <Card
        className="span-2 mthd-hero"
        eyebrow="Tournament review · Jun 11 – Jul 19, 2026"
        title="The model's number-one pick won the World Cup — and no champion in the data deserved it more"
        prose
        source="Model: kickoff-morning title probabilities · xWDL: FotMob xG · The final's winning goal came in extra time and is unattributed in every dataset used here."
      >
        <div className="mthd-lede">
          <p>
            {HERO.headline}. The model went into opening day with Spain as its
            top pick at {HERO.spain.modelChampPct}% — above the market&apos;s{" "}
            {HERO.spain.marketChampPct}% — and had Argentina, the eventual
            runner-up, at {HERO.argentina.modelChampPct}% against a market
            price of just {HERO.argentina.marketChampPct}% — its top two picks
            of the whole field were exactly the two teams that reached the final.
          </p>
          <p style={{ marginTop: 12 }}>
            <a href="/glossary" target="_blank" rel="noopener noreferrer" className="glossary-link">xWDL</a>{" "}
            says the pick aged even better than the scoreline:
            Spain finished with the field&apos;s best expected-goal difference,
            was the xWDL favourite in all eight of its games, and conceded once
            all month — while actually <em>under</em>-finishing its own
            chances. The least lucky champion on the board.
          </p>
        </div>

        <div className="retro-chips">
          <div className="retro-chip">
            <span className="retro-chip-val">+{HERO.xwdl.xgd.toFixed(1)}</span>
            <span className="retro-chip-lbl">xG difference — best in field</span>
          </div>
          <div className="retro-chip">
            <span className="retro-chip-val">≥{Math.round(HERO.xwdl.minWinProb * 100)}%</span>
            <span className="retro-chip-lbl">xWDL win prob, all 8 games</span>
          </div>
          <div className="retro-chip">
            <span className="retro-chip-val">
              {HERO.xwdl.goalsConceded} <span style={{ fontWeight: 400, color: "var(--fg-3)" }}>/ {HERO.xwdl.xga.toFixed(1)} xGA</span>
            </span>
            <span className="retro-chip-lbl">Goals conceded, whole tournament</span>
          </div>
          <div className="retro-chip">
            <span className="retro-chip-val">{HERO.xwdl.finishing.toFixed(1)}</span>
            <span className="retro-chip-lbl">Goals minus xG — under-finished</span>
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            Spain&apos;s run — never a lock
          </div>
          <div className="retro-bars">
            {SPAIN_PATH.map((m) => (
              <div className="retro-bar-row" key={m.opponent}>
                <span className="retro-bar-label">
                  <span className="stage">{m.stage}</span>
                  {m.opponent}
                  <span className="score">{m.score}</span>
                </span>
                <div className="retro-bar-track">
                  {m.modelWinPct != null && (
                    <div
                      className={`retro-bar-fill focal${m.reconstructed ? " recon" : ""}`}
                      style={{ width: `${m.modelWinPct}%` }}
                      title={m.reconstructed ? "Reconstructed from pre-match ratings — capture missed (network outage), not a live pre-kickoff capture" : undefined}
                    />
                  )}
                  <div className="retro-bar-tick" style={{ left: `${m.marketWinPct}%` }} />
                </div>
                <span className="retro-bar-val">
                  {m.modelWinPct != null ? `${m.modelWinPct.toFixed(0)}%` : "—"}
                  {m.reconstructed && <span className="recon-mark" title="Reconstructed, not a live capture">†</span>}{" "}
                  <span className="ctx">· {m.marketWinPct.toFixed(0)}%</span>
                </span>
              </div>
            ))}
          </div>
          <div className="retro-legend">
            <span><span className="sw" />Model win probability at kickoff</span>
            <span><span className="sw tick" />Market (vig-free consensus)</span>
            <span>† Uruguay: capture missed (network outage) — value reconstructed from pre-match ratings</span>
          </div>
        </div>
      </Card>

      {/* KPI row -------------------------------------------------------- */}
      <div className="retro-kpis span-2">
        {KPIS.map((k) => (
          <Kpi key={k.label} label={k.label} value={k.value} delta={k.sub} />
        ))}
      </div>

      {/* Model vs market ------------------------------------------------ */}
      <Card
        className="span-2"
        eyebrow="Model vs market"
        title="The market won the tournament — narrowly, and not in the knockouts"
        prose
        source={`100 matches with captured pre-kickoff odds · log-loss, lower is better · paired t-test p ≈ ${VERDICT.pValue} · ≋ scale starts at ${LL_MIN}, coin flip = ${VERDICT.uniformLL}`}
      >
        <div className="mthd-lede">
          <p>{VERDICT.summary}</p>
        </div>
        <div className="retro-llwrap" style={{ marginTop: 16 }}>
          <div className="retro-llcol">
            <span className="eyebrow"><span className="mthd-trunc">≋</span>By stage</span>
            {STAGE_LL.map((r) => (
              <LLGroup key={r.label} row={r} />
            ))}
          </div>
          <div className="retro-llcol">
            <span className="eyebrow"><span className="mthd-trunc">≋</span>By tournament third</span>
            {THIRDS_LL.map((r) => (
              <LLGroup key={r.label} row={r} />
            ))}
          </div>
        </div>
        <p className="mthd-note">
          {`Both forecasters beat the naive baselines by a distance (coin flip ${VERDICT.uniformLL}, season base rates ${VERDICT.baseRateLL}). Match by match the market took ${VERDICT.marketWon} of the 100 duels to the model's ${VERDICT.modelWon} — the profile of an underdog-backer: frequent small losses, occasional bigger wins. Scored on post-match xWDL instead of the scoreboard, the gap halves (${VERDICT.modelSoftLL} vs ${VERDICT.marketSoftLL}). Structurally the two disagree in one repeatable way: the market prices favourites +${FAVORITE_BIAS.market.toFixed(3)} win-probability points above what xWDL says they deserve, the model ${FAVORITE_BIAS.model.toFixed(3)} below — the model is the buy-the-underdog side of the market.`}
        </p>
      </Card>

      {/* Best / worst calls --------------------------------------------- */}
      <Card
        eyebrow="Best calls"
        title="Where the model beat the market — and xWDL agrees"
        source="Pre-kickoff probabilities, home·draw·away · xWDL = post-match xG win/draw/loss expectancy · all five calls corroborated by it"
      >
        {BEST_CALLS.map((c) => (
          <CallRow key={c.match} c={c} />
        ))}
      </Card>

      <Card
        eyebrow="Worst calls"
        title="Its one weak spot: underrating certain favourites"
        source="Pre-kickoff probabilities, home·draw·away · xWDL = post-match xG win/draw/loss expectancy · all three misses corroborated by it"
      >
        {WORST_CALLS.map((c) => (
          <CallRow key={c.match} c={c} />
        ))}
        <p className="mthd-note">
          The mirror image of its underdog edge: the same lever that priced
          Paraguay and Cape Verde correctly occasionally shaved too much off a
          genuine favourite.
        </p>
      </Card>

      {/* Luck ----------------------------------------------------------- */}
      <Card
        className="span-2"
        eyebrow="Luck, measured"
        title="Mexico ran hottest, and the two unluckiest teams both went home early"
        prose
        source="Group-stage points vs xWDL expected points (post-match xG-based, FotMob) · 3 games per team · teams with |Pts − xPts| ≥ 0.7 shown"
      >
        <div className="mthd-lede">
          <p>{LUCK_NOTES.headline}</p>
        </div>
        <div className="retro-divg">
          {LUCK.map((r) => {
            const luck = r.pts - r.xpts;
            const w = `${(Math.abs(luck) / LUCK_SCALE) * 100}%`;
            const lbl = (
              <>
                {r.team} <span className="v">{luck > 0 ? "+" : "−"}{Math.abs(luck).toFixed(2)}</span>
                {r.eliminated && <span className="out">out</span>}
              </>
            );
            return (
              <div className="retro-divg-row" key={r.team}>
                <div className="retro-divg-half l">
                  {luck < 0 ? (
                    <div className="retro-divg-bar" style={{ width: w }} />
                  ) : (
                    <div className="retro-divg-lbl at-axis-l">{lbl}</div>
                  )}
                </div>
                <div className="retro-divg-half r">
                  {luck > 0 ? (
                    <div className="retro-divg-bar" style={{ width: w }} />
                  ) : (
                    <div className="retro-divg-lbl at-axis-r">{lbl}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="retro-legend">
          <span><span className="sw pos" />Points above the xWDL expectation</span>
          <span><span className="sw neg" />Points below it</span>
          <span>OUT = eliminated in the group stage</span>
        </div>
        <p className="mthd-note">
          {LUCK_NOTES.reversals} {LUCK_NOTES.knockoutReversal}
        </p>
      </Card>

      {/* Surprises ------------------------------------------------------ */}
      <Card
        eyebrow="Overachievers"
        title="Norway's run was the shock the whole bracket felt"
        source="Day-0 title odds: kickoff-morning model (market shown where the gap is the story)"
      >
        {OVERACHIEVERS.map((s) => (
          <SurpriseRow key={s.team} s={s} />
        ))}
      </Card>

      <Card
        eyebrow="Underachievers"
        title="The old powers fell in the first knockout rounds"
        source={`Day-0 title odds: kickoff-morning model · ${GROUPS_CALLED.called} of ${GROUPS_CALLED.total} groups still went to the model's pre-tournament favourite`}
      >
        {FLOPS.map((s) => (
          <SurpriseRow key={s.team} s={s} />
        ))}
        <p className="mthd-note">
          {`For all the bracket chaos, ${GROUPS_CALLED.called} of ${GROUPS_CALLED.total} groups were still won by the model's pre-tournament favourite — the upsets came almost entirely in the knockout rounds.`}
        </p>
      </Card>

      {/* Players: golden boot + Spain engine ---------------------------- */}
      <Card
        eyebrow="Golden boot"
        title="Mbappé won the boot; Messi, at 38, was the engine"
        source="Goals: tournament record · xG, xA: FotMob per-player tournament totals"
      >
        <div className="table-scroll">
          <table className="mtable">
            <thead>
              <tr>
                <th>Player</th>
                <th>Team</th>
                <th className="num">Goals</th>
                <th className="num">Min</th>
                <th className="num">G−xG</th>
              </tr>
            </thead>
            <tbody>
              {GOLDEN_BOOT.map((r) => (
                <tr key={r.player}>
                  <td className="mname">{r.player}</td>
                  <td>{r.country}</td>
                  <td className="num">{r.goals}</td>
                  <td className="num">{r.minutes}</td>
                  <td className="num">
                    {r.gMinusXg != null ? `+${r.gMinusXg.toFixed(2)}` : <span className="cell-dash">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mthd-note">{MESSI_NOTE}</p>
      </Card>

      <Card
        eyebrow="The champion's engine"
        title={SPAIN_ENGINE.headline}
        source="Percentiles: pre-tournament model rating vs tournament output, both within the 248-player ≥300-minute pool"
      >
        {SPAIN_ENGINE.cards.map((c) => (
          <PlayerRow key={c.player} c={c} />
        ))}
        <p className="mthd-note">
          {SPAIN_ENGINE.benchNote} {WORKHORSE_NOTE}
        </p>
      </Card>

      {/* Breakouts / underwhelmers -------------------------------------- */}
      <Card
        className="span-2"
        eyebrow="Ratings vs reality"
        title="The player ratings missed in both directions"
        prose
        source="Quality percentile: pre-tournament model rating · output percentile: tournament performance index · both within the ≥300-minute pool"
      >
        <div className="retro-2col">
          <div>
            <span className="eyebrow">Broke out — Cape Verde&apos;s back line</span>
            {BREAKOUTS.map((c) => (
              <PlayerRow key={c.player} c={c} />
            ))}
          </div>
          <div>
            <span className="eyebrow">Underdelivered — the expensive names</span>
            {UNDERWHELMERS.map((c) => (
              <PlayerRow key={c.player} c={c} />
            ))}
          </div>
        </div>
      </Card>

      {/* Fun facts ------------------------------------------------------ */}
      <Card
        className="span-2"
        eyebrow="For the record"
        title="Four weeks in five lines"
        source="104 matches, 2026-06-11 → 2026-07-19 · scores verified against ESPN event data"
      >
        <div className="retro-facts">
          {FACTS.map((f) => (
            <div className="retro-fact" key={f}>{f}</div>
          ))}
        </div>
        <p className="mthd-note">
          Want the receipts? The full match-by-match scoreboard is on the{" "}
          <Link href="/performance">performance page</Link>, and the{" "}
          <Link href="/method">method page</Link> explains how the model works.
        </p>
      </Card>
    </>
  );
}
