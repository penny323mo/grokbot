import { chromium } from 'playwright';
const browser = await chromium.launch({
  executablePath: '/workspace/stage/autobet/research/pw-browsers/chromium-1248/chrome-linux64/chrome',
  args: ['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']
});
const page = await browser.newContext({ viewport: { width: 390, height: 844 } }).then(c => c.newPage());
page.on('console', m => console.log('C', m.type(), m.text()));
page.on('pageerror', e => console.log('PE', e.message));
await page.goto('http://127.0.0.1:8938/index.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
await page.click('#btn-title-garage');
await page.waitForTimeout(4000);
const info = await page.evaluate(async () => {
  // fetch glb
  const r = await fetch('assets/models/car_h86.glb?v=cc0v1');
  const buf = await r.arrayBuffer();
  return { status: r.status, bytes: buf.byteLength, ct: r.headers.get('content-type') };
});
console.log('fetch', info);
// Check DOM for procedural hint / canvas luminance
const lum = await page.evaluate(() => {
  const c = document.querySelector('#game-canvas, canvas');
  if (!c) return null;
  const ctx = document.createElement('canvas');
  ctx.width = 64; ctx.height = 64;
  const g = ctx.getContext('2d');
  g.drawImage(c, 0, 0, 64, 64);
  const d = g.getImageData(0,0,64,64).data;
  let s=0; for (let i=0;i<d.length;i+=4) s += d[i]+d[i+1]+d[i+2];
  return s / (64*64*3);
});
console.log('lum', lum);
await browser.close();
