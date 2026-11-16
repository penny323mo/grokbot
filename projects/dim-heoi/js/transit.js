/**
 * 點去 (Dim Heoi) - Macau Transit (DSAT) Planning & Live Status
 * Asia/Macau timezone. Strictly authentic Cantonese copy.
 */

import { haversineDistance } from './utils.js';

/**
 * Load static DSAT snapshot data
 * @param {string} basePath
 * @param {Function} fetchFn
 * @returns {Promise<{routes: Object, stops: Object, meta: Object}>}
 */
export async function loadTransitData(basePath = '', fetchFn = null) {
  const customFetch = fetchFn || (async (url) => {
    if (typeof window === 'undefined') {
      // Running under Node.js: support relative path via fs
      const fs = await import('node:fs/promises');
      const pathMod = await import('node:path');
      const cleanPath = url.replace(/^\.\//, '');
      const fullPath = pathMod.resolve(process.cwd(), cleanPath);
      const text = await fs.readFile(fullPath, 'utf8');
      return {
        ok: true,
        json: async () => JSON.parse(text)
      };
    }
    return fetch(url);
  });

  const prefix = basePath ? (basePath.endsWith('/') ? basePath : basePath + '/') : '';
  const [routesResp, stopsResp, metaResp] = await Promise.all([
    customFetch(`${prefix}data/routes.json`),
    customFetch(`${prefix}data/stops.json`),
    customFetch(`${prefix}data/meta.json`).catch(() => null)
  ]);

  if (!routesResp || !routesResp.ok || !stopsResp || !stopsResp.ok) {
    throw new Error('未能載入巴士路線資料');
  }

  const routes = await routesResp.json();
  const stops = await stopsResp.json();
  let meta = null;
  if (metaResp && metaResp.ok) {
    try {
      meta = await metaResp.json();
    } catch {
      meta = null;
    }
  }

  return { routes, stops, meta };
}

/**
 * Find nearby stops to a coordinate
 * @param {number} lat
 * @param {number} lon
 * @param {Object} stopsData
 * @param {number} maxRadius - in meters (default 800)
 * @param {number} minCount - minimum stops to return if possible
 * @returns {Array<{code: string, stop: Object, distance: number}>}
 */
export function findNearbyStops(lat, lon, stopsData, maxRadius = 800, minCount = 5) {
  const all = [];
  for (const [code, stop] of Object.entries(stopsData)) {
    if (typeof stop.lat !== 'number' || typeof stop.lon !== 'number') continue;
    const distance = haversineDistance(lat, lon, stop.lat, stop.lon);
    all.push({ code, stop, distance });
  }

  all.sort((a, b) => a.distance - b.distance);

  // Take stops within maxRadius; if fewer than minCount, take at least minCount (up to 2000m)
  const withinRadius = all.filter((s) => s.distance <= maxRadius);
  if (withinRadius.length >= minCount) {
    return withinRadius;
  }
  return all.filter((s) => s.distance <= 2000).slice(0, Math.max(minCount, 10));
}

/**
 * Find candidate bus journeys between origin and destination
 * @param {{lat: number, lon: number}} origin
 * @param {{lat: number, lon: number}} destination
 * @param {{routes: Object, stops: Object}} transitData
 * @param {number} maxResults
 * @returns {Array<Object>}
 */
export function findBusJourneys(origin, destination, transitData, maxResults = 3) {
  const { routes, stops } = transitData;
  if (!routes || !stops) return [];

  const originStops = findNearbyStops(origin.lat, origin.lon, stops, 800, 6);
  const destStops = findNearbyStops(destination.lat, destination.lon, stops, 800, 6);

  const origMap = new Map();
  for (const s of originStops) {
    origMap.set(s.code, s.distance);
  }
  const destMap = new Map();
  for (const s of destStops) {
    destMap.set(s.code, s.distance);
  }

  const directCandidates = [];

  for (const [routeKey, route] of Object.entries(routes)) {
    const routeStops = route.stops || [];
    if (routeStops.length < 2) continue;

    // Find all matching boarding stops along route
    for (let i = 0; i < routeStops.length; i++) {
      const bCode = routeStops[i];
      if (!origMap.has(bCode)) continue;
      const bDist = origMap.get(bCode);

      // Find all matching alighting stops after boarding stop
      for (let j = i + 1; j < routeStops.length; j++) {
        const aCode = routeStops[j];
        if (!destMap.has(aCode)) continue;
        const aDist = destMap.get(aCode);

        const stopCount = j - i;
        const totalWalk = bDist + aDist;
        // Balance walking distance (effort) with stop count (time on bus)
        const score = totalWalk + stopCount * 120;

        const bStop = stops[bCode] || {};
        const aStop = stops[aCode] || {};

        const intermediateStops = routeStops.slice(i, j + 1).map((code) => {
          const s = stops[code] || {};
          return {
            code,
            name: s.name || code,
            lane: s.lane || '',
            metro: s.metro || '',
            lat: s.lat,
            lon: s.lon
          };
        });

        const hasMetro = bStop.metro === '1' || aStop.metro === '1';

        directCandidates.push({
          type: 'direct',
          routeKey,
          routeName: route.routeName,
          dir: route.dir,
          color: route.color || 'Orange',
          company: route.company || '',
          originTerminal: route.origin,
          destTerminal: route.destination,
          boardingStop: {
            code: bCode,
            name: bStop.name || bCode,
            lane: bStop.lane || '',
            metro: bStop.metro || '',
            lat: bStop.lat,
            lon: bStop.lon,
            distance: Math.round(bDist)
          },
          alightingStop: {
            code: aCode,
            name: aStop.name || aCode,
            lane: aStop.lane || '',
            metro: aStop.metro || '',
            lat: aStop.lat,
            lon: aStop.lon,
            distance: Math.round(aDist)
          },
          stopCount,
          totalWalkDistance: Math.round(totalWalk),
          score,
          hasMetro,
          stops: intermediateStops
        });
      }
    }
  }

  // Deduplicate direct candidates by routeKey (keep lowest score)
  const bestByRoute = new Map();
  for (const cand of directCandidates) {
    const key = cand.routeKey;
    if (!bestByRoute.has(key) || cand.score < bestByRoute.get(key).score) {
      bestByRoute.set(key, cand);
    }
  }

  const directResults = Array.from(bestByRoute.values()).sort((a, b) => a.score - b.score);

  if (directResults.length > 0) {
    return directResults.slice(0, maxResults);
  }

  // If no direct routes found, find 1-transfer journeys
  const transferCandidates = findTransferJourneys(
    originStops,
    destStops,
    routes,
    stops
  );
  return transferCandidates.slice(0, maxResults);
}

/**
 * Find 1-transfer bus journeys
 */
function findTransferJourneys(originStops, destStops, routes, stops) {
  const origStopSet = new Map(originStops.map((s) => [s.code, s.distance]));
  const destStopSet = new Map(destStops.map((s) => [s.code, s.distance]));

  // Routes passing origin stops
  const firstLegRoutes = [];
  // Routes passing dest stops
  const secondLegRoutes = [];

  for (const [rKey, route] of Object.entries(routes)) {
    const sCodes = route.stops || [];
    for (let i = 0; i < sCodes.length; i++) {
      if (origStopSet.has(sCodes[i])) {
        firstLegRoutes.push({ key: rKey, route, boardIdx: i, boardCode: sCodes[i] });
        break;
      }
    }
    for (let j = sCodes.length - 1; j >= 0; j--) {
      if (destStopSet.has(sCodes[j])) {
        secondLegRoutes.push({ key: rKey, route, alightIdx: j, alightCode: sCodes[j] });
        break;
      }
    }
  }

  const transfers = [];

  for (const leg1 of firstLegRoutes) {
    const leg1Stops = leg1.route.stops || [];
    for (let i = leg1.boardIdx + 1; i < leg1Stops.length; i++) {
      const xferCode = leg1Stops[i];
      const xferStop = stops[xferCode];
      if (!xferStop) continue;

      for (const leg2 of secondLegRoutes) {
        if (leg1.key === leg2.key) continue;
        const leg2Stops = leg2.route.stops || [];
        const xferIdx2 = leg2Stops.indexOf(xferCode);
        if (xferIdx2 !== -1 && xferIdx2 < leg2.alightIdx) {
          const bDist = origStopSet.get(leg1.boardCode) || 0;
          const aDist = destStopSet.get(leg2.alightCode) || 0;
          const count1 = i - leg1.boardIdx;
          const count2 = leg2.alightIdx - xferIdx2;
          const totalStops = count1 + count2;
          const totalWalk = bDist + aDist;
          const score = totalWalk + totalStops * 140 + 500; // penalty for transfer

          const bStop = stops[leg1.boardCode] || {};
          const aStop = stops[leg2.alightCode] || {};

          transfers.push({
            type: 'transfer',
            routeKey: `${leg1.key}+${leg2.key}`,
            leg1: {
              routeName: leg1.route.routeName,
              dir: leg1.route.dir,
              originTerminal: leg1.route.origin,
              destTerminal: leg1.route.destination,
              boardingStop: { code: leg1.boardCode, name: bStop.name || leg1.boardCode, distance: Math.round(bDist) },
              transferStop: { code: xferCode, name: xferStop.name || xferCode },
              stopCount: count1
            },
            leg2: {
              routeName: leg2.route.routeName,
              dir: leg2.route.dir,
              originTerminal: leg2.route.origin,
              destTerminal: leg2.route.destination,
              transferStop: { code: xferCode, name: xferStop.name || xferCode },
              alightingStop: { code: leg2.alightCode, name: aStop.name || leg2.alightCode, distance: Math.round(aDist) },
              stopCount: count2
            },
            stopCount: totalStops,
            totalWalkDistance: Math.round(totalWalk),
            score,
            hasMetro: bStop.metro === '1' || xferStop.metro === '1' || aStop.metro === '1'
          });
        }
      }
    }
  }

  transfers.sort((a, b) => a.score - b.score);
  return transfers;
}

/**
 * Fetch live bus positions from DSAT
 * @param {string} routeName
 * @param {string} dir
 * @param {Function} fetchFn
 * @returns {Promise<Object>}
 */
export async function fetchLiveBus(routeName, dir, fetchFn = fetch) {
  const url = `https://bis.dsat.gov.mo/macauweb/routestation/bus?routeName=${encodeURIComponent(routeName)}&dir=${encodeURIComponent(dir)}`;
  try {
    const resp = await fetchFn(url, {
      mode: 'cors',
      headers: {
        'Accept': 'application/json, text/plain, */*'
      }
    });
    if (!resp.ok) {
      return {
        ok: false,
        reason: 'http_error',
        status: resp.status,
        message: '即時巴士位置暫時未能喺瀏覽器讀到（受 DSAT 跨域限制），顯示班次為常規路線資料。'
      };
    }
    const json = await resp.json();
    return {
      ok: true,
      data: json
    };
  } catch (err) {
    return {
      ok: false,
      reason: 'network_or_cors',
      error: err && err.message ? err.message : String(err),
      message: '即時巴士位置暫時未能喺瀏覽器讀到（受 DSAT 跨域限制），顯示班次為常規路線資料。'
    };
  }
}

/**
 * Parse live bus positions relative to boarding stop
 * @param {Object} liveData - Response from bis.dsat.gov.mo
 * @param {Array<string>} routeStops - Ordered array of stop codes for this route
 * @param {string} boardingStopCode - Code of boarding stop
 * @param {Object} stopsData - Stops lookup
 * @returns {Object}
 */
export function parseLiveBusResponse(liveData, routeStops, boardingStopCode, stopsData = {}) {
  if (!liveData || !liveData.data || !Array.isArray(liveData.data.routeInfo)) {
    return {
      status: 'no_data',
      text: '暫未能取得即時班次資料'
    };
  }

  const liveRouteInfo = liveData.data.routeInfo;
  const boardingIdx = routeStops ? routeStops.indexOf(boardingStopCode) : -1;

  // Collect all buses across stops
  const buses = [];
  for (let i = 0; i < liveRouteInfo.length; i++) {
    const item = liveRouteInfo[i];
    const sCode = item.staCode;
    const busList = item.busInfo || [];
    if (busList.length > 0) {
      // Find corresponding index in our routeStops
      const rIdx = routeStops ? routeStops.indexOf(sCode) : i;
      const sName = (stopsData[sCode] && stopsData[sCode].name) ? stopsData[sCode].name : sCode;
      for (const b of busList) {
        buses.push({
          stopCode: sCode,
          stopName: sName,
          routeIndex: rIdx >= 0 ? rIdx : i,
          busPlate: b.busPlate || '',
          busCode: b.busCode || '',
          speed: b.speed || ''
        });
      }
    }
  }

  if (buses.length === 0) {
    return {
      status: 'no_bus',
      busCount: 0,
      text: '暫未有車輛行走此方向或總站未發車'
    };
  }

  if (boardingIdx === -1) {
    return {
      status: 'active_buses',
      busCount: buses.length,
      text: `本路線現有 ${buses.length} 班車行走中`
    };
  }

  // Look for buses at or upstream of boarding stop
  const upstreamBuses = buses.filter((b) => b.routeIndex <= boardingIdx);

  if (upstreamBuses.length > 0) {
    // Sort by routeIndex descending (closest to boardingIdx first)
    upstreamBuses.sort((a, b) => b.routeIndex - a.routeIndex);
    const closest = upstreamBuses[0];
    const diff = boardingIdx - closest.routeIndex;

    if (diff === 0) {
      return {
        status: 'arrived',
        busCount: buses.length,
        busPlate: closest.busPlate,
        stopName: closest.stopName,
        diff: 0,
        text: `班次已抵達／正停靠「${closest.stopName}」`
      };
    } else {
      return {
        status: 'approaching',
        busCount: buses.length,
        busPlate: closest.busPlate,
        stopName: closest.stopName,
        diff,
        text: `最近一班車喺「${closest.stopName}」附近（相距 ${diff} 個站）`
      };
    }
  }

  // All active buses have already passed the boarding stop
  return {
    status: 'past_boarding',
    busCount: buses.length,
    text: `本路線有 ${buses.length} 班車行走中（已過此站），等候總站下一班發車`
  };
}
