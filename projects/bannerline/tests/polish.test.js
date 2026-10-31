import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import * as THREE from 'three';
import { createMatch, playerHold, sendSquad, stepMatch, buildingById } from '../src/sim/match.js';
import { DIFFICULTIES } from '../src/sim/maps.js';
import { upgradeAffordance } from '../src/sim/upgrades.js';
import { frontierBandGeometry } from '../src/render/world.js';
import { PALETTE } from '../src/render/palette.js';
import { soldierGeometry } from '../src/render/crowds.js';

const MAPS = ['crossing', 'long-road', 'two-lanes'];
const DIFFS = ['easy', 'normal', 'hard'];

function enemyAttack(state) {
  for (let i = 0; i < state.squads.length; i++) {
    const squad = state.squads[i];
    if (squad.owner === 'enemy' && squad.count > 0) return squad;
  }
  return null;
}

test('every difficulty issues an attack within 40s', () => {
  for (let m = 0; m < MAPS.length; m++) {
    for (let d = 0; d < DIFFS.length; d++) {
      const state = createMatch({ mapId: MAPS[m], difficulty: DIFFS[d] });
      let hit = null;
      while (state.status === 'playing' && state.t < 40 && !hit) {
        stepMatch(state, 0.5);
        hit = enemyAttack(state);
      }
      assert.ok(hit, `${MAPS[m]} ${DIFFS[d]} attacked by t=${state.t.toFixed(1)}`);
      if (DIFFS[d] === 'easy') assert.ok(hit.count <= DIFFICULTIES.easy.marchCap);
    }
  }
});

test('opening grace keeps enemy marches off the player headquarters', () => {
  assert.equal(DIFFICULTIES.normal.hqGrace, 20);
  assert.equal(DIFFICULTIES.hard.hqGrace, 12);
  assert.ok(DIFFICULTIES.easy.hqGrace > DIFFICULTIES.normal.hqGrace);

  function watch(difficulty, until) {
    const state = createMatch({ mapId: 'two-lanes', difficulty });
    let saw = false;
    while (state.status === 'playing' && state.t < until) {
      stepMatch(state, 0.25);
      for (let i = 0; i < state.squads.length; i++) {
        const squad = state.squads[i];
        if (squad.owner !== 'enemy' || squad.count <= 0) continue;
        saw = true;
        assert.notEqual(squad.targetId, 'player-hq', `${difficulty} aimed at HQ at t=${state.t}`);
      }
    }
    assert.ok(saw, `${difficulty} attacked during the grace window`);
  }

  watch('easy', 30);
  watch('normal', 19.5);
  watch('hard', 11.5);
});

test('a double send on 雙橋 as the opening wave comes due still wins on 中', () => {
  const state = createMatch({ mapId: 'two-lanes', difficulty: 'normal' });
  stepMatch(state, 16);
  for (const id of ['player-west', 'player-east']) {
    const bar = buildingById(state, id);
    assert.equal(sendSquad(state, id, 'enemy-hq', playerHold(bar)).ok, true);
  }
  stepMatch(state, 30);
  assert.equal(state.status, 'win');
});

function playMeasured(difficulty, margin) {
  const state = createMatch({ mapId: 'crossing', difficulty });
  while (state.status === 'playing' && state.t < 250) {
    stepMatch(state, 1);
    const enemyHq = buildingById(state, 'enemy-hq');
    const playerHq = buildingById(state, 'player-hq');
    if (!playerHq || playerHq.owner !== 'player') break;
    const ours = state.buildings.filter((b) => b.owner === 'player' && b.kind === 'barracks');
    const foes = state.buildings.filter((b) => b.owner === 'enemy' && b.kind === 'barracks');
    foes.sort((a, b) => a.count - b.count);
    if (state.squads.some((s) => s.owner === 'player')) continue;
    const foe = foes[0];
    if (foe) {
      const donor = ours.slice().sort((a, b) => b.count - a.count)[0];
      if (donor && donor.count > foe.count + margin) {
        sendSquad(state, donor.id, foe.id, Math.max(8, Math.floor(donor.count * 0.3)));
      }
    } else if (enemyHq && enemyHq.owner === 'enemy') {
      const pile = ours.reduce((n, b) => n + b.count, 0);
      if (pile > enemyHq.count + margin) {
        for (let i = 0; i < ours.length; i++) {
          if (ours[i].count >= 16) sendSquad(state, ours[i].id, 'enemy-hq', 6);
        }
      }
    }
  }
  return state;
}

