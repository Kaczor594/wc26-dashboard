"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { Card, Empty } from "@/components/ui/Card";
import { usePolledJson } from "@/lib/fetcher";
import { useIsMobile } from "@/lib/useIsMobile";
import { pct } from "@/lib/format";
import type { Meta, TournamentBlob, TournamentTeam } from "@/lib/types";

const STAGES = [
  ["p_R32", "R32"],
  ["p_R16", "R16"],
  ["p_QF", "QF"],
  ["p_SF", "SF"],
  ["p_final", "Final"],
  ["p_champion", "Champion"],
] as const;

type SortKey = (typeof STAGES)[number][0] | "rating";

function ProbCell({ v, focal }: { v: number; focal?: boolean }) {
  return (
    <div className="coef-bar">
      <div
        className={`coef-fill ${focal ? "focal" : ""}`}
        style={{ width: `${Math.min(v * 100, 100)}%` }}
      />
      <span className="coef-num">{pct(v, v < 0.095 ? 1 : 0)}</span>
    </div>
  );
}

export default function TournamentPage() {
  const { data } = usePolledJson<TournamentBlob>("tournament");
  const { data: meta } = usePolledJson<Meta>("meta");
  const [sortKey, setSortKey] = useState<SortKey>("p_champion");
  const isMobile = useIsMobile();

  const teams = useMemo(() => {
    if (!data) return [];
    return [...data.teams].sort(
      (a, b) => (b[sortKey] as number) - (a[sortKey] as number),
    );
  }, [data, sortKey]);

  if (!data) {
    return (
      <Card className="span-2" eyebrow="Tournament">
        <Empty title="Connecting to the model feed" />
      </Card>
    );
  }

  const top = teams.slice(0, 12).map((t) => ({
    team: t.team,
    p: +(t.p_champion * 100).toFixed(1),
  }));
  const leader = [...data.teams].sort((a, b) => b.p_champion - a.p_champion)[0];
  const simDate = new Date(data.sim_generated_at);

  return (
    <>
      {meta && meta.results_since_sim > 0 && (
        <div className="notice span-2">
          Simulation from {simDate.toLocaleString()} — {meta.results_since_sim}{" "}
          result{meta.results_since_sim === 1 ? "" : "s"} since. A refresh
          normally runs automatically within minutes of each final whistle;
          if this notice persists, the auto-refresh failed (check the agent
          log).
        </div>
      )}

      <Card
        className="span-2"
        eyebrow="Championship"
        title={
          leader
            ? `${leader.team} leads the field at ${pct(leader.p_champion, 1)}.`
            : "Tournament probabilities."
        }
        prose
        source={`10,000 Monte Carlo tournaments · lineup-aware player model, Elo-blended ratings · simulated ${simDate.toLocaleString()}`}
      >
        <ResponsiveContainer width="100%" height={top.length * 30 + 20}>
          <BarChart data={top} layout="vertical" margin={{ left: 8, right: 48 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="team"
              width={isMobile ? 92 : 110}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: isMobile ? 10 : 11.5 }}
            />
            <Bar dataKey="p" fill="var(--moss-40)" barSize={16} radius={[0, 2, 2, 0]} isAnimationActive={false}>
              <LabelList
                dataKey="p"
                position="right"
                formatter={(v) => `${String(v)}%`}
                style={{ fontSize: 10.5, fontFamily: "var(--font-mono)", fill: "var(--fg-2)" }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card
        className="span-2"
        eyebrow="Full field"
        title="All 48 teams, stage by stage."
        prose
        source="click a column to sort · bars share a 0–100% scale within each column · rating = 0.5·player-implied + 0.5·actual Elo"
      >
        <div className="table-scroll">
          <table className="mtable sticky-first">
            <thead>
              <tr>
                <th>Team</th>
                <th>Grp</th>
                <th
                  className={`num sortable`}
                  onClick={() => setSortKey("rating")}
                >
                  Rating{sortKey === "rating" ? " ↓" : ""}
                </th>
                {STAGES.map(([key, label]) => (
                  <th
                    key={key}
                    className="sortable"
                    onClick={() => setSortKey(key)}
                  >
                    {label}
                    {sortKey === key ? " ↓" : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teams.map((t: TournamentTeam) => (
                <tr key={t.team} className="sig">
                  <td className="mname">{t.team}</td>
                  <td>{t.group}</td>
                  <td className="num">{Math.round(t.rating)}</td>
                  {STAGES.map(([key]) => (
                    <td key={key} style={{ minWidth: 64 }}>
                      <ProbCell v={t[key]} focal={key === "p_champion"} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
