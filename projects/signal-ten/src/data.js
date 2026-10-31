// 十號風球 · Signal Ten (1962) — Historical Data, 1962 Signal System & 4-Storm Campaign

export const CHART_BOUNDS = {
  minLat: 14.0,
  maxLat: 25.0,
  minLon: 108.0,
  maxLon: 123.0,
  // Map inner frame on 840x630 chart_base.webp: ML=46, MT=38, MW=766, MH=558
  leftPct: (46 / 840) * 100,
  topPct: (38 / 630) * 100,
  widthPct: (766 / 840) * 100,
  heightPct: (558 / 630) * 100
};

export function projectLatLon(lat, lon) {
  const xRatio = (lon - CHART_BOUNDS.minLon) / (CHART_BOUNDS.maxLon - CHART_BOUNDS.minLon);
  const yRatio = (CHART_BOUNDS.maxLat - lat) / (CHART_BOUNDS.maxLat - CHART_BOUNDS.minLat);
  const xPct = CHART_BOUNDS.leftPct + xRatio * CHART_BOUNDS.widthPct;
  const yPct = CHART_BOUNDS.topPct + yRatio * CHART_BOUNDS.heightPct;
  return {
    xPct: Math.max(2, Math.min(98, Number(xPct.toFixed(2)))),
    yPct: Math.max(2, Math.min(98, Number(yPct.toFixed(2))))
  };
}

// Historical 1962 Hong Kong Tropical Cyclone Warning Signals (pre-1973 numbering)
export const SIGNALS_1962 = [
  {
    code: 0,
    shortZh: '除下風球',
    nameZh: '無風球訊號（海面平靜／解除威脅）',
    nameEn: 'No Signal / All Clear',
    windCriterion: '持續風力低於 22 節，香港 800 公里內無威脅或風暴已遠離',
    shapeZh: '訊號架懸空',
    lightsZh: '無燈號',
    lights: ['OFF', 'OFF', 'OFF'],
    quadrant: 'NONE',
    severity: 0,
    art: 'assets/signals/sig_0.webp',
    effectDesc: '渡輪、電車及碼頭起卸維持正常運作；避風塘不作特別封鎖。'
  },
  {
    code: 1,
    shortZh: '一號戒備',
    nameZh: '一號戒備訊號',
    nameEn: 'Signal No. 1 · Standby',
    windCriterion: '熱帶氣旋集結於香港約 800 公里內，可能影響本港',
    shapeZh: '正 T 字形（⊤）',
    lightsZh: '白 · 白 · 白',
    lights: ['W', 'W', 'W'],
    quadrant: 'STANDBY',
    severity: 1,
    art: 'assets/signals/sig_1.webp',
    effectDesc: '通知海事處、水警及遠洋船隻戒備；離岸漁船開始留意電台廣播，市面照常。'
  },
  {
    code: 3,
    shortZh: '三號強風',
    nameZh: '三號強風訊號',
    nameEn: 'Signal No. 3 · Strong Wind',
    windCriterion: '維港及離岸吹強風（22–33 節，陣風可達 45 節）',
    shapeZh: '倒 T 字形（⊥）',
    lightsZh: '綠 · 白 · 綠',
    lights: ['G', 'W', 'G'],
    quadrant: 'STRONG',
    severity: 2,
    art: 'assets/signals/sig_3.webp',
    effectDesc: '避風塘小艇及漁船回港避風，天星小輪及港外線渡輪加強戒備，地盤加固竹棚。'
  },
  {
    code: 5,
    shortZh: '五號西北烈風',
    nameZh: '五號烈風訊號（西北）',
    nameEn: 'Signal No. 5 · NW Gale',
    windCriterion: '西北象限烈風（34–63 節）；風暴通常位於香港東面或東北偏近處',
    shapeZh: '單個尖端向上黑錐體（▲）',
    lightsZh: '白 · 綠 · 綠',
    lights: ['W', 'G', 'G'],
    quadrant: 'NW',
    severity: 3,
    art: 'assets/signals/sig_5.webp',
    effectDesc: '全港停工停課、天星小輪及九巴陸續停駛；碼頭針對西北狂風加纜。'
  },
  {
    code: 6,
    shortZh: '六號西南烈風',
    nameZh: '六號烈風訊號（西南）',
    nameEn: 'Signal No. 6 · SW Gale',
    windCriterion: '西南象限烈風（34–63 節）；風暴已移至香港西面或西北面，吹回南／西南烈風',
    shapeZh: '單個尖端向下黑錐體（▼）',
    lightsZh: '綠 · 白 · 白',
    lights: ['G', 'W', 'W'],
    quadrant: 'SW',
    severity: 3,
    art: 'assets/signals/sig_6.webp',
    effectDesc: '全港停工停市；避風塘西口湧浪極大，船隻須防範回南風湧浪拍岸。'
  },
  {
    code: 7,
    shortZh: '七號東北烈風',
    nameZh: '七號烈風訊號（東北）',
    nameEn: 'Signal No. 7 · NE Gale',
    windCriterion: '東北象限烈風（34–63 節）；風暴位於香港南面或東南面逼近時最常懸掛',
    shapeZh: '兩個尖端向上黑錐體疊掛（▲/▲）',
    lightsZh: '綠 · 綠 · 白',
    lights: ['G', 'G', 'W'],
    quadrant: 'NE',
    severity: 3,
    art: 'assets/signals/sig_7.webp',
    effectDesc: '全港停工停課、渡輪停航、商戶貼米字膠紙；吐露港及東北沿岸防範海水倒灌。'
  },
  {
    code: 8,
    shortZh: '八號東南烈風',
    nameZh: '八號烈風訊號（東南）',
    nameEn: 'Signal No. 8 · SE Gale',
    windCriterion: '東南象限烈風（34–63 節）；風暴位於香港西南偏南或正南近距掠過',
    shapeZh: '兩個尖端向下黑錐體疊掛（▼/▼）',
    lightsZh: '白 · 白 · 綠',
    lights: ['W', 'W', 'G'],
    quadrant: 'SE',
    severity: 3,
    art: 'assets/signals/sig_8.webp',
    effectDesc: '全港停工停市、電車巴士停駛；維港東口及鯉魚門湧浪猛烈。'
  },
  {
    code: 9,
    shortZh: '九號烈風增強',
    nameZh: '九號烈風或暴風風力增強訊號',
    nameEn: 'Signal No. 9 · Increasing Gale/Storm',
    windCriterion: '烈風風力現正顯著增強，中心極為接近，隨時達颶風程度（50–63+ 節）',
    shapeZh: '兩個黑錐體尖端相對如沙漏（▼/▲）',
    lightsZh: '綠 · 綠 · 綠',
    lights: ['G', 'G', 'G'],
    quadrant: 'INCREASING',
    severity: 4,
    art: 'assets/signals/sig_9.webp',
    effectDesc: '全城進入緊急戒備，水警強制撤離沿岸棚屋及低窪艇戶，所有路面交通中斷。'
  },
  {
    code: 10,
    shortZh: '十號颶風',
    nameZh: '十號颶風訊號',
    nameEn: 'Signal No. 10 · Hurricane',
    windCriterion: '持續風力達颶風程度（64 節或以上，陣風逾 100 節），颱風眼壁正面襲港',
    shapeZh: '黑色十字架形（✚）',
    lightsZh: '紅 · 綠 · 紅',
    lights: ['R', 'G', 'R'],
    quadrant: 'HURRICANE',
    severity: 5,
    art: 'assets/signals/sig_10.webp',
    effectDesc: '最高級別熱帶氣旋警告！防空警報器長鳴，全港市民死守室內，海陸全面封鎖。'
  }
];

export const SIGNAL_BY_CODE = Object.fromEntries(SIGNALS_1962.map((s) => [s.code, s]));

export const CHARACTERS = {
  lam: {
    id: 'lam',
    nameZh: '林先生',
    roleZh: '高級科學助理（繪圖員）',
    portrait: 'assets/people/lam.webp'
  },
  director: {
    id: 'director',
    nameZh: '顏士爾台長',
    roleZh: '香港皇家天文台台長',
    portrait: 'assets/people/director.webp'
  },
  ho_sir: {
    id: 'ho_sir',
    nameZh: '水警何幫辦',
    roleZh: '海事處／水警輪值日官',
    portrait: 'assets/people/ho_sir.webp'
  },
  radio_officer: {
    id: 'radio_officer',
    nameZh: '報務員阿良',
    roleZh: '鶴咀／天文台電報房主任',
    portrait: 'assets/people/radio_officer.webp'
  },
  ah_shing: {
    id: 'ah_shing',
    nameZh: '信號員阿成',
    roleZh: '天文台山訊號絞車班長',
    portrait: 'assets/people/ah_shing.webp'
  },
  coxswain: {
    id: 'coxswain',
    nameZh: '漁民陳伯',
    roleZh: '油麻地避風塘大眼雞船主',
    portrait: 'assets/people/coxswain.webp'
  },
  mrs_chan: {
    id: 'mrs_chan',
    nameZh: '陳師奶',
    roleZh: '觀塘山邊木屋區街坊',
    portrait: 'assets/people/mrs_chan.webp'
  },
  sau_lan: {
    id: 'sau_lan',
    nameZh: '周秀蘭',
    roleZh: '麗的呼聲／香港電台播音員',
    portrait: 'assets/people/sau_lan.webp'
  }
};

export const INITIAL_METRICS = {
  livesRisk: 8,         // 人命風險 (0..100, lower is better)
  disruptionCost: 6,    // 市面損失 (0..100, lower is better)
  publicTrust: 78,      // 公信力 (0..100, higher is better)
  directorTrust: 76,    // 台長信任 (0..100, higher is better)
  stamina: 88           // 身心體力 (0..100, higher is better)
};

