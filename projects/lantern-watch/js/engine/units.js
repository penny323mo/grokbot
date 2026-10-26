/**
 * js/engine/units.js
 * Guardian and Enemy roster definitions, stats, skills, and tag classifications.
 */

import { TAGS } from "./constants.js";

// ================= GUARDIANS (守護者) =================
export const GUARDIANS = {
  cat_patrol: {
    id: "cat_patrol",
    name: "貓巡邏員",
    title: "矯捷夜行者",
    hp: 8,
    atk: 3,
    range: 1,
    move: 2,
    tags: [TAGS.FURRY, TAGS.GUARD],
    skillName: "夜行雙爪",
    skillDesc: "若本回合移動 1 格或以上後攻擊，連續揮爪攻擊 2 次（造成雙倍傷害）。",
    flavor: "「喵嗚！今晚小鎮嘅南街由我罩住！」"
  },
  tea_master: {
    id: "tea_master",
    name: "茶師傅",
    title: "暖心泡茶師",
    hp: 7,
    atk: 2,
    range: 1,
    move: 1,
    tags: [TAGS.MYSTIC, TAGS.LIGHT],
    skillName: "溫熱清茶",
    skillDesc: "每回合結束時，為相鄰上下左右所有友軍回復 2 點生命，並賦予 1 點護甲。",
    flavor: "「趁熱飲啖烏龍，霧氣就傷唔到你心脈。」"
  },
  lantern_crafter: {
    id: "lantern_crafter",
    name: "燈籠匠",
    title: "引路掌燈人",
    hp: 6,
    atk: 3,
    range: 3,
    move: 1,
    tags: [TAGS.LIGHT, TAGS.GUARD],
    skillName: "破霧明燈",
    skillDesc: "遠程攻擊，可穿透濃霧。攻擊命中時，目標格及周圍十字格驅散迷霧 1 回合。",
    flavor: "「手裏握住這盞燈，哪怕夜色再深也不會迷路。」"
  },
  scarecrow: {
    id: "scarecrow",
    name: "稻草人",
    title: "忠誠鎮守者",
    hp: 12,
    atk: 1,
    range: 1,
    move: 0,
    tags: [TAGS.GUARD, TAGS.FURRY],
    skillName: "嘲諷護衛",
    skillDesc: "距離 2 格內企圖攻擊燈籠的霧怪，必須優先攻擊稻草人；受到攻擊時獲得 2 護甲。",
    flavor: "「風吹草動我唔怕，只要燈火仲喺度，我就企喺度。」"
  },
  tanuki_mage: {
    id: "tanuki_mage",
    name: "狸貓魔術師",
    title: "換位幻術家",
    hp: 6,
    atk: 2,
    range: 2,
    move: 1,
    tags: [TAGS.MYSTIC, TAGS.FURRY],
    skillName: "乾坤挪移",
    skillDesc: "攻擊時將目標向後擊退 1 格；若撞到其他單位或邊界，額外造成 2 點碰撞傷害。",
    flavor: "「變！大樹變茶壺，怪物變飛餅！」"
  },
  little_dragon: {
    id: "little_dragon",
    name: "小龍",
    title: "赤焰萌獸",
    hp: 7,
    atk: 3,
    range: 2,
    move: 1,
    tags: [TAGS.LIGHT, TAGS.MYSTIC],
    skillName: "直線龍息",
    skillDesc: "向正前方噴射長條火焰，貫穿直線上最多 2 個敵人並驅散直線霧氣。",
    flavor: "「呼！別看我個子小，我肚子裏可是藏著火山喔！」"
  },

  // Town Unlockable Guardians
  crane_courier: {
    id: "crane_courier",
    name: "鶴郵差",
    title: "雲端飛羽",
    hp: 6,
    atk: 3,
    range: 2,
    move: 3,
    tags: [TAGS.FURRY, TAGS.MYSTIC],
    unlockReq: "bldg_courier",
    skillName: "展翅飛渡",
    skillDesc: "移動時可越過任何單位；擊倒霧怪時立即抽 1 張牌。",
    flavor: "「十萬火急信件，順便踢飛路過嘅霧怪！」"
  },
  frog_bard: {
    id: "frog_bard",
    name: "蛙樂師",
    title: "蓮葉鼓手",
    hp: 7,
    atk: 2,
    range: 1,
    move: 1,
    tags: [TAGS.MYSTIC, TAGS.GUARD],
    unlockReq: "bldg_music_hall",
    skillName: "雷鳴蛙鼓",
    skillDesc: "攻擊相鄰十字方向所有敵人，並將所有命中敵人擊退 1 格。",
    flavor: "「呱！聽我一曲，包你神清氣爽，霧怪倒退三尺！」"
  },
  fox_maiden: {
    id: "fox_maiden",
    name: "狐巫女",
    title: "靈火守護使",
    hp: 6,
    atk: 3,
    range: 3,
    move: 1,
    tags: [TAGS.LIGHT, TAGS.MYSTIC],
    unlockReq: "bldg_fox_shrine",
    skillName: "破邪神火",
    skillDesc: "對精英怪與 Boss 造成額外 3 點神聖傷害；登場時驅散全場友軍負面狀態。",
    flavor: "「以稻荷靈光之名，諸邪退散，夜霧平息。」"
  },
  bear_baker: {
    id: "bear_baker",
    name: "熊麵包師",
    title: "熱騰騰大師",
    hp: 10,
    atk: 2,
    range: 1,
    move: 1,
    tags: [TAGS.FURRY, TAGS.GUARD],
    unlockReq: "bldg_bakery",
    skillName: "剛出爐包子",
    skillDesc: "移動後在原地留下一隻熱包子，友軍踩上時恢復 3 點生命並獲得 2 點護甲。",
    flavor: "「香噴噴嘅豆沙包出爐啦！食飽先有力氣守夜！」"
  }
};

