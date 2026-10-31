// Historical Trade, Route, Character & Narrative Data for 季風帆影 · Monsoon Carrack (Macau, 1600)

export const SAVE_KEY = "monsoon-carrack-save-v1";

export const INITIAL_STATE = {
  year: 1, // 1 = 萬曆二十八年 (1600), 2 = 萬曆二十九年 (1601), 3 = 萬曆三十年 (1602)
  season: "SW", // "SW" = 西南季風 (夏秋 五至九月), "NE" = 東北季風 (冬春 十一至三月)
  daysLeft: 120, // Each monsoon sailing season spans 120 days
  totalVoyages: 0,
  port: "macau",
  silver: 680, // Starting silver in taels (兩)
  debt: 3600, // Total guild mortgage owed to 廣州同順堂
  paidThisYear: 0,
  hull: 100,
  maxHull: 100,
  crew: 48,
  maxCrew: 60,
  morale: 85, // 0 - 100
  provisions: 80, // 0 - 100 (water & biscuit rations)
  cargoCap: 60,
  cargo: {
    raw_silk: 4,
    silk_fabric: 0,
    porcelain: 4,
    musk: 0,
    pepper: 0,
    silver: 0,
    sappanwood: 0
  },
  cargoCostBasis: {
    raw_silk: 136,
    silk_fabric: 0,
    porcelain: 96,
    musk: 0,
    pepper: 0,
    silver: 0,
    sappanwood: 0
  },
  reputation: {
    macau: 65,
    guangzhou: 55,
    nagasaki: 50,
    manila: 50,
    malacca: 50
  },
  marketPressure: {}, // key: `${port}_${goodId}` -> integer pressure from recent trades
  activeRumour: null, // { id, title, desc, port, good, mult }
  clues: [], // ["clue_logbook", "clue_manila_draft", "clue_jesuit_cipher", "clue_wreck_brother"]
  brotherFound: false,
  readLetters: [],
  seenEvents: [],
  chronicle: [
    {
      year: 1,
      season: "SW",
      text: "萬曆二十八年孟夏，兄長沈仲明所駕《望海號》於呂宋外海失蹤經年。廣州十三行同順堂陳萬山持三千六百兩銀契登門，限三載清償。季安奉母命接掌《黑潮號》船主印信。"
    }
  ]
};

export const YEAR_META = {
  1: {
    mingYear: "萬曆二十八年",
    adYear: "1600",
    instalmentDue: 900,
    cumulativeTarget: 900,
    title: "初掌黑船 · 首年大限"
  },
  2: {
    mingYear: "萬曆二十九年",
    adYear: "1601",
    instalmentDue: 1200,
    cumulativeTarget: 2100,
    title: "絲銀暗湧 · 二載風濤"
  },
  3: {
    mingYear: "萬曆三十年",
    adYear: "1602",
    instalmentDue: 1500,
    cumulativeTarget: 3600,
    title: "贖契歸宗 · 終局決算"
  }
};

export const SEASONS = {
  SW: {
    id: "SW",
    name: "西南季風",
    sub: "夏秋航季 · 五月至九月",
    latin: "Monção do Sudoeste",
    windSummary: "南風北吹，利於由麻六甲、澳門北航長崎；惟七八月呂宋外海多見颶母。",
    typhoonRisk: 0.28
  },
  NE: {
    id: "NE",
    name: "東北季風",
    sub: "冬春航季 · 十一月至三月",
    latin: "Monção do Nordeste",
    windSummary: "北風南下，利於由長崎載銀歸澳，或下南洋赴馬尼拉、麻六甲採辦椒木。",
    typhoonRisk: 0.10
  }
};

export const CHARACTERS = {
  captain: {
    id: "captain",
    name: "沈季安",
    title: "《黑潮號》船主 · Capitão Dom Lourenço",
    art: "assets/people/captain.webp",
    bio: "澳門沈氏次子。原本喺聖保祿學院讀拉丁文同星盤算術，阿哥失蹤之後臨危受命，接掌黑船。"
  },
  mother: {
    id: "mother",
    name: "沈太夫人",
    title: "沈氏當家主母 · Matriarca",
    art: "assets/people/mother.webp",
    bio: "守住南灣沈宅三十幾年嘅老夫人，手握沈家祠堂印信，日夜盼望大仔仲明生還。"
  },
  guild_master: {
    id: "guild_master",
    name: "陳萬山",
    title: "廣州十三行同順堂東家 · Mercador de Cantão",
    art: "assets/people/guild_master.webp",
    bio: "掌控湖絲出洋引票嘅廣州大行商。表面笑面迎人，算盤珠一撥就決定幾十條海船嘅死活。"
  },
  japanese_merchant: {
    id: "japanese_merchant",
    name: "末次宗德",
    title: "長崎乙名絲商 · Mercador de Nagasáqui",
    art: "assets/people/japanese_merchant.webp",
    bio: "肥前長崎奉行所特許嘅大絲商，專收上等湖州白絲，以足色灰吹丁銀結算。"
  },
  jesuit: {
    id: "jesuit",
    name: "陸神父",
    title: "聖保祿學院通事 · Padre Mateus",
    art: "assets/people/jesuit.webp",
    bio: "精通粵語、日語同葡語嘅耶穌會神父，熟悉海圖星象，同你阿哥仲明係多年摯友。"
  },
  spanish_factor: {
    id: "spanish_factor",
    name: "唐·阿隆索",
    title: "馬尼拉王室商務官 · Factor Real de Manila",
    art: "assets/people/spanish_factor.webp",
    bio: "駐守呂宋王城嘅西班牙王室稅吏，掌管阿卡普爾科大帆船運嚟嘅墨西哥鷹洋。"
  },
  first_mate: {
    id: "first_mate",
    name: "阿海叔",
    title: "老夥長 · Mestre de Navegação",
    art: "assets/people/first_mate.webp",
    bio: "跟隨沈家父子行船二十幾年嘅老火長，熟讀《順風相送》針路，識睇雲色避風。"
  },
  rival: {
    id: "rival",
    name: "裴雷拉",
    title: "《聖十字號》船主 · Capitão Gaspar Pereira",
    art: "assets/people/rival.webp",
    bio: "澳門議事亭有勢力嘅船主，舊年同你阿哥《望海號》一齊出航呂宋，唯獨佢滿載白銀歸來。"
  }
};

