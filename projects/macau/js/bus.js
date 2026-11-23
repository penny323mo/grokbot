/**
 * Bus plans from the vendored DSAT website snapshot.
 * That snapshot is a download, not a live arrival board.
 * Stop choice may use straight-line metres internally; those metres are not a walk time.
 * No bus road geometry is drawn: the snapshot has stops, not a verified path.
 */

import { fetchLiveBus, findBusJourneys } from '../../dim-heoi/js/transit.js';
import { classifySnapshot } from './sources.js';

const SNAPSHOT_URLS = {
  routes: '../dim-heoi/data/routes.json',
  stops: '../dim-heoi/data/stops.json',
  meta: '../dim-heoi/data/meta.json'
};

export async function loadSnapshot(fetchFn = fetch) {
  const read = async (url) => {
    const res = await fetchFn(url);
    if (!res?.ok) throw new Error(url);
    return res.json();
  };
  const [routes, stops, meta] = await Promise.all([
    read(SNAPSHOT_URLS.routes),
    read(SNAPSHOT_URLS.stops),
    read(SNAPSHOT_URLS.meta)
  ]);
  return { routes, stops, meta };
}

export function failedBus(message = '巴士路線資料而家讀唔到') {
  return {
    ok: false,
    status: 'failed',
    options: [],
    pathStatus: 'unavailable',
    pathNote: '未有可核對嘅巴士行車路徑。',
    message,
    provenance: {
      official: false,
      kind: 'snapshot',
      observedAt: null,
      retrievedAt: null,
      freshness: 'unknown'
    }
  };
}

function viewOption(journey) {
  const base = {
    type: journey.type,
    inVehicleMinutes: null,
    accessWalkMinutes: null,
    displayStraightLineAsWalk: false,
    geometry: null,
    hasMetro: !!journey.hasMetro,
    metroNote: journey.hasMetro ? '站位資料標示可轉輕軌，冇輕軌時間。' : ''
  };
  if (journey.type === 'transfer') {
    return {
      ...base,
      routeName: `${journey.leg1.routeName} 轉 ${journey.leg2.routeName}`,
      boardName: journey.leg1.boardingStop.name,
      alightName: journey.leg2.alightingStop.name,
      transferName: journey.leg1.transferStop.name,
      board: journey.leg1.boardingStop,
      alight: journey.leg2.alightingStop,
      summary: `先搭 ${journey.leg1.routeName}，由「${journey.leg1.boardingStop.name}」到「${journey.leg1.transferStop.name}」，再轉 ${journey.leg2.routeName} 到「${journey.leg2.alightingStop.name}」。轉車要幾耐，資料冇寫，唔估。`
    };
  }
  const names = (journey.stops || []).map((s) => s.name).filter(Boolean);
  return {
    ...base,
    routeName: journey.routeName,
    dir: journey.dir,
    company: journey.company || '',
    originTerminal: journey.originTerminal,
    destTerminal: journey.destTerminal,
    boardName: journey.boardingStop.name,
    alightName: journey.alightingStop.name,
    board: journey.boardingStop,
    alight: journey.alightingStop,
    stopCount: journey.stopCount,
    via: names,
    summary: `路線 ${journey.routeName}，上「${journey.boardingStop.name}」，落「${journey.alightingStop.name}」，中間過 ${journey.stopCount} 個站。行車要幾耐，資料冇寫，唔估。`
  };
}

export function presentBus(journeys, meta, now = Date.now()) {
  const retrievedAt = meta?.fetchedAt || null;
  const provenance = {
    official: false,
    kind: 'snapshot',
    observedAt: null,
    retrievedAt,
    calculatedAt: now,
    freshness: classifySnapshot(retrievedAt, now),
    sourceName: '交通事務局公開巴士查詢（下載）',
    sourceUrl: 'https://bis.dsat.gov.mo/macauweb/',
    coverage: '網站 JSON 下載嘅路線站序同站位座標，唔包括行車路徑幾何，亦唔係到站時間',
    cadence: '呢份檔係 2026-11-16 下載。瀏覽器直連網站多數被跨域擋住，今次環境探查仲返回 403。'
  };
  if (!journeys || journeys.length === 0) {
    return {
      ok: true,
      status: 'none',
      options: [],
      pathStatus: 'unavailable',
      pathNote: '呢兩個點附近，下載嘅路線對唔上直達或者一次轉車。',
      message: '下載嘅巴士路線對唔上',
      provenance
    };
  }
  return {
    ok: true,
    status: 'snapshot',
    options: journeys.map(viewOption),
    pathStatus: 'unavailable',
    pathNote: '未有可核對嘅巴士行車路徑，地圖只標上落站，唔畫假線。',
    accessNote: '上落站用直線距離嚟揀近邊個站，畫面唔顯示呢段距離，因為佢唔係行路時間。',
    message: '',
    provenance
  };
}

