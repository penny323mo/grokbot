# ⚽ 12碼讀心戰 (Penalty Mind Game v2)

「向球門揮動手指射門——你夠唔夠膽呃過 AI 門將？」

專為 iPhone Safari (390×844) 與現代瀏覽器打造嘅 **3D 擬真點球心理戰遊戲**。
全新升級為 **Three.js 3D 球場視角**、**手指滑動起腳（力道、弧線、香蕉球旋轉）**、**2026 世界盃 16 國淘汰賽**、**更衣室解鎖（足球、球衣、球場光影氛圍）**、**獎盃陳列室**、**高畫質戰報分享卡**、**關節動態門將撲救空間計算**、**Web Audio 擬真合成音效** 及 **深度神經感知 AI 讀心模型**！
零外部 CDN 依賴、100% 離線運行、無任何構建步驟。

---

## 🎮 遊戲玩法與特色

### 1. 2026 世界盃淘汰賽 (`src/tournament.js`)
* **16 支真實國家隊對陣**：香港、日本、巴西、阿根廷、英格蘭、法國、德國、西班牙、意大利、葡萄牙、荷蘭、克羅地亞、南韓、烏拉圭、摩洛哥、墨西哥。
* **淘汰賽樹狀對陣圖 (Knockout Bracket)**：16強 (R16) → 8強 (QF) → 4強 (SF) → 決賽 (Final)，全程動態模擬其他場次真實比數。
* **鮮明對手個性 (Personalities)**：
  * **門將個性**：沉著守候（極限封堵低位）、神經刀反應（反應超快但易受虛晃）、撲救學徒（高速摸索你習慣）、門線老油條（常出假動作）。
  * **射手個性**：重砲爆射（球速極快衝擊上角死角）、死角狙擊（極限貼柱射門）、虛晃大師（善於誘騙門將提前撲出）。
* **階梯式難度自然提升**：R16 (EASY) → QF (MEDIUM) → SF (HARD) → Final (HELL)，世界之巔終極考驗！
* **快速單場模式 (Quick Match)** 依然保留，隨時於標題畫面一鍵切換。

### 2. 星星獎勵、更衣室裝備與獎盃陳列室 (`src/unlocks.js`)
* **星星獎勵機制**：每場比賽根據表現獲得星星（勝場 +1⭐、完封零封 +2⭐、神撲 ≥3 球 +2⭐、低可預測度 ≤30% +2⭐、世界盃晉級 +3⭐、世界盃冠軍 +10⭐）。
* **更衣室解鎖 (Locker Room)**：
  * **足球球皮**：經典黑白、烈焰烈火 (Fire Blast)、數碼生化 (Cyber Neon)、尊貴純金 (Gold Champions)。
  * **球隊球衣**：經典主場、街頭霓虹、黑金尊爵、復古條紋。
  * **球場氛圍**：夜場泛光燈 (Night Floodlights)、黃昏日落 (Sunset Dusk)、明媚白晝 (Daylight Pitch)。
* **榮譽獎盃陳列室 (Trophy Cabinet)**：
  * 🏆 **世界盃冠軍金盃**：連過四關捧走世界盃總冠軍！
  * 🥈 **世界盃亞軍銀牌**：過關斬將闖入世界盃決賽！
  * 🥉 **世界盃季軍銅牌**：力戰晉級世界盃四強準決賽！
  * 🧤 **金手套神撲獎**：單場完成 3 次或以上精彩撲救！
  * ⚽ **百步穿楊神射王**：單場 5 輪主射 100% 全部命中破網！
  * 🧠 **心理戰讀心狂魔**：可預測度低於 25%，連出虛晃令門將徹底崩潰！
* **儲存機制**：全數據透過 `localStorage` 安全持久化，具備損壞容錯機制。

