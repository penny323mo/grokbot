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

test('Objectives: Escort cart movement, 護衛 damage reduction, and speed/hold orders', async () => {
  const { Battle } = await import('../js/engine/battle.js');
  const { calculateCombat, executeCombat } = await import('../js/engine/combat.js');
  const { Board } = await import('../js/engine/board.js');
  const chapter = CHAPTERS.find(c => c.key === 'river_bridge');

  const squad = [
    { id: 'bear_guard', name: '熊岳', team: 'ally', hp: 35, maxHp: 35, atk: 12, def: 8, mov: 3 },
    { id: 'cat_patrol', name: '墨影', team: 'ally', hp: 28, maxHp: 28, atk: 14, def: 4, mov: 5 }
  ];
  const battle = new Battle(chapter, squad);

  const cart = battle.getEscortCart();
  assert.ok(cart, 'Escort cart must be present in chapter 1');
  assert.strictEqual(cart.id, 'lantern_cart');

  // 1. Initial position & 護衛 guarded state (bear_guard is adjacent at (1,8) to cart at (1,9))
  assert.strictEqual(cart.x, 1);
  assert.strictEqual(cart.y, 9);
  assert.strictEqual(battle.isCartGuarded(), true, 'Cart with adjacent ally must be in 護衛 state');

  // 2. Guarded damage reduction: 50% damage reduction when attacked
  const enemyAttacker = { id: 'shadow_archer', name: '影弓', team: 'enemy', x: 1, y: 7, atk: 16, def: 2, range: 2, facing: 1 };
  const previewGuarded = calculateCombat(enemyAttacker, cart, battle.board, { battle });
  const previewUnguarded = calculateCombat(enemyAttacker, cart, battle.board, { battle, isCartGuarded: false });
  assert.ok(previewGuarded.expectedDamage < previewUnguarded.expectedDamage, 'Guarded cart must take reduced damage');
  assert.strictEqual(previewGuarded.expectedDamage, Math.max(1, Math.floor(previewUnguarded.expectedDamage * 0.5)));

  // 3. Normal path advance: advanceEscortCart moves 1 step along escortPath
  const initialStep = battle.escortStep;
  battle.advanceEscortCart();
  assert.strictEqual(battle.escortStep, initialStep + 1);
  assert.strictEqual(cart.x, chapter.escortPath[battle.escortStep].x);
  assert.strictEqual(cart.y, chapter.escortPath[battle.escortStep].y);

  // 4. Hold order: cartHold stops cart movement for the turn
  battle.triggerCartHold();
  const stepBeforeHold = battle.escortStep;
  battle.advanceEscortCart();
  assert.strictEqual(battle.escortStep, stepBeforeHold, 'Cart must hold position when cartHold is active');

  // 5. Speed order: triggerCartSpeed advances 2 steps
  battle.triggerCartSpeed();
  const stepBeforeSpeed = battle.escortStep;
  battle.advanceEscortCart();
  assert.strictEqual(battle.escortStep, stepBeforeSpeed + 2, 'Cart must advance 2 steps when cartSpeedBoost is active');
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

  // Case 1: Ally reaches shrine altar (4, 0) -> WIN!
  const allyAtShrine = { id: 'cat_patrol', role: 'flanker', hp: 20, x: 4, y: 0 };
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

test('Objectives: Siege chapter (breach gate or defeat citadel warlord)', () => {
  const chapter = CHAPTERS.find(c => c.key === 'siege');
  assert.ok(chapter, 'Chapter 6 should exist');

  // Case 1: Citadel warlord defeated -> WIN!
  const bossDead = { id: 'citadel_warlord', hp: 0, x: 4, y: 2 };
  const wallArcher = { id: 'shadow_archer', hp: 15, x: 2, y: 4 };
  const ally = { id: 'crane_rider', role: 'flanker', hp: 22, x: 4, y: 3 };

  let status = checkBattleStatus(chapter, {
    currentTurn: 6,
    allies: [ally],
    enemies: [bossDead, wallArcher]
  });
  assert.strictEqual(status.finished, true);
  assert.strictEqual(status.victory, true);
  assert.ok(status.reason.includes('斬殺鎮關主將'));

  // Case 2: All enemies routed -> WIN!
  status = checkBattleStatus(chapter, {
    currentTurn: 8,
    allies: [ally],
    enemies: []
  });
  assert.strictEqual(status.finished, true);
  assert.strictEqual(status.victory, true);

  // Case 3: Turn limit exceeded -> LOSE!
  status = checkBattleStatus(chapter, {
    currentTurn: 16, // max 15
    allies: [ally],
    enemies: [wallArcher]
  });
  assert.strictEqual(status.finished, true);
  assert.strictEqual(status.victory, false);
});

test('Objectives: Side battle marsh chapter (survive or rout sorcerer)', () => {
  const chapter = CHAPTERS.find(c => c.key === 'side_marsh');
  assert.ok(chapter, 'Side battle chapter 7 should exist');

  const ally = { id: 'cat_patrol', role: 'flanker', hp: 20, x: 2, y: 8 };
  const sorcerer = { id: 'curse_sorcerer', hp: 30, x: 4, y: 2 };
  const rat = { id: 'shadow_rat', hp: 16, x: 2, y: 6 };

  // Case 1: In progress
  let status = checkBattleStatus(chapter, {
    currentTurn: 3,
    allies: [ally],
    enemies: [sorcerer, rat]
  });
  assert.strictEqual(status.finished, false);

  // Case 2: Sorcerer boss defeated -> WIN!
  const sorcererDead = { id: 'curse_sorcerer', hp: 0, x: 4, y: 2 };
  status = checkBattleStatus(chapter, {
    currentTurn: 5,
    allies: [ally],
    enemies: [sorcererDead, rat]
  });
  assert.strictEqual(status.finished, true);
  assert.strictEqual(status.victory, true);
  assert.ok(status.reason.includes('荒澤妖術師已被斬殺'));

  // Case 3: All enemies routed -> WIN!
  status = checkBattleStatus(chapter, {
    currentTurn: 6,
    allies: [ally],
    enemies: []
  });
  assert.strictEqual(status.finished, true);
  assert.strictEqual(status.victory, true);

  // Case 4: Turn limit exceeded -> LOSE!
  status = checkBattleStatus(chapter, {
    currentTurn: 13, // max 12
    allies: [ally],
    enemies: [sorcerer, rat]
  });
  assert.strictEqual(status.finished, true);
  assert.strictEqual(status.victory, false);
});

test('Objectives: Mountain ambush chapter (defeat warlord or break phalanx)', () => {
  const chapter = CHAPTERS.find(c => c.key === 'mountain_ambush');
  assert.ok(chapter, 'Chapter 8 should exist');

  const ally = { id: 'bear_guard', role: 'tank', hp: 30, x: 4, y: 7 };
  const boss = { id: 'mountain_warlord', hp: 36, x: 4, y: 1 };
  const phalanx = { id: 'shield_phalanx', hp: 28, x: 4, y: 3 };

  // Case 1: In progress
  let status = checkBattleStatus(chapter, {
    currentTurn: 2,
    allies: [ally],
    enemies: [boss, phalanx]
  });
  assert.strictEqual(status.finished, false);

  // Case 2: Mountain warlord boss defeated -> WIN!
  const bossDead = { id: 'mountain_warlord', hp: 0, x: 4, y: 1 };
  status = checkBattleStatus(chapter, {
    currentTurn: 4,
    allies: [ally],
    enemies: [bossDead, phalanx]
  });
  assert.strictEqual(status.finished, true);
  assert.strictEqual(status.victory, true);
  assert.ok(status.reason.includes('斬殺伏兵統領'));

  // Case 3: All enemies routed -> WIN!
  status = checkBattleStatus(chapter, {
    currentTurn: 5,
    allies: [ally],
    enemies: []
  });
  assert.strictEqual(status.finished, true);
  assert.strictEqual(status.victory, true);
  assert.ok(status.reason.includes('全殲山道伏兵'));

  // Case 4: Turn limit exceeded -> LOSE!
  status = checkBattleStatus(chapter, {
    currentTurn: 8, // max 6
    allies: [ally],
    enemies: [boss, phalanx]
  });
  assert.strictEqual(status.finished, true);
  assert.strictEqual(status.victory, false);
});
