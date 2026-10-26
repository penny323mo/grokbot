/**
 * js/render/art.js
 * Visual iconography, ink-brush SVG decorative elements, and UI ornaments
 * for 燈影軍略 · Lantern Tactics (v4).
 */

export const SVG_ART = {
  icons: {
    sword: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"></polyline>
        <line x1="13" y1="19" x2="19" y2="13"></line>
        <line x1="16" y1="16" x2="20" y2="20"></line>
        <line x1="19" y1="21" x2="21" y2="19"></line>
      </svg>
    `,
    shield: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
      </svg>
    `,
    bow: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 20 A 16 16 0 0 1 20 4"></path>
        <line x1="4" y1="20" x2="20" y2="4"></line>
        <line x1="12" y1="4" x2="20" y2="4"></line>
        <line x1="20" y1="4" x2="20" y2="12"></line>
      </svg>
    `,
    magic: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M15 4V2"></path>
        <path d="M15 16v-2"></path>
        <path d="M8 9h2"></path>
        <path d="M20 9h2"></path>
        <path d="M17.8 11.8 19 13"></path>
        <path d="M15 9h0"></path>
        <path d="M17.8 6.2 19 5"></path>
        <path d="m3 21 9-9"></path>
        <path d="M12.2 6.2 11 5"></path>
      </svg>
    `,
    heal: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h5v5c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2z"></path>
      </svg>
    `,
    boots: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 16v-4a2 2 0 0 1 2-2h3l2-5h5v9l3 1v5H4v-4z"></path>
      </svg>
    `,
    lantern: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="7" y="6" width="10" height="12" rx="2"></rect>
        <line x1="12" y1="2" x2="12" y2="6"></line>
        <line x1="9" y1="22" x2="15" y2="22"></line>
        <line x1="12" y1="18" x2="12" y2="22"></line>
        <circle cx="12" cy="12" r="2" fill="#FFAE42"></circle>
      </svg>
    `,
    bond: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>
      </svg>
    `,
    star: `
      <svg viewBox="0 0 24 24" fill="#FFAE42" stroke="#D9822B" stroke-width="1.5">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
      </svg>
    `,
    undo: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="1 4 1 10 7 10"></polyline>
        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
      </svg>
    `
  },

  // Atmospheric title screen ink decoration
  titleInkWash: `
    <svg viewBox="0 0 390 180" class="svg-title-ink" style="width:100%;height:100%;">
      <defs>
        <linearGradient id="inkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#F2B45A" stop-opacity="0.9"/>
          <stop offset="50%" stop-color="#D9822B" stop-opacity="0.95"/>
          <stop offset="100%" stop-color="#8B4513" stop-opacity="0.9"/>
        </linearGradient>
        <filter id="inkGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <!-- Mountain ridges in ink silhouette -->
      <path d="M0 160 Q70 110 160 135 T320 100 T390 120 L390 180 L0 180 Z" fill="#0C1028" opacity="0.8"/>
      <path d="M0 170 Q110 130 220 155 T390 135 L390 180 L0 180 Z" fill="#141938" opacity="0.9"/>
      <!-- Soft moon radiance -->
      <circle cx="195" cy="65" r="45" fill="#FFAE42" opacity="0.08" filter="url(#inkGlow)"/>
      <circle cx="195" cy="65" r="28" fill="#FFF2D6" opacity="0.15"/>
    </svg>
  `
};