### 3. 高畫質戰報分享卡 (`src/share.js`)
* **780×1200 Canvas 高解析度生成**：
  * 包含雙方比數、國家隊國旗、對決模式、星星獎勵。
  * **可預測度雷達指針**：清晰標註 Shannon 熵心理預測百分比與香港專屬評語。
  * **2×3 門框射門熱點微縮圖**：一眼看穿自己出招慣性。
  * **廣東話激將金句**（例如「我喺《12碼讀心戰》射爆門將，捧走世界盃！你敢唔敢入嚟挑戰？」）。
* **一鍵分享**：支援 iOS / Android 原生 `navigator.share`（直接傳送圖檔至 WhatsApp / Instagram / AirDrop）；若瀏覽器未開放檔案分享權限，則自動切換為一鍵下載及長按保存彈窗。

### 4. 攻守輪換對決 (Both Sides Shootout)
* **主射回合 (Player Strikes)**：向前滑動射門，支援力量縮放、左右香蕉波側旋弧線，太大力（> 92%）會抽高過楣。
* **把關回合 (Keeper Mode by Swipe)**：
  * 輪到你扮演門將！3D 擬真射手（`src/taker.js`）流暢助跑起腳。
  * **時機窗口**：若玩家過早起跳飛撲（> 250ms 前），射手會即刻洞悉並推射相反空門！於起腳瞬間（±200ms）滑動即可觸發極速飛撲。
  * **射手 AI 讀心大腦 (`src/takerAI.js`)**：獨立學習玩家嘅撲救習慣（頻率與二連招規律），專攻防守盲區與死角！

### 5. 心理戰預警與廣東話垃圾話 (Mind-Game Tells & Taunts)
* **門將身體重心與眼神預警**：開波前門將會於球門前移位、向某一側傾斜身體；於「難」與「地獄」模式中開啟視線眼神凝視提示。
* **香港地道廣東話垃圾話 (`src/taunts.js`)**：內建超過 30 句原汁原味港式對白氣泡（例如「又係左下？我睇穿你喇！」、「咁早撲定？多謝你讓半邊門畀我！」、「好反應！下次我抽大力啲睇你救唔救到！」），雙方攻守互相挑釁心理戰。

### 6. 場景內 3D 6區讀心光環 (In-Scene 3D Reveal)
* 每一球完成後，球門前方 6 個區域浮現 3D 半透明機率光環與百分比標籤。
* 金色光環標記足球實際過白界穿透點，青色光環標記門將手套撲救涵蓋點。

### 7. 決勝球電視轉播慢動作重播 (Slow-Motion Replay)
* 於奠定勝局嘅決勝球，自動切換為側向電視轉播機位 (Broadcast Side Angle)。
* 以 0.25x 超慢動作播放入波或神撲，屏幕上方顯示 `🔴 重播 (REPLAY)` 水印與 `跳過 ➔` 快速跳過按鈕。

### 8. 性能極致優化與 iPhone 體驗 (Performance & Polish)
* **背景休眠 (Tab Visibility Pause)**：當分頁隱藏或切換至後台時，自動暫停 WebGL 渲染循環與 WebAudio 音訊，避免後台耗電與發熱。
* **DPR 上限控制**：`devicePixelRatio` 嚴格限制於 2.0 上限，防止 Retina 高清屏渲染壓力過大。
* **減弱動態模式 (`prefers-reduced-motion`)**：偵測系統偏好，自動關閉畫面劇烈晃動 (Screen Shake) 與 Hit-stop 停頓。
* **390×844 介面微調**：嚴格落實 44px 最小觸控點規範，完美相容 iPhone Home Bar 安全區域。

---

## 🚀 本地執行與測試

### 1. 開啟遊戲
直接於瀏覽器雙擊開啟 `index.html`，或用本地 HTTP 伺服器啟動：
```bash
python3 -m http.server 8765
```
或直接於 Safari / Chrome 點開 `index.html`。

