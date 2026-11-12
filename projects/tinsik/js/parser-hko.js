/**
 * parser-hko.js · 天色 Tin Sik
 * Hong Kong Observatory (HKO) Open Data parser.
 * Handles official warnings (warnsum / warningInfo) and official HK observations (rhrread).
 * Strictly enforces territory isolation: HKO readings are NEVER used for Macau places.
 */

import { getPlaceById } from './places.js';

/**
 * Parses HKO warning summary and optional warning details.
 *
 * @param {Object} warnsum - Response from dataType=warnsum
 * @param {Object} [warninfo] - Response from dataType=warningInfo
 * @returns {Array<Object>} List of active warning objects
 */
export function parseHkoWarnings(warnsum, warninfo = null) {
  if (!warnsum || typeof warnsum !== 'object') {
    return [];
  }

  // Create a map of statement codes to details if warninfo is provided
  const detailsMap = new Map();
  if (warninfo && Array.isArray(warninfo.details)) {
    for (const item of warninfo.details) {
      if (item.warningStatementCode && Array.isArray(item.contents)) {
        detailsMap.set(item.warningStatementCode, item.contents.join(' '));
      }
    }
  }

  const warnings = [];

  // warnsum is a dictionary of warning keys, e.g. { "WFIRE": { "name": "...", "code": "..." } }
  for (const [key, val] of Object.entries(warnsum)) {
    if (val && typeof val === 'object' && val.name) {
      const code = val.code || key;
      const statement = detailsMap.get(code) || detailsMap.get(key) || '';
      warnings.push({
        key,
        code,
        name: val.name,
        actionCode: val.actionCode || 'ISSUE',
        issueTime: val.issueTime || '',
        updateTime: val.updateTime || '',
        statement
      });
    }
  }

  return warnings;
}

/**
 * Parses HKO real-time weather readings (rhrread) for Hong Kong places only.
 *
 * @param {Object} rhrread - Response from dataType=rhrread
 * @param {string|Object} placeOrId - The target place ID or place object
 * @returns {Object|null}
 * @throws {Error} If called for a Macau place to enforce strict territorial isolation
 */
export function parseHkoObservations(rhrread, placeOrId) {
  const place = typeof placeOrId === 'string' ? getPlaceById(placeOrId) : placeOrId;

  if (!place || place.territory === 'macau') {
    throw new Error('HKO observations must NOT be used for Macau places.');
  }

  if (!rhrread || typeof rhrread !== 'object') {
    return null;
  }

  // Extract station temperature (prefer '香港天文台')
  let stationTemp = null;
  let stationName = '香港天文台';

  if (rhrread.temperature && Array.isArray(rhrread.temperature.data)) {
    const temps = rhrread.temperature.data;
    const hkoEntry = temps.find(t => t.place === '香港天文台') || temps[0];
    if (hkoEntry && hkoEntry.value != null && !isNaN(hkoEntry.value)) {
      stationTemp = Number(hkoEntry.value);
      stationName = hkoEntry.place;
    }
  }

  // Extract humidity
  let humidity = null;
  if (rhrread.humidity && Array.isArray(rhrread.humidity.data)) {
    const hEntry = rhrread.humidity.data.find(h => h.place === '香港天文台') || rhrread.humidity.data[0];
    if (hEntry && hEntry.value != null && !isNaN(hEntry.value)) {
      humidity = Number(hEntry.value);
    }
  }

  // Extract UV
  let uvIndex = null;
  if (rhrread.uvindex && Array.isArray(rhrread.uvindex.data)) {
    const uvEntry = rhrread.uvindex.data[0];
    if (uvEntry && uvEntry.value != null && !isNaN(uvEntry.value)) {
      uvIndex = Number(uvEntry.value);
    }
  }

  if (stationTemp == null && humidity == null && uvIndex == null) {
    return null;
  }

  return {
    source: '香港天文台',
    stationName,
    temperature: stationTemp,
    humidity,
    uvIndex,
    updateTime: rhrread.updateTime || null
  };
}
