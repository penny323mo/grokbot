/**
 * tests/rules.test.mjs
 * Unit tests for tactics rules: movement costs, impassable tiles, flyer advantages,
 * ZOC interception, back-attack damage modifiers, counter-attacks, elemental affinities,
 * shrouded stealth targeting, and knockback into water instant KO.
 */

import assert from 'node:assert';
import test from 'node:test';
import { Board } from '../js/engine/board.js';
import { getReachableTiles, getAttackRangeTiles } from '../js/engine/pathfinding.js';
import { calculateCombat, executeCombat, canTargetUnit } from '../js/engine/combat.js';
import { GUARDIAN_PROTOS, ENEMY_PROTOS } from '../js/data/units.js';
import { RNG } from '../js/engine/rng.js';
import { Battle } from '../js/engine/battle.js';
import { CampaignManager } from '../js/engine/campaign.js';

test('Rules: Movement costs, impassable tiles, and flyer traversal', () => {
  // Test map: row 0 has plain (.), forest (f), hill (h), shallows (s), water (w), wall (#)
  const terrain = [
    ".fhsw#....",
    "..........",
    "..........",
    "..........",
    "..........",
    "..........",
    "..........",
    "..........",
    "..........",
    "..........",
    "..........",
    "..........",
    ".........."
  ];
  const board = new Board(terrain);

  assert.strictEqual(board.getMoveCost(0, 0, false), 1); // plain
  assert.strictEqual(board.getMoveCost(1, 0, false), 2); // forest
  assert.strictEqual(board.getMoveCost(2, 0, false), 2); // hill
  assert.strictEqual(board.getMoveCost(3, 0, false), 3); // shallows
  assert.strictEqual(board.isImpassable(4, 0, false), true); // water impassable to non-flyer
  assert.strictEqual(board.isImpassable(5, 0, false), true); // wall impassable to non-flyer

  // Flyer movement: costs 1 and ignores impassable water
  assert.strictEqual(board.getMoveCost(4, 0, true), 1);
  assert.strictEqual(board.isImpassable(4, 0, true), false);

  // Test reachable tiles for non-flyer vs flyer
  const footman = { id: 'footman', team: 'ally', x: 0, y: 0, mov: 3, flyer: false };
  const footmanReachable = getReachableTiles(board, footman, [footman]);

  // Footman can reach (0,0) cost 0, (1,0) forest cost 2, cannot reach (3,0) shallows directly (cost 1+2+3 > 3)
  assert.ok(footmanReachable.has('1,0')); // forest
  assert.ok(!footmanReachable.has('4,0')); // water is impassable

  const flyer = { id: 'crane_rider', team: 'ally', x: 0, y: 0, mov: 4, flyer: true };
  const flyerReachable = getReachableTiles(board, flyer, [flyer]);
  assert.ok(flyerReachable.has('4,0'), 'Flyer can fly to water tile');
});

test('Rules: Cavalry ZOC interception by bear_guard (spear_wall)', () => {
  const terrain = Array(13).fill("..........");
  const board = new Board(terrain);

  // bear_guard stands at (3, 2)
  const bear = {
    id: 'bear_guard',
    team: 'ally',
    x: 3,
    y: 2,
    hp: 36,
    trait: { id: 'spear_wall' }
  };

  // Cavalry moves from (0, 2) East towards bear
  const cavalry = {
    id: 'fog_rider',
    role: 'cavalry',
    team: 'enemy',
    x: 0,
    y: 2,
    mov: 6,
    flyer: false
  };

  const reachable = getReachableTiles(board, cavalry, [bear, cavalry]);

  // Entering tile (2, 2) is adjacent to bear (3, 2) -> ZOC intercepts!
  // Unit can reach (2, 2), but cannot expand beyond it!
  const tile22 = reachable.get('2,2');
  assert.ok(tile22, 'Cavalry can reach adjacent tile (2,2)');
  assert.strictEqual(tile22.zocStopped, true, 'Tile (2,2) must be flagged as ZOC stopped');
});

