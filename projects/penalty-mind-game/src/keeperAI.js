/**
 * 12碼讀心戰 (Penalty Mind Game v2) - Keeper AI (Pure Module)
 * Decides dive trajectory based on mental model probabilities, reaction delay,
 * and calculates physical reach-volume save / goal intersection.
 * Fully deterministic and testable in Node.
 */

import { TUNING } from './tuning.js';

// Canonical target dive coordinates on the goal plane (Z = 0)
export const DIVE_TARGETS = {
  TL: { x: -2.65, y: 1.90, anim: 'dive_TL', label: '左上' },
  TM: { x:  0.00, y: 1.85, anim: 'jump_TM', label: '中上' },
  TR: { x:  2.65, y: 1.90, anim: 'dive_TR', label: '右上' },
  BL: { x: -2.55, y: 0.50, anim: 'dive_BL', label: '左下' },
  BM: { x:  0.00, y: 0.60, anim: 'stay_BM', label: '中下' },
  BR: { x:  2.55, y: 0.50, anim: 'dive_BR', label: '右下' }
};

/**
 * Clamp value to [min, max]
 */
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function clamp01(val) {
  return Math.max(0, Math.min(1, val));
}

/**
 * Decide keeper's dive plan based on model probabilities and difficulty tier.
 * @param {Object} modelProbs - Probabilities from PenaltyMindModel.getProbabilities()
 * @param {number} [difficulty=0.5] - Difficulty factor [0, 1]
 * @param {Object} [tuning=TUNING]
 * @returns {Object} Dive plan { zone, target, reactTime, diveDuration, animName }
 */
export function decide(modelProbs, difficulty = 0.5, tuning = TUNING) {
  let diffFactor = 0.5;
  let customReact = null;
  let predictorWeight = 0.85;
  let reachMultiplier = 1.0;

  if (typeof difficulty === 'object' && difficulty !== null) {
    customReact = (difficulty.keeperReactTime !== undefined)
      ? difficulty.keeperReactTime
      : (difficulty.reactionDelay !== undefined ? difficulty.reactionDelay : null);
    predictorWeight = difficulty.predictorWeight || 0.85;
    if (difficulty.keeperReach !== undefined && tuning && tuning.keeper && tuning.keeper.gloveReachRadius) {
      reachMultiplier = difficulty.keeperReach / tuning.keeper.gloveReachRadius;
    } else {
      reachMultiplier = difficulty.reachMultiplier || 1.0;
    }
  } else if (typeof difficulty === 'number') {
    diffFactor = difficulty;
  }

  let chosenZone = 'BM';

  if (modelProbs && modelProbs.probabilities) {
    // If model has a clear predictedZone, keeper prioritises it according to predictorWeight
    if (modelProbs.predictedZone && (!modelProbs.isAmbiguous || Math.random() < predictorWeight)) {
      chosenZone = modelProbs.predictedZone;
    } else {
      // Sample according to probability distribution
      let r = Math.random();
      let cumulative = 0;
      for (const [z, p] of Object.entries(modelProbs.probabilities)) {
        cumulative += p;
        if (r <= cumulative) {
          chosenZone = z;
          break;
        }
      }
    }
  }

  const diveInfo = DIVE_TARGETS[chosenZone] || DIVE_TARGETS.BM;

  // Reaction time: faster (smaller delay) on higher difficulty
  const reactTime = customReact !== null
    ? customReact
    : (tuning.keeper.reactionDelayMax - diffFactor * (tuning.keeper.reactionDelayMax - tuning.keeper.reactionDelayMin));

  return {
    zone: chosenZone,
    target: { x: diveInfo.x, y: diveInfo.y },
    reactTime,
    diveDuration: tuning.keeper.diveDuration,
    animName: diveInfo.anim,
    label: diveInfo.label,
    reachMultiplier
  };
}

/**
 * Distance from point (px, py) to a 2D line segment between (x1, y1) and (x2, y2).
 */
function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  const t = clamp01(((px - x1) * dx + (py - y1) * dy) / lenSq);
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.hypot(px - projX, py - projY);
}

