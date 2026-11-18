/**
 * 出門 (Cheut Mun) - Official DSAT Bus Network Planner & Live Enquiry
 * Uses bundled official DSAT snapshot and attempts live in-browser queries (CORS-safe).
 * Zero invented minutes, zero invented ETAs.
 */

import { haversineDistance, formatMinutes, formatDistance, formatMacauTime } from './utils.js';

export const DSAT_LIVE_BUS_URL = "https://bis.dsat.gov.mo/macauweb/routestation/bus";

let busDataCache = null;

/**
 * Load bundled DSAT routes, stops and metadata
 */
export async function loadBusData(fetchFn = fetch) {
  if (busDataCache) return busDataCache;

  try {
    const [routesRes, stopsRes, metaRes] = await Promise.all([
      fetchFn('data/routes.json'),
      fetchFn('data/stops.json'),
      fetchFn('data/meta.json')
    ]);

    const routes = await routesRes.json();
    const stops = await stopsRes.json();
    const meta = await metaRes.json();

    busDataCache = { routes, stops, meta };
    return busDataCache;
  } catch (err) {
    return { routes: {}, stops: {}, meta: null, error: err.message };
  }
}

/**
 * Find stops near a coordinate, ranked by straight-line distance.
 * Note: Straight-line distance is strictly used to select/rank candidate stops.
 */
export function findNearbyStops(lat, lon, stopsObj, maxDistMeters = 650) {
  const candidates = [];
  for (const [code, stop] of Object.entries(stopsObj)) {
    if (stop.lat == null || stop.lon == null) continue;
    const dist = haversineDistance(lat, lon, stop.lat, stop.lon);
    if (dist <= maxDistMeters) {
      candidates.push({
        code,
        name: stop.name,
        name_pt: stop.name_pt || '',
        lat: stop.lat,
        lon: stop.lon,
        crowFliesDistMeters: Math.round(dist)
      });
    }
  }
  return candidates.sort((a, b) => a.crowFliesDistMeters - b.crowFliesDistMeters);
}

/**
 * Find direct and 1-transfer bus options from origin to destination
 */
