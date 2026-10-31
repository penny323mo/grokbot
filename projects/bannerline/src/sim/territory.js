import { ZONES } from './mapdata.js';

function boxZones(list) {
  const zones = [];
  for (let i = 0; i < list.length; i++) {
    const z = list[i];
    zones.push({
      buildingId: z.buildingId,
      zMin: z.z - z.rz,
      zMax: z.z + z.rz,
      xMin: z.x - z.rx,
      xMax: z.x + z.rx,
    });
  }
  zones.sort((a, b) => b.zMax - a.zMax);
  return zones;
}

const zones = boxZones(ZONES);
const segmentBuffer = [];

/** Neighbouring slabs within this gap still share one glowing edge. */
const GAP = 1.55;

/** Stable zone list. The island slabs do not move, so this array is reused. */
export function sortedZones() {
  return zones;
}

export function boxMapZones(list) {
  return boxZones(list);
}

/**
 * One glow segment wherever two neighbouring slabs have different owners.
 * `axis: 'x'` is a line across the island (constant z). `axis: 'z'` runs
 * along a lane. plusOwner holds the +z side, or the +x side for a lane split.
 * `out` is cleared and refilled. The default buffer is reused every call.
 */
export function frontierFrom(boxed, ownerById, out = segmentBuffer) {
  out.length = 0;
  for (let i = 0; i < boxed.length; i++) {
    for (let j = i + 1; j < boxed.length; j++) {
      const a = boxed[i];
      const b = boxed[j];
      const ao = ownerById[a.buildingId];
      const bo = ownerById[b.buildingId];
      if (!ao || !bo || ao === bo) continue;
      const xOverlap = Math.min(a.xMax, b.xMax) - Math.max(a.xMin, b.xMin);
      const zOverlap = Math.min(a.zMax, b.zMax) - Math.max(a.zMin, b.zMin);
      const zGap = Math.max(a.zMin, b.zMin) - Math.min(a.zMax, b.zMax);
      const xGap = Math.max(a.xMin, b.xMin) - Math.min(a.xMax, b.xMax);
      if (xOverlap > 0.45 && zGap < GAP && zGap > -0.35) {
        const plus = a.zMax >= b.zMax ? a : b;
        const minus = plus === a ? b : a;
        const x0 = Math.max(plus.xMin, minus.xMin);
        const x1 = Math.min(plus.xMax, minus.xMax);
        if (x1 - x0 < 0.4) continue;
        out.push({
          axis: 'x',
          z: (plus.zMin + minus.zMax) / 2,
          x0,
          x1,
          z0: 0,
          z1: 0,
          x: (x0 + x1) / 2,
          plusOwner: ownerById[plus.buildingId],
          minusOwner: ownerById[minus.buildingId],
        });
      } else if (zOverlap > 0.45 && xGap < GAP && xGap > -0.35) {
        const plus = a.xMax >= b.xMax ? a : b;
        const minus = plus === a ? b : a;
        const z0 = Math.max(a.zMin, b.zMin);
        const z1 = Math.min(a.zMax, b.zMax);
        if (z1 - z0 < 0.4) continue;
        const x = (plus.xMin + minus.xMax) / 2;
        out.push({
          axis: 'z',
          z: (z0 + z1) / 2,
          x0: x,
          x1: x,
          z0,
          z1,
          x,
          plusOwner: ownerById[plus.buildingId],
          minusOwner: ownerById[minus.buildingId],
        });
      }
    }
  }
  return out;
}

export function frontierSegments(ownerById, out = segmentBuffer) {
  return frontierFrom(zones, ownerById, out);
}
