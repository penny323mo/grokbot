/**
 * js/render/art.js
 * Cohesive, mature, atmospheric Asian night-town artwork for 燈籠小鎮守夜人 (Lantern Watch).
 * Art direction:
 * - Woodblock-print & Japanese/Chinese ink-wash inspired silhouettes.
 * - Limited, refined palette: deep indigo/ink night (#060918, #101534), slate (#253054),
 *   warm amber/gold lantern glow (#FFAE42, #F2B45A, #FFF0D0), muted vermilion/cinnabar (#C74B4B, #E85D5D),
 *   bamboo jade/celadon (#386E56, #52B788, #70C1B3), warm parchment (#EDE3CF).
 * - Consistent 1.2-1.5px ink line weight, soft contact drop shadows, warm golden rim lights on allies,
 *   eerie spectral cyan/crimson rim lights on enemies.
 * - Zero clip-art, zero cartoon stickers, zero blobs with dots.
 */

export const SVG_ART = {
  // ================= GUARDIANS (守護者 - 10 COHESIVE WOODBLOCK UNITS) =================
  cat_patrol: `
    <svg viewBox="0 0 64 64" class="svg-unit cat-patrol">
      <defs>
        <radialGradient id="catLanternGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#FFAE42" stop-opacity="0.95"/>
          <stop offset="100%" stop-color="#FFAE42" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <!-- Contact Shadow -->
      <ellipse cx="32" cy="58" rx="18" ry="4" fill="#04060E" opacity="0.75"/>
      <!-- Sinuous Tail with gold rim -->
      <path d="M19 50 C10 46 7 34 13 28 C15 26 18 29 16 36 C14 42 18 47 22 49" fill="none" stroke="#12162A" stroke-width="3" stroke-linecap="round"/>
      <path d="M19 50 C10 46 7 34 13 28" fill="none" stroke="#FFAE42" stroke-width="0.8" stroke-linecap="round" opacity="0.8"/>
      <!-- Flowing Midnight Travel Cloak -->
      <path d="M18 36 Q14 54 32 54 Q50 54 46 36 Q32 40 18 36 Z" fill="#181E38" stroke="#080B18" stroke-width="1.4"/>
      <path d="M22 36 Q32 41 42 36 L39 52 Q32 54 25 52 Z" fill="#222B4D"/>
      <!-- Kodachi Sheath across back -->
      <line x1="16" y1="46" x2="28" y2="34" stroke="#7E8DAF" stroke-width="2" stroke-linecap="round"/>
      <line x1="28" y1="34" x2="31" y2="31" stroke="#FFAE42" stroke-width="2.2" stroke-linecap="round"/>
      <!-- Hand holding Brass Patrol Lantern -->
      <line x1="43" y1="38" x2="49" y2="44" stroke="#4A3423" stroke-width="1.8" stroke-linecap="round"/>
      <circle cx="49" cy="46" r="8" fill="url(#catLanternGlow)"/>
      <rect x="46" y="43" width="6" height="8" rx="1.5" fill="#FFAE42" stroke="#080B18" stroke-width="1"/>
      <line x1="49" y1="41" x2="49" y2="43" stroke="#080B18" stroke-width="1"/>
      <circle cx="49" cy="47" r="1.5" fill="#FFF8E7"/>
      <!-- Cloak Cowl & Scarf -->
      <path d="M17 33 Q32 37 47 33 L44 28 Q32 32 20 28 Z" fill="#2A355E" stroke="#080B18" stroke-width="1.3"/>
      <!-- Sleek Feline Head inside deep shadow -->
      <ellipse cx="32" cy="22" rx="13" ry="11" fill="#1C2340" stroke="#080B18" stroke-width="1.4"/>
      <!-- Bamboo Kasa Hat angled down -->
      <polygon points="32,6 8,20 56,20" fill="#2E241A" stroke="#080B18" stroke-width="1.4" stroke-linejoin="round"/>
      <polygon points="32,7 12,19 52,19" fill="#4A3A2A" opacity="0.9"/>
      <line x1="20" y1="19" x2="32" y2="8" stroke="#C49A6C" stroke-width="0.8" opacity="0.6"/>
      <line x1="44" y1="19" x2="32" y2="8" stroke="#C49A6C" stroke-width="0.8" opacity="0.6"/>
      <!-- Glowing Amber Scout Eyes in shadow -->
      <ellipse cx="26" cy="22" rx="2.5" ry="3.5" fill="#FFAE42" stroke="#080B18" stroke-width="0.8"/>
      <ellipse cx="38" cy="22" rx="2.5" ry="3.5" fill="#FFAE42" stroke="#080B18" stroke-width="0.8"/>
      <line x1="26" y1="19" x2="26" y2="25" stroke="#080B18" stroke-width="1.2" stroke-linecap="round"/>
      <line x1="38" y1="19" x2="38" y2="25" stroke="#080B18" stroke-width="1.2" stroke-linecap="round"/>
      <!-- Elegant Whiskers -->
      <line x1="22" y1="26" x2="14" y2="25" stroke="#EDE3CF" stroke-width="1" stroke-linecap="round" opacity="0.8"/>
      <line x1="22" y1="28" x2="13" y2="29" stroke="#EDE3CF" stroke-width="1" stroke-linecap="round" opacity="0.8"/>
      <line x1="42" y1="26" x2="50" y2="25" stroke="#EDE3CF" stroke-width="1" stroke-linecap="round" opacity="0.8"/>
      <line x1="42" y1="28" x2="51" y2="29" stroke="#EDE3CF" stroke-width="1" stroke-linecap="round" opacity="0.8"/>
    </svg>
  `,

  tea_master: `
    <svg viewBox="0 0 64 64" class="svg-unit tea-master">
      <!-- Contact Shadow -->
      <ellipse cx="32" cy="58" rx="18" ry="4" fill="#04060E" opacity="0.75"/>
      <!-- Dignified Celadon & Indigo Kimono -->
      <path d="M16 34 Q12 55 32 55 Q52 55 48 34 Q40 26 32 26 Q24 26 16 34 Z" fill="#20362C" stroke="#080B18" stroke-width="1.4"/>
      <path d="M23 34 L32 46 L41 34" fill="none" stroke="#EDE3CF" stroke-width="2.2"/>
      <path d="M27 34 L32 42 L37 34" fill="none" stroke="#3D7860" stroke-width="1.2"/>
      <!-- Woven Obi Sash with herbal bamboo pouch -->
      <rect x="22" y="41" width="20" height="4.5" fill="#7A4B2A" rx="1"/>
      <circle cx="25" cy="47" r="2.5" fill="#3D7860" stroke="#080B18" stroke-width="0.8"/>
      <!-- Serene Wise Head with scholar cap -->
      <ellipse cx="32" cy="20" rx="13" ry="11" fill="#C4B79E" stroke="#080B18" stroke-width="1.4"/>
      <path d="M22 14 C25 24 27 26 29 27 L31 27 C29 18 26 12 24 10 Z" fill="#262228"/>
      <path d="M42 14 C39 24 37 26 35 27 L33 27 C35 18 38 12 40 10 Z" fill="#262228"/>
      <rect x="28" y="7" width="8" height="5" rx="2" fill="#20362C" stroke="#080B18" stroke-width="1"/>
      <!-- Round Brass Wire Spectacles -->
      <circle cx="26" cy="19" r="3.4" fill="none" stroke="#FFAE42" stroke-width="1.2"/>
      <circle cx="38" cy="19" r="3.4" fill="none" stroke="#FFAE42" stroke-width="1.2"/>
      <line x1="29.4" y1="19" x2="34.6" y2="19" stroke="#FFAE42" stroke-width="1.2"/>
      <circle cx="26" cy="19" r="1.3" fill="#080B18"/>
      <circle cx="38" cy="19" r="1.3" fill="#080B18"/>
      <!-- Steaming Celadon Tea Bowl in Hand -->
      <ellipse cx="44" cy="42" rx="5" ry="4" fill="#3D7860" stroke="#080B18" stroke-width="1.2"/>
      <ellipse cx="44" cy="41" rx="3.5" ry="2" fill="#52B788"/>
      <!-- Rising Calligraphic Steam Wave -->
      <path d="M44 38 Q41 33 45 29 Q49 25 45 21" fill="none" stroke="#EDE3CF" stroke-width="1.4" stroke-linecap="round" opacity="0.85"/>
      <path d="M46 36 Q49 32 47 28" fill="none" stroke="#70C1B3" stroke-width="1" stroke-linecap="round" opacity="0.6"/>
    </svg>
  `,

  scarecrow: `
    <svg viewBox="0 0 64 64" class="svg-unit scarecrow">
      <!-- Contact Shadow -->
      <ellipse cx="32" cy="58" rx="16" ry="4" fill="#04060E" opacity="0.75"/>
      <!-- Weathered Bamboo Spine & Crossbar -->
      <line x1="32" y1="16" x2="32" y2="58" stroke="#3D2B1C" stroke-width="3.5" stroke-linecap="round"/>
      <line x1="10" y1="32" x2="54" y2="32" stroke="#3D2B1C" stroke-width="2.8" stroke-linecap="round"/>
      <!-- Straw Poncho Robe tied with hemp cord -->
      <path d="M20 28 Q16 49 32 51 Q48 49 44 28 Z" fill="#B88A42" stroke="#080B18" stroke-width="1.4"/>
      <line x1="22" y1="35" x2="42" y2="35" stroke="#5E4020" stroke-width="1.6"/>
      <!-- Sacred Soul Lantern glowing inside chest lattice -->
      <rect x="29" y="36" width="6" height="7" rx="1.5" fill="#1C1824" stroke="#080B18" stroke-width="1"/>
      <circle cx="32" cy="39.5" r="2.5" fill="#FFAE42"/>
      <circle cx="32" cy="39.5" r="1.2" fill="#FFF8E7"/>
      <!-- Wide Conical Straw Kasa Hat with protective talismans -->
      <polygon points="32,4 8,20 56,20" fill="#242C4A" stroke="#080B18" stroke-width="1.4" stroke-linejoin="round"/>
      <polygon points="32,6 12,19 52,19" fill="#323C64" opacity="0.9"/>
      <!-- Head Burlap Mask with amber eye slits -->
      <ellipse cx="32" cy="22" rx="7.5" ry="6" fill="#C49B55" stroke="#080B18" stroke-width="1.2"/>
      <line x1="28" y1="21.5" x2="31" y2="21.5" stroke="#FFAE42" stroke-width="1.6" stroke-linecap="round"/>
      <line x1="33" y1="21.5" x2="36" y2="21.5" stroke="#FFAE42" stroke-width="1.6" stroke-linecap="round"/>
      <!-- Fluttering Paper Ofuda Talismans from brim -->
      <rect x="14" y="20" width="3.5" height="10" fill="#EDE3CF" stroke="#C74B4B" stroke-width="0.8" transform="rotate(-5 14 20)"/>
      <line x1="15.7" y1="22" x2="15.7" y2="28" stroke="#C74B4B" stroke-width="1"/>
      <circle cx="50" cy="34" r="2" fill="#FFAE42" stroke="#080B18" stroke-width="0.8"/>
    </svg>
  `,

  tanuki_mage: `
    <svg viewBox="0 0 64 64" class="svg-unit tanuki-mage">
      <!-- Contact Shadow -->
      <ellipse cx="32" cy="58" rx="19" ry="4.5" fill="#04060E" opacity="0.75"/>
      <!-- Plump Mystical Tanuki in layered robes -->
      <path d="M18 32 Q14 55 32 55 Q50 55 46 32 Q40 24 32 24 Q24 24 18 32 Z" fill="#5E3E26" stroke="#080B18" stroke-width="1.4"/>
      <ellipse cx="32" cy="43" rx="10" ry="9" fill="#EDE3CF" stroke="#080B18" stroke-width="1"/>
      <!-- Woodblock Masked Face -->
      <ellipse cx="32" cy="21" rx="13.5" ry="11" fill="#8C6340" stroke="#080B18" stroke-width="1.4"/>
      <ellipse cx="25" cy="21" rx="5" ry="3.8" fill="#1C1612"/>
      <ellipse cx="39" cy="21" rx="5" ry="3.8" fill="#1C1612"/>
      <circle cx="26" cy="21" r="1.6" fill="#FFAE42"/>
      <circle cx="38" cy="21" r="1.6" fill="#FFAE42"/>
      <!-- Sacred Green Oak Leaf with golden spirit rune -->
      <path d="M32 12 C27 6 32 1 32 1 C32 1 37 6 32 12 Z" fill="#3D7860" stroke="#080B18" stroke-width="1"/>
      <circle cx="32" cy="6" r="1.3" fill="#FFAE42"/>
      <!-- Earthen Sake Gourd casting foxfire trail -->
      <circle cx="44" cy="45" r="4" fill="#C49A6C" stroke="#080B18" stroke-width="1.1"/>
      <circle cx="44" cy="40" r="2.5" fill="#C49A6C" stroke="#080B18" stroke-width="0.9"/>
      <circle cx="48" cy="34" r="1.8" fill="#70C1B3" opacity="0.85"/>
      <circle cx="51" cy="28" r="1.2" fill="#FFAE42" opacity="0.9"/>
    </svg>
  `,

  frog_bard: `
    <svg viewBox="0 0 64 64" class="svg-unit frog-bard">
      <!-- Contact Shadow -->
      <ellipse cx="32" cy="58" rx="19" ry="4" fill="#04060E" opacity="0.75"/>
      <!-- Serene Lotus Leaf Pedestal -->
      <ellipse cx="32" cy="56" rx="20" ry="5" fill="#20402C" stroke="#080B18" stroke-width="1.2"/>
      <!-- Monk Toad Body in Lotus Posture -->
      <ellipse cx="32" cy="42" rx="15" ry="12" fill="#35583E" stroke="#080B18" stroke-width="1.4"/>
      <ellipse cx="32" cy="44" rx="9" ry="8" fill="#EDE3CF" opacity="0.9"/>
      <!-- Broad Meditative Head & Eyes -->
      <ellipse cx="32" cy="27" rx="15" ry="9" fill="#35583E" stroke="#080B18" stroke-width="1.4"/>
      <circle cx="22" cy="19" r="4" fill="#4B7A57" stroke="#080B18" stroke-width="1.2"/>
      <circle cx="42" cy="19" r="4" fill="#4B7A57" stroke="#080B18" stroke-width="1.2"/>
      <circle cx="22" cy="19" r="1.6" fill="#FFAE42"/>
      <circle cx="42" cy="19" r="1.6" fill="#FFAE42"/>
      <!-- Holding Rosewood Biwa Lute -->
      <path d="M28 35 Q32 30 36 35 L38 48 Q32 50 26 48 Z" fill="#7A3F20" stroke="#080B18" stroke-width="1.2"/>
      <line x1="32" y1="28" x2="32" y2="48" stroke="#EDE3CF" stroke-width="0.9"/>
      <!-- Concentric Sound Resonance Rings -->
      <circle cx="32" cy="38" r="8" fill="none" stroke="#FFAE42" stroke-width="0.8" opacity="0.6" stroke-dasharray="2,2"/>
      <circle cx="32" cy="38" r="12" fill="none" stroke="#70C1B3" stroke-width="0.7" opacity="0.4" stroke-dasharray="3,3"/>
    </svg>
  `,

  crane_courier: `
    <svg viewBox="0 0 64 64" class="svg-unit crane-courier">
      <!-- Contact Shadow -->
      <ellipse cx="32" cy="58" rx="16" ry="4" fill="#04060E" opacity="0.75"/>
      <!-- Elegant White & Ink Body -->
      <path d="M24 34 Q18 52 32 52 Q46 52 40 34 Q36 26 32 26 Q28 26 24 34 Z" fill="#EDE3CF" stroke="#080B18" stroke-width="1.4"/>
      <!-- Ink-Tipped Wings -->
      <path d="M18 36 C10 40 8 48 14 52 C18 50 22 46 22 40 Z" fill="#1C2036" stroke="#080B18" stroke-width="1.2"/>
      <path d="M46 36 C54 40 56 48 50 52 C46 50 42 46 42 40 Z" fill="#1C2036" stroke="#080B18" stroke-width="1.2"/>
      <!-- Slender S-Curve Neck -->
      <path d="M32 26 Q30 16 33 11" fill="none" stroke="#EDE3CF" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M32 26 Q30 16 33 11" fill="none" stroke="#080B18" stroke-width="1.2"/>
      <!-- Head with Crimson Crown Seal -->
      <ellipse cx="34" cy="9" rx="4.5" ry="3.5" fill="#EDE3CF" stroke="#080B18" stroke-width="1"/>
      <circle cx="34" cy="7" r="2" fill="#C74B4B"/>
      <!-- Long Slender Beak holding Sealed Scroll -->
      <polygon points="38,9 50,11 38,13" fill="#D9822B" stroke="#080B18" stroke-width="0.8"/>
      <rect x="42" y="11" width="5" height="12" rx="1" fill="#FFF3D6" stroke="#C74B4B" stroke-width="0.8" transform="rotate(15 44 17)"/>
      <circle cx="45" cy="17" r="1.5" fill="#C74B4B"/>
    </svg>
  `,

  little_dragon: `
    <svg viewBox="0 0 64 64" class="svg-unit little-dragon">
      <!-- Contact Shadow -->
      <ellipse cx="32" cy="58" rx="17" ry="4" fill="#04060E" opacity="0.75"/>
      <!-- Coiling Celestial Serpentine Dragon in Jade and Gold -->
      <path d="M20 54 C14 44 18 34 26 32 C34 30 38 24 34 16 C30 10 38 6 42 10 C46 14 42 22 34 26 C26 30 22 40 28 48 C32 54 26 56 20 54 Z" fill="#2C6850" stroke="#080B18" stroke-width="1.4"/>
      <!-- Golden Belly Plates -->
      <path d="M23 52 C20 46 22 38 27 34" fill="none" stroke="#FFAE42" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M29 32 C34 30 36 24 33 18" fill="none" stroke="#FFAE42" stroke-width="2" stroke-linecap="round"/>
      <!-- Dragon Horns & Whiskers -->
      <path d="M43 8 L49 3 M44 10 L50 7" stroke="#FFAE42" stroke-width="1.3" stroke-linecap="round"/>
      <path d="M40 14 Q46 18 52 14" fill="none" stroke="#EDE3CF" stroke-width="1.2" stroke-linecap="round"/>
      <circle cx="40" cy="11" r="1.5" fill="#FFAE42"/>
      <!-- Flaming Celestial Pearl in Forepaw -->
      <circle cx="16" cy="38" r="4" fill="#FFAE42" stroke="#C74B4B" stroke-width="1"/>
      <circle cx="16" cy="38" r="2" fill="#FFF8E7"/>
    </svg>
  `,

  lantern_crafter: `
    <svg viewBox="0 0 64 64" class="svg-unit lantern-crafter">
      <!-- Contact Shadow -->
      <ellipse cx="32" cy="58" rx="18" ry="4" fill="#04060E" opacity="0.75"/>
      <!-- Diligent Craftsman in Heavy Leather Apron -->
      <path d="M18 34 Q14 54 32 54 Q50 54 46 34 Q40 26 32 26 Q24 26 18 34 Z" fill="#263156" stroke="#080B18" stroke-width="1.4"/>
      <path d="M22 34 L22 52 Q32 54 42 52 L42 34 Z" fill="#4A3423" stroke="#080B18" stroke-width="1.2"/>
      <!-- Craftsman Head with Goggles -->
      <ellipse cx="32" cy="20" rx="13" ry="11" fill="#BFA78A" stroke="#080B18" stroke-width="1.4"/>
      <rect x="23" y="16" width="18" height="5" rx="2" fill="#1C1824"/>
      <circle cx="26" cy="18.5" r="3" fill="#FFAE42" stroke="#080B18" stroke-width="1"/>
      <circle cx="38" cy="18.5" r="3" fill="#FFAE42" stroke="#080B18" stroke-width="1"/>
      <!-- Tongs holding Glowing Hexagonal Lantern Frame -->
      <line x1="40" y1="38" x2="48" y2="44" stroke="#7A8CAE" stroke-width="2"/>
      <polygon points="48,38 54,41 54,47 48,50 42,47 42,41" fill="#FFAE42" stroke="#080B18" stroke-width="1.2"/>
      <circle cx="48" cy="44" r="2.5" fill="#FFF8E7"/>
      <!-- Rising Sparks -->
      <circle cx="50" cy="34" r="0.8" fill="#FFAE42"/>
      <circle cx="45" cy="31" r="0.8" fill="#FFF8E7"/>
    </svg>
  `,

  fox_maiden: `
    <svg viewBox="0 0 64 64" class="svg-unit fox-maiden">
      <!-- Contact Shadow -->
      <ellipse cx="32" cy="58" rx="18" ry="4" fill="#04060E" opacity="0.75"/>
      <!-- Shrine Maiden Hakama & White Haori -->
      <path d="M20 34 Q14 55 32 55 Q50 55 44 34 Z" fill="#A83232" stroke="#080B18" stroke-width="1.4"/>
      <path d="M22 32 L32 44 L42 32 Z" fill="#EDE3CF" stroke="#080B18" stroke-width="1.2"/>
      <!-- Nine-Tails Fan behind silhouette -->
      <path d="M12 40 C6 30 14 24 18 30 M52 40 C58 30 50 24 46 30" fill="none" stroke="#EDE3CF" stroke-width="2.5" stroke-linecap="round"/>
      <!-- Graceful Fox Mask Face -->
      <ellipse cx="32" cy="20" rx="11" ry="10" fill="#EDE3CF" stroke="#080B18" stroke-width="1.3"/>
      <polygon points="22,15 25,5 30,13" fill="#A83232" stroke="#080B18" stroke-width="1"/>
      <polygon points="42,15 39,5 34,13" fill="#A83232" stroke="#080B18" stroke-width="1"/>
      <!-- Miko Mask Inscriptions & Amber Eyes -->
      <line x1="26" y1="19.5" x2="28" y2="19.5" stroke="#FFAE42" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="36" y1="19.5" x2="38" y2="19.5" stroke="#FFAE42" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M23 16 Q26 15 28 17 M41 16 Q38 15 36 17" fill="none" stroke="#C74B4B" stroke-width="1.2"/>
      <!-- Sacred Wooden Gohei Wand with Zigzag Streamers -->
      <line x1="42" y1="48" x2="48" y2="22" stroke="#4A3423" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M48 22 L52 25 L47 28 L51 31" fill="none" stroke="#EDE3CF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="16" cy="30" r="2.5" fill="#70C1B3" opacity="0.85"/>
    </svg>
  `,

  bear_baker: `
    <svg viewBox="0 0 64 64" class="svg-unit bear-baker">
      <!-- Contact Shadow -->
      <ellipse cx="32" cy="58" rx="20" ry="4.5" fill="#04060E" opacity="0.75"/>
      <!-- Sturdy Highland Moon Bear in Baker's Apron -->
      <path d="M16 34 Q12 55 32 55 Q52 55 48 34 Q40 26 32 26 Z" fill="#423024" stroke="#080B18" stroke-width="1.4"/>
      <path d="M22 34 L22 52 Q32 55 42 52 L42 34 Z" fill="#2B3654" stroke="#080B18" stroke-width="1.2"/>
      <!-- Crescent Moon mark on chest -->
      <path d="M28 36 Q32 40 36 36 Q32 38 28 36 Z" fill="#FFF3D6"/>
      <!-- Round Grounded Bear Head -->
      <ellipse cx="32" cy="20" rx="14" ry="12" fill="#543E2F" stroke="#080B18" stroke-width="1.4"/>
      <circle cx="19" cy="11" r="4.5" fill="#423024" stroke="#080B18" stroke-width="1.2"/>
      <circle cx="45" cy="11" r="4.5" fill="#423024" stroke="#080B18" stroke-width="1.2"/>
      <circle cx="26" cy="18" r="1.6" fill="#FFAE42"/>
      <circle cx="38" cy="18" r="1.6" fill="#FFAE42"/>
      <!-- Wooden Baker's Peel with Steaming Crescent Buns -->
      <line x1="38" y1="46" x2="52" y2="40" stroke="#3D291D" stroke-width="2" stroke-linecap="round"/>
      <ellipse cx="48" cy="39" rx="8" ry="4" fill="#C49A6C" stroke="#080B18" stroke-width="1" transform="rotate(-15 48 39)"/>
      <ellipse cx="48" cy="37" rx="4.5" ry="3" fill="#FFF3D6" stroke="#D9822B" stroke-width="0.8"/>
      <path d="M48 32 Q46 29 49 26" fill="none" stroke="#EDE3CF" stroke-width="1.2" stroke-linecap="round" opacity="0.8"/>
    </svg>
  `,

  // ================= ENEMIES (霧怪 - 11 ATMOSPHERIC YOKAI & SPIRITS) =================
  fog_blob: `
    <svg viewBox="0 0 64 64" class="svg-unit fog-blob">
      <!-- Contact Shadow -->
      <ellipse cx="32" cy="57" rx="18" ry="4" fill="#04060E" opacity="0.75"/>
      <!-- Swirling Midnight Mist Wraith -->
      <path d="M18 48 C10 40 14 26 26 20 C32 16 42 18 48 26 C54 36 48 48 36 50 C26 51 21 52 18 48 Z" fill="#18203E" stroke="#384978" stroke-width="1.4"/>
      <!-- Eerie Inner Phantom Shroud -->
      <path d="M22 44 C18 36 21 28 29 24 C37 20 44 26 42 35 C40 42 34 44 28 44 Z" fill="#0F142A"/>
      <!-- Hollow Cyan Spirit Sockets with glowing cores -->
      <ellipse cx="27" cy="30" rx="3.5" ry="4" fill="#0A0E20" stroke="#70C1B3" stroke-width="1"/>
      <ellipse cx="39" cy="30" rx="3.5" ry="4" fill="#0A0E20" stroke="#70C1B3" stroke-width="1"/>
      <circle cx="27" cy="30" r="1.5" fill="#70C1B3"/>
      <circle cx="39" cy="30" r="1.5" fill="#70C1B3"/>
      <!-- Drifting Mist Tendrils -->
      <path d="M16 42 Q10 48 14 54 M46 42 Q52 48 48 54" fill="none" stroke="#70C1B3" stroke-width="1.2" stroke-linecap="round" opacity="0.6"/>
    </svg>
  `,

  shadow_rat: `
    <svg viewBox="0 0 64 64" class="svg-unit shadow-rat">
      <!-- Contact Shadow -->
      <ellipse cx="32" cy="58" rx="20" ry="4" fill="#04060E" opacity="0.8"/>
      <!-- Hunched Predator Silhouette with Spiked Fur -->
      <path d="M14 48 C10 38 18 26 28 24 C36 22 46 26 52 38 C54 44 48 52 36 52 C24 52 18 52 14 48 Z" fill="#141829" stroke="#3B466B" stroke-width="1.3"/>
      <!-- Jagged Back Spikes -->
      <polygon points="26,24 28,17 32,24" fill="#080A14"/>
      <polygon points="36,24 39,16 42,25" fill="#080A14"/>
      <polygon points="45,28 49,21 48,30" fill="#080A14"/>
      <!-- Razor Claws on front paw -->
      <line x1="16" y1="48" x2="10" y2="52" stroke="#E85D5D" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="19" y1="49" x2="14" y2="54" stroke="#E85D5D" stroke-width="1.5" stroke-linecap="round"/>
      <!-- Snarl & Glowing Crimson Slit Eyes -->
      <polygon points="12,42 6,40 12,38" fill="#141829" stroke="#080B18" stroke-width="1"/>
      <polygon points="10,40 7,40 10,41" fill="#EDE3CF"/>
      <ellipse cx="20" cy="34" rx="2.5" ry="1.5" fill="#E85D5D" transform="rotate(-15 20 34)"/>
      <circle cx="20" cy="34" r="0.8" fill="#FFF2F2"/>
    </svg>
  `,

  paper_ghost: `
    <svg viewBox="0 0 64 64" class="svg-unit paper-ghost">
      <!-- Contact Shadow -->
      <ellipse cx="32" cy="58" rx="14" ry="3.5" fill="#04060E" opacity="0.75"/>
      <!-- Single Wooden Talon Peg Leg -->
      <line x1="32" y1="44" x2="32" y2="58" stroke="#3D291D" stroke-width="3" stroke-linecap="round"/>
      <line x1="32" y1="58" x2="26" y2="58" stroke="#3D291D" stroke-width="2.5" stroke-linecap="round"/>
      <!-- Karakasa Umbrella Body with torn ribbed paper -->
      <polygon points="32,6 8,42 56,42" fill="#202A48" stroke="#080B18" stroke-width="1.4" stroke-linejoin="round"/>
      <!-- Bamboo Ribs -->
      <line x1="32" y1="7" x2="14" y2="41" stroke="#3D4B75" stroke-width="1.2"/>
      <line x1="32" y1="7" x2="23" y2="41" stroke="#3D4B75" stroke-width="1.2"/>
      <line x1="32" y1="7" x2="41" y2="41" stroke="#3D4B75" stroke-width="1.2"/>
      <line x1="32" y1="7" x2="50" y2="41" stroke="#3D4B75" stroke-width="1.2"/>
      <!-- Huge Demonic Cyclops Eye -->
      <ellipse cx="32" cy="26" rx="8" ry="7" fill="#EDE3CF" stroke="#080B18" stroke-width="1.3"/>
      <circle cx="32" cy="26" r="4" fill="#C74B4B"/>
      <circle cx="32" cy="26" r="1.8" fill="#080B18"/>
      <!-- Long Demonic Tongue curling out -->
      <path d="M32 38 C32 46 24 46 22 52 C20 54 26 54 28 50 C32 44 34 40 32 38 Z" fill="#E85D5D" stroke="#080B18" stroke-width="1"/>
    </svg>
  `,

  hop_lantern: `
    <svg viewBox="0 0 64 64" class="svg-unit hop-lantern">
      <!-- Contact Shadow -->
      <ellipse cx="32" cy="58" rx="14" ry="3.5" fill="#04060E" opacity="0.75"/>
      <!-- Single Cursed Spring Leg -->
      <line x1="32" y1="44" x2="32" y2="58" stroke="#3D2B1C" stroke-width="3" stroke-linecap="round"/>
      <!-- Stone/Brass Pagoda Roof with Horns -->
      <polygon points="12,16 52,16 32,6" fill="#1C223A" stroke="#080B18" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M12 16 Q8 12 10 8 M52 16 Q56 12 54 8" stroke="#C084FC" stroke-width="1.8" stroke-linecap="round"/>
      <!-- Cracked Lantern Chamber -->
      <polygon points="18,16 46,16 41,44 23,44" fill="#283252" stroke="#080B18" stroke-width="1.4"/>
      <!-- Wicked Grinning Mouth with Purple Corpsefire -->
      <path d="M23 34 Q32 42 41 34 Q36 40 32 40 Q28 40 23 34 Z" fill="#A855F7" stroke="#080B18" stroke-width="1.2"/>
      <!-- Glowing Cursed Eyes -->
      <polygon points="25,24 29,22 27,27" fill="#C084FC"/>
      <polygon points="39,24 35,22 37,27" fill="#C084FC"/>
    </svg>
  `,

  armored_snail: `
    <svg viewBox="0 0 64 64" class="svg-unit armored-snail">
      <!-- Contact Shadow -->
      <ellipse cx="32" cy="57" rx="21" ry="4.5" fill="#04060E" opacity="0.8"/>
      <!-- Heavy Iron Pagoda Shell with Spikes -->
      <path d="M16 46 C10 28 24 14 40 16 C52 18 56 36 48 48 Z" fill="#2A334E" stroke="#080B18" stroke-width="1.5"/>
      <path d="M26 36 C24 28 32 23 38 25 C45 27 45 36 38 41 Z" fill="#1A2035" stroke="#4F6294" stroke-width="1.2"/>
      <!-- Pagoda Roof Iron Spikes -->
      <polygon points="32,15 35,8 39,16" fill="#080B18"/>
      <polygon points="45,20 51,14 50,23" fill="#080B18"/>
      <!-- Snail Foot & Menacing Eyestalks -->
      <path d="M10 50 Q26 53 54 50 Q48 46 36 46 Z" fill="#4B5E85" stroke="#080B18" stroke-width="1.3"/>
      <line x1="15" y1="46" x2="10" y2="36" stroke="#4B5E85" stroke-width="2" stroke-linecap="round"/>
      <circle cx="10" cy="35" r="2" fill="#E85D5D"/>
      <line x1="20" y1="46" x2="18" y2="34" stroke="#4B5E85" stroke-width="2" stroke-linecap="round"/>
      <circle cx="18" cy="33" r="2" fill="#E85D5D"/>
    </svg>
  `,

  split_mist: `
    <svg viewBox="0 0 64 64" class="svg-unit split-mist">
      <!-- Contact Shadow -->
      <ellipse cx="32" cy="56" rx="19" ry="4" fill="#04060E" opacity="0.65"/>
      <!-- Turbulent Dual Vortex -->
      <path d="M12 44 C8 28 18 18 26 22 C30 24 34 24 38 22 C46 18 56 28 52 44 C44 51 20 51 12 44 Z" fill="#1C2444" stroke="#44578A" stroke-width="1.4"/>
      <!-- Left & Right Spectral Visages -->
      <ellipse cx="23" cy="28" rx="4" ry="5" fill="#080B18" stroke="#70C1B3" stroke-width="0.9"/>
      <circle cx="23" cy="28" r="1.5" fill="#70C1B3"/>
      <ellipse cx="41" cy="28" rx="4" ry="5" fill="#080B18" stroke="#70C1B3" stroke-width="0.9"/>
      <circle cx="41" cy="28" r="1.5" fill="#70C1B3"/>
      <!-- Swirling Center Crevasse -->
      <path d="M32 24 Q30 36 32 46" fill="none" stroke="#080B18" stroke-width="2"/>
    </svg>
  `,

  windchime_spectre: `
    <svg viewBox="0 0 64 64" class="svg-unit windchime-spectre">
      <!-- Contact Shadow -->
      <ellipse cx="32" cy="58" rx="14" ry="3.5" fill="#04060E" opacity="0.55"/>
      <!-- Floating Funeral Shroud -->
      <path d="M22 20 C16 34 14 52 24 54 C30 50 34 54 40 54 C48 52 48 34 42 20 Z" fill="#242E52" stroke="#4E6092" stroke-width="1.4"/>
      <!-- Hollow Weeping Mask -->
      <ellipse cx="32" cy="20" rx="9" ry="8" fill="#10142A" stroke="#70C1B3" stroke-width="1.2"/>
      <circle cx="28" cy="19" r="2" fill="#70C1B3"/>
      <circle cx="36" cy="19" r="2" fill="#70C1B3"/>
      <!-- Rusted Iron Temple Chime with curse ribbons -->
      <line x1="32" y1="34" x2="32" y2="47" stroke="#D9822B" stroke-width="1.8"/>
      <polygon points="30,47 34,47 32,52" fill="#A855F7"/>
      <circle cx="32" cy="49" r="8" fill="none" stroke="#A855F7" stroke-width="1" stroke-dasharray="2,2" opacity="0.8"/>
    </svg>
  `,

  mud_golem: `
    <svg viewBox="0 0 64 64" class="svg-unit mud-golem">
      <!-- Contact Shadow -->
      <ellipse cx="32" cy="58" rx="21" ry="4.5" fill="#04060E" opacity="0.8"/>
      <!-- Bulky Riverbed Boulder & Bog Clay Monolith -->
      <path d="M14 34 Q10 55 32 55 Q54 55 50 34 Q44 20 32 20 Q20 20 14 34 Z" fill="#3D3732" stroke="#080B18" stroke-width="1.5"/>
      <!-- Moss Creepers & Clay Cracks -->
      <path d="M20 38 Q26 48 30 46 M38 36 Q44 44 46 48" fill="none" stroke="#3D7860" stroke-width="2.2" stroke-linecap="round"/>
      <!-- Carved Stone Brow & Amber Rune Fissures -->
      <polygon points="22,22 42,22 38,10 26,10" fill="#26221E" stroke="#080B18" stroke-width="1.4" stroke-linejoin="round"/>
      <line x1="25" y1="17" x2="29" y2="17" stroke="#FFAE42" stroke-width="2" stroke-linecap="round"/>
      <line x1="35" y1="17" x2="39" y2="17" stroke="#FFAE42" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `,

  boss_mother_of_mist: `
    <svg viewBox="0 0 64 64" class="svg-unit boss-mother-of-mist">
      <!-- Contact Shadow -->
      <ellipse cx="32" cy="58" rx="22" ry="4.5" fill="#04060E" opacity="0.85"/>
      <!-- Towering Empress Robes blending into mist -->
      <path d="M12 55 C16 36 22 22 32 22 C42 22 48 36 52 55 Q32 58 12 55 Z" fill="#141C38" stroke="#485E9E" stroke-width="1.5"/>
      <path d="M22 55 C26 40 30 28 32 28 C34 28 38 40 42 55 Z" fill="#0E1328"/>
      <!-- Ice Crystal Horns Crown -->
      <polygon points="32,6 26,18 38,18" fill="#70C1B3" stroke="#080B18" stroke-width="1.2"/>
      <polygon points="22,12 26,20 21,22" fill="#70C1B3" stroke="#080B18" stroke-width="1"/>
      <polygon points="42,12 38,20 43,22" fill="#70C1B3" stroke="#080B18" stroke-width="1"/>
      <!-- Celestial Mask with Cold Ghost Flame Gaze -->
      <ellipse cx="32" cy="20" rx="9" ry="8" fill="#EDE3CF" stroke="#080B18" stroke-width="1.3"/>
      <ellipse cx="28" cy="19" rx="2" ry="1.5" fill="#080B18"/>
      <ellipse cx="36" cy="19" rx="2" ry="1.5" fill="#080B18"/>
      <circle cx="28" cy="19" r="0.8" fill="#70C1B3"/>
      <circle cx="36" cy="19" r="0.8" fill="#70C1B3"/>
      <!-- Floating Cursed Bronze Mirrors -->
      <circle cx="12" cy="28" r="4.5" fill="#D9822B" stroke="#080B18" stroke-width="1.2"/>
      <circle cx="12" cy="28" r="2.5" fill="#70C1B3"/>
      <circle cx="52" cy="28" r="4.5" fill="#D9822B" stroke="#080B18" stroke-width="1.2"/>
      <circle cx="52" cy="28" r="2.5" fill="#70C1B3"/>
    </svg>
  `,

  boss_night_crow_king: `
    <svg viewBox="0 0 64 64" class="svg-unit boss-night-crow-king">
      <!-- Contact Shadow -->
      <ellipse cx="32" cy="58" rx="22" ry="4.5" fill="#04060E" opacity="0.85"/>
      <!-- Karasu Tengu Spanning Wings -->
      <path d="M6 38 C14 24 24 28 32 32 C40 28 50 24 58 38 C54 48 44 54 32 54 C20 54 10 48 6 38 Z" fill="#0E1222" stroke="#3A476E" stroke-width="1.4"/>
      <!-- Segmented Feather Armor -->
      <path d="M22 32 Q32 36 42 32 L39 50 Q32 52 25 50 Z" fill="#1C2442" stroke="#080B18" stroke-width="1.2"/>
      <!-- Carved Raven Skull Mask -->
      <ellipse cx="32" cy="19" rx="9" ry="8" fill="#EDE3CF" stroke="#080B18" stroke-width="1.3"/>
      <polygon points="28,20 36,20 32,30" fill="#D9822B" stroke="#080B18" stroke-width="1"/>
      <circle cx="28" cy="18" r="1.8" fill="#FFAE42"/>
      <circle cx="36" cy="18" r="1.8" fill="#FFAE42"/>
      <!-- Twin Curved Shadow Katanas -->
      <line x1="8" y1="52" x2="16" y2="28" stroke="#7A8CAE" stroke-width="2" stroke-linecap="round"/>
      <line x1="56" y1="52" x2="48" y2="28" stroke="#7A8CAE" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `,

  boss_elder_demon: `
    <svg viewBox="0 0 64 64" class="svg-unit boss-elder-demon">
      <!-- Contact Shadow -->
      <ellipse cx="32" cy="58" rx="23" ry="5" fill="#04060E" opacity="0.85"/>
      <!-- Colossal Bronze Temple Lantern Body -->
      <polygon points="12,18 52,18 44,52 20,52" fill="#2B2118" stroke="#080B18" stroke-width="1.5"/>
      <polygon points="8,18 56,18 32,4" fill="#1C1824" stroke="#080B18" stroke-width="1.5" stroke-linejoin="round"/>
      <!-- Hellfire Furnace Maw with Jagged Teeth -->
      <rect x="22" y="28" width="20" height="18" rx="2" fill="#080B18" stroke="#080B18" stroke-width="1.2"/>
      <polygon points="24,28 26,33 28,28 30,33 32,28 34,33 36,28 38,33 40,28" fill="#EDE3CF"/>
      <polygon points="24,46 26,41 28,46 30,41 32,46 34,41 36,46 38,41 40,46" fill="#EDE3CF"/>
      <!-- Blazing Hellfire Eye Core -->
      <circle cx="32" cy="37" r="5" fill="#E85D5D"/>
      <circle cx="32" cy="37" r="2.5" fill="#FFAE42"/>
      <!-- Heavy Iron Chains -->
      <line x1="16" y1="26" x2="16" y2="54" stroke="#7A8CAE" stroke-width="2" stroke-dasharray="3,2"/>
      <line x1="48" y1="26" x2="48" y2="54" stroke="#7A8CAE" stroke-width="2" stroke-dasharray="3,2"/>
    </svg>
  `,

  // ================= TOWN BUILDINGS (10 WOODBLOCK ARCHITECTURAL ILLUSTRATIONS) =================
  buildings: {
    bldg_watchtower: `
      <svg viewBox="0 0 64 64" class="svg-building">
        <rect width="64" height="64" rx="8" fill="#0E122A"/>
        <!-- Multi-tiered Watch Pavilion with Curved Eaves & Brazier Flame -->
        <polygon points="16,60 48,60 44,38 20,38" fill="#1C2444" stroke="#060914" stroke-width="1.4"/>
        <polygon points="12,38 52,38 46,22 18,22" fill="#242F56" stroke="#060914" stroke-width="1.4"/>
        <!-- Dual Upturned Tile Eaves -->
        <path d="M8 38 Q32 30 56 38 L48 34 Q32 28 16 34 Z" fill="#A83232" stroke="#060914" stroke-width="1.2"/>
        <path d="M12 22 Q32 14 52 22 L46 18 Q32 12 18 18 Z" fill="#A83232" stroke="#060914" stroke-width="1.2"/>
        <!-- Golden Brazier Beacon -->
        <polygon points="26,16 38,16 35,10 29,10" fill="#2A2038" stroke="#060914" stroke-width="1"/>
        <circle cx="32" cy="8" r="4.5" fill="#FFAE42"/>
        <circle cx="32" cy="8" r="2" fill="#FFF8E7"/>
        <!-- Lattice Window with warm glow -->
        <rect x="27" y="44" width="10" height="12" rx="1.5" fill="#FFAE42" stroke="#060914" stroke-width="1"/>
        <line x1="32" y1="44" x2="32" y2="56" stroke="#8C4E1A" stroke-width="1"/>
        <line x1="27" y1="50" x2="37" y2="50" stroke="#8C4E1A" stroke-width="1"/>
      </svg>
    `,
    bldg_courier: `
      <svg viewBox="0 0 64 64" class="svg-building">
        <rect width="64" height="64" rx="8" fill="#0E122A"/>
        <!-- Courier Post Station with Pigeon Roost & Message Flag -->
        <rect x="14" y="32" width="36" height="28" fill="#202A4C" stroke="#060914" stroke-width="1.4"/>
        <!-- Gabled Tile Roof with upturned wings -->
        <path d="M6 32 Q32 20 58 32 L50 26 Q32 16 14 26 Z" fill="#2A3C6E" stroke="#060914" stroke-width="1.3"/>
        <!-- Red Courier Flag Banner -->
        <line x1="44" y1="8" x2="44" y2="30" stroke="#4A3423" stroke-width="1.8"/>
        <polygon points="44,10 32,15 44,20" fill="#C74B4B" stroke="#060914" stroke-width="0.8"/>
        <!-- Pigeon Loft & Entrance -->
        <rect x="24" y="40" width="16" height="20" rx="2" fill="#FFAE42" stroke="#060914" stroke-width="1"/>
        <ellipse cx="24" cy="22" rx="4" ry="2.5" fill="#EDE3CF" stroke="#060914" stroke-width="0.8"/>
      </svg>
    `,
    bldg_music_hall: `
      <svg viewBox="0 0 64 64" class="svg-building">
        <rect width="64" height="64" rx="8" fill="#0E122A"/>
        <!-- Overwater Gazebo Pavilion on Lotus Pond with Biwa -->
        <ellipse cx="32" cy="56" rx="26" ry="6" fill="#143228" stroke="#060914" stroke-width="1.2"/>
        <line x1="16" y1="28" x2="16" y2="56" stroke="#060914" stroke-width="2.5"/>
        <line x1="48" y1="28" x2="48" y2="56" stroke="#060914" stroke-width="2.5"/>
        <!-- Hexagonal Ornate Pavilion Roof -->
        <path d="M6 28 Q32 16 58 28 L50 22 Q32 10 14 22 Z" fill="#C47D3B" stroke="#060914" stroke-width="1.4"/>
        <circle cx="32" cy="10" r="3.5" fill="#FFAE42"/>
        <!-- Biwa Lute silhouette resting inside warm interior -->
        <rect x="22" y="32" width="20" height="24" fill="#202A4E"/>
        <ellipse cx="32" cy="46" rx="5" ry="7" fill="#FFAE42"/>
        <line x1="32" y1="36" x2="32" y2="52" stroke="#4A2810" stroke-width="1.2"/>
      </svg>
    `,
    bldg_fox_shrine: `
      <svg viewBox="0 0 64 64" class="svg-building">
        <rect width="64" height="64" rx="8" fill="#0E122A"/>
        <!-- Grand Sacred Torii Gate with Shimenawa & Foxfire -->
        <line x1="8" y1="18" x2="56" y2="18" stroke="#C74B4B" stroke-width="5" stroke-linecap="round"/>
        <line x1="12" y1="24" x2="52" y2="24" stroke="#C74B4B" stroke-width="2.5"/>
        <line x1="18" y1="18" x2="18" y2="60" stroke="#060914" stroke-width="3.5"/>
        <line x1="46" y1="18" x2="46" y2="60" stroke="#060914" stroke-width="3.5"/>
        <!-- Shimenawa Rope with white shide paper -->
        <path d="M18 27 Q32 31 46 27" fill="none" stroke="#D4AF67" stroke-width="2"/>
        <polygon points="26,30 29,36 27,38" fill="#EDE3CF"/>
        <polygon points="37,30 40,36 38,38" fill="#EDE3CF"/>
        <!-- Spirit Fox Lantern in Sanctuary -->
        <circle cx="32" cy="45" r="7" fill="#FFAE42"/>
        <circle cx="32" cy="45" r="3.5" fill="#FFF8E7"/>
      </svg>
    `,
    bldg_bakery: `
      <svg viewBox="0 0 64 64" class="svg-building">
        <rect width="64" height="64" rx="8" fill="#0E122A"/>
        <!-- Timber Hearth Bakery with Brick Oven Chimney -->
        <rect x="12" y="26" width="40" height="34" rx="2" fill="#263156" stroke="#060914" stroke-width="1.4"/>
        <path d="M6 26 Q32 14 58 26 L50 20 Q32 8 14 20 Z" fill="#C47D3B" stroke="#060914" stroke-width="1.4"/>
        <!-- Chimney with fragrant steam -->
        <rect x="42" y="10" width="7" height="14" fill="#4B3A2F" stroke="#060914" stroke-width="1"/>
        <path d="M45 8 Q43 4 47 2" fill="none" stroke="#EDE3CF" stroke-width="1.5" stroke-linecap="round" opacity="0.8"/>
        <!-- Glowing Hearth with Golden Buns -->
        <ellipse cx="32" cy="44" rx="10" ry="8" fill="#FFAE42"/>
        <ellipse cx="32" cy="43" rx="5" ry="3.5" fill="#FFF3D6"/>
      </svg>
    `,
    bldg_tea_bush: `
      <svg viewBox="0 0 64 64" class="svg-building">
        <rect width="64" height="64" rx="8" fill="#0E122A"/>
        <!-- Gnarled Ancient Tea Bonsai Tree with Stone Lantern -->
        <path d="M28 58 Q30 42 26 34 Q34 32 38 42 Q40 54 44 58 Z" fill="#422E1F" stroke="#060914" stroke-width="1.3"/>
        <!-- Dense Jade Foliage Clouds -->
        <circle cx="20" cy="30" r="11" fill="#24543C" stroke="#060914" stroke-width="1.2"/>
        <circle cx="34" cy="24" r="13" fill="#357856" stroke="#060914" stroke-width="1.2"/>
        <circle cx="46" cy="32" r="10" fill="#24543C" stroke="#060914" stroke-width="1.2"/>
        <!-- Hanging Bronze Windbells & Steaming Teacup -->
        <circle cx="20" cy="40" r="2.5" fill="#FFAE42"/>
        <circle cx="46" cy="40" r="2.5" fill="#FFAE42"/>
        <ellipse cx="32" cy="54" rx="6" ry="3" fill="#EDE3CF" stroke="#060914" stroke-width="1"/>
      </svg>
    `,
    bldg_forge: `
      <svg viewBox="0 0 64 64" class="svg-building">
        <rect width="64" height="64" rx="8" fill="#0E122A"/>
        <!-- Blacksmith Forge with Charcoal Hearth & Anvil -->
        <rect x="12" y="28" width="40" height="32" fill="#252434" stroke="#060914" stroke-width="1.4"/>
        <path d="M6 28 Q32 16 58 28 L50 22 Q32 10 14 22 Z" fill="#784D35" stroke="#060914" stroke-width="1.4"/>
        <!-- Glowing Charcoal Hearth -->
        <ellipse cx="26" cy="44" rx="8" ry="6" fill="#E85D5D"/>
        <circle cx="26" cy="44" r="3.5" fill="#FFAE42"/>
        <!-- Heavy Iron Anvil -->
        <polygon points="36,46 48,46 44,52 40,52 38,58 34,58 34,50" fill="#6A7A9E" stroke="#060914" stroke-width="1"/>
      </svg>
    `,
    bldg_lucky_stone: `
      <svg viewBox="0 0 64 64" class="svg-building">
        <rect width="64" height="64" rx="8" fill="#0E122A"/>
        <!-- Ancient Moss-Covered Stone Pagoda Lantern -->
        <ellipse cx="32" cy="58" rx="20" ry="4" fill="#04060E" opacity="0.6"/>
        <polygon points="18,58 46,58 42,48 22,48" fill="#252F4E" stroke="#060914" stroke-width="1.3"/>
        <rect x="28" y="34" width="8" height="14" fill="#1C243E" stroke="#060914" stroke-width="1.2"/>
        <!-- Hexagonal Lantern Chamber with Jade Glow -->
        <polygon points="18,34 46,34 42,22 22,22" fill="#252F4E" stroke="#060914" stroke-width="1.3"/>
        <circle cx="32" cy="28" r="4.5" fill="#70C1B3"/>
        <circle cx="32" cy="28" r="2" fill="#FFF8E7"/>
        <polygon points="14,22 50,22 32,10" fill="#34426E" stroke="#060914" stroke-width="1.4"/>
        <circle cx="32" cy="8" r="3" fill="#FFAE42"/>
      </svg>
    `,
    bldg_herbal_garden: `
      <svg viewBox="0 0 64 64" class="svg-building">
        <rect width="64" height="64" rx="8" fill="#0E122A"/>
        <!-- Terraced Jade Medicinal Herb Garden with Shishi-odoshi -->
        <path d="M10 58 Q32 54 54 58 L54 48 Q32 44 10 48 Z" fill="#183E34" stroke="#060914" stroke-width="1.2"/>
        <path d="M14 48 Q32 44 50 48 L50 38 Q32 34 14 38 Z" fill="#245648" stroke="#060914" stroke-width="1.2"/>
        <!-- Herbal Medicinal Plants with Celadon Leaves -->
        <path d="M20 38 Q24 28 20 20 M32 34 Q36 24 32 16 M44 38 Q48 28 44 20" fill="none" stroke="#70C1B3" stroke-width="2.5" stroke-linecap="round"/>
        <!-- Bamboo Water Conduit -->
        <line x1="24" y1="26" x2="40" y2="34" stroke="#D4AF67" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
    `,
    bldg_star_pavilion: `
      <svg viewBox="0 0 64 64" class="svg-building">
        <rect width="64" height="64" rx="8" fill="#0E122A"/>
        <!-- Multi-tiered Celestial Observatory with Astrolabe -->
        <polygon points="14,60 50,60 46,38 18,38" fill="#1F264C" stroke="#060914" stroke-width="1.3"/>
        <polygon points="12,38 52,38 32,24" fill="#4B2D7E" stroke="#060914" stroke-width="1.4"/>
        <circle cx="32" cy="14" r="9" fill="none" stroke="#FFAE42" stroke-width="1.5"/>
        <circle cx="32" cy="14" r="4" fill="#FFAE42"/>
        <!-- Glowing Balcony Windows -->
        <rect x="25" y="44" width="14" height="12" rx="1.5" fill="#FFAE42" stroke="#060914" stroke-width="1"/>
      </svg>
    `
  },

  // ================= LANTERNS (燈籠台 - 3 STATES) =================
  lantern_full: `
    <svg viewBox="0 0 48 48" class="svg-lantern lantern-full">
      <defs>
        <radialGradient id="lanternFullGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#FFAE42" stop-opacity="0.95" />
          <stop offset="40%" stop-color="#F2B45A" stop-opacity="0.6" />
          <stop offset="100%" stop-color="#FFAE42" stop-opacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="24" cy="45" rx="16" ry="3" fill="#04060E" opacity="0.8" />
      <circle cx="24" cy="24" r="20" fill="url(#lanternFullGlow)" />
      <polygon points="16,45 32,45 30,38 18,38" fill="#2E3A5A" stroke="#080B18" stroke-width="1.2" />
      <rect x="22" y="34" width="4" height="5" fill="#1E2540" />
      <rect x="14" y="14" width="20" height="20" rx="3" fill="#FFF2D4" stroke="#080B18" stroke-width="1.3" />
      <line x1="24" y1="14" x2="24" y2="34" stroke="#D9822B" stroke-width="1.3" />
      <line x1="14" y1="24" x2="34" y2="24" stroke="#D9822B" stroke-width="1.3" />
      <polygon points="6,15 42,15 34,7 14,7" fill="#1E2540" stroke="#080B18" stroke-width="1.3" stroke-linejoin="round" />
      <circle cx="24" cy="6" r="2.2" fill="#FFAE42" />
    </svg>
  `,

  lantern_damaged: `
    <svg viewBox="0 0 48 48" class="svg-lantern lantern-damaged">
      <ellipse cx="24" cy="45" rx="16" ry="3" fill="#04060E" opacity="0.7" />
      <circle cx="24" cy="24" r="14" fill="#FFAE42" opacity="0.35" />
      <polygon points="16,45 32,45 30,38 18,38" fill="#2E3A5A" stroke="#080B18" stroke-width="1.2" />
      <rect x="22" y="34" width="4" height="5" fill="#1E2540" />
      <rect x="14" y="14" width="20" height="20" rx="3" fill="#D9822B" stroke="#080B18" stroke-width="1.3" />
      <path d="M19 14 L24 24 L21 34" stroke="#080B18" stroke-width="1.2" fill="none" />
      <polygon points="6,15 42,15 34,7 14,7" fill="#1E2540" stroke="#080B18" stroke-width="1.3" />
      <circle cx="24" cy="6" r="2" fill="#D9822B" />
    </svg>
  `,

  lantern_extinguished: `
    <svg viewBox="0 0 48 48" class="svg-lantern lantern-extinguished">
      <ellipse cx="24" cy="45" rx="16" ry="3" fill="#04060E" opacity="0.7" />
      <polygon points="17,45 31,45 29,39 19,39" fill="#1C2134" stroke="#080B18" stroke-width="1.2" />
      <rect x="22" y="35" width="4" height="5" fill="#141828" />
      <rect x="15" y="15" width="18" height="19" rx="3" fill="#282F45" stroke="#080B18" stroke-width="1.3" />
      <polygon points="8,15 40,15 32,8 16,8" fill="#141828" stroke="#080B18" stroke-width="1.3" />
    </svg>
  `,

  // ================= TERRAINS (地形 - 4 TERRAINS) =================
  terrains: {
    bamboo: `
      <svg viewBox="0 0 64 64" class="svg-terrain terrain-bamboo">
        <line x1="20" y1="62" x2="20" y2="10" stroke="#254832" stroke-width="4" stroke-linecap="round"/>
        <line x1="32" y1="62" x2="32" y2="6" stroke="#325E41" stroke-width="4.5" stroke-linecap="round"/>
        <line x1="44" y1="62" x2="44" y2="14" stroke="#254832" stroke-width="4" stroke-linecap="round"/>
        <path d="M32 20 Q42 16 48 20" fill="none" stroke="#52B788" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M32 30 Q22 26 16 30" fill="none" stroke="#52B788" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
    `,
    water: `
      <svg viewBox="0 0 64 64" class="svg-terrain terrain-water">
        <rect width="64" height="64" fill="#101C35" opacity="0.8"/>
        <path d="M4 20 Q18 14 32 20 T60 20" fill="none" stroke="#5B8C85" stroke-width="2" stroke-linecap="round" opacity="0.8"/>
        <path d="M8 40 Q22 34 36 40 T58 40" fill="none" stroke="#70C1B3" stroke-width="1.8" stroke-linecap="round" opacity="0.7"/>
      </svg>
    `,
    post: `
      <svg viewBox="0 0 64 64" class="svg-terrain terrain-post">
        <ellipse cx="32" cy="52" rx="22" ry="8" fill="#1C223A" stroke="#3A487B" stroke-width="1.4"/>
        <rect x="26" y="24" width="12" height="28" fill="#283458" stroke="#080B18" stroke-width="1.2"/>
        <polygon points="18,24 46,24 40,16 24,16" fill="#38497B" stroke="#080B18" stroke-width="1.2"/>
      </svg>
    `,
    fog: `
      <svg viewBox="0 0 64 64" class="svg-terrain terrain-fog">
        <rect width="64" height="64" fill="#161D3B" opacity="0.5"/>
        <path d="M0 24 Q32 16 64 24 L64 48 Q32 56 0 48 Z" fill="#8FA3C7" opacity="0.2"/>
      </svg>
    `
  },

  // ================= TITLE KEY ART (EXACT 390x844 FULL PANORAMA POSTER) =================
  titleKeyArt: `
    <svg viewBox="0 0 390 844" class="svg-title-key-art" preserveAspectRatio="none">
      <defs>
        <linearGradient id="nightSkyFull" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#040612"/>
          <stop offset="35%" stop-color="#0B1028"/>
          <stop offset="70%" stop-color="#141C40"/>
          <stop offset="100%" stop-color="#080A18"/>
        </linearGradient>
        <radialGradient id="moonGlowFull" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#FFF8E7" stop-opacity="1"/>
          <stop offset="40%" stop-color="#FFAE42" stop-opacity="0.5"/>
          <stop offset="100%" stop-color="#FFAE42" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="titleLanternGlowFull" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#FFAE42" stop-opacity="0.95"/>
          <stop offset="50%" stop-color="#D9822B" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="#FFAE42" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <!-- Deep Sky Backdrop -->
      <rect width="390" height="844" fill="url(#nightSkyFull)"/>
      <!-- Glowing Crescent Moon -->
      <circle cx="290" cy="110" r="32" fill="url(#moonGlowFull)"/>
      <path d="M296 85 C282 89 272 103 275 119 C278 133 292 141 306 135 C288 137 278 121 282 107 C285 95 292 89 296 85 Z" fill="#FFF3D6"/>
      <!-- Starry Sky -->
      <circle cx="45" cy="80" r="1.2" fill="#EDE3CF" opacity="0.8"/>
      <circle cx="110" cy="65" r="1.5" fill="#FFAE42" opacity="0.9"/>
      <circle cx="180" cy="95" r="1" fill="#EDE3CF" opacity="0.7"/>
      <circle cx="230" cy="70" r="1.3" fill="#EDE3CF" opacity="0.8"/>
      <circle cx="340" cy="140" r="1.1" fill="#FFAE42" opacity="0.85"/>
      <!-- Mountain Ridges -->
      <path d="M0 240 Q100 190 200 230 T390 200 L390 844 L0 844 Z" fill="#0A0E22" opacity="0.95"/>
      <!-- Pagoda Town Skyline Silhouettes -->
      <path d="M0 320 L30 300 L40 300 L45 290 L50 300 L60 300 L90 320 L150 295 L160 295 L165 285 L170 295 L180 295 L220 320 L270 300 L280 300 L285 290 L290 300 L300 300 L340 320 L390 310 L390 844 L0 844 Z" fill="#101530"/>
      <!-- Warm Window Lights -->
      <rect x="42" y="315" width="8" height="8" rx="1.5" fill="#FFAE42" opacity="0.85"/>
      <rect x="162" y="310" width="8" height="8" rx="1.5" fill="#FFAE42" opacity="0.9"/>
      <rect x="282" y="315" width="8" height="8" rx="1.5" fill="#FFAE42" opacity="0.85"/>
      <!-- Hanging Festival Lantern Strings -->
      <path d="M20 290 Q100 330 180 285 Q260 325 340 285" fill="none" stroke="#2B3658" stroke-width="1.4"/>
      <circle cx="65" cy="308" r="9" fill="url(#titleLanternGlowFull)"/>
      <rect x="62" y="303" width="6" height="9" rx="1.5" fill="#FFAE42"/>
      <circle cx="125" cy="312" r="9" fill="url(#titleLanternGlowFull)"/>
      <rect x="122" y="307" width="6" height="9" rx="1.5" fill="#FFAE42"/>
      <circle cx="215" cy="308" r="9" fill="url(#titleLanternGlowFull)"/>
      <rect x="212" y="303" width="6" height="9" rx="1.5" fill="#FFAE42"/>
      <circle cx="285" cy="305" r="9" fill="url(#titleLanternGlowFull)"/>
      <rect x="282" y="300" width="6" height="9" rx="1.5" fill="#FFAE42"/>
      <!-- Foreground Hero Sacred Town Lantern Post -->
      <g transform="translate(145, 175)">
        <circle cx="50" cy="50" r="48" fill="url(#titleLanternGlowFull)"/>
        <polygon points="28,95 72,95 66,78 34,78" fill="#2A3554" stroke="#080B18" stroke-width="1.8"/>
        <rect x="47" y="70" width="6" height="10" fill="#1A2035"/>
        <rect x="28" y="28" width="44" height="44" rx="6" fill="#FFF2D4" stroke="#080B18" stroke-width="2"/>
        <line x1="50" y1="28" x2="50" y2="72" stroke="#D9822B" stroke-width="2.2"/>
        <line x1="28" y1="50" x2="72" y2="50" stroke="#D9822B" stroke-width="2.2"/>
        <polygon points="10,30 90,30 72,14 28,14" fill="#1C2440" stroke="#080B18" stroke-width="2.2" stroke-linejoin="round"/>
        <circle cx="50" cy="11" r="5" fill="#FFAE42"/>
      </g>
    </svg>
  `,

  titleBackdrop: ``,
  skyline: `
    <svg viewBox="0 0 374 90" class="svg-skyline-backdrop" preserveAspectRatio="none">
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#050714"/>
          <stop offset="60%" stop-color="#0D122C"/>
          <stop offset="100%" stop-color="#141938"/>
        </linearGradient>
      </defs>
      <rect width="374" height="90" fill="url(#skyGrad)"/>
      <circle cx="28" cy="18" r="1" fill="#EDE3CF" opacity="0.8"/>
      <circle cx="75" cy="10" r="1.2" fill="#FFAE42" opacity="0.9"/>
      <circle cx="140" cy="14" r="0.8" fill="#EDE3CF" opacity="0.7"/>
      <circle cx="210" cy="8" r="1.1" fill="#EDE3CF" opacity="0.8"/>
      <circle cx="330" cy="18" r="14" fill="#FFAE42" opacity="0.15"/>
      <path d="M336 8 C326 11 320 20 322 30 C324 38 332 44 340 40 C328 42 322 32 324 22 C326 14 332 10 336 8 Z" fill="#FFF3D6"/>
      <path d="M0 65 L40 55 L70 68 L120 50 L180 72 L230 52 L280 70 L330 55 L374 65 L374 90 L0 90 Z" fill="#0A0E24"/>
      <rect x="68" y="72" width="5" height="5" rx="1" fill="#FFAE42" opacity="0.85"/>
      <rect x="228" y="68" width="5" height="5" rx="1" fill="#FFAE42" opacity="0.8"/>
    </svg>
  `,

  // ================= REFINED ICONS =================
  icons: {
    home: `<svg viewBox="0 0 24 24" class="svg-icon" style="width:20px;height:20px;"><path d="M3 11 L12 3 L21 11 L21 21 L15 21 L15 14 L9 14 L9 21 L3 21 Z" fill="#242B4D" stroke="#EDE3CF" stroke-width="1.8" stroke-linejoin="round"/></svg>`,
    coin: `<svg viewBox="0 0 24 24" class="svg-icon" style="width:16px;height:16px;"><circle cx="12" cy="12" r="9" fill="#FFAE42" stroke="#101326" stroke-width="1.5"/><rect x="9.5" y="9.5" width="5" height="5" fill="#141938" stroke="#FFAE42" stroke-width="1"/></svg>`,
    star: `<svg viewBox="0 0 24 24" class="svg-icon" style="width:18px;height:18px;"><polygon points="12,2 15,9 22,12 15,15 12,22 9,15 2,12 9,9" fill="#FFAE42" stroke="#101326" stroke-width="1.2" stroke-linejoin="round"/></svg>`,
    undo: `<svg viewBox="0 0 24 24" class="svg-icon" style="width:20px;height:20px;"><path d="M8 8 L3 12 L8 16" fill="none" stroke="#EDE3CF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 12 Q12 10 18 14 Q21 16 21 20" fill="none" stroke="#EDE3CF" stroke-width="2" stroke-linecap="round"/></svg>`,
    music: `<svg viewBox="0 0 24 24" class="svg-icon" style="width:20px;height:20px;"><path d="M9 18 A3 3 0 1 1 6 15 L6 4 L18 2 L18 14 A3 3 0 1 1 15 11" fill="#EDE3CF"/></svg>`,
    sfx: `<svg viewBox="0 0 24 24" class="svg-icon" style="width:20px;height:20px;"><path d="M12 3 C8 3 6 8 6 13 L4 16 L20 16 L18 13 C18 8 16 3 12 3 Z" fill="#FFAE42" stroke="#101326" stroke-width="1.5"/><circle cx="12" cy="19" r="2" fill="#EDE3CF"/></svg>`,
    lantern: `<svg viewBox="0 0 24 24" class="svg-icon" style="width:20px;height:20px;"><rect x="7" y="6" width="10" height="12" rx="3" fill="#FFAE42" stroke="#101326" stroke-width="1.5"/><line x1="12" y1="2" x2="12" y2="6" stroke="#101326" stroke-width="1.5"/><line x1="12" y1="18" x2="12" y2="22" stroke="#C74B4B" stroke-width="1.5"/></svg>`,
    moon: `<svg viewBox="0 0 24 24" class="svg-icon" style="width:20px;height:20px;"><path d="M14 3 C7 4 4 11 7 18 C10 22 17 23 21 18 C13 18 10 11 14 3 Z" fill="#FFF3D6" stroke="#101326" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
    town: `<svg viewBox="0 0 24 24" class="svg-icon" style="width:20px;height:20px;"><polygon points="3,11 7,7 11,11" fill="#C74B4B" stroke="#101326" stroke-width="1.2"/><rect x="4" y="11" width="6" height="8" fill="#EDE3CF" stroke="#101326" stroke-width="1.2"/><polygon points="13,9 18,4 23,9" fill="#52B788" stroke="#101326" stroke-width="1.2"/><rect x="14" y="9" width="8" height="10" fill="#EDE3CF" stroke="#101326" stroke-width="1.2"/></svg>`,
    book: `<svg viewBox="0 0 24 24" class="svg-icon" style="width:20px;height:20px;"><path d="M4 19 C7 18 10 18 12 20 C14 18 17 18 20 19 L20 5 C17 4 14 4 12 6 C10 4 7 4 4 5 Z" fill="#EDE3CF" stroke="#101326" stroke-width="1.5" stroke-linejoin="round"/><line x1="12" y1="6" x2="12" y2="20" stroke="#101326" stroke-width="1.5"/></svg>`,
    tea: `<svg viewBox="0 0 24 24" class="svg-icon" style="width:20px;height:20px;"><path d="M4 8 Q12 6 20 8 Q19 18 12 18 Q5 18 4 8 Z" fill="#52B788" stroke="#101326" stroke-width="1.5"/><line x1="6" y1="20" x2="18" y2="20" stroke="#101326" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    sword: `<svg viewBox="0 0 24 24" class="svg-icon" style="width:20px;height:20px;"><line x1="4" y1="20" x2="17" y2="7" stroke="#EDE3CF" stroke-width="2" stroke-linecap="round"/><polygon points="17,7 20,4 21,5 18,8" fill="#8FA3C7"/><line x1="6" y1="15" x2="9" y2="18" stroke="#EDE3CF" stroke-width="1.8"/></svg>`,
    boss: `<svg viewBox="0 0 24 24" class="svg-icon" style="width:20px;height:20px;"><polygon points="3,17 4,7 8,11 12,5 16,11 20,7 21,17" fill="#C74B4B" stroke="#101326" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
    hotspring: `<svg viewBox="0 0 24 24" class="svg-icon" style="width:20px;height:20px;"><ellipse cx="12" cy="18" rx="9" ry="4" fill="#5B8C85" stroke="#101326" stroke-width="1.5"/><path d="M8 12 Q9 9 8 6 M12 12 Q13 9 12 6 M16 12 Q17 9 16 6" fill="none" stroke="#70C1B3" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    shrine: `<svg viewBox="0 0 24 24" class="svg-icon" style="width:20px;height:20px;"><line x1="3" y1="6" x2="21" y2="6" stroke="#C74B4B" stroke-width="2.5" stroke-linecap="round"/><line x1="5" y1="8" x2="19" y2="8" stroke="#C74B4B" stroke-width="1.5"/><line x1="7" y1="6" x2="7" y2="20" stroke="#101326" stroke-width="2"/><line x1="17" y1="6" x2="17" y2="20" stroke="#101326" stroke-width="2"/></svg>`,
    attack: `<svg viewBox="0 0 16 16" style="width:14px;height:14px;vertical-align:middle;"><path d="M2 14 L12 4 M9 3 L13 3 L13 7" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/></svg>`,
    move: `<svg viewBox="0 0 16 16" style="width:14px;height:14px;vertical-align:middle;"><path d="M8 2 L8 14 M4 10 L8 14 L12 10" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/></svg>`,
    spawn: `<svg viewBox="0 0 16 16" style="width:14px;height:14px;vertical-align:middle;"><circle cx="8" cy="8" r="4" fill="#E86363" stroke="#FFFFFF" stroke-width="1.5"/><circle cx="4" cy="5" r="2" fill="#E86363"/><circle cx="12" cy="5" r="2" fill="#E86363"/></svg>`,
    aoe: `<svg viewBox="0 0 16 16" style="width:14px;height:14px;vertical-align:middle;"><polygon points="8,1 10,6 15,8 10,10 8,15 6,10 1,8 6,6" fill="#FFAE42" stroke="#101326" stroke-width="1"/></svg>`,
    frozen: `<svg viewBox="0 0 16 16" style="width:14px;height:14px;vertical-align:middle;"><line x1="8" y1="2" x2="8" y2="14" stroke="#70C1B3" stroke-width="2"/><line x1="2" y1="8" x2="14" y2="8" stroke="#70C1B3" stroke-width="2"/></svg>`,
    check: `<svg viewBox="0 0 16 16" style="width:14px;height:14px;vertical-align:middle;"><path d="M3 8 L6 11 L13 4" fill="none" stroke="#52B788" stroke-width="2" stroke-linecap="round"/></svg>`
  },

  // ================= CARD ART (AUTHENTIC WOODBLOCK ILLUSTRATIONS) =================
  cardArt: {
    // Commands: Charging martial scout, spirit ribbons, standard horn, dual crossed blades, tai-chi formation
    card_command_advance: `<svg viewBox="0 0 64 64" class="svg-card-art"><defs><linearGradient id="advGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#141E3C"/><stop offset="100%" stop-color="#243460"/></linearGradient></defs><rect width="64" height="64" rx="7" fill="url(#advGrad)"/><path d="M8 48 C16 46 22 40 28 32 C34 24 40 18 52 14" fill="none" stroke="#FFAE42" stroke-width="3" stroke-linecap="round"/><polygon points="56,12 44,14 50,22" fill="#FFAE42"/><path d="M12 54 L36 30 M22 56 L46 32" stroke="#FFF3D6" stroke-width="1.8" stroke-linecap="round" opacity="0.6"/><circle cx="28" cy="32" r="3" fill="#FFF3D6"/></svg>`,
    card_command_reposition: `<svg viewBox="0 0 64 64" class="svg-card-art"><rect width="64" height="64" rx="7" fill="#182242"/><path d="M16 32 C16 18 48 18 48 32 C48 46 16 46 16 32 Z" fill="none" stroke="#70C1B3" stroke-width="2.5"/><polygon points="48,25 55,32 48,39" fill="#70C1B3"/><polygon points="16,39 9,32 16,25" fill="#70C1B3"/><circle cx="32" cy="32" r="4" fill="#FFAE42"/></svg>`,
    card_command_rally: `<svg viewBox="0 0 64 64" class="svg-card-art"><rect width="64" height="64" rx="7" fill="#241E34"/><line x1="20" y1="54" x2="20" y2="10" stroke="#EDE3CF" stroke-width="2.8" stroke-linecap="round"/><polygon points="20,12 50,22 20,32" fill="#C74B4B" stroke="#EDE3CF" stroke-width="1.5"/><circle cx="20" cy="10" r="2.8" fill="#FFAE42"/><circle cx="38" cy="42" r="8" fill="none" stroke="#FFAE42" stroke-width="1.5" stroke-dasharray="2,2"/><circle cx="38" cy="42" r="14" fill="none" stroke="#FFAE42" stroke-width="1.2" stroke-dasharray="3,3" opacity="0.5"/></svg>`,
    card_command_strike_again: `<svg viewBox="0 0 64 64" class="svg-card-art"><rect width="64" height="64" rx="7" fill="#2A1B28"/><line x1="14" y1="50" x2="50" y2="14" stroke="#EDE3CF" stroke-width="3" stroke-linecap="round"/><line x1="50" y1="50" x2="14" y2="14" stroke="#EDE3CF" stroke-width="3" stroke-linecap="round"/><circle cx="32" cy="32" r="6" fill="#FFAE42"/><circle cx="32" cy="32" r="3" fill="#FFF3D6"/></svg>`,
    card_command_tactical_swap: `<svg viewBox="0 0 64 64" class="svg-card-art"><rect width="64" height="64" rx="7" fill="#1A2840"/><circle cx="32" cy="32" r="19" fill="none" stroke="#FFAE42" stroke-width="2" stroke-dasharray="4,3"/><circle cx="23" cy="32" r="5" fill="#70C1B3"/><circle cx="41" cy="32" r="5" fill="#C74B4B"/><path d="M23 23 Q32 16 41 23" fill="none" stroke="#FFAE42" stroke-width="2" stroke-linecap="round"/><path d="M41 41 Q32 48 23 41" fill="none" stroke="#FFAE42" stroke-width="2" stroke-linecap="round"/></svg>`,

    // Spells: Wind palm with bamboo leaves, sacred fireball core, talisman hex barrier, cyclone vortex, frost star, bamboo tripwire, golden rain ripples, purple thunder bolt
    card_spell_gust: `<svg viewBox="0 0 64 64" class="svg-card-art"><rect width="64" height="64" rx="7" fill="#162B34"/><path d="M10 24 Q32 12 46 22 T54 36" fill="none" stroke="#70C1B3" stroke-width="3.2" stroke-linecap="round"/><path d="M8 38 Q28 26 42 34 T56 46" fill="none" stroke="#EDE3CF" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="24" cy="20" rx="5" ry="2.5" fill="#52B788" transform="rotate(-15 24 20)"/><ellipse cx="40" cy="40" rx="5" ry="2.5" fill="#52B788" transform="rotate(12 40 40)"/></svg>`,
    card_spell_fireball: `<svg viewBox="0 0 64 64" class="svg-card-art"><rect width="64" height="64" rx="7" fill="#32161A"/><circle cx="32" cy="32" r="18" fill="#C74B4B" opacity="0.4"/><circle cx="32" cy="32" r="11" fill="#FFAE42"/><circle cx="32" cy="32" r="5" fill="#FFF3D6"/><path d="M32 14 C30 22 26 24 28 28 C30 26 34 26 32 14 Z" fill="#FFAE42"/></svg>`,
    card_spell_barrier: `<svg viewBox="0 0 64 64" class="svg-card-art"><rect width="64" height="64" rx="7" fill="#16263B"/><polygon points="32,8 52,19 52,45 32,56 12,45 12,19" fill="#203856" stroke="#70C1B3" stroke-width="2.2" stroke-linejoin="round"/><polygon points="32,15 45,22 45,42 32,49 19,42 19,22" fill="none" stroke="#FFAE42" stroke-width="1.3"/><circle cx="32" cy="32" r="4.5" fill="#FFAE42"/></svg>`,
    card_spell_whirlwind: `<svg viewBox="0 0 64 64" class="svg-card-art"><rect width="64" height="64" rx="7" fill="#1C2E3C"/><path d="M32 52 C18 48 18 38 32 36 C46 34 46 24 32 22 C22 20 22 14 32 12" fill="none" stroke="#70C1B3" stroke-width="2.8" stroke-linecap="round"/><ellipse cx="20" cy="36" rx="4" ry="2" fill="#52B788" transform="rotate(-20 20 36)"/><ellipse cx="44" cy="22" rx="4" ry="2" fill="#52B788" transform="rotate(25 44 22)"/></svg>`,
    card_spell_freeze_mist: `<svg viewBox="0 0 64 64" class="svg-card-art"><rect width="64" height="64" rx="7" fill="#14263C"/><line x1="32" y1="10" x2="32" y2="54" stroke="#70C1B3" stroke-width="2.8" stroke-linecap="round"/><line x1="10" y1="32" x2="54" y2="32" stroke="#70C1B3" stroke-width="2.8" stroke-linecap="round"/><line x1="16" y1="16" x2="48" y2="48" stroke="#70C1B3" stroke-width="2.2" stroke-linecap="round"/><line x1="48" y1="16" x2="16" y2="48" stroke="#70C1B3" stroke-width="2.2" stroke-linecap="round"/><circle cx="32" cy="32" r="4" fill="#FFF3D6"/></svg>`,
    card_spell_bamboo_trap: `<svg viewBox="0 0 64 64" class="svg-card-art"><rect width="64" height="64" rx="7" fill="#1A2D22"/><polygon points="16,52 24,16 28,52" fill="#3D7852" stroke="#080B18" stroke-width="1.3"/><polygon points="28,52 34,10 38,52" fill="#52B788" stroke="#080B18" stroke-width="1.3"/><polygon points="38,52 44,20 50,52" fill="#3D7852" stroke="#080B18" stroke-width="1.3"/><line x1="12" y1="46" x2="52" y2="46" stroke="#C49A6C" stroke-width="2.2"/></svg>`,
    card_spell_spirit_rain: `<svg viewBox="0 0 64 64" class="svg-card-art"><rect width="64" height="64" rx="7" fill="#122538"/><line x1="18" y1="10" x2="14" y2="28" stroke="#70C1B3" stroke-width="2" stroke-linecap="round"/><line x1="32" y1="6" x2="28" y2="30" stroke="#FFAE42" stroke-width="2.2" stroke-linecap="round"/><line x1="46" y1="12" x2="42" y2="32" stroke="#70C1B3" stroke-width="2" stroke-linecap="round"/><ellipse cx="32" cy="48" rx="18" ry="7" fill="none" stroke="#FFAE42" stroke-width="1.8"/><ellipse cx="32" cy="48" rx="9" ry="3.5" fill="none" stroke="#70C1B3" stroke-width="1.3"/></svg>`,
    card_spell_thunder_strike: `<svg viewBox="0 0 64 64" class="svg-card-art"><rect width="64" height="64" rx="7" fill="#241B3C"/><polygon points="36,6 18,32 32,32 24,58 48,26 34,26" fill="#FFAE42" stroke="#FFF3D6" stroke-width="1.6" stroke-linejoin="round"/><circle cx="24" cy="58" r="3.5" fill="#FFF3D6"/></svg>`,

    // Lanterns: Brass pitcher pouring golden oil, solar multi-point burst, lotus mandala aura, sacred flame pillar, earthen oil flask
    card_lantern_refuel: `<svg viewBox="0 0 64 64" class="svg-card-art"><rect width="64" height="64" rx="7" fill="#322214"/><path d="M24 20 L38 20 L44 46 L20 46 Z" fill="#8C5828" stroke="#080B18" stroke-width="1.5"/><path d="M38 24 Q48 24 48 34 Q48 42 38 42" fill="none" stroke="#8C5828" stroke-width="2.8"/><path d="M30 18 Q26 10 32 8" fill="none" stroke="#FFAE42" stroke-width="2.5" stroke-linecap="round"/><circle cx="32" cy="6" r="2" fill="#FFF3D6"/><ellipse cx="32" cy="52" rx="12" ry="4" fill="#FFAE42" opacity="0.85"/></svg>`,
    card_lantern_flare: `<svg viewBox="0 0 64 64" class="svg-card-art"><rect width="64" height="64" rx="7" fill="#382512"/><circle cx="32" cy="32" r="19" fill="#FFAE42" opacity="0.35"/><circle cx="32" cy="32" r="11" fill="#FFAE42"/><circle cx="32" cy="32" r="5" fill="#FFF8E7"/><polygon points="32,4 34,22 46,14 38,26 56,32 38,38 46,50 34,42 32,60 30,42 18,50 26,38 8,32 26,26 18,14 30,22" fill="#FFAE42" opacity="0.9"/></svg>`,
    card_lantern_guardian_halo: `<svg viewBox="0 0 64 64" class="svg-card-art"><rect width="64" height="64" rx="7" fill="#322416"/><circle cx="32" cy="32" r="22" fill="none" stroke="#FFAE42" stroke-width="2.5"/><circle cx="32" cy="32" r="15" fill="none" stroke="#FFF3D6" stroke-width="1.8" stroke-dasharray="3,2"/><circle cx="32" cy="32" r="8" fill="#FFAE42"/><circle cx="32" cy="32" r="3.5" fill="#FFF8E7"/></svg>`,
    card_lantern_ignite: `<svg viewBox="0 0 64 64" class="svg-card-art"><rect width="64" height="64" rx="7" fill="#361814"/><path d="M32 8 C25 22 18 28 18 38 C18 48 25 54 32 54 C39 54 46 48 46 38 C46 28 39 22 32 8 Z" fill="#C74B4B" stroke="#080B18" stroke-width="1.4"/><path d="M32 22 C29 28 26 32 26 38 C26 43 29 47 32 47 C35 47 38 43 38 38 C38 32 35 28 32 22 Z" fill="#FFAE42"/><circle cx="32" cy="38" r="4" fill="#FFF8E7"/></svg>`,
    card_lantern_oil_flask: `<svg viewBox="0 0 64 64" class="svg-card-art"><rect width="64" height="64" rx="7" fill="#2E2218"/><rect x="28" y="14" width="8" height="6" fill="#7A4B2A" stroke="#080B18" stroke-width="1.2"/><ellipse cx="32" cy="38" rx="15" ry="13" fill="#4A3423" stroke="#080B18" stroke-width="1.5"/><circle cx="32" cy="38" r="6" fill="#FFAE42"/><circle cx="32" cy="38" r="2.5" fill="#FFF8E7"/></svg>`
  }
};

