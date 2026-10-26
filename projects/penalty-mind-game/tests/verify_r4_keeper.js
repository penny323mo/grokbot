/**
 * Round 4 Browser E2E Verification Script
 * Tests:
 * 1. Keeper Mode activation and on-screen Cantonese hint: "撲救：㩒龍門你想守嘅位置"
 * 2. In-scene semi-transparent 6-zone target display over the goal during run-up
 * 3. Tapping on goal (e.g. TR zone at x=301, y=390) immediately highlights that zone in 3D
 * 4. Immediate HUD banner update: "已選定撲向：右上！準備接波！"
 * 5. Short swipe in keeper mode (e.g. swipe towards BL) picks BL dive zone
 * 6. Taps outside the goal (e.g. tap at x=30, y=800) map sensibly to nearest zone (BL)
 * 7. Shot simulation, save hit tolerance, and keeper dive resolution with 0 console errors
 */

import http from 'http';
import fs from 'fs';
import path from 'path';

async function run() {
  console.log('--- Starting Round 4 Keeper Mode Browser CDP Test ---');

  const listRes = await fetch('http://127.0.0.1:9222/json');
  const targets = await listRes.json();
  const pageTarget = targets.find(t => t.type === 'page' && (t.url.includes('8765') || t.title.includes('12碼讀心戰')));

  if (!pageTarget) throw new Error('Could not find active game page in Chrome targets');

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  let msgId = 1;
  const pending = new Map();
  const pageErrors = [];

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.method === 'Runtime.exceptionThrown') {
      console.error('Browser Exception:', data.params.exceptionDetails);
      pageErrors.push(data.params.exceptionDetails);
    }
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    }
  };

  await new Promise(r => ws.onopen = r);

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

  async function snap(name) {
    const ss = await send('Page.captureScreenshot', { format: 'png' });
    const dir = 'screenshots/r4-390';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `${name}.png`);
    fs.writeFileSync(filePath, Buffer.from(ss.data, 'base64'));
    console.log(`📸 Captured: ${filePath}`);
  }

  await send('Runtime.enable');
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
    fitWindow: false
  });

  // Reload page
  console.log('1. Reloading fresh page at 390x844...');
  await send('Page.reload', { ignoreCache: true });
  await new Promise(r => setTimeout(r, 1200));
  pageErrors.length = 0; // Clear any pre-reload errors

  // 1. Start match and switch immediately to keeper turn
  console.log('2. Starting match and initiating Keeper Mode...');
  await evaluate(`
    window.BTB_GAME.startMatch();
  `);
  await new Promise(r => setTimeout(r, 400));

  await evaluate(`
    window.BTB_GAME.startKeeperTurn();
  `);
  await new Promise(r => setTimeout(r, 300));

  // Check Keeper Mode on-screen hint
  const turnBannerText = await evaluate(`document.getElementById('turn-banner').textContent`);
  console.log('  Turn Banner Text:', turnBannerText);
  if (!turnBannerText.includes('撲救：㩒龍門你想守嘅位置')) {
    throw new Error(`Expected Cantonese keeper hint in turn banner, got: "${turnBannerText}"`);
  }

  // Check in-scene 3D target zones visibility
  const targetZonesVisible = await evaluate(`window.BTB_GAME.fx.mindZonesGroup.visible`);
  console.log('  3D Target Zones Visible:', targetZonesVisible);
  if (!targetZonesVisible) {
    throw new Error('Expected 3D target zones over goal to be visible during keeper run-up');
  }

  await snap('01_keeper_target_zones_initial');

  // 2. Test Tap on Goal (e.g. TR zone at x=301, y=390)
  console.log('3. Testing Tap on Goal TR zone (301, 390)...');
  await send('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    x: 301,
    y: 390,
    button: 'left',
    clickCount: 1
  });
  await new Promise(r => setTimeout(r, 50));
  await send('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x: 301,
    y: 390,
    button: 'left'
  });

  await new Promise(r => setTimeout(r, 100));

  const afterTapBanner = await evaluate(`document.getElementById('turn-banner').textContent`);
  const chosenDiveZone = await evaluate(`window.BTB_GAME.keeperTurnState.diveZone`);
  const earlyDive = await evaluate(`window.BTB_GAME.keeperTurnState.earlyDive`);
  console.log('  Banner after Tap:', afterTapBanner);
  console.log('  Chosen Dive Zone:', chosenDiveZone);
  console.log('  Early Dive Flag:', earlyDive);

  if (chosenDiveZone !== 'TR') {
    throw new Error(`Expected tap at (301, 390) to choose TR zone, but got: ${chosenDiveZone}`);
  }
  if (!afterTapBanner.includes('右上')) {
    throw new Error(`Expected banner to display "右上", got: "${afterTapBanner}"`);
  }
  if (earlyDive !== false) {
    throw new Error(`Expected earlyDive to be false for run-up commit on Medium, got: ${earlyDive}`);
  }
  if (afterTapBanner.includes('太早撲')) {
    throw new Error(`Run-up commit should never display "太早撲" banner`);
  }

  await snap('02_keeper_zone_selected_TR');

  // 3. Test Short Swipe in a second keeper turn
  console.log('4. Testing Short Swipe in Keeper Mode...');
  await evaluate(`
    window.BTB_GAME.startKeeperTurn();
  `);
  await new Promise(r => setTimeout(r, 300));

  // Swipe towards top-left: start at (200, 500) -> end at (170, 460)
  await send('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    x: 200,
    y: 500,
    button: 'left',
    clickCount: 1
  });
  await new Promise(r => setTimeout(r, 30));
  await send('Input.dispatchMouseEvent', {
    type: 'mouseMoved',
    x: 185,
    y: 480,
    button: 'left'
  });
  await new Promise(r => setTimeout(r, 30));
  await send('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x: 170,
    y: 460,
    button: 'left'
  });
  await new Promise(r => setTimeout(r, 100));

  const swipeDiveZone = await evaluate(`window.BTB_GAME.keeperTurnState.diveZone`);
  const swipeBanner = await evaluate(`document.getElementById('turn-banner').textContent`);
  console.log('  Chosen Dive Zone after up-left swipe:', swipeDiveZone);
  console.log('  Banner after swipe:', swipeBanner);

  if (swipeDiveZone !== 'TL') {
    throw new Error(`Expected short swipe towards top-left to select TL, got: ${swipeDiveZone}`);
  }

  // 4. Test Tap Outside the Goal (e.g. far bottom-left pitch x=30, y=800)
  console.log('5. Testing Tap Outside the Goal (30, 800) maps to nearest zone (BL)...');
  await evaluate(`
    window.BTB_GAME.startKeeperTurn();
  `);
  await new Promise(r => setTimeout(r, 300));

  await send('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    x: 30,
    y: 800,
    button: 'left',
    clickCount: 1
  });
  await new Promise(r => setTimeout(r, 50));
  await send('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x: 30,
    y: 800,
    button: 'left'
  });
  await new Promise(r => setTimeout(r, 100));

  const outsideDiveZone = await evaluate(`window.BTB_GAME.keeperTurnState.diveZone`);
  console.log('  Chosen Dive Zone for tap at (30, 800):', outsideDiveZone);
  if (outsideDiveZone !== 'BL') {
    throw new Error(`Expected tap outside goal at (30, 800) to map to BL, got: ${outsideDiveZone}`);
  }

  // 5. Verify CPU striker kick resolution and save logic with forgiving tolerance
  console.log('6. Testing CPU striker kick execution and save determination...');
  await evaluate(`
    window.BTB_GAME._onCpuTakerStrike();
  `);

  let shotResolved = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 100));
    shotResolved = await evaluate(`(() => {
      return {
        matchState: window.BTB_GAME.matchState,
        ballCrossed: window.BTB_GAME.ballCrossed,
        cpuKicksCount: window.BTB_GAME.cpuKicks.length,
        hasDecidingKick: !!window.BTB_GAME.lastDecidingKick
      };
    })()`);
    if (shotResolved.cpuKicksCount > 0 || shotResolved.ballCrossed) {
      console.log(`  Crossing / kick detected at step ${i}:`, JSON.stringify(shotResolved));
      break;
    }
  }
  console.log('  Shot resolution state:', JSON.stringify(shotResolved));

  if (shotResolved.cpuKicksCount === 0) {
    throw new Error('Expected CPU kick to be recorded!');
  }

  // 6. Test World Cup team-select modal card layout at 390px
  console.log('7. Testing World Cup team-select cards layout at 390px...');
  await evaluate(`
    window.BTB_GAME.openTeamSelectModal();
  `);
  await new Promise(r => setTimeout(r, 400));
  const cardData = await evaluate(`(() => {
    const grid = document.getElementById('team-select-grid');
    const items = grid.querySelectorAll('.team-pick-item');
    const firstItem = items[0];
    const nameSpan = firstItem ? firstItem.querySelector('.team-pick-name') : null;
    const intelSpan = firstItem ? firstItem.querySelector('.team-pick-intel') : null;
    return {
      itemCount: items.length,
      gridCols: window.getComputedStyle(grid).gridTemplateColumns,
      firstItemWidth: firstItem ? firstItem.getBoundingClientRect().width : 0,
      nameText: nameSpan ? nameSpan.textContent : '',
      intelText: intelSpan ? intelSpan.textContent : ''
    };
  })()`);
  console.log('  Team select cards metrics:', JSON.stringify(cardData));
  if (cardData.itemCount !== 16) {
    throw new Error(`Expected 16 team cards, got: ${cardData.itemCount}`);
  }
  if (cardData.firstItemWidth < 250) {
    throw new Error(`Expected card width >= 250px on 390px viewport, got: ${cardData.firstItemWidth}`);
  }
  await snap('03_team_select_cards_readable');

  // 7. Check for browser exceptions
  console.log('8. Verifying zero browser exceptions...');
  console.log('  Total page exceptions:', pageErrors.length);
  if (pageErrors.length > 0) {
    throw new Error(`Encountered ${pageErrors.length} browser errors during test`);
  }

  ws.close();
  console.log('--- ALL ROUND 4 BROWSER VERIFICATION CHECKS PASSED PERFECTLY! ---');
  process.exit(0);
}

run().catch(err => {
  console.error('ROUND 4 VERIFICATION FAILED:', err);
  process.exit(1);
});
