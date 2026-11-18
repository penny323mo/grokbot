import test from 'node:test';
import assert from 'node:assert/strict';

import {
  parseRainHint,
  buildOpenMeteoRainUrl
} from '../js/weather.js';

test('Weather: buildOpenMeteoRainUrl includes minutely_15 and Asia/Macau timezone', () => {
  const url = buildOpenMeteoRainUrl(22.1938, 113.5400);
  assert.ok(url.includes('minutely_15=precipitation'));
  assert.ok(url.includes('timezone=Asia%2FMacau'));
});

test('Weather: dry weather for next 2 hours remains silent per SPEC', () => {
  const mockDry = {
    minutely_15: {
      time: [
        "2026-11-18T01:00",
        "2026-11-18T01:15",
        "2026-11-18T01:30",
        "2026-11-18T01:45",
        "2026-11-18T02:00",
        "2026-11-18T02:15",
        "2026-11-18T02:30",
        "2026-11-18T02:45"
      ],
      precipitation: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
    }
  };

  const hint = parseRainHint(mockDry);
  assert.equal(hint.available, true);
  assert.equal(hint.hasRain, false);
  assert.equal(hint.message, '');
});

test('Weather: rain currently falling generates authentic Cantonese notice', () => {
  const mockWetNow = {
    minutely_15: {
      time: ["2026-11-18T01:00", "2026-11-18T01:15"],
      precipitation: [0.8, 0.6]
    }
  };

  const hint = parseRainHint(mockWetNow);
  assert.equal(hint.available, true);
  assert.equal(hint.hasRain, true);
  assert.equal(hint.isRaining, true);
  assert.match(hint.message, /而家落緊雨/);
});

test('Weather: rain arriving soon within 2 hours includes estimated start time', () => {
  const mockRainSoon = {
    minutely_15: {
      time: [
        "2026-11-18T01:00",
        "2026-11-18T01:15",
        "2026-11-18T01:30",
        "2026-11-18T01:45"
      ],
      precipitation: [0.0, 0.0, 0.5, 0.8]
    }
  };

  const hint = parseRainHint(mockRainSoon);
  assert.equal(hint.available, true);
  assert.equal(hint.hasRain, true);
  assert.equal(hint.isRaining, false);
  assert.match(hint.message, /可能開始有雨/);
});

test('Weather: rain source is labelled as model, never official observation', () => {
  const mock = {
    minutely_15: {
      time: ["2026-11-18T01:00"],
      precipitation: [0.5]
    }
  };
  const hint = parseRainHint(mock);
  assert.match(hint.sourceName, /模式預測/);
  assert.doesNotMatch(hint.sourceName, /官方觀測/);
});
