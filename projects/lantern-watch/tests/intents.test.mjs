/**
 * tests/intents.test.mjs
 * Unit tests for AI intent calculations, telegraph accuracy, and Scarecrow taunt.
 */

import assert from "node:assert";
import test from "node:test";
import { Battle } from "../js/engine/battle.js";
import { RNG } from "../js/engine/rng.js";
import { calculateEnemyIntents } from "../js/engine/ai.js";

test("Intents: Enemy calculates path and damage telegraph towards nearest lantern", () => {
  const battle = new Battle({ rng: new RNG(303) });
  // Clear any auto-spawned enemies for clean test
  battle.enemies = [];
  for (let y = 0; y < battle.board.rows; y++) {
    for (let x = 0; x < battle.board.cols; x++) {
      battle.board.tiles[y][x].unit = null;
    }
  }

  // Spawn a fog blob at (2, 2)
  const enemy = battle.spawnEnemy("fog_blob", 2, 2);
  assert.ok(enemy);

  battle.updateEnemyIntents();

  assert.ok(enemy.intent, "Enemy must have intent calculated");
  assert.ok(enemy.intent.destPos, "Intent must include destination position");
  assert.ok(enemy.intent.path.length > 0, "Intent must include path");
  // Target should be closest lantern (middle lantern at (2, 5))
  assert.strictEqual(enemy.intent.targetLanternId, "lantern_mid");
});

test("Intents: Scarecrow taunt forces nearby enemies to prioritize Scarecrow", () => {
  const battle = new Battle({ rng: new RNG(404) });
  battle.enemies = [];
  for (let y = 0; y < battle.board.rows; y++) {
    for (let x = 0; x < battle.board.cols; x++) {
      battle.board.tiles[y][x].unit = null;
    }
  }

  // Spawn Scarecrow at (2, 3)
  const scarecrow = battle.spawnGuardian("scarecrow", 2, 3);
  // Spawn Fog Blob at (2, 1) (distance = 2, within taunt radius)
  const enemy = battle.spawnEnemy("fog_blob", 2, 1);

  battle.updateEnemyIntents();

  assert.ok(enemy.intent);
  assert.strictEqual(enemy.intent.targetGuardianId, scarecrow.id, "Scarecrow taunt should divert target from lantern to Scarecrow");
});
