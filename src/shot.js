/**
 * 12碼讀心戰 (Penalty Mind Game v2) - Shot Simulation (Pure Module)
 * Converts swipe gestures to ballistic launch parameters with Magnus curve and quadratic drag.
 * Fully deterministic and testable in Node.
 */

import { TUNING } from './tuning.js';

/**
 * Clamp a value to [min, max]
 */
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/**
 * Clamp to [0, 1]
 */
function clamp01(val) {
  return Math.max(0, Math.min(1, val));
}

/**
 * Convert a user swipe gesture into physical launch parameters.
 * @param {Array<{x: number, y: number, t: number}>} points - Screen touch/mouse points
 * @param {{width: number, height: number}} viewport - Screen dimensions in px
 * @param {Object} [tuning=TUNING] - Tuning parameters
 * @returns {Object|null} Launch parameters or null if swipe is invalid
 */
export function swipeToLaunch(points, viewport, tuning = TUNING) {
  if (!points || points.length < 2) return null;

  const p0 = points[0];
  const pEnd = points[points.length - 1];

  const dx = pEnd.x - p0.x;
  const dy = pEnd.y - p0.y; // in screen px: dy < 0 is upward towards goal
  const durationMs = Math.max(1, pEnd.t - p0.t);
  const distPx = Math.sqrt(dx * dx + dy * dy);

  // Swipe must be upward towards the goal and meet minimum distance
  if (dy >= -5 || distPx < tuning.swipe.minDistPx || durationMs > tuning.swipe.maxDurationMs) {
    return null;
  }

  // Swipe speed in px/ms
  const speedPxPerMs = distPx / durationMs;
  if (speedPxPerMs < tuning.swipe.minSpeedPxPerMs) {
    return null;
  }

  // Normalised power [0, 1]
  const power = clamp01(
    (speedPxPerMs - tuning.swipe.minSpeedPxPerMs) /
    (tuning.swipe.maxSpeedPxPerMs - tuning.swipe.minSpeedPxPerMs)
  );

  // Actual launch ball speed in m/s
  let launchSpeed = tuning.swipe.minLaunchSpeed + power * (tuning.swipe.maxLaunchSpeed - tuning.swipe.minLaunchSpeed);

  // 1. Aim Target X mapping:
  // Center of screen (viewport.width / 2) maps to goal center X = 0
  // Swipe horizontal delta dx and end point determine target X on goal plane
  const goalHalfWidth = tuning.goal.width / 2; // 3.66m
  const screenSpanX = viewport.width * 0.38;
  const targetX = clamp((dx / screenSpanX) * goalHalfWidth, -goalHalfWidth * 1.35, goalHalfWidth * 1.35);

  // 2. Aim Target Y mapping:
  // Upward swipe distance maps to goal height (0 to 2.44m)
  const screenSpanY = viewport.height * 0.32;
  const upwardDist = Math.max(0, -dy);
  let targetY = clamp((upwardDist / screenSpanY) * tuning.goal.height, 0.15, tuning.goal.height * 1.05);

  // Overpower upward error (power > 0.92 can sail over crossbar)
  if (power > tuning.swipe.overpowerThreshold) {
    const overExcess = (power - tuning.swipe.overpowerThreshold) / (1.0 - tuning.swipe.overpowerThreshold);
    targetY += overExcess * 1.15; // Lifts target above 2.44m
  }

  // 3. Curve / Magnus spin from swipe bend:
  // Find maximum signed perpendicular distance of intermediate points from the chord (p0 -> pEnd)
  let maxPerpDev = 0;
  // Normal to chord: vector (-dy, dx) / distPx
  const nx = -dy / distPx;
  const ny = dx / distPx;

  for (let i = 1; i < points.length - 1; i++) {
    const px = points[i].x - p0.x;
    const py = points[i].y - p0.y;
    // Perpendicular distance: dot product with unit normal
    const perp = px * nx + py * ny;
    if (Math.abs(perp) > Math.abs(maxPerpDev)) {
      maxPerpDev = perp;
    }
  }

  // Normalise curve to [-1, 1]
  const curveNorm = clamp(
    (maxPerpDev / (viewport.width * 0.12)) * tuning.swipe.curveMultiplier,
    -1.0,
    1.0
  );
  const spinY = curveNorm * tuning.swipe.maxSpin; // in rad/s

  // Compute 3D launch velocity vector from spot (0, 0.11, 11.0) to goal plane (targetX, targetY, 0)
  const startX = 0;
  const startY = tuning.ball.radius;
  const startZ = tuning.goal.spotDistance; // 11.0m

  // Flight time estimate along Z
  const distZ = startZ;
  const avgVz = launchSpeed * 0.92;
  const tFlight = distZ / avgVz;

  // Initial velocities to reach target under gravity & estimated curve
  const gravity = tuning.ball.gravity;
  const vy = (targetY - startY - 0.5 * gravity * tFlight * tFlight) / tFlight;
  // Account for expected Magnus deflection during flight
  const estimatedMagnusDeflectionX = 0.5 * tuning.ball.magnusCoeff * spinY * (-avgVz) * tFlight * tFlight;
  const vx = (targetX - startX - estimatedMagnusDeflectionX) / tFlight;
  const vz = -distZ / tFlight;

  // Re-normalise velocity vector magnitude to match launchSpeed
  const currentSpeed = Math.sqrt(vx * vx + vy * vy + vz * vz);
  const scale = launchSpeed / currentSpeed;

  return {
    position: { x: startX, y: startY, z: startZ },
    velocity: { x: vx * scale, y: vy * scale, z: vz * scale },
    spin: { x: 0, y: spinY, z: 0 },
    power,
    speed: launchSpeed,
    target: { x: targetX, y: targetY },
    curve: curveNorm
  };
}

