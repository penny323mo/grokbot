// E2E: attack without moving, tutorial modal close, walk-cycle frames + frame timing (390px, CPU throttled)
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const puppeteer = require("/workspace/nightly/shotkit/node_modules/puppeteer-core");
const URL = process.argv[2] || "http://127.0.0.1:8897/index.html";
const OUT = "screenshots/v9-fix"; fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox", "--disable-gpu"] });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const errs = []; p.on("pageerror", e => errs.push(e.message));
await p.evaluateOnNewDocument(() => { localStorage.setItem('lt_tutorial_seen', '1'); localStorage.setItem('lantern_tactics_v4_tutorial', '1'); });
await p.goto(URL, { waitUntil: "networkidle2" }); await sleep(1200);
const R = {};
// 1) tutorial modal
await p.tap('#btnOpenTutorial'); await sleep(300);
R.tutStep = await p.$eval('#tutorialStepIndicator', e => e.textContent);
await p.tap('#btnCloseTutorialModal'); await sleep(300);
R.tutClosedByX = await p.$eval('#modalTutorial', e => getComputedStyle(e).display === 'none');
await p.tap('#btnOpenTutorial'); await sleep(200);
for (let i = 0; i < 7; i++) { await p.tap('#btnTutorialNext'); await sleep(120); }
R.tutClosedByFinish = await p.$eval('#modalTutorial', e => getComputedStyle(e).display === 'none');
await p.tap('#btnOpenTutorial'); await sleep(200); await p.mouse.click(10, 10); await sleep(200);
R.tutClosedByBackdrop = await p.$eval('#modalTutorial', e => getComputedStyle(e).display === 'none');
await p.tap('#btnOpenTutorial'); await sleep(200); await p.keyboard.press('Escape'); await sleep(200);
R.tutClosedByEsc = await p.$eval('#modalTutorial', e => getComputedStyle(e).display === 'none');
R.titleUsable = await p.evaluate(() => { const r = document.getElementById('btnOpenTutorial').getBoundingClientRect(); return document.elementFromPoint(r.x + r.width/2, r.y + r.height/2)?.closest('#btnOpenTutorial') !== null; });

// 2) battle setup: 墨影 (3,5) next to 霧騎 (4,5)
const setup = async () => p.evaluate(() => {
  const app = window.__lt.app;
  app.selectedSquadIds = ['bear_guard', 'cat_patrol', 'tea_master', 'lantern_crafter'];
  window.__lt.launchBattle(1);
  ['tutorialBoardOverlay','modalDialogue','combatBarkBanner'].forEach(id => { const e = document.getElementById(id); if (e) e.style.display = 'none'; });
  const bt = app.battle; const cat = bt.allies.find(a => a.id === 'cat_patrol');
  const occupied = (x, y) => bt.getAllLivingUnits().find(u => u.x === x && u.y === y);
  for (const u of bt.getAllLivingUnits()) if (u !== cat && ((u.x===3&&u.y===5)||(u.x===4&&u.y===5))) { u.y = 11; u.x = u.team==='ally'?0:9; }
  cat.x = 3; cat.y = 5;
  let rider = bt.enemies.find(e => e.id.startsWith('fog_rider')) || bt.enemies[0];
  rider.x = 4; rider.y = 5;
  bt.board.getTerrain && 0;
  app.clearSelection(); app.refreshBattleUI();
  return { cat: [cat.x, cat.y], rider: rider.id, riderName: rider.name };
});
const tapUnit = async (id) => {
  await p.evaluate((id) => { const el = document.querySelector(`[data-unit-id="${id}"]`); el.scrollIntoView({ block: 'center', inline: 'center' }); }, id);
  await sleep(250);
  const box = await (await p.$(`[data-unit-id="${id}"]`)).boundingBox();
  await p.tap(`[data-unit-id="${id}"]`).catch(async () => p.mouse.click(box.x + box.width/2, box.y + box.height/2));
  await sleep(250);
};
R.setup = await setup(); await sleep(1600);
// 2a) tap enemy in move stage -> attack preview, second tap confirms
await tapUnit('cat_patrol');
const riderId = R.setup.rider;
const hp0 = await p.evaluate(id => window.__lt.app.battle.enemies.find(e => e.id === id).hp, riderId);
await tapUnit(riderId);
await p.screenshot({ path: `${OUT}/01-attack-preview-in-place.png` });
R.previewShown = await p.evaluate(() => window.__lt.app.activeActionType === 'attack' && !!window.__lt.app.pendingTargetKey);
await tapUnit(riderId); await sleep(2500);
R.attackNoMove = await p.evaluate((id) => { const bt = window.__lt.app.battle; const c = bt.allies.find(a => a.id === 'cat_patrol'); const e = bt.enemies.find(x => x.id === id); return { cat: [c.x, c.y], acted: c.acted, riderHp: e ? e.hp : 0 }; }, riderId);
R.attackNoMove.hpBefore = hp0;
await p.screenshot({ path: `${OUT}/02-after-attack.png` });
// 2b) tap self -> action menu without moving
await setup(); await sleep(1600);
await tapUnit('cat_patrol'); await tapUnit('cat_patrol');
R.selfTapMenu = await p.evaluate(() => { const m = document.getElementById('actionMenuPopover'); return { menuVisible: !!m && getComputedStyle(m).display !== 'none', staged: window.__lt.app.stagedMoveTile }; });
await p.screenshot({ path: `${OUT}/03-self-tap-action-menu.png` });
{ const bb = await (await p.$('#btnActionAttack')).boundingBox();
  await p.mouse.move(bb.x + bb.width/2, bb.y + bb.height/2); await p.mouse.down(); await sleep(650);
  await p.screenshot({ path: `${OUT}/04-longpress-attack-info.png` });
  R.longPress = await p.evaluate(() => { const c = document.getElementById('actionInfoCard'); return { visible: !!c && c.style.display === 'block', text: c?.innerText.slice(0, 200), menuStillOpen: getComputedStyle(document.getElementById('actionMenuPopover')).display !== 'none', rangeTiles: window.__lt.app.attackableTiles.size }; });
  await p.mouse.up(); await sleep(250);
  R.longPressRelease = await p.evaluate(() => ({ cardHidden: document.getElementById('actionInfoCard').style.display === 'none', notSelected: window.__lt.app.activeActionType == null }));
  const sb = await (await p.$('#btnActionSkill')).boundingBox();
  await p.mouse.move(sb.x + sb.width/2, sb.y + sb.height/2); await p.mouse.down(); await sleep(650);
  await p.screenshot({ path: `${OUT}/05-longpress-skill-info.png` }); await p.mouse.up(); await sleep(200);
  await p.tap('#btnActionAttack'); await sleep(300);
  R.shortTapSelects = await p.evaluate(() => window.__lt.app.activeActionType);
}

