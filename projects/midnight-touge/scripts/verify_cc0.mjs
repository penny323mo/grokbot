import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('screenshots/cc0-verify');
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath: '/workspace/stage/autobet/research/pw-browsers/chromium-1248/chrome-linux64/chrome',
  args: ['--no-sandbox','--disable-setuid-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']
});
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
});
const page = await context.newPage();
const errors = [];
const logs = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => {
  const t = m.text();
  if (m.type() === 'error') errors.push(t);
  if (/Scenery|Track|Failed|procedural|Paint|__lastCar|car_/i.test(t)) {
    logs.push(t);
    console.log('[LOG]', t);
  }
});

await page.goto('http://127.0.0.1:8938/index.html', { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: path.join(OUT, '01_title.png') });

const creditsBtn = page.locator('#btn-credits');
if (await creditsBtn.count()) {
  await creditsBtn.tap();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, '01b_credits.png') });
  await page.locator('#btn-credits-close').tap();
  await page.waitForTimeout(300);
}

await page.locator('#btn-title-garage').tap();
await page.waitForTimeout(3000);
await page.screenshot({ path: path.join(OUT, '02_garage_h86.png') });
const car1 = await page.evaluate(() => window.__lastCarBuild || null);
console.log('garage H-86 build', car1);

await page.locator('#btn-car-next').tap();
await page.waitForTimeout(2500);
await page.screenshot({ path: path.join(OUT, '03_garage_gt20.png') });
console.log('garage GT-20 build', await page.evaluate(() => window.__lastCarBuild || null));

await page.locator('#btn-car-next').tap();
await page.waitForTimeout(2500);
await page.screenshot({ path: path.join(OUT, '04_garage_re7.png') });
console.log('garage RE-7 build', await page.evaluate(() => window.__lastCarBuild || null));

// Back to H-86 and drive → events
await page.locator('#btn-car-prev').tap();
await page.waitForTimeout(400);
await page.locator('#btn-car-prev').tap();
await page.waitForTimeout(1000);

const drive = page.locator('#btn-garage-drive');
if (await drive.count()) {
  await drive.tap();
  await page.waitForTimeout(1500);
} else {
  await page.locator('#btn-title-start').tap().catch(()=>{});
  await page.waitForTimeout(1000);
}

// Should be on event select — tap STAGE START
await page.screenshot({ path: path.join(OUT, '04b_events.png') });
const stageBtn = page.locator('button.btn-stage-enter').first();
if (await stageBtn.count()) {
  console.log('tapping STAGE START');
  await stageBtn.tap();
} else {
  const free = page.locator('#btn-enter-free-run');
  if (await free.count()) {
    console.log('tapping FREE RUN');
    await free.tap();
  } else {
    console.log('no stage/free-run button — HTML snippet:');
    console.log(await page.evaluate(() => document.body.innerText.slice(0, 500)));
  }
}

await page.waitForTimeout(2000);
await page.screenshot({ path: path.join(OUT, '05_countdown.png') });
await page.waitForTimeout(5000);
await page.screenshot({ path: path.join(OUT, '06_racing.png') });

const gantryHidden = await page.evaluate(() => {
  const g = document.querySelector('#hud-countdown-gantry');
  if (!g) return 'missing';
  const st = getComputedStyle(g);
  return {
    display: st.display,
    visibility: st.visibility,
    opacity: st.opacity,
    hasHidden: g.classList.contains('is-hidden'),
    text: g.textContent?.slice(0, 40)
  };
});
console.log('gantry after race start:', JSON.stringify(gantryHidden));

const scenery = await page.evaluate(() => {
  // try to find three scene via canvas — count log only
  return { lastCar: window.__lastCarBuild || null };
});
console.log('race car', scenery);

await page.screenshot({ path: path.join(OUT, '07_racing_late.png') });
fs.writeFileSync(path.join(OUT, 'gantry.json'), JSON.stringify(gantryHidden, null, 2));
fs.writeFileSync(path.join(OUT, 'errors.json'), JSON.stringify({ errors, logs, car1 }, null, 2));
console.log('errors:', errors.length);
console.log('OUT', OUT);
await browser.close();
