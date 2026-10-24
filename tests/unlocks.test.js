/**
 * 12碼讀心戰 (Penalty Mind Game v2) - Stars, Unlocks & Trophy Unit Tests
 * Tests match star calculation, unlocking logic, cosmetic equipping,
 * trophy achievements, and safe localStorage persistence.
 */

import assert from 'assert';
import { UnlocksManager, UNLOCK_CATALOG, TROPHIES } from '../src/unlocks.js';

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ FAIL: ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

console.log('--- Running Unlocks & Trophy System (src/unlocks.js) Unit Tests ---\n');

test('Catalog contains valid balls, kits, stadiums, and trophies', () => {
  assert(UNLOCK_CATALOG.balls.length >= 4, 'Must have at least 4 balls');
  assert(UNLOCK_CATALOG.kits.length >= 4, 'Must have at least 4 kits');
  assert(UNLOCK_CATALOG.stadiums.length >= 3, 'Must have at least 3 stadium atmospheres');
  assert(TROPHIES.length >= 6, 'Must have at least 6 trophies');
});

test('Star calculation correctly breaks down and totals performance bonuses', () => {
  const um = new UnlocksManager();

  // Basic single match win
  const res1 = um.calculateMatchStars({ won: true, savesCount: 1, predictability: 50, cleanSheet: false });
  assert.strictEqual(res1.total, 1);

  // Tournament win with 3 saves and low predictability
  const res2 = um.calculateMatchStars({ won: true, savesCount: 3, predictability: 24, cleanSheet: false, isTournament: true });
  assert.strictEqual(res2.total, 4, '2 (tourney) + 1 (saves) + 1 (predictability)');

  // World cup champion sweep clean sheet
  const res3 = um.calculateMatchStars({ won: true, savesCount: 4, predictability: 18, cleanSheet: true, isTournament: true, isChampion: true });
  assert.strictEqual(res3.total, 10, '2 + 1 + 1 + 1 + 5 = 10 stars');

  // Loss yields 0 stars
  const res4 = um.calculateMatchStars({ won: false, savesCount: 2, predictability: 20 });
  assert.strictEqual(res4.total, 0);
});

test('Unlocking items enforces star costs and deducts star currency', () => {
  const um = new UnlocksManager();
  um.stars = 5;

  // Try unlocking 6-star cyber ball with only 5 stars -> fails
  const failRes = um.unlock('ball_cyber');
  assert.strictEqual(failRes.success, false);
  assert.strictEqual(failRes.reason, 'insufficient_stars');
  assert.strictEqual(um.isUnlocked('ball_cyber'), false);

  // Unlock 3-star fire ball -> succeeds, 2 stars remaining
  const succRes = um.unlock('ball_fire');
  assert.strictEqual(succRes.success, true);
  assert.strictEqual(um.isUnlocked('ball_fire'), true);
  assert.strictEqual(um.getStars(), 2);

  // Equip unlocked ball
  const eqRes = um.equip('ball', 'ball_fire');
  assert.strictEqual(eqRes, true);
  assert.strictEqual(um.getEquipped().ball, 'ball_fire');

  // Attempt to equip locked ball -> fails
  const eqLocked = um.equip('ball', 'ball_cyber');
  assert.strictEqual(eqLocked, false);
  assert.strictEqual(um.getEquipped().ball, 'ball_fire');
});

test('Trophy awards grant achievements and guard against duplicates', () => {
  const um = new UnlocksManager();

  assert.strictEqual(um.hasTrophy('trophy_champ'), false);
  const award1 = um.awardTrophy('trophy_champ');
  assert(award1 !== null);
  assert.strictEqual(award1.id, 'trophy_champ');
  assert.strictEqual(um.hasTrophy('trophy_champ'), true);

  // Second award of same trophy returns null (no duplicate)
  const award2 = um.awardTrophy('trophy_champ');
  assert.strictEqual(award2, null);
});

test('Safe localStorage persistence: survives missing or corrupt storage data', () => {
  const fakeStorage = {};
  global.localStorage = {
    getItem: (k) => fakeStorage[k] || null,
    setItem: (k, v) => { fakeStorage[k] = v; },
    removeItem: (k) => { delete fakeStorage[k]; }
  };

  const um = new UnlocksManager();
  um.stars = 15;
  um.unlock('stadium_sunset');
  um.equip('stadium', 'stadium_sunset');
  um.awardTrophy('trophy_dead_eye');
  um.save();

  // Reload in new instance
  const um2 = new UnlocksManager();
  assert.strictEqual(um2.getStars(), 10); // 15 - 5 = 10
  assert.strictEqual(um2.isUnlocked('stadium_sunset'), true);
  assert.strictEqual(um2.getEquipped().stadium, 'stadium_sunset');
  assert.strictEqual(um2.hasTrophy('trophy_dead_eye'), true);

  // Corrupt storage payload
  global.localStorage.setItem('btb_penalty_unlocks_v2', '###NOT_VALID_JSON###');
  const um3 = new UnlocksManager();
  assert.strictEqual(um3.getStars(), 0);
  assert.strictEqual(um3.getEquipped().ball, 'ball_classic');

  delete global.localStorage;
});

if (passedTests === totalTests) {
  console.log(`\nAll ${passedTests} / ${totalTests} unlocks unit tests passed successfully!`);
} else {
  console.error(`\nUnlocks tests failed.`);
  process.exitCode = 1;
}
