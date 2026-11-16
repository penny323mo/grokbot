/**
 * 點去 · Dim Heoi — Rain Hint Service (Open-Meteo)
 * Used strictly for a single rain hint chip/sentence on the trip comparison.
 * Never a general weather briefing, temperature, or AQI.
 */

import { formatMacauTime } from './utils.js';

export function buildOpenMeteoRainUrl(lat = 22.1987, lon = 113.5439) {
  return `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&minutely_15=precipitation,precipitation_probability&forecast_minutely_15=8&forecast_days=1&timezone=Asia%2FMacau`;
}

/**
 * Parse Open-Meteo 15-minute precipitation steps
 */
export function parseRainHint(json) {
  if (!json || !json.minutely_15 || !Array.isArray(json.minutely_15.time)) {
    return {
      available: false,
      hasRain: false,
      hasRainHint: false,
      isRaining: false,
      isRainingNow: false,
      message: '',
      hintText: null
    };
  }

  const times = json.minutely_15.time;
  const precips = json.minutely_15.precipitation || [];
  const probs = json.minutely_15.precipitation_probability || [];

  if (times.length === 0) {
    return {
      available: false,
      hasRain: false,
      hasRainHint: false,
      isRaining: false,
      isRainingNow: false,
      message: '',
      hintText: null
    };
  }

  const RAIN_THRESHOLD = 0.05; // mm / 15min
  const isRainingNow = (precips[0] != null && Number(precips[0]) >= RAIN_THRESHOLD);

  let willRainSoon = false;
  let rainStartTime = null;

  // Check only within the next 2 hours (8 x 15-min intervals)
  const maxLookahead = Math.min(precips.length, 8);
  if (!isRainingNow) {
    for (let i = 1; i < maxLookahead; i++) {
      if (precips[i] != null && Number(precips[i]) >= RAIN_THRESHOLD) {
        willRainSoon = true;
        rainStartTime = times[i];
        break;
      }
    }
  }

  const firstTime = times[0];
  const firstTimeStr = formatMacauTime(firstTime, 'time');

  let hintText = null;
  let adviceText = null;

  if (isRainingNow) {
    hintText = "而家落緊雨，行路會濕";
    adviceText = "建議優先考慮搭巴士。";
  } else if (willRainSoon && rainStartTime) {
    const startStr = formatMacauTime(rainStartTime, 'time');
    hintText = `大約 ${startStr} 可能開始有雨`;
    adviceText = "步行請備雨具，或考慮乘搭巴士。";
  } else {
    // Dry for next 2 hours: remain quiet / silent per SPEC
    hintText = null;
    adviceText = null;
  }

  const hasRain = hintText !== null;

  return {
    available: true,
    hasRain,
    hasRainHint: hasRain,
    isRaining: isRainingNow,
    isRainingNow,
    willRainSoon,
    rainStartTime,
    message: hintText || '',
    hintText,
    adviceText,
    modelTime: firstTime,
    modelTimeStr: firstTimeStr,
    sourceName: "Open-Meteo 模式預測（非官方觀測）",
    sourceUrl: "https://open-meteo.com"
  };
}

/**
 * Fetch rain hint for coordinates
 */
export async function fetchRainHint(lat = 22.1987, lon = 113.5439, timeoutMs = 6000) {
  const url = buildOpenMeteoRainUrl(lat, lon);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timer);
    if (!res.ok) {
      return { available: false, hasRain: false, hasRainHint: false, message: '', hintText: null };
    }
    const json = await res.json();
    return parseRainHint(json);
  } catch (err) {
    clearTimeout(timer);
    return { available: false, hasRain: false, hasRainHint: false, message: '', hintText: null };
  }
}
