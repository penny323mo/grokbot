# Changelog

## M1 — playable vertical slice

- Soft low-poly island, mint against coral, glowing ownership line.
- Headquarters and barracks. Barracks refill over time; count badges follow the crowds.
- Tap-tap or drag to send a whole stack. Instanced soldiers march, clash by subtraction, and capture buildings.
- Win sheet when the enemy headquarters falls. Lose sheet when yours does.
- Mute toggle persisted in `localStorage`.
- Node tests for combat math, capture, march, and match outcomes.

## Round 0 — scaffold

- PLAN.md, orch.json, build prompt, GitHub Pages target.

## Round 1 fixes

- Count pills, roofs, and flags take a tap or a drag-release within 44 CSS pixels. The ground disc still selects the building foot.
- A drag that does not send puts the hint back on the real selection.
- A friendly arrival fills a building only up to its cap. Extra soldiers stay with the squad.
- A player order leaves a small garrison. The enemy barracks waits until after the player barracks first reads 滿, and a 14-troop enemy headquarters can still probe.
- The ownership glow reuses one zone list and one segment buffer.

## Round 2 fixes

- Rebuilt `static/app.js` so the shipped page uses the 44px screen pick for count pills, roofs, and flags.
- A friendly squad waiting outside a full building can be tapped or dragged to another building. That order retargets the squad and leaves the garrison where it is.

## Round 3 fixes

- A squad standing on a building keeps its count pill. That building's roof, flag, and foot stay on the building.
- Rebuilt `static/app.js` so the shipped page uses that pick.

## Round 4 fixes

- The 390×844 review shipped with the round 3 pick already in `static/app.js`. Tests stayed at 37/37.

## Round 5 fixes (M2)

- The ownership edge is a green-to-red glow and it moves when a slab is captured. A headquarters under siege pulses and reads 危, and it refills with a slow trickle. The headquarters is a tower and the barracks is a long hall. Win and lose sheets share one Cantonese register.
- Home screen offers 對岸, 長路, and 雙橋, plus 易/中/難. Each map has a personality. The enemy defends an incoming march, and a thin garrison still sallies so a siege cannot leave it idle.
- 加速 and 加固 can be bought mid-match from a friendly building. The cost is troops, and the mark shows on that building.
- Shadows bake when the island mounts, and static props share meshes, so a full match stays at or above 50 fps at 390×844.
- Node tests cover AI orders, upgrade math, and the map JSON. Rebuilt `static/app.js`.

## Round 6 fixes

- The 390×844 review found no critical, major, or minor defects. The glow, headquarters trickle and pulse, Cantonese sheets, and tower-versus-hall silhouettes were already in `static/app.js`. Tests stayed at 46/46.

## Round 7 fixes (M2 polish)

- The first match shows 「撳自己建築可以升級」. A player building that can pay wears an ⬆ chip, and choosing it opens 加速 and 加固.
- 中 keeps enemy marches off the player headquarters for 20 seconds, and 難 for 12. The toast 敵軍打緊司令部 appears when a squad is heading there. 易 still attacks, in squads of at most 8. On 中, sending both 雙橋 barracks as the opening wave comes due can still win.
- The ownership edge is solid mint on the player side and solid coral on the enemy side, with the cream bridge left visible beside it.
- Count pills spread apart. A squad badge moves clear of a building, and the building keeps the tap.
- Mute shows 🔊 or 🔇, and the label says the Cantonese action. The map button says 揀地圖. The result sheet adds the match time under the one-line reason.
- Node tests cover a 40-second attack on every difficulty, the opening grace, and upgrade affordance. 51 tests passed. Rebuilt `static/app.js`. At 390×844 the match averaged about 57 fps.

## Round 8 fixes (art restyle — mature military)

- Terrain is muted olive, dust, and grey water. Player paint is command green and enemy paint is operational red. The ownership edge is those two glows on a hard split, and the bridge is neutral grey.
- The headquarters is a wide bunker with a dish and an antenna. The barracks is a lower hangar with a roll door and no dish.
- Squads are helmeted soldiers with a rifle aimed along local −z. Count badges are hard dark panels with a rifle mark, and the ⬆ chip stays on buildings that can pay.
- HUD panels use a 2px radius, a dark fill, and a hard edge. Mute stays 🔊 or 🔇. The start button says 出戰, and the result sheet says 攻陷敵方司令部 or 司令部被攻陷 plus the match time.
- The round 7 coach, headquarters grace, danger toast, and pill separation stay. 52 tests passed. Rebuilt `static/app.js`. At 390×844 the match averaged about 59 fps.

## Round 9 fixes

- Count badges are short hexes. The rifle mark and the tabular count stay, and the ⬆ chip sits clear of the label.
- The result sheet adds 地圖 beside 再戰. It returns to the map list. The post-match hint says 再戰，或者揀地圖.
- 52 tests passed. Rebuilt `static/app.js`.

