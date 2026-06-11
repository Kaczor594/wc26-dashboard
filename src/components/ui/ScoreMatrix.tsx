import { displayMatrix, scoreGrid } from "@/lib/scoreMatrix";
import type { Match } from "@/lib/types";

/** Joint score-probability heatmap for one match. Uses the final
 *  (capture) lambdas when present, else the preliminary ones. Cells
 *  shade in moss by probability; the modal score is outlined. */
export function ScoreMatrix({ match, rho }: { match: Match; rho: number }) {
  const src = match.capture ?? match.prelim;
  if (!src) return null;
  const final = match.capture != null;
  const grid = scoreGrid(src.lambda.home, src.lambda.away, rho);
  const m = displayMatrix(grid);
  const pmax = Math.max(...m.flat());
  let best: [number, number] = [0, 0];
  m.forEach((row, i) =>
    row.forEach((p, j) => {
      if (p > m[best[0]][best[1]]) best = [i, j];
    }),
  );
  const labels = ["0", "1", "2", "3", "4", "5+"];

  return (
    <div className="smx">
      <div className="smx-head">
        <span className="eyebrow">
          Score probabilities · {final ? "final (lineup-conditioned)" : "preliminary"}
        </span>
        <span className="smx-lam num">
          λ {src.lambda.home.toFixed(2)} – {src.lambda.away.toFixed(2)}
        </span>
      </div>
      <table className="smx-table">
        <thead>
          <tr>
            <th className="smx-corner">{match.home.slice(0, 12)} ↓ · {match.away.slice(0, 12)} →</th>
            {labels.map((l) => (
              <th key={l} className="num">{l}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {m.map((row, i) => (
            <tr key={i}>
              <th className="num">{labels[i]}</th>
              {row.map((p, j) => (
                <td
                  key={j}
                  className={`num smx-cell ${i === best[0] && j === best[1] ? "smx-best" : ""}`}
                  style={{ background: `rgba(62, 90, 50, ${(0.55 * p) / pmax})` }}
                >
                  {(p * 100).toFixed(1)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="smx-source">
        cell = P(exact score) in % · rows {match.home}, columns {match.away} ·
        Dixon-Coles grid, ρ = {rho.toFixed(3)} · tails pooled at 5+
      </div>
    </div>
  );
}
