/**
 * js/render/art.js
 * Handcrafted procedural SVG artwork for all Guardians, Enemies, Lanterns, Terrains, and Town Buildings.
 * Warm picture-book style: cream paper, chunky ink strokes, lantern amber, soft indigo, muted sage.
 */

export const SVG_ART = {
  // ================= GUARDIANS (守護者) =================
  cat_patrol: `
    <svg viewBox="0 0 64 64" class="svg-unit cat-patrol">
      <!-- Shadow -->
      <ellipse cx="32" cy="56" rx="20" ry="5" fill="#D8CEBA" />
      <!-- Tail -->
      <path d="M16 48 C10 44 8 36 12 32 C14 30 18 34 16 40" fill="none" stroke="#2C2621" stroke-width="3" stroke-linecap="round" />
      <!-- Body -->
      <path d="M22 36 Q18 52 32 52 Q46 52 42 36 Q40 26 32 26 Q24 26 22 36 Z" fill="#E69A35" stroke="#2C2621" stroke-width="2.5" />
      <!-- Scarf -->
      <path d="M20 34 Q32 39 44 34 L42 38 Q32 43 22 38 Z" fill="#C74B4B" stroke="#2C2621" stroke-width="2" />
      <path d="M38 37 L44 46 L40 47 L36 39 Z" fill="#C74B4B" stroke="#2C2621" stroke-width="1.5" />
      <!-- Head -->
      <ellipse cx="32" cy="22" rx="15" ry="12" fill="#E69A35" stroke="#2C2621" stroke-width="2.5" />
      <!-- Ears -->
      <polygon points="18,16 22,5 28,14" fill="#C74B4B" stroke="#2C2621" stroke-width="2" stroke-linejoin="round" />
      <polygon points="46,16 42,5 36,14" fill="#C74B4B" stroke="#2C2621" stroke-width="2" stroke-linejoin="round" />
      <!-- Muzzle -->
      <ellipse cx="32" cy="26" rx="6" ry="4" fill="#FAF6EE" />
      <!-- Nose & Whiskers -->
      <polygon points="31,24 33,24 32,25.5" fill="#2C2621" />
      <line x1="22" y1="25" x2="16" y2="24" stroke="#2C2621" stroke-width="1.5" stroke-linecap="round" />
      <line x1="22" y1="27" x2="16" y2="28" stroke="#2C2621" stroke-width="1.5" stroke-linecap="round" />
      <line x1="42" y1="25" x2="48" y2="24" stroke="#2C2621" stroke-width="1.5" stroke-linecap="round" />
      <line x1="42" y1="27" x2="48" y2="28" stroke="#2C2621" stroke-width="1.5" stroke-linecap="round" />
      <!-- Eyes -->
      <circle cx="27" cy="20" r="2.5" fill="#2C2621" />
      <circle cx="37" cy="20" r="2.5" fill="#2C2621" />
      <circle cx="28" cy="19" r="0.8" fill="#FFFFFF" />
      <circle cx="38" cy="19" r="0.8" fill="#FFFFFF" />
      <!-- Lantern Badge -->
      <circle cx="32" cy="42" r="3.5" fill="#FFB84D" stroke="#2C2621" stroke-width="1.5" />
    </svg>
  `,

  tea_master: `
    <svg viewBox="0 0 64 64" class="svg-unit tea-master">
      <ellipse cx="32" cy="56" rx="20" ry="5" fill="#D8CEBA" />
      <!-- Body (Teapot Robe) -->
      <path d="M20 32 Q16 52 32 52 Q48 52 44 32 Q40 24 32 24 Q24 24 20 32 Z" fill="#6E8B75" stroke="#2C2621" stroke-width="2.5" />
      <!-- Sash -->
      <rect x="22" y="38" width="20" height="4" fill="#D9822B" stroke="#2C2621" stroke-width="1.5" rx="1" />
      <!-- Round Badger Head -->
      <ellipse cx="32" cy="20" rx="14" ry="12" fill="#EAE2CF" stroke="#2C2621" stroke-width="2.5" />
      <!-- Ears -->
      <circle cx="20" cy="12" r="4.5" fill="#4F6D56" stroke="#2C2621" stroke-width="2" />
      <circle cx="44" cy="12" r="4.5" fill="#4F6D56" stroke="#2C2621" stroke-width="2" />
      <!-- Glasses -->
      <circle cx="27" cy="20" r="3.5" fill="none" stroke="#2C2621" stroke-width="1.5" />
      <circle cx="37" cy="20" r="3.5" fill="none" stroke="#2C2621" stroke-width="1.5" />
      <line x1="30.5" y1="20" x2="33.5" y2="20" stroke="#2C2621" stroke-width="1.5" />
      <!-- Teacup in Hand -->
      <path d="M42 38 Q48 38 46 44 Q42 46 40 44 Z" fill="#FAF6EE" stroke="#2C2621" stroke-width="1.5" />
      <path d="M43 36 Q45 33 44 30" fill="none" stroke="#FAF6EE" stroke-width="1.5" stroke-linecap="round" opacity="0.8" />
    </svg>
  `,

  lantern_crafter: `
    <svg viewBox="0 0 64 64" class="svg-unit lantern-crafter">
      <ellipse cx="32" cy="56" rx="20" ry="5" fill="#D8CEBA" />
      <!-- Body -->
      <path d="M22 34 Q18 52 32 52 Q46 52 42 34 Q38 26 32 26 Q26 26 22 34 Z" fill="#3F4D70" stroke="#2C2621" stroke-width="2.5" />
      <!-- Head -->
      <circle cx="32" cy="20" r="12" fill="#FAF6EE" stroke="#2C2621" stroke-width="2.5" />
      <!-- Headband with Mini Lantern -->
      <path d="M20 18 Q32 14 44 18" stroke="#D9822B" stroke-width="3" fill="none" />
      <!-- Features -->
      <circle cx="28" cy="20" r="2" fill="#2C2621" />
      <circle cx="36" cy="20" r="2" fill="#2C2621" />
      <path d="M30 25 Q32 27 34 25" stroke="#2C2621" stroke-width="1.5" fill="none" />
      <!-- Held Ornate Lantern -->
      <line x1="42" y1="34" x2="48" y2="28" stroke="#2C2621" stroke-width="2" />
      <rect x="44" y="28" width="8" height="12" rx="2" fill="#FFB84D" stroke="#2C2621" stroke-width="1.5" />
      <line x1="44" y1="34" x2="52" y2="34" stroke="#D9822B" stroke-width="1" />
    </svg>
  `,

  scarecrow: `
    <svg viewBox="0 0 64 64" class="svg-unit scarecrow">
      <ellipse cx="32" cy="56" rx="18" ry="4" fill="#D8CEBA" />
      <!-- Post -->
      <line x1="32" y1="20" x2="32" y2="54" stroke="#8C6E4A" stroke-width="4" stroke-linecap="round" />
      <line x1="16" y1="34" x2="48" y2="34" stroke="#8C6E4A" stroke-width="3" stroke-linecap="round" />
      <!-- Tattered Coat -->
      <path d="M20 30 L44 30 L40 48 L24 48 Z" fill="#6E8B75" stroke="#2C2621" stroke-width="2" />
      <!-- Patch -->
      <rect x="26" y="38" width="6" height="6" fill="#D9822B" stroke="#2C2621" stroke-width="1" />
      <!-- Sack Head -->
      <circle cx="32" cy="20" r="10" fill="#EAE2CF" stroke="#2C2621" stroke-width="2" />
      <!-- Button Eyes & Stitched Smile -->
      <circle cx="28" cy="19" r="2" fill="#2C2621" />
      <circle cx="36" cy="19" r="2" fill="#2C2621" />
      <path d="M27 24 Q32 27 37 24" stroke="#2C2621" stroke-width="1.5" fill="none" stroke-linecap="round" />
      <!-- Straw Hat -->
      <polygon points="16,14 48,14 32,4" fill="#D8CEBA" stroke="#2C2621" stroke-width="2" stroke-linejoin="round" />
    </svg>
  `,

  tanuki_mage: `
    <svg viewBox="0 0 64 64" class="svg-unit tanuki-mage">
      <ellipse cx="32" cy="56" rx="20" ry="5" fill="#D8CEBA" />
      <!-- Plump Body -->
      <circle cx="32" cy="40" r="15" fill="#A88B6E" stroke="#2C2621" stroke-width="2.5" />
      <ellipse cx="32" cy="42" rx="9" ry="11" fill="#FAF6EE" />
      <!-- Head -->
      <circle cx="32" cy="22" r="12" fill="#A88B6E" stroke="#2C2621" stroke-width="2.5" />
      <!-- Mask Pattern -->
      <path d="M22 18 Q27 16 30 20 Q28 24 22 24 Z" fill="#3D3025" />
      <path d="M42 18 Q37 16 34 20 Q36 24 42 24 Z" fill="#3D3025" />
      <circle cx="26" cy="20" r="1.5" fill="#FFFFFF" />
      <circle cx="38" cy="20" r="1.5" fill="#FFFFFF" />
      <!-- Leaf on Head -->
      <path d="M32 10 Q38 4 40 8 Q36 12 32 10 Z" fill="#6E8B75" stroke="#2C2621" stroke-width="1.5" />
    </svg>
  `,

  little_dragon: `
    <svg viewBox="0 0 64 64" class="svg-unit little-dragon">
      <ellipse cx="32" cy="56" rx="20" ry="5" fill="#D8CEBA" />
      <!-- Curled Tail -->
      <path d="M20 48 Q10 40 18 32 Q24 38 26 44" fill="#D9822B" stroke="#2C2621" stroke-width="2" />
      <!-- Dragon Body -->
      <ellipse cx="34" cy="40" rx="14" ry="13" fill="#D9822B" stroke="#2C2621" stroke-width="2.5" />
      <ellipse cx="36" cy="41" rx="8" ry="9" fill="#FFB84D" />
      <!-- Dragon Head -->
      <circle cx="34" cy="22" r="13" fill="#D9822B" stroke="#2C2621" stroke-width="2.5" />
      <!-- Horns -->
      <path d="M28 12 Q24 4 20 6 Q24 10 26 14" fill="#FFE2A8" stroke="#2C2621" stroke-width="1.5" />
      <path d="M40 12 Q44 4 48 6 Q44 10 42 14" fill="#FFE2A8" stroke="#2C2621" stroke-width="1.5" />
      <!-- Whiskers -->
      <path d="M26 26 Q18 28 14 24" fill="none" stroke="#FFE2A8" stroke-width="2" stroke-linecap="round" />
      <path d="M42 26 Q50 28 54 24" fill="none" stroke="#FFE2A8" stroke-width="2" stroke-linecap="round" />
      <!-- Eyes & Flame Ember -->
      <circle cx="30" cy="20" r="2.5" fill="#2C2621" />
      <circle cx="38" cy="20" r="2.5" fill="#2C2621" />
      <circle cx="34" cy="27" r="2" fill="#C74B4B" />
    </svg>
  `,

  crane_courier: `
    <svg viewBox="0 0 64 64" class="svg-unit crane-courier">
      <ellipse cx="32" cy="56" rx="18" ry="4" fill="#D8CEBA" />
      <!-- Body -->
      <ellipse cx="32" cy="38" rx="12" ry="14" fill="#FAF6EE" stroke="#2C2621" stroke-width="2.5" />
      <!-- Wings -->
      <path d="M20 34 C12 28 12 44 20 42 Z" fill="#2C2621" />
      <!-- Neck & Head -->
      <path d="M32 30 Q34 18 36 14" fill="none" stroke="#FAF6EE" stroke-width="5" stroke-linecap="round" />
      <circle cx="36" cy="14" r="5" fill="#FAF6EE" stroke="#2C2621" stroke-width="1.5" />
      <circle cx="36" cy="10" r="2" fill="#C74B4B" /> <!-- Red Crown -->
      <polygon points="41,13 49,15 41,17" fill="#E69A35" stroke="#2C2621" stroke-width="1" />
      <!-- Mail Bag -->
      <rect x="26" y="36" width="12" height="9" rx="2" fill="#8C6E4A" stroke="#2C2621" stroke-width="1.5" />
    </svg>
  `,

  frog_bard: `
    <svg viewBox="0 0 64 64" class="svg-unit frog-bard">
      <ellipse cx="32" cy="56" rx="20" ry="5" fill="#D8CEBA" />
      <!-- Round Green Body -->
      <circle cx="32" cy="38" r="15" fill="#6E8B75" stroke="#2C2621" stroke-width="2.5" />
      <ellipse cx="32" cy="42" rx="9" ry="8" fill="#FAF6EE" />
      <!-- Big Frog Eyes -->
      <circle cx="24" cy="24" r="6" fill="#6E8B75" stroke="#2C2621" stroke-width="2" />
      <circle cx="40" cy="24" r="6" fill="#6E8B75" stroke="#2C2621" stroke-width="2" />
      <circle cx="24" cy="24" r="3" fill="#2C2621" />
      <circle cx="40" cy="24" r="3" fill="#2C2621" />
      <!-- Smile -->
      <path d="M24 33 Q32 38 40 33" stroke="#2C2621" stroke-width="2" fill="none" stroke-linecap="round" />
      <!-- Lotus Drum -->
      <ellipse cx="32" cy="48" rx="10" ry="5" fill="#5B8C85" stroke="#2C2621" stroke-width="1.5" />
    </svg>
  `,

  fox_maiden: `
    <svg viewBox="0 0 64 64" class="svg-unit fox-maiden">
      <ellipse cx="32" cy="56" rx="18" ry="4" fill="#D8CEBA" />
      <!-- Red Shrine Robe -->
      <path d="M22 34 L18 52 L46 52 L42 34 Z" fill="#C74B4B" stroke="#2C2621" stroke-width="2.5" />
      <polygon points="32,34 26,44 38,44" fill="#FAF6EE" />
      <!-- White Fox Head -->
      <circle cx="32" cy="22" r="12" fill="#FAF6EE" stroke="#2C2621" stroke-width="2.5" />
      <!-- Red Fox Ears -->
      <polygon points="20,18 24,6 30,14" fill="#C74B4B" stroke="#2C2621" stroke-width="1.5" />
      <polygon points="44,18 40,6 34,14" fill="#C74B4B" stroke="#2C2621" stroke-width="1.5" />
      <!-- Divine Red Eye Marks -->
      <path d="M26 22 Q29 20 31 22" stroke="#C74B4B" stroke-width="2" fill="none" />
      <path d="M38 22 Q35 20 33 22" stroke="#C74B4B" stroke-width="2" fill="none" />
    </svg>
  `,

  bear_baker: `
    <svg viewBox="0 0 64 64" class="svg-unit bear-baker">
      <ellipse cx="32" cy="56" rx="20" ry="5" fill="#D8CEBA" />
      <!-- Big Warm Bear Body -->
      <circle cx="32" cy="40" r="16" fill="#8C6E4A" stroke="#2C2621" stroke-width="2.5" />
      <ellipse cx="32" cy="43" rx="10" ry="11" fill="#FAF6EE" />
      <!-- Head -->
      <circle cx="32" cy="22" r="13" fill="#8C6E4A" stroke="#2C2621" stroke-width="2.5" />
      <!-- Chef Toque Hat -->
      <path d="M24 14 Q22 6 32 6 Q42 6 40 14 Z" fill="#FAF6EE" stroke="#2C2621" stroke-width="2" />
      <!-- Steaming Bun in Hand -->
      <circle cx="44" cy="38" r="4.5" fill="#FAF6EE" stroke="#2C2621" stroke-width="1.5" />
      <path d="M44 32 Q45 29 44 26" stroke="#FAF6EE" stroke-width="1.5" fill="none" />
    </svg>
  `,

  // ================= ENEMIES (霧怪) =================
  fog_blob: `
    <svg viewBox="0 0 64 64" class="svg-enemy fog-blob">
      <ellipse cx="32" cy="54" rx="18" ry="4" fill="#D8CEBA" />
      <path d="M18 42 C12 36 14 26 24 24 C26 16 38 16 42 22 C50 24 52 34 46 42 C42 48 24 48 18 42 Z" fill="#3F4D70" stroke="#2C2621" stroke-width="2.5" />
      <!-- Glowing Red Eyes -->
      <circle cx="28" cy="32" r="2.5" fill="#E86363" />
      <circle cx="38" cy="32" r="2.5" fill="#E86363" />
    </svg>
  `,

  shadow_rat: `
    <svg viewBox="0 0 64 64" class="svg-enemy shadow-rat">
      <ellipse cx="32" cy="54" rx="16" ry="4" fill="#D8CEBA" />
      <path d="M14 42 Q20 34 36 34 Q48 34 52 44 Q36 48 14 42 Z" fill="#1E2538" stroke="#2C2621" stroke-width="2" />
      <!-- Snout & Whisker -->
      <polygon points="50,42 58,45 50,47" fill="#1E2538" stroke="#2C2621" stroke-width="1.5" />
      <!-- Red Eyes -->
      <circle cx="48" cy="40" r="2" fill="#E86363" />
    </svg>
  `,

  paper_ghost: `
    <svg viewBox="0 0 64 64" class="svg-enemy paper-ghost">
      <ellipse cx="32" cy="56" rx="16" ry="4" fill="#D8CEBA" />
      <!-- Umbrella Canopy -->
      <path d="M16 34 Q32 14 48 34 Z" fill="#5B3A29" stroke="#2C2621" stroke-width="2.5" />
      <line x1="32" y1="20" x2="32" y2="52" stroke="#2C2621" stroke-width="2.5" stroke-linecap="round" />
      <!-- Single Huge Eyeball -->
      <circle cx="32" cy="28" r="5" fill="#FAF6EE" stroke="#2C2621" stroke-width="1.5" />
      <circle cx="32" cy="28" r="2" fill="#C74B4B" />
      <!-- Tongue -->
      <path d="M32 38 Q36 46 32 50 Q30 46 32 38 Z" fill="#E86363" />
    </svg>
  `,

  hop_lantern: `
    <svg viewBox="0 0 64 64" class="svg-enemy hop-lantern">
      <ellipse cx="32" cy="56" rx="14" ry="4" fill="#D8CEBA" />
      <!-- Cursed Caged Lantern -->
      <rect x="22" y="24" width="20" height="24" rx="6" fill="#4A3459" stroke="#2C2621" stroke-width="2.5" />
      <circle cx="32" cy="36" r="5" fill="#A855F7" opacity="0.8" />
      <!-- Wicked Grin -->
      <path d="M26 40 Q32 44 38 40" stroke="#FAF6EE" stroke-width="2" fill="none" />
      <!-- Bouncing Single Leg -->
      <line x1="32" y1="48" x2="32" y2="56" stroke="#2C2621" stroke-width="3" stroke-linecap="round" />
    </svg>
  `,

  armored_snail: `
    <svg viewBox="0 0 64 64" class="svg-enemy armored-snail">
      <ellipse cx="32" cy="56" rx="20" ry="4" fill="#D8CEBA" />
      <!-- Iron Shell -->
      <circle cx="28" cy="34" r="14" fill="#545B6B" stroke="#2C2621" stroke-width="2.5" />
      <path d="M28 24 Q36 28 34 36 Q30 42 24 36" fill="none" stroke="#2C2621" stroke-width="2" />
      <!-- Snail Foot & Eyestalks -->
      <path d="M16 48 Q32 46 48 48 Q50 44 46 40 Q38 42 28 44 Z" fill="#6E8B75" stroke="#2C2621" stroke-width="2" />
      <circle cx="48" cy="34" r="2" fill="#E86363" />
    </svg>
  `,

  split_mist: `
    <svg viewBox="0 0 64 64" class="svg-enemy split-mist">
      <ellipse cx="32" cy="56" rx="18" ry="4" fill="#D8CEBA" />
      <!-- Twin fused mist heads -->
      <circle cx="24" cy="34" r="10" fill="#3F4D70" stroke="#2C2621" stroke-width="2" />
      <circle cx="40" cy="34" r="10" fill="#3F4D70" stroke="#2C2621" stroke-width="2" />
      <circle cx="22" cy="32" r="2" fill="#E86363" />
      <circle cx="38" cy="32" r="2" fill="#E86363" />
    </svg>
  `,

  windchime_spectre: `
    <svg viewBox="0 0 64 64" class="svg-enemy windchime-spectre">
      <ellipse cx="32" cy="56" rx="14" ry="4" fill="#D8CEBA" opacity="0.6" />
      <!-- Floating Ghost Body -->
      <path d="M24 24 Q32 14 40 24 Q44 38 40 46 Q36 40 32 46 Q28 40 24 46 Z" fill="#6A7B9B" stroke="#2C2621" stroke-width="2" />
      <!-- Chime Clapper -->
      <circle cx="32" cy="50" r="3" fill="#D9822B" stroke="#2C2621" stroke-width="1.5" />
    </svg>
  `,

  mud_golem: `
    <svg viewBox="0 0 64 64" class="svg-enemy mud-golem">
      <ellipse cx="32" cy="56" rx="22" ry="5" fill="#D8CEBA" />
      <!-- Giant Heavy Mud Body -->
      <rect x="18" y="24" width="28" height="28" rx="8" fill="#5A4738" stroke="#2C2621" stroke-width="2.5" />
      <!-- Cracks & Eyes -->
      <line x1="24" y1="28" x2="30" y2="34" stroke="#D9822B" stroke-width="2" />
      <circle cx="26" cy="32" r="2.5" fill="#FFB84D" />
      <circle cx="38" cy="32" r="2.5" fill="#FFB84D" />
    </svg>
  `,

  // ================= BOSSES =================
  boss_mother_of_mist: `
    <svg viewBox="0 0 64 64" class="svg-boss mother-of-mist">
      <ellipse cx="32" cy="56" rx="24" ry="6" fill="#D8CEBA" />
      <path d="M12 48 C6 30 14 14 32 12 C50 14 58 30 52 48 Z" fill="#242B42" stroke="#2C2621" stroke-width="3" />
      <!-- Crown of Mist Horns -->
      <polygon points="20,16 26,4 32,12 38,4 44,16" fill="#3F4D70" stroke="#2C2621" stroke-width="2" />
      <!-- Piercing Glowing Eyes -->
      <circle cx="26" cy="28" r="3.5" fill="#E86363" />
      <circle cx="38" cy="28" r="3.5" fill="#E86363" />
      <circle cx="26" cy="28" r="1.5" fill="#FFFFFF" />
      <circle cx="38" cy="28" r="1.5" fill="#FFFFFF" />
    </svg>
  `,

  boss_night_crow_king: `
    <svg viewBox="0 0 64 64" class="svg-boss night-crow-king">
      <ellipse cx="32" cy="56" rx="24" ry="5" fill="#D8CEBA" />
      <!-- Massive Wing Span -->
      <path d="M8 28 Q24 20 32 30 Q40 20 56 28 Q44 48 32 50 Q20 48 8 28 Z" fill="#1A2035" stroke="#2C2621" stroke-width="2.5" />
      <!-- Crow Beak & Crown -->
      <polygon points="32,24 44,28 32,32" fill="#D9822B" stroke="#2C2621" stroke-width="1.5" />
      <circle cx="28" cy="24" r="2.5" fill="#E86363" />
    </svg>
  `,

  boss_elder_demon: `
    <svg viewBox="0 0 64 64" class="svg-boss elder-demon">
      <ellipse cx="32" cy="56" rx="24" ry="5" fill="#D8CEBA" />
      <!-- Huge ancient cracked stone lantern -->
      <rect x="16" y="16" width="32" height="34" rx="6" fill="#383838" stroke="#2C2621" stroke-width="3" />
      <!-- Sickly Green Fire Interior -->
      <circle cx="32" cy="33" r="10" fill="#4ADE80" opacity="0.9" />
      <!-- Evil Eyes & Grimace -->
      <circle cx="26" cy="30" r="3" fill="#14532D" />
      <circle cx="38" cy="30" r="3" fill="#14532D" />
    </svg>
  `,

  // ================= LANTERNS (小鎮燈籠) =================
  lantern_full: `
    <svg viewBox="0 0 48 48" class="svg-lantern lantern-full">
      <ellipse cx="24" cy="44" rx="14" ry="3" fill="#D8CEBA" />
      <!-- Stone Post Base -->
      <rect x="20" y="38" width="8" height="6" fill="#8C827A" stroke="#2C2621" stroke-width="1.5" />
      <!-- Paper Lantern Body -->
      <rect x="14" y="14" width="20" height="24" rx="8" fill="#FFB84D" stroke="#2C2621" stroke-width="2" />
      <!-- Golden Glow Core -->
      <circle cx="24" cy="26" r="6" fill="#FFF3D6" />
      <!-- Cap & Tassel -->
      <polygon points="10,14 38,14 24,8" fill="#C74B4B" stroke="#2C2621" stroke-width="1.5" stroke-linejoin="round" />
      <line x1="24" y1="38" x2="24" y2="43" stroke="#C74B4B" stroke-width="2" stroke-linecap="round" />
    </svg>
  `,

  lantern_damaged: `
    <svg viewBox="0 0 48 48" class="svg-lantern lantern-damaged">
      <ellipse cx="24" cy="44" rx="14" ry="3" fill="#D8CEBA" />
      <rect x="20" y="38" width="8" height="6" fill="#8C827A" stroke="#2C2621" stroke-width="1.5" />
      <!-- Damaged Body -->
      <rect x="14" y="14" width="20" height="24" rx="8" fill="#E69A35" stroke="#2C2621" stroke-width="2" />
      <line x1="18" y1="20" x2="28" y2="30" stroke="#2C2621" stroke-width="1.5" />
      <circle cx="24" cy="26" r="4" fill="#FFB84D" />
      <polygon points="10,14 38,14 24,8" fill="#8C6E4A" stroke="#2C2621" stroke-width="1.5" />
    </svg>
  `,

  lantern_extinguished: `
    <svg viewBox="0 0 48 48" class="svg-lantern lantern-extinguished">
      <ellipse cx="24" cy="44" rx="14" ry="3" fill="#D8CEBA" />
      <rect x="20" y="38" width="8" height="6" fill="#54504D" stroke="#2C2621" stroke-width="1.5" />
      <rect x="14" y="14" width="20" height="24" rx="8" fill="#8C827A" stroke="#2C2621" stroke-width="2" />
      <polygon points="10,14 38,14 24,8" fill="#54504D" stroke="#2C2621" stroke-width="1.5" />
    </svg>
  `,

  // ================= UI ICONS (墨線手繪圖標) =================
  icons: {
    home: `<svg viewBox="0 0 24 24" class="svg-icon" style="width:20px;height:20px;"><path d="M3 11 L12 3 L21 11 L21 21 L15 21 L15 14 L9 14 L9 21 L3 21 Z" fill="#F4EEDF" stroke="#2C2621" stroke-width="2" stroke-linejoin="round"/></svg>`,
    coin: `<svg viewBox="0 0 24 24" class="svg-icon" style="width:18px;height:18px;"><circle cx="12" cy="12" r="9" fill="#FFB84D" stroke="#2C2621" stroke-width="2"/><rect x="9.5" y="9.5" width="5" height="5" fill="#FAF6EE" stroke="#2C2621" stroke-width="1.5"/></svg>`,
    star: `<svg viewBox="0 0 24 24" class="svg-icon" style="width:18px;height:18px;"><polygon points="12,2 15,9 22,12 15,15 12,22 9,15 2,12 9,9" fill="#FFB84D" stroke="#2C2621" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
    undo: `<svg viewBox="0 0 24 24" class="svg-icon" style="width:20px;height:20px;"><path d="M8 8 L3 12 L8 16" fill="none" stroke="#2C2621" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 12 Q12 10 18 14 Q21 16 21 20" fill="none" stroke="#2C2621" stroke-width="2.5" stroke-linecap="round"/></svg>`,
    music: `<svg viewBox="0 0 24 24" class="svg-icon" style="width:20px;height:20px;"><path d="M9 18 A3 3 0 1 1 6 15 L6 4 L18 2 L18 14 A3 3 0 1 1 15 11" fill="#2C2621"/></svg>`,
    sfx: `<svg viewBox="0 0 24 24" class="svg-icon" style="width:20px;height:20px;"><path d="M12 3 C8 3 6 8 6 13 L4 16 L20 16 L18 13 C18 8 16 3 12 3 Z" fill="#FFB84D" stroke="#2C2621" stroke-width="2"/><circle cx="12" cy="19" r="2" fill="#2C2621"/></svg>`,
    lantern: `<svg viewBox="0 0 24 24" class="svg-icon" style="width:20px;height:20px;"><rect x="7" y="6" width="10" height="12" rx="4" fill="#FFB84D" stroke="#2C2621" stroke-width="2"/><line x1="12" y1="2" x2="12" y2="6" stroke="#2C2621" stroke-width="2"/><line x1="12" y1="18" x2="12" y2="22" stroke="#C74B4B" stroke-width="2"/></svg>`,
    moon: `<svg viewBox="0 0 24 24" class="svg-icon" style="width:20px;height:20px;"><path d="M14 3 C7 4 4 11 7 18 C10 22 17 23 21 18 C13 18 10 11 14 3 Z" fill="#FFE2A8" stroke="#2C2621" stroke-width="2" stroke-linejoin="round"/></svg>`,
    town: `<svg viewBox="0 0 24 24" class="svg-icon" style="width:20px;height:20px;"><polygon points="3,11 7,7 11,11" fill="#C74B4B" stroke="#2C2621" stroke-width="1.5"/><rect x="4" y="11" width="6" height="8" fill="#F4EEDF" stroke="#2C2621" stroke-width="1.5"/><polygon points="13,9 18,4 23,9" fill="#6E8B75" stroke="#2C2621" stroke-width="1.5"/><rect x="14" y="9" width="8" height="10" fill="#F4EEDF" stroke="#2C2621" stroke-width="1.5"/></svg>`,
    book: `<svg viewBox="0 0 24 24" class="svg-icon" style="width:20px;height:20px;"><path d="M4 19 C7 18 10 18 12 20 C14 18 17 18 20 19 L20 5 C17 4 14 4 12 6 C10 4 7 4 4 5 Z" fill="#FAF6EE" stroke="#2C2621" stroke-width="2" stroke-linejoin="round"/><line x1="12" y1="6" x2="12" y2="20" stroke="#2C2621" stroke-width="2"/></svg>`,
    tea: `<svg viewBox="0 0 24 24" class="svg-icon" style="width:20px;height:20px;"><path d="M4 8 Q12 6 20 8 Q19 18 12 18 Q5 18 4 8 Z" fill="#6E8B75" stroke="#2C2621" stroke-width="2"/><line x1="6" y1="20" x2="18" y2="20" stroke="#2C2621" stroke-width="2" stroke-linecap="round"/></svg>`,
    sword: `<svg viewBox="0 0 24 24" class="svg-icon" style="width:20px;height:20px;"><line x1="4" y1="20" x2="17" y2="7" stroke="#2C2621" stroke-width="2.5" stroke-linecap="round"/><polygon points="17,7 20,4 21,5 18,8" fill="#545B6B"/><line x1="6" y1="15" x2="9" y2="18" stroke="#2C2621" stroke-width="2"/></svg>`,
    boss: `<svg viewBox="0 0 24 24" class="svg-icon" style="width:20px;height:20px;"><polygon points="3,17 4,7 8,11 12,5 16,11 20,7 21,17" fill="#C74B4B" stroke="#2C2621" stroke-width="2" stroke-linejoin="round"/></svg>`,
    hotspring: `<svg viewBox="0 0 24 24" class="svg-icon" style="width:20px;height:20px;"><ellipse cx="12" cy="18" rx="9" ry="4" fill="#5B8C85" stroke="#2C2621" stroke-width="2"/><path d="M8 12 Q9 9 8 6 M12 12 Q13 9 12 6 M16 12 Q17 9 16 6" fill="none" stroke="#2C2621" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    shrine: `<svg viewBox="0 0 24 24" class="svg-icon" style="width:20px;height:20px;"><line x1="3" y1="6" x2="21" y2="6" stroke="#C74B4B" stroke-width="3" stroke-linecap="round"/><line x1="5" y1="8" x2="19" y2="8" stroke="#C74B4B" stroke-width="1.5"/><line x1="7" y1="6" x2="7" y2="20" stroke="#2C2621" stroke-width="2.5"/><line x1="17" y1="6" x2="17" y2="20" stroke="#2C2621" stroke-width="2.5"/></svg>`,
    attack: `<svg viewBox="0 0 16 16" style="width:14px;height:14px;vertical-align:middle;"><path d="M2 14 L12 4 M9 3 L13 3 L13 7" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/></svg>`,
    move: `<svg viewBox="0 0 16 16" style="width:14px;height:14px;vertical-align:middle;"><path d="M8 2 L8 14 M4 10 L8 14 L12 10" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/></svg>`,
    spawn: `<svg viewBox="0 0 16 16" style="width:14px;height:14px;vertical-align:middle;"><circle cx="8" cy="8" r="4" fill="#E86363" stroke="#FFFFFF" stroke-width="1.5"/><circle cx="4" cy="5" r="2" fill="#E86363"/><circle cx="12" cy="5" r="2" fill="#E86363"/></svg>`,
    aoe: `<svg viewBox="0 0 16 16" style="width:14px;height:14px;vertical-align:middle;"><polygon points="8,1 10,6 15,8 10,10 8,15 6,10 1,8 6,6" fill="#FFB84D" stroke="#2C2621" stroke-width="1"/></svg>`,
    frozen: `<svg viewBox="0 0 16 16" style="width:14px;height:14px;vertical-align:middle;"><line x1="8" y1="2" x2="8" y2="14" stroke="#5B8C85" stroke-width="2"/><line x1="2" y1="8" x2="14" y2="8" stroke="#5B8C85" stroke-width="2"/><line x1="3" y1="3" x2="13" y2="13" stroke="#5B8C85" stroke-width="1.5"/><line x1="13" y1="3" x2="3" y2="13" stroke="#5B8C85" stroke-width="1.5"/></svg>`,
    check: `<svg viewBox="0 0 16 16" style="width:14px;height:14px;vertical-align:middle;"><path d="M3 8 L6 11 L13 4" fill="none" stroke="#2C2621" stroke-width="2" stroke-linecap="round"/></svg>`
  }
};