### 2. 執行單元與整合測試
本項目包含完整純邏輯單元測試與整合測試套件（共 10 套 75 題），完全毋須瀏覽器或外部依賴：
```bash
node tests/model.test.js && node tests/shot.test.js && node tests/keeperAI.test.js && node tests/input.test.js && node tests/difficulty.test.js && node tests/takerAI.test.js && node tests/taunts.test.js && node tests/match_integration.test.js && node tests/tournament.test.js && node tests/unlocks.test.js
```
測試覆蓋：
1. `tests/model.test.js` (14 題)：N-gram 規律學習、機率歸一化、`< 8` 次數據不足守衛、5 方位多變低可預測度 (< 30) 驗證。
2. `tests/shot.test.js` (7 題)：直線向上滑動映射、滑動速度與球速縮放、香蕉球 Magnus 彎曲側移、超限大力飛過界、6 區方位判定、過白界彈道延續。
3. `tests/keeperAI.test.js` (6 題)：門將預判反應決策、手套撲救範圍判定、反向飛撲漏波、極限死角高速破門、重炮拍出 vs 慢波沒收、軀幹幾何撲救判定。
4. `tests/input.test.js` (3 題)：手機 TouchEvent 滑動主射、PointerCapture 生命週期鎖定、屏幕底部 75% 起腳區域檢測。
5. `tests/difficulty.test.js` (4 題)：4 級難度單調遞增參數階梯、不分大小寫與無效輸入退回、眼神提示僅限高難度驗證。
6. `tests/takerAI.test.js` (4 題)：射手 AI 學習玩家撲救習慣並避開防守、及時懲罰過早起跳撲救、地獄難度極限死角重炮、撲救機率歸一化。
7. `tests/taunts.test.js` (22 題)：廣東話垃圾話對白庫超過 20 句（33 句）驗證、全部類別對白提取、提示誠實度分佈驗證、眼神提示狀態。
8. `tests/match_integration.test.js` (5 題)：4 級難度全 5 輪完整攻守比賽仿真驗證、提早撲救懲罰機制驗證。
9. `tests/tournament.test.js` (5 題)：16 國世界盃國家隊定義、性格特徵與代表色、淘汰賽樹狀排程、自然階梯難度升級、儲存容錯。
10. `tests/unlocks.test.js` (5 題)：星星表現公式計分、更衣室裝備花費扣款、獎盃解鎖條件判定、儲存損壞恢復。

### 3. 執行 Headless Chrome 端到端測試
```bash
node --experimental-websocket tests/r3_e2e_test.js
```

---

## 📁 檔案結構

