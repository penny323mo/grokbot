/**
 * extremes.js · 潮候 Ciu Hau
 * Extreme detection (high/low tides), rising/falling/slack tendency, and next extreme calculation.
 */

import { formatMacauTimeOnly } from './geo.js';

/**
 * Detects tidal tendency at currentTime from an hourly series.
 *
 * @param {Array<{ timestamp: Date, height: number }>} hourlySeries
 * @param {Date} [currentTime] - Defaults to new Date()
 * @returns {'rising'|'falling'|'slack'}
 */
export function detectTendency(hourlySeries, currentTime) {
  if (!hourlySeries || hourlySeries.length < 2) {
    return 'slack';
  }

  const now = (currentTime instanceof Date ? currentTime : new Date()).getTime();

  // Find surrounding hourly points
  let idx = 0;
  while (idx < hourlySeries.length - 1 && hourlySeries[idx + 1].timestamp.getTime() <= now) {
    idx++;
  }

  const p0 = hourlySeries[idx];
  const p1 = hourlySeries[Math.min(idx + 1, hourlySeries.length - 1)];

  if (!p0 || !p1 || p0 === p1) {
    return 'slack';
  }

  const dtHours = (p1.timestamp.getTime() - p0.timestamp.getTime()) / (1000 * 60 * 60);
  if (dtHours <= 0) return 'slack';

  const ratePerHour = (p1.height - p0.height) / dtHours;

  // Rate threshold for slack water: ±0.04 metres / hour
  if (Math.abs(ratePerHour) < 0.04) {
    return 'slack';
  }

  return ratePerHour > 0 ? 'rising' : 'falling';
}

/**
 * Returns natural Cantonese label for tidal tendency.
 */
export function formatTendencyCantonese(tendency) {
  switch (tendency) {
    case 'rising':
      return '漲緊';
    case 'falling':
      return '退緊';
    case 'slack':
    default:
      return '差不多平';
  }
}

/**
 * Derives local maxima and minima (high and low tides) from an hourly series.
 * Used for Open-Meteo model points where only hourly data is available.
 *
 * @param {Array<{ timestamp: Date, height: number, datum?: string, datumLabel?: string }>} hourlySeries
 * @returns {Array<{ timestamp: Date, time: string, height: number, type: 'high'|'low', approx: boolean, datum?: string, datumLabel?: string }>}
 */
export function findExtremesFromHourly(hourlySeries) {
  if (!hourlySeries || hourlySeries.length < 3) {
    return [];
  }

  const extremes = [];
  const n = hourlySeries.length;

  for (let i = 1; i < n - 1; i++) {
    const prev = hourlySeries[i - 1].height;
    const curr = hourlySeries[i].height;
    const next = hourlySeries[i + 1].height;

    // Local peak (high tide)
    if (curr >= prev && curr >= next && (curr > prev || curr > next)) {
      // Avoid duplicate plateau peaks within 2 hours
      const last = extremes[extremes.length - 1];
      if (!last || last.type !== 'high' || (hourlySeries[i].timestamp.getTime() - last.timestamp.getTime()) > 3 * 3600 * 1000) {
        extremes.push({
          timestamp: hourlySeries[i].timestamp,
          time: formatMacauTimeOnly(hourlySeries[i].timestamp),
          height: curr,
          type: 'high',
          approx: true,
          datum: hourlySeries[i].datum,
          datumLabel: hourlySeries[i].datumLabel
        });
      }
    }
    // Local trough (low tide)
    else if (curr <= prev && curr <= next && (curr < prev || curr < next)) {
      const last = extremes[extremes.length - 1];
      if (!last || last.type !== 'low' || (hourlySeries[i].timestamp.getTime() - last.timestamp.getTime()) > 3 * 3600 * 1000) {
        extremes.push({
          timestamp: hourlySeries[i].timestamp,
          time: formatMacauTimeOnly(hourlySeries[i].timestamp),
          height: curr,
          type: 'low',
          approx: true,
          datum: hourlySeries[i].datum,
          datumLabel: hourlySeries[i].datumLabel
        });
      }
    }
  }

  return extremes;
}

/**
 * Finds the immediate next extreme (high or low tide) after currentTime.
 *
 * @param {Array<{ timestamp: Date, time: string, height: number, type: 'high'|'low', approx?: boolean }>} extremes
 * @param {Date} [currentTime]
 * @returns {object|null}
 */
export function findNextExtreme(extremes, currentTime) {
  if (!extremes || extremes.length === 0) {
    return null;
  }

  const now = (currentTime instanceof Date ? currentTime : new Date()).getTime();

  for (const ext of extremes) {
    const extTime = ext.timestamp.getTime();
    if (extTime > now) {
      const diffMs = extTime - now;
      const totalMinutes = Math.round(diffMs / (60 * 1000));
      const hoursRemaining = Math.floor(totalMinutes / 60);
      const minutesRemaining = totalMinutes % 60;

      let remainingText = '';
      if (hoursRemaining > 0 && minutesRemaining > 0) {
        remainingText = `仲有 ${hoursRemaining}小時${minutesRemaining}分`;
      } else if (hoursRemaining > 0) {
        remainingText = `仲有 ${hoursRemaining}小時`;
      } else if (minutesRemaining > 0) {
        remainingText = `仲有 ${minutesRemaining}分鐘`;
      } else {
        remainingText = '正值潮位';
      }

      const typeLabel = ext.type === 'high' ? '高潮' : (ext.type === 'low' ? '低潮' : '潮位');
      const timePrefix = ext.approx ? '約 ' : '';
      const summary = `下一潮：${typeLabel} ${timePrefix}${ext.time} · ${ext.height.toFixed(2)} m，${remainingText}`;
      const summaryHtml = `下一潮：${typeLabel} ${timePrefix}${ext.time} · ${ext.height.toFixed(2)} m，<span class="u-nowrap">${remainingText}</span>`;

      return {
        extreme: ext,
        typeLabel,
        remainingText,
        hoursRemaining,
        minutesRemaining,
        diffMinutes: totalMinutes,
        summary,
        summaryHtml
      };
    }
  }

  return null;
}
