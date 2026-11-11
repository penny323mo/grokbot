import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  haversineDistance,
  isMacau,
  isHongKong,
  findNearestStation,
  degreesToCompassCantonese,
  formatMacauDateTime,
  formatMacauTimeOnly,
  getMacauCivilDate,
  getMacauCivilDateAddDays,
  getMacauMidnightTimestamp
} from '../js/geo.js';
import { DEFAULT_STATION } from '../js/stations.js';

describe('Geographic utilities (geo.js)', () => {
  test('Default station is Macau Inner Harbour (澳門內港)', () => {
    assert.strictEqual(DEFAULT_STATION.name, '澳門內港');
    assert.strictEqual(DEFAULT_STATION.lat, 22.1937);
    assert.strictEqual(DEFAULT_STATION.lon, 113.5310);
  });

  test('Haversine distance between identical points is 0', () => {
    const d = haversineDistance(22.1937, 113.5310, 22.1937, 113.5310);
    assert.strictEqual(d, 0);
  });

  test('Territory detection for Macau and Hong Kong', () => {
    // Senado Square / Inner Harbour (Macau)
    assert.strictEqual(isMacau(22.1937, 113.5310), true);
    assert.strictEqual(isHongKong(22.1937, 113.5310), false);

    // Tai O (Hong Kong)
    assert.strictEqual(isHongKong(22.2547, 113.8635), true);
    assert.strictEqual(isMacau(22.2547, 113.8635), false);
  });

  test('Nearest-station picker selects Macau station when in central Macau', () => {
    // Near Ruins of St. Paul's (22.1977, 113.5408)
    const nearest = findNearestStation(22.1977, 113.5408);
    assert.ok(
      nearest.station.id === 'macau-inner-harbour' || nearest.station.id === 'macau-a-ma',
      `Expected Inner Harbour or Barra, got: ${nearest.station.name}`
    );
    assert.strictEqual(nearest.station.territory, 'macau');
  });

  test('Nearest-station picker selects Tai O (TAO) when on western Lantau', () => {
    // Near Tai O promenade (22.253, 113.860)
    const nearest = findNearestStation(22.253, 113.860);
    assert.strictEqual(nearest.station.code, 'TAO');
    assert.strictEqual(nearest.station.name, '大澳');
    assert.strictEqual(nearest.station.territory, 'hongkong');
  });

  test('Converts wind/wave direction degrees to natural Cantonese compass points', () => {
    assert.strictEqual(degreesToCompassCantonese(0), '北');
    assert.strictEqual(degreesToCompassCantonese(90), '東');
    assert.strictEqual(degreesToCompassCantonese(135), '東南');
    assert.strictEqual(degreesToCompassCantonese(180), '南');
    assert.strictEqual(degreesToCompassCantonese(270), '西');
  });

  test('Formats time strictly in Asia/Macau timezone, NOT UTC', () => {
    // 2026-11-12 00:00:00 UTC = 2026-11-12 08:00:00 in Asia/Macau
    const utcDate = new Date('2026-11-12T00:00:00Z');
    const timeFormatted = formatMacauTimeOnly(utcDate);
    assert.strictEqual(timeFormatted, '08:00');

    const dtFormatted = formatMacauDateTime(utcDate);
    assert.strictEqual(dtFormatted, '2026-11-12 08:00');
  });

  test('getMacauCivilDate, getMacauCivilDateAddDays, and getMacauMidnightTimestamp handle year boundaries', () => {
    // 2026-12-31 23:30 Asia/Macau is 2026-12-31 15:30 UTC
    const newYearsEve = new Date('2026-12-31T15:30:00Z');
    const civil = getMacauCivilDate(newYearsEve);
    assert.strictEqual(civil.year, 2026);
    assert.strictEqual(civil.month, 12);
    assert.strictEqual(civil.day, 31);
    assert.strictEqual(civil.hour, 23);
    assert.strictEqual(civil.minute, 30);
    assert.strictEqual(civil.dateStr, '2026-12-31');

    // Tomorrow is 2027-01-01
    const tomorrow = getMacauCivilDateAddDays(civil, 1);
    assert.strictEqual(tomorrow.year, 2027);
    assert.strictEqual(tomorrow.month, 1);
    assert.strictEqual(tomorrow.day, 1);
    assert.strictEqual(tomorrow.dateStr, '2027-01-01');

    // Midnight timestamp is 2026-12-30T16:00:00Z (which is 2026-12-31 00:00:00 +08:00)
    const midnightMs = getMacauMidnightTimestamp(newYearsEve);
    const midnightDate = new Date(midnightMs);
    assert.strictEqual(midnightDate.toISOString(), '2026-12-30T16:00:00.000Z');
    assert.strictEqual(getMacauCivilDate(midnightDate).hour, 0);
    assert.strictEqual(getMacauCivilDate(midnightDate).minute, 0);
  });
});
