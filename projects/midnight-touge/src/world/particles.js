// Particle Effects Engine for Midnight Touge (《夜峠》)
// Tyre smoke, wall sparks, and asphalt skid marks
import * as THREE from '../../libs/three.module.js';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;

    // 1. Tyre Smoke Particles
    this.maxSmoke = 120;
    this.smokePool = [];
    this.smokeMesh = null;
    this.initSmoke();

    // 2. Wall Sparks Particles
    this.maxSparks = 60;
    this.sparksPool = [];
    this.sparksMesh = null;
    this.initSparks();

    // 3. Skid Marks Decals
    this.maxSkids = 400;
    this.skidIndex = 0;
    this.lastSkidLeft = null;
    this.lastSkidRight = null;
    this.skidGeometry = null;
    this.skidMesh = null;
    this.initSkids();

    // 4. Rain Particles Volume
    this.rainCount = 1000;
    this.rainGeo = null;
    this.rainMesh = null;
    this.initRain();
  }

  initRain() {
    this.rainGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(this.rainCount * 3);
    for (let i = 0; i < this.rainCount; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 60;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 60;
      pos[i * 3 + 2] = Math.random() * 35;
    }
    this.rainGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x98C0D8,
      size: 1.8,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });
    this.rainMesh = new THREE.Points(this.rainGeo, mat);
    this.rainMesh.frustumCulled = false;
    this.rainMesh.visible = false;
    this.scene.add(this.rainMesh);
  }

  initSmoke() {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(this.maxSmoke * 3);
    const opacities = new Float32Array(this.maxSmoke);
    const sizes = new Float32Array(this.maxSmoke);

    for (let i = 0; i < this.maxSmoke; i++) {
      pos[i * 3 + 2] = -10000;
      this.smokePool.push({
        active: false,
        x: 0, y: 0, z: -10000,
        vx: 0, vy: 0, vz: 0,
        life: 0, maxLife: 0.8,
        size: 1.0, opacity: 0.0
      });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Fluffy billboard particle texture for authentic voluminous tyre smoke
    let smokeTex = null;
    try {
      const c = document.createElement('canvas');
      c.width = 64; c.height = 64;
      const ctx = c.getContext('2d');
      const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 32);
      g.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      g.addColorStop(0.35, 'rgba(240, 245, 252, 0.75)');
      g.addColorStop(0.70, 'rgba(215, 225, 238, 0.35)');
      g.addColorStop(1, 'rgba(200, 215, 230, 0.0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 64, 64);
      smokeTex = new THREE.CanvasTexture(c);
    } catch (_) {}

    const mat = new THREE.PointsMaterial({
      map: smokeTex,
      color: 0xDCE6F0,
      size: 0.72,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.42,
      blending: THREE.NormalBlending,
      depthWrite: false
    });

    this.smokeMesh = new THREE.Points(geo, mat);
    this.smokeMesh.frustumCulled = false;
    this.scene.add(this.smokeMesh);
  }

  initSparks() {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(this.maxSparks * 3);

    for (let i = 0; i < this.maxSparks; i++) {
      pos[i * 3 + 2] = -10000;
      this.sparksPool.push({
        active: false,
        x: 0, y: 0, z: -10000,
        vx: 0, vy: 0, vz: 0,
        life: 0, maxLife: 0.35
      });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xFFA020,
      size: 0.22,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });

    this.sparksMesh = new THREE.Points(geo, mat);
    this.sparksMesh.frustumCulled = false;
    this.scene.add(this.sparksMesh);
  }

  initSkids() {
    this.skidGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.maxSkids * 3);
    this.skidGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.LineBasicMaterial({
      color: 0x111316,
      linewidth: 3,
      transparent: true,
      opacity: 0.75
    });

    this.skidMesh = new THREE.LineSegments(this.skidGeometry, mat);
    this.skidMesh.frustumCulled = false;
    this.scene.add(this.skidMesh);
  }

  spawnSmoke(carPos, carHeading, slipAngleDeg, speedKmh) {
    if (slipAngleDeg < 3.5 || speedKmh < 8.0) return;

    // Spawn 2 smoke puffs at rear contact patches just behind rear bumper
    const rtX = Math.cos(carHeading);
    const rtY = -Math.sin(carHeading);
    const fwX = Math.sin(carHeading);
    const fwY = Math.cos(carHeading);

    const rearDist = -2.15; // Placed cleanly behind rear bumper to billow into chase camera
    const wheelOffset = 0.78;

    for (const side of [-1, 1]) {
      const p = this.smokePool.find(s => !s.active);
      if (!p) break;

      p.active = true;
      p.x = carPos.x + fwX * rearDist + rtX * (wheelOffset * side) + (Math.random() - 0.5) * 0.18;
      p.y = carPos.y + fwY * rearDist + rtY * (wheelOffset * side) + (Math.random() - 0.5) * 0.18;
      p.z = carPos.z + 0.16;
      p.vx = -fwX * 1.8 + (Math.random() - 0.5) * 0.9;
      p.vy = -fwY * 1.8 + (Math.random() - 0.5) * 0.9;
      p.vz = 0.22 + Math.random() * 0.25;
      p.life = 0.0;
      p.maxLife = 0.55 + Math.random() * 0.25;
      p.size = 0.65 + (speedKmh / 160.0);
      p.opacity = Math.min(0.55, 0.25 + (slipAngleDeg / 40.0) * 0.3);
    }
  }

  spawnSparks(wallHitPos) {
    for (let i = 0; i < 6; i++) {
      const p = this.sparksPool.find(s => !s.active);
      if (!p) break;

      p.active = true;
      p.x = wallHitPos.x + (Math.random() - 0.5) * 0.3;
      p.y = wallHitPos.y + (Math.random() - 0.5) * 0.3;
      p.z = wallHitPos.z + 0.4 + (Math.random() - 0.5) * 0.2;
      p.vx = (Math.random() - 0.5) * 8.0;
      p.vy = (Math.random() - 0.5) * 8.0;
      p.vz = 2.0 + Math.random() * 4.0;
      p.life = 0.0;
      p.maxLife = 0.25 + Math.random() * 0.2;
    }
  }

  update(dt) {
    // 1. Update Smoke
    const smokePos = this.smokeMesh.geometry.attributes.position.array;
    for (let i = 0; i < this.maxSmoke; i++) {
      const p = this.smokePool[i];
      if (p.active) {
        p.life += dt;
        if (p.life >= p.maxLife) {
          p.active = false;
          smokePos[i * 3 + 2] = -100;
        } else {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.z += p.vz * dt;
          p.size += 2.0 * dt;

          smokePos[i * 3 + 0] = p.x;
          smokePos[i * 3 + 1] = p.y;
          smokePos[i * 3 + 2] = p.z;
        }
      } else {
        smokePos[i * 3 + 2] = -100;
      }
    }
    this.smokeMesh.geometry.attributes.position.needsUpdate = true;

    // 2. Update Sparks
    const sparksPos = this.sparksMesh.geometry.attributes.position.array;
    for (let i = 0; i < this.maxSparks; i++) {
      const p = this.sparksPool[i];
      if (p.active) {
        p.life += dt;
        if (p.life >= p.maxLife) {
          p.active = false;
          sparksPos[i * 3 + 2] = -100;
        } else {
          p.vz -= 12.0 * dt; // Gravity
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.z += p.vz * dt;

          sparksPos[i * 3 + 0] = p.x;
          sparksPos[i * 3 + 1] = p.y;
          sparksPos[i * 3 + 2] = p.z;
        }
      } else {
        sparksPos[i * 3 + 2] = -100;
      }
    }
    this.sparksMesh.geometry.attributes.position.needsUpdate = true;
  }

  addSkidSegment(carPos, carHeading, isDrifting) {
    if (!isDrifting) {
      this.lastSkidLeft = null;
      this.lastSkidRight = null;
      return;
    }

    const rtX = Math.cos(carHeading);
    const rtY = -Math.sin(carHeading);
    const fwX = Math.sin(carHeading);
    const fwY = Math.cos(carHeading);

    const rearDist = -1.2;
    const wheelOffset = 0.72;
    const groundZ = carPos.z + 0.04;

    const curLeft = {
      x: carPos.x + fwX * rearDist - rtX * wheelOffset,
      y: carPos.y + fwY * rearDist - rtY * wheelOffset,
      z: groundZ
    };
    const curRight = {
      x: carPos.x + fwX * rearDist + rtX * wheelOffset,
      y: carPos.y + fwY * rearDist + rtY * wheelOffset,
      z: groundZ
    };

    if (this.lastSkidLeft && this.lastSkidRight) {
      const pos = this.skidGeometry.attributes.position.array;
      let idx = this.skidIndex;
      pos[idx + 0] = this.lastSkidLeft.x;
      pos[idx + 1] = this.lastSkidLeft.y;
      pos[idx + 2] = this.lastSkidLeft.z;
      pos[idx + 3] = curLeft.x;
      pos[idx + 4] = curLeft.y;
      pos[idx + 5] = curLeft.z;

      pos[idx + 6] = this.lastSkidRight.x;
      pos[idx + 7] = this.lastSkidRight.y;
      pos[idx + 8] = this.lastSkidRight.z;
      pos[idx + 9] = curRight.x;
      pos[idx + 10] = curRight.y;
      pos[idx + 11] = curRight.z;

      this.skidIndex = (this.skidIndex + 12) % (this.maxSkids * 3);
      this.skidGeometry.attributes.position.needsUpdate = true;
    }

    this.lastSkidLeft = curLeft;
    this.lastSkidRight = curRight;
  }

  updateRain(cameraPos, isRaining, dt) {
    if (!this.rainMesh) return;
    if (!isRaining) {
      this.rainMesh.visible = false;
      return;
    }
    this.rainMesh.visible = true;
    const pos = this.rainGeo.attributes.position.array;
    for (let i = 0; i < this.rainCount; i++) {
      pos[i * 3 + 2] -= 48.0 * dt;
      if (pos[i * 3 + 2] < cameraPos.z - 4.0) {
        pos[i * 3 + 0] = cameraPos.x + (Math.random() - 0.5) * 45.0;
        pos[i * 3 + 1] = cameraPos.y + (Math.random() - 0.5) * 45.0;
        pos[i * 3 + 2] = cameraPos.z + 18.0 + Math.random() * 12.0;
      }
    }
    this.rainGeo.attributes.position.needsUpdate = true;
  }

  setVisible(v) {
    if (this.smokeMesh) this.smokeMesh.visible = v;
    if (this.sparksMesh) this.sparksMesh.visible = v;
    if (this.skidMesh) this.skidMesh.visible = v;
  }
}
