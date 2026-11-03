const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
    fs.mkdirSync('screenshots/phase2', { recursive: true });
    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/google-chrome',
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

    const errors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', err => errors.push('PAGEERROR: ' + err.message));
    page.on('response', res => {
        if (res.status() >= 400) errors.push(`HTTP ${res.status()}: ${res.url()}`);
    });

    console.log('Navigating to http://localhost:8080/ ...');
    await page.goto('http://localhost:8080/', { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));

    // 1. Title screen screenshot
    await page.screenshot({ path: 'screenshots/phase2/01_title_screen.png' });
    console.log('Captured 01_title_screen.png');

    // 2. Click Region 1 card
    await page.click('.region-card[data-region="1"]');
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: 'screenshots/phase2/02_battlefield.png' });
    console.log('Captured 02_battlefield.png');

    // 3. Tap Plot 0 (at screen coordinates roughly corresponding to plot 0)
    // Let's use page.evaluate to find plot 0 screen position and tap it
    const plotPos = await page.evaluate(() => {
        if (!window.camera) return null;
        const p0 = { x: 317, y: 1361 };
        return window.camera.worldToScreen(p0.x, p0.y);
    });

    console.log('Plot 0 screen pos:', plotPos);
    if (plotPos) {
        await page.mouse.click(plotPos.x, plotPos.y);
        await new Promise(r => setTimeout(r, 500));
        await page.screenshot({ path: 'screenshots/phase2/03_build_dock.png' });
        console.log('Captured 03_build_dock.png');

        // Click 建造
        await page.click('#btn-confirm-build');
        await new Promise(r => setTimeout(r, 500));
        await page.screenshot({ path: 'screenshots/phase2/04_built_crossbow.png' });
        console.log('Captured 04_built_crossbow.png');
    }

    // 4. Click 開始波次
    await page.click('#btn-start-wave');
    console.log('Clicked 開始波次');
    await new Promise(r => setTimeout(r, 3500));
    await page.screenshot({ path: 'screenshots/phase2/05_wave_running.png' });
    console.log('Captured 05_wave_running.png');

    // 5. Test speed toggle
    await page.click('#btn-speed');
    await new Promise(r => setTimeout(r, 500));

    // 6. Test Hero Ability (暴雪)
    await page.click('#btn-ab-blizzard');
    await new Promise(r => setTimeout(r, 500));
    // Click on road
    if (plotPos) {
        await page.mouse.click(plotPos.x, plotPos.y);
        await new Promise(r => setTimeout(r, 300));
        await page.click('#btn-confirm-ability');
        await new Promise(r => setTimeout(r, 1000));
        await page.screenshot({ path: 'screenshots/phase2/06_blizzard_cast.png' });
        console.log('Captured 06_blizzard_cast.png');
    }

    console.log('Errors encountered:', JSON.stringify(errors, null, 2));
    await browser.close();
    process.exit(errors.length > 0 ? 1 : 0);
})();
