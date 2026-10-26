# Odds Lab (盤口實驗室) v4-R1 交付與架構審查報告

- **專案**：Odds Lab v4 (盤口實驗室)
- **版本**：v4-R1
- **分支**：`main` (penny323mo/odds-lab)
- **環境**：Node.js v20+, Python 3.12+, GitHub Pages (靜態站點無後端)
- **審查日期**：2026-10-25 (Asia/Macau)
- **執行代理**：Antigravity (Google DeepMind)

---

## 一、交付範疇與核心目標完成度 (Executive Summary)

依據 `prompts/v4-r1-agy.txt` 督導員各項指示，本輪升級完成 Odds Lab v4 全新量化架構，將系統由原先僅依賴靜態 CSV 之工具升級為**結合澳門彩票實時盤口、The Odds API 國際主流莊家共識、Dixon-Coles 泊松預測模型、四份一盤任意檔位折算與實盤戰績追蹤之全功能量化分析平台**。

所有 23 項 Node.js 單元測試與 8 項 Python 核心算法測試全數通過，流動端（iPhone 390×844 視口）自動化無頭測試達成 **0 Console Errors / 0 Warnings**。

---

## 二、數據管線與核心模組架構 (Pipeline Architecture)

### 1. 澳門彩票實時公開盤口 (`scripts/fetch_macau.py`)
- **端點整合**：
  - 賽程列表：`POST https://www.macau-slot.com/event-api/cn/D/FB/coming/all/-/threeinone/-`
  - 盤口賠率：`POST https://www.macau-slot.com/event-api/cn/D/FB/markets/coming/all/threeinone`（每批次 25 場）
- **抓取範圍**：精準過濾未來 3 天內五大聯賽（英超、西甲、意甲、德甲、法甲）及歐洲三大盃賽（歐聯、歐霸、歐協聯）。
- **盤口解析**：
  - 獨贏 (1X2)：主客和賠率與澳門抽水率。
  - 亞洲讓球盤 (AH)：支援整數盤、半球盤及四份一盤（如 `-0.5/-1` $\to -0.75$、`+0.5/+1` $\to +0.75$）。
  - 入球大細 (O/U)：支援 2.5 球及四份一檔位（如 `2.5/3` $\to 2.75$、`2/2.5` $\to 2.25$、`3/3.5` $\to 3.25$）。
  - 禮貌連線：加入逾時重試、指數退避與防連線中斷機制，本機及 CI 環境穩定運作。

### 2. The Odds API 嚴格配額保護機制 (`scripts/fetch_odds_api.py`)
- **每日一次 UTC 守護 (Daily UTC Guard)**：
  - 狀態檔案 `data/odds_api_state.json` 記錄當天 UTC 日期（`last_run_utc`）及剩餘額度。
  - 當天再次執行時直接讀取快取 `data/odds_api_cache.json`，絕不浪費額度。
- **500 次每月預算防線**：
  - 調用前先請求免費端點 `GET /v4/sports` 檢查密鑰與配額標頭（`x-requests-remaining`）。
  - 當剩餘配額低於 40 時，主動中斷抓取並發出健康預警，杜絕額度耗盡。
  - 實測本輪運行僅消耗 16 額度，剩餘 **484 / 500** 額度（`requests_remaining: 484, requests_used: 16`）。
- **密鑰安全**：API Key 僅存在於環境變數 `ODDS_API_KEY` 或本機密鑰檔，全站原始碼與提交歷史中無任何密鑰洩漏（經自動化腳本驗證 0 處洩漏）。

### 3. 跨來源賽事匹配與球隊譯名映射 (`team_names.py`, `scripts/pipeline.py`)
- **多層正規化匹配**：
  - Unicode 去音標（如 `Alavés` $\to$ `Alaves`、`Málaga` $\to$ `Malaga`）。
  - 去除球會前綴/後綴字眼（`FC`, `CF`, `Athletic`, `Utd`, `Saint-Germain` 等）。
  - 港澳媒體地道粵語譯名庫擴展至全歐洲 270+ 支球會。
- **時間窗口匹配**：賽事開賽時間 $\pm 3$ 小時以內自動容錯對齊。
- **實測結果**：26 場澳門彩票實時賽事達成 **26 / 26 (100%)** 成功對齊 The Odds API 國際各莊家盤口，未匹配場次自動寫入 `data/unmatched.json`。

### 4. 數學核心與去水共識模型 (`scripts/math_engine.py`)
- **去水演算法**：
  - 比例均攤法（Multiplicative）：$p_i = \frac{1/o_i}{\sum 1/o_j}$
  - 指數冪次法（Power / Shin-lite）：數值解求 $k > 1$ 使 $\sum (1/o_i)^k = 1$
- **Pinnacle 加權共識**：
  - Pinnacle 作為全球最銳利莊家，給予 0.6 權重，其餘主流莊家中位數佔 0.4 權重，求得市場真實無偏基準。
- **大細球任意盤位泊松轉換**：
  - 由共識 2.5 球去水勝率，反求總入球泊松分佈均值 $\mu$：
    $P(\text{Goals} > 2.5) = 1 - e^{-\mu}(1 + \mu + \mu^2/2)$
  - 透過二分法收斂求得 $\mu$ 後，即可精確折算 2.0、2.25、2.75、3.0、3.25 等任意檔位之勝率與公平價。
- **混合公平價 (Consensus 0.7 + Dixon-Coles 0.3)**：
  - 尖端市場共識線佔比 70%，五大聯賽 Dixon-Coles 本地模型佔比 30%，求得綜合公平賠率。
