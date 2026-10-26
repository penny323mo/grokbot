/**
 * scripts/capture_screenshots.mjs
 * Puppeteer-core screenshot generation at 390x844 (iPhone Safari viewport).
 * Verifies 0 console errors and saves screenshots into screenshots/v2/:
 * - title.png
 * - map.png
 * - battle.png
 * - card-selected.png
 * - reward.png
 * - town.png
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
const SCREENSHOT_DIR = path.resolve(ROOT_DIR, "screenshots/v2");
const PORT = 8891;

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

    // Handle grokbot _shared/back.js
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
      ".mp3": "audio/mpeg",
      ".m4a": "audio/mp4"
    };

    res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
    fs.createReadStream(filePath).pipe(res);
  });

  return new Promise((resolve) => server.listen(PORT, "127.0.0.1", () => resolve(server)));
}

async function run() {
  const server = await startServer();
  console.log(`[Screenshot Script] Server running at http://127.0.0.1:${PORT}`);

  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem("lantern_watch_tutorial_seen", "1");
  });

  const consoleErrors = [];
  page.on("console", (msg) => {
    console.log(`[BROWSER ${msg.type()}]:`, msg.text());
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });
  page.on("pageerror", (err) => {
    console.log("[BROWSER PAGE ERROR]:", err.toString());
    consoleErrors.push(err.toString());
  });

  try {
    // 1. Title Screen
    console.log("1. Capturing title.png...");
    await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "title.png") });

    // 2. Start Battle & Capture Battle
    console.log("2. Capturing battle.png...");
    await page.click("#btnStartAdventure");
    await new Promise((r) => setTimeout(r, 200));
    await page.click('[data-diff="standard"]');
    await new Promise((r) => setTimeout(r, 500));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "battle.png") });

    // 3. Card Selected with Valid Target Highlights (Cat patrol glowing friendly deployment rows 3-4)
    console.log("3. Capturing card-selected.png...");
    await page.evaluate(() => {
      if (window.app && window.app.activeBattle) {
        const battle = window.app.activeBattle;
        let catIdx = battle.hand.findIndex((c) => {
          const id = typeof c === "string" ? c : c.id;
          return id === "card_summon_cat";
        });
        if (catIdx === -1) {
          battle.hand[0] = "card_summon_cat";
          catIdx = 0;
        }
        window.app.selectCardForPlay(catIdx, "card_summon_cat");
      }
    });
    await new Promise((r) => setTimeout(r, 500));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "card-selected.png") });

    // 4. Reward Screen
    console.log("4. Capturing reward.png...");
    await page.evaluate(() => {
      if (window.app) {
        window.app.handleBattleVictory();
      }
    });
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "reward.png") });

    // 5. Map Screen
    console.log("5. Capturing map.png...");
    await page.evaluate(() => {
      if (window.app && window.app.activeRun) {
        window.app.renderMapScreen();
      }
    });
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "map.png") });

    // 6. Town Meta Progression Screen (Showing built vs unbuilt buildings)
    console.log("6. Capturing town.png...");
    await page.evaluate(() => {
      if (window.app) {
        window.app.town.buildings = ["bldg_watchtower", "bldg_courier", "bldg_tea_bush"];
        window.app.town.starLanterns = 18;
        window.app.ui.showScreen("screenTown");
        window.app.ui.renderTown(window.app.town, () => {});
      }
    });
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "town.png") });

    // 7. Tutorial Sheet (Clear of Grokbot chip)
    console.log("7. Capturing tutorial.png...");
    await page.evaluate(() => {
      if (window.app) {
        window.app.ui.showScreen("screenBattle");
        const tutorial = document.getElementById("modalTutorial");
        if (tutorial) tutorial.classList.add("active");
      }
    });
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "tutorial.png") });

    console.log("\nAll 7 screenshots captured successfully into screenshots/v2/!");
    console.log(`Console Errors count: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.error("Console Errors encountered:", consoleErrors);
      process.exit(1);
    }
  } finally {
    await browser.close();
    server.close();
  }
}

run().catch((err) => {
  console.error("Screenshot capture failed:", err);
  process.exit(1);
});
