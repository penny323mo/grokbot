import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  detectTendency,
  formatTendencyCantonese,
  findExtremesFromHourly,
  findNextExtreme
} from '../js/extremes.js';

describe('Extremes, Tendency & Next Tide Calculation (extremes.js)', () => {
  const sampleHourly = [
    { timestamp: new Date('2026-11-12T00:00:00+08:00'), height: 1.80 },
    { timestamp: new Date('2026-11-12T01:00:00+08:00'), height: 1.50 },
    { timestamp: new Date('2026-11-12T02:00:00+08:00'), height: 1.10 },
    { timestamp: new Date('2026-11-12T03:00:00+08:00'), height: 0.70 },
    { timestamp: new Date('2026-11-12T04:00:00+08:00'), height: 0.30 },
    { timestamp: new Date('2026-11-12T05:00:00+08:00'), height: 0.10 },
    { timestamp: new Date('2026-11-12T06:00:00+08:00'), height: 0.08 }, // Low tide trough
    { timestamp: new Date('2026-11-12T07:00:00+08:00'), height: 0.12 },
    { timestamp: new Date('2026-11-12T08:00:00+08:00'), height: 0.40 },
    { timestamp: new Date('2026-11-12T09:00:00+08:00'), height: 0.80 },
    { timestamp: new Date('2026-11-12T10:00:00+08:00'), height: 1.30 },
    { timestamp: new Date('2026-11-12T11:00:00+08:00'), height: 1.70 },
    { timestamp: new Date('2026-11-12T12:00:00+08:00'), height: 1.95 }, // High tide peak
    { timestamp: new Date('2026-11-12T13:00:00+08:00'), height: 1.92 },
    { timestamp: new Date('2026-11-12T14:00:00+08:00'), height: 1.60 }
  ];

  test('detectTendency detects falling tide, rising tide, and slack water correctly', () => {
    // At 02:30 (falling sharply from 1.10 to 0.70)
    const tFalling = new Date('2026-11-12T02:30:00+08:00');
    assert.strictEqual(detectTendency(sampleHourly, tFalling), 'falling');
    assert.strictEqual(formatTendencyCantonese('falling'), '退緊');

    // At 09:30 (rising sharply from 0.80 to 1.30)
    const tRising = new Date('2026-11-12T09:30:00+08:00');
    assert.strictEqual(detectTendency(sampleHourly, tRising), 'rising');
    assert.strictEqual(formatTendencyCantonese('rising'), '漲緊');

    // At 05:45 (near bottom turn 0.10 -> 0.08, very slow change)
    const slackHourly = [
      { timestamp: new Date('2026-11-12T05:00:00+08:00'), height: 0.10 },
      { timestamp: new Date('2026-11-12T06:00:00+08:00'), height: 0.09 },
      { timestamp: new Date('2026-11-12T07:00:00+08:00'), height: 0.10 }
    ];
    const tSlack = new Date('2026-11-12T05:30:00+08:00');
    assert.strictEqual(detectTendency(slackHourly, tSlack), 'slack');
    assert.strictEqual(formatTendencyCantonese('slack'), '差不多平');
  });

  test('findExtremesFromHourly detects local peaks and troughs and labels them as approximate', () => {
    const extremes = findExtremesFromHourly(sampleHourly);

    assert.strictEqual(extremes.length, 2, 'Should find 1 low tide and 1 high tide');

    // Low tide at 06:00 (0.08m)
    assert.strictEqual(extremes[0].type, 'low');
    assert.strictEqual(extremes[0].height, 0.08);
    assert.strictEqual(extremes[0].time, '06:00');
    assert.strictEqual(extremes[0].approx, true, 'Hourly-derived extremes must be flagged approx');

    // High tide at 12:00 (1.95m)
    assert.strictEqual(extremes[1].type, 'high');
    assert.strictEqual(extremes[1].height, 1.95);
    assert.strictEqual(extremes[1].time, '12:00');
    assert.strictEqual(extremes[1].approx, true);
  });

  test('Flat or short hourly series does NOT crash and does NOT invent tides', () => {
    const flatSeries = [
      { timestamp: new Date('2026-11-12T00:00:00+08:00'), height: 1.50 },
      { timestamp: new Date('2026-11-12T01:00:00+08:00'), height: 1.50 },
      { timestamp: new Date('2026-11-12T02:00:00+08:00'), height: 1.50 }
    ];

    const extremes = findExtremesFromHourly(flatSeries);
    assert.strictEqual(extremes.length, 0, 'Flat series should have no local maxima or minima');

    const empty = findExtremesFromHourly([]);
    assert.strictEqual(empty.length, 0);
  });

  test('findNextExtreme finds the immediate next extreme and produces natural Cantonese countdown', () => {
    const extremes = [
      { timestamp: new Date('2026-11-12T06:00:00+08:00'), time: '06:00', height: 0.08, type: 'low', approx: true },
      { timestamp: new Date('2026-11-12T12:00:00+08:00'), time: '12:00', height: 1.95, type: 'high', approx: true }
    ];

    // Current time: 04:15
    const now = new Date('2026-11-12T04:15:00+08:00');
    const next = findNextExtreme(extremes, now);

    assert.ok(next);
    assert.strictEqual(next.extreme.time, '06:00');
    assert.strictEqual(next.typeLabel, '低潮');
    assert.strictEqual(next.hoursRemaining, 1);
    assert.strictEqual(next.minutesRemaining, 45);
    assert.ok(next.summary.includes('下一潮：低潮 約 06:00 · 0.08 m，仲有 1小時45分'));
  });

  test('findNextExtreme formats typeLabel as 潮位 when type is unknown', () => {
    const extremes = [
      { timestamp: new Date('2026-11-12T06:00:00+08:00'), time: '06:00', height: 1.50, type: 'unknown', approx: false }
    ];
    const now = new Date('2026-11-12T04:00:00+08:00');
    const next = findNextExtreme(extremes, now);

    assert.ok(next);
    assert.strictEqual(next.typeLabel, '潮位');
    assert.ok(next.summary.includes('下一潮：潮位 06:00 · 1.50 m，仲有 2小時'));
  });
});
