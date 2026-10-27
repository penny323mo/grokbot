#!/usr/bin/env python3
"""
Generate illustrated side/oblique architectural scenes for Harbour Casebook (SPEC §2 / §7)
Single consistent perspective camera, rich ink linework, authentic 1960s Macau architecture,
archival paper & ink wash palette, and precise hotspot coordinates matching cases.js.
Dimensions: 390 x 700 viewBox
"""

import os

def create_case1_pawnshop():
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 390 700" width="100%" height="100%" class="case-scene-svg">
  <defs>
    <!-- Paper grain wash -->
    <linearGradient id="c1_wallWash" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#E2D7C4"/>
      <stop offset="60%" stop-color="#EDE2CF"/>
      <stop offset="100%" stop-color="#DDCFBA"/>
    </linearGradient>
    <linearGradient id="c1_floorWash" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#C5B8A3"/>
      <stop offset="100%" stop-color="#8F826E"/>
    </linearGradient>
    <!-- Portuguese Azulejos Pattern -->
    <pattern id="c1_azulejos" width="20" height="20" patternUnits="userSpaceOnUse">
      <rect width="20" height="20" fill="#F4EDE2" stroke="#2E4B66" stroke-width="0.7"/>
      <circle cx="10" cy="10" r="5" fill="none" stroke="#2E4B66" stroke-width="0.7"/>
      <polygon points="10,2 12,8 18,10 12,12 10,18 8,12 2,10 8,8" fill="#2E4B66" opacity="0.4"/>
    </pattern>
    <!-- Shadow Gradient -->
    <radialGradient id="c1_dropShadow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#1F1B16" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#1F1B16" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="c1_lampGlow" cx="50%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#FFF5D6" stop-opacity="0.85"/>
      <stop offset="40%" stop-color="#F4E8C1" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#1F1B16" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Background Back Wall -->
  <rect width="390" height="700" fill="url(#c1_wallWash)"/>

  <!-- Timber Ceiling & Receding Joists (Perspective vanishing point near x:195, y:280) -->
  <polygon points="0,0 390,0 390,105 0,105" fill="#3D2B1F"/>
  <line x1="0" y1="105" x2="390" y2="105" stroke="#1F1B16" stroke-width="2.5"/>
  <!-- Beams -->
  <line x1="0" y1="20" x2="390" y2="20" stroke="#1F1B16" stroke-width="1.2"/>
  <line x1="0" y1="50" x2="390" y2="50" stroke="#1F1B16" stroke-width="1.2"/>
  <line x1="0" y1="80" x2="390" y2="80" stroke="#1F1B16" stroke-width="1.2"/>
  <!-- Transverse rafter brackets -->
  <g stroke="#1F1B16" stroke-width="1" fill="#2E1F16">
    <rect x="30" y="80" width="16" height="25"/>
    <rect x="90" y="80" width="16" height="25"/>
    <rect x="284" y="80" width="16" height="25"/>
    <rect x="344" y="80" width="16" height="25"/>
  </g>

  <!-- Portuguese Azulejos Frieze across upper wall -->
  <rect x="0" y="105" width="390" height="20" fill="url(#c1_azulejos)"/>
  <line x1="0" y1="125" x2="390" y2="125" stroke="#1F1B16" stroke-width="1.8"/>

  <!-- Historic Pawnshop Signboard (德生大押) -->
  <g transform="translate(125, 22)">
    <!-- Bat-and-coin stylized frame -->
    <rect x="0" y="0" width="140" height="68" rx="4" fill="#1F1B16" stroke="#9A3B2C" stroke-width="2.5"/>
    <rect x="4" y="4" width="132" height="60" rx="2" fill="#352419" stroke="#C49B4B" stroke-width="1"/>
    <!-- Bat wing silhouette accents -->
    <path d="M10 10 Q25 4 40 10 L40 14 Q25 8 10 14 Z" fill="#C49B4B" opacity="0.8"/>
    <path d="M130 10 Q115 4 100 10 L100 14 Q115 8 130 14 Z" fill="#C49B4B" opacity="0.8"/>
    <text x="70" y="48" font-family="'Noto Serif CJK TC', 'Noto Serif TC', serif" font-size="28" font-weight="900" fill="#C49B4B" text-anchor="middle" letter-spacing="4">德生大押</text>
    <text x="70" y="18" font-family="'Noto Sans TC', sans-serif" font-size="7.5" fill="#E8DEC8" text-anchor="middle" letter-spacing="1">光緒廿九年立 · 內港總號</text>
  </g>

  <!-- Ceiling Brass Chain & Green Enamel Pendant Lamp -->
  <line x1="195" y1="0" x2="195" y2="140" stroke="#1F1B16" stroke-width="1.5"/>
  <!-- Lamp shade -->
  <path d="M170 152 L220 152 L212 140 L178 140 Z" fill="#2E4A3E" stroke="#1F1B16" stroke-width="1.5"/>
  <ellipse cx="195" cy="152" rx="25" ry="5" fill="#FAF6EE" stroke="#1F1B16" stroke-width="1"/>
  <!-- Golden light wash cone -->
  <polygon points="170,152 220,152 350,560 40,560" fill="url(#c1_lampGlow)" opacity="0.6"/>

  <!-- Left Side Wall (Perspective receding: x:0..90, y:125..700) -->
  <polygon points="0,125 90,260 90,700 0,700" fill="#C5B7A0" stroke="#1F1B16" stroke-width="1.5"/>
  <!-- Brick course hatching on side wall -->
  <g stroke="#8A7A66" stroke-width="0.8" opacity="0.6">
    <line x1="0" y1="160" x2="25" y2="198"/>
    <line x1="0" y1="210" x2="55" y2="292"/>
    <line x1="0" y1="260" x2="90" y2="395"/>
    <line x1="0" y1="320" x2="90" y2="455"/>
    <line x1="0" y1="390" x2="90" y2="525"/>
    <line x1="0" y1="470" x2="90" y2="605"/>
  </g>

  <!-- Perspective Stone Tile Floor (Oblique 3/4 vanishing orthogonals) -->
  <polygon points="90,260 390,260 390,700 90,700" fill="url(#c1_floorWash)"/>
  <!-- Oblique 3/4 Floor Tile Lines (Angle matching desk & safe recession) -->
  <g stroke="#1F1B16" stroke-width="0.9" opacity="0.45">
    <!-- Orthogonals receding to vanishing point -->
    <line x1="120" y1="260" x2="85" y2="700"/>
    <line x1="170" y1="260" x2="145" y2="700"/>
    <line x1="225" y1="260" x2="215" y2="700"/>
    <line x1="280" y1="260" x2="285" y2="700"/>
    <line x1="335" y1="260" x2="355" y2="700"/>
    <!-- Angled Transverse Paver Joints in 3/4 Perspective -->
    <line x1="90" y1="290" x2="390" y2="330"/>
    <line x1="90" y1="340" x2="390" y2="395"/>
    <line x1="90" y1="400" x2="390" y2="470"/>
    <line x1="90" y1="475" x2="390" y2="560"/>
    <line x1="90" y1="565" x2="390" y2="665"/>
  </g>

  <!-- ==============================================
       HOTSPOT 7: c1_iron_window (16%, 22% -> x:62.4, y:154)
       High Cast-Iron Barred Transom Window
       ============================================== -->
  <g id="art_c1_iron_window" transform="translate(28, 108)">
    <!-- Granite masonry window arch -->
    <path d="M10 85 L10 35 Q35 5 60 35 L60 85 Z" fill="#22282C" stroke="#1F1B16" stroke-width="2.2"/>
    <path d="M16 83 L16 38 Q35 15 54 38 L54 83 Z" fill="#3D454A" stroke="#1F1B16" stroke-width="1.2"/>
    <!-- Iron security bars -->
    <line x1="26" y1="22" x2="26" y2="83" stroke="#1F1B16" stroke-width="2"/>
    <line x1="35" y1="16" x2="35" y2="83" stroke="#1F1B16" stroke-width="2"/>
    <line x1="44" y1="22" x2="44" y2="83" stroke="#1F1B16" stroke-width="2"/>
    <!-- Horizontal tie bars -->
    <line x1="16" y1="40" x2="54" y2="40" stroke="#1F1B16" stroke-width="2"/>
    <line x1="16" y1="62" x2="54" y2="62" stroke="#1F1B16" stroke-width="2"/>
    <!-- Moonlit window sill highlight -->
    <rect x="8" y="85" width="54" height="6" fill="#8A9297" stroke="#1F1B16" stroke-width="1.2"/>
  </g>

  <!-- ==============================================
       HOTSPOT 8: c1_counter_grille (62%, 28% -> x:241.8, y:196)
       Soaring Rosewood Pawn Counter & Security Balusters
       ============================================== -->
  <g id="art_c1_counter_grille" transform="translate(180, 130)">
    <!-- Back partition wall -->
    <rect x="0" y="0" width="200" height="120" fill="#2E2017" stroke="#1F1B16" stroke-width="2"/>
    <!-- Upper carved transom beam -->
    <rect x="0" y="0" width="200" height="22" fill="#422E21" stroke="#1F1B16" stroke-width="1.5"/>
    <!-- Gold filigree carving in frieze -->
    <path d="M10 11 Q30 5 50 11 T90 11 T130 11 T170 11" fill="none" stroke="#C49B4B" stroke-width="1.2" opacity="0.7"/>
    <!-- Vertical turned-wood balusters (turned grilles) -->
    <g stroke="#1F1B16" stroke-width="1.5" fill="#5A3E2C">
      <rect x="15" y="22" width="6" height="90"/>
      <rect x="30" y="22" width="6" height="90"/>
      <rect x="45" y="22" width="6" height="90"/>
      <rect x="60" y="22" width="6" height="90"/>
      <rect x="75" y="22" width="6" height="90"/>
      <!-- Wicket window (pledge opening) -->
      <rect x="90" y="45" width="45" height="67" fill="#1A130E" stroke="#C49B4B" stroke-width="1.5"/>
      <rect x="144" y="22" width="6" height="90"/>
      <rect x="159" y="22" width="6" height="90"/>
      <rect x="174" y="22" width="6" height="90"/>
      <rect x="189" y="22" width="6" height="90"/>
    </g>
    <!-- Turned wooden ring accents on balusters -->
    <circle cx="18" cy="65" r="4" fill="#C49B4B"/>
    <circle cx="33" cy="65" r="4" fill="#C49B4B"/>
    <circle cx="48" cy="65" r="4" fill="#C49B4B"/>
    <circle cx="63" cy="65" r="4" fill="#C49B4B"/>
    <circle cx="78" cy="65" r="4" fill="#C49B4B"/>
    <circle cx="147" cy="65" r="4" fill="#C49B4B"/>
    <circle cx="162" cy="65" r="4" fill="#C49B4B"/>
    <circle cx="177" cy="65" r="4" fill="#C49B4B"/>
    <circle cx="192" cy="65" r="4" fill="#C49B4B"/>
    <!-- Thick Rosewood Counter Shelf -->
    <rect x="-10" y="112" width="220" height="15" fill="#4A3423" stroke="#1F1B16" stroke-width="2"/>
    <rect x="-10" y="127" width="220" height="20" fill="#352417" stroke="#1F1B16" stroke-width="1.5"/>
  </g>

  <!-- ==============================================
       HOTSPOT 3: c1_safe (24%, 42% -> x:93.6, y:294)
       HOTSPOT 4: c1_handkerchief (27%, 48% -> x:105.3, y:336)
       Massive Cast-Iron Wall Safe & Silk Handkerchief
       ============================================== -->
  <g id="art_c1_safe_group" transform="translate(45, 230)">
    <!-- Drop Shadow on floor/wall -->
    <polygon points="10,130 90,130 110,145 0,145" fill="#1F1B16" opacity="0.3"/>
    <!-- Granite wall safe recess -->
    <rect x="12" y="10" width="76" height="115" fill="#1F1B16" stroke="#4A3F35" stroke-width="2"/>
    <!-- Safe Interior Shelves -->
    <rect x="16" y="14" width="68" height="107" fill="#2E3336" stroke="#1F1B16" stroke-width="1.2"/>
    <!-- Middle shelf -->
    <line x1="16" y1="55" x2="84" y2="55" stroke="#1F1B16" stroke-width="2.5"/>
    <!-- Lower shelf -->
    <line x1="16" y1="88" x2="84" y2="88" stroke="#1F1B16" stroke-width="2.5"/>

    <!-- Open Heavy Safe Door (swung outward in perspective) -->
    <polygon points="12,10 12,125 -25,142 -25,28" fill="#3D454A" stroke="#1F1B16" stroke-width="2"/>
    <!-- Door inner panel & locking bolts -->
    <polygon points="8,18 8,118 -20,133 -20,34" fill="#505A60" stroke="#1F1B16" stroke-width="1.2"/>
    <!-- Brass hinges -->
    <rect x="8" y="24" width="8" height="14" fill="#C49B4B" stroke="#1F1B16" stroke-width="1"/>
    <rect x="8" y="96" width="8" height="14" fill="#C49B4B" stroke="#1F1B16" stroke-width="1"/>
    <!-- Brass Dial Tumbler Lock on door -->
    <ellipse cx="-10" cy="80" rx="8" ry="12" fill="#C49B4B" stroke="#1F1B16" stroke-width="1.5"/>
    <circle cx="-10" cy="80" r="3" fill="#1F1B16"/>

    <!-- Bottom Shelf: Opened Lacquered Jewel Box -->
    <g transform="translate(35, 90)">
      <!-- Open jewel box -->
      <polygon points="0,15 28,15 36,9 8,9" fill="#9A3B2C" stroke="#1F1B16" stroke-width="1.2"/>
      <rect x="0" y="15" width="28" height="12" fill="#752619" stroke="#1F1B16" stroke-width="1.2"/>
      <polygon points="28,15 36,9 36,21 28,27" fill="#5C1B10" stroke="#1F1B16" stroke-width="1.2"/>
      <!-- Empty velvet ring groove -->
      <ellipse cx="14" cy="15" rx="9" ry="3" fill="#1F1B16" opacity="0.6"/>
      <!-- Spilled Embroidered Silk Handkerchief (c1_handkerchief at 27%, 48%) -->
      <path d="M12 12 Q20 4 28 12 Q32 24 24 28 Q16 26 14 18 Z" fill="#FAF6EE" stroke="#1F1B16" stroke-width="1"/>
      <!-- White Orchid embroidery -->
      <circle cx="20" cy="18" r="2.5" fill="#4F6F5F" opacity="0.7"/>
      <circle cx="23" cy="16" r="1.5" fill="#9A3B2C" opacity="0.8"/>
    </g>
  </g>

  <!-- ==============================================
       HOTSPOT 5: c1_desk_tea (62%, 48% -> x:241.8, y:336)
       HOTSPOT 6: c1_ticket_ledger (72%, 46% -> x:280.8, y:322)
       Carved Rosewood Desk, Ledger & Porcelain Tea Bowl
       ============================================== -->
  <g id="art_c1_desk_group" transform="translate(190, 275)">
    <!-- Desk Drop Shadow on Floor -->
    <polygon points="10,120 180,120 195,145 25,145" fill="#1F1B16" opacity="0.35"/>
    <!-- Rosewood Desk Body in 3D perspective -->
    <!-- Top Desk Surface -->
    <polygon points="20,25 180,25 160,65 0,65" fill="#5C3F2B" stroke="#1F1B16" stroke-width="2"/>
    <!-- Wood grain on desk -->
    <line x1="30" y1="35" x2="160" y2="35" stroke="#422C1D" stroke-width="0.8"/>
    <line x1="20" y1="48" x2="150" y2="48" stroke="#422C1D" stroke-width="0.8"/>
    <!-- Front Apron & Drawers -->
    <polygon points="0,65 160,65 160,95 0,95" fill="#422D1F" stroke="#1F1B16" stroke-width="2"/>
    <!-- Side Panel -->
    <polygon points="160,65 180,25 180,55 160,95" fill="#2E1E14" stroke="#1F1B16" stroke-width="2"/>
    <!-- Drawer Frames & Brass Pull Handles -->
    <rect x="15" y="70" width="58" height="20" fill="#4D3423" stroke="#1F1B16" stroke-width="1.2"/>
    <ellipse cx="44" cy="80" rx="6" ry="3" fill="#C49B4B" stroke="#1F1B16" stroke-width="0.8"/>
    <rect x="85" y="70" width="58" height="20" fill="#4D3423" stroke="#1F1B16" stroke-width="1.2"/>
    <ellipse cx="114" cy="80" rx="6" ry="3" fill="#C49B4B" stroke="#1F1B16" stroke-width="0.8"/>
    <!-- Carved Desk Legs -->
    <rect x="5" y="95" width="12" height="40" fill="#3A271B" stroke="#1F1B16" stroke-width="1.5"/>
    <rect x="145" y="95" width="12" height="40" fill="#3A271B" stroke="#1F1B16" stroke-width="1.5"/>

    <!-- Desk Props: Tea Bowl & Brass Ruler (c1_desk_tea at 62%, 48%) -->
    <g transform="translate(38, 38)">
      <!-- Master's dry tea cup -->
      <ellipse cx="0" cy="5" rx="6" ry="3" fill="#8A7A66" stroke="#1F1B16" stroke-width="0.8"/>
      <!-- Guest's Celadon porcelain cup with vermilion lipstick -->
      <ellipse cx="16" cy="6" rx="7" ry="4" fill="#E8F0EA" stroke="#4F6F5F" stroke-width="1.2"/>
      <path d="M11 5 Q14 2 17 5" stroke="#9A3B2C" stroke-width="1.5" fill="none"/>
      <!-- Brass measuring ruler -->
      <polygon points="30,8 70,0 72,3 32,11" fill="#C49B4B" stroke="#1F1B16" stroke-width="0.9"/>
    </g>

    <!-- Pawn Ticket Ledger Book (c1_ticket_ledger at 72%, 46%) -->
    <g transform="translate(85, 30)">
      <!-- Bound string ledger book -->
      <polygon points="0,15 35,5 55,14 20,24" fill="#FAF6EE" stroke="#1F1B16" stroke-width="1.2"/>
      <polygon points="20,24 55,14 55,19 20,29" fill="#D3C5AE" stroke="#1F1B16" stroke-width="1"/>
      <line x1="8" y1="13" x2="28" y2="22" stroke="#2E4B66" stroke-width="1.2"/>
      <!-- Text lines on ledger -->
      <line x1="12" y1="12" x2="32" y2="7" stroke="#1F1B16" stroke-width="0.7"/>
      <line x1="16" y1="16" x2="38" y2="10" stroke="#1F1B16" stroke-width="0.7"/>
      <line x1="22" y1="20" x2="44" y2="14" stroke="#1F1B16" stroke-width="0.7"/>
      <!-- Vermilion seal stamped on ledger -->
      <circle cx="34" cy="18" r="4" fill="#9A3B2C" opacity="0.8"/>
    </g>
  </g>

  <!-- ==============================================
       HOTSPOT 10: c1_apprentice_bunk (82%, 56% -> x:319.8, y:392)
       Apprentice Cot tucked in corner
       ============================================== -->
  <g id="art_c1_apprentice_bunk" transform="translate(295, 350)">
    <!-- Cot shadow -->
    <polygon points="0,55 90,55 90,75 10,75" fill="#1F1B16" opacity="0.3"/>
    <!-- Timber bunk frame -->
    <polygon points="0,20 90,0 90,25 0,45" fill="#785E46" stroke="#1F1B16" stroke-width="1.5"/>
    <polygon points="0,45 90,25 90,38 0,58" fill="#503E2E" stroke="#1F1B16" stroke-width="1.5"/>
    <!-- Woven straw mat -->
    <polygon points="4,22 86,3 86,22 4,41" fill="#C9B487" stroke="#1F1B16" stroke-width="0.8"/>
    <!-- Folded indigo cotton blanket -->
    <polygon points="40,15 84,6 84,18 40,27" fill="#2E445A" stroke="#1F1B16" stroke-width="1.2"/>
    <!-- Bunk legs -->
    <rect x="2" y="45" width="8" height="28" fill="#3D2E22" stroke="#1F1B16" stroke-width="1.2"/>
    <rect x="80" y="25" width="8" height="28" fill="#3D2E22" stroke="#1F1B16" stroke-width="1.2"/>
  </g>

  <!-- ==============================================
       HOTSPOT 2: c1_abacus (58%, 56% -> x:226.2, y:392)
       Fallen Red Sandalwood Abacus with Blood
       ============================================== -->
  <g id="art_c1_abacus" transform="translate(205, 375)">
    <!-- Drop shadow -->
    <ellipse cx="25" cy="20" rx="28" ry="8" fill="#1F1B16" opacity="0.4"/>
    <!-- Broken red sandalwood abacus frame (skewed on floor) -->
    <polygon points="5,5 48,0 42,26 0,22" fill="#5A2318" stroke="#1F1B16" stroke-width="1.5"/>
    <polygon points="8,8 44,4 39,22 4,19" fill="#752C1E" stroke="#1F1B16" stroke-width="0.8"/>
    <!-- Horizontal dividing beam -->
    <line x1="6" y1="13" x2="42" y2="9" stroke="#1F1B16" stroke-width="1.2"/>
    <!-- Brass rods & wooden beads -->
    <g stroke="#C49B4B" stroke-width="0.8">
      <line x1="12" y1="6" x2="9" y2="20"/>
      <line x1="18" y1="5" x2="15" y2="21"/>
      <line x1="24" y1="4" x2="21" y2="22"/>
      <line x1="30" y1="3" x2="27" y2="23"/>
      <line x1="36" y1="2" x2="33" y2="24"/>
    </g>
    <!-- Bloodstain on corner corner -->
    <path d="M35 15 Q44 18 40 25 Q32 24 35 15 Z" fill="#821C14" opacity="0.9"/>
  </g>

  <!-- ==============================================
       HOTSPOT 1: c1_victim (48%, 62% -> x:187.2, y:434)
       Pawnbroker Chen Tak-sang Prone Body in 3/4 Foreshortening
       ============================================== -->
  <g id="art_c1_victim" transform="translate(130, 400)">
    <!-- Expanding Pool of Dark Blood spreading along floor seams -->
    <path d="M10 46 Q35 28 80 34 Q115 38 126 54 Q118 76 72 72 Q20 74 10 46 Z" fill="#6A1812" opacity="0.85"/>
    <path d="M20 48 Q45 34 75 38 Q100 42 108 52 Q98 65 65 64 Q28 66 20 48 Z" fill="#4A100C" opacity="0.95"/>

    <!-- Fallen Prone Body in 3/4 Foreshortening (Dark Silk Changshan) -->
    <!-- Lower body / Legs stretching back towards left -->
    <path d="M8 52 Q18 48 35 44 L38 58 Q22 62 8 58 Z" fill="#1C1B19" stroke="#1F1B16" stroke-width="1.8"/>
    <!-- Black cloth shoes with white soles -->
    <polygon points="5,50 14,48 12,56 4,56" fill="#1F1B16"/>
    <line x1="4" y1="56" x2="12" y2="56" stroke="#FAF6EE" stroke-width="1"/>

    <!-- Foreshortened Changshan Torso (Slumped prone with shoulder turned) -->
    <path d="M30 42 Q60 30 88 38 L95 56 Q65 64 34 56 Z" fill="#242220" stroke="#1F1B16" stroke-width="2"/>
    <!-- Silk garment fold hatching in 3/4 perspective -->
    <path d="M38 42 Q62 38 82 46" stroke="#48443F" stroke-width="1.2" fill="none"/>
    <path d="M34 50 Q58 45 88 52" stroke="#48443F" stroke-width="1.2" fill="none"/>
    <path d="M48 36 Q55 48 50 60" stroke="#1F1B16" stroke-width="1" fill="none"/>

    <!-- Outstretched Right Arm reaching toward desk -->
    <path d="M86 40 L118 30 L120 35 L90 48 Z" fill="#242220" stroke="#1F1B16" stroke-width="1.5"/>
    <!-- Left Arm crumpled under chest -->
    <path d="M52 56 Q58 64 68 62" stroke="#1F1B16" stroke-width="3" stroke-linecap="round"/>

    <!-- Outstretched Hand with fingers -->
    <circle cx="121" cy="33" r="4.5" fill="#D3C0A8" stroke="#1F1B16" stroke-width="1"/>
    <!-- Torn Bloodstained Pawn Ticket Stub in fingers -->
    <polygon points="122,31 136,24 140,30 126,35" fill="#FAF6EE" stroke="#1F1B16" stroke-width="0.8"/>
    <path d="M126 31 L134 27" stroke="#9A3B2C" stroke-width="1.2"/>

    <!-- Head prone facing floor with grey hair & queue knot -->
    <ellipse cx="38" cy="40" rx="14" ry="11" fill="#D3C0A8" stroke="#1F1B16" stroke-width="1.5"/>
    <path d="M25 36 Q32 28 46 34 Q38 44 25 36 Z" fill="#1F1B16"/>
    <!-- Fatal blunt force fracture on back of skull -->
    <path d="M36 32 L40 36 L38 40" stroke="#821C14" stroke-width="1.5" fill="none"/>

    <!-- Tortoiseshell spectacles fallen beside head -->
    <circle cx="26" cy="50" r="3.5" fill="none" stroke="#C49B4B" stroke-width="0.8"/>
    <circle cx="34" cy="52" r="3.5" fill="none" stroke="#C49B4B" stroke-width="0.8"/>
    <line x1="29" y1="51" x2="31" y2="52" stroke="#C49B4B" stroke-width="0.8"/>
  </g>

  <!-- ==============================================
       HOTSPOT 11: c1_footprints (38%, 70% -> x:148.2, y:490)
       Muddy Footprints Leading from Safe to Back Door
       ============================================== -->
  <g id="art_c1_footprints" stroke="#1F1B16" stroke-width="0.6">
    <!-- Shoe print 1 near safe -->
    <g transform="translate(115, 390) rotate(35)">
      <ellipse cx="0" cy="0" rx="4" ry="9" fill="#5C4533" opacity="0.8"/>
      <ellipse cx="0" cy="8" rx="3.2" ry="4" fill="#5C4533" opacity="0.8"/>
    </g>
    <!-- Shoe print 2 -->
    <g transform="translate(138, 440) rotate(42)">
      <ellipse cx="0" cy="0" rx="4" ry="9" fill="#5C4533" opacity="0.8"/>
      <ellipse cx="0" cy="8" rx="3.2" ry="4" fill="#5C4533" opacity="0.8"/>
    </g>
    <!-- Shoe print 3 (c1_footprints hotspot) -->
    <g transform="translate(148, 490) rotate(50)">
      <ellipse cx="0" cy="0" rx="4.5" ry="10" fill="#4D3828" opacity="0.85"/>
      <ellipse cx="0" cy="9" rx="3.5" ry="4.5" fill="#4D3828" opacity="0.85"/>
      <!-- Ribbed tread marks -->
      <line x1="-3" y1="-3" x2="3" y2="-3" stroke="#2B1D12" stroke-width="0.6"/>
      <line x1="-3" y1="1" x2="3" y2="1" stroke="#2B1D12" stroke-width="0.6"/>
    </g>
    <!-- Shoe print 4 toward back door -->
    <g transform="translate(110, 530) rotate(58)">
      <ellipse cx="0" cy="0" rx="4" ry="9" fill="#5C4533" opacity="0.75"/>
      <ellipse cx="0" cy="8" rx="3.2" ry="4" fill="#5C4533" opacity="0.75"/>
    </g>
    <!-- Shoe print 5 near door sill -->
    <g transform="translate(85, 565) rotate(65)">
      <ellipse cx="0" cy="0" rx="4" ry="8.5" fill="#5C4533" opacity="0.7"/>
      <ellipse cx="0" cy="7.5" rx="3" ry="3.8" fill="#5C4533" opacity="0.7"/>
    </g>
  </g>

  <!-- ==============================================
       HOTSPOT 9: c1_backdoor_lock (18%, 72% -> x:70.2, y:504)
       Heavy Camphor Wood Back Door Ajar & Broken Slide Bolt
       ============================================== -->
  <g id="art_c1_backdoor" transform="translate(15, 430)">
    <!-- Doorway granite quoin jamb -->
    <rect x="0" y="0" width="85" height="180" fill="#24282B" stroke="#1F1B16" stroke-width="2.5"/>
    <!-- Glimpse of dark cobbled alley outside with rain sheen -->
    <rect x="6" y="6" width="73" height="168" fill="#171A1C"/>
    <!-- Cobalt blue alley paving lines -->
    <line x1="10" y1="80" x2="40" y2="80" stroke="#34434D" stroke-width="1.2"/>
    <line x1="20" y1="120" x2="50" y2="120" stroke="#34434D" stroke-width="1.2"/>

    <!-- Door Leaf opened inward -->
    <polygon points="6,6 45,28 45,178 6,174" fill="#4A3423" stroke="#1F1B16" stroke-width="2"/>
    <!-- Iron strapping across door planks -->
    <line x1="6" y1="35" x2="45" y2="52" stroke="#1F1B16" stroke-width="2.5"/>
    <line x1="6" y1="125" x2="45" y2="142" stroke="#1F1B16" stroke-width="2.5"/>
    <!-- Heavy Cast-Iron Slide Bolt Broken (c1_backdoor_lock) -->
    <rect x="35" y="70" width="16" height="8" fill="#1F1B16" stroke="#8A9297" stroke-width="1"/>
    <line x1="42" y1="74" x2="56" y2="74" stroke="#8A9297" stroke-width="2.5"/>
    <!-- Broken keeper on jamb -->
    <rect x="56" y="68" width="6" height="12" fill="#1F1B16" stroke="#8A9297" stroke-width="1"/>
    <!-- Dropped pearl earring near threshold -->
    <circle cx="52" cy="155" r="3" fill="#FAF6EE" stroke="#1F1B16" stroke-width="0.8"/>
  </g>

  <!-- ==============================================
       HOTSPOT 12: c1_pot_plant (32%, 84% -> x:124.8, y:588)
       Glazed Ceramic Planter & Overturned Soil
       ============================================== -->
  <g id="art_c1_pot_plant" transform="translate(100, 540)">
    <!-- Spilled dark potting soil -->
    <ellipse cx="28" cy="52" rx="22" ry="9" fill="#3D2B1F" stroke="#1F1B16" stroke-width="0.8"/>
    <!-- Spilled soil pebbles -->
    <circle cx="38" cy="50" r="2" fill="#6E533C"/>
    <circle cx="18" cy="54" r="2.5" fill="#503D2C"/>
    <circle cx="28" cy="56" r="1.8" fill="#6E533C"/>
    <!-- Glazed celadon earthenware flower pot tilted -->
    <polygon points="12,18 42,18 36,48 18,48" fill="#4F6F5F" stroke="#1F1B16" stroke-width="1.8"/>
    <!-- Pot rim -->
    <ellipse cx="27" cy="18" rx="16" ry="5" fill="#688F7D" stroke="#1F1B16" stroke-width="1.5"/>
    <!-- Evergreen broadleaf foliage -->
    <path d="M22 18 Q10 -2 4 10 Q14 16 22 18 Z" fill="#2E4A38" stroke="#1F1B16" stroke-width="1.2"/>
    <path d="M27 18 Q27 -10 32 4 Q30 14 27 18 Z" fill="#3B5E48" stroke="#1F1B16" stroke-width="1.2"/>
    <path d="M30 18 Q46 -4 48 8 Q38 16 30 18 Z" fill="#243D2E" stroke="#1F1B16" stroke-width="1.2"/>
    <path d="M24 18 Q16 6 12 18 Z" fill="#4F6F5F" stroke="#1F1B16" stroke-width="1"/>
  </g>

  <!-- Overall Archival Paper Border & Vignette Frame -->
  <rect x="1" y="1" width="388" height="698" fill="none" stroke="#1F1B16" stroke-width="2"/>
  <rect x="4" y="4" width="382" height="692" fill="none" stroke="#9A3B2C" stroke-width="0.8" opacity="0.6"/>
