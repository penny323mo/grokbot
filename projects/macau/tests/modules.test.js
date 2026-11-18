import test from 'node:test';
import assert from 'node:assert/strict';
import { createTrip } from '../js/trip.js';
import { DEFAULT_DESTINATION, DEFAULT_ORIGIN } from '../js/places.js';
import { LEFT_OUT, MODULES } from '../js/inventory.js';
import { rankFacilities } from '../js/nearby.js';
import { parkDisplayName, rankParks } from '../js/park.js';
import { RAINVIEWER_NATIVE_MAX_ZOOM, presentRadar, radarSourceSpec } from '../js/radar.js';
import { OFFICIAL_TIDE, presentMarine, presentModelWeather } from '../js/conditions.js';
import { nearestLandmarks, presentLandmark } from '../js/terrain.js';
import { presentWalkLeg, routeBusAccess } from '../js/bus.js';

test('switching panels keeps the same origin and destination', () => {
  const trip = createTrip();
  const key = trip.planKey();
  for (const mod of MODULES) trip.setPanel(mod.id);
  assert.equal(trip.planKey(), key);
  assert.equal(trip.getState().origin.name, '議事亭前地');
  assert.equal(trip.getState().destination.name, '東望洋燈塔');
  assert.equal(trip.getState().panel, 'park');
});

test('the inventory names every civic module and the blocked official feeds', () => {
  const ids = MODULES.map((item) => item.id);
  for (const id of ['trip', 'nearby', 'weather', 'rain', 'tide', 'terrain', 'park']) {
    assert.ok(ids.includes(id), id);
  }
  assert.ok(LEFT_OUT.some((item) => item.id === 'smg-xml' && item.status === 'blocked'));
  assert.ok(LEFT_OUT.some((item) => item.id === 'dsat-parking-vacancy'));
  assert.ok(LEFT_OUT.some((item) => item.id === 'dei-sai-3d'));
  assert.ok(LEFT_OUT.some((item) => item.id === 'games'));
});

test('nearby ranking does not invent a walking time or a parking vacancy', () => {
  const rows = rankFacilities([
    { id: 'a', name: '公廁', category: 'toilets', categoryLabel: '公廁', lat: 22.194, lon: 113.54 },
    { id: 'b', name: '藥房', category: 'pharmacy', categoryLabel: '藥房', lat: 22.2, lon: 113.55 }
  ], DEFAULT_ORIGIN, 'all');
  assert.equal(rows[0].id, 'a');
  assert.equal(rows[0].walkMinutes, null);
  assert.equal(rows[0].vacancy, null);
  assert.ok(rows[0].rankMetres < rows[1].rankMetres);
});

test('unnamed car parks stay unnamed and keep the source date contract', () => {
  assert.equal(parkDisplayName({ name: '停車場', nameZh: '' }), '未命名停車場');
  assert.equal(parkDisplayName({ nameZh: '居雅大廈停車場' }), '居雅大廈停車場');
  const ranked = rankParks([
    { id: '1', name: '停車場', lat: DEFAULT_DESTINATION.lat, lon: DEFAULT_DESTINATION.lon },
    { id: '2', nameZh: '遠啲', lat: 22.12, lon: 113.56 }
  ], DEFAULT_DESTINATION);
  assert.equal(ranked[0].name, '未命名停車場');
  assert.equal(ranked[0].vacancy, null);
  assert.equal(ranked[0].walkMinutes, null);
});

test('radar tiles declare native max zoom 7 and are not an official product', () => {
  const spec = radarSourceSpec('https://tilecache.rainviewer.com/v2/radar/abc/256/{z}/{x}/{y}/2/1_1.png');
  assert.equal(spec.maxzoom, RAINVIEWER_NATIVE_MAX_ZOOM);
  assert.equal(spec.maxzoom, 7);
  const view = presentRadar({
    host: 'https://tilecache.rainviewer.com',
    generated: 1794983124,
    radar: { past: [{ time: 1794982800, path: '/v2/radar/abc' }], nowcast: [] }
  }, 1794983000000);
  assert.equal(view.official, false);
  assert.equal(view.source.maxzoom, 7);
  assert.equal(view.observedAt, 1794982800);
  assert.notEqual(view.observedAt, view.retrievedAt);
  assert.match(view.message, /唔係官方/);
});

test('weather and tide keep official data unavailable and do not judge safety', () => {
  const weather = presentModelWeather({
    current: { time: '2026-11-18T14:00', temperature_2m: 24, weather_code: 1, is_day: 1 }
  }, Date.parse('2026-11-18T14:05:00+08:00'));
  assert.equal(weather.official, false);
  assert.equal(weather.observedAt, null);
  assert.match(weather.message, /Open-Meteo/);
  assert.match(weather.message, /2026-11-18T14:00/);

  const tide = presentMarine({
    current: { time: '2026-11-18T14:00', sea_level_height_msl: 0.4 }
  });
  assert.equal(tide.datum, 'MSL');
  assert.equal(tide.official, false);
  assert.match(tide.message, /海圖基準面/);
  assert.doesNotMatch(tide.message, /安全|危險/);
  assert.equal(OFFICIAL_TIDE.status, 'unavailable');
  assert.match(OFFICIAL_TIDE.text, /CORS/);

  const missing = presentMarine({ current: { sea_level_height_msl: 1.2 } });
  assert.equal(missing.available, false);
  assert.equal(missing.height, null);
});

test('terrain omits a missing height and bus access uses the pedestrian result only', async () => {
  assert.equal(presentLandmark({ id: 'x', name: '某橋', kind: '橋', ele_source: 'none', lat: 1, lon: 2 }).heightText, '高度不詳');
  const near = nearestLandmarks([
    { id: 'far', name: '遠', kind: '山丘', lat: 22.12, lon: 113.56, ele_m: 10, ele_source: 'osm:ele' },
    { id: 'near', name: '近', kind: '山丘', lat: 22.194, lon: 113.54, ele_m: 20, ele_source: 'osm:ele' }
  ], DEFAULT_ORIGIN);
  assert.equal(near[0].id, 'near');
  assert.match(near[0].heightText, /唔係官方測量/);

  const failed = await routeBusAccess(
    DEFAULT_ORIGIN,
    DEFAULT_DESTINATION,
    { board: { lat: 22.19, lon: 113.54 }, alight: { lat: 22.2, lon: 113.55 } },
    async () => ({ ok: false, options: [] })
  );
  assert.equal(failed.toBoard.minutes, null);
  assert.match(failed.toBoard.text, /計唔到/);

  const routed = presentWalkLeg({
    ok: true,
    options: [{ durationMinutes: 6, distanceMeters: 420 }]
  }, '去上車站');
  assert.equal(routed.minutes, 6);
  assert.match(routed.text, /6 分鐘/);
});
