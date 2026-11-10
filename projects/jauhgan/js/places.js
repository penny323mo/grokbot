/**
 * places.js - Overpass & snapshot parser, category filtering, place details
 * Nightly 2026-11-11 · 就近 (Just Around)
 */

import { haversineDistance, calculateWalkMinutes, formatDistance, formatWalkMinutes, isMacau } from './geo.js';

export const CATEGORIES = Object.freeze({
  all: { id: 'all', label: '全部', icon: 'all' },
  toilets: { id: 'toilets', label: '公廁', icon: 'toilets' },
  parking: { id: 'parking', label: '停車場', icon: 'parking' },
  drinking_water: { id: 'drinking_water', label: '飲水', icon: 'drinking_water' },
  pharmacy: { id: 'pharmacy', label: '藥房', icon: 'pharmacy' },
  aed: { id: 'aed', label: 'AED', icon: 'aed' },
  clinic: { id: 'clinic', label: '診所', icon: 'clinic' }
});

export const CATEGORY_KEYS = Object.keys(CATEGORIES);

/**
 * Maps OSM tags to one of the 6 canonical categories.
 * @param {object} tags
 * @returns {string|null}
 */
export function matchCategory(tags) {
  if (!tags || typeof tags !== 'object') return null;
  const a = tags.amenity;
  const e = tags.emergency;

  if (a === 'toilets') return 'toilets';
  if (a === 'parking' || a === 'parking_entrance') return 'parking';
  if (a === 'drinking_water') return 'drinking_water';
  if (a === 'pharmacy') return 'pharmacy';
  if (a === 'defibrillator' || e === 'defibrillator') return 'aed';
  if (a === 'clinic' || a === 'hospital' || a === 'doctors') return 'clinic';

  return null;
}

/**
 * Resolves natural Cantonese name for a place, with sensible fallbacks.
 * @param {object} tags
 * @param {string} category
 * @returns {string}
 */
export function resolvePlaceName(tags, category) {
  tags = tags || {};
  const cand =
    tags['name:zh-Hant'] ||
    tags['name:zh'] ||
    tags['name:zh_TW'] ||
    tags['name:zh-HK'] ||
    tags['name'] ||
    tags['name:en'] ||
    '';

  const trimmed = cand.trim();
  if (trimmed) return trimmed;

  switch (category) {
    case 'toilets':
      return '公廁';
    case 'parking':
      return tags.amenity === 'parking_entrance' ? '停車場入口' : '停車場';
    case 'drinking_water':
      return '飲水機';
    case 'pharmacy':
      return '藥房';
    case 'aed':
      return '自動體外心臟除顫器 (AED)';
    case 'clinic':
      return tags.amenity === 'hospital' ? '醫院' : '診所';
    default:
      return '未命名設施';
  }
}

/**
 * Parses Overpass response or snapshot JSON into a normalized array of place objects.
 * Rejects empty or invalid production snapshots (must include fetched_at and source_url).
 * 
 * @param {object} raw
 * @param {boolean} [isSnapshot=false]
 * @returns {{ places: Array, fetchedAt: string|null, sourceUrl: string|null, isLive: boolean }}
 */
