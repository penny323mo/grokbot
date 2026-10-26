/**
 * js/data/units.js
 * Unit data, traits, skills, bonds, relics, and promotions for 燈影軍略 (v4).
 */

export const GUARDIAN_PROTOS = {
  cat_patrol: {
    id: 'cat_patrol',
    name: '墨影',
    title: '夜行俠客',
    cls: '劍客',
    role: 'flanker',
    team: 'ally',
    mov: 5,
    hp: 28,
    maxHp: 28,
    mp: 6,
    maxMp: 6,
    atk: 12,
    def: 5,
    mag: 3,
    res: 4,
    spd: 14,
    range: 1,
    flyer: false,
    trait: {
      id: 'swift_shadow',
      name: '疾影',
      desc: '背擊傷害由+50%倍增至+100%，且不受反擊'
    },
    skill: {
      id: 'shadow_strike',
      name: '影步突刺',
      cost: 2,
      type: 'skill',
      range: 1,
      power: 14,
      desc: '疾速出鞘突襲，造成高額物理傷害',
      bark: '「夜色之中，唯吾刀鋒最利！」'
    },
    magic: {
      id: 'smoke_screen',
      name: '障目煙幕',
      cost: 3,
      type: 'magic',
      range: 2,
      desc: '投擲迷煙，使目標防禦-3並提升自身迴避',
      bark: '「捉摸不透，方為刺客之道。」'
    },
    bark: '「刀已在手，迷霧盡散！」',
    backstory: '巡夜客中的獨行俠，身手矯健，習慣於暗處一擊制敵。'
  },

  lantern_crafter: {
    id: 'lantern_crafter',
    name: '燈娘 小螢',
    title: '持燈使',
    cls: '弓手',
    role: 'archer',
    team: 'ally',
    mov: 4,
    hp: 22,
    maxHp: 22,
    mp: 6,
    maxMp: 6,
    atk: 11,
    def: 3,
    mag: 6,
    res: 6,
    spd: 10,
    range: [2, 3],
    flyer: false,
    trait: {
      id: 'hang_lantern',
      name: '掛燈',
      desc: '可於指定格子置放引魂燈，照亮半徑2格破除匿霧，持續3回合'
    },
    skill: {
      id: 'place_lantern',
      name: '引魂明燈',
      cost: 2,
      type: 'skill',
      range: 3,
      isLightPlacement: true,
      desc: '在3格內放置一盞靈燈，照亮周圍2格破除匿霧3回合',
      bark: '「燈火所及，宵小無所遁形！」'
    },
    magic: {
      id: 'radiant_arrow',
      name: '破煞靈矢',
      cost: 3,
      type: 'magic',
      range: [2, 3],
      power: 12,
      desc: '射出一記凝聚燈火的破煞靈矢，無視目標地形防禦',
      bark: '「一點靈光，洞穿迷障！」'
    },
    bark: '「長夜漫漫，有燈便有光。」',
    backstory: '傳承古法燈籠製作的少女，能將靈火注入燈中破霧。'
  },

  tanuki_mage: {
    id: 'tanuki_mage',
    name: '雷狸',
    title: '引雷靈狸',
    cls: '術士',
    role: 'mage',
    team: 'ally',
    mov: 4,
    hp: 20,
    maxHp: 20,
    mp: 8,
    maxMp: 8,
    atk: 5,
    def: 3,
    mag: 13,
    res: 8,
    spd: 9,
    range: 2,
    flyer: false,
    trait: {
      id: 'chain_lightning',
      name: '連雷',
      desc: '雷擊可連鎖至相鄰敵人；對水相敵人傷害×2'
    },
    skill: {
      id: 'thunder_spark',
      name: '天雷掣電',
      cost: 3,
      type: 'skill',
      range: 2,
      power: 14,
      element: 'thunder',
      chains: true,
      desc: '召喚天雷轟擊目標，連鎖相鄰敵軍（水相×2）',
      bark: '「嘗嘗狸爺爺的連環天雷炸頂！」'
    },
    magic: {
      id: 'static_burst',
      name: '聚靈雷暴',
      cost: 4,
      type: 'magic',
      range: 2,
      power: 16,
      element: 'thunder',
      desc: '凝聚雷霆引發猛烈雷暴，克制水相靈怪',
      bark: '「九天神雷，奉我敕令！」'
    },
    bark: '「雷鳴響徹之時，群妖灰飛煙滅！」',
    backstory: '山林中修煉百年的雷靈狸，脾氣火爆但嫉惡如仇。'
  },

  tea_master: {
    id: 'tea_master',
    name: '茶翁',
    title: '靜心老泉',
    cls: '醫師',
    role: 'healer',
    team: 'ally',
    mov: 4,
    hp: 26,
    maxHp: 26,
    mp: 8,
    maxMp: 8,
    atk: 6,
    def: 6,
    mag: 10,
    res: 9,
    spd: 7,
    range: 1,
    flyer: false,
    trait: {
      id: 'soothing_tea',
      name: '清心茶',
      desc: '2格範圍治療隊友並清除異常狀態'
    },
    skill: {
      id: 'healing_brew',
      name: '回春靈茶',
      cost: 2,
      type: 'skill',
      range: 2,
      heal: 14,
      isHeal: true,
      desc: '為2格內一名受傷隊友奉上溫潤靈茶，回復生命',
      bark: '「喝啖熱茶，定心方能守正。」'
    },
    magic: {
      id: 'tea_barrier',
      name: '茶甘靈露',
      cost: 3,
      type: 'magic',
      range: 2,
      heal: 18,
      isHeal: true,
      desc: '灑落甘泉靈露，治癒隊友並提升其防禦+2持續2回合',
      bark: '「甘露潤心，安神定魄。」'
    },
    bark: '「老夫這壺茶，可愈筋骨，亦可醒神。」',
    backstory: '隱居小鎮的老茶師，精通靈茶醫理，默默守護著每一位守夜人。'
  },

  fox_maiden: {
    id: 'fox_maiden',
    name: '狐火 緋',
    title: '青丘靈狐',
    cls: '術士',
    role: 'mage_aoe',
    team: 'ally',
    mov: 4,
    hp: 21,
    maxHp: 21,
    mp: 8,
    maxMp: 8,
    atk: 5,
    def: 3,
    mag: 14,
    res: 7,
    spd: 11,
    range: 2,
    flyer: false,
    trait: {
      id: 'fox_fire',
      name: '狐火',
      desc: '十字範圍烈火沖天；但烈火對水相敵人無效（傷害×0）'
    },
    skill: {
      id: 'flame_cross',
      name: '狐火焚霧',
      cost: 3,
      type: 'skill',
      range: 2,
      power: 13,
      aoe: 'cross',
      element: 'fire',
      desc: '釋放十字蔓延妖火，重創非水相聚攏敵群',
      bark: '「狐火燃盡之處，霧靄皆化灰燼！」'
    },
    magic: {
      id: 'crimson_lotus',
      name: '紅蓮妖焰',
      cost: 4,
      type: 'magic',
      range: 2,
      power: 16,
      aoe: 'cross',
      element: 'fire',
      desc: '召喚盛開的紅蓮烈火，焚盡十字範圍內的一切',
      bark: '「紅蓮盛放，夜霧無存！」'
    },
    bark: '「迷霧不過是妖火的薪柴罷了。」',
    backstory: '身負青丘血脈的狐女，掌管淨化之火，與黑暗中的迷霧為宿敵。'
  },

  bear_guard: {
    id: 'bear_guard',
    name: '熊岳',
    title: '不動磐石',
    cls: '槍盾',
    role: 'tank',
    team: 'ally',
    mov: 3,
    hp: 36,
    maxHp: 36,
    mp: 6,
    maxMp: 6,
    atk: 11,
    def: 10,
    mag: 2,
    res: 4,
    spd: 6,
    range: 1,
    flyer: false,
    trait: {
      id: 'spear_wall',
      name: '槍林',
      desc: '阻截領域(ZOC)：騎兵進入相鄰格子立即止步並受一次截擊傷害'
    },
    skill: {
      id: 'shield_push',
      name: '巨盾推擊',
      cost: 2,
      type: 'skill',
      range: 1,
      power: 11,
      knockback: 1,
      desc: '重盾猛推擊退目標1格（若落水則直接溺斃KO！）',
      bark: '「給俺退開！滾進河裡去吧！」'
    },
    magic: {
      id: 'stone_fortress',
      name: '鐵壁之陣',
      cost: 3,
      type: 'magic',
      range: 0,
      selfBuff: { def: 4, duration: 2 },
      desc: '重盾插地，自身防禦大幅提升+4持續2回合',
      bark: '「想過此道，先踏過俺這面鐵盾！」'
    },
    bark: '「俺熊岳在此，誰也休想寸進！」',
    backstory: '小鎮最可靠的守護者，體格如山，長槍重盾固若金湯。'
  },

  crane_rider: {
    id: 'crane_rider',
    name: '鶴羽',
    title: '雲間行者',
    cls: '飛騎',
    role: 'flyer',
    team: 'ally',
    mov: 6,
    hp: 24,
    maxHp: 24,
    mp: 6,
    maxMp: 6,
    atk: 12,
    def: 4,
    mag: 5,
    res: 6,
    spd: 13,
    range: 1,
    flyer: true,
    trait: {
      id: 'sky_dive',
      name: '俯衝',
      desc: '無視所有地形阻礙；對弓手部隊造成+30%額外剋制傷害'
    },
    skill: {
      id: 'crane_plunge',
      name: '雲鶴破空',
      cost: 2,
      type: 'skill',
      range: 1,
      power: 13,
      desc: '自九天之上疾速俯衝，重創地面敵人（對弓手+30%）',
      bark: '「九霄清風，隨我疾行！」'
    },
    magic: {
      id: 'feather_storm',
      name: '翎羽罡風',
      cost: 3,
      type: 'magic',
      range: 2,
      power: 11,
      desc: '雙翼掀起銳利罡風刃，進行2格遠程切割',
      bark: '「風隨翎動，破敵如剪！」'
    },
    bark: '「俯瞰大地，敵蹤一覽無餘。」',
    backstory: '騎乘仙鶴穿梭於群山之巔的信使，俯瞰全場，來去無痕。'
  }
};

