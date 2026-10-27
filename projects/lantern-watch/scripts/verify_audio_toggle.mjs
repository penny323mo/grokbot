// E2E: 樂/聲 toggles at 390px on title + battle: class/aria state, gain + <audio> mute/unmute, persistence.
import fs from "node:fs"; import assert from "node:assert"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const puppeteer = require("/workspace/nightly/shotkit/node_modules/puppeteer-core");
const URL = process.argv[2] || "http://127.0.0.1:8898/index.html";
const OUT = "screenshots/v10-audio"; fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox", "--disable-gpu", "--autoplay-policy=user-gesture-required"] });
const p = await b.newPage(); const errs = [];
p.on("pageerror", e => errs.push(e.message));
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await p.evaluateOnNewDocument(() => { localStorage.setItem('lt_tutorial_seen', '1'); localStorage.setItem('lantern_tactics_v4_tutorial', '1'); if (!sessionStorage.getItem('clr')) { sessionStorage.setItem('clr', '1'); localStorage.removeItem('lantern_watch_audio_settings'); } });
await p.goto(URL, { waitUntil: "networkidle2" }); await sleep(600);
const st = () => p.evaluate(() => { const s = window.__lt.app.sound; const m = document.getElementById('btnToggleMusic'), f = document.getElementById('btnToggleSfx');
  return { mOff: m.classList.contains('is-off'), fOff: f.classList.contains('is-off'), mAria: m.getAttribute('aria-pressed'), fAria: f.getAttribute('aria-pressed'),
    mGain: s.musicGain?.gain.value, fGain: s.sfxGain?.gain.value, ctx: s.ctx?.state, bgmPaused: s.bgmAudio ? s.bgmAudio.paused : null, bgmVol: s.bgmAudio?.volume, saved: localStorage.getItem('lantern_watch_audio_settings') }; });
const log = [];
// 樂/聲 live in the ≡ menu since round 11: open it first if the button is hidden, then do a real tap.
const tapMenu = async (sel) => {
  const vis = await p.evaluate(s => { const e = document.querySelector(s); return !!e && e.offsetParent !== null; }, sel);
  if (!vis) { await p.tap('#btnTopMenu'); await sleep(250); }
  await p.tap(sel); await sleep(50);
  await p.evaluate(() => { const d = document.getElementById('topMenuDropdown'); if (d) d.style.display = 'none'; });
};
let s = await st(); console.log(JSON.stringify(s)); log.push(['title-initial', s]); assert.ok(!s.mOff && !s.fOff && s.mAria === 'true');
await tapMenu('#btnToggleMusic'); await sleep(300); s = await st(); log.push(['title-music-off', s]);console.log(JSON.stringify(s));
assert.ok(s.mOff && !s.fOff && s.mGain === 0 && s.ctx === 'running' && s.fGain > 0 && (s.bgmPaused !== false));
await p.screenshot({ path: `${OUT}/390-title-music-off.png` });
await tapMenu('#btnToggleMusic'); await sleep(600); s = await st(); log.push(['title-music-on', s]);
assert.ok(!s.mOff && s.mGain > 0 && s.bgmPaused === false && s.bgmVol > 0, 'music should actually play');
await tapMenu('#btnToggleSfx'); await sleep(300); s = await st(); log.push(['title-sfx-off', s]);
assert.ok(s.fOff && !s.mOff && s.fGain === 0 && s.mGain > 0);
assert.deepEqual(JSON.parse(s.saved), { musicMuted: false, sfxMuted: true });
await p.reload({ waitUntil: "networkidle2" }); await sleep(600); s = await st(); log.push(['after-reload', s]);
assert.ok(s.fOff && !s.mOff && s.fAria === 'false', 'persisted state reflected on load');
await p.evaluate(() => window.__lt.launchBattle(1)); await sleep(2500);

await tapMenu('#btnToggleSfx'); await sleep(300); s = await st(); log.push(['battle-sfx-on', s]); assert.ok(!s.fOff && s.fGain > 0);
await tapMenu('#btnToggleMusic'); await sleep(300); s = await st(); log.push(['battle-music-off', s]); assert.ok(s.mOff && s.mGain === 0 && s.bgmPaused !== false);
await p.screenshot({ path: `${OUT}/390-battle-music-off.png` });
await tapMenu('#btnToggleMusic'); await sleep(500); s = await st(); log.push(['battle-music-on', s]); assert.ok(!s.mOff && s.mGain > 0 && s.bgmPaused === false);
await sleep(1500);
{ const bm = await p.evaluate(() => { const a = window.__lt.app.sound.bgmAudio; return { src: a?.src, buf: !!a?.isBufferLoop, node: !!a?.node, loop: a?.node?.loop, paused: a?.paused, type: window.__lt.app.sound.currentMusicType }; });
  console.log('battle-bgm', JSON.stringify(bm)); log.push(['battle-bgm', bm]);
  assert.ok(/battle-bgm\.(mp3|ogg)\?v=/.test(bm.src) && bm.type === 'battle' && bm.paused === false, 'battle scene must play battle-bgm');
  assert.ok(!bm.buf || (bm.node && bm.loop === true), 'gapless buffer loop'); }
await p.screenshot({ path: `${OUT}/390-battle-both-on.png` });
await tapMenu('#btnToggleSfx'); await tapMenu('#btnToggleMusic'); await sleep(300);
await p.screenshot({ path: `${OUT}/390-battle-both-off.png` });
assert.deepEqual(errs, []);
for (const [k, v] of log) console.log(k, JSON.stringify(v));
console.log("AUDIO TOGGLE E2E PASS"); await b.close();
