import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canStartCapture,
  captureResult,
  matchOutcome,
  stepCapture,
} from '../src/sim/capture.js';
import { isMutedValue, muteStoreValue, MUTE_KEY } from '../src/sim/settings.js';
import { frontierSegments, sortedZones } from '../src/sim/territory.js';

const owners = {
  'player-hq': 'player',
  'player-bar': 'player',
  'enemy-bar': 'enemy',
  'enemy-hq': 'enemy',
};

test('capture only starts on an empty building held by someone else', () => {
  assert.equal(canStartCapture({
    garrison: 4,
    attackerCount: 10,
    attackerOwner: 'player',
    buildingOwner: 'enemy',
  }), false);
  assert.equal(canStartCapture({
    garrison: 0,
    attackerCount: 0,
    attackerOwner: 'player',
    buildingOwner: 'enemy',
  }), false);
  assert.equal(canStartCapture({
    garrison: 0,
    attackerCount: 6,
    attackerOwner: 'player',
    buildingOwner: 'player',
  }), false);
  assert.equal(canStartCapture({
    garrison: 0,
    attackerCount: 6,
    attackerOwner: 'player',
    buildingOwner: 'enemy',
  }), true);
});

test('capture channel resets when interrupted and completes on time', () => {
  let p = 0;
  const a = stepCapture(p, 0.35, 0.7, true);
  assert.equal(a.done, false);
  assert.ok(Math.abs(a.progress - 0.5) < 1e-9);
  const reset = stepCapture(a.progress, 0.35, 0.7, false);
  assert.deepEqual(reset, { progress: 0, done: false });
  const done = stepCapture(0.6, 0.4, 0.7, true);
  assert.equal(done.done, true);
  assert.equal(done.progress, 1);
});

test('a finished capture flips owner and garrisons the survivors', () => {
  const next = captureResult('player', 7.9);
  assert.deepEqual(next, { owner: 'player', count: 7, capture: 0 });
  assert.equal(captureResult('enemy', 0).count, 0);
});

test('headquarters outcome: lose beats a simultaneous reading, win needs your HQ', () => {
  assert.equal(matchOutcome('player', 'enemy'), null);
  assert.equal(matchOutcome('player', 'player'), 'win');
  assert.equal(matchOutcome('enemy', 'enemy'), 'lose');
  assert.equal(matchOutcome('enemy', 'player'), 'lose');
});

function readFrontier(ownerById) {
  return frontierSegments(ownerById).map((seg) => ({ ...seg }));
}

test('the glow frontier sits between different owners and moves when a slab flips', () => {
  const start = readFrontier(owners);
  assert.equal(start.length, 1);
  assert.equal(start[0].plusOwner, 'player');
  assert.equal(start[0].minusOwner, 'enemy');
  assert.ok(Math.abs(start[0].z) < 0.35);
  assert.ok(start[0].x1 > start[0].x0);

  const pushed = readFrontier({ ...owners, 'enemy-bar': 'player' });
  assert.equal(pushed.length, 1);
  assert.ok(pushed[0].z < -3);
  assert.equal(pushed[0].plusOwner, 'player');
  assert.equal(pushed[0].minusOwner, 'enemy');

  const lostBar = readFrontier({ ...owners, 'player-bar': 'enemy' });
  assert.equal(lostBar.length, 1);
  assert.ok(lostBar[0].z > 3);
  assert.equal(lostBar[0].minusOwner, 'enemy');

  const allPlayer = readFrontier({
    'player-hq': 'player',
    'player-bar': 'player',
    'enemy-bar': 'player',
    'enemy-hq': 'player',
  });
  assert.equal(allPlayer.length, 0);
});

test('the frontier reuses one zone list and one segment buffer', () => {
  const zones = sortedZones();
  assert.equal(sortedZones(), zones);
  const first = frontierSegments(owners);
  const again = frontierSegments(owners);
  assert.equal(first, again);
  const flipped = frontierSegments({ ...owners, 'enemy-bar': 'player' });
  assert.equal(flipped, first);
  assert.ok(flipped[0].z < -3);
  const cleared = frontierSegments({
    'player-hq': 'player',
    'player-bar': 'player',
    'enemy-bar': 'player',
    'enemy-hq': 'player',
  });
  assert.equal(cleared, first);
  assert.equal(cleared.length, 0);
});

test('mute preference is the persisted 1/0 flag', () => {
  assert.equal(MUTE_KEY, 'bannerline.mute');
  assert.equal(isMutedValue('1'), true);
  assert.equal(isMutedValue('0'), false);
  assert.equal(isMutedValue(null), false);
  assert.equal(muteStoreValue(true), '1');
  assert.equal(muteStoreValue(false), '0');
});
