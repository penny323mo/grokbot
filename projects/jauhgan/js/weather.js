/**
 * weather.js - Open-Meteo weather & air quality parser for slim conditions strip
 * Nightly 2026-11-11 · 就近 (Just Around)
 */

import { formatMacauTimeOnly } from './geo.js';

export const WMO_MAP = Object.freeze({
  0: '天晴',
  1: '大致天晴',
  2: '短暫陽光',
  3: '多雲',
  45: '有霧',
  48: '薄霧',
  51: '微雨',
  53: '毛毛雨',
  55: '細雨',
  56: '凍微雨',
  57: '凍微雨',
  61: '小雨',
  63: '有雨',
  65: '大雨',
  66: '凍雨',
  67: '凍大雨',
  71: '輕微降雪',
  73: '降雪',
  75: '大雪',
  77: '雪粒',
  80: '局部驟雨',
  81: '驟雨',
  82: '狂風驟雨',
  85: '陣雪',
  86: '大陣雪',
  95: '雷雨',
  96: '雷暴夾雜冰雹',
  99: '強烈雷暴夾雜冰雹'
});

/**
 * Returns natural spoken Cantonese sky description for a WMO weather code.
 * Omit phrase if code is unknown or not a number (never guess or default).
 * @param {number} code
 * @returns {string|null}
 */
export function getWmoDescription(code) {
  if (typeof code !== 'number') return null;
  return WMO_MAP[code] || null;
}

/**
 * Assesses rain probability/precipitation in the next 2 hours.
 * Returns null if hourly precipitation array is absent (never guess).
 * @param {object} hourly
 * @returns {string|null}
 */
export function getRainForecast(hourly) {
  if (!hourly || !Array.isArray(hourly.precipitation) || hourly.precipitation.length === 0) {
    return null;
  }

  const precip0 = hourly.precipitation[0] ?? 0;
  const precip1 = hourly.precipitation[1] ?? 0;
  const maxPrecip = Math.max(precip0, precip1);

  const prob0 = Array.isArray(hourly.precipitation_probability) ? (hourly.precipitation_probability[0] ?? 0) : 0;
  const prob1 = Array.isArray(hourly.precipitation_probability) ? (hourly.precipitation_probability[1] ?? 0) : 0;
  const maxProb = Math.max(prob0, prob1);

  if (maxPrecip >= 0.5 || maxProb >= 60) {
    return '未來兩小時有雨，記得帶遮';
  } else if (maxPrecip > 0.05 || maxProb >= 35) {
    return '未來兩小時或有微雨';
  }
  return '未來兩小時無雨';
}

/**
 * Assesses air quality in natural Cantonese.
 * @param {number|null} pm25
 * @param {number|null} aqi
 * @returns {string|null}
 */
export function getAirQualityText(pm25, aqi) {
  if (typeof pm25 !== 'number' && typeof aqi !== 'number') {
    return null;
  }

  if (typeof pm25 === 'number') {
    if (pm25 <= 15) return `PM2.5 ${pm25.toFixed(1)} · 空氣良好`;
    if (pm25 <= 35) return `PM2.5 ${pm25.toFixed(1)} · 空氣普通`;
    if (pm25 <= 55) return `PM2.5 ${pm25.toFixed(1)} · 空氣欠佳`;
    return `PM2.5 ${pm25.toFixed(1)} · 空氣差`;
  }

  if (aqi <= 50) return `AQI ${aqi} · 良好`;
  if (aqi <= 100) return `AQI ${aqi} · 普通`;
  return `AQI ${aqi} · 欠佳`;
}

/**
 * Parses Open-Meteo forecast and optional air quality responses into a slim typographic strip.
 * Strictly adheres to truthfulness: NEVER invents a default temperature, sky or rain phrase!
 * 
 * @param {object} weatherData
 * @param {object} [airData=null]
 * @returns {object|null}
 */
export function parseWeather(weatherData, airData = null) {
  if (!weatherData || typeof weatherData !== 'object') {
    return null;
  }

  const current = weatherData.current;
  if (!current || typeof current !== 'object') {
    return null;
  }

  // Under NO circumstances may a default temperature be invented
  if (typeof current.temperature_2m !== 'number' || !Number.isFinite(current.temperature_2m)) {
    return null;
  }

  const temp = Math.round(current.temperature_2m);
  const skyPhrase = getWmoDescription(current.weather_code);
  const rainPhrase = getRainForecast(weatherData.hourly);

  let aqiPhrase = null;
  if (airData && airData.current) {
    const pm25 = typeof airData.current.pm2_5 === 'number' ? airData.current.pm2_5 : null;
    const aqi = typeof airData.current.us_aqi === 'number' ? airData.current.us_aqi : null;
    aqiPhrase = getAirQualityText(pm25, aqi);
  }

  const parts = [`${temp}°C`];
  if (skyPhrase) parts.push(skyPhrase);
  if (rainPhrase) parts.push(rainPhrase);
  if (aqiPhrase) parts.push(aqiPhrase);

  const line1 = parts.join(' · ');

  // Format update time in Asia/Macau
  let timeStr = '';
  if (current.time) {
    timeStr = formatMacauTimeOnly(current.time);
  }
  const line2 = timeStr ? `${timeStr} 更新 · Open-Meteo` : 'Open-Meteo';

  return {
    temp,
    skyPhrase,
    rainPhrase,
    aqiPhrase,
    line1,
    line2,
    displayText: `${line1}\n${line2}`,
    time: current.time,
    source: 'Open-Meteo'
  };
}
