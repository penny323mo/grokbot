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
  let chosenZone = 'BM';

  if (modelProbs && modelProbs.probabilities) {
    // If model has a clear predictedZone, keeper strongly prioritises it
    if (modelProbs.predictedZone && (!modelProbs.isAmbiguous || Math.random() < 0.85)) {
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
  const reactTime = tuning.keeper.reactionDelayMax -
    difficulty * (tuning.keeper.reactionDelayMax - tuning.keeper.reactionDelayMin);

  return {
    zone: chosenZone,
    target: { x: diveInfo.x, y: diveInfo.y },
    reactTime,
    diveDuration: tuning.keeper.diveDuration,
    animName: diveInfo.anim,
    label: diveInfo.label
  };
}

/**
 * Check whether the keeper reaches and saves the ball based on 3D trajectory and dive plan.
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

  // Keeper reach center at moment ball crosses
  const keeperX = startX + ease * (divePlan.target.x - startX);
  const keeperY = startY + ease * (divePlan.target.y - startY);

  const dist = Math.hypot(bx - keeperX, by - keeperY);

  // Base reach radius
  const reach = tuning.keeper.gloveReachRadius;

  // Top corner check: if shot is right in the extreme top corner at high velocity,
  // it beats the keeper even on a correct dive
  const isExtremeTopCorner = (Math.abs(bx) > 3.05 && by > 1.95);
  if (isExtremeTopCorner && bSpeed >= 28.0) {
    return { saved: false, dist, reason: 'unstoppable_top_corner' };
  }

  if (dist <= reach) {
    // Ball within reach volume: SAVE!
    // Parry vs Catch based on velocity and distance
    const isCatch = bSpeed <= tuning.keeper.catchSpeedLimit && dist <= reach * 0.65;
    return {
      saved: true,
      saveType: isCatch ? 'catch' : 'parry',
      dist,
      contactPoint: { x: bx, y: by, z: 0 }
    };
  }

  return {
    saved: false,
    dist,
    reason: 'out_of_reach'
  };
}
