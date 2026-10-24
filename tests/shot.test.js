/**
 * Unit tests for shot physics and swipe mapping (src/shot.js)
 * Run with: node tests/shot.test.js
 */

const assert = require('assert');

(async () => {
  const { swipeToLaunch, simulate, getZoneFromPoint } = await import('../src/shot.js');
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

  console.log('--- Running Shot Physics (src/shot.js) Unit Tests ---\n');

  const viewport = { width: 390, height: 844 }; // iPhone 12/13/14 portrait

  test('Swipe straight up -> centre target and valid goal crossing', () => {
    // Moderate swipe straight up from bottom-centre
    const points = [
      { x: 195, y: 680, t: 0 },
      { x: 195, y: 600, t: 60 },
      { x: 195, y: 530, t: 130 }
    ];

    const launch = swipeToLaunch(points, viewport, TUNING);
    assert(launch !== null, 'Straight swipe must produce valid launch');
    assert(Math.abs(launch.target.x) < 0.2, `Target X (${launch.target.x}) should be close to 0`);
    assert(Math.abs(launch.curve) < 0.05, `Straight swipe curve (${launch.curve}) should be ~0`);

    const sim = simulate(launch, 1 / 120, 1.5, TUNING);
    assert(sim.trajectory.length > 10, 'Trajectory must have steps');
    assert(sim.crossing !== null, 'Ball must cross goal plane');
    assert(Math.abs(sim.crossing.x) < 0.4, `Crossing X (${sim.crossing.x}) should be near center`);
    assert(sim.crossing.y > 0 && sim.crossing.y < TUNING.goal.height, `Crossing Y (${sim.crossing.y}) should be in goal`);
    assert.strictEqual(sim.result, 'goal', `Result should be goal, got ${sim.result}`);
  });

  test('Faster swipe -> higher speed and shorter flight time', () => {
    const slowPoints = [
      { x: 195, y: 700, t: 0 },
      { x: 195, y: 500, t: 300 } // ~0.67 px/ms
    ];
    const fastPoints = [
      { x: 195, y: 700, t: 0 },
      { x: 195, y: 500, t: 80 }  // 2.5 px/ms
    ];

    const slowLaunch = swipeToLaunch(slowPoints, viewport, TUNING);
    const fastLaunch = swipeToLaunch(fastPoints, viewport, TUNING);

    assert(slowLaunch !== null && fastLaunch !== null);
    assert(fastLaunch.speed > slowLaunch.speed, `Fast speed (${fastLaunch.speed}) must exceed slow (${slowLaunch.speed})`);
    assert(fastLaunch.power > slowLaunch.power, `Fast power (${fastLaunch.power}) must exceed slow (${slowLaunch.power})`);

    const slowSim = simulate(slowLaunch, 1 / 120, 1.5, TUNING);
    const fastSim = simulate(fastLaunch, 1 / 120, 1.5, TUNING);

    assert(fastSim.crossing.t < slowSim.crossing.t, `Fast flight time (${fastSim.crossing.t}s) must be shorter than slow (${slowSim.crossing.t}s)`);
  });

  test('Bent swipe (right bow) -> curved lateral displacement to the right', () => {
    // Swipe curving to the right: intermediate point bowed to the right (x > 195)
    const pointsRightCurve = [
      { x: 195, y: 700, t: 0 },
      { x: 235, y: 575, t: 60 },
      { x: 195, y: 450, t: 120 }
    ];

    const launchRight = swipeToLaunch(pointsRightCurve, viewport, TUNING);
    assert(launchRight !== null);
    assert(launchRight.curve > 0.2, `Curve (${launchRight.curve}) must be positive for rightward bent swipe`);
    assert(launchRight.spin.y > 0, `Spin Y (${launchRight.spin.y}) must be positive`);

    // Straight equivalent for comparison
    const pointsStraight = [
      { x: 195, y: 700, t: 0 },
      { x: 195, y: 575, t: 60 },
      { x: 195, y: 450, t: 120 }
    ];
    const launchStraight = swipeToLaunch(pointsStraight, viewport, TUNING);

    const simRight = simulate(launchRight, 1 / 120, 1.5, TUNING);
    const simStraight = simulate(launchStraight, 1 / 120, 1.5, TUNING);

    // Ball with right spin curves towards positive X
    assert(
      simRight.crossing.x > simStraight.crossing.x,
      `Curved shot X (${simRight.crossing.x}) should land further right than straight (${simStraight.crossing.x})`
    );
  });

  test('Overpower swipe (power > 0.92) -> flies over the crossbar', () => {
    // Ultra fast swipe upwards (speed > 2.5 px/ms)
    const overPoints = [
      { x: 195, y: 720, t: 0 },
      { x: 195, y: 350, t: 60 } // speed ~6.1 px/ms -> max power = 1.0 > 0.92
    ];

    const launchOver = swipeToLaunch(overPoints, viewport, TUNING);
    assert(launchOver !== null);
    assert(launchOver.power >= 0.98, `Power (${launchOver.power}) should be ~1.0`);
    assert(launchOver.target.y > TUNING.goal.height, `Target Y (${launchOver.target.y}) must be higher than crossbar (${TUNING.goal.height})`);

    const simOver = simulate(launchOver, 1 / 120, 1.5, TUNING);
    assert.strictEqual(simOver.result, 'over', `High power swipe should fly over the bar, got ${simOver.result}`);
    assert(simOver.crossing.y > TUNING.goal.height, `Crossing Y (${simOver.crossing.y}) must be above crossbar`);
  });

  test('Zone classification accurately bins goal points into 6 zones', () => {
    // Top Left
    assert.strictEqual(getZoneFromPoint(-2.5, 1.8, TUNING), 'TL');
    // Top Middle
    assert.strictEqual(getZoneFromPoint(0, 1.8, TUNING), 'TM');
    // Top Right
    assert.strictEqual(getZoneFromPoint(2.5, 1.8, TUNING), 'TR');
    // Bottom Left
    assert.strictEqual(getZoneFromPoint(-2.5, 0.6, TUNING), 'BL');
    // Bottom Middle
    assert.strictEqual(getZoneFromPoint(0, 0.6, TUNING), 'BM');
    // Bottom Right
    assert.strictEqual(getZoneFromPoint(2.5, 0.6, TUNING), 'BR');
  });

  if (passedTests === totalTests) {
    console.log(`\nAll ${passedTests} / ${totalTests} tests passed successfully!`);
  } else {
    console.error(`\nTests failed: ${totalTests - passedTests} failed, ${passedTests} passed.`);
    process.exitCode = 1;
  }
})();
