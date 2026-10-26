/**
 * 12碼讀心戰 (Penalty Mind Game v2) - Juice & Visual Effects
 * Slow-motion, camera shake, punch-in, goal confetti explosion, keeper glove flash,
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

    // Camera shake & punch-in offsets
    this.shakeTimer = 0;
    this.shakeIntensity = 0;
    this.shakeOffset = new THREE.Vector3(0, 0, 0);

    this.punchTimer = 0;
    this.punchDuration = 0.28;
    this.punchOffset = new THREE.Vector3(0, 0, 0);
    this.lookAtOffset = new THREE.Vector3(0, 0, 0);
    this.targetContact = null;

    // Confetti system
    this.confettiGroup = null;
    this.confettiParticles = [];

    // Aim assist dotted arc line
    this.aimAssistLine = null;

    // In-scene 3D 讀心 heat reveal across all 6 zones on the goal mouth
    this.mindZonesGroup = null;
    this.zoneMeshes = {}; // { TL: Mesh, TM: Mesh, ... }
    this.shotCrossingMarker = null;
    this.keeperReachMarker = null;
    this.mindHeatTimer = 0;

    this.init();
  }

  init() {
    // 1. Confetti Particle System (220 particles)
    const count = TUNING.juice.confettiCount || 220;
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

    // 3. In-scene 3D 讀心 6-Zone Goal Mouth Overlay & Markers
    this.mindZonesGroup = new THREE.Group();
    this.mindZonesGroup.position.set(0, 0, 0.02);
    this.mindZonesGroup.visible = false;

    const zones = [
      { id: 'TL', x: -2.44, y: 1.83, label: '左上' },
      { id: 'TM', x:  0.00, y: 1.83, label: '中上' },
      { id: 'TR', x:  2.44, y: 1.83, label: '右上' },
      { id: 'BL', x: -2.44, y: 0.61, label: '左下' },
      { id: 'BM', x:  0.00, y: 0.61, label: '中下' },
      { id: 'BR', x:  2.44, y: 0.61, label: '右下' }
    ];

    const zoneW = 2.36;
    const zoneH = 1.16;

    zones.forEach(z => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');

      // Draw initial placeholder
      ctx.fillStyle = 'rgba(30, 27, 75, 0.5)';
      ctx.fillRect(0, 0, 256, 128);
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.6)';
      ctx.lineWidth = 6;
      ctx.strokeRect(4, 4, 248, 120);

      const tex = new THREE.CanvasTexture(canvas);
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
        depthWrite: false
      });

      const planeGeo = new THREE.PlaneGeometry(zoneW, zoneH);
      const mesh = new THREE.Mesh(planeGeo, mat);
      mesh.position.set(z.x, z.y, 0);

      this.zoneMeshes[z.id] = {
        mesh,
        mat,
        canvas,
        ctx,
        tex,
        label: z.label,
        center: { x: z.x, y: z.y }
      };

      this.mindZonesGroup.add(mesh);
    });

    // 4. Actual Shot Crossing Marker (Gold glowing ring & dot)
    const shotGroup = new THREE.Group();
    const goldRingGeo = new THREE.RingGeometry(0.18, 0.25, 24);
    const goldRingMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const goldRing = new THREE.Mesh(goldRingGeo, goldRingMat);

    const goldDotGeo = new THREE.CircleGeometry(0.08, 16);
    const goldDotMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
      depthWrite: false
    });
    const goldDot = new THREE.Mesh(goldDotGeo, goldDotMat);
    shotGroup.add(goldRing);
    shotGroup.add(goldDot);
    shotGroup.position.set(0, 1.2, 0.035);
    shotGroup.visible = false;
    this.shotCrossingMarker = shotGroup;
    this.scene.add(shotGroup);

    // 5. Keeper Reach Marker (Cyan / Neon Yellow ring)
    const reachGroup = new THREE.Group();
    const reachRingGeo = new THREE.RingGeometry(0.32, 0.40, 24);
    const reachMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.90,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const reachRing = new THREE.Mesh(reachRingGeo, reachMat);
    reachGroup.add(reachRing);
    reachGroup.position.set(0, 1.2, 0.035);
    reachGroup.visible = false;
    this.keeperReachMarker = reachGroup;
    this.scene.add(reachGroup);

    this.scene.add(this.mindZonesGroup);
  }

  triggerShake(intensity = TUNING.juice.shakeIntensity, durationMs = TUNING.juice.shakeDurationMs) {
    if (this.reducedMotion) return;
    this.shakeIntensity = intensity;
    this.shakeTimer = durationMs / 1000;
  }

  triggerPunchIn(contactPoint) {
    if (this.reducedMotion) return;
    this.punchTimer = this.punchDuration;
    this.targetContact = contactPoint ? { x: contactPoint.x, y: contactPoint.y, z: contactPoint.z } : { x: 0, y: 1.5, z: 0 };
  }

  triggerGoalExplosion(contactPoint) {
    this.triggerShake(0.12, 280);
    this.triggerPunchIn(contactPoint);

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

  showMindReadingReveal(modelProbs, crossingPoint, keeperReachPoint) {
    if (!this.mindZonesGroup) return;

    const probs = (modelProbs && modelProbs.probabilities) ? modelProbs.probabilities : {
      TL: 0.16, TM: 0.17, TR: 0.17, BL: 0.16, BM: 0.17, BR: 0.17
    };

    // Update each zone's canvas texture with percentage and heatmap tint
    Object.keys(this.zoneMeshes).forEach(zoneId => {
      const zData = this.zoneMeshes[zoneId];
      const p = probs[zoneId] || 0.16;
      const pct = Math.round(p * 100);

      const ctx = zData.ctx;
      ctx.clearRect(0, 0, 256, 128);

      // Color mapping: high prob (> 25%) = Hot pink/crimson; med = purple; low = blue/cyan
      let fillCol, borderCol;
      if (p >= 0.28) {
        fillCol = 'rgba(225, 29, 72, 0.45)';
        borderCol = 'rgba(244, 63, 94, 0.95)';
      } else if (p >= 0.20) {
        fillCol = 'rgba(168, 85, 247, 0.35)';
        borderCol = 'rgba(192, 132, 252, 0.85)';
      } else {
        fillCol = 'rgba(14, 165, 233, 0.22)';
        borderCol = 'rgba(56, 189, 248, 0.55)';
      }

      ctx.fillStyle = fillCol;
      ctx.fillRect(4, 4, 248, 120);

      ctx.strokeStyle = borderCol;
      ctx.lineWidth = 5;
      ctx.strokeRect(4, 4, 248, 120);

      // Label & Probability Percentage
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 30px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${zData.label} ${pct}%`, 128, 64);

      zData.tex.needsUpdate = true;
    });

    this.mindZonesGroup.visible = true;

    // Actual shot crossing marker
    if (crossingPoint && this.shotCrossingMarker) {
      this.shotCrossingMarker.position.set(crossingPoint.x, crossingPoint.y, 0.035);
      this.shotCrossingMarker.visible = true;
    }

    // Keeper reach marker
    if (keeperReachPoint && this.keeperReachMarker) {
      this.keeperReachMarker.position.set(keeperReachPoint.x, keeperReachPoint.y, 0.035);
      this.keeperReachMarker.visible = true;
    }

    this.mindHeatTimer = (TUNING.juice.revealDurationMs || 1600) / 1000;
  }

  showMindHeatRing(predictedZone) {
    this.showMindReadingReveal(null, null, null);
  }

  showKeeperTargetZones(selectedZone = null) {
    if (!this.mindZonesGroup || !this.zoneMeshes) return;

    Object.keys(this.zoneMeshes).forEach(zoneId => {
      const zData = this.zoneMeshes[zoneId];
      const isSelected = (selectedZone === zoneId);
      const ctx = zData.ctx;
      ctx.clearRect(0, 0, 256, 128);

      if (isSelected) {
        // Vibrant glowing gold highlight for chosen zone (immediate visual feedback)
        ctx.fillStyle = 'rgba(251, 191, 36, 0.42)';
        ctx.fillRect(4, 4, 248, 120);

        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 8;
        ctx.strokeRect(4, 4, 248, 120);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 34px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`✓ ${zData.label}`, 128, 64);
      } else {
        // Semi-transparent target zone drawn over the goal during run-up
        ctx.fillStyle = selectedZone ? 'rgba(15, 23, 42, 0.20)' : 'rgba(0, 229, 255, 0.16)';
        ctx.fillRect(4, 4, 248, 120);

        ctx.strokeStyle = selectedZone ? 'rgba(148, 163, 184, 0.35)' : 'rgba(0, 229, 255, 0.70)';
        ctx.lineWidth = 4;
        ctx.strokeRect(4, 4, 248, 120);

        ctx.fillStyle = selectedZone ? 'rgba(255, 255, 255, 0.50)' : '#ffffff';
        ctx.font = 'bold 30px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(zData.label, 128, 64);
      }

      zData.mat.opacity = 0.88;
      zData.tex.needsUpdate = true;
    });

    if (this.shotCrossingMarker) this.shotCrossingMarker.visible = false;
    if (this.keeperReachMarker) this.keeperReachMarker.visible = false;
    this.mindZonesGroup.visible = true;
    this.mindHeatTimer = 0; // Keep steady, do not auto-fade during keeper runup
  }

  hideKeeperTargetZones() {
    if (this.mindZonesGroup) {
      this.mindZonesGroup.visible = false;
    }
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

  getShakeOffset() {
    return this.shakeOffset;
  }

  getPunchOffset() {
    return this.punchOffset;
  }

  getLookAtOffset() {
    return this.lookAtOffset;
  }

  update(deltaSec) {
    // 1. Camera shake calculation
    if (this.shakeTimer > 0) {
      this.shakeTimer -= deltaSec;
      const decay = Math.max(0, this.shakeTimer / (TUNING.juice.shakeDurationMs / 1000));
      this.shakeOffset.set(
        (Math.random() - 0.5) * 2 * this.shakeIntensity * decay,
        (Math.random() - 0.5) * 2 * this.shakeIntensity * decay,
        0
      );
    } else {
      this.shakeOffset.set(0, 0, 0);
    }

    // 2. Camera punch-in calculation
    if (this.punchTimer > 0 && !this.reducedMotion) {
      this.punchTimer -= deltaSec;
      const progress = 1.0 - Math.max(0, this.punchTimer / this.punchDuration);
      // Sine wave peak in middle of duration
      const factor = Math.sin(progress * Math.PI);
      // Push camera forward along Z (towards goal) by 1.8m
      this.punchOffset.set(0, -0.2 * factor, -1.8 * factor);
      if (this.targetContact) {
        this.lookAtOffset.set(
          (this.targetContact.x * 0.25) * factor,
          ((this.targetContact.y - 1.2) * 0.25) * factor,
          0
        );
      }
    } else {
      this.punchOffset.set(0, 0, 0);
      this.lookAtOffset.set(0, 0, 0);
    }

    // 3. Confetti simulation
    this.confettiParticles.forEach(p => {
      if (p.life > 0) {
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

    // 4. In-scene 3D Mind-Reading Reveal Animation
    if (this.mindHeatTimer > 0) {
      this.mindHeatTimer -= deltaSec;
      const duration = (TUNING.juice.revealDurationMs || 1600) / 1000;
      const progress = 1.0 - Math.max(0, this.mindHeatTimer / duration);
      const alpha = Math.max(0, 1.0 - progress);

      if (this.mindZonesGroup) {
        Object.values(this.zoneMeshes).forEach(z => {
          z.mat.opacity = 0.88 * alpha;
        });
      }

      if (this.shotCrossingMarker) {
        const pulse = 1.0 + Math.sin(progress * Math.PI * 6) * 0.15;
        this.shotCrossingMarker.scale.set(pulse, pulse, pulse);
        this.shotCrossingMarker.children.forEach(c => {
          if (c.material) c.material.opacity = alpha;
        });
      }

      if (this.keeperReachMarker) {
        const pulse = 1.0 + Math.cos(progress * Math.PI * 6) * 0.12;
        this.keeperReachMarker.scale.set(pulse, pulse, pulse);
        this.keeperReachMarker.children.forEach(c => {
          if (c.material) c.material.opacity = 0.9 * alpha;
        });
      }

      if (this.mindHeatTimer <= 0) {
        if (this.mindZonesGroup) this.mindZonesGroup.visible = false;
        if (this.shotCrossingMarker) this.shotCrossingMarker.visible = false;
        if (this.keeperReachMarker) this.keeperReachMarker.visible = false;
      }
    }
  }
}
