/**
 * 12碼讀心戰 (Penalty Mind Game v2) - Touch & Mouse Swipe Controller
 * Captures swipe gestures via PointerEvents with PointerCapture and TouchEvents fallback,
 * computes real-time aim assist, and triggers kick execution.
 */

import { swipeToLaunch, simulate, mapTapToZone, mapSwipeToZone, resolveKeeperInput } from './shot.js';
import { TUNING } from './tuning.js';

export class SwipeInput {
  constructor(canvas, onShootCallback, onSwipeMoveCallback = null) {
    this.canvas = canvas;
    this.onShoot = onShootCallback;
    this.onSwipeMove = onSwipeMoveCallback;

    this.mode = 'STRIKER'; // 'STRIKER' | 'KEEPER'
    this.onKeeperPreview = null;
    this.onKeeperDive = null;

    this.isDragging = false;
    this.points = [];
    this.enabled = false;
    this.aimAssistEnabled = false;

    // Track active pointer & touch identifiers to prevent duplicate handling
    this.activePointerId = null;
    this.activeTouchId = null;

    this.init();
  }

  init() {
    const el = this.canvas;

    // Prevent default touch scrolling & zooming
    el.style.touchAction = 'none';

    // 1. Pointer Events with setPointerCapture
    el.addEventListener('pointerdown', (e) => this.onPointerDown(e), { passive: false });
    el.addEventListener('pointermove', (e) => this.onPointerMove(e), { passive: false });
    el.addEventListener('pointerup', (e) => this.onPointerUp(e), { passive: false });
    el.addEventListener('pointercancel', (e) => this.onPointerCancel(e), { passive: false });

    // Window fallback for pointers if released outside canvas
    if (typeof window !== 'undefined') {
      window.addEventListener('pointermove', (e) => this.onWindowPointerMove(e), { passive: false });
      window.addEventListener('pointerup', (e) => this.onWindowPointerUp(e), { passive: false });
      window.addEventListener('pointercancel', (e) => this.onWindowPointerCancel(e), { passive: false });
    }

    // 2. Direct Touch Events fallback (critical for iOS Safari synthetic/touch environments)
    el.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
    el.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
    el.addEventListener('touchend', (e) => this.onTouchEnd(e), { passive: false });
    el.addEventListener('touchcancel', (e) => this.onTouchCancel(e), { passive: false });
  }

  enable() {
    this.enabled = true;
    this.isDragging = false;
    this.points = [];
    this.activePointerId = null;
    this.activeTouchId = null;
  }

  disable() {
    this.enabled = false;
    this.isDragging = false;
    this.points = [];
    this.activePointerId = null;
    this.activeTouchId = null;
    if (this.onSwipeMove) this.onSwipeMove(null);
  }

  setAimAssist(enabled) {
    this.aimAssistEnabled = enabled;
  }

  setMode(mode) {
    this.mode = mode || 'STRIKER';
  }

  // --- Unified Core Swipe Processing ---

  _startSwipe(clientX, clientY) {
    if (!this.enabled) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (this.mode === 'KEEPER') {
      // In Keeper mode, accept taps anywhere on screen (goal, pitch, surrounding)
      this.isDragging = true;
      this.points = [{ x, y, t: performance.now() }];
      const viewport = { width: rect.width, height: rect.height };
      const zone = mapTapToZone({ x, y }, viewport, TUNING);
      if (this.onKeeperPreview) {
        this.onKeeperPreview(zone, { x, y, type: 'tap' });
      }
      return;
    }

    // STRIKER mode: Accept start in bottom 75% of screen (pitch & ball area)
    if (y < rect.height * 0.25) return;

    this.isDragging = true;
    this.points = [{ x, y, t: performance.now() }];
  }

  _moveSwipe(clientX, clientY) {
    if (!this.enabled || !this.isDragging) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    this.points.push({ x, y, t: performance.now() });

    if (this.points.length > 60) {
      this.points.shift();
    }

    if (this.mode === 'KEEPER') {
      if (this.onKeeperPreview && this.points.length >= 2) {
        const viewport = { width: rect.width, height: rect.height };
        const p0 = this.points[0];
        const res = resolveKeeperInput({ start: p0, end: { x, y } }, viewport, TUNING);
        this.onKeeperPreview(res.zone, res);
      }
      return;
    }

    // Aim assist preview for tutorial in STRIKER mode
    if (this.aimAssistEnabled && this.onSwipeMove && this.points.length >= 2) {
      const viewport = { width: rect.width, height: rect.height };
      const launch = swipeToLaunch(this.points, viewport, TUNING);
      if (launch) {
        const sim = simulate(launch, 1 / 60, 0.8, TUNING);
        this.onSwipeMove(sim.trajectory);
      } else {
        this.onSwipeMove(null);
      }
    }
  }

