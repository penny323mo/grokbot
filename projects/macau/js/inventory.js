/**
 * Every Macau module found in this repo, and what 行澳門 does with it.
 * Games stay out. Standalone URLs stay.
 */

export const MODULES = [
  {
    id: 'trip',
    title: '行程',
    from: ['dim-heoi', 'ce-lou', 'cheut-mun'],
    status: 'included',
    note: '行路較平／較短、高度同樓梯，加上下載嘅巴士路線。出門嘅行路同巴士併入呢度，唔再做第二個應用。'
  },
  {
    id: 'nearby',
    title: '就近',
    from: ['jauhgan'],
    status: 'included',
    note: '公廁、飲水、藥房、AED、診所、停車場。用 2026-11-10 嘅 OpenStreetMap 擷取，直線只係排次序。'
  },
  {
    id: 'weather',
    title: '天氣',
    from: ['tinsik'],
    status: 'partial',
    note: 'Open-Meteo 模式可以讀。地球物理氣象局 XML 無 CORS，頁面唔代理。'
  },
  {
    id: 'rain',
    title: '雨勢',
    from: ['jyu-sai'],
    status: 'included',
    note: 'RainViewer 雷達，原生最高縮放 7，地圖放大時用同一級圖磚。唔係氣象局雷達。'
  },
  {
    id: 'tide',
    title: '潮候',
    from: ['ciu-hau'],
    status: 'partial',
    note: '澳門水位用 Open-Meteo 平均海平面模式。官方潮汐無 CORS。唔用潮高判斷去唔去得。'
  },
  {
    id: 'terrain',
    title: '地勢',
    from: ['dei-sai'],
    status: 'included',
    note: '同一張平面地圖標山丘同地標高度。高度來自 OSM 或 DEM，唔係官方測量，亦冇載入立體地圖嘅 supported()。'
  },
  {
    id: 'park',
    title: '泊車',
    from: ['cheut-mun'],
    status: 'included',
    note: '2026-11-18 下載嘅 OSM 停車場，再行人路徑去終點。冇車位數字。冇舖名就叫未命名停車場。'
  }
];

export const LEFT_OUT = [
  {
    id: 'smg-xml',
    status: 'blocked',
    note: '2026-11-18 再探 https://xml.smg.gov.mo/c_actualweather.xml 係 HTTP 200，無 Access-Control-Allow-Origin。唔做公開代理。'
  },
  {
    id: 'dsat-live-bus',
    status: 'blocked',
    note: '交通事務局即時位置瀏覽器被跨域擋住。下載路線仍然用。'
  },
  {
    id: 'dsat-parking-vacancy',
    status: 'blocked',
    note: '官方車位要授權。就近同出門都冇假空位。'
  },
  {
    id: 'hko-live-tide',
    status: 'blocked',
    note: '天文台開放數據呢次回應無 CORS，亦唔係 JSON。舊潮汐快照唔當而家水位。'
  },
  {
    id: 'dei-sai-3d',
    status: 'not-imported',
    note: '地勢原頁用咗一個 MapLibre 4.7 已經冇嘅 WebGL 檢查，呼叫之後會當每部機都畫唔到。立體傾斜冇搬過嚟。'
  },
  {
    id: 'games',
    status: 'excluded',
    note: '霜門守望、季風帆影、濠江疑案等係遊戲或者故事，唔係出行功能，冇併入。'
  }
];

export function moduleById(id) {
  return MODULES.find((item) => item.id === id) || MODULES[0];
}