/**
 * Check whether the keeper reaches and saves the ball based on 3D trajectory and dive plan.
 * Evaluates reach capsules (torso capsule + extended arm/glove reach capsule along dive vector).
 * Decision is physically decided by reach volume intersection, NOT a random dice roll.
 * @param {Object} simResult - Output of shot.simulate()
 * @param {Object} divePlan - Output of keeperAI.decide()
 * @param {Object} [tuning=TUNING]
 * @returns {Object} { saved: boolean, saveType?: 'parry'|'catch', dist: number, contactPoint?: Object }
 */
export function checkSave(simResult, divePlan, tuning = TUNING) {
  if (!simResult || !simResult.crossing) {
    return { saved: false, reason: 'no_crossing' };
  }

  // If the shot is not on target (e.g. over crossbar, wide of post), keeper cannot save it
  if (simResult.result === 'over' || simResult.result === 'wide') {
    return { saved: false, reason: simResult.result };
  }

  const cross = simResult.crossing;
  const tCross = cross.t;
  const bx = cross.x;
  const by = cross.y;
  const bSpeed = cross.speed;

  // Keeper starting position (standing center)
  const startX = 0;
  const startY = 0.95; // torso height

  // Check how much dive the keeper has executed by the time the ball crosses Z = 0
  if (tCross <= divePlan.reactTime) {
    // Keeper has not reacted yet before ball crossed!
    const distToCenter = Math.hypot(bx - startX, by - startY);
    if (distToCenter <= tuning.keeper.bodyReachRadius) {
      return {
        saved: true,
        saveType: bSpeed > tuning.keeper.catchSpeedLimit ? 'parry' : 'catch',
        dist: distToCenter,
        contactPoint: { x: bx, y: by, z: 0 }
      };
    }
    return { saved: false, dist: distToCenter, reason: 'too_fast_unreacted' };
  }

  // Elapsed dive time
  const elapsed = tCross - divePlan.reactTime;
  const progress = clamp01(elapsed / divePlan.diveDuration);

  // Smooth quadratic ease-out dive trajectory
  const ease = 1 - (1 - progress) * (1 - progress);

  // Keeper root & glove positions at moment ball crosses
  const rootX = startX + ease * (divePlan.target.x * 0.75);
  const rootY = startY + ease * (divePlan.target.y - startY) * 0.45;
  const gloveX = startX + ease * (divePlan.target.x - startX);
  const gloveY = startY + ease * (divePlan.target.y - startY);

  // Top corner check: if shot is right in the extreme top corner at high velocity,
  // it beats the keeper even on a correct dive
  const isExtremeTopCorner = (Math.abs(bx) > 3.05 && by > 1.95);
  if (isExtremeTopCorner && bSpeed >= 28.0) {
    const distToGlove = Math.hypot(bx - gloveX, by - gloveY);
    return { saved: false, dist: distToGlove, reason: 'unstoppable_top_corner' };
  }

  // Two capsules:
  // 1. Arm/Glove capsule from torso shoulder (rootX, rootY + 0.3) to extended glove (gloveX, gloveY)
  const reachMultiplier = (divePlan && divePlan.reachMultiplier) || 1.0;

  // Hit tolerance buffers (v2-r4 forgiving reach)
  const baseTolerance = (divePlan && typeof divePlan.tolerance === 'number')
    ? divePlan.tolerance
    : ((divePlan && typeof divePlan.saveHitTolerance === 'number')
        ? divePlan.saveHitTolerance
        : ((divePlan && divePlan.isPlayer) ? (tuning.keeper.saveHitTolerance || 0) : 0));

  // Extra tolerance bonus ONLY if player keeper dived to the exact same zone as the shot
  const shotZone = simResult.zone;
  const isPlayerKeeper = !!(divePlan && divePlan.isPlayer);
  const zoneBonus = (isPlayerKeeper && shotZone && divePlan.zone === shotZone)
    ? (tuning.keeper.zoneMatchingToleranceBonus || 0)
    : 0;

  const totalTolerance = baseTolerance + zoneBonus;
  const rGlove = (tuning.keeper.gloveReachRadius * reachMultiplier) + totalTolerance;
  const distGlove = distToSegment(bx, by, rootX, rootY + 0.3, gloveX, gloveY);

  // 2. Torso/Body capsule from lower legs (rootX, 0.4) to head (rootX, rootY + 0.45)
  const rBody = (tuning.keeper.bodyReachRadius * reachMultiplier) + totalTolerance;
  const distBody = distToSegment(bx, by, rootX, 0.4, rootX, Math.max(0.7, rootY + 0.45));

  const distToReach = Math.min(distGlove, distBody);
  const isSaved = (distGlove <= rGlove) || (distBody <= rBody);

  if (isSaved) {
    // Ball within reach volume: SAVE!
    // Parry vs Catch based on velocity and distance
    const isCatch = bSpeed <= tuning.keeper.catchSpeedLimit && distGlove <= rGlove * 0.70;
    return {
      saved: true,
      saveType: isCatch ? 'catch' : 'parry',
      dist: distToReach,
      contactPoint: { x: bx, y: by, z: 0 }
    };
  }

  return {
    saved: false,
    dist: distToReach,
    reason: 'out_of_reach'
  };
}