export const PORTS = {
  macau: {
    id: "macau",
    name: "澳門",
    sub: "天主聖名之城 · 南灣澳口",
    latin: "Macau · Cidade do Nome de Deus",
    art: "assets/ports/macau.webp",
    mapX: 51.5,
    mapY: 39.0,
    desc: "珠江口外嘅中西交匯澳城。黑船喺南灣拋錨，聖保祿鐘聲同碼頭苦力嘅粵語號子交織。",
    repairCostPerPt: 2,
    hireCostPerCrew: 6,
    provisionCostPer10: 12,
    priceMultipliers: {
      raw_silk: 0.90,
      silk_fabric: 0.92,
      porcelain: 0.88,
      musk: 0.90,
      pepper: 1.55,
      silver: 1.22,
      sappanwood: 1.45
    },
    seasonalMod: {
      SW: { raw_silk: 0.96, pepper: 1.08 },
      NE: { silver: 1.10, silk_fabric: 0.94 }
    }
  },
  guangzhou: {
    id: "guangzhou",
    name: "廣州",
    sub: "黃埔十三行 · 珠江官碼頭",
    latin: "Cantão · Feitoria do Rio das Pérolas",
    art: "assets/ports/guangzhou.webp",
    mapX: 35.0,
    mapY: 18.0,
    desc: "嶺南百貨總匯。湖州新絲、景德青花同川藏麝香堆積如山，亦係同順堂陳萬山催收銀契之地。",
    repairCostPerPt: 2,
    hireCostPerCrew: 5,
    provisionCostPer10: 10,
    priceMultipliers: {
      raw_silk: 0.68,
      silk_fabric: 0.72,
      porcelain: 0.66,
      musk: 0.74,
      pepper: 1.82,
      silver: 1.38,
      sappanwood: 1.68
    },
    seasonalMod: {
      SW: { raw_silk: 0.92, pepper: 1.05 },
      NE: { pepper: 1.15, silver: 1.12 }
    }
  },
  nagasaki: {
    id: "nagasaki",
    name: "長崎",
    sub: "肥前津 · 南蠻黑船埠頭",
    latin: "Nagasáqui · Porto do Kurofune",
    art: "assets/ports/nagasaki.webp",
    mapX: 70.0,
    mapY: 20.0,
    desc: "九州深水良港。日本諸大名與京都織坊爭購唐船白絲，碼頭上盡係秤量灰吹丁銀嘅乙名商人。",
    repairCostPerPt: 3,
    hireCostPerCrew: 8,
    provisionCostPer10: 15,
    priceMultipliers: {
      raw_silk: 1.88,
      silk_fabric: 1.56,
      porcelain: 1.45,
      musk: 1.64,
      pepper: 1.62,
      silver: 0.70,
      sappanwood: 1.78
    },
    seasonalMod: {
      SW: { raw_silk: 1.12, musk: 1.08 },
      NE: { silver: 0.92, sappanwood: 1.10 }
    }
  },
  manila: {
    id: "manila",
    name: "馬尼拉",
    sub: "呂宋王城 · 澗內唐人街",
    latin: "Manila · Intramuros e Parián",
    art: "assets/ports/manila.webp",
    mapX: 71.5,
    mapY: 56.0,
    desc: "西班牙王城與唐人八連市場相望。每年大帆船由美洲阿卡普爾科運嚟成箱鷹洋，專換中國錦緞與青花瓷。",
    repairCostPerPt: 3,
    hireCostPerCrew: 7,
    provisionCostPer10: 14,
    priceMultipliers: {
      raw_silk: 1.50,
      silk_fabric: 1.68,
      porcelain: 1.62,
      musk: 1.32,
      pepper: 1.25,
      silver: 0.72,
      sappanwood: 0.78
    },
    seasonalMod: {
      SW: { silk_fabric: 1.10, porcelain: 1.08 },
      NE: { silver: 0.90, raw_silk: 1.06 }
    }
  },
  malacca: {
    id: "malacca",
    name: "麻六甲",
    sub: "滿剌加城 · 富摩沙堡海峽",
    latin: "Malaca · Fortaleza A Famosa",
    art: "assets/ports/malacca.webp",
    mapX: 27.0,
    mapY: 79.0,
    desc: "扼守東西洋咽喉嘅葡屬石堡。碼頭空氣瀰漫住胡椒辛香與暹羅蘇木氣味，最渴求景德鎮瓷器與現銀。",
    repairCostPerPt: 2,
    hireCostPerCrew: 6,
    provisionCostPer10: 11,
    priceMultipliers: {
      raw_silk: 1.28,
      silk_fabric: 1.36,
      porcelain: 1.75,
      musk: 1.42,
      pepper: 0.54,
      silver: 1.26,
      sappanwood: 0.56
    },
    seasonalMod: {
      SW: { pepper: 0.90, porcelain: 1.10 },
      NE: { sappanwood: 0.92, musk: 1.08 }
    }
  }
};

export const GOODS = [
  {
    id: "raw_silk",
    name: "湖州生絲",
    shortName: "生絲",
    latin: "Seda Crua · 白絲",
    unit: "擔",
    basePrice: 42,
    art: "assets/goods/raw_silk.webp",
    desc: "輯里湖絲，色白如雪、韌若琴弦。廣州低價收購，運往長崎、馬尼拉可獲倍利。"
  },
  {
    id: "silk_fabric",
    name: "雲錦絲綢",
    shortName: "絲綢",
    latin: "Damasco de Seda · 綾緞",
    unit: "匹",
    basePrice: 64,
    art: "assets/goods/silk_fabric.webp",
    desc: "織金雲龍紋妝花緞。馬尼拉西班牙貴族與長崎大名最愛，經大帆船遠銷墨西哥。"
  },
  {
    id: "porcelain",
    name: "萬曆青花瓷",
    shortName: "瓷器",
    latin: "Porcelana Kraak · 芙蓉手",
    unit: "箱",
    basePrice: 30,
    art: "assets/goods/porcelain.webp",
    desc: "景德鎮開光青花大盤與軍持水注。既可壓艙穩船，運抵麻六甲與馬尼拉極為搶手。"
  },
  {
    id: "musk",
    name: "川藏麝香",
    shortName: "麝香",
    latin: "Almíscar · 當門子",
    unit: "匣",
    basePrice: 84,
    art: "assets/goods/musk.webp",
    desc: "寸香寸金嘅名貴香料與定驚藥材。佔艙極少而單價高昂，長崎香道名家不惜重金。"
  },
  {
    id: "pepper",
    name: "滿剌加胡椒",
    shortName: "胡椒",
    latin: "Pimenta Negra · 烏椒",
    unit: "包",
    basePrice: 26,
    art: "assets/goods/pepper.webp",
    desc: "麻六甲海峽集散嘅辛香烏椒。南洋產地價廉，北運回廣州、澳門與長崎利潤豐厚。"
  },
  {
    id: "silver",
    name: "灰吹丁銀",
    shortName: "白銀",
    latin: "Prata Chōgin & Reales · 番銀",
    unit: "箱",
    basePrice: 54,
    art: "assets/goods/silver.webp",
    desc: "日本石見銀山灰吹丁銀與呂宋墨西哥鷹洋。運回廣州熔鑄紋銀，最受十三行青睞。"
  },
  {
    id: "sappanwood",
    name: "暹羅蘇木",
    shortName: "蘇木",
    latin: "Pau-Sappan · 紅柴",
    unit: "束",
    basePrice: 18,
    art: "assets/goods/sappanwood.webp",
    desc: "南洋紅木染料，亦作大船底艙壓艙木。麻六甲與馬尼拉極平，運往長崎染坊價翻三倍。"
  }
];

