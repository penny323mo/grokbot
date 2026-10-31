/** Muted olive terrain, strong faction paints. See ART-STYLE.md §2 (v3).
 * Sky is a cool day grade for the dome; water is a deep bay, not a pastel wash.
 */
export const PALETTE = {
  sky: 0x7fa8c4,
  water: 0x3e6f8f,
  sand: 0x8a7a5c,
  meadow: 0x6b7a4e,
  meadowDeep: 0x5a6b42,
  road: 0x5c5348,
  roadEdge: 0x4a433c,
  trunk: 0x4a3b2a,
  leaf: 0x3f5a3a,
  leafDeep: 0x2f4530,
  rock: 0x6e6a63,
  stream: 0x3e6f8f,
  bridge: 0x6e726e,
  ink: 0x1a2220,
  concrete: 0x7a756c,
  metal: 0x8e9694,
  player: {
    main: 0x2f9e5b,
    deep: 0x1b6b3d,
    flag: 0x3dce7a,
    slab: 0x3a5c3f,
    glow: 0x3dce7a,
  },
  enemy: {
    main: 0xc43c32,
    deep: 0x8e241c,
    flag: 0xe25548,
    slab: 0x5c3532,
    glow: 0xe25548,
  },
};

export function ownerPaint(owner) {
  return owner === 'player' ? PALETTE.player : PALETTE.enemy;
}
