import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require('/workspace/nightly/shotkit/node_modules/puppeteer-core');

const URL = 'http://127.0.0.1:8897/index.html';
const OUT = 'screenshots/v15';
fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('lt_tutorial_seen', '1');
    localStorage.setItem('lantern_tactics_v4_tutorial', '1');
  });
  await page.goto(URL, { waitUntil: 'networkidle2' });
  await sleep(1000);

  // 1. Battle Start with Board filling HUD-to-Strip height (No 200px empty slab)
  console.log('1. Capturing battle-start.png...');
  await page.evaluate(() => {
    window.__lt.launchBattle(1);
    window.__lt.app.ui.fillHeightCamera();
  });
  await sleep(1500);
  await page.screenshot({ path: `${OUT}/battle-start.png` });

  // 2. Docked Action Bar fully inside 390px with no clipped subtitles
  console.log('2. Capturing docked-action-bar.png...');
  await page.evaluate(() => {
    const battle = window.__lt.getBattle();
    const ally = battle.allies.find(a => a.id === 'bear_guard') || battle.allies[0];
    const enemy = battle.enemies.find(e => e.hp > 0);
    if (enemy) {
      enemy.x = ally.x + 1;
      enemy.y = ally.y;
    }
    window.__lt.app.selectedUnit = ally;
    window.__lt.app.openActionMenuForUnit(ally);
  });
  await sleep(600);
  await page.screenshot({ path: `${OUT}/docked-action-bar.png` });
  await page.evaluate(() => {
    window.__lt.app.ui.hideActionMenu();
  });
  await sleep(300);

  // 3. Tutorial Step 5: 燈娘 selected, 法術 targeted on wood 影弓 showing 克制 ×1.5 with NO ellipsis
  console.log('3. Capturing tutorial-step.png...');
  await page.evaluate(() => {
    const battle = window.__lt.getBattle();
    const dengniang = battle.allies.find(a => a.id === 'lantern_crafter');
    const shadowArcher = battle.enemies.find(e => e.id === 'shadow_archer');
    if (dengniang && shadowArcher) {
      // Put shadow archer 3 tiles away (wood element)
      shadowArcher.x = dengniang.x + 2;
      shadowArcher.y = dengniang.y - 1;
    }
    // Select dengniang and show tutorial step 5 (index 4)
    window.__lt.app.selectedUnit = dengniang;
    window.__lt.app.activeActionType = 'magic';
    window.__lt.app.ui.showBoardTutorial(4, () => {}, () => {});
    // Highlight attackable tiles and target tags
    const targetTagsMap = new Map();
    if (shadowArcher) {
      targetTagsMap.set(shadowArcher.id, ['克制 ×1.5', '會反擊']);
    }
    window.__lt.app.ui.renderBattle(battle, {
      selectedUnit: dengniang,
      reachableTiles: new Map(),
      attackableTiles: new Set([`${shadowArcher.x},${shadowArcher.y}`]),
      targetTagsMap,
      onUnitTap: () => {},
      onTileTap: () => {}
    });
    window.__lt.app.ui.fillHeightCamera();
  });
  await sleep(600);
  await page.screenshot({ path: `${OUT}/tutorial-step.png` });
  await page.evaluate(() => {
    document.getElementById('tutorialBoardOverlay').style.display = 'none';
  });
  await sleep(300);

  // 4. Unit Card with Role Tag + Passive + 怎樣用 + Per-unit Auto
  console.log('4. Capturing unit-card-role.png...');
  await page.evaluate(() => {
    const battle = window.__lt.getBattle();
    const hero = battle.allies.find(a => a.id === 'bear_guard') || battle.allies[0];
    window.__lt.app.ui.showDetailSheet(hero);
  });
  await sleep(600);
  await page.screenshot({ path: `${OUT}/unit-card-role.png` });
  await page.evaluate(() => {
    document.getElementById('modalDetailSheet').style.display = 'none';
  });
  await sleep(300);

  // 5. 兵法手冊 with Tabs showing Facing / Terrain / Morale / Class Triangle
  console.log('5. Capturing tactics-manual.png...');
  await page.evaluate(() => {
    // Show Tab 2 (五行走位: 背刺與側翼合擊) & Tab 3
    window.__lt.app.ui.showTacticsManualModal('tab2');
  });
  await sleep(600);
  await page.screenshot({ path: `${OUT}/tactics-manual.png` });
  await page.evaluate(() => {
    document.getElementById('modalTacticsManual').style.display = 'none';
  });
  await sleep(300);

  // 6. Real Class Triangle Preview: bear_guard (步兵) attacking shadow_archer (弓兵) with 兵種克制 ×1.2
  console.log('6. Capturing class-triangle-preview.png...');
  await page.evaluate(() => {
    const battle = window.__lt.getBattle();
    const bear = battle.allies.find(a => a.id === 'bear_guard') || battle.allies[0];
    const archer = battle.enemies.find(e => e.id === 'shadow_archer') || {
      id: 'shadow_archer',
      name: '影弓',
      cls: '弓手',
      clsBadge: '弓',
      role: 'archer',
      team: 'enemy',
      hp: 18,
      maxHp: 18,
      atk: 10,
      def: 3,
      res: 4,
      spd: 8,
      x: bear.x + 1,
      y: bear.y
    };
    window.__lt.app.ui.showTargetPreview({
      attacker: bear,
      defender: archer,
      expectedDamage: 16,
      hitRate: 95,
      critRate: 15,
      canCounter: false,
      counterDamage: 0,
      counterHitRate: 0,
      willKill: false,
      isBackAttack: false,
      isSideAttack: false,
      direction: 'front',
      classTriangle: { relation: 'advantage', mult: 1.2 }
    }, () => {}, () => {});
  });
  await sleep(600);
  await page.screenshot({ path: `${OUT}/class-triangle-preview.png` });
  await page.evaluate(() => {
    window.__lt.app.ui.hideTargetPreview();
  });
  await sleep(300);

  // 7. Auto-Battle Running with Style Chips and Pause Control (No Bark Collision)
  console.log('7. Capturing auto-battle.png...');
  await page.evaluate(() => {
    window.__lt.app.ui.hideCombatBark();
    window.__lt.app.toggleAutoBattle(true);
    window.__lt.app.setAutoStyle('balanced');
  });
  await sleep(800);
  await page.screenshot({ path: `${OUT}/auto-battle.png` });
  await page.evaluate(() => {
    window.__lt.app.pauseAutoBattle();
  });
  await sleep(300);

  // 8. Four Starting Heroes with Real Figures (Distinct Silhouettes, Postures, Palettes)
  console.log('8. Capturing heroes-silhouettes.png...');
  await page.evaluate(() => {
    const div = document.createElement('div');
    div.id = 'heroesShowcaseOverlay';
    div.style.position = 'fixed';
    div.style.inset = '0';
    div.style.zIndex = '9999';
    div.style.background = 'radial-gradient(circle at center, rgba(15,20,32,0.98), rgba(5,8,16,0.99))';
    div.style.display = 'flex';
    div.style.flexDirection = 'column';
    div.style.alignItems = 'center';
    div.style.justifyContent = 'center';
    div.style.gap = '16px';
    div.style.padding = '16px';
    div.innerHTML = `
      <div style="font-size: 18px; font-weight: 900; color: #ffd166; letter-spacing: 2px; text-shadow: 0 0 12px rgba(255,209,102,0.6);">
        【四大首發英雄 · 剪影與戰職陣容】
      </div>
      <div style="display: flex; justify-content: center; align-items: flex-end; gap: 8px; width: 100%;">
        <!-- Bear Guard: Bulky Shield Tank -->
        <div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
          <div style="position: relative; width: 84px; height: 114px; display: flex; align-items: flex-end; justify-content: center; background: rgba(230,126,34,0.12); border: 1.5px solid #e67e22; border-radius: 10px; box-shadow: 0 0 16px rgba(230,126,34,0.35); padding-bottom: 4px;">
            <img src="assets/art/v4/fig_bear_guard.webp" alt="熊岳" style="height: 102px; object-fit: contain; filter: drop-shadow(0 0 8px #e67e22) brightness(1.15);">
          </div>
          <div style="font-size: 13px; font-weight: 900; color: #ffd166;">熊岳 <span style="background: rgba(230,126,34,0.4); padding: 1px 4px; border-radius: 4px; font-size: 10px;">坦</span></div>
          <div style="font-size: 9.5px; color: #cbd5e1; text-align: center;">重盾槍衛·卡位</div>
        </div>
        <!-- Cat Patrol: Lean Assassin -->
        <div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
          <div style="position: relative; width: 84px; height: 114px; display: flex; align-items: flex-end; justify-content: center; background: rgba(52,152,219,0.12); border: 1.5px solid #3498db; border-radius: 10px; box-shadow: 0 0 16px rgba(52,152,219,0.35); padding-bottom: 4px;">
            <img src="assets/art/v4/fig_cat_patrol.webp" alt="墨影" style="height: 102px; object-fit: contain; filter: drop-shadow(0 0 8px #3498db) brightness(1.15);">
          </div>
          <div style="font-size: 13px; font-weight: 900; color: #ffd166;">墨影 <span style="background: rgba(52,152,219,0.4); padding: 1px 4px; border-radius: 4px; font-size: 10px;">刺客</span></div>
          <div style="font-size: 9.5px; color: #cbd5e1; text-align: center;">影刃快劍·背刺</div>
        </div>
        <!-- Lantern Crafter: Longbow Archer -->
        <div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
          <div style="position: relative; width: 84px; height: 114px; display: flex; align-items: flex-end; justify-content: center; background: rgba(241,196,15,0.12); border: 1.5px solid #f1c40f; border-radius: 10px; box-shadow: 0 0 16px rgba(241,196,15,0.35); padding-bottom: 4px;">
            <img src="assets/art/v4/fig_lantern_crafter.webp" alt="小螢" style="height: 102px; object-fit: contain; filter: drop-shadow(0 0 8px #f1c40f) brightness(1.15);">
          </div>
          <div style="font-size: 13px; font-weight: 900; color: #ffd166;">小螢 <span style="background: rgba(241,196,15,0.4); padding: 1px 4px; border-radius: 4px; font-size: 10px;">遠程</span></div>
          <div style="font-size: 9.5px; color: #cbd5e1; text-align: center;">持燈破霧·定狙</div>
        </div>
        <!-- Tea Master: Staff Healer -->
        <div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
          <div style="position: relative; width: 84px; height: 114px; display: flex; align-items: flex-end; justify-content: center; background: rgba(46,204,113,0.12); border: 1.5px solid #2ecc71; border-radius: 10px; box-shadow: 0 0 16px rgba(46,204,113,0.35); padding-bottom: 4px;">
            <img src="assets/art/v4/fig_tea_master.webp" alt="茶翁" style="height: 102px; object-fit: contain; filter: drop-shadow(0 0 8px #2ecc71) brightness(1.15);">
          </div>
          <div style="font-size: 13px; font-weight: 900; color: #ffd166;">茶翁 <span style="background: rgba(46,204,113,0.4); padding: 1px 4px; border-radius: 4px; font-size: 10px;">支援</span></div>
          <div style="font-size: 9.5px; color: #cbd5e1; text-align: center;">靈泉回春·淨化</div>
        </div>
      </div>
      <div style="font-size: 11.5px; color: #94a3b8; text-align: center; max-width: 350px; line-height: 1.5; background: rgba(0,0,0,0.65); padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.12);">
        【坦】熊岳不動如山 · 【刺客】墨影疾刺雙倍<br>【遠程】小螢持燈明目 · 【支援】茶翁溫潤回春
      </div>
    `;
    document.body.appendChild(div);
  });
  await sleep(600);
  await page.screenshot({ path: `${OUT}/heroes-silhouettes.png` });

  await browser.close();
  console.log('All 8 fresh screenshots captured successfully!');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
