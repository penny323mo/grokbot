// Battle Events & Invented Names Unit Tests for Midnight Touge (《夜峠》)
import { test, describe } from 'node:test';
import assert from 'node:assert';
import { EVENTS_DATA, FREE_RUN_EVENT, resolveMedal } from '../src/data/events.js';
import { CARS_DATA, getCarById } from '../src/data/cars.js';

describe('Events Contract, Battle Mode & Invented Names', () => {
  test('All 12 events have valid structure and invented names without copyright infringement', () => {
    assert.strictEqual(EVENTS_DATA.length, 12, 'Must have exactly 12 authored campaign events');

    for (const evt of EVENTS_DATA) {
      assert.ok(evt.id >= 1 && evt.id <= 12);
      assert.ok(evt.title && evt.title.length > 0);
      assert.ok(evt.subtitle && evt.subtitle.length > 0);
      assert.ok(evt.mode === 'time_attack' || evt.mode === 'drift_challenge' || evt.mode === 'battle');
      assert.ok(evt.direction === 'downhill' || evt.direction === 'uphill');
      assert.ok(evt.rewardCoins && evt.rewardCoins.gold > 0);

      // Verify no prohibited Initial D or real trademark text appears
      const fullText = `${evt.title} ${evt.subtitle} ${evt.desc} ${evt.rivalName || ''}`;
      assert.strictEqual(fullText.includes('豆腐店'), false, `Event ${evt.id} must not reference 豆腐店`);
      assert.strictEqual(fullText.includes('拓海'), false, `Event ${evt.id} must not reference 拓海`);
      assert.strictEqual(fullText.includes('高橋'), false, `Event ${evt.id} must not reference 高橋`);
      assert.strictEqual(fullText.includes('Toyota'), false, `Event ${evt.id} must not reference Toyota`);
      assert.strictEqual(fullText.includes('AE86'), false, `Event ${evt.id} must not reference AE86`);
    }
  });

  test('Battle events (Stage 4, 7, 9, 11, 12) have valid targetGap and rivalCar', () => {
    const battleEvents = EVENTS_DATA.filter(e => e.mode === 'battle');
    assert.strictEqual(battleEvents.length, 5, 'Should have 5 battle events');

    for (const battle of battleEvents) {
      assert.ok(battle.targetGap > 0, `Battle event ${battle.id} must specify targetGap in seconds`);
      assert.ok(battle.rivalCar, `Battle event ${battle.id} must specify rivalCar`);
      const car = getCarById(battle.rivalCar);
      assert.ok(car, `Rival car ${battle.rivalCar} must resolve to a valid car`);
    }
  });

  test('Battle mode evaluates victory and medal by gap seconds via resolveMedal', () => {
    const battleEvt = EVENTS_DATA.find(e => e.id === 4);
    assert.strictEqual(battleEvt.mode, 'battle');
    const reqGap = battleEvt.targetGap; // 3.5s

    // Case 1: Player leads rival by 4.0s (>= reqGap 3.5s) -> Gold
    assert.strictEqual(resolveMedal(battleEvt, { gapSeconds: 4.0 }), 'gold');

    // Case 2: Player leads rival by 2.0s (>= reqGap * 0.5 = 1.75s) -> Silver
    assert.strictEqual(resolveMedal(battleEvt, { gapSeconds: 2.0 }), 'silver');

    // Case 3: Player leads rival by a small 0.2s margin -> Bronze (NOT silver, verifies no || isVictory shortcut)
    assert.strictEqual(resolveMedal(battleEvt, { gapSeconds: 0.2 }), 'bronze');

    // Case 4: Player trails rival (-0.5s) -> null (defeat)
    assert.strictEqual(resolveMedal(battleEvt, { gapSeconds: -0.5 }), null);

    // Case 5: Time attack and drift challenge medal resolution via resolveMedal
    const taEvt = EVENTS_DATA.find(e => e.id === 1);
    assert.strictEqual(resolveMedal(taEvt, { time: 50.0 }), 'gold');
    assert.strictEqual(resolveMedal(taEvt, { time: 55.0 }), 'silver');
    assert.strictEqual(resolveMedal(taEvt, { time: 65.0 }), 'bronze');
    assert.strictEqual(resolveMedal(taEvt, { time: 95.0 }), null);
  });

  test('Free run practice mode exists with valid defaults', () => {
    assert.ok(FREE_RUN_EVENT);
    assert.strictEqual(FREE_RUN_EVENT.mode, 'free_run');
    assert.strictEqual(FREE_RUN_EVENT.targetDist, 2990);
  });

  test('Cars data contains 3 original vehicles with invented names and valid models', () => {
    assert.strictEqual(CARS_DATA.length, 3);
    for (const car of CARS_DATA) {
      assert.ok(car.id);
      assert.ok(car.name);
      assert.ok(car.modelPath);
      assert.ok(car.horsepower >= 130);
      assert.ok(car.tuning.powerMultiplier >= 1.0);
    }
  });
});
