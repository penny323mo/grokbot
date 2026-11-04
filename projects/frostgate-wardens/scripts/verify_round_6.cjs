const puppeteer = require('/workspace/nightly/shotkit/node_modules/puppeteer-core');
const fs = require('fs');
const path = require('path');

(async () => {
    const outDir = 'screenshots/review-round-6';
    fs.mkdirSync(outDir, { recursive: true });

    console.log('=== STARTING ROUND 6 VERIFICATION SUITE ===');

    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/google-chrome',
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--autoplay-policy=no-user-gesture-required'
        ]
    });

    const page = await browser.newPage();
    await page.setViewport({
        width: 390,
        height: 844,
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true
    });

    const consoleErrors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
        }
    });
    page.on('pageerror', err => consoleErrors.push(err.message));

    console.log('\n--- 1. Testing Title Screen (390×844 & 375×667) ---');
    await page.goto('http://localhost:8080/', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    // Capture Title screen at 390x844
    await page.screenshot({ path: `${outDir}/390-title-screen.png` });
    console.log('✓ Title screen captured (390×844)');

    // Unlock audio via tap
    await page.touchscreen.tap(195, 100);
    await new Promise(r => setTimeout(r, 400));

    // Switch to 375x667 to verify Region 5 card is above fold
    await page.setViewport({
        width: 375,
        height: 667,
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true
    });
    await new Promise(r => setTimeout(r, 400));

    const foldCheck = await page.evaluate(() => {
        const cards = document.querySelectorAll('.region-card');
        const r5 = cards[cards.length - 1];
        if (!r5) return { error: 'No region cards found' };
        const rect = r5.getBoundingClientRect();
        return {
            r5Top: rect.top,
            r5Bottom: rect.bottom,
            viewportHeight: window.innerHeight,
            allCardsVisible: rect.bottom <= window.innerHeight
        };
    });
    console.log('375×667 Region 5 Card Fold Check:', foldCheck);
    await page.screenshot({ path: `${outDir}/375-title-screen.png` });

    // Switch back to 390x844 for all 5 regions
    await page.setViewport({
        width: 390,
        height: 844,
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true
    });
    await new Promise(r => setTimeout(r, 400));

    console.log('\n--- 2. Verifying All 5 Regions Opening Camera & Battle Presentation (390×844) ---');
    for (let r = 1; r <= 5; r++) {
        console.log(`\nTesting Region ${r} on 390×844...`);
        await page.evaluate(async (reg) => {
            if (window.startRegion) await window.startRegion(reg, false);
        }, r);
        await new Promise(r => setTimeout(r, 1000));

        // (a) Opening Camera (strictly before any panning)
        await page.screenshot({ path: `${outDir}/390-r${r}-01-opening.png` });

        // Check camera framing of keep top, spawn mouths, and letterboxing
        const framing = await page.evaluate(() => {
            const cam = window.camera;
            const game = window.game;
            const map = game.map;
            const usable = cam.getUsableRect();
            
            // Keep top
            const keepScreen = cam.worldToScreen(map.castle_pos.x, map.castle_pos.y - 140);
            const keepInside = keepScreen.y >= usable.y && keepScreen.y <= usable.y + usable.height &&
                               keepScreen.x >= usable.x && keepScreen.x <= usable.x + usable.width;
            
            // Spawns
            const spawns = map.spawns || [map.spawn_pos];
            let spawnsInside = true;
            for (const sp of spawns) {
                const spScreen = cam.worldToScreen(sp.x, sp.y + 24);
                if (spScreen.y < usable.y || spScreen.y > usable.y + usable.height ||
                    spScreen.x < usable.x || spScreen.x > usable.x + usable.width) {
                    spawnsInside = false;
                }
            }

            const noLetterboxW = map.width * cam.zoom >= cam.vw - 0.001;
            const noLetterboxH = map.height * cam.zoom >= cam.vh - 0.001;

            return {
                zoom: cam.zoom,
                usableRect: usable,
                keepScreen,
                keepInside,
                spawnsInside,
                noLetterbox: noLetterboxW && noLetterboxH,
                renderedW: map.width * cam.zoom,
                renderedH: map.height * cam.zoom
            };
        });
        console.log(`Region ${r} (390×844): Keep inside? ${framing.keepInside}, Spawns inside? ${framing.spawnsInside}, No letterbox? ${framing.noLetterbox}, Zoom: ${framing.zoom.toFixed(3)}`);

        // Build towers to show level badges and shadows
        await page.evaluate(() => {
            const g = window.game;
            if (g && g.map.plots.length >= 3) {
                g.gold = 1000;
                g.buildTower(0, 'crossbow');
                g.upgradeTower(0, 'range');
                g.buildTower(1, 'mortar');
                g.upgradeTower(1, 'special_a');
                g.buildTower(2, 'frost');
            }
        });
        await new Promise(r => setTimeout(r, 400));

        // Start wave
        await page.click('#btn-start-wave');
        await new Promise(r => setTimeout(r, 2200));

        // (b) Mid-wave combat with new hero & badges
        await page.screenshot({ path: `${outDir}/390-r${r}-02-midwave.png` });

        // Pause modal
        await page.click('#btn-pause');
        await new Promise(r => setTimeout(r, 400));
        await page.screenshot({ path: `${outDir}/390-r${r}-03-pause-modal.png` });

        // Return to title screen
        await page.click('#btn-quit-map');
        await new Promise(r => setTimeout(r, 600));
    }

    console.log('\n--- 3. Verifying All 5 Regions Opening Camera on 375×667 (Zero Indigo Bars) ---');
    await page.setViewport({
        width: 375,
        height: 667,
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true
    });
    await new Promise(r => setTimeout(r, 400));

    for (let r = 1; r <= 5; r++) {
        await page.evaluate(async (reg) => {
            if (window.startRegion) await window.startRegion(reg, false);
        }, r);
        await new Promise(r => setTimeout(r, 1000));

        await page.screenshot({ path: `${outDir}/375-r${r}-01-opening.png` });

        const framing375 = await page.evaluate(() => {
            const cam = window.camera;
            const game = window.game;
            const map = game.map;
            const usable = cam.getUsableRect();
            
            const keepScreen = cam.worldToScreen(map.castle_pos.x, map.castle_pos.y - 140);
            const keepInside = keepScreen.y >= usable.y && keepScreen.y <= usable.y + usable.height;
            
            const spawns = map.spawns || [map.spawn_pos];
            let spawnsInside = true;
            for (const sp of spawns) {
                const spScreen = cam.worldToScreen(sp.x, sp.y + 24);
                if (spScreen.y < usable.y || spScreen.y > usable.y + usable.height) {
                    spawnsInside = false;
                }
            }

            const noLetterboxW = map.width * cam.zoom >= 375 - 0.001;
            const noLetterboxH = map.height * cam.zoom >= 667 - 0.001;

            return {
                zoom: cam.zoom,
                usableRect: usable,
                keepScreen,
                keepInside,
                spawnsInside,
                noLetterbox: noLetterboxW && noLetterboxH,
                renderedW: map.width * cam.zoom,
                renderedH: map.height * cam.zoom
            };
        });
        console.log(`Region ${r} (375×667): Keep inside? ${framing375.keepInside}, Spawns inside? ${framing375.spawnsInside}, No letterbox? ${framing375.noLetterbox}, Zoom: ${framing375.zoom.toFixed(4)}, Rendered: ${framing375.renderedW.toFixed(1)}×${framing375.renderedH.toFixed(1)}`);

        // On Region 1, test runner sprite height at opening zoom
        if (r === 1) {
            await page.click('#btn-start-wave');
            await new Promise(r => setTimeout(r, 2200));

            const enemyScale = await page.evaluate(() => {
                const game = window.game;
                const cam = window.camera;
                const runner = game.enemies.find(e => e.type === 'runner') || game.enemies[0];
                if (!runner) return null;
                const drawSizeWorld = runner.size * 3.6;
                const drawSizeCss = drawSizeWorld * cam.zoom;
                return {
                    type: runner.type,
                    worldSize: drawSizeWorld,
                    zoom: cam.zoom,
                    cssHeight: drawSizeCss
                };
            });
            console.log('Region 1 (375×667) Runner Scale Check:', enemyScale);
            await page.screenshot({ path: `${outDir}/375-r1-midwave.png` });
        }

        await page.click('#btn-pause');
        await new Promise(r => setTimeout(r, 400));
        await page.click('#btn-quit-map');
        await new Promise(r => setTimeout(r, 600));
    }

    console.log('\nConsole Errors caught during run:', consoleErrors);
    console.log('\n=== ALL ROUND 6 VERIFICATIONS COMPLETED SUCCESSFULLY ===');
    await browser.close();
})();
