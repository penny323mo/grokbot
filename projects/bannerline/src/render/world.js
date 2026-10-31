import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { yawForFacing } from '../sim/facing.js';
import { boxMapZones, frontierFrom } from '../sim/territory.js';
import { PALETTE, ownerPaint } from './palette.js';
import { rocksFor, streamCrossings, treesFor } from './scenery.js';

const UP = new THREE.Vector3(0, 1, 0);
const LOCAL_Z = new THREE.Vector3(0, 0, 1);
const _dir = new THREE.Vector3();

function mat(color, extra = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.72,
    metalness: 0.05,
    ...extra,
  });
}

function exitDir(map, nodeId, out) {
  const nexts = map.graph[nodeId] || [];
  const next = nexts[0];
  const a = map.nodes[nodeId];
  const b = next && map.nodes[next];
  if (!a || !b) {
    out.x = 0;
    out.z = -1;
    return out;
  }
  out.x = b.x - a.x;
  out.z = b.z - a.z;
  return out;
}

function alignLength(mesh, x0, z0, x1, z1, y) {
  const dx = x1 - x0;
  const dz = z1 - z0;
  const len = Math.hypot(dx, dz) || 0.001;
  mesh.scale.set(1, 1, len);
  mesh.position.set((x0 + x1) / 2, y, (z0 + z1) / 2);
  _dir.set(dx / len, 0, dz / len);
  mesh.quaternion.setFromUnitVectors(LOCAL_Z, _dir);
  return len;
}

function pennant(color) {
  const material = mat(color, { roughness: 0.5, side: THREE.DoubleSide });
  const group = new THREE.Group();
  const a = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.24), material);
  const b = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.24), material);
  b.rotation.y = Math.PI / 2;
  a.userData.slot = 'flag';
  b.userData.slot = 'flag';
  group.add(a, b);
  group.userData.flutter = true;
  return group;
}

function makePip(radius) {
  const pip = new THREE.Mesh(
    new THREE.TorusGeometry(radius, 0.04, 6, 24),
    new THREE.MeshBasicMaterial({ color: PALETTE.metal }),
  );
  pip.rotation.x = Math.PI / 2;
  pip.position.y = 0.1;
  pip.visible = false;
  pip.name = 'pip';
  return pip;
}

const _bakePos = new THREE.Vector3();
const _bakeQuat = new THREE.Quaternion();
const _bakeScale = new THREE.Vector3(1, 1, 1);
const _bakeEuler = new THREE.Euler();
const _bakeMatrix = new THREE.Matrix4();

function baked(geo, x, y, z, rx = 0, ry = 0, rz = 0) {
  _bakeEuler.set(rx, ry, rz);
  _bakeQuat.setFromEuler(_bakeEuler);
  _bakePos.set(x, y, z);
  geo.applyMatrix4(_bakeMatrix.compose(_bakePos, _bakeQuat, _bakeScale));
  return geo;
}

