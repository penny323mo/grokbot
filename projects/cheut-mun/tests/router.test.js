import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  parseValhallaRouteResponse,
  parseOsrmFootResponse,
  fetchSlopeWalkingRoutes
} from '../js/router.js';

import {
  calculateClimbAndDescent,
  areMeaningfullyDifferent,
  isRealisticWalkingSpeed
} from '../js/utils.js';

test('Router: parses Valhalla default probe fixture into duration, distance, climb, descent and stairs', () => {
  const fixturePath = path.resolve('data/fixtures/valhalla-probe-default.json');
  const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

  const parsed = parseValhallaRouteResponse(fixture);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.provider, 'valhalla');
  assert.equal(parsed.distanceMeters, 1659);
  assert.equal(parsed.durationMinutes, 23);
  assert.ok(isRealisticWalkingSpeed(parsed.speedKmh), `Speed ${parsed.speedKmh} km/h must be pedestrian`);

  assert.equal(parsed.hasElevation, true);
  assert.equal(parsed.elevationSamples.length, 112);
  assert.equal(parsed.startElevation, 14.0);
  assert.equal(parsed.endElevation, 75.5);
  assert.equal(parsed.minElevation, 13.0);
  assert.equal(parsed.maxElevation, 82.7);
  assert.ok(parsed.climbMeters > 0, 'Climb must be positive');
  assert.ok(parsed.descentMeters > 0, 'Descent must be positive');

  assert.equal(parsed.stairsCount, 2, 'Must extract exactly 2 stairs maneuvers');
  assert.ok(parsed.geometry && parsed.geometry.type === 'LineString');
});

test('Router: parses use_hills=1 fixture and classifies as meaningfully different alternative', () => {
  const defPath = path.resolve('data/fixtures/valhalla-probe-default.json');
  const h1Path = path.resolve('data/fixtures/valhalla-probe-hills1.json');
  const defaultRoute = parseValhallaRouteResponse(JSON.parse(fs.readFileSync(defPath, 'utf8')));
  const hillsRoute = parseValhallaRouteResponse(JSON.parse(fs.readFileSync(h1Path, 'utf8')));

  assert.equal(hillsRoute.ok, true);
  assert.equal(hillsRoute.distanceMeters, 1550);
  assert.equal(hillsRoute.stairsCount, 3);

  const isDifferent = areMeaningfullyDifferent(defaultRoute, hillsRoute);
  assert.equal(isDifferent, true, 'Distance differs by > 50m and stairs differ');
});

test('Router: duplicate shape fixture is NOT presented as two options', () => {
  const defPath = path.resolve('data/fixtures/valhalla-probe-default.json');
  const dupPath = path.resolve('data/fixtures/valhalla-probe-duplicate.json');
  const defaultRoute = parseValhallaRouteResponse(JSON.parse(fs.readFileSync(defPath, 'utf8')));
  const dupRoute = parseValhallaRouteResponse(JSON.parse(fs.readFileSync(dupPath, 'utf8')));

  const isDifferent = areMeaningfullyDifferent(defaultRoute, dupRoute);
  assert.equal(isDifferent, false, 'Duplicate shape must NOT be classified as different');
});

test('Router: rejects project-osrm car-speed ~36 km/h fixture as walking time', () => {
  const fixturePath = path.resolve('data/fixtures/osrm-foot-car-speed.json');
  const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

  const parsed = parseOsrmFootResponse(fixture);
  assert.equal(parsed.ok, false);
  assert.equal(parsed.reason, 'unrealistic_speed');
  assert.match(parsed.message, /時速不合理/);
});

test('Router: missing or failing router yields honest unavailable state without fake numbers', async () => {
  const mockFailingFetch = async () => {
    throw new Error('Network timeout');
  };

  const origin = { lat: 22.1938271, lon: 113.5399903 };
  const dest = { lat: 22.215282, lon: 113.54882 };

  const result = await fetchSlopeWalkingRoutes(origin, dest, mockFailingFetch);
  assert.equal(result.ok, false);
  assert.equal(result.message, '暫時未能計算步行路線');
  assert.equal(result.options.length, 0);
});

test('Router: climb and descent are calculated strictly from sample array, never crow-flies', () => {
  const empty = calculateClimbAndDescent([]);
  assert.equal(empty.climb, 0);
  assert.equal(empty.descent, 0);

  const samples = [10, 15, 12, 20, 18];
  const res = calculateClimbAndDescent(samples);
  assert.equal(res.climb, 13);
  assert.equal(res.descent, 5);
  assert.equal(res.minElev, 10);
  assert.equal(res.maxElev, 20);
});

test('Router: caches identical A->B queries to prevent hammering the public instance', async () => {
  let fetchCount = 0;
  const mockFetch = async () => {
    fetchCount++;
    const defPath = path.resolve('data/fixtures/valhalla-probe-default.json');
    const json = JSON.parse(fs.readFileSync(defPath, 'utf8'));
    return {
      ok: true,
      json: async () => json
    };
  };

  const origin = { lat: 22.1800, lon: 113.5300 };
  const dest = { lat: 22.1900, lon: 113.5400 };

  const firstCall = await fetchSlopeWalkingRoutes(origin, dest, mockFetch);
  assert.equal(firstCall.ok, true);
  const initialFetchCount = fetchCount;
  assert.ok(initialFetchCount > 0);

  const secondCall = await fetchSlopeWalkingRoutes(origin, dest, mockFetch);
  assert.equal(secondCall.ok, true);
  assert.equal(fetchCount, initialFetchCount, 'Second call must hit cache');
});
