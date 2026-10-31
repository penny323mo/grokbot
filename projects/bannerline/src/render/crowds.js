import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { GRAPH, NODES } from '../sim/mapdata.js';
import { rotateXZ, yawForFacing } from '../sim/facing.js';
import { PALETTE } from './palette.js';

const MAX = 480;
const SOLDIER_SCALE = 1.9;
const RANK_SPACING = 0.42;
const _slot = { x: 0, z: 0 };
const _nose = new THREE.Vector3();
const _vel = new THREE.Vector3();

export function visualCount(count) {
  const n = Math.max(0, Math.floor(count));
  if (n <= 12) return n;
  // Dense ranks. A full board plus marching squads can pass 200 bodies under the 480 cap.
  return Math.min(56, 12 + Math.round((n - 12) * 0.8));
}

/**
 * Helmet, torso, and a rifle. The rifle box is translated on local −z.
 * yawForFacing aims that axis along travel; the instance quaternion's −z
 * is the same axis the crowd's facing probe reads.
 */
function shade(geo, value) {
  const n = geo.getAttribute('position').count;
  const colors = new Float32Array(n * 3);
  colors.fill(value);
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geo;
}

function limb(radiusTop, radiusBottom, height, sides) {
  return new THREE.CylinderGeometry(radiusTop, radiusBottom, height, sides);
}

export function soldierGeometry() {
  // Helmeted infantry. Local −z is the rifle, which yawForFacing aims along travel.
  const legL = shade(limb(0.035, 0.042, 0.2, 3), 0.22);
  legL.translate(-0.05, 0.1, 0);
  const legR = shade(limb(0.035, 0.042, 0.2, 3), 0.16);
  legR.translate(0.05, 0.1, 0);
  const torso = shade(limb(0.09, 0.1, 0.22, 4), 0.4);
  torso.translate(0, 0.28, 0);
  const armL = shade(limb(0.028, 0.03, 0.16, 3), 0.28);
  armL.translate(-0.12, 0.3, -0.02);
  const armR = shade(limb(0.028, 0.03, 0.14, 3), 0.26);
  armR.translate(0.11, 0.3, -0.06);
  const head = shade(limb(0.055, 0.06, 0.09, 4), 0.55);
  head.translate(0, 0.42, 0);
  const helmet = shade(limb(0.092, 0.1, 0.16, 4), 1);
  helmet.translate(0, 0.58, -0.01);
  const brim = shade(new THREE.BoxGeometry(0.24, 0.03, 0.2), 0.78);
  brim.translate(0, 0.5, -0.06);
  const rifle = shade(new THREE.BoxGeometry(0.055, 0.05, 0.64), 0.07);
  rifle.translate(0.14, 0.32, -0.38);
  const stock = shade(new THREE.BoxGeometry(0.06, 0.07, 0.1), 0.12);
  stock.translate(0.14, 0.3, -0.06);
  const pack = shade(new THREE.BoxGeometry(0.08, 0.1, 0.05), 0.2);
  pack.translate(0, 0.3, 0.08);
  const geo = mergeGeometries([legL, legR, torso, armL, armR, head, helmet, brim, rifle, stock, pack]);
  geo.computeVertexNormals();
  return geo;
}

