# Harbour Casebook — Diegetic Rebuild Checkpoint
Updated: 2026-10-28 14:01 Asia/Macau (UTC+8) — orch detaches; resume via REBUILD_PROGRESS

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
