/**
 * Unit tests for Round 4 Keeper Mode improvements (tap/swipe mapping & forgiving tolerances)
 * Run with: node tests/keeper_r4.test.js
 */

import assert from 'assert';
import { mapTapToZone, mapSwipeToZone, resolveKeeperInput } from '../src/shot.js';
import { checkSave, DIVE_TARGETS, _onPlayerKeeperDive, resolvePlayerKeeperDive } from '../src/keeperAI.js';
import { TUNING } from '../src/tuning.js';

console.log('--- Running Round 4 Keeper Mode (src/shot.js & src/keeperAI.js) Unit Tests ---\n');

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

const viewport = { width: 390, height: 844 };

// 1. Test Tap-to-Zone mapping on goal
test('Tap on goal regions maps accurately to all 6 zones', () => {
  // TL: Screen X around 88, Y around 390
  assert.strictEqual(mapTapToZone({ x: 88, y: 390 }, viewport, TUNING), 'TL');

  // TM: Screen X around 195, Y around 390
  assert.strictEqual(mapTapToZone({ x: 195, y: 390 }, viewport, TUNING), 'TM');

  // TR: Screen X around 301, Y around 390
  assert.strictEqual(mapTapToZone({ x: 301, y: 390 }, viewport, TUNING), 'TR');

  // BL: Screen X around 88, Y around 442
  assert.strictEqual(mapTapToZone({ x: 88, y: 442 }, viewport, TUNING), 'BL');

  // BM: Screen X around 195, Y around 442
  assert.strictEqual(mapTapToZone({ x: 195, y: 442 }, viewport, TUNING), 'BM');

  // BR: Screen X around 301, Y around 442
  assert.strictEqual(mapTapToZone({ x: 301, y: 442 }, viewport, TUNING), 'BR');
});

// 2. Test Taps outside the goal map to nearest zone sensibly
test('Taps outside the goal boundaries map sensibly to nearest zone', () => {
  // Far top-left (e.g. sky on left) -> TL
  assert.strictEqual(mapTapToZone({ x: 20, y: 50 }, viewport, TUNING), 'TL');

  // Far top-middle (high sky) -> TM
  assert.strictEqual(mapTapToZone({ x: 195, y: 80 }, viewport, TUNING), 'TM');

  // Far top-right -> TR
  assert.strictEqual(mapTapToZone({ x: 370, y: 50 }, viewport, TUNING), 'TR');

  // Far bottom-left (pitch bottom left) -> BL
  assert.strictEqual(mapTapToZone({ x: 30, y: 800 }, viewport, TUNING), 'BL');

  // Far bottom-middle (penalty spot / bottom screen) -> BM
  assert.strictEqual(mapTapToZone({ x: 195, y: 780 }, viewport, TUNING), 'BM');

  // Far bottom-right -> BR
  assert.strictEqual(mapTapToZone({ x: 360, y: 800 }, viewport, TUNING), 'BR');
});

// 3. Test Short Swipe-to-Zone directional mapping
test('Short swipe vectors map cleanly to directional dive zones', () => {
  // Up-left swipe
  assert.strictEqual(mapSwipeToZone(-30, -40, TUNING), 'TL');

  // Straight up swipe
  assert.strictEqual(mapSwipeToZone(2, -50, TUNING), 'TM');

  // Up-right swipe
  assert.strictEqual(mapSwipeToZone(35, -40, TUNING), 'TR');

  // Down-left swipe
  assert.strictEqual(mapSwipeToZone(-40, 30, TUNING), 'BL');

  // Straight down swipe
  assert.strictEqual(mapSwipeToZone(0, 45, TUNING), 'BM');

  // Down-right swipe
  assert.strictEqual(mapSwipeToZone(40, 30, TUNING), 'BR');

  // Pure horizontal swipes
  assert.strictEqual(mapSwipeToZone(-50, 0, TUNING), 'BL');
  assert.strictEqual(mapSwipeToZone(50, 0, TUNING), 'BR');
});

// 4. Test resolveKeeperInput differentiates taps from short swipes
test('resolveKeeperInput distinguishes taps (<18px) from short swipes (>=18px)', () => {
  // Tap in top-right area (small 4px movement)
  const tapInput = resolveKeeperInput(
    { start: { x: 300, y: 380 }, end: { x: 302, y: 382 } },
    viewport,
    TUNING
  );
  assert.strictEqual(tapInput.type, 'tap');
  assert.strictEqual(tapInput.zone, 'TR');

  // Short swipe towards top-left (35px diagonal)
  const swipeInput = resolveKeeperInput(
    { start: { x: 200, y: 500 }, end: { x: 175, y: 475 } },
    viewport,
    TUNING
  );
  assert.strictEqual(swipeInput.type, 'swipe');
  assert.strictEqual(swipeInput.zone, 'TL');
});