export const STORMS = [
  // =========================================================================
  // STORM 1: 熱帶風暴凱蒂 (TROPICAL STORM KATE) — Early August 1962 (5 Shifts)
  // Calibration storm: enters South China Sea via Bashi Channel, edges within
  // 340 km SE of Hong Kong (warranting No. 1 then No. 3), then recurves NE
  // toward Taiwan Strait without bringing gale-force winds to Victoria Harbour.
  // =========================================================================
  {
    id: 'storm1_kate',
    index: 1,
    codeEn: 'TROPICAL STORM KATE',
    nameZh: '熱帶風暴凱蒂',
    subtitleZh: '一九六二年八月上旬 · 初試啼聲（共五更）',
    dateRangeZh: '一九六二年八月四日至五日',
    coverArt: 'assets/storms/storm1_kate.webp',
    introBriefZh:
      '八月初，呂宋海峽有一熱帶低氣壓增強為熱帶風暴「凱蒂」。你剛晉升為尖沙咀彌敦道皇家天文台值班預報主任，台長顏士爾博士叮囑你：「香港六百萬市民與維港數千艘船隻，皆仰賴天文台山訊號架上的一舉一動。切記不可漏報強風，亦不可妄掛五號以上烈風訊號令全港無故停擺。」',
    historyPoints: [
      { lat: 18.8, lon: 120.4, label: '03/18Z' },
      { lat: 19.3, lon: 119.2, label: '04/00Z' }
    ],
    shifts: [
      {
        shiftNum: 1,
        timeZh: '八月四日 08:00 · 早更第一報',
        skyClass: 'sky-calm',
        windIntensity: 0.16,
        hkObs: {
          pressureMb: 1004.8,
          pressureTrendZh: '微跌 (-0.8 mb / 3h)',
          windDirZh: '東風 (E)',
          windKt: 12,
          gustKt: 19,
          waglanDirZh: '東北偏東 (ENE)',
          waglanKt: 16,
          waglanGustKt: 23,
          rainMmHr: 0.5,
          tideM: 1.6,
          distKm: 520,
          bearingZh: '東南偏東 (ESE)'
        },
        telegrams: [
          {
            id: 'kate_s1_t1',
            fromZh: '東沙島氣象台 (PRATAS 59792)',
            typeZh: '地面實測電報',
            timeStamp: '040000Z',
            rawCode: 'SYNOP 59792 040000Z 05024KT 998.4MB QNH FALLING',
            textZh: '東沙島實測東北風 24 節，氣壓 998.4 毫巴並持續下降，海面湧浪漸起，估計風暴中心位於東沙東南偏東約 180 海里。',
            fix: { lat: 19.8, lon: 118.4, source: 'PRATAS', radiusDeg: 0.55 }
          },
          {
            id: 'kate_s1_t2',
            fromZh: '英國貨輪「太古號」(MV TAIKOO)',
            typeZh: '船舶無線電報',
            timeStamp: '032330Z',
            rawCode: 'SHIP MV TAIKOO 19.5N 118.8E WIND NE 32KT BARO 993MB',
            textZh: '太古號於北緯 19.5 度、東經 118.8 度遇上狂風驟雨，東北風 32 節，氣壓低見 993 毫巴，羅經顯示低壓中心就在船南面不遠。',
            fix: { lat: 19.5, lon: 118.7, source: 'SHIP', radiusDeg: 0.65 }
          },
          {
            id: 'kate_s1_t3',
            fromZh: '馬尼拉氣象局 (MANILA WARNING)',
            typeZh: '鄰台警告電報',
            timeStamp: '032100Z',
            rawCode: 'WTPH MANILA TS KATE 19.9N 118.1E MOV WNW 10KT MAX 40KT',
            textZh: '馬尼拉定位偏北：指凱蒂已進入北緯 19.9 度、東經 118.1 度（香港東南偏東約 490 公里），向西北偏西移動，中心風力 40 節。',
            fix: { lat: 19.9, lon: 118.1, source: 'MANILA', radiusDeg: 0.70 }
          }
        ],
        tracks: [
          {
            id: 'A',
            labelZh: 'A 線：西行直趨珠江口（時速 12 節）',
            descZh: '假設副熱帶高壓堅挺，引導凱蒂直接西行逼近香港 150 公里內。',
            waypoints: [
              { lat: 19.7, lon: 118.4 },
              { lat: 20.5, lon: 116.6 },
              { lat: 21.6, lon: 114.8 }
            ]
          },
          {
            id: 'B',
            labelZh: 'B 線：西北偏西緩進東沙以北（時速 9 節）',
            descZh: '綜合太古號與東沙氣壓梯度，風暴先向西北偏西緩行，與本港保持約 380–450 公里距離。',
            waypoints: [
              { lat: 19.7, lon: 118.4 },
              { lat: 20.2, lon: 117.5 },
              { lat: 20.8, lon: 116.8 }
            ]
          },
          {
            id: 'C',
            labelZh: 'C 線：即刻原地北折入台灣海峽',
            descZh: '預料風暴立即轉向正北，完全不進入南海北部。',
            waypoints: [
              { lat: 19.7, lon: 118.4 },
              { lat: 21.2, lon: 118.6 },
              { lat: 22.8, lon: 119.2 }
            ]
          }
        ],
        recommendedTrack: 'B',
        recommendedSignal: 1,
        acceptableSignals: [1],
        actualPos: { lat: 19.7, lon: 118.4, label: '04/00Z' },
        colleaguePrompt: {
          speaker: 'lam',
          textZh: '「主任，『凱蒂』已經踏入本港八百公里警戒圈，東沙島氣壓跌穿一千毫巴。維港而家仲係風平浪靜，只吹十二節東風，係咪先掛起一號戒備訊號（正 T 字），通知海事處同遠洋船留神？」'
        },
        outcomes: {
          exact: {
            sceneArt: 'assets/scenes/mast_hoist.webp',
            speaker: 'ah_shing',
            headlineZh: '天文台山升起一號正 T 戒備訊號',
            bodyZh: '信號員阿成轉動絞車，黑色正 T 字訊號升上尖沙咀訊號架。維港渡輪及中環街市運作如常，油麻地及銅鑼灣避風塘的漁民開始收聽電台留意風暴動向。'
          },
          under: {
            sceneArt: 'assets/scenes/junk_at_sea.webp',
            speaker: 'ho_sir',
            headlineZh: '未發戒備訊號，離岸漁船毫無防備',
            bodyZh: '水警何幫辦來電查詢：「東沙同馬尼拉都出咗風暴警報，點解天文台山仲未掛一號風球？幾十艘大眼雞漁船仲喺擔竿列島外海落網！」'
          },
          over: {
            sceneArt: 'assets/scenes/shelter_empty.webp',
            speaker: 'director',
            headlineZh: '風暴尚在五百公里外，過早掛高風球引來非議',
            bodyZh: '維港海面僅有微風，但高掛強風或烈風訊號令碼頭苦力及渡輪公司大為錯愕，九龍倉洋行致電台長室投訴天文台小題大做。'
          }
        }
      },
      {
        shiftNum: 2,
        timeZh: '八月四日 14:00 · 午更第二報',
        skyClass: 'sky-breeze',
        windIntensity: 0.25,
        hkObs: {
          pressureMb: 1002.4,
          pressureTrendZh: '續跌 (-2.4 mb / 6h)',
          windDirZh: '東北偏東 (ENE)',
          windKt: 17,
          gustKt: 26,
          waglanDirZh: '東北 (NE)',
          waglanKt: 21,
          waglanGustKt: 30,
          rainMmHr: 2.1,
          tideM: 1.9,
          distKm: 410,
          bearingZh: '東南偏東 (ESE)'
        },
        telegrams: [
          {
            id: 'kate_s2_t1',
            fromZh: '美軍關島氣象偵察機 (USAF GULL 04)',
            typeZh: '飛機投落儀電報',
            timeStamp: '040530Z',
            rawCode: 'RECCO GULL04 FIX 20.1N 117.6E 990MB MAX WIND 45KT RADAR OPEN EYE',
            textZh: '美軍偵察機穿入凱蒂中心，測定位置北緯 20.1 度、東經 117.6 度，中心氣壓 990 毫巴，最大風速 45 節，風暴結構北強南弱。',
            fix: { lat: 20.1, lon: 117.6, source: 'RECON', radiusDeg: 0.35 }
          },
          {
            id: 'kate_s2_t2',
            fromZh: '東沙島氣象台 (PRATAS 59792)',
            typeZh: '地面實測電報',
            timeStamp: '040600Z',
            rawCode: 'SYNOP 59792 040600Z 02034KT 994.2MB HEAVY SQUALLS',
            textZh: '東沙島吹北至東北偏北烈風 34 節，氣壓 994.2 毫巴，顯示凱蒂正從東沙東北面約 60 海里掠過。',
            fix: { lat: 20.3, lon: 117.4, source: 'PRATAS', radiusDeg: 0.50 }
          },
          {
            id: 'kate_s2_t3',
            fromZh: '橫瀾島燈塔 (WAGLAN ISLAND)',
            typeZh: '本港外島實測',
            timeStamp: '040600Z',
            rawCode: 'WAGLAN 040600Z WIND NE 21KT GUST 30KT SWELL MODERATE SE',
            textZh: '橫瀾島燈塔報告東北風升至 21 節，陣風 30 節，東南湧浪拍岸；維港內仍只有 17 節清勁東風。',
            fix: { lat: 19.9, lon: 117.8, source: 'SHIP', radiusDeg: 0.65 }
          }
        ],
        tracks: [
          {
            id: 'A',
            labelZh: 'A 線：加速西撲香港南面擔竿水道',
            descZh: '預測凱蒂在 18 小時內直撲香港以南 80 公里，明晨須掛八號或十號風球。',
            waypoints: [
              { lat: 20.1, lon: 117.6 },
              { lat: 21.1, lon: 115.8 },
              { lat: 21.9, lon: 114.2 }
            ]
          },
          {
            id: 'B',
            labelZh: 'B 線：西北偏西推進至北緯 20.7 度、東經 116.9 度',
            descZh: '按偵察機定位，凱蒂今晚逼近至香港東南偏東約 340 公里，外圍強風帶將觸及橫瀾島與維港。',
            waypoints: [
              { lat: 20.1, lon: 117.6 },
              { lat: 20.7, lon: 116.9 },
              { lat: 21.5, lon: 117.1 }
            ]
          },
          {
            id: 'C',
            labelZh: 'C 線：向東南倒退回呂宋島',
            descZh: '假設風暴減弱並向東南退卻。',
            waypoints: [
              { lat: 20.1, lon: 117.6 },
              { lat: 19.3, lon: 118.5 },
              { lat: 18.5, lon: 119.4 }
            ]
          }
        ],
        recommendedTrack: 'B',
        recommendedSignal: 1,
        acceptableSignals: [1, 3],
        actualPos: { lat: 20.1, lon: 117.6, label: '04/06Z' },
        colleaguePrompt: {
          speaker: 'lam',
          textZh: '「橫瀾島風力啱啱到 21 節，差少少先踩入 22 節強風門檻，維港入面仲係 17 節。維持一號戒備訊號定係提早改掛三號強風，就要睇你點平衡市面同漁船喇。」'
        },
        outcomes: {
          exact: {
            sceneArt: 'assets/scenes/radio_crowd.webp',
            speaker: 'sau_lan',
            headlineZh: '維持戒備訊號，電台加密播報外海湧浪',
            bodyZh: '麗的呼聲與香港電台每小時插播天文台簡報，提醒外海漁船傍晚前駛入避風塘，而市區工廠與碼頭得以順利完成日間交貨。'
          },
          under: {
            sceneArt: 'assets/scenes/junk_at_sea.webp',
            speaker: 'coxswain',
            headlineZh: '訊號架空置，漁民誤判天氣出海',
            bodyZh: '油麻地陳伯埋怨：「東沙都吹緊三十幾節風，天文台竟然連一號都唔掛，害到幾條船出咗去果洲群島捱大浪！」'
          },
          over: {
            sceneArt: 'assets/scenes/shelter_empty.webp',
            speaker: 'director',
            headlineZh: '過早懸掛烈風訊號，全城停工卻僅見微雨',
            bodyZh: '尖沙咀與中環街頭只有清勁涼風，市民望著高懸的烈風錐體議論紛紛，台長顏士爾皺眉道：「烈風訊號代表 34 節以上狂風，絕不可草率！」'
          }
        }
      },
      {
        shiftNum: 3,
        timeZh: '八月四日 20:00 · 夜更第三報（最接近本港）',
        skyClass: 'sky-strong',
        windIntensity: 0.42,
        hkObs: {
          pressureMb: 999.8,
          pressureTrendZh: '最低點 (-2.6 mb / 6h)',
          windDirZh: '東北 (NE)',
          windKt: 25,
          gustKt: 38,
          waglanDirZh: '東北 (NE)',
          waglanKt: 29,
          waglanGustKt: 43,
          rainMmHr: 6.8,
          tideM: 2.1,
          distKm: 335,
          bearingZh: '東南偏東 (ESE)'
        },
        telegrams: [
          {
            id: 'kate_s3_t1',
            fromZh: '橫瀾島燈塔 (WAGLAN ISLAND)',
            typeZh: '本港外島實測',
            timeStamp: '041200Z',
            rawCode: 'WAGLAN 041200Z WIND NE 29KT GUST 43KT HEAVY RAIN SQUALLS',
            textZh: '入夜後外圍雨帶掃過香港，橫瀾島持續東北風達 29 節、陣風 43 節；維港天星碼頭亦錄得 25 節強風，白頭浪拍打海旁。',
            fix: { lat: 20.6, lon: 116.8, source: 'PRATAS', radiusDeg: 0.45 }
          },
          {
            id: 'kate_s3_t2',
            fromZh: '荷蘭郵輪「鹿特丹號」(SS ROTTERDAM)',
            typeZh: '船舶無線電報',
            timeStamp: '041130Z',
            rawCode: 'SHIP ROTTERDAM 20.7N 117.1E WIND SSW 38KT BARO 991MB MOV NNW',
            textZh: '鹿特丹號於北緯 20.7 度、東經 117.1 度吹西南偏南風 38 節，報告高空引導氣流正轉為偏南，風暴開始減慢並有轉向偏北跡象。',
            fix: { lat: 20.7, lon: 117.0, source: 'SHIP', radiusDeg: 0.50 }
          },
          {
            id: 'kate_s3_t3',
            fromZh: '台北氣象所 (TAIPEI 46692)',
            typeZh: '高空槽線分析',
            timeStamp: '041200Z',
            rawCode: 'UPPER TROUGH PASSING 116E STEERING KATE NNE TOWARD FORMOSA STRAIT',
            textZh: '台北高空分析指東經 116 度有西風槽東移，高壓脊東退，預料凱蒂於東經 117 度附近轉向東北偏北移動，不會登陸廣東珠江口。',
            fix: { lat: 20.8, lon: 116.9, source: 'TAIPEI', radiusDeg: 0.55 }
          }
        ],
        tracks: [
          {
            id: 'A',
            labelZh: 'A 線：西折直襲香港大鵬灣',
            descZh: '無視西風槽分析，預測凱蒂明晨正面登陸香港。',
            waypoints: [
              { lat: 20.7, lon: 116.9 },
              { lat: 21.6, lon: 115.3 },
              { lat: 22.3, lon: 114.3 }
            ]
          },
          {
            id: 'B',
            labelZh: 'B 線：於東沙東北面慢行並轉向東北偏北（NNE）',
            descZh: '結合船舶西南風與高空槽線，預測凱蒂今晚最接近本港（約 335 公里），隨後北折趨向台灣海峽。',
            waypoints: [
              { lat: 20.7, lon: 116.9 },
              { lat: 21.6, lon: 117.3 },
              { lat: 22.8, lon: 118.2 }
            ]
          },
          {
            id: 'C',
            labelZh: 'C 線：南下消散於西沙海面',
            descZh: '預測風暴突然掉頭向南移動。',
            waypoints: [
              { lat: 20.7, lon: 116.9 },
              { lat: 19.4, lon: 116.2 },
              { lat: 18.0, lon: 115.5 }
            ]
          }
        ],
        recommendedTrack: 'B',
        recommendedSignal: 3,
        acceptableSignals: [3],
        actualPos: { lat: 20.7, lon: 116.9, label: '04/12Z' },
        colleaguePrompt: {
          speaker: 'ho_sir',
          textZh: '「天文台？我係水警何幫辦！鯉魚門同維港而家吹緊 25 節東北強風，陣風成 38 節，油麻地避風塘外便啲大眼雞同躉船拋到七彩，快啲掛三號強風訊號（綠·白·綠）啦！不過台北話個風就快北轉，千祈唔好亂掛七號烈風呀！」'
        },
        outcomes: {
          exact: {
            sceneArt: 'assets/scenes/shelter.webp',
            speaker: 'coxswain',
            headlineZh: '改掛三號強風訊號（綠·白·綠），避風塘秩序井然',
            bodyZh: '夜空中綠白綠三盞號燈在尖沙咀山頭亮起。數百艘漁船與駁艇及時駛入油麻地及銅鑼灣避風塘落錨，地盤加固竹棚，而全港無須為一個即將北折的風暴全面停市。'
          },
          under: {
            sceneArt: 'assets/scenes/junk_at_sea.webp',
            speaker: 'coxswain',
            headlineZh: '強風襲港卻未掛三號風球，多艘駁艇斷纜碰撞',
            bodyZh: '維港陣風高達 38 節，因天文台遲遲未掛三號強風訊號，九龍倉碼頭多艘木駁艇未及入塘避風，在風浪中斷纜相撞，艇戶怨聲載道。'
          },
          over: {
            sceneArt: 'assets/scenes/shelter_empty.webp',
            speaker: 'director',
            headlineZh: '誤掛烈風訊號，夜班工廠與渡輪全線停擺',
            bodyZh: '雖然維港吹起 25 節強風，但遠未達 34 節烈風標準。高掛烈風錐體導致天星小輪及九巴夜間急停，數千名夜班紗廠女工滯留碼頭。'
          }
        }
      },
      {
        shiftNum: 4,
        timeZh: '八月五日 02:00 · 深宵第四報（北折轉向）',
        skyClass: 'sky-strong',
        windIntensity: 0.34,
        hkObs: {
          pressureMb: 1001.6,
          pressureTrendZh: '回升 (+1.8 mb / 6h)',
          windDirZh: '北至東北偏北 (NNE)',
          windKt: 23,
          gustKt: 33,
          waglanDirZh: '北 (N)',
          waglanKt: 26,
          waglanGustKt: 36,
          rainMmHr: 3.4,
          tideM: 1.7,
          distKm: 365,
          bearingZh: '正東偏南 (E)'
        },
        telegrams: [
          {
            id: 'kate_s4_t1',
            fromZh: '汕頭氣象台 (SWATOW 59316)',
            typeZh: '地面實測電報',
            timeStamp: '041800Z',
            rawCode: 'SYNOP 59316 041800Z 04026KT 997.5MB FALLING RAIN',
            textZh: '汕頭氣壓顯著下降至 997.5 毫巴，吹東北風 26 節；反觀香港天文台水銀氣壓計已見底回升 1.8 毫巴。',
            fix: { lat: 21.6, lon: 117.3, source: 'PRATAS', radiusDeg: 0.45 }
          },
          {
            id: 'kate_s4_t2',
            fromZh: '巴拿馬貨輪「東方之星」(SS ORIENT STAR)',
            typeZh: '船舶無線電報',
            timeStamp: '041730Z',
            rawCode: 'SHIP ORIENT STAR 21.5N 117.5E WIND WNW 36KT BARO 992MB',
            textZh: '東方之星於北緯 21.5 度、東經 117.5 度錄得西北偏西風 36 節，證實凱蒂中心已越過北緯 21.5 度並向東北偏北加速遠離珠江口。',
            fix: { lat: 21.6, lon: 117.4, source: 'SHIP', radiusDeg: 0.50 }
          },
          {
            id: 'kate_s4_t3',
            fromZh: '橫瀾島燈塔 (WAGLAN ISLAND)',
            typeZh: '本港外島實測',
            timeStamp: '041800Z',
            rawCode: 'WAGLAN 041800Z WIND N 26KT GUST 36KT BARO RISING',
            textZh: '橫瀾島風向轉為偏北，持續風力仍達 26 節（強風程度），離岸海面仍有大浪，預計天亮後風力方會全面緩和。',
            fix: { lat: 21.8, lon: 117.2, source: 'TAIPEI', radiusDeg: 0.55 }
          }
        ],
        tracks: [
          {
            id: 'A',
            labelZh: 'A 線：突然回馬槍西折襲港',
            descZh: '違背氣壓回升實況，預測風暴掉頭西行。',
            waypoints: [
              { lat: 21.6, lon: 117.3 },
              { lat: 22.0, lon: 115.8 },
              { lat: 22.3, lon: 114.4 }
            ]
          },
          {
            id: 'B',
            labelZh: 'B 線：繼續向東北偏北移入台灣海峽（時速 12 節）',
            descZh: '順應西風槽引導，凱蒂明日清晨移至澎湖與汕頭之間海域，本港強風將於日間消退。',
            waypoints: [
              { lat: 21.6, lon: 117.3 },
              { lat: 22.7, lon: 118.1 },
              { lat: 24.0, lon: 119.2 }
            ]
          },
          {
            id: 'C',
            labelZh: 'C 線：向正東橫越台灣本島南端',
            descZh: '預測風暴急轉九十度向正東移動。',
            waypoints: [
              { lat: 21.6, lon: 117.3 },
              { lat: 21.7, lon: 119.2 },
              { lat: 21.8, lon: 121.0 }
            ]
          }
        ],
        recommendedTrack: 'B',
        recommendedSignal: 3,
        acceptableSignals: [3, 1],
        actualPos: { lat: 21.6, lon: 117.3, label: '04/18Z' },
        colleaguePrompt: {
          speaker: 'lam',
          textZh: '「水銀氣壓針終於轉頭向上升！『凱蒂』已經北折去緊汕頭同台灣海峽嗰邊。不過橫瀾島同維港而家仲吹緊 23 至 26 節偏北強風，維持三號強風訊號到天光最穩陣。」'
        },
        outcomes: {
          exact: {
            sceneArt: 'assets/scenes/mast_hoist.webp',
            speaker: 'lam',
            headlineZh: '深宵續掛三號強風訊號，守護早市漁船安全',
            bodyZh: '凌晨維港北風呼嘯，三號燈號持續警醒早起出海的漁民留在避風塘內，直至離岸大浪消退。'
          },
          under: {
            sceneArt: 'assets/scenes/junk_at_sea.webp',
            speaker: 'ho_sir',
            headlineZh: '未待離岸強風減退便除下風球，早班小艇遇險',
            bodyZh: '橫瀾島仍有 26 節強風及大湧浪，過早除下強風訊號令數艘早班街渡在鯉魚門外險象環生。'
          },
          over: {
            sceneArt: 'assets/scenes/shelter_empty.webp',
            speaker: 'director',
            headlineZh: '風暴已北折遠離卻反掛烈風訊號，市民莫名其妙',
            bodyZh: '氣壓明顯回升、風暴正遠離本港，此時改掛烈風訊號令早班電車與渡輪無故停駛，輿論嘩然。'
          }
        }
      },
      {
        shiftNum: 5,
        timeZh: '八月五日 08:00 · 早更第五報（風平浪靜）',
        skyClass: 'sky-calm',
        windIntensity: 0.12,
        hkObs: {
          pressureMb: 1005.2,
          pressureTrendZh: '顯著回升 (+3.6 mb / 6h)',
          windDirZh: '西北偏西 (WNW)',
          windKt: 11,
          gustKt: 17,
          waglanDirZh: '西北 (NW)',
          waglanKt: 14,
          waglanGustKt: 20,
          rainMmHr: 0.0,
          tideM: 1.5,
          distKm: 490,
          bearingZh: '東北偏東 (ENE)'
        },
        telegrams: [
          {
            id: 'kate_s5_t1',
            fromZh: '高雄測候所 (KAOHSIUNG 46744)',
            typeZh: '地面實測電報',
            timeStamp: '050000Z',
            rawCode: 'SYNOP 46744 050000Z 18032KT 995.1MB TS KATE IN FORMOSA STRAIT',
            textZh: '高雄吹南風 32 節，氣壓 995.1 毫巴，凱蒂已進入台灣海峽南部（北緯 22.8 度、東經 118.2 度），遠離香港近五百公里。',
            fix: { lat: 22.8, lon: 118.2, source: 'TAIPEI', radiusDeg: 0.40 }
          },
          {
            id: 'kate_s5_t2',
            fromZh: '橫瀾島燈塔 (WAGLAN ISLAND)',
            typeZh: '本港外島實測',
            timeStamp: '050000Z',
            rawCode: 'WAGLAN 050000Z WIND NW 14KT SEA SLIGHT VISIBILITY GOOD',
            textZh: '橫瀾島風力已回落至 14 節，維港內更減弱至 11 節和緩西風，陽光穿透雲層照亮九龍半島。',
            fix: { lat: 22.7, lon: 118.0, source: 'PRATAS', radiusDeg: 0.45 }
          },
          {
            id: 'kate_s5_t3',
            fromZh: '海事處港口管制站 (MARINE CONTROL)',
            typeZh: '港口運作查詢',
            timeStamp: '050000Z',
            rawCode: 'PORT CONTROL REQUEST ALL CLEAR FOR HARBOUR LIGHTERS AND FERRIES',
            textZh: '海事處來電詢問：維港及離岸風浪均已平息，是否可以正式除下所有風球訊號，讓避風塘船隻恢復作業？',
            fix: { lat: 22.9, lon: 118.3, source: 'SHIP', radiusDeg: 0.50 }
          }
        ],
        tracks: [
          {
            id: 'A',
            labelZh: 'A 線：穿過台灣海峽北上福州外海',
            descZh: '凱蒂繼續向東北偏北移動並逐漸減弱，對香港威脅徹底解除。',
            waypoints: [
              { lat: 22.8, lon: 118.2 },
              { lat: 24.1, lon: 119.3 },
              { lat: 25.0, lon: 120.2 }
            ]
          },
          {
            id: 'B',
            labelZh: 'B 線：西折登陸惠州大亞灣',
            descZh: '不切實際地預測風暴由台灣海峽倒退回廣東沿岸。',
            waypoints: [
              { lat: 22.8, lon: 118.2 },
              { lat: 22.6, lon: 116.2 },
              { lat: 22.5, lon: 114.6 }
            ]
          },
          {
            id: 'C',
            labelZh: 'C 線：停滯於東沙島海面',
            descZh: '錯誤估計風暴退回南海北部。',
            waypoints: [
              { lat: 22.8, lon: 118.2 },
              { lat: 21.5, lon: 117.2 },
              { lat: 20.7, lon: 116.7 }
            ]
          }
        ],
        recommendedTrack: 'A',
        recommendedSignal: 0,
        acceptableSignals: [0],
        actualPos: { lat: 22.8, lon: 118.2, label: '05/00Z' },
        colleaguePrompt: {
          speaker: 'ah_shing',
          textZh: '「主任，太陽出咗嚟啦！維港得返十一節和風，『凱蒂』已經去到澎湖嗰頭。係咪可以落閘除下所有風球（0 號），等全港開工？」'
        },
        outcomes: {
          exact: {
            sceneArt: 'assets/scenes/calm_morning.webp',
            speaker: 'director',
            headlineZh: '八時正除下所有風球，市面與航運迅速復常',
            bodyZh: '尖沙咀訊號架上的倒 T 字訊號徐徐降下。避風塘千帆並發，天星小輪汽笛長鳴，顏士爾台長微笑點頭：「第一場風暴拿捏得恰到好處！」'
          },
          under: {
            sceneArt: 'assets/scenes/calm_morning.webp',
            speaker: 'director',
            headlineZh: '除下所有風球，市面復常',
            bodyZh: '訊號架恢復懸空，港口與市區全面復工。'
          },
          over: {
            sceneArt: 'assets/scenes/shelter_empty.webp',
            speaker: 'coxswain',
            headlineZh: '風平浪靜仍拒除風球，碼頭與漁民鼓譟',
            bodyZh: '陽光普照、海面如鏡，但訊號架仍掛著風球，導致避風塘船隻與碼頭起卸延誤，商會紛紛致電投訴。'
          }
        }
      }
    ],
    debrief: {
      newspaperName: '華僑日報',
      dateZh: '一九六二年八月六日（星期一）',
      goodHeadlineZh: '凱蒂北折入台灣海峽　天文台精準懸掛三號風球護漁船',
      goodSubheadZh: '預報主任審時度勢未盲目掛烈風訊號　全港工商業免受無謂停擺損失',
      goodBodyZh: '【本報訊】熱帶風暴「凱蒂」昨日由東沙以東海域轉向東北偏北移入台灣海峽。皇家天文台前日先掛一號戒備訊號，昨晚風力增強時及時改掛三號強風訊號，令數百艘漁船安然入塘避風；同時準確預判風暴北折，避免誤掛烈風訊號導致全城停工，深獲海事處及商界好評。',
      badHeadlineZh: '凱蒂掠過南海北部　天文台風球訊號失準惹各界微言',
      badSubheadZh: '漁民與洋行指責預報進退失據　台長室表示將檢討通報機制',
      badBodyZh: '【本報訊】熱帶風暴「凱蒂」昨晨遠離本港入台灣海峽，惟天文台在風暴期間之風球調度引起爭議，有離岸船隻批評警告不足，亦有商戶指責訊號與實際風力不符，令市民無所適從。',
      directorGoodZh: '顏士爾台長在早會上稱許道：「面對『凱蒂』在東經 117 度北折，你既用三號風球保護了避風塘船隻，又頂住壓力沒有亂掛烈風訊號，展現出專業預報員的定力。」',
      directorBadZh: '顏士爾台長神色凝重：「『凱蒂』只是一場外圍掠過的熱帶風暴，但我們的訊號調度卻出現明顯偏差。八月下旬才是真正的颱風旺季，務必打醒十二分精神！」'
    }
  },

  // =========================================================================
  // STORM 2: 強烈熱帶風暴諾拉 (SEVERE TROPICAL STORM NORA) — Mid August 1962 (5 Shifts)
  // Fast-moving storm (16 kt) in the northern South China Sea that looks set
  // to strike Hong Kong directly, reaching 170 km SE with NE gale (Signal 7),
  // before a sharp upper trough shears it ENE toward Swatow.
  // =========================================================================
  {
    id: 'storm2_nora',
    index: 2,
    codeEn: 'SEVERE TROPICAL STORM NORA',
    nameZh: '強烈熱帶風暴諾拉',
    subtitleZh: '一九六二年八月中旬 · 疾風驟變（共五更）',
    dateRangeZh: '一九六二年八月十四日至十五日',
    coverArt: 'assets/storms/storm2_nora.webp',
    introBriefZh:
      '八月中旬，強烈熱帶風暴「諾拉」以每小時十六節高速穿過巴士海峽，直指香港東南海域。船隻電報與外台定位分歧甚大：馬尼拉認為諾拉將正面襲港，但高空風分析顯示華南沿岸有急流切變。你必須在高速逼近的東北烈風中決定何時懸掛七號風球，並在它突然東折時果斷降級！',
    historyPoints: [
      { lat: 18.6, lon: 119.5, label: '13/18Z' },
      { lat: 19.4, lon: 118.0, label: '14/00Z' }
    ],
    shifts: [
      {
        shiftNum: 1,
        timeZh: '八月十四日 08:00 · 早更第一報',
        skyClass: 'sky-breeze',
        windIntensity: 0.22,
        hkObs: {
          pressureMb: 1003.2,
          pressureTrendZh: '下降 (-1.8 mb / 3h)',
          windDirZh: '東北偏東 (ENE)',
          windKt: 15,
          gustKt: 23,
          waglanDirZh: '東北 (NE)',
          waglanKt: 19,
          waglanGustKt: 27,
          rainMmHr: 1.0,
          tideM: 1.7,
          distKm: 440,
          bearingZh: '東南 (SE)'
        },
        telegrams: [
          {
            id: 'nora_s1_t1',
            fromZh: '東沙島氣象台 (PRATAS 59792)',
            typeZh: '地面實測電報',
            timeStamp: '140000Z',
            rawCode: 'SYNOP 59792 140000Z 04030KT 994.8MB FALLING RAPIDLY',
            textZh: '東沙島吹東北風 30 節，氣壓急降至 994.8 毫巴，「諾拉」正以 15 至 16 節高速向西北偏西推進，距香港約 440 公里。',
            fix: { lat: 19.8, lon: 117.1, source: 'PRATAS', radiusDeg: 0.45 }
          },
          {
            id: 'nora_s1_t2',
            fromZh: '挪威油輪「卑爾根號」(MT BERGEN)',
            typeZh: '船舶無線電報',
            timeStamp: '132330Z',
            rawCode: 'SHIP MT BERGEN 19.6N 117.3E WIND NNW 48KT BARO 984MB',
            textZh: '卑爾根號於北緯 19.6 度、東經 117.3 度遭遇 48 節暴風，氣壓 984 毫巴，巨浪高達六米，證實諾拉已達強烈熱帶風暴上限。',
            fix: { lat: 19.7, lon: 117.3, source: 'SHIP', radiusDeg: 0.55 }
          },
          {
            id: 'nora_s1_t3',
            fromZh: '馬尼拉氣象局 (MANILA WARNING)',
            typeZh: '鄰台警告電報',
            timeStamp: '132100Z',
            rawCode: 'WTPH MANILA STS NORA 20.0N 116.9E MOV WNW 16KT DIRECT HK',
            textZh: '馬尼拉警告：諾拉移速甚快（16 節），預計 24 小時內直撲珠江口，香港將於今晚受烈風影響。',
            fix: { lat: 20.0, lon: 116.9, source: 'MANILA', radiusDeg: 0.65 }
          }
        ],
        tracks: [
          {
            id: 'A',
            labelZh: 'A 線：西北偏西高速逼近東沙以西（時速 15 節）',
            descZh: '綜合東沙與油輪實測，諾拉今日下午將闖入香港 300 公里範圍，外圍強風中午抵港。',
            waypoints: [
              { lat: 19.8, lon: 117.1 },
              { lat: 20.6, lon: 115.8 },
              { lat: 21.3, lon: 114.9 }
            ]
          },
          {
            id: 'B',
            labelZh: 'B 線：原地停滯於東沙東南面',
            descZh: '低估風暴移速，假設諾拉幾乎不動。',
            waypoints: [
              { lat: 19.8, lon: 117.1 },
              { lat: 19.9, lon: 117.0 },
              { lat: 20.0, lon: 116.9 }
            ]
          },
          {
            id: 'C',
            labelZh: 'C 線：西南折向海南島榆林港',
            descZh: '預測風暴大幅偏南遠離廣東沿岸。',
            waypoints: [
              { lat: 19.8, lon: 117.1 },
              { lat: 19.1, lon: 115.0 },
              { lat: 18.4, lon: 112.8 }
            ]
          }
        ],
        recommendedTrack: 'A',
        recommendedSignal: 1,
        acceptableSignals: [1, 3],
        actualPos: { lat: 19.8, lon: 117.1, label: '14/00Z' },
        colleaguePrompt: {
          speaker: 'lam',
          textZh: '「呢個『諾拉』行得好急，時速成十五六節！東沙島氣壓跌得好快，雖然維港而家仲係 15 節清勁風，但必須即刻掛起一號戒備訊號（甚至考慮提早戒備），通知全港船隻今日下晝風勢會急轉直下！」'
        },
        outcomes: {
          exact: {
            sceneArt: 'assets/scenes/mast_hoist.webp',
            speaker: 'ah_shing',
            headlineZh: '高掛一號戒備訊號，電台預告午後風力急增',
            bodyZh: '正 T 字戒備訊號升上尖沙咀山頭，天文台附加強調「諾拉移速甚快，午後將改掛三號強風訊號」，令外海作業船隻提早起錨回航。'
          },
          under: {
            sceneArt: 'assets/scenes/junk_at_sea.webp',
            speaker: 'ho_sir',
            headlineZh: '風暴高速逼近卻未發訊號，水警輪急電催促',
            bodyZh: '諾拉時速達十六節，天文台早更竟未掛任何訊號，水警何幫辦來電急呼外海漁船恐不及回港！'
          },
          over: {
            sceneArt: 'assets/scenes/shelter_empty.webp',
            speaker: 'director',
            headlineZh: '晨早風力尚弱便直接掛烈風錐體，市面措手不及',
            bodyZh: '跳過一號及三號預警直接懸掛烈風訊號，令早班渡輪與學校大亂，市民抱怨毫無緩衝時間。'
          }
        }
      },
      {
        shiftNum: 2,
        timeZh: '八月十四日 14:00 · 午更第二報（強風抵港）',
        skyClass: 'sky-strong',
        windIntensity: 0.45,
        hkObs: {
          pressureMb: 999.4,
          pressureTrendZh: '急跌 (-3.8 mb / 6h)',
          windDirZh: '東北 (NE)',
          windKt: 27,
          gustKt: 41,
          waglanDirZh: '東北 (NE)',
          waglanKt: 32,
          waglanGustKt: 47,
          rainMmHr: 8.5,
          tideM: 2.1,
          distKm: 280,
          bearingZh: '東南偏南 (SSE)'
        },
        telegrams: [
          {
            id: 'nora_s2_t1',
            fromZh: '東沙島氣象台 (PRATAS 59792)',
            typeZh: '地面實測電報',
            timeStamp: '140600Z',
            rawCode: 'SYNOP 59792 140600Z 14046KT 986.5MB EYE PASSED WEST OF STATION',
            textZh: '東沙島轉吹東南暴風 46 節，氣壓 986.5 毫巴，報告諾拉中心剛從東沙島西面掠過，正位於北緯 20.6 度、東經 115.8 度。',
            fix: { lat: 20.6, lon: 115.8, source: 'PRATAS', radiusDeg: 0.35 }
          },
          {
            id: 'nora_s2_t2',
            fromZh: '橫瀾島燈塔 (WAGLAN ISLAND)',
            typeZh: '本港外島實測',
            timeStamp: '140600Z',
            rawCode: 'WAGLAN 140600Z WIND NE 32KT GUST 47KT HEAVY SQUALLS',
            textZh: '橫瀾島東北風急升至 32 節、陣風 47 節；維港天星碼頭亦吹 27 節強風，密雲低垂，狂風驟雨橫掃港島北岸。',
            fix: { lat: 20.5, lon: 115.9, source: 'SHIP', radiusDeg: 0.45 }
          },
          {
            id: 'nora_s2_t3',
            fromZh: '澳門地球物理暨氣象台 (MACAU)',
            typeZh: '鄰台警告電報',
            timeStamp: '140600Z',
            rawCode: 'MACAU OBS BARO 1000.1MB FALLING WIND NNE 22KT',
            textZh: '澳門氣壓亦跌至 1000.1 毫巴，預計諾拉今晚將逼近至香港東南偏南約 170 公里處，本港離岸及高地將普遍吹東北烈風。',
            fix: { lat: 20.7, lon: 115.6, source: 'MACAU', radiusDeg: 0.50 }
          }
        ],
        tracks: [
          {
            id: 'A',
            labelZh: 'A 線：繼續向西北偏北推進至香港東南面 170 公里',
            descZh: '今晚將逼近至北緯 21.3 度、東經 115.2 度，香港今晚將受東北烈風（七號風球）吹襲。',
            waypoints: [
              { lat: 20.6, lon: 115.8 },
              { lat: 21.3, lon: 115.2 },
              { lat: 21.9, lon: 116.0 }
            ]
          },
          {
            id: 'B',
            labelZh: 'B 線：向西南偏西遠離趨向雷州半島',
            descZh: '低估對港威脅，認為風暴將遠離珠江口。',
            waypoints: [
              { lat: 20.6, lon: 115.8 },
              { lat: 20.3, lon: 113.8 },
              { lat: 20.1, lon: 111.8 }
            ]
          },
          {
            id: 'C',
            labelZh: 'C 線：立即原地消散',
            descZh: '不切實際地預測強烈熱帶風暴突然減弱。',
            waypoints: [
              { lat: 20.6, lon: 115.8 },
              { lat: 20.7, lon: 115.9 },
              { lat: 20.8, lon: 116.0 }
            ]
          }
        ],
        recommendedTrack: 'A',
        recommendedSignal: 3,
        acceptableSignals: [3, 7],
        actualPos: { lat: 20.6, lon: 115.8, label: '14/06Z' },
        colleaguePrompt: {
          speaker: 'lam',
          textZh: '「維港已經吹緊 27 節東北強風，橫瀾島去到 32 節！而家必須掛三號強風訊號（倒 T 字），同時透過電台預警市民：今晚入夜後好大機會改掛七號東北烈風訊號！」'
        },
        outcomes: {
          exact: {
            sceneArt: 'assets/scenes/taping_windows.webp',
            speaker: 'mrs_chan',
            headlineZh: '改掛三號強風訊號，唐樓商戶忙貼米字膠紙',
            bodyZh: '中環與旺角商戶紛紛在玻璃櫥窗貼上米字牛皮膠紙，避風塘最後一批漁船趕在傍晚前落錨，學校與寫字樓有序安排員工提早下班。'
          },
          under: {
            sceneArt: 'assets/scenes/junk_at_sea.webp',
            speaker: 'coxswain',
            headlineZh: '維港強風大作仍只掛一號，渡輪與駁艇險象環生',
            bodyZh: '27 節強風掀起白頭浪，因未掛三號強風訊號，港外線渡輪與小艇未及停航避風，多人在碼頭登岸時跌傷。'
          },
          over: {
            sceneArt: 'assets/scenes/tram_flood.webp',
            speaker: 'director',
            headlineZh: '過早跳掛九號或十號訊號，引發市面搶購恐慌',
            bodyZh: '午間風力僅為強風上限，卻突然高掛暴風或颶風訊號，令中環交通瞬間癱瘓。'
          }
        }
      },
      {
        shiftNum: 3,
        timeZh: '八月十四日 20:00 · 夜更第三報（東北烈風襲港）',
        skyClass: 'sky-gale',
        windIntensity: 0.72,
        hkObs: {
          pressureMb: 994.6,
          pressureTrendZh: '急跌 (-4.8 mb / 6h)',
          windDirZh: '東北 (NE)',
          windKt: 38,
          gustKt: 58,
          waglanDirZh: '東北偏東 (ENE)',
          waglanKt: 44,
          waglanGustKt: 64,
          rainMmHr: 18.5,
          tideM: 2.5,
          distKm: 175,
          bearingZh: '東南偏南 (SSE)'
        },
        telegrams: [
          {
            id: 'nora_s3_t1',
            fromZh: '橫瀾島燈塔 (WAGLAN ISLAND)',
            typeZh: '本港外島實測',
            timeStamp: '141200Z',
            rawCode: 'WAGLAN 141200Z WIND ENE 44KT GUST 64KT BARO 992.8MB GALE IN HARBOUR',
            textZh: '橫瀾島實測東北偏東烈風 44 節、陣風 64 節！尖沙咀天文台及啟德機場亦持續錄得 38 節東北烈風，陣風 58 節，已全面達到烈風訊號標準！',
            fix: { lat: 21.3, lon: 115.2, source: 'PRATAS', radiusDeg: 0.35 }
          },
          {
            id: 'nora_s3_t2',
            fromZh: '美軍關島氣象偵察機 (USAF GULL 09)',
            typeZh: '飛機投落儀電報',
            timeStamp: '141130Z',
            rawCode: 'RECCO GULL09 FIX 21.3N 115.2E 982MB MAX 55KT STRONG WESTERLY SHEAR ALOFT',
            textZh: '美軍偵察機定位北緯 21.3 度、東經 115.2 度（香港東南偏南約 175 公里），最大風速 55 節（尚未達 64 節颶風）。機組特別報告：高空西風切變極強，對流雲團已被吹向東北方！',
            fix: { lat: 21.3, lon: 115.2, source: 'RECON', radiusDeg: 0.30 }
          },
          {
            id: 'nora_s3_t3',
            fromZh: '天星小輪碼頭監督 (STAR FERRY PIER)',
            typeZh: '港口緊急通報',
            timeStamp: '141200Z',
            rawCode: 'STAR FERRY WAVES BREAKING OVER KOWLOON PIER AWAITING GALE SIGNAL',
            textZh: '天星小輪監督急電：維港東北烈風捲起三米巨浪拍上尖沙咀碼頭，渡輪必須即刻停航，請天文台立即懸掛正確象限之烈風訊號！',
            fix: { lat: 21.2, lon: 115.3, source: 'SHIP', radiusDeg: 0.45 }
          }
        ],
        tracks: [
          {
            id: 'A',
            labelZh: 'A 線：直接北上正面貫穿香港維多利亞港',
            descZh: '忽視高空強西風切變報告，預測諾拉午夜正面登陸尖沙咀。',
            waypoints: [
              { lat: 21.3, lon: 115.2 },
              { lat: 22.3, lon: 114.2 },
              { lat: 23.2, lon: 113.5 }
            ]
          },
          {
            id: 'B',
            labelZh: 'B 線：受高空西風切變牽引，於香港東南面急轉東北偏東（ENE）',
            descZh: '根據偵察機高空切變實測，諾拉今晚在香港東南約 170 公里處掠過並帶來東北烈風，隨即折向東北偏東趨向汕頭外海。',
            waypoints: [
              { lat: 21.3, lon: 115.2 },
              { lat: 21.8, lon: 116.1 },
              { lat: 22.5, lon: 117.1 }
            ]
          },
          {
            id: 'C',
            labelZh: 'C 線：西行登陸陽江',
            descZh: '預測風暴轉向正西遠離。',
            waypoints: [
              { lat: 21.3, lon: 115.2 },
              { lat: 21.4, lon: 113.6 },
              { lat: 21.6, lon: 112.0 }
            ]
          }
        ],
        recommendedTrack: 'B',
        recommendedSignal: 7,
        acceptableSignals: [7, 8],
        actualPos: { lat: 21.3, lon: 115.2, label: '14/12Z' },
        colleaguePrompt: {
          speaker: 'lam',
          textZh: '「主任！維港持續吹 38 節東北烈風，陣風 58 節！按一九六二年風球規例，東北象限烈風應該掛『七號風球』（兩個向上黑錐體 ▲/▲，夜間綠·綠·白燈）！而且偵察機話中心最高風速係 55 節兼且就快東折，唔好亂掛九號或者十號呀！」'
        },
        outcomes: {
          exact: {
            sceneArt: 'assets/scenes/star_ferry.webp',
            speaker: 'sau_lan',
            headlineZh: '高懸七號東北烈風訊號（綠·綠·白），天星小輪尾班停航',
            bodyZh: '尖沙咀訊號架亮起綠、綠、白三盞號燈，代表七號東北烈風訊號生效。天星小輪拉響尾班閘門，市民趕搭最後一班船歸家，觀塘木屋區居民亦在社工協助下避入防空洞與庇護站。'
          },
          under: {
            sceneArt: 'assets/scenes/ship_dragging.webp',
            speaker: 'ho_sir',
            headlineZh: '維港已吹 38 節東北烈風卻拒掛烈風訊號，渡輪與市民遇險！',
            bodyZh: '狂風暴雨橫掃維港，但訊號架仍停留在三號或更低訊號，導致渡輪與巴士冒險行駛，九龍碼頭有渡輪被狂浪推撞防波堤，多名乘客受傷！'
          },
          over: {
            sceneArt: 'assets/scenes/shelter_empty.webp',
            speaker: 'director',
            headlineZh: '風暴未達颶風且正受切變東折，誤掛九號／十號訊號惹非議',
            bodyZh: '諾拉中心最高風速僅 55 節且並未正面襲港，誤掛九號或十號訊號令全港防空警號徹夜誤鳴。'
          }
        }
      },
      {
        shiftNum: 4,
        timeZh: '八月十五日 02:00 · 深宵第四報（急折東移）',
        skyClass: 'sky-strong',
        windIntensity: 0.40,
        hkObs: {
          pressureMb: 998.9,
          pressureTrendZh: '急升 (+4.3 mb / 6h)',
          windDirZh: '北至西北偏北 (NNW)',
          windKt: 26,
          gustKt: 39,
          waglanDirZh: '北 (N)',
          waglanKt: 29,
          waglanGustKt: 42,
          rainMmHr: 4.2,
          tideM: 1.8,
          distKm: 230,
          bearingZh: '東南偏東 (ESE)'
        },
        telegrams: [
          {
            id: 'nora_s4_t1',
            fromZh: '東沙島氣象台 (PRATAS 59792)',
            typeZh: '地面實測電報',
            timeStamp: '141800Z',
            rawCode: 'SYNOP 59792 141800Z 25042KT 989.2MB NORA RECURVED ENE',
            textZh: '東沙島改吹西南偏西烈風 42 節！證實諾拉已在香港東南面急轉彎，改向東北偏東移至北緯 21.8 度、東經 116.1 度，正迅速遠離珠江口！',
            fix: { lat: 21.8, lon: 116.1, source: 'PRATAS', radiusDeg: 0.35 }
          },
          {
            id: 'nora_s4_t2',
            fromZh: '橫瀾島燈塔 (WAGLAN ISLAND)',
            typeZh: '本港外島實測',
            timeStamp: '141800Z',
            rawCode: 'WAGLAN 141800Z WIND N 29KT GUST 42KT GALE SUBSIDED',
            textZh: '隨著諾拉東折，本港風向轉為偏北，受九龍群山屏障，維港持續風力已由 38 節回落至 26 節（強風程度），烈風威脅已經解除。',
            fix: { lat: 21.7, lon: 116.0, source: 'SHIP', radiusDeg: 0.45 }
          },
          {
            id: 'nora_s4_t3',
            fromZh: '天星小輪及電車公司 (TRANSPORT DESK)',
            typeZh: '公用事業查詢',
            timeStamp: '141800Z',
            rawCode: 'PUBLIC UTILITIES INQUIRE IF GALE SIGNAL 7 WILL BE LOWERED BEFORE DAWN',
            textZh: '天星小輪及香港電車公司致電查詢：若天文台於清晨前改掛三號強風訊號，早班渡輪與電車便可於六時整恢復通車，免卻數十萬市民徒步返工之苦。',
            fix: { lat: 21.9, lon: 116.2, source: 'TAIPEI', radiusDeg: 0.50 }
          }
        ],
        tracks: [
          {
            id: 'A',
            labelZh: 'A 線：向東北偏東加速趨向汕頭至廈門沿海',
            descZh: '諾拉已被西風槽帶走，本港風力將在天亮前進一步減弱。',
            waypoints: [
              { lat: 21.8, lon: 116.1 },
              { lat: 22.6, lon: 117.1 },
              { lat: 23.5, lon: 118.2 }
            ]
          },
          {
            id: 'B',
            labelZh: 'B 線：掉頭向西北登陸深圳灣',
            descZh: '無視氣壓急升 4.3 毫巴的實況，預測風暴回頭襲港。',
            waypoints: [
              { lat: 21.8, lon: 116.1 },
              { lat: 22.2, lon: 115.0 },
              { lat: 22.5, lon: 113.9 }
            ]
          },
          {
            id: 'C',
            labelZh: 'C 線：向正南退回東沙以南',
            descZh: '錯誤預測風暴南退。',
            waypoints: [
              { lat: 21.8, lon: 116.1 },
              { lat: 20.5, lon: 116.1 },
              { lat: 19.2, lon: 116.1 }
            ]
          }
        ],
        recommendedTrack: 'A',
        recommendedSignal: 3,
        acceptableSignals: [3],
        actualPos: { lat: 21.8, lon: 116.1, label: '14/18Z' },
        colleaguePrompt: {
          speaker: 'lam',
          textZh: '「好彩有美軍偵察機嘅高空切變報告！『諾拉』真係喺香港東南面急轉彎向東走咗，氣壓六個鐘頭升咗 4.3 毫巴，維港風力跌返落 26 節強風。而家即刻由七號改掛三號強風訊號（綠·白·綠），聽朝全港就可以照常開工搭船！」'
        },
        outcomes: {
          exact: {
            sceneArt: 'assets/scenes/mast_hoist.webp',
            speaker: 'ah_shing',
            headlineZh: '凌晨果斷改掛三號強風訊號，早班電車渡輪準時復航',
            bodyZh: '綠白綠三盞燈號取代了七號烈風燈號。電車廠與天星小輪即刻派員清理路軌與跳板，確保天亮後全港交通無縫恢復，同時提醒離岸漁船仍須提防 26 節北風。'
          },
          under: {
            sceneArt: 'assets/scenes/junk_at_sea.webp',
            speaker: 'ho_sir',
            headlineZh: '維港仍有 26 節強風卻直接除下所有風球，早班小艇翻沉',
            bodyZh: '雖然烈風已退，但橫瀾島與維港仍吹 26 至 29 節偏北強風，直接除下所有風球令小艇誤以為海面平靜而冒險出航。'
          },
          over: {
            sceneArt: 'assets/scenes/shelter_empty.webp',
            speaker: 'director',
            headlineZh: '風暴已東折遠離卻拖延不降七號風球，全港早市白白停擺',
            bodyZh: '清晨香港風雨已歇，但訊號架仍高掛七號烈風訊號，導致銀行、交易所與渡輪上午全線停擺，商界怨聲載道。'
          }
        }
      },
      {
        shiftNum: 5,
        timeZh: '八月十五日 08:00 · 早更第五報（天朗氣清）',
        skyClass: 'sky-calm',
        windIntensity: 0.14,
        hkObs: {
          pressureMb: 1004.1,
          pressureTrendZh: '穩定回升 (+5.2 mb / 6h)',
          windDirZh: '西至西北 (WNW)',
          windKt: 12,
          gustKt: 18,
          waglanDirZh: '西北 (NW)',
          waglanKt: 15,
          waglanGustKt: 21,
          rainMmHr: 0.0,
          tideM: 1.5,
          distKm: 360,
          bearingZh: '東北偏東 (ENE)'
        },
        telegrams: [
          {
            id: 'nora_s5_t1',
            fromZh: '汕頭氣象台 (SWATOW 59316)',
            typeZh: '地面實測電報',
            timeStamp: '150000Z',
            rawCode: 'SYNOP 59316 150000Z 31036KT 991.0MB NORA PASSING SOUTH OF SWATOW',
            textZh: '汕頭錄得西北烈風 36 節，氣壓 991.0 毫巴，諾拉已移至汕頭東南近海（北緯 22.6 度、東經 117.1 度）並逐漸減弱。',
            fix: { lat: 22.6, lon: 117.1, source: 'PRATAS', radiusDeg: 0.35 }
          },
          {
            id: 'nora_s5_t2',
            fromZh: '橫瀾島燈塔 (WAGLAN ISLAND)',
            typeZh: '本港外島實測',
            timeStamp: '150000Z',
            rawCode: 'WAGLAN 150000Z WIND NW 15KT HARBOUR 12KT FINE WEATHER',
            textZh: '橫瀾島風力減弱至 15 節，維港內吹 12 節和緩西風，天色放晴。',
            fix: { lat: 22.5, lon: 117.0, source: 'SHIP', radiusDeg: 0.45 }
          },
          {
            id: 'nora_s5_t3',
            fromZh: '麗的呼聲廣播電台 (REDIFFUSION HK)',
            typeZh: '晨早新聞連線',
            timeStamp: '150000Z',
            rawCode: 'REDIFFUSION REQUEST FINAL BULLETIN FOR MORNING COMMUTE',
            textZh: '播音員周秀蘭來電：「主任，全港茶樓同街坊都聽緊收音機，係咪八點鐘正式除下三號強風訊號？」',
            fix: { lat: 22.7, lon: 117.2, source: 'TAIPEI', radiusDeg: 0.50 }
          }
        ],
        tracks: [
          {
            id: 'A',
            labelZh: 'A 線：登陸閩南沿海並消散',
            descZh: '諾拉繼續向東北移動並填塞減弱，本港天氣完全復常。',
            waypoints: [
              { lat: 22.6, lon: 117.1 },
              { lat: 23.6, lon: 118.0 },
              { lat: 24.5, lon: 118.8 }
            ]
          },
          {
            id: 'B',
            labelZh: 'B 線：折返珠江口',
            descZh: '錯誤估計風暴回頭西行。',
            waypoints: [
              { lat: 22.6, lon: 117.1 },
              { lat: 22.4, lon: 115.6 },
              { lat: 22.3, lon: 114.2 }
            ]
          },
          {
            id: 'C',
            labelZh: 'C 線：南下巴士海峽',
            descZh: '錯誤估計風暴向南倒退。',
            waypoints: [
              { lat: 22.6, lon: 117.1 },
              { lat: 21.0, lon: 118.0 },
              { lat: 19.5, lon: 119.0 }
            ]
          }
        ],
        recommendedTrack: 'A',
        recommendedSignal: 0,
        acceptableSignals: [0],
        actualPos: { lat: 22.6, lon: 117.1, label: '15/00Z' },
        colleaguePrompt: {
          speaker: 'sau_lan',
          textZh: '「主任，『諾拉』昨晚擦邊而過，全靠你昨晚掛七號、凌晨改三號，街坊既安全又唔使耽誤今朝開工！而家八點正除下所有風球（0 號）好嗎？」'
        },
        outcomes: {
          exact: {
            sceneArt: 'assets/scenes/calm_morning.webp',
            speaker: 'director',
            headlineZh: '八時除下所有風球，天文台「快上快落」贏盡口碑',
            bodyZh: '市民清晨踏出唐樓，見街道雖有落葉但渡輪電車已全面通車，紛紛稱讚天文台昨晚七號風球掛得及時、凌晨三號風球落得果斷。'
          },
          under: {
            sceneArt: 'assets/scenes/calm_morning.webp',
            speaker: 'director',
            headlineZh: '除下所有風球，市面恢復正常',
            bodyZh: '訊號架清空，全港恢復正常運作。'
          },
          over: {
            sceneArt: 'assets/scenes/shelter_empty.webp',
            speaker: 'director',
            headlineZh: '風和日麗仍掛風球，港口起卸無故受阻',
            bodyZh: '維港風力已降至 12 節，遲遲不除下風球令船務公司頗有微言。'
          }
        }
      }
    ],
    debrief: {
      newspaperName: '華僑日報',
      dateZh: '一九六二年八月十六日（星期四）',
      goodHeadlineZh: '諾拉昨夜擦港東折　天文台夜掛七號晨改三號調度得宜',
      goodSubheadZh: '東北烈風襲維港幸早有預警　今晨水陸交通如常市民稱便',
      goodBodyZh: '【本報訊】強烈熱帶風暴「諾拉」昨晚逼近本港東南約一百七十公里，維港及橫瀾島一度吹東北烈風。皇家天文台昨晚八時果斷懸掛七號東北烈風訊號，及至深夜風暴受高空切變東折遠離，天文台即於凌晨二時改掛三號強風訊號、今晨八時除下所有風球，令全港市民安度風夜之餘，今晨返工開市絲毫未受延誤。',
      badHeadlineZh: '諾拉急行掠過南海　天文台風球更替遲疑惹非議',
      badSubheadZh: '海事及交通界望加強高空切變分析　減少無謂混亂',
      badBodyZh: '【本報訊】強烈熱帶風暴「諾拉」昨夜在香港東南海域急轉東北偏東遠離，惟風球懸掛與除下時間未能緊貼風勢轉變，部分渡輪及市民行程受阻。',
      directorGoodZh: '顏士爾台長讚許道：「『諾拉』移速極快且在最後關頭東折，你能從偵察機高空切變電報中看出端倪，果斷執行『夜掛七號、晨改三號』，非常出色！」',
      directorBadZh: '顏士爾台長提醒道：「面對高速轉向的風暴，掛風球要果斷，落風球同樣要及時，否則公信力便會一點一滴流失。」'
    }
  },

  // =========================================================================
  // STORM 3: 颱風柏絲 (TYPHOON PATSY) — Late August 1962 (6 Shifts)
  // Erratic South China Sea night typhoon: stalls near Paracel/Pratas trough,
  // then tracks NNW to pass 85 km SSW of Hong Kong (Macau/Lantau waters),
  // requiring progression: No. 1 -> No. 3 -> No. 7 (NE Gale) -> No. 8 (SE Gale)
  // -> No. 6 (SW Gale) -> No. 3 / Clear.
  // =========================================================================
  {
    id: 'storm3_patsy',
    index: 3,
    codeEn: 'TYPHOON PATSY',
    nameZh: '颱風柏絲',
    subtitleZh: '一九六二年八月下旬 · 南海迷蹤（共六更）',
    dateRangeZh: '一九六二年八月二十二日至二十三日',
    coverArt: 'assets/storms/storm3_patsy.webp',
    introBriefZh:
      '八月下旬，南海中部生成颱風「柏絲」，夜間在西沙與東沙之間飄忽慢行，各國電報定位相差近百海里。更棘手的是，當颱風由香港南面掠過並移向西南偏西時，本港風向將由東北烈風（七號風球）順時針轉為東南烈風（八號風球）乃至西南烈風（六號風球），考驗你對一九六二年四象限烈風訊號的精準掌握！',
    historyPoints: [
      { lat: 17.8, lon: 115.6, label: '21/18Z' },
      { lat: 18.5, lon: 115.3, label: '22/00Z' }
    ],
    shifts: [
      {
        shiftNum: 1,
        timeZh: '八月二十二日 08:00 · 早更第一報',
        skyClass: 'sky-breeze',
        windIntensity: 0.24,
        hkObs: {
          pressureMb: 1002.6,
          pressureTrendZh: '緩跌 (-1.4 mb / 6h)',
          windDirZh: '東風 (E)',
          windKt: 16,
          gustKt: 24,
          waglanDirZh: '東 (E)',
          waglanKt: 20,
          waglanGustKt: 28,
          rainMmHr: 1.5,
          tideM: 1.8,
          distKm: 390,
          bearingZh: '正南偏東 (SSE)'
        },
        telegrams: [
          {
            id: 'patsy_s1_t1',
            fromZh: '西沙島氣象台 (PARACEL 59981)',
            typeZh: '地面實測電報',
            timeStamp: '220000Z',
            rawCode: 'SYNOP 59981 220000Z 29036KT 991.2MB TY PATSY NE OF PARACEL',
            textZh: '西沙島吹西北偏西烈風 36 節，氣壓 991.2 毫巴，指颱風柏絲位於西沙東北面約 160 海里，正緩慢向偏北移動。',
            fix: { lat: 19.0, lon: 114.9, source: 'PRATAS', radiusDeg: 0.55 }
          },
          {
            id: 'patsy_s1_t2',
            fromZh: '法國郵輪「老撾號」(MS LAOS)',
            typeZh: '船舶無線電報',
            timeStamp: '212330Z',
            rawCode: 'SHIP MS LAOS 19.3N 115.2E WIND ENE 52KT BARO 980MB',
            textZh: '法國郵輪老撾號於北緯 19.3 度、東經 115.2 度遭遇 52 節暴風，氣壓 980 毫巴，報告颱風中心在船南面不遠，移向西北偏北。',
            fix: { lat: 19.1, lon: 115.1, source: 'SHIP', radiusDeg: 0.50 }
          },
          {
            id: 'patsy_s1_t3',
            fromZh: '馬尼拉氣象局 (MANILA WARNING)',
            typeZh: '鄰台警告電報',
            timeStamp: '212100Z',
            rawCode: 'WTPH MANILA TY PATSY 18.8N 114.4E MOV W TOWARD HAINAN',
            textZh: '馬尼拉定位明顯偏西：認為柏絲在北緯 18.8 度、東經 114.4 度並向正西趨向海南島，但此說與法國郵輪實測不符。',
            fix: { lat: 18.8, lon: 114.4, source: 'MANILA', radiusDeg: 0.75 }
          }
        ],
        tracks: [
          {
            id: 'A',
            labelZh: 'A 線：向正西直奔海南島三亞',
            descZh: '盲從馬尼拉滯後定位，忽略郵輪實測。',
            waypoints: [
              { lat: 19.0, lon: 114.9 },
              { lat: 18.9, lon: 113.0 },
              { lat: 18.7, lon: 111.0 }
            ]
          },
          {
            id: 'B',
            labelZh: 'B 線：向西北偏北（NNW）穩步趨向珠江口以南海域',
            descZh: '採納郵輪老撾號與西沙實測，預料柏絲以時速 10 節向西北偏北移動，明日凌晨逼近香港南面 100 公里內。',
            waypoints: [
              { lat: 19.0, lon: 115.0 },
              { lat: 20.1, lon: 114.5 },
              { lat: 21.3, lon: 113.9 }
            ]
          },
          {
            id: 'C',
            labelZh: 'C 線：向東北折返台灣海峽',
            descZh: '無高空槽配合下誤判風暴東折。',
            waypoints: [
              { lat: 19.0, lon: 115.0 },
              { lat: 20.4, lon: 116.8 },
              { lat: 21.8, lon: 118.4 }
            ]
          }
        ],
        recommendedTrack: 'B',
        recommendedSignal: 1,
        acceptableSignals: [1, 3],
        actualPos: { lat: 19.0, lon: 115.0, label: '22/00Z' },
        colleaguePrompt: {
          speaker: 'lam',
          textZh: '「馬尼拉話個風去海南島，但法國郵輪『老撾號』喺東經 115 度實測 980 毫巴同 52 節暴風，證明『柏絲』根本正對住珠江口北上緊！快啲掛一號戒備訊號先！」'
        },
        outcomes: {
          exact: {
            sceneArt: 'assets/scenes/mast_hoist.webp',
            speaker: 'ah_shing',
            headlineZh: '識破外台偏差，果斷懸掛一號戒備訊號',
            bodyZh: '你依據郵輪實測氣壓排除馬尼拉偏西預報，及時升起正 T 字一號戒備訊號，通知全港船隻防範南海颱風北上。'
          },
          under: {
            sceneArt: 'assets/scenes/junk_at_sea.webp',
            speaker: 'coxswain',
            headlineZh: '誤信風暴西行海南而未掛風球，漁船留守外海',
            bodyZh: '由於未發戒備訊號，大批南丫島與長洲漁船繼續在萬山群島作業，不知颱風正北上逼近。'
          },
          over: {
            sceneArt: 'assets/scenes/shelter_empty.webp',
            speaker: 'director',
            headlineZh: '風暴尚在四百公里外便掛烈風訊號，步伐過急',
            bodyZh: '早上維港僅吹 16 節東風，跳掛五號以上烈風訊號令市民錯愕。'
          }
        }
      },
      {
        shiftNum: 2,
        timeZh: '八月二十二日 14:00 · 午更第二報（強風起兮）',
        skyClass: 'sky-strong',
        windIntensity: 0.44,
        hkObs: {
          pressureMb: 998.8,
          pressureTrendZh: '急跌 (-3.8 mb / 6h)',
          windDirZh: '東北偏東 (ENE)',
          windKt: 26,
          gustKt: 39,
          waglanDirZh: '東北偏東 (ENE)',
          waglanKt: 31,
          waglanGustKt: 45,
          rainMmHr: 7.4,
          tideM: 2.1,
          distKm: 265,
          bearingZh: '正南偏東 (SSE)'
        },
        telegrams: [
          {
            id: 'patsy_s2_t1',
            fromZh: '美軍關島氣象偵察機 (USAF GULL 12)',
            typeZh: '飛機投落儀電報',
            timeStamp: '220530Z',
            rawCode: 'RECCO GULL12 FIX 20.0N 114.5E 974MB MAX WIND 65KT EYE 20NM',
            textZh: '美軍偵察機定位北緯 20.0 度、東經 114.5 度（香港正南偏東約 265 公里），中心氣壓 974 毫巴，最大風速 65 節（已達颱風級別），正向西北偏北移動。',
            fix: { lat: 20.0, lon: 114.5, source: 'RECON', radiusDeg: 0.30 }
          },
          {
            id: 'patsy_s2_t2',
            fromZh: '橫瀾島燈塔 (WAGLAN ISLAND)',
            typeZh: '本港外島實測',
            timeStamp: '220600Z',
            rawCode: 'WAGLAN 220600Z WIND ENE 31KT GUST 45KT SWELL HEAVY SE',
            textZh: '橫瀾島實測東北偏東強風 31 節、陣風 45 節；維港天星碼頭亦達 26 節強風，東南巨湧不斷湧入鯉魚門及東博寮海峽。',
            fix: { lat: 19.9, lon: 114.6, source: 'PRATAS', radiusDeg: 0.45 }
          },
          {
            id: 'patsy_s2_t3',
            fromZh: '澳門地球物理暨氣象台 (MACAU)',
            typeZh: '鄰台警告電報',
            timeStamp: '220600Z',
            rawCode: 'MACAU OBS BARO 999.2MB FALLING EXPECT GALE TONIGHT',
            textZh: '澳門氣壓跌破一千毫巴，預計柏絲今晚至明晨將在香港與澳門南面近海掠過，港澳兩地均將受烈風吹襲。',
            fix: { lat: 20.1, lon: 114.4, source: 'MACAU', radiusDeg: 0.45 }
          }
        ],
        tracks: [
          {
            id: 'A',
            labelZh: 'A 線：向西北偏北移近萬山群島至大嶼山以南海域',
            descZh: '按偵察機定位，今晚將逼近至北緯 20.9 度、東經 114.1 度（香港正南約 155 公里），本港入夜後將吹東北烈風。',
            waypoints: [
              { lat: 20.0, lon: 114.5 },
              { lat: 20.9, lon: 114.1 },
              { lat: 21.6, lon: 113.5 }
            ]
          },
          {
            id: 'B',
            labelZh: 'B 線：東折趨向汕頭',
            descZh: '無根據地預測颱風大角度東折。',
            waypoints: [
              { lat: 20.0, lon: 114.5 },
              { lat: 21.2, lon: 116.0 },
              { lat: 22.5, lon: 117.2 }
            ]
          },
          {
            id: 'C',
            labelZh: 'C 線：向南倒退回西沙',
            descZh: '錯誤預測風暴向南移動。',
            waypoints: [
              { lat: 20.0, lon: 114.5 },
              { lat: 18.8, lon: 114.2 },
              { lat: 17.6, lon: 113.8 }
            ]
          }
        ],
        recommendedTrack: 'A',
        recommendedSignal: 3,
        acceptableSignals: [3],
        actualPos: { lat: 20.0, lon: 114.5, label: '22/06Z' },
        colleaguePrompt: {
          speaker: 'lam',
          textZh: '「維港吹緊 26 節強風，橫瀾島 31 節！而家即刻改掛三號強風訊號（倒 T 字），等全港漁船入避風塘、學校提早放學；入夜風力一過 34 節就要轉掛七號東北烈風訊號！」'
        },
        outcomes: {
          exact: {
            sceneArt: 'assets/scenes/shelter.webp',
            speaker: 'coxswain',
            headlineZh: '午後改掛三號強風訊號，避風塘千帆歸航',
            bodyZh: '倒 T 字訊號高懸，油麻地與銅鑼灣避風塘泊滿歸航漁船，水警輪在海面協助編排航道，市面有序作好防風準備。'
          },
          under: {
            sceneArt: 'assets/scenes/junk_at_sea.webp',
            speaker: 'ho_sir',
            headlineZh: '強風已至仍未掛三號風球，港外渡輪險象環生',
            bodyZh: '長洲及坪洲渡輪在 26 節強風與巨湧中顛簸靠岸，海事處嚴詞質詢天文台為何遲遲不掛三號風球。'
          },
          over: {
            sceneArt: 'assets/scenes/tram_flood.webp',
            speaker: 'director',
            headlineZh: '午後風力未達烈風便搶掛高風球，過早癱瘓下班交通',
            bodyZh: '下午二時風力僅 26 節，過早掛出烈風或暴風訊號令數十萬市民擠塞於中環與尖沙咀碼頭。'
          }
        }
      },
      {
        shiftNum: 3,
        timeZh: '八月二十二日 20:00 · 夜更第三報（七號東北烈風）',
        skyClass: 'sky-gale',
        windIntensity: 0.74,
        hkObs: {
          pressureMb: 992.4,
          pressureTrendZh: '急跌 (-6.4 mb / 6h)',
          windDirZh: '東北偏東 (ENE)',
          windKt: 40,
          gustKt: 62,
          waglanDirZh: '東北偏東 (ENE)',
          waglanKt: 46,
          waglanGustKt: 68,
          rainMmHr: 22.0,
          tideM: 2.6,
          distKm: 155,
          bearingZh: '正南 (S)'
        },
        telegrams: [
          {
            id: 'patsy_s3_t1',
            fromZh: '橫瀾島燈塔 (WAGLAN ISLAND)',
            typeZh: '本港外島實測',
            timeStamp: '221200Z',
            rawCode: 'WAGLAN 221200Z WIND ENE 46KT GUST 68KT BARO 990.5MB',
            textZh: '橫瀾島吹東北偏東烈風 46 節，陣風高達 68 節；尖沙咀天文台亦錄得持續風力 40 節、陣風 62 節，豪雨傾盆！',
            fix: { lat: 20.9, lon: 114.1, source: 'PRATAS', radiusDeg: 0.35 }
          },
          {
            id: 'patsy_s3_t2',
            fromZh: '英國皇家海軍「達姆號」(HMS TAMAR)',
            typeZh: '海軍氣象電報',
            timeStamp: '221145Z',
            rawCode: 'HMS TAMAR RADAR FIX PATSY 20.9N 114.1E MOV NNW 10KT',
            textZh: '添馬艦雷達及大東山站聯合定位：柏絲中心位於北緯 20.9 度、東經 114.1 度（香港正南約 155 公里），正以 10 節移向萬山群島西南海域。',
            fix: { lat: 20.9, lon: 114.1, source: 'RECON', radiusDeg: 0.25 }
          },
          {
            id: 'patsy_s3_t3',
            fromZh: '觀塘民政署及市政局 (KWUN TONG DISTRICT)',
            typeZh: '社區災情通報',
            timeStamp: '221200Z',
            rawCode: 'KWUN TONG SQUATTER HUTS BUFFETED BY NE GALES REQUEST WARNING',
            textZh: '觀塘及九龍仔木屋區受強烈東北烈風吹襲，多處鋅鐵頂被吹掀，民政署促請天文台懸掛烈風訊號並廣播開放庇護站。',
            fix: { lat: 21.0, lon: 114.0, source: 'MACAU', radiusDeg: 0.40 }
          }
        ],
        tracks: [
          {
            id: 'A',
            labelZh: 'A 線：向西北偏北掠過香港西南偏南約 90 公里處（萬山至澳門外海）',
            descZh: '午夜前後最接近本港（約 85–95 公里），隨着颱風移至香港正南轉西南方，本港風向將由東北烈風（七號）轉為東南烈風（八號）。',
            waypoints: [
              { lat: 20.9, lon: 114.1 },
              { lat: 21.6, lon: 113.7 },
              { lat: 22.0, lon: 113.0 }
            ]
          },
          {
            id: 'B',
            labelZh: 'B 線：急轉正東趨向巴士海峽',
            descZh: '違背雷達定位，錯誤預測颱風東折。',
            waypoints: [
              { lat: 20.9, lon: 114.1 },
              { lat: 20.8, lon: 116.0 },
              { lat: 20.6, lon: 118.0 }
            ]
          },
          {
            id: 'C',
            labelZh: 'C 線：正面穿過維多利亞港中心',
            descZh: '高估偏北分量，預測颱風眼直接穿過尖沙咀。',
            waypoints: [
              { lat: 20.9, lon: 114.1 },
              { lat: 22.3, lon: 114.2 },
              { lat: 23.4, lon: 114.3 }
            ]
          }
        ],
        recommendedTrack: 'A',
        recommendedSignal: 7,
        acceptableSignals: [7, 8],
        actualPos: { lat: 20.9, lon: 114.1, label: '22/12Z' },
        colleaguePrompt: {
          speaker: 'lam',
          textZh: '「『柏絲』而家喺香港正南 155 公里，維港吹緊 40 節東北偏東烈風！按一九六二年規例，先掛『七號東北烈風訊號』（綠·綠·白燈）；等半夜個風移去西南偏南、風向轉東南嗰陣，就要改掛八號東南烈風訊號！」'
        },
        outcomes: {
          exact: {
            sceneArt: 'assets/scenes/hillside_huts.webp',
            speaker: 'mrs_chan',
            headlineZh: '高懸七號東北烈風訊號，山邊木屋區居民及時疏散',
            bodyZh: '尖沙咀山頭亮起綠、綠、白號燈。觀塘與筲箕灣山邊木屋區街坊聽到七號風球廣播，扶老攜幼帶著乾糧毛毯入住官立學校庇護站，避過夜間狂風暴雨。'
          },
          under: {
            sceneArt: 'assets/scenes/collapsed_huts.webp',
            speaker: 'mrs_chan',
            headlineZh: '四十節烈風襲港卻未掛烈風風球，木屋區死傷枕藉！',
            bodyZh: '狂風暴雨吹塌多間山邊木屋，由於天文台仍只掛三號或更低訊號，居民未獲撤離通知，多人被倒塌木樑壓傷！'
          },
          over: {
            sceneArt: 'assets/scenes/mast_hoist.webp',
            speaker: 'director',
            headlineZh: '颱風中心在南面百五公里外，過早懸掛十號颶風訊號失準',
            bodyZh: '維港風力為 40 節烈風，尚未達 64 節颶風，直接懸掛十號十字架訊號有違專業準則。'
          }
        }
      },
      {
        shiftNum: 4,
        timeZh: '八月二十三日 02:00 · 深宵第四報（轉吹八號東南烈風）',
        skyClass: 'sky-gale',
        windIntensity: 0.82,
        hkObs: {
          pressureMb: 988.2,
          pressureTrendZh: '最低點 (-4.2 mb / 6h)',
          windDirZh: '東南 (SE)',
          windKt: 48,
          gustKt: 73,
          waglanDirZh: '東南 (SE)',
          waglanKt: 52,
          waglanGustKt: 78,
          rainMmHr: 31.0,
          tideM: 2.9,
          distKm: 90,
          bearingZh: '西南偏南 (SSW)'
        },
        telegrams: [
          {
            id: 'patsy_s4_t1',
            fromZh: '大嶼山石壁及長洲測風站 (CHEUNG CHAU)',
            typeZh: '本港實測電報',
            timeStamp: '221800Z',
            rawCode: 'CHEUNG CHAU 221800Z WIND SE 52KT GUST 78KT BARO 985.4MB',
            textZh: '長洲及橫瀾島風向已明顯由東北轉為東南（SE），持續風力達 48 至 52 節烈風／暴風，陣風 78 節！尖沙咀氣壓見底於 988.2 毫巴。',
            fix: { lat: 21.6, lon: 113.7, source: 'PRATAS', radiusDeg: 0.25 }
          },
          {
            id: 'patsy_s4_t2',
            fromZh: '澳門地球物理暨氣象台 (MACAU)',
            typeZh: '鄰台實測電報',
            timeStamp: '221800Z',
            rawCode: 'MACAU OBS 221800Z WIND ENE 56KT BARO 981.0MB PATSY 35NM SOUTH',
            textZh: '澳門錄得 981.0 毫巴及 56 節暴風，報告柏絲中心正從澳門以南約 35 海里（香港西南偏南約 90 公里）掠過，趨向廣東台山沿岸，不會正面登陸香港。',
            fix: { lat: 21.6, lon: 113.6, source: 'MACAU', radiusDeg: 0.25 }
          },
          {
            id: 'patsy_s4_t3',
            fromZh: '海事處維港控制室 (MARINE DEPT)',
            typeZh: '海事處緊急通報',
            timeStamp: '221800Z',
            rawCode: 'WIND SHIFTED TO SOUTHEAST 48KT SHIPS AT BUOYS SWINGING REQUEST SIGNAL 8 SE',
            textZh: '水警何幫辦急電：「主任！維港風向已經轉咗做東南烈風 48 節，浮泡上面啲遠洋貨輪全部掉轉船頭受浪，快啲由七號東北烈風改掛『八號東南烈風訊號』（兩個向下黑錐體 ▼/▼，白·白·綠燈）！」',
            fix: { lat: 21.5, lon: 113.7, source: 'SHIP', radiusDeg: 0.35 }
          }
        ],
        tracks: [
          {
            id: 'A',
            labelZh: 'A 線：向西北偏西登陸廣東台山至陽江一帶',
            descZh: '柏絲於香港西南偏南 90 公里掠過後，明晨在澳門西面台山沿岸登陸，本港將由東南烈風（八號）逐漸轉為西南烈風（六號）。',
            waypoints: [
              { lat: 21.6, lon: 113.7 },
              { lat: 21.9, lon: 112.9 },
              { lat: 22.3, lon: 112.1 }
            ]
          },
          {
            id: 'B',
            labelZh: 'B 線：突然急轉九十度向東橫掃香港島',
            descZh: '誤判颱風在澳門南面急轉彎直撞香港。',
            waypoints: [
              { lat: 21.6, lon: 113.7 },
              { lat: 22.2, lon: 114.2 },
              { lat: 22.6, lon: 115.2 }
            ]
          },
          {
            id: 'C',
            labelZh: 'C 線：南下返回西沙群島',
            descZh: '錯誤預測風暴向南倒退。',
            waypoints: [
              { lat: 21.6, lon: 113.7 },
              { lat: 20.0, lon: 113.5 },
              { lat: 18.5, lon: 113.3 }
            ]
          }
        ],
        recommendedTrack: 'A',
        recommendedSignal: 8,
        acceptableSignals: [8, 9],
        actualPos: { lat: 21.6, lon: 113.7, label: '22/18Z' },
        colleaguePrompt: {
          speaker: 'ho_sir',
          textZh: '「主任！個風而家去咗香港西南偏南 90 公里，維港同鯉魚門轉晒吹東南烈風 48 節！一九六二年風球制度分得好清楚：東北烈風掛七號，而家轉吹東南烈風，必須改掛『八號東南烈風訊號』（白·白·綠燈），等避風塘同浮泡船隻即刻調整東面錨鏈！」'
        },
        outcomes: {
          exact: {
            sceneArt: 'assets/scenes/ship_dragging.webp',
            speaker: 'ho_sir',
            headlineZh: '深宵精準改掛八號東南烈風訊號（白·白·綠），貨輪及時加錨',
            bodyZh: '尖沙咀山頭號燈由綠綠白改為白白綠（八號東南烈風訊號）。維港浮泡上的二十多艘遠洋貨輪接獲東南風轉向警訊，立即加拋船尾錨並開動主機頂風，無一走錨擱淺！'
          },
          under: {
            sceneArt: 'assets/scenes/ship_dragging.webp',
            speaker: 'ho_sir',
            headlineZh: '東南狂風 48 節卻降掛低風球，維港貨輪走錨撞毀防波堤！',
            bodyZh: '在颱風最接近本港的深宵誤降風球，令船隻誤以為威脅已過，結果三艘貨輪在 48 節東南烈風中走錨相撞！'
          },
          over: {
            sceneArt: 'assets/scenes/mast_hoist.webp',
            speaker: 'director',
            headlineZh: '颱風於澳門以南掠過未達颶風，誤掛十號訊號失準',
            bodyZh: '柏絲中心在 90 公里外掠過，本港持續風力 48 節（烈風），並未出現 64 節颶風，懸掛十號訊號屬於過度預警。'
          }
        }
      },
      {
        shiftNum: 5,
        timeZh: '八月二十三日 08:00 · 早更第五報（六號西南回南風）',
        skyClass: 'sky-gale',
        windIntensity: 0.64,
        hkObs: {
          pressureMb: 993.8,
          pressureTrendZh: '回升 (+5.6 mb / 6h)',
          windDirZh: '西南偏南 (SSW)',
          windKt: 36,
          gustKt: 54,
          waglanDirZh: '西南 (SW)',
          waglanKt: 39,
          waglanGustKt: 57,
          rainMmHr: 19.5,
          tideM: 2.4,
          distKm: 135,
          bearingZh: '西南偏西 (WSW)'
        },
        telegrams: [
          {
            id: 'patsy_s5_t1',
            fromZh: '澳門地球物理暨氣象台 (MACAU)',
            typeZh: '鄰台實測電報',
            timeStamp: '230000Z',
            rawCode: 'MACAU OBS 230000Z WIND SW 42KT BARO 989.5MB RISING PATSY LANDFALL TAISHAN',
            textZh: '柏絲剛於廣東台山沿岸登陸（北緯 21.9 度、東經 112.9 度），港澳兩地已轉吹強勁西南「回南風」，本港維港及長洲仍錄得 36 至 39 節西南烈風！',
            fix: { lat: 21.9, lon: 112.9, source: 'MACAU', radiusDeg: 0.25 }
          },
          {
            id: 'patsy_s5_t2',
            fromZh: '油麻地避風塘水警崗 (YAU MA TEI SHELTER)',
            typeZh: '避風塘緊急報告',
            timeStamp: '230000Z',
            rawCode: 'YAU MA TEI SHELTER WEST ENTRANCE BATTERED BY SW GALE 36KT',
            textZh: '油麻地及長洲避風塘西口正受 36 節西南烈風（回南風）正面吹襲，湧浪由西面湧入塘內，必須改掛六號西南烈風訊號以示警戒！',
            fix: { lat: 21.8, lon: 112.8, source: 'PRATAS', radiusDeg: 0.35 }
          },
          {
            id: 'patsy_s5_t3',
            fromZh: '尖沙咀天文台主樓 (ROHK MAIN BUILDING)',
            typeZh: '本台自記風速計',
            timeStamp: '230000Z',
            rawCode: 'ROHK ANEMOGRAM SSW 36KT GUST 54KT RAINBANDS CONTINUING',
            textZh: '天文台達因風速計紀錄顯示：雖然氣壓回升，但颱風南半圓的西南季風槽正掃過珠江口，烈風將維持至中午前後。',
            fix: { lat: 22.0, lon: 113.0, source: 'SHIP', radiusDeg: 0.35 }
          }
        ],
        tracks: [
          {
            id: 'A',
            labelZh: 'A 線：深入廣東西部內陸（陽春至梧州）並減弱',
            descZh: '柏絲登陸台山後向西北偏西深入內陸，本港西南烈風將於午後減退為強風。',
            waypoints: [
              { lat: 21.9, lon: 112.9 },
              { lat: 22.4, lon: 112.0 },
              { lat: 23.0, lon: 111.2 }
            ]
          },
          {
            id: 'B',
            labelZh: 'B 線：由台山出海折返香港',
            descZh: '不切實際地預測已登陸颱風掉頭向東。',
            waypoints: [
              { lat: 21.9, lon: 112.9 },
              { lat: 22.1, lon: 113.6 },
              { lat: 22.3, lon: 114.2 }
            ]
          },
          {
            id: 'C',
            labelZh: 'C 線：南下瓊州海峽',
            descZh: '預測颱風轉向西南偏南。',
            waypoints: [
              { lat: 21.9, lon: 112.9 },
              { lat: 21.0, lon: 111.5 },
              { lat: 20.1, lon: 110.2 }
            ]
          }
        ],
        recommendedTrack: 'A',
        recommendedSignal: 6,
        acceptableSignals: [6, 8],
        actualPos: { lat: 21.9, lon: 112.9, label: '23/00Z' },
        colleaguePrompt: {
          speaker: 'coxswain',
          textZh: '「天文台長官，我係油麻地漁民陳伯呀！我哋水上人最怕『回南風』——個風登陸台山之後，36 節西南烈風直灌入避風塘西口！請即刻由八號東南改掛『六號西南烈風訊號』（單個向下黑錐體 ▼），等全港水上人封實西口防波堤！」'
        },
        outcomes: {
          exact: {
            sceneArt: 'assets/scenes/shelter.webp',
            speaker: 'coxswain',
            headlineZh: '早更改掛六號西南烈風訊號（▼），避風塘嚴防回南風',
            bodyZh: '尖沙咀訊號架升起單個尖端向下黑錐體（六號西南烈風訊號）。長洲、香港仔與油麻地避風塘漁船見訊號轉為六號，立即加固西向纜索，成功抵禦回南狂浪。'
          },
          under: {
            sceneArt: 'assets/scenes/junk_at_sea.webp',
            speaker: 'coxswain',
            headlineZh: '回南烈風仍達 36 節卻過早改掛三號，避風塘西口多船撞毀！',
            bodyZh: '因過早除下烈風訊號，市民冒著 36 節西南烈風外出，長洲與油麻地西口多艘漁船防備鬆懈而被回南大浪拍沉！'
          },
          over: {
            sceneArt: 'assets/scenes/mast_hoist.webp',
            speaker: 'director',
            headlineZh: '颱風已登陸台山並減弱，反升掛九號／十號訊號背離實況',
            bodyZh: '氣壓已大幅回升 5.6 毫巴且風力正由頂峰回落，升掛九號或十號訊號令台長大惑不解。'
          }
        }
      },
      {
        shiftNum: 6,
        timeZh: '八月二十三日 14:00 · 午更第六報（改掛三號復常）',
        skyClass: 'sky-strong',
        windIntensity: 0.35,
        hkObs: {
          pressureMb: 999.6,
          pressureTrendZh: '持續回升 (+5.8 mb / 6h)',
          windDirZh: '南至西南 (SSW)',
          windKt: 25,
          gustKt: 37,
          waglanDirZh: '南 (S)',
          waglanKt: 28,
          waglanGustKt: 40,
          rainMmHr: 4.5,
          tideM: 1.9,
          distKm: 235,
          bearingZh: '西北偏西 (WNW)'
        },
        telegrams: [
          {
            id: 'patsy_s6_t1',
            fromZh: '廣州氣象台 (CANTON 59287)',
            typeZh: '地面實測電報',
            timeStamp: '230600Z',
            rawCode: 'SYNOP 59287 230600Z 13024KT 994.0MB PATSY WEAKENING INLAND',
            textZh: '柏絲已深入廣東陽春至羅定山區（北緯 22.4 度、東經 112.0 度），受地形摩擦迅速減弱為熱帶風暴。',
            fix: { lat: 22.4, lon: 112.0, source: 'PRATAS', radiusDeg: 0.35 }
          },
          {
            id: 'patsy_s6_t2',
            fromZh: '橫瀾島燈塔 (WAGLAN ISLAND)',
            typeZh: '本港外島實測',
            timeStamp: '230600Z',
            rawCode: 'WAGLAN 230600Z WIND S 28KT HARBOUR SSW 25KT GALE OVER',
            textZh: '維港持續風力已由 36 節回落至 25 節（強風程度），橫瀾島 28 節，烈風已全面消退，惟海面仍有湧浪，適宜改掛三號強風訊號。',
            fix: { lat: 22.3, lon: 112.1, source: 'MACAU', radiusDeg: 0.40 }
          },
          {
            id: 'patsy_s6_t3',
            fromZh: '九龍巴士及天星小輪 (PUBLIC TRANSPORT)',
            typeZh: '復航準備通報',
            timeStamp: '230600Z',
            rawCode: 'FERRIES AND BUSES READY TO RESUME SERVICE UPON SIGNAL 3',
            textZh: '各大渡輪及巴士公司已準備就緒，只要天文台由六號烈風訊號改掛三號強風訊號，下午市面及交通即可逐步恢復。',
            fix: { lat: 22.5, lon: 111.9, source: 'SHIP', radiusDeg: 0.45 }
          }
        ],
        tracks: [
          {
            id: 'A',
            labelZh: 'A 線：繼續向西北偏西移入廣西梧州並消散',
            descZh: '柏絲在內陸填塞消散，本港維持偏南強風至傍晚。',
            waypoints: [
              { lat: 22.4, lon: 112.0 },
              { lat: 23.1, lon: 111.1 },
              { lat: 23.7, lon: 110.3 }
            ]
          },
          {
            id: 'B',
            labelZh: 'B 線：突然東移襲擊廣州及香港',
            descZh: '錯誤預測內陸殘餘低壓折返珠江口。',
            waypoints: [
              { lat: 22.4, lon: 112.0 },
              { lat: 22.4, lon: 113.2 },
              { lat: 22.3, lon: 114.2 }
            ]
          },
          {
            id: 'C',
            labelZh: 'C 線：南下出海重入南海',
            descZh: '錯誤預測風暴向南出海。',
            waypoints: [
              { lat: 22.4, lon: 112.0 },
              { lat: 21.2, lon: 111.8 },
              { lat: 20.0, lon: 111.6 }
            ]
          }
        ],
        recommendedTrack: 'A',
        recommendedSignal: 3,
        acceptableSignals: [3],
        actualPos: { lat: 22.4, lon: 112.0, label: '23/06Z' },
        colleaguePrompt: {
          speaker: 'lam',
          textZh: '「『柏絲』已經入咗廣東山區減弱，維港風力跌返落 25 節偏南強風。而家由六號西南烈風改掛『三號強風訊號』（倒 T 字），既提醒漁船仲有湧浪，又可以等天星小輪同電車下晝復航！」'
        },
        outcomes: {
          exact: {
            sceneArt: 'assets/scenes/star_ferry.webp',
            speaker: 'sau_lan',
            headlineZh: '午後改掛三號強風訊號，渡輪復航、市民秩序井然',
            bodyZh: '尖沙咀訊號架換上倒 T 字三號強風訊號。天星小輪重新開閘，九龍與港島恢復往來，而避風塘漁船則待湧浪完全平息後方才出航。'
          },
          under: {
            sceneArt: 'assets/scenes/junk_at_sea.webp',
            speaker: 'ho_sir',
            headlineZh: '維港仍有 25 節強風及大湧浪卻直接除下所有風球',
            bodyZh: '未經三號強風訊號過渡便直接除下所有風球，令部分小艇在餘浪中險象環生。'
          },
          over: {
            sceneArt: 'assets/scenes/shelter_empty.webp',
            speaker: 'director',
            headlineZh: '烈風已退仍高掛烈風訊號，全港下午白白停市半天',
            bodyZh: '維港風力已回落至 25 節，繼續高掛烈風訊號令下午工商業與交通無法復常。'
          }
        }
      }
    ],
    debrief: {
      newspaperName: '華僑日報',
      dateZh: '一九六二年八月二十四日（星期五）',
      goodHeadlineZh: '颱風柏絲掠港澳南面登陸台山　天文台七號八號六號依序更替',
      goodSubheadZh: '預報主任精準掌握東北轉東南再轉回南烈風　維港貨輪與避風塘安然無恙',
      goodBodyZh: '【本報訊】颱風「柏絲」昨夜今晨於本港西南偏南約九十公里掠過並登陸台山。皇家天文台先後懸掛一號、三號訊號，入夜後隨風向順時針轉變，依序懸掛七號東北烈風、八號東南烈風及六號西南烈風訊號，午後改掛三號強風訊號復市，四象限風球調度絲絲入扣，全港無重大海事傷亡。',
      badHeadlineZh: '颱風柏絲擦港而過　風球象限更替失準船隻受驚',
      badSubheadZh: '回南風與東南浪突襲避風塘　水上人盼訊號更貼合風向',
      badBodyZh: '【本報訊】颱風「柏絲」昨夜掠過珠江口以南海域，期間本港風向由東北轉東南再轉西南，惟天文台風球訊號未能準確反映風向轉變，部分浮泡貨輪及避風塘艇戶措手不及。',
      directorGoodZh: '顏士爾台長大表讚賞：「『柏絲』完美展示了為何香港需要 5、6、7、8 四個方向的烈風訊號！你能依足風向由七號轉八號再轉六號，海事處處長今早親自致電向我道謝！」',
      directorBadZh: '顏士爾台長語重心長：「當颱風從南面掠過西行，香港風向必然由東北（七號）轉東南（八號）再轉西南（六號）。弄錯象限訊號，海上的船長便會拋錯錨！」'
    }
  },

  // =========================================================================
  // STORM 4: 超強颱風溫黛 (SUPER TYPHOON WANDA) — 31 Aug – 1 Sep 1962 (6 Shifts)
  // Historical climax: Hong Kong's deadliest post-war typhoon. Record low
  // sea-level pressure 953.2 mb at Royal Observatory, 72+ kt sustained hurricane
  // winds (gusts 140 kt at Tate's Cairn, 108 kt at ROHK), and a devastating
  // 5-metre storm surge in Tolo Harbour (Sha Tin & Tai Po).
  // =========================================================================
  {
    id: 'storm4_wanda',
    index: 4,
    codeEn: 'SUPER TYPHOON WANDA',
    nameZh: '超強颱風溫黛',
    subtitleZh: '一九六二年八月三十一日至九月一日 · 世紀颶風（共六更）',
    dateRangeZh: '一九六二年八月三十一日至九月一日',
    coverArt: 'assets/storms/storm4_wanda.webp',
    introBriefZh:
      '一九六二年八月三十一日，環流直徑逾一千公里的超強颱風「溫黛」穿過呂宋海峽直撲香港。這是一場載入香港史冊的世紀考驗：天文台水銀氣壓計將跌破有紀錄以來最低的 953.2 毫巴，大老山陣風高達 140 節，吐露港沙田與大埔更面臨五米高風暴潮沒頂之災！你每一個風球決定與電台緊急廣播，都直接決定數以百計市民與漁民的生死！',
    historyPoints: [
      { lat: 19.6, lon: 120.2, label: '30/18Z' },
      { lat: 20.1, lon: 118.8, label: '31/00Z' }
    ],
    shifts: [
      {
        shiftNum: 1,
        timeZh: '八月三十一日 08:00 · 早更第一報（山雨欲來）',
        skyClass: 'sky-strong',
        windIntensity: 0.36,
        hkObs: {
          pressureMb: 998.6,
          pressureTrendZh: '持續下降 (-2.8 mb / 6h)',
          windDirZh: '北至東北 (NNE)',
          windKt: 23,
          gustKt: 34,
          waglanDirZh: '東北偏北 (NNE)',
          waglanKt: 27,
          waglanGustKt: 38,
          rainMmHr: 3.5,
          tideM: 1.9,
          distKm: 395,
          bearingZh: '東南偏東 (ESE)'
        },
        telegrams: [
          {
            id: 'wanda_s1_t1',
            fromZh: '美軍關島氣象偵察機 (USAF SWAN 31)',
            typeZh: '飛機投落儀電報',
            timeStamp: '310000Z',
            rawCode: 'RECCO SWAN31 FIX 20.4N 117.7E 948MB MAX WIND 110KT HUGE CIRCULATION',
            textZh: '美軍偵察機驚人報告：溫黛中心位於北緯 20.4 度、東經 117.7 度（香港東南偏東約 395 公里），中心氣壓低至 948 毫巴，最大持續風速 110 節，暴風圈半徑逾 180 海里！',
            fix: { lat: 20.4, lon: 117.7, source: 'RECON', radiusDeg: 0.30 }
          },
          {
            id: 'wanda_s1_t2',
            fromZh: '東沙島氣象台 (PRATAS 59792)',
            typeZh: '地面實測電報',
            timeStamp: '310000Z',
            rawCode: 'SYNOP 59792 310000Z 01052KT 976.4MB BARO PLUNGING',
            textZh: '東沙島已吹北風 52 節暴風，氣壓狂瀉至 976.4 毫巴，巨浪滔天；香港橫瀾島亦已錄得 27 節強風，維港 23 節。',
            fix: { lat: 20.5, lon: 117.5, source: 'PRATAS', radiusDeg: 0.35 }
          },
          {
            id: 'wanda_s1_t3',
            fromZh: '台北氣象所及馬尼拉局 (JOINT WARNING)',
            typeZh: '鄰台聯合警告',
            timeStamp: '302300Z',
            rawCode: 'TYPHOON WANDA MOVING WNW 11KT AIMING DIRECTLY AT PEARL RIVER ESTUARY',
            textZh: '外台一致警告：太平洋副熱帶高壓脊強勢西伸，引導溫黛以 11 節穩定速度向西北偏西直撲香港及珠江口，絕無北折跡象！',
            fix: { lat: 20.3, lon: 117.8, source: 'TAIPEI', radiusDeg: 0.45 }
          }
        ],
        tracks: [
          {
            id: 'A',
            labelZh: 'A 線：向西北偏西（WNW）直撲香港南面水域（時速 11 節）',
            descZh: '高壓脊堅挺，溫黛將毫無偏折地正面襲港，明日清晨眼壁直抵維多利亞港與吐露港！',
            waypoints: [
              { lat: 20.4, lon: 117.7 },
              { lat: 21.1, lon: 116.2 },
              { lat: 21.8, lon: 114.8 }
            ]
          },
          {
            id: 'B',
            labelZh: 'B 線：北折轉入台灣海峽',
            descZh: '一廂情願地假設溫黛會像凱蒂或諾拉一樣東折離開。',
            waypoints: [
              { lat: 20.4, lon: 117.7 },
              { lat: 21.8, lon: 118.2 },
              { lat: 23.2, lon: 119.0 }
            ]
          },
          {
            id: 'C',
            labelZh: 'C 線：偏南西行趨向越南峴港',
            descZh: '錯誤估計風暴大幅南偏。',
            waypoints: [
              { lat: 20.4, lon: 117.7 },
              { lat: 19.2, lon: 115.0 },
              { lat: 18.0, lon: 112.0 }
            ]
          }
        ],
        recommendedTrack: 'A',
        recommendedSignal: 3,
        acceptableSignals: [3, 1],
        actualPos: { lat: 20.4, lon: 117.7, label: '31/00Z' },
        colleaguePrompt: {
          speaker: 'lam',
          textZh: '「主任，『溫黛』個環流大得驚人！雖然仲喺東沙東面近四百公里，但橫瀾島已經吹緊 27 節強風，維港都有 23 節。一號戒備已經唔夠用，必須即刻掛『三號強風訊號』（倒 T 字），催促全港漁船同低窪地區今日內完成防風準備！」'
        },
        outcomes: {
          exact: {
            sceneArt: 'assets/scenes/shelter.webp',
            speaker: 'coxswain',
            headlineZh: '早更即掛三號強風訊號，數千艘漁船趕在暴風前入塘',
            bodyZh: '尖沙咀訊號架升起倒 T 字三號強風訊號。收音機反覆廣播超強颱風溫黛正正面逼近，外海作業的數千艘漁船及時駛入油麻地、香港仔與銅鑼灣避風塘。'
          },
          under: {
            sceneArt: 'assets/scenes/junk_at_sea.webp',
            speaker: 'ho_sir',
            headlineZh: '橫瀾島已吹 27 節強風卻未掛三號風球，延誤全港戒備！',
            bodyZh: '面對百年一遇的巨型颱風，早更未能及時懸掛三號強風訊號，令大批離岸船隻錯失黃金避風時間！'
          },
          over: {
            sceneArt: 'assets/scenes/tram_flood.webp',
            speaker: 'director',
            headlineZh: '早晨風力尚在 23 節便直接掛八號以上訊號，程序過急',
            bodyZh: '雖然溫黛威力強大，但早上八時距港尚有四百公里，應先以三號強風訊號讓市民購買糧食及加固門窗。'
          }
        }
      },
      {
        shiftNum: 2,
        timeZh: '八月三十一日 16:00 · 哺更第二報（七號東北烈風）',
        skyClass: 'sky-gale',
        windIntensity: 0.68,
        hkObs: {
          pressureMb: 991.5,
          pressureTrendZh: '急跌 (-7.1 mb / 8h)',
          windDirZh: '東北偏北 (NNE)',
          windKt: 36,
          gustKt: 56,
          waglanDirZh: '東北 (NE)',
          waglanKt: 43,
          waglanGustKt: 63,
          rainMmHr: 16.0,
          tideM: 2.3,
          distKm: 260,
          bearingZh: '東南偏東 (ESE)'
        },
        telegrams: [
          {
            id: 'wanda_s2_t1',
            fromZh: '東沙島氣象台 (PRATAS 59792)',
            typeZh: '地面實測電報',
            timeStamp: '310800Z',
            rawCode: 'SYNOP 59792 310800Z 22078KT 958.2MB ANEMOMETER DAMAGED BY HURRICANE',
            textZh: '東沙島最後一封緊急電報：吹西南颶風 78 節，氣壓 958.2 毫巴，測風儀剛被狂風吹毀！溫黛中心已越過東沙島北上，距香港僅約 260 公里！',
            fix: { lat: 21.1, lon: 116.2, source: 'PRATAS', radiusDeg: 0.25 }
          },
          {
            id: 'wanda_s2_t2',
            fromZh: '橫瀾島燈塔 (WAGLAN ISLAND)',
            typeZh: '本港外島實測',
            timeStamp: '310800Z',
            rawCode: 'WAGLAN 310800Z WIND NE 43KT GUST 63KT HARBOUR NNE 36KT',
            textZh: '下午四時，橫瀾島東北烈風已達 43 節、陣風 63 節；維港尖沙咀亦錄得 36 節烈風，鉛灰色雨雲壓頂，氣壓八小時狂跌 7.1 毫巴！',
            fix: { lat: 21.2, lon: 116.1, source: 'SHIP', radiusDeg: 0.35 }
          },
          {
            id: 'wanda_s2_t3',
            fromZh: '新界民政署（大埔及沙田理民府）',
            typeZh: '風暴潮緊急預警查詢',
            timeStamp: '310800Z',
            rawCode: 'SHA TIN AND TAI PO LOW LYING VILLAGES INQUIRE GALE AND TIDE DANGER',
            textZh: '大埔及沙田理民官緊急來電：明日上午適逢天文大潮，若溫黛正面襲港，吐露港海灣呈漏斗狀，東北烈風將把海水推進沙田低窪木屋與艇戶，促請立即懸掛七號東北烈風訊號並協助撤離！',
            fix: { lat: 21.0, lon: 116.3, source: 'RECON', radiusDeg: 0.30 }
          }
        ],
        tracks: [
          {
            id: 'A',
            labelZh: 'A 線：直指香港南面擔竿列島至大嶼山（明日上午最近本港）',
            descZh: '溫黛正以 11 節穩定逼近，今晚深夜風力將急劇增強（九號訊號），明晨眼壁將正面橫掃香港（十號颶風訊號）並引發吐露港嚴重風暴潮！',
            waypoints: [
              { lat: 21.1, lon: 116.2 },
              { lat: 21.7, lon: 115.0 },
              { lat: 22.1, lon: 114.1 }
            ]
          },
          {
            id: 'B',
            labelZh: 'B 線：偏北登陸汕尾至惠東',
            descZh: '低估對維港與吐露港的正面衝擊。',
            waypoints: [
              { lat: 21.1, lon: 116.2 },
              { lat: 22.2, lon: 115.8 },
              { lat: 23.1, lon: 115.4 }
            ]
          },
          {
            id: 'C',
            labelZh: 'C 線：向西遠離趨向湛江',
            descZh: '錯誤估計風暴偏南西行。',
            waypoints: [
              { lat: 21.1, lon: 116.2 },
              { lat: 20.8, lon: 114.0 },
              { lat: 20.5, lon: 111.8 }
            ]
          }
        ],
        recommendedTrack: 'A',
        recommendedSignal: 7,
        acceptableSignals: [7],
        actualPos: { lat: 21.1, lon: 116.2, label: '31/08Z' },
        colleaguePrompt: {
          speaker: 'lam',
          textZh: '「東沙島個風速計都被吹爛埋！而家下午四點，維港已經吹緊 36 節東北烈風，必須即刻掛『七號東北烈風訊號』（▲/▲，綠·綠·白燈）！我建議你仲要打電話畀水警同電台，特別警告吐露港沙田、大埔艇戶趁未入夜快啲上岸撤離！」'
        },
        outcomes: {
          exact: {
            sceneArt: 'assets/scenes/taping_windows.webp',
            speaker: 'mrs_chan',
            headlineZh: '下午四時高掛七號東北烈風訊號，全港趕在入夜前停市撤離',
            bodyZh: '兩個向上黑錐體升上尖沙咀訊號架！全港學校、寫字樓與工廠趕在天黑前停工，渡輪有序完成尾班疏導，水警輪更駛入吐露港沙田海及大埔元洲仔，用擴音器催促沿岸棚屋與漁艇立即撤往高地。'
          },
          under: {
            sceneArt: 'assets/scenes/collapsed_huts.webp',
            speaker: 'mrs_chan',
            headlineZh: '傍晚已吹 36 節烈風卻遲遲不掛七號風球，數十萬市民困於途上！',
            bodyZh: '狂風驟雨中仍只掛三號或更低訊號，導致下班市民與學童在碼頭飽受狂風吹襲，沙田與大埔低窪居民亦未獲撤離警告！'
          },
          over: {
            sceneArt: 'assets/scenes/mast_hoist.webp',
            speaker: 'director',
            headlineZh: '跳過七號烈風直接懸掛十號訊號，渡輪瞬間停航令過海市民滯留',
            bodyZh: '下午四時風暴中心尚在 260 公里外，不經七號東北烈風過渡便直接掛十號，導致天星小輪即刻落閘，數萬市民滯留中環無船歸家。'
          }
        }
      },
      {
        shiftNum: 3,
        timeZh: '九月一日 02:00 · 深宵第三報（九號烈風增強）',
        skyClass: 'sky-storm',
        windIntensity: 0.88,
        hkObs: {
          pressureMb: 974.8,
          pressureTrendZh: '暴跌 (-16.7 mb / 10h)',
          windDirZh: '東北偏北 (NNE)',
          windKt: 54,
          gustKt: 86,
          waglanDirZh: '東北 (NE)',
          waglanKt: 62,
          waglanGustKt: 94,
          rainMmHr: 42.0,
          tideM: 3.4,
          distKm: 110,
          bearingZh: '東南偏南 (SSE)'
        },
        telegrams: [
          {
            id: 'wanda_s3_t1',
            fromZh: '橫瀾島燈塔 (WAGLAN ISLAND)',
            typeZh: '本港外島緊急實測',
            timeStamp: '311800Z',
            rawCode: 'WAGLAN 311800Z WIND NE 62KT GUST 94KT BARO 969.4MB PLUNGING',
            textZh: '橫瀾島深夜實測東北暴風 62 節（距 64 節颶風僅差 2 節），陣風高達 94 節！氣壓跌至 969.4 毫巴，巨浪直撲燈塔頂部！',
            fix: { lat: 21.7, lon: 114.9, source: 'PRATAS', radiusDeg: 0.20 }
          },
          {
            id: 'wanda_s3_t2',
            fromZh: '大老山雷達站 (TATE’S CAIRN RADAR)',
            typeZh: '本港雷達定位',
            timeStamp: '311800Z',
            rawCode: 'TATES CAIRN RADAR EYE WALL 55NM SSE MOV WNW 11KT HIT AT DAWN',
            textZh: '大老山氣象雷達清晰捕捉到溫黛渾圓的颱風眼壁：中心位於北緯 21.7 度、東經 114.9 度（香港東南偏南約 110 公里），眼壁將於清晨五至六時正面撞擊香港！',
            fix: { lat: 21.7, lon: 114.9, source: 'RECON', radiusDeg: 0.18 }
          },
          {
            id: 'wanda_s3_t3',
            fromZh: '大埔理民府及水警北分區 (TAI PO MARINE POLICE)',
            typeZh: '風暴潮緊急求救',
            timeStamp: '311800Z',
            rawCode: 'TOLO HARBOUR TIDE RISING RAPIDLY ABOVE 3.4M REQUEST SIGNAL 9 EMERGENCY',
            textZh: '水警何幫辦深夜疾呼：「吐露港海水已經漲到三米四，東北暴風將成個海推緊入沙田同大埔墟！快啲改掛『九號烈風增強訊號』（綠·綠·綠燈），等全港警察同消防強制最後一批低窪居民撤離！」',
            fix: { lat: 21.6, lon: 115.0, source: 'SHIP', radiusDeg: 0.25 }
          }
        ],
        tracks: [
          {
            id: 'A',
            labelZh: 'A 線：眼壁於清晨正面橫掃香港島及橫瀾島，上午掠過大嶼山以南',
            descZh: '雷達顯示溫黛正以 11 節向西北偏西推進，清晨六時起全港將普遍吹 64 節以上颶風，氣壓將跌破 955 毫巴！',
            waypoints: [
              { lat: 21.7, lon: 114.9 },
              { lat: 22.1, lon: 114.2 },
              { lat: 22.3, lon: 113.5 }
            ]
          },
          {
            id: 'B',
            labelZh: 'B 線：在擔竿島外海原地停滯消散',
            descZh: '完全違背雷達實況。',
            waypoints: [
              { lat: 21.7, lon: 114.9 },
              { lat: 21.7, lon: 114.8 },
              { lat: 21.7, lon: 114.7 }
            ]
          },
          {
            id: 'C',
            labelZh: 'C 線：急轉向東遠離香港',
            descZh: '完全違背雷達實況。',
            waypoints: [
              { lat: 21.7, lon: 114.9 },
              { lat: 21.9, lon: 116.2 },
              { lat: 22.2, lon: 117.5 }
            ]
          }
        ],
        recommendedTrack: 'A',
        recommendedSignal: 9,
        acceptableSignals: [9, 10],
        actualPos: { lat: 21.7, lon: 114.9, label: '31/18Z' },
        colleaguePrompt: {
          speaker: 'lam',
          textZh: '「睇吓自記氣壓計支筆——直插落去 974.8 毫巴，似足一九三七年丁丑風災！維港持續風力已經升到 54 節，橫瀾島 62 節！即刻改掛『九號烈風增強訊號』（沙漏形 ▼/▲，綠·綠·綠燈），預告全港清晨將懸掛十號颶風訊號！」'
        },
        outcomes: {
          exact: {
            sceneArt: 'assets/scenes/marine_launch.webp',
            speaker: 'ho_sir',
            headlineZh: '深宵高懸九號烈風增強訊號（綠·綠·綠），水警徹夜搶救吐露港居民',
            bodyZh: '尖沙咀山頭亮起三盞綠燈（九號烈風增強訊號）。水警、消防與駐港英軍出動裝甲車及救生艇，在黎明颶風及海嘯般的大潮抵達前，將沙田白鶴汀與大埔元洲仔數千名村民強行撤上山坡！'
          },
          under: {
            sceneArt: 'assets/scenes/collapsed_huts.webp',
            speaker: 'mrs_chan',
            headlineZh: '暴風已達 54 至 62 節卻未升掛九號訊號，低窪居民錯失最後撤離時機！',
            bodyZh: '由於訊號未隨暴風急增而升級為九號，部分沙田與大埔居民以為風力不會再增強而留守屋內，情況極度危殆！'
          },
          over: {
            sceneArt: 'assets/scenes/mast_hoist.webp',
            speaker: 'ah_shing',
            headlineZh: '提前懸掛十號颶風訊號，全城進入最高防空戒備',
            bodyZh: '你在橫瀾島錄得 62 節暴風時提前升起十號訊號，防空警報徹夜長鳴，全港進入最高緊急狀態。'
          }
        }
      },
      {
        shiftNum: 4,
        timeZh: '九月一日 06:15 · 破曉第四報（十號颶風 · 世紀正面吹襲）',
        skyClass: 'sky-hurricane',
        windIntensity: 1.0,
        hkObs: {
          pressureMb: 953.2,
          pressureTrendZh: '破歷史最低紀錄 (-21.6 mb / 4h)',
          windDirZh: '東北轉東 (ENE/E)',
          windKt: 74,
          gustKt: 116,
          waglanDirZh: '東 (E)',
          waglanKt: 82,
          waglanGustKt: 128,
          rainMmHr: 68.0,
          tideM: 5.1,
          distKm: 28,
          bearingZh: '正南 (S)'
        },
        telegrams: [
          {
            id: 'wanda_s4_t1',
            fromZh: '尖沙咀皇家天文台主樓 (ROHK BAROGRAPH)',
            typeZh: '破紀錄實測警報',
            timeStamp: '010130Z',
            rawCode: 'ROHK BARO 953.2MB ALL TIME RECORD LOW SUSTAINED 74KT GUST 116KT',
            textZh: '天文台主樓水銀氣壓計跌至 953.2 毫巴，打破香港自一八八四年有紀錄以來最低氣壓！天文台錄得持續颶風 74 節、陣風 116 節，大老山陣風更高達 140 節（時速 259 公里）！',
            fix: { lat: 22.1, lon: 114.2, source: 'RECON', radiusDeg: 0.12 }
          },
          {
            id: 'wanda_s4_t2',
            fromZh: '沙田及大埔理民府 (TOLO HARBOUR SURGE)',
            typeZh: '災難級風暴潮報告',
            timeStamp: '010130Z',
            rawCode: 'TOLO HARBOUR STORM SURGE 5.1 METRES SEA WALLS BREACHED SHA TIN FLOODED',
            textZh: '吐露港水位暴漲至海圖基準面以上 5.1 米！五米高巨浪衝破沙田與大埔海堤，海水倒灌入沙田墟與白鶴汀，三千艘小艇與木屋在狂風巨浪中掙扎！',
            fix: { lat: 22.0, lon: 114.1, source: 'PRATAS', radiusDeg: 0.15 }
          },
          {
            id: 'wanda_s4_t3',
            fromZh: '海事處維港控制室 (VICTORIA HARBOUR)',
            typeZh: '海事處緊急災情',
            timeStamp: '010130Z',
            rawCode: 'OVER 30 OCEAN FREIGHTERS DRAGGING ANCHOR IN HARBOUR SIGNAL 10 REQUIRED',
            textZh: '維多利亞港內超過三十艘遠洋貨輪在百節颶風中走錨斷纜，多艘擱淺於青洲、昂船洲及九龍灣！必須懸掛最高級別之十號颶風訊號！',
            fix: { lat: 22.1, lon: 114.1, source: 'SHIP', radiusDeg: 0.18 }
          }
        ],
        tracks: [
          {
            id: 'A',
            labelZh: 'A 線：颱風眼壁正擦過香港島南端及長洲，向西北偏西移向珠江口',
            descZh: '溫黛中心正從天文台以南約 28 公里（長洲至蒲台島之間）掠過，下午移向澳門東北面並轉吹強烈西南回南風。',
            waypoints: [
              { lat: 22.1, lon: 114.2 },
              { lat: 22.3, lon: 113.5 },
              { lat: 22.7, lon: 112.8 }
            ]
          },
          {
            id: 'B',
            labelZh: 'B 線：向東折返汕頭',
            descZh: '明顯違背眼壁正在過境的實況。',
            waypoints: [
              { lat: 22.1, lon: 114.2 },
              { lat: 22.4, lon: 115.8 },
              { lat: 22.8, lon: 117.2 }
            ]
          },
          {
            id: 'C',
            labelZh: 'C 線：向南退入南海中部',
            descZh: '明顯違背眼壁正在過境的實況。',
            waypoints: [
              { lat: 22.1, lon: 114.2 },
              { lat: 20.6, lon: 114.2 },
              { lat: 19.0, lon: 114.2 }
            ]
          }
        ],
        recommendedTrack: 'A',
        recommendedSignal: 10,
        acceptableSignals: [10],
        actualPos: { lat: 22.1, lon: 114.2, label: '01/01Z' },
        colleaguePrompt: {
          speaker: 'director',
          textZh: '「顏士爾台長推開預報室木門，外頭狂風咆哮、玻璃窗劇烈震動：『氣壓 953.2 毫巴，持續風速 74 節，大老山陣風 140 節！這是香港戰後最猛烈的颶風，立即命令阿成冒雨升起十號颶風十字架訊號（紅·綠·紅燈），拉響全港防空警報！』」'
        },
        outcomes: {
          exact: {
            sceneArt: 'assets/scenes/mast_hoist.webp',
            speaker: 'ah_shing',
            headlineZh: '十號颶風十字架高懸尖沙咀山頭！紅綠紅號燈刺破漫天狂雨',
            bodyZh: '信號員阿成與兩名助手用安全繩綁實腰間，在時速逾二百公里的狂風中將黑色十字架（十號颶風訊號）絞上訊號架頂，紅、綠、紅三盞巨型號燈亮起，全港防空警報器淒厲長鳴！因預警及時，絕大多數市民已緊閉門窗留守安全建築內。'
          },
          under: {
            sceneArt: 'assets/scenes/collapsed_huts.webp',
            speaker: 'director',
            headlineZh: '世紀颶風眼壁正面襲港卻未掛十號風球，全港陷入滅頂災難！',
            bodyZh: '74 節持續颶風與 140 節陣風橫掃香江，吐露港五米風暴潮吞沒沙田與大埔低窪村落，因天文台失職未掛十號颶風訊號，無數市民與船隻在毫無最高戒備下慘遭吞噬！'
          },
          over: {
            sceneArt: 'assets/scenes/mast_hoist.webp',
            speaker: 'ah_shing',
            headlineZh: '十號颶風訊號生效',
            bodyZh: '十號颶風十字架高懸，全港死守室內抵禦世紀狂風。'
          }
        }
      },
      {
        shiftNum: 5,
        timeZh: '九月一日 14:00 · 午更第五報（改掛六號西南烈風）',
        skyClass: 'sky-gale',
        windIntensity: 0.72,
        hkObs: {
          pressureMb: 981.4,
          pressureTrendZh: '急速回升 (+28.2 mb / 6h)',
          windDirZh: '西南偏南 (SSW)',
          windKt: 46,
          gustKt: 72,
          waglanDirZh: '西南 (SW)',
          waglanKt: 50,
          waglanGustKt: 76,
          rainMmHr: 28.0,
          tideM: 2.8,
          distKm: 85,
          bearingZh: '西北偏西 (WNW)'
        },
        telegrams: [
          {
            id: 'wanda_s5_t1',
            fromZh: '澳門地球物理暨氣象台 (MACAU)',
            typeZh: '鄰台實測電報',
            timeStamp: '010600Z',
            rawCode: 'MACAU OBS 010600Z WANDA PASSED NE OF MACAU ENTERING PEARL RIVER ESTUARY',
            textZh: '溫黛中心已掠過大嶼山西南及澳門東北面，正沿珠江口西岸北上新會至中山一帶（北緯 22.4 度、東經 113.4 度）。',
            fix: { lat: 22.4, lon: 113.4, source: 'MACAU', radiusDeg: 0.20 }
          },
          {
            id: 'wanda_s5_t2',
            fromZh: '尖沙咀天文台及長洲測候站 (ROHK & CHEUNG CHAU)',
            typeZh: '本港風向轉變實測',
            timeStamp: '010600Z',
            rawCode: 'ROHK BARO RISING FAST 981.4MB WIND SHIFTED SW 46KT GUST 72KT',
            textZh: '天文台氣壓六小時內暴升 28.2 毫巴至 981.4 毫巴！颶風雖已減退，但全港現正受猛烈西南「回南風」吹襲，持續風力仍達 46 節烈風，陣風 72 節！',
            fix: { lat: 22.3, lon: 113.5, source: 'RECON', radiusDeg: 0.25 }
          },
          {
            id: 'wanda_s5_t3',
            fromZh: '海事處及消防處搜救指揮中心 (RESCUE HQ)',
            typeZh: '搜救行動通報',
            timeStamp: '010600Z',
            rawCode: 'HURRICANE OVER BUT SW GALES BATTERING WESTERN APPROACHES',
            textZh: '水警何幫辦通報：「颶風眼壁已經過去，但維港同長洲西面吹緊 46 節西南烈風，請由十號颶風改掛『六號西南烈風訊號』（單個向下黑錐體 ▼，綠·白·白燈），等市民知道颶風已過但千祈唔好出街住！」',
            fix: { lat: 22.4, lon: 113.3, source: 'SHIP', radiusDeg: 0.30 }
          }
        ],
        tracks: [
          {
            id: 'A',
            labelZh: 'A 線：沿珠江口西岸向西北偏北深入廣東三水及廣州西面',
            descZh: '溫黛在珠江口西岸登陸後深入內陸並減弱，本港將維持西南烈風（六號風球）至傍晚，入夜後減弱為強風（三號風球）。',
            waypoints: [
              { lat: 22.4, lon: 113.4 },
              { lat: 23.1, lon: 112.9 },
              { lat: 23.8, lon: 112.4 }
            ]
          },
          {
            id: 'B',
            labelZh: 'B 線：掉頭向東重襲香港維多利亞港',
            descZh: '錯誤預測已進入珠江口的颱風回頭東行。',
            waypoints: [
              { lat: 22.4, lon: 113.4 },
              { lat: 22.3, lon: 114.2 },
              { lat: 22.2, lon: 115.2 }
            ]
          },
          {
            id: 'C',
            labelZh: 'C 線：向正南退回萬山群島',
            descZh: '錯誤預測颱風向南移動。',
            waypoints: [
              { lat: 22.4, lon: 113.4 },
              { lat: 21.2, lon: 113.4 },
              { lat: 20.0, lon: 113.4 }
            ]
          }
        ],
        recommendedTrack: 'A',
        recommendedSignal: 6,
        acceptableSignals: [6, 8],
        actualPos: { lat: 22.4, lon: 113.4, label: '01/06Z' },
        colleaguePrompt: {
          speaker: 'lam',
          textZh: '「最恐怖嘅十號颶風總算捱過咗！氣壓升返上 981.4 毫巴，不過『溫黛』而家喺珠江口西面，全港轉吹 46 節西南回南烈風。按一九六二年史實同規例，下午二時正應該由十號颶風改掛『六號西南烈風訊號』（▼），警示西南狂風同湧浪！」'
        },
        outcomes: {
          exact: {
            sceneArt: 'assets/scenes/tram_flood.webp',
            speaker: 'ho_sir',
            headlineZh: '下午二時改掛六號西南烈風訊號（▼），搜救隊冒回南烈風搶險',
            bodyZh: '尖沙咀訊號架降下十號十字架，改掛單個向下黑錐體（六號西南烈風訊號）。市民得悉颶風最高峰已過，但仍留守室內躲避 46 節回南烈風，讓消防、水警與英軍搜救隊全力在沙田、大埔及維港展開救援。'
          },
          under: {
            sceneArt: 'assets/scenes/ship_dragging.webp',
            speaker: 'ho_sir',
            headlineZh: '回南烈風仍達 46 節卻過早改掛三號或除下風球，市民湧上街頭遇險！',
            bodyZh: '下午仍吹 46 節西南烈風、陣風 72 節，過早降為強風訊號令大批市民誤以為颱風已過而外出，多人被吹倒的招牌與高空墮物擊傷！'
          },
          over: {
            sceneArt: 'assets/scenes/mast_hoist.webp',
            speaker: 'director',
            headlineZh: '颶風已退至 46 節烈風仍不降十號訊號，阻礙緊急救災調度',
            bodyZh: '持續風力已低於 64 節颶風標準，應依例由十號改掛六號西南烈風訊號以反映真實風力及風向。'
          }
        }
      },
      {
        shiftNum: 6,
        timeZh: '九月一日 20:00 · 夜更第六報（改掛三號強風 · 劫後餘生）',
        skyClass: 'sky-strong',
        windIntensity: 0.34,
        hkObs: {
          pressureMb: 996.2,
          pressureTrendZh: '大幅回升 (+14.8 mb / 6h)',
          windDirZh: '南至東南 (SSE)',
          windKt: 26,
          gustKt: 38,
          waglanDirZh: '南 (S)',
          waglanKt: 29,
          waglanGustKt: 42,
          rainMmHr: 5.5,
          tideM: 2.0,
          distKm: 195,
          bearingZh: '西北偏北 (NNW)'
        },
        telegrams: [
          {
            id: 'wanda_s6_t1',
            fromZh: '廣州氣象台 (CANTON 59287)',
            typeZh: '地面實測電報',
            timeStamp: '011200Z',
            rawCode: 'SYNOP 59287 011200Z WANDA INLAND NEAR SANSHUI WEAKENING RAPIDLY',
            textZh: '溫黛已深入廣東三水至清遠內陸（北緯 23.2 度、東經 112.9 度），中心風力顯著減弱。',
            fix: { lat: 23.2, lon: 112.9, source: 'PRATAS', radiusDeg: 0.30 }
          },
          {
            id: 'wanda_s6_t2',
            fromZh: '橫瀾島及尖沙咀天文台 (ROHK OBS)',
            typeZh: '本港實測電報',
            timeStamp: '011200Z',
            rawCode: 'ROHK 011200Z WIND SSE 26KT GUST 38KT GALE SUBSIDED TO STRONG WIND',
            textZh: '入夜八時，維港持續風力已由 46 節回落至 26 節（強風程度），橫瀾島 29 節，烈風終於平息，惟離岸仍有大浪，應改掛三號強風訊號直至明晨。',
            fix: { lat: 23.1, lon: 113.0, source: 'MACAU', radiusDeg: 0.35 }
          },
          {
            id: 'wanda_s6_t3',
            fromZh: '港督府及輔政司署緊急救災委員會',
            typeZh: '全港善後通報',
            timeStamp: '011200Z',
            rawCode: 'COLONIAL SECRETARIAT COMMENDS OBSERVATORY WARNINGS RELIEF WORK UNDERWAY',
            textZh: '輔政司署致電天文台：隨着六號烈風改掛三號強風訊號，工務局、電燈公司與電話公司搶修隊立即通宵出動清理倒樹與電線，為明晨全港賑災開路。',
            fix: { lat: 23.3, lon: 112.8, source: 'SHIP', radiusDeg: 0.40 }
          }
        ],
        tracks: [
          {
            id: 'A',
            labelZh: 'A 線：繼續向西北偏北移入廣西及湖南內陸並消散',
            descZh: '溫黛深入華南內陸填塞，香港世紀風災正式落幕。',
            waypoints: [
              { lat: 23.2, lon: 112.9 },
              { lat: 24.1, lon: 112.3 },
              { lat: 25.0, lon: 111.8 }
            ]
          },
          {
            id: 'B',
            labelZh: 'B 線：折返珠江口出海',
            descZh: '錯誤預測內陸風暴回頭南下。',
            waypoints: [
              { lat: 23.2, lon: 112.9 },
              { lat: 22.3, lon: 113.8 },
              { lat: 21.5, lon: 114.5 }
            ]
          },
          {
            id: 'C',
            labelZh: 'C 線：向東移往梅縣及福建',
            descZh: '錯誤預測風暴向東移動。',
            waypoints: [
              { lat: 23.2, lon: 112.9 },
              { lat: 23.5, lon: 114.8 },
              { lat: 23.8, lon: 116.5 }
            ]
          }
        ],
        recommendedTrack: 'A',
        recommendedSignal: 3,
        acceptableSignals: [3, 0],
        actualPos: { lat: 23.2, lon: 112.9, label: '01/12Z' },
        colleaguePrompt: {
          speaker: 'lam',
          textZh: '「林先生摘下眼鏡，揉了揉熬紅的雙眼：『主任，三十六個鐘頭無停過……維港風力終於跌返落 26 節強風。而家改掛三號強風訊號（綠·白·綠燈），等工程隊通宵出動搶修馬路同電線啦。你已經盡晒一個預報員嘅全力！』」'
        },
        outcomes: {
          exact: {
            sceneArt: 'assets/scenes/calm_morning.webp',
            speaker: 'director',
            headlineZh: '入夜改掛三號強風訊號，全港救災搶修徹夜展開',
            bodyZh: '尖沙咀訊號架換上綠白綠三號燈號。經歷了破紀錄的 953.2 毫巴與十號颶風洗禮，香港在滿目瘡痍中迎來喘息，因為你準確而堅定的預警，數以千計原本會被吐露港風暴潮與維港狂浪吞噬的生命得以保全。'
          },
          under: {
            sceneArt: 'assets/scenes/calm_morning.webp',
            speaker: 'director',
            headlineZh: '風勢減緩，全港展開戰後最大規模救災行動',
            bodyZh: '隨着溫黛深入廣東內陸，香港風雨漸歇，救災人員徹夜搜救。'
          },
          over: {
            sceneArt: 'assets/scenes/tram_flood.webp',
            speaker: 'director',
            headlineZh: '烈風已退仍高掛烈風訊號，延誤工務局與電力公司外出搶修',
            bodyZh: '晚間風力已回落至 26 節，應及時改掛三號強風訊號以便公共搶修隊伍出動。'
          }
        }
      }
    ],
    debrief: {
      newspaperName: '華僑日報',
      dateZh: '一九六二年九月二日（星期日）',
      goodHeadlineZh: '溫黛創本港最低氣壓紀錄　十號風球及早高懸救活萬千生靈',
      goodSubheadZh: '氣壓低見九五三點二毫巴大老山陣風百四節　天文台預警精準吐露港及時撤離減輕慘劇',
      goodBodyZh: '【本報訊】超強颱風「溫黛」昨晨正面襲港，皇家天文台錄得九五三點二毫巴之歷史最低氣壓，大老山陣風高達一百四十節，吐露港更掀起五米高風暴潮。幸天文台自前日起依序懸掛三號、七號、九號及十號颶風訊號，並多次透過電台與水警緊急呼籲沙田、大埔及避風塘居民撤離，在百年一遇之天災下將人命傷亡減至最低，各界鹹表感佩。',
      badHeadlineZh: '世紀颱風溫黛正面蹂躪香江　海陸重創吐露港死傷慘重',
      badSubheadZh: '百四節狂風下三十餘貨輪走錨擱淺　沙田大埔風暴潮沒頂災情空前',
      badBodyZh: '【本報訊】超強颱風「溫黛」昨晨正面吹襲本港，創下九五三點二毫巴最低氣壓紀錄。狂風巨浪重創維港及吐露港，惟風暴期間預警與撤離通報未能緊貼災情惡化速度，導致低窪木屋區與水上人損失慘重。',
      directorGoodZh: '顏士爾台長緊握你的雙手，眼眶微紅：「面對一八八四年以來最強的『溫黛』，你在 953.2 毫巴的風眼壁前毫無懼色，三號、七號、九號、十號、六號、三號一氣呵成，更主動通報吐露港風暴潮，你是皇家天文台的驕傲！」',
      directorBadZh: '顏士爾台長望著窗外折斷的古樹嘆息：「『溫黛』是百年一遇的浩劫，任何一絲預警遲疑，在 140 節陣風與五米風暴潮面前都會化為血淋淋的代價。」'
    }
  }
];

