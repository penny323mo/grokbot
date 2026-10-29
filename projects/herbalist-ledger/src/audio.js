/** Small WebAudio player. Files are local and optional. */

const FILES = {
  rain: "assets/audio/rain.ogg",
  bell: "assets/audio/bell.ogg",
  paper: "assets/audio/paper.ogg",
  drawer: "assets/audio/drawer.ogg",
  scale: "assets/audio/scale.ogg",
};

let ctx = null;
let muted = false;
const buffers = {};
let rain = null;
let rainGain = null;
let unlocked = false;

export function setMute(value) {
  muted = !!value;
  if (rainGain && ctx) rainGain.gain.value = muted ? 0 : 0.22;
}

export function isMuted() {
  return muted;
}

export function toggleMute() {
  setMute(!muted);
  return muted;
}

async function context() {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") await ctx.resume();
  return ctx;
}

async function load(name) {
  if (buffers[name]) return buffers[name];
  const ac = await context();
  const res = await fetch(FILES[name]);
  if (!res.ok) return null;
  const data = await res.arrayBuffer();
  buffers[name] = await ac.decodeAudioData(data);
  return buffers[name];
}

export async function unlock() {
  if (unlocked) return;
  unlocked = true;
  try {
    await startRain();
  } catch {
    /* audio is optional */
  }
}

export async function startRain() {
  const ac = await context();
  if (rain) return;
  const buf = await load("rain");
  if (!buf) return;
  rain = ac.createBufferSource();
  rain.buffer = buf;
  rain.loop = true;
  rainGain = ac.createGain();
  rainGain.gain.value = muted ? 0 : 0.22;
  rain.connect(rainGain).connect(ac.destination);
  rain.start();
}

export async function play(name) {
  if (muted) return;
  try {
    const ac = await context();
    const buf = await load(name);
    if (!buf) return;
    const src = ac.createBufferSource();
    src.buffer = buf;
    const gain = ac.createGain();
    gain.gain.value = name === "bell" ? 0.35 : 0.5;
    src.connect(gain).connect(ac.destination);
    src.start();
  } catch {
    /* ignore missing or blocked audio */
  }
}
