/**
 * js/data/maps.js
 * Hand-aligned 10x13 terrain matrices and chapter encounter configurations.
 */

export const TERRAIN_INFO = {
  '.': { char: '.', name: '平地', moveCost: 1, defBonus: 0, evaBonus: 0, desc: '平坦開闊地面，無攻防修正' },
  'f': { char: 'f', name: '森林', moveCost: 2, defBonus: 1, evaBonus: 15, desc: '林木掩映，防禦+1，迴避+15%' },
  'h': { char: 'h', name: '山丘', moveCost: 2, defBonus: 1, evaBonus: 10, desc: '制高點，防禦+1，迴避+10%，遠程射程+1，對低處傷害+20%' },
  'r': { char: 'r', name: '道路', moveCost: 1, defBonus: 0, evaBonus: 0, desc: '平整石路，行軍迅速' },
  'b': { char: 'b', name: '木橋/石橋', moveCost: 1, defBonus: 0, evaBonus: 0, isBridge: true, desc: '跨水通道，被擊退落水將直接溺亡KO' },
  'w': { char: 'w', name: '河水', moveCost: 99, defBonus: 0, evaBonus: 0, impassable: true, flyerOnly: true, isWater: true, desc: '湍急深水，非飛行單位無法涉足' },
  '#': { char: '#', name: '城牆/屋頂/峭壁', moveCost: 99, defBonus: 0, evaBonus: 0, impassable: true, flyerOnly: true, desc: '高聳障礙，非飛行單位不可通行' },
  'g': { char: 'g', name: '城門', moveCost: 1, defBonus: 2, evaBonus: 0, isGate: true, desc: '要塞門戶，防禦+2，防守目標核心' },
  'm': { char: 'm', name: '市集', moveCost: 1, defBonus: 0, evaBonus: 10, isMarket: true, desc: '貨架棚帳，迴避+10%' },
  's': { char: 's', name: '淺灘', moveCost: 3, defBonus: -1, evaBonus: 0, desc: '碎石泥灘，需3移動力，防禦-1' }
};

