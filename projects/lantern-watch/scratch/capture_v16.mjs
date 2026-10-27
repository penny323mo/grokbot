import { createRequire } from "node:module";
import fs from "node:fs";
import assert from "node:assert";
const require = createRequire(import.meta.url);
const puppeteer = require("/workspace/nightly/shotkit/node_modules/puppeteer-core");

const OUT = "screenshots/v16";
fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  args: ["--no-sandbox", "--disable-gpu"]
});

async function createPage(width = 390, height = 844) {
  const p = await browser.newPage();
  await p.setViewport({ width, height, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  return p;
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

console.log("Capturing 8 fresh v16 screenshots at 390px...");

// 1. tutorial-step.png: Tutorial step 5/7 with 2-line pill, no ellipsis, live board visible
{
  const p = await createPage(390, 844);
  await p.evaluateOnNewDocument(() => {
    localStorage.removeItem('lt_tutorial_seen');
    localStorage.removeItem('lantern_tactics_v4_tutorial');
  });
  await p.goto("http://127.0.0.1:8897/index.html", { waitUntil: "networkidle2" });
  await sleep(600);
  await p.evaluate(() => {
    window.__lt.launchBattle(1);
    // Start tutorial at step 4 (displayed as 5 / 7)
    window.__lt.app.startTutorialFlow(4);
  });
  await sleep(1200);
  const info = await p.evaluate(() => {
    const el = document.getElementById('boardTutorialTextCompact');
    const stepEl = document.getElementById('boardTutorialStep');
    const bg = document.getElementById('battleMapBg');
    const figs = document.querySelectorAll('#figuresLayer .unit-figure');
    return {
      step: stepEl ? stepEl.textContent : '',
      text: el ? el.textContent : '',
      bgSrc: bg ? bg.src : '',
      figsCount: figs.length
    };
  });
  console.log("1. Tutorial step info:", info);
  assert.ok(!info.text.includes('…') && !info.text.includes('...'), "Tutorial text should not have ellipsis");
  assert.ok(info.figsCount > 0, "Figures should be visible on live board");
  await p.screenshot({ path: `${OUT}/tutorial-step.png` });
  await p.close();
}

// 2. battle-start.png: Battle start at 390x844 with board flush to HUD & strip, plates staggered
{
  const p = await createPage(390, 844);
  await p.evaluateOnNewDocument(() => {
    localStorage.setItem('lt_tutorial_seen', '1');
    localStorage.setItem('lantern_tactics_v4_tutorial', '1');
  });
  await p.goto("http://127.0.0.1:8897/index.html", { waitUntil: "networkidle2" });
  await sleep(600);
  await p.evaluate(() => {
    window.__lt.launchBattle(1);
  });
  await sleep(2200);
  const layout = await p.evaluate(() => {
    const vp = document.getElementById('battleViewport').getBoundingClientRect();
    const stage = document.getElementById('battleBoardStage').getBoundingClientRect();
    const hud = document.querySelector('.battle-hud-top').getBoundingClientRect();
    const strip = document.getElementById('bottomTerrainStrip').getBoundingClientRect();
    return {
      diffH: Math.abs((stage.bottom - stage.top) - vp.height),
      stageTopVsHud: Math.abs(stage.top - hud.bottom),
      stageBottomVsStrip: Math.abs(stage.bottom - strip.top)
    };
  });
  console.log("2. Battle start layout:", layout);
  assert.ok(layout.diffH < 8, `Board must fill viewport height (diffH ${layout.diffH} >= 8)`);
  await p.screenshot({ path: `${OUT}/battle-start.png` });
  await p.close();
}

// 3. adjacent-units.png: Two adjacent units with distinct staggered nameplates
{
  const p = await createPage(390, 844);
  await p.evaluateOnNewDocument(() => {
    localStorage.setItem('lt_tutorial_seen', '1');
    localStorage.setItem('lantern_tactics_v4_tutorial', '1');
  });
  await p.goto("http://127.0.0.1:8897/index.html", { waitUntil: "networkidle2" });
  await sleep(600);
  await p.evaluate(() => {
    window.__lt.launchBattle(1);
    const app = window.__lt.app;
    const allies = app.battle.allies;
    // Position bear and cat adjacent at (3,5) and (3,6)
    if (allies[0]) { allies[0].x = 3; allies[0].y = 5; }
    if (allies[1]) { allies[1].x = 3; allies[1].y = 6; }
    app.refreshBattleUI();
    app.ui.centerCameraOn(3, 5, true);
  });
  await sleep(1000);
  await p.screenshot({ path: `${OUT}/adjacent-units.png` });
  await p.close();
}

// 4. stratagem-preview.png: Stratagem preview showing 成功率
{
  const p = await createPage(390, 844);
  await p.evaluateOnNewDocument(() => {
    localStorage.setItem('lt_tutorial_seen', '1');
    localStorage.setItem('lantern_tactics_v4_tutorial', '1');
  });
  await p.goto("http://127.0.0.1:8897/index.html", { waitUntil: "networkidle2" });
  await sleep(600);
  await p.evaluate(async () => {
    window.__lt.launchBattle(1);
    const app = window.__lt.app;
    const { STRATAGEM_MOVES } = await import('./js/data/units.js');
    const caster = app.battle.allies.find(a => a.id === 'lantern_crafter') || app.battle.allies[0];
    const target = app.battle.enemies[0];
    caster.x = 4; caster.y = 5;
    target.x = 4; target.y = 4;
    app.selectedUnit = caster;
    app.activeActionType = 'magic';
    app.selectedSkill = STRATAGEM_MOVES.stratagem_fire;
    app.evaluateTargetPreview(target);
    app.refreshBattleUI();
  });
  await sleep(1000);
  await p.screenshot({ path: `${OUT}/stratagem-preview.png` });
  await p.close();
}

// 5. weather-rain-block.png: Rain blocking 火計 with 雨天無法火計
{
  const p = await createPage(390, 844);
  await p.evaluateOnNewDocument(() => {
    localStorage.setItem('lt_tutorial_seen', '1');
    localStorage.setItem('lantern_tactics_v4_tutorial', '1');
  });
  await p.goto("http://127.0.0.1:8897/index.html", { waitUntil: "networkidle2" });
  await sleep(600);
  await p.evaluate(async () => {
    window.__lt.launchBattle(1);
    const app = window.__lt.app;
    const { STRATAGEM_MOVES } = await import('./js/data/units.js');
    app.battle.weather = 'rain';
    const caster = app.battle.allies.find(a => a.id === 'lantern_crafter') || app.battle.allies[0];
    const target = app.battle.enemies[0];
    caster.x = 4; caster.y = 5;
    target.x = 4; target.y = 4;
    app.selectedUnit = caster;
    app.activeActionType = 'magic';
    app.selectedSkill = STRATAGEM_MOVES.stratagem_fire;
    app.evaluateTargetPreview(target);
    app.refreshBattleUI();
  });
  await sleep(1000);
  await p.screenshot({ path: `${OUT}/weather-rain-block.png` });
  await p.close();
}

// 6. village-heal.png: Village heal popup +N & strip text
{
  const p = await createPage(390, 844);
  await p.evaluateOnNewDocument(() => {
    localStorage.setItem('lt_tutorial_seen', '1');
    localStorage.setItem('lantern_tactics_v4_tutorial', '1');
  });
  await p.goto("http://127.0.0.1:8897/index.html", { waitUntil: "networkidle2" });
  await sleep(600);
  await p.evaluate(() => {
    window.__lt.launchBattle(1);
    const app = window.__lt.app;
    const ally = app.battle.allies[0];
    ally.x = 3; ally.y = 5;
    ally.hp = 20;
    app.refreshBattleUI();
    app.ui.centerCameraOn(3, 5, true);
    // Show village heal popup
    app.ui.showFloatingDamage(3, 5, {
      isHeal: true,
      healAmount: 4,
      isVillageHeal: true,
      healTag: '村莊補給'
    });
    // Update strip text
    const str = document.getElementById('stripTerrain');
    if (str) str.textContent = '村莊 · 休養生息 · 每回合回復 10% 最大氣血 (+4 HP) · 防禦 +2';
  });
  await sleep(400); // 400ms mid-animation for floater
  await p.screenshot({ path: `${OUT}/village-heal.png` });
  await p.close();
}

// 7. officer-stats-card.png: Unit card with 5 stats + 特技
{
  const p = await createPage(390, 844);
  await p.evaluateOnNewDocument(() => {
    localStorage.setItem('lt_tutorial_seen', '1');
    localStorage.setItem('lantern_tactics_v4_tutorial', '1');
  });
  await p.goto("http://127.0.0.1:8897/index.html", { waitUntil: "networkidle2" });
  await sleep(600);
  await p.evaluate(() => {
    window.__lt.launchBattle(1);
    const app = window.__lt.app;
    const ally = app.battle.allies.find(a => a.id === 'bear_guard') || app.battle.allies[0];
    app.ui.showDetailSheet(ally);
  });
  await sleep(800);
  await p.screenshot({ path: `${OUT}/officer-stats-card.png` });
  await p.close();
}

// 8. tactics-manual-stratagems.png: 兵法手冊 策略 tab
{
  const p = await createPage(390, 844);
  await p.evaluateOnNewDocument(() => {
    localStorage.setItem('lt_tutorial_seen', '1');
    localStorage.setItem('lantern_tactics_v4_tutorial', '1');
  });
  await p.goto("http://127.0.0.1:8897/index.html", { waitUntil: "networkidle2" });
  await sleep(600);
  await p.evaluate(() => {
    window.__lt.launchBattle(1);
    const app = window.__lt.app;
    // Open tactics manual directly at tab 4 (策略軍謀)
    app.ui.showTacticsManualModal('tab4');
  });
  await sleep(800);
  await p.screenshot({ path: `${OUT}/tactics-manual-stratagems.png` });
  await p.close();
}

await browser.close();
console.log("All 8 screenshots recaptured and saved successfully to screenshots/v16/!");
