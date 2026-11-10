import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  WMO_MAP,
  getWmoDescription,
  getRainForecast,
  getAirQualityText,
  parseWeather
} from '../js/weather.js';

describe('Weather module (weather.js)', () => {
  const macauWeatherFixture = {
    latitude: 22.17926,
    longitude: 113.49845,
    utc_offset_seconds: 28800,
    timezone: 'Asia/Macau',
    current_units: {
      time: 'iso8601',
      temperature_2m: '°C',
      weather_code: 'wmo code'
    },
    current: {
      time: '2026-11-11T01:15',
      temperature_2m: 17.5,
      weather_code: 2,
      precipitation: 0.0,
      apparent_temperature: 15.0,
      relative_humidity_2m: 55,
      wind_speed_10m: 13.6
    },
    hourly_units: {
      precipitation: 'mm',
      precipitation_probability: '%'
    },
    hourly: {
      time: ['2026-11-11T01:00', '2026-11-11T02:00'],
      precipitation: [0.0, 0.0],
      precipitation_probability: [0, 0]
    }
  };

  const macauAirFixture = {
    current: {
      time: '2026-11-11T01:00',
      pm2_5: 8.6,
      us_aqi: 51,
      european_aqi: 41
    }
  };

  test('Open-Meteo parses known 2026-11-11 Macau weather shape accurately', () => {
    const res = parseWeather(macauWeatherFixture, macauAirFixture);
    assert.ok(res);
    assert.strictEqual(res.temp, 18); // 17.5 rounds to 18
    assert.strictEqual(res.skyPhrase, '短暫陽光');
    assert.strictEqual(res.rainPhrase, '未來兩小時無雨');
    assert.strictEqual(res.aqiPhrase, 'PM2.5 8.6 · 空氣良好');
    assert.strictEqual(res.line1, '18°C · 短暫陽光 · 未來兩小時無雨 · PM2.5 8.6 · 空氣良好');
    assert.ok(res.line2.includes('更新 · Open-Meteo'));
    assert.strictEqual(res.source, 'Open-Meteo');
  });

  test('Weather parser NEVER invents a default temperature', () => {
    // Missing temperature_2m
    const missingTemp = {
      current: {
        weather_code: 1
      }
    };
    assert.strictEqual(parseWeather(missingTemp), null);

    // Null temperature_2m
    const nullTemp = {
      current: {
        temperature_2m: null,
        weather_code: 1
      }
    };
    assert.strictEqual(parseWeather(nullTemp), null);

    // Empty object
    assert.strictEqual(parseWeather({}), null);
    assert.strictEqual(parseWeather(null), null);
    assert.strictEqual(parseWeather(undefined), null);
  });

  test('Partial weather fields are omitted, NEVER guessed or defaulted', () => {
    // Missing weather_code and hourly
    const partialData = {
      current: {
        time: '2026-11-11T01:15',
        temperature_2m: 19.0
        // no weather_code
      }
      // no hourly
    };
    const res = parseWeather(partialData);
    assert.ok(res);
    assert.strictEqual(res.temp, 19);
    assert.strictEqual(res.skyPhrase, null);
    assert.strictEqual(res.rainPhrase, null);
    assert.strictEqual(res.line1, '19°C');
    assert.ok(res.line2.includes('Open-Meteo'));

    // Unknown weather code
    assert.strictEqual(getWmoDescription(9999), null);
    assert.strictEqual(getWmoDescription(null), null);
    assert.strictEqual(getWmoDescription(undefined), null);

    // Missing hourly precipitation
    assert.strictEqual(getRainForecast({}), null);
    assert.strictEqual(getRainForecast(null), null);
  });

  test('Rain forecast correctly flags incoming rain in the next 2 hours', () => {
    // Rain in 1 hour
    const rainSoon = {
      precipitation: [0.0, 1.2],
      precipitation_probability: [10, 80]
    };
    assert.strictEqual(getRainForecast(rainSoon), '未來兩小時有雨，記得帶遮');

    // Slight drizzle
    const drizzleSoon = {
      precipitation: [0.1, 0.0],
      precipitation_probability: [40, 20]
    };
    assert.strictEqual(getRainForecast(drizzleSoon), '未來兩小時或有微雨');

    // Dry
    const dry = {
      precipitation: [0.0, 0.0],
      precipitation_probability: [5, 10]
    };
    assert.strictEqual(getRainForecast(dry), '未來兩小時無雨');
  });

  test('Air quality text formatting in natural Cantonese', () => {
    assert.strictEqual(getAirQualityText(8.5, 30), 'PM2.5 8.5 · 空氣良好');
    assert.strictEqual(getAirQualityText(25.0, 70), 'PM2.5 25.0 · 空氣普通');
    assert.strictEqual(getAirQualityText(45.0, 120), 'PM2.5 45.0 · 空氣欠佳');
    assert.strictEqual(getAirQualityText(null, null), null);
  });
});
