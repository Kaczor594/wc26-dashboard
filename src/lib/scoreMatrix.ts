// Dixon-Coles joint score grid — mirrors src/match/match_model.R
// (score_matrix / dc_tau) in the model repo. Lambdas come from the blob
// (capture or prelim); rho is published once per matches.json.

const MAX_GOALS = 8; // computation grid; display buckets the tail

function pois(lambda: number, k: number): number {
  let f = 1;
  for (let i = 2; i <= k; i++) f *= i;
  return (Math.exp(-lambda) * lambda ** k) / f;
}

/** Full normalized grid, rows = home goals 0..MAX_GOALS. */
export function scoreGrid(
  lambdaHome: number,
  lambdaAway: number,
  rho: number,
): number[][] {
  const tau = (i: number, j: number): number => {
    if (i === 0 && j === 0) return 1 - lambdaHome * lambdaAway * rho;
    if (i === 0 && j === 1) return 1 + lambdaHome * rho;
    if (i === 1 && j === 0) return 1 + lambdaAway * rho;
    if (i === 1 && j === 1) return 1 - rho;
    return 1;
  };
  const grid: number[][] = [];
  let total = 0;
  for (let i = 0; i <= MAX_GOALS; i++) {
    grid[i] = [];
    for (let j = 0; j <= MAX_GOALS; j++) {
      const p = pois(lambdaHome, i) * pois(lambdaAway, j) * Math.max(tau(i, j), 1e-10);
      grid[i][j] = p;
      total += p;
    }
  }
  return grid.map((row) => row.map((p) => p / total));
}

/** Display matrix: 0..4 exact plus an aggregated "5+" bucket per side. */
export function displayMatrix(grid: number[][], cap = 5) {
  const m: number[][] = [];
  for (let i = 0; i <= cap; i++) {
    m[i] = [];
    for (let j = 0; j <= cap; j++) {
      let p = 0;
      for (let gi = i === cap ? cap : i; gi <= (i === cap ? MAX_GOALS : i); gi++)
        for (let gj = j === cap ? cap : j; gj <= (j === cap ? MAX_GOALS : j); gj++)
          p += grid[gi][gj];
      m[i][j] = p;
    }
  }
  return m;
}
