// Data types for the offseason (static) site.
//
// PerfRow/PerfPoint/PerformanceBlob mirror the final performance.json
// produced by worldcup-2026-model/scripts/publish_dashboard.py
// (schema_version 1), frozen into src/data/performance.json on
// 2026-07-21. The live blob types (matches/tournament/players/meta)
// were removed with the polling layer when the site went static.

export type Outcome = "home" | "draw" | "away";
export type Probs = Record<Outcome, number>;

export interface PerfRow {
  event_id: string;
  kickoff_utc: string;
  home: string;
  away: string;
  stage: string;
  score: { home: number; away: number };
  outcome: Outcome;
  lineup_confirmed: boolean;
  model_p: Probs;
  market_p: Probs | null;
  brier_model: number;
  log_model: number;
  brier_market: number | null;
  log_market: number | null;
  model_favored_underdog: boolean;
  model_underdog_paid_off: boolean | null;
}

export interface PerfPoint {
  i: number;
  kickoff_utc: string;
  label: string;
  mean_brier_model: number;
  mean_brier_market: number;
  cum_log_edge: number;
}

export interface PerformanceBlob { generated_at: string; rows: PerfRow[]; cumulative: PerfPoint[] }

/* ---- Offseason retrospective (static content in src/data/retro.ts) ----
 * The tournament ended 2026-07-19; these types describe hand-curated,
 * frozen content — numbers sourced from the offseason research docs, not
 * from any live blob. */

export interface RetroKpi {
  label: string;
  value: string;
  sub?: string;
}

/** One model-vs-market call card: full H/D/A prob triples from all three views. */
export interface RetroCall {
  match: string; // "Germany 1–1 Paraguay"
  stage: string;
  outcome: Outcome; // 90-minute result the probs are scored against
  outcomeLabel: string; // "draw — Paraguay advanced past 90'"
  model: Probs;
  market: Probs;
  xwdl: Probs; // post-match shot-based (FotMob) win/draw/loss expectancy
  note: string; // one-sentence read, xWDL-corroborated
}

export interface RetroSurprise {
  team: string;
  modelChampPct: number; // day-0 (kickoff morning) P(champion), %
  marketChampPct?: number; // same-day market P(champion), % — where notable
  finish: string; // "Quarterfinals"
  note: string;
}

export interface RetroLuckRow {
  team: string;
  pts: number; // group-stage points
  xpts: number; // xWDL expected points
  eliminated: boolean; // out in the group stage
}

export interface RetroBootRow {
  player: string;
  country: string;
  goals: number;
  minutes: number;
  gMinusXg: number | null; // null where no Sofascore xG exists (e.g. <180 min)
}

export interface RetroPlayerCard {
  player: string;
  country: string;
  stat: string; // headline stat line, pre-formatted
  note: string;
}

/** Spain's run, one row per match — hero chart series. */
export interface RetroPathRow {
  stage: string;
  opponent: string;
  score: string; // display score; final is "1–0 aet"
  modelWinPct: number | null; // null = no capture (market only)
  marketWinPct: number;
}

/** By-stage / by-third log-loss comparison — model-vs-market chart series. */
export interface RetroLLRow {
  label: string;
  n: number;
  model: number;
  market: number;
}
