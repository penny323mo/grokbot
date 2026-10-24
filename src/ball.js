/**
 * 12碼讀心戰 (Penalty Mind Game v2) - 3D Ball Module
 * Procedural football texture, spin rotation, and motion trail.
 */

import * as THREE from 'three';
import { TUNING } from './tuning.js';

export class Ball3D {
  constructor(scene) {
    this.scene = scene;
    this.mesh = null;
    this.canvas = null;
    this.ballTexture = null;
    this.ballMat = null;
    this.spinVector = new THREE.Vector3(0, 0, 0);
    this.initialPosition = new THREE.Vector3(0, TUNING.ball.radius, TUNING.goal.spotDistance);

    // Trail ribbon points
    this.trailPoints = [];
    this.trailLine = null;

    this.init();
  }

  init() {
    // Generate classic black & white football pattern onto canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = 512;
    this.canvas.height = 256;
    const ctx = this.canvas.getContext('2d');

    ctx.fillStyle = '#f8fafc'; // White leather
    ctx.fillRect(0, 0, 512, 256);

    // Draw dark hexagonal / pentagonal patches
    ctx.fillStyle = '#1e293b'; // Dark slate
    const patchPositions = [
      [128, 64], [384, 64], [256, 128], [128, 192], [384, 192],
      [0, 128], [512, 128], [64, 0], [448, 0], [64, 256], [448, 256]
    ];

    function drawPolygon(x, y, radius, sides) {
      ctx.beginPath();
      for (let i = 0; i < sides; i++) {
        const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
        const px = x + radius * Math.cos(angle);
        const py = y + radius * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    patchPositions.forEach(([px, py]) => {
      drawPolygon(px, py, 26, 5);
    });

    this.ballTexture = new THREE.CanvasTexture(this.canvas);
    this.ballTexture.wrapS = THREE.RepeatWrapping;
    this.ballTexture.wrapT = THREE.ClampToEdgeWrapping;

    const ballGeo = new THREE.SphereGeometry(TUNING.ball.radius, 24, 24);
    this.ballMat = new THREE.MeshStandardMaterial({
      map: this.ballTexture,
      roughness: 0.4,
      metalness: 0.1
    });

    this.mesh = new THREE.Mesh(ballGeo, this.ballMat);
    this.mesh.position.copy(this.initialPosition);
    this.scene.add(this.mesh);

    // Motion Trail ribbon
    const maxTrail = 30;
    const trailPositions = new Float32Array(maxTrail * 3);
    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));

    const trailMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.45,
      linewidth: 2
    });

    this.trailLine = new THREE.Line(trailGeo, trailMat);
    this.trailLine.frustumCulled = false;
    this.scene.add(this.trailLine);
  }

  reset() {
    this.mesh.position.copy(this.initialPosition);
    this.mesh.rotation.set(0, 0, 0);
    this.spinVector.set(0, 0, 0);
    this.trailPoints = [];
    this.updateTrail();
  }

  setSpin(spinObj) {
    this.spinVector.set(spinObj.x || 0, spinObj.y || 0, spinObj.z || 0);
  }

  update(pos, vel, deltaSec) {
    if (!this.mesh) return;

    if (pos) {
      this.mesh.position.set(pos.x, pos.y, pos.z);

      // Rotate ball based on forward linear velocity and spin
      if (vel) {
        const speed = Math.hypot(vel.vx, vel.vy, vel.vz);
        if (speed > 0.5) {
          // Rolling/tumbling pitch rotation
          this.mesh.rotation.x -= (vel.vz / TUNING.ball.radius) * deltaSec * 0.15;
          this.mesh.rotation.z += (vel.vx / TUNING.ball.radius) * deltaSec * 0.15;
        }
      }
      // Lateral Magnus spin around Y
      this.mesh.rotation.y += this.spinVector.y * deltaSec;

      // Update trail points
      this.trailPoints.unshift(new THREE.Vector3(pos.x, pos.y, pos.z));
      if (this.trailPoints.length > 20) {
        this.trailPoints.pop();
      }
      this.updateTrail();
    }
  }

  updateTrail() {
    if (!this.trailLine) return;
    const posAttr = this.trailLine.geometry.attributes.position;
    const count = this.trailPoints.length;

    for (let i = 0; i < posAttr.count; i++) {
      if (i < count) {
        posAttr.setXYZ(i, this.trailPoints[i].x, this.trailPoints[i].y, this.trailPoints[i].z);
      } else if (count > 0) {
        const last = this.trailPoints[count - 1];
        posAttr.setXYZ(i, last.x, last.y, last.z);
      } else {
        posAttr.setXYZ(i, 0, -100, 0);
      }
    }
    posAttr.needsUpdate = true;
  }

  applySkin(skinId) {
    if (!this.canvas || !this.ballTexture) return;
    const ctx = this.canvas.getContext('2d');
    const w = this.canvas.width;
    const h = this.canvas.height;

    let baseCol = '#f8fafc';
    let patchCol = '#1e293b';
    let strokeCol = '#475569';
    let metalness = 0.1;
    let roughness = 0.4;
    let trailCol = 0xffffff;

    if (skinId === 'ball_fire') {
      baseCol = '#dc2626';
      patchCol = '#f59e0b';
      strokeCol = '#ef4444';
      metalness = 0.2;
      roughness = 0.35;
      trailCol = 0xf59e0b;
    } else if (skinId === 'ball_cyber') {
      baseCol = '#06b6d4';
      patchCol = '#a855f7';
      strokeCol = '#00e5ff';
      metalness = 0.3;
      roughness = 0.3;
      trailCol = 0x00e5ff;
    } else if (skinId === 'ball_gold') {
      baseCol = '#18181b';
      patchCol = '#fbbf24';
      strokeCol = '#f59e0b';
      metalness = 0.8;
      roughness = 0.2;
      trailCol = 0xfbbf24;
    }

    ctx.fillStyle = baseCol;
    ctx.fillRect(0, 0, w, h);

    const patchPositions = [
      [128, 64], [384, 64], [256, 128], [128, 192], [384, 192],
      [0, 128], [512, 128], [64, 0], [448, 0], [64, 256], [448, 256]
    ];

    ctx.fillStyle = patchCol;
    ctx.strokeStyle = strokeCol;
    ctx.lineWidth = 3;

    patchPositions.forEach(([px, py]) => {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        const x = px + 26 * Math.cos(angle);
        const y = py + 26 * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });

    this.ballTexture.needsUpdate = true;
    if (this.ballMat) {
      this.ballMat.metalness = metalness;
      this.ballMat.roughness = roughness;
    }
    if (this.trailLine && this.trailLine.material) {
      this.trailLine.material.color.setHex(trailCol);
    }
  }
}
