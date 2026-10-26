VERDICT: SHIP

Round-3 grok re-review against SPEC.md. Independently ran `node tests/*.test.mjs`: **18/18 pass**. Bot 20-seed report: 悠閒 90% (18/20) avg nights 7.9/8, 標準 85% (17/20) 7.8/8, 挑戰 A1 85% (17/20) 7.8/8. All five R2 MAJORs are in the engine, not just CHANGELOG. R1 CRITICAL screen-bleed is still gone. Remaining gaps are text/UX nits; none block a first playable night.

---

## R2 status

| R2 | Topic | R3 |
|---|---|---|
| M1 | 貓巡邏員 夜行雙爪 + tap-to-move + 熊 bun | **FIXED.** `app.js:494-512` tap unmoved guardian → glow tiles → `moveGuardian`. `battle.js:334-378` sets `hasMoved` + bun. Advance/reposition/rally/swap all set `hasMoved` + bun. Cat double on 突進 when `stepsMoved >= 1` (`battle.js:614-616`) and on end-of-turn auto-attack when `hasMoved` (`battle.js:960-962`). Test: `rules.test.mjs` Round 2 cat/bun. |
| M2 | 地刺竹陷 walk detonate | **FIXED.** `triggerTileHazards` `battle.js:267-289` on walk (`1046`), `moveGuardian` (`370`), advance/reposition/rally/swap. Trap roots + `skipNextMove` in enemy phase. Push still detonates inside `board.js:202-207`. Test: trap walk → 5 dmg + `isRooted`. |
| M3 | 明光光環 aura | **FIXED.** `getGuardianAtk` `battle.js:316-328` adds `haloBonus` from adjacent living `hasHalo` allies. Halo+ also +2 armor at start of player turn (`239-241`). Used by auto-attack, 突進, 連環迅擊. Test: adjacent +1 / plus +2. |
| M4 | Reward/shop type tags English | **FIXED.** `getCardTypeLabel()` `cards.js:13-19` → 召喚/指令/法術/燈火. Reward `app.js:585`, shop `:655`, upgrade `:791`, hand `ui.js:250`. `screenshots/r1/reward.png` shows 法術 / 指令. |
| M5 | 移位陣法 ignores tap | **FIXED.** `battle.js:671-718` swaps targeted unit with nearest living ally by `Board.getDistance`. Armor 2/3. Plus draws 1. Test: g1↔g2, g3 stays, hand length 1. |
| R1 C1 | Battle `display:flex` leak | **Still FIXED.** `css/style.css:235-245`. Recaptured title/town/reward/map fill 390×844 with no board chrome. |

R2 MINORs 6–13 (down-arrow move badge `art.js:403`, strip 「召喚：」 `ui.js:245`, CREDITS `./assets/audio/<file>`, mp3→m4a fallback `audio.js:123-134`, `skipStart` deserialize `battle.js:1241`, town save v2 `town.js:101-138`, hop/fox/split/windchime/mud/crafter hooks, tutorial pad `#modalTutorial .info-sheet`) are in code. Recapture `card_selected.png` now shows amber `.valid-target` glow.

---

## CRITICAL

None.

---

## MAJOR

None.

---

## MINOR

1. **突進指令 still only steps due north.**
   - Card text `cards.js:202`: 「向前或斜向突進最多 2 格」. Loop at `battle.js:591` is `nextY = curY - 1` on the same `curX`.
   - Fix: when the north tile is blocked, try `(curX±1, curY-1)` if empty; or let the player pick the landing tile among the 2-step forward/diagonal empties.

2. **Fifth hand card still clips at 76×104.**
   - `css/style.css:562-564, 617-627` `white-space: nowrap` + ellipsis. `screenshots/r1/battle_intents.png` / `card_selected.png`: 5th card title reads 「掌風!」.
   - Fix: shrink `.card-item` width to fit 5 cards in 390px (`(390 − gaps)/5`), or allow a 2-line title, or rename 掌風擊退 → 掌風.

3. **First tap on an unmoved guardian selects it for move, not the info sheet.**
   - SPEC: tap unit/enemy → info. `ui.js:194-202` routes unmoved guardians to `onTileTap`; `app.js:494-512` then glows dest tiles. Second tap on the same unit opens info (`app.js:479-486`). Enemies and already-moved guardians still open the sheet. There is no selected-unit chrome besides dest glow (`unit-wrapper` has no `.selected`).
   - Fix: keep tap-to-move (the 移動 stat is now real) but add a selected outline, and document it. Add one tutorial line. Optional: long-press or a small 「詳情」 chip for first-tap info.

