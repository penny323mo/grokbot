// Headless Simulation proving Winnability, Failure without Defense, and Difficulty Ordering
import assert from 'assert';
import fs from 'fs';
import { GameEngine } from '../src/game.js';
import { REGION_1_WAVES, REGION_2_WAVES, REGION_3_WAVES, REGION_4_WAVES, REGION_5_WAVES, ENEMIES, TOWERS } from '../src/data.js';

export function runHeadlessSimulationTests() {
    console.log('--- Running Headless Game Simulation Tests ---');

    const map1 = JSON.parse(fs.readFileSync('assets/maps/map1.json', 'utf8'));

    // Simulation 1: Failure with Zero Defense (All 12 Waves of Region 1 with Hero sidelined)
    {
        const game = new GameEngine(map1, REGION_1_WAVES);
        // Move hero off the road so hero does not intercept
        game.hero.x = -999;
        game.hero.y = -999;
        game.hero.targetX = -999;
        game.hero.targetY = -999;

        // Step simulation until castle HP drops to 0 or max time
        let dt = 0.05;
        let t = 0;
        while (t < 250.0 && game.castleHp > 0) {
            if (game.waveState === 'waiting') {
                game.startWave();
            }
            game.update(dt);
            t += dt;
        }

        // With zero towers and no hero, enemies breach and castle HP reaches 0
        assert.strictEqual(game.castleHp, 0, `Castle HP must drop to 0 under zero defense (HP: ${game.castleHp})`);
        console.log(`✓ Zero defense simulation passed: Castle HP reached 0 on wave ${game.currentWave}`);
    }

    // Simulation 2: Winnability with Sensible Defense (Full Region 1 all 12 waves)
    {
        const game = new GameEngine(map1, REGION_1_WAVES);

        // Position hero near mid-road choke point
        const midWp = map1.waypoints[Math.floor(map1.waypoints.length / 2)];
        game.hero.x = midWp.x;
        game.hero.y = midWp.y;

        // Sensible opener: Crossbow on plot 0, Frost on plot 3, Mortar on plot 4
        game.buildTower(0, 'crossbow');
        game.buildTower(3, 'frost');
        game.buildTower(4, 'mortar');

        let dt = 0.05;
        let t = 0;
        while (t < 400.0 && game.castleHp > 0 && game.waveState !== 'finished') {
            if (game.waveState === 'waiting') {
                // Strategic tower expansion & upgrades as gold is earned
                for (const pid of [1, 7, 2, 8]) {
                    if (game.gold >= 160 && !game.towers.some(tw => tw.plotId === pid)) {
                        game.buildTower(pid, pid === 1 ? 'guard' : (pid === 7 ? 'bell' : 'crossbow'));
                        break;
                    }
                }
                for (const tw of game.towers) {
                    const curLvlDef = TOWERS[tw.type].levels[tw.level];
                    if (tw.level === '1' && curLvlDef && game.gold >= curLvlDef.upgradeCost) {
                        game.upgradeTower(tw.plotId);
                        break;
                    } else if (tw.level === '2' && curLvlDef && game.gold >= curLvlDef.upgradeCost) {
                        game.upgradeTower(tw.plotId, '3a');
                        break;
                    }
                }
                game.startWave();
            }
            game.update(dt);
            t += dt;
        }

        assert.strictEqual(game.waveState, 'finished', `Full Region 1 must be won (state: ${game.waveState})`);
        assert.strictEqual(game.currentWave, 12, `All 12 waves must be cleared (current: ${game.currentWave})`);
        assert(game.castleHp > 0, `Castle HP must remain > 0 (HP: ${game.castleHp})`);
        console.log(`✓ Winnability simulation passed: Cleared all 12 waves with ${game.castleHp}/20 Castle HP`);
    }

    // Simulation 3: Difficulty Ordering Proof
    {
        const regionWaves = [REGION_1_WAVES, REGION_2_WAVES, REGION_3_WAVES, REGION_4_WAVES, REGION_5_WAVES];
        const totalHpPerRegion = [];

        for (let r = 0; r < regionWaves.length; r++) {
            let totalHp = 0;
            for (const wave of regionWaves[r]) {
                for (const sp of wave.spawns) {
                    const eDef = ENEMIES[sp.type];
                    totalHp += eDef.hp * sp.count;
                }
            }
            totalHpPerRegion.push(totalHp);
        }

        console.log('Total incoming enemy HP per Region:', totalHpPerRegion);

        // Verify strictly monotonic escalation in total HP requirement
        for (let i = 1; i < totalHpPerRegion.length; i++) {
            assert(totalHpPerRegion[i] > totalHpPerRegion[i-1],
                `Region ${i+1} total HP (${totalHpPerRegion[i]}) must exceed Region ${i} (${totalHpPerRegion[i-1]})`);
        }

        // Verify Boss HP ordering
        const bossHp = [
            ENEMIES.boss_1.hp,
            ENEMIES.boss_2.hp,
            ENEMIES.boss_3.hp,
            ENEMIES.boss_4.hp,
            ENEMIES.boss_5.hp
        ];
        console.log('Boss HP progression:', bossHp);
        for (let i = 1; i < bossHp.length; i++) {
            assert(bossHp[i] > bossHp[i-1], `Boss ${i+1} HP must exceed Boss ${i}`);
        }
        console.log('✓ Campaign difficulty ordering formally verified');
    }

    // Simulation 4: All 5 Region Maps Engine Verification (Multi-path & No NaN)
    {
        const regionWaves = [REGION_1_WAVES, REGION_2_WAVES, REGION_3_WAVES, REGION_4_WAVES, REGION_5_WAVES];
        for (let r = 1; r <= 5; r++) {
            const mapData = JSON.parse(fs.readFileSync(`assets/maps/map${r}.json`, 'utf8'));
            const game = new GameEngine(mapData, [regionWaves[r - 1][0]]);
            game.buildTower(0, 'crossbow');
            game.startWave();

            let t = 0;
            const dt = 0.05;
            while (t < 5.0) {
                game.update(dt);
                t += dt;
            }

            // Assert no NaN in any game properties
            assert(!Number.isNaN(game.castleHp), `Region ${r} castleHp is NaN`);
            assert(!Number.isNaN(game.gold), `Region ${r} gold is NaN`);
            for (const e of game.enemies) {
                assert(!Number.isNaN(e.x) && !Number.isNaN(e.y), `Region ${r} enemy (${e.x}, ${e.y}) has NaN`);
            }
        }
        console.log('✓ All 5 region maps engine execution & multi-path verified (no NaN)');
    }

    // Simulation 5: Full Campaign 350-Gold Starting Playthrough Verification Across All 5 Regions
    {
        const regionDefs = [
            { id: 1, waves: REGION_1_WAVES, startGold: 350 },
            { id: 2, waves: REGION_2_WAVES, startGold: 350 },
            { id: 3, waves: REGION_3_WAVES, startGold: 350 },
            { id: 4, waves: REGION_4_WAVES, startGold: 350 },
            { id: 5, waves: REGION_5_WAVES, startGold: 350 }
        ];

        for (const reg of regionDefs) {
            const mapData = JSON.parse(fs.readFileSync(`assets/maps/map${reg.id}.json`, 'utf8'));

            // 1. Zero defense on full region -> castle HP must reach 0
            const zeroGame = new GameEngine(mapData, reg.waves);
            zeroGame.hero.x = -999;
            zeroGame.hero.y = -999;
            let dt = 0.05, t = 0;
            while (t < 250.0 && zeroGame.castleHp > 0) {
                if (zeroGame.waveState === 'waiting') zeroGame.startWave();
                zeroGame.update(dt);
                t += dt;
            }
            assert.strictEqual(zeroGame.castleHp, 0, `Zero defense must defeat Region ${reg.id}`);

            // 2. Full defense from clean 350-gold start with fixed build and NO mid-wave purchases
            const winGame = new GameEngine(mapData, reg.waves);
            winGame.gold = reg.startGold; // Exactly 350 gold starting balance

            // Position hero at strategic choke point
            if (reg.id === 5) {
                // Near Citadel confluence
                const confWp = (mapData.paths && mapData.paths[0][4]) ? mapData.paths[0][4] : { x: 800, y: 1075 };
                winGame.hero.x = confWp.x;
                winGame.hero.y = confWp.y;
            } else {
                const midIdx = Math.floor(mapData.waypoints.length / 2);
                winGame.hero.x = mapData.waypoints[midIdx].x;
                winGame.hero.y = mapData.waypoints[midIdx].y;
            }

            // Fixed initial build with starting 350 gold
            if (reg.id === 5) {
                winGame.buildTower(6, 'crossbow'); // 100
                winGame.buildTower(7, 'crossbow'); // 100
                winGame.buildTower(5, 'mortar');   // 125 -> total 325
            } else if (reg.id === 2) {
                winGame.buildTower(mapData.plots[0].id, 'crossbow'); // 100
                winGame.buildTower(mapData.plots[2].id, 'crossbow'); // 100
                winGame.buildTower(mapData.plots[6].id, 'mortar');   // 125 -> total 325
            } else {
                winGame.buildTower(mapData.plots[0].id, 'crossbow'); // 100
                winGame.buildTower(mapData.plots[1].id, 'frost');    // 110
                winGame.buildTower(mapData.plots[2].id, 'mortar');   // 125 -> total 335
            }

            t = 0;
            while (t < 600.0 && winGame.castleHp > 0 && winGame.waveState !== 'finished') {
                if (winGame.waveState === 'waiting') {
                    // Purchases ONLY occur between waves (strictly NO mid-wave purchases)
                    let changed = true;
                    while (changed) {
                        changed = false;
                        // Upgrade priority 1: Level 1 -> Level 2
                        for (const tw of winGame.towers) {
                            const curLvlDef = TOWERS[tw.type].levels[tw.level];
                            if (tw.level === '1' && curLvlDef && winGame.gold >= curLvlDef.upgradeCost) {
                                winGame.upgradeTower(tw.plotId);
                                changed = true;
                                break;
                            }
                        }
                        if (changed) continue;

                        // Build expansion towers on empty plots
                        const plotOrder = reg.id === 5 ? [7, 8, 4, 5, 2, 3, 0, 1] : mapData.plots.map(p => p.id);
                        for (const pid of plotOrder) {
                            if (!winGame.towers.some(tw => tw.plotId === pid)) {
                                const nextType = pid % 2 === 0 ? 'crossbow' : 'mortar';
                                const cost = TOWERS[nextType].cost;
                                if (winGame.gold >= cost) {
                                    winGame.buildTower(pid, nextType);
                                    changed = true;
                                    break;
                                }
                            }
                        }
                        if (changed) continue;

                        // Upgrade priority 2: Level 2 -> Level 3a
                        for (const tw of winGame.towers) {
                            const curLvlDef = TOWERS[tw.type].levels[tw.level];
                            if (tw.level === '2' && curLvlDef && winGame.gold >= curLvlDef.upgradeCost) {
                                winGame.upgradeTower(tw.plotId, '3a');
                                changed = true;
                                break;
                            }
                        }
                    }
                    winGame.startWave();
                }
                winGame.update(dt);
                t += dt;
            }

            assert.strictEqual(winGame.waveState, 'finished', `Region ${reg.id} must be winnable with 350-gold start`);
            assert(winGame.castleHp > 0, `Region ${reg.id} Castle HP must remain > 0 (HP: ${winGame.castleHp})`);
            console.log(`✓ Region ${reg.id} 350-gold campaign clear: Cleared with ${winGame.castleHp}/${winGame.maxCastleHp} HP (Gold remaining: ${winGame.gold})`);
        }
    }

    return true;
}
