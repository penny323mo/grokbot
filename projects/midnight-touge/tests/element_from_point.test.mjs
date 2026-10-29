// Automated elementFromPoint and Touch Target Accessibility Test for Midnight Touge
process.env.DISPLAY = process.env.DISPLAY || ':1';
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

describe('elementFromPoint & Touch Target Accessibility Verification', () => {
  let server;
  let serverPort;
  let browser;
  let xvfbProcess;

  before(async () => {
    // 1. Static file server
    server = http.createServer((req, res) => {
      let reqPath = req.url.split('?')[0];
      if (reqPath === '/') reqPath = '/index.html';
      const filePath = path.join(process.cwd(), reqPath);
      if (!fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end('Not Found');
        return;
      }
      const ext = path.extname(filePath);
      const mimeMap = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.jpg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.glb': 'model/gltf-binary',
        '.ttf': 'font/ttf',
        '.mp3': 'audio/mpeg'
      };
      res.writeHead(200, { 'Content-Type': mimeMap[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    });

    await new Promise(resolve => server.listen(0, resolve));
    serverPort = server.address().port;

    process.env.DISPLAY = process.env.DISPLAY || ':1';

    // 2. Headless Chromium
    browser = await chromium.launch({
      executablePath: '/workspace/stage/autobet/research/pw-browsers/chromium-1248/chrome-linux64/chrome',
      env: { ...process.env, DISPLAY: process.env.DISPLAY || ':1' },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--use-gl=angle',
        '--use-angle=swiftshader',
        '--enable-unsafe-swiftshader',
        '--ignore-gpu-blocklist'
      ]
    });
  });

  after(async () => {
    if (browser) await browser.close();
    if (server) await new Promise(resolve => server.close(resolve));
    if (xvfbProcess) {
      try { xvfbProcess.kill(); } catch (_) {}
    }
  });

  test('HUD touch pads and pause button receive pointer events during RACING (not intercepted by ui-container)', { timeout: 60000 }, async () => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true
    });
    const page = await context.newPage();

    await page.goto(`http://127.0.0.1:${serverPort}/index.html`);
    await page.waitForSelector('#btn-title-start', { timeout: 15000 });

    // Properly await startEvent into COUNTDOWN state for Event 1
    await page.evaluate(async () => {
      const game = window.__TOUGE_GAME__;
      const { EVENTS_DATA } = await import('./src/data/events.js');
      await game.startEvent(EVENTS_DATA[0]);
    });

    // Wait for countdown to finish and state to reach RACING
    await page.waitForFunction(() => {
      const game = window.__TOUGE_GAME__;
      return game && game.state === 'RACING';
    }, { timeout: 10000 });

    // Assert buttons under elementFromPoint
    const buttonsToTest = [
      '#btn-steer-left',
      '#btn-steer-right',
      '#btn-brake',
      '#btn-drift',
      '#btn-pause',
      '#btn-cam-switch'
    ];

    for (const selector of buttonsToTest) {
      const hitResult = await page.evaluate((sel) => {
        const btn = document.querySelector(sel);
        if (!btn) return { found: false, error: 'Button element not found: ' + sel };
        const rect = btn.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const hitEl = document.elementFromPoint(cx, cy);
        if (!hitEl) return { found: false, error: 'elementFromPoint returned null' };
        // Hit element must be the button itself or contained within the button (e.g. svg, path, span)
        const isSelfOrChild = btn === hitEl || btn.contains(hitEl);
        return {
          found: true,
          isSelfOrChild,
          hitTag: hitEl.tagName,
          hitId: hitEl.id,
          hitClass: hitEl.className
        };
      }, selector);

      assert.ok(hitResult.found, `Element ${selector} must be found in DOM`);
      assert.strictEqual(
        hitResult.isSelfOrChild,
        true,
        `elementFromPoint at center of ${selector} was intercepted by <${hitResult.hitTag} id="${hitResult.hitId}" class="${hitResult.hitClass}">`
      );
    }

    // Now test pause button functionality and pause overlay accessibility
    await page.tap('#btn-pause');
    await page.waitForTimeout(300);

    // Assert game state paused and overlay visible
    const pauseState = await page.evaluate(() => {
      const game = window.__TOUGE_GAME__;
      const overlay = document.querySelector('.pause-modal-overlay');
      return {
        isPaused: game.state === 'PAUSED',
        hasOverlay: !!overlay,
        overlayStyle: overlay ? window.getComputedStyle(overlay).pointerEvents : null
      };
    });

    assert.strictEqual(pauseState.isPaused, true, 'Game state should be PAUSED after tapping pause');
    assert.strictEqual(pauseState.hasOverlay, true, 'Pause modal overlay should be present');

    // Test resume button under elementFromPoint
    const resumeHit = await page.evaluate(() => {
      const resumeBtn = document.querySelector('.btn-pause-action');
      if (!resumeBtn) return { found: false };
      const rect = resumeBtn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const hitEl = document.elementFromPoint(cx, cy);
      return {
        found: true,
        isSelfOrChild: resumeBtn === hitEl || resumeBtn.contains(hitEl),
        hitTag: hitEl ? hitEl.tagName : null,
        hitId: hitEl ? hitEl.id : null
      };
    });

    assert.ok(resumeHit.found, 'Resume button must exist in pause modal');
    assert.strictEqual(resumeHit.isSelfOrChild, true, 'Resume button must be clickable and receive pointer events');

    // Tap resume
    await page.tap('.btn-pause-action');
    await page.waitForTimeout(300);

    const resumedState = await page.evaluate(() => {
      const game = window.__TOUGE_GAME__;
      return game.state;
    });
    assert.strictEqual(resumedState, 'RACING', 'Game state should return to RACING after resume');

    await context.close();
  });
});
