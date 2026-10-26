# 燈籠小鎮守夜人 v2 — Visual Overhaul (keep all gameplay; v1 brief in SPEC-v1.md)
Owner feedback on v1: "小學生 level" — looks childish. Goal: mature, refined, atmospheric art, polish level of Into the Breach / Slay the Spire / Monument Valley. iPhone 390px first.

## Art direction
- Palette: deep indigo/ink night (#0E1230, #1A1F45, #2A2F5E), warm lantern glow (#F2B45A, #D9822B), cool fog (#8FA3C7 at low alpha), muted parchment for text (#EDE3CF). No flat beige tiles, no emoji, no cartoon clip-art, no thick black outlines.
- Board: illustrated night-town backdrop with depth — layered SVG/CSS (sky gradient, distant rooftops silhouette, drifting fog layers), tiles lit with subtle bevel/stone texture (SVG noise/patterns), slight isometric tilt or top-down with soft shadows. Lantern tiles emit radial glow that lights neighbours. Gentle animated fog.
- Units/enemies: one cohesive hand-authored SVG illustration set (consistent line weight, rim light from lantern side, limited palette), silhouettes readable at small size. Enemy intents shown with refined icons + target-tile highlight.
- Cards: proper card frame (border ornament, cost gem, type banner, title in serif/display font, rules text), unique SVG art per card (or per card type minimum with variations). Card types visually distinct by frame colour.
- Typography: clear hierarchy; use a free web font (e.g. Noto Serif TC / Noto Sans TC via Google Fonts, OFL) — credit it.
- Hand must fit 390px: fan or horizontal scroll, no clipping off-screen, never ellipsis-truncate rules; tap a card → detail/enlarged view, tap again or button to play.
- Smooth micro-animations (card lift, play, damage numbers, glow pulses), respect prefers-reduced-motion.
- All screens restyled consistently: title, map, battle, card selected, reward, town, tutorial.
- grokbot back chip must never overlap the tutorial or any UI (reserve safe area / move it).

## Bug fixes (grok round-3 minors)
1. 突進指令 must allow diagonal movement as its text says.
2. First tap on the guardian unit shows its info (not ignored).
3. Lantern tiles must not be legal targets for attacks/moves where inappropriate.
4. 貓巡邏員 card text and code must match.

## Constraints
- Static site, relative paths, keep back button and 加入日期 in project. Keep all tests passing; add tests for the 4 bug fixes.
- Free/CC0/OFL assets only; prefer hand-authored SVG. List every asset/font in CREDITS.md.
- Take 390px screenshots (title, map, battle, card selected, reward, town) to screenshots/v2/ with a playwright/headless script and self-check they look mature and dense, iterate until they do.
