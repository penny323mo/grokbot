// tests/staples.test.js
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateStaples } from '../src/engine/staple-system.js';

describe('Staple Spacing & Quality Evaluation', () => {
  const pieceConfig = {
    minStaples: 3,
    maxStaples: 6,
    optimalStaples: 4,
    crackLength: 300
  };

  test('Penalises too few staples (< minStaples) as leaky', () => {
    // Only 1 staple placed
    const staples = [{ x: 100, y: 100 }];
    const result = evaluateStaples(pieceConfig, staples);
    assert.strictEqual(result.rating, 'leaky');
    assert.strictEqual(result.watertight, false);
    assert.ok(result.score <= 50, `Expected low score for too few staples, got ${result.score}`);
  });

  test('Penalises too many staples (> maxStaples) for wasting brass', () => {
    // 8 staples placed (max is 6)
    const staples = [];
    for (let i = 0; i < 8; i++) {
      staples.push({ x: 50 + i * 30, y: 100 });
    }
    const result = evaluateStaples(pieceConfig, staples);
    assert.strictEqual(result.rating, 'overcrowded');
    assert.ok(result.score <= 70, `Expected capped score for overcrowded staples, got ${result.score}`);
  });

  test('Rewards evenly spaced optimal staples with high score and watertight rating', () => {
    // 4 staples evenly spaced 50px apart
    const staples = [
      { x: 100, y: 100 },
      { x: 150, y: 100 },
      { x: 200, y: 100 },
      { x: 250, y: 100 }
    ];
    const result = evaluateStaples(pieceConfig, staples);
    assert.strictEqual(result.watertight, true);
    assert.strictEqual(result.rating, 'perfect');
    assert.ok(result.score >= 90, `Expected high score (>=90) for even spacing, got ${result.score}`);
  });

  test('Penalises unevenly clustered staples', () => {
    // 4 staples, but 3 clumped right on top of each other and 1 far away
    const clumpedStaples = [
      { x: 100, y: 100 },
      { x: 110, y: 100 }, // clumped < 25px
      { x: 115, y: 100 }, // clumped < 25px
      { x: 280, y: 100 }
    ];
    const clumpedResult = evaluateStaples(pieceConfig, clumpedStaples);

    // Uniform 4 staples
    const uniformStaples = [
      { x: 100, y: 100 },
      { x: 150, y: 100 },
      { x: 200, y: 100 },
      { x: 250, y: 100 }
    ];
    const uniformResult = evaluateStaples(pieceConfig, uniformStaples);

    assert.ok(
      uniformResult.score > clumpedResult.score + 15,
      `Uniform spacing (${uniformResult.score}) should score substantially higher than clumped (${clumpedResult.score})`
    );
  });
});
