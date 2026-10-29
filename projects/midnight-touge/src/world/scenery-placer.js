// Roadside scenery placer for Kirine Pass — CC0 Kenney / Grab3D / Quaternius props
import * as THREE from '../../libs/three.module.js';
import { GLTFLoader } from '../../libs/GLTFLoader.js';
import { KIRINE_PASS_TRACK } from '../data/track_data.js';

const PROP_ROOT = 'assets/models/props/';

/** Landmark placements keyed by approx distance along centreline (metres). */
const LANDMARKS = [
  // Start line dense staging area (0 - 80m) with overhead gantry framed 18m ahead
  { dist: 4,    prop: 'street_light',     side: 1,   scale: 8.5, yaw: 0,    yOff: 0 },
  { dist: 8,    prop: 'tree_pine',        side: -1,  scale: 7.5, yaw: 0.4,   yOff: 0 },
  { dist: 12,   prop: 'cliff_rock',       side: -1,  scale: 2.5, yaw: 0.1,   yOff: 0 },
  { dist: 16,   prop: 'street_light',     side: 1,   scale: 8.5, yaw: 0,    yOff: 0 },
  { dist: 18,   prop: 'overhead_gantry',  side: 0,   scale: 7.8, yaw: 0,    yOff: 0 },
  { dist: 22,   prop: 'tree_large',       side: 1,   scale: 7.5, yaw: -0.3,  yOff: 0 },
  { dist: 26,   prop: 'tree_pine',        side: -1,  scale: 7.8, yaw: 0.2,   yOff: 0 },
  { dist: 32,   prop: 'street_light',     side: 1,   scale: 8.5, yaw: 0,    yOff: 0 },
  { dist: 40,   prop: 'fence_low',        side: 1,   scale: 1.5, yaw: 0,    yOff: 0 },
  { dist: 48,   prop: 'street_light',     side: 1,   scale: 8.5, yaw: 0,    yOff: 0 },
  { dist: 54,   prop: 'tree_pine',        side: -1,  scale: 8.0, yaw: 0.3,   yOff: 0 },
  { dist: 64,   prop: 'street_light',     side: 1,   scale: 8.5, yaw: 0,    yOff: 0 },
  { dist: 74,   prop: 'tree_pine',        side: -1,  scale: 7.5, yaw: 0.2,   yOff: 0 },
  { dist: 80,   prop: 'street_light',     side: 1,   scale: 8.5, yaw: 0,    yOff: 0 },
  { dist: 82,   prop: 'overhead_lights',  side: 0,   scale: 7.5, yaw: 0,    yOff: 0 },
  { dist: 120,  prop: 'sign_street',      side: -1,  scale: 1.4, yaw: 0,    yOff: 0 },
  { dist: 160,  prop: 'sign_highway',     side: 1,   scale: 1.3, yaw: 0,    yOff: 0 },
  { dist: 180,  prop: 'power_pole',       side: 1,   scale: 1.6, yaw: 0,    yOff: 0 },
  { dist: 220,  prop: 'vending_machine',  side: -1,  scale: 1.0, yaw: Math.PI/2, yOff: 0 },
  { dist: 260,  prop: 'parasol',          side: -1,  scale: 1.4, yaw: 0.3,  yOff: 0 },
  { dist: 280,  prop: 'tent',             side: 1,   scale: 1.3, yaw: 0.2,  yOff: 0 },
  { dist: 350,  prop: 'tea_house',        side: -1,  scale: 0.55, yaw: Math.PI/2, yOff: 0 },
  { dist: 380,  prop: 'shop_a',           side: 1,   scale: 0.7, yaw: -0.4, yOff: 0 }, // rest-stop shop
  { dist: 420,  prop: 'torii',            side: 0,   scale: 2.2, yaw: 0,    yOff: 0 },
  { dist: 520,  prop: 'power_pole_wide',  side: 1,   scale: 1.5, yaw: 0,    yOff: 0 },
  { dist: 580,  prop: 'house_d',          side: -1,  scale: 0.85, yaw: 0.5, yOff: 0 },
  { dist: 650,  prop: 'covered_bridge',   side: 0,   scale: 0.45, yaw: 0,   yOff: -0.5 },
  { dist: 720,  prop: 'sign_warning',     side: -1,  scale: 1.3, yaw: 0,    yOff: 0 },
  { dist: 800,  prop: 'stone_house',      side: 1,   scale: 0.5, yaw: -0.4, yOff: 0 },
  { dist: 860,  prop: 'house_e',          side: -1,  scale: 0.8, yaw: 0.3,  yOff: 0 },
  { dist: 900,  prop: 'feudal_tea_house', side: -1,  scale: 1.1, yaw: 0.6,  yOff: 0 },
  { dist: 1000, prop: 'booth_a',          side: 1,   scale: 0.8, yaw: Math.PI, yOff: 0 }, // toll booth
  { dist: 1040, prop: 'pit_office',       side: -1,  scale: 0.9, yaw: Math.PI/2, yOff: 0 }, // tea-house stand-in
  { dist: 1100, prop: 'sign_stop',        side: -1,  scale: 1.2, yaw: 0,    yOff: 0 },
  { dist: 1180, prop: 'billboard',        side: 1,   scale: 1.4, yaw: -0.2, yOff: 0 },
  { dist: 1300, prop: 'house_a',          side: 1,   scale: 0.9, yaw: 0.3,  yOff: 0 },
  { dist: 1400, prop: 'house_f',          side: -1,  scale: 0.85, yaw: -0.3, yOff: 0 },
  { dist: 1500, prop: 'tea_terrace',      side: -1,  scale: 0.8, yaw: 0.5,  yOff: 0 },
  { dist: 1600, prop: 'shop_wide',        side: 1,   scale: 0.65, yaw: 0.4, yOff: 0 },
  { dist: 1700, prop: 'house_b',          side: 1,   scale: 0.85, yaw: -0.5, yOff: 0 },
  { dist: 1800, prop: 'stone_bridge',     side: 0,   scale: 1.2, yaw: 0,    yOff: -0.3 },
  { dist: 1900, prop: 'awning',           side: -1,  scale: 1.2, yaw: 0,    yOff: 0 },
  // Tunnel mouth — cliff cave left + right framing
  { dist: 2050, prop: 'tunnel_mouth_l',   side: -1,  scale: 2.4, yaw: Math.PI/2, yOff: -1.0 },
  { dist: 2050, prop: 'tunnel_mouth_r',   side: 1,   scale: 2.4, yaw: -Math.PI/2, yOff: -1.0 },
  { dist: 2100, prop: 'barrier_wall',     side: 0,   scale: 1.4, yaw: 0,    yOff: 0 },
  { dist: 2150, prop: 'barrier_red',      side: -1,  scale: 1.2, yaw: 0,    yOff: 0 },
  { dist: 2200, prop: 'barrier_red',      side: 1,   scale: 1.2, yaw: 0,    yOff: 0 },
  { dist: 2250, prop: 'overhead_gantry',  side: 0,   scale: 7.8, yaw: 0,    yOff: 0 },
  { dist: 2300, prop: 'light_red_double', side: 0,   scale: 1.3, yaw: 0,    yOff: 0 },
  { dist: 2400, prop: 'flag_checkers',    side: 1,   scale: 1.5, yaw: 0,    yOff: 0 },
  { dist: 2500, prop: 'house_c',          side: -1,  scale: 0.9, yaw: 0.4,  yOff: 0 },
  { dist: 2600, prop: 'house_g',          side: 1,   scale: 0.85, yaw: -0.4, yOff: 0 },
  { dist: 2700, prop: 'booth_b',          side: 1,   scale: 0.75, yaw: Math.PI, yOff: 0 },
  { dist: 2750, prop: 'shop_b',           side: -1,  scale: 0.7, yaw: 0.5,  yOff: 0 },
  { dist: 2850, prop: 'sign_highway_wide',side: -1,  scale: 1.2, yaw: 0,    yOff: 0 },
  { dist: 2900, prop: 'sign_street',      side: 1,   scale: 1.3, yaw: 0,    yOff: 0 },
  { dist: 2950, prop: 'overhead_lights',  side: 0,   scale: 7.5, yaw: 0,    yOff: 0 },
];

