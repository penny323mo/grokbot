/**
 * 出門 (Cheut Mun) - Slope-Aware Walking Router
 * Primary: FOSSGIS Valhalla Pedestrian (with elevation_interval=15)
 * Secondary: FOSSGIS Valhalla use_hills alternative
 * Fallback: FOSSGIS OSRM Foot + Valhalla /height
 */

import {
  isRealisticWalkingSpeed,
  formatMinutes,
  formatDistance,
  calculateClimbAndDescent,
  decodeValhallaShape,
  areMeaningfullyDifferent
} from './utils.js';

export const VALHALLA_ROUTE_URL = "https://valhalla1.openstreetmap.de/route";
export const VALHALLA_HEIGHT_URL = "https://valhalla1.openstreetmap.de/height";
export const OSRM_FOOT_BASE = "https://routing.openstreetmap.de/routed-foot/route/v1/foot";

// In-memory cache for computed A->B routes
const routeCache = new Map();

export function clearRouteCache() {
  routeCache.clear();
}

/**
 * Build OSRM Foot URL
 */
export function buildOsrmFootUrl(origin, dest) {
  return `${OSRM_FOOT_BASE}/${origin.lon},${origin.lat};${dest.lon},${dest.lat}?overview=full&geometries=geojson`;
}

/**
 * Parse a Valhalla route response into a slope-aware pedestrian route object.
 */
export function parseValhallaRouteResponse(json) {
  if (!json || !json.trip || !json.trip.summary || !Array.isArray(json.trip.legs) || json.trip.legs.length === 0) {
    return {
      ok: false,
      reason: 'no_route',
      message: '暫時未能計算步行路線'
    };
  }

  const summary = json.trip.summary;
  const leg = json.trip.legs[0];
  const durationSeconds = Number(summary.time);
  const distanceMeters = Number(summary.length) * 1000; // km to meters

  if (!isRealisticWalkingSpeed(distanceMeters, durationSeconds)) {
    const calculatedSpeed = Number(((distanceMeters / durationSeconds) * 3.6).toFixed(1));
    return {
      ok: false,
      reason: 'unrealistic_speed',
      speedKmh: calculatedSpeed,
      message: '步行路徑時速不合理（非行人速度），已拒絕測時'
    };
  }

  const speedKmh = Number(((distanceMeters / durationSeconds) * 3.6).toFixed(1));
  const elevationSamples = Array.isArray(leg.elevation) ? leg.elevation : [];
  const climbInfo = calculateClimbAndDescent(elevationSamples);

  // Count stairs maneuvers and collect named ramps
  let stairsCount = 0;
  const ramps = [];
  if (Array.isArray(leg.maneuvers)) {
    for (const m of leg.maneuvers) {
      const text = (m.instruction || '').toLowerCase();
      if (text.includes('stair') || text.includes('stairs') || text.includes('樓梯') || text.includes('梯級')) {
        stairsCount++;
      }
      if (m.instruction && (m.instruction.includes('斜坡') || m.instruction.includes('Rampa') || m.instruction.includes('Calçada'))) {
        ramps.push(m.instruction);
      }
    }
  }

  // Decode polyline 6 shape
  const coords = typeof leg.shape === 'string' ? decodeValhallaShape(leg.shape) : [];

  return {
    ok: true,
    provider: 'valhalla',
    distanceMeters: Math.round(distanceMeters),
    durationSeconds,
    durationMinutes: Math.round(durationSeconds / 60),
    speedKmh,
    climbMeters: climbInfo.climb,
    descentMeters: climbInfo.descent,
    minElevation: climbInfo.minElev,
    maxElevation: climbInfo.maxElev,
    startElevation: climbInfo.startElev,
    endElevation: climbInfo.endElev,
    elevationSamples,
    elevationInterval: 15,
    hasElevation: elevationSamples.length > 0,
    stairsCount,
    ramps,
    geometry: { type: 'LineString', coordinates: coords },
    shape: leg.shape || '',
    fetchedAt: Date.now(),
    sourceName: 'OpenStreetMap / FOSSGIS Valhalla 行人路徑（非官方測時）',
    sourceUrl: 'https://valhalla1.openstreetmap.de'
  };
}

