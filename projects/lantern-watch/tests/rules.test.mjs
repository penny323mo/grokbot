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
import { CHAPTERS } from '../js/data/maps.js';
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
    name: '熊岳',
    team: 'ally',
    x: 3,
    y: 2,
    hp: 36,
    atk: 12,
    def: 8,
    trait: { id: 'spear_wall' }
  };

  // Cavalry moves from (0, 2) East towards bear
  const cavalry = {
    id: 'fog_rider',
    name: '霧騎',
    role: 'cavalry',
    team: 'enemy',
    x: 0,
    y: 2,
    mov: 6,
    def: 4,
    hp: 20,
    flyer: false
  };

  const reachable = getReachableTiles(board, cavalry, [bear, cavalry]);

  // Entering tile (2, 2) is adjacent to bear (3, 2) -> ZOC intercepts!
  // Unit can reach (2, 2), but cannot expand beyond it!
  const tile22 = reachable.get('2,2');
  assert.ok(tile22, 'Cavalry can reach adjacent tile (2,2)');
  assert.strictEqual(tile22.zocStopped, true, 'Tile (2,2) must be flagged as ZOC stopped');

  // Live battle: moving into ZOC deals free intercept hit to cavalry HP!
  const battle = new Battle({ id: 1, terrain, deployTiles: [{ x: 3, y: 2 }] }, [bear]);
  battle.enemies = [cavalry];
  const initialHp = cavalry.hp;
  battle.moveUnit(cavalry, 2, 2);
  assert.ok(cavalry.hp < initialHp, 'Cavalry must take free hit damage upon entering spear_wall ZOC');
  const zocEvent = battle.eventLog.find(e => e.type === 'zoc_strike');
  assert.ok(zocEvent, 'Must record zoc_strike event');
  assert.strictEqual(zocEvent.damage, 8, 'Damage should be bear.atk (12) - cavalry.def (4) = 8');
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

