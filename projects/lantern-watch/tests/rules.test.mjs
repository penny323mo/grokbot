/**
 * tests/rules.test.mjs
 * Unit tests for tactics rules: damage, armor, push collisions, water shock, and tag resonances.
 */

import assert from "node:assert";
import test from "node:test";
import { Board } from "../js/engine/board.js";
import { Battle } from "../js/engine/battle.js";
import { RNG } from "../js/engine/rng.js";
import { getCardById } from "../js/engine/cards.js";
import { TAGS, TERRAINS, DIFFICULTIES } from "../js/engine/constants.js";

test("Rules: Damage calculation and armor absorption", () => {
  const battle = new Battle({ rng: new RNG(101) });
  const guardian = battle.spawnGuardian("cat_patrol", 2, 4, 0, 0, 3); // HP: 8, Armor: 3

  assert.strictEqual(guardian.armor, 3);
  assert.strictEqual(guardian.hp, 8);

  // Attack with 2 damage -> armor absorbs completely
  battle.damageUnit(guardian, 2);
  assert.strictEqual(guardian.armor, 1);
  assert.strictEqual(guardian.hp, 8);

  // Attack with 4 damage -> armor broken, remaining 3 damage to HP
  battle.damageUnit(guardian, 4);
  assert.strictEqual(guardian.armor, 0);
  assert.strictEqual(guardian.hp, 5);
});

test("Rules: Push physics, boundary collision, and water shock damage", () => {
  const board = new Board();
  board.initTiles();

  // Set tile (2, 2) to water
  board.tiles[2][2].terrain = TERRAINS.WATER;

  const dummyUnit = { id: "test_dummy", x: 2, y: 3, hp: 10, armor: 0 };
  board.tiles[3][2].unit = dummyUnit;

  // Push north into water tile (2, 2)
  const pushRes = board.pushUnit(dummyUnit, 0, -1, 1);
  assert.strictEqual(pushRes.moved, true);
  assert.strictEqual(dummyUnit.y, 2);

  // Should have triggered water_shock damage event (2 damage)
  const waterShock = pushRes.damageEvents.find((e) => e.reason === "water_shock");
  assert.ok(waterShock, "Water shock damage should be triggered");
  assert.strictEqual(waterShock.damage, 2);

  // Push unit further north towards boundary (y = 0)
  board.pushUnit(dummyUnit, 0, -1, 2); // now at y = 0
  assert.strictEqual(dummyUnit.y, 0);

  // Push past top boundary -> collision with wall
  const wallPush = board.pushUnit(dummyUnit, 0, -1, 1);
  assert.ok(wallPush.collision, "Should collide with boundary");
  assert.strictEqual(wallPush.collision.type, "boundary");
});

test("Rules: Tag Resonance activation", () => {
  const battle = new Battle({ rng: new RNG(202) });
  // Spawn two Guard (守) units
  battle.spawnGuardian("cat_patrol", 1, 4); // [毛, 守]
  battle.spawnGuardian("scarecrow", 3, 4);  // [守, 毛]

  const tags = battle.getActiveTags();
  assert.ok(tags.includes(TAGS.GUARD), "Should activate Guard tag resonance");
  assert.ok(tags.includes(TAGS.FURRY), "Should activate Furry tag resonance");
});

test("Rules: Card upgrades verification", () => {
  const baseCard = getCardById("card_command_advance");
  assert.ok(baseCard, "Base card should exist");
  assert.ok(baseCard.upgrade, "Base card should have upgrade definition");

  const upgradedCard = getCardById(baseCard.upgrade.id);
  assert.ok(upgradedCard, "Upgraded card should be retrievable");
  assert.strictEqual(upgradedCard.isUpgraded, true);
  assert.strictEqual(upgradedCard.bonusAtk, 2);
});

