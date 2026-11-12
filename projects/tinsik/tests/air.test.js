/**
 * tests/air.test.js
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseOpenMeteoAir, getCantoneseAqiCategory } from '../js/parser-openmeteo.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const snapshotAirPath = path.resolve(__dirname, '../data/snapshot-macau-air.json');

test('Parses recorded Macau air quality fixture accurately', () => {
  const raw = JSON.parse(fs.readFileSync(snapshotAirPath, 'utf8'));
  const parsed = parseOpenMeteoAir(raw);

  assert.ok(parsed);
  assert.equal(parsed.pm2_5, 22.1);
  assert.equal(parsed.usAqi, 70);
  assert.equal(parsed.europeanAqi, 44);
  assert.equal(parsed.category, '普通');
});

test('Missing or null air payload returns null, never fake 0', () => {
  assert.equal(parseOpenMeteoAir(null), null);
  assert.equal(parseOpenMeteoAir({}), null);
  assert.equal(parseOpenMeteoAir({ current: {} }), null);
  assert.equal(parseOpenMeteoAir({ current: { pm2_5: null, us_aqi: null } }), null);
});

test('AQI categories map to natural Cantonese health terms', () => {
  assert.equal(getCantoneseAqiCategory(30), '良好');
  assert.equal(getCantoneseAqiCategory(70), '普通');
  assert.equal(getCantoneseAqiCategory(120), '敏感人士警惕');
  assert.equal(getCantoneseAqiCategory(180), '唔健康');
  assert.equal(getCantoneseAqiCategory(250), '極唔健康');
  assert.equal(getCantoneseAqiCategory(350), '嚴重危害');
});