export const ENEMY_PROTOS = {
  fog_rider: {
    id: 'fog_rider',
    name: '霧騎',
    title: '迷霧疾騎',
    cls: '騎兵',
    role: 'cavalry',
    team: 'enemy',
    mov: 6,
    hp: 22,
    maxHp: 22,
    mp: 4,
    maxMp: 4,
    atk: 12,
    def: 4,
    mag: 1,
    res: 3,
    spd: 11,
    range: 1,
    flyer: false,
    trait: {
      id: 'cavalry_charge',
      name: '疾馳',
      desc: '移動≥3格後發動衝鋒，造成+40%衝鋒傷害'
    },
    bark: '「踏碎凡夫的燈火！」'
  },

  shadow_archer: {
    id: 'shadow_archer',
    name: '影弓',
    title: '暗影弓手',
    cls: '弓手',
    role: 'archer',
    team: 'enemy',
    mov: 4,
    hp: 18,
    maxHp: 18,
    mp: 4,
    maxMp: 4,
    atk: 10,
    def: 3,
    mag: 3,
    res: 4,
    spd: 9,
    range: [2, 3],
    flyer: false,
    trait: {
      id: 'high_ground_snipe',
      name: '高處狙擊',
      desc: '偏好佔領山丘制高點，山丘上射程+1且傷害+20%'
    },
    bark: '「暗箭索命，無聲無息。」'
  },

  paper_ghost: {
    id: 'paper_ghost',
    name: '傘魂',
    title: '冥水傘妖',
    cls: '鬼魅',
    role: 'spirit',
    team: 'enemy',
    mov: 4,
    hp: 20,
    maxHp: 20,
    mp: 6,
    maxMp: 6,
    atk: 9,
    def: 2,
    mag: 11,
    res: 8,
    spd: 10,
    range: 1,
    flyer: false,
    element: 'water',
    trait: {
      id: 'water_spirit',
      name: '水相妖身',
      desc: '水相幽體：烈火傷害×0（完全免疫），但雷系傷害×2'
    },
    bark: '「幽雨冥冥，傘下索魂……」'
  },

  shadow_rat: {
    id: 'shadow_rat',
    name: '匿鼠',
    title: '遁影妖鼠',
    cls: '刺客',
    role: 'shrouded',
    team: 'enemy',
    mov: 4,
    hp: 16,
    maxHp: 16,
    mp: 4,
    maxMp: 4,
    atk: 13,
    def: 2,
    mag: 2,
    res: 3,
    spd: 12,
    range: 1,
    flyer: false,
    isShrouded: true,
    trait: {
      id: 'mist_shroud',
      name: '匿霧',
      desc: '遁入霧中隱身，除非位於燈光半徑2格內或相鄰格，否則無法被鎖定攻擊'
    },
    bark: '「吱吱……黑暗才是我們的天下！」'
  },

  mist_shaman: {
    id: 'mist_shaman',
    name: '霧巫',
    title: '幻霧術士',
    cls: '術士',
    role: 'healer',
    team: 'enemy',
    mov: 3,
    hp: 22,
    maxHp: 22,
    mp: 8,
    maxMp: 8,
    atk: 4,
    def: 3,
    mag: 9,
    res: 7,
    spd: 6,
    range: 2,
    flyer: false,
    trait: {
      id: 'mist_healing',
      name: '霧療',
      desc: '為3格內血量最低的友軍回復8點生命，常居於後排'
    },
    bark: '「霧氣不散，靈魂不滅……」'
  },

  iron_general: {
    id: 'iron_general',
    name: '鐵將',
    title: '玄鐵巨將',
    cls: '重將',
    role: 'commander',
    team: 'enemy',
    mov: 3,
    hp: 45,
    maxHp: 45,
    mp: 6,
    maxMp: 6,
    atk: 14,
    def: 12,
    mag: 4,
    res: 6,
    spd: 5,
    range: 1,
    flyer: false,
    trait: {
      id: 'iron_shield_wall',
      name: '鐵壁盾',
      desc: '正面受擊傷害減免-70%；背擊受全額傷害；若在橋上被推落水即溺亡'
    },
    bark: '「千軍萬馬，也休想撼動本將分毫！」'
  },

  mother_of_mist: {
    id: 'mother_of_mist',
    name: '霧母',
    title: '夜霧之源',
    cls: '首領',
    role: 'boss',
    team: 'enemy',
    mov: 3,
    hp: 60,
    maxHp: 60,
    mp: 12,
    maxMp: 12,
    atk: 13,
    def: 8,
    mag: 15,
    res: 10,
    spd: 8,
    range: 2,
    flyer: false,
    trait: {
      id: 'abyssal_mist',
      name: '迷霧降臨',
      desc: '若敵軍有≥2人聚集，將引發大範圍霧爆，造成10點群體法術傷害'
    },
    bark: '「夜色已深，沉入永恆的迷霧吧……」'
  }
};