test("Rules: Starting deck cards assert board deltas", () => {
  const battle = new Battle({ rng: new RNG(303) });
  // Clean board
  battle.enemies = [];
  battle.guardians = [];
  for (let r = 0; r < battle.board.rows; r++) {
    for (let c = 0; c < battle.board.cols; c++) {
      battle.board.tiles[r][c].unit = null;
      battle.board.tiles[r][c].trap = null;
    }
  }

  // 1. Play summon card: card_summon_cat onto (2, 4)
  battle.hand = ["card_summon_cat"];
  battle.energy = 3;
  const resSummon = battle.playCard(0, 2, 4);
  assert.strictEqual(resSummon.success, true, "Summon cat should succeed");
  const cat = battle.board.getUnitAt(2, 4);
  assert.ok(cat, "Cat patrol should be deployed on tile (2, 4)");
  assert.strictEqual(cat.unitId, "cat_patrol");
  assert.strictEqual(battle.energy, 2);

  // Spawn an enemy at (2, 1) with enough HP to survive advance strike
  const enemy = battle.spawnEnemy("fog_blob", 2, 1);
  enemy.hp = 12;
  enemy.maxHp = 12;
  assert.ok(enemy, "Enemy should spawn at (2, 1)");
  const enemyStartHp = enemy.hp;

  // 2. Play advance card: card_command_advance on cat at (2, 4)
  // Cat advances up to 2 tiles forward into empty space (from y=4 to y=2) and strikes enemy at (2, 1)
  battle.hand = ["card_command_advance"];
  battle.energy = 3;
  const resAdvance = battle.playCard(0, 2, 4);
  assert.strictEqual(resAdvance.success, true, "Advance command should succeed");
  assert.strictEqual(cat.y, 2, "Cat should advance 2 tiles forward to y=2");
  assert.ok(enemy.hp < enemyStartHp, "Enemy should take damage from advance attack");

  // 3. Play rally card: card_command_rally on cat at (2, 2)
  // Cat rallies towards row 5 (steps back to y=3)
  battle.hand = ["card_command_rally"];
  battle.energy = 3;
  const resRally = battle.playCard(0, 2, 2);
  assert.strictEqual(resRally.success, true, "Rally command should succeed");
  assert.strictEqual(cat.y, 3, "Cat should step back towards row 5 to y=3");

  // 4. Play reposition card: card_command_reposition on cat at (2, 3)
  battle.hand = ["card_command_reposition"];
  battle.energy = 3;
  const resReposition = battle.playCard(0, 2, 3);
  assert.strictEqual(resReposition.success, true, "Reposition should succeed");

  // 5. Play freeze mist card: card_spell_freeze_mist on enemy at (2, 1)
  battle.hand = ["card_spell_freeze_mist"];
  battle.energy = 3;
  const resFreeze = battle.playCard(0, 2, 1);
  assert.strictEqual(resFreeze.success, true, "Freeze mist should succeed");
  assert.strictEqual(enemy.isFrozen, true, "Enemy should be frozen");
  assert.strictEqual(enemy.intent.type, "frozen");

  // 6. Play bamboo trap card: card_spell_bamboo_trap on empty tile (2, 3)
  battle.hand = ["card_spell_bamboo_trap"];
  battle.energy = 3;
  const resTrap = battle.playCard(0, 2, 3);
  assert.strictEqual(resTrap.success, true, "Bamboo trap should succeed");
  assert.ok(battle.board.tiles[3][2].trap, "Tile (2, 3) should have a trap placed");

  // 7. Play lantern ignite card: card_lantern_ignite
  // Enemy at (2, 1) is in fog rows (y <= 1)
  battle.hand = ["card_lantern_ignite"];
  battle.energy = 3;
  const hpBeforeIgnite = enemy.hp;
  const resIgnite = battle.playCard(0);
  assert.strictEqual(resIgnite.success, true, "Lantern ignite should succeed");
  assert.ok(enemy.hp < hpBeforeIgnite, "Enemy in fog row should take ignite damage");
});

