/**
 * Nearby facilities from the 就近 OpenStreetMap extract.
 * Straight-line metres rank the list. They are not a walking time.
 */

import { haversineDistance } from '../../ce-lou/js/utils.js';
import { CATEGORIES, parseOverpassOrSnapshot } from '../../jauhgan/js/places.js';

export const NEARBY_URL = '../jauhgan/data/snapshot-macau.json';

export async function loadFacilities(fetchFn = fetch) {
  const res = await fetchFn(NEARBY_URL);
  if (!res?.ok) throw new Error('facilities');
  const raw = await res.json();
  const parsed = parseOverpassOrSnapshot(raw, true);
  return {
    places: parsed.places,
    contentTime: raw.osm3s?.timestamp_osm_base || null,
    retrievedAt: parsed.fetchedAt,
    sourceUrl: parsed.sourceUrl,
    completeness: '澳門 Geofabrik 擷取，唔係全港或全澳設施保證，可能有缺漏。'
  };
}

export function rankFacilities(places, origin, category = 'all', limit = 6) {
  const rows = (places || [])
    .filter((place) => category === 'all' || place.category === category)
    .map((place) => ({
      id: place.id,
      name: place.name,
      category: place.category,
      categoryLabel: place.categoryLabel || CATEGORIES[place.category]?.label || place.category,
      lat: place.lat,
      lon: place.lon,
      rankMetres: Math.round(haversineDistance(origin.lat, origin.lon, place.lat, place.lon)),
      walkMinutes: null,
      vacancy: null
    }));
  rows.sort((a, b) => a.rankMetres - b.rankMetres);
  return rows.slice(0, limit);
}

export const FACILITY_FILTERS = [
  { id: 'all', label: '全部' },
  { id: 'toilets', label: '公廁' },
  { id: 'drinking_water', label: '飲水' },
  { id: 'pharmacy', label: '藥房' },
  { id: 'aed', label: 'AED' },
  { id: 'clinic', label: '診所' },
  { id: 'parking', label: '停車場' }
];