test('Rules: Combo attack (合擊) restricted to valid BOND_PAIRS', () => {
  const terrain = Array(13).fill('..........');
  const board = new Board(terrain);

  const catAttacker = {
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

  const bearAlly = {
    id: 'bear_guard',
    name: '熊岳',
    team: 'ally',
    x: 4,
    y: 4, // Adjacent to defender
    hp: 30,
    atk: 11
  };

  // 1. Cat + Bear are NOT a valid bond pair -> NO combo
  const nonBondCombat = calculateCombat(catAttacker, defender, board, { allies: [catAttacker, bearAlly] });
  assert.strictEqual(nonBondCombat.comboAlly, null, 'Non-bond pair (cat+bear) must NOT trigger combo hit');

  // 2. Cat + Lantern Crafter form 「影燈」 bond -> Combo triggers!
  const lanternAlly = {
    id: 'lantern_crafter',
    name: '燈娘',
    team: 'ally',
    x: 4,
    y: 4,
    hp: 22,
    atk: 10
  };
  const bondCombat = calculateCombat(catAttacker, defender, board, { allies: [catAttacker, lanternAlly] });
  assert.ok(bondCombat.comboAlly, 'Should trigger combo with valid bond partner (lantern_crafter)');
  assert.strictEqual(bondCombat.bondName, '影燈', 'Bond name should be 影燈');
  assert.ok(bondCombat.comboDamage > 0, 'Combo should deal bonus damage');

  // Execute combat with combo
  const rng = new RNG(42);
  const res = executeCombat(catAttacker, defender, board, rng, { allies: [catAttacker, lanternAlly] });
  const comboEvent = res.events.find(e => e.type === 'combo_hit');
  assert.ok(comboEvent, 'executeCombat should generate combo_hit event');
  assert.strictEqual(comboEvent.ally.id, 'lantern_crafter');
  assert.strictEqual(comboEvent.bondName, '影燈');

  // 3. Bear + Tea Master form 「山泉」 bond -> Combo triggers!
  const teaAlly = {
    id: 'tea_master',
    name: '茶翁',
    team: 'ally',
    x: 4,
    y: 4,
    hp: 24,
    atk: 9
  };
  const bearTeaCombat = calculateCombat(bearAlly, defender, board, { allies: [bearAlly, teaAlly] });
  assert.ok(bearTeaCombat.comboAlly, 'Should trigger combo with valid bond partner (tea_master)');
  assert.strictEqual(bearTeaCombat.bondName, '山泉', 'Bond name should be 山泉');
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

  // Level up to Lv4 (requires Lv5 for promotion per SPEC §7)
  campaign.addExp('cat_patrol', 300);
  assert.strictEqual(campaign.roster['cat_patrol'].level, 4);
  assert.strictEqual(campaign.promoteUnit('cat_patrol'), false, 'Cannot promote before Lv5');

  // Level up to Lv5 and manually promote in camp
  campaign.addExp('cat_patrol', 100);
  assert.strictEqual(campaign.roster['cat_patrol'].level, 5);
  const success = campaign.promoteUnit('cat_patrol');
  assert.strictEqual(success, true, 'Can promote at Lv5');

  const promotedCat = campaign.getUnitInstance('cat_patrol');
  assert.strictEqual(promotedCat.cls, '劍聖', 'Cat should promote to 劍聖 at Lv5');
  assert.ok(promotedCat.atk >= 16, 'ATK should receive promotion bonus');
  assert.ok(promotedCat.promotedSkill, 'Should unlock promoted skill');
  assert.strictEqual(promotedCat.promotedSkill.name, '萬劍歸宗');
});

test('Rules: Fog-of-war vision and hidden enemy untargetability', () => {
  const chapter = {
    id: 5,
    hasNightFog: true,
    terrain: new Array(13).fill('..........'),
    lanterns: [{ x: 5, y: 5, radius: 2 }],
    deployTiles: [{ x: 0, y: 0 }],
    enemySpawns: []
  };

  const scout = { id: 'mist_scout', team: 'ally', role: 'scout', hp: 20, maxHp: 20, x: 1, y: 1 };
  const battle = new Battle(chapter, [scout], null, null, new RNG(1));

  const vision = battle.calculateVisionMap();
  assert.ok(vision.has('1,1'), 'Scout sees self tile');
  assert.ok(vision.has('4,1'), 'Scout sees tile at distance 3');
  assert.ok(vision.has('5,5'), 'Lantern center is lit');
  assert.ok(vision.has('6,6'), 'Lantern perimeter is lit');
  assert.ok(!vision.has('9,9'), 'Tile (9,9) should be shrouded in fog');

  const hiddenEnemy = { id: 'dummy_enemy', hp: 20, x: 9, y: 9 };
  assert.strictEqual(canTargetUnit(scout, hiddenEnemy, battle.board, vision), false, 'Enemy in fog cannot be targeted');

  const revealedEnemy = { id: 'dummy_revealed', hp: 20, x: 5, y: 5 };
  assert.strictEqual(canTargetUnit(scout, revealedEnemy, battle.board, vision), true, 'Revealed enemy can be targeted');
});

test('Rules: 水淹 (Water Flood) terrain conversion and push/damage', () => {
  const terrain = [
    "....s.....",
    "....s.....",
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
  const chapter = { id: 1, terrain, deployTiles: [{ x: 0, y: 0 }], enemySpawns: [] };
  const battle = new Battle(chapter, [{ id: 'cat_patrol', x: 0, y: 0, hp: 20, maxHp: 20 }], null, null, new RNG(1));

  assert.strictEqual(battle.board.getTerrainChar(4, 1), 's', 'Initially shallows');

  const enemy = { id: 'heavy_guard', name: '重甲衛', team: 'enemy', x: 4, y: 1, hp: 25, maxHp: 25, flyer: false };
  battle.enemies.push(enemy);

  battle.triggerWaterFlood(0, 1);

  assert.strictEqual(battle.board.getTerrainChar(4, 1), 'w', 'Shallows should convert to deep water w');
  assert.strictEqual(enemy.hp, 13, 'Enemy standing in flooded shallows takes 12 flood damage');
  assert.strictEqual(enemy.y, 2, 'Enemy is pushed down to dry ground (y=2) by flood wave');

  battle.tickFloodedTiles();
  battle.tickFloodedTiles();
  assert.strictEqual(battle.board.getTerrainChar(4, 1), 's', 'Water recedes and restores shallows s');
});

test('Rules: Siege engine (霹靂砲車) long-range bombardment and blind-zone rush', () => {
  const terrain = new Array(13).fill('..........');
  const board = new Board(terrain);

  const siege = { ...ENEMY_PROTOS['siege_engine'], x: 5, y: 5, hp: 30, maxHp: 30 };
  const targetFar = { id: 'player_far', team: 'ally', x: 5, y: 1, hp: 30, maxHp: 30, def: 2 };
  const targetMelee = { id: 'player_melee', team: 'ally', x: 5, y: 6, hp: 30, maxHp: 30, def: 2, atk: 15 };

  const resFar = calculateCombat(siege, targetFar, board);
  assert.ok(resFar.expectedDamage > 0, 'Siege engine should bombard target at distance 4');

  const resMelee = calculateCombat(targetMelee, siege, board);
  assert.ok(resMelee.expectedDamage > 0, 'Player deals melee damage to siege engine');
  assert.strictEqual(resMelee.counterDamage, 0, 'Siege engine CANNOT counter-attack at distance 1 (blind zone)');
});

test('Rules: Varied action XP and MVP calculation', () => {
  const chapter = {
    id: 1,
    terrain: new Array(13).fill('..........'),
    deployTiles: [{ x: 0, y: 0 }, { x: 1, y: 0 }],
    enemySpawns: []
  };
  const allyA = { id: 'cat_patrol', name: '墨影', hp: 20, maxHp: 20, role: 'dps', team: 'ally' };
  const allyB = { id: 'bear_guard', name: '熊岳', hp: 30, maxHp: 30, role: 'tank', team: 'ally' };

  const battle = new Battle(chapter, [allyA, allyB], null, null, new RNG(1));

  battle.actionScores['cat_patrol'] = 65;
  battle.actionScores['bear_guard'] = 10;

  const rewards = battle.calculateBattleRewards();
  assert.strictEqual(rewards.mvpId, 'cat_patrol', 'Ally with highest action score should be MVP');

  const mvpAward = rewards.awards.find(a => a.id === 'cat_patrol');
  const normalAward = rewards.awards.find(a => a.id === 'bear_guard');

  assert.strictEqual(mvpAward.isMvp, true);
  assert.ok(mvpAward.expGained > normalAward.expGained, 'MVP should receive significantly more EXP than other units');
  assert.ok(mvpAward.reason.includes('MVP'), 'Award should highlight MVP accomplishment');
});

test('Rules: General Zone of Control (ZOC) stops foot soldiers while light and flying units ignore ZOC', () => {
  const terrain = new Array(13).fill('..........');
  const board = new Board(terrain);

  // Enemy standing at (3, 2)
  const enemy = { id: 'shield_guard', team: 'enemy', x: 3, y: 2, hp: 30 };

  // 1. Standard foot warrior moving from (0, 2) East towards enemy (3, 2) with general ZOC
  const footUnit = { id: 'warrior', role: 'fighter', team: 'ally', x: 0, y: 2, mov: 5, flyer: false };
  const footReachable = getReachableTiles(board, footUnit, [footUnit, enemy], { zoc: true });

  // Entering tile (2, 2) is adjacent to enemy (3, 2) -> intercepted by ZOC!
  const tile22 = footReachable.get('2,2');
  assert.ok(tile22, 'Foot unit can reach adjacent tile (2, 2)');
  assert.strictEqual(tile22.zocStopped, true, 'Tile (2, 2) must be flagged as ZOC stopped');
  // Since movement stopped at (2, 2), foot unit cannot move past enemy to (4, 2)
  assert.strictEqual(footReachable.has('4,2'), false, 'Foot unit cannot bypass enemy to reach (4, 2)');

  // 2. Light unit (cat_patrol) moving from (0, 2) ignores ZOC and can move through and beyond
  const lightUnit = { id: 'cat_patrol', role: 'assassin', team: 'ally', x: 0, y: 2, mov: 5, flyer: false, isLight: true };
  const lightReachable = getReachableTiles(board, lightUnit, [lightUnit, enemy], { zoc: true });
  const light22 = lightReachable.get('2,2');
  assert.ok(light22, 'Light unit can reach (2, 2)');
  assert.strictEqual(light22.zocStopped, false, 'Light unit must ignore ZOC stop');

  // 3. Flying unit (crane_rider) also ignores ZOC
  const flyUnit = { id: 'crane_rider', role: 'cavalry', team: 'ally', x: 0, y: 2, mov: 5, flyer: true };
  const flyReachable = getReachableTiles(board, flyUnit, [flyUnit, enemy], { zoc: true });
  const fly22 = flyReachable.get('2,2');
  assert.ok(fly22, 'Flying unit can reach (2, 2)');
  assert.strictEqual(fly22.zocStopped, false, 'Flying unit must ignore ZOC stop');
});

test('Rules: Flanking modifiers (+20% side, +50% back, +100% swift_shadow) and no counterattack from behind', () => {
  const terrain = new Array(13).fill('..........');
  const board = new Board(terrain);

  // Target facing East (facing = 1) at (3, 3)
  const defender = {
    id: 'target',
    team: 'enemy',
    x: 3,
    y: 3,
    hp: 50,
    def: 4,
    spd: 10,
    atk: 12,
    facing: 1
  };

  // Attacker ATK = 14. Base damage = 14 - 4 = 10.
  // 1. Side attack (North at 3, 2 attacking South into 3, 3)
  const sideAttacker = { id: 'ally_side', team: 'ally', x: 3, y: 2, atk: 14, spd: 10 };
  const sideCombat = calculateCombat(sideAttacker, defender, board);
  assert.strictEqual(sideCombat.direction, 'side');
  assert.strictEqual(sideCombat.isSideAttack, true);
  // Damage: 10 * 1.2 = 12
  assert.strictEqual(sideCombat.expectedDamage, 12, 'Side attack must deal +20% damage');
  assert.strictEqual(sideCombat.canCounter, true, 'Defender can still counter melee side attack');
  assert.ok(sideCombat.directionMarker.includes('側翼突襲'));
  assert.ok(sideCombat.directionMarker.includes('+20%'));

  // 2. Standard back attack (West at 2, 3 attacking East into 3, 3)
  const backAttacker = { id: 'ally_back', team: 'ally', x: 2, y: 3, atk: 14, spd: 10 };
  const backCombat = calculateCombat(backAttacker, defender, board);
  assert.strictEqual(backCombat.direction, 'back');
  assert.strictEqual(backCombat.isBackAttack, true);
  // Damage: 10 * 1.50 = 15
  assert.strictEqual(backCombat.expectedDamage, 15, 'Standard back attack must deal +50% damage');
  assert.strictEqual(backCombat.canCounter, false, 'Back attack MUST prevent defender counter-attack');
  assert.ok(backCombat.directionMarker.includes('背刺偷襲'));
  assert.ok(backCombat.directionMarker.includes('+50%'));

  // 3. Cat Patrol (swift_shadow) back attack (+100%)
  const catAttacker = { id: 'cat_patrol', team: 'ally', x: 2, y: 3, atk: 14, spd: 10, trait: { id: 'swift_shadow' } };
  const catCombat = calculateCombat(catAttacker, defender, board);
  assert.strictEqual(catCombat.expectedDamage, 20, 'Cat patrol back attack must deal +100% damage');
  assert.ok(catCombat.directionMarker.includes('疾影背刺'));
  assert.ok(catCombat.directionMarker.includes('+100%'));
});

test('Rules: Curse miasma (幽冥咒縛) tile effect slows MOV, ticks 4 damage, and is cleansed by fire/lantern', () => {
  const terrain = Array(13).fill('..........');
  const board = new Board(terrain);

  const footman = { id: 'footman', team: 'ally', x: 3, y: 5, mov: 3, hp: 20, flyer: false };
  const cursedTiles = new Set(['3,6']);

  // Movement cost into cursed tile is +1 (so step cost is 1 + 1 = 2)
  const reachable = getReachableTiles(board, footman, [footman], { cursedTiles });
  assert.strictEqual(reachable.get('3,6').cost, 2, 'Cursed tile should increase movement cost by +1');

  // Battle tick damage: unit on cursed tile takes 4 damage
  const battle = new Battle({ id: 7, terrain, deployTiles: [{ x: 3, y: 5 }] }, [footman]);
  battle.cursedTiles = new Set(['3,5']);
  const unitInBattle = battle.allies[0];
  const startHp = unitInBattle.hp;
  battle.tickCursedTiles();
  assert.strictEqual(unitInBattle.hp, startHp - 4, 'Unit on cursed tile must suffer 4 damage per turn');
  assert.ok(battle.eventLog.some(e => e.type === 'curse_damage'));

  // Cleanse by fire:
  battle.burningTiles.add('3,5');
  battle.tickCursedTiles();
  assert.strictEqual(battle.cursedTiles.has('3,5'), false, 'Cursed tile on fire must be cleansed');
});

test('Rules: Directional geometry (Line and Cone tiles)', () => {
  // Test Line (East: dx=1, dy=0, length=3 from (2, 2))
  const lineEast = Board.getLineTiles(2, 2, 1, 0, 3);
  assert.deepStrictEqual(lineEast, [{ x: 3, y: 2 }, { x: 4, y: 2 }, { x: 5, y: 2 }]);

  // Test Line (North: dx=0, dy=-1, length=2 from (2, 2))
  const lineNorth = Board.getLineTiles(2, 2, 0, -1, 2);
  assert.deepStrictEqual(lineNorth, [{ x: 2, y: 1 }, { x: 2, y: 0 }]);

  // Test Cone (East: dx=1, dy=0 from (2, 2)) -> forward 1 tile (3, 2), next column 3 tiles (4, 1), (4, 2), (4, 3)
  const coneEast = Board.getConeTiles(2, 2, 1, 0);
  assert.strictEqual(coneEast.length, 4);
  assert.ok(coneEast.some(t => t.x === 3 && t.y === 2));
  assert.ok(coneEast.some(t => t.x === 4 && t.y === 1));
  assert.ok(coneEast.some(t => t.x === 4 && t.y === 2));
  assert.ok(coneEast.some(t => t.x === 4 && t.y === 3));

  // Test Cone (South: dx=0, dy=1 from (2, 2)) -> forward 1 tile (2, 3), next row 3 tiles (1, 4), (2, 4), (3, 4)
  const coneSouth = Board.getConeTiles(2, 2, 0, 1);
  assert.strictEqual(coneSouth.length, 4);
  assert.ok(coneSouth.some(t => t.x === 2 && t.y === 3));
  assert.ok(coneSouth.some(t => t.x === 1 && t.y === 4));
  assert.ok(coneSouth.some(t => t.x === 2 && t.y === 4));
  assert.ok(coneSouth.some(t => t.x === 3 && t.y === 4));
});

test('Rules: Directional skills (Crane line gust) and magic (Flame fan cone)', () => {
  const terrain = Array(13).fill('..........');
  const craneProto = GUARDIAN_PROTOS.crane_rider;
  const foxProto = GUARDIAN_PROTOS.fox_maiden;

  assert.strictEqual(craneProto.skill.aoe, 'line', 'Crane rider skill must have aoe: line');
  assert.strictEqual(craneProto.skill.lineLength, 3);
  assert.strictEqual(foxProto.magic.aoe, 'cone', 'Fox maiden magic must have aoe: cone');

  // Battle test for line execution
  const ally = { ...craneProto, x: 2, y: 5, team: 'ally', hp: 24, mp: 6 };
  const foe1 = { id: 'foe1', name: '敵1', team: 'enemy', x: 3, y: 5, hp: 20, maxHp: 20, def: 0 };
  const foe2 = { id: 'foe2', name: '敵2', team: 'enemy', x: 4, y: 5, hp: 20, maxHp: 20, def: 0 };
  const foe3 = { id: 'foe3', name: '敵3', team: 'enemy', x: 5, y: 5, hp: 20, maxHp: 20, def: 0 };
  const foeOff = { id: 'foe_off', name: '敵旁', team: 'enemy', x: 3, y: 6, hp: 20, maxHp: 20, def: 0 };

  const battle = new Battle({ id: 1, terrain, deployTiles: [{ x: 2, y: 5 }] }, [ally]);
  battle.enemies = [foe1, foe2, foe3, foeOff];

  // Confirm crane line gust heading East (dx=1, dy=0)
  const res = battle.confirmAction(battle.allies[0], 'skill', null, { dx: 1, dy: 0 });
  assert.strictEqual(res.success, true);
  assert.ok(foe1.hp < 20, 'foe1 in line must be hit');
  assert.ok(foe2.hp < 20, 'foe2 in line must be hit');
  assert.ok(foe3.hp < 20, 'foe3 in line must be hit');
  assert.strictEqual(foeOff.hp, 20, 'foeOff outside line must remain unharmed');
});

test('Rules: Chapter 4 Boss Phases (Iron General at <=66% and <=33% HP)', () => {
  const terrain = Array(13).fill('..........');
  const ch4 = { id: 4, terrain, deployTiles: [{ x: 4, y: 10 }] };
  const ally = { ...GUARDIAN_PROTOS.bear_guard, x: 4, y: 3, team: 'ally', hp: 36, atk: 15 };
  const boss = { id: 'iron_general', name: '玄鐵巨將', team: 'enemy', x: 4, y: 2, hp: 60, maxHp: 60, atk: 16, def: 10, spd: 7 };

  const battle = new Battle(ch4, [ally]);
  battle.enemies = [boss];

  const origAtk = boss.atk;
  const origDef = boss.def;
  const origSpd = boss.spd;

  // Boss drops to 39 HP (65% <= 66%): Triggers Phase 2
  boss.hp = 39;
  battle.checkBossPhases();
  assert.strictEqual(boss.phase2Triggered, true);
  assert.strictEqual(boss.atk, origAtk + 2, 'Phase 2: Boss ATK increases by +2');
  assert.strictEqual(boss.def, origDef + 1, 'Phase 2: Boss DEF increases by +1');
  assert.ok(battle.eventLog.some(e => e.type === 'boss_phase' && e.phase === 2));

  // Boss drops to 18 HP (30% <= 33%): Triggers Phase 3
  boss.hp = 18;
  battle.checkBossPhases();
  assert.strictEqual(boss.phase3Triggered, true);
  assert.strictEqual(boss.atk, origAtk + 2 + 3, 'Phase 3: Boss ATK increases by +3 further');
  assert.strictEqual(boss.spd, origSpd + 2, 'Phase 3: Boss SPD increases by +2');
  assert.ok(battle.eventLog.some(e => e.type === 'boss_phase' && e.phase === 3));
});

test('Rules: Dynamic Chapter Twists (Ch5 weather fog change, Ch6 bridge collapse)', () => {
  const terrain = Array(13).fill('..........');
  
  // Chapter 5: Fog clears on turn 4
  const ch5 = { id: 5, terrain, maxTurns: 12, hasNightFog: true, deployTiles: [{ x: 4, y: 10 }] };
  const b5 = new Battle(ch5, [{ ...GUARDIAN_PROTOS.bear_guard, x: 4, y: 10 }]);
  b5.currentTurn = 3;
  b5.endEnemyPhase(); // Transitions into turn 4
  assert.strictEqual(b5.currentTurn, 4);
  assert.strictEqual(b5.chapter.hasNightFog, false, 'Chapter 5 fog must clear on turn 4');
  assert.ok(b5.eventLog.some(e => e.type === 'weather_change'));

  // Chapter 6: Bridge collapses on turn 4
  const ch6 = { id: 6, terrain, maxTurns: 15, hasCollapsibleBridge: true, deployTiles: [{ x: 4, y: 10 }] };
  const b6 = new Battle(ch6, [{ ...GUARDIAN_PROTOS.bear_guard, x: 4, y: 10 }]);
  b6.board.setTerrainChar(4, 8, 'b');
  b6.board.setTerrainChar(5, 8, 'b');
  b6.currentTurn = 3;
  b6.endEnemyPhase(); // Transitions into turn 4
  assert.strictEqual(b6.currentTurn, 4);
  assert.strictEqual(b6.bridgeCollapsed, true);
  assert.strictEqual(b6.board.getTerrain(4, 8).char, 'w', 'Bridge (4, 8) must collapse into water');
  assert.strictEqual(b6.board.getTerrain(5, 8).char, 'w', 'Bridge (5, 8) must collapse into water');
  assert.ok(b6.eventLog.some(e => e.type === 'bridge_collapse'));
});

test('Rules: Class synergy bonuses (spell_arrow +10% ranged dmg, iron_fortress +1 def, cavalry_coop +1 turn 1 mov)', () => {
  const terrain = Array(13).fill('..........');
  const board = new Board(terrain);

  // 1. spell_arrow (+10% ranged dmg when mage + archer in squad)
  const archerAlly = { id: 'archer_unit', team: 'ally', role: 'archer', cls: '弓手', x: 2, y: 5, atk: 20, spd: 10 };
  const mageAlly = { id: 'mage_unit', team: 'ally', role: 'mage', cls: '術士', x: 2, y: 6, mag: 15, spd: 10 };
  const soloAlly = { id: 'solo_archer', team: 'ally', role: 'archer', cls: '弓手', x: 2, y: 5, atk: 20, spd: 10 };
  const enemy = { id: 'target_foe', team: 'enemy', x: 4, y: 5, def: 0, hp: 50, spd: 10 };

  // Solo archer (dist = 2, front attack, atk 20 - def 0 = 20)
  const soloRes = calculateCombat(soloAlly, enemy, board, { allies: [soloAlly] });
  assert.strictEqual(soloRes.expectedDamage, 20);

  // With mage ally in squad -> spell_arrow active! +10% ranged damage = 20 * 1.1 = 22
  const synergyRes = calculateCombat(archerAlly, enemy, board, { allies: [archerAlly, mageAlly] });
  assert.strictEqual(synergyRes.expectedDamage, 22, 'spell_arrow synergy must grant +10% ranged damage');

  // 2. iron_fortress (+1 DEF when tank + healer in squad)
  const tankAlly = { id: 'bear_guard', team: 'ally', role: 'tank', x: 3, y: 5, def: 5, hp: 30, spd: 10, facing: 1 };
  const healerAlly = { id: 'tea_master', team: 'ally', role: 'healer', x: 3, y: 6, def: 2, hp: 25, spd: 10 };
  const attackerFoe = { id: 'foe_attacker', team: 'enemy', x: 4, y: 5, atk: 15, spd: 10 };

  // Tank defending without healer: 15 - 5 = 10 dmg (front)
  const noFortressRes = calculateCombat(attackerFoe, tankAlly, board, { allies: [tankAlly] });
  assert.strictEqual(noFortressRes.expectedDamage, 10);

  // Tank defending with healer in squad: def becomes 5 + 1 = 6, 15 - 6 = 9 dmg
  const fortressRes = calculateCombat(attackerFoe, tankAlly, board, { allies: [tankAlly, healerAlly] });
  assert.strictEqual(fortressRes.expectedDamage, 9, 'iron_fortress synergy must grant +1 defense to allies');

  // 3. cavalry_coop (+1 MOV on turn 1 when flanker + (cavalry or flyer) in squad)
  const catAlly = { ...GUARDIAN_PROTOS.cat_patrol, x: 2, y: 10 };
  const craneAlly = { ...GUARDIAN_PROTOS.crane_rider, x: 3, y: 10 };
  const ch = { id: 1, terrain, maxTurns: 10, deployTiles: [{ x: 2, y: 10 }, { x: 3, y: 10 }] };
  const battle = new Battle(ch, [catAlly, craneAlly]);
  assert.strictEqual(battle.currentTurn, 1);
  assert.strictEqual(battle.allies.find(u => u.id === 'cat_patrol').mov, GUARDIAN_PROTOS.cat_patrol.mov + 1, 'Turn 1 cavalry_coop grants +1 MOV');

  // Advances to turn 2
  battle.endEnemyPhase();
  assert.strictEqual(battle.currentTurn, 2);
  assert.strictEqual(battle.allies.find(u => u.id === 'cat_patrol').mov, GUARDIAN_PROTOS.cat_patrol.mov, 'Turn 2 cavalry_coop bonus reverts to standard MOV');
});

test('Rules: Morale system (士氣) dynamics and drops', () => {
  const terrain = Array(13).fill('..........');
  const board = new Board(terrain);
  const ch = { id: 8, terrain, maxTurns: 10, bossId: 'mountain_warlord', deployTiles: [{ x: 4, y: 8 }] };
  const ally = { ...GUARDIAN_PROTOS.cat_patrol, x: 4, y: 8, atk: 20, spd: 10 };
  const battle = new Battle(ch, [ally]);

  assert.strictEqual(battle.allyMorale, 100, 'Initial ally morale must be 100');
  assert.strictEqual(battle.enemyMorale, 100, 'Initial enemy morale must be 100');

  // Spawn enemy facing East (1)
  const enemy = { ...ENEMY_PROTOS.mountain_warlord, x: 4, y: 7, facing: 1, hp: 36, def: 0 };
  battle.enemies = [enemy];

  // Side attack from South (facing 1, attacking from south = side attack)
  // modifying morale on side attack: -2
  battle.modifyMorale('enemy', -2, '側翼奇襲');
  assert.strictEqual(battle.enemyMorale, 98, 'Side attack lowers enemy morale by 2');

  // Back attack from West (facing 1, attacking from west = back attack)
  battle.modifyMorale('enemy', -5, '背刺重創');
  assert.strictEqual(battle.enemyMorale, 93, 'Back attack lowers enemy morale by 5');

  // Killing enemy commander lowers morale by 25
  battle.modifyMorale('enemy', -25, '主將陣亡');
  assert.strictEqual(battle.enemyMorale, 68, 'Defeating commander lowers enemy morale by 25');
});

test('Rules: Shield phalanx (鐵壁盾陣) 85% frontal physical damage reduction and rolling_log stratagem break', () => {
  const terrain = Array(13).fill('..........');
  const board = new Board(terrain);

  // Phalanx enemy facing South (2), standing at (4, 4)
  const phalanx = {
    ...ENEMY_PROTOS.shield_phalanx,
    x: 4,
    y: 4,
    facing: 2, // Facing South (down towards y=5)
    def: 0,
    hp: 28,
    spd: 5
  };

  // Attacker at (4, 5) -> attacks from South -> FRONTAL attack!
  const attackerFront = {
    id: 'bear_guard',
    team: 'ally',
    x: 4,
    y: 5,
    atk: 20,
    spd: 8
  };

  // 1. Frontal physical attack: raw damage = (20 - 0) = 20. 85% blocked -> expected 20 * 0.15 = 3
  const frontRes = calculateCombat(attackerFront, phalanx, board);
  assert.strictEqual(frontRes.expectedDamage, 3, 'Phalanx blocks 85% frontal physical damage (20 * 0.15 = 3)');

  // 2. Back attack: attacker at (4, 3) -> attacks from North (behind facing 2)
  const attackerBack = {
    id: 'soldier_ally',
    team: 'ally',
    x: 4,
    y: 3,
    atk: 20,
    spd: 8
  };
  const backRes = calculateCombat(attackerBack, phalanx, board);
  // Back attack gets 1.5x damage and bypasses frontal shield wall: 20 * 1.5 = 30
  assert.strictEqual(backRes.expectedDamage, 30, 'Back attack deals full 1.5x damage without frontal shield reduction');

  // 3. Magic attack from front: magic bypasses frontal shield wall: (mag 20 - res 2) * 1.0 = 18
  const magicAttacker = {
    id: 'tanuki_mage',
    team: 'ally',
    role: 'mage',
    x: 4,
    y: 5,
    mag: 20,
    spd: 8
  };
  const magicRes = calculateCombat(magicAttacker, phalanx, board, { actionType: 'magic', skill: { isMagic: true, type: 'magic' } });
  assert.strictEqual(magicRes.expectedDamage, 18, 'Magic attack bypasses frontal shield wall');

  // 4. Rolling log stratagem shatters shield phalanx
  const ch = { id: 8, terrain, maxTurns: 10, deployTiles: [{ x: 4, y: 11 }] };
  const battle = new Battle(ch, [{ id: 'bear', team: 'ally', x: 4, y: 11 }]);
  battle.enemies = [phalanx];

  battle.triggerRollingLog([4]);
  assert.strictEqual(phalanx.hp, 28 - 16, 'Rolling log deals 16 damage');
  assert.strictEqual(phalanx.phalanxBroken, true, 'Rolling log shatters phalanx shield');

  // Now frontal physical attack deals full damage because phalanxBroken is true!
  // Phalanx was pushed down to y=5 by rolling log, so attacker attacks from (4, 6) (front south)
  const brokenRes = calculateCombat({ ...attackerFront, y: 6 }, phalanx, board);
  assert.strictEqual(brokenRes.expectedDamage, 20, 'Broken phalanx takes full frontal physical damage');
});

test('Rules: Class badges and Tutorial Beat 1 identity agreement', () => {
  // 1. Verify every guardian has matching class badge
  assert.strictEqual(GUARDIAN_PROTOS.bear_guard.clsBadge, '盾', 'Bear Guard (armoured tank) must have 盾 badge');
  assert.strictEqual(GUARDIAN_PROTOS.cat_patrol.clsBadge, '劍', 'Cat Patrol (swordsman) must have 劍 badge');
  assert.strictEqual(GUARDIAN_PROTOS.lantern_crafter.clsBadge, '弓', 'Lantern Crafter must have 弓 badge');
  assert.strictEqual(GUARDIAN_PROTOS.tea_master.clsBadge, '醫', 'Tea Master must have 醫 badge');
  assert.strictEqual(GUARDIAN_PROTOS.crane_rider.clsBadge, '飛', 'Crane Rider must have 飛 badge');

  // 2. Verify Chapter 1 initial deployment and tutorial beat 1 tile
  const ch1 = CHAPTERS[0];
  const squad = ['bear_guard', 'cat_patrol', 'lantern_crafter', 'tea_master'].map(id => ({ ...GUARDIAN_PROTOS[id] }));
  const battle = new Battle(ch1, squad);

  // Unit placed on tile (1, 11) must be bear_guard
  const unitAt1_11 = battle.getUnitAt(1, 11);
  assert.ok(unitAt1_11, 'Unit must exist at (1, 11)');
  assert.strictEqual(unitAt1_11.id, 'bear_guard', 'Unit at (1, 11) must be bear_guard');
  assert.strictEqual(unitAt1_11.name, '熊岳', 'Unit at (1, 11) must be named 熊岳');
  assert.strictEqual(unitAt1_11.clsBadge, '盾', 'Unit at (1, 11) must display 盾 badge');
});

test('Rules: Morale Rally (擂鼓) stratagem and routed enemy flee bonus XP', () => {
  const terrain = new Array(13).fill('..........');
  const ch = { id: 1, terrain, deployTiles: [{ x: 2, y: 5 }, { x: 3, y: 5 }, { x: 7, y: 5 }] };
  const camp = new CampaignManager();

  // Test 1: Rally stratagem (+25 morale, +1 MOV within radius 2)
  const bear = { id: 'bear_guard', name: '熊岳', team: 'ally', x: 2, y: 5, hp: 30, maxHp: 30, mov: 3 };
  const cat = { id: 'cat_patrol', name: '墨影', team: 'ally', x: 3, y: 5, hp: 28, maxHp: 28, mov: 5 }; // dist 1 <= 2
  const farAlly = { id: 'far_ally', name: '遠衛', team: 'ally', x: 7, y: 5, hp: 20, maxHp: 20, mov: 4 }; // dist 5 > 2

  const battle = new Battle(ch, [bear, cat, farAlly], 'rally', camp, new RNG(1));

  const battleCat = battle.allies.find(a => a.id === 'cat_patrol');
  const battleFar = battle.allies.find(a => a.id === 'far_ally');

  // Ally morale drops to 60 due to combat
  battle.allyMorale = 60;
  assert.strictEqual(battleCat.mov, 5, 'MOV starts unbuffed before rally is cast');

  const triggered = battle.triggerRally();
  assert.strictEqual(triggered, true, 'Rally stratagem triggers successfully mid-battle');
  assert.strictEqual(battle.allyMorale, 85, 'Rally stratagem adds +25 to ally morale (60 -> 85)');
  assert.strictEqual(battleCat.mov, 6, 'Allies within radius 2 gain +1 MOV (5 -> 6)');
  assert.strictEqual(battleFar.mov, 4, 'Allies outside radius 2 do not gain MOV');

  // Once per battle constraint
  assert.strictEqual(battle.triggerRally(), false, 'Rally cannot be cast twice in the same battle');

  // Test 2: Routed enemy defeat grants +5 bonus XP
  const enemy = { id: 'shadow_rat', name: '匿鼠', team: 'enemy', x: 2, y: 4, hp: 1, maxHp: 16, isRouted: true };
  battle.enemies = [enemy];

  const prevExp = camp.getUnitInstance('cat_patrol').exp || 0;
  // Cat defeats routed enemy
  battle.processCombatMorale(battleCat, enemy, { preview: {}, attackerAlive: true, defenderAlive: false });
  assert.strictEqual(camp.getUnitInstance('cat_patrol').exp, prevExp + 5, 'Defeating a routed enemy awards +5 bonus XP');
});
