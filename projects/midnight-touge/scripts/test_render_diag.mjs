import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.glb': 'model/gltf-binary',
  '.ttf': 'font/ttf',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(process.cwd(), reqPath);
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  const ext = path.extname(filePath);
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(8939, async () => {
  const browser = await chromium.launch({
    executablePath: '/workspace/stage/autobet/research/pw-browsers/chromium-1248/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
  });

  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('http://127.0.0.1:8939/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Switch renderTarget to UnsignedByteType in live game:
  const changeRes = await page.evaluate(async () => {
    const game = window.__TOUGE_GAME__;
    
    // Dispose old render target and recreate with UnsignedByteType
    game.mainRenderTarget.dispose();
    const dpr = Math.min(window.devicePixelRatio || 1, 2.0);
    game.mainRenderTarget = new game.mainRenderTarget.constructor(
      Math.round(window.innerWidth * dpr),
      Math.round(window.innerHeight * dpr),
      {
        minFilter: 1006, // LinearFilter
        magFilter: 1006,
        format: 1023, // RGBAFormat
        type: 1009, // UnsignedByteType
        depthBuffer: true
      }
    );

    // Make garage screen layer transparent
    const garageLayer = document.querySelector('.garage-screen-layer');
    if (garageLayer) {
      garageLayer.style.background = 'transparent';
    }

    // Go to garage
    game.transitionTo('GARAGE');
    await new Promise(r => setTimeout(r, 600));

    const gl = game.renderer.getContext();
    const pixel = new Uint8Array(4);
    gl.readPixels(195, 422, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    return { garagePixel: Array.from(pixel) };
  });

  console.log('After change to UnsignedByteType:', changeRes);
  await page.screenshot({ path: 'test_garage_fixed.png' });

  // Now start race:
  await page.evaluate(async () => {
    const game = window.__TOUGE_GAME__;
    // Enter Stage 1
    const evt = (await import('./src/data/events.js')).EVENTS_DATA[0];
    game.startEvent(evt);
    await new Promise(r => setTimeout(r, 600));
  });

  await page.screenshot({ path: 'test_race_fixed.png' });

  const racePixel = await page.evaluate(() => {
    const gl = window.__TOUGE_GAME__.renderer.getContext();
    const pixel = new Uint8Array(4);
    gl.readPixels(195, 422, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    return Array.from(pixel);
  });
  console.log('Race pixel:', racePixel);

  await browser.close();
  server.close();
  process.exit(0);
});
