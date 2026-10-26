/**
 * scripts/capture_v2_screenshots.js
 * Captures 390px-wide screenshots of:
 * - Builder
 * - Video Mode
 * - Recipes
 * - Library
 * in both LIGHT and DARK modes into screenshots/v2/after-r2-*.png
 */

const puppeteer = require("/workspace/nightly/shotkit/node_modules/puppeteer-core");
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 8899;
const ROOT_DIR = path.resolve(__dirname, "..");
const V2_SCREENSHOTS_DIR = path.resolve(ROOT_DIR, "screenshots/v2");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function startServer() {
  const server = http.createServer((req, res) => {
    let reqPath = req.url.split("?")[0];
    if (reqPath === "/") reqPath = "/index.html";
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
      ".json": "application/json",
      ".webmanifest": "application/manifest+json",
      ".svg": "image/svg+xml",
      ".png": "image/png"
    };

    res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
    fs.createReadStream(filePath).pipe(res);
  });

  return new Promise((resolve) => {
    server.listen(PORT, "127.0.0.1", () => resolve(server));
  });
}

async function capture() {
  fs.mkdirSync(V2_SCREENSHOTS_DIR, { recursive: true });
  const server = await startServer();
  console.log(`[Capture] Server running on port ${PORT}`);

  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"]
  });

  try {
    for (const scheme of ["light", "dark"]) {
      console.log(`\n--- Capturing ${scheme.toUpperCase()} mode screenshots ---`);
      const page = await browser.newPage();
      await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
      await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: scheme }]);

      // Accept dialogs automatically
      page.on("dialog", async (d) => await d.accept());

      // 1. Builder Screen (Select Cinematic style to show live prompt preview in collapsed sheet)
      await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: "networkidle0" });
      await sleep(200);
      await page.click('.style-card[data-style-id="cinematic"]');
      await page.click('.chip[data-light-id="golden_hour"]');
      await sleep(200);

      const builderPath = path.join(V2_SCREENSHOTS_DIR, `after-r2-builder-${scheme}.png`);
      await page.screenshot({ path: builderPath });
      console.log(`Saved: ${builderPath}`);

      // 2. Video Mode Screen
      await page.click("#btnModeVideo");
      await sleep(200);
      // Ensure video card is expanded
      const isCollapsed = await page.$eval("#card-video", (el) => el.classList.contains("collapsed"));
      if (isCollapsed) {
        await page.click("#card-video .accordion-header");
      }
      await page.click("#btnAddShot");
      await page.click("#btnAddShot");
      await sleep(200);

      const videoPath = path.join(V2_SCREENSHOTS_DIR, `after-r2-video-${scheme}.png`);
      await page.screenshot({ path: videoPath });
      console.log(`Saved: ${videoPath}`);

      // 3. Recipes Screen
      await page.click("#nav-tab-recipes");
      await sleep(200);

      const recipesPath = path.join(V2_SCREENSHOTS_DIR, `after-r2-recipes-${scheme}.png`);
      await page.screenshot({ path: recipesPath });
      console.log(`Saved: ${recipesPath}`);

      // 4. Library Screen (Save a couple items first for rich display)
      await page.evaluate(() => {
        window.PromptStore.addItem({
          name: "雨夜澳門街頭人像",
          mode: "image",
          prompt: "a stylish young woman with clear umbrella in neon-lit rain-soaked Macau street, cinematic film still",
          tags: ["電影感", "街頭", "雨夜"],
          favorite: true,
          state: { mode: "image" }
        });
        window.PromptStore.addItem({
          name: "日落維港航拍大片",
          mode: "video",
          prompt: "cinematic aerial drone sweeping flight over Victoria Harbour at sunset, golden hour warm reflection",
          tags: ["航拍", "城市", "維港"],
          favorite: false,
          state: { mode: "video" }
        });
      });

      await page.click("#nav-tab-library");
      await sleep(200);

      const libraryPath = path.join(V2_SCREENSHOTS_DIR, `after-r2-library-${scheme}.png`);
      await page.screenshot({ path: libraryPath });
      console.log(`Saved: ${libraryPath}`);

      await page.close();
    }
  } finally {
    await browser.close();
    server.close();
  }

  console.log("\nAll screenshots captured successfully in screenshots/v2/!");
}

capture().catch((err) => {
  console.error("Screenshot capture failed:", err);
  process.exit(1);
});
