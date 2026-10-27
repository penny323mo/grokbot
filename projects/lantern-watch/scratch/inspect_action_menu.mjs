import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const puppeteer = require("/workspace/nightly/shotkit/node_modules/puppeteer-core");

const b = await puppeteer.launch({executablePath:"/usr/bin/google-chrome", args:["--no-sandbox", "--disable-gpu"]});
for (const w of [390, 360]) {
  const p = await b.newPage();
  await p.setViewport({width: w, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true});
  await p.evaluateOnNewDocument(() => {
    localStorage.setItem("lt_tutorial_seen", "1");
    localStorage.setItem("lantern_tactics_v4_tutorial", "1");
  });
  await p.goto("http://127.0.0.1:8897/index.html", {waitUntil: "networkidle2"});
  await p.evaluate(() => window.__lt.launchBattle(1));
  await new Promise(r => setTimeout(r, 2000));
  const rects = await p.evaluate(() => {
    const app = window.__lt.app;
    const bt = window.__lt.getBattle();
    const u = bt.allies[0];
    app.selectedUnit = u;
    u.moved = true;
    app.ui.showActionMenu(0, 0, {
      attack: true,
      skill: true,
      magic: true,
      wait: true,
      undo: true,
      skillCost: 2,
      magicCost: 3
    }, () => {}, () => {}, null, u);
    const pop = document.getElementById("actionMenuPopover");
    const btns = [...pop.querySelectorAll(".btn-action-tactics")].filter(e => e.offsetParent).map(btn => ({
      id: btn.id,
      text: btn.innerText.replace(/\n/g, " "),
      rect: { l: btn.getBoundingClientRect().left, r: btn.getBoundingClientRect().right, w: btn.getBoundingClientRect().width, h: btn.getBoundingClientRect().height }
    }));
    return { pop: { l: pop.getBoundingClientRect().left, r: pop.getBoundingClientRect().right, w: pop.getBoundingClientRect().width }, btns, innerW: window.innerWidth };
  });
  console.log(`Viewport ${w}px:`, JSON.stringify(rects, null, 2));
  await p.screenshot({ path: `screenshots/play12/test-action-menu-${w}.png` });
  await p.close();
}
await b.close();
