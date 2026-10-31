import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import { NODES } from '../src/sim/mapdata.js';
import {
  BADGE_LIFT,
  FLAG_Y,
  PICK_RADIUS,
  PILL_GAP_PX,
  PILL_SHIFT_PX,
  ROOF_Y,
  SCREEN_HIT_PX,
  SQUAD_LIFT,
  layoutPills,
  pickBuilding,
  projectToCss,
  squadMarkX,
} from '../src/render/pointer-math.js';
import { frameDioramaCamera } from '../src/render/stage.js';

const WIDTH = 390;
const HEIGHT = 844;

const specs = [
  ['player-hq', 'hq'],
  ['player-bar', 'barracks'],
  ['enemy-bar', 'barracks'],
  ['enemy-hq', 'hq'],
];

function buildings() {
  return specs.map(([id, kind]) => ({
    id,
    kind,
    owner: id.startsWith('player') ? 'player' : 'enemy',
    x: NODES[id].x,
    z: NODES[id].z,
  }));
}

function cameraAtPhone() {
  const camera = new THREE.PerspectiveCamera(52, WIDTH / HEIGHT, 0.1, 90);
  frameDioramaCamera(camera, WIDTH / HEIGHT);
  return camera;
}

function project(camera, x, y, z) {
  const out = { x: 0, y: 0 };
  assert.equal(projectToCss(x, y, z, camera, WIDTH, HEIGHT, out), true);
  return out;
}

function layoutOf(camera, list) {
  const points = list.map((b) => ({
    x: b.x,
    y: b.kind === 'squad' ? SQUAD_LIFT : (BADGE_LIFT[b.kind] || BADGE_LIFT.barracks),
    z: b.z,
    squad: b.kind === 'squad' ? 1 : 0,
  }));
  const out = points.map(() => ({ px: 0, py: 0, ok: 0 }));
  layoutPills(points, points.length, camera, WIDTH, HEIGHT, out);
  return out;
}

test('count pills, roofs, and flags hit within 44px at 390×844', () => {
  const camera = cameraAtPhone();
  const list = buildings();
  const far = { x: 40, z: 40 };
  for (let i = 0; i < list.length; i++) {
    const b = list[i];
    const kind = b.kind;
    const badge = project(camera, b.x, BADGE_LIFT[kind], b.z);
    const roof = project(camera, b.x, ROOF_Y[kind], b.z);
    const flag = project(camera, b.x, FLAG_Y[kind], b.z);
    const samples = [
      [badge.x, badge.y, 'badge'],
      [badge.x, badge.y - PILL_SHIFT_PX, 'pill'],
      [badge.x, badge.y - (PILL_SHIFT_PX + 20), 'pill top'],
      [roof.x, roof.y, 'roof'],
      [flag.x, flag.y, 'flag'],
    ];
    for (let s = 0; s < samples.length; s++) {
      const [px, py, label] = samples[s];
      const hit = pickBuilding(list, camera, WIDTH, HEIGHT, px, py, far);
      assert.ok(hit, `${b.id} ${label} missed`);
      assert.equal(hit.id, b.id, `${b.id} ${label} picked ${hit && hit.id}`);
    }
  }
  assert.equal(SCREEN_HIT_PX, 44);
  assert.equal(PICK_RADIUS, 1.42);
});

test('the enemy headquarters pill is outside the ground disc and still picks', () => {
  const camera = cameraAtPhone();
  const list = buildings();
  const hq = list.find((b) => b.id === 'enemy-hq');
  const badge = project(camera, hq.x, BADGE_LIFT.hq, hq.z);
  const raycaster = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const ndc = new THREE.Vector2((badge.x / WIDTH) * 2 - 1, -(((badge.y - PILL_SHIFT_PX) / HEIGHT) * 2 - 1));
  raycaster.setFromCamera(ndc, camera);
  const hit = new THREE.Vector3();
  assert.ok(raycaster.ray.intersectPlane(plane, hit));
  const groundD = Math.hypot(hit.x - hq.x, hit.z - hq.z);
  assert.ok(groundD > PICK_RADIUS, `pill ground distance ${groundD} should miss the old disc`);
  const picked = pickBuilding(list, camera, WIDTH, HEIGHT, badge.x, badge.y - PILL_SHIFT_PX, { x: hit.x, z: hit.z });
  assert.equal(picked.id, 'enemy-hq');
});

