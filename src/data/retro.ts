// Offseason retrospective — frozen content for the homepage.
//
// Every number here is hand-traced to the offseason research docs
// (planning/research/retro-findings-{narrative,market-xwdl,players}.md,
// local-only) which were themselves audited against the model repo's final
// data. Bias/weakness figures use the FULL-tournament regeneration of
// model_weakness_teamgames.csv (2026-07-21), not the stale R32 snapshot.
//
// Score conventions encoded here (do not "fix" against matchday.db):
// - The final was Spain 1–0 Argentina aet. The DB stores the 90' score
//   (0–0) with winner=Spain; no dataset attributes the winning goal to a
//   scorer, so this site never names one.
// - Only 4 knockout ties were genuine shootouts (GER–PAR, NED–MAR,
//   AUS–EGY, SUI–COL). The other 5 past-90' ties were decided by
//   extra-time goals.
// - Disputed scorelines resolved against ESPN event pages 2026-07-21:
//   Algeria 3–3 Austria and USA 1–4 Belgium (FotMob missed late
//   stoppage-time goals in both).

import type {
  Probs,
  RetroBootRow,
  RetroCall,
  RetroKpi,
  RetroLLRow,
  RetroLuckRow,
  RetroPathRow,
  RetroPlayerCard,
  RetroSurprise,
} from "@/lib/types";

const p = (home: number, draw: number, away: number): Probs => ({ home, draw, away });

/* ---- Hero: the champion the model saw coming ------------------------- */
// Sources: narrative §2–3, market-xwdl §4 ("Was the champion lucky?").

export const HERO = {
  headline: "Spain 1–0 Argentina, aet",
  date: "2026-07-19",
  // Kickoff-morning (V2.1, post-Elo-blend) title probabilities vs same-day market.
  spain: { modelChampPct: 16.0, marketChampPct: 14.9, modelRank: 1 },
  argentina: { modelChampPct: 11.9, marketChampPct: 8.2 },
  // The V2.1 Elo blend shipped hours before kickoff moved Spain 9.4→16.0%
  // and Argentina 7.0→11.9% — it called both finalists.
  eloBlendNote:
    "Both boosts came from the Elo blend shipped the morning of kickoff: Spain jumped from 9.4% to 16.0% and Argentina from 7.0% to 11.9% — the model's final pre-tournament change promoted exactly the two teams that met in the final.",
  // xWDL case that Spain deserved it (market-xwdl §4).
  xwdl: {
    xgd: +13.86, // best in the field
    minWinProb: 0.53, // xWDL win prob never below this in all 8 games
    goalsConceded: 1,
    xga: 2.4,
    finishing: -2.26, // G−xG: Spain under-finished its own chances
  },
} as const;

// Spain's run — the model never had them safe (narrative §3). Model win
// probs are 90' pre-match captures; Uruguay game had no capture.
export const SPAIN_PATH: RetroPathRow[] = [
  { stage: "Group H", opponent: "Cape Verde", score: "0–0", modelWinPct: 86.9, marketWinPct: 90.8 },
  { stage: "Group H", opponent: "Saudi Arabia", score: "4–0", modelWinPct: 84.5, marketWinPct: 87.9 },
  { stage: "Group H", opponent: "Uruguay", score: "1–0", modelWinPct: null, marketWinPct: 59.5 },
  { stage: "Round of 32", opponent: "Austria", score: "3–0", modelWinPct: 60.7, marketWinPct: 73.8 },
  { stage: "Round of 16", opponent: "Portugal", score: "1–0", modelWinPct: 45.0, marketWinPct: 49.0 },
  { stage: "Quarterfinal", opponent: "Belgium", score: "2–1", modelWinPct: 51.0, marketWinPct: 59.2 },
  { stage: "Semifinal", opponent: "France", score: "2–0", modelWinPct: 32.0, marketWinPct: 30.4 },
  { stage: "Final", opponent: "Argentina", score: "1–0 aet", modelWinPct: 36.8, marketWinPct: 41.6 },
];