// Directly link summon card art to the rich handcrafted guardian unit SVGs
SVG_ART.cardArt.card_summon_cat = SVG_ART.cat_patrol;
SVG_ART.cardArt.card_summon_cat_plus = SVG_ART.cat_patrol;
SVG_ART.cardArt.card_summon_tea = SVG_ART.tea_master;
SVG_ART.cardArt.card_summon_tea_plus = SVG_ART.tea_master;
SVG_ART.cardArt.card_summon_lantern_crafter = SVG_ART.lantern_crafter;
SVG_ART.cardArt.card_summon_lantern_crafter_plus = SVG_ART.lantern_crafter;
SVG_ART.cardArt.card_summon_scarecrow = SVG_ART.scarecrow;
SVG_ART.cardArt.card_summon_scarecrow_plus = SVG_ART.scarecrow;
SVG_ART.cardArt.card_summon_tanuki = SVG_ART.tanuki_mage;
SVG_ART.cardArt.card_summon_tanuki_plus = SVG_ART.tanuki_mage;
SVG_ART.cardArt.card_summon_dragon = SVG_ART.little_dragon;
SVG_ART.cardArt.card_summon_dragon_plus = SVG_ART.little_dragon;
SVG_ART.cardArt.card_summon_crane = SVG_ART.crane_courier;
SVG_ART.cardArt.card_summon_crane_plus = SVG_ART.crane_courier;
SVG_ART.cardArt.card_summon_frog = SVG_ART.frog_bard;
SVG_ART.cardArt.card_summon_frog_plus = SVG_ART.frog_bard;
SVG_ART.cardArt.card_summon_fox = SVG_ART.fox_maiden;
SVG_ART.cardArt.card_summon_fox_plus = SVG_ART.fox_maiden;
SVG_ART.cardArt.card_summon_bear = SVG_ART.bear_baker;
SVG_ART.cardArt.card_summon_bear_plus = SVG_ART.bear_baker;

