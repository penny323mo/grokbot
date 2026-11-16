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
  areMeaningfullyDifferent
} from '../js/utils.js';

test('Router: parses Valhalla default probe fixture into duration, distance, climb, descent and stairs', () => {
  const fixturePath = path.resolve('data/fixtures/valhalla-probe-default.json');
  const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

  const parsed = parseValhallaRouteResponse(fixture);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.provider, 'valhalla');
  assert.equal(parsed.distanceMeters, 1659);
  assert.equal(parsed.durationMinutes, 23); // 1370s -> 22.8 -> 23 min
  assert.ok(parsed.speedKmh >= 1.5 && parsed.speedKmh <= 8.5, `Speed ${parsed.speedKmh} km/h must be pedestrian`);

  // Elevation and climb
  assert.equal(parsed.hasElevation, true);
  assert.equal(parsed.elevationSamples.length, 112);
  assert.equal(parsed.startElevation, 14.0);
  assert.equal(parsed.endElevation, 75.5);
  assert.equal(parsed.minElevation, 13.0);
  assert.equal(parsed.maxElevation, 82.7);
  assert.ok(parsed.climbMeters > 0, 'Climb must be positive');
  assert.ok(parsed.descentMeters > 0, 'Descent must be positive');

  // Stairs maneuvers
  assert.equal(parsed.stairsCount, 2, 'Must extract exactly 2 stairs maneuvers');

  // Geometry
  assert.ok(parsed.geometry && parsed.geometry.type === 'LineString');
  assert.ok(parsed.geometry.coordinates.length > 5);
});

test('Router: parses use_hills=1 fixture and classifies as meaningfully different alternative', () => {
  const defPath = path.resolve('data/fixtures/valhalla-probe-default.json');
  const h1Path = path.resolve('data/fixtures/valhalla-probe-hills1.json');
  const defaultRoute = parseValhallaRouteResponse(JSON.parse(fs.readFileSync(defPath, 'utf8')));
  const hillsRoute = parseValhallaRouteResponse(JSON.parse(fs.readFileSync(h1Path, 'utf8')));

  assert.equal(hillsRoute.ok, true);
  assert.equal(hillsRoute.distanceMeters, 1550);
  assert.equal(hillsRoute.stairsCount, 3);

  // Check meaningful difference
  const isDifferent = areMeaningfullyDifferent(defaultRoute, hillsRoute);
  assert.equal(isDifferent, true, 'Distance differs by > 50m and stairs differ, must be meaningfully different');
});

test('Router: duplicate shape fixture is NOT presented as two options', () => {
  const defPath = path.resolve('data/fixtures/valhalla-probe-default.json');
  const dupPath = path.resolve('data/fixtures/valhalla-probe-duplicate.json');
  const defaultRoute = parseValhallaRouteResponse(JSON.parse(fs.readFileSync(defPath, 'utf8')));
  const dupRoute = parseValhallaRouteResponse(JSON.parse(fs.readFileSync(dupPath, 'utf8')));

  const isDifferent = areMeaningfullyDifferent(defaultRoute, dupRoute);
  assert.equal(isDifferent, false, 'Duplicate/same shape must NOT be classified as different');
});

test('Router: rejects project-osrm car-speed ~36 km/h fixture', () => {
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
  const dest = { lat: 22.1964359, lon: 113.5497062 };

  const result = await fetchSlopeWalkingRoutes(origin, dest, mockFailingFetch);
  assert.equal(result.ok, false);
  assert.equal(result.message, '暫時未能計算步行路線');
  assert.equal(result.options.length, 0);
});

test('Router: climb and descent are calculated strictly from sample array, never crow-flies', () => {
  // Empty array must yield zeros
  const empty = calculateClimbAndDescent([]);
  assert.equal(empty.climb, 0);
  assert.equal(empty.descent, 0);

  // Synthetic sampled steps
  const samples = [10, 15, 12, 20, 18];
  // 10->15 (+5), 15->12 (-3), 12->20 (+8), 20->18 (-2)
  // Total climb: 5 + 8 = 13, Total descent: 3 + 2 = 5
  const res = calculateClimbAndDescent(samples);
  assert.equal(res.climb, 13);
  assert.equal(res.descent, 5);
  assert.equal(res.minElev, 10);
  assert.equal(res.maxElev, 20);
  assert.equal(res.startElev, 10);
  assert.equal(res.endElev, 18);
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
  assert.equal(fetchCount, initialFetchCount, 'Second call must hit cache without additional fetches');
});
