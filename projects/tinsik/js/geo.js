/**
 * geo.js · 天色 Tin Sik
 * Coordinates, distances, Cantonese compass bearings, and Asia/Macau time utilities.
 */

import { PLACES, DEFAULT_PLACE } from './places.js';

const EARTH_RADIUS_KM = 6371.0;

/**
 * Calculates great-circle distance between two points in km using Haversine formula.
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
    return Infinity;
  }
  const toRad = deg => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const rLat1 = toRad(lat1);
  const rLat2 = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Finds the nearest place from the predefined places list.
 * If lat or lon is missing/invalid, returns DEFAULT_PLACE (澳門半島).
 */
export function findNearestPlace(lat, lon, places = PLACES) {
  if (lat == null || lon == null || isNaN(lat) || isNaN(lon)) {
    return DEFAULT_PLACE;
  }
  let closest = DEFAULT_PLACE;
  let minDistance = Infinity;

  for (const place of places) {
    const dist = haversineDistance(lat, lon, place.lat, place.lon);
    if (dist < minDistance) {
      minDistance = dist;
      closest = place;
    }
  }

  return closest;
}

/**
 * 16-point Cantonese compass bearings.
 * Standard Cantonese meteorological terminology (HKO & SMG).
 */
const COMPASS_16_CANTONESE = [
  '北', '東北偏北', '東北', '東北偏東',
  '東', '東南偏東', '東南', '東南偏南',
  '南', '西南偏南', '西南', '西南偏西',
  '西', '西北偏西', '西北', '西北偏北'
];

/**
 * Converts wind direction in degrees (0–360) to a Cantonese compass bearing.
 */
export function degreesToCompassCantonese(deg) {
  if (deg == null || isNaN(deg)) {
    return '';
  }
  // Normalize to [0, 360)
  const normalized = ((deg % 360) + 360) % 360;
  // 360 / 16 = 22.5 deg per segment. Offset by 11.25 for centering around North (348.75 to 11.25 is North)
  const index = Math.floor(((normalized + 11.25) % 360) / 22.5);
  return COMPASS_16_CANTONESE[index] || '北';
}

/**
 * Cantonese weekday names.
 */
const WEEKDAYS_CANTONESE = [
  '星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'
];

/**
 * Parses an ISO date/time string from Open-Meteo or standard format,
 * treating unspecified timezones as Asia/Macau (UTC+8).
 */
export function parseMacauDate(input) {
  if (!input) return null;
  if (input instanceof Date) {
    return input;
  }
  if (typeof input === 'string') {
    // Open-Meteo returns e.g. "2026-11-13T01:45" or "2026-11-13"
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(input)) {
      const timePart = input.split('T')[1] || '';
      if (!/[Z+-]/.test(timePart)) {
        // Unspecified timezone: treat as Asia/Macau (UTC+8)
        return new Date(input + '+08:00');
      }
      return new Date(input);
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
      return new Date(input + 'T00:00:00+08:00');
    }
    return new Date(input);
  }
  return new Date(input);
}

/**
 * Extracts HH:MM in Asia/Macau.
 */
export function formatMacauTimeOnly(input) {
  if (!input) return '';
  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}T(\d{2}:\d{2})/.test(input)) {
    // If it's already an Open-Meteo local time string without Z, grab HH:MM directly
    const match = input.match(/T(\d{2}:\d{2})/);
    if (match && !input.includes('Z')) return match[1];
  }
  const date = parseMacauDate(input);
  if (!date || isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Macau'
  }).format(date);
}

/**
 * Formats date as YYYY-MM-DD in Asia/Macau.
 */
export function getMacauCivilDate(input) {
  if (!input) return '';
  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}/.test(input)) {
    const match = input.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match && !input.includes('Z')) return match[1];
  }
  const date = parseMacauDate(input);
  if (!date || isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Macau'
  }).format(date);
}

/**
 * Formats full timestamp as YYYY-MM-DD HH:MM in Asia/Macau.
 */
export function formatMacauDateTime(input) {
  if (!input) return '';
  const date = parseMacauDate(input);
  if (!date || isNaN(date.getTime())) return '';
  const dateStr = getMacauCivilDate(date);
  const timeStr = formatMacauTimeOnly(date);
  return `${dateStr} ${timeStr}`;
}

/**
 * Gets Cantonese weekday (e.g. 星期一, 星期二).
 */
export function getWeekdayCantonese(input) {
  const date = parseMacauDate(input);
  if (!date || isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('zh-HK', {
    weekday: 'long',
    timeZone: 'Asia/Macau'
  }).format(date);
}
