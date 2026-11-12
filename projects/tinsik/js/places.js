/**
 * places.js · 天色 Tin Sik
 * Place metadata and geographical definitions for Macau and Hong Kong.
 */

export const PLACES = [
  {
    id: 'macau-peninsula',
    name: '澳門半島',
    territory: 'macau',
    territoryName: '澳門',
    lat: 22.1987,
    lon: 113.5439,
    default: true,
    description: '澳門半島中心地帶'
  },
  {
    id: 'macau-taipa',
    name: '氹仔',
    territory: 'macau',
    territoryName: '澳門',
    lat: 22.1590,
    lon: 113.5590,
    default: false,
    description: '離島氹仔市區及機場帶'
  },
  {
    id: 'macau-coloane',
    name: '路環',
    territory: 'macau',
    territoryName: '澳門',
    lat: 22.1240,
    lon: 113.5650,
    default: false,
    description: '離島路環黑沙及村落帶'
  },
  {
    id: 'hk-hko',
    name: '香港天文台',
    code: 'HKO',
    territory: 'hongkong',
    territoryName: '香港',
    lat: 22.3019,
    lon: 114.1743,
    default: false,
    description: '尖沙咀天文台總部'
  }
];

export const DEFAULT_PLACE = PLACES[0];

export function getPlaceById(id) {
  return PLACES.find(p => p.id === id) || DEFAULT_PLACE;
}

export function getMacauPlaces() {
  return PLACES.filter(p => p.territory === 'macau');
}

export function getHongKongPlaces() {
  return PLACES.filter(p => p.territory === 'hongkong');
}
