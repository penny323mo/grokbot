// Data Integrity & Asset Existence Test Suite
import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { execSync } from 'child_process';
import { TOWERS, ENEMIES } from '../src/data.js';

export function runDataIntegrityTests() {
    console.log('--- Running Data Integrity & Asset Existence Tests ---');

    // 1. Starter Art Existence
    const starterArt = [
        'assets/art/cover.webp',
        'assets/art/thumb.webp',
        'assets/art/style_board.webp',
        'assets/art/title_key.webp'
    ];
    for (const art of starterArt) {
        assert(fs.existsSync(art), `Missing starter art: ${art}`);
    }
    console.log('✓ Starter art assets verified');

    // 2. Maps 1 to 5 JSON and WebP
    for (let r = 1; r <= 5; r++) {
        const jsonPath = `assets/maps/map${r}.json`;
        const webpPath = `assets/maps/map${r}.webp`;
        assert(fs.existsSync(jsonPath), `Missing map JSON: ${jsonPath}`);
        assert(fs.existsSync(webpPath), `Missing map WebP: ${webpPath}`);

        const sizeKb = fs.statSync(webpPath).size / 1024.0;
        assert(sizeKb <= 450.0, `Map ${r} WebP size ${sizeKb.toFixed(1)} KB exceeds 450 KB limit!`);

        const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        assert.strictEqual(data.width, 1600, `Map ${r} width must be 1600`);
        assert.strictEqual(data.height, 2400, `Map ${r} height must be 2400`);
        assert(data.waypoints && data.waypoints.length >= 8, `Map ${r} waypoints must have >= 8 points`);
        assert(data.plots && data.plots.length >= 8, `Map ${r} plots must have >= 8 plots`);

        // Check all waypoints inside bounds
        for (let i = 0; i < data.waypoints.length; i++) {
            const wp = data.waypoints[i];
            assert(wp.x >= 0 && wp.x <= data.width, `Map ${r} wp ${i} x (${wp.x}) out of bounds`);
            assert(wp.y >= 0 && wp.y <= data.height, `Map ${r} wp ${i} y (${wp.y}) out of bounds`);
        }

        // Check all plots inside bounds
        for (let i = 0; i < data.plots.length; i++) {
            const p = data.plots[i];
            assert(p.x >= 0 && p.x <= data.width, `Map ${r} plot ${i} x (${p.x}) out of bounds`);
            assert(p.y >= 0 && p.y <= data.height, `Map ${r} plot ${i} y (${p.y}) out of bounds`);
        }

        assert(data.castle_pos && typeof data.castle_pos.x === 'number', `Map ${r} missing castle_pos`);
        assert(data.spawn_pos && typeof data.spawn_pos.x === 'number', `Map ${r} missing spawn_pos`);
        assert(data.keep_tip && typeof data.keep_tip.x === 'number' && typeof data.keep_tip.y === 'number', `Map ${r} missing keep_tip`);
        assert(data.keep_tip.y >= 200 && data.keep_tip.y <= 300, `Map ${r} keep_tip Y (${data.keep_tip.y}) outside expected apex range [200, 300]`);
    }
    console.log('✓ All 5 region maps, JSON, WebP, waypoints and plots verified');

    // 3. Tower Sprites
    assert(fs.existsSync('assets/towers/plot.png'), 'Missing plot.png base');
    for (const tKey in TOWERS) {
        const tDef = TOWERS[tKey];
        for (const lvl in tDef.levels) {
            const spritePath = tDef.levels[lvl].sprite;
            assert(fs.existsSync(spritePath), `Missing tower sprite: ${spritePath}`);
        }
    }
    console.log('✓ All 21 tower sprites verified on disk');

    // 4. Enemy and Boss Sprites
    for (const eKey in ENEMIES) {
        const eDef = ENEMIES[eKey];
        assert(fs.existsSync(eDef.sprite), `Missing enemy sprite: ${eDef.sprite}`);
        if (eDef.spriteWalk) {
            for (const sw of eDef.spriteWalk) {
                assert(fs.existsSync(sw), `Missing enemy walk sprite: ${sw}`);
            }
        }
    }
    console.log('✓ All 8 enemy types and 5 boss sprites verified on disk');

    // 5. Hero Sprites
    assert(fs.existsSync('assets/hero/hero_0.png'), 'Missing hero_0.png');
    assert(fs.existsSync('assets/hero/hero_1.png'), 'Missing hero_1.png');
    console.log('✓ Hero sprites verified on disk');

    // 6. Road Color Sampling Verification across all 5 maps
    const roadVerifOutput = execSync('python3 scripts/verify_road_colors.py', { encoding: 'utf8' });
    assert(roadVerifOutput.includes('ALL 5 MAPS: EVERY WAYPOINT AND PLOT VERIFIED'), 'Road color verification must pass');
    console.log('✓ Road color sampling: All waypoints & plots verified on/beside the road');

    return true;
}
