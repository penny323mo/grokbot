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
  'v': { char: 'v', name: '村莊', moveCost: 1, defBonus: 2, evaBonus: 5, isVillage: true, healAmount: 4, desc: '鄉野村落，防禦+2，迴避+5%，駐紮每回合初恢復 4 HP' },
  's': { char: 's', name: '淺灘', moveCost: 3, defBonus: -1, evaBonus: 0, desc: '碎石泥灘，需3移動力，防禦-1' }
};

export const WEATHER_CONFIG = {
  clear: {
    id: 'clear',
    name: '晴朗',
    icon: '☀️',
    tag: '晴',
    tooltip: '【晴朗】風和日麗，兵行千里，無氣候修正。'
  },
  rain: {
    id: 'rain',
    name: '暴雨',
    icon: '🌧️',
    tag: '雨',
    tooltip: '【暴雨】水淹傷害+25%，火攻傷害-25%。'
  },
  fog: {
    id: 'fog',
    name: '濃霧',
    icon: '🌫️',
    tag: '霧',
    tooltip: '【濃霧】遠程射程-1，未照亮目標迴避+15%。'
  },
  wind: {
    id: 'wind',
    name: '朔風',
    icon: '🍃',
    tag: '風',
    tooltip: '【朔風】向南順風射程+1，吹拂落葉。'
  },
  night: {
    id: 'night',
    name: '暗夜',
    icon: '🌙',
    tag: '夜',
    tooltip: '【暗夜】長明燈照破夜霧，黑暗中未照亮敵軍暴擊率提升。'
  }
};

