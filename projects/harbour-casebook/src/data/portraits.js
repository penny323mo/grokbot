/**
 * 濠江疑案 · Harbour Casebook
 * 人物圖鑑與 SVG 肖像 (Character Portraits)
 * 1960s Macau Archival Paper & Ink Style
 */

export const PORTRAITS = {
  // Case 1 Characters
  chan_tak_sang: {
    id: 'chan_tak_sang',
    name: '陳德生',
    age: '58歲',
    title: '德生大押 掌櫃（朝奉）',
    cases: [1],
    desc: '冷麵無私，眼光毒辣。在福隆新街經營當舖逾三十載，為人深沈，熟稔各路走私與古玩珍品。',
    svg: `<svg viewBox="0 0 100 100" class="portrait-svg">
      <circle cx="50" cy="50" r="48" fill="#F4EDE2" stroke="#1F1B16" stroke-width="2"/>
      <!-- Robe / Shoulders -->
      <path d="M15 95 C20 72 32 68 50 68 C68 68 80 72 85 95 Z" fill="#2C2722" stroke="#1F1B16" stroke-width="1.8"/>
      <!-- Collar with vermilion button -->
      <path d="M42 68 L50 78 L58 68" fill="none" stroke="#9A3B2C" stroke-width="2"/>
      <circle cx="50" cy="74" r="2.5" fill="#9A3B2C"/>
      <!-- Neck & Head -->
      <rect x="43" y="56" width="14" height="15" fill="#E6DAC8" stroke="#1F1B16" stroke-width="1.2"/>
      <ellipse cx="50" cy="42" rx="19" ry="22" fill="#E8DDD0" stroke="#1F1B16" stroke-width="1.8"/>
      <!-- Silver-streaked slicked hair -->
      <path d="M31 38 C31 22 40 18 50 18 C60 18 69 22 69 38 C65 24 55 20 50 20 C45 20 35 24 31 38 Z" fill="#4A443E"/>
      <path d="M34 28 C42 22 58 22 66 28" fill="none" stroke="#D1C7B8" stroke-width="1.5" stroke-dasharray="3,2"/>
      <!-- Eyebrows & Eyes with spectacles -->
      <path d="M38 36 Q43 33 46 36" fill="none" stroke="#1F1B16" stroke-width="2"/>
      <path d="M54 36 Q57 33 62 36" fill="none" stroke="#1F1B16" stroke-width="2"/>
      <!-- Oval wire spectacles -->
      <circle cx="42" cy="41" r="5.5" fill="none" stroke="#8C7A65" stroke-width="1.5"/>
      <circle cx="58" cy="41" r="5.5" fill="none" stroke="#8C7A65" stroke-width="1.5"/>
      <line x1="47.5" y1="41" x2="52.5" y2="41" stroke="#8C7A65" stroke-width="1.5"/>
      <circle cx="42" cy="41" r="1.5" fill="#1F1B16"/>
      <circle cx="58" cy="41" r="1.5" fill="#1F1B16"/>
      <!-- Nose & stern mouth -->
      <path d="M50 41 L49 49 L53 50" fill="none" stroke="#1F1B16" stroke-width="1.5"/>
      <line x1="44" y1="56" x2="56" y2="56" stroke="#1F1B16" stroke-width="1.8"/>
      <!-- Wrinkles -->
      <path d="M36 49 Q42 51 44 54" fill="none" stroke="#B8A896" stroke-width="1"/>
      <path d="M64 49 Q58 51 56 54" fill="none" stroke="#B8A896" stroke-width="1"/>
    </svg>`
  },

  ho_bing: {
    id: 'ho_bing',
    name: '何炳',
    age: '22歲',
    title: '德生大押 夥計（學徒）',
    cases: [1],
    desc: '陳掌櫃帶出道的遠房後生。性格怯弱卻暗藏賭癮，平日在庫房負責點貨搬運，手腳勤快但眼神閃爍。',
    svg: `<svg viewBox="0 0 100 100" class="portrait-svg">
      <circle cx="50" cy="50" r="48" fill="#F4EDE2" stroke="#1F1B16" stroke-width="2"/>
      <!-- Cotton shirt -->
      <path d="M18 95 C22 75 34 70 50 70 C66 70 78 75 82 95 Z" fill="#EAE2D4" stroke="#1F1B16" stroke-width="1.8"/>
      <path d="M44 70 L50 82 L56 70" fill="none" stroke="#1F1B16" stroke-width="1.4"/>
      <!-- Head & Neck -->
      <rect x="44" y="58" width="12" height="14" fill="#E8DDD0" stroke="#1F1B16" stroke-width="1.2"/>
      <ellipse cx="50" cy="44" rx="17" ry="20" fill="#EADFCF" stroke="#1F1B16" stroke-width="1.8"/>
      <!-- 1960s Youth side-parted hair -->
      <path d="M33 38 C32 24 42 20 50 20 C64 20 68 28 68 36 C64 26 52 24 40 26 C36 30 34 34 33 38 Z" fill="#25211D"/>
      <!-- Nervous anxious brow -->
      <path d="M38 38 L45 36" stroke="#1F1B16" stroke-width="1.8"/>
      <path d="M55 36 L62 38" stroke="#1F1B16" stroke-width="1.8"/>
      <!-- Wide restless eyes -->
      <ellipse cx="42" cy="42" rx="3.5" ry="2.5" fill="#FFF" stroke="#1F1B16" stroke-width="1.2"/>
      <circle cx="43" cy="42" r="1.5" fill="#1F1B16"/>
      <ellipse cx="58" cy="42" rx="3.5" ry="2.5" fill="#FFF" stroke="#1F1B16" stroke-width="1.2"/>
      <circle cx="57" cy="42" r="1.5" fill="#1F1B16"/>
      <!-- Nose & tense lips -->
      <path d="M50 42 L48 49 L52 50" fill="none" stroke="#1F1B16" stroke-width="1.4"/>
      <line x1="46" y1="56" x2="54" y2="56" stroke="#9A3B2C" stroke-width="1.5"/>
      <!-- Sweat bead on temple -->
      <path d="M63 43 Q65 41 64 45 Z" fill="#7FA4A0"/>
    </svg>`
  },

  leung_ah_sei: {
    id: 'leung_ah_sei',
    name: '梁阿四',
    age: '35歲',
    title: '碼頭苦力（咕喱頭）',
    cases: [1, 2, 4],
    desc: '長年在內港十六號碼頭搬運貨物，身材魁梧，性情耿直暴躁。曾因老母重病被迫借高利貸，對當舖盤剝深惡痛絕。',
    svg: `<svg viewBox="0 0 100 100" class="portrait-svg">
      <circle cx="50" cy="50" r="48" fill="#F4EDE2" stroke="#1F1B16" stroke-width="2"/>
      <!-- Muscular shoulders with rough canvas vest -->
      <path d="M12 95 C16 68 30 64 50 64 C70 64 84 68 88 95 Z" fill="#4A3E33" stroke="#1F1B16" stroke-width="1.8"/>
      <!-- Sweat towel draped on neck -->
      <path d="M34 65 Q40 85 44 95 M66 65 Q60 85 56 95" fill="none" stroke="#DED4C5" stroke-width="5"/>
      <!-- Thick Neck & Rugged Jaw -->
      <rect x="42" y="54" width="16" height="15" fill="#C9A685" stroke="#1F1B16" stroke-width="1.5"/>
      <path d="M32 42 C32 28 40 22 50 22 C60 22 68 28 68 42 C68 56 60 62 50 62 C40 62 32 56 32 42 Z" fill="#D3B08E" stroke="#1F1B16" stroke-width="1.8"/>
      <!-- Short cropped hair -->
      <path d="M31 36 C31 22 40 18 50 18 C60 18 69 22 69 36 C64 24 58 22 50 22 C42 22 36 24 31 36 Z" fill="#1A1815"/>
      <!-- Heavy thick eyebrows -->
      <path d="M37 35 L47 37" stroke="#1A1815" stroke-width="3"/>
      <path d="M53 37 L63 35" stroke="#1A1815" stroke-width="3"/>
      <!-- Fierce deep-set eyes -->
      <circle cx="42" cy="41" r="2" fill="#1F1B16"/>
      <circle cx="58" cy="41" r="2" fill="#1F1B16"/>
      <path d="M38 39 Q42 38 46 41" fill="none" stroke="#1F1B16" stroke-width="1.2"/>
      <path d="M54 41 Q58 38 62 39" fill="none" stroke="#1F1B16" stroke-width="1.2"/>
      <!-- Rugged broad nose & scar -->
      <path d="M49 40 L48 50 L53 51" fill="none" stroke="#1F1B16" stroke-width="1.8"/>
      <line x1="42" y1="46" x2="45" y2="52" stroke="#8B3A2E" stroke-width="1.2"/>
      <!-- Tight mouth & five-o'clock shadow -->
      <line x1="43" y1="56" x2="57" y2="56" stroke="#1F1B16" stroke-width="2"/>
      <ellipse cx="50" cy="58" rx="8" ry="3" fill="none" stroke="#7D624C" stroke-width="1" stroke-dasharray="1,2"/>
    </svg>`
  },

  pak_lan: {
    id: 'pak_lan',
    name: '白蘭',
    age: '32歲',
    title: '名媛貴婦 · 抗日誌士遺孀',
    cases: [1, 4],
    desc: '端莊高雅，言行透著書香世家風骨。常著墨綠絲絨旗袍，其亡夫曾為抗戰時期嶺南文保志士，生前託管一批重要遺物。',
    svg: `<svg viewBox="0 0 100 100" class="portrait-svg">
      <circle cx="50" cy="50" r="48" fill="#F4EDE2" stroke="#1F1B16" stroke-width="2"/>
      <!-- Cheongsam / Silk dress in jade green -->
      <path d="M22 95 C25 74 36 68 50 68 C64 68 75 74 78 95 Z" fill="#2E4A3E" stroke="#1F1B16" stroke-width="1.8"/>
      <!-- High cheongsam collar with gold frog fastener -->
      <path d="M43 68 C43 60 57 60 57 68" fill="#2E4A3E" stroke="#1F1B16" stroke-width="1.5"/>
      <circle cx="53" cy="65" r="2" fill="#D4AF37"/>
      <!-- Graceful Neck & Face -->
      <rect x="45" y="54" width="10" height="12" fill="#EFE5D8" stroke="#1F1B16" stroke-width="1"/>
      <ellipse cx="50" cy="42" rx="16" ry="19" fill="#F3EAE0" stroke="#1F1B16" stroke-width="1.8"/>
      <!-- Elegant 1960s wavy bouffant hair -->
      <path d="M30 42 C28 26 38 16 50 16 C62 16 72 26 70 42 C74 46 66 52 64 45 C64 26 56 20 50 20 C44 20 36 26 36 45 C34 52 26 46 30 42 Z" fill="#1C1815"/>
      <!-- Refined curved eyebrows -->
      <path d="M38 36 Q43 32 46 35" fill="none" stroke="#1F1B16" stroke-width="1.6"/>
      <path d="M54 35 Q57 32 62 36" fill="none" stroke="#1F1B16" stroke-width="1.6"/>
      <!-- Almond eyes with eyeliner -->
      <ellipse cx="42" cy="40" rx="3.5" ry="2" fill="#FFF" stroke="#1F1B16" stroke-width="1.2"/>
      <circle cx="42" cy="40" r="1.5" fill="#1F1B16"/>
      <ellipse cx="58" cy="40" rx="3.5" ry="2" fill="#FFF" stroke="#1F1B16" stroke-width="1.2"/>
      <circle cx="58" cy="40" r="1.5" fill="#1F1B16"/>
      <!-- Slender nose & red lips -->
      <path d="M50 40 L49 48 L52 49" fill="none" stroke="#1F1B16" stroke-width="1.2"/>
      <path d="M46 54 Q50 52 54 54 Q50 57 46 54 Z" fill="#9A3B2C" stroke="#1F1B16" stroke-width="1"/>
      <!-- Pearl earring on right ear -->
      <circle cx="67" cy="46" r="2.8" fill="#FFFBF5" stroke="#1F1B16" stroke-width="1"/>
    </svg>`
  },

  // Case 2 Characters
  so_chi_keung: {
    id: 'so_chi_keung',
    name: '蘇志強',
    age: '28歲',
    title: '信達駁運 理貨員（遇害者）',
    cases: [2],
    desc: '內港碼頭理貨員，老實規矩，字跡工整。意外發現貨單暗藏走私鴉片與古董，暗自搜集證據卻招來殺身之禍。',
    svg: `<svg viewBox="0 0 100 100" class="portrait-svg">
      <circle cx="50" cy="50" r="48" fill="#F4EDE2" stroke="#1F1B16" stroke-width="2"/>
      <!-- Wet, stained linen shirt -->
      <path d="M18 95 C22 74 34 70 50 70 C66 70 78 74 82 95 Z" fill="#BCC5C7" stroke="#1F1B16" stroke-width="1.8"/>
      <!-- Wire spectacles & clerk hair -->
      <ellipse cx="50" cy="44" rx="17" ry="20" fill="#DDE4E4" stroke="#1F1B16" stroke-width="1.8"/>
      <path d="M33 36 C33 22 42 19 50 19 C58 19 67 22 67 36 C62 25 54 23 50 23 C46 23 38 25 33 36 Z" fill="#2D3033"/>
      <!-- Wire glasses -->
      <rect x="37" y="37" width="9" height="7" rx="2" fill="none" stroke="#485257" stroke-width="1.4"/>
      <rect x="54" y="37" width="9" height="7" rx="2" fill="none" stroke="#485257" stroke-width="1.4"/>
      <line x1="46" y1="40" x2="54" y2="40" stroke="#485257" stroke-width="1.2"/>
      <circle cx="41.5" cy="40.5" r="1.5" fill="#1F1B16"/>
      <circle cx="58.5" cy="40.5" r="1.5" fill="#1F1B16"/>
      <!-- Bruise on neck / rope marks -->
      <path d="M42 64 Q50 67 58 64" fill="none" stroke="#7A393B" stroke-width="3"/>
      <path d="M50 43 L49 49 L52 50" fill="none" stroke="#1F1B16" stroke-width="1.2"/>
      <line x1="45" y1="56" x2="55" y2="56" stroke="#4F5E63" stroke-width="1.5"/>
    </svg>`
  },

  chiu_tai_sing: {
    id: 'chiu_tai_sing',
    name: '趙大勝',
    age: '46歲',
    title: '「大勝號」帆船 船長',
    cases: [2],
    desc: '內港老行尊，往來珠江口數十載。滿臉風霜，言談粗豪，雖懂避開水警巡邏，但恪守水上人「不涉人命」的底線。',
    svg: `<svg viewBox="0 0 100 100" class="portrait-svg">
      <circle cx="50" cy="50" r="48" fill="#F4EDE2" stroke="#1F1B16" stroke-width="2"/>
      <!-- Fisherman blue canvas clothes -->
      <path d="M15 95 C20 70 32 66 50 66 C68 66 80 70 85 95 Z" fill="#2B3A4A" stroke="#1F1B16" stroke-width="1.8"/>
      <!-- Broad bamboo woven fisherman hat -->
      <ellipse cx="50" cy="26" rx="36" ry="12" fill="#CBB282" stroke="#1F1B16" stroke-width="1.8"/>
      <path d="M20 26 Q50 8 80 26" fill="#D8C396" stroke="#1F1B16" stroke-width="1.5"/>
      <!-- Weathered Face -->
      <ellipse cx="50" cy="48" rx="18" ry="19" fill="#B88A60" stroke="#1F1B16" stroke-width="1.8"/>
      <!-- Squinting sea-eyes & crows feet -->
      <path d="M37 44 L46 44" stroke="#1F1B16" stroke-width="2"/>
      <path d="M54 44 L63 44" stroke="#1F1B16" stroke-width="2"/>
      <circle cx="41.5" cy="44" r="1.5" fill="#1F1B16"/>
      <circle cx="58.5" cy="44" r="1.5" fill="#1F1B16"/>
      <!-- Gold earring on left ear -->
      <circle cx="31" cy="50" r="3" fill="none" stroke="#D4AF37" stroke-width="1.8"/>
      <!-- Beard & broad nose -->
      <path d="M50 43 L48 51 L53 52" fill="none" stroke="#1F1B16" stroke-width="1.6"/>
      <path d="M42 58 Q50 63 58 58" fill="#2E241E" stroke="#1F1B16" stroke-width="1"/>
    </svg>`
  },

  roberto_silva: {
    id: 'roberto_silva',
    name: '羅拔圖',
    age: '38歲',
    title: '澳葡水警 巡督（Inspector）',
    cases: [2, 4],
    desc: '土生葡人，執掌內港夜巡防務。精通粵葡雙語，表面收取常規規費默許小宗走私，暗地卻在秘密調查官商勾結的大案。',
    svg: `<svg viewBox="0 0 100 100" class="portrait-svg">
      <circle cx="50" cy="50" r="48" fill="#F4EDE2" stroke="#1F1B16" stroke-width="2"/>
      <!-- Colonial Khaki Police Tunic with Epaulettes -->
      <path d="M14 95 C18 70 32 66 50 66 C68 66 82 70 86 95 Z" fill="#6B624E" stroke="#1F1B16" stroke-width="1.8"/>
      <!-- Epaulettes with brass pip -->
      <path d="M18 74 L30 71 L32 76 L20 79 Z" fill="#8C8066" stroke="#1F1B16" stroke-width="1"/>
      <path d="M82 74 L70 71 L68 76 L80 79 Z" fill="#8C8066" stroke="#1F1B16" stroke-width="1"/>
      <!-- Police Peak Cap -->
      <path d="M26 24 C26 14 36 12 50 12 C64 12 74 14 74 24 Z" fill="#3D4552" stroke="#1F1B16" stroke-width="1.8"/>
      <path d="M24 24 L76 24 L74 28 L26 28 Z" fill="#1C1F26" stroke="#1F1B16" stroke-width="1.5"/>
      <circle cx="50" cy="20" r="3" fill="#D4AF37" stroke="#1F1B16" stroke-width="1"/>
      <!-- Sharp European features & Moustache -->
      <ellipse cx="50" cy="44" rx="17" ry="20" fill="#ECDCCB" stroke="#1F1B16" stroke-width="1.8"/>
      <!-- Eyebrows & intense gaze -->
      <path d="M38 36 L46 37" stroke="#1F1B16" stroke-width="2"/>
      <path d="M54 37 L62 36" stroke="#1F1B16" stroke-width="2"/>
      <circle cx="42" cy="41" r="2" fill="#2E4A62"/>
      <circle cx="58" cy="41" r="2" fill="#2E4A62"/>
      <path d="M50 39 L49 48 L53 49" fill="none" stroke="#1F1B16" stroke-width="1.5"/>
      <!-- Neat trimmed brown moustache -->
      <path d="M42 54 Q46 51 50 53 Q54 51 58 54 Q50 56 42 54 Z" fill="#3D2E24"/>
    </svg>`
  },

  luk_chat_ye: {
    id: 'luk_chat_ye',
    name: '陸七爺',
    age: '55歲',
    title: '德興行 東主 · 內港梟雄',
    cases: [2, 3, 4],
    desc: '內港走私網絡的實際掌控者，手眼通天。常坐茶樓包廂遙控局勢，表面熱心慈善粵劇，實則心狠手辣，不留活口。',
    svg: `<svg viewBox="0 0 100 100" class="portrait-svg">
      <circle cx="50" cy="50" r="48" fill="#F4EDE2" stroke="#1F1B16" stroke-width="2"/>
      <!-- Expensive dark silk brocade robe with gold collar -->
      <path d="M14 95 C18 70 32 66 50 66 C68 66 82 70 86 95 Z" fill="#1E2024" stroke="#1F1B16" stroke-width="1.8"/>
      <path d="M40 66 L50 80 L60 66" fill="none" stroke="#D4AF37" stroke-width="2"/>
      <!-- Heavy head with slick back hair -->
      <rect x="42" y="54" width="16" height="15" fill="#E8DACB" stroke="#1F1B16" stroke-width="1.5"/>
      <ellipse cx="50" cy="42" rx="19" ry="21" fill="#ECDCCF" stroke="#1F1B16" stroke-width="1.8"/>
      <path d="M31 36 C31 20 40 16 50 16 C60 16 69 20 69 36 C64 22 55 19 50 19 C45 19 36 22 31 36 Z" fill="#111"/>
      <!-- Slanted shrewd eyes -->
      <path d="M37 36 L47 38" stroke="#1F1B16" stroke-width="2.2"/>
      <path d="M53 38 L63 36" stroke="#1F1B16" stroke-width="2.2"/>
      <line x1="39" y1="41" x2="46" y2="43" stroke="#1F1B16" stroke-width="1.8"/>
      <line x1="54" y1="43" x2="61" y2="41" stroke="#1F1B16" stroke-width="1.8"/>
      <circle cx="43" cy="42" r="1.5" fill="#1F1B16"/>
      <circle cx="57" cy="42" r="1.5" fill="#1F1B16"/>
      <!-- Hooked nose & cold smirk -->
      <path d="M50 39 L48 49 L53 50" fill="none" stroke="#1F1B16" stroke-width="1.6"/>
      <path d="M44 56 Q50 54 56 57" fill="none" stroke="#9A3B2C" stroke-width="2"/>
      <!-- Jade thumb ring on hand holding ivory fan -->
      <rect x="68" y="76" width="16" height="6" rx="2" fill="#FFFBF0" stroke="#1F1B16" stroke-width="1.2" transform="rotate(-30 68 76)"/>
      <circle cx="70" cy="74" r="3.5" fill="#4F6F5F" stroke="#1F1B16" stroke-width="1"/>
    </svg>`
  },

  blind_chuen: {
    id: 'blind_chuen',
    name: '盲公全',
    age: '60歲',
    title: '碼頭算命先生',
    cases: [2],
    desc: '自幼失明，長年駐足內港十六號碼頭避雨棚替人測字算命。耳音極靈，能憑腳步聲與水響辨識來人及貨物種類。',
    svg: `<svg viewBox="0 0 100 100" class="portrait-svg">
      <circle cx="50" cy="50" r="48" fill="#F4EDE2" stroke="#1F1B16" stroke-width="2"/>
      <!-- Faded indigo tunic -->
      <path d="M16 95 C20 72 32 68 50 68 C68 68 80 72 84 95 Z" fill="#3F4954" stroke="#1F1B16" stroke-width="1.8"/>
      <!-- Head tilted listening -->
      <ellipse cx="50" cy="42" rx="17" ry="21" fill="#E6DAC8" stroke="#1F1B16" stroke-width="1.8" transform="rotate(-5 50 42)"/>
      <path d="M33 34 C33 22 42 18 50 18 C58 18 67 22 67 34 Z" fill="#696560"/>
      <!-- Classic round black glasses for blind teller -->
      <circle cx="42" cy="40" r="6" fill="#1A1815" stroke="#7A6855" stroke-width="1.5"/>
      <circle cx="58" cy="40" r="6" fill="#1A1815" stroke="#7A6855" stroke-width="1.5"/>
      <line x1="48" y1="40" x2="52" y2="40" stroke="#7A6855" stroke-width="1.5"/>
      <!-- Wrinkles and wispy goatee -->
      <path d="M50 41 L49 48 L52 49" fill="none" stroke="#1F1B16" stroke-width="1.2"/>
      <line x1="45" y1="55" x2="55" y2="55" stroke="#1F1B16" stroke-width="1.4"/>
      <path d="M48 58 L50 66 L52 58" fill="#EAE2D4" stroke="#9E968B" stroke-width="1"/>
    </svg>`
  },

  // Case 3 Characters
  fung_sin_ha: {
    id: 'fung_sin_ha',
    name: '鳳仙霞',
    age: '30歲',
    title: '當紅粵劇名伶 · 文武生',
    cases: [3],
    desc: '清平戲院台柱，扮相俊秀倜儻，名噪省港澳。持才傲物，與同班花旦及班主因分紅產生嫌隙，飲下潤喉茶後暴斃。',
    svg: `<svg viewBox="0 0 100 100" class="portrait-svg">
      <circle cx="50" cy="50" r="48" fill="#F4EDE2" stroke="#1F1B16" stroke-width="2"/>
      <!-- Opera Stage Costume in Vermilion & Gold -->
      <path d="M15 95 C20 72 32 66 50 66 C68 66 80 72 85 95 Z" fill="#9A3B2C" stroke="#1F1B16" stroke-width="1.8"/>
      <path d="M35 66 L50 82 L65 66" fill="#D4AF37" stroke="#1F1B16" stroke-width="1.2"/>
      <!-- Opera headdress & Phoenix Crown -->
      <path d="M28 26 C36 12 64 12 72 26 C68 20 60 16 50 16 C40 16 32 20 28 26 Z" fill="#1C1815"/>
      <circle cx="50" cy="14" r="4" fill="#D4AF37" stroke="#9A3B2C" stroke-width="1.2"/>
      <circle cx="38" cy="18" r="3" fill="#38BDF8"/>
      <circle cx="62" cy="18" r="3" fill="#38BDF8"/>
      <!-- Face with painted opera makeup accents -->
      <ellipse cx="50" cy="42" rx="16" ry="19" fill="#FBF7F0" stroke="#1F1B16" stroke-width="1.8"/>
      <!-- Red eye shadow and dramatic arched brows -->
      <path d="M36 34 Q42 30 46 33" stroke="#9A3B2C" stroke-width="2.5" fill="none"/>
      <path d="M54 33 Q58 30 64 34" stroke="#9A3B2C" stroke-width="2.5" fill="none"/>
      <ellipse cx="42" cy="38" rx="3.5" ry="2" fill="#FFF" stroke="#1F1B16" stroke-width="1.2"/>
      <circle cx="42" cy="38" r="1.5" fill="#1F1B16"/>
      <ellipse cx="58" cy="38" rx="3.5" ry="2" fill="#FFF" stroke="#1F1B16" stroke-width="1.2"/>
      <circle cx="58" cy="38" r="1.5" fill="#1F1B16"/>
      <!-- Poisoned lips: dark violet / purple tint -->
      <path d="M46 52 Q50 50 54 52 Q50 55 46 52 Z" fill="#4A1E4A" stroke="#1F1B16" stroke-width="1.2"/>
    </svg>`
  },

  yuen_so_kam: {
    id: 'yuen_so_kam',
    name: '阮素琴',
    age: '25歲',
    title: '二幫花旦 · 潛伏線人',
    cases: [3, 4],
    desc: '扮相溫婉，唱腔如黃鶯出谷。長年活在鳳仙霞光芒下，實則其初戀乃被走私集團害死的碼頭水手，暗中助白蘭蒐證。',
    svg: `<svg viewBox="0 0 100 100" class="portrait-svg">
      <circle cx="50" cy="50" r="48" fill="#F4EDE2" stroke="#1F1B16" stroke-width="2"/>
      <!-- Floral pink silk dressing jacket -->
      <path d="M18 95 C22 74 34 70 50 70 C66 70 78 74 82 95 Z" fill="#C47A82" stroke="#1F1B16" stroke-width="1.8"/>
      <!-- Elaborate opera hair with silver hairpins -->
      <ellipse cx="50" cy="42" rx="15" ry="18" fill="#F5EFE6" stroke="#1F1B16" stroke-width="1.8"/>
      <path d="M30 40 C28 24 38 16 50 16 C62 16 72 24 70 40 Z" fill="#1F1B16"/>
      <!-- Silver flower hairpin -->
      <circle cx="34" cy="24" r="3" fill="#DDE4E4" stroke="#1F1B16" stroke-width="1"/>
      <circle cx="66" cy="24" r="3" fill="#DDE4E4" stroke="#1F1B16" stroke-width="1"/>
      <!-- Delicate sorrowful eyes -->
      <path d="M38 36 Q43 33 46 35" stroke="#1F1B16" stroke-width="1.5" fill="none"/>
      <path d="M54 35 Q57 33 62 36" stroke="#1F1B16" stroke-width="1.5" fill="none"/>
      <circle cx="42" cy="40" r="1.6" fill="#1F1B16"/>
      <circle cx="58" cy="40" r="1.6" fill="#1F1B16"/>
      <!-- Red lip -->
      <path d="M47 52 Q50 51 53 52 Q50 54 47 52 Z" fill="#9A3B2C"/>
    </svg>`
  },

  master_liu: {
    id: 'master_liu',
    name: '廖班主',
    age: '52歲',
    title: '清平劇團 班主',
    cases: [3],
    desc: '精打細算的老油條，周旋於黑白兩道與贊助豪客之間。因在葡京賭廳欠下巨額賭債，瀕臨破產，急欲侵吞保險金。',
    svg: `<svg viewBox="0 0 100 100" class="portrait-svg">
      <circle cx="50" cy="50" r="48" fill="#F4EDE2" stroke="#1F1B16" stroke-width="2"/>
      <path d="M16 95 C20 72 32 68 50 68 C68 68 80 72 84 95 Z" fill="#3D3730" stroke="#1F1B16" stroke-width="1.8"/>
      <!-- Round brass spectacles & worried forehead -->
      <ellipse cx="50" cy="42" rx="18" ry="21" fill="#E6DAC8" stroke="#1F1B16" stroke-width="1.8"/>
      <path d="M32 34 C32 20 42 16 50 16 C58 16 68 20 68 34 Z" fill="#302B24"/>
      <circle cx="42" cy="40" r="5" fill="none" stroke="#A88B4D" stroke-width="1.5"/>
      <circle cx="58" cy="40" r="5" fill="none" stroke="#A88B4D" stroke-width="1.5"/>
      <line x1="47" y1="40" x2="53" y2="40" stroke="#A88B4D" stroke-width="1.5"/>
      <circle cx="42" cy="40" r="1.5" fill="#1F1B16"/>
      <circle cx="58" cy="40" r="1.5" fill="#1F1B16"/>
      <!-- Worried furrow lines -->
      <line x1="46" y1="28" x2="54" y2="28" stroke="#A39381" stroke-width="1"/>
      <line x1="47" y1="31" x2="53" y2="31" stroke="#A39381" stroke-width="1"/>
      <path d="M50 41 L49 49 L53 50" fill="none" stroke="#1F1B16" stroke-width="1.4"/>
      <line x1="44" y1="56" x2="56" y2="56" stroke="#1F1B16" stroke-width="1.6"/>
    </svg>`
  },

  fong_jie: {
    id: 'fong_jie',
    name: '芳姐',
    age: '48歲',
    title: '戲班衣箱管事',
    cases: [3],
    desc: '掌管劇團首飾箱與後台百寶箱三十年，目光銳利，對後台眾人隱私瞭如指掌。為人嚴苛冷靜，只效忠劇團傳承。',
    svg: `<svg viewBox="0 0 100 100" class="portrait-svg">
      <circle cx="50" cy="50" r="48" fill="#F4EDE2" stroke="#1F1B16" stroke-width="2"/>
      <path d="M18 95 C22 74 34 70 50 70 C66 70 78 74 82 95 Z" fill="#292C33" stroke="#1F1B16" stroke-width="1.8"/>
      <!-- Measuring tape over neck -->
      <path d="M36 70 Q40 85 43 95 M64 70 Q60 85 57 95" fill="none" stroke="#F59E0B" stroke-width="2.5"/>
      <!-- Tight bun with silver pin -->
      <circle cx="50" cy="20" r="8" fill="#1C1815"/>
      <line x1="40" y1="18" x2="60" y2="22" stroke="#D1D5DB" stroke-width="2"/>
      <ellipse cx="50" cy="44" rx="16" ry="19" fill="#E8DDD0" stroke="#1F1B16" stroke-width="1.8"/>
      <!-- Sharp observant eyes -->
      <path d="M38 38 L46 39" stroke="#1F1B16" stroke-width="1.8"/>
      <path d="M54 39 L62 38" stroke="#1F1B16" stroke-width="1.8"/>
      <circle cx="42" cy="42" r="1.5" fill="#1F1B16"/>
      <circle cx="58" cy="42" r="1.5" fill="#1F1B16"/>
      <path d="M50 42 L49 49 L52 50" fill="none" stroke="#1F1B16" stroke-width="1.4"/>
      <line x1="46" y1="56" x2="54" y2="56" stroke="#1F1B16" stroke-width="1.6"/>
    </svg>`
  },

  young_master_tse: {
    id: 'young_master_tse',
    name: '謝少爺',
    age: '24歲',
    title: '紈絝子弟 · 狂熱戲迷',
    cases: [3],
    desc: '大富商之幼子，身穿昂貴西裝，每逢鳳仙霞登台必包前排雅座。曾送厚禮求愛遭拒，羞惱下揚言要讓鳳仙霞「永遠開唔到聲」。',
    svg: `<svg viewBox="0 0 100 100" class="portrait-svg">
      <circle cx="50" cy="50" r="48" fill="#F4EDE2" stroke="#1F1B16" stroke-width="2"/>
      <!-- Double-breasted charcoal Western suit with silk tie -->
      <path d="M16 95 C20 72 32 68 50 68 C68 68 80 72 84 95 Z" fill="#242B35" stroke="#1F1B16" stroke-width="1.8"/>
      <path d="M46 68 L50 82 L54 68" fill="#9A3B2C" stroke="#1F1B16" stroke-width="1.2"/>
      <!-- 1960s Slicked Pompadour Hair -->
      <path d="M32 38 C32 20 42 16 50 16 C60 16 68 20 68 38 C64 26 56 22 50 22 C42 22 36 26 32 38 Z" fill="#1C1815"/>
      <ellipse cx="50" cy="44" rx="16" ry="19" fill="#F0E5D8" stroke="#1F1B16" stroke-width="1.8"/>
      <!-- Haughty smug eyebrows & smirk -->
      <path d="M38 37 L46 35" stroke="#1F1B16" stroke-width="2"/>
      <path d="M54 36 L62 38" stroke="#1F1B16" stroke-width="2"/>
      <circle cx="42" cy="41" r="1.8" fill="#1F1B16"/>
      <circle cx="58" cy="41" r="1.8" fill="#1F1B16"/>
      <path d="M50 41 L49 48 L52 49" fill="none" stroke="#1F1B16" stroke-width="1.4"/>
      <path d="M45 55 Q50 54 55 57" fill="none" stroke="#9A3B2C" stroke-width="1.8"/>
    </svg>`
  },

  // Case 4 Characters
  pereira: {
    id: 'pereira',
    name: '佩雷拉',
    age: '50歲',
    title: '澳督政務顧問（遇害者）',
    cases: [4],
    desc: '莫督憲內閣首席華人事務顧問，掌控口岸特許批給與洋行牌照。表面推崇中葡親善，私下卻利用職權為陸七爺走私集團充當保護傘。',
    svg: `<svg viewBox="0 0 100 100" class="portrait-svg">
      <circle cx="50" cy="50" r="48" fill="#F4EDE2" stroke="#1F1B16" stroke-width="2"/>
      <!-- Grey European wool suit & gold watch chain -->
      <path d="M14 95 C18 70 32 66 50 66 C68 66 82 70 86 95 Z" fill="#3D444D" stroke="#1F1B16" stroke-width="1.8"/>
      <path d="M40 78 Q50 84 60 78" fill="none" stroke="#D4AF37" stroke-width="1.5"/>
      <!-- Greying temples, distinguished colonial profile -->
      <ellipse cx="50" cy="42" rx="17" ry="21" fill="#EAE0D4" stroke="#1F1B16" stroke-width="1.8"/>
      <path d="M31 36 C31 20 40 16 50 16 C60 16 69 20 69 36 C65 24 58 20 50 20 C42 20 35 24 31 36 Z" fill="#36393E"/>
      <path d="M33 30 C38 24 62 24 67 30" fill="none" stroke="#CBD5E1" stroke-width="1.8" stroke-dasharray="2,2"/>
      <!-- Aquiline nose & bullet wound hole on chest -->
      <circle cx="38" cy="80" r="2.5" fill="#7F1D1D" stroke="#1F1B16" stroke-width="1"/>
      <circle cx="42" cy="40" r="1.8" fill="#1F1B16"/>
      <circle cx="58" cy="40" r="1.8" fill="#1F1B16"/>
      <path d="M50 38 L48 48 L53 49" fill="none" stroke="#1F1B16" stroke-width="1.6"/>
      <line x1="44" y1="56" x2="56" y2="56" stroke="#1F1B16" stroke-width="1.8"/>
    </svg>`
  },

  father_stubbs: {
    id: 'father_stubbs',
    name: '司徒拔神父',
    age: '62歲',
    title: '西望洋主教山小堂 司鐸',
    cases: [4],
    desc: '天主教耶穌會神父，在澳門傳教逾三十載。主持主教山小堂，精通拉丁文與古籍整理，深知西望洋官邸內各路名流往來的秘辛。',
    svg: `<svg viewBox="0 0 100 100" class="portrait-svg">
      <circle cx="50" cy="50" r="48" fill="#F4EDE2" stroke="#1F1B16" stroke-width="2"/>
      <!-- Black Jesuit Cassock with White Clerical Collar -->
      <path d="M15 95 C20 70 32 66 50 66 C68 66 80 70 85 95 Z" fill="#18181B" stroke="#1F1B16" stroke-width="1.8"/>
      <rect x="44" y="64" width="12" height="6" fill="#FFF" stroke="#1F1B16" stroke-width="1"/>
      <!-- Wooden Cross Necklace -->
      <path d="M50 72 L50 86 M45 77 L55 77" fill="none" stroke="#78350F" stroke-width="2"/>
      <!-- Venerable Greying Head -->
      <ellipse cx="50" cy="42" rx="17" ry="21" fill="#E8DFD3" stroke="#1F1B16" stroke-width="1.8"/>
      <path d="M32 36 C32 24 40 20 50 20 C60 20 68 24 68 36 Z" fill="#9CA3AF"/>
      <!-- Kind, sorrowful scholarly eyes with crow's feet -->
      <circle cx="42" cy="41" r="1.6" fill="#1F1B16"/>
      <circle cx="58" cy="41" r="1.6" fill="#1F1B16"/>
      <path d="M37 40 Q41 38 45 42" fill="none" stroke="#1F1B16" stroke-width="1"/>
      <path d="M55 42 Q59 38 63 40" fill="none" stroke="#1F1B16" stroke-width="1"/>
      <path d="M50 40 L49 48 L53 49" fill="none" stroke="#1F1B16" stroke-width="1.4"/>
      <path d="M45 56 Q50 54 55 56" fill="none" stroke="#1F1B16" stroke-width="1.4"/>
    </svg>`
  },

  mute_gardener: {
    id: 'mute_gardener',
    name: '啞巴花匠',
    age: '42歲',
    title: '官邸花匠 · 關鍵目擊者',
    cases: [4],
    desc: '主教山官邸的老花匠，口不能言但耳聰目明。中秋夜在花園修剪茶花時，目睹了松林中黑影交接與致命槍聲。',
    svg: `<svg viewBox="0 0 100 100" class="portrait-svg">
      <circle cx="50" cy="50" r="48" fill="#F4EDE2" stroke="#1F1B16" stroke-width="2"/>
      <!-- Brown gardener cotton tunic & apron -->
      <path d="M16 95 C20 72 32 68 50 68 C68 68 80 72 84 95 Z" fill="#4B3D30" stroke="#1F1B16" stroke-width="1.8"/>
      <path d="M38 74 L62 74 L60 95 L40 95 Z" fill="#715D48" stroke="#1F1B16" stroke-width="1.2"/>
      <!-- Weathered rustic head with straw cloth wrap -->
      <path d="M31 34 Q50 16 69 34 Z" fill="#8C7A65" stroke="#1F1B16" stroke-width="1.5"/>
      <ellipse cx="50" cy="45" rx="17" ry="20" fill="#C29D7A" stroke="#1F1B16" stroke-width="1.8"/>
      <!-- Wide shock/witness eyes -->
      <ellipse cx="42" cy="42" rx="4" ry="3" fill="#FFF" stroke="#1F1B16" stroke-width="1.2"/>
      <circle cx="42" cy="42" r="1.8" fill="#1F1B16"/>
      <ellipse cx="58" cy="42" rx="4" ry="3" fill="#FFF" stroke="#1F1B16" stroke-width="1.2"/>
      <circle cx="58" cy="42" r="1.8" fill="#1F1B16"/>
      <path d="M50 43 L48 51 L53 52" fill="none" stroke="#1F1B16" stroke-width="1.6"/>
      <!-- Parted mute lips in alarm -->
      <ellipse cx="50" cy="58" rx="3.5" ry="2.5" fill="#1F1B16"/>
    </svg>`
  }
};