// ================= ENEMIES (霧怪) =================
export const ENEMIES = {
  fog_blob: {
    id: "fog_blob",
    name: "霧團",
    title: "游離霧滴",
    hp: 5,
    atk: 2,
    range: 1,
    move: 1,
    armor: 0,
    behavior: "advance",
    desc: "最常見的小霧怪，緩慢向前推進試圖熄滅燈籠。"
  },
  shadow_rat: {
    id: "shadow_rat",
    name: "影鼠",
    title: "暗夜飛賊",
    hp: 4,
    atk: 2,
    range: 1,
    move: 2,
    armor: 0,
    behavior: "flank",
    desc: "敏捷的影子老鼠，專挑沒有友軍防守的邊路繞後撲咬燈籠。"
  },
  paper_ghost: {
    id: "paper_ghost",
    name: "紙傘怪",
    title: "撐傘怨靈",
    hp: 7,
    atk: 3,
    range: 1,
    move: 1,
    armor: 2,
    behavior: "shielded",
    desc: "手持油紙傘，開傘時自帶 2 點護甲，抵擋正面傷害。"
  },
  hop_lantern: {
    id: "hop_lantern",
    name: "跳跳燈",
    title: "被詛咒的妖燈",
    hp: 6,
    atk: 3,
    range: 1,
    move: 2,
    armor: 0,
    behavior: "leap",
    desc: "能夠跳躍越過前方障礙或守衛，直插後排！"
  },
  armored_snail: {
    id: "armored_snail",
    name: "鐵甲蝸",
    title: "頑固重裝客",
    hp: 10,
    atk: 2,
    range: 1,
    move: 1,
    armor: 3,
    behavior: "slow_tank",
    desc: "擁有堅固外殼，每回合自動生成 1 點護甲，步步為營。"
  },
  split_mist: {
    id: "split_mist",
    name: "分裂霧",
    title: "詭異聚合體",
    hp: 8,
    atk: 2,
    range: 1,
    move: 1,
    armor: 0,
    behavior: "split",
    desc: "被擊殺時會裂變成 2 隻 3 點血量的幼小霧團！"
  },
  windchime_spectre: {
    id: "windchime_spectre",
    name: "風鈴鬼",
    title: "淒清幽魂",
    hp: 6,
    atk: 2,
    range: 3,
    move: 1,
    armor: 0,
    behavior: "ranged_curse",
    desc: "在遠距離搖響風鈴，射出幽魂霧彈，並使目標攻擊力 -1（持續 1 回合）。"
  },
  mud_golem: {
    id: "mud_golem",
    name: "泥巨人",
    title: "濕泥守衛",
    hp: 14,
    atk: 4,
    range: 1,
    move: 1,
    armor: 2,
    behavior: "heavy_slam",
    desc: "龐大沉重的泥怪，攻擊附帶重砸，將目標向後擊退並在地上留下減速泥漿。"
  },

  // Bosses (Night 8 Showdown)
  boss_mother_of_mist: {
    id: "boss_mother_of_mist",
    name: "霧之母",
    title: "濃霧女皇",
    isBoss: true,
    hp: 32,
    atk: 4,
    range: 2,
    move: 1,
    armor: 3,
    behavior: "boss_mother",
    desc: "夜霧的源頭。每 2 回合在身邊召喚 1 隻分裂霧，並為全場霧怪施加迷霧護盾。"
  },
  boss_night_crow_king: {
    id: "boss_night_crow_king",
    name: "夜鴉王",
    title: "黑羽霸主",
    isBoss: true,
    hp: 30,
    atk: 5,
    range: 3,
    move: 2,
    armor: 2,
    behavior: "boss_crow",
    desc: "盤旋夜空的妖禽。橫掃俯衝攻擊一整排單位，召喚狂暴影鼠群襲擊小鎮。"
  },
  boss_elder_demon: {
    id: "boss_elder_demon",
    name: "老燈籠妖",
    title: "百歲邪焰",
    isBoss: true,
    hp: 35,
    atk: 4,
    range: 2,
    move: 1,
    armor: 4,
    behavior: "boss_elder",
    desc: "墮落的古代大燈籠。噴吐幽綠妖火直擊小鎮燈籠，企圖奪取所有的光明！"
  }
};