test("Rules: Boss specials and unit skills execution", () => {
  const battle = new Battle({ rng: new RNG(404) });
  battle.enemies = [];
  battle.guardians = [];
  for (let r = 0; r < battle.board.rows; r++) {
    for (let c = 0; c < battle.board.cols; c++) {
      battle.board.tiles[r][c].unit = null;
    }
  }

  // 1. Tanuki mage push back skill
  const tanuki = battle.spawnGuardian("tanuki_mage", 2, 4);
  const blob = battle.spawnEnemy("fog_blob", 2, 3);
  battle.endPlayerTurn();
  // Tanuki attacked blob and pushed it back to y = 2
  assert.strictEqual(blob.y, 2, "Tanuki should push attacked enemy back 1 tile");

  // 2. Scarecrow taunt & reflect
  const scarecrow = battle.spawnGuardian("scarecrow", 1, 4);
  const meleeEnemy = battle.spawnEnemy("fog_blob", 1, 3);
  const meleeStartHp = meleeEnemy.hp;
  // Melee enemy attacks scarecrow
  battle.damageUnit(scarecrow, 2, meleeEnemy);
  assert.ok(meleeEnemy.hp < meleeStartHp, "Scarecrow should reflect damage to melee attacker");
});

test("Rules: Round 2 - Cat advance double swipe and bun drop on relocation", () => {
  const battle = new Battle({ rng: new RNG(505) });
  battle.enemies = [];
  battle.guardians = [];
  for (let r = 0; r < battle.board.rows; r++) {
    for (let c = 0; c < battle.board.cols; c++) {
      battle.board.tiles[r][c].unit = null;
      battle.board.tiles[r][c].bun = null;
      battle.board.tiles[r][c].trap = null;
    }
  }

  // Deploy bear baker at (1, 4) and cat patrol at (2, 4)
  const bear = battle.spawnGuardian("bear_baker", 1, 4);
  const cat = battle.spawnGuardian("cat_patrol", 2, 4);
  const target = battle.spawnEnemy("armored_snail", 2, 2);
  target.armor = 0;
  target.hp = 20;

  // Reposition bear: should drop bun on (1, 4)
  battle.hand = ["card_command_reposition"];
  battle.energy = 3;
  const resRepo = battle.playCard(0, 1, 4);
  assert.strictEqual(resRepo.success, true);
  assert.strictEqual(bear.hasMoved, true);
  assert.ok(battle.board.tiles[4][1].bun, "Bear baker should leave a bun on vacated tile upon reposition");

  // Advance cat: cat moves from (2, 4) to (2, 3), stepsMoved = 1, strikes target at (2, 2)
  // Double swipe: cat.atk (3) * 2 = 6 damage
  const hpBeforeAdvance = target.hp;
  battle.hand = ["card_command_advance"];
  battle.energy = 3;
  const resAdv = battle.playCard(0, 2, 4);
  assert.strictEqual(resAdv.success, true);
  assert.strictEqual(cat.y, 3);
  assert.strictEqual(cat.hasMoved, true);
  assert.strictEqual(target.hp, hpBeforeAdvance - 6, "Cat double swipe on advance should deal 2x atk (6 damage)");
});

test("Rules: Round 2 - Bamboo trap detonates and roots walking enemy", () => {
  const battle = new Battle({ rng: new RNG(606) });
  battle.enemies = [];
  battle.guardians = [];
  for (let r = 0; r < battle.board.rows; r++) {
    for (let c = 0; c < battle.board.cols; c++) {
      battle.board.tiles[r][c].unit = null;
      battle.board.tiles[r][c].trap = null;
    }
  }

  // Place bamboo trap at (2, 2)
  battle.board.tiles[2][2].trap = { damage: 5 };

  // Place enemy at (2, 1) heading to lantern at (2, 5)
  const enemy = battle.spawnEnemy("fog_blob", 2, 1);
  enemy.hp = 10;
  enemy.maxHp = 10;

  // Recalculate intents so intent.destPos is (2, 2)
  battle.updateEnemyIntents();
  assert.deepStrictEqual(enemy.intent.destPos, { x: 2, y: 2 });

  // End turn: enemy walks onto (2, 2) and steps on trap
  battle.endPlayerTurn();

  assert.strictEqual(enemy.y, 2, "Enemy should have walked into (2, 2)");
  assert.strictEqual(battle.board.tiles[2][2].trap, null, "Trap should have detonated and disappeared");
  assert.strictEqual(enemy.hp, 5, "Enemy should have taken 5 damage from trap");
  assert.strictEqual(enemy.isRooted, true, "Enemy should be rooted after walking into trap");
});

