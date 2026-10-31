/**
 * Heading on the XZ plane.
 * Object3D local forward is −z. rotation.y > 0 turns counter-clockwise from above.
 * yaw = atan2(−dirX, −dirZ). Check: dir (0,−1) → 0; dir (+1,0) → −π/2.
 */

export function yawForFacing(dirX, dirZ) {
  const len = Math.hypot(dirX, dirZ);
  if (len < 1e-8) return 0;
  const yaw = Math.atan2(-dirX / len, -dirZ / len);
  return yaw === 0 ? 0 : yaw;
}

/**
 * Rotate a local XZ offset by a Three.js rotation.y (same matrix as Object3D).
 * x' = x cos θ + z sin θ
 * z' = −x sin θ + z cos θ
 */
export function rotateXZ(lx, lz, yaw, out) {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  out.x = lx * c + lz * s;
  out.z = -lx * s + lz * c;
  return out;
}