/**
 * Convert a target point, launch speed, and curve into a simulate-compatible launch object.
 * Used for AI shots (e.g. CPU taker during keeper mode) and programmatic trajectory simulations.
 * @param {Object} targetPoint - { x, y } target at goal plane Z=0
 * @param {number} speed - launch speed in m/s
 * @param {number} [curve=0] - lateral curve parameter [-1, 1]
 * @param {Object} [tuning=TUNING]
 * @returns {Object} { position, velocity, spin, power, speed, target, curve }
 */
export function pointToLaunch(targetPoint, speed, curve = 0, tuning = TUNING) {
  const startX = 0;
  const startY = tuning.ball.radius;
  const startZ = tuning.goal.spotDistance; // 11.0m

  const targetX = targetPoint.x;
  const targetY = Math.max(0.2, targetPoint.y);

  const distZ = startZ;
  const tFlight = distZ / speed;

  // Ballistic compensation for gravity: vy0 * t + 0.5 * g * t^2 = targetY - startY
  const vy = (targetY - startY - 0.5 * tuning.ball.gravity * tFlight * tFlight) / tFlight;

  // Lateral spin and Magnus compensation
  const spinY = curve * tuning.swipe.maxSpin;
  const estimatedMagnusDeflectionX = 0.5 * (tuning.ball.magnusCoeff * spinY * speed) * tFlight * tFlight;
  const vx = (targetX - startX - estimatedMagnusDeflectionX) / tFlight;
  const vz = -distZ / tFlight;

  // Scale to exact desired speed
  const currentSpeed = Math.hypot(vx, vy, vz) || speed;
  const scale = speed / currentSpeed;

  return {
    position: { x: startX, y: startY, z: startZ },
    velocity: { x: vx * scale, y: vy * scale, z: vz * scale },
    spin: { x: 0, y: spinY, z: 0 },
    power: Math.min(1.0, speed / tuning.swipe.maxLaunchSpeed),
    speed,
    target: { x: targetX, y: targetY },
    curve
  };
}

/**
 * Determine which 6-zone (TL, TM, TR, BL, BM, BR) a goal crossing point belongs to.
 * @param {number} x - Crossing X coordinate
 * @param {number} y - Crossing Y coordinate
 * @param {Object} [tuning=TUNING]
 * @returns {string} One of 'TL', 'TM', 'TR', 'BL', 'BM', 'BR'
 */
export function getZoneFromPoint(x, y, tuning = TUNING) {
  const isTop = y >= tuning.goal.yMid;
  let horiz = 'M';
  if (x < tuning.goal.xLeft) horiz = 'L';
  else if (x > tuning.goal.xRight) horiz = 'R';
  return (isTop ? 'T' : 'B') + horiz;
}

/**
 * Map a screen tap coordinate to the nearest 3x2 goal zone (TL, TM, TR, BL, BM, BR).
 * Works for points on the goal and taps outside the goal (nearest zone partition).
 * @param {{x: number, y: number}} point - Screen tap coordinates in pixels
 * @param {{width: number, height: number}} viewport - Screen viewport dimensions
 * @param {Object} [tuning=TUNING]
 * @returns {string} One of 'TL', 'TM', 'TR', 'BL', 'BM', 'BR'
 */
