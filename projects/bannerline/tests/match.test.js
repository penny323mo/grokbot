import assert from 'node:assert/strict';
import test from 'node:test';
import { yawForFacing, rotateXZ } from '../src/sim/facing.js';
import { NODES } from '../src/sim/mapdata.js';
import { FIRST_SEND, startingBuildings } from '../src/sim/balance.js';
import { createMatch, playerHold, retargetSquad, sendSquad, stepMatch, buildingById } from '../src/sim/match.js';
import { findPath } from '../src/sim/path.js';

test('yaw faces local −z along travel, and +z is behind the rank', () => {
  assert.equal(yawForFacing(0, -1), 0);
  assert.ok(Math.abs(yawForFacing(1, 0) - (-Math.PI / 2)) < 1e-10);
  const back = { x: 0, z: 0 };
  rotateXZ(0, 1, yawForFacing(1, 0), back);
  assert.ok(back.x < -0.9 && Math.abs(back.z) < 1e-9);
  const nose = { x: 0, z: 0 };
  rotateXZ(0, -1, yawForFacing(1, 0), nose);
  assert.ok(nose.x > 0.9 && Math.abs(nose.z) < 1e-9);
});

test('every building reaches every other building along the road', () => {
  const ids = ['player-hq', 'player-bar', 'enemy-bar', 'enemy-hq'];
  for (const a of ids) {
    for (const b of ids) {
      const path = findPath(a, b);
      assert.ok(path);
      assert.equal(path[0], a);
      assert.equal(path[path.length - 1], b);
    }
  }
  assert.equal(findPath('player-hq', 'nope'), null);
  assert.deepEqual(findPath('mid', 'mid'), ['mid']);
});

test('a squad marches, subtracts counts, and the survivor presses on', () => {
  const state = createMatch();
  state.ai = false;
  const path = findPath('player-road', 'enemy-hq');
  state.squads.push({
    id: 'a',
    owner: 'player',
    count: 11,
    targetId: 'enemy-hq',
    path,
    seg: 0,
    x: 0,
    z: 0.4,
    mode: 'march',
  });
  state.squads.push({
    id: 'b',
    owner: 'enemy',
    count: 4,
    targetId: 'player-hq',
    path: findPath('enemy-road', 'player-hq'),
    seg: 0,
    x: 0.1,
    z: 0.45,
    mode: 'march',
  });
  stepMatch(state, 1.15, { ai: false });
  const a = state.squads.find((s) => s.id === 'a');
  const b = state.squads.find((s) => s.id === 'b');
  assert.equal(b, undefined);
  assert.ok(a);
  assert.equal(a.count, 7);
  assert.ok(a.z < 0, `survivor should keep marching toward −z, z=${a.z}`);
  assert.equal(a.mode === 'fight', false);
});

test('capturing the enemy barracks flips it and does not end the match', () => {
  const state = createMatch();
  state.ai = false;
  buildingById(state, 'player-bar').count = 24;
  buildingById(state, 'enemy-bar').count = 6;
  const sent = sendSquad(state, 'player-bar', 'enemy-bar');
  assert.equal(sent.ok, true);
  assert.equal(buildingById(state, 'player-bar').count, 0);
  stepMatch(state, 12, { ai: false });
  const bar = buildingById(state, 'enemy-bar');
  assert.equal(bar.owner, 'player');
  assert.ok(bar.count > 0);
  assert.equal(state.status, 'playing');
  assert.equal(state.squads.some((s) => s.owner === 'player' && s.targetId === 'enemy-bar'), false);
});

test('taking the enemy headquarters wins; losing yours loses', () => {
  const win = createMatch();
  win.ai = false;
  buildingById(win, 'player-bar').count = 20;
  buildingById(win, 'enemy-hq').count = 4;
  assert.equal(sendSquad(win, 'player-bar', 'enemy-hq').ok, true);
  stepMatch(win, 15, { ai: false });
  assert.equal(buildingById(win, 'enemy-hq').owner, 'player');
  assert.equal(win.status, 'win');

  const lose = createMatch();
  lose.ai = false;
  buildingById(lose, 'enemy-bar').count = 30;
  buildingById(lose, 'player-hq').count = 5;
  assert.equal(sendSquad(lose, 'enemy-bar', 'player-hq').ok, true);
  stepMatch(lose, 15, { ai: false });
  assert.equal(buildingById(lose, 'player-hq').owner, 'enemy');
  assert.equal(lose.status, 'lose');
});