/**
 * Parse OSRM foot response.
 */
export function parseOsrmFootResponse(json) {
  if (!json || json.code !== 'Ok' || !Array.isArray(json.routes) || json.routes.length === 0) {
    return {
      ok: false,
      reason: 'no_route',
      message: '暫時未能計算步行路線'
    };
  }

  const route = json.routes[0];
  const duration = Number(route.duration);
  const distance = Number(route.distance);

  if (!isRealisticWalkingSpeed(distance, duration)) {
    const calculatedSpeed = Number(((distance / duration) * 3.6).toFixed(1));
    return {
      ok: false,
      reason: 'unrealistic_speed',
      speedKmh: calculatedSpeed,
      message: '步行路徑時速不合理（非行人速度），已拒絕測時'
    };
  }

  const speedKmh = Number(((distance / duration) * 3.6).toFixed(1));

  return {
    ok: true,
    provider: 'osrm',
    distanceMeters: Math.round(distance),
    durationSeconds: duration,
    durationMinutes: Math.round(duration / 60),
    speedKmh,
    climbMeters: 0,
    descentMeters: 0,
    minElevation: 0,
    maxElevation: 0,
    startElevation: 0,
    endElevation: 0,
    elevationSamples: [],
    elevationInterval: 15,
    hasElevation: false,
    stairsCount: 0,
    ramps: [],
    geometry: route.geometry,
    shape: '',
    fetchedAt: Date.now(),
    sourceName: 'OpenStreetMap / FOSSGIS 行人路徑（非官方測時）',
    sourceUrl: 'https://routing.openstreetmap.de'
  };
}

/**
 * Sample elevation profile along coordinates using Valhalla /height
 */
export async function fetchValhallaHeightProfile(coordinates, fetchFn = fetch) {
  if (!Array.isArray(coordinates) || coordinates.length < 2) return null;

  const step = Math.max(1, Math.floor(coordinates.length / 50));
  const sampled = [];
  for (let i = 0; i < coordinates.length; i += step) {
    sampled.push({ lat: coordinates[i][1], lon: coordinates[i][0] });
  }
  const last = coordinates[coordinates.length - 1];
  sampled.push({ lat: last[1], lon: last[0] });

  try {
    const res = await fetchFn(VALHALLA_HEIGHT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        range: true,
        shape: sampled
      })
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (Array.isArray(json.range_height)) {
      const samples = json.range_height.map((pt) => Number(pt[1]));
      return samples;
    }
  } catch (e) {
    return null;
  }
  return null;
}

/**
 * Fetch Slope-Aware Walking Routes (Primary + Alternative)
 * @param {{lat: number, lon: number}} origin
 * @param {{lat: number, lon: number}} destination
 * @param {Function} fetchFn
 * @param {number} timeoutMs
 * @returns {Promise<Object>}
 */