test('a measured player on 中 takes more than a minute, and the same line wins later on 難', () => {
  const times = [];
  for (const margin of [6, 8, 12]) {
    const state = playMeasured('normal', margin);
    assert.equal(state.status, 'win', `margin ${margin} ended ${state.status} at ${state.t}`);
    assert.ok(state.t > 60, `margin ${margin} won at ${state.t}`);
    times.push(state.t);
  }
  const average = times.reduce((sum, t) => sum + t, 0) / times.length;
  assert.ok(average > 60, `average ${average}`);
  const hard = playMeasured('hard', 8);
  assert.equal(hard.status, 'win', `hard ended ${hard.status} at ${hard.t}`);
  assert.ok(hard.t > 120 && hard.t < 240, `hard won at ${hard.t}`);
  assert.ok(hard.t > times[1], '難 takes longer than the same line on 中');
});

test('a barracks chain on 中 does not win before 90s, and the defence shows', () => {
  const state = createMatch({ mapId: 'crossing', difficulty: 'normal' });
  let relief = false;
  let counterAt = null;
  const seen = new Set();
  while (state.status === 'playing' && state.t < 90) {
    stepMatch(state, 0.5);
    for (let i = 0; i < state.squads.length; i++) {
      const squad = state.squads[i];
      if (squad.owner !== 'enemy' || seen.has(squad.id)) continue;
      seen.add(squad.id);
      if (squad.targetId === 'enemy-bar' || squad.targetId === 'enemy-hq') relief = true;
      if (squad.targetId === 'player-bar' || squad.targetId === 'player-hq') {
        if (counterAt == null) counterAt = state.t;
      }
    }
    const enemyBar = buildingById(state, 'enemy-bar');
    const enemyHq = buildingById(state, 'enemy-hq');
    const objective = enemyBar && enemyBar.owner === 'enemy'
      ? 'enemy-bar'
      : (enemyHq && enemyHq.owner === 'enemy' ? 'enemy-hq' : null);
    if (!objective) break;
    for (let i = 0; i < state.buildings.length; i++) {
      const building = state.buildings[i];
      if (building.owner !== 'player' || building.id === objective) continue;
      const hold = playerHold(building);
      if (building.count - hold >= 8) sendSquad(state, building.id, objective, hold);
    }
  }
  assert.notEqual(state.status, 'win', `chain won at ${state.t}`);
  assert.equal(relief, true);
  assert.ok(counterAt != null && counterAt <= 40, `counter at ${counterAt}`);
  assert.equal(state.holdWall, true);
  assert.equal(state.difficulty, 'normal');
});

