/**
 * 12碼讀心戰 (Penalty Mind Game v2) - Taker AI (Pure Module)
 * Predicts player's goalkeeper dive habits, punishes early dives, and aims away
 * from anticipated keeper reach. Deterministic and testable in Node.
 */

import { TUNING } from './tuning.js';
import { getDifficultyConfig } from './difficulty.js';
import { DIVE_TARGETS } from './keeperAI.js';

const ZONES = ['TL', 'TM', 'TR', 'BL', 'BM', 'BR'];

// Target coordinate centers for taker aiming in each zone
export const TAKER_TARGETS = {
  TL: { x: -2.75, y: 1.95, label: '左上' },
  TM: { x:  0.00, y: 1.85, label: '中上' },
  TR: { x:  2.75, y: 1.95, label: '右上' },
  BL: { x: -2.65, y: 0.45, label: '左下' },
  BM: { x:  0.00, y: 0.55, label: '中下' },
  BR: { x:  2.65, y: 0.45, label: '右下' }
};

// Opposite zones for punishing premature early keeper dives
const OPPOSITE_ZONES = {
  TL: ['TR', 'BR', 'BL'],
  TM: ['BL', 'BR'],
  TR: ['TL', 'BL', 'BR'],
  BL: ['TR', 'BR', 'TL'],
  BM: ['TL', 'TR'],
  BR: ['TL', 'BL', 'TR']
};

export class TakerAIModel {
  constructor() {
    this.diveHistory = [];
    this.diveFreq = {};
    this.diveBigrams = {};
    this.reset();
  }

  reset() {
    this.diveHistory = [];
    this.diveFreq = {};
    this.diveBigrams = {};
    for (const z of ZONES) {
      this.diveFreq[z] = 0;
      this.diveBigrams[z] = {};
      for (const toZ of ZONES) {
        this.diveBigrams[z][toZ] = 0;
      }
    }
  }

  recordPlayerDive(zone) {
    if (!ZONES.includes(zone)) return;
    this.diveFreq[zone] = (this.diveFreq[zone] || 0) + 1;
    if (this.diveHistory.length > 0) {
      const prev = this.diveHistory[this.diveHistory.length - 1];
      if (this.diveBigrams[prev]) {
        this.diveBigrams[prev][zone] = (this.diveBigrams[prev][zone] || 0) + 1;
      }
    }
    this.diveHistory.push(zone);
  }

  // Alias for backward compatibility
  recordDive(zone) {
    this.recordPlayerDive(zone);
  }

  /**
   * Compute probability distribution of where the player goalkeeper will dive next.
   * @returns {Object} { probabilities: { TL, TM, ... }, predictedDive: string }
   */
  getDiveProbabilities() {
    const total = this.diveHistory.length;
    const K = ZONES.length;
    const probs = {};

    if (total === 0) {
      for (const z of ZONES) probs[z] = 1 / K;
      return { probabilities: probs, predictedDive: 'BM', confidence: 1 / K };
    }

    const lastDive = this.diveHistory[total - 1];
    let hasBigrams = false;
    let bigramSum = 0;

    if (lastDive && this.diveBigrams[lastDive]) {
      for (const z of ZONES) bigramSum += this.diveBigrams[lastDive][z];
      if (bigramSum >= 2) hasBigrams = true;
    }

    let maxProb = -1;
    let predictedDive = 'BM';

    for (const z of ZONES) {
      const prior = 1 / K;
      const freqP = (this.diveFreq[z] + 1) / (total + K);
      let bigramP = prior;
      if (hasBigrams) {
        bigramP = (this.diveBigrams[lastDive][z] + 1) / (bigramSum + K);
      }

      // Blend frequency and sequence
      const p = hasBigrams ? (0.25 * prior + 0.35 * freqP + 0.40 * bigramP) : (0.4 * prior + 0.6 * freqP);
      probs[z] = p;

      if (p > maxProb) {
        maxProb = p;
        predictedDive = z;
      }
    }

    // Normalize
    const sum = Object.values(probs).reduce((a, b) => a + b, 0);
    for (const z of ZONES) probs[z] /= sum;

    return {
      probabilities: probs,
      predictedDive,
      confidence: probs[predictedDive]
    };
  }

