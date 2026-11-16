import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  loadTransitData,
  findBusJourneys,
  fetchLiveBus,
  parseLiveBusResponse
} from '../js/transit.js';

test('Transit Snapshot: Route 10 dir 0 has 21 stops from 關閘總站 M1/2 to 媽閣交通樞紐 M3/4', async () => {
  const transit = await loadTransitData('./');
  assert.ok(transit.routes, 'routes must exist');
  assert.ok(transit.stops, 'stops must exist');

  const r10_0 = transit.routes['10_0'];
  assert.ok(r10_0, 'Route 10 dir 0 must exist');
  assert.equal(r10_0.routeName, '10');
  assert.equal(r10_0.dir, '0');
  assert.equal(r10_0.origin, '關閘總站');
  assert.equal(r10_0.destination, '媽閣交通樞紐');
  assert.equal(r10_0.stops.length, 21, 'Route 10 dir 0 must have exactly 21 stops');
  assert.equal(r10_0.stops[0], 'M1/2', 'First stop must be 關閘總站 M1/2');
  assert.equal(r10_0.stops[20], 'M3/4', 'Last stop must be 媽閣交通樞紐 M3/4');

  // Verify stop details in stops.json
  const firstStop = transit.stops['M1/2'];
  const lastStop = transit.stops['M3/4'];
  assert.equal(firstStop.name, '關閘總站');
  assert.equal(lastStop.name, '媽閣交通樞紐');
});

test('Transit Fixture: DSAT route 2A dir 1 nodata fixture handled cleanly', () => {
  const fixturePath = path.resolve('data/fixtures/dsat-route-2a-dir1-nodata.json');
  const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

  assert.equal(fixture.header, '003');
  assert.equal(fixture.msg, 'error: no data.');

  // Verify that an empty/nodata route does not crash journey finding
  const dummyRoutes = { '2A_1': { routeName: '2A', dir: '1', stops: [] } };
  const journeys = findBusJourneys(
    { lat: 22.215282, lon: 113.54882 },
    { lat: 22.1849, lon: 113.5312 },
    { routes: dummyRoutes, stops: {} }
  );
  assert.deepEqual(journeys, []);
});

test('Transit Journey Search: 關閘 to 媽閣 finds direct routes including Route 10/1/61', async () => {
  const transit = await loadTransitData('./');
  const origin = { lat: 22.215282, lon: 113.54882 }; // 關閘總站
  const dest = { lat: 22.1849, lon: 113.5312 };     // 媽閣交通樞紐

  const journeys = findBusJourneys(origin, dest, transit, 5);
  assert.ok(journeys.length > 0, 'Must find direct journeys between 關閘 and 媽閣');

  const routeNames = journeys.map((j) => j.routeName);
  // Route 61, Route 1, Route 10, or Route MT4 connect 關閘 to 媽閣
  const hasExpectedRoute = routeNames.some((r) => ['61', '1', '10', 'MT4', '65'].includes(r));
  assert.ok(hasExpectedRoute, `Expected direct route in ${routeNames.join(', ')}`);

  const topJourney = journeys[0];
  assert.equal(topJourney.type, 'direct');
  assert.ok(topJourney.boardingStop.code, 'Must have boarding stop code');
  assert.ok(topJourney.boardingStop.name, 'Must have boarding stop name');
  assert.ok(topJourney.alightingStop.code, 'Must have alighting stop code');
  assert.ok(topJourney.alightingStop.name, 'Must have alighting stop name');
  assert.ok(topJourney.stopCount > 0, 'Intermediate stops count must be > 0');
  assert.ok(topJourney.stops.length === topJourney.stopCount + 1, 'Stops array must match stopCount + 1');
});

test('Transit LRT Transfer: flags metro connection on routes to LRT interchange stations', async () => {
  const transit = await loadTransitData('./');

  // Verify at least one stop has metro === '1'
  const metroStops = Object.values(transit.stops).filter((s) => s.metro === '1');
  assert.ok(metroStops.length > 0, 'Must have stops connecting to Macau LRT');

  // Trip to Barra (媽閣) has LRT interchange (metro: '1')
  const origin = { lat: 22.215282, lon: 113.54882 }; // 關閘
  const dest = { lat: 22.1849, lon: 113.5312 };     // 媽閣 (Barra LRT terminal)

  const journeys = findBusJourneys(origin, dest, transit, 5);
  const metroJourneys = journeys.filter((j) => j.hasMetro);
  assert.ok(metroJourneys.length > 0, 'Trip to Barra must detect LRT interchange stop');
});

test('Transit Live Bus Parsing: reports upstream bus position and NEVER invents ETA minutes', () => {
  const fixturePath = path.resolve('data/fixtures/dsat-live-bus-sample.json');
  const liveSample = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

  const routeStops = [
    'M1/2', 'M281', 'M29', 'M36', 'M48', 'M52', 'M239/2', 'M254',
    'M241', 'M71', 'M155', 'M157', 'M173', 'M171/1', 'M142', 'M136/1',
    'M139/2', 'M184', 'M188', 'M203/1', 'M3/4'
  ];

  const stopsLookup = {
    'M52': { name: '漁翁街/勞工事務局' },
    'M71': { name: '廈門街/澳門理工大學' },
    'M157': { name: '治安警察局' }
  };

  // Boarding at M71 (index 9)
  // In liveSample, M52 is at index 5 with bus MX2063
  // Upstream diff = 9 - 5 = 4 stops away!
  const parsed = parseLiveBusResponse(liveSample, routeStops, 'M71', stopsLookup);

  assert.equal(parsed.status, 'approaching');
  assert.equal(parsed.diff, 4);
  assert.equal(parsed.stopCode, undefined); // closest bus info
  assert.equal(parsed.stopName, '漁翁街/勞工事務局');
  assert.match(parsed.text, /最近一班車喺「漁翁街\/勞工事務局」附近（相距 4 個站）/);

  // CRITICAL CONSTRAINT: NEVER invent bus ETAs: Do not convert speed/distance to minutes (e.g. "5分鐘後到")
  assert.equal(parsed.etaMinutes, undefined, 'Must NEVER invent arrival minutes');
  assert.doesNotMatch(parsed.text, /分鐘後到|大約.*分鐘到/, 'Copy must never invent arrival-in-minutes ETA');
});

test('Transit Live Bus: gracefully handles CORS/network failure with honest copy', async () => {
  const mockFailingFetch = async () => {
    throw new TypeError('Failed to fetch (CORS block)');
  };

  const res = await fetchLiveBus('10', '0', mockFailingFetch);
  assert.equal(res.ok, false);
  assert.match(res.message, /即時巴士位置暫時未能喺瀏覽器讀到（受 DSAT 跨域限制），顯示班次為常規路線資料。/);
});
