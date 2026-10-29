# Changelog

## 0.1.0 — 2026-10-30

- Playable static build of 百草堂 / The Herbalist's Ledger: seven days in a 1931 Xiguan shop, twenty-one customers, twenty-four herb plates, and three ledger puzzles.
- Diegetic counter, 百子櫃, 藥典, wrapping paper, magnifier, 戥子, regional map, letters, and evening marginalia. Tap-to-give always works; drag onto the paper is optional.
- A wrong parcel lowers reputation and brings the customer back the next morning. Day 7 still resolves the pawn-ticket mystery, with 物證, 半紙, and 口證 endings.
- Save key `baicaotang-ledger-v1`. After the shop is cleared, 章回 reopens any dawn. 繼續 returns to the scene you left, including the ending.
- Self-hosted Noto Serif TC, Ma Shan Zheng, and Cormorant Garamond. Original rain, bell, paper, drawer, and scale sounds.
- Node integrity tests in `tests/integrity.test.js` check unique solutions, plates, portraits, audio, relative paths, and the fiction-only wording.

## Round 1 fixes

- A return visit shows the result line. A correct return restores one point of reputation, writes the drawer label, and leaves the queue only after 送客. A second miss stays at the counter and does not drop reputation again.
- Today's ledger cipher stays shut on the counter until the evening beat. A puzzle already solved, or from an earlier day, still opens.
- Ma Shan Zheng ships as a subset woff2 (91720 bytes). Glyphs the source font never contained still fall back to Noto Serif TC per character. The full TTF is not in `assets/`.
- Optional drag starts on the plate specimen. The wrapping sheet is a separate drop target, and the specimen sits outside it until the drop. A stationary tap does not place the herb. 放上紙 still wraps.
- A miss still waiting on day 7 is served before 馬福.
- An unlabeled cipher slot shows the drawer index and one naked line, so a filled cipher stays readable.
- The 甘草 look-alike line uses 卻, matching the rest of the compendium.
- Integrity tests also walk the endings, the disclaimer, the copy in `src/game.js`, and the evening ledger gate.

## Round 2 fixes

- Leaving a ledger cipher returns to the phase you opened it from. A morning return stays at the counter, and a day-7 return is no longer saved as an empty desk. 繼續 on that empty desk goes back through the return queue, or on to 馬福 when nobody is waiting.
- A drag on the plate specimen has to be a long sideways stroke before it counts as 攞去包. A vertical stroke still scrolls the plate. The tap on 攞去包 is unchanged, and dropping a herb onto the wrapping paper is unchanged.
- A ledger row whose customer can no longer be found is skipped, so a bad id does not close the book.

## Round 3 fixes

- A save whose phase is `puzzle` but whose cipher id matches nothing leaves that screen the same way 返回 does: back to the return queue, the counter, or the next morning.
- A result with no parcel, or a return whose customer can no longer be found, uses the same recovery as an empty desk. A bad id in the queue is dropped so the next real return still renders.
- Integrity tests assert that today's cipher stays shut during `returns`, and that closing or collecting a cipher opened from that queue comes back to it.
