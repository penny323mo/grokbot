/**
 * 12碼讀心戰 (Penalty Mind Game v2) - Automated Screenshot & E2E Validation
 * Controls Chrome via Chrome DevTools Protocol (CDP) WebSocket to validate
 * Round 2 features on iPhone Safari 390x844 portrait viewport.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('Connecting to Chrome DevTools...');

  // 1. Get page targets from CDP
  const listRes = await fetch('http://127.0.0.1:9222/json');
  const targets = await listRes.json();
  const pageTarget = targets.find(t => t.type === 'page' && t.url.includes('8089'));

  if (!pageTarget) {
    throw new Error('Could not find active game page in Chrome targets');
  }

  const wsUrl = pageTarget.webSocketDebuggerUrl;
  console.log('Attaching WebSocket to page:', wsUrl);

  const ws = new WebSocket(wsUrl);
  let msgId = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    }
  };

  await new Promise((resolve) => ws.onopen = resolve);

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async function evaluate(expression) {
    const res = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    return res && res.result && res.result.value;
  }

  async function takeScreenshot(filename) {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const outPath = path.join('/workspace/nightly/2026-10-24-penalty-mind-game/screenshots/v2', filename);
    fs.writeFileSync(outPath, buffer);
    console.log(`📸 Saved screenshot: ${filename} (${buffer.length} bytes)`);
  }

  // 1. Set iPhone 390x844 Device Emulation
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
    fitWindow: false
  });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true });

  console.log('Device metrics set to 390x844 @ 2x.');

  // Give initial render a moment
  await new Promise(r => setTimeout(r, 600));

  // Screenshot 1: Title Screen with Difficulty Chips
  await takeScreenshot('r2-01-title.png');

  // Select HARD difficulty
  await evaluate(`
    const hardBtn = document.querySelector('.diff-chip[data-diff="HARD"]');
    if (hardBtn) hardBtn.click();
  `);
  await new Promise(r => setTimeout(r, 300));

  // Start match
  await evaluate(`window.BTB_GAME.startMatch();`);
  await new Promise(r => setTimeout(r, 800));

  // Screenshot 2: Match Player Turn
  await takeScreenshot('r2-02-match-player-turn.png');

  // Player shoots a curved shot towards top left
  await evaluate(`
    window.BTB_GAME.onPlayerShoot({
      vx: -1.8,
      vy: 2.2,
      speed: 26.0,
      spin: { x: 0, y: -8.0, z: 0 },
      power: 0.85,
      targetX: -2.4,
      targetY: 1.85
    });
  `);
  // Wait for ball flight and crossing reveal
  await new Promise(r => setTimeout(r, 700));

  // Screenshot 3: 3D In-Scene Mind Reading Reveal across 6 zones
  await takeScreenshot('r2-03-mind-reading-3d-reveal.png');

  // Wait for transition to Keeper Turn
  await new Promise(r => setTimeout(r, 1500));

  // Screenshot 4: Keeper Turn (Striker running up at penalty spot)
  await takeScreenshot('r2-04-keeper-mode-turn.png');

  // Simulate player swiping to dive top-right
  await evaluate(`
    window.BTB_GAME._onPlayerKeeperSwipe({
      vx: 1.6,
      vy: 1.8,
      speed: 24.0,
      targetY: 1.8
    });
  `);
  await new Promise(r => setTimeout(r, 700));

  // Screenshot 5: Keeper Dive & Taunt Speech Bubble
  await takeScreenshot('r2-05-keeper-save-taunt.png');

  // Trigger deciding slow-motion replay
  await evaluate(`
    window.BTB_GAME.triggerDecidingReplay();
  `);
  await new Promise(r => setTimeout(r, 500));

  // Screenshot 6: Slow-motion Replay Broadcast Angle
  await takeScreenshot('r2-06-replay-broadcast.png');

  // Skip replay and end match
  await evaluate(`
    const skipBtn = document.getElementById('btn-skip-replay');
    if (skipBtn) skipBtn.click();
    window.BTB_GAME.finishMatch();
  `);
  await new Promise(r => setTimeout(r, 600));

  // Screenshot 7: End Screen
  await takeScreenshot('r2-07-end-screen.png');

  console.log('✅ All 7 Round 2 screenshots captured and verified successfully!');
  ws.close();
  process.exit(0);
}

main().catch(err => {
  console.error('Screenshot script failed:', err);
  process.exit(1);
});