export const NPC_PROTOS = {
  lantern_cart: {
    id: 'lantern_cart',
    name: '引路燈車',
    title: '輜重車',
    cls: '輜重',
    role: 'npc',
    team: 'ally',
    mov: 3,
    hp: 25,
    maxHp: 25,
    mp: 0,
    maxMp: 0,
    atk: 0,
    def: 4,
    mag: 0,
    res: 4,
    spd: 5,
    range: 0,
    flyer: false,
    trait: {
      id: 'cart_escort',
      name: '護送目標',
      desc: '必須在12回合內平安抵達橋頭彼岸，不可被毀'
    },
    bark: '「咕嚕嚕……燈車正穩步前進。」'
  },

  market_lantern: {
    id: 'market_lantern',
    name: '鎮心神燈',
    title: '鎮街神柱',
    cls: '建築',
    role: 'objective',
    team: 'ally',
    mov: 0,
    hp: 30,
    maxHp: 30,
    mp: 0,
    maxMp: 0,
    atk: 0,
    def: 6,
    mag: 0,
    res: 6,
    spd: 0,
    range: 0,
    flyer: false,
    trait: {
      id: 'lantern_pillar',
      name: '長夜明燈',
      desc: '照亮市集核心，需堅守10回合免遭敵軍擊破'
    },
    bark: '「神燈光芒長明不息。」'
  }
};

