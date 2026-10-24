/**
 * Unit tests for Difficulty Mapping (src/difficulty.js)
 * Run with: node tests/difficulty.test.js
 */

const assert = require('assert');

(async () => {
  const { DIFFICULTY_TIERS, getDifficultyConfig, DEFAULT_DIFFICULTY } = await import('../src/difficulty.js');

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

  console.log('--- Running Difficulty Mapping (src/difficulty.js) Unit Tests ---\n');

  test('All 4 difficulty tiers (EASY, MEDIUM, HARD, HELL) are defined with monotonic scaling', () => {
    const keys = ['EASY', 'MEDIUM', 'HARD', 'HELL'];
    keys.forEach(k => {
      const tier = DIFFICULTY_TIERS[k];
      assert(tier !== undefined, `Tier ${k} must exist`);
      assert(tier.name && tier.tag, `Tier ${k} must have localized name and tag`);
      assert(typeof tier.keeperReactTime === 'number');
      assert(typeof tier.keeperReach === 'number');
      assert(typeof tier.tellHonesty === 'number');
    });

    // Reaction time decreases with higher difficulty
    assert(DIFFICULTY_TIERS.EASY.keeperReactTime > DIFFICULTY_TIERS.MEDIUM.keeperReactTime);
    assert(DIFFICULTY_TIERS.MEDIUM.keeperReactTime > DIFFICULTY_TIERS.HARD.keeperReactTime);
    assert(DIFFICULTY_TIERS.HARD.keeperReactTime > DIFFICULTY_TIERS.HELL.keeperReactTime);

    // Reach increases with higher difficulty
    assert(DIFFICULTY_TIERS.EASY.keeperReach < DIFFICULTY_TIERS.MEDIUM.keeperReach);
    assert(DIFFICULTY_TIERS.MEDIUM.keeperReach < DIFFICULTY_TIERS.HARD.keeperReach);
    assert(DIFFICULTY_TIERS.HARD.keeperReach < DIFFICULTY_TIERS.HELL.keeperReach);

    // Taker corner rate increases
    assert(DIFFICULTY_TIERS.EASY.takerCornerRate < DIFFICULTY_TIERS.HELL.takerCornerRate);
  });

  test('getDifficultyConfig handles case-insensitivity and invalid fallback', () => {
    assert.strictEqual(getDifficultyConfig('easy').key, 'EASY');
    assert.strictEqual(getDifficultyConfig('Hell').key, 'HELL');
    assert.strictEqual(getDifficultyConfig('INVALID_UNKNOWN').key, DEFAULT_DIFFICULTY);
    assert.strictEqual(getDifficultyConfig(null).key, DEFAULT_DIFFICULTY);
  });

  test('Gaze hint is only enabled for HARD and HELL difficulties', () => {
    assert.strictEqual(getDifficultyConfig('EASY').gazeHint, false);
    assert.strictEqual(getDifficultyConfig('MEDIUM').gazeHint, false);
    assert.strictEqual(getDifficultyConfig('HARD').gazeHint, true);
    assert.strictEqual(getDifficultyConfig('HELL').gazeHint, true);
  });

  if (passedTests === totalTests) {
    console.log(`\nAll ${passedTests} / ${totalTests} tests passed successfully!`);
  } else {
    console.error(`\nTests failed: ${totalTests - passedTests} failed, ${passedTests} passed.`);
    process.exitCode = 1;
  }
})();
