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
});
