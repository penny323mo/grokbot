// Master Test Runner for 霜門守望 Frostgate Wardens
import { runDataIntegrityTests } from './data_integrity.test.js';
import { runTowerEconomyTests } from './tower_economy.test.js';
import { runWaveDefinitionTests } from './wave_definitions.test.js';
import { runHeadlessSimulationTests } from './headless_simulation.test.js';
import { runSaveLoadTests } from './save_load.test.js';
import { runCameraFramingTests } from './camera_framing.test.js';

console.log('====================================================');
console.log('❄️  霜門守望 · FROSTGATE WARDENS QUALITY GATE TESTS  ❄️');
console.log('====================================================\n');

let passed = 0;
let total = 6;

try {
    runDataIntegrityTests();
    passed++;
    console.log('[PASS 1/6] Data Integrity & Asset Verification\n');

    runTowerEconomyTests();
    passed++;
    console.log('[PASS 2/6] Tower DPS & Economy Monotonicity\n');

    runWaveDefinitionTests();
    passed++;
    console.log('[PASS 3/6] Wave Definitions & Regional Variety\n');

    runHeadlessSimulationTests();
    passed++;
    console.log('[PASS 4/6] Headless Combat Simulation & Winnability Proof\n');

    runSaveLoadTests();
    passed++;
    console.log('[PASS 5/6] Save / Load Persistence Round-Trip\n');

    runCameraFramingTests();
    passed++;
    console.log('[PASS 6/6] Camera Universal Framing & UsableRect Verification\n');

    console.log('====================================================');
    console.log(`✅ ALL TESTS PASSED: ${passed}/${total} SUITES SUCCESSFUL`);
    console.log('====================================================');
    process.exit(0);
} catch (err) {
    console.error('\n❌ TEST FAILURE:', err.message);
    console.error(err.stack);
    process.exit(1);
}
