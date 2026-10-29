// Headless WebGL Render Luminance & Variance Verification for Midnight Touge
process.env.DISPLAY = process.env.DISPLAY || ':1';
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { chromium } from 'playwright';

describe('Headless WebGL 3D World Render & Luminance Verification', () => {
  let server;
  let serverPort;
  let browser;
  let xvfbProcess;

  function parsePngStats(buf) {
    let offset = 8;
    let width = 0, height = 0, colorType = 2;
    const idatChunks = [];
    while (offset < buf.length) {
      const len = buf.readUInt32BE(offset);
      const type = buf.slice(offset + 4, offset + 8).toString('ascii');
      if (type === 'IHDR') {
        width = buf.readUInt32BE(offset + 8);
        height = buf.readUInt32BE(offset + 12);
        colorType = buf.readUInt8(offset + 17);
      } else if (type === 'IDAT') {
        idatChunks.push(buf.slice(offset + 8, offset + 8 + len));
      }
      offset += 12 + len;
    }
    const decompressed = zlib.inflateSync(Buffer.concat(idatChunks));
    const channels = colorType === 6 ? 4 : 3;
    const rowSize = 1 + width * channels;
    let totalLuma = 0;
    let totalSq = 0;
    let count = 0;
    for (let y = 0; y < height; y += 4) {
      const rowOffset = y * rowSize + 1;
      for (let x = 0; x < width; x += 4) {
        const idx = rowOffset + x * channels;
        const r = decompressed[idx] || 0;
        const g = decompressed[idx + 1] || 0;
        const b = decompressed[idx + 2] || 0;
        const luma = 0.299 * r + 0.587 * g + 0.114 * b;
        totalLuma += luma;
        totalSq += luma * luma;
        count++;
      }
    }
    const mean = totalLuma / count;
    const variance = (totalSq / count) - (mean * mean);
    return { width, height, count, mean, variance };
  }

  before(async () => {
    // 1. Start lightweight local HTTP static file server
    server = http.createServer((req, res) => {
      let reqPath = req.url.split('?')[0];
      if (reqPath === '/') reqPath = '/index.html';
      const filePath = path.join(process.cwd(), reqPath);
      if (!fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end('Not Found');
        return;
      }
      const ext = path.extname(filePath);
      const mimeMap = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.jpg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.glb': 'model/gltf-binary',
        '.ttf': 'font/ttf',
        '.mp3': 'audio/mpeg',
        '.ogg': 'audio/ogg'
      };
      res.writeHead(200, { 'Content-Type': mimeMap[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    });

    await new Promise(resolve => server.listen(0, resolve));
    serverPort = server.address().port;

    process.env.DISPLAY = process.env.DISPLAY || ':1';

    // 2. Launch Playwright Chromium with SwiftShader (strictly matching audit environment)
    browser = await chromium.launch({
      executablePath: '/workspace/stage/autobet/research/pw-browsers/chromium-1248/chrome-linux64/chrome',
      env: { ...process.env, DISPLAY: process.env.DISPLAY || ':1' },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--use-gl=angle',
        '--use-angle=swiftshader',
        '--enable-unsafe-swiftshader',
        '--ignore-gpu-blocklist'
      ]
    });
  });

  after(async () => {
    if (browser) await browser.close();
    if (server) await new Promise(resolve => server.close(resolve));
    if (xvfbProcess) {
      try { xvfbProcess.kill(); } catch (_) {}
    }
  });

  test('Garage 3D car turntable renders non-black pixels under SwiftShader', async () => {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1
    });

    await page.goto(`http://127.0.0.1:${serverPort}/index.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    // Open Garage
    await page.click('#btn-title-garage');
    await page.waitForTimeout(800);

    // Hide UI overlay to assert bare 3D WebGL world canvas rendering
    await page.evaluate(() => {
      const ui = document.getElementById('ui-container');
      if (ui) ui.style.visibility = 'hidden';
    });

    // Capture screenshot of #game-canvas
    const canvas = await page.$('#game-canvas');
    assert.ok(canvas, 'Game canvas must exist');
    const canvasPng = await canvas.screenshot();

    const stats = parsePngStats(canvasPng);
    assert.ok(
      stats.mean > 15,
      `Garage bare 3D canvas mean luminance must exceed 15 (got ${stats.mean.toFixed(2)})`
    );
    assert.ok(
      stats.variance > 10,
      `Garage bare 3D canvas luminance variance must exceed 10 (got ${stats.variance.toFixed(2)})`
    );

    await page.close();
  });

  test('Race 3D mountain track and car render non-black pixels under SwiftShader', async () => {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1
    });

    await page.goto(`http://127.0.0.1:${serverPort}/index.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    // Click race start
    const startBtn = await page.waitForSelector('#btn-title-start');
    await startBtn.click();
    await page.waitForTimeout(1000);

    // Hide HUD overlay to assert bare 3D WebGL world canvas rendering
    await page.evaluate(() => {
      const hud = document.getElementById('hud-container');
      if (hud) hud.style.visibility = 'hidden';
    });

    // Capture screenshot of #game-canvas during countdown / race
    const canvas = await page.$('#game-canvas');
    assert.ok(canvas, 'Game canvas must exist');
    const canvasPng = await canvas.screenshot();

    const stats = parsePngStats(canvasPng);
    assert.ok(
      stats.mean > 15,
      `Race bare 3D canvas mean luminance must exceed 15 (got ${stats.mean.toFixed(2)})`
    );
    assert.ok(
      stats.variance > 10,
      `Race bare 3D canvas luminance variance must exceed 10 (got ${stats.variance.toFixed(2)})`
    );

    await page.close();
  });
});
