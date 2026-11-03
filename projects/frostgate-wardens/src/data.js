// Game Data, Towers, Enemies, Waves, Cantonese Dialogues

export const PALETTE = {
    ice: '#DDEBF2',
    glacierTeal: '#2F8F9D',
    deepIndigo: '#1B2447',
    slateBlue: '#46608A',
    firGreen: '#2D5A4A',
    stone: '#B9AE9C',
    roadGold: '#D9B87A',
    saffron: '#E8B04A',
    emberCoral: '#E2563A',
    ivory: '#F4EFE2',
    ink: '#14183A'
};

export const TOWERS = {
    crossbow: {
        id: 'crossbow',
        name: '弩塔',
        desc: '射速快，對空對地皆可',
        icon: 'assets/towers/crossbow_1.png',
        cost: 100,
        targetsAir: true,
        targetsGround: true,
        levels: {
            1: {
                name: '輕型弩塔',
                sprite: 'assets/towers/crossbow_1.png',
                damage: 18,
                range: 190,
                rate: 0.8, // seconds per attack
                cost: 100,
                upgradeCost: 80,
                desc: '單發精準箭弩'
            },
            2: {
                name: '重弦弩塔',
                sprite: 'assets/towers/crossbow_2.png',
                damage: 34,
                range: 215,
                rate: 0.7,
                upgradeCost: 140,
                branches: ['3a', '3b'],
                desc: '雙聯加固弩弦，威力倍增'
            },
            '3a': {
                name: '破甲巨弩',
                sprite: 'assets/towers/crossbow_3a.png',
                branchName: '穿甲',
                damage: 75,
                range: 240,
                rate: 0.75,
                pierceArmor: 0.5, // ignores 50% armor
                desc: '寒鐵破甲弩箭，穿透厚重護甲'
            },
            '3b': {
                name: '連發連弩',
                sprite: 'assets/towers/crossbow_3b.png',
                branchName: '連弩',
                damage: 28,
                burst: 3, // 3 rapid bolts
                range: 205,
                rate: 0.6,
                desc: '三聯機關箭匣，暴雨般密集打擊'
            }
        }
    },
    mortar: {
        id: 'mortar',
        name: '石炮',
        desc: '範圍重擊，僅限地面',
        icon: 'assets/towers/mortar_1.png',
        cost: 125,
        targetsAir: false,
        targetsGround: true,
        levels: {
            1: {
                name: '臼式石炮',
                sprite: 'assets/towers/mortar_1.png',
                damage: 48,
                splash: 85,
                range: 220,
                rate: 2.2,
                cost: 125,
                upgradeCost: 95,
                desc: '投擲巨石，對群體造成範圍衝擊'
            },
            2: {
                name: '鋼箍重炮',
                sprite: 'assets/towers/mortar_2.png',
                damage: 88,
                splash: 110,
                range: 245,
                rate: 2.0,
                upgradeCost: 160,
                branches: ['3a', '3b'],
                desc: '矮人工藝加固，爆炸範圍更廣'
            },
            '3a': {
                name: '巨石震地炮',
                sprite: 'assets/towers/mortar_3a.png',
                branchName: '巨石',
                damage: 195,
                splash: 140,
                range: 260,
                rate: 2.4,
                stun: 0.8, // 0.8s ground stun
                desc: '發射崩山巨石，短暫震暈地面敵人'
            },
            '3b': {
                name: '碎裂霰彈炮',
                sprite: 'assets/towers/mortar_3b.png',
                branchName: '碎裂',
                damage: 70,
                clusterCount: 4, // 4 sub-munitions of 35 dmg
                clusterDmg: 35,
                splash: 100,
                range: 235,
                rate: 1.85,
                desc: '爆裂彈片四濺，覆蓋整片路徑'
            }
        }
    },
    frost: {
        id: 'frost',
        name: '霜晶塔',
        desc: '減速冰凍，連鎖傳導',
        icon: 'assets/towers/frost_1.png',
        cost: 110,
        targetsAir: true,
        targetsGround: true,
        levels: {
            1: {
                name: '凝霜方尖碑',
                sprite: 'assets/towers/frost_1.png',
                damage: 14,
                slow: 0.35, // 35% slow
                slowDuration: 2.5,
                range: 175,
                rate: 1.2,
                cost: 110,
                upgradeCost: 85,
                desc: '懸浮霜晶，大幅減緩路過敵人'
            },
            2: {
                name: '環冰連鎖塔',
                sprite: 'assets/towers/frost_2.png',
                damage: 28,
                slow: 0.45,
                slowDuration: 3.0,
                chain: 2, // chains to 2 extra targets
                range: 195,
                rate: 1.1,
                upgradeCost: 150,
                branches: ['3a', '3b'],
                desc: '三枚冰刃環繞，減速傳導至周圍'
            },
            '3a': {
                name: '極寒冰封柱',
                sprite: 'assets/towers/frost_3a.png',
                branchName: '凍結',
                damage: 55,
                slow: 0.60,
                slowDuration: 3.5,
                freezeChance: 0.35, // 35% chance 1.5s freeze
                range: 215,
                rate: 1.15,
                desc: '極度低溫，有機會直接冰封目標'
            },
            '3b': {
                name: '寒潮雪蓮塔',
                sprite: 'assets/towers/frost_3b.png',
                branchName: '寒潮',
                damage: 32,
                auraDps: 28, // continuous aura damage
                auraSlow: 0.45,
                range: 220,
                rate: 0.9,
                desc: '展開冰蓮光環，持續灼寒範圍內所有敵人'
            }
        }
    },
    guard: {
        id: 'guard',
        name: '守衛營',
        desc: '派出守衛，阻截死鬥',
        icon: 'assets/towers/guard_1.png',
        cost: 90,
        targetsAir: false,
        targetsGround: true,
        levels: {
            1: {
                name: '前哨營',
                sprite: 'assets/towers/guard_1.png',
                guardCount: 2,
                guardHp: 130,
                guardAtk: 12,
                respawnTime: 10,
                range: 160,
                cost: 90,
                upgradeCost: 75,
                desc: '派出2名冰川守衛在路上攔截肉搏'
            },
            2: {
                name: '石砦軍營',
                sprite: 'assets/towers/guard_2.png',
                guardCount: 3,
                guardHp: 220,
                guardAtk: 20,
                respawnTime: 8,
                range: 180,
                upgradeCost: 130,
                branches: ['3a', '3b'],
                desc: '編制增至3名守衛，裝甲與耐力提升'
            },
            '3a': {
                name: '鐵壁堡壘',
                sprite: 'assets/towers/guard_3a.png',
                branchName: '盾衛',
                guardCount: 3,
                guardHp: 480,
                guardAtk: 24,
                blockDamage: 0.4, // blocks 40% incoming damage
                respawnTime: 7,
                range: 190,
                desc: '手持巨型塔盾，極強生存阻截能力'
            },
            '3b': {
                name: '長槍突擊營',
                sprite: 'assets/towers/guard_3b.png',
                branchName: '長槍',
                guardCount: 3,
                guardHp: 300,
                guardAtk: 48,
                bleed: 15,
                respawnTime: 7,
                range: 190,
                desc: '精銳長矛手，高額近戰刺擊破甲'
            }
        }
    },
    bell: {
        id: 'bell',
        name: '戰鐘塔',
        desc: '全體增益，鐘聲震眩',
        icon: 'assets/towers/bell_1.png',
        cost: 115,
        targetsAir: false,
        targetsGround: false,
        levels: {
            1: {
                name: '青銅鐘樓',
                sprite: 'assets/towers/bell_1.png',
                buffDamage: 0.15, // +15% damage to nearby towers
                buffRate: 0.10,   // +10% attack rate
                stunInterval: 12.0,
                stunDuration: 1.0,
                range: 210,
                cost: 115,
                upgradeCost: 90,
                desc: '鐘鳴激勵友軍塔樓，週期性震暈敵人'
            },
            2: {
                name: '符文共鳴鐘',
                sprite: 'assets/towers/bell_2.png',
                buffDamage: 0.25,
                buffRate: 0.15,
                stunInterval: 10.0,
                stunDuration: 1.5,
                range: 230,
                upgradeCost: 155,
                branches: ['3a', '3b'],
                desc: '增益幅度顯著提升，鐘鳴震懾更持久'
            },
            '3a': {
                name: '帝皇號令鐘',
                sprite: 'assets/towers/bell_3a.png',
                branchName: '號令',
                buffDamage: 0.40,
                buffRate: 0.25,
                buffRange: 0.15,
                stunInterval: 9.0,
                stunDuration: 1.5,
                range: 260,
                desc: '極限激發周圍所有守護塔戰鬥潛能'
            },
            '3b': {
                name: '音爆震魄塔',
                sprite: 'assets/towers/bell_3b.png',
                branchName: '震鐘',
                buffDamage: 0.20,
                stunInterval: 7.0,
                stunDuration: 2.2,
                shockDmg: 90, // sonic blast deals 90 damage
                range: 240,
                desc: '強烈聲波衝擊，造成高額震傷與大範圍眩暈'
            }
        }
    }
};

