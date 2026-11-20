/**
 * Nearby facilities from the 就近 OpenStreetMap extract.
 * Straight-line metres rank the list. They are not a walking time.
 */

import { haversineDistance } from '../../ce-lou/js/utils.js';
import { CATEGORIES, parseOverpassOrSnapshot } from '../../jauhgan/js/places.js';

export const NEARBY_URL = '../jauhgan/data/snapshot-macau.json';

export function describeFacilitySnapshot(raw, places = []) {
  const fileStamp = raw?.osm3s?.timestamp_osm_base || null;
  const fetchedAt = raw?.fetched_at || null;
  const clocksDistinct = Boolean(fileStamp && fetchedAt && fileStamp !== fetchedAt);
  const aedCount = places.filter((place) => place.category === 'aed').length;
  const lines = [
    clocksDistinct
      ? `檔案分開寫咗內容截止 ${fileStamp} 同下載時間 ${fetchedAt}。`
      : `檔案把內容截止同下載時間寫成同一個字串${fileStamp ? ` ${fileStamp}` : ''}。兩個時鐘分唔開，所以唔當已核對。`,
    '2026-11-11 審核記錄話 Geofabrik／OSM 內容截止係 2026-11-10 05:22（澳門時間）。呢個時間唔喺而家呢份 JSON，呢度冇再核實。',
    '元素冇最後修改時間。審核抽樣見過 2024、2025，亦有 2021 嘅修改。呢個唔代表資料錯，亦未做實地核對。',
    `呢份擷取有 ${aedCount} 個 AED，唔係完整官方名冊，亦唔係即時官方資料。`
  ];
  return {
    clocksDistinct,
    fileStamp,
    fetchedAt,
    contentCutoffVerified: null,
    auditCutoff: '2026-11-10 05:22 Asia/Macau',
    auditVerifiedFromFile: false,
    officialRegister: false,
    aedCount,
    lines
  };
}

export async function loadFacilities(fetchFn = fetch) {
  const res = await fetchFn(NEARBY_URL);
  if (!res?.ok) throw new Error('facilities');
  const raw = await res.json();
  const parsed = parseOverpassOrSnapshot(raw, true);
  const honesty = describeFacilitySnapshot(raw, parsed.places);
  return {
    places: parsed.places,
    sourceUrl: parsed.sourceUrl,
    honesty
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