export function mapTapToZone(point, viewport, tuning = TUNING, unprojectHit = null) {
  if (!point || !viewport) return 'BM';

  // 1. Raycast projection onto goal plane z = 0 (exact 3D binning with 3D zone meshes)
  if (unprojectHit && typeof unprojectHit.x === 'number' && typeof unprojectHit.y === 'number') {
    return getZoneFromPoint(unprojectHit.x, unprojectHit.y, tuning);
  }

  // 2. Calibrated 2D screen viewport partition fallback (for off-target taps or pure Node test env)
  const w = viewport.width || 390;
  const h = viewport.height || 844;

  const nx = point.x / w;
  const ny = point.y / h;

  const mapping = (tuning.keeper && tuning.keeper.tapGoalMapping) || {};
  const splitXLeft = mapping.splitXLeft ?? 0.363;
  const splitXRight = mapping.splitXRight ?? 0.637;
  const splitYMid = mapping.splitYMid ?? 0.493;

  let horiz = 'M';
  if (nx < splitXLeft) horiz = 'L';
  else if (nx > splitXRight) horiz = 'R';

  const isTop = ny < splitYMid;
  return (isTop ? 'T' : 'B') + horiz;
}

/**
 * Map a short swipe vector (dx, dy) to its directional dive zone.
 * @param {number} dx - Swipe horizontal delta in pixels
 * @param {number} dy - Swipe vertical delta in pixels (negative = up)
 * @param {Object} [tuning=TUNING]
 * @returns {string} One of 'TL', 'TM', 'TR', 'BL', 'BM', 'BR'
 */
export function mapSwipeToZone(dx, dy, tuning = TUNING) {
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);

  // If swipe is primarily upward (dy < 0)
  if (dy < 0) {
    if (dx < -absY * 0.414) return 'TL';
    if (dx > absY * 0.414) return 'TR';
    return 'TM';
  }

  // If swipe is primarily downward or lateral
  if (dx < -Math.max(1, absY) * 0.414) return 'BL';
  if (dx > Math.max(1, absY) * 0.414) return 'BR';
  return 'BM';
}

/**
 * Resolve player goalkeeper input: determines whether gesture is a tap or short swipe,
 * and maps cleanly to the target dive zone with forgiving tolerances.
 * @param {{start: {x: number, y: number}, end?: {x: number, y: number}}} gesture
 * @param {{width: number, height: number}} viewport
 * @param {Object} [tuning=TUNING]
 * @returns {{zone: string, type: 'tap'|'swipe', dist: number, dx: number, dy: number}}
 */
export function resolveKeeperInput(gesture, viewport, tuning = TUNING, unprojectHit = null) {
  if (!gesture || !gesture.start) {
    return { zone: 'BM', type: 'tap', dist: 0, dx: 0, dy: 0 };
  }

  const p0 = gesture.start;
  const p1 = gesture.end || gesture.start;
  const dx = p1.x - p0.x;
  const dy = p1.y - p0.y;
  const dist = Math.hypot(dx, dy);

  const minDist = (tuning.keeper && tuning.keeper.shortSwipeMinDistPx) || 18;

  if (dist >= minDist) {
    const zone = mapSwipeToZone(dx, dy, tuning);
    return { zone, type: 'swipe', dist, dx, dy };
  } else {
    const zone = mapTapToZone(p0, viewport, tuning, unprojectHit);
    return { zone, type: 'tap', dist, dx, dy };
  }
}

/**
 * Simulate the full trajectory of a shot using fixed-step numerical integration.
 * @param {Object} launch - Output from swipeToLaunch
 * @param {number} [dt=1/120] - Integration step size in seconds
 * @param {number} [maxTime=1.6] - Maximum simulation time
 * @param {Object} [tuning=TUNING]
 * @returns {Object} { trajectory, result, zone, crossing, launch }
 */
