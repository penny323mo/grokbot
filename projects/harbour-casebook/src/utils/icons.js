/**
 * 濠江疑案 · Harbour Casebook
 * 檔案墨水向量圖標 (Archival Ink SVG Icons)
 * 嚴格杜絕 Emoji，全部採用單色墨線向量呈現
 */

export const ICONS = {
  // Fountain / dip pen nib
  pen: (size = 18, stroke = 'currentColor') => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ink-icon">
      <path d="M12 19l7-7 3 3-7 7-3-3z"/>
      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18"/>
      <path d="M2 2l7.586 7.586"/>
      <circle cx="11" cy="11" r="1.5" fill="${stroke}"/>
    </svg>
  `,

  // Vintage archival lantern / lamp
  lamp: (size = 18, stroke = 'currentColor') => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ink-icon">
      <path d="M9 2h6"/>
      <path d="M12 2v3"/>
      <path d="M8 8h8l1 6H7l1-6z"/>
      <ellipse cx="12" cy="14" rx="5" ry="3"/>
      <path d="M6 14v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4"/>
      <line x1="9" y1="22" x2="15" y2="22"/>
    </svg>
  `,

  // Magnifying glass
  search: (size = 18, stroke = 'currentColor') => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ink-icon">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  `,

  // Antique brass padlock
  lock: (size = 18, stroke = 'currentColor') => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ink-icon">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      <circle cx="12" cy="16" r="1" fill="${stroke}"/>
    </svg>
  `,

  // Justice balance scale
  scale: (size = 18, stroke = 'currentColor') => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ink-icon">
      <path d="M12 3v18"/>
      <path d="M5 6l7-3 7 3"/>
      <path d="M3 13l2-7 2 7a3 3 0 0 1-4 0z"/>
      <path d="M17 13l2-7 2 7a3 3 0 0 1-4 0z"/>
      <path d="M8 21h8"/>
    </svg>
  `,

  // Ink checkmark
  check: (size = 18, stroke = 'currentColor') => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="ink-icon">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  `,

  // Archival warning/alert badge
  alert: (size = 18, stroke = 'currentColor') => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ink-icon">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  `,

  // Archival case document / scroll
  scroll: (size = 18, stroke = 'currentColor') => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ink-icon">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  `,

  // Location map pin
  pin: (size = 14, stroke = 'currentColor') => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ink-icon">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  `,

  // Notebook icon
  notebook: (size = 20, stroke = 'currentColor') => `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ink-icon">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      <line x1="8" y1="6" x2="16" y2="6"/>
      <line x1="8" y1="10" x2="16" y2="10"/>
      <line x1="8" y1="14" x2="13" y2="14"/>
    </svg>
  `
};
