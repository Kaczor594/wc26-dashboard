import { Fragment } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { STAT_TERMS } from "@/data/glossary";

export const metadata: Metadata = {
  title: "Method — how the WC26 model works",
  description:
    "A plain-language walkthrough of how the World Cup 2026 prediction model is calculated: player ratings, team strength, the match model, and tournament simulation.",
};

/* ---- content ---------------------------------------------------------- */

const FLOW = [
  {
    n: 1,
    name: "Players",
    desc: "All 26 players per squad rated from market value, age and recent form.",
  },
  {
    n: 2,
    name: "Team strength",
    desc: "Starters weighted by expected minutes, rolled up and blended with team Elo.",
  },
  {
    n: 3,
    name: "Match model",
    desc: "Two ratings become a full distribution over every plausible scoreline.",
  },
  {
    n: 4,
    name: "Tournament",
    desc: "The whole bracket simulated 10,000 times to count each team's paths.",
  },
];

// Out-of-sample W/D/L log-loss on the 262-match backtest. Scale truncated at
// 0.96 so the (small, honest) gap between model and Elo is visible; the ≋ flag
// + the note mark the truncation. Shorter bar = better.
const SCALE_MIN = 0.96;
const SCALE_MAX = 1.1;
const w = (v: number) => `${((v - SCALE_MIN) / (SCALE_MAX - SCALE_MIN) * 100).toFixed(0)}%`;
const BARS = [
  { label: "This model", v: 0.987, focal: true },
  { label: "Team Elo only", v: 0.993, focal: false },
  { label: "Coin flip", v: 1.099, focal: false },
];

// The real out-of-sample test: WC26 itself (100 odds-matched matches,
// mean hard log-loss). Own truncated scale — these scores are better
// (lower) than the historical backtest band above.
const WC_MIN = 0.8;
const WC_MAX = 1.15;
const wcw = (v: number) => `${(((v - WC_MIN) / (WC_MAX - WC_MIN)) * 100).toFixed(0)}%`;
const WC_BARS = [
  { label: "This model", v: 0.889, focal: true },
  { label: "Betting market", v: 0.854, focal: false },
  { label: "Base rates", v: 1.069, focal: false },
  { label: "Coin flip", v: 1.099, focal: false },
];

const CAVEATS = [
  [
    "Probabilities, not prophecies.",
    "A 65% favourite still loses about one time in three. An upset is usually variance doing its job, not the model being broken.",
  ],
  [
    "Market value has blind spots.",
    "It underrates ageing veterans and emerging youngsters until results catch up — which can make a genuine starter look weak on paper, as a couple of USA defenders did this tournament.",
  ],
  [
    "Small samples.",
    "A 262-match backtest and a 48-team field leave real uncertainty. Treat single-game edges of a point or two as noise, not signal.",
  ],
  [
    "Some things aren't modelled.",
    "Chemistry, in-game tactics, red cards, weather and motivation never enter the math. This is a calibrated baseline, not the final word.",
  ],
];

/* ---- helpers ---------------------------------------------------------- */

function Formula({ children, note }: { children: React.ReactNode; note?: string }) {
  return (
    <div className="mthd-formula">
      <code>{children}</code>
      {note && <span className="mthd-formula-note">{note}</span>}
    </div>
  );
}

/* ---- page ------------------------------------------------------------- */

