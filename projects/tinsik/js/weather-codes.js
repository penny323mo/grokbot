/**
 * weather-codes.js · 天色 Tin Sik
 * WMO Weather Interpretation Codes (WW) mapped to natural spoken Cantonese
 * and bespoke 2px monoline geometric SVG sky marks.
 */

export const UNKNOWN_WEATHER = {
  code: null,
  label: '天氣狀況唔詳',
  shortLabel: '唔詳',
  icon: 'unknown'
};

/**
 * WMO Weather Codes mapping table.
 */
const WEATHER_DEFINITIONS = [
  {
    codes: [0],
    dayLabel: '晴朗',
    nightLabel: '天晴',
    shortLabel: '天晴',
    dayIcon: 'sun',
    nightIcon: 'moon'
  },
  {
    codes: [1],
    dayLabel: '大致天晴',
    nightLabel: '大致天晴',
    shortLabel: '大致天晴',
    dayIcon: 'sun-cloud',
    nightIcon: 'moon-cloud'
  },
  {
    codes: [2],
    dayLabel: '有雲',
    nightLabel: '有雲',
    shortLabel: '有雲',
    dayIcon: 'sun-cloud',
    nightIcon: 'moon-cloud'
  },
  {
    codes: [3],
    dayLabel: '密雲',
    nightLabel: '密雲',
    shortLabel: '密雲',
    dayIcon: 'cloud',
    nightIcon: 'cloud'
  },
  {
    codes: [45, 48],
    dayLabel: '有霧',
    nightLabel: '有霧',
    shortLabel: '有霧',
    dayIcon: 'fog',
    nightIcon: 'fog'
  },
  {
    codes: [51, 53, 55],
    dayLabel: '毛毛雨',
    nightLabel: '毛毛雨',
    shortLabel: '毛毛雨',
    dayIcon: 'drizzle',
    nightIcon: 'drizzle'
  },
  {
    codes: [56, 57],
    dayLabel: '凍毛毛雨',
    nightLabel: '凍毛毛雨',
    shortLabel: '凍雨',
    dayIcon: 'drizzle',
    nightIcon: 'drizzle'
  },
  {
    codes: [61, 63, 65],
    dayLabel: '落雨',
    nightLabel: '落雨',
    shortLabel: '落雨',
    dayIcon: 'rain',
    nightIcon: 'rain'
  },
  {
    codes: [66, 67],
    dayLabel: '凍雨',
    nightLabel: '凍雨',
    shortLabel: '凍雨',
    dayIcon: 'rain',
    nightIcon: 'rain'
  },
  {
    codes: [71, 73, 75, 77],
    dayLabel: '落雪',
    nightLabel: '落雪',
    shortLabel: '落雪',
    dayIcon: 'snow',
    nightIcon: 'snow'
  },
  {
    codes: [80, 81, 82],
    dayLabel: '驟雨',
    nightLabel: '驟雨',
    shortLabel: '驟雨',
    dayIcon: 'shower',
    nightIcon: 'shower'
  },
  {
    codes: [85, 86],
    dayLabel: '陣雪',
    nightLabel: '陣雪',
    shortLabel: '陣雪',
    dayIcon: 'snow',
    nightIcon: 'snow'
  },
  {
    codes: [95],
    dayLabel: '雷暴',
    nightLabel: '雷暴',
    shortLabel: '雷暴',
    dayIcon: 'thunder',
    nightIcon: 'thunder'
  },
  {
    codes: [96, 99],
    dayLabel: '雷暴夾雜冰雹',
    nightLabel: '雷暴夾雜冰雹',
    shortLabel: '雷雨雹',
    dayIcon: 'thunder',
    nightIcon: 'thunder'
  }
];

/**
 * Geometric, monoline 2px stroke inline SVG icons (viewBox 0 0 24 24).
 * Art direction: architectural, restraint, no emoji, no cartoon fills.
 */
