import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  parseOsrmFootResponse,
  parseValhallaResponse,
  fetchWalkingRoute,
  buildOsrmFootUrl
} from '../js/router.js';

test('Router: buildOsrmFootUrl formats coordinates lon,lat correctly', () => {
  const url = buildOsrmFootUrl({ lat: 22.1987, lon: 113.5439 }, { lat: 22.215282, lon: 113.54882 });
  assert.match(url, /routing\.openstreetmap\.de\/routed-foot\/route\/v1\/foot\/113\.5439,22\.1987;113\.54882,22\.215282/);
  assert.match(url, /overview=full/);
  assert.match(url, /geometries=geojson/);
});

test('Router: parse OSRM foot response fixture, compute speed, assert realistic', () => {
  const fixturePath = path.resolve('data/fixtures/osrm-foot-ok.json');
  const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

  const parsed = parseOsrmFootResponse(fixture);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.provider, 'osrm');
  assert.equal(parsed.distanceMeters, 3330); // 3329.9 rounded
  assert.equal(parsed.durationMinutes, 45); // 2671.6s -> 44.52 -> 45 min

  // Speed should be ~4.49 km/h, well within 1.5 - 8.5 km/h
  assert.ok(parsed.speedKmh >= 1.5 && parsed.speedKmh <= 8.5, `Speed ${parsed.speedKmh} must be between 1.5 and 8.5 km/h`);
  assert.ok(parsed.geometry && parsed.geometry.type === 'LineString');
  assert.ok(parsed.geometry.coordinates.length >= 2);
  assert.ok(typeof parsed.fetchedAt === 'number' && parsed.fetchedAt > 0);
});

test('Router: parse OSRM car-speed fixture, assert rejection due to excessive speed', () => {
  const fixturePath = path.resolve('data/fixtures/osrm-foot-car-speed.json');
  const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

  const parsed = parseOsrmFootResponse(fixture);
  assert.equal(parsed.ok, false);
  assert.equal(parsed.reason, 'unrealistic_speed');
  assert.match(parsed.message, /步行路徑時速不合理/);
  assert.ok(parsed.speedKmh > 8.5, `Rejected speed ${parsed.speedKmh} km/h`);
});

test('Router: parse Valhalla foot fixture, assert realistic pedestrian result', () => {
  const fixturePath = path.resolve('data/fixtures/valhalla-foot-ok.json');
  const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

  const parsed = parseValhallaResponse(fixture);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.provider, 'valhalla');
  assert.equal(parsed.distanceMeters, 3486);
  assert.equal(parsed.durationMinutes, 46);
  assert.ok(parsed.speedKmh >= 1.5 && parsed.speedKmh <= 8.5);
  assert.ok(parsed.geometry && parsed.geometry.coordinates.length >= 2);
});

test('Router: if both OSRM and Valhalla fail, assert graceful message without fake numbers', async () => {
  // Mock fetch that always rejects
  const mockFailingFetch = async () => {
    throw new Error('Network timeout');
  };

  const origin = { lat: 22.1987, lon: 113.5439 };
  const dest = { lat: 22.215282, lon: 113.54882 };

  const result = await fetchWalkingRoute(origin, dest, mockFailingFetch);

  assert.equal(result.ok, false);
  assert.equal(result.message, '暫時未能計算步行路線');
  // Must NOT have durationMinutes or distanceMeters or fake speed
  assert.equal(result.durationMinutes, undefined);
  assert.equal(result.distanceMeters, undefined);
});