  /**
   * Decide striker shot target, speed, curve, and timing reaction.
   * @param {Object} [diffConfig=null] - Difficulty tier config
   * @param {string|null} [earlyDiveZone=null] - If player dived early, which zone
   * @param {number} [randSeed=null] - Optional deterministic seed for tests [0, 1)
   * @returns {Object} Shot plan
   */
  decideShot(diffConfig = null, earlyDiveZone = null, randSeed = null) {
    const diff = diffConfig || getDifficultyConfig('MEDIUM');
    const rng = (offset = 0) => (randSeed !== null ? (randSeed + offset) % 1.0 : Math.random());

    let targetZone = 'BR';
    let earlyPunished = false;
    let reason = 'mind_reading_aim_away';

    // 1. Early Dive Punishment Window
    // If the keeper committed too early, striker sees it and shoots into an open corner
    if (earlyDiveZone && ZONES.includes(earlyDiveZone)) {
      earlyPunished = true;
      reason = 'punished_early_dive';
      const candidateZones = OPPOSITE_ZONES[earlyDiveZone] || ['TR', 'BR', 'TL'];
      const pickIdx = Math.floor(rng(0.1) * candidateZones.length);
      targetZone = candidateZones[pickIdx];
    } else {
      // 2. Mind-Reading: Aim away from player's anticipated dive
      const diveInfo = this.getDiveProbabilities();
      const pred = diveInfo.predictedDive;

      // Find zones with the lowest dive probability (open nets)
      const sortedZones = [...ZONES].sort((a, b) => diveInfo.probabilities[a] - diveInfo.probabilities[b]);

      // At higher difficulty, striker ruthlessly picks the least anticipated zone
      if (diff.key === 'HELL' || diff.key === 'HARD') {
        targetZone = sortedZones[0]; // Lowest predicted dive
      } else {
        // Sample from the bottom 3 least anticipated zones
        const topSafe = sortedZones.slice(0, 3);
        const idx = Math.floor(rng(0.2) * topSafe.length);
        targetZone = topSafe[idx] || sortedZones[0];
      }
    }

    // 3. Map zone to continuous goal coordinates (x, y)
    const baseTarget = TAKER_TARGETS[targetZone] || TAKER_TARGETS.BM;
    let targetX = baseTarget.x;
    let targetY = baseTarget.y;

    // Corner snipes at high difficulty push closer to the extreme posts
    if (rng(0.3) < diff.takerCornerRate && targetZone !== 'TM' && targetZone !== 'BM') {
      const isLeft = targetX < 0;
      targetX = isLeft ? -3.15 : 3.15;
      targetY = targetZone.startsWith('T') ? 2.10 : 0.40;
    }

    // Occasional miss (wide or over) based on takerError
    let isOffTarget = false;
    if (rng(0.4) < diff.takerError) {
      isOffTarget = true;
      if (rng(0.5) < 0.5) {
        // Over crossbar
        targetY = TUNING.goal.height + 0.35 + rng(0.6) * 0.4;
      } else {
        // Wide of post
        targetX = (targetX < 0 ? -1 : 1) * (TUNING.goal.width / 2 + 0.45 + rng(0.7) * 0.5);
      }
    }

    // Speed scaled by difficulty
    const baseSpeed = 22.0;
    const speed = baseSpeed + (diff.key === 'HELL' ? 7.5 : diff.key === 'HARD' ? 5.5 : diff.key === 'MEDIUM' ? 3.0 : 0.5) + (rng(0.8) - 0.5) * 2.0;

    // Curve
    const isCurving = (targetZone === 'TL' || targetZone === 'BL') ? -1 : (targetZone === 'TR' || targetZone === 'BR') ? 1 : 0;
    const curve = isCurving * (0.15 + rng(0.9) * 0.35);

    return {
      targetZone,
      targetPoint: { x: targetX, y: targetY },
      target: { x: targetX, y: targetY },
      speed,
      curve,
      earlyPunished,
      isOffTarget,
      reason,
      divePrediction: this.getDiveProbabilities()
    };
  }
}
