// TS mirror of the blob contract produced by
// worldcup-2026-model/scripts/publish_dashboard.py (schema_version 1).

export type Outcome = "home" | "draw" | "away";
export type Probs = Record<Outcome, number>;

export interface Meta {
  generated_at: string;
  agent_last_run: string;
  sim_generated_at: string;
  results_since_sim: number;
  counts: { matches: number; completed: number; captured: number; scored: number };
  schema_version: number;
}

export interface Capture {
  ts_utc: string;
  lineup_confirmed: boolean;
  p: Probs;
  lambda: { home: number; away: number };
  rating: { home: number; away: number };
}

export interface Market {
  n_books: number;
  as_of: string | null;
  consensus_odds: Probs | null;
  p_vigfree: Probs;
}

export interface LineupPlayer { player: string; pos: string; min?: number }

export interface LineupAttrib { player: string; pos: string; d_elo: number }

export interface LineupSide {
  team: string;
  expected_xi: LineupPlayer[];
  actual_xi: { player: string; pos: string }[] | null;
  attrib: LineupAttrib[] | null; // per-player Elo contribution (quality×loading×Δmin)
  delta_implied_elo: number | null; // conditioned − expected player-implied Elo
  delta_pp: number | null; // isolated win-prob swing (opponent held at expected XI)
}

export interface LineupDiff {
  home: LineupSide | null;
  away: LineupSide | null;
  exact: boolean; // frozen at capture (true) vs estimated from current ratings
}

export interface Match {
  event_id: string;
  kickoff_utc: string;
  home: string;
  away: string;
  stage: string;
  venue: string;
  status: "scheduled" | "in" | "final";
  placeholder: boolean;
  score: { home: number; away: number; winner: string | null } | null;
  capture: Capture | null;
  market: Market | null;
  prelim: { p: Probs; lambda: { home: number; away: number } } | null;
  rating_prior: { home: number; away: number } | null;
  lineup_diff: LineupDiff | null;
  excitement: { score: number; closeness: number; quality: number; basis: string } | null;
  divergence: {
    tv: number;
    model_backs_underdog: boolean;
    edge_outcome: Outcome;
    edge_pp: number;
    edge_is_underdog: boolean;
    basis: "final" | "prelim";
  } | null;
}

export interface MatchesBlob { generated_at: string; dc_rho: number | null; matches: Match[] }

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

export interface TournamentTeam {
  team: string;
  group: string;
  rating: number;
  elo: number;
  implied_elo: number;
  p_R32: number;
  p_R16: number;
  p_QF: number;
  p_SF: number;
  p_final: number;
  p_champion: number;
}

export interface TournamentBlob { generated_at: string; sim_generated_at: string; teams: TournamentTeam[] }

export interface PlayerRow {
  country: string;
  player: string;
  pos_bucket: string;
  age: number;
  tm_value_eur: number | null;
  quality: number;
  quality_pct: number;
  exp_minutes_per_match: number;
  games_played: number;
  wc_minutes: number;
  expected_to_date: number;
  deficit_minutes: number;
  wc_xg: number | null;
  wc_xa: number | null;
}

export interface PlayersBlob { generated_at: string; team_games: Record<string, number>; players: PlayerRow[] }

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
  modelChampPct: number; // day-0 (V2.1, kickoff morning) P(champion), %
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
