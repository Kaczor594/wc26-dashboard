"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, Empty } from "@/components/ui/Card";
import { Kpi } from "@/components/ui/Kpi";
import { usePolledJson } from "@/lib/fetcher";
import { num, pct, signed } from "@/lib/format";
import { chartTooltipStyle } from "@/lib/chartStyles";
import type { PerformanceBlob } from "@/lib/types";

export default function PerformanceClient({
  initialPerf,
}: {
  initialPerf: PerformanceBlob | null;
}) {
  const { data } = usePolledJson<PerformanceBlob>("performance", initialPerf);

  const view = useMemo(() => {
    if (!data) return null;
    const scored = data.rows;
    const headToHead = scored.filter((r) => r.brier_market != null);
    const last = data.cumulative.at(-1);
    const edgeBars = headToHead.map((r) => ({
      name: `${r.home.slice(0, 3).toUpperCase()}–${r.away.slice(0, 3).toUpperCase()}`,
      edge: +(r.brier_market! - r.brier_model).toFixed(3),
    }));
    const noMarket = scored.length - headToHead.length;
    return { scored, headToHead, last, edgeBars, noMarket };
  }, [data]);

  if (!data || !view) {
    return (
      <Card className="span-2" eyebrow="Performance">
        <Empty title="Connecting to the model feed" />
      </Card>
    );
  }

  if (view.scored.length === 0) {
    return (
      <Card className="span-2" eyebrow="Performance" title="No matches scored yet." prose>
        <Empty
          title="The log starts with the first final whistle"
          sub="every captured match lands here once it finishes — model vs vig-free market, Brier and log scores"
        />
      </Card>
    );
  }

  const modelBrier = view.last?.mean_brier_model;
  const marketBrier = view.last?.mean_brier_market;
  const edge = view.last?.cum_log_edge;

  return (
    <>
      <div className="kpi-row span-2">
        <Kpi label="Matches scored" value={String(view.scored.length)} />
        <Kpi
          label="Model Brier (mean)"
          value={modelBrier != null ? num(modelBrier, 3) : "—"}
          delta="lower is better · 0–2 scale"
        />
        <Kpi
          label="Market Brier (mean)"
          value={marketBrier != null ? num(marketBrier, 3) : "—"}
          delta="vig-free consensus baseline"
        />
        <Kpi
          label="Cumulative log edge"
          value={edge != null ? signed(edge, 3) : "—"}
          tone={edge != null ? (edge >= 0 ? "pos" : "neg") : undefined}
          delta="Σ(log market − log model) · >0 = model ahead"
        />
      </div>

      <Card
        className="span-2"
        eyebrow="Running accuracy"
        title={
          edge != null
            ? edge >= 0
              ? "The model is ahead of the market so far."
              : "The market is ahead — for now."
            : "Waiting for a head-to-head sample."
        }
        prose
        source={`3-outcome Brier, running mean · model: lineup-conditioned capture · market: vig-free median of EU books · n = ${view.headToHead.length}${view.noMarket > 0 ? ` · ${view.noMarket} matches lack odds and are excluded` : ""}`}
      >
        {data.cumulative.length === 0 ? (
          <Empty title="Needs at least one match with both model and odds" />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data.cumulative} margin={{ top: 8, right: 70, left: 0, bottom: 4 }}>
              <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
              <XAxis
                dataKey="i"
                tickLine={false}
                axisLine={{ stroke: "var(--chart-axis)" }}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                domain={[0, "auto"]}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
                width={36}
              />
              <Tooltip
                contentStyle={chartTooltipStyle}
                labelFormatter={(i) =>
                  data.cumulative.find((p) => p.i === i)?.label ?? `match ${i}`
                }
                formatter={(v, name) => [
                  typeof v === "number" ? v.toFixed(3) : String(v),
                  name === "mean_brier_model" ? "model" : "market",
                ]}
              />
              <Line
                dataKey="mean_brier_model"
                stroke="var(--moss-50)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                label={(props) =>
                  labelLast(props, data.cumulative.length, "model", "var(--moss-50)")
                }
              />
              <Line
                dataKey="mean_brier_market"
                stroke="var(--chart-context)"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
                label={(props) =>
                  labelLast(props, data.cumulative.length, "market", "var(--fg-3)")
                }
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card
        eyebrow="Per-match edge"
        title="Where the model beat the book, match by match."
        prose
        source="bar = Brier(market) − Brier(model) · positive (moss) = model closer to the result"
      >
        {view.edgeBars.length === 0 ? (
          <Empty title="No head-to-head matches yet" />
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(180, view.edgeBars.length * 26)}>
            <BarChart data={view.edgeBars} layout="vertical" margin={{ left: 8, right: 36 }}>
              <XAxis type="number" tick={{ fontSize: 10.5 }} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={86}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
              />
              <ReferenceLine x={0} stroke="var(--chart-axis)" />
              <Bar dataKey="edge" barSize={14} radius={[0, 2, 2, 0]} isAnimationActive={false}>
                {view.edgeBars.map((d) => (
                  <Cell key={d.name} fill={d.edge >= 0 ? "var(--moss-40)" : "var(--negative)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card
        eyebrow="Performance log"
        title="Every scored match, in full."
        prose
        source="p(actual) = probability either side assigned to the realised outcome · shootout matches score as draws (90-minute probabilities)"
      >
        <div className="table-scroll">
          <table className="mtable sticky-first">
            <thead>
              <tr>
                <th>Fixture</th>
                <th className="num">Score</th>
                <th className="num">Model p(act)</th>
                <th className="num">Mkt p(act)</th>
                <th className="num">Brier M</th>
                <th className="num">Brier K</th>
              </tr>
            </thead>
            <tbody>
              {[...view.scored].reverse().map((r) => {
                const beat = r.brier_market != null && r.brier_model < r.brier_market;
                return (
                  <tr key={r.event_id} className={beat ? "sig" : "dim"}>
                    <td>
                      {r.home} {r.score.home}–{r.score.away} {r.away}
                      {!r.lineup_confirmed && (
                        <>
                          {" "}
                          <span className="badge badge-prior">prior</span>
                        </>
                      )}
                      {r.model_favored_underdog && (
                        <>
                          {" "}
                          <span className="badge badge-upset">
                            dog call {r.model_underdog_paid_off ? "✓" : "✗"}
                          </span>
                        </>
                      )}
                    </td>
                    <td className="num">{r.outcome}</td>
                    <td className="num">{pct(r.model_p[r.outcome], 0)}</td>
                    <td className="num">
                      {r.market_p ? pct(r.market_p[r.outcome], 0) : "—"}
                    </td>
                    <td className="num">{num(r.brier_model, 3)}</td>
                    <td className="num">
                      {r.brier_market != null ? num(r.brier_market, 3) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

/* Direct end-of-line label (label > legend, per the chart rules). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function labelLast(props: any, n: number, text: string, fill: string) {
  if (props.index !== n - 1) return <g key={props.index} />;
  return (
    <text
      key={props.index}
      x={props.x + 6}
      y={props.y + 4}
      fontSize={11}
      fontFamily="var(--font-mono)"
      fill={fill}
    >
      {text}
    </text>
  );
}
