// Main Game Engine & Loop Orchestrator for Midnight Touge (《夜峠》)
import * as THREE from '../../libs/three.module.js';
import { GLTFLoader } from '../../libs/GLTFLoader.js';
import { CARS_DATA, getCarById } from '../data/cars.js';
import { EVENTS_DATA, resolveMedal } from '../data/events.js';
import { KIRINE_PASS_TRACK } from '../data/track_data.js';
import { VehiclePhysics } from '../physics/vehicle-physics.js';
import { TrackCollision } from '../physics/track-collision.js';
import { CarBuilder } from '../world/car-builder.js';
import { LightingWeather } from '../world/lighting-weather.js';
import { ParticleSystem } from '../world/particles.js';
import { CameraController } from '../render/camera-controller.js';
import { HudRenderer } from '../render/hud-renderer.js';
import { GarageView } from '../render/garage-view.js';
import { UIScreens } from '../render/ui-screens.js';
import { audio } from './audio.js';
import { storage } from './storage.js';
import { InputController } from './input.js';

export const COCKPIT_MIRROR_CONFIG = {
  width: 172,
  height: 65,
  top: 12
};

export class TougeEngine {
  constructor() {
    this.state = "TITLE"; // TITLE, GARAGE, EVENT_SELECT, COUNTDOWN, RACING, PAUSED, RESULTS, REPLAY

    // Three.js Core
    this.canvas = document.getElementById("game-canvas");
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.rearCamera = null;
    this.lastFrameTime = performance.now();

    // Game Subsystems
    this.lighting = null;
    this.particles = null;
    this.carBuilder = null;
    this.cameraController = null;
    this.hud = null;
    this.garageView = null;
    this.uiScreens = null;
    this.input = null;

    // Track & Collision
    this.trackCollision = new TrackCollision(KIRINE_PASS_TRACK);
    this.trackModel = null;

    // Player Car Rig & Dynamics
    this.selectedCarData = CARS_DATA[0];
    this.playerPhysics = null;
    this.playerCarRig = null;

    // AI Rival Car (For Battle Mode)
    this.rivalData = null;
    this.rivalRig = null;
    this.rivalDistance = 0.0;
    this.rivalSpeed = 35.0; // m/s (~126 km/h)

    // Ghost Car Replay
    this.ghostRig = null;
    this.ghostFrames = [];
    this.ghostReplayFrames = null;
    this.ghostSampleTimer = 0.0;

    // Current Race Session State
    this.currentEvent = EVENTS_DATA[0];
    this.raceTimer = 0.0;
    this.countdownTimer = 3.0;
    this.countdownInt = 3;
    this.isCountdownActive = false;
    this.gutterDropActive = false;
    this.gutterDropCooldown = 0.0;
    this.wallScrapeCooldown = 0.0;

    // Garage Turntable State
    this.garageTurntableAngle = 0.0;
    this.isDraggingGarage = false;
    this.lastPointerX = 0;

    // Post-Processing & Aberration
    this.speedAberrationRatio = 0.0;
    this.playerLoadGen = 0;
    this.rivalLoadGen = 0;
    this.ghostLoadGen = 0;

    // Bind methods
    this.animate = this.animate.bind(this);
    this.onResize = this.onResize.bind(this);
  }

  async init() {
    this.initThree();
    this.initSystems();
    this.bindEvents();

    // Load track model
    await this.loadTrack();

    // Load initial player car model
    await this.loadPlayerCar(storage.data.selectedCarId || "h86");

    // Start render loop
    requestAnimationFrame(this.animate);

    // Initial Screen: TITLE
    this.transitionTo("TITLE");
  }

