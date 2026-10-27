/**
 * js/data/units.js
 * Unit data, traits, skills, bonds, relics, and promotions for 燈影軍略 (v4).
 */

export const GUARDIAN_PROTOS = {
  cat_patrol: {
    id: 'cat_patrol',
    name: '墨影',
    title: '影刃劍客',
    cls: '劍客',
    clsBadge: '劍',
    richPortrait: 'assets/art/v4/por_moying_rich.webp',
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
    isLight: true,
    trait: {
      id: 'swift_shadow',
      name: '疾影',
      desc: '背擊傷害由+30%提升至+100%，且無視敵方ZOC控制領域'
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
    quote: '以身衛社稷，以智破暗夜。在暗夜裡，無人能逃過我的快劍。',
    bark: '「劍隨心動，一葉斬秋水。在暗夜裡，無人能逃過我的快劍。」',
    backstory: '原為江南名門劍客，家破後隱姓埋名浪跡天涯。身負三尺青鋒與暗夜疾行絕技，專破敵陣重圍與伏兵首領。'
  },

  lantern_crafter: {
    id: 'lantern_crafter',
    name: '燈娘 小螢',
    title: '持燈使',
    cls: '弓手',
    clsBadge: '弓',
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
      element: 'fire',
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
    clsBadge: '術',
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
    clsBadge: '醫',
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
    backstory: '隱居山野的老茶師，精通靈茶醫理，默默守護著每一位軍中將士。'
  },

  fox_maiden: {
    id: 'fox_maiden',
    name: '狐火 緋',
    title: '青丘靈狐',
    cls: '術士',
    clsBadge: '法',
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
      id: 'flame_fan_cone',
      name: '紅蓮扇炎',
      cost: 4,
      type: 'magic',
      aoe: 'cone',
      power: 16,
      element: 'fire',
      desc: '朝選定方向噴吐扇形烈焰（前方1格及次排3格扇形區域），焚滅群敵',
      bark: '「青丘妖火，扇炎燎原！」'
    },
    bark: '「迷霧不過是妖火的薪柴罷了。」',
    backstory: '身負青丘血脈的狐女，掌管淨化之火，與黑暗中的迷霧為宿敵。'
  },

  bear_guard: {
    id: 'bear_guard',
    name: '熊岳',
    title: '不動磐石',
    cls: '槍盾',
    clsBadge: '盾',
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
    backstory: '軍陣最可靠的中流砥柱，體格如山，長槍重盾固若金湯。'
  },

  crane_rider: {
    id: 'crane_rider',
    name: '鶴羽',
    title: '雲間行者',
    cls: '飛騎',
    clsBadge: '飛',
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
      id: 'crane_line_gust',
      name: '鶴鳴貫空',
      cost: 2,
      type: 'skill',
      aoe: 'line',
      lineLength: 3,
      power: 13,
      desc: '朝選定方向直線疾衝穿透3格，重創路徑上所有敵軍（對弓手+30%）',
      bark: '「雲鶴凌空，一線穿破敵陣！」'
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
    clsBadge: '騎',
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
    tacticalHint: '衝鋒+40% · 弱槍兵防線截擊',
    bark: '「踏碎凡夫的燈火！」'
  },

  shadow_archer: {
    id: 'shadow_archer',
    name: '影弓',
    title: '暗影弓手',
    cls: '弓手',
    clsBadge: '弓',
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
    tacticalHint: '山丘狙擊+20% · 近身無法反擊',
    bark: '「暗箭索命，無聲無息。」'
  },

  paper_ghost: {
    id: 'paper_ghost',
    name: '傘魂',
    title: '冥水傘妖',
    cls: '鬼魅',
    clsBadge: '鬼',
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
    tacticalHint: '水相妖體 · 免疫烈火 · 弱雷法',
    bark: '「幽雨冥冥，傘下索魂……」'
  },

  shadow_rat: {
    id: 'shadow_rat',
    name: '匿鼠',
    title: '遁影妖鼠',
    cls: '刺客',
    clsBadge: '刺',
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
    tacticalHint: '暗夜隱身 · 需燈火或近身破隱',
    bark: '「吱吱……黑暗才是我們的天下！」'
  },

  mist_shaman: {
    id: 'mist_shaman',
    name: '霧巫',
    title: '幻霧術士',
    cls: '術士',
    clsBadge: '巫',
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
    tacticalHint: '後排持續治療 · 宜優先拔除',
    bark: '「霧氣不散，靈魂不滅……」'
  },

  iron_general: {
    id: 'iron_general',
    name: '鐵將',
    title: '玄鐵巨將',
    cls: '重將',
    clsBadge: '將',
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
    tacticalHint: '正面減傷70% · 需包抄背擊或落水KO',
    bark: '「千軍萬馬，也休想撼動本將分毫！」'
  },

  mother_of_mist: {
    id: 'mother_of_mist',
    name: '霧母',
    title: '夜霧之源',
    cls: '首領',
    clsBadge: '首',
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
    tacticalHint: '群聚引發霧爆 · 宜分散陣型包抄',
    bark: '「夜色已深，沉入永恆的迷霧吧……」'
  },

  shield_guard: {
    id: 'shield_guard',
    name: '盾衛',
    title: '玄甲盾衛',
    cls: '盾衛',
    clsBadge: '盾',
    role: 'shield_guard',
    team: 'enemy',
    mov: 3,
    hp: 28,
    maxHp: 28,
    mp: 4,
    maxMp: 4,
    atk: 10,
    def: 8,
    mag: 1,
    res: 4,
    spd: 6,
    range: 1,
    flyer: false,
    trait: {
      id: 'shield_block',
      name: '鐵壁重盾',
      desc: '正面受擊傷害減免-70%；側翼受標準傷害；背擊受全額150%傷害'
    },
    tacticalHint: '正面減傷70% · 需包抄背擊或法術破防',
    bark: '「盾在陣在，休想越過半步！」',
    backstory: '身披玄鐵重甲之幽霧衛士，手持重盾結陣如山，正前刀槍不入，唯有側翼迂迴或背刺方能擊破。'
  },

  mist_sorcerer: {
    id: 'mist_sorcerer',
    name: '妖術師',
    title: '幻霧妖術師',
    cls: '術士',
    clsBadge: '術',
    role: 'sorcerer',
    team: 'enemy',
    element: 'thunder',
    mov: 3,
    hp: 20,
    maxHp: 20,
    mp: 8,
    maxMp: 8,
    atk: 5,
    def: 2,
    mag: 12,
    res: 8,
    spd: 7,
    range: [1, 2],
    flyer: false,
    trait: {
      id: 'thunder_channel',
      name: '引雷法咒',
      desc: '若我方≥2人聚集，消耗4MP引動十字雷咒造成群體法術轟擊'
    },
    tacticalHint: '十字群體雷咒 · 防低血薄，宜騎兵急襲',
    bark: '「幽冥九天，狂雷聽令！」',
    backstory: '驅策妖霧的邪異術士，精通大範圍落雷咒法，極具破壞力，需優先奔襲突擊。'
  },

  fire_archer: {
    id: 'fire_archer',
    name: '火矢隊',
    title: '赤焰弓手',
    cls: '弓手',
    clsBadge: '弓',
    role: 'fire_archer',
    element: 'fire',
    mov: 4,
    hp: 18,
    maxHp: 18,
    mp: 6,
    maxMp: 6,
    atk: 11,
    def: 3,
    mag: 4,
    res: 4,
    spd: 8,
    range: [2, 3],
    flyer: false,
    trait: {
      id: 'fire_arrows',
      name: '赤炎烈矢',
      desc: '遠程射擊；若攻擊身處森林的目標，引燃林木造成+4額外灼燒傷害'
    },
    tacticalHint: '引燃森林草木 · 近身無法反擊',
    bark: '「烈焰所至，寸草不生！」',
    backstory: '手持烈焰長弓的精銳射手，擅於引燃林木，在草木掩護之處造成重創。'
  },

  mist_scout: {
    id: 'mist_scout',
    name: '斥候',
    title: '影匿斥候',
    cls: '斥候',
    clsBadge: '斥',
    role: 'scout',
    team: 'enemy',
    mov: 5,
    hp: 16,
    maxHp: 16,
    mp: 4,
    maxMp: 4,
    atk: 12,
    def: 2,
    mag: 1,
    res: 3,
    spd: 13,
    range: 1,
    flyer: false,
    isShrouded: true,
    trait: {
      id: 'mist_shroud',
      name: '夜行遁影',
      desc: '暗夜隱身潛襲，無視前排肉盾直撲後排弱旅或燈車'
    },
    tacticalHint: '遁影潛行奇襲 · 優先狙擊後排與燈車',
    bark: '「無聲無息，暗刃穿喉！」',
    backstory: '潛伏於暗處的幽影斥候，步法輕盈無聲，專門穿透前線直刺我軍燈車與後排。'
  },

  siege_engine: {
    id: 'siege_engine',
    name: '霹靂砲車',
    title: '玄銅重砲',
    cls: '砲車',
    clsBadge: '砲',
    role: 'siege_engine',
    team: 'enemy',
    element: 'fire',
    mov: 2,
    hp: 36,
    maxHp: 36,
    mp: 6,
    maxMp: 6,
    atk: 16,
    def: 8,
    mag: 0,
    res: 4,
    spd: 4,
    range: [3, 5],
    flyer: false,
    trait: {
      id: 'siege_bombardment',
      name: '霹靂重砲',
      desc: '射程3-5格超遠程轟擊；近身1-2格為射程盲區無法攻擊或反擊，需騎兵或近戰急襲'
    },
    tacticalHint: '射程3-5格轟天落石 · 近身1-2格為盲區無反擊',
    bark: '「玄銅巨彈，崩山碎石！」',
    backstory: '守關重型霹靂投石重砲，裝填火藥雷石，能對極遠處造成毀滅打擊，但機動笨拙且近身毫無還手之力。'
  },

  citadel_warlord: {
    id: 'citadel_warlord',
    name: '鎮關將領',
    title: '雄關大將',
    cls: '主將',
    clsBadge: '帥',
    role: 'commander',
    team: 'enemy',
    mov: 3,
    hp: 42,
    maxHp: 42,
    mp: 8,
    maxMp: 8,
    atk: 16,
    def: 10,
    mag: 6,
    res: 8,
    spd: 7,
    range: 1,
    flyer: false,
    trait: {
      id: 'citadel_command',
      name: '固若金湯',
      desc: '在城樓要塞之內防禦提升；生命低於50%時召喚親衛增援'
    },
    tacticalHint: '雄關主將 · 需破城攻門或側翼飛騎突入斬首',
    bark: '「此城乃天險雄關，任爾等如何攻打也是徒勞！」',
    backstory: '鎮守關隘的百戰宿將，熟諳攻防陣列，率親衛死守關內大廳。'
  },

  curse_sorcerer: {
    id: 'curse_sorcerer',
    name: '咒禁術士',
    title: '大荒妖術師',
    cls: '術士',
    clsBadge: '術',
    role: 'curse_sorcerer',
    team: 'enemy',
    element: 'dark',
    mov: 3,
    hp: 34,
    maxHp: 34,
    mp: 10,
    maxMp: 10,
    atk: 6,
    def: 4,
    mag: 15,
    res: 10,
    spd: 8,
    range: [1, 2],
    flyer: false,
    trait: {
      id: 'curse_miasma',
      name: '幽冥咒縛',
      desc: '施展妖霧與咒縛沼澤；凡踏足咒蝕之地者移動力-1且每回合受4點侵蝕傷害；忌憚烈火焚灼與靈燈破除'
    },
    magic: {
      id: 'curse_strike',
      name: '邪穢陰雷',
      power: 14,
      cost: 4,
      range: [1, 2],
      type: 'magic',
      element: 'dark',
      desc: '召喚陰煞邪雷打擊目標，附帶咒縛減速效果',
      bark: '「陰煞聽令，邪雷破魄！」'
    },
    tacticalHint: '施展幽冥咒縛與妖霧 · 懼怕火攻燃燒與神燈照耀',
    bark: '「陰陽失序，幽冥咒縛，化為泥淖吧！」',
    backstory: '深居大荒幽澤的咒禁術士，操弄符咒陰煞，能召喚幽霧並詛咒沼澤地脈，唯有以火攻焚木或神燈法光方能破除。'
  },

  shield_phalanx: {
    id: 'shield_phalanx',
    name: '盾陣精兵',
    title: '重裝盾陣',
    cls: '盾衛',
    clsBadge: '盾',
    role: 'shield_phalanx',
    team: 'enemy',
    mov: 3,
    hp: 28,
    maxHp: 28,
    mp: 4,
    maxMp: 4,
    atk: 12,
    def: 6,
    mag: 1,
    res: 2,
    spd: 6,
    range: 1,
    flyer: false,
    trait: {
      id: 'phalanx_wall',
      name: '鐵壁盾陣',
      desc: '正面防禦近乎無敵（減免85%正面物理傷害），必須自側翼、背刺、法術或滾木破陣'
    },
    tacticalHint: '正面減傷85% · 需從側翼背刺或用法術/滾木破除',
    bark: '「盾陣合璧，固若金湯！」',
    backstory: '身披玄鐵鱗甲並持重裝大盾的正規精兵，結成盾陣時正面固若金湯，必須尋隙繞襲或用法術自高空瓦解。'
  },

  mountain_warlord: {
    id: 'mountain_warlord',
    name: '伏兵統領',
    title: '山道伏兵領袖',
    cls: '統領',
    clsBadge: '帥',
    role: 'commander',
    team: 'enemy',
    isBoss: true,
    mov: 4,
    hp: 36,
    maxHp: 36,
    mp: 8,
    maxMp: 8,
    atk: 15,
    def: 5,
    mag: 4,
    res: 4,
    spd: 10,
    range: 1,
    flyer: false,
    trait: {
      id: 'mountain_ambush_leader',
      name: '萬壑伏兵',
      desc: '山地伏擊百戰首領，統領重裝盾陣阻截要道'
    },
    skill: {
      id: 'gorge_slash',
      name: '裂谷重斬',
      power: 16,
      cost: 3,
      range: 1,
      type: 'skill',
      desc: '借地勢猛斬，重創敵陣前鋒',
      bark: '「踏入萬壑，皆為甕中之鱉！」'
    },
    tacticalHint: '伏兵統領 · 擊殺可直接瓦解敵軍士氣致其潰散',
    bark: '「萬壑松風，伏兵四起，破敵於狹道！」',
    backstory: '常年扼守山道險隘的叛軍悍將，深諳山川地形與奇兵伏擊之道。'
  }
};

