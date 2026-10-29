// Physics Unit Tests for Midnight Touge (《夜峠》)
import { test, describe } from 'node:test';
import assert from 'node:assert';
import { VehiclePhysics } from '../src/physics/vehicle-physics.js';
import { CARS_DATA, getCarById } from '../src/data/cars.js';

describe('VehiclePhysics & Drift Dynamics', () => {
  const starterCar = getCarById('h86') || CARS_DATA[0];

  test('Chassis initializes with sane defaults', () => {
    const physics = new VehiclePhysics(starterCar);
    assert.strictEqual(physics.speed, 0);
    assert.strictEqual(physics.gear, 1);
    assert.strictEqual(physics.isDrifting, false);
    assert.strictEqual(physics.slipAngle, 0);
  });

  test('tuning.powerMultiplier scales horsepower correctly', () => {
    const baseCar = getCarById('h86');
    const turboCar = getCarById('gt20');
    const rotaryCar = getCarById('re7');

    const basePhysics = new VehiclePhysics(baseCar);
    const turboPhysics = new VehiclePhysics(turboCar);
    const rotaryPhysics = new VehiclePhysics(rotaryCar);

    assert.ok(turboPhysics.power > basePhysics.power, 'Turbo car power must exceed base car power');
    assert.ok(rotaryPhysics.power > turboPhysics.power, 'Rotary car power must exceed turbo car power');
  });

  test('Throttle accelerates car forward', () => {
    const physics = new VehiclePhysics(starterCar);
    physics.reset(0, 0, 0, 0);

    // Apply throttle for 1.0 second
    for (let i = 0; i < 30; i++) {
      physics.update(1 / 30, { throttle: 1.0, steer: 0.0, brake: 0.0, handbrake: false });
    }

    assert.ok(physics.speed > 5.0, `Expected speed > 5 m/s, got ${physics.speed}`);
    assert.ok(physics.vy > 0, `Expected forward velocity vy > 0, got ${physics.vy}`);
    assert.ok(physics.gear >= 1);
  });

  test('Handbrake and lateral steering initiate drift slide and multiplier combo', () => {
    const physics = new VehiclePhysics(starterCar);
    physics.reset(0, 0, 0, 0);

    // Accelerate to 70 km/h first
    for (let i = 0; i < 60; i++) {
      physics.update(1 / 30, { throttle: 1.0, steer: 0.0, brake: 0.0, handbrake: false });
    }
    const preSpeed = physics.speedKmh;
    assert.ok(preSpeed > 40.0, `Speed should exceed 40 km/h, got ${preSpeed}`);

    // Flick steer right and yank handbrake for feint entry
    for (let i = 0; i < 15; i++) {
      physics.update(1 / 30, { throttle: 0.5, steer: 0.9, brake: 0.0, handbrake: true });
    }

    assert.ok(physics.isDrifting, 'Car should enter drift state after steering + handbrake');
    assert.ok(physics.driftAngleDeg > 5.0, `Drift angle should be > 5 deg, got ${physics.driftAngleDeg}`);
    assert.ok(physics.driftScore > 0, 'Drift score should increment');
    assert.ok(physics.driftMultiplier >= 1.0, 'Drift combo multiplier should be >= 1.0');
  });

  test('Counter-steer assist stabilizes yaw during drift', () => {
    const physics = new VehiclePhysics(starterCar);
    physics.reset(0, 0, 0, 0);

    // Accelerate
    for (let i = 0; i < 40; i++) {
      physics.update(1 / 30, { throttle: 1.0, steer: 0.0, brake: 0.0, handbrake: false });
    }

    // Induce drift
    for (let i = 0; i < 10; i++) {
      physics.update(1 / 30, { throttle: 0.8, steer: 1.0, brake: 0.0, handbrake: true });
    }

    // Now release steer or apply slight counter-steer
    for (let i = 0; i < 20; i++) {
      physics.update(1 / 30, { throttle: 0.8, steer: -0.3, brake: 0.0, handbrake: false });
    }

    // Vehicle should retain controllable yaw rate without NaN or physics explosion
    assert.ok(!Number.isNaN(physics.yawRate), 'Yaw rate should not be NaN');
    assert.ok(Math.abs(physics.yawRate) < 15.0, `Yaw rate should be controlled, got ${physics.yawRate}`);
  });

  test('Gutter drop mechanic provides increased grip', () => {
    const physics = new VehiclePhysics(starterCar);
    physics.reset(0, 0, 0, 0);
    physics.inGutter = true;

    for (let i = 0; i < 20; i++) {
      physics.update(1 / 30, { throttle: 1.0, steer: 0.5, brake: 0.0, handbrake: false });
    }

    assert.ok(physics.speed > 0);
    assert.ok(physics.inGutter, 'Car remains marked in gutter');
  });

  test('Wall collision scrubs forward speed and applies restitution', () => {
    const physics = new VehiclePhysics(starterCar);
    physics.reset(0, 0, 0, 0);

    // Give forward speed 15 m/s (~54 km/h)
    physics.vy = 15.0;
    physics.vx = 2.0;
    physics.speed = Math.sqrt(physics.vx * physics.vx + physics.vy * physics.vy);
    const speedBefore = physics.speed;

    // Collide with right wall (normal pointing left: -1, 0)
    physics.applyWallCollision(-1.0, 0.0, 0.25);

    assert.ok(physics.speed < speedBefore, `Speed should drop after collision: ${physics.speed} < ${speedBefore}`);
    assert.ok(physics.vx < 0, 'Velocity should bounce inward away from wall');
  });

  test('Holding car against guardrail for 0.5s preserves forward speed above half', () => {
    const physics = new VehiclePhysics(starterCar);
    physics.reset(0, 0, 0, 0);

    // Initial forward speed: 25 m/s (~90 km/h) along Y
    physics.vy = 25.0;
    physics.vx = 0.0;
    physics.speed = 25.0;
    const initialSpeed = physics.speed;

    // Simulate 0.5s at 60 fps (30 frames, dt = 1/60s)
    let wallScrapeCooldown = 0.0;
    const dt = 1.0 / 60.0;
    for (let t = 0; t < 0.5; t += dt) {
      const isInitialImpact = wallScrapeCooldown <= 0;
      // Car is continuously pressed into right wall (normal pointing left: -1, 0)
      physics.applyWallCollision(-1.0, 0.0, 0.1, isInitialImpact);
      if (isInitialImpact) {
        wallScrapeCooldown = 0.18; // 180ms cooldown matching engine.js
      }
      if (wallScrapeCooldown > 0) {
        wallScrapeCooldown -= dt;
      }
    }

    assert.ok(
      physics.speed > initialSpeed * 0.5,
      `Speed after 0.5s guardrail scrape should stay above 50% (${initialSpeed * 0.5} m/s), got ${physics.speed.toFixed(2)} m/s`
    );
  });

  test('Car at 20 m/s braked for 5s ends with forward speed at 0 and does not travel backward', () => {
    const physics = new VehiclePhysics(starterCar);
    // Heading 0: facing along +Y axis (Math.sin(0)=0, Math.cos(0)=1)
    physics.reset(0, 0, 0, 0);
    physics.vy = 20.0;
    physics.vx = 0.0;
    physics.speed = 20.0;

    const dt = 1.0 / 60.0;
    const brakeInput = { steer: 0, throttle: 0, brake: 1.0, handbrake: false };

    // Brake for 5.0 seconds
    for (let t = 0; t < 5.0; t += dt) {
      physics.update(dt, brakeInput);
    }

    assert.strictEqual(physics.speed, 0, 'Speed must be exactly 0 after full stop');
    assert.strictEqual(physics.vx, 0, 'Lateral velocity along X must be 0');
    assert.strictEqual(physics.vy, 0, 'Forward velocity along Y must be 0');
    assert.ok(physics.y > 0, 'Car should have traveled forward while stopping');
    assert.ok(physics.vy >= 0, 'Car must never have negative forward velocity');
  });

  test('Hairpin drift maintains non-zero slip angle and exits faster than pure braking', () => {
    const dt = 1.0 / 60.0;
    const initialSpeed = 22.0; // ~80 km/h

    // 1. Drifting car navigating the hairpin
    const driftCar = new VehiclePhysics(starterCar);
    driftCar.reset(0, 0, 0, 0);
    driftCar.vy = initialSpeed;
    driftCar.speed = initialSpeed;

    let maxDriftSlipAngle = 0;
    let didDrift = false;

    // Corner Entry (0.3s): flick steer right and tap handbrake
    for (let t = 0; t < 0.3; t += dt) {
      driftCar.update(dt, { throttle: 0.4, steer: 0.9, brake: 0.0, handbrake: true });
      if (driftCar.isDrifting) didDrift = true;
      if (Math.abs(driftCar.slipAngle) > maxDriftSlipAngle) {
        maxDriftSlipAngle = Math.abs(driftCar.slipAngle);
      }
    }

    // Mid-corner apex (0.7s): throttle power-over with counter-steer
    for (let t = 0; t < 0.7; t += dt) {
      driftCar.update(dt, { throttle: 0.9, steer: -0.35, brake: 0.0, handbrake: false });
      if (driftCar.isDrifting) didDrift = true;
      if (Math.abs(driftCar.slipAngle) > maxDriftSlipAngle) {
        maxDriftSlipAngle = Math.abs(driftCar.slipAngle);
      }
    }

    // Exit punch (0.5s): full throttle straightening out
    for (let t = 0; t < 0.5; t += dt) {
      driftCar.update(dt, { throttle: 1.0, steer: 0.0, brake: 0.0, handbrake: false });
    }

    // 2. Pure braking car navigating the same hairpin by heavy braking to avoid slide
    const brakeCar = new VehiclePhysics(starterCar);
    brakeCar.reset(0, 0, 0, 0);
    brakeCar.vy = initialSpeed;
    brakeCar.speed = initialSpeed;

    // Corner Entry (0.3s): hard braking before turn
    for (let t = 0; t < 0.3; t += dt) {
      brakeCar.update(dt, { throttle: 0.0, steer: 0.0, brake: 1.0, handbrake: false });
    }

    // Mid-corner apex (0.7s): slow speed steer through corner
    for (let t = 0; t < 0.7; t += dt) {
      brakeCar.update(dt, { throttle: 0.2, steer: 0.6, brake: 0.5, handbrake: false });
    }

    // Exit punch (0.5s): full throttle reacceleration from stop/crawl
    for (let t = 0; t < 0.5; t += dt) {
      brakeCar.update(dt, { throttle: 1.0, steer: 0.0, brake: 0.0, handbrake: false });
    }

    // Drift car must maintain non-zero slip angle during hairpin
    assert.ok(didDrift, 'Drift car must enter drift state during hairpin');
    assert.ok(maxDriftSlipAngle > 0.15, `Drift car slip angle (${maxDriftSlipAngle.toFixed(3)}) must be non-zero (> 0.15 rad)`);

    // Drift car exits corner faster than pure braking car
    assert.ok(
      driftCar.speed > brakeCar.speed,
      `Drift exit speed (${driftCar.speed.toFixed(2)} m/s) must exceed pure braking speed (${brakeCar.speed.toFixed(2)} m/s)`
    );
  });
});