</svg>'''

def create_case2_pier():
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 390 700" width="100%" height="100%" class="case-scene-svg">
  <defs>
    <!-- Midnight Harbour Sky Gradient -->
    <linearGradient id="c2_skyWash" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#19222B"/>
      <stop offset="45%" stop-color="#2D3A47"/>
      <stop offset="75%" stop-color="#4A5866"/>
      <stop offset="100%" stop-color="#7D8D9C"/>
    </linearGradient>
    <!-- Deep Tidal Water Gradient -->
    <linearGradient id="c2_waterWash" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#23353D"/>
      <stop offset="50%" stop-color="#2E464F"/>
      <stop offset="100%" stop-color="#1B2930"/>
    </linearGradient>
    <linearGradient id="c2_quayStone" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#8C8173"/>
      <stop offset="100%" stop-color="#5E554B"/>
    </linearGradient>
    <radialGradient id="c2_lanternGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFEBB0" stop-opacity="0.9"/>
      <stop offset="50%" stop-color="#E8C372" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#19222B" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Deep Midnight Sky -->
  <rect width="390" height="340" fill="url(#c2_skyWash)"/>

  <!-- Distant Taipa Island Ridge Silhouette Across Tidal Channel -->
  <path d="M0 160 Q80 135 180 148 T390 142 L390 240 L0 240 Z" fill="#1C2730" opacity="0.75"/>
  <path d="M50 170 Q140 152 240 160 T390 155 L390 240 L50 240 Z" fill="#273642" opacity="0.6"/>

  <!-- Guia Lighthouse Beam cutting across harbour haze -->
  <polygon points="360,110 0,60 0,90" fill="#FFF8E0" opacity="0.12"/>
  <polygon points="360,110 0,110 0,135" fill="#FFF8E0" opacity="0.08"/>

  <!-- Deep Harbour Water (Horizon at y:220) -->
  <rect x="0" y="220" width="390" height="480" fill="url(#c2_waterWash)"/>

  <!-- Water Surface Reflections & Rhythmic Ink Ripples -->
  <g stroke="#FAF6EE" stroke-width="0.8" opacity="0.35" fill="none">
    <path d="M20 235 Q60 232 100 235 T180 235 T260 235 T340 235"/>
    <path d="M5 250 Q45 248 85 250 T165 250 T245 250 T325 250 T385 250"/>
    <path d="M30 270 Q80 266 130 270 T230 270 T330 270"/>
    <path d="M10 295 Q60 291 110 295 T210 295 T310 295"/>
    <path d="M40 330 Q90 326 140 330 T240 330 T340 330"/>
    <path d="M15 375 Q65 370 115 375 T215 375 T315 375"/>
    <path d="M50 430 Q110 425 170 430 T290 430"/>
  </g>

  <!-- ==============================================
       HOTSPOT 3: c2_tide_clock (22%, 26% -> x:85.8, y:182)
       Victorian Stone Sentry Cabin & Brass Tide Clock
       ============================================== -->
  <g id="art_c2_tide_cabin" transform="translate(40, 110)">
    <!-- Cabin Roof (Pyramidal tiled roof) -->
    <polygon points="10,40 50,5 90,40" fill="#3D291E" stroke="#1F1B16" stroke-width="2"/>
    <line x1="50" y1="5" x2="50" y2="40" stroke="#1F1B16" stroke-width="1.5"/>
    <!-- Granite block walls -->
    <rect x="15" y="40" width="70" height="95" fill="#756C5E" stroke="#1F1B16" stroke-width="2"/>
    <!-- Masonry course lines -->
    <g stroke="#4A443A" stroke-width="0.8">
      <line x1="15" y1="60" x2="85" y2="60"/>
      <line x1="15" y1="80" x2="85" y2="80"/>
      <line x1="15" y1="100" x2="85" y2="100"/>
      <line x1="15" y1="120" x2="85" y2="120"/>
    </g>
    <!-- Brass Tide Clock (c2_tide_clock) -->
    <circle cx="50" cy="72" r="16" fill="#C49B4B" stroke="#1F1B16" stroke-width="2"/>
    <circle cx="50" cy="72" r="12" fill="#FAF6EE" stroke="#1F1B16" stroke-width="1"/>
    <!-- Clock face markings & hands (reading High Tide at 20:30) -->
    <circle cx="50" cy="72" r="1.5" fill="#1F1B16"/>
    <line x1="50" y1="72" x2="50" y2="63" stroke="#9A3B2C" stroke-width="1.5"/>
    <line x1="50" y1="72" x2="57" y2="76" stroke="#1F1B16" stroke-width="1.2"/>
    <text x="50" y="63" font-size="3" font-family="sans-serif" font-weight="bold" text-anchor="middle" fill="#1F1B16">H</text>
    <text x="50" y="83" font-size="3" font-family="sans-serif" font-weight="bold" text-anchor="middle" fill="#1F1B16">L</text>
    <!-- Observation window with iron grille -->
    <rect x="35" y="96" width="30" height="30" fill="#242C33" stroke="#1F1B16" stroke-width="1.5"/>
    <line x1="50" y1="96" x2="50" y2="126" stroke="#1F1B16" stroke-width="1.2"/>
    <line x1="35" y1="111" x2="65" y2="111" stroke="#1F1B16" stroke-width="1.2"/>
  </g>

  <!-- ==============================================
       HOTSPOT 2: c2_cargo_crane (78%, 32% -> x:304.2, y:224)
       Victorian Hand-Cranked Lattice Cargo Crane
       ============================================== -->
  <g id="art_c2_crane" transform="translate(260, 140)">
    <!-- Heavy cast-iron pedestal turntable base -->
    <rect x="30" y="140" width="40" height="30" fill="#2D3338" stroke="#1F1B16" stroke-width="2"/>
    <ellipse cx="50" cy="140" rx="20" ry="6" fill="#424B52" stroke="#1F1B16" stroke-width="1.5"/>
    <!-- Large Hand-crank Spoke Gears -->
    <circle cx="40" cy="125" r="14" fill="none" stroke="#C49B4B" stroke-width="2"/>
    <circle cx="40" cy="125" r="4" fill="#C49B4B" stroke="#1F1B16" stroke-width="1"/>
    <!-- Gear spokes -->
    <line x1="26" y1="125" x2="54" y2="125" stroke="#C49B4B" stroke-width="1.2"/>
    <line x1="40" y1="111" x2="40" y2="139" stroke="#C49B4B" stroke-width="1.2"/>
    <!-- Pinion gear -->
    <circle cx="56" cy="118" r="7" fill="none" stroke="#8A9297" stroke-width="1.5"/>
    <!-- Crane A-Frame Mast -->
    <line x1="45" y1="140" x2="40" y2="20" stroke="#1F1B16" stroke-width="3"/>
    <line x1="55" y1="140" x2="44" y2="20" stroke="#1F1B16" stroke-width="3"/>
    <!-- Lattice Jib Boom extending over water (leftwards & downwards) -->
    <line x1="42" y1="20" x2="-25" y2="110" stroke="#1F1B16" stroke-width="2.5"/>
    <line x1="42" y1="35" x2="-25" y2="110" stroke="#1F1B16" stroke-width="2.5"/>
    <!-- Lattice bracing struts -->
    <g stroke="#1F1B16" stroke-width="1">
      <line x1="30" y1="35" x2="25" y2="48"/>
      <line x1="18" y1="52" x2="10" y2="65"/>
      <line x1="3" y1="72" x2="-8" y2="86"/>
      <line x1="-15" y1="94" x2="-23" y2="105"/>
    </g>
    <!-- Pulley wheel at jib tip -->
    <circle cx="-25" cy="110" r="4.5" fill="#8A9297" stroke="#1F1B16" stroke-width="1.2"/>
    <!-- Steel Cable & Heavy Hoist Hook -->
    <line x1="-25" y1="114" x2="-25" y2="155" stroke="#1F1B16" stroke-width="1.5"/>
    <path d="M-28 155 Q-28 165 -23 165 Q-18 165 -20 157" fill="none" stroke="#C49B4B" stroke-width="2.2"/>
    <!-- Counterweight box behind mast -->
    <rect x="55" y="110" width="22" height="24" fill="#3A4045" stroke="#1F1B16" stroke-width="1.5"/>
  </g>

  <!-- ==============================================
       HOTSPOT 4: c2_junk_boat (75%, 52% -> x:292.5, y:364)
       Double-Masted Trading Junk "Tai Sing" (泰昇號)
       ============================================== -->
  <g id="art_c2_junk_boat" transform="translate(210, 240)">
    <!-- Water wake around wooden hull -->
    <path d="M-10 160 Q80 185 170 148 L155 130 Q70 165 -5 140 Z" fill="#1B2930" opacity="0.6"/>
    <!-- Curved Teak Carvel Hull in 3/4 naval perspective -->
    <path d="M0 142 Q75 168 160 132 L150 105 Q70 135 15 115 Z" fill="#4A3423" stroke="#1F1B16" stroke-width="2.5"/>
    <!-- Hull strake lines (planking) -->
    <path d="M5 125 Q70 145 153 118" stroke="#332417" stroke-width="1.2" fill="none"/>
    <path d="M10 134 Q75 155 156 126" stroke="#332417" stroke-width="1.2" fill="none"/>
    <!-- High Poop Deck & Stern Tumblehome -->
    <polygon points="135,108 160,100 160,132 135,138" fill="#5C422C" stroke="#1F1B16" stroke-width="1.5"/>
    <!-- Dragon Eye Badge (大眼雞) on Bow -->
    <ellipse cx="25" cy="126" rx="6" ry="5" fill="#FAF6EE" stroke="#1F1B16" stroke-width="1.2"/>
    <circle cx="26" cy="126" r="2.5" fill="#1F1B16"/>
    <!-- "泰昇" Gold Name Plaque on Stern -->
    <rect x="138" y="104" width="18" height="8" fill="#9A3B2C" stroke="#1F1B16" stroke-width="0.8"/>
    <text x="147" y="111" font-size="5" font-family="'Noto Serif CJK TC', serif" font-weight="bold" fill="#C49B4B" text-anchor="middle">泰昇</text>

    <!-- Main Mast & Bamboo-Battened Sail -->
    <line x1="85" y1="20" x2="85" y2="135" stroke="#1F1B16" stroke-width="3"/>
    <!-- Pleated battened fan sail furled on boom -->
    <polygon points="85,35 140,55 135,115 85,105" fill="#822E22" stroke="#1F1B16" stroke-width="1.5" opacity="0.9"/>
    <!-- Bamboo Battens across sail -->
    <line x1="85" y1="50" x2="139" y2="68" stroke="#C49B4B" stroke-width="1.2"/>
    <line x1="85" y1="68" x2="138" y2="82" stroke="#C49B4B" stroke-width="1.2"/>
    <line x1="85" y1="85" x2="137" y2="98" stroke="#C49B4B" stroke-width="1.2"/>
    <line x1="85" y1="102" x2="136" y2="112" stroke="#C49B4B" stroke-width="1.2"/>
    <!-- Fore Mast & Rigging -->
    <line x1="35" y1="45" x2="35" y2="125" stroke="#1F1B16" stroke-width="2.2"/>
    <polygon points="35,55 75,70 72,110 35,102" fill="#9A3B2C" stroke="#1F1B16" stroke-width="1.2" opacity="0.85"/>
    <!-- Shrouds & Running Rigging -->
    <line x1="85" y1="20" x2="15" y2="118" stroke="#1F1B16" stroke-width="0.8" opacity="0.75"/>
    <line x1="85" y1="20" x2="155" y2="108" stroke="#1F1B16" stroke-width="0.8" opacity="0.75"/>
  </g>

  <!-- Left Foreground Granite Pier Apron & Seawall -->
  <polygon points="0,310 145,310 145,700 0,700" fill="url(#c2_quayStone)" stroke="#1F1B16" stroke-width="2.5"/>
  <!-- Heavy Granite Curb stones on pier edge -->
  <g stroke="#1F1B16" stroke-width="1.2" fill="#6E6559">
    <rect x="130" y="310" width="15" height="30"/>
    <rect x="130" y="340" width="15" height="35"/>
    <rect x="130" y="375" width="15" height="35"/>
    <rect x="130" y="410" width="15" height="35"/>
    <rect x="130" y="445" width="15" height="35"/>
    <rect x="130" y="480" width="15" height="35"/>
    <rect x="130" y="515" width="15" height="35"/>
    <rect x="130" y="550" width="15" height="35"/>
    <rect x="130" y="585" width="15" height="35"/>
    <rect x="130" y="620" width="15" height="35"/>
    <rect x="130" y="655" width="15" height="45"/>
  </g>

  <!-- ==============================================
       HOTSPOT 8: c2_noodle_cart (18%, 48% -> x:70.2, y:336)
       Nighttime Wonton Noodle Pushcart with Steam
       ============================================== -->
  <g id="art_c2_noodle_cart" transform="translate(30, 290)">
    <!-- Spoked Wooden Cart Wheels -->
    <circle cx="25" cy="85" r="18" fill="none" stroke="#1F1B16" stroke-width="2.5"/>
    <circle cx="25" cy="85" r="4" fill="#3D291E" stroke="#1F1B16" stroke-width="1.5"/>
    <line x1="7" y1="85" x2="43" y2="85" stroke="#1F1B16" stroke-width="1.2"/>
    <line x1="25" y1="67" x2="25" y2="103" stroke="#1F1B16" stroke-width="1.2"/>
    <line x1="12" y1="72" x2="38" y2="98" stroke="#1F1B16" stroke-width="1.2"/>
    <line x1="12" y1="98" x2="38" y2="72" stroke="#1F1B16" stroke-width="1.2"/>
    <!-- Wooden Cart Chest -->
    <rect x="5" y="35" width="65" height="45" fill="#684D35" stroke="#1F1B16" stroke-width="2"/>
    <!-- Broth Cauldron & Charcoal Stove -->
    <rect x="12" y="30" width="28" height="15" fill="#4A4E52" stroke="#1F1B16" stroke-width="1.5"/>
    <!-- Glowing orange coal embers -->
    <rect x="16" y="40" width="20" height="5" fill="#D35400"/>
    <!-- Steaming Hot Pot with Broth -->
    <ellipse cx="26" cy="30" rx="12" ry="4" fill="#C49B4B" stroke="#1F1B16" stroke-width="1.2"/>
    <!-- Steam wisps -->
    <path d="M22 25 Q18 15 22 8 Q26 0 22 -6" stroke="#FAF6EE" stroke-width="1.2" fill="none" opacity="0.6"/>
    <path d="M28 25 Q32 16 28 9 Q24 2 28 -5" stroke="#FAF6EE" stroke-width="1.2" fill="none" opacity="0.6"/>
    <!-- Stood Canvas Canopy & Uprights -->
    <line x1="8" y1="35" x2="8" y2="0" stroke="#1F1B16" stroke-width="1.5"/>
    <line x1="68" y1="35" x2="68" y2="0" stroke="#1F1B16" stroke-width="1.5"/>
    <polygon points="2,0 74,-5 72,-15 4,-12" fill="#D9CBB5" stroke="#1F1B16" stroke-width="1.5"/>
    <!-- Hanging Brass Kerosene Lantern -->
    <circle cx="58" cy="8" r="16" fill="url(#c2_lanternGlow)"/>
    <line x1="58" y1="-3" x2="58" y2="5" stroke="#1F1B16" stroke-width="1"/>
    <rect x="53" y="5" width="10" height="12" fill="#E8C372" stroke="#1F1B16" stroke-width="1.2"/>
    <!-- Stacked bowls & bamboo chopsticks -->
    <ellipse cx="50" cy="34" rx="5" ry="2" fill="#FAF6EE" stroke="#1F1B16" stroke-width="0.8"/>
    <ellipse cx="50" cy="32" rx="5" ry="2" fill="#FAF6EE" stroke="#1F1B16" stroke-width="0.8"/>
  </g>

  <!-- ==============================================
       HOTSPOT 11: c2_cigarette_ends (32%, 52% -> x:124.8, y:364)
       Wet Navy Cut Cigarette Butts on Pier Edge
       ============================================== -->
  <g id="art_c2_cigarettes" transform="translate(115, 355)">
    <!-- Wet stains on stone -->
    <ellipse cx="10" cy="10" rx="12" ry="6" fill="#4A443A" opacity="0.5"/>
    <!-- Cigarette butt 1 -->
    <line x1="4" y1="8" x2="10" y2="6" stroke="#FAF6EE" stroke-width="1.8"/>
    <line x1="10" y1="6" x2="12" y2="5" stroke="#D35400" stroke-width="1.8"/>
    <!-- Cigarette butt 2 -->
    <line x1="8" y1="12" x2="14" y2="14" stroke="#FAF6EE" stroke-width="1.8"/>
    <line x1="14" y1="14" x2="16" y2="15" stroke="#D35400" stroke-width="1.8"/>
    <!-- Matchstick -->
    <line x1="3" y1="14" x2="9" y2="15" stroke="#8C7355" stroke-width="1"/>
    <circle cx="3" cy="14" r="1" fill="#1F1B16"/>
  </g>

  <!-- ==============================================
       HOTSPOT 12: c2_rope_cut (68%, 48% -> x:265.2, y:336)
       Pier Iron Mooring Bollard & Clean-Cut Hemp Rope
       ============================================== -->
  <g id="art_c2_rope_cut" transform="translate(245, 310)">
    <!-- Granite mooring post foundation -->
    <polygon points="10,35 38,35 44,45 4,45" fill="#5E554B" stroke="#1F1B16" stroke-width="1.5"/>
    <!-- Cast-Iron T-Head Mooring Bollard -->
    <rect x="18" y="15" width="12" height="22" fill="#2E3338" stroke="#1F1B16" stroke-width="2"/>
    <ellipse cx="24" cy="15" rx="12" ry="5" fill="#424B52" stroke="#1F1B16" stroke-width="1.5"/>
    <!-- Coiled braided hawser on bollard -->
    <ellipse cx="24" cy="24" rx="14" ry="6" fill="none" stroke="#C49B4B" stroke-width="3"/>
    <!-- Trailing severed rope with razor-sharp cut end -->
    <path d="M28 26 Q42 32 50 48" stroke="#C49B4B" stroke-width="3.2" fill="none"/>
    <!-- Clean flat cross-section of severed rope (c2_rope_cut) -->
    <ellipse cx="50" cy="48" rx="3.5" ry="2" fill="#E8DEC8" stroke="#1F1B16" stroke-width="1"/>
    <line x1="48" y1="48" x2="52" y2="48" stroke="#9A3B2C" stroke-width="1"/>
  </g>

  <!-- ==============================================
       HOTSPOT 5: c2_pontoon (42%, 58% -> x:163.8, y:406)
       HOTSPOT 10: c2_dossier_box (58%, 60% -> x:226.2, y:420)
       Floating Timber Pontoon Barge & Watertight Dispatch Box
       ============================================== -->
  <g id="art_c2_pontoon" transform="translate(140, 370)">
    <!-- Steel Gangway spanning from Pier to Pontoon -->
    <polygon points="-10,20 30,30 30,42 -10,32" fill="#5A6369" stroke="#1F1B16" stroke-width="1.8"/>
    <!-- Gangway diamond tread & stanchion handrails -->
    <line x1="-10" y1="12" x2="30" y2="22" stroke="#1F1B16" stroke-width="1.5"/>
    <line x1="0" y1="15" x2="0" y2="24" stroke="#1F1B16" stroke-width="1"/>
    <line x1="18" y1="19" x2="18" y2="28" stroke="#1F1B16" stroke-width="1"/>

    <!-- Heavy Floating Wooden Pontoon Deck -->
    <polygon points="15,35 150,35 140,75 5,75" fill="#5C4533" stroke="#1F1B16" stroke-width="2.5"/>
    <!-- Pontoon deck wood planks -->
    <g stroke="#3D2B1F" stroke-width="1">
      <line x1="20" y1="42" x2="145" y2="42"/>
      <line x1="16" y1="50" x2="142" y2="50"/>
      <line x1="12" y1="58" x2="138" y2="58"/>
      <line x1="8" y1="66" x2="135" y2="66"/>
    </g>
    <!-- Black Rubber Fender Tires hanging off Pontoon Edge -->
    <ellipse cx="25" cy="74" rx="8" ry="6" fill="#1F1B16" stroke="#4A5259" stroke-width="1.5"/>
    <ellipse cx="65" cy="74" rx="8" ry="6" fill="#1F1B16" stroke="#4A5259" stroke-width="1.5"/>
    <ellipse cx="105" cy="74" rx="8" ry="6" fill="#1F1B16" stroke="#4A5259" stroke-width="1.5"/>

    <!-- Waterproof Tin Dossier Box wedged between timber pilings (c2_dossier_box at 58%, 60%) -->
    <g transform="translate(78, 44)">
      <!-- Black tarpaulin oilcloth wrap -->
      <polygon points="0,5 24,0 32,16 6,22" fill="#242628" stroke="#1F1B16" stroke-width="1.5"/>
      <!-- Sealed metal dispatch tin corner showing -->
      <polygon points="8,4 22,0 26,8 12,12" fill="#8C969E" stroke="#1F1B16" stroke-width="1"/>
      <circle cx="16" cy="6" r="2" fill="#9A3B2C"/>
      <!-- Hemp lashings binding box -->
      <line x1="4" y1="14" x2="28" y2="7" stroke="#C49B4B" stroke-width="1.2"/>
    </g>
  </g>

  <!-- ==============================================
       HOTSPOT 1: c2_victim (50%, 65% -> x:195, y:455)
       Floating Victim Leung Ah-sei in Tidal Sluice
       ============================================== -->
  <g id="art_c2_victim" transform="translate(160, 435)">
    <!-- Tidal swirl & water foam around body -->
    <ellipse cx="38" cy="20" rx="35" ry="14" fill="#2E464F" stroke="#FAF6EE" stroke-width="0.8" stroke-dasharray="8 6"/>
    <ellipse cx="38" cy="20" rx="26" ry="9" fill="#1F3038" opacity="0.8"/>

    <!-- Floating Drowned Coolie Body (Prone in water) -->
    <!-- Denim / Homespun coarse indigo tunic -->
    <ellipse cx="36" cy="18" rx="22" ry="11" fill="#354B5E" stroke="#1F1B16" stroke-width="1.8"/>
    <!-- Fabric folds & wet water sheen -->
    <path d="M20 18 Q35 12 50 18" stroke="#1F1B16" stroke-width="1.2" fill="none"/>
    <!-- Head submerged in water with black queue/hair -->
    <ellipse cx="14" cy="16" rx="9" ry="8" fill="#B8A38B" stroke="#1F1B16" stroke-width="1.2"/>
    <path d="M8 14 Q14 8 20 12 Q14 20 8 14 Z" fill="#1F1B16"/>
    <!-- Rolled-up canvas trousers & bare feet in water -->
    <path d="M54 18 L70 24" stroke="#485A69" stroke-width="6" stroke-linecap="round"/>
    <ellipse cx="73" cy="25" rx="3.5" ry="2.5" fill="#B8A38B" stroke="#1F1B16" stroke-width="0.8"/>
    <!-- Tied hemp waist rope (coolie belt) with brass token -->
    <line x1="32" y1="12" x2="34" y2="26" stroke="#C49B4B" stroke-width="1.5"/>
    <circle cx="33" cy="27" r="2.5" fill="#C49B4B" stroke="#1F1B16" stroke-width="0.6"/>
  </g>

  <!-- ==============================================
       HOTSPOT 6: c2_police_boat (25%, 68% -> x:97.5, y:476)
       Water Police Patrol Launch No. 1
       ============================================== -->
  <g id="art_c2_police_boat" transform="translate(35, 430)">
    <!-- Launch wake & bubbling exhaust foam -->
    <path d="M-10 65 Q60 85 130 55" stroke="#FAF6EE" stroke-width="1.5" fill="none" opacity="0.7"/>
    <!-- Wooden Patrol Launch Hull -->
    <path d="M5 55 Q65 72 125 45 L120 32 Q60 48 10 40 Z" fill="#2E3B44" stroke="#1F1B16" stroke-width="2"/>
    <!-- White Waterline boot-topping stripe -->
    <path d="M8 48 Q65 62 122 38" stroke="#FAF6EE" stroke-width="1.8" fill="none"/>
    <!-- Varnished Teak Wheelhouse Cabin -->
    <polygon points="40,38 85,32 85,15 42,18" fill="#6E4F38" stroke="#1F1B16" stroke-width="1.5"/>
    <!-- Cabin Glass Windows -->
    <rect x="46" y="20" width="14" height="10" fill="#9EC5D6" stroke="#1F1B16" stroke-width="1"/>
    <rect x="65" y="19" width="14" height="10" fill="#9EC5D6" stroke="#1F1B16" stroke-width="1"/>
    <!-- Polished Brass Searchlight on Wheelhouse Roof -->
    <circle cx="55" cy="12" r="5" fill="#C49B4B" stroke="#1F1B16" stroke-width="1.2"/>
    <line x1="55" y1="17" x2="55" y2="15" stroke="#1F1B16" stroke-width="1.5"/>
    <!-- Portuguese En-sign on Stern -->
    <line x1="115" y1="34" x2="115" y2="18" stroke="#1F1B16" stroke-width="1"/>
    <polygon points="115,18 128,22 115,26" fill="#9A3B2C"/>
  </g>

  <!-- ==============================================
       HOTSPOT 7: c2_warehouse_door (80%, 74% -> x:312, y:518)
       Tai Sing Trading Warehouse Corrugated Door
       ============================================== -->
  <g id="art_c2_warehouse" transform="translate(265, 460)">
    <!-- Corrugated Steel Wall -->
    <rect x="0" y="0" width="125" height="180" fill="#636E75" stroke="#1F1B16" stroke-width="2.5"/>
    <!-- Corrugated Iron Ribs -->
    <g stroke="#3D454A" stroke-width="1">
      <line x1="12" y1="0" x2="12" y2="180"/>
      <line x1="24" y1="0" x2="24" y2="180"/>
      <line x1="36" y1="0" x2="36" y2="180"/>
      <line x1="48" y1="0" x2="48" y2="180"/>
      <line x1="60" y1="0" x2="60" y2="180"/>
      <line x1="72" y1="0" x2="72" y2="180"/>
      <line x1="84" y1="0" x2="84" y2="180"/>
      <line x1="96" y1="0" x2="96" y2="180"/>
      <line x1="108" y1="0" x2="108" y2="180"/>
    </g>
    <!-- Stencilled Sign: 泰盛貿易行 棧房 -->
    <rect x="15" y="15" width="85" height="24" fill="#242C33" stroke="#1F1B16" stroke-width="1.2"/>
    <text x="57" y="32" font-size="9" font-family="'Noto Serif CJK TC', serif" font-weight="bold" fill="#FAF6EE" text-anchor="middle" letter-spacing="2">泰盛行貨倉</text>
    <!-- Steel Rolling Shutter Half Open (c2_warehouse_door at 80%, 74%) -->
    <rect x="15" y="50" width="85" height="120" fill="#171C20" stroke="#1F1B16" stroke-width="2"/>
    <!-- Slat lines on rolling door -->
    <g stroke="#8A9297" stroke-width="1.2">
      <line x1="15" y1="58" x2="100" y2="58"/>
      <line x1="15" y1="68" x2="100" y2="68"/>
      <line x1="15" y1="78" x2="100" y2="78"/>
      <line x1="15" y1="88" x2="100" y2="88"/>
      <line x1="15" y1="98" x2="100" y2="98"/>
    </g>
    <!-- Heavy Brass Padlock Hasp Pried Open -->
    <rect x="52" y="98" width="12" height="18" fill="#C49B4B" stroke="#1F1B16" stroke-width="1.2"/>
    <path d="M55 98 L55 92 Q58 88 61 92 L61 98" fill="none" stroke="#C49B4B" stroke-width="2"/>
  </g>

  <!-- ==============================================
       HOTSPOT 9: c2_slipway (48%, 78% -> x:187.2, y:546)
       Green-Algae Stone Slipway Ramp
       ============================================== -->
  <g id="art_c2_slipway" transform="translate(130, 520)">
    <!-- Sloping Stone Ramp descending into water -->
    <polygon points="0,0 120,0 100,100 -20,100" fill="#4A453A" stroke="#1F1B16" stroke-width="1.8"/>
    <!-- Heavy Granite Blocks -->
    <g stroke="#1F1B16" stroke-width="1">
      <line x1="-5" y1="25" x2="115" y2="25"/>
      <line x1="-10" y1="50" x2="110" y2="50"/>
      <line x1="-15" y1="75" x2="105" y2="75"/>
    </g>
    <!-- Slippery Green Algae & Seaweed Patches (c2_slipway) -->
    <path d="M20 25 Q35 15 50 25 T80 25 L85 65 Q60 75 40 65 Z" fill="#3B5A40" opacity="0.8"/>
    <path d="M30 45 Q50 35 70 45 T95 45 L90 85 Q70 95 45 85 Z" fill="#243D28" opacity="0.85"/>
    <!-- Water lapping onto mossy stones -->
    <path d="M-10 65 Q35 58 80 65 T120 65" stroke="#FAF6EE" stroke-width="1.2" fill="none" opacity="0.65"/>
  </g>

  <!-- Overall Archival Paper Border & Vignette Frame -->
  <rect x="1" y="1" width="388" height="698" fill="none" stroke="#1F1B16" stroke-width="2"/>
  <rect x="4" y="4" width="382" height="692" fill="none" stroke="#9A3B2C" stroke-width="0.8" opacity="0.6"/>
</svg>'''