  initThree() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // WebGL Renderer with ACES tone mapping
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: "high-performance"
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.0));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    // Three.js Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x070D12);

    // Perspective Camera with Z-up coordinates
    this.camera = new THREE.PerspectiveCamera(62, width / height, 0.1, 2500);
    this.camera.up.set(0, 0, 1);
    this.scene.add(this.camera);

    // Rear-View Mirror Camera for In-Car Cockpit View (RHD Mirror)
    this.rearCamera = new THREE.PerspectiveCamera(55, COCKPIT_MIRROR_CONFIG.width / COCKPIT_MIRROR_CONFIG.height, 0.2, 800);
    this.rearCamera.up.set(0, 0, 1);
    this.scene.add(this.rearCamera);

    // Framebuffer Render Target for Post-Processing (Bloom & Chromatic Aberration)
    const dpr = Math.min(window.devicePixelRatio || 1, 2.0);
    this.mainRenderTarget = new THREE.WebGLRenderTarget(
      Math.round(width * dpr),
      Math.round(height * dpr),
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.UnsignedByteType,
        depthBuffer: true
      }
    );

    // Fullscreen Post-Processing Quad & Shaders (HDR Bloom -> ACES Filmic Tone Mapping)
    this.postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.postScene = new THREE.Scene();
    this.postMaterial = new THREE.ShaderMaterial({
      toneMapped: false,
      uniforms: {
        tDiffuse: { value: null },
        uAberration: { value: 0.0 },
        uBloomIntensity: { value: 0.65 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float uAberration;
        uniform float uBloomIntensity;
        varying vec2 vUv;

        // ACES Filmic Tone Mapping Curve (Narkowicz 2015 fit)
        vec3 acesFilmic(vec3 x) {
          float a = 2.51;
          float b = 0.03;
          float c = 2.43;
          float d = 0.59;
          float e = 0.14;
          return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
        }

        void main() {
          vec2 uv = vUv;
          vec2 dir = uv - vec2(0.5);

          // Speed-scaled radial chromatic aberration
          vec2 offset = dir * (uAberration * 0.015);
          float r = texture2D(tDiffuse, uv + offset).r;
          float g = texture2D(tDiffuse, uv).g;
          float b = texture2D(tDiffuse, uv - offset).b;
          vec3 baseColor = vec3(r, g, b);

          // Multi-tap bloom sampled from HDR half-float buffer (values > 0.75 glow and spread)
          vec3 bloom = vec3(0.0);
          float step = 0.0035;
          for (int x = -2; x <= 2; x++) {
            for (int y = -2; y <= 2; y++) {
              vec2 tapUv = uv + vec2(float(x), float(y)) * step;
              vec3 tapCol = texture2D(tDiffuse, tapUv).rgb;
              float luma = dot(tapCol, vec3(0.2126, 0.7152, 0.0722));
              if (luma > 0.75) {
                bloom += (tapCol - 0.75) * 0.045;
              }
            }
          }

          vec3 hdrColor = baseColor + bloom * uBloomIntensity;

          // Apply ACES curve at the end of post fragment shader
          vec3 ldrColor = acesFilmic(hdrColor);

          gl_FragColor = vec4(ldrColor, 1.0);
        }
      `
    });
    this.postQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.postMaterial);
    this.postScene.add(this.postQuad);

    window.addEventListener("resize", this.onResize);
  }

  initSystems() {
    this.lighting = new LightingWeather(this.scene, this.renderer);
    this.particles = new ParticleSystem(this.scene);
    this.carBuilder = new CarBuilder(this.scene);
    this.cameraController = new CameraController(this.camera);

    // Garage Showroom Lighting
    this.garageShowroomLight = new THREE.SpotLight(0xFFF6E8, 55.0, 40.0, Math.PI / 2.6, 0.35, 1.0);
    this.garageShowroomLight.position.set(0, 0, 6.5);
    this.garageShowroomLight.target.position.set(0, 0, 0.4);
    this.garageShowroomLight.visible = false;
    this.scene.add(this.garageShowroomLight);
    this.scene.add(this.garageShowroomLight.target);

    this.garageKeyLight = new THREE.DirectionalLight(0xFFE2B0, 4.5);
    this.garageKeyLight.position.set(3.5, 4.0, 5.0);
    this.garageKeyLight.visible = false;
    this.scene.add(this.garageKeyLight);

    this.garageRimLight = new THREE.DirectionalLight(0x7EB8E0, 5.5);
    this.garageRimLight.position.set(4, -4, 3);
    this.garageRimLight.visible = false;
    this.scene.add(this.garageRimLight);

    this.garageFillLight = new THREE.HemisphereLight(0x6088A8, 0x182028, 0.0);
    this.scene.add(this.garageFillLight);

    // Garage Showroom Turntable Pedestal
    this.garagePedestal = new THREE.Group();
    const discGeo = new THREE.CylinderGeometry(2.4, 2.5, 0.08, 48);
    discGeo.rotateX(Math.PI / 2);
    const discMat = new THREE.MeshStandardMaterial({
      color: 0x161A20,
      roughness: 0.25,
      metalness: 0.85
    });
    const discMesh = new THREE.Mesh(discGeo, discMat);
    discMesh.position.set(0, 0, -0.04);
    this.garagePedestal.add(discMesh);

    // Bevel rim with brushed highlight
    const rimGeo = new THREE.TorusGeometry(2.45, 0.025, 16, 48);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x8899A6,
      roughness: 0.2,
      metalness: 0.9
    });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.position.set(0, 0, 0.001);
    this.garagePedestal.add(rimMesh);

    // Subtle dark contact shadow underneath car
    const shadowGeo = new THREE.PlaneGeometry(4.2, 2.2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x020406,
      transparent: true,
      opacity: 0.7
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.position.set(0, 0, 0.005);
    this.garagePedestal.add(shadowMesh);

    this.garagePedestal.visible = false;
    this.scene.add(this.garagePedestal);

    const hudContainer = document.getElementById("hud-container");
    const uiContainer = document.getElementById("ui-container");

    this.hud = new HudRenderer(hudContainer);
    this.input = new InputController();
    this.input.bindTouch(hudContainer);

    this.garageView = new GarageView(uiContainer, {
      onSelectCar: async (carId, colorIdx) => {
        const isUnlocked = storage.selectCar(carId, colorIdx);
        await this.loadPlayerCar(carId, !isUnlocked);
      },
      onStartRace: () => {
        this.transitionTo("EVENT_SELECT");
      },
      onBackToTitle: () => {
        this.transitionTo("TITLE");
      }
    });

    this.uiScreens = new UIScreens(uiContainer, {
      onStartGame: () => {
        audio.unlockAudio();
        audio.playBGM();
        this.startEvent(EVENTS_DATA[0]);
      },
      onStartEvent: (ev) => {
        audio.unlockAudio();
        audio.playBGM();
        this.startEvent(ev);
      },
      onOpenGarage: () => {
        audio.unlockAudio();
        audio.playBGM();
        this.transitionTo("GARAGE");
      },
      onSelectEvent: (eventId) => {
        const ev = typeof eventId === "object" ? eventId : (EVENTS_DATA.find(e => e.id === eventId) || EVENTS_DATA[0]);
        this.startEvent(ev);
      },
      onBackToTitle: () => {
        this.transitionTo("TITLE");
      },
      onRetryEvent: () => {
        this.startEvent(this.currentEvent);
      },
      onNextEvent: () => {
        const nextId = this.currentEvent.id + 1;
        const nextEv = EVENTS_DATA.find(e => e.id === nextId) || EVENTS_DATA[0];
        this.startEvent(nextEv);
      },
      onSettingsChanged: (settings) => {
        if (this.hud) this.hud.updateSettingsLayout(settings);
      }
    });
  }

  bindEvents() {
    // HUD Pause Button
    const hudContainer = document.getElementById("hud-container");
    hudContainer.addEventListener("click", (e) => {
      const target = e.target.closest("button");
      if (!target) return;
      if (target.id === "btn-pause") {
        if (this.state === "RACING" || this.state === "COUNTDOWN") {
          this.pauseGame();
        }
      }
    });

    // Touch Drag for Garage Turntable
    const canvas = this.canvas;
    canvas.addEventListener("pointerdown", (e) => {
      audio.unlockAudio();
      if (this.state === "GARAGE") {
        this.isDraggingGarage = true;
        this.lastPointerX = e.clientX;
      }
    });

    window.addEventListener("pointermove", (e) => {
      if (this.isDraggingGarage && this.state === "GARAGE") {
        const dx = e.clientX - this.lastPointerX;
        this.garageTurntableAngle += dx * 0.008;
        this.lastPointerX = e.clientX;
      }
    });

    window.addEventListener("pointerup", () => {
      this.isDraggingGarage = false;
    });

    // Keyboard Hotkeys
    this.input.onCameraToggle = () => {
      if (this.state === "RACING") {
        this.cameraController.toggleMode();
        audio.playSFX("menu_click");
      }
    };

    this.input.onPauseToggle = () => {
      if (this.state === "RACING") {
        this.pauseGame();
      } else if (this.state === "PAUSED") {
        this.resumeGame();
      }
    };
  }

  async loadTrack() {
    try {
      const loader = new GLTFLoader();
      const gltf = await new Promise((resolve, reject) => {
        loader.load("assets/models/track_kirine.glb", resolve, undefined, reject);
      });

      this.trackModel = gltf.scene;
      // Blender GLTF exporter converted Z-up to Y-up. Rotate +90deg around X to restore Z-up
      this.trackModel.rotation.x = Math.PI / 2;

      // PBR Texture Maps with road wrapping
      const texLoader = new THREE.TextureLoader();
      const aspDiff = texLoader.load("assets/textures/asphalt_diffuse.jpg");
      aspDiff.wrapS = THREE.RepeatWrapping;
      aspDiff.wrapT = THREE.RepeatWrapping;
      aspDiff.repeat.set(2, 90);

      const aspRough = texLoader.load("assets/textures/asphalt_roughness.jpg");
      aspRough.wrapS = THREE.RepeatWrapping;
      aspRough.wrapT = THREE.RepeatWrapping;
      aspRough.repeat.set(2, 90);

      const rkDiff = texLoader.load("assets/textures/rock_diffuse.jpg");
      rkDiff.wrapS = THREE.RepeatWrapping;
      rkDiff.wrapT = THREE.RepeatWrapping;
      rkDiff.repeat.set(4, 90);

      this.trackModel.traverse(child => {
        if (child.isMesh) {
          const n = (child.name || "").toLowerCase();
          if (n === "road" || n.includes("asphalt")) {
            child.material = new THREE.MeshStandardMaterial({
              color: 0x6A7380,
              map: aspDiff,
              roughnessMap: aspRough,
              roughness: 0.55,
              metalness: 0.08,
              side: THREE.DoubleSide
            });
            child.receiveShadow = true;
          } else if (n.includes("cliff") || n.includes("rock") || n.includes("wall")) {
            child.material = new THREE.MeshStandardMaterial({
              color: 0x8A9098,
              map: rkDiff,
              roughness: 0.88,
              metalness: 0.04,
              side: THREE.DoubleSide
            });
          } else if (n.includes("rail") || n.includes("guard") || n.includes("post")) {
            child.material = new THREE.MeshStandardMaterial({
              color: 0xE8ECF0,
              roughness: 0.22,
              metalness: 0.82,
              side: THREE.DoubleSide
            });
          } else if (n.includes("lamp") || n.includes("light")) {
            if (child.material) {
              child.material.emissive = child.material.emissive || new THREE.Color(0xffcc66);
              child.material.emissiveIntensity = Math.max(child.material.emissiveIntensity || 1, 3);
              child.material.toneMapped = false;
            }
          } else if (n.includes("pine") || n.includes("needle") || n.includes("bark") || n.includes("crown")) {
            // keep authored materials, just double-side
            if (child.material) child.material.side = THREE.DoubleSide;
          } else if (n.includes("line") || n.includes("lane") || n.includes("center")) {
            child.material = new THREE.MeshStandardMaterial({
              color: 0xE8D978,
              roughness: 0.5,
              metalness: 0.05,
              side: THREE.DoubleSide
            });
          } else {
            if (child.material) {
              child.material.side = THREE.DoubleSide;
            }
          }
        }
      });

      this.scene.add(this.trackModel);

      // Start line sodium lights (arcade start atmosphere)
      const wp0 = KIRINE_PASS_TRACK.waypoints[0];
      const startLight = new THREE.PointLight(0xF2A83B, 24.0, 60.0, 1.0);
      startLight.position.set(wp0.x + 3.0, wp0.y + 2.0, wp0.z + 5.5);
      this.scene.add(startLight);

      const startFill = new THREE.PointLight(0x7EB8E0, 12.0, 45.0, 1.0);
      startFill.position.set(wp0.x - 3.5, wp0.y - 2.0, wp0.z + 4.5);
      this.scene.add(startFill);

      // Warm sodium streetlights along hairpins
      KIRINE_PASS_TRACK.hairpins.forEach((hp) => {
        const wp = KIRINE_PASS_TRACK.waypoints.find(w => w.dist >= hp.dist) || KIRINE_PASS_TRACK.waypoints[0];
        const light = new THREE.PointLight(0xF2B451, 18.0, 50.0, 1.0);
        light.position.set(wp.x + (wp.rx || 0) * 5.0, wp.y + (wp.ry || 0) * 5.0, wp.z + 5.5);
        this.scene.add(light);
      });

      console.log("Track GLTF loaded with PBR textures and sodium hairpin lights");
    } catch (e) {
      console.warn("Failed to load track GLTF, building fallback procedural ribbon:", e);
      this.createFallbackTrack();
    }
  }

  createFallbackTrack() {
    const waypoints = KIRINE_PASS_TRACK.waypoints;
    const curvePoints = waypoints.map(wp => new THREE.Vector3(wp.x, wp.y, wp.z));
    const curve = new THREE.CatmullRomCurve3(curvePoints);

    const tubeGeo = new THREE.TubeGeometry(curve, waypoints.length, 4.25, 8, false);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0x16181A,
      roughness: 0.6,
      metalness: 0.1
    });
    this.trackModel = new THREE.Mesh(tubeGeo, tubeMat);
    this.scene.add(this.trackModel);
  }

  async loadPlayerCar(carId, isPreviewOnly = false) {
    this.playerLoadGen = (this.playerLoadGen || 0) + 1;
    const currentGen = this.playerLoadGen;

    const carData = getCarById(carId);
    if (!isPreviewOnly) {
      this.selectedCarData = carData;
      this.playerPhysics = new VehiclePhysics(carData);
    }

    // Remove existing player car rig from scene
    if (this.playerCarRig && this.playerCarRig.group) {
      this.scene.remove(this.playerCarRig.group);
      this.playerCarRig = null;
    }

    const colorIdx = storage.data.selectedColorIdx || 0;
    const colorHex = carData.colors[colorIdx] ? carData.colors[colorIdx].hex : carData.colors[0].hex;

    const rig = await this.carBuilder.loadCarModel(carData, colorHex);

    // If a newer load has started, discard this stale completion
    if (currentGen !== this.playerLoadGen) {
      if (rig && rig.group) this.scene.remove(rig.group);
      return;
    }

    this.playerCarRig = rig;
    this.scene.add(this.playerCarRig.group);

    // Initial position at waypoint 0 ONLY when not in countdown or racing
    if (this.state !== "COUNTDOWN" && this.state !== "RACING") {
      const wp0 = KIRINE_PASS_TRACK.waypoints[0];
      if (this.playerPhysics) {
        this.playerPhysics.reset(wp0.x, wp0.y, wp0.z, wp0.heading);
      }
      this.playerCarRig.updatePose(
        { x: wp0.x, y: wp0.y, z: wp0.z },
        wp0.heading,
        0, 0, 0, 0
      );
    }
  }

  async loadRivalCar(carId = "re7") {
    this.rivalLoadGen = (this.rivalLoadGen || 0) + 1;
    const currentGen = this.rivalLoadGen;

    if (this.rivalRig && this.rivalRig.group) {
      this.scene.remove(this.rivalRig.group);
      this.rivalRig = null;
    }

    const rivalCarData = getCarById(carId);
    this.rivalData = rivalCarData;
    const rig = await this.carBuilder.loadCarModel(rivalCarData, "#B81D18");

    // If a newer load has started, discard this stale completion
    if (currentGen !== this.rivalLoadGen) {
      if (rig && rig.group) this.scene.remove(rig.group);
      return;
    }

    this.rivalRig = rig;
    this.scene.add(this.rivalRig.group);
  }

  async loadGhostCar(carId = "h86") {
    this.ghostLoadGen = (this.ghostLoadGen || 0) + 1;
    const currentGen = this.ghostLoadGen;

    if (this.ghostRig && this.ghostRig.group) {
      this.scene.remove(this.ghostRig.group);
      this.ghostRig = null;
    }

    const ghostCarData = getCarById(carId);
    const rig = await this.carBuilder.loadCarModel(ghostCarData, "#EAEAEA");

    // If a newer load has started, discard this stale completion
    if (currentGen !== this.ghostLoadGen) {
      if (rig && rig.group) this.scene.remove(rig.group);
      return;
    }

    this.ghostRig = rig;
    if (this.ghostRig && this.ghostRig.group) {
      this.ghostRig.group.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material = child.material.clone();
          child.material.transparent = true;
          child.material.opacity = 0.45;
        }
      });
      this.scene.add(this.ghostRig.group);
    }
  }

  updateGhost(time) {
    if (!this.ghostRig || !this.ghostReplayFrames || this.ghostReplayFrames.length === 0) return;
    const frames = this.ghostReplayFrames;
    let frame = frames[0];
    for (let i = 0; i < frames.length; i++) {
      if (frames[i].t >= time) {
        frame = frames[i];
        break;
      }
      frame = frames[i];
    }
    this.ghostRig.updatePose(
      { x: frame.x, y: frame.y, z: frame.z },
      frame.heading,
      0, 0, 0, (frame.speed || 30) * 3.6
    );
  }

  transitionTo(newState) {
    this.state = newState;
    const hudContainer = document.getElementById("hud-container");

    const isGarage = (newState === "GARAGE");
    if (this.garageShowroomLight) this.garageShowroomLight.visible = isGarage;
    if (this.garageKeyLight) this.garageKeyLight.visible = isGarage;
    if (this.garageRimLight) this.garageRimLight.visible = isGarage;
    if (this.garageFillLight) this.garageFillLight.intensity = isGarage ? 3.2 : 0.0;
    if (this.garagePedestal) this.garagePedestal.visible = isGarage;
    if (this.trackModel) this.trackModel.visible = !isGarage;
    // Kill fog + boost exposure in garage so the Blender car reads clearly
    if (this.scene) {
      if (isGarage) {
        this._savedFog = this.scene.fog;
        this.scene.fog = null;
        if (this.renderer) this.renderer.toneMappingExposure = 1.35;
        if (this.lighting && this.lighting.hemiLight) this.lighting.hemiLight.intensity = 0.35;
        if (this.lighting && this.lighting.moonLight) this.lighting.moonLight.intensity = 0.2;
      } else {
        if (this._savedFog !== undefined) this.scene.fog = this._savedFog;
        if (this.renderer) this.renderer.toneMappingExposure = 1.05;
        if (this.lighting && this.lighting.hemiLight) this.lighting.hemiLight.intensity = 2.0;
        if (this.lighting && this.lighting.moonLight) this.lighting.moonLight.intensity = 2.4;
      }
    }

    if (newState === "TITLE") {
      hudContainer.style.display = "none";
      this.uiScreens.showTitle();
      audio.stopEngineSound();
      audio.duckBGM(false);

    } else if (newState === "GARAGE") {
      hudContainer.style.display = "none";
      this.garageView.render();
      audio.stopEngineSound();
      audio.duckBGM(false);

      // Position car at garage pedestal
      this.playerPhysics.reset(0, 0, 0, 0);
      this.camera.position.set(5.8, -4.2, 1.7);
      this.camera.lookAt(0, 0, 0.55);

    } else if (newState === "EVENT_SELECT") {
      hudContainer.style.display = "none";
      this.uiScreens.showEventSelect();
      audio.stopEngineSound();
      audio.duckBGM(false);

    } else if (newState === "COUNTDOWN" || newState === "RACING") {
      hudContainer.style.display = "block";
      const screens = document.querySelectorAll(".ui-screen-view");
      screens.forEach(s => s.classList.remove("is-active"));
      // Clear garage HTML overlay so race canvas is not covered
      if (this.garageView && this.garageView.container) {
        this.garageView.container.innerHTML = "";
      }
      audio.duckBGM(false);

    } else if (newState === "PAUSED") {
      audio.stopEngineSound();
      audio.duckBGM(true);
      this.uiScreens.showPauseModal(
        () => this.resumeGame(),
        () => this.startEvent(this.currentEvent),
        () => this.transitionTo("EVENT_SELECT")
      );

    } else if (newState === "RESULTS") {
      audio.stopEngineSound();
      audio.duckBGM(true);
      audio.playSFX("countdown_go");
      if (hudContainer) hudContainer.style.display = "none";
    }
  }

  async startEvent(eventData) {
    this.currentEvent = eventData;
    this.hud.setEventInfo(eventData);

    // Ensure selected unlocked player car is loaded into scene and physics
    await this.loadPlayerCar(storage.data.selectedCarId || "h86");

    // Restore fog if garage cleared it, then apply weather
    if (!this.scene.fog && this._savedFog) this.scene.fog = this._savedFog;
    this.lighting.setWeather(eventData.weather || "midnight");

    // Sector & Direction Track Setup
    const isUphill = eventData.direction === "uphill";
    const startDist = eventData.startDist !== undefined ? eventData.startDist : (isUphill ? 2990 : 0);
    const targetDist = eventData.targetDist !== undefined ? eventData.targetDist : (isUphill ? 0 : 2990);

    const startWp = this.trackCollision.setSector(startDist, targetDist, eventData.direction);
    let startHeading = startWp.heading;
    if (isUphill) {
      startHeading = (startWp.heading + Math.PI) % (Math.PI * 2);
    }

    this.playerPhysics.reset(startWp.x, startWp.y, startWp.z, startHeading);
    this.cameraController.snap(startWp, startHeading);
    this.raceTimer = 0.0;
    this.countdownTimer = 3.0;
    this.countdownInt = 3;
    this.isCountdownActive = true;
    this.gutterDropActive = false;
    this.gutterDropCooldown = 0.0;
    this.wallScrapeCooldown = 0.0;
    this.ghostFrames = [];
    this.ghostSampleTimer = 0.0;

    // AI Rival Setup for Battle Mode (mode === "battle" or isBattle)
    const isBattle = eventData.mode === "battle" || !!eventData.isBattle;
    if (isBattle) {
      await this.loadRivalCar(eventData.rivalCar || "re7");
      this.rivalDistance = isUphill ? startDist - 15.0 : startDist + 15.0;
      const totalDist = Math.max(100, Math.abs(targetDist - startDist));
      const targetTime = eventData.rivalTargetTime || (eventData.timeTargets && eventData.timeTargets.silver) || 122.0;
      this.rivalSpeed = totalDist / targetTime;
      this.rivalFinishTime = null;
      this.setRivalPoseAtDistance(this.rivalDistance);
    } else {
      if (this.rivalRig && this.rivalRig.group) {
        this.scene.remove(this.rivalRig.group);
        this.rivalRig = null;
      }
    }

    // Ghost Car Replay Setup
    this.ghostReplayFrames = (storage.data.ghostData && storage.data.ghostData[eventData.id]) || null;
    if (this.ghostReplayFrames && this.ghostReplayFrames.length > 0) {
      await this.loadGhostCar(storage.data.selectedCarId || "h86");
    } else {
      if (this.ghostRig && this.ghostRig.group) {
        this.scene.remove(this.ghostRig.group);
        this.ghostRig = null;
      }
    }

    // Audio setup
    audio.unlockAudio();
    audio.playBGM();
    audio.startEngineSound();
    audio.playSFX("countdown_beep", 1.0);

    this.transitionTo("COUNTDOWN");
    this.hud.showCountdownGantry(3);
  }

  pauseGame() {
    if (this.state === "RACING" || this.state === "COUNTDOWN") {
      this.pausedFromState = this.state;
      this.transitionTo("PAUSED");
    }
  }

  resumeGame() {
    const modal = document.getElementById("pause-modal");
    if (modal) modal.remove();
    this.state = this.pausedFromState || "RACING";
    audio.duckBGM(false);
    audio.startEngineSound();
    if (this.state === "COUNTDOWN") {
      this.hud.showCountdownGantry(this.countdownInt);
    }
  }

  updateCountdown(dt) {
    this.countdownTimer -= dt;
    const curInt = Math.max(1, Math.ceil(this.countdownTimer));

    if (this.countdownTimer > 0 && curInt !== this.countdownInt) {
      this.countdownInt = curInt;
      const pitch = curInt === 1 ? 1.25 : (curInt === 2 ? 1.1 : 1.0);
      audio.playSFX("countdown_beep", pitch);
      this.hud.showCountdownGantry(curInt);
    }

    if (this.countdownTimer <= 0) {
      this.isCountdownActive = false;
      this.state = "RACING";
      const isBattle = this.currentEvent && (this.currentEvent.mode === "battle" || !!this.currentEvent.isBattle);
      if (isBattle) {
        const isUphill = this.currentEvent.direction === "uphill";
        const startDist = this.currentEvent.startDist !== undefined ? this.currentEvent.startDist : (isUphill ? 2990 : 0);
        this.rivalDistance = isUphill ? startDist - 15.0 : startDist + 15.0;
      }
      audio.playSFX("countdown_go");
      this.hud.showCountdownGantry(0);
      setTimeout(() => {
        this.hud.hideCountdown();
      }, 950);
      this.updateRacing(dt, false);
    }
  }

  setRivalPoseAtDistance(dist) {
    if (!this.rivalRig) return;
    const isUphill = this.currentEvent && this.currentEvent.direction === "uphill";
    const waypoints = KIRINE_PASS_TRACK.waypoints;
    let rivalWpIdx = 0;
    let minDistDiff = Infinity;
    for (let i = 0; i < waypoints.length; i++) {
      const diff = Math.abs(waypoints[i].dist - dist);
      if (diff < minDistDiff) {
        minDistDiff = diff;
        rivalWpIdx = i;
      }
    }
    const wp = waypoints[rivalWpIdx] || waypoints[0];
    const heading = isUphill ? (wp.heading + Math.PI) % (Math.PI * 2) : wp.heading;
    this.rivalRig.updatePose(
      { x: wp.x, y: wp.y, z: wp.z },
      heading,
      0, 0, 0, 0
    );
  }

  updateRival(dt) {
    const isBattle = this.currentEvent && (this.currentEvent.mode === "battle" || !!this.currentEvent.isBattle);
    if (!this.rivalRig || !isBattle) return;

    const isUphill = this.currentEvent.direction === "uphill";
    const targetDist = this.trackCollision.targetDist;

    if (isUphill) {
      this.rivalDistance -= this.rivalSpeed * dt;
      if (this.rivalDistance <= targetDist && this.rivalFinishTime === null) {
        this.rivalFinishTime = this.raceTimer;
      }
    } else {
      this.rivalDistance += this.rivalSpeed * dt;
      if (this.rivalDistance >= targetDist && this.rivalFinishTime === null) {
        this.rivalFinishTime = this.raceTimer;
      }
    }

    const waypoints = KIRINE_PASS_TRACK.waypoints;
    let rivalWpIdx = 0;
    let minDistDiff = Infinity;
    for (let i = 0; i < waypoints.length; i++) {
      const diff = Math.abs(waypoints[i].dist - this.rivalDistance);
      if (diff < minDistDiff) {
        minDistDiff = diff;
        rivalWpIdx = i;
      }
    }

    const wp = waypoints[rivalWpIdx] || waypoints[0];
    const heading = isUphill ? (wp.heading + Math.PI) % (Math.PI * 2) : wp.heading;
    this.rivalRig.updatePose(
      { x: wp.x, y: wp.y, z: wp.z },
      heading,
      0, 0, 0, this.rivalSpeed * 3.6
    );
  }

  finishRace() {
    this.state = "RESULTS";
    audio.stopEngineSound();
    const hudContainer = document.getElementById("hud-container");
    if (hudContainer) hudContainer.style.display = "none";
    const totalTime = this.raceTimer;
    const maxDrift = Math.floor(this.playerPhysics.driftScore);
    const event = this.currentEvent || EVENTS_DATA[0];

    // Calculate medal and coins strictly via resolveMedal
    let medal = null;
    let coinsEarned = 100;
    const isBattle = event.mode === "battle" || !!event.isBattle;
    let isVictory = true;
    let gapSeconds = 0.0;

    if (isBattle) {
      const isUphill = event.direction === "uphill";
      const targetDist = this.trackCollision.targetDist;
      let rivalArrival = this.rivalFinishTime;
      if (rivalArrival === null) {
        const distRemaining = isUphill ?
          Math.max(0, this.rivalDistance - targetDist) :
          Math.max(0, targetDist - this.rivalDistance);
        rivalArrival = this.raceTimer + (distRemaining / Math.max(8.0, this.rivalSpeed));
      }
      gapSeconds = rivalArrival - totalTime;
      isVictory = gapSeconds >= 0;
      medal = resolveMedal(event, { gapSeconds, time: totalTime, driftScore: maxDrift });
    } else {
      medal = resolveMedal(event, { time: totalTime, driftScore: maxDrift });
      isVictory = medal !== null;
    }

    if (medal && event.rewardCoins && event.rewardCoins[medal]) {
      coinsEarned = event.rewardCoins[medal];
    }

    // Save in storage along with ghost replay frames
    storage.recordStageResult(event.id, totalTime, maxDrift, medal, coinsEarned, this.ghostFrames);

    // Show Results UI
    this.uiScreens.showResults(event, {
      totalTime,
      medal,
      driftScore: maxDrift,
      coinsEarned,
      isVictory,
      gutterDrops: this.playerPhysics.gutterDropsCount || 0
    });
  }

  animate() {
    requestAnimationFrame(this.animate);

    const now = performance.now();
    const dt = Math.min((now - this.lastFrameTime) / 1000.0, 0.05);
    this.lastFrameTime = now;
    const elapsedTime = now / 1000.0;

    if (this.state === "GARAGE") {
      this.updateGarage(dt);
    } else if (this.state === "TITLE") {
      this.updateTitle(dt, elapsedTime);
    } else if (this.state === "COUNTDOWN") {
      this.updateCountdown(dt);
      if (this.state === "COUNTDOWN") {
        this.updateRacing(dt, true); // Camera & car idle
      }
    } else if (this.state === "RACING") {
      this.updateRacing(dt, false);
    } else if (this.state === "RESULTS") {
      this.updateResults(dt, elapsedTime);
    }

    if (this.renderer && this.scene && this.camera) {
      if (this.mainRenderTarget && this.postScene && this.postMaterial) {
        try {
          // 1. Render 3D scene into offscreen framebuffer render target
          this.renderer.setRenderTarget(this.mainRenderTarget);
          this.renderer.setScissorTest(false);
          this.renderer.clear();
          this.renderer.render(this.scene, this.camera);

          // Scissor render top-center rear-view mirror inset (RHD cockpit mirror)
          const isCockpit = this.cameraController.mode === "cockpit" && (this.state === "RACING" || this.state === "COUNTDOWN");
          const mirrorBezel = document.getElementById("cockpit-mirror-frame");
          if (mirrorBezel) {
            mirrorBezel.style.display = isCockpit ? "block" : "none";
          }

          if (isCockpit && this.rearCamera) {
            const rtW = this.mainRenderTarget.width;
            const rtH = this.mainRenderTarget.height;
            const dprVal = this.renderer.getPixelRatio() || 1;
            const scaleX = (rtW / dprVal) / (this.canvas.clientWidth || window.innerWidth || 390);
            const scaleY = (rtH / dprVal) / (this.canvas.clientHeight || window.innerHeight || 844);

            const mirrorW = Math.round(COCKPIT_MIRROR_CONFIG.width * scaleX);
            const mirrorH = Math.round(COCKPIT_MIRROR_CONFIG.height * scaleY);
            const mirrorX = Math.round(((rtW / dprVal) - mirrorW) / 2);
            const mirrorY = Math.round((rtH / dprVal) - (COCKPIT_MIRROR_CONFIG.top + COCKPIT_MIRROR_CONFIG.height) * scaleY);

            this.renderer.setScissor(mirrorX, mirrorY, mirrorW, mirrorH);
            this.renderer.setViewport(mirrorX, mirrorY, mirrorW, mirrorH);
            this.renderer.setScissorTest(true);
            this.renderer.render(this.scene, this.rearCamera);
            this.renderer.setScissorTest(false);
          }

          // 2. Render post-processing composite quad to screen canvas
          this.renderer.setRenderTarget(null);
          this.renderer.setScissorTest(false);
          this.postMaterial.uniforms.tDiffuse.value = this.mainRenderTarget.texture;
          this.postMaterial.uniforms.uAberration.value = (this.state === "RACING" || this.state === "COUNTDOWN") ? (this.speedAberrationRatio || 0.0) : 0.0;
          this.postMaterial.uniforms.uBloomIntensity.value = 0.65;
          this.renderer.render(this.postScene, this.postCamera);
        } catch (e) {
          console.warn("Post-processing render failed, falling back to direct render:", e);
          this.renderer.setRenderTarget(null);
          this.renderer.setScissorTest(false);
          this.renderer.render(this.scene, this.camera);
        }
      } else {
        this.renderer.render(this.scene, this.camera);
      }
    }
  }

  updateGarage(dt) {
    if (!this.isDraggingGarage) {
      this.garageTurntableAngle += 0.45 * dt;
    }

    if (this.playerCarRig) {
      this.playerCarRig.updatePose(
        { x: 0, y: 0, z: 0 },
        this.garageTurntableAngle,
        0, 0, 0, 0
      );
    }

    // Garage camera smooth angle tailored for portrait 390×844
    // Hero 3/4 orbit — keep camera elevated so roof/glass/wheels read clearly
    const camDist = 6.0;
    const camZ = 1.85;
    const ang = this.garageTurntableAngle * 0.55 + 0.55; // bias toward 3/4 front
    const camX = Math.sin(ang) * camDist;
    const camY = -Math.cos(ang) * camDist;
    this.camera.position.set(camX, camY, camZ);
    this.camera.lookAt(0, 0, 0.55);
  }

  updateTitle(dt, elapsedTime = 0) {
    // Gentle camera orbit over mountain track
    const wp0 = KIRINE_PASS_TRACK.waypoints[0];
    const time = elapsedTime * 0.15;
    this.camera.position.set(
      wp0.x + Math.sin(time) * 12.0,
      wp0.y - 14.0 + Math.cos(time) * 4.0,
      wp0.z + 4.5
    );
    this.camera.lookAt(wp0.x, wp0.y + 10.0, wp0.z + 1.0);
  }

  updateResults(dt, elapsedTime = 0) {
    // Slow cinematic pan around stopped car at finish line
    const p = this.playerPhysics;
    const time = elapsedTime * 0.25;
    this.camera.position.set(
      p.x + Math.sin(time) * 7.5,
      p.y + Math.cos(time) * 7.5,
      p.z + 2.2
    );
    this.camera.lookAt(p.x, p.y, p.z + 0.8);
  }

  updateRacing(dt, isIdle = false) {
    if (!isIdle) {
      this.raceTimer += dt;
    }

    // 1. Process Input
    const inputState = isIdle ? { steer: 0, throttle: 0, brake: 0, handbrake: false } : this.input.update(dt);

    // 2. Update Vehicle Physics
    this.playerPhysics.update(dt, inputState, this.currentEvent.weather);

    // 3. Update Track Collision & Progression
    const p = this.playerPhysics;
    this.trackCollision.update(p.x, p.y, p.z, this.raceTimer);

    // Match car elevation to track spline altitude
    const nearestWp = KIRINE_PASS_TRACK.waypoints[this.trackCollision.currentWaypointIndex];
    if (nearestWp) {
      p.z += (nearestWp.z - p.z) * 8.0 * dt;
    }

    // 4. Gutter Drop ("溝落とし") Mechanic
    if (this.trackCollision.isInGutter && Math.abs(p.speedKmh) > 45) {
      p.inGutter = true;
      if (this.gutterDropCooldown <= 0) {
        p.gutterDropsCount = (p.gutterDropsCount || 0) + 1;
        this.hud.showGutterDropEffect();
        audio.playSFX("countdown_beep", 1.6);
        this.cameraController.addShake(0.18);
        this.gutterDropCooldown = 2.0; // Cooldown per corner
      }
    } else {
      p.inGutter = false;
    }
    if (this.gutterDropCooldown > 0) {
      this.gutterDropCooldown -= dt;
    }

    // 5. Guardrail / Wall Scrub Collision with Cooldown
    if (this.trackCollision.wallCollision) {
      const col = this.trackCollision.wallCollision;
      const isInitialImpact = (this.wallScrapeCooldown <= 0);
      p.applyWallCollision(col.normalX, col.normalY, col.penetration, isInitialImpact);
      if (isInitialImpact) {
        this.cameraController.addShake(0.28);
        this.particles.spawnSparks({ x: p.x, y: p.y, z: p.z + 0.4 });
        audio.playSFX("wall_scrape", 1.0, 0.7);
        this.wallScrapeCooldown = 0.18; // 180ms cooldown
      }
    }
    if (this.wallScrapeCooldown > 0) {
      this.wallScrapeCooldown -= dt;
    }

    // 6. Tyre Smoke & Skid Marks during Drift
    if (p.isDrifting && Math.abs(p.speedKmh) > 25) {
      this.particles.spawnSmoke(
        { x: p.x, y: p.y, z: p.z + 0.2 },
        p.heading,
        p.driftAngleDeg,
        p.speedKmh
      );
    }
    this.particles.addSkidSegment({ x: p.x, y: p.y, z: p.z }, p.heading, p.isDrifting);
    this.particles.update(dt);

    // 7. Rain Particle Volume
    const isRaining = this.currentEvent && this.currentEvent.weather === "rainy_night";
    this.particles.updateRain(this.camera.position, isRaining, dt);

    // 8. Update AI Rival in Battle Mode (mode === "battle" or isBattle)
    const isBattle = this.currentEvent && (this.currentEvent.mode === "battle" || !!this.currentEvent.isBattle);
    if (isBattle && !isIdle) {
      this.updateRival(dt);
    }

    // 9. Ghost Replay & Recording
    if (!isIdle) {
      this.ghostSampleTimer = (this.ghostSampleTimer || 0) + dt;
      if (this.ghostSampleTimer >= 0.1) {
        this.ghostSampleTimer = 0.0;
        this.ghostFrames.push({
          t: this.raceTimer,
          x: p.x,
          y: p.y,
          z: p.z,
          heading: p.heading,
          speed: p.speed
        });
      }
      this.updateGhost(this.raceTimer);
    }

    // 10. Update 3D Visual Pose
    if (this.playerCarRig) {
      this.playerCarRig.updatePose(
        { x: p.x, y: p.y, z: p.z },
        p.heading,
        p.steerAngle,
        p.roll,
        p.pitch,
        p.speedKmh
      );
    }

    // 11. Update Lighting & Car Headlights
    this.lighting.updateCarLights(
      { x: p.x, y: p.y, z: p.z },
      p.heading,
      inputState.brake > 0.1
    );

    // 12. Update Camera & Rear-View Mirror
    this.cameraController.update(
      dt,
      { x: p.x, y: p.y, z: p.z },
      p.heading,
      p.speedKmh,
      p.slipAngle,
      p.roll,
      p.pitch
    );

    if (this.cameraController.mode === "cockpit" && this.rearCamera) {
      const fwX = Math.sin(p.heading);
      const fwY = Math.cos(p.heading);
      this.rearCamera.position.set(p.x + fwX * 0.2, p.y + fwY * 0.2, p.z + 1.25);
      this.rearCamera.lookAt(p.x - fwX * 50.0, p.y - fwY * 50.0, p.z + 1.0);
    }

    // Dynamic Chromatic Aberration & Speed Lines scale
    const speedRatio = Math.min(1.0, p.speedKmh / 160.0);
    this.speedAberrationRatio = speedRatio > 0.35 ? (speedRatio - 0.35) / 0.65 : 0.0;
    const fxSpeedLines = document.getElementById("fx-speed-lines");
    if (fxSpeedLines) {
      fxSpeedLines.style.opacity = speedRatio > 0.6 ? String((speedRatio - 0.6) * 1.5) : "0";
    }
    const fxChromatic = document.getElementById("fx-chromatic");
    if (fxChromatic) {
      fxChromatic.style.opacity = speedRatio > 0.4 ? String(speedRatio * 0.7) : "0";
    }

    // 13. Update Audio
    audio.updateEngine(p.rpm, inputState.throttle);
    audio.updateTyreSqueal(p.driftAngleDeg, p.speedKmh);

    // 14. Update In-Game HUD Telemetry
    let rivalProgress = null;
    if (isBattle) {
      const isUphill = this.currentEvent.direction === "uphill";
      const playerDist = this.trackCollision.distanceAlongTrack;
      const distDelta = isUphill ?
        (this.rivalDistance - playerDist) :
        (playerDist - this.rivalDistance);

      // Clean Initial D battle gap in seconds based on relative track distance
      const avgSpeed = Math.max(20.0, (Math.max(p.speed, 0) + this.rivalSpeed) * 0.5);
      const gapSeconds = distDelta / avgSpeed;

      rivalProgress = {
        distance: this.rivalDistance,
        gapSeconds: gapSeconds
      };
    }

    this.hud.update(p, this.trackCollision, this.raceTimer, rivalProgress);

    // 15. Finish Line Check (Ignore auto-finish in free run)
    if (this.trackCollision.completed && this.state === "RACING" && this.currentEvent.mode !== "free_run") {
      this.finishRace();
    }
  }

  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2.0);
    if (this.mainRenderTarget) {
      this.mainRenderTarget.setSize(Math.round(width * dpr), Math.round(height * dpr));
    }
    if (this.rearCamera) {
      this.rearCamera.aspect = COCKPIT_MIRROR_CONFIG.width / COCKPIT_MIRROR_CONFIG.height;
      this.rearCamera.updateProjectionMatrix();
    }
  }
}