test('the ground disc still picks a building the pointer is not hovering as a pill', () => {
  const camera = cameraAtPhone();
  const list = buildings();
  const onMesh = pickBuilding(list, camera, WIDTH, HEIGHT, 8, 820, { x: 0, z: -6.55 });
  assert.equal(onMesh.id, 'enemy-hq');
  const outside = pickBuilding(list, camera, WIDTH, HEIGHT, 8, 820, { x: 0, z: -6.55 - 1.5 });
  assert.equal(outside, null);
});

test('a squad on a building keeps its pill and leaves the roof, flag, and foot', () => {
  const camera = cameraAtPhone();
  const hq = NODES['player-hq'];
  const list = [
    { id: 'player-hq', kind: 'hq', owner: 'player', x: hq.x, z: hq.z },
    { id: 'sq-parked', kind: 'squad', owner: 'player', x: hq.x, z: hq.z },
  ];
  const building = project(camera, hq.x, BADGE_LIFT.hq, hq.z);
  const laid = layoutOf(camera, list);
  assert.ok(Math.hypot(laid[0].px - building.x, laid[0].py - (building.y - PILL_SHIFT_PX)) < 0.6);
  assert.ok(Math.hypot(laid[0].px - laid[1].px, laid[0].py - laid[1].py) >= PILL_GAP_PX - 0.6);
  const onSquad = pickBuilding(
    list,
    camera,
    WIDTH,
    HEIGHT,
    laid[1].px,
    laid[1].py,
    { x: hq.x, z: hq.z },
  );
  assert.equal(onSquad && onSquad.id, 'sq-parked');
  const onBuilding = pickBuilding(
    list,
    camera,
    WIDTH,
    HEIGHT,
    laid[0].px,
    laid[0].py,
    { x: hq.x, z: hq.z },
  );
  assert.equal(onBuilding && onBuilding.id, 'player-hq');
  const roof = project(camera, hq.x, ROOF_Y.hq, hq.z);
  const onRoof = pickBuilding(list, camera, WIDTH, HEIGHT, roof.x, roof.y, { x: hq.x, z: hq.z });
  assert.equal(onRoof && onRoof.id, 'player-hq');
  const flag = project(camera, hq.x, FLAG_Y.hq, hq.z);
  const onFlag = pickBuilding(list, camera, WIDTH, HEIGHT, flag.x, flag.y, { x: hq.x, z: hq.z });
  assert.equal(onFlag && onFlag.id, 'player-hq');
  const onFoot = pickBuilding(list, camera, WIDTH, HEIGHT, building.x, flag.y + 37, { x: hq.x, z: hq.z });
  assert.equal(onFoot && onFoot.id, 'player-hq');
});

test('a squad sieging the enemy headquarters does not take its roof or flag', () => {
  const camera = cameraAtPhone();
  const hq = NODES['enemy-hq'];
  const sx = squadMarkX(hq.x, 'player', 'siege');
  const list = [
    { id: 'enemy-hq', kind: 'hq', owner: 'enemy', x: hq.x, z: hq.z },
    { id: 'sq-siege', kind: 'squad', owner: 'player', x: sx, z: hq.z },
  ];
  const building = project(camera, hq.x, BADGE_LIFT.hq, hq.z);
  const laid = layoutOf(camera, list);
  const roof = project(camera, hq.x, ROOF_Y.hq, hq.z);
  const flag = project(camera, hq.x, FLAG_Y.hq, hq.z);
  assert.ok(Math.hypot(laid[0].px - building.x, laid[0].py - (building.y - PILL_SHIFT_PX)) < 0.6);
  assert.ok(Math.hypot(laid[0].px - laid[1].px, laid[0].py - laid[1].py) >= PILL_GAP_PX - 0.6);
  assert.equal(
    pickBuilding(list, camera, WIDTH, HEIGHT, laid[0].px, laid[0].py, null).id,
    'enemy-hq',
  );
  assert.equal(pickBuilding(list, camera, WIDTH, HEIGHT, roof.x, roof.y, null).id, 'enemy-hq');
  assert.equal(pickBuilding(list, camera, WIDTH, HEIGHT, flag.x, flag.y, null).id, 'enemy-hq');
  assert.equal(pickBuilding(list, camera, WIDTH, HEIGHT, flag.x, flag.y + 37, null).id, 'enemy-hq');
  assert.equal(
    pickBuilding(list, camera, WIDTH, HEIGHT, laid[1].px, laid[1].py, null).id,
    'sq-siege',
  );
});