## Round 10 fixes

- The 390×844 review shipped with no critical, major, or minor defects. The military palette, bunker and hangar, soldier squads, hex badges, and the result-sheet 地圖 button were already in `static/app.js`. Tests stayed at 52/52.

## Round 11 fixes

- 中 holds a threatened barracks and counter-attacks from the headquarters. A single full-barracks rush on 對岸 loses. A scripted measured player still wins, and those wins take more than a minute. 易 still falls to one barracks rush. 難 stays harder than 中. Headquarters grace and the「敵軍打緊司令部」toast stay.
- The sky is overcast grey (`#8A918C`) and the sea is grey steel (`#5C676E`). The frontier is a thin hard green|red split in the faction colours, at a fixed opacity.
- Squad soldiers are about 1.4× larger on the same instanced meshes. Headquarters and barracks gain parapets, wing walls, and corner posts. The ⬆ chip is 22px. Unit badges hide while the map picker or the result sheet is open. 據點號令 sits on a dark plate.
- 54 tests passed. Rebuilt `static/app.js`. At 390×844 a warmed match averaged 59.6 fps.

## Round 12 fixes

- The 390×844 review shipped with no critical, major, or minor defects. The round-8 art list stays closed on this bundle: muted olive terrain, bunker and hangar, soldier squads, sharp HUD, formal zh-HK copy, and the rebuilt `static/app.js`. Round-11 balance, grace, and the upgrade chip stay. Tests stayed at 54/54.

## Round 13 fixes

- On 中 a threatened barracks holds, and the nearest neighbour sends one reinforcement (at most 24) and then a counter (at most 16). After that pair the headquarters keeps the rest of its pile. A player who sends from every owned building, resends as troops return, and chains a capture into the enemy headquarters loses; a relief squad and a counter both appear inside 40s, so the chain is not a win before 90s. A measured player still wins, and those wins take more than a minute. The same measured line on 難 wins later, between two and four minutes, and is still playing at 45s. 易 still falls to one barracks rush. Headquarters grace stays 36/20/12, and the「敵軍打緊司令部」toast stays. Idling still loses the headquarters. A double send on 雙橋 still wins on 中.
- The ⬆ chip is a 26px plate with a 22px glyph, centered in the hex, clear of the count. Squad 行軍 and 交戰 are 12px. Troop totals stay off the home screen and appear once the match is running.
- Soldiers stay on the instanced mesh. The torso is darker, the helmet is larger, and the rifle is longer and darker, at instance scale 1.8. Shadows and antialiasing stay off.
- 56 tests passed. Rebuilt `static/app.js`. At 390×844 a warmed match averaged 60.0 fps, p95 about 16.8ms.

## Round 15 fixes

- The diorama is a procedural rebuild toward the approved mockups. The headquarters is a bunker with a berm, sandbags, a stepped tower, a dish, and a mast. The barracks is a hangar with a pitched roof and a roll door. Pines are two stacked cones, rocks sit in clusters, and a light tank with a metal barrel parks beside each barracks. Soldiers stay on one instanced mesh, cap 480, with legs, a darker torso, a helmet, and a rifle on local −z. Ranks are denser. Instance scale is 1.75.
- Materials are MeshStandardMaterial. The grade is ACES Filmic. A sky dome sits behind the island. A real GPU gets one 1024 soft shadow map. SwiftShader and any renderer that does not identify as a GPU keep the blob contact shadows. Bloom stays off.
- The ownership edge is an unlit two-tone green|red ribbon plus a wider ground tint, still coloured through Color.setHex. March dust, clash smoke, and muzzle flashes share one pooled point set under a thousand. A threatened headquarters pulses its emissive colour and expands a ring. The「危」badge stays.
- The home sheet is a gunmetal panel low on the screen: thumbnails for 對岸, 長路, and 雙橋, 易／中／難, and an embossed 出戰. In-match counts are hard circles with a rifle glyph. 行軍 and 交戰 are 12px. The upgrade chip is a 26px plate with a 22px glyph. Home chips show 我軍 and 敵軍 without troop totals until the match is running.
- Round 13 balance is unchanged. On 中 a threatened barracks is reinforced and countered, and the barracks chain is not a win before 90s. A measured win on 難 is still the slower one. 易 still falls to one barracks rush. Headquarters grace stays 36/20/12, and the「敵軍打緊司令部」toast stays.
- 57 tests passed. Rebuilt `static/app.js`. At 390×844 on this machine’s software renderer, shadows stayed on the blob fallback and particles stayed on. A warmed match averaged 57.8 fps, p95 about 16.8ms. If a later window falls under 40 fps, particles drop first, then the shadow map. The gap that remains is density and finish: these are original low-poly merges, not a photographed model pack, and each soldier is still small in the fixed portrait camera.

