// Master Test Runner for 霜門守望 Frostgate Wardens
import { runDataIntegrityTests } from './data_integrity.test.js';
import { runTowerEconomyTests } from './tower_economy.test.js';
import { runWaveDefinitionTests } from './wave_definitions.test.js';
import { runHeadlessSimulationTests } from './headless_simulation.test.js';
import { runSaveLoadTests } from './save_load.test.js';

console.log('====================================================');
console.log('❄️  霜門守望 · FROSTGATE WARDENS QUALITY GATE TESTS  ❄️');
console.log('====================================================\n');

let passed = 0;
let total = 5;

try {
    runDataIntegrityTests();
    passed++;
    console.log('[PASS 1/5] Data Integrity & Asset Verification\n');

    runTowerEconomyTests();
    passed++;
    console.log('[PASS 2/5] Tower DPS & Economy Monotonicity\n');

    runWaveDefinitionTests();
    passed++;
    console.log('[PASS 3/5] Wave Definitions & Regional Variety\n');

    runHeadlessSimulationTests();
    passed++;
    console.log('[PASS 4/5] Headless Combat Simulation & Winnability Proof\n');

    runSaveLoadTests();
    passed++;
    console.log('[PASS 5/5] Save / Load Persistence Round-Trip\n');

    console.log('====================================================');
    console.log(`✅ ALL TESTS PASSED: ${passed}/${total} SUITES SUCCESSFUL`);
    console.log('====================================================');
    process.exit(0);
} catch (err) {
    console.error('\n❌ TEST FAILURE:', err.message);
    console.error(err.stack);
    process.exit(1);
}
