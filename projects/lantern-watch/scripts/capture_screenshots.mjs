/**
 * scripts/capture_screenshots.mjs
 * Captures fresh deterministic screenshots at 390x844 (deviceScaleFactor: 2) into screenshots/v5/
 * Uses Puppeteer-core + Google Chrome.
 *
 * Screenshots list:
 * - 00-title.png (Title screen)
 * - 01-tutorial.png (Concise tactics tutorial modal)
 * - 02-select-move-range.png (Move range, grounded figures, zero Grokbot overlap)
 * - 03-action-menu.png (Tactics action menu)
 * - 04-attack-preview.png (Attack preview with counterattack & back-attack bonus)
 * - 05-spell-vfx.png (Spell VFX mid-frame with damage floater)
 * - 06-new-enemy-type.png (New enemy archetype: shield_guard with frontal shield reduction)
 * - 07-chapter2-board.png (Chapter 2 Gate defense board with new enemy archetypes)
 * - 08-level-up.png (Level-up 1-of-3 perk choice screen)
 * - 09-prebattle.png (Pre-battle screen with all enemy intel and no Grokbot overlap)
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
const SCREENSHOT_DIR = path.resolve(ROOT_DIR, "screenshots/v5");
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

  console.log("Ready to capture screenshots in screenshots/v5/...");

  // 1. 00-title.png
  await closeAllModals(page);
  await page.evaluate(() => {
    window.__lt.showScreen('screenTitle');
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "00-title.png") });
  console.log("Captured 00-title.png");

  // 2. 01-tutorial.png (Concise tactics tutorial modal over dimmed board)
  await page.evaluate(() => {
    window.__lt.launchBattle(1);
    window.__lt.showTacticsTutorial();
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "01-tutorial.png") });
  console.log("Captured 01-tutorial.png");
  await closeAllModals(page);

  // 3. 02-select-move-range.png (Move range on battle board with safe insets & hairline on walkable only)
  await page.evaluate(() => {
    window.__lt.launchBattle(1);
    window.__lt.selectUnit('cat_patrol');
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "02-select-move-range.png") });
  console.log("Captured 02-select-move-range.png");

  // 4. 03-action-menu.png (Tactics action menu: 攻擊/計策/法術/待命 clear of unit)
  await page.evaluate(() => {
    const app = window.__lt.app;
    const cat = app.battle.allies.find(a => a.id === 'cat_patrol');
    if (cat) {
      app.selectedUnit = cat;
      app.battle.moveUnit(cat, 4, 4);
      app.stagedMoveTile = { x: 4, y: 4 };
      app.openActionMenuForUnit(cat);
      app.refreshBattleUI();
      app.ui.centerCameraOn(cat.x, cat.y);
    }
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "03-action-menu.png") });
  console.log("Captured 03-action-menu.png");

  // 5. 04-attack-preview.png (Attack preview with counterattack & rightmost unit fully in frame)
  await page.evaluate(() => {
    const app = window.__lt.app;
    app.ui.hideActionMenu();
    const battle = window.__lt.getBattle();
    const cat = battle.allies.find(a => a.id === 'cat_patrol');
    const enemy = battle.enemies[0];
    if (cat && enemy) {
      cat.x = enemy.x;
      cat.y = enemy.y - 1;
      cat.turnStartX = cat.x;
      cat.turnStartY = cat.y;
      enemy.facing = 1;
      app.selectedUnit = cat;
      app.activeActionType = 'attack';
      app.evaluateTargetPreview(enemy);
      app.ui.centerCameraOn(cat.x, cat.y);
    }
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "04-attack-preview.png") });
  console.log("Captured 04-attack-preview.png");
  await closeAllModals(page);

  // 6. 05-spell-vfx.png (Spell VFX mid-frame with distinct silhouette & pure Chinese floater)
  await page.evaluate(() => {
    const app = window.__lt.app;
    app.ui.hideTargetPreview();
    app.launchBattleInstance(app.activeChapter);
    window.__lt.triggerSpellVfx('thunder');
  });
  await new Promise(r => setTimeout(r, 160)); // capture mid-strike showing jagged lightning bolt & attribute weakness
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "05-spell-vfx.png") });
  console.log("Captured 05-spell-vfx.png");
  await closeAllModals(page);

  // 7. 06-new-enemy-type.png (New enemy archetype detail sheet: shield_guard with custom lore & no relic equip)
  await page.evaluate(() => {
    window.__lt.showDetailSheet('shield_guard');
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "06-new-enemy-type.png") });
  console.log("Captured 06-new-enemy-type.png");
  await closeAllModals(page);

  // 8. 07-chapter2-board.png (Chapter 2 Gate defense board with all units fully inside top/bottom frame)
  await page.evaluate(() => {
    window.__lt.launchBattle(2);
    const app = window.__lt.app;
    app.ui.centerCameraOn(4, 4);
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "07-chapter2-board.png") });
  console.log("Captured 07-chapter2-board.png");
  await closeAllModals(page);

  // 9. 08-level-up.png (Level-up to Lv.2 with unit portrait and 2 perk choices)
  await page.evaluate(() => {
    window.__lt.showLevelUp('cat_patrol');
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "08-level-up.png") });
  console.log("Captured 08-level-up.png");
  await closeAllModals(page);

  // 10. 09-prebattle.png (Chapter 3 pre-battle showing all new archetypes & 鼓舞 fully visible)
  await page.evaluate(() => {
    window.__lt.openPreBattle(3);
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "09-prebattle.png") });
  console.log("Captured 09-prebattle.png");

  await browser.close();
  server.close();

  if (consoleErrors.length > 0) {
    console.error(`[Screenshot Script] Errors detected during run (${consoleErrors.length}):`, consoleErrors);
    process.exit(1);
  } else {
    console.log("[Screenshot Script] All 10 screenshots captured successfully into screenshots/v5/ with 0 console errors!");
    process.exit(0);
  }
}

capture().catch((err) => {
  console.error("Screenshot capture failed:", err);
  process.exit(1);
});
