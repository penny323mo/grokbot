# SPEC — 燈籠小鎮守夜人 (Lantern Watch)

Approved by Penny 2026-10-26. Base design: see DESIGN.md (all content there is in scope). This SPEC adds her answers + hard requirements.

## Penny's answers (binding)
1. Theme/name: 燈籠小鎮守夜人 approved.
2. Difficulty: support BOTH relaxed and brain-burning play — 悠閒 (forgiving: more lantern HP, enemy intents simpler, undo always) / 標準 / 挑戰, plus 5 ascension levels (進階 1-5) unlocked after first win, each adding one clear named modifier.
3. Town building (小鎮): light seasoning only. Tactics + cards are the focus. Town = one calm screen between runs, ~10 buildings bought with 星燈 that unlock units/cards/start decks/small perks. No timers, no idle mechanics.
4. Sound + haptics: YES. Use FREE, license-safe audio only (CC0 preferred: Kenney.nl packs, OpenGameArt CC0, Pixabay Content License). Download and bundle files locally under assets/audio/ (small: ogg/mp3/m4a, total ideally < 3 MB; iOS Safari must play them — provide mp3 or m4a). One calm background music loop for map/town and one for battle; SFX for card play, summon, hit, push, lantern damage, victory, defeat, button tap. CREDITS.md must list EVERY audio file: filename, source URL, author, license. If a download fails, use WebAudio-synthesized fallback rather than unlicensed files. Mute toggles (music / SFX separately), persisted. Haptics via navigator.vibrate where supported (silently no-op on iOS).

## Aesthetic bar
Polished warm picture-book style: cream paper, ink linework, lantern amber accent, soft night indigo, muted sage. Unified, calm, NOT busy: generous spacing, few colors, consistent outline weight across all SVG characters/tiles/cards, restrained animation (ease, 150-350ms). Forbidden: dark glassmorphism, backdrop blur, neon glow, purple-blue gradients, emoji as icons, generic AI-startup look. Fonts: PingFang HK/TC, Noto Sans TC, system-ui. Respect prefers-reduced-motion.

## iPhone 390 / tap-only
Design for 390x844 (also 320-430 wide, no horizontal overflow). Tap only: tap card -> valid tiles glow -> tap tile; tap card again cancels; tap unit/enemy -> info sheet; undo last move each turn. Targets >= 44px, End Turn in thumb zone, no scroll/zoom during battle (touch-action, viewport), safe-area insets. Enemy intents always visible on the board (path arrows, red target tiles, damage number). Skippable guided tutorial on first run.

## grokbot integration (required)
- Lives at grokbot projects/lantern-watch/; ONLY relative paths (./x.js), no leading /.
- index.html must include before </body>: <script src="../_shared/back.js" defer></script>
- Set document.body.dataset.gbPlaying='1' during battle, remove on menus.
- Static only, no backend, no CDNs.

## Engineering
Rules engine (pure JS modules, seeded RNG) separate from rendering. localStorage save incl. mid-run resume, versioned save with safe migration. Tests runnable with `node tests/*.test.mjs` (no deps): damage, intents, synergies, upgrades, save/load, full bot runs on all difficulties without errors, balance report (bot win rates). Screenshot script with puppeteer-core (/usr/bin/google-chrome; module at /workspace/nightly/shotkit/node_modules) -> screenshots/: title, tutorial, battle with intents, card selected, reward, map, town; console errors = 0. README.md in Cantonese. Run length 10-15 min (8 nights). Commit often; do not push or create repos.

## Original brief details
## Step 1: write DESIGN.md FIRST (core loop, numbers, content lists), then implement it.
Suggested concept (you may improve): 「燈籠小鎮守夜人」 cozy lantern-town defense. Each night, fog creatures advance across a small grid (e.g. 5 cols x 6 rows) toward the town's lanterns. Player draws cards each turn (energy 3) to summon/move cozy guardian units (e.g. 貓巡邏員, 茶師傅, 燈籠匠, 稻草人, 狸貓魔術師, 小龍) and cast spells. Requirements:
- Unit/card synergy (adjacency buffs, combos, positioning, push/pull, tags), multiple unit types (>=6), enemies (>=8 types + 2-3 bosses) whose NEXT-TURN INTENTS are always shown clearly on the grid (arrows/target tiles/damage numbers).
- Run = ~10-15 min: a short map of ~8-10 nights with branching nodes (battle, elite, shop/tea house, rest, event), card rewards, card upgrades, relics/trinkets.
- Light meta progression: unlock new units/cards/starting decks across runs, stats, saved in localStorage (save mid-run too; resume after reload).
- Interactive tutorial for first run (skippable), plus 3 difficulty levels.
- Controls: TAP ONLY. Tap card -> valid tiles highlight -> tap tile. Tap unit to see info. Big touch targets (>=44px), undo-friendly (cancel selection by tapping card again), no drag required, no zoom/scroll during battle, safe-area insets.
- Satisfying feedback: animations, hit flashes, floating numbers, screen shake (gentle), synthesized sounds via WebAudio (mute toggle), haptic via navigator.vibrate if available.
- UI: Cantonese Traditional Chinese text throughout. Polished, tasteful, distinctive visual style — warm cozy palette (e.g. paper/ink + lantern warm tones, soft night blues), NOT generic dark-glassmorphism, NOT default AI gradient look. Hand-built SVG/CSS art for units and tiles (consistent style), nice typography (system fonts ok, e.g. PingFang TC). Everything must fit 390px wide with no horizontal overflow.
- Game rules in pure JS modules separate from rendering so they can be unit-tested. Seeded RNG.
- Tests: node tests (no deps or minimal) covering rules: damage, intents, synergies, card upgrades, save/load, a full simulated run with a simple bot that finishes without errors on all difficulties; balance sanity (bot win rate reported).
- A puppeteer-core screenshot script (chrome at /usr/bin/google-chrome; puppeteer-core is installed in /workspace/nightly/shotkit/node_modules — use NODE_PATH or require by absolute path) taking 390x844 screenshots into screenshots/r1/: title, tutorial, battle with intents shown, card selected with highlights, reward screen, map, meta unlocks. Check console errors = 0.
- README.md (Cantonese short description + how to play). Commit often with git (git add/commit in this folder; do NOT push, do NOT create GitHub repos).
When done, write reviews/r1-agy.md summarizing what you built, test results, and known gaps.