export async function fetchSlopeWalkingRoutes(origin, destination, fetchFn = fetch, timeoutMs = 8000) {
  const doFetch = fetchFn || fetch;

  const cacheKey = `${Number(origin.lat).toFixed(5)},${Number(origin.lon).toFixed(5)}->${Number(destination.lat).toFixed(5)},${Number(destination.lon).toFixed(5)}`;
  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey);
  }

  const saveToCache = (plan) => {
    if (plan && plan.ok) {
      if (routeCache.size >= 50) {
        const first = routeCache.keys().next().value;
        routeCache.delete(first);
      }
      routeCache.set(cacheKey, plan);
    }
    return plan;
  };

  // 1. Try Primary Valhalla (Default Pedestrian with elevation_interval=15)
  const valhallaDefaultPromise = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await doFetch(VALHALLA_ROUTE_URL, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          locations: [
            { lat: Number(origin.lat), lon: Number(origin.lon) },
            { lat: Number(destination.lat), lon: Number(destination.lon) }
          ],
          costing: "pedestrian",
          units: "km",
          elevation_interval: 15
        })
      });
      clearTimeout(timer);
      if (res && res.ok) {
        const json = await res.json();
        return parseValhallaRouteResponse(json);
      }
    } catch (e) {
      clearTimeout(timer);
    }
    return null;
  })();

  // 2. Concurrently try Alternative Valhalla (use_hills=1)
  const valhallaAltPromise = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await doFetch(VALHALLA_ROUTE_URL, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          locations: [
            { lat: Number(origin.lat), lon: Number(origin.lon) },
            { lat: Number(destination.lat), lon: Number(destination.lon) }
          ],
          costing: "pedestrian",
          costing_options: {
            pedestrian: {
              use_hills: 1
            }
          },
          units: "km",
          elevation_interval: 15
        })
      });
      clearTimeout(timer);
      if (res && res.ok) {
        const json = await res.json();
        return parseValhallaRouteResponse(json);
      }
    } catch (e) {
      clearTimeout(timer);
    }
    return null;
  })();

  const [primaryRoute, altRoute] = await Promise.all([
    valhallaDefaultPromise,
    valhallaAltPromise
  ]);

  if (primaryRoute && primaryRoute.ok) {
    const hasMeaningfulAlt = altRoute && altRoute.ok && areMeaningfullyDifferent(primaryRoute, altRoute);

    if (hasMeaningfulAlt) {
      let flatterOption, shorterOption;

      if (primaryRoute.climbMeters <= altRoute.climbMeters) {
        flatterOption = { ...primaryRoute, tag: '較平', tagClass: 'gentler' };
        shorterOption = { ...altRoute, tag: '較短', tagClass: 'shorter' };
      } else {
        flatterOption = { ...altRoute, tag: '較平', tagClass: 'gentler' };
        shorterOption = { ...primaryRoute, tag: '較短', tagClass: 'shorter' };
      }

      return saveToCache({
        ok: true,
        hasAlternative: true,
        options: [flatterOption, shorterOption],
        primary: flatterOption,
        singlePathNote: null
      });
    }

    return saveToCache({
      ok: true,
      hasAlternative: false,
      options: [primaryRoute],
      primary: primaryRoute,
      singlePathNote: '去呢度主要得呢條行人路'
    });
  }

  // 3. Fallback: Try FOSSGIS OSRM foot
  const osrmUrl = buildOsrmFootUrl(origin, destination);
  const osrmController = new AbortController();
  const osrmTimer = setTimeout(() => osrmController.abort(), timeoutMs);

  try {
    const res = await doFetch(osrmUrl, {
      signal: osrmController.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(osrmTimer);
    if (res && res.ok) {
      const json = await res.json();
      const osrmParsed = parseOsrmFootResponse(json);
      if (osrmParsed.ok) {
        const heightSamples = await fetchValhallaHeightProfile(
          osrmParsed.geometry.coordinates,
          doFetch
        );
        if (heightSamples && heightSamples.length > 0) {
          const climbInfo = calculateClimbAndDescent(heightSamples);
          osrmParsed.elevationSamples = heightSamples;
          osrmParsed.hasElevation = true;
          osrmParsed.climbMeters = climbInfo.climb;
          osrmParsed.descentMeters = climbInfo.descent;
          osrmParsed.minElevation = climbInfo.minElev;
          osrmParsed.maxElevation = climbInfo.maxElev;
          osrmParsed.startElevation = climbInfo.startElev;
          osrmParsed.endElevation = climbInfo.endElev;
        } else {
          osrmParsed.hasElevation = false;
          osrmParsed.profileNote = '暫時未能讀到高度剖面';
        }

        return saveToCache({
          ok: true,
          hasAlternative: false,
          options: [osrmParsed],
          primary: osrmParsed,
          singlePathNote: '去呢度主要得呢條行人路'
        });
      }
    }
  } catch (e) {
    clearTimeout(osrmTimer);
  }

  // 4. Both routers failed
  return {
    ok: false,
    reason: 'router_failed',
    message: '暫時未能計算步行路線',
    options: []
  };
}
