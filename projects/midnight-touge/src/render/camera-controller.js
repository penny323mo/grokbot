// Dynamic Multi-Angle Camera Controller for Midnight Touge (《夜峠》)
// Smooth weighty chase cam with drift yaw lead-in, bumper, cockpit & replay views
import * as THREE from '../../libs/three.module.js';

export class CameraController {
  constructor(camera) {
    this.camera = camera;
    this.camera.up.set(0, 0, 1); // Z is vertical elevation in Midnight Touge
    this.mode = "chase"; // chase, bumper, cockpit, replay

    // Target positions and orientations
    this.currentPos = new THREE.Vector3();
    this.currentTarget = new THREE.Vector3();

    // Smooth damping states
    this.smoothPos = new THREE.Vector3();
    this.smoothLook = new THREE.Vector3();

    // Camera FOV tuning
    this.baseFov = 62.0;
    this.maxFov = 78.0;

    // Shake
    this.shakeAmount = 0.0;
  }

  setMode(mode) {
    this.mode = mode;
  }

  snap(carPos, carHeading) {
    const fwX = Math.sin(carHeading);
    const fwY = Math.cos(carHeading);
    const distBehind = 7.2;
    const heightAbove = 2.5;

    this.smoothPos.set(
      carPos.x - fwX * distBehind,
      carPos.y - fwY * distBehind,
      carPos.z + heightAbove
    );
    this.smoothLook.set(
      carPos.x + fwX * 16.0,
      carPos.y + fwY * 16.0,
      carPos.z + 0.95
    );

    this.camera.position.copy(this.smoothPos);
    this.camera.lookAt(this.smoothLook);
  }

  toggleMode() {
    const modes = ["chase", "bumper", "cockpit"];
    const idx = modes.indexOf(this.mode);
    this.mode = modes[(idx + 1) % modes.length];
    return this.mode;
  }

  addShake(amount) {
    this.shakeAmount = Math.min(1.0, this.shakeAmount + amount);
  }

  update(dt, carPos, carHeading, speedKmh, slipAngleRad, rollRad = 0, pitchRad = 0) {
    const rawDt = Math.max(0.001, Math.min(dt, 1.0));
    const stepDt = Math.min(dt, 0.05);

    // Forward and Right vectors
    const fwX = Math.sin(carHeading);
    const fwY = Math.cos(carHeading);
    const rtX = Math.cos(carHeading);
    const rtY = -Math.sin(carHeading);

    // 1. Dynamic FOV based on speed (Tuned for mobile portrait 390×844)
    const speedRatio = Math.min(1.0, speedKmh / 170.0);
    const targetFov = this.baseFov + (this.maxFov - this.baseFov) * speedRatio;
    const fovAlpha = 1.0 - Math.exp(-6.0 * rawDt);
    this.camera.fov += (targetFov - this.camera.fov) * fovAlpha;
    this.camera.updateProjectionMatrix();

    // 2. Camera View Calculations
    if (this.mode === "bumper") {
      // Bumper / Hood Cam (Low and forward)
      const camX = carPos.x + fwX * 1.8;
      const camY = carPos.y + fwY * 1.8;
      const camZ = carPos.z + 0.65;

      const lookX = carPos.x + fwX * 25.0;
      const lookY = carPos.y + fwY * 25.0;
      const lookZ = carPos.z + 0.5;

      this.camera.position.set(camX, camY, camZ);
      this.camera.lookAt(lookX, lookY, lookZ);

    } else if (this.mode === "cockpit") {
      // Right-Hand Drive (RHD) In-Car Cam (Driver sits on the right: +rtX * 0.36)
      const camX = carPos.x - fwX * 0.25 + rtX * 0.36;
      const camY = carPos.y - fwY * 0.25 + rtY * 0.36;
      const camZ = carPos.z + 1.05;

      const lookX = carPos.x + fwX * 30.0 + rtX * 0.36;
      const lookY = carPos.y + fwY * 30.0 + rtY * 0.36;
      const lookZ = carPos.z + 0.8;

      this.camera.position.set(camX, camY, camZ);
      this.camera.lookAt(lookX, lookY, lookZ);
      this.camera.rotation.z += rollRad * 0.5;

    } else if (this.mode === "replay") {
      // Replay / Flyby post camera (Looks at car from side of mountain)
      const lookX = carPos.x;
      const lookY = carPos.y;
      const lookZ = carPos.z + 0.8;
      this.camera.lookAt(lookX, lookY, lookZ);

    } else {
      // Default: Cinematic Chase Cam (Tailored for mobile portrait 390×844)
      const distBehind = 7.2 + speedRatio * 1.6;
      const heightAbove = 2.5 - pitchRad * 1.5;

      // Dynamic drift lead-in: look slightly into the drift slide
      const driftOffset = Math.sin(slipAngleRad) * 1.5;

      const targetCamX = carPos.x - fwX * distBehind + rtX * driftOffset;
      const targetCamY = carPos.y - fwY * distBehind + rtY * driftOffset;
      const targetCamZ = carPos.z + heightAbove;

      // Frame-rate-independent exponential smoothing so chase camera never lags behind on slow frames
      const posAlpha = 1.0 - Math.exp(-16.0 * rawDt);
      this.smoothPos.x += (targetCamX - this.smoothPos.x) * posAlpha;
      this.smoothPos.y += (targetCamY - this.smoothPos.y) * posAlpha;
      this.smoothPos.z += (targetCamZ - this.smoothPos.z) * posAlpha;

      // Hard leash: never allow smoothPos to drift more than 1.2m from targetCam
      const dx = this.smoothPos.x - targetCamX;
      const dy = this.smoothPos.y - targetCamY;
      const dz = this.smoothPos.z - targetCamZ;
      const lagDist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (lagDist > 1.2) {
        const scale = 1.2 / lagDist;
        this.smoothPos.x = targetCamX + dx * scale;
        this.smoothPos.y = targetCamY + dy * scale;
        this.smoothPos.z = targetCamZ + dz * scale;
      }

      // Camera Look-At target (points 16m ahead down mountain road)
      const targetLookX = carPos.x + fwX * 16.0 - rtX * (driftOffset * 0.5);
      const targetLookY = carPos.y + fwY * 16.0 - rtY * (driftOffset * 0.5);
      const targetLookZ = carPos.z + 0.95;

      const lookAlpha = 1.0 - Math.exp(-20.0 * rawDt);
      this.smoothLook.x += (targetLookX - this.smoothLook.x) * lookAlpha;
      this.smoothLook.y += (targetLookY - this.smoothLook.y) * lookAlpha;
      this.smoothLook.z += (targetLookZ - this.smoothLook.z) * lookAlpha;

      // Apply subtle camera shake at high speeds or wall taps
      let shakeX = 0, shakeY = 0;
      if (this.shakeAmount > 0.01) {
        shakeX = (Math.random() - 0.5) * this.shakeAmount * 0.35;
        shakeY = (Math.random() - 0.5) * this.shakeAmount * 0.35;
        this.shakeAmount *= Math.pow(0.1, stepDt);
      }

      this.camera.position.set(
        this.smoothPos.x + shakeX,
        this.smoothPos.y + shakeY,
        this.smoothPos.z
      );
      this.camera.lookAt(
        this.smoothLook.x,
        this.smoothLook.y,
        this.smoothLook.z
      );
    }
  }
}
