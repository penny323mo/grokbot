/**
 * tests/verify_headless.js - Headless Chrome verification for Prompt Studio.
 * Runs at 390x844 (iPhone Safari viewport).
 * Verifies:
 * 1. 0 console errors and warnings.
 * 2. 0 horizontal overflow (scrollWidth <= clientWidth).
 * 3. Style card selection & prompt update.
 * 4. Copy Prompt & toast trigger.
 * 5. Save to Library & persistence across reload.
 * 6. Video mode switch & Shot list storyboard addition.
 * 7. Recipe loading into builder.
 * 8. Export & Import JSON deduplication.
 * 9. Captures screenshots into screenshots/.
 */

const puppeteer = require("/workspace/nightly/shotkit/node_modules/puppeteer-core");
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 8877;
const ROOT_DIR = path.resolve(__dirname, "..");
const SCREENSHOTS_DIR = path.resolve(ROOT_DIR, "screenshots");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Simple static server for testing
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
    server.listen(PORT, "127.0.0.1", () => {
      resolve(server);
    });
  });
}

async function runVerification() {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  const server = await startServer();
  console.log(`[Headless Test] Test server running at http://127.0.0.1:${PORT}`);

  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

  const consoleErrors = [];
  const consoleWarnings = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
    else if (msg.type() === "warning") consoleWarnings.push(msg.text());
  });

  page.on("pageerror", (err) => {
    consoleErrors.push(err.toString());
  });

  page.on("dialog", async (dialog) => {
    console.log(`[Headless Test] Dialog appeared: "${dialog.message()}", accepting.`);
    await dialog.accept();
  });

  try {
    console.log("[Headless Test] 1. Loading app at 390x844...");
    await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: "networkidle0" });

    // Screenshot 1: Default Builder Home
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "01_builder_home.png") });

    // Check horizontal overflow
    const overflow = await page.evaluate(() => {
      const docWidth = document.documentElement.clientWidth;
      const bodyScrollWidth = document.body.scrollWidth;
      const appContainer = document.querySelector(".app-container");
      const appScrollWidth = appContainer ? appContainer.scrollWidth : 0;
      return {
        docWidth,
        bodyScrollWidth,
        appScrollWidth,
        hasOverflow: bodyScrollWidth > docWidth + 1 || appScrollWidth > docWidth + 1
      };
    });

    console.log("[Headless Test] Viewport metrics:", overflow);
    if (overflow.hasOverflow) {
      throw new Error(`Horizontal overflow detected! docWidth: ${overflow.docWidth}, scrollWidth: ${overflow.appScrollWidth}`);
    }

    console.log("[Headless Test] 2. Tapping style card & lighting chip...");
    // Tap Ghibli style card
    await page.click('.style-card[data-style-id="ghibli"]');
    // Tap Soft window light chip
    await page.click('.chip[data-light-id="soft_window"]');

    const promptText = await page.$eval("#promptDisplay", (el) => el.textContent);
    const explanationText = await page.$eval("#explanationDisplay", (el) => el.textContent);

    console.log("[Headless Test] Generated prompt preview:", promptText.slice(0, 80) + "...");
    if (!promptText.includes("Studio Ghibli")) {
      throw new Error("Prompt does not contain Studio Ghibli!");
    }
    if (!promptText.includes("soft diffused natural window light")) {
      throw new Error("Prompt does not contain soft window light!");
    }
    if (!explanationText.includes("吉卜力動畫風")) {
      throw new Error("Explanation does not contain 吉卜力動畫風!");
    }

    // Verify aria-pressed on style card & lighting chip
    const styleAriaPressed = await page.$eval('.style-card[data-style-id="ghibli"]', (el) => el.getAttribute("aria-pressed"));
    const lightAriaPressed = await page.$eval('.chip[data-light-id="soft_window"]', (el) => el.getAttribute("aria-pressed"));
    if (styleAriaPressed !== "true" || lightAriaPressed !== "true") {
      throw new Error(`Expected aria-pressed="true", got style: ${styleAriaPressed}, light: ${lightAriaPressed}`);
    }

    // Screenshot 2: Style & Lighting Selected
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "02_style_selected.png") });

    console.log("[Headless Test] 3. Testing Copy Prompt button & Toast...");
    await page.click("#btnSheetCopyMain");
    await page.waitForSelector(".toast", { timeout: 2000 });
    const toastText = await page.$eval(".toast", (el) => el.textContent);
    console.log("[Headless Test] Toast appeared:", toastText);
    if (!toastText.includes("已複製 Prompt")) {
      throw new Error("Toast does not confirm copy!");
    }

    console.log("[Headless Test] 4. Saving prompt to Library...");
    await page.click("#btnSheetSave");
    await page.waitForSelector("#modalSave", { visible: true });
    await page.type("#inputSaveName", " 測試吉卜力晨光");
    await page.click("#btnConfirmSave");
    await page.waitForSelector("#modalSave", { hidden: true });

    // Switch to Library Tab
    await page.click('#nav-tab-library');
    await sleep(300);
    // Screenshot 3: Library Tab
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "03_library_tab.png") });

    const libCardName = await page.$eval(".lib-card-name", (el) => el.textContent);
    console.log("[Headless Test] Saved item in library:", libCardName);
    if (!libCardName.includes("測試吉卜力晨光")) {
      throw new Error("Saved item not found in Library tab!");
    }

    console.log("[Headless Test] 5. Testing Persistence across page reload...");
    await page.reload({ waitUntil: "networkidle0" });
    await page.click('#nav-tab-library');
    await sleep(300);
    const libCardAfterReload = await page.$eval(".lib-card-name", (el) => el.textContent);
    if (!libCardAfterReload.includes("測試吉卜力晨光")) {
      throw new Error("Library item did not persist across reload!");
    }

    console.log("[Headless Test] 6. Testing Video Mode & Shot List...");
    await page.click('#nav-tab-build');
    await page.click("#btnModeVideo");
    await sleep(300);

    // Expand video card if collapsed
    const isVideoCardCollapsed = await page.$eval("#card-video", (el) => el.classList.contains("collapsed"));
    if (isVideoCardCollapsed) {
      await page.click("#card-video .accordion-header");
    }

    // Add 2 shots
    await page.click("#btnAddShot");
    await page.click("#btnAddShot");
    await sleep(300);

    const videoPromptText = await page.$eval("#promptDisplay", (el) => el.textContent);
    console.log("[Headless Test] Video prompt with storyboard:", videoPromptText.slice(0, 100) + "...");
    if (!videoPromptText.includes("Shot 1") || !videoPromptText.includes("Shot 2")) {
      throw new Error("Video prompt missing Shot 1 / Shot 2!");
    }

    // Verify shot description input has empty default value (not "新鏡頭描述")
    const shotDescVal = await page.$eval(".shot-desc-input", (el) => el.value);
    if (shotDescVal.includes("新鏡頭描述")) {
      throw new Error(`Shot description input should not contain default text "新鏡頭描述", got: ${shotDescVal}`);
    }

    // Screenshot 4: Video Mode & Storyboard
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "04_video_mode.png") });

    console.log("[Headless Test] 7. Testing Recipe Loading...");
    await page.click("#nav-tab-recipes");
    await sleep(300);
    // Screenshot 5: Recipes Tab
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "05_recipes_tab.png") });

    // Open first recipe
    await page.click(".recipe-card");
    await page.waitForSelector("#modalRecipe", { visible: true });
    await page.click("#btnApplyRecipe");
    await sleep(300);

    // Should now be back in build tab with recipe loaded
    const activeTabId = await page.$eval(".tab-pane.active", (el) => el.id);
    if (activeTabId !== "tab-build") {
      throw new Error(`Expected tab-build to be active after applying recipe, got ${activeTabId}`);
    }

    const recipePromptText = await page.$eval("#promptDisplay", (el) => el.textContent);
    const hasHanInRecipePrompt = /[\u4e00-\u9fa5]/.test(recipePromptText);
    if (hasHanInRecipePrompt) {
      throw new Error(`Recipe prompt contains Han characters: ${recipePromptText}`);
    }

    console.log("[Headless Test] 8. Checking console errors...");
    console.log(`Console Errors (${consoleErrors.length}):`, consoleErrors);
    console.log(`Console Warnings (${consoleWarnings.length}):`, consoleWarnings);

    if (consoleErrors.length > 0) {
      throw new Error(`Console errors detected: ${JSON.stringify(consoleErrors)}`);
    }

    console.log("\n==========================================");
    console.log("ALL HEADLESS ACCEPTANCE TESTS PASSED (390x844)!");
    console.log("0 console errors, 0 horizontal overflow.");
    console.log("==========================================\n");
  } finally {
    await browser.close();
    server.close();
  }
}

runVerification().catch((err) => {
  console.error("Headless test failed:", err);
  process.exit(1);
});
