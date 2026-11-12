/**
 * tests/openmeteo.test.js
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseOpenMeteoWeather } from '../js/parser-openmeteo.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const snapshotWeatherPath = path.resolve(__dirname, '../data/snapshot-macau-weather.json');

test('Parses 2026-11-13 recorded Macau weather fixture accurately', () => {
  const raw = JSON.parse(fs.readFileSync(snapshotWeatherPath, 'utf8'));
  const parsed = parseOpenMeteoWeather(raw);

  assert.ok(parsed);
  assert.equal(parsed.timezone, 'Asia/Macau');

  // Current readings
  assert.ok(parsed.current);
  assert.equal(parsed.current.temperature, 23.0);
  assert.equal(parsed.current.apparentTemperature, 25.4);
  assert.equal(parsed.current.weatherCode, 3);
  assert.equal(parsed.current.condition.label, '密雲');
  assert.equal(parsed.current.uvIndex, 0.0);
  assert.equal(parsed.current.humidity, 81);
  assert.equal(parsed.current.windSpeed, 8.5);
  assert.equal(parsed.current.windDirection, 73);
  assert.equal(parsed.current.isDay, 0);

  // Hourly readings
  assert.ok(Array.isArray(parsed.hourly));
  assert.equal(parsed.hourly.length, 168); // 7 days * 24 hours
  assert.equal(parsed.hourly[0].time, '2026-11-13T00:00');
  assert.equal(parsed.hourly[0].temperature, 23.6);
  assert.equal(parsed.hourly[1].time, '2026-11-13T01:00');
  assert.equal(parsed.hourly[1].temperature, 23.0);

  // Daily readings
  assert.ok(Array.isArray(parsed.daily));
  assert.equal(parsed.daily.length, 7);
  const day0 = parsed.daily[0];
  assert.equal(day0.date, '2026-11-13');
  assert.equal(day0.tempMax, 26.5);
  assert.equal(day0.tempMin, 22.7);
  assert.equal(day0.precipSum, 10.6);
  assert.equal(day0.precipitationProbabilityMax, 98);
  assert.equal(day0.sunrise, '2026-11-13T06:36');
  assert.equal(day0.sunset, '2026-11-13T17:43');
});

test('Missing fields in Open-Meteo do NOT become 0 (strict null preservation)', () => {
  const incompletePayload = {
    current: {
      time: '2026-11-13T12:00',
      temperature_2m: 25.5
      // apparent_temperature, uv_index, precipitation, humidity are omitted
    },
    hourly: {
      time: ['2026-11-13T12:00'],
      temperature_2m: [25.5]
      // apparent_temperature, precipitation, uv_index are omitted
    },
    daily: {
      time: ['2026-11-13'],
      temperature_2m_max: [28.0]
      // tempMin, precipSum, etc. omitted
    }
  };

  const parsed = parseOpenMeteoWeather(incompletePayload);
  assert.ok(parsed);
  assert.equal(parsed.current.temperature, 25.5);
  assert.equal(parsed.current.apparentTemperature, null);
  assert.notEqual(parsed.current.apparentTemperature, 0);
  assert.equal(parsed.current.uvIndex, null);
  assert.notEqual(parsed.current.uvIndex, 0);
  assert.equal(parsed.current.precipitation, null);
  assert.equal(parsed.current.humidity, null);

  assert.equal(parsed.hourly[0].apparentTemperature, null);
  assert.notEqual(parsed.hourly[0].apparentTemperature, 0);

  assert.equal(parsed.daily[0].tempMin, null);
  assert.notEqual(parsed.daily[0].tempMin, 0);
  assert.equal(parsed.daily[0].precipSum, null);
  assert.notEqual(parsed.daily[0].precipSum, 0);
});

test('Missing daily or hourly block does not crash and does not invent fake data', () => {
  const minimalPayload = {
    current: {
      time: '2026-11-13T12:00',
      temperature_2m: 22.0
    }
  };

  const parsed = parseOpenMeteoWeather(minimalPayload);
  assert.ok(parsed);
  assert.equal(parsed.current.temperature, 22.0);
  assert.deepEqual(parsed.hourly, []);
  assert.deepEqual(parsed.daily, []);
});
