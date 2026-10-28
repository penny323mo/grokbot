import puppeteer from '/workspace/nightly/shotkit/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
import fs from 'fs';
import path from 'path';

const SCREENSHOTS_DIR = '/workspace/nightly/2026-10-28-harbour-casebook/screenshots';
const ORCH_DIR = path.join(SCREENSHOTS_DIR, 'orch');
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
fs.mkdirSync(ORCH_DIR, { recursive: true });

async function run() {
  console.log('Launching Chrome for 390x844 diegetic screenshots...');
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

  // 1. Title Screen (Full-bleed key art, soft scrim, NO solid beige title box)
  console.log('1. Capturing title screen...');
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_title.png') });

  // 2. Start Game -> Desk Hub
  console.log('2. Clicking 「開始調查」 -> Navigating to Diegetic Desk Hub...');
  await page.click('#btn-start-game');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_desk_hub.png') });

  // Also copy desk hub screenshot as orchestrator showcase
  fs.copyFileSync(
    path.join(SCREENSHOTS_DIR, '02_desk_hub.png'),
    path.join(ORCH_DIR, 'live-390.png')
  );
  fs.copyFileSync(
    path.join(SCREENSHOTS_DIR, '02_desk_hub.png'),
    path.join(ORCH_DIR, 'live-390-full.png')
  );

  // 3. Desk Hub -> Case 1 Scene (Tap Casebook left page or Magnifier)
  console.log('3. Tapping Casebook -> Opening Case 1 Scene...');
  await page.click('#prop-casebook');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_scene.png') });

  // 4. Tap victim hotspot to inspect Clue Bottom Sheet
  console.log('4. Tapping victim hotspot to open Bottom Sheet...');
  const marker = await page.$('.hotspot-marker[data-hotspot-id="c1_victim"]');
  if (marker) {
    await marker.click();
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_bottom_sheet.png') });

    // Collect words in the sheet
    const chips = await page.$$('.sheet-description .word-chip');
    for (const chip of chips) {
      await chip.click();
      await new Promise(r => setTimeout(r, 150));
    }

    // Close bottom sheet
    await page.click('.sheet-close-btn');
    await new Promise(r => setTimeout(r, 350));
  }

  // Collect all words for Case 1
  console.log('Collecting remaining words for Case 1...');
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

  // Return to desk hub
  await page.click('#btn-scene-back-desk');
  await new Promise(r => setTimeout(r, 500));

  // 5. Desk Hub -> Corkboard Who's Who (Tap Corkboard on left wall)
  console.log('5. Tapping Corkboard -> Opening Who\'s Who Screen...');
  await page.click('#prop-corkboard');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_corkboard.png') });

  // Return to desk hub
  await page.click('#btn-cork-back-desk');
  await new Promise(r => setTimeout(r, 500));

  // 6. Desk Hub -> Notebook (Tap Leather Notebook at bottom-left)
  console.log('6. Tapping Notebook -> Opening Word Bank Folio...');
  await page.click('#prop-notebook');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06_notebook.png') });
  fs.copyFileSync(path.join(SCREENSHOTS_DIR, '06_notebook.png'), path.join(SCREENSHOTS_DIR, '05_notebook.png'));

  // Return to desk hub
  await page.click('#btn-notebook-back-desk');
  await new Promise(r => setTimeout(r, 500));

  // 7. Desk Hub -> Deduction Police Report (Tap Center book right page)
  console.log('7. Tapping Deduction -> Opening Police Report Form...');
  await page.click('#prop-deduction');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07_deduction_sheet.png') });
  fs.copyFileSync(path.join(SCREENSHOTS_DIR, '07_deduction_sheet.png'), path.join(SCREENSHOTS_DIR, '06_deduction_sheet.png'));

  // 8. Fill deduction slots and Who's Who, then check solution
  console.log('8. Filling deduction slots and checking solution...');
  await page.evaluate(() => {
    const app = window.app;
    // Set Who's Who guesses
    app.storage.setWhoGuess(1, 'chan_tak_sang', '陳德生');
    app.storage.setWhoGuess(1, 'ho_bing', '何炳');
    app.storage.setWhoGuess(1, 'leung_ah_sei', '梁阿四');
    app.storage.setWhoGuess(1, 'pak_lan', '白蘭');
    app.storage.setWhoSolved(1, true);

    // Set Section 1
    app.storage.setSlotValue(1, 'c1_s1', 'victim', '陳德生');
    app.storage.setSlotValue(1, 'c1_s1', 'scene', '當舖庫房');
    app.storage.setSlotValue(1, 'c1_s1', 'weapon', '紅木算盤');

    // Set Section 2
    app.storage.setSlotValue(1, 'c1_s2', 'culprit', '何炳');
    app.storage.setSlotValue(1, 'c1_s2', 'motive', '償還巨額賭債');
    app.storage.setSlotValue(1, 'c1_s2', 'treasure', '翡翠玉鐲');
    app.storage.setSlotValue(1, 'c1_s2', 'accomplice', '白蘭');

    app.advanceOnboarding(3);
    app.deductionSheet.render(app.cases[0]);
  });
  await new Promise(r => setTimeout(r, 500));

  // Click check on section 1 and section 2
  const checkBtns = await page.$$('.btn-check-section');
  for (const b of checkBtns) {
    await b.click();
    await new Promise(r => setTimeout(r, 400));
  }

  // Scroll to resolution zone to show the red 結案 seal
  await page.evaluate(() => {
    const scrollArea = document.querySelector('.deduction-scroll-area');
    if (scrollArea) {
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }
  });
  await new Promise(r => setTimeout(r, 600));
  console.log('Capturing solved stamp...');
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08_solved_stamp.png') });
  fs.copyFileSync(path.join(SCREENSHOTS_DIR, '08_solved_stamp.png'), path.join(SCREENSHOTS_DIR, '07_solved_stamp.png'));

  // 9. Epilogue Modal
  console.log('9. Opening Epilogue Modal...');
  await page.evaluate(() => {
    const btn = document.getElementById('btn-open-epilogue');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '09_epilogue.png') });
  fs.copyFileSync(path.join(SCREENSHOTS_DIR, '09_epilogue.png'), path.join(SCREENSHOTS_DIR, '08_epilogue.png'));

  // Close epilogue and return to desk
  await page.evaluate(() => {
    window.app.epilogueModal.hide();
    window.app.openDeskHub();
  });
  await new Promise(r => setTimeout(r, 500));

  // 10. Desk Hub -> Phone Menu (Tap Rotary Phone at right)
  console.log('10. Tapping Phone -> Opening Rotary Phone Dispatch & Settings...');
  await page.click('#prop-phone');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '10_phone_menu.png') });

  // Return to desk hub
  await page.click('#btn-menu-back-desk');
  await new Promise(r => setTimeout(r, 500));

  // 11. Desk Hub -> Case Board (Tap Directory Folder at top right)
  console.log('11. Opening Secondary Dossier Directory (Case Board)...');
  await page.click('#btn-desk-open-board');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '11_case_board.png') });

  console.log('All 11 diegetic screenshots captured successfully in', SCREENSHOTS_DIR);
  await browser.close();
}

run().catch(err => {
  console.error('Screenshot script failed:', err);
  process.exit(1);
});