/* ---- KPI row ---------------------------------------------------------- */
// Sources: narrative §6 (104 matches, 301 corrected goals, upset count),
// market-xwdl §1 (64/100 by hard log-loss), narrative §5 (9 of 32 past 90').

// Head-to-head record corrected 2026-07-21: the market won 64 of the 100
// per-match log-loss duels (the research draft had this sign-inverted).
export const KPIS: RetroKpi[] = [
  { label: "Matches", value: "104", sub: "Jun 11 – Jul 19" },
  { label: "Goals", value: "301", sub: "2.89 per match" },
  { label: "Head-to-head", value: "36–64", sub: "model vs market, by log-loss" },
  { label: "Outright underdog wins", value: "15", sub: "of 81 model-covered results" },
  { label: "Knockouts past 90'", value: "9/32", sub: "incl. the final" },
];

/* ---- Model vs market: the honest verdict ------------------------------ */
// Source: market-xwdl §1. Hard = scored on results; soft = scored on the
// post-match shot record (xWDL). Lower log-loss is better.

export const VERDICT = {
  modelHardLL: 0.889,
  marketHardLL: 0.854,
  pValue: 0.06, // paired t on 100 matches — real but not a rout
  modelSoftLL: 0.938,
  marketSoftLL: 0.923,
  uniformLL: 1.099, // coin-flip baseline
  baseRateLL: 1.069, // season-frequency baseline
  // Per-match duels: market 64, model 36 (hard log-loss); the model's
  // wins ran slightly bigger (mean 0.151 vs 0.140 nats).
  modelWon: 36,
  marketWon: 64,
  summary:
    "The market won the tournament overall — but the model was dead even in the 32 knockout games, its whole deficit came from the opening third (thin priors on debutant squads), and the gap halves when both are scored against the shot record instead of the scoreboard.",
} as const;

export const STAGE_LL: RetroLLRow[] = [
  { label: "Group stage", n: 68, model: 0.887, market: 0.834 },
  { label: "Knockouts", n: 32, model: 0.894, market: 0.896 },
];

export const THIRDS_LL: RetroLLRow[] = [
  { label: "Opening third", n: 34, model: 0.968, market: 0.906 },
  { label: "Middle third", n: 33, model: 0.826, market: 0.78 },
  { label: "Final third", n: 33, model: 0.871, market: 0.874 },
];

// Structural signature (market-xwdl §3, full-tournament regeneration
// 2026-07-21): the market prices favorites +0.028 win-prob points above
// the shot-based deserved rate; the model prices them −0.021 below.
export const FAVORITE_BIAS = { market: +0.028, model: -0.021 } as const;

/* ---- Best & worst calls (all xWDL-corroborated) ----------------------- */
// Source: market-xwdl §2 — only "genuine" rows (shot record agrees), no
// hard-result flukes on either list.

export const BEST_CALLS: RetroCall[] = [
  {
    match: "Spain 0–0 Cape Verde",
    stage: "Group stage",
    outcome: "draw",
    outcomeLabel: "Draw",
    model: p(0.869, 0.103, 0.028),
    market: p(0.906, 0.066, 0.028),
    xwdl: p(0.765, 0.198, 0.037),
    note: "The model gave the world-cup debutants a draw price half again the market's — and the shot record says even that was too low.",
  },
  {
    match: "Germany 1–1 Paraguay",
    stage: "Round of 32",
    outcome: "draw",
    outcomeLabel: "Draw — Paraguay advanced on penalties",
    model: p(0.554, 0.272, 0.175),
    market: p(0.723, 0.182, 0.095),
    xwdl: p(0.572, 0.295, 0.133),
    note: "The model gave Paraguay a 31% chance of taking the tie vs the market's 18.7% — and Paraguay took it.",
  },
  {
    match: "United States 1–4 Belgium",
    stage: "Round of 16",
    outcome: "away",
    outcomeLabel: "Belgium win",
    model: p(0.239, 0.285, 0.477),
    market: p(0.376, 0.29, 0.334),
    xwdl: p(0.093, 0.186, 0.721),
    note: "The model made Belgium a clear favorite while the market leaned USA; the shot record says Belgium should have been priced higher still.",
  },
  {
    match: "France 4–6 England",
    stage: "Third-place match",
    outcome: "away",
    outcomeLabel: "England win",
    model: p(0.367, 0.311, 0.321),
    market: p(0.546, 0.232, 0.222),
    xwdl: p(0.349, 0.159, 0.492),
    note: "The market was sold on France; the model called it even — and xWDL says England deserved the ten-goal classic.",
  },
  {
    match: "Portugal 1–1 DR Congo",
    stage: "Group stage",
    outcome: "draw",
    outcomeLabel: "Draw",
    model: p(0.657, 0.229, 0.115),
    market: p(0.749, 0.171, 0.08),
    xwdl: p(0.269, 0.379, 0.352),
    note: "Both underrated DR Congo — but the model much less so, and the shot record says DR Congo were the better side on the day.",
  },
];

