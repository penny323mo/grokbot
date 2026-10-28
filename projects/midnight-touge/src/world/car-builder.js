// 3D Car Model Loader & Visual Rig for Midnight Touge (《夜峠》)
import * as THREE from '../../libs/three.module.js';
import { GLTFLoader } from '../../libs/GLTFLoader.js';

export class CarBuilder {
  constructor(scene) {
    this.scene = scene;
    this.loader = new GLTFLoader();
    this.loadedModels = {};
  }

  async loadCarModel(carData, colorHex = null) {
    const carId = carData.id;
    let modelGroup = new THREE.Group();

    try {
      const gltf = await this.loadGLTF(carData.modelPath);
      const root = gltf.scene.clone();
      // Blender GLTF export transforms Z-up to Y-up. Rotate +90deg around X to restore Z-up
      root.rotation.x = Math.PI / 2;
      modelGroup.add(root);

      // Apply custom paint color
      if (colorHex) {
        this.applyPaintColor(root, colorHex);
      }
    } catch (e) {
      console.warn(`Failed to load ${carData.modelPath}, falling back to procedural model:`, e);
      const proceduralCar = this.createProceduralCar(carId, colorHex || "#F2F4F8");
      modelGroup.add(proceduralCar);
    }

    // Cache wheel references for steering and rolling
    const wheels = [];
    modelGroup.traverse(child => {
      if (child.name && (child.name.includes("Wheel") || child.name.includes("Rim") || child.name.includes("Tire"))) {
        wheels.push(child);
      }
    });

    return {
      group: modelGroup,
      wheels,
      updatePose: (pos, heading, steerAngle, rollRad, pitchRad, speedKmh) => {
        modelGroup.position.set(pos.x, pos.y, pos.z);
        // Heading is clockwise in vehicle physics; in right-handed Z-up: rotation.z = -heading
        modelGroup.rotation.set(pitchRad, rollRad, -heading, 'ZYX');

        // Spin wheels based on forward motion
        const wheelRot = (speedKmh / 3.6) * 0.05;
        wheels.forEach(w => {
          w.rotation.x += wheelRot;
          if (w.name.includes("FL") || w.name.includes("FR")) {
            // Front steer angle
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
      if (child.isMesh && child.material) {
        const matName = child.material.name || "";
        if (matName.includes("WhitePaint") || matName.includes("TealPaint") || matName.includes("RedPaint")) {
          child.material = child.material.clone();
          child.material.color.copy(col);
        }
      }
    });
  }

  createProceduralCar(carId, colorHex) {
    const group = new THREE.Group();
    const col = new THREE.Color(colorHex);

    // Body chassis
    const bodyGeo = new THREE.BoxGeometry(1.68, 4.15, 0.55);
    const bodyMat = new THREE.MeshStandardMaterial({ color: col, metalness: 0.5, roughness: 0.2 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 0, 0.45);
    group.add(body);

    // Cabin glass
    const cabGeo = new THREE.BoxGeometry(1.42, 2.1, 0.42);
    const cabMat = new THREE.MeshStandardMaterial({ color: 0x11161C, roughness: 0.1 });
    const cab = new THREE.Mesh(cabGeo, cabMat);
    cab.position.set(0, -0.2, 0.82);
    group.add(cab);

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.22, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 0.8 });
    const wheelPositions = [
      { name: "Wheel_FL", pos: [-0.85, 1.25, 0.32] },
      { name: "Wheel_FR", pos: [0.85, 1.25, 0.32] },
      { name: "Wheel_RL", pos: [-0.85, -1.25, 0.32] },
      { name: "Wheel_RR", pos: [0.85, -1.25, 0.32] }
    ];

    wheelPositions.forEach(wp => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.name = wp.name;
      w.position.set(...wp.pos);
      w.rotation.z = Math.PI / 2;
      group.add(w);
    });

    return group;
  }
}