export const ENEMIES = {
    runner: {
        id: 'runner',
        name: '焰兵',
        tag: '快速',
        sprite: 'assets/enemies/runner_0.png',
        spriteWalk: [
            'assets/enemies/runner_0.png',
            'assets/enemies/runner_1.png',
            'assets/enemies/runner_2.png',
            'assets/enemies/runner_3.png'
        ],
        hp: 65,
        speed: 82, // pixels / sec
        armor: 0,
        gold: 8,
        leakDamage: 1,
        isAir: false,
        size: 26,
        desc: '敏捷的焰裔斥候，步伐急促'
    },
    armoured: {
        id: 'armoured',
        name: '盾兵',
        tag: '裝甲',
        sprite: 'assets/enemies/armoured_0.png',
        spriteWalk: [
            'assets/enemies/armoured_0.png',
            'assets/enemies/armoured_1.png',
            'assets/enemies/armoured_2.png',
            'assets/enemies/armoured_3.png'
        ],
        hp: 175,
        speed: 48,
        armor: 0.45, // 45% physical reduction
        gold: 15,
        leakDamage: 2,
        isAir: false,
        size: 32,
        desc: '持黑曜石巨盾，大幅抵擋物理傷害'
    },
    tank: {
        id: 'tank',
        name: '岩巨人',
        tag: '重型',
        sprite: 'assets/enemies/tank_0.png',
        spriteWalk: [
            'assets/enemies/tank_0.png',
            'assets/enemies/tank_1.png',
            'assets/enemies/tank_2.png',
            'assets/enemies/tank_3.png'
        ],
        hp: 520,
        speed: 32,
        armor: 0.30,
        gold: 36,
        leakDamage: 3,
        isAir: false,
        size: 42,
        desc: '玄武岩身軀包裹熔岩，生命頑強'
    },
    flyer: {
        id: 'flyer',
        name: '烈焰飛龍',
        tag: '飛行',
        sprite: 'assets/enemies/flyer_0.png',
        spriteWalk: [
            'assets/enemies/flyer_0.png',
            'assets/enemies/flyer_1.png',
            'assets/enemies/flyer_2.png',
            'assets/enemies/flyer_3.png'
        ],
        hp: 135,
        speed: 78,
        armor: 0.10,
        gold: 20,
        leakDamage: 1,
        isAir: true,
        size: 34,
        desc: '烈焰龍翼凌空翺翔，無視路面阻截'
    },
    healer: {
        id: 'healer',
        name: '薩滿',
        tag: '治療',
        sprite: 'assets/enemies/healer_0.png',
        spriteWalk: [
            'assets/enemies/healer_0.png',
            'assets/enemies/healer_1.png',
            'assets/enemies/healer_2.png',
            'assets/enemies/healer_3.png'
        ],
        hp: 160,
        speed: 46,
        armor: 0.15,
        gold: 24,
        leakDamage: 2,
        isAir: false,
        healRadius: 90,
        healDps: 22,
        size: 32,
        desc: '持烈焰法杖，週期性治癒周遭友軍'
    },
    swarm: {
        id: 'swarm',
        name: '爆燃蟲',
        tag: '蟲群',
        sprite: 'assets/enemies/swarm_0.png',
        spriteWalk: [
            'assets/enemies/swarm_0.png',
            'assets/enemies/swarm_1.png',
            'assets/enemies/swarm_2.png',
            'assets/enemies/swarm_3.png'
        ],
        hp: 38,
        speed: 98,
        armor: 0,
        gold: 5,
        leakDamage: 1,
        isAir: false,
        size: 22,
        desc: '體型微小，集群衝鋒，行動極其迅速'
    },
    fast: {
        id: 'fast',
        name: '隱匿者',
        tag: '疾行',
        sprite: 'assets/enemies/fast_0.png',
        spriteWalk: [
            'assets/enemies/fast_0.png',
            'assets/enemies/fast_1.png',
            'assets/enemies/fast_2.png',
            'assets/enemies/fast_3.png'
        ],
        hp: 95,
        speed: 115,
        armor: 0.20,
        gold: 14,
        leakDamage: 1,
        isAir: false,
        size: 28,
        desc: '幽影疾行，步伐如風難以鎖定'
    },
    // Region Bosses
    boss_1: {
        id: 'boss_1',
        name: '熔核督軍',
        tag: '頭目',
        sprite: 'assets/bosses/boss_1.png',
        spriteWalk: [
            'assets/bosses/boss_1_0.png',
            'assets/bosses/boss_1_1.png',
            'assets/bosses/boss_1_2.png',
            'assets/bosses/boss_1_3.png'
        ],
        hp: 2000,
        speed: 28,
        armor: 0.35,
        gold: 150,
        leakDamage: 6,
        isAir: false,
        size: 52,
        desc: '第1區域頭目：揮舞雙柄烈焰重刃'
    },
    boss_2: {
        id: 'boss_2',
        name: '霜翼叛將',
        tag: '頭目',
        sprite: 'assets/bosses/boss_2.png',
        spriteWalk: [
            'assets/bosses/boss_2_0.png',
            'assets/bosses/boss_2_1.png',
            'assets/bosses/boss_2_2.png',
            'assets/bosses/boss_2_3.png'
        ],
        hp: 2500,
        speed: 34,
        armor: 0.35,
        gold: 175,
        leakDamage: 6,
        isAir: false,
        size: 54,
        desc: '第2區域頭目：寒刃與冰翼交織之背叛者'
    },
    boss_3: {
        id: 'boss_3',
        name: '烈石狂獸',
        tag: '頭目',
        sprite: 'assets/bosses/boss_3.png',
        spriteWalk: [
            'assets/bosses/boss_3_0.png',
            'assets/bosses/boss_3_1.png',
            'assets/bosses/boss_3_2.png',
            'assets/bosses/boss_3_3.png'
        ],
        hp: 3500,
        speed: 24,
        armor: 0.50,
        gold: 210,
        leakDamage: 7,
        isAir: false,
        size: 60,
        desc: '第3區域頭目：山崩地裂之四足巨獸'
    },
    boss_4: {
        id: 'boss_4',
        name: '炎煞巫祖',
        tag: '頭目',
        sprite: 'assets/bosses/boss_4.png',
        spriteWalk: [
            'assets/bosses/boss_4_0.png',
            'assets/bosses/boss_4_1.png',
            'assets/bosses/boss_4_2.png',
            'assets/bosses/boss_4_3.png'
        ],
        hp: 4200,
        speed: 30,
        armor: 0.30,
        gold: 250,
        leakDamage: 7,
        isAir: false,
        size: 56,
        desc: '第4區域頭目：召喚幽火的大巫祖'
    },
    boss_5: {
        id: 'boss_5',
        name: '終焉炎魔',
        tag: '終極頭目',
        sprite: 'assets/bosses/boss_5.png',
        spriteWalk: [
            'assets/bosses/boss_5_0.png',
            'assets/bosses/boss_5_1.png',
            'assets/bosses/boss_5_2.png',
            'assets/bosses/boss_5_3.png'
        ],
        hp: 6000,
        speed: 25,
        armor: 0.45,
        gold: 350,
        leakDamage: 8,
        isAir: false,
        size: 66,
        desc: '第5區域最終頭目：毀滅萬物的熔岩炎魔'
    }
};