## Round 16 fixes

- The play camera is closer and less steep, so a rank reads at 390×844. Field of view is 42, position is `(0.15, 9.46, 18.77)`, and the look target is `(0.15, 0.8, 1.3)`. Screen-right is still world +x. Fog is 22 to 48, so the far headquarters stays out of the old 18–38 haze. Pads on 對岸, 長路, and 雙橋 stay inside the frame. The enemy-headquarters pill at `(8, 820)` still picks, and the same pointer with the foot outside the ground disc still misses.
- Soldiers stay on one `InstancedMesh` per faction, cap 480. Instance scale is 1.9. Rank spacing is 0.44, in 4 or 6 files. The helmet is taller (0.16) with a wider brim, and the rifle is a little thicker on the same local −z. At the player barracks a helmet is about 16 CSS pixels tall and a side-on rifle is about 60. A marching stack reads as helmets and rifles beside the bunker. A green rank on the green slab is less separated than the same rank against the red bunker.
- An upgradeable count stays a 64×64 circle. The 26×26 ⬆ chip sits 4px outside the disc, on the right. On a payable barracks the circle measured 64×64 with radius 999px, and the chip stayed inside the 390px frame.
- Round 13 balance was not retuned. Loop-r8 faction paints, the bunker and the hangar, the hard circles, the mute glyphs, and the formal copy stayed as they were.
- 57 tests passed. Rebuilt `static/app.js` (546427 bytes). At 390×844 on this machine’s software renderer, shadows stayed on the blob fallback. After a 2.5s warm-up on 對岸, particles stayed on: average 49.4 fps, p95 about 33.4ms, across 159 frames. A burst of map loads in one session dipped under 40 fps and the existing gate dropped particles; a steady match did not. The meshes are still original low-poly merges.

## Round 17 fixes

- The round 17 review found no CRITICAL, MAJOR, or MINOR issues. The round 16 camera, soldier scale, and circular upgrade chip stay. Loop-r8 paints, the bunker and the hangar, the hard circles, the mute glyphs, the formal copy, and the round 13 balance stay closed.
- 57 tests passed. No source or bundle change.

## Round 18 art overhaul

- The live 390px audit overruled the round 17 ship note. Soldiers are original cylinder infantry on one InstancedMesh per faction (cap 480): legs, torso, arms, head, helmet, and a rifle on local −z. Vertex colours split uniform, helmet, skin, and rifle, so a rank is green or red instead of one grey block. Instance scale is 1.48, spacing 0.3, up to 9 files, and a garrison stands in front of the door rather than on the roof. A 60-count headquarters draws about 50 bodies.
- The headquarters stays a concrete bunker with a faction stripe, dish, and mast, at group scale 0.72. The barracks stays a sandbagged roll-door hangar at 0.78, with the light tank inset on local +x and the barrel on local −z. The danger pulse keeps that scale. Count badges sit above the meshes. On a payable barracks the circle measured 64×64 and the 26px ⬆ chip sat just outside it, inside the 390px frame.
- The play camera is field of view 46, position `(0.18, 12.4, 16.6)`, look `(0.05, 0.35, -0.15)`. Screen-right is world +x. The home card uses a second frame, position `(0.1, 8.2, 22)`, look `(0, 0, 8)`, so both bases sit in the strip above the card. Materials stay MeshStandard with an ACES grade. A real GPU still gets one 1024 soft shadow map. This machine’s software renderer keeps blob contact shadows. The sky dome and a meadow disc fill the frame. The old empty water disc is a shore ring.
- Territory pads are flush round stains, not stacked hex blocks. Dirt roads, the river, pines, and rocks stay. The ownership edge is the locked green|red band plus a brighter unlit core (player `#c8ffd8`, enemy `#ffd0c8`) that follows the frontier. A drag draws a cream ribbon and an arrow from the source to the pointer. March dust, clash flashes, and siege fire stay in the 360-point pool. A headquarters under siege shows 危 and an orange burst. The「敵軍打緊司令部」toast is unchanged.
- The top bar keeps 據點號令 and the 我軍/敵軍 totals inside 390px (scores measured at x=114, width 123). 加速 and 加固 sit at x=16 and x=199, y=724, each 175px wide. The hint is a full-width bar. Map cards paint meadow, river, roads, pines, and building marks. 出戰 stays the embossed control.
- On 中 the barracks bonus is 0 and the headquarters bonus is 16, so 對岸 opens near 我軍 42 / 敵軍 78 (a live frame read 44 / 79 after one regen tick) instead of 敵軍 96. The headquarters pile stays, because dropping it lets a blind barracks rush win before 90s. 難 bonuses stay 12 and 18 so the measured hard win remains inside 120–240s and slower than 中. Grace, first-send timing, and the round 13 reinforcement rules are unchanged.
- 58 tests passed. Rebuilt `static/app.js` (551443 bytes). At 390×844 on software GL, a steady 對岸 match held particles on and shadows off: average 42.7 fps, p95 about 33.4ms, over 90 frames. A later hitch under 40 fps still drops particles first. The shots in `screenshots/fix-18/` are closer to the mockups in layout, density, the frontier, and the siege badge. They are still original low-poly meshes, not the photographed mockup.

