/**
 * 12碼讀心戰 (Penalty Mind Game) - Prediction Model
 * Pure model logic for frequency, n-gram pattern learning, and Shannon entropy predictability.
 */

const ZONES = ['TL', 'TM', 'TR', 'BL', 'BM', 'BR'];

const ZONE_LABELS = {
  TL: '左上',
  TM: '中上',
  TR: '右上',
  BL: '左下',
  BM: '中下',
  BR: '右下'
};

const STORAGE_KEY = 'penalty_mind_game_data_v1';

class PenaltyMindModel {
  constructor(initialData = null) {
    this.zones = [...ZONES];
    this.zoneLabels = { ...ZONE_LABELS };
    this.init(initialData);
  }

  init(data = null) {
    this.storageFailed = false;
    if (data && typeof data === 'object') {
      const isValidZone = (z) => this.zones.includes(z);
      const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

      const freqValid = data.freq && typeof data.freq === 'object' &&
        this.zones.every(z => isNum(data.freq[z]) && data.freq[z] >= 0);

      const totalShotsValid = isNum(data.totalShots) && data.totalShots >= 0;
      const historyValid = Array.isArray(data.history) && data.history.every(isValidZone);

      let sumFreq = 0;
      if (freqValid) {
        for (const z of this.zones) sumFreq += data.freq[z];
      }

      if (freqValid && totalShotsValid && historyValid && sumFreq === data.totalShots) {
        this.totalShots = data.totalShots;
        this.freq = { ...this._emptyFreq(), ...data.freq };

        // Sanitize bigrams: only valid zone keys, only valid inner zone keys with numeric counts >= 0
        this.bigrams = {};
        if (data.bigrams && typeof data.bigrams === 'object') {
          for (const fromZ of this.zones) {
            if (data.bigrams[fromZ] && typeof data.bigrams[fromZ] === 'object') {
              const row = this._emptyFreq();
              for (const toZ of this.zones) {
                const val = data.bigrams[fromZ][toZ];
                row[toZ] = (isNum(val) && val >= 0) ? Math.floor(val) : 0;
              }
              this.bigrams[fromZ] = row;
            }
          }
        }

        // Sanitize trigrams: only valid zone_zone keys, only valid inner zone keys with numeric counts >= 0
        this.trigrams = {};
        if (data.trigrams && typeof data.trigrams === 'object') {
          for (const z1 of this.zones) {
            for (const z2 of this.zones) {
              const key = `${z1}_${z2}`;
              if (data.trigrams[key] && typeof data.trigrams[key] === 'object') {
                const row = this._emptyFreq();
                for (const toZ of this.zones) {
                  const val = data.trigrams[key][toZ];
                  row[toZ] = (isNum(val) && val >= 0) ? Math.floor(val) : 0;
                }
                this.trigrams[key] = row;
              }
            }
          }
        }

        this.history = [...data.history];

        // Sanitize predictions stats: non-negative integers with correct <= total
        let pTotal = (isNum(data.predictionsTotal) && data.predictionsTotal >= 0) ? Math.floor(data.predictionsTotal) : 0;
        let pCorrect = (isNum(data.predictionsCorrect) && data.predictionsCorrect >= 0) ? Math.floor(data.predictionsCorrect) : 0;
        if (pCorrect > pTotal) pCorrect = pTotal;
        this.predictionsTotal = pTotal;
        this.predictionsCorrect = pCorrect;

        // Sanitize match stats
        let mPlayed = (isNum(data.matchesPlayed) && data.matchesPlayed >= 0) ? Math.floor(data.matchesPlayed) : 0;
        let mWon = (isNum(data.matchesWon) && data.matchesWon >= 0) ? Math.floor(data.matchesWon) : 0;
        let mDrawn = (isNum(data.matchesDrawn) && data.matchesDrawn >= 0) ? Math.floor(data.matchesDrawn) : 0;
        if (mWon + mDrawn > mPlayed) {
          mWon = Math.min(mWon, mPlayed);
          mDrawn = Math.min(mDrawn, mPlayed - mWon);
        }
        this.matchesPlayed = mPlayed;
        this.matchesWon = mWon;
        this.matchesDrawn = mDrawn;
        return;
      }
    }

    // Default clean state
    this.totalShots = 0;
    this.freq = this._emptyFreq();
    this.bigrams = {};
    this.trigrams = {};
    this.history = [];
    this.predictionsTotal = 0;
    this.predictionsCorrect = 0;
    this.matchesPlayed = 0;
    this.matchesWon = 0;
    this.matchesDrawn = 0;
  }