test('both starting stacks together cannot crack the enemy headquarters', () => {
  const state = createMatch();
  state.ai = false;
  assert.equal(sendSquad(state, 'player-bar', 'enemy-hq').ok, true);
  assert.equal(sendSquad(state, 'player-hq', 'enemy-hq').ok, true);
  stepMatch(state, 12, { ai: false });
  assert.equal(buildingById(state, 'enemy-hq').owner, 'enemy');
  assert.notEqual(state.status, 'win');
});

test('a full barracks alone does not crack the reinforced headquarters', () => {
  const state = createMatch();
  state.ai = false;
  const bar = buildingById(state, 'player-bar');
  bar.count = bar.cap;
  assert.equal(sendSquad(state, 'player-bar', 'enemy-hq').ok, true);
  stepMatch(state, 12, { ai: false });
  assert.equal(buildingById(state, 'enemy-hq').owner, 'enemy');
  assert.notEqual(state.status, 'win');
});

test('reinforcing a friendly building deposits the squad', () => {
  const state = createMatch();
  state.ai = false;
  buildingById(state, 'player-hq').count = 8;
  buildingById(state, 'player-bar').count = 10;
  sendSquad(state, 'player-bar', 'player-hq');
  stepMatch(state, 8, { ai: false });
  assert.equal(buildingById(state, 'player-hq').count, 18);
  assert.equal(state.squads.length, 0);
  assert.equal(NODES['player-hq'].z > 0, true);
});

test('friendly reinforce stops at the cap and keeps the surplus with the squad', () => {
  const state = createMatch();
  state.ai = false;
  const hq = buildingById(state, 'player-hq');
  hq.count = hq.cap - 3;
  buildingById(state, 'player-bar').count = 10;
  sendSquad(state, 'player-bar', 'player-hq');
  stepMatch(state, 8, { ai: false });
  assert.equal(hq.count, hq.cap);
  assert.equal(state.squads.length, 1);
  assert.equal(state.squads[0].count, 7);
  assert.equal(state.squads[0].targetId, 'player-hq');
  assert.equal(Math.hypot(state.squads[0].x - NODES['player-hq'].x, state.squads[0].z - NODES['player-hq'].z) < 0.2, true);
});

test('a parked surplus squad can be ordered onward without touching the garrison', () => {
  const state = createMatch();
  state.ai = false;
  const hq = buildingById(state, 'player-hq');
  hq.count = hq.cap;
  buildingById(state, 'player-bar').count = 9;
  assert.equal(sendSquad(state, 'player-bar', 'player-hq').ok, true);
  stepMatch(state, 8, { ai: false });
  assert.equal(state.squads.length, 1);
  const parked = state.squads[0];
  assert.equal(parked.count, 9);
  assert.equal(hq.count, hq.cap);
  const res = retargetSquad(state, parked.id, 'enemy-bar');
  assert.equal(res.ok, true);
  assert.equal(hq.count, hq.cap);
  assert.equal(parked.targetId, 'enemy-bar');
  assert.equal(parked.mode, 'march');
  assert.equal(parked.path[0], 'player-hq');
  assert.ok(parked.path.length >= 2);
  const z0 = parked.z;
  stepMatch(state, 0.4, { ai: false });
  assert.ok(parked.z < z0, `surplus should march toward −z, z=${parked.z}`);
  assert.equal(hq.count, hq.cap);
});