## Round 19 fixes

- The play camera is closer so a rank reads at 390×844. Field of view is 44, position is `(0.16, 11.2, 17.2)`, and the look target is `(0.08, 0.45, 0.2)`. Screen-right stays world +x. The home frame stays `(0.1, 8.2, 22)` looking at `(0, 0, 8)`. Pick radii were left alone, and the enemy-headquarters pill tests still pass.
- Soldiers stay on one `InstancedMesh` per faction, cap 480. Instance scale is 1.9 and rank spacing is 0.42. The helmet cylinder is 0.16 tall (local y 0.500–0.660) and the rifle is a `0.055×0.05×0.64` box on local −z. Cylinder sides are legs 3, torso 4, arms 3, head 4, helmet 4. Projected through that camera at the player barracks, the helmet is 14.9 CSS px, the body is 59.9 px, and the rifle’s projected length is about 71 px, at screen y 480. Garrison reach is capped at 1.1, so the player headquarters rank sits near screen y 575, about 95 px clear of the barracks rank.
- The mint and pink frontier core is gone. The ownership edge is the faction green|red band (y 0.22, z scale 3.2). The same band geometry still tints the ground at opacity 0.2. A 390×844 combat frame showed that stripe as faction red then faction green.
- On 中 the barracks bonus stays 0 and the headquarters bonus is 10, so 對岸 opens at 我軍 42 / 敵軍 72 (headquarters 54). The open-gap assertion is now 30 troops, and the enemy total must stay under 80. A gap near 10 would leave that headquarters under 54, and one full barracks of 54 then captures it with the defence off. The existing test requires that capture to fail, so 10 is the smallest bonus that holds. 難 stays at bonuses 12 and 18. Relief caps, grace, and first-send timing are unchanged, and the 90s barracks chain still holds.
- The headquarters stays the bunker with dish and mast at group scale 0.72. The barracks stays the hangar at 0.78. Count badges stay 64×64 circles, and the 26×26 ⬆ chip stays outside the disc. Mute stays 🔊/🔇 with aria-label 靜音. The result lines stay 攻陷敵方司令部 and 司令部被攻陷. The「敵軍打緊司令部」toast stays.
- 58 tests passed. Rebuilt `static/app.js` (550668 bytes). At 390×844 on this machine’s software renderer, shadows stayed on the blob fallback. One clean warm-up on 對岸, particles still on, averaged 50.4 fps, p95 about 33.4 ms, across 89 frames. A second page started immediately after the first can still fall under 40 fps, and the existing gate then drops particles. Bloom stays off.

## Round 20 fixes

- Each map card is that battlefield. The thumbnail draws the map’s zones as owner pads, the road graph, and the z=0 stream, with a grey bridge where a road crosses the water. 對岸 and 長路 have one centre bridge. 雙橋 has two, one on each lane. Pines use the same spots as the island: 對岸’s flank list, and a pair on each pad for 長路 and 雙橋. 對岸 also keeps its rocks. Player green sits at the bottom of the card. At 390×844 the three canvases are different pictures, and the centre of 雙橋 is open water with the bridges off to the sides.
- The home screen hides `#hint`. The card already carries the lede and 出戰. In a match the bar still reads 點自己建築，可以升級或者出兵. After the match it still reads 再戰，或者揀地圖.
- 59 tests passed. Rebuilt `static/app.js` (552760 bytes).

## Round 21 fixes

- The island builds one grey deck at each road crossing of the stream, using the same plank and rails as before. 對岸 and 長路 still cross at x 0, so the deck stays on that road. 雙橋 crosses at x −1.85 and x +1.85, so those two lanes each get a deck and the origin is open water. At 390×844 the centre of the 雙橋 stream reads as water, and the west lane rail reads as the neutral grey deck beside the rank.
- 60 tests passed. Rebuilt `static/app.js` (552862 bytes).

## Round 22 fixes

- The round 22 review found no CRITICAL, MAJOR, or MINOR issues. The lane decks on 雙橋, the centre deck on 對岸 and 長路, the per-map cards, and the hidden home hint stay. Loop-r17 paints, the bunker and the hangar, the helmeted ranks, the mute glyphs, the formal copy, and the 中 open of 42 vs 72 stay closed.
- 60 tests passed. No source or bundle change.
