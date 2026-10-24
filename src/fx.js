/**
 * 12碼讀心戰 (Penalty Mind Game v2) - Juice & Visual Effects
 * Slow-motion, camera shake, goal confetti explosion, keeper glove flash,
 * in-scene 3D 讀心 heat ring, and aim assist trajectory.
 */

import * as THREE from 'three';
import { TUNING } from './tuning.js';
import { DIVE_TARGETS } from './keeperAI.js';

export class FXManager {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;

    this.reducedMotion = false;
    if (typeof window !== 'undefined' && window.matchMedia) {
      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    // Camera shake
    this.shakeTimer = 0;
    this.shakeIntensity = 0;
    this.cameraBasePos = new THREE.Vector3().copy(camera.position);

    // Confetti system
    this.confettiGroup = null;
    this.confettiParticles = [];

    // Aim assist dotted arc line
    this.aimAssistLine = null;

    // In-scene 讀心 heat ring overlay on goal mouth
    this.mindHeatRing = null;
    this.mindHeatTimer = 0;

    this.init();
  }

  init() {
    // 1. Confetti Particle System (160 particles)
    const count = TUNING.juice.confettiCount;
    this.confettiGroup = new THREE.Group();
    const confGeo = new THREE.PlaneGeometry(0.12, 0.12);

    const colors = [0xff0055, 0x00e5ff, 0xffe600, 0x00ff66, 0xffffff, 0xaa00ff];

    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: colors[i % colors.length],
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(confGeo, mat);
      mesh.visible = false;
      this.confettiGroup.add(mesh);

      this.confettiParticles.push({
        mesh,
        vel: new THREE.Vector3(),
        rotVel: new THREE.Vector3(),
        life: 0
      });
    }
    this.scene.add(this.confettiGroup);

    // 2. Aim Assist Arc Line (faint dotted arc)
    const arcPoints = 25;
    const arcGeo = new THREE.BufferGeometry();
    const arcPositions = new Float32Array(arcPoints * 3);
    arcGeo.setAttribute('position', new THREE.BufferAttribute(arcPositions, 3));

    const arcMat = new THREE.LineDashedMaterial({
      color: 0x38bdf8,
      dashSize: 0.35,
      gapSize: 0.25,
      transparent: true,
      opacity: 0.45,
      linewidth: 2
    });
    this.aimAssistLine = new THREE.Line(arcGeo, arcMat);
    this.aimAssistLine.computeLineDistances();
    this.aimAssistLine.visible = false;
    this.scene.add(this.aimAssistLine);

    // 3. In-scene 讀心 Heat Ring on goal mouth
    // Translucent glowing circle located at predicted dive zone
    const ringGeo = new THREE.RingGeometry(0.35, 0.75, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7, // Purple glow
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    this.mindHeatRing = new THREE.Mesh(ringGeo, ringMat);
    this.mindHeatRing.position.set(0, 1.22, 0.02);
    this.mindHeatRing.visible = false;
    this.scene.add(this.mindHeatRing);
  }

  triggerShake(intensity = TUNING.juice.shakeIntensity, durationMs = TUNING.juice.shakeDurationMs) {
    if (this.reducedMotion) return;
    this.shakeIntensity = intensity;
    this.shakeTimer = durationMs / 1000;
  }

  triggerGoalExplosion(contactPoint) {
    this.triggerShake(0.09, 280);

    // Explode confetti from goal contact
    const cx = contactPoint ? contactPoint.x : 0;
    const cy = contactPoint ? contactPoint.y : 1.5;
    const cz = contactPoint ? contactPoint.z : 0;

    this.confettiParticles.forEach(p => {
      p.mesh.position.set(
        cx + (Math.random() - 0.5) * 1.5,
        cy + (Math.random() - 0.5) * 1.0,
        cz - 0.5 + (Math.random() - 0.5) * 1.0
      );
      p.mesh.visible = true;
      p.vel.set(
        (Math.random() - 0.5) * 11.0,
        Math.random() * 8.0 + 3.0,
        (Math.random() - 0.5) * 9.0
      );
      p.rotVel.set(
        Math.random() * 10 - 5,
        Math.random() * 10 - 5,
        Math.random() * 10 - 5
      );
      p.life = 1.6 + Math.random() * 0.8;
    });
  }

  showMindHeatRing(predictedZone) {
    if (!this.mindHeatRing) return;
    const target = DIVE_TARGETS[predictedZone] || DIVE_TARGETS.BM;
    this.mindHeatRing.position.set(target.x, target.y, 0.02);
    this.mindHeatRing.scale.set(0.2, 0.2, 0.2);
    this.mindHeatRing.visible = true;
    this.mindHeatTimer = TUNING.juice.revealDurationMs / 1000;
  }

  updateAimAssist(points) {
    if (!this.aimAssistLine || !points || points.length < 2) {
      if (this.aimAssistLine) this.aimAssistLine.visible = false;
      return;
    }
    const posAttr = this.aimAssistLine.geometry.attributes.position;
    const count = Math.min(posAttr.count, points.length);

    for (let i = 0; i < posAttr.count; i++) {
      const p = i < count ? points[i] : points[count - 1];
      posAttr.setXYZ(i, p.x, p.y, p.z);
    }
    posAttr.needsUpdate = true;
    this.aimAssistLine.computeLineDistances();
    this.aimAssistLine.visible = true;
  }

  hideAimAssist() {
    if (this.aimAssistLine) this.aimAssistLine.visible = false;
  }

  update(deltaSec) {
    // 1. Camera shake
    if (this.shakeTimer > 0) {
      this.shakeTimer -= deltaSec;
      const decay = Math.max(0, this.shakeTimer / (TUNING.juice.shakeDurationMs / 1000));
      const ox = (Math.random() - 0.5) * 2 * this.shakeIntensity * decay;
      const oy = (Math.random() - 0.5) * 2 * this.shakeIntensity * decay;
      this.camera.position.x += ox;
      this.camera.position.y += oy;
    }

    // 2. Confetti simulation
    let activeConfetti = false;
    this.confettiParticles.forEach(p => {
      if (p.life > 0) {
        activeConfetti = true;
        p.life -= deltaSec;
        p.vel.y -= 9.8 * deltaSec; // gravity
        p.vel.x *= 0.98;
        p.vel.z *= 0.98;

        p.mesh.position.addScaledVector(p.vel, deltaSec);
        p.mesh.rotation.x += p.rotVel.x * deltaSec;
        p.mesh.rotation.y += p.rotVel.y * deltaSec;

        if (p.mesh.position.y < 0.02) {
          p.mesh.position.y = 0.02;
          p.vel.set(0, 0, 0);
        }
        if (p.life <= 0) {
          p.mesh.visible = false;
        }
      }
    });

    // 3. Mind-reading heat ring animation
    if (this.mindHeatTimer > 0) {
      this.mindHeatTimer -= deltaSec;
      const progress = 1.0 - (this.mindHeatTimer / (TUNING.juice.revealDurationMs / 1000));
      // Pulsing expand
      const s = 1.0 + Math.sin(progress * Math.PI * 4) * 0.15;
      this.mindHeatRing.scale.set(s, s, s);
      this.mindHeatRing.rotation.z += deltaSec * 1.5;
      this.mindHeatRing.material.opacity = Math.max(0, 0.75 * (1.0 - progress));
      if (this.mindHeatTimer <= 0) {
        this.mindHeatRing.visible = false;
      }
    }
  }
}
