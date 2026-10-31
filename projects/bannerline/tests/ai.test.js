import assert from 'node:assert/strict';
import test from 'node:test';
import { bestTarget, canIssue, hqKeep, writeOrder } from '../src/sim/ai.js';
import { buildingById, createMatch, stepMatch } from '../src/sim/match.js';
import { findPath } from '../src/sim/path.js';

const nearBar = { id: 'player-bar', kind: 'barracks', count: 8, travel: 4 };
const farHq = { id: 'player-hq', kind: 'hq', count: 4, travel: 12 };
const weakHq = { id: 'player-hq', kind: 'hq', count: 0, travel: 9 };
const fatBar = { id: 'player-bar', kind: 'barracks', count: 40, travel: 3 };

test('balanced picks the nearer building, aggressive values the headquarters, cautious avoids it', () => {
  assert.equal(bestTarget('balanced', [farHq, nearBar], 2).id, 'player-bar');
  assert.equal(bestTarget('aggressive', [fatBar, weakHq], 2).id, 'player-hq');
  assert.equal(bestTarget('cautious', [weakHq, nearBar], 2).id, 'player-bar');
});

test('a cooldown still answers an attack after the reaction delay, and only once', () => {
  assert.equal(canIssue(10, 100, false, null, 2.2, false), false);
  assert.equal(canIssue(12, 100, true, 10, 2.2, false), false);
  assert.equal(canIssue(12.2, 100, true, 10, 2.2, false), true);
  assert.equal(canIssue(14, 100, true, 10, 2.2, true), false);
  assert.equal(canIssue(100, 100, false, null, 2.2, true), true);
});

test('a headquarters of 14 still probes, and a thin garrison sallies while defending', () => {
  assert.equal(hqKeep(14), 6);
  const out = { targetId: '', keep: 0 };
  const probe = writeOrder({
    t: 30,
    nextSendAt: 0,
    underAttack: false,
    alarmAt: null,
    reactDelay: 2.2,
    answered: false,
    count: 14,
    kind: 'hq',
    buildingId: 'enemy-hq',
    personality: 'balanced',
    sendMin: 16,
    threatenedId: null,
    ownsThreatened: false,
    targets: [nearBar, farHq],
    targetCount: 2,
  }, out);
  assert.equal(probe, true);
  assert.equal(out.keep, 6);
  assert.equal(out.targetId, 'player-bar');
  assert.equal(14 - out.keep, 8);

  const thin = writeOrder({
    t: 12.2,
    nextSendAt: 100,
    underAttack: true,
    alarmAt: 10,
    reactDelay: 2.2,
    answered: false,
    count: 3,
    kind: 'barracks',
    buildingId: 'enemy-bar',
    personality: 'balanced',
    sendMin: 16,
    threatenedId: 'enemy-bar',
    ownsThreatened: true,
    targets: [nearBar],
    targetCount: 1,
  }, out);
  assert.equal(thin, true);
  assert.equal(out.keep, 1);
  assert.equal(out.targetId, 'player-bar');

  const waiting = writeOrder({
    t: 11,
    nextSendAt: 100,
    underAttack: true,
    alarmAt: 10,
    reactDelay: 2.2,
    answered: false,
    count: 3,
    kind: 'barracks',
    buildingId: 'enemy-bar',
    personality: 'balanced',
    sendMin: 16,
    threatenedId: 'enemy-bar',
    ownsThreatened: true,
    targets: [nearBar],
    targetCount: 1,
  }, out);
  assert.equal(waiting, false);
});

test('a building under attack does not sit idle past the reaction window', () => {
  const state = createMatch();
  const bar = buildingById(state, 'enemy-bar');
  const hq = buildingById(state, 'enemy-hq');
  bar.count = 3;
  hq.count = 0;
  state.nextSendAt['enemy-bar'] = 100;
  state.nextSendAt['enemy-hq'] = 100;
  state.t = 10;
  const path = findPath('player-hq', 'enemy-bar');
  state.squads.push({
    id: 'threat',
    owner: 'player',
    count: 12,
    targetId: 'enemy-bar',
    path,
    seg: 0,
    x: 0,
    z: 6.55,
    mode: 'march',
  });
  stepMatch(state, 1);
  const sally = state.squads.find((s) => s.owner === 'enemy');
  assert.ok(sally, 'enemy should march out while the barracks is threatened');
  assert.ok(sally.count >= 1);
  assert.ok(bar.count < 3);
});
