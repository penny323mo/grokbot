# Changelog

## Round 1 fixes

### Critical Fixes
- **CRITICAL #1 (Screen switching & battle chrome bleed)**:
  - Updated `css/style.css` so `.battle-screen` is `display: none` by default and `display: flex` only when `.active`.
  - Fixed `#screenBattle` bleeding underneath Title, Tutorial, Map, Reward, and Town screens.
  - Re-captured all 7 screenshots in `screenshots/r1/` at 390×844 and verified 0 console errors and clean full-viewport layouts.

### Major Fixes
- **MAJOR #2 (Bundled CC0 audio & CREDITS attribution)**:
  - Bundled 10 CC0 audio files in both `.mp3` and `.m4a` format under `assets/audio/` (<350KB total) covering 2 BGM loops (town/map and battle) and 8 SFX (`tap`, `card_play`, `summon`, `hit`, `push`, `lantern_damage`, `victory`, `defeat`).
  - Rewrote `CREDITS.md` with complete tabular attribution for every audio file (filename, format, role, source, author, license).
  - Updated `js/audio.js` to load bundled audio via `Audio()` with graceful procedural WebAudio fallback.
- **MAJOR #3 (Emoji replacement with ink-outline vector SVGs)**:
  - Completely eliminated emojis from chrome, buttons, badges, tutorial, and map nodes.
  - Added vector `SVG_ART.icons` (`home`, `coin`, `star`, `undo`, `music`, `sfx`, `lantern`, `moon`, `town`, `book`, `tea`, `sword`, `boss`, `hotspring`, `shrine`, `attack`, `move`, `spawn`, `aoe`, `frozen`, `check`).
  - Styled map nodes with ink-drawn vector glyphs and replaced all resource markers.
- **MAJOR #4 (Enemy intents on the board)**:
  - Rendered directional SVG path arrows along `intent.path`, dashed crimson target highlight with damage number badge on `targetPos`, and footprint marker on `destPos`.
  - Changed `.grid-tile` to `overflow: visible` so markers are never clipped.
  - Implemented simplified telegraphing (dest tile + damage) for 悠閒 (Relaxed) difficulty.
- **MAJOR #5 (Catalogue cards and unit skills)**:
  - Implemented full logic for `card_command_advance` (steps up to 2 tiles forward and strikes), `card_command_reposition`, `card_command_rally`, `card_command_strike_again`, `card_command_tactical_swap`, `card_spell_freeze_mist`, `card_spell_bamboo_trap`, `card_lantern_guardian_halo`, `card_lantern_ignite`, and `card_lantern_oil_flask_plus`.
  - Implemented unit skills: Tanuki push-back, Little Dragon line pierce, Frog Bard cross push, Crane Courier card draw on kill, Scarecrow reflect damage, Stone post +1 range, and Double Light resonance (burn damage + lantern heal).
  - Added unit tests in `tests/rules.test.mjs` verifying board deltas for all starting-deck cards and skills.
- **MAJOR #6 (Run-level lantern persistence, Ascension 1, and Boss specials)**:
  - Persisted `activeRun.lanternHp = [hp1, hp2, hp3]` and `maxLanternHp` across battles, hot spring rest heals (+2 up to max), and shrine events (full restore).
  - Implemented Ascension 1 fog mask (`isFogRow`: rows 0-2) and dense mist shroud (+1 armor to enemies in fog rows).
  - Implemented Boss special moves matching `enemy.typeId`: `boss_mother_of_mist` (splits mist + armor shield), `boss_night_crow_king` (sweeping dive), and `boss_elder_demon` (lantern drain).
- **MAJOR #7 (Town unlocks and deck selection)**:
  - Added starting deck selection (Standard vs Blazing Lantern) on run start when the Pavilion (`deck_blazing`) is built.
  - Gated card rewards and shop pools by `town.unlockedUnits` so locked guardian cards do not appear prematurely.
