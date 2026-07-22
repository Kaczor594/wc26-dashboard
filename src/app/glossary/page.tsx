import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ProbBar } from "@/components/ui/ProbBar";
import { STAT_TERMS } from "@/data/glossary";

export const metadata: Metadata = {
  title: "WC26 model — glossary",
  description:
    "What the terms on this site mean: expected goals (xG), xG-based win expectancy (xWDL), the model's player-quality rating, and the statistics behind the forecasts — with a worked visual for each of the model-specific ones.",
};

/* ---- worked-example visuals (static markup, no client JS) ------------- */

// xG: a few real-feeling chances scaled against a full goal (1.0 xG).
const XG_CHANCES: { label: string; xg: number }[] = [
  { label: "Penalty", xg: 0.79 },
  { label: "Close-range header", xg: 0.35 },
  { label: "Edge-of-box shot", xg: 0.09 },
  { label: "Speculative long shot", xg: 0.03 },
];

// player quality: a percentile ruler with a couple of anchors.
const QUALITY_MARKS: { label: string; pct: number; focal?: boolean }[] = [
  { label: "Squad player", pct: 45 },
  { label: "Pedro Porro (94th)", pct: 94, focal: true },
];

export default function GlossaryPage() {
  return (
    <>
      {/* Hero ----------------------------------------------------------- */}
      <Card
        className="span-2"
        eyebrow="Glossary"
        title="Three ideas do most of the work on this site — here they are, drawn out"
        prose
        source="Companion to the tournament review and the method page · the model-specific terms carry a worked example; the statistical terms link out to a fuller reference"
      >
        <div className="mthd-lede">
          <p>
            The review talks in <strong>expected goals</strong>, an{" "}
            <strong>xG-based win expectancy</strong> called xWDL, and a
            per-player <strong>quality</strong> rating. None is complicated once
            you see it once. The three cards below each show the idea with a
            worked example; the statistical terms further down are the standard
            machinery, defined briefly with a link to read more.
          </p>
        </div>
      </Card>

      {/* xG ------------------------------------------------------------- */}
      <Card
        eyebrow="Model term · xG"
        title="Expected goals: how good a chance was, before anyone shot"
        source="Illustrative single-chance xG values · FotMob supplies this site's xG"
      >
        <p className="gloss-body">
          Every shot is graded on how often a chance like it — the distance, the
          angle, the body part, the pressure — gets scored, from long historical
          data. A tap-in is worth most of a goal; a hopeful long shot, almost
          nothing. Add a team&apos;s chances up and you get the goals it{" "}
          <em>ought</em> to have scored, which is often a truer read of a match
          than the scoreline the finishing produced.
        </p>
        <div className="gloss-xg">
          {XG_CHANCES.map((c) => (
            <div className="gloss-xg-row" key={c.label}>
              <span className="gloss-xg-lbl">{c.label}</span>
              <div className="gloss-xg-track">
                <div
                  className="gloss-xg-fill"
                  style={{ width: `${c.xg * 100}%` }}
                />
              </div>
              <span className="gloss-xg-val">{c.xg.toFixed(2)}</span>
            </div>
          ))}
        </div>
        <p className="gloss-cap">
          xG per chance, on a scale where a certain goal = 1.00.
        </p>
      </Card>

      {/* xWDL ----------------------------------------------------------- */}
      <Card
        eyebrow="Model term · xWDL"
        title="xWDL: turning a match's chances into a deserved win, draw or loss"
        source="Worked example · post-match xG for each side → win/draw/loss probability"
      >
        <p className="gloss-body">
          A scoreline is one noisy sample; the chances a match produced are a
          much bigger one. xWDL feeds each side&apos;s expected goals through the
          same score model the forecasts use and reads off how often that balance
          of chances ends in a home win, a draw, or an away win. It is the answer
          to &ldquo;who <em>deserved</em> it?&rdquo; — the yardstick the review
          scores both the model and the market against.
        </p>
        <div className="gloss-xwdl">
          <div className="gloss-xwdl-inputs">
            <span className="gloss-xwdl-team">
              Home <b>2.4</b> xG
            </span>
            <span className="gloss-xwdl-vs">vs</span>
            <span className="gloss-xwdl-team">
              Away <b>0.6</b> xG
            </span>
          </div>
          <div className="gloss-xwdl-arrow" aria-hidden="true">
            ↓
          </div>
          <ProbBar p={{ home: 0.76, draw: 0.16, away: 0.08 }} kind="xw" />
          <div className="gloss-xwdl-key">
            <span>
              <i className="k ph" />
              Home win
            </span>
            <span>
              <i className="k pd" />
              Draw
            </span>
            <span>
              <i className="k pa" />
              Away win
            </span>
          </div>
        </div>
        <p className="gloss-cap">
          A side that out-creates its opponent 2.4 xG to 0.6 &ldquo;deserves&rdquo;
          the win roughly three times in four — but still draws or loses one time
          in four. That gap is why a single result proves little.
        </p>
      </Card>

      {/* player quality ------------------------------------------------- */}
      <Card
        className="span-2"
        eyebrow="Model term · player quality"
        title="Player quality: one rating that puts a keeper and a striker on the same ruler"
        prose
        source="Illustrative percentiles within the tournament player pool · see the method page for the full formula"
      >
        <div className="mthd-lede">
          <p>
            The model rates every player from their club output — shots created
            and taken, defensive actions, minutes, all age-adjusted — and
            expresses it as a percentile against everyone else, so a
            94th-percentile full-back and a 94th-percentile goalkeeper mean the
            same thing. Team strength is these ratings rolled up over the expected
            starting eleven; that is what lets the lineup, not the badge, decide
            the forecast.
          </p>
        </div>
        <div className="gloss-qual">
          <div className="gloss-qual-track">
            <span className="gloss-qual-mid" style={{ left: "50%" }} />
            {QUALITY_MARKS.map((m) => (
              <span
                key={m.label}
                className={`gloss-qual-mark${m.focal ? " focal" : ""}`}
                style={{ left: `${m.pct}%` }}
              >
                <span className="dot" />
                <span className="lbl">{m.label}</span>
              </span>
            ))}
          </div>
          <div className="gloss-qual-axis">
            <span>0th</span>
            <span>50th — median player</span>
            <span>100th</span>
          </div>
        </div>
      </Card>

      {/* statistical terms --------------------------------------------- */}
      <Card
        className="span-2"
        eyebrow="Statistical terms"
        title="The standard machinery, briefly"
        prose
        source="Established methods — follow a link for the full treatment"
      >
        <div className="gloss-defs">
          {STAT_TERMS.map((t) => (
            <div className="gloss-def" key={t.term}>
              <span
                className={`gloss-def-term${t.mono ? " gloss-def-term--mono" : ""}`}
              >
                {t.term}
              </span>
              <span className="gloss-def-body">
                {t.def}
                {t.wiki && (
                  <>
                    {" "}
                    <a
                      href={t.wiki}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glossary-link"
                    >
                      Wikipedia ↗
                    </a>
                  </>
                )}
              </span>
            </div>
          ))}
        </div>
        <p className="mthd-note">
          More on how these fit together is on the{" "}
          <Link href="/method">method page</Link>; the numbers they produce are
          in the <Link href="/">tournament review</Link>.
        </p>
      </Card>
    </>
  );
}