export default function MethodPage() {
  return (
    <>
      {/* Hero ----------------------------------------------------------- */}
      <Card
        className="span-2 mthd-hero"
        eyebrow="How it works"
        title="The model rates players, not teams — and lets the lineup decide the rest."
        prose
      >
        <div className="mthd-lede">
          <p>
            Most football forecasts start with the team: how good is Brazil, how
            good is Croatia. This one starts a level lower — with the twenty-six
            players each country brings — and rebuilds the team's strength from
            whoever is actually on the pitch. The logic is simple: international
            squads turn over constantly, and a side is only as strong as the
            eleven names on the team sheet, so a <em>player</em> is a steadier
            unit of measurement than a flag.
          </p>
          <p>
            From there it is four steps — rate every player, roll the starters
            up into one team number, turn two team numbers into a distribution
            of plausible scorelines, then play the whole tournament out ten
            thousand times to see how often each path ends with the trophy. The
            rest of this page walks through each step in plain terms; a glossary
            at the bottom defines the statistical words as they come up.
          </p>
        </div>
      </Card>

      {/* Pipeline diagram ---------------------------------------------- */}
      <Card
        className="span-2"
        eyebrow="The pipeline"
        title="Four stages, each feeding the next."
        prose
        source="Each stage is a separate, individually backtested component · read left to right"
      >
        <div className="mthd-flow">
          {FLOW.map((s, i) => (
            <Fragment key={s.n}>
              <div className="mthd-flow-step">
                <span className="mthd-flow-num">{s.n}</span>
                <span className="mthd-flow-name">{s.name}</span>
                <span className="mthd-flow-desc">{s.desc}</span>
              </div>
              {i < FLOW.length - 1 && <span className="mthd-flow-arrow">→</span>}
            </Fragment>
          ))}
        </div>
      </Card>

      {/* Step 1 — players ---------------------------------------------- */}
      <Card
        eyebrow="Step 1 · Players"
        title="Every player gets one number, anchored to the transfer market."
        prose
      >
        <div className="mthd-prose">
          <p>
            The base signal is a player's <strong>transfer-market value</strong>
            {" "}— the price the football market puts on him. It sounds crude,
            but a decade of research (and our own testing) keeps landing on the
            same result: the wisdom-of-the-crowd baked into market prices is very
            hard to beat for predicting results. Thousands of clubs, scouts and
            bidders price a player more accurately than most hand-built rating
            systems can.
          </p>
          <p>
            Two corrections sit on top. First, <strong>age</strong>: the market
            prices <em>resale</em> value, so it over-discounts a 33-year-old who
            is still excellent <em>now</em> and over-prices a teenager who might
            be excellent <em>later</em>. A position-specific age curve pulls the
            number back toward present-day ability. Second, a small{" "}
            <strong>recent-form</strong> adjustment from club expected-goals and
            defensive numbers — capped at 15% of the rating, because form is
            noisy and the market has usually priced it in already.
          </p>
          <p>
            Everything is then expressed as a <strong>z-score within
            position</strong>, so a goalkeeper and a striker sit on the same
            scale.
          </p>
          <Formula note="prior = market value (logged, z-scored) + age correction">
            Q = 0.85 · prior + 0.15 · form
          </Formula>
        </div>
      </Card>

      {/* Step 2 — team ------------------------------------------------- */}
      <Card
        eyebrow="Step 2 · Team strength"
        title="The starting eleven, weighted by who actually plays, becomes one rating."
        prose
      >
        <div className="mthd-prose">
          <p>
            Not everyone contributes equally. The model estimates{" "}
            <strong>expected minutes</strong> for each player — better players
            are likelier to start and finish — and takes a minutes-weighted
            roll-up of the squad into separate <strong>offensive</strong> and{" "}
            <strong>defensive</strong> ratings. Those are mapped onto the{" "}
            <strong>Elo scale</strong>, the same points system used to rank
            national teams, so a squad built from market values becomes directly
            comparable to a team's results-based rating.
          </p>
          <p>
            The last move is a <strong>50/50 blend</strong>: half the rating
            comes from the players, half from the team's actual Elo — its track
            record of results. Why both? Market value is excellent for European
            sides but undersells some South-American and results-driven teams
            whose players are cheaper than their results deserve. Blending hedges
            "who's on paper" against "what they've actually done," and it was the
            single biggest accuracy gain in testing.
          </p>
          <Formula note="player value = squad rolled up and calibrated to Elo">
            rating = 0.5 · player value + 0.5 · actual Elo
          </Formula>
        </div>
      </Card>

      {/* Step 3 — match ------------------------------------------------ */}
      <Card
        eyebrow="Step 3 · Match model"
        title="Two ratings become a distribution of scorelines, not a single guess."
        prose
      >
        <div className="mthd-prose">
          <p>
            A match is mostly a count of rare events — goals — and the natural
            tool for counts is the <strong>Poisson distribution</strong>: give
            it an expected number of goals (called <strong>λ</strong>, lambda)
            and it returns the chance of 0, 1, 2, 3 … goals. Each team's λ comes
            from a small regression fit on <strong>898 World Cup
            qualifiers</strong>, where expected goals depend on just two things:
            home advantage, and the Elo gap between the sides. Bigger favourite →
            higher λ → more goals expected.
          </p>
          <p>
            Multiply the two teams' goal distributions together and you get a
            grid of every scoreline and its probability — which collapses into
            win / draw / loss and an expected score. One real-world wrinkle:
            independent Poisson slightly <em>under</em>-counts 0-0s and 1-1s,
            because level teams play it safe. The <strong>Dixon–Coles</strong>{" "}
            correction nudges those low draws up to match reality. This grid is
            exactly the score matrix you can expand on the Matches page.
          </p>
          <Formula note="ΔElo = home Elo − away Elo; home applies only to a host on home soil">
            λ = exp( b0 + home + b_diff · ΔElo / 100 )
          </Formula>
        </div>
      </Card>

      {/* Step 4 — tournament ------------------------------------------- */}
      <Card
        eyebrow="Step 4 · Tournament"
        title="Then the whole thing is played out ten thousand times."
        prose
      >
        <div className="mthd-prose">
          <p>
            Knowing each match as a probability is not the same as knowing who
            lifts the trophy — you have to chain 104 matches through a group
            stage and a knockout bracket, where every result reshuffles who meets
            whom next.
          </p>
          <p>
            So the model runs a <strong>Monte Carlo simulation</strong>: it plays
            the entire tournament from first whistle to final{" "}
            <strong>10,000 times</strong>, each match resolved by a random draw
            from its score distribution, with extra time and penalties included.
            Shootouts are treated as a coin flip — the evidence says they
            essentially are. Counting how often each team reaches each round
            gives the percentages on the Tournament page.
          </p>
        </div>
      </Card>

      {/* WC tuning ----------------------------------------------------- */}
      <Card
        eyebrow="Calibration"
        title="Two dials are turned specifically for a World Cup."
        prose
      >
        <div className="mthd-prose">
          <p>
            The regression above is fit on qualifiers — but a World Cup is not a
            qualifier. A point-in-time backtest of recent major tournaments
            surfaced two systematic gaps, and each is corrected with a single
            dial:
          </p>
          <p>
            <strong>Host advantage is smaller than an ordinary home game.</strong>{" "}
            A qualifier home side gets a large boost; a World Cup host gets about{" "}
            <em>half</em> of it. The co-hosts USA, Mexico and Canada still get a
            real edge — roughly +5 percentage points on home soil, not the +11 a
            naïve home bump would hand them.
          </p>
          <p>
            <strong>World Cups score more.</strong> Recent World Cups average
            about 2.7 goals a game; the qualifier-fit model expected nearer 2.3.
            A small lift to the goal level closes the gap — and, helpfully, also
            improved who-wins accuracy, because World Cup games score more{" "}
            <em>and</em> draw less than qualifiers.
          </p>
        </div>
      </Card>

      {/* Lineups ------------------------------------------------------- */}
      <Card
        eyebrow="Matchday"
        title="When the team sheets drop, the forecast updates itself."
        prose
      >
        <div className="mthd-prose">
          <p>
            Everything above assumes <em>expected</em> lineups. About an hour
            before kickoff the real elevens are published — and a model built on
            players can use them directly. An automated agent reads the confirmed
            lineups from ESPN, re-rates both teams with the actual starters, and
            republishes the prediction.
          </p>
          <p>
            The swings are real. In the USA–Paraguay group game the USA rotated
            into a weaker back line while Paraguay named their strongest attack;
            the forecast moved roughly eight percentage points toward Paraguay
            between the provisional and confirmed lineups. A team-level model
            could not see that coming.
          </p>
        </div>
      </Card>

      {/* How it's built — system / pipeline --------------------------- */}
      <Card
        className="span-2"
        eyebrow="How it's built"
        title="A hands-off pipeline that re-ran itself on every result, all tournament long."
        prose
        source="Each stage ran automatically through the final · the site now serves the frozen end-of-tournament output"
      >
        <div className="mthd-arch">
          <div className="mthd-arch-node">
            <span className="mthd-arch-k">Ingest</span>
            <span className="mthd-arch-name">ESPN lineups + results</span>
            <span className="mthd-arch-desc">
              A matchday agent polled confirmed elevens and final scores.
            </span>
          </div>
          <span className="mthd-arch-arrow">→</span>
          <div className="mthd-arch-node">
            <span className="mthd-arch-k">Model</span>
            <span className="mthd-arch-name">Python + R</span>
            <span className="mthd-arch-desc">
              Players re-rated, teams rebuilt, the match and tournament models
              re-run after every tick.
            </span>
          </div>
          <span className="mthd-arch-arrow">→</span>
          <div className="mthd-arch-node">
            <span className="mthd-arch-k">Publish</span>
            <span className="mthd-arch-name">JSON snapshots</span>
            <span className="mthd-arch-desc">
              Versioned JSON snapshots written to storage on every run.
            </span>
          </div>
          <span className="mthd-arch-arrow">→</span>
          <div className="mthd-arch-node">
            <span className="mthd-arch-k">Serve</span>
            <span className="mthd-arch-name">This dashboard</span>
            <span className="mthd-arch-desc">
              A Next.js front end rendered them live; it now serves the frozen
              final record.
            </span>
          </div>
        </div>
        <div className="mthd-stack">
          {["Python", "R", "SQLite", "Next.js", "TypeScript", "Vercel"].map((t) => (
            <span className="mthd-chip" key={t}>
              {t}
            </span>
          ))}
        </div>
        <p className="mthd-note">
          The whole system is hand-built and runs unattended: the statistical
          models (Python and R), the agent that ingests lineups and scores, the
          publish step, and this TypeScript dashboard — the same data-modelling,
          pipeline and visualisation work that sits behind any production
          analytics system.
        </p>
      </Card>

      {/* Backtest validation ------------------------------------------- */}
      <Card
        className="span-2"
        eyebrow="Validation"
        title="On 262 past matches, the player model beats both a coin flip and team-Elo alone."
        prose
        source="Out-of-sample W/D/L log-loss · WC 2018 + Euro 2020 + WC 2022 + Euro 2024 + Copa América 2024 (262 matches) · point-in-time inputs"
      >
        <div className="mthd-prose mthd-prose--wide">
          <p>
            A model is only as honest as its out-of-sample test. We rebuilt the
            entire pipeline exactly as it would have stood <em>before</em> each
            of five recent major tournaments — point-in-time squads, market
            values and Elo, with no knowledge of what happened next — and scored
            its match forecasts.
          </p>
        </div>
        <div className="mthd-bars">
          {BARS.map((b) => (
            <div className="mthd-bar-row" key={b.label}>
              <span className="mthd-bar-label">{b.label}</span>
              <span className="mthd-bar-track">
                <span
                  className={`mthd-bar-fill ${b.focal ? "focal" : ""}`}
                  style={{ width: w(b.v) }}
                />
              </span>
              <span className="mthd-bar-val num">{b.v.toFixed(3)}</span>
            </div>
          ))}
        </div>
        <p className="mthd-note">
          <span className="mthd-trunc">≋</span> Scale starts at 0.96, not 0 ·
          shorter is better. Log-loss scores a probability forecast: lower means
          more confidence placed on what actually happened (a coin flip scores
          ≈1.10; perfect foresight scores 0). The model edges raw team-Elo and
          clears a coin flip comfortably — but the margin over Elo is modest, and
          we report it that way on purpose.
        </p>

        <div className="mthd-prose mthd-prose--wide" style={{ marginTop: 20 }}>
          <p>
            <strong>Then the 2026 World Cup happened — the one test nothing
            could leak into.</strong> Over the 100 matches with captured
            betting odds, both the model and the market beat the naive
            baselines by a distance; the market finished ahead of the model by
            a real but narrow margin (p ≈ 0.06). Put on the coin-flip scale:
            the market recovered about 22% of the distance from a random
            forecast toward perfect foresight, the model about 19% — two
            informed forecasters in the same league, well clear of chance.
          </p>
        </div>
        <div className="mthd-bars" style={{ marginTop: 12 }}>
          {WC_BARS.map((b) => (
            <div className="mthd-bar-row" key={b.label}>
              <span className="mthd-bar-label">{b.label}</span>
              <span className="mthd-bar-track">
                <span
                  className={`mthd-bar-fill ${b.focal ? "focal" : ""}`}
                  style={{ width: wcw(b.v) }}
                />
              </span>
              <span className="mthd-bar-val num">{b.v.toFixed(3)}</span>
            </div>
          ))}
        </div>
        <p className="mthd-note">
          <span className="mthd-trunc">≋</span> Scale starts at 0.80 · WC26
          final scores, mean hard log-loss, n = 100 · &quot;base rates&quot; =
          the season&apos;s own home/draw/away frequencies applied to every
          match. The split matters: the market&apos;s whole edge came from the
          68 group games (0.834 vs 0.887) — in the 32 knockout matches the
          model was flat-out even with it (0.894 vs 0.896). The full breakdown
          is in the tournament review.
        </p>
      </Card>

      {/* Caveats ------------------------------------------------------- */}
      <Card eyebrow="Limits" title="What it can't do." prose>
        <div className="mthd-defs">
          {CAVEATS.map(([t, d]) => (
            <div className="mthd-def" key={t}>
              <span className="mthd-def-term">{t}</span>
              <span className="mthd-def-body">{d}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Glossary ------------------------------------------------------ */}
      <Card
        eyebrow="Key terms"
        title="A quick statistical glossary."
        prose
        source="Full illustrated glossary — incl. xG, xWDL and player quality — at /glossary"
      >
        <div className="mthd-defs">
          {STAT_TERMS.map((t) => (
            <div className="mthd-def" key={t.term}>
              <span
                className={`mthd-def-term${t.mono ? " mthd-def-term--mono" : ""}`}
              >
                {t.term}
              </span>
              <span className="mthd-def-body">{t.def}</span>
            </div>
          ))}
        </div>
        <p className="mthd-note">
          The three model-specific terms — expected goals, xWDL and player
          quality — get a worked visual on the{" "}
          <Link href="/glossary">glossary page</Link>.
        </p>
      </Card>

      {/* Footer note --------------------------------------------------- */}
      <Card className="span-2 mthd-foot" prose>
        <p className="mthd-note">
          Built by Isaac Kaczor. The model, the matchday agent and this
          dashboard are independent hobby work — not affiliated with FIFA or any
          betting operator. Forecasts are for interest and discussion only.
        </p>
      </Card>
    </>
  );
}
