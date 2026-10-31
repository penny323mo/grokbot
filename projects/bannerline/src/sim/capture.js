/** Garrison must be empty, and a living enemy stack must be on the building. */
export function canStartCapture({ garrison, attackerCount, attackerOwner, buildingOwner }) {
  const g = Math.max(0, Math.floor(garrison || 0));
  const a = Math.max(0, Math.floor(attackerCount || 0));
  if (g > 0 || a <= 0) return false;
  if (!attackerOwner || !buildingOwner) return false;
  return attackerOwner !== buildingOwner;
}

/**
 * progress is 0..1. A disallowed channel resets. Completion snaps to 1.
 */
export function stepCapture(progress, dt, channelSeconds, allowed) {
  if (!allowed) return { progress: 0, done: false };
  const seconds = channelSeconds > 0 ? channelSeconds : 0.7;
  const p = Math.max(0, progress || 0) + Math.max(0, dt) / seconds;
  if (p >= 1) return { progress: 1, done: true };
  return { progress: p, done: false };
}

/** Pure result of a flip. Caller copies these fields onto the building. */
export function captureResult(newOwner, occupyCount) {
  return {
    owner: newOwner,
    count: Math.max(0, Math.floor(occupyCount || 0)),
    capture: 0,
  };
}

/**
 * Lose if the player headquarters is no longer theirs.
 * Win if it still is and the enemy headquarters has been taken.
 */
export function matchOutcome(playerHqOwner, enemyHqOwner) {
  if (playerHqOwner !== 'player') return 'lose';
  if (enemyHqOwner === 'player') return 'win';
  return null;
}