export const CHAPTERS = [
  {
    id: 1,
    key: 'river_bridge',
    title: '第一回 · 孤舟燈影渡寒川',
    mapName: '河橋',
    image: 'map_river_bridge.webp',
    weather: 'night',
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
      { x: 1, y: 8 }, { x: 0, y: 9 }, { x: 2, y: 8 }, { x: 2, y: 9 },
      { x: 0, y: 8 }, { x: 1, y: 10 }, { x: 2, y: 10 }
    ],
    npcSpawns: [
      { id: 'lantern_cart', x: 1, y: 9 }
    ],
    escortPath: [
      { x: 1, y: 9 },
      { x: 1, y: 8 },
      { x: 1, y: 7 },
      { x: 2, y: 6 },
      { x: 2, y: 5 },
      { x: 3, y: 5 },
      { x: 4, y: 4 },
      { x: 5, y: 3 },
      { x: 6, y: 2 }
    ],
    enemySpawns: [
      // Tutorial: 3 light enemies, spaced so they arrive one at a time
      { id: 'fog_rider', x: 4, y: 4, facing: -1 },
      { id: 'shadow_archer', x: 4, y: 7, facing: -1, element: 'wood' },
      { id: 'shadow_archer', x: 8, y: 9, facing: -1, aggro: 'guard', guardRadius: 4, element: 'wood' } // on hill, holds until approached
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
      "..wwbbbwff", // 4: Bridge cols 4-6, deep water col 7
      "..rbbb..rf", // 5: Bridge arch cols 3-5
      "...wssssw#", // 6: Stepping stones shallows cols 4-7, water col 3 & 8
      "..wwssswww", // 7: Stepping stones cols 4-6
      "...wssshhh", // 8: Shallows to hill base cols 7-9
      "...ww.hhhh", // 9: Stone platform left, hill cols 6-9
      "...ww.hhhh", // 10: Courtyard plain cols 0-2 & 5, hill right
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
    weather: 'wind',
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
      { x: 3, y: 8 }, { x: 6, y: 8 }, { x: 2, y: 8 }, { x: 7, y: 8 },
      { x: 4, y: 9 }, { x: 5, y: 9 }
    ],
    reinforcements: [
      { turn: 3, id: 'fog_rider', x: 1, y: 6, facing: 1, bark: '「側翼突擊！直撲關門！」' },
      { turn: 3, id: 'paper_ghost', x: 3, y: 1, facing: 1, bark: '「水影重重，陰魂不散！」' },
      { turn: 4, id: 'fog_rider', x: 4, y: 1, facing: 1, bark: '「精騎衝擊！踏平城門！」' },
      { turn: 5, id: 'mist_sorcerer', x: 5, y: 1, facing: -1 }
    ],
    enemySpawns: [
      { id: 'shield_guard', x: 4, y: 3, facing: -1 },
      { id: 'paper_ghost', x: 3, y: 2, facing: 1 },
      { id: 'paper_ghost', x: 5, y: 2, facing: -1 },
      { id: 'fog_rider', x: 4, y: 1, facing: 1 },
      { id: 'mist_sorcerer', x: 6, y: 1, facing: -1 },
      { id: 'mist_shaman', x: 5, y: 3, facing: -1 }
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
    weather: 'night',
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
      { id: 'shadow_rat', x: 1, y: 4, facing: 1, aggro: 'rush' },
      { id: 'shadow_rat', x: 8, y: 4, facing: -1, aggro: 'rush' },
      { id: 'shield_guard', x: 5, y: 2, facing: -1, aggro: 'guard', guardRadius: 2 },
      { id: 'mist_sorcerer', x: 2, y: 2, facing: 1, aggro: 'guard', guardRadius: 2 },
      { id: 'shadow_archer', x: 7, y: 2, facing: -1, aggro: 'guard', guardRadius: 3 },
      { id: 'shadow_archer', x: 1, y: 2, facing: 1, aggro: 'guard', guardRadius: 3 }
    ],
    reinforcements: [
      { turn: 2, id: 'fog_rider', x: 8, y: 7, facing: -1, aggro: 'rush', bark: '「精騎截殺！直取市集神燈！」' },
      { turn: 3, id: 'mist_scout', x: 1, y: 5, facing: 1, aggro: 'rush' },
      { turn: 3, id: 'fog_rider', x: 4, y: 8, facing: -1, aggro: 'rush' },
      { turn: 3, id: 'shadow_rat', x: 2, y: 8, facing: 1, aggro: 'rush' },
      { turn: 3, id: 'mist_scout', x: 6, y: 8, facing: -1, aggro: 'rush' },
      { turn: 4, id: 'fog_rider', x: 5, y: 9, facing: -1, aggro: 'rush', bark: '「放火燒街！斷其歸路！」' },
      { turn: 4, id: 'fire_archer', x: 2, y: 9, facing: 1, aggro: 'rush' }
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
    weather: 'fog',
    squadLimit: 6,
    maxTurns: 16,
    objectiveType: 'defeat_boss_or_reach',
    objectiveDesc: '擊破守堤巨將【鐵將】（或突破神壇出口）',
    defeatDesc: '我方全軍覆沒 或 超過16回合',
    bossId: 'iron_general',
    exitTiles: [
      { x: 4, y: 0 }, { x: 5, y: 0 }
    ],
    reinforcements: [
      { turn: 5, id: 'mother_of_mist', x: 5, y: 1, facing: -1, bark: '「無知凡人，竟敢擾我清夢……夜霧將吞噬一切！」' }
    ],
    lanterns: [
      { x: 4, y: 0, radius: 2 }
    ],
    deployTiles: [
      { x: 4, y: 11 }, { x: 5, y: 11 },
      { x: 3, y: 12 }, { x: 4, y: 12 }, { x: 5, y: 12 }, { x: 6, y: 12 },
      { x: 4, y: 10 }, { x: 5, y: 10 }
    ],
    enemySpawns: [
      { id: 'shield_guard', x: 4, y: 0, facing: 2, aggro: 'guard', guardRadius: 2 },
      { id: 'shield_guard', x: 5, y: 0, facing: 2, aggro: 'guard', guardRadius: 2 },
      { id: 'iron_general', x: 4, y: 2, facing: -1 }, // holds the dam bridge!
      { id: 'shield_guard', x: 5, y: 2, facing: -1 },
      { id: 'mist_sorcerer', x: 2, y: 2, facing: 1 },
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
  },

  {
    id: 5,
    key: 'bamboo_pass',
    title: '第五回 · 竹海夜霧斷魂隘',
    mapName: '竹海',
    image: 'map_bamboo_pass.webp',
    weather: 'fog',
    squadLimit: 6,
    maxTurns: 8,
    hasNightFog: true,
    objectiveType: 'reach_shrine_or_rout',
    objectiveDesc: '突破幽谷竹海，佔領北端【封魔神壇】（或殲滅全體伏兵敵將）',
    defeatDesc: '我方全軍覆沒 或 超過8回合',
    shrineTiles: [
      { x: 4, y: 0 }, { x: 5, y: 0 }
    ],
    reinforcements: [
      { turn: 2, id: 'shadow_rat', x: 2, y: 7, facing: 1, aggro: 'rush' },
      { turn: 2, id: 'shadow_rat', x: 7, y: 7, facing: -1, aggro: 'rush' },
      { turn: 3, id: 'fog_rider', x: 4, y: 10, facing: 1, bark: '「霧騎後軍已至！休放走一人！」' },
      { turn: 3, id: 'fog_rider', x: 5, y: 10, facing: -1 },
      { turn: 3, id: 'shadow_archer', x: 7, y: 5, facing: -1 },
      { turn: 4, id: 'shadow_rat', x: 1, y: 6, facing: 1, bark: '「竹海深處伏兵殺出！包夾敵軍！」' },
      { turn: 4, id: 'mist_sorcerer', x: 8, y: 6, facing: -1 }
    ],
    lanterns: [
      { x: 4, y: 1, radius: 2 }
    ],
    deployTiles: [
      { x: 3, y: 11 }, { x: 4, y: 11 }, { x: 5, y: 11 }, { x: 6, y: 11 },
      { x: 4, y: 12 }, { x: 5, y: 12 }
    ],
    enemySpawns: [
      { id: 'shield_guard', x: 4, y: 0, facing: 2, aggro: 'guard', guardRadius: 2 },
      { id: 'shield_guard', x: 5, y: 0, facing: 2, aggro: 'guard', guardRadius: 2 },
      { id: 'shield_guard', x: 4, y: 1, facing: 2, aggro: 'guard', guardRadius: 2 },
      { id: 'shield_guard', x: 5, y: 1, facing: 2, aggro: 'guard', guardRadius: 2 },
      { id: 'shield_guard', x: 5, y: 2, facing: -1, aggro: 'guard', guardRadius: 2 },
      { id: 'shield_guard', x: 4, y: 4, facing: -1, aggro: 'guard', guardRadius: 3 },
      { id: 'mist_sorcerer', x: 5, y: 4, facing: -1, aggro: 'guard', guardRadius: 3 },
      { id: 'shadow_archer', x: 3, y: 6, facing: 1, aggro: 'guard', guardRadius: 4 },
      { id: 'shadow_archer', x: 6, y: 6, facing: -1, aggro: 'guard', guardRadius: 4 },
      { id: 'mist_scout', x: 5, y: 8, facing: -1 },
      { id: 'shadow_rat', x: 2, y: 8, facing: 1 }
    ],
    storyBefore: [
      { speaker: 'cat_patrol', mood: 'calm', text: '「此乃斷魂隘口，兩側竹海深密，夜霧鎖陣，極易遭遇埋伏。」' },
      { speaker: 'lantern_crafter', mood: 'calm', text: '「我已備好引魂明燈，隨時可照亮林間霧影，令匿影無所遁形！」' },
      { speaker: 'bear_guard', mood: 'angry', text: '「後方探子回報有敵方精騎正包抄而來，俺自當斷後阻截！」' }
    ],
    // 10 cols x 13 rows hand-aligned to map_bamboo_pass.webp
    terrain: [
      "##ffff####", // 0: Shrine mountain crest
      "##ffrrff##", // 1: Stone altar shrine
      "##ffrrff##", // 2: Shrine steps
      "fff..r.fff", // 3: Valley gate approach
      "ffff.rffff", // 4: Chokepoint pass held by shield guard
      "fff..r..ff", // 5: Bamboo narrows
      "fffh.r.hff", // 6: Flanking bamboo hills (h)
      "ff...r..ff", // 7: Winding cobblestone
      "fff..r.fff", // 8: Cobblestone path
      "ffff.rffff", // 9: Dense bamboo approach
      "fff..r.fff", // 10: Entrance glade
      "ff...r..ff", // 11: Deployment zone
      "ff...r..ff"  // 12: Valley entrance
    ]
  },

  {
    id: 6,
    key: 'siege',
    title: '第六回 · 鐵甲雄關破重圍',
    mapName: '攻城',
    image: 'map_siege.webp',
    weather: 'rain',
    squadLimit: 6,
    maxTurns: 8,
    hasCollapsibleBridge: true,
    objectiveType: 'breach_gate_or_rout',
    objectiveDesc: '強渡護城河擊破鐵門，或側翼飛騎奇襲斬殺【鎮關將領】（8回合內）',
    defeatDesc: '我方全軍覆沒 或 超過8回合',
    bossId: 'citadel_warlord',
    gateTiles: [
      { x: 4, y: 5 }, { x: 5, y: 5 }
    ],
    lanterns: [
      { x: 4, y: 11, radius: 2 }
    ],
    deployTiles: [
      { x: 3, y: 11 }, { x: 5, y: 11 }, { x: 7, y: 11 },
      { x: 2, y: 12 }, { x: 4, y: 12 }, { x: 6, y: 12 },
      { x: 4, y: 10 }, { x: 6, y: 10 }
    ],
    reinforcements: [
      { turn: 5, id: 'mist_scout', x: 8, y: 6, facing: -1, bark: '「斥候查探，敵軍已被切斷後路！」' }
    ],
    enemySpawns: [
      { id: 'shield_guard', x: 4, y: 1, facing: 2, aggro: 'guard', guardRadius: 2 },
      { id: 'citadel_warlord', x: 4, y: 2, facing: -1 }, // Fortress Keep commander
      { id: 'shadow_archer', x: 5, y: 2, facing: -1, aggro: 'guard', guardRadius: 3 }, // Inner keep bodyguard
      { id: 'siege_engine', x: 2, y: 2, facing: -1 },    // Artillery on ramparts
      { id: 'shadow_archer', x: 2, y: 4, facing: 1 },    // Wall archer
      { id: 'shadow_archer', x: 7, y: 4, facing: -1 },   // Wall archer
      { id: 'shield_guard', x: 4, y: 6, facing: -1 },    // Gatekeeper guard
      { id: 'shield_guard', x: 5, y: 6, facing: -1 }     // Gatekeeper guard
    ],
    storyBefore: [
      { speaker: 'cat_patrol', mood: 'calm', text: '「此城乃迷霧軍團之樞紐要塞，城樓上有霹靂砲車封鎖吊橋！」' },
      { speaker: 'bear_guard', mood: 'angry', text: '「正面鐵門有重盾死守，若能以水淹破壞護城河踏板，或令鶴羽自側翼飛越城牆，定能直搗中軍！」' },
      { speaker: 'crane_rider', mood: 'calm', text: '「城牆高聳，但攔不住我雲間仙鶴，我可先行飛越城頭切入砲車盲區！」' }
    ],
    // 10 cols x 13 rows hand-aligned to map_siege.webp
    // w: moat water, b: bridge over moat, #: stone fortress walls, g: fortress gate, h: battlements / high ground ramparts
    terrain: [
      "##......##", // 0: Keep interior
      "#...rr...#", // 1: Keep courtyard
      "#.h.rr.h.#", // 2: Ramparts with siege engine (x=2, y=2)
      "#.h.rr.h.#", // 3: Inner gate courtyard
      "###hhhh###", // 4: Fortress wall battlements (archers on h)
      "####gg####", // 5: Massive iron citadel gate (cols 4-5)
      "...#..#...", // 6: Outer gate approach held by shield guards
      "wwwwbbwwww", // 7: Moat with bridge crossing (cols 4-5)
      "wwwwbbwwww", // 8: Moat with bridge crossing
      "...rrr....", // 9: Moat approach
      "...rrr....", // 10: Siege camp road
      "...rrr....", // 11: Deployment zone
      "...rrr...."  // 12: Deployment zone
    ]
  },
  {
    id: 7,
    key: 'side_marsh',
    isSideBattle: true,
    title: '外傳 · 荒澤伏擊破咒禁',
    mapName: '荒澤',
    image: 'map_side_marsh.webp',
    weather: 'fog',
    banner: 'banner_side.webp',
    squadLimit: 5,
    maxTurns: 12,
    hasNightFog: true,
    objectiveType: 'survive_or_rout',
    objectiveDesc: '深入荒澤水寨，斬殺【咒禁術士】或全殲伏兵（12回合內）',
    defeatDesc: '我方全軍覆沒 或 超過12回合',
    bossId: 'curse_sorcerer',
    lanterns: [
      { x: 1, y: 11, radius: 2 },
      { x: 7, y: 4, radius: 2 }
    ],
    deployTiles: [
      { x: 1, y: 11 }, { x: 2, y: 11 }, { x: 3, y: 11 },
      { x: 1, y: 12 }, { x: 2, y: 12 }, { x: 3, y: 12 },
      { x: 1, y: 10 }, { x: 2, y: 10 }
    ],
    reinforcements: [
      { turn: 3, id: 'paper_ghost', x: 1, y: 7, facing: 1, bark: '「冤魂借水還陽……休想活著離開荒澤！」' },
      { turn: 3, id: 'paper_ghost', x: 6, y: 7, facing: -1 },
      { turn: 3, id: 'shadow_archer', x: 7, y: 4, facing: -1 },
      { turn: 4, id: 'shadow_rat', x: 2, y: 9, facing: 1, bark: '「水寨泥濘深處，皆為爾等葬身之所！」' },
      { turn: 4, id: 'mist_sorcerer', x: 6, y: 9, facing: -1 }
    ],
    enemySpawns: [
      { id: 'curse_sorcerer', x: 4, y: 2, facing: -1, aggro: 'guard', guardRadius: 3 },
      { id: 'shield_guard', x: 4, y: 3, facing: -1, aggro: 'guard', guardRadius: 3 },
      { id: 'mist_scout', x: 5, y: 4, facing: -1 },
      { id: 'shadow_rat', x: 2, y: 5, facing: 1 }
    ],
    storyBefore: [
      { speaker: 'cat_patrol', mood: 'calm', text: '「此處是大荒沼澤水寨，妖術師在前方祭壇布下咒禁之陣，沼澤水草深處更伏有刺客！」' },
      { speaker: 'bear_guard', mood: 'angry', text: '「蘆葦水澤易燃，若用火攻火箭齊射，定可引燃蘆葦燒盡妖道與咒符！」' },
      { speaker: 'lantern_crafter', mood: 'calm', text: '「水澤多水，若以水淹引洪流，亦能將伏兵沖入深水溺斃！」' }
    ],
    terrain: [
      "##..rr..##", // 0: Marsh fort palisade
      "#...rr...#", // 1: Palisade courtyard
      "....rr....", // 2: Sorcerer altar (x=4, y=2)
      "..ffff....", // 3: Reed marsh (forest terrain)
      "..ffff....", // 4: Reed marsh
      "ww...ffwww", // 5: Marsh shallows & water
      "ww..bb.www", // 6: Boardwalk over marsh
      "ww..bb.www", // 7: Boardwalk over marsh
      "..ffff....", // 8: Reed marsh
      "...rrr....", // 9: Muddy causeway
      "...rrr....", // 10: Marsh approach
      "...rrr....", // 11: Deployment zone
      "...rrr...."  // 12: Deployment zone
    ]
  },
  {
    id: 8,
    key: 'mountain_ambush',
    title: '第八回 · 萬壑松風伏兵隘',
    mapName: '萬壑山隘',
    image: 'map_mountain_pass.webp',
    weather: 'clear',
    banner: 'banner_ch8.webp',
    squadLimit: 6,
    maxTurns: 7,
    objectiveType: 'break_phalanx_or_rout',
    objectiveDesc: '斬殺【伏兵統領】或擊潰重裝盾陣全殲敵軍（7回合內）',
    defeatDesc: '我方全軍覆沒 或 超過6回合',
    bossId: 'mountain_warlord',
    lanterns: [
      { x: 1, y: 11, radius: 2 },
      { x: 8, y: 4, radius: 2 }
    ],
    deployTiles: [
      { x: 3, y: 11 }, { x: 4, y: 11 }, { x: 5, y: 11 }, { x: 6, y: 11 },
      { x: 3, y: 12 }, { x: 4, y: 12 },
      { x: 4, y: 10 }, { x: 5, y: 10 }
    ],
    reinforcements: [
      { turn: 3, id: 'fog_rider', x: 1, y: 5, facing: 1, bark: '「萬壑伏兵四起，截斷退路！」' },
      { turn: 3, id: 'shadow_archer', x: 8, y: 3, facing: -1, bark: '「居高臨下，亂箭齊發！」' }
    ],
    enemySpawns: [
      { id: 'mountain_warlord', x: 4, y: 1, facing: 2, aggro: 'guard', guardRadius: 3 },
      { id: 'shield_phalanx', x: 3, y: 4, facing: 2, aggro: 'guard', guardRadius: 2 },
      { id: 'shield_phalanx', x: 4, y: 3, facing: 2, aggro: 'guard', guardRadius: 2 },
      { id: 'shield_phalanx', x: 5, y: 4, facing: 2, aggro: 'guard', guardRadius: 2 },
      { id: 'shadow_archer', x: 2, y: 2, facing: 2 },
      { id: 'shadow_archer', x: 7, y: 2, facing: 2 }
    ],
    storyBefore: [
      { speaker: 'cat_patrol', mood: 'calm', text: '「前方是萬壑松風險隘！兩側峭壁如削，敵軍布下鐵壁盾陣，正面刀槍不入！」' },
      { speaker: 'bear_guard', mood: 'angry', text: '「正面硬撼如同撞擊磐石！若能從側翼懸崖包抄，或以滾木自斜坡砸落，定能砸裂盾陣！」' },
      { speaker: 'lantern_crafter', mood: 'calm', text: '「此外，盾陣不防奇術法術，以破煞靈矢或靈火轟擊亦能穿透大盾！」' }
    ],
    // 10 cols x 13 rows hand-aligned to map_mountain_pass.webp
    // #: cliff wall, h: high ground cliff ridge, f: mountain pine forest, r: mountain road pass, .: scree
    terrain: [
      "####..####", // 0: Mountain pass entrance
      "###.rr.###", // 1: Warlord redoubt (x=4, y=1)
      "#hh.rr.hh#", // 2: High clifftops (archers on high ground)
      "#hh.rr.hh#", // 3: High clifftops
      "##..rr..##", // 4: Defile chokepoint (shield phalanx at x=3,5)
      "##.ffff.##", // 5: Pine forest slope
      "#..ffff..#", // 6: Pine forest flank trails
      "#...rr...#", // 7: Valley floor
      "...rrrr...", // 8: Road fork
      "..rrrrrr..", // 9: Road pass
      "..rrrrrr..", // 10: Mountain pass approach
      "...rrrr...", // 11: Deployment zone
      "...rrrr..."  // 12: Deployment zone
    ]
  }
];
