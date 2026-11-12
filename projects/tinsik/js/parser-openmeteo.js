/**
 * parser-openmeteo.js · 天色 Tin Sik
 * Open-Meteo Forecast and Air Quality data parsers.
 * Guarantees strict null safety: missing fields are NEVER converted to 0.
 */

import { degreesToCompassCantonese } from './geo.js';
import { getWeatherCondition } from './weather-codes.js';
import { evaluateRainRibbon } from './rain-ribbon.js';

/**
 * Parses Open-Meteo Forecast payload.
 *
 * @param {Object} data - Raw JSON response from Open-Meteo Forecast API
 * @returns {Object|null}
 */
export function parseOpenMeteoWeather(data) {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const result = {
    timezone: data.timezone || 'Asia/Macau',
    current: null,
    hourly: [],
    daily: [],
    rainRibbon: { available: false, sentence: '', intervals: [], hasRain: false }
  };

  // Current
  if (data.current && typeof data.current === 'object') {
    const c = data.current;
    const temp = c.temperature_2m != null ? Number(c.temperature_2m) : null;
    const appTemp = c.apparent_temperature != null ? Number(c.apparent_temperature) : null;
    const humidity = c.relative_humidity_2m != null ? Number(c.relative_humidity_2m) : null;
    const precip = c.precipitation != null ? Number(c.precipitation) : null;
    const code = c.weather_code != null ? Number(c.weather_code) : null;
    const windSpd = c.wind_speed_10m != null ? Number(c.wind_speed_10m) : null;
    const windDir = c.wind_direction_10m != null ? Number(c.wind_direction_10m) : null;
    const uv = c.uv_index != null ? Number(c.uv_index) : null;
    const isDay = c.is_day != null ? Number(c.is_day) : 1;

    result.current = {
      time: c.time || null,
      temperature: temp,
      apparentTemperature: appTemp,
      humidity,
      precipitation: precip,
      weatherCode: code,
      windSpeed: windSpd,
      windDirection: windDir,
      windBearing: degreesToCompassCantonese(windDir),
      uvIndex: uv,
      isDay,
      condition: getWeatherCondition(code, isDay)
    };
  }

  // Hourly
  if (data.hourly && Array.isArray(data.hourly.time)) {
    const h = data.hourly;
    const count = h.time.length;

    for (let i = 0; i < count; i++) {
      const timeStr = h.time[i];
      const temp = h.temperature_2m?.[i] != null ? Number(h.temperature_2m[i]) : null;
      const appTemp = h.apparent_temperature?.[i] != null ? Number(h.apparent_temperature[i]) : null;
      const precip = h.precipitation?.[i] != null ? Number(h.precipitation[i]) : null;
      const prob = h.precipitation_probability?.[i] != null ? Number(h.precipitation_probability[i]) : null;
      const code = h.weather_code?.[i] != null ? Number(h.weather_code[i]) : null;
      const uv = h.uv_index?.[i] != null ? Number(h.uv_index[i]) : null;
      const windSpd = h.wind_speed_10m?.[i] != null ? Number(h.wind_speed_10m[i]) : null;
      const windDir = h.wind_direction_10m?.[i] != null ? Number(h.wind_direction_10m[i]) : null;
      const humidity = h.relative_humidity_2m?.[i] != null ? Number(h.relative_humidity_2m[i]) : null;
      const isDay = h.is_day?.[i] != null ? Number(h.is_day[i]) : 1;

      result.hourly.push({
        time: timeStr,
        temperature: temp,
        apparentTemperature: appTemp,
        precipitation: precip,
        precipitationProbability: prob,
        weatherCode: code,
        uvIndex: uv,
        windSpeed: windSpd,
        windDirection: windDir,
        windBearing: degreesToCompassCantonese(windDir),
        humidity,
        isDay,
        condition: getWeatherCondition(code, isDay)
      });
    }
  }

  // Daily
  if (data.daily && Array.isArray(data.daily.time)) {
    const d = data.daily;
    const count = d.time.length;

    for (let i = 0; i < count; i++) {
      const dateStr = d.time[i];
      const code = d.weather_code?.[i] != null ? Number(d.weather_code[i]) : null;
      const tempMax = d.temperature_2m_max?.[i] != null ? Number(d.temperature_2m_max[i]) : null;
      const tempMin = d.temperature_2m_min?.[i] != null ? Number(d.temperature_2m_min[i]) : null;
      const precipSum = d.precipitation_sum?.[i] != null ? Number(d.precipitation_sum[i]) : null;
      const probMax = d.precipitation_probability_max?.[i] != null ? Number(d.precipitation_probability_max[i]) : null;
      const uvMax = d.uv_index_max?.[i] != null ? Number(d.uv_index_max[i]) : null;
      const sunrise = d.sunrise?.[i] || null;
      const sunset = d.sunset?.[i] || null;
      const windSpdMax = d.wind_speed_10m_max?.[i] != null ? Number(d.wind_speed_10m_max[i]) : null;

      result.daily.push({
        date: dateStr,
        weatherCode: code,
        tempMax,
        tempMin,
        precipSum,
        precipitationProbabilityMax: probMax,
        uvMax,
        sunrise,
        sunset,
        windSpeedMax: windSpdMax,
        condition: getWeatherCondition(code, 1)
      });
    }
  }

  // Rain ribbon from minutely_15
  if (data.minutely_15) {
    result.rainRibbon = evaluateRainRibbon(data.minutely_15, result.current?.time);
  }

  return result;
}

/**
 * Returns Cantonese health category for US AQI.
 */
export function getCantoneseAqiCategory(aqi) {
  if (aqi == null || isNaN(aqi)) return '';
  if (aqi <= 50) return '良好';
  if (aqi <= 100) return '普通';
  if (aqi <= 150) return '敏感人士警惕';
  if (aqi <= 200) return '唔健康';
  if (aqi <= 300) return '極唔健康';
  return '嚴重危害';
}

/**
 * Parses Open-Meteo Air Quality payload.
 *
 * @param {Object} data - Raw JSON response from Open-Meteo Air Quality API
 * @returns {Object|null}
 */
export function parseOpenMeteoAir(data) {
  if (!data || typeof data !== 'object' || !data.current || typeof data.current !== 'object') {
    return null;
  }

  const c = data.current;
  const pm25 = c.pm2_5 != null ? Number(c.pm2_5) : null;
  const usAqi = c.us_aqi != null ? Number(c.us_aqi) : null;
  const europeanAqi = c.european_aqi != null ? Number(c.european_aqi) : null;

  // If no useful air metrics, return null rather than fake 0
  if (pm25 == null && usAqi == null && europeanAqi == null) {
    return null;
  }

  return {
    time: c.time || null,
    pm2_5: pm25,
    usAqi,
    europeanAqi,
    category: getCantoneseAqiCategory(usAqi)
  };
}
