/**
 * tests/hko.test.js
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHkoWarnings, parseHkoObservations } from '../js/parser-hko.js';
import { PLACES } from '../js/places.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const warnsumEmptyPath = path.resolve(__dirname, '../data/snapshot-hko-warnsum.json');
const warnsumActivePath = path.resolve(__dirname, '../data/snapshot-hko-warnsum-active.json');
const warninfoActivePath = path.resolve(__dirname, '../data/snapshot-hko-warninfo-active.json');
const rhrreadPath = path.resolve(__dirname, '../data/snapshot-hko-rhrread.json');

test('HKO warnsum empty fixture produces empty array (no fake warnings)', () => {
  const emptyJson = JSON.parse(fs.readFileSync(warnsumEmptyPath, 'utf8'));
  const res = parseHkoWarnings(emptyJson);
  assert.equal(Array.isArray(res), true);
  assert.equal(res.length, 0);
});

test('HKO active warning fixture correctly extracts official name and statement without hallucination', () => {
  const activeWarnsum = JSON.parse(fs.readFileSync(warnsumActivePath, 'utf8'));
  const activeWarninfo = JSON.parse(fs.readFileSync(warninfoActivePath, 'utf8'));

  const res = parseHkoWarnings(activeWarnsum, activeWarninfo);
  assert.equal(res.length, 1);
  assert.equal(res[0].name, '黃色火災危險警告');
  assert.equal(res[0].code, 'WFIREY');
  assert.ok(res[0].statement.includes('黃色火災危險警告'));
});

test('HKO rhrread parses official observation for Hong Kong place', () => {
  const rhrread = JSON.parse(fs.readFileSync(rhrreadPath, 'utf8'));
  const hkPlace = PLACES.find(p => p.id === 'hk-hko');

  const parsed = parseHkoObservations(rhrread, hkPlace);
  assert.ok(parsed);
  assert.equal(parsed.source, '香港天文台');
  assert.equal(parsed.stationName, '香港天文台');
  assert.equal(parsed.temperature, 24);
  assert.equal(parsed.humidity, 76);
});

test('Official HKO rhrread observations strictly throw and reject Macau places', () => {
  const rhrread = JSON.parse(fs.readFileSync(rhrreadPath, 'utf8'));
  const macauPeninsula = PLACES.find(p => p.id === 'macau-peninsula');
  const macauTaipa = PLACES.find(p => p.id === 'macau-taipa');

  assert.throws(() => {
    parseHkoObservations(rhrread, macauPeninsula);
  }, /Macau/);

  assert.throws(() => {
    parseHkoObservations(rhrread, macauTaipa);
  }, /Macau/);
});
