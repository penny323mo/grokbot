# Coder live review 2 — 霜門守望 Frostgate Wardens (2026-11-05 08:45 Macau)
URL: https://penny323mo.github.io/grokbot/projects/frostgate-wardens/ (HTTP 200, published 05:35)
Method: Chromium, 390x844 @2x and 375x667 @2x, iPhone Safari UA, touch taps (Playwright). Scripts + screenshots (all viewed): review/coder2/. Regions 2-5 were opened with a test-only localStorage unlock (not a natural progression).
Repo: `npm test` 6/6 green at publish (.orch/tests-publish.txt). Note: grok's last review (r6) predates fix-6, so fix-6 was never re-reviewed; its last verdict is NOT READY.

## Verdict: PLAYABLE, MUCH BETTER THAN 11-04, NOT YET SHIP-QUALITY (no P0)
## Passed
- No console errors, no 4xx, no horizontal scroll. Title key art strong; region cards, credits, tutorial skip OK.
- Camera (the thing Penny failed): region 1 now opens with the whole lane and the keep in frame at 390 and 375, no indigo side bars, hero + build plots visible. Build dock lists 5 towers with price; build works (350->250G); start wave, HUD, speed (1x->3x), pause (resume / mute / restart / back) all work.
- Regions 2-5 each render a distinct biome (ice lake + bridges, fir switchback, magma canyon, grey citadel) with plots + hero.
- Defeat modal appears with Cantonese copy and retry/back buttons.
## Issues
- P1 (art): maps are much richer but regions 4 and 5 are still blocky/sparse next to the title art (R4: orange slabs on black void, R5: mostly empty grey). Hero reads as a small dark/black-and-gold figure, not the silver knight in the changelog.
- P1 (legibility): the enemy spawn is at the bottom edge, partly under the dock; early enemies are tiny and easy to miss at 390 (first 10s of each wave).
- P2: top of the keep is cut by the HUD; a few build plots sit under the dock when it is open.
## Not tested
Real iPhone Safari (used Chromium + UA), audio, full 12-wave win/victory screen, endless mode play, 3-star scoring, real progression unlock across regions.
