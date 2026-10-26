# Orchestrator — detached, resumable agy → grok → publish pipeline

Why: background workers get killed after ~50 min. This script runs in its own tmux session on the box, so it keeps going when the caller dies, and every phase is persisted so a rerun resumes.

## Launch / resume / check
```bash
T=/workspace/orchestrator          # or <grokbot>/tools/orchestrator
$T/run.sh /workspace/nightly/<date>-<slug> --rounds 3   # detaches into tmux session orch-<slug>, returns immediately
$T/status.sh /workspace/nightly/<date>-<slug>           # phase, round, attempts, RUNNING/NOT RUNNING, log tail
$T/run.sh /workspace/nightly/<date>-<slug>              # resume: same command; no-op if already running
tmux attach -t orch-<slug>                              # watch the orchestrator itself
```
Done = `<project>/.orch/DONE` exists.

## Project inputs
- `SPEC.md` (or `PLAN.md` / `UPGRADE_PLAN.md`): brief used in generated prompts.
- `orch.json` (needed for publish): `{"id","title","subtitle","category","description","accent","added":"YYYY-MM-DD","src":"."}`.
- Optional custom prompts: put `prompts/orch-build.txt`, `prompts/orch-review-<r>.txt`, `prompts/orch-fix-<r>.txt` before launch; they are used as-is (the sentinel instruction is appended only to generated ones, so custom prompts must say "when finished create `<project>/.orch/<phase>.done`").

## Phases (`.orch/state.json`)
`build`(agy) → `review-1`(grok) → `fix-1`(agy) → … → `review-N` → `fix-N` → `publish` → `report` → `done`.
- Each agent phase: pane gets a round label (tmux status bar + window name), prompt sent as `Read and follow <prompt file>` via `tmux send-keys`, waits for sentinel `.orch/<phase>.done`. Waits while the pane shows "esc to cancel" (agent busy) before sending. Auto-approves grok edit prompts only under `reviews/` or `.orch/`.
- Timeout `PHASE_TIMEOUT` (default 2700 s) → resend once with "continue where you left off" (`MAX_ATTEMPTS`=2), then marks `<phase>.done.timeout` and moves on (shown in REPORT.md).
- After each phase: tests (`npm test`, or `node tests/*.test.{js,mjs,cjs}`, `python3 tests/test_*.py`) → `.orch/tests-<phase>.txt`, then `git commit` (+ push if `origin` exists).
- Resume: if the prompt of the current attempt was already sent, a rerun just keeps waiting for its sentinel (no duplicate prompt).
- `publish` (publish.sh): fresh clone/reset of grokbot at `$GROKBOT_DIR` (default `/workspace/orchestrator/work/grokbot`, deliberately NOT `/workspace/grokbot`), copies project to `projects/<id>/` (excludes .git .orch prompts reviews screenshots node_modules), renders 780x1040 `cover/cover.webp`, upserts manifest (added + cover, sorted newest first), runs `tests/check_manifest.mjs`, pushes, polls live URL until 200 (`LIVE_TRIES`×15 s), takes 390px screenshots to `screenshots/orch/`. On failure the orchestrator exits; rerun resumes at publish.
- `report` writes `REPORT.md` (phases, timeouts, review verdicts, test tails, screenshots, changelog tail).
- Log/heartbeat: `.orch/log.txt`, `.orch/heartbeat`. Output passes through a redactor; tokens are never echoed.

## Panes
Defaults `AGY_PANE=agy-pane`, `GROK_PANE=grok-pane` (Penny's visible sessions). If missing they are created in the project dir and launched with `agy --dangerously-skip-permissions -c` / `grok --always-approve -c` (continue the latest session). If an existing pane is in another dir, the prompt uses absolute paths and says `cd <project>`.
Note: one pair of panes = run one orchestrator at a time (or point `AGY_PANE`/`GROK_PANE` at other sessions).

## Env overrides (persisted to `.orch/config.env` at launch, since tmux does not inherit env)
`AGY_PANE GROK_PANE AGY_LAUNCH GROK_LAUNCH PHASE_TIMEOUT MAX_ATTEMPTS POLL LAUNCH_WAIT GROKBOT_DIR DRY_PUBLISH LIVE_URL_OVERRIDE LIVE_TRIES`

## Test with stubs (no real agents, no push)
```bash
export AGY_PANE=orchtest-agy GROK_PANE=orchtest-grok AGY_LAUNCH="$T/test/stub-agent.sh agy" GROK_LAUNCH="$T/test/stub-agent.sh grok" \
  POLL=2 LAUNCH_WAIT=2 PHASE_TIMEOUT=120 DRY_PUBLISH=1 LIVE_URL_OVERRIDE=https://penny323mo.github.io/grokbot/ GROKBOT_DIR=/tmp/orch-gb LIVE_TRIES=3
$T/run.sh /tmp/orch-dummy --rounds 1; sleep 30; tmux kill-session -t orch-orch-dummy; $T/run.sh /tmp/orch-dummy
```
