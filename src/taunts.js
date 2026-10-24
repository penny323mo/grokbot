/**
 * 12碼讀心戰 (Penalty Mind Game v2) - Mind-Game Tells & Cantonese Taunts
 * Authentic Hong Kong Cantonese psychological banter and visual tells.
 */

export const TAUNTS = {
  // ==========================================
  // ROLE A: PLAYER SHOOTS, AI GOALIE RESPONDS
  // ==========================================
  KEEPER_READS_HABIT: [
    '又係左下？我睇穿你喇！',
    '你次次都射同一個位，當我死㗎？',
    '連招都唔識變，呢球我等咗好耐！',
    '又想射死角？我一早封死咗啦！',
    '你嘅出腳小習慣，喺我大腦度一清二楚！'
  ],
  KEEPER_PREDICTS_SWITCH: [
    '射完左邊轉右邊？呢招我十年前已經見過！',
    '你今次唔敢再射右邊啦嘛，果然！',
    '想玩假動作轉腳？唔好意思，我預咗你呢手！',
    '突然轉中路？一早估到你想偷雞！'
  ],
  KEEPER_SAVES_SHOT: [
    '呢球射得咁正，我瞌埋眼都接住啦！',
    '咁慢嘅波，想挑戰我反應？',
    '乖乖地認輸啦，你過唔到我十指關嘅！',
    '撲得乾脆俐落！下球射好啲啦！'
  ],
  PLAYER_SCORES: [
    '嘖！算你夠刁鑽，下球睇你仲射唔射到！',
    '好嘢，呢腳抽死角真係無嘢好講。',
    '咁都有得入？下腳我一定撲返出嚟！',
    '差少少掂到！下一球你無咁好彩㗎喇！'
  ],

  // ==========================================
  // ROLE B: PLAYER KEEPS, AI TAKER RESPONDS
  // ==========================================
  TAKER_PUNISHES_EARLY_DIVE: [
    '咁早撲定？多謝你讓半邊門畀我！',
    '一早移咗位，我輕輕鬆鬆推另一邊入！',
    '太急撲喇門將！睇住我射相反方向啦！',
    '你動態太明顯喇，我望住你移位先射！'
  ],
  TAKER_READS_DIVE_HABIT: [
    '你鋪鋪都撲右邊，我今球特登抽左上死角！',
    '你嘅撲救習慣早就被我捉到路喇！',
    '唔使睇喇，呢球肯定直入網底！',
    '估中你又會撲呢邊，輕鬆破網！'
  ],
  PLAYER_KEEPER_SAVES: [
    '竟然被你撲到？算你有兩手！',
    '好反應！下次我抽大力啲睇你救唔救到！',
    '咁都救得出？真係估你唔到！',
    '神撲！不過下腳你絕對無咁易救到！'
  ],
  TAKER_SCORES: [
    '入波！角度、力道都完美無瑕！',
    '睇住個波入網啦，呢腳你點救得到？',
    '狂抽死角，呢啲先叫做世界波！',
    '門將企喺度無反應，輕鬆入波！'
  ]
};

/**
 * Pick a random line from a list
 */
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Get context-appropriate Cantonese taunt
 * @param {string} category - Key of TAUNTS
 * @returns {string} Cantonese line
 */
export function getTaunt(category) {
  const pool = TAUNTS[category];
  if (!pool || pool.length === 0) return '嚟啦！睇下邊個笑到最後！';
  return pickRandom(pool);
}

/**
 * Compute pre-kick visual tell & bluff decision for the goalkeeper.
 * Tells honest direction or a deceptive bluff depending on difficulty tellHonesty.
 * @param {string} plannedDiveZone - Zone keeper intends to dive
 * @param {Object} diffConfig - Difficulty settings
 * @returns {Object} { tellZone, isFake, gazeHint }
 */
export function computeTell(plannedDiveZone, diffConfig) {
  const isHonest = Math.random() < diffConfig.tellHonesty;
  let tellZone = plannedDiveZone;

  if (!isHonest) {
    // Pick an opposite or different zone to bluff the shooter
    const allZones = ['TL', 'TR', 'BL', 'BR'];
    const candidates = allZones.filter(z => z !== plannedDiveZone);
    tellZone = pickRandom(candidates) || 'TL';
  }

  return {
    tellZone,
    isFake: !isHonest,
    gazeHint: diffConfig.gazeHint
  };
}