export function parseOverpassOrSnapshot(raw, isSnapshot = false) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('無效嘅數據結構（Invalid data structure）');
  }

  // Snapshot verification: must have fetched_at and source_url
  if (isSnapshot || raw.fetched_at || raw.source_url) {
    if (!raw.fetched_at || typeof raw.fetched_at !== 'string' || !raw.fetched_at.trim()) {
      throw new Error('快照缺乏有效的截取時間戳（Snapshot missing fetched_at timestamp）');
    }
    if (!raw.source_url || typeof raw.source_url !== 'string' || !raw.source_url.trim()) {
      throw new Error('快照缺乏來源網址（Snapshot missing source_url）');
    }
  }

  const elements = Array.isArray(raw.elements) ? raw.elements : [];
  if (elements.length === 0) {
    if (isSnapshot) {
      throw new Error('快照不能為空（Snapshot contains no elements）');
    }
    return {
      places: [],
      fetchedAt: raw.fetched_at || raw.osm3s?.timestamp_osm_base || null,
      sourceUrl: raw.source_url || 'https://overpass-api.de/api/interpreter',
      isLive: !isSnapshot && !raw.fetched_at
    };
  }

  const places = [];

  for (const el of elements) {
    if (!el || typeof el !== 'object') continue;

    // Check for synthetic / fake placeholder test marks
    if (el.is_synthetic === true || el.synthetic === true) {
      continue;
    }

    const tags = el.tags || {};
    const category = matchCategory(tags);
    if (!category) continue;

    // Coordinates: direct or via center
    let lat = el.lat ?? el.center?.lat;
    let lon = el.lon ?? el.center?.lon;

    if (typeof lat !== 'number' || typeof lon !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lon)) {
      continue;
    }

    const name = resolvePlaceName(tags, category);
    const id = el.type ? `${el.type}/${el.id}` : `place/${el.id || Math.random()}`;

    // Disallow invented remaining spaces on Macau places
    const cleanTags = { ...tags };
    if (isMacau(lat, lon)) {
      delete cleanTags.vacancy;
      delete cleanTags.remaining_spaces;
      delete cleanTags.free_spaces;
      delete cleanTags.available_spaces;
    }

    places.push({
      id,
      category,
      categoryLabel: CATEGORIES[category]?.label || category,
      name,
      lat: Number(lat.toFixed(6)),
      lon: Number(lon.toFixed(6)),
      tags: cleanTags
    });
  }

  if (isSnapshot && places.length === 0) {
    throw new Error('快照未能解析出任何有效設施（No valid facilities in snapshot）');
  }

  const fetchedAt = raw.fetched_at || raw.osm3s?.timestamp_osm_base || null;
  const sourceUrl = raw.source_url || (isLiveSource(raw) ? 'OpenStreetMap (Overpass 即時)' : 'OpenStreetMap 快照');
  const isLive = !isSnapshot && !raw.fetched_at;

  return {
    places,
    fetchedAt,
    sourceUrl,
    isLive
  };
}

function isLiveSource(raw) {
  return !raw.fetched_at && raw.osm3s;
}

/**
 * Formats OSM opening_hours string into Cantonese.
 * Converts common tokens (24/7, Mo-Su, Mo-Fr) and quotes unparsed values.
 * @param {string|null} raw
 * @returns {string|null}
 */
export function formatOpeningHours(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (trimmed === '24/7' || trimmed === '24/7 open' || trimmed === '24 小時開放') {
    return '24 小時開放';
  }

  // If already formatted in Cantonese (e.g. from HK parking API)
  if (trimmed.startsWith('星期') || trimmed.includes('24 小時') || trimmed.includes('開放')) {
    return trimmed;
  }

  // Common OSM patterns: "Mo-Fr 09:00-18:00", "Mo-Su 08:00-20:00", "Sa-Su 09:00-13:00"
  let formatted = trimmed
    .replace(/\bMo-Su\b/gi, '星期一至日')
    .replace(/\bMo-Sa\b/gi, '星期一至六')
    .replace(/\bMo-Fr\b/gi, '星期一至五')
    .replace(/\bSa-Su\b/gi, '星期六、日')
    .replace(/\bMo\b/gi, '星期一')
    .replace(/\bTu\b/gi, '星期二')
    .replace(/\bWe\b/gi, '星期三')
    .replace(/\bTh\b/gi, '星期四')
    .replace(/\bFr\b/gi, '星期五')
    .replace(/\bSa\b/gi, '星期六')
    .replace(/\bSu\b/gi, '星期日')
    .replace(/\boff\b/gi, '休息');

  if (formatted !== trimmed) {
    return formatted;
  }

  // For unparsed strings, show as a clean quoted note rather than raw prose
  return `「${trimmed}」`;
}

/**
 * Filters and sorts places based on active category and user origin.
 * Enforces default 2 km (2000m) cap to avoid listing distant facilities.
 * Prioritizes named parking lots over generic entrance nodes within similar distance.
 * 
 * @param {Array} places
 * @param {string} category 'all' or category key
 * @param {{ lat: number, lon: number }} origin
 * @param {number} [maxDistanceMeters=2000]
 * @returns {Array} sorted by distance and rank
 */
export function filterAndSortPlaces(places, category, origin, maxDistanceMeters = 2000) {
  if (!Array.isArray(places)) return [];

  const result = [];

  for (const place of places) {
    if (category && category !== 'all' && place.category !== category) {
      continue;
    }

    let distance = 0;
    let walkMinutes = 0;

    if (origin && typeof origin.lat === 'number' && typeof origin.lon === 'number') {
      distance = haversineDistance(origin.lat, origin.lon, place.lat, place.lon);
      if (distance > maxDistanceMeters) continue;
      walkMinutes = calculateWalkMinutes(distance);
    }

    result.push({
      ...place,
      distanceMeters: Math.round(distance),
      walkMinutes,
      distanceFormatted: formatDistance(distance),
      walkMinutesFormatted: formatWalkMinutes(walkMinutes)
    });
  }

  // Sort by distance, with subtle ranking inside similar distance band (< 80m):
  // Prioritize parking lots over parking entrance
  result.sort((a, b) => {
    const distDiff = a.distanceMeters - b.distanceMeters;
    if (Math.abs(distDiff) < 80) {
      const aIsEntrance = a.tags?.amenity === 'parking_entrance' || a.name === '停車場入口';
      const bIsEntrance = b.tags?.amenity === 'parking_entrance' || b.name === '停車場入口';
      if (aIsEntrance && !bIsEntrance) return 1;
      if (!aIsEntrance && bIsEntrance) return -1;
    }
    return distDiff;
  });

  return result;
}

