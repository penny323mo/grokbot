/**
 * 出門 (Cheut Mun) - Car Park Near Destination & Park-Then-Walk Service
 * Finds real OSM car parks near destination and computes router walk from park to destination.
 * Live vacancy is keyed and out of scope — honest disclaimer displayed.
 */

import { haversineDistance, formatMinutes, formatDistance, formatElevation } from './utils.js';

let carparksCache = null;

/**
 * Load bundled OSM car parks
 */
export async function loadCarParks(fetchFn = fetch) {
  if (carparksCache) return carparksCache;

  try {
    const res = await fetchFn('data/carparks.json');
    if (!res.ok) return [];
    carparksCache = await res.json();
    return carparksCache;
  } catch (err) {
    return [];
  }
}

/**
 * Find candidate car parks near destination within maxDistanceM
 */
export function findNearbyCarParks(destination, carparksList, maxDistanceM = 1000, limit = 4) {
  if (!Array.isArray(carparksList) || carparksList.length === 0) return [];

  const candidates = [];
  for (const cp of carparksList) {
    if (cp.lat == null || cp.lon == null) continue;
    const dist = haversineDistance(destination.lat, destination.lon, cp.lat, cp.lon);
    if (dist <= maxDistanceM) {
      candidates.push({
        ...cp,
        crowFliesDistM: Math.round(dist)
      });
    }
  }

  candidates.sort((a, b) => a.crowFliesDistM - b.crowFliesDistM);
  return candidates.slice(0, limit);
}

/**
 * Plan Park-then-Walk options:
 * Computes pedestrian router walks from top nearby car parks to the destination.
 */
export async function planParkThenWalk(destination, carparksList, fetchSlopeWalkFn) {
  const candidates = findNearbyCarParks(destination, carparksList, 1000, 3);

  if (candidates.length === 0) {
    return {
      ok: false,
      parks: [],
      reason: 'no_parks_nearby',
      message: '目的地附近暫未找到合適的停車場'
    };
  }

  const parkOptions = [];

  for (const park of candidates) {
    try {
      const walkResult = await fetchSlopeWalkFn(
        { lat: park.lat, lon: park.lon, name: park.name },
        destination
      );

      if (walkResult && walkResult.ok && walkResult.primary) {
        const route = walkResult.primary;
        parkOptions.push({
          parkId: park.id,
          name: park.name,
          namePt: park.namePt || '',
          lat: park.lat,
          lon: park.lon,
          parkingType: park.parkingType,
          access: park.access,
          fee: park.fee,
          walkMinutes: route.durationMinutes,
          walkSeconds: route.durationSeconds,
          walkDistanceM: route.distanceMeters,
          climbMeters: route.climbMeters,
          stairsCount: route.stairsCount,
          geometry: route.geometry,
          elevationSamples: route.elevationSamples || []
        });
      }
    } catch (e) {
      // If router fails for one park, proceed to next
    }
  }

  if (parkOptions.length === 0) {
    return {
      ok: false,
      parks: [],
      reason: 'walk_failed',
      message: '暫時未能計算由周邊停車場到目的地的步行路線'
    };
  }

  // Sort by real walking minutes, then distance
  parkOptions.sort((a, b) => a.walkSeconds - b.walkSeconds || a.walkDistanceM - b.walkDistanceM);

  return {
    ok: true,
    parks: parkOptions,
    selectedPark: parkOptions[0],
    vacancyDisclaimer: '澳門即時車位（交通事務局）暫時未能喺無密鑰情況下讀到',
    sourceName: 'OpenStreetMap (ODbL) 停車場資料',
    sourceUrl: 'https://www.openstreetmap.org/copyright'
  };
}
