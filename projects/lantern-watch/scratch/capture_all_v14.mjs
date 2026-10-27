import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const puppeteer = require("/workspace/nightly/shotkit/node_modules/puppeteer-core");

const URL = "http://127.0.0.1:8897/index.html";
const OUT = "screenshots/v14";
fs.mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function run() {
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    args: ["--no-sandbox", "--disable-gpu"]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  page.on("pageerror", e => console.error("Page error:", e.message));

  console.log("Navigating to", URL);
  await page.goto(URL, { waitUntil: "networkidle2" });
  await sleep(1000);

  // 1. prologue.png
  console.log("Capturing 1. prologue.png...");
  await page.evaluate(() => {
    window.__lt.app.ui.showPrologue(() => {});
  });
  await sleep(800);
  await page.screenshot({ path: `${OUT}/prologue.png` });
  console.log("Saved prologue.png");

  // Dismiss prologue
  await page.evaluate(() => {
    const el = document.getElementById('screenPrologue');
    if (el) el.classList.remove('active');
  });
  await sleep(400);

  // 2. docked-action-bar.png
  console.log("Capturing 2. docked-action-bar.png...");
  await page.evaluate(() => {
    localStorage.setItem('lt_tutorial_seen', '1');
    localStorage.setItem('lantern_tactics_v4_tutorial', '1');
    window.__lt.launchBattle(1);
  });
  await sleep(2500);

  await page.evaluate(() => {
    const bear = window.__lt.getBattle().allies.find(a => a.id === 'bear_guard');
    if (bear) {
      window.__lt.app.handleUnitTap(bear);
      window.__lt.app.stayInPlace(bear);
    }
  });
  await sleep(600);
  await page.screenshot({ path: `${OUT}/docked-action-bar.png` });
  console.log("Saved docked-action-bar.png");

  // 3. skill-sublist.png
  console.log("Capturing 3. skill-sublist.png...");
  await page.evaluate(() => {
    window.__lt.app.handleActionMenuChoice('skill');
  });
  await sleep(600);
  await page.screenshot({ path: `${OUT}/skill-sublist.png` });
  console.log("Saved skill-sublist.png");

  // 4. target-preview.png
  console.log("Capturing 4. target-preview.png...");
  await page.evaluate(() => {
    const sub = document.getElementById('actionSublistPanel');
    if (sub) sub.style.display = 'none';
    const bear = window.__lt.getBattle().allies.find(a => a.id === 'bear_guard');
    const foe = window.__lt.getBattle().enemies[0];
    if (bear && foe) {
      bear.acted = false;
      window.__lt.app.selectedUnit = bear;
      window.__lt.app.activeActionType = 'attack';
      window.__lt.app.evaluateTargetPreview(foe);
    }
  });
  await sleep(600);
  await page.screenshot({ path: `${OUT}/target-preview.png` });
  console.log("Saved target-preview.png");

  // 5. tutorial-magic.png
  console.log("Capturing 5. tutorial-magic.png...");
  await page.evaluate(() => {
    window.__lt.app.ui.hideTargetPreview();
    const lc = window.__lt.getBattle().allies.find(a => a.id === 'lantern_crafter');
    const archer = window.__lt.getBattle().enemies.find(e => e.id === 'shadow_archer');
    if (archer) {
      archer.element = 'wood';
      archer.x = 4; archer.y = 7;
    }
    if (lc) {
      lc.acted = false;
      window.__lt.app.selectedUnit = lc;
    }
    // Launch tutorial step 4 (5/7 屬性法術)
    window.__lt.app.startTutorialFlow(4);
    // Ensure both unit and enemy in range are framed above the docked bar
    window.__lt.app.ui.frameTiles([lc, archer], true);
  });
  await sleep(800);
  await page.screenshot({ path: `${OUT}/tutorial-magic.png` });
  console.log("Saved tutorial-magic.png");

  // 6. menu-open.png
  console.log("Capturing 6. menu-open.png...");
  await page.evaluate(() => {
    window.__lt.app.ui.hideBoardTutorial();
    const dd = document.getElementById('topMenuDropdown');
    if (dd) dd.style.display = 'block';
  });
  await sleep(600);
  await page.screenshot({ path: `${OUT}/menu-open.png` });
  console.log("Saved menu-open.png");

  // Close the menu explicitly so subsequent screenshots have NO overlay!
  await page.evaluate(() => {
    const dd = document.getElementById('topMenuDropdown');
    if (dd) dd.style.display = 'none';
    window.__lt.app.ui.hideBoardTutorial();
    window.__lt.app.ui.hideActionMenu();
    window.__lt.app.ui.hideTargetPreview();
    document.querySelectorAll('.spotlight-active').forEach(el => el.classList.remove('spotlight-active'));
  });
  await sleep(300);

  // 7. walk-midstride.png
  console.log("Capturing 7. walk-midstride.png...");
  await page.evaluate(() => {
    const dd = document.getElementById('topMenuDropdown');
    if (dd) dd.style.display = 'none';
    const cat = window.__lt.getBattle().allies.find(a => a.id === 'cat_patrol') || window.__lt.getBattle().allies[0];
    const el = document.querySelector(`[data-unit-id="${cat.id}"]`);
    if (!el) throw new Error("Cat patrol element not found");

    const rig = window.__lt.app.ui.buildWalkRig(el, false);
    if (!rig) throw new Error("buildWalkRig returned null for walking unit!");

    el.classList.add('is-walking');
    // Pose midstride: 38 deg leg swing, 6.5px bounce, 10 deg arm tilt
    rig.body.style.transform = `translate3d(0, -6.5px, 0) rotate(4deg)`;
    rig.legA.style.transform = `rotate(38deg)`;
    rig.legB.style.transform = `rotate(-38deg)`;
    rig.top.style.transform = `rotate(-10deg) skewX(0deg)`;
    window.__lt.app.ui.centerCameraOn(cat.x, cat.y, true);
  });
  await sleep(600);
  await page.screenshot({ path: `${OUT}/walk-midstride.png` });
  console.log("Saved walk-midstride.png");

  // 8. cavalry-gallop.png
  console.log("Capturing 8. cavalry-gallop.png...");
  await page.evaluate(() => {
    const dd = document.getElementById('topMenuDropdown');
    if (dd) dd.style.display = 'none';
    // Clean up previous walk rig
    document.querySelectorAll('.walk-rig').forEach(r => r.remove());
    document.querySelectorAll('.is-walking').forEach(w => w.classList.remove('is-walking'));

    // Fog rider (霧騎) at (4,4)
    const cav = window.__lt.getBattle().enemies.find(e => e.id === 'fog_rider') || window.__lt.getBattle().enemies[0];
    const el = document.querySelector(`[data-unit-id="${cav.id}"]`);
    if (!el) throw new Error("Fog rider element not found");

    const rig = window.__lt.app.ui.buildWalkRig(el, true);
    if (!rig) throw new Error("buildWalkRig returned null for cavalry unit!");

    el.classList.add('is-walking');
    // Cavalry gallop pose: 11px heave, 12deg pitch, 42deg leg reach, -38deg hind kick
    rig.body.style.transform = `translate3d(0, -11px, 0) rotate(12deg)`;
    rig.legA.style.transform = `rotate(42deg)`;
    rig.legB.style.transform = `rotate(-38deg)`;
    rig.top.style.transform = `rotate(-8deg) skewX(4deg)`;
    window.__lt.app.ui.centerCameraOn(cav.x, cav.y, true);
  });
  await sleep(600);
  await page.screenshot({ path: `${OUT}/cavalry-gallop.png` });
  console.log("Saved cavalry-gallop.png");

  await browser.close();
  console.log("ALL SCREENSHOTS CAPTURED SUCCESSFULLY!");
}

run().catch(e => {
  console.error("FAILED:", e);
  process.exit(1);
});