function mergedMesh(parts, material) {
  const geo = mergeGeometries(parts);
  for (let i = 0; i < parts.length; i++) parts[i].dispose();
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * Fortified bunker. Local −z faces the road (the same yaw as the squad exit).
 * The dish sits at local y 1.99 so the roof pick (world y 2.05, group at 0.06) lands on it.
 * The flag sits at local y 2.49, world y 2.55.
 * Static concrete, sand, and metal are one mesh each so the extra silhouette stays one draw.
 */
function makeHq(paint) {
  const g = new THREE.Group();
  const concrete = mergedMesh([
    baked(new THREE.BoxGeometry(3.1, 0.1, 2.4), 0, 0.05, 0.05),
    baked(new THREE.BoxGeometry(2.2, 0.2, 0.4), 0, 0.2, -0.98),
    // Positive rotation.x takes local +y toward +z, so −0.42 lowers the −z edge.
    baked(new THREE.BoxGeometry(2.15, 0.1, 0.78), 0, 0.38, -0.78, -0.42, 0, 0),
    baked(new THREE.BoxGeometry(0.2, 0.7, 1.2), -1.32, 0.46, -0.02),
    baked(new THREE.BoxGeometry(0.2, 0.7, 1.2), 1.32, 0.46, -0.02),
    baked(new THREE.BoxGeometry(2.2, 0.14, 0.16), 0, 0.2, 1.08),
    baked(new THREE.BoxGeometry(0.7, 0.36, 0.16), 0, 0.42, 1.12),
    baked(new THREE.BoxGeometry(0.16, 0.55, 0.16), -0.7, 0.5, 1.05),
    baked(new THREE.BoxGeometry(0.16, 0.55, 0.16), 0.7, 0.5, 1.05),
    baked(new THREE.BoxGeometry(0.36, 0.14, 0.22), -1.05, 0.2, 0.9),
    baked(new THREE.BoxGeometry(0.36, 0.14, 0.22), 1.05, 0.2, 0.9),
    baked(new THREE.BoxGeometry(0.28, 0.12, 0.16), -0.9, 0.3, -1.18),
    baked(new THREE.BoxGeometry(0.28, 0.12, 0.16), -0.48, 0.32, -1.22),
    baked(new THREE.BoxGeometry(0.28, 0.12, 0.16), 0.02, 0.3, -1.18),
    baked(new THREE.BoxGeometry(0.28, 0.12, 0.16), 0.5, 0.32, -1.22),
    baked(new THREE.BoxGeometry(0.28, 0.12, 0.16), 0.96, 0.3, -1.16),
  ], mat(PALETTE.concrete, { roughness: 0.88, metalness: 0.02 }));
  const sand = mergedMesh([
    baked(new THREE.BoxGeometry(2.55, 0.12, 1.85), 0, 0.1, 0.05),
    baked(new THREE.BoxGeometry(0.34, 0.14, 0.18), -0.7, 0.28, -1.02),
    baked(new THREE.BoxGeometry(0.34, 0.14, 0.18), 0, 0.28, -1.02),
    baked(new THREE.BoxGeometry(0.34, 0.14, 0.18), 0.7, 0.28, -1.02),
  ], mat(PALETTE.sand, { roughness: 0.94, metalness: 0 }));
  const bodyMat = mat(paint.main, { roughness: 0.55, metalness: 0.1 });
  bodyMat.emissive = new THREE.Color(paint.glow);
  bodyMat.emissiveIntensity = 0;
  const body = mergedMesh([
    baked(new THREE.BoxGeometry(2.05, 0.52, 1.28), 0, 0.42, 0),
    baked(new THREE.BoxGeometry(1.15, 0.5, 0.82), 0, 1.12, 0.02),
    baked(new THREE.BoxGeometry(0.72, 0.22, 0.52), 0, 1.46, 0.02),
  ], bodyMat);
  body.userData.slot = 'body';
  const roof = mergedMesh([
    baked(new THREE.BoxGeometry(2.2, 0.1, 1.42), 0, 0.72, 0),
    baked(new THREE.BoxGeometry(2.2, 0.16, 0.12), 0, 0.86, 0.64),
    baked(new THREE.BoxGeometry(0.14, 0.22, 1.2), -1.02, 0.9, 0),
    baked(new THREE.BoxGeometry(0.14, 0.22, 1.2), 1.02, 0.9, 0),
    baked(new THREE.BoxGeometry(1.7, 0.08, 0.1), 0, 0.84, -0.6),
  ], mat(paint.deep, { roughness: 0.6, metalness: 0.08 }));
  roof.userData.slot = 'roof';
  const door = mergedMesh([
    baked(new THREE.BoxGeometry(0.46, 0.32, 0.06), 0, 0.3, -0.68),
    baked(new THREE.BoxGeometry(0.08, 0.14, 0.05), -0.62, 0.52, -0.66),
    baked(new THREE.BoxGeometry(0.08, 0.14, 0.05), 0.62, 0.52, -0.66),
    baked(new THREE.BoxGeometry(0.5, 0.04, 0.05), 0, 0.2, -0.7),
    baked(new THREE.BoxGeometry(0.5, 0.04, 0.05), 0, 0.3, -0.7),
  ], mat(PALETTE.ink, { roughness: 0.8, metalness: 0.12 }));
  const metal = mergedMesh([
    baked(new THREE.CylinderGeometry(0.045, 0.06, 0.7, 6), 0.22, 1.72, 0.02),
    baked(new THREE.CylinderGeometry(0.34, 0.4, 0.06, 10), 0.22, 1.99, 0.02, 0.4, 0.15, 0.5),
    baked(new THREE.TorusGeometry(0.2, 0.012, 6, 14), 0.22, 2.02, 0.04, 1.05, 0.2, 0),
    baked(new THREE.BoxGeometry(0.03, 0.85, 0.03), -0.48, 1.85, -0.08),
    baked(new THREE.BoxGeometry(0.32, 0.025, 0.025), -0.48, 2.2, -0.08),
    baked(new THREE.CylinderGeometry(0.018, 0.022, 0.9, 5), 0.78, 2.2, 0.05),
    baked(new THREE.BoxGeometry(0.16, 0.02, 0.02), 0.78, 2.55, 0.05),
  ], mat(PALETTE.metal, { roughness: 0.38, metalness: 0.55 }));
  const flag = pennant(paint.flag);
  flag.position.set(0.78, 2.49, 0);
  const pip = makePip(1.42);
  const danger = new THREE.Mesh(
    new THREE.TorusGeometry(1.38, 0.045, 6, 28),
    new THREE.MeshBasicMaterial({
      color: paint.glow,
      transparent: true,
      opacity: 0.9,
      toneMapped: false,
    }),
  );
  danger.rotation.x = Math.PI / 2;
  danger.position.y = 0.14;
  danger.visible = false;
  g.userData.pip = pip;
  g.userData.pulse = bodyMat;
  g.userData.dangerRing = danger;
  g.add(concrete, sand, body, roof, door, metal, flag, pip, danger);
  return g;
}

/** Lower hangar: roll door, vents, spawn pad. No dish. Roof center is world y 0.78. */
function makeBarracks(paint) {
  const g = new THREE.Group();
  const sand = mergedMesh([
    baked(new THREE.BoxGeometry(2.05, 0.1, 1.35), 0, 0.06, 0.05),
    baked(new THREE.BoxGeometry(0.22, 0.12, 0.16), -0.85, 0.16, -0.55),
    baked(new THREE.BoxGeometry(0.22, 0.12, 0.16), 0.85, 0.16, -0.55),
    baked(new THREE.BoxGeometry(0.22, 0.12, 0.16), -0.85, 0.16, 0.45),
    baked(new THREE.BoxGeometry(0.22, 0.12, 0.16), 0.85, 0.16, 0.45),
  ], mat(PALETTE.sand, { roughness: 0.94, metalness: 0 }));
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.62, 0.46, 0.92),
    mat(paint.main, { roughness: 0.58, metalness: 0.06 }),
  );
  body.position.y = 0.32;
  body.userData.slot = 'body';
  body.castShadow = true;
  body.receiveShadow = true;
  const roof = mergedMesh([
    baked(new THREE.BoxGeometry(1.78, 0.08, 1.02), 0, 0.7, 0),
    // Negative rotation.x lowers the −z edge, so each slab rises toward the ridge.
    baked(new THREE.BoxGeometry(1.7, 0.07, 0.62), 0, 0.84, -0.22, -0.45, 0, 0),
    baked(new THREE.BoxGeometry(1.7, 0.07, 0.62), 0, 0.84, 0.22, 0.45, 0, 0),
    baked(new THREE.BoxGeometry(0.1, 0.28, 0.95), -0.86, 0.84, 0),
    baked(new THREE.BoxGeometry(0.1, 0.28, 0.95), 0.86, 0.84, 0),
    baked(new THREE.BoxGeometry(0.18, 0.08, 0.16), -0.35, 0.96, 0.05),
    baked(new THREE.BoxGeometry(0.18, 0.08, 0.16), 0.4, 0.96, -0.12),
  ], mat(paint.deep, { roughness: 0.62, metalness: 0.12 }));
  roof.userData.slot = 'roof';
  const ink = mergedMesh([
    baked(new THREE.BoxGeometry(0.7, 0.045, 0.04), 0, 0.18, -0.48),
    baked(new THREE.BoxGeometry(0.7, 0.045, 0.04), 0, 0.26, -0.48),
    baked(new THREE.BoxGeometry(0.7, 0.045, 0.04), 0, 0.34, -0.48),
    baked(new THREE.BoxGeometry(0.22, 0.06, 0.04), -0.52, 0.48, -0.46),
    baked(new THREE.BoxGeometry(0.22, 0.06, 0.04), 0.52, 0.48, -0.46),
  ], mat(PALETTE.ink, { roughness: 0.78, metalness: 0.16 }));
  const spawn = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.04, 0.38),
    mat(PALETTE.concrete, { roughness: 0.84 }),
  );
  spawn.position.set(0, 0.1, -0.86);
  spawn.receiveShadow = true;
  const pole = mergedMesh([
    baked(new THREE.CylinderGeometry(0.02, 0.024, 0.48, 5), -0.72, 1.02, 0),
    baked(new THREE.BoxGeometry(0.08, 0.42, 0.08), -0.78, 0.32, -0.4),
    baked(new THREE.BoxGeometry(0.08, 0.42, 0.08), 0.78, 0.32, -0.4),
    baked(new THREE.BoxGeometry(0.08, 0.42, 0.08), -0.78, 0.32, 0.38),
    baked(new THREE.BoxGeometry(0.08, 0.42, 0.08), 0.78, 0.32, 0.38),
  ], mat(PALETTE.metal, { roughness: 0.42, metalness: 0.4 }));
  const flag = pennant(paint.flag);
  flag.scale.setScalar(0.65);
  flag.position.set(-0.72, 1.22, 0);
  const pip = makePip(1.12);
  g.userData.pip = pip;
  g.add(sand, body, roof, ink, spawn, pole, flag, pip);
  return g;
}