/** Repeating filler props every N metres. */
const FILLERS = [
  { every: 55,  prop: 'tree_large',      side: 1,  scale: [6.5, 9.0], lat: [9, 16] },
  { every: 60,  prop: 'tree_small',      side: -1, scale: [4.5, 7.0], lat: [8, 14] },
  { every: 65,  prop: 'tree_pine',       side: 1,  scale: [6.5, 9.5], lat: [11, 18] },
  { every: 70,  prop: 'tree_large',      side: -1, scale: [6.5, 9.0], lat: [12, 20] },
  { every: 85,  prop: 'tree_pine',       side: -1, scale: [6.0, 9.0], lat: [10, 17] },
  { every: 90,  prop: 'rock_large_a',    side: 1,  scale: [1.5, 2.5], lat: [10, 18] },
  { every: 95,  prop: 'rock_tall_a',     side: -1, scale: [1.5, 2.5], lat: [11, 19] },
  { every: 110, prop: 'cliff_rock',      side: 1,  scale: [2.0, 3.0], lat: [14, 22] },
  { every: 125, prop: 'cliff_block',     side: -1, scale: [1.8, 2.8], lat: [15, 24] },
  { every: 120, prop: 'power_pole',      side: -1, scale: [1.5, 2.0], lat: [6, 8] },
  { every: 140, prop: 'street_light',    side: 1,  scale: [7.5, 9.5], lat: [5.5, 7] },
  { every: 160, prop: 'plant_bush_large',side: -1, scale: [1.5, 2.2], lat: [7, 11] },
  { every: 180, prop: 'rock_large_b',    side: 1,  scale: [1.5, 2.5], lat: [9, 15] },
  { every: 200, prop: 'sign_warning',    side: -1, scale: [1.2, 1.5], lat: [5, 6.5] },
  { every: 240, prop: 'fence_low',       side: 1,  scale: [1.2, 1.6], lat: [6, 8] },
  { every: 320, prop: 'stone_large',     side: -1, scale: [1.5, 2.2], lat: [12, 18] },
];

