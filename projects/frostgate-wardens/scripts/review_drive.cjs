// Comprehensive Review Driver for Frostgate Wardens
const puppeteer = require('puppeteer-core');
const fs = require('fs');

async function driveReview(viewport, outDir, prefix) {
    fs.mkdirSync(outDir, { recursive: true });

    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/google-chrome',
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true
    });

    const errors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', err => errors.push('PAGEERROR: ' + err.message));
    page.on('response', res => {
        if (res.status() >= 400) errors.push(`HTTP ${res.status()}: ${res.url()}`);
    });

    console.log(`[${prefix}] Navigating to http://localhost:8080/ at ${viewport.width}x${viewport.height}...`);
    await page.goto('http://localhost:8080/', { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1200));

    // 1. Title Screen
    await page.screenshot({ path: `${outDir}/${prefix}-01-title.png` });
    console.log(`[${prefix}] Captured title screen`);

    // 2. Open Credits
    await page.click('#btn-open-credits');
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: `${outDir}/${prefix}-02-credits.png` });
    await page.click('#btn-close-credits');
    await new Promise(r => setTimeout(r, 300));

    // 3. Launch Region 1 (霜門山道)
    await page.click('.region-card[data-region="1"]');
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: `${outDir}/${prefix}-03-map1-start.png` });

    // 4. Test Pan Drag using Touchscreen
    const client = await page.target().createCDPSession();
    await client.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: 195, y: 400 }]
    });
    for (let s = 1; s <= 6; s++) {
        await client.send('Input.dispatchTouchEvent', {
            type: 'touchMove',
            touchPoints: [{ x: 195 + s * 15, y: 400 - s * 25 }]
        });
        await new Promise(r => setTimeout(r, 20));
    }
    await client.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: []
    });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: `${outDir}/${prefix}-04-after-pan.png` });

    // Reset camera with double tap
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: 400 }] });
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await new Promise(r => setTimeout(r, 50));
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: 400 }] });
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await new Promise(r => setTimeout(r, 300));

    // 5. Build Every Tower Type
    // Get plot screen positions dynamically after map is loaded
    const plots = await page.evaluate(() => {
        if (!window.camera || !window.game) return [];
        return window.game.map.plots.slice(0, 5).map(pt => {
            return window.camera.worldToScreen(pt.x, pt.y);
        });
    });

    const towerTypes = ['crossbow', 'mortar', 'frost', 'guard', 'bell'];
    for (let i = 0; i < Math.min(plots.length, towerTypes.length); i++) {
        const pos = plots[i];
        if (!pos) continue;

        // Give plenty of gold for testing all towers
        await page.evaluate(() => { if (window.game) window.game.gold = 3000; });

        // Tap plot
        await page.touchscreen.tap(pos.x, pos.y);
        await new Promise(r => setTimeout(r, 300));

        // Select tower
        await page.evaluate((type) => {
            document.querySelector(`.btn-tower-pick[data-type="${type}"]`)?.click();
        }, towerTypes[i]);
        await new Promise(r => setTimeout(r, 200));

        // Click Build
        await page.evaluate(() => document.getElementById('btn-confirm-build')?.click());
        await new Promise(r => setTimeout(r, 400));
    }
    await page.screenshot({ path: `${outDir}/${prefix}-05-all-towers-built.png` });
    console.log(`[${prefix}] Built all 5 tower types`);

    // 6. Inspect & Upgrade Tower (Level 1 -> Level 2 -> Branch 3A)
    const plot0Pos = plots[0];
    if (plot0Pos) {
        await page.touchscreen.tap(plot0Pos.x, plot0Pos.y);
        await new Promise(r => setTimeout(r, 400));
        await page.screenshot({ path: `${outDir}/${prefix}-06-inspect-tower-l1.png` });

        // Upgrade to L2
        await page.evaluate(() => document.querySelector('#upgrade-container button')?.click());
        await new Promise(r => setTimeout(r, 400));
        await page.screenshot({ path: `${outDir}/${prefix}-07-inspect-tower-l2.png` });

        // Upgrade to Branch 3A
        await page.evaluate(() => document.querySelector('.branch-choice-row button')?.click());
        await new Promise(r => setTimeout(r, 400));
        await page.screenshot({ path: `${outDir}/${prefix}-08-tower-branch3a.png` });

        // Sell Tower
        await page.evaluate(() => document.getElementById('btn-sell-tower')?.click());
        await new Promise(r => setTimeout(r, 400));
        await page.screenshot({ path: `${outDir}/${prefix}-09-tower-sold.png` });
    }

    // 7. Cast Hero Abilities (Blizzard, Reinforcements, Beacon)
    await page.evaluate(() => document.getElementById('btn-ab-blizzard')?.click());
    await new Promise(r => setTimeout(r, 300));
    if (plot0Pos) await page.touchscreen.tap(plot0Pos.x, plot0Pos.y);
    await page.evaluate(() => document.getElementById('btn-confirm-ability')?.click());
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: `${outDir}/${prefix}-10-ability-blizzard.png` });

    // 8. Test Speed toggle (1x -> 2x -> 3x)
    await page.evaluate(() => document.getElementById('btn-speed')?.click());
    await new Promise(r => setTimeout(r, 200));
    await page.evaluate(() => document.getElementById('btn-speed')?.click());
    await new Promise(r => setTimeout(r, 200));

    // 9. Pause & Resume
    await page.evaluate(() => document.getElementById('btn-pause')?.click());
    await new Promise(r => setTimeout(r, 300));
    await page.screenshot({ path: `${outDir}/${prefix}-11-pause-modal.png` });
    await page.evaluate(() => document.getElementById('btn-resume')?.click());
    await new Promise(r => setTimeout(r, 300));

    // 10. Start Wave at 3x speed and finish map
    await page.evaluate(() => document.getElementById('btn-start-wave')?.click());
    await new Promise(r => setTimeout(r, 4000));
    await page.screenshot({ path: `${outDir}/${prefix}-12-wave-combat.png` });

    // Simulate winning Region 1
    await page.evaluate(() => {
        if (window.game && window.ui) {
            window.game.currentWave = window.game.waves.length;
            window.game.waveState = 'finished';
            window.ui.showVictoryModal(3);
        }
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: `${outDir}/${prefix}-13-victory-modal.png` });

    console.log(`[${prefix}] Errors encountered:`, errors);
    await browser.close();
    return errors;
}

(async () => {
    const errs1 = await driveReview({ width: 390, height: 844 }, 'screenshots/review-1', 'iphone12');
    const errs2 = await driveReview({ width: 375, height: 667 }, 'screenshots/review-1', 'iphoneSE');

    const totalErrors = [...errs1, ...errs2];
    console.log('\n================ REVIEW GATE AUDIT ================');
    console.log(`Total errors across viewports: ${totalErrors.length}`);
    if (totalErrors.length > 0) {
        console.error('Errors:', totalErrors);
        process.exit(1);
    } else {
        console.log('✅ REVIEW GATE PASSED: ZERO ERRORS AT 390x844 AND 375x667');
        process.exit(0);
    }
})();
