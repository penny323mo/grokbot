/**
 * js/model.js - Mathematical Core for Odds Lab (盤口實驗室)
 * Pure functions: Odds conversion, Poisson / Dixon-Coles modeling,
 * score matrices, Asian handicap probabilities & settlement,
 * Kelly criterion, CLV, and walk-forward backtesting.
 * Usable in browser (window.OddsModel) and Node (module.exports).
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.OddsModel = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // --- 1. Odds Helpers ---

  function oddsToProb(odds) {
    if (!odds || odds <= 1) return 0;
    return 1 / odds;
  }

  function fairOdds(prob) {
    if (!prob || prob <= 0) return Infinity;
    return 1 / prob;
  }

  function calcOverround(oddsArray) {
    if (!Array.isArray(oddsArray) || oddsArray.length === 0) return 1.0;
    let sum = 0;
    for (let i = 0; i < oddsArray.length; i++) {
      if (oddsArray[i] > 1) {
        sum += 1 / oddsArray[i];
      }
    }
    return sum;
  }

  function removeMarginProportional(oddsArray) {
    if (!Array.isArray(oddsArray) || oddsArray.length === 0) return [];
    const rawProbs = oddsArray.map(o => (o > 1 ? 1 / o : 0));
    const sum = rawProbs.reduce((a, b) => a + b, 0);
    if (sum <= 0) return rawProbs;
    return rawProbs.map(p => p / sum);
  }

  function removeMarginPower(oddsArray) {
    if (!Array.isArray(oddsArray) || oddsArray.length === 0) return [];
    const rawProbs = oddsArray.map(o => (o > 1 ? 1 / o : 0));
    const sum = rawProbs.reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 1.0) < 1e-7 || sum <= 0) return rawProbs;

    // Power method: find k such that sum( (1/o_i)^k ) = 1
    let low = 0.5;
    let high = 5.0;
    let k = 1.0;
    for (let iter = 0; iter < 40; iter++) {
      k = (low + high) / 2;
      let s = 0;
      for (let i = 0; i < rawProbs.length; i++) {
        if (rawProbs[i] > 0) s += Math.pow(rawProbs[i], k);
      }
      if (Math.abs(s - 1.0) < 1e-9) break;
      if (s > 1.0) {
        low = k;
      } else {
        high = k;
      }
    }
    const adjusted = rawProbs.map(p => (p > 0 ? Math.pow(p, k) : 0));
    const adjSum = adjusted.reduce((a, b) => a + b, 0);
    return adjusted.map(p => p / adjSum);
  }

  function removeMargin(oddsArray, method) {
    if (method === 'power') {
      return removeMarginPower(oddsArray);
    }
    return removeMarginProportional(oddsArray);
  }

  // --- 2. Poisson & Dixon-Coles Mathematics ---

  const FACTORIAL_CACHE = [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800, 39916800, 479001600];

  function factorial(n) {
    if (n < 0) return 1;
    if (n < FACTORIAL_CACHE.length) return FACTORIAL_CACHE[n];
    let res = FACTORIAL_CACHE[FACTORIAL_CACHE.length - 1];
    for (let i = FACTORIAL_CACHE.length; i <= n; i++) res *= i;
    return res;
  }

  function poissonProb(k, lambda) {
    if (lambda <= 0) return k === 0 ? 1 : 0;
    if (k < 0) return 0;
    return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
  }

  function dcTau(x, y, lh, la, rho) {
    if (x === 0 && y === 0) return 1 - lh * la * rho;
    if (x === 0 && y === 1) return 1 + lh * rho;
    if (x === 1 && y === 0) return 1 + la * rho;
    if (x === 1 && y === 1) return 1 - rho;
    return 1;
  }

  function calcScoreMatrix(lambdaHome, lambdaAway, rho, maxGoals) {
    if (rho === undefined) rho = -0.05;
    if (maxGoals === undefined) maxGoals = 10;
    const lh = Math.max(0.01, lambdaHome);
    const la = Math.max(0.01, lambdaAway);

    const pH = new Float64Array(maxGoals + 1);
    const pA = new Float64Array(maxGoals + 1);
    for (let i = 0; i <= maxGoals; i++) {
      pH[i] = poissonProb(i, lh);
      pA[i] = poissonProb(i, la);
    }

    const matrix = [];
    let sum = 0;
    for (let h = 0; h <= maxGoals; h++) {
      const row = new Float64Array(maxGoals + 1);
      for (let a = 0; a <= maxGoals; a++) {
        const tau = Math.max(0, dcTau(h, a, lh, la, rho));
        const val = tau * pH[h] * pA[a];
        row[a] = val;
        sum += val;
      }
      matrix.push(row);
    }

    // Normalize so sum === 1.0 (exact to +- 1e-9)
    if (sum > 0) {
      const invSum = 1 / sum;
      for (let h = 0; h <= maxGoals; h++) {
        for (let a = 0; a <= maxGoals; a++) {
          matrix[h][a] *= invSum;
        }
      }
    }
    return matrix;
  }

  // --- 3. Derived Markets ---

  function derive1X2(matrix) {
    let home = 0;
    let draw = 0;
    let away = 0;
    const maxGoals = matrix.length - 1;
    for (let h = 0; h <= maxGoals; h++) {
      for (let a = 0; a <= maxGoals; a++) {
        const p = matrix[h][a];
        if (h > a) home += p;
        else if (h === a) draw += p;
        else away += p;
      }
    }
    const tot = home + draw + away;
    if (tot > 0) {
      home /= tot;
      draw /= tot;
      away /= tot;
    }
    return {
      home,
      draw,
      away,
      fairHome: fairOdds(home),
      fairDraw: fairOdds(draw),
      fairAway: fairOdds(away)
    };
  }

  function deriveOU(matrix, lines) {
    if (!lines) lines = [0.5, 1.5, 2.5, 3.5, 4.5];
    const maxGoals = matrix.length - 1;
    const results = {};
    for (let l = 0; l < lines.length; l++) {
      const line = lines[l];
      let over = 0;
      let under = 0;
      for (let h = 0; h <= maxGoals; h++) {
        for (let a = 0; a <= maxGoals; a++) {
          const tot = h + a;
          const p = matrix[h][a];
          if (tot > line) over += p;
          else under += p;
        }
      }
      results[line] = {
        line,
        over,
        under,
        overFair: fairOdds(over),
        underFair: fairOdds(under)
      };
    }
    return results;
  }

  function deriveBTTS(matrix) {
    let yes = 0;
    let no = 0;
    const maxGoals = matrix.length - 1;
    for (let h = 0; h <= maxGoals; h++) {
      for (let a = 0; a <= maxGoals; a++) {
        const p = matrix[h][a];
        if (h >= 1 && a >= 1) yes += p;
        else no += p;
      }
    }
    return {
      yes,
      no,
      yesFair: fairOdds(yes),
      noFair: fairOdds(no)
    };
  }

  function deriveExpectedGoals(matrix) {
    let xgH = 0;
    let xgA = 0;
    const maxGoals = matrix.length - 1;
    for (let h = 0; h <= maxGoals; h++) {
      for (let a = 0; a <= maxGoals; a++) {
        const p = matrix[h][a];
        xgH += h * p;
        xgA += a * p;
      }
    }
    return { home: xgH, away: xgA };
  }

  function deriveMostLikelyScores(matrix, topN) {
    if (topN === undefined) topN = 5;
    const maxGoals = matrix.length - 1;
    const list = [];
    for (let h = 0; h <= maxGoals; h++) {
      for (let a = 0; a <= maxGoals; a++) {
        list.push({
          home: h,
          away: a,
          score: `${h}-${a}`,
          prob: matrix[h][a],
          fairOdds: fairOdds(matrix[h][a])
        });
      }
    }
    list.sort((a, b) => b.prob - a.prob);
    return list.slice(0, topN);
  }

  // --- 4. Asian Handicap Settlement & Probabilities ---

  function settleSubLine(diff, subLine, odds) {
    const x = diff + subLine;
    if (x > 0) return odds; // full win
    if (x === 0) return 1.0; // push (stake returned)
    return 0.0; // loss
  }

  function settleAH(goalDiffHome, line, odds) {
    if (odds === undefined) odds = 2.0;
    const d = goalDiffHome;
    const l = Math.round(line * 4) / 4;

    // Check if quarter line (e.g. -0.75, -0.25, +0.25, +0.75)
    const isQuarter = Math.abs((l * 2) % 1) > 1e-6;
    if (isQuarter) {
      const l1 = l - 0.25;
      const l2 = l + 0.25;
      const m1 = settleSubLine(d, l1, odds);
      const m2 = settleSubLine(d, l2, odds);
      return 0.5 * m1 + 0.5 * m2;
    } else {
      return settleSubLine(d, l, odds);
    }
  }

  function settleAHOutcome(goalDiffHome, line) {
    const mult = settleAH(goalDiffHome, line, 2.0);
    if (mult === 2.0) return 'win';
    if (mult === 1.5) return 'half_win';
    if (mult === 1.0) return 'push';
    if (mult === 0.5) return 'half_loss';
    return 'loss';
  }

  function calcAHProbs(matrix, line) {
    const l = Math.round(line * 4) / 4;
    const maxGoals = matrix.length - 1;
    let pWin = 0;
    let pHalfWin = 0;
    let pPush = 0;
    let pHalfLoss = 0;
    let pLoss = 0;

    for (let h = 0; h <= maxGoals; h++) {
      for (let a = 0; a <= maxGoals; a++) {
        const prob = matrix[h][a];
        const diff = h - a;
        const outcome = settleAHOutcome(diff, l);
        if (outcome === 'win') pWin += prob;
        else if (outcome === 'half_win') pHalfWin += prob;
        else if (outcome === 'push') pPush += prob;
        else if (outcome === 'half_loss') pHalfLoss += prob;
        else pLoss += prob;
      }
    }

    const homeProbs = {
      win: pWin,
      halfWin: pHalfWin,
      push: pPush,
      halfLoss: pHalfLoss,
      loss: pLoss
    };

    // Away is symmetric reflection
    const awayProbs = {
      win: pLoss,
      halfWin: pHalfLoss,
      push: pPush,
      halfLoss: pHalfWin,
      loss: pWin
    };

    // EV for Home at odds O:
    // Payout = win*O + halfWin*(1 + (O-1)/2) + push*1 + halfLoss*0.5 + loss*0
    // Profit = Payout - 1
    // Fair price is O where Profit = 0
    // O * (win + 0.5 * halfWin) + (0.5 * halfWin + push + 0.5 * halfLoss) = 1
    const homeW = pWin + 0.5 * pHalfWin;
    const homeR = 0.5 * pHalfWin + pPush + 0.5 * pHalfLoss;
    const fairHome = homeW > 0 ? (1 - homeR) / homeW : Infinity;

    const awayW = awayProbs.win + 0.5 * awayProbs.halfWin;
    const awayR = 0.5 * awayProbs.halfWin + awayProbs.push + 0.5 * awayProbs.halfLoss;
    const fairAway = awayW > 0 ? (1 - awayR) / awayW : Infinity;

    return {
      line: l,
      home: homeProbs,
      away: awayProbs,
      fairHome,
      fairAway,
      evHome: (odds) => odds * homeW + homeR - 1,
      evAway: (odds) => odds * awayW + awayR - 1
    };
  }

  function calcAHTable(matrix, minLine, maxLine, step) {
    if (minLine === undefined) minLine = -2.0;
    if (maxLine === undefined) maxLine = 2.0;
    if (step === undefined) step = 0.25;

    const rows = [];
    let bestFairDiff = Infinity;
    let fairLine = 0;

    for (let l = minLine; l <= maxLine + 1e-6; l += step) {
      const line = Math.round(l * 4) / 4;
      const res = calcAHProbs(matrix, line);
      const diff = Math.abs(res.fairHome - res.fairAway);
      if (diff < bestFairDiff) {
        bestFairDiff = diff;
        fairLine = line;
      }
      rows.push(res);
    }

    return {
      rows,
      fairLine,
      minLine,
      maxLine
    };
  }

  // --- 5. Kelly Criterion ---

  function calcKelly(prob, odds, fraction, cap) {
    if (fraction === undefined) fraction = 0.25;
    if (cap === undefined) cap = 0.5;
    if (!odds || odds <= 1 || !prob || prob <= 0) {
      return { fullKelly: 0, fracKelly: 0, edge: -1, recommendedStake: () => 0 };
    }
    const b = odds - 1;
    const q = 1 - prob;
    const fStar = (b * prob - q) / b;
    const clampedFStar = Math.max(0, fStar);
    const fracK = Math.min(cap, clampedFStar * fraction);
    const edge = prob * odds - 1;

    return {
      fullKelly: clampedFStar,
      fracKelly: fracK,
      edge,
      recommendedStake: (bankroll) => Math.max(0, Math.round(bankroll * fracK * 100) / 100)
    };
  }

  function calcAHKelly(ahProbs, odds, fraction, cap) {
    if (fraction === undefined) fraction = 0.25;
    if (cap === undefined) cap = 0.5;
    if (!odds || odds <= 1) return { fullKelly: 0, fracKelly: 0, edge: -1, recommendedStake: () => 0 };

    const { win, halfWin, push, halfLoss, loss } = ahProbs;
    const b = odds - 1;
    const ev = odds * (win + 0.5 * halfWin) + (0.5 * halfWin + push + 0.5 * halfLoss) - 1;
    if (ev <= 0) {
      return { fullKelly: 0, fracKelly: 0, edge: ev, recommendedStake: () => 0 };
    }

    // Expected log growth: g(f) = E[ln(1 + f * profit)]
    // g'(f) = win*b/(1+f*b) + halfWin*(b/2)/(1+f*b/2) - halfLoss*0.5/(1-0.5f) - loss/(1-f)
    function gPrime(f) {
      const t1 = (win * b) / (1 + f * b);
      const t2 = (halfWin * (b * 0.5)) / (1 + f * b * 0.5);
      const t3 = (halfLoss * 0.5) / (1 - 0.5 * f);
      const t4 = loss / (1 - f);
      return t1 + t2 - t3 - t4;
    }

    let low = 0.0;
    let high = 0.99;
    let fStar = 0.0;
    for (let iter = 0; iter < 30; iter++) {
      fStar = (low + high) / 2;
      const val = gPrime(fStar);
      if (Math.abs(val) < 1e-6) break;
      if (val > 0) low = fStar;
      else high = fStar;
    }

    const fracK = Math.min(cap, fStar * fraction);
    return {
      fullKelly: fStar,
      fracKelly: fracK,
      edge: ev,
      recommendedStake: (bankroll) => Math.max(0, Math.round(bankroll * fracK * 100) / 100)
    };
  }

  // --- 6. Closing Line Value (CLV) ---

  function calcCLV(takenOdds, closingSharpOddsArray, marginMethod, selectionIndex) {
    if (selectionIndex === undefined) selectionIndex = 0;
    if (marginMethod === undefined) marginMethod = 'proportional';
    if (!takenOdds || takenOdds <= 1 || !Array.isArray(closingSharpOddsArray) || closingSharpOddsArray.length === 0) {
      return 0;
    }
    const fairProbs = removeMargin(closingSharpOddsArray, marginMethod);
    const pFair = fairProbs[selectionIndex] || 0;
    if (pFair <= 0) return 0;
    const closingFairOdds = 1 / pFair;
    return takenOdds / closingFairOdds - 1;
  }

  // --- 7. Team Strength Model (Dixon-Coles / Poisson with Time Decay) ---

  function fitDixonColes(matches, teamCount, options) {
    options = options || {};
    const halfLifeDays = options.halfLifeDays || 180;
    const iterations = options.iterations || 160;
    const lr = options.learningRate || 0.12;
    const tau = options.priorWeight || 8.0;
    const rho = options.rho !== undefined ? options.rho : -0.05;
    const momentum = 0.6;
    const N = teamCount;

    let asOfTime = null;
    if (options.asOfDate) {
      asOfTime = new Date(options.asOfDate).getTime();
    } else if (options.anchorDate) {
      asOfTime = new Date(options.anchorDate).getTime();
    } else {
      let maxT = 0;
      for (let i = 0; i < matches.length; i++) {
        const t = new Date(matches[i][0]).getTime();
        if (t > maxT) maxT = t;
      }
      asOfTime = maxT || new Date('2026-10-25').getTime();
    }

    // Filter matches and compute decay weights anchored at asOfTime
    const decayConst = Math.LN2 / (halfLifeDays * 86400000);
    const validMatches = [];
    const teamW = new Float64Array(N);
    const pastSeasonMatches = new Int32Array(N);

    // Cutoff to distinguish promoted teams without prior top-flight experience
    const cutoff = asOfTime >= new Date('2026-08-01').getTime()
      ? new Date('2026-08-01').getTime()
      : (asOfTime >= new Date('2025-08-01').getTime() ? new Date('2025-08-01').getTime() : 0);

    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];
      const mDate = new Date(m[0]).getTime();
      // Strict walk-forward holdout: matches on or after asOfDate are never used
      if (options.asOfDate && mDate >= asOfTime) continue;

      const diff = Math.max(0, asOfTime - mDate);
      const weight = Math.exp(-diff * decayConst);
      validMatches.push({
        home: m[1],
        away: m[2],
        fthg: m[3],
        ftag: m[4],
        weight
      });
      teamW[m[1]] += weight;
      teamW[m[2]] += weight;

      if (cutoff > 0 && mDate < cutoff) {
        pastSeasonMatches[m[1]]++;
        pastSeasonMatches[m[2]]++;
      }
    }

    if (validMatches.length === 0) {
      const emptyAlpha = new Float64Array(N);
      const emptyBeta = new Float64Array(N);
      return {
        alpha: emptyAlpha,
        beta: emptyBeta,
        homeAdv: 0.28,
        mu: 0.25,
        rho,
        predict: () => ({ lambdaHome: 1.35, lambdaAway: 1.15 })
      };
    }

    // Promoted teams prior: teams with no prior top-flight history shrink toward
    // below-average ratings (average rating of relegated/bottom-3 teams: alpha ~ -0.22, beta ~ -0.20)
    const priorAlpha = new Float64Array(N);
    const priorBeta = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      if (cutoff > 0 && pastSeasonMatches[i] === 0) {
        priorAlpha[i] = -0.22;
        priorBeta[i] = -0.20;
      } else {
        priorAlpha[i] = 0.0;
        priorBeta[i] = 0.0;
      }
    }

    const alpha = new Float64Array(N);
    const beta = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      alpha[i] = priorAlpha[i];
      beta[i] = priorBeta[i];
    }

    const v_alpha = new Float64Array(N);
    const v_beta = new Float64Array(N);
    let homeAdv = 0.25;
    let mu = 0.20;

    for (let it = 0; it < iterations; it++) {
      const g_alpha = new Float64Array(N);
      const g_beta = new Float64Array(N);
      let g_home = 0;
      let g_mu = 0;
      let totalW = 0;

      for (let k = 0; k < validMatches.length; k++) {
        const item = validMatches[k];
        const h = item.home;
        const a = item.away;
        const w = item.weight;
        totalW += w;

        const lh = Math.exp(Math.max(-3, Math.min(3, mu + homeAdv + alpha[h] - beta[a])));
        const la = Math.exp(Math.max(-3, Math.min(3, mu + alpha[a] - beta[h])));

        const dh = w * (item.fthg - lh);
        const da = w * (item.ftag - la);

        g_alpha[h] += dh;
        g_beta[a] -= dh;
        g_alpha[a] += da;
        g_beta[h] -= da;

        g_home += dh;
        g_mu += dh + da;
      }

      mu += (lr * g_mu) / Math.max(1, totalW * 2);
      homeAdv += (lr * g_home) / Math.max(1, totalW);

      // Penalty scaled on data gradient per team: (g - tau*(param - prior)) / (teamW + tau)
      for (let i = 0; i < N; i++) {
        const denom = teamW[i] + tau;
        const stepA = (g_alpha[i] - tau * (alpha[i] - priorAlpha[i])) / denom;
        const stepB = (g_beta[i] - tau * (beta[i] - priorBeta[i])) / denom;

        v_alpha[i] = momentum * v_alpha[i] + lr * stepA;
        alpha[i] += v_alpha[i];

        v_beta[i] = momentum * v_beta[i] + lr * stepB;
        beta[i] += v_beta[i];
      }

      // Re-center alpha of established teams around 0
      let sumEst = 0;
      let countEst = 0;
      for (let i = 0; i < N; i++) {
        if (cutoff === 0 || pastSeasonMatches[i] > 0) {
          sumEst += alpha[i];
          countEst++;
        }
      }
      const meanEst = countEst > 0 ? sumEst / countEst : 0;
      for (let i = 0; i < N; i++) alpha[i] -= meanEst;
    }

    return {
      alpha,
      beta,
      homeAdv,
      mu,
      rho,
      predict: function (homeId, awayId) {
        const aH = alpha[homeId] || 0;
        const bA = beta[awayId] || 0;
        const aA = alpha[awayId] || 0;
        const bH = beta[homeId] || 0;
        const lh = Math.exp(mu + homeAdv + aH - bA);
        const la = Math.exp(mu + aA - bH);
        return {
          lambdaHome: Math.max(0.2, Math.min(6.0, lh)),
          lambdaAway: Math.max(0.2, Math.min(6.0, la))
        };
      }
    };
  }

  // --- 8. Backtest Engine ---

  function runBacktest(matches, teams, options) {
    options = options || {};
    const teamCount = typeof teams === 'number' ? teams : (teams && teams.length ? teams.length : 20);
    const seasonFilter = options.season || '2526'; // '2526', '2627', '2526_2627', or 'all'
    const market = options.market || '1x2'; // '1x2', 'ah', 'ou25'
    const oddsType = options.oddsType || 'open'; // 'open' or 'close'
    const edgeThreshold = options.edgeThreshold !== undefined ? options.edgeThreshold : 0.03;
    const maxEdge = options.maxEdge !== undefined ? options.maxEdge : 0.35; // Cap implausible Poisson tails
    const staking = options.staking || 'flat'; // 'flat' or 'kelly'
    const kellyFraction = options.kellyFraction || 0.25;
    const initialBankroll = options.initialBankroll || 100;
    const halfLifeDays = options.halfLifeDays || 180;
    const marginMethod = options.marginMethod || 'proportional';

    // Filter matches to test per season filter (Issue 11: 近兩季 = 2526 + 2627)
    const testMatches = matches.filter(m => {
      if (seasonFilter === '2526') return m[7] === '2526';
      if (seasonFilter === '2627') return m[7] === '2627';
      if (seasonFilter === '2526_2627' || seasonFilter === 'all') return m[7] === '2526' || m[7] === '2627';
      return true;
    });

    if (testMatches.length === 0) {
      return {
        totalBets: 0,
        hitRate: 0,
        roi: 0,
        profit: 0,
        maxDrawdown: 0,
        avgCLV: 0,
        beatCloseRate: 0,
        bankrollCurve: [{ index: 0, bankroll: initialBankroll, profit: 0 }],
        bets: []
      };
    }

    // Walk-forward fitting: fit models at regular intervals (every 15 matches)
    const refitInterval = 15;
    let currentModel = null;
    let lastRefitIdx = -999;

    let bankroll = initialBankroll;
    let peakBankroll = initialBankroll;
    let maxDrawdown = 0;
    let wins = 0;
    let totalBets = 0;
    let totalStaked = 0;
    let totalReturn = 0;
    let clvSum = 0;
    let beatCloseCount = 0;

    const curve = [{ index: 0, bankroll: initialBankroll, profit: 0 }];
    const betRecords = [];

    for (let i = 0; i < testMatches.length; i++) {
      const match = testMatches[i];
      const matchDate = match[0];
      const homeId = match[1];
      const awayId = match[2];
      const fthg = match[3];
      const ftag = match[4];

      // Walk-forward refit check
      if (!currentModel || i - lastRefitIdx >= refitInterval) {
        currentModel = fitDixonColes(matches, teamCount, {
          asOfDate: matchDate,
          halfLifeDays,
          iterations: 120
        });
        lastRefitIdx = i;
      }

      const { lambdaHome, lambdaAway } = currentModel.predict(homeId, awayId);
      // Issue 19: Use maxGoals 10 in backtest to match the lab
      const matrix = calcScoreMatrix(lambdaHome, lambdaAway, currentModel.rho, 10);

      let betPlaced = false;
      let selectionName = '';
      let takenOdds = 0;
      let sharpClosingOdds = [];
      let selectionIdx = 0;
      let modelProb = 0;
      let isAHMarket = false;
      let ahLine = 0;
      let ahProbs = null;

      if (market === '1x2') {
        const m1x2 = derive1X2(matrix);
        const bookieH = oddsType === 'open' ? match[8] : match[11];
        const bookieD = oddsType === 'open' ? match[9] : match[12];
        const bookieA = oddsType === 'open' ? match[10] : match[13];

        sharpClosingOdds = [match[24], match[25], match[26]]; // sharp closing 1X2

        const edges = [
          { name: '主勝', idx: 0, odds: bookieH, prob: m1x2.home, edge: m1x2.home * bookieH - 1 },
          { name: '和局', idx: 1, odds: bookieD, prob: m1x2.draw, edge: m1x2.draw * bookieD - 1 },
          { name: '客勝', idx: 2, odds: bookieA, prob: m1x2.away, edge: m1x2.away * bookieA - 1 }
        ];

        // Pick highest edge above threshold (and cap edge if applicable to curb longshot bias)
        edges.sort((a, b) => b.edge - a.edge);
        const best = edges[0];
        if (best.odds > 1 && best.edge >= edgeThreshold && (maxEdge <= 0 || best.edge <= maxEdge)) {
          betPlaced = true;
          selectionName = best.name;
          takenOdds = best.odds;
          selectionIdx = best.idx;
          modelProb = best.prob;
        }
      } else if (market === 'ou25') {
        const mou = deriveOU(matrix, [2.5])[2.5];
        const bookieO = oddsType === 'open' ? match[14] : match[16];
        const bookieU = oddsType === 'open' ? match[15] : match[17];
        // Issue 20: Use sharp closing totals if present
        const sharpCloseO = match[27] || match[16] || bookieO;
        const sharpCloseU = match[28] || match[17] || bookieU;
        sharpClosingOdds = [sharpCloseO, sharpCloseU];

        const edges = [
          { name: '大波 (Over 2.5)', idx: 0, odds: bookieO, prob: mou.over, edge: mou.over * bookieO - 1 },
          { name: '細波 (Under 2.5)', idx: 1, odds: bookieU, prob: mou.under, edge: mou.under * bookieU - 1 }
        ];
        edges.sort((a, b) => b.edge - a.edge);
        const best = edges[0];
        if (best.odds > 1 && best.edge >= edgeThreshold && (maxEdge <= 0 || best.edge <= maxEdge)) {
          betPlaced = true;
          selectionName = best.name;
          takenOdds = best.odds;
          selectionIdx = best.idx;
          modelProb = best.prob;
        }
      } else if (market === 'ah') {
        // Asian handicap market
        const line = oddsType === 'open' ? match[18] : match[21];
        const bookieH = oddsType === 'open' ? match[19] : match[22];
        const bookieA = oddsType === 'open' ? match[20] : match[23];
        // Issue 20: Use sharp closing AH odds if present
        const closeH = match[29] || match[22] || bookieH;
        const closeA = match[30] || match[23] || bookieA;
        sharpClosingOdds = [closeH, closeA];

        if (line !== null && bookieH > 1 && bookieA > 1) {
          const ah = calcAHProbs(matrix, line);
          const evH = ah.evHome(bookieH);
          const evA = ah.evAway(bookieA);

          const edges = [
            { name: `主隊 (${line > 0 ? '+' : ''}${line})`, idx: 0, odds: bookieH, ev: evH, probs: ah.home, line: line },
            { name: `客隊 (${-line > 0 ? '+' : ''}${-line})`, idx: 1, odds: bookieA, ev: evA, probs: ah.away, line: -line }
          ];
          edges.sort((a, b) => b.ev - a.ev);
          const best = edges[0];
          if (best.ev >= edgeThreshold && (maxEdge <= 0 || best.ev <= maxEdge)) {
            betPlaced = true;
            selectionName = best.name;
            takenOdds = best.odds;
            selectionIdx = best.idx;
            isAHMarket = true;
            ahLine = line; // line from home perspective
            ahProbs = best.probs;
            modelProb = best.probs.win + 0.5 * best.probs.halfWin;
          }
        }
      }

      if (betPlaced) {
        // Issue 12: Kelly stake calculation with safe min(bankroll, stake) and drop 0.1 floor
        let stake = 1.0;
        if (staking === 'kelly') {
          if (isAHMarket) {
            const k = calcAHKelly(ahProbs, takenOdds, kellyFraction, 0.2);
            stake = k.recommendedStake(bankroll);
          } else {
            const k = calcKelly(modelProb, takenOdds, kellyFraction, 0.2);
            stake = k.recommendedStake(bankroll);
          }
          stake = Math.min(bankroll, stake);
          if (stake <= 0) continue; // Skip bet if bankroll is depleted or stake rounds to 0
        }

        totalBets++;
        totalStaked += stake;

        // Settlement
        let payout = 0;
        let isWin = false;

        if (market === '1x2') {
          const matchResult = fthg > ftag ? 0 : (fthg === ftag ? 1 : 2);
          if (selectionIdx === matchResult) {
            payout = stake * takenOdds;
            isWin = true;
            wins++;
          }
        } else if (market === 'ou25') {
          const totalGoals = fthg + ftag;
          const isOver = totalGoals > 2.5;
          if ((selectionIdx === 0 && isOver) || (selectionIdx === 1 && !isOver)) {
            payout = stake * takenOdds;
            isWin = true;
            wins++;
          }
        } else if (market === 'ah') {
          const goalDiff = fthg - ftag;
          if (selectionIdx === 0) {
            // Home bet
            const mult = settleAH(goalDiff, ahLine, takenOdds);
            payout = stake * mult;
            if (mult > 1.0) wins++;
          } else {
            // Away bet: diff from away perspective is -goalDiff, line is -ahLine
            const mult = settleAH(-goalDiff, -ahLine, takenOdds);
            payout = stake * mult;
            if (mult > 1.0) wins++;
          }
        }

        const netProfit = payout - stake;
        totalReturn += payout;
        bankroll += netProfit;

        // Track peak and drawdown
        if (bankroll > peakBankroll) peakBankroll = bankroll;
        const currentDrawdown = (peakBankroll - bankroll) / peakBankroll;
        if (currentDrawdown > maxDrawdown) maxDrawdown = currentDrawdown;

        // Track CLV with selected margin method (Issue 7)
        const clv = calcCLV(takenOdds, sharpClosingOdds, marginMethod, selectionIdx);
        clvSum += clv;
        if (clv > 0) beatCloseCount++;

        curve.push({
          index: totalBets,
          date: matchDate,
          bankroll: Math.round(bankroll * 100) / 100,
          profit: Math.round((bankroll - initialBankroll) * 100) / 100
        });

        betRecords.push({
          index: totalBets,
          date: matchDate,
          homeTeam: teams[homeId] ? teams[homeId].zh || teams[homeId].name : homeId,
          awayTeam: teams[awayId] ? teams[awayId].zh || teams[awayId].name : awayId,
          score: `${fthg}-${ftag}`,
          selection: selectionName,
          odds: takenOdds,
          stake,
          payout,
          profit: netProfit,
          clv: Math.round(clv * 1000) / 10
        });
      }
    }

    const netProfit = totalReturn - totalStaked;
    const roi = totalStaked > 0 ? (netProfit / totalStaked) * 100 : 0;
    const hitRate = totalBets > 0 ? (wins / totalBets) * 100 : 0;
    const avgCLV = totalBets > 0 ? (clvSum / totalBets) * 100 : 0;
    const beatCloseRate = totalBets > 0 ? (beatCloseCount / totalBets) * 100 : 0;

    return {
      totalBets,
      wins,
      totalStaked: Math.round(totalStaked * 100) / 100,
      totalReturn: Math.round(totalReturn * 100) / 100,
      profit: Math.round(netProfit * 100) / 100,
      roi: Math.round(roi * 10) / 10,
      hitRate: Math.round(hitRate * 10) / 10,
      maxDrawdown: Math.round(maxDrawdown * 1000) / 10,
      avgCLV: Math.round(avgCLV * 100) / 100,
      beatCloseRate: Math.round(beatCloseRate * 10) / 10,
      bankrollCurve: curve,
      bets: betRecords
    };
  }

  // --- Exported API ---

  return {
    oddsToProb,
    fairOdds,
    calcOverround,
    removeMarginProportional,
    removeMarginPower,
    removeMargin,
    poissonProb,
    calcScoreMatrix,
    derive1X2,
    deriveOU,
    deriveBTTS,
    deriveExpectedGoals,
    deriveMostLikelyScores,
    settleAH,
    settleAHOutcome,
    calcAHProbs,
    calcAHTable,
    calcKelly,
    calcAHKelly,
    calcCLV,
    fitDixonColes,
    runBacktest
  };
});