// Directed routes between ports with distance, days, and seasonal monsoon fit
export const ROUTES = [
  // Macau connections
  { from: "macau", to: "guangzhou", distLi: 280, baseDays: 14, bestSeason: "BOTH", baseRisk: 0.08, note: "珠江內河航道，沿途需經虎門稅關抽分。" },
  { from: "guangzhou", to: "macau", distLi: 280, baseDays: 14, bestSeason: "BOTH", baseRisk: 0.08, note: "順珠江水出零丁洋，船載湖絲青花歸澳。" },

  { from: "macau", to: "nagasaki", distLi: 3400, baseDays: 34, bestSeason: "SW", baseRisk: 0.22, note: "經台灣海峽與薩摩外海北上，趁西南季風揚帆最速。" },
  { from: "nagasaki", to: "macau", distLi: 3400, baseDays: 32, bestSeason: "NE", baseRisk: 0.18, note: "冬春東北風起，滿載日本丁銀南歸澳門。" },

  { from: "macau", to: "manila", distLi: 2100, baseDays: 24, bestSeason: "NE", baseRisk: 0.18, note: "橫渡南海直指呂宋灣，冬春順風，夏秋需防颶母。" },
  { from: "manila", to: "macau", distLi: 2100, baseDays: 24, bestSeason: "SW", baseRisk: 0.22, note: "借西南風由呂宋返航珠江口，切忌八月秋颱。" },

  { from: "macau", to: "malacca", distLi: 4200, baseDays: 40, bestSeason: "NE", baseRisk: 0.20, note: "沿占城、崑崙洋南下海峽，趁東北信風一氣呵成。" },
  { from: "malacca", to: "macau", distLi: 4200, baseDays: 38, bestSeason: "SW", baseRisk: 0.20, note: "趁五月西南風出麻六甲海峽，滿載胡椒北歸。" },

  // Guangzhou outer connections
  { from: "guangzhou", to: "nagasaki", distLi: 3600, baseDays: 38, bestSeason: "SW", baseRisk: 0.24, note: "由黃埔出虎門直航九州，省卻澳門轉運。" },
  { from: "nagasaki", to: "guangzhou", distLi: 3600, baseDays: 36, bestSeason: "NE", baseRisk: 0.20, note: "由長崎直入珠江口交割丁銀。" },

  { from: "guangzhou", to: "manila", distLi: 2300, baseDays: 28, bestSeason: "NE", baseRisk: 0.20, note: "由珠江口直下呂宋，唐船絲瓷絡繹不絕。" },
  { from: "manila", to: "guangzhou", distLi: 2300, baseDays: 28, bestSeason: "SW", baseRisk: 0.24, note: "攜墨西哥鷹洋北返廣州十三行。" },

  { from: "guangzhou", to: "malacca", distLi: 4400, baseDays: 42, bestSeason: "NE", baseRisk: 0.22, note: "遠下西洋採辦烏椒蘇木。" },
  { from: "malacca", to: "guangzhou", distLi: 4400, baseDays: 42, bestSeason: "SW", baseRisk: 0.22, note: "乘南風直入虎門銷貨。" },

  // Outer triangle routes
  { from: "manila", to: "nagasaki", distLi: 2600, baseDays: 28, bestSeason: "SW", baseRisk: 0.25, note: "沿琉球黑潮北上肥前，需防倭寇快船。" },
  { from: "nagasaki", to: "manila", distLi: 2600, baseDays: 28, bestSeason: "NE", baseRisk: 0.22, note: "借北風南下呂宋，互通日銀與唐絲。" },

  { from: "manila", to: "malacca", distLi: 3200, baseDays: 34, bestSeason: "NE", baseRisk: 0.22, note: "穿文萊外海入滿剌加海峽。" },
  { from: "malacca", to: "manila", distLi: 3200, baseDays: 34, bestSeason: "SW", baseRisk: 0.22, note: "由海峽順西南風東航呂宋。" },

  { from: "nagasaki", to: "malacca", distLi: 5600, baseDays: 52, bestSeason: "NE", baseRisk: 0.28, note: "萬里長航，由九州直抵南洋海峽。" },
  { from: "malacca", to: "nagasaki", distLi: 5600, baseDays: 52, bestSeason: "SW", baseRisk: 0.28, note: "乘西南季風萬里北上，蘇木胡椒直銷日本。" }
];

export function getRoute(fromPort, toPort, currentSeason = "SW") {
  const base = ROUTES.find(r => r.from === fromPort && r.to === toPort) || {
    from: fromPort,
    to: toPort,
    distLi: 2800,
    baseDays: 30,
    bestSeason: "BOTH",
    baseRisk: 0.20,
    note: "遠洋針路，仰賴羅盤與星象引航。"
  };

  let windFit = "順風";
  let daysMod = 1.0;
  let riskMod = 0.0;

  if (base.bestSeason === "BOTH") {
    windFit = "平風";
    daysMod = 1.0;
    riskMod = 0.0;
  } else if (base.bestSeason === currentSeason) {
    windFit = "順風";
    daysMod = 0.90;
    riskMod = -0.04;
  } else {
    windFit = "逆風";
    daysMod = 1.45;
    riskMod = 0.18;
  }

  const expectedDays = Math.max(10, Math.round(base.baseDays * daysMod));
  const riskScore = Math.min(0.65, Math.max(0.05, base.baseRisk + riskMod + (currentSeason === "SW" && base.distLi > 1000 ? 0.06 : 0)));
  const riskLabel = riskScore >= 0.35 ? "高危 · 慎防颶寇" : (riskScore >= 0.20 ? "中等 · 需備壓艙" : "平穩 · 水路順暢");

  return {
    ...base,
    windFit,
    expectedDays,
    riskScore,
    riskLabel
  };
}

