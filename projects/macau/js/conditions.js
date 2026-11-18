/**
 * Weather and tide.
 * SMG XML is public and was HTTP 200 on 2026-11-18, but the browser cannot read it.
 * Open-Meteo numbers are model output. Tide height is not a safety judgement.
 */

import { parseOpenMeteoMarine } from '../../ciu-hau/js/openmeteo.js';
import { smgLine } from './rain.js';
import { getWeatherCondition } from '../../tinsik/js/weather-codes.js';

export const SMG_PROBE = {
  checkedAt: '2026-11-18T06:26:00Z',
  sampleUrl: 'https://xml.smg.gov.mo/c_actualweather.xml',
  directoryHttp: 200,
  accessControlAllowOrigin: null
};

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
  text: '澳門官方潮汐喺氣象局網頁。2026-11-18 探過 XML 目錄係 HTTP 200，但無 CORS，呢頁讀唔到，亦唔經代理。'
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
  return smgLine();
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
