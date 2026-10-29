// Events & Progression Data for Midnight Touge (《夜峠》)

export function resolveMedal(event, result = {}) {
  const mode = event.mode || (event.isBattle ? "battle" : "time_attack");

  if (mode === "battle") {
    const gap = result.gapSeconds !== undefined ? result.gapSeconds : (result.gap || 0);
    const reqGap = event.targetGap || 3.5;
    if (gap >= reqGap) return "gold";
    if (gap >= reqGap * 0.5) return "silver";
    if (gap >= 0.0) return "bronze";
    return null;
  }

  if (mode === "drift_challenge") {
    const score = result.driftScore || 0;
    const targets = event.scoreTargets || { gold: 8000, silver: 5500, bronze: 3000 };
    if (score >= targets.gold) return "gold";
    if (score >= targets.silver) return "silver";
    if (score >= targets.bronze) return "bronze";
    return null;
  }

  // time_attack & free_run (A zero clock must never write a medal)
  const time = result.time !== undefined ? result.time : (result.totalTime || 999.0);
  if (time <= 0.1) return null;
  const targets = event.timeTargets || { gold: 60.0, silver: 70.0, bronze: 80.0 };
  if (time <= targets.gold) return "gold";
  if (time <= targets.silver) return "silver";
  if (time <= targets.bronze) return "bronze";
  return null;
}

export const FREE_RUN_EVENT = {
  id: 0,
  title: "自由練習 · 全線漫遊",
  subtitle: "FREE RUN PRACTICE · KIRINE FULL COURSE",
  mode: "free_run",
  direction: "downhill",
  weather: "midnight",
  startDist: 0,
  targetDist: 2990,
  timeTargets: { gold: 120.0, silver: 140.0, bronze: 180.0 },
  rewardCoins: { gold: 100, silver: 50, bronze: 20 },
  desc: "無時間與積分限制的自由試車模式。隨意練習慣性甩尾、反打角度與排水溝切入，享受午夜霧嶺的純粹駕駛快感。"
};