// 5. Test Keeper Reach and Save Hit Tolerance logic
test('Player save hit tolerance and zone-matching bonus grant successful save on borderline shots', () => {
  // A borderline shot that arrives just outside standard reach
  const divePlanStandard = {
    zone: 'TR',
    target: { x: 2.65, y: 1.90 },
    reactTime: 0.14,
    diveDuration: 0.48,
    reachMultiplier: 1.0,
    tolerance: 0,
    isPlayer: false
  };

  // Ball crossing 0.58m away from glove at t = 0.50s, speed = 21 m/s
  // Standard gloveReachRadius is 0.42m -> without tolerance this would fail
  const simBorderline = {
    result: 'goal',
    zone: 'TR',
    crossing: {
      x: 2.65 + 0.52,
      y: 1.90,
      z: 0,
      t: 0.50,
      speed: 21.0
    }
  };

  const checkStandard = checkSave(simBorderline, divePlanStandard, TUNING);
  assert.strictEqual(checkStandard.saved, false, 'Standard keeper without tolerance should miss borderline shot');

  // CPU keeper diving to the exact same zone (TR) must NOT receive player zoneMatchingToleranceBonus (+0.15m)
  const divePlanCpuSameZone = {
    ...divePlanStandard,
    zone: 'TR',
    isPlayer: false
  };
  const checkCpu = checkSave(simBorderline, divePlanCpuSameZone, TUNING);
  assert.strictEqual(checkCpu.saved, false, 'CPU keeper diving to same zone must NOT receive player zoneMatchingToleranceBonus');

  // Now with Player Forgiving Tolerance (saveHitTolerance 0.20m + zone matching bonus 0.15m)
  const divePlanPlayer = {
    ...divePlanStandard,
    reachMultiplier: 1.30,
    tolerance: TUNING.keeper.saveHitTolerance, // 0.18m
    isPlayer: true
  };

  const checkPlayer = checkSave(simBorderline, divePlanPlayer, TUNING);
  assert.strictEqual(checkPlayer.saved, true, 'Player keeper with tolerance must successfully save borderline shot');
  assert(checkPlayer.saveType === 'parry' || checkPlayer.saveType === 'catch');
});

// 6. Test _onPlayerKeeperDive timing across difficulty tiers (CRITICAL 1)
test('_onPlayerKeeperDive mid-run-up tap is a pure commit and never penalized on Easy/Medium', () => {
  const strikeTime = 1000;
  const nowMidRunUp = 500; // 500ms before strike (run-up takes 850ms)

  // EASY: pure commit, never early dive
  const easyRes = _onPlayerKeeperDive('TR', {
    now: nowMidRunUp,
    strikeTime,
    runUpStarted: true,
    hasStruck: false,
    difficultyKey: 'EASY'
  });
  assert.strictEqual(easyRes.earlyDive, false, 'Easy mid-run-up tap must NOT flag early dive');
  assert.strictEqual(easyRes.validZone, 'TR');
  assert.strictEqual(easyRes.divePlan.reachMultiplier, 1.45, 'Easy reachMultiplier (1.45) must be preserved');

  // MEDIUM: pure commit, never early dive
  const medRes = _onPlayerKeeperDive('TR', {
    now: nowMidRunUp,
    strikeTime,
    runUpStarted: true,
    hasStruck: false,
    difficultyKey: 'MEDIUM'
  });
  assert.strictEqual(medRes.earlyDive, false, 'Medium mid-run-up tap must NOT flag early dive');
  assert.strictEqual(medRes.validZone, 'TR');
  assert.strictEqual(medRes.divePlan.reachMultiplier, 1.30, 'Medium reachMultiplier (1.30) must be preserved');

  // HARD: early threshold is 350ms. At 500ms before strike (> 350ms), flags early dive
  const hardEarly = _onPlayerKeeperDive('TR', {
    now: 500,
    strikeTime,
    runUpStarted: true,
    hasStruck: false,
    difficultyKey: 'HARD'
  });
  assert.strictEqual(hardEarly.earlyDive, true, 'Hard tap 500ms before strike (> 350ms) flags early dive');
  assert.strictEqual(hardEarly.divePlan.reachMultiplier, 1.0, 'Early dive reduces reachMultiplier to 1.0');

  // HARD legal: 250ms before strike (< 350ms threshold), legal dive
  const hardLegal = _onPlayerKeeperDive('TR', {
    now: 750,
    strikeTime,
    runUpStarted: true,
    hasStruck: false,
    difficultyKey: 'HARD'
  });
  assert.strictEqual(hardLegal.earlyDive, false, 'Hard tap 250ms before strike is within legal window');
  assert.strictEqual(hardLegal.divePlan.reachMultiplier, 1.15);

  // HELL: early threshold is 250ms. At 300ms before strike (> 250ms), flags early
  const hellEarly = _onPlayerKeeperDive('TR', {
    now: 700,
    strikeTime,
    runUpStarted: true,
    hasStruck: false,
    difficultyKey: 'HELL'
  });
  assert.strictEqual(hellEarly.earlyDive, true, 'Hell tap 300ms before strike (> 250ms) flags early dive');

  // HELL legal: 150ms before strike (< 250ms threshold), legal dive
  const hellLegal = _onPlayerKeeperDive('TR', {
    now: 850,
    strikeTime,
    runUpStarted: true,
    hasStruck: false,
    difficultyKey: 'HELL'
  });
  assert.strictEqual(hellLegal.earlyDive, false, 'Hell tap 150ms before strike is within legal window');
  assert.strictEqual(hellLegal.divePlan.reachMultiplier, 1.05);
});