- **期望值與值博標籤**：
  - $\text{EV} = \text{Fair Prob} \times \text{Odds} - 1$
  - **🔥 值博**：$\text{EV} > +3\%$
  - **一般**：$-3\% \le \text{EV} \le +3\%$
  - **唔值博**：$\text{EV} < -3\%$
  - 同步輸出四份一凱利建議注碼比例與金額。

### 5. 走勢快照與實盤戰績庫 (`scripts/snapshots_tracker.py`, `scripts/record_tracker.py`)
- **快照輪轉 (`data/snapshots/`)**：
  - 每次構建記錄實時賠率快照，自動清除 14 天前之過期檔案，提取歷史走勢 Sparkline。
- **戰績追蹤 (`data/track_record.json`)**：
  - 只要偵測到「值博率 > +3%」即自動收錄為推薦注碼。
  - 開賽時紀錄收市賠率與收市共識線，計算真實收市值（CLV）。
  - 完場後以 1u 平注結算，匯總勝率 (Hit Rate)、累積利潤 (Profit u)、投資回報率 (ROI) 與平均 CLV。

### 6. 健康檢查與警報機制 (`data/health.json`)
- 記錄各數據源連線狀態、抓取筆數與剩餘配額。
- 若出現異常，自動保留最後完好快取，並由 GitHub Actions 呼叫 `gh issue` 更新或開啟標記 `data-alert` 之單一 Issue（杜絕洗版）。

---

## 三、流動端介面設計與體驗提升 (UI / UX)

1. **頂部實時狀態列與合規免責聲明**：
   - 頂部狀態列即時顯示澳彩實盤場次、國際共識配額剩餘（如 `配額 484/500`）與系統健康燈號。
   - 顯眼展示免責聲明：`只供參考，唔保證贏錢，請量力而為，只限合法年齡人士。`
2. **預設首頁「澳彩值博」**：
   - 按日期分組（今日、聽日、後日），提供「只睇值博」一鍵切換開關、聯賽切換晶片及獨贏/讓球/大細篩選器。
   - 賽事卡片顯示預期入球比（xG）、最佳值博推薦 Spotlight、澳彩賠率、去水公平價、EV% 與彩色標籤。
3. **賽事深度抽屜 (Match Detail Modal)**：
   - 點擊卡片彈出全市場主流莊家賠率對比表（Macau Slot, Pinnacle, Bet365, 1xBet, Unibet...）。
   - 全場最高賠率以霓虹綠高亮標示。
   - 標示偏離共識線 $> +4\%$ 之重大莊家破綻。
4. **「莊家比較」標籤頁**：
   - 抽水率視覺化柱狀圖：Pinnacle (2.4%) vs Bet365 (6.2%) vs 歐洲平均 (7.5%) vs 澳門彩票 (10.9%)。
   - 破綻賠率清單直接導航。
5. **「戰績追蹤」標籤頁**：
   - 4 大 KPI 計分卡（總推薦、勝率、1u 平注累積利潤、ROI / 平均 CLV）。
   - 詳細注碼列表，清晰呈現初見賠率、收市 CLV 與結算結果 Pills（贏、贏半、走盤、輸半、輸、進行中）。
6. **觸控體驗**：
   - iPhone 390px 視口打擊面積全部確保 $\ge 44$px。
   - 全頁無橫向溢出捲動，表格於容器內平滑水平滑動。

---

## 四、測試驗證結果 (Verification & Test Results)

### 1. 單元測試
- **Node.js 測試 (`node --test tests/`)**：
  ```text
  ℹ tests 23
  ℹ suites 0
  ℹ pass 23
  ℹ fail 0
  ℹ duration_ms ~240ms
  ```
- **Python 測試 (`python3 tests/test_v4.py`)**：
  ```text
  Ran 8 tests in 0.003s
  OK
  ```

### 2. 流動端無頭瀏覽器驗證 (`scripts/verify_ui.py`)
- 視口：390 × 844 (iPhone)
- 連接埠：8799 (測試後已自動終止釋放)
- **Console Errors: 0**
- **Console Warnings: 0**
- 截圖生成於 `screenshots/v4/`：
  - `01_macau_fixtures.png`：澳彩值博首頁
  - `02_only_value_filter.png`：只睇值博過濾狀態
  - `03_match_detail_modal.png`：全莊家對比與破綻抽屜
  - `04_compare_tab.png`：主流莊家抽水與偏差矩陣
  - `05_track_record_tab.png`：實盤戰績追蹤與注碼結算清單

---

## 五、GitHub Actions 工作流 (`.github/workflows/update-data.yml`)

- **排程頻率**：每日 4 次（00:00, 06:00, 12:00, 18:00 UTC，其中 00:00 對應澳門時間早上 08:00）。
- **配額防禦**：The Odds API 僅在每日首個 UTC 任務由腳本保護運行一次。
- **連線驗證**：新增 Actions Runner IP 連線澳門彩票之事件計數驗證步驟。
- **健康警報**：異常時自動更新 `data-alert` Issue。
- **Pages Rebuild**：數據變更推送後透過 GitHub API 自動觸發 Pages rebuild。

---

## 六、結論

Odds Lab v4 圓滿達成所有規範要求。代碼架構嚴謹、計算精確、粵語書面語本土化道地，流動端體驗流暢細緻，無多餘外掛依賴，已可直接提交至 `main` 分支並交付使用。
