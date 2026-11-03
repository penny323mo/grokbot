// Wave Definitions and Composition Variety Tests
import assert from 'assert';
import { REGION_1_WAVES, REGION_2_WAVES, REGION_3_WAVES, REGION_4_WAVES, REGION_5_WAVES, ENEMIES } from '../src/data.js';

export function runWaveDefinitionTests() {
    console.log('--- Running Wave Definitions & Variety Tests ---');

    const regions = [
        { id: 1, name: '霜門山道', waves: REGION_1_WAVES, boss: 'boss_1' },
        { id: 2, name: '凍湖', waves: REGION_2_WAVES, boss: 'boss_2' },
        { id: 3, name: '杉林', waves: REGION_3_WAVES, boss: 'boss_3' },
        { id: 4, name: '焰口邊境', waves: REGION_4_WAVES, boss: 'boss_4' },
        { id: 5, name: '北辰堡', waves: REGION_5_WAVES, boss: 'boss_5' }
    ];

    for (const r of regions) {
        assert(r.waves.length >= 10, `Region ${r.id} (${r.name}) must have at least 10 waves (has ${r.waves.length})`);

        const enemyTypesInRegion = new Set();
        let totalEnemiesInRegion = 0;

        for (let w = 0; w < r.waves.length; w++) {
            const wave = r.waves[w];
            assert(wave.intro && wave.intro.length > 0, `Region ${r.id} Wave ${w+1} must have an intro string`);
            assert(wave.spawns && wave.spawns.length > 0, `Region ${r.id} Wave ${w+1} must have spawns`);

            for (const sp of wave.spawns) {
                assert(ENEMIES[sp.type], `Region ${r.id} Wave ${w+1} unknown enemy type: ${sp.type}`);
                assert(sp.count > 0 && Number.isInteger(sp.count), `Spawn count must be positive integer`);
                assert(sp.interval > 0, `Spawn interval must be positive`);
                enemyTypesInRegion.add(sp.type);
                totalEnemiesInRegion += sp.count;
            }
        }

        // Final wave must contain region boss
        const finalWave = r.waves[r.waves.length - 1];
        const hasBoss = finalWave.spawns.some(sp => sp.type === r.boss);
        assert(hasBoss, `Region ${r.id} final wave must feature boss ${r.boss}`);

        // Enemy type variety check
        assert(enemyTypesInRegion.size >= 3, `Region ${r.id} must feature at least 3 distinct enemy types (has ${enemyTypesInRegion.size})`);
    }

    console.log('✓ All 5 region wave definitions, boss spawns, and type diversity verified');
    return true;
}
