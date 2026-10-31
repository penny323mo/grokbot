// Audio manager for 季風帆影 · Monsoon Carrack
// Uses self-hosted CC0 .ogg files in assets/audio/

const SOUND_FILES = {
  sea: "assets/audio/sea.ogg",
  harbour: "assets/audio/harbour.ogg",
  creak: "assets/audio/creak.ogg",
  coins: "assets/audio/coins.ogg",
  paper: "assets/audio/paper.ogg",
  bell: "assets/audio/bell.ogg"
};

class SoundController {
  constructor() {
    this.muted = false;
    this.unlocked = false;
    this.ambientKey = null;
    this.ambientAudio = null;
    this.cache = new Map();
    try {
      if (typeof localStorage !== "undefined") {
        this.muted = localStorage.getItem("monsoon-carrack-muted") === "1";
      }
    } catch (_) {}
  }

  unlock() {
    if (this.unlocked) return;
    this.unlocked = true;
    if (this.ambientKey && !this.muted) {
      this.setAmbient(this.ambientKey);
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("monsoon-carrack-muted", this.muted ? "1" : "0");
      }
    } catch (_) {}
    if (this.muted && this.ambientAudio) {
      try {
        this.ambientAudio.pause();
      } catch (_) {}
    } else if (!this.muted && this.ambientKey) {
      this.setAmbient(this.ambientKey);
    }
    return this.muted;
  }

  play(key, volume = 0.65) {
    if (this.muted || typeof Audio === "undefined") return;
    const src = SOUND_FILES[key];
    if (!src) return;
    try {
      const a = new Audio(src);
      a.volume = Math.max(0, Math.min(1, volume));
      const p = a.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    } catch (_) {}
  }

  setAmbient(key) {
    this.ambientKey = key;
    if (this.muted || typeof Audio === "undefined") return;
    const src = SOUND_FILES[key];
    if (!src) return;
    try {
      if (this.ambientAudio && this.ambientAudio._key === key) {
        if (this.ambientAudio.paused) {
          const p = this.ambientAudio.play();
          if (p && typeof p.catch === "function") p.catch(() => {});
        }
        return;
      }
      if (this.ambientAudio) {
        try {
          this.ambientAudio.pause();
        } catch (_) {}
      }
      const a = new Audio(src);
      a._key = key;
      a.loop = true;
      a.volume = key === "sea" ? 0.34 : 0.28;
      this.ambientAudio = a;
      const p = a.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    } catch (_) {}
  }
}

export const sound = new SoundController();
export { SOUND_FILES };