export const WORST_CALLS: RetroCall[] = [
  {
    match: "DR Congo 3–1 Uzbekistan",
    stage: "Group stage",
    outcome: "home",
    outcomeLabel: "DR Congo win",
    model: p(0.398, 0.309, 0.293),
    market: p(0.575, 0.246, 0.179),
    xwdl: p(0.834, 0.133, 0.033),
    note: "The model's biggest genuine miss: it had this near even while the market made DR Congo a clear favorite — and the shot record says they should have been favored even more heavily.",
  },
  {
    match: "Ghana 1–0 Panama",
    stage: "Group stage",
    outcome: "home",
    outcomeLabel: "Ghana win",
    model: p(0.267, 0.306, 0.428),
    market: p(0.406, 0.302, 0.292),
    xwdl: p(0.496, 0.329, 0.175),
    note: "The model actually leaned Panama; market and shot record both had Ghana as the stronger side.",
  },
  {
    match: "United States 4–1 Paraguay",
    stage: "Group stage",
    outcome: "home",
    outcomeLabel: "USA win",
    model: p(0.339, 0.315, 0.346),
    market: p(0.463, 0.299, 0.238),
    xwdl: p(0.676, 0.22, 0.104),
    note: "Same weak spot: the model priced the eventual comfortable favorite as a coin flip. Underrating certain favorites was its one repeatable failure mode.",
  },
];

/* ---- Surprises vs day-0 title odds ------------------------------------ */
// Source: narrative §2 & §4. Percentages are kickoff-morning V2.1 model
// P(champion); market shown where the divergence is the story.

export const OVERACHIEVERS: RetroSurprise[] = [
  {
    team: "Norway",
    modelChampPct: 1.6,
    finish: "Quarterfinals",
    note: "Beat Brazil — the market's #3 title pick — in the Round of 16, the tournament's cleanest shock, then took England to extra time.",
  },
  {
    team: "Paraguay",
    modelChampPct: 0.45,
    finish: "Round of 16",
    note: "Knocked out Germany in the Round of 32 on penalties — a bottom-third squad ending a top-8 favorite's tournament in the first knockout round.",
  },
  {
    team: "Morocco",
    modelChampPct: 1.7,
    finish: "Quarterfinals",
    note: "Put out Netherlands on penalties in the Round of 32, then fell only to France.",
  },
  {
    team: "Switzerland",
    modelChampPct: 2.3,
    finish: "Quarterfinals",
    note: "Two shootout wins deep into the bracket before Argentina ended the run — in extra time, naturally.",
  },
  {
    team: "Cape Verde",
    modelChampPct: 0.01, // 1e-4 in market_comparison_2026-06-11.csv — model's #37 squad of 48
    finish: "Round of 32",
    note: "The model's #37-rated squad drew Spain 0–0, reached the knockouts, and held Argentina 1–1 through extra time before losing on penalties.",
  },
];

