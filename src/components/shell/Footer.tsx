/** Site-wide colophon. Subtle by design — invisible to someone just checking
 *  scores, there for anyone (a recruiter, a curious friend) who wants to know
 *  who built it and how. */
export default function Footer() {
  return (
    <footer className="site-foot span-2">
      <div className="site-foot-l">
        <span className="site-foot-name">Isaac Kaczor</span>
        <span className="site-foot-tag">
          An independent World Cup 2026 prediction model — designed, backtested
          and run solo.
        </span>
      </div>
      <div className="site-foot-r">
        <span className="site-foot-stack">Python · R · SQLite · Next.js · TypeScript</span>
        <a
          className="site-foot-link"
          href="https://github.com/Kaczor594/wc26-dashboard"
          target="_blank"
          rel="noreferrer"
        >
          Source ↗
        </a>
      </div>
    </footer>
  );
}
