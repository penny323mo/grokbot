/**
 * Weather: SMG public XML is reachable server-side but has no CORS.
 * The page does not proxy it and does not show a temperature.
 * Open-Meteo is an optional labelled model hint, never an official observation.
 */

export const SMG = {
  status: 'unavailable',
  reason: 'no_cors',
  directoryUrl: 'https://xml.smg.gov.mo/',
  sampleUrl: 'https://xml.smg.gov.mo/c_actualweather.xml',
  probe: {
    checkedAt: '2026-11-17T01:26:52Z',
    directoryHttp: 200,
    sampleHttp: 200,
    sampleLastModified: 'Tue, 17 Nov 2026 01:24:11 GMT',
    accessControlAllowOrigin: null
  }
};

export function smgLine() {
  return {
    status: 'unavailable',
    text: '地球物理氣象局公開 XML 喺 2026-11-18 再探目錄同實況檔係 HTTP 200，但回應無 CORS，呢頁讀唔到，亦唔經代理，所以唔顯示氣溫。',
    href: SMG.directoryUrl,
    linkText: '地球物理氣象局 XML'
  };
}

export function buildRainUrl(lat, lon) {
  return `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&minutely_15=precipitation&forecast_minutely_15=8&timezone=Asia%2FMacau`;
}

export function parseRain(json) {
  const block = json?.minutely_15;
  if (!block || !Array.isArray(block.time) || !Array.isArray(block.precipitation)) {
    return {
      show: false,
      available: false,
      official: false,
      note: '落雨模式預測暫時讀唔到。'
    };
  }
  const prec = block.precipitation.map(Number);
  const wet = (v) => Number.isFinite(v) && v >= 0.05;
  let message = '';
  if (wet(prec[0])) {
    message = 'Open-Meteo 模式話而家可能有雨。';
  } else {
    const idx = prec.findIndex((v, i) => i > 0 && i < 8 && wet(v));
    if (idx > 0) {
      const stamp = String(block.time[idx] || '');
      const hm = stamp.includes('T') ? stamp.split('T')[1].slice(0, 5) : '';
      message = hm ? `Open-Meteo 模式話大約 ${hm} 可能有雨。` : 'Open-Meteo 模式話未來兩小時可能有雨。';
    }
  }
  return {
    show: message.length > 0,
    available: true,
    official: false,
    message,
    modelTime: block.time[0] || null,
    modelTimeStr: block.time[0] ? String(block.time[0]).replace('T', ' ').slice(0, 16) : '',
    note: message ? '' : ''
  };
}

export async function planRain(origin, fetchFn = fetch, timeoutMs = 6000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchFn(buildRainUrl(origin.lat, origin.lon), { signal: controller.signal });
    clearTimeout(timer);
    if (!res?.ok) return parseRain(null);
    return parseRain(await res.json());
  } catch {
    clearTimeout(timer);
    return parseRain(null);
  }
}
