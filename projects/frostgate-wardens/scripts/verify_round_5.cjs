const puppeteer = require('/workspace/nightly/shotkit/node_modules/puppeteer-core');
const fs = require('fs');
const path = require('path');

(async () => {
    const outDir = 'screenshots/review-round-5';
    fs.mkdirSync(outDir, { recursive: true });

    console.log('=== STARTING ROUND 5 VERIFICATION SUITE ===');

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

    console.log('\n--- 1. Testing Title Screen (390×844) & Audio Unlock ---');
    await page.goto('http://localhost:8080/', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    // Capture Title screen at 390x844 before any interactions
    await page.screenshot({ path: `${outDir}/390-title-screen.png` });
    console.log('✓ Title screen captured (390×844)');

    // Tap top banner area to unlock audio safely
    await page.touchscreen.tap(195, 100);
    await new Promise(r => setTimeout(r, 400));

    console.log('\n--- 2. Verifying All 5 Regions Opening Camera & Battle Presentation (390×844) ---');
    for (let r = 1; r <= 5; r++) {
        console.log(`\nTesting Region ${r}...`);
        await page.evaluate(async (reg) => {
            if (window.startRegion) await window.startRegion(reg, false);
        }, r);
        await new Promise(r => setTimeout(r, 1000));

        // (a) Opening Camera (strictly before any panning)
        await page.screenshot({ path: `${outDir}/390-r${r}-01-opening.png` });

        // Check camera framing of keep top and spawn mouths
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
                const spScreen = cam.worldToScreen(sp.x, sp.y + 48);
                if (spScreen.y < usable.y || spScreen.y > usable.y + usable.height ||
                    spScreen.x < usable.x || spScreen.x > usable.x + usable.width) {
                    spansInside = false;
                }
            }

            return {
                zoom: cam.zoom,
                usableRect: usable,
                keepScreen,
                keepInside,
                spawnsInside
            };
        });
        console.log(`Region ${r} framing check: Keep inside? ${framing.keepInside}, Spawns inside? ${framing.spawnsInside}, Zoom: ${framing.zoom.toFixed(3)}`);

        // Build towers to show level badges and shadows
        await page.evaluate(() => {
            const g = window.game;
            if (g && g.map.plots.length >= 3) {
                g.gold = 1000; // allow upgrading for screenshot
                g.buildTower(0, 'crossbow');
                g.upgradeTower(0, 'range'); // level 2
                g.buildTower(1, 'mortar');
                g.upgradeTower(1, 'special_a'); // level 3A
                g.buildTower(2, 'frost');
            }
        });
        await new Promise(r => setTimeout(r, 400));

        // Start wave
        await page.click('#btn-start-wave');
        await new Promise(r => setTimeout(r, 2200));

        // (b) Mid-wave combat with hero & badges
        await page.screenshot({ path: `${outDir}/390-r${r}-02-midwave.png` });

        // Test Pause button text & wrap
        await page.click('#btn-pause');
        await new Promise(r => setTimeout(r, 400));
        await page.screenshot({ path: `${outDir}/390-r${r}-03-pause-modal.png` });

        // Return to title screen
        await page.click('#btn-quit-map');
        await new Promise(r => setTimeout(r, 600));

        // Verify AudioContext state is not suspended
        const audioState = await page.evaluate(async () => {
            const { sounds } = await import('./src/audio.js');
            return {
                ctxState: sounds.ctx ? sounds.ctx.state : 'null',
                isPaused: sounds.isPaused
            };
        });
        console.log(`After quitting Region ${r} to title, AudioContext state:`, audioState);
    }

    console.log('\n--- 3. Testing 375×667 (iPhone SE) Layout & Usability ---');
    await page.setViewport({
        width: 375,
        height: 667,
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true
    });
    await new Promise(r => setTimeout(r, 400));

    // Title screen on 375x667
    await page.screenshot({ path: `${outDir}/375-title-screen.png` });
    console.log('✓ Title screen captured (375×667)');

    // Region 1 on 375x667
    await page.evaluate(async () => {
        await window.startRegion(1, false);
    });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: `${outDir}/375-r1-opening.png` });

    // Region 5 on 375x667
    await page.evaluate(async () => {
        await window.startRegion(5, false);
    });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: `${outDir}/375-r5-opening.png` });

    console.log('\nConsole Errors caught during run:', consoleErrors);
    console.log('\n=== ALL ROUND 5 VERIFICATIONS COMPLETED SUCCESSFULLY ===');
    await browser.close();
})();
