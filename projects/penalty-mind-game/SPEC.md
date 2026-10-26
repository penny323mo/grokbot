# 12碼讀心戰 (Penalty Mind Game) — spec

A single-folder browser game (index.html + style.css + game.js, no build step, no server, no external CDN, works by double-clicking index.html and on iPhone Safari). All UI text in Traditional Chinese Cantonese (廣東話).

## Concept
A penalty shootout against an AI goalkeeper that LEARNS your habits. You alternate: you shoot 5 penalties, and you also keep goal for 5 opponent penalties (sudden death if tied after 5 each, max 10 more each).
- Shooting: pick one of 6 zones (top-left, top-middle, top-right, bottom-left, bottom-middle, bottom-right) by tapping the goal. The keeper dives based on a prediction model built from YOUR past choices (frequency + n-gram/last-2-choice pattern table, stored in localStorage across games so it gets smarter over time). Small randomness so it is not perfect. Top corners have a small miss chance (ball over/wide ~12%), bottom-middle easier to save if keeper stays.
- Keeping: opponent AI kicker chooses a zone with a mix of real-world-ish tendencies (e.g. kickers prefer their natural side ~ 60% low corners) — you tap where to dive. Show a brief "kicker run-up" animation (1s) before you must choose; if you don't choose in 1.5s you stay in the middle.
- Animations: CSS/canvas ball flight and keeper dive, net ripple on goal, simple crowd cheer text. No audio files required (optional WebAudio beeps, muted by default with a toggle).

## Screens
1. Title: name 「12碼讀心戰」, one-line pitch 「門將會讀你心——你夠唔夠估佢唔到？」, Start button, toggle sound, button to reset the AI's memory.
2. Match: scoreboard (你 vs 電腦, per-kick dots ✅/❌), whose turn, goal with 6 tappable zones.
3. After each of your shots: show keeper's "mind-reading" panel: 「門將估你射：右上 (信心 47%)」 and bar chart of the predicted probabilities for the 6 zones — this is the fun part.
4. End screen: result, stats (your zone heatmap over all games, how predictable you are = entropy-based 「可預測度」 score 0–100, how often keeper guessed right), Play again.

## Quality
- Mobile-first, responsive, touch-friendly (big targets), works 375px wide portrait and desktop.
- No console errors. Pure vanilla JS. Logic separated so the prediction model is a pure function testable in Node (export via `if (typeof module!=='undefined') module.exports=...`).
- Include a tiny `tests/model.test.js` runnable with `node tests/model.test.js` that checks the predictor learns a repeated pattern (e.g. after 10× always "top-left", it predicts top-left with highest probability) and entropy score behaves.
- README.md in Cantonese explaining how to play.