test('Rules: Facing and Back-attack damage modifiers', () => {
  const terrain = Array(13).fill("..........");
  const board = new Board(terrain);

  // Defender facing East (facing = 1) at (3, 3)
  const defender = {
    id: 'target',
    team: 'enemy',
    x: 3,
    y: 3,
    hp: 30,
    def: 4,
    spd: 10,
    facing: 1
  };

  // 1. Normal attacker from East (4, 3) -> Front attack
  const frontAttacker = {
    id: 'attacker',
    team: 'ally',
    x: 4,
    y: 3,
    atk: 14,
    spd: 10,
    facing: -1
  };
  const frontCombat = calculateCombat(frontAttacker, defender, board);
  assert.strictEqual(frontCombat.direction, 'front');
  assert.strictEqual(frontCombat.isFrontAttack, true);
  // Damage: 14 - 4 = 10 * 1.0 = 10
  assert.strictEqual(frontCombat.expectedDamage, 10);

  // 2. Normal attacker from West (2, 3) -> Back attack (+50%)
  const backAttacker = {
    id: 'attacker',
    team: 'ally',
    x: 2,
    y: 3,
    atk: 14,
    spd: 10,
    facing: 1
  };
  const backCombat = calculateCombat(backAttacker, defender, board);
  assert.strictEqual(backCombat.direction, 'back');
  assert.strictEqual(backCombat.isBackAttack, true);
  // Damage: 10 * 1.5 = 15
  assert.strictEqual(backCombat.expectedDamage, 15);
  // Back attack prevents counter-attack
  assert.strictEqual(backCombat.canCounter, false);

  // 3. cat_patrol with swift_shadow trait -> Back attack (+100%)
  const catAttacker = {
    id: 'cat_patrol',
    team: 'ally',
    x: 2,
    y: 3,
    atk: 14,
    spd: 14,
    facing: 1,
    trait: { id: 'swift_shadow' }
  };
  const catCombat = calculateCombat(catAttacker, defender, board);
  assert.strictEqual(catCombat.isBackAttack, true);
  // Damage: 10 * 2.0 = 20
  assert.strictEqual(catCombat.expectedDamage, 20);
});

test('Rules: Counter-attack by melee defender', () => {
  const terrain = Array(13).fill("..........");
  const board = new Board(terrain);

  // Defender facing East (facing = 1) at (3, 3) with range 1 and ATK 12
  const defender = {
    id: 'counter_dummy',
    team: 'enemy',
    x: 3,
    y: 3,
    hp: 40,
    atk: 12,
    def: 4,
    spd: 10,
    range: 1,
    facing: 1
  };

  // Attacker at (4, 3) attacks from front (facing East means (4,3) is in front)
  const attacker = {
    id: 'swordsman',
    team: 'ally',
    x: 4,
    y: 3,
    hp: 25,
    atk: 10,
    def: 2,
    spd: 10,
    range: 1,
    facing: -1
  };

  const combat = calculateCombat(attacker, defender, board);
  assert.strictEqual(combat.canCounter, true, 'Frontal attack allows counter-attack');
  // Defender ATK 12 - attacker DEF 2 = 10 counter damage
  assert.strictEqual(combat.counterDamage, 10);

  // Ranged attacker at (5, 3) (distance 2) -> Melee defender cannot counter!
  const rangedAttacker = {
    id: 'archer',
    team: 'ally',
    x: 5,
    y: 3,
    hp: 20,
    atk: 10,
    def: 2,
    spd: 10,
    range: [2, 3],
    facing: -1
  };
  const rangedCombat = calculateCombat(rangedAttacker, defender, board);
  assert.strictEqual(rangedCombat.canCounter, false, 'Melee defender cannot counter ranged attack');
});

test('Rules: Water immunity and thunder weakness for paper_ghost', () => {
  const terrain = Array(13).fill("..........");
  const board = new Board(terrain);

  const waterSpirit = {
    id: 'paper_ghost',
    team: 'enemy',
    element: 'water',
    trait: { id: 'water_spirit' },
    hp: 25,
    def: 2,
    res: 4,
    facing: 1,
    x: 3,
    y: 3
  };

  const mage = {
    id: 'fox_maiden',
    team: 'ally',
    mag: 14,
    res: 6,
    facing: 1,
    x: 2,
    y: 3
  };

  // 1. Fire attack against water spirit -> 0 damage
  const fireCombat = calculateCombat(mage, waterSpirit, board, {
    actionType: 'skill',
    skill: { element: 'fire', power: 14, type: 'magic' }
  });
  assert.strictEqual(fireCombat.expectedDamage, 0, 'Fire against water-spirit must deal 0 damage');

  // 2. Thunder attack against water spirit -> double damage (x2.0)
  const thunderCombat = calculateCombat(mage, waterSpirit, board, {
    actionType: 'skill',
    skill: { element: 'thunder', power: 14, type: 'magic' }
  });
  assert.ok(thunderCombat.expectedDamage >= 20, 'Thunder against water-spirit deals heavy multiplied damage');
});

