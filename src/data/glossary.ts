// Centralised glossary term definitions — the single source shared by the
// /glossary page (rich, with Wikipedia links) and the /method page's inline
// "Key terms" card. The three MODEL-SPECIFIC terms (xG, xWDL, player quality)
// live in the /glossary page itself because each ships a bespoke visual; the
// entries here are the established statistical terms.

export interface GlossaryTerm {
  term: string;
  mono?: boolean; // render the term label in the mono face (symbols / short codes)
  def: string;
  wiki?: string; // Wikipedia article, where a clean one exists
}

export const STAT_TERMS: GlossaryTerm[] = [
  {
    term: "z-score",
    def: "How many standard deviations a value sits above or below the average. A striker at +2 is well above a typical striker; −1 is below. It puts goalkeepers and forwards on one comparable scale.",
    wiki: "https://en.wikipedia.org/wiki/Standard_score",
  },
  {
    term: "Elo",
    def: "A points rating, born in chess and now standard for national teams: you gain points beating strong opponents and lose them slipping up against weak ones. The gap between two ratings maps directly to a win probability.",
    wiki: "https://en.wikipedia.org/wiki/Elo_rating_system",
  },
  {
    term: "Poisson distribution",
    def: "The textbook model for counting independent, fairly rare events in a fixed window — here, goals in a match. Give it an expected count and it returns the probability of 0, 1, 2, 3 … goals.",
    wiki: "https://en.wikipedia.org/wiki/Poisson_distribution",
  },
  {
    term: "λ (lambda)",
    mono: true,
    def: "The single input to a Poisson distribution: a team's expected number of goals in the match. A bigger favourite gets a higher λ.",
  },
  {
    term: "Dixon–Coles",
    def: "A standard correction to the basic two-Poisson football model (Dixon & Coles, 1997). It nudges the probabilities of the lowest scores (0-0, 1-0, 1-1), which independent Poisson gets slightly wrong because level teams play more cautiously.",
  },
  {
    term: "Monte Carlo simulation",
    def: "Estimating an outcome by repeated random trial: play the tournament thousands of times, each match decided by a draw from its score distribution, then count how often each team advances.",
    wiki: "https://en.wikipedia.org/wiki/Monte_Carlo_method",
  },
  {
    term: "log-loss",
    def: "A scoring rule for probability forecasts. It rewards putting confidence on what actually happened and punishes confident-but-wrong calls. Lower is better; a coin-flip forecaster scores about 1.10 across three outcomes.",
    wiki: "https://en.wikipedia.org/wiki/Cross-entropy",
  },
  {
    term: "Brier score",
    def: "A second forecast-scoring rule: the squared distance between the probabilities you assigned and what actually happened. Like log-loss, lower is better — but it punishes a confident miss less harshly, so the two are shown side by side.",
    wiki: "https://en.wikipedia.org/wiki/Brier_score",
  },
  {
    term: "t-test",
    def: "A significance test for whether two sets of paired numbers differ by more than chance — here, the model's per-match log-loss against the market's. The p-value is the chance you'd see a gap this large if the two were really equal.",
    wiki: "https://en.wikipedia.org/wiki/Student%27s_t-test",
  },
  {
    term: "vig / vig-free consensus",
    def: "Vig (vigorish, or “juice”) is the bookmaker's built-in margin: turn a book's odds into probabilities and they sum to more than 100% — that excess is the house's cut. Strip it out and rescale to a clean 100%, take the median across books, and you get the vig-free consensus — the market line this site compares the model against.",
    wiki: "https://en.wikipedia.org/wiki/Vigorish",
  },
];
