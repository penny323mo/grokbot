/**
 * 12碼讀心戰 (Penalty Mind Game v2) - Procedural WebAudio Engine
 * Zero external audio files. 100% synthesized sound effects & stadium crowd ambience.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true; // Default ON after first tap per UPGRADE_PLAN.md
    this.unlocked = false;
    this.crowdGain = null;
    this.crowdFilter = null;
    this.crowdNode = null;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
    } catch (e) {
      console.warn('WebAudio not supported:', e);
    }
  }

  unlock() {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.unlocked = true;
    if (this.enabled && !this.crowdNode) {
      this._startCrowdAmbience();
    }
  }

  toggleSound(forceState = null) {
    if (forceState !== null) {
      this.enabled = forceState;
    } else {
      this.enabled = !this.enabled;
    }
    if (!this.enabled) {
      if (this.crowdGain) {
        this.crowdGain.gain.setValueAtTime(0, this.ctx.currentTime);
      }
    } else {
      this.unlock();
      if (this.crowdGain && this.ctx) {
        this.crowdGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      }
    }
    return this.enabled;
  }

  _startCrowdAmbience() {
    if (!this.ctx || this.crowdNode) return;
    // Synthesize continuous stadium crowd rumble using filtered pink noise loop
    const bufferSize = this.ctx.sampleRate * 2.0; // 2-second looped buffer
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.035;
      b6 = white * 0.115926;
    }

    this.crowdNode = this.ctx.createBufferSource();
    this.crowdNode.buffer = buffer;
    this.crowdNode.loop = true;

    // Filter to sound like stadium acoustic chatter/rumble
    this.crowdFilter = this.ctx.createBiquadFilter();
    this.crowdFilter.type = 'lowpass';
    this.crowdFilter.frequency.setValueAtTime(550, this.ctx.currentTime);

    this.crowdGain = this.ctx.createGain();
    this.crowdGain.gain.setValueAtTime(this.enabled ? 0.04 : 0, this.ctx.currentTime);

    this.crowdNode.connect(this.crowdFilter);
    this.crowdFilter.connect(this.crowdGain);
    this.crowdGain.connect(this.ctx.destination);

    this.crowdNode.start(0);
  }

  // --- Sound Effects ---

  /**
   * Kick thud: deep bass punch with pitch drop (140Hz -> 38Hz)
   */
  playKick() {
    if (!this.enabled || !this.ctx) return;
    this.unlock();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(38, t + 0.14);

    gain.gain.setValueAtTime(0.85, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.17);

    // Haptics
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(30); } catch (e) {}
    }
  }

  /**
   * Referee Whistle: Dual high frequencies with tremolo
   */
  playWhistle() {
    if (!this.enabled || !this.ctx) return;
    this.unlock();
    const t = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(2850, t);
    osc2.frequency.setValueAtTime(3120, t);

    // Rapid burst
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.setValueAtTime(0.22, t + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.36);
    osc2.stop(t + 0.36);
  }

  /**
   * Goal Net Swish: Bandpassed white noise burst
   */
  playNet() {
    if (!this.enabled || !this.ctx) return;
    this.unlock();
    const t = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(750, t);
    filter.Q.setValueAtTime(2.5, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.40, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(t);
    noise.stop(t + 0.25);
  }

  /**
   * Post Clang: Metallic inharmonic pings with ring modulation
   */
  playPost() {
    if (!this.enabled || !this.ctx) return;
    this.unlock();
    const t = this.ctx.currentTime;

    const freqs = [880, 1340, 2120, 3180];
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      const amp = 0.35 / (idx + 1);
      gain.gain.setValueAtTime(amp, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.56);
    });
  }

  /**
   * Keeper Glove Save: Punchy padded contact
   */
  playSave(isCatch = false) {
    if (!this.enabled || !this.ctx) return;
    this.unlock();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(75, t + 0.12);

    gain.gain.setValueAtTime(0.65, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.16);
  }

  /**
   * Crowd Roar Swell on Goal
   */
  swellGoal() {
    if (!this.enabled || !this.ctx || !this.crowdGain) return;
    const t = this.ctx.currentTime;
    this.crowdFilter.frequency.setValueAtTime(550, t);
    this.crowdFilter.frequency.exponentialRampToValueAtTime(1400, t + 0.4);
    this.crowdFilter.frequency.exponentialRampToValueAtTime(600, t + 2.5);

    this.crowdGain.gain.setValueAtTime(this.crowdGain.gain.value, t);
    this.crowdGain.gain.linearRampToValueAtTime(0.35, t + 0.3);
    this.crowdGain.gain.exponentialRampToValueAtTime(0.04, t + 3.0);
  }

  /**
   * Crowd Groan / Disappointment on Save or Miss
   */
  swellMiss() {
    if (!this.enabled || !this.ctx || !this.crowdGain) return;
    const t = this.ctx.currentTime;
    this.crowdFilter.frequency.setValueAtTime(600, t);
    this.crowdFilter.frequency.linearRampToValueAtTime(320, t + 0.4);
    this.crowdFilter.frequency.linearRampToValueAtTime(550, t + 1.8);

    this.crowdGain.gain.setValueAtTime(this.crowdGain.gain.value, t);
    this.crowdGain.gain.linearRampToValueAtTime(0.18, t + 0.25);
    this.crowdGain.gain.exponentialRampToValueAtTime(0.04, t + 2.0);
  }
}

export const sound = new SoundEngine();
