// Touch & Keyboard Input Controller for Midnight Touge (《夜峠》)
// Optimized for iPhone portrait (390×844) with ergonomic two-thumb control zones
import { storage } from './storage.js';

export class InputController {
  constructor() {
    this.steer = 0.0;       // -1.0 to 1.0
    this.throttle = 1.0;    // 0.0 to 1.0 (auto-throttle default)
    this.brake = 0.0;       // 0.0 to 1.0
    this.handbrake = false; // boolean
    this.autoThrottle = true;
    this.tiltSteer = 0.0;

    // Key states
    this.keys = {};
    this.touchPointers = new Map();

    // Event callbacks
    this.onCameraToggle = () => {};
    this.onPauseToggle = () => {};

    this.bindKeyboard();
    this.bindOrientation();
  }

  bindOrientation() {
    window.addEventListener("deviceorientation", (e) => {
      if (e.gamma !== null && e.gamma !== undefined) {
        // gamma: left-to-right tilt in degrees (-90 to 90)
        this.tiltSteer = Math.max(-1.0, Math.min(1.0, e.gamma / 22.0));
      }
    });
  }

  bindKeyboard() {
    window.addEventListener("keydown", (e) => {
      this.keys[e.code] = true;
      if (e.code === "KeyC") {
        this.onCameraToggle();
      } else if (e.code === "Escape" || e.code === "KeyP") {
        this.onPauseToggle();
      }
    });

    window.addEventListener("keyup", (e) => {
      this.keys[e.code] = false;
    });
  }

  bindTouch(containerEl) {
    if (!containerEl) return;

    // Left Steer Zone
    const btnLeft = containerEl.querySelector("#btn-steer-left");
    const btnRight = containerEl.querySelector("#btn-steer-right");
    const btnBrake = containerEl.querySelector("#btn-brake");
    const btnDrift = containerEl.querySelector("#btn-drift");
    const btnThrottle = containerEl.querySelector("#btn-throttle");
    const btnCam = containerEl.querySelector("#btn-cam-switch");
    const btnPause = containerEl.querySelector("#btn-pause");

    let steerTouchLeft = false;
    let steerTouchRight = false;

    const setupPress = (el, onDown, onUp) => {
      if (!el) return;
      el.addEventListener("touchstart", (e) => {
        e.preventDefault();
        onDown();
      }, { passive: false });
      el.addEventListener("touchend", (e) => {
        e.preventDefault();
        onUp();
      }, { passive: false });
      el.addEventListener("touchcancel", (e) => {
        onUp();
      }, { passive: false });
      el.addEventListener("mousedown", onDown);
      el.addEventListener("mouseup", onUp);
      el.addEventListener("mouseleave", onUp);
    };

    setupPress(btnLeft, () => { steerTouchLeft = true; }, () => { steerTouchLeft = false; });
    setupPress(btnRight, () => { steerTouchRight = true; }, () => { steerTouchRight = false; });
    setupPress(btnBrake, () => { this.touchBrake = true; }, () => { this.touchBrake = false; });
    setupPress(btnDrift, () => { this.touchDrift = true; }, () => { this.touchDrift = false; });
    if (btnThrottle) {
      setupPress(btnThrottle, () => { this.touchThrottle = true; }, () => { this.touchThrottle = false; });
    }

    if (btnCam) {
      btnCam.addEventListener("click", (e) => {
        e.stopPropagation();
        this.onCameraToggle();
      });
    }

    if (btnPause) {
      btnPause.addEventListener("click", (e) => {
        e.stopPropagation();
        this.onPauseToggle();
      });
    }

    this.steerStateGetter = () => {
      if (steerTouchLeft && !steerTouchRight) return -1.0;
      if (steerTouchRight && !steerTouchLeft) return 1.0;
      return 0.0;
    };
  }

  update(dt) {
    const settings = (storage && storage.data && storage.data.settings) || {};
    this.autoThrottle = settings.autoThrottle !== false;
    const controlType = settings.controlType || "touch_zones";

    // 1. Process Steering (Keyboard + Touch + Tilt)
    let targetSteer = 0.0;
    if (this.keys["ArrowLeft"] || this.keys["KeyA"]) targetSteer -= 1.0;
    if (this.keys["ArrowRight"] || this.keys["KeyD"]) targetSteer += 1.0;

    if (controlType === "tilt" && Math.abs(this.tiltSteer) > 0.05) {
      targetSteer = this.tiltSteer;
    } else if (this.steerStateGetter) {
      const touchSteer = this.steerStateGetter();
      if (touchSteer !== 0) targetSteer = touchSteer;
    }

    // Smooth ramp for steering (responsive but weighty)
    const steerSpeed = targetSteer !== 0 ? 12.0 : 16.0;
    this.steer += (targetSteer - this.steer) * steerSpeed * dt;
    this.steer = Math.max(-1.0, Math.min(1.0, this.steer));

    // 2. Process Handbrake / Drift Button
    this.handbrake = !!(this.keys["Space"] || this.touchDrift);

    // 3. Process Brake
    const isBraking = !!(this.keys["ArrowDown"] || this.keys["KeyS"] || this.touchBrake);
    this.brake = isBraking ? 1.0 : 0.0;

    // 4. Process Throttle
    if (this.autoThrottle) {
      // Auto-throttle: accelerates automatically unless braking
      if (isBraking) {
        this.throttle = 0.0;
      } else {
        this.throttle = 1.0; // Keep full power during drift initiation & sustain
      }
    } else {
      // Manual throttle
      const isThrottle = !!(this.keys["ArrowUp"] || this.keys["KeyW"] || this.touchThrottle);
      this.throttle = isThrottle ? 1.0 : 0.0;
    }

    return {
      steer: this.steer,
      throttle: this.throttle,
      brake: this.brake,
      handbrake: this.handbrake
    };
  }
}
