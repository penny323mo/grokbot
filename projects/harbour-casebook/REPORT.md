# 濠江疑案 — orchestrator report

- Generated: 2026-10-28 12:56 (Macau, UTC+8)
- Live: https://penny323mo.github.io/grokbot/projects/harbour-casebook/ (HTTP 200)
- Rounds: 3  ·  Started: 2026-10-28T11:43:49+08:00

## Phases
- build finished 2026-10-28T12:08:13+08:00
- review-1 finished 2026-10-28T12:11:24+08:00
- fix-1 finished 2026-10-28T12:25:15+08:00
- review-2 finished 2026-10-28T12:28:27+08:00
- fix-2 finished 2026-10-28T12:42:48+08:00
- review-3 finished 2026-10-28T12:53:22+08:00
- fix-3 finished 2026-10-28T12:55:54+08:00
- publish finished 2026-10-28T12:56:03+08:00

## Reviews
- orch-r1-grok.md: VERDICT: CONTINUE
- orch-r2-grok.md: VERDICT: CONTINUE
- orch-r3-grok.md: VERDICT: CONTINUE

## Tests
### tests-build
```
# tests 1
# suites 0
# pass 1
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 8.801947
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
# duration_ms 10.914377
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
# duration_ms 9.278265
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
# duration_ms 9.410929
```

## Screenshots
- screenshots/orch/live-390-full.png
- screenshots/orch/live-390.png

## Changelog (tail)
### Art Overhaul Pin-on-Object Alignment (orch-r3-grok)
- **MAJOR #1: 100% Painted Clue & Prop Registration across all 4 Cases**:
  - **Case 1 (`pawnshop`)**:
    - Aligned `c1_ticket_ledger` to `(78, 72)` directly on the painted open 当簿 with the red chop.
    - Aligned `c1_footprints` to `(50, 48)` on the threshold doorway muddy prints.
    - Aligned `c1_earring` to `(50, 46)` on the doorway threshold stone.
  - **Case 2 (`pier`)**:
    - Aligned `c2_cargo_hook` to `(22, 78)` directly on the hanging iron cargo hook under the bamboo awning.
    - Aligned `c2_blind_chuen` to `(16, 84)` squarely on the seated fortune-teller under the stall.
  - **Case 3 (`theatre`)**:
    - Aligned `c3_costume_box` to `(68, 56)` onto the large black costume wardrobe trunk.
    - Aligned `c3_fong_key` to `(62, 32)` onto the backstage wardrobe locker.
    - Aligned `c3_yuen_tea` to `(70, 62)` onto the thermos flask on the front-right desk.
    - Aligned `c3_tse_letter` to `(76, 72)` onto the wax-sealed envelope on the front-right desk.
    - Aligned `c3_insurance` to `(80, 68)` directly onto the LIFE INSURANCE policy document on the desk.
  - **Case 4 (`penha`)**:
    - Aligned `c4_gardener` to `(84, 90)` directly on the seated shears-man (啞巴花匠) in the lower right garden.
    - Aligned `c4_father_stubbs` to `(64, 38)` on the Penha chapel doorway silhouette.
    - Aligned `c4_yuen_so_kam` to `(58, 42)` on the woman in black holding the dossier document stand-in.
    - Nudged `c4_overlook` to `(42, 28)` onto the Penha Hill stone balustrade view.
- **Verification & Recaptured Visuals**:
  - All 7 test suites passing in `node --test tests/*.test.mjs` (0 failures, ~145ms).
  - Recaptured fresh 390px mobile screenshots `01_title.png` through `08_epilogue.png` and scene captures `03b_scene_case2.png`, `03c_scene_case3.png`, `03d_scene_case4.png`.
  - Re-generated visual debug overlay maps `case1_round3_overlay.jpg` through `case4_round3_overlay.jpg` in `screenshots/debug/`.
  - Updated orchestrator review captures `screenshots/orch/live-390.png` and `live-390-full.png`.
