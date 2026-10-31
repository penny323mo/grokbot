// 十號風球 · Signal Ten (1962) — Diegetic Audio Controller
const MUTE_STORAGE_KEY = 'signal_ten_1962_muted_v1';

export class SoundController {
  constructor() {
    this.muted = false;
    this.unlocked = false;
    this.loops = {};
    this.sfx = {};
    this.windIntensity = 0.15;

    try {
      if (typeof localStorage !== 'undefined') {
        this.muted = localStorage.getItem(MUTE_STORAGE_KEY) === '1';
      }
    } catch (_) {
      this.muted = false;
    }

    if (typeof Audio !== 'undefined') {
      this._initAudio();
    }
  }

  _initAudio() {
    const loopDefs = {
      rain: { src: 'assets/audio/rain.ogg', baseVol: 0.28 },
      wind: { src: 'assets/audio/wind.ogg', baseVol: 0.18 }
    };
    for (const [key, def] of Object.entries(loopDefs)) {
      const el = new Audio(def.src);
      el.loop = true;
      el.preload = 'auto';
      el.volume = this.muted ? 0 : def.baseVol;
      this.loops[key] = { el, baseVol: def.baseVol };
    }

    const sfxDefs = {
      teleprinter: { src: 'assets/audio/teleprinter.ogg', vol: 0.42 },
      phone: { src: 'assets/audio/phone.ogg', vol: 0.48 },
      paper: { src: 'assets/audio/paper.ogg', vol: 0.45 },
      siren: { src: 'assets/audio/siren.ogg', vol: 0.46 }
    };
    for (const [key, def] of Object.entries(sfxDefs)) {
      const el = new Audio(def.src);
      el.preload = 'auto';
      el.volume = def.vol;
      this.sfx[key] = { el, vol: def.vol };
    }
  }

  unlock() {
    if (this.unlocked || typeof Audio === 'undefined') return;
    this.unlocked = true;
    this.syncAmbience();
  }

  setWindIntensity(level01) {
    const clamped = Math.max(0.08, Math.min(1, Number(level01) || 0.15));
    this.windIntensity = clamped;
    if (this.loops.wind) {
      this.loops.wind.baseVol = 0.10 + clamped * 0.42;
    }
    if (this.loops.rain) {
      this.loops.rain.baseVol = 0.20 + clamped * 0.26;
    }
    this.syncAmbience();
  }

  syncAmbience() {
    if (typeof Audio === 'undefined') return;
    for (const item of Object.values(this.loops)) {
      item.el.volume = this.muted ? 0 : item.baseVol;
      if (!this.muted && this.unlocked && item.el.paused) {
        item.el.play().catch(() => {});
      } else if (this.muted && !item.el.paused) {
        item.el.pause();
      }
    }
  }

  play(name) {
    if (this.muted || typeof Audio === 'undefined') return;
    this.unlock();
    const item = this.sfx[name];
    if (!item) return;
    try {
      item.el.currentTime = 0;
      item.el.volume = item.vol;
      item.el.play().catch(() => {});
    } catch (_) {
      // Ignore autoplay errors in headless browsers
    }
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  setMuted(flag) {
    this.muted = Boolean(flag);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(MUTE_STORAGE_KEY, this.muted ? '1' : '0');
      }
    } catch (_) {}
    this.syncAmbience();
  }
}
