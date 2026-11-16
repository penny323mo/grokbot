import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  parseRainHint,
  buildOpenMeteoRainUrl
} from '../js/weather.js';

test('Weather: buildOpenMeteoRainUrl sets Macau coordinates and minutely_15 precipitation', () => {
  const url = buildOpenMeteoRainUrl(22.1987, 113.5439);
  assert.match(url, /latitude=22\.1987/);
  assert.match(url, /longitude=113\.5439/);
  assert.match(url, /minutely_15=precipitation/);
  assert.match(url, /timezone=Asia%2FMacau/);
});

test('Weather: parse real Open-Meteo fixture (dry weather remains silent)', () => {
  const fixturePath = path.resolve('data/fixtures/openmeteo-sample.json');
  const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

  const hint = parseRainHint(fixture);
  assert.equal(hint.hasRain, false);
  assert.equal(hint.isRaining, false);
  assert.equal(hint.message, '');
});

test('Weather: detects currently raining and generates authentic Cantonese hint', () => {
  const rainingNowFixture = {
    minutely_15: {
      time: ['2026-11-16T15:00', '2026-11-16T15:15', '2026-11-16T15:30'],
      precipitation: [1.2, 0.8, 0.4]
    }
  };

  const hint = parseRainHint(rainingNowFixture);
  assert.equal(hint.hasRain, true);
  assert.equal(hint.isRaining, true);
  assert.equal(hint.message, '而家落緊雨，行路會濕');
});

test('Weather: detects rain arriving within next 2 hours with estimated time', () => {
  const rainSoonFixture = {
    minutely_15: {
      time: ['2026-11-16T15:00', '2026-11-16T15:15', '2026-11-16T15:30', '2026-11-16T15:45'],
      precipitation: [0, 0, 1.5, 0.6]
    }
  };

  const hint = parseRainHint(rainSoonFixture);
  assert.equal(hint.hasRain, true);
  assert.equal(hint.isRaining, false);
  assert.equal(hint.message, '大約 15:30 可能開始有雨');
});