def create_case3_theatre():
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 390 700" width="100%" height="100%" class="case-scene-svg">
  <defs>
    <!-- Backstage Warm Lamplight & Velvet Ambient -->
    <linearGradient id="c3_theatreWall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#241B18"/>
      <stop offset="50%" stop-color="#3D2922"/>
      <stop offset="100%" stop-color="#241B18"/>
    </linearGradient>
    <radialGradient id="c3_vanityGlow" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#FFF8E0" stop-opacity="0.9"/>
      <stop offset="45%" stop-color="#E8C372" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#241B18" stop-opacity="0"/>
    </radialGradient>
    <!-- Velvet Curtain Shadow -->
    <linearGradient id="c3_curtainVelvet" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#4A1410"/>
      <stop offset="30%" stop-color="#822018"/>
      <stop offset="70%" stop-color="#9A2B20"/>
      <stop offset="100%" stop-color="#3A0D0A"/>
    </linearGradient>
    <!-- Floral Stage Carpet Pattern -->
    <pattern id="c3_carpet" width="30" height="30" patternUnits="userSpaceOnUse">
      <rect width="30" height="30" fill="#6A1C16"/>
      <circle cx="15" cy="15" r="8" fill="#8C2B22"/>
      <path d="M15 5 Q20 15 15 25 Q10 15 15 5 Z" fill="#C49B4B" opacity="0.4"/>
      <path d="M5 15 Q15 20 25 15 Q15 10 5 15 Z" fill="#C49B4B" opacity="0.4"/>
    </pattern>
  </defs>

  <!-- Deep Theatrical Timber Wall -->
  <rect width="390" height="700" fill="url(#c3_theatreWall)"/>

  <!-- Timber Wall Paneling Hatching -->
  <g stroke="#1F1512" stroke-width="1.2">
    <line x1="70" y1="0" x2="70" y2="450"/>
    <line x1="140" y1="0" x2="140" y2="450"/>
    <line x1="210" y1="0" x2="210" y2="450"/>
    <line x1="280" y1="0" x2="280" y2="450"/>
    <!-- Horizontal batten rails -->
    <line x1="0" y1="80" x2="390" y2="80"/>
    <line x1="0" y1="180" x2="390" y2="180"/>
  </g>

  <!-- Fly Grid Loft (Top Rigging, Pulleys & Sandbags) -->
  <rect x="0" y="0" width="390" height="70" fill="#1A120E" stroke="#1F1B16" stroke-width="2"/>
  <g stroke="#1F1B16" stroke-width="1.5">
    <!-- Hanging Hemp Ropes & Pulleys -->
    <line x1="45" y1="0" x2="45" y2="65" stroke="#C49B4B" stroke-width="1.2"/>
    <circle cx="45" cy="65" r="5" fill="#8A9297"/>
    <line x1="110" y1="0" x2="110" y2="55" stroke="#C49B4B" stroke-width="1.2"/>
    <circle cx="110" cy="55" r="5" fill="#8A9297"/>
    <line x1="250" y1="0" x2="250" y2="60" stroke="#C49B4B" stroke-width="1.2"/>
    <circle cx="250" cy="60" r="5" fill="#8A9297"/>
    <!-- Suspended Sandbag Counterweight -->
    <ellipse cx="280" cy="50" rx="9" ry="14" fill="#755E46" stroke="#1F1B16" stroke-width="1.2"/>
    <line x1="280" y1="0" x2="280" y2="36" stroke="#C49B4B" stroke-width="1.5"/>
  </g>

  <!-- Rich Backstage Stage Carpet (Floor from y:430 down) -->
  <polygon points="0,430 390,430 390,700 0,700" fill="url(#c3_carpet)" stroke="#1F1B16" stroke-width="2"/>

  <!-- ==============================================
       HOTSPOT 8: c3_playbill (32%, 26% -> x:124.8, y:182)
       Cantonese Opera Performance Playbill 《梁祝殉情》
       ============================================== -->
  <g id="art_c3_playbill" transform="translate(100, 130)">
    <!-- Weathered Parchment Poster with curled corner -->
    <polygon points="0,0 52,0 52,85 0,85" fill="#E8DEC8" stroke="#1F1B16" stroke-width="1.5"/>
    <polygon points="44,77 52,77 52,85" fill="#D3C5AE" stroke="#1F1B16" stroke-width="0.8"/>
    <!-- Vermilion Decorative Border -->
    <rect x="3" y="3" width="46" height="79" fill="none" stroke="#9A3B2C" stroke-width="1"/>
    <!-- Playbill Header -->
    <rect x="6" y="6" width="40" height="14" fill="#9A3B2C"/>
    <text x="26" y="16" font-size="7.5" font-family="'Noto Serif CJK TC', serif" font-weight="900" fill="#FAF6EE" text-anchor="middle">清平戲院</text>
    <!-- Show Title Vertical -->
    <text x="26" y="36" font-size="11" font-family="'Noto Serif CJK TC', serif" font-weight="900" fill="#1F1B16" text-anchor="middle">梁祝殉情</text>
    <!-- Star Name -->
    <text x="26" y="52" font-size="6.5" font-family="'Noto Serif CJK TC', serif" font-weight="bold" fill="#9A3B2C" text-anchor="middle">楚雲天 主演</text>
    <text x="26" y="62" font-size="4.5" font-family="'Noto Sans TC', sans-serif" fill="#5A4E3E" text-anchor="middle">壬寅年秋 · 特邀乾旦</text>
    <!-- Red Official Seal -->
    <rect x="20" y="68" width="12" height="10" fill="#9A3B2C" opacity="0.8"/>
  </g>

  <!-- ==============================================
       HOTSPOT 5: c3_stage_curtain (78%, 35% -> x:304.2, y:245)
       Heavy Crimson Velvet Stage Curtain with Gold Tassels
       ============================================== -->
  <g id="art_c3_curtain" transform="translate(250, 70)">
    <!-- Proscenium Arch Gold Molding -->
    <rect x="110" y="0" width="30" height="380" fill="#C49B4B" stroke="#1F1B16" stroke-width="2"/>
    <path d="M115 20 Q125 10 135 20 T135 60 T135 100" stroke="#8A6B29" stroke-width="1.2" fill="none"/>
    <!-- Heavy Velvet Fabric Drapes with Deep Shadow Folds -->
    <path d="M0 0 Q40 10 80 0 Q110 0 110 360 Q80 340 50 360 Q20 340 0 360 Z" fill="url(#c3_curtainVelvet)" stroke="#1F1B16" stroke-width="2"/>
    <!-- Deep vertical shadow folds -->
    <g stroke="#3A0D0A" stroke-width="3" opacity="0.8">
      <path d="M25 0 Q30 180 20 360"/>
      <path d="M55 0 Q65 180 50 360"/>
      <path d="M85 0 Q95 180 80 360"/>
    </g>
    <!-- Gold Cord Tie-Back & Tassel (c3_stage_curtain) -->
    <path d="M0 175 Q45 200 90 175" stroke="#C49B4B" stroke-width="3" fill="none"/>
    <!-- Braided Tassel -->
    <polygon points="50,190 55,220 45,220" fill="#C49B4B" stroke="#1F1B16" stroke-width="1"/>
    <!-- Gold fringe along curtain hem -->
    <g stroke="#C49B4B" stroke-width="1.2">
      <line x1="5" y1="360" x2="5" y2="368"/>
      <line x1="15" y1="360" x2="15" y2="368"/>
      <line x1="25" y1="360" x2="25" y2="368"/>
      <line x1="35" y1="360" x2="35" y2="368"/>
      <line x1="45" y1="360" x2="45" y2="368"/>
      <line x1="55" y1="360" x2="55" y2="368"/>
      <line x1="65" y1="360" x2="65" y2="368"/>
      <line x1="75" y1="360" x2="75" y2="368"/>
      <line x1="85" y1="360" x2="85" y2="368"/>
    </g>
  </g>

  <!-- ==============================================
       HOTSPOT 10: c3_wardrobe (16%, 40% -> x:62.4, y:280)
       Tall Rosewood Costume Wardrobe & Embroidered Robes
       ============================================== -->
  <g id="art_c3_wardrobe" transform="translate(15, 170)">
    <!-- Wardrobe Cabinet Body in perspective -->
    <polygon points="0,20 75,0 75,220 0,240" fill="#422E21" stroke="#1F1B16" stroke-width="2.2"/>
    <!-- Wardrobe open door swung out -->
    <polygon points="0,20 -15,40 -15,255 0,240" fill="#2E1F16" stroke="#1F1B16" stroke-width="2"/>
    <ellipse cx="-8" cy="140" rx="3" ry="5" fill="#C49B4B" stroke="#1F1B16" stroke-width="0.8"/>
    <!-- Hanging Silk Opera Robes inside wardrobe -->
    <g transform="translate(15, 30)">
      <!-- Gold embroidered dragon robe -->
      <path d="M5 25 L45 20 L50 160 L0 160 Z" fill="#C49B4B" stroke="#1F1B16" stroke-width="1.5"/>
      <path d="M12 40 Q25 35 38 40" stroke="#9A3B2C" stroke-width="1.5" fill="none"/>
      <!-- Cyan silk water-sleeve robe behind -->
      <path d="M15 22 L55 18 L55 155 L15 155 Z" fill="#2E6B66" stroke="#1F1B16" stroke-width="1.2"/>
      <!-- Phoenix headpiece on shelf -->
      <ellipse cx="28" cy="12" rx="12" ry="6" fill="#FAF6EE" stroke="#1F1B16" stroke-width="1"/>
      <circle cx="28" cy="10" r="3" fill="#4F6F5F"/>
    </g>
  </g>

  <!-- ==============================================
       HOTSPOT 7: c3_opium_lamp (30%, 46% -> x:117, y:322)
       Carved Stool, Brass Opium Pipe & Glass Oil Lamp
       ============================================== -->
  <g id="art_c3_opium_stool" transform="translate(95, 280)">
    <!-- Rosewood Corner Table -->
    <polygon points="5,25 45,25 50,42 0,42" fill="#5C3F2B" stroke="#1F1B16" stroke-width="1.5"/>
    <rect x="2" y="42" width="6" height="45" fill="#3D291C" stroke="#1F1B16" stroke-width="1.2"/>
    <rect x="42" y="42" width="6" height="45" fill="#3D291C" stroke="#1F1B16" stroke-width="1.2"/>
    <!-- Glass Chimney Opium Lamp (c3_opium_lamp) -->
    <rect x="18" y="24" width="12" height="6" fill="#C49B4B" stroke="#1F1B16" stroke-width="1"/>
    <!-- Glass chimney dome -->
    <path d="M19 24 Q18 12 24 8 Q30 12 29 24 Z" fill="#FAF6EE" stroke="#1F1B16" stroke-width="1" opacity="0.8"/>
    <!-- Tiny blue-and-gold flame -->
    <ellipse cx="24" cy="18" rx="2" ry="3.5" fill="#E8C372"/>
    <circle cx="24" cy="19" r="1.2" fill="#2E6B8A"/>
    <!-- Long bamboo and brass opium smoking pipe -->
    <line x1="12" y1="36" x2="42" y2="30" stroke="#8A6032" stroke-width="2.2"/>
    <circle cx="42" cy="30" r="3.5" fill="#C49B4B" stroke="#1F1B16" stroke-width="1"/>
  </g>

  <!-- ==============================================
       HOTSPOT 2: c3_dressing_mirror (52%, 35% -> x:202.8, y:245)
       HOTSPOT 3: c3_teapot (64%, 54% -> x:249.6, y:378)
       HOTSPOT 11: c3_half_eaten_snack (68%, 62% -> x:265.2, y:434)
       Elaborate Three-Fold Vanity Mirror & Makeup Table
       ============================================== -->
  <g id="art_c3_vanity_mirror" transform="translate(140, 160)">
    <!-- Vanity Light Halo Wash -->
    <circle cx="65" cy="85" r="95" fill="url(#c3_vanityGlow)"/>

    <!-- Three-Fold Mirror Rosewood Frame -->
    <!-- Left Wing Mirror -->
    <polygon points="5,45 25,35 25,140 5,135" fill="#6A808C" stroke="#1F1B16" stroke-width="1.8"/>
    <!-- Right Wing Mirror -->
    <polygon points="105,35 125,45 125,135 105,140" fill="#6A808C" stroke="#1F1B16" stroke-width="1.8"/>
    <!-- Main Center Oval Mirror (c3_dressing_mirror at 52%, 35%) -->
    <ellipse cx="65" cy="85" rx="36" ry="50" fill="#422E21" stroke="#1F1B16" stroke-width="2.5"/>
    <ellipse cx="65" cy="85" rx="32" ry="46" fill="#8EA4B0" stroke="#C49B4B" stroke-width="1.5"/>
    <!-- Mirror glass highlight reflection lines -->
    <line x1="48" y1="55" x2="78" y2="115" stroke="#FAF6EE" stroke-width="2.5" opacity="0.6"/>
    <line x1="56" y1="52" x2="84" y2="108" stroke="#FAF6EE" stroke-width="1" opacity="0.6"/>

    <!-- Glowing Incandescent Bulbs around Vanity Mirror Frame -->
    <g fill="#FFF5D6" stroke="#C49B4B" stroke-width="1.2">
      <circle cx="28" cy="85" r="4.5"/>
      <circle cx="34" cy="55" r="4.5"/>
      <circle cx="50" cy="38" r="4.5"/>
      <circle cx="65" cy="32" r="4.5"/>
      <circle cx="80" cy="38" r="4.5"/>
      <circle cx="96" cy="55" r="4.5"/>
      <circle cx="102" cy="85" r="4.5"/>
      <circle cx="96" cy="115" r="4.5"/>
      <circle cx="34" cy="115" r="4.5"/>
    </g>

    <!-- Dressing Table Surface (Rosewood) -->
    <polygon points="-10,140 140,140 130,175 -20,175" fill="#5C3F2B" stroke="#1F1B16" stroke-width="2"/>
    <!-- Front Drawer Apron -->
    <polygon points="-20,175 130,175 130,210 -20,210" fill="#422D1F" stroke="#1F1B16" stroke-width="2"/>
    <!-- Half-open drawer with bird's nest snack (c3_half_eaten_snack at 68%, 62%) -->
    <polygon points="65,182 125,182 135,215 75,215" fill="#2E1F16" stroke="#1F1B16" stroke-width="1.5"/>
    <!-- Box of Bird's Nest Sweet Snack -->
    <rect x="80" y="188" width="35" height="18" fill="#FAF6EE" stroke="#1F1B16" stroke-width="1"/>
    <rect x="83" y="191" width="14" height="12" fill="#E8DEC8"/>
    <!-- Silver dessert fork -->
    <line x1="102" y1="192" x2="114" y2="202" stroke="#8A9297" stroke-width="1.2"/>

    <!-- Tabletop Props: Cinnabar rouge pots & brush -->
    <circle cx="15" cy="155" r="6" fill="#9A3B2C" stroke="#1F1B16" stroke-width="1"/>
    <ellipse cx="32" cy="155" rx="5" ry="3" fill="#FAF6EE" stroke="#1F1B16" stroke-width="0.8"/>
    <line x1="8" y1="165" x2="35" y2="162" stroke="#C49B4B" stroke-width="1.5"/>

    <!-- Yixing Purple-Clay Teapot & Cup (c3_teapot at 64%, 54%) -->
    <g transform="translate(100, 142)">
      <!-- Celadon tray -->
      <ellipse cx="8" cy="12" rx="16" ry="6" fill="#4F6F5F" stroke="#1F1B16" stroke-width="1"/>
      <!-- Purple clay teapot -->
      <ellipse cx="6" cy="7" rx="8" ry="6" fill="#5A2E28" stroke="#1F1B16" stroke-width="1.2"/>
      <ellipse cx="6" cy="2" rx="4" ry="2" fill="#753C35" stroke="#1F1B16" stroke-width="0.8"/>
      <!-- Bamboo overhead carrying handle -->
      <path d="M-1 5 Q6 -4 13 5" fill="none" stroke="#C49B4B" stroke-width="1.2"/>
      <!-- Spout -->
      <path d="M-2 7 L-6 4" stroke="#5A2E28" stroke-width="2.5" stroke-linecap="round"/>
      <!-- Matching small teacup -->
      <ellipse cx="16" cy="11" rx="3.5" ry="2" fill="#5A2E28" stroke="#1F1B16" stroke-width="0.8"/>
      <!-- Faint steam wisps -->
      <path d="M-6 2 Q-10 -4 -6 -10" stroke="#FAF6EE" stroke-width="0.8" fill="none" opacity="0.5"/>
    </g>
  </g>

  <!-- ==============================================
       HOTSPOT 1: c3_victim (50%, 55% -> x:195, y:385)
       Dry-Dan Opera Star Chu Wan-tin Slumped in Armchair
       ============================================== -->
  <g id="art_c3_victim" transform="translate(145, 330)">
    <!-- Carved Rosewood Armchair back -->
    <rect x="25" y="0" width="50" height="70" rx="4" fill="#3D291C" stroke="#1F1B16" stroke-width="2"/>
    <circle cx="50" cy="12" r="6" fill="#C49B4B" stroke="#1F1B16" stroke-width="1"/>

    <!-- Slumped Body in Silver-and-Cyan Embroidered Stage Costume -->
    <!-- Torso slumped forward onto table -->
    <ellipse cx="50" cy="55" rx="32" ry="24" fill="#2E6B66" stroke="#1F1B16" stroke-width="2"/>
    <!-- Elaborate Silver Dragon embroidery on costume -->
    <path d="M30 45 Q50 35 70 45 Q65 65 35 60" stroke="#FAF6EE" stroke-width="1.5" fill="none" opacity="0.85"/>
    <circle cx="50" cy="50" r="3" fill="#C49B4B"/>
    <!-- Flowing white silk water-sleeves trailing down -->
    <path d="M22 65 Q18 95 10 115 Q25 110 32 85 Z" fill="#FAF6EE" stroke="#1F1B16" stroke-width="1.5"/>
    <!-- Head slumped sideways on table arm -->
    <ellipse cx="36" cy="38" rx="14" ry="12" fill="#E8DEC8" stroke="#1F1B16" stroke-width="1.5"/>
    <!-- Elaborate opera hair coiled in net with silver pins -->
    <path d="M24 35 Q30 22 46 28 Q44 42 24 35 Z" fill="#1F1B16"/>
    <circle cx="28" cy="28" r="2.5" fill="#9A3B2C"/>
  </g>

  <!-- ==============================================
       HOTSPOT 9: c3_hairpin (42%, 62% -> x:163.8, y:434)
       Fallen Kingfisher Feather & Pearl Phoenix Hairpin
       ============================================== -->
  <g id="art_c3_hairpin" transform="translate(150, 420)">
    <!-- Shadow on carpet -->
    <ellipse cx="14" cy="15" rx="16" ry="6" fill="#1F1B16" opacity="0.4"/>
    <!-- Silver Hairpin Stem -->
    <line x1="0" y1="22" x2="25" y2="8" stroke="#8A9297" stroke-width="2"/>
    <!-- Phoenix Head & Celadon Kingfisher Feather Inlay -->
    <path d="M22 10 Q28 2 34 6 Q30 14 22 10 Z" fill="#248A7A" stroke="#1F1B16" stroke-width="1"/>
    <!-- Dangling genuine pearls on fine gold chains (步搖) -->
    <circle cx="32" cy="12" r="2" fill="#FAF6EE" stroke="#1F1B16" stroke-width="0.6"/>
    <circle cx="34" cy="17" r="2" fill="#FAF6EE" stroke="#1F1B16" stroke-width="0.6"/>
    <circle cx="36" cy="22" r="2.5" fill="#FAF6EE" stroke="#1F1B16" stroke-width="0.6"/>
  </g>

  <!-- ==============================================
       HOTSPOT 4: c3_costume_trunk (22%, 62% -> x:85.8, y:434)
       Stacked Black Leather Theatrical Costume Trunks
       ============================================== -->
  <g id="art_c3_trunks" transform="translate(40, 390)">
    <!-- Bottom Heavy Trunk -->
    <polygon points="0,35 80,25 80,85 0,95" fill="#2E231D" stroke="#1F1B16" stroke-width="2.2"/>
    <!-- Reinforced Brass Ball Corners -->
    <circle cx="3" cy="35" r="4" fill="#C49B4B" stroke="#1F1B16" stroke-width="1"/>
    <circle cx="77" cy="25" r="4" fill="#C49B4B" stroke="#1F1B16" stroke-width="1"/>
    <circle cx="3" cy="92" r="4" fill="#C49B4B" stroke="#1F1B16" stroke-width="1"/>
    <circle cx="77" cy="82" r="4" fill="#C49B4B" stroke="#1F1B16" stroke-width="1"/>
    <!-- Heavy Brass Trunk Lock -->
    <rect x="35" y="45" width="12" height="16" fill="#C49B4B" stroke="#1F1B16" stroke-width="1.2"/>
    <!-- Shipping label from Hong Kong / Canton -->
    <polygon points="12,50 30,48 28,68 10,70" fill="#FAF6EE" stroke="#1F1B16" stroke-width="0.8"/>
    <text x="20" y="60" font-size="4" font-family="sans-serif" font-weight="bold" fill="#9A3B2C">清平班</text>

    <!-- Top Smaller Leather Trunk -->
    <polygon points="5,0 72,-8 72,32 5,40" fill="#3D2E24" stroke="#1F1B16" stroke-width="2"/>
    <circle cx="7" cy="1" r="3.5" fill="#C49B4B" stroke="#1F1B16" stroke-width="0.8"/>
    <circle cx="70" cy="-7" r="3.5" fill="#C49B4B" stroke="#1F1B16" stroke-width="0.8"/>
  </g>

  <!-- ==============================================
       HOTSPOT 6: c3_prop_weapons (82%, 64% -> x:319.8, y:448)
       Timber Weapon Rack with Crossed Spears & Halberds
       ============================================== -->
  <g id="art_c3_weapons" transform="translate(295, 380)">
    <!-- Heavy Timber Stand Frame -->
    <rect x="15" y="60" width="40" height="12" fill="#5A3E2C" stroke="#1F1B16" stroke-width="2"/>
    <rect x="20" y="20" width="8" height="50" fill="#3D281B" stroke="#1F1B16" stroke-width="1.5"/>
    <rect x="42" y="20" width="8" height="50" fill="#3D281B" stroke="#1F1B16" stroke-width="1.5"/>

    <!-- Red-Tasselled Red-Spears & Halberds (Crossed) -->
    <!-- Spear 1 -->
    <line x1="5" y1="80" x2="55" y2="0" stroke="#8A6032" stroke-width="3"/>
    <polygon points="55,0 60,-12 50,-8" fill="#8A9297" stroke="#1F1B16" stroke-width="1.2"/>
    <!-- Red horsehair tassel -->
    <circle cx="52" cy="-3" r="5" fill="#9A3B2C"/>
    <!-- Crescent Halberd 2 -->
    <line x1="60" y1="80" x2="10" y2="0" stroke="#8A6032" stroke-width="3"/>
    <polygon points="10,0 6,-14 14,-10" fill="#8A9297" stroke="#1F1B16" stroke-width="1.2"/>
    <path d="M14 -10 Q24 -8 20 2 Q12 -2 14 -10 Z" fill="#8A9297" stroke="#1F1B16" stroke-width="1"/>
    <circle cx="12" cy="-4" r="5" fill="#9A3B2C"/>
  </g>

  <!-- ==============================================
       HOTSPOT 12: c3_backstage_door (88%, 75% -> x:343.2, y:525)
       Heavy Timber Exit Door to Cheng Peng Straight Street
       ============================================== -->
  <g id="art_c3_backstage_door" transform="translate(325, 460)">
    <!-- Doorway frame -->
    <rect x="0" y="0" width="65" height="180" fill="#241913" stroke="#1F1B16" stroke-width="2.5"/>
    <!-- Door leaf panels -->
    <rect x="6" y="6" width="53" height="168" fill="#422C1D" stroke="#1F1B16" stroke-width="1.8"/>
    <!-- Cast-iron crossbars -->
    <rect x="6" y="35" width="53" height="10" fill="#1F1B16"/>
    <rect x="6" y="125" width="53" height="10" fill="#1F1B16"/>
    <!-- Heavy Iron Bolt & Brass Padlock (c3_backstage_door at 88%, 75%) -->
    <rect x="18" y="75" width="22" height="12" fill="#1F1B16" stroke="#8A9297" stroke-width="1.2"/>
    <line x1="12" y1="81" x2="35" y2="81" stroke="#8A9297" stroke-width="3"/>
    <rect x="22" y="90" width="12" height="14" fill="#C49B4B" stroke="#1F1B16" stroke-width="1.2"/>
  </g>

  <!-- Overall Archival Paper Border & Vignette Frame -->
  <rect x="1" y="1" width="388" height="698" fill="none" stroke="#1F1B16" stroke-width="2"/>
  <rect x="4" y="4" width="382" height="692" fill="none" stroke="#9A3B2C" stroke-width="0.8" opacity="0.6"/>
