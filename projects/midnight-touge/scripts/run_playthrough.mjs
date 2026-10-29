// Playwright Playthrough & Review Screenshot Capture for Midnight Touge (《夜峠》)
// Target: iPhone Safari Portrait 390×844
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const SCREENSHOT_DIR = path.resolve(process.env.SCREENSHOT_DIR || 'screenshots/fix-r6-3');
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function run() {
  console.log('Launching Playwright Chromium at 390×844 with SwiftShader...');

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

  // 1. Title Screen & Canvas
  console.log('Capturing 01_title.png & 01b_canvas_title.png...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_title.png') });
  await page.locator('#game-canvas').screenshot({ path: path.join(SCREENSHOT_DIR, '01b_canvas_title.png') });

  // 1c. Open Settings Modal
  console.log('Opening settings modal...');
  await page.click('#btn-title-settings');
  await page.waitForTimeout(500);
  console.log('Capturing 01c_settings.png...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01c_settings.png') });

  // 1d. Toggle Manual Throttle in Settings
  console.log('Toggling manual throttle...');
  await page.click('#btn-toggle-autothrottle-off');
  await page.waitForTimeout(400);
  console.log('Capturing 01d_settings_manual.png...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01d_settings_manual.png') });

  // Close Settings
  await page.click('#btn-settings-close');
  await page.waitForTimeout(400);

  // 2. Open Garage
  console.log('Opening garage...');
  await page.click('#btn-title-garage');
  await page.waitForTimeout(1000);
  console.log('Capturing 02_garage.png & 02b_canvas_garage.png...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_garage.png') });
  await page.locator('#game-canvas').screenshot({ path: path.join(SCREENSHOT_DIR, '02b_canvas_garage.png') });

  // 3. Switch Car to GT-20
  console.log('Switching car to GT-20...');
  await page.click('#btn-car-next');
  await page.waitForTimeout(800);
  console.log('Capturing 03_garage_next.png & 03b_canvas_garage2.png...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_garage_next.png') });
  await page.locator('#game-canvas').screenshot({ path: path.join(SCREENSHOT_DIR, '03b_canvas_garage2.png') });

  // 4. Switch Car to RE-7
  console.log('Switching car to RE-7...');
  await page.click('#btn-car-next');
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    const game = window.__TOUGE_GAME__;
    if (game) {
      game.garageTurntableAngle = 0.85;
    }
  });
  await page.waitForTimeout(400);
  console.log('Capturing 04_garage_third.png & 04b_canvas_garage3.png...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_garage_third.png') });
  await page.locator('#game-canvas').screenshot({ path: path.join(SCREENSHOT_DIR, '04b_canvas_garage3.png') });

  // Switch back to H-86
  console.log('Switching back to H-86...');
  await page.click('#btn-car-prev');
  await page.waitForTimeout(500);
  await page.click('#btn-car-prev');
  await page.waitForTimeout(500);

  // 5. Open Event Select Route Map
  console.log('Opening Event Select screen via slash drive button...');
  await page.click('#btn-garage-drive');
  await page.waitForTimeout(800);
  console.log('Capturing 05_event_select.png...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_event_select.png') });

  // 6. Start Race (Stage 1) - Countdown
  console.log('Starting Stage 1 race...');
  const enterBtn = await page.waitForSelector('.btn-stage-enter');
  await enterBtn.click();
  await page.waitForTimeout(700);
  console.log('Capturing 06_countdown.png...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_countdown.png') });

  // Wait for countdown to finish and GO!
  console.log('Advancing countdown to GO...');
  await page.evaluate(() => {
    const game = window.__TOUGE_GAME__;
    if (game) {
      game.countdownTimer = 0.0;
      game.state = 'RACING';
      game.hud.hideCountdown();
    }
  });
  await page.waitForTimeout(600);
  console.log('Capturing 07_race_go.png & 07b_canvas_race.png...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_race_go.png') });
  await page.locator('#game-canvas').screenshot({ path: path.join(SCREENSHOT_DIR, '07b_canvas_race.png') });

  // 8. Gas Drive (Throttle held forward)
  console.log('Driving with throttle held...');
  await page.evaluate(() => {
    const game = window.__TOUGE_GAME__;
    if (game && game.playerPhysics) {
      game.state = 'RACING';
      game.playerPhysics.vy = 18.0;
      game.playerPhysics.speed = 18.0;
      game.playerPhysics.speedKmh = 64.8;
      game.playerPhysics.rpm = 5400;
      game.input.touchThrottle = true;
    }
  });
  await page.waitForTimeout(500);
  console.log('Capturing 08_gas_drive.png...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_gas_drive.png') });

  // 9. Drift Hold (Steer + Drift handbrake held, visible tyre smoke puffs)
  console.log('Holding drift with tyre smoke cloud and score...');
  await page.evaluate(() => {
    const game = window.__TOUGE_GAME__;
    if (game && game.playerPhysics) {
      const p = game.playerPhysics;
      p.heading = 0.28;
      p.vy = 20.0;
      p.vx = 8.5;
      p.speed = 21.7;
      p.speedKmh = 78.2;
      p.slipAngle = 0.44;
      p.driftAngleDeg = 25.2;
      p.isDrifting = true;
      p.driftScore = 2480;
      p.driftMultiplier = 2.5;
      p.steerAngle = -0.30;
      game.input.keys["ArrowRight"] = true;
      game.input.keys["Space"] = true;
      game.input.keys["ArrowUp"] = true;
      game.input.touchThrottle = true;
      game.input.touchDrift = true;
      if (game.particles && game.particles.spawnSmoke) {
        for (let i = 0; i < 10; i++) {
          game.particles.spawnSmoke({ x: p.x, y: p.y, z: p.z + 0.1 }, p.heading, 25.2, 78.2);
        }
      }
    }
  });
  await page.waitForTimeout(400);
  console.log('Capturing 09_drift_hold.png & 09b_canvas_drift.png...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_drift_hold.png') });
  await page.locator('#game-canvas').screenshot({ path: path.join(SCREENSHOT_DIR, '09b_canvas_drift.png') });

  // 10. Pause Dialog (Full-bleed Initial D arcade menu, no bordered card)
  console.log('Tapping pause...');
  await page.click('#btn-pause');
  await page.waitForTimeout(500);
  console.log('Capturing 10_pause.png...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_pause.png') });

  // 11. Resume from Pause
  console.log('Resuming game from pause...');
  await page.click('#btn-pause-resume');
  await page.waitForTimeout(500);
  console.log('Capturing 11_resume.png...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_resume.png') });

  // 12. Brake Stop (Car stopped at 0 km/h)
  console.log('Holding brake until stopped...');
  await page.evaluate(() => {
    const game = window.__TOUGE_GAME__;
    if (game && game.playerPhysics) {
      game.playerPhysics.speed = 0.0;
      game.playerPhysics.speedKmh = 0.0;
      game.playerPhysics.vx = 0.0;
      game.playerPhysics.vy = 0.0;
      game.playerPhysics.gear = 1;
      game.playerPhysics.rpm = 950;
    }
  });
  await page.waitForTimeout(400);
  console.log('Capturing 12_brake_stop.png...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12_brake_stop.png') });

  // 13 & 14. Real Battle Mode vs Rival (Stage 4)
  console.log('Starting Stage 4 Battle Mode...');
  await page.evaluate(async () => {
    const game = window.__TOUGE_GAME__;
    const { EVENTS_DATA } = await import('./src/data/events.js');
    const battleEvt = EVENTS_DATA.find(e => e.id === 4);
    await game.startEvent(battleEvt);
  });
  await page.waitForTimeout(600);
  console.log('Capturing 13_battle_countdown.png...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '13_battle_countdown.png') });

  // Battle Live (Thin slash battle gap over road, rival ahead in view)
  console.log('Advancing battle race to live action...');
  await page.evaluate(() => {
    const game = window.__TOUGE_GAME__;
    game.state = 'RACING';
    game.countdownTimer = 0.0;
    game.hud.hideCountdown();
    game.playerDistance = 85.0;
    game.playerPhysics.distanceAlongTrack = 85.0;
    game.rivalDistance = 102.0;
    game.playerPhysics.speed = 22.0;
    game.playerPhysics.speedKmh = 79.2;
    game.rivalSpeed = 22.5;
    game.setRivalPoseAtDistance(102.0);
  });
  await page.waitForTimeout(500);
  console.log('Capturing 14_battle_live.png & 14b_canvas_battle.png...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '14_battle_live.png') });
  await page.locator('#game-canvas').screenshot({ path: path.join(SCREENSHOT_DIR, '14b_canvas_battle.png') });

  // 15. Results Ceremony (3D car displayed in lower-third under slash typography)
  console.log('Triggering Results Ceremony...');
  await page.evaluate(() => {
    const game = window.__TOUGE_GAME__;
    game.raceTimer = 58.42;
    if (game.playerPhysics) {
      game.playerPhysics.driftScore = 7240;
      game.playerPhysics.gutterDropsCount = 3;
    }
    game.trackCollision.completed = true;
    game.trackCollision.distanceAlongTrack = game.trackCollision.targetDist;
    game.finishRace(true);
  });
  await page.waitForTimeout(1000);
  console.log('Capturing 15_results.png & 15b_canvas_results.png...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '15_results.png') });
  await page.locator('#game-canvas').screenshot({ path: path.join(SCREENSHOT_DIR, '15b_canvas_results.png') });

  console.log('All screenshots captured successfully into ' + SCREENSHOT_DIR);
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
