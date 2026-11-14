/**
 * 雨勢 · Jyu Sai — SMG (Macau Meteorological and Geophysical Bureau) Official Observation Service
 */

export const SMG_ACTUAL_WEATHER_URL = 'https://xml.smg.gov.mo/c_actualweather.xml';

/**
 * Parse SMG actual weather XML string.
 * Supports running in Node (regex-based / DOMParser-friendly) and Browser.
 */
export function parseSMGXml(xmlString) {
  if (!xmlString || typeof xmlString !== 'string') {
    return {
      available: false,
      reason: 'empty_payload',
      message: '澳門地球物理氣象局官方雨量未能喺瀏覽器讀取（來源無開放跨域）',
      stations: {}
    };
  }

  // Extract SysPubdate
  const pubDateMatch = xmlString.match(/<SysPubdate>([^<]+)<\/SysPubdate>/);
  const sysPubdate = pubDateMatch ? pubDateMatch[1].trim() : null;

  // Station code mapping: FM -> 澳門, TG -> 氹仔, DC -> 路環
  const stationCodes = ['FM', 'TG', 'DC'];
  const stations = {};

  for (const code of stationCodes) {
    // Look for <station code="FM"> ... </station>
    const stationRegex = new RegExp(`<station[^>]*code=["\']${code}["\'][^>]*>([\\s\\S]*?)<\\/station>`, 'i');
    const stationMatch = xmlString.match(stationRegex);
    if (!stationMatch) continue;

    const block = stationMatch[1];

    const nameMatch = block.match(/<stationname>([^<]+)<\/stationname>/);
    const stationName = nameMatch ? nameMatch[1].trim() : code;

    // Parse Rainfall entries: Type 3 = instantaneous, Type 4 = past hour, Type 5 = today accumulation
    let instant = null;
    let pastHour = null;
    let todayAcc = null;

    // Match all <Rainfall>...</Rainfall> tags
    const rainMatches = block.matchAll(/<Rainfall>([\s\S]*?)<\/Rainfall>/gi);
    for (const rm of rainMatches) {
      const rBlock = rm[1];
      const typeMatch = rBlock.match(/<Type>(\d+)<\/Type>/);
      const valMatch = rBlock.match(/<Value>([0-9.]+)<\/Value>/);
      if (typeMatch && valMatch) {
        const type = parseInt(typeMatch[1], 10);
        const val = parseFloat(valMatch[1]);
        if (type === 3) instant = val;
        if (type === 4) pastHour = val;
        if (type === 5) todayAcc = val;
      }
    }

    stations[code] = {
      code,
      name: stationName,
      instantaneous: instant != null ? instant : 0.0,
      pastHour: pastHour != null ? pastHour : 0.0,
      todayAccumulation: todayAcc != null ? todayAcc : 0.0
    };
  }

  const hasData = Object.keys(stations).length > 0;
  return {
    available: hasData,
    sysPubdate,
    stations,
    sourceName: '澳門地球物理氣象局官方觀測',
    sourceUrl: 'https://www.smg.gov.mo/'
  };
}

/**
 * Fetch SMG XML with timeout and honest CORS fallback.
 */
export async function fetchSMGData(timeoutMs = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(SMG_ACTUAL_WEATHER_URL, {
      signal: controller.signal,
      mode: 'cors'
    });
    clearTimeout(timer);
    if (!res.ok) {
      return {
        available: false,
        reason: `http_${res.status}`,
        message: '澳門地球物理氣象局官方雨量未能喺瀏覽器讀取（來源無開放跨域）',
        link: 'https://www.smg.gov.mo/'
      };
    }
    const text = await res.text();
    return parseSMGXml(text);
  } catch (err) {
    clearTimeout(timer);
    // Almost certainly CORS blocked in browser, report honestly
    return {
      available: false,
      reason: 'cors_blocked',
      message: '澳門地球物理氣象局官方雨量未能喺瀏覽器讀取（來源無開放跨域）',
      link: 'https://www.smg.gov.mo/'
    };
  }
}
