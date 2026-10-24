/**
 * 12碼讀心戰 (Penalty Mind Game v2) - Difficulty Configuration & Mapping
 * Pure module managing difficulty tiers: 易 (EASY), 中 (MEDIUM), 難 (HARD), 地獄 (HELL).
 */

export const DIFFICULTY_TIERS = {
  EASY: {
    key: 'EASY',
    name: '易',
    tag: '初級門將',
    desc: '反應較慢、撲救範圍較細，經常給出真實提示。',
    keeperReactTime: 0.22,      // Slower reaction (220ms)
    keeperReach: 0.38,          // Smaller reach (0.38m)
    predictorWeight: 0.55,      // Less reliant on predictor
    tellHonesty: 0.90,          // 90% honest tells, rarely fakes
    gazeHint: false,            // No eye-line arrow needed
    takerError: 0.16,           // Taker misses more often (16% off target)
    takerCornerRate: 0.25       // Rarely snipes extreme corners
  },
  MEDIUM: {
    key: 'MEDIUM',
    name: '中',
    tag: '標準對決',
    desc: '平衡標準，具備適度讀心能力，偶爾試探虛實。',
    keeperReactTime: 0.16,      // Standard reaction (160ms)
    keeperReach: 0.42,          // Standard reach (0.42m)
    predictorWeight: 0.80,      // Moderately trusts predictor
    tellHonesty: 0.70,          // 70% honest tells, 30% bluff
    gazeHint: false,
    takerError: 0.08,           // 8% miss rate
    takerCornerRate: 0.45       // Balances center and corners
  },
  HARD: {
    key: 'HARD',
    name: '難',
    tag: '職業老手',
    desc: '極速反應、手長撲救廣，真假動作並用，射手刁鑽。',
    keeperReactTime: 0.13,      // Fast reaction (130ms)
    keeperReach: 0.46,          // Broad reach (0.46m)
    predictorWeight: 0.92,      // Strongly follows predictor habits
    tellHonesty: 0.50,          // 50% true tell, 50% bluff/fake lean
    gazeHint: true,             // Subtle eye gaze hint visible
    takerError: 0.03,           // Rare miss (3%)
    takerCornerRate: 0.70       // Frequently snipes high-difficulty corners
  },
  HELL: {
    key: 'HELL',
    name: '地獄',
    tag: '世界級神撲',
    desc: '閃電本能、深度連招讀心，狂出假動作，射門百步穿楊。',
    keeperReactTime: 0.11,      // Lightning reaction (110ms)
    keeperReach: 0.50,          // Maximum reach (0.50m)
    predictorWeight: 0.98,      // Deep pattern exploitation
    tellHonesty: 0.35,          // Frequent bluffs & misleading feints
    gazeHint: true,             // Eye gaze hint visible
    takerError: 0.01,           // Practically never misses (1%)
    takerCornerRate: 0.90       // Snipes deadly corners with top speed
  }
};

const STORAGE_KEY = 'penalty_mind_game_difficulty_v2';
export const DEFAULT_DIFFICULTY = 'MEDIUM';

/**
 * Get difficulty configuration object for a given tier key.
 * Falls back to MEDIUM if invalid.
 * @param {string} tierKey - One of 'EASY', 'MEDIUM', 'HARD', 'HELL'
 * @returns {Object} Difficulty configuration
 */
export function getDifficultyConfig(tierKey) {
  const normalized = (tierKey || '').toUpperCase();
  return DIFFICULTY_TIERS[normalized] || DIFFICULTY_TIERS[DEFAULT_DIFFICULTY];
}

/**
 * Persist chosen difficulty tier to localStorage.
 * @param {string} tierKey
 */
export function saveDifficulty(tierKey) {
  if (typeof localStorage === 'undefined') return;
  const config = getDifficultyConfig(tierKey);
  try {
    localStorage.setItem(STORAGE_KEY, config.key);
  } catch (_) {}
}

/**
 * Load difficulty tier from localStorage.
 * @returns {string} Tier key ('EASY'|'MEDIUM'|'HARD'|'HELL')
 */
export function loadDifficulty() {
  if (typeof localStorage === 'undefined') return DEFAULT_DIFFICULTY;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && DIFFICULTY_TIERS[saved]) {
      return saved;
    }
  } catch (_) {}
  return DEFAULT_DIFFICULTY;
}

export const DIFFICULTY = DIFFICULTY_TIERS;
