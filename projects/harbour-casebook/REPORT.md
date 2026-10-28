# 濠江疑案 — orchestrator report

- Generated: 2026-10-28 22:44 (Macau, UTC+8)
- Live: https://penny323mo.github.io/grokbot/projects/harbour-casebook/ (HTTP 200)
- Rounds: 3  ·  Started: 2026-10-28T19:38:33+08:00

## Phases
- build finished 2026-10-28T20:55:03+08:00
- review-1 finished 2026-10-28T21:08:56+08:00
- fix-1 finished 2026-10-28T21:36:11+08:00
- review-2 finished 2026-10-28T21:41:53+08:00
- fix-2 finished 2026-10-28T22:05:32+08:00
- review-3 finished 2026-10-28T22:15:44+08:00
- fix-3 finished 2026-10-28T22:44:09+08:00
- publish finished 2026-10-28T22:44:19+08:00

## Reviews
- orch-r1-grok.md: VERDICT: NOT READY
- orch-r2-grok.md: VERDICT: NOT READY
- orch-r3-grok.md: VERDICT: NOT READY
- orch-r4-grok.md: VERDICT: SHIP
- orch-r5-grok.md: VERDICT: SHIP

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
# duration_ms 12.913607
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
# duration_ms 11.931969
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
# duration_ms 22.772049
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
# duration_ms 10.923179
```

## Screenshots
- screenshots/orch/live-390-full.png
- screenshots/orch/live-390.png

## Changelog (tail)
  - **Title & Desk Hub**: Removed all cream bars and rectangular button outlines from `.btn-primary-start`, `.btn-secondary-board`, and `.btn-desk-board-folder`, styling them as authentic ink seal titles and brass drawer tabs.

### Major Enhancements
- **Pawnshop Art Repainting & Hotspot Precision Alignment (MAJOR #3)**:
  - Repainted `assets/scenes/case1_pawnshop.webp` and `case1_pawnshop.jpg` to match the warm amber lamp-lit chiaroscuro palette, LAB illumination curve, edge softening, and fine photographic film grain of `desk_hub.webp`.
  - Cleaned the corpse head at `(w*0.64, h*0.78)` of any lined document/sticker.
  - Repositioned hotspots onto actual painted objects:
    - `c1_earring` at (39, 47) directly onto the painted lustrous natural pearl at the threshold.
    - `c1_desk_tea` at (23, 74) directly centered on the celadon teacup.
    - `c1_ticket_ledger` at (76, 68) directly centered on the open ledger book on the floor.
  - Verified that all 12 hotspot markers sit strictly within `x = 14.5px` to `369.8px` (well inside 8–382 CSS px range under cover scale 1.4427), with pairwise distance >= 58.5px (>= 44px required).
  - Unified character portraits across Title, Desk, and Corkboard: pasted the exact painted portraits of 陳德生, 何炳, 梁阿四, 白蘭 onto `desk_hub.webp` and `title_key.webp` corkboard polaroids with matching vintage tone.
- **Word Picker Parking & CJK Word-Break Integrity (MAJOR #4)**:
  - In `src/render/deduction-sheet.js:423-430`: In `openWordPicker`, used precise container-relative offset calculation via `getBoundingClientRect()` to immediately position the active section card near the top of the viewport.
  - With `padding-bottom: calc(var(--safe-bottom) + 260px)`, both Section 1 and Section 2 sentences remain completely above the card fan tray (docked at `max-height: 28vh`), completely eliminating text occlusion.
  - Added `word-break: keep-all` to `.section-desc` (preventing `動機` from breaking) and `.evidence-sheet-desc` (preventing `單隻` from breaking).

### Minor Polish
- **Shortened Case 1 Location on Docket (MINOR #5)**:
  - Shortened Case 1 location in `src/data/cases.js:17` from `'福隆新街「德生大押」後櫃庫房'` to `'福隆新街德生大押'` (7 chars), fitting cleanly on one line in `.docket-loc` without ellipsis truncation (`…`).

### Verification Gates
- `node scripts/harsh2_play.mjs http://127.0.0.1:8937/index.html /workspace/nightly/2026-10-28-harbour-casebook/screenshots/fix-r3`: RESULT PASS, exit code 0, 0 errors, 34/34 words collected, Who's Who solved, Case 1 solved, epilogue verified.
- `node --test tests/*.test.mjs`: all 9 unit tests pass.
- `bash scripts/audio_check.sh`: all 4 BGM files pass.