export const FLOPS: RetroSurprise[] = [
  {
    team: "Germany",
    modelChampPct: 4.1,
    finish: "Round of 32",
    note: "A top-8 favorite out in the first knockout round, to a team priced at 0.45%.",
  },
  {
    team: "Netherlands",
    modelChampPct: 4.5,
    finish: "Round of 32",
    note: "Same round, same script: eliminated on penalties by 1.7%-shot Morocco.",
  },
  {
    team: "Brazil",
    modelChampPct: 5.0,
    marketChampPct: 9.1,
    finish: "Round of 16",
    note: "The market's #3 pick — the model was notably cooler at 5.0% — lost to Norway, the biggest market-rank-to-finish gap in the field.",
  },
  {
    team: "Portugal",
    modelChampPct: 7.3,
    finish: "Round of 16",
    note: "The pre-Elo-blend #1 pick lost its group to Colombia, then met Spain a round too early.",
  },
  {
    team: "Turkey",
    modelChampPct: 2.7,
    finish: "Group stage",
    note: "The model's Group D favorite at 39.2% to win the group finished dead last while co-host USA won it — the market had this one right.",
  },
];

// 10 of 12 groups went to the model's pre-tournament favorite (narrative §4).
export const GROUPS_CALLED = { called: 10, total: 12 } as const;

/* ---- Luck, measured (group-stage Pts vs xPts) ------------------------- */
// Source: market-xwdl §4 (group-stage luck table). Diverging-bar series,
// luckiest at top. `eliminated` = out in the group stage.

export const LUCK: RetroLuckRow[] = [
  { team: "Mexico", pts: 9, xpts: 6.24, eliminated: false },
  { team: "France", pts: 9, xpts: 6.57, eliminated: false },
  { team: "Croatia", pts: 6, xpts: 3.81, eliminated: false },
  { team: "Paraguay", pts: 4, xpts: 1.95, eliminated: false },
  { team: "Argentina", pts: 9, xpts: 7.3, eliminated: false },
  { team: "Colombia", pts: 7, xpts: 5.77, eliminated: false },
  { team: "Morocco", pts: 7, xpts: 5.85, eliminated: false },
  { team: "Uzbekistan", pts: 0, xpts: 1.23, eliminated: true },
  { team: "Belgium", pts: 5, xpts: 6.44, eliminated: false },
  { team: "Ecuador", pts: 4, xpts: 5.47, eliminated: false },
  { team: "South Korea", pts: 3, xpts: 4.57, eliminated: true },
  { team: "Jordan", pts: 0, xpts: 1.66, eliminated: true },
  { team: "Canada", pts: 4, xpts: 5.84, eliminated: false },
  { team: "Haiti", pts: 0, xpts: 1.85, eliminated: true },
  { team: "Panama", pts: 0, xpts: 1.96, eliminated: true },
  { team: "Uruguay", pts: 2, xpts: 4.4, eliminated: true },
  { team: "Turkey", pts: 3, xpts: 5.49, eliminated: true },
];

export const LUCK_NOTES = {
  headline:
    "Mexico's perfect group came on 6.24 expected points — the luckiest run in the field. Turkey and Uruguay, the two unluckiest teams, were both eliminated.",
  reversals:
    "Only 4 matches all tournament saw a side with a >65% shot-based win expectancy fail to win — all group-stage finishing failures, with Ecuador's 0–0 against Curaçao on 3.05 xG the most extreme.",
  knockoutReversal:
    "The biggest knockout deserved-result reversal: Brazil out-created Norway to a 0.602 xWDL win probability in the Round of 16 — and lost 1–2.",
} as const;

/* ---- Players ----------------------------------------------------------- */
// Sources: players §1b, §5 (boot + finishing), §2 (breakouts), §3
// (underwhelmers), §4 (Spain/Argentina engines), §6 (workhorses).

