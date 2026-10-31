/** Tunable match numbers. Pure data — no rendering. */
import { mapById } from './maps.js';

export const RULES = {
  clashEvery: 0.3,
  clashLoss: 4,
  captureSeconds: 0.7,
  marchSpeed: 4.8,
  contactRadius: 0.92,
  arriveRadius: 0.7,
  enemySendMin: 16,
  enemySendPeriod: 10,
  substep: 0.05,
};

/**
 * First moment each enemy building may march out.
 * The player barracks first reads 滿 at (54−30)/2.25 ≈ 10.7s. The enemy
 * barracks waits until 16s so a rush a few seconds after 滿 is not met
 * on the road by that wave.
 */
export const FIRST_SEND = {
  'enemy-bar': 16,
  'enemy-hq': 22,
};

export function startingBuildings() {
  const list = mapById('crossing').buildings;
  const out = [];
  for (let i = 0; i < list.length; i++) {
    const b = list[i];
    out.push({
      id: b.id,
      kind: b.kind,
      owner: b.owner,
      node: b.node,
      count: b.count,
      cap: b.cap,
      regen: b.regen,
    });
  }
  return out;
}
