import test from 'node:test';
import assert from 'node:assert/strict';
import { parseOsrmFootResponse } from '../../ce-lou/js/router.js';
import { parseValhallaRouteResponse } from '../../ce-lou/js/router.js';
import {
  classifyWalkRoutes,
  planWalk,
  presentRejectedWalk,
  stairsLine,
  withWalkProvenance
} from '../js/walk.js';
import { readFixture } from './helpers.js';

test('Senado to Guia fixtures become a flatter route and a shorter route', async () => {
  const base = parseValhallaRouteResponse(await readFixture('ce-lou', 'valhalla-senado-guia-default.json'));
  const hills = parseValhallaRouteResponse(await readFixture('ce-lou', 'valhalla-senado-guia-hills1.json'));
  assert.equal(base.ok, true);
  assert.equal(hills.ok, true);
  assert.ok(base.speedKmh >= 1.5 && base.speedKmh <= 8.5);
  assert.ok(base.climbMeters > 50);
  assert.ok(base.elevationSamples.length > 10);
  const plan = classifyWalkRoutes(base, hills);
  assert.equal(plan.hasAlternative, true);
  assert.equal(plan.options[0].tag, '較平');
  assert.equal(plan.options[1].tag, '較短');
  assert.ok(plan.options[0].climbMeters < plan.options[1].climbMeters);
  assert.ok(plan.options[1].distanceMeters < plan.options[0].distanceMeters);
  assert.ok(plan.options[0].stairsCount >= 1);
  assert.match(stairsLine(plan.options[0].stairsCount), /處樓梯/);
  assert.match(stairsLine(0), /唔等於路上冇梯/);
});

test('a duplicate shape is one route, and a route that wins both metrics is not called shorter on the other path', async () => {
  const a = parseValhallaRouteResponse(await readFixture('ce-lou', 'valhalla-probe-default.json'));
  const b = parseValhallaRouteResponse(await readFixture('ce-lou', 'valhalla-probe-duplicate.json'));
  const same = classifyWalkRoutes(a, b);
  assert.equal(same.hasAlternative, false);
  assert.equal(same.options.length, 1);

  const gentleShort = { ok: true, climbMeters: 20, distanceMeters: 800, durationSeconds: 700, stairsCount: 0, shape: 'a' };
  const worse = { ok: true, climbMeters: 80, distanceMeters: 1400, durationSeconds: 1200, stairsCount: 3, shape: 'b' };
  const dominated = classifyWalkRoutes(gentleShort, worse);
  assert.equal(dominated.options[0].tag, '較平又較短');
  assert.equal(dominated.options[1].tag, '另一條行法');
  assert.notEqual(dominated.options[1].tag, '較短');
});

test('car-speed foot results and router failure carry no walking time', async () => {
  const car = parseOsrmFootResponse(await readFixture('ce-lou', 'osrm-foot-car-speed.json'));
  assert.equal(car.ok, false);
  assert.ok(car.speedKmh > 8.5);
  const rejected = presentRejectedWalk(car);
  assert.equal(rejected.status, 'failed');
  assert.equal(rejected.durationMinutes, null);
  assert.equal(rejected.distanceMeters, null);

  const calls = [];
  const failed = await planWalk(
    { lat: 22.19, lon: 113.54 },
    { lat: 22.196, lon: 113.55 },
    async (url) => {
      calls.push(url);
      return { ok: false, json: async () => ({}) };
    }
  );
  assert.equal(failed.ok, false);
  assert.equal(failed.durationMinutes, null);
  assert.ok(calls.length >= 1);
  assert.ok(calls.every((url) => !String(url).includes('project-osrm.org')));
});

test('walk provenance separates calculation time from a missing observation and can go stale', () => {
  const now = Date.parse('2026-11-17T02:00:00+08:00');
  const fresh = withWalkProvenance({
    ok: true,
    provider: 'valhalla',
    fetchedAt: now - 60 * 1000,
    sourceUrl: 'https://valhalla1.openstreetmap.de',
    sourceName: 'OpenStreetMap / FOSSGIS Valhalla 行人路徑（非官方測時）'
  }, now);
  assert.equal(fresh.provenance.observedAt, null);
  assert.equal(fresh.provenance.retrievedAt, now - 60 * 1000);
  assert.equal(fresh.provenance.calculatedAt, fresh.provenance.retrievedAt);
  assert.equal(fresh.provenance.freshness, 'calculated');
  assert.equal(fresh.provenance.official, false);

  const old = withWalkProvenance({ ok: true, fetchedAt: now - 25 * 60 * 60 * 1000, provider: 'valhalla' }, now);
  assert.equal(old.provenance.freshness, 'stale');
});