// 10 Voyage Event Vignettes matching SPEC.md asset list
export const VOYAGE_EVENTS = [
  {
    id: "ev_storm",
    title: "黑水颶母 · 狂瀾折檣",
    art: "assets/events/storm.webp",
    speaker: "first_mate",
    weight: (route, season) => (season === "SW" || route.windFit === "逆風" ? 3 : 1),
    text: "阿海叔緊握舵輪，頂住漫天鹹雨大喊：「船主！天邊雲腳發烏，係呂宋颶母殺到！大檣帆索已經繃到極限，再唔決斷，成架黑船都會俾巨浪拍散！」",
    choices: [
      {
        label: "「落半帆、拋五箱重貨入海減載！」",
        sub: "棄置部分貨物保住船身（損失最多 5 擔貨物，船體 -5）",
        resolve(state) {
          let dropped = 0;
          for (const g of GOODS) {
            while (state.cargo[g.id] > 0 && dropped < 5) {
              const oldQty = state.cargo[g.id];
              state.cargo[g.id] -= 1;
              state.cargoCostBasis[g.id] = Math.round((state.cargoCostBasis[g.id] || 0) * (state.cargo[g.id] / oldQty));
              dropped += 1;
            }
          }
          state.hull = Math.max(15, state.hull - 5);
          return `水手合力斬斷繩索，拋落 ${dropped} 件貨箱減輕吃水。《黑潮號》喺浪谷之中驚險穩住龍骨，船身僅受輕損。`;
        }
      },
      {
        label: "「全體水手死守大檣，一箱貨都唔准丟！」",
        sub: "硬闖風眼（60% 機會全保；40% 機會船體重創 -22、士氣 -10）",
        chance: 0.60,
        resolve(state, roll) {
          if (roll < 0.60) {
            state.morale = Math.min(100, state.morale + 4);
            state.hull = Math.max(15, state.hull - 8);
            return "阿海叔憑住二十年針路經驗，帶領水手斜切風眼。雖然甲板入水、船板微裂，但底艙絲銀分毫無損！";
          }
          state.hull = Math.max(12, state.hull - 22);
          state.morale = Math.max(10, state.morale - 10);
          return "巨浪迎頭劈落後樓，尾舵鐵箍崩裂！雖然保住咗底艙貨物，但船殼重創，水手驚魂未定。";
        }
      },
      {
        label: "「開神父繪製嘅避風澳海圖，繞入暗礁灣避風。」",
        sub: "耗費 6 日船期與 8 點糧水，安然避過風暴",
        resolve(state) {
          state.daysLeft = Math.max(0, state.daysLeft - 6);
          state.provisions = Math.max(5, state.provisions - 8);
          return "黑船轉舵駛入島嶼背風處拋下雙錨。聽住外海狂風呼嘯兩日兩夜，全船人貨平安無恙。";
        }
      }
    ]
  },
  {
    id: "ev_pirates",
    title: "黑帆攔路 · 倭寇關船",
    art: "assets/events/pirates.webp",
    speaker: "first_mate",
    weight: (route) => (route.to === "nagasaki" || route.from === "nagasaki" || route.to === "manila" ? 3 : 2),
    text: "晨霧入面突然衝出三艘插住八幡赤旗嘅快槳關船！鐵炮火繩煙霧瀰漫，阿海叔拔出腰刀喝道：「船主，係薩摩外海嘅浪人海寇！佢哋想趁風弱鉤住我哋船舷！」",
    choices: [
      {
        label: "「推開舷窗佛郎機銃，轟沉佢哋頭船！」",
        sub: "開炮迎戰（耗銀 35 兩火藥費，船體 -6，士氣 +8）",
        resolve(state) {
          state.silver = Math.max(0, state.silver - 35);
          state.hull = Math.max(15, state.hull - 6);
          state.morale = Math.min(100, state.morale + 8);
          return "八門佛郎機銅炮齊發，霰彈將領頭關船嘅主桅攔腰打斷！海寇見黑船火器犀利，倉皇搖槳遁入濃霧。";
        }
      },
      {
        label: "「拋出八十兩買路銀同兩箱青花，息事寧人。」",
        sub: "破財消災（銀兩 -80，另獻出最多 2 箱青花瓷，免受船體損傷）",
        resolve(state) {
          const paid = Math.min(state.silver, 80);
          state.silver -= paid;
          const heldPorc = (state.cargo && state.cargo.porcelain) || 0;
          const givenPorc = Math.min(2, heldPorc);
          if (givenPorc > 0) {
            state.cargo.porcelain = heldPorc - givenPorc;
            state.cargoCostBasis.porcelain = Math.round(
              ((state.cargoCostBasis && state.cargoCostBasis.porcelain) || 0) *
                (state.cargo.porcelain / heldPorc)
            );
          }
          state.morale = Math.max(10, state.morale - 4);
          return `你命人用木桶載住 ${paid} 兩碎銀${givenPorc > 0 ? `同 ${givenPorc} 箱青花瓷` : ""}放流過去。倭寇頭目撈起財物，吹響法螺退兵，黑船得以全速脫身。`;
        }
      },
      {
        label: "「張滿全部橫帆，借黑潮急流硬衝過去！」",
        sub: "70% 機會甩開追兵；30% 機會被火箭射中帆索（船體 -15）",
        chance: 0.70,
        resolve(state, roll) {
          if (roll < 0.70) {
            return "《黑潮號》借住高聳船身同順風巨帆，犁開白浪全速突圍，將單薄嘅關船遠遠拋喺船尾！";
          }
          state.hull = Math.max(12, state.hull - 15);
          return "突圍之際，幾支火箭射穿後帆，水手撲救及時方未釀成大火，惟船尾樓欄受損不輕。";
        }
      }
    ]
  },
  {
    id: "ev_becalmed",
    title: "無風鏡海 · 帆垂烈日",
    art: "assets/events/becalmed.webp",
    speaker: "first_mate",
    weight: (route) => (route.windFit === "逆風" ? 3 : 1),
    text: "連日一絲風都冇，海面平滑得好似一面赤銅鏡。大帆軟垂，底艙淡水桶已經見底，水手嘴唇乾裂，聚喺甲板度細聲怨嘆。",
    choices: [
      {
        label: "「開船主私藏嘅葡國葡萄酒同柑橘，分發全船！」",
        sub: "耗銀 45 兩撫慰船員，士氣 +10，糧水回升",
        resolve(state) {
          const cost = Math.min(state.silver, 45);
          state.silver -= cost;
          state.morale = Math.min(100, state.morale + 10);
          state.provisions = Math.min(100, state.provisions + 10);
          return "酸甜果實同美酒分落去，甲板即刻響起歡呼聲。三日後晚風再起，水手精神奕奕重新升帆。";
        }
      },
      {
        label: "「放下兩艘小舢舨，組織水手輪流搖槳牽引！」",
        sub: "不費銀兩，節省船期，但士氣 -8、糧水 -6",
        resolve(state) {
          state.morale = Math.max(15, state.morale - 8);
          state.provisions = Math.max(5, state.provisions - 6);
          return "水手喺烈日下赤膊搖槳兩日，終於將黑船拉入有風洋流帶，保住咗寶貴航期。";
        }
      },
      {
        label: "「嚴格配給淡水，靜候洋流帶動。」",
        sub: "耗費 8 日船期，士氣 -4",
        resolve(state) {
          state.daysLeft = Math.max(0, state.daysLeft - 8);
          state.morale = Math.max(15, state.morale - 4);
          return "苦等八晝夜後，海面終於泛起魚鱗細浪，黑船緩緩駛出無風帶。";
        }
      }
    ]
  },
  {
    id: "ev_sickness",
    title: "底艙瘴熱 · 船醫告急",
    art: "assets/events/sickness.webp",
    speaker: "jesuit",
    weight: () => 2,
    text: "南洋濕熱瘴氣侵入底艙，七八個水手發起高燒、渾身寒戰。隨船通事陸神父捧住藥罐過嚟：「船主，普通草藥已經壓唔住熱症，再傳開去怕會無人操帆！」",
    choices: [
      {
        label: "「開一匣川藏麝香，或出六十兩買名貴正氣散救人！」",
        sub: "若有麝香則耗 1 匣（否則耗銀 60 兩），士氣 +12，全員康復",
        resolve(state) {
          if (state.cargo.musk > 0) {
            const oldQty = state.cargo.musk;
            state.cargo.musk -= 1;
            state.cargoCostBasis.musk = Math.round((state.cargoCostBasis.musk || 0) * (state.cargo.musk / oldQty));
            state.morale = Math.min(100, state.morale + 12);
            return "你毫不猶豫打開一匣上等川藏麝香入藥。不出兩日，病倒嘅水手高燒盡退，全船對你感激涕零！";
          }
          const cost = Math.min(state.silver, 60);
          state.silver -= cost;
          state.morale = Math.min(100, state.morale + 10);
          return `你動用船主藥箱中價值 ${cost} 兩嘅西洋金雞納霜與廣陳皮煎湯，病患盡皆轉危為安。`;
        }
      },
      {
        label: "「以艾草熏艙、隔離病患，用檸檬汁同米湯調理。」",
        sub: "糧水 -10，士氣 -3，可保水手性命",
        resolve(state) {
          state.provisions = Math.max(5, state.provisions - 10);
          state.morale = Math.max(15, state.morale - 3);
          return "底艙連熏三日艾煙，雖然耗費唔少淡水米糧，好在熱症終究冇再蔓延。";
        }
      }
    ]
  },
  {
    id: "ev_rescue",
    title: "斷檣浮木 · 海上遺孤",
    art: "assets/events/rescue.webp",
    speaker: "first_mate",
    weight: (route, season, state) => (!state.clues.includes("clue_logbook") ? 5 : 2),
    text: "瞭望台水手大叫：「右舷三鏈外有塊斷桅，上面趴住個人！」阿海叔舉起單筒千里鏡一睇，臉色大變：「船主！嗰塊樟木船板上面刻住『望海』兩個字——係你阿哥條船嘅舊部！」",
    choices: [
      {
        label: "「即刻放小艇救人，重賞水手並細問《望海號》下落！」",
        sub: "耗銀 30 兩救治，士氣 +8，獲得關鍵線索【染血航海日誌】",
        resolve(state) {
          state.silver = Math.max(0, state.silver - 30);
          state.morale = Math.min(100, state.morale + 8);
          if (!state.clues.includes("clue_logbook")) {
            state.clues.push("clue_logbook");
          }
          return "獲救嘅老水手叫陳七，係《望海號》副舵工！佢從油布袋掏出半本航海日誌：「大船主冇死喺風浪！舊年喺呂宋外海，係裴雷拉條船用假燈號引我哋觸礁！」";
        }
      },
      {
        label: "「拋繩救佢上船充作水手，勿要張揚免生枝節。」",
        sub: "水手 +1，獲得線索【染血航海日誌】",
        resolve(state) {
          state.crew = Math.min(state.maxCrew, state.crew + 1);
          if (!state.clues.includes("clue_logbook")) {
            state.clues.push("clue_logbook");
          }
          return "你秘密將陳七接入船主艙，從佢隨身油布筒入面搵到仲明阿哥親筆記錄嘅羅盤異常日誌。";
        }
      }
    ]
  },
  {
    id: "ev_smuggler",
    title: "暗澳夜燈 · 私商密約",
    art: "assets/events/smuggler.webp",
    speaker: "rival",
    weight: () => 2,
    text: "夜半時分，黑船駛過外伶仃暗澳，一艘掛住紅燈籠嘅雙桅快艇貼近船舷。船頭私商壓低把聲講：「沈船主，我手頭有一批免抽分嘅川藏麝香同湖絲，平過市價三成，敢唔敢接？」",
    choices: [
      {
        label: "「現銀一百二十兩，吃下兩匣麝香同一擔生絲！」",
        sub: "需銀 120 兩：獲得麝香 +2、生絲 +1（遠低於市價）",
        resolve(state) {
          if (state.silver < 120) {
            return "你手頭現銀不足一百二十兩，私商搖頭收起貨匣，駕快艇隱入夜霧之中（未作交易）。";
          }
          const freeSpace = Math.max(0, state.cargoCap - getTotalCargoCount(state.cargo));
          if (freeSpace <= 0) {
            return "底艙已滿（60/60 擔），無處安置私貨，只得婉拒私商（未作交易）。";
          }
          const gotMusk = grantCargo(state, "musk", 2, 90);
          const gotSilk = grantCargo(state, "raw_silk", 1, 30);
          const cost = gotMusk * 45 + gotSilk * 30;
          state.silver = Math.max(0, state.silver - cost);
          return `封蠟完整嘅當門子麝香（+${gotMusk}）與白絲（+${gotSilk}）悄然吊上甲板，共付現銀 ${cost} 兩！`;
        }
      },
      {
        label: "「用三十兩銀向佢買《望海號》失蹤當晚嘅海面情報。」",
        sub: "耗銀 30 兩，推進兄長失蹤真相調查",
        resolve(state) {
          state.silver = Math.max(0, state.silver - 30);
          if (!state.clues.includes("clue_logbook")) {
            state.clues.push("clue_logbook");
          } else if (!state.clues.includes("clue_manila_draft")) {
            state.clues.push("clue_manila_draft");
          }
          return "私商收起銀錠，指向東南方：「舊年八月十五夜，我親眼見裴雷拉嘅《聖十字號》喺擔杆列島外澳換走咗《望海號》嘅生絲！」";
        }
      },
      {
        label: "「沈家行船向來光明磊落，揮手叫佢退開。」",
        sub: "不作私下交易，各埠聲望 +3",
        resolve(state) {
          for (const k of Object.keys(state.reputation)) {
            state.reputation[k] = Math.min(100, state.reputation[k] + 3);
          }
          return "你嚴詞婉拒私貨。消息傳開，各埠官商皆稱讚《黑潮號》船風端正。";
        }
      }
    ]
  },
  {
    id: "ev_customs",
    title: "虎門官舫 · 海道抽分",
    art: "assets/events/customs.webp",
    speaker: "guild_master",
    weight: (route) => (route.from === "guangzhou" || route.to === "guangzhou" || route.from === "macau" ? 3 : 1),
    text: "插住『欽差督理粵海稅務』朱紅帥旗嘅大官舫橫喺航道中央。書辦捧住算盤跳上甲板：「奉海道副使鈞諭，出洋黑船一律按艙丈量抽分！」",
    choices: [
      {
        label: "「呈上同順堂引票，照章繳納五十兩正稅。」",
        sub: "銀兩 -50，廣州與澳門聲望 +5",
        resolve(state) {
          const tax = Math.min(state.silver, 50);
          state.silver -= tax;
          state.reputation.guangzhou = Math.min(100, state.reputation.guangzhou + 5);
          state.reputation.macau = Math.min(100, state.reputation.macau + 5);
          return `你規規矩矩交納 ${tax} 兩丈量銀，稅吏蓋下朱紅驗訖大印，一路綠燈放行。`;
        }
      },
      {
        label: "「請陸神父出面，以自鳴鐘小件同拉丁海圖周旋。」",
        sub: "僅耗銀 20 兩茶敬，順利過關",
        resolve(state) {
          const tip = Math.min(state.silver, 20);
          state.silver -= tip;
          return "陸神父流利嘅官話令老書辦嘖嘖稱奇，收下二十兩茶儀後揮手免去開箱查驗。";
        }
      },
      {
        label: "「爭辯引票早喺廣州完稅，據理力爭！」",
        sub: "不費分文，但耽擱 5 日船期查核檔冊",
        resolve(state) {
          state.daysLeft = Math.max(0, state.daysLeft - 5);
          return "官舫書辦翻查底冊五日，確認同順堂確已預繳引稅，只得放行，惟航期略受延誤。";
        }
      }
    ]
  },
  {
    id: "ev_guild_hall",
    title: "同順堂議價 · 絲割符風聲",
    art: "assets/events/guild_hall.webp",
    speaker: "guild_master",
    weight: () => 2,
    text: "航行途中遇見同順堂快船傳訊，陳萬山派管事送嚟密函：「長崎奉行所同呂宋商館正爭搶今期頭幫湖絲，你若肯分潤少許，老夫可助你抬高到埠售價！」",
    choices: [
      {
        label: "「付四十兩行規銀，換取頭幫絲貨優先交割權！」",
        sub: "耗銀 40 兩，立即獲得 95 兩預付定銀（淨賺 +55 兩）",
        resolve(state) {
          state.silver += 55;
          return "管事當場交付九十五兩足紋定銀，扣除四十兩行規，賬面即刻進賬五十五兩！";
        }
      },
      {
        label: "「婉謝同順堂牽線，留待抵埠後自尋買家。」",
        sub: "保持獨立定價，士氣 +5",
        resolve(state) {
          state.morale = Math.min(100, state.morale + 5);
          return "你決定唔受同順堂掣肘，水手與夥長皆佩服你自立門戶嘅魄力。";
        }
      }
    ]
  },
  {
    id: "ev_chapel",
    title: "海岬鐘聲 · 聖母燈塔",
    art: "assets/events/chapel.webp",
    speaker: "jesuit",
    weight: () => 2,
    text: "暮色四合，海岸高崖上傳來沉穩嘅銅鐘聲。陸神父望向崖頂石堂：「船主，前頭係海員奉祀嘅望海石堂，當年你阿哥出航前曾喺嗰度留低一個銅星盤匣。」",
    choices: [
      {
        label: "「登岸捐獻二十五兩香油銀，取回兄長留低嘅星盤匣！」",
        sub: "耗銀 25 兩，士氣 +10，獲得關鍵線索【耶穌會星盤密語】",
        resolve(state) {
          state.silver = Math.max(0, state.silver - 25);
          state.morale = Math.min(100, state.morale + 10);
          if (!state.clues.includes("clue_jesuit_cipher")) {
            state.clues.push("clue_jesuit_cipher");
          }
          return "守堂老修士將一隻刻有拉丁銘文嘅黃銅星盤交俾你。陸神父譯出背面暗碼：『北緯十九度，擔杆外澳石室，銀契原件在此。』";
        }
      },
      {
        label: "「全船在甲板鳴鐘致意，順風直航不誤船期。」",
        sub: "士氣 +6，不耗銀兩與船期",
        resolve(state) {
          state.morale = Math.min(100, state.morale + 6);
          return "甲板銅鐘與崖頂鐘聲遙相呼應，水手心神安定，黑船乘暮風破浪前行。";
        }
      }
    ]
  },
  {
    id: "ev_shipwreck",
    title: "孤島殘骸 · 望海舊蹤",
    art: "assets/events/shipwreck.webp",
    speaker: "first_mate",
    weight: (route, season, state) => (state.clues.length >= 2 && !state.brotherFound ? 5 : 2),
    text: "濃霧散開，一座嶙峋孤島礁石間赫然卡住半截焦黑嘅黑船船肋！阿海叔眼眶通紅：「船主，睇嗰個船首像——係《望海號》！島上面好似仲有炊煙！」",
    choices: [
      {
        label: "「親率阿海叔與精銳水手登島搜尋兄長下落！」",
        sub: "耗費 5 日船期，打撈白銀 +120 兩，若已集齊線索可尋回兄長沈仲明！",
        resolve(state) {
          state.daysLeft = Math.max(0, state.daysLeft - 5);
          state.silver += 120;
          if (!state.clues.includes("clue_wreck_brother")) {
            state.clues.push("clue_wreck_brother");
          }
          if (state.clues.length >= 3) {
            state.brotherFound = true;
            return "你穿過礁石密林，喺石室入面見到消瘦但精神矍鑠嘅阿哥沈仲明！佢死守住百二十兩官銀同裴雷拉偽造引票嘅鐵證，兩兄弟相擁而泣，隨船同歸澳門！";
          }
          return "你喺殘骸暗格入面起出百二十兩密封丁銀同一塊刻字羅盤，確認阿哥仲明並未罹難，而係轉移去咗附近隱秘澳口！";
        }
      },
      {
        label: "「先派小艇打撈漂浮貨箱，記下礁石座標日後再探。」",
        sub: "獲得白銀 +75 兩、瓷器 +1 箱，不耗船期",
        resolve(state) {
          state.silver += 75;
          const gotPorc = grantCargo(state, "porcelain", 1, 0);
          return gotPorc > 0
            ? "水手從淺灘撈起一隻密封銀匣（得銀 75 兩）同一箱完好無損嘅萬曆青花瓷。"
            : "水手從淺灘撈起一隻密封銀匣（得銀 75 兩）；惟底艙已滿，漂浮瓷箱未能裝船。";
        }
      }
    ]
  }
];

