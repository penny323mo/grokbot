import assert from 'node:assert/strict';
import test from 'node:test';
import { clashTick, resolveClash, splitSurvivors } from '../src/sim/combat.js';
import { applyRegen } from '../src/sim/economy.js';

test('equal stacks trade down to a mutual wipe', () => {
  let a = 9;
  let b = 9;
  let guard = 0;
  while (a > 0 && b > 0 && guard < 20) {
    const r = clashTick(a, b, 4);
    a = r.a;
    b = r.b;
    guard += 1;
  }
  assert.equal(a, 0);
  assert.equal(b, 0);
  assert.equal(clashTick(0, 0, 4).winner, 'none');
});

test('larger stack keeps the difference and the smaller one is removed', () => {
  let a = 20;
  let b = 12;
  let guard = 0;
  let last = null;
  while (last?.winner == null && guard < 30) {
    last = clashTick(a, b, 4);
    a = last.a;
    b = last.b;
    guard += 1;
  }
  assert.equal(last.winner, 'a');
  assert.equal(a, 8);
  assert.equal(b, 0);
  assert.deepEqual(resolveClash(20, 12), { winner: 'a', count: 8 });
  assert.deepEqual(resolveClash(12, 20), { winner: 'b', count: 8 });
  assert.deepEqual(resolveClash(7, 7), { winner: 'none', count: 0 });
});

test('a tick never removes more than the smaller stack or the loss cap', () => {
  assert.deepEqual(clashTick(5, 2, 4), { a: 3, b: 0, loss: 2, winner: 'a' });
  assert.deepEqual(clashTick(10, 10, 0), { a: 10, b: 10, loss: 0, winner: null });
  assert.deepEqual(clashTick(0, 6, 4), { a: 0, b: 6, loss: 0, winner: 'b' });
  assert.equal(clashTick(-3, 4, 2).a, 0);
});

test('repeated ticks match a full 1:1 resolution', () => {
  for (const [a0, b0] of [[1, 1], [3, 8], [15, 4], [0, 5], [6, 6]]) {
    let a = a0;
    let b = b0;
    for (let i = 0; i < 40 && a > 0 && b > 0; i++) {
      const r = clashTick(a, b, 1);
      a = r.a;
      b = r.b;
    }
    const full = resolveClash(a0, b0);
    if (full.winner === 'a') assert.equal(a, full.count);
    else if (full.winner === 'b') assert.equal(b, full.count);
    else {
      assert.equal(a, 0);
      assert.equal(b, 0);
    }
  }
});

test('splitSurvivors keeps the integer total', () => {
  const parts = splitSurvivors([10, 5, 5], 7);
  assert.equal(parts.reduce((n, c) => n + c, 0), 7);
  assert.equal(parts.length, 3);
  assert.ok(parts[0] >= parts[1]);
  assert.deepEqual(splitSurvivors([0, 0], 4), [0, 0]);
  assert.deepEqual(splitSurvivors([3, 1], 0), [0, 0]);
});

test('barracks regen fills toward the cap and stops', () => {
  let count = 0;
  let bank = 0;
  for (let i = 0; i < 10; i++) {
    const next = applyRegen(count, 4, bank, 1, 1);
    count = next.count;
    bank = next.bank;
  }
  assert.equal(count, 4);
  assert.equal(bank, 0);
  const over = applyRegen(6, 4, 0.8, 2, 1);
  assert.equal(over.count, 6);
  assert.equal(over.bank, 0);
});

test('regen keeps the fractional soldier in the bank', () => {
  const next = applyRegen(2, 10, 0.4, 1, 0.5);
  assert.equal(next.count, 2);
  assert.ok(Math.abs(next.bank - 0.9) < 1e-9);
  const spill = applyRegen(next.count, 10, next.bank, 1, 0.2);
  assert.equal(spill.count, 3);
  assert.ok(spill.bank < 0.2);
});
