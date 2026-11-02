import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
const MODEL = 'assets/models/';

const FILES = {
  soldier: `${MODEL}soldier.glb`,
  rifle: `${MODEL}rifle.glb`,
  tank: `${MODEL}tank.glb`,
  pineA: `${MODEL}pine-a.glb`,
  pineB: `${MODEL}pine-b.glb`,
  rockA: `${MODEL}rock-a.glb`,
  rockB: `${MODEL}rock-b.glb`,
  bags: `${MODEL}sandbags.glb`,
  fence: `${MODEL}fence.glb`,
  fort: `${MODEL}fence-fort.glb`,
  tower: `${MODEL}hq-tower.glb`,
  bunker: `${MODEL}bunker.glb`,
  roof: `${MODEL}bunker-roof.glb`,
  wall: `${MODEL}bunker-wall.glb`,
  radar: `${MODEL}radar.glb`,
};

const _box = new THREE.Box3();
const _size = new THREE.Vector3();
const _v = new THREE.Vector3();
const _bind = new THREE.Vector4();
const _acc = new THREE.Vector4();
const _bone = new THREE.Matrix4();

function loader() {
  return new GLTFLoader();
}

function loadOne(file) {
  return loader().loadAsync(file);
}

/** Arms-down bake. The rig's rest pose is a T. rotateX(-1.65) drops both hands to the hip. */
function poseSoldier(root) {
  root.traverse((obj) => {
    if (obj.name === 'UpperArmL' || obj.name === 'UpperArmR') obj.rotateX(-1.65);
  });
  root.updateMatrixWorld(true);
}

function findNamed(root, name) {
  let found = null;
  root.traverse((obj) => {
    if (obj.name === name) found = obj;
  });
  return found;
}

function bakeSkinned(mesh) {
  const src = mesh.geometry;
  const pos = src.getAttribute('position');
  const skinIndex = src.getAttribute('skinIndex');
  const skinWeight = src.getAttribute('skinWeight');
  mesh.skeleton.update();
  const bones = mesh.skeleton.boneMatrices;
  const out = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    _bind.set(pos.getX(i), pos.getY(i), pos.getZ(i), 1).applyMatrix4(mesh.bindMatrix);
    _acc.set(0, 0, 0, 0);
    for (let k = 0; k < 4; k++) {
      const w = skinWeight.getComponent(i, k);
      if (!w) continue;
      const bone = Math.round(skinIndex.getComponent(i, k));
      _bone.fromArray(bones, bone * 16);
      const p = _bind.clone().applyMatrix4(_bone);
      _acc.addScaledVector(p, w);
    }
    _acc.applyMatrix4(mesh.bindMatrixInverse);
    _acc.applyMatrix4(mesh.matrixWorld);
    out[i * 3] = _acc.x;
    out[i * 3 + 1] = _acc.y;
    out[i * 3 + 2] = _acc.z;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(out, 3));
  if (src.getIndex()) geo.setIndex(src.getIndex().clone());
  return geo;
}

