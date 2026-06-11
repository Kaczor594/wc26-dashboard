"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, Empty } from "@/components/ui/Card";
import { usePolledJson } from "@/lib/fetcher";
import { num } from "@/lib/format";
import type { PlayersBlob } from "@/lib/types";

export default function PlayersPage() {
  const { data } = usePolledJson<PlayersBlob>("players");
  const [minQualityPct, setMinQualityPct] = useState(0.5);

  const view = useMemo(() => {
    if (!data) return null;
    const filtered = data.players.filter(
      (p) => p.quality_pct >= minQualityPct && p.exp_minutes_per_match >= 30,
    );
    const deficits = [...filtered]
      .sort((a, b) => b.deficit_minutes - a.deficit_minutes)
      .slice(0, 15)
      .map((p) => ({
        name: `${p.player} · ${p.country}`,
        deficit: Math.round(p.deficit_minutes),
      }));
    const scatter = filtered.map((p) => ({
      x: +(p.exp_minutes_per_match / 90).toFixed(3),
      y: +(p.wc_minutes / (90 * Math.max(p.games_played, 1))).toFixed(3),
      name: `${p.player} (${p.country})`,
    }));
    const table = [...filtered].sort(
      (a, b) => b.deficit_minutes - a.deficit_minutes,
    );
    return { filtered, deficits, scatter, table };
  }, [data, minQualityPct]);

  if (!data || !view) {
    return (
      <Card className="span-2" eyebrow="Players">
        <Empty title="Connecting to the model feed" />
      </Card>
    );
  }

  if (data.players.length === 0) {
    return (
      <Card className="span-2" eyebrow="Players" title="No minutes to compare yet." prose>
        <Empty
          title="This page wakes up after the first matches"
          sub="model-expected minutes vs actual minutes, per player, once their team has played"
        />
      </Card>
    );
  }

  const filterControl = (
    <label className="eyebrow" style={{ display: "flex", alignItems: "center", gap: 8 }}>
      min quality pct
      <input
        type="range"
        min={0}
        max={0.95}
        step={0.05}
        value={minQualityPct}
        onChange={(e) => setMinQualityPct(+e.target.value)}
      />
      <span className="num">{Math.round(minQualityPct * 100)}</span>
    </label>
  );

  return (
    <>
      <Card
        className="span-2"
        eyebrow="Minutes deficit"
        title="Good players the model would play more."
        prose
        right={filterControl}
        source={`deficit = expected minutes/match × games − actual tournament minutes · filtered to quality percentile ≥ ${Math.round(minQualityPct * 100)} and ≥30 expected min/match · n = ${view.filtered.length}`}
      >
        {view.deficits.length === 0 ? (
          <Empty title="Nobody clears the filter yet" />
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(180, view.deficits.length * 28)}>
            <BarChart data={view.deficits} layout="vertical" margin={{ left: 8, right: 48 }}>
              <XAxis type="number" tick={{ fontSize: 10.5 }} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={210}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
              />
              <Bar dataKey="deficit" fill="var(--moss-40)" barSize={14} radius={[0, 2, 2, 0]} isAnimationActive={false}>
                <LabelList
                  dataKey="deficit"
                  position="right"
                  formatter={(v) => `${String(v)}′`}
                  style={{ fontSize: 10.5, fontFamily: "var(--font-mono)", fill: "var(--fg-2)" }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card
        eyebrow="Expected vs actual"
        title="Below the line means the coach disagrees with the model."
        prose
        source="x: model-expected share of 90 · y: actual share across games played · line: playing exactly as modeled"
      >
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid stroke="var(--chart-grid)" />
            <XAxis
              type="number"
              dataKey="x"
              domain={[0, 1.05]}
              tick={{ fontSize: 10.5 }}
              tickLine={false}
              name="expected"
            />
            <YAxis
              type="number"
              dataKey="y"
              domain={[0, 1.2]}
              tick={{ fontSize: 10.5 }}
              tickLine={false}
              width={32}
              name="actual"
            />
            <ReferenceLine
              segment={[
                { x: 0, y: 0 },
                { x: 1.05, y: 1.05 },
              ]}
              stroke="var(--chart-context)"
              strokeDasharray="4 3"
            />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              content={({ payload }: any) =>
                payload?.length ? (
                  <div
                    style={{
                      background: "var(--bg-inverse)",
                      color: "var(--fg-on-inverse)",
                      borderRadius: 6,
                      padding: "6px 9px",
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                    }}
                  >
                    {payload[0].payload.name} · exp {payload[0].payload.x} · act{" "}
                    {payload[0].payload.y}
                  </div>
                ) : null
              }
            />
            <Scatter data={view.scatter} fill="var(--moss-40)" fillOpacity={0.7} isAnimationActive={false} />
          </ScatterChart>
        </ResponsiveContainer>
      </Card>

      <Card
        eyebrow="Detail"
        title="The full comparison, player by player."
        prose
        source="quality is a standardized score across all 1,200+ squad players · minutes from Sofascore tournament data"
      >
        <div className="table-scroll">
          <table className="mtable">
            <thead>
              <tr>
                <th>Player</th>
                <th>Team</th>
                <th>Pos</th>
                <th className="num">Qual pct</th>
                <th className="num">Exp/match</th>
                <th className="num">Actual</th>
                <th className="num">Deficit</th>
              </tr>
            </thead>
            <tbody>
              {view.table.slice(0, 40).map((p) => (
                <tr key={`${p.country}-${p.player}`} className={p.deficit_minutes > 45 ? "sig" : "dim"}>
                  <td className="mname">{p.player}</td>
                  <td>{p.country}</td>
                  <td>{p.pos_bucket}</td>
                  <td className="num">{Math.round(p.quality_pct * 100)}</td>
                  <td className="num">{num(p.exp_minutes_per_match, 0)}′</td>
                  <td className="num">{num(p.wc_minutes, 0)}′</td>
                  <td className={`num ${p.deficit_minutes > 0 ? "" : "pos"}`}>
                    {num(p.deficit_minutes, 0)}′
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