  _emptyFreq() {
    const f = {};
    for (const z of this.zones) f[z] = 0;
    return f;
  }

  /**
   * Record a player's shot to update frequency and n-gram patterns.
   * @param {string} zone - One of the 6 zones: TL, TM, TR, BL, BM, BR
   * @param {string|null} predictedZone - Zone the keeper had predicted
   */
  recordShot(zone, predictedZone = null) {
    if (!this.zones.includes(zone)) {
      throw new Error(`Invalid zone: ${zone}`);
    }

    this.totalShots += 1;
    this.freq[zone] = (this.freq[zone] || 0) + 1;

    // Track prediction accuracy (only when a unique valid prediction was made)
    if (predictedZone && this.zones.includes(predictedZone)) {
      this.predictionsTotal += 1;
      if (predictedZone === zone) {
        this.predictionsCorrect += 1;
      }
    }

    const n = this.history.length;
    // Update Bigram (last 1 choice -> this choice)
    if (n >= 1) {
      const prev1 = this.history[n - 1];
      if (!this.bigrams[prev1]) {
        this.bigrams[prev1] = this._emptyFreq();
      }
      this.bigrams[prev1][zone] = (this.bigrams[prev1][zone] || 0) + 1;
    }

    // Update Trigram (last 2 choices -> this choice)
    if (n >= 2) {
      const prev2 = this.history[n - 2];
      const prev1 = this.history[n - 1];
      const key = `${prev2}_${prev1}`;
      if (!this.trigrams[key]) {
        this.trigrams[key] = this._emptyFreq();
      }
      this.trigrams[key][zone] = (this.trigrams[key][zone] || 0) + 1;
    }

    this.history.push(zone);
    // Limit in-memory history to last 500 shots to avoid memory leak
    if (this.history.length > 500) {
      this.history.shift();
    }
  }

