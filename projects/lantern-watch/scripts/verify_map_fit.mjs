// E2E layout test: at battle start the whole 640x832 board fits between HUD and info strip,
// top bar fully visible, pinch/pan clamp, fit button. Exits non-zero on failure.
import fs from "node:fs";
import assert from "node:assert";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const puppeteer = require("/workspace/nightly/shotkit/node_modules/puppeteer-core");
const URL = process.argv[2] || "http://127.0.0.1:8897/index.html";
const OUT = "screenshots/v10-mapfit"; fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox", "--disable-gpu"] });
const errs = []; const results = [];
for (const [w, h] of [[390, 664], [390, 844]]) {
  for (const ch of [1, 6, 8]) {
    const p = await b.newPage();
    await p.setViewport({ width: w, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    p.on("pageerror", e => errs.push(`${w}x${h} ch${ch}: ${e.message}`));
    await p.evaluateOnNewDocument(() => { localStorage.setItem('lt_tutorial_seen', '1'); localStorage.setItem('lantern_tactics_v4_tutorial', '1'); });
    await p.goto(URL, { waitUntil: "networkidle2" }); await sleep(800);
    await p.evaluate((c) => window.__lt.launchBattle(c), ch); await sleep(2600);
    const m = await p.evaluate(() => {
      const R = (el) => { const r = el.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom }; };
      const vp = R(document.getElementById('battleViewport'));
      const stage = R(document.getElementById('battleBoardStage'));
      const nav = R(document.querySelector('.top-nav'));
      const hud = R(document.querySelector('.battle-hud-top'));
      const strip = R(document.getElementById('bottomTerrainStrip'));
      const b = window.__lt.getBattle();
      const figs = [...document.querySelectorAll('#figuresLayer [data-unit-id]')].filter(e => b.allies.some(a => a.id === e.dataset.unitId && a.hp > 0)).map(R);
      const hudBtns = [...document.querySelectorAll('.top-nav button, .battle-hud-top button')].filter(e => e.offsetParent).map(R);
      return { vp, stage, nav, hud, strip, figs, hudBtns, W: innerWidth, H: innerHeight };
    });
    const e = 1.5;
    const tag = `${w}x${h} ch${ch}`;
    assert.ok(m.stage.l >= m.vp.l - e && m.stage.r <= m.vp.r + e && m.stage.t >= m.vp.t - e && m.stage.b <= m.vp.b + e, `${tag}: board not inside viewport ${JSON.stringify(m.stage)} vs ${JSON.stringify(m.vp)}`);
    assert.ok(m.vp.t >= m.hud.b - e && m.vp.b <= m.strip.t + e, `${tag}: viewport overlaps HUD/strip`);
    assert.ok(m.nav.t >= -e && m.hud.t >= m.nav.b - e && m.strip.b <= m.H + e, `${tag}: top bar / strip off-screen`);
    for (const r of m.hudBtns) assert.ok(r.t >= -e && r.l >= -e && r.r <= m.W + e && r.b <= m.H + e, `${tag}: HUD button clipped ${JSON.stringify(r)}`);
    for (const r of m.figs) assert.ok(r.b > m.vp.t && r.t < m.vp.b && (r.l + r.r) / 2 >= m.vp.l && (r.l + r.r) / 2 <= m.vp.r, `${tag}: ally figure outside view`);
    const file = `${OUT}/${w}x${h}-ch${ch}-fit.png`;
    await p.screenshot({ path: file });
    // zoom + clamp + reset
    if (ch === 1) {
      const z = await p.evaluate(() => {
        const ui = window.__lt.app.ui, c = ui.camState();
        c.s = 2; c.fit = false; c.tx = 5000; c.ty = 5000; ui.applyCamera();
        const vp = document.getElementById('battleViewport').getBoundingClientRect();
        const st = document.getElementById('battleBoardStage').getBoundingClientRect();
        const a = { s: c.s, l: st.left - vp.left, t: st.top - vp.top };
        c.tx = -99999; c.ty = -99999; ui.applyCamera();
        const st2 = document.getElementById('battleBoardStage').getBoundingClientRect();
        const bb = { r: st2.right - vp.right, b: st2.bottom - vp.bottom };
        return { a, bb };
      });
      assert.ok(Math.abs(z.a.l) < 1.5 && Math.abs(z.a.t) < 1.5 && Math.abs(z.bb.r) < 1.5 && Math.abs(z.bb.b) < 1.5, `${tag}: pan clamp failed ${JSON.stringify(z)}`);
      await p.evaluate(() => { const ui = window.__lt.app.ui, c = ui.camState(); c.tx = -200; c.ty = -300; ui.applyCamera(); }); await sleep(200);
      await p.screenshot({ path: `${OUT}/${w}x${h}-ch1-zoomed.png` });
      await p.tap('#btnCamFit'); await sleep(200);
      const s = await p.evaluate(() => window.__lt.app.ui.camState().s.toFixed(3) === window.__lt.app.ui.fitScale().toFixed(3));
      assert.ok(s, `${tag}: fit button did not reset`);
      // orientation change -> refit
      await p.setViewport({ width: h, height: w, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); await sleep(500);
      await p.setViewport({ width: w, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); await sleep(500);
      const ok = await p.evaluate(() => { const v = document.getElementById('battleViewport').getBoundingClientRect(), s = document.getElementById('battleBoardStage').getBoundingClientRect(); return s.right <= v.right + 1.5 && s.bottom <= v.bottom + 1.5; });
      assert.ok(ok, `${tag}: not refit after rotation`);
    }
    results.push({ tag, file, scale: +(((m.stage.r - m.stage.l) / 640).toFixed(3)) });
    await p.close();
  }
}
await b.close();
console.log(JSON.stringify({ results, errs }, null, 1));
assert.strictEqual(errs.length, 0, 'page errors');
console.log("MAP FIT E2E: PASS");