export const GOLDEN_BOOT: RetroBootRow[] = [
  { player: "Kylian Mbappé", country: "France", goals: 10, minutes: 699, gMinusXg: 4.95 },
  { player: "Lionel Messi", country: "Argentina", goals: 8, minutes: 740, gMinusXg: 3.6 },
  { player: "Jude Bellingham", country: "England", goals: 7, minutes: 616, gMinusXg: 5.36 },
  { player: "Erling Haaland", country: "Norway", goals: 7, minutes: 465, gMinusXg: 4.68 },
  { player: "Harry Kane", country: "England", goals: 6, minutes: 654, gMinusXg: 3.51 },
  { player: "Ousmane Dembélé", country: "France", goals: 6, minutes: 597, gMinusXg: 4.48 },
  { player: "Mikel Oyarzabal", country: "Spain", goals: 5, minutes: 606, gMinusXg: null },
];

export const MESSI_NOTE =
  "Messi at 38: 8 goals, a tournament-best 2.77 expected assists, and 740 minutes — Argentina's entire engine, and the only regular on the squad who clearly outplayed his pre-tournament rating.";

export const BREAKOUTS: RetroPlayerCard[] = [
  {
    player: "Roberto Lopes",
    country: "Cape Verde",
    stat: "3rd → 95th percentile",
    note: "Rated near the bottom of the entire player pool pre-tournament; finished as one of its highest-output defenders.",
  },
  {
    player: "Diney",
    country: "Cape Verde",
    stat: "10th → 100th percentile",
    note: "The single largest rating-vs-output gap at the tournament — the anchor of the back line that held Argentina for 120 minutes.",
  },
];

export const UNDERWHELMERS: RetroPlayerCard[] = [
  {
    player: "Michael Olise",
    country: "France",
    stat: "650 min, 0 goals, −1.71 G−xG",
    note: "The model's #2-rated player pre-tournament; the chances came, the finishing never did.",
  },
  {
    player: "Lamine Yamal",
    country: "Spain",
    stat: "615 min, 1 goal at age 18",
    note: "Below-median tournament output — yet a champion, and remarkable for carrying starter minutes through a title run as a teenager.",
  },
  {
    player: "William Saliba",
    country: "France",
    stat: "480 min, 18th-percentile output",
    note: "96th-percentile rating in, single-digit-adjacent output out.",
  },
  {
    player: "Marc Guéhi",
    country: "England",
    stat: "663 min, 29th-percentile output",
    note: "Played nearly every England minute without ever imposing himself on the numbers.",
  },
];

export const SPAIN_ENGINE = {
  headline: "Spain won it with the unheralded",
  cards: [
    {
      player: "Pedro Porro",
      country: "Spain",
      stat: "72nd → 94th percentile",
      note: "Spain's best-performing outfielder relative to expectation.",
    },
    {
      player: "Fabián Ruiz",
      country: "Spain",
      stat: "56th → 92nd percentile",
      note: "Modestly rated, quietly dominant in the engine room.",
    },
    {
      player: "Mikel Oyarzabal",
      country: "Spain",
      stat: "5 goals, joint team-best",
      note: "Spain's top scorer — a 0.65-quality squad player by the model's pre-tournament book.",
    },
  ] satisfies RetroPlayerCard[],
  // Verified vs player_quality.csv 2026-07-21: Raya + Joan Garcia are the
  // pool's #1 and #2 GOALKEEPERS (#6 and #8 overall) — not "#2 and #7
  // overall" as an earlier draft claimed.
  benchNote:
    "Meanwhile Spain carried the model's two highest-rated goalkeepers in the entire 1,246-player pool — David Raya and Joan Garcia — for exactly 0 minutes between them.",
} as const;

export const WORKHORSE_NOTE =
  "Emiliano Martínez played all 810 possible minutes: Argentina's road ran through three extra-time matches to Spain's one.";

/* ---- Fun-facts strip --------------------------------------------------- */
// Source: narrative §5–6.

export const FACTS: string[] = [
  "France 4–6 England — the third-place match was the highest-scoring game of the tournament.",
  "No two teams met twice across all 104 matches.",
  "Biggest wins: Germany 7–1 Curaçao and Canada 6–0 Qatar.",
  "Nine matches finished 0–0 after 90 minutes.",
  "Nine of 32 knockout games needed more than 90 minutes — including the final.",
];