// Port Letters & Petitions (書信 / 堂諭 / 密函) available in ports across the 3 years
export const PORT_LETTERS = [
  {
    id: "let_mother_y1",
    port: "macau",
    minYear: 1,
    sender: "mother",
    title: "南灣家書 · 慈母叮囑",
    stamp: "沈氏家印",
    body: "「季安吾兒：你阿哥仲明出事之後，陳萬山已經三次派人嚟南灣大宅問數。阿娘將嫁妝金釵融咗百二十兩銀交俾你傍身。記住：廣州生絲同青花最平，趁西南風運去長崎或者馬尼拉換銀，千祈唔好空船出海！」",
    choices: [
      {
        label: "「謹遵母命，收下百二十兩私房銀備貨出洋。」",
        effect(state) {
          state.silver += 120;
          state.morale = Math.min(100, state.morale + 5);
          return "你將母親交託嘅百二十兩紋銀鎖入船主樟木箱，暗下決心必保沈家門楣。";
        }
      },
      {
        label: "「留六十兩喺屋企安頓家眷，自己只取六十兩。」",
        effect(state) {
          state.silver += 60;
          state.reputation.macau = Math.min(100, state.reputation.macau + 8);
          state.morale = Math.min(100, state.morale + 8);
          return "沈太夫人含淚點頭，澳門街坊船東皆稱道你孝義雙全（銀 +60，澳門聲望 +8）。";
        }
      }
    ]
  },
  {
    id: "let_guild_y1",
    port: "guangzhou",
    minYear: 1,
    sender: "guild_master",
    title: "同順堂照會 · 頭期湖絲引票",
    stamp: "同順堂記",
    body: "「季安賢姪如晤：令兄所欠三千六百兩船契，首年年底須先還九百兩。老夫念在兩代交情，特批一張『頭綱湖絲折價帖』俾你——今日喺廣州採辦生絲，可額外獲贈兩擔上等白絲，望你莫負老夫美意。」",
    choices: [
      {
        label: "「多謝陳世伯關照，收下兩擔湖州生絲！」",
        effect(state) {
          const added = grantCargo(state, "raw_silk", 2, 0);
          state.reputation.guangzhou = Math.min(100, state.reputation.guangzhou + 5);
          return added > 0
            ? `同順堂管事將 ${added} 擔上等輯里湖絲送入《黑潮號》底艙（生絲 +${added} 擔）。`
            : "同順堂管事送來湖絲，惟《黑潮號》底艙已滿（60/60 擔），只得先行入庫記名（廣州聲望 +5）。";
        }
      },
      {
        label: "「折算成七十兩現銀，並打聽《望海號》當年引票底冊。」",
        effect(state) {
          state.silver += 70;
          if (!state.clues.includes("clue_logbook")) {
            state.clues.push("clue_logbook");
          }
          return "你借核對舊賬之機，發現當年《望海號》嘅副本引票竟然有裴雷拉嘅私印（銀 +70，獲線索）！";
        }
      }
    ]
  },
  {
    id: "let_nagasaki_pancada",
    port: "nagasaki",
    minYear: 1,
    sender: "japanese_merchant",
    title: "長崎奉行所 · 絲割符番銀定約",
    stamp: "末次宗德",
    body: "「沈船主足下：京都西陣織坊今秋急需唐船白絲與絲綢。足下若願與鄙商簽立優先供貨契書，本號即刻奉上百五十兩灰吹丁銀為禮，且本季長崎生絲收購價再提一成！」",
    choices: [
      {
        label: "「與末次宗德簽立契書，收下百五十兩丁銀禮金！」",
        effect(state) {
          state.silver += 150;
          state.reputation.nagasaki = Math.min(100, state.reputation.nagasaki + 10);
          state.activeRumour = {
            id: "rumour_nagasaki_silk",
            port: "nagasaki",
            good: "raw_silk",
            mult: 1.15,
            title: "京都西陣搶絲 · 長崎生絲漲價一成半"
          };
          return "末次宗德雙手奉上百五十兩足色丁銀，長崎埠頭生絲行情應聲大漲！";
        }
      },
      {
        label: "「請末次先生代為查訪舊年有無《望海號》水手流落九州。」",
        effect(state) {
          state.silver += 90;
          if (!state.clues.includes("clue_jesuit_cipher")) {
            state.clues.push("clue_jesuit_cipher");
          }
          return "末次宗德除奉上九十兩茶禮外，更轉交一枚由薩摩漁夫撈獲嘅沈氏銅羅盤（獲關鍵線索）！";
        }
      }
    ]
  },
  {
    id: "let_manila_galleon",
    port: "manila",
    minYear: 1,
    sender: "spanish_factor",
    title: "王室商務署 · 聖菲利普號銀船抵埠",
    stamp: "Factor Real",
    body: "「致《黑潮號》船主：阿卡普爾科大帆船昨日進港，運來墨西哥新鑄八里爾鷹洋二十萬枚！本官急需採購中國雲錦與青花瓷裝船返航，並有一份關於舊年裴雷拉船主匯票嘅密檔可供查閱。」",
    choices: [
      {
        label: "「調閱裴雷拉在馬尼拉嘅秘密銀票底檔！」",
        effect(state) {
          state.silver += 110;
          if (!state.clues.includes("clue_manila_draft")) {
            state.clues.push("clue_manila_draft");
          }
          state.activeRumour = {
            id: "rumour_manila_silk",
            port: "manila",
            good: "silk_fabric",
            mult: 1.18,
            title: "大帆船開倉收貨 · 馬尼拉絲綢溢價近兩成"
          };
          return "唐·阿隆索向你展示秘密銀票：裴雷拉舊年竟喺馬尼拉私售本屬於《望海號》字號嘅四十擔湖絲（銀 +110，獲關鍵線索）！";
        }
      },
      {
        label: "「直接領取百六十兩王室採購預付銀！」",
        effect(state) {
          state.silver += 160;
          state.reputation.manila = Math.min(100, state.reputation.manila + 8);
          return "王室商務署撥付百六十兩鷹洋現銀入賬（銀 +160，馬尼拉聲望 +8）。";
        }
      }
    ]
  },
  {
    id: "let_malacca_spice",
    port: "malacca",
    minYear: 1,
    sender: "first_mate",
    title: "滿剌加椒行 · 蘇門答臘新椒上市",
    stamp: "海峽商館",
    body: "「船主！阿海我剛去過麻六甲河口嘅爪哇椒行，今年蘇門答臘烏椒大熟，行商願意半買半送批俾我哋三包上等胡椒同兩束蘇木，運返廣州或者長崎包賺大錢！」",
    choices: [
      {
        label: "「即刻收下三包胡椒同兩束蘇木裝入底艙！」",
        effect(state) {
          const gotPep = grantCargo(state, "pepper", 3, 0);
          const gotSap = grantCargo(state, "sappanwood", 2, 0);
          return gotPep + gotSap > 0
            ? `水手將滿剌加烏椒（+${gotPep}）與蘇木（+${gotSap}）搬入底艙。`
            : "底艙已滿（60/60 擔），未能裝入額外椒木，請先騰出艙位。";
        }
      },
      {
        label: "「轉手批俾在埠唐船，即場套現百三十兩現銀！」",
        effect(state) {
          state.silver += 130;
          state.reputation.malacca = Math.min(100, state.reputation.malacca + 6);
          return "你當場將批條轉讓予趕時間返航嘅福建商船，淨賺百三十兩現銀！";
        }
      }
    ]
  },
  {
    id: "let_jesuit_cipher_y2",
    port: "macau",
    minYear: 2,
    sender: "jesuit",
    title: "聖保祿書房 · 星盤密文破譯",
    stamp: "S.J. Macau",
    body: "「季安賢弟：經過半載比對令兄仲明留低嘅星象手稿與航海日誌，我終於解開《望海號》失蹤當日嘅針路謎團！裴雷拉買通咗船上副手喺羅盤底座暗藏磁石，令《望海號》偏航駛入擔杆列島外澳！」",
    choices: [
      {
        label: "「收好星盤密文海圖，出海查齊其餘鐵證！」",
        effect(state) {
          if (!state.clues.includes("clue_jesuit_cipher")) {
            state.clues.push("clue_jesuit_cipher");
          }
          state.morale = Math.min(100, state.morale + 10);
          return "你獲悉擔杆外澳座標（獲得線索【耶穌會星盤密語】）！集齊航海日誌、馬尼拉密檔與星盤密語三項鐵證後，即可尋回兄長！";
        }
      },
      {
        label: "「憑星盤密文向議事亭申訴，先領八十兩查案津貼！」",
        effect(state) {
          state.silver += 80;
          if (!state.clues.includes("clue_jesuit_cipher")) {
            state.clues.push("clue_jesuit_cipher");
          }
          return "議事亭大法官收下星盤拓片備案，撥付八十兩查案銀（銀 +80，獲線索【耶穌會星盤密語】）！";
        }
      }
    ]
  },
  {
    id: "let_brother_rescue_y2",
    port: "guangzhou",
    minYear: 2,
    requiresClues: ["clue_logbook", "clue_manila_draft", "clue_jesuit_cipher"],
    condition(state) {
      return ["clue_logbook", "clue_manila_draft", "clue_jesuit_cipher"].every(c =>
        state.clues && state.clues.includes(c)
      );
    },
    sender: "first_mate",
    title: "擔杆密信 · 仲明兄長親筆蠟丸",
    stamp: "沈仲明印",
    body: "「季安吾弟親啟：見你已查獲航海日誌、馬尼拉銀票同聖保祿星盤三項鐵證，愚兄終可現身！舊年《望海號》觸礁後，我隱於擔杆外澳石室死守同順堂原件銀契。隨信附上身邊僅存嘅六十兩碎銀助你修船！」",
    choices: [
      {
        label: "「按星盤座標派快艇接回兄長仲明與原件銀契！」",
        effect(state) {
          state.silver += 60;
          if (!state.clues.includes("clue_wreck_brother")) {
            state.clues.push("clue_wreck_brother");
          }
          state.brotherFound = true;
          return "仲明阿哥攜帶原件銀契與六十兩隨身丁銀秘密登船！全船老水手熱淚盈眶，只待清償同順堂債務便可雙帆歸澳！";
        }
      },
      {
        label: "「接回兄長並將三方鐵證呈交海道衙門備案！」",
        effect(state) {
          state.silver += 80;
          if (!state.clues.includes("clue_wreck_brother")) {
            state.clues.push("clue_wreck_brother");
          }
          state.brotherFound = true;
          state.reputation.guangzhou = Math.min(100, state.reputation.guangzhou + 10);
          return "海道衙門核實三項鐵證，發還八十兩保證銀，仲明阿哥亦平安回到《黑潮號》！";
        }
      }
    ]
  }
];

