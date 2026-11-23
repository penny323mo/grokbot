/**
 * Terrain landmarks on the same flat map.
 * Elevations are OSM or DEM figures, not an official survey.
 * The 3D viewer is not used, and this file does not call a WebGL support helper.
 */

import { haversineDistance } from '../../ce-lou/js/utils.js';

export const LANDMARK_URL = '../dei-sai/data/landmarks.json';

export function presentLandmark(item) {
  const sourced = item?.ele_source && item.ele_source !== 'none';
  const hasHeight = sourced && typeof item.ele_m === 'number';
  return {
    id: item.id,
    name: item.name,
    kind: item.kind,
    area: item.area || '',
    lat: item.lat,
    lon: item.lon,
    eleSource: item.ele_source || 'none',
    heightText: hasHeight ? `${item.ele_m} 米（${item.ele_source}，唔係官方測量）` : '高度不詳',
    officialSurvey: false
  };
}

export function nearestLandmarks(items, origin, limit = 6) {
  return (items || [])
    .map((item) => ({
      ...presentLandmark(item),
      rankMetres: Math.round(haversineDistance(origin.lat, origin.lon, item.lat, item.lon))
    }))
    .sort((a, b) => a.rankMetres - b.rankMetres)
    .slice(0, limit);
}

export function terrainViewPlan(webglAvailable) {
  if (!webglAvailable) {
    return {
      mode: 'heights-only',
      pitch: 0,
      dem: false,
      message: '呢部機畫唔到 WebGL，所以冇傾斜。下面係地標高度。'
    };
  }
  return {
    mode: 'tilt',
    pitch: 50,
    bearing: -15,
    exaggeration: 1.3,
    dem: 'attempt',
    demTile: 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
    message: '傾斜用 WebGL。地形高程圖磚 2026-11-19 再探係 HTTP 200 但無 CORS，讀唔到就只係傾斜平面圖。高度係 OSM 或 DEM 標籤，唔係官方測量，亦唔保證無障礙。'
  };
}

export async function loadLandmarks(fetchFn = fetch) {
  const res = await fetchFn(LANDMARK_URL);
  if (!res?.ok) throw new Error('landmarks');
  const items = await res.json();
  return {
    items,
    retrievedAt: null,
    note: '地標高度來自 OpenStreetMap 標籤或者地形模型，擷取時寫入地勢項目。冇寫明係官方測繪，亦唔保證無障礙。'
  };
}
