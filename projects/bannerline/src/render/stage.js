import * as THREE from 'three';
import { PALETTE } from './palette.js';

/**
 * Fixed diorama camera on the +z side, looking toward −z (enemy / top of the portrait).
 * Screen-right is world +x. camera.up stays (0, 1, 0); the view is angled, not straight down.
 */
export function frameDioramaCamera(camera, aspect) {
  // Whole island in the 390×844 play frame. Screen-right is world +x:
  // camera sits on +z, up is +y, look is toward −z.
  camera.fov = 44;
  if (Number.isFinite(aspect) && aspect > 0) camera.aspect = aspect;
  camera.position.set(0.16, 11.2, 17.2);
  camera.up.set(0, 1, 0);
  camera.lookAt(0.08, 0.45, 0.2);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
}

/** Menu frame. The home card covers the lower half, so both bases sit above it. */
export function frameHomeCamera(camera, aspect) {
  camera.fov = 46;
  if (Number.isFinite(aspect) && aspect > 0) camera.aspect = aspect;
  camera.position.set(0.1, 8.2, 22);
  camera.up.set(0, 1, 0);
  camera.lookAt(0, 0, 8);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
}

/** Software rasterizers cannot afford a live shadow map. Unknown strings stay on blobs. */
export function rendererIsSoftware(renderer) {
  try {
    const gl = renderer.getContext();
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (!ext) return true;
    const name = `${gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || ''} ${gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) || ''}`;
    if (/swiftshader|llvmpipe|softpipe|software/i.test(name)) return true;
    if (/nvidia|amd|radeon|intel|apple|adreno|mali|powervr/i.test(name)) return false;
    return true;
  } catch {
    return true;
  }
}

export function applyShadowMode(renderer, sun, enabled) {
  renderer.shadowMap.enabled = !!enabled;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  sun.castShadow = !!enabled;
  if (!enabled) return;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 4;
  sun.shadow.camera.far = 42;
  sun.shadow.camera.left = -14;
  sun.shadow.camera.right = 14;
  sun.shadow.camera.top = 14;
  sun.shadow.camera.bottom = -14;
  sun.shadow.bias = -0.0008;
  sun.shadow.normalBias = 0.04;
  sun.shadow.camera.updateProjectionMatrix();
}

export function createStage(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.setClearColor(PALETTE.sky, 1);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(PALETTE.sky, 28, 62);
  scene.background = new THREE.Color(PALETTE.sky);

  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 90);
  frameDioramaCamera(camera);

  scene.add(new THREE.HemisphereLight(0xd4e2ee, 0x3d4c34, 0.5));
  scene.add(new THREE.AmbientLight(0xe7eeea, 0.26));

  const sun = new THREE.DirectionalLight(0xfff1d6, 1.48);
  sun.position.set(-7.5, 18, 9.2);
  sun.target.position.set(0, 0, 0);
  scene.add(sun);
  scene.add(sun.target);

  const software = rendererIsSoftware(renderer);
  let shadowsOn = !software;
  applyShadowMode(renderer, sun, shadowsOn);

  function resize() {
    const w = canvas.clientWidth || 390;
    const h = canvas.clientHeight || 844;
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
  }

  return {
    renderer,
    scene,
    camera,
    sun,
    software,
    get shadowsOn() {
      return shadowsOn;
    },
    setShadows(on) {
      shadowsOn = !!on;
      applyShadowMode(renderer, sun, shadowsOn);
      renderer.shadowMap.needsUpdate = true;
    },
    resize,
  };
}
