/**
 * 12碼讀心戰 (Penalty Mind Game v2) - 3D Stadium Scene
 * Builds pitch with procedural turf stripes, lines, goal frame with net,
 * instanced stadium stands, bobbing crowd, and night floodlights.
 */

import * as THREE from 'three';
import { TUNING } from './tuning.js';

export class StadiumScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = null;
    this.scene = null;
    this.camera = null;

    // References to dynamic meshes
    this.netMesh = null;
    this.netOriginalPositions = null;
    this.netDeformTarget = null;
    this.netDeformTime = 0;

    this.crowdInstances = null;
    this.crowdBaseY = [];
    this.crowdPhase = [];
    this.crowdCount = 0;

    this.ballBlobShadow = null;
    this.keeperBlobShadow = null;

    this.baseCameraPos = new THREE.Vector3(0, 1.70, 14.0);
    this.lookTarget = new THREE.Vector3(0, 1.22, 0);

    this.init();
  }

  init() {
    // 1. Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    // Cap devicePixelRatio at 2 for performance on mobile
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.0));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    // 2. Scene & Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060c1e); // Dark night sky
    this.scene.fog = new THREE.FogExp2(0x081028, 0.014);

    // 3. Camera
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 150);
    this.camera.position.copy(this.baseCameraPos);
    this.camera.lookAt(this.lookTarget);

    // 4. Lighting
    // Ambient hemisphere light (night blue sky, dark turf ground)
    const hemiLight = new THREE.HemisphereLight(0x7ea0e6, 0x1a3311, 0.85);
    this.scene.add(hemiLight);

    // Main stadium directional floodlight
    const dirLight = new THREE.DirectionalLight(0xfff6ea, 1.3);
    dirLight.position.set(12, 24, 16);
    this.scene.add(dirLight);

    // Subtle counter light from behind goal
    const counterLight = new THREE.DirectionalLight(0x4a6eb0, 0.45);
    counterLight.position.set(-10, 15, -12);
    this.scene.add(counterLight);

    // 5. Build Stadium Elements
    this._buildPitch();
    this._buildGoal();
    this._buildStadiumStands();
    this._buildFloodlights();
    this._buildBlobShadows();

    // Resize handler
    window.addEventListener('resize', () => this.onResize());
  }

  onResize() {
    if (!this.renderer || !this.camera) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  _buildPitch() {
    // Generate procedural mowing stripes canvas texture
    const texCanvas = document.createElement('canvas');
    texCanvas.width = 512;
    texCanvas.height = 512;
    const ctx = texCanvas.getContext('2d');

    // Alternating green stripes
    const stripeCount = 16;
    const stripeH = 512 / stripeCount;
    for (let i = 0; i < stripeCount; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#1b5e20' : '#23732a';
      ctx.fillRect(0, i * stripeH, 512, stripeH);
      // Subtle grass noise grain
      ctx.fillStyle = 'rgba(0,0,0,0.03)';
      for (let j = 0; j < 300; j++) {
        ctx.fillRect(Math.random() * 512, i * stripeH + Math.random() * stripeH, 2, 2);
      }
    }

    const turfTexture = new THREE.CanvasTexture(texCanvas);
    turfTexture.wrapS = THREE.RepeatWrapping;
    turfTexture.wrapT = THREE.RepeatWrapping;
    turfTexture.repeat.set(2, 6);

    const pitchGeo = new THREE.PlaneGeometry(68, 60);
    const pitchMat = new THREE.MeshStandardMaterial({
      map: turfTexture,
      roughness: 0.9,
      metalness: 0.05
    });
    const pitchMesh = new THREE.Mesh(pitchGeo, pitchMat);
    pitchMesh.rotation.x = -Math.PI / 2;
    pitchMesh.position.set(0, 0, 5);
    this.scene.add(pitchMesh);

    // White Pitch Lines
    this._buildPitchLines();
  }

  _buildPitchLines() {
    const linesGroup = new THREE.Group();
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    function createLine(w, h, x, z) {
      const g = new THREE.PlaneGeometry(w, h);
      const m = new THREE.Mesh(g, lineMat);
      m.rotation.x = -Math.PI / 2;
      m.position.set(x, 0.005, z);
      return m;
    }

    // Goal line
    linesGroup.add(createLine(36, 0.12, 0, 0));

    // Penalty box (40.32m wide, 16.5m deep)
    linesGroup.add(createLine(40.32, 0.12, 0, 16.5));
    linesGroup.add(createLine(0.12, 16.5, -20.16, 8.25));
    linesGroup.add(createLine(0.12, 16.5, 20.16, 8.25));

    // 6-yard box (18.32m wide, 5.5m deep)
    linesGroup.add(createLine(18.32, 0.12, 0, 5.5));
    linesGroup.add(createLine(0.12, 5.5, -9.16, 2.75));
    linesGroup.add(createLine(0.12, 5.5, 9.16, 2.75));

    // Penalty spot at Z = 11.0m (radius 0.12m)
    const spotGeo = new THREE.CircleGeometry(0.12, 24);
    const spotMesh = new THREE.Mesh(spotGeo, lineMat);
    spotMesh.rotation.x = -Math.PI / 2;
    spotMesh.position.set(0, 0.007, 11.0);
    linesGroup.add(spotMesh);

    // Penalty D Arc outside box
    const arcGeo = new THREE.RingGeometry(9.10, 9.22, 32, 1, Math.PI * 0.28, Math.PI * 0.44);
    const arcMesh = new THREE.Mesh(arcGeo, lineMat);
    arcMesh.rotation.x = -Math.PI / 2;
    arcMesh.position.set(0, 0.006, 11.0);
    linesGroup.add(arcMesh);

    this.scene.add(linesGroup);
  }

  _buildGoal() {
    const goalGroup = new THREE.Group();
    const postMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0.2
    });

    const halfW = TUNING.goal.width / 2; // 3.66m
    const h = TUNING.goal.height;        // 2.44m
    const r = TUNING.goal.postRadius;    // 0.06m
    const depth = TUNING.goal.depth;     // 2.0m

    // Left & Right upright posts
    const postGeo = new THREE.CylinderGeometry(r, r, h, 20);
    const leftPost = new THREE.Mesh(postGeo, postMat);
    leftPost.position.set(-halfW, h / 2, 0);
    goalGroup.add(leftPost);

    const rightPost = new THREE.Mesh(postGeo, postMat);
    rightPost.position.set(halfW, h / 2, 0);
    goalGroup.add(rightPost);

    // Crossbar
    const barGeo = new THREE.CylinderGeometry(r, r, TUNING.goal.width + 2 * r, 20);
    const crossbar = new THREE.Mesh(barGeo, postMat);
    crossbar.rotation.z = Math.PI / 2;
    crossbar.position.set(0, h, 0);
    goalGroup.add(crossbar);

    // Rear net frame support tubes (stanchions)
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.5 });
    const rearBarGeo = new THREE.CylinderGeometry(r * 0.7, r * 0.7, TUNING.goal.width, 16);
    const rearTopBar = new THREE.Mesh(rearBarGeo, frameMat);
    rearTopBar.rotation.z = Math.PI / 2;
    rearTopBar.position.set(0, h * 0.95, -depth);
    goalGroup.add(rearTopBar);

    const rearBottomBar = new THREE.Mesh(rearBarGeo, frameMat);
    rearBottomBar.rotation.z = Math.PI / 2;
    rearBottomBar.position.set(0, 0.05, -depth);
    goalGroup.add(rearBottomBar);

    // Left & Right depth bars
    const depthBarGeo = new THREE.CylinderGeometry(r * 0.7, r * 0.7, depth, 16);
    const leftTopDepth = new THREE.Mesh(depthBarGeo, frameMat);
    leftTopDepth.rotation.x = Math.PI / 2;
    leftTopDepth.position.set(-halfW, h, -depth / 2);
    goalGroup.add(leftTopDepth);

    const rightTopDepth = new THREE.Mesh(depthBarGeo, frameMat);
    rightTopDepth.rotation.x = Math.PI / 2;
    rightTopDepth.position.set(halfW, h, -depth / 2);
    goalGroup.add(rightTopDepth);

    // 3D Goal Net with deformable grid
    this._buildGoalNet(goalGroup, halfW, h, depth);

    this.scene.add(goalGroup);
  }

  _buildGoalNet(parent, halfW, h, depth) {
    // Generate fine net mesh using wireframe plane grid
    // Back net wall: Plane at Z = -depth
    const segX = 28;
    const segY = 14;
    const netGeo = new THREE.PlaneGeometry(halfW * 2, h, segX, segY);

    const netMat = new THREE.MeshBasicMaterial({
      color: 0xdddddd,
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });

    this.netMesh = new THREE.Mesh(netGeo, netMat);
    this.netMesh.position.set(0, h / 2, -depth);
    parent.add(this.netMesh);

    // Save baseline net positions for impact bulge deformation
    const posAttr = netGeo.attributes.position;
    this.netOriginalPositions = new Float32Array(posAttr.array);

    // Top net roof
    const topNetGeo = new THREE.PlaneGeometry(halfW * 2, depth, segX, 8);
    const topNet = new THREE.Mesh(topNetGeo, netMat);
    topNet.rotation.x = Math.PI / 2;
    topNet.position.set(0, h, -depth / 2);
    parent.add(topNet);

    // Left and Right net sides
    const sideNetGeo = new THREE.PlaneGeometry(depth, h, 8, segY);
    const leftNet = new THREE.Mesh(sideNetGeo, netMat);
    leftNet.rotation.y = Math.PI / 2;
    leftNet.position.set(-halfW, h / 2, -depth / 2);
    parent.add(leftNet);

    const rightNet = new THREE.Mesh(sideNetGeo, netMat);
    rightNet.rotation.y = -Math.PI / 2;
    rightNet.position.set(halfW, h / 2, -depth / 2);
    parent.add(rightNet);
  }

  _buildStadiumStands() {
    // 3 large spectator stands behind and alongside the goal
    const standMat = new THREE.MeshStandardMaterial({
      color: 0x18243b,
      roughness: 0.8
    });

    // North Stand (behind goal)
    const northGeo = new THREE.BoxGeometry(48, 14, 18);
    const northStand = new THREE.Mesh(northGeo, standMat);
    northStand.position.set(0, 7, -18);
    this.scene.add(northStand);

    // West Stand (left)
    const sideGeo = new THREE.BoxGeometry(16, 12, 54);
    const westStand = new THREE.Mesh(sideGeo, standMat);
    westStand.position.set(-36, 6, 8);
    this.scene.add(westStand);

    // East Stand (right)
    const eastStand = new THREE.Mesh(sideGeo, standMat);
    eastStand.position.set(36, 6, 8);
    this.scene.add(eastStand);

    // Instanced Crowd Billboard Quads
    this._buildCrowd();
  }

  _buildCrowd() {
    // 250 instanced animated crowd spectator billboards
    const crowdCount = 260;
    this.crowdCount = crowdCount;
    const crowdGeo = new THREE.PlaneGeometry(0.55, 0.85);

    // Vibrant crowd kit palette
    const colors = [
      new THREE.Color(0xd90429), // Red
      new THREE.Color(0x0077b6), // Blue
      new THREE.Color(0xffb703), // Yellow
      new THREE.Color(0xffffff), // White
      new THREE.Color(0x2a9d8f), // Teal
      new THREE.Color(0x4a4e69)  // Dark
    ];

    const crowdMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide
    });

    this.crowdInstances = new THREE.InstancedMesh(crowdGeo, crowdMat, crowdCount);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < crowdCount; i++) {
      // Position crowd across the tiered north stand behind the goal
      const row = Math.floor(i / 26);
      const col = i % 26;

      const x = (col - 13) * 1.5 + (Math.random() - 0.5) * 0.4;
      const y = 3.5 + row * 1.1 + Math.random() * 0.2;
      const z = -10.5 - row * 1.2 + (Math.random() - 0.5) * 0.3;

      dummy.position.set(x, y, z);
      dummy.rotation.x = -0.15;
      dummy.updateMatrix();

      this.crowdInstances.setMatrixAt(i, dummy.matrix);
      const colObj = colors[Math.floor(Math.random() * colors.length)];
      this.crowdInstances.setColorAt(i, colObj);

      this.crowdBaseY.push(y);
      this.crowdPhase.push(Math.random() * Math.PI * 2);
    }

    this.crowdInstances.instanceMatrix.needsUpdate = true;
    if (this.crowdInstances.instanceColor) {
      this.crowdInstances.instanceColor.needsUpdate = true;
    }
    this.scene.add(this.crowdInstances);
  }

  _buildFloodlights() {
    // 4 stadium floodlight towers with glowing lamp fixtures
    const towerPositions = [
      [-26, 22, -14],
      [ 26, 22, -14],
      [-28, 22,  22],
      [ 28, 22,  22]
    ];

    const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6 });
    const lampMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    towerPositions.forEach(([tx, ty, tz]) => {
      // Mast pole
      const mastGeo = new THREE.CylinderGeometry(0.35, 0.55, ty, 8);
      const mast = new THREE.Mesh(mastGeo, poleMat);
      mast.position.set(tx, ty / 2, tz);
      this.scene.add(mast);

      // Light head bank
      const bankGeo = new THREE.BoxGeometry(4.5, 2.2, 0.6);
      const bank = new THREE.Mesh(bankGeo, lampMat);
      bank.position.set(tx, ty, tz);
      bank.lookAt(0, 1.2, 5);
      this.scene.add(bank);
    });
  }

  _buildBlobShadows() {
    // Blob shadow texture for mobile efficiency
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sCtx = shadowCanvas.getContext('2d');
    const grad = sCtx.createRadialGradient(64, 64, 4, 64, 64, 60);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.35)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 128, 128);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false
    });

    // Ball blob shadow
    const ballShadowGeo = new THREE.PlaneGeometry(0.5, 0.5);
    this.ballBlobShadow = new THREE.Mesh(ballShadowGeo, shadowMat);
    this.ballBlobShadow.rotation.x = -Math.PI / 2;
    this.ballBlobShadow.position.set(0, 0.008, 11.0);
    this.scene.add(this.ballBlobShadow);

    // Keeper blob shadow
    const keeperShadowGeo = new THREE.PlaneGeometry(1.6, 1.1);
    this.keeperBlobShadow = new THREE.Mesh(keeperShadowGeo, shadowMat);
    this.keeperBlobShadow.rotation.x = -Math.PI / 2;
    this.keeperBlobShadow.position.set(0, 0.008, 0.05);
    this.scene.add(this.keeperBlobShadow);
  }

  /**
   * Trigger physical net deformation bulge at impact point
   */
  deformNet(contactX, contactY) {
    this.netDeformTarget = { x: contactX, y: contactY };
    this.netDeformTime = 0.65; // duration in seconds
  }

  /**
   * Per-frame animation update
   */
  update(timeSec, deltaSec, ballPos, keeperPos) {
    // 1. Idle camera sway
    const swayX = Math.sin(timeSec * 0.75) * 0.04;
    const swayY = Math.cos(timeSec * 0.95) * 0.03;
    this.camera.position.x = this.baseCameraPos.x + swayX;
    this.camera.position.y = this.baseCameraPos.y + swayY;
    this.camera.lookAt(this.lookTarget);

    // 2. Animate crowd bobbing
    if (this.crowdInstances) {
      const dummy = new THREE.Object3D();
      for (let i = 0; i < this.crowdCount; i++) {
        this.crowdInstances.getMatrixAt(i, dummy.matrix);
        dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

        // Sinusoidal bob
        dummy.position.y = this.crowdBaseY[i] + Math.sin(timeSec * 4.5 + this.crowdPhase[i]) * 0.06;
        dummy.updateMatrix();
        this.crowdInstances.setMatrixAt(i, dummy.matrix);
      }
      this.crowdInstances.instanceMatrix.needsUpdate = true;
    }

    // 3. Update Blob Shadows
    if (ballPos && this.ballBlobShadow) {
      this.ballBlobShadow.position.x = ballPos.x;
      this.ballBlobShadow.position.z = ballPos.z;
      // Fade and expand shadow as ball ascends
      const height = Math.max(0, ballPos.y - TUNING.ball.radius);
      const scale = 1.0 + height * 0.35;
      this.ballBlobShadow.scale.set(scale, scale, 1);
      this.ballBlobShadow.material.opacity = Math.max(0.12, 0.65 - height * 0.18);
    }

    if (keeperPos && this.keeperBlobShadow) {
      this.keeperBlobShadow.position.x = keeperPos.x;
      this.keeperBlobShadow.position.z = keeperPos.z || 0.05;
      const kHeight = Math.max(0, keeperPos.y - 0.95);
      const kScale = 1.0 + kHeight * 0.25;
      this.keeperBlobShadow.scale.set(kScale, kScale, 1);
      this.keeperBlobShadow.material.opacity = Math.max(0.15, 0.60 - kHeight * 0.15);
    }

    // 4. Update Net Bulge Physics
    if (this.netMesh && this.netDeformTime > 0) {
      this.netDeformTime -= deltaSec;
      const decay = Math.max(0, this.netDeformTime / 0.65);
      const posAttr = this.netMesh.geometry.attributes.position;
      const orig = this.netOriginalPositions;
      const tx = this.netDeformTarget ? this.netDeformTarget.x : 0;
      const ty = (this.netDeformTarget ? this.netDeformTarget.y : 1.22) - TUNING.goal.height / 2;

      for (let i = 0; i < posAttr.count; i++) {
        const ox = orig[i * 3];
        const oy = orig[i * 3 + 1];
        const oz = orig[i * 3 + 2];

        const d2 = (ox - tx) * (ox - tx) + (oy - ty) * (oy - ty);
        const bulge = Math.exp(-d2 * 1.5) * 0.65 * decay;

        posAttr.setZ(i, oz - bulge); // push backward along Z
      }
      posAttr.needsUpdate = true;
    } else if (this.netMesh && this.netOriginalPositions && this.netDeformTime <= 0) {
      // Reset net to rest
      const posAttr = this.netMesh.geometry.attributes.position;
      posAttr.array.set(this.netOriginalPositions);
      posAttr.needsUpdate = true;
    }
  }

  render() {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