- **MAJOR #8 (Versioned run state & mid-battle resume)**:
  - Upgraded run state save to `version: 2` with backward-compatible migration for v1 blobs in `TownManager`.
  - Serialized ongoing battle state (`Battle.serializeState()`) into `activeRun.battleState` and restored directly mid-fight via `Battle.deserialize()`.

### Minor Fixes
- **MINOR #9**: Persisted mute settings now update `#btnToggleMusic` / `#btnToggleSfx` opacities at init.
- **MINOR #10**: Tutorial flag `lantern_watch_tutorial_seen` is written only when dismissed or closed.
- **MINOR #11**: Replaced native `alert()` calls with picture-book styled `#modalAlert` dialog sheets.
- **MINOR #12**: Widened hand cards to 76px × 104px for comfortable type rendering and zero wrapping on names.
- **MINOR #13**: Set `theme-color` to `#FAF6EE` (warm paper) and restyled armor HP badges to indigo-slate `#4A5B73`.
- **MINOR #14**: Displayed actual card costs in hand via `battle.getCardCost(card)`, properly reflecting Ascension 3 and Mystic tag modifiers.
- **MINOR #15**: Expanded automated balance testing to 20 seeds per difficulty (Relaxed 95%, Standard 85%, Challenging A1 80%).
- **MINOR #16**: Added confirmation dialog and auto-save snapshot before returning home during active battle.
- **MINOR #17**: Wired `push` SFX to play upon `unit_pushed` battle events.
- **MINOR #18**: Included terrain, bamboo traps, and bear buns in undo snapshot and battle state serialization.

## Round 2 fixes

### Major Fixes
- **MAJOR #1 (Cat Patrol "Night Claw" double swipe & manual guardian movement)**:
  - Enabled manual friendly guardian movement: tapping an unmoved friendly guardian on the board highlights valid empty destination tiles within `move` range; tapping a valid tile invokes `battle.moveGuardian()`, setting `hasMoved = true` and dropping a steamed bun if the unit is a Bear Baker.
  - Updated `card_command_advance` (突進指令) to apply the double swipe attack (`dmg *= 2`) when `stepsMoved >= 1` and `unitId === "cat_patrol"`.
  - Updated all guardian relocation cards (`card_command_advance`, `card_command_reposition`, `card_command_rally`, `card_command_tactical_swap`) to set `hasMoved = true` and trigger Bear Baker bun drops on vacated tiles.
- **MAJOR #2 (Bamboo trap detonation on unit walk & hazard triggers)**:
  - Extracted centralized `triggerTileHazards(unit, tile)` helper on `Battle`.
  - Wired hazard checks to trigger when enemies walk onto tiles during `endPlayerTurn()`, as well as on pushes and card relocations.
  - Bamboo traps now detonate when walked on, dealing 5 damage and inflicting `isRooted = true` (with `skipNextMove = true` during enemy movement), preventing the enemy from moving for 1 full turn.
- **MAJOR #3 (Guardian Halo "明光光環" aura implementation)**:
  - Added `getGuardianAtk(guardian)` calculating guardian attack power with +1 (+2 for upgraded halo) for each orthogonally adjacent living friendly unit with `hasHalo`.
  - Applied `getGuardianAtk()` to guardian auto-attacks, command strikes, and advance strikes.
  - Upgraded halo grants +2 armor to the bearer at the start of each player turn.
- **MAJOR #4 (Cantonese card type tags in reward, shop, and upgrade screens)**:
  - Exported `getCardTypeLabel(type)` mapping `CARD_TYPES` to Cantonese labels (`"召喚"`, `"指令"`, `"法術"`, `"燈火"`).
  - Updated `renderRewardScreen`, `openShopScreen`, and `openCardUpgradeModal` to use `getCardTypeLabel()`.
- **MAJOR #5 (Tactical Swap "移位陣法" targeting & card draw)**:
  - Rewrote `card_command_tactical_swap` to swap the targeted friendly guardian at `(x, y)` with the nearest living ally by Manhattan distance.
  - Both guardians gain +2 armor (+3 for upgraded) and `hasMoved = true`.
  - Upgraded version (`card_command_tactical_swap_plus`) draws 1 card as specified in card text.

