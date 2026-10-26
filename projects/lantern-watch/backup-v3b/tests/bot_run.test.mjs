/**
 * tests/bot_run.test.mjs
 * Simulates complete automated runs across all difficulty settings and ascension levels.
 * Reports bot win-rates and balance sanity statistics.
 */

import assert from "node:assert";
import test from "node:test";
import { BotPlayer } from "../js/engine/bot.js";
import { RNG } from "../js/engine/rng.js";
import { DIFFICULTIES } from "../js/engine/constants.js";

test("Bot: Automated simulation on 悠閒 (Relaxed) difficulty", () => {
  const runsCount = 20;
  let wins = 0;
  let totalNights = 0;

  for (let i = 0; i < runsCount; i++) {
    const bot = new BotPlayer({
      difficulty: DIFFICULTIES.RELAXED,
      ascension: 0,
      rng: new RNG(1000 + i)
    });
    const res = bot.simulateFullRun();
    if (res.won) wins++;
    totalNights += res.nightsSurvived;
  }

  const winRate = (wins / runsCount) * 100;
  console.log(`[Balance Report] 悠閒 (Relaxed) Win Rate: ${winRate.toFixed(1)}% (${wins}/${runsCount}), Avg Nights: ${(totalNights / runsCount).toFixed(1)}/8`);
  assert.ok(totalNights > 0, "Bot should survive multiple nights");
});

test("Bot: Automated simulation on 標準 (Standard) difficulty", () => {
  const runsCount = 20;
  let wins = 0;
  let totalNights = 0;

  for (let i = 0; i < runsCount; i++) {
    const bot = new BotPlayer({
      difficulty: DIFFICULTIES.STANDARD,
      ascension: 0,
      rng: new RNG(2000 + i)
    });
    const res = bot.simulateFullRun();
    if (res.won) wins++;
    totalNights += res.nightsSurvived;
  }

  const winRate = (wins / runsCount) * 100;
  console.log(`[Balance Report] 標準 (Standard) Win Rate: ${winRate.toFixed(1)}% (${wins}/${runsCount}), Avg Nights: ${(totalNights / runsCount).toFixed(1)}/8`);
  assert.ok(totalNights > 0);
});

test("Bot: Automated simulation on 挑戰 (Challenging) + Ascension 1", () => {
  const runsCount = 20;
  let wins = 0;
  let totalNights = 0;

  for (let i = 0; i < runsCount; i++) {
    const bot = new BotPlayer({
      difficulty: DIFFICULTIES.CHALLENGING,
      ascension: 1,
      rng: new RNG(3000 + i)
    });
    const res = bot.simulateFullRun();
    if (res.won) wins++;
    totalNights += res.nightsSurvived;
  }

  const winRate = (wins / runsCount) * 100;
  console.log(`[Balance Report] 挑戰 (Challenging A1) Win Rate: ${winRate.toFixed(1)}% (${wins}/${runsCount}), Avg Nights: ${(totalNights / runsCount).toFixed(1)}/8`);
  assert.ok(totalNights > 0);
});