4. **`Board.isEmpty` ignores lantern posts, so scarecrow / tap-move glow lantern tiles.**
   - `board.js:93-96` is empty iff `tile.unit === null`. `validateCardTarget` empty_tile (`battle.js:543-544`) and `handleTileTap` dest scan (`app.js:503`) therefore treat (0,5)/(2,5)/(4,5) as legal. `card_selected.png` glows almost the whole board including the three lanterns. Enemy attack prefers `targetTile.lanternId` (`battle.js:1062-1067`) so a unit standing on a lantern does not tank it.
   - Fix: `isEmpty` also requires `!tile.lanternId` (unless a future tank-the-post rule is explicit). Recapture `card_selected.png` with 貓巡邏員 (`empty_friendly_tile`) so rows 3–5 glow, not lanterns.

5. **貓巡邏員 skill text says 超過 1 格; code doubles after 1 step.**
   - `units.js:20`: 「若本回合移動超過 1 格後攻擊」. 突進 uses `stepsMoved >= 1` (`battle.js:614`); end-of-turn auto-attack uses `hasMoved` (`960`). The Round 2 test locks 1-step 突進 at 6 damage.
   - Fix: either change the printed skill to 「移動 1 格或以上」 or gate on `stepsMoved > 1` / Manhattan ≥ 2 and update the test.

6. **Tutorial never mentions tap-to-move.**
   - `index.html:382-387` covers 出牌 / 意圖 / 共鳴 / 悔棋. The new move gesture is the way the 移動 stat works.
   - Fix: add step 「點擊未移動的友軍，金色格子為可走範圍；再點同一單位查看詳情」.

7. **走位換防+ still only sidesteps one orthogonal neighbor.**
   - Plus text `cards.js:244`: 「移動最多 2 格」. `battle.js:626-628` picks `neighbors.find((n) => n.unit === null)` and ignores `card.value`. Dest is not player-chosen (tap-to-move now covers free 1-step, so this card is a 0-cost auto-nudge).
   - Fix: honor `card.value` as max Manhattan, or glow empties and let the player tap the dest. Weird but working line: `this.board.tiles[fromX === undefined ? unit.y : fromY][fromX]` (`629`) — replace with `tiles[fromY][fromX]`.

8. **A few unlock skills still miss their printed extra clause.**
   - 風鈴鬼 curse writes `bonusNextAtk -= 1` (`battle.js:1074`) then `startPlayerTurn` zeros it (`238`) before the next auto-attack, so the −1 never lands. Fix: clear `bonusNextAtk` after the auto-attack, or store a 1-turn curse flag.
   - 狐巫女 「登場時驅散全場友軍負面狀態」 (`units.js:129`) has no branch in `spawnGuardian` (`battle.js:168-207`).
   - 燈籠匠 破霧 strips `target.armor = 0` (`951-956`) but not 「目標格及周圍十字格驅散迷霧」.
   - Not starting-deck. Trim the 圖鑑 sentences or finish the extras.

---

## What is solid now

- `.battle-screen { display: none }` / `.active { display: flex }`. Title, tutorial, map, reward, town are full-frame 390×844 with no board leak.
- Tap-to-move, 夜行雙爪, bun drop, trap-on-walk, halo aura, Cantonese type tags, targeted 移位陣法 all match the Round 2 ship bar. Intent ↓ arrows, dest footprints, lantern dashed targets, 悠閒 shortened path.
- Relative paths, `index.html:421` `../_shared/back.js`, `gbPlaying` on battle only. No CDN, no `backdrop-filter`, no emoji chrome. Cream/ink/amber SVG, PingFang stack, `prefers-reduced-motion`, 44px nav, End Turn in the thumb zone.
- 10 mp3+m4a under `assets/audio/`, CREDITS source column `./assets/audio/<file>`, mp3 → m4a → WebAudio synth. Mute persisted. Town meta save v2 with `switch (data.version)`. Run blob v2 + `Battle.deserialize({ skipStart: true })`.
- 3 difficulties, A1 fog armor, A2–A5 hooks, 10 buildings, blazing deck, lantern HP across rest/event, skippable tutorial, `modalAlert`. Tutorial grokbot chip no longer covers line 1 (`css/style.css:665-667`).
- Tests 18/18 (10 rules + 2 intents + 3 save/load + 3 bot). Bot win rates sit in the same band as R2 (90 / 85 / 85 vs 95 / 85 / 80).