test('retarget keeps a marching squad on its current segment', () => {
  const state = createMatch();
  state.ai = false;
  state.squads.push({
    id: 'sqX',
    owner: 'player',
    count: 5,
    targetId: 'enemy-hq',
    path: ['player-road', 'mid', 'enemy-road', 'enemy-hq'],
    seg: 0,
    x: 0,
    z: 1.5,
    mode: 'march',
  });
  const res = retargetSquad(state, 'sqX', 'player-hq');
  assert.equal(res.ok, true);
  const squad = state.squads[0];
  assert.equal(squad.path[0], 'player-road');
  assert.equal(squad.path[1], 'mid');
  assert.equal(squad.mode, 'march');
  assert.equal(squad.targetId, 'player-hq');
  stepMatch(state, 0.2, { ai: false });
  assert.ok(squad.z < 1.5, `should finish the segment toward mid, z=${squad.z}`);
});

test('a player order leaves a garrison, and a full barracks still outnumbers the enemy headquarters', () => {
  const state = createMatch();
  const bar = buildingById(state, 'player-bar');
  bar.count = bar.cap;
  const hold = playerHold(bar);
  assert.ok(hold >= 1 && hold <= 6);
  const sent = sendSquad(state, 'player-bar', 'enemy-hq', hold);
  assert.equal(sent.ok, true);
  assert.equal(bar.count, hold);
  assert.ok(sent.count > 44);
});

test('the enemy barracks waits until after the player barracks first reads full', () => {
  const bar = startingBuildings().find((b) => b.id === 'player-bar');
  const fullAt = (bar.cap - bar.count) / bar.regen;
  assert.ok(fullAt > 10 && fullAt < 11);
  assert.ok(FIRST_SEND['enemy-bar'] > fullAt + 1);
});

test('a full send just after 滿 does not win 中 before 90s', () => {
  const state = createMatch();
  stepMatch(state, 11.5);
  const bar = buildingById(state, 'player-bar');
  assert.ok(bar.count >= bar.cap);
  assert.equal(sendSquad(state, 'player-bar', 'enemy-hq').ok, true);
  while (state.status === 'playing' && state.t < 90) stepMatch(state, 1);
  assert.notEqual(state.status, 'win');
});

test('the same rush with a garrison does not win 中 before 90s', () => {
  const state = createMatch();
  stepMatch(state, 11.5);
  const bar = buildingById(state, 'player-bar');
  const hold = playerHold(bar);
  assert.equal(sendSquad(state, 'player-bar', 'enemy-hq', hold).ok, true);
  assert.equal(bar.count, hold);
  while (state.status === 'playing' && state.t < 90) stepMatch(state, 1);
  assert.notEqual(state.status, 'win');
});

test('idling loses the headquarters', () => {
  const state = createMatch();
  stepMatch(state, 65);
  assert.equal(state.status, 'lose');
  assert.equal(buildingById(state, 'player-hq').owner, 'enemy');
});

test('an enemy headquarters of 14 still sends a probe and keeps a garrison', () => {
  const state = createMatch();
  for (let i = 0; i < state.buildings.length; i++) {
    const b = state.buildings[i];
    if (b.owner === 'enemy' && b.id !== 'enemy-hq') b.count = 0;
  }
  const hq = buildingById(state, 'enemy-hq');
  hq.count = 14;
  state.nextSendAt['enemy-hq'] = 0;
  state.t = 30;
  stepMatch(state, 0.2);
  const squad = state.squads.find((s) => s.owner === 'enemy');
  assert.ok(squad);
  assert.ok(squad.count >= 8);
  assert.ok(hq.count > 0 && hq.count < 14);
});

test('client NDC maps the canvas centre and corners', async () => {
  const { clientToNdc } = await import('../src/render/pointer-math.js');
  const rect = { left: 10, top: 20, width: 390, height: 844 };
  const mid = clientToNdc(10 + 195, 20 + 422, rect);
  assert.ok(Math.abs(mid.x) < 1e-9);
  assert.ok(Math.abs(mid.y) < 1e-9);
  const tl = clientToNdc(10, 20, rect);
  assert.equal(tl.x, -1);
  assert.equal(tl.y, 1);
  const br = clientToNdc(400, 864, rect);
  assert.equal(br.x, 1);
  assert.equal(br.y, -1);
});
