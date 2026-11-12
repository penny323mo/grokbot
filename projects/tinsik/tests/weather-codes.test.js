/**
 * tests/weather-codes.test.js
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { getWeatherCondition, UNKNOWN_WEATHER } from '../js/weather-codes.js';

test('WMO code 0 maps to 晴朗 (day) and 天晴 (night)', () => {
  const day = getWeatherCondition(0, 1);
  assert.equal(day.label, '晴朗');
  assert.equal(day.iconType, 'sun');

  const night = getWeatherCondition(0, 0);
  assert.equal(night.label, '天晴');
  assert.equal(night.iconType, 'moon');
});

test('WMO code 1 maps to 大致天晴', () => {
  const res = getWeatherCondition(1, 1);
  assert.equal(res.label, '大致天晴');
});

test('WMO code 2 maps to 有雲', () => {
  const res = getWeatherCondition(2, 1);
  assert.equal(res.label, '有雲');
});

test('WMO code 3 maps to 密雲', () => {
  const res = getWeatherCondition(3, 1);
  assert.equal(res.label, '密雲');
  assert.equal(res.iconType, 'cloud');
});

test('WMO code 45 maps to 有霧', () => {
  const res = getWeatherCondition(45, 1);
  assert.equal(res.label, '有霧');
  assert.equal(res.iconType, 'fog');
});

test('WMO code 61 maps to 落雨', () => {
  const res = getWeatherCondition(61, 1);
  assert.equal(res.label, '落雨');
  assert.equal(res.iconType, 'rain');
});

test('WMO code 80 maps to 驟雨', () => {
  const res = getWeatherCondition(80, 1);
  assert.equal(res.label, '驟雨');
  assert.equal(res.iconType, 'shower');
});

test('WMO code 95 maps to 雷暴', () => {
  const res = getWeatherCondition(95, 1);
  assert.equal(res.label, '雷暴');
  assert.equal(res.iconType, 'thunder');
});

test('Unknown / invalid WMO codes fall back honestly to 天氣狀況唔詳', () => {
  const unknown1 = getWeatherCondition(999, 1);
  assert.equal(unknown1.label, '天氣狀況唔詳');
  assert.equal(unknown1.shortLabel, '唔詳');

  const unknown2 = getWeatherCondition(null, 1);
  assert.equal(unknown2.label, '天氣狀況唔詳');

  const unknown3 = getWeatherCondition(undefined, 1);
  assert.equal(unknown3.label, '天氣狀況唔詳');

  const unknown4 = getWeatherCondition('invalid', 1);
  assert.equal(unknown4.label, '天氣狀況唔詳');
});
