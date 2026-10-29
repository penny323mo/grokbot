/** Pure puzzle helpers. No DOM. */

export function matchHerbs(herbs, tokens) {
  return herbs.filter((herb) => tokens.every((token) => herb.tokens.includes(token)));
}

export function uniqueMatch(herbs, tokens) {
  const hits = matchHerbs(herbs, tokens);
  return hits.length === 1 ? hits[0] : null;
}

export function walkStrings(value, out = []) {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((item) => walkStrings(item, out));
  else if (value && typeof value === "object") {
    Object.values(value).forEach((item) => walkStrings(item, out));
  }
  return out;
}

export function customersOnDay(customers, day) {
  return customers.filter((customer) => customer.day === day);
}

/** A customer is solvable when exactly one herb carries every clue token. */
export function customerSolution(herbs, customer) {
  return uniqueMatch(herbs, customer.tokens);
}

export function puzzleLineSolution(herbs, line) {
  return uniqueMatch(herbs, line.tokens);
}

const LEDGER_PHASES = ["evening", "puzzle", "reward", "finale", "finaleChoice"];

/** Today's cipher stays hidden until the evening beat, unless it is already solved. */
export function ledgerOpen(puzzle, day, phase, solved) {
  return day > puzzle.day || !!solved?.[puzzle.id] || (day === puzzle.day && LEDGER_PHASES.includes(phase));
}

/**
 * Phase to restore when a cipher is closed.
 * `null` means the night is over and the day should advance.
 * Passing `reward` collects the evening cipher by advancing, and sends every
 * other phase — including a morning `returns` queue — back where it was.
 */
export function phaseAfterCipher(back, reward = false) {
  if (!back) return null;
  if (reward && back === "evening") return null;
  return back;
}
