/**
 * Park near the destination, then walk.
 * Names that are only 「停車場」 stay unnamed. Vacancy is not invented.
 */

import { haversineDistance } from '../../ce-lou/js/utils.js';

export const CARPARK_URL = '../cheut-mun/data/carparks.json';
export const CARPARK_META_URL = '../cheut-mun/data/meta.json';

const GENERIC_NAMES = new Set(['停車場', 'parking', '未命名', 'unnamed', '']);

export function parkDisplayName(park) {
  const zh = String(park?.nameZh || '').trim();
  const name = String(park?.name || '').trim();
  const candidate = zh || name;
  if (GENERIC_NAMES.has(candidate) || GENERIC_NAMES.has(candidate.toLowerCase())) {
    return '未命名停車場';
  }
  return candidate;
}

export function rankParks(parks, destination, limit = 4) {
  return (parks || [])
    .filter((park) => Number.isFinite(park.lat) && Number.isFinite(park.lon))
    .map((park) => ({
      id: park.id,
      name: parkDisplayName(park),
      lat: park.lat,
      lon: park.lon,
      rankMetres: Math.round(haversineDistance(destination.lat, destination.lon, park.lat, park.lon)),
      walkMinutes: null,
      vacancy: null
    }))
    .sort((a, b) => a.rankMetres - b.rankMetres)
    .slice(0, limit);
}

export async function loadParks(fetchFn = fetch) {
  const [parksRes, metaRes] = await Promise.all([
    fetchFn(CARPARK_URL),
    fetchFn(CARPARK_META_URL)
  ]);
  if (!parksRes?.ok) throw new Error('parks');
  const parks = await parksRes.json();
  let meta = null;
  if (metaRes?.ok) meta = await metaRes.json();
  return {
    parks,
    retrievedAt: meta?.carparks?.fetchedAt || null,
    sourceUrl: meta?.carparks?.sourceUrl || 'https://www.openstreetmap.org/copyright',
    count: meta?.carparks?.carparksCount || parks.length
  };
}
