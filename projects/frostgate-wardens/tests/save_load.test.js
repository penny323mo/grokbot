// Save and Load Round-Trip Test Suite
import assert from 'assert';
import { SaveManager } from '../src/save.js';

export function runSaveLoadTests() {
    console.log('--- Running Save / Load Round-Trip Tests ---');

    // Mock localStorage for node environment
    const storageMap = {};
    global.localStorage = {
        getItem: (k) => storageMap[k] || null,
        setItem: (k, v) => { storageMap[k] = String(v); },
        removeItem: (k) => { delete storageMap[k]; }
    };

    const sm1 = new SaveManager();
    assert.deepStrictEqual(sm1.data.unlockedRegions, [1], 'Initial unlocked regions must be [1]');
    assert.strictEqual(sm1.getStars(1), 0, 'Initial stars must be 0');

    // Record victory in Region 1 with 3 stars
    sm1.recordVictory(1, 3);
    assert.strictEqual(sm1.getStars(1), 3, 'Stars in region 1 must be 3');
    assert(sm1.isRegionUnlocked(2), 'Region 2 must now be unlocked');

    // Record Endless wave
    sm1.recordEndlessWave(24);
    assert.strictEqual(sm1.data.bestEndlessWave, 24);

    // Save and load into a new instance
    const sm2 = new SaveManager();
    assert.strictEqual(sm2.getStars(1), 3, 'sm2 loaded stars must match');
    assert(sm2.isRegionUnlocked(2), 'sm2 loaded unlocked regions must include 2');
    assert.strictEqual(sm2.data.bestEndlessWave, 24, 'sm2 loaded endless wave must match');

    console.log('✓ Save / Load persistence round-trip verified');
    return true;
}
