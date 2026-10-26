/**
 * scripts/capture_screenshots.mjs
 * Captures fresh deterministic screenshots at 390x844 (deviceScaleFactor: 2) into screenshots/v6/
 * Uses Puppeteer-core + Google Chrome.
 *
 * Screenshots list:
 * - 00-title.png (Full-bleed painted key-art title screen with drifting mist & lanterns)
 * - 01-prebattle.png (Chapter 5 pre-battle with painted chapter banner & 2-column intel grid)
 * - 02-move-range.png (Movement range on live battle board with safe insets)
 * - 03-attack-preview.png (Compact attack preview panel with combo ally bonus & auto-panned board)
 * - 04-spell-vfx-thunder.png (Thunder VFX mid-frame with full-height bolt, white flash & floating tag)
 * - 05-spell-vfx-fire.png (Fire VFX mid-frame with flame burst & ember scorch)
 * - 06-spell-vfx-heal.png (Jade heal pillar VFX with glowing petals & floating +HP tag)
 * - 07-combo-attack.png (Combo / 協力攻擊 ally assist strike with floating tag)
 * - 08-new-chapter-board.png (Chapter 5 Bamboo Pass board with nocturnal mist & summit shrine)
 * - 09-level-up.png (Level-up modal with painted frame, large portrait & class promotion path)
 * - 10-post-battle.png (Post-battle victory with animated XP bars, equipment drop & dialogue)
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const puppeteer = require("/workspace/nightly/shotkit/node_modules/puppeteer-core");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const SCREENSHOT_DIR = path.resolve(ROOT_DIR, "screenshots/v6");
const PORT = 8892;

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

function startServer() {
  const server = http.createServer((req, res) => {
    let reqPath = req.url.split("?")[0];
    if (reqPath === "/") reqPath = "/index.html";

    if (reqPath === "/favicon.ico") {
      res.writeHead(204);
      res.end();
      return;
    }

    if (reqPath.startsWith("/_shared/")) {
      const sharedPath = path.join("/workspace/grokbot/projects", reqPath);
      if (fs.existsSync(sharedPath)) {
        res.writeHead(200, { "Content-Type": "application/javascript" });
        fs.createReadStream(sharedPath).pipe(res);
        return;
      }
    }

    const filePath = path.join(ROOT_DIR, reqPath);

    if (!fs.existsSync(filePath)) {
      console.warn(`[404]: ${reqPath} (looked at ${filePath})`);
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 Not Found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      ".html": "text/html",
      ".css": "text/css",
      ".js": "application/javascript",
      ".mjs": "application/javascript",
      ".json": "application/json",
      ".svg": "image/svg+xml",
      ".png": "image/png",
      ".webp": "image/webp",
      ".mp3": "audio/mpeg",
      ".m4a": "audio/mp4"
    };

    res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
    fs.createReadStream(filePath).pipe(res);
  });

  return new Promise((resolve) => server.listen(PORT, "127.0.0.1", () => resolve(server)));
}

async function closeAllModals(page) {
  await page.evaluate(() => {
    ['modalDialogue', 'modalTutorial', 'modalDetailSheet', 'modalLevelUp', 'modalBattleResult', 'tutorialBoardOverlay', 'deployTrayBar'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
  });
}

async function capture() {
  const server = await startServer();
  console.log(`[Screenshot Server] Running at http://127.0.0.1:${PORT}`);

  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('lt_tutorial_seen', '1');
  });

  await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: "networkidle0" });
  await page.waitForFunction(() => !!window.__lt);

  console.log("Ready to capture screenshots into screenshots/v6/...");

  // 1. 00-title.png (Full-bleed painted key art title screen with drifting mist)
  await closeAllModals(page);
  await page.evaluate(() => {
    window.__lt.showScreen('screenTitle');
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "00-title.png") });
  console.log("Captured 00-title.png");

  // 2. 01-prebattle.png (Chapter 5 pre-battle with banner, 2-column intel grid, wrapping squad, visible stratagems)
  await page.evaluate(() => {
    window.__lt.openPreBattle(5);
    const scrollEl = document.querySelector('.prebattle-body-scroll');
    if (scrollEl) {
      scrollEl.scrollTop = 110;
    }
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "01-prebattle.png") });
  console.log("Captured 01-prebattle.png");
  await closeAllModals(page);

  // 3. 02-move-range.png (Move range on live battle board with safe insets)
  await page.evaluate(() => {
    window.__lt.launchBattle(1);
    window.__lt.selectUnit('cat_patrol');
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "02-move-range.png") });
  console.log("Captured 02-move-range.png");

  // 4. 03-attack-preview.png (Compact single-row preview panel, combo badge, auto-panned board)
  await page.evaluate(() => {
    const app = window.__lt.app;
    app.ui.hideActionMenu();
    app.launchBattleInstance(app.activeChapter);
    const battle = app.battle;
    const cat = battle.allies.find(a => a.id === 'cat_patrol');
    const bear = battle.allies.find(a => a.id === 'bear_guard');
    const enemy = battle.enemies[0];
    if (cat && enemy) {
      enemy.x = 4;
      enemy.y = 4;
      enemy.facing = 1;
      cat.x = 3;
      cat.y = 4;
      cat.turnStartX = 3;
      cat.turnStartY = 4;
      cat.facing = 1;
      if (bear) {
        bear.x = 4;
        bear.y = 3;
        bear.turnStartX = 4;
        bear.turnStartY = 3;
        bear.facing = 1;
      }
      // Position other allies nearby in rows 2-4 so no unit rings peek from under the preview card
      const others = battle.allies.filter(a => a.id !== 'cat_patrol' && a.id !== 'bear_guard');
      if (others[0]) { others[0].x = 2; others[0].y = 3; others[0].turnStartX = 2; others[0].turnStartY = 3; }
      if (others[1]) { others[1].x = 2; others[1].y = 4; others[1].turnStartX = 2; others[1].turnStartY = 4; }
      if (others[2]) { others[2].x = 3; others[2].y = 2; others[2].turnStartX = 3; others[2].turnStartY = 2; }
      if (others[3]) { others[3].x = 4; others[3].y = 2; others[3].turnStartX = 4; others[3].turnStartY = 2; }

      app.refreshBattleUI();
      app.selectedUnit = cat;
      app.activeActionType = 'attack';
      app.evaluateTargetPreview(enemy);
    }
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "03-attack-preview.png") });
  console.log("Captured 03-attack-preview.png");
  await closeAllModals(page);

  // 5. 04-spell-vfx-thunder.png (Thunder bolt from top + white flash + ground crack)
  await page.evaluate(() => {
    const app = window.__lt.app;
    app.ui.hideTargetPreview();
    app.launchBattleInstance(app.activeChapter);
    app.battle.allies.forEach((a, i) => { a.x = 2 + (i % 3); a.y = 2 + Math.floor(i / 3); a.turnStartX = a.x; a.turnStartY = a.y; });
    app.refreshBattleUI();
    app.ui.centerCameraOn(4.5, 3.5);
    window.__lt.triggerSpellVfx('thunder');
  });
  await new Promise(r => setTimeout(r, 240));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "04-spell-vfx-thunder.png") });
  console.log("Captured 04-spell-vfx-thunder.png");
  await closeAllModals(page);

  // 6. 05-spell-vfx-fire.png (Fire burst + embers + scorch)
  await page.evaluate(() => {
    const app = window.__lt.app;
    app.ui.hideTargetPreview();
    app.launchBattleInstance(app.activeChapter);
    app.battle.allies.forEach((a, i) => { a.x = 2 + (i % 3); a.y = 2 + Math.floor(i / 3); a.turnStartX = a.x; a.turnStartY = a.y; });
    app.refreshBattleUI();
    app.ui.centerCameraOn(4.5, 3.5);
    window.__lt.triggerSpellVfx('fire');
  });
  // Spawns at 120ms; at 120ms + 160ms = 280ms, vfxFire is at peak scale (1.15) and full opacity
  await new Promise(r => setTimeout(r, 290));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "05-spell-vfx-fire.png") });
  console.log("Captured 05-spell-vfx-fire.png");
  await closeAllModals(page);

  // 7. 06-spell-vfx-heal.png (Jade light pillar + petals + floating +HP)
  await page.evaluate(() => {
    const app = window.__lt.app;
    app.ui.hideTargetPreview();
    app.launchBattleInstance(app.activeChapter);
    app.battle.allies.forEach((a, i) => { a.x = 2 + (i % 3); a.y = 2 + Math.floor(i / 3); a.turnStartX = a.x; a.turnStartY = a.y; });
    app.refreshBattleUI();
    app.ui.centerCameraOn(4.5, 3.5);
    window.__lt.triggerSpellVfx('heal');
  });
  await new Promise(r => setTimeout(r, 240));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "06-spell-vfx-heal.png") });
  console.log("Captured 06-spell-vfx-heal.png");
  await closeAllModals(page);

  // 8. 07-combo-attack.png (Combo / 協力攻擊 assist with floating badge)
  await page.evaluate(() => {
    const app = window.__lt.app;
    app.ui.hideTargetPreview();
    app.launchBattleInstance(app.activeChapter);
    app.battle.allies.forEach((a, i) => { a.x = 2 + (i % 3); a.y = 2 + Math.floor(i / 3); a.turnStartX = a.x; a.turnStartY = a.y; });
    app.refreshBattleUI();
    app.ui.centerCameraOn(4.5, 3.5);
    window.__lt.triggerComboVfx();
  });
  // Combo assist triggers at 120ms + 220ms = 340ms; at 400ms 【協力合擊！】 badge is mid-frame above target
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "07-combo-attack.png") });
  console.log("Captured 07-combo-attack.png");
  await closeAllModals(page);

  // 9. 08-new-chapter-board.png (Chapter 5 Bamboo Pass map with nocturnal mist)
  await page.evaluate(() => {
    window.__lt.launchBattle(5);
    const app = window.__lt.app;
    // Frame the deployment squad at rows 11-12 with >=64px clearance above Grokbot chip
    app.ui.centerCameraOn(4.5, 10.5);
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "08-new-chapter-board.png") });
  console.log("Captured 08-new-chapter-board.png");
  await closeAllModals(page);

  // 10. 09-level-up.png (Painted frame modal, large portrait, class promotion choice)
  await page.evaluate(() => {
    window.__lt.showLevelUp('cat_patrol');
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "09-level-up.png") });
  console.log("Captured 09-level-up.png");
  await closeAllModals(page);

  // 11. 10-post-battle.png (Post-battle victory with animated XP bars, equipment drop, story dialogue)
  await page.evaluate(() => {
    window.__lt.launchBattle(5);
    window.__lt.showBattleResultModal(true, 5);
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "10-post-battle.png") });
  console.log("Captured 10-post-battle.png");

  await browser.close();
  server.close();

  if (consoleErrors.length > 0) {
    console.error(`[Screenshot Script] Errors detected during run (${consoleErrors.length}):`, consoleErrors);
    process.exit(1);
  } else {
    console.log("[Screenshot Script] All 11 screenshots captured successfully into screenshots/v6/ with 0 console errors!");
    process.exit(0);
  }
}

capture().catch((err) => {
  console.error("Screenshot capture failed:", err);
  process.exit(1);
});
