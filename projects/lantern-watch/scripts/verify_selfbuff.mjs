// E2E: 熊岳 casts 鐵壁之陣 via the real action menu at 390px. Asserts no HP loss, no damage float,
// no hurt/lunge anim on caster; captures screenshot mid-cast. Exits non-zero on failure.
import fs from "node:fs";
import assert from "node:assert";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const puppeteer = require("/workspace/nightly/shotkit/node_modules/puppeteer-core");
const URL = process.argv[2] || "http://127.0.0.1:8897/index.html";
const OUT = process.argv[3] || "screenshots/v11-selfbuff"; fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox", "--disable-gpu"] });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const errs = []; p.on("pageerror", e => errs.push(e.message));
await p.evaluateOnNewDocument(() => { localStorage.setItem('lt_tutorial_seen', '1'); localStorage.setItem('lantern_tactics_v4_tutorial', '1'); });
await p.goto(URL, { waitUntil: "networkidle2" }); await sleep(800);
await p.evaluate(() => window.__lt.launchBattle(1)); await sleep(2600);
const before = await p.evaluate(() => {
  const app = window.__lt.app, b = window.__lt.getBattle(), u = b.allies.find(a => a.id === 'bear_guard');
  window.__obs = { hurt: false, lunge: false, dmg: [] };
  new MutationObserver(ms => { for (const m of ms) {
    const t = m.target; if (t.dataset?.unitId === 'bear_guard' && m.type === 'attributes') {
      if (/anim-hurt/.test(t.className)) window.__obs.hurt = true;
      if (/anim-lunge/.test(t.className)) window.__obs.lunge = true; }
    for (const n of m.addedNodes || []) if (n.nodeType === 1 && /damage|dmg/i.test(n.className) && !/heal/i.test(n.className)) window.__obs.dmg.push(n.textContent);
  } }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
  const snap = { hp: u.hp, def: u.def };
  app.selectedUnit = u; u.moved = true;
  app.handleActionMenuChoice('magic', true);
  return snap;
});
await sleep(250);
await p.screenshot({ path: `${OUT}/390-bear-cast.png` });
await sleep(1200);
const after = await p.evaluate(() => { const u = window.__lt.getBattle().allies.find(a => a.id === 'bear_guard'); return { hp: u.hp, def: u.def, obs: window.__obs }; });
console.log(JSON.stringify({ before, after, errs }));
await b.close();
assert.strictEqual(after.hp, before.hp, 'caster lost HP');
assert.ok(!after.obs.hurt, 'hurt animation played on caster');
assert.ok(!after.obs.lunge, 'attack lunge played on caster');
assert.deepStrictEqual(after.obs.dmg, [], 'damage float shown');
assert.strictEqual(after.def, before.def + 4);
console.log('selfbuff ok');
