/**
 * geo.js · 潮候 Ciu Hau
 * Geographic calculations, nearest station selection, compass directions, and time formatting.
 */

import { STATIONS, DEFAULT_STATION } from './stations.js';

const EARTH_RADIUS_KM = 6371.0;

/**
 * Calculates Haversine distance between two coordinates in kilometers.
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const rLat1 = (lat1 * Math.PI) / 180;
  const rLat2 = (lat2 * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

/**
 * Determines whether coordinates fall within Macau territory/waters.
 */
export function isMacau(lat, lon) {
  return lat >= 22.08 && lat <= 22.25 && lon >= 113.48 && lon <= 113.62;
}

/**
 * Determines whether coordinates fall within Hong Kong territory/waters.
 */
export function isHongKong(lat, lon) {
  return lat >= 22.15 && lat <= 22.58 && lon >= 113.80 && lon <= 114.45;
}

/**
 * Finds the nearest station to the given coordinates.
 * If clearly in Hong Kong, prioritizes official HKO stations.
 * If clearly in Macau, prioritizes Macau model points.
 */
export function findNearestStation(lat, lon) {
  if (typeof lat !== 'number' || typeof lon !== 'number' || isNaN(lat) || isNaN(lon)) {
    return DEFAULT_STATION;
  }

  const inHk = isHongKong(lat, lon);
  const inMo = isMacau(lat, lon);

  // Filter candidate pool if within known territory
  let candidates = STATIONS;
  if (inHk) {
    candidates = STATIONS.filter(s => s.territory === 'hongkong');
  } else if (inMo) {
    candidates = STATIONS.filter(s => s.territory === 'macau');
  }

  let bestStation = candidates[0] || DEFAULT_STATION;
  let minDistance = Infinity;

  for (const station of candidates) {
    const dist = haversineDistance(lat, lon, station.lat, station.lon);
    if (dist < minDistance) {
      minDistance = dist;
      bestStation = station;
    }
  }

  return {
    station: bestStation,
    distanceKm: Number(minDistance.toFixed(2))
  };
}

/**
 * Converts wind or wave direction degrees (0–360) into Cantonese compass points.
 */
export function degreesToCompassCantonese(degrees) {
  if (typeof degrees !== 'number' || isNaN(degrees)) {
    return '';
  }

  const deg = (degrees % 360 + 360) % 360;
  // 16-point Cantonese compass
  const compassPoints = [
    '北', '北北東', '東北', '東北東',
    '東', '東南東', '東南', '南南東',
    '南', '南南西', '西南', '西南西',
    '西', '西北西', '西北', '北北西'
  ];

  const index = Math.round(deg / 22.5) % 16;
  return compassPoints[index];
}

/**
 * Formats a Date object or timestamp string into Asia/Macau time (HH:MM).
 */
export function formatMacauTimeOnly(dateInput) {
  if (!dateInput) return '';
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('zh-HK', {
    timeZone: 'Asia/Macau',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
}

/**
 * Formats a Date object or timestamp string into Asia/Macau date and time.
 * e.g. "2026-11-12 01:30"
 */
export function formatMacauDateTime(dateInput) {
  if (!dateInput) return '';
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Macau',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(date);

  const get = (type) => parts.find(p => p.type === type)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}`;
}

/**
 * Returns civil year, month, day, hour, minute, second for a Date or timestamp in Asia/Macau (UTC+8).
 * @param {Date|number|string} [dateInput]
 * @returns {{ year: number, month: number, day: number, hour: number, minute: number, second: number, dateStr: string }}
 */
export function getMacauCivilDate(dateInput) {
  const date = dateInput ? (dateInput instanceof Date ? dateInput : new Date(dateInput)) : new Date();
  if (isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Macau',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(date);

  const get = (type) => parts.find(p => p.type === type)?.value || '0';
  const year = parseInt(get('year'), 10);
  const month = parseInt(get('month'), 10);
  const day = parseInt(get('day'), 10);
  const hour = parseInt(get('hour'), 10);
  const minute = parseInt(get('minute'), 10);
  const second = parseInt(get('second'), 10);
  const dateStr = `${get('year')}-${get('month')}-${get('day')}`;

  return { year, month, day, hour, minute, second, dateStr };
}

/**
 * Adds integer days to an Asia/Macau civil date, safely rolling over month and year boundaries.
 * @param {{ year: number, month: number, day: number }} civilDate
 * @param {number} [daysToAdd=1]
 * @returns {{ year: number, month: number, day: number, hour: number, minute: number, second: number, dateStr: string }}
 */
export function getMacauCivilDateAddDays(civilDate, daysToAdd = 1) {
  if (!civilDate) return null;
  // Construct UTC timestamp representing noon (04:00 UTC = 12:00 Asia/Macau)
  const d = new Date(Date.UTC(civilDate.year, civilDate.month - 1, civilDate.day + daysToAdd, 4, 0, 0));
  return getMacauCivilDate(d);
}

/**
 * Returns the epoch timestamp (ms) for Asia/Macau local midnight (00:00:00.000) of a given date.
 * Asia/Macau is strictly UTC+8.
 * @param {Date|number|string} [dateInput]
 * @returns {number} Epoch timestamp in milliseconds.
 */
export function getMacauMidnightTimestamp(dateInput) {
  const civil = getMacauCivilDate(dateInput);
  if (!civil) return 0;
  // 00:00:00 Asia/Macau (+08:00) is 16:00:00 UTC of previous day
  return Date.UTC(civil.year, civil.month - 1, civil.day) - 8 * 3600 * 1000;
}
