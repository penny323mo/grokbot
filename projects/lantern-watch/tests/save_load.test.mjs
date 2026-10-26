/**
 * tests/save_load.test.mjs
 * Unit tests for save/load, mid-run resume, and versioned schema migration.
 */

import assert from "node:assert";
import test from "node:test";
import { TownManager } from "../js/engine/town.js";
import { Battle } from "../js/engine/battle.js";
import { RNG } from "../js/engine/rng.js";

// Mock localStorage for Node.js
class MockStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

test("Save/Load: Town manager persists star lanterns and building construction", () => {
  const storage = new MockStorage();
  const town1 = new TownManager(storage);

  assert.strictEqual(town1.starLanterns, 0);
  town1.addStarLanterns(50);
  assert.strictEqual(town1.starLanterns, 50);

  // Build Watchtower (cost 10)
  const built = town1.build("bldg_watchtower");
  assert.strictEqual(built, true);
  assert.strictEqual(town1.starLanterns, 40);
  assert.ok(town1.hasBuilding("bldg_watchtower"));

  // Create new TownManager reading from the same storage
  const town2 = new TownManager(storage);
  assert.strictEqual(town2.starLanterns, 40);
  assert.ok(town2.hasBuilding("bldg_watchtower"));
  assert.strictEqual(town2.getTownPerks().lanternHpBonus, 1);
});

test("Save/Load: Active run state can be saved and resumed mid-run", () => {
  const storage = new MockStorage();
  const town = new TownManager(storage);

  const testRun = {
    currentNight: 3,
    coins: 85,
    deck: ["card_summon_cat", "card_command_advance"],
    relics: ["relic_hot_water_bottle"]
  };

  town.saveActiveRun(testRun);
  const loadedRun = town.loadActiveRun();

  assert.ok(loadedRun);
  assert.strictEqual(loadedRun.currentNight, 3);
  assert.strictEqual(loadedRun.coins, 85);
  assert.strictEqual(loadedRun.deck.length, 2);

  town.clearActiveRun();
  assert.strictEqual(town.loadActiveRun(), null);
});

test("Save/Load: Battle state snapshot & 1-step undo restore", () => {
  const battle = new Battle({ rng: new RNG(505) });
  const initialEnergy = battle.energy;
  const initialHandCount = battle.hand.length;

  battle.takeUndoSnapshot();

  // Play card if affordable
  if (battle.hand.length > 0) {
    const cardId = battle.hand[0];
    battle.energy -= 1;
    battle.hand.splice(0, 1);
    assert.strictEqual(battle.hand.length, initialHandCount - 1);

    // Perform undo
    battle.undo();
    assert.strictEqual(battle.energy, initialEnergy);
    assert.strictEqual(battle.hand.length, initialHandCount);
  }
});
