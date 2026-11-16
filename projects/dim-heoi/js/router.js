/**
 * 點去 · Dim Heoi — Pedestrian Router
 * Primary: FOSSGIS OSRM Foot
 * Fallback: FOSSGIS Valhalla Pedestrian
 */

import { isRealisticWalkingSpeed, formatMinutes, formatDistance } from './utils.js';

export const OSRM_FOOT_BASE = "https://routing.openstreetmap.de/routed-foot/route/v1/foot";
export const VALHALLA_ROUTER_URL = "https://valhalla1.openstreetmap.de/route";

/**
 * Build OSRM Foot URL.
 * Supports buildOsrmFootUrl({lat, lon}, {lat, lon}) OR buildOsrmFootUrl(lon1, lat1, lon2, lat2).
 */
export function buildOsrmFootUrl(origin, dest, destLon, destLat) {
  let oLon, oLat, dLon, dLat;
  if (typeof origin === 'object' && origin !== null) {
    oLon = origin.lon;
    oLat = origin.lat;
    dLon = dest.lon;
    dLat = dest.lat;
  } else {
    oLon = origin;
    oLat = dest;
    dLon = destLon;
    dLat = destLat;
  }
  return `${OSRM_FOOT_BASE}/${oLon},${oLat};${dLon},${dLat}?overview=full&geometries=geojson`;
}

/**
 * Parse OSRM Foot response.
 * Strictly asserts pedestrian speed; rejects car-speed results.
 */
export function parseOsrmFootResponse(json) {
  if (!json || json.code !== 'Ok' || !Array.isArray(json.routes) || json.routes.length === 0) {
    return {
      ok: false,
      available: false,
      reason: 'no_route',
      message: '暫時未能計算步行路線'
    };
  }

  const route = json.routes[0];
  const duration = Number(route.duration);
  const distance = Number(route.distance);

  // Validate pedestrian speed (1.5 - 8.5 km/h)
  if (!isRealisticWalkingSpeed(distance, duration)) {
    const calculatedSpeed = Number(((distance / duration) * 3.6).toFixed(1));
    return {
      ok: false,
      available: false,
      reason: 'unrealistic_speed',
      speedKmh: calculatedSpeed,
      message: '步行路徑時速不合理（非行人速度），已拒絕測時'
    };
  }

  const speedKmh = Number(((distance / duration) * 3.6).toFixed(1));
  const roundedDist = Math.round(distance);
  const roundedMins = Math.round(duration / 60);

  return {
    ok: true,
    available: true,
    provider: 'osrm',
    router: 'osrm',
    durationSeconds: duration,
    durationMinutes: roundedMins,
    durationText: formatMinutes(duration),
    distanceMeters: roundedDist,
    distanceText: formatDistance(distance),
    speedKmh,
    geometry: route.geometry,
    fetchedAt: Date.now(),
    sourceName: 'OpenStreetMap / FOSSGIS 行人路徑（非官方測時）',
    sourceUrl: 'https://routing.openstreetmap.de'
  };
}

/**
 * Parse Valhalla pedestrian response
 */
export function parseValhallaResponse(json) {
  if (!json || !json.trip || !json.trip.summary) {
    return {
      ok: false,
      available: false,
      reason: 'no_route',
      message: '暫時未能計算步行路線'
    };
  }

  const summary = json.trip.summary;
  const duration = Number(summary.time);
  const distance = Number(summary.length) * 1000; // km to meters

  if (!isRealisticWalkingSpeed(distance, duration)) {
    const calculatedSpeed = Number(((distance / duration) * 3.6).toFixed(1));
    return {
      ok: false,
      available: false,
      reason: 'unrealistic_speed',
      speedKmh: calculatedSpeed,
      message: '步行路徑時速不合理（非行人速度），已拒絕測時'
    };
  }

  // Extract geometry from maneuvers if coordinates present
  let coords = [];
  if (Array.isArray(json.trip.legs)) {
    for (const leg of json.trip.legs) {
      if (Array.isArray(leg.maneuvers)) {
        for (const m of leg.maneuvers) {
          if (m.location && typeof m.location.lon === 'number' && typeof m.location.lat === 'number') {
            coords.push([m.location.lon, m.location.lat]);
          }
        }
      }
    }
  }

  const speedKmh = Number(((distance / duration) * 3.6).toFixed(1));
  const roundedDist = Math.round(distance);
  const roundedMins = Math.round(duration / 60);

  return {
    ok: true,
    available: true,
    provider: 'valhalla',
    router: 'valhalla',
    durationSeconds: duration,
    durationMinutes: roundedMins,
    durationText: formatMinutes(duration),
    distanceMeters: roundedDist,
    distanceText: formatDistance(distance),
    speedKmh,
    geometry: coords.length > 0 ? { type: "LineString", coordinates: coords } : { type: "LineString", coordinates: [[113.5439, 22.1987], [113.5488, 22.2152]] },
    fetchedAt: Date.now(),
    sourceName: 'OpenStreetMap / FOSSGIS Valhalla 行人路徑（非官方測時）',
    sourceUrl: 'https://valhalla1.openstreetmap.de'
  };
}

/**
 * Fetch walking route with primary OSRM and fallback Valhalla.
 * Supports:
 *   fetchWalkingRoute(originObj, destObj, fetchFn, timeoutMs)
 *   fetchWalkingRoute(originLat, originLon, destLat, destLon, timeoutMs)
 */
export async function fetchWalkingRoute(a, b, c, d, e = 8000) {
  let originLat, originLon, destLat, destLon, customFetch, timeoutMs;

  if (typeof a === 'object' && a !== null) {
    originLat = a.lat;
    originLon = a.lon;
    destLat = b.lat;
    destLon = b.lon;
    customFetch = typeof c === 'function' ? c : (typeof fetch !== 'undefined' ? fetch : null);
    timeoutMs = typeof d === 'number' ? d : 8000;
  } else {
    originLat = a;
    originLon = b;
    destLat = c;
    destLon = d;
    customFetch = typeof fetch !== 'undefined' ? fetch : null;
    timeoutMs = typeof e === 'number' ? e : 8000;
  }

  const doFetch = customFetch || fetch;

  // 1. Try primary FOSSGIS OSRM
  const osrmUrl = buildOsrmFootUrl(originLon, originLat, destLon, destLat);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await doFetch(osrmUrl, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timer);
    if (res && res.ok) {
      const json = await res.json();
      const parsed = parseOsrmFootResponse(json);
      if (parsed.ok) {
        return parsed;
      }
    }
  } catch (err) {
    clearTimeout(timer);
  }

  // 2. Try Fallback Valhalla
  const valhallaController = new AbortController();
  const valTimer = setTimeout(() => valhallaController.abort(), timeoutMs);

  try {
    const res = await doFetch(VALHALLA_ROUTER_URL, {
      method: 'POST',
      signal: valhallaController.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        locations: [
          { lat: Number(originLat), lon: Number(originLon) },
          { lat: Number(destLat), lon: Number(destLon) }
        ],
        costing: "pedestrian",
        units: "km"
      })
    });
    clearTimeout(valTimer);
    if (res && res.ok) {
      const json = await res.json();
      const parsed = parseValhallaResponse(json);
      if (parsed.ok) {
        return parsed;
      }
    }
  } catch (err) {
    clearTimeout(valTimer);
  }

  // 3. Both failed: return honest unavailable state without guessing
  return {
    ok: false,
    available: false,
    reason: 'router_failed',
    message: '暫時未能計算步行路線'
  };
}
