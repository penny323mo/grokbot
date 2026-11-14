/**
 * 雨勢 · Jyu Sai — RainViewer Radar Service
 */

import { formatMacauTime, checkFrameFreshness } from './utils.js';

export const RAINVIEWER_INDEX_URL = 'https://api.rainviewer.com/public/weather-maps.json';

/**
 * Build the tile URL template according to RainViewer specification.
 * Scheme 2 = Universal Blue (stepped slate-rain scale).
 */
export function buildTileUrl(host, path, colorScheme = 2, smooth = 1, snow = 1) {
  if (!host || !path) return null;
  const cleanHost = host.replace(/\/+$/, '');
  return `${cleanHost}${path}/256/{z}/{x}/{y}/${colorScheme}/${smooth}_${snow}.png`;
}

/**
 * Parse the RainViewer weather-maps.json payload.
 */
export function parseRainViewerIndex(json, nowUnixTime = Math.floor(Date.now() / 1000)) {
  if (!json || typeof json !== 'object' || !json.radar) {
    return {
      available: false,
      reason: 'invalid_payload',
      frames: [],
      pastFrames: [],
      nowcastFrames: [],
      hasNowcast: false,
      latestTime: null,
      message: '雷達資料格式未能識別'
    };
  }

  const host = json.host || 'https://tilecache.rainviewer.com';
  const pastList = Array.isArray(json.radar.past) ? json.radar.past : [];
  const nowcastList = Array.isArray(json.radar.nowcast) ? json.radar.nowcast : [];

  const pastFrames = pastList.map(item => {
    const freshness = checkFrameFreshness(item.time, nowUnixTime);
    return {
      time: item.time,
      path: item.path,
      tileUrl: buildTileUrl(host, item.path),
      isNowcast: false,
      timeStr: formatMacauTime(item.time, 'time'),
      isStale: freshness.isStale,
      ageMinutes: freshness.ageMinutes
    };
  });

  const nowcastFrames = nowcastList.map(item => ({
    time: item.time,
    path: item.path,
    tileUrl: buildTileUrl(host, item.path),
    isNowcast: true,
    timeStr: formatMacauTime(item.time, 'time'),
    isStale: false,
    ageMinutes: 0
  }));

  const allFrames = [...pastFrames, ...nowcastFrames];
  const latestPast = pastFrames.length > 0 ? pastFrames[pastFrames.length - 1] : null;

  return {
    available: allFrames.length > 0,
    host,
    generated: json.generated,
    frames: allFrames,
    pastFrames,
    nowcastFrames,
    hasNowcast: nowcastFrames.length > 0,
    latestPastFrame: latestPast,
    nowcastMessage: nowcastFrames.length === 0 ? "呢個來源暫時未有未來雨勢預測" : null
  };
}

/**
 * Fetch RainViewer index with timeout.
 */
export async function fetchRainViewerData(timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(RAINVIEWER_INDEX_URL, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timer);
    if (!res.ok) {
      return { available: false, reason: `http_${res.status}`, frames: [] };
    }
    const json = await res.json();
    return parseRainViewerIndex(json);
  } catch (err) {
    clearTimeout(timer);
    return {
      available: false,
      reason: err.name === 'AbortError' ? 'timeout' : 'network_error',
      frames: [],
      message: '未能載入雷達圖層'
    };
  }
}

/**
 * Sample RainViewer tile to detect whether there is radar return near Macau coordinate.
 */
export async function sampleRadarReturn(tileUrl, lat = 22.1987, lon = 113.5439, timeoutMs = 1800) {
  if (!tileUrl || typeof Image === 'undefined') return false;

  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), timeoutMs);

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        clearTimeout(timer);
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 256;
          canvas.height = 256;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(false);
            return;
          }
          ctx.drawImage(img, 0, 0);

          // Web Mercator calculation for zoom 8
          const n = 256;
          const latRad = (lat * Math.PI) / 180;
          const xExact = ((lon + 180) / 360) * n;
          const yExact = ((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * n;
          const xTile = Math.floor(xExact);
          const yTile = Math.floor(yExact);
          const px = Math.floor((xExact - xTile) * 256);
          const py = Math.floor((yExact - yTile) * 256);

          const startX = Math.max(0, px - 3);
          const startY = Math.max(0, py - 3);
          const width = Math.min(256 - startX, 7);
          const height = Math.min(256 - startY, 7);

          const imgData = ctx.getImageData(startX, startY, width, height);
          for (let i = 3; i < imgData.data.length; i += 4) {
            if (imgData.data[i] > 15) {
              resolve(true);
              return;
            }
          }
          resolve(false);
        } catch (e) {
          resolve(false);
        }
      };
      img.onerror = () => {
        clearTimeout(timer);
        resolve(false);
      };

      // In RainViewer, tile at z=8 for Macau is x=208, y=111
      const sampleUrl = tileUrl.replace('{z}', '8').replace('{x}', '208').replace('{y}', '111');
      img.src = sampleUrl;
    } catch (e) {
      clearTimeout(timer);
      resolve(false);
    }
  });
}
