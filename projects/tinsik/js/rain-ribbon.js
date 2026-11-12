/**
 * rain-ribbon.js · 天色 Tin Sik
 * Next ~2 hours precipitation analysis from Open-Meteo minutely_15 data.
 * Produces natural spoken Cantonese summaries and a compact 8-cell intensity strip.
 */

import { formatMacauTimeOnly } from './geo.js';

/**
 * Categorizes precipitation amount (mm in 15 mins) into intensity levels.
 */
export function getPrecipitationLevel(mm) {
  if (mm == null || isNaN(mm) || mm <= 0.05) {
    return 'none';
  }
  if (mm < 0.8) {
    return 'light'; // 毛毛雨 / 微雨
  }
  if (mm < 3.0) {
    return 'moderate'; // 中雨
  }
  return 'heavy'; // 大雨
}

/**
 * Analyzes minutely_15 precipitation series for the next 2 hours (8 intervals).
 *
 * @param {Object} minutely15 - The minutely_15 object from Open-Meteo { time: [], precipitation: [] }
 * @param {string} [currentTimeStr] - Current Asia/Macau time e.g. "2026-11-13T01:45"
 * @returns {Object} { available, sentence, intervals, maxPrecip }
 */
export function evaluateRainRibbon(minutely15, currentTimeStr = null) {
  if (
    !minutely15 ||
    !Array.isArray(minutely15.time) ||
    !Array.isArray(minutely15.precipitation) ||
    minutely15.time.length === 0
  ) {
    return {
      available: false,
      sentence: '',
      intervals: [],
      hasRain: false
    };
  }

  const times = minutely15.time;
  const precips = minutely15.precipitation;

  // Determine starting index
  let startIndex = 0;
  if (currentTimeStr) {
    const foundIdx = times.findIndex(t => t >= currentTimeStr);
    if (foundIdx !== -1) {
      startIndex = foundIdx;
    }
  }

  // Slice next 8 slots (15 mins * 8 = 120 mins = 2 hours)
  const windowTimes = times.slice(startIndex, startIndex + 8);
  const windowPrecips = precips.slice(startIndex, startIndex + 8);

  if (windowTimes.length === 0) {
    return {
      available: false,
      sentence: '',
      intervals: [],
      hasRain: false
    };
  }

  const intervals = windowTimes.map((t, i) => {
    const rawVal = windowPrecips[i];
    const mm = (rawVal == null || isNaN(rawVal)) ? null : Number(rawVal);
    return {
      time: t,
      timeLabel: formatMacauTimeOnly(t),
      precipitation: mm,
      level: mm != null ? getPrecipitationLevel(mm) : 'none'
    };
  });

  // If every slot in the window has null precipitation, no valid data exists
  const hasAnyValidReading = intervals.some(s => s.precipitation != null);
  if (!hasAnyValidReading) {
    return {
      available: false,
      sentence: '',
      intervals: [],
      hasRain: false
    };
  }

  // Check rain presence
  const rainIndices = [];
  intervals.forEach((slot, idx) => {
    if (slot.precipitation != null && slot.precipitation > 0.05) {
      rainIndices.push(idx);
    }
  });

  const hasRain = rainIndices.length > 0;
  let sentence = '';

  if (!hasRain) {
    sentence = '未來兩小時都唔會落雨';
  } else if (rainIndices[0] === 0) {
    // Currently raining
    const firstDryIdx = intervals.findIndex((s, i) => i > 0 && (s.precipitation == null || s.precipitation <= 0.05));
    if (firstDryIdx !== -1) {
      const stopTime = intervals[firstDryIdx].timeLabel;
      sentence = `而家有雨，大約 ${stopTime} 減弱或停雨`;
    } else {
      sentence = '未來兩小時大致持續有雨';
    }
  } else {
    // Rain starts later
    const startSlot = intervals[rainIndices[0]];
    sentence = `大約 ${startSlot.timeLabel} 開始會有雨`;
  }

  return {
    available: true,
    sentence,
    intervals,
    hasRain
  };
}