/**
 * Builds formatted human-readable detail representation for selected place.
 * Strictly adheres to truthfulness: NEVER invents ratings, hours, or Macau vacancy!
 * 
 * @param {object} place
 * @param {{ lat: number, lon: number }} origin
 * @param {string} [hkVacancyText=null]
 * @returns {object}
 */
export function formatPlaceDetails(place, origin, hkVacancyText = null) {
  if (!place) return null;

  const tags = place.tags || {};
  const lat = place.lat;
  const lon = place.lon;

  let distanceMeters = place.distanceMeters;
  let walkMinutes = place.walkMinutes;

  if (origin && typeof origin.lat === 'number' && typeof origin.lon === 'number') {
    if (typeof distanceMeters !== 'number') {
      distanceMeters = Math.round(haversineDistance(origin.lat, origin.lon, lat, lon));
      walkMinutes = calculateWalkMinutes(distanceMeters);
    }
  }

  // Current opening status (Item 4: Hong Kong carpark '開放中' / '暫停開放')
  let openingStatusText = null;
  const rawStatus = tags.opening_status || place.hkData?.currentStatus;
  if (rawStatus) {
    openingStatusText = rawStatus.startsWith('而家') ? rawStatus.slice(2) : rawStatus;
  }

  // Opening hours formatted into Cantonese
  const openingHoursText = formatOpeningHours(tags.opening_hours);

  // Wheelchair accessibility
  let wheelchairText = null;
  const wc = tags['toilets:wheelchair'] || tags.wheelchair;
  if (wc === 'yes') {
    wheelchairText = '設有無障礙設施／通道';
  } else if (wc === 'limited') {
    wheelchairText = '有限度無障礙設施';
  } else if (wc === 'no') {
    wheelchairText = '未設無障礙設施';
  }

  // Fee info
  let feeText = null;
  if (tags.fee === 'no' || tags.fee === 'free') {
    feeText = '免費使用';
  } else if (tags.fee === 'yes') {
    feeText = '收費設施';
  }

  // Access restrictions (Item 17)
  let accessText = null;
  if (tags.access === 'private' || tags.access === 'no') {
    accessText = '非公開設施（私人專用）';
  } else if (tags.access === 'customers') {
    accessText = '顧客專用';
  } else if (tags.access === 'permissive') {
    accessText = '獲准許人士專用';
  }

  // Water bottle refill
  let bottleRefillText = null;
  if (tags.bottle === 'yes') {
    bottleRefillText = '支援自備水樽裝水';
  }

  // Operator / contact (strictly from tags)
  const operator = tags.operator || null;
  const phone = tags.phone || tags['contact:phone'] || null;

  // Hong Kong carpark live vacancy and update clock (Item 1 fix)
  const isPlaceInMacau = isMacau(lat, lon);
  let parkingVacancy = null;
  if (!isPlaceInMacau && place.category === 'parking' && hkVacancyText) {
    parkingVacancy = hkVacancyText;
  }
  const lastUpdate = place.hkData?.lastUpdate || null;

  // Navigation URLs
  const appleMapsUrl = `https://maps.apple.com/?daddr=${lat},${lon}`;
  const geoUrl = `geo:${lat},${lon}`;

  return {
    id: place.id,
    name: place.name,
    category: place.category,
    categoryLabel: place.categoryLabel || CATEGORIES[place.category]?.label,
    lat,
    lon,
    distanceMeters,
    walkMinutes,
    distanceFormatted: formatDistance(distanceMeters),
    walkMinutesFormatted: formatWalkMinutes(walkMinutes),
    openingStatusText,
    openingHoursText,
    wheelchairText,
    feeText,
    accessText,
    bottleRefillText,
    operator,
    phone,
    parkingVacancy, // MUST be null for Macau!
    lastUpdate,
    appleMapsUrl,
    geoUrl
  };
}
