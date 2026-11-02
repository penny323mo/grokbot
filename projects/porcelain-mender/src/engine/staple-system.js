// src/engine/staple-system.js - Staple placement, spacing evaluation, and water test physics

/**
 * Computes Euclidean distance between two points
 */
export function pointDistance(p1, p2) {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

/**
 * Evaluates staple layout against piece requirements.
 * Rewards even spacing and optimal count; penalizes too few (< min) and too many (> max).
 * 
 * @param {Object} pieceConfig - { minStaples, maxStaples, optimalStaples, crackLength }
 * @param {Array} staples - Array of placed staples [{ x, y, crackId, angle }]
 * @param {Array} crackEdges - The crack boundaries of the piece
 * @returns {Object} { score (0-100), rating ('perfect'|'good'|'leaky'), watertight: boolean, message: string }
 */
export function evaluateStaples(pieceConfig, staples = [], crackEdges = []) {
  const { minStaples = 3, maxStaples = 8, optimalStaples = 5 } = pieceConfig;
  const count = staples.length;

  // 1. Count penalty/reward
  if (count < minStaples) {
    const deficit = minStaples - count;
    const score = Math.max(10, 50 - deficit * 15);
    return {
      score,
      rating: 'leaky',
      watertight: false,
      leakRate: 0.6,
      brassUsed: count,
      message: `鋦釘過少（僅 ${count} 枚，至少需 ${minStaples} 枚）。縫隙無力鎖緊，試水大量滲漏。`
    };
  }

  if (count > maxStaples) {
    const surplus = count - maxStaples;
    const score = Math.max(30, 70 - surplus * 10);
    return {
      score,
      rating: 'overcrowded',
      watertight: true,
      leakRate: 0.0,
      brassUsed: count,
      message: `鋦釘過密（用了 ${count} 枚，最多 ${maxStaples} 枚）。耗損過多黃銅，器身密密麻麻，略顯俗氣。`
    };
  }

  // 2. Count score (bell curve around optimalStaples)
  const countDiff = Math.abs(count - optimalStaples);
  let baseScore = 80 - countDiff * 8; // 80 for optimal, 72 for off-by-1

  // 3. Spacing analysis
  // If multiple staples, compute distance between all adjacent pairs
  if (count >= 2) {
    const distances = [];
    for (let i = 0; i < count; i++) {
      let minDist = Infinity;
      for (let j = 0; j < count; j++) {
        if (i === j) continue;
        const d = pointDistance(staples[i], staples[j]);
        if (d < minDist) minDist = d;
      }
      distances.push(minDist);
    }

    // Check for staples placed too close to each other (e.g. < 25px, clashing holes)
    const tooClose = distances.filter(d => d < 25).length;
    if (tooClose > 0) {
      baseScore -= tooClose * 8;
    }

    // Measure variance / standard deviation of inter-staple distances
    const avgDist = distances.reduce((a, b) => a + b, 0) / distances.length;
    const variance = distances.reduce((acc, d) => acc + Math.pow(d - avgDist, 2), 0) / distances.length;
    const stdDev = Math.sqrt(variance);

    // Uniformity factor (smaller stdDev relative to avgDist = more even)
    const uniformity = Math.max(0, 1 - stdDev / (avgDist || 1));
    const uniformityBonus = uniformity * 20;
    baseScore += uniformityBonus;
  } else {
    baseScore = 40;
  }

  const finalScore = Math.min(100, Math.max(0, Math.round(baseScore)));

  if (finalScore >= 88) {
    return {
      score: finalScore,
      rating: 'perfect',
      watertight: true,
      leakRate: 0.0,
      brassUsed: count,
      message: `釘距勻稱，咬合緊固，滴水不漏！乃大師級『金絲鐵骨』手藝。`
    };
  } else if (finalScore >= 70) {
    return {
      score: finalScore,
      rating: 'good',
      watertight: true,
      leakRate: 0.05,
      brassUsed: count,
      message: `接合堅固，水流僅在微隙有微潤水汽，街坊已甚是滿意。`
    };
  } else {
    return {
      score: finalScore,
      rating: 'leaky',
      watertight: false,
      leakRate: 0.35,
      brassUsed: count,
      message: `釘位分佈欠勻，局部受力不均，仍有微漏。`
    };
  }
}
