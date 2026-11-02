// scripts/run_review_screenshots.cjs
const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('/tmp/bl-pup/node_modules/puppeteer-core');

const PORT = 8089;
const ROOT = path.resolve(__dirname, '..');
const OUTDIR = path.resolve(ROOT, 'screenshots/review-1');
const OUTDIR2 = path.resolve(ROOT, 'screenshots/review-2');
fs.mkdirSync(OUTDIR, { recursive: true });
fs.mkdirSync(OUTDIR2, { recursive: true });

// Simple HTTP static server
const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(ROOT, reqPath);

  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.mjs': 'application/javascript',
    '.json': 'application/json',
    '.webp': 'image/webp',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg'
  };

  res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, async () => {
  console.log(`Server listening at http://localhost:${PORT}`);

  try {
    const browser = await puppeteer.launch({
      executablePath: '/usr/bin/google-chrome',
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--use-gl=angle',
        '--use-angle=swiftshader',
        '--enable-unsafe-swiftshader',
        '--autoplay-policy=no-user-gesture-required',
        '--mute-audio'
      ]
    });

    const viewports = [
      { name: 'iphone-390x844', width: 390, height: 844 },
      { name: 'iphone-375x667', width: 375, height: 667 }
    ];

    for (const vp of viewports) {
      console.log(`\nTesting viewport: ${vp.name}`);
      const page = await browser.newPage();
      const errors = [];

      page.on('console', msg => {
        const text = msg.text();
        if (msg.type() === 'error') {
          if (text.includes('AudioContext encountered an error')) return;
          errors.push(`CONSOLE ERROR: ${text}`);
        }
      });
      page.on('pageerror', err => errors.push(`PAGE ERROR: ${err.message}`));
      page.on('response', resp => {
        if (resp.status() >= 400) errors.push(`HTTP ${resp.status()}: ${resp.url()}`);
      });

      await page.setViewport({
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true
      });

      await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'networkidle0' });
      await new Promise(r => setTimeout(r, 600));

      // 1. Screenshot Title
      await page.screenshot({ path: `${OUTDIR}/${vp.name}-01-title.png` });

      // 2. Open Credits Modal
      await page.click('#btn-open-credits');
      await new Promise(r => setTimeout(r, 400));
      await page.screenshot({ path: `${OUTDIR}/${vp.name}-02-credits.png` });
      await page.click('#btn-close-credits');
      await new Promise(r => setTimeout(r, 300));

      // 3. Open Chapters / Letter Modal
      await page.click('#btn-open-chapters');
      await new Promise(r => setTimeout(r, 400));
      await page.screenshot({ path: `${OUTDIR}/${vp.name}-03-letters.png` });
      await page.click('#btn-close-chapters');
      await new Promise(r => setTimeout(r, 300));

      // 4. Start Game -> Stage 1: Customer Arrival
      await page.click('#btn-start-game');
      await new Promise(r => setTimeout(r, 500));
      await page.screenshot({ path: `${OUTDIR}/${vp.name}-04-customer.png` });

      const bannerH = await page.evaluate(() => document.getElementById('day-vignette-banner')?.getBoundingClientRect().height);
      const lastBtnB = await page.evaluate(() => {
        const btns = document.querySelectorAll('#pricing-options .price-option-btn');
        return btns.length ? btns[btns.length - 1].getBoundingClientRect().bottom : 0;
      });
      console.log(`[${vp.name}] Banner height: ${bannerH}px, Last pricing button bottom: ${lastBtnB}px (viewport height: ${vp.height}px, margin: ${vp.height - lastBtnB}px)`);

      // Inquire story
      await page.click('#btn-inquire-story');
      await new Promise(r => setTimeout(r, 400));
      await page.screenshot({ path: `${OUTDIR}/${vp.name}-05-inquiry.png` });

      // Choose price option (first button: 公道收費)
      const priceBtns = await page.$$('#pricing-options .price-option-btn');
      if (priceBtns.length > 0) {
        await priceBtns[0].click();
      }
      await new Promise(r => setTimeout(r, 1000));

      // 5. Stage 2: Sort & Clean
      await page.screenshot({ path: `${OUTDIR}/${vp.name}-06-stage2-clean.png` });

      // Clean all shards programmatically via app instance
      await page.evaluate(() => {
        if (window.app && window.app.puzzleData) {
          window.app.puzzleData.shards.forEach(s => s.cleaned = true);
          window.app.renderCanvas();
          document.getElementById('btn-proceed-stage').style.display = 'flex';
          document.getElementById('btn-proceed-stage').textContent = '下一步：拼合對位';
        }
      });
      await new Promise(r => setTimeout(r, 400));
      await page.screenshot({ path: `${OUTDIR}/${vp.name}-07-stage2-cleaned.png` });

      // 6. Stage 3: Reassemble
      await page.click('#btn-proceed-stage');
      await new Promise(r => setTimeout(r, 500));
      await page.screenshot({ path: `${OUTDIR}/${vp.name}-08-stage3-reassemble.png` });

      // Place all shards correctly
      await page.evaluate(() => {
        if (window.app && window.app.puzzleData) {
          window.app.puzzleData.shards.forEach(s => {
            s.placed = true;
            s.currentPos = [0, 0];
          });
          window.app.renderCanvas();
          const btn = document.getElementById('btn-proceed-stage');
          btn.style.display = 'flex';
          btn.textContent = '下一步：畫線劃位';
        }
      });
      await new Promise(r => setTimeout(r, 400));
      await page.screenshot({ path: `${OUTDIR}/${vp.name}-09-stage3-assembled.png` });

      // 7. Stage 4: Mark Staples
      await page.click('#btn-proceed-stage');
      await new Promise(r => setTimeout(r, 500));
      // Place optimal staples evenly along cracks
      await page.evaluate(() => {
        if (window.app) {
          window.app.placedStaples = [
            { x: 360, y: 260, angle: 0 },
            { x: 360, y: 460, angle: 0 },
            { x: 260, y: 360, angle: Math.PI / 2 },
            { x: 460, y: 360, angle: Math.PI / 2 }
          ];
          window.app.renderCanvas();
          window.app.updateStapleGuideHUD();
        }
      });
      await new Promise(r => setTimeout(r, 400));
      await page.screenshot({ path: `${OUTDIR}/${vp.name}-10-stage4-marked.png` });

      // 8. Stage 5: Drill
      await page.click('#btn-proceed-stage');
      await new Promise(r => setTimeout(r, 500));
      await page.screenshot({ path: `${OUTDIR}/${vp.name}-11-stage5-drill.png` });

      // Simulate a missed bow stroke to test chipping penalty and leaky water test
      await page.evaluate(() => {
        if (window.app) {
          window.app.bowOscillation = 12; // outside sweet spot (36..64)
          window.app.handleBowDrillStroke();
        }
      });
      await new Promise(r => setTimeout(r, 400));
      await page.screenshot({ path: `${OUTDIR}/${vp.name}-11b-stage5-chipped.png` });

      // Complete remaining drilling via app
      await page.evaluate(() => {
        if (window.app) {
          if (window.app.bowTimer) clearInterval(window.app.bowTimer);
          document.getElementById('bow-drill-panel').style.display = 'none';
          window.app.startStapleSettingStage();
        }
      });
      await new Promise(r => setTimeout(r, 500));

      // 9. Stage 6: Hammered & Rice Paste & Water Test
      await page.screenshot({ path: `${OUTDIR}/${vp.name}-12-stage6-stapled.png` });

      // Auto-hammer all staples
      await page.evaluate(() => {
        if (window.app) window.app.autoHammerAllStaples();
      });
      await new Promise(r => setTimeout(r, 400));
      await page.screenshot({ path: `${OUTDIR}/${vp.name}-13-stage6-hammered.png` });

      // Wipe 糯米灰 paste
      await page.click('#btn-wipe-paste');
      await new Promise(r => setTimeout(r, 400));
      await page.screenshot({ path: `${OUTDIR}/${vp.name}-14-stage6-paste-wiped.png` });

      // Click dedicated water test button
      await page.click('#btn-water-test');
      await new Promise(r => setTimeout(r, 600)); // mid-pour frame
      await page.screenshot({ path: `${OUTDIR}/${vp.name}-15-stage6-water-pour.png` });
      await new Promise(r => setTimeout(r, 2200)); // finish pour & result

      // 10. Stage 7: Settlement
      await page.screenshot({ path: `${OUTDIR}/${vp.name}-16-stage7-settlement.png` });

      // Tap side job (spoon repair on workbench)
      const secBtn = await page.$('#btn-secondary-job');
      if (secBtn) {
        await secBtn.click();
        await new Promise(r => setTimeout(r, 400));
        await page.screenshot({ path: `${OUTDIR}/${vp.name}-17a-secondary-spoon-bench.png` });
        // Hammer first staple on spoon
        await page.click('#btn-proceed-stage');
        await new Promise(r => setTimeout(r, 300));
        // Hammer second staple on spoon
        await page.click('#btn-proceed-stage');
        await new Promise(r => setTimeout(r, 300));
        await page.screenshot({ path: `${OUTDIR}/${vp.name}-17b-secondary-spoon-stapled.png` });
        // Complete spoon repair and return to settlement
        await page.click('#btn-proceed-stage');
        await new Promise(r => setTimeout(r, 400));
        await page.screenshot({ path: `${OUTDIR}/${vp.name}-17-stage7-sidejob-added.png` });
      }

      // Open Ledger
      await page.click('#widget-ledger-btn');
      await new Promise(r => setTimeout(r, 400));
      await page.screenshot({ path: `${OUTDIR}/${vp.name}-18-ledger-modal.png` });
      await page.click('#btn-close-ledger');
      await new Promise(r => setTimeout(r, 300));

      // Advance to Day 2
      await page.click('#btn-next-day');
      await new Promise(r => setTimeout(r, 600));
      await page.screenshot({ path: `${OUTDIR}/${vp.name}-19-day2-customer.png` });

      // Day 2 Inquire & accept price
      await page.click('#btn-inquire-story');
      await new Promise(r => setTimeout(r, 400));
      const day2PriceBtns = await page.$$('#pricing-options .price-option-btn');
      if (day2PriceBtns.length > 0) {
        await day2PriceBtns[0].click();
      }
      await new Promise(r => setTimeout(r, 1000));
      await page.screenshot({ path: `${OUTDIR}/${vp.name}-20-day2-stage2-clean.png` });

      // Clean Day 2 shards
      await page.evaluate(() => {
        if (window.app && window.app.puzzleData) {
          window.app.puzzleData.shards.forEach(s => s.cleaned = true);
          window.app.renderCanvas();
          const btn = document.getElementById('btn-proceed-stage');
          btn.style.display = 'flex';
          btn.textContent = '下一步：拼合對位';
        }
      });
      await new Promise(r => setTimeout(r, 400));
      await page.screenshot({ path: `${OUTDIR}/${vp.name}-21-day2-stage2-cleaned.png` });

      // Tap Next Step on Day 2 -> MUST ENTER STAGE 3 (NOT WATER TEST!)
      await page.click('#btn-proceed-stage');
      await new Promise(r => setTimeout(r, 500));
      await page.screenshot({ path: `${OUTDIR}/${vp.name}-22-day2-stage3-reassemble.png` });

      // Verify Day 2 is in Stage 3, NOT skipped to settlement
      const currentStageDay2 = await page.evaluate(() => window.app ? window.app.currentStage : -1);
      console.log(`Day 2 currentStage after proceed: ${currentStageDay2} (expected 3)`);
      if (currentStageDay2 !== 3) {
        errors.push(`CRITICAL FAIL: Day 2 currentStage is ${currentStageDay2}, expected 3!`);
      }

      console.log(`Viewport ${vp.name} completed.`);
      console.log(`Errors encountered: ${errors.length}`);
      if (errors.length > 0) {
        console.error(errors);
      }

      await page.close();
    }

    await browser.close();
    // Copy all screenshots to review-2 as well
    fs.readdirSync(OUTDIR).filter(f => f.endsWith('.png')).forEach(f => {
      fs.copyFileSync(path.join(OUTDIR, f), path.join(OUTDIR2, f));
    });
    server.close();
    console.log('\nAll browser review screenshots captured successfully in review-1 and review-2!');
  } catch (err) {
    console.error('Fatal test error:', err);
    server.close();
    process.exit(1);
  }
});
