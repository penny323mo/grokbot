/**
 * data.js - Comprehensive preset configurations, styles, palettes, and curated recipes.
 * Supports both Browser (window.PROMPT_DATA) and Node.js (module.exports).
 */

const PROMPT_DATA = {
  // 1. 主體類別與示範 (Subject Categories & Sample Subjects)
  subjectCategories: [
    {
      id: "portrait",
      zh: "人像",
      en: "Portrait",
      descZh: "人物主體、特寫或街頭人物",
      sampleZh: "一位穿著深色風衣、眼神堅毅的年輕女性",
      sampleEn: "a young woman in a dark trench coat with a determined gaze"
    },
    {
      id: "animal",
      zh: "動物",
      en: "Animal",
      descZh: "野生動物、萌寵或靈動生物",
      sampleZh: "一隻毛茸茸的金毛尋回犬在草地歡跑",
      sampleEn: "a fluffy golden retriever joyfully running across a lush green meadow"
    },
    {
      id: "product",
      zh: "產品",
      en: "Product",
      descZh: "商業靜物、香水、腕錶或電子產品",
      sampleZh: "一瓶晶瑩剔透的高級玻璃香水瓶，水滴凝結於瓶身",
      sampleEn: "a luxury crystalline glass perfume bottle with delicate condensation droplets"
    },
    {
      id: "architecture",
      zh: "建築",
      en: "Architecture",
      descZh: "未來都市、古樸寺廟或極簡現代家居",
      sampleZh: "一座建在懸崖邊緣的極簡現代混凝土別墅",
      sampleEn: "a minimalist modern concrete villa perched dramatically on a cliff edge"
    },
    {
      id: "food",
      zh: "食物",
      en: "Food",
      descZh: "精緻料理、甜品或熱氣騰騰的街頭美食",
      sampleZh: "一碗熱氣騰騰的日式叉燒拉麵，配有溏心蛋與青蔥",
      sampleEn: "a steaming bowl of authentic Japanese tonkotsu ramen with soft-boiled ajitsuke egg and scallions"
    },
    {
      id: "landscape",
      zh: "風景",
      en: "Landscape",
      descZh: "自然風光、山巒、海浪或浩瀚星空",
      sampleZh: "日落時分被金色夕陽籠罩的崎嶇雪山山脈",
      sampleEn: "rugged snow-capped mountain peaks bathed in golden twilight glow"
    },
    {
      id: "scifi_mecha",
      zh: "科幻角色",
      en: "Sci-Fi / Mecha",
      descZh: "賽博朋克義體戰士、機甲或未來生化人",
      sampleZh: "身穿戰術裝甲、配備發光機械義肢的賽博朋克生化戰士",
      sampleEn: "a cyberpunk cyborg warrior equipped with glowing cybernetic limbs in tactical matte armor"
    },
    {
      id: "fantasy",
      zh: "奇幻神獸",
      en: "Fantasy",
      descZh: "東方青龍、精靈、獨角獸或發光魔法生物",
      sampleZh: "一隻盤旋於雲霧山巔、龍鱗散發微光的青色東方神龍",
      sampleEn: "a majestic iridescent azure Chinese dragon coiling through misty mountain peaks"
    },
    {
      id: "vehicle",
      zh: "車輛",
      en: "Vehicle",
      descZh: "復古跑車、太空飛船或未來懸浮電單車",
      sampleZh: "一輛馳騁在雨夜霓虹街道的深灰色經典復古保時捷911",
      sampleEn: "a classic vintage dark grey Porsche 911 cruising on rain-slicked neon streets"
    },
    {
      id: "street",
      zh: "街頭人物",
      en: "Street Character",
      descZh: "咖啡師、街頭藝人或深夜麵檔店主",
      sampleZh: "一位在昏黃燈光下專注手沖咖啡的資深咖啡師",
      sampleEn: "an artisan barista meticulously brewing pour-over coffee under warm vintage lamplight"
    }
  ],

  // 2. 場景 (Scene & Setting)
  scenes: [
    { id: "city_night", zh: "雨夜都市", en: "rain-soaked urban city street at night", snippetZh: "雨夜中的繁華城市街道" },
    { id: "macau_old_street", zh: "澳門舊街石板路", en: "historic cobblestone alley in old Macau with Portuguese colonial facades", snippetZh: "澳門歷史石板街與葡式洋樓" },
    { id: "misty_forest", zh: "晨霧森林", en: "enchanted misty pine forest with sunbeams piercing the canopy", snippetZh: "清晨雲霧繚繞的幽靜松林" },
    { id: "studio_backdrop", zh: "極簡攝影棚", en: "clean minimalist studio backdrop with seamless soft shadows", snippetZh: "乾淨高雅的無縫攝影棚背景" },
    { id: "cyberpunk_street", zh: "賽博朋克街道", en: "dense cyberpunk city street lined with vibrant holographic signs and neon advertisements", snippetZh: "密佈全息投影與霓虹招牌的賽博朋克街道" },
    { id: "golden_beach", zh: "黃昏沙灘", en: "tranquil ocean beach with gentle rolling waves at golden sunset", snippetZh: "夕陽餘暉下海浪輕湧的寧靜沙灘" },
    { id: "cozy_cafe", zh: "溫暖咖啡館", en: "cozy warm coffee shop with wooden interior and rain outside the window", snippetZh: "窗外微雨、原木質感的溫馨咖啡館" },
    { id: "outer_space", zh: "浩瀚外太空", en: "vast deep space nebula with distant shimmering star clusters and cosmic dust", snippetZh: "深邃瑰麗的星雲與璀璨宇宙星塵" },
    { id: "harbour_waterfront", zh: "海港天際線", en: "vibrant Victoria Harbour waterfront with panoramic cityscape skyline", snippetZh: "波光粼粼的維港水面與繁華都市天際線" },
    { id: "alien_desert", zh: "外星異星荒漠", en: "desolate alien desert planet with monolithic rock formations and atmospheric haze", snippetZh: "廣袤神秘的外星荒漠與發光巨石遺跡" },
    { id: "zen_garden", zh: "枯山水庭園", en: "traditional serene Japanese zen stone garden with raked gravel and moss", snippetZh: "充滿禪意的日式枯山水青苔庭園" },
    { id: "modern_penthouse", zh: "高空頂層公寓", en: "luxurious modern penthouse apartment with floor-to-ceiling panoramic skyline view", snippetZh: "俯瞰壯麗城市天際線的奢華落地窗天際複式" },
    { id: "underwater_reef", zh: "蔚藍珊瑚礁", en: "vibrant underwater coral reef illuminated by shafts of sunlight through turquoise water", snippetZh: "陽光穿透湛藍海水灑落的繽紛珊瑚礁" },
    { id: "desert_dunes", zh: "黃昏沙漠沙丘", en: "vast windswept desert dunes under a dramatic glowing twilight sky", snippetZh: "暮色籠罩、風紋綿延的壯闊沙漠沙丘" }
  ],

  // 3. 風格 (Visual Styles - at least 16 presets with CSS visual gradient patterns)
  styles: [
    {
      id: "cinematic",
      zh: "電影感寫實",
      en: "cinematic film still, 35mm photograph, panavision lens, movie scene",
      hintEn: "Cinematic Film Still",
      descZh: "具備好萊塢電影氛圍的景深與質感",
      cssThumb: "linear-gradient(135deg, #09203f 0%, #537895 100%)",
      patternType: "cinematic"
    },
    {
      id: "photorealistic",
      zh: "超逼真相片",
      en: "photorealistic, hyper-realistic, natural skin texture, 8k professional photography",
      hintEn: "Photorealistic Photography",
      descZh: "如同頂級單鏡反光機拍攝，細節毫髮畢現",
      cssThumb: "linear-gradient(135deg, #1f1c2c 0%, #928dab 100%)",
      patternType: "photo"
    },
    {
      id: "ghibli",
      zh: "吉卜力動畫風",
      en: "Studio Ghibli-like hand-drawn anime background, lush painted scenery, nostalgic pastoral aesthetic",
      hintEn: "Studio Ghibli Anime",
      descZh: "溫暖柔和的日系手繪厚塗水彩動畫質感",
      cssThumb: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
      patternType: "anime"
    },
    {
      id: "pixar_3d",
      zh: "3D 皮克斯渲染",
      en: "Pixar and Disney 3D animation style, octane render, soft ambient occlusion, charming stylised character design",
      hintEn: "3D Pixar Animation",
      descZh: "富有立體感、質感細膩可愛的 3D 動畫光影",
      cssThumb: "linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%)",
      patternType: "render3d"
    },
    {
      id: "watercolor",
      zh: "水彩插畫",
      en: "delicate watercolor painting, wet-on-wet technique, paper texture, soft translucent washes",
      hintEn: "Delicate Watercolor",
      descZh: "輕柔通透的水暈滲化與自然棉紙質感",
      cssThumb: "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)",
      patternType: "watercolor"
    },
    {
      id: "oil_painting",
      zh: "古典油畫",
      en: "classic oil painting, rich impasto brushwork, textured linen canvas, dramatic chiaroscuro masterwork",
      hintEn: "Classical Oil Painting",
      descZh: "濃厚筆觸、肌理分明的古典藝術巨作",
      cssThumb: "linear-gradient(135deg, #432b13 0%, #b27936 100%)",
      patternType: "oil"
    },
    {
      id: "ink_wash",
      zh: "東方水墨",
      en: "traditional East Asian ink wash painting, sumi-e, bold brush calligraphy, misty negative space, rice paper",
      hintEn: "Traditional Ink Wash (水墨)",
      descZh: "濃淡留白、氣韻生動的東方傳統水墨意境",
      cssThumb: "linear-gradient(135deg, #141414 0%, #525252 50%, #ffffff 100%)",
      patternType: "ink"
    },
    {
      id: "cyberpunk_neon",
      zh: "賽博朋克霓虹",
      en: "cyberpunk aesthetic, high contrast neon lighting, reflective surfaces, chromatic aberration, synthwave dystopian glow",
      hintEn: "Cyberpunk Neon",
      descZh: "電光藍與洋紅交織的高對比度未來科技風",
      cssThumb: "linear-gradient(135deg, #ff007f 0%, #7928ca 50%, #00f0ff 100%)",
      patternType: "neon"
    },
    {
      id: "vaporwave",
      zh: "蒸汽波復古",
      en: "vaporwave aesthetic, pastel glitch, 90s retro surrealism, palm silhouettes, lo-fi aesthetic",
      hintEn: "Vaporwave Retro",
      descZh: "90年代復古超現實主義與夢幻粉紫故障美學",
      cssThumb: "linear-gradient(135deg, #eaafc8 0%, #654ea3 100%)",
      patternType: "vapor"
    },
    {
      id: "film_noir",
      zh: "黑白黑色電影",
      en: "film noir style, high contrast black and white, deep shadows, venetian blind lighting, gritty 1940s mystery",
      hintEn: "Film Noir (黑色電影)",
      descZh: "1940年代經典硬派偵探風格，極度明暗對比",
      cssThumb: "linear-gradient(135deg, #000000 0%, #2b2b2b 60%, #a6a6a6 100%)",
      patternType: "noir"
    },
    {
      id: "polaroid_35mm",
      zh: "寶麗來/35mm菲林",
      en: "vintage Polaroid photograph, 35mm film grain, authentic light leaks, warm nostalgic faded hues",
      hintEn: "Polaroid / 35mm Film",
      descZh: "帶有漏光、顆粒感與溫暖褪色感的復古膠卷相片",
      cssThumb: "linear-gradient(135deg, #d38312 0%, #a83279 100%)",
      patternType: "film"
    },
    {
      id: "isometric_3d",
      zh: "等距 3D 微縮模型",
      en: "isometric 3D diorama, tilt-shift miniature, blender 3d render, adorable micro world, clean lighting",
      hintEn: "Isometric 3D Diorama",
      descZh: "精緻小巧、立體感極強的等軸測微觀世界",
      cssThumb: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      patternType: "isometric"
    },
    {
      id: "claymation",
      zh: "定格黏土動畫",
      en: "stop-motion claymation style, tactile plasticine texture, visible fingerprint imperfections, warm miniature stage",
      hintEn: "Claymation / Stop-Motion",
      descZh: "充滿手作溫度、黏土指紋質感的定格黏土偶",
      cssThumb: "linear-gradient(135deg, #e65c00 0%, #f9d423 100%)",
      patternType: "clay"
    },
    {
      id: "low_poly",
      zh: "低多邊形 Low-Poly",
      en: "low-poly geometric art, faceted surfaces, sharp polygonal mesh, minimalist vibrant modern aesthetic",
      hintEn: "Low-Poly Geometric",
      descZh: "簡約純粹的多邊形幾何切面與純色光影",
      cssThumb: "linear-gradient(135deg, #00b4db 0%, #0083b0 100%)",
      patternType: "lowpoly"
    },
    {
      id: "ukiyo_e",
      zh: "浮世繪版畫",
      en: "traditional Japanese ukiyo-e woodblock print, bold ink outlines, flat decorative color fills, wave and cloud motifs",
      hintEn: "Ukiyo-e Woodblock Print",
      descZh: "江戶時代木版畫線條、裝飾性色彩與浪花雲紋",
      cssThumb: "linear-gradient(135deg, #2c3e50 0%, #e74c3c 100%)",
      patternType: "ukiyoe"
    },
    {
      id: "fashion_editorial",
      zh: "高級時尚大片",
      en: "high-fashion editorial photography, Vogue cover aesthetic, dramatic avant-garde styling, studio strobe lighting",
      hintEn: "Fashion Editorial",
      descZh: "前衛大膽的高級時裝雜誌封面質感",
      cssThumb: "linear-gradient(135deg, #161616 0%, #d4af37 100%)",
      patternType: "fashion"
    },
    {
      id: "baroque_fantasy",
      zh: "巴洛克暗黑奇幻",
      en: "baroque dark fantasy art, ornate gold filigree, gothic architecture, dramatic chiaroscuro, ethereal grandeur",
      hintEn: "Baroque Dark Fantasy",
      descZh: "華麗繁複的金色花紋、哥德式雄偉與神秘暗黑",
      cssThumb: "linear-gradient(135deg, #200122 0%, #6f0000 100%)",
      patternType: "baroque"
    },
    {
      id: "retro_anime",
      zh: "80年代復古賽璐珞",
      en: "1980s retro anime style, cel animation texture, slight chromatic aberration, hand-painted anime aesthetic",
      hintEn: "80s Cel Anime",
      descZh: "80-90年代經典賽璐珞手繪日漫老番浪漫氛圍",
      cssThumb: "linear-gradient(135deg, #8a2387 0%, #e94057 50%, #f27121 100%)",
      patternType: "retroanime"
    }
  ],

  // 風格修飾關鍵詞 (Style Modifiers)
  styleModifiers: [
    { id: "highly_detailed", zh: "極致細節", en: "highly detailed" },
    { id: "sharp_focus", zh: "銳利對焦", en: "sharp focus" },
    { id: "creamy_bokeh", zh: "柔美散景", en: "creamy shallow bokeh" },
    { id: "film_grain", zh: "菲林顆粒感", en: "subtle natural film grain" },
    { id: "octane_render", zh: "Octane 頂級渲染", en: "octane render engine" },
    { id: "unreal_engine_5", zh: "虛幻引擎 5 質感", en: "unreal engine 5 graphics" },
    { id: "ray_tracing", zh: "光線追蹤反射", en: "realistic ray tracing reflections" },
    { id: "volumetric_light", zh: "體積光丁達爾效應", en: "atmospheric volumetric light beams" },
    { id: "masterpiece", zh: "傑作級質感", en: "masterpiece quality" }
  ],

  // 4. 光線 (Lighting)
  lightings: [
    { id: "golden_hour", zh: "黃金時刻", en: "warm golden hour sunlight, low angle glow", snippetZh: "日落前溫暖迷人的黃金光線" },
    { id: "blue_hour", zh: "藍調時刻", en: "serene blue hour ambient twilight", snippetZh: "日落後清涼靜謐的深藍暮色" },
    { id: "soft_window", zh: "柔和窗光", en: "soft diffused natural window light, gentle directional illumination", snippetZh: "透過大窗灑入的均勻柔和自然光" },
    { id: "rim_light", zh: "立體輪廓光", en: "dramatic rim lighting outlining the silhouette", snippetZh: "勾勒主體輪廓的立體邊緣逆光" },
    { id: "neon_glow", zh: "電光霓虹", en: "vibrant moody neon glow with colourful spill light", snippetZh: "色彩繽紛散落的霓虹燈環境光" },
    { id: "god_rays", zh: "丁達爾聖光", en: "volumetric atmospheric god rays streaming through haze", snippetZh: "穿透薄霧的光柱丁達爾光束" },
    { id: "rembrandt", zh: "倫勃朗光", en: "classic Rembrandt lighting with distinctive triangular cheek highlight", snippetZh: "經典油畫式單側三角面頰受光" },
    { id: "high_key", zh: "明亮高調光", en: "bright high-key clean illumination with minimal shadows", snippetZh: "明亮通透、極少暗部的高調商業光" },
    { id: "low_key", zh: "幽暗低調光", en: "moody low-key chiaroscuro lighting, deep mysterious shadows", snippetZh: "陰暗神秘、光影對比強烈的低調暗黑光" },
    { id: "candlelight", zh: "溫暖燭光", en: "flickering intimate warm candlelight with soft amber glow", snippetZh: "微弱搖曳、溫暖親密的琥珀色燭光" },
    { id: "overcast_diffuse", zh: "陰天漫射光", en: "soft overcast day lighting, shadowless neutral illumination", snippetZh: "陰天溫和無強烈陰影的漫射柔光" },
    { id: "cinematic_dramatic", zh: "電影戲劇光", en: "cinematic moody dramatic lighting with high dynamic contrast", snippetZh: "充滿張力與戲劇衝擊感的電影級光影" }
  ],

  // 5. 鏡頭與相機 (Camera, Angle, Lens, Aperture)
  cameras: {
    shotSizes: [
      { id: "extreme_close_up", zh: "大特寫 (ECU)", en: "extreme close-up shot focused on fine details", snippetZh: "聚焦極微小細節的大特寫" },
      { id: "close_up", zh: "特寫 (CU)", en: "close-up portrait shot", snippetZh: "主體面部或主輪廓特寫" },
      { id: "medium_shot", zh: "中景 (MS)", en: "medium shot from the waist up", snippetZh: "半身腰部以上的中景" },
      { id: "cowboy_shot", zh: "七分身 (Cowboy)", en: "cowboy shot framed from midthigh up", snippetZh: "膝蓋以上帶有姿態的七分身構圖" },
      { id: "full_shot", zh: "全身鏡 (FS)", en: "full body shot showing entire figure in environment", snippetZh: "全身及整體姿態全景" },
      { id: "wide_establishing", zh: "廣角全景 (Wide)", en: "wide establishing shot capturing expansive surrounding environment", snippetZh: "交代環境與氛圍的廣闊大景" }
    ],
    angles: [
      { id: "eye_level", zh: "平視角度", en: "eye-level camera angle", snippetZh: "自然親切的平視視角" },
      { id: "low_angle", zh: "仰拍低角度", en: "dramatic low-angle perspective looking up, imposing feel", snippetZh: "向上仰望、凸顯威嚴的低視角" },
      { id: "high_angle", zh: "俯拍高角度", en: "high-angle perspective looking down", snippetZh: "由上而下俯瞰的高視角" },
      { id: "birds_eye", zh: "垂直鳥瞰", en: "top-down bird's-eye view, orthogonal perspective", snippetZh: "90度正上方鳥瞰大格局" },
      { id: "dutch_angle", zh: "荷蘭傾斜角", en: "dynamic Dutch tilted angle adding psychological tension", snippetZh: "傾斜鏡頭、增添張力與動態感" },
      { id: "worms_eye", zh: "貼地蟲視角", en: "extreme ground-level worm's-eye perspective", snippetZh: "緊貼地面的超低蟲眼透視" }
    ],
    lenses: [
      { id: "lens_24mm", zh: "24mm 廣角", en: "24mm wide-angle prime lens, expansive field of view", snippetZh: "24mm 壯闊大視角" },
      { id: "lens_35mm", zh: "35mm 紀實", en: "35mm documentary lens, natural environmental storytelling", snippetZh: "35mm 人文環境故事感" },
      { id: "lens_50mm", zh: "50mm 人眼標準", en: "50mm standard prime lens, natural human eye perspective", snippetZh: "50mm 最貼近肉眼真實透視" },
      { id: "lens_85mm", zh: "85mm 人像王", en: "85mm portrait prime lens, pleasing compression and separation", snippetZh: "85mm 人物輪廓立體壓縮" },
      { id: "lens_macro", zh: "100mm 微距", en: "100mm macro lens, ultra-sharp microscopic detail", snippetZh: "微觀紋理極致纖細" },
      { id: "lens_telephoto", zh: "200mm 長焦", en: "200mm telephoto lens, strong background compression", snippetZh: "200mm 強烈背景壓縮感" },
      { id: "lens_anamorphic", zh: "變形寬銀幕", en: "anamorphic cinema lens with characteristic oval bokeh and horizontal blue flare", snippetZh: "電影寬銀幕橢圓散景與橫向拉絲光斑" },
      { id: "lens_fisheye", zh: "魚眼鏡頭", en: "fisheye lens, dramatic circular barrel distortion", snippetZh: "誇張弧形桶狀畸變魚眼" }
    ],
    apertures: [
      { id: "ap_f1_4", zh: "f/1.4 夢幻淺景深", en: "f/1.4 wide aperture, extreme shallow depth of field, creamy blurred background", snippetZh: "背景極度虛化奶油散景" },
      { id: "ap_f1_8", zh: "f/1.8 柔和淺景深", en: "f/1.8 shallow depth of field, pleasing background blur", snippetZh: "主體突出、背景柔美虛化" },
      { id: "ap_f2_8", zh: "f/2.8 平衡景深", en: "f/2.8 moderate shallow depth of field with distinct subject separation", snippetZh: "主體凸顯、背景微虛" },
      { id: "ap_f8_0", zh: "f/8.0 前後全清", en: "f/8.0 deep focus, tack-sharp edge-to-edge clarity throughout", snippetZh: "全畫面清晰銳利深景深" }
    ]
  },

  // 6. 構圖 (Composition)
  compositions: [
    { id: "rule_of_thirds", zh: "三分法則", en: "composed using the rule of thirds", snippetZh: "三分線黃金交點平衡構圖" },
    { id: "centered_symmetry", zh: "中心對稱", en: "perfect centered symmetrical composition, cinematic balance", snippetZh: "嚴謹平衡、衝擊力強的居中對稱" },
    { id: "leading_lines", zh: "引導線", en: "dynamic leading lines drawing the eye toward the subject", snippetZh: "透視線條引領視線聚焦主體" },
    { id: "negative_space", zh: "留白極簡", en: "minimalist composition with abundant negative space", snippetZh: "大面積純淨留白、呼吸感極強" },
    { id: "frame_in_frame", zh: "框架構圖", en: "frame within a frame composition using environmental elements", snippetZh: "利用門窗樹枝等元素構成框中框" },
    { id: "golden_ratio", zh: "黃金螺旋", en: "harmonious golden ratio spiral composition", snippetZh: "符合黃金比例的自然流動美感" },
    { id: "diagonal", zh: "動態對角線", en: "dynamic diagonal tension composition", snippetZh: "充滿動感與視覺張力的對角線" }
  ],

  // 7. 氛圍 (Mood)
  moods: [
    { id: "dreamy", zh: "夢幻空靈", en: "dreamy, ethereal, surreal and enchanting atmosphere", snippetZh: "如夢似幻、不食人間煙火的空靈" },
    { id: "melancholic", zh: "憂鬱沉靜", en: "melancholic, pensive, quiet and solitary atmosphere", snippetZh: "安靜沉思、帶有一絲淡淡哀愁" },
    { id: "epic", zh: "史詩宏大", en: "epic, monumental, grand, breath-taking awe-inspiring mood", snippetZh: "波瀾壯闊、令人屏息的史詩巨製感" },
    { id: "cozy", zh: "溫暖愜意", en: "warm, cozy, inviting and comforting mood", snippetZh: "放鬆舒心、備受撫慰的日常溫暖" },
    { id: "mysterious", zh: "神秘莫測", en: "mysterious, enigmatic, occult and suspenseful atmosphere", snippetZh: "隱秘幽微、引人探索的未知氛圍" },
    { id: "joyful", zh: "熱情活力", en: "joyful, cheerful, vibrant and celebratory energy", snippetZh: "歡欣雀躍、熱情澎湃的生機活力" },
    { id: "tense", zh: "緊張懸疑", en: "tense, high-stakes, dramatic suspense and anticipation", snippetZh: "扣人心弦、一觸即發的緊迫感" },
    { id: "serene", zh: "恬靜安寧", en: "serene, tranquil, peaceful and zen-like stillness", snippetZh: "心境澄明、萬物寂靜的寧和禪意" },
    { id: "nostalgic", zh: "復古懷舊", en: "nostalgic, wistful, evocative retro sentimentality", snippetZh: "時光倒流、如老歌低吟的歲月回憶" }
  ],

  // 8. 色調色板 (Color Palettes - tappable swatches with 4-5 color hex dots)
  palettes: [
    {
      id: "teal_orange",
      zh: "青橙對比電影色",
      en: "cinematic teal and orange color grading, complementary balance",
      snippetZh: "好萊塢經典冷暖對比青橙色調",
      colors: ["#0a2f35", "#155e75", "#f97316", "#fed7aa"]
    },
    {
      id: "pastel_dreams",
      zh: "粉彩馬卡龍",
      en: "soft pastel color palette, dreamy macarons, creamy light tones",
      snippetZh: "溫柔夢幻的低飽和馬卡龍粉彩色系",
      colors: ["#fbcfe8", "#fed7aa", "#fef08a", "#bbf7d0", "#bfdbfe"]
    },
    {
      id: "monochrome",
      zh: "黑白純粹",
      en: "timeless monochrome black and white palette, rich silvery midtones",
      snippetZh: "純粹洗練、灰度階層豐富的極致黑白",
      colors: ["#09090b", "#27272a", "#71717a", "#e4e4e7", "#ffffff"]
    },
    {
      id: "earthy_autumn",
      zh: "大地秋色",
      en: "warm earthy tones, terracotta, ochre, rich amber and olive green",
      snippetZh: "陶土、赭黃與苔綠融匯的自然大地氣息",
      colors: ["#451a03", "#78350f", "#b45309", "#d97706", "#3f6212"]
    },
    {
      id: "cyber_synth",
      zh: "賽博霓虹紫藍",
      en: "vibrant synthwave neon palette, electric magenta, cyan and deep indigo",
      snippetZh: "耀眼洋紅、電光青與深邃靛藍的電音未來",
      colors: ["#020617", "#3b0764", "#c026d3", "#06b6d4"]
    },
    {
      id: "vintage_film",
      zh: "復古老菲林",
      en: "muted vintage film tones, nostalgic amber tint, desaturated greens",
      snippetZh: "泛黃微溫、歷經歲月沉澱的老照片色調",
      colors: ["#292524", "#57534e", "#a8a29e", "#d6d3d1", "#e7e5e4"]
    },
    {
      id: "sunset_crimson",
      zh: "暮光紫金",
      en: "dramatic sunset palette, glowing crimson, deep violet and radiant gold",
      snippetZh: "夕陽燃燒天際的赤紅、紫羅蘭與燦金",
      colors: ["#4c0519", "#881337", "#be123c", "#f59e0b", "#fde047"]
    },
    {
      id: "emerald_forest",
      zh: "翡翠幽林",
      en: "deep emerald and jade green forest palette, lush moss and deep shade",
      snippetZh: "深邃翡翠、青玉與碧苔構成的幽深森林色",
      colors: ["#022c22", "#064e3b", "#059669", "#34d399", "#a7f3d0"]
    }
  ],

  // 9. 比例 (Aspect Ratios)
  aspectRatios: [
    { id: "1_1", label: "1:1", ratio: "1:1", descZh: "正方形 (頭像/IG方圖)", param: "--ar 1:1" },
    { id: "4_5", label: "4:5", ratio: "4:5", descZh: "直向 (IG Feed 最佳比例)", param: "--ar 4:5" },
    { id: "3_4", label: "3:4", ratio: "3:4", descZh: "經典直畫 (小紅書/日常肖像)", param: "--ar 3:4" },
    { id: "9_16", label: "9:16", ratio: "9:16", descZh: "垂直全螢幕 (Reels/Shorts/Sora)", param: "--ar 9:16" },
    { id: "16_9", label: "16:9", ratio: "16:9", descZh: "橫向闊銀幕 (YouTube/桌面)", param: "--ar 16:9" },
    { id: "21_9", label: "21:9", ratio: "21:9", descZh: "電影超寬銀幕 (Cinemascope)", param: "--ar 21:9" }
  ],

  // 10. 影片專屬預設 (Video-only Features: Movement, Duration, Pacing)
  videoOptions: {
    movements: [
      { id: "static", zh: "固定機位", en: "static tripod shot, locked-off camera, subtle internal subject motion only", snippetZh: "三腳架穩定固定機位" },
      { id: "push_in", zh: "緩慢推進", en: "smooth slow push-in camera movement towards the subject", snippetZh: "鏡頭緩緩向主體推進" },
      { id: "pull_out", zh: "緩慢後拉", en: "smooth cinematic pull-out revealing the surrounding environment", snippetZh: "鏡頭緩慢後退揭示周邊場景" },
      { id: "pan_left", zh: "水平左搖", en: "smooth camera pan left sweeping across the scene", snippetZh: "鏡頭由右向左平滑橫搖" },
      { id: "pan_right", zh: "水平右搖", en: "smooth camera pan right following the motion", snippetZh: "鏡頭由左向右平滑橫搖" },
      { id: "tilt_up", zh: "緩緩上仰", en: "slow dramatic tilt up from ground to sky", snippetZh: "由下往上緩緩抬頭上仰" },
      { id: "tilt_down", zh: "緩緩下俯", en: "smooth camera tilt down focusing onto the subject", snippetZh: "由上往下緩緩俯視主體" },
      { id: "orbit_360", zh: "360° 環繞運鏡", en: "smooth 360-degree orbital camera rotation around the subject", snippetZh: "繞著主體360度圓形環繞運鏡" },
      { id: "dolly_track", zh: "軌道平移跟拍", en: "lateral dolly tracking shot moving parallel to the action", snippetZh: "隨主體運動平移軌道跟拍" },
      { id: "crane_up", zh: "搖臂升降", en: "vertical crane jib camera movement rising high above", snippetZh: "如搖臂升騰而起的垂直升降鏡頭" },
      { id: "handheld", zh: "微晃手持", en: "organic subtle handheld camera movement, realistic natural breathing sway", snippetZh: "富有真實臨場感的輕微手持呼吸感" },
      { id: "drone_fly", zh: "無人機航拍", en: "cinematic high-altitude drone flyover gliding forward smoothly", snippetZh: "高空無人機向前平滑滑翔俯衝" },
      { id: "fpv_dynamic", zh: "極限穿梭 FPV", en: "fast dynamic FPV drone dive soaring through tight spaces", snippetZh: "極限第一人稱視角高速穿梭" }
    ],
    durations: [
      { id: "3s", label: "3 秒", seconds: 3, en: "3 seconds" },
      { id: "5s", label: "5 秒 (預設)", seconds: 5, en: "5 seconds" },
      { id: "8s", label: "8 秒", seconds: 8, en: "8 seconds" },
      { id: "10s", label: "10 秒", seconds: 10, en: "10 seconds" },
      { id: "15s", label: "15 秒", seconds: 15, en: "15 seconds" }
    ],
    pacings: [
      { id: "slow_dreamy", zh: "悠緩夢幻", en: "slow, dreamy and hypnotic pacing, gentle fluid motion", snippetZh: "如夢境般悠然緩慢的流暢律動" },
      { id: "smooth_steady", zh: "平穩流暢", en: "smooth, steady and measured cinematic pace", snippetZh: "沉穩克制、節奏舒適的電影節奏" },
      { id: "fast_energetic", zh: "節奏明快", en: "fast-paced, high energy, dynamic and brisk action", snippetZh: "快節奏、充滿衝擊力與動感的運鏡" }
    ],
    shotTemplates: [
      { descZh: "主體正面特寫，微風吹拂", descEn: "close-up of the subject with gentle wind blowing", move: "push_in", duration: 3 },
      { descZh: "鏡頭環繞主體旋轉，展現周圍環境", descEn: "orbiting around the subject revealing the majestic environment", move: "orbit_360", duration: 3 },
      { descZh: "後拉至大遠景，主體融入廣闊地貌", descEn: "pulling back into an expansive wide landscape", move: "pull_out", duration: 4 }
    ]
  },

  // 11. 負面提示預設 (Negative Prompts)
  negativeDefaults: {
    image: [
      { id: "blurry", zh: "模糊失焦", en: "blurry, out of focus" },
      { id: "low_res", zh: "畫質粗糙", en: "low resolution, low quality, pixelated, jpeg artifacts" },
      { id: "bad_hands", zh: "畸變雙手/多指", en: "deformed hands, extra fingers, mutated fingers, poorly drawn hands" },
      { id: "bad_face", zh: "五官崩壞", en: "distorted face, bad anatomy, deformed eyes, poorly drawn face" },
      { id: "watermark_text", zh: "浮水印/亂碼文字", en: "watermark, signature, text, username, logo, copyright notice" },
      { id: "oversaturated", zh: "過度飽和", en: "oversaturated colors, garish, unnatural skin tone" },
      { id: "amateur", zh: "業餘構圖", en: "bad framing, poorly drawn, amateurish, cut off, cropped" }
    ],
    videoExtra: [
      { id: "flickering", zh: "畫面頻閃", en: "flickering, strobing light, frame drops" },
      { id: "temporal_jitter", zh: "時序抖動", en: "temporal jitter, shaky footage, stuttering motion" },
      { id: "morphing", zh: "物體怪異形變", en: "unnatural morphing, object melting, floating artifacts" },
      { id: "jerky_camera", zh: "運鏡卡頓", en: "jerky camera movements, unstable transitions" }
    ]
  },

  // 12. 精選靈感配方 (Curated Recipes - 6 Image, 4 Video)
  recipes: [
    {
      id: "rec_macau_neon",
      mode: "image",
      titleZh: "澳門雨夜霓虹街頭",
      descZh: "融合葡式老街石板路、老招牌倒影與賽博朋克氛圍的電影大片。",
      tags: ["電影感", "街頭", "雨夜", "澳門"],
      thumbGradient: "linear-gradient(135deg, #0f172a 0%, #3b0764 50%, #06b6d4 100%)",
      state: {
        mode: "image",
        subject: "a lone woman holding a black umbrella looking over her shoulder on a wet cobblestone street",
        subjectEn: "a lone woman holding a black umbrella looking over her shoulder on a wet cobblestone street",
        subjectZh: "一名撐著黑色雨傘的女子，站在澳門老城區石板路上回眸",
        scene: "macau_old_street",
        style: "cinematic",
        styleModifiers: ["highly_detailed", "sharp_focus", "film_grain"],
        lighting: "neon_glow",
        cameraShotSize: "cowboy_shot",
        cameraAngle: "low_angle",
        cameraLens: "lens_35mm",
        cameraAperture: "ap_f1_8",
        composition: "rule_of_thirds",
        mood: "melancholic",
        palette: "teal_orange",
        aspectRatio: "16_9",
        negativeChips: ["blurry", "low_res", "watermark_text"]
      }
    },
    {
      id: "rec_ghibli_cafe",
      mode: "image",
      titleZh: "吉卜力風早晨Café",
      descZh: "晨光透過木窗灑進來，熱氣從咖啡杯升騰，滿滿童話手繪治癒感。",
      tags: ["吉卜力", "手繪厚塗", "治癒", "早晨"],
      thumbGradient: "linear-gradient(135deg, #059669 0%, #10b981 50%, #fef08a 100%)",
      state: {
        mode: "image",
        subject: "a sleepy ginger kitten napping on a rustic wooden café counter next to a steaming cup of latte",
        subjectEn: "a sleepy ginger kitten napping on a rustic wooden café counter next to a steaming cup of latte",
        subjectZh: "一隻睡眼惺忪的小橘貓趴在咖啡館木質吧枱上打瞌睡，旁邊放著冒著熱氣的拿鐵",
        scene: "cozy_cafe",
        style: "ghibli",
        styleModifiers: ["highly_detailed", "masterpiece"],
        lighting: "soft_window",
        cameraShotSize: "close_up",
        cameraAngle: "eye_level",
        cameraLens: "lens_50mm",
        cameraAperture: "ap_f2_8",
        composition: "centered_symmetry",
        mood: "cozy",
        palette: "earthy_autumn",
        aspectRatio: "4_5",
        negativeChips: ["blurry", "low_res", "amateur"]
      }
    },
    {
      id: "rec_perfume_macro",
      mode: "image",
      titleZh: "產品廣告 — 香水微距",
      descZh: "晶瑩水滴、懸浮金箔與高貴玻璃質感，極致奢華商業靜物攝影。",
      tags: ["商業攝影", "極簡", "微距", "香水"],
      thumbGradient: "linear-gradient(135deg, #18181b 0%, #71717a 50%, #fde047 100%)",
      state: {
        mode: "image",
        subject: "a luxury geometric cut-crystal amber perfume bottle with microscopic dew condensation droplets",
        subjectEn: "a luxury geometric cut-crystal amber perfume bottle with microscopic dew condensation droplets",
        subjectZh: "一瓶幾何切面雕花的高級琥珀色香水瓶，細小水珠凝結在瓶身邊緣",
        scene: "studio_backdrop",
        style: "photorealistic",
        styleModifiers: ["highly_detailed", "sharp_focus", "octane_render", "ray_tracing"],
        lighting: "rembrandt",
        cameraShotSize: "extreme_close_up",
        cameraAngle: "low_angle",
        cameraLens: "lens_macro",
        cameraAperture: "ap_f1_4",
        composition: "centered_symmetry",
        mood: "serene",
        palette: "earthy_autumn",
        aspectRatio: "1_1",
        negativeChips: ["blurry", "low_res", "bad_hands", "watermark_text"]
      }
    },
    {
      id: "rec_ink_dragon",
      mode: "image",
      titleZh: "水墨山水東方神龍",
      descZh: "大寫意毛筆墨韻，青龍破雲而出，留白處氣韻萬千。",
      tags: ["東方美學", "水墨", "神龍", "國風"],
      thumbGradient: "linear-gradient(135deg, #09090b 0%, #3f3f46 60%, #e4e4e7 100%)",
      state: {
        mode: "image",
        subject: "a colossal azure mythical dragon soaring through cascading misty clouds and jagged Huangshan mountain peaks",
        subjectEn: "a colossal azure mythical dragon soaring through cascading misty clouds and jagged Huangshan mountain peaks",
        subjectZh: "一條巨大的青色神龍穿行在層疊雲霧與陡峭黃山山峰之間",
        scene: "misty_forest",
        style: "ink_wash",
        styleModifiers: ["masterpiece", "unreal_engine_5"],
        lighting: "god_rays",
        cameraShotSize: "wide_establishing",
        cameraAngle: "low_angle",
        cameraLens: "lens_24mm",
        cameraAperture: "ap_f8_0",
        composition: "golden_ratio",
        mood: "epic",
        palette: "monochrome",
        aspectRatio: "16_9",
        negativeChips: ["blurry", "low_res", "oversaturated", "amateur"]
      }
    },
    {
      id: "rec_cyber_cat",
      mode: "image",
      titleZh: "賽博朋克機械貓",
      descZh: "發光機械耳、全息眼睛與金屬骨骼，未來高科技街頭萌物。",
      tags: ["賽博朋克", "機甲", "霓虹", "概念設計"],
      thumbGradient: "linear-gradient(135deg, #ff007f 0%, #7928ca 50%, #00f0ff 100%)",
      state: {
        mode: "image",
        subject: "a semi-cybernetic black cat perched on a rooftop ledge with glowing cyan holographic optical eyes and exposed gold circuitry",
        subjectEn: "a semi-cybernetic black cat perched on a rooftop ledge with glowing cyan holographic optical eyes and exposed gold circuitry",
        subjectZh: "一隻半機械化的黑貓蹲在屋頂邊緣，眼部散發著青色全息光芒，頸部有發光電路",
        scene: "cyberpunk_street",
        style: "cyberpunk_neon",
        styleModifiers: ["highly_detailed", "sharp_focus", "unreal_engine_5"],
        lighting: "neon_glow",
        cameraShotSize: "close_up",
        cameraAngle: "eye_level",
        cameraLens: "lens_85mm",
        cameraAperture: "ap_f1_4",
        composition: "rule_of_thirds",
        mood: "mysterious",
        palette: "cyber_synth",
        aspectRatio: "3_4",
        negativeChips: ["blurry", "low_res", "bad_hands", "watermark_text"]
      }
    },
    {
      id: "rec_vintage_film_portrait",
      mode: "image",
      titleZh: "復古菲林港風人像",
      descZh: "90年代香港街頭王家衛風格，微弱漏光與微醺散景，故事感拉滿。",
      tags: ["港風", "復古菲林", "王家衛", "人像"],
      thumbGradient: "linear-gradient(135deg, #7c2d12 0%, #b45309 50%, #a855f7 100%)",
      state: {
        mode: "image",
        subject: "a stylish young woman with short vintage bob haircut sitting in a neon-lit Hong Kong cha chaan teng diner with a thoughtful gaze",
        subjectEn: "a stylish young woman with short vintage bob haircut sitting in a neon-lit Hong Kong cha chaan teng diner with a thoughtful gaze",
        subjectZh: "一名短髮女子坐在霓虹燈閃爍的街角茶餐廳，眼神若有所思",
        scene: "city_night",
        style: "polaroid_35mm",
        styleModifiers: ["film_grain", "creamy_bokeh"],
        lighting: "cinematic_dramatic",
        cameraShotSize: "medium_shot",
        cameraAngle: "eye_level",
        cameraLens: "lens_50mm",
        cameraAperture: "ap_f1_4",
        composition: "rule_of_thirds",
        mood: "nostalgic",
        palette: "vintage_film",
        aspectRatio: "4_5",
        negativeChips: ["blurry", "low_res", "bad_hands", "bad_face"]
      }
    },
    {
      id: "rec_drone_harbour",
      mode: "video",
      titleZh: "無人機飛越維港日落",
      descZh: "高空無人機向前滑翔，夕陽將維多利亞港染成金紅，摩天大樓倒影閃爍。",
      tags: ["航拍", "日落", "維港", "影片運鏡"],
      thumbGradient: "linear-gradient(135deg, #1e3a8a 0%, #be123c 60%, #f59e0b 100%)",
      state: {
        mode: "video",
        subject: "bustling harbour waters at sunset with passenger ferries carving golden wakes across glistening waves",
        subjectEn: "bustling harbour waters at sunset with passenger ferries carving golden wakes across glistening waves",
        subjectZh: "夕陽西下時分的繁忙港口海面，渡輪在波光粼粼的水面劃開金色尾波",
        scene: "harbour_waterfront",
        style: "cinematic",
        styleModifiers: ["highly_detailed", "sharp_focus"],
        lighting: "golden_hour",
        cameraShotSize: "wide_establishing",
        cameraAngle: "birds_eye",
        cameraLens: "lens_24mm",
        cameraAperture: "ap_f8_0",
        composition: "leading_lines",
        mood: "epic",
        palette: "sunset_crimson",
        aspectRatio: "16_9",
        cameraMovement: "drone_fly",
        duration: 8,
        pacing: "smooth_steady",
        subjectMotion: "ferries sailing across waves, sunlight reflecting dynamically on water surface",
        shots: [
          { descZh: "無人機自高空俯瞰全港海面", descEn: "high-altitude drone establishing view gliding forward over shimmering water", move: "drone_fly", seconds: 4 },
          { descZh: "緩慢下降接近渡輪並向前平移", descEn: "lowering altitude tracking parallel to the moving ferry at golden sunset", move: "dolly_track", seconds: 4 }
        ],
        negativeChips: ["blurry", "low_res", "flickering", "temporal_jitter", "morphing"]
      }
    },
    {
      id: "rec_slowmo_latte",
      mode: "video",
      titleZh: "慢鏡咖啡倒奶拉花",
      descZh: "極致特寫慢鏡頭，絲滑蒸奶注入濃縮咖啡，細膩天鵝拉花在杯中綻放。",
      tags: ["慢動作", "咖啡美食", "微距特寫", "商業廣告"],
      thumbGradient: "linear-gradient(135deg, #451a03 0%, #78350f 50%, #fde68a 100%)",
      state: {
        mode: "video",
        subject: "velvety steamed white milk pouring gracefully into rich dark espresso forming intricate latte art",
        subjectEn: "velvety steamed white milk pouring gracefully into rich dark espresso forming intricate latte art",
        subjectZh: "熱氣騰騰的濃縮咖啡上方，白色蒸奶緩緩注入杯中形成優美的拉花圖案",
        scene: "cozy_cafe",
        style: "photorealistic",
        styleModifiers: ["sharp_focus", "creamy_bokeh"],
        lighting: "soft_window",
        cameraShotSize: "extreme_close_up",
        cameraAngle: "high_angle",
        cameraLens: "lens_macro",
        cameraAperture: "ap_f1_4",
        composition: "centered_symmetry",
        mood: "cozy",
        palette: "earthy_autumn",
        aspectRatio: "9_16",
        cameraMovement: "push_in",
        duration: 5,
        pacing: "slow_dreamy",
        subjectMotion: "swirling streams of milk blending seamlessly into dark brown crema in ultra slow-motion",
        shots: [
          { descZh: "微距推近咖啡杯，牛奶注入瞬間", descEn: "extreme close-up push-in as steamed milk enters the crema", move: "push_in", seconds: 3 },
          { descZh: "固定機位展示完整天鵝圖案定型", descEn: "static shot watching the completed latte art settle smoothly", move: "static", seconds: 2 }
        ],
        negativeChips: ["blurry", "low_res", "flickering", "jerky_camera"]
      }
    },
    {
      id: "rec_neon_orbit",
      mode: "video",
      titleZh: "角色霓虹街頭 360° 環繞",
      descZh: "主角在賽博都市漫步突然轉身，鏡頭行雲流水環繞一圈，電影質感頂級。",
      tags: ["電影運鏡", "360環繞", "賽博朋克", "角色動態"],
      thumbGradient: "linear-gradient(135deg, #3b0764 0%, #c026d3 50%, #06b6d4 100%)",
      state: {
        mode: "video",
        subject: "a cool man in a reflective black leather jacket standing at a rainy crossroad, turning slowly towards camera",
        subjectEn: "a cool man in a reflective black leather jacket standing at a rainy crossroad, turning slowly towards camera",
        subjectZh: "身穿黑色反光皮褸的男子站在雨夜路口，轉身凝視鏡頭",
        scene: "cyberpunk_street",
        style: "cinematic",
        styleModifiers: ["highly_detailed", "sharp_focus", "film_grain"],
        lighting: "neon_glow",
        cameraShotSize: "medium_shot",
        cameraAngle: "low_angle",
        cameraLens: "lens_anamorphic",
        cameraAperture: "ap_f1_8",
        composition: "centered_symmetry",
        mood: "tense",
        palette: "cyber_synth",
        aspectRatio: "16_9",
        cameraMovement: "orbit_360",
        duration: 5,
        pacing: "smooth_steady",
        subjectMotion: "character turns slowly, neon reflections gliding across wet jacket in circular motion",
        shots: [
          { descZh: "背面緩慢推向主角肩膀", descEn: "slow push-in behind character's shoulder", move: "push_in", seconds: 2 },
          { descZh: "主角轉身瞬間環繞360度展示面部", descEn: "orbiting 360 degrees as he turns to gaze into lens", move: "orbit_360", seconds: 3 }
        ],
        negativeChips: ["blurry", "low_res", "flickering", "temporal_jitter", "morphing"]
      }
    },
    {
      id: "rec_scifi_storyboard",
      mode: "video",
      titleZh: "3-Shot 科幻探索短片分鏡",
      descZh: "太空人登陸未知星球：遠景荒涼、中景走向巨型遺跡、特寫頭盔反射外星天體。",
      tags: ["故事板", "分鏡", "科幻探索", "多鏡頭短片"],
      thumbGradient: "linear-gradient(135deg, #09090b 0%, #1e1b4b 50%, #818cf8 100%)",
      state: {
        mode: "video",
        subject: "a lone astronaut in an illuminated space suit exploring glowing alien monoliths in a desert landscape",
        subjectEn: "a lone astronaut in an illuminated space suit exploring glowing alien monoliths in a desert landscape",
        subjectZh: "一名孤獨的太空宇航員在未知外星荒漠中探索神秘發光巨石",
        scene: "alien_desert",
        style: "cinematic",
        styleModifiers: ["highly_detailed", "sharp_focus", "unreal_engine_5"],
        lighting: "cinematic_dramatic",
        cameraShotSize: "wide_establishing",
        cameraAngle: "eye_level",
        cameraLens: "lens_35mm",
        cameraAperture: "ap_f2_8",
        composition: "rule_of_thirds",
        mood: "mysterious",
        palette: "teal_orange",
        aspectRatio: "21_9",
        cameraMovement: "crane_up",
        duration: 10,
        pacing: "smooth_steady",
        subjectMotion: "astronaut walking slowly forward, glowing dust swirling around boots",
        shots: [
          { descZh: "遠景航拍，太空人在廣袤荒原中前行", descEn: "high-altitude crane down revealing vast alien plains and tiny lone astronaut walking", move: "crane_up", seconds: 3 },
          { descZh: "中景軌道跟拍，太空人接近發光黑石", descEn: "dolly tracking shot following astronaut walking towards the towering monolith", move: "dolly_track", seconds: 4 },
          { descZh: "面罩特寫推進，雙眼倒映外星雙日", descEn: "close-up slow push-in onto visor reflecting twin alien suns in deep purple sky", move: "push_in", seconds: 3 }
        ],
        negativeChips: ["blurry", "low_res", "flickering", "temporal_jitter", "morphing", "bad_hands"]
      }
    }
  ]
};

// Export for Node and Browser
if (typeof module !== "undefined" && module.exports) {
  module.exports = PROMPT_DATA;
}
if (typeof window !== "undefined") {
  window.PROMPT_DATA = PROMPT_DATA;
}