export const BOND_PAIRS = [
  {
    pair: ['cat_patrol', 'lantern_crafter'],
    name: '影燈',
    desc: '相鄰時解鎖合擊：燈娘引光照亮弱點，墨影發動一次免費協同突刺（每戰限1次）'
  },
  {
    pair: ['tanuki_mage', 'fox_maiden'],
    name: '雷火',
    desc: '相鄰時解鎖合擊：雷火交加引發巨爆，對目標造成強烈混合法術打擊（每戰限1次）'
  },
  {
    pair: ['bear_guard', 'tea_master'],
    name: '山泉',
    desc: '相鄰時解鎖合擊：磐石巨盾震擊敵人，同時茶翁甘露恢復雙方生命（每戰限1次）'
  }
];

export const RELICS = [
  { id: 'iron_talisman', name: '鐵護符', icon: '符', desc: '防禦力 +2', stat: 'def', bonus: 2 },
  { id: 'swift_boots', name: '疾風履', icon: '履', desc: '移動力 +1', stat: 'mov', bonus: 1 },
  { id: 'spirit_jade', name: '靈心玉', icon: '玉', desc: '法術力 +3', stat: 'mag', bonus: 3 },
  { id: 'brave_crest', name: '勇者印', icon: '印', desc: '攻擊力 +3', stat: 'atk', bonus: 3 },
  { id: 'tea_leaf_pouch', name: '靈泉茶囊', icon: '囊', desc: '生命上限 +10', stat: 'maxHp', bonus: 10 }
];

