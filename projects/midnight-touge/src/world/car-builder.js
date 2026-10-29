// 3D Car Model Loader & Visual Rig for Midnight Touge (《夜峠》)
// Loads Blender-authored GLBs (Wheel_* empties spin/steer). Procedural fallback only if GLB fails.
import * as THREE from '../../libs/three.module.js';
import { GLTFLoader } from '../../libs/GLTFLoader.js';

const WHEEL_EMPTY_RE = /^Wheel_(FL|FR|RL|RR)$/;

export class CarBuilder {
  constructor(scene) {
    this.scene = scene;
    this.loader = new GLTFLoader();
    this.loadedModels = {};
    this.envMap = null;
    this._ensureEnvMap();
  }

  _ensureEnvMap() {
    // Cheap procedural PMREM-like cubemap via Canvas textures → CubeTexture
    // so car paint / chrome catch highlights without an HDR file.
    try {
      const size = 64;
      const faces = [];
      const colors = [
        '#1a3048', '#0c1828', '#2a4060', '#081018', '#3a2818', '#101820'
      ];
      for (let i = 0; i < 6; i++) {
        const c = document.createElement('canvas');
        c.width = c.height = size;
        const ctx = c.getContext('2d');
        const g = ctx.createRadialGradient(size * 0.5, size * 0.35, 2, size * 0.5, size * 0.5, size * 0.7);
        g.addColorStop(0, i < 4 ? '#d8e8ff' : '#ffe0a0');
        g.addColorStop(0.35, colors[i]);
        g.addColorStop(1, '#02060c');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, size, size);
        faces.push(c);
      }
      const cube = new THREE.CubeTexture(faces);
      cube.colorSpace = THREE.SRGBColorSpace;
      cube.needsUpdate = true;
      this.envMap = cube;
      if (this.scene && !this.scene.environment) {
        this.scene.environment = cube;
        if ('environmentIntensity' in this.scene) this.scene.environmentIntensity = 1.25;
      }
    } catch (e) {
      console.warn('CarBuilder envMap failed', e);
    }
  }

  async loadCarModel(carData, colorHex = null) {
    const carId = carData.id;
    let modelGroup = new THREE.Group();
    modelGroup.name = `CarRig_${carId}`;
    let usedProcedural = false;

    try {
      const cacheKey = carData.modelPath;
      let gltf = this.loadedModels[cacheKey];
      if (!gltf) {
        gltf = await this.loadGLTF(carData.modelPath);
        this.loadedModels[cacheKey] = gltf;
      }
      const root = gltf.scene.clone(true);
      // Blender GLTF export is Y-up. Game is Z-up → rotate +90° around X.
      root.rotation.x = Math.PI / 2;
      root.updateMatrixWorld(true);

      root.traverse(child => {
        if (!child.isMesh) return;
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((mat, idx) => {
          if (!mat) return;
          let m = mat.clone();
          // Ensure standard material features for night showroom
          if (m.isMeshStandardMaterial || m.isMeshPhysicalMaterial) {
            if (this.envMap) {
              m.envMap = this.envMap;
              m.envMapIntensity = 1.45;
            }
            // Boost clearcoat on paint-like mats
            const n = (m.name || '').toLowerCase();
            if (n.includes('paint') || n.includes('body') || n.includes('white') || n.includes('teal') || n.includes('red')) {
              if (!m.isMeshPhysicalMaterial) {
                const phys = new THREE.MeshPhysicalMaterial();
                phys.color.copy(m.color);
                phys.metalness = Math.max(m.metalness || 0, 0.22);
                phys.roughness = Math.min(m.roughness ?? 0.3, 0.22);
                phys.envMap = this.envMap || m.envMap;
                phys.envMapIntensity = 1.5;
                phys.clearcoat = 1.0;
                phys.clearcoatRoughness = 0.06;
                phys.name = m.name;
                m = phys;
              } else {
                m.clearcoat = Math.max(m.clearcoat || 0, 1.0);
                m.clearcoatRoughness = 0.06;
                m.metalness = Math.max(m.metalness || 0, 0.22);
                m.roughness = Math.min(m.roughness ?? 0.3, 0.22);
                if (this.envMap) { m.envMap = this.envMap; m.envMapIntensity = 1.5; }
              }
            }
            if (n.includes('glass')) {
              m.transparent = true;
              m.opacity = Math.min(m.opacity ?? 0.45, 0.55);
              m.depthWrite = false;
              m.side = THREE.DoubleSide;
            }
            if (n.includes('hl') || n.includes('tl') || n.includes('am') || (m.emissive && m.emissive.getHex() > 0)) {
              m.emissiveIntensity = Math.max(m.emissiveIntensity || 1, 2.5);
              m.toneMapped = false;
            }
          }
          m.side = m.side === THREE.DoubleSide ? THREE.DoubleSide : THREE.FrontSide;
          m.needsUpdate = true;
          if (Array.isArray(child.material)) child.material[idx] = m;
          else child.material = m;
        });
        child.castShadow = true;
        child.receiveShadow = true;
      });

      modelGroup.add(root);

      if (colorHex) {
        this.applyPaintColor(root, colorHex);
      }
    } catch (e) {
      console.warn(`Failed to load ${carData.modelPath}, falling back to procedural model:`, e);
      usedProcedural = true;
      if (typeof window !== 'undefined') window.__lastCarBuild = { path: carData.modelPath, usedProcedural: true, err: String(e) };
      const proceduralCar = this.createProceduralCar(carId, colorHex || '#F2F4F8');
      modelGroup.add(proceduralCar);
    }

    // Only the four Wheel_* empties — not child meshes — so spin/steer pivots are correct
    const wheelEmpties = [];
    modelGroup.traverse(child => {
      if (child.name && WHEEL_EMPTY_RE.test(child.name)) {
        wheelEmpties.push(child);
      }
    });
    // Fallback: if empties missing (broken GLB), gather any Wheel_FL style groups
    if (wheelEmpties.length === 0) {
      modelGroup.traverse(child => {
        if (child.name && /^Wheel_(FL|FR|RL|RR)/.test(child.name) && child.children.length > 0) {
          wheelEmpties.push(child);
        }
      });
    }

    const spinAxis = usedProcedural ? 'x' : 'x'; // after +90° X, local X still rolls the wheel

    return {
      group: modelGroup,
      wheels: wheelEmpties,
      usedProcedural,
      // diagnostic
      ...(typeof window !== 'undefined' ? (window.__lastCarBuild = { path: carData.modelPath, usedProcedural, at: Date.now() }, {}) : {}),
      updatePose: (pos, heading, steerAngle, rollRad, pitchRad, speedKmh) => {
        modelGroup.position.set(pos.x, pos.y, pos.z);
        modelGroup.rotation.set(pitchRad, rollRad, -heading, 'ZYX');

        const wheelRot = (speedKmh / 3.6) * 0.55 * (1 / 0.31); // ≈ v/r
        wheelEmpties.forEach(w => {
          // Roll around local X (wheel axle after Blender Y-up→Z-up)
          w.rotation.x += wheelRot * (1 / 60);
          if (w.name.includes('FL') || w.name.includes('FR')) {
            w.rotation.z = -steerAngle;
          }
        });
      }
    };
  }

  loadGLTF(path) {
    return new Promise((resolve, reject) => {
      this.loader.load(path, resolve, undefined, reject);
    });
  }

  applyPaintColor(root, colorHex) {
    const col = new THREE.Color(colorHex);
    root.traverse(child => {
      if (!child.isMesh || !child.material) return;
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach((mat, idx) => {
        const matName = mat.name || '';
        if (/^(Paint|WhitePaint|TealPaint|RedPaint)$/i.test(matName) || /^Paint\./i.test(matName)) {
          let m = mat.clone();
          m.color.copy(col);
          m.needsUpdate = true;
          if (Array.isArray(child.material)) child.material[idx] = m;
          else child.material = m;
        }
      });
    });
  }

  createProceduralCar(carId, colorHex) {
    // Last-resort placeholder — should never show if GLBs are present
    const group = new THREE.Group();
    group.name = 'ProceduralFallback';
    const col = new THREE.Color(colorHex);
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.68, 4.15, 0.55),
      new THREE.MeshStandardMaterial({ color: col, metalness: 0.5, roughness: 0.2 })
    );
    body.position.set(0, 0, 0.45);
    group.add(body);
    const cab = new THREE.Mesh(
      new THREE.BoxGeometry(1.42, 2.1, 0.42),
      new THREE.MeshStandardMaterial({ color: 0x11161C, roughness: 0.1 })
    );
    cab.position.set(0, -0.2, 0.82);
    group.add(cab);
    const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.22, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 0.8 });
    [
      { name: 'Wheel_FL', pos: [-0.85, 1.25, 0.32] },
      { name: 'Wheel_FR', pos: [0.85, 1.25, 0.32] },
      { name: 'Wheel_RL', pos: [-0.85, -1.25, 0.32] },
      { name: 'Wheel_RR', pos: [0.85, -1.25, 0.32] }
    ].forEach(wp => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.name = wp.name;
      w.position.set(...wp.pos);
      w.rotation.z = Math.PI / 2;
      group.add(w);
    });
    return group;
  }
}
