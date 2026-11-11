import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseOpenMeteoMarine, parseOpenMeteoWeather, normalizeOpenMeteoIsoString } from '../js/openmeteo.js';
import { DATUM } from '../js/stations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('Open-Meteo Marine & Weather Parser (openmeteo.js)', () => {
  const fixture = JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'snapshot-macau.json'), 'utf8'));

  test('Parses real 2026-11-12 Macau marine fixture with correct sea level (MSL) and marine fields', () => {
    const parsed = parseOpenMeteoMarine(fixture.marine);

    assert.ok(parsed, 'Marine payload must be parsed');
    assert.strictEqual(parsed.datum, DATUM.MEAN_SEA_LEVEL);
    assert.strictEqual(parsed.datumLabel, '平均海平面（MSL）');

    // Current condition
    assert.ok(parsed.current, 'Current conditions must exist');
    assert.strictEqual(parsed.current.height, 1.25);
    assert.strictEqual(parsed.current.seaSurfaceTemperature, 24.5);
    assert.strictEqual(parsed.current.waveHeight, 0.32);
    assert.strictEqual(parsed.current.wavePeriod, 3.9); // 3.85 rounded to 1 decimal = 3.9
    assert.strictEqual(parsed.current.waveDirection, 115);

    // Hourly series
    assert.ok(parsed.hourly.length >= 72, 'Must contain 3 days of hourly points');
    assert.strictEqual(parsed.hourly[0].height, 1.77);
    assert.strictEqual(parsed.hourly[0].datum, DATUM.MEAN_SEA_LEVEL);
  });

  test('Missing sea_level_height_msl field returns null and NEVER invents a default height', () => {
    const incompleteMarine = {
      current: {
        time: '2026-11-12T01:15',
        sea_surface_temperature: 24.5
        // sea_level_height_msl is deliberately missing
      },
      hourly: {
        time: ['2026-11-12T00:00'],
        sea_level_height_msl: [null]
      }
    };

    const parsed = parseOpenMeteoMarine(incompleteMarine);
    assert.strictEqual(parsed.current.height, null, 'Must NOT invent a height if field is missing');
    assert.strictEqual(parsed.hourly.length, 0, 'Null hourly points must be omitted');
  });

  test('Parses real 2026-11-12 Macau weather fixture (wind, temp, sunrise, sunset)', () => {
    const parsed = parseOpenMeteoWeather(fixture.weather);

    assert.ok(parsed.current, 'Current weather must exist');
    assert.strictEqual(parsed.current.temperature, 19.5);
    assert.strictEqual(parsed.current.windSpeed, 5.2);
    assert.strictEqual(parsed.current.windDirection, 34);
    assert.strictEqual(parsed.current.windGusts, 9.7);
    assert.strictEqual(parsed.current.weatherCode, 3);

    // Daily sunrise & sunset
    assert.ok(parsed.daily.sunrise instanceof Date);
    assert.ok(parsed.daily.sunset instanceof Date);
  });

  test('normalizeOpenMeteoIsoString appends Asia/Macau UTC+8 offset to bare timestamps', () => {
    const normalized = normalizeOpenMeteoIsoString('2026-11-12T01:30');
    assert.strictEqual(normalized, '2026-11-12T01:30:00+08:00');

    // Does not touch timestamps that already contain offset or Z
    const alreadyUtc = normalizeOpenMeteoIsoString('2026-11-12T01:30:00Z');
    assert.strictEqual(alreadyUtc, '2026-11-12T01:30:00Z');
  });
});