export const HERO = {
    name: '艾瑞卡',
    title: '霜衛長',
    sprite: 'assets/hero/hero_0.png',
    spriteWalk: [
        'assets/hero/hero_0.png',
        'assets/hero/hero_1.png',
        'assets/hero/hero_2.png',
        'assets/hero/hero_3.png'
    ],
    hp: 850,
    atk: 38,
    speed: 75,
    attackRate: 1.0,
    range: 55,
    abilities: [
        {
            id: 'blizzard',
            name: '暴雪',
            desc: '大範圍冰暴，減速70%並持續造成傷害',
            cost: 45,
            cooldown: 18,
            radius: 140,
            duration: 6.0,
            dps: 28,
            slow: 0.70
        },
        {
            id: 'reinforcements',
            name: '援軍',
            desc: '在指定路面召集3名霜門禁衛攔截',
            cost: 30,
            cooldown: 15,
            radius: 70,
            duration: 22.0,
            guardCount: 3,
            guardHp: 200,
            guardAtk: 22
        },
        {
            id: 'beacon',
            name: '烽火',
            desc: '召喚天頂寒霜射線，造成巨額轟擊並修補3點城堡耐久',
            cost: 60,
            cooldown: 25,
            radius: 110,
            burstDamage: 260,
            castleHeal: 3
        }
    ],
    barks: [
        "霜門由我守！",
        "叫我做咩？即刻到！",
        "風雪喺我矛尖起舞！",
        "焰裔想過？問過我支長旗矛先啦。",
        "守好每一寸冰道！",
        "嚟呀，睇下係你嘅火烈定我嘅霜寒！"
    ]
};

