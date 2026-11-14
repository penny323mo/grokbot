/**
 * 雨勢 · Jyu Sai — Open-Meteo Timing Forecast Service
 */

import { formatMacauTime } from './utils.js';

export function buildOpenMeteoUrl(lat, lon) {
  return `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&minutely_15=precipitation,precipitation_probability&hourly=precipitation,precipitation_probability,weather_code&forecast_minutely_15=8&forecast_days=1&timezone=Asia/Macau`;
}

/**
 * Parse Open-Meteo forecast payload for 15-minute steps.
 */
export function parseOpenMeteoForecast(json) {
  if (!json || typeof json !== 'object' || !json.minutely_15) {
    return {
      available: false,
      reason: 'missing_minutely_15',
      message: '未有未來兩小時模式預測',
      timeline: []
    };
  }

  const times = Array.isArray(json.minutely_15.time) ? json.minutely_15.time : [];
  const precips = Array.isArray(json.minutely_15.precipitation) ? json.minutely_15.precipitation : [];
  const probs = Array.isArray(json.minutely_15.precipitation_probability) ? json.minutely_15.precipitation_probability : [];

  if (times.length === 0) {
    return {
      available: false,
      reason: 'empty_timeline',
      message: '未有未來兩小時模式預測',
      timeline: []
    };
  }

  const timeline = times.map((t, idx) => {
    const p = precips[idx] != null ? Number(precips[idx]) : 0;
    const pr = probs[idx] != null ? Number(probs[idx]) : 0;
    return {
      time: t,
      timeStr: formatMacauTime(t, 'time'),
      precip: p,
      prob: pr
    };
  });

  // Precipitation threshold: 0.1 mm/15min to be considered raining
  const RAIN_THRESHOLD = 0.05;

  const isRainingNow = timeline[0].precip >= RAIN_THRESHOLD;
  const allZero = timeline.every(step => step.precip < RAIN_THRESHOLD);

  let willRainSoon = false;
  let rainStartTime = null;
  let rainStopTime = null;

  if (!isRainingNow) {
    for (let i = 1; i < timeline.length; i++) {
      if (timeline[i].precip >= RAIN_THRESHOLD) {
        willRainSoon = true;
        rainStartTime = timeline[i].time;
        break;
      }
    }
  } else {
    for (let i = 1; i < timeline.length; i++) {
      if (timeline[i].precip < RAIN_THRESHOLD) {
        rainStopTime = timeline[i].time;
        break;
      }
    }
  }

  return {
    available: true,
    latitude: json.latitude,
    longitude: json.longitude,
    isRainingNow,
    willRainSoon,
    allZero,
    rainStartTime,
    rainStopTime,
    timeline,
    firstStepTime: timeline[0].time
  };
}

/**
 * Fetch Open-Meteo forecast with timeout.
 */
export async function fetchOpenMeteoForecast(lat, lon, timeoutMs = 8000) {
  const url = buildOpenMeteoUrl(lat, lon);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timer);
    if (!res.ok) {
      return { available: false, reason: `http_${res.status}`, message: '未有未來兩小時模式預測' };
    }
    const json = await res.json();
    return parseOpenMeteoForecast(json);
  } catch (err) {
    clearTimeout(timer);
    return {
      available: false,
      reason: err.name === 'AbortError' ? 'timeout' : 'network_error',
      message: '未有未來兩小時模式預測'
    };
  }
}