export const EVENTS_DATA = [
  {
    id: 1,
    title: "STAGE 01 · 霧嶺初試",
    subtitle: "DOWNHILL TIME ATTACK · SECTOR 1-2",
    mode: "time_attack",
    direction: "downhill",
    weather: "midnight",
    startDist: 0,
    targetDist: 1250,
    timeTargets: { gold: 52.0, silver: 58.0, bronze: 66.0 },
    rewardCoins: { gold: 300, silver: 150, bronze: 80 },
    desc: "在深夜熟悉霧嶺山道。自山頂起跑，衝過高原高速連彎並飛躍溪谷赤橋。注意重心轉移帶來的車尾滑移。"
  },
  {
    id: 2,
    title: "STAGE 02 · 黎明迷霧",
    subtitle: "DOWNHILL TIME ATTACK · FULL COURSE",
    mode: "time_attack",
    direction: "downhill",
    weather: "dawn_mist",
    startDist: 0,
    targetDist: 2990,
    timeTargets: { gold: 125.0, silver: 138.0, bronze: 155.0 },
    rewardCoins: { gold: 500, silver: 250, bronze: 120 },
    desc: "黎明時分山間濃霧瀰漫，視距收縮至百米內。全線挑戰 2.8 公里下坡，精確掌握五連髮夾彎的減速切入點。"
  },
  {
    id: 3,
    title: "STAGE 03 · 五連髮夾專精",
    subtitle: "DRIFT SCORE CHALLENGE · 5 HAIRPINS",
    mode: "drift_challenge",
    direction: "downhill",
    weather: "midnight",
    startDist: 1250,
    targetDist: 2150,
    scoreTargets: { gold: 8500, silver: 6000, bronze: 3500 },
    rewardCoins: { gold: 600, silver: 300, bronze: 150 },
    desc: "傳說中的五連髮夾彎區間。利用手煞車或收油重心前移拉開車尾，在連續的180度回頭彎中保持橫移姿態，積累高額甩尾積分！"
  },
  {
    id: 4,
    title: "STAGE 04 · 追擊初戰 · 黑色GT-20",
    subtitle: "RIVAL BATTLE · CHASE RUN",
    mode: "battle",
    direction: "downhill",
    weather: "midnight",
    startDist: 0,
    targetDist: 2990,
    rivalCar: "gt20",
    rivalName: "黑曜車手 · 峰",
    targetGap: 3.5, // Lead or pull 3.5s gap to win
    rivalTargetTime: 124.0,
    rewardCoins: { gold: 800, silver: 400, bronze: 200 },
    desc: "當地車隊的渦輪轎跑發起夜戰挑戰！緊咬前車尾燈，在其髮夾彎推頭時伺機由內側抽頭超車！"
  },
  {
    id: 5,
    title: "STAGE 05 · 雨夜狂潮",
    subtitle: "RAINY NIGHT DOWNHILL · WET ASPHALT",
    mode: "time_attack",
    direction: "downhill",
    weather: "rainy_night",
    startDist: 0,
    targetDist: 2990,
    timeTargets: { gold: 135.0, silver: 148.0, bronze: 168.0 },
    rewardCoins: { gold: 900, silver: 450, bronze: 220 },
    desc: "暴雨浸濕山道路面，柏油抓地力下降 30%。任何過猛的打盤都會引發劇烈轉向過度，需極高超的反打修正功力。"
  },
  {
    id: 6,
    title: "STAGE 06 · 逆走攀爬 · 上坡之戰",
    subtitle: "UPHILL TIME ATTACK · POWER TRIAL",
    mode: "time_attack",
    direction: "uphill",
    weather: "midnight",
    startDist: 2990,
    targetDist: 0,
    timeTargets: { gold: 140.0, silver: 155.0, bronze: 175.0 },
    rewardCoins: { gold: 1000, silver: 500, bronze: 250 },
    desc: "由山腳向山頂逆向攀爬！考驗出彎動力銜接，五連髮夾彎出彎時不可流失轉速，維持高轉扭力輸出。"
  },
  {
    id: 7,
    title: "STAGE 07 · 赤橋幽靈 · 黃金轉子",
    subtitle: "RIVAL BATTLE · ROTARY DUEL",
    mode: "battle",
    direction: "downhill",
    weather: "midnight",
    startDist: 0,
    targetDist: 2990,
    rivalCar: "re7",
    rivalName: "赤焰之翼 · 凌雲",
    targetGap: 4.0,
    rivalTargetTime: 118.0,
    rewardCoins: { gold: 1200, silver: 600, bronze: 300 },
    desc: "縣外遠征的赤焰轉子跑車！其在高速彎道的抓地走線堪稱教科書，唯有在五連髮夾彎運用排水溝落差才能打破僵局！"
  },
  {
    id: 8,
    title: "STAGE 08 · 溝落とし · 排水溝極意",
    subtitle: "TECHNIQUE TRIAL · GUTTER DROP",
    mode: "drift_challenge",
    direction: "downhill",
    weather: "midnight",
    startDist: 1200,
    targetDist: 2200,
    scoreTargets: { gold: 12000, silver: 8500, bronze: 5000 },
    rewardCoins: { gold: 1400, silver: 700, bronze: 350 },
    desc: "在五連髮夾彎的內側將內側輪胎卡入無蓋水泥排水溝！利用向心離心力鎖定過彎半徑，實現零失速的極致切入。"
  },
  {
    id: 9,
    title: "STAGE 09 · 暴風雨夜戰",
    subtitle: "HEAVY RAIN BATTLE · ZERO TRACTION",
    mode: "battle",
    direction: "downhill",
    weather: "rainy_night",
    startDist: 0,
    targetDist: 2990,
    rivalCar: "gt20",
    rivalName: "雨夜狂魔 · 健",
    targetGap: 4.5,
    rivalTargetTime: 132.0,
    rewardCoins: { gold: 1600, silver: 800, bronze: 400 },
    desc: "深宵雷暴降臨霧嶺，水花四濺！對手輪胎打滑頻繁，利用靈活的重量轉移在連續彎中拉開絕殺差距。"
  },
  {
    id: 10,
    title: "STAGE 10 · 破曉狂飆 · 二分二十極限",
    subtitle: "TIME ATTACK · SUB 2:20 SPRINT",
    mode: "time_attack",
    direction: "downhill",
    weather: "dawn_mist",
    startDist: 0,
    targetDist: 2990,
    timeTargets: { gold: 118.0, silver: 128.0, bronze: 140.0 },
    rewardCoins: { gold: 1800, silver: 900, bronze: 450 },
    desc: "逼近極限的下坡圈速挑戰！每處彎角都必須切中外內外切線，隧道段以超過 180 km/h 呼嘯掠過。"
  },
  {
    id: 11,
    title: "STAGE 11 · 霧嶺傳說 · 黑白幽靈",
    subtitle: "RIVAL BATTLE · PHANTOM H-86",
    mode: "battle",
    direction: "downhill",
    weather: "midnight",
    startDist: 0,
    targetDist: 2990,
    rivalCar: "h86",
    rivalName: "山道宿老 · 峰雲",
    targetGap: 5.0,
    rivalTargetTime: 114.0,
    rewardCoins: { gold: 2200, silver: 1100, bronze: 550 },
    desc: "同款輕量雙色掀背的宿命對決！對手擁有完美無缺的慣性甩尾入彎技術。今夜，在霧嶺的瀝青路面上決出誰才是真正的下坡天賦！"
  },
  {
    id: 12,
    title: "STAGE 12 · 終極峠王 · 金盃之冠",
    subtitle: "GRAND FINALE · MASTER OF KIRINE",
    mode: "battle",
    direction: "downhill",
    weather: "midnight",
    startDist: 0,
    targetDist: 2990,
    rivalCar: "re7",
    rivalName: "霧嶺下坡王 · 終章",
    targetGap: 6.0,
    rivalTargetTime: 110.0,
    rewardCoins: { gold: 3000, silver: 1500, bronze: 800 },
    desc: "霧嶺山道最終決戰！全島頂尖車手雲集山頂。毫無保留地釋放油門、胎煙與心跳，寫下屬於你的下坡神話！"
  }
];
