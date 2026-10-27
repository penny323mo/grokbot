# 燈影軍略 · Lantern Tactics — DESIGN (draft for Penny's review)

## Concept
Cozy lantern-town defense. Each night fog creatures (霧怪) creep across a 5x6 grid toward the town's 3 lanterns. You command cute guardians with a small card deck. Tactics + deckbuilding + cozy town building. No football/odds.

## Core loop
Run (10-15 min) = 8 nights on a branching map: 戰鬥 / 精英 / 茶館(商店) / 溫泉(休息+升級卡) / 事件 / 最終 Boss.
Battle turn: draw 5, 3 energy -> play cards (summon/move/spell) -> units auto-attack -> enemies execute the intents shown last turn -> new intents revealed. Win = survive N turns or clear wave; lose = all lanterns out.
After battle: pick 1 of 3 cards, coins, sometimes a trinket (信物).

## Board & units
5 cols x 6 rows; bottom row = town with 3 lanterns. Terrain: 草地, 水池(slow), 竹林(cover), 燈籠台(+1 range).
Guardians (6 starting pool, 4 more unlockable): 貓巡邏員 (fast melee), 茶師傅 (heal adjacent), 燈籠匠 (ranged, lights fog), 稻草人 (taunt tank), 狸貓魔術師 (swap/push), 小龍 (row fire). Unlock: 鶴郵差, 蛙樂師, 狐巫女, 熊麵包師.
Synergy: adjacency buffs (茶師傅 beside anyone +1 regen), tags (光/毛/守/術) with 2-of-a-tag bonuses, push enemies into each other/water for bonus damage.
Enemies: 8 types (霧團, 影鼠, 紙傘怪, 跳跳燈, 鐵甲蝸, 分裂霧, 風鈴鬼, 泥巨人) + 3 bosses (霧之母, 夜鴉王, 老燈籠妖). Intents always shown: arrow path, red target tiles, damage number, icon.

## Cards / deck
Starting deck 10 cards. ~45 cards total: 召喚, 指令(move/attack again), 法術(push, shield, fog-clear), 燈火(lantern repair). Each card has an upgraded + version. Remove cards at 茶館. Trinkets (~20) bend rules.

## Casual / cozy elements
Between runs: 小鎮 screen — spend 星燈 (meta currency) to build cosy houses that unlock units/cards/start-decks; daily seed run; collection book (圖鑑) with fluffy flavour text in Cantonese; gentle sounds, satisfying pops, no fail-shaming; runs resumable anytime.

## Progression
Meta: 星燈 earned every run (win or lose) -> 10 town buildings -> unlocks. 3 difficulties (悠閒/標準/挑戰) + 5 ascension levels after first win. All saved in localStorage, including mid-run.

## iPhone controls
Tap only. Tap card -> valid tiles glow -> tap tile. Tap card again to cancel. Tap unit/enemy for info sheet. 1-step undo per turn for moves. Buttons >=44px, End Turn in thumb zone, no zoom/scroll in battle, safe-area aware. First-run guided tutorial (skippable).

## Visual style
Warm paper-and-ink storybook: cream paper texture, ink outlines, lantern amber + soft night indigo, muted sage. Hand-made SVG characters with consistent chunky outline. NOT dark glass, NOT neon gradients. PingFang TC typography, card frames like 揮春/印章 seals.

## Tech
Static HTML/JS/CSS, no backend, rules engine separate from rendering, seeded RNG, node tests + bot simulating full runs for balance, 390px screenshots. Lives at grokbot/projects/<slug>, added 2026-10-26.