  /**
   * Predict the probabilities of each zone for the upcoming shot.
   * Uses an ensemble of Uniform prior, Unigram (frequency), Bigram (Markov-1),
   * and Trigram (Markov-2).
   * @param {Array<string>} [recentShots] - Optional override of recent shots. If omitted, uses internal history.
   * @returns {{ probabilities: Object, predictedZone: string, confidence: number }}
   */
  getProbabilities(recentShots = null) {
    const hist = recentShots !== null ? recentShots : this.history;
    const n = hist.length;
    const numZones = this.zones.length;

    // 1. Uniform Prior
    const pPrior = {};
    for (const z of this.zones) pPrior[z] = 1 / numZones;

    // 2. Unigram (Frequency) with Laplace smoothing (alpha = 0.2)
    const alpha = 0.2;
    const pUnigram = {};
    let totalFreqCount = 0;
    for (const z of this.zones) {
      totalFreqCount += (this.freq[z] || 0) + alpha;
    }
    for (const z of this.zones) {
      pUnigram[z] = ((this.freq[z] || 0) + alpha) / totalFreqCount;
    }

    // 3. Bigram (conditioned on last choice)
    let pBigram = null;
    let bigramCount = 0;
    if (n >= 1) {
      const prev1 = hist[n - 1];
      if (this.bigrams[prev1]) {
        const beta = 0.1;
        pBigram = {};
        let totalBi = 0;
        for (const z of this.zones) {
          totalBi += (this.bigrams[prev1][z] || 0) + beta;
        }
        for (const z of this.zones) {
          pBigram[z] = ((this.bigrams[prev1][z] || 0) + beta) / totalBi;
        }
        for (const z of this.zones) {
          bigramCount += this.bigrams[prev1][z] || 0;
        }
      }
    }

    // 4. Trigram (conditioned on last 2 choices)
    let pTrigram = null;
    let trigramCount = 0;
    if (n >= 2) {
      const prev2 = hist[n - 2];
      const prev1 = hist[n - 1];
      const key = `${prev2}_${prev1}`;
      if (this.trigrams[key]) {
        const gamma = 0.05;
        pTrigram = {};
        let totalTri = 0;
        for (const z of this.zones) {
          totalTri += (this.trigrams[key][z] || 0) + gamma;
        }
        for (const z of this.zones) {
          pTrigram[z] = ((this.trigrams[key][z] || 0) + gamma) / totalTri;
        }
        for (const z of this.zones) {
          trigramCount += this.trigrams[key][z] || 0;
        }
      }
    }

    // Calculate dynamic ensemble weights
    // If we have little total history, uniform prior has higher weight.
    // If n-gram has observed occurrences, give substantial weight to n-grams.
    let wPrior = 0.05;
    let wUnigram = 0.35;
    let wBigram = 0;
    let wTrigram = 0;

    if (this.totalShots < 2) {
      wPrior = 0.4;
      wUnigram = 0.6;
    } else {
      if (pBigram && bigramCount > 0) {
        wBigram = Math.min(0.35, 0.15 + 0.05 * bigramCount);
      }
      if (pTrigram && trigramCount > 0) {
        wTrigram = Math.min(0.35, 0.15 + 0.08 * trigramCount);
      }
      // Rebalance unigram and prior
      const remaining = 1.0 - (wBigram + wTrigram);
      wPrior = Math.max(0.02, remaining * 0.15);
      wUnigram = remaining - wPrior;
    }

    const totalWeight = wPrior + wUnigram + wBigram + wTrigram;
    const normW0 = wPrior / totalWeight;
    const normW1 = wUnigram / totalWeight;
    const normW2 = wBigram / totalWeight;
    const normW3 = wTrigram / totalWeight;

    // Combine probabilities
    const combined = {};
    let sum = 0;
    for (const z of this.zones) {
      let prob = normW0 * pPrior[z] + normW1 * pUnigram[z];
      if (pBigram) prob += normW2 * pBigram[z];
      if (pTrigram) prob += normW3 * pTrigram[z];
      combined[z] = prob;
      sum += prob;
    }

    // Normalize so sum is exactly 1
    if (!Number.isFinite(sum) || sum <= 0) {
      for (const z of this.zones) combined[z] = 1 / numZones;
    } else {
      for (const z of this.zones) {
        combined[z] = combined[z] / sum;
      }
    }

    // Find maximum probability and check for ties
    let maxProb = -1;
    for (const z of this.zones) {
      if (Number.isFinite(combined[z]) && combined[z] > maxProb) {
        maxProb = combined[z];
      }
    }

    if (maxProb < 0) {
      for (const z of this.zones) combined[z] = 1 / numZones;
      maxProb = 1 / numZones;
    }

    // All zones within 1e-9 of max are considered tied
    const tiedZones = this.zones.filter(z => Math.abs(combined[z] - maxProb) < 1e-9);
    const isAmbiguous = tiedZones.length > 1;
    const predictedZone = isAmbiguous ? null : tiedZones[0];
    const confidence = Math.max(0, Math.min(100, Math.round(maxProb * 100)));

    return {
      probabilities: combined,
      predictedZone,
      confidence,
      isAmbiguous,
      tiedZones
    };
  }