export const ENDINGS = {
  ending_truth: {
    id: "ending_truth",
    badge: "真局 · 雙帆歸澳",
    title: "真相大白 · 望海重光",
    latin: "Veritas et Victoria · A Dupla Nau de Macau",
    art: "assets/endings/ending_truth.webp",
    summary: "你不但如期還清廣州十三行三千六百兩巨債，更憑住星盤密語與航海日誌，喺孤島外澳尋回失蹤經年嘅兄長沈仲明，當眾揭穿裴雷拉掉包羅盤、侵吞湖絲嘅陰謀！",
    epilogue: "萬曆三十年冬，南灣海面金雲漫捲。《黑潮號》與重修一新嘅《望海號》並肩駛入澳門內港。聖保祿教堂銅鐘齊鳴，沈太夫人立於石階之上，望住兩兄弟步下跳板，沈氏黑船字號自此威震東西洋。"
  },
  ending_fortune: {
    id: "ending_fortune",
    badge: "上局 · 富甲南洋",
    title: "黑船盟主 · 萬兩歸倉",
    latin: "Fortuna Major · Capitão-Mor do Mar da China",
    art: "assets/endings/ending_fortune.webp",
    summary: "你精準把握每一季東北與西南季風，以湖絲易長崎丁銀、以雲錦換呂宋鷹洋、以青花博滿剌加烏椒。三載期滿，同順堂銀契一筆勾銷，沈家庫房更積下逾千兩巨富！",
    epilogue: "廣州十三行陳萬山親赴澳門南灣，雙手奉還沈氏船契並請你出任新一年黑船大航總船主。昔日瀕臨破產嘅沈家，喺你手上化為縱橫九州與南洋嘅海上豪門。"
  },
  ending_survival: {
    id: "ending_survival",
    badge: "正局 · 守業安瀾",
    title: "贖契歸宗 · 煙火如常",
    latin: "Portus Salutis · Casa Preservada",
    art: "assets/endings/ending_survival.webp",
    summary: "三年風浪、幾度死生。你頂住颶風與海寇，一分一毫積攢絲銀，終於喺第三年大限之日將三千六百兩本息悉數清償，保住咗《黑潮號》與南灣祖宅。",
    epilogue: "當陳萬山喺銀契蓋下『本利兩清』朱印嗰一刻，窗外正好吹起溫潤嘅春風。雖然海路依然險惡，但只要《黑潮號》嘅龍骨仲喺度，沈家嘅燈火就唔會熄滅。"
  },
  ending_ruin: {
    id: "ending_ruin",
    badge: "敗局 · 折檣抵債",
    title: "船封澳口 · 望海興嘆",
    latin: "Naufrágio da Casa · Navio Penhorado",
    art: "assets/endings/ending_ruin.webp",
    summary: "季風無情，銀契如山。由於未能如期清償廣州同順堂嘅到期銀款（或黑船於海上損毀殆盡），《黑潮號》被官差與行商貼上封條抵債。",
    epilogue: "暮雨瀟瀟，南灣碼頭只剩低鐵鏈鎖舵嘅空船。阿海叔拍拍你嘅膊頭：「船主，留得青山在，哪怕冇柴燒？熟記今次嘅針路同風向，他日我哋定能再起風帆。」"
  }
};