test('Rules: Shrouded targeting rules for shadow_rat', () => {
  const terrain = Array(13).fill("..........");
  const board = new Board(terrain);

  const rat = {
    id: 'shadow_rat',
    team: 'enemy',
    isShrouded: true,
    trait: { id: 'mist_shroud' },
    hp: 16,
    x: 5,
    y: 5
  };

  // Unit at distance 3 without lantern -> cannot target
  const farArcher = { id: 'archer', team: 'ally', x: 2, y: 5 };
  assert.strictEqual(canTargetUnit(farArcher, rat, board), false, 'Cannot target unlit distant shrouded unit');

  // Unit adjacent to rat (distance 1) -> CAN target!
  const adjacentAlly = { id: 'sword', team: 'ally', x: 4, y: 5 };
  assert.strictEqual(canTargetUnit(adjacentAlly, rat, board), true, 'Adjacent unit reveals shrouded rat');

  // If a lantern illuminates rat's tile -> distant unit CAN target!
  board.addPlacedLantern(5, 4, 2, 3); // Lantern at (5,4) radius 2 covers (5,5)
  assert.strictEqual(canTargetUnit(farArcher, rat, board), true, 'Lantern light reveals shrouded rat');
});

test('Rules: Knockback into water instant KO', () => {
  // Tile (4, 4) is bridge 'b', tile (5, 4) is water 'w'
  const terrain = [
    "..........",
    "..........",
    "..........",
    "..........",
    "....bw....",
    "..........",
    "..........",
    "..........",
    "..........",
    "..........",
    "..........",
    "..........",
    ".........."
  ];
  const board = new Board(terrain);
  const rng = new RNG(42);

  // Attacker at (3, 4) pushes defender at (4, 4) East into (5, 4) water!
  const pusher = {
    id: 'bear_guard',
    team: 'ally',
    x: 3,
    y: 4,
    atk: 10,
    skill: { knockback: 1 }
  };

  const heavyEnemy = {
    id: 'iron_general',
    team: 'enemy',
    x: 4,
    y: 4,
    hp: 50,
    def: 12,
    flyer: false,
    facing: -1
  };

  const combatRes = executeCombat(pusher, heavyEnemy, board, rng, {
    actionType: 'skill',
    skill: pusher.skill
  });

  assert.strictEqual(heavyEnemy.hp, 0, 'Non-flyer pushed into water is instantly drowned KO');
  const drownEvent = combatRes.events.find(e => e.type === 'drown');
  assert.ok(drownEvent, 'Drown event must be fired');
});

test('Rules: Fox fire (狐火) AoE cross hits multi-targets and deals x0 vs water type', () => {
  const dummyChapter = {
    id: 99,
    terrain: Array(13).fill(".........."),
    deployTiles: [{ x: 4, y: 3 }],
    enemySpawns: []
  };

  const fox = { ...GUARDIAN_PROTOS.fox_maiden, id: 'fox_maiden', x: 4, y: 3, hp: 21, maxHp: 21, mp: 8, maxMp: 8 };
  const battle = new Battle(dummyChapter, [fox], null, null, new RNG(42));

  // Center of cross at (4, 4)
  // Cross covers: (4,4), (5,4), (3,4), (4,5), (4,3)
  const rider = { ...ENEMY_PROTOS.fog_rider, id: 'fog_rider', x: 4, y: 4, hp: 22, maxHp: 22 };
  const ghostWater = { ...ENEMY_PROTOS.paper_ghost, id: 'paper_ghost', x: 5, y: 4, hp: 20, maxHp: 20, element: 'water' };
  const rat = { ...ENEMY_PROTOS.shadow_rat, id: 'shadow_rat', x: 4, y: 5, hp: 16, maxHp: 16 };
  const farEnemy = { ...ENEMY_PROTOS.shadow_archer, id: 'shadow_archer', x: 8, y: 8, hp: 18, maxHp: 18 };

  battle.enemies = [rider, ghostWater, rat, farEnemy];

  // Execute flame_cross at (4, 4)
  battle.confirmAction(fox, 'skill', rider, { tileX: 4, tileY: 4 });

  // rider at (4,4) was hit
  assert.ok(rider.hp < 22, 'Cavalry in cross must take fire damage');
  // ghostWater at (5,4) is water-type, immune to fire
  assert.strictEqual(ghostWater.hp, 20, 'Water ghost in cross takes 0 fire damage');
  // rat at (4,5) was hit
  assert.ok(rat.hp < 16, 'Rat in cross must take fire damage');
  // farEnemy at (8,8) is out of cross
  assert.strictEqual(farEnemy.hp, 18, 'Enemy outside cross takes 0 damage');
});