function colorize(geo, hex) {
  const pos = geo.getAttribute('position');
  const colors = new Float32Array(pos.count * 3);
  const tone = new THREE.Color(hex);
  for (let i = 0; i < pos.count; i++) {
    colors[i * 3] = tone.r;
    colors[i * 3 + 1] = tone.g;
    colors[i * 3 + 2] = tone.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geo;
}

/** mergeGeometries rejects mixed normals, uvs, and index layouts. Keep position and color only. */
function posColor(geo, hex) {
  const src = geo.getIndex() ? geo.toNonIndexed() : geo;
  const next = new THREE.BufferGeometry();
  next.setAttribute('position', src.getAttribute('position').clone());
  return colorize(next, hex);
}

function staticParts(root) {
  const parts = [];
  root.updateMatrixWorld(true);
  root.traverse((obj) => {
    if (!obj.isMesh || obj.isSkinnedMesh) return;
    const geo = obj.geometry.clone();
    geo.applyMatrix4(obj.matrixWorld);
    parts.push(geo);
  });
  return parts;
}

/**
 * Swat body faces +Z in the glTF (Blender −Y through the armature's −90° X).
 * The crowd yaw aims local −Z, so the baked figure turns 180° after the rifle is attached.
 * Rifle long axis on the source file is +X; rotateY(−π/2) lays it along +Z, out of the hand.
 */
function buildSoldier(soldierRoot, rifleRoot) {
  poseSoldier(soldierRoot);
  const parts = [];
  soldierRoot.traverse((obj) => {
    if (!obj.isSkinnedMesh) return;
    const geo = bakeSkinned(obj);
    const name = obj.name || (obj.parent && obj.parent.name) || '';
    const tone = name.includes('Head') ? 0.78 : 1;
    parts.push(posColor(geo, new THREE.Color(tone, tone, tone).getHex()));
  });
  const rifleParts = staticParts(rifleRoot).map((geo) => posColor(geo, 0xffffff));
  const rifle = mergeGeometries(rifleParts);
  rifle.computeBoundingBox();
  rifle.rotateY(-Math.PI / 2);
  rifle.computeBoundingBox();
  const rifleSize = rifle.boundingBox.getSize(_size);
  const rifleScale = 0.72 / Math.max(rifleSize.z, 0.001);
  rifle.scale(rifleScale * 2.2, rifleScale * 1.7, rifleScale);
  rifle.rotateY(0.55);
  rifle.computeBoundingBox();
  const hand = findNamed(soldierRoot, 'HandR');
  hand.getWorldPosition(_v);
  rifle.translate(
    _v.x - (rifle.boundingBox.min.x + rifle.boundingBox.max.x) * 0.5,
    _v.y - (rifle.boundingBox.min.y + rifle.boundingBox.max.y) * 0.5,
    _v.z - rifle.boundingBox.min.z,
  );
  parts.push(colorize(rifle, 0x1a1c18));
  const merged = mergeGeometries(parts);
  merged.rotateY(Math.PI);
  merged.computeBoundingBox();
  const box = merged.boundingBox;
  const height = Math.max(0.001, box.max.y - box.min.y);
  const fit = 1 / height;
  merged.scale(fit, fit, fit);
  merged.computeBoundingBox();
  const fitted = merged.boundingBox;
  const cx = (fitted.min.x + fitted.max.x) * 0.5;
  const cz = (fitted.min.z + fitted.max.z) * 0.5;
  merged.translate(-cx, -fitted.min.y, -cz);
  merged.computeVertexNormals();
  return merged;
}

function preparedGeometry(root, tint, strength = 0.45, gain = 1) {
  root.updateMatrixWorld(true);
  const parts = [];
  root.traverse((obj) => {
    if (!obj.isMesh) return;
    const geo = obj.geometry.clone();
    geo.applyMatrix4(obj.matrixWorld);
    const mat = Array.isArray(obj.material) ? obj.material[0] : obj.material;
    const color = mat && mat.color ? mat.color.clone() : new THREE.Color(0xffffff);
    const lum = color.r * 0.2126 + color.g * 0.7152 + color.b * 0.0722;
    if (tint && lum >= 0.25) color.lerp(new THREE.Color(tint), strength);
    // Pines pass a gain under 1. The sun at 3.5 lifts a 0x142016 lerp back to cartoon green.
    if (gain !== 1) color.multiplyScalar(gain);
    parts.push(posColor(geo, color.getHex()));
  });
  const geo = mergeGeometries(parts);
  geo.computeVertexNormals();
  geo.computeBoundingBox();
  const box = geo.boundingBox;
  const h = Math.max(0.001, box.max.y - box.min.y);
  geo.scale(1 / h, 1 / h, 1 / h);
  geo.computeBoundingBox();
  const fitted = geo.boundingBox;
  geo.translate(
    -(fitted.min.x + fitted.max.x) * 0.5,
    -fitted.min.y,
    -(fitted.min.z + fitted.max.z) * 0.5,
  );
  return geo;
}

function concreteMaterial(hex) {
  return new THREE.MeshStandardMaterial({ color: hex, roughness: 0.9, metalness: 0.02 });
}

function repaint(root, material, cast = false) {
  root.traverse((obj) => {
    if (!obj.isMesh) return;
    obj.material = material;
    obj.castShadow = cast;
    obj.receiveShadow = true;
  });
}

/** Downward faces go darker so a single olive does not read as flat plastic. */
function shadeMesh(geo, hex) {
  const pos = geo.attributes.position;
  const norm = geo.attributes.normal;
  const colors = new Float32Array(pos.count * 3);
  const base = new THREE.Color(hex);
  const tone = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const ny = norm ? norm.getY(i) : 0.5;
    const shade = 0.55 + 0.45 * Math.max(0, Math.min(1, ny * 0.5 + 0.5));
    tone.copy(base).multiplyScalar(shade);
    colors[i * 3] = tone.r;
    colors[i * 3 + 1] = tone.g;
    colors[i * 3 + 2] = tone.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geo;
}

function ownMaterials(root) {
  root.traverse((obj) => {
    if (!obj.isMesh || !obj.material) return;
    const list = Array.isArray(obj.material) ? obj.material : [obj.material];
    const next = list.map((mat) => {
      const copy = mat.clone();
      copy.roughness = Math.max(copy.roughness || 0, 0.72);
      copy.metalness = Math.min(copy.metalness || 0, 0.12);
      return copy;
    });
    obj.material = Array.isArray(obj.material) ? next : next[0];
    obj.castShadow = false;
    obj.receiveShadow = true;
  });
}

function detach(root) {
  root.traverse((obj) => {
    if (obj.geometry) obj.geometry = obj.geometry.clone();
    if (!obj.material) return;
    obj.material = Array.isArray(obj.material) ? obj.material.map((mat) => mat.clone()) : obj.material.clone();
  });
}

function fitHeight(object, parent, worldHeight, maxSpan) {
  parent.add(object);
  object.position.set(0, 0, 0);
  object.rotation.set(0, 0, 0);
  object.scale.set(1, 1, 1);
  parent.updateWorldMatrix(true, true);
  _box.setFromObject(object);
  const h = Math.max(0.001, _box.max.y - _box.min.y);
  const span = Math.max(0.001, _box.max.x - _box.min.x, _box.max.z - _box.min.z);
  let next = worldHeight / h;
  if (maxSpan && span * next > maxSpan) next = maxSpan / span;
  object.scale.setScalar(next);
  parent.updateWorldMatrix(true, true);
  _box.setFromObject(object);
  const parentY = parent.getWorldPosition(_v).y;
  const parentScale = parent.getWorldScale(new THREE.Vector3()).y || 1;
  object.position.y += (parentY - _box.min.y) / parentScale;
}

function keepMesh(obj) {
  let node = obj;
  while (node) {
    if (node.userData && node.userData.flutter) return true;
    node = node.parent;
  }
  return false;
}

function hidePrimitives(group) {
  const pip = group.userData.pip;
  const ring = group.userData.dangerRing;
  group.traverse((obj) => {
    if (!obj.isMesh || keepMesh(obj)) return;
    if (obj === pip || obj === ring) return;
    obj.visible = false;
  });
}

function scatter(parent, geometry, spots, material, yaw, cast = false) {
  if (!geometry || !spots.length) return;
  const geo = geometry.clone();
  const matCopy = material.clone();
  const mesh = new THREE.InstancedMesh(geo, matCopy, spots.length);
  mesh.castShadow = cast;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  const dummy = new THREE.Object3D();
  for (let i = 0; i < spots.length; i++) {
    const spot = spots[i];
    dummy.position.set(spot.x, 0, spot.z);
    dummy.rotation.set(0, yaw ? yaw(i, spot) : 0, 0);
    dummy.scale.setScalar(spot.s);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  parent.add(mesh);
}

function frameOf(obj) {
  obj.updateWorldMatrix(true, true);
  const origin = new THREE.Vector3();
  const scale = new THREE.Vector3();
  obj.getWorldPosition(origin);
  obj.getWorldScale(scale);
  return { origin, scale };
}

/** Move the mesh so its lowest world point sits at worldY. */
function setFeetWorldY(object, parent, worldY) {
  parent.updateWorldMatrix(true, true);
  _box.setFromObject(object);
  const frame = frameOf(parent);
  const sy = frame.scale.y || 1;
  object.position.y += (worldY - _box.min.y) / sy;
}

function reseatFeet(object, parent) {
  parent.updateWorldMatrix(true, true);
  _box.setFromObject(object);
  const frame = frameOf(parent);
  const sy = frame.scale.y || 1;
  object.position.y += (frame.origin.y - _box.min.y) / sy;
}

function seatFlag(group, worldY) {
  const frame = frameOf(group);
  const sy = frame.scale.y || 1;
  group.traverse((obj) => {
    if (!obj.userData || !obj.userData.flutter) return;
    obj.position.y = (worldY - frame.origin.y) / sy + 0.12 / sy;
  });
}

/**
 * Quaternius tanks leave Blender facing +Z after the armature's −90° X.
 * Measure the gun against the hull and yaw until that axis is the parent's −Z,
 * the same forward the building and the crowd use.
 */
function bakeProp(root) {
  root.updateMatrixWorld(true);
  const parts = [];
  root.traverse((obj) => {
    if (obj.isSkinnedMesh) {
      obj.skeleton.update();
      parts.push(bakeSkinned(obj));
    } else if (obj.isMesh) {
      const geo = obj.geometry.clone();
      geo.applyMatrix4(obj.matrixWorld);
      parts.push(geo);
    }
  });
  const cleaned = [];
  for (let i = 0; i < parts.length; i++) {
    const src = parts[i].getIndex() ? parts[i].toNonIndexed() : parts[i];
    const next = new THREE.BufferGeometry();
    next.setAttribute('position', src.getAttribute('position').clone());
    cleaned.push(next);
  }
  const merged = mergeGeometries(cleaned);
  if (!merged) return null;
  merged.computeBoundingBox();
  const size = merged.boundingBox.getSize(new THREE.Vector3());
  if (size.x > size.z) merged.rotateY(Math.PI / 2);
  merged.computeVertexNormals();
  return merged;
}

function aimTankForward(tank) {
  let gun = null;
  let body = null;
  tank.traverse((obj) => {
    if (!obj.isMesh) return;
    if (obj.name === 'Tank_Gun') gun = obj;
    if (obj.name === 'Tank_body') body = obj;
  });
  if (!gun || !body || !tank.parent) return;
  tank.updateWorldMatrix(true, true);
  const dir = new THREE.Box3().setFromObject(gun).getCenter(new THREE.Vector3());
  dir.sub(new THREE.Box3().setFromObject(body).getCenter(new THREE.Vector3()));
  const inv = tank.parent.getWorldQuaternion(new THREE.Quaternion()).invert();
  dir.applyQuaternion(inv);
  dir.y = 0;
  if (dir.lengthSq() < 1e-8) return;
  const current = Math.atan2(dir.x, dir.z);
  const want = Math.atan2(0, -1);
  tank.rotation.y += want - current;
}

function ringBags(parent, template, radius, count) {
  for (let i = 0; i < count; i++) {
    const bag = template.clone(true);
    detach(bag);
    const a = (i / count) * Math.PI * 2;
    fitHeight(bag, parent, 0.32, 0.52);
    bag.traverse((obj) => {
      if (!obj.isMesh || !obj.material || !obj.material.color) return;
      obj.material.color.set(0xc4a36a);
      obj.material.roughness = 0.92;
      obj.material.metalness = 0;
      obj.castShadow = true;
      obj.receiveShadow = true;
    });
    bag.position.x += Math.cos(a) * radius;
    bag.position.z += Math.sin(a) * radius;
    bag.rotation.y = a;
  }
}

function dressBuilding(group, kit) {
  hidePrimitives(group);
  const enemy = group.userData.owner === 'enemy';
  const hq = group.userData.kind === 'hq';
  if (hq && enemy && kit.tower) {
    const tower = kit.tower.clone(true);
    detach(tower);
    repaint(tower, concreteMaterial(0x9a958c), true);
    fitHeight(tower, group, 3.15, 1.45);
    group.updateWorldMatrix(true, true);
    _box.setFromObject(tower);
    const foot = _box.min.y;
    const top = _box.max.y;
    const halfW = Math.max(0.25, (_box.max.x - _box.min.x) * 0.5);
    const bandMat = new THREE.MeshStandardMaterial({
      color: 0xd24a3c,
      emissive: 0x8a221c,
      emissiveIntensity: 0.4,
      roughness: 0.55,
      metalness: 0.04,
    });
    const sx = frameOf(group).scale.x || 1;
    for (const frac of [0.34, 0.68]) {
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.09, 20), bandMat);
      band.scale.setScalar((halfW * 1.2) / (0.5 * sx));
      band.castShadow = true;
      band.receiveShadow = true;
      group.add(band);
      setFeetWorldY(band, group, foot + (top - foot) * frac);
    }
    if (kit.radar) {
      const dish = kit.radar.clone(true);
      detach(dish);
      ownMaterials(dish);
      fitHeight(dish, group, 0.9, 1.25);
      setFeetWorldY(dish, group, top - 0.04);
    }
    const wallSrc = kit.wall || kit.fort;
    if (wallSrc) {
      // Parent local −Z is the building forward (yawForFacing). The gap faces the road.
      const wallCount = 20;
      const radius = 1.62 / sx;
      const gate = 0.48;
      const wallMat = concreteMaterial(0x5e5a54);
      const trimMat = new THREE.MeshStandardMaterial({
        color: 0x8e1c1c,
        emissive: 0x3a1010,
        emissiveIntensity: 0.12,
        roughness: 0.7,
        metalness: 0.02,
      });
      for (let i = 0; i < wallCount; i++) {
        const a = -Math.PI / 2 + (i / wallCount) * Math.PI * 2;
        const gap = Math.abs(Math.atan2(Math.sin(a + Math.PI / 2), Math.cos(a + Math.PI / 2)));
        if (gap < gate) continue;
        const wall = new THREE.Mesh(
          new THREE.BoxGeometry(1.05 / sx, 0.58 / sx, 0.22 / sx),
          wallMat,
        );
        wall.position.set(Math.cos(a) * radius, 0.29 / sx, Math.sin(a) * radius);
        wall.rotation.y = a + Math.PI / 2;
        wall.castShadow = true;
        wall.receiveShadow = true;
        group.add(wall);
        const trim = new THREE.Mesh(
          new THREE.BoxGeometry(1.05 / sx, 0.035 / sx, 0.16 / sx),
          trimMat,
        );
        trim.position.set(wall.position.x, wall.position.y + 0.27 / sx, wall.position.z);
        trim.rotation.y = wall.rotation.y;
        trim.castShadow = true;
        trim.receiveShadow = true;
        group.add(trim);
      }
      for (const side of [-1, 1]) {
        const a = -Math.PI / 2 + side * gate;
        const post = new THREE.Mesh(
          new THREE.BoxGeometry(0.16 / sx, 0.7 / sx, 0.16 / sx),
          wallMat,
        );
        post.position.set(Math.cos(a) * radius, 0.35 / sx, Math.sin(a) * radius);
        post.castShadow = true;
        post.receiveShadow = true;
        group.add(post);
      }
      const gateZ = -radius;
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025 / sx, 0.025 / sx, 0.95 / sx, 6),
        concreteMaterial(0x3e3a34),
      );
      pole.position.set(-0.15 / sx, 0.48 / sx, gateZ - 0.08 / sx);
      pole.castShadow = true;
      group.add(pole);
      const cloth = new THREE.Mesh(
        new THREE.PlaneGeometry(0.95 / sx, 0.55 / sx),
        new THREE.MeshStandardMaterial({
          color: 0x8e1c1c,
          emissive: 0x4a1010,
          emissiveIntensity: 0.18,
          side: THREE.DoubleSide,
          roughness: 0.7,
        }),
      );
      cloth.position.set(0.28 / sx, 0.72 / sx, gateZ - 0.08 / sx);
      cloth.rotation.y = Math.PI - 0.55;
      cloth.castShadow = true;
      group.add(cloth);
    }
    seatFlag(group, top + 0.02);
    return;
  }
  if (!kit.bunker || !kit.roof) return;
  const body = kit.bunker.clone(true);
  detach(body);
  repaint(body, concreteMaterial(enemy ? 0x8a847c : 0x7f8a72), true);
  fitHeight(body, group, hq ? 0.85 : 0.68, hq ? 1.7 : 1.35);
  group.updateWorldMatrix(true, true);
  _box.setFromObject(body);
  const bodyTop = _box.max.y;
  const bodySpan = Math.max(_box.max.x - _box.min.x, _box.max.z - _box.min.z);
  const roof = kit.roof.clone(true);
  detach(roof);
  repaint(roof, concreteMaterial(enemy ? 0x8e2c26 : 0x2f8a48));
  fitHeight(roof, group, 0.42, bodySpan * 1.05);
  setFeetWorldY(roof, group, bodyTop - 0.04);
  const bagRadius = (bodySpan * 0.55 + 0.28) / (frameOf(group).scale.x || 1);
  if (kit.bags) ringBags(group, kit.bags, bagRadius, hq ? 9 : 7);
  let flagY = bodyTop + 0.16;
  if (!enemy && hq && kit.tank) {
    if (!kit.tankGeo) kit.tankGeo = bakeProp(kit.tank);
    if (kit.tankGeo) {
      const tank = new THREE.Mesh(shadeMesh(kit.tankGeo.clone(), 0x4e5a34), new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.82,
        metalness: 0.08,
        vertexColors: true,
      }));
      tank.castShadow = true;
      tank.receiveShadow = true;
      tank.frustumCulled = false;
      fitHeight(tank, group, 0.72, 1.9);
      group.updateWorldMatrix(true, true);
      const want = new THREE.Vector3(1.7, 0, 4.35);
      group.worldToLocal(want);
      tank.position.x = want.x;
      tank.position.z = want.z;
      reseatFeet(tank, group);
    }
  }
  seatFlag(group, flagY);
}