// Compute live buy and sell prices for a good at a given port & game state
export function getGoodPrice(state, portId, goodId) {
  const port = PORTS[portId] || PORTS.macau;
  const good = GOODS.find(g => g.id === goodId);
  if (!good) return { buy: 10, sell: 9, tag: "平" };

  const baseMult = (port.priceMultipliers && port.priceMultipliers[goodId]) || 1.0;
  const seasonMap = (port.seasonalMod && port.seasonalMod[state.season]) || {};
  const seasonMult = seasonMap[goodId] || 1.0;

  // Rumour bonus
  let rumourMult = 1.0;
  if (
    state.activeRumour &&
    state.activeRumour.port === portId &&
    state.activeRumour.good === goodId
  ) {
    rumourMult = state.activeRumour.mult || 1.15;
  }

  // Local market pressure from recent player trades (-0.20 to +0.25)
  const pKey = `${portId}_${goodId}`;
  const pressure = (state.marketPressure && state.marketPressure[pKey]) || 0;
  const pressureMult = Math.max(0.80, Math.min(1.25, 1 + pressure * 0.015));

  // Reputation spread improvement (higher reputation lowers buy price slightly and raises sell price)
  const rep = (state.reputation && state.reputation[portId]) || 50;
  const repBonus = Math.max(-0.03, Math.min(0.05, (rep - 50) * 0.001));

  const midPrice = good.basePrice * baseMult * seasonMult * rumourMult * pressureMult;
  const buy = Math.max(4, Math.round(midPrice * (1.03 - repBonus * 0.5)));
  const sell = Math.max(3, Math.min(buy - 1, Math.round(midPrice * (0.96 + repBonus))));

  let tag = "常價";
  let tagClass = "normal";
  if (baseMult * seasonMult * rumourMult <= 0.78) {
    tag = "產地低價";
    tagClass = "cheap";
  } else if (baseMult * seasonMult * rumourMult >= 1.42) {
    tag = "高價渴市";
    tagClass = "dear";
  }

  return { buy, sell, mid: Math.round(midPrice), tag, tagClass };
}