export const CHAPTERS = [
  {
    id: 1,
    key: 'river_bridge',
    title: '第一回 · 孤舟燈影渡寒川',
    mapName: '河橋',
    image: 'map_river_bridge.webp',
    squadLimit: 4,
    maxTurns: 12,
    objectiveType: 'escort',
    objectiveDesc: '護送【引路燈車】穿過石橋抵達北岸燈標（12回合內）',
    defeatDesc: '燈車被毀 或 超過12回合 或 我方全滅',
    escortTargetId: 'lantern_cart',
    escortGoal: { rowMax: 2, colMin: 6 },
    lanterns: [
      { x: 1, y: 9, radius: 2 },
      { x: 3, y: 1, radius: 2 },
      { x: 8, y: 1, radius: 2 }
    ],
    deployTiles: [
      { x: 0, y: 11 }, { x: 1, y: 11 }, { x: 2, y: 11 },
      { x: 0, y: 12 }, { x: 1, y: 12 }, { x: 2, y: 12 }
    ],
    npcSpawns: [
      { id: 'lantern_cart', x: 1, y: 10 }
    ],
    enemySpawns: [
      { id: 'fog_rider', x: 4, y: 3, facing: -1 },
      { id: 'fog_rider', x: 7, y: 3, facing: -1 },
      { id: 'fog_rider', x: 6, y: 2, facing: -1 },
      { id: 'fog_rider', x: 6, y: 1, facing: -1 },
      { id: 'shadow_archer', x: 7, y: 9, facing: -1 }, // on hill
      { id: 'shadow_archer', x: 8, y: 10, facing: -1 } // on hill
    ],
    storyBefore: [
      { speaker: 'lantern_crafter', mood: 'calm', text: '「夜霧漸濃，前面的石橋是通往鎮上的唯一通路。」' },
      { speaker: 'bear_guard', mood: 'calm', text: '「有俺熊岳在此守住橋頭，那些騎兵休想靠近燈車半步！」' },
      { speaker: 'cat_patrol', mood: 'calm', text: '「山丘上有暗影弓手居高臨下，我去自側翼拔掉他們。」' }
    ],
    // 10 cols x 13 rows hand-aligned to map_river_bridge.webp
    terrain: [
      "wwfrf#fffr", // 0
      "wwfr#fffrf", // 1
      "www##fff.f", // 2
      ".wwww.frff", // 3
      "..wwbbb.ff", // 4: Bridge cols 4-6
      "..rbbb..rf", // 5: Bridge arch cols 3-5
      "...w..ssw#", // 6: Stepping stones shallows cols 6-7
      "..wwssswww", // 7: Stepping stones cols 4-6
      "...wssshhh", // 8: Shallows to hill base cols 7-9
      "...ww.hhhh", // 9: Stone platform left, hill cols 6-9
      "..##wwhhhh", // 10: River deep water cols 4-5, hill right
      "..#wwwhhhh", // 11: River deep water cols 3-5, hill right
      ".....hhhh#"  // 12: Forecourt & hill base
    ]
  },

  {
    id: 2,
    key: 'gate',
    title: '第二回 · 鐵壁雄關鎮夜魘',
    mapName: '城門',
    image: 'map_gate.webp',
    squadLimit: 5,
    maxTurns: 8,
    objectiveType: 'hold_gate',
    objectiveDesc: '堅守雄關要道8回合，切莫讓迷霧惡煞越過城門！',
    defeatDesc: '敵軍佔領城門格 或 我方全滅',
    gateTiles: [
      { x: 4, y: 6 }, { x: 5, y: 6 }
    ],
    lanterns: [
      { x: 4, y: 6, radius: 2 },
      { x: 1, y: 10, radius: 2 },
      { x: 8, y: 10, radius: 2 }
    ],
    deployTiles: [
      { x: 4, y: 7 }, { x: 5, y: 7 },
      { x: 3, y: 8 }, { x: 4, y: 8 }, { x: 5, y: 8 }, { x: 6, y: 8 }
    ],
    enemySpawns: [
      { id: 'paper_ghost', x: 3, y: 2, facing: 1 }, // water-type
      { id: 'paper_ghost', x: 5, y: 2, facing: -1 },
      { id: 'paper_ghost', x: 6, y: 2, facing: -1 },
      { id: 'fog_rider', x: 4, y: 1, facing: 1 },
      { id: 'fog_rider', x: 5, y: 0, facing: -1 },
      { id: 'mist_shaman', x: 5, y: 3, facing: -1 } // healer behind
    ],
    storyBefore: [
      { speaker: 'bear_guard', mood: 'angry', text: '「關門乃全鎮屏障！只要俺的盾還在，誰也過不去！」' },
      { speaker: 'tanuki_mage', mood: 'calm', text: '「帶頭那些撐傘的鬼魅帶水相幽氣，火燒不透，看狸爺的天雷轟焦它們！」' },
      { speaker: 'fox_maiden', mood: 'hurt', text: '「我的妖火對水鬼無效……我會替你們攔截後方的騎兵！」' }
    ],
    // 10 cols x 13 rows hand-aligned to map_gate.webp
    terrain: [
      "hhhh.r.fff", // 0: Mountain left, road center, forest right
      "hh#..r..ff", // 1
      "h##..r...f", // 2
      "###..r..ff", // 3
      "##...r...#", // 4: Approach to gate
      "####.r.###", // 5: Wall perimeter
      "####gg####", // 6: Heavy wall with Gate 'gg' at cols 4-5
      "#........#", // 7: Stone courtyard interior
      "#........#", // 8: Courtyard pavement
      "#........#", // 9: Courtyard
      "##......##", // 10: Flank timber fences
      "###.rr.###", // 11: Exit stairs
      "....rr...."  // 12: Outer perimeter
    ]
  },

  {
    id: 3,
    key: 'market',
    title: '第三回 · 長街百肆明燈燃',
    mapName: '市集',
    image: 'map_market.webp',
    squadLimit: 5,
    maxTurns: 10,
    objectiveType: 'protect_lantern',
    objectiveDesc: '守護市集中央【鎮心神燈】10回合，或殲滅全體夜霧惡徒',
    defeatDesc: '鎮心神燈被毀 或 我方全軍覆沒',
    objectiveTargetId: 'market_lantern',
    lanterns: [
      { x: 4, y: 6, radius: 2 },
      { x: 5, y: 6, radius: 2 }
    ],
    deployTiles: [
      { x: 4, y: 5 }, { x: 5, y: 5 },
      { x: 3, y: 6 }, { x: 6, y: 6 },
      { x: 4, y: 7 }, { x: 5, y: 7 }
    ],
    npcSpawns: [
      { id: 'market_lantern', x: 4, y: 6 }
    ],
    enemySpawns: [
      { id: 'shadow_rat', x: 1, y: 3, facing: 1 }, // shrouded
      { id: 'shadow_rat', x: 2, y: 2, facing: 1 },
      { id: 'shadow_rat', x: 7, y: 2, facing: -1 },
      { id: 'shadow_rat', x: 6, y: 10, facing: -1 },
      { id: 'shadow_archer', x: 1, y: 8, facing: 1 }, // rooftop
      { id: 'shadow_archer', x: 8, y: 3, facing: -1 }  // canal edge
    ],
    storyBefore: [
      { speaker: 'lantern_crafter', mood: 'calm', text: '「市集幽深巷道極多，那些匿鼠藏身在暗處伺機而動！」' },
      { speaker: 'cat_patrol', mood: 'calm', text: '「只要在暗巷掛起靈燈，它們的匿形術就會瞬間失效。」' },
      { speaker: 'tea_master', mood: 'calm', text: '「市集攤棚易燃，若是用火攻，需得看清風向與地勢啊。」' }
    ],
    // 10 cols x 13 rows hand-aligned to map_market.webp
    terrain: [
      "##..##..##", // 0: North house roofs
      "##..##..##", // 1
      "##.r..r.##", // 2: Alleys
      "##rmmmmrww", // 3: Stalls & canal on east
      "#.mmmmmmww", // 4: Market stalls ring
      "#..m..m.ww", // 5: Square outer
      "#.m....mww", // 6: Central square around lantern (4,6)
      "#..mmmm.ww", // 7: South market stalls
      "##..mm.bww", // 8: Canal bridge at col 7
      "##.r..r#ww", // 9: South houses & canal
      "##.####.ww", // 10
      "##.####.w#", // 11
      "##..r...##"  // 12: South road
    ]
  },

  {
    id: 4,
    key: 'mountain',
    title: '第四回 · 雲海天池決戰峰',
    mapName: '山道',
    image: 'map_mountain.webp',
    squadLimit: 6,
    maxTurns: 16,
    objectiveType: 'defeat_boss_or_reach',
    objectiveDesc: '擊破守堤巨將【鐵將】（或突破神壇出口）',
    defeatDesc: '我方全軍覆沒 或 超過16回合',
    bossId: 'iron_general',
    exitTiles: [
      { x: 4, y: 0 }, { x: 5, y: 0 }, { x: 4, y: 1 }, { x: 5, y: 1 }
    ],
    reinforcements: [
      { turn: 5, id: 'mother_of_mist', x: 5, y: 1, facing: -1, bark: '「無知凡人，竟敢擾我清夢……夜霧將吞噬一切！」' }
    ],
    lanterns: [
      { x: 4, y: 0, radius: 2 }
    ],
    deployTiles: [
      { x: 4, y: 11 }, { x: 5, y: 11 },
      { x: 3, y: 12 }, { x: 4, y: 12 }, { x: 5, y: 12 }, { x: 6, y: 12 }
    ],
    enemySpawns: [
      { id: 'iron_general', x: 4, y: 2, facing: -1 }, // holds the dam bridge!
      { id: 'mist_shaman', x: 2, y: 2, facing: 1 },
      { id: 'mist_shaman', x: 7, y: 2, facing: -1 },
      { id: 'shadow_archer', x: 1, y: 7, facing: 1 }, // cliff outcrop
      { id: 'shadow_archer', x: 8, y: 7, facing: -1 }  // cliff outcrop
    ],
    storyBefore: [
      { speaker: 'cat_patrol', mood: 'angry', text: '「鐵將的玄鐵巨盾正對山道，正面進攻幾無破綻！」' },
      { speaker: 'bear_guard', mood: 'calm', text: '「那廝就站在天池大壩之頂。若俺衝上去給他一記巨盾推擊，管叫他滾下池中溺斃！」' },
      { speaker: 'crane_rider', mood: 'calm', text: '「我自長空盤旋，隨時繞至後方發動背擊，或直接決開堤壩引水淹敵！」' }
    ],
    // 10 cols x 13 rows hand-aligned to map_mountain.webp
    terrain: [
      "####..####", // 0: Shrine altar summit
      "###....###", // 1: Shrine platform
      "##bwwwwb##", // 2: Dam bridge walkway cols 2 & 7, water reservoir cols 3-6!
      "##.wwww.##", // 3: Reservoir lake pool
      "##f..r.f##", // 4: Pine forest trail
      "##ff.r.f##", // 5: Steep stairway
      "###f.r.f##", // 6: Narrow spine ridge
      "#hh..r..hh", // 7: Stone cliff perches (h) on flanks
      "###..r..##", // 8: Winding stone stairs
      "###f.s.f##", // 9: Shallows / low path (affected by 水淹)
      "###f.s.f##", // 10: Shallows low path
      "####.s.###", // 11: Shallows
      "####.r.###"  // 12: Mountain gate trail
    ]
  }
];
