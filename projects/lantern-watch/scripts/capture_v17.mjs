import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const puppeteer = require('/workspace/nightly/shotkit/node_modules/puppeteer-core');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUT_DIR = path.resolve(__dirname, '../screenshots/v17');
fs.mkdirSync(OUT_DIR, { recursive: true });

const URL = 'http://127.0.0.1:8897/index.html';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function run() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('lt_tutorial_seen', '1');
    localStorage.setItem('lantern_tactics_v4_tutorial', '1');
  });

  console.log('Navigating to game...');
  await page.goto(URL, { waitUntil: 'networkidle2' });
  await sleep(1000);

  // 1. battle-start.png (Ch1 battle start with spread plates and battle roster dock filling bottom)
  console.log('Capturing 1: battle-start.png...');
  await page.evaluate(() => window.__lt.launchBattle(1));
  await sleep(2500);
  await page.screenshot({ path: path.join(OUT_DIR, 'battle-start.png') });

  // 2. four-heroes.png (The four heroes side by side with weapon overlays, silhouettes, and idle postures)
  console.log('Capturing 2: four-heroes.png...');
  await page.evaluate(() => {
    const b = window.__lt.getBattle();
    // Hide cart away from comparison line
    const cart = b.allies.find(a => a.id === 'lantern_cart');
    if (cart) { cart.x = -99; cart.y = -99; }
    // Line up the 4 heroes on row 11, each 2 columns apart with clear breathing room
    const heroes = [
      { id: 'bear_guard', x: 1, y: 11 },
      { id: 'cat_patrol', x: 3, y: 11 },
      { id: 'lantern_crafter', x: 5, y: 11 },
      { id: 'tea_master', x: 7, y: 11 }
    ];
    heroes.forEach(h => {
      const u = b.allies.find(a => a.id === h.id);
      if (u) { u.x = h.x; u.y = h.y; }
    });
    window.__lt.app.refreshBattleUI();
    window.__lt.app.ui.centerCameraOn(4, 11, false);
  });
  await sleep(700);
  await page.screenshot({ path: path.join(OUT_DIR, 'four-heroes.png') });

  // 3. stratagem-preview.png (Stratagem preview with name + big success rate + effect line)
  console.log('Capturing 3: stratagem-preview.png...');
  await page.evaluate(async () => {
    const { STRATAGEM_MOVES } = await import('./js/data/units.js');
    const { calculateCombat } = await import('./js/engine/combat.js');
    const b = window.__lt.getBattle();
    const caster = b.allies.find(a => a.id === 'lantern_crafter') || b.allies[0];
    const enemy = b.enemies[0];
    const preview = calculateCombat(caster, enemy, b.board, window.__lt.app.rng, {
      skill: STRATAGEM_MOVES.stratagem_fire,
      isStratagem: true
    });
    window.__lt.app.ui.showTargetPreview(preview, () => {}, () => {});
  });
  await sleep(700);
  await page.screenshot({ path: path.join(OUT_DIR, 'stratagem-preview.png') });

  // 4. taunt-stealth.png (熊岳 taunting and 墨影 in stealth)
  console.log('Capturing 4: taunt-stealth.png...');
  await page.evaluate(() => {
    window.__lt.app.ui.hideTargetPreview();
    const b = window.__lt.getBattle();
    const cart = b.allies.find(a => a.id === 'lantern_cart');
    if (cart) { cart.x = -99; cart.y = -99; }

    const bear = b.allies.find(a => a.id === 'bear_guard');
    const cat = b.allies.find(a => a.id === 'cat_patrol');
    const foe = b.enemies[0];

    // Bear and foe adjacent on row 8
    if (bear) { bear.x = 1; bear.y = 8; bear.tauntActive = true; }
    if (foe) { foe.x = 1; foe.y = 7; foe.isTaunted = true; }

    // Cat in stealth 3 tiles away in open area
    if (cat) { cat.x = 4; cat.y = 8; cat.isStealthed = true; }

    window.__lt.app.refreshBattleUI();
    window.__lt.app.ui.centerCameraOn(2.5, 7.5, false);
  });
  await sleep(700);
  await page.screenshot({ path: path.join(OUT_DIR, 'taunt-stealth.png') });

  // 5. new-classes-comp.png (Chapter 4 battle start showing 策士, 醫者, 盾兵)
  console.log('Capturing 5: new-classes-comp.png...');
  await page.evaluate(() => {
    window.__lt.launchBattle(4);
  });
  await sleep(2600);
  await page.evaluate(() => {
    // Focus camera on row 2 where 策士 (x=2), 盾兵 (x=5), and 醫者 (x=7) are deployed
    window.__lt.app.ui.centerCameraOn(4.5, 2.5, false);
    window.__lt.app.refreshBattleUI();
  });
  await sleep(700);
  await page.screenshot({ path: path.join(OUT_DIR, 'new-classes-comp.png') });

  // 6. level-up-card.png (Battle level-up card)
  console.log('Capturing 6: level-up-card.png...');
  await page.evaluate(() => {
    const b = window.__lt.getBattle();
    const bear = b.allies.find(a => a.id === 'bear_guard') || { id: 'bear_guard', name: '熊岳' };
    window.__lt.app.ui.showLevelUpCard(bear, {
      newLevel: 2,
      statGains: { hp: 2, atk: 1, def: 1 }
    });
  });
  await sleep(600);
  await page.screenshot({ path: path.join(OUT_DIR, 'level-up-card.png') });

  // 7. duel-screen.png (Single combat duel modal)
  console.log('Capturing 7: duel-screen.png...');
  await page.evaluate(() => {
    const card = document.getElementById('battleLevelUpCard');
    if (card) card.style.display = 'none';
    const b = window.__lt.getBattle();
    const bear = b.allies.find(a => a.id === 'bear_guard') || { id: 'bear_guard', name: '熊岳', hp: 36 };
    const boss = b.enemies.find(e => e.role === 'commander' || e.isBoss) || b.enemies[0] || { id: 'citadel_warlord', name: '鎮關將領', hp: 45 };
    window.__lt.app.ui.showDuelModal({
      player: bear,
      enemy: boss,
      onResolve: () => {},
      onDecline: () => {}
    });
  });
  await sleep(600);
  await page.screenshot({ path: path.join(OUT_DIR, 'duel-screen.png') });

  // 8. auto-end-turn-toast.png (Auto end turn 1s toast)
  console.log('Capturing 8: auto-end-turn-toast.png...');
  await page.evaluate(() => {
    const duelModal = document.getElementById('modalDuel');
    if (duelModal) duelModal.style.display = 'none';
    const toast = document.getElementById('autoEndTurnToast');
    if (toast) toast.style.display = 'flex';
  });
  await sleep(500);
  await page.screenshot({ path: path.join(OUT_DIR, 'auto-end-turn-toast.png') });

  await browser.close();
  console.log('All v17 screenshots recaptured successfully!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
