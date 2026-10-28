// Storage & Persistence Unit Tests for Midnight Touge (《夜峠》)
import { test, describe } from 'node:test';
import assert from 'node:assert';
import { StorageEngine } from '../src/core/storage.js';
import { EVENTS_DATA } from '../src/data/events.js';

describe('Storage Engine & Garage Unlocks', () => {
  test('Initializes with default coins and unlocked starter car', () => {
    const storage = new StorageEngine();
    assert.strictEqual(storage.data.coins, 500);
    assert.ok(storage.data.selectedCarId === 'h86' || storage.data.selectedCarId === 'rs86');
    assert.ok(storage.isCarUnlocked('h86') || storage.isCarUnlocked('rs86'));
    assert.strictEqual(storage.isCarUnlocked('gt20'), false);
    assert.strictEqual(storage.isCarUnlocked('re7'), false);
  });

  test('Unlocking car deducts coins and marks unlocked', () => {
    const storage = new StorageEngine();
    storage.data.coins = 2000;

    const success = storage.unlockCar('gt20', 1200);
    assert.strictEqual(success, true);
    assert.strictEqual(storage.data.coins, 800);
    assert.ok(storage.isCarUnlocked('gt20'));

    // Should fail if not enough coins and medal conditions not met
    const fail = storage.unlockCar('re7', 2500);
    assert.strictEqual(fail, false);
    assert.strictEqual(storage.isCarUnlocked('re7'), false);
  });

  test('Unlocking car grants unlock via gold medal achievement without coin cost', () => {
    const storage = new StorageEngine();
    storage.data.coins = 0; // Zero coins

    // 1. GT-20 unlocks with 3 gold medals
    assert.strictEqual(storage.canUnlockCar('gt20', 1500), false, 'Cannot unlock before earning medals');
    storage.data.stageProgress[1] = { unlocked: true, medal: 'gold' };
    storage.data.stageProgress[2] = { unlocked: true, medal: 'gold' };
    storage.data.stageProgress[3] = { unlocked: true, medal: 'gold' };
    assert.strictEqual(storage.getTotalMedals().gold, 3);
    assert.strictEqual(storage.canUnlockCar('gt20', 1500), true, 'Predicate enables unlock button with 3 golds and 0 coins');

    const gt20Success = storage.unlockCar('gt20', 1500);
    assert.strictEqual(gt20Success, true);
    assert.strictEqual(storage.data.coins, 0, 'No coins should be deducted for medal achievement unlock');
    assert.ok(storage.isCarUnlocked('gt20'));

    // 2. RE-7 unlocks with Stage 12 gold medal (beating Touge boss)
    assert.strictEqual(storage.canUnlockCar('re7', 3500), false, 'Cannot unlock RE-7 before beating Stage 12');
    assert.strictEqual(storage.unlockCar('re7', 3500), false, 'RE-7 remains locked before beating Stage 12');
    storage.data.stageProgress[12] = { unlocked: true, medal: 'gold' };
    assert.strictEqual(storage.canUnlockCar('re7', 3500), true, 'Predicate enables unlock button for RE-7 after beating boss');

    const re7Success = storage.unlockCar('re7', 3500);
    assert.strictEqual(re7Success, true);
    assert.strictEqual(storage.data.coins, 0, 'No coins should be deducted for beating boss');
    assert.ok(storage.isCarUnlocked('re7'));
  });

  test('Selecting unlocked car updates selectedCarId and color', () => {
    const storage = new StorageEngine();
    storage.data.coins = 3000;
    storage.unlockCar('re7', 2500);

    const selectSuccess = storage.selectCar('re7', 2);
    assert.strictEqual(selectSuccess, true);
    assert.strictEqual(storage.data.selectedCarId, 're7');
    assert.strictEqual(storage.data.selectedColorIdx, 2);

    // Cannot select locked car
    const selectLocked = storage.selectCar('gt20', 0);
    assert.strictEqual(selectLocked, false);
  });

  test('Resolves medal correctly from real EVENTS_DATA[0].timeTargets and unlocks Stage 2', () => {
    const storage = new StorageEngine();
    const stage1 = EVENTS_DATA[0];

    // Assert timeTargets exist on real data
    assert.ok(stage1.timeTargets, 'Stage 1 must have timeTargets');
    assert.ok(stage1.timeTargets.gold > 0);

    // Player finishes in 50.2s, which is <= 52.0s gold target
    const finishTime = 50.2;
    let earnedMedal = null;
    if (finishTime <= stage1.timeTargets.gold) earnedMedal = 'gold';
    else if (finishTime <= stage1.timeTargets.silver) earnedMedal = 'silver';
    else if (finishTime <= stage1.timeTargets.bronze) earnedMedal = 'bronze';

    assert.strictEqual(earnedMedal, 'gold', '50.2s must resolve to gold against 52.0s target');

    const rewardCoins = stage1.rewardCoins[earnedMedal];
    assert.strictEqual(rewardCoins, 300);

    // Record stage result in storage
    storage.recordStageResult(stage1.id, finishTime, 4200, earnedMedal, rewardCoins);

    assert.strictEqual(storage.data.stageProgress[1].medal, 'gold');
    assert.strictEqual(storage.data.stageProgress[1].bestTime, 50.2);
    assert.ok(storage.data.stageProgress[2].unlocked, 'Stage 2 must unlock after Stage 1 gold');

    const medals = storage.getTotalMedals();
    assert.strictEqual(medals.gold, 1);
  });

  test('Persists settings updates for controls and audio', () => {
    const storage = new StorageEngine();
    storage.updateSettings({
      autoThrottle: false,
      controlType: 'tilt',
      musicVolume: 0.0
    });

    assert.strictEqual(storage.data.settings.autoThrottle, false);
    assert.strictEqual(storage.data.settings.controlType, 'tilt');
    assert.strictEqual(storage.data.settings.musicVolume, 0.0);
  });

  test('Saves and retrieves ghost replay frames on new best time', () => {
    const storage = new StorageEngine();
    const mockFrames = [
      { t: 0.1, x: 10, y: 20, z: 210, heading: 0.5 },
      { t: 0.2, x: 12, y: 25, z: 209, heading: 0.52 }
    ];

    storage.recordStageResult(1, 48.0, 5000, 'gold', 300, mockFrames);
    assert.ok(storage.data.ghostData[1], 'Ghost replay data must be recorded');
    assert.strictEqual(storage.data.ghostData[1].length, 2);
  });
});