// Region 1: 霜門山道 (2 Tutorial Waves + 10 Waves = 12 Waves)
export const REGION_1_WAVES = [
    // Wave 1 (Tutorial wave 1): 4 runners
    {
        intro: "首波斥候試探，數量稀少",
        spawns: [
            { type: 'runner', count: 4, interval: 1.8 }
        ]
    },
    // Wave 2 (Tutorial wave 2): 3 runners + 2 armoured
    {
        intro: "盾兵現身，護甲較厚",
        spawns: [
            { type: 'runner', count: 3, interval: 1.6 },
            { delay: 3.0, type: 'armoured', count: 2, interval: 2.5 }
        ]
    },
    // Wave 3 (Level wave 1): 8 runners
    {
        intro: "焰兵衝鋒隊列",
        spawns: [
            { type: 'runner', count: 8, interval: 1.2 }
        ]
    },
    // Wave 4 (Level wave 2): 4 armoured + 5 runners
    {
        intro: "盾兵掩護步兵進迫",
        spawns: [
            { type: 'armoured', count: 4, interval: 2.0 },
            { delay: 2.5, type: 'runner', count: 5, interval: 1.2 }
        ]
    },
    // Wave 5 (Level wave 3): 1 rock golem + 6 runners
    {
        intro: "首見岩巨人！防厚血厚，小心應付",
        spawns: [
            { type: 'tank', count: 1, interval: 1.0 },
            { delay: 4.0, type: 'runner', count: 6, interval: 1.4 }
        ]
    },
    // Wave 6 (Level wave 4): 12 runners rapid
    {
        intro: "疾行突襲波次",
        spawns: [
            { type: 'runner', count: 12, interval: 0.9 }
        ]
    },
    // Wave 7 (Level wave 5): 6 armoured + 1 tank
    {
        intro: "重甲步兵集群",
        spawns: [
            { type: 'armoured', count: 6, interval: 1.8 },
            { delay: 5.0, type: 'tank', count: 1, interval: 1.0 }
        ]
    },
    // Wave 8 (Level wave 6): 3 flyers + 8 runners
    {
        intro: "空地試探：烈焰飛龍凌空！",
        spawns: [
            { type: 'flyer', count: 3, interval: 2.5 },
            { delay: 2.0, type: 'runner', count: 8, interval: 1.2 }
        ]
    },
    // Wave 9 (Level wave 7): 2 tanks + 3 armoured + 6 runners
    {
        intro: "雙重巨石衝擊，重盾隨行",
        spawns: [
            { type: 'tank', count: 2, interval: 4.0 },
            { delay: 2.5, type: 'armoured', count: 3, interval: 2.0 },
            { delay: 5.0, type: 'runner', count: 6, interval: 1.2 }
        ]
    },
    // Wave 10 (Level wave 8): 6 armoured + 3 flyers + 6 runners
    {
        intro: "空地掩護推進，重盾開路",
        spawns: [
            { type: 'armoured', count: 6, interval: 1.6 },
            { delay: 2.0, type: 'flyer', count: 3, interval: 2.5 },
            { delay: 4.5, type: 'runner', count: 6, interval: 1.2 }
        ]
    },
    // Wave 11 (Level wave 9): 6 armoured + 2 tanks + 8 runners
    {
        intro: "主力精銳集結！全軍推進",
        spawns: [
            { type: 'armoured', count: 6, interval: 1.6 },
            { delay: 3.0, type: 'tank', count: 2, interval: 3.5 },
            { delay: 5.0, type: 'runner', count: 8, interval: 1.0 }
        ]
    },
    // Wave 12 (Level wave 10): 6 runners + 4 armoured + Boss
    {
        intro: "第1區域決戰：熔核督軍降臨！",
        spawns: [
            { type: 'runner', count: 6, interval: 1.2 },
            { delay: 2.5, type: 'armoured', count: 4, interval: 1.8 },
            { delay: 6.0, type: 'boss_1', count: 1, interval: 1.0 }
        ]
    }
];

