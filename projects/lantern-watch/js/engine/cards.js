/**
 * js/engine/cards.js
 * Card catalogue (~45 cards + upgraded '+' variants), deck archetypes, and card effects.
 */

export const CARD_TYPES = {
  SUMMON: "summon",   // 召喚
  COMMAND: "command", // 指令
  SPELL: "spell",     // 法術
  LANTERN: "lantern"  // 燈火
};

export function getCardTypeLabel(type) {
  if (type === CARD_TYPES.SUMMON) return "召喚";
  if (type === CARD_TYPES.COMMAND) return "指令";
  if (type === CARD_TYPES.SPELL) return "法術";
  if (type === CARD_TYPES.LANTERN) return "燈火";
  return type || "";
}

export const CARD_CATALOGUE = [
  // ================= 召喚牌 (SUMMON CARDS) =================
  {
    id: "card_summon_cat",
    name: "召喚：貓巡邏員",
    type: CARD_TYPES.SUMMON,
    cost: 1,
    unitId: "cat_patrol",
    targetType: "empty_friendly_tile",
    desc: "在己方半場空格召喚一隻【貓巡邏員】（生命 8，攻擊 3，移動 2）。",
    upgrade: {
      id: "card_summon_cat_plus",
      name: "召喚：貓巡邏員+",
      cost: 1,
      desc: "召喚【貓巡邏員+】（生命 10，攻擊 4，登場時立即獲得 2 護甲）。",
      unitBonusHp: 2,
      unitBonusAtk: 1,
      bonusArmor: 2
    }
  },
  {
    id: "card_summon_tea",
    name: "召喚：茶師傅",
    type: CARD_TYPES.SUMMON,
    cost: 1,
    unitId: "tea_master",
    targetType: "empty_friendly_tile",
    desc: "在己方空格召喚【茶師傅】（生命 7，回合結束為相鄰友軍回復 2 生命並加 1 護甲）。",
    upgrade: {
      id: "card_summon_tea_plus",
      name: "召喚：茶師傅+",
      cost: 1,
      desc: "召喚【茶師傅+】（生命 9，回合結束回復量提升至 3 點，護甲提升至 2 點）。",
      unitBonusHp: 2,
      healBonus: 1,
      bonusArmor: 1
    }
  },
  {
    id: "card_summon_lantern_crafter",
    name: "召喚：燈籠匠",
    type: CARD_TYPES.SUMMON,
    cost: 1,
    unitId: "lantern_crafter",
    targetType: "empty_friendly_tile",
    desc: "在己方空格召喚【燈籠匠】（生命 6，攻擊 3，射程 3，可驅散濃霧）。",
    upgrade: {
      id: "card_summon_lantern_crafter_plus",
      name: "召喚：燈籠匠+",
      cost: 1,
      desc: "召喚【燈籠匠+】（生命 8，攻擊 4，射程 4，攻擊附帶燃燒）。",
      unitBonusHp: 2,
      unitBonusAtk: 1
    }
  },
  {
    id: "card_summon_scarecrow",
    name: "召喚：稻草人",
    type: CARD_TYPES.SUMMON,
    cost: 1,
    unitId: "scarecrow",
    targetType: "empty_tile",
    desc: "在任意空格召喚堅韌的【稻草人】（生命 12，嘲諷周圍 2 格內敵人）。",
    upgrade: {
      id: "card_summon_scarecrow_plus",
      name: "召喚：稻草人+",
      cost: 1,
      desc: "召喚【稻草人+】（生命 16，自帶 4 點護甲，反彈 2 點近戰傷害）。",
      unitBonusHp: 4,
      bonusArmor: 4
    }
  },
  {
    id: "card_summon_tanuki",
    name: "召喚：狸貓魔術師",
    type: CARD_TYPES.SUMMON,
    cost: 1,
    unitId: "tanuki_mage",
    targetType: "empty_friendly_tile",
    desc: "召喚【狸貓魔術師】（生命 6，攻擊 2，攻擊附帶後推與碰撞傷害）。",
    upgrade: {
      id: "card_summon_tanuki_plus",
      name: "召喚：狸貓魔術師+",
      cost: 1,
      desc: "召喚【狸貓魔術師+】（生命 8，攻擊 3，擊退距離增至 2 格）。",
      unitBonusHp: 2,
      unitBonusAtk: 1
    }
  },
  {
    id: "card_summon_dragon",
    name: "召喚：小龍",
    type: CARD_TYPES.SUMMON,
    cost: 2,
    unitId: "little_dragon",
    targetType: "empty_friendly_tile",
    desc: "召喚【小龍】（生命 7，攻擊 3，直線噴吐貫穿前方 2 格所有敵人）。",
    upgrade: {
      id: "card_summon_dragon_plus",
      name: "召喚：小龍+",
      cost: 1, // Energy discount!
      desc: "召喚【小龍+】（能量消耗減為 1，攻擊 4，貫穿整列敵人）。",
      unitBonusHp: 1,
      unitBonusAtk: 1
    }
  },
  {
    id: "card_summon_crane",
    name: "召喚：鶴郵差",
    type: CARD_TYPES.SUMMON,
    cost: 1,
    unitId: "crane_courier",
    targetType: "empty_tile",
    desc: "在任意空格召喚【鶴郵差】（生命 6，攻擊 3，移動 3，擊倒敵人立即抽牌）。",
    upgrade: {
      id: "card_summon_crane_plus",
      name: "召喚：鶴郵差+",
      cost: 1,
      desc: "召喚【鶴郵差+】（生命 8，攻擊 4，登場時立即抽 1 張牌）。",
      unitBonusHp: 2,
      unitBonusAtk: 1
    }
  },
  {
    id: "card_summon_frog",
    name: "召喚：蛙樂師",
    type: CARD_TYPES.SUMMON,
    cost: 1,
    unitId: "frog_bard",
    targetType: "empty_friendly_tile",
    desc: "召喚【蛙樂師】（生命 7，十字範圍聲波攻擊，擊退周圍所有敵人）。",
    upgrade: {
      id: "card_summon_frog_plus",
      name: "召喚：蛙樂師+",
      cost: 1,
      desc: "召喚【蛙樂師+】（生命 9，攻擊 3，聲波攻擊使敵人下回合攻擊 -1）。",
      unitBonusHp: 2,
      unitBonusAtk: 1
    }
  },
  {
    id: "card_summon_fox",
    name: "召喚：狐巫女",
    type: CARD_TYPES.SUMMON,
    cost: 2,
    unitId: "fox_maiden",
    targetType: "empty_friendly_tile",
    desc: "召喚【狐巫女】（生命 6，射程 3，對精英與 Boss 造成額外 3 點神聖傷害）。",
    upgrade: {
      id: "card_summon_fox_plus",
      name: "召喚：狐巫女+",
      cost: 1,
      desc: "消耗減至 1 點。召喚【狐巫女+】（生命 8，攻擊 4，登場賦予全隊 2 點護甲）。",
      unitBonusHp: 2,
      unitBonusAtk: 1
    }
  },
  {
    id: "card_summon_bear",
    name: "召喚：熊麵包師",
    type: CARD_TYPES.SUMMON,
    cost: 2,
    unitId: "bear_baker",
    targetType: "empty_friendly_tile",
    desc: "召喚【熊麵包師】（生命 10，移動後留下治癒包子，友軍拾取回復 3 生命）。",
    upgrade: {
      id: "card_summon_bear_plus",
      name: "召喚：熊麵包師+",
      cost: 1,
      desc: "消耗減至 1 點。召喚【熊麵包師+】（生命 12，登場時在相鄰空格直接放 2 個包子）。",
      unitBonusHp: 2
    }
  },

  // ================= 指令牌 (COMMAND CARDS) =================
  {
    id: "card_command_advance",
    name: "突進指令",
    type: CARD_TYPES.COMMAND,
    cost: 1,
    targetType: "friendly_unit",
    desc: "指定一位友軍向前或斜向突進最多 2 格，並立即發動一次普通攻擊。",
    value: 2,
    upgrade: {
      id: "card_command_advance_plus",
      name: "突進指令+",
      cost: 1,
      desc: "指定一位友軍突進最多 3 格，本次攻擊力額外 +2 點並獲得 2 護甲。",
      value: 3,
      bonusAtk: 2,
      bonusArmor: 2
    }
  },
  {
    id: "card_command_rally",
    name: "守夜集結",
    type: CARD_TYPES.COMMAND,
    cost: 1,
    targetType: "none",
    desc: "全體在場友軍立即獲得 2 點護甲，並向最近的燈籠靠攏 1 格。",
    value: 2,
    upgrade: {
      id: "card_command_rally_plus",
      name: "守夜集結+",
      cost: 1,
      desc: "全體友軍獲得 4 點護甲，並回復 2 點生命值。",
      value: 4,
      healValue: 2
    }
  },
  {
    id: "card_command_reposition",
    name: "走位換防",
    type: CARD_TYPES.COMMAND,
    cost: 0,
    targetType: "friendly_unit",
    desc: "零費令一位友軍移動 1 格，不消耗該友軍本回合攻擊機會。",
    value: 1,
    upgrade: {
      id: "card_command_reposition_plus",
      name: "走位換防+",
      cost: 0,
      desc: "零費令一位友軍移動最多 2 格，且獲得「下一次攻擊 +2 傷害」。",
      value: 2,
      bonusAtk: 2
    }
  },
  {
    id: "card_command_strike_again",
    name: "連環迅擊",
    type: CARD_TYPES.COMMAND,
    cost: 1,
    targetType: "friendly_unit",
    desc: "指定一位本回合已攻擊過的友軍，重置其攻擊冷卻，再次發動攻擊！",
    upgrade: {
      id: "card_command_strike_again_plus",
      name: "連環迅擊+",
      cost: 1,
      desc: "重置指定友軍攻擊冷卻，立即攻擊且本次攻擊必定暴擊（傷害 +3 點）。",
      bonusAtk: 3
    }
  },
  {
    id: "card_command_tactical_swap",
    name: "移位陣法",
    type: CARD_TYPES.COMMAND,
    cost: 1,
    targetType: "friendly_unit",
    desc: "交換兩名在場友軍的位置，雙方各獲得 2 點護甲。",
    upgrade: {
      id: "card_command_tactical_swap_plus",
      name: "移位陣法+",
      cost: 0, // Free!
      desc: "消耗減為 0。交換兩名在場友軍位置，雙方各獲得 3 點護甲並抽 1 張牌。"
    }
  },

  // ================= 法術牌 (SPELL CARDS) =================
  {
    id: "card_spell_gust",
    name: "掌風擊退",
    type: CARD_TYPES.SPELL,
    cost: 1,
    targetType: "enemy_unit",
    value: 2,
    pushDistance: 1,
    desc: "對目標敵人造成 2 點傷害，並向後擊退 1 格。若撞入水池或障礙，額外造成 2 點碰撞傷。",
    upgrade: {
      id: "card_spell_gust_plus",
      name: "掌風擊退+",
      cost: 1,
      value: 4,
      pushDistance: 2,
      desc: "造成 4 點傷害，向後擊退 2 格。撞擊障礙造成 3 點額外碰撞傷。"
    }
  },
  {
    id: "card_spell_fireball",
    name: "燈花爆裂",
    type: CARD_TYPES.SPELL,
    cost: 1,
    targetType: "enemy_unit",
    value: 4,
    desc: "彈射出一團烈性燈花，對單體敵人造成 4 點火焰傷害，驅散目標周圍迷霧。",
    upgrade: {
      id: "card_spell_fireball_plus",
      name: "燈花爆裂+",
      cost: 1,
      value: 7,
      desc: "造成 7 點火焰傷害，並對相鄰所有敵人造成 2 點濺射傷害。"
    }
  },
  {
    id: "card_spell_barrier",
    name: "竹符結界",
    type: CARD_TYPES.SPELL,
    cost: 1,
    targetType: "friendly_unit",
    value: 5,
    desc: "在友軍或燈籠周圍升起一道竹符護罩，提供 5 點護甲。",
    upgrade: {
      id: "card_spell_barrier_plus",
      name: "竹符結界+",
      cost: 1,
      value: 8,
      desc: "提供 8 點護甲，並在目標格種下一叢翠竹（提供掩體減傷效果）。"
    }
  },
  {
    id: "card_spell_whirlwind",
    name: "夜風呼嘯",
    type: CARD_TYPES.SPELL,
    cost: 2,
    targetType: "row_select",
    value: 3,
    desc: "召喚橫掃夜風，對整整一橫排的所有霧怪造成 3 點傷害並向後推 1 格。",
    upgrade: {
      id: "card_spell_whirlwind_plus",
      name: "夜風呼嘯+",
      cost: 1,
      value: 4,
      desc: "消耗減為 1。對一橫排所有霧怪造成 4 點傷害並後推 1 格。"
    }
  },
  {
    id: "card_spell_freeze_mist",
    name: "凝霜咒",
    type: CARD_TYPES.SPELL,
    cost: 1,
    targetType: "enemy_unit",
    desc: "將目標霧怪凍結 1 回合，該霧怪本回合無法移動也無法攻擊！",
    upgrade: {
      id: "card_spell_freeze_mist_plus",
      name: "凝霜咒+",
      cost: 1,
      desc: "凍結目標及其相鄰的 1 隻敵人 1 回合，並造成 2 點寒霜傷害。"
    }
  },
  {
    id: "card_spell_bamboo_trap",
    name: "地刺竹陷",
    type: CARD_TYPES.SPELL,
    cost: 1,
    targetType: "empty_tile",
    desc: "在任意空格埋設竹刺陷阱，第一個踩上的敵人受到 5 點傷害並定身 1 回合。",
    upgrade: {
      id: "card_spell_bamboo_trap_plus",
      name: "地刺竹陷+",
      cost: 0,
      desc: "消耗減為 0。陷阱造成 7 點傷害並定身敵人。"
    }
  },
  {
    id: "card_spell_spirit_rain",
    name: "甘露靈雨",
    type: CARD_TYPES.SPELL,
    cost: 1,
    targetType: "none",
    desc: "召喚柔和靈雨，全體友軍回復 3 點生命，並撲滅所有燃燒或負面詛咒。",
    upgrade: {
      id: "card_spell_spirit_rain_plus",
      name: "甘露靈雨+",
      cost: 1,
      desc: "全體友軍回復 5 點生命，燈籠耐久回復 1 點，並抽 1 張牌。"
    }
  },
  {
    id: "card_spell_thunder_strike",
    name: "驚蟄神雷",
    type: CARD_TYPES.SPELL,
    cost: 2,
    targetType: "enemy_unit",
    value: 8,
    desc: "引九天神雷轟擊單一目標，造成 8 點巨大雷擊傷害！",
    upgrade: {
      id: "card_spell_thunder_strike_plus",
      name: "驚蟄神雷+",
      cost: 2,
      value: 12,
      desc: "雷擊傷害提升至 12 點，並使全場其餘敵人震懾（攻擊力 -1 點）。"
    }
  },

  // ================= 燈火牌 (LANTERN CARDS) =================
  {
    id: "card_lantern_refuel",
    name: "添燈加油",
    type: CARD_TYPES.LANTERN,
    cost: 1,
    targetType: "lantern_or_unit",
    desc: "為一座受損燈籠回復 1 點生命（上限 4）；或為一位友軍提供 4 點護甲。",
    healLantern: 1,
    bonusArmor: 4,
    upgrade: {
      id: "card_lantern_refuel_plus",
      name: "添燈加油+",
      cost: 1,
      desc: "為一座燈籠回復 2 點生命，或為友軍提供 7 點護甲，並抽 1 張牌。",
      healLantern: 2,
      bonusArmor: 7,
      draw: 1
    }
  },
  {
    id: "card_lantern_flare",
    name: "輝光四射",
    type: CARD_TYPES.LANTERN,
    cost: 1,
    targetType: "none",
    desc: "激發所有現存燈籠的神聖光輝，對每座燈籠前方的所有霧怪造成 2 點神聖傷害。",
    value: 2,
    upgrade: {
      id: "card_lantern_flare_plus",
      name: "輝光四射+",
      cost: 1,
      value: 4,
      desc: "對每座燈籠前方及兩側的所有霧怪造成 4 點神聖傷害，並驅散全場迷霧。"
    }
  },
  {
    id: "card_lantern_oil_flask",
    name: "桐油特釀",
    type: CARD_TYPES.LANTERN,
    cost: 0,
    targetType: "none",
    desc: "零費立即獲得 1 點額外能量，並抽 1 張牌。純粹流暢！",
    upgrade: {
      id: "card_lantern_oil_flask_plus",
      name: "桐油特釀+",
      cost: 0,
      desc: "零費獲得 2 點額外能量，並抽 1 張牌！"
    }
  },
  {
    id: "card_lantern_guardian_halo",
    name: "明光光環",
    type: CARD_TYPES.LANTERN,
    cost: 1,
    targetType: "friendly_unit",
    desc: "為一名友軍賦予【守夜光環】，只要該友軍存活，相鄰格子所有單位攻擊力 +1。",
    upgrade: {
      id: "card_lantern_guardian_halo_plus",
      name: "明光光環+",
      cost: 1,
      desc: "相鄰友軍攻擊力 +2，且該友軍每回合獲得 2 點護甲。"
    }
  },
  {
    id: "card_lantern_ignite",
    name: "火樹銀花",
    type: CARD_TYPES.LANTERN,
    cost: 2,
    targetType: "none",
    desc: "引爆夜空煙火，照亮全場。對場上所有處於濃霧中的敵人造成 3 點真實傷害。",
    upgrade: {
      id: "card_lantern_ignite_plus",
      name: "火樹銀花+",
      cost: 1,
      desc: "消耗減為 1。對全場所有霧怪造成 4 點真實傷害，全場驅霧 2 回合。"
    }
  }
];