// 3) walk frames (slowed for capture), then fps at normal speed with 4x CPU throttle
const cdp = await p.target().createCDPSession();
const far = () => p.evaluate(() => { const app = window.__lt.app, u = app.selectedUnit; const r = [...(app.reachableTiles.values ? app.reachableTiles.values() : app.reachableTiles)].map(k => typeof k === 'string' ? k.split(',').map(Number) : (k.x != null ? [k.x, k.y] : [k[0], k[1]])); r.sort((a, b) => (Math.abs(b[0]-u.x)+Math.abs(b[1]-u.y)) - (Math.abs(a[0]-u.x)+Math.abs(a[1]-u.y))); return r[0]; });
const walkCapture = async (unitId, to, tag, slowMs) => {
  await setup(); await sleep(1600);
  await p.evaluate(() => { const bt = window.__lt.app.battle; for (const e of bt.enemies) { if (e.y < 8) { e.y = 12; } } window.__lt.app.refreshBattleUI(); });
  await tapUnit(unitId);
  await p.evaluate(ms => { window.__ltWalkMs = ms; }, slowMs);
  const frames = []; to = await far(); R.walkTo = to;
  await p.evaluate(({ unitId, to }) => window.__lt.app.handleTileTap(to[0], to[1]), { unitId, to });
  for (let i = 0; i < 6; i++) {
    await sleep(slowMs * 3 / 6 * 0.95);
    const box = await p.evaluate((id) => { const r = document.querySelector(`[data-unit-id="${id}"]`).getBoundingClientRect(); return { x: r.x, y: r.y }; }, unitId);
    const f = `${OUT}/walk-${tag}-${i + 1}.png`;
    await p.screenshot({ path: f, clip: { x: Math.max(0, box.x - 60), y: Math.max(0, box.y - 50), width: 184, height: 150 } });
    frames.push(f);
  }
  await sleep(slowMs * 2);
  return frames;
};
R.framesFoot = await walkCapture('cat_patrol', [3, 2], 'foot', 1200);
R.framesCav = await p.evaluate(() => !!window.__lt.app.battle.allies.find(a => a.id === 'crane_rider'));
await p.evaluate(() => { window.__ltWalkMs = 0; });
// fps
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await setup(); await sleep(1600);
await tapUnit('cat_patrol');
await p.evaluate(t => { window.__fpsTo = t; }, await far());
await p.evaluate(() => { window.__lt.app.handleTileTap(...window.__fpsTo); });
await sleep(1200);
const ft = await p.evaluate(() => (window.__lt.app.ui.walkFrameTimes||[]).slice());
// enemy turn walk timing
await p.evaluate(() => { const app = window.__lt.app; app.clearSelection(); app.triggerEnemyTurn(); });
await sleep(9000);
const ftE = await p.evaluate(() => (window.__lt.app.ui.walkFrameTimes||[]).slice());
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
const stats = (a) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return { frames: a.length, avgMs: +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(2), p95Ms: +s[Math.floor(s.length * 0.95)].toFixed(2), maxMs: +s[s.length - 1].toFixed(2), over20ms: a.filter(x => x > 20).length }; };
R.fpsPlayer = stats(ft); R.fpsEnemy = stats(ftE);
R.errors = errs;
console.log(JSON.stringify(R, null, 1));
await b.close();
