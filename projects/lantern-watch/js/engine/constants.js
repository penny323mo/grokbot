/**
 * js/engine/constants.js
 * Game constants, board rules, terrain definitions, difficulties, and ascension levels.
 */

export const GRID_COLS = 5;
export const GRID_ROWS = 6;

// Town row is row 5; Lanterns sit at (0, 5), (2, 5), (4, 5)
export const LANTERN_COORDINATES = [
  { x: 0, y: 5, id: "lantern_left" },
  { x: 2, y: 5, id: "lantern_mid" },
  { x: 4, y: 5, id: "lantern_right" }
];

export const TERRAINS = {
  GRASS: "grass",         // Normal walkable ground
  WATER: "water",         // Water pool: pushes into water cause +2 collision damage
  BAMBOO: "bamboo",       // Bamboo grove: cover, grants -1 ranged damage taken
  LANTERN_POST: "post"    // Stone post: standing unit gets +1 attack range and dispels 1 extra tile of fog
};

export const TAGS = {
  LIGHT: "光",   // Light / Yang: Burn damage, lantern healing
  FURRY: "毛",   // Furry / Spirit Animal: Mobility & speed
  GUARD: "守",   // Shield / Protector: Armor & taunt
  MYSTIC: "術"   // Mystic / Magic: Spells, energy, positioning
};

export const TAG_RESONANCE = {
  [TAGS.LIGHT]: {
    name: "雙光共鳴",
    desc: "我方所有攻擊附加 1 點燃燒；回合結束時未滿血燈籠回復 1 點耐久。"
  },
  [TAGS.FURRY]: {
    name: "雙毛共鳴",
    desc: "全體友軍移動力 +1，走位靈動自如。"
  },
  [TAGS.GUARD]: {
    name: "雙守共鳴",
    desc: "每回合開始時，所有友軍獲得 2 點護甲。"
  },
  [TAGS.MYSTIC]: {
    name: "雙術共鳴",
    desc: "每回合打出的第一張法術牌能量消耗 -1。"
  }
};

export const DIFFICULTIES = {
  RELAXED: {
    id: "relaxed",
    name: "悠閒 (Relaxed)",
    subtitle: "暖茶微風，悔棋無憂",
    lanternHp: 4,
    enemyAtkMod: -1,
    infiniteUndo: true,
    starBonus: 1.0
  },
  STANDARD: {
    id: "standard",
    name: "標準 (Standard)",
    subtitle: "守夜本色，巧用棋局",
    lanternHp: 3,
    enemyAtkMod: 0,
    infiniteUndo: false,
    starBonus: 1.2
  },
  CHALLENGING: {
    id: "challenging",
    name: "挑戰 (Challenging)",
    subtitle: "惡霧猖獗，寸土必爭",
    lanternHp: 2,
    enemyAtkMod: 0,
    extraSpawns: 1,
    infiniteUndo: false,
    starBonus: 1.5
  }
};

export const ASCENSION_LEVELS = [
  { level: 0, name: "初入守夜", desc: "無進階負面效果" },
  { level: 1, name: "濃霧蔓延", desc: "戰場視野受到濃霧壓制，初始可見行數 -1" },
  { level: 2, name: "凶煞凶靈", desc: "所有霧怪攻擊力 +1" },
  { level: 3, name: "殘燭難續", desc: "所有「燈火」類別卡牌能量消耗 +1" },
  { level: 4, name: "強敵環伺", desc: "精英怪與 Boss 最大生命值 +25%" },
  { level: 5, name: "夜深霜重", desc: "每場戰鬥第 1 回合初始手牌減少 1 張" }
];

export const TOWN_BUILDINGS = [
  {
    id: "bldg_watchtower",
    name: "守夜小亭",
    subtitle: "燈火更勝從前",
    cost: 10,
    desc: "每場冒險開始時，燈籠初始生命值 +1（上限 +1）。",
    effect: { lanternHpBonus: 1 }
  },
  {
    id: "bldg_courier",
    name: "飛信驛站",
    subtitle: "解鎖新守護者：鶴郵差",
    cost: 20,
    desc: "解鎖守護者「鶴郵差」及其專屬穿透與抽牌卡牌。",
    effect: { unlockUnit: "crane_courier" }
  },
  {
    id: "bldg_music_hall",
    name: "蓮池樂坊",
    subtitle: "解鎖新守護者：蛙樂師",
    cost: 25,
    desc: "解鎖守護者「蛙樂師」及其強大聲浪推擊卡牌。",
    effect: { unlockUnit: "frog_bard" }
  },
  {
    id: "bldg_fox_shrine",
    name: "狐仙小祠",
    subtitle: "解鎖新守護者：狐巫女",
    cost: 30,
    desc: "解鎖守護者「狐巫女」及其破邪驅霧神聖卡牌。",
    effect: { unlockUnit: "fox_maiden" }
  },
  {
    id: "bldg_bakery",
    name: "麥香烘焙坊",
    subtitle: "解鎖新守護者：熊麵包師",
    cost: 35,
    desc: "解鎖守護者「熊麵包師」及投擲治癒熱包子卡牌。",
    effect: { unlockUnit: "bear_baker" }
  },
  {
    id: "bldg_tea_bush",
    name: "老茶樹",
    subtitle: "茶館免費精簡",
    cost: 25,
    desc: "冒險中每座茶館提供 1 次免費刪除卡牌服務。",
    effect: { freeCardRemoval: 1 }
  },
  {
    id: "bldg_forge",
    name: "鍛造工房",
    subtitle: "起手自帶強化",
    cost: 30,
    desc: "每場冒險開始時，隨機強化初始牌組中的 1 張卡牌（升級為 + 版）。",
    effect: { startUpgradeCard: 1 }
  },
  {
    id: "bldg_lucky_stone",
    name: "幸運石燈",
    subtitle: "生財有道",
    cost: 20,
    desc: "戰鬥勝利獲得的銅錢增加 25%。",
    effect: { coinBonus: 0.25 }
  },
  {
    id: "bldg_herbal_garden",
    name: "百草草藥圃",
    subtitle: "守護者體魄增強",
    cost: 30,
    desc: "所有登場友軍守護者最大生命值 +2。",
    effect: { unitHpBonus: 2 }
  },
  {
    id: "bldg_star_pavilion",
    name: "觀星閣",
    subtitle: "解鎖第二初始流派",
    cost: 50,
    desc: "解鎖第二套可選初始牌組：「烈焰燈火流」（以小龍、燈籠匠為主攻）。",
    effect: { unlockDeck: "deck_blazing" }
  }
];

export const SAVE_KEY = "lantern_watch_save_v1";
export const RUN_SAVE_KEY = "lantern_watch_run_v1";
