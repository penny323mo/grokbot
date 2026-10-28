# Harbour Casebook — Diegetic Rebuild Checkpoint
Updated: 2026-10-28 15:00 Asia/Macau (UTC+8) — harsh real-tap audit after orch r1–5; round 6 (3 review/fix rounds) LAUNCHED 14:57

## Harsh audit 2026-10-28 ~14:30–15:00 (real taps, Playwright 390x844 DPR2)
grok r5 "SHIP" was code-only ("No browser") → INVALID.
Scores: Art 70 · UI 50 · Music 55 · Interaction 40 · Story 80  (none = 100)
- CRITICAL: live Case 1 UNWINNABLE — corkboard checkWhosWho(this.caseData,...) → "whosWhoList.filter is not a function"; CHECK_STATUS.ALL_CORRECT undefined. Confirmed on live (screenshots/harsh2/live_03_cork_check.png).
  FIXED LOCALLY in src/render/corkboard.js (whosWho array + CHECK_STATUS.CORRECT). NOT yet published — goes out with round-6 publish.
- c1_footprints hotspot occluded by earring ring → 30/34 words; 梁阿四 locked.
- UI = web cards/forms: phone menu (iOS toggles/sliders, scroll broken), case board, notebook, cork instruction box + grey picker, deduction boxed cards (scroll jumps to top after check), 結案 card, epilogue generic modal w/ flat-vector art; title has web buttons/boxed top bar.
- Art: title+desk good; scene art flat comic style, pins off objects, earring "flower pot" not painted, ledger cut off; desk cork photos = Western men; lamp pin overlaps cork pin.
- Story: 「仓皇」 simplified typo; no ceremonial reveal. Onboarding regresses step3→2.
- Music: investigation.ogg = 24s phrase ×2, dropout 23–24.5s, tail -84 dBFS → loop gap; energy <120Hz, ~nothing >2kHz; GM soundfont. resolution.ogg RMS 0.013 (too quiet).
Shots: screenshots/harsh2/ (pre-fix = live), screenshots/harsh2/fixed/ (local fix, full solve), harsh2/live_*.png, harsh2/studio_index.png.

## Infra changes this run
- scripts/harsh2_play.mjs now a GATE: prints RESULT PASS/FAIL, exit 1 on occlusion/miss/console error/unsolved/<34 words. Currently FAIL (footprints occluded) as expected.
- Round-6 prompts: prompts/improve-r6.txt (= orch-build.txt + sentinel), new orch-review-1..3 (REAL-TAP browser review required; SHIP only if gate PASS + all areas ≥95) and orch-fix-1..3. Old r1–5 prompts → prompts/archive-r1-5/. Old state → .orch-prev-5 (config.env carried over).
- Cover: /workspace/orchestrator/publish.sh now honours orch.json "cover_src"/"thumb_src" (backup publish.sh.bak-20261028); orch.json set to assets/art/cover.webp + thumb.webp → publish should no longer blank the studio thumbnail. Still run scripts/restore-cover.sh after publish as belt-and-braces.
- Studio thumbnail check 15:00: live cover.webp 780x1040 mean 49.8 std 44.9; thumb std 46.4 → OK (not blank).

## Next (for the 30-min loop)
1. `/workspace/orchestrator/status.sh /workspace/nightly/2026-10-28-harbour-casebook` — if RUNNING with fresh heartbeat, do nothing. If stuck (heartbeat >15 min stale or agy at login prompt), investigate.
2. When .orch/DONE exists: (a) `bash scripts/restore-cover.sh`; (b) verify studio thumb std ≫10; (c) run gate on local (`python3 -m http.server 8937` in project) AND live: `node scripts/harsh2_play.mjs https://penny323mo.github.io/grokbot/projects/harbour-casebook/index.html screenshots/harsh3-live` — must RESULT PASS; (d) LOOK at every screenshot and score harshly; (e) if any area <100, write prompts/improve-r7.txt, move .orch → .orch-prev-6, relaunch `--rounds 3` (same prompt layout as round 6).
3. If round 6 fails to publish the corkboard fix for any reason, publish manually (`/workspace/orchestrator/publish.sh <project>` then restore-cover.sh) — live is unwinnable until then.

---
## Previous checkpoint (14:01)

## Goal (Penny)
Commercial 100/100 diegetic 1962 detective desk (Golden Idol / Her Story / Papers Please / Obra Dinn).
No card boxes / tab bars. Eerie suspense BGM. Case 1 first. Self-play 390×844 harsh.
**Do not message Penny until honest 100/100 with per-area scores + screenshots.**

