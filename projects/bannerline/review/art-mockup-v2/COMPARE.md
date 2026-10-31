# Live vs Top Force ad — why Bannerline reads cheap (2026-11-01 Asia/Macau)

Sources: `assets/ref/inspiration-ad.png`, `screenshots/audit-r10/*`, `screenshots/audit-r12/*`, `screenshots/orch/live-390.png`.

## What the reference ad has (genre bar, not copy target)
- Dense stacked soldier crowds that read as armies, not scattered Lego studs
- Soft directional sun + contact shadows under buildings, trees, and squads
- Matte plastic materials with readable gradients; glowing ownership border
- Combat juice: dust/smoke puffs at clash points
- Clean circular count badges with icon + number, floating above stacks
- Readable silhouettes: tents/bunkers/dish buildings distinct from trees

## What live Bannerline shows
- Flat MeshStandard/Basic primitives: block bunkers, cylinder “soldiers”, cone trees
- Almost no shadows / AO; island floats in empty slate void
- No textures, normal maps, or baked light; edges look jagged/prototype
- HUD = plain system sans panels with thin borders; no iconography chrome
- Mid-match: thin green path line, almost no clash VFX
- Home sheet: grey modal over empty diorama — looks like a wireframe menu

## Concrete cheapness checklist
| Area | Live failure | Ad / commercial bar |
|------|--------------|---------------------|
| Models | Box HQ + hangar; soldiers = tiny cylinders/blocks | Helmeted infantry blocks + light vehicle silhouettes; distinct HQ/barracks |
| Lighting | Flat ambient; no contact shadow | Directional key + soft fill; ground-projected shadows |
| Effects | Near-zero particles | Muzzle dust, march dust, capture pulse, border glow |
| UI | Flat CSS boxes, system font | Hard military panels, icon badges, stamped numerals |
| Typography | Generic sans, weak hierarchy | Condensed/display title + mono counts |
| Terrain | Tan disc / jagged island, empty sky | Layered meadow/dirt/road, props, sky gradient |
| Density | Sparse units | Packed stacks that feel like armies |

Penny’s 「垃圾級」 matches this gap: mature palette alone ≠ commercial RTS polish.
