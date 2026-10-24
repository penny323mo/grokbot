/**
 * Capture High-Res 390x844 Screenshots for Round 3
 */

import fs from 'fs';
import path from 'path';

async function run() {
  console.log('--- Capturing Round 3 390x844 Screenshots ---');

  const listRes = await fetch('http://127.0.0.1:9222/json');
  const targets = await listRes.json();
  const pageTarget = targets.find(t => t.type === 'page' && (t.url.includes('8765') || t.title.includes('12碼讀心戰')));

  if (!pageTarget) throw new Error('Could not find active game page in Chrome targets');

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
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
    const filePath = path.join('screenshots/r3-390', `${name}.png`);
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

  // 1. Title Screen
  await evaluate(`
    window.BTB_GAME.switchScreen('title');
    window.BTB_GAME._updateTitleMemoryStatus();
    window.BTB_GAME._updateNavStars();
  `);
  await new Promise(r => setTimeout(r, 600));
  await snap('01_screen_title');

  // 2. Team Select Modal
  await evaluate(`
    window.BTB_GAME.tournament.reset();
    window.BTB_GAME.openTeamSelectModal();
  `);
  await new Promise(r => setTimeout(r, 600));
  await snap('02_screen_team_select');

  // 3. Tournament Bracket Screen
  await evaluate(`
    window.BTB_GAME.tournament.startTournament('HKG');
    window.BTB_GAME.openTournamentScreen();
  `);
  await new Promise(r => setTimeout(r, 600));
  await snap('03_screen_tournament');

  // 4. Locker Room Screen (Trophies)
  await evaluate(`
    window.BTB_GAME.openLockerScreen();
  `);
  await new Promise(r => setTimeout(r, 600));
  await snap('04_screen_locker_trophies');

  // 5. Locker Room Screen (Balls)
  await evaluate(`
    window.BTB_GAME.switchLockerTab('balls');
  `);
  await new Promise(r => setTimeout(r, 500));
  await snap('05_screen_locker_balls');

  // 6. Tournament Match Screen
  await evaluate(`
    window.BTB_GAME.startMatch('TOURNAMENT');
  `);
  await new Promise(r => setTimeout(r, 1200));
  await snap('06_screen_tournament_match');

  // 7. End Screen with Stars Breakdown
  await evaluate(`
    window.BTB_GAME.playerScore = 5;
    window.BTB_GAME.cpuScore = 2;
    window.BTB_GAME.playerKicks = [
      { scored: true, zone: 'TL' },
      { scored: true, zone: 'TR' },
      { scored: true, zone: 'BL' },
      { scored: true, zone: 'BR' },
      { scored: true, zone: 'TM' }
    ];
    window.BTB_GAME.cpuKicks = [
      { scored: true },
      { scored: false },
      { scored: false },
      { scored: true },
      { scored: false }
    ];
    window.BTB_GAME.finishMatch();
  `);
  await new Promise(r => setTimeout(r, 800));
  await snap('07_screen_end_stars');

  // 8. Share Card Preview Modal
  await evaluate(`
    const stats = window.BTB_GAME._generateShareStats();
    window.BTB_GAME.shareCard.renderCard(stats);
    window.BTB_GAME.shareCard.showImageModal();
  `);
  await new Promise(r => setTimeout(r, 800));
  await snap('08_screen_share_card');

  // Direct export of 780x1200 Share Card canvas to PNG file
  const cardDataUrl = await evaluate(`
    window.BTB_GAME.shareCard.renderCardToDataURL(window.BTB_GAME._generateShareStats());
  `);
  if (cardDataUrl) {
    const base64Data = cardDataUrl.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync('screenshots/r3-390/share_card_780x1200.png', Buffer.from(base64Data, 'base64'));
    console.log('📸 Saved high-res share card: screenshots/r3-390/share_card_780x1200.png');
  }

  ws.close();
  console.log('✅ All Round 3 screenshots captured successfully!');
}

run().catch(err => {
  console.error('❌ Capture failed:', err);
  process.exit(1);
});
