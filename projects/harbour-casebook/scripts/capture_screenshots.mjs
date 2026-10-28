import puppeteer from '/workspace/nightly/shotkit/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
import fs from 'fs';
import path from 'path';

const SCREENSHOTS_DIR = '/workspace/nightly/2026-10-28-harbour-casebook/screenshots';
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

async function run() {
  console.log('Launching Chrome for 390px screenshots...');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--hide-scrollbars'],
    defaultViewport: {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true
    }
  });

  const page = await browser.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err.message));

  console.log('Navigating to http://127.0.0.1:8899/index.html ...');
  await page.goto('http://127.0.0.1:8899/index.html', { waitUntil: 'networkidle0' });

  // 1. Title Screen
  console.log('1. Capturing title screen...');
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_title.png') });

  // 2. Case Board
  console.log('2. Navigating to Case Board...');
  await page.click('#btn-view-board');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_case_board.png') });

  // 3. Scene View (Case 1)
  console.log('3. Opening Case 1 Scene...');
  await page.click('.case-dossier-card[data-case-id="1"] .btn-open-case');
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_scene.png') });

  // 3b. Scene View (Case 2)
  console.log('3b. Capturing Case 2 Scene...');
  await page.evaluate(() => { window.app.openCase(2); });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03b_scene_case2.png') });

  // 3c. Scene View (Case 3)
  console.log('3c. Capturing Case 3 Scene...');
  await page.evaluate(() => { window.app.openCase(3); });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03c_scene_case3.png') });

  // 3d. Scene View (Case 4)
  console.log('3d. Capturing Case 4 Scene...');
  await page.evaluate(() => { window.app.openCase(4); });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03d_scene_case4.png') });

  // Return to Case 1
  await page.evaluate(() => { window.app.openCase(1); });
  await new Promise(r => setTimeout(r, 600));

  // 4. Bottom Sheet with underlined words
  console.log('4. Tapping a hotspot to open Bottom Sheet...');
  const marker = await page.$('.hotspot-marker[data-hotspot-id="c1_victim"]');
  if (marker) {
    await marker.click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_bottom_sheet.png') });

    // Collect the words in the hotspot
    const chips = await page.$$('.sheet-description .word-chip');
    for (const chip of chips) {
      await chip.click();
      await new Promise(r => setTimeout(r, 200));
    }

    // Close bottom sheet
    await page.click('.sheet-close-btn');
    await new Promise(r => setTimeout(r, 400));
  }

  // Collect other hotspots for Case 1 so player has all needed words
  console.log('Collecting other words for notebook and deduction...');
  await page.evaluate(() => {
    const c1 = window.app.cases[0];
    c1.hotspots.forEach(h => {
      const regex = /data-word="([^"]+)"/g;
      let m;
      while ((m = regex.exec(h.desc)) !== null) {
        window.app.storage.collectWord(1, m[1]);
      }
      window.app.storage.markHotspotDiscovered(1, h.id);
    });
  });

  // 5. Notebook Tab
  console.log('5. Navigating to Notebook tab...');
  await page.click('.nav-tab-btn[data-tab="notebook"]');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_notebook.png') });

  // 6. Deduction Sheet (Clean initial state with Who's Who matching and button chips)
  console.log('6. Navigating to Deduction Sheet tab...');
  await page.click('.nav-tab-btn[data-tab="deduction"]');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06_deduction_sheet.png') });

  // 7. Fill deduction slots and Who's Who, then check solution
  console.log('7. Filling deduction slots and checking solution...');
  await page.evaluate(() => {
    const app = window.app;
    // Set Who's Who guesses
    app.storage.setWhoGuess(1, 'chan_tak_sang', '陳德生');
    app.storage.setWhoGuess(1, 'ho_bing', '何炳');
    app.storage.setWhoGuess(1, 'leung_ah_sei', '梁阿四');
    app.storage.setWhoGuess(1, 'pak_lan', '白蘭');

    // Set Section 1
    app.storage.setSlotValue(1, 'c1_s1', 'victim', '陳德生');
    app.storage.setSlotValue(1, 'c1_s1', 'scene', '當舖庫房');
    app.storage.setSlotValue(1, 'c1_s1', 'weapon', '紅木算盤');

    // Set Section 2
    app.storage.setSlotValue(1, 'c1_s2', 'culprit', '何炳');
    app.storage.setSlotValue(1, 'c1_s2', 'motive', '償還巨額賭債');
    app.storage.setSlotValue(1, 'c1_s2', 'treasure', '翡翠玉鐲');
    app.storage.setSlotValue(1, 'c1_s2', 'accomplice', '白蘭');

    // Complete onboarding step 3 on filling slots
    app.advanceOnboarding(3);

    app.deductionSheet.render(app.cases[0]);
  });
  await new Promise(r => setTimeout(r, 500));

  // Click check on Who's Who
  const checkWhoBtn = await page.$('#btn-check-who, #btn-check-whos-who, .btn-check-who');
  if (checkWhoBtn) {
    await checkWhoBtn.click();
    await new Promise(r => setTimeout(r, 600));
  }

  // Click check on section 1 and section 2
  const checkBtns = await page.$$('.btn-check-section');
  for (const b of checkBtns) {
    await b.click();
    await new Promise(r => setTimeout(r, 500));
  }

  // Scroll to resolution zone to show the red 結案 seal
  await page.evaluate(() => {
    const zone = document.querySelector('.case-resolution-zone');
    if (zone) zone.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 600));
  console.log('Capturing solved stamp...');
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07_solved_stamp.png') });

  // 8. Epilogue Modal
  console.log('8. Opening Epilogue Modal...');
  await page.evaluate(() => {
    const btn = document.getElementById('btn-open-epilogue');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08_epilogue.png') });

  console.log('All screenshots captured successfully in', SCREENSHOTS_DIR);
  await browser.close();
}

run().catch(err => {
  console.error('Screenshot script failed:', err);
  process.exit(1);
});