function dressIsland(group, kit) {
  if (group.userData.assetDress) return;
  group.userData.assetDress = true;
  const flora = group.userData.flora || [];
  for (let i = 0; i < flora.length; i++) flora[i].visible = false;
  const trees = [];
  const corners = [
    [-8.6, 6.4, 1.2], [-7.7, 7.2, 1.05], [-8.9, 5.1, 0.95],
    [8.5, 6.6, 1.15], [7.6, 7.3, 1.0], [9.0, 5.2, 0.9],
    [-8.7, -6.2, 1.1], [-7.5, -7.1, 0.95],
    [8.6, -6.0, 1.1], [7.4, -6.9, 0.92],
    [-5.4, 8.8, 1.05], [5.2, 8.7, 1.0],
    [-5.2, -8.6, 1.0], [5.4, -8.5, 0.95],
  ];
  for (let i = 0; i < corners.length; i++) {
    trees.push({ x: corners[i][0], z: corners[i][1], s: corners[i][2] });
  }
  const pineMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.86, metalness: 0 });
  const rockMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0 });
  const fenceMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.84, metalness: 0 });
  scatter(group, kit.pineA, trees.filter((_, i) => i % 2 === 0).map((spot) => ({ x: spot.x, z: spot.z, s: 1.15 + spot.s * 0.18 })), pineMat, (i) => i * 0.7, true);
  scatter(group, kit.pineB, trees.filter((_, i) => i % 2 === 1).map((spot) => ({ x: spot.x, z: spot.z, s: 1.05 + spot.s * 0.16 })), pineMat, (i) => i * 0.9, true);
  const rocks = (group.userData.rockSpots || []).filter((spot) => Math.abs(spot.x) > 6.2 || Math.abs(spot.z) > 6.5);
  scatter(group, kit.rockA, rocks.filter((_, i) => i % 2 === 0).map((spot) => ({ x: spot.x, z: spot.z, s: 0.28 + spot.s * 0.12 })), rockMat);
  scatter(group, kit.rockB, rocks.filter((_, i) => i % 2 === 1).map((spot) => ({ x: spot.x, z: spot.z, s: 0.32 + spot.s * 0.1 })), rockMat);
  const nest = corners.map((c, i) => ({
    x: c[0] + (i % 2 ? 0.45 : -0.4),
    z: c[1] + (i % 3 ? 0.35 : -0.3),
    s: 0.34 + (i % 3) * 0.08,
  }));
  scatter(group, kit.rockA, nest.filter((_, i) => i % 2 === 0), rockMat);
  scatter(group, kit.rockB, nest.filter((_, i) => i % 2 === 1), rockMat);
  const pebblesA = [];
  const pebblesB = [];
  for (let i = 0; i < 36; i++) {
    const x = Math.sin(i * 12.9898) * 6.8;
    const z = Math.cos(i * 78.233) * 7.6;
    if (Math.abs(z) < 0.9) continue;
    if (Math.abs(x) < 1.5 && Math.abs(z) < 2.6) continue;
    const spot = { x, z, s: 0.22 + (i % 4) * 0.05 };
    if (i % 2 === 0) pebblesA.push(spot);
    else pebblesB.push(spot);
  }
  scatter(group, kit.rockA, pebblesA, rockMat);
  scatter(group, kit.rockB, pebblesB, rockMat);
  const fences = [
    { x: -7.2, z: 2.4, s: 1.15, y: 0.4 },
    { x: -7.4, z: -2.2, s: 1.15, y: 0.2 },
    { x: 7.3, z: 2.6, s: 1.15, y: Math.PI },
    { x: 7.1, z: -1.8, s: 1.15, y: Math.PI },
    { x: -3.6, z: 8.4, s: 1.05, y: Math.PI / 2 },
    { x: 3.4, z: -8.2, s: 1.05, y: Math.PI / 2 },
  ];
  scatter(group, kit.fence, fences.map((spot) => ({ x: spot.x, z: spot.z, s: spot.s, y: spot.y })), fenceMat, (i, spot) => spot.y || 0);
  const buildings = group.userData.buildings;
  if (!buildings) return;
  buildings.forEach((building) => dressBuilding(building, kit));
}