### Minor Fixes
- **MINOR #6 (Intent move badge orientation)**:
  - Updated SVG path in `art.js:icons.move` to point downwards towards the player's lanterns, matching path direction and dest markers.
- **MINOR #7 (Card title display & layout polish)**:
  - Stripped redundant `"召喚："` prefix from hand card titles since the type tag already displays `"召喚"`, preventing text overflow.
  - Tuned `.card-title-mini` (10px, 1.15 line-height) and `.card-desc-mini` (2-line clamp) in `css/style.css`.
- **MINOR #8 (CREDITS source URLs & audio fallback)**:
  - Updated Source URL column in `CREDITS.md` to relative repo paths `./assets/audio/<file>` for all 10 audio rows.
  - Updated `js/audio.js` to attempt `.mp3`, then `.m4a` on playback error, before falling back to procedural WebAudio synthesis.
- **MINOR #9 (Valid-tile glow in screenshot capture)**:
  - Updated `scripts/capture_screenshots.mjs` to select a summon card, cleanly showcasing rows 3–5 glowing amber with `.valid-target`.
  - Re-captured all 7 screenshots with 0 console errors.
- **MINOR #10 (Battle deserialization skipStart)**:
  - Passed `{ skipStart: true }` to `Battle` constructor during `Battle.deserialize()` to avoid redundant wave and deck initialization.
- **MINOR #11 (Town meta save migration)**:
  - Bumped town metadata save version to 2 and added `switch (data.version)` migration handler in `TownManager.load()`.
- **MINOR #12 (Unit special skills and mist behaviors)**:
  - Implemented `hop_lantern` (跳跳燈) leap in `ai.js:findBestStep` to hop over adjacent blocking units when the 2nd tile in that direction is empty.
  - Implemented Fox Maiden (`fox_maiden`) +3 divine damage vs Boss/Elite/armored units in `damageUnit()`.
  - Implemented Split Mist (`split_mist`) spawning two 3-HP `fog_blob` units on defeat.
  - Implemented Windchime Spectre (`windchime_spectre`) curse (-1 attack on next turn) and Mud Golem (`mud_golem`) heavy slam push.
  - Implemented Lantern Crafter (`lantern_crafter`) 破霧明燈 stripping fog armor.
- **MINOR #13 (Tutorial Grokbot chip spacing)**:
  - Added padding to `#modalTutorial .info-sheet` to eliminate overlap with the floating Grokbot badge.

## Round 3 fixes

### Minor & Polish Fixes
- **MINOR #1 (突進指令 Diagonal Advance Navigation)**:
  - Updated `card_command_advance` so if straight north is occupied by an ally or obstacle, the unit routes diagonally forward into empty space `(curX ± 1, curY - 1)`. If an enemy occupies the north tile, advance stops in front of the enemy to deliver the strike.
- **MINOR #2 (Hand Card Width & Title Typography)**:
  - Adjusted hand card width from 76px to 71px and hand gap to 5px in `css/style.css`, guaranteeing all 5 drawn cards fit seamlessly within the 390px mobile viewport without horizontal overflow.
  - Allowed 2-line title wrapping (`-webkit-line-clamp: 2`) with `word-break: break-all` to eliminate title clipping on cards like 掌風擊退.
- **MINOR #3 & #6 (Selected Unit Visual Feedback & Tutorial)**:
  - Added `.selected-unit` styling with glowing amber outline on selected friendly guardians during move mode.
  - Added tutorial step in `index.html`: 「3. 戰術走位：點擊未移動的友軍，金色格子為可走範圍；點擊目標格即可移動，再次點擊同一單位可查看詳情。」
