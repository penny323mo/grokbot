import { isMutedValue, MUTE_KEY, muteStoreValue } from './sim/settings.js';

const MELODY = [523.25, 587.33, 659.25, 523.25, 783.99, 659.25, 587.33, 392];

export function createAudio() {
  let muted = false;
  try {
    muted = isMutedValue(localStorage.getItem(MUTE_KEY));
  } catch {
    muted = false;
  }

  let ctx = null;
  let master = null;
  let timer = null;
  let step = 0;
  let started = false;
  let lastClash = 0;

  function ensure() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 1;
    master.connect(ctx.destination);
  }

  function tone(freq, when, dur, type, gain) {
    if (!ctx || !master) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, when);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), when + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(when);
    osc.stop(when + dur + 0.02);
  }

  function stopBgm() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function startBgm() {
    if (!ctx || muted || timer) return;
    const beat = () => {
      if (!ctx || muted) return;
      const t = ctx.currentTime + 0.02;
      const f = MELODY[step % MELODY.length];
      tone(f, t, 0.34, 'triangle', 0.035);
      tone(f / 2, t, 0.4, 'sine', 0.02);
      step += 1;
    };
    beat();
    timer = setInterval(beat, 520);
  }

  function persist() {
    try {
      localStorage.setItem(MUTE_KEY, muteStoreValue(muted));
    } catch {
      /* private mode */
    }
  }

  return {
    get muted() {
      return muted;
    },
    unlock() {
      ensure();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();
      started = true;
      if (!muted) startBgm();
    },
    toggle() {
      ensure();
      muted = !muted;
      persist();
      if (ctx && master) {
        master.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.03);
        if (ctx.state === 'suspended') ctx.resume();
      }
      if (muted) stopBgm();
      else if (started) startBgm();
      return muted;
    },
    sfx(name) {
      if (muted) return;
      ensure();
      if (!ctx || ctx.state !== 'running') return;
      const t = ctx.currentTime + 0.01;
      if (name === 'send') {
        tone(440, t, 0.08, 'triangle', 0.05);
        tone(660, t + 0.07, 0.12, 'triangle', 0.05);
      } else if (name === 'nope') {
        tone(180, t, 0.12, 'sine', 0.04);
      } else if (name === 'clash') {
        const now = performance.now();
        if (now - lastClash < 120) return;
        lastClash = now;
        tone(210, t, 0.06, 'square', 0.03);
        tone(160, t + 0.04, 0.07, 'triangle', 0.03);
      } else if (name === 'capture') {
        tone(523, t, 0.1, 'triangle', 0.05);
        tone(659, t + 0.09, 0.1, 'triangle', 0.05);
        tone(784, t + 0.18, 0.16, 'triangle', 0.05);
      } else if (name === 'spawn') {
        tone(880, t, 0.05, 'sine', 0.02);
      } else if (name === 'win') {
        tone(523, t, 0.12, 'triangle', 0.06);
        tone(659, t + 0.12, 0.12, 'triangle', 0.06);
        tone(784, t + 0.24, 0.22, 'triangle', 0.07);
      } else if (name === 'lose') {
        tone(392, t, 0.16, 'sine', 0.05);
        tone(311, t + 0.14, 0.18, 'sine', 0.05);
        tone(247, t + 0.3, 0.28, 'triangle', 0.05);
      }
    },
  };
}