/** Light tank. Local −z is the barrel, so the parent yaw (same helper as the building) aims it down the road. */
function makeTank(paint) {
  const g = new THREE.Group();
  const hull = mergedMesh([
    baked(new THREE.BoxGeometry(0.62, 0.16, 0.95), 0, 0.22, 0),
    baked(new THREE.BoxGeometry(0.4, 0.12, 0.42), 0, 0.34, 0.06),
  ], mat(paint.deep, { roughness: 0.48, metalness: 0.32 }));
  const barrel = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.05, 0.55),
    mat(PALETTE.metal, { roughness: 0.35, metalness: 0.6 }),
  );
  barrel.position.set(0, 0.36, -0.55);
  hull.userData.slot = 'roof';
  const tracks = mergedMesh([
    baked(new THREE.BoxGeometry(0.12, 0.14, 1.02), -0.36, 0.12, 0),
    baked(new THREE.BoxGeometry(0.12, 0.14, 1.02), 0.36, 0.12, 0),
  ], mat(PALETTE.ink, { roughness: 0.8, metalness: 0.2 }));
  g.add(hull, tracks, barrel);
  g.scale.setScalar(1);
  return g;
}

function paintGroup(group, owner) {
  const paint = ownerPaint(owner);
  group.traverse((obj) => {
    if (!obj.material || !obj.userData.slot) return;
    const slot = obj.userData.slot;
    if (slot === 'body') {
      obj.material.color.setHex(paint.main);
      if (obj.material.emissive) obj.material.emissive.setHex(paint.glow);
    } else if (slot === 'roof') obj.material.color.setHex(paint.deep);
    else if (slot === 'flag') obj.material.color.setHex(paint.flag);
  });
}

