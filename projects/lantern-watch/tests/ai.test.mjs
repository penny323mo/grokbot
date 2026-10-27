/**
 * tests/ai.test.mjs
 * Unit tests for deterministic enemy role AI:
 * - archer kites when threatened by adjacent player unit
 * - healer stays back and heals lowest-HP ally
 * - cavalry charges exposed/backline unit
 * - commander holds position and faces threat
 */

import assert from 'node:assert';
import test from 'node:test';
import { Board } from '../js/engine/board.js';
import { decideEnemyTurn } from '../js/engine/ai.js';
import { RNG } from '../js/engine/rng.js';

test('AI: Archer kites away when player unit is adjacent', () => {
  const terrain = Array(13).fill("..........");
  const board = new Board(terrain);
  const rng = new RNG(123);

  // Archer at (5, 5), player swordsman adjacent at (5, 6)
  const archer = {
    id: 'shadow_archer',
    role: 'archer',
    cls: '弓手',
    team: 'enemy',
    x: 5,
    y: 5,
    hp: 18,
    maxHp: 18,
    atk: 10,
    def: 3,
    spd: 9,
    mov: 4,
    range: [2, 3],
    facing: 1
  };

  const playerSwordsman = {
    id: 'cat_patrol',
    team: 'ally',
    x: 5,
    y: 6, // Distance 1: adjacent!
    hp: 25,
    maxHp: 25,
    def: 5,
    spd: 12
  };

  const decision = decideEnemyTurn(archer, {
    board,
    allies: [playerSwordsman],
    enemies: [archer]
  }, rng);

  // Archer should kite (move to a tile not adjacent to swordsman, e.g. distance >= 2)
  assert.ok(decision.move, 'Archer must choose a move');
  const endDist = Board.manhattan(decision.move.x, decision.move.y, playerSwordsman.x, playerSwordsman.y);
  assert.ok(endDist >= 2, `Archer should retreat to safe distance >= 2, actual: ${endDist}`);
  if (decision.type === 'attack') {
    assert.strictEqual(decision.target.id, playerSwordsman.id);
  }
});

test('AI: Healer stays >=2 tiles back and heals lowest-HP ally', () => {
  const terrain = Array(13).fill("..........");
  const board = new Board(terrain);
  const rng = new RNG(456);

  const healer = {
    id: 'mist_shaman',
    role: 'healer',
    cls: '術士',
    team: 'enemy',
    x: 8,
    y: 2,
    hp: 22,
    maxHp: 22,
    atk: 4,
    def: 3,
    mov: 3,
    range: 2
  };

  const injuredAlly1 = {
    id: 'wounded_rider',
    role: 'cavalry',
    team: 'enemy',
    x: 6,
    y: 4,
    hp: 15,
    maxHp: 22
  };

  const criticalAlly2 = {
    id: 'critical_ghost',
    role: 'spirit',
    team: 'enemy',
    x: 7,
    y: 3,
    hp: 4, // 20% HP (critically low)
    maxHp: 20
  };

  const playerTank = {
    id: 'bear_guard',
    team: 'ally',
    x: 5,
    y: 6,
    hp: 36,
    maxHp: 36
  };

  const decision = decideEnemyTurn(healer, {
    board,
    allies: [playerTank],
    enemies: [healer, injuredAlly1, criticalAlly2]
  }, rng);

  assert.strictEqual(decision.type, 'heal', 'Healer must choose heal action');
  assert.strictEqual(decision.target.id, criticalAlly2.id, 'Healer must target lowest HP% ally');

  // Verify healer kept distance from playerTank
  const distToPlayer = Board.manhattan(decision.move.x, decision.move.y, playerTank.x, playerTank.y);
  assert.ok(distToPlayer >= 2, 'Healer must stay back from frontline player unit');
});

test('AI: Cavalry targets exposed backline unit with charge', () => {
  const terrain = Array(13).fill("..........");
  const board = new Board(terrain);
  const rng = new RNG(789);

  const cavalry = {
    id: 'fog_rider',
    role: 'cavalry',
    cls: '騎兵',
    team: 'enemy',
    x: 2,
    y: 0,
    hp: 22,
    maxHp: 22,
    atk: 12,
    def: 4,
    mov: 6,
    range: 1,
    trait: { id: 'cavalry_charge' }
  };

  // Frontline heavy tank with an ally adjacent
  const frontTank = {
    id: 'bear_guard',
    team: 'ally',
    role: 'tank',
    x: 2,
    y: 4,
    hp: 36,
    def: 10
  };

  // Squishy healer in backline at (5, 4), no adjacent allies (isolated)
  const backHealer = {
    id: 'tea_master',
    team: 'ally',
    role: 'healer',
    x: 5,
    y: 4,
    hp: 24,
    def: 4
  };

  const decision = decideEnemyTurn(cavalry, {
    board,
    allies: [frontTank, backHealer],
    enemies: [cavalry]
  }, rng);

  assert.strictEqual(decision.type, 'attack');
  assert.strictEqual(decision.target.id, backHealer.id, 'Cavalry should prioritize isolated squishy backline target');
  assert.ok(decision.movedTiles >= 3, 'Cavalry should charge >= 3 tiles for bonus');
});