/**
 * Resolves player goalkeeper dive plan and timing windows based on input timestamp.
 * On Easy and Medium, choosing a zone during the run-up is a pure commit and never an early dive.
 * On Hard and Hell, committing > earlyThreshold ms before strike telegraphs the dive.
 * After strike, player has a difficulty-scaled reaction window (lateDiveThresholdMs) before default to BM.
 */
export function resolvePlayerKeeperDive({
  zone = 'BM',
  now = 0,
  strikeTime = 0,
  runUpStarted = false,
  hasStruck = false,
  difficultyKey = 'MEDIUM',
  tuning = TUNING
} = {}) {
  const validZone = (zone && DIVE_TARGETS[zone]) ? zone : 'BM';
  const diveInfo = DIVE_TARGETS[validZone] || DIVE_TARGETS.BM;

  const windows = tuning.keeperWindows || {};
  const earlyThreshold = (windows.earlyDiveThresholdMs && windows.earlyDiveThresholdMs[difficultyKey]) ?? Infinity;
  const lateThreshold = (windows.lateDiveThresholdMs && windows.lateDiveThresholdMs[difficultyKey]) ?? 340;
  const diffReachMul = (windows.playerReachMultiplier && windows.playerReachMultiplier[difficultyKey]) ?? (tuning.keeper.playerReachMultiplier || 1.30);
  const diffTolerance = (windows.saveHitTolerance && windows.saveHitTolerance[difficultyKey]) ?? (tuning.keeper.saveHitTolerance || 0.20);

  const msBeforeStrike = strikeTime - now;

  let earlyDive = false;
  let lateDive = false;
  let reactTime = 0.06;
  let reachMultiplier = diffReachMul;

  // CRITICAL 1: Pure commit on Easy/Medium. Never early dive penalty.
  // On Hard/Hell: early only if run-up started and committed > earlyThreshold before strike.
  if (difficultyKey !== 'EASY' && difficultyKey !== 'MEDIUM' && runUpStarted && msBeforeStrike > earlyThreshold) {
    earlyDive = true;
    reactTime = 0.02;
    reachMultiplier = 1.0;
  } else if (hasStruck && now > strikeTime + lateThreshold) {
    lateDive = true;
    reactTime = 0.24;
    reachMultiplier = Math.max(0.75, diffReachMul * 0.70);
  }

  const divePlan = {
    zone: validZone,
    target: { x: diveInfo.x, y: diveInfo.y },
    reactTime,
    diveDuration: tuning.keeper.diveDuration,
    reachMultiplier,
    tolerance: diffTolerance,
    saveHitTolerance: diffTolerance,
    isPlayer: true,
    animName: diveInfo.anim,
    label: diveInfo.label
  };

  return {
    validZone,
    earlyDive,
    lateDive,
    divePlan
  };
}

/**
 * Functional bridge matching main.js _onPlayerKeeperDive for pure test execution.
 */
export function _onPlayerKeeperDive(zone, context = {}) {
  const {
    now = 0,
    strikeTime = 500,
    runUpStarted = true,
    hasStruck = false,
    difficultyKey = 'MEDIUM',
    tuning = TUNING
  } = context;
  return resolvePlayerKeeperDive({ zone, now, strikeTime, runUpStarted, hasStruck, difficultyKey, tuning });
}

