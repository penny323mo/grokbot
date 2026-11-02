// src/engine/audio.js - Diegetic WebAudio sound synthesiser for 鋦瓷記 (no external dependency, zero beeps)

class SoundSystem {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('porcelain_muted') === 'true';
    this.ambienceNode = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.initialized = true;
      }
    } catch (e) {
      console.warn('WebAudio not supported:', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(mute) {
    this.muted = !!mute;
    localStorage.setItem('porcelain_muted', this.muted);
    if (this.muted && this.ambienceNode) {
      this.stopAmbience();
    }
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  /**
   * Porcelain clink: Ceramic impact with distinct high-Q crystalline decay
   */
  playPorcelainClink(pitchMod = 1.0) {
    if (this.muted || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    
    // Impact impulse noise burst
    const bufferSize = this.ctx.sampleRate * 0.05;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    // Ceramic resonant body (multiple high-Q bandpasses)
    const baseFreqs = [1900, 3600, 5800];
    baseFreqs.forEach(freq => {
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(freq * pitchMod, t);
      filter.Q.setValueAtTime(24, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
    });

    whiteNoise.start(t);
  }

  /**
   * Shard wipe / clean: Soft cloth brush sound
   */
  playClothWipe() {
    if (this.muted || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    const dur = 0.22;
    const bufferSize = this.ctx.sampleRate * dur;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.linearRampToValueAtTime(1200, t + dur);
    filter.Q.setValueAtTime(1.5, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.linearRampToValueAtTime(0.001, t + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(t);
  }

  /**
   * Bow drill whirr: Diamond friction stroke against glaze
   */
  playBowStroke() {
    if (this.muted || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    const dur = 0.28;
    const bufferSize = this.ctx.sampleRate * dur;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(650, t);
    filter.frequency.linearRampToValueAtTime(950, t + dur * 0.5);
    filter.frequency.linearRampToValueAtTime(600, t + dur);
    filter.Q.setValueAtTime(4.0, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.02, t);
    gain.gain.linearRampToValueAtTime(0.12, t + dur * 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(t);
  }

  /**
   * Hammer tap on brass staple: Physical metallic strike (no beep)
   * Impulse noise burst shaped through high-Q resonant bandpasses
   */
  playHammerTap() {
    if (this.muted || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    const dur = 0.08;
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    // Resonant brass strike frequencies
    const f1 = this.ctx.createBiquadFilter();
    f1.type = 'bandpass';
    f1.frequency.setValueAtTime(3400, t);
    f1.Q.setValueAtTime(18, t);

    const f2 = this.ctx.createBiquadFilter();
    f2.type = 'bandpass';
    f2.frequency.setValueAtTime(6200, t);
    f2.Q.setValueAtTime(22, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    noise.connect(f1);
    noise.connect(f2);
    f1.connect(gain);
    f2.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(t);
  }

  /**
   * Water pour: Continuous bubbling liquid test
   */
  playWaterPour(duration = 1.4) {
    if (this.muted || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter1 = this.ctx.createBiquadFilter();
    filter1.type = 'bandpass';
    filter1.frequency.setValueAtTime(420, t);
    filter1.frequency.linearRampToValueAtTime(720, t + duration);
    filter1.Q.setValueAtTime(5.0, t);

    const filter2 = this.ctx.createBiquadFilter();
    filter2.type = 'bandpass';
    filter2.frequency.setValueAtTime(850, t);
    filter2.frequency.linearRampToValueAtTime(1150, t + duration);
    filter2.Q.setValueAtTime(6.0, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.14, t + 0.2);
    gain.gain.linearRampToValueAtTime(0.14, t + duration - 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(filter1);
    filter1.connect(gain);
    noise.connect(filter2);
    filter2.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(t);
  }

  /**
   * Temple Street ambience: Distant Cantonese opera radio & rain on canvas awning
   */
  startAmbience(isRain = false) {
    if (this.muted || !this.ctx || this.ambienceNode) return;
    this.resume();

    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      data[i] = (b0 + b1 + b2) * 0.08;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    // Filter for street hum or rain on awning
    const filter = this.ctx.createBiquadFilter();
    filter.type = isRain ? 'bandpass' : 'lowpass';
    filter.frequency.setValueAtTime(isRain ? 1600 : 450, t);
    if (isRain) filter.Q.setValueAtTime(1.2, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(isRain ? 0.045 : 0.02, t + 2.0);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    // Cantonese opera radio / vintage dial tone (warm quiet 175Hz hum with gentle vibrato)
    const radioOsc = this.ctx.createOscillator();
    radioOsc.type = 'sine';
    radioOsc.frequency.setValueAtTime(174.6, t); // F3

    const radioGain = this.ctx.createGain();
    radioGain.gain.setValueAtTime(0.006, t);

    radioOsc.connect(radioGain);
    radioGain.connect(this.ctx.destination);

    noise.start(t);
    radioOsc.start(t);
    this.ambienceNode = { noise, radioOsc, gain, radioGain };
  }

  stopAmbience() {
    if (this.ambienceNode && this.ctx) {
      const t = this.ctx.currentTime;
      this.ambienceNode.gain.gain.linearRampToValueAtTime(0.0001, t + 0.5);
      this.ambienceNode.radioGain.gain.linearRampToValueAtTime(0.0001, t + 0.5);
      setTimeout(() => {
        try {
          this.ambienceNode.noise.stop();
          this.ambienceNode.radioOsc.stop();
        } catch (e) {}
        this.ambienceNode = null;
      }, 550);
    }
  }
}

export const sounds = new SoundSystem();
