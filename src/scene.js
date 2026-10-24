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

    // Dynamic meshes
    this.netMesh = null;
    this.netOriginalPositions = null;
    this.netDeformTarget = null;
    this.netDeformTime = 0;

    this.crowdTorsoInstances = null;
    this.crowdHeadInstances = null;
    this.crowdBaseY = [];
    this.crowdBaseHeadY = [];
    this.crowdPhase = [];
    this.crowdCount = 0;

    this.ballBlobShadow = null;
    this.keeperBlobShadow = null;

    // 390x844 Framing: full ball near bottom, goal in middle, grandstand & lights above
    this.baseCameraPos = new THREE.Vector3(0, 1.85, 15.6);
    this.lookTarget = new THREE.Vector3(0, 1.15, 2.5);

    // Keeper Camera: Behind-the-striker view showing full goal, keeper, and human-sized striker
    this.keeperCameraPos = new THREE.Vector3(0, 2.35, 18.2);
    this.keeperLookTarget = new THREE.Vector3(0, 1.15, 1.0);

    // Replay Camera: Side broadcast TV angle
    this.cameraMode = 'MAIN'; // 'MAIN' | 'KEEPER' | 'REPLAY'
    this.replayCameraPos = new THREE.Vector3(5.8, 1.8, 4.2);
    this.replayLookTarget = new THREE.Vector3(0, 1.2, 0.5);

    this.adTexture = null;
    this.resizeObserver = null;

    this.init();
  }

  init() {
    // 1. Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.0));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    // 2. Scene & Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060c1e); // Dark night stadium sky
    this.scene.fog = new THREE.FogExp2(0x081028, 0.012);

    // 3. Camera (56 deg FOV ensures full ball in lower third and stands in upper third)
    const aspect = this.canvas.clientWidth / Math.max(1, this.canvas.clientHeight) || (390 / 844);
    this.camera = new THREE.PerspectiveCamera(56, aspect, 0.1, 160);
    this.camera.position.copy(this.baseCameraPos);
    this.camera.lookAt(this.lookTarget);

    // Initial resize to match canvas element
    this.onResize();

    // 4. Lighting
    this.hemiLight = new THREE.HemisphereLight(0x7ea0e6, 0x1a3311, 0.90);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xfff6ea, 1.4);
    this.dirLight.position.set(10, 20, 15);
    this.scene.add(this.dirLight);

    this.counterLight = new THREE.DirectionalLight(0x4a6eb0, 0.50);
    this.counterLight.position.set(-8, 14, -10);
    this.scene.add(this.counterLight);

    // 5. Build Stadium Elements
    this._buildPitch();
    this._buildGoal();
    this._buildStadiumStands();
    this._buildFloodlights();
    this._buildBlobShadows();

    // Resize handlers (window & container ResizeObserver)
    window.addEventListener('resize', () => this.onResize());
    if (typeof ResizeObserver !== 'undefined' && this.canvas.parentElement) {
      this.resizeObserver = new ResizeObserver(() => this.onResize());
      this.resizeObserver.observe(this.canvas.parentElement);
    }
  }

  onResize() {
    if (!this.renderer || !this.camera || !this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    // false parameter preserves canvas layout style set in CSS
    this.renderer.setSize(width, height, false);
  }

  _buildPitch() {
    // Generate procedural mowing stripes canvas texture
    const texCanvas = document.createElement('canvas');
    texCanvas.width = 512;
    texCanvas.height = 512;
    const ctx = texCanvas.getContext('2d');

    const stripeCount = 16;
    const stripeH = 512 / stripeCount;
    for (let i = 0; i < stripeCount; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#1b5e20' : '#23732a';
      ctx.fillRect(0, i * stripeH, 512, stripeH);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      for (let j = 0; j < 120; j++) {
        ctx.fillRect(Math.random() * 512, i * stripeH + Math.random() * stripeH, 2, 2);
      }
    }

    const grassTex = new THREE.CanvasTexture(texCanvas);
    grassTex.wrapS = THREE.RepeatWrapping;
    grassTex.wrapT = THREE.RepeatWrapping;
    grassTex.repeat.set(8, 16);

    const pitchGeo = new THREE.PlaneGeometry(68, 105);
    const pitchMat = new THREE.MeshStandardMaterial({
      map: grassTex,
      roughness: 0.85,
      metalness: 0.05
    });

    const pitch = new THREE.Mesh(pitchGeo, pitchMat);
    pitch.rotation.x = -Math.PI / 2;
    pitch.position.set(0, 0, 15);
    this.scene.add(pitch);

    this._buildPitchLines();
  }

  _buildPitchLines() {
    const lineMat = new THREE.MeshBasicMaterial({
      color: 0xf8fafc,
      transparent: true,
      opacity: 0.88,
      depthWrite: false
    });

    const lineW = 0.12;
    const boxW = 40.32;
    const boxD = 16.5;

    // Penalty box front line (at Z = 16.5m)
    const boxFrontGeo = new THREE.PlaneGeometry(boxW, lineW);
    const boxFront = new THREE.Mesh(boxFrontGeo, lineMat);
    boxFront.rotation.x = -Math.PI / 2;
    boxFront.position.set(0, 0.005, 16.5);
    this.scene.add(boxFront);

    // Goal line (Z = 0)
    const goalLineGeo = new THREE.PlaneGeometry(boxW, lineW);
    const goalLine = new THREE.Mesh(goalLineGeo, lineMat);
    goalLine.rotation.x = -Math.PI / 2;
    goalLine.position.set(0, 0.005, 0);
    this.scene.add(goalLine);

    // Box side lines (Left & Right)
    const boxSideGeo = new THREE.PlaneGeometry(lineW, boxD);
    const boxLeft = new THREE.Mesh(boxSideGeo, lineMat);
    boxLeft.rotation.x = -Math.PI / 2;
    boxLeft.position.set(-boxW / 2, 0.005, boxD / 2);
    this.scene.add(boxLeft);

    const boxRight = new THREE.Mesh(boxSideGeo, lineMat);
    boxRight.rotation.x = -Math.PI / 2;
    boxRight.position.set(boxW / 2, 0.005, boxD / 2);
    this.scene.add(boxRight);

    // 6-yard box
    const sixW = 18.32;
    const sixD = 5.5;

    const sixFrontGeo = new THREE.PlaneGeometry(sixW, lineW);
    const sixFront = new THREE.Mesh(sixFrontGeo, lineMat);
    sixFront.rotation.x = -Math.PI / 2;
    sixFront.position.set(0, 0.006, sixD);
    this.scene.add(sixFront);

    const sixSideGeo = new THREE.PlaneGeometry(lineW, sixD);
    const sixLeft = new THREE.Mesh(sixSideGeo, lineMat);
    sixLeft.rotation.x = -Math.PI / 2;
    sixLeft.position.set(-sixW / 2, 0.006, sixD / 2);
    this.scene.add(sixLeft);

    const sixRight = new THREE.Mesh(sixSideGeo, lineMat);
    sixRight.rotation.x = -Math.PI / 2;
    sixRight.position.set(sixW / 2, 0.006, sixD / 2);
    this.scene.add(sixRight);

    // Penalty Spot (11.0m from goal line, radius 0.15m)
    const spotGeo = new THREE.CircleGeometry(0.16, 24);
    const spot = new THREE.Mesh(spotGeo, lineMat);
    spot.rotation.x = -Math.PI / 2;
    spot.position.set(0, 0.007, TUNING.goal.spotDistance);
    this.scene.add(spot);

    // Penalty Arc (D-box arc outside penalty box)
    const arcRadius = 9.15;
    const arcSegments = 32;
    const arcGeo = new THREE.BufferGeometry();
    const arcPoints = [];

    const angleStart = -Math.PI * 0.28;
    const angleEnd = Math.PI * 0.28;

    for (let i = 0; i <= arcSegments; i++) {
      const a = angleStart + (angleEnd - angleStart) * (i / arcSegments);
      const px = Math.sin(a) * arcRadius;
      const pz = TUNING.goal.spotDistance + Math.cos(a) * arcRadius;
      if (pz > 16.5) {
        arcPoints.push(new THREE.Vector3(px, 0.007, pz));
      }
    }

    if (arcPoints.length > 1) {
      arcGeo.setFromPoints(arcPoints);
      const arcLine = new THREE.Line(arcGeo, new THREE.LineBasicMaterial({ color: 0xf8fafc, linewidth: 2 }));
      this.scene.add(arcLine);
    }
  }

  _buildGoal() {
    const gw = TUNING.goal.width;      // 7.32m
    const gh = TUNING.goal.height;     // 2.44m
    const pr = TUNING.goal.postRadius; // 0.06m
    const depth = TUNING.goal.depth;   // 2.0m

    const postMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.25,
      metalness: 0.8
    });

    // 1. Left Post
    const postGeo = new THREE.CylinderGeometry(pr, pr, gh, 20);
    const leftPost = new THREE.Mesh(postGeo, postMat);
    leftPost.position.set(-gw / 2, gh / 2, 0);
    this.scene.add(leftPost);

    // 2. Right Post
    const rightPost = new THREE.Mesh(postGeo, postMat);
    rightPost.position.set(gw / 2, gh / 2, 0);
    this.scene.add(rightPost);

    // 3. Crossbar
    const barGeo = new THREE.CylinderGeometry(pr, pr, gw + pr * 2, 20);
    const crossbar = new THREE.Mesh(barGeo, postMat);
    crossbar.rotation.z = Math.PI / 2;
    crossbar.position.set(0, gh, 0);
    this.scene.add(crossbar);

    // 4. Rear Net Support Frame (depth poles)
    const rearMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.5 });
    const topPoleGeo = new THREE.CylinderGeometry(0.04, 0.04, depth, 12);

    const lTopPole = new THREE.Mesh(topPoleGeo, rearMat);
    lTopPole.rotation.x = Math.PI / 2;
    lTopPole.position.set(-gw / 2, gh, -depth / 2);
    this.scene.add(lTopPole);

    const rTopPole = new THREE.Mesh(topPoleGeo, rearMat);
    rTopPole.rotation.x = Math.PI / 2;
    rTopPole.position.set(gw / 2, gh, -depth / 2);
    this.scene.add(rTopPole);

    // Rear top horizontal bar
    const rearBarGeo = new THREE.CylinderGeometry(0.04, 0.04, gw, 12);
    const rearTopBar = new THREE.Mesh(rearBarGeo, rearMat);
    rearTopBar.rotation.z = Math.PI / 2;
    rearTopBar.position.set(0, gh, -depth);
    this.scene.add(rearTopBar);

    // 5. Goal Net
    this._buildGoalNet(gw, gh, depth);
  }

  _buildGoalNet(gw, gh, depth) {
    const segX = 24;
    const segY = 14;

    const netGeo = new THREE.PlaneGeometry(gw, gh, segX, segY);
    const pos = netGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      pos.setZ(i, -depth);
    }
    pos.needsUpdate = true;
    netGeo.computeVertexNormals();

    this.netOriginalPositions = new Float32Array(pos.array);

    const netMat = new THREE.MeshStandardMaterial({
      color: 0xecfdf5,
      wireframe: true,
      roughness: 0.9,
      transparent: true,
      opacity: 0.50,
      side: THREE.DoubleSide
    });

    this.netMesh = new THREE.Mesh(netGeo, netMat);
    this.netMesh.position.set(0, gh / 2, 0);
    this.scene.add(this.netMesh);

    // Net side panels
    const sideGeo = new THREE.PlaneGeometry(depth, gh, 8, 12);
    const lSide = new THREE.Mesh(sideGeo, netMat);
    lSide.rotation.y = Math.PI / 2;
    lSide.position.set(-gw / 2, gh / 2, -depth / 2);
    this.scene.add(lSide);

    const rSide = new THREE.Mesh(sideGeo, netMat);
    rSide.rotation.y = -Math.PI / 2;
    rSide.position.set(gw / 2, gh / 2, -depth / 2);
    this.scene.add(rSide);

    // Net top roof panel
    const roofGeo = new THREE.PlaneGeometry(gw, depth, 16, 6);
    const roof = new THREE.Mesh(roofGeo, netMat);
    roof.rotation.x = Math.PI / 2;
    roof.position.set(0, gh, -depth / 2);
    this.scene.add(roof);
  }

  setCameraMode(mode) {
    if (mode === 'REPLAY') this.cameraMode = 'REPLAY';
    else if (mode === 'KEEPER') this.cameraMode = 'KEEPER';
    else this.cameraMode = 'MAIN';
  }

  applyAtmosphere(stadiumSkinId) {
    if (!this.scene) return;

    if (stadiumSkinId === 'stadium_sunset') {
      // Golden Sunset Dusk
      this.scene.background.setHex(0x38180a);
      if (this.scene.fog) {
        this.scene.fog.color.setHex(0x2d1205);
        this.scene.fog.density = 0.010;
      }
      if (this.hemiLight) {
        this.hemiLight.color.setHex(0xf59e0b);
        this.hemiLight.groundColor.setHex(0x1a2e05);
        this.hemiLight.intensity = 0.85;
      }
      if (this.dirLight) {
        this.dirLight.color.setHex(0xfbbf24);
        this.dirLight.intensity = 1.6;
        this.dirLight.position.set(12, 14, 12);
      }
      if (this.counterLight) {
        this.counterLight.color.setHex(0xc2410c);
        this.counterLight.intensity = 0.65;
      }
    } else if (stadiumSkinId === 'stadium_day') {
      // Bright Daylight Pitch
      this.scene.background.setHex(0x60a5fa);
      if (this.scene.fog) {
        this.scene.fog.color.setHex(0x93c5fd);
        this.scene.fog.density = 0.005;
      }
      if (this.hemiLight) {
        this.hemiLight.color.setHex(0xffffff);
        this.hemiLight.groundColor.setHex(0x274a14);
        this.hemiLight.intensity = 1.1;
      }
      if (this.dirLight) {
        this.dirLight.color.setHex(0xfffbeb);
        this.dirLight.intensity = 1.8;
        this.dirLight.position.set(8, 26, 10);
      }
      if (this.counterLight) {
        this.counterLight.color.setHex(0xbfdbfe);
        this.counterLight.intensity = 0.55;
      }
    } else {
      // Default Night Stadium
      this.scene.background.setHex(0x060c1e);
      if (this.scene.fog) {
        this.scene.fog.color.setHex(0x081028);
        this.scene.fog.density = 0.012;
      }
      if (this.hemiLight) {
        this.hemiLight.color.setHex(0x7ea0e6);
        this.hemiLight.groundColor.setHex(0x1a3311);
        this.hemiLight.intensity = 0.90;
      }
      if (this.dirLight) {
        this.dirLight.color.setHex(0xfff6ea);
        this.dirLight.intensity = 1.4;
        this.dirLight.position.set(10, 20, 15);
      }
      if (this.counterLight) {
        this.counterLight.color.setHex(0x4a6eb0);
        this.counterLight.intensity = 0.50;
      }
    }
  }

  updateCrowdTeamColors(teamAColor, teamBColor) {
    if (!this.crowdTorsoInstances) return;
    const colA = new THREE.Color(teamAColor || 0xdc2626);
    const colB = new THREE.Color(teamBColor || 0x1d4ed8);
    const neutralCols = [
      new THREE.Color(0x334155),
      new THREE.Color(0x1e293b),
      new THREE.Color(0xd1d5db)
    ];

    for (let i = 0; i < this.crowdCount; i++) {
      const rand = Math.random();
      let c;
      if (rand < 0.45) c = colA;
      else if (rand < 0.80) c = colB;
      else c = neutralCols[Math.floor(Math.random() * neutralCols.length)];
      this.crowdTorsoInstances.setColorAt(i, c);
    }
    if (this.crowdTorsoInstances.instanceColor) {
      this.crowdTorsoInstances.instanceColor.needsUpdate = true;
    }
  }

  _buildStadiumStands() {
    const concreteMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Slate concrete
      roughness: 0.9,
      metalness: 0.1
    });
    const edgeMat = new THREE.MeshStandardMaterial({
      color: 0x475569, // Riser edge strip
      roughness: 0.8
    });

    // 10 visible stepped concrete terrace risers
    for (let r = 0; r < 10; r++) {
      const stepY = 0.425 + r * 0.85;
      const stepZ = -6.2 - r * 0.75;
      const stepGeo = new THREE.BoxGeometry(44, 0.85, 1.0);
      const stepMesh = new THREE.Mesh(stepGeo, concreteMat);
      stepMesh.position.set(0, stepY, stepZ);
      this.scene.add(stepMesh);

      // Step edge highlight line
      const edgeGeo = new THREE.BoxGeometry(44, 0.08, 0.08);
      const edgeMesh = new THREE.Mesh(edgeGeo, edgeMat);
      edgeMesh.position.set(0, stepY + 0.425, stepZ + 0.5);
      this.scene.add(edgeMesh);
    }

    // Grandstand back wall
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.95 });
    const backWallGeo = new THREE.BoxGeometry(46, 16, 2);
    const backWall = new THREE.Mesh(backWallGeo, wallMat);
    backWall.position.set(0, 8.0, -14.5);
    this.scene.add(backWall);

    // Roof canopy with cantilever overhang
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
    const roofGeo = new THREE.BoxGeometry(46, 0.8, 12);
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, 12.8, -10.5);
    this.scene.add(roof);

    // Structural support trusses under roof
    const trussMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7 });
    for (let tx = -18; tx <= 18; tx += 9) {
      const trussGeo = new THREE.CylinderGeometry(0.12, 0.12, 8.5, 8);
      const truss = new THREE.Mesh(trussGeo, trussMat);
      truss.rotation.x = -Math.PI * 0.12;
      truss.position.set(tx, 10.5, -12.5);
      this.scene.add(truss);
    }

    // West & East Stand side blocks
    const sideMat = new THREE.MeshStandardMaterial({ color: 0x162035, roughness: 0.85 });
    const westStand = new THREE.Mesh(new THREE.BoxGeometry(14, 12, 44), sideMat);
    westStand.position.set(-22, 6, 4);
    this.scene.add(westStand);

    const eastStand = new THREE.Mesh(new THREE.BoxGeometry(14, 12, 44), sideMat);
    eastStand.position.set(22, 6, 4);
    this.scene.add(eastStand);

    // Pitchside LED advertising boards behind goal
    this._buildAdBoards();

    // Crowd spectators on the stepped terraces
    this._buildCrowd();
  }

  _buildAdBoards() {
    const adCanvas = document.createElement('canvas');
    adCanvas.width = 1024;
    adCanvas.height = 128;
    const ctx = adCanvas.getContext('2d');

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 1024, 0);
    bgGrad.addColorStop(0, '#0a1128');
    bgGrad.addColorStop(0.3, '#0d1b3e');
    bgGrad.addColorStop(0.7, '#0a1128');
    bgGrad.addColorStop(1, '#0d1b3e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1024, 128);

    // Glowing top/bottom LED strips
    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(0, 0, 1024, 6);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(0, 122, 1024, 6);

    // Dynamic LED text & logos
    ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#ffffff';
    ctx.fillText('⚽ 12碼讀心戰 · PENALTY MIND GAME', 256, 64);
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('⚡ AI 讀心大對決 · 港式狂熱十二碼', 768, 64);

    this.adTexture = new THREE.CanvasTexture(adCanvas);
    this.adTexture.wrapS = THREE.RepeatWrapping;
    this.adTexture.repeat.set(2.0, 1.0);

    const adMat = new THREE.MeshBasicMaterial({
      map: this.adTexture,
      toneMapped: false
    });

    const adGeo = new THREE.BoxGeometry(32, 0.95, 0.25);
    const adMesh = new THREE.Mesh(adGeo, adMat);
    adMesh.position.set(0, 0.475, -3.8); // Located behind goal net (depth 2m)
    this.scene.add(adMesh);

    // Dark frame structure behind LED boards
    const frameGeo = new THREE.BoxGeometry(32.2, 0.15, 0.35);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
    const topFrame = new THREE.Mesh(frameGeo, frameMat);
    topFrame.position.set(0, 0.98, -3.8);
    this.scene.add(topFrame);
  }

  _buildCrowd() {
    // 260 seated 3D spectators (torso box + head box with desaturated kit colours on concrete terraces)
    const crowdCount = 260;
    this.crowdCount = crowdCount;

    const torsoGeo = new THREE.BoxGeometry(0.38, 0.44, 0.28);
    const headGeo = new THREE.BoxGeometry(0.20, 0.22, 0.20);

    // Realistic match crowd desaturated team & fan kit colours
    const kitColors = [
      new THREE.Color(0x1e3a5f), // Navy
      new THREE.Color(0x334155), // Slate
      new THREE.Color(0x7f1d1d), // Burgundy / Dark Red
      new THREE.Color(0x14532d), // Dark Forest Green
      new THREE.Color(0x1f2937), // Charcoal
      new THREE.Color(0x92400e), // Muted Ochre / Amber
      new THREE.Color(0x0f766e), // Dark Teal
      new THREE.Color(0xd1d5db), // Light Warm Grey
      new THREE.Color(0x475569)  // Medium Slate
    ];

    const skinHairColors = [
      new THREE.Color(0x271c19), // Dark brown / black hair
      new THREE.Color(0x1c1917), // Black hair
      new THREE.Color(0x4a2c11), // Brown hair
      new THREE.Color(0xffd1a4), // Light skin
      new THREE.Color(0xd49b6a), // Tan skin
      new THREE.Color(0x6b4f3b)  // Medium brown hair
    ];

    const torsoMat = new THREE.MeshStandardMaterial({
      roughness: 0.85,
      metalness: 0.05
    });
    const headMat = new THREE.MeshStandardMaterial({
      roughness: 0.75,
      metalness: 0.0
    });

    this.crowdTorsoInstances = new THREE.InstancedMesh(torsoGeo, torsoMat, crowdCount);
    this.crowdHeadInstances = new THREE.InstancedMesh(headGeo, headMat, crowdCount);

    const dummyTorso = new THREE.Object3D();
    const dummyHead = new THREE.Object3D();

    for (let i = 0; i < crowdCount; i++) {
      // 10 stepped rows on open terraces: rows 0-9
      const row = Math.floor(i / 26);
      const col = i % 26;

      // Concrete tread height: stepY = 0.425 + row * 0.85; treadTop = stepY + 0.425 = 0.85 + row * 0.85;
      const treadTop = 0.85 + row * 0.85;
      const stepZ = -6.2 - row * 0.75;

      const x = (col - 12.5) * 1.45 + (Math.random() - 0.5) * 0.25;
      const torsoY = treadTop + 0.22;
      const headY = treadTop + 0.44 + 0.11;
      const z = stepZ + 0.12 + (Math.random() - 0.5) * 0.08;

      dummyTorso.position.set(x, torsoY, z);
      dummyTorso.updateMatrix();
      this.crowdTorsoInstances.setMatrixAt(i, dummyTorso.matrix);

      dummyHead.position.set(x, headY, z);
      dummyHead.updateMatrix();
      this.crowdHeadInstances.setMatrixAt(i, dummyHead.matrix);

      const kitCol = kitColors[Math.floor(Math.random() * kitColors.length)];
      this.crowdTorsoInstances.setColorAt(i, kitCol);

      const headCol = skinHairColors[Math.floor(Math.random() * skinHairColors.length)];
      this.crowdHeadInstances.setColorAt(i, headCol);

      this.crowdBaseY.push(torsoY);
      this.crowdBaseHeadY.push(headY);
      this.crowdPhase.push(Math.random() * Math.PI * 2);
    }

    this.crowdTorsoInstances.instanceMatrix.needsUpdate = true;
    if (this.crowdTorsoInstances.instanceColor) this.crowdTorsoInstances.instanceColor.needsUpdate = true;
    this.scene.add(this.crowdTorsoInstances);

    this.crowdHeadInstances.instanceMatrix.needsUpdate = true;
    if (this.crowdHeadInstances.instanceColor) this.crowdHeadInstances.instanceColor.needsUpdate = true;
    this.scene.add(this.crowdHeadInstances);
  }

  _buildFloodlights() {
    // 4 stadium floodlight towers with glowing lamp fixtures & visible flare halos
    // Lowered Y into frame (~13m) so lights shine in upper corners of the 390x844 view
    const towerPositions = [
      [-15, 13.0, -8],
      [ 15, 13.0, -8],
      [-18, 14.0, 12],
      [ 18, 14.0, 12]
    ];

    const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6 });
    const lampMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Procedural glowing flare texture for lamp glow
    const flareCanvas = document.createElement('canvas');
    flareCanvas.width = 128;
    flareCanvas.height = 128;
    const fCtx = flareCanvas.getContext('2d');
    const grad = fCtx.createRadialGradient(64, 64, 4, 64, 64, 60);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    grad.addColorStop(0.3, 'rgba(255, 245, 180, 0.6)');
    grad.addColorStop(0.7, 'rgba(0, 229, 255, 0.2)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    fCtx.fillStyle = grad;
    fCtx.fillRect(0, 0, 128, 128);

    const flareTex = new THREE.CanvasTexture(flareCanvas);
    const flareMat = new THREE.MeshBasicMaterial({
      map: flareTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    towerPositions.forEach(([tx, ty, tz]) => {
      // Mast pole
      const mastGeo = new THREE.CylinderGeometry(0.28, 0.45, ty, 8);
      const mast = new THREE.Mesh(mastGeo, poleMat);
      mast.position.set(tx, ty / 2, tz);
      this.scene.add(mast);

      // Light head bank
      const bankGeo = new THREE.BoxGeometry(4.2, 1.8, 0.6);
      const bank = new THREE.Mesh(bankGeo, lampMat);
      bank.position.set(tx, ty, tz);
      bank.lookAt(0, 1.2, 3);
      this.scene.add(bank);

      // Glowing flare quad in front of lamp
      const flareGeo = new THREE.PlaneGeometry(6.5, 3.8);
      const flare = new THREE.Mesh(flareGeo, flareMat);
      flare.position.set(tx, ty, tz + (tz < 0 ? 0.4 : -0.4));
      flare.lookAt(this.baseCameraPos.x, this.baseCameraPos.y, this.baseCameraPos.z);
      this.scene.add(flare);
    });
  }

  _buildBlobShadows() {
    // Blob shadow texture
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
    this.ballBlobShadow.position.set(0, 0.008, TUNING.goal.spotDistance);
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
   * Composes idle sway, screen shake, and camera punch-in in ONE unified step.
   */
  update(timeSec, deltaSec, ballPos, keeperPos, fx = null) {
    // 1. Camera positioning (Main behind-spot view vs Keeper view vs Replay side broadcast view)
    let camPos;
    let target;

    if (this.cameraMode === 'REPLAY') {
      const repSway = Math.sin(timeSec * 0.4) * 0.06;
      camPos = this.replayCameraPos.clone();
      camPos.x += repSway;
      camPos.y += Math.cos(timeSec * 0.5) * 0.03;
      target = this.replayLookTarget.clone();
    } else if (this.cameraMode === 'KEEPER') {
      const swayX = Math.sin(timeSec * 0.75) * 0.025;
      const swayY = Math.cos(timeSec * 0.95) * 0.015;

      camPos = this.keeperCameraPos.clone();
      camPos.x += swayX;
      camPos.y += swayY;

      if (fx && fx.getShakeOffset) {
        camPos.add(fx.getShakeOffset());
      }
      if (fx && fx.getPunchOffset) {
        camPos.add(fx.getPunchOffset());
      }
      target = this.keeperLookTarget.clone();
      if (fx && fx.getLookAtOffset) {
        target.add(fx.getLookAtOffset());
      }
    } else {
      const swayX = Math.sin(timeSec * 0.75) * 0.03;
      const swayY = Math.cos(timeSec * 0.95) * 0.02;

      camPos = this.baseCameraPos.clone();
      camPos.x += swayX;
      camPos.y += swayY;

      // Apply shake and punch-in offsets from FXManager
      if (fx && fx.getShakeOffset) {
        camPos.add(fx.getShakeOffset());
      }
      if (fx && fx.getPunchOffset) {
        camPos.add(fx.getPunchOffset());
      }
      target = this.lookTarget.clone();
      if (fx && fx.getLookAtOffset) {
        target.add(fx.getLookAtOffset());
      }
    }

    this.camera.position.copy(camPos);
    this.camera.lookAt(target);

    // Animate pitchside LED ad boards scrolling
    if (this.adTexture) {
      this.adTexture.offset.x = (this.adTexture.offset.x + deltaSec * 0.04) % 1.0;
    }

    // 2. Animate crowd bobbing (seated 3D spectators)
    if (this.crowdTorsoInstances && this.crowdHeadInstances) {
      const dummyT = new THREE.Object3D();
      const dummyH = new THREE.Object3D();
      for (let i = 0; i < this.crowdCount; i++) {
        const bob = Math.sin(timeSec * 4.5 + this.crowdPhase[i]) * 0.035;

        this.crowdTorsoInstances.getMatrixAt(i, dummyT.matrix);
        dummyT.matrix.decompose(dummyT.position, dummyT.quaternion, dummyT.scale);
        dummyT.position.y = this.crowdBaseY[i] + bob;
        dummyT.updateMatrix();
        this.crowdTorsoInstances.setMatrixAt(i, dummyT.matrix);

        this.crowdHeadInstances.getMatrixAt(i, dummyH.matrix);
        dummyH.matrix.decompose(dummyH.position, dummyH.quaternion, dummyH.scale);
        dummyH.position.y = this.crowdBaseHeadY[i] + bob;
        dummyH.updateMatrix();
        this.crowdHeadInstances.setMatrixAt(i, dummyH.matrix);
      }
      this.crowdTorsoInstances.instanceMatrix.needsUpdate = true;
      this.crowdHeadInstances.instanceMatrix.needsUpdate = true;
    }

    // 3. Update Blob Shadows
    if (ballPos && this.ballBlobShadow) {
      this.ballBlobShadow.position.x = ballPos.x;
      this.ballBlobShadow.position.z = ballPos.z;
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

        posAttr.setZ(i, oz - bulge);
      }
      posAttr.needsUpdate = true;
    } else if (this.netMesh && this.netOriginalPositions && this.netDeformTime <= 0) {
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
