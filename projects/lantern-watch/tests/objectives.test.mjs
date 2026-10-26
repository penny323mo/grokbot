/**
 * tests/objectives.test.mjs
 * Unit tests for win & lose conditions across all 4 chapters:
 * - escort: cart arrives at destination (win), cart destroyed or turn limit reached (lose)
 * - hold_gate: survive 8 turns (win), enemy penetrates gate tile (lose)
 * - protect_lantern: survive 10 turns (win), lantern destroyed (lose)
 * - defeat_boss_or_reach: boss KO or ally reaches shrine exit (win), team wipe (lose)
 */

import assert from 'node:assert';
import test from 'node:test';
import { checkBattleStatus } from '../js/engine/objectives.js';
import { CHAPTERS } from '../js/data/maps.js';

test('Objectives: Escort chapter (River Bridge)', () => {
  const chapter = CHAPTERS.find(c => c.key === 'river_bridge');

  // Case 1: In progress
  const cartInProgress = { id: 'lantern_cart', role: 'npc', hp: 20, x: 2, y: 8 };
  const ally = { id: 'bear_guard', role: 'tank', hp: 30, x: 3, y: 7 };
  const enemy = { id: 'fog_rider', hp: 20, x: 5, y: 3 };

  let status = checkBattleStatus(chapter, {
    currentTurn: 3,
    allies: [cartInProgress, ally],
    enemies: [enemy]
  });
  assert.strictEqual(status.finished, false);

  // Case 2: Cart arrives at north-east destination (row <= 2, col >= 6) -> WIN!
  const cartAtGoal = { id: 'lantern_cart', role: 'npc', hp: 20, x: 7, y: 1 };
  status = checkBattleStatus(chapter, {
    currentTurn: 5,
    allies: [cartAtGoal, ally],
    enemies: [enemy]
  });
  assert.strictEqual(status.finished, true);
  assert.strictEqual(status.victory, true);

  // Case 3: Cart destroyed -> LOSE!
  const cartDead = { id: 'lantern_cart', role: 'npc', hp: 0, x: 3, y: 6 };
  status = checkBattleStatus(chapter, {
    currentTurn: 4,
    allies: [cartDead, ally],
    enemies: [enemy]
  });
  assert.strictEqual(status.finished, true);
  assert.strictEqual(status.victory, false);

  // Case 4: Turn limit exceeded -> LOSE!
  status = checkBattleStatus(chapter, {
    currentTurn: 13, // max is 12
    allies: [cartInProgress, ally],
    enemies: [enemy]
  });
  assert.strictEqual(status.finished, true);
  assert.strictEqual(status.victory, false);
});

test('Objectives: Hold Gate chapter', () => {
  const chapter = CHAPTERS.find(c => c.key === 'gate');
  const ally = { id: 'bear_guard', role: 'tank', hp: 30, x: 4, y: 7 };

  // Case 1: Enemy reaches gate tile (4, 6) -> LOSE!
  const enemyBreached = { id: 'fog_rider', hp: 20, x: 4, y: 6 }; // (4,6) is gate
  let status = checkBattleStatus(chapter, {
    currentTurn: 3,
    allies: [ally],
    enemies: [enemyBreached]
  });
  assert.strictEqual(status.finished, true);
  assert.strictEqual(status.victory, false);

  // Case 2: Turn 8 reached without breach -> WIN!
  const enemyOutside = { id: 'fog_rider', hp: 20, x: 4, y: 3 };
  status = checkBattleStatus(chapter, {
    currentTurn: 8,
    allies: [ally],
    enemies: [enemyOutside]
  });
  assert.strictEqual(status.finished, true);
  assert.strictEqual(status.victory, true);
});

test('Objectives: Protect Lantern chapter', () => {
  const chapter = CHAPTERS.find(c => c.key === 'market');
  const ally = { id: 'cat_patrol', role: 'flanker', hp: 25, x: 4, y: 5 };

  // Case 1: Lantern destroyed -> LOSE!
  const lanternDead = { id: 'market_lantern', role: 'objective', hp: 0, x: 4, y: 6 };
  const enemy = { id: 'shadow_rat', hp: 16, x: 3, y: 6 };
  let status = checkBattleStatus(chapter, {
    currentTurn: 5,
    allies: [ally, lanternDead],
    enemies: [enemy]
  });
  assert.strictEqual(status.finished, true);
  assert.strictEqual(status.victory, false);

  // Case 2: 10 turns survived with lantern intact -> WIN!
  const lanternAlive = { id: 'market_lantern', role: 'objective', hp: 22, x: 4, y: 6 };
  status = checkBattleStatus(chapter, {
    currentTurn: 10,
    allies: [ally, lanternAlive],
    enemies: [enemy]
  });
  assert.strictEqual(status.finished, true);
  assert.strictEqual(status.victory, true);
});

test('Objectives: Mountain chapter (defeat boss or reach shrine)', () => {
  const chapter = CHAPTERS.find(c => c.key === 'mountain');

  // Case 1: Boss defeated -> WIN!
  const bossDead = { id: 'iron_general', hp: 0, x: 4, y: 2 };
  const ally = { id: 'crane_rider', role: 'flyer', hp: 24, x: 4, y: 5 };
  let status = checkBattleStatus(chapter, {
    currentTurn: 4,
    allies: [ally],
    enemies: [bossDead]
  });
  assert.strictEqual(status.finished, true);
  assert.strictEqual(status.victory, true);

  // Case 2: Ally reaches shrine exit tile (4, 0) -> WIN!
  const bossAlive = { id: 'iron_general', hp: 40, x: 4, y: 2 };
  const allyAtExit = { id: 'cat_patrol', role: 'flanker', hp: 20, x: 4, y: 0 }; // shrine exit
  status = checkBattleStatus(chapter, {
    currentTurn: 6,
    allies: [allyAtExit],
    enemies: [bossAlive]
  });
  assert.strictEqual(status.finished, true);
  assert.strictEqual(status.victory, true);
});

test('Objectives: Bamboo Pass chapter (reach shrine or rout all enemies)', () => {
  const chapter = CHAPTERS.find(c => c.key === 'bamboo_pass');
  assert.ok(chapter, 'Chapter 5 should exist');

  // Case 1: Ally reaches shrine altar (4, 1) -> WIN!
  const allyAtShrine = { id: 'cat_patrol', role: 'flanker', hp: 20, x: 4, y: 1 };
  const enemy = { id: 'shield_guard', hp: 30, x: 4, y: 5 };
  let status = checkBattleStatus(chapter, {
    currentTurn: 5,
    allies: [allyAtShrine],
    enemies: [enemy]
  });
  assert.strictEqual(status.finished, true);
  assert.strictEqual(status.victory, true);

  // Case 2: All enemies routed -> WIN!
  const allyInPass = { id: 'bear_guard', role: 'tank', hp: 25, x: 4, y: 6 };
  status = checkBattleStatus(chapter, {
    currentTurn: 4,
    allies: [allyInPass],
    enemies: []
  });
  assert.strictEqual(status.finished, true);
  assert.strictEqual(status.victory, true);
});
