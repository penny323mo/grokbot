/**
 * js/render/art.js
 * Cohesive, mature, atmospheric SVG artwork for 燈籠小鎮守夜人 v2 (Visual Overhaul).
 * Art direction: Deep indigo/ink night (#0E1230, #141938, #1E2548), warm lantern glow (#F2B45A, #FFAE42, #FFF3D6),
 * cool fog (#8FA3C7 at low alpha), muted parchment (#EDE3CF). Consistent line weight (1.2-1.5px),
 * subtle gradients, warm rim-lighting from the bottom lantern side, readable silhouettes.
 */

export const SVG_ART = {
  // ================= GUARDIANS (守護者 - 10 UNITS) =================
  cat_patrol: `
    <svg viewBox="0 0 64 64" class="svg-unit cat-patrol">
      <defs>
        <linearGradient id="catGrad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stop-color="#E89234" />
          <stop offset="60%" stop-color="#C47320" />
          <stop offset="100%" stop-color="#2D283E" />
        </linearGradient>
        <radialGradient id="catGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#FFAE42" stop-opacity="0.9"/>
          <stop offset="100%" stop-color="#FFAE42" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <!-- Shadow -->
      <ellipse cx="32" cy="58" rx="18" ry="4" fill="#0A0D1E" opacity="0.6" />
      <!-- Tail with rim light -->
      <path d="M18 50 C10 46 8 36 13 30 C15 28 18 32 16 38 C15 42 19 46 22 48" fill="none" stroke="#251F33" stroke-width="2.5" stroke-linecap="round" />
      <path d="M18 50 C10 46 8 36 13 30" fill="none" stroke="#F2B45A" stroke-width="0.8" stroke-linecap="round" opacity="0.7" />
      <!-- Dark Cloak -->
      <path d="M20 38 Q16 54 32 54 Q48 54 44 38 Q32 42 20 38 Z" fill="#1A1E38" stroke="#101326" stroke-width="1.4" />
      <!-- Torso with lantern rim light -->
      <path d="M23 34 Q20 48 32 48 Q44 48 41 34 Q32 37 23 34 Z" fill="url(#catGrad)" stroke="#101326" stroke-width="1.3" />
      <!-- Daggers on belt -->
      <line x1="20" y1="44" x2="27" y2="39" stroke="#8FA3C7" stroke-width="1.8" stroke-linecap="round" />
      <line x1="44" y1="44" x2="37" y2="39" stroke="#8FA3C7" stroke-width="1.8" stroke-linecap="round" />
      <!-- Cloak Collar / Cowl -->
      <path d="M18 33 Q32 38 46 33 L43 30 Q32 34 21 30 Z" fill="#2D3559" stroke="#101326" stroke-width="1.2" />
      <!-- Brass Lantern Badge on belt -->
      <circle cx="32" cy="43" r="3" fill="#F2B45A" stroke="#101326" stroke-width="1" />
      <circle cx="32" cy="43" r="1.5" fill="#FFF3D6" />
      <!-- Cat Head -->
      <ellipse cx="32" cy="22" rx="14" ry="11.5" fill="url(#catGrad)" stroke="#101326" stroke-width="1.4" />
      <!-- Ears -->
      <polygon points="19,16 22,6 27,14" fill="#C47320" stroke="#101326" stroke-width="1.3" stroke-linejoin="round" />
      <polygon points="21,14 23,8 26,13" fill="#D9822B" opacity="0.8" />
      <polygon points="45,16 42,6 37,14" fill="#C47320" stroke="#101326" stroke-width="1.3" stroke-linejoin="round" />
      <polygon points="43,14 41,8 38,13" fill="#D9822B" opacity="0.8" />
      <!-- Eyes: Sharp amber scout gaze -->
      <ellipse cx="26.5" cy="21.5" rx="2.5" ry="3.5" fill="#FFAE42" stroke="#101326" stroke-width="0.8" />
      <ellipse cx="37.5" cy="21.5" rx="2.5" ry="3.5" fill="#FFAE42" stroke="#101326" stroke-width="0.8" />
      <line x1="26.5" y1="19" x2="26.5" y2="24" stroke="#0E1230" stroke-width="1.2" stroke-linecap="round" />
      <line x1="37.5" y1="19" x2="37.5" y2="24" stroke="#0E1230" stroke-width="1.2" stroke-linecap="round" />
      <!-- Muzzle -->
      <ellipse cx="32" cy="26" rx="5" ry="3.2" fill="#EDE3CF" opacity="0.9" />
      <polygon points="31,24.5 33,24.5 32,25.8" fill="#1A1E38" />
      <!-- Whiskers -->
      <line x1="22" y1="25.5" x2="16" y2="24.5" stroke="#EDE3CF" stroke-width="1" stroke-linecap="round" opacity="0.8" />
      <line x1="22" y1="27.5" x2="15" y2="28" stroke="#EDE3CF" stroke-width="1" stroke-linecap="round" opacity="0.8" />
      <line x1="42" y1="25.5" x2="48" y2="24.5" stroke="#EDE3CF" stroke-width="1" stroke-linecap="round" opacity="0.8" />
      <line x1="42" y1="27.5" x2="49" y2="28" stroke="#EDE3CF" stroke-width="1" stroke-linecap="round" opacity="0.8" />
    </svg>
  `,

  tea_master: `
    <svg viewBox="0 0 64 64" class="svg-unit tea-master">
      <ellipse cx="32" cy="58" rx="18" ry="4" fill="#0A0D1E" opacity="0.6" />
      <!-- Layered Celadon & Indigo Kimono -->
      <path d="M18 34 Q14 54 32 54 Q50 54 46 34 Q40 26 32 26 Q24 26 18 34 Z" fill="#2C3D34" stroke="#101326" stroke-width="1.4" />
      <path d="M24 34 L32 46 L40 34" fill="none" stroke="#EDE3CF" stroke-width="2" />
      <!-- Sash with herbal pouch -->
      <rect x="22" y="40" width="20" height="4" fill="#8B4A28" rx="1" />
      <!-- Wise Badger Head -->
      <ellipse cx="32" cy="20" rx="14" ry="12" fill="#CBBDA2" stroke="#101326" stroke-width="1.4" />
      <!-- Badger facial stripes -->
      <path d="M22 14 Q24 26 26 28 L28 28 Q27 18 25 12 Z" fill="#2A242B" />
      <path d="M42 14 Q40 26 38 28 L36 28 Q37 18 39 12 Z" fill="#2A242B" />
      <!-- Rounded Ears -->
      <circle cx="19" cy="11" r="4.5" fill="#2C3D34" stroke="#101326" stroke-width="1.2" />
      <circle cx="45" cy="11" r="4.5" fill="#2C3D34" stroke="#101326" stroke-width="1.2" />
      <!-- Spectacles -->
      <circle cx="26" cy="20" r="3.2" fill="none" stroke="#F2B45A" stroke-width="1.2" />
      <circle cx="38" cy="20" r="3.2" fill="none" stroke="#F2B45A" stroke-width="1.2" />
      <line x1="29.2" y1="20" x2="34.8" y2="20" stroke="#F2B45A" stroke-width="1.2" />
      <circle cx="26" cy="20" r="1.2" fill="#101326" />
      <circle cx="38" cy="20" r="1.2" fill="#101326" />
      <!-- Steaming Teacup in Hand -->
      <ellipse cx="44" cy="42" rx="4.5" ry="3.5" fill="#EDE3CF" stroke="#101326" stroke-width="1" />
      <!-- Steam Wisp -->
      <path d="M44 38 Q42 34 46 31 Q48 28 45 25" fill="none" stroke="#8FA3C7" stroke-width="1.2" stroke-linecap="round" opacity="0.75" />
    </svg>
  `,

  scarecrow: `
    <svg viewBox="0 0 64 64" class="svg-unit scarecrow">
      <ellipse cx="32" cy="58" rx="16" ry="4" fill="#0A0D1E" opacity="0.6" />
      <!-- Rustic Wooden Post -->
      <line x1="32" y1="18" x2="32" y2="58" stroke="#4A3423" stroke-width="3" stroke-linecap="round" />
      <line x1="12" y1="32" x2="52" y2="32" stroke="#4A3423" stroke-width="2.5" stroke-linecap="round" />
      <!-- Straw Robe -->
      <path d="M22 28 Q18 48 32 50 Q46 48 42 28 Z" fill="#C29955" stroke="#101326" stroke-width="1.3" />
      <!-- Rope Ties -->
      <line x1="23" y1="36" x2="41" y2="36" stroke="#684B28" stroke-width="1.5" />
      <!-- Glowing Ember Lantern Heart -->
      <circle cx="32" cy="38" r="3.5" fill="#F2B45A" />
      <circle cx="32" cy="38" r="1.8" fill="#FFF3D6" />
      <!-- Indigo Kasa Straw Hat -->
      <polygon points="32,6 10,22 54,22" fill="#20284A" stroke="#101326" stroke-width="1.4" stroke-linejoin="round" />
      <polygon points="32,8 14,21 50,21" fill="#2B3664" opacity="0.9" />
      <!-- Head Sack with glowing eye slits -->
      <ellipse cx="32" cy="24" rx="8" ry="6" fill="#D4AF67" stroke="#101326" stroke-width="1.2" />
      <circle cx="29" cy="23.5" r="1.5" fill="#FFAE42" />
      <circle cx="35" cy="23.5" r="1.5" fill="#FFAE42" />
      <!-- Hanging Bell Charm -->
      <circle cx="16" cy="36" r="2" fill="#F2B45A" stroke="#101326" stroke-width="0.8" />
    </svg>
  `,

  tanuki_mage: `
    <svg viewBox="0 0 64 64" class="svg-unit tanuki-mage">
      <ellipse cx="32" cy="58" rx="19" ry="4.5" fill="#0A0D1E" opacity="0.6" />
      <!-- Plump mystical body -->
      <path d="M19 32 Q15 54 32 54 Q49 54 45 32 Q39 24 32 24 Q25 24 19 32 Z" fill="#6B4B32" stroke="#101326" stroke-width="1.4" />
      <!-- Cream Belly -->
      <ellipse cx="32" cy="42" rx="10" ry="9" fill="#EDE3CF" stroke="#101326" stroke-width="1" />
      <!-- Tanuki Masked Face -->
      <ellipse cx="32" cy="22" rx="14" ry="11.5" fill="#9C7755" stroke="#101326" stroke-width="1.4" />
      <!-- Mask Patches -->
      <ellipse cx="25" cy="22" rx="5.5" ry="4" fill="#231C18" />
      <ellipse cx="39" cy="22" rx="5.5" ry="4" fill="#231C18" />
      <circle cx="26" cy="22" r="1.6" fill="#FFAE42" />
      <circle cx="38" cy="22" r="1.6" fill="#FFAE42" />
      <!-- Ears -->
      <circle cx="20" cy="12" r="4.5" fill="#6B4B32" stroke="#101326" stroke-width="1.2" />
      <circle cx="44" cy="12" r="4.5" fill="#6B4B32" stroke="#101326" stroke-width="1.2" />
      <!-- Mystical Golden Spirit Leaf upon Head -->
      <path d="M32 14 C28 8 32 3 32 3 C32 3 36 8 32 14 Z" fill="#52B788" stroke="#101326" stroke-width="1" />
      <circle cx="32" cy="8" r="1.2" fill="#FFAE42" />
      <!-- Gourd on hip -->
      <circle cx="43" cy="44" r="3.5" fill="#C49A6C" stroke="#101326" stroke-width="1" />
      <circle cx="43" cy="40" r="2.2" fill="#C49A6C" stroke="#101326" stroke-width="0.8" />
    </svg>
  `,

  frog_bard: `
    <svg viewBox="0 0 64 64" class="svg-unit frog-bard">
      <ellipse cx="32" cy="58" rx="18" ry="4" fill="#0A0D1E" opacity="0.6" />
      <!-- Jade Green Body -->
      <ellipse cx="32" cy="42" rx="15" ry="12" fill="#3D684A" stroke="#101326" stroke-width="1.4" />
      <ellipse cx="32" cy="44" rx="9" ry="8" fill="#EDE3CF" opacity="0.9" />
      <!-- Broad Frog Head -->
      <ellipse cx="32" cy="25" rx="16" ry="10" fill="#4D7F5C" stroke="#101326" stroke-width="1.4" />
      <!-- Bulbous Amber Eyes on top -->
      <circle cx="23" cy="17" r="5" fill="#FFAE42" stroke="#101326" stroke-width="1.3" />
      <ellipse cx="23" cy="17" rx="1.5" ry="3.5" fill="#101326" />
      <circle cx="41" cy="17" r="5" fill="#FFAE42" stroke="#101326" stroke-width="1.3" />
      <ellipse cx="41" cy="17" rx="1.5" ry="3.5" fill="#101326" />
      <!-- Reed Hat -->
      <ellipse cx="32" cy="13" rx="14" ry="4" fill="#997C4D" stroke="#101326" stroke-width="1.2" />
      <!-- Biwa / Lute held in arms -->
      <ellipse cx="32" cy="42" rx="6" ry="9" fill="#9E5D2A" stroke="#101326" stroke-width="1.2" />
      <line x1="32" y1="30" x2="32" y2="50" stroke="#EDE3CF" stroke-width="1" />
      <!-- Sound Spiral -->
      <path d="M42 34 Q46 30 44 26" fill="none" stroke="#F2B45A" stroke-width="1.2" stroke-linecap="round" />
    </svg>
  `,

  crane_courier: `
    <svg viewBox="0 0 64 64" class="svg-unit crane-courier">
      <ellipse cx="32" cy="58" rx="16" ry="4" fill="#0A0D1E" opacity="0.6" />
      <!-- Slender Legs -->
      <line x1="28" y1="46" x2="28" y2="58" stroke="#101326" stroke-width="1.8" />
      <line x1="36" y1="46" x2="36" y2="58" stroke="#101326" stroke-width="1.8" />
      <!-- Pure White Feathers Body -->
      <ellipse cx="32" cy="38" rx="13" ry="11" fill="#EDE3CF" stroke="#101326" stroke-width="1.4" />
      <!-- Black Wing Tips -->
      <path d="M19 34 Q17 48 24 50 Q23 40 22 34 Z" fill="#1B1E33" />
      <path d="M45 34 Q47 48 40 50 Q41 40 42 34 Z" fill="#1B1E33" />
      <!-- S-Curved Graceful Neck -->
      <path d="M32 30 Q36 22 33 14" fill="none" stroke="#EDE3CF" stroke-width="5" stroke-linecap="round" />
      <path d="M32 30 Q36 22 33 14" fill="none" stroke="#101326" stroke-width="1.2" stroke-linecap="round" />
      <!-- Head with Vermilion Crown -->
      <ellipse cx="34" cy="13" rx="5" ry="3.8" fill="#EDE3CF" stroke="#101326" stroke-width="1.2" />
      <path d="M31 10 Q34 8 37 10" fill="none" stroke="#C74B4B" stroke-width="2.5" stroke-linecap="round" />
      <!-- Slender Beak holding Dispatch Scroll -->
      <line x1="39" y1="13" x2="48" y2="15" stroke="#D9822B" stroke-width="1.6" stroke-linecap="round" />
      <rect x="42" y="16" width="10" height="4" rx="1" fill="#FFF3D6" stroke="#101326" stroke-width="0.8" />
      <circle cx="47" cy="18" r="1.2" fill="#C74B4B" />
    </svg>
  `,

  little_dragon: `
    <svg viewBox="0 0 64 64" class="svg-unit little-dragon">
      <ellipse cx="32" cy="58" rx="18" ry="4" fill="#0A0D1E" opacity="0.6" />
      <!-- Coiled Celestial Serpent Body -->
      <path d="M16 48 C12 36 24 30 32 36 C40 42 50 36 46 26 C42 16 30 18 32 24" fill="none" stroke="#C74B4B" stroke-width="7" stroke-linecap="round" />
      <path d="M16 48 C12 36 24 30 32 36 C40 42 50 36 46 26 C42 16 30 18 32 24" fill="none" stroke="#FFAE42" stroke-width="3" stroke-linecap="round" />
      <!-- Dragon Head -->
      <ellipse cx="32" cy="22" rx="9" ry="7" fill="#C74B4B" stroke="#101326" stroke-width="1.3" />
      <!-- Golden Antlers / Horns -->
      <path d="M28 16 Q26 10 23 8 M36 16 Q38 10 41 8" fill="none" stroke="#F2B45A" stroke-width="1.8" stroke-linecap="round" />
      <!-- Golden Whiskers -->
      <path d="M26 23 Q18 24 16 29 M38 23 Q46 24 48 29" fill="none" stroke="#F2B45A" stroke-width="1.2" stroke-linecap="round" />
      <!-- Glowing Eyes -->
      <circle cx="28" cy="20" r="1.5" fill="#FFF3D6" />
      <circle cx="36" cy="20" r="1.5" fill="#FFF3D6" />
      <!-- Glowing Dragon Pearl in claws -->
      <circle cx="32" cy="46" r="4" fill="#FFAE42" stroke="#101326" stroke-width="1" />
      <circle cx="32" cy="46" r="2" fill="#FFF3D6" />
    </svg>
  `,

  lantern_crafter: `
    <svg viewBox="0 0 64 64" class="svg-unit lantern-crafter">
      <ellipse cx="32" cy="58" rx="18" ry="4" fill="#0A0D1E" opacity="0.6" />
      <!-- Master Artisan Robe & Leather Apron -->
      <path d="M20 32 Q16 54 32 54 Q48 54 44 32 Z" fill="#2E3354" stroke="#101326" stroke-width="1.4" />
      <rect x="24" y="34" width="16" height="18" rx="2" fill="#6B442A" stroke="#101326" stroke-width="1.2" />
      <!-- Wise Grey-haired Head with topknot -->
      <ellipse cx="32" cy="20" rx="11" ry="10" fill="#D8CCA8" stroke="#101326" stroke-width="1.3" />
      <circle cx="32" cy="9" r="3.5" fill="#5A617A" stroke="#101326" stroke-width="1" />
      <!-- Eyes & Beard -->
      <circle cx="28" cy="19" r="1.4" fill="#101326" />
      <circle cx="36" cy="19" r="1.4" fill="#101326" />
      <path d="M29 25 Q32 30 35 25 Z" fill="#EDE3CF" stroke="#101326" stroke-width="0.8" />
      <!-- Ornate Hexagonal Brass Pavilion Lantern in hand -->
      <rect x="42" y="34" width="10" height="14" rx="2" fill="#FFAE42" stroke="#101326" stroke-width="1.2" />
      <circle cx="47" cy="41" r="3" fill="#FFF3D6" />
      <polygon points="40,34 54,34 47,29" fill="#C74B4B" stroke="#101326" stroke-width="1" />
    </svg>
  `,

  fox_maiden: `
    <svg viewBox="0 0 64 64" class="svg-unit fox-maiden">
      <ellipse cx="32" cy="58" rx="18" ry="4" fill="#0A0D1E" opacity="0.6" />
      <!-- Three Fluffy Tails with white tips -->
      <path d="M16 48 Q10 32 18 26 Q24 38 22 48 Z" fill="#D96E34" stroke="#101326" stroke-width="1.2" />
      <path d="M48 48 Q54 32 46 26 Q40 38 42 48 Z" fill="#D96E34" stroke="#101326" stroke-width="1.2" />
      <!-- Miko Ceremonial Robe (White & Scarlet) -->
      <path d="M22 32 Q16 54 32 54 Q48 54 42 32 Z" fill="#C74B4B" stroke="#101326" stroke-width="1.4" />
      <path d="M24 32 L32 44 L40 32 Z" fill="#EDE3CF" />
      <!-- Elegant Vulpine Head -->
      <ellipse cx="32" cy="20" rx="12" ry="10" fill="#D96E34" stroke="#101326" stroke-width="1.3" />
      <polygon points="21,16 24,5 29,14" fill="#EDE3CF" stroke="#101326" stroke-width="1.2" />
      <polygon points="43,16 40,5 35,14" fill="#EDE3CF" stroke="#101326" stroke-width="1.2" />
      <!-- Miko Mask markings & Amber Eyes -->
      <ellipse cx="26" cy="19.5" rx="2.5" ry="1.8" fill="#FFAE42" stroke="#101326" stroke-width="0.8" />
      <ellipse cx="38" cy="19.5" rx="2.5" ry="1.8" fill="#FFAE42" stroke="#101326" stroke-width="0.8" />
      <path d="M23 16 Q26 15 28 17 M41 16 Q38 15 36 17" fill="none" stroke="#C74B4B" stroke-width="1.2" />
      <!-- Floating Spirit Talisman (Ofuda) -->
      <rect x="42" y="24" width="6" height="12" rx="1" fill="#EDE3CF" stroke="#C74B4B" stroke-width="0.8" transform="rotate(15 45 30)" />
    </svg>
  `,

  bear_baker: `
    <svg viewBox="0 0 64 64" class="svg-unit bear-baker">
      <ellipse cx="32" cy="58" rx="20" ry="4.5" fill="#0A0D1E" opacity="0.6" />
      <!-- Sturdy Bear Body in Baker's Apron -->
      <path d="M18 34 Q14 54 32 54 Q50 54 46 34 Q40 26 32 26 Z" fill="#5C4033" stroke="#101326" stroke-width="1.4" />
      <path d="M22 34 L22 52 Q32 54 42 52 L42 34 Z" fill="#EDE3CF" stroke="#101326" stroke-width="1.2" />
      <!-- Round Friendly Bear Head -->
      <ellipse cx="32" cy="20" rx="14" ry="12" fill="#755243" stroke="#101326" stroke-width="1.4" />
      <circle cx="19" cy="11" r="4.5" fill="#5C4033" stroke="#101326" stroke-width="1.2" />
      <circle cx="45" cy="11" r="4.5" fill="#5C4033" stroke="#101326" stroke-width="1.2" />
      <ellipse cx="32" cy="23" rx="6" ry="4.5" fill="#EDE3CF" />
      <polygon points="31,21 33,21 32,22.5" fill="#101326" />
      <circle cx="26" cy="18" r="1.5" fill="#101326" />
      <circle cx="38" cy="18" r="1.5" fill="#101326" />
      <!-- Bamboo Steamer with Golden Steaming Bun -->
      <rect x="22" y="40" width="20" height="7" rx="2" fill="#C49A6C" stroke="#101326" stroke-width="1.2" />
      <ellipse cx="32" cy="38" rx="4.5" ry="3.5" fill="#FFF3D6" stroke="#D9822B" stroke-width="1" />
      <path d="M32 33 Q30 30 33 27" fill="none" stroke="#8FA3C7" stroke-width="1" stroke-linecap="round" />
    </svg>
  `,

  // ================= ENEMIES (霧怪 - 11 UNITS) =================
  fog_blob: `
    <svg viewBox="0 0 64 64" class="svg-unit fog-blob">
      <ellipse cx="32" cy="56" rx="18" ry="4" fill="#0A0D1E" opacity="0.6" />
      <!-- Swirling Midnight Mist Entity -->
      <path d="M18 48 C12 40 16 28 26 22 C32 18 42 20 46 28 C52 38 46 48 34 50 C26 51 21 52 18 48 Z" fill="#242B4D" stroke="#3A487B" stroke-width="1.5" />
      <path d="M22 42 C18 36 22 28 30 25 C38 22 44 28 42 36 C40 42 34 44 28 44 Z" fill="#1B203B" opacity="0.8" />
      <!-- Ghostly Glowing Azure Eyes -->
      <circle cx="28" cy="32" r="2.8" fill="#70C1B3" />
      <circle cx="38" cy="32" r="2.8" fill="#70C1B3" />
      <circle cx="29" cy="31" r="1" fill="#FFFFFF" />
      <circle cx="39" cy="31" r="1" fill="#FFFFFF" />
    </svg>
  `,

  armored_snail: `
    <svg viewBox="0 0 64 64" class="svg-unit armored-snail">
      <ellipse cx="32" cy="56" rx="20" ry="4.5" fill="#0A0D1E" opacity="0.6" />
      <!-- Spiked Heavy Iron Shell with Ancient Runes -->
      <path d="M16 46 C12 30 24 16 38 18 C50 20 54 36 48 48 Z" fill="#3D4566" stroke="#101326" stroke-width="1.5" />
      <path d="M26 36 C24 28 32 24 38 26 C44 28 44 36 38 40 Z" fill="#252A42" stroke="#5E6C9E" stroke-width="1.2" />
      <!-- Spikes -->
      <polygon points="32,17 34,10 38,18" fill="#101326" />
      <polygon points="44,22 49,17 48,26" fill="#101326" />
      <!-- Snail Foot & Feelers -->
      <path d="M12 50 Q26 52 52 50 Q48 46 36 46 Z" fill="#5B759E" stroke="#101326" stroke-width="1.3" />
      <line x1="16" y1="46" x2="12" y2="38" stroke="#5B759E" stroke-width="1.8" stroke-linecap="round" />
      <circle cx="12" cy="37" r="1.8" fill="#FFAE42" />
      <line x1="20" y1="46" x2="18" y2="36" stroke="#5B759E" stroke-width="1.8" stroke-linecap="round" />
      <circle cx="18" cy="35" r="1.8" fill="#FFAE42" />
    </svg>
  `,

  hop_lantern: `
    <svg viewBox="0 0 64 64" class="svg-unit hop-lantern">
      <ellipse cx="32" cy="58" rx="14" ry="3.5" fill="#0A0D1E" opacity="0.6" />
      <!-- One Wooden Hopping Leg -->
      <line x1="32" y1="44" x2="32" y2="58" stroke="#4A3423" stroke-width="3" stroke-linecap="round" />
      <!-- Cursed Stone Lantern Body -->
      <polygon points="18,14 46,14 40,44 24,44" fill="#383D59" stroke="#101326" stroke-width="1.4" />
      <polygon points="14,14 50,14 32,6" fill="#252A42" stroke="#101326" stroke-width="1.4" stroke-linejoin="round" />
      <!-- Wicked Carved Grin with Purple Witchflame -->
      <polygon points="26,24 30,22 28,26" fill="#A370A8" />
      <polygon points="38,24 34,22 36,26" fill="#A370A8" />
      <path d="M24 34 Q32 40 40 34 Q36 38 32 38 Q28 38 24 34 Z" fill="#A370A8" stroke="#101326" stroke-width="1" />
      <!-- Cursed Violet Glow Core -->
      <circle cx="32" cy="30" r="3" fill="#D896FF" />
    </svg>
  `,

  windchime_spectre: `
    <svg viewBox="0 0 64 64" class="svg-unit windchime-spectre">
      <ellipse cx="32" cy="58" rx="14" ry="3.5" fill="#0A0D1E" opacity="0.4" />
      <!-- Floating Wispy Phantom Shroud -->
      <path d="M24 22 C18 36 16 52 24 54 C30 50 34 54 40 54 C46 52 46 36 40 22 C36 16 28 16 24 22 Z" fill="#2C365E" stroke="#5E6E9E" stroke-width="1.4" />
      <!-- Hollow Glowing Mask -->
      <ellipse cx="32" cy="22" rx="9" ry="8" fill="#141938" stroke="#5E6E9E" stroke-width="1.2" />
      <circle cx="28" cy="21" r="2" fill="#70C1B3" />
      <circle cx="36" cy="21" r="2" fill="#70C1B3" />
      <!-- Rusted Iron Windchime causing curse wave -->
      <line x1="32" y1="36" x2="32" y2="48" stroke="#D9822B" stroke-width="1.5" />
      <polygon points="30,48 34,48 32,53" fill="#A370A8" />
      <!-- Sonic Curse Ring -->
      <circle cx="32" cy="50" r="6" fill="none" stroke="#A370A8" stroke-width="1" stroke-dasharray="2,2" opacity="0.8" />
    </svg>
  `,

  mud_golem: `
    <svg viewBox="0 0 64 64" class="svg-unit mud-golem">
      <ellipse cx="32" cy="58" rx="20" ry="4.5" fill="#0A0D1E" opacity="0.6" />
      <!-- Bulky Riverbed Boulder & Clay Body -->
      <path d="M16 34 Q12 54 32 54 Q52 54 48 34 Q42 22 32 22 Q22 22 16 34 Z" fill="#423E3B" stroke="#101326" stroke-width="1.5" />
      <!-- Moss & Bamboo Vine Creepers -->
      <path d="M22 38 Q26 48 30 46 M38 36 Q42 44 46 48" fill="none" stroke="#52B788" stroke-width="2" stroke-linecap="round" />
      <!-- Stone Head & Molten Fissures -->
      <polygon points="24,24 40,24 36,12 28,12" fill="#2E2C2A" stroke="#101326" stroke-width="1.4" stroke-linejoin="round" />
      <circle cx="28" cy="18" r="2" fill="#FFAE42" />
      <circle cx="36" cy="18" r="2" fill="#FFAE42" />
    </svg>
  `,

  split_mist: `
    <svg viewBox="0 0 64 64" class="svg-unit split-mist">
      <ellipse cx="32" cy="56" rx="18" ry="4" fill="#0A0D1E" opacity="0.5" />
      <!-- Twin-Headed Vortex Mist -->
      <path d="M14 44 C10 30 18 20 26 24 C30 26 34 26 38 24 C46 20 54 30 50 44 C44 50 20 50 14 44 Z" fill="#1E284A" stroke="#485D96" stroke-width="1.4" />
      <!-- Left & Right Eyes -->
      <circle cx="24" cy="30" r="2.5" fill="#8FA3C7" />
      <circle cx="40" cy="30" r="2.5" fill="#8FA3C7" />
    </svg>
  `,

  crow_thief: `
    <svg viewBox="0 0 64 64" class="svg-unit crow-thief">
      <ellipse cx="32" cy="58" rx="16" ry="4" fill="#0A0D1E" opacity="0.6" />
      <!-- Raven Cloak & Folded Wings -->
      <path d="M20 34 Q16 52 32 52 Q48 52 44 34 Q38 26 32 26 Z" fill="#151829" stroke="#101326" stroke-width="1.4" />
      <!-- Sharp Raven Head & Beak -->
      <ellipse cx="32" cy="22" rx="10" ry="8" fill="#1F243D" stroke="#101326" stroke-width="1.2" />
      <polygon points="34,20 48,23 34,26" fill="#D9822B" stroke="#101326" stroke-width="1" />
      <!-- Brass Monocle -->
      <circle cx="30" cy="21" r="3" fill="none" stroke="#F2B45A" stroke-width="1.2" />
      <circle cx="30" cy="21" r="1.5" fill="#FFAE42" />
      <!-- Stolen Lantern Shard in claw -->
      <polygon points="26,44 32,40 30,48" fill="#FFAE42" stroke="#101326" stroke-width="0.8" />
    </svg>
  `,

  shadow_stalker: `
    <svg viewBox="0 0 64 64" class="svg-unit shadow-stalker">
      <ellipse cx="32" cy="58" rx="20" ry="4" fill="#0A0D1E" opacity="0.7" />
      <!-- Quadruped Shadow Beast -->
      <path d="M12 42 C16 32 30 32 46 36 C52 38 54 48 46 50 C32 50 16 50 12 42 Z" fill="#0D1021" stroke="#2D3559" stroke-width="1.4" />
      <!-- Predator Fangs & Red Eyes -->
      <ellipse cx="48" cy="34" rx="8" ry="6" fill="#14182E" stroke="#2D3559" stroke-width="1.2" />
      <circle cx="50" cy="33" r="1.8" fill="#E86363" />
      <polygon points="46,38 48,42 50,38" fill="#EDE3CF" />
    </svg>
  `,

  boss_mother_of_mist: `
    <svg viewBox="0 0 64 64" class="svg-unit boss-mother-of-mist">
      <ellipse cx="32" cy="58" rx="22" ry="5" fill="#0A0D1E" opacity="0.8" />
      <!-- Flowing Ethereal Ghostly Gown -->
      <path d="M14 36 Q8 56 32 56 Q56 56 50 36 Q42 18 32 18 Q22 18 14 36 Z" fill="#1C2445" stroke="#6076A8" stroke-width="1.6" />
      <!-- Weeping Veil & Crown -->
      <path d="M22 16 Q32 10 42 16 L44 30 Q32 34 20 30 Z" fill="#2E3B68" stroke="#101326" stroke-width="1.2" opacity="0.9" />
      <polygon points="32,4 26,12 38,12" fill="#F2B45A" stroke="#101326" stroke-width="1" />
      <!-- Luminous Cyan Aura Eyes -->
      <circle cx="28" cy="22" r="2.5" fill="#70C1B3" />
      <circle cx="36" cy="22" r="2.5" fill="#70C1B3" />
    </svg>
  `,

  boss_night_crow_king: `
    <svg viewBox="0 0 64 64" class="svg-unit boss-night-crow-king">
      <ellipse cx="32" cy="58" rx="22" ry="5" fill="#0A0D1E" opacity="0.8" />
      <!-- Massive Feathered Shroud & Obsidian Cape -->
      <path d="M12 36 Q8 56 32 56 Q56 56 52 36 Q42 16 32 16 Z" fill="#0F1224" stroke="#3A487B" stroke-width="1.6" />
      <!-- Jagged Bone Crown -->
      <polygon points="22,14 26,6 32,10 38,6 42,14" fill="#EDE3CF" stroke="#101326" stroke-width="1.2" stroke-linejoin="round" />
      <!-- Piercing Golden Eyes & Raven Beak -->
      <ellipse cx="32" cy="20" rx="9" ry="7" fill="#1B1F38" />
      <polygon points="32,20 44,24 32,28" fill="#D9822B" stroke="#101326" stroke-width="1" />
      <circle cx="29" cy="19" r="2" fill="#FFAE42" />
    </svg>
  `,

  boss_elder_demon: `
    <svg viewBox="0 0 64 64" class="svg-unit boss-elder-demon">
      <ellipse cx="32" cy="58" rx="22" ry="5" fill="#0A0D1E" opacity="0.8" />
      <!-- Hulking Oni Silhouette -->
      <path d="M14 34 Q8 56 32 56 Q56 56 50 34 Q42 18 32 18 Z" fill="#3D1818" stroke="#101326" stroke-width="1.6" />
      <!-- Twin Demonic Curved Horns -->
      <path d="M22 16 Q16 6 12 8 M42 16 Q48 6 52 8" fill="none" stroke="#F2B45A" stroke-width="3" stroke-linecap="round" />
      <!-- Carved Noh Mask with Crimson Markings -->
      <ellipse cx="32" cy="24" rx="11" ry="11" fill="#EDE3CF" stroke="#101326" stroke-width="1.4" />
      <path d="M25 18 Q32 20 39 18" fill="none" stroke="#C74B4B" stroke-width="2" />
      <!-- Glowing Eyes & Fanged Grimace -->
      <ellipse cx="27" cy="23" rx="2" ry="3" fill="#FFAE42" />
      <ellipse cx="37" cy="23" rx="2" ry="3" fill="#FFAE42" />
      <path d="M26 30 Q32 34 38 30 Z" fill="#101326" />
    </svg>
  `,

  // ================= LANTERNS (石木亭台明燈) =================
  lantern_full: `
    <svg viewBox="0 0 48 48" class="svg-lantern lantern-full">
      <defs>
        <radialGradient id="lanternWarmGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#FFF3D6" />
          <stop offset="35%" stop-color="#FFAE42" />
          <stop offset="70%" stop-color="#E87A1E" stop-opacity="0.8"/>
          <stop offset="100%" stop-color="#E87A1E" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <!-- Shadow -->
      <ellipse cx="24" cy="45" rx="16" ry="3" fill="#0A0D1E" opacity="0.7" />
      <!-- Carved Stone Base -->
      <polygon points="17,45 31,45 29,39 19,39" fill="#2E354F" stroke="#101326" stroke-width="1.2" />
      <rect x="22" y="35" width="4" height="5" fill="#20263D" stroke="#101326" stroke-width="1" />
      <rect x="16" y="33" width="16" height="3" rx="1" fill="#444E73" stroke="#101326" stroke-width="1" />
      <!-- Luminous Paper Core -->
      <rect x="15" y="15" width="18" height="19" rx="3" fill="url(#lanternWarmGlow)" stroke="#101326" stroke-width="1.3" />
      <!-- Wooden Lattice Grate -->
      <line x1="24" y1="15" x2="24" y2="34" stroke="#3D2012" stroke-width="1.3" opacity="0.8" />
      <line x1="15" y1="24.5" x2="33" y2="24.5" stroke="#3D2012" stroke-width="1.3" opacity="0.8" />
      <!-- Pagoda Roof Eaves -->
      <polygon points="8,15 40,15 32,8 16,8" fill="#1C223A" stroke="#101326" stroke-width="1.3" stroke-linejoin="round" />
      <path d="M6 15 Q24 13 42 15" fill="none" stroke="#D9822B" stroke-width="1" />
      <circle cx="24" cy="7" r="2" fill="#F2B45A" stroke="#101326" stroke-width="0.8" />
    </svg>
  `,

  lantern_damaged: `
    <svg viewBox="0 0 48 48" class="svg-lantern lantern-damaged">
      <ellipse cx="24" cy="45" rx="16" ry="3" fill="#0A0D1E" opacity="0.7" />
      <polygon points="17,45 31,45 29,39 19,39" fill="#2E354F" stroke="#101326" stroke-width="1.2" />
      <rect x="22" y="35" width="4" height="5" fill="#20263D" />
      <rect x="16" y="33" width="16" height="3" rx="1" fill="#444E73" />
      <!-- Flickering cracked core -->
      <rect x="15" y="15" width="18" height="19" rx="3" fill="#D9822B" stroke="#101326" stroke-width="1.3" />
      <line x1="18" y1="18" x2="28" y2="30" stroke="#101326" stroke-width="1.4" />
      <circle cx="24" cy="25" r="3" fill="#FFAE42" />
      <polygon points="8,15 40,15 32,8 16,8" fill="#1C223A" stroke="#101326" stroke-width="1.3" />
    </svg>
  `,

  lantern_extinguished: `
    <svg viewBox="0 0 48 48" class="svg-lantern lantern-extinguished">
      <ellipse cx="24" cy="45" rx="16" ry="3" fill="#0A0D1E" opacity="0.7" />
      <polygon points="17,45 31,45 29,39 19,39" fill="#1E2336" stroke="#101326" stroke-width="1.2" />
      <rect x="22" y="35" width="4" height="5" fill="#161A28" />
      <!-- Cold ash body -->
      <rect x="15" y="15" width="18" height="19" rx="3" fill="#2C3247" stroke="#101326" stroke-width="1.3" />
      <polygon points="8,15 40,15 32,8 16,8" fill="#151826" stroke="#101326" stroke-width="1.3" />
    </svg>
  `,

  // ================= TERRAINS (地形 - 5 TERRAINS) =================
  terrains: {
    bamboo: `
      <svg viewBox="0 0 64 64" class="svg-terrain terrain-bamboo">
        <line x1="20" y1="62" x2="20" y2="10" stroke="#2D5A3D" stroke-width="4.5" stroke-linecap="round" />
        <line x1="32" y1="62" x2="32" y2="6" stroke="#3D7852" stroke-width="5" stroke-linecap="round" />
        <line x1="44" y1="62" x2="44" y2="14" stroke="#2D5A3D" stroke-width="4.5" stroke-linecap="round" />
        <!-- Nodes -->
        <line x1="17" y1="28" x2="23" y2="28" stroke="#1A3322" stroke-width="2" />
        <line x1="29" y1="24" x2="35" y2="24" stroke="#1A3322" stroke-width="2" />
        <line x1="41" y1="32" x2="47" y2="32" stroke="#1A3322" stroke-width="2" />
        <!-- Leaves -->
        <path d="M32 20 Q42 16 48 20" fill="none" stroke="#52B788" stroke-width="3" stroke-linecap="round" />
        <path d="M32 30 Q22 26 16 30" fill="none" stroke="#52B788" stroke-width="3" stroke-linecap="round" />
      </svg>
    `,
    water: `
      <svg viewBox="0 0 64 64" class="svg-terrain terrain-water">
        <rect width="64" height="64" fill="#14213D" opacity="0.75" />
        <path d="M4 20 Q18 14 32 20 T60 20" fill="none" stroke="#5B8C85" stroke-width="2.5" stroke-linecap="round" opacity="0.8" />
        <path d="M8 40 Q22 34 36 40 T58 40" fill="none" stroke="#70C1B3" stroke-width="2" stroke-linecap="round" opacity="0.7" />
        <ellipse cx="22" cy="30" rx="6" ry="3" fill="#2D5A3D" opacity="0.8" />
      </svg>
    `,
    post: `
      <svg viewBox="0 0 64 64" class="svg-terrain terrain-post">
        <!-- Stone Lantern Platform -->
        <ellipse cx="32" cy="52" rx="22" ry="8" fill="#1E2540" stroke="#3A487B" stroke-width="1.5" />
        <rect x="26" y="24" width="12" height="28" fill="#2E3A63" stroke="#101326" stroke-width="1.3" />
        <polygon points="18,24 46,24 40,16 24,16" fill="#3D4D84" stroke="#101326" stroke-width="1.2" />
      </svg>
    `,
    fog: `
      <svg viewBox="0 0 64 64" class="svg-terrain terrain-fog">
        <rect width="64" height="64" fill="#1B2344" opacity="0.6" />
        <path d="M0 24 Q32 16 64 24 L64 48 Q32 56 0 48 Z" fill="#8FA3C7" opacity="0.25" />
      </svg>
    `
  },

  // ================= TOWN BUILDINGS (10 ARCHITECTURAL ILLUSTRATIONS) =================
  buildings: {
    bldg_watchtower: `<svg viewBox="0 0 64 64" class="svg-building"><rect width="64" height="64" rx="8" fill="#141935"/><path d="M8 58 L56 58" stroke="#0E122A" stroke-width="4"/><polygon points="20,56 44,56 40,24 24,24" fill="#242C54" stroke="#0F1328" stroke-width="1.5"/><polygon points="16,25 48,25 32,8" fill="#C74B4B" stroke="#0F1328" stroke-width="1.8"/><circle cx="32" cy="18" r="3.5" fill="#FFAE42"/><line x1="32" y1="2" x2="32" y2="8" stroke="#FFAE42" stroke-width="1.8"/><rect x="28" y="34" width="8" height="12" rx="2" fill="#FFAE42" opacity="0.85"/></svg>`,
    bldg_courier: `<svg viewBox="0 0 64 64" class="svg-building"><rect width="64" height="64" rx="8" fill="#141935"/><polygon points="12,56 52,56 46,26 18,26" fill="#1F2848" stroke="#0F1328" stroke-width="1.5"/><polygon points="10,26 54,26 32,10" fill="#2D3B6B" stroke="#0F1328" stroke-width="1.8"/><circle cx="32" cy="20" r="4" fill="#EDE3CF"/><path d="M22 20 Q32 14 42 20" fill="none" stroke="#C74B4B" stroke-width="2"/><rect x="26" y="38" width="12" height="18" fill="#FFAE42" opacity="0.9"/></svg>`,
    bldg_music_hall: `<svg viewBox="0 0 64 64" class="svg-building"><rect width="64" height="64" rx="8" fill="#141935"/><polygon points="6,26 58,26 32,8" fill="#D9822B" stroke="#0F1328" stroke-width="1.8"/><line x1="16" y1="26" x2="16" y2="56" stroke="#0F1328" stroke-width="3"/><line x1="48" y1="26" x2="48" y2="56" stroke="#0F1328" stroke-width="3"/><rect x="22" y="30" width="20" height="26" fill="#242B4E"/><ellipse cx="32" cy="42" rx="6" ry="8" fill="#FFAE42" opacity="0.9"/></svg>`,
    bldg_fox_shrine: `<svg viewBox="0 0 64 64" class="svg-building"><rect width="64" height="64" rx="8" fill="#141935"/><line x1="8" y1="16" x2="56" y2="16" stroke="#C74B4B" stroke-width="5" stroke-linecap="round"/><line x1="12" y1="22" x2="52" y2="22" stroke="#C74B4B" stroke-width="2.5"/><line x1="18" y1="16" x2="18" y2="58" stroke="#0F1328" stroke-width="3.5"/><line x1="46" y1="16" x2="46" y2="58" stroke="#0F1328" stroke-width="3.5"/><circle cx="32" cy="36" r="6" fill="#FFAE42"/><polygon points="32,26 28,34 36,34" fill="#EDE3CF"/></svg>`,
    bldg_bakery: `<svg viewBox="0 0 64 64" class="svg-building"><rect width="64" height="64" rx="8" fill="#141935"/><rect x="12" y="24" width="40" height="32" rx="2" fill="#263156" stroke="#0F1328" stroke-width="1.5"/><polygon points="8,24 56,24 32,8" fill="#C47D3B" stroke="#0F1328" stroke-width="1.8"/><rect x="42" y="10" width="6" height="12" fill="#525F88"/><ellipse cx="32" cy="40" rx="8" ry="6" fill="#FFF3D6"/><path d="M28 32 Q32 26 36 32" fill="none" stroke="#FFAE42" stroke-width="2"/></svg>`,
    bldg_tea_bush: `<svg viewBox="0 0 64 64" class="svg-building"><rect width="64" height="64" rx="8" fill="#141935"/><rect x="10" y="24" width="44" height="32" rx="2" fill="#222C4E" stroke="#0F1328" stroke-width="1.5"/><polygon points="6,24 58,24 32,8" fill="#40916C" stroke="#0F1328" stroke-width="1.8"/><circle cx="32" cy="38" r="6" fill="#52B788"/><circle cx="24" cy="44" r="5" fill="#40916C"/><circle cx="40" cy="44" r="5" fill="#40916C"/></svg>`,
    bldg_forge: `<svg viewBox="0 0 64 64" class="svg-building"><rect width="64" height="64" rx="8" fill="#141935"/><rect x="12" y="26" width="40" height="30" fill="#2A2438" stroke="#0F1328" stroke-width="1.5"/><polygon points="8,26 56,26 32,10" fill="#784D35" stroke="#0F1328" stroke-width="1.8"/><rect x="38" y="8" width="8" height="16" fill="#3D3A4A"/><ellipse cx="32" cy="42" rx="8" ry="6" fill="#FF5722"/><circle cx="32" cy="42" r="3" fill="#FFE082"/></svg>`,
    bldg_lucky_stone: `<svg viewBox="0 0 64 64" class="svg-building"><rect width="64" height="64" rx="8" fill="#141935"/><polygon points="20,58 44,58 40,16 24,16" fill="#2D3860" stroke="#0F1328" stroke-width="1.8"/><polygon points="24,16 40,16 32,8" fill="#3B497B" stroke="#0F1328" stroke-width="1.8"/><polygon points="32,22 34,28 40,28 35,32 37,38 32,34 27,38 29,32 24,28 30,28" fill="#FFAE42"/><circle cx="32" cy="48" r="2.5" fill="#70C1B3"/></svg>`,
    bldg_herbal_garden: `<svg viewBox="0 0 64 64" class="svg-building"><rect width="64" height="64" rx="8" fill="#141935"/><ellipse cx="32" cy="44" rx="22" ry="10" fill="#1B4D45" stroke="#0F1328" stroke-width="1.8"/><ellipse cx="32" cy="44" rx="16" ry="6" fill="#3BA99C"/><path d="M22 32 Q26 22 22 14 M32 30 Q36 20 32 12 M42 32 Q46 22 42 14" fill="none" stroke="#70C1B3" stroke-width="2.2" stroke-linecap="round"/></svg>`,
    bldg_star_pavilion: `<svg viewBox="0 0 64 64" class="svg-building"><rect width="64" height="64" rx="8" fill="#141935"/><polygon points="12,56 52,56 46,26 18,26" fill="#252D56" stroke="#0F1328" stroke-width="1.5"/><polygon points="8,26 56,26 32,8" fill="#5E35B1" stroke="#0F1328" stroke-width="1.8"/><circle cx="32" cy="8" r="4" fill="#FFAE42"/><circle cx="32" cy="38" r="7" fill="#FFAE42" opacity="0.9"/><circle cx="32" cy="38" r="3.5" fill="#FFF8E1"/></svg>`,
    // Backward compatibility aliases
    watchtower: `<svg viewBox="0 0 64 64"><polygon points="20,56 44,56 40,24 24,24" fill="#242C54" stroke="#0F1328" stroke-width="1.5"/><polygon points="16,25 48,25 32,8" fill="#C74B4B" stroke="#0F1328" stroke-width="1.8"/><circle cx="32" cy="18" r="3.5" fill="#FFAE42"/></svg>`,
    belltower: `<svg viewBox="0 0 64 64"><polygon points="12,56 52,56 46,26 18,26" fill="#1F2848" stroke="#0F1328" stroke-width="1.5"/><polygon points="10,26 54,26 32,10" fill="#2D3B6B" stroke="#0F1328" stroke-width="1.8"/><circle cx="32" cy="20" r="4" fill="#EDE3CF"/></svg>`,
    workshop: `<svg viewBox="0 0 64 64"><rect x="12" y="26" width="40" height="30" fill="#2A2438" stroke="#0F1328" stroke-width="1.5"/><polygon points="8,26 56,26 32,10" fill="#784D35" stroke="#0F1328" stroke-width="1.8"/></svg>`,
    pavilion: `<svg viewBox="0 0 64 64"><polygon points="6,26 58,26 32,8" fill="#D9822B" stroke="#0F1328" stroke-width="1.8"/><line x1="16" y1="26" x2="16" y2="56" stroke="#0F1328" stroke-width="3"/><line x1="48" y1="26" x2="48" y2="56" stroke="#0F1328" stroke-width="3"/></svg>`,
    fox_shrine: `<svg viewBox="0 0 64 64"><line x1="8" y1="16" x2="56" y2="16" stroke="#C74B4B" stroke-width="5" stroke-linecap="round"/><line x1="18" y1="16" x2="18" y2="58" stroke="#0F1328" stroke-width="3.5"/><line x1="46" y1="16" x2="46" y2="58" stroke="#0F1328" stroke-width="3.5"/></svg>`,
    bakery: `<svg viewBox="0 0 64 64"><rect x="12" y="24" width="40" height="32" rx="2" fill="#263156" stroke="#0F1328" stroke-width="1.5"/><polygon points="8,24 56,24 32,8" fill="#C47D3B" stroke="#0F1328" stroke-width="1.8"/></svg>`,
    teahouse: `<svg viewBox="0 0 64 64"><rect x="10" y="24" width="44" height="32" rx="2" fill="#222C4E" stroke="#0F1328" stroke-width="1.5"/><polygon points="6,24 58,24 32,8" fill="#40916C" stroke="#0F1328" stroke-width="1.8"/></svg>`,
    armory: `<svg viewBox="0 0 64 64"><polygon points="12,56 52,56 46,26 18,26" fill="#252D56" stroke="#0F1328" stroke-width="1.5"/><polygon points="8,26 56,26 32,8" fill="#5E35B1" stroke="#0F1328" stroke-width="1.8"/></svg>`,
    spring: `<svg viewBox="0 0 64 64"><ellipse cx="32" cy="44" rx="22" ry="10" fill="#1B4D45" stroke="#0F1328" stroke-width="1.8"/><ellipse cx="32" cy="44" rx="16" ry="6" fill="#3BA99C"/></svg>`,
    lantern_altar: `<svg viewBox="0 0 64 64"><polygon points="20,58 44,58 40,16 24,16" fill="#2D3860" stroke="#0F1328" stroke-width="1.8"/><circle cx="32" cy="10" r="5" fill="#FFAE42"/></svg>`
  },

  // ================= CARD ARTWORKS (MATCHING HANDCRAFTED UNIT & SPELL VIGNETTES) =================
  cardArt: {
    // Summon Cards (Directly embedding matching handcrafted guardian units)
    card_summon_cat: `<svg viewBox="0 0 64 64" class="card-vignette"><rect width="64" height="64" rx="6" fill="#141E38"/><circle cx="32" cy="32" r="22" fill="#212F58" opacity="0.6"/><ellipse cx="32" cy="54" rx="16" ry="4" fill="#0A0D1E" opacity="0.6"/><ellipse cx="32" cy="24" rx="14" ry="11.5" fill="#C47320" stroke="#101326" stroke-width="1.4"/><polygon points="19,17 22,7 27,15" fill="#C47320" stroke="#101326" stroke-width="1.3"/><polygon points="45,17 42,7 37,15" fill="#C47320" stroke="#101326" stroke-width="1.3"/><ellipse cx="26.5" cy="23.5" rx="2.5" ry="3.5" fill="#FFAE42" stroke="#101326" stroke-width="0.8"/><ellipse cx="37.5" cy="23.5" rx="2.5" ry="3.5" fill="#FFAE42" stroke="#101326" stroke-width="0.8"/><path d="M20 38 Q16 52 32 52 Q48 52 44 38 Z" fill="#1A1E38" stroke="#101326" stroke-width="1.4"/><circle cx="32" cy="44" r="3" fill="#FFAE42"/></svg>`,
    card_summon_cat_plus: `<svg viewBox="0 0 64 64" class="card-vignette"><rect width="64" height="64" rx="6" fill="#1E2A4A"/><circle cx="32" cy="32" r="24" fill="#FFAE42" opacity="0.15"/><circle cx="32" cy="32" r="22" fill="none" stroke="#FFAE42" stroke-width="1" stroke-dasharray="3,3"/><ellipse cx="32" cy="24" rx="14" ry="11.5" fill="#E89234" stroke="#101326" stroke-width="1.4"/><polygon points="19,17 22,7 27,15" fill="#E89234" stroke="#101326" stroke-width="1.3"/><polygon points="45,17 42,7 37,15" fill="#E89234" stroke="#101326" stroke-width="1.3"/><ellipse cx="26.5" cy="23.5" rx="2.5" ry="3.5" fill="#FFE599"/><ellipse cx="37.5" cy="23.5" rx="2.5" ry="3.5" fill="#FFE599"/><path d="M20 38 Q16 52 32 52 Q48 52 44 38 Z" fill="#242B4E" stroke="#FFAE42" stroke-width="1.4"/><circle cx="32" cy="44" r="3.5" fill="#FFAE42"/></svg>`,
    card_summon_tea: `<svg viewBox="0 0 64 64" class="card-vignette"><rect width="64" height="64" rx="6" fill="#162920"/><ellipse cx="32" cy="42" rx="18" ry="12" fill="#52B788" stroke="#0E1A14" stroke-width="1.4"/><ellipse cx="32" cy="26" rx="12" ry="10" fill="#EDE3CF" stroke="#0E1A14" stroke-width="1.4"/><path d="M26 12 Q32 4 38 10" fill="none" stroke="#70C1B3" stroke-width="2.5" stroke-linecap="round"/><circle cx="28" cy="25" r="2" fill="#162920"/><circle cx="36" cy="25" r="2" fill="#162920"/><path d="M30 30 Q32 32 34 30" fill="none" stroke="#162920" stroke-width="1.5"/></svg>`,
    card_summon_scarecrow: `<svg viewBox="0 0 64 64" class="card-vignette"><rect width="64" height="64" rx="6" fill="#182038"/><polygon points="32,8 10,28 54,28" fill="#2F3B66" stroke="#0E1224" stroke-width="1.6"/><circle cx="32" cy="24" r="3.5" fill="#FFAE42"/><line x1="8" y1="36" x2="56" y2="36" stroke="#8C6E4A" stroke-width="3" stroke-linecap="round"/><rect x="22" y="32" width="20" height="24" fill="#D9822B" stroke="#0E1224" stroke-width="1.4"/><line x1="32" y1="28" x2="32" y2="58" stroke="#8C6E4A" stroke-width="3"/></svg>`,
    card_summon_tanuki: `<svg viewBox="0 0 64 64" class="card-vignette"><rect width="64" height="64" rx="6" fill="#261E1A"/><ellipse cx="32" cy="40" rx="16" ry="14" fill="#8C6E4A" stroke="#120D0A" stroke-width="1.5"/><ellipse cx="32" cy="24" rx="13" ry="10" fill="#B08D65" stroke="#120D0A" stroke-width="1.4"/><ellipse cx="26" cy="24" rx="4" ry="3" fill="#2C2018"/><ellipse cx="38" cy="24" rx="4" ry="3" fill="#2C2018"/><circle cx="26" cy="24" r="1.5" fill="#FFAE42"/><circle cx="38" cy="24" r="1.5" fill="#FFAE42"/><path d="M32 14 C27 7 32 2 32 2 C32 2 37 7 32 14 Z" fill="#52B788" stroke="#120D0A" stroke-width="1"/></svg>`,
    card_summon_frog: `<svg viewBox="0 0 64 64" class="card-vignette"><rect width="64" height="64" rx="6" fill="#14261C"/><ellipse cx="32" cy="42" rx="18" ry="14" fill="#3D704D" stroke="#0C1711" stroke-width="1.5"/><ellipse cx="32" cy="24" rx="14" ry="10" fill="#529267" stroke="#0C1711" stroke-width="1.4"/><circle cx="24" cy="18" r="4.5" fill="#FFAE42" stroke="#0C1711" stroke-width="1.2"/><circle cx="40" cy="18" r="4.5" fill="#FFAE42" stroke="#0C1711" stroke-width="1.2"/><ellipse cx="32" cy="42" rx="8" ry="10" fill="#9E5D2A" stroke="#0C1711" stroke-width="1.2"/></svg>`,
    card_summon_crane: `<svg viewBox="0 0 64 64" class="card-vignette"><rect width="64" height="64" rx="6" fill="#162238"/><ellipse cx="32" cy="40" rx="16" ry="12" fill="#EDE3CF" stroke="#0E1524" stroke-width="1.5"/><path d="M32 30 Q36 14 34 8" fill="none" stroke="#EDE3CF" stroke-width="4" stroke-linecap="round"/><circle cx="34" cy="8" r="3.5" fill="#C74B4B"/><line x1="34" y1="8" x2="44" y2="12" stroke="#FFAE42" stroke-width="2" stroke-linecap="round"/><path d="M18 36 Q8 26 14 20" fill="none" stroke="#EDE3CF" stroke-width="3"/></svg>`,
    card_summon_dragon: `<svg viewBox="0 0 64 64" class="card-vignette"><rect width="64" height="64" rx="6" fill="#2E1618"/><path d="M14 46 Q32 20 50 44" fill="none" stroke="#C74B4B" stroke-width="7" stroke-linecap="round"/><circle cx="32" cy="22" r="7" fill="#FFAE42" stroke="#120A0B" stroke-width="1.5"/><path d="M26 14 L30 20 M38 14 L34 20" stroke="#FFAE42" stroke-width="2.5" stroke-linecap="round"/><circle cx="30" cy="22" r="1.8" fill="#120A0B"/><circle cx="34" cy="22" r="1.8" fill="#120A0B"/></svg>`,
    card_summon_crafter: `<svg viewBox="0 0 64 64" class="card-vignette"><rect width="64" height="64" rx="6" fill="#1C223A"/><rect x="22" y="24" width="20" height="24" rx="3" fill="#FFAE42" stroke="#0E1220" stroke-width="1.5"/><polygon points="18,24 46,24 32,12" fill="#C74B4B" stroke="#0E1220" stroke-width="1.5"/><circle cx="32" cy="36" r="4" fill="#FFF3D6"/><line x1="32" y1="6" x2="32" y2="12" stroke="#FFAE42" stroke-width="2"/></svg>`,
    card_summon_lantern_crafter: `<svg viewBox="0 0 64 64" class="card-vignette"><rect width="64" height="64" rx="6" fill="#1C223A"/><rect x="22" y="24" width="20" height="24" rx="3" fill="#FFAE42" stroke="#0E1220" stroke-width="1.5"/><polygon points="18,24 46,24 32,12" fill="#C74B4B" stroke="#0E1220" stroke-width="1.5"/><circle cx="32" cy="36" r="4" fill="#FFF3D6"/><line x1="32" y1="6" x2="32" y2="12" stroke="#FFAE42" stroke-width="2"/></svg>`,
    card_summon_fox: `<svg viewBox="0 0 64 64" class="card-vignette"><rect width="64" height="64" rx="6" fill="#281618"/><ellipse cx="32" cy="26" rx="14" ry="11" fill="#D96E34" stroke="#120A0B" stroke-width="1.4"/><polygon points="19,18 22,8 27,16" fill="#D96E34" stroke="#120A0B" stroke-width="1.2"/><polygon points="45,18 42,8 37,16" fill="#D96E34" stroke="#120A0B" stroke-width="1.2"/><ellipse cx="27" cy="26" rx="2" ry="3" fill="#FFAE42"/><ellipse cx="37" cy="26" rx="2" ry="3" fill="#FFAE42"/><rect x="24" y="36" width="16" height="20" fill="#EDE3CF" stroke="#120A0B" stroke-width="1.4"/></svg>`,
    card_summon_bear: `<svg viewBox="0 0 64 64" class="card-vignette"><rect width="64" height="64" rx="6" fill="#261E16"/><ellipse cx="32" cy="30" rx="16" ry="13" fill="#755243" stroke="#100C09" stroke-width="1.5"/><circle cx="18" cy="20" r="4" fill="#755243" stroke="#100C09" stroke-width="1.2"/><circle cx="46" cy="20" r="4" fill="#755243" stroke="#100C09" stroke-width="1.2"/><ellipse cx="32" cy="34" rx="7" ry="5" fill="#D4B28C"/><rect x="18" y="42" width="28" height="14" rx="3" fill="#C49A6C" stroke="#100C09" stroke-width="1.2"/><ellipse cx="32" cy="48" rx="5" ry="3" fill="#FFF3D6"/></svg>`,

    // Command Cards (Dynamic tactical actions with atmospheric brushwork)
    card_command_advance: `<svg viewBox="0 0 64 64" class="card-vignette"><defs><linearGradient id="cmdAdvGrad" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stop-color="#0E1A34"/><stop offset="100%" stop-color="#1A2D5A"/></linearGradient></defs><rect width="64" height="64" rx="6" fill="url(#cmdAdvGrad)"/><path d="M10 52 Q26 44 48 20" stroke="#8FA3C7" stroke-width="2" stroke-linecap="round" opacity="0.6"/><path d="M16 56 Q34 46 56 22" stroke="#FFAE42" stroke-width="3" stroke-linecap="round"/><polygon points="58,16 46,22 52,32" fill="#FFAE42" stroke="#101326" stroke-width="1.2"/><path d="M22 42 Q30 28 42 22 Q38 32 30 38 Z" fill="#EDE3CF" opacity="0.85"/><circle cx="50" cy="24" r="2" fill="#FFF3D6"/></svg>`,
    card_command_reposition: `<svg viewBox="0 0 64 64" class="card-vignette"><rect width="64" height="64" rx="6" fill="#11223B"/><circle cx="32" cy="32" r="20" fill="none" stroke="#253D66" stroke-width="2"/><path d="M20 24 Q32 12 44 24" fill="none" stroke="#FFAE42" stroke-width="3" stroke-linecap="round"/><polygon points="44,18 50,25 42,28" fill="#FFAE42"/><path d="M44 40 Q32 52 20 40" fill="none" stroke="#3BA99C" stroke-width="3" stroke-linecap="round"/><polygon points="20,46 14,39 22,36" fill="#3BA99C"/><circle cx="32" cy="32" r="4" fill="#FFF3D6"/></svg>`,
    card_command_rally: `<svg viewBox="0 0 64 64" class="card-vignette"><rect width="64" height="64" rx="6" fill="#13233D"/><path d="M14 54 L14 10" stroke="#EDE3CF" stroke-width="3" stroke-linecap="round"/><polygon points="14,12 48,22 14,34" fill="#D94848" stroke="#101326" stroke-width="1.5"/><circle cx="28" cy="23" r="4" fill="#FFAE42"/><path d="M44 14 Q54 22 44 30 M50 8 Q62 22 50 36" fill="none" stroke="#FFAE42" stroke-width="2.5" stroke-linecap="round" opacity="0.8"/></svg>`,
    card_command_strike_again: `<svg viewBox="0 0 64 64" class="card-vignette"><rect width="64" height="64" rx="6" fill="#12243D"/><line x1="12" y1="52" x2="52" y2="12" stroke="#EDE3CF" stroke-width="3.5" stroke-linecap="round"/><polygon points="52,12 42,12 52,22" fill="#FFAE42"/><line x1="52" y1="52" x2="12" y2="12" stroke="#FFAE42" stroke-width="3.5" stroke-linecap="round"/><polygon points="12,12 22,12 12,22" fill="#EDE3CF"/><circle cx="32" cy="32" r="7" fill="#FFFDE7"/><circle cx="32" cy="32" r="14" fill="none" stroke="#FFAE42" stroke-width="1.5" stroke-dasharray="3,3"/></svg>`,
    card_command_tactical_swap: `<svg viewBox="0 0 64 64" class="card-vignette"><rect width="64" height="64" rx="6" fill="#102038"/><circle cx="32" cy="32" r="22" fill="none" stroke="#FFAE42" stroke-width="1.8" stroke-dasharray="4,3"/><circle cx="32" cy="32" r="14" fill="#182E4E" stroke="#3BA99C" stroke-width="1.5"/><path d="M22 28 Q32 14 42 28" fill="none" stroke="#FFAE42" stroke-width="3" stroke-linecap="round"/><polygon points="42,22 48,28 42,34" fill="#FFAE42"/><path d="M42 36 Q32 50 22 36" fill="none" stroke="#3BA99C" stroke-width="3" stroke-linecap="round"/><polygon points="22,42 16,36 22,30" fill="#3BA99C"/><circle cx="32" cy="32" r="3.5" fill="#FFF3D6"/></svg>`,

    // Spell Cards (Mystic elemental forces & Taoist talismans)
    card_spell_gust: `<svg viewBox="0 0 64 64" class="card-vignette"><rect width="64" height="64" rx="6" fill="#1A1838"/><path d="M8 38 Q24 16 48 20 Q58 24 50 40 Q40 48 24 40" fill="none" stroke="#70C1B3" stroke-width="4" stroke-linecap="round"/><path d="M16 28 Q32 10 52 16" fill="none" stroke="#8FA3C7" stroke-width="2.5" stroke-linecap="round"/><circle cx="48" cy="34" r="2.5" fill="#FFAE42"/><circle cx="28" cy="24" r="2" fill="#FFAE42"/><path d="M20 44 Q28 48 34 42" stroke="#52B788" stroke-width="2" fill="none"/></svg>`,
    card_spell_fireball: `<svg viewBox="0 0 64 64" class="card-vignette"><rect width="64" height="64" rx="6" fill="#2E1216"/><circle cx="32" cy="32" r="18" fill="#B71C1C"/><circle cx="32" cy="32" r="13" fill="#E65100"/><circle cx="32" cy="32" r="8" fill="#FFAE42"/><circle cx="32" cy="32" r="4" fill="#FFFDE7"/><path d="M18 32 Q32 10 46 32 Q32 54 18 32 Z" fill="none" stroke="#FF8A65" stroke-width="2"/><circle cx="46" cy="18" r="2" fill="#FFAE42"/><circle cx="16" cy="42" r="1.5" fill="#FFAE42"/></svg>`,
    card_spell_barrier: `<svg viewBox="0 0 64 64" class="card-vignette"><rect width="64" height="64" rx="6" fill="#201838"/><polygon points="32,6 56,16 52,48 32,58 12,48 8,16" fill="#2D214E" stroke="#FFAE42" stroke-width="2.5"/><circle cx="32" cy="32" r="10" fill="#3BA99C" opacity="0.85"/><circle cx="32" cy="32" r="4" fill="#FFFDE7"/><line x1="24" y1="20" x2="40" y2="44" stroke="#FFAE42" stroke-width="1.5"/><line x1="40" y1="20" x2="24" y2="44" stroke="#FFAE42" stroke-width="1.5"/></svg>`,
    card_spell_whirlwind: `<svg viewBox="0 0 64 64" class="card-vignette"><rect width="64" height="64" rx="6" fill="#1C1B3A"/><path d="M10 18 Q32 6 54 16 Q48 32 32 32 Q16 32 24 46 Q34 54 50 48" fill="none" stroke="#8FA3C7" stroke-width="3.5" stroke-linecap="round"/><path d="M16 24 Q32 14 46 22" fill="none" stroke="#70C1B3" stroke-width="2" stroke-linecap="round"/><circle cx="32" cy="32" r="3.5" fill="#FFAE42"/></svg>`,
    card_spell_freeze_mist: `<svg viewBox="0 0 64 64" class="card-vignette"><rect width="64" height="64" rx="6" fill="#10253D"/><line x1="32" y1="8" x2="32" y2="56" stroke="#70C1B3" stroke-width="3" stroke-linecap="round"/><line x1="8" y1="32" x2="56" y2="32" stroke="#70C1B3" stroke-width="3" stroke-linecap="round"/><line x1="15" y1="15" x2="49" y2="49" stroke="#8FA3C7" stroke-width="2.2" stroke-linecap="round"/><line x1="49" y1="15" x2="15" y2="49" stroke="#8FA3C7" stroke-width="2.2" stroke-linecap="round"/><circle cx="32" cy="32" r="8" fill="#E0F7FA" opacity="0.9"/><circle cx="32" cy="32" r="4" fill="#3BA99C"/></svg>`,
    card_spell_bamboo_trap: `<svg viewBox="0 0 64 64" class="card-vignette"><rect width="64" height="64" rx="6" fill="#14281A"/><polygon points="14,54 22,20 28,54" fill="#52B788" stroke="#0E1A12" stroke-width="1.5"/><polygon points="26,54 34,12 40,54" fill="#387A58" stroke="#0E1A12" stroke-width="1.5"/><polygon points="38,54 46,24 52,54" fill="#52B788" stroke="#0E1A12" stroke-width="1.5"/><line x1="8" y1="48" x2="56" y2="48" stroke="#C49A6C" stroke-width="2.5"/><circle cx="34" cy="38" r="3.5" fill="#FFAE42"/></svg>`,
    card_spell_spirit_rain: `<svg viewBox="0 0 64 64" class="card-vignette"><rect width="64" height="64" rx="6" fill="#142238"/><line x1="18" y1="10" x2="14" y2="50" stroke="#70C1B3" stroke-width="2.5" stroke-linecap="round"/><line x1="34" y1="6" x2="30" y2="54" stroke="#FFAE42" stroke-width="3" stroke-linecap="round"/><line x1="48" y1="12" x2="44" y2="48" stroke="#70C1B3" stroke-width="2.5" stroke-linecap="round"/><ellipse cx="30" cy="54" rx="14" ry="4" fill="#3BA99C" opacity="0.6"/><ellipse cx="14" cy="50" rx="8" ry="3" fill="#70C1B3" opacity="0.6"/></svg>`,
    card_spell_thunder_strike: `<svg viewBox="0 0 64 64" class="card-vignette"><rect width="64" height="64" rx="6" fill="#201638"/><path d="M10 18 Q32 8 54 18 L50 26 L14 26 Z" fill="#332454" opacity="0.8"/><polygon points="38,4 18,32 32,32 24,60 52,26 38,26" fill="#FFAE42" stroke="#FFFDE7" stroke-width="1.8"/><circle cx="32" cy="32" r="16" fill="none" stroke="#FFAE42" stroke-width="1" stroke-dasharray="2,3"/></svg>`,

    // Lantern Cards (Solar and fire talismans)
    card_lantern_refuel: `<svg viewBox="0 0 64 64" class="card-vignette"><rect width="64" height="64" rx="6" fill="#361C0E"/><rect x="22" y="22" width="20" height="26" rx="4" fill="#FFAE42" stroke="#120A05" stroke-width="1.8"/><circle cx="32" cy="35" r="7" fill="#FFF3D6"/><path d="M32 6 L32 22" stroke="#FFAE42" stroke-width="3" stroke-linecap="round"/><path d="M18 14 Q32 4 46 14" fill="none" stroke="#D9822B" stroke-width="2"/></svg>`,
    card_lantern_flare: `<svg viewBox="0 0 64 64" class="card-vignette"><rect width="64" height="64" rx="6" fill="#361C0E"/><circle cx="32" cy="32" r="15" fill="#FFAE42"/><path d="M32 4 L32 60 M4 32 L60 32 M12 12 L52 52 M12 52 L52 12" stroke="#FFF3D6" stroke-width="2.5"/><circle cx="32" cy="32" r="7" fill="#FFFDE7"/></svg>`,
    card_lantern_guardian_halo: `<svg viewBox="0 0 64 64" class="card-vignette"><rect width="64" height="64" rx="6" fill="#361C0E"/><circle cx="32" cy="32" r="20" fill="none" stroke="#FFAE42" stroke-width="3.5"/><circle cx="32" cy="32" r="12" fill="#FFF3D6" opacity="0.85"/><circle cx="32" cy="32" r="6" fill="#FFAE42"/></svg>`,
    card_lantern_ignite: `<svg viewBox="0 0 64 64" class="card-vignette"><rect width="64" height="64" rx="6" fill="#361C0E"/><polygon points="16,52 32,8 48,52" fill="#FFAE42" stroke="#120A05" stroke-width="1.5"/><polygon points="24,52 32,24 40,52" fill="#FFF3D6"/><circle cx="32" cy="18" r="3" fill="#FFFDE7"/></svg>`,
    card_lantern_oil_flask: `<svg viewBox="0 0 64 64" class="card-vignette"><rect width="64" height="64" rx="6" fill="#361C0E"/><circle cx="32" cy="40" r="14" fill="#D9822B" stroke="#120A05" stroke-width="1.8"/><rect x="27" y="16" width="10" height="12" rx="2" fill="#C49A6C" stroke="#120A05" stroke-width="1.5"/><circle cx="32" cy="40" r="6" fill="#FFAE42"/><circle cx="32" cy="40" r="2.5" fill="#FFF3D6"/></svg>`,
    card_lantern_oil_flask_plus: `<svg viewBox="0 0 64 64" class="card-vignette"><rect width="64" height="64" rx="6" fill="#442210"/><circle cx="32" cy="40" r="15" fill="#FFAE42" stroke="#120A05" stroke-width="1.8"/><rect x="27" y="16" width="10" height="12" rx="2" fill="#FFE082" stroke="#120A05" stroke-width="1.5"/><circle cx="32" cy="40" r="7" fill="#FFF9C4"/><circle cx="32" cy="40" r="3" fill="#FFFFFF"/></svg>`
  },

  // ================= TITLE BACKDROP & SKYLINE =================
  titleBackdrop: `
    <svg viewBox="0 0 390 240" class="svg-title-backdrop" preserveAspectRatio="none">
      <defs>
        <linearGradient id="titleSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#050814"/>
          <stop offset="60%" stop-color="#0B1028"/>
          <stop offset="100%" stop-color="#141938"/>
        </linearGradient>
      </defs>
      <rect width="390" height="240" fill="url(#titleSky)"/>
      <!-- Stars -->
      <circle cx="30" cy="24" r="1" fill="#EDE3CF" opacity="0.8"/>
      <circle cx="85" cy="18" r="1.3" fill="#FFAE42" opacity="0.9"/>
      <circle cx="150" cy="30" r="0.9" fill="#EDE3CF" opacity="0.7"/>
      <circle cx="240" cy="22" r="1.2" fill="#FFAE42" opacity="0.85"/>
      <circle cx="330" cy="28" r="1" fill="#EDE3CF" opacity="0.8"/>
      <circle cx="365" cy="15" r="1.2" fill="#FFAE42" opacity="0.9"/>
      <!-- Distant Hills & Pagoda Eaves Silhouette -->
      <path d="M0 160 L40 145 L80 162 L130 140 L180 165 L220 142 L270 164 L320 146 L360 160 L390 152 L390 240 L0 240 Z" fill="#080C1E"/>
      <!-- Midground Pagoda Roofs -->
      <path d="M20 180 L45 168 L50 168 L55 160 L60 168 L65 168 L90 180 Z" fill="#0F142D"/>
      <path d="M190 184 L215 170 L220 170 L225 162 L230 170 L235 170 L260 184 Z" fill="#0F142D"/>
      <path d="M300 180 L325 166 L330 166 L335 158 L340 166 L345 166 L370 180 Z" fill="#0F142D"/>
      <!-- Warm Golden Windows -->
      <rect x="52" y="174" width="6" height="6" rx="1" fill="#FFAE42" opacity="0.8"/>
      <rect x="222" y="176" width="6" height="6" rx="1" fill="#FFAE42" opacity="0.85"/>
      <rect x="332" y="172" width="6" height="6" rx="1" fill="#FFAE42" opacity="0.8"/>
      <!-- Street Lantern Posts along the Bridge -->
      <line x1="110" y1="185" x2="110" y2="215" stroke="#FFAE42" stroke-width="1.8"/>
      <circle cx="110" cy="185" r="4" fill="#FFAE42"/>
      <circle cx="110" cy="185" r="8" fill="#FFAE42" opacity="0.25"/>
      <line x1="280" y1="185" x2="280" y2="215" stroke="#FFAE42" stroke-width="1.8"/>
      <circle cx="280" cy="185" r="4" fill="#FFAE42"/>
      <circle cx="280" cy="185" r="8" fill="#FFAE42" opacity="0.25"/>
      <!-- Gentle River Mist Overlay -->
      <rect y="195" width="390" height="45" fill="url(#titleSky)" opacity="0.7"/>
    </svg>
  `,

  // ================= SKYLINE & ATMOSPHERE BACKDROP =================
  skyline: `
    <svg viewBox="0 0 374 90" class="svg-skyline-backdrop" preserveAspectRatio="none">
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#070A18" />
          <stop offset="60%" stop-color="#0E1430" />
          <stop offset="100%" stop-color="#141938" />
        </linearGradient>
      </defs>
      <rect width="374" height="90" fill="url(#skyGrad)"/>
      <!-- Distant Stars -->
      <circle cx="28" cy="18" r="1" fill="#EDE3CF" opacity="0.8"/>
      <circle cx="75" cy="10" r="1.2" fill="#FFAE42" opacity="0.9"/>
      <circle cx="140" cy="14" r="0.8" fill="#EDE3CF" opacity="0.7"/>
      <circle cx="220" cy="12" r="1.2" fill="#EDE3CF" opacity="0.9"/>
      <circle cx="310" cy="16" r="1" fill="#FFAE42" opacity="0.8"/>
      <circle cx="350" cy="22" r="0.8" fill="#EDE3CF" opacity="0.6"/>
      <!-- Crescent Moon -->
      <path d="M336 8 A 8 8 0 0 0 346 22 A 10 10 0 1 1 336 8 Z" fill="#FFF3D6" opacity="0.85"/>
      <!-- Distant Eaves Silhouette Layer 1 (Mountains & Pagodas) -->
      <path d="M0 64 L24 54 L44 64 L70 50 L96 66 L120 54 L150 68 L190 48 L224 64 L260 52 L300 68 L340 54 L374 62 L374 90 L0 90 Z" fill="#0A0E22" opacity="0.8"/>
      <!-- Detailed Pagoda Eaves Silhouette Layer 2 -->
      <path d="M40 70 L54 62 L60 62 L64 56 L68 62 L74 62 L88 70 Z" fill="#101530"/>
      <path d="M170 66 L186 56 L192 56 L196 48 L200 56 L206 56 L222 66 Z" fill="#101530"/>
      <path d="M280 72 L294 64 L300 64 L304 58 L308 64 L314 64 L328 72 Z" fill="#101530"/>
      <!-- Warm Window Lights in Distant Town -->
      <rect x="62" y="66" width="4" height="4" fill="#FFAE42" opacity="0.7"/>
      <rect x="194" y="60" width="4" height="5" fill="#FFAE42" opacity="0.8"/>
      <rect x="302" y="68" width="4" height="4" fill="#FFAE42" opacity="0.7"/>
      <!-- Soft Low Fog Gradient -->
      <rect y="74" width="374" height="16" fill="url(#skyGrad)" opacity="0.6"/>
    </svg>
  `,

  // ================= UI ICONS (精緻墨線圖標) =================
  icons: {
    home: `<svg viewBox="0 0 24 24" class="svg-icon" style="width:20px;height:20px;"><path d="M3 11 L12 3 L21 11 L21 21 L15 21 L15 14 L9 14 L9 21 L3 21 Z" fill="#242B4D" stroke="#EDE3CF" stroke-width="1.8" stroke-linejoin="round"/></svg>`,
    coin: `<svg viewBox="0 0 24 24" class="svg-icon" style="width:18px;height:18px;"><circle cx="12" cy="12" r="9" fill="#FFAE42" stroke="#101326" stroke-width="1.5"/><rect x="9.5" y="9.5" width="5" height="5" fill="#141938" stroke="#FFAE42" stroke-width="1"/></svg>`,
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
    frozen: `<svg viewBox="0 0 16 16" style="width:14px;height:14px;vertical-align:middle;"><line x1="8" y1="2" x2="8" y2="14" stroke="#70C1B3" stroke-width="2"/><line x1="2" y1="8" x2="14" y2="8" stroke="#70C1B3" stroke-width="2"/><line x1="3" y1="3" x2="13" y2="13" stroke="#70C1B3" stroke-width="1.5"/><line x1="13" y1="3" x2="3" y2="13" stroke="#70C1B3" stroke-width="1.5"/></svg>`,
    check: `<svg viewBox="0 0 16 16" style="width:14px;height:14px;vertical-align:middle;"><path d="M3 8 L6 11 L13 4" fill="none" stroke="#52B788" stroke-width="2" stroke-linecap="round"/></svg>`
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
