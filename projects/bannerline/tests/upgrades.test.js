import assert from 'node:assert/strict';
import test from 'node:test';
import { applyUpgrade, quoteUpgrade, upgradeCost } from '../src/sim/upgrades.js';

function hall(count = 20) {
  return {
    id: 'player-bar',
    kind: 'barracks',
    owner: 'player',
    count,
    cap: 54,
    regen: 2.25,
    baseRegen: 2.25,
    bank: 3,
    upgrades: { haste: 0, bulwark: 0 },
  };
}

test('upgrade cost climbs by the step and stops at rank 2', () => {
  assert.equal(upgradeCost('haste', 0), 8);
  assert.equal(upgradeCost('bulwark', 1), 12);
  const b = hall(40);
  assert.equal(applyUpgrade(b, 'haste').ok, true);
  assert.equal(b.count, 32);
  assert.equal(applyUpgrade(b, 'haste').ok, true);
  assert.equal(b.count, 20);
  assert.equal(b.upgrades.haste, 2);
  const maxed = applyUpgrade(b, 'haste');
  assert.equal(maxed.ok, false);
  assert.equal(maxed.reason, 'max');
  assert.equal(b.count, 20);
});

test('a purchase must leave at least one soldier', () => {
  const b = hall(8);
  const quote = quoteUpgrade(b, 'bulwark');
  assert.equal(quote.ok, false);
  assert.equal(quote.reason, 'troops');
  assert.equal(applyUpgrade(b, 'bulwark').ok, false);
  assert.equal(b.count, 8);
  assert.equal(b.cap, 54);
});

test('haste multiplies the base regen and bulwark raises the cap', () => {
  const fast = hall(40);
  applyUpgrade(fast, 'haste');
  assert.ok(Math.abs(fast.regen - 2.25 * 1.55) < 1e-9);
  assert.equal(fast.bank, 0);
  applyUpgrade(fast, 'haste');
  assert.ok(Math.abs(fast.regen - 2.25 * 1.55 * 1.55) < 1e-9);

  const wall = hall(40);
  const bought = applyUpgrade(wall, 'bulwark');
  assert.equal(bought.ok, true);
  assert.equal(wall.cap, 64);
  assert.equal(wall.count, 32);
  assert.equal(wall.regen, 2.25);
  applyUpgrade(wall, 'bulwark');
  assert.equal(wall.cap, 74);
  assert.equal(wall.upgrades.bulwark, 2);
});
