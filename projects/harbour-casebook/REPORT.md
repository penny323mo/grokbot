# 濠江疑案 — orchestrator report

- Generated: 2026-10-28 02:28 (Macau, UTC+8)
- Live: https://penny323mo.github.io/grokbot/projects/harbour-casebook/ (HTTP 200)
- Rounds: 3  ·  Started: 2026-10-28T01:02:24+08:00

## Phases
- build finished 2026-10-28T01:31:26+08:00
- review-1 finished 2026-10-28T01:36:16+08:00
- fix-1 finished 2026-10-28T01:50:41+08:00
- review-2 finished 2026-10-28T01:55:33+08:00
- fix-2 finished 2026-10-28T02:23:02+08:00
- review-3 finished 2026-10-28T02:25:13+08:00
- fix-3 finished 2026-10-28T02:27:35+08:00
- publish finished 2026-10-28T02:28:29+08:00

## Reviews
- orch-r1-grok.md: VERDICT: NOT READY
- orch-r2-grok.md: VERDICT: NOT READY
- orch-r3-grok.md: VERDICT: SHIP

## Tests
### tests-build
```
# tests 2
# suites 0
# pass 2
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 10.480162
```
### tests-fix-1
```
# tests 1
# suites 0
# pass 1
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 9.760305
```
### tests-fix-2
```
# tests 1
# suites 0
# pass 1
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 8.739553
```
### tests-fix-3
```
# tests 1
# suites 0
# pass 1
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 9.890595
```

## Screenshots
- screenshots/orch/live-390-full.png
- screenshots/orch/live-390.png

## Changelog (tail)

### Minor Polish & Fixes
- **Onboarding Step 3 Auto-Dismiss (MINOR #3)**:
  - Connected `onSlotFill` and `onCaseSolved` in `src/app.js` to `advanceOnboarding(3)`, properly saving `storage.state.onboardingDone = true` and permanently dismissing the guide banner upon blank completion.
- **Comprehensive CJK Typography Fallbacks (MINOR #4)**:
  - Expanded font stack definitions in `css/style.css` to ensure consistent archival typography across all operating systems (`"Noto Serif CJK TC"`, `"Noto Serif TC"`, `"Songti TC"`, `"STSong"`, `"PingFang TC"`, `"Biaukai"`, `"Source Han Serif TC"`).
- **Archival Epilogue Harbour Vignette Artwork (MINOR #5)**:
  - Replaced generic shapes in `src/render/epilogue-modal.js` with an intricate ink drawing of Macau Inner Harbour at sunrise with Taipa hills, Penha chapel, a traditional 3-masted junk with battened sails, wooden pier pilings, and jade seal.
- **Unit Testing & Verification**:
  - Expanded `tests/deduction.test.mjs` to rigorously test Golden Idol Who's Who status buckets (incomplete, correct, partial, many errors); all 7 test suites pass in ~450ms.
  - Recaptured complete 390px mobile walkthrough screenshots (`01_title.png` through `08_epilogue.png`) reflecting the updated architecture, neutral character cards, and clean solved state.

## Round 3 fixes

### Minor Polish & Camera Perspective Craft
- **Case 1 Oblique 3/4 Floor & Corpse Alignment (MINOR #1)**:
  - Updated `assets/scenes/case1_pawnshop.svg` via `scripts/generate_scenes.py` to bring the floor tiles and victim body into the exact same 3/4 oblique perspective as the desk and safe.
  - Replaced horizontal transverse tile lines with angled orthogonal floor seams that recede with perspective depth.
  - Redrew pawnbroker Chen Tak-sang's body in 3/4 foreshortening with stretched legs, white-soled black cloth shoes, silk changshan drapery folds, outstretched right hand reaching toward the desk, and eyeglasses resting on the floor.
- **Who's Who Heavenly Stems Labels Expansion (MINOR #2)**:
  - Expanded neutral character labeling array in `src/render/deduction-sheet.js` to full 10 Heavenly Stems: `['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']`.
  - Ensures Case 4 (featuring 8 characters) cleanly renders characters 7 and 8 as 「人物庚」 and 「人物辛」 without falling back to numeric indices.
- **Verification & Screenshots**:
  - Re-verified all 7 test suites via `node --test tests/*.test.mjs` (all pass with 0 failures).
  - Recaptured updated 390px mobile screenshots `03_scene.png` and `04_bottom_sheet.png` reflecting the enhanced 3/4 pawnshop perspective.
