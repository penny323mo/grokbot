import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHkoHlt, parseHkoHhot, interpolateHkoHeight } from '../js/hko.js';
import { DATUM } from '../js/stations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('HKO Astronomical Tides Module (hko.js)', () => {
  const hltRaw = JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'snapshot-hko-tao-hlt.json'), 'utf8'));
  const hhotRaw = JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'snapshot-hko-tao-hhot.json'), 'utf8'));

  test('Parses real 2026-11-12 Tai O HLT fixture into exactly 4 extremes without inventing extras', () => {
    const extremes = parseHkoHlt(hltRaw, 2026);

    assert.strictEqual(extremes.length, 4, 'Must contain exactly 4 extremes for Tai O on 2026-11-12');

    // Expected extremes: 05:41 (0.49m, low), 12:50 (1.68m, high), 16:21 (1.46m, low), 22:30 (2.68m, high)
    assert.strictEqual(extremes[0].time, '05:41');
    assert.strictEqual(extremes[0].height, 0.49);
    assert.strictEqual(extremes[0].type, 'low');
    assert.strictEqual(extremes[0].datum, DATUM.CHART_DATUM);

    assert.strictEqual(extremes[1].time, '12:50');
    assert.strictEqual(extremes[1].height, 1.68);
    assert.strictEqual(extremes[1].type, 'high');
    assert.strictEqual(extremes[1].datum, DATUM.CHART_DATUM);

    assert.strictEqual(extremes[2].time, '16:21');
    assert.strictEqual(extremes[2].height, 1.46);
    assert.strictEqual(extremes[2].type, 'low');
    assert.strictEqual(extremes[2].datum, DATUM.CHART_DATUM);

    assert.strictEqual(extremes[3].time, '22:30');
    assert.strictEqual(extremes[3].height, 2.68);
    assert.strictEqual(extremes[3].type, 'high');
    assert.strictEqual(extremes[3].datum, DATUM.CHART_DATUM);
  });

  test('Incomplete HLT row with 3 extremes does NOT invent a 4th or 5th tide', () => {
    const partialHlt = {
      fields: ['Month', 'Date', 'Time', 'Height(m)', 'Time', 'Height(m)', 'Time', 'Height(m)'],
      data: [['11', '12', '0600', '0.60', '1300', '1.70', '1800', '1.10']]
    };

    const extremes = parseHkoHlt(partialHlt, 2026);
    assert.strictEqual(extremes.length, 3, 'Must contain only the 3 parsed extremes');
    assert.strictEqual(extremes[0].time, '06:00');
    assert.strictEqual(extremes[1].time, '13:00');
    assert.strictEqual(extremes[2].time, '18:00');
  });

  test('Parses real 2026-11-12 Tai O HHOT fixture into 24 hourly heights with hour 24 as 24:00', () => {
    const hourly = parseHkoHhot(hhotRaw, 2026);

    assert.strictEqual(hourly.length, 24, 'Must parse exactly 24 hourly heights for one day');

    // Hour 01 is 2.13m
    assert.strictEqual(hourly[0].hour, 1);
    assert.strictEqual(hourly[0].height, 2.13);
    assert.strictEqual(hourly[0].datum, DATUM.CHART_DATUM);

    // Hour 06 is 0.50m (near low tide at 05:41)
    assert.strictEqual(hourly[5].hour, 6);
    assert.strictEqual(hourly[5].height, 0.50);

    // Hour 24 is 2.54m and represents midnight
    assert.strictEqual(hourly[23].hour, 24);
    assert.strictEqual(hourly[23].height, 2.54);
    assert.strictEqual(hourly[23].timeStr, '24:00');
  });

  test('Linear interpolation at 05:41 sits close to official HLT (0.49m) within small tolerance', () => {
    const hourly = parseHkoHhot(hhotRaw, 2026);

    // Test time: 2026-11-12 05:41 in UTC+8
    const testDate = new Date('2026-11-12T05:41:00+08:00');
    const interpolated = interpolateHkoHeight(hourly, testDate);

    assert.ok(typeof interpolated === 'number', 'Interpolation must return a numeric height');
    // Hour 05 is 0.55m, Hour 06 is 0.50m. Interpolated is ~0.516m.
    // Official HLT is 0.49m. Difference should be within 0.05m tolerance.
    const diff = Math.abs(interpolated - 0.49);
    assert.ok(diff < 0.05, `Interpolated (${interpolated}m) should be near HLT (0.49m), diff: ${diff}m`);
  });

  test('Linear interpolation returns exact boundary values at exact hour timestamps', () => {
    const hourly = parseHkoHhot(hhotRaw, 2026);
    const date06 = new Date('2026-11-12T06:00:00+08:00');
    const interpolated06 = interpolateHkoHeight(hourly, date06);
    assert.strictEqual(interpolated06, 0.50);
  });

  test('Linear interpolation returns null when target is outside range', () => {
    const hourly = parseHkoHhot(hhotRaw, 2026);
    const datePast = new Date('2026-11-11T23:00:00+08:00');
    const dateFuture = new Date('2026-11-13T01:00:00+08:00');
    assert.strictEqual(interpolateHkoHeight(hourly, datePast), null);
    assert.strictEqual(interpolateHkoHeight(hourly, dateFuture), null);
  });

  test('Lone HLT extreme without neighbours leaves type as unknown without guessing', () => {
    const singleRow = {
      fields: ['Month', 'Date', 'Time', 'Height(m)'],
      data: [['11', '12', '1200', '1.80']]
    };
    const extremes = parseHkoHlt(singleRow, 2026);
    assert.strictEqual(extremes.length, 1);
    assert.strictEqual(extremes[0].type, 'unknown');
  });
});
