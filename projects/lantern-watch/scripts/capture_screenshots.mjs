/**
 * scripts/capture_screenshots.mjs
 * Captures fresh deterministic screenshots at 390x844 (deviceScaleFactor: 2) into screenshots/v7/
 * Uses Puppeteer-core + Google Chrome.
 *
 * Screenshots list:
 * - 00-title.png (Full-bleed painted key-art title screen with lantern crest, drifting mist)
 * - 01-worldmap-camp.png (World map with 6 chapter nodes & Camp button)
 * - 02-camp-profile.png (Camp screen with character profile, equipment slots, promotion option)
 * - 03-prebattle.png (Chapter 6 Citadel Siege pre-battle with banner, intel, objectives)
 * - 04-move-range.png (Soft ink-wash movement range highlight & glowing dotted path preview)
 * - 05-attack-preview.png (Compact attack preview panel with combo ally assistance)
 * - 06-fog-of-war.png (Chapter 5 Bamboo Pass night fog board with hidden silhouette enemies)
 * - 07-stratagem-flood.png (水淹 flood terrain conversion with active water wave VFX)
 * - 08-archetype-siege.png (New archetype 霹靂砲車 with [3, 5] bombardment & blind zone)
 * - 09-ch6-siege-board.png (Chapter 6 Citadel Siege board with walls, moat, bridge, iron gate)
 * - 10-post-battle-mvp.png (Post-battle victory with varied action XP & MVP gold laurels badge)
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
const SCREENSHOT_DIR = path.resolve(ROOT_DIR, "screenshots/v7");
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

  console.log("Ready to capture screenshots into screenshots/v7/...");

  // 1. 00-title.png (Full-bleed painted key art title screen with lantern crest)
  await closeAllModals(page);
  await page.evaluate(() => {
    window.__lt.showScreen('screenTitle');
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "00-title.png") });
  console.log("Captured 00-title.png");

  // 2. 01-worldmap-camp.png (World map with Camp button)
  await page.evaluate(() => {
    window.__lt.openWorldMap();
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "01-worldmap-camp.png") });
  console.log("Captured 01-worldmap-camp.png");

  // 3. 02-camp-profile.png (Camp screen with character profile, equipment, promotion)
  await page.evaluate(() => {
    const app = window.__lt.app;
    app.campaign.equipRelic('cat_patrol', 'sword_yitian');
    window.__lt.openCamp('cat_patrol');
    const scrollEl = document.querySelector('.camp-content-scrollable');
    if (scrollEl) {
      scrollEl.scrollTop = 110;
    }
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "02-camp-profile.png") });
  console.log("Captured 02-camp-profile.png");

  // 4. 03-prebattle.png (Chapter 6 Siege pre-battle with banner_ch6 and 2x2 intel)
  await page.evaluate(() => {
    window.__lt.openPreBattle(6);
    const scrollEl = document.querySelector('.prebattle-body-scroll');
    if (scrollEl) {
      scrollEl.scrollTop = 0;
    }
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "03-prebattle.png") });
  console.log("Captured 03-prebattle.png");
  await closeAllModals(page);

  // 5. 04-move-range.png (Move range with soft ink-wash highlight & dotted path preview)
  await page.evaluate(() => {
    window.__lt.launchBattle(1);
    window.__lt.selectUnit('cat_patrol');
    // Hover on destination tile (1, 8) to preview dotted ink path
    const destTile = document.querySelector('.grid-tile[data-x="1"][data-y="8"]');
    if (destTile) {
      destTile.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }));
    }
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "04-move-range.png") });
  console.log("Captured 04-move-range.png");

  // 6. 05-attack-preview.png (Compact attack preview panel with combo ally assistance & lunge proof)
  await page.evaluate(() => {
    window.__lt.launchBattle(1);
    const app = window.__lt.app;
    app.ui.hideActionMenu();
    const battle = app.battle;
    const cat = battle.allies.find(a => a.id === 'cat_patrol');
    const bear = battle.allies.find(a => a.id === 'bear_guard');
    const enemy = battle.enemies[0];
    if (cat && enemy) {
      enemy.x = 4;
      enemy.y = 5;
      enemy.facing = -1;
      cat.x = 3;
      cat.y = 5;
      cat.turnStartX = 3;
      cat.turnStartY = 5;
      cat.facing = 1;
      if (bear) {
        bear.x = 4;
        bear.y = 4;
        bear.turnStartX = 4;
        bear.turnStartY = 4;
        bear.facing = 1;
      }
      const others = battle.allies.filter(a => a.id !== 'cat_patrol' && a.id !== 'bear_guard');
      if (others[0]) { others[0].x = 2; others[0].y = 5; others[0].turnStartX = 2; others[0].turnStartY = 5; }
      if (others[1]) { others[1].x = 3; others[1].y = 6; others[1].turnStartX = 3; others[1].turnStartY = 6; }
      if (others[2]) { others[2].x = 4; others[2].y = 6; others[2].turnStartX = 4; others[2].turnStartY = 6; }
      if (others[3]) { others[3].x = 5; others[3].y = 6; others[3].turnStartX = 5; others[3].turnStartY = 6; }

      const otherEnemies = battle.enemies.filter(e => e !== enemy);
      if (otherEnemies[0]) { otherEnemies[0].x = 5; otherEnemies[0].y = 5; }
      if (otherEnemies[1]) { otherEnemies[1].x = 6; otherEnemies[1].y = 5; }
      if (otherEnemies[2]) { otherEnemies[2].x = 5; otherEnemies[2].y = 4; }
      if (otherEnemies[3]) { otherEnemies[3].x = 6; otherEnemies[3].y = 4; }
      if (otherEnemies[4]) { otherEnemies[4].x = 7; otherEnemies[4].y = 4; }

      app.refreshBattleUI();
      app.selectedUnit = cat;
      app.activeActionType = 'attack';
      app.evaluateTargetPreview(enemy);

      // Add directional lunges to both attacker and combo ally
      const catFig = document.querySelector('.unit-figure[data-id="cat_patrol"]');
      if (catFig) catFig.classList.add('lunge-right');
      const bearFig = document.querySelector('.unit-figure[data-id="bear_guard"]');
      if (bearFig) bearFig.classList.add('lunge-down');

      const vp = document.getElementById('battleViewport');
      if (vp) {
        vp.scrollTo({ left: 64, top: 110, behavior: 'auto' });
      }
    }
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "05-attack-preview.png") });
  console.log("Captured 05-attack-preview.png");
  await closeAllModals(page);

  // 7. 06-fog-of-war.png (Chapter 5 Bamboo Pass with nocturnal fog & silhouette enemies)
  await page.evaluate(() => {
    window.__lt.launchBattle(5);
    const app = window.__lt.app;
    app.ui.centerCameraOn(4.5, 7.0);
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "06-fog-of-war.png") });
  console.log("Captured 06-fog-of-war.png");
  await closeAllModals(page);

  // 8. 07-stratagem-flood.png (水淹 flood terrain conversion & authentic water wave VFX)
  await page.evaluate(() => {
    window.__lt.launchBattle(1);
    const app = window.__lt.app;
    const battle = app.battle;

    // Reposition combatants engaging around the river bridge:
    // Enemies held on north bank (rows 4-5), allies formed on south bank (rows 9-10)
    if (battle.enemies[0]) { battle.enemies[0].x = 4; battle.enemies[0].y = 5; }
    if (battle.enemies[1]) { battle.enemies[1].x = 5; battle.enemies[1].y = 5; }
    if (battle.enemies[2]) { battle.enemies[2].x = 6; battle.enemies[2].y = 4; }
    if (battle.enemies[3]) { battle.enemies[3].x = 3; battle.enemies[3].y = 4; }
    if (battle.enemies[4]) { battle.enemies[4].x = 7; battle.enemies[4].y = 4; }

    const allies = battle.allies;
    if (allies[0]) { allies[0].x = 3; allies[0].y = 9; }
    if (allies[1]) { allies[1].x = 4; allies[1].y = 9; }
    if (allies[2]) { allies[2].x = 5; allies[2].y = 9; }
    if (allies[3]) { allies[3].x = 3; allies[3].y = 10; }
    if (allies[4]) { allies[4].x = 4; allies[4].y = 10; }
    if (allies[5]) { allies[5].x = 5; allies[5].y = 10; }

    battle.triggerWaterFlood(6, 8);
    app.refreshBattleUI();
    app.ui.centerCameraOn(4.5, 6.5);
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "07-stratagem-flood.png") });
  console.log("Captured 07-stratagem-flood.png");
  await closeAllModals(page);

  // 9. 08-archetype-siege.png (Siege engine bombardment [3, 5] and blind zone rush)
  await page.evaluate(() => {
    window.__lt.launchBattle(6);
    const app = window.__lt.app;
    const battle = app.battle;
    const siege = battle.enemies.find(e => e.id === 'siege_engine');
    if (siege) {
      // Position allies actively rushing the siege engine's blind zone (range 1-2)
      const allies = battle.allies;
      if (allies[0]) { allies[0].x = 2; allies[0].y = 3; } // Cat right in front of catapult (blind zone!)
      if (allies[1]) { allies[1].x = 3; allies[1].y = 2; } // Crane flanking catapult (blind zone!)
      if (allies[2]) { allies[2].x = 3; allies[2].y = 4; }
      if (allies[3]) { allies[3].x = 4; allies[3].y = 4; }
      if (allies[4]) { allies[4].x = 5; allies[4].y = 4; }
      if (allies[5]) { allies[5].x = 4; allies[5].y = 5; }

      app.refreshBattleUI();
      app.ui.centerCameraOn(3.5, 3.5);

      // Highlight range [3, 5] strictly on valid passable cells
      const rangeTiles = [];
      for (let r = 0; r < 13; r++) {
        for (let c = 0; c < 10; c++) {
          const d = Math.abs(c - siege.x) + Math.abs(r - siege.y);
          if (d >= 3 && d <= 5 && !battle.board.isImpassable(c, r, false)) {
            rangeTiles.push(`${c},${r}`);
          }
        }
      }
      document.querySelectorAll('.grid-tile').forEach(el => {
        const key = `${el.dataset.x},${el.dataset.y}`;
        if (rangeTiles.includes(key)) el.classList.add('aoe-preview');
      });
    }
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "08-archetype-siege.png") });
  console.log("Captured 08-archetype-siege.png");
  await closeAllModals(page);

  // 10. 09-ch6-siege-board.png (Chapter 6 Citadel Siege full board view)
  await page.evaluate(() => {
    window.__lt.launchBattle(6);
    const app = window.__lt.app;
    const battle = app.battle;

    // Stage player squad deployed on the bridge approach (rows 8-9)
    const allies = battle.allies;
    if (allies[0]) { allies[0].x = 3; allies[0].y = 8; }
    if (allies[1]) { allies[1].x = 4; allies[1].y = 8; }
    if (allies[2]) { allies[2].x = 5; allies[2].y = 8; }
    if (allies[3]) { allies[3].x = 3; allies[3].y = 9; }
    if (allies[4]) { allies[4].x = 4; allies[4].y = 9; }
    if (allies[5]) { allies[5].x = 5; allies[5].y = 9; }

    app.refreshBattleUI();
    app.ui.centerCameraOn(4.5, 5.2);
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "09-ch6-siege-board.png") });
  console.log("Captured 09-ch6-siege-board.png");
  await closeAllModals(page);

  // 11. 10-post-battle-mvp.png (Post-battle victory with varied XP & MVP highlight badge)
  await page.evaluate(() => {
    window.__lt.launchBattle(6);
    const app = window.__lt.app;
    app.battle.actionScores['cat_patrol'] = 88;
    app.battle.actionScores['bear_guard'] = 55;
    app.battle.actionScores['tea_master'] = 45;
    app.battle.actionScores['crane_rider'] = 62;
    window.__lt.showBattleResultModal(true, 6);
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "10-post-battle-mvp.png") });
  console.log("Captured 10-post-battle-mvp.png");

  await browser.close();
  server.close();

  if (consoleErrors.length > 0) {
    console.error(`[Screenshot Script] Errors detected during run (${consoleErrors.length}):`, consoleErrors);
    process.exit(1);
  } else {
    console.log("[Screenshot Script] All 11 screenshots captured successfully into screenshots/v7/ with 0 console errors!");
    process.exit(0);
  }
}

capture().catch((err) => {
  console.error("Screenshot capture failed:", err);
  process.exit(1);
});