## Orchestrator
- Session: `tmux attach -t orch-2026-10-28-harbour-casebook`
- Config: `.orch/config.env` — `PHASE_TIMEOUT=3600`, `AGY_LAUNCH=agy --dangerously-skip-permissions -c`, `GROK_LAUNCH=grok --always-approve` (**no -c**; -c fails without session)
- Rounds planned: **5** (review/fix 1–5)
- Status as of checkpoint: **phase=fix-1** (agy applying r1 CRITICAL/MAJOR). Orch pid alive.

## Done
1. **Studio thumbnail fixed** — live `cover.webp` is desk key-art (std≈46.5, mean≈60 dark noir), not blank beige. Script: `scripts/restore-cover.sh` (publish.sh overwrites cover from title screenshot — **must restore after every publish**).
2. **Art assets** under `assets/art/`: `desk_hub.webp`, `corkboard.webp`, `police_report.webp`, `notebook_open.webp`, `title_key.webp`, `cover.webp`, `thumb.webp`. Overlays: `assets/ui/lamp_vignette.webp`, `film_grain.webp`.
3. **Diegetic build (orch build.done 13:43)** — DeskHub / Corkboard / PhoneMenu; no bottom tab bar in live path; Case 1 loop intact; tests 7/7; atmosphere CSS; investigation BGM + fog_horn / clock_tick SFX.
4. **Review-1 VERDICT: NOT READY** (`reviews/orch-r1-grok.md`) — gates 1–6 PASS, gate 7 FAIL.
5. **Fix-1 in progress** — desk emoji sticker badges already removed (pin rings only); footer tutorial removed; hotspot % nudged; agy still editing CSS/scene/folio opacity/hints.

## Review-1 remaining fixes (CRITICAL / MAJOR)
| # | Issue | Status |
|---|---|---|
| C1 | Desk emoji sticker chips | DONE in desk-hub.js (pins only) — verify CSS `.desk-prop-badge` dead; strip emoji from app.js / deduction / phone-menu |
| C2 | Scene 585px plate in beige + pulsing rings | IN PROGRESS — need cover-scale fill + static vermilion pins |
| M3 | Opaque folio cards hide report/notebook art | IN PROGRESS — lower opacity / match cork |
| M4 | Footer wrap + magnifier/lamp pin miss | Footer gone; pins nudged — verify on 390 shot |
| M5 | Hints one counter for whole case | Likely editing storage/deduction |

## Music
- Investigation: drone + rain + sparse pluck + ticks + fog horn (eerie) — OK
- Resolution: regenerated softer warmer loop (576783 bytes vs investigation 768626) — quieter drone+rain, no ticks/horns
- Still want: slightly better erhu-like timbre if time; keep sparse not melodic

## Next (after fix-1.done)
1. Recapture 390×844: title, desk, scene, sheet, cork, notebook, deduction, solve, epilogue → `screenshots/harsh/`
2. Harsh self-score; if <100, leave orch to review-2 / fix-2 …
3. On publish: run `scripts/restore-cover.sh` immediately after publish push
4. Only when self-score all areas ≥100 and live matches: write final REPORT to parent (not interim to Penny)

## Honest interim self-score (pre–fix-1 polish) — NOT final
| Area | Score | Note |
|---|---|---|
| Art | 82 | Desk/title cinematic; scene style slightly mismatched; cork good |
| UI | 70 | Diegetic hub yes; stickers/beige scene frame / opaque folios kill commercial bar |
| Music | 78 | Investigation eerie enough; resolution just fixed; still not score-quality |
| Interaction | 80 | Prop nav + Case 1 fair-play OK; pulse rings / miss-aligned pins |
| Story | 88 | Case 1 mystery solid; presentation not yet selling it |

## Key paths
- Project: `/workspace/nightly/2026-10-28-harbour-casebook`
- Live: `https://penny323mo.github.io/grokbot/projects/harbour-casebook/`
- Grokbot clone: `/workspace/orchestrator/work/grokbot`
- Attachments (Penny blank thumb / boxed title): agent store attachments under this agent id