- **MINOR #4 (Lantern Tile Exclusion in `Board.isEmpty`)**:
  - Updated `Board.isEmpty(x, y)` to require `!tile.lanternId`. Lantern posts (0, 5), (2, 5), (4, 5) are no longer treated as empty tiles, preventing summons, bamboo traps, and tap-to-move highlights from overlapping lantern positions.
- **MINOR #5 (Cat Patrol Skill Copy Alignment)**:
  - Updated `cat_patrol` skill description in `units.js` to 「若本回合移動 1 格或以上後攻擊，連續揮爪攻擊 2 次（造成雙倍傷害）。」, matching the game logic and test suite.
- **MINOR #7 (走位換防+ Multi-tile Reposition)**:
  - Enhanced `card_command_reposition` to support `card.value || 1` steps (up to 2 steps for upgraded version), and cleaned up vacated tile array indexing.
- **MINOR #8 (Unlock Skills & Status Effects Completion)**:
  - Implemented persistent `curseAtk` on guardians inflicted by Windchime Spectre (`windchime_spectre`), correctly reducing attack by 1 on the unit's next strike.
  - Implemented Fox Maiden (`fox_maiden`) on-spawn cleanse, purging all curses and debuffs from living friendly guardians.
  - Implemented Lantern Crafter (`lantern_crafter`) 破霧明燈 stripping fog armor on target and adjacent fog enemies.


## v2 visual overhaul

### Visual & Atmospheric Overhaul
- **Deep Indigo & Warm Lantern Palette**:
  - Replaced v1 beige paper aesthetic with a mature, atmospheric deep indigo night theme (`#070914`, `#0E1230`, `#141938`, `#1A2146`).
  - Implemented warm radial lantern lighting (`#F2B45A`, `#FFAE42`, `#D9822B`) casting amber glow across defender lines.
  - Added cool mist overlays (`#8FA3C7` at low alpha) with gentle animated ambient drifting fog.
  - Styled all typography with Google Fonts `Noto Serif TC` (headings, titles, card frames) and `Noto Sans TC` (rules text, UI stats).

### Illustrated Board & Depth
- **Slate Courtyard Tactics Grid**:
  - Restyled 5x6 battle grid with beveled dark slate pavers, subtle inner shadows, and terrain-specific aesthetics (mystic water pool, jade bamboo grove, carved stone post, swirling fog shroud).
  - Valid target highlights transformed into ethereal pulsing golden runes with ambient amber glow.
  - Unit sprites given directional rim lighting, drop shadows, and refined stat badges.

### Card Frames & Hand Experience
- **Fantasy CCG Card Architecture**:
  - Designed distinct card frame borders color-coded by archetype: Emerald Jade for 召喚 (Summon), Azure Slate for 指令 (Command), Mystic Amethyst for 秘術 (Spell), Radiant Amber for 燈籠 (Lantern).
  - Added faceted glowing cost gems at the top-left, serif title ribbons, and inset SVG illustration windows.
  - Created 30 unique hand-drawn card vignette illustrations in `SVG_ART.cardArt`.
  - Hand cards fit iPhone 390px viewport smoothly with snap points; tapping cards provides instant selection and inspection via `#modalCardInspect` for complete, unabridged rules examination.

### Bug Fixes & Mechanical Integrity
- **Bug 1 (突進指令 Diagonal Navigation)**: Allows routing diagonally forward into empty tiles `(curX ± 1, curY - 1)` when forward progress is obstructed.
- **Bug 2 (Guardian First-Tap Info)**: Tapping any guardian on the grid immediately opens its detailed info sheet; unmoved guardians feature a prominent `「戰術移動 (移動 N 格) ❯」` button to initiate movement.
- **Bug 3 (Lantern Target Exclusion)**: Lantern tiles are excluded from summon, movement, and spell targeting where inappropriate.
- **Bug 4 (Cat Patrol Description Alignment)**: Synchronized card description with mobile double-swipe logic (`「若本回合移動 1 格或以上後攻擊，連續揮爪攻擊 2 次（造成雙倍傷害）。」`).
- All 22 automated rules, intent, save/load, and bot simulation tests passing.

