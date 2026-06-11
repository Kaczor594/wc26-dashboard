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
  consensus_odds: Probs | null;
  p_vigfree: Probs;
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
  excitement: { score: number; closeness: number; quality: number; basis: string } | null;
  divergence: { tv: number; model_backs_underdog: boolean } | null;
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