const _rgb = new THREE.Color();

function writeRgb(hex, target, offset) {
  // setHex converts the art hex into linear so the stripe displays as that hex.
  _rgb.setHex(hex);
  target[offset] = _rgb.r;
  target[offset + 1] = _rgb.g;
  target[offset + 2] = _rgb.b;
}

/**
 * Ownership edge. Two solid halves, no blended gold middle.
 * The quad starts in XY. rotateX(-π/2) maps (x, y, 0) → (x, 0, -y),
 * so local −Y becomes world +Z (player green) and local +Y becomes world −Z
 * (enemy red). The halves do not share vertices, so the GPU cannot mix them.
 * The stripe is a thin hard split in the faction mains, not a second pastel core.
 */
export function frontierBandGeometry() {
  const half = 0.14;
  const positions = new Float32Array([
    -0.5, -half, 0, 0.5, -half, 0, 0.5, 0, 0, -0.5, 0, 0,
    -0.5, 0, 0, 0.5, 0, 0, 0.5, half, 0, -0.5, half, 0,
  ]);
  const colors = new Float32Array(8 * 3);
  for (let i = 0; i < 4; i++) writeRgb(PALETTE.player.main, colors, i * 3);
  for (let i = 4; i < 8; i++) writeRgb(PALETTE.enemy.main, colors, i * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]);
  geo.rotateX(-Math.PI / 2);
  return geo;
}

function makeGlow(geo, material) {
  const mesh = new THREE.Mesh(geo, material);
  mesh.visible = false;
  mesh.renderOrder = 6;
  mesh.frustumCulled = false;
  return mesh;
}

function addMerged(group, parts, material) {
  if (!parts.length) return;
  const geo = mergeGeometries(parts);
  for (let i = 0; i < parts.length; i++) parts[i].dispose();
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
}

/** One grey deck per stream crossing. The plank runs along world z, across the stream. */
export function bridgeDeckGeometries(crossings) {
  const parts = [];
  for (let i = 0; i < crossings.length; i++) {
    const x = crossings[i].x;
    const z = crossings[i].z;
    const plank = new THREE.BoxGeometry(0.92, 0.08, 1.35);
    plank.translate(x, 0.16, z);
    parts.push(plank);
    for (const side of [-0.42, 0.42]) {
      const rail = new THREE.BoxGeometry(0.08, 0.22, 1.35);
      rail.translate(x + side, 0.28, z);
      parts.push(rail);
    }
  }
  return parts;
}