### Grokbot Integration & Safe Areas
- Added 56px left safe-area inset to `.top-nav` and 52px top padding to modal sheets to ensure the fixed Grokbot back button never overlaps UI text, controls, or icons.

## Round 1 fixes

### Critical & Visual Depth Polish
- **CRITICAL #1 (Board Depth, Layered Skyline & Lantern Glow Wash)**:
  - Transformed `.board-container` into a rich, layered night scene featuring a distant town pagoda skyline backdrop (`SVG_ART.skyline` with stars, crescent moon, and warm window lights), animated cool drifting mist, and beveled dark slate courtyard pavers.
  - Implemented dynamic orthogonal lantern glow wash (`.lantern-glow-neighbour`): active lanterns at `(0,5)`, `(2,5)`, `(4,5)` now cast warm radial amber light onto neighbouring tiles `(0,4)`, `(1,5)`, `(2,4)`, `(3,5)`, `(4,4)`.
  - Added unit rim lights (`.guardian-unit` warm gold rim light and `.enemy-unit` crimson rim light) with deep drop shadows.

### Major Gameplay & UI Fixes
- **MAJOR #2 (Unabridged Card Rules & First-Tap Inspection)**:
  - Removed truncated rules text clamp from mini in-hand cards. Mini cards now render clean cost gems, archetype tags, rich vector art frames, and serif titles.
  - First tap on any hand card opens the full inspection sheet (`#modalCardInspect`) showing unabridged rules text and large vector illustration without any ellipsis.
  - Player confirms play mode via `「出牌 / 選擇目標 ❯」`, which activates golden rune pulse highlights on valid board tiles.
- **MAJOR #3 (Full Unit Illustration Embeddings on Cards & 64px Architectural Town Thumbnails)**:
  - Directly linked all summon card art (`cardArt[id]`) to authentic unit sprite illustrations (`cat_patrol`, `tea_master`, `mole_smith`, `scarecrow`, `tanuki_mage`, `lantern_dragon`, `crane_courier`, `frog_bard`, `fox_maiden`, `bear_baker`).
  - Rewrote town buildings with 64px illustrated architectural SVGs (`bldg-thumb`) and applied `white-space: nowrap; flex-shrink: 0;` to building subtitles so 「(解鎖新守護者：鶴郵差)」 never wraps mid-word.
- **MAJOR #4 (Tutorial Copy Overhaul & Grokbot Safe Clearance)**:
  - Rewrote tutorial step 3 in `index.html`: `「3. 戰術走位：點友軍開詳情，再按『戰術移動』即可選擇金色格子前進。」`.
  - Removed obsolete `--ink-*` and `--paper-*` variables across `index.html`.
  - Padded `#modalTutorial` 50px below top viewport so Grokbot back button at top-left has complete clearance.
  - Added `screenshots/v2/tutorial.png` to automated screenshot captures.

### Minor Polish & Compliance
- **MINOR #5 (Inline Chrome SVGs)**:
  - Replaced legacy v1 thick-outline SVGs in `index.html` navigation and action buttons with modern v2 vector icons matching `art.js:icons`.
- **MINOR #6 (Target Highlighting Precision in Screenshot)**:
  - Updated screenshot script to select 貓巡邏員 (`card_summon_cat`), highlighting only defender rows 3–4 (excluding lantern posts) instead of the entire board.
- **MINOR #7 (Cantonese Localization for Bosses)**:
  - Localized Boss map node to `決戰黎明 (首領)` in `js/engine/map.js` and 图鉴 to `[首領]` in `js/render/ui.js`.
- **MINOR #8 (Local Noto Serif Font Bundling)**:
  - Bundled local `assets/fonts/notoseriftc.woff2` and declared local `@font-face` in `css/style.css` for offline and headless rendering.

