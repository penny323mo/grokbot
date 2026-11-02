// tests/economy.test.js
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Economy } from '../src/engine/economy.js';

describe('Economy System & Rent Solvability', () => {
  test('Values are sanitized and never NaN under abnormal inputs', () => {
    const eco = new Economy({ cash: NaN, staples: undefined, reputation: null, day: 'bad' });
    assert.strictEqual(isNaN(eco.cash), false);
    assert.strictEqual(isNaN(eco.staples), false);
    assert.strictEqual(isNaN(eco.reputation), false);
    assert.strictEqual(isNaN(eco.day), false);

    eco.recordJobEarnings(NaN, { rating: 'unknown' });
    assert.strictEqual(isNaN(eco.cash), false);
    assert.strictEqual(isNaN(eco.reputation), false);

    eco.consumeStaples('none');
    assert.strictEqual(isNaN(eco.staples), false);

    eco.endDay();
    assert.strictEqual(isNaN(eco.cash), false);
  });

  test('Daily settlement math strictly adds up: opening + earned - dailyCost - rent === balance', () => {
    const eco = new Economy({ cash: 6.0, staples: 30, day: 1 });
    const opening = eco.cash;
    const res = eco.recordDailySettlement(2.0, { rating: 'perfect' });
    const expected = Math.round((opening + res.earned - res.dailyCost - (res.rentCost || 0)) * 100) / 100;
    assert.strictEqual(res.newBalance, expected, 'Settlement rows must sum exactly to newBalance');
    assert.strictEqual(eco.cash, expected);
  });

  test('A careful player can afford the rent on Day 6', () => {
    const eco = new Economy({ cash: 6.0, staples: 30, reputation: 50, day: 1 });

    // Days 1 through 5: careful player charges fair prices and does perfect/good repairs
    const jobs = [
      { price: 1.5, eval: { rating: 'perfect' }, staplesUsed: 4 },
      { price: 2.5, eval: { rating: 'perfect' }, staplesUsed: 5 },
      { price: 1.0, eval: { rating: 'good' }, staplesUsed: 4 },
      { price: 3.0, eval: { rating: 'perfect' }, staplesUsed: 5 },
      { price: 6.0, eval: { rating: 'perfect' }, staplesUsed: 6 } // Boss Ho's pawnshop bowl
    ];

    jobs.forEach(j => {
      eco.consumeStaples(j.staplesUsed);
      eco.recordDailySettlement(j.price, j.eval);
      eco.endDay();
    });

    // We are now on Day 6 before rent deduction
    assert.strictEqual(eco.day, 6);
    assert.ok(
      eco.canAffordRent(),
      `Careful player should be able to pay rent on Day 6. Current cash: $${eco.cash}, Rent needed: $${eco.rentAmount}`
    );

    const endDay6 = eco.recordDailySettlement(2.0, { rating: 'good' });
    assert.strictEqual(endDay6.rentPaid, true, 'Rent should be successfully paid on Day 6');
    assert.strictEqual(endDay6.rentPenalty, false, 'Should have no rent penalty');
    assert.ok(eco.cash >= 0, `Cash should remain non-negative after rent, got ${eco.cash}`);
  });

  test('A careless player cannot afford rent and incurs penalty on Day 6', () => {
    const eco = new Economy({ cash: 6.0, staples: 30, reputation: 50, day: 1 });

    // Days 1 through 5: careless player does leaky repairs (getting only half pay) or gives freebies
    const jobs = [
      { price: 1.5, eval: { rating: 'leaky' }, staplesUsed: 8 }, // wasted 8 staples
      { price: 0.0, eval: { rating: 'leaky' }, staplesUsed: 9 }, // gave freebie, wasted staples
      { price: 1.0, eval: { rating: 'leaky' }, staplesUsed: 7 }, // ran out of staples, forced restock
      { price: 1.0, eval: { rating: 'leaky' }, staplesUsed: 6 },
      { price: 2.0, eval: { rating: 'leaky' }, staplesUsed: 5 }
    ];

    jobs.forEach(j => {
      eco.consumeStaples(j.staplesUsed);
      eco.recordDailySettlement(j.price, j.eval, j.price === 0);
      eco.endDay();
    });

    assert.strictEqual(eco.day, 6);
    assert.strictEqual(eco.canAffordRent(), false, 'Careless player should NOT afford rent');

    const endDay6 = eco.recordDailySettlement(1.0, { rating: 'leaky' });
    assert.strictEqual(endDay6.rentPaid, false, 'Rent should fail to be paid');
    assert.strictEqual(endDay6.rentPenalty, true, 'Rent penalty should trigger');
  });
});
