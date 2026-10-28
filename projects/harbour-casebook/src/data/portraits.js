/**
 * 濠江疑案 · Harbour Casebook
 * 人物圖鑑與 WebP 肖像 (Character Portraits)
 * 1962 Macau Archival Paper & Ink Style
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
    img: 'assets/portraits/chan_tak_sang.webp',
    get svg() { return `<img class="portrait-img" src="${this.img}" alt="${this.name}" />`; }
  },

  ho_bing: {
    id: 'ho_bing',
    name: '何炳',
    age: '22歲',
    title: '德生大押 夥計（學徒）',
    cases: [1],
    desc: '陳掌櫃帶出道的遠房後生。性格怯弱卻暗藏賭癮，平日在庫房負責點貨搬運，手腳勤快但眼神閃爍。',
    img: 'assets/portraits/ho_bing.webp',
    get svg() { return `<img class="portrait-img" src="${this.img}" alt="${this.name}" />`; }
  },

  leung_ah_sei: {
    id: 'leung_ah_sei',
    name: '梁阿四',
    age: '35歲',
    title: '碼頭苦力（咕喱頭）',
    cases: [1, 2, 4],
    desc: '長年在內港十六號碼頭搬運貨物，身材魁梧，性情耿直暴躁。曾因老母重病被迫借高利貸，對當舖盤剝深惡痛絕。',
    img: 'assets/portraits/leung_ah_sei.webp',
    get svg() { return `<img class="portrait-img" src="${this.img}" alt="${this.name}" />`; }
  },

  pak_lan: {
    id: 'pak_lan',
    name: '白蘭',
    age: '32歲',
    title: '名媛貴婦 · 抗日誌士遺孀',
    cases: [1, 4],
    desc: '端莊高雅，言行透著書香世家風骨。常著墨綠絲絨旗袍，其亡夫曾為抗戰時期嶺南文保志士，生前託管一批重要遺物。',
    img: 'assets/portraits/pak_lan.webp',
    get svg() { return `<img class="portrait-img" src="${this.img}" alt="${this.name}" />`; }
  },

  // Case 2 Characters
  so_chi_keung: {
    id: 'so_chi_keung',
    name: '蘇志強',
    age: '28歲',
    title: '信達駁運 理貨員（遇害者）',
    cases: [2],
    desc: '內港碼頭理貨員，老實規矩，字跡工整。意外發現貨單暗藏走私鴉片與古董，暗自搜集證據卻招來殺身之禍。',
    img: 'assets/portraits/so_chi_keung.webp',
    get svg() { return `<img class="portrait-img" src="${this.img}" alt="${this.name}" />`; }
  },

  chiu_tai_sing: {
    id: 'chiu_tai_sing',
    name: '趙大勝',
    age: '46歲',
    title: '「大勝號」帆船 船長',
    cases: [2],
    desc: '內港老行尊，往來珠江口數十載。滿臉風霜，言談粗豪，雖懂避開水警巡邏，但恪守水上人「不涉人命」的底線。',
    img: 'assets/portraits/chiu_tai_sing.webp',
    get svg() { return `<img class="portrait-img" src="${this.img}" alt="${this.name}" />`; }
  },

  roberto_silva: {
    id: 'roberto_silva',
    name: '羅拔圖',
    age: '38歲',
    title: '澳葡水警 巡督（Inspector）',
    cases: [2, 4],
    desc: '土生葡人，執掌內港夜巡防務。精通粵葡雙語，表面收取常規規費默許小宗走私，暗地卻在秘密調查官商勾結的大案。',
    img: 'assets/portraits/roberto_silva.webp',
    get svg() { return `<img class="portrait-img" src="${this.img}" alt="${this.name}" />`; }
  },

  luk_chat_ye: {
    id: 'luk_chat_ye',
    name: '陸七爺',
    age: '55歲',
    title: '德興行 東主 · 內港梟雄',
    cases: [2, 3, 4],
    desc: '內港走私網絡的實際掌控者，手眼通天。常坐茶樓包廂遙控局勢，表面熱心慈善粵劇，實則心狠手辣，不留活口。',
    img: 'assets/portraits/luk_chat_ye.webp',
    get svg() { return `<img class="portrait-img" src="${this.img}" alt="${this.name}" />`; }
  },

  blind_chuen: {
    id: 'blind_chuen',
    name: '盲公全',
    age: '60歲',
    title: '碼頭算命先生',
    cases: [2],
    desc: '自幼失明，長年駐足內港十六號碼頭避雨棚替人測字算命。耳音極靈，能憑腳步聲與水響辨識來人及貨物種類。',
    img: 'assets/portraits/blind_chuen.webp',
    get svg() { return `<img class="portrait-img" src="${this.img}" alt="${this.name}" />`; }
  },

  // Case 3 Characters
  fung_sin_ha: {
    id: 'fung_sin_ha',
    name: '鳳仙霞',
    age: '30歲',
    title: '當紅粵劇名伶 · 文武生',
    cases: [3],
    desc: '清平戲院台柱，扮相俊秀倜儻，名噪省港澳。持才傲物，與同班花旦及班主因分紅產生嫌隙，飲下潤喉茶後暴斃。',
    img: 'assets/portraits/fung_sin_ha.webp',
    get svg() { return `<img class="portrait-img" src="${this.img}" alt="${this.name}" />`; }
  },

  yuen_so_kam: {
    id: 'yuen_so_kam',
    name: '阮素琴',
    age: '25歲',
    title: '二幫花旦 · 潛伏線人',
    cases: [3, 4],
    desc: '扮相溫婉，唱腔如黃鶯出谷。長年活在鳳仙霞光芒下，實則其初戀乃被走私集團害死的碼頭水手，暗中助白蘭蒐證。',
    img: 'assets/portraits/yuen_so_kam.webp',
    get svg() { return `<img class="portrait-img" src="${this.img}" alt="${this.name}" />`; }
  },

  master_liu: {
    id: 'master_liu',
    name: '廖班主',
    age: '52歲',
    title: '清平劇團 班主',
    cases: [3],
    desc: '精打細算的老油條，周旋於黑白兩道與贊助豪客之間。因在葡京賭廳欠下巨額賭債，瀕臨破產，急欲侵吞保險金。',
    img: 'assets/portraits/master_liu.webp',
    get svg() { return `<img class="portrait-img" src="${this.img}" alt="${this.name}" />`; }
  },

  fong_jie: {
    id: 'fong_jie',
    name: '芳姐',
    age: '48歲',
    title: '戲班衣箱管事',
    cases: [3],
    desc: '掌管劇團首飾箱與後台百寶箱三十年，目光銳利，對後台眾人隱私瞭如指掌。為人嚴苛冷靜，只效忠劇團傳承。',
    img: 'assets/portraits/fong_jie.webp',
    get svg() { return `<img class="portrait-img" src="${this.img}" alt="${this.name}" />`; }
  },

  young_master_tse: {
    id: 'young_master_tse',
    name: '謝少爺',
    age: '24歲',
    title: '紈絝子弟 · 狂熱戲迷',
    cases: [3],
    desc: '大富商之幼子，身穿昂貴西裝，每逢鳳仙霞登台必包前排雅座。曾送厚禮求愛遭拒，羞惱下揚言要讓鳳仙霞「永遠開唔到聲」。',
    img: 'assets/portraits/young_master_tse.webp',
    get svg() { return `<img class="portrait-img" src="${this.img}" alt="${this.name}" />`; }
  },

  // Case 4 Characters
  pereira: {
    id: 'pereira',
    name: '佩雷拉',
    age: '50歲',
    title: '澳督政務顧問（遇害者）',
    cases: [4],
    desc: '莫督憲內閣首席華人事務顧問，掌控口岸特許批給與洋行牌照。表面推崇中葡親善，私下卻利用職權為陸七爺走私集團充當保護傘。',
    img: 'assets/portraits/pereira.webp',
    get svg() { return `<img class="portrait-img" src="${this.img}" alt="${this.name}" />`; }
  },

  father_stubbs: {
    id: 'father_stubbs',
    name: '司徒拔神父',
    age: '62歲',
    title: '西望洋主教山小堂 司鐸',
    cases: [4],
    desc: '天主教耶穌會神父，在澳門傳教逾三十載。主持主教山小堂，精通拉丁文與古籍整理，深知西望洋官邸內各路名流往來的秘辛。',
    img: 'assets/portraits/father_stubbs.webp',
    get svg() { return `<img class="portrait-img" src="${this.img}" alt="${this.name}" />`; }
  },

  mute_gardener: {
    id: 'mute_gardener',
    name: '啞巴花匠',
    age: '42歲',
    title: '官邸花匠 · 關鍵目擊者',
    cases: [4],
    desc: '主教山官邸的老花匠，口不能言但耳聰目明。中秋夜在花園修剪茶花時，目睹了松林中黑影交接與致命槍聲。',
    img: 'assets/portraits/mute_gardener.webp',
    get svg() { return `<img class="portrait-img" src="${this.img}" alt="${this.name}" />`; }
  }
};
