import test from 'node:test';
import assert from 'node:assert/strict';

import {
  parseRainHint,
  buildOpenMeteoRainUrl
} from '../js/weather.js';

test('Weather: buildOpenMeteoRainUrl includes minutely_15 and Asia/Macau timezone', () => {
  const url = buildOpenMeteoRainUrl(22.1938, 113.5400);
  assert.match(url, /latitude=22\.1938/);
  assert.match(url, /longitude=113\.54/);
  assert.match(url, /minutely_15=precipitation/);
  assert.match(url, /timezone=Asia%2FMacau/);
});

test('Weather: dry weather for next 2 hours remains silent per SPEC', () => {
  const dryData = {
    minutely_15: {
      time: [
        '2026-11-17T01:00', '2026-11-17T01:15', '2026-11-17T01:30', '2026-11-17T01:45',
        '2026-11-17T02:00', '2026-11-17T02:15', '2026-11-17T02:30', '2026-11-17T02:45'
      ],
      precipitation: [0, 0, 0, 0, 0, 0, 0, 0]
    }
  };

  const hint = parseRainHint(dryData);
  assert.equal(hint.hasRain, false);
  assert.equal(hint.isRaining, false);
  assert.equal(hint.message, '');
});

test('Weather: rain currently falling generates authentic Cantonese notice', () => {
  const rainingNow = {
    minutely_15: {
      time: ['2026-11-17T01:00', '2026-11-17T01:15'],
      precipitation: [1.2, 0.8]
    }
  };

  const hint = parseRainHint(rainingNow);
  assert.equal(hint.hasRain, true);
  assert.equal(hint.isRaining, true);
  assert.equal(hint.message, '而家落緊雨，斜路梯級會濕滑');
});

test('Weather: rain arriving soon within 2 hours includes estimated start time', () => {
  const rainSoon = {
    minutely_15: {
      time: [
        '2026-11-17T01:00', '2026-11-17T01:15', '2026-11-17T01:30', '2026-11-17T01:45'
      ],
      precipitation: [0, 0, 0.8, 1.5]
    }
  };

  const hint = parseRainHint(rainSoon);
  assert.equal(hint.hasRain, true);
  assert.equal(hint.isRaining, false);
  assert.match(hint.message, /大約 01:30 可能開始有雨/);
});
