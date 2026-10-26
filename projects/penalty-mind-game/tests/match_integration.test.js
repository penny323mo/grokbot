/**
 * 12碼讀心戰 (Penalty Mind Game v2) - Full Match Integration Test
 * Simulates end-to-end penalty shootout matches with alternating
 * shooting and keeper turns across all difficulty levels without throwing.
 * Run with: node tests/match_integration.test.js
 */

import assert from 'assert';
import { PenaltyMindModel } from '../model.js';
import { TakerAIModel } from '../src/takerAI.js';
import { decide, checkSave, DIVE_TARGETS } from '../src/keeperAI.js';
import { simulate, pointToLaunch, getZoneFromPoint, swipeToLaunch } from '../src/shot.js';
import { getDifficultyConfig } from '../src/difficulty.js';
import { TUNING } from '../src/tuning.js';

console.log('--- Running Full Match Integration (Pure Modules) Test ---\n');

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

// Test 1: Full 5-round shootout simulation across all 4 difficulty tiers
const difficulties = ['EASY', 'MEDIUM', 'HARD', 'HELL'];

difficulties.forEach(diffKey => {
  test(`Complete 5-round match simulation on ${diffKey} difficulty runs without errors`, () => {
    const model = new PenaltyMindModel();
    const takerAI = new TakerAIModel();
    const diffConfig = getDifficultyConfig(diffKey);

    let playerScore = 0;
    let cpuScore = 0;
    const playerKicks = [];
    const cpuKicks = [];

    for (let round = 1; round <= 5; round++) {
      // ---------------------------------------------------------
      // TURN A: Player Strikes (AI Goalkeeper)
      // ---------------------------------------------------------
      const mockPoints = [
        { x: 195, y: 680, t: 0 },
        { x: 195 + (round % 2 === 0 ? 40 : -40), y: 530, t: 100 }
      ];
      const playerLaunch = swipeToLaunch(mockPoints, { width: 390, height: 844 }, TUNING);
      assert(playerLaunch, 'Player swipe must produce valid launch');

      const playerSim = simulate(playerLaunch, 1 / 120, 1.6, TUNING);
      assert(playerSim && playerSim.crossing, 'Player shot simulation must yield crossing');

      const modelProbs = model.getProbabilities();
      const keeperDivePlan = decide(modelProbs, diffConfig, TUNING);
      assert(keeperDivePlan && keeperDivePlan.target, 'Keeper dive plan must have target');
      assert(typeof keeperDivePlan.reactTime === 'number', 'Keeper reactTime must be number');

      const playerSaveCheck = checkSave(playerSim, keeperDivePlan, TUNING);
      assert(typeof playerSaveCheck.saved === 'boolean', 'Save check must return boolean');

      const actualPlayerZone = playerSim.zone || getZoneFromPoint(playerSim.crossing.x, playerSim.crossing.y, TUNING);
      model.recordShot(actualPlayerZone, keeperDivePlan.zone);

      const playerScored = playerSim.result === 'goal' && !playerSaveCheck.saved;
      if (playerScored) playerScore++;
      playerKicks.push({ scored: playerScored, zone: actualPlayerZone });

      // ---------------------------------------------------------
      // TURN B: Player Keeps (CPU Striker via TakerAI)
      // ---------------------------------------------------------
      // Player goalkeeper chooses a dive zone
      const playerDiveZone = ['TL', 'TR', 'BL', 'BR', 'BM'][round % 5];
      const diveInfo = DIVE_TARGETS[playerDiveZone] || DIVE_TARGETS.BM;
      const playerDivePlan = {
        zone: playerDiveZone,
        target: { x: diveInfo.x, y: diveInfo.y },
        reactTime: 0.10,
        diveDuration: TUNING.keeper.diveDuration,
        reachMultiplier: 1.0
      };

      // Taker AI decides shot aiming away from player habit
      const earlyDive = round === 3 ? playerDiveZone : null; // test early dive on round 3
      const takerDecision = takerAI.decideShot(diffConfig, earlyDive);

      assert(takerDecision, 'Taker AI must return decision');
      assert(takerDecision.targetPoint && typeof takerDecision.targetPoint.x === 'number', 'targetPoint.x must exist');
      assert(takerDecision.target && typeof takerDecision.target.x === 'number', 'target.x alias must exist');

      // Convert decision to simulate-compatible launch
      const cpuLaunch = pointToLaunch(takerDecision.targetPoint, takerDecision.speed, takerDecision.curve, TUNING);
      assert(cpuLaunch && cpuLaunch.position && cpuLaunch.velocity, 'pointToLaunch must produce valid launch');

      const cpuSim = simulate(cpuLaunch, 1 / 120, 1.6, TUNING);
      assert(cpuSim && cpuSim.crossing, 'CPU shot simulation must cross goal plane');

      const cpuSaveCheck = checkSave(cpuSim, playerDivePlan, TUNING);
      assert(typeof cpuSaveCheck.saved === 'boolean', 'CPU save check must return boolean');

      const cpuScored = cpuSim.result === 'goal' && !cpuSaveCheck.saved;
      if (cpuScored) cpuScore++;
      cpuKicks.push({ scored: cpuScored });

      // Record player dive into Taker AI
      takerAI.recordPlayerDive(playerDiveZone);
    }

    assert.strictEqual(playerKicks.length, 5, 'Player must have taken 5 kicks');
    assert.strictEqual(cpuKicks.length, 5, 'CPU must have taken 5 kicks');
    assert(playerScore >= 0 && playerScore <= 5, 'Player score must be within range');
    assert(cpuScore >= 0 && cpuScore <= 5, 'CPU score must be within range');

    // Confirm taker AI learned player dive habits
    const diveProbs = takerAI.getDiveProbabilities();
    assert(diveProbs && diveProbs.probabilities, 'Taker AI must produce dive probabilities');
    assert(Math.abs(Object.values(diveProbs.probabilities).reduce((a, b) => a + b, 0) - 1.0) < 0.01, 'Probabilities must sum to 1');
  });
});

test('Early dive punishment pushes CPU taker to aim away from predicted dive zone', () => {
  const takerAI = new TakerAIModel();
  const diffConfig = getDifficultyConfig('HARD');

  // If keeper early dives left (BL), taker must shoot right or away
  const decision = takerAI.decideShot(diffConfig, 'BL');
  assert.strictEqual(decision.earlyPunished, true, 'Early dive must be flagged as punished');
  assert(decision.targetPoint.x > 0, `Shot must aim towards right side (got x=${decision.targetPoint.x})`);
});

if (passedTests === totalTests) {
  console.log(`\nAll ${passedTests} / ${totalTests} integration tests passed successfully!`);
} else {
  console.error(`\nIntegration tests failed.`);
  process.exitCode = 1;
}
