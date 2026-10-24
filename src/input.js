/**
 * 12碼讀心戰 (Penalty Mind Game v2) - Touch & Mouse Swipe Controller
 * Captures swipe gestures, computes real-time aim assist, and triggers kick execution.
 */

import { swipeToLaunch, simulate } from './shot.js';
import { TUNING } from './tuning.js';

export class SwipeInput {
  constructor(canvas, onShootCallback, onSwipeMoveCallback = null) {
    this.canvas = canvas;
    this.onShoot = onShootCallback;
    this.onSwipeMove = onSwipeMoveCallback;

    this.isDragging = false;
    this.points = [];
    this.enabled = false;
    this.aimAssistEnabled = false;

    this.init();
  }

  init() {
    const el = this.canvas;

    // Prevent all default touch scrolling & zooming
    el.style.touchAction = 'none';

    // Pointer Events (supports mouse, touch, and stylus uniformly)
    el.addEventListener('pointerdown', (e) => this.onPointerDown(e), { passive: false });
    window.addEventListener('pointermove', (e) => this.onPointerMove(e), { passive: false });
    window.addEventListener('pointerup', (e) => this.onPointerUp(e), { passive: false });
    window.addEventListener('pointercancel', (e) => this.onPointerCancel(e), { passive: false });
  }

  enable() {
    this.enabled = true;
    this.isDragging = false;
    this.points = [];
  }

  disable() {
    this.enabled = false;
    this.isDragging = false;
    this.points = [];
    if (this.onSwipeMove) this.onSwipeMove(null);
  }

  setAimAssist(enabled) {
    this.aimAssistEnabled = enabled;
  }

  onPointerDown(e) {
    if (!this.enabled) return;
    e.preventDefault();

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Swipe must start in the bottom 60% of the screen (near the ball)
    if (y < rect.height * 0.40) return;

    this.isDragging = true;
    this.points = [{ x, y, t: performance.now() }];
  }

  onPointerMove(e) {
    if (!this.enabled || !this.isDragging) return;
    e.preventDefault();

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.points.push({ x, y, t: performance.now() });

    // Limit point buffer length
    if (this.points.length > 50) {
      this.points.shift();
    }

    // Aim assist preview for tutorial
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

  onPointerUp(e) {
    if (!this.enabled || !this.isDragging) return;
    e.preventDefault();

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    this.points.push({ x, y, t: performance.now() });

    this.isDragging = false;
    if (this.onSwipeMove) this.onSwipeMove(null);

    const viewport = { width: rect.width, height: rect.height };
    const launch = swipeToLaunch(this.points, viewport, TUNING);

    if (launch && this.onShoot) {
      this.enabled = false; // Disable until round resolution
      this.onShoot(launch);
    }
    this.points = [];
  }

  onPointerCancel(e) {
    this.isDragging = false;
    this.points = [];
    if (this.onSwipeMove) this.onSwipeMove(null);
  }
}
