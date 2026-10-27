/**
 * 濠江疑案 · Harbour Casebook
 * 音效與配樂引擎 (Audio Manager & Web Audio Fallback)
 * 專為 iOS / 移動端優化：延遲至使用者首次觸摸後解鎖，並提供雙軌無縫循環與合成器後備
 */

import { storage } from './storage.js';

class AudioManager {
  constructor() {
    this.initialized = false;
    this.audioCtx = null;
    this.currentBgm = null;
    this.currentBgmName = null;
    this.bgmAudio = new Audio();
    this.bgmAudio.loop = true;
    this.sfxAudios = {};

    // Available SFX map
    this.sfxPaths = {
      paper_slide: 'assets/audio/paper_slide.mp3',
      word_collect: 'assets/audio/word_collect.mp3',
      pen_scratch: 'assets/audio/pen_scratch.mp3',
      stamp_thud: 'assets/audio/stamp_thud.mp3',
      error_tick: 'assets/audio/error_tick.mp3',
      hint_chime: 'assets/audio/hint_chime.mp3'
    };

    // Available BGM map
    this.bgmPaths = {
      investigation: {
        ogg: 'assets/audio/investigation.ogg',
        mp3: 'assets/audio/investigation.mp3'
      },
      resolution: {
        ogg: 'assets/audio/resolution.ogg',
        mp3: 'assets/audio/resolution.mp3'
      }
    };
  }

  /**
   * 由使用者首次點擊/觸摸時呼叫，以解除 iOS 瀏覽器自動播放限制
   */
  initOnUserGesture() {
    if (this.initialized) return;
    this.initialized = true;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume();
        }
      }
    } catch (e) {
      console.warn('Web Audio Context initialization error:', e);
    }

    // Preload SFX
    Object.entries(this.sfxPaths).forEach(([key, path]) => {
      try {
        const audio = new Audio();
        audio.src = path;
        audio.preload = 'auto';
        this.sfxAudios[key] = audio;
      } catch (err) {
        // Ignored
      }
    });

    // Start playing stored BGM if any
    const settings = storage.getSettings();
    if (!settings.musicMuted && this.currentBgmName) {
      this.playBGM(this.currentBgmName);
    }
  }

  playBGM(name) {
    this.currentBgmName = name;
    const settings = storage.getSettings();
    if (settings.musicMuted) return;
    if (!this.initialized) return; // Will play on first gesture

    const track = this.bgmPaths[name];
    if (!track) return;

    try {
      // Pick best supported format
      const canOgg = this.bgmAudio.canPlayType('audio/ogg; codecs="vorbis"');
      const src = (canOgg && canOgg !== '') ? track.ogg : track.mp3;
      
      if (this.bgmAudio.src !== src && !this.bgmAudio.src.endsWith(src)) {
        this.bgmAudio.src = src;
      }
      this.bgmAudio.volume = Math.max(0, Math.min(1, settings.musicVolume || 0.7));
      const playPromise = this.bgmAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          // Autoplay blocked until gesture
          console.log('BGM play deferred pending user tap:', err.message);
        });
      }
    } catch (e) {
      console.warn('BGM play error:', e);
    }
  }

  stopBGM() {
    try {
      this.bgmAudio.pause();
      this.bgmAudio.currentTime = 0;
    } catch (e) {}
  }

  playSFX(name) {
    const settings = storage.getSettings();
    if (settings.sfxMuted) return;

    // First try real audio element
    const sfxPath = this.sfxPaths[name];
    if (sfxPath && typeof Audio !== 'undefined') {
      try {
        const sfx = new Audio(sfxPath);
        sfx.volume = Math.max(0, Math.min(1, settings.sfxVolume || 0.8));
        const p = sfx.play();
        if (p !== undefined) {
          p.catch(() => {
            // If failed, trigger Web Audio synth fallback
            this.playSynthFallback(name);
          });
        }
        return;
      } catch (e) {
        // Fallback
      }
    }

    this.playSynthFallback(name);
  }

  /**
   * Web Audio API 合成器後備，在音效檔無法播放時產生風格相符的真實合成音
   */
  playSynthFallback(name) {
    if (!this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    try {
      if (name === 'stamp_thud') {
        // Deep resonant heavy wood stamp thud
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);
        gain.gain.setValueAtTime(0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (name === 'word_collect') {
        // Gentle pentatonic bamboo/harp chime
        const freqs = [587.33, 880]; // D5 -> A5
        freqs.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.06);
          gain.gain.setValueAtTime(0, now + i * 0.06);
          gain.gain.linearRampToValueAtTime(0.3, now + i * 0.06 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.06);
          osc.stop(now + i * 0.06 + 0.25);
        });
      } else if (name === 'pen_scratch') {
        // High soft paper scratch tick
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.linearRampToValueAtTime(800, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (name === 'error_tick') {
        // Dull woodblock tick
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(120, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (name === 'hint_chime') {
        // Brass bell shimmer
        const freqs = [659.25, 783.99, 987.77];
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.05);
          gain.gain.setValueAtTime(0.25, now + idx * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.05);
          osc.stop(now + idx * 0.05 + 0.4);
        });
      } else {
        // paper slide
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(260, now + 0.12);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      }
    } catch (err) {
      // Ignored
    }
  }

  setMusicMuted(isMuted) {
    storage.updateSettings({ musicMuted: isMuted });
    if (isMuted) {
      this.bgmAudio.pause();
    } else if (this.currentBgmName) {
      this.playBGM(this.currentBgmName);
    }
  }

  setSfxMuted(isMuted) {
    storage.updateSettings({ sfxMuted: isMuted });
  }

  setMusicVolume(vol) {
    storage.updateSettings({ musicVolume: vol });
    this.bgmAudio.volume = Math.max(0, Math.min(1, vol));
  }
}

export const audio = new AudioManager();
