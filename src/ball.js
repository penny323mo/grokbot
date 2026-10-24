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
    this.spinVector = new THREE.Vector3(0, 0, 0);
    this.initialPosition = new THREE.Vector3(0, TUNING.ball.radius, TUNING.goal.spotDistance);

    // Trail ribbon points
    this.trailPoints = [];
    this.trailLine = null;

    this.init();
  }

  init() {
    // Generate classic black & white football pattern onto canvas
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

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

    const ballTexture = new THREE.CanvasTexture(canvas);
    ballTexture.wrapS = THREE.RepeatWrapping;
    ballTexture.wrapT = THREE.ClampToEdgeWrapping;

    const ballGeo = new THREE.SphereGeometry(TUNING.ball.radius, 24, 24);
    const ballMat = new THREE.MeshStandardMaterial({
      map: ballTexture,
      roughness: 0.4,
      metalness: 0.1
    });

    this.mesh = new THREE.Mesh(ballGeo, ballMat);
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
}