/** Grey shade on soldierGeometry becomes uniform, helmet, skin, and rifle. */
function troopGeometry(uniformHex, helmetHex) {
  const geo = soldierGeometry();
  const src = geo.getAttribute('color');
  const colors = new Float32Array(src.count * 3);
  const uniform = new THREE.Color(uniformHex);
  const deep = uniform.clone().multiplyScalar(0.42);
  const helmet = new THREE.Color(helmetHex);
  const brim = helmet.clone().multiplyScalar(0.62);
  const skin = new THREE.Color(0xc4a882);
  const rifle = new THREE.Color(0x161816);
  const cloth = new THREE.Color();
  for (let i = 0; i < src.count; i++) {
    const v = src.getX(i);
    let tone = uniform;
    if (v >= 0.95) tone = helmet;
    else if (v >= 0.7) tone = brim;
    else if (v >= 0.5) tone = skin;
    else if (v <= 0.14) tone = rifle;
    else {
      cloth.copy(deep).lerp(uniform, Math.min(1, (v - 0.14) / 0.36));
      tone = cloth;
    }
    colors[i * 3] = tone.r;
    colors[i * 3 + 1] = tone.g;
    colors[i * 3 + 2] = tone.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geo;
}

function exitReach(nodeId) {
  const nexts = activeGraph[nodeId] || [];
  const next = nexts[0];
  const a = activeNodes[nodeId];
  const b = next && activeNodes[next];
  if (!a || !b) return 1.8;
  return Math.hypot(b.x - a.x, b.z - a.z);
}

let activeNodes = NODES;
let activeGraph = GRAPH;

function exitYaw(nodeId) {
  const nexts = activeGraph[nodeId] || [];
  const next = nexts[0];
  const a = activeNodes[nodeId];
  const b = next && activeNodes[next];
  if (!a || !b) return 0;
  return yawForFacing(b.x - a.x, b.z - a.z);
}

export function createCrowds(scene) {
  const troopMat = () => new THREE.MeshStandardMaterial({
    color: 0xffffff,
    vertexColors: true,
    roughness: 0.74,
    metalness: 0.04,
  });
  const green = new THREE.InstancedMesh(
    troopGeometry(PALETTE.player.main, 0x8fbf9a),
    troopMat(),
    MAX,
  );
  const red = new THREE.InstancedMesh(
    troopGeometry(PALETTE.enemy.main, 0xd48980),
    troopMat(),
    MAX,
  );
  // Soldiers do not cast. A few hundred casters blow the 1024 shadow map.
  green.castShadow = false;
  red.castShadow = false;
  green.receiveShadow = false;
  red.receiveShadow = false;
  green.frustumCulled = false;
  red.frustumCulled = false;
  green.count = 0;
  red.count = 0;
  scene.add(green, red);

  const dummy = new THREE.Object3D();
  const yawCache = new Map();
  const prevPos = new Map();
  let gi = 0;
  let ri = 0;
  let lastDot = null;
  let noseMesh = null;
  let noseIndex = -1;

  function rememberYaw(id, dirX, dirZ) {
    if (Math.hypot(dirX, dirZ) < 0.05) return yawCache.get(id) || 0;
    const yaw = yawForFacing(dirX, dirZ);
    yawCache.set(id, yaw);
    return yaw;
  }

  function push(owner, x, y, z, yaw, scale, trackNose) {
    const mesh = owner === 'player' ? green : red;
    const index = owner === 'player' ? gi : ri;
    if (index >= MAX) return;
    dummy.position.set(x, y, z);
    dummy.rotation.set(0, yaw, 0);
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
    if (owner === 'player') gi += 1;
    else ri += 1;
    if (trackNose) {
      noseMesh = mesh;
      noseIndex = index;
      _nose.set(0, 0, -1).applyQuaternion(dummy.quaternion);
    }
  }

  function formation(owner, anchorX, anchorZ, yaw, count, track) {
    const n = visualCount(count);
    if (n <= 0) return;
    const cols = n > 20 ? 9 : n > 8 ? 6 : Math.max(1, n);
    const spacing = RANK_SPACING;
    for (let i = 0; i < n; i++) {
      const c = i % cols;
      const r = Math.floor(i / cols);
      const rows = Math.ceil(n / cols);
      const rowCount = r === rows - 1 ? n - r * cols : cols;
      const lx = (c - (rowCount - 1) / 2) * spacing;
      const lz = r * spacing;
      rotateXZ(lx, lz, yaw, _slot);
      const bob = 1 + ((i * 17) % 5) * 0.015;
      push(owner, anchorX + _slot.x, 0.02, anchorZ + _slot.z, yaw, SOLDIER_SCALE * bob, track && i === 0);
    }
  }

  return {
    facingDot() {
      return lastDot;
    },
    setMap(map) {
      activeNodes = map.nodes || NODES;
      activeGraph = map.graph || GRAPH;
      yawCache.clear();
      prevPos.clear();
    },
    update(state) {
      gi = 0;
      ri = 0;
      noseMesh = null;
      noseIndex = -1;
      let tracked = false;
      const nodes = (state && state.nodes) || activeNodes;

      for (let i = 0; i < state.buildings.length; i++) {
        const b = state.buildings[i];
        if (b.count <= 0) continue;
        const p = nodes[b.node];
        if (!p) continue;
        const yaw = exitYaw(b.node);
        // Stay on this pad. A longer reach parks the headquarters rank inside the barracks rank.
        const reach = Math.min(1.1, exitReach(b.node) * 0.82);
        rotateXZ(0, -1, yaw, _slot);
        const anchorX = p.x + _slot.x * reach;
        const anchorZ = p.z + _slot.z * reach;
        formation(b.owner, anchorX, anchorZ, yaw, b.count, false);
      }

      for (let i = 0; i < state.squads.length; i++) {
        const s = state.squads[i];
        if (s.count <= 0) continue;
        let dx = 0;
        let dz = 0;
        if (s.mode === 'march' && s.seg < s.path.length - 1) {
          const next = nodes[s.path[s.seg + 1]];
          if (next) {
            dx = next.x - s.x;
            dz = next.z - s.z;
          }
        } else if (s.path.length > 1) {
          const prev = nodes[s.path[Math.max(0, s.seg - 1)]];
          if (prev) {
            dx = s.x - prev.x;
            dz = s.z - prev.z;
          }
        }
        const yaw = rememberYaw(s.id, dx, dz);
        const wantTrack = !tracked && s.mode === 'march';
        formation(s.owner, s.x, s.z, yaw, s.count, wantTrack);
        if (wantTrack) {
          tracked = true;
          const prev = prevPos.get(s.id);
          if (prev && noseMesh) {
            const vx = s.x - prev.x;
            const vz = s.z - prev.z;
            const vlen = Math.hypot(vx, vz);
            if (vlen > 0.004) {
              _vel.set(vx / vlen, 0, vz / vlen);
              lastDot = _nose.dot(_vel);
            }
          }
          let slot = prevPos.get(s.id);
          if (!slot) {
            slot = { x: s.x, z: s.z };
            prevPos.set(s.id, slot);
          } else {
            slot.x = s.x;
            slot.z = s.z;
          }
        }
      }

      green.count = gi;
      red.count = ri;
      green.instanceMatrix.needsUpdate = true;
      red.instanceMatrix.needsUpdate = true;
    },
  };
}