  _endSwipe(clientX, clientY) {
    if (!this.enabled || !this.isDragging) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    this.points.push({ x, y, t: performance.now() });

    this.isDragging = false;
    if (this.onSwipeMove) this.onSwipeMove(null);

    const viewport = { width: rect.width, height: rect.height };

    if (this.mode === 'KEEPER') {
      const p0 = this.points[0] || { x, y };
      const res = resolveKeeperInput({ start: p0, end: { x, y } }, viewport, TUNING);
      this.enabled = false;
      this.points = [];
      if (this.onKeeperDive) {
        this.onKeeperDive(res.zone, res);
      } else if (this.onShoot) {
        this.onShoot({ target: { x: res.dx || 0, y: res.dy || 0 }, zone: res.zone, ...res });
      }
      return;
    }

    // STRIKER mode
    const launch = swipeToLaunch(this.points, viewport, TUNING);

    if (launch && this.onShoot) {
      this.enabled = false;
      this.onShoot(launch);
    }
    this.points = [];
  }

  _cancelSwipe() {
    this.isDragging = false;
    this.points = [];
    if (this.onSwipeMove) this.onSwipeMove(null);
  }

  // --- Pointer Event Handlers ---

  onPointerDown(e) {
    if (!this.enabled) return;
    e.preventDefault();

    // Set pointer capture to guarantee pointer events stream to canvas even if finger leaves
    if (e.pointerId !== undefined && this.canvas.setPointerCapture) {
      try {
        this.canvas.setPointerCapture(e.pointerId);
        this.activePointerId = e.pointerId;
      } catch (_) {}
    }

    this._startSwipe(e.clientX, e.clientY);
  }

  onPointerMove(e) {
    if (!this.enabled || !this.isDragging) return;
    if (this.activePointerId !== null && e.pointerId !== this.activePointerId) return;
    e.preventDefault();
    this._moveSwipe(e.clientX, e.clientY);
  }

  onPointerUp(e) {
    if (!this.enabled || !this.isDragging) return;
    if (this.activePointerId !== null && e.pointerId !== this.activePointerId) return;
    e.preventDefault();

    if (this.activePointerId !== null && this.canvas.releasePointerCapture) {
      try {
        this.canvas.releasePointerCapture(this.activePointerId);
      } catch (_) {}
      this.activePointerId = null;
    }

    this._endSwipe(e.clientX, e.clientY);
  }

  onPointerCancel(e) {
    if (this.activePointerId !== null && e.pointerId === this.activePointerId) {
      if (this.canvas.releasePointerCapture) {
        try { this.canvas.releasePointerCapture(this.activePointerId); } catch (_) {}
      }
      this.activePointerId = null;
      this._cancelSwipe();
    }
  }

  onWindowPointerMove(e) {
    // Backup for browsers where pointer capture is unsupported or dropped
    if (this.isDragging && this.activePointerId === e.pointerId) {
      this._moveSwipe(e.clientX, e.clientY);
    }
  }

  onWindowPointerUp(e) {
    if (this.isDragging && this.activePointerId === e.pointerId) {
      this.onPointerUp(e);
    }
  }

  onWindowPointerCancel(e) {
    if (this.isDragging && this.activePointerId === e.pointerId) {
      this.onPointerCancel(e);
    }
  }

  // --- Touch Event Handlers (Fallback for iOS Safari) ---

  onTouchStart(e) {
    if (!this.enabled) return;
    if (this.isDragging) return; // already active via pointer
    if (!e.touches || e.touches.length === 0) return;

    e.preventDefault();
    const touch = e.touches[0];
    this.activeTouchId = touch.identifier;
    this._startSwipe(touch.clientX, touch.clientY);
  }

  onTouchMove(e) {
    if (!this.enabled || !this.isDragging) return;
    if (this.activeTouchId === null) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === this.activeTouchId) {
        e.preventDefault();
        this._moveSwipe(t.clientX, t.clientY);
        break;
      }
    }
  }

  onTouchEnd(e) {
    if (!this.enabled || !this.isDragging) return;
    if (this.activeTouchId === null) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === this.activeTouchId) {
        e.preventDefault();
        this.activeTouchId = null;
        this._endSwipe(t.clientX, t.clientY);
        break;
      }
    }
  }

  onTouchCancel(e) {
    if (this.activeTouchId !== null) {
      this.activeTouchId = null;
      this._cancelSwipe();
    }
  }
}
