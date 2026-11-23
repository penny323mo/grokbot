/**
 * Weather and tide.
 * SMG XML is public and was HTTP 200 on 2026-11-18, but the browser cannot read it.
 * Open-Meteo numbers are model output. Tide height is not a safety judgement.
 */

import { parseHkoHlt } from '../../ciu-hau/js/hko.js';
import { parseOpenMeteoMarine } from '../../ciu-hau/js/openmeteo.js';
import { smgLine } from './rain.js';
import { getWeatherCondition } from '../../tinsik/js/weather-codes.js';

export const SMG_PROBE = {
  checkedAt: '2026-11-18T17:01:01Z',
  checkedAtMacau: '2026-11-19 01:01',
  sampleUrl: 'https://xml.smg.gov.mo/c_actualweather.xml',
  directoryUrl: 'https://xml.smg.gov.mo/',
  http: 200,
  pubdate: '2026-11-19 00:50',
  lastModified: 'Wed, 18 Nov 2026 16:54:09 GMT',
  accessControlAllowOrigin: null
};

export const WARNING_FILES = [
  { id: 'typhoon', name: '熱帶氣旋', href: 'https://xml.smg.gov.mo/c_typhoon.xml' },
  { id: 'rainstorm', name: '暴雨', href: 'https://xml.smg.gov.mo/c_rainstorm.xml' },
  { id: 'thunderstorm', name: '雷暴', href: 'https://xml.smg.gov.mo/c_thunderstorm.xml' },
  { id: 'stormsurge', name: '風暴潮', href: 'https://xml.smg.gov.mo/c_stormsurge.xml' },
  { id: 'tsunami', name: '海嘯', href: 'https://xml.smg.gov.mo/c_tsunami.xml' }
];

export function presentModelWeather(json, retrievedAt = Date.now()) {
  const current = json?.current;
  const temperature = current?.temperature_2m;
  if (!current || typeof temperature !== 'number' || !current.time) {
    return {
      available: false,
      official: false,
      retrievedAt,
      observedAt: null,
      message: '天氣模式暫時讀唔到。'
    };
  }
  const condition = getWeatherCondition(current.weather_code, current.is_day ?? 1);
  return {
    available: true,
    official: false,
    temperature,
    condition: condition.label,
    modelTime: current.time,
    retrievedAt,
    observedAt: null,
    message: `模式話而家大約 ${temperature} 度，${condition.label}。模式時間 ${current.time}。呢個係 Open-Meteo，唔係地球物理氣象局觀測。`
  };
}

export const OFFICIAL_TIDE = {
  status: 'unavailable',
  href: 'https://www.smg.gov.mo/zh/subpage/73/tide',
  linkText: '地球物理氣象局潮汐',
  text: '澳門官方潮汐喺氣象局網頁。2026-11-19 01:01（澳門時間）再探 XML 係 HTTP 200，但無 CORS，呢頁讀唔到，亦唔經代理。'
};

export function presentMarine(json, retrievedAt = Date.now()) {
  const parsed = parseOpenMeteoMarine(json);
  const height = parsed?.current?.height;
  const modelTime = json?.current?.time || null;
  if (typeof height !== 'number' || !modelTime) {
    return {
      available: false,
      official: false,
      datum: 'MSL',
      height: null,
      retrievedAt,
      message: '水位模式暫時讀唔到。'
    };
  }
  return {
    available: true,
    official: false,
    datum: 'MSL',
    datumLabel: '平均海平面',
    height,
    modelTime,
    retrievedAt,
    observedAt: null,
    message: `模式話水位約 ${height} 米，基準係平均海平面，唔係海圖基準面。模式時間 ${modelTime}。潮高唔當路況結論。`
  };
}

export function officialWeatherLine() {
  const line = smgLine();
  return {
    ...line,
    warnings: WARNING_FILES,
    probe: SMG_PROBE
  };
}

export function hkoTideUrl(station, year, month, day, dataType = 'HLT') {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `https://data.weather.gov.hk/weatherAPI/opendata/opendata.php?dataType=${dataType}&rformat=json&station=${station}&year=${year}&month=${m}&day=${d}`;
}

export function presentHkoHighLow(json, meta) {
  const extremes = parseHkoHlt(json, meta.year);
  if (!extremes.length) {
    return {
      available: false,
      official: false,
      message: '香港天文台高低潮暫時讀唔到。'
    };
  }
  const pairs = extremes.map((item) => {
    const hh = String(item.hour).padStart(2, '0');
    const mm = String(item.minute).padStart(2, '0');
    return `${hh}:${mm} ${item.height} 米`;
  });
  return {
    available: true,
    official: true,
    territory: 'hongkong',
    datum: 'CD',
    station: meta.stationName,
    pairs,
    message: `香港天文台${meta.stationName}高低潮（海圖基準面）：${pairs.join('、')}。呢個係香港站，唔係澳門水位，亦唔係而家水位。`
  };
}

export async function loadHkoHighLow(fetchFn = fetch, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Macau',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(now);
  const pick = (type) => Number(parts.find((part) => part.type === type)?.value);
  const year = pick('year');
  const month = pick('month');
  const day = pick('day');
  const meta = { year, month, day, station: 'TAO', stationName: '大澳' };
  try {
    const res = await fetchFn(hkoTideUrl('TAO', year, month, day));
    if (!res?.ok) return presentHkoHighLow(null, meta);
    return presentHkoHighLow(await res.json(), meta);
  } catch {
    return presentHkoHighLow(null, meta);
  }
}

export async function loadModelWeather(lat, lon, fetchFn = fetch) {
  const retrievedAt = Date.now();
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&timezone=Asia%2FMacau`;
  try {
    const res = await fetchFn(url);
    if (!res?.ok) return presentModelWeather(null, retrievedAt);
    return presentModelWeather(await res.json(), retrievedAt);
  } catch {
    return presentModelWeather(null, retrievedAt);
  }
}

export async function loadMarine(lat, lon, fetchFn = fetch) {
  const retrievedAt = Date.now();
  const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&current=sea_level_height_msl&timezone=Asia%2FMacau`;
  try {
    const res = await fetchFn(url);
    if (!res?.ok) return presentMarine(null, retrievedAt);
    return presentMarine(await res.json(), retrievedAt);
  } catch {
    return presentMarine(null, retrievedAt);
  }
}
