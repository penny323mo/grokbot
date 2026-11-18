import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  findNearbyCarParks,
  planParkThenWalk
} from '../js/parking.js';

test('Parking: finds real OSM car parks near destination from bundled snapshot', () => {
  const carparks = JSON.parse(fs.readFileSync(path.resolve('data/carparks.json'), 'utf8'));
  assert.ok(carparks.length >= 100, 'Must have at least 100 Macau car parks');

  // Destination: 關閘總站 (22.215282, 113.54882)
  const dest = { lat: 22.215282, lon: 113.54882 };
  const nearby = findNearbyCarParks(dest, carparks, 600, 3);

  assert.ok(nearby.length >= 2, 'Must find car parks near Barrier Gate');
  assert.ok(nearby[0].name.length > 0);
  assert.ok(nearby[0].crowFliesDistM <= 600);
});

test('Parking: ranks parks by router walk fixtures, never by displaying crow-flies as walking minutes', async () => {
  const carparks = JSON.parse(fs.readFileSync(path.resolve('data/carparks.json'), 'utf8'));
  const dest = { lat: 22.215282, lon: 113.54882 };

  // Mock walk router that returns real pedestrian results
  const mockSlopeWalkFn = async (origin, destination) => {
    return {
      ok: true,
      primary: {
        durationMinutes: 4,
        durationSeconds: 240,
        distanceMeters: 320,
        climbMeters: 2.5,
        stairsCount: 0,
        geometry: { type: 'LineString', coordinates: [[origin.lon, origin.lat], [destination.lon, destination.lat]] }
      }
    };
  };

  const plan = await planParkThenWalk(dest, carparks, mockSlopeWalkFn);
  assert.equal(plan.ok, true);
  assert.ok(plan.parks.length > 0);
  assert.equal(plan.parks[0].walkMinutes, 4);

  // Assert honest live vacancy disclaimer
  assert.match(plan.vacancyDisclaimer, /澳門即時車位（交通事務局）暫時未能喺無密鑰情況下讀到/);
  // Must NOT display guessed vacancy
  assert.equal(plan.parks[0].vacancy, undefined);
  assert.equal(plan.parks[0].isFull, undefined);
});

test('Parking: empty park file or failed walks yields honest unavailable state', async () => {
  const dest = { lat: 22.215282, lon: 113.54882 };
  const failingWalkFn = async () => ({ ok: false });

  const plan = await planParkThenWalk(dest, [], failingWalkFn);
  assert.equal(plan.ok, false);
  assert.equal(plan.parks.length, 0);
});

test('Parking: copy helpers never label OSM parks as 交通事務局車位', () => {
  const carparksMeta = JSON.parse(fs.readFileSync(path.resolve('data/meta.json'), 'utf8'));
  assert.match(carparksMeta.carparks.source, /OpenStreetMap/);
  assert.doesNotMatch(carparksMeta.carparks.source, /交通事務局車位/);
});
