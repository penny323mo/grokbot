import * as THREE from 'three';

/** Canvas-local pointer → NDC. Top-left of the rect is (−1, +1). */
export function clientToNdc(clientX, clientY, rect) {
  return {
    x: ((clientX - rect.left) / rect.width) * 2 - 1,
    y: -((clientY - rect.top) / rect.height) * 2 + 1,
  };
}

/** Ground disc on y=0, in world units. The mesh foot still uses this. */
export const PICK_RADIUS = 1.42;

/** Screen hit around a badge, its count pill, the roof, and the flag. */
export const SCREEN_HIT_PX = 44;

/**
 * The count pill is shifted up from the badge anchor by translate(-50%, -115%).
 * 32px is the middle of that card, so a 44px disc covers the white number.
 */
export const PILL_SHIFT_PX = 32;

/**
 * Pill centers stay at least this far apart, so two 44px hit discs do not overlap.
 * Building pills stay put when a squad is the other mark; the squad moves.
 */
export const PILL_GAP_PX = 92;

/** World y of the HTML badge anchor. Shared with the badge layer. */
export const BADGE_LIFT = { hq: 2.85, barracks: 1.55 };

/** World y of a marching squad's count pill. */
export const SQUAD_LIFT = 1.05;

/** Siege badges step sideways so they don't sit on the building door. */
export function squadMarkX(x, owner, mode) {
  if (mode !== 'siege') return x;
  return x + (owner === 'player' ? 0.85 : -0.85);
}

/**
 * World y of the roof and the flag. Buildings sit 0.06 above the ground,
 * so these are the mesh heights plus that rise.
 */
export const ROOF_Y = { hq: 2.05, barracks: 0.78 };
export const FLAG_Y = { hq: 2.55, barracks: 1.2 };

const projected = new THREE.Vector3();
const css = { x: 0, y: 0 };

/** Project a world point to CSS pixels inside a canvas of size width×height. */
export function projectToCss(x, y, z, camera, width, height, out) {
  projected.set(x, y, z);
  projected.project(camera);
  if (projected.z < -1 || projected.z > 1) return false;
  out.x = (projected.x * 0.5 + 0.5) * width;
  out.y = (-projected.y * 0.5 + 0.5) * height;
  return true;
}

function nearer(bestD, d) {
  return d <= SCREEN_HIT_PX && d < bestD;
}

const pillScratch = [];

function pillSlot(i) {
  let slot = pillScratch[i];
  if (!slot) {
    slot = { px: 0, py: 0, squad: 0, ok: 0 };
    pillScratch[i] = slot;
  }
  return slot;
}

/**
 * Project each point to a pill center, then separate overlapping pills.
 * `points[i]` is { x, y, z, squad } with y the world lift. `out[i]` receives
 * { px, py, ok }. The scratch stays inside this module.
 */
export function layoutPills(points, count, camera, width, height, out) {
  const n = count | 0;
  for (let i = 0; i < n; i++) {
    const src = points[i];
    const slot = pillSlot(i);
    slot.squad = src.squad ? 1 : 0;
    slot.ok = 0;
    if (!projectToCss(src.x, src.y, src.z, camera, width, height, css)) continue;
    slot.ok = 1;
    slot.px = css.x;
    slot.py = css.y - PILL_SHIFT_PX;
    slot.ox = slot.px;
    slot.oy = slot.py;
  }
  const margin = 36;
  const clamp = (slot) => {
    if (width > margin * 2) slot.px = Math.min(width - margin, Math.max(margin, slot.px));
    if (height > margin * 2) slot.py = Math.min(height - margin, Math.max(margin, slot.py));
  };
  for (let pass = 0; pass < 8; pass++) {
    for (let i = 0; i < n; i++) {
      const a = pillScratch[i];
      if (!a.ok) continue;
      for (let j = i + 1; j < n; j++) {
        const b = pillScratch[j];
        if (!b.ok) continue;
        let dx = b.px - a.px;
        let dy = b.py - a.py;
        let dist = Math.hypot(dx, dy);
        if (dist >= PILL_GAP_PX) continue;
        if (dist < 0.01) {
          dx = 0;
          dy = 1;
          dist = 1;
        }
        const gap = (PILL_GAP_PX - dist) / dist;
        const nx = dx * gap;
        const ny = dy * gap;
        if (a.squad !== b.squad) {
          const squad = a.squad ? a : b;
          const hall = a.squad ? b : a;
          // A stacked squad slides sideways so it does not cover the tower foot.
          if (Math.abs(dy) >= Math.abs(dx)) {
            const sdx = squad.px - hall.px;
            const sdy = squad.py - hall.py;
            let dirX = Math.abs(sdx) < 1 ? 1 : Math.sign(sdx);
            const reach = Math.sqrt(Math.max(0, PILL_GAP_PX * PILL_GAP_PX - sdy * sdy));
            const extra = reach - Math.abs(sdx);
            if (extra > 0) {
              const next = squad.px + dirX * extra;
              if (width > margin * 2 && (next < margin || next > width - margin)) dirX = -dirX;
              squad.px += dirX * extra;
            }
          } else if (a.squad) {
            a.px -= nx;
            a.py -= ny;
          } else {
            b.px += nx;
            b.py += ny;
          }
          clamp(squad);
        } else {
          a.px -= nx * 0.5;
          a.py -= ny * 0.5;
          b.px += nx * 0.5;
          b.py += ny * 0.5;
          clamp(a);
          clamp(b);
        }
      }
    }
  }
  // Screen-space search, not a heading. Pull a still-covered squad toward a free mark.
  for (let i = 0; i < n; i++) {
    const squad = pillScratch[i];
    if (!squad.ok || !squad.squad) continue;
    let nearest = Infinity;
    for (let j = 0; j < n; j++) {
      if (i === j || !pillScratch[j].ok) continue;
      nearest = Math.min(nearest, Math.hypot(squad.px - pillScratch[j].px, squad.py - pillScratch[j].py));
    }
    if (nearest >= PILL_GAP_PX - 1) continue;
    let bestX = squad.px;
    let bestY = squad.py;
    let best = nearest;
    for (let ring = 1; ring <= 5; ring++) {
      const rad = 24 * ring;
      for (let k = 0; k < 12; k++) {
        const ang = (k / 12) * Math.PI * 2;
        let px = squad.ox + Math.cos(ang) * rad;
        let py = squad.oy + Math.sin(ang) * rad;
        if (width > margin * 2) px = Math.min(width - margin, Math.max(margin, px));
        if (height > margin * 2) py = Math.min(height - margin, Math.max(margin, py));
        let minD = Infinity;
        for (let j = 0; j < n; j++) {
          if (i === j || !pillScratch[j].ok) continue;
          minD = Math.min(minD, Math.hypot(px - pillScratch[j].px, py - pillScratch[j].py));
        }
        if (minD > best) {
          best = minD;
          bestX = px;
          bestY = py;
        }
      }
    }
    squad.px = bestX;
    squad.py = bestY;
  }
  for (let i = 0; i < n; i++) {
    const slot = pillScratch[i];
    const dest = out[i];
    dest.px = slot.px;
    dest.py = slot.py;
    dest.ok = slot.ok;
  }
  return n;
}