test('the 中 button stores the id createMatch reads', () => {
  const src = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
  assert.match(src, /difficulty = id/);
  assert.match(src, /createMatch\(\{ mapId, difficulty/);
  assert.equal(DIFFICULTIES.normal.label, '中');
  assert.equal(DIFFICULTIES.hard.label, '難');
  const normal = createMatch({ mapId: 'crossing', difficulty: 'normal' });
  const hard = createMatch({ mapId: 'crossing', difficulty: 'hard' });
  assert.equal(normal.difficulty, 'normal');
  assert.equal(normal.holdWall, true);
  assert.ok(normal.reliefCap >= 16);
  assert.ok(normal.counterCap >= 10);
  assert.equal(hard.hqGrace, 12);
  assert.ok(hard.reactDelay < normal.reactDelay);
  assert.ok(DIFFICULTIES.easy.reactDelay > normal.reactDelay);
});

test('中 opens within a small strength gap on 對岸', () => {
  const state = createMatch({ mapId: 'crossing', difficulty: 'normal' });
  const sum = (owner) => state.buildings.reduce((n, b) => n + (b.owner === owner ? b.count : 0), 0);
  const mine = sum('player');
  const foe = sum('enemy');
  assert.ok(Math.abs(mine - foe) <= 30, `中 opens ${mine} vs ${foe}`);
  assert.ok(foe < 80, `enemy pile ${foe} is still the old reinforced open`);
});

test('易 still falls to one barracks rush', () => {
  const state = createMatch({ mapId: 'crossing', difficulty: 'easy' });
  stepMatch(state, 11.5);
  const bar = buildingById(state, 'player-bar');
  assert.equal(sendSquad(state, 'player-bar', 'enemy-hq', Math.min(6, bar.count - 1)).ok, true);
  while (state.status === 'playing' && state.t < 70) stepMatch(state, 1);
  assert.equal(state.status, 'win');
});

test('upgrade affordance is only a player building that can pay', () => {
  const player = {
    id: 'player-bar',
    kind: 'barracks',
    owner: 'player',
    count: 30,
    cap: 54,
    regen: 2.25,
    baseRegen: 2.25,
    upgrades: { haste: 0, bulwark: 0 },
  };
  assert.equal(upgradeAffordance(player), true);
  assert.equal(upgradeAffordance({ ...player, id: 'player-hq', kind: 'hq', count: 12 }), true);
  assert.equal(upgradeAffordance({ ...player, owner: 'enemy', id: 'enemy-bar' }), false);
  assert.equal(upgradeAffordance({ ...player, count: 1 }), false);
  assert.equal(upgradeAffordance({ ...player, kind: 'post' }), false);
  assert.equal(upgradeAffordance({
    ...player,
    count: 40,
    upgrades: { haste: 2, bulwark: 2 },
  }), false);
});

test('the frontier band is green on the player side and red on the enemy side', () => {
  const geo = frontierBandGeometry();
  const pos = geo.attributes.position;
  const col = geo.attributes.color;
  const vertex = new THREE.Vector3();
  const green = new THREE.Color(PALETTE.player.main);
  const red = new THREE.Color(PALETTE.enemy.main);
  let playerSide = 0;
  let enemySide = 0;
  for (let i = 0; i < pos.count; i++) {
    vertex.fromBufferAttribute(pos, i);
    const r = col.getX(i);
    const g = col.getY(i);
    const b = col.getZ(i);
    assert.ok(!(r > 0.7 && g > 0.6), `gold vertex ${r},${g},${b}`);
    if (vertex.z > 0.01) {
      assert.ok(Math.abs(r - green.r) < 0.02 && Math.abs(g - green.g) < 0.02, `player side ${r},${g},${b}`);
      assert.ok(g > r, 'player side is green');
      playerSide += 1;
    } else if (vertex.z < -0.01) {
      assert.ok(Math.abs(r - red.r) < 0.02 && Math.abs(g - red.g) < 0.02, `enemy side ${r},${g},${b}`);
      assert.ok(r > g, 'enemy side is operational red');
      enemySide += 1;
    }
  }
  assert.ok(playerSide >= 2 && enemySide >= 2);
  geo.dispose();
});

test('palette and soldiers match the military art brief', () => {
  assert.equal(PALETTE.sky, 0x7fa8c4);
  assert.equal(PALETTE.water, 0x3e6f8f);
  assert.equal(PALETTE.stream, 0x3e6f8f);
  assert.equal(PALETTE.meadow, 0x6b7a4e);
  assert.equal(PALETTE.leaf, 0x3f5a3a);
  assert.equal(PALETTE.leafDeep, 0x2f4530);
  assert.equal(PALETTE.player.main, 0x2f9e5b);
  assert.equal(PALETTE.enemy.main, 0xc43c32);
  assert.ok(PALETTE.bridge < 0x999999, 'bridge stays a neutral grey');
  const geo = soldierGeometry();
  geo.computeBoundingBox();
  const box = geo.boundingBox;
  assert.ok(box.min.z < -0.3, `rifle extends on local −z (${box.min.z})`);
  assert.ok(-box.min.z > box.max.z + 0.15, 'the rifle is longer than the pack');
  assert.ok(box.max.y > 0.4, 'helmet rises above the torso');
  geo.dispose();
});

test('the diorama grades with standard materials and a device shadow gate', () => {
  const stageSrc = readFileSync(new URL('../src/render/stage.js', import.meta.url), 'utf8');
  const worldSrc = readFileSync(new URL('../src/render/world.js', import.meta.url), 'utf8');
  const crowdSrc = readFileSync(new URL('../src/render/crowds.js', import.meta.url), 'utf8');
  const mainSrc = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
  assert.match(stageSrc, /ACESFilmicToneMapping/);
  assert.match(stageSrc, /PCFSoftShadowMap/);
  assert.match(stageSrc, /swiftshader/i);
  assert.match(worldSrc, /MeshStandardMaterial/);
  assert.match(worldSrc, /function makeTank/);
  assert.match(worldSrc, /function skyDome/);
  assert.match(crowdSrc, /MeshStandardMaterial/);
  assert.match(mainSrc, /createFx/);
  assert.match(mainSrc, /difficulty = id/);
  assert.match(mainSrc, /createMatch\(\{ mapId, difficulty/);
});