export const PROMOTIONS = {
  cat_patrol: { newClass: '劍豪', statBonus: { atk: 3, maxHp: 6, mov: 1 }, desc: '劍術臻至化境，移動與攻擊提升' },
  lantern_crafter: { newClass: '神射手', statBonus: { atk: 3, maxHp: 5, rangeMaxBonus: 1 }, desc: '凝燈引弓，射程與傷害提升' },
  tanuki_mage: { newClass: '策士', statBonus: { mag: 4, maxHp: 5, res: 2 }, desc: '精通天地雷法，法術力大幅提高' },
  tea_master: { newClass: '聖手', statBonus: { mag: 3, maxHp: 8, def: 2 }, desc: '靈茶濟世，體魄與治癒力增強' },
  fox_maiden: { newClass: '大妖術士', statBonus: { mag: 4, maxHp: 5, res: 2 }, desc: '青丘九尾真火，焚盡群魔' },
  bear_guard: { newClass: '金甲將', statBonus: { def: 4, maxHp: 12, atk: 2 }, desc: '金剛不壞之軀，防禦與生命巨幅提升' },
  crane_rider: { newClass: '天行者', statBonus: { atk: 3, maxHp: 6, mov: 1 }, desc: '翱翔九天之上，速度與突擊力倍增' }
};

export const STRATAGEMS = [
  { id: 'fire_attack', name: '火攻', icon: '火', desc: '第1回合向指定3×3林地/市集降下烈焰，造成10點傷害（水相無效）' },
  { id: 'ambush', name: '伏兵', icon: '伏', desc: '戰鬥開始時，一名我方隊友可直接部署於任意樹林深處' },
  { id: 'feint', name: '佯攻', icon: '計', desc: '第1回合吸引敵方騎兵朝誘餌方向移動' },
  { id: 'flood', name: '水淹', icon: '水', mapReq: 4, desc: '【僅第4關可用】決堤放水，沖淹下方低窪道路，對row≥9單位造成15點傷害' },
  { id: 'night_raid', name: '夜襲', icon: '夜', desc: '借夜色急襲，敵方全體第1回合無法行動' },
  { id: 'inspire', name: '鼓舞', icon: '鼓', desc: '號角齊鳴，我方全體第1與第2回合傷害提升20%' }
];