export const REGION_2_WAVES = [
    { intro: "凍湖斥候前鋒", spawns: [{ type: 'runner', count: 8, interval: 1.4 }, { delay: 3.0, type: 'armoured', count: 2, interval: 2.0 }] },
    { intro: "飛龍突襲，弩塔與霜晶注意對空！", spawns: [{ type: 'flyer', count: 3, interval: 2.5 }, { delay: 2.5, type: 'runner', count: 8, interval: 1.1 }] },
    { intro: "爆燃蟲群疾衝！", spawns: [{ type: 'swarm', count: 16, interval: 0.5 }, { delay: 3.0, type: 'armoured', count: 3, interval: 1.8 }] },
    { intro: "盾兵掩護飛龍", spawns: [{ type: 'armoured', count: 6, interval: 1.8 }, { delay: 3.0, type: 'flyer', count: 4, interval: 2.2 }] },
    { intro: "岩巨人踏碎冰面", spawns: [{ type: 'tank', count: 3, interval: 3.5 }, { delay: 2.0, type: 'swarm', count: 16, interval: 0.7 }] },
    { intro: "空地夾擊波次", spawns: [{ type: 'flyer', count: 4, interval: 2.0 }, { delay: 3.0, type: 'armoured', count: 6, interval: 1.5 }] },
    { intro: "爆燃蟲海推進", spawns: [{ type: 'swarm', count: 24, interval: 0.45 }, { delay: 4.5, type: 'tank', count: 3, interval: 3.0 }] },
    { intro: "飛龍中隊巡空", spawns: [{ type: 'flyer', count: 5, interval: 2.0 }, { delay: 3.0, type: 'runner', count: 10, interval: 1.0 }] },
    { intro: "重裝先鋒軍", spawns: [{ type: 'armoured', count: 10, interval: 1.5 }, { delay: 3.5, type: 'tank', count: 3, interval: 3.0 }] },
    { intro: "第2區域決戰：霜翼叛將！", spawns: [{ type: 'flyer', count: 4, interval: 2.2 }, { delay: 3.0, type: 'armoured', count: 8, interval: 1.4 }, { delay: 6.0, type: 'tank', count: 2, interval: 3.0 }, { delay: 9.0, type: 'boss_2', count: 1, interval: 1.0 }] }
];

