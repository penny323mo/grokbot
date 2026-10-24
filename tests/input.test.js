/**
 * Unit tests for SwipeInput and TouchEvent/PointerEvent handling (src/input.js)
 * Run with: node tests/input.test.js
 */

const assert = require('assert');

(async () => {
  const { SwipeInput } = await import('../src/input.js');

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

  console.log('--- Running Touch & Swipe Input (src/input.js) Unit Tests ---\n');

  // Mock Canvas DOM element
  class MockCanvas {
    constructor(w = 390, h = 844) {
      this.listeners = {};
      this.style = {};
      this.capturedPointerId = null;
      this.width = w;
      this.height = h;
    }

    addEventListener(event, fn) {
      if (!this.listeners[event]) this.listeners[event] = [];
      this.listeners[event].push(fn);
    }

    dispatchEvent(event) {
      const fns = this.listeners[event.type] || [];
      fns.forEach(fn => fn(event));
    }

    getBoundingClientRect() {
      return { left: 0, top: 0, width: this.width, height: this.height };
    }

    setPointerCapture(id) {
      this.capturedPointerId = id;
    }

    releasePointerCapture(id) {
      if (this.capturedPointerId === id) this.capturedPointerId = null;
    }
  }

  test('Swipe starting in bottom 75% triggers onShoot with valid launch', () => {
    const canvas = new MockCanvas(390, 844);
    let firedLaunch = null;

    const input = new SwipeInput(canvas, (launch) => {
      firedLaunch = launch;
    });
    input.enable();

    // Start at Y = 680 (within bottom 75%, since 844 * 0.25 = 211)
    input.onTouchStart({
      preventDefault: () => {},
      touches: [{ identifier: 1, clientX: 195, clientY: 680 }]
    });

    assert.strictEqual(input.isDragging, true, 'Input should be dragging after touchstart');

    // Move upwards
    input.onTouchMove({
      preventDefault: () => {},
      changedTouches: [{ identifier: 1, clientX: 195, clientY: 520 }]
    });

    assert.strictEqual(input.points.length, 2, 'Should have recorded 2 points');

    // End touch swipe
    input.onTouchEnd({
      preventDefault: () => {},
      changedTouches: [{ identifier: 1, clientX: 195, clientY: 480 }]
    });

    assert.strictEqual(input.isDragging, false, 'Should stop dragging after touchend');
    assert(firedLaunch !== null, 'onShoot callback should have fired with valid launch');
    assert(firedLaunch.speed >= 18.0, `Launch speed (${firedLaunch.speed}) should be >= 18 m/s`);
  });

  test('Swipe starting in top 25% (scoreboard area) is ignored', () => {
    const canvas = new MockCanvas(390, 844);
    let firedLaunch = null;

    const input = new SwipeInput(canvas, (launch) => {
      firedLaunch = launch;
    });
    input.enable();

    // Start at Y = 100 (in top 25%, above 211)
    input.onTouchStart({
      preventDefault: () => {},
      touches: [{ identifier: 1, clientX: 195, clientY: 100 }]
    });

    assert.strictEqual(input.isDragging, false, 'Swipe starting in scoreboard band should be ignored');
    assert.strictEqual(firedLaunch, null);
  });

  test('PointerEvents set and release pointer capture', () => {
    const canvas = new MockCanvas(390, 844);
    let firedLaunch = null;

    const input = new SwipeInput(canvas, (launch) => {
      firedLaunch = launch;
    });
    input.enable();

    input.onPointerDown({
      preventDefault: () => {},
      pointerId: 42,
      clientX: 195,
      clientY: 650
    });

    assert.strictEqual(canvas.capturedPointerId, 42, 'setPointerCapture should record pointer ID');
    assert.strictEqual(input.isDragging, true);

    input.onPointerMove({
      preventDefault: () => {},
      pointerId: 42,
      clientX: 195,
      clientY: 510
    });

    input.onPointerUp({
      preventDefault: () => {},
      pointerId: 42,
      clientX: 195,
      clientY: 460
    });

    assert.strictEqual(canvas.capturedPointerId, null, 'releasePointerCapture should release pointer ID');
    assert(firedLaunch !== null, 'onShoot should fire via pointer path');
  });

  // Round 4 Keeper Mode input tests (MINOR 6)
  test('SwipeInput in KEEPER mode accepts tap anywhere including top 25% (scoreboard area)', () => {
    const canvas = new MockCanvas(390, 844);
    let previewZone = null;
    let diveZone = null;
    let diveDetails = null;

    const input = new SwipeInput(canvas, null);
    input.setMode('KEEPER');
    input.onKeeperPreview = (zone) => { previewZone = zone; };
    input.onKeeperDive = (zone, details) => {
      diveZone = zone;
      diveDetails = details;
    };
    input.enable();

    // Tap in top 25% area: Y = 100 (in Striker mode this would be ignored)
    input.onTouchStart({
      preventDefault: () => {},
      touches: [{ identifier: 1, clientX: 195, clientY: 100 }]
    });

    assert.strictEqual(input.isDragging, true, 'KEEPER mode should start dragging in top 25% area');
    assert(previewZone !== null, 'onKeeperPreview should fire on touch start in KEEPER mode');
    assert.strictEqual(previewZone, 'TM', 'Center top tap should preview TM');

    // Release tap
    input.onTouchEnd({
      preventDefault: () => {},
      changedTouches: [{ identifier: 1, clientX: 195, clientY: 100 }]
    });

    assert.strictEqual(input.isDragging, false);
    assert.strictEqual(diveZone, 'TM', 'onKeeperDive should fire with TM zone');
    assert.strictEqual(diveDetails.type, 'tap', 'Input with zero displacement should resolve to tap');
  });

  test('SwipeInput in KEEPER mode distinguishes < 18px tap from >= 18px short swipe', () => {
    const canvas = new MockCanvas(390, 844);
    let resolvedDetails = null;

    const input = new SwipeInput(canvas, null);
    input.setMode('KEEPER');
    input.onKeeperDive = (zone, details) => { resolvedDetails = details; };
    input.enable();

    // 1. Movement < 18px (e.g. 8px) -> resolved as tap
    input.onTouchStart({
      preventDefault: () => {},
      touches: [{ identifier: 2, clientX: 300, clientY: 380 }]
    });
    input.onTouchEnd({
      preventDefault: () => {},
      changedTouches: [{ identifier: 2, clientX: 306, clientY: 385 }]
    });

    assert(resolvedDetails !== null);
    assert.strictEqual(resolvedDetails.type, 'tap');
    assert.strictEqual(resolvedDetails.zone, 'TR');

    // 2. Movement >= 18px (e.g. 45px towards top-left) -> resolved as short swipe
    input.enable();
    input.onTouchStart({
      preventDefault: () => {},
      touches: [{ identifier: 3, clientX: 200, clientY: 500 }]
    });
    input.onTouchEnd({
      preventDefault: () => {},
      changedTouches: [{ identifier: 3, clientX: 165, clientY: 470 }]
    });

    assert.strictEqual(resolvedDetails.type, 'swipe');
    assert.strictEqual(resolvedDetails.zone, 'TL');
  });

  test('SwipeInput in KEEPER mode uses raycastFn when provided for 3D goal binning', () => {
    const canvas = new MockCanvas(390, 844);
    let diveZone = null;
    let raycastCalled = false;

    const input = new SwipeInput(canvas, null);
    input.setMode('KEEPER');
    input.setRaycastFn((x, y, vp) => {
      raycastCalled = true;
      // Mock raycast intersection on goal plane: x = -2.44, y = 1.83 (TL zone)
      return { x: -2.44, y: 1.83, z: 0 };
    });
    input.onKeeperDive = (zone) => { diveZone = zone; };
    input.enable();

    input.onTouchStart({
      preventDefault: () => {},
      touches: [{ identifier: 4, clientX: 200, clientY: 400 }]
    });
    input.onTouchEnd({
      preventDefault: () => {},
      changedTouches: [{ identifier: 4, clientX: 200, clientY: 400 }]
    });

    assert.strictEqual(raycastCalled, true, 'raycastFn should have been called');
    assert.strictEqual(diveZone, 'TL', 'Zone should be resolved via 3D raycast hit (TL)');
  });

  if (passedTests === totalTests) {
    console.log(`\nAll ${passedTests} / ${totalTests} tests passed successfully!`);
  } else {
    console.error(`\nTests failed: ${totalTests - passedTests} failed, ${passedTests} passed.`);
    process.exitCode = 1;
  }
})();
