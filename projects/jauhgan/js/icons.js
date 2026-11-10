/**
 * icons.js - Geometric SVG iconography (~2px stroke, no emoji, no icon font)
 * Nightly 2026-11-11 · 就近 (Just Around)
 */

export const ICONS = {
  // 全部 (All) - 4-grid geometric points
  all: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  `,

  // 公廁 (Toilets / Restroom) - geometric WC sign
  toilets: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M6.5 8.5L8 15.5H9L10 10.5L11 15.5H12L13.5 8.5" />
      <path d="M17.5 10C17 9 15.5 9 15.5 10.5C15.5 12.5 17.5 13 17.5 14C17.5 15.5 16 15.5 15.5 15" />
    </svg>
  `,

  // 停車場 (Parking) - geometric P sign
  parking: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M9 17V7H13C14.6569 7 16 8.34315 16 10C16 11.6569 14.6569 13 13 13H9" />
    </svg>
  `,

  // 飲水 (Drinking Water) - water droplet & fountain stream
  drinking_water: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M12 2.5C12 2.5 6 9.5 6 14.5C6 17.8137 8.68629 20.5 12 20.5C15.3137 20.5 18 17.8137 18 14.5C18 9.5 12 2.5 12 2.5Z" />
      <path d="M10 13C10 14.6569 11.3431 16 13 16" />
    </svg>
  `,

  // 藥房 (Pharmacy) - Greek cross with pill outline
  pharmacy: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M12 7V17" />
      <path d="M7 12H17" />
    </svg>
  `,

  // AED (Defibrillator) - Heart with pulse lightning
  aed: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M20.42 4.58C18.67 2.83 15.83 2.83 14.08 4.58L12 6.67L9.92 4.58C8.17 2.83 5.33 2.83 3.58 4.58C1.83 6.33 1.83 9.17 3.58 10.92L12 19.34L20.42 10.92C22.17 9.17 22.17 6.33 20.42 4.58Z" />
      <path d="M12.5 7L10 12H14L11.5 17" />
    </svg>
  `,

  // 診所 (Clinic) - Clinic building with medical roof cross
  clinic: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M3 21H21" />
      <path d="M5 21V8L12 4L19 8V21" />
      <path d="M12 10V16" />
      <path d="M9 13H15" />
    </svg>
  `,

  // 用我嘅位置 / 定位 (Locate / Crosshair)
  locate: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="7" />
      <path d="M12 2V5" />
      <path d="M12 19V22" />
      <path d="M2 12H5" />
      <path d="M19 12H22" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  `,

  // 導航 (Navigate / Direction)
  navigate: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <polygon points="3 11 22 2 13 21 11 13 3 11" />
    </svg>
  `,

  // 關閉 (Close)
  close: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  `,

  // 重新整理 (Refresh)
  refresh: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
    </svg>
  `,

  // 步行 (Walking)
  walk: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="13.5" cy="4" r="2" />
      <path d="M10 8l3 3.5v5.5" />
      <path d="M7 13.5l3-3.5 3.5 1.5 3.5 4" />
      <path d="M13 14l-3 7" />
    </svg>
  `
};

/**
 * Returns SVG markup for an icon key.
 * @param {string} name
 * @returns {string}
 */
export function getIconSvg(name) {
  return ICONS[name] || ICONS.all;
}
