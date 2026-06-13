import { Fragment } from "react";
import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";

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

// Out-of-sample W/D/L log-loss on the 147-match backtest. Scale truncated at
// 0.96 so the (small, honest) gap between model and Elo is visible; the ≋ flag
// + the note mark the truncation. Shorter bar = better.
const SCALE_MIN = 0.96;
const SCALE_MAX = 1.1;
const w = (v: number) => `${((v - SCALE_MIN) / (SCALE_MAX - SCALE_MIN) * 100).toFixed(0)}%`;
const BARS = [
  { label: "This model", v: 1.003, focal: true },
  { label: "Team Elo only", v: 1.01, focal: false },
  { label: "Coin flip", v: 1.099, focal: false },
];

const GLOSSARY = [
  [
    "z-score",
    "How many standard deviations a value sits above or below the average. A striker at +2 is well above a typical striker; −1 is below. It puts goalkeepers and forwards on one comparable scale.",
  ],
  [
    "Elo",
    "A points rating, born in chess and now standard for national teams: you gain points beating strong opponents and lose them slipping up against weak ones. The gap between two ratings maps directly to a win probability.",
  ],
  [
    "Poisson distribution",
    "The textbook model for counting independent, fairly rare events in a fixed window — here, goals in a match. Give it an expected count and it returns the probability of 0, 1, 2, 3 … goals.",
  ],
  [
    "λ (lambda)",
    "The single input to a Poisson distribution: a team's expected number of goals in the match. A bigger favourite gets a higher λ.",
  ],
  [
    "Dixon–Coles",
    "A standard correction to the basic two-Poisson football model. It nudges the probabilities of the lowest scores (0-0, 1-0, 1-1), which independent Poisson gets slightly wrong because level teams play more cautiously.",
  ],
  [
    "Monte Carlo simulation",
    "Estimating an outcome by repeated random trial: play the tournament thousands of times, each match decided by a draw from its score distribution, then count how often each team advances.",
  ],
  [
    "log-loss",
    "A scoring rule for probability forecasts. It rewards putting confidence on what actually happened and punishes confident-but-wrong calls. Lower is better; a coin-flip forecaster scores about 1.10 across three outcomes.",
  ],
  [
    "vig",
    "Short for vigorish (also “juice”): the bookmaker's built-in margin. Turn a book's odds into probabilities and they sum to more than 100% — that excess is the house's cut for taking the bet. To put the model and the market on equal footing we strip it out, rescaling back to a clean 100%; that's the “vig-free” market line shown on the Matches page.",
  ],
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
    "A 147-match backtest and a 48-team field leave real uncertainty. Treat single-game edges of a point or two as noise, not signal.",
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
            qualifier. A point-in-time backtest of the last three major
            tournaments (2022 World Cup, Euro 2024, Copa América 2024 — 147
            matches in all) surfaced two systematic gaps, and each is corrected
            with a single dial:
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

      {/* Backtest validation ------------------------------------------- */}
      <Card
        className="span-2"
        eyebrow="Validation"
        title="On 147 past matches, the player model beats both a coin flip and team-Elo alone."
        prose
        source="Out-of-sample W/D/L log-loss · WC 2022 + Euro 2024 + Copa América 2024 (147 matches) · point-in-time inputs"
      >
        <div className="mthd-prose mthd-prose--wide">
          <p>
            A model is only as honest as its out-of-sample test. We rebuilt the
            entire pipeline exactly as it would have stood <em>before</em> each
            of the last three major tournaments — point-in-time squads, market
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
      <Card eyebrow="Key terms" title="A quick statistical glossary." prose>
        <div className="mthd-defs">
          {GLOSSARY.map(([t, d]) => (
            <div className="mthd-def" key={t}>
              <span className="mthd-def-term mthd-def-term--mono">{t}</span>
              <span className="mthd-def-body">{d}</span>
            </div>
          ))}
        </div>
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
