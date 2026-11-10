import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  SENADO_SQUARE,
  DEFAULT_ORIGIN,
  haversineDistance,
  calculateWalkMinutes,
  formatDistance,
  formatWalkMinutes,
  isHongKong,
  isMacau,
  getBbox,
  normalizeMacauIsoString,
  formatMacauDateTime,
  formatMacauTimeOnly
} from '../js/geo.js';

describe('Geographic utilities (geo.js)', () => {
  test('Default origin is Senado Square with exact coordinates', () => {
    assert.strictEqual(DEFAULT_ORIGIN.lat, 22.1937);
    assert.strictEqual(DEFAULT_ORIGIN.lon, 113.5406);
    assert.strictEqual(DEFAULT_ORIGIN.name, '議事亭前地');
    assert.strictEqual(DEFAULT_ORIGIN.isDefault, true);
    assert.strictEqual(SENADO_SQUARE, DEFAULT_ORIGIN);
  });

  test('Haversine distance between identical points is 0', () => {
    const dist = haversineDistance(22.1937, 113.5406, 22.1937, 113.5406);
    assert.strictEqual(dist, 0);
  });

  test('Haversine distance between Senado Square and Ruins of St. Pauls', () => {
    // Senado (22.1937, 113.5406) to Ruins of St. Pauls (22.1977, 113.5409)
    const dist = haversineDistance(22.1937, 113.5406, 22.1977, 113.5409);
    // Known straight-line distance is ~446 meters
    assert.ok(dist >= 440 && dist <= 455, `Expected ~446m, got ${dist}`);
    
    const minutes = calculateWalkMinutes(dist);
    // 446 / 80 = 5.57 -> rounds to 6 minutes
    assert.strictEqual(minutes, 6);
  });

  test('Haversine distance between Senado Square and Macau Tower', () => {
    // Macau Tower: 22.1798, 113.5367
    const dist = haversineDistance(22.1937, 113.5406, 22.1798, 113.5367);
    // Distance is ~1600 meters
    assert.ok(dist >= 1550 && dist <= 1650, `Expected ~1600m, got ${dist}`);
    const minutes = calculateWalkMinutes(dist);
    assert.strictEqual(minutes, 20);
  });

  test('calculateWalkMinutes edge cases', () => {
    assert.strictEqual(calculateWalkMinutes(0), 0);
    assert.strictEqual(calculateWalkMinutes(-10), 0);
    // Very close places (< 40m) still round to minimum 1 minute
    assert.strictEqual(calculateWalkMinutes(20), 1);
    // 80 meters at 4.8 km/h is exactly 1 minute
    assert.strictEqual(calculateWalkMinutes(80), 1);
    // 160 meters is 2 minutes
    assert.strictEqual(calculateWalkMinutes(160), 2);
  });

  test('formatDistance formatting in natural Cantonese', () => {
    assert.strictEqual(formatDistance(0), '0 米');
    assert.strictEqual(formatDistance(120), '120 米');
    assert.strictEqual(formatDistance(999), '999 米');
    assert.strictEqual(formatDistance(1000), '1.0 公里');
    assert.strictEqual(formatDistance(1450), '1.5 公里');
    assert.strictEqual(formatDistance(2300), '2.3 公里');
  });

  test('formatWalkMinutes formatting', () => {
    assert.strictEqual(formatWalkMinutes(0), '約 1 分鐘內');
    assert.strictEqual(formatWalkMinutes(1), '約 1 分鐘');
    assert.strictEqual(formatWalkMinutes(5), '約 5 分鐘');
  });

  test('Territory detection for Macau and Hong Kong', () => {
    // Macau: Senado Square
    assert.strictEqual(isMacau(22.1937, 113.5406), true);
    assert.strictEqual(isHongKong(22.1937, 113.5406), false);

    // Macau: Coloane Village (22.118, 113.551)
    assert.strictEqual(isMacau(22.118, 113.551), true);
    assert.strictEqual(isHongKong(22.118, 113.551), false);

    // Hong Kong: Central (22.282, 114.158)
    assert.strictEqual(isHongKong(22.282, 114.158), true);
    assert.strictEqual(isMacau(22.282, 114.158), false);

    // Hong Kong: Mong Kok (22.319, 114.169)
    assert.strictEqual(isHongKong(22.319, 114.169), true);
    assert.strictEqual(isMacau(22.319, 114.169), false);

    // London (51.5, -0.1)
    assert.strictEqual(isMacau(51.5, -0.1), false);
    assert.strictEqual(isHongKong(51.5, -0.1), false);
  });

  test('getBbox creates proper bounding box', () => {
    const bbox = getBbox(22.1937, 113.5406, 1.5);
    assert.ok(bbox.south < 22.1937);
    assert.ok(bbox.north > 22.1937);
    assert.ok(bbox.west < 113.5406);
    assert.ok(bbox.east > 113.5406);
  });

  test('formatMacauDateTime converts UTC ISO timestamp to Asia/Macau time', () => {
    // 2026-11-10T09:08:00Z + 8 hours = 2026-11-10 17:08 澳門時間
    const formatted = formatMacauDateTime('2026-11-10T09:08:00Z');
    assert.strictEqual(formatted, '2026-11-10 17:08 澳門時間');
    assert.strictEqual(formatMacauTimeOnly('2026-11-10T09:08:00Z'), '17:08');
  });

  test('normalizeMacauIsoString and formatMacauTimeOnly handle zone-less Open-Meteo timestamps', () => {
    // Open-Meteo returns '2026-11-11T01:45' with no zone offset
    assert.strictEqual(normalizeMacauIsoString('2026-11-11T01:45'), '2026-11-11T01:45+08:00');
    assert.strictEqual(formatMacauTimeOnly('2026-11-11T01:45'), '01:45');
    assert.strictEqual(formatMacauDateTime('2026-11-11T01:45'), '2026-11-11 01:45 澳門時間');
  });
});