function pushTree(trunks, crowns, x, z, scale, color) {
  const trunk = new THREE.CylinderGeometry(0.05 * scale, 0.09 * scale, 0.34 * scale, 5);
  trunk.translate(x, 0.06 + 0.16 * scale, z);
  trunks.push(trunk);
  const list = crowns[color] || (crowns[color] = []);
  const lower = new THREE.ConeGeometry(0.42 * scale, 0.62 * scale, 7);
  lower.translate(x, 0.06 + 0.52 * scale, z);
  const upper = new THREE.ConeGeometry(0.28 * scale, 0.48 * scale, 6);
  upper.translate(x, 0.06 + 0.92 * scale, z);
  list.push(lower, upper);
}

function boundsOf(map) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  const zones = map.zones;
  for (let i = 0; i < zones.length; i++) {
    const z = zones[i];
    minX = Math.min(minX, z.x - z.rx);
    maxX = Math.max(maxX, z.x + z.rx);
    minZ = Math.min(minZ, z.z - z.rz);
    maxZ = Math.max(maxZ, z.z + z.rz);
  }
  return { minX, maxX, minZ, maxZ };
}

function addEdges(group, map, roadGeo, roadMat) {
  const seen = new Set();
  const parts = [];
  const keys = Object.keys(map.graph);
  for (let i = 0; i < keys.length; i++) {
    const aId = keys[i];
    const nexts = map.graph[aId];
    for (let j = 0; j < nexts.length; j++) {
      const bId = nexts[j];
      const key = aId < bId ? `${aId}|${bId}` : `${bId}|${aId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const a = map.nodes[aId];
      const b = map.nodes[bId];
      const piece = new THREE.Mesh(roadGeo);
      alignLength(piece, a.x, a.z, b.x, b.z, 0.12);
      piece.updateMatrix();
      const baked = roadGeo.clone();
      baked.applyMatrix4(piece.matrix);
      parts.push(baked);
    }
  }
  addMerged(group, parts, roadMat);
  roadGeo.dispose();
}

function buildIsland(map, reduceMotion) {
  const group = new THREE.Group();
  const box = boundsOf(map);
  const beach = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.08, 0.5, 10), mat(PALETTE.meadow, { roughness: 0.94 }));
  const spanX = Math.max(7.6, (box.maxX - box.minX) * 1.05);
  const spanZ = Math.max(12.2, (box.maxZ - box.minZ) * 0.92);
  beach.scale.set(spanX, 1, spanZ);
  beach.position.y = -0.28;
  beach.receiveShadow = true;
  beach.castShadow = false;
  group.add(beach);

  const ownerById = {};
  for (let i = 0; i < map.buildings.length; i++) {
    ownerById[map.buildings[i].id] = map.buildings[i].owner;
  }
  const zoneMeshes = new Map();
  for (let i = 0; i < map.zones.length; i++) {
    const z = map.zones[i];
    const owner = ownerById[z.buildingId];
    const slab = owner ? ownerPaint(owner).slab : PALETTE.meadow;
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1.02, 0.045, 18),
      mat(slab, { roughness: 0.96, metalness: 0 }),
    );
    if (owner) mesh.userData.owner = owner;
    mesh.scale.set(z.rx, 1, z.rz);
    mesh.position.set(z.x, 0.02 + i * 0.006, z.z);
    mesh.rotation.y = 0;
    mesh.receiveShadow = true;
    mesh.castShadow = false;
    group.add(mesh);
    zoneMeshes.set(z.buildingId, mesh);
  }

  const stream = new THREE.Mesh(
    new THREE.BoxGeometry(Math.max(6.4, box.maxX - box.minX + 0.8), 0.05, 0.58),
    mat(PALETTE.stream, { roughness: 0.28 }),
  );
  stream.position.set(0, 0.08, 0);
  stream.receiveShadow = true;
  group.add(stream);

  const roadGeo = new THREE.BoxGeometry(0.72, 0.07, 1);
  const roadMat = mat(PALETTE.road, { roughness: 0.88 });
  addEdges(group, map, roadGeo, roadMat);

  // Decks sit on the crossings, after the road, so the plank is the surface you see.
  const bridgeMat = mat(PALETTE.bridge, { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  addMerged(group, bridgeDeckGeometries(streamCrossings(map)), bridgeMat);

  const trunks = [];
  const crowns = {};
  const trees = treesFor(map);
  for (let i = 0; i < trees.length; i++) {
    const t = trees[i];
    pushTree(trunks, crowns, t.x, t.z, t.s, t.color);
  }
  const rocks = rocksFor(map);
  if (rocks.length) {
    const rockGeo = new THREE.DodecahedronGeometry(0.22, 0);
    const rockParts = [];
    for (let i = 0; i < rocks.length; i++) {
      const rock = rocks[i];
      const geo = rockGeo.clone();
      geo.scale(rock.s, rock.s * 0.62, rock.s * 0.85);
      geo.translate(rock.x, 0.08, rock.z);
      rockParts.push(geo);
      const chip = rockGeo.clone();
      chip.scale(rock.s * 0.45, rock.s * 0.35, rock.s * 0.4);
      chip.translate(rock.x + 0.28 * rock.s, 0.06, rock.z + 0.22 * rock.s);
      rockParts.push(chip);
    }
    rockGeo.dispose();
    addMerged(group, rockParts, mat(PALETTE.rock, { roughness: 0.9, metalness: 0.02 }));
  }
  addMerged(group, trunks, mat(PALETTE.trunk));
  const crownColors = Object.keys(crowns);
  for (let i = 0; i < crownColors.length; i++) {
    addMerged(group, crowns[crownColors[i]], mat(Number(crownColors[i])));
  }

  const buildings = new Map();
  const flags = [];
  const blobs = [];
  const dir = { x: 0, z: 0 };
  for (let i = 0; i < map.buildings.length; i++) {
    const spec = map.buildings[i];
    const groupB = spec.kind === 'hq' ? makeHq(ownerPaint(spec.owner)) : makeBarracks(ownerPaint(spec.owner));
    const p = map.nodes[spec.node];
    exitDir(map, spec.node, dir);
    groupB.position.set(p.x, 0.06, p.z);
    groupB.rotation.y = yawForFacing(dir.x, dir.z);
    const fit = spec.kind === 'hq' ? 0.72 : 0.78;
    groupB.userData.baseScale = fit;
    groupB.scale.setScalar(fit);
    groupB.userData.owner = spec.owner;
    groupB.traverse((obj) => {
      if (obj.userData && obj.userData.flutter) flags.push(obj);
    });
    if (spec.kind === 'barracks') {
      const tank = makeTank(ownerPaint(spec.owner));
      // Local +x is the building's right. The barrel stays on local −z, the road facing.
      tank.position.set(1.15, 0, -0.35);
      groupB.add(tank);
    }
    group.add(groupB);
    buildings.set(spec.id, groupB);
    const blob = new THREE.CircleGeometry(spec.kind === 'hq' ? 1.55 : 1.2, 10);
    blob.rotateX(-Math.PI / 2);
    blob.translate(p.x, 0.045, p.z);
    blobs.push(blob);
  }
  addMerged(group, blobs, new THREE.MeshBasicMaterial({
    color: PALETTE.ink,
    transparent: true,
    opacity: 0.46,
    depthWrite: false,
  }));

  const glowMat = new THREE.MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    depthTest: true,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const tintMat = new THREE.MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
    depthTest: true,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const bandGeo = frontierBandGeometry();
  const glows = [];
  const tints = [];
  for (let i = 0; i < 8; i++) {
    const band = makeGlow(bandGeo, glowMat);
    group.add(band);
    glows.push(band);
    const tint = makeGlow(bandGeo, tintMat);
    group.add(tint);
    tints.push(tint);
  }

  const boxed = boxMapZones(map.zones);
  const frontierBuf = [];
  const ownerScratch = {};

  const ringGeo = new THREE.TorusGeometry(1.05, 0.05, 8, 32);
  ringGeo.rotateX(Math.PI / 2);
  const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0x3dce7a }));
  ring.position.y = 0.2;
  ring.visible = false;
  group.add(ring);

  const hoverGeo = new THREE.TorusGeometry(0.95, 0.035, 6, 28);
  hoverGeo.rotateX(Math.PI / 2);
  const hover = new THREE.Mesh(hoverGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
  hover.position.y = 0.18;
  hover.visible = false;
  group.add(hover);

  const ribbon = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.07, 1, 6),
    new THREE.MeshBasicMaterial({ color: 0xfff4c8, transparent: true, opacity: 0.95 }),
  );
  ribbon.visible = false;
  ribbon.frustumCulled = false;
  group.add(ribbon);
  const arrow = new THREE.Mesh(
    new THREE.ConeGeometry(0.2, 0.46, 8),
    new THREE.MeshBasicMaterial({ color: 0xfff4c8 }),
  );
  arrow.visible = false;
  arrow.frustumCulled = false;
  group.add(arrow);

  const dot = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xf4f7f4 }),
  );
  dot.visible = false;
  group.add(dot);

  function placeMarker(mesh, id, state) {
    let x;
    let z;
    const nodes = (state && state.nodes) || map.nodes;
    const node = id && nodes[id];
    if (node) {
      x = node.x;
      z = node.z;
    } else if (state && id) {
      const squads = state.squads;
      for (let i = 0; i < squads.length; i++) {
        if (squads[i].id === id) {
          x = squads[i].x;
          z = squads[i].z;
          break;
        }
      }
    }
    if (x === undefined) {
      mesh.visible = false;
      return;
    }
    mesh.visible = true;
    mesh.position.x = x;
    mesh.position.z = z;
  }

  function sieged(state, id, owner) {
    const squads = state.squads;
    for (let i = 0; i < squads.length; i++) {
      const s = squads[i];
      if (s.mode === 'siege' && s.targetId === id && s.owner !== owner && s.count > 0) return true;
    }
    return false;
  }

  return {
    group,
    resetDrag() {
      ribbon.visible = false;
      arrow.visible = false;
      dot.visible = false;
      hover.visible = false;
    },
    setDrag(fromId, world, hoverId, fromPos) {
      const nodes = map.nodes;
      const p = fromPos || (fromId && nodes[fromId]);
      if (!fromId || !world || !p) {
        ribbon.visible = false;
        arrow.visible = false;
        dot.visible = false;
        return;
      }
      const dx = world.x - p.x;
      const dz = world.z - p.z;
      const len = Math.hypot(dx, dz);
      if (len < 0.08) {
        ribbon.visible = false;
        arrow.visible = false;
      } else {
        ribbon.visible = true;
        arrow.visible = true;
        ribbon.scale.set(1.4, len, 1.4);
        ribbon.position.set((p.x + world.x) / 2, 0.55, (p.z + world.z) / 2);
        _dir.set(dx / len, 0, dz / len);
        ribbon.quaternion.setFromUnitVectors(UP, _dir);
        arrow.quaternion.copy(ribbon.quaternion);
        arrow.position.set(world.x, 0.55, world.z);
      }
      dot.visible = true;
      dot.position.set(world.x, 0.28, world.z);
      if (hoverId && hoverId !== fromId && nodes[hoverId]) {
        hover.visible = true;
        const h = nodes[hoverId];
        hover.position.x = h.x;
        hover.position.z = h.z;
      } else {
        hover.visible = false;
      }
    },
    update(time, state, selectedId) {
      for (let i = 0; i < state.buildings.length; i++) {
        const b = state.buildings[i];
        ownerScratch[b.id] = b.owner;
        const mesh = buildings.get(b.id);
        if (!mesh) continue;
        if (mesh.userData.owner !== b.owner) {
          mesh.userData.owner = b.owner;
          paintGroup(mesh, b.owner);
        }
        const zone = zoneMeshes.get(b.id);
        if (zone && zone.userData.owner !== b.owner) {
          zone.userData.owner = b.owner;
          zone.material.color.setHex(ownerPaint(b.owner).slab);
        }
        const ranks = b.upgrades;
        if (mesh.userData.pip) {
          mesh.userData.pip.visible = !!(ranks && (ranks.haste > 0 || ranks.bulwark > 0));
        }
        const danger = b.kind === 'hq' && (b.count <= 0 || sieged(state, b.id, b.owner));
        const fit = mesh.userData.baseScale || 1;
        if (danger && !reduceMotion) {
          const s = fit * (1 + 0.045 * Math.sin(time * 9));
          mesh.scale.setScalar(s);
        } else {
          mesh.scale.setScalar(fit);
        }
        const pulse = mesh.userData.pulse;
        if (pulse) {
          pulse.emissiveIntensity = danger ? 0.45 + (reduceMotion ? 0 : 0.4 * Math.sin(time * 9)) : 0;
        }
        const dangerRing = mesh.userData.dangerRing;
        if (dangerRing) {
          dangerRing.visible = !!danger;
          if (danger) {
            const spread = 1 + (reduceMotion ? 0 : 0.18 * (0.5 + 0.5 * Math.sin(time * 6)));
            dangerRing.scale.set(spread, spread, spread);
            dangerRing.material.color.setHex(ownerPaint(b.owner).glow);
          }
        }
      }

      const segs = frontierFrom(boxed, ownerScratch, frontierBuf);
      glowMat.opacity = 0.92;
      for (let i = 0; i < glows.length; i++) {
        const seg = segs[i];
        const band = glows[i];
        if (!seg) {
          band.visible = false;
          tints[i].visible = false;
          continue;
        }
        const alongX = seg.axis !== 'z';
        const span = alongX ? Math.max(0.8, seg.x1 - seg.x0) : Math.max(0.8, seg.z1 - seg.z0);
        const cx = alongX ? (seg.x0 + seg.x1) / 2 : seg.x;
        const cz = alongX ? seg.z : (seg.z0 + seg.z1) / 2;
        const flip = seg.plusOwner === 'player' ? 0 : Math.PI;
        const yaw = alongX ? flip : Math.PI / 2 + flip;
        band.visible = true;
        band.position.set(cx, 0.22, cz);
        band.scale.set(span, 1, 3.2);
        band.rotation.y = yaw;
        const tint = tints[i];
        tint.visible = true;
        tint.position.set(cx, 0.08, cz);
        tint.scale.set(span, 1, 4.2);
        tint.rotation.y = yaw;
      }
      for (let i = segs.length; i < tints.length; i++) tints[i].visible = false;

      placeMarker(ring, selectedId, state);
      if (!reduceMotion && ring.visible) ring.rotation.y = time * 0.8;

      for (let i = 0; i < flags.length; i++) {
        const flag = flags[i];
        flag.rotation.y = reduceMotion ? 0 : Math.sin(time * 2.2 + i) * 0.4;
      }
    },
    dispose() {
      const geos = new Set();
      const mats = new Set();
      group.traverse((child) => {
        if (child.geometry) geos.add(child.geometry);
        if (child.material) mats.add(child.material);
      });
      for (const geo of geos) geo.dispose();
      for (const material of mats) material.dispose();
    },
  };
}

function skyDome() {
  const geo = new THREE.SphereGeometry(46, 20, 12);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const top = new THREE.Color(0xe4eef6);
  const mid = new THREE.Color(PALETTE.sky);
  const horizon = new THREE.Color(0x66725a);
  const tone = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / 46;
    const t = THREE.MathUtils.clamp((y + 0.15) / 1.15, 0, 1);
    if (t < 0.42) tone.copy(horizon).lerp(mid, t / 0.42);
    else tone.copy(mid).lerp(top, (t - 0.42) / 0.58);
    colors[i * 3] = tone.r;
    colors[i * 3 + 1] = tone.g;
    colors[i * 3 + 2] = tone.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
    vertexColors: true,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    toneMapped: false,
  }));
  mesh.frustumCulled = false;
  mesh.renderOrder = -2;
  return mesh;
}

export function createWorld(scene) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  scene.add(skyDome());
  const fieldGeo = new THREE.CircleGeometry(26, 48);
  const fieldPos = fieldGeo.attributes.position;
  const fieldColors = new Float32Array(fieldPos.count * 3);
  const meadowA = new THREE.Color(PALETTE.meadow);
  const meadowB = new THREE.Color(PALETTE.meadowDeep);
  const meadowC = new THREE.Color(0x7d8a58);
  const meadowTone = new THREE.Color();
  for (let i = 0; i < fieldPos.count; i++) {
    const x = fieldPos.getX(i);
    const y = fieldPos.getY(i);
    const n = Math.sin(x * 0.55) * Math.cos(y * 0.47) + Math.sin((x + y) * 0.23) * 0.4;
    meadowTone.copy(n > 0.35 ? meadowC : n < -0.25 ? meadowB : meadowA);
    fieldColors[i * 3] = meadowTone.r;
    fieldColors[i * 3 + 1] = meadowTone.g;
    fieldColors[i * 3 + 2] = meadowTone.b;
  }
  fieldGeo.setAttribute('color', new THREE.BufferAttribute(fieldColors, 3));
  const field = new THREE.Mesh(
    fieldGeo,
    mat(0xffffff, { vertexColors: true, roughness: 0.96, metalness: 0 }),
  );
  field.rotation.x = -Math.PI / 2;
  field.position.y = -0.66;
  field.receiveShadow = true;
  scene.add(field);
  const shore = new THREE.Mesh(
    new THREE.RingGeometry(16.5, 26, 40),
    mat(PALETTE.water, { roughness: 0.4, metalness: 0.04 }),
  );
  shore.rotation.x = -Math.PI / 2;
  shore.position.y = -0.64;
  scene.add(shore);

  const holder = new THREE.Group();
  scene.add(holder);
  let island = null;

  function mount(map) {
    if (island) {
      holder.remove(island.group);
      island.dispose();
      island = null;
    }
    island = buildIsland(map, reduceMotion);
    holder.add(island.group);
  }

  return {
    mount,
    resetDrag() {
      if (island) island.resetDrag();
    },
    setDrag(fromId, world, hoverId, fromPos) {
      if (island) island.setDrag(fromId, world, hoverId, fromPos);
    },
    update(time, state, selectedId) {
      if (island) island.update(time, state, selectedId);
    },
  };
}