const pickPoints = [];
const pickLaid = [];

function pickPoint(i) {
  let row = pickPoints[i];
  if (!row) {
    row = { x: 0, y: 0, z: 0, squad: 0 };
    pickPoints[i] = row;
  }
  return row;
}

function pickLaidRow(i) {
  let row = pickLaid[i];
  if (!row) {
    row = { px: 0, py: 0, ok: 0 };
    pickLaid[i] = row;
  }
  return row;
}

/**
 * Choose a building or a friendly squad.
 * Screen hits (pill, roof, flag) win over the ground disc.
 * A squad's screen sample is its count pill. The lift point sits on the tower
 * foot, so it is not a hit; the 44px pill disc still covers the badge.
 * Steal the pick only when the pointer is nearer that pill than any building
 * screen point, so the roof, flag, and foot stay on the building.
 * `pointerX` / `pointerY` are CSS pixels from the canvas top-left.
 */
export function pickBuilding(buildings, camera, width, height, pointerX, pointerY, ground) {
  let best = null;
  let bestScreen = Infinity;
  let groundBest = null;
  let bestGround = PICK_RADIUS;
  let steal = null;
  let stealPill = Infinity;
  const canProject = width >= 1 && height >= 1 && camera;
  if (canProject) {
    for (let i = 0; i < buildings.length; i++) {
      const b = buildings[i];
      const squad = b.kind === 'squad';
      const kind = b.kind === 'hq' ? 'hq' : 'barracks';
      const row = pickPoint(i);
      row.x = b.x;
      row.y = squad ? SQUAD_LIFT : BADGE_LIFT[kind];
      row.z = b.z;
      row.squad = squad ? 1 : 0;
      pickLaidRow(i);
    }
    layoutPills(pickPoints, buildings.length, camera, width, height, pickLaid);
  }

  for (let i = 0; i < buildings.length; i++) {
    const b = buildings[i];
    const squad = b.kind === 'squad';
    const kind = b.kind === 'hq' ? 'hq' : 'barracks';
    let localBest = Infinity;
    let pillDist = Infinity;

    if (canProject && pickLaid[i].ok) {
      const laid = pickLaid[i];
      const onPill = Math.hypot(pointerX - laid.px, pointerY - laid.py);
      pillDist = onPill;
      if (onPill < localBest) localBest = onPill;
      // The anchor sits one pill-shift below the separated center. Roofs stay on the mesh.
      if (!squad) {
        const onAnchor = Math.hypot(pointerX - laid.px, pointerY - (laid.py + PILL_SHIFT_PX));
        if (onAnchor < localBest) localBest = onAnchor;
      }
      if (!squad && projectToCss(b.x, ROOF_Y[kind], b.z, camera, width, height, css)) {
        const d = Math.hypot(pointerX - css.x, pointerY - css.y);
        if (d < localBest) localBest = d;
      }
      if (!squad && projectToCss(b.x, FLAG_Y[kind], b.z, camera, width, height, css)) {
        const d = Math.hypot(pointerX - css.x, pointerY - css.y);
        if (d < localBest) localBest = d;
      }
      if (nearer(bestScreen, localBest)) {
        bestScreen = localBest;
        best = b;
      }
      if (squad && pillDist <= SCREEN_HIT_PX && pillDist < stealPill) {
        steal = b;
        stealPill = pillDist;
      }
    }
    if (ground) {
      const d = Math.hypot(b.x - ground.x, b.z - ground.z);
      if (d < bestGround) {
        bestGround = d;
        groundBest = b;
      }
    }
  }

  if (best && best.kind !== 'squad' && steal && stealPill < bestScreen) {
    best = steal;
  }
  return best || groundBest;
}