export const CAMPAIGN_ENDINGS = {
  ending_best: {
    id: 'ending_best',
    badgeZh: '特等嘉許 · 皇家天文台首席預報主任',
    titleZh: '砥柱中流 · 風雨守夜人',
    art: 'assets/endings/ending_best.webp',
    summaryZh:
      '一九六二年整個颱風季，從「凱蒂」北折、「諾拉」急轉、「柏絲」夜掠四象限，直到九月一日世紀颱風「溫黛」創下 953.2 毫巴最低氣壓紀錄，你在尖沙咀彌敦道天文台山的油燈下未曾犯下任何致命失誤。你既沒有因恐懼而濫掛風球癱瘓香港生計，更在溫黛襲港前夕力排眾議拉響十號颶風與吐露港風暴潮警報，挽救了無數水上人與木屋區街坊的性命。港督柏立基爵士親臨天文台頒授嘉許狀，顏士爾台長正式委任你為首席預報主任。'
  },
  ending_trusted: {
    id: 'ending_trusted',
    badgeZh: '恪盡職守 · 留任預報主任',
    titleZh: '謹守崗位 · 維港定風針',
    art: 'assets/endings/ending_trusted.webp',
    summaryZh:
      '走過一九六二年驚心動魄的風季，你在真假難辨的船舶電報與高空槽線之間守住了皇家天文台的招牌。雖然偶有個別更次的訊號升降略顯保守或引來商界微言，但在「溫黛」正面襲港的生死關頭，你果斷升起十號颶風十字架訊號，護住了香江百姓。每當暴雨拍打唐樓鐵窗，收音機裡傳來「天文台發出熱帶氣旋警告」，全港六百萬市民依然對你深信不疑。'
  },
  ending_transferred: {
    id: 'ending_transferred',
    badgeZh: '功過參半 · 調任外島測候站',
    titleZh: '調任橫瀾 · 聽濤思過',
    art: 'assets/endings/ending_transferred.webp',
    summaryZh:
      '一九六二年的四場風暴暴露了你在預報決策上的搖擺：有時因忌憚商會投訴而遲掛風球，令避風塘漁船與低窪居民受驚；有時又因過度緊張而誤掛烈風訊號，令全港渡輪與工廠白白停擺。風季結束後，顏士爾台長將你平調往橫瀾島燈塔與啟德機場氣候組整理實測檔案。每當海風吹過燈塔，你總會想起彌敦道山頭那座訊號架上的千鈞重擔。'
  },
  ending_dismissed: {
    id: 'ending_dismissed',
    badgeZh: '嚴重失職 · 引咎辭職',
    titleZh: '風雨遺恨 · 黯然下山',
    art: 'assets/endings/ending_dismissed.webp',
    summaryZh:
      '在瞬息萬變的南海颱風面前，你的訊號調度屢屢失準——面對逼近的狂風漏掛警告導致船隻沉沒、木屋塌頂，或因接連誤報而令公眾與台長對你徹底失去信任。調查委員會在「溫黛」風災聽證會後裁定預報室嚴重失職，你收拾起平行尺與繪圖鉛筆，在秋雨中獨自走下尖沙咀天文台山。'
  }
};
