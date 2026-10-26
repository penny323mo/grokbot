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
          <stop offset="0%" stop-color="#02040C"/>
          <stop offset="30%" stop-color="#080E24"/>
          <stop offset="60%" stop-color="#121A38"/>
          <stop offset="100%" stop-color="#080C1E"/>
        </linearGradient>
        <radialGradient id="moonGlowFull" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#FFFDF5" stop-opacity="1"/>
          <stop offset="45%" stop-color="#FFAE42" stop-opacity="0.6"/>
          <stop offset="100%" stop-color="#FFAE42" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="titleLanternGlowSoft" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#FFAE42" stop-opacity="0.95"/>
          <stop offset="45%" stop-color="#E87A24" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="#FFAE42" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="stoneCourtyardWash" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#FFAE42" stop-opacity="0.32"/>
          <stop offset="60%" stop-color="#FFAE42" stop-opacity="0.08"/>
          <stop offset="100%" stop-color="#FFAE42" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <!-- Deep Sky Backdrop -->
      <rect width="390" height="844" fill="url(#nightSkyFull)"/>
      <!-- Glowing Radiant Crescent Moon & Halo -->
      <circle cx="295" cy="115" r="42" fill="url(#moonGlowFull)"/>
      <path d="M302 90 C286 94 274 109 278 126 C282 141 298 150 314 142 C294 145 282 127 286 112 C289 99 297 94 302 90 Z" fill="#FFF8E7"/>
      <!-- Shimmering Starry Constellations -->
      <circle cx="36" cy="65" r="1.3" fill="#FFF3D6" opacity="0.9"/>
      <circle cx="85" cy="45" r="1.5" fill="#FFAE42" opacity="0.9"/>
      <circle cx="140" cy="80" r="1.1" fill="#FFF3D6" opacity="0.8"/>
      <circle cx="205" cy="55" r="1.4" fill="#FFAE42" opacity="0.85"/>
      <circle cx="250" cy="88" r="1.1" fill="#FFF3D6" opacity="0.75"/>
      <circle cx="355" cy="50" r="1.3" fill="#FFAE42" opacity="0.8"/>
      <circle cx="370" cy="130" r="1.5" fill="#FFF3D6" opacity="0.9"/>
      <circle cx="50" cy="140" r="1.2" fill="#FFAE42" opacity="0.8"/>
      <!-- Distant Mountain Ridges (Layer 1 - deep twilight indigo) -->
      <path d="M0 210 Q90 160 190 200 T390 170 L390 844 L0 844 Z" fill="#070C1C" opacity="0.95"/>
      <!-- Mid-ground Mountain Ridges with Pine Silhouettes (Layer 2) -->
      <path d="M0 260 Q110 220 220 255 T390 230 L390 844 L0 844 Z" fill="#0C1328"/>
      <path d="M40 238 L44 225 L48 238 M44 225 L44 245 M85 245 L90 230 L95 245 M90 230 L90 252" stroke="#050812" stroke-width="1.8"/>
      <!-- Translucent Valley Mist Band 1 -->
      <path d="M0 265 Q90 245 200 270 T390 255 L390 290 Q290 305 180 280 T0 295 Z" fill="#70C1B3" opacity="0.12"/>

      <!-- Asian Town Skyline (Tiered Pagoda Tower, Shrines & Hillside Townhouses) -->
      <!-- Pagoda Watchtower on the right (x=270 to 365, y=180 to 380) -->
      <g transform="translate(270, 180)">
        <!-- Spire & Finial -->
        <line x1="42" y1="0" x2="42" y2="25" stroke="#FFAE42" stroke-width="2"/>
        <circle cx="42" cy="5" r="3" fill="#FFAE42"/>
        <circle cx="42" cy="12" r="4" fill="#FFAE42"/>
        <!-- Top Tier Eave -->
        <path d="M12 36 Q42 22 72 36 L66 42 Q42 34 18 42 Z" fill="#1C2442" stroke="#060914" stroke-width="1.2"/>
        <line x1="12" y1="36" x2="8" y2="33" stroke="#FFAE42" stroke-width="1.2"/>
        <line x1="72" y1="36" x2="76" y2="33" stroke="#FFAE42" stroke-width="1.2"/>
        <!-- Mid Tier Eave -->
        <rect x="26" y="42" width="32" height="18" fill="#141A32"/>
        <rect x="36" y="46" width="12" height="10" rx="1" fill="#FFAE42" opacity="0.9"/>
        <path d="M4 64 Q42 48 80 64 L74 72 Q42 62 10 72 Z" fill="#1C2442" stroke="#060914" stroke-width="1.4"/>
        <!-- Bottom Tier & Foundation -->
        <rect x="20" y="72" width="44" height="28" fill="#141A32"/>
        <rect x="28" y="76" width="10" height="12" rx="1.5" fill="#FFAE42" opacity="0.9"/>
        <rect x="46" y="76" width="10" height="12" rx="1.5" fill="#FFAE42" opacity="0.85"/>
        <path d="M-6 104 Q42 86 90 104 L84 114 Q42 102 0 114 Z" fill="#1C2442" stroke="#060914" stroke-width="1.5"/>
        <rect x="14" y="114" width="56" height="34" fill="#10152B"/>
        <rect x="32" y="122" width="20" height="22" rx="2" fill="#FFAE42" opacity="0.95"/>
      </g>

      <!-- Hillside Houses on Left & Center (y=280 to 420) -->
      <g>
        <!-- House 1 (Left flank) -->
        <path d="M10 320 Q55 300 100 320 L94 328 Q55 314 16 328 Z" fill="#1C2442" stroke="#060914" stroke-width="1.2"/>
        <rect x="22" y="328" width="68" height="40" fill="#121832"/>
        <rect x="32" y="336" width="14" height="16" rx="1.5" fill="#FFAE42" opacity="0.9"/>
        <rect x="58" y="336" width="18" height="20" rx="1.5" fill="#FFAE42" opacity="0.85"/>
        <!-- House 2 (Center lower) -->
        <path d="M90 350 Q145 330 200 350 L194 358 Q145 344 96 358 Z" fill="#1C2442" stroke="#060914" stroke-width="1.2"/>
        <rect x="104" y="358" width="84" height="44" fill="#121832"/>
        <rect x="116" y="366" width="16" height="18" rx="1.5" fill="#FFAE42" opacity="0.95"/>
        <rect x="148" y="366" width="24" height="22" rx="1.5" fill="#FFAE42" opacity="0.9"/>
        <!-- House 3 (Stepped right) -->
        <path d="M185 365 Q235 348 285 365 L280 373 Q235 360 190 373 Z" fill="#1C2442" stroke="#060914" stroke-width="1.2"/>
        <rect x="195" y="373" width="76" height="42" fill="#121832"/>
        <rect x="210" y="380" width="16" height="16" rx="1.5" fill="#FFAE42" opacity="0.85"/>
        <rect x="240" y="380" width="18" height="20" rx="1.5" fill="#FFAE42" opacity="0.9"/>
      </g>

      <!-- Hanging Festival Lantern Strings with Warm Golden Glow (y=290 to 390) -->
      <!-- String 1 -->
      <path d="M10 300 Q90 340 180 295 Q270 340 370 295" fill="none" stroke="#263454" stroke-width="1.5"/>
      <!-- Lanterns on String 1 -->
      <g transform="translate(60, 318)">
        <circle cx="8" cy="10" r="14" fill="url(#titleLanternGlowSoft)"/>
        <rect x="4" y="4" width="8" height="12" rx="2" fill="#C74B4B" stroke="#080B18" stroke-width="1"/>
        <line x1="8" y1="16" x2="8" y2="20" stroke="#FFAE42" stroke-width="1.5"/>
      </g>
      <g transform="translate(130, 312)">
        <circle cx="8" cy="10" r="15" fill="url(#titleLanternGlowSoft)"/>
        <rect x="4" y="4" width="8" height="12" rx="2" fill="#FFAE42" stroke="#080B18" stroke-width="1"/>
        <line x1="8" y1="16" x2="8" y2="20" stroke="#C74B4B" stroke-width="1.5"/>
      </g>
      <g transform="translate(225, 318)">
        <circle cx="8" cy="10" r="15" fill="url(#titleLanternGlowSoft)"/>
        <rect x="4" y="4" width="8" height="12" rx="2" fill="#FFAE42" stroke="#080B18" stroke-width="1"/>
        <line x1="8" y1="16" x2="8" y2="20" stroke="#C74B4B" stroke-width="1.5"/>
      </g>
      <g transform="translate(315, 308)">
        <circle cx="8" cy="10" r="14" fill="url(#titleLanternGlowSoft)"/>
        <rect x="4" y="4" width="8" height="12" rx="2" fill="#C74B4B" stroke="#080B18" stroke-width="1"/>
        <line x1="8" y1="16" x2="8" y2="20" stroke="#FFAE42" stroke-width="1.5"/>
      </g>

      <!-- Rolling Mist Bank 2 (Drifting between hillside and foreground terrace) -->
      <path d="M0 400 Q120 380 240 415 T390 395 L390 460 Q280 480 150 445 T0 470 Z" fill="#70C1B3" opacity="0.14"/>
      <path d="M0 425 Q100 445 200 420 T390 440 L390 485 Q260 500 130 465 T0 490 Z" fill="#EDE3CF" opacity="0.08"/>

      <!-- Foreground Illustrated Stone Terrace & Stone Balustrade (y=440 to 844) -->
      <!-- Broad Courtyard Glow Pooling from Town Lanterns -->
      <ellipse cx="195" cy="620" rx="200" ry="160" fill="url(#stoneCourtyardWash)"/>
      <path d="M0 470 L390 470 L390 844 L0 844 Z" fill="#0C1124"/>
      <!-- Stone flagged paving lines in perspective -->
      <path d="M0 470 L390 470 M0 530 L390 530 M0 600 L390 600 M0 680 L390 680 M0 770 L390 770" stroke="rgba(143,163,199,0.12)" stroke-width="1"/>
      <line x1="75" y1="470" x2="40" y2="844" stroke="rgba(143,163,199,0.1)" stroke-width="1"/>
      <line x1="160" y1="470" x2="135" y2="844" stroke="rgba(143,163,199,0.1)" stroke-width="1"/>
      <line x1="240" y1="470" x2="255" y2="844" stroke="rgba(143,163,199,0.1)" stroke-width="1"/>
      <line x1="320" y1="470" x2="350" y2="844" stroke="rgba(143,163,199,0.1)" stroke-width="1"/>

      <!-- Terrace Stone Lantern Post & Vigil Guardian Silhouette (Overlooking the town) -->
      <!-- Sacred Stone Pagoda Lantern Post (Left Overlook) -->
      <g transform="translate(42, 435)">
        <circle cx="20" cy="24" r="32" fill="url(#titleLanternGlowSoft)"/>
        <!-- Carved Roof Eaves -->
        <polygon points="20,0 2,12 38,12" fill="#202A46" stroke="#060914" stroke-width="1.4" stroke-linejoin="round"/>
        <circle cx="20" cy="-1" r="2.5" fill="#FFAE42"/>
        <!-- Fire Chamber Window with blazing flame -->
        <rect x="8" y="12" width="24" height="22" rx="2" fill="#FFF2D4" stroke="#080B18" stroke-width="1.5"/>
        <line x1="20" y1="12" x2="20" y2="34" stroke="#D9822B" stroke-width="1.5"/>
        <line x1="8" y1="23" x2="32" y2="23" stroke="#D9822B" stroke-width="1.5"/>
        <!-- Stone Base & Column Pedestal -->
        <polygon points="6,34 34,34 28,42 12,42" fill="#202A46" stroke="#060914" stroke-width="1.4"/>
        <rect x="15" y="42" width="10" height="26" fill="#141B32" stroke="#060914" stroke-width="1.2"/>
        <polygon points="8,68 32,68 38,80 2,80" fill="#202A46" stroke="#060914" stroke-width="1.4"/>
      </g>

      <!-- Watchman Cat Guardian Silhouette Standing Vigil on Terrace (Right Overlook) -->
      <g transform="translate(305, 460)">
        <!-- Contact shadow -->
        <ellipse cx="22" cy="62" rx="16" ry="4" fill="#04060E" opacity="0.8"/>
        <!-- Long patrol staff / lantern pole -->
        <line x1="36" y1="15" x2="36" y2="62" stroke="#3D2B1C" stroke-width="2" stroke-linecap="round"/>
        <circle cx="44" cy="24" r="10" fill="url(#titleLanternGlowSoft)"/>
        <rect x="40" y="20" width="8" height="10" rx="2" fill="#FFAE42" stroke="#080B18" stroke-width="1"/>
        <!-- Flowing midnight cloak -->
        <path d="M12 36 Q8 58 24 58 Q40 58 36 36 Z" fill="#12182E" stroke="#060914" stroke-width="1.4"/>
        <!-- Kasa hat -->
        <polygon points="22,12 2,24 42,24" fill="#2E241A" stroke="#060914" stroke-width="1.4"/>
        <!-- Glowing scout eyes -->
        <ellipse cx="18" cy="26" rx="1.5" ry="2" fill="#FFAE42"/>
        <ellipse cx="26" cy="26" rx="1.5" ry="2" fill="#FFAE42"/>
      </g>

      <!-- Ancient Gnarled Pine Branch Arching from Top-Left -->
      <path d="M-10 40 Q40 60 70 45 Q100 30 115 50" fill="none" stroke="#221812" stroke-width="6" stroke-linecap="round"/>
      <path d="M60 48 Q80 75 95 68" fill="none" stroke="#221812" stroke-width="3" stroke-linecap="round"/>
      <!-- Pine needle tufts -->
      <ellipse cx="68" cy="42" rx="16" ry="7" fill="#1C382C" opacity="0.9" transform="rotate(-15 68 42)"/>
      <ellipse cx="112" cy="50" rx="14" ry="6" fill="#1C382C" opacity="0.9" transform="rotate(10 112 50)"/>
      <ellipse cx="94" cy="68" rx="12" ry="5.5" fill="#1C382C" opacity="0.9" transform="rotate(25 94 68)"/>

      <!-- Atmospheric Ground Mist Curling along Lower Terrace (y=780 to 844) -->
      <path d="M0 790 Q90 770 200 800 T390 780 L390 844 L0 844 Z" fill="#70C1B3" opacity="0.08"/>
      <path d="M0 815 Q120 830 250 805 T390 825 L390 844 L0 844 Z" fill="#FFAE42" opacity="0.05"/>
    </svg>
  `,

  // ================= VICTORY DAWN BACKDROP (REWARD SCREEN) =================
  victoryBackdrop: `
    <svg viewBox="0 0 390 220" class="svg-victory-backdrop" preserveAspectRatio="none">
      <defs>
        <linearGradient id="dawnSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#120A24"/>
          <stop offset="35%" stop-color="#341838"/>
          <stop offset="70%" stop-color="#7A3644"/>
          <stop offset="90%" stop-color="#D97A48"/>
          <stop offset="100%" stop-color="#FFAE42"/>
        </linearGradient>
        <radialGradient id="sunGlow" cx="50%" cy="100%" r="90%">
          <stop offset="0%" stop-color="#FFFDF0" stop-opacity="1"/>
          <stop offset="40%" stop-color="#FFAE42" stop-opacity="0.8"/>
          <stop offset="85%" stop-color="#D96048" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="#FFAE42" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <!-- Dawn Sky -->
      <rect width="390" height="220" fill="url(#dawnSky)"/>
      <!-- Radiating Morning Sun Rays breaking over horizon -->
      <polygon points="195,190 60,0 90,0" fill="#FFFDF0" opacity="0.15"/>
      <polygon points="195,190 140,0 175,0" fill="#FFFDF0" opacity="0.2"/>
      <polygon points="195,190 215,0 250,0" fill="#FFFDF0" opacity="0.2"/>
      <polygon points="195,190 300,0 330,0" fill="#FFFDF0" opacity="0.15"/>
      <!-- Rising Sun Core -->
      <circle cx="195" cy="195" r="90" fill="url(#sunGlow)"/>
      <circle cx="195" cy="195" r="30" fill="#FFF8E7"/>
      <!-- Distant Mountain Ridges bathed in Morning Light -->
      <path d="M0 160 Q80 130 170 155 Q240 120 330 150 Q365 140 390 155 L390 220 L0 220 Z" fill="#24142E" opacity="0.9"/>
      <path d="M0 180 Q100 160 200 185 T390 175 L390 220 L0 220 Z" fill="#180E20"/>
      <!-- Three Flying White Cranes ascending into dawn -->
      <g transform="translate(110, 60)">
        <path d="M0 10 Q10 0 20 6 Q16 12 10 10 Q6 16 0 10 Z" fill="#FFF8E7"/>
        <line x1="0" y1="10" x2="-6" y2="14" stroke="#080B18" stroke-width="1"/>
      </g>
      <g transform="translate(145, 40)">
        <path d="M0 8 Q8 0 16 5 Q13 10 8 8 Q5 13 0 8 Z" fill="#FFF8E7"/>
      </g>
      <g transform="translate(230, 52)">
        <path d="M0 9 Q9 0 18 5 Q14 11 9 9 Q5 14 0 9 Z" fill="#FFF8E7"/>
      </g>
      <!-- Pagoda silhouettes bathed in dawn mist -->
      <path d="M30 180 L45 168 L48 168 L50 160 L52 168 L55 168 L70 180 Z" fill="#2A162B"/>
      <path d="M320 180 L335 168 L338 168 L340 160 L342 168 L345 168 L360 180 Z" fill="#2A162B"/>
      <!-- Golden dawn mist bank across base -->
      <path d="M0 195 Q90 180 195 205 T390 190 L390 220 L0 220 Z" fill="#FFAE42" opacity="0.25"/>
    </svg>
  `,

  // ================= TOWN STREET PANORAMA (BUILT VS UNBUILT STREET SCENE) =================
  townStreetPanorama(builtIds = []) {
    const isBuilt = (id) => builtIds && builtIds.includes(id);
    return `
      <svg viewBox="0 0 390 105" class="svg-town-street-panorama" preserveAspectRatio="none">
        <defs>
          <linearGradient id="panoSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#080E22"/>
            <stop offset="60%" stop-color="#141C38"/>
            <stop offset="100%" stop-color="#0E1328"/>
          </linearGradient>
          <radialGradient id="panoGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#FFAE42" stop-opacity="1"/>
            <stop offset="100%" stop-color="#FFAE42" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <!-- Twilight Sky -->
        <rect width="390" height="105" fill="url(#panoSky)"/>
        <!-- Distant Mountain Ridge -->
        <path d="M0 50 Q90 35 195 48 T390 42 L390 105 L0 105 Z" fill="#0A0F22" opacity="0.8"/>
        <!-- Cobblestone Street Ground -->
        <rect x="0" y="82" width="390" height="23" fill="#161B30"/>
        <line x1="0" y1="82" x2="390" y2="82" stroke="rgba(143,163,199,0.2)" stroke-width="1.2"/>
        <line x1="0" y1="92" x2="390" y2="92" stroke="rgba(143,163,199,0.12)" stroke-width="0.8"/>

        <!-- 1. Watchtower (x=8 to 44) -->
        <g transform="translate(8, 28)" opacity="${isBuilt('bldg_watchtower') ? '1' : '0.38'}">
          <polygon points="18,0 3,12 33,12" fill="${isBuilt('bldg_watchtower') ? '#C74B4B' : '#1A223D'}" stroke="#060914" stroke-width="1.2"/>
          <rect x="10" y="12" width="16" height="42" fill="${isBuilt('bldg_watchtower') ? '#263454' : '#12182C'}"/>
          <rect x="13" y="18" width="10" height="10" rx="1.5" fill="${isBuilt('bldg_watchtower') ? '#FFAE42' : '#2A3554'}"/>
          ${isBuilt('bldg_watchtower') ? '<circle cx="18" cy="23" r="10" fill="url(#panoGlow)" opacity="0.6"/>' : ''}
        </g>

        <!-- 2. Courier Station (x=46 to 82) -->
        <g transform="translate(46, 36)" opacity="${isBuilt('bldg_courier') ? '1' : '0.38'}">
          <polygon points="18,0 2,10 34,10" fill="${isBuilt('bldg_courier') ? '#2D4B68' : '#1A223D'}" stroke="#060914" stroke-width="1.2"/>
          <rect x="6" y="10" width="24" height="36" fill="${isBuilt('bldg_courier') ? '#1C2740' : '#12182C'}"/>
          <rect x="12" y="16" width="12" height="12" rx="1.5" fill="${isBuilt('bldg_courier') ? '#FFAE42' : '#2A3554'}"/>
          <line x1="30" y1="-4" x2="30" y2="10" stroke="#EDE3CF" stroke-width="1.2"/>
          <polygon points="30,-4 38,-1 30,2" fill="${isBuilt('bldg_courier') ? '#C74B4B' : '#333D5C'}"/>
        </g>

        <!-- 3. Music Hall (x=84 to 120) -->
        <g transform="translate(84, 32)" opacity="${isBuilt('bldg_music_hall') ? '1' : '0.38'}">
          <path d="M4 14 Q18 4 32 14 L28 18 Q18 10 8 18 Z" fill="${isBuilt('bldg_music_hall') ? '#4A6B82' : '#1A223D'}"/>
          <rect x="10" y="18" width="16" height="32" fill="${isBuilt('bldg_music_hall') ? '#222E48' : '#12182C'}"/>
          <circle cx="18" cy="28" r="4.5" fill="${isBuilt('bldg_music_hall') ? '#FFAE42' : '#2A3554'}"/>
        </g>

        <!-- 4. Fox Shrine (x=122 to 158) -->
        <g transform="translate(122, 34)" opacity="${isBuilt('bldg_fox_shrine') ? '1' : '0.38'}">
          <rect x="4" y="6" width="28" height="4" fill="${isBuilt('bldg_fox_shrine') ? '#C74B4B' : '#1A223D'}"/>
          <line x1="8" y1="6" x2="8" y2="48" stroke="${isBuilt('bldg_fox_shrine') ? '#C74B4B' : '#1A223D'}" stroke-width="3"/>
          <line x1="28" y1="6" x2="28" y2="48" stroke="${isBuilt('bldg_fox_shrine') ? '#C74B4B' : '#1A223D'}" stroke-width="3"/>
          <circle cx="18" cy="24" r="5" fill="${isBuilt('bldg_fox_shrine') ? '#FFAE42' : '#2A3554'}"/>
          ${isBuilt('bldg_fox_shrine') ? '<circle cx="18" cy="24" r="10" fill="url(#panoGlow)" opacity="0.6"/>' : ''}
        </g>

        <!-- 5. Bakery (x=160 to 196) -->
        <g transform="translate(160, 38)" opacity="${isBuilt('bldg_bakery') ? '1' : '0.38'}">
          <polygon points="18,0 2,12 34,12" fill="${isBuilt('bldg_bakery') ? '#7A4D2E' : '#1A223D'}"/>
          <rect x="6" y="12" width="24" height="32" fill="${isBuilt('bldg_bakery') ? '#3D2818' : '#12182C'}"/>
          <circle cx="18" cy="24" r="5" fill="${isBuilt('bldg_bakery') ? '#FFAE42' : '#2A3554'}"/>
          ${isBuilt('bldg_bakery') ? '<path d="M26 12 Q28 4 25 0" stroke="#EDE3CF" stroke-width="1.2" fill="none" opacity="0.8"/>' : ''}
        </g>

        <!-- 6. Ancient Tea Tree (x=198 to 234) -->
        <g transform="translate(198, 26)" opacity="${isBuilt('bldg_tea_bush') ? '1' : '0.38'}">
          <ellipse cx="18" cy="22" rx="16" ry="12" fill="${isBuilt('bldg_tea_bush') ? '#2E6E4D' : '#162820'}"/>
          <ellipse cx="14" cy="16" rx="10" ry="8" fill="${isBuilt('bldg_tea_bush') ? '#459E70' : '#1A3328'}"/>
          <path d="M16 34 L18 56 M20 34 L18 56" stroke="#4A3423" stroke-width="3.5"/>
          ${isBuilt('bldg_tea_bush') ? '<circle cx="12" cy="18" r="2" fill="#FFAE42"/><circle cx="22" cy="24" r="2" fill="#FFAE42"/>' : ''}
        </g>

        <!-- 7. Smithy Forge (x=236 to 272) -->
        <g transform="translate(236, 36)" opacity="${isBuilt('bldg_forge') ? '1' : '0.38'}">
          <polygon points="18,0 4,10 32,10" fill="${isBuilt('bldg_forge') ? '#3C4452' : '#1A223D'}"/>
          <rect x="6" y="10" width="24" height="36" fill="${isBuilt('bldg_forge') ? '#262D38' : '#12182C'}"/>
          <circle cx="18" cy="26" r="6" fill="${isBuilt('bldg_forge') ? '#E86338' : '#2A3554'}"/>
          <rect x="24" y="2" width="5" height="12" fill="#20242E"/>
          ${isBuilt('bldg_forge') ? '<circle cx="18" cy="26" r="12" fill="url(#panoGlow)" opacity="0.7"/>' : ''}
        </g>

        <!-- 8. Lucky Stone (x=274 to 310) -->
        <g transform="translate(274, 44)" opacity="${isBuilt('bldg_lucky_stone') ? '1' : '0.38'}">
          <polygon points="18,0 8,38 28,38" fill="${isBuilt('bldg_lucky_stone') ? '#485568' : '#1A223D'}"/>
          <rect x="13" y="10" width="10" height="18" rx="1" fill="${isBuilt('bldg_lucky_stone') ? '#FFAE42' : '#2A3554'}"/>
        </g>

        <!-- 9. Herbal Garden (x=312 to 348) -->
        <g transform="translate(312, 40)" opacity="${isBuilt('bldg_herbal_garden') ? '1' : '0.38'}">
          <polygon points="18,0 2,8 34,8" fill="${isBuilt('bldg_herbal_garden') ? '#3D7856' : '#1A223D'}"/>
          <rect x="6" y="8" width="24" height="34" fill="${isBuilt('bldg_herbal_garden') ? '#1C3224' : '#12182C'}"/>
          <ellipse cx="18" cy="22" rx="7" ry="5" fill="${isBuilt('bldg_herbal_garden') ? '#52B788' : '#2A3554'}"/>
        </g>

        <!-- 10. Star Pavilion (x=350 to 386) -->
        <g transform="translate(350, 24)" opacity="${isBuilt('bldg_star_pavilion') ? '1' : '0.38'}">
          <polygon points="18,0 6,10 30,10" fill="${isBuilt('bldg_star_pavilion') ? '#503875' : '#1A223D'}"/>
          <rect x="10" y="10" width="16" height="14" fill="${isBuilt('bldg_star_pavilion') ? '#2E1E48' : '#12182C'}"/>
          <polygon points="18,24 2,32 34,32" fill="${isBuilt('bldg_star_pavilion') ? '#503875' : '#1A223D'}"/>
          <rect x="6" y="32" width="24" height="26" fill="${isBuilt('bldg_star_pavilion') ? '#2E1E48' : '#12182C'}"/>
          <circle cx="18" cy="42" r="5" fill="${isBuilt('bldg_star_pavilion') ? '#FFAE42' : '#2A3554'}"/>
          <circle cx="18" cy="-1" r="3" fill="${isBuilt('bldg_star_pavilion') ? '#FFAE42' : '#333D5C'}"/>
          ${isBuilt('bldg_star_pavilion') ? '<circle cx="18" cy="42" r="12" fill="url(#panoGlow)" opacity="0.7"/>' : ''}
        </g>
      </svg>
    `;
  },

  // ================= MAP TERRAIN BACKDROP (INK-WASH MOUNTAIN PATH) =================
  mapTerrainBackdrop: `
    <svg viewBox="0 0 390 844" class="svg-map-terrain-backdrop" preserveAspectRatio="none">
      <defs>
        <linearGradient id="mapSkyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#050816"/>
          <stop offset="50%" stop-color="#0E142C"/>
          <stop offset="100%" stop-color="#070A18"/>
        </linearGradient>
      </defs>
      <rect width="390" height="844" fill="url(#mapSkyGrad)"/>
      <!-- Left mountain ridge silhouettes with pine trees -->
      <path d="M0 0 L70 0 Q40 180 80 340 Q30 520 65 680 Q20 760 50 844 L0 844 Z" fill="#080C1E" opacity="0.85"/>
      <path d="M0 0 L40 0 Q20 220 50 440 Q15 620 35 844 L0 844 Z" fill="#0D1328" opacity="0.7"/>
      <!-- Right mountain ridge silhouettes -->
      <path d="M390 0 L320 0 Q350 180 310 340 Q360 520 325 680 Q370 760 340 844 L390 844 Z" fill="#080C1E" opacity="0.85"/>
      <path d="M390 0 L350 0 Q370 220 340 440 Q375 620 355 844 L390 844 Z" fill="#0D1328" opacity="0.7"/>
      <!-- Bamboo stalk silhouettes on left and right borders -->
      <line x1="18" y1="40" x2="16" y2="280" stroke="#162520" stroke-width="3" opacity="0.6"/>
      <line x1="28" y1="120" x2="26" y2="400" stroke="#1C322B" stroke-width="2.5" opacity="0.5"/>
      <line x1="372" y1="60" x2="374" y2="300" stroke="#162520" stroke-width="3" opacity="0.6"/>
      <line x1="362" y1="160" x2="364" y2="450" stroke="#1C322B" stroke-width="2.5" opacity="0.5"/>
      <!-- Translucent floating mist bands -->
      <path d="M0 160 Q100 130 200 165 T390 145 L390 200 Q280 220 160 185 T0 205 Z" fill="#70C1B3" opacity="0.08"/>
      <path d="M0 380 Q120 350 240 385 T390 365 L390 420 Q270 440 140 405 T0 425 Z" fill="#70C1B3" opacity="0.08"/>
      <path d="M0 600 Q100 570 210 605 T390 585 L390 640 Q280 660 150 625 T0 645 Z" fill="#70C1B3" opacity="0.08"/>
    </svg>
  `,

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

    // ================= CARD ART (AUTHENTIC WOODBLOCK SCENE ILLUSTRATIONS) =================
  cardArt: {
    // 1. 突進指令: Martial scout in travel cloak & kasa slashing forward with glowing blade in night bamboo grove
    card_command_advance: `
      <svg viewBox="0 0 72 90" class="svg-card-art">
        <defs>
          <linearGradient id="advBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#0E162E"/>
            <stop offset="50%" stop-color="#18254A"/>
            <stop offset="100%" stop-color="#080C1A"/>
          </linearGradient>
        </defs>
        <rect width="72" height="90" fill="url(#advBg)"/>
        <line x1="12" y1="0" x2="14" y2="90" stroke="#1F3348" stroke-width="3" opacity="0.4"/>
        <line x1="62" y1="0" x2="58" y2="90" stroke="#1F3348" stroke-width="4" opacity="0.4"/>
        <polygon points="20,0 48,0 56,90 8,90" fill="#70C1B3" opacity="0.06"/>
        <ellipse cx="28" cy="76" rx="14" ry="4" fill="#04060E" opacity="0.8"/>
        <path d="M16 68 C14 54 26 48 34 52 L38 74 C30 76 22 76 16 68 Z" fill="#1C2340" stroke="#080B18" stroke-width="1.3"/>
        <polygon points="32,44 14,54 48,54" fill="#2E241A" stroke="#080B18" stroke-width="1.3"/>
        <line x1="22" y1="53" x2="32" y2="45" stroke="#C49A6C" stroke-width="0.8" opacity="0.6"/>
        <path d="M22 66 C32 44 48 30 64 20" fill="none" stroke="#FFAE42" stroke-width="3" stroke-linecap="round"/>
        <path d="M24 64 C34 46 48 32 62 22" fill="none" stroke="#FFF8E7" stroke-width="1.5" stroke-linecap="round"/>
        <polygon points="66,18 56,22 60,28" fill="#FFF8E7"/>
        <circle cx="58" cy="30" r="1.5" fill="#FFAE42"/>
        <ellipse cx="50" cy="22" rx="4" ry="1.8" fill="#52B788" transform="rotate(-30 50 22)"/>
        <ellipse cx="26" cy="38" rx="4" ry="1.8" fill="#52B788" transform="rotate(20 26 38)"/>
      </svg>
    `,

    // 2. 走位換防: Stepping stones across garden pond with twin water lanterns and swift mist path
    card_command_reposition: `
      <svg viewBox="0 0 72 90" class="svg-card-art">
        <defs>
          <linearGradient id="repoBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#091320"/>
            <stop offset="60%" stop-color="#142436"/>
            <stop offset="100%" stop-color="#070C16"/>
          </linearGradient>
        </defs>
        <rect width="72" height="90" fill="url(#repoBg)"/>
        <ellipse cx="36" cy="65" rx="34" ry="18" fill="#0C1B28" stroke="#1A3348" stroke-width="0.8"/>
        <ellipse cx="20" cy="70" rx="12" ry="6" fill="#222B38" stroke="#080B18" stroke-width="1.2"/>
        <ellipse cx="50" cy="56" rx="11" ry="5.5" fill="#283546" stroke="#080B18" stroke-width="1.2"/>
        <ellipse cx="24" cy="45" rx="9" ry="4.5" fill="#1C2432" stroke="#080B18" stroke-width="1.2"/>
        <g transform="translate(14, 60)">
          <circle cx="6" cy="6" r="8" fill="#FFAE42" opacity="0.3"/>
          <rect x="3" y="2" width="6" height="8" rx="1.5" fill="#FFAE42" stroke="#080B18" stroke-width="0.8"/>
          <circle cx="6" cy="6" r="1.5" fill="#FFF8E7"/>
        </g>
        <g transform="translate(44, 46)">
          <circle cx="6" cy="6" r="8" fill="#FFAE42" opacity="0.3"/>
          <rect x="3" y="2" width="6" height="8" rx="1.5" fill="#FFAE42" stroke="#080B18" stroke-width="0.8"/>
          <circle cx="6" cy="6" r="1.5" fill="#FFF8E7"/>
        </g>
        <path d="M18 68 C16 48 52 64 50 44 C48 30 32 30 26 22" fill="none" stroke="#70C1B3" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="4,2"/>
        <polygon points="24,18 24,26 31,22" fill="#70C1B3"/>
        <circle cx="36" cy="38" r="2" fill="#FFAE42" opacity="0.8"/>
        <ellipse cx="40" cy="32" rx="2.5" ry="1.2" fill="#E86363" opacity="0.7" transform="rotate(35 40 32)"/>
      </svg>
    `,

    // 3. 守夜集結: Brass war-horn and crimson banner calling defenders from watchtower battlement
    card_command_rally: `
      <svg viewBox="0 0 72 90" class="svg-card-art">
        <defs>
          <linearGradient id="rallyBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#181428"/>
            <stop offset="50%" stop-color="#2D1E3A"/>
            <stop offset="100%" stop-color="#0F0C1A"/>
          </linearGradient>
        </defs>
        <rect width="72" height="90" fill="url(#rallyBg)"/>
        <path d="M0 72 L18 72 L18 64 L30 64 L30 72 L46 72 L46 64 L58 64 L58 72 L72 72 L72 90 L0 90 Z" fill="#141828" stroke="#080B18" stroke-width="1.3"/>
        <circle cx="62" cy="54" r="8" fill="#FFAE42" opacity="0.4"/>
        <path d="M62 48 C58 54 62 58 62 64 L64 64 C64 58 68 54 62 48 Z" fill="#C74B4B"/>
        <path d="M12 68 Q24 58 34 46 Q44 34 52 26" fill="none" stroke="#FFAE42" stroke-width="3" stroke-linecap="round"/>
        <ellipse cx="53" cy="24" rx="8" ry="12" fill="#D9822B" stroke="#080B18" stroke-width="1.2" transform="rotate(35 53 24)"/>
        <ellipse cx="53" cy="24" rx="5" ry="9" fill="#1C1822" transform="rotate(35 53 24)"/>
        <path d="M28 52 Q22 60 20 66" fill="none" stroke="#C74B4B" stroke-width="1.8"/>
        <path d="M58 14 A 12 12 0 0 1 68 28" fill="none" stroke="#FFAE42" stroke-width="2" stroke-linecap="round"/>
        <path d="M62 8 A 20 20 0 0 1 74 32" fill="none" stroke="#FFAE42" stroke-width="1.5" stroke-dasharray="3,2" stroke-linecap="round"/>
        <line x1="16" y1="70" x2="16" y2="10" stroke="#EDE3CF" stroke-width="2"/>
        <path d="M16 12 Q28 16 38 12 L38 32 Q26 36 16 30 Z" fill="#C74B4B" stroke="#080B18" stroke-width="1"/>
        <circle cx="27" cy="22" r="4" fill="#FFAE42"/>
      </svg>
    `,

    // 4. 連環迅擊: Dual crossed enchanted wakizashi blades slashing an X with cinnabar trailing arcs
    card_command_strike_again: `
      <svg viewBox="0 0 72 90" class="svg-card-art">
        <defs>
          <linearGradient id="strikeBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#24121A"/>
            <stop offset="60%" stop-color="#361822"/>
            <stop offset="100%" stop-color="#120A0E"/>
          </linearGradient>
        </defs>
        <rect width="72" height="90" fill="url(#strikeBg)"/>
        <circle cx="36" cy="45" r="18" fill="#C74B4B" opacity="0.25"/>
        <path d="M12 16 L60 74" stroke="#EDE3CF" stroke-width="4.5" stroke-linecap="round"/>
        <path d="M10 14 L62 76" stroke="#FFAE42" stroke-width="2" stroke-linecap="round"/>
        <path d="M60 16 L12 74" stroke="#EDE3CF" stroke-width="4.5" stroke-linecap="round"/>
        <path d="M62 14 L10 76" stroke="#C74B4B" stroke-width="2" stroke-linecap="round"/>
        <circle cx="36" cy="45" r="10" fill="#FFAE42" stroke="#FFF8E7" stroke-width="1.5"/>
        <circle cx="36" cy="45" r="5" fill="#FFF8E7"/>
        <polygon points="36,26 38,36 48,38 38,40 36,50 34,40 24,38 34,36" fill="#FFF8E7" opacity="0.9"/>
        <circle cx="22" cy="24" r="1.5" fill="#FFAE42"/>
        <circle cx="50" cy="62" r="1.5" fill="#FFAE42"/>
      </svg>
    `,

    // 5. 移位陣法: Yin-yang dual spirit fish Bagua water talisman formation
    card_command_tactical_swap: `
      <svg viewBox="0 0 72 90" class="svg-card-art">
        <defs>
          <linearGradient id="swapBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#0F182B"/>
            <stop offset="50%" stop-color="#1A2744"/>
            <stop offset="100%" stop-color="#080E1C"/>
          </linearGradient>
        </defs>
        <rect width="72" height="90" fill="url(#swapBg)"/>
        <polygon points="36,12 58,22 68,44 58,66 36,76 14,66 4,44 14,22" fill="#141E34" stroke="#FFAE42" stroke-width="1.2" stroke-dasharray="3,2" opacity="0.6"/>
        <circle cx="36" cy="44" r="28" fill="none" stroke="#70C1B3" stroke-width="1.5" stroke-dasharray="6,4"/>
        <path d="M36 20 C48 20 54 32 50 44 C46 54 36 50 36 44 C36 34 26 30 26 24 C26 21 30 20 36 20 Z" fill="#FFAE42" stroke="#080B18" stroke-width="1"/>
        <circle cx="42" cy="30" r="3" fill="#FFF8E7"/>
        <path d="M36 68 C24 68 18 56 22 44 C26 34 36 38 36 44 C36 54 46 58 46 64 C46 67 42 68 36 68 Z" fill="#3D7860" stroke="#080B18" stroke-width="1"/>
        <circle cx="30" cy="58" r="3" fill="#EDE3CF"/>
        <path d="M52 24 Q60 36 58 48" fill="none" stroke="#FFAE42" stroke-width="2" stroke-linecap="round"/>
        <polygon points="56,52 61,46 54,45" fill="#FFAE42"/>
        <path d="M20 64 Q12 52 14 40" fill="none" stroke="#70C1B3" stroke-width="2" stroke-linecap="round"/>
        <polygon points="16,36 11,42 18,43" fill="#70C1B3"/>
      </svg>
    `,

    // 6. 掌風擊退: Martial ink-palm strike unleashing immense bamboo-bending gale
    card_spell_gust: `
      <svg viewBox="0 0 72 90" class="svg-card-art">
        <defs>
          <linearGradient id="gustBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#0D2028"/>
            <stop offset="50%" stop-color="#183640"/>
            <stop offset="100%" stop-color="#08141A"/>
          </linearGradient>
        </defs>
        <rect width="72" height="90" fill="url(#gustBg)"/>
        <path d="M12 90 Q18 45 42 10" fill="none" stroke="#254A3E" stroke-width="4"/>
        <path d="M6 90 Q10 40 32 8" fill="none" stroke="#3D7860" stroke-width="3"/>
        <path d="M0 80 Q16 68 22 62 Q26 58 32 60 L36 72 Q24 82 8 90 Z" fill="#1A2832" stroke="#080B18" stroke-width="1.2"/>
        <path d="M14 68 Q36 34 68 26" fill="none" stroke="#EDE3CF" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M18 76 Q42 46 72 38" fill="none" stroke="#70C1B3" stroke-width="4.5" stroke-linecap="round" opacity="0.9"/>
        <path d="M24 84 Q48 58 68 52" fill="none" stroke="#52B788" stroke-width="2.5" stroke-linecap="round" opacity="0.7"/>
        <ellipse cx="46" cy="22" rx="6" ry="2.2" fill="#52B788" stroke="#080B18" stroke-width="0.8" transform="rotate(-30 46 22)"/>
        <ellipse cx="62" cy="18" rx="5" ry="2" fill="#3D7860" stroke="#080B18" stroke-width="0.8" transform="rotate(-15 62 18)"/>
        <ellipse cx="58" cy="46" rx="5.5" ry="2" fill="#52B788" stroke="#080B18" stroke-width="0.8" transform="rotate(25 58 46)"/>
        <ellipse cx="36" cy="42" rx="4.5" ry="1.8" fill="#52B788" stroke="#080B18" stroke-width="0.8" transform="rotate(-40 36 42)"/>
        <line x1="38" y1="28" x2="60" y2="22" stroke="#FFF8E7" stroke-width="1.5" stroke-linecap="round" opacity="0.8"/>
      </svg>
    `,

    // 7. 燈花爆裂: Exploding celestial lantern bursting with roaring fire petals and talisman sparks
    card_spell_fireball: `
      <svg viewBox="0 0 72 90" class="svg-card-art">
        <defs>
          <linearGradient id="fireBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#280F12"/>
            <stop offset="50%" stop-color="#3D181C"/>
            <stop offset="100%" stop-color="#140608"/>
          </linearGradient>
          <radialGradient id="fireOrb" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#FFF8E7"/>
            <stop offset="35%" stop-color="#FFAE42"/>
            <stop offset="70%" stop-color="#C74B4B"/>
            <stop offset="100%" stop-color="#5A141A"/>
          </radialGradient>
        </defs>
        <rect width="72" height="90" fill="url(#fireBg)"/>
        <circle cx="36" cy="45" r="28" fill="#5A141A" opacity="0.4"/>
        <polygon points="36,10 44,22 28,22" fill="#2E241A" stroke="#080B18" stroke-width="1"/>
        <polygon points="36,80 44,68 28,68" fill="#2E241A" stroke="#080B18" stroke-width="1"/>
        <path d="M36 18 C48 26 62 36 64 50 C66 64 52 74 36 74 C20 74 6 64 8 50 C10 36 24 26 36 18 Z" fill="url(#fireOrb)"/>
        <path d="M36 26 C44 34 50 42 48 52 C46 60 38 64 36 64 C34 64 26 60 24 52 C22 42 28 34 36 26 Z" fill="#FFAE42"/>
        <circle cx="36" cy="48" r="7" fill="#FFF8E7"/>
        <rect x="52" y="24" width="6" height="10" rx="1" fill="#FFAE42" stroke="#C74B4B" stroke-width="0.8" transform="rotate(35 52 24)"/>
        <rect x="14" y="28" width="5" height="9" rx="1" fill="#FFAE42" stroke="#C74B4B" stroke-width="0.8" transform="rotate(-30 14 28)"/>
        <circle cx="56" cy="40" r="2" fill="#FFF8E7"/>
        <circle cx="16" cy="46" r="2" fill="#FFF8E7"/>
        <circle cx="48" cy="66" r="1.5" fill="#FFAE42"/>
      </svg>
    `,

    // 8. 竹符結界: Octagonal Bagua barrier formed of inscribed bamboo talismans and protective lotus mist
    card_spell_barrier: `
      <svg viewBox="0 0 72 90" class="svg-card-art">
        <defs>
          <linearGradient id="barBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#0E1A2C"/>
            <stop offset="50%" stop-color="#162A42"/>
            <stop offset="100%" stop-color="#08101E"/>
          </linearGradient>
        </defs>
        <rect width="72" height="90" fill="url(#barBg)"/>
        <g transform="translate(36, 45)">
          <circle cx="0" cy="0" r="32" fill="#70C1B3" opacity="0.12"/>
          <polygon points="0,-34 24,-24 34,0 24,24 0,34 -24,24 -34,0 -24,-24" fill="#142438" stroke="#70C1B3" stroke-width="1.8"/>
          <polygon points="0,-26 18,-18 26,0 18,18 0,26 -18,18 -26,0 -18,-18" fill="#1E3650" stroke="#FFAE42" stroke-width="1.4"/>
          <circle cx="0" cy="0" r="10" fill="#FFAE42" stroke="#FFF8E7" stroke-width="1.5"/>
          <circle cx="0" cy="0" r="4" fill="#FFF8E7"/>
          <circle cx="0" cy="-34" r="2.5" fill="#FFAE42"/>
          <circle cx="24" cy="-24" r="2.5" fill="#FFAE42"/>
          <circle cx="34" cy="0" r="2.5" fill="#FFAE42"/>
          <circle cx="24" cy="24" r="2.5" fill="#FFAE42"/>
          <circle cx="0" cy="34" r="2.5" fill="#FFAE42"/>
          <circle cx="-24" cy="24" r="2.5" fill="#FFAE42"/>
          <circle cx="-34" cy="0" r="2.5" fill="#FFAE42"/>
          <circle cx="-24" cy="-24" r="2.5" fill="#FFAE42"/>
        </g>
      </svg>
    `,

    // 9. 夜風呼嘯: Midnight pine cyclone lifting needles and spirit orbs into an emerald vortex
    card_spell_whirlwind: `
      <svg viewBox="0 0 72 90" class="svg-card-art">
        <defs>
          <linearGradient id="whirlBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#12242E"/>
            <stop offset="50%" stop-color="#1C3844"/>
            <stop offset="100%" stop-color="#0A161E"/>
          </linearGradient>
        </defs>
        <rect width="72" height="90" fill="url(#whirlBg)"/>
        <path d="M0 40 L16 35 L12 45 L20 40 L14 55 L24 50 L10 75 L0 80 Z" fill="#0E1C22"/>
        <path d="M72 35 L56 30 L60 40 L52 35 L58 50 L48 45 L62 70 L72 75 Z" fill="#0E1C22"/>
        <path d="M36 78 C24 74 16 66 22 58 C30 50 56 54 52 42 C48 30 26 34 32 24 C36 16 48 18 42 12" fill="none" stroke="#70C1B3" stroke-width="4.5" stroke-linecap="round"/>
        <path d="M36 78 C24 74 16 66 22 58 C30 50 56 54 52 42 C48 30 26 34 32 24 C36 16 48 18 42 12" fill="none" stroke="#EDE3CF" stroke-width="2" stroke-linecap="round"/>
        <ellipse cx="28" cy="52" rx="4.5" ry="1.8" fill="#52B788" transform="rotate(-35 28 52)"/>
        <ellipse cx="46" cy="38" rx="4.5" ry="1.8" fill="#52B788" transform="rotate(25 46 38)"/>
        <ellipse cx="24" cy="32" rx="4" ry="1.5" fill="#52B788" transform="rotate(-15 24 32)"/>
        <circle cx="34" cy="46" r="2" fill="#FFAE42"/>
        <circle cx="44" cy="62" r="1.5" fill="#FFAE42"/>
      </svg>
    `,

    // 10. 凝霜咒: Six-pointed frost crystal lotus mandala blooming over freezing mist
    card_spell_freeze_mist: `
      <svg viewBox="0 0 72 90" class="svg-card-art">
        <defs>
          <linearGradient id="frostBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#0C1B2E"/>
            <stop offset="50%" stop-color="#142C48"/>
            <stop offset="100%" stop-color="#081220"/>
          </linearGradient>
        </defs>
        <rect width="72" height="90" fill="url(#frostBg)"/>
        <path d="M0 25 Q36 15 72 25 L72 45 Q36 35 0 45 Z" fill="#70C1B3" opacity="0.12"/>
        <path d="M0 65 Q36 55 72 65 L72 85 Q36 75 0 85 Z" fill="#70C1B3" opacity="0.15"/>
        <g transform="translate(36, 45)">
          <line x1="0" y1="-32" x2="0" y2="32" stroke="#70C1B3" stroke-width="3" stroke-linecap="round"/>
          <line x1="-28" y1="-16" x2="28" y2="16" stroke="#70C1B3" stroke-width="3" stroke-linecap="round"/>
          <line x1="-28" y1="16" x2="28" y2="-16" stroke="#70C1B3" stroke-width="3" stroke-linecap="round"/>
          <line x1="0" y1="-30" x2="0" y2="30" stroke="#FFF8E7" stroke-width="1.2"/>
          <line x1="-26" y1="-15" x2="26" y2="15" stroke="#FFF8E7" stroke-width="1.2"/>
          <line x1="-26" y1="15" x2="26" y2="-15" stroke="#FFF8E7" stroke-width="1.2"/>
          <path d="M-6 -22 L0 -16 L6 -22" fill="none" stroke="#70C1B3" stroke-width="2"/>
          <path d="M-6 22 L0 16 L6 22" fill="none" stroke="#70C1B3" stroke-width="2"/>
          <polygon points="0,-8 7,0 0,8 -7,0" fill="#FFF8E7" stroke="#70C1B3" stroke-width="1.5"/>
          <circle cx="0" cy="0" r="3" fill="#70C1B3"/>
        </g>
      </svg>
    `,

    // 11. 地刺竹陷: Concealed sharpened bamboo stakes bursting from courtyard flagstones with alarm talismans
    card_spell_bamboo_trap: `
      <svg viewBox="0 0 72 90" class="svg-card-art">
        <defs>
          <linearGradient id="trapBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#101D16"/>
            <stop offset="50%" stop-color="#1A2D22"/>
            <stop offset="100%" stop-color="#080F0B"/>
          </linearGradient>
        </defs>
        <rect width="72" height="90" fill="url(#trapBg)"/>
        <path d="M0 60 L72 60 L72 90 L0 90 Z" fill="#141C18" stroke="#080B08" stroke-width="1.2"/>
        <line x1="24" y1="60" x2="16" y2="90" stroke="#080B08" stroke-width="1.2"/>
        <line x1="48" y1="60" x2="56" y2="90" stroke="#080B08" stroke-width="1.2"/>
        <polygon points="14,75 22,22 28,75" fill="#3D7852" stroke="#080B18" stroke-width="1.4"/>
        <polygon points="26,78 36,12 42,78" fill="#52B788" stroke="#080B18" stroke-width="1.4"/>
        <polygon points="40,75 48,25 56,75" fill="#3D7852" stroke="#080B18" stroke-width="1.4"/>
        <polygon points="52,78 62,32 66,78" fill="#2E5C3E" stroke="#080B18" stroke-width="1.4"/>
        <line x1="24" y1="45" x2="39" y2="45" stroke="#C49A6C" stroke-width="1.8"/>
        <line x1="16" y1="52" x2="26" y2="52" stroke="#C49A6C" stroke-width="1.8"/>
        <line x1="4" y1="58" x2="68" y2="58" stroke="#C49A6C" stroke-width="2.5" stroke-dasharray="4,2"/>
        <rect x="33" y="48" width="8" height="14" rx="1.5" fill="#C74B4B" stroke="#080B18" stroke-width="1"/>
        <circle cx="37" cy="55" r="2" fill="#FFAE42"/>
        <rect x="18" y="55" width="7" height="12" rx="1.5" fill="#C74B4B" stroke="#080B18" stroke-width="1"/>
      </svg>
    `,

    // 12. 甘露靈雨: Celestial golden rain descending from spirit cloud scrolls into an ancient lotus pond
    card_spell_spirit_rain: `
      <svg viewBox="0 0 72 90" class="svg-card-art">
        <defs>
          <linearGradient id="rainBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#0B1A2C"/>
            <stop offset="50%" stop-color="#142842"/>
            <stop offset="100%" stop-color="#08101E"/>
          </linearGradient>
        </defs>
        <rect width="72" height="90" fill="url(#rainBg)"/>
        <path d="M12 18 Q24 8 36 14 Q48 8 60 18 Q66 26 56 30 Q36 32 16 30 Q6 26 12 18 Z" fill="#223C5E" stroke="#70C1B3" stroke-width="1.2"/>
        <line x1="18" y1="28" x2="14" y2="58" stroke="#FFAE42" stroke-width="2" stroke-linecap="round"/>
        <line x1="32" y1="26" x2="28" y2="64" stroke="#FFF8E7" stroke-width="2.2" stroke-linecap="round"/>
        <line x1="44" y1="28" x2="40" y2="56" stroke="#70C1B3" stroke-width="2" stroke-linecap="round"/>
        <line x1="58" y1="30" x2="54" y2="60" stroke="#FFAE42" stroke-width="2" stroke-linecap="round"/>
        <ellipse cx="36" cy="74" rx="30" ry="12" fill="#0C1826" stroke="#70C1B3" stroke-width="1.5"/>
        <ellipse cx="36" cy="74" rx="20" ry="8" fill="none" stroke="#FFAE42" stroke-width="1.2"/>
        <ellipse cx="36" cy="74" rx="10" ry="4" fill="none" stroke="#FFF8E7" stroke-width="1.2"/>
        <ellipse cx="20" cy="72" rx="7" ry="3.5" fill="#3D7852"/>
        <circle cx="24" cy="70" r="2.5" fill="#FFF8E7"/>
      </svg>
    `,

    // 13. 驚蟄神雷: Violent jagged violet and golden lightning crashing down from clouds onto pagoda eaves
    card_spell_thunder_strike: `
      <svg viewBox="0 0 72 90" class="svg-card-art">
        <defs>
          <linearGradient id="thunBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#1A102A"/>
            <stop offset="50%" stop-color="#2C1B44"/>
            <stop offset="100%" stop-color="#0E0818"/>
          </linearGradient>
        </defs>
        <rect width="72" height="90" fill="url(#thunBg)"/>
        <path d="M0 16 Q18 4 36 12 Q54 4 72 16 L72 32 Q54 24 36 30 Q18 24 0 32 Z" fill="#1C142E" stroke="#5A3A7E" stroke-width="1.2"/>
        <polygon points="36,70 68,78 64,88 8,88 4,78" fill="#120E1C" stroke="#08060E" stroke-width="1.3"/>
        <polygon points="42,8 22,40 34,40 26,72 52,34 38,34" fill="#FFAE42" stroke="#FFF8E7" stroke-width="1.8" stroke-linejoin="round"/>
        <circle cx="26" cy="72" r="6" fill="#FFF8E7"/>
        <circle cx="26" cy="72" r="12" fill="#FFAE42" opacity="0.4"/>
      </svg>
    `,

    // 14. 添燈加油: Antique bronze dragon pitcher pouring molten golden oil into a stone temple lantern font
    card_lantern_refuel: `
      <svg viewBox="0 0 72 90" class="svg-card-art">
        <defs>
          <linearGradient id="refuelBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#24160E"/>
            <stop offset="50%" stop-color="#3A2416"/>
            <stop offset="100%" stop-color="#120A06"/>
          </linearGradient>
        </defs>
        <rect width="72" height="90" fill="url(#refuelBg)"/>
        <path d="M22 68 L50 68 L46 86 L26 86 Z" fill="#242B38" stroke="#080B18" stroke-width="1.3"/>
        <ellipse cx="36" cy="68" rx="16" ry="6" fill="#FFAE42" stroke="#080B18" stroke-width="1.3"/>
        <ellipse cx="36" cy="68" rx="12" ry="4" fill="#FFF8E7"/>
        <g transform="translate(18, 14)">
          <path d="M14 12 L30 12 L36 38 L10 38 Z" fill="#8C5828" stroke="#080B18" stroke-width="1.5"/>
          <path d="M30 16 Q42 16 42 26 Q42 34 32 34" fill="none" stroke="#8C5828" stroke-width="3" stroke-linecap="round"/>
          <path d="M12 16 Q4 22 18 54" fill="none" stroke="#FFAE42" stroke-width="3.5" stroke-linecap="round"/>
          <path d="M12 16 Q4 22 18 54" fill="none" stroke="#FFF8E7" stroke-width="1.5" stroke-linecap="round"/>
          <circle cx="18" cy="54" r="3" fill="#FFF8E7"/>
        </g>
        <line x1="36" y1="62" x2="36" y2="52" stroke="#FFAE42" stroke-width="1.8" stroke-linecap="round"/>
        <line x1="24" y1="64" x2="16" y2="56" stroke="#FFAE42" stroke-width="1.8" stroke-linecap="round"/>
        <line x1="48" y1="64" x2="56" y2="56" stroke="#FFAE42" stroke-width="1.8" stroke-linecap="round"/>
      </svg>
    `,

    // 15. 輝光四射: Radiant solar starburst erupting from a sacred diamond lantern jewel
    card_lantern_flare: `
      <svg viewBox="0 0 72 90" class="svg-card-art">
        <defs>
          <linearGradient id="flareBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#281A08"/>
            <stop offset="50%" stop-color="#442E0E"/>
            <stop offset="100%" stop-color="#140D04"/>
          </linearGradient>
        </defs>
        <rect width="72" height="90" fill="url(#flareBg)"/>
        <circle cx="36" cy="45" r="32" fill="#FFAE42" opacity="0.2"/>
        <circle cx="36" cy="45" r="26" fill="none" stroke="#FFAE42" stroke-width="1.5" stroke-dasharray="4,3"/>
        <circle cx="36" cy="45" r="18" fill="none" stroke="#FFF8E7" stroke-width="1.2"/>
        <polygon points="36,6 39,32 58,18 45,36 68,45 45,54 58,72 39,58 36,84 33,58 14,72 27,54 4,45 27,36 14,18 33,32" fill="#FFAE42" stroke="#080B18" stroke-width="1"/>
        <polygon points="36,18 38,36 54,28 42,40 60,45 42,50 54,62 38,54 36,72 34,54 18,62 30,50 12,45 30,40 18,28 34,36" fill="#FFF8E7"/>
        <circle cx="36" cy="45" r="7" fill="#FFF3D6"/>
      </svg>
    `,

    // 16. 明光光環: Concentric celestial golden mandala ring with floating mini-lanterns and lotus scrolls
    card_lantern_guardian_halo: `
      <svg viewBox="0 0 72 90" class="svg-card-art">
        <defs>
          <linearGradient id="haloBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#261C10"/>
            <stop offset="50%" stop-color="#3D2D1A"/>
            <stop offset="100%" stop-color="#120D06"/>
          </linearGradient>
        </defs>
        <rect width="72" height="90" fill="url(#haloBg)"/>
        <circle cx="36" cy="45" r="30" fill="none" stroke="#FFAE42" stroke-width="2"/>
        <circle cx="36" cy="45" r="24" fill="none" stroke="#FFF8E7" stroke-width="1.4" stroke-dasharray="4,2"/>
        <circle cx="36" cy="45" r="16" fill="none" stroke="#FFAE42" stroke-width="1.2"/>
        <g transform="translate(36, 45)">
          <circle cx="0" cy="0" r="10" fill="#FFAE42"/>
          <circle cx="0" cy="0" r="5" fill="#FFF8E7"/>
          <path d="M0 -10 Q-5 -16 0 -22 Q5 -16 0 -10 Z" fill="#FFF8E7"/>
          <path d="M0 10 Q-5 16 0 22 Q5 16 0 10 Z" fill="#FFF8E7"/>
          <path d="M-10 0 Q-16 -5 -22 0 Q-16 5 -10 0 Z" fill="#FFF8E7"/>
          <path d="M10 0 Q16 -5 22 0 Q16 5 10 0 Z" fill="#FFF8E7"/>
          <rect x="-3" y="-32" width="6" height="8" rx="1.5" fill="#FFAE42"/>
          <rect x="-3" y="24" width="6" height="8" rx="1.5" fill="#FFAE42"/>
          <rect x="-31" y="-4" width="6" height="8" rx="1.5" fill="#FFAE42"/>
          <rect x="25" y="-4" width="6" height="8" rx="1.5" fill="#FFAE42"/>
        </g>
      </svg>
    `,

    // 17. 火樹銀花: Spectacular midnight festival firework celebration bursting over pagoda roofs
    card_lantern_ignite: `
      <svg viewBox="0 0 72 90" class="svg-card-art">
        <defs>
          <linearGradient id="igniteBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#140A18"/>
            <stop offset="50%" stop-color="#2D1224"/>
            <stop offset="100%" stop-color="#0E050C"/>
          </linearGradient>
        </defs>
        <rect width="72" height="90" fill="url(#igniteBg)"/>
        <path d="M0 78 L20 74 L36 78 L52 74 L72 78 L72 90 L0 90 Z" fill="#0C0812"/>
        <polygon points="36,72 40,78 32,78" fill="#C74B4B"/>
        <circle cx="36" cy="30" r="6" fill="#FFF8E7"/>
        <circle cx="36" cy="30" r="14" fill="#FFAE42" opacity="0.3"/>
        <path d="M36 30 Q18 32 10 54" fill="none" stroke="#FFAE42" stroke-width="2" stroke-linecap="round"/>
        <path d="M36 30 Q24 24 16 46" fill="none" stroke="#FFF8E7" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M36 30 Q32 14 26 42" fill="none" stroke="#C74B4B" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M36 30 Q40 14 46 42" fill="none" stroke="#C74B4B" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M36 30 Q48 24 56 46" fill="none" stroke="#FFF8E7" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M36 30 Q54 32 62 54" fill="none" stroke="#FFAE42" stroke-width="2" stroke-linecap="round"/>
        <circle cx="10" cy="54" r="2.5" fill="#FFF8E7"/>
        <circle cx="16" cy="46" r="2.2" fill="#FFAE42"/>
        <circle cx="26" cy="42" r="2.2" fill="#FFF8E7"/>
        <circle cx="46" cy="42" r="2.2" fill="#FFF8E7"/>
        <circle cx="56" cy="46" r="2.2" fill="#FFAE42"/>
        <circle cx="62" cy="54" r="2.5" fill="#FFF8E7"/>
        <circle cx="36" cy="50" r="1.5" fill="#FFAE42"/>
      </svg>
    `,

    // 18. 桐油特釀: Antique ceramic double gourd oil flask wrapped in hemp cord with steaming flame dish
    card_lantern_oil_flask: `
      <svg viewBox="0 0 72 90" class="svg-card-art">
        <defs>
          <linearGradient id="flaskBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#20150C"/>
            <stop offset="50%" stop-color="#342214"/>
            <stop offset="100%" stop-color="#100A06"/>
          </linearGradient>
        </defs>
        <rect width="72" height="90" fill="url(#flaskBg)"/>
        <rect x="0" y="66" width="72" height="24" fill="#18110A" stroke="#080503" stroke-width="1.2"/>
        <line x1="0" y1="72" x2="72" y2="72" stroke="#261A10" stroke-width="1"/>
        <ellipse cx="36" cy="74" rx="16" ry="5" fill="#060402" opacity="0.8"/>
        <ellipse cx="36" cy="54" rx="16" ry="14" fill="#4A3423" stroke="#080B18" stroke-width="1.4"/>
        <circle cx="36" cy="32" r="11" fill="#4A3423" stroke="#080B18" stroke-width="1.4"/>
        <rect x="32" y="16" width="8" height="6" fill="#7A4B2A" stroke="#080B18" stroke-width="1.2"/>
        <polygon points="30,16 42,16 40,12 32,12" fill="#C74B4B" stroke="#080B18" stroke-width="1"/>
        <path d="M26 32 Q36 38 46 32 M24 50 Q36 58 48 50 M26 58 Q36 66 46 58" fill="none" stroke="#C49A6C" stroke-width="1.2"/>
        <path d="M30 24 Q24 44 26 62 M42 24 Q48 44 46 62" fill="none" stroke="#C49A6C" stroke-width="1.2"/>
        <rect x="33" y="38" width="8" height="15" rx="1.5" fill="#C74B4B" stroke="#080B18" stroke-width="0.8"/>
        <circle cx="37" cy="45" r="2.2" fill="#FFAE42"/>
        <ellipse cx="56" cy="70" rx="8" ry="3.5" fill="#2E241A" stroke="#080B18" stroke-width="1"/>
        <ellipse cx="56" cy="69" rx="5" ry="2" fill="#FFAE42"/>
        <path d="M56 66 Q52 58 56 50 Q60 42 56 34" fill="none" stroke="#FFAE42" stroke-width="1.8" stroke-linecap="round" opacity="0.8"/>
        <path d="M58 64 Q62 56 59 48" fill="none" stroke="#FFF8E7" stroke-width="1.2" stroke-linecap="round" opacity="0.6"/>
      </svg>
    `
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

// ===== v3: painted ink-wash raster art overrides (AI-generated, see CREDITS.md) =====
const ART_DIR = "assets/art/";
const img = (name, cls = "art-img", pos = "") =>
  `<img src="${ART_DIR}${name}.webp" class="${cls}" alt="" loading="lazy" decoding="async"${pos ? ` style="object-position:${pos}"` : ""}>`;
const UNIT_IDS = ["cat_patrol","tea_master","scarecrow","tanuki_mage","frog_bard","crane_courier","little_dragon","lantern_crafter","fox_maiden","bear_baker","fog_blob","shadow_rat","paper_ghost","hop_lantern","armored_snail","split_mist","windchime_spectre","mud_golem","boss_mother_of_mist","boss_night_crow_king","boss_elder_demon"];
for (const id of UNIT_IDS) SVG_ART[id] = img(id, "art-img art-portrait");
for (const key of Object.keys(SVG_ART.cardArt)) {
  const base = key.replace(/_plus$/, "");
  if (base.startsWith("card_summon")) continue;
  SVG_ART.cardArt[key] = img(base, "art-img art-card");
}
const SUMMON = { cat: "cat_patrol", tea: "tea_master", lantern_crafter: "lantern_crafter", scarecrow: "scarecrow", tanuki: "tanuki_mage", dragon: "little_dragon", crane: "crane_courier", frog: "frog_bard", fox: "fox_maiden", bear: "bear_baker" };
for (const [k, u] of Object.entries(SUMMON)) {
  SVG_ART.cardArt[`card_summon_${k}`] = SVG_ART[u];
  SVG_ART.cardArt[`card_summon_${k}_plus`] = SVG_ART[u];
}
SVG_ART.titleKeyArt = img("title", "art-img art-scene");
SVG_ART.mapTerrainBackdrop = img("map", "art-img art-scene");
SVG_ART.victoryBackdrop = img("reward", "art-img art-scene");
SVG_ART.skyline = img("board", "art-img art-scene");
SVG_ART.townStreetPanorama = () => img("town", "art-img art-scene");
const BPOS = ["5% 60%","18% 50%","30% 55%","42% 45%","55% 60%","66% 50%","78% 55%","90% 45%","50% 80%","70% 20%"];
Object.keys(SVG_ART.buildings).forEach((k) => { SVG_ART.buildings[k] = img(k, "art-img art-bldg"); });
// Lantern states: typographic seal marks instead of cartoon drawings
SVG_ART.lantern_full = `<div class="lantern-token lit">${img("lantern","art-img")}</div>`;
SVG_ART.lantern_damaged = `<div class="lantern-token dim">${img("lantern","art-img")}</div>`;
SVG_ART.lantern_extinguished = `<div class="lantern-token out">${img("lantern","art-img")}</div>`;
const GLYPHS = { home: "宅", coin: "錢", star: "✦", undo: "↺", music: "樂", sfx: "音", lantern: "燈", moon: "月", town: "鎮", book: "書", tea: "茶", sword: "戰", boss: "首", hotspring: "泉", shrine: "祠", attack: "攻", move: "移", spawn: "召", aoe: "範", frozen: "凍", check: "✓" };
for (const k of Object.keys(SVG_ART.icons)) SVG_ART.icons[k] = `<span class="glyph">${GLYPHS[k] || "·"}</span>`;
