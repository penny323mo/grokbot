/**
 * Rain radar. RainViewer native tiles stop at zoom 7.
 * MapLibre must overzoom those tiles instead of requesting a higher z.
 */

import { parseRainViewerIndex } from '../../jyu-sai/js/rainviewer.js';

export const RAINVIEWER_NATIVE_MAX_ZOOM = 7;
export const RAINVIEWER_INDEX_URL = 'https://api.rainviewer.com/public/weather-maps.json';

export function radarSourceSpec(tileUrl) {
  return {
    type: 'raster',
    tiles: [tileUrl],
    tileSize: 256,
    maxzoom: RAINVIEWER_NATIVE_MAX_ZOOM
  };
}

export function presentRadar(index, retrievedAt = Date.now()) {
  const parsed = parseRainViewerIndex(index);
  if (!parsed.available) {
    return {
      available: false,
      official: false,
      retrievedAt,
      observedAt: null,
      message: '雷達暫時讀唔到。呢個唔係地球物理氣象局雷達。'
    };
  }
  const frame = parsed.latestPastFrame || parsed.frames[parsed.frames.length - 1];
  return {
    available: true,
    official: false,
    retrievedAt,
    generated: parsed.generated || null,
    observedAt: frame.time,
    timeStr: frame.timeStr,
    tileUrl: frame.tileUrl,
    source: radarSourceSpec(frame.tileUrl),
    nowcast: parsed.hasNowcast,
    message: parsed.hasNowcast
      ? `雷達圖 ${frame.timeStr}（澳門時間）。RainViewer，唔係官方觀測。`
      : `雷達圖 ${frame.timeStr}（澳門時間）。而家呢個來源未有未來預測。RainViewer，唔係官方觀測。`
  };
}

export async function loadRadar(fetchFn = fetch) {
  const retrievedAt = Date.now();
  const res = await fetchFn(RAINVIEWER_INDEX_URL);
  if (!res?.ok) return presentRadar(null, retrievedAt);
  return presentRadar(await res.json(), retrievedAt);
}
