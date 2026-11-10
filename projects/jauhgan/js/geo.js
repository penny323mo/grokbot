/**
 * geo.js - Geographic calculations, origin handling and distance formatting
 * Nightly 2026-11-11 · 就近 (Just Around)
 */

// Default origin when geolocation is unavailable or denied: 議事亭前地 (Largo do Senado)
export const SENADO_SQUARE = Object.freeze({
  lat: 22.1937,
  lon: 113.5406,
  name: '議事亭前地',
  isDefault: true,
  description: '而家用議事亭前地做起點（未開定位）'
});

export const DEFAULT_ORIGIN = SENADO_SQUARE;

// Average urban walking speed: 4.8 km/h = 80 m/minute
export const WALKING_SPEED_KMH = 4.8;
export const WALKING_SPEED_M_PER_MIN = (WALKING_SPEED_KMH * 1000) / 60; // 80 m/min

/**
 * Calculates great-circle distance between two points in meters using the Haversine formula.
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} distance in meters
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  if (
    typeof lat1 !== 'number' ||
    typeof lon1 !== 'number' ||
    typeof lat2 !== 'number' ||
    typeof lon2 !== 'number' ||
    !Number.isFinite(lat1) ||
    !Number.isFinite(lon1) ||
    !Number.isFinite(lat2) ||
    !Number.isFinite(lon2)
  ) {
    throw new TypeError('Valid finite numeric coordinates are required for haversineDistance');
  }

  const R = 6371000; // Mean Earth radius in meters
  const toRad = Math.PI / 180;
  const phi1 = lat1 * toRad;
  const phi2 = lat2 * toRad;
  const deltaPhi = (lat2 - lat1) * toRad;
  const deltaLambda = (lon2 - lon1) * toRad;

  const sinDeltaPhi = Math.sin(deltaPhi / 2);
  const sinDeltaLambda = Math.sin(deltaLambda / 2);

  const a =
    sinDeltaPhi * sinDeltaPhi +
    Math.cos(phi1) * Math.cos(phi2) * sinDeltaLambda * sinDeltaLambda;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates walking time in minutes based on distance in meters.
 * @param {number} distanceMeters
 * @param {number} speedKmH
 * @returns {number} minutes (rounded, minimum 1 if distance > 0)
 */
export function calculateWalkMinutes(distanceMeters, speedKmH = WALKING_SPEED_KMH) {
  if (typeof distanceMeters !== 'number' || distanceMeters <= 0 || !Number.isFinite(distanceMeters)) {
    return 0;
  }
  const speedMetersPerMin = (speedKmH * 1000) / 60;
  const minutes = distanceMeters / speedMetersPerMin;
  return Math.max(1, Math.round(minutes));
}

/**
 * Formats distance for display in natural Cantonese typography.
 * Tabular lining numerals friendly.
 * @param {number} distanceMeters
 * @returns {string} e.g. "150 米" or "1.3 公里"
 */
export function formatDistance(distanceMeters) {
  if (typeof distanceMeters !== 'number' || distanceMeters < 0 || !Number.isFinite(distanceMeters)) {
    return '0 米';
  }
  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)} 米`;
  }
  const km = (Math.round(distanceMeters / 100) / 10).toFixed(1);
  return `${km} 公里`;
}

/**
 * Formats walking time for display in natural Cantonese.
 * @param {number} minutes
 * @returns {string} e.g. "約 2 分鐘"
 */
export function formatWalkMinutes(minutes) {
  if (typeof minutes !== 'number' || minutes <= 0) {
    return '約 1 分鐘內';
  }
  return `約 ${Math.round(minutes)} 分鐘`;
}

/**
 * Checks if a coordinate is within Hong Kong territory.
 * @param {number} lat
 * @param {number} lon
 * @returns {boolean}
 */
export function isHongKong(lat, lon) {
  return (
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    lat >= 22.14 &&
    lat <= 22.58 &&
    lon >= 113.82 &&
    lon <= 114.45
  );
}

/**
 * Checks if a coordinate is within Macau territory (Peninsula, Taipa, Cotai, Coloane).
 * @param {number} lat
 * @param {number} lon
 * @returns {boolean}
 */
export function isMacau(lat, lon) {
  return (
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    lat >= 22.09 &&
    lat <= 22.25 &&
    lon >= 113.50 &&
    lon <= 113.62
  );
}

/**
 * Calculates a bounding box around a center coordinate.
 * @param {number} lat
 * @param {number} lon
 * @param {number} radiusKm
 * @returns {{ south: number, west: number, north: number, east: number }}
 */
export function getBbox(lat, lon, radiusKm = 1.5) {
  const latDelta = radiusKm / 111.0;
  const lonDelta = radiusKm / (111.0 * Math.cos((lat * Math.PI) / 180));
  return {
    south: Number((lat - latDelta).toFixed(5)),
    west: Number((lon - lonDelta).toFixed(5)),
    north: Number((lat + latDelta).toFixed(5)),
    east: Number((lon + lonDelta).toFixed(5))
  };
}

/**
 * Normalizes an ISO date/time string so that zone-less strings (like Open-Meteo current.time)
 * are explicitly treated as Asia/Macau (UTC+8).
 * @param {string} isoString
 * @returns {string}
 */
export function normalizeMacauIsoString(isoString) {
  if (!isoString || typeof isoString !== 'string') return '';
  const str = isoString.trim();
  // If it is YYYY-MM-DD[T/ ]HH:mm[:ss] with no Z or offset at the end
  if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2})?$/.test(str)) {
    return str.replace(' ', 'T') + '+08:00';
  }
  return str;
}

/**
 * Formats an ISO date/time string to Asia/Macau (UTC+8) time: YYYY-MM-DD HH:mm 澳門時間
 * @param {string} isoString
 * @returns {string}
 */
export function formatMacauDateTime(isoString) {
  if (!isoString) return '';
  const normalized = normalizeMacauIsoString(isoString);
  const date = new Date(normalized);
  if (isNaN(date.getTime())) return String(isoString);

  const formatter = new Intl.DateTimeFormat('zh-HK', {
    timeZone: 'Asia/Macau',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')} 澳門時間`;
}

/**
 * Formats time only in Asia/Macau: HH:mm
 * @param {string} isoString
 * @returns {string}
 */
export function formatMacauTimeOnly(isoString) {
  if (!isoString) return '';
  const normalized = normalizeMacauIsoString(isoString);
  const date = new Date(normalized);
  if (isNaN(date.getTime())) return String(isoString);

  const formatter = new Intl.DateTimeFormat('zh-HK', {
    timeZone: 'Asia/Macau',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  return formatter.format(date);
}
