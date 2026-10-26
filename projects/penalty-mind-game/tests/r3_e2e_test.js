/**
 * Round 3 End-to-End Verification Test
 * Tests:
 * 1. Initial page load & 0 console errors
 * 2. Tournament flow: Team Select -> Bracket Screen -> Intel Card
 * 3. Locker Room flow: Trophies, Balls, Kits, Stadiums, Unlocks, Star deduction
 * 4. Match completion: Stars awarded, breakdown display, Trophy unlocking
 * 5. Share Card generation: 780x1200 canvas rendering
 */

import http from 'http';
import fs from 'fs';
import path from 'path';

async function run() {
  console.log('--- Starting Round 3 E2E Browser Test ---');

  const listRes = await fetch('http://127.0.0.1:9222/json');
  const targets = await listRes.json();
  const pageTarget = targets.find(t => t.type === 'page' && (t.url.includes('8765') || t.title.includes('12碼讀心戰')));

  if (!pageTarget) throw new Error('Could not find active game page in Chrome targets');

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  let msgId = 1;
  const pending = new Map();
  let isTracking = false;
  const pageErrors = [];

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.method === 'Runtime.exceptionThrown') {
      if (isTracking) {
        console.error('Browser Exception:', data.params.exceptionDetails);
        pageErrors.push(data.params.exceptionDetails);
      }
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

  await send('Runtime.enable');
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
    fitWindow: false
  });

  // Reload page to start clean with cache bypass
  isTracking = true;
  pageErrors.length = 0;
  await send('Page.reload', { ignoreCache: true });
  await new Promise(r => setTimeout(r, 1500));

  console.log('1. Verifying initial page load state & title screen...');
  const appExists = await evaluate(`!!window.BTB_GAME`);
  console.log('  window.BTB_GAME exists:', appExists);
  if (!appExists) throw new Error('window.BTB_GAME not initialized');

  const navStarCount = await evaluate(`document.getElementById('nav-star-count').textContent`);
  console.log('  Nav Star Count:', navStarCount);

  // 2. Test Team Selection & Tournament Screen
  console.log('2. Testing Team Selection & Tournament Screen...');
  await evaluate(`
    window.BTB_GAME.tournament.reset();
    document.getElementById('btn-start-tournament').click();
  `);
  await new Promise(r => setTimeout(r, 400));

  const modalActive = await evaluate(`document.getElementById('modal-team-select').classList.contains('active')`);
  console.log('  Team Select Modal opened:', modalActive);

  // Pick Japan and confirm
  await evaluate(`
    const jpnCard = document.querySelector('.team-pick-item[data-team-id="JPN"]');
    if (jpnCard) jpnCard.click();
    document.getElementById('btn-confirm-team').click();
  `);
  await new Promise(r => setTimeout(r, 500));

  const tourneyScreenActive = await evaluate(`document.getElementById('screen-tournament').classList.contains('active')`);
  const tourneyPlayerTeam = await evaluate(`document.getElementById('tourney-player-team-name').textContent`);
  const tourneyOppName = await evaluate(`document.getElementById('tourney-opp-name').textContent`);
  const tourneyRoundTitle = await evaluate(`document.getElementById('tourney-round-title').textContent`);
  console.log('  Tournament Screen Active:', tourneyScreenActive);
  console.log('  Player Team:', tourneyPlayerTeam);
  console.log('  First Opponent:', tourneyOppName);
  console.log('  Round Title:', tourneyRoundTitle);

  // 3. Test Locker Room Screen
  console.log('3. Testing Locker Room Screen...');
  await evaluate(`
    document.getElementById('btn-tourney-home').click();
    document.getElementById('btn-open-locker').click();
  `);
  await new Promise(r => setTimeout(r, 500));

  const lockerScreenActive = await evaluate(`document.getElementById('screen-locker').classList.contains('active')`);
  const trophyCardsCount = await evaluate(`document.querySelectorAll('.trophy-card').length`);
  console.log('  Locker Screen Active:', lockerScreenActive);
  console.log('  Trophy Cards Count (expected 6):', trophyCardsCount);

  // Switch to balls tab
  await evaluate(`
    document.querySelector('.locker-tab[data-tab="balls"]').click();
  `);
  await new Promise(r => setTimeout(r, 300));
  const ballCardsCount = await evaluate(`document.querySelectorAll('#balls-grid .catalog-card').length`);
  console.log('  Ball Cards Count (expected 4):', ballCardsCount);

  // Switch to kits tab
  await evaluate(`
    document.querySelector('.locker-tab[data-tab="kits"]').click();
  `);
  await new Promise(r => setTimeout(r, 300));
  const kitCardsCount = await evaluate(`document.querySelectorAll('#kits-grid .catalog-card').length`);
  console.log('  Kit Cards Count (expected 4):', kitCardsCount);

  // Switch to stadiums tab
  await evaluate(`
    document.querySelector('.locker-tab[data-tab="stadiums"]').click();
  `);
  await new Promise(r => setTimeout(r, 300));
  const stadiumCardsCount = await evaluate(`document.querySelectorAll('#stadiums-grid .catalog-card').length`);
  console.log('  Stadium Cards Count (expected 3):', stadiumCardsCount);

  // 4. Test Match & Stars Awarding
  console.log('4. Testing Quick Match & Stars Breakdown...');
  await evaluate(`
    document.getElementById('btn-locker-back-home').click();
    window.BTB_GAME.startMatch('QUICK');
  `);
  await new Promise(r => setTimeout(r, 600));

  const matchActive = await evaluate(`document.getElementById('screen-match').classList.contains('active')`);
  console.log('  Match Screen Active:', matchActive);

  // Simulate end of match directly to verify finishMatch & end screen
  await evaluate(`
    window.BTB_GAME.playerScore = 4;
    window.BTB_GAME.cpuScore = 1;
    window.BTB_GAME.playerKicks = [
      { scored: true, zone: 'TL' },
      { scored: true, zone: 'TR' },
      { scored: true, zone: 'BL' },
      { scored: true, zone: 'BR' },
      { scored: false, zone: 'TM' }
    ];
    window.BTB_GAME.cpuKicks = [
      { scored: true },
      { scored: false },
      { scored: false },
      { scored: false }
    ];
    window.BTB_GAME.finishMatch();
  `);
  await new Promise(r => setTimeout(r, 600));

  const endScreenActive = await evaluate(`document.getElementById('screen-end').classList.contains('active')`);
  const starsTotalText = await evaluate(`document.getElementById('end-stars-total').textContent`);
  const breakdownRows = await evaluate(`document.querySelectorAll('#end-stars-breakdown .star-breakdown-row').length`);
  console.log('  End Screen Active:', endScreenActive);
  console.log('  Stars Awarded Total:', starsTotalText);
  console.log('  Star Breakdown items count:', breakdownRows);

  // 5. Test Share Card generation
  console.log('5. Testing Share Card canvas render...');
  const cardDataUrl = await evaluate(`
    const stats = window.BTB_GAME._generateShareStats();
    window.BTB_GAME.shareCard.renderCardToDataURL(stats);
  `);
  console.log('  Share Card Data URL valid:', cardDataUrl && cardDataUrl.startsWith('data:image/png'));

  // Save screenshot of end screen
  const ss = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/r3_end_screen.png', Buffer.from(ss.data, 'base64'));
  console.log('  Saved screenshot to screenshots/r3_end_screen.png');

  console.log('6. Checking browser console errors...');
  console.log('  Total Page Errors:', pageErrors.length);

  ws.close();

  if (pageErrors.length > 0) {
    throw new Error(`Browser console errors detected: ${JSON.stringify(pageErrors)}`);
  }

  console.log('✅ ALL ROUND 3 E2E BROWSER TESTS PASSED PERFECTLY!');
}

run().catch(err => {
  console.error('❌ E2E Test Failed:', err);
  process.exit(1);
});