  /**
   * Keeper decides which zone to dive to.
   * If predictions are tied, samples uniformly among tied zones without biasing to any zone.
   * Otherwise mostly follows the predicted zone with high confidence, with exploration.
   * If any invalid or undefined zone is picked, falls back to uniform sample of ZONES.
   * @param {number} explorationRate - Chance of sampling from distribution instead of argmax (default 0.12)
   * @returns {string} The chosen dive zone
   */
  chooseDiveZone(explorationRate = 0.12) {
    const prediction = this.getProbabilities();

    let chosen = null;
    // If ambiguous/tie (e.g. initial state or uniform frequencies), sample uniformly from tied zones
    if (prediction.isAmbiguous && Array.isArray(prediction.tiedZones) && prediction.tiedZones.length > 0) {
      const idx = Math.floor(Math.random() * prediction.tiedZones.length);
      chosen = prediction.tiedZones[idx];
    } else if (Math.random() > explorationRate && prediction.predictedZone) {
      chosen = prediction.predictedZone;
    } else if (prediction.probabilities) {
      // Weighted sample from distribution
      const r = Math.random();
      let cumulative = 0;
      for (const z of this.zones) {
        const prob = (typeof prediction.probabilities[z] === 'number' && Number.isFinite(prediction.probabilities[z])) ? prediction.probabilities[z] : 0;
        cumulative += prob;
        if (r <= cumulative) {
          chosen = z;
          break;
        }
      }
      if (!chosen) {
        chosen = prediction.predictedZone;
      }
    }

    // Always fallback to a valid zone in this.zones
    if (!chosen || !this.zones.includes(chosen)) {
      chosen = this.zones[Math.floor(Math.random() * this.zones.length)];
    }
    return chosen;
  }

  /**
   * Calculate Shannon Entropy over user's historical shot frequency.
   * H = - sum(p * log2(p))
   * Max entropy for 6 zones = log2(6) = 2.5849625...
   * @returns {number} Entropy in bits [0, 2.585]
   */
  getShannonEntropy() {
    if (this.totalShots === 0) {
      return Math.log2(this.zones.length); // Max entropy when no data
    }
    let entropy = 0;
    for (const z of this.zones) {
      const count = this.freq[z] || 0;
      if (count > 0) {
        const p = count / this.totalShots;
        entropy -= p * Math.log2(p);
      }
    }
    return Math.max(0, entropy);
  }

  /**
   * Calculate conditional entropy H(next | last) from the bigram Markov transitions.
   * Computes the weighted average conditional entropy H(X_t | X_{t-1}) over all observed transitions:
   * sum_u P(u) * H(X_t | X_{t-1} = u)
   * Falls back to marginal Shannon entropy if fewer than 2 shots have occurred.
   * @returns {number} Conditional entropy in bits [0, 2.585]
   */
  getConditionalEntropy() {
    let totalTransitions = 0;
    for (const fromZ of this.zones) {
      const row = this.bigrams[fromZ];
      if (row) {
        for (const toZ of this.zones) {
          totalTransitions += (row[toZ] || 0);
        }
      }
    }
    if (totalTransitions === 0) {
      return this.getShannonEntropy();
    }
    let totalWeightedEntropy = 0;
    for (const fromZ of this.zones) {
      const row = this.bigrams[fromZ];
      if (!row) continue;
      let rowCount = 0;
      for (const toZ of this.zones) {
        rowCount += (row[toZ] || 0);
      }
      if (rowCount === 0) continue;
      let rowEntropy = 0;
      for (const toZ of this.zones) {
        const count = row[toZ] || 0;
        if (count > 0) {
          const p = count / rowCount;
          rowEntropy -= p * Math.log2(p);
        }
      }
      totalWeightedEntropy += (rowCount / totalTransitions) * rowEntropy;
    }
    return Math.max(0, totalWeightedEntropy);
  }