export const REGION_3_WAVES = [
    { intro: "林道巡邏隊", spawns: [{ type: 'runner', count: 8, interval: 1.3 }] },
    { intro: "薩滿初現！優先集火治療者", spawns: [{ type: 'healer', count: 2, interval: 4.0 }, { delay: 2.0, type: 'armoured', count: 4, interval: 1.8 }] },
    { intro: "薩滿護衛岩巨人", spawns: [{ type: 'tank', count: 2, interval: 4.0 }, { delay: 2.0, type: 'healer', count: 3, interval: 3.0 }, { delay: 4.0, type: 'runner', count: 8, interval: 1.1 }] },
    { intro: "林間飛龍突襲", spawns: [{ type: 'flyer', count: 6, interval: 2.0 }, { delay: 3.0, type: 'swarm', count: 12, interval: 0.8 }] },
    { intro: "長道消耗戰", spawns: [{ type: 'armoured', count: 8, interval: 1.6 }, { delay: 4.0, type: 'healer', count: 3, interval: 3.0 }] },
    { intro: "三重巨石衝鋒", spawns: [{ type: 'tank', count: 3, interval: 3.5 }, { delay: 3.0, type: 'healer', count: 3, interval: 2.5 }] },
    { intro: "急速穿林部隊", spawns: [{ type: 'swarm', count: 18, interval: 0.6 }, { delay: 4.0, type: 'flyer', count: 7, interval: 1.8 }] },
    { intro: "薩滿雙祭司集群", spawns: [{ type: 'healer', count: 6, interval: 2.5 }, { delay: 2.0, type: 'tank', count: 3, interval: 3.5 }, { delay: 4.0, type: 'armoured', count: 4, interval: 1.8 }] },
    { intro: "狂暴前衛陣列", spawns: [{ type: 'armoured', count: 12, interval: 1.3 }, { delay: 3.0, type: 'flyer', count: 8, interval: 1.6 }] },
    { intro: "第3區域決戰：烈石狂獸踐踏！", spawns: [{ type: 'healer', count: 4, interval: 2.5 }, { delay: 4.0, type: 'tank', count: 3, interval: 3.0 }, { delay: 8.0, type: 'boss_3', count: 1, interval: 1.0 }] }
];

