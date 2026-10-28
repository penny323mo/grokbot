/**
 * 濠江疑案 · Harbour Casebook
 * 核心案卷資料 (Cases Registry, Hotspots, Word Banks, Deduction Templates & Solutions)
 */

export const CASES = [
  // ==========================================
  // CASE 1: 〈押〉 當舖驚魂 (The Pawnshop Shock)
  // ==========================================
  {
    id: 1,
    key: 'pawnshop',
    symbol: '押',
    title: '當舖驚魂',
    subtitle: 'The Pawnshop Shock',
    date: '1962年5月12日 · 晚間八時半',
    location: '福隆新街「德生大押」後櫃庫房',
    incidentIntro: '福隆新街的「德生大押」臨近打烊之時，掌櫃陳德生被發現倒臥於後櫃庫房，頭部遭鈍器重創身亡。昨午由名媛白蘭所抵押、價值連城的前清翡翠玉鐲不知所蹤，保險箱半掩卻無被撬痕跡……',
    sceneImage: 'assets/scenes/case1_pawnshop.webp',
    characters: ['chan_tak_sang', 'ho_bing', 'leung_ah_sei', 'pak_lan'],

    hotspots: [
      {
        id: 'c1_victim',
        x: 48,
        y: 68,
        name: '陳德生之遺體',
        desc: '死者<span class="word-chip" data-word="陳德生">陳德生</span>俯臥於血泊中，後腦骨遭受沉重鈍器猛擊破裂，並非遭<span class="word-chip" data-word="雕花裁紙刀">雕花裁紙刀</span>或<span class="word-chip" data-word="短柄火繩槍">短柄火繩槍</span>所傷。手中緊握著半張沾血的<span class="word-chip" data-word="當票存根">當票存根</span>，指甲縫殘留有幾縷粗糙的麻布纖維。'
      },
      {
        id: 'c1_abacus',
        x: 32,
        y: 58,
        name: '帶血的紅木算盤',
        desc: '紫檀木書桌旁的地上，跌落著掌櫃日常所用的<span class="word-chip" data-word="紅木算盤">紅木算盤</span>，顯非<span class="word-chip" data-word="赤手空拳">赤手空拳</span>所能造成如此重創。邊角有明顯崩裂裂痕，沾附著凝固血跡，份量沉重，正是致命兇器。'
      },
      {
        id: 'c1_safe',
        x: 20,
        y: 36,
        name: '半開的鐵皮保險箱',
        desc: '嵌在青磚牆內的重型<span class="word-chip" data-word="鐵皮保險箱">鐵皮保險箱</span>門微啟，位於<span class="word-chip" data-word="當舖庫房">當舖庫房</span>深處，雙重密碼鎖完好無損，並無撬痕。最底層原本存放貴重抵押品的錦盒已被打開，盒內原本放置的<span class="word-chip" data-word="翡翠玉鐲">翡翠玉鐲</span>已不知所蹤。'
      },
      {
        id: 'c1_handkerchief',
        x: 16,
        y: 48,
        name: '錦盒內的刺繡手帕',
        desc: '空錦盒內遺留下一條真絲<span class="word-chip" data-word="刺繡手帕">刺繡手帕</span>，角邊精工繡有白蘭花圖樣，散發著名貴典雅的<span class="word-chip" data-word="法國香水">法國香水</span>氣味，與當舖常年的樟腦霉味格格不入。'
      },
      {
        id: 'c1_desk_tea',
        x: 22,
        y: 78,
        name: '書桌上的茶具與鐵尺',
        desc: '書桌上放有陳掌櫃喝乾的普洱茶杯，以及客席的一隻<span class="word-chip" data-word="青瓷茶杯">青瓷茶杯</span>，杯緣赫然印有一道淡紅色唇膏印；桌旁還整齊擺放著掌櫃核算典當尺寸的黃銅<span class="word-chip" data-word="鐵尺">鐵尺</span>。'
      },
      {
        id: 'c1_ticket_ledger',
        x: 86,
        y: 68,
        name: '檯面當簿與印台',
        desc: '翻開的押帳流水簿上，最後一筆登記錄於<span class="word-chip" data-word="大堂櫃檯">大堂櫃檯</span>：「甲字八號，前清老坑翡翠手鐲，持票人<span class="word-chip" data-word="白蘭">白蘭</span>女士，自述此乃為<span class="word-chip" data-word="贖回家族遺物">贖回家族遺物</span>而暫押銀葡幣八千圓，限期三個月。」'
      },
      {
        id: 'c1_noodle_basket',
        x: 76,
        y: 56,
        name: '何炳的雲吞麵竹籃',
        desc: '夥計<span class="word-chip" data-word="何炳">何炳</span>聲稱八時許外出買宵夜帶回的竹籃，裡面的<span class="word-chip" data-word="雲吞麵">雲吞麵</span>早已漲開冷透，底層壓著的<span class="word-chip" data-word="福隆新街">福隆新街</span>茶樓收據時間為七時十五分，顯有偽造不在場證明之嫌。'
      },
      {
        id: 'c1_drawer_ferry',
        x: 78,
        y: 36,
        name: '夥計衣櫃中的船票',
        desc: '夥計何炳的衣櫃抽屜夾層中，藏有一張明早開往<span class="word-chip" data-word="香港">香港</span>的夜航<span class="word-chip" data-word="輪渡客票">輪渡客票</span>，以及數張高利貸字條，顯示其急需巨款用以<span class="word-chip" data-word="償還巨額賭債">償還巨額賭債</span>，甚至企圖<span class="word-chip" data-word="變賣套現逃亡">變賣套現逃亡</span>。'
      },
      {
        id: 'c1_footprints',
        x: 46,
        y: 50,
        name: '後巷通往門檻的泥印',
        desc: '從庫房側門通往<span class="word-chip" data-word="後巷天井">後巷天井</span>的地磚上，留有數個帶鹹水潮泥的<span class="word-chip" data-word="泥鞋印">泥鞋印</span>，方向通往<span class="word-chip" data-word="內港碼頭">內港碼頭</span>。排查得知碼頭苦力<span class="word-chip" data-word="梁阿四">梁阿四</span>曾路過此處送貨。'
      },
      {
        id: 'c1_alley_matches',
        x: 63,
        y: 47,
        name: '後巷地上的洋火與煙頭',
        desc: '後巷石板縫隙中散落著數枚被踩熄的煙蒂，旁邊還有一盒碼頭工會印製的<span class="word-chip" data-word="硫磺洋火">硫磺洋火</span>。街坊透露近日有可疑的<span class="word-chip" data-word="賭檔打手">賭檔打手</span>與<span class="word-chip" data-word="外江盜賊">外江盜賊</span>出沒窺探。'
      },
      {
        id: 'c1_window_grille',
        x: 16,
        y: 20,
        name: '庫房被鋸斷的鐵花窗',
        desc: '高處鐵花窗被鋼鋸鋸斷，窗台有些許鐵屑。作案者究竟意在<span class="word-chip" data-word="私吞典當物資">私吞典當物資</span>，抑或意圖<span class="word-chip" data-word="滅口掩蓋走私">滅口掩蓋走私</span>、乃至純粹<span class="word-chip" data-word="尋仇洩憤">尋仇洩憤</span>？窗開口極窄，顯係事後偽造入室假象。'
      },
      {
        id: 'c1_earring',
        x: 38,
        y: 43,
        name: '後門石階跌落的珍珠耳環',
        desc: '後門石階門檻夾縫中，半掩著一顆泛著溫潤光澤的天然<span class="word-chip" data-word="珍珠耳環">珍珠耳環</span>，鑲嵌工藝極為考究，與白蘭右耳所戴的單隻耳飾完全一致。'
      }
    ],

    wordBank: {
      people: ['陳德生', '何炳', '梁阿四', '白蘭', '賭檔打手', '外江盜賊'],
      objects: ['紅木算盤', '翡翠玉鐲', '刺繡手帕', '雲吞麵', '輪渡客票', '當票存根', '珍珠耳環', '硫磺洋火', '鐵尺', '青瓷茶杯', '泥鞋印'],
      motives: ['償還巨額賭債', '贖回家族遺物', '私吞典當物資', '滅口掩蓋走私', '尋仇洩憤', '變賣套現逃亡'],
      places: ['當舖庫房', '後巷天井', '內港碼頭', '香港', '大堂櫃檯', '福隆新街'],
      weapons: ['紅木算盤', '鐵皮保險箱', '短柄火繩槍', '雕花裁紙刀', '赤手空拳']
    },

    deductionSections: [
      {
        id: 'c1_s1',
        title: '一、死因與兇器',
        desc: '根據後櫃庫房勘驗，重組掌櫃陳德生遇害的經過：',
        template: '掌櫃 {victim} 於案發當晚在 {scene} 遭遇襲擊，致命傷係被兇手持 {weapon} 由後方猛擊頭顱破裂身亡。',
        slots: [
          { key: 'victim', label: '受害人', type: 'people', answer: '陳德生' },
          { key: 'scene', label: '遇害地點', type: 'places', answer: '當舖庫房' },
          { key: 'weapon', label: '致命兇器', type: 'weapons', answer: '紅木算盤' }
        ],
        hints: [
          '檢視遺體周圍散落的物品，留意帶有血跡且邊角崩裂的沉重工具。',
          '現場保險箱未被撬開，書桌旁倒下的物品正是掌櫃算帳之物。',
          '兇手就地取材，以「紅木算盤」從陳德生背後突襲。'
        ]
      },
      {
        id: 'c1_s2',
        title: '二、真兇與共犯動機',
        desc: '釐清失竊翡翠玉鐲的去向，指證案發核心嫌疑人與動機：',
        template: '下手行兇者係當舖學徒 {culprit}，其動機係為了 {motive}；而預謀奪取 {treasure} 的幕後同謀正是名媛 {accomplice}。',
        slots: [
          { key: 'culprit', label: '行兇者', type: 'people', answer: '何炳' },
          { key: 'motive', label: '作案動機', type: 'motives', answer: '償還巨額賭債' },
          { key: 'treasure', label: '失竊贓物', type: 'objects', answer: '翡翠玉鐲' },
          { key: 'accomplice', label: '同謀之人', type: 'people', answer: '白蘭' }
        ],
        hints: [
          '某人的宵夜時間破綻百出，且暗格藏有開往香港的船票與高利貸字條。',
          '手帕的法國香水、空茶杯的唇膏印以及後門跌落的珍珠耳飾，均指向同一位女性。',
          '何炳受白蘭利誘，合謀盜取白蘭早前迫於無奈典當的「翡翠玉鐲」，並為自己取得逃亡路費。'
        ]
      }
    ],

    whosWho: [
      { portraitId: 'chan_tak_sang', answer: '陳德生' },
      { portraitId: 'ho_bing', answer: '何炳' },
      { portraitId: 'leung_ah_sei', answer: '梁阿四' },
      { portraitId: 'pak_lan', answer: '白蘭' }
    ],

    epilogue: {
      title: '破案始末 · 福隆殘照',
      text: '當水警搜查何炳的隨身衣物，在其內襯暗袋搜出已被白蘭轉交的定金與香港夜船船票。在確鑿證據面前，何炳心理防線崩潰。\n\n原來何炳深陷字花賭局，欠下巨額高利貸，面臨被斬斷手腳的威脅。白蘭得知此事後暗中接觸何炳，以重金承諾，策劃以「夜間贖當」為名，誘騙掌櫃打開保險箱。白蘭藉敬茶分散陳掌櫃注意，何炳則持沉重算盤自背後暴起行兇，並奪走翡翠玉鐲！白蘭倉皇逃逸時跌落珍珠耳環，玉鐲則被其悄然帶走。\n\n然而，白蘭在審訊中雖承認取回玉鐲，卻堅稱玉鐲牽涉到一樁更驚人的內港秘密：「這玉鐲本非尋常飾物，乃是運往內港十六號碼頭、用以贖回先夫絕密走私暗帳的信物……」'
    }
  },

  // ==========================================
  // CASE 2: 〈潮〉 內港碼頭 (The Inner Harbour Pier)
  // ==========================================
  {
    id: 2,
    key: 'pier',
    symbol: '潮',
    title: '內港碼頭',
    subtitle: 'The Inner Harbour Pier',
    date: '1962年6月18日 · 晨曦潮退',
    location: '內港十六號碼頭「信達駁艇泊位」',
    incidentIntro: '清晨退潮之際，十六號碼頭的駁船底傳來驚呼。理貨員蘇志強浮屍於躉船木樁之間，雙手遭海纜緊縛，身上藏有一本沾滿海水、記有走私物資編號的秘密黑帳。海面晨霧未散，巡邏水警、帆船船長與碼頭工頭各執一詞……',
    sceneImage: 'assets/scenes/case2_pier.webp',
    characters: ['so_chi_keung', 'chiu_tai_sing', 'roberto_silva', 'leung_ah_sei', 'luk_chat_ye', 'blind_chuen'],

    hotspots: [
      {
        id: 'c2_victim',
        x: 46,
        y: 44,
        name: '蘇志強之浮屍',
        desc: '死者<span class="word-chip" data-word="蘇志強">蘇志強</span>雙腕被粗麻繩反綁，頸項處有深紫黑色勒痕。法醫推斷致命死因係遭兇徒以<span class="word-chip" data-word="麻繩絞殺">麻繩絞殺</span>窒息，非遭<span class="word-chip" data-word="槍擊身亡">槍擊身亡</span>或<span class="word-chip" data-word="利刃刺胸">利刃刺胸</span>，兇手更偽裝成<span class="word-chip" data-word="推入海中溺斃">推入海中溺斃</span>。'
      },
      {
        id: 'c2_ledger',
        x: 58,
        y: 56,
        name: '死者懷中的走私黑帳',
        desc: '自蘇志強貼身口袋搜出的油布包裹中，夾有一本浸濕的<span class="word-chip" data-word="秘密暗帳">秘密暗帳</span>。上面清晰記錄著每逢大潮由大眼雞帆船運往香港的違禁<span class="word-chip" data-word="鴉片煙膏">鴉片煙膏</span>，以及當舖流出的<span class="word-chip" data-word="翡翠玉鐲">翡翠玉鐲</span>運送代號。'
      },
      {
        id: 'c2_junk_ship',
        x: 72,
        y: 28,
        name: '大勝號帆船與船艙',
        desc: '泊在碼頭的帆船「大勝號」，船長為<span class="word-chip" data-word="趙大勝">趙大勝</span>。進入<span class="word-chip" data-word="大勝號船艙">大勝號船艙</span>搜查，底板暗格仍有生鴉片氣味，他推托昨夜有<span class="word-chip" data-word="外海快艇">外海快艇</span>接近，自己毫不知情。'
      },
      {
        id: 'c2_police_boat',
        x: 22,
        y: 32,
        name: '水警巡邏快艇泊位',
        desc: '水警巡督<span class="word-chip" data-word="羅拔圖">羅拔圖</span>停泊的<span class="word-chip" data-word="水警巡邏艇">水警巡邏艇</span>。昨夜有值更的<span class="word-chip" data-word="巡警隊員">巡警隊員</span>證實，該艇曾於深夜擅自熄燈駛離泊位。'
      },
      {
        id: 'c2_button',
        x: 36,
        y: 58,
        name: '躉船甲板的黃銅警鈕',
        desc: '案發第一現場<span class="word-chip" data-word="十六號碼頭躉船">十六號碼頭躉船</span>木樁夾縫中，卡著一枚刻有澳葡徽號的<span class="word-chip" data-word="黃銅警服鈕扣">黃銅警服鈕扣</span>，縫線斷裂處沾有血跡，顯然是行兇搏鬥時被生生扯落。'
      },
      {
        id: 'c2_rope',
        x: 60,
        y: 72,
        name: '沾有海蛇油的棕櫚麻繩',
        desc: '碼頭貨堆旁遺落了一截塗有海蛇油的<span class="word-chip" data-word="棕櫚麻繩">棕櫚麻繩</span>。死者生前發現帳簿意圖舉報，兇徒痛下殺手係為了<span class="word-chip" data-word="掩蓋警匪勾結走私">掩蓋警匪勾結走私</span>，亦或是內部因<span class="word-chip" data-word="分贓不均激起殺機">分贓不均激起殺機</span>？'
      },
      {
        id: 'c2_tide_clock',
        x: 12,
        y: 18,
        name: '碼頭辦公室的潮汐鐘',
        desc: '碼頭辦公室牆上的<span class="word-chip" data-word="潮汐鐘">潮汐鐘</span>顯示，昨夜正值<span class="word-chip" data-word="子時大潮">子時大潮</span>，水流最急；而直到今晨<span class="word-chip" data-word="黎明退潮">黎明退潮</span>之際浮屍才卡在木樁現形，碼頭雜工供述昨夜<span class="word-chip" data-word="戌時打烊">戌時打烊</span>後仍有人影徘徊。'
      },
      {
        id: 'c2_blind_chuen',
        x: 14,
        y: 86,
        name: '算命棚下的盲公全',
        desc: '算命盲人<span class="word-chip" data-word="盲公全">盲公全</span>作供：「昨夜大雨初歇，我聽見爭吵，有人聲稱要<span class="word-chip" data-word="揭發黑幕遭滅口">揭發黑幕遭滅口</span>，又有人企圖<span class="word-chip" data-word="侵吞走私金條">侵吞走私金條</span>，甚至叫囂要借機<span class="word-chip" data-word="報復誣陷私怨">報復誣陷私怨</span>！」'
      },
      {
        id: 'c2_cargo_hook',
        x: 26,
        y: 74,
        name: '梁阿四的鐵製搬運貨鉤',
        desc: '碼頭苦力工頭<span class="word-chip" data-word="梁阿四">梁阿四</span>隨身攜帶的<span class="word-chip" data-word="鐵製貨鉤">鐵製貨鉤</span>與麻布手套。梁阿四承認昨夜受陸七爺僱用起卸木箱，但堅稱自己只管搬貨，下半夜在工寮睡覺。'
      },
      {
        id: 'c2_luk_seat',
        x: 72,
        y: 76,
        name: '德興行帳房的象牙扇',
        desc: '走私商號<span class="word-chip" data-word="德興行帳房">德興行帳房</span>貴賓室內，東主<span class="word-chip" data-word="陸七爺">陸七爺</span>遺留下一把精緻的<span class="word-chip" data-word="象牙摺扇">象牙摺扇</span>，桌上壓著一張直通水警巡邏艇掩護離港的古董免檢提貨單。'
      },
      {
        id: 'c2_broken_watch',
        x: 50,
        y: 88,
        name: '棧橋邊碎裂的懷錶',
        desc: '死者隨身佩戴的鐵殼<span class="word-chip" data-word="碎裂懷錶">碎裂懷錶</span>，指針停留在<span class="word-chip" data-word="十一時四十分">十一時四十分</span>，表面玻璃被踩碎，旁邊留有帶釘皮靴的深刻壓痕。'
      },
      {
        id: 'c2_opium_box',
        x: 84,
        y: 84,
        name: '假冒茶葉箱的暗格木盒',
        desc: '堆疊在十六號貨倉角落的「龍井茶葉」木箱，底層雙層暗板敲擊聲音空洞，內裡竟藏有四條未經完稅的<span class="word-chip" data-word="金條">金條</span>與走私分配清單。'
      }
    ],

    wordBank: {
      people: ['蘇志強', '趙大勝', '羅拔圖', '梁阿四', '陸七爺', '盲公全', '巡警隊員'],
      objects: ['秘密暗帳', '棕櫚麻繩', '黃銅警服鈕扣', '象牙摺扇', '鐵製貨鉤', '鴉片煙膏', '金條', '翡翠玉鐲', '碎裂懷錶', '潮汐鐘'],
      motives: ['掩蓋警匪勾結走私', '揭發黑幕遭滅口', '分贓不均激起殺機', '報復誣陷私怨', '侵吞走私金條'],
      places: ['十六號碼頭躉船', '大勝號船艙', '德興行帳房', '外海快艇', '水警巡邏艇'],
      times: ['十一時四十分', '子時大潮', '黎明退潮', '戌時打烊'],
      methods: ['麻繩絞殺', '推入海中溺斃', '利刃刺胸', '槍擊身亡']
    },

    deductionSections: [
      {
        id: 'c2_s1',
        title: '一、死因與第一現場',
        desc: '解構理貨員蘇志強遇害的真實手段與現場真相：',
        template: '受害人 {victim} 於案發深夜在 {scene} 遭遇毒手，真正致命死因係遭到兇徒以 {method} 滅口，再沉屍入海。',
        slots: [
          { key: 'victim', label: '遇害者', type: 'people', answer: '蘇志強' },
          { key: 'scene', label: '遇害現場', type: 'places', answer: '十六號碼頭躉船' },
          { key: 'method', label: '致命手段', type: 'methods', answer: '麻繩絞殺' }
        ],
        hints: [
          '頸項上的深紫痕跡與躉船棧橋上的斷裂線索印證了窒息死因。',
          '死者並非死於溺水，而是於躉船上受勒斃後再被拋入海中。',
          '現場棧橋殘留有斷裂的麻繩與搏鬥痕跡，死因是「麻繩絞殺」。'
        ]
      },
      {
        id: 'c2_s2',
        title: '二、真兇身分與走私黑幕',
        desc: '揭穿內港走私網絡的官匪勾結者與行兇動機：',
        template: '親手勒殺死者的真兇係水警巡督 {killer}，其行兇動機係為了 {motive}，而背後出資指揮走私的幕後黑手係 {mastermind}。',
        slots: [
          { key: 'killer', label: '兇手', type: 'people', answer: '羅拔圖' },
          { key: 'motive', label: '殺人動機', type: 'motives', answer: '掩蓋警匪勾結走私' },
          { key: 'mastermind', label: '幕後黑手', type: 'people', answer: '陸七爺' }
        ],
        hints: [
          '第一現場棧橋夾縫中遺落之鈕扣，出自哪一位常備帶釘皮靴與制服的人？',
          '盲公全深夜聽見的爭吵對話直指警界高層收受黑錢。',
          '羅拔圖親手勒殺死者以掩蓋警匪勾結走私，背後保護傘正是陸七爺。'
        ]
      },
      {
        id: 'c2_s3',
        title: '三、碼頭命案時間線',
        desc: '重構昨夜內港十六號碼頭命案的先後事件鏈（依時間先後排列 4 個關鍵節點）：',
        template: '① 蘇志強於碼頭起獲走私之 {e1}。\n② 於 {e2} 遭到水警巡督羅拔圖堵截拷問。\n③ 羅拔圖在搏鬥中扯斷 {e3} 並勒斃死者沉屍。\n④ 翌日清晨 {e4} 屍體浮出水面被漁民起獲。',
        slots: [
          { key: 'e1', label: '第一事件物證', type: 'objects', answer: '秘密暗帳' },
          { key: 'e2', label: '第二事件時間', type: 'times', answer: '十一時四十分' },
          { key: 'e3', label: '第三事件物證', type: 'objects', answer: '黃銅警服鈕扣' },
          { key: 'e4', label: '第四事件時間', type: 'times', answer: '黎明退潮' }
        ],
        hints: [
          '死者懷中藏有抄錄的走私帳目，這是所有衝突的起點。',
          '棧橋碎裂懷錶的指針精確記錄了死者遇害的時間。',
          '死者死前奮力扯下兇手的警服鈕扣，清晨退潮時浮屍終現。'
        ]
      }
    ],

    whosWho: [
      { portraitId: 'so_chi_keung', answer: '蘇志強' },
      { portraitId: 'chiu_tai_sing', answer: '趙大勝' },
      { portraitId: 'roberto_silva', answer: '羅拔圖' },
      { portraitId: 'leung_ah_sei', answer: '梁阿四' },
      { portraitId: 'luk_chat_ye', answer: '陸七爺' },
      { portraitId: 'blind_chuen', answer: '盲公全' }
    ],

    epilogue: {
      title: '破案始末 · 濁浪沉冤',
      text: '當羅拔圖警服上少了一顆黃銅鈕扣的缺口與現場物證完全吻合時，這位不可一世的澳葡巡督終於無從狡辯。\n\n原來，理貨員蘇志強在查驗德興行貨物時，無意間查獲了隱藏在茶葉箱中的走私暗帳。蘇志強憤而欲向總督府廉政官舉報，卻不知水警巡督羅拔圖早已被陸七爺以巨額金條收買。昨夜十一時四十分，羅拔圖在躉船堵截蘇志強索取帳簿，在爭搶搏鬥中，羅拔圖用海纜絞殺蘇志強並沉屍深海。\n\n然而，暗帳中除鴉片外，還赫然記載著當舖劫案失蹤之「翡翠玉鐲」，已被作為抵押金送往清平戲院，洗白為慈善粵劇演出的巨額贊助資助款……'
    }
  },

  // ==========================================
  // CASE 3: 〈戲〉 清平戲院後台 (Backstage at Cheng Peng Theatre)
  // ==========================================
  {
    id: 3,
    key: 'theatre',
    symbol: '戲',
    title: '清平戲院後台',
    subtitle: 'Backstage at Cheng Peng Theatre',
    date: '1962年8月5日 · 晚間十時',
    location: '清平直街「清平戲院」化妝間與後台',
    incidentIntro: '座無虛席的清平戲院正演至折子戲《六國大封相》。當紅文武生鳳仙霞於換幕之際步入後台飲下一盞專屬「參蜜潤喉茶」，回到台口時突然口吐紫沫、劇烈抽搐倒斃！戲班後台人人皆有嫌隙，一場華麗皮囊下的毒殺案驟然揭開……',
    sceneImage: 'assets/scenes/case3_theatre.webp',
    characters: ['fung_sin_ha', 'yuen_so_kam', 'master_liu', 'fong_jie', 'luk_chat_ye', 'young_master_tse'],

    hotspots: [
      {
        id: 'c3_victim',
        x: 48,
        y: 50,
        name: '鳳仙霞之遺體',
        desc: '名伶<span class="word-chip" data-word="鳳仙霞">鳳仙霞</span>倒於<span class="word-chip" data-word="舞台出將口">舞台出將口</span>，口唇深紫發黑，檢驗證實服下劇毒<span class="word-chip" data-word="紅砒霜">紅砒霜</span>，並非服食<span class="word-chip" data-word="生鴉片毒液">生鴉片毒液</span>或<span class="word-chip" data-word="斷腸草汁">斷腸草汁</span>，亦非罕見的<span class="word-chip" data-word="鶴頂紅">鶴頂紅</span>。'
      },
      {
        id: 'c3_teapot',
        x: 16,
        y: 74,
        name: '專屬朱泥紫砂壺',
        desc: '化妝枱上擺放著鳳仙霞專用的<span class="word-chip" data-word="紫砂茶壺">紫砂茶壺</span>，內殘留有沖泡的<span class="word-chip" data-word="參蜜潤喉茶">參蜜潤喉茶</span>，散發出一股微弱苦味。'
      },
      {
        id: 'c3_poison_paper',
        x: 24,
        y: 86,
        name: '垃圾簍內的黃色藥紙包',
        desc: '廢紙簍中搜出一張被揉皺的<span class="word-chip" data-word="黃色藥紙包">黃色藥紙包</span>，紙角印有生藥行砒石字樣，旁邊還有一名<span class="word-chip" data-word="戲班琴師">戲班琴師</span>落下的樂譜。'
      },
      {
        id: 'c3_makeup_mirror',
        x: 82,
        y: 38,
        name: '化妝枱鏡與勒索信',
        desc: '位於<span class="word-chip" data-word="化妝枱鏡前">化妝枱鏡前</span>，插著一封匿名<span class="word-chip" data-word="威脅恐嚇信">威脅恐嚇信</span>，兇徒意圖恐嚇鳳仙霞，動機究竟是<span class="word-chip" data-word="滅口防止走私曝光">滅口防止走私曝光</span>，還是後台內部<span class="word-chip" data-word="同僚私怨報復">同僚私怨報復</span>？'
      },
      {
        id: 'c3_costume_box',
        x: 66,
        y: 52,
        name: '衣箱夾層的巨額借條',
        desc: '衣箱夾層內搜出班主<span class="word-chip" data-word="廖班主">廖班主</span>簽署的<span class="word-chip" data-word="巨額賭債借據">巨額賭債借據</span>，債權人正是戲院大股東<span class="word-chip" data-word="陸七爺">陸七爺</span>。'
      },
      {
        id: 'c3_yuen_tea',
        x: 74,
        y: 60,
        name: '阮素琴的保溫水瓶',
        desc: '花旦<span class="word-chip" data-word="阮素琴">阮素琴</span>隨身手袋中有一枚小小的<span class="word-chip" data-word="銀髮簪">銀髮簪</span>，簪尖已變黑。有人指控她下毒是為<span class="word-chip" data-word="爭奪劇團首席文武生">爭奪劇團首席文武生</span>，但她神色從容。'
      },
      {
        id: 'c3_tse_letter',
        x: 70,
        y: 74,
        name: '謝少爺的求愛信函',
        desc: '紈絝子弟<span class="word-chip" data-word="謝少爺">謝少爺</span>派人送至後台的錦盒，內有被撕爛的<span class="word-chip" data-word="求愛信函">求愛信函</span>，顯示其因求婚被拒可能<span class="word-chip" data-word="情感受挫因愛生恨">情感受挫因愛生恨</span>。'
      },
      {
        id: 'c3_insurance',
        x: 84,
        y: 72,
        name: '班主辦公桌的人壽保單',
        desc: '廖班主桌內藏有一份巨額<span class="word-chip" data-word="意外人壽保單">意外人壽保單</span>，受益人為班主本人，揭示出兇手下毒乃是為了謀害台柱以<span class="word-chip" data-word="詐領巨額保險金還債">詐領巨額保險金還債</span>。'
      },
      {
        id: 'c3_fong_key',
        x: 58,
        y: 32,
        name: '芳姐腰間的藥箱鑰匙',
        desc: '衣箱管事<span class="word-chip" data-word="芳姐">芳姐</span>掌管後台急救藥箱鑰匙，整個<span class="word-chip" data-word="清平戲院後台">清平戲院後台</span>人心惶惶。'
      },
      {
        id: 'c3_tea_dregs',
        x: 40,
        y: 60,
        name: '台口側幕散落的茶漬',
        desc: '通往舞台口的地毯上，有一攤剛打翻的茶水污漬，旁邊停著一隻被毒死的後台大老鼠，四肢僵直。'
      },
      {
        id: 'c3_luk_box',
        x: 80,
        y: 18,
        name: '二樓貴賓包廂的陸七爺座席',
        desc: '位於<span class="word-chip" data-word="二樓貴賓包廂">二樓貴賓包廂</span>的陸七爺座席，桌面擺有前兩案現身之<span class="word-chip" data-word="翡翠玉鐲">翡翠玉鐲</span>包裝錦盒，以及一張赴西望洋豪宅的<span class="word-chip" data-word="主教山私人宴會請柬">主教山私人宴會請柬</span>。'
      },
      {
        id: 'c3_backstage_door',
        x: 28,
        y: 22,
        name: '清平戲院後巷消防門',
        desc: '直通清平直街的<span class="word-chip" data-word="後巷消防門">後巷消防門</span>半虛掩，門把手上沾有少許白色粉末，地上留有男式皮鞋急促離去的鞋印。'
      }
    ],

    wordBank: {
      people: ['鳳仙霞', '阮素琴', '廖班主', '芳姐', '陸七爺', '謝少爺', '戲班琴師'],
      objects: ['紫砂茶壺', '參蜜潤喉茶', '紅砒霜', '威脅恐嚇信', '意外人壽保單', '巨額賭債借據', '銀髮簪', '求愛信函', '黃色藥紙包', '翡翠玉鐲', '主教山私人宴會請柬'],
      motives: ['詐領巨額保險金還債', '情感受挫因愛生恨', '爭奪劇團首席文武生', '滅口防止走私曝光', '同僚私怨報復'],
      places: ['清平戲院後台', '化妝枱鏡前', '舞台出將口', '二樓貴賓包廂', '後巷消防門'],
      poisons: ['紅砒霜', '生鴉片毒液', '斷腸草汁', '鶴頂紅']
    },

    deductionSections: [
      {
        id: 'c3_s1',
        title: '一、下毒手法與毒源',
        desc: '查明名伶鳳仙霞暴斃的毒殺載體與毒物真面目：',
        template: '文武生 {victim} 係於換幕時飲用專屬 {vessel} 盛載之 {drink}，攝入混入其中之劇毒 {poison} 迅速暴斃。',
        slots: [
          { key: 'victim', label: '中毒者', type: 'people', answer: '鳳仙霞' },
          { key: 'vessel', label: '下毒器皿', type: 'objects', answer: '紫砂茶壺' },
          { key: 'drink', label: '載毒飲品', type: 'objects', answer: '參蜜潤喉茶' },
          { key: 'poison', label: '致命毒物', type: 'poisons', answer: '紅砒霜' }
        ],
        hints: [
          '名伶每逢登場前必於化妝間飲用何物潤喉？',
          '廢紙簍中的同仁藥包與口唇深紫特徵直指哪一種劇毒礦物？',
          '兇手將「紅砒霜」悄然溶入鳳仙霞專用的「參蜜潤喉茶」紫砂茶壺中。'
        ]
      },
      {
        id: 'c3_s2',
        title: '二、後台真兇與殺人動機',
        desc: '排除爭風吃醋煙幕，揪出真正下毒者與其貪婪動機：',
        template: '策劃下毒的真正兇手係劇團負責人 {killer}，其作案動機係為了謀害台柱以 {motive}。',
        slots: [
          { key: 'killer', label: '真兇', type: 'people', answer: '廖班主' },
          { key: 'motive', label: '核心動機', type: 'motives', answer: '詐領巨額保險金還債' }
        ],
        hints: [
          '芳姐的鑰匙雖掌管藥箱，但抽屜藏有高額借據與人壽保單的又是何人？',
          '謝少爺雖有求愛信，但真正急需五萬圓巨款填補賭債黑洞的是誰？',
          '廖班主為詐領五萬圓人壽保單賠償還賭債，自後台急救箱偷取砒霜毒殺鳳仙霞。'
        ]
      },
      {
        id: 'c3_s3',
        title: '三、黑金交易與同台秘密',
        desc: '揭示包廂貴賓與後台各人交織的陰謀線索：',
        template: '幕後操盤走私的 {mastermind} 企圖利用戲院洗白黑金，而二幫花旦 {informant} 雖早知茶中有異，卻暗中搜集罪證欲於 {destination} 揭發真相。',
        slots: [
          { key: 'mastermind', label: '幕後商人', type: 'people', answer: '陸七爺' },
          { key: 'informant', label: '知情線人', type: 'people', answer: '阮素琴' },
          { key: 'destination', label: '終極聚會', type: 'objects', answer: '主教山私人宴會請柬' }
        ],
        hints: [
          '二樓貴賓包廂內放有翡翠玉鐲空盒與主教山請柬的大亨是誰？',
          '隨身藏有銀髮簪、早知茶有毒卻忍而不發的花旦是誰？',
          '阮素琴暗中效力於正義陣營，正伺機利用主教山宴會將陸七爺一網打盡。'
        ]
      }
    ],

    whosWho: [
      { portraitId: 'fung_sin_ha', answer: '鳳仙霞' },
      { portraitId: 'yuen_so_kam', answer: '阮素琴' },
      { portraitId: 'master_liu', answer: '廖班主' },
      { portraitId: 'fong_jie', answer: '芳姐' },
      { portraitId: 'luk_chat_ye', answer: '陸七爺' },
      { portraitId: 'young_master_tse', answer: '謝少爺' }
    ],

    epilogue: {
      title: '破案始末 · 斷腸紅伶',
      text: '廖班主在面對那份受益人為自己的巨額保單與藥包指紋時，癱倒在地嚎啕認罪。\n\n原來鳳仙霞因得知劇團替陸七爺走私集團洗錢洗黑金，威脅要向港督廉署揭發並脫離劇團。廖班主在葡京賭廳輸光家底，欠下陸七爺高利貸，在絕望中鋌而走險，偷取衣箱常備砒霜溶入參茶，企圖詐領五萬圓人壽保金兼殺人滅口。\n\n然而，暗中用銀簪探知毒情的阮素琴，卻將這杯毒茶背後的整套走私洗錢聯絡圖悄悄藏起。她找到了白蘭，將目光投向了中秋之夜在主教山西望洋豪宅舉辦的殖民地政商私宴——那裡正是澳督顧問佩雷拉與陸七爺最後銷贓交易的巢穴！'
    }
  },

  // ==========================================
  // CASE 4: 〈燈〉 主教山之夜 (Night at Penha Hill) — GRAND FINALE!
  // ==========================================
  {
    id: 4,
    key: 'penha',
    symbol: '燈',
    title: '主教山之夜',
    subtitle: 'Night at Penha Hill',
    date: '1962年9月23日 · 中秋夜',
    location: '西望洋山（主教山）佩雷拉官邸花園與小堂山徑',
    incidentIntro: '中秋良夜，銀盤高懸，西望洋主教山小堂鐘聲迴盪。澳督首席華人事務顧問佩雷拉於官邸花園石欄邊被槍殺倒斃！Case 1 失竊的翡翠玉鐲、Case 2 沉沒的走私暗帳、Case 3 戲班背後的黑金流轉，三案伏線於此全盤匯攏，一場撼動澳門殖民權力頂層的黑幕即將水落石出！',
    sceneImage: 'assets/scenes/case4_penha.webp',
    characters: ['pereira', 'luk_chat_ye', 'pak_lan', 'roberto_silva', 'yuen_so_kam', 'leung_ah_sei', 'father_stubbs', 'mute_gardener'],

    hotspots: [
      {
        id: 'c4_victim',
        x: 38,
        y: 62,
        name: '佩雷拉之遺體',
        desc: '澳督政務顧問<span class="word-chip" data-word="佩雷拉">佩雷拉</span>仰臥於石欄旁，胸口中槍身亡，彈孔周圍帶有近距離射擊特有的<span class="word-chip" data-word="火藥灼痕">火藥灼痕</span>，而非遭刺客使用<span class="word-chip" data-word="利刃匕首">利刃匕首</span>或<span class="word-chip" data-word="西洋細劍">西洋細劍</span>刺殺。'
      },
      {
        id: 'c4_gun',
        x: 18,
        y: 90,
        name: '玫瑰花叢中之手槍',
        desc: '紅玫瑰灌木叢中拋棄了一柄消音<span class="word-chip" data-word="德製瓦爾特手槍">德製瓦爾特手槍</span>，非警用<span class="word-chip" data-word="配槍制式駁殼">配槍制式駁殼</span>，握柄刻有走私梟雄<span class="word-chip" data-word="陸七爺">陸七爺</span>德興行的暗記。'
      },
      {
        id: 'c4_bracelet_box',
        x: 44,
        y: 88,
        name: '石桌上的紅木首飾盒',
        desc: '觀景石桌上打開的雕花木盒內，失蹤數月的福隆新街當舖國寶<span class="word-chip" data-word="翡翠玉鐲">翡翠玉鐲</span>正靜臥於黃金絨布上！旁邊放有海外買家的<span class="word-chip" data-word="巨額美金本票">巨額美金本票</span>，引發了二人<span class="word-chip" data-word="黑吃黑分贓內訌">黑吃黑分贓內訌</span>，陸七爺更企圖<span class="word-chip" data-word="私吞走私巨款逃亡">私吞走私巨款逃亡</span>。'
      },
      {
        id: 'c4_dossier',
        x: 30,
        y: 78,
        name: '佩雷拉公事包的絕密名單',
        desc: '草地上的公文袋中，有佩雷拉簽署的<span class="word-chip" data-word="特許走私名單">特許走私名單</span>，記載警界在碼頭的分贓比率，更附有碼頭案中那本染血的<span class="word-chip" data-word="秘密暗帳">秘密暗帳</span>抄本副本。'
      },
      {
        id: 'c4_pak_lan',
        x: 62,
        y: 68,
        name: '手持遺囑的白蘭',
        desc: '名媛<span class="word-chip" data-word="白蘭">白蘭</span>手持其亡夫抗日文保遺囑，誓言要<span class="word-chip" data-word="追回失落家族遺物">追回失落家族遺物</span>並全力<span class="word-chip" data-word="剷除政商勾結黑幕">剷除政商勾結黑幕</span>。'
      },
      {
        id: 'c4_roberto',
        x: 30,
        y: 44,
        name: '帶隊搜查的水警羅拔圖',
        desc: '水警巡督<span class="word-chip" data-word="羅拔圖">羅拔圖</span>帶隊封鎖現場，他聲稱要戴罪立功指證主使，洗脫罪名。'
      },
      {
        id: 'c4_yuen_so_kam',
        x: 54,
        y: 46,
        name: '阮素琴帶來的戲院黑帳',
        desc: '花旦<span class="word-chip" data-word="阮素琴">阮素琴</span>呈上戲班秘密帳簿，誓要<span class="word-chip" data-word="為死難船員復仇">為死難船員復仇</span>，揭發陸七爺與佩雷拉洗錢罪狀。'
      },
      {
        id: 'c4_leung_cart',
        x: 16,
        y: 48,
        name: '梁阿四拉來的人力黃包車',
        desc: '苦力<span class="word-chip" data-word="梁阿四">梁阿四</span>拉黃包車上山送客，目睹陸七爺進入花園與佩雷拉爭吵拔槍。'
      },
      {
        id: 'c4_father_stubbs',
        x: 68,
        y: 36,
        name: '主教山小堂門前的神父',
        desc: '位於<span class="word-chip" data-word="主教山小堂門前">主教山小堂門前</span>，司鐸<span class="word-chip" data-word="司徒拔神父">司徒拔神父</span>手持聖經，指證陸七爺行兇後曾試圖闖入小堂避難。'
      },
      {
        id: 'c4_gardener',
        x: 84,
        y: 90,
        name: '目擊一切的啞巴花匠',
        desc: '花園中的<span class="word-chip" data-word="啞巴花匠">啞巴花匠</span>比劃手勢，指出整個兇殺過程發生在<span class="word-chip" data-word="主教山官邸花園">主教山官邸花園</span>中央。'
      },
      {
        id: 'c4_fence_cloth',
        x: 88,
        y: 42,
        name: '山徑鐵絲網掛著的黑綢布料',
        desc: '通往後山鐵絲網的<span class="word-chip" data-word="後山鐵絲網山徑">後山鐵絲網山徑</span>上，掛有截撕裂的<span class="word-chip" data-word="黑金絲綢布料">黑金絲綢布料</span>，與陸七爺長袍完全吻合。'
      },
      {
        id: 'c4_overlook',
        x: 42,
        y: 26,
        name: '西望洋石欄觀景台',
        desc: '登上<span class="word-chip" data-word="西望洋石欄觀景台">西望洋石欄觀景台</span>遠眺，內港與南灣夜景盡收眼底，月光普照濠江。'
      }
    ],

    wordBank: {
      people: ['佩雷拉', '陸七爺', '白蘭', '羅拔圖', '阮素琴', '梁阿四', '司徒拔神父', '啞巴花匠'],
      objects: ['德製瓦爾特手槍', '翡翠玉鐲', '特許走私名單', '巨額美金本票', '黑金絲綢布料', '秘密暗帳', '火藥灼痕'],
      motives: ['黑吃黑分贓內訌', '追回失落家族遺物', '剷除政商勾結黑幕', '為死難船員復仇', '私吞走私巨款逃亡'],
      places: ['主教山官邸花園', '主教山小堂門前', '西望洋石欄觀景台', '後山鐵絲網山徑'],
      weapons: ['德製瓦爾特手槍', '配槍制式駁殼', '利刃匕首', '西洋細劍']
    },

    deductionSections: [
      {
        id: 'c4_s1',
        title: '一、主教山致命槍擊',
        desc: '重構主教山官邸花園致命槍殺的真兇與直接兇器：',
        template: '澳督政務顧問 {victim} 於西望洋石欄旁遭近距槍殺，真正開槍兇手係走私梟雄 {killer}，所使用之行兇武器係 {weapon}。',
        slots: [
          { key: 'victim', label: '被害高官', type: 'people', answer: '佩雷拉' },
          { key: 'killer', label: '開槍兇手', type: 'people', answer: '陸七爺' },
          { key: 'weapon', label: '行兇手槍', type: 'weapons', answer: '德製瓦爾特手槍' }
        ],
        hints: [
          '花叢中丟棄的消音手槍上刻有哪家走私商號的暗記？',
          '胸前近距離火藥灼痕表明死者死於相熟交易對象的近身突襲。',
          '陸七爺持德製瓦爾特手槍親手擊殺了企圖獨吞利益的佩雷拉。'
        ]
      },
      {
        id: 'c4_s2',
        title: '二、國寶玉鐲與黑幕內訌',
        desc: '揭穿貫穿四案的國寶翡翠玉鐲與兇殺起因：',
        template: 'Case 1 當舖劫走之 {treasure} 經內港碼頭與戲班黑金流轉，最終送至主教山充當交易抵押；陸七爺痛下殺手之動機係為了 {motive}。',
        slots: [
          { key: 'treasure', label: '跨案國寶', type: 'objects', answer: '翡翠玉鐲' },
          { key: 'motive', label: '行兇動機', type: 'motives', answer: '黑吃黑分贓內訌' }
        ],
        hints: [
          '石桌雕花木盒內躺著的正是從福隆新街一路流轉至此的失物。',
          '美金本票與走私名單揭示了兩個巨貪在最後關頭分贓破裂。',
          '佩雷拉欲獨吞美金並以告發威脅陸七爺，引發陸七爺「黑吃黑分贓內訌」開槍殺人。'
        ]
      },
      {
        id: 'c4_s3',
        title: '三、四案交織與正義天網',
        desc: '指認在暗夜中聯手破獲這樁殖民走私大案的正義同盟：',
        template: '抗日誌士遺孀 {ally1} 歷經波折終奪回先夫國寶；二幫花旦 {ally2} 呈出戲班黑帳為愛人雪恨；而幡然悔悟指證罪魁的水警巡督係 {repentant}。',
        slots: [
          { key: 'ally1', label: '文保遺孀', type: 'people', answer: '白蘭' },
          { key: 'ally2', label: '復仇花旦', type: 'people', answer: '阮素琴' },
          { key: 'repentant', label: '戴罪立功水警', type: 'people', answer: '羅拔圖' }
        ],
        hints: [
          'Case 1 與亡夫遺物緊密相連的名媛是誰？',
          'Case 3 中身懷黑帳、一心為碼頭水手雪恨的花旦是誰？',
          'Case 2 中誤入歧途、如今戴罪立功的水警是誰？'
        ]
      },
      {
        id: 'c4_s4',
        title: '四、四案終章 · 人物全譜',
        desc: '將四案所有涉案八位關鍵人物，在主教山終局正確歸位：',
        template: '受害高官為 {p1}，走私魁首為 {p2}，苦力證人為 {p3}，庇護小堂司鐸為 {p4}。',
        slots: [
          { key: 'p1', label: '受害高官', type: 'people', answer: '佩雷拉' },
          { key: 'p2', label: '走私魁首', type: 'people', answer: '陸七爺' },
          { key: 'p3', label: '苦力證人', type: 'people', answer: '梁阿四' },
          { key: 'p4', label: '小堂神父', type: 'people', answer: '司徒拔神父' }
        ],
        hints: [
          '四案人物各居其位，結合前三案卷宗與今晚花園目擊者供詞即可辨別。',
          '佩雷拉為中槍高官，陸七爺為幕後走私罪魁，梁阿四拉車見證，神父守於小堂。',
          '直斷關鍵人物：走私魁首正是「陸七爺」，庇護小堂司鐸為「司徒拔神父」。'
        ]
      }
    ],

    whosWho: [
      { portraitId: 'pereira', answer: '佩雷拉' },
      { portraitId: 'luk_chat_ye', answer: '陸七爺' },
      { portraitId: 'pak_lan', answer: '白蘭' },
      { portraitId: 'roberto_silva', answer: '羅拔圖' },
      { portraitId: 'yuen_so_kam', answer: '阮素琴' },
      { portraitId: 'leung_ah_sei', answer: '梁阿四' },
      { portraitId: 'father_stubbs', answer: '司徒拔神父' },
      { portraitId: 'mute_gardener', answer: '啞巴花匠' }
    ],

    epilogue: {
      title: '大結局 · 濠江破曉',
      text: '隨著陸七爺在後山鐵絲網被水警當場制服上銬，這場盤踞內港十數年的殖民官商走私巨網宣告徹底瓦解。\n\n當舖掌櫃陳德生之死（Case 1）、理貨員蘇志強之冤（Case 2）、紅伶鳳仙霞之殞（Case 3），以及西望洋主教山之槍聲（Case 4），在這一晚全部拼湊成一幅冷峻而完整的歷史圖卷。白蘭在司徒拔神父見證下將清清白白的先夫翡翠玉鐲捐獻予文保館；阮素琴迎著晨風在海堤為愛人默哀；梁阿四拿回了母親的銀簪與尊嚴。\n\n晨曦穿透薄霧，染紅了內港平靜的波濤。1962年的澳門，在一頁頁手書案卷的墨香中，迎來了破曉第一道曙光。'
    }
  }
];