export const WEATHER_SVGS = {
  'sun': `<svg class="sky-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4.5"/>
    <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77"/>
  </svg>`,
  'moon': `<svg class="sky-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>`,
  'sun-cloud': `<svg class="sky-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M12 4a3.5 3.5 0 0 1 3.4 2.8A4.5 4.5 0 0 1 18 15h-1M9 6a3.5 3.5 0 0 0-3.3 2.5"/>
    <path d="M6.5 19H17a4 4 0 0 0 0-8 4.2 4.2 0 0 0-2.3.7A4.5 4.5 0 0 0 6.5 13 3 3 0 0 0 6.5 19z"/>
  </svg>`,
  'moon-cloud': `<svg class="sky-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M15.5 5A5 5 0 0 1 19 8.5"/>
    <path d="M6.5 19H17a4 4 0 0 0 0-8 4.2 4.2 0 0 0-2.3.7A4.5 4.5 0 0 0 6.5 13 3 3 0 0 0 6.5 19z"/>
  </svg>`,
  'cloud': `<svg class="sky-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M17.5 19H6.5A4.5 4.5 0 0 1 6.5 10a5.5 5.5 0 0 1 10.6-1.5A4.5 4.5 0 0 1 17.5 19z"/>
  </svg>`,
  'fog': `<svg class="sky-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <line x1="4" y1="8" x2="20" y2="8"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <line x1="5" y1="16" x2="19" y2="16"/>
  </svg>`,
  'drizzle': `<svg class="sky-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M17.5 15H6.5A4.5 4.5 0 0 1 6.5 6a5.5 5.5 0 0 1 10.6-1.5A4.5 4.5 0 0 1 17.5 15z"/>
    <line x1="8" y1="18" x2="8" y2="19"/>
    <line x1="12" y1="18" x2="12" y2="19"/>
    <line x1="16" y1="18" x2="16" y2="19"/>
  </svg>`,
  'rain': `<svg class="sky-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M17.5 14H6.5A4.5 4.5 0 0 1 6.5 5a5.5 5.5 0 0 1 10.6-1.5A4.5 4.5 0 0 1 17.5 14z"/>
    <line x1="8" y1="17" x2="7" y2="21"/>
    <line x1="12" y1="17" x2="11" y2="21"/>
    <line x1="16" y1="17" x2="15" y2="21"/>
  </svg>`,
  'shower': `<svg class="sky-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M17.5 14H6.5A4.5 4.5 0 0 1 6.5 5a5.5 5.5 0 0 1 10.6-1.5A4.5 4.5 0 0 1 17.5 14z"/>
    <line x1="10" y1="17" x2="9" y2="20"/>
    <line x1="14" y1="17" x2="13" y2="20"/>
  </svg>`,
  'thunder': `<svg class="sky-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M17.5 13H6.5A4.5 4.5 0 0 1 6.5 4a5.5 5.5 0 0 1 10.6-1.5A4.5 4.5 0 0 1 17.5 13z"/>
    <polyline points="12 13 10 18 14 18 12 23"/>
  </svg>`,
  'snow': `<svg class="sky-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M17.5 14H6.5A4.5 4.5 0 0 1 6.5 5a5.5 5.5 0 0 1 10.6-1.5A4.5 4.5 0 0 1 17.5 14z"/>
    <line x1="12" y1="17" x2="12" y2="21"/>
    <line x1="9" y1="18" x2="15" y2="20"/>
    <line x1="9" y1="20" x2="15" y2="18"/>
  </svg>`,
  'unknown': `<svg class="sky-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="8"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <circle cx="12" cy="16" r="0.75" fill="currentColor"/>
  </svg>`
};

/**
 * Returns Cantonese condition information and icon SVG for a WMO weather code.
 * @param {number|null|undefined} code - WMO code
 * @param {number} isDay - 1 for daytime, 0 for nighttime (default: 1)
 */
export function getWeatherCondition(code, isDay = 1) {
  if (code == null || isNaN(Number(code))) {
    return {
      code: null,
      label: UNKNOWN_WEATHER.label,
      shortLabel: UNKNOWN_WEATHER.shortLabel,
      iconType: UNKNOWN_WEATHER.icon,
      iconSvg: WEATHER_SVGS['unknown']
    };
  }

  const numCode = Number(code);
  const def = WEATHER_DEFINITIONS.find(d => d.codes.includes(numCode));

  if (!def) {
    return {
      code: numCode,
      label: UNKNOWN_WEATHER.label,
      shortLabel: UNKNOWN_WEATHER.shortLabel,
      iconType: UNKNOWN_WEATHER.icon,
      iconSvg: WEATHER_SVGS['unknown']
    };
  }

  const isNight = isDay === 0;
  const label = isNight ? def.nightLabel : def.dayLabel;
  const iconType = isNight ? def.nightIcon : def.dayIcon;
  const iconSvg = WEATHER_SVGS[iconType] || WEATHER_SVGS['cloud'];

  return {
    code: numCode,
    label,
    shortLabel: def.shortLabel,
    iconType,
    iconSvg
  };
}
