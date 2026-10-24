/**
 * 12碼讀心戰 (Penalty Mind Game v2) - Taunts & Tells Unit Tests
 * Verifies Cantonese taunt pool size (>= 20 lines), category lookups,
 * and pre-kick visual tells honesty & gaze hints.
 */

import { TAUNTS, getTaunt, computeTell } from '../src/taunts.js';
import { DIFFICULTY } from '../src/difficulty.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    failed++;
    throw new Error(message);
  } else {
    console.log(`✅ PASS: ${message}`);
    passed++;
  }
}

console.log('--- Running Taunts & Tells (src/taunts.js) Unit Tests ---\n');

try {
  // Test 1: Total pool has at least 20 authentic Hong Kong Cantonese lines across both roles
  let totalLines = 0;
  for (const [cat, lines] of Object.entries(TAUNTS)) {
    assert(Array.isArray(lines) && lines.length > 0, `Category ${cat} contains lines`);
    totalLines += lines.length;
  }
  assert(totalLines >= 20, `Total Cantonese taunts count (${totalLines}) satisfies requirement >= 20`);

  // Test 2: getTaunt returns non-empty string for all categories
  const categories = Object.keys(TAUNTS);
  categories.forEach(cat => {
    const line = getTaunt(cat);
    assert(typeof line === 'string' && line.length > 4, `getTaunt(${cat}) returns natural line: "${line}"`);
  });

  // Test 3: Fallback for unknown category
  const fallback = getTaunt('UNKNOWN_CATEGORY_XYZ');
  assert(typeof fallback === 'string' && fallback.length > 0, 'Fallback returns valid default Cantonese line');

  // Test 4: computeTell respects tell honesty
  // In EASY mode (tellHonesty = 0.90), high frequency of honest tells
  let easyHonestCount = 0;
  for (let i = 0; i < 100; i++) {
    const tell = computeTell('TL', DIFFICULTY.EASY);
    if (!tell.isFake && tell.tellZone === 'TL') easyHonestCount++;
  }
  assert(easyHonestCount >= 75, `Easy mode tell honesty is high (${easyHonestCount}% honest)`);

  // In HELL mode (tellHonesty = 0.35), high frequency of deceptive bluffs
  let hellFakeCount = 0;
  for (let i = 0; i < 100; i++) {
    const tell = computeTell('TL', DIFFICULTY.HELL);
    if (tell.isFake && tell.tellZone !== 'TL') hellFakeCount++;
  }
  assert(hellFakeCount >= 50, `Hell mode deception frequency is high (${hellFakeCount}% bluffs)`);

  // Test 5: Gaze hint is enabled on HARD/HELL and disabled on EASY/MEDIUM
  const easyTell = computeTell('TR', DIFFICULTY.EASY);
  assert(easyTell.gazeHint === false, 'Easy difficulty has gazeHint disabled');

  const hellTell = computeTell('TR', DIFFICULTY.HELL);
  assert(hellTell.gazeHint === true, 'Hell difficulty has gazeHint enabled');

  console.log(`\nAll ${passed} / ${passed + failed} tests passed successfully!`);
} catch (e) {
  console.error(`\nTest suite terminated with error: ${e.message}`);
  process.exit(1);
}