function lerpWaypoint(dist) {
  const wps = KIRINE_PASS_TRACK.waypoints;
  if (!wps.length) return null;
  if (dist <= wps[0].dist) return wps[0];
  if (dist >= wps[wps.length - 1].dist) return wps[wps.length - 1];
  let lo = 0, hi = wps.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (wps[mid].dist < dist) lo = mid; else hi = mid;
  }
  const a = wps[lo], b = wps[hi];
  const t = (dist - a.dist) / Math.max(1e-3, b.dist - a.dist);
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
    heading: a.heading + (b.heading - a.heading) * t,
    fx: a.fx + (b.fx - a.fx) * t,
    fy: a.fy + (b.fy - a.fy) * t,
    rx: a.rx + (b.rx - a.rx) * t,
    ry: a.ry + (b.ry - a.ry) * t,
  };
}

function hash01(n) {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

export class SceneryPlacer {
  constructor(scene) {
    this.scene = scene;
    this.loader = new GLTFLoader();
    this.cache = {};
    this.group = new THREE.Group();
    this.group.name = 'RoadsideScenery';
    this.scene.add(this.group);
  }

  async loadProp(name) {
    if (this.cache[name]) return this.cache[name].clone(true);
    const path = `${PROP_ROOT}${name}.glb`;
    try {
      const gltf = await new Promise((resolve, reject) => {
        this.loader.load(path, resolve, undefined, reject);
      });
      this.cache[name] = gltf.scene;
      return gltf.scene.clone(true);
    } catch (e) {
      console.warn('scenery prop missing', name, e);
      return null;
    }
  }

  placeAt(wp, side, lat, scale, yawExtra, yOff) {
    // Game is Z-up; track waypoints use x/y horizontal, z elevation
    const rx = wp.rx || 1, ry = wp.ry || 0;
    const fx = wp.fx || 0, fy = wp.fy || 1;
    const ox = wp.x + rx * side * lat;
    const oy = wp.y + ry * side * lat;
    const oz = wp.z + (yOff || 0);
    return { ox, oy, oz, heading: wp.heading || 0, yawExtra: yawExtra || 0, scale };
  }

  async _addInstance(name, pose) {
    const obj = await this.loadProp(name);
    if (!obj) return;
    // Blender Y-up → game Z-up
    obj.rotation.x = Math.PI / 2;
    obj.rotation.z = -(pose.heading || 0) + (pose.yawExtra || 0);
    obj.position.set(pose.ox, pose.oy, pose.oz);
    const s = pose.scale || 1;
    obj.scale.setScalar(s);
    obj.traverse(c => {
      if (c.isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
        if (c.material) {
          const mats = Array.isArray(c.material) ? c.material : [c.material];
          mats.forEach(m => {
            if (m && m.map) m.map.colorSpace = THREE.SRGBColorSpace;
          });
        }
      }
    });
    this.group.add(obj);

    // Add glowing amber sodium ground light pool under street lamps & gantries
    if (name.includes('light') || name.includes('gantry')) {
      if (!this.poolMat) {
        const c = document.createElement('canvas');
        c.width = 64; c.height = 64;
        const ctx = c.getContext('2d');
        const g = ctx.createRadialGradient(32, 32, 4, 32, 32, 32);
        g.addColorStop(0, 'rgba(242, 175, 65, 0.45)');
        g.addColorStop(0.5, 'rgba(242, 175, 65, 0.16)');
        g.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 64, 64);
        const tex = new THREE.CanvasTexture(c);
        this.poolMat = new THREE.MeshBasicMaterial({
          map: tex,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        });
      }
      const pool = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 8.5), this.poolMat);
      pool.position.set(pose.ox, pose.oy, pose.oz + 0.04);
      pool.rotation.z = pose.yawExtra || 0;
      this.group.add(pool);
    }
  }

  updateCulling(playerPos, maxDist = 85) {
    if (!playerPos || !this.group.visible) return;
    const maxSq = maxDist * maxDist;
    const px = playerPos.x;
    const py = playerPos.y;
    const children = this.group.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const dx = child.position.x - px;
      const dy = child.position.y - py;
      child.visible = (dx * dx + dy * dy) < maxSq;
    }
  }

  async populate() {
    const jobs = [];

    for (const lm of LANDMARKS) {
      const wp = lerpWaypoint(lm.dist);
      if (!wp) continue;
      const lat = lm.side === 0 ? 0 : 7.5;
      const pose = this.placeAt(wp, lm.side === 0 ? 1 : lm.side, lat, lm.scale, lm.yaw, lm.yOff);
      if (lm.side === 0) {
        // centreline — sit slightly off road edge if scale large
        pose.ox = wp.x;
        pose.oy = wp.y;
      }
      jobs.push(this._addInstance(lm.prop, pose));
    }

    const total = KIRINE_PASS_TRACK.totalLength;
    for (const filler of FILLERS) {
      for (let d = filler.every * 0.5; d < total; d += filler.every) {
        // Skip near dense landmarks (±25m)
        if (LANDMARKS.some(l => Math.abs(l.dist - d) < 25)) continue;
        const wp = lerpWaypoint(d);
        if (!wp) continue;
        const h = hash01(d * 1.7 + filler.every);
        const lat = filler.lat[0] + (filler.lat[1] - filler.lat[0]) * h;
        const sc = filler.scale[0] + (filler.scale[1] - filler.scale[0]) * hash01(d * 3.1);
        const yaw = (h - 0.5) * 1.2;
        const pose = this.placeAt(wp, filler.side, lat, sc, yaw, 0);
        jobs.push(this._addInstance(filler.prop, pose));
      }
    }

    // Batch with concurrency limit
    const CONC = 8;
    for (let i = 0; i < jobs.length; i += CONC) {
      await Promise.all(jobs.slice(i, i + CONC));
    }
    console.log(`Scenery placed: ${this.group.children.length} props`);
  }

  setVisible(v) {
    this.group.visible = v;
  }
}