test('AI: Commander holds position and only attacks adjacent', () => {
  const terrain = Array(13).fill("..........");
  const board = new Board(terrain);
  const rng = new RNG(999);

  const commander = {
    id: 'iron_general',
    role: 'commander',
    cls: '重將',
    team: 'enemy',
    x: 5,
    y: 2,
    hp: 45,
    maxHp: 45,
    atk: 14,
    def: 12,
    mov: 3,
    range: 1,
    facing: -1
  };

  // Player unit is distant at (5, 6) (distance 4)
  const distantPlayer = {
    id: 'cat_patrol',
    team: 'ally',
    x: 5,
    y: 6,
    hp: 28,
    def: 5
  };

  const decision1 = decideEnemyTurn(commander, {
    board,
    allies: [distantPlayer],
    enemies: [commander]
  }, rng);

  // Commander does NOT rush forward; holds position!
  assert.strictEqual(decision1.type, 'wait');
  assert.strictEqual(decision1.move.x, 5);
  assert.strictEqual(decision1.move.y, 2);

  // If player moves adjacent at (5, 3) (distance 1)
  const adjacentPlayer = {
    id: 'cat_patrol',
    team: 'ally',
    x: 5,
    y: 3,
    hp: 28,
    def: 5
  };

  const decision2 = decideEnemyTurn(commander, {
    board,
    allies: [adjacentPlayer],
    enemies: [commander]
  }, rng);

  // Commander attacks adjacent target from holding tile
  assert.strictEqual(decision2.type, 'attack');
  assert.strictEqual(decision2.target.id, adjacentPlayer.id);
  assert.strictEqual(decision2.move.x, 5);
  assert.strictEqual(decision2.move.y, 2);
});

test('AI: Shrouded assassin targets lowest-DEF player unit', () => {
  const terrain = Array(13).fill("..........");
  const board = new Board(terrain);
  const rng = new RNG(789);

  const assassin = {
    id: 'shadow_rat',
    role: 'shrouded',
    cls: '刺客',
    team: 'enemy',
    x: 4,
    y: 2,
    hp: 16,
    maxHp: 16,
    atk: 13,
    def: 2,
    mov: 4,
    range: 1,
    facing: 1
  };

  // High DEF tank (Bear, DEF 10)
  const tank = {
    id: 'bear_guard',
    team: 'ally',
    x: 4,
    y: 3,
    hp: 36,
    def: 10
  };

  // Low DEF mage (Fox, DEF 3)
  const fragileMage = {
    id: 'fox_maiden',
    team: 'ally',
    x: 5,
    y: 3,
    hp: 21,
    def: 3
  };

  const decision = decideEnemyTurn(assassin, {
    board,
    allies: [tank, fragileMage],
    enemies: [assassin]
  }, rng);

  assert.strictEqual(decision.type, 'attack');
  assert.strictEqual(decision.target.id, 'fox_maiden', 'Assassin must prioritize fragile low-DEF target over tank');
});

test('AI: Boss triggers AoE mist blast when >=2 player units cluster', () => {
  const terrain = Array(13).fill("..........");
  const board = new Board(terrain);
  const rng = new RNG(999);

  const boss = {
    id: 'mother_of_mist',
    role: 'boss',
    cls: '首領',
    team: 'enemy',
    x: 6,
    y: 4,
    hp: 60,
    maxHp: 60,
    atk: 13,
    mag: 15,
    mov: 3,
    range: 2,
    facing: -1
  };

  // Cluster of 2 player units
  const allyA = { id: 'ally_1', team: 'ally', x: 6, y: 6, hp: 25, def: 4 };
  const allyB = { id: 'ally_2', team: 'ally', x: 7, y: 6, hp: 22, def: 3 };

  const decision = decideEnemyTurn(boss, {
    board,
    allies: [allyA, allyB],
    enemies: [boss]
  }, rng);

  assert.strictEqual(decision.type, 'aoe_skill', 'Boss must trigger AoE skill on player cluster');
  assert.strictEqual(decision.skillId, 'abyssal_mist');
  assert.ok(decision.targets.length >= 2, 'AoE targets must include both clustered units');
});

