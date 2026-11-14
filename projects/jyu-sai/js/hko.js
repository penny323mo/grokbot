/**
 * 雨勢 · Jyu Sai — HKO (Hong Kong Observatory) Supporting Rainfall Service
 */

export const HKO_RHRREAD_URL = 'https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=tc';

/**
 * Parse HKO rainfall data from rhrread payload.
 * Focuses on western stations nearest to Macau (e.g. 離島區 / 屯門).
 */
export function parseHKORainfall(json) {
  if (!json || typeof json !== 'object' || !json.rainfall || !Array.isArray(json.rainfall.data)) {
    return {
      available: false,
      reason: 'missing_rainfall',
      message: '香港天文台雨量資料未能讀取'
    };
  }

  const list = json.rainfall.data;
  // Look for Islands District (Lantau) or Tuen Mun
  const islands = list.find(item => item.place === '離島區');
  const tuenMun = list.find(item => item.place === '屯門');

  const selected = islands || tuenMun || list[0];

  return {
    available: true,
    place: selected ? selected.place : '香港站',
    maxMm: selected ? selected.max : 0,
    unit: selected ? selected.unit : 'mm',
    startTime: json.rainfall.startTime,
    endTime: json.rainfall.endTime,
    sourceName: '香港天文台官方雨量（香港站，非澳門觀測）',
    sourceUrl: 'https://www.hko.gov.hk/'
  };
}

/**
 * Fetch HKO rainfall data with timeout.
 */
export async function fetchHKOData(timeoutMs = 6000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(HKO_RHRREAD_URL, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timer);
    if (!res.ok) {
      return { available: false, reason: `http_${res.status}` };
    }
    const json = await res.json();
    return parseHKORainfall(json);
  } catch (err) {
    clearTimeout(timer);
    return { available: false, reason: 'network_error' };
  }
}