### Automated Tests & Verification
- Independently ran `npm test`: all 22 rules, intents, save/load, and simulation tests pass.
- Automated 20-seed bot runs: Relaxed 100% (20/20), Standard 90% (18/20), Challenging A1 85% (17/20).
- Puppeteer captured all 7 screenshots into `screenshots/v2/` (`title.png`, `battle.png`, `card-selected.png`, `reward.png`, `map.png`, `town.png`, `tutorial.png`) with 0 console errors.

## Round 2 fixes

### Major Fixes
- **MAJOR 1 (Wrong Sprite Keys for 燈籠匠 and 小龍)**:
  - Fixed sprite aliasing in `js/render/art.js` where `card_summon_lantern_crafter` and `card_summon_dragon` incorrectly targeted non-existent keys `mole_smith` and `lantern_dragon`.
  - Mapped them to the handcrafted guardian unit illustrations `SVG_ART.lantern_crafter` and `SVG_ART.little_dragon`.
  - Verified 燈籠匠 and 小龍 render with their unique guardian portraits on both cards and on-board units.

- **MAJOR 2 (Unabridged Card Rules in Rewards, Shop, and Upgrade Modal)**:
  - Eliminated `.card-desc-compact` and two-line ellipsis clamping from reward, shop, and upgrade card tiles.
  - Added dedicated full-text preview box (`#rewardCardDescBox`) beneath reward cards displaying complete, unabridged rules text and archetype highlight on selection.
  - Updated shop and town blacksmith upgrade flows to open the inspection sheet (`ui.openCardInspect`) on card tap with context-specific action buttons (`購買 (30 銅錢) ❯` and `確認強化 ❯`), presenting complete card mechanics prior to transaction.

- **MAJOR 3 (Illustrated Non-Summon Card Vignettes & Atmospheric Polish)**:
  - Replaced generic geometric stickers across all command, spell, and lantern cards with detailed handcrafted fantasy vignettes (`gust`, `fireball`, `barrier`, `whirlwind`, `freeze_mist`, `bamboo_trap`, `spirit_rain`, `thunder_strike`, `refuel`, `flare`, `guardian_halo`, `ignite`, `oil_flask`, `advance`, `reposition`, `rally`, `strike_again`, `tactical_swap`).
  - Added `SVG_ART.titleBackdrop` in `js/render/art.js` and rendered night skyline with silhouette pagodas, bridge lantern posts, and river mist behind the title buttons.
  - Implemented 12s drifting fog keyframe animation (`@keyframes driftFog`) across battle, map, and title backgrounds with `@media (prefers-reduced-motion: reduce)` accessibility override.

### Minor Fixes & Polish
- **MINOR 4 (Local Noto Sans TC font bundling)**:
  - Bundled local `assets/fonts/notosanstc.ttf` alongside `notoseriftc.woff2` and configured local `@font-face` in `css/style.css` for complete offline and headless typography rendering.
- **MINOR 5 (Card Title 2-Line Wrap)**:
  - Allowed `.card-title-serif` to wrap cleanly across up to 2 lines (`-webkit-line-clamp: 2`, `word-break: break-all`) so longer card names never clip.
- **MINOR 6 (Town Screen Scroll & Padding)**:
  - Expanded `.town-screen-content` bottom padding to 64px and adjusted building card padding so the final building (鍛造工房) and its description are fully visible without viewport cut-off.
- **MINOR 7 (Stone Paver Granularity)**:
  - Added multi-point stone grain pattern (`.grid-tile::before`) to courtyard tiles for authentic stone slab texture.

### Verification & Automated Testing
- Verified `npm test`: all 22 rules, intents, save/load, and simulation tests pass with 0 failures.
- Bot simulations (20 seeds each): 悠閒 100% (20/20), 標準 90% (18/20), 挑戰 A1 85% (17/20).
- Re-captured all 7 screenshots into `screenshots/v2/` (`title.png`, `battle.png`, `card-selected.png`, `reward.png`, `map.png`, `town.png`, `tutorial.png`) with 0 console errors.