  /**
   * Predictability Score (可預測度): 0 - 100%
   * Evaluated from 1 - H(next | last) / log2(6) based on the sequence/bigrams the keeper learns.
   * Falls back to marginal entropy if conditional history is unavailable.
   * 0% = Uniform / completely unpredictable
   * 100% = Totally predictable (pure repeated or alternating pattern)
   * @returns {number} Integer between 0 and 100
   */
  getPredictabilityScore() {
    if (this.totalShots === 0) return 0;
    const maxEntropy = Math.log2(this.zones.length);
    const entropy = this.getConditionalEntropy();
    const normalizedEntropy = Math.min(1, Math.max(0, entropy / maxEntropy));
    const score = (1 - normalizedEntropy) * 100;
    return Math.round(Math.min(100, Math.max(0, score)));
  }

  /**
   * Return description tag for predictability in Cantonese.
   */
  getPredictabilityRating(score = null) {
    const s = score !== null ? score : this.getPredictabilityScore();
    if (s >= 85) return { tag: '極易捉路 · 習慣定型', desc: '門將已經完全摸清你嘅射門套路！' };
    if (s >= 65) return { tag: '明顯偏好 · 露出破綻', desc: '你有幾招慣常射法，好容易被門將捉到。' };
    if (s >= 40) return { tag: '飄忽不定 · 偶有規律', desc: '有時會試新位，但偶爾仍會暴露習慣。' };
    if (s >= 20) return { tag: '難以捉摸 · 射法多變', desc: '射法多變，門將好難摸得清你心思！' };
    return { tag: '完全估唔到 · 毫無破綻', desc: '完全隨機分佈！門將只能靠估！' };
  }

  /**
   * Get zone frequency percentages for heatmap display.
   * @returns {Object} { TL: 25, TM: 10, ... }
   */
  getHeatmapData() {
    const data = {};
    const total = this.totalShots;
    for (const z of this.zones) {
      const count = this.freq[z] || 0;
      data[z] = {
        count,
        percent: total > 0 ? Math.round((count / total) * 100) : 0,
        label: this.zoneLabels[z]
      };
    }
    return data;
  }

  /**
   * Keeper accuracy percentage.
   */
  getKeeperAccuracy() {
    if (this.predictionsTotal === 0) return 0;
    return Math.round((this.predictionsCorrect / this.predictionsTotal) * 100);
  }

  recordMatchResult(result) {
    this.matchesPlayed += 1;
    if (result === true || result === 'win') {
      this.matchesWon += 1;
    } else if (result === 'draw') {
      this.matchesDrawn += 1;
    }
    this.saveToStorage();
  }

  exportState() {
    return {
      totalShots: this.totalShots,
      freq: { ...this.freq },
      bigrams: JSON.parse(JSON.stringify(this.bigrams)),
      trigrams: JSON.parse(JSON.stringify(this.trigrams)),
      history: [...this.history],
      predictionsTotal: this.predictionsTotal,
      predictionsCorrect: this.predictionsCorrect,
      matchesPlayed: this.matchesPlayed,
      matchesWon: this.matchesWon,
      matchesDrawn: this.matchesDrawn
    };
  }

  saveToStorage() {
    this.storageFailed = false;
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.exportState()));
      } catch (e) {
        this.storageFailed = true;
      }
    }
  }

  loadFromStorage() {
    this.storageFailed = false;
    if (typeof localStorage !== 'undefined') {
      try {
        const item = localStorage.getItem(STORAGE_KEY);
        if (item) {
          const parsed = JSON.parse(item);
          this.init(parsed);
          return true;
        }
      } catch (e) {
        this.init();
      }
    }
    return false;
  }

  resetStorage() {
    this.init();
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        this.storageFailed = true;
      }
    }
  }
}

// Export for Node (CommonJS) and browser window
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PenaltyMindModel, ZONES, ZONE_LABELS };
} else if (typeof window !== 'undefined') {
  window.PenaltyMindModel = PenaltyMindModel;
  window.ZONES = ZONES;
  window.ZONE_LABELS = ZONE_LABELS;
}
