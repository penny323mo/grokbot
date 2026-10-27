/**
 * scripts/capture_screenshots.mjs
 * Captures fresh deterministic screenshots at 390x844 (deviceScaleFactor: 2) into screenshots/v8/
 * Uses Puppeteer-core + Google Chrome.
 *
 * Screenshots list:
 * - 00-title.png (Key-art title screen with lantern-lit foreground vignette and calligraphy)
 * - 01-worldmap.png (World map showing 7 nodes with painted seal stamps: cleared, new, side, locked)
 * - 02-camp-profile.png (Camp character sheet with rich half-body portrait, visual stat bars, quote, backstory, equipment)
 * - 03-prebattle.png (Chapter 7 Side marsh pre-battle with banner_side, intel, and objectives)
 * - 04-move-range.png (Continuous merged move range with single feathered contour, glowing path & ZOC indicator)
 * - 05-attack-preview.png (Attack preview panel with facing/flank marker, large portraits, combo ally)
 * - 06-fog-of-war.png (Bamboo pass board with soft feathered ink-cloud mask canvas overlay & silhouette enemies)
 * - 07-stratagem-flood.png (水淹 flood continuous merged water body on shallows with soft shoreline & ripples)
 * - 08-fire-spreading.png (火攻 fire stratagem spreading on forest tiles, blocked by water)
 * - 09-new-sorcerer.png (New enemy archetype 妖術師 with class badge, curse mist & floating combat bark banner)
 * - 10-side-battle.png (Side battle 荒澤伏擊 board on map_side_marsh.webp)
 * - 11-post-battle.png (Post-battle victory screen with enlarged portraits, MVP laurels & MVP victory line)
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
const SCREENSHOT_DIR = path.resolve(ROOT_DIR, "screenshots/v8");
const PORT = 8894;

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
      res.writeHead(200, { "Content-Type": "application/javascript" });
      res.end("/* mock back.js */");
      return;
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
    ['modalDialogue', 'modalTutorial', 'modalDetailSheet', 'modalLevelUp', 'modalBattleResult', 'tutorialBoardOverlay', 'deployTrayBar', 'combatBarkBanner'].forEach(id => {
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
    console.log(`[Browser Console ${msg.type()}]:`, msg.text());
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });
  page.on("pageerror", (err) => {
    console.error(`[Browser PageError]:`, err);
    consoleErrors.push(String(err));
  });

  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('lt_tutorial_seen', '1');
  });

  await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => !!window.__lt, { timeout: 10000 });

  console.log("Ready to capture fresh screenshots into screenshots/v8/...");

  // 1. 00-title.png (Key-art title screen with illuminated lantern-lit foreground and mature buttons)
  await closeAllModals(page);
  await page.evaluate(() => {
    window.__lt.showScreen('screenTitle');
  });
  await new Promise(r => setTimeout(r, 450));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "00-title.png") });
  console.log("Captured 00-title.png");

  // 2. 01-worldmap.png (World map with 7 nodes showing cleared/new/side/locked cinnabar seal stamps)
  await page.evaluate(() => {
    const app = window.__lt.app;
    app.campaign.clearedChapters = [1, 2];
    app.campaign.unlockedChapters = [1, 2, 3, 7];
    window.__lt.openWorldMap();
  });
  await new Promise(r => setTimeout(r, 450));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "01-worldmap.png") });
  console.log("Captured 01-worldmap.png");

  // 3. 02-camp-profile.png (Camp screen with large half-body portrait, visual stat bars, quote, backstory, equipment)
  await page.evaluate(() => {
    const app = window.__lt.app;
    app.campaign.equipRelic('cat_patrol', 'sword_yitian');
    window.__lt.openCamp('cat_patrol');
    const scrollEl = document.querySelector('.camp-content-scrollable');
    if (scrollEl) {
      scrollEl.scrollTop = 110;
    }
  });
  await new Promise(r => setTimeout(r, 450));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "02-camp-profile.png") });
  console.log("Captured 02-camp-profile.png");

  // 4. 03-prebattle.png (Chapter 7 Side marsh pre-battle with banner_side, intel, and objectives)
  await page.evaluate(() => {
    window.__lt.openPreBattle(7);
    const scrollEl = document.querySelector('.prebattle-body-scroll');
    if (scrollEl) {
      scrollEl.scrollTop = 0;
    }
  });
  await new Promise(r => setTimeout(r, 450));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "03-prebattle.png") });
  console.log("Captured 03-prebattle.png");
  await closeAllModals(page);

  // 5. 04-move-range.png (Continuous merged move range with single feathered contour, glowing path & ZOC indicator)
  await page.evaluate(() => {
    const app = window.__lt.app;
    app.selectedSquadIds = ['bear_guard', 'cat_patrol', 'tea_master', 'lantern_crafter'];
    window.__lt.launchBattle(1);
    const battle = app.battle;
    app.ui.hideActionMenu();

    // Position bear_guard (mov 3, footman) on open causeway at (4, 8)
    const bear = battle.allies.find(a => a.id === 'bear_guard');
    // Position enemy cavalry at (4, 6) directly ahead, exerting ZOC on (4, 7)
    const enemy = battle.enemies[0];
    if (bear && enemy) {
      bear.x = 4;
      bear.y = 8;
      bear.turnStartX = 4;
      bear.turnStartY = 8;
      enemy.x = 4;
      enemy.y = 6;

      // Position other allies safely between y=7 and y=9 away from bottom edge
      const others = battle.allies.filter(a => a !== bear);
      const allyCoords = [{ x: 3, y: 9 }, { x: 5, y: 9 }, { x: 2, y: 8 }, { x: 6, y: 8 }];
      others.forEach((u, i) => {
        const c = allyCoords[i] || { x: 3, y: 8 };
        u.x = c.x;
        u.y = c.y;
        u.turnStartX = u.x;
        u.turnStartY = u.y;
      });

      // Position other enemies safely between y=3 and y=5 away from top HUD
      const otherEnemies = battle.enemies.filter(e => e !== enemy);
      const enemyCoords = [{ x: 3, y: 5 }, { x: 5, y: 5 }, { x: 2, y: 4 }, { x: 6, y: 4 }, { x: 7, y: 5 }];
      otherEnemies.forEach((e, i) => {
        const c = enemyCoords[i] || { x: 3, y: 4 };
        e.x = c.x;
        e.y = c.y;
      });

      app.refreshBattleUI();
      window.__lt.selectUnit('bear_guard');

      // Hover on adjacent tile (4, 7) to show glowing dotted ink path leading to ZOC intercept
      const destTile = document.querySelector('.grid-tile[data-x="4"][data-y="7"]');
      if (destTile) {
        destTile.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }));
      }
      app.ui.centerCameraOn(4.5, 7.0);
    }
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "04-move-range.png") });
  console.log("Captured 04-move-range.png");
  await closeAllModals(page);

  // 6. 05-attack-preview.png (Attack preview with back-attack direction marker, portraits, combo ally)
  await page.evaluate(() => {
    const app = window.__lt.app;
    // Include cat_patrol and its bond partner lantern_crafter (影燈)!
    app.selectedSquadIds = ['cat_patrol', 'lantern_crafter', 'bear_guard', 'tea_master'];
    window.__lt.launchBattle(1);
    app.ui.hideActionMenu();
    const battle = app.battle;
    const cat = battle.allies.find(a => a.id === 'cat_patrol');
    const lantern = battle.allies.find(a => a.id === 'lantern_crafter');
    const enemy = battle.enemies[0];
    if (cat && enemy) {
      // Facing East (+1): attacking from West (x=3) deals back-attack (+100% swift_shadow no counter)
      enemy.x = 4;
      enemy.y = 5;
      enemy.facing = 1;
      cat.x = 3;
      cat.y = 5;
      cat.turnStartX = 3;
      cat.turnStartY = 5;
      cat.facing = 1;
      if (lantern) {
        lantern.x = 3;
        lantern.y = 4;
        lantern.turnStartX = 3;
        lantern.turnStartY = 4;
        lantern.facing = 1;
      }
      // Keep other allies and enemies safely placed
      const others = battle.allies.filter(a => a.id !== 'cat_patrol' && a.id !== 'lantern_crafter');
      others.forEach((u, idx) => { u.x = 2; u.y = 7 + idx; u.turnStartX = u.x; u.turnStartY = u.y; });
      const otherEnemies = battle.enemies.filter(e => e !== enemy);
      otherEnemies.forEach((e, idx) => { e.x = 6 + (idx % 2); e.y = 4 + Math.floor(idx / 2); });

      app.refreshBattleUI();
      app.selectedUnit = cat;
      app.activeActionType = 'attack';
      app.evaluateTargetPreview(enemy);

      // Add directional lunges to attacker and combo ally
      const catFig = document.querySelector('.unit-figure[data-id="cat_patrol"]');
      if (catFig) catFig.classList.add('lunge-right');
      const lanternFig = document.querySelector('.unit-figure[data-id="lantern_crafter"]');
      if (lanternFig) lanternFig.classList.add('lunge-down');

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

  // 7. 06-fog-of-war.png (Chapter 5 Bamboo Pass with soft feathered ink-cloud mask canvas overlay)
  await page.evaluate(() => {
    window.__lt.launchBattle(5);
    const app = window.__lt.app;
    const battle = app.battle;

    // Position south allies on rows 8-9 safely above grokbot button
    const allies = battle.allies;
    allies.forEach((u, idx) => {
      u.x = 3 + (idx % 3);
      u.y = 8 + Math.floor(idx / 3);
      u.turnStartX = u.x;
      u.turnStartY = u.y;
    });

    app.refreshBattleUI();
    app.ui.centerCameraOn(4.5, 6.2);
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "06-fog-of-war.png") });
  console.log("Captured 06-fog-of-war.png");
  await closeAllModals(page);

  // 8. 07-stratagem-flood.png (水淹 continuous merged water body on shallows with soft shoreline & wave ripples)
  await page.evaluate(() => {
    // Must be captured on Chapter 4 (山道), per SPEC §8!
    window.__lt.launchBattle(4);
    const app = window.__lt.app;
    const battle = app.battle;

    // Reposition enemies on rows 8-9 (flooded dam zone)
    battle.enemies.forEach((e, idx) => {
      e.x = 3 + (idx % 4);
      e.y = 8 + Math.floor(idx / 4);
    });

    // Position allies on safe high ground rows 5-6
    battle.allies.forEach((a, idx) => {
      a.x = 3 + (idx % 3);
      a.y = 5 + Math.floor(idx / 3);
      a.turnStartX = a.x;
      a.turnStartY = a.y;
    });

    battle.triggerWaterFlood(6, 8);
    app.refreshBattleUI();
    app.ui.centerCameraOn(4.5, 7.0);
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "07-stratagem-flood.png") });
  console.log("Captured 07-stratagem-flood.png");
  await closeAllModals(page);

  // 9. 08-fire-spreading.png (火攻 fire stratagem spreading on forest tiles, blocked by water)
  await page.evaluate(() => {
    window.__lt.launchBattle(7); // Side marsh has reed forest tiles right beside water!
    const app = window.__lt.app;
    const battle = app.battle;

    // Trigger fire on reed marsh forest tiles at (3, 4) and tick spread
    battle.triggerFireAttack(3, 4);
    battle.tickBurningTiles();

    // Position allies approaching from south causeway (cols 3-5, rows 6-7), safely away from edges
    battle.allies.forEach((a, idx) => {
      a.x = 3 + (idx % 3);
      a.y = 6 + Math.floor(idx / 3);
      a.turnStartX = a.x;
      a.turnStartY = a.y;
    });

    // Reposition enemies safely in middle rows (cols 3-6, rows 3-4)
    battle.enemies.forEach((e, idx) => {
      e.x = 4 + (idx % 3);
      e.y = 3 + Math.floor(idx / 3);
    });

    app.refreshBattleUI();
    app.ui.centerCameraOn(4.5, 5.0);
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "08-fire-spreading.png") });
  console.log("Captured 08-fire-spreading.png");
  await closeAllModals(page);

  // 10. 09-new-sorcerer.png (New enemy archetype 咒禁術士 with class badge, curse mist & combat bark)
  await page.evaluate(() => {
    window.__lt.launchBattle(7);
    const app = window.__lt.app;
    const battle = app.battle;

    // Add lantern at northern altar (4, 3) to reveal curse_sorcerer
    battle.board.lanterns.push({ x: 4, y: 3, radius: 2 });

    const sorcerer = battle.enemies.find(e => e.id === 'curse_sorcerer');
    const guard = battle.enemies.find(e => e.id === 'shield_guard');
    if (sorcerer) {
      sorcerer.x = 4;
      sorcerer.y = 3;
    }
    if (guard) {
      guard.x = 3;
      guard.y = 4;
    }

    // Position cat advancing to challenge sorcerer
    const cat = battle.allies.find(a => a.id === 'cat_patrol') || battle.allies[0];
    if (cat) {
      cat.x = 4;
      cat.y = 5;
    }

    // Add cursed miasma tiles around targets
    battle.cursedTiles.add('4,4');
    battle.cursedTiles.add('4,5');
    battle.cursedTiles.add('3,4');

    app.refreshBattleUI();
    if (sorcerer) {
      app.ui.showCombatBark(
        sorcerer,
        '【咒禁術士 · 邪穢陰雷】',
        '「大荒幽冥，萬靈伏誅！咒禁鎖魂！」'
      );
    }
    app.ui.centerCameraOn(4.5, 4.2);
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "09-new-sorcerer.png") });
  console.log("Captured 09-new-sorcerer.png");
  await closeAllModals(page);

  // 11. 10-side-battle.png (Side battle 荒澤伏擊 board on map_side_marsh.webp)
  await page.evaluate(() => {
    window.__lt.launchBattle(7);
    const app = window.__lt.app;
    const battle = app.battle;

    // Place lantern at (4, 4) with radius 3 so the entire central battle zone including curse_sorcerer is illuminated
    battle.board.lanterns.push({ x: 4, y: 4, radius: 3 });

    const sorcerer = battle.enemies.find(e => e.id === 'curse_sorcerer');
    const guard = battle.enemies.find(e => e.id === 'shield_guard');
    if (sorcerer) {
      sorcerer.x = 4;
      sorcerer.y = 3;
    }
    if (guard) {
      guard.x = 4;
      guard.y = 4;
    }

    // Position allies advancing along causeway (rows 6-7) safely on-screen
    battle.allies.forEach((a, idx) => {
      a.x = 3 + (idx % 3);
      a.y = 6 + Math.floor(idx / 3);
      a.turnStartX = a.x;
      a.turnStartY = a.y;
    });

    // Cursed tiles visible on the marsh
    battle.cursedTiles.add('4,3');
    battle.cursedTiles.add('3,4');
    battle.cursedTiles.add('5,4');

    app.refreshBattleUI();
    app.ui.centerCameraOn(4.5, 4.8);
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "10-side-battle.png") });
  console.log("Captured 10-side-battle.png");
  await closeAllModals(page);

  // 12. 11-post-battle.png (Post-battle victory screen with enlarged portraits, MVP laurels & MVP victory line)
  await page.evaluate(() => {
    window.__lt.launchBattle(7);
    const app = window.__lt.app;
    app.battle.actionScores['cat_patrol'] = 92;
    app.battle.actionScores['bear_guard'] = 60;
    app.battle.actionScores['tea_master'] = 50;
    app.battle.actionScores['crane_rider'] = 65;
    window.__lt.showBattleResultModal(true, 7);
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "11-post-battle.png") });
  console.log("Captured 11-post-battle.png");

  await browser.close();
  server.close();

  if (consoleErrors.length > 0) {
    console.error(`[Screenshot Script] Errors detected during run (${consoleErrors.length}):`, consoleErrors);
    process.exit(1);
  } else {
    console.log("[Screenshot Script] All 12 screenshots captured successfully into screenshots/v8/ with 0 console errors!");
    process.exit(0);
  }
}

capture().catch((err) => {
  console.error("Screenshot capture failed:", err);
  process.exit(1);
});
