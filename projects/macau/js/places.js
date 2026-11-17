/**
 * Curated Macau places.
 * OSM coordinates are the Nominatim values recorded for 斜路 on 2026-11-17.
 * Bus terminals use the DSAT station coordinates vendored with 點去 on 2026-11-16.
 * A map tap is a coordinate, never a guessed street name.
 */

export const DEFAULT_ORIGIN = {
  id: 'senado',
  name: '議事亭前地',
  namePt: 'Largo do Senado',
  district: '澳門半島',
  lat: 22.1938271,
  lon: 113.5399903,
  source: 'osm'
};

export const DEFAULT_DESTINATION = {
  id: 'guia',
  name: '東望洋燈塔',
  namePt: 'Farol da Guia',
  district: '澳門半島',
  lat: 22.1964359,
  lon: 113.5497062,
  source: 'osm'
};

export const PLACES = [
  DEFAULT_ORIGIN,
  DEFAULT_DESTINATION,
  {
    id: 'ama',
    name: '媽閣廟',
    namePt: 'Templo de A-Má',
    district: '澳門半島',
    lat: 22.1861086,
    lon: 113.5312671,
    source: 'osm'
  },
  {
    id: 'mongha',
    name: '望廈炮台',
    namePt: 'Fortaleza de Mong-Há',
    district: '澳門半島',
    lat: 22.2079651,
    lon: 113.5476729,
    source: 'osm'
  },
  {
    id: 'hacsa',
    name: '黑沙海灘',
    namePt: 'Praia de Hác Sá',
    district: '路環',
    lat: 22.1212703,
    lon: 113.5709904,
    source: 'osm'
  },
  {
    id: 'coloane',
    name: '疊石塘山',
    namePt: 'Alto de Coloane',
    district: '路環',
    lat: 22.1206541,
    lon: 113.5612955,
    source: 'osm'
  },
  {
    id: 'border',
    name: '關閘總站',
    namePt: 'Portas do Cerco',
    district: '澳門半島',
    lat: 22.215282,
    lon: 113.54882,
    source: 'dsat',
    code: 'M1/11'
  },
  {
    id: 'barra-hub',
    name: '媽閣交通樞紐',
    namePt: 'Centro de Transportes da Barra',
    district: '澳門半島',
    lat: 22.184305,
    lon: 113.53007,
    source: 'dsat',
    code: 'M3/4'
  },
  {
    id: 'taipa-ferry',
    name: '氹仔客運碼頭',
    namePt: 'Terminal Marítimo da Taipa',
    district: '氹仔',
    lat: 22.163336,
    lon: 113.576,
    source: 'dsat',
    code: 'T345/1'
  },
  {
    id: 'airport',
    name: '澳門機場',
    namePt: 'Aeroporto Internacional de Macau',
    district: '氹仔',
    lat: 22.15779,
    lon: 113.57395,
    source: 'dsat',
    code: 'T356/1'
  }
];

export function findPlace(name) {
  const q = String(name || '').trim();
  if (!q) return null;
  return PLACES.find((p) => p.name === q || p.namePt === q) || null;
}

export function evaluateCoordinate(lat, lon) {
  const numLat = Number(lat);
  const numLon = Number(lon);
  if (!Number.isFinite(numLat) || !Number.isFinite(numLon)) {
    return { accepted: false, isValid: false, isMacau: false };
  }
  const isMacau = numLat >= 22.1 && numLat <= 22.24 && numLon >= 113.51 && numLon <= 113.61;
  const isAdjacent = !isMacau && numLat >= 22.05 && numLat <= 22.28 && numLon >= 113.48 && numLon <= 113.65;
  return {
    accepted: isMacau,
    isValid: isMacau || isAdjacent,
    isMacau,
    isAdjacent
  };
}