test("Rules: Round 2 - Guardian halo aura buffs adjacent allies", () => {
  const battle = new Battle({ rng: new RNG(707) });
  battle.enemies = [];
  battle.guardians = [];
  for (let r = 0; r < battle.board.rows; r++) {
    for (let c = 0; c < battle.board.cols; c++) {
      battle.board.tiles[r][c].unit = null;
    }
  }

  // Deploy halo bearer at (2, 4) and ally at (2, 3)
  const haloBearer = battle.spawnGuardian("scarecrow", 2, 4);
  const ally = battle.spawnGuardian("tanuki_mage", 2, 3);
  const enemy = battle.spawnEnemy("fog_blob", 2, 2);
  enemy.hp = 15;

  assert.strictEqual(battle.getGuardianAtk(ally), ally.atk, "Before halo, ally has normal atk");

  // Play halo card on scarecrow
  battle.hand = ["card_lantern_guardian_halo"];
  battle.energy = 3;
  const resHalo = battle.playCard(0, 2, 4);
  assert.strictEqual(resHalo.success, true);
  assert.strictEqual(haloBearer.hasHalo, true);

  // Ally is adjacent to haloBearer: should gain +1 attack
  assert.strictEqual(battle.getGuardianAtk(ally), ally.atk + 1, "Adjacent ally should gain +1 attack from halo");

  // Play halo+ on scarecrow: should grant +2 attack
  battle.hand = ["card_lantern_guardian_halo_plus"];
  battle.energy = 3;
  battle.playCard(0, 2, 4);
  assert.strictEqual(battle.getGuardianAtk(ally), ally.atk + 2, "Adjacent ally should gain +2 attack from halo+");
});

test("Rules: Round 2 - Tactical swap swaps nearest ally and upgraded draws 1 card", () => {
  const battle = new Battle({ rng: new RNG(808) });
  battle.enemies = [];
  battle.guardians = [];
  for (let r = 0; r < battle.board.rows; r++) {
    for (let c = 0; c < battle.board.cols; c++) {
      battle.board.tiles[r][c].unit = null;
    }
  }

  const g1 = battle.spawnGuardian("cat_patrol", 1, 4);
  const g2 = battle.spawnGuardian("bear_baker", 2, 4);
  const g3 = battle.spawnGuardian("tanuki_mage", 4, 4);

  // Swap targeting g1 at (1, 4). Nearest ally is g2 at (2, 4).
  battle.deck = ["card_spell_gust"];
  battle.hand = ["card_command_tactical_swap_plus"];
  battle.energy = 3;
  const resSwap = battle.playCard(0, 1, 4);
  assert.strictEqual(resSwap.success, true);

  assert.strictEqual(g1.x, 2, "g1 swapped to (2, 4)");
  assert.strictEqual(g2.x, 1, "g2 swapped to (1, 4)");
  assert.strictEqual(g3.x, 4, "g3 stayed at (4, 4)");
  assert.strictEqual(g1.armor >= 3, true, "Swapped unit received armor");
  assert.strictEqual(g2.armor >= 3, true, "Swapped unit received armor");
  assert.strictEqual(battle.hand.length, 1, "Plus version of tactical swap should draw 1 card");
});

