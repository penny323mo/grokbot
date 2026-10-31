/**
 * Mutual count subtraction. Each tick both sides lose the same amount,
 * capped by whichever stack is smaller and by `loss`.
 * Survivor keeps the difference — see resolveClash.
 */

export function clashTick(countA, countB, loss) {
  const a = Math.max(0, Math.floor(Number.isFinite(countA) ? countA : 0));
  const b = Math.max(0, Math.floor(Number.isFinite(countB) ? countB : 0));
  const step = Math.max(0, Math.floor(Number.isFinite(loss) ? loss : 0));
  const d = Math.min(a, b, step);
  const nextA = a - d;
  const nextB = b - d;
  let winner = null;
  if (nextA === 0 && nextB === 0) winner = 'none';
  else if (nextA > 0 && nextB === 0) winner = 'a';
  else if (nextB > 0 && nextA === 0) winner = 'b';
  return { a: nextA, b: nextB, loss: d, winner };
}

/** Full 1:1 resolution. The larger stack keeps |a − b|. */
export function resolveClash(countA, countB) {
  const a = Math.max(0, Math.floor(Number.isFinite(countA) ? countA : 0));
  const b = Math.max(0, Math.floor(Number.isFinite(countB) ? countB : 0));
  if (a > b) return { winner: 'a', count: a - b };
  if (b > a) return { winner: 'b', count: b - a };
  return { winner: 'none', count: 0 };
}

/**
 * Share an integer survivor total across stacks, largest fractional parts first.
 * Sum of the result equals survivorTotal (when inputs are non-negative).
 */
export function splitSurvivors(counts, survivorTotal) {
  const safe = counts.map((c) => Math.max(0, Math.floor(c)));
  const sum = safe.reduce((n, c) => n + c, 0);
  const total = Math.max(0, Math.floor(survivorTotal));
  if (sum <= 0 || total <= 0) return safe.map(() => 0);
  const raw = safe.map((c) => (c / sum) * total);
  const floors = raw.map((n) => Math.floor(n));
  let left = total - floors.reduce((n, c) => n + c, 0);
  const order = raw
    .map((n, i) => ({ i, frac: n - Math.floor(n) }))
    .sort((p, q) => q.frac - p.frac || p.i - q.i);
  for (let k = 0; k < order.length && left > 0; k++) {
    floors[order[k].i] += 1;
    left -= 1;
  }
  return floors;
}