export async function planBus(origin, destination, options = {}) {
  try {
    const data = await loadSnapshot(options.fetchFn);
    const journeys = findBusJourneys(origin, destination, data, 3);
    return presentBus(journeys, data.meta, options.now || Date.now());
  } catch {
    return failedBus();
  }
}

export function presentLive(result, retrievedAt = Date.now()) {
  if (!result || result.ok !== true) {
    return {
      status: 'unavailable',
      etaMinutes: null,
      official: false,
      observedAt: null,
      retrievedAt,
      buses: [],
      message: '即時巴士位置讀唔到。呢個網址係交通事務局網站上嘅 JSON，唔係文件化開放數據；瀏覽器多數被跨域擋住。唔會當成官方空到站。'
    };
  }
  const payload = result.data?.data || result.data || {};
  if (payload.header && payload.header !== '000' && result.data?.header && result.data.header !== '000') {
    return {
      status: 'unavailable',
      etaMinutes: null,
      official: false,
      observedAt: null,
      retrievedAt,
      buses: [],
      message: '即時巴士位置讀唔到。'
    };
  }
  const header = result.data?.header || payload.header;
  if (header && header !== '000') {
    return {
      status: 'unavailable',
      etaMinutes: null,
      official: false,
      observedAt: null,
      retrievedAt,
      buses: [],
      message: '即時巴士位置呢次回應冇可用資料，唔當係準時開出。'
    };
  }
  const routeInfo = payload.routeInfo || [];
  const buses = [];
  for (const stop of routeInfo) {
    for (const bus of stop.busInfo || []) {
      buses.push({ stopCode: stop.staCode || '', plate: bus.busPlate || '' });
    }
  }
  if (buses.length === 0) {
    return {
      status: 'no_position',
      etaMinutes: null,
      official: false,
      observedAt: null,
      retrievedAt,
      buses: [],
      message: '呢次回應冇車喺站上。呢個唔係到站時間，亦可能只係呢一刻冇座標。'
    };
  }
  return {
    status: 'positions',
    etaMinutes: null,
    official: false,
    observedAt: null,
    retrievedAt,
    buses,
    message: `讀到 ${buses.length} 架車喺站上（例如站號 ${buses[0].stopCode}）。呢個係位置，唔係幾多分鐘到。回應冇觀測時間。`
  };
}

export function presentWalkLeg(plan, label) {
  const route = plan?.ok ? plan.options?.[0] : null;
  if (!route || route.durationMinutes == null) {
    return {
      status: 'unavailable',
      minutes: null,
      metres: null,
      text: `${label}嘅行人時間暫時計唔到`
    };
  }
  return {
    status: 'routed',
    minutes: route.durationMinutes,
    metres: route.distanceMeters,
    text: `${label}行人路徑約 ${route.durationMinutes} 分鐘`
  };
}

export async function routeBusAccess(origin, destination, option, walkFn) {
  if (!option?.board?.lat || !option?.alight?.lat || typeof walkFn !== 'function') {
    return {
      toBoard: presentWalkLeg(null, '去上車站'),
      fromAlight: presentWalkLeg(null, '落車之後')
    };
  }
  const [toBoard, fromAlight] = await Promise.all([
    walkFn(origin, { lat: option.board.lat, lon: option.board.lon }),
    walkFn({ lat: option.alight.lat, lon: option.alight.lon }, destination)
  ]);
  return {
    toBoard: presentWalkLeg(toBoard, '去上車站'),
    fromAlight: presentWalkLeg(fromAlight, '落車之後')
  };
}

export async function planLive(routeName, dir, fetchFn = fetch) {
  const result = await fetchLiveBus(routeName, dir, fetchFn);
  return presentLive(result, Date.now());
}
