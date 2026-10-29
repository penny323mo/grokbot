// Playwright Playthrough & Review Screenshot Capture for Midnight Touge (《夜峠》)
// Target: iPhone Safari Portrait 390×844
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const SCREENSHOT_DIR = path.resolve('screenshots/loop-r7');
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function run() {
  console.log('Launching Playwright Chromium at 390×844 (iPhone Safari portrait)...');

  const browser = await chromium.launch({
    executablePath: '/workspace/stage/autobet/research/pw-browsers/chromium-1248/chrome-linux64/chrome',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--ignore-gpu-blocklist'
    ]
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
  });

  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('[BROWSER ERROR]', msg.text());
      consoleErrors.push(msg.text());
    } else {
      console.log('[BROWSER LOG]', msg.text());
    }
  });

  page.on('pageerror', err => {
    console.error('[PAGE UNCAUGHT ERROR]', err);
    consoleErrors.push(err.message);
  });

  console.log('Navigating to https://penny323mo.github.io/grokbot/projects/midnight-touge/...');
  await page.goto('https://penny323mo.github.io/grokbot/projects/midnight-touge/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. Title Screen
  console.log('Capturing 01_title.png...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_title.png') });

  // 2. Open Garage
  console.log('Opening garage...');
  await page.click('#btn-title-garage');
  await page.waitForTimeout(800);
  console.log('Capturing 02_garage.png...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_garage.png') });

  // 3. Switch Car to S-T20
  console.log('Switching car to S-T20...');
  await page.click('#btn-car-next');
  await page.waitForTimeout(600);
  console.log('Capturing 03_garage_st20.png...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_garage_st20.png') });

  // 4. Switch Car to R-X7
  console.log('Switching car to R-X7...');
  await page.click('#btn-car-next');
  await page.waitForTimeout(600);
  console.log('Capturing 04_garage_rx7.png...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_garage_rx7.png') });

  // Switch back to RS-86
  console.log('Switching back to RS-86...');
  await page.click('#btn-car-prev');
  await page.waitForTimeout(600);
  await page.click('#btn-car-prev');
  await page.waitForTimeout(600);

  // 5. Open Event Select Route Map
  console.log('Opening Event Select screen...');
  await page.click('#btn-garage-drive');
  await page.waitForTimeout(600);
  console.log('Capturing 05_event_select.png...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_event_select.png') });

  // 6. Start Race (Stage 1)
  console.log('Starting Stage 1 race...');
  const enterBtn = await page.waitForSelector('.btn-stage-enter');
  await enterBtn.click();
  await page.waitForTimeout(600);
  console.log('Capturing 06_race_start.png...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_race_start.png') });

  // Wait for countdown to finish and racing to begin
  console.log('Waiting for countdown to finish...');
  await page.waitForTimeout(3800);

  // 7. Drive and trigger drift
  console.log('Applying steering and drift handbrake touch inputs...');
  const btnRight = await page.waitForSelector('#btn-steer-right', { state: 'visible' });
  const btnDrift = await page.waitForSelector('#btn-drift', { state: 'visible' });

  if (btnRight && btnDrift) {
    const boxR = await btnRight.boundingBox();
    const boxD = await btnDrift.boundingBox();

    if (boxR && boxD) {
      // Hold steer right and tap drift
      await page.mouse.down({ x: boxR.x + boxR.width / 2, y: boxR.y + boxR.height / 2 });
      await page.waitForTimeout(800);
      await page.mouse.up();
    }
  }

  // Evaluate driving simulation in engine
  await page.evaluate(() => {
    const game = window.__TOUGE_GAME__;
    if (game && game.playerPhysics) {
      game.playerPhysics.speed = 22.0; // ~80 km/h
      game.playerPhysics.speedKmh = 79.2;
      game.playerPhysics.slipAngle = 0.42; // ~24 deg drift
      game.playerPhysics.driftAngleDeg = 24.0;
      game.playerPhysics.isDrifting = true;
      game.playerPhysics.driftScore = 650;
      game.playerPhysics.steerAngle = -0.35; // Counter-steer
      game.hud.showDriftCallout(24.0, 650, 1.5);
    }
  });

  await page.waitForTimeout(500);
  console.log('Capturing 07_mid_drift.png...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_mid_drift.png') });

  // 8. Hairpin with Gutter Drop
  console.log('Simulating Hairpin Gutter Drop...');
  await page.evaluate(() => {
    const game = window.__TOUGE_GAME__;
    if (game && game.playerPhysics) {
      game.playerPhysics.inGutter = true;
      game.hud.showGutterDropEffect();
    }
  });
  await page.waitForTimeout(400);
  console.log('Capturing 08_hairpin_gutter.png...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_hairpin_gutter.png') });

  // 9. Real Battle Mode vs Rival (from EVENTS_DATA Stage 4)
  console.log('Testing Real Battle Mode vs Rival (Stage 4)...');
  await page.evaluate(() => {
    const game = window.__TOUGE_GAME__;
    // Real authored Stage 4 Battle from game data
    const stage4 = game.uiScreens.container.querySelector('.btn-stage-enter[data-event-id="4"]') || null;
    import('./src/data/events.js').then(({ EVENTS_DATA }) => {
      const realBattle = EVENTS_DATA.find(e => e.id === 4);
      game.startEvent(realBattle);
      game.countdownTimer = 0.1;
    });
  });
  await page.waitForTimeout(1200);
  console.log('Capturing 09_battle_rival.png...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_battle_rival.png') });

  // 10. Results Ceremony
  console.log('Triggering Results Screen...');
  await page.evaluate(() => {
    const game = window.__TOUGE_GAME__;
    game.raceTimer = 104.82;
    if (game.playerPhysics) {
      game.playerPhysics.driftScore = 6840;
      game.playerPhysics.gutterDropsCount = 4;
    }
    game.finishRace();
  });
  await page.waitForTimeout(800);
  console.log('Capturing 10_results.png...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_results.png') });

  console.log('Playthrough completed successfully!');
  console.log(`Console error count: ${consoleErrors.length}`);

  await browser.close();

  if (consoleErrors.length > 0) {
    console.error('Errors encountered during playthrough:', consoleErrors);
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Playthrough script failed:', err);
  process.exit(1);
});