test('AI: Shield guard maintains facing towards nearest threat and holds position', () => {
  const terrain = Array(13).fill("..........");
  const board = new Board(terrain);
  const rng = new RNG(123);

  const shieldGuard = {
    id: 'shield_guard_1',
    role: 'shield_guard',
    team: 'enemy',
    x: 5,
    y: 5,
    hp: 28,
    def: 8,
    atk: 10,
    mov: 3,
    facing: 1
  };

  // Player unit is to the West at (2, 5)
  const westPlayer = {
    id: 'cat_patrol',
    team: 'ally',
    x: 2,
    y: 5,
    hp: 28,
    def: 5
  };

  const decision = decideEnemyTurn(shieldGuard, {
    board,
    allies: [westPlayer],
    enemies: [shieldGuard]
  }, rng);

  // Since player is to the West (x: 2 < 5), shieldGuard must turn facing to -1 (West)
  assert.strictEqual(decision.newFacing, -1, 'Shield guard must turn to face the incoming threat from the West');
});

test('AI: Sorcerer casts AoE thunder magic when player units cluster', () => {
  const terrain = Array(13).fill("..........");
  const board = new Board(terrain);
  const rng = new RNG(456);

  const sorcerer = {
    id: 'mist_sorcerer_1',
    role: 'sorcerer',
    team: 'enemy',
    x: 5,
    y: 5,
    hp: 20,
    def: 2,
    mag: 12,
    mp: 8,
    mov: 3,
    facing: -1
  };

  // Clustered player units at (4, 5) and (5, 6)
  const ally1 = { id: 'ally_1', team: 'ally', x: 4, y: 5, hp: 20, def: 4 };
  const ally2 = { id: 'ally_2', team: 'ally', x: 5, y: 6, hp: 22, def: 3 };

  const decision = decideEnemyTurn(sorcerer, {
    board,
    allies: [ally1, ally2],
    enemies: [sorcerer]
  }, rng);

  assert.strictEqual(decision.type, 'aoe', 'Sorcerer should cast AoE spell when >=2 allies cluster');
  assert.strictEqual(decision.element, 'thunder');
  assert.ok(decision.targets.length >= 2, 'Targets must cover both clustered units');
});

test('AI: Scout prioritizes lantern cart objective target', () => {
  const terrain = Array(13).fill("..........");
  const board = new Board(terrain);
  const rng = new RNG(789);

  const scout = {
    id: 'mist_scout_1',
    role: 'scout',
    team: 'enemy',
    x: 3,
    y: 5,
    hp: 16,
    atk: 12,
    mov: 5,
    def: 2
  };

  // High DEF tank at (3, 4)
  const tank = { id: 'bear_guard', role: 'tank', team: 'ally', x: 3, y: 4, hp: 36, def: 10 };
  // Lantern cart at (4, 5) adjacent to scout
  const cart = { id: 'lantern_cart', role: 'npc', team: 'ally', x: 4, y: 5, hp: 25, def: 4 };

  const decision = decideEnemyTurn(scout, {
    board,
    allies: [tank, cart],
    enemies: [scout]
  }, rng);

  assert.strictEqual(decision.type, 'attack');
  assert.strictEqual(decision.target.id, 'lantern_cart', 'Scout must prioritize attacking lantern cart over tank');
});

test('AI: Curse Sorcerer (咒禁術士) with MAG 15 casts AoE when clustered and magic at range', () => {
  const terrain = Array(13).fill("..........");
  const board = new Board(terrain);
  const rng = new RNG(999);

  const curseSorcerer = {
    id: 'curse_sorcerer',
    role: 'curse_sorcerer',
    team: 'enemy',
    element: 'dark',
    x: 5,
    y: 5,
    hp: 34,
    atk: 6,
    def: 4,
    mag: 15,
    mp: 10,
    mov: 3,
    range: [1, 2],
    magic: { id: 'curse_strike', name: '邪穢陰雷', power: 14, cost: 4 }
  };

  // Case 1: Clustered targets -> AoE curse spell
  const ally1 = { id: 'ally_1', team: 'ally', x: 4, y: 5, hp: 25, def: 4 };
  const ally2 = { id: 'ally_2', team: 'ally', x: 5, y: 6, hp: 25, def: 4 };

  const aoeDecision = decideEnemyTurn(curseSorcerer, {
    board,
    allies: [ally1, ally2],
    enemies: [curseSorcerer]
  }, rng);

  assert.strictEqual(aoeDecision.type, 'aoe', 'Curse sorcerer must cast AoE when players cluster');
  assert.strictEqual(aoeDecision.element, 'dark');
  assert.ok(aoeDecision.targets.length >= 2);

  // Case 2: Single target at distance 2 -> magic attack (not default melee!)
  const singleAlly = { id: 'ally_single', team: 'ally', x: 5, y: 7, hp: 25, def: 4 };
  const singleDecision = decideEnemyTurn(curseSorcerer, {
    board,
    allies: [singleAlly],
    enemies: [curseSorcerer]
  }, rng);

  assert.strictEqual(singleDecision.type, 'magic', 'Curse sorcerer must use magic spell at range 2, not default melee');
  assert.strictEqual(singleDecision.element, 'dark');
});
