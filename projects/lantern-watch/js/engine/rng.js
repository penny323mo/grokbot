/**
 * js/engine/rng.js
 * Seeded PRNG using Mulberry32 for deterministic tactical card game runs.
 */

export class RNG {
  constructor(seed = 123456789) {
    this.seed = typeof seed === "string" ? RNG.hashString(seed) : (seed >>> 0);
    this.state = this.seed;
  }

  static hashString(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 16777619) >>> 0;
    }
    return h;
  }

  /** Returns floating number in [0, 1) */
  next() {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Returns integer in [min, max] inclusive */
  nextInt(min, max) {
    if (min >= max) return min;
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /** Returns random element from array */
  choice(array) {
    if (!array || array.length === 0) return null;
    return array[this.nextInt(0, array.length - 1)];
  }

  /** Shuffles array in-place using Fisher-Yates and returns it */
  shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /** Weighted choice from array of objects with 'weight' property */
  weighted(items, weightFn = (item) => item.weight ?? 1) {
    if (!items || items.length === 0) return null;
    const total = items.reduce((sum, item) => sum + Math.max(0, weightFn(item)), 0);
    if (total <= 0) return this.choice(items);
    let r = this.next() * total;
    for (const item of items) {
      const w = Math.max(0, weightFn(item));
      if (r <= w) return item;
      r -= w;
    }
    return items[items.length - 1];
  }

  /** Creates an independent child RNG */
  fork() {
    return new RNG(this.nextInt(1, 2147483647));
  }

  getState() {
    return { seed: this.seed, state: this.state };
  }

  setState(st) {
    if (st) {
      this.seed = st.seed >>> 0;
      this.state = st.state >>> 0;
    }
  }
}
