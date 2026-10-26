/**
 * Unit tests for Taker AI (src/takerAI.js)
 * Run with: node tests/takerAI.test.js
 */

const assert = require('assert');

(async () => {
  const { TakerAIModel, TAKER_TARGETS } = await import('../src/takerAI.js');
  const { getDifficultyConfig } = await import('../src/difficulty.js');

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

  console.log('--- Running Taker AI (src/takerAI.js) Unit Tests ---\n');

  test('Taker learns player dive habit and aims away from anticipated dive', () => {
    const taker = new TakerAIModel();

    // Player keeper repeatedly dives to Bottom-Right (BR) 8 times
    for (let i = 0; i < 8; i++) {
      taker.recordPlayerDive('BR');
    }

    const diveInfo = taker.getDiveProbabilities();
    assert.strictEqual(diveInfo.predictedDive, 'BR', 'Taker should predict player will dive BR');
    assert(diveInfo.confidence > 0.45, `Confidence (${diveInfo.confidence}) should be high`);

    // In Hell difficulty, taker aims at lowest dive probability (away from BR)
    const diffHell = getDifficultyConfig('HELL');
    const shot = taker.decideShot(diffHell, null, 0.0);

    assert.notStrictEqual(shot.targetZone, 'BR', 'Taker must NOT shoot towards predicted dive BR');
    assert(['TL', 'BL', 'TM'].includes(shot.targetZone), `Taker should aim at opposite side, got ${shot.targetZone}`);
    assert.strictEqual(shot.earlyPunished, false);
  });

  test('Early keeper dive is immediately punished by shooting to the open side', () => {
    const taker = new TakerAIModel();
    const diffMed = getDifficultyConfig('MEDIUM');

    // Player keeper commits early to Bottom-Left (BL) during run-up
    const shot = taker.decideShot(diffMed, 'BL', 0.1);

    assert.strictEqual(shot.earlyPunished, true);
    assert.strictEqual(shot.reason, 'punished_early_dive');
    // Candidate opposite zones for BL are TR, BR, TL
    assert(['TR', 'BR', 'TL'].includes(shot.targetZone), `Should punish early dive with opposite zone, got ${shot.targetZone}`);
  });

  test('Hell difficulty frequently snipes extreme corners with high speed', () => {
    const taker = new TakerAIModel();
    const diffHell = getDifficultyConfig('HELL');

    const shot = taker.decideShot(diffHell, null, 0.05);

    assert(shot.speed >= 28.0, `Hell shot speed (${shot.speed}) should be high velocity`);
    if (shot.targetZone === 'TL' || shot.targetZone === 'TR' || shot.targetZone === 'BL' || shot.targetZone === 'BR') {
      assert(Math.abs(shot.targetPoint.x) >= 2.60, `Corner snipe target X (${shot.targetPoint.x}) should be wide`);
    }
  });

  test('Dive probability distribution sums to 1.0 and has non-negative values', () => {
    const taker = new TakerAIModel();
    taker.recordPlayerDive('TL');
    taker.recordPlayerDive('BR');
    taker.recordPlayerDive('TL');

    const probs = taker.getDiveProbabilities().probabilities;
    let sum = 0;
    for (const [z, p] of Object.entries(probs)) {
      assert(p >= 0, `Prob for ${z} must be non-negative`);
      sum += p;
    }
    assert(Math.abs(sum - 1.0) < 1e-6, `Probabilities must sum to 1.0, got ${sum}`);
  });

  if (passedTests === totalTests) {
    console.log(`\nAll ${passedTests} / ${totalTests} tests passed successfully!`);
  } else {
    console.error(`\nTests failed: ${totalTests - passedTests} failed, ${passedTests} passed.`);
    process.exitCode = 1;
  }
})();
