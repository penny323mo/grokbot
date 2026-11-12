/**
 * tests/rain-ribbon.test.js
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateRainRibbon, getPrecipitationLevel } from '../js/rain-ribbon.js';

test('getPrecipitationLevel categorizes mm correctly', () => {
  assert.equal(getPrecipitationLevel(0), 'none');
  assert.equal(getPrecipitationLevel(0.04), 'none');
  assert.equal(getPrecipitationLevel(0.2), 'light');
  assert.equal(getPrecipitationLevel(1.5), 'moderate');
  assert.equal(getPrecipitationLevel(4.5), 'heavy');
  assert.equal(getPrecipitationLevel(null), 'none');
});

test('Dry minutely_15 series generates dry Cantonese sentence', () => {
  const dryData = {
    time: [
      '2026-11-13T01:45',
      '2026-11-13T02:00',
      '2026-11-13T02:15',
      '2026-11-13T02:30',
      '2026-11-13T02:45',
      '2026-11-13T03:00',
      '2026-11-13T03:15',
      '2026-11-13T03:30'
    ],
    precipitation: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
  };

  const res = evaluateRainRibbon(dryData, '2026-11-13T01:45');
  assert.equal(res.available, true);
  assert.equal(res.hasRain, false);
  assert.equal(res.sentence, '未來兩小時都唔會落雨');
  assert.equal(res.intervals.length, 8);
  assert.ok(res.intervals.every(i => i.level === 'none'));
});

test('Series that turns wet at a known timestamp explicitly states that start time', () => {
  const wetLaterData = {
    time: [
      '2026-11-13T01:45',
      '2026-11-13T02:00',
      '2026-11-13T02:15',
      '2026-11-13T02:30',
      '2026-11-13T02:45',
      '2026-11-13T03:00',
      '2026-11-13T03:15',
      '2026-11-13T03:30'
    ],
    precipitation: [0.0, 0.0, 0.5, 1.2, 0.8, 0.1, 0.0, 0.0]
  };

  const res = evaluateRainRibbon(wetLaterData, '2026-11-13T01:45');
  assert.equal(res.available, true);
  assert.equal(res.hasRain, true);
  assert.ok(res.sentence.includes('02:15'));
  assert.equal(res.sentence, '大約 02:15 開始會有雨');
  assert.equal(res.intervals[2].timeLabel, '02:15');
  assert.equal(res.intervals[2].level, 'light');
  assert.equal(res.intervals[3].level, 'moderate');
});

test('Missing or empty minutely_15 does not invent rain or fake readings', () => {
  const emptyRes = evaluateRainRibbon(null);
  assert.equal(emptyRes.available, false);
  assert.equal(emptyRes.sentence, '');
  assert.equal(emptyRes.intervals.length, 0);

  const missingTimes = evaluateRainRibbon({ precipitation: [] });
  assert.equal(missingTimes.available, false);
  assert.equal(missingTimes.sentence, '');

  const allNullPrecips = evaluateRainRibbon({
    time: ['2026-11-13T01:45', '2026-11-13T02:00'],
    precipitation: [null, null]
  });
  assert.equal(allNullPrecips.available, false);
  assert.equal(allNullPrecips.sentence, '');
  assert.equal(allNullPrecips.intervals.length, 0);
});