export function searchBusRoutes(origin, destination, routesObj, stopsObj, maxCandidates = 8) {
  const originStops = findNearbyStops(origin.lat, origin.lon, stopsObj, 650);
  const destStops = findNearbyStops(destination.lat, destination.lon, stopsObj, 650);

  if (originStops.length === 0 || destStops.length === 0) {
    return {
      direct: [],
      transfers: [],
      originStopsCount: originStops.length,
      destStopsCount: destStops.length
    };
  }

  const oStopMap = new Map(originStops.map(s => [s.code, s]));
  const dStopMap = new Map(destStops.map(s => [s.code, s]));

  const direct = [];
  const routeList = Object.values(routesObj);

  for (const r of routeList) {
    const stopsSeq = r.stops || [];
    let boardIdx = -1;
    let alightIdx = -1;

    for (let i = 0; i < stopsSeq.length; i++) {
      const code = stopsSeq[i];
      if (boardIdx === -1 && oStopMap.has(code)) {
        boardIdx = i;
      }
      if (boardIdx !== -1 && dStopMap.has(code)) {
        alightIdx = i;
        break;
      }
    }

    if (boardIdx !== -1 && alightIdx !== -1 && alightIdx > boardIdx) {
      const boardCode = stopsSeq[boardIdx];
      const alightCode = stopsSeq[alightIdx];
      const interStops = stopsSeq.slice(boardIdx + 1, alightIdx);
      const intermediateNames = interStops.map(c => stopsObj[c]?.name || c);

      const oStop = oStopMap.get(boardCode);
      const dStop = dStopMap.get(alightCode);

      const stopCoords = [
        [oStop.lon, oStop.lat],
        ...interStops.map(c => stopsObj[c] && stopsObj[c].lon != null ? [stopsObj[c].lon, stopsObj[c].lat] : null).filter(Boolean),
        [dStop.lon, dStop.lat]
      ];

      direct.push({
        isDirect: true,
        routeName: r.routeName,
        dir: r.dir,
        color: r.color || '#2143A8',
        originTerminal: r.origin,
        destTerminal: r.destination,
        boardingStop: {
          code: boardCode,
          name: stopsObj[boardCode]?.name || boardCode,
          lat: oStop.lat,
          lon: oStop.lon,
          accessDistanceM: oStop.crowFliesDistMeters,
          hasMetro: stopsObj[boardCode]?.metro === '1' || stopsObj[boardCode]?.metro === 1
        },
        alightingStop: {
          code: alightCode,
          name: stopsObj[alightCode]?.name || alightCode,
          lat: dStop.lat,
          lon: dStop.lon,
          egressDistanceM: dStop.crowFliesDistMeters,
          hasMetro: stopsObj[alightCode]?.metro === '1' || stopsObj[alightCode]?.metro === 1
        },
        stopsCount: alightIdx - boardIdx,
        intermediateNames,
        intermediateCodes: interStops,
        geometry: { type: 'LineString', coordinates: stopCoords },
        totalWalkApproxM: oStop.crowFliesDistMeters + dStop.crowFliesDistMeters
      });
    }
  }

  // Sort direct by total walking distance + stops count
  direct.sort((a, b) => {
    return (a.totalWalkApproxM * 1.5 + a.stopsCount * 50) - (b.totalWalkApproxM * 1.5 + b.stopsCount * 50);
  });

  // If no direct routes, search for 1-transfer routes (SPEC line 117)
  const transfers = [];
  if (direct.length === 0) {
    const reachableFromOrigin = new Map();
    for (const r of routeList) {
      const stopsSeq = r.stops || [];
      let boardIdx = -1;
      for (let i = 0; i < stopsSeq.length; i++) {
        const code = stopsSeq[i];
        if (boardIdx === -1 && oStopMap.has(code)) {
          boardIdx = i;
          continue;
        }
        if (boardIdx !== -1 && i > boardIdx) {
          if (!reachableFromOrigin.has(code)) {
            reachableFromOrigin.set(code, []);
          }
          reachableFromOrigin.get(code).push({
            routeA: r,
            boardCode: stopsSeq[boardIdx],
            transferCode: code,
            stopsCountA: i - boardIdx
          });
        }
      }
    }

    for (const r of routeList) {
      const stopsSeq = r.stops || [];
      for (let i = 0; i < stopsSeq.length; i++) {
        const transferCode = stopsSeq[i];
        if (reachableFromOrigin.has(transferCode)) {
          for (let j = i + 1; j < stopsSeq.length; j++) {
            const alightCode = stopsSeq[j];
            if (dStopMap.has(alightCode)) {
              const leg1Candidates = reachableFromOrigin.get(transferCode);
              for (const leg1 of leg1Candidates) {
                if (leg1.routeA.routeName !== r.routeName) {
                  const oStop = oStopMap.get(leg1.boardCode);
                  const dStop = dStopMap.get(alightCode);
                  const tStop = stopsObj[transferCode];

                  const stopCoords = [
                    [oStop.lon, oStop.lat],
                    ...(tStop && tStop.lon ? [[tStop.lon, tStop.lat]] : []),
                    [dStop.lon, dStop.lat]
                  ];

                  transfers.push({
                    isDirect: false,
                    isTransfer: true,
                    routeName: `${leg1.routeA.routeName} ➔ ${r.routeName}`,
                    routeA: leg1.routeA.routeName,
                    dirA: leg1.routeA.dir,
                    routeB: r.routeName,
                    dirB: r.dir,
                    boardingStop: {
                      code: leg1.boardCode,
                      name: oStop.name,
                      lat: oStop.lat,
                      lon: oStop.lon,
                      accessDistanceM: oStop.crowFliesDistMeters,
                      hasMetro: stopsObj[leg1.boardCode]?.metro === '1' || stopsObj[leg1.boardCode]?.metro === 1
                    },
                    transferStop: {
                      code: transferCode,
                      name: tStop ? tStop.name : transferCode,
                      lat: tStop ? tStop.lat : null,
                      lon: tStop ? tStop.lon : null,
                      hasMetro: tStop?.metro === '1' || tStop?.metro === 1
                    },
                    alightingStop: {
                      code: alightCode,
                      name: dStop.name,
                      lat: dStop.lat,
                      lon: dStop.lon,
                      egressDistanceM: dStop.crowFliesDistMeters,
                      hasMetro: stopsObj[alightCode]?.metro === '1' || stopsObj[alightCode]?.metro === 1
                    },
                    stopsCount: leg1.stopsCountA + (j - i),
                    geometry: { type: 'LineString', coordinates: stopCoords },
                    totalWalkApproxM: oStop.crowFliesDistMeters + dStop.crowFliesDistMeters
                  });
                  break;
                }
              }
            }
          }
        }
      }
    }

    transfers.sort((a, b) => (a.totalWalkApproxM * 1.5 + a.stopsCount * 50) - (b.totalWalkApproxM * 1.5 + b.stopsCount * 50));
  }

  return {
    direct: direct.slice(0, maxCandidates),
    transfers: transfers.slice(0, maxCandidates)
  };
}

/**
 * Fetch live bus positions for a specific route (CORS-safe with honest fallback)
 */
export async function fetchLiveBusPositions(routeName, dir = "0", fetchFn = fetch, timeoutMs = 4000) {
  const url = `${DSAT_LIVE_BUS_URL}?routeName=${encodeURIComponent(routeName)}&dir=${encodeURIComponent(dir)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetchFn(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timer);

    if (!res || !res.ok) {
      return {
        available: false,
        message: '即時巴士位置暫時未能喺瀏覽器讀到（預期限制）'
      };
    }

    const json = await res.json();
    return parseLiveBusResponse(json);
  } catch (err) {
    clearTimeout(timer);
    return {
      available: false,
      message: '即時巴士位置暫時未能喺瀏覽器讀到（預期限制）'
    };
  }
}

/**
 * Parse DSAT routestation/bus response
 */
export function parseLiveBusResponse(json) {
  if (!json || !json.data || !Array.isArray(json.data.routeInfo)) {
    return {
      available: false,
      message: '即時巴士位置暫時未能喺瀏覽器讀到'
    };
  }

  const routeInfo = json.data.routeInfo;
  const activeBuses = [];

  for (const station of routeInfo) {
    if (Array.isArray(station.busInfo) && station.busInfo.length > 0) {
      for (const b of station.busInfo) {
        activeBuses.push({
          staCode: station.staCode,
          busPlate: b.busPlate || '',
          busCode: b.busCode || '',
          speed: b.speed ? Number(b.speed) : null
        });
      }
    }
  }

  return {
    available: true,
    activeBuses,
    count: activeBuses.length,
    message: activeBuses.length > 0
      ? `現時路線上有 ${activeBuses.length} 班車運作中`
      : '現時此路線暫未有在途巴士資訊',
    fetchedAt: Date.now()
  };
}
