import test from 'node:test';
import assert from 'node:assert/strict';
import { planBus, planLive, presentBus, presentLive } from '../js/bus.js';
import { readFixture, snapshotFetch } from './helpers.js';

const SENADO = { lat: 22.1938271, lon: 113.5399903 };
const GUIA = { lat: 22.1964359, lon: 113.5497062 };

test('Senado to Guia uses the dated DSAT snapshot and does not invent a bus ETA or a road path', async () => {
  const now = Date.parse('2026-11-17T10:00:00+08:00');
  const plan = await planBus(SENADO, GUIA, { fetchFn: snapshotFetch, now });
  assert.equal(plan.ok, true);
  assert.equal(plan.status, 'snapshot');
  assert.ok(plan.options.length >= 1);
  const names = plan.options.map((o) => o.routeName);
  assert.ok(names.some((n) => ['7', '8', '2'].includes(n)), names.join(','));
  for (const option of plan.options) {
    assert.equal(option.inVehicleMinutes, null);
    assert.equal(option.accessWalkMinutes, null);
    assert.equal(option.displayStraightLineAsWalk, false);
    assert.equal(option.geometry, null);
    assert.match(option.summary, /唔估/);
    assert.doesNotMatch(option.summary, /\d+ 分鐘/);
  }
  assert.equal(plan.pathStatus, 'unavailable');
  assert.match(plan.pathNote, /唔畫假線/);
  assert.match(plan.accessNote, /唔係行路時間/);
  assert.equal(plan.provenance.observedAt, null);
  assert.equal(plan.provenance.retrievedAt, '2026-11-16T01:01:58.396804+08:00');
  assert.equal(plan.provenance.freshness, 'dated');
  assert.equal(plan.provenance.official, false);
  assert.match(plan.provenance.cadence, /唔係到站|下載/);
});

test('an old snapshot is stale and a failed read is not an empty official timetable', async () => {
  const stale = presentBus([], { fetchedAt: '2026-11-01T00:00:00+08:00' }, Date.parse('2026-11-17T00:00:00+08:00'));
  assert.equal(stale.provenance.freshness, 'stale');
  assert.equal(stale.status, 'none');

  const failed = await planBus(SENADO, GUIA, {
    fetchFn: async () => { throw new Error('403'); }
  });
  assert.equal(failed.status, 'failed');
  assert.equal(failed.options.length, 0);
  assert.match(failed.message, /讀唔到/);
  assert.doesNotMatch(failed.message, /即時到站/);
});

test('live bus CORS failure is unavailable, and a position payload is not turned into minutes', async () => {
  const down = await planLive('7', '0', async () => { throw new Error('Failed to fetch'); });
  assert.equal(down.status, 'unavailable');
  assert.equal(down.etaMinutes, null);
  assert.match(down.message, /跨域|讀唔到/);
  assert.doesNotMatch(down.message, /分鐘後|到站時間為/);

  const sample = await readFixture('dim-heoi', 'dsat-live-bus-sample.json');
  const live = presentLive({ ok: true, data: sample }, Date.parse('2026-11-17T10:00:00+08:00'));
  assert.equal(live.status, 'positions');
  assert.equal(live.etaMinutes, null);
  assert.equal(live.observedAt, null);
  assert.ok(live.buses.length > 0);
  assert.match(live.message, /唔係幾多分鐘到/);
  assert.doesNotMatch(live.message, /47|39|18/);
});