export function simulate(launch, dt = 1 / 120, maxTime = 1.6, tuning = TUNING) {
  const trajectory = [];

  let px = launch.position.x;
  let py = launch.position.y;
  let pz = launch.position.z;

  let vx = launch.velocity.x;
  let vy = launch.velocity.y;
  let vz = launch.velocity.z;

  const spinY = (launch.spin && typeof launch.spin.y === 'number') ? launch.spin.y : 0;
  const rBall = tuning.ball.radius;
  const rPost = tuning.goal.postRadius;
  const goalHalfW = tuning.goal.width / 2; // 3.66m
  const goalH = tuning.goal.height;        // 2.44m

  const dragFactor = (0.5 * tuning.ball.dragCoeff * tuning.ball.airDensity * Math.PI * rBall * rBall) / tuning.ball.mass;
  const magnusK = tuning.ball.magnusCoeff;

  let crossedGoalPlane = false;
  let crossing = null;
  let result = 'wide';
  let zone = 'BM';

  let t = 0;

  while (t <= maxTime) {
    trajectory.push({ x: px, y: py, z: pz, vx, vy, vz, t });

    // Check crossing of the goal line (Z <= 0)
    if (!crossedGoalPlane && pz <= 0) {
      crossedGoalPlane = true;
      const prev = trajectory[trajectory.length - 2] || trajectory[0];
      // Interpolate exact crossing point where Z = 0
      const frac = prev.z / (prev.z - pz);
      const crossX = prev.x + frac * (px - prev.x);
      const crossY = prev.y + frac * (py - prev.y);
      const crossSpeed = Math.sqrt(vx * vx + vy * vy + vz * vz);
      const crossT = prev.t + frac * dt;

      crossing = {
        x: crossX,
        y: crossY,
        z: 0,
        t: crossT,
        speed: crossSpeed
      };

      zone = getZoneFromPoint(crossX, crossY, tuning);

      // Check collision with goal posts & crossbar
      // Left post: cylinder at X = -goalHalfW, Z = 0, Y in [0, goalH]
      // Right post: cylinder at X = goalHalfW, Z = 0, Y in [0, goalH]
      // Crossbar: cylinder at Y = goalH, Z = 0, X in [-goalHalfW, goalHalfW]
      const distLeftPost = Math.abs(crossX - (-goalHalfW));
      const distRightPost = Math.abs(crossX - goalHalfW);
      const distCrossbar = Math.abs(crossY - goalH);
      const collisionThreshold = rBall + rPost; // 0.17m

      const hitsLeftPost = distLeftPost <= collisionThreshold && crossY >= -0.1 && crossY <= goalH + rPost;
      const hitsRightPost = distRightPost <= collisionThreshold && crossY >= -0.1 && crossY <= goalH + rPost;
      const hitsCrossbar = distCrossbar <= collisionThreshold && crossX >= -goalHalfW - rPost && crossX <= goalHalfW + rPost;

      if (hitsLeftPost || hitsRightPost || hitsCrossbar) {
        result = 'post';
        // Post rebound physics
        vz = Math.abs(vz) * tuning.ball.reboundPost;
        if (hitsCrossbar) vy = -Math.abs(vy) * 0.7;
        if (hitsLeftPost) vx = Math.abs(vx) * 0.8;
        if (hitsRightPost) vx = -Math.abs(vx) * 0.8;
      } else if (crossY > goalH + rPost) {
        result = 'over';
      } else if (Math.abs(crossX) > goalHalfW + rPost) {
        result = 'wide';
      } else if (crossY >= 0 && Math.abs(crossX) <= goalHalfW - rPost && crossY <= goalH - rPost) {
        result = 'goal';
      } else {
        result = 'goal'; // Inside frame near edge
      }
    }

    // Ground bounce (only when ball is falling downwards into the turf)
    if (py <= rBall && vy < 0 && pz < tuning.goal.spotDistance - 0.1) {
      py = rBall;
      vy = -vy * 0.60; // Inelastic turf bounce
      vx *= 0.88;
      vz *= 0.88;
    }

    // Accelerations
    const vMag = Math.sqrt(vx * vx + vy * vy + vz * vz);
    // Aerodynamic quadratic drag
    const adx = -dragFactor * vMag * vx;
    const ady = -dragFactor * vMag * vy;
    const adz = -dragFactor * vMag * vz;

    // Lateral Magnus acceleration (spin around Y creates lateral force in X)
    const amx = magnusK * spinY * (-vz);
    const amz = -magnusK * spinY * vx;

    // Gravity
    const agy = tuning.ball.gravity;

    // Step velocities
    vx += (adx + amx) * dt;
    vy += (ady + agy) * dt;
    vz += (adz + amz) * dt;

    // Step positions
    px += vx * dt;
    py += vy * dt;
    pz += vz * dt;

    t += dt;

    // Terminate if ball has gone far behind the net or stopped
    if (pz < -tuning.goal.depth - 0.5) break;
  }

  return {
    trajectory,
    result,
    zone,
    crossing: crossing || {
      x: px,
      y: py,
      z: pz,
      t,
      speed: Math.sqrt(vx * vx + vy * vy + vz * vz)
    },
    launch
  };
}
