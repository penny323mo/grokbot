// Lighting & Atmospheric Weather System for Midnight Touge (《夜峠》)
// ACES tone-mapped night aesthetics with volumetric-looking fog, sodium pools & headlights
import * as THREE from '../../libs/three.module.js';

export class LightingWeather {
  constructor(scene, renderer, isSoftware = false) {
    this.scene = scene;
    this.renderer = renderer;
    this.isSoftware = isSoftware;

    // Headlight Spotlights (Mounted to player car)
    this.headlightL = null;
    this.headlightR = null;
    this.headlightTargetL = null;
    this.headlightTargetR = null;

    // Taillights
    this.taillightL = null;
    this.taillightR = null;

    // Environmental Lights
    this.hemiLight = null;
    this.moonLight = null;

    // Valley City Lights Points
    this.valleyCityPoints = null;

    this.setupLighting();
    this.setupSky();
    this.setupValleyCity();
  }

  setupSky() {
    // Night sky gradient dome (Deep midnight blue-black to horizon teal, radius 800m inside far plane)
    const skyGeo = new THREE.SphereGeometry(800, 16, 16);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        topColor: { value: new THREE.Color(0x050A10) },
        bottomColor: { value: new THREE.Color(0x162C40) },
      },
      vertexShader: `
        varying vec3 vLocalPosition;
        void main() {
          vLocalPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        varying vec3 vLocalPosition;
        void main() {
          float h = normalize(vLocalPosition).z;
          gl_FragColor = vec4(mix(bottomColor, topColor, clamp(h * 1.6, 0.0, 1.0)), 1.0);
        }
      `
    });
    this.skyMesh = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.skyMesh);

    // High mountain moon billboard in night sky (visible over mountain ridge)
    const moonCanvas = document.createElement('canvas');
    moonCanvas.width = 128;
    moonCanvas.height = 128;
    const mCtx = moonCanvas.getContext('2d');
    const mGrad = mCtx.createRadialGradient(64, 64, 14, 64, 64, 62);
    mGrad.addColorStop(0, 'rgba(255, 252, 238, 1.0)');
    mGrad.addColorStop(0.26, 'rgba(248, 244, 225, 0.95)');
    mGrad.addColorStop(0.32, 'rgba(195, 225, 248, 0.48)');
    mGrad.addColorStop(0.65, 'rgba(120, 175, 215, 0.18)');
    mGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    mCtx.fillStyle = mGrad;
    mCtx.fillRect(0, 0, 128, 128);
    const moonTex = new THREE.CanvasTexture(moonCanvas);
    const moonMat = new THREE.SpriteMaterial({
      map: moonTex,
      transparent: true,
      fog: false,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.moonSprite = new THREE.Sprite(moonMat);
    this.moonSprite.scale.set(28, 28, 1);
    this.moonSprite.position.set(-22, 160, 412);
    this.scene.add(this.moonSprite);
  }

  setupLighting() {
    // 1. Ambient & Hemispherical Night Light (Deep night teal / cool blue-black)
    this.hemiLight = new THREE.HemisphereLight(0x4E738A, 0x1A2630, 1.65);
    this.scene.add(this.hemiLight);

    // 2. Moonlight directional (High mountain moonlight shining down across the touge)
    this.moonLight = new THREE.DirectionalLight(0xA8D4F0, 1.85);
    this.moonLight.position.set(-300, 200, 850);
    this.scene.add(this.moonLight);

    // 3. Fog (Deep night mist)
    this.scene.fog = new THREE.FogExp2(0x0B1620, 0.0038);

    // 4. Player Car Dual Headlights (Soft warm beams — calibrated so road never bleaches white)
    this.headlightL = new THREE.SpotLight(0xFFF2D6, 1.8, 65.0, Math.PI / 5.5, 0.78, 1.2);
    this.headlightR = new THREE.SpotLight(0xFFF2D6, 1.8, 65.0, Math.PI / 5.5, 0.78, 1.2);
    this.headlightTargetL = new THREE.Object3D();
    this.headlightTargetR = new THREE.Object3D();

    this.scene.add(this.headlightL);
    this.scene.add(this.headlightR);
    this.scene.add(this.headlightTargetL);
    this.scene.add(this.headlightTargetR);

    this.headlightL.target = this.headlightTargetL;
    this.headlightR.target = this.headlightTargetR;

    // 5. Dual Taillight Points (Red glow behind car casting red reflections on road)
    this.taillightL = new THREE.PointLight(0xE02820, 3.2, 12.0);
    this.taillightR = new THREE.PointLight(0xE02820, 3.2, 12.0);
    this.scene.add(this.taillightL);
    this.scene.add(this.taillightR);
  }

  setupValleyCity() {
    // Distant valley floor city lights (scattered twinkling sodium & fluorescent lights far below)
    const count = 350;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const amber = new THREE.Color(0xF2B451);
    const cyan = new THREE.Color(0x6AD8E8);
    const white = new THREE.Color(0xFAF4E6);

    for (let i = 0; i < count; i++) {
      // Valley position far to the East/South at elevation -50 to 50m
      positions[i * 3 + 0] = (Math.random() - 0.5) * 1200 + 350;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 1800 + 400;
      positions[i * 3 + 2] = Math.random() * 40 - 20;

      const pick = Math.random();
      const col = pick < 0.65 ? amber : (pick < 0.85 ? cyan : white);
      colors[i * 3 + 0] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 4.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });

    this.valleyCityPoints = new THREE.Points(geometry, material);
    this.scene.add(this.valleyCityPoints);
  }

  setWeather(weatherName) {
    // Garage nulls fog for clear car reads; recreate before tinting
    if (!this.scene.fog) {
      this.scene.fog = new THREE.FogExp2(0x0C1822, 0.0035);
    }
    if (weatherName === "rainy_night") {
      this.hemiLight.color.setHex(0x0C1820);
      this.hemiLight.intensity = 0.45;
      this.moonLight.intensity = 0.40;
      this.scene.fog.color.setHex(0x060C10);
      this.scene.fog.density = 0.010;
      this.renderer.toneMappingExposure = 1.0;
    } else if (weatherName === "dawn_mist") {
      this.hemiLight.color.setHex(0x283845);
      this.hemiLight.groundColor.setHex(0x181A1C);
      this.hemiLight.intensity = 0.75;
      this.moonLight.color.setHex(0xF0C090);
      this.moonLight.intensity = 0.95;
      this.scene.fog.color.setHex(0x1A2830);
      this.scene.fog.density = 0.0085;
      this.renderer.toneMappingExposure = 1.20;
    } else {
      // Midnight (Default)
      this.hemiLight.color.setHex(0x4E738A);
      this.hemiLight.groundColor.setHex(0x1A2630);
      this.hemiLight.intensity = 1.65;
      this.moonLight.color.setHex(0xA8D4F0);
      this.moonLight.intensity = 1.85;
      this.scene.fog.color.setHex(0x0B1620);
      this.scene.fog.density = 0.0038;
      this.renderer.toneMappingExposure = 1.15;
    }
  }

  updateCarLights(carPos, carHeading, isBraking = false) {
    // Forward and Right vectors
    const fwX = Math.sin(carHeading);
    const fwY = Math.cos(carHeading);
    const rtX = Math.cos(carHeading);
    const rtY = -Math.sin(carHeading);

    // Keep sky dome and moon anchored to the pass horizon relative to the player
    if (this.skyMesh) {
      this.skyMesh.position.set(carPos.x, carPos.y, carPos.z);
    }
    if (this.moonSprite) {
      this.moonSprite.position.set(
        carPos.x + fwX * 165.0 - rtX * 26.0,
        carPos.y + fwY * 165.0 - rtY * 26.0,
        carPos.z + 34.0
      );
    }

    // Headlights mount position (at front bumper)
    const hlDist = 1.95;
    const hlSpread = 0.55;
    const hlZ = carPos.z + 0.68;

    this.headlightL.position.set(
      carPos.x + fwX * hlDist - rtX * hlSpread,
      carPos.y + fwY * hlDist - rtY * hlSpread,
      hlZ
    );
    this.headlightR.position.set(
      carPos.x + fwX * hlDist + rtX * hlSpread,
      carPos.y + fwY * hlDist + rtY * hlSpread,
      hlZ
    );

    // Target 45m ahead down on road
    const targetDist = 45.0;
    this.headlightTargetL.position.set(
      carPos.x + fwX * targetDist - rtX * 0.8,
      carPos.y + fwY * targetDist - rtY * 0.8,
      carPos.z - 2.5
    );
    this.headlightTargetR.position.set(
      carPos.x + fwX * targetDist + rtX * 0.8,
      carPos.y + fwY * targetDist + rtY * 0.8,
      carPos.z - 2.5
    );
    this.headlightTargetL.updateMatrixWorld();
    this.headlightTargetR.updateMatrixWorld();

    // Taillights mount position
    const tlDist = -1.95;
    const tlSpread = 0.55;
    const tlZ = carPos.z + 0.62;

    this.taillightL.position.set(
      carPos.x + fwX * tlDist - rtX * tlSpread,
      carPos.y + fwY * tlDist - rtY * tlSpread,
      tlZ
    );
    this.taillightR.position.set(
      carPos.x + fwX * tlDist + rtX * tlSpread,
      carPos.y + fwY * tlDist + rtY * tlSpread,
      tlZ
    );

    // Intensify taillights when braking
    const tlIntensity = isBraking ? 6.5 : 2.5;
    this.taillightL.intensity = tlIntensity;
    this.taillightR.intensity = tlIntensity;
  }

  setGarageMode(isGarage) {
    if (this.valleyCityPoints) {
      this.valleyCityPoints.visible = !isGarage;
    }
    if (this.skyMesh) {
      this.skyMesh.visible = !isGarage;
    }
    if (this.moonSprite) {
      this.moonSprite.visible = !isGarage;
    }
    if (this.headlightL) this.headlightL.visible = !isGarage;
    if (this.headlightR) this.headlightR.visible = !isGarage;
    if (this.taillightL) this.taillightL.visible = !isGarage;
    if (this.taillightR) this.taillightR.visible = !isGarage;
  }
}