export const REGION_4_WAVES = [
    { intro: "邊境隱匿探子", spawns: [{ type: 'fast', count: 6, interval: 1.4 }] },
    { intro: "疾行隊列與薩滿", spawns: [{ type: 'fast', count: 8, interval: 1.1 }, { delay: 3.0, type: 'healer', count: 2, interval: 3.5 }] },
    { intro: "熔岩火翼襲擊", spawns: [{ type: 'flyer', count: 7, interval: 1.8 }, { delay: 3.0, type: 'fast', count: 6, interval: 1.2 }] },
    { intro: "重甲護法大軍", spawns: [{ type: 'armoured', count: 8, interval: 1.5 }, { delay: 3.0, type: 'healer', count: 4, interval: 2.5 }] },
    { intro: "赤巖蟲潮奔騰", spawns: [{ type: 'swarm', count: 24, interval: 0.5 }, { delay: 5.0, type: 'tank', count: 3, interval: 3.0 }] },
    { intro: "全速突進鋒線", spawns: [{ type: 'fast', count: 12, interval: 0.9 }, { delay: 3.0, type: 'flyer', count: 6, interval: 1.8 }] },
    { intro: "熔核重坦梯隊", spawns: [{ type: 'tank', count: 4, interval: 3.0 }, { delay: 3.0, type: 'healer', count: 4, interval: 2.5 }] },
    { intro: "熾熱混編軍團", spawns: [{ type: 'armoured', count: 10, interval: 1.4 }, { delay: 3.0, type: 'fast', count: 8, interval: 1.1 }, { delay: 5.0, type: 'flyer', count: 6, interval: 1.8 }] },
    { intro: "邊境毀滅狂瀾", spawns: [{ type: 'tank', count: 4, interval: 2.8 }, { delay: 3.0, type: 'healer', count: 5, interval: 2.0 }, { delay: 5.0, type: 'fast', count: 10, interval: 1.0 }] },
    { intro: "第4區域決戰：炎煞巫祖！", spawns: [{ type: 'fast', count: 8, interval: 1.1 }, { delay: 3.0, type: 'healer', count: 4, interval: 2.5 }, { delay: 8.0, type: 'boss_4', count: 1, interval: 1.0 }] }
];

