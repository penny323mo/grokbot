// src/data/jobs.js - Complete Job & Story Data for 鋦瓷記 (1957 Hong Kong)

export const JOBS_DATA = [
  // DAY 1 - Introduction to Craft
  {
    id: "job_d1_lau",
    day: 1,
    title: "第一日 · 碎玉初逢",
    sceneVignette: "assets/scenes/temple_street.webp",
    sceneDesc: "一九五七年暮秋 · 油麻地廟街榕樹頭",
    customer: {
      name: "劉婆",
      role: "油麻地街坊 · 獨居老婦",
      portrait: "assets/people/lau.webp",
      voiceStyle: "慈祥而微顫的潮汕口音粵語"
    },
    piece: {
      id: "plate_01",
      name: "青花山水紋圓盤",
      type: "民窯青花",
      period: "清末光緒年間",
      asset: "assets/plates/plate_01.webp",
      shardsCount: 4,
      crackLength: 320, // estimated mm
      minStaples: 3,
      maxStaples: 6,
      optimalStaples: 4,
      description: "白地青花，繪江帆遠山，盤沿有一道斜裂與兩塊脫片，釉面光潔溫潤。"
    },
    introDialogue: [
      { speaker: "劉婆", text: "葉伯，早晨呀。我聽廟街啲街坊講，話你打潮州過嚟，專門鋦瓷補碗？" },
      { speaker: "葉伯", text: "劉婆，坐低慢慢講。手藝粗淺，但只要碎片仲齊，總有法子接得返。" },
      { speaker: "劉婆", text: "（解開藍染碎花布）你睇睇呢隻盤……三十八年前我阿媽畀我嘅陪嫁，由潮安一路抱到落香港。琴日搬唐樓失手跌咗，我心痛到成晚眼光光。" }
    ],
    inquiryTopic: "打聽呢隻盤嘅來歷",
    inquiryDialogue: [
      { speaker: "葉伯", text: "呢隻盤釉色好沉穩，係清末潮州民窯嘅好泥料。底款雖然冇落字，但山水畫得好清靜。" },
      { speaker: "劉婆", text: "係呀……細個屋企窮，阿媽日日用佢裝鹹菜蒸番薯。見到隻盤，就似見返鄉下舊屋。" }
    ],
    pricing: {
      fair: 1.5,
      high: 3.0,
      cheap: 0.5,
      options: [
        { type: "fair", price: 1.5, label: "公道收費（一元五毫）", customerReply: "好，公道！麻煩葉伯用心幫我鋦實佢。" },
        { type: "high", price: 3.0, label: "開價三元（市價偏高）", customerReply: "哎呀……三蚊？差不多係我兩日伙食錢喇……但為咗隻盤，我都整啦。" },
        { type: "cheap", price: 0.5, label: "街坊同鄉情（五毫銀子）", customerReply: "葉伯，你真係好心人！好人一生平安！" }
      ]
    },
    secondaryJob: {
      id: "sub_d1_spoon",
      title: "粗瓷匙羹",
      customerName: "茶檔跑堂 阿勝",
      pieceName: "粉彩萬壽粗瓷匙",
      reward: 1.0,
      staples: 2,
      description: "茶檔伙計慌忙送嚟跌斷匙柄嘅粗瓷匙羹，順手施兩枚小釘即可穩固。"
    },
    completionDialogue: {
      perfect: "劉婆接過盤子，摸著那幾枚黃銅螞蝗釘：「真係滴水不漏！連裂縫都摸唔出棱角，葉伯你呢手金剛鑽真係神乎其技！」",
      good: "劉婆端起盤子仔細端詳：「好手藝！釘腳抓得實，放返喺案頭，個心總算踏實晒。」",
      leaky: "劉婆望住盤底滲出嘅幾滴水珠，輕輕嘆咗口氣：「雖然有少少滲水……但好在齊齊整整駁返埋，多謝你呀葉伯。」"
    }
  },

  // DAY 2 - Dowry Plate
  {
    id: "job_d2_chan",
    day: 2,
    title: "第二日 · 廣彩殘芳",
    sceneVignette: "assets/scenes/temple_street.webp",
    sceneDesc: "廟街裁縫舖巷口 · 朝霧晨光",
    customer: {
      name: "陳太",
      role: "廟街裁縫舖遺孀",
      portrait: "assets/people/chan_tai.webp",
      voiceStyle: "語氣素雅克制，略帶悲涼"
    },
    piece: {
      id: "plate_02_famille_rose",
      name: "廣彩開光花鳥折沿碟",
      type: "廣彩外銷瓷",
      period: "民國初期",
      asset: "assets/plates/plate_02_famille_rose.webp",
      shardsCount: 5,
      crackLength: 380,
      minStaples: 4,
      maxStaples: 8,
      optimalStaples: 6,
      description: "金彩輝煌，牡丹花間有翠羽對蝶，邊緣碎裂成五塊，金水磨損但畫工極其精美。"
    },
    introDialogue: [
      { speaker: "陳太", text: "葉師傅，打擾你。請問呢隻廣彩碟仲可唔可以修？" },
      { speaker: "葉伯", text: "陳太坐低慢慢講。呢隻碟係織金彩瓷，金水好足好純。喺邊度磕親呀？" },
      { speaker: "陳太", text: "先夫生前同我喺廣州開裁縫舖，開張嗰日佢送畀我嘅。前年佢害肺癆走咗，留低我同間小舖……今朝抹神樓，不小心刮落地下。" }
    ],
    inquiryTopic: "打聽碟上對蝶嘅寓意",
    inquiryDialogue: [
      { speaker: "葉伯", text: "碟心呢對彩蝶畫得生猛靈動，雙翼撲朔，正正係比翼雙飛嘅好意頭。" },
      { speaker: "陳太", text: "（低頭輕拭眼角）當年佢都係咁講。而家物是人非，若連呢隻碟都保唔住，我真係對佢唔住。" }
    ],
    pricing: {
      fair: 2.0,
      high: 4.5,
      cheap: 1.0,
      options: [
        { type: "fair", price: 2.0, label: "收工本與銅釘錢（二元）", customerReply: "好合理，葉師傅。呢隻碟交畀你，我安心。" },
        { type: "high", price: 4.5, label: "精工細作特費（四元五毫）", customerReply: "錢唔成問題，只要你細心修，唔好傷咗金彩。" },
        { type: "cheap", price: 1.0, label: "同恤孤孀（一元）", customerReply: "葉師傅如此厚道仁心，陳太感激不盡。" }
      ]
    },
    completionDialogue: {
      perfect: "陳太撫摸著碟背密實整齊的銅鋦釘，金光與銅色相互輝映：「釘腳細密如針，葉師傅，你唔單止補返隻碟，仲補返咗我嘅念想。」",
      good: "陳太捧著盤子：「修得好工整，銅釘像極了一圈金銀環扣，真係多謝你。」",
      leaky: "陳太望著稍有鬆動的邊緣：「雖然邊位有啲晃，但形貌已復，已是萬幸。」"
    }
  },

  // DAY 3 - Boy's Broken Rice Bowl
  {
    id: "job_d3_kid",
    day: 3,
    title: "第三日 · 雙喜瓦全",
    sceneVignette: "assets/scenes/temple_street.webp",
    sceneDesc: "街角大排檔邊 · 市井人聲喧囂",
    customer: {
      name: "細路明",
      role: "街角茶檔跑堂童工 · 十歲",
      portrait: "assets/people/kid_ming.webp",
      voiceStyle: "慌張急促，帶著快要哭出來的抽泣聲"
    },
    piece: {
      id: "bowl_rice_double_happiness",
      name: "民窯青花雙喜粗瓷碗",
      type: "百姓日用粗瓷",
      period: "1940年代香港本地或石灣窯",
      asset: "assets/plates/bowl_rice_double_happiness.webp",
      shardsCount: 4,
      crackLength: 260,
      minStaples: 3,
      maxStaples: 5,
      optimalStaples: 4,
      description: "胎厚如石，白釉泛青，碗心手繪雙喜字，邊緣摔成三大塊與一片小碎渣。"
    },
    introDialogue: [
      { speaker: "細路明", text: "阿……阿伯！救命呀！求下你救下我！" },
      { speaker: "葉伯", text: "細路仔咪慌，慢慢講，做咩事喊到成面鼻涕？" },
      { speaker: "細路明", text: "我頭先喺茶檔洗碗，唔小心跣手摔爛咗阿爸隻私家大飯碗！阿爸話過呢隻碗摔爛要抽我十籐條……我兜兜得兩毫子，阿伯你收唔收兩毫啊？" }
    ],
    inquiryTopic: "摸摸阿明個頭，問佢阿爸做邊行",
    inquiryDialogue: [
      { speaker: "葉伯", text: "你阿爸喺邊度開工？脾氣咁暴躁？" },
      { speaker: "細路明", text: "阿爸喺佐敦道碼頭做咕喱（苦力），日日搬米包成身骨痛，返到屋企見唔到隻飯碗盛飯，實發好大脾氣……" }
    ],
    pricing: {
      fair: 1.0,
      high: 2.0,
      cheap: 0.2,
      options: [
        { type: "fair", price: 1.0, label: "收一元（記賬先欠八毫）", customerReply: "多謝阿伯！我今個月出糧一定還返八毫畀你！" },
        { type: "high", price: 2.0, label: "照章收費二元（不二價）", customerReply: "（大喊大哭）兩蚊？！我邊有兩蚊……今晚死定喇……" },
        { type: "cheap", price: 0.2, label: "只收兩毫銅板（當請你飲茶）", customerReply: "阿伯你真係菩薩顯靈！我以後一定好好報答你！" }
      ]
    },
    completionDialogue: {
      perfect: "細路明雙手捧著補得天衣無縫的大碗，眼淚化作笑容：「哇！阿伯你裝咗四隻金光閃閃嘅鋼牙！滴水不漏！我阿爸一定睇唔出跌爛過！」",
      good: "細路明破涕為笑：「補好咗！阿爸今晚有碗食飯，我唔使捱打喇！」",
      leaky: "細路明擦乾眼淚：「底有少少漏水，不過裝白飯唔怕！多謝阿伯！」"
    }
  },

  // DAY 4 - Refugee Fellow Townsman
  {
    id: "job_d4_lam",
    day: 4,
    title: "第四日 · 韓江壺溫",
    sceneVignette: "assets/scenes/tenement_stair.webp",
    sceneDesc: "潮陽同鄉寄居唐樓梯間 · 炭爐工夫茶",
    customer: {
      name: "林生",
      role: "潮陽同鄉 · 木工手藝人",
      portrait: "assets/people/lam_father.webp",
      voiceStyle: "樸實敦厚、鄉音濃重的潮州客家腔"
    },
    piece: {
      id: "teapot_chaozhou_top",
      name: "潮州朱泥孟臣小品壺",
      type: "宜興紫砂/潮州朱泥",
      period: "民國初期 惠孟臣款",
      asset: "assets/plates/teapot_chaozhou_top.webp",
      shardsCount: 5,
      crackLength: 310,
      minStaples: 3,
      maxStaples: 7,
      optimalStaples: 5,
      description: "胎薄如蛋殼，泥質朱紅細膩，壺蓋與肩部分離，乃泡工夫茶不可多得的良器。"
    },
    introDialogue: [
      { speaker: "林生", text: "葉伯！我一打聽就知廟街呢位身懷絕技嘅同鄉係你！" },
      { speaker: "葉伯", text: "林生快坐低。阿珍今日幾乖，冇扭計。今日帶咗咩寶貝過嚟？" },
      { speaker: "林生", text: "就係呢隻跟住我哋全家偷渡過海嘅朱泥壺。冇佢沖茶，早起做木工嘴唇都係乾嘅。琴晚阿珍跌跌撞撞，把壺蓋同身磕裂咗。" }
    ],
    inquiryTopic: "傾下潮州老家嘅工夫茶法",
    inquiryDialogue: [
      { speaker: "葉伯", text: "工夫茶講究『高沖低斟，刮沫淋蓋』，朱泥壺胎薄透氣，逼出茶香最妙。" },
      { speaker: "林生", text: "葉伯真懂！喺香港呢邊個個飲荷包茶、絲襪奶茶，知音太少。只要你幫我鋦得實，我下次帶罐私家鳳凰單叢過嚟同你對飲！" }
    ],
    pricing: {
      fair: 2.5,
      high: 5.0,
      cheap: 1.0,
      options: [
        { type: "fair", price: 2.5, label: "老鄉平價（二元五毫）", customerReply: "好講氣派！葉伯，大家同在異鄉，呢份手藝我心服口服。" },
        { type: "high", price: 5.0, label: "紫砂薄胎難工（五元）", customerReply: "係難工，薄胎鑽眼稍一失手成壺就碎。行，值呢個價！" },
        { type: "cheap", price: 1.0, label: "收一元買銅絲（純幫同鄉）", customerReply: "葉伯！你咁幫我，日後你攤檔張長凳有咩壞，我免費幫你修一世！" }
      ]
    },
    completionDialogue: {
      perfect: "林生倒熱水一試，壺身水汽氤氳，五枚小銅釘嚴絲合縫：「水注如線，滴水不漏！單叢茶香直透壺頂，葉伯，你當真係神仙手筆！」",
      good: "林生捧著小壺：「銅鋦釘排列得似朵梅花，仲靚過原裝，返去即刻沖一泡鐵觀音！」",
      leaky: "林生撫摸壺嘴：「雖然蓋邊微有滲水，但泥壺吸水漸合，養兩日就實喇，多謝同鄉！」"
    }
  },

  // DAY 5 - Pawnshop "Ming" Bowl (Moral Choice & Fake Detection)
  {
    id: "job_d5_ho",
    day: 5,
    title: "第五日 · 當舖真偽",
    sceneVignette: "assets/scenes/pawnshop_interior.webp",
    sceneDesc: "上海街萬安大押 · 雕花高櫃深鎖",
    customer: {
      name: "何老闆",
      role: "萬安當舖掌櫃 · 精明市儈",
      portrait: "assets/people/ho_boss.webp",
      voiceStyle: "市儈算計，語氣高傲而帶試探"
    },
    piece: {
      id: "bowl_ming_fake",
      name: "青花五爪雲龍紋大碗（宣德款）",
      type: "仿宣德官窯 / 晚清同光仿品",
      period: "實為晚清民初仿宣德",
      asset: "assets/plates/bowl_ming_fake.webp",
      shardsCount: 6,
      crackLength: 420,
      minStaples: 5,
      maxStaples: 9,
      optimalStaples: 7,
      description: "底款書『大明宣德年製』。但拼合後仔細端詳圈足火石紅過於浮躁，龍身青花暈散呈現代化學鈷料色澤，是典型的假古董。"
    },
    introDialogue: [
      { speaker: "何老闆", text: "葉師傅，我係萬安當舖老何。今日特登帶件好嘢畀你開下眼界。" },
      { speaker: "葉伯", text: "何老闆親自大駕光臨？你掌管大當舖，平日乜嘢稀罕金銀翡翠未見過，今日有咩好嘢？" },
      { speaker: "何老闆", text: "前幾日有個落難北佬拿嚟死當嘅大明宣德官窯龍碗！運輸嗰陣裂咗幾瓣。你同我用最好的金銅釘鋦好佢，我出十蚊港紙！修得光鮮，日後當舖嘅瓷器全包畀你！" }
    ],
    inquiryTopic: "睇真啲圈足同青花發色",
    inquiryDialogue: [
      { speaker: "葉伯", text: "何老闆，你睇呢隻碗，青花發色太浮太紫，所謂嘅鐵鏽斑假得滯，胎質又鬆，分明係同治光緒年間後人仿嘅。" },
      { speaker: "何老闆", text: "（臉色一變，乾咳一聲）咳咳……葉師傅，修瓷器就修瓷器，行有行規，莫多嘴管真假！你只管幫我釘得天衣無縫就得！" }
    ],
    pricing: {
      fair: 6.0,
      high: 10.0,
      cheap: 3.0,
      options: [
        { type: "cheap", price: 3.0, label: "直言後仿 · 照常規收三蚊工本", customerReply: "算你老實！行，三蚊就三蚊，幫我釘實佢。" },
        { type: "fair", price: 6.0, label: "公道收六蚊 · 補以粗針明示破綻", customerReply: "好，就按你規矩，六蚊修好佢。" },
        { type: "high", price: 10.0, label: "收足十蚊港紙 · 不問真偽順客之意", customerReply: "爽快！十蚊畀你，一定要釘得密實，莫等客人睇出破綻！" }
      ]
    },
    completionDialogue: {
      perfect: "何老闆對住天光照咗照，見銅釘排得整整齊齊：「好！手藝真係俐落！鋦痕似足龍鱗，轉頭賣得好價，少唔得你嗰份茶錢！」",
      good: "何老闆點點頭：「手路幾利落，這十塊錢花得值。」",
      leaky: "何老闆皺眉：「點解邊位仲有條毛裂？算啦，當成出土殘器忽悠洋人便罷。」"
    }
  },

  // DAY 6 - Rent Day & Street Life
  {
    id: "job_d6_landlord",
    day: 6,
    title: "第六日 · 房租逼仄",
    sceneVignette: "assets/scenes/tenement_stair.webp",
    sceneDesc: "包租公催租晨光 · 門環深扣",
    customer: {
      name: "包租公 包爺",
      role: "廟街唐樓業主 · 鐵公雞",
      portrait: "assets/people/landlord.webp",
      voiceStyle: "大聲大氣，手持水煙筒，催租如催命"
    },
    piece: {
      id: "dish_celadon_longquan",
      name: "龍泉影青刻花折腰碟",
      type: "宋明青瓷 / 民窯刻花",
      period: "明代或清初仿",
      asset: "assets/plates/dish_celadon_longquan.webp",
      shardsCount: 5,
      crackLength: 340,
      minStaples: 4,
      maxStaples: 7,
      optimalStaples: 5,
      description: "釉色如青梅凝脂，刻折枝蓮花，盤底有一圈古拙澀胎，裂紋兩道穿心。"
    },
    introDialogue: [
      { speaker: "包爺", text: "葉伯！今日初七逢單，收舖位地租十二蚊港紙！一手交錢，一手撕收條！" },
      { speaker: "葉伯", text: "包爺稍安勿躁。今日檔口銀兩剛好齊備，正準備送去你府上。" },
      { speaker: "包爺", text: "順便啦！我屋企姨太太隻青瓷碟，琴晚裝荔枝跌崩咗！你今日幫我鋦返佢，修得好，我免你兩毫零碎租金；修唔好，下個月租金加兩成！" }
    ],
    inquiryTopic: "笑對包爺嘅刻薄作風",
    inquiryDialogue: [
      { speaker: "葉伯", text: "包爺呢隻影青碟，胎骨瓷實，係難得嘅溫潤之器，姨太太果然好眼光。" },
      { speaker: "包爺", text: "廢話！我老包屋企邊件唔係真金白銀買返嚟嘅？快啲開工，我企喺度睇你鑽！" }
    ],
    pricing: {
      fair: 2.0,
      high: 3.5,
      cheap: 0.0,
      options: [
        { type: "fair", price: 2.0, label: "收二蚊工費（直接抵扣今日房租）", customerReply: "算你識做，兩蚊由收條度扣出嚟！" },
        { type: "cheap", price: 0.0, label: "分文不收 · 奉茶求包爺寬限免租", customerReply: "哈哈哈！識相！葉伯，睇你咁乖，今個月租金照舊！" },
        { type: "high", price: 3.5, label: "按規矩開價三蚊半 · 絕不相讓", customerReply: "哇！敢同我包租公討價還價？修得好就罷，修唔好收你雨棚！" }
      ]
    },
    completionDialogue: {
      perfect: "包爺把玩青瓷碟，倒滿熱茶，不滲一滴：「估唔到你個老骨頭真有兩下散手！青瓷配黃銅釘，比之前仲有派頭！」",
      good: "包爺收起碟子：「行，算你過關。下個月初七記得準時交租！」",
      leaky: "包爺指著碟沿：「喂喂喂！有水滴出嚟喎！算你修得平，今次放過你！」"
    }
  },

  // DAY 7 - Rainstorm & Teahouse Owner
  {
    id: "job_d7_wong",
    day: 7,
    title: "第七日 · 暴雨殘茗",
    sceneVignette: "assets/scenes/stall_rain.webp",
    sceneDesc: "秋雨傾盆 · 綠帆布雨棚下泥水飛濺",
    customer: {
      name: "黃老闆",
      role: "蓮香茶樓東主 · 爽朗大肚漢",
      portrait: "assets/people/wong_teahouse.webp",
      voiceStyle: "宏亮熱情，充滿酒樓市井喧囂氣"
    },
    piece: {
      id: "cup_teahouse_gaiwan",
      name: "青花纏枝蓮紋蓋碗（茶樓公杯）",
      type: "茶樓專用青花耐熱厚瓷",
      period: "1930年代廣州十三行定制",
      asset: "assets/plates/cup_teahouse_gaiwan.webp",
      shardsCount: 5,
      crackLength: 300,
      minStaples: 4,
      maxStaples: 7,
      optimalStaples: 5,
      description: "杯沿刻有『蓮香』朱紅暗款，幾十年茶垢浸潤如古玉，一分為四，亟待合璧。"
    },
    introDialogue: [
      { speaker: "黃老闆", text: "（冒著傾盆大雨衝入雨棚）哈！葉伯！好大雨呀！好在你呢個綠帆布棚遮得實！" },
      { speaker: "葉伯", text: "黃老闆快入嚟避雨。抹抹雨水，飲啖粗茶暖暖身。" },
      { speaker: "黃老闆", text: "飲咩粗茶！我特登帶咗樓面元老級嘅茶公杯過嚟。茶客爭位打翻咗，伙計個個話掟咗佢換塑膠杯，我話『放屁』！舊瓷杯嘅茶味，新塑膠點比得？" }
    ],
    inquiryTopic: "聽黃老闆嘆下世道變遷",
    inquiryDialogue: [
      { speaker: "葉伯", text: "而家街上面塑膠同搪瓷越嚟越多，摔唔爛，又平又輕便。" },
      { speaker: "黃老闆", text: "就係囉！時代變得太快，大家都貪快貪平。但老廣東飲茶，飲嘅就係呢隻厚瓷燙手嘅人情味！葉伯，幫我補實佢，幾多錢我都畀！" }
    ],
    pricing: {
      fair: 2.0,
      high: 4.0,
      cheap: 1.0,
      options: [
        { type: "fair", price: 2.0, label: "收市價二元（贈送兩枚防漏釘）", customerReply: "好伙計！我就鍾意你呢種老派手藝人嘅骨氣！" },
        { type: "high", price: 4.0, label: "四元雨天加班費", customerReply: "落咁大雨開工係辛苦，四蚊畀你，唔多講！" },
        { type: "cheap", price: 1.0, label: "一元象徵收費（為茶樓留住記憶）", customerReply: "葉伯！好哥們！聽日落樓，普洱大包我包你食足一個月！" }
      ]
    },
    secondaryJob: {
      id: "sub_d7_gaiwan",
      title: "蓋碗托",
      customerName: "蓮香跑堂 榮仔",
      pieceName: "青花纏枝蓮紋杯托",
      reward: 1.5,
      staples: 2,
      description: "茶樓伙計送嚟同款摔崩之杯托，順手施兩枚小釘即可穩固。"
    },
    completionDialogue: {
      perfect: "黃老闆往杯中注水，水汽如沸，黃銅釘緊鎖厚壁：「硬淨！太硬淨喇！比原本仲有大將之風！蓮香樓嘅招牌算係保住咗！」",
      good: "黃老闆大笑：「掂！返去又可以斟畀幾十班老茶客飲茶！」",
      leaky: "黃老闆接過杯：「邊角有少少汗水，唔礙事，倒濃茶幾日就茶垢封死喇！」"
    }
  },

  // DAY 8 - Courier with Letter from Daughter
  {
    id: "job_d8_letter",
    day: 8,
    title: "第八日 · 海隅家書",
    sceneVignette: "assets/scenes/jordan_pier.webp",
    sceneDesc: "佐敦道碼頭 · 省港澳輪渡破浪而來",
    customer: {
      name: "水客九叔",
      role: "省港澳秘密信差 / 水客",
      portrait: "assets/people/macau_courier.webp",
      voiceStyle: "低沉機警，目光四顧，老水客作風"
    },
    piece: {
      id: "spoon_porcelain_shou",
      name: "粉彩萬壽無疆瓷匙",
      type: "晚清粉彩瓷匙",
      period: "光緒大婚官式民窯",
      asset: "assets/plates/spoon_porcelain_shou.webp",
      shardsCount: 4,
      crackLength: 220,
      minStaples: 2,
      maxStaples: 4,
      optimalStaples: 3,
      description: "黃地粉彩，匙柄書『萬壽無疆』，匙頸斷成兩截，細如柳葉，最考眼力與力道。"
    },
    introDialogue: [
      { speaker: "水客九叔", text: "（壓低帽簷走入攤檔）請問呢度係咪潮州庵埠葉秉衡葉老爺子嘅檔口？" },
      { speaker: "葉伯", text: "（手一抖，推了推老花鏡）……正係老朽。客官打邊度嚟……？" },
      { speaker: "水客九叔", text: "在下澳門九叔。受人所託，帶咗一封汕頭寄過嚟嘅信，同埋呢隻隨信斷開嘅匙羹。你睇睇信封筆跡就明。" }
    ],
    inquiryTopic: "拆開阿娟寄嚟嘅家書信札",
    inquiryDialogue: [
      { speaker: "葉伯", text: "（手指微顫，眼中泛起淚光）『父親大人膝下……兒在汕頭安好……妹已入學，勿念……』真係阿娟嘅筆跡！八年喇……我以為佢哋……" },
      { speaker: "水客九叔", text: "阿娟姑娘託我帶信，話呢隻匙羹係你走嗰日落低嘅。只要你鋦得好，佢就知父親健在，手藝未荒。" }
    ],
    pricing: {
      fair: 0.0,
      high: 0.0,
      cheap: 0.0,
      options: [
        { type: "cheap", price: 0.0, label: "分文不取 · 泣血修復女兒的信物", customerReply: "葉老爺子，這封信同匙羹交妥，九叔下月去汕頭定帶回覆！" },
        { type: "fair", price: 1.0, label: "贈九叔一蚊茶水費 · 託帶平安家書", customerReply: "葉老爺子你太客氣喇，大家同係天涯淪落人，呢件事包喺我九叔身上！" }
      ]
    },
    completionDialogue: {
      perfect: "葉伯屏氣凝神，以極細嘅紫銅釘咬實匙頸，光滑如初。九叔拍手讚好：「手勢真係絕！呢隻匙羹帶返去汕頭，阿娟見到實知父親喺香港過得安樂！」",
      good: "匙羹牢牢扣合，葉伯雙眼模糊，淚灑鏡片：「補得返……我們一家人，一定也補得返……」",
      leaky: "雖然略有一絲裂隙，但匙骨已連。九叔鄭重將其收入棉囊：「葉老爺子放心，心意已到。」"
    }
  },

  // DAY 9 - Scholar's Celadon & Buying Brass Staples
  {
    id: "job_d9_celadon",
    day: 9,
    title: "第九日 · 青玉餘韻",
    sceneVignette: "assets/scenes/teahouse_morning.webp",
    sceneDesc: "蓮香茶樓清晨 · 雀籠與普洱茶香",
    customer: {
      name: "陳太",
      role: "街坊鄰里 · 熟客回頭",
      portrait: "assets/people/chan_tai.webp",
      voiceStyle: "熟絡而充滿親切關切"
    },
    piece: {
      id: "dish_celadon_longquan",
      name: "龍泉影青刻花小洗",
      type: "宋代龍泉影青水洗",
      period: "宋末元初",
      asset: "assets/plates/dish_celadon_longquan.webp",
      shardsCount: 5,
      crackLength: 350,
      minStaples: 4,
      maxStaples: 7,
      optimalStaples: 5,
      description: "胎質灰白細密，釉如梅子初青，開細碎金絲片紋，口沿脫口一塊，裂及腹底。"
    },
    introDialogue: [
      { speaker: "陳太", text: "葉師傅，上次隻廣彩碟放喺神樓，街坊個個讚你手藝精巧！我隔籬鄰舍梁教書先生見咗，特登托我帶佢隻水洗過嚟。" },
      { speaker: "葉伯", text: "陳太咁客氣做咩，街坊鄰里互相照應，最緊要大家用得順手。" },
      { speaker: "陳太", text: "梁先生喺中學教國文，當呢隻水洗係命根一樣。今日聽講上海街五金舖新到咗批佛山黃銅絲，你啲銅釘仲夠唔夠用？" }
    ],
    inquiryTopic: "盤點銅釘，同陳太傾兩句",
    inquiryDialogue: [
      { speaker: "葉伯", text: "呢幾日用得快，鋦釘罐就快見底。修完呢隻水洗，正好去上海街五金行添置三打黃銅絲。" },
      { speaker: "陳太", text: "葉師傅工藝嚴謹，難怪名聲越來越響亮。" }
    ],
    pricing: {
      fair: 2.5,
      high: 4.5,
      cheap: 1.5,
      options: [
        { type: "fair", price: 2.5, label: "收取工本二元五毫", customerReply: "好，梁先生交代過，只要補得好，三幾蚊不在話下。" },
        { type: "high", price: 4.5, label: "古瓷加倍四元五毫", customerReply: "文人愛物，為保古物，這價錢亦屬合情合理。" },
        { type: "cheap", price: 1.5, label: "敬重讀書人（一元五毫）", customerReply: "葉師傅真有古仁人之風，梁先生定會手書一幅字相謝。" }
      ]
    },
    completionDialogue: {
      perfect: "影青水洗青綠如玉，五枚黃銅釘排布如花蕊初綻，水盛滿而不滲滴：「巧奪天工！陳太讚嘆，梁先生見了定要擊節長嘆！」",
      good: "盤口端正，釉面生輝，陳太滿意地捧著水洗離去。",
      leaky: "邊角有一滴微滲，但在文案盛墨水已無大礙。"
    }
  },

  // DAY 10 - Pawnshop Boss Confrontation & Choice
  {
    id: "job_d10_pawnshop_return",
    day: 10,
    title: "第十日 · 風波暗起",
    sceneVignette: "assets/scenes/pawnshop_interior.webp",
    sceneDesc: "萬安大押後堂 · 風波再起",
    customer: {
      name: "何老闆",
      role: "萬安當舖掌櫃 · 神色慌張",
      portrait: "assets/people/ho_boss.webp",
      voiceStyle: "氣急敗壞，壓低聲音"
    },
    piece: {
      id: "bowl_ming_fake",
      name: "清末仿明彩瓷花口盂",
      type: "晚清同治粉彩",
      period: "晚清仿古",
      asset: "assets/plates/bowl_ming_fake.webp",
      shardsCount: 5,
      crackLength: 360,
      minStaples: 4,
      maxStaples: 8,
      optimalStaples: 6,
      description: "一隻彩釉花口小盂，釉厚而微有沙眼，腹部有一道橫貫大裂。"
    },
    introDialogue: [
      { speaker: "何老闆", text: "葉師傅！出大事喇！前幾日嗰隻宣德龍碗，洋行買辦搵了洋行買辦專家驗過，話係同治仿品！差啲砸咗我萬安當舖個金漆招牌！" },
      { speaker: "葉伯", text: "老朽日前一早提醒何老闆，胎骨火石紅同青花色料都唔係永宣嗰期嘅舊物。" },
      { speaker: "何老闆", text: "哎！算我老何走眼！今日呢隻同治小盂，係我私家貨，你同我照實話實修，莫要再搞假大空！" }
    ],
    inquiryTopic: "勸何老闆做生意要留餘地",
    inquiryDialogue: [
      { speaker: "葉伯", text: "做古董當舖，真就係真，假就係假。鋦瓷之道，裂咗就用銅釘明示天下，從來唔遮掩偽飾。" },
      { speaker: "何老闆", text: "（擦著冷汗）葉老爺子教訓得是……經此一役，我老何算是服了你這雙毒眼。" }
    ],
    pricing: {
      fair: 2.0,
      high: 4.0,
      cheap: 1.0,
      options: [
        { type: "fair", price: 2.0, label: "平實收費二元（警鐘長鳴）", customerReply: "好好好，二蚊二蚊，多謝葉老爺子手下留情。" },
        { type: "high", price: 4.0, label: "四元懲戒性收費", customerReply: "我認罰！只要你保證唔同外面同行宣揚我眼拙就得！" },
        { type: "cheap", price: 1.0, label: "一元象徵（解冤釋結）", customerReply: "葉老爺子胸襟如海，老何日後定有厚報！" }
      ]
    },
    completionDialogue: {
      perfect: "小盂鋦得整飭周正，何老闆長吁一口氣，自慚形穢而去。",
      good: "器物復原，風波漸息。",
      leaky: "雖然略有滲縫，但何老闆已不敢再多言苛求。"
    }
  },

  // DAY 11 - The Apprentice & Arrival of Enamelware
  {
    id: "job_d11_apprentice",
    day: 11,
    title: "第十一日 · 薪火欲傳",
    sceneVignette: "assets/scenes/teahouse_morning.webp",
    sceneDesc: "茶檔灶台旁 · 少年熱切的目光",
    customer: {
      name: "細路明",
      role: "街角茶檔童工 · 滿眼熱切",
      portrait: "assets/people/kid_ming.webp",
      voiceStyle: "純真熱烈，帶著少年特有的渴望"
    },
    piece: {
      id: "cup_enamel_green",
      name: "綠邊白搪瓷馬克杯",
      type: "現代工廠沖壓搪瓷（鐵花杯）",
      period: "1950年代初期香港或上海工廠產",
      asset: "assets/plates/cup_enamel_green.webp",
      shardsCount: 4,
      crackLength: 200,
      minStaples: 2,
      maxStaples: 4,
      optimalStaples: 3,
      description: "工廠沖壓鐵皮，表面烤白色搪瓷，杯底磕掉一塊黑鐵胎，露出黑漆，象徵現代工業器皿的普及。"
    },
    introDialogue: [
      { speaker: "細路明", text: "葉伯！葉伯！你睇睇茶檔新買嘅鐵皮搪瓷杯！阿爸話呢種杯摔唔爛，日後全香港冇人再使爛瓷器喇！" },
      { speaker: "葉伯", text: "摔唔爛係好事，大家生活唔使咁提心吊膽。不過搪瓷甩漆生鏽，可就冇得鋦喇。" },
      { speaker: "細路明", text: "（突然撲通一聲跪喺長凳前）葉伯！我唔想一世做跑堂洗碗！我想同你學鋦瓷拉鑽！我眼利手定，我同你斟茶掃地，你收我做徒弟好唔好？" }
    ],
    inquiryTopic: "考下少年人嘅心性同定力",
    inquiryDialogue: [
      { speaker: "葉伯", text: "『冇咁大個頭唔好戴咁大頂帽，冇金剛鑽咪攬瓷器活』。鋦瓷要耐得住寂寞，拉弓鑽眼失手半分就粉身碎骨。你當真想學？" },
      { speaker: "細路明", text: "（挺直胸膛）我唔怕苦！我見過你將碎到不成樣嘅碗補返得滴水不漏，我覺得呢個係世上最神奇嘅手藝！" }
    ],
    pricing: {
      fair: 0.0,
      high: 0.0,
      cheap: 0.0,
      options: [
        { type: "cheap", price: 0.0, label: "允諾收徒，教他第一手磨鑽技藝", customerReply: "師父在上！徒兒細路明叩頭！我聽朝六點就嚟幫你開檔擦桌子！" },
        { type: "fair", price: 0.0, label: "讓他暫且觀摩，考驗心性三月", customerReply: "好！徒兒一定經得起考驗！師父你睇住我表現！" }
      ]
    },
    completionDialogue: {
      perfect: "葉伯手把手教細路明握穩鑽桿，皮弓來回拉動，金剛石在鐵胎與瓷釉上咬出整齊圓眼，少年眼中閃爍著耀眼星光。",
      good: "細路明認真端詳著每一步驟，把葉伯的口訣默默記在心頭。",
      leaky: "初試手感微澀，但少年熱情絲毫不減。"
    }
  },

  // DAY 12 - Climax & Letters from Beyond (Determines Ending)
  {
    id: "job_d12_finale",
    day: 12,
    title: "第十二日 · 萬家燈火",
    sceneVignette: "assets/scenes/jordan_pier.webp",
    sceneDesc: "佐敦道碼頭薄暮 · 海天一色，家書抵萬金",
    customer: {
      name: "水客九叔",
      role: "省港信差 · 帶來終章回音",
      portrait: "assets/people/macau_courier.webp",
      voiceStyle: "神色欣慰，雙手捧上一紙厚信"
    },
    piece: {
      id: "plate_01",
      name: "青花歲寒三友圓盤",
      type: "清中葉青花名品",
      period: "乾隆或嘉慶民窯精品",
      asset: "assets/plates/plate_01.webp",
      shardsCount: 5,
      crackLength: 360,
      minStaples: 4,
      maxStaples: 7,
      optimalStaples: 5,
      description: "松竹梅歲寒三友紋，歷經滄桑，盤身有一道如雷電般的長裂，象徵著分離與重聚的命運。"
    },
    introDialogue: [
      { speaker: "水客九叔", text: "葉老爺子！大喜事啊！汕頭嗰邊嚟咗特快回信，仲有過境探親嘅路條啊！" },
      { speaker: "葉伯", text: "（雙眼圓睜，呼吸屏住）九叔……你話……路條真係批落嚟喇？！" },
      { speaker: "水客九叔", text: "批咗喇！阿娟同女婿下個月初會過澳門，你可以搭輪渡去拱北關閘見面！信度話，佢哋仲留住你喺老家打嗰把紫銅錘仔！" }
    ],
    inquiryTopic: "睇完家書，望下聚埋嚟嘅街坊",
    inquiryDialogue: [
      { speaker: "葉伯", text: "離鄉八載……想不到喺油麻地呢張長凳上補咗成千隻碗，今日終於等到自己嘅家書……" },
      { speaker: "水客九叔", text: "葉老爺子德藝雙馨，成條廟街嘅街坊都戥你歡喜呀！" }
    ],
    pricing: {
      fair: 0.0,
      high: 0.0,
      cheap: 0.0,
      options: [
        { type: "fair", price: 0.0, label: "收官一作：為街坊留下最後一件完璧之作", customerReply: "葉老爺子，呢件歲寒三友盤，就係你平生最高造詣嘅見證！" }
      ]
    },
    completionDialogue: {
      perfect: "最後一枚金光璀璨的黃銅螞蝗釘落位，清脆的錘擊聲在廟街夜市迴盪，滴水不漏，四鄰同歡！",
      good: "圓盤齊整如初，街坊們爆發出一陣陣熱烈的掌聲！",
      leaky: "雖有殘痕，但此情此景，人間大圓滿！"
    }
  }
];