// 7. Test Late Window Tap (CRITICAL 2)
test('Tap 100ms after strike in late window on Easy selects chosen zone, not BM', () => {
  const strikeTime = 1000;
  const nowPostStrike = 1100; // 100ms after kick

  const res = _onPlayerKeeperDive('TR', {
    now: nowPostStrike,
    strikeTime,
    runUpStarted: true,
    hasStruck: true,
    difficultyKey: 'EASY'
  });

  assert.strictEqual(res.validZone, 'TR', 'Late tap 100ms after strike must resolve to tapped zone (TR), not default to BM');
  assert.strictEqual(res.divePlan.zone, 'TR');
  assert.strictEqual(res.lateDive, false, '100ms after strike is within Easy 450ms reaction window, so lateDive is false');
  assert.strictEqual(res.divePlan.reachMultiplier, 1.45, 'Full Easy reachMultiplier (1.45) preserved inside reaction window');
});

// 8. Test Difficulty-scaled Reaction Windows and Tolerances
test('Reaction windows and tolerances scale monotonically across difficulty tiers (Easy is most forgiving)', () => {
  const w = TUNING.keeperWindows;
  assert(w, 'TUNING.keeperWindows must exist');

  // Early dive threshold: Easy and Medium are Infinity (pure commit, never punished)
  assert.strictEqual(w.earlyDiveThresholdMs.EASY, Infinity);
  assert.strictEqual(w.earlyDiveThresholdMs.MEDIUM, Infinity);
  assert(w.earlyDiveThresholdMs.HARD > w.earlyDiveThresholdMs.HELL, 'Hard allows later commit than Hell');

  // Late dive threshold: larger on Easy (450ms) gives the most generous reaction window after strike
  assert(w.lateDiveThresholdMs.EASY > w.lateDiveThresholdMs.MEDIUM);
  assert(w.lateDiveThresholdMs.MEDIUM > w.lateDiveThresholdMs.HARD);
  assert(w.lateDiveThresholdMs.HARD > w.lateDiveThresholdMs.HELL);

  // Player reach multiplier: highest on Easy
  assert(w.playerReachMultiplier.EASY > w.playerReachMultiplier.MEDIUM);
  assert(w.playerReachMultiplier.MEDIUM > w.playerReachMultiplier.HARD);
  assert(w.playerReachMultiplier.HARD > w.playerReachMultiplier.HELL);

  // Save hit tolerance: largest on Easy
  assert(w.saveHitTolerance.EASY > w.saveHitTolerance.MEDIUM);
  assert(w.saveHitTolerance.MEDIUM > w.saveHitTolerance.HARD);
  assert(w.saveHitTolerance.HARD > w.saveHitTolerance.HELL);
});

if (passedTests === totalTests) {
  console.log(`\nAll ${passedTests} / ${totalTests} tests passed successfully!`);
} else {
  console.error(`\nTests failed: ${totalTests - passedTests} failed, ${passedTests} passed.`);
  process.exitCode = 1;
}
