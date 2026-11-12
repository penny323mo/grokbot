/**
 * tests/places-geo.test.js
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { PLACES, DEFAULT_PLACE } from '../js/places.js';
import {
  haversineDistance,
  findNearestPlace,
  degreesToCompassCantonese,
  formatMacauTimeOnly,
  formatMacauDateTime,
  getMacauCivilDate,
  getWeekdayCantonese
} from '../js/geo.js';

test('Default place is 澳門半島 (22.1987, 113.5439)', () => {
  assert.equal(DEFAULT_PLACE.name, '澳門半島');
  assert.equal(DEFAULT_PLACE.lat, 22.1987);
  assert.equal(DEFAULT_PLACE.lon, 113.5439);
  assert.equal(DEFAULT_PLACE.default, true);
});

test('findNearestPlace returns 澳門半島 when coordinates are missing', () => {
  assert.equal(findNearestPlace(null, null).id, 'macau-peninsula');
  assert.equal(findNearestPlace(undefined, undefined).id, 'macau-peninsula');
  assert.equal(findNearestPlace(NaN, NaN).id, 'macau-peninsula');
});

test('Nearest-place picker matches geographic points accurately', () => {
  // Central Macau point near Senado Square (22.1935, 113.5398) -> 澳門半島
  const macauPeninsula = findNearestPlace(22.1935, 113.5398);
  assert.equal(macauPeninsula.id, 'macau-peninsula');
  assert.equal(macauPeninsula.name, '澳門半島');

  // Taipa point near Taipa Village (22.1538, 113.5576) -> 氹仔
  const taipa = findNearestPlace(22.1538, 113.5576);
  assert.equal(taipa.id, 'macau-taipa');
  assert.equal(taipa.name, '氹仔');

  // Coloane point near Hac Sa Beach (22.1220, 113.5700) -> 路環
  const coloane = findNearestPlace(22.1220, 113.5700);
  assert.equal(coloane.id, 'macau-coloane');
  assert.equal(coloane.name, '路環');

  // Tsim Sha Tsui point near HK Observatory (22.3000, 114.1730) -> 香港天文台
  const hk = findNearestPlace(22.3000, 114.1730);
  assert.equal(hk.id, 'hk-hko');
  assert.equal(hk.name, '香港天文台');
});

test('degreesToCompassCantonese maps 360-degree bearings to 16-point Cantonese compass', () => {
  assert.equal(degreesToCompassCantonese(0), '北');
  assert.equal(degreesToCompassCantonese(22.5), '東北偏北');
  assert.equal(degreesToCompassCantonese(45), '東北');
  assert.equal(degreesToCompassCantonese(73), '東北偏東'); // 73° is in 56.25°–78.75° (東北偏東)
  assert.equal(degreesToCompassCantonese(90), '東');
  assert.equal(degreesToCompassCantonese(180), '南');
  assert.equal(degreesToCompassCantonese(225), '西南');
  assert.equal(degreesToCompassCantonese(270), '西');
  assert.equal(degreesToCompassCantonese(360), '北');
  assert.equal(degreesToCompassCantonese(null), '');
});

test('Time display in Asia/Macau formats correctly regardless of UTC shift', () => {
  // ISO string with offset
  const timeStr = '2026-11-13T01:45:00+08:00';
  assert.equal(formatMacauTimeOnly(timeStr), '01:45');
  assert.equal(getMacauCivilDate(timeStr), '2026-11-13');

  // ISO string returned by Open-Meteo without offset should be treated as Asia/Macau
  const openMeteoTime = '2026-11-13T04:00';
  assert.equal(formatMacauTimeOnly(openMeteoTime), '04:00');
  assert.equal(getMacauCivilDate(openMeteoTime), '2026-11-13');
  assert.equal(formatMacauDateTime(openMeteoTime), '2026-11-13 04:00');

  // Check weekday in Asia/Macau
  const weekday = getWeekdayCantonese('2026-11-13T01:00:00+08:00');
  assert.equal(weekday, '星期五');
});