test('Rules: MP resource cost deduction on skill/magic', () => {
  const dummyChapter = {
    id: 99,
    terrain: Array(13).fill(".........."),
    deployTiles: [{ x: 2, y: 2 }],
    enemySpawns: []
  };

  const fox = { ...GUARDIAN_PROTOS.fox_maiden, id: 'fox_maiden', x: 2, y: 2, hp: 21, maxHp: 21, mp: 6, maxMp: 6 };
  const battle = new Battle(dummyChapter, [fox], null, null, new RNG(777));
  const dummyEnemy = { ...ENEMY_PROTOS.fog_rider, id: 'dummy_target', x: 2, y: 3, hp: 22, maxHp: 22 };
  battle.enemies = [dummyEnemy];

  assert.strictEqual(fox.mp, 6, 'Fox starts with 6 MP');
  // skill flame_cross costs 3 MP
  battle.confirmAction(fox, 'skill', dummyEnemy, { tileX: 2, tileY: 3 });
  assert.strictEqual(fox.mp, 3, 'Fox must have 3 MP remaining after consuming 3 MP');
});

test('Rules: Shield guard (shield_block) blocks 70% frontal damage but takes full back damage', () => {
  const terrain = Array(13).fill("..........");
  const board = new Board(terrain);

  // Shield guard at (4, 4), facing East (facing = 1)
  const shieldDefender = {
    ...ENEMY_PROTOS.shield_guard,
    id: 'shield_guard',
    x: 4,
    y: 4,
    def: 8,
    facing: 1
  };

  // Attacker at (5, 4) attacking from East -> Frontal attack
  const frontAttacker = {
    id: 'attacker_front',
    team: 'ally',
    x: 5,
    y: 4,
    atk: 18,
    spd: 10
  };
  const frontCombat = calculateCombat(frontAttacker, shieldDefender, board);
  assert.strictEqual(frontCombat.direction, 'front');
  // Raw damage = 18 - 8 = 10. Frontal damageMod = 0.3 -> expectedDamage = 3
  assert.strictEqual(frontCombat.expectedDamage, 3, 'Frontal attack against shield_guard must be reduced by 70%');

  // Attacker at (3, 4) attacking from West -> Back attack
  const backAttacker = {
    id: 'attacker_back',
    team: 'ally',
    x: 3,
    y: 4,
    atk: 18,
    spd: 10
  };
  const backCombat = calculateCombat(backAttacker, shieldDefender, board);
  assert.strictEqual(backCombat.direction, 'back');
  // Raw damage = 10. Back damageMod = 1.5 -> expectedDamage = 15
  assert.strictEqual(backCombat.expectedDamage, 15, 'Back attack against shield_guard must deal full back damage');
});

test('Rules: Fire archer inflicts bonus burn damage on targets in forest', () => {
  const terrain = [
    "..........",
    "....f.....", // forest at (4, 1)
    "..........",
    "..........",
    "..........",
    "..........",
    "..........",
    "..........",
    "..........",
    "..........",
    "..........",
    "..........",
    ".........."
  ];
  const board = new Board(terrain);

  const fireArcher = {
    ...ENEMY_PROTOS.fire_archer,
    id: 'fire_archer',
    x: 6,
    y: 2,
    atk: 11
  };

  // Target on flat ground at (4, 2), facing East (1) -> front attack (1.0x)
  const plainTarget = {
    id: 'plain_target',
    team: 'ally',
    x: 4,
    y: 2,
    def: 3,
    facing: 1
  };
  const plainCombat = calculateCombat(fireArcher, plainTarget, board);
  // Raw = (11 - 3) * 1.0 = 8
  assert.strictEqual(plainCombat.expectedDamage, 8);

  // Target in forest at (4, 1), facing East (1) -> front-adjacent angle
  const fireArcher2 = {
    ...ENEMY_PROTOS.fire_archer,
    id: 'fire_archer',
    x: 6,
    y: 1,
    atk: 11
  };
  const forestTarget = {
    id: 'forest_target',
    team: 'ally',
    x: 4,
    y: 1,
    def: 3,
    facing: 1
  };
  const forestCombat = calculateCombat(fireArcher2, forestTarget, board);
  // Raw base: (11 - 4) = 7 + 4 (ignite forest) = 11
  assert.strictEqual(forestCombat.expectedDamage, 11, 'Fire archer attacking forest target gains +4 burning damage');
});

