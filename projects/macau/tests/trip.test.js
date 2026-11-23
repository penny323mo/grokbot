import test from 'node:test';
import assert from 'node:assert/strict';
import { createTrip, coordKey } from '../js/trip.js';
import { DEFAULT_DESTINATION, DEFAULT_ORIGIN } from '../js/places.js';
import { applyGeoToTrip } from '../js/geo.js';
import { loadPlans } from '../js/plans.js';

test('default trip is Senado to Guia and walk mode', () => {
  const trip = createTrip();
  const state = trip.getState();
  assert.equal(state.origin.name, '議事亭前地');
  assert.equal(state.origin.lat, DEFAULT_ORIGIN.lat);
  assert.equal(state.origin.lon, DEFAULT_ORIGIN.lon);
  assert.equal(state.destination.name, '東望洋燈塔');
  assert.equal(state.destination.lat, DEFAULT_DESTINATION.lat);
  assert.equal(state.mode, 'walk');
  assert.match(state.location.message, /議事亭前地/);
});

test('mode and route pick share one origin and destination', () => {
  const trip = createTrip();
  const before = trip.planKey();
  trip.setMode('bus');
  trip.setBusIndex(1);
  trip.setWalkIndex(1);
  const mid = trip.getState();
  assert.equal(trip.planKey(), before);
  assert.equal(mid.origin.name, '議事亭前地');
  assert.equal(mid.destination.name, '東望洋燈塔');
  assert.equal(mid.mode, 'bus');
  trip.setMode('walk');
  assert.equal(trip.planKey(), before);
  trip.setOrigin({ name: '媽閣廟', lat: 22.1861086, lon: 113.5312671 });
  assert.notEqual(trip.planKey(), before);
  assert.equal(trip.getState().mode, 'walk');
  assert.equal(trip.getState().destination.name, '東望洋燈塔');
});

test('swap exchanges ends without leaving the pair', () => {
  const trip = createTrip();
  trip.swap();
  const state = trip.getState();
  assert.equal(state.origin.name, '東望洋燈塔');
  assert.equal(state.destination.name, '議事亭前地');
  assert.equal(coordKey(state.origin, state.destination), trip.planKey());
});

test('loadPlans asks walk and bus for the same coordinates', async () => {
  const origin = { ...DEFAULT_ORIGIN };
  const destination = { ...DEFAULT_DESTINATION };
  const seen = [];
  const plans = await loadPlans(origin, destination, {
    walk: async (o, d) => {
      seen.push(['walk', o.lat, o.lon, d.lat, d.lon]);
      return { ok: true, status: 'ok', options: [{ ok: true, role: 'only', tag: '行人路', durationMinutes: 23 }] };
    },
    bus: async (o, d) => {
      seen.push(['bus', o.lat, o.lon, d.lat, d.lon]);
      return { ok: true, status: 'snapshot', options: [{ routeName: '7', inVehicleMinutes: null }] };
    },
    rain: async () => ({ show: false, available: false })
  });
  assert.equal(seen.length, 2);
  assert.deepEqual(seen[0].slice(1), seen[1].slice(1));
  assert.equal(plans.key, coordKey(origin, destination));
  assert.equal(plans.walk.options[0].durationMinutes, 23);
  assert.equal(plans.bus.options[0].inVehicleMinutes, null);
});

test('a failed walk does not invent a time and does not drop the bus plan', async () => {
  const origin = { ...DEFAULT_ORIGIN };
  const destination = { ...DEFAULT_DESTINATION };
  const plans = await loadPlans(origin, destination, {
    walk: async () => { throw new Error('down'); },
    bus: async () => ({ ok: true, status: 'snapshot', options: [{ routeName: '2' }] }),
    rain: async () => ({ show: false })
  });
  assert.equal(plans.walk.ok, false);
  assert.equal(plans.walk.durationMinutes, null);
  assert.equal(plans.bus.options[0].routeName, '2');
});

test('forced source failure is labelled as a demo and has no numbers', async () => {
  const plans = await loadPlans(DEFAULT_ORIGIN, DEFAULT_DESTINATION, { forceFail: true });
  assert.equal(plans.demo, true);
  assert.equal(plans.walk.status, 'failed');
  assert.equal(plans.walk.durationMinutes, null);
  assert.equal(plans.bus.status, 'failed');
  assert.match(plans.walk.message, /示範/);
  applyGeoToTrip(createTrip(), { status: 'denied', mock: false });
});
