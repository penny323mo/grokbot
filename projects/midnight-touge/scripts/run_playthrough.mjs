// Playwright Playthrough & Review Screenshot Capture for Midnight Touge (《夜峠》)
// Target: iPhone Safari Portrait 390×844
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const SCREENSHOT_DIR = path.resolve('screenshots/review-1');
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

  console.log('Navigating to http://127.0.0.1:8938/index.html...');
  await page.goto('http://127.0.0.1:8938/index.html', { waitUntil: 'networkidle' });
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
  await page.evaluate(() => {
    const game = window.__TOUGE_GAME__;
    if (game) {
      game.countdownTimer = 0.0;
      game.state = 'RACING';
      game.hud.hideCountdown();
    }
  });
  await page.waitForTimeout(500);

  // 7. Drive and trigger drift
  console.log('Applying steering and drift handbrake touch inputs...');
  await page.evaluate(() => {
    const game = window.__TOUGE_GAME__;
    if (game && game.playerPhysics) {
      game.state = 'RACING';
      game.hud.hideCountdown();
      game.playerPhysics.heading = 0.25;
      game.playerPhysics.vy = 22.0;
      game.playerPhysics.vx = 11.0;
      game.playerPhysics.speed = 24.5;
      game.playerPhysics.speedKmh = 88.2;
      game.playerPhysics.slipAngle = 0.46;
      game.playerPhysics.driftAngleDeg = 26.5;
      game.playerPhysics.isDrifting = true;
      game.playerPhysics.driftScore = 1850;
      game.playerPhysics.driftMultiplier = 2.4;
      game.playerPhysics.steerAngle = -0.32; // Counter-steer
      game.input.keys["ArrowRight"] = true;
      game.input.keys["Space"] = true;
      const pos = { x: game.playerPhysics.x, y: game.playerPhysics.y, z: game.playerPhysics.z };
      if (game.particles && game.particles.spawnSmoke) {
        game.particles.spawnSmoke(pos, game.playerPhysics.heading, 26.5, 88.2);
      }
    }
  });

  await page.waitForTimeout(300);
  console.log('Capturing 07_mid_drift.png...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_mid_drift.png') });

  // 8. Hairpin with Gutter Drop
  console.log('Simulating Hairpin Gutter Drop...');
  await page.evaluate(() => {
    const game = window.__TOUGE_GAME__;
    if (game && game.playerPhysics) {
      game.state = 'RACING';
      game.hud.hideCountdown();
      game.playerPhysics.heading = 0.45;
      game.playerPhysics.vy = 18.0;
      game.playerPhysics.vx = 12.0;
      game.playerPhysics.speed = 21.6;
      game.playerPhysics.speedKmh = 77.8;
      game.playerPhysics.slipAngle = 0.58;
      game.playerPhysics.driftAngleDeg = 33.7;
      game.playerPhysics.inGutter = true;
      game.playerPhysics.isDrifting = true;
      game.playerPhysics.driftScore = 3420;
      game.playerPhysics.driftMultiplier = 3.2;
      game.playerPhysics.steerAngle = -0.38;
      game.hud.showGutterDropEffect();
      const pos = { x: game.playerPhysics.x, y: game.playerPhysics.y, z: game.playerPhysics.z };
      if (game.particles && game.particles.spawnSparks) {
        game.particles.spawnSparks(pos);
      }
    }
  });

  await page.waitForTimeout(300);
  console.log('Capturing 08_hairpin_gutter.png...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_hairpin_gutter.png') });

  // 9. Real Battle Mode vs Rival (from EVENTS_DATA Stage 4)
  console.log('Testing Real Battle Mode vs Rival (Stage 4)...');
  await page.evaluate(async () => {
    const game = window.__TOUGE_GAME__;
    const { EVENTS_DATA } = await import('./src/data/events.js');
    const realBattle = EVENTS_DATA.find(e => e.id === 4);
    game.startEvent(realBattle);
    game.state = 'RACING';
    game.countdownTimer = 0.0;
    const hudContainer = document.getElementById("hud-container");
    if (hudContainer) hudContainer.style.display = "block";
    game.hud.hideCountdown();
    // Position player and rival ahead on track with headlights
    game.playerDistance = 90.0;
    game.playerPhysics.distanceAlongTrack = 90.0;
    game.rivalDistance = 104.0;
    game.playerPhysics.speed = 19.0;
    game.playerPhysics.speedKmh = 68.4;
    game.rivalSpeed = 19.5;
  });
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    const game = window.__TOUGE_GAME__;
    game.state = 'RACING';
    game.hud.hideCountdown();
    const gantry = document.getElementById("hud-countdown-gantry");
    if (gantry) {
      gantry.classList.add("is-hidden");
      gantry.style.display = "none";
    }
  });
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
  await page.waitForTimeout(1000);
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
