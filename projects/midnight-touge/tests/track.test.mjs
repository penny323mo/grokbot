// Track Collision & Navigation Unit Tests for Midnight Touge (《夜峠》)
import { test, describe } from 'node:test';
import assert from 'node:assert';
import { KIRINE_PASS_TRACK } from '../src/data/track_data.js';
import { TrackCollision } from '../src/physics/track-collision.js';
import { EVENTS_DATA } from '../src/data/events.js';

describe('Track Data & Collision Progression', () => {
  test('Kirine Pass track data meets commercial spec requirements', () => {
    assert.strictEqual(KIRINE_PASS_TRACK.name, "霧嶺 (Kirine Pass)");
    assert.ok(KIRINE_PASS_TRACK.totalLength >= 2500, `Track length must be >= 2500m, got ${KIRINE_PASS_TRACK.totalLength}`);
    assert.ok(KIRINE_PASS_TRACK.elevationDrop >= 300, `Elevation drop must be >= 300m, got ${KIRINE_PASS_TRACK.elevationDrop}`);
    assert.strictEqual(KIRINE_PASS_TRACK.sectors.length, 4, 'Must have 4 defined sectors');
    assert.ok(KIRINE_PASS_TRACK.hairpins.length >= 5, `Must have >= 5 hairpins, got ${KIRINE_PASS_TRACK.hairpins.length}`);
    assert.ok(KIRINE_PASS_TRACK.waypoints.length > 200, 'Waypoints must be sufficiently dense for spline tracking');
  });

  test('TrackCollision tracks waypoint progression along track', () => {
    const col = new TrackCollision(KIRINE_PASS_TRACK);
    col.reset();

    const wp0 = KIRINE_PASS_TRACK.waypoints[0];
    col.update(wp0.x, wp0.y, wp0.z, 0.0);

    assert.strictEqual(col.currentWaypointIndex, 0);
    assert.strictEqual(col.completed, false);

    // Simulate moving 100 waypoints down the pass
    const wp100 = KIRINE_PASS_TRACK.waypoints[100];
    col.update(wp100.x, wp100.y, wp100.z, 25.0);

    assert.ok(col.currentWaypointIndex >= 95, `Waypoint index should advance, got ${col.currentWaypointIndex}`);
    assert.ok(col.distanceAlongTrack > 500, `Distance should advance, got ${col.distanceAlongTrack}`);
    assert.ok(col.checkpointsPassed.size > 0, 'Checkpoints must be tracked');
  });

  test('Sector event finishes when reaching targetDist (Stage 1 ends at 1250m)', () => {
    const col = new TrackCollision(KIRINE_PASS_TRACK);
    const stage1 = EVENTS_DATA[0]; // startDist: 0, targetDist: 1250

    const startWp = col.setSector(stage1.startDist, stage1.targetDist, stage1.direction);
    assert.strictEqual(col.completed, false);
    assert.strictEqual(col.currentWaypointIndex, 0);

    // Initial update at spawn must NOT complete
    col.update(startWp.x, startWp.y, startWp.z, 0.0);
    assert.strictEqual(col.completed, false);

    // Find waypoint near 1250m
    const targetWp = KIRINE_PASS_TRACK.waypoints.find(wp => wp.dist >= 1250);
    assert.ok(targetWp, 'Should find waypoint near 1250m');

    // Reaching 1250m targetDist completes the sector
    col.update(targetWp.x, targetWp.y, targetWp.z, 48.5);
    assert.strictEqual(col.completed, true, 'Stage 1 should complete upon reaching targetDist 1250m');
  });

  test('Uphill spawn leaves completed === false and finishes only upon reaching summit', () => {
    const col = new TrackCollision(KIRINE_PASS_TRACK);
    const stage6 = EVENTS_DATA[5]; // Uphill: startDist: 2990, targetDist: 0

    assert.strictEqual(stage6.direction, 'uphill');

    const startWp = col.setSector(stage6.startDist, stage6.targetDist, stage6.direction);
    assert.strictEqual(col.completed, false);
    assert.ok(col.currentWaypointIndex > 200, 'Uphill must spawn near end of track');

    // First frame update at spawn (elapsed = 0) must NOT complete
    col.update(startWp.x, startWp.y, startWp.z, 0.0);
    assert.strictEqual(col.completed, false, 'Uphill spawn must not instantly finish');

    // Even after countdown tick (e.g. elapsed = 1.0), idle spawn must NOT finish
    col.update(startWp.x, startWp.y, startWp.z, 1.0);
    assert.strictEqual(col.completed, false, 'Car at bottom spawn must not finish');

    // Moving up to summit targetDist: 0
    const summitWp = KIRINE_PASS_TRACK.waypoints[0];
    col.update(summitWp.x, summitWp.y, summitWp.z, 135.0);
    assert.strictEqual(col.completed, true, 'Uphill run finishes when reaching summit targetDist');
  });

  test('Gutter drop detection activates inside hairpin gutters', () => {
    const col = new TrackCollision(KIRINE_PASS_TRACK);
    col.reset();

    const curveWpIdx = KIRINE_PASS_TRACK.waypoints.findIndex(wp => wp.tag === 'left');
    assert.ok(curveWpIdx >= 0, 'Should find at least one left curve waypoint');

    const hpWp = KIRINE_PASS_TRACK.waypoints[curveWpIdx];
    col.currentWaypointIndex = curveWpIdx;

    const gutterX = hpWp.x + (hpWp.rx || 1.0) * (-3.8);
    const gutterY = hpWp.y + (hpWp.ry || 0.0) * (-3.8);
    col.update(gutterX, gutterY, hpWp.z, 50.0);

    assert.ok(col.isInGutter, 'Car should be detected in gutter drop zone');
  });

  test('Guardrail boundary collision triggers when leaving road width', () => {
    const col = new TrackCollision(KIRINE_PASS_TRACK);
    col.reset();

    const wp = KIRINE_PASS_TRACK.waypoints[30];
    col.currentWaypointIndex = 30;

    const wallX = wp.x + (wp.rx || 1.0) * 4.9;
    const wallY = wp.y + (wp.ry || 0.0) * 4.9;
    col.update(wallX, wallY, wp.z, 10.0);

    assert.ok(col.wallCollision !== null, 'Wall collision should be registered');
    assert.ok(col.wallCollision.penetration > 0, 'Penetration depth should be positive');
  });

  test('Centerline walk at 8m steps maintains strictly monotonic distanceAlongTrack across hairpins', () => {
    const col = new TrackCollision(KIRINE_PASS_TRACK);
    col.reset();

    const waypoints = KIRINE_PASS_TRACK.waypoints;
    let prevDist = col.distanceAlongTrack;

    for (let i = 0; i < waypoints.length - 1; i++) {
      const w0 = waypoints[i];
      const w1 = waypoints[i + 1];
      const dx = w1.x - w0.x;
      const dy = w1.y - w0.y;
      const dist = Math.hypot(dx, dy);
      const steps = Math.max(1, Math.round(dist / 8.0));

      for (let s = 1; s <= steps; s++) {
        const frac = s / steps;
        const x = w0.x + dx * frac;
        const y = w0.y + dy * frac;
        const z = w0.z + (w1.z - w0.z) * frac;
        col.update(x, y, z, 1.0);

        assert.ok(
          col.distanceAlongTrack >= prevDist - 0.05,
          `distanceAlongTrack must be monotonic: prev ${prevDist}, cur ${col.distanceAlongTrack} at wp ${i}`
        );
        assert.ok(
          col.distanceAlongTrack <= prevDist + 25.0,
          `distanceAlongTrack jumped forward by >25m: prev ${prevDist}, cur ${col.distanceAlongTrack} at wp ${i}`
        );
        prevDist = col.distanceAlongTrack;
      }
    }
  });
});
