/**
 * js/engine/relics.js
 * Relics (信物/飾品) catalogue (~20 items), passive modifiers, and combat hook triggers.
 */

export const RELICS_CATALOGUE = [
  {
    id: "relic_hot_water_bottle",
    name: "暖暖熱水袋",
    desc: "戰鬥開始時，全體登場友軍獲得 2 點護甲。",
    rarity: "common",
    price: 45
  },
  {
    id: "relic_catnip_grass",
    name: "特級貓薄荷",
    desc: "貓巡邏員攻擊力 +1，移動力 +1。",
    rarity: "common",
    price: 45
  },
  {
    id: "relic_copper_windchime",
    name: "銅風鈴",
    desc: "每當敵人企圖踏入燈籠周圍 1 格時，自動將其向後擊退 1 格（每回合觸發 1 次）。",
    rarity: "rare",
    price: 70
  },
  {
    id: "relic_ancestral_flint",
    name: "祖傳打火石",
    desc: "每場戰鬥打出的第一張「光」或「燈火」牌，傷害額外 +3 點。",
    rarity: "uncommon",
    price: 55
  },
  {
    id: "relic_clay_teapot",
    name: "粗陶老茶壺",
    desc: "茶師傅的治療量 +1；每場戰鬥第 1 回合初始能量 +1。",
    rarity: "uncommon",
    price: 60
  },
  {
    id: "relic_straw_woven_amulet",
    name: "草編護身符",
    desc: "稻草人受攻擊時，反彈 3 點傷害給近戰攻擊者。",
    rarity: "common",
    price: 45
  },
  {
    id: "relic_paper_fan",
    name: "紙摺大涼扇",
    desc: "所有擊退效果額外擊退 1 格（推力更強勁）。",
    rarity: "uncommon",
    price: 55
  },
  {
    id: "relic_star_lantern_pouch",
    name: "星燈錦囊",
    desc: "每場戰鬥勝利額外獲得 3 盞星燈（結算元貨幣）。",
    rarity: "rare",
    price: 75
  },
  {
    id: "relic_dragon_scale_gem",
    name: "小龍赤玉",
    desc: "小龍的龍息攻擊命中時，點燃整列迷霧並使目標燃燒 2 回合。",
    rarity: "rare",
    price: 70
  },
  {
    id: "relic_frog_lotus_leaf",
    name: "青蛙荷葉",
    desc: "友軍踏入水池不會減速，反而獲得 2 點護甲。",
    rarity: "common",
    price: 45
  },
  {
    id: "relic_steamed_bun_basket",
    name: "竹蒸籠",
    desc: "友軍回合結束時若與另一名友軍相鄰，回復 1 點生命值。",
    rarity: "uncommon",
    price: 55
  },
  {
    id: "relic_oil_funnel",
    name: "黃銅油漏",
    desc: "所有修復燈籠的卡牌，回復量額外 +1 點。",
    rarity: "rare",
    price: 70
  },
  {
    id: "relic_night_scout_spyglass",
    name: "夜巡望遠鏡",
    desc: "全體遠程友軍攻擊射程 +1 格。",
    rarity: "rare",
    price: 75
  },
  {
    id: "relic_spirit_bell",
    name: "水魄銅鈴",
    desc: "任何敵人被擊退跌入水池時，受到的額外碰撞傷害由 2 點提升至 5 點！",
    rarity: "uncommon",
    price: 60
  },
  {
    id: "relic_fluffy_blanket",
    name: "毛絨絨暖毯",
    desc: "觸發「雙毛共鳴」時，全隊友軍除增加移動力外，額外獲得 2 點護甲。",
    rarity: "uncommon",
    price: 55
  },
  {
    id: "relic_fortune_cat_paw",
    name: "招財貓掌",
    desc: "茶館商店中所有卡牌、飾品與刪牌服務享受八折優惠。",
    rarity: "rare",
    price: 65
  },
  {
    id: "relic_blessed_chalk",
    name: "神符粉筆",
    desc: "每場戰鬥第 1 回合額外抽 1 張卡牌（首回合手牌數為 6）。",
    rarity: "uncommon",
    price: 50
  },
  {
    id: "relic_sturdy_bamboo_staff",
    name: "韌竹手杖",
    desc: "身處竹林中的友軍獲得 3 點護甲，且攻擊力 +1 點。",
    rarity: "common",
    price: 40
  },
  {
    id: "relic_phoenix_feather",
    name: "鳳羽火種",
    desc: "一場冒險限一次：當最後一座燈籠即將熄滅時，奇蹟般重燃並回復 2 點耐久！",
    rarity: "legendary",
    price: 90
  },
  {
    id: "relic_ancient_tea_brick",
    name: "百年老茶磚",
    desc: "每回合開始時，有 30% 機率獲得額外 1 點能量（最多 4 點能量）。",
    rarity: "legendary",
    price: 85
  }
];

export function getRelicById(relicId) {
  return RELICS_CATALOGUE.find((r) => r.id === relicId) || null;
}