export function getTotalCargoCount(cargo) {
  if (!cargo) return 0;
  return Object.values(cargo).reduce((acc, v) => acc + (Number.isFinite(v) ? Math.max(0, v) : 0), 0);
}

export function grantCargo(state, goodId, qty, costBasisAdd = 0) {
  const req = Math.max(0, Math.floor(Number(qty) || 0));
  if (req <= 0) return 0;
  const currentCargo = getTotalCargoCount(state.cargo);
  const freeSpace = Math.max(0, state.cargoCap - currentCargo);
  const actualQty = Math.min(req, freeSpace);
  if (actualQty <= 0) return 0;
  state.cargo[goodId] = (state.cargo[goodId] || 0) + actualQty;
  if (costBasisAdd > 0) {
    const scaledBasis = Math.round(costBasisAdd * (actualQty / req));
    state.cargoCostBasis[goodId] = (state.cargoCostBasis[goodId] || 0) + scaledBasis;
  }
  return actualQty;
}

export function getCargoValuation(state, portId = state.port) {
  let total = 0;
  for (const g of GOODS) {
    const qty = (state.cargo && state.cargo[g.id]) || 0;
    if (qty > 0) {
      const { sell } = getGoodPrice(state, portId, g.id);
      total += qty * sell;
    }
  }
  return total;
}
