import test from 'node:test';
import assert from 'node:assert/strict';

import {
  formatMinutes,
  formatDistance,
  formatMacauTime,
  evaluateCoordinate,
  haversineDistance,
  isRealisticWalkingSpeed,
  DEFAULT_ORIGIN,
  DEFAULT_DESTINATION,
  CURATED_PLACES
} from '../js/utils.js';

test('Utils: formatMinutes handles minutes display cleanly', () => {
  assert.equal(formatMinutes(0), '少於 1 分鐘');
  assert.equal(formatMinutes(1), '1 分鐘');
  assert.equal(formatMinutes(45), '45 分鐘');
  assert.equal(formatMinutes(75), '1 小時 15 分鐘');
  assert.equal(formatMinutes(120), '2 小時');
  assert.equal(formatMinutes(135), '2 小時 15 分鐘');
});

test('Utils: formatDistance formats meters and kilometers cleanly', () => {
  assert.equal(formatDistance(0), '0 米');
  assert.equal(formatDistance(350), '350 米');
  assert.equal(formatDistance(999), '999 米');
  assert.equal(formatDistance(1000), '1.0 公里');
  assert.equal(formatDistance(3330), '3.3 公里');
  assert.equal(formatDistance(12500), '12.5 公里');
});

test('Utils: evaluateCoordinate classifies Macau vs Hengqin/Zhuhai vs Overseas', () => {
  // Central Macau (Senado Square)
  const macauCore = evaluateCoordinate(22.1987, 113.5439);
  assert.equal(macauCore.isValid, true);
  assert.equal(macauCore.isMacau, true);
  assert.equal(macauCore.isZhuhaiBorder, false);

  // Border gate
  const border = evaluateCoordinate(22.215282, 113.54882);
  assert.equal(border.isValid, true);
  assert.equal(border.isMacau, true);

  // Hengqin / Zhuhai border area (lat 22.14, lon 113.53)
  const nearbyZhuhai = evaluateCoordinate(22.25, 113.53);
  assert.equal(nearbyZhuhai.isValid, true);
  assert.equal(nearbyZhuhai.isMacau, false);
  assert.equal(nearbyZhuhai.isZhuhaiBorder, true);

  // Overseas (e.g. Tokyo)
  const tokyo = evaluateCoordinate(35.6762, 139.6503);
  assert.equal(tokyo.isValid, false);
  assert.equal(tokyo.isMacau, false);
  assert.equal(tokyo.isZhuhaiBorder, false);

  // Invalid coordinates
  assert.equal(evaluateCoordinate(null, 113).isValid, false);
  assert.equal(evaluateCoordinate('abc', 'def').isValid, false);
});

test('Utils: haversineDistance computes accurate straight line distance in meters', () => {
  // 關閘 (22.215282, 113.54882) to 媽閣 (22.1849, 113.5312) is ~3.8 km
  const dist = haversineDistance(22.215282, 113.54882, 22.1849, 113.5312);
  assert.ok(dist >= 3700 && dist <= 3900, `Expected ~3800m, got ${dist}`);
});

test('Utils: isRealisticWalkingSpeed validates 1.5 - 8.5 km/h range', () => {
  assert.equal(isRealisticWalkingSpeed(4.5), true);
  assert.equal(isRealisticWalkingSpeed(1.5), true);
  assert.equal(isRealisticWalkingSpeed(8.5), true);
  assert.equal(isRealisticWalkingSpeed(1.2), false); // too slow
  assert.equal(isRealisticWalkingSpeed(36.3), false); // car speed trap!
  assert.equal(isRealisticWalkingSpeed(0), false);
  assert.equal(isRealisticWalkingSpeed(-5), false);
});

test('Utils: formatMacauTime formats timestamps in Asia/Macau timezone', () => {
  const iso = '2026-11-16T14:30:00+08:00';
  const formatted = formatMacauTime(iso);
  assert.equal(formatted, '14:30');

  const formattedDate = formatMacauTime(iso, 'date');
  assert.equal(formattedDate, '2026年11月16日');
});

test('Utils: DEFAULT_ORIGIN and DEFAULT_DESTINATION are valid Macau locations', () => {
  const origEval = evaluateCoordinate(DEFAULT_ORIGIN.lat, DEFAULT_ORIGIN.lon);
  assert.equal(origEval.isMacau, true);

  const destEval = evaluateCoordinate(DEFAULT_DESTINATION.lat, DEFAULT_DESTINATION.lon);
  assert.equal(destEval.isMacau, true);

  assert.ok(CURATED_PLACES.length >= 5);
  for (const place of CURATED_PLACES) {
    const pEval = evaluateCoordinate(place.lat, place.lon);
    assert.equal(pEval.isMacau, true, `${place.name} must be within Macau`);
  }
});
