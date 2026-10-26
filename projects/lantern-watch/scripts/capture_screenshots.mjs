/**
 * scripts/capture_screenshots.mjs
 * Captures 10 deterministic screenshots at 390x844 (deviceScaleFactor: 2) into screenshots/v4/
 * Uses Puppeteer-core + Google Chrome.
 *
 * Screenshots list:
 * - 00-title.png
 * - 01-tutorial.png
 * - 02-select-move-range.png
 * - 03-action-menu.png
 * - 04-attack-preview.png
 * - 05-enemy-turn.png
 * - 06-world-map.png
 * - 07-prebattle.png
 * - 08-detail-sheet.png
 * - 09-dialogue.png
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
const SCREENSHOT_DIR = path.resolve(ROOT_DIR, "screenshots/v4");
const PORT = 8892;

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

function startServer() {
  const server = http.createServer((req, res) => {
    let reqPath = req.url.split("?")[0];
    if (reqPath === "/") reqPath = "/index.html";

    // Handle favicon.ico
    if (reqPath === "/favicon.ico") {
      res.writeHead(204);
      res.end();
      return;
    }

    // Handle shared back.js
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

  console.log("Ready to capture screenshots in screenshots/v4/...");

  // 1. 00-title.png
  await closeAllModals(page);
  await page.evaluate(() => {
    window.__lt.showScreen('screenTitle');
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "00-title.png") });
  console.log("Captured 00-title.png");

  // 2. 01-tutorial.png
  await page.evaluate(() => {
    window.__lt.showTutorial(0);
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "01-tutorial.png") });
  console.log("Captured 01-tutorial.png");
  await closeAllModals(page);

  // 3. 06-world-map.png
  await page.evaluate(() => {
    window.__lt.openWorldMap();
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "06-world-map.png") });
  console.log("Captured 06-world-map.png");

  // 4. 07-prebattle.png
  await page.evaluate(() => {
    window.__lt.openPreBattle(1);
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "07-prebattle.png") });
  console.log("Captured 07-prebattle.png");

  // 4b. 10-deploy.png
  await page.evaluate(() => {
    window.__lt.openDeployPhase(1);
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "10-deploy.png") });
  console.log("Captured 10-deploy.png");

  // 5. 09-dialogue.png
  await page.evaluate(() => {
    window.__lt.showDialogue(1);
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "09-dialogue.png") });
  console.log("Captured 09-dialogue.png");
  await closeAllModals(page);

  // 6. 08-detail-sheet.png
  await page.evaluate(() => {
    window.__lt.showDetailSheet('cat_patrol');
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "08-detail-sheet.png") });
  console.log("Captured 08-detail-sheet.png");
  await closeAllModals(page);

  // 7. 02-select-move-range.png
  await page.evaluate(() => {
    window.__lt.launchBattle(1);
    window.__lt.selectUnit('cat_patrol');
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "02-select-move-range.png") });
  console.log("Captured 02-select-move-range.png");

  // 8. 03-action-menu.png
  await page.evaluate(() => {
    const app = window.__lt.app;
    const cat = app.battle.allies.find(a => a.id === 'cat_patrol');
    if (cat) {
      app.selectedUnit = cat;
      app.battle.moveUnit(cat, 0, 9);
      app.stagedMoveTile = { x: 0, y: 9 };
      app.openActionMenuForUnit(cat);
      app.refreshBattleUI();
      app.ui.centerCameraOn(cat.x, cat.y);
    }
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "03-action-menu.png") });
  console.log("Captured 03-action-menu.png");

  // 9. 04-attack-preview.png
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

  // 10. 05-enemy-turn.png
  await page.evaluate(() => {
    const app = window.__lt.app;
    app.ui.hideTargetPreview();
    window.__lt.showEnemyTurnBanner();
  });
  await new Promise(r => setTimeout(r, 350));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "05-enemy-turn.png") });
  console.log("Captured 05-enemy-turn.png");

  await browser.close();
  server.close();

  if (consoleErrors.length > 0) {
    console.error(`[Screenshot Script] Errors detected during run (${consoleErrors.length}):`, consoleErrors);
    process.exit(1);
  } else {
    console.log("[Screenshot Script] All 10 screenshots captured successfully with 0 console errors!");
    process.exit(0);
  }
}

capture().catch((err) => {
  console.error("Screenshot capture failed:", err);
  process.exit(1);
});