</svg>'''

def create_case4_penha():
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 390 700" width="100%" height="100%" class="case-scene-svg">
  <defs>
    <!-- Mid-Autumn Nocturnal Penha Sky Gradient -->
    <linearGradient id="c4_skyWash" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0E1724"/>
      <stop offset="40%" stop-color="#1A283B"/>
      <stop offset="70%" stop-color="#283A4F"/>
      <stop offset="100%" stop-color="#41566B"/>
    </linearGradient>
    <!-- Portuguese Calçada Wave Mosaic Pattern -->
    <pattern id="c4_calcada" width="28" height="18" patternUnits="userSpaceOnUse">
      <rect width="28" height="18" fill="#F4EDE2"/>
      <path d="M0 9 Q7 0 14 9 T28 9" stroke="#1F1B16" stroke-width="3.2" fill="none"/>
      <path d="M0 18 Q7 9 14 18 T28 18" stroke="#1F1B16" stroke-width="3.2" fill="none"/>
    </pattern>
    <!-- Full Moon Glow -->
    <radialGradient id="c4_moonGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFFDF5" stop-opacity="0.95"/>
      <stop offset="25%" stop-color="#F4E8C1" stop-opacity="0.6"/>
      <stop offset="60%" stop-color="#E8C372" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#0E1724" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="c4_marbleShadow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#1F1B16" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#1F1B16" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Deep Nocturnal Sky -->
  <rect width="390" height="360" fill="url(#c4_skyWash)"/>

  <!-- Mid-Autumn Radiant Full Moon (Upper Right) -->
  <circle cx="280" cy="85" r="45" fill="url(#c4_moonGlow)"/>
  <circle cx="280" cy="85" r="22" fill="#FFFDF5" stroke="#F4EDE2" stroke-width="1.5"/>
  <!-- Moon sea/crater texture -->
  <ellipse cx="274" cy="80" rx="6" ry="4" fill="#E2D4B7" opacity="0.45"/>
  <ellipse cx="286" cy="88" rx="8" ry="5" fill="#E2D4B7" opacity="0.45"/>

  <!-- Moonlit Silver Cloud Wisps -->
  <path d="M160 85 Q220 70 280 82 T380 75" stroke="#FAF6EE" stroke-width="1.8" fill="none" opacity="0.35"/>
  <path d="M220 100 Q270 92 320 98 T390 92" stroke="#FAF6EE" stroke-width="1.2" fill="none" opacity="0.25"/>

  <!-- Panoramic View of Macau Harbour & Taipa Hills in Distance -->
  <path d="M120 170 Q240 145 390 160 L390 280 L120 280 Z" fill="#182330" opacity="0.8"/>
  <!-- Twinkling harbour lights & junk boat lanterns -->
  <circle cx="250" cy="180" r="1.5" fill="#FFEAA7"/>
  <circle cx="290" cy="185" r="1.2" fill="#FFEAA7"/>
  <circle cx="340" cy="178" r="1.5" fill="#FFEAA7"/>
  <circle cx="370" cy="182" r="1.2" fill="#FFEAA7"/>

  <!-- Mountain Slope Trees (Cypress & Banyan Silhouettes) -->
  <path d="M0 240 Q60 210 120 230 L120 380 L0 380 Z" fill="#131C18"/>
  <ellipse cx="40" cy="210" rx="22" ry="38" fill="#1B2922"/>
  <ellipse cx="80" cy="225" rx="26" ry="32" fill="#16241C"/>

  <!-- ==============================================
       HOTSPOT 2: c4_spire_chapel (24%, 24% -> x:93.6, y:168)
       Penha Chapel Granite Spire, Belfry & Stone Cross
       ============================================== -->
  <g id="art_c4_chapel" transform="translate(45, 60)">
    <!-- Granite Belfry Tower Structure -->
    <polygon points="35,160 65,160 60,65 40,65" fill="#756D60" stroke="#1F1B16" stroke-width="2.2"/>
    <!-- Masonry stone block lines -->
    <g stroke="#4A443A" stroke-width="0.8">
      <line x1="39" y1="85" x2="61" y2="85"/>
      <line x1="38" y1="105" x2="62" y2="105"/>
      <line x1="37" y1="125" x2="63" y2="125"/>
      <line x1="36" y1="145" x2="64" y2="145"/>
    </g>
    <!-- Pointed Gothic Arch Louvered Windows (c4_spire_chapel at 24%, 24%) -->
    <path d="M44 110 L44 85 Q50 72 56 85 L56 110 Z" fill="#24221F" stroke="#1F1B16" stroke-width="1.5"/>
    <line x1="44" y1="92" x2="56" y2="92" stroke="#C49B4B" stroke-width="1"/>
    <line x1="44" y1="98" x2="56" y2="98" stroke="#C49B4B" stroke-width="1"/>
    <line x1="44" y1="104" x2="56" y2="104" stroke="#C49B4B" stroke-width="1"/>
    <!-- Belfry Cornice Molding -->
    <rect x="36" y="60" width="28" height="6" fill="#8C8374" stroke="#1F1B16" stroke-width="1.5"/>
    <!-- Tall Octagonal Neo-Gothic Granite Spire -->
    <polygon points="38,60 50,5 62,60" fill="#5A5245" stroke="#1F1B16" stroke-width="2"/>
    <line x1="50" y1="5" x2="50" y2="60" stroke="#1F1B16" stroke-width="1.2"/>
    <!-- Granite Cross on Apex -->
    <line x1="50" y1="0" x2="50" y2="8" stroke="#1F1B16" stroke-width="1.8"/>
    <line x1="46" y1="3" x2="54" y2="3" stroke="#1F1B16" stroke-width="1.8"/>

    <!-- Chapel Nave Buttress -->
    <polygon points="65,160 110,160 110,110 65,95" fill="#5E5649" stroke="#1F1B16" stroke-width="2"/>
    <path d="M78 140 L78 120 Q86 110 94 120 L94 140 Z" fill="#2E4A66" stroke="#1F1B16" stroke-width="1.2"/>
  </g>

  <!-- ==============================================
       HOTSPOT 3: c4_balustrade (72%, 45% -> x:280.8, y:315)
       HOTSPOT 9: c4_telescope (82%, 42% -> x:319.8, y:294)
       Portuguese Carved Granite Balustrade & Brass Telescope
       ============================================== -->
  <g id="art_c4_balustrade" transform="translate(190, 260)">
    <!-- Balustrade Handrail in perspective -->
    <polygon points="0,55 190,25 190,35 0,65" fill="#8C8374" stroke="#1F1B16" stroke-width="2"/>
    <!-- Classical Turned Granite Balusters (c4_balustrade at 72%, 45%) -->
    <g fill="#756D60" stroke="#1F1B16" stroke-width="1.2">
      <rect x="15" y="65" width="8" height="35"/>
      <circle cx="19" cy="80" r="5"/>
      <rect x="45" y="58" width="8" height="35"/>
      <circle cx="49" cy="73" r="5"/>
      <rect x="75" y="52" width="8" height="35"/>
      <circle cx="79" cy="67" r="5"/>
      <rect x="105" y="46" width="8" height="35"/>
      <circle cx="109" cy="61" r="5"/>
      <rect x="135" y="40" width="8" height="35"/>
      <circle cx="139" cy="55" r="5"/>
      <rect x="165" y="34" width="8" height="35"/>
      <circle cx="169" cy="49" r="5"/>
    </g>
    <!-- Balustrade Base plinth curb -->
    <polygon points="0,100 190,68 190,82 0,114" fill="#5E5649" stroke="#1F1B16" stroke-width="2"/>

    <!-- Brass Astronomical Telescope on Mahogany Tripod (c4_telescope at 82%, 42%) -->
    <g transform="translate(125, -5)">
      <!-- Mahogany tripod legs -->
      <line x1="12" y1="42" x2="0" y2="85" stroke="#5A3A22" stroke-width="2.5"/>
      <line x1="12" y1="42" x2="16" y2="82" stroke="#5A3A22" stroke-width="2"/>
      <line x1="12" y1="42" x2="30" y2="80" stroke="#5A3A22" stroke-width="2.5"/>
      <!-- Brass altitude-azimuth mount -->
      <circle cx="12" cy="42" r="4.5" fill="#C49B4B" stroke="#1F1B16" stroke-width="1.2"/>
      <!-- Main Brass Telescope Barrel pointing toward harbour -->
      <polygon points="-8,48 38,32 39,38 -7,54" fill="#C49B4B" stroke="#1F1B16" stroke-width="1.5"/>
      <!-- Objective lens dew shield & cap -->
      <rect x="36" y="30" width="6" height="12" fill="#E8C372" stroke="#1F1B16" stroke-width="1"/>
      <ellipse cx="42" cy="36" rx="2" ry="5" fill="#8EA4B0" stroke="#1F1B16" stroke-width="0.8"/>
      <!-- Eyepiece optical tube -->
      <rect x="-14" y="48" width="8" height="5" fill="#C49B4B" stroke="#1F1B16" stroke-width="1"/>
    </g>
  </g>

  <!-- Garden Terrace: Portuguese Calçada Stone Mosaic (Wave pattern) -->
  <polygon points="0,350 390,320 390,700 0,700" fill="url(#c4_calcada)" stroke="#1F1B16" stroke-width="2.5"/>

  <!-- ==============================================
       HOTSPOT 10: c4_iron_gate (18%, 68% -> x:70.2, y:476)
       Ornate Victorian Black Wrought-Iron Estate Gate
       ============================================== -->
  <g id="art_c4_iron_gate" transform="translate(20, 390)">
    <!-- Granite gate pillar -->
    <rect x="0" y="20" width="22" height="150" fill="#756D60" stroke="#1F1B16" stroke-width="2.2"/>
    <ellipse cx="11" cy="20" rx="14" ry="6" fill="#8C8374" stroke="#1F1B16" stroke-width="1.5"/>
    <!-- Granite stone sphere on pillar cap -->
    <circle cx="11" cy="10" r="9" fill="#8C8374" stroke="#1F1B16" stroke-width="1.5"/>

    <!-- Wrought Iron Gate Leaf Standing Ajar (c4_iron_gate at 18%, 68%) -->
    <polygon points="22,35 78,55 78,175 22,165" fill="none" stroke="#1F1B16" stroke-width="2.2"/>
    <!-- Scrollwork filigree and vertical railings -->
    <g stroke="#1F1B16" stroke-width="1.5">
      <line x1="33" y1="39" x2="33" y2="167"/>
      <line x1="45" y1="43" x2="45" y2="169"/>
      <line x1="56" y1="47" x2="56" y2="171"/>
      <line x1="67" y1="51" x2="67" y2="173"/>
      <!-- Spearhead finials -->
      <polygon points="33,39 30,30 36,30" fill="#1F1B16"/>
      <polygon points="45,43 42,34 48,34" fill="#1F1B16"/>
      <polygon points="56,47 53,38 59,38" fill="#1F1B16"/>
      <polygon points="67,51 64,42 70,42" fill="#1F1B16"/>
    </g>
    <!-- Heavy iron lock latch swung open -->
    <rect x="68" y="105" width="10" height="15" fill="#1F1B16"/>
  </g>

  <!-- ==============================================
       HOTSPOT 4: c4_fountain (46%, 56% -> x:179.4, y:392)
       HOTSPOT 7: c4_broken_cufflink (44%, 68% -> x:171.6, y:476)
       HOTSPOT 12: c4_blood_drips (48%, 70% -> x:187.2, y:490)
       Three-Tiered Italian Marble Angel Fountain & Stone Basin
       ============================================== -->
  <g id="art_c4_fountain" transform="translate(115, 305)">
    <!-- Shadow on calçada pavement -->
    <ellipse cx="65" cy="145" rx="65" ry="24" fill="#1F1B16" opacity="0.4"/>

    <!-- Octagonal Stone Basin Plinth -->
    <polygon points="10,135 120,135 138,155 -8,155" fill="#B3A898" stroke="#1F1B16" stroke-width="2.5"/>
    <polygon points="-8,155 138,155 134,170 -12,170" fill="#8C8172" stroke="#1F1B16" stroke-width="2"/>
    <!-- Water in Basin with ripples -->
    <ellipse cx="65" cy="138" rx="55" ry="14" fill="#4F6F5F" stroke="#1F1B16" stroke-width="1.8"/>

    <!-- Fountain Pedestal Column -->
    <rect x="56" y="80" width="18" height="55" fill="#D3C9B8" stroke="#1F1B16" stroke-width="1.8"/>
    <!-- Lower Scalloped Marble Basin Tier -->
    <ellipse cx="65" cy="80" rx="38" ry="12" fill="#E8DEC8" stroke="#1F1B16" stroke-width="2"/>
    <ellipse cx="65" cy="78" rx="34" ry="10" fill="#6A8F7D" stroke="#1F1B16" stroke-width="1"/>

    <!-- Middle Pedestal Column -->
    <rect x="58" y="45" width="14" height="35" fill="#D3C9B8" stroke="#1F1B16" stroke-width="1.5"/>
    <!-- Upper Marble Basin Tier -->
    <ellipse cx="65" cy="45" rx="22" ry="7" fill="#E8DEC8" stroke="#1F1B16" stroke-width="1.8"/>
    <ellipse cx="65" cy="44" rx="19" ry="5.5" fill="#6A8F7D" stroke="#1F1B16" stroke-width="0.8"/>

    <!-- Top Sculpted Marble Cherub Spout (c4_fountain at 46%, 56%) -->
    <g transform="translate(56, 12)">
      <circle cx="9" cy="8" r="6" fill="#FAF6EE" stroke="#1F1B16" stroke-width="1.2"/>
      <polygon points="5,14 13,14 11,28 7,28" fill="#FAF6EE" stroke="#1F1B16" stroke-width="1.2"/>
      <!-- Cherub wing -->
      <path d="M4 16 Q-6 10 -2 20 Z" fill="#E8DEC8" stroke="#1F1B16" stroke-width="1"/>
      <!-- Urn spout & water stream -->
      <ellipse cx="9" cy="5" rx="3" ry="4" fill="#C49B4B"/>
      <!-- Splashing fountain water streams -->
      <path d="M9 2 Q9 -8 18 10" stroke="#FAF6EE" stroke-width="1.5" fill="none"/>
      <path d="M9 2 Q9 -8 0 10" stroke="#FAF6EE" stroke-width="1.5" fill="none"/>
    </g>

    <!-- Moss on fountain step & Broken Cufflink (c4_broken_cufflink at 44%, 68%) -->
    <g transform="translate(52, 160)">
      <!-- Green moss patch -->
      <ellipse cx="4" cy="5" rx="10" ry="4" fill="#3D5A40" opacity="0.8"/>
      <!-- Gold Portuguese Coat-of-Arms Cufflink -->
      <circle cx="4" cy="4" r="3.5" fill="#C49B4B" stroke="#1F1B16" stroke-width="0.9"/>
      <!-- Quinas shield crest -->
      <polygon points="4,2 6,4 4,6 2,4" fill="#9A3B2C"/>
      <!-- Broken toggle post -->
      <line x1="6" y1="5" x2="9" y2="8" stroke="#C49B4B" stroke-width="1"/>
    </g>

    <!-- Dark Blood Dripping onto Step & Flags (c4_blood_drips at 48%, 70%) -->
    <g transform="translate(68, 165)">
      <circle cx="3" cy="4" r="2.5" fill="#821C14"/>
      <circle cx="10" cy="8" r="2" fill="#821C14"/>
      <circle cx="16" cy="14" r="1.8" fill="#821C14"/>
      <circle cx="22" cy="22" r="2.2" fill="#821C14"/>
    </g>
  </g>

  <!-- ==============================================
       HOTSPOT 6: c4_champagne_table (76%, 58% -> x:296.4, y:406)
       White Cast-Iron Garden Table, Champagne & Coupes
       ============================================== -->
  <g id="art_c4_champagne" transform="translate(265, 370)">
    <!-- Cast-Iron Tabletop -->
    <ellipse cx="30" cy="25" rx="28" ry="12" fill="#FAF6EE" stroke="#1F1B16" stroke-width="2"/>
    <ellipse cx="30" cy="25" rx="24" ry="10" fill="#E8DEC8" stroke="#1F1B16" stroke-width="1"/>
    <!-- Wrought Iron Scrollwork Legs -->
    <path d="M12 34 Q8 60 4 80" stroke="#1F1B16" stroke-width="2" fill="none"/>
    <path d="M48 34 Q52 60 56 80" stroke="#1F1B16" stroke-width="2" fill="none"/>
    <circle cx="30" cy="55" r="5" fill="none" stroke="#1F1B16" stroke-width="1.5"/>

    <!-- Silver Ice Bucket with French Champagne -->
    <polygon points="22,14 38,14 36,30 24,30" fill="#C5CFD6" stroke="#1F1B16" stroke-width="1.2"/>
    <!-- Champagne bottle neck protruding from ice -->
    <polygon points="28,2 32,2 33,14 27,14" fill="#2E4A38" stroke="#1F1B16" stroke-width="1"/>
    <!-- Gold foil on neck -->
    <rect x="28" y="2" width="4" height="5" fill="#C49B4B"/>
    <!-- Crystal champagne flutes -->
    <line x1="14" y1="20" x2="14" y2="28" stroke="#1F1B16" stroke-width="0.8"/>
    <polygon points="12,14 16,14 14,20" fill="#FAF6EE" stroke="#1F1B16" stroke-width="0.8" opacity="0.8"/>
    <line x1="45" y1="22" x2="45" y2="30" stroke="#1F1B16" stroke-width="0.8"/>
    <polygon points="43,16 47,16 45,22" fill="#FAF6EE" stroke="#1F1B16" stroke-width="0.8" opacity="0.8"/>
  </g>

  <!-- ==============================================
       HOTSPOT 1: c4_victim (52%, 62% -> x:202.8, y:434)
       Colonial Advisor Menezes Fallen Beside Fountain
       ============================================== -->
  <g id="art_c4_victim" transform="translate(170, 405)">
    <!-- Pool of dark blood spreading on calçada -->
    <path d="M15 35 Q45 22 75 32 Q95 45 80 58 Q45 65 15 35 Z" fill="#6A1812" opacity="0.85"/>
    <path d="M25 36 Q45 28 65 34 Q80 44 70 52 Q45 56 25 36 Z" fill="#4A100C" opacity="0.95"/>

    <!-- Slumped Body in Black Formal Dinner Jacket (Tuxedo) -->
    <ellipse cx="48" cy="34" rx="28" ry="16" fill="#1C1B1A" stroke="#1F1B16" stroke-width="2"/>
    <!-- Crisp White Pleated Tuxedo Shirt Front -->
    <polygon points="44,24 54,24 50,38" fill="#FAF6EE" stroke="#1F1B16" stroke-width="1"/>
    <!-- Black silk bow tie -->
    <polygon points="46,24 52,24 49,26" fill="#1F1B16"/>
    <!-- Red Carnation Boutonniere in Lapel -->
    <circle cx="40" cy="27" r="2.5" fill="#9A3B2C"/>
    <!-- Outstretched Arm -->
    <path d="M68 34 L92 42 L90 46 L66 38 Z" fill="#1C1B1A" stroke="#1F1B16" stroke-width="1.2"/>
    <!-- Hand on calçada flags -->
    <circle cx="95" cy="44" r="4.5" fill="#D3C5B4" stroke="#1F1B16" stroke-width="0.9"/>
    <!-- Head fallen back against fountain plinth -->
    <ellipse cx="26" cy="28" rx="12" ry="11" fill="#D3C5B4" stroke="#1F1B16" stroke-width="1.2"/>
    <path d="M18 24 Q24 16 34 20 Q30 32 18 24 Z" fill="#423E3A"/>
  </g>

  <!-- ==============================================
       HOTSPOT 5: c4_walther_gun (64%, 66% -> x:249.6, y:462)
       Walther PPK Pistol Caught in Dark Red Rose Bushes
       ============================================== -->
  <g id="art_c4_rose_gun" transform="translate(225, 430)">
    <!-- Thorny Rose Bush Cluster -->
    <path d="M10 40 Q25 10 45 25 Q65 15 80 45 Q70 65 40 60 Q15 65 10 40 Z" fill="#1C2D20" stroke="#1F1B16" stroke-width="1.5"/>
    <!-- Dark red mid-autumn blooming roses -->
    <circle cx="28" cy="25" r="7" fill="#821C14" stroke="#1F1B16" stroke-width="1"/>
    <circle cx="58" cy="28" r="8" fill="#9A2218" stroke="#1F1B16" stroke-width="1"/>
    <circle cx="42" cy="45" r="7.5" fill="#6A1610" stroke="#1F1B16" stroke-width="1"/>
    <!-- Rose Thorns on Stems -->
    <g stroke="#1F1B16" stroke-width="1.2">
      <line x1="20" y1="35" x2="35" y2="45"/>
      <line x1="50" y1="35" x2="65" y2="50"/>
    </g>

    <!-- Walther PPK Blued-Steel Pistol (c4_walther_gun at 64%, 66%) -->
    <g transform="translate(24, 28) rotate(-22)">
      <!-- Slide barrel -->
      <rect x="0" y="0" width="22" height="7" rx="1" fill="#2E343A" stroke="#1F1B16" stroke-width="1.5"/>
      <!-- Muzzle bore -->
      <circle cx="0" cy="3.5" r="1.5" fill="#1F1B16"/>
      <!-- Serrations on slide -->
      <line x1="16" y1="1" x2="16" y2="6" stroke="#1F1B16" stroke-width="0.8"/>
      <line x1="18" y1="1" x2="18" y2="6" stroke="#1F1B16" stroke-width="0.8"/>
      <line x1="20" y1="1" x2="20" y2="6" stroke="#1F1B16" stroke-width="0.8"/>
      <!-- Trigger guard & hammer -->
      <path d="M8 7 Q14 12 14 7" fill="none" stroke="#1F1B16" stroke-width="1.2"/>
      <path d="M22 2 Q25 4 23 7" stroke="#1F1B16" stroke-width="1.2" fill="none"/>
      <!-- Grip handle with checkered stock -->
      <polygon points="12,7 24,7 22,22 8,20" fill="#1C1814" stroke="#1F1B16" stroke-width="1.5"/>
      <circle cx="16" cy="14" r="2.5" fill="#C49B4B" stroke="#1F1B16" stroke-width="0.6"/>
    </g>
  </g>

  <!-- ==============================================
       HOTSPOT 8: c4_footprints_mud (34%, 72% -> x:132.6, y:504)
       Military Combat Boot Footprints in Muddy Verge
       ============================================== -->
  <g id="art_c4_bootprints" stroke="#1F1B16" stroke-width="0.8">
    <!-- Muddy grass verge border -->
    <path d="M80 470 Q120 460 160 480" stroke="#4A3F2C" stroke-width="14" fill="none" opacity="0.6"/>

    <!-- Combat boot print 1 (deep commando lug sole) -->
    <g transform="translate(115, 475) rotate(42)">
      <polygon points="-4,-10 4,-10 5,6 -5,6" fill="#3D2E20" opacity="0.9"/>
      <polygon points="-4,8 4,8 3,14 -3,14" fill="#3D2E20" opacity="0.9"/>
      <!-- Deep chevron tread pattern -->
      <line x1="-3" y1="-6" x2="3" y2="-6" stroke="#1A120B" stroke-width="1"/>
      <line x1="-3" y1="-2" x2="3" y2="-2" stroke="#1A120B" stroke-width="1"/>
      <line x1="-3" y1="2" x2="3" y2="2" stroke="#1A120B" stroke-width="1"/>
    </g>
    <!-- Combat boot print 2 (c4_footprints_mud at 34%, 72%) -->
    <g transform="translate(133, 504) rotate(48)">
      <polygon points="-4,-10 4,-10 5,6 -5,6" fill="#3D2E20" opacity="0.9"/>
      <polygon points="-4,8 4,8 3,14 -3,14" fill="#3D2E20" opacity="0.9"/>
      <line x1="-3" y1="-6" x2="3" y2="-6" stroke="#1A120B" stroke-width="1"/>
      <line x1="-3" y1="-2" x2="3" y2="-2" stroke="#1A120B" stroke-width="1"/>
      <line x1="-3" y1="2" x2="3" y2="2" stroke="#1A120B" stroke-width="1"/>
    </g>
    <!-- Combat boot print 3 toward gate -->
    <g transform="translate(150, 535) rotate(55)">
      <polygon points="-4,-10 4,-10 5,6 -5,6" fill="#3D2E20" opacity="0.85"/>
      <polygon points="-4,8 4,8 3,14 -3,14" fill="#3D2E20" opacity="0.85"/>
    </g>
  </g>

  <!-- ==============================================
       HOTSPOT 11: c4_letter_ashes (60%, 74% -> x:234, y:518)
       Charred Secret Letter Fragments & Smoldering Ashes
       ============================================== -->
  <g id="art_c4_letter_ashes" transform="translate(215, 495)">
    <!-- Soil bed curb -->
    <path d="M-10 25 Q20 18 55 25" stroke="#5C4533" stroke-width="12" fill="none" opacity="0.7"/>

    <!-- Heap of Charred Black Paper Ashes (c4_letter_ashes at 60%, 74%) -->
    <ellipse cx="20" cy="24" rx="18" ry="8" fill="#1C1814" stroke="#1F1B16" stroke-width="1.2"/>
    <ellipse cx="18" cy="22" rx="12" ry="5" fill="#2E2822"/>

    <!-- Half-burned typed official letter fragment -->
    <polygon points="12,14 30,12 28,24 8,22" fill="#FAF6EE" stroke="#1F1B16" stroke-width="0.8"/>
    <!-- Charred curled black edges -->
    <path d="M26 12 Q32 16 28 24 Q24 22 26 12 Z" fill="#1F1B16"/>
    <!-- Typewriter text lines on fragment -->
    <line x1="12" y1="16" x2="22" y2="15" stroke="#1F1B16" stroke-width="0.6"/>
    <line x1="11" y1="19" x2="24" y2="18" stroke="#1F1B16" stroke-width="0.6"/>
    <!-- Colonial Governor red wax seal fragment -->
    <circle cx="16" cy="18" r="2.5" fill="#9A3B2C"/>
    <!-- Glowing orange ember spark -->
    <circle cx="28" cy="24" r="1.2" fill="#D35400"/>
  </g>

  <!-- Overall Archival Paper Border & Vignette Frame -->
  <rect x="1" y="1" width="388" height="698" fill="none" stroke="#1F1B16" stroke-width="2"/>
  <rect x="4" y="4" width="382" height="692" fill="none" stroke="#9A3B2C" stroke-width="0.8" opacity="0.6"/>
</svg>'''

def main():
    scenes = {
        'assets/scenes/case1_pawnshop.svg': create_case1_pawnshop(),
        'assets/scenes/case2_pier.svg': create_case2_pier(),
        'assets/scenes/case3_theatre.svg': create_case3_theatre(),
        'assets/scenes/case4_penha.svg': create_case4_penha()
    }
    
    for path, content in scenes.items():
        full_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content.strip() + '\n')
        print(f"Generated {path} (cover-worthy archival Macau architectural illustration, size: {len(content)} B)")

if __name__ == '__main__':
    main()