// Helper to look up card by ID
export function getCardById(cardId) {
  for (const card of CARD_CATALOGUE) {
    if (card.id === cardId) return card;
    if (card.upgrade && card.upgrade.id === cardId) {
      return {
        ...card,
        ...card.upgrade,
        isUpgraded: true,
        baseId: card.id
      };
    }
  }
  return null;
}

// Starting Deck Archetype 1: Standard Cozy Deck (小鎮巡邏隊)
export const STARTING_DECK_STANDARD = [
  "card_summon_cat",
  "card_summon_cat",
  "card_summon_tea",
  "card_summon_lantern_crafter",
  "card_summon_scarecrow",
  "card_command_advance",
  "card_command_advance",
  "card_spell_gust",
  "card_spell_gust",
  "card_lantern_refuel"
];

// Starting Deck Archetype 2: Blazing Lantern Deck (烈焰燈火流 - Unlocked via Town Pavilion)
export const STARTING_DECK_BLAZING = [
  "card_summon_dragon",
  "card_summon_lantern_crafter",
  "card_summon_lantern_crafter",
  "card_summon_tanuki",
  "card_spell_fireball",
  "card_spell_fireball",
  "card_lantern_flare",
  "card_lantern_refuel",
  "card_lantern_oil_flask",
  "card_command_advance"
];
