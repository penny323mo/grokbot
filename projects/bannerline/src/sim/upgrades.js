/** Two mid-match paths. The cost is paid in troops already in the building. */

export const UPGRADE_DEFS = {
  haste: { id: 'haste', label: '加速', cost: 8, step: 4, max: 2 },
  bulwark: { id: 'bulwark', label: '加固', cost: 8, step: 4, max: 2 },
};

export function upgradeRank(building, id) {
  const bag = building && building.upgrades;
  const rank = bag && bag[id];
  return rank > 0 ? rank : 0;
}

export function upgradeCost(id, rank) {
  const def = UPGRADE_DEFS[id];
  if (!def) return Infinity;
  return def.cost + Math.max(0, rank) * def.step;
}

export function quoteUpgrade(building, id) {
  const def = UPGRADE_DEFS[id];
  if (!def || !building) return { ok: false, reason: 'bad', cost: 0, label: '' };
  const rank = upgradeRank(building, id);
  if (rank >= def.max) return { ok: false, reason: 'max', cost: 0, label: def.label, rank };
  const cost = upgradeCost(id, rank);
  if (building.count - cost < 1) return { ok: false, reason: 'troops', cost, label: def.label, rank };
  return { ok: true, cost, label: def.label, rank };
}

/**
 * Spend troops. Haste multiplies the map's base regen. Bulwark raises the cap.
 * Leaves at least one soldier in the building.
 */
/** Player headquarters and barracks that can pay for haste or bulwark. */
export function upgradeAffordance(building) {
  if (!building || building.owner !== 'player') return false;
  if (building.kind !== 'hq' && building.kind !== 'barracks') return false;
  return quoteUpgrade(building, 'haste').ok || quoteUpgrade(building, 'bulwark').ok;
}

export function applyUpgrade(building, id) {
  const quote = quoteUpgrade(building, id);
  if (!quote.ok) return quote;
  if (!building.upgrades) building.upgrades = { haste: 0, bulwark: 0 };
  building.count -= quote.cost;
  building.bank = 0;
  const rank = quote.rank + 1;
  building.upgrades[id] = rank;
  if (id === 'haste') {
    const base = building.baseRegen > 0 ? building.baseRegen : 0.6;
    building.regen = base * (1.55 ** rank);
  } else if (id === 'bulwark') {
    building.cap += 10;
  }
  return { ok: true, cost: quote.cost, rank, label: quote.label };
}
