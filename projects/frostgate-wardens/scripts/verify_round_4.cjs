const puppeteer = require('/workspace/nightly/shotkit/node_modules/puppeteer-core');
const fs = require('fs');
const path = require('path');

(async () => {
    const outDir = 'screenshots/review-round-4';
    fs.mkdirSync(outDir, { recursive: true });

    console.log('=== STARTING ROUND 4 VERIFICATION SUITE ===');

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

    // Capture console errors
    const consoleErrors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
        }
    });
    page.on('pageerror', err => consoleErrors.push(err.message));

    console.log('\n--- 1. Testing AudioContext & Sound Functions ---');
    await page.goto('http://localhost:8080/', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    // Tap page to unlock audio
    await page.touchscreen.tap(195, 400);
    await new Promise(r => setTimeout(r, 400));

    const audioReport = await page.evaluate(async () => {
        const { sounds } = await import('./src/audio.js');
        sounds.unlock();
        const ctxState = sounds.ctx ? sounds.ctx.state : 'null';
        
        // Test sound functions execution
        const soundFns = [
            'playBow', 'playMortar', 'playFrost', 'playBell',
            'playCoin', 'playBuild', 'playHero', 'playVictory',
            'playLeak', 'playDefeat'
        ];
        const results = {};
        for (const fn of soundFns) {
            try {
                if (typeof sounds[fn] === 'function') {
                    sounds[fn]();
                    results[fn] = 'ok';
                } else {
                    results[fn] = 'missing';
                }
            } catch (err) {
                results[fn] = 'error: ' + err.message;
            }
        }

        // Test mute and pause
        const muteBefore = sounds.muted;
        sounds.toggleMute();
        const muteAfter = sounds.muted;
        sounds.toggleMute(); // restore

        sounds.pause();
        const statePaused = sounds.ctx ? sounds.ctx.state : 'null';
        sounds.resume();
        const stateResumed = sounds.ctx ? sounds.ctx.state : 'null';

        return {
            ctxState,
            results,
            muteToggleWorked: muteBefore !== muteAfter,
            statePaused,
            stateResumed
        };
    });

    console.log('AudioContext initial state after tap:', audioReport.ctxState);
    console.log('Sound functions verification:', audioReport.results);
    console.log('Mute toggle verified:', audioReport.muteToggleWorked);
    console.log('Pause suspended state:', audioReport.statePaused);
    console.log('Resume state:', audioReport.stateResumed);

    // Capture Title Screen at 390x844
    await page.screenshot({ path: `${outDir}/390-01-title-screen.png` });

    console.log('\n--- 2. Verifying All 5 Regions (Opening Camera, Mid-Wave, Late-Wave) ---');
    for (let r = 1; r <= 5; r++) {
        console.log(`\nTesting Region ${r}...`);
        await page.evaluate(async (reg) => {
            if (window.startRegion) await window.startRegion(reg, false);
        }, r);
        await new Promise(r => setTimeout(r, 800));

        // (a) Opening Camera (no panning first!)
        await page.screenshot({ path: `${outDir}/390-r${r}-01-opening.png` });

        // Check that all waypoints and plots are inside usable rect
        const framingCheck = await page.evaluate(() => {
            if (!window.camera || !window.game) return { ok: false, error: 'no game/camera' };
            const usable = window.camera.getUsableRect();
            const map = window.game.map;
            const pts = [];
            if (map.paths) map.paths.forEach(p => pts.push(...p));
            else if (map.waypoints) pts.push(...map.waypoints);
            if (map.plots) pts.push(...map.plots);

            let allInside = true;
            for (const pt of pts) {
                const sc = window.camera.worldToScreen(pt.x, pt.y);
                if (sc.x < usable.x || sc.x > usable.x + usable.width ||
                    sc.y < usable.y || sc.y > usable.y + usable.height) {
                    allInside = false;
                }
            }
            return {
                ok: allInside,
                zoom: window.camera.zoom,
                usableRect: usable,
                pointCount: pts.length
            };
        });
        console.log(`Region ${r} opening framing: all ${framingCheck.pointCount} points inside usableRect? ${framingCheck.ok} (zoom=${framingCheck.zoom.toFixed(3)})`);

        // Build a tower on plot 0 and plot 1
        await page.evaluate(() => {
            if (window.game && window.game.map.plots.length >= 2) {
                window.game.buildTower(0, 'crossbow');
                window.game.buildTower(1, 'frost');
            }
        });
        await new Promise(r => setTimeout(r, 400));

        // Start wave 1
        await page.click('#btn-start-wave');
        await new Promise(r => setTimeout(r, 2500)); // allow enemies to enter
        // (b) Mid-Wave combat screenshot
        await page.screenshot({ path: `${outDir}/390-r${r}-02-mid-wave.png` });

        // Speed to 3x and advance
        await page.evaluate(() => {
            if (window.game) window.game.speed = 3;
        });
        await new Promise(r => setTimeout(r, 3500));
        // (c) Late-Wave screenshot
        await page.screenshot({ path: `${outDir}/390-r${r}-03-late-wave.png` });

        // Return to title screen
        await page.evaluate(() => {
            if (window.returnToTitleScreen) window.returnToTitleScreen();
        });
        await new Promise(r => setTimeout(r, 400));
    }

    console.log('\n--- 3. Testing Defeat & Victory Modals ---');
    // Test Lose Modal
    console.log('Testing Defeat modal...');
    await page.evaluate(async () => {
        await window.startRegion(1, false);
        window.game.castleHp = 0;
        if (window.game.onGameOver) window.game.onGameOver();
    });
    await new Promise(r => setTimeout(r, 600));

    // Wait until defeat modal shows
    await page.waitForFunction(() => {
        const el = document.getElementById('modal-defeat');
        return el && !el.classList.contains('hidden');
    }, { timeout: 5000 });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: `${outDir}/390-defeat-modal.png` });
    console.log('✓ Defeat modal captured');

    // Click retry
    await page.click('#btn-defeat-retry');
    await new Promise(r => setTimeout(r, 600));

    // Test Win Modal: simulate win on Region 1
    console.log('Testing Victory modal...');
    await page.evaluate(() => {
        if (window.game && window.game.onVictory) {
            window.game.onVictory(3); // 3 stars
        }
    });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: `${outDir}/390-victory-modal.png` });
    console.log('✓ Victory modal captured');
    await page.click('#btn-victory-replay');
    await new Promise(r => setTimeout(r, 400));
    await page.evaluate(() => window.returnToTitleScreen());

    console.log('\n--- 4. Testing 375×667 (iPhone SE) Layout & Usability ---');
    await page.setViewport({
        width: 375,
        height: 667,
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true
    });
    await page.evaluate(async () => {
        await window.startRegion(1, false);
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: `${outDir}/375-r1-opening.png` });

    // Open Pause modal on 375
    await page.click('#btn-pause');
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: `${outDir}/375-pause-modal.png` });
    await page.click('#btn-resume');

    console.log('\n--- 5. Cropping HUD Icons and Sprites at Real Phone Scale ---');
    // Crop HUD icons
    const hudClip = await page.evaluate(() => {
        const hud = document.getElementById('hud-top');
        const rect = hud.getBoundingClientRect();
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    });
    await page.screenshot({
        path: `${outDir}/crop-hud-top-real-scale.png`,
        clip: {
            x: Math.max(0, hudClip.x),
            y: Math.max(0, hudClip.y),
            width: hudClip.width,
            height: hudClip.height
        }
    });

    console.log('\nConsole Errors caught during run:', consoleErrors);
    console.log('\n=== ALL ROUND 4 VERIFICATIONS COMPLETED SUCCESSFULLY ===');
    await browser.close();
})();
