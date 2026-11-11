/**
 * hko.js · 潮候 Ciu Hau
 * Hong Kong Observatory Open Data API Parser & Linear Interpolator.
 * Heights are strictly in metres above Chart Datum (海圖基準面).
 */

import { DATUM } from './stations.js';

/**
 * Parses HKO HLT (High and Low Tides) payload.
 * Expected JSON shape:
 * { "fields": ["Month","Date","Time","Height(m)",...], "data": [["11","12","0541","0.49",...]] }
 *
 * @param {object} json - Raw JSON from HKO HLT endpoint.
 * @param {number} [year] - Reference calendar year (defaults to current year in Asia/Macau).
 * @returns {Array<{ time: string, hour: number, minute: number, height: number, type: 'high'|'low', timestamp: Date, datum: string }>}
 */
export function parseHkoHlt(json, year) {
  if (!json || !Array.isArray(json.data) || json.data.length === 0) {
    return [];
  }

  const currentYear = year || new Date().getFullYear();
  const allExtremes = [];

  for (const row of json.data) {
    if (!Array.isArray(row) || row.length < 4) continue;

    const month = parseInt(row[0], 10);
    const day = parseInt(row[1], 10);

    if (isNaN(month) || isNaN(day)) continue;

    const dailyExtremes = [];

    // Parse pairs of Time (HHMM) and Height(m)
    for (let i = 2; i + 1 < row.length; i += 2) {
      const timeStr = String(row[i]).trim();
      const heightStr = String(row[i + 1]).trim();

      if (!timeStr || !heightStr || timeStr === '-' || heightStr === '-') continue;

      // Ensure 4-digit HHMM
      const paddedTime = timeStr.padStart(4, '0');
      const hour = parseInt(paddedTime.slice(0, 2), 10);
      const minute = parseInt(paddedTime.slice(2, 4), 10);
      const height = parseFloat(heightStr);

      if (isNaN(hour) || isNaN(minute) || isNaN(height)) continue;

      // Construct ISO timestamp in Asia/Macau (UTC+8)
      const mStr = String(month).padStart(2, '0');
      const dStr = String(day).padStart(2, '0');
      const hStr = String(hour).padStart(2, '0');
      const minStr = String(minute).padStart(2, '0');
      const isoTimestamp = `${currentYear}-${mStr}-${dStr}T${hStr}:${minStr}:00+08:00`;
      const date = new Date(isoTimestamp);

      dailyExtremes.push({
        time: `${hStr}:${minStr}`,
        hour,
        minute,
        height: Number(height.toFixed(2)),
        timestamp: date,
        datum: DATUM.CHART_DATUM,
        datumLabel: '海圖基準面（CD）'
      });
    }

    // Determine high / low type for each extreme
    for (let j = 0; j < dailyExtremes.length; j++) {
      const prev = dailyExtremes[j - 1];
      const curr = dailyExtremes[j];
      const next = dailyExtremes[j + 1];

      if (prev && next) {
        curr.type = curr.height > prev.height && curr.height > next.height ? 'high' : 'low';
      } else if (prev) {
        curr.type = curr.height > prev.height ? 'high' : 'low';
      } else if (next) {
        curr.type = curr.height > next.height ? 'high' : 'low';
      } else {
        // Lone extreme cannot be classified without neighbours; leave type unset
        curr.type = 'unknown';
      }
    }

    allExtremes.push(...dailyExtremes);
  }

  // Sort chronologically
  allExtremes.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  return allExtremes;
}

/**
 * Parses HKO HHOT (Hourly Heights of Tides) payload.
 * Expected JSON shape:
 * { "fields": ["MM","DD","01","02",...,"24"], "data": [["11","12","2.13",...,"2.54"]] }
 *
 * @param {object} json - Raw JSON from HKO HHOT endpoint.
 * @param {number} [year] - Reference calendar year.
 * @returns {Array<{ hour: number, height: number, timestamp: Date, datum: string }>}
 */
export function parseHkoHhot(json, year) {
  if (!json || !Array.isArray(json.data) || json.data.length === 0) {
    return [];
  }

  const currentYear = year || new Date().getFullYear();
  const hourlyPoints = [];

  for (const row of json.data) {
    if (!Array.isArray(row) || row.length < 26) continue;

    const month = parseInt(row[0], 10);
    const day = parseInt(row[1], 10);

    if (isNaN(month) || isNaN(day)) continue;

    const mStr = String(month).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');

    // Hour 01 to Hour 24 (hour 24 is 24:00 = 00:00 of next day)
    for (let h = 1; h <= 24; h++) {
      const heightStr = String(row[h + 1]).trim();
      const height = parseFloat(heightStr);
      if (isNaN(height)) continue;

      let date;
      if (h === 24) {
        // 24:00 is midnight at the start of next civil day
        const baseDate = new Date(`${currentYear}-${mStr}-${dStr}T00:00:00+08:00`);
        date = new Date(baseDate.getTime() + 24 * 3600 * 1000);
      } else {
        const hStr = String(h).padStart(2, '0');
        date = new Date(`${currentYear}-${mStr}-${dStr}T${hStr}:00:00+08:00`);
      }

      hourlyPoints.push({
        hour: h,
        height: Number(height.toFixed(2)),
        timestamp: date,
        timeStr: h === 24 ? '24:00' : `${String(h).padStart(2, '0')}:00`,
        datum: DATUM.CHART_DATUM,
        datumLabel: '海圖基準面（CD）'
      });
    }
  }

  // Sort and deduplicate by timestamp
  hourlyPoints.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const uniquePoints = [];
  const seenTimestamps = new Set();

  for (const pt of hourlyPoints) {
    const key = pt.timestamp.getTime();
    if (!seenTimestamps.has(key)) {
      seenTimestamps.add(key);
      uniquePoints.push(pt);
    }
  }

  return uniquePoints;
}

/**
 * Linearly interpolates tide height from an array of hourly points for a given target Date.
 *
 * @param {Array<{ timestamp: Date, height: number }>} hourlyPoints
 * @param {Date} targetDate
 * @returns {number|null} Interpolated height in metres (CD), or null if out of range.
 */
export function interpolateHkoHeight(hourlyPoints, targetDate) {
  if (!hourlyPoints || hourlyPoints.length === 0 || !(targetDate instanceof Date)) {
    return null;
  }

  const targetTime = targetDate.getTime();

  // Return null when target is outside the first and last timestamps
  if (targetTime < hourlyPoints[0].timestamp.getTime() || targetTime > hourlyPoints[hourlyPoints.length - 1].timestamp.getTime()) {
    return null;
  }

  for (let i = 0; i < hourlyPoints.length - 1; i++) {
    const t0 = hourlyPoints[i].timestamp.getTime();
    const t1 = hourlyPoints[i + 1].timestamp.getTime();

    if (targetTime >= t0 && targetTime <= t1) {
      if (t1 === t0) return hourlyPoints[i].height;
      const fraction = (targetTime - t0) / (t1 - t0);
      const h0 = hourlyPoints[i].height;
      const h1 = hourlyPoints[i + 1].height;
      const interpolated = h0 + fraction * (h1 - h0);
      return Number(interpolated.toFixed(2));
    }
  }

  return null;
}
