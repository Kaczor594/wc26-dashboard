"use client";

import { Fragment, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { Card, Empty } from "@/components/ui/Card";
import { Kpi } from "@/components/ui/Kpi";
import { ProbBar } from "@/components/ui/ProbBar";
import { ScoreMatrix } from "@/components/ui/ScoreMatrix";
import { usePolledJson } from "@/lib/fetcher";
import { useIsMobile } from "@/lib/useIsMobile";
import { kickoffLocal, num, pct, untilKickoff } from "@/lib/format";
import { chartLabelStyle } from "@/lib/chartStyles";
import type { Match, MatchesBlob, PerformanceBlob, Probs } from "@/lib/types";

function lineupBadge(m: Match) {
  if (m.capture) {
    return m.capture.lineup_confirmed ? (
      <span className="badge badge-confirmed">XI confirmed</span>
    ) : (
      <span className="badge badge-prior">prior minutes</span>
    );
  }
  return <span className="badge badge-waiting">awaiting capture</span>;
}

function divergenceTitle(
  divs: { kind: string; call: string; name: string }[],
): string {
  if (divs.length === 0) return "No model–market disagreements yet.";
  const n = (k: string) => divs.filter((d) => d.kind === k).length;
  const parts: string[] = [];
  if (n("upset") > 0)
    parts.push(`${n("upset")} underdog call${n("upset") > 1 ? "s" : ""}`);
  if (n("draw") > 0)
    parts.push(`${n("draw")} draw call${n("draw") > 1 ? "s" : ""}`);
  if (parts.length === 0)
    return "The model and the market broadly agree — only favourite leans.";
  return `On the board: ${parts.join(" and ")}. Biggest: ${divs[0].call} in ${divs[0].name}.`;
}

/** Final (lineup capture) prediction when present; preliminary
 *  (current-ratings prior) otherwise — both shown once final exists.
 *  Single source for the desktop cell and the mobile card rows. */
function modelRows(m: Match) {
  const rows: { label: "final" | "prelim"; p: Probs; context: boolean }[] = [];
  if (m.capture) {
    rows.push({ label: "final", p: m.capture.p, context: false });
    if (m.prelim) rows.push({ label: "prelim", p: m.prelim.p, context: true });
  } else if (m.prelim) {
    rows.push({ label: "prelim", p: m.prelim.p, context: false });
  }
  return rows;
}

function modelCell(m: Match) {
  const rows = modelRows(m);
  if (rows.length === 0) return <span className="cell-dash">—</span>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {rows.map((r) => (
        <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ProbBar p={r.p} context={r.context} />
          <span className={`badge ${r.label === "final" ? "badge-confirmed" : "badge-waiting"}`}>
            {r.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function MatchesClient({
  initialMatches,
  initialPerf,
}: {
  initialMatches: MatchesBlob | null;
  initialPerf: PerformanceBlob | null;
}) {
  const { data } = usePolledJson<MatchesBlob>("matches", initialMatches);
  const { data: perf } = usePolledJson<PerformanceBlob>(
    "performance",
    initialPerf,
  );
  const [expanded, setExpanded] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const view = useMemo(() => {
    if (!data) return null;
    const now = Date.now();
    const upcoming = data.matches.filter(
      (m) => m.status !== "final" && new Date(m.kickoff_utc).getTime() > now - 3 * 3600_000,
    );
    const next = upcoming.find((m) => !m.placeholder);
    const lastBooks = data.matches
      .filter((m) => m.market)
      .map((m) => m.market!.n_books)
      .at(-1);
    const maxDiv = upcoming
      .filter((m) => m.divergence)
      .sort((a, b) => b.divergence!.tv - a.divergence!.tv)[0];
    const excitement = upcoming
      .filter((m) => m.excitement && !m.placeholder)
      .sort((a, b) => b.excitement!.score - a.excitement!.score)
      .slice(0, 10)
      .map((m) => ({
        name: `${m.home} – ${m.away}`,
        score: +(m.excitement!.score).toFixed(3),
        basis: m.excitement!.basis,
      }));
    const divergences = upcoming
      .filter((m) => m.divergence)
      .sort((a, b) => b.divergence!.edge_pp - a.divergence!.edge_pp)
      .slice(0, 12)
      .map((m) => {
        const d = m.divergence!;
        const team =
          d.edge_outcome === "draw"
            ? "draw"
            : d.edge_outcome === "home"
              ? m.home
              : m.away;
        const kind = d.edge_outcome === "draw" ? "draw" : d.edge_is_underdog ? "upset" : "fav";
        return {
          name: `${m.home} – ${m.away}`,
          edge: +(d.edge_pp * 100).toFixed(1),
          call: `${team} +${(d.edge_pp * 100).toFixed(1)}pp`,
          kind,
          final: d.basis === "final",
        };
      });
    return { upcoming, next, lastBooks, maxDiv, excitement, divergences };
  }, [data]);

  if (!data || !view) {
    return (
      <Card className="span-2" eyebrow="Matches">
        <Empty title="Connecting to the model feed" sub="data refreshes every 60 s" />
      </Card>
    );
  }

  const perfLast = perf?.cumulative.at(-1);
  const perfN = perf?.rows.filter((r) => r.market_p).length ?? 0;
  const mBrier = perfLast?.mean_brier_model;
  const kBrier = perfLast?.mean_brier_market;

  return (
    <>
      <div className="kpi-row span-2">
        <Kpi
          label="Next kickoff"
          value={view.next ? untilKickoff(view.next.kickoff_utc) : "—"}
          delta={view.next ? `${view.next.home} – ${view.next.away}` : undefined}
        />
        <Kpi
          label="Model vs market"
          value={mBrier != null ? num(mBrier, 3) : "—"}
          tone={mBrier != null && kBrier != null && mBrier < kBrier ? "pos" : undefined}
          delta={
            mBrier != null && kBrier != null
              ? `Brier · market ${num(kBrier, 3)} · n=${perfN}`
              : "scored after the first results"
          }
        />
        <Kpi
          label="Books reporting"
          value={view.lastBooks != null ? String(view.lastBooks) : "—"}
          delta="EU region, The Odds API"
        />
        <Kpi
          label="Biggest model–market gap"
          value={view.maxDiv ? pct(view.maxDiv.divergence!.tv, 1) : "—"}
          delta={
            view.maxDiv
              ? `${view.maxDiv.home} – ${view.maxDiv.away}`
              : "needs capture + odds"
          }
        />
      </div>

      <Card
        className="span-2"
        eyebrow="Upcoming matches"
        title="Model and market, side by side, as captures come in."
        prose
        source={`prelim: prior-based prediction from current ratings, refreshed as the model updates · final: lineup-conditioned capture at T−45 · market: vig-free median of EU books · kickoff in your local time · updated ${new Date(data.generated_at).toLocaleTimeString()}`}
      >
        {view.upcoming.length === 0 ? (
          <Empty title="No matches on the horizon" />
        ) : (
          <>
          {/* phones: card stack, no sideways scrolling */}
          <div className="only-mobile mcard-list">
            {view.upcoming.slice(0, 18).map((m) => {
              const clickable = data.dc_rho != null && (m.capture || m.prelim);
              const open = expanded === m.event_id;
              return (
                <div
                  key={m.event_id}
                  className={`mcard ${m.placeholder ? "dim" : ""}`}
                  onClick={() =>
                    clickable && setExpanded(open ? null : m.event_id)
                  }
                >
                  <div className="mcard-top">
                    <span className="mcard-ko" suppressHydrationWarning>
                      {kickoffLocal(m.kickoff_utc)}
                    </span>
                    <span className="eyebrow">{m.stage}</span>
                  </div>
                  <div className="mcard-fixture">
                    {m.home} – {m.away}
                    {m.divergence?.model_backs_underdog && (
                      <span className="badge badge-upset">model backs dog</span>
                    )}
                  </div>
                  {modelRows(m).map((r) => (
                    <div className="mcard-row" key={r.label}>
                      <span className="mcard-lbl">{r.label}</span>
                      <ProbBar p={r.p} context={r.context} />
                    </div>
                  ))}
                  {m.market && (
                    <div className="mcard-row">
                      <span className="mcard-lbl">market</span>
                      <ProbBar p={m.market.p_vigfree} context />
                    </div>
                  )}
                  <div className="mcard-meta">
                    {m.placeholder ? (
                      <span className="badge badge-waiting">TBD</span>
                    ) : (
                      lineupBadge(m)
                    )}
                    {m.excitement && (
                      <span className="prob-nums">
                        excite {m.excitement.score.toFixed(2)}
                      </span>
                    )}
                    {clickable && (
                      <span className="prob-nums" style={{ marginLeft: "auto" }}>
                        {open ? "▾ scores" : "▸ scores"}
                      </span>
                    )}
                  </div>
                  {open && clickable && (
                    <ScoreMatrix match={m} rho={data.dc_rho!} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="only-desktop table-scroll">
            <table className="mtable">
              <thead>
                <tr>
                  <th>Kickoff</th>
                  <th>Fixture</th>
                  <th>Stage</th>
                  <th>Model W·D·L</th>
                  <th>Market W·D·L</th>
                  <th>Lineups</th>
                  <th className="num">Excite</th>
                </tr>
              </thead>
              <tbody>
                {view.upcoming.slice(0, 18).map((m) => {
                  const clickable =
                    data.dc_rho != null && (m.capture || m.prelim);
                  return (
                    <Fragment key={m.event_id}>
                      <tr
                        className={`${m.placeholder ? "dim" : "sig"} ${clickable ? "expandable" : ""}`}
                        onClick={() =>
                          clickable &&
                          setExpanded(expanded === m.event_id ? null : m.event_id)
                        }
                        title={clickable ? "click for score probabilities" : undefined}
                      >
                        <td className="mname" suppressHydrationWarning>
                          {kickoffLocal(m.kickoff_utc)}
                        </td>
                        <td>
                          {m.home} – {m.away}
                          {m.divergence?.model_backs_underdog && (
                            <>
                              {" "}
                              <span className="badge badge-upset">model backs dog</span>
                            </>
                          )}
                        </td>
                        <td>{m.stage}</td>
                        <td>{modelCell(m)}</td>
                        <td>
                          {m.market ? (
                            <ProbBar p={m.market.p_vigfree} context />
                          ) : (
                            <span className="cell-dash">—</span>
                          )}
                        </td>
                        <td>{m.placeholder ? <span className="cell-dash">TBD</span> : lineupBadge(m)}</td>
                        <td className="num">
                          {m.excitement ? m.excitement.score.toFixed(2) : "—"}
                        </td>
                      </tr>
                      {expanded === m.event_id && clickable && (
                        <tr className="smx-row">
                          <td colSpan={7}>
                            <ScoreMatrix match={m} rho={data.dc_rho!} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          </>
        )}
      </Card>

      <Card
        eyebrow="Excitement index"
        title="The fixtures worth setting an alarm for."
        prose
        source="excitement = quality × closeness · quality: min–max scaled mean team rating · closeness: H(p)/ln 3 from market (else model) probs, or Elo gap pre-capture"
      >
        {view.excitement.length === 0 ? (
          <Empty title="Nothing to rank yet" />
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(200, view.excitement.length * 32)}>
            <BarChart data={view.excitement} layout="vertical" margin={{ left: 4, right: isMobile ? 34 : 44 }}>
              <XAxis type="number" hide domain={[0, 1]} />
              <YAxis
                type="category"
                dataKey="name"
                width={isMobile ? 112 : 170}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: isMobile ? 9.5 : 11 }}
              />
              <Bar dataKey="score" fill="var(--moss-30)" radius={[0, 2, 2, 0]} barSize={16}>
                <LabelList dataKey="score" position="right" style={chartLabelStyle} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card
        eyebrow="Model vs market"
        title={divergenceTitle(view.divergences)}
        prose
        source="bar = how much the model overprices its strongest call vs the vig-free market, in percentage points · label names the call · terracotta = backing a market underdog · slate = backing the draw · gray = leaning further on the favourite · lighter = prelim vs odds snapshot, solid = T−45 capture vs T−45 odds"
      >
        {view.divergences.length === 0 ? (
          <Empty
            title="Needs odds"
            sub="the agent snapshots the market every 6 hours and at each capture"
          />
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(200, view.divergences.length * 32)}>
            <BarChart data={view.divergences} layout="vertical" margin={{ left: 4, right: isMobile ? 96 : 130 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={isMobile ? 112 : 170}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: isMobile ? 9.5 : 11 }}
              />
              <ReferenceLine x={0} stroke="var(--chart-axis)" />
              <Bar dataKey="edge" radius={[0, 2, 2, 0]} barSize={16}>
                {view.divergences.map((d) => (
                  <Cell
                    key={d.name}
                    fill={
                      d.kind === "upset"
                        ? "var(--terra-40)"
                        : d.kind === "draw"
                          ? "var(--sky-60)"
                          : "var(--stone-30)"
                    }
                    fillOpacity={d.final ? 1 : 0.55}
                  />
                ))}
                <LabelList
                  dataKey="call"
                  position="right"
                  style={{ ...chartLabelStyle, fill: "var(--fg-1)" }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>
    </>
  );
}