// Link plus versions of commands/spells/lanterns
SVG_ART.cardArt.card_command_advance_plus = SVG_ART.cardArt.card_command_advance;
SVG_ART.cardArt.card_command_reposition_plus = SVG_ART.cardArt.card_command_reposition;
SVG_ART.cardArt.card_command_rally_plus = SVG_ART.cardArt.card_command_rally;
SVG_ART.cardArt.card_command_strike_again_plus = SVG_ART.cardArt.card_command_strike_again;
SVG_ART.cardArt.card_command_tactical_swap_plus = SVG_ART.cardArt.card_command_tactical_swap;
SVG_ART.cardArt.card_spell_gust_plus = SVG_ART.cardArt.card_spell_gust;
SVG_ART.cardArt.card_spell_fireball_plus = SVG_ART.cardArt.card_spell_fireball;
SVG_ART.cardArt.card_spell_barrier_plus = SVG_ART.cardArt.card_spell_barrier;
SVG_ART.cardArt.card_spell_whirlwind_plus = SVG_ART.cardArt.card_spell_whirlwind;
SVG_ART.cardArt.card_spell_freeze_mist_plus = SVG_ART.cardArt.card_spell_freeze_mist;
SVG_ART.cardArt.card_spell_bamboo_trap_plus = SVG_ART.cardArt.card_spell_bamboo_trap;
SVG_ART.cardArt.card_spell_spirit_rain_plus = SVG_ART.cardArt.card_spell_spirit_rain;
SVG_ART.cardArt.card_spell_thunder_strike_plus = SVG_ART.cardArt.card_spell_thunder_strike;
SVG_ART.cardArt.card_lantern_refuel_plus = SVG_ART.cardArt.card_lantern_refuel;
SVG_ART.cardArt.card_lantern_flare_plus = SVG_ART.cardArt.card_lantern_flare;
SVG_ART.cardArt.card_lantern_guardian_halo_plus = SVG_ART.cardArt.card_lantern_guardian_halo;
SVG_ART.cardArt.card_lantern_ignite_plus = SVG_ART.cardArt.card_lantern_ignite;
SVG_ART.cardArt.card_lantern_oil_flask_plus = SVG_ART.cardArt.card_lantern_oil_flask;
