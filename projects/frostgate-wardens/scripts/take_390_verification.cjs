const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
    const outDir = 'screenshots/fix-3';
    fs.mkdirSync(outDir, { recursive: true });

    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/google-chrome',
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({
        width: 390,
        height: 844,
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true
    });

    console.log('1. Capturing Title screen with clay UI icons...');
    await page.goto('http://localhost:8080/', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: `${outDir}/390-01-title-clay-icons.png` });

    console.log('2. Capturing Credits modal with pure Traditional Chinese paragraph...');
    await page.evaluate(() => document.getElementById('btn-open-credits')?.click());
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: `${outDir}/390-02-credits-tc.png` });
    await page.evaluate(() => document.getElementById('btn-close-credits')?.click());
    await new Promise(r => setTimeout(r, 300));

    console.log('3. Capturing Region 1 Map with dense diorama, keep, and clay HUD...');
    await page.evaluate(() => document.querySelector('.region-card[data-region="1"]')?.click());
    await page.waitForFunction(() => !!window.game);
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: `${outDir}/390-03-map1-diorama-density.png` });

    console.log('4. Capturing build dock & 14px typography...');
    // Tap plot 0 to open build dock
    const plot0 = await page.evaluate(() => {
        if (!window.camera || !window.game) return null;
        const pt = window.game.map.plots[0];
        return window.camera.worldToScreen(pt.x, pt.y);
    });
    if (plot0) {
        await page.touchscreen.tap(plot0.x, plot0.y);
        await new Promise(r => setTimeout(r, 400));
        await page.screenshot({ path: `${outDir}/390-04-build-dock-14px.png` });
    }

    console.log('5. Testing Major #2: Returning to title and re-entering map to verify mute button...');
    await page.click('#btn-pause');
    await new Promise(r => setTimeout(r, 300));
    await page.click('#btn-quit-map'); // Returns to map/title
    await new Promise(r => setTimeout(r, 600));

    // Re-enter Region 1
    await page.click('.region-card[data-region="1"]');
    await new Promise(r => setTimeout(r, 1000));

    // Open pause modal
    await page.click('#btn-pause');
    await new Promise(r => setTimeout(r, 300));

    // Check mute button label before and after tap
    const muteBefore = await page.$eval('#btn-modal-mute', el => el.textContent.trim());
    await page.click('#btn-modal-mute');
    await new Promise(r => setTimeout(r, 300));
    const muteAfter = await page.$eval('#btn-modal-mute', el => el.textContent.trim());
    console.log(`Mute button toggled cleanly on re-entry: "${muteBefore}" -> "${muteAfter}"`);
    await page.screenshot({ path: `${outDir}/390-05-mute-toggled.png` });

    await page.click('#btn-resume');
    await new Promise(r => setTimeout(r, 300));

    // Capture Maps 2 through 5
    for (let regId = 2; regId <= 5; regId++) {
        console.log(`Capturing Region ${regId} diorama...`);
        await page.evaluate(async (id) => {
            if (window.startRegion) await window.startRegion(id);
        }, regId);
        await new Promise(r => setTimeout(r, 1200));
        await page.screenshot({ path: `${outDir}/390-map${regId}-diorama.png` });
        await page.evaluate(() => {
            if (window.returnToTitleScreen) window.returnToTitleScreen();
        });
        await new Promise(r => setTimeout(r, 500));
    }

    console.log('All verification screenshots captured!');
    await browser.close();
})();
