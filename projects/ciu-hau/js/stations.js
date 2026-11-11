/**
 * stations.js · 潮候 Ciu Hau
 * Shipped stations for Macau model points & Hong Kong official tide stations.
 */

export const DATUM = Object.freeze({
  CHART_DATUM: 'CD',
  MEAN_SEA_LEVEL: 'MSL'
});

export const DATUM_INFO = Object.freeze({
  [DATUM.CHART_DATUM]: {
    code: 'CD',
    nameZh: '海圖基準面',
    fullName: '海圖基準面以上（Chart Datum）',
    shortNote: '香港天文台官方潮汐預報以海圖基準面為基準。',
    official: true
  },
  [DATUM.MEAN_SEA_LEVEL]: {
    code: 'MSL',
    nameZh: '平均海平面',
    fullName: '平均海平面以上（MSL）',
    shortNote: 'Open-Meteo 數值模式預測，非官方潮汐表。',
    official: false
  }
});

export const STATIONS = [
  // --- Macau Model Points (Open-Meteo Marine API, sea level above MSL) ---
  {
    id: 'macau-inner-harbour',
    name: '澳門內港',
    nameEn: 'Porto Interior',
    territory: 'macau',
    territoryName: '澳門',
    lat: 22.1937,
    lon: 113.5310,
    type: 'model',
    datum: DATUM.MEAN_SEA_LEVEL,
    datumLabel: '平均海平面（MSL）',
    source: 'Open-Meteo',
    sourceLicence: 'CC-BY 4.0',
    sourceUrl: 'https://open-meteo.com/',
    officialUrl: 'https://www.marine.gov.mo/tide_search.aspx',
    officialAuthority: '海事及水務局 · 氣象局',
    isDefault: true,
    description: '澳門半島西側內港水道，歷史貨運與客運港區'
  },
  {
    id: 'macau-a-ma',
    name: '媽閣',
    nameEn: 'Barra',
    territory: 'macau',
    territoryName: '澳門',
    lat: 22.1848,
    lon: 113.5316,
    type: 'model',
    datum: DATUM.MEAN_SEA_LEVEL,
    datumLabel: '平均海平面（MSL）',
    source: 'Open-Meteo',
    sourceLicence: 'CC-BY 4.0',
    sourceUrl: 'https://open-meteo.com/',
    officialUrl: 'https://www.smg.gov.mo/zh/subpage/73/tide',
    officialAuthority: '地球物理氣象局',
    isDefault: false,
    description: '澳門半島南端媽閣水閘與十字門水道'
  },
  {
    id: 'macau-hac-sa',
    name: '黑沙',
    nameEn: 'Hac Sa',
    territory: 'macau',
    territoryName: '澳門',
    lat: 22.1190,
    lon: 113.5690,
    type: 'model',
    datum: DATUM.MEAN_SEA_LEVEL,
    datumLabel: '平均海平面（MSL）',
    source: 'Open-Meteo',
    sourceLicence: 'CC-BY 4.0',
    sourceUrl: 'https://open-meteo.com/',
    officialUrl: 'https://www.marine.gov.mo/tide_search.aspx',
    officialAuthority: '海事及水務局',
    isDefault: false,
    description: '路環東南黑沙海灘水域，外海南向海浪'
  },
  {
    id: 'macau-cheoc-van',
    name: '竹灣',
    nameEn: 'Cheoc Van',
    territory: 'macau',
    territoryName: '澳門',
    lat: 22.1210,
    lon: 113.5510,
    type: 'model',
    datum: DATUM.MEAN_SEA_LEVEL,
    datumLabel: '平均海平面（MSL）',
    source: 'Open-Meteo',
    sourceLicence: 'CC-BY 4.0',
    sourceUrl: 'https://open-meteo.com/',
    officialUrl: 'https://www.marine.gov.mo/tide_search.aspx',
    officialAuthority: '海事及水務局',
    isDefault: false,
    description: '路環南側海灣，地形屏障與潮汐'
  },
  {
    id: 'macau-outer-harbour',
    name: '外港碼頭',
    nameEn: 'Terminal Marítimo do Porto Exterior',
    territory: 'macau',
    territoryName: '澳門',
    lat: 22.1986,
    lon: 113.5588,
    type: 'model',
    datum: DATUM.MEAN_SEA_LEVEL,
    datumLabel: '平均海平面（MSL）',
    source: 'Open-Meteo',
    sourceLicence: 'CC-BY 4.0',
    sourceUrl: 'https://open-meteo.com/',
    officialUrl: 'https://www.smg.gov.mo/zh/subpage/73/tide',
    officialAuthority: '地球物理氣象局',
    isDefault: false,
    description: '澳門外港航道與客運碼頭水域'
  },

  // --- Hong Kong Official Astronomical Tide Stations (HKO Open Data API, height above Chart Datum) ---
  {
    id: 'hk-tao',
    code: 'TAO',
    name: '大澳',
    nameEn: 'Tai O',
    territory: 'hongkong',
    territoryName: '香港',
    lat: 22.2547,
    lon: 113.8635,
    type: 'official',
    datum: DATUM.CHART_DATUM,
    datumLabel: '海圖基準面（CD）',
    source: '香港天文台',
    sourceLicence: 'HKSARG Open Data Licence',
    sourceUrl: 'https://data.weather.gov.hk/weatherAPI/opendata/opendata.php',
    officialUrl: 'https://www.hko.gov.hk/tc/tide/ttext.htm',
    officialAuthority: '香港天文台',
    isDefault: false,
    description: '大嶼山西端棚屋水鄉，鄰近珠江口水域'
  },
  {
    id: 'hk-spw',
    code: 'SPW',
    name: '石壁',
    nameEn: 'Shek Pik',
    territory: 'hongkong',
    territoryName: '香港',
    lat: 22.2197,
    lon: 113.8947,
    type: 'official',
    datum: DATUM.CHART_DATUM,
    datumLabel: '海圖基準面（CD）',
    source: '香港天文台',
    sourceLicence: 'HKSARG Open Data Licence',
    sourceUrl: 'https://data.weather.gov.hk/weatherAPI/opendata/opendata.php',
    officialUrl: 'https://www.hko.gov.hk/tc/tide/ttext.htm',
    officialAuthority: '香港天文台',
    isDefault: false,
    description: '大嶼山南岸石壁水域，南向開闊海面'
  },
  {
    id: 'hk-clk',
    code: 'CLK',
    name: '赤鱲角',
    nameEn: 'Chek Lap Kok',
    territory: 'hongkong',
    territoryName: '香港',
    lat: 22.3040,
    lon: 113.9430,
    type: 'official',
    datum: DATUM.CHART_DATUM,
    datumLabel: '海圖基準面（CD）',
    source: '香港天文台',
    sourceLicence: 'HKSARG Open Data Licence',
    sourceUrl: 'https://data.weather.gov.hk/weatherAPI/opendata/opendata.php',
    officialUrl: 'https://www.hko.gov.hk/tc/tide/ttext.htm',
    officialAuthority: '香港天文台',
    isDefault: false,
    description: '香港國際機場北側航道水域'
  },
  {
    id: 'hk-cch',
    code: 'CCH',
    name: '長洲',
    nameEn: 'Cheung Chau',
    territory: 'hongkong',
    territoryName: '香港',
    lat: 22.2080,
    lon: 114.0280,
    type: 'official',
    datum: DATUM.CHART_DATUM,
    datumLabel: '海圖基準面（CD）',
    source: '香港天文台',
    sourceLicence: 'HKSARG Open Data Licence',
    sourceUrl: 'https://data.weather.gov.hk/weatherAPI/opendata/opendata.php',
    officialUrl: 'https://www.hko.gov.hk/tc/tide/ttext.htm',
    officialAuthority: '香港天文台',
    isDefault: false,
    description: '長洲西灣與避風塘水域，港島與大嶼山之間'
  },
  {
    id: 'hk-qub',
    code: 'QUB',
    name: '鰂魚涌',
    nameEn: 'Quarry Bay',
    territory: 'hongkong',
    territoryName: '香港',
    lat: 22.2910,
    lon: 114.2130,
    type: 'official',
    datum: DATUM.CHART_DATUM,
    datumLabel: '海圖基準面（CD）',
    source: '香港天文台',
    sourceLicence: 'HKSARG Open Data Licence',
    sourceUrl: 'https://data.weather.gov.hk/weatherAPI/opendata/opendata.php',
    officialUrl: 'https://www.hko.gov.hk/tc/tide/ttext.htm',
    officialAuthority: '香港天文台',
    isDefault: false,
    description: '維多利亞港東面潮位基準觀測站'
  },
  {
    id: 'hk-wag',
    code: 'WAG',
    name: '橫瀾島',
    nameEn: 'Waglan Island',
    territory: 'hongkong',
    territoryName: '香港',
    lat: 22.1820,
    lon: 114.3030,
    type: 'official',
    datum: DATUM.CHART_DATUM,
    datumLabel: '海圖基準面（CD）',
    source: '香港天文台',
    sourceLicence: 'HKSARG Open Data Licence',
    sourceUrl: 'https://data.weather.gov.hk/weatherAPI/opendata/opendata.php',
    officialUrl: 'https://www.hko.gov.hk/tc/tide/ttext.htm',
    officialAuthority: '香港天文台',
    isDefault: false,
    description: '香港東南最外哨島嶼，開闊南海風浪潮汐'
  }
];

export const DEFAULT_STATION = STATIONS.find(s => s.isDefault) || STATIONS[0];

export function getStationById(id) {
  return STATIONS.find(s => s.id === id || s.code === id) || null;
}

export function getMacauStations() {
  return STATIONS.filter(s => s.territory === 'macau');
}

export function getHongKongStations() {
  return STATIONS.filter(s => s.territory === 'hongkong');
}