// Story Endings definitions based on player choices and reputation
export const ENDINGS_DATA = {
  reunion: {
    id: "ending_reunion",
    title: "海隅重逢 · 月是故鄉明",
    vignette: "assets/scenes/ending_reunion.webp",
    description: "你帶著存積的盤纏與那把老銅錘，在晨光初露的佐敦道碼頭登上輪渡。在澳門拱北關閘，你終於抱住了闊別八年的女兒阿娟。修瓷一世，碎瓦終得補完，人間至幸，莫過於骨肉重圓。"
  },
  apprentice: {
    id: "ending_apprentice",
    title: "薪火相傳 · 金剛鑽不滅",
    vignette: "assets/scenes/ending_apprentice.webp",
    description: "細路明正式拜你為師。時代在變，塑膠與鋁製品席捲香江，但這門在薄脆瓷骨上拉弓鑽眼、黃銅鎖扣的古老手藝，在少年專注清澈的眼神中得到了永生。"
  },
  peaceful: {
    id: "ending_peaceful",
    title: "時代落幕 · 煙火歸平淡",
    vignette: "assets/scenes/ending_peaceful.webp",
    description: "你平靜地收拾好行囊與工具箱。街角的雜貨舖掛滿了色彩鮮豔的塑膠桶與搪瓷碗。屬於鋦碗佬的時代漸漸遠去，但廟街的老街坊們，永遠記得那個在雨棚下點著昏黃油燈、為他們補全念想的葉伯。"
  },
  community: {
    id: "ending_community",
    title: "街坊至愛 · 德藝滿油麻地",
    vignette: "assets/scenes/ending_community.webp",
    description: "你的檔口成了廟街不可或缺的傳奇。無論貧富貴賤，只要端著碎瓷前來，你總能以最公道的價錢與最溫厚的心意化殘缺為美。油麻地的夜市燈火長明，你的銅釘在月光下閃耀著人性的光輝。"
  }
};
