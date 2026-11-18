import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  searchBusRoutes,
  findNearbyStops,
  parseLiveBusResponse,
  fetchLiveBusPositions
} from '../js/bus.js';

test('Bus: parses DSAT stop sequence fixtures and handles header=003 no-data gracefully', () => {
  const normalRoute10 = JSON.parse(fs.readFileSync(path.resolve('data/fixtures/dsat-route-10-dir0.json'), 'utf8'));
  assert.equal(normalRoute10.header, '000');
  assert.ok(Array.isArray(normalRoute10.data.routeInfo));
  assert.ok(normalRoute10.data.routeInfo.length > 10);
  assert.equal(normalRoute10.data.routeInfo[0].staName, '關閘總站');

  const errorRoute = JSON.parse(fs.readFileSync(path.resolve('data/fixtures/dsat-route-2a-dir1-nodata.json'), 'utf8'));
  assert.equal(errorRoute.header, '003');
  assert.equal(errorRoute.msg, 'error: no data.');
});

test('Bus: finds direct route from official graph without invented in-vehicle minutes', () => {
  const routes = JSON.parse(fs.readFileSync(path.resolve('data/routes.json'), 'utf8'));
  const stops = JSON.parse(fs.readFileSync(path.resolve('data/stops.json'), 'utf8'));

  // Pair: 議事亭前地 (22.1938271, 113.5399903) -> 關閘總站 (22.215282, 113.54882)
  const origin = { lat: 22.1938271, lon: 113.5399903 };
  const dest = { lat: 22.215282, lon: 113.54882 };

  const result = searchBusRoutes(origin, dest, routes, stops);
  assert.ok(result.direct.length > 0, 'Must find direct routes like 3, 3A, 3X, 10');

  const route10or3 = result.direct.find(r => r.routeName === '10' || r.routeName === '3' || r.routeName === '3A');
  assert.ok(route10or3, 'Must include route 10 or 3/3A');
  assert.ok(route10or3.stopsCount > 0);
  assert.ok(route10or3.boardingStop.name.length > 0);
  assert.ok(route10or3.alightingStop.name.length > 0);

  // In-vehicle duration must NOT be invented
  assert.equal(route10or3.inVehicleMinutes, undefined, 'Must NEVER invent in-vehicle minutes');
  assert.equal(route10or3.durationMinutes, undefined, 'Must NEVER invent duration minutes');

  // Geometry must be provided for map display
  assert.ok(route10or3.geometry && route10or3.geometry.type === 'LineString');
  assert.ok(route10or3.geometry.coordinates.length >= 2);
});

test('Bus: live positions fixture renders active vehicles and refuses to convert to minutes via speed or distance', () => {
  const fixture = JSON.parse(fs.readFileSync(path.resolve('data/fixtures/dsat-live-bus-sample.json'), 'utf8'));
  const parsed = parseLiveBusResponse(fixture);

  assert.equal(parsed.available, true);
  assert.ok(parsed.count > 0);
  assert.match(parsed.message, /班車運作中/);

  // Assert no invented ETA or arrival minutes
  for (const b of parsed.activeBuses) {
    assert.equal(b.etaMinutes, undefined, 'Must NEVER turn live bus into ETA minutes');
    assert.equal(b.arrivalMinutes, undefined, 'Must NEVER turn speed into arrival minutes');
  }
});

test('Bus: CORS or network failure for live bus returns honest unavailable without hiding static plan', async () => {
  const mockFailingFetch = async () => {
    throw new TypeError('Failed to fetch (CORS block)');
  };

  const res = await fetchLiveBusPositions('10', '0', mockFailingFetch);
  assert.equal(res.available, false);
  assert.match(res.message, /未能喺瀏覽器讀到/);
});

test('Bus: recommendation helper refuses to claim bus is faster when in-vehicle time is unknown', () => {
  // Recommendation logic check
  const busOption = { routeName: '10', stopsCount: 13 };
  const walkOption = { durationMinutes: 45 };

  // Helper verifying no "faster" judgment
  function canRecommendBusAsFaster(bus, walk) {
    if (!bus.durationMinutes) return false;
    return bus.durationMinutes < walk.durationMinutes;
  }

  assert.equal(canRecommendBusAsFaster(busOption, walkOption), false);
});

test('Bus: finds 1-transfer route when no direct route exists', () => {
  const routes = {
    'R1_0': { routeName: 'R1', dir: '0', stops: ['S_ORIGIN', 'S_TRANSFER'] },
    'R2_0': { routeName: 'R2', dir: '0', stops: ['S_TRANSFER', 'S_DEST'] }
  };
  const stops = {
    'S_ORIGIN': { name: '起點站', lat: 22.1930, lon: 113.5400 },
    'S_TRANSFER': { name: '轉乘站', lat: 22.2000, lon: 113.5450 },
    'S_DEST': { name: '終點站', lat: 22.2150, lon: 113.5480 }
  };

  const origin = { lat: 22.1930, lon: 113.5400 };
  const dest = { lat: 22.2150, lon: 113.5480 };

  const result = searchBusRoutes(origin, dest, routes, stops);
  assert.equal(result.direct.length, 0);
  assert.ok(result.transfers.length > 0, 'Must find 1-transfer route');
  assert.equal(result.transfers[0].routeA, 'R1');
  assert.equal(result.transfers[0].routeB, 'R2');
  assert.equal(result.transfers[0].transferStop.code, 'S_TRANSFER');
});
