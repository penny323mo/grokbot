/**
 * scripts/capture_screenshots.mjs
 * Puppeteer-core screenshot generation at 390x844 (iPhone Safari viewport).
 * Verifies 0 console errors and saves screenshots into screenshots/r1/:
 * - title.png
 * - tutorial.png
 * - battle_intents.png
 * - card_selected.png
 * - reward.png
 * - map.png
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
const SCREENSHOT_DIR = path.resolve(ROOT_DIR, "screenshots/r1");
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

  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });
  page.on("pageerror", (err) => {
    consoleErrors.push(err.toString());
  });

  try {
    // 1. Title Screen
    console.log("1. Capturing title.png...");
    await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: "networkidle0" });
    // Close tutorial modal if open to capture clean title first
    await page.evaluate(() => {
      const modal = document.getElementById("modalTutorial");
      if (modal) modal.classList.remove("active");
    });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "title.png") });

    // 2. Tutorial Modal
    console.log("2. Capturing tutorial.png...");
    await page.evaluate(() => {
      const modal = document.getElementById("modalTutorial");
      if (modal) modal.classList.add("active");
    });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "tutorial.png") });
    await page.evaluate(() => {
      document.getElementById("modalTutorial").classList.remove("active");
    });

    // 3. Start Battle & Capture Battle with Intents Shown
    console.log("3. Capturing battle_intents.png...");
    await page.click("#btnStartAdventure");
    await new Promise((r) => setTimeout(r, 200));
    // Click Standard Difficulty
    await page.click('[data-diff="standard"]');
    await new Promise((r) => setTimeout(r, 300));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "battle_intents.png") });

    // 4. Card Selected with Valid Target Highlights (Summon card glowing friendly deployment tiles)
    console.log("4. Capturing card_selected.png...");
    await page.evaluate(() => {
      if (window.app && window.app.activeBattle) {
        const battle = window.app.activeBattle;
        const summonIdx = battle.hand.findIndex((c) => c.type === "summon");
        const idx = summonIdx >= 0 ? summonIdx : 0;
        window.app.handleCardTap(idx, battle.hand[idx]);
      }
    });
    await new Promise((r) => setTimeout(r, 300));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "card_selected.png") });

    // 5. Reward Screen
    console.log("5. Capturing reward.png...");
    await page.evaluate(() => {
      if (window.app) {
        window.app.handleBattleVictory();
      }
    });
    await new Promise((r) => setTimeout(r, 200));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "reward.png") });

    // 6. Map Screen
    console.log("6. Capturing map.png...");
    await page.evaluate(() => {
      if (window.app && window.app.activeRun) {
        window.app.renderMapScreen();
      }
    });
    await new Promise((r) => setTimeout(r, 200));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "map.png") });

    // 7. Town Meta Progression Screen
    console.log("7. Capturing town.png...");
    await page.evaluate(() => {
      if (window.app) {
        window.app.ui.showScreen("screenTown");
        window.app.ui.renderTown(window.app.town, () => {});
      }
    });
    await new Promise((r) => setTimeout(r, 200));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "town.png") });

    console.log("\nAll 7 screenshots captured successfully!");
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
