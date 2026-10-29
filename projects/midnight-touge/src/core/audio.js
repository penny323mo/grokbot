// Audio & Engine Sound Synthesis Engine for Midnight Touge (《夜峠》)
import { storage } from './storage.js';

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.bgmAudio = null;
    this.sfxBuffers = {};
    this.sfxNodes = {};
    this.isMuted = false;
    this.unlocked = false;

    // Real-time Web Audio Engine Synthesizer Nodes
    this.engineOsc1 = null;
    this.engineOsc2 = null;
    this.engineOsc3 = null;
    this.engineFilter = null;
    this.engineGain = null;
    this.isEngineRunning = false;

    // Tyre squeal loop node
    this.tyreLoopSource = null;
    this.tyreLoopGain = null;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }
    this.initBGM();
    this.loadSFX();
  }

  unlockAudio() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.unlocked = true;
  }

  initBGM() {
    this.bgmAudio = new Audio();
    this.bgmAudio.loop = true;
    this.bgmAudio.preload = 'auto';

    // Prefer OGG if supported, fallback to MP3
    const canOgg = this.bgmAudio.canPlayType('audio/ogg; codecs="vorbis"');
    this.bgmAudio.src = canOgg ? 'assets/audio/eurobeat_kirine.ogg' : 'assets/audio/eurobeat_kirine.mp3';
    this.updateVolumes();
  }

  playBGM() {
    if (!this.bgmAudio) this.initBGM();
    const settings = storage.data.settings;
    if (settings.musicVolume > 0 && !this.isMuted) {
      this.bgmAudio.volume = settings.musicVolume;
      this.bgmAudio.play().catch(e => {
        // Autoplay policy prevented playback until gesture
      });
    }
  }

  stopBGM() {
    if (this.bgmAudio) {
      this.bgmAudio.pause();
      this.bgmAudio.currentTime = 0;
    }
  }

  duckBGM(ducked = true) {
    if (this.bgmAudio) {
      const normalVol = storage.data.settings.musicVolume ?? 0.8;
      this.bgmAudio.volume = this.isMuted ? 0 : (ducked ? normalVol * 0.22 : normalVol);
    }
  }

  updateVolumes() {
    const settings = storage.data.settings;
    if (this.bgmAudio) {
      this.bgmAudio.volume = this.isMuted ? 0 : (settings.musicVolume || 0.8);
    }
    if (this.engineGain) {
      this.engineGain.gain.value = this.isMuted ? 0 : (settings.sfxVolume || 0.9) * 0.35;
    }
  }

  setBgmVolume(val) {
    if (this.bgmAudio) {
      this.bgmAudio.volume = Math.max(0, Math.min(1, val));
      if (val > 0 && this.bgmAudio.paused) {
        this.playBGM();
      } else if (val === 0) {
        this.bgmAudio.pause();
      }
    }
  }

  setSfxVolume(val) {
    if (this.engineGain) {
      this.engineGain.gain.value = val * 0.35;
    }
  }

  async loadSFX() {
    const sfxList = [
      'tyre_squeal', 'turbo_bov', 'gear_shift', 'wall_scrape',
      'countdown_beep', 'countdown_go', 'menu_click', 'drift_award'
    ];
    for (const name of sfxList) {
      try {
        const res = await fetch(`assets/audio/${name}.mp3`);
        const arrayBuf = await res.arrayBuffer();
        if (this.ctx) {
          const audioBuf = await this.ctx.decodeAudioData(arrayBuf);
          this.sfxBuffers[name] = audioBuf;
        }
      } catch (e) {
        // Audio will fallback gracefully
      }
    }
  }

  playSFX(name, pitchRate = 1.0, volumeMult = 1.0) {
    if (!this.ctx || this.isMuted) return;
    const buf = this.sfxBuffers[name];
    if (!buf) return;

    try {
      const src = this.ctx.createBufferSource();
      const gain = this.ctx.createGain();
      src.buffer = buf;
      src.playbackRate.value = pitchRate;

      const sfxVol = (storage.data.settings.sfxVolume || 0.9) * volumeMult;
      gain.gain.value = sfxVol;

      src.connect(gain);
      gain.connect(this.ctx.destination);
      src.start(0);
    } catch (e) {}
  }

  // --- Real-time Web Audio Multi-Harmonic Engine Synthesis ---
  startEngineSound() {
    if (!this.ctx || this.isEngineRunning) return;
    try {
      const now = this.ctx.currentTime;
      this.engineGain = this.ctx.createGain();
      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = "lowpass";
      this.engineFilter.frequency.setValueAtTime(800, now);

      // Sub fundamental (4-cylinder firing pulse)
      this.engineOsc1 = this.ctx.createOscillator();
      this.engineOsc1.type = "sawtooth";
      this.engineOsc1.frequency.setValueAtTime(35, now);

      // Mid rumble
      this.engineOsc2 = this.ctx.createOscillator();
      this.engineOsc2.type = "triangle";
      this.engineOsc2.frequency.setValueAtTime(70, now);

      // High exhaust rasp
      this.engineOsc3 = this.ctx.createOscillator();
      this.engineOsc3.type = "square";
      this.engineOsc3.frequency.setValueAtTime(105, now);

      const oscGain1 = this.ctx.createGain();
      const oscGain2 = this.ctx.createGain();
      const oscGain3 = this.ctx.createGain();
      oscGain1.gain.value = 0.55;
      oscGain2.gain.value = 0.35;
      oscGain3.gain.value = 0.15;

      this.engineOsc1.connect(oscGain1);
      this.engineOsc2.connect(oscGain2);
      this.engineOsc3.connect(oscGain3);

      oscGain1.connect(this.engineFilter);
      oscGain2.connect(this.engineFilter);
      oscGain3.connect(this.engineFilter);

      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.engineOsc1.start();
      this.engineOsc2.start();
      this.engineOsc3.start();

      this.engineGain.gain.setValueAtTime((storage.data.settings.sfxVolume || 0.9) * 0.35, now);
      this.isEngineRunning = true;
    } catch (e) {
      console.warn("Failed to start engine audio synthesis:", e);
    }
  }

  updateEngine(rpm, throttle = 0.0) {
    if (!this.isEngineRunning || !this.ctx) return;
    try {
      // 4-cylinder 4-stroke: 2 power strokes per rev -> fundamental freq = (RPM / 60) * 2
      const baseFreq = (rpm / 60.0) * 1.5;
      const now = this.ctx.currentTime;

      this.engineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.04);
      this.engineOsc2.frequency.setTargetAtTime(baseFreq * 2.0, now, 0.04);
      this.engineOsc3.frequency.setTargetAtTime(baseFreq * 3.0, now, 0.04);

      // Open lowpass filter under heavy throttle for deep throaty growl
      const filterFreq = 650 + throttle * 2800 + (rpm / 8500.0) * 1200;
      this.engineFilter.frequency.setTargetAtTime(filterFreq, now, 0.05);
    } catch (e) {}
  }

  stopEngineSound() {
    if (!this.isEngineRunning) return;
    try {
      if (this.engineOsc1) this.engineOsc1.stop();
      if (this.engineOsc2) this.engineOsc2.stop();
      if (this.engineOsc3) this.engineOsc3.stop();
      this.isEngineRunning = false;
    } catch (e) {}
  }

  updateTyreSqueal(slipAngleDeg, speedKmh) {
    // Dynamic tyre sound based on drift angle and speed
    if (slipAngleDeg > 10.0 && speedKmh > 22.0) {
      if (!this.tyreInterval || Date.now() - this.tyreInterval > 180) {
        this.tyreInterval = Date.now();
        const pitch = 0.85 + (speedKmh / 150.0) * 0.45;
        const vol = Math.min(1.0, (slipAngleDeg / 35.0) * 0.85);
        this.playSFX('tyre_squeal', pitch, vol);
      }
    }
  }
}

export const audio = new AudioEngine();
