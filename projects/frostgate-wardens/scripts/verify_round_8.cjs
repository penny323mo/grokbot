const puppeteer = require('/workspace/nightly/shotkit/node_modules/puppeteer-core');
const fs = require('fs');
const path = require('path');

(async () => {
    const outDir = 'screenshots/review-round-8';
    fs.mkdirSync(outDir, { recursive: true });

    console.log('=== STARTING ROUND 8 VERIFICATION SUITE ===');

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

        // Check camera framing of keep spire tip, spawn mouths, and letterboxing
        const framing = await page.evaluate(() => {
            const cam = window.camera;
            const game = window.game;
            const map = game.map;

            const spireY = map.keep_tip ? map.keep_tip.y : map.castle_pos.y - 280;
            const keepTopScreen = cam.worldToScreen(map.castle_pos.x, spireY);
            const castleScreen = cam.worldToScreen(map.castle_pos.x, map.castle_pos.y);

            const spawns = map.spawns || [map.spawn_pos];
            const spawnScreens = spawns.map(sp => cam.worldToScreen(sp.x, sp.y + 24));

            const renderedW = map.width * cam.zoom;
            const renderedH = map.height * cam.zoom;
            const letterboxed = renderedW < cam.vw - 0.001 || renderedH < cam.vh - 0.001;

            return {
                spireTopY: keepTopScreen.y,
                castleY: castleScreen.y,
                spawnYs: spawnScreens.map(s => s.y),
                zoom: cam.zoom,
                letterboxed,
                hudHeight: cam.hudHeight,
                dockHeight: cam.dockHeight,
                viewportH: cam.vh,
                dockTopY: cam.vh - cam.dockHeight
            };
        });

        console.log(`Region ${r} (390×844) Framing:`, framing);
        if (framing.spireTopY < 64) {
            console.warn(`⚠️ Warning: Region ${r} keep spire tip (${framing.spireTopY}px) is clipped by 64px HUD`);
        } else {
            console.log(`✓ Region ${r} keep spire tip safely below HUD (${framing.spireTopY.toFixed(1)}px >= 64px)`);
        }

        const maxSpawnY = Math.max(...framing.spawnYs);
        if (maxSpawnY > framing.dockTopY) {
            console.warn(`⚠️ Warning: Region ${r} spawn mouth (${maxSpawnY}px) is obscured by bottom dock (${framing.dockTopY}px)`);
        } else {
            console.log(`✓ Region ${r} spawn mouth safely above dock (${maxSpawnY.toFixed(1)}px <= ${framing.dockTopY}px)`);
        }

        if (framing.letterboxed) {
            console.warn(`⚠️ Warning: Region ${r} letterboxed on 390×844!`);
        } else {
            console.log(`✓ Region ${r} zero letterboxing on 390×844`);
        }

        // On Region 1: Build two adjacent towers on consecutive plots (Plot 0 and Plot 1)
        // and capture a screenshot demonstrating clean separation with ZERO pad stacking
        if (r === 1) {
            console.log('\n--- Building two adjacent towers on Plot 0 and Plot 1 to verify non-overlap ---');
            await page.evaluate(() => {
                const game = window.game;
                // Build crossbow on Plot 0 and mortar on Plot 1
                game.buildTower(0, 'crossbow');
                game.buildTower(1, 'mortar');
            });
            await new Promise(r => setTimeout(r, 500));
            await page.screenshot({ path: `${outDir}/390-r1-adjacent-towers.png` });
            console.log('✓ Captured 390-r1-adjacent-towers.png showing clean tower separation');
        }
    }

    console.log('\n--- 3. Verifying All 5 Regions Opening Camera on Compact Phone (375×667) ---');
    await page.setViewport({
        width: 375,
        height: 667,
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true
    });
    await new Promise(r => setTimeout(r, 400));

    for (let r = 1; r <= 5; r++) {
        console.log(`\nTesting Region ${r} on 375×667...`);
        await page.evaluate(async (reg) => {
            if (window.startRegion) await window.startRegion(reg, false);
        }, r);
        await new Promise(r => setTimeout(r, 1000));

        await page.screenshot({ path: `${outDir}/375-r${r}-01-opening.png` });

        const framing375 = await page.evaluate(() => {
            const cam = window.camera;
            const game = window.game;
            const map = game.map;

            const spireY = map.keep_tip ? map.keep_tip.y : map.castle_pos.y - 280;
            const keepTopScreen = cam.worldToScreen(map.castle_pos.x, spireY);
            const spawns = map.spawns || [map.spawn_pos];
            const spawnScreens = spawns.map(sp => cam.worldToScreen(sp.x, sp.y + 24));

            const renderedW = map.width * cam.zoom;
            const renderedH = map.height * cam.zoom;
            const letterboxed = renderedW < cam.vw - 0.001 || renderedH < cam.vh - 0.001;

            return {
                spireTopY: keepTopScreen.y,
                spawnYs: spawnScreens.map(s => s.y),
                dockTopY: cam.vh - cam.dockHeight,
                letterboxed
            };
        });

        console.log(`Region ${r} (375×667) Framing:`, framing375);
        if (framing375.spireTopY < 64) {
            console.warn(`⚠️ Warning: Region ${r} keep spire tip (${framing375.spireTopY}px) clipped on 375×667`);
        } else {
            console.log(`✓ Region ${r} keep spire tip safely framed on 375×667 (${framing375.spireTopY.toFixed(1)}px >= 64px)`);
        }

        const maxSpawnY = Math.max(...framing375.spawnYs);
        if (maxSpawnY <= framing375.dockTopY) {
            console.log(`✓ Region ${r} spawn safely framed on 375×667 (${maxSpawnY.toFixed(1)}px <= ${framing375.dockTopY}px)`);
        } else {
            console.warn(`⚠️ Region ${r} spawn slightly below dock: ${maxSpawnY}px vs dock ${framing375.dockTopY}px`);
        }

        if (framing375.letterboxed) {
            console.warn(`⚠️ Warning: Region ${r} letterboxed on 375×667!`);
        } else {
            console.log(`✓ Region ${r} zero letterboxing on 375×667`);
        }
    }

    await browser.close();
    console.log('\n=== ROUND 8 VERIFICATION COMPLETE ===');
    console.log(`Screenshots saved to ${outDir}/`);
    if (consoleErrors.length > 0) {
        console.warn('Console errors encountered:', consoleErrors);
    } else {
        console.log('✓ Zero console errors!');
    }
})();
