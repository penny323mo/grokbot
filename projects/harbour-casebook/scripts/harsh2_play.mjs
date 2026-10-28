import { chromium } from '/home/box/creative-libs/node_modules/playwright/index.mjs';
import fs from 'fs';
const BASE = process.argv[2] || 'http://127.0.0.1:8937/index.html';
const OUT = process.argv[3] || '/workspace/nightly/2026-10-28-harbour-casebook/screenshots/harsh2';
fs.mkdirSync(OUT, { recursive: true });
const log = [];
const L = (...a) => { const s = a.join(' '); console.log(s); log.push(s); };
const ANS = { c1_s1: { victim: '陳德生', scene: '當舖庫房', weapon: '紅木算盤' }, c1_s2: { culprit: '何炳', motive: '償還巨額賭債', treasure: '翡翠玉鐲', accomplice: '白蘭' } };
const WHO = { chan_tak_sang: '陳德生', ho_bing: '何炳', leung_ah_sei: '梁阿四', pak_lan: '白蘭' };
const browser = await chromium.launch({ args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push('pageerror ' + e.message));
page.on('console', m => { if (m.type() === 'error') errs.push('console ' + m.text()); });
page.on('requestfailed', r => {
  if (r.failure()?.errorText === 'net::ERR_ABORTED') return;
  errs.push('reqfail ' + r.url());
});
let n = 0;
const shot = async (name) => { n++; const p = `${OUT}/${String(n).padStart(2, '0')}_${name}.png`; await page.screenshot({ path: p }); L('SHOT', p); };
const wait = ms => page.waitForTimeout(ms);
// real tap: get bounding box center and tap via touchscreen, check element at point
async function tap(sel, label) {
  const loc = typeof sel === 'string' ? page.locator(sel).first() : sel;
  try { await loc.waitFor({ state: 'visible', timeout: 1500 }); } catch { L('MISS not visible', label || sel); return false; }
  const b = await loc.boundingBox();
  if (!b) { L('MISS nobox', label); return false; }
  const x = b.x + b.width / 2, y = b.y + b.height / 2;
  const hit = await page.evaluate(([x, y, s]) => { const e = document.elementFromPoint(x, y); return e ? (e.id || e.className || e.tagName).toString().slice(0, 80) : 'none'; }, [x, y]);
  const ok = await loc.evaluate((el, [x, y]) => { const e = document.elementFromPoint(x, y); return !!e && (el === e || el.contains(e)); }, [x, y]);
  if (!ok) L('OCCLUDED', label || sel, 'at', x.toFixed(0), y.toFixed(0), 'hit=', hit);
  if (x < 0 || y < 0 || x > 390 || y > 844) L('OFFSCREEN', label, x, y);
  await page.touchscreen.tap(x, y);
  await wait(450);
  return ok;
}
if (process.env.PATCH) { await page.route('**/src/render/corkboard.js', async r => { const res = await r.fetch(); let b = await res.text(); b = b.replace('checkWhosWho(this.caseData,', 'checkWhosWho(this.caseData.whosWho,'); await r.fulfill({ response: res, body: b }); }); L('PATCHED corkboard'); }
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await wait(1200);
await shot('title');
await tap('#btn-start-game', 'start'); await wait(900);
await shot('desk');
// desk prop sizes
const props = await page.$$eval('.desk-prop-target, #btn-desk-open-board', els => els.map(e => { const r = e.getBoundingClientRect(); return `${e.id} ${r.x.toFixed(0)},${r.y.toFixed(0)} ${r.width.toFixed(0)}x${r.height.toFixed(0)}`; }));
L('PROPS', JSON.stringify(props));
await tap('#prop-lamp', 'lamp'); await wait(500); await shot('desk_after_lamp');
await tap('#prop-phone', 'phone'); await wait(700); await shot('phone_menu');
await page.evaluate(() => document.querySelector('.menu-scroll-area')?.scrollTo(0, 9999)); await wait(300); await shot('phone_menu_bottom');
await tap('#btn-menu-back-desk', 'menu back'); await wait(600);
await tap('#btn-desk-open-board', 'board folder'); await wait(700); await shot('case_board');
// back from board
const boardBack = page.locator('#screen-board .btn-back-to-desk, #screen-board button:has-text("返回")').first();
if (await boardBack.count()) await tap(boardBack, 'board back'); else L('NO board back');
await wait(600);
await tap('#prop-notebook', 'notebook'); await wait(700); await shot('notebook_empty');
await tap('#btn-notebook-back-desk', 'nb back'); await wait(600);
await tap('#prop-magnifier', 'magnifier'); await wait(900); await shot('scene_via_magnifier');
await tap('#btn-scene-back-desk', 'scene back'); await wait(600);
await tap('#prop-casebook', 'casebook'); await wait(1000); await shot('scene');
// hotspots
const hs = await page.$$eval('.hotspot-marker', els => els.map(e => { const r = e.getBoundingClientRect(); return { id: e.dataset.hotspotId, x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width }; }));
L('HOTSPOTS', hs.length, JSON.stringify(hs.map(h => `${h.id}@${h.x.toFixed(0)},${h.y.toFixed(0)} w${h.w.toFixed(0)}`)));
let first = true;
for (const h of hs) {
  const ok = await tap(`.hotspot-marker[data-hotspot-id="${h.id}"]`, 'hs ' + h.id);
  await wait(400);
  const open = await page.locator('.bottom-sheet-content').isVisible().catch(() => false);
  const title = await page.locator('#sheet-title').textContent().catch(() => '');
  L('HS', h.id, 'sheetOpen', open, 'title', title);
  if (first) { await shot('sheet_' + h.id); first = false; }
  const chips = page.locator('.sheet-description .word-chip');
  const c = await chips.count();
  for (let i = 0; i < c; i++) await tap(chips.nth(i), 'chip');
  if (h.id === 'c1_victim') await shot('sheet_collected');
  if (h.id === 'c1_earring') await shot('sheet_earring');
  await tap('.sheet-close-btn', 'sheet close'); await wait(350);
}
await shot('scene_all_harvested');
const collected = await page.evaluate(() => { try { return [...window.app.storage.getCollectedWords?.(1) || []].length; } catch (e) { return 'n/a'; } });
L('COLLECTED', collected);
await tap('#btn-scene-back-desk', 'scene back'); await wait(600);
await tap('#prop-notebook', 'notebook'); await wait(700); await shot('notebook_full');
await page.evaluate(() => document.querySelector('.notebook-scroll-area')?.scrollTo(0, 9999)); await wait(300); await shot('notebook_full_bottom');
await tap('#btn-notebook-back-desk', 'nb back'); await wait(600);
await tap('#prop-corkboard', 'cork'); await wait(800); await shot('corkboard');
for (const [id, name] of Object.entries(WHO)) {
  await tap(`.cork-name-slot[data-char-id="${id}"]`, 'slot ' + id); await wait(400);
  if (id === 'chan_tak_sang') await shot('cork_picker');
  await tap(page.locator(`#cork-picker-grid .picker-word-btn[data-word="${name}"]`).first(), 'pick ' + name);
}
await shot('cork_filled');
await tap('#btn-cork-check', 'cork check'); await wait(800); await shot('cork_checked');
await tap('#btn-cork-back-desk', 'cork back'); await wait(600);
await tap('#prop-deduction', 'deduction'); await wait(900); await shot('deduction');
for (const [sec, slots] of Object.entries(ANS)) {
  for (const [k, w] of Object.entries(slots)) {
    const b = page.locator(`.deduction-blank[data-section-id="${sec}"][data-slot-key="${k}"]`);
    await b.scrollIntoViewIfNeeded().catch(() => {});
    await tap(b, `blank ${k}`); await wait(400);
    if (k === 'victim') await shot('deduction_picker');
    await tap(page.locator('#picker-grid .picker-word-item', { hasText: w }).filter({ has: page.locator(`.word-text:text-is("${w}")`) }).first(), 'word ' + w);
  }
  const cb = page.locator(`.btn-check-section[data-section-id="${sec}"]`);
  await cb.evaluate(e => e.scrollIntoView({block:'center'})).catch(() => {}); await wait(300);
  await shot('deduction_filled_' + sec);
  await tap(cb, 'check ' + sec); await wait(900);
  await page.locator(`[data-section-id="${sec}"].deduction-section-card`).evaluate(e => e.scrollIntoView({block:'center'})).catch(() => {}); await wait(300);
  await shot('deduction_checked_' + sec);
}
L('STATE', await page.evaluate(() => JSON.stringify(Object.fromEntries(Object.entries(localStorage)).toString().slice(0,50)) + ' ' + Object.values(localStorage).join('|').slice(0, 1500)));
const zone = await page.locator('.case-resolution-zone').evaluate(e => e.className).catch(() => 'nozone'); L('ZONE', zone);
const whoBtn = page.locator('#btn-check-who');
if (await whoBtn.count()) { L('who still unchecked on deduction'); }
const ep = page.locator('#btn-open-epilogue');
await page.locator('.case-resolution-zone').evaluate(e => e.scrollIntoView({block:'center'})).catch(() => {}); await wait(900);
await shot('solve_stamp');
await tap(ep, 'epilogue'); await wait(1200); await shot('epilogue');
await page.evaluate(() => document.querySelector('.epilogue-scroll-body')?.scrollTo(0, 9999)); await wait(300); await shot('epilogue_bottom');
await tap('#btn-epilogue-next', 'next case'); await wait(1200); await shot('after_next');
L('ERRORS', JSON.stringify(errs));
// ---- GATE: real-tap Case 1 must be winnable, no occlusions/misses, no console errors ----
const st = await page.evaluate(() => { try { for (const v of Object.values(localStorage)) { const o = JSON.parse(v); if (o && o.cases) return o.cases['1']; } } catch {} return null; });
const fails = [];
if (errs.length) fails.push('console/page errors');
if (log.some(l => l.startsWith('OCCLUDED') || l.startsWith('MISS') || l.startsWith('OFFSCREEN'))) fails.push('occluded/missing/offscreen tap target');
if (!st || !st.solved) fails.push('case 1 not solved');
if (!st || !st.whoSolved) fails.push('whos-who not solved');
if (!st || (st.collectedWords || []).length < 34) fails.push('collected words ' + ((st && st.collectedWords || []).length) + '/34');
L('RESULT', fails.length ? 'FAIL: ' + fails.join('; ') : 'PASS');
fs.writeFileSync(OUT + '/play-log.txt', log.join('\n') + '\n' + errs.join('\n'));
await browser.close();
process.exit(fails.length ? 1 : 0);