test("Rules: Round 3 - Board.isEmpty excludes lantern posts and advance diagonal step", () => {
  const battle = new Battle({ rng: new RNG(909) });

  // 1. Lantern posts are never empty
  assert.strictEqual(battle.board.isEmpty(0, 5), false, "Lantern at (0, 5) should not be considered empty");
  assert.strictEqual(battle.board.isEmpty(2, 5), false, "Lantern at (2, 5) should not be considered empty");
  assert.strictEqual(battle.board.isEmpty(4, 5), false, "Lantern at (4, 5) should not be considered empty");

  // 2. Advance diagonal forward when straight north is blocked
  battle.enemies = [];
  battle.guardians = [];
  for (let r = 0; r < battle.board.rows; r++) {
    for (let c = 0; c < battle.board.cols; c++) {
      battle.board.tiles[r][c].unit = null;
    }
  }

  const cat = battle.spawnGuardian("cat_patrol", 2, 4);
  // Place an obstacle/unit directly north at (2, 3)
  battle.spawnGuardian("scarecrow", 2, 3);

  // Cat plays advance: (2, 3) is blocked, so cat advances diagonally to (1, 3) or (3, 3)
  battle.hand = ["card_command_advance"];
  battle.energy = 3;
  const resAdv = battle.playCard(0, 2, 4);
  assert.strictEqual(resAdv.success, true);
  assert.strictEqual(cat.y, 2, "Cat should advance 2 steps forward to row 2");
  assert.ok(cat.x === 1 || cat.x === 3, "Cat should step diagonally forward when straight north is blocked");
});

test("Rules: Round 3 - Windchime curse reduces attack and Fox Maiden cleanses", () => {
  const battle = new Battle({ rng: new RNG(1010) });
  battle.enemies = [];
  battle.guardians = [];
  for (let r = 0; r < battle.board.rows; r++) {
    for (let c = 0; c < battle.board.cols; c++) {
      battle.board.tiles[r][c].unit = null;
    }
  }

  const cat = battle.spawnGuardian("cat_patrol", 2, 4);
  const baseAtk = battle.getGuardianAtk(cat);

  // Curse the cat
  cat.curseAtk = 1;
  assert.strictEqual(battle.getGuardianAtk(cat), baseAtk - 1, "Curse should reduce attack power by 1");

  // Spawn Fox Maiden: cleanses curse from all friendly units
  battle.spawnGuardian("fox_maiden", 3, 4);
  assert.strictEqual(cat.curseAtk, 0, "Fox Maiden on-spawn should cleanse curses");
  assert.strictEqual(battle.getGuardianAtk(cat), baseAtk, "Cat attack power should be restored");
});

test("Rules: v2 - Lantern tiles cannot be targeted by summon or attack spells", () => {
  const battle = new Battle({ rng: new RNG(1111) });
  // Lanterns are at (0, 5), (2, 5), (4, 5)

  // 1. Summon card cannot target lantern tile
  battle.hand = ["card_summon_cat"];
  battle.energy = 3;
  const resSummon = battle.playCard(0, 2, 5);
  assert.strictEqual(resSummon.success, false, "Cannot summon on top of a lantern tile");

  // 2. Attack spell (fireball) cannot target lantern tile
  battle.hand = ["card_spell_fireball"];
  battle.energy = 3;
  const resFireball = battle.playCard(0, 2, 5);
  assert.strictEqual(resFireball.success, false, "Offensive spell cannot target a lantern tile");

  // 3. Move guardian cannot move into a lantern tile
  const cat = battle.spawnGuardian("cat_patrol", 2, 4);
  const resMove = battle.moveGuardian(cat, 2, 5);
  assert.strictEqual(resMove.success, false, "Guardian cannot step onto a lantern tile");
});

test("Rules: v2 - Cat Patrol card description matches mobile double damage logic", () => {
  const battle = new Battle({ rng: new RNG(1212) });
  const cat = battle.spawnGuardian("cat_patrol", 2, 4);
  assert.strictEqual(cat.hasMoved, false);

  // Moving 1 step sets hasMoved = true
  const resMove = battle.moveGuardian(cat, 2, 3);
  assert.strictEqual(resMove.success, true);
  assert.strictEqual(cat.hasMoved, true);

  // Spawn enemy in front at (2, 2)
  const enemy = battle.spawnEnemy("fog_blob", 2, 2);
  enemy.hp = 10;
  enemy.maxHp = 10;

  // Cat attacks: 3 * 2 = 6 damage
  battle.endPlayerTurn();
  assert.strictEqual(enemy.hp, 4, "Cat patrol should deal double damage (6 dmg) after moving 1 or more steps");
});
