/**
 * Unit tests for Keeper AI and reach-volume save determination (src/keeperAI.js)
 * Run with: node tests/keeperAI.test.js
 */

const assert = require('assert');

(async () => {
  const { decide, checkSave, DIVE_TARGETS } = await import('../src/keeperAI.js');
  const { TUNING } = await import('../src/tuning.js');

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

  console.log('--- Running Keeper AI (src/keeperAI.js) Unit Tests ---\n');

  test('Decide returns valid dive plan matching predicted zone', () => {
    const modelProbs = {
      predictedZone: 'TL',
      probabilities: { TL: 0.70, TM: 0.06, TR: 0.06, BL: 0.06, BM: 0.06, BR: 0.06 },
      confidence: 70,
      isAmbiguous: false
    };

    const plan = decide(modelProbs, 0.5, TUNING);
    assert.strictEqual(plan.zone, 'TL');
    assert.strictEqual(plan.target.x, DIVE_TARGETS.TL.x);
    assert.strictEqual(plan.target.y, DIVE_TARGETS.TL.y);
    assert(plan.reactTime >= TUNING.keeper.reactionDelayMin && plan.reactTime <= TUNING.keeper.reactionDelayMax);
  });

  test('Save succeeds when dive is correct and ball is within glove reach volume', () => {
    const divePlan = {
      zone: 'BR',
      target: { x: 2.55, y: 0.50 },
      reactTime: 0.16,
      diveDuration: 0.48
    };

    // Simulated shot crossing bottom-right near dive target at t = 0.65s (keeper fully in position), speed = 20 m/s
    const simResult = {
      result: 'goal',
      crossing: {
        x: 2.55,
        y: 0.50,
        z: 0,
        t: 0.65,
        speed: 20.0
      }
    };

    const saveCheck = checkSave(simResult, divePlan, TUNING);
    assert.strictEqual(saveCheck.saved, true, 'Keeper should save ball within reach');
    assert.strictEqual(saveCheck.saveType, 'catch', 'Low speed close save should be caught');
  });

  test('Goal scored when keeper dives opposite to the shot direction', () => {
    // Keeper dives Right
    const divePlan = {
      zone: 'BR',
      target: { x: 2.55, y: 0.50 },
      reactTime: 0.16,
      diveDuration: 0.48
    };

    // Shot is sent to Left Low (x = -2.5, y = 0.5)
    const simResult = {
      result: 'goal',
      crossing: {
        x: -2.50,
        y: 0.50,
        z: 0,
        t: 0.45,
        speed: 22.0
      }
    };

    const saveCheck = checkSave(simResult, divePlan, TUNING);
    assert.strictEqual(saveCheck.saved, false, 'Opposite dive should result in goal');
    assert(saveCheck.dist > 2.0, `Distance (${saveCheck.dist}m) should be large`);
  });

  test('High-speed blast to the extreme top corner beats the keeper even on correct dive', () => {
    // Keeper dives to Top-Left
    const divePlan = {
      zone: 'TL',
      target: { x: -2.65, y: 1.90 },
      reactTime: 0.16,
      diveDuration: 0.48
    };

    // Extreme top corner shot: x = -3.20 (right near the junction), y = 2.20, speed = 30 m/s (fast)
    const simResult = {
      result: 'goal',
      crossing: {
        x: -3.20,
        y: 2.20,
        z: 0,
        t: 0.36, // very fast flight
        speed: 30.0
      }
    };

    const saveCheck = checkSave(simResult, divePlan, TUNING);
    assert.strictEqual(saveCheck.saved, false, 'Fast top corner shot must beat keeper');
  });

  test('High speed shot within reach results in parry deflection instead of catch', () => {
    const divePlan = {
      zone: 'TR',
      target: { x: 2.65, y: 1.90 },
      reactTime: 0.14,
      diveDuration: 0.48
    };

    // Shot to Top-Right at 26 m/s (above catch speed limit 22 m/s)
    const simResult = {
      result: 'goal',
      crossing: {
        x: 2.60,
        y: 1.88,
        z: 0,
        t: 0.44,
        speed: 26.0
      }
    };

    const saveCheck = checkSave(simResult, divePlan, TUNING);
    assert.strictEqual(saveCheck.saved, true, 'Keeper should reach shot');
    assert.strictEqual(saveCheck.saveType, 'parry', 'High speed shot should be parried, not caught');
  });

  test('Torso body capsule intercepts shot directed at keeper body', () => {
    // Keeper diving towards Top-Right, but keeper torso/body occupies center-right
    const divePlan = {
      zone: 'TR',
      target: { x: 2.65, y: 1.90 },
      reactTime: 0.16,
      diveDuration: 0.48
    };

    // Ball directed near keeper's initial body position during early reaction
    const simResult = {
      result: 'goal',
      crossing: {
        x: 0.10,
        y: 0.90,
        z: 0,
        t: 0.18, // early arrival
        speed: 21.0
      }
    };

    const saveCheck = checkSave(simResult, divePlan, TUNING);
    assert.strictEqual(saveCheck.saved, true, 'Torso body capsule should block shot into keeper body');
  });

  if (passedTests === totalTests) {
    console.log(`\nAll ${passedTests} / ${totalTests} tests passed successfully!`);
  } else {
    console.error(`\nTests failed: ${totalTests - passedTests} failed, ${passedTests} passed.`);
    process.exitCode = 1;
  }
})();