export function loadBattlefield(world, crowds) {
  const pending = (async () => {
    const entries = await Promise.all(Object.entries(FILES).map(async ([key, url]) => {
      try {
        const gltf = await loadOne(url);
        return [key, gltf];
      } catch (err) {
        console.warn('model failed', url, err);
        return [key, null];
      }
    }));
    const gltf = Object.fromEntries(entries);
    const required = ['soldier', 'rifle', 'tank', 'pineA', 'pineB', 'rockA', 'rockB', 'bags', 'fence', 'fort', 'tower', 'bunker', 'roof', 'wall'];
    for (let i = 0; i < required.length; i++) {
      if (!gltf[required[i]]) throw new Error(`model missing ${required[i]}`);
    }
    const soldier = buildSoldier(gltf.soldier.scene, gltf.rifle.scene);
    crowds.useSoldier(soldier);
    const kit = {
      tower: gltf.tower.scene,
      bunker: gltf.bunker.scene,
      roof: gltf.roof.scene,
      wall: gltf.wall.scene,
      fort: gltf.fort.scene,
      bags: gltf.bags.scene,
      tank: gltf.tank.scene,
      radar: gltf.radar ? gltf.radar.scene : null,
      pineA: preparedGeometry(gltf.pineA.scene, 0x142016, 0.94, 0.35),
      pineB: preparedGeometry(gltf.pineB.scene, 0x101810, 0.96, 0.35),
      rockA: preparedGeometry(gltf.rockA.scene, 0x6a6560),
      rockB: preparedGeometry(gltf.rockB.scene, 0x746e68),
      fence: preparedGeometry(gltf.fence.scene, 0x6a5340),
    };
    world.setDresser((group) => dressIsland(group, kit));
    return true;
  })();
  return pending;
}