export const NPC_PROTOS = {
  lantern_cart: {
    id: 'lantern_cart',
    name: '引路燈車',
    title: '輜重車',
    cls: '輜重',
    clsBadge: '車',
    role: 'npc',
    team: 'ally',
    mov: 3,
    hp: 35,
    maxHp: 35,
    mp: 0,
    maxMp: 0,
    atk: 0,
    def: 6,
    mag: 0,
    res: 6,
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
    clsBadge: '燈',
    role: 'objective',
    team: 'ally',
    mov: 0,
    hp: 30,
    maxHp: 30,
    mp: 0,
    maxMp: 0,
    atk: 0,
    def: 4,
    mag: 0,
    res: 4,
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
  { id: 'sword_yitian', name: '倚天古劍', icon: '劍', img: 'assets/art/v4/item_sword.webp', desc: '攻擊力 +4 · 暴擊率 +15%', stat: 'atk', bonus: 4, critBonus: 15 },
  { id: 'tome_taiping', name: '太平天書', icon: '書', img: 'assets/art/v4/item_tome.webp', desc: '法術力 +4 · 技力上限 +4', stat: 'mag', bonus: 4, mpBonus: 4 },
  { id: 'armor_xuanjia', name: '玄鐵明光甲', icon: '甲', img: 'assets/art/v4/item_armor.webp', desc: '防禦力 +3 · 氣血上限 +12', stat: 'def', bonus: 3, hpBonus: 12 },
  { id: 'iron_talisman', name: '鐵護符', icon: '符', img: 'assets/art/v4/item_armor.webp', desc: '防禦力 +2', stat: 'def', bonus: 2 },
  { id: 'swift_boots', name: '疾風履', icon: '履', img: 'assets/art/v4/item_sword.webp', desc: '移動力 +1', stat: 'mov', bonus: 1 },
  { id: 'spirit_jade', name: '靈心玉', icon: '玉', img: 'assets/art/v4/item_tome.webp', desc: '法術力 +3', stat: 'mag', bonus: 3 },
  { id: 'brave_crest', name: '勇者印', icon: '印', img: 'assets/art/v4/item_sword.webp', desc: '攻擊力 +3', stat: 'atk', bonus: 3 },
  { id: 'tea_leaf_pouch', name: '靈泉茶囊', icon: '囊', img: 'assets/art/v4/item_tome.webp', desc: '生命上限 +10', stat: 'maxHp', bonus: 10 }
];

export const PROMOTIONS = {
  cat_patrol: {
    newClass: '劍聖',
    statBonus: { atk: 4, maxHp: 8, mov: 1 },
    desc: '劍心通神，領悟破軍奧義',
    promotedSkill: {
      id: 'blade_tempest',
      name: '萬劍歸宗',
      cost: 3,
      type: 'skill',
      range: [1, 2],
      power: 18,
      desc: '人劍合一凝為萬道劍芒，破甲50%疾速斬殺',
      bark: '「劍心澄澈，萬劍破曉！」'
    }
  },
  lantern_crafter: {
    newClass: '連弩手',
    statBonus: { atk: 3, maxHp: 6, spd: 2, rangeMaxBonus: 1 },
    desc: '神機連發，射程與攻速突破',
    promotedSkill: {
      id: 'repeating_volley',
      name: '連弩驟雨',
      cost: 3,
      type: 'skill',
      range: [2, 4],
      power: 16,
      desc: '神機連弩疾速雙矢齊發，重創中遠程目標',
      bark: '「機弦九轉，破霧連環！」'
    }
  },
  tanuki_mage: {
    newClass: '天師',
    statBonus: { mag: 5, maxHp: 6, res: 3 },
    desc: '執掌九天雷煞，代天行罰',
    promotedSkill: {
      id: 'divine_thunder',
      name: '九天神雷',
      cost: 4,
      type: 'magic',
      element: 'thunder',
      range: 2,
      isAoE: true,
      power: 16,
      desc: '引九天紫霄神雷轟擊目標及周圍，水相目標受致命重創',
      bark: '「九天玄煞，化為神雷，疾！」'
    }
  },
  tea_master: {
    newClass: '聖手',
    statBonus: { mag: 4, maxHp: 10, def: 2 },
    desc: '靈茶濟世，體魄與治癒力增強',
    promotedSkill: {
      id: 'celestial_dew',
      name: '甘露回春',
      cost: 3,
      type: 'magic',
      range: 2,
      isHeal: true,
      power: 18,
      desc: '以千年甘露大範圍恢復友軍氣血並驅散異常',
      bark: '「潤物無聲，枯木逢春。」'
    }
  },
  fox_maiden: {
    newClass: '大妖術士',
    statBonus: { mag: 5, maxHp: 6, res: 2 },
    desc: '青丘九尾真火，焚盡群魔',
    promotedSkill: {
      id: 'nine_tailed_flame',
      name: '紅蓮妖火',
      cost: 4,
      type: 'magic',
      element: 'fire',
      range: 2,
      power: 18,
      desc: '喚出九天紅蓮業火爆裂蔓延，灼燒一切非水相目標',
      bark: '「紅蓮業火，燃盡宵小！」'
    }
  },
  bear_guard: {
    newClass: '玄甲衛領',
    statBonus: { def: 4, maxHp: 14, atk: 2 },
    desc: '金剛不壞之軀，防禦與生命巨幅提升',
    promotedSkill: {
      id: 'bastion_shield',
      name: '不動如山',
      cost: 3,
      type: 'skill',
      range: 1,
      desc: '立玄甲鐵壁，使相鄰友軍防禦+4並免疫擊退2回合',
      bark: '「俺熊岳在，誰敢越雷池半步！」'
    }
  },
  crane_rider: {
    newClass: '天行者',
    statBonus: { atk: 4, maxHp: 8, mov: 1 },
    desc: '翱翔九天之上，速度與突擊力倍增',
    promotedSkill: {
      id: 'sky_piercer',
      name: '九霄穿雲刺',
      cost: 3,
      type: 'skill',
      range: [1, 2],
      power: 17,
      desc: '自九霄雲端俯衝直刺，無視目標50%防禦',
      bark: '「凌雲破霧，一擊必殺！」'
    }
  }
};

export const STRATAGEMS = [
  { id: 'fire_attack', name: '火攻', icon: '火', desc: '第1回合向指定3×3林地/市集降下烈焰，造成10點傷害（水相無效）' },
  { id: 'ambush', name: '伏兵', icon: '伏', desc: '戰鬥開始時，一名我方隊友可直接部署於任意樹林深處' },
  { id: 'feint', name: '佯攻', icon: '計', desc: '第1回合吸引敵方騎兵朝誘餌方向移動' },
  { id: 'flood', name: '水淹', icon: '水', mapReq: 4, desc: '第4章山道專屬：引大河或山隘之水淹沒淺灘2回合，造成15點水傷並擊退陸行單位（墜水溺斃）' },
  { id: 'night_raid', name: '夜襲', icon: '夜', desc: '借夜色急襲，敵方全體第1回合無法行動' },
  { id: 'inspire', name: '鼓舞', icon: '鼓', desc: '號角齊鳴，我方全體第1與第2回合傷害提升20%' },
  { id: 'rally', name: '擂鼓', icon: '擂', desc: '擂鼓振威：全軍士氣提升25點，且統領周圍2格內友軍本回合移動力+1' },
  { id: 'cart_speed', name: '全速前進', icon: '馳', mapReq: 1, desc: '護送專屬：號令引路燈車全速前進，下回合行軍速度提升為雙倍（移動2格）' },
  { id: 'cart_hold', name: '原地待援', icon: '固', mapReq: 1, desc: '護送專屬：號令引路燈車原地固守待援，暫停行軍並強化全軍護衛' },
  { id: 'rolling_log', name: '滾木', icon: '木', mapReq: 8, desc: '第8章山道專屬：自上方滾落擂木，對整列路徑造成16點傷害並擊破盾陣' }
];

export function getClassSynergies(squad) {
  if (!squad || !squad.length) return [];
  const roles = new Set(squad.map(u => {
    if (!u) return null;
    return typeof u === 'string' ? (GUARDIAN_PROTOS[u]?.role || (u.includes('archer') ? 'archer' : null)) : (u.role || GUARDIAN_PROTOS[u.id]?.role);
  }).filter(Boolean));
  const hasFlyer = squad.some(u => {
    if (!u) return false;
    return typeof u === 'string' ? GUARDIAN_PROTOS[u]?.flyer : (u.flyer || GUARDIAN_PROTOS[u.id]?.flyer);
  });

  const synergies = [];
  if (roles.has('tank') && roles.has('healer')) {
    synergies.push({
      id: 'iron_fortress',
      name: '金湯固若',
      icon: '🛡️',
      desc: '盾醫協守 · 全軍防禦+1'
    });
  }
  if (roles.has('flanker') && (roles.has('cavalry') || hasFlyer)) {
    synergies.push({
      id: 'cavalry_coop',
      name: '步騎協同',
      icon: '⚡',
      desc: '步騎呼應 · 首回合移動+1'
    });
  }
  if (roles.has('mage') && roles.has('archer')) {
    synergies.push({
      id: 'spell_arrow',
      name: '法箭交輝',
      icon: '✦',
      desc: '法箭呼應 · 遠程傷害+10%'
    });
  }

  return synergies;
}
