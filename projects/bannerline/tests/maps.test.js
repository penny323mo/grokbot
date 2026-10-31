import assert from 'node:assert/strict';
import test from 'node:test';
import { NODES } from '../src/sim/mapdata.js';
import { DIFFICULTIES, MAP_LIST, scaleFirstSend, validateMap } from '../src/sim/maps.js';

const CLASSIC = {
  'player-hq': { x: 0, z: 6.55 },
  'player-bar': { x: 1.72, z: 3.05 },
  'player-road': { x: 0, z: 3.05 },
  mid: { x: 0, z: 0 },
  'enemy-road': { x: 0, z: -3.05 },
  'enemy-bar': { x: -1.72, z: -3.05 },
  'enemy-hq': { x: 0, z: -6.55 },
};

test('three hand-authored maps validate and crossing keeps the classic road', () => {
  assert.ok(MAP_LIST.length >= 3);
  const ids = new Set();
  for (let i = 0; i < MAP_LIST.length; i++) {
    const map = MAP_LIST[i];
    ids.add(map.id);
    assert.deepEqual(validateMap(map), []);
    assert.ok(map.name);
    assert.ok(map.blurb);
  }
  assert.equal(ids.size, MAP_LIST.length);
  for (const id of Object.keys(CLASSIC)) {
    assert.equal(NODES[id].x, CLASSIC[id].x);
    assert.equal(NODES[id].z, CLASSIC[id].z);
  }
});

test('normal difficulty does not shift the classic first send', () => {
  assert.equal(DIFFICULTIES.normal.firstShift, 0);
  assert.equal(DIFFICULTIES.normal.label, '中');
  assert.equal(scaleFirstSend(16, DIFFICULTIES.normal), 16);
  assert.equal(scaleFirstSend(22, DIFFICULTIES.normal), 22);
  assert.equal(scaleFirstSend(16, DIFFICULTIES.easy), 16);
  assert.equal(scaleFirstSend(16, DIFFICULTIES.hard), 10);
  assert.ok(DIFFICULTIES.hard.reactDelay < DIFFICULTIES.normal.reactDelay);
  assert.ok(DIFFICULTIES.easy.reactDelay > DIFFICULTIES.normal.reactDelay);
});
