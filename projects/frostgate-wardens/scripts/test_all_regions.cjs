const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
    fs.mkdirSync('screenshots/phase3', { recursive: true });
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

    console.log('Navigating to game...');
    await page.goto('http://localhost:8080/', { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1200));

    // Unlock all regions in localStorage for visual testing
    await page.evaluate(() => {
        const save = {
            unlockedRegions: [1, 2, 3, 4, 5],
            stars: { 1: 3, 2: 3, 3: 2, 4: 1, 5: 0 },
            bestEndlessWave: 18,
            tutorialCompleted: true,
            speed: 1,
            muted: false
        };
        localStorage.setItem('frostgate_wardens_save', JSON.stringify(save));
    });
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));

    // Title screen with unlocked regions
    await page.screenshot({ path: 'screenshots/phase3/01_title_all_unlocked.png' });
    console.log('Captured 01_title_all_unlocked.png');

    // Test Credits modal
    await page.click('#btn-open-credits');
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: 'screenshots/phase3/02_credits_modal.png' });
    console.log('Captured 02_credits_modal.png');
    await page.click('#btn-close-credits');
    await new Promise(r => setTimeout(r, 300));

    // Test Region 2: 凍湖
    await page.click('.region-card[data-region="2"]');
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: 'screenshots/phase3/03_region2_lake.png' });
    console.log('Captured 03_region2_lake.png');

    // Return to title
    await page.click('#btn-pause');
    await new Promise(r => setTimeout(r, 400));
    await page.click('#btn-quit-map');
    await new Promise(r => setTimeout(r, 800));

    // Test Region 3: 杉林
    await page.click('.region-card[data-region="3"]');
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: 'screenshots/phase3/04_region3_forest.png' });
    console.log('Captured 04_region3_forest.png');

    // Return to title
    await page.click('#btn-pause');
    await new Promise(r => setTimeout(r, 400));
    await page.click('#btn-quit-map');
    await new Promise(r => setTimeout(r, 800));

    // Test Region 4: 焰口邊境
    await page.click('.region-card[data-region="4"]');
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: 'screenshots/phase3/05_region4_volcano.png' });
    console.log('Captured 05_region4_volcano.png');

    // Return to title
    await page.click('#btn-pause');
    await new Promise(r => setTimeout(r, 400));
    await page.click('#btn-quit-map');
    await new Promise(r => setTimeout(r, 800));

    // Test Region 5: 北辰堡
    await page.click('.region-card[data-region="5"]');
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: 'screenshots/phase3/06_region5_citadel.png' });
    console.log('Captured 06_region5_citadel.png');

    // Test Endless mode
    await page.click('#btn-pause');
    await new Promise(r => setTimeout(r, 400));
    await page.click('#btn-quit-map');
    await new Promise(r => setTimeout(r, 800));

    await page.click('#btn-endless-mode');
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: 'screenshots/phase3/07_endless_mode.png' });
    console.log('Captured 07_endless_mode.png');

    console.log('Phase 3 Errors:', JSON.stringify(errors, null, 2));
    await browser.close();
    process.exit(errors.length > 0 ? 1 : 0);
})();
