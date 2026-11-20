import test from 'node:test';
import assert from 'node:assert/strict';
import { createTrip } from '../js/trip.js';
import { DEFAULT_ORIGIN } from '../js/places.js';
import { applyGeoToTrip, readGeolocation } from '../js/geo.js';

test('geolocation success, denied, unavailable and timeout are distinct and mocks are labelled', async () => {
  const success = await readGeolocation({
    mock: true,
    getCurrentPosition(ok) {
      ok({ coords: { latitude: 22.1939, longitude: 113.5401 } });
    }
  });
  assert.equal(success.status, 'success');
  assert.equal(success.mock, true);
  assert.match(success.message, /模擬定位/);
  assert.match(success.message, /已用你而家嘅位置/);

  const denied = await readGeolocation({
    mock: true,
    getCurrentPosition(_ok, err) { err({ code: 1 }); }
  });
  assert.equal(denied.status, 'denied');
  assert.match(denied.message, /模擬定位/);
  assert.match(denied.message, /未允許定位/);

  const unavailable = await readGeolocation({
    mock: true,
    getCurrentPosition(_ok, err) { err({ code: 2 }); }
  });
  assert.equal(unavailable.status, 'unavailable');
  assert.match(unavailable.message, /定位唔到/);

  const timeout = await readGeolocation({
    mock: true,
    getCurrentPosition() {}
  }, { timeoutMs: 20 });
  assert.equal(timeout.status, 'timeout');
  assert.match(timeout.message, /等太耐/);

  const missing = await readGeolocation(null);
  assert.equal(missing.status, 'unavailable');
  assert.equal(missing.mock, false);
  assert.doesNotMatch(missing.message, /模擬/);
});

test('a real success moves the shared origin; denial and an outside fix keep Senado', async () => {
  const trip = createTrip();
  applyGeoToTrip(trip, {
    status: 'success',
    mock: false,
    lat: 22.2,
    lon: 113.55,
    message: ''
  });
  assert.equal(trip.getState().location.status, 'success');
  assert.equal(trip.getState().location.mock, false);
  assert.doesNotMatch(trip.getState().location.message, /模擬/);
  assert.equal(trip.getState().origin.name, '我而家嘅位置');
  assert.equal(trip.getState().origin.lat, 22.2);
  assert.equal(trip.getState().mode, 'walk');

  const denied = createTrip();
  applyGeoToTrip(denied, { status: 'denied', mock: true, message: '' });
  assert.equal(denied.getState().origin.name, DEFAULT_ORIGIN.name);
  assert.equal(denied.getState().location.status, 'denied');
  assert.match(denied.getState().location.message, /模擬定位/);

  const outside = createTrip();
  outside.setMode('bus');
  applyGeoToTrip(outside, { status: 'success', mock: false, lat: 23.2, lon: 113.2 });
  assert.equal(outside.getState().location.status, 'outside');
  assert.equal(outside.getState().origin.name, '議事亭前地');
  assert.equal(outside.getState().mode, 'bus');
});
