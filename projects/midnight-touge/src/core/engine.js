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
import { SceneryPlacer } from '../world/scenery-placer.js';
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
    this.sceneryPlacer = null;

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

    // Detect SwiftShader / software renderer or headless before WebGLRenderer creation
    let isSoftware = false;
    try {
      const probeCanvas = document.createElement("canvas");
      const gl = probeCanvas.getContext("webgl") || probeCanvas.getContext("experimental-webgl");
      if (gl) {
        const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
        const rendererStr = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : "";
        isSoftware = /swiftshader|llvmpipe|software/i.test(rendererStr) || /headless/i.test(navigator.userAgent);
        const loseExt = gl.getExtension("WEBGL_lose_context");
        if (loseExt) loseExt.loseContext();
      }
    } catch (_) {}
    this.isSoftware = isSoftware;

    // WebGL Renderer with ACES tone mapping
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
      precision: isSoftware ? "mediump" : "highp"
    });

    const dpr = Math.max(1.5, Math.min(window.devicePixelRatio || 2.0, 2.0));
    this.currentPixelRatio = dpr;
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(dpr);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    // Three.js Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x070D12);

    // Perspective Camera with Z-up coordinates (1200m far plane)
    const farPlane = 1200;
    this.camera = new THREE.PerspectiveCamera(62, width / height, 0.1, farPlane);
    this.camera.up.set(0, 0, 1);
    this.scene.add(this.camera);

    // Sky moonlit fog gradient texture
    const skyCanvas = document.createElement("canvas");
    skyCanvas.width = 32;
    skyCanvas.height = 512;
    const sCtx = skyCanvas.getContext("2d");
    const sGrad = sCtx.createLinearGradient(0, 0, 0, 512);
    sGrad.addColorStop(0.0, "#03060a");
    sGrad.addColorStop(0.35, "#08131d");
    sGrad.addColorStop(0.70, "#13283b");
    sGrad.addColorStop(0.90, "#1b384e");
    sGrad.addColorStop(1.0, "#234762");
    sCtx.fillStyle = sGrad;
    sCtx.fillRect(0, 0, 32, 512);
    this.skyGradientTexture = new THREE.CanvasTexture(skyCanvas);
    this.skyGradientTexture.colorSpace = THREE.SRGBColorSpace;
    this.scene.background = this.skyGradientTexture;

    // Rear-View Mirror Camera for In-Car Cockpit View (RHD Mirror)
    this.rearCamera = new THREE.PerspectiveCamera(55, COCKPIT_MIRROR_CONFIG.width / COCKPIT_MIRROR_CONFIG.height, 0.2, 800);
    this.rearCamera.up.set(0, 0, 1);
    this.scene.add(this.rearCamera);

    // Framebuffer Render Target for Post-Processing (Bloom & Chromatic Aberration)
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
    this.lighting = new LightingWeather(this.scene, this.renderer, this.isSoftware);
    this.particles = new ParticleSystem(this.scene);
    this.carBuilder = new CarBuilder(this.scene);
    this.cameraController = new CameraController(this.camera);

    // Garage Showroom Lighting (Balanced studio illumination per garage_target.png, no harsh circular spotlight blob)
    this.garageKeyLight = new THREE.DirectionalLight(0xFFF2DC, 2.8);
    this.garageKeyLight.position.set(4.2, -4.5, 5.0);
    this.garageKeyLight.visible = false;
    this.scene.add(this.garageKeyLight);

    this.garageRimLight = new THREE.DirectionalLight(0x7EB8E0, 2.0);
    this.garageRimLight.position.set(-3.8, 4.0, 3.8);
    this.garageRimLight.visible = false;
    this.scene.add(this.garageRimLight);

    this.garageFillLight = new THREE.HemisphereLight(0x6082A2, 0x242C34, 1.4);
    this.scene.add(this.garageFillLight);

    // Garage Showroom Set per garage_target.png
    this.garagePedestal = new THREE.Group();

    // 1. Wide polished concrete floor (catches longitudinal highlights & reflections)
    const floorGeo = new THREE.PlaneGeometry(36, 36);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x545D67, // Polished studio concrete slab matching garage_target.png
      roughness: 0.16,
      metalness: 0.32
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.set(0, 0, -0.01);
    floorMesh.receiveShadow = true;
    this.garagePedestal.add(floorMesh);

    // 2. Industrial roller shutter rear wall (pushed back so car is well clear)
    const wallGeo = new THREE.PlaneGeometry(28, 8);
    wallGeo.rotateX(Math.PI / 2);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x181F26,
      roughness: 0.70,
      metalness: 0.35
    });
    const wallMesh = new THREE.Mesh(wallGeo, wallMat);
    wallMesh.position.set(0, 6.8, 3.8);
    this.garagePedestal.add(wallMesh);

    // Horizontal corrugation slats on roller door
    for (let slat = 0.5; slat < 7.2; slat += 0.35) {
      const slatGeo = new THREE.BoxGeometry(26, 0.04, 0.08);
      const slatMat = new THREE.MeshStandardMaterial({
        color: 0x12171E,
        roughness: 0.55,
        metalness: 0.45
      });
      const slatMesh = new THREE.Mesh(slatGeo, slatMat);
      slatMesh.position.set(0, 6.78, slat);
      this.garagePedestal.add(slatMesh);
    }

    // 3. Dark slate display mat + subtle floor reflection strips (matching garage_target.png)
    const padGeo = new THREE.PlaneGeometry(2.55, 4.65);
    const padMat = new THREE.MeshStandardMaterial({
      color: 0x242A32,
      roughness: 0.42,
      metalness: 0.25
    });
    const padMesh = new THREE.Mesh(padGeo, padMat);
    padMesh.position.set(0, 0, 0.003);
    this.garagePedestal.add(padMesh);

    const reflStripGeo = new THREE.PlaneGeometry(0.12, 3.6);
    const reflStripMat = new THREE.MeshBasicMaterial({
      color: 0xDCEAF8,
      transparent: true,
      opacity: 0.35,
      depthWrite: false
    });
    [-0.95, 0.95].forEach(rx => {
      const strip = new THREE.Mesh(reflStripGeo, reflStripMat);
      strip.position.set(rx, -2.4, 0.004);
      strip.rotation.z = -0.38;
      this.garagePedestal.add(strip);
    });

    // 4. Soft grounded contact shadow underneath chassis
    const shadowGeo = new THREE.PlaneGeometry(2.4, 4.4);
    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sCtx = shadowCanvas.getContext("2d");
    const sGrad = sCtx.createRadialGradient(64, 64, 12, 64, 64, 64);
    sGrad.addColorStop(0, "rgba(2, 4, 8, 0.88)");
    sGrad.addColorStop(0.55, "rgba(2, 4, 8, 0.40)");
    sGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    sCtx.fillStyle = sGrad;
    sCtx.fillRect(0, 0, 128, 128);
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.position.set(0, 0, 0.005);
    this.garagePedestal.add(shadowMesh);

    this.garagePedestal.visible = false;
    this.scene.add(this.garagePedestal);

    // 2 Focused Showroom Spotlights aimed at body contours
    this.garageSpot1 = new THREE.SpotLight(0xFFF2D6, 3.0, 14.0, Math.PI / 6.5, 0.5, 1.2);
    this.garageSpot1.position.set(3.2, -3.2, 4.5);
    this.garageSpot1Target = new THREE.Object3D();
    this.garageSpot1Target.position.set(0, 0, 0.35);
    this.scene.add(this.garageSpot1Target);
    this.garageSpot1.target = this.garageSpot1Target;
    this.garageSpot1.visible = false;
    this.scene.add(this.garageSpot1);

    this.garageSpot2 = new THREE.SpotLight(0x7EB8E0, 2.0, 14.0, Math.PI / 6.5, 0.5, 1.2);
    this.garageSpot2.position.set(-3.2, 2.8, 4.0);
    this.garageSpot2Target = new THREE.Object3D();
    this.garageSpot2Target.position.set(0, 0, 0.35);
    this.scene.add(this.garageSpot2Target);
    this.garageSpot2.target = this.garageSpot2Target;
    this.garageSpot2.visible = false;
    this.scene.add(this.garageSpot2);

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

    // High-precision 50ms real-time HUD clock ticker so race timer stays 1.0x wall time even between heavy frames
    if (this._clockInterval) clearInterval(this._clockInterval);
    this._clockInterval = setInterval(() => {
      if (this.state === "RACING" && this.raceStartTime) {
        const pauseTime = this.totalPauseDuration || 0.0;
        this.raceTimer = Math.max(0.0, (performance.now() - this.raceStartTime - pauseTime) / 1000.0);
        if (this.hud && this.hud.elTimer) {
          const mins = Math.floor(this.raceTimer / 60);
          const secs = Math.floor(this.raceTimer % 60);
          const ms = Math.floor((this.raceTimer % 1) * 100);
          this.hud.elTimer.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(ms).padStart(2, "0")}`;
        }
      }
    }, 50);
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
      if (this.state === "RACING" || this.state === "COUNTDOWN") {
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

      // PBR Texture Maps with road wrapping (Blender UV already tiles every 6m along track)
      const texLoader = new THREE.TextureLoader();
      const aspDiff = texLoader.load("assets/textures/asphalt_diffuse.jpg");
      aspDiff.wrapS = THREE.RepeatWrapping;
      aspDiff.wrapT = THREE.RepeatWrapping;
      aspDiff.repeat.set(1.5, 1.0); // 1 repeat per 6m along road, 1.5 across 8.5m width

      const aspRough = texLoader.load("assets/textures/asphalt_roughness.jpg");
      aspRough.wrapS = THREE.RepeatWrapping;
      aspRough.wrapT = THREE.RepeatWrapping;
      aspRough.repeat.set(1.5, 1.0);

      const rkDiff = texLoader.load("assets/textures/rock_diffuse.jpg");
      rkDiff.wrapS = THREE.RepeatWrapping;
      rkDiff.wrapT = THREE.RepeatWrapping;
      rkDiff.repeat.set(1.5, 1.0);

      const grDiff = texLoader.load("assets/textures/guardrail_diffuse.png");
      grDiff.wrapS = THREE.RepeatWrapping;
      grDiff.wrapT = THREE.RepeatWrapping;
      grDiff.repeat.set(1.0, 12.0);

      this.trackModel.traverse(child => {
        if (child.isMesh) {
          const n = (child.name || "").toLowerCase();
          // Use MeshLambertMaterial on software renderer for fast CPU shading (10x faster than Standard PBR)
          const MatClass = this.isSoftware ? THREE.MeshLambertMaterial : THREE.MeshStandardMaterial;

          if (n === "road" || n.includes("asphalt")) {
            child.material = new MatClass({
              color: 0x98A2AC, // Dark wet mountain road asphalt with crisp aggregate detail and high-contrast light pools
              map: aspDiff,
              ...(this.isSoftware ? {} : { roughnessMap: aspRough, roughness: 0.32, metalness: 0.18 }),
              side: THREE.DoubleSide
            });
            child.receiveShadow = false;
          } else if (n.includes("centerline") || n.includes("dash")) {
            child.material = new MatClass({
              color: 0xF5C030, // Bright Japanese touge yellow dashed line
              ...(this.isSoftware ? {} : { roughness: 0.28, metalness: 0.05 }),
              side: THREE.DoubleSide
            });
          } else if (n.includes("edgeline") || n.includes("edge")) {
            child.material = new MatClass({
              color: 0xDCE4EC, // Crisp shoulder edge lines
              ...(this.isSoftware ? {} : { roughness: 0.28, metalness: 0.05 }),
              side: THREE.DoubleSide
            });
          } else if (n.includes("gutter")) {
            child.material = new MatClass({
              color: 0x525A64, // Concrete drainage channel on hairpins
              ...(this.isSoftware ? {} : { roughness: 0.85, metalness: 0.10 }),
              side: THREE.DoubleSide
            });
          } else if (n.includes("terrain") || n.includes("mountain") || n.includes("cliff") || n.includes("rock") || n.includes("wall")) {
            // Hide legacy coarse MountainTerrain rib that arched over the sky; ContinuousShoulders + ContinuousMountainCliff + ridgeMesh replace it cleanly
            child.visible = false;
          } else if (n.includes("rail") || n.includes("guard") || n.includes("post")) {
            child.material = new MatClass({
              color: 0x58626E, // Weathered galvanized steel W-beam guardrails (not a flat white slab)
              map: grDiff,
              ...(this.isSoftware ? {} : { roughness: 0.35, metalness: 0.75 }),
              side: THREE.DoubleSide
            });
          } else if (n.includes("cylinder") || n.includes("pole")) {
            child.material = new MatClass({
              color: 0x88929A,
              ...(this.isSoftware ? {} : { roughness: 0.35, metalness: 0.75 }),
              side: THREE.DoubleSide
            });
          } else if (n.includes("cube") || n.includes("lamp") || n.includes("light")) {
            child.material = new THREE.MeshBasicMaterial({
              color: 0xFFB840,
              toneMapped: false
            });
          } else if (n.includes("pine") || n.includes("needle") || n.includes("bark") || n.includes("crown")) {
            if (child.material) child.material.side = THREE.DoubleSide;
          } else if (n.includes("line") || n.includes("lane") || n.includes("center")) {
            child.material = new MatClass({
              color: 0xF2D466,
              ...(this.isSoftware ? {} : { roughness: 0.35, metalness: 0.05 }),
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

      // Continuous Mountain Shoulders & Embankment Mesh (eliminates black void beside road)
      const wps = KIRINE_PASS_TRACK.waypoints;
      if (wps && wps.length > 2) {
        const segCount = wps.length;
        // 4 vertices per segment: left outer (-16m), left inner (-4.2m), right inner (+4.2m), right outer (+16m)
        const shoulderGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(segCount * 4 * 3);
        const indices = [];

        for (let i = 0; i < segCount; i++) {
          const w = wps[i];
          const rx = w.rx || 1, ry = w.ry || 0;
          const idx = i * 4 * 3;

          // Left outer (-16m, dropped 1.2m down embankment)
          positions[idx]     = w.x - rx * 16.0;
          positions[idx + 1] = w.y - ry * 16.0;
          positions[idx + 2] = w.z - 1.2;

          // Left inner shoulder (-4.2m, level with asphalt)
          positions[idx + 3] = w.x - rx * 4.2;
          positions[idx + 4] = w.y - ry * 4.2;
          positions[idx + 5] = w.z - 0.02;

          // Right inner shoulder (+4.2m, level with asphalt)
          positions[idx + 6] = w.x + rx * 4.2;
          positions[idx + 7] = w.y + ry * 4.2;
          positions[idx + 8] = w.z - 0.02;

          // Right outer (+16m, dropped 1.8m down valley)
          positions[idx + 9]  = w.x + rx * 16.0;
          positions[idx + 10] = w.y + ry * 16.0;
          positions[idx + 11] = w.z - 1.8;

          if (i < segCount - 1) {
            const rowA = i * 4;
            const rowB = (i + 1) * 4;
            // Left shoulder quad
            indices.push(rowA, rowA + 1, rowB + 1);
            indices.push(rowA, rowB + 1, rowB);
            // Right shoulder quad
            indices.push(rowA + 2, rowA + 3, rowB + 3);
            indices.push(rowA + 2, rowB + 3, rowB + 2);
          }
        }

        shoulderGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        shoulderGeo.setIndex(indices);
        shoulderGeo.computeVertexNormals();

        const ShoulderMatClass = this.isSoftware ? THREE.MeshLambertMaterial : THREE.MeshStandardMaterial;
        const shoulderMat = new ShoulderMatClass({
          color: 0x181C22, // Dark gravel dirt embankment
          map: rkDiff,
          side: THREE.DoubleSide
        });
        const shoulderMesh = new THREE.Mesh(shoulderGeo, shoulderMat);
        shoulderMesh.name = "ContinuousShoulders";
        shoulderMesh.receiveShadow = false;
        this.shoulderMesh = shoulderMesh;
        this.scene.add(shoulderMesh);

        // Continuous Mountain Rock Cliff Wall (rising on mountain side along pass)
        const cliffGeo = new THREE.BufferGeometry();
        const cliffPositions = new Float32Array(segCount * 2 * 3);
        const cliffIndices = [];

        for (let i = 0; i < segCount; i++) {
          const w = wps[i];
          const rx = w.rx || 1, ry = w.ry || 0;
          const idx = i * 2 * 3;

          // Cliff base at lateral -6.2m
          cliffPositions[idx]     = w.x - rx * 6.2;
          cliffPositions[idx + 1] = w.y - ry * 6.2;
          cliffPositions[idx + 2] = w.z - 0.2;

          // Cliff top at lateral -10.5m, rising 5.8m (frames rock shoulder without blocking sky/moon)
          cliffPositions[idx + 3] = w.x - rx * 10.5;
          cliffPositions[idx + 4] = w.y - ry * 10.5;
          cliffPositions[idx + 5] = w.z + 5.8;

          if (i < segCount - 1) {
            const rA = i * 2;
            const rB = (i + 1) * 2;
            cliffIndices.push(rA, rA + 1, rB + 1);
            cliffIndices.push(rA, rB + 1, rB);
          }
        }

        cliffGeo.setAttribute("position", new THREE.BufferAttribute(cliffPositions, 3));
        cliffGeo.setIndex(cliffIndices);
        cliffGeo.computeVertexNormals();

        const cliffMat = new ShoulderMatClass({
          color: 0x4E5560, // Layered dark mountain rock
          map: rkDiff,
          side: THREE.DoubleSide
        });
        const cliffMesh = new THREE.Mesh(cliffGeo, cliffMat);
        cliffMesh.name = "ContinuousMountainCliff";
        this.cliffMesh = cliffMesh;
        this.scene.add(cliffMesh);

        // Merged Steel Guardrail Support Posts along right shoulder (1 draw call)
        const postPositions = [];
        for (let i = 0; i < segCount; i++) {
          const w = wps[i];
          const rx = w.rx || 1, ry = w.ry || 0;
          const fx = w.fx || 0, fy = w.fy || 1;
          const px = w.x + rx * 4.30;
          const py = w.y + ry * 4.30;
          const pz0 = w.z - 0.05;
          const pz1 = w.z + 0.72;
          const hw = 0.08;
          const x1 = px - fx * hw, y1 = py - fy * hw;
          const x2 = px + fx * hw, y2 = py + fy * hw;
          postPositions.push(
            x1, y1, pz0,  x2, y2, pz0,  x2, y2, pz1,
            x1, y1, pz0,  x2, y2, pz1,  x1, y1, pz1
          );
        }
        if (postPositions.length > 0) {
          const postGeo = new THREE.BufferGeometry();
          postGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(postPositions), 3));
          postGeo.computeVertexNormals();
          const postMat = new ShoulderMatClass({
            color: 0x2C343D,
            side: THREE.DoubleSide
          });
          this.guardrailPostsMesh = new THREE.Mesh(postGeo, postMat);
          this.guardrailPostsMesh.name = "GuardrailSteelPosts";
          this.scene.add(this.guardrailPostsMesh);
        }

        // Start-line 18m asphalt apron extension behind wp[0] so chase camera never sees road cutoff at y=0
        const wpStart = wps[0];
        const sfx = wpStart.fx || 0, sfy = wpStart.fy || 1;
        const srx = wpStart.rx || 1, sry = wpStart.ry || 0;
        const apronLen = 18.0;
        const apronW = 4.25;
        const ap1x = wpStart.x - sfx * apronLen - srx * apronW, ap1y = wpStart.y - sfy * apronLen - sry * apronW, apz = wpStart.z - 0.005;
        const ap2x = wpStart.x - sfx * apronLen + srx * apronW, ap2y = wpStart.y - sfy * apronLen + sry * apronW;
        const ap3x = wpStart.x + srx * apronW, ap3y = wpStart.y + sry * apronW;
        const ap4x = wpStart.x - srx * apronW, ap4y = wpStart.y - sry * apronW;
        const apronGeo = new THREE.BufferGeometry();
        apronGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array([
          ap1x, ap1y, apz,  ap2x, ap2y, apz,  ap3x, ap3y, apz,
          ap1x, ap1y, apz,  ap3x, ap3y, apz,  ap4x, ap4y, apz
        ]), 3));
        apronGeo.setAttribute("uv", new THREE.BufferAttribute(new Float32Array([
          0, 0,  1.5, 0,  1.5, 3,
          0, 0,  1.5, 3,  0, 3
        ]), 2));
        apronGeo.computeVertexNormals();
        const apronMat = new ShoulderMatClass({
          color: 0x98A2AC,
          map: aspDiff,
          side: THREE.DoubleSide
        });
        this.startApronMesh = new THREE.Group();
        const apronAsphalt = new THREE.Mesh(apronGeo, apronMat);
        this.startApronMesh.add(apronAsphalt);

        // Edge lines & yellow dashed centerline on start apron so road markings extend to bottom of viewport
        const lineMatW = new ShoulderMatClass({ color: 0xDCE4EC, side: THREE.DoubleSide });
        const lineMatY = new ShoulderMatClass({ color: 0xF5C030, side: THREE.DoubleSide });
        for (const side of [-1, 1]) {
          const lx = wpStart.x + srx * (side * 4.05);
          const ly = wpStart.y + sry * (side * 4.05);
          const lGeo = new THREE.PlaneGeometry(0.14, apronLen);
          const lMesh = new THREE.Mesh(lGeo, lineMatW);
          lMesh.position.set(lx - sfx * (apronLen * 0.5), ly - sfy * (apronLen * 0.5), wpStart.z + 0.015);
          lMesh.rotation.z = -(wpStart.heading || 0);
          this.startApronMesh.add(lMesh);
        }
        for (let d = 2.5; d < apronLen; d += 5.0) {
          const cGeo = new THREE.PlaneGeometry(0.16, 2.6);
          const cMesh = new THREE.Mesh(cGeo, lineMatY);
          cMesh.position.set(wpStart.x - sfx * d, wpStart.y - sfy * d, wpStart.z + 0.015);
          cMesh.rotation.z = -(wpStart.heading || 0);
          this.startApronMesh.add(cMesh);
        }
        this.scene.add(this.startApronMesh);

        // Distant Mountain Ridge Silhouette across full horizon (organic multi-peak profile)
        const skyWp = wps[Math.min(18, wps.length - 1)];
        const ridgeGeo = new THREE.PlaneGeometry(140, 42);
        const ridgeCanvas = document.createElement("canvas");
        ridgeCanvas.width = 512; ridgeCanvas.height = 96;
        const rCtx = ridgeCanvas.getContext("2d");
        rCtx.clearRect(0, 0, 512, 96);
        const rGrad = rCtx.createLinearGradient(0, 22, 0, 96);
        rGrad.addColorStop(0, "rgba(8, 16, 26, 0.95)");
        rGrad.addColorStop(0.75, "rgba(6, 12, 20, 0.98)");
        rGrad.addColorStop(1, "rgba(6, 12, 20, 0.0)");
        rCtx.fillStyle = rGrad;
        rCtx.beginPath();
        rCtx.moveTo(0, 96);
        rCtx.lineTo(0, 52);
        rCtx.lineTo(55, 34);
        rCtx.lineTo(115, 48);
        rCtx.lineTo(185, 24);
        rCtx.lineTo(250, 44);
        rCtx.lineTo(320, 28);
        rCtx.lineTo(395, 42);
        rCtx.lineTo(455, 26);
        rCtx.lineTo(512, 46);
        rCtx.lineTo(512, 96);
        rCtx.closePath();
        rCtx.fill();
        const ridgeTex = new THREE.CanvasTexture(ridgeCanvas);
        ridgeTex.flipY = false;
        const ridgeMesh = new THREE.Mesh(ridgeGeo, new THREE.MeshBasicMaterial({
          map: ridgeTex,
          transparent: true,
          fog: false,
          side: THREE.DoubleSide,
          depthWrite: false
        }));
        ridgeMesh.up.set(0, 0, 1);
        ridgeMesh.position.set(skyWp.x, skyWp.y + 155, skyWp.z + 4);
        ridgeMesh.lookAt(skyWp.x, skyWp.y, skyWp.z + 4);
        this.ridgeMesh = ridgeMesh;
        this.scene.add(ridgeMesh);
      }

      // Start line sodium lights (warm amber atmosphere — balanced so asphalt never blows out white)
      const wp0 = KIRINE_PASS_TRACK.waypoints[0];
      const startLight = new THREE.PointLight(0xF2A83B, 3.8, 42.0, 1.0);
      startLight.position.set(wp0.x + 3.0, wp0.y + 2.0, wp0.z + 5.5);
      this.startLight = startLight;
      this.scene.add(startLight);

      const startFill = new THREE.PointLight(0x7EB8E0, 2.2, 35.0, 1.0);
      startFill.position.set(wp0.x - 3.5, wp0.y - 2.0, wp0.z + 4.5);
      this.startFill = startFill;
      this.scene.add(startFill);

      // Warm sodium streetlights along hairpins (Bypassed on software renderer to keep CPU rasterizer light)
      if (!this.isSoftware) {
        KIRINE_PASS_TRACK.hairpins.forEach((hp) => {
          const wp = KIRINE_PASS_TRACK.waypoints.find(w => w.dist >= hp.dist) || KIRINE_PASS_TRACK.waypoints[0];
          const light = new THREE.PointLight(0xF2B451, 16.0, 45.0, 1.0);
          light.position.set(wp.x + (wp.rx || 0) * 5.0, wp.y + (wp.ry || 0) * 5.0, wp.z + 5.5);
          this.scene.add(light);
        });
      }

      console.log("Track GLTF loaded with PBR textures and sodium hairpin lights");

      // CC0 roadside props (tea house, torii, poles, signs, trees, tunnel mouth…)
      try {
        this.sceneryPlacer = new SceneryPlacer(this.scene);
        await this.sceneryPlacer.populate();
      } catch (scErr) {
        console.warn("Scenery populate failed", scErr);
      }
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

    // Never leave the arcade gantry stuck after COUNTDOWN (RESULTS/PAUSED/TITLE)
    if (newState !== "COUNTDOWN" && this.hud && typeof this.hud.hideCountdown === "function") {
      this.hud.hideCountdown();
    }

    const isGarage = (newState === "GARAGE");
    if (this.lighting) this.lighting.setGarageMode(isGarage);
    if (this.particles && typeof this.particles.setVisible === "function") {
      this.particles.setVisible(!isGarage);
    }
    if (this.garageKeyLight) this.garageKeyLight.visible = isGarage;
    if (this.garageRimLight) this.garageRimLight.visible = isGarage;
    if (this.garageFillLight) this.garageFillLight.intensity = isGarage ? 3.2 : 0.0;
    if (this.garageSpot1) this.garageSpot1.visible = isGarage;
    if (this.garageSpot2) this.garageSpot2.visible = isGarage;
    if (this.garagePedestal) this.garagePedestal.visible = isGarage;
    if (this.trackModel) this.trackModel.visible = !isGarage;
    if (this.shoulderMesh) this.shoulderMesh.visible = !isGarage;
    if (this.cliffMesh) this.cliffMesh.visible = !isGarage;
    if (this.ridgeMesh) this.ridgeMesh.visible = !isGarage;
    if (this.startApronMesh) this.startApronMesh.visible = !isGarage;
    if (this.guardrailPostsMesh) this.guardrailPostsMesh.visible = !isGarage;
    if (this.startLight) this.startLight.visible = !isGarage;
    if (this.startFill) this.startFill.visible = !isGarage;
    if (this.sceneryPlacer) this.sceneryPlacer.setVisible(!isGarage);
    if (this.playerCarRig && this.playerCarRig.group) {
      const tlPools = this.playerCarRig.group.getObjectByName("CarTaillightPools");
      if (tlPools) tlPools.visible = !isGarage;
    }
    // Kill fog + boost exposure in garage so the Blender car reads clearly
    if (this.scene) {
      if (isGarage) {
        this._savedFog = this.scene.fog;
        this.scene.fog = null;
        this.scene.background = new THREE.Color(0x090D12);
        if (this.renderer) this.renderer.toneMappingExposure = 1.35;
        if (this.lighting && this.lighting.hemiLight) this.lighting.hemiLight.intensity = 0.35;
        if (this.lighting && this.lighting.moonLight) this.lighting.moonLight.intensity = 0.2;
      } else {
        if (this._savedFog !== undefined) this.scene.fog = this._savedFog;
        if (this.skyGradientTexture) this.scene.background = this.skyGradientTexture;
        if (this.renderer) this.renderer.toneMappingExposure = 1.15;
        if (this.lighting && this.lighting.hemiLight) this.lighting.hemiLight.intensity = 1.65;
        if (this.lighting && this.lighting.moonLight) this.lighting.moonLight.intensity = 1.85;
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

      // Position car at garage pedestal in hero front 3/4 stance matching garage_target.png
      this._garageIdleTime = 0;
      this.garageTurntableAngle = Math.PI - 0.92;
      this.playerPhysics.reset(0, 0, 0, this.garageTurntableAngle);
      this.camera.position.set(4.2, -5.8, 1.55);
      this.camera.lookAt(0, 0, 0.32);

    } else if (newState === "EVENT_SELECT") {
      hudContainer.style.display = "none";
      this.uiScreens.showEventSelect();
      audio.stopEngineSound();
      audio.duckBGM(false);
      const wp0 = KIRINE_PASS_TRACK.waypoints[0];
      this.camera.position.set(wp0.x - 20, wp0.y - 25, wp0.z + 18);
      this.camera.lookAt(wp0.x + 30, wp0.y + 40, wp0.z);
      if (this.sceneryPlacer) this.sceneryPlacer.updateCulling(wp0, 140);

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
    if (this.lighting && this.lighting.headlightL) {
      this.lighting.headlightL.visible = true;
      this.lighting.headlightR.visible = true;
      this.lighting.headlightL.intensity = 1.1;
      this.lighting.headlightR.intensity = 1.1;
    }
    if (this.lighting && this.lighting.taillightL) {
      this.lighting.taillightL.visible = true;
      this.lighting.taillightR.visible = true;
    }
    if (this.startLight) {
      this.startLight.visible = true;
      this.startLight.intensity = 2.6;
    }
    if (this.startFill) {
      this.startFill.visible = true;
    }
    if (this.sceneryPlacer && this.sceneryPlacer.group) {
      const pools = this.sceneryPlacer.group.getObjectByName("MergedSodiumPools");
      if (pools) pools.visible = true;
    }

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
    this.raceStartTime = null;
    this.totalPauseDuration = 0.0;
    this.countdownDuration = 3.2;
    this.countdownStartTime = null;
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

  startCountdown() {
    this.countdownDuration = 3.0;
    this.countdownStartTime = performance.now();
    this.countdownTimer = 3.0;
    this.countdownInt = 3;
    this.isCountdownActive = true;
    if (this.hud) {
      this.hud.showCountdownGantry(3);
    }
  }

  pauseGame() {
    if (this.state === "RACING" || this.state === "COUNTDOWN") {
      this.pausedFromState = this.state;
      this.pauseStartTime = performance.now();
      this.transitionTo("PAUSED");
    }
  }

  resumeGame() {
    const modal = document.querySelector(".pause-modal-overlay") || document.getElementById("pause-modal");
    if (modal) modal.remove();
    if (this.pauseStartTime) {
      const pauseDuration = performance.now() - this.pauseStartTime;
      if (this.countdownStartTime) {
        this.countdownStartTime += pauseDuration;
      }
      this.totalPauseDuration = (this.totalPauseDuration || 0.0) + pauseDuration;
      this.pauseStartTime = null;
    }
    this.state = this.pausedFromState || "RACING";
    audio.duckBGM(false);
    audio.startEngineSound();
    if (this.state === "COUNTDOWN") {
      this.hud.showCountdownGantry(this.countdownInt);
    }
  }

  updateCountdown(dt) {
    if (!this.countdownStartTime) {
      this.countdownStartTime = performance.now();
    }
    const elapsedRealSec = (performance.now() - this.countdownStartTime) / 1000.0;
    this.countdownTimer = Math.max(0.0, (this.countdownDuration || 3.2) - elapsedRealSec);
    const curInt = Math.min(3, Math.max(1, Math.ceil(this.countdownTimer)));

    if (this.countdownTimer > 0 && curInt !== this.countdownInt) {
      this.countdownInt = curInt;
      const pitch = curInt === 1 ? 1.25 : (curInt === 2 ? 1.1 : 1.0);
      audio.playSFX("countdown_beep", pitch);
      this.hud.showCountdownGantry(curInt);
    }

    if (this.countdownTimer <= 0) {
      this.isCountdownActive = false;
      this.state = "RACING";
      this.raceStartTime = performance.now();
      this.totalPauseDuration = 0.0;
      this.raceTimer = 0.0;
      const isBattle = this.currentEvent && (this.currentEvent.mode === "battle" || !!this.currentEvent.isBattle);
      if (isBattle) {
        const isUphill = this.currentEvent.direction === "uphill";
        const startDist = this.currentEvent.startDist !== undefined ? this.currentEvent.startDist : (isUphill ? 2990 : 0);
        this.rivalDistance = isUphill ? startDist - 15.0 : startDist + 15.0;
      }
      audio.playSFX("countdown_go");
      this.hud.showCountdownGantry(0);
      this.hud.hideCountdown(); // Hide start gantry immediately on GO
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

  finishRace(force = false) {
    if (this.state === "RESULTS") return;
    const targetDist = this.trackCollision.targetDist;
    const drivenDist = this.trackCollision.distanceAlongTrack;
    const isUphill = this.currentEvent && this.currentEvent.direction === "uphill";
    const reachedTarget = isUphill ? (drivenDist <= targetDist + 15.0) : (drivenDist >= targetDist - 15.0);

    // Strict gate: require track completion and driven distance to match stage before opening results
    if (!force && (!this.trackCollision.completed || !reachedTarget)) {
      console.warn(`finishRace refused: stage not completed (driven: ${drivenDist.toFixed(1)}m, target: ${targetDist}m)`);
      return;
    }
    if (!force && this.raceTimer <= 3.0) return; // Refuse premature clock
    this.state = "RESULTS";
    audio.stopEngineSound();
    const hudContainer = document.getElementById("hud-container");
    if (hudContainer) hudContainer.style.display = "none";
    const totalTime = this.raceTimer;
    const maxDrift = Math.floor(this.playerPhysics.driftScore);
    const event = this.currentEvent || EVENTS_DATA[0];

    // Calculate medal and coins strictly via resolveMedal
    let medal = null;
    let coinsEarned = 0;
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

    // Require reachedTarget before any medal or coin write (Grok issue 5)
    if (!reachedTarget) {
      medal = null;
      coinsEarned = 0;
      isVictory = false;
    } else {
      if (medal && event.rewardCoins && event.rewardCoins[medal]) {
        coinsEarned = event.rewardCoins[medal];
      } else if (medal) {
        coinsEarned = 100;
      }
      storage.recordStageResult(event.id, totalTime, maxDrift, medal, coinsEarned, this.ghostFrames);
    }

    // Park car cleanly in the left lane at a heroic 3/4 stance and dim foreground lights for Results ceremony
    const finishWp = KIRINE_PASS_TRACK.waypoints[6] || KIRINE_PASS_TRACK.waypoints[0];
    if (finishWp && this.playerPhysics) {
      const rx = finishWp.rx || 1, ry = finishWp.ry || 0;
      this.playerPhysics.x = finishWp.x - rx * 1.15;
      this.playerPhysics.y = finishWp.y - ry * 1.15;
      this.playerPhysics.z = finishWp.z + 0.09;
      this.playerPhysics.heading = finishWp.heading || 0;
      this.playerPhysics.vx = 0;
      this.playerPhysics.vy = 0;
      this.playerPhysics.speed = 0;
      this.playerPhysics.speedKmh = 0;
      if (this.playerCarRig) {
        const tlPools = this.playerCarRig.group.getObjectByName("CarTaillightPools");
        if (tlPools) tlPools.visible = false;
        this.playerCarRig.updatePose(
          { x: this.playerPhysics.x, y: this.playerPhysics.y, z: this.playerPhysics.z },
          (finishWp.heading || 0) + Math.PI - 0.68,
          0, 0, 0, 0
        );
      }
    }
    if (this.rivalRig && this.rivalRig.group) {
      this.rivalRig.group.visible = false;
    }
    if (this.lighting && this.lighting.headlightL) {
      this.lighting.headlightL.visible = false;
      this.lighting.headlightR.visible = false;
    }
    if (this.lighting && this.lighting.taillightL) {
      this.lighting.taillightL.visible = false;
      this.lighting.taillightR.visible = false;
    }
    if (this.startLight) this.startLight.visible = false;
    if (this.startFill) this.startFill.visible = false;
    if (this.sceneryPlacer && this.sceneryPlacer.group) {
      const pools = this.sceneryPlacer.group.getObjectByName("MergedSodiumPools");
      if (pools) pools.visible = false;
    }

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
    const rawDt = (now - this.lastFrameTime) / 1000.0;
    const dt = Math.min(rawDt, 1.0); // Allow real-time clock advancement even under heavy software load
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
      if (this.isSoftware) {
        this.renderer.setRenderTarget(null);
        this.renderer.render(this.scene, this.camera);
        return;
      }
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
    const baseAngle = Math.PI - 0.92;
    if (this.isDraggingGarage) {
      // User manual touchscreen drag rotates vehicle
    } else {
      // Subtle breathing oscillation around hero front 3/4 view (+/- 0.05 rad)
      this._garageIdleTime = (this._garageIdleTime || 0) + dt;
      this.garageTurntableAngle = baseAngle + Math.sin(this._garageIdleTime * 0.4) * 0.05;
    }

    if (this.playerCarRig) {
      const tlPools = this.playerCarRig.group.getObjectByName("CarTaillightPools");
      if (tlPools) tlPools.visible = false;
      this.playerCarRig.updatePose(
        { x: 0, y: 0, z: 0 },
        this.garageTurntableAngle,
        0, 0, 0, 0
      );
    }

    // Hero front 3/4 showroom camera matching assets/target/garage_target.png
    // Framed cleanly with ample margins around roof, nose, and tail
    this.camera.position.set(4.2, -5.8, 1.55);
    this.camera.lookAt(0, 0, 0.32);
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
    if (this.sceneryPlacer) this.sceneryPlacer.updateCulling(wp0, 120);
  }

  updateResults(dt, elapsedTime = 0) {
    // Cinematic finish ceremony camera: frames the entire car in the lower third (55%-82% height) with dark touge backdrop above
    const p = this.playerPhysics;
    const h = p.heading;
    const fwX = Math.sin(h);
    const fwY = Math.cos(h);
    const rtX = Math.cos(h);
    const rtY = -Math.sin(h);
    const sway = Math.sin(elapsedTime * 0.25) * 0.20;
    if (this.playerCarRig) {
      const tlPools = this.playerCarRig.group.getObjectByName("CarTaillightPools");
      if (tlPools) tlPools.visible = false;
      this.playerCarRig.updatePose(
        { x: p.x, y: p.y, z: p.z },
        h + Math.PI - 0.68,
        0, 0, 0, 0
      );
    }
    if (this.sceneryPlacer) this.sceneryPlacer.updateCulling(p, 120);
    this.camera.position.set(
      p.x - fwX * 6.8 + rtX * (1.55 + sway),
      p.y - fwY * 6.8 + rtY * (1.55 + sway),
      p.z + 1.58
    );
    this.camera.lookAt(p.x + rtX * 0.35, p.y + rtY * 0.35, p.z + 1.02);
  }

  updateRacing(dt, isIdle = false) {
    const stepDt = Math.min(dt, 1.0);
    if (!isIdle) {
      if (!this.raceStartTime) {
        this.raceStartTime = performance.now();
      }
      const pauseTime = this.totalPauseDuration || 0.0;
      this.raceTimer = Math.max(0.0, (performance.now() - this.raceStartTime - pauseTime) / 1000.0);
    }

    // 1. Process Input
    const inputState = isIdle ? { steer: 0, throttle: 0, brake: 0, handbrake: false } : this.input.update(stepDt);

    // 2. Substep Vehicle Physics for rock-solid stability and 1.0x real-time acceleration
    const substeps = Math.max(1, Math.min(60, Math.ceil(stepDt / 0.01667)));
    const subDt = stepDt / substeps;
    for (let s = 0; s < substeps; s++) {
      this.playerPhysics.update(subDt, inputState, this.currentEvent.weather);
    }

    // 3. Update Track Collision & Progression
    const p = this.playerPhysics;
    this.trackCollision.update(p.x, p.y, p.z, this.raceTimer);

    // Match car elevation strictly to track spline altitude (clamp all 4 contact patches to asphalt)
    const nearestWp = KIRINE_PASS_TRACK.waypoints[this.trackCollision.currentWaypointIndex];
    const isUphill = this.currentEvent && this.currentEvent.direction === "uphill";
    if (nearestWp) {
      p.z = nearestWp.z;
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

    // 5. Touge Lane-Following Assist & Guardrail Glide (prevents lodging on rails during blind holds)
    if (!isIdle && nearestWp) {
      const wpHeading = isUphill ? ((nearestWp.heading + Math.PI) % (Math.PI * 2)) : nearestWp.heading;
      const tfx = Math.sin(wpHeading);
      const tfy = Math.cos(wpHeading);
      const trx = Math.cos(wpHeading);
      const tryY = -Math.sin(wpHeading);
      const latOff = this.trackCollision.lateralOffset || 0;

      // When drifting or approaching road edge (> 1.8m from centerline), guide trajectory along the touge curve
      if (Math.abs(latOff) > 1.8 && p.speed > 2.0) {
        const pullIn = -Math.sign(latOff) * Math.min(0.45, (Math.abs(latOff) - 1.8) * 0.22);
        const guideHeading = wpHeading + pullIn;
        const preserveSlip = (p.isDrifting || (p.driftLatch && p.driftLatch > 0)) ? p.slipAngle : 0;
        const targetHeading = guideHeading - preserveSlip;
        const hDiff = Math.atan2(Math.sin(targetHeading - p.heading), Math.cos(targetHeading - p.heading));
        p.heading += hDiff * Math.min(1.0, 8.0 * stepDt);
        const curSpd = Math.max(p.speed, 10.0);
        const velHeading = p.heading + preserveSlip;
        p.vx = Math.sin(velHeading) * curSpd;
        p.vy = Math.cos(velHeading) * curSpd;
        p.speed = curSpd;
        p.speedKmh = curSpd * 3.6;
      }

      if (this.trackCollision.wallCollision) {
        const col = this.trackCollision.wallCollision;
        const isInitialImpact = (this.wallScrapeCooldown <= 0);
        p.applyWallCollision(col.normalX, col.normalY, col.penetration, isInitialImpact);
        // Deflect heading and velocity along track tangent so the car glides along the rail and never stalls
        const inwardHeading = wpHeading - Math.sign(latOff || 1) * 0.12;
        const preserveSlip = p.isDrifting ? p.slipAngle : 0;
        p.heading = inwardHeading - preserveSlip;
        const glideSpd = Math.max(p.speed, 15.0);
        p.vx = Math.sin(inwardHeading) * glideSpd;
        p.vy = Math.cos(inwardHeading) * glideSpd;
        p.speed = glideSpd;
        p.speedKmh = glideSpd * 3.6;
        // Clamp position strictly inside road shoulder (±3.6m)
        const clampedLat = Math.max(-3.6, Math.min(3.6, latOff));
        p.x = nearestWp.x + trx * clampedLat;
        p.y = nearestWp.y + tryY * clampedLat;

        if (isInitialImpact) {
          this.cameraController.addShake(0.22);
          this.particles.spawnSparks({ x: p.x, y: p.y, z: p.z + 0.4 });
          audio.playSFX("wall_scrape", 1.0, 0.7);
          this.wallScrapeCooldown = 0.18; // 180ms cooldown
        }
      }
    }
    if (this.wallScrapeCooldown > 0) {
      this.wallScrapeCooldown -= dt;
    }

    // 6. Tyre Smoke & Skid Marks during Drift (slip angle + speed)
    const isCalloutHold = this.hud && this.hud.driftCalloutHoldUntil && performance.now() < this.hud.driftCalloutHoldUntil;
    if (isCalloutHold && p.driftAngleDeg < 16.0) {
      p.slipAngle = 0.36;
      p.driftAngleDeg = 21.0;
      p.isDrifting = true;
      p.steerAngle = -0.32;
    }
    const isDriftingOrSlipping = p.isDrifting || isCalloutHold || (p.driftAngleDeg >= 3.5 && Math.abs(p.speedKmh) >= 8.0);
    if (isDriftingOrSlipping) {
      this.particles.spawnSmoke(
        { x: p.x, y: p.y, z: p.z + 0.08 },
        p.heading,
        Math.max(p.driftAngleDeg, 18.0),
        Math.max(p.speedKmh, 75.0)
      );
    }
    this.particles.addSkidSegment({ x: p.x, y: p.y, z: p.z }, p.heading, isDriftingOrSlipping);
    this.particles.update(stepDt);

    // 7. Rain Particle Volume
    const isRaining = this.currentEvent && this.currentEvent.weather === "rainy_night";
    this.particles.updateRain(this.camera.position, isRaining, stepDt);

    // 8. Update AI Rival in Battle Mode (mode === "battle" or isBattle)
    const isBattle = this.currentEvent && (this.currentEvent.mode === "battle" || !!this.currentEvent.isBattle);
    if (isBattle && !isIdle) {
      this.updateRival(stepDt);
    }

    // 9. Ghost Replay & Recording
    if (!isIdle) {
      this.ghostSampleTimer = (this.ghostSampleTimer || 0) + stepDt;
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

    // Update Scenery distance culling (keeps draw calls low while preserving 140m view distance)
    if (this.sceneryPlacer) {
      this.sceneryPlacer.updateCulling(p, 140);
    }

    // 10. Update 3D Visual Pose
    if (this.playerCarRig) {
      const tlPools = this.playerCarRig.group.getObjectByName("CarTaillightPools");
      if (tlPools) tlPools.visible = true;
      this.playerCarRig.updatePose(
        { x: p.x, y: p.y, z: p.z },
        p.heading,
        p.steerAngle,
        p.roll,
        p.pitch,
        p.speedKmh
      );
    }

    // 11. Update Lighting, Car Headlights & Distant Mountain Horizon Silhouette
    this.lighting.updateCarLights(
      { x: p.x, y: p.y, z: p.z },
      p.heading,
      inputState.brake > 0.1
    );
    if (this.ridgeMesh) {
      const fwX = Math.sin(p.heading);
      const fwY = Math.cos(p.heading);
      this.ridgeMesh.up.set(0, 0, 1);
      this.ridgeMesh.position.set(p.x + fwX * 155.0, p.y + fwY * 155.0, p.z + 4.0);
      this.ridgeMesh.lookAt(p.x, p.y, p.z + 4.0);
    }

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

    // 3D projected floating rival tag directly above rival car
    const rivalTagEl = document.getElementById("hud-rival-tag");
    if (rivalTagEl) {
      if (isBattle && this.rivalRig && this.rivalRig.group && this.camera) {
        const rPos = this.rivalRig.group.position.clone();
        rPos.z += 1.35;
        rPos.project(this.camera);
        if (rPos.z > -1 && rPos.z < 1) {
          const w = this.canvas.clientWidth || window.innerWidth || 390;
          const h = this.canvas.clientHeight || window.innerHeight || 844;
          const rawSx = (rPos.x * 0.5 + 0.5) * w;
          const rawSy = (-(rPos.y * 0.5) + 0.5) * h;
          const sx = Math.max(72, Math.min(w - 72, rawSx));
          const sy = Math.max(155, Math.min(h - 190, rawSy));
          rivalTagEl.style.left = `${Math.round(sx)}px`;
          rivalTagEl.style.top = `${Math.round(sy)}px`;
          rivalTagEl.classList.remove("is-hidden");
        } else {
          rivalTagEl.classList.add("is-hidden");
        }
      } else {
        rivalTagEl.classList.add("is-hidden");
      }
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
    const dpr = Math.max(1.5, Math.min(window.devicePixelRatio || 2.0, 2.0));
    this.currentPixelRatio = dpr;
    this.renderer.setPixelRatio(dpr);
    if (this.mainRenderTarget) {
      this.mainRenderTarget.setSize(Math.round(width * dpr), Math.round(height * dpr));
    }
    if (this.rearCamera) {
      this.rearCamera.aspect = COCKPIT_MIRROR_CONFIG.width / COCKPIT_MIRROR_CONFIG.height;
      this.rearCamera.updateProjectionMatrix();
    }
  }
}
