/**
 * openmeteo.js · 潮候 Ciu Hau
 * Open-Meteo Marine & Weather API Parser.
 * Heights are strictly in metres above Mean Sea Level (平均海平面 MSL).
 */

import { DATUM } from './stations.js';

/**
 * Normalizes zone-less ISO string from Open-Meteo (e.g. "2026-11-12T01:00")
 * to explicitly include Asia/Macau UTC+8 offset ("+08:00").
 */
export function normalizeOpenMeteoIsoString(isoStr) {
  if (!isoStr || typeof isoStr !== 'string') return '';
  if (isoStr.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(isoStr)) {
    return isoStr;
  }
  return `${isoStr}:00+08:00`;
}

/**
 * Parses Open-Meteo Marine API payload.
 *
 * @param {object} json - Raw JSON from Open-Meteo Marine endpoint.
 * @returns {object|null}
 */
export function parseOpenMeteoMarine(json) {
  if (!json || typeof json !== 'object') {
    return null;
  }

  const result = {
    datum: DATUM.MEAN_SEA_LEVEL,
    datumLabel: '平均海平面（MSL）',
    current: null,
    hourly: []
  };

  // 1. Current conditions
  if (json.current && typeof json.current === 'object') {
    const c = json.current;
    const currentHeight = typeof c.sea_level_height_msl === 'number' && !isNaN(c.sea_level_height_msl)
      ? Number(c.sea_level_height_msl.toFixed(2))
      : null;

    const sst = typeof c.sea_surface_temperature === 'number' && !isNaN(c.sea_surface_temperature)
      ? Number(c.sea_surface_temperature.toFixed(1))
      : null;

    const waveHeight = typeof c.wave_height === 'number' && !isNaN(c.wave_height)
      ? Number(c.wave_height.toFixed(2))
      : null;

    const wavePeriod = typeof c.wave_period === 'number' && !isNaN(c.wave_period)
      ? Number(c.wave_period.toFixed(1))
      : null;

    const waveDirection = typeof c.wave_direction === 'number' && !isNaN(c.wave_direction)
      ? Math.round(c.wave_direction)
      : null;

    result.current = {
      height: currentHeight,
      seaSurfaceTemperature: sst,
      waveHeight,
      wavePeriod,
      waveDirection,
      time: c.time ? new Date(normalizeOpenMeteoIsoString(c.time)) : new Date()
    };
  }

  // 2. Hourly series
  if (json.hourly && Array.isArray(json.hourly.time) && Array.isArray(json.hourly.sea_level_height_msl)) {
    const times = json.hourly.time;
    const heights = json.hourly.sea_level_height_msl;
    const sstList = json.hourly.sea_surface_temperature || [];
    const waveHeights = json.hourly.wave_height || [];
    const wavePeriods = json.hourly.wave_period || [];
    const waveDirs = json.hourly.wave_direction || [];

    for (let i = 0; i < times.length; i++) {
      const rawH = heights[i];
      if (typeof rawH !== 'number' || isNaN(rawH)) continue;

      const date = new Date(normalizeOpenMeteoIsoString(times[i]));
      if (isNaN(date.getTime())) continue;

      const h = Number(rawH.toFixed(2));
      const sst = typeof sstList[i] === 'number' && !isNaN(sstList[i]) ? Number(sstList[i].toFixed(1)) : null;
      const wh = typeof waveHeights[i] === 'number' && !isNaN(waveHeights[i]) ? Number(waveHeights[i].toFixed(2)) : null;
      const wp = typeof wavePeriods[i] === 'number' && !isNaN(wavePeriods[i]) ? Number(wavePeriods[i].toFixed(1)) : null;
      const wd = typeof waveDirs[i] === 'number' && !isNaN(waveDirs[i]) ? Math.round(waveDirs[i]) : null;

      result.hourly.push({
        timestamp: date,
        height: h,
        seaSurfaceTemperature: sst,
        waveHeight: wh,
        wavePeriod: wp,
        waveDirection: wd,
        datum: DATUM.MEAN_SEA_LEVEL,
        datumLabel: '平均海平面（MSL）'
      });
    }
  }

  return result;
}

/**
 * Parses Open-Meteo Weather API payload.
 *
 * @param {object} json - Raw JSON from Open-Meteo Weather endpoint.
 * @returns {object|null}
 */
export function parseOpenMeteoWeather(json) {
  if (!json || typeof json !== 'object') {
    return null;
  }

  const result = {
    current: null,
    daily: null
  };

  if (json.current && typeof json.current === 'object') {
    const c = json.current;
    result.current = {
      temperature: typeof c.temperature_2m === 'number' && !isNaN(c.temperature_2m) ? Number(c.temperature_2m.toFixed(1)) : null,
      windSpeed: typeof c.wind_speed_10m === 'number' && !isNaN(c.wind_speed_10m) ? Number(c.wind_speed_10m.toFixed(1)) : null,
      windDirection: typeof c.wind_direction_10m === 'number' && !isNaN(c.wind_direction_10m) ? Math.round(c.wind_direction_10m) : null,
      windGusts: typeof c.wind_gusts_10m === 'number' && !isNaN(c.wind_gusts_10m) ? Number(c.wind_gusts_10m.toFixed(1)) : null,
      weatherCode: typeof c.weather_code === 'number' ? c.weather_code : null
    };
  }

  if (json.daily && typeof json.daily === 'object') {
    const d = json.daily;
    const sunriseStr = Array.isArray(d.sunrise) && d.sunrise[0] ? d.sunrise[0] : null;
    const sunsetStr = Array.isArray(d.sunset) && d.sunset[0] ? d.sunset[0] : null;

    result.daily = {
      sunrise: sunriseStr ? new Date(normalizeOpenMeteoIsoString(sunriseStr)) : null,
      sunset: sunsetStr ? new Date(normalizeOpenMeteoIsoString(sunsetStr)) : null
    };
  }

  return result;
}
