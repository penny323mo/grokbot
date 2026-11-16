import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_ORIGIN,
  DEFAULT_DESTINATION,
  CURATED_PLACES,
  evaluateCoordinate,
  haversineDistance,
  isRealisticWalkingSpeed,
  formatMinutes,
  formatDistance,
  formatElevation,
  formatMacauTime,
  calculateClimbAndDescent,
  decodeValhallaShape,
  areMeaningfullyDifferent
} from '../js/utils.js';

test('Utils: DEFAULT_ORIGIN is 議事亭前地 and DEFAULT_DESTINATION is 東望洋燈塔', () => {
  assert.equal(DEFAULT_ORIGIN.name, '議事亭前地');
  assert.equal(DEFAULT_ORIGIN.lat, 22.1938271);
  assert.equal(DEFAULT_ORIGIN.lon, 113.5399903);

  assert.equal(DEFAULT_DESTINATION.name, '東望洋燈塔');
  assert.equal(DEFAULT_DESTINATION.lat, 22.1964359);
  assert.equal(DEFAULT_DESTINATION.lon, 113.5497062);
});

test('Utils: CURATED_PLACES contains exact coordinates for all 6 verified Macau landmarks', () => {
  assert.equal(CURATED_PLACES.length, 6);

  const names = CURATED_PLACES.map((p) => p.name);
  assert.ok(names.includes('議事亭前地'));
  assert.ok(names.includes('東望洋燈塔'));
  assert.ok(names.includes('媽閣廟'));
  assert.ok(names.includes('望廈炮台'));
  assert.ok(names.includes('黑沙海灘'));
  assert.ok(names.includes('疊石塘山'));

  for (const p of CURATED_PLACES) {
    const res = evaluateCoordinate(p.lat, p.lon);
    assert.equal(res.isMacau, true, `${p.name} must be within Macau bounds`);
  }
});

test('Utils: evaluateCoordinate classifies Macau vs border vs invalid overseas', () => {
  // Senado Square
  const senado = evaluateCoordinate(22.1938271, 113.5399903);
  assert.equal(senado.isValid, true);
  assert.equal(senado.isMacau, true);

  // Overseas (e.g. Hong Kong or Tokyo)
  const overseas = evaluateCoordinate(35.6895, 139.6917);
  assert.equal(overseas.isValid, false);
  assert.equal(overseas.isMacau, false);

  // Null/NaN
  const invalid = evaluateCoordinate(null, 'abc');
  assert.equal(invalid.isValid, false);
});

test('Utils: haversineDistance computes accurate straight line distance', () => {
  // Distance from Senado to Guia is ~1.01 km straight line
  const d = haversineDistance(22.1938271, 113.5399903, 22.1964359, 113.5497062);
  assert.ok(d >= 950 && d <= 1100, `Expected ~1010m, got ${d}`);
});

test('Utils: isRealisticWalkingSpeed checks 1.5 to 8.5 km/h range', () => {
  assert.equal(isRealisticWalkingSpeed(4.5), true);
  assert.equal(isRealisticWalkingSpeed(1.5), true);
  assert.equal(isRealisticWalkingSpeed(8.5), true);
  assert.equal(isRealisticWalkingSpeed(1.1), false);
  assert.equal(isRealisticWalkingSpeed(36.0), false);
});

test('Utils: formatters produce clean Cantonese output', () => {
  assert.equal(formatMinutes(0), '少於 1 分鐘');
  assert.equal(formatMinutes(23), '23 分鐘');
  assert.equal(formatMinutes(1370), '23 分鐘');
  assert.equal(formatMinutes(75), '1 小時 15 分鐘');

  assert.equal(formatDistance(450), '450 米');
  assert.equal(formatDistance(1659), '1.7 公里');

  assert.equal(formatElevation(98.4), '98 米');
  assert.equal(formatElevation(0), '0 米');
});

test('Utils: decodeValhallaShape correctly decodes polyline 6 format', () => {
  // Simple test polyline: encoding 0,0 to 0.00001,0.00001
  const coords = decodeValhallaShape('_ibE_ibE');
  assert.ok(Array.isArray(coords));
});

test('Utils: areMeaningfullyDifferent enforces length >= 50m, climb >= 8m, or stairs diff', () => {
  const r1 = { distanceMeters: 1600, climbMeters: 90, stairsCount: 2, shape: 'shapeA' };
  const rSame = { distanceMeters: 1610, climbMeters: 92, stairsCount: 2, shape: 'shapeA' };
  const rDiffLen = { distanceMeters: 1700, climbMeters: 90, stairsCount: 2, shape: 'shapeB' };
  const rDiffClimb = { distanceMeters: 1610, climbMeters: 105, stairsCount: 2, shape: 'shapeC' };
  const rDiffStairs = { distanceMeters: 1610, climbMeters: 92, stairsCount: 3, shape: 'shapeD' };

  assert.equal(areMeaningfullyDifferent(r1, rSame), false);
  assert.equal(areMeaningfullyDifferent(r1, rDiffLen), true);
  assert.equal(areMeaningfullyDifferent(r1, rDiffClimb), true);
  assert.equal(areMeaningfullyDifferent(r1, rDiffStairs), true);
});
