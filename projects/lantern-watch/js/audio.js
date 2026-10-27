/**
 * js/audio.js
 * Cozy procedural WebAudio synthesizer for BGM loops, sound effects, and haptic vibration.
 * Completely local, zero network calls, zero external licensing risks.
 */

const AUDIO_STORAGE_KEY = "lantern_watch_audio_settings";

export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.musicGain = null;
    this.sfxGain = null;

    this.musicMuted = false;
    this.sfxMuted = false;
    this.currentMusicType = null;
    this.musicTimer = null;
    this.musicStep = 0;

    // Bundled audio cache
    this.audioCache = {};
    this.bgmAudio = null;

    this.unlocked = false;
    this.loadSettings();
  }

  get musicOn() { return !this.musicMuted; }
  get sfxOn() { return !this.sfxMuted; }

  /** iOS: AudioContext + media playback only start inside a user gesture. Call from the first tap. */
  unlock() {
    this.init();
    this.resume();
    if (this.unlocked) return;
    this.unlocked = true;
    if (this.ctx) {
      // Play a silent buffer: required by iOS Safari to un-suspend WebAudio.
      try {
        const b = this.ctx.createBuffer(1, 1, 22050);
        const src = this.ctx.createBufferSource();
        src.buffer = b; src.connect(this.ctx.destination); src.start(0);
      } catch (e) {}
    }
    if (!this.musicMuted) this.playMusic(this.currentMusicType || "town");
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    this.ctx = new AudioContext();

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = this.musicMuted ? 0 : 0.18;
    this.musicGain.connect(this.ctx.destination);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = this.sfxMuted ? 0 : 0.28;
    this.sfxGain.connect(this.ctx.destination);
  }

  resume() {
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  loadSettings() {
    try {
      const raw = localStorage.getItem(AUDIO_STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        this.musicMuted = !!s.musicMuted;
        this.sfxMuted = !!s.sfxMuted;
      }
    } catch (e) {}
  }

  saveSettings() {
    try {
      localStorage.setItem(
        AUDIO_STORAGE_KEY,
        JSON.stringify({
          musicMuted: this.musicMuted,
          sfxMuted: this.sfxMuted
        })
      );
    } catch (e) {}
  }

  toggleMusic() {
    this.musicMuted = !this.musicMuted;
    this.unlocked = true;
    this.init();
    this.resume();
    if (this.bgmAudio) {
      this.bgmAudio.volume = this.musicMuted ? 0 : 0.4;
      if (this.musicMuted) this.bgmAudio.pause();
      else this.bgmAudio.play().catch(() => {});
    } else if (!this.musicMuted && !this.musicTimer) {
      // Music was never started (it previously had no caller) — start it now, inside the tap.
      const type = this.currentMusicType || "town";
      this.currentMusicType = null;
      this.playMusic(type);
    }
    if (this.musicGain) {
      this.musicGain.gain.value = this.musicMuted ? 0 : 0.18;
    }
    this.saveSettings();
    return !this.musicMuted;
  }

  toggleSfx() {
    this.sfxMuted = !this.sfxMuted;
    this.init();
    this.resume();
    if (this.sfxGain) {
      this.sfxGain.gain.value = this.sfxMuted ? 0 : 0.28;
    }
    this.saveSettings();
    return !this.sfxMuted;
  }

  vibrate(pattern = [30]) {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {}
    }
  }

  // ================= BUNDLED SFX PLAY WITH WEBAUDIO FALLBACK =================
  playSfx(name) {
    if (this.sfxMuted) return;

    // Try playing bundled audio file first
    const sfxFileMap = {
      tap: "./assets/audio/sfx_tap.mp3",
      card_select: "./assets/audio/sfx_tap.mp3",
      card_play: "./assets/audio/sfx_card_play.mp3",
      summon: "./assets/audio/sfx_summon.mp3",
      hit: "./assets/audio/sfx_hit.mp3",
      push: "./assets/audio/sfx_push.mp3",
      lantern_damage: "./assets/audio/sfx_lantern_damage.mp3",
      heal: "./assets/audio/sfx_victory.mp3",
      victory: "./assets/audio/sfx_victory.mp3",
      defeat: "./assets/audio/sfx_defeat.mp3"
    };

    const filePath = sfxFileMap[name];
    if (filePath && typeof Audio !== "undefined") {
      try {
        const audio = new Audio(filePath);
        audio.volume = this.sfxMuted ? 0 : 0.5;
        audio.play().catch(() => {
          // Try .m4a format fallback before synth
          const m4aPath = filePath.replace(".mp3", ".m4a");
          const m4a = new Audio(m4aPath);
          m4a.volume = audio.volume;
          m4a.play().catch(() => {
            this.playProceduralSfx(name);
          });
        });
      } catch (e) {
        this.playProceduralSfx(name);
      }
    } else {
      this.playProceduralSfx(name);
    }

    // Trigger haptics
    this.triggerHaptic(name);
  }

  triggerHaptic(name) {
    if (name === "tap" || name === "card_select") this.vibrate([15]);
    else if (name === "card_play") this.vibrate([25]);
    else if (name === "summon") this.vibrate([35, 20, 35]);
    else if (name === "hit") this.vibrate([40]);
    else if (name === "push") this.vibrate([50]);
    else if (name === "lantern_damage") this.vibrate([60, 40, 60]);
    else if (name === "heal") this.vibrate([20, 20]);
    else if (name === "victory") this.vibrate([40, 30, 40, 30, 80]);
    else if (name === "defeat") this.vibrate([80, 50, 100]);
  }

  playProceduralSfx(name) {
    this.init();
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    switch (name) {
      case "tap":
        this.synthPluck(440, 0.05, "triangle");
        this.vibrate([15]);
        break;

      case "card_select":
        this.synthChime([523.25, 659.25], 0.12);
        this.vibrate([20]);
        break;

      case "card_play":
        this.synthWhoosh();
        this.synthChime([587.33, 880], 0.15);
        this.vibrate([30]);
        break;

      case "summon":
        this.synthGong(220, 0.6);
        this.synthChime([440, 659.25, 880], 0.35);
        this.vibrate([40, 20, 40]);
        break;

      case "hit":
        this.synthThud(120, 0.15);
        this.vibrate([35]);
        break;

      case "push":
        this.synthWhoosh(0.18);
        this.synthThud(90, 0.2);
        this.vibrate([50]);
        break;

      case "lantern_damage":
        this.synthGlassCrack();
        this.synthGong(140, 0.8);
        this.vibrate([60, 40, 60]);
        break;

      case "heal":
        this.synthChime([392, 523.25, 659.25, 783.99], 0.4);
        this.vibrate([25, 25]);
        break;

      case "victory":
        this.synthFanfare();
        this.vibrate([40, 30, 40, 30, 80]);
        break;

      case "defeat":
        this.synthDefeatCadence();
        this.vibrate([80, 50, 100]);
        break;

      default:
        this.synthPluck(330, 0.08);
    }
  }

  synthPluck(freq, duration = 0.1, type = "sine") {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const t = this.ctx.currentTime;

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + duration);
  }

  synthChime(freqs, duration = 0.25) {
    const t = this.ctx.currentTime;
    freqs.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const delay = i * 0.04;

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t + delay);

      gain.gain.setValueAtTime(0.2, t + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, t + delay + duration);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + delay);
      osc.stop(t + delay + duration);
    });
  }

  synthThud(freq = 100, duration = 0.2) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const t = this.ctx.currentTime;

    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + duration);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + duration);
  }

  synthGong(freq = 200, duration = 0.7) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const t = this.ctx.currentTime;

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.linearRampToValueAtTime(freq * 0.9, t + duration);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + duration);
  }

  synthWhoosh(duration = 0.2) {
    // Filtered noise swoosh
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    const t = this.ctx.currentTime;
    filter.frequency.setValueAtTime(400, t);
    filter.frequency.exponentialRampToValueAtTime(1200, t + duration * 0.5);
    filter.frequency.exponentialRampToValueAtTime(300, t + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    whiteNoise.start(t);
    whiteNoise.stop(t + duration);
  }

  synthGlassCrack() {
    this.synthPluck(1800, 0.08, "square");
    this.synthPluck(2400, 0.12, "sine");
  }

  synthFanfare() {
    const notes = [261.63, 329.63, 392.0, 523.25]; // C, E, G, C
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.ctx) return;
        this.synthPluck(freq, 0.25, "triangle");
      }, idx * 100);
    });
  }

  synthDefeatCadence() {
    const notes = [392.0, 369.99, 329.63, 261.63]; // Descending
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.ctx) return;
        this.synthPluck(freq, 0.35, "sine");
      }, idx * 130);
    });
  }

  // ================= BGM PLAY WITH WEBAUDIO FALLBACK =================
  playMusic(type = "town") {
    if (this.currentMusicType === type) return;
    this.stopMusic();
    this.currentMusicType = type;

    // Try playing bundled BGM audio file
    const musicFile = type === "town" ? "./assets/audio/bgm_town.mp3" : "./assets/audio/bgm_battle.mp3";
    if (typeof Audio !== "undefined") {
      try {
        const audio = new Audio(musicFile);
        audio.loop = true;
        audio.volume = this.musicMuted ? 0 : 0.4;
        this.bgmAudio = audio;
        audio.play().then(() => {
          // Muted while play() was pending (e.g. first tap was the 樂 button itself)
          if (this.musicMuted || this.bgmAudio !== audio) audio.pause();
        }).catch(() => {
          if (this.bgmAudio !== audio) return;
          // If mp3 fails, try m4a before procedural synth
          const m4aFile = musicFile.replace(".mp3", ".m4a");
          const m4a = new Audio(m4aFile);
          m4a.loop = true;
          m4a.volume = audio.volume;
          this.bgmAudio = m4a;
          m4a.play().then(() => {
            if (this.musicMuted || this.bgmAudio !== m4a) m4a.pause();
          }).catch(() => {
            if (this.bgmAudio !== m4a) return;
            this.bgmAudio = null;
            this.playProceduralMusic(type);
          });
        });
        return;
      } catch (e) {
        this.playProceduralMusic(type);
      }
    } else {
      this.playProceduralMusic(type);
    }
  }

  playProceduralMusic(type = "town") {
    this.init();
    this.resume();

    // Pentatonic cozy melodies
    const townScale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25]; // C D E G A C
    const battleScale = [220.0, 246.94, 261.63, 329.63, 349.23, 440.0]; // Am scale

    const melody =
      type === "town"
        ? [0, 2, 4, 3, 2, 0, 1, 2, 4, 5, 4, 2, 3, 1, 0, -1]
        : [0, 0, 2, 3, 2, 0, 4, 3, 2, 0, 1, 0, 3, 2, 1, -1];

    const scale = type === "town" ? townScale : battleScale;
    this.musicStep = 0;

    const playNote = () => {
      if (!this.ctx || this.musicMuted) return;

      const noteIdx = melody[this.musicStep % melody.length];
      if (noteIdx >= 0 && noteIdx < scale.length) {
        const freq = scale[noteIdx];
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = this.ctx.currentTime;

        osc.type = type === "town" ? "sine" : "triangle";
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

        osc.connect(gain);
        gain.connect(this.musicGain);

        osc.start(t);
        osc.stop(t + 0.35);
      }

      this.musicStep++;
    };

    const interval = type === "town" ? 420 : 320;
    this.musicTimer = setInterval(playNote, interval);
  }

  stopMusic() {
    if (this.bgmAudio) {
      try {
        this.bgmAudio.pause();
        this.bgmAudio = null;
      } catch (e) {}
    }
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    this.currentMusicType = null;
  }
}