## Resume recipe after interrupt
```bash
P=/workspace/nightly/2026-10-28-harbour-casebook
cat $P/REBUILD_PROGRESS.md
/workspace/orchestrator/status.sh $P
# If orch dead but not DONE: /workspace/orchestrator/run.sh $P --rounds 5
# If grok stuck: grok --always-approve (no -c) then send review prompt
# After publish: $P/scripts/restore-cover.sh
```
- 2026-10-28 15:32 loop check: orch build#1 RUNNING, heartbeat fresh, agy actively running harsh2_play.mjs (screenshots/r6); no action.
- 2026-10-28 16:05 loop check: orch phase=fix-1 (round 1, after build#2 + review-1) RUNNING, heartbeat fresh 16:04, agy actively editing style.css; no action.
- 2026-10-28 16:33 loop check: orch phase=fix-2 (round 2/3, after review-2) RUNNING, heartbeat fresh 16:33; no action.
- 2026-10-28 17:05 loop check: orch phase=fix-2 attempt 2 (attempt 1 timed out 17:02) RUNNING, heartbeat fresh 17:05; no action.
- 2026-10-28 17:33 loop check: orch phase=fix-3 (round 3/3, after review-3) RUNNING, heartbeat fresh 17:33; no action.
- 2026-10-28 18:07 loop check: orch phase=fix-3 (attempt 1 timed out 18:05, waiting on busy agy-pane for attempt 2) RUNNING, heartbeat fresh 18:06; no action.
- 2026-10-28 18:36 loop check: orch phase=fix-3 attempt 2 (sent 18:22) RUNNING, heartbeat fresh 18:36, agy actively working; no action.
- 2026-10-28 19:07 loop check: orch phase=fix-3 attempt 2 (sent 18:22, times out ~19:07+) RUNNING, heartbeat fresh 19:07; no action.
- 2026-10-28 19:38 loop: round-6 orch DONE 19:08 (live 200, tests pass, fix-3 timed out x2). restore-cover run; studio thumb live (256², std 44). Own live play screenshots/loop-1934 RESULT PASS. Harsh score: Art 80, UI 65, Music 84, Interaction 85, Story 87 — phone/switchboard still a form, case drawer = card stack, scene/report app header bars + boxed buttons, white slips on desk props. Wrote prompts/improve-r7.txt (= orch-build.txt + sentinel); review/fix prompts now point to improve-r7; old r1-3 reviews → reviews/archive-r6, prompts → prompts/archive-r6; old state → .orch-prev-6. Relaunched --rounds 3 at 19:38. Next DONE: restore-cover, play live into screenshots/loop-<time>, score; repeat.
- 2026-10-28 20:02 loop check: round-7 orch phase=build attempt 1 (sent 19:38) RUNNING, heartbeat fresh 20:01; no action.
- 2026-10-28 20:36 loop check: round-7 orch phase=build attempt 2 (attempt 1 timed out 20:23, attempt 2 sent 20:23) RUNNING, heartbeat fresh 20:35; no action.
- 2026-10-28 21:14 loop check: round-7 orch phase=fix-1 (round 1/3; build PASS 20:55, review-1 done 21:08, fix-1 sent 21:08) RUNNING, heartbeat fresh 21:13; no action.
- 2026-10-28 21:36 loop check: round-7 orch phase=fix-1 (round 1/3, sent 21:08) RUNNING, heartbeat fresh 21:35; no action.
- 2026-10-28 22:07 loop check: round-7 orch phase=review-3 (round 3/3; fix-2 done 22:05, tests PASS, review-3 sent 22:05) RUNNING, heartbeat fresh 22:06; no action.
- 2026-10-28 22:39 loop check: round-7 orch phase=fix-3 (round 3/3, sent 22:15) RUNNING, heartbeat fresh 22:38; no action.
- 2026-10-28 23:10 loop: round-7 orch DONE 22:44 (live 200, tests pass). restore-cover run; studio thumb live (256², std 44). Own live play screenshots/loop-2306 RESULT PASS (CSS leak fixed). Harsh score: Art 80, UI 66, Music 84, Interaction 82, Story 85 — phone still settings form, drawer still card stack, scene top bar, cork bracket buttons/unreadable strip, deduction tabs overlap text, blue sticker on victim head, flat comic scene plate. Wrote prompts/improve-r8.txt (= orch-build.txt + sentinel); review/fix prompts → improve-r8; old reviews → reviews/archive-r7, prompts → prompts/archive-r7; old state → .orch-prev-7. Relaunched --rounds 3 at 23:10.
- 2026-10-28 23:37 loop check: round-8 orch phase=build attempt 1 (sent 23:09) RUNNING, heartbeat fresh 23:36; no action.
- 2026-10-29 00:03 loop check: round-8 orch phase=fix-1 (round 1/3; build PASS 23:39, review-1 done 23:44, fix-1 sent 23:44) RUNNING, heartbeat fresh 00:02; no action.

## Wrapped up at Penny's request — 2026-10-29 00:36 Asia/Macau
- Stopped round-8 orch (was phase=review-2 after fix-1). Killed orch tmux session; removed .orch/pid.
- agy-pane at shell; grok-pane idle at prompt (sessions left alive for 01:00 nightly).
- Kept round-8 HEAD a3f74dd (tests 9/9, audio PASS, harsh2_play RESULT PASS Case1 solved).
- Publishing + restore-cover next.
- 100分循環 already paused. Do not relaunch harbour orch tonight.