export const REGION_5_WAVES = [
    { intro: "要塞攻防戰開端", spawns: [{ type: 'runner', count: 10, interval: 1.0 }, { delay: 3.0, type: 'fast', count: 6, interval: 1.2 }] },
    { intro: "空中烈焰編隊", spawns: [{ type: 'flyer', count: 8, interval: 1.6 }, { delay: 3.0, type: 'armoured', count: 6, interval: 1.5 }] },
    { intro: "無盡蟲潮攻門", spawns: [{ type: 'swarm', count: 28, interval: 0.4 }, { delay: 4.0, type: 'tank', count: 2, interval: 3.5 }] },
    { intro: "巫師與重裝主力", spawns: [{ type: 'armoured', count: 10, interval: 1.3 }, { delay: 3.0, type: 'healer', count: 4, interval: 2.5 }] },
    { intro: "突襲鋒芒難擋", spawns: [{ type: 'fast', count: 14, interval: 0.8 }, { delay: 3.0, type: 'flyer', count: 8, interval: 1.5 }] },
    { intro: "熔岩泰坦進攻", spawns: [{ type: 'tank', count: 5, interval: 2.8 }, { delay: 3.0, type: 'healer', count: 4, interval: 2.2 }] },
    { intro: "空地大混戰", spawns: [{ type: 'flyer', count: 10, interval: 1.4 }, { delay: 3.0, type: 'swarm', count: 20, interval: 0.6 }, { delay: 6.0, type: 'tank', count: 3, interval: 3.0 }] },
    { intro: "北辰門前血戰", spawns: [{ type: 'armoured', count: 12, interval: 1.2 }, { delay: 3.0, type: 'fast', count: 10, interval: 1.0 }, { delay: 5.0, type: 'healer', count: 5, interval: 2.0 }] },
    { intro: "毀滅前夕狂攻", spawns: [{ type: 'tank', count: 5, interval: 2.5 }, { delay: 3.0, type: 'flyer', count: 8, interval: 1.5 }, { delay: 6.0, type: 'fast', count: 12, interval: 0.8 }] },
    { intro: "雙重小頭目突襲！", spawns: [{ type: 'boss_1', count: 1, interval: 1.0 }, { delay: 4.0, type: 'boss_2', count: 1, interval: 1.0 }] },
    { intro: "狂暴終曲壓境", spawns: [{ type: 'tank', count: 6, interval: 2.2 }, { delay: 3.0, type: 'healer', count: 6, interval: 1.8 }, { delay: 5.0, type: 'flyer', count: 10, interval: 1.2 }] },
    { intro: "終焉決戰：炎魔降臨！霜門生死存亡之戰！", spawns: [{ type: 'armoured', count: 8, interval: 1.3 }, { delay: 3.0, type: 'healer', count: 4, interval: 2.0 }, { delay: 8.0, type: 'boss_5', count: 1, interval: 1.0 }] }
];

export function getRegionWaves(regionId) {
    switch (regionId) {
        case 2: return REGION_2_WAVES;
        case 3: return REGION_3_WAVES;
        case 4: return REGION_4_WAVES;
        case 5: return REGION_5_WAVES;
        case 1:
        default:
            return REGION_1_WAVES;
    }
}

export const CANTONESE_TUTORIAL = [
    {
        id: 'pan_zoom',
        text: '喂，新嚟㗎？手指撳住地下可以拖動視角，雙指可以放大縮小睇清楚。',
        target: 'map'
    },
    {
        id: 'build_crossbow',
        text: '見到路邊個空石基未？撳佢一下，揀座弩塔，再撳「建造」起出嚟！',
        target: 'plot_0'
    },
    {
        id: 'start_wave',
        text: '起好弩塔喇！依家撳右下角「開始波次」放敵人入嚟！',
        target: 'start_btn'
    },
    {
        id: 'inspect_tower',
        text: '撳一下起好嘅弩塔，可以升級威力，唔啱用仲可以賣番七成金幣。',
        target: 'built_tower'
    },
    {
        id: 'hero_ability',
        text: '我霜衛長出馬！撳我頭像或者技能，點選路面再撳「施放」，等班焰裔見識冰川力量！',
        target: 'hero_btn'
    },
    {
        id: 'speed_pause',
        text: '右上角可以切換 1×/2×/3× 速度或者暫停。好，守好霜門山道！',
        target: 'speed_btn'
    }
];

export const VICTORY_LINES = [
    "贏得好乾脆！霜門山道固若金湯，焰裔嚇到縮番落南邊！",
    "痛快！班焰裔連城門塊磚都掂唔到！",
    "今鋪守得靚！艾瑞卡同守衛長矛今晚有熱酒飲！"
];

export const DEFEAT_LINES = [
    "哎呀，霜門失守！冰川咽喉被攻破，即刻整頓防線重開！",
    "頂唔住呀！防線火力唔夠均勻，下次起多兩座霜晶或者石炮試下！",
    "守衛頂唔順！唔緊要，重整旗鼓，霜衛長同你再戰！"
];