```
2026-10-24-penalty-mind-game/
├── index.html                 # 主頁面結構、3D Canvas、世界盃對陣圖、更衣室選單、戰報分享彈窗
├── style.css                  # iPhone Safari 390px 優先樣式、世界盃賽程表、更衣室與獎盃櫃動態
├── model.js                   # 純邏輯 AI 讀心預測模型 (Markov + Shannon 熵)
├── ASSETS.md                  # 100% 程序化模型、貼圖、音效與 Three.js MIT 授權說明
├── vendor/
│   └── three.module.min.js    # Vendored Three.js r160 模組 (零外聯 CDN)
├── src/
│   ├── main.js                # 主控制器、世界盃賽事管理、更衣室裝備掛載、攻守交替與渲染循環
│   ├── scene.js               # 3D 球場、看台、燈光氛圍切換 (夜間/日落/白晝) 與轉播鏡頭
│   ├── ball.js                # 3D 足球、4 款程序化 Canvas 貼圖換皮與發光粒子拖尾
│   ├── keeper.js              # 3D 程序化守門員關節骨骼、國家隊球衣動態換色與撲救判定
│   ├── taker.js               # 3D 程序化射手人形、助跑動畫與國家隊球衣著色
│   ├── tournament.js          # 2026 世界盃純邏輯模組 (16 國、4 輪淘汰賽、對手性格特徵)
│   ├── unlocks.js             # 星星貨幣、更衣室目錄 (球皮/球衣/球場) 與獎盃陳列室純模組
│   ├── share.js               # 780x1200 戰報分享卡純 Canvas 繪製與 Web Share API 管理
│   ├── shot.js                # 物理彈道數值積分 (120 Hz)、香蕉球與球門白界判定
│   ├── keeperAI.js            # 守門員撲救幾何體積計算 (手套碰撞球體 / 沒收 / 拍出)
│   ├── takerAI.js             # 射手 AI 讀心決策模型 (學習撲救習慣與懲罰過早起跳)
│   ├── difficulty.js          # 四級難度梯度參數對照表
│   ├── taunts.js              # 廣東話垃圾話對白庫與微動作假動作產生器
│   ├── audio.js               # Web Audio API 原生程序化音效合成
│   ├── fx.js                  # 3D 6 區讀心光環、球網形變粒子爆破與震芒
│   ├── input.js               # 手機 TouchEvent 滑動輸入手勢判定
│   └── tuning.js              # 遊戲物理、手套撲救半徑與攝影機參數常數
└── tests/
    ├── r3_e2e_test.js         # Chrome CDP 390x844 端到端完整測試
    ├── tournament.test.js     # 世界盃 16 隊淘汰賽純邏輯單元測試
    ├── unlocks.test.js        # 星星計算、更衣室裝備解鎖與獎盃判定單元測試
    ├── match_integration.test.js # 全難度比賽完整純模組仿真測試
    ├── model.test.js          # 讀心預測模型測試
    ├── shot.test.js           # 彈道物理測試
    ├── keeperAI.test.js       # 守門員撲救物理碰撞測試
    ├── takerAI.test.js        # 射手 AI 學習測試
    ├── input.test.js          # 觸控滑動手勢測試
    ├── difficulty.test.js     # 難度參數階梯測試
    └── taunts.test.js         # 廣東話對白與假動作提示測試
```
│   ├── keeper.js              # 3D 關節多邊形門將、重心傾斜/移位與視線預警動畫
│   ├── taker.js               # 3D 擬真射手人形 (助跑、支撐腳、踢球甩腿、慶祝與懊惱)
│   ├── ball.js                # 放大皮革足球 (0.135m)、自旋旋轉與運動拖尾
│   ├── input.js               # 手勢觸摸滑動控制器 (射門與把關雙向支援)
│   ├── shot.js                # 純物理彈道模擬 (Magnus + Drag + Bounce)
│   ├── keeperAI.js            # 純邏輯撲救決策與幾何範圍判定 (支援難度反應與臂長縮放)
│   ├── takerAI.js             # 純邏輯射手 AI (學習玩家撲救習慣並專攻反向死角)
│   ├── difficulty.js          # 四級難度設定、配置映射與 localStorage 持久化
│   ├── taunts.js              # 33 句港式廣東話垃圾話對白池與預警計算
│   ├── fx.js                  # 3D 6區讀心機率環、落點/撲救光環、慢動作、震動與紙碎
│   ├── audio.js               # Web Audio 純程式化合成音效引擎
│   └── tuning.js              # 集中管理之物理、時機窗口與玩法平衡常數
├── tests/
│   ├── model.test.js          # AI 讀心模型單元測試
│   ├── shot.test.js           # 射門物理與手勢映射單元測試
│   ├── keeperAI.test.js       # 門將撲救與幾何判定單元測試
│   ├── input.test.js          # 觸摸手勢與輸入單元測試
│   ├── difficulty.test.js     # 難度設定與映射單元測試
│   ├── takerAI.test.js        # 射手 AI 讀心與反制單元測試
│   ├── taunts.test.js         # 廣東話對白庫與預警提示單元測試
│   └── capture_r2_screenshots.js # 自動化 CDP 端到端測試與截圖腳本
├── screenshots/
│   └── v2/                    # 完整端到端 iPhone 390x844 截圖 (r2-01 至 r2-07)
├── README.md                  # 遊戲說明與玩法文檔 (廣東話)
└── CHANGELOG.md               # 版本變更記錄
```
