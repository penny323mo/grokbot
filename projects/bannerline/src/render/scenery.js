import { PALETTE } from './palette.js';

/** Flank pines on 對岸. The island mesh uses these same spots. */
export const CROSSING_TREES = [
  { x: -3.05, z: 6.15, s: 1.08, color: PALETTE.leaf },
  { x: -3.25, z: 4.15, s: 0.82, color: PALETTE.leafDeep },
  { x: 3.15, z: 5.55, s: 1.12, color: PALETTE.leaf },
  { x: 3.3, z: 3.35, s: 0.74, color: PALETTE.leaf },
  { x: -3.15, z: 1.05, s: 0.9, color: PALETTE.leafDeep },
  { x: 3.05, z: 0.7, s: 0.78, color: PALETTE.leaf },
  { x: -3.2, z: -1.45, s: 1.0, color: PALETTE.leaf },
  { x: 3.2, z: -1.7, s: 0.88, color: PALETTE.leafDeep },
  { x: 2.95, z: -4.55, s: 0.8, color: PALETTE.leaf },
  { x: -3.15, z: -5.15, s: 1.05, color: PALETTE.leaf },
  { x: 2.45, z: -6.85, s: 0.7, color: PALETTE.leafDeep },
  { x: -2.15, z: 7.05, s: 0.76, color: PALETTE.leaf },
  { x: 1.55, z: 7.15, s: 0.64, color: PALETTE.leaf },
  { x: -1.35, z: -7.15, s: 0.7, color: PALETTE.leaf },
];

export const CROSSING_ROCKS = [
  { x: 2.55, z: 6.4, s: 0.85 },
  { x: -2.7, z: -6.5, s: 0.7 },
  { x: 3.4, z: -0.2, s: 0.55 },
  { x: -3.45, z: 2.4, s: 0.62 },
  { x: 3.15, z: -6.2, s: 0.48 },
  { x: -3.05, z: -2.4, s: 0.4 },
];

export function islandBounds(map) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  const zones = map.zones || [];
  for (let i = 0; i < zones.length; i++) {
    const z = zones[i];
    minX = Math.min(minX, z.x - z.rx);
    maxX = Math.max(maxX, z.x + z.rx);
    minZ = Math.min(minZ, z.z - z.rz);
    maxZ = Math.max(maxZ, z.z + z.rz);
  }
  return { minX, maxX, minZ, maxZ };
}

/** Pines for this battlefield. 對岸 uses the flank list. Other maps sit a pair on each pad. */
export function treesFor(map) {
  if (map.id === 'crossing') return CROSSING_TREES;
  const zones = map.zones || [];
  const out = [];
  for (let i = 0; i < zones.length; i++) {
    const z = zones[i];
    out.push({
      x: z.x - z.rx + 0.45,
      z: z.z + z.rz * 0.35,
      s: 0.85,
      color: i % 2 ? PALETTE.leafDeep : PALETTE.leaf,
    });
    out.push({
      x: z.x + z.rx - 0.4,
      z: z.z - z.rz * 0.2,
      s: 0.7,
      color: PALETTE.leaf,
    });
  }
  return out;
}

export function rocksFor(map) {
  return map.id === 'crossing' ? CROSSING_ROCKS : [];
}

/** Stream ribbon centred on z = 0, wide enough to cross this island. */
export function streamBand(map) {
  const box = islandBounds(map);
  const width = Math.max(6.4, box.maxX - box.minX + 0.8);
  return { x: 0, z: 0, halfWidth: width / 2, depth: 0.58 };
}

function crossZ0(a, b) {
  const az = a.z;
  const bz = b.z;
  if ((az > 0 && bz > 0) || (az < 0 && bz < 0)) return null;
  if (az === bz) {
    if (az !== 0) return null;
    return { x: (a.x + b.x) / 2, z: 0 };
  }
  const t = (0 - az) / (bz - az);
  if (t < 0 || t > 1) return null;
  return { x: a.x + (b.x - a.x) * t, z: 0 };
}

/** Road crossings of the z = 0 stream, one point per distinct x. */
export function streamCrossings(map) {
  const nodes = map.nodes || {};
  const graph = map.graph || {};
  const seen = new Set();
  const out = [];
  const keys = Object.keys(graph);
  for (let i = 0; i < keys.length; i++) {
    const nexts = graph[keys[i]] || [];
    const a = nodes[keys[i]];
    for (let j = 0; j < nexts.length; j++) {
      const bId = nexts[j];
      const edgeKey = keys[i] < bId ? `${keys[i]}|${bId}` : `${bId}|${keys[i]}`;
      if (seen.has(edgeKey)) continue;
      seen.add(edgeKey);
      const b = nodes[bId];
      if (!a || !b) continue;
      const hit = crossZ0(a, b);
      if (!hit) continue;
      const stamp = hit.x.toFixed(2);
      let dup = false;
      for (let k = 0; k < out.length; k++) {
        if (out[k].x.toFixed(2) === stamp) {
          dup = true;
          break;
        }
      }
      if (!dup) out.push(hit);
    }
  }
  out.sort((p, q) => p.x - q.x);
  return out;
}