test('Rules: Combo attack (協力攻擊) triggered by adjacent ally', () => {
  const terrain = [
    "..........",
    "..........",
    "..........",
    "..........",
    "..........",
    "..........",
    "..........",
    "..........",
    "..........",
    "..........",
    "..........",
    "..........",
    ".........."
  ];
  const board = new Board(terrain);

  const attacker = {
    id: 'cat_patrol',
    name: '墨影',
    team: 'ally',
    x: 3,
    y: 5,
    hp: 25,
    atk: 12
  };

  const defender = {
    id: 'fog_rider',
    name: '霧騎',
    team: 'enemy',
    x: 4,
    y: 5,
    def: 4,
    hp: 25,
    facing: 1
  };

  const adjacentAlly = {
    id: 'bear_guard',
    name: '熊岳',
    team: 'ally',
    x: 4,
    y: 4, // Adjacent to defender (dist = 1)
    hp: 30,
    atk: 11
  };

  const allies = [attacker, adjacentAlly];

  const combat = calculateCombat(attacker, defender, board, { allies });
  assert.ok(combat.comboAlly, 'Should detect adjacent ally for combo');
  assert.strictEqual(combat.comboAlly.id, 'bear_guard');
  assert.ok(combat.comboDamage > 0, 'Combo should deal bonus damage');

  // Execute combat with combo
  const rng = new RNG(42);
  const res = executeCombat(attacker, defender, board, rng, { allies });
  const comboEvent = res.events.find(e => e.type === 'combo_hit');
  assert.ok(comboEvent, 'executeCombat should generate combo_hit event');
  assert.strictEqual(comboEvent.ally.id, 'bear_guard');
});

test('Rules: Fire attack persistent burn and forest fire spread', () => {
  const terrain = [
    "ffff......",
    "ffff......",
    "ffff......",
    "..........",
    "..........",
    "..........",
    "..........",
    "..........",
    "..........",
    "..........",
    "..........",
    "..........",
    ".........."
  ];
  const chapter = {
    id: 1,
    terrain,
    squadLimit: 4,
    maxTurns: 10,
    objectiveType: 'rout',
    enemySpawns: []
  };

  const battle = new Battle(chapter, [{ id: 'cat_patrol', hp: 20, maxHp: 20 }], 'fire_attack', null, new RNG(1), {
    fireCenter: { x: 1, y: 1 }
  });

  assert.ok(battle.burningTiles.has('1,1'), 'Center tile should be burning');
  assert.ok(battle.burningTiles.has('0,0'), 'Adjacent forest should be burning');

  // Place enemy on burning tile and tick
  const dummy = { id: 'dummy', team: 'enemy', x: 1, y: 1, hp: 20, maxHp: 20 };
  battle.enemies.push(dummy);
  battle.tickBurningTiles();

  assert.strictEqual(dummy.hp, 16, 'Unit standing on burning forest should take 4 burn damage');
});

test('Rules: Class promotion stat bonuses and upgraded skill (劍客→劍聖 萬劍歸宗)', () => {
  const campaign = new CampaignManager();
  const cat = campaign.getUnitInstance('cat_patrol');
  assert.strictEqual(cat.cls, '劍客');

  // Level up to Lv2
  campaign.addExp('cat_patrol', 100);
  const promotedCat = campaign.getUnitInstance('cat_patrol');
  assert.strictEqual(promotedCat.cls, '劍聖', 'Cat should promote to 劍聖 at Lv2+');
  assert.ok(promotedCat.atk >= 16, 'ATK should receive promotion bonus');
  assert.ok(promotedCat.promotedSkill, 'Should unlock promoted skill');
  assert.strictEqual(promotedCat.promotedSkill.name, '萬劍歸宗');
});
