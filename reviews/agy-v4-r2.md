# Odds Lab (盤口實驗室) v4-R2 審查與修復報告

- **專案**：Odds Lab v4 (盤口實驗室)
- **版本**：v4-R2
- **分支**：`main` (penny323mo/odds-lab)
- **審查輸入**：`reviews/grok-v4-r1.md`
- **執行代理**：Antigravity (Google DeepMind)
- **日期**：2026-10-25 (Asia/Macau)

---

## 一、修復總覽 (Executive Summary)

本輪針對 `reviews/grok-v4-r1.md` 所列出之全部 20 項缺陷（P0: 1–3, P1: 4–9, P2: 10–20）進行了徹底修復與全路徑單元測試驗證。

- **單元測試**：
  - Python (`python3 tests/test_v4.py`)：13 / 13 全部通過（新增 5 項針對 P0/P1 之專門回歸測試）。
  - Node.js (`node --test tests/`)：25 / 25 全部通過（新增針對廣東話 CJK 正則、快照完整鍵值、戰績跨季隔離之斷言）。
- **流動端無頭驗證 (iPhone 390×844)**：
  - 運行於本機獨立連接埠 8799，捕捉 5 張高清截圖保存於 `screenshots/v4/`（以 `r2-*.png` 及標準名稱命名）。
  - **Console Errors: 0，Console Warnings: 0**。
- **配額與密鑰安全**：
  - 本輪構建完全命中當日 UTC 快取守護（`last_run_utc: 2026-10-25`），**消耗額度: 0，剩餘配額: 484 / 500**。
  - 全倉庫原始碼與提交歷史中無任何 API Key 洩漏。

---

## 二、20 項問題修復逐項清單

### P0 致命缺陷

| 編號 | 問題描述 | 修復與實現細節 | 驗證測試 |
| :--- | :--- | :--- | :--- |
| **P0-1** | 戰績追蹤跨季賽果污染（即將開賽賽事誤撞 2025/26 歷史比分提前結算） | 1. 歷史完場賽事嚴格以 `(date_iso, home, away)` 儲存。<br>2. 結算時先檢驗 `kickoff < now`；若未開賽絕對保持 `pending`。<br>3. 開賽後必須與賽程日期相符（$\pm 1$ 日時區公差）方予結算；跨季跨月賽事完全隔離。<br>4. 清理 `track_record.json` 中先前被錯誤結算之未來賽程，總結算場次歸零。 | `test_p0_1_track_record_kickoff_date_gating`<br>`v4 Track Record: upcoming fixtures remain pending` |
| **P0-2** | 客隊讓球盤結算視角顛倒（`sel == "A"` 誤以主隊視角判斷勝負） | 在 `record_tracker.py` 中：<br>當 `sel == "A"` 時，改以客隊淨勝球 `ftag - fthg` 及反向盤口 `-line` 調用 `settle_ah_single(ftag - fthg, -float(line), odds)`。<br>實測主隊 2-0 獲勝，讓半球盤客隊下盤正確結算為輸全（`mult=0.0, profit=-1.0u`）。 | `test_p0_2_away_asian_handicap_settlement` |
| **P0-3** | 讓球盤值博率未採用 0.7 共識 + 0.3 模型混合，出現 +51% 虛高異常 | 1. 利用數值二分法從市場共識 1X2 與 2.5 大細盤口反向反求泊松進球期望參數 $(\lambda_h, \lambda_a)$，生成尖端市場共識矩陣與讓球勝平負分佈。<br>2. 優先融合 `fixtures.csv` 尖端莊家 Pinnacle / Bet365 實盤讓球盤口。<br>3. 與 Dixon-Coles 矩陣依 0.7 : 0.3 進行加權分佈混合，並對 EV 增設 $\pm 15\%$ 防禦門檻。<br>4. 平衡盤（1.90 / 1.90）在均衡期望下嚴格歸類為「一般」或「唔值博」，絕不誤報「值博」。 | `test_p0_3_ah_consensus_blend_prevents_unrealistic_ev` |

---

### P1 重大缺陷

| 編號 | 問題描述 | 修復與實現細節 | 驗證測試 |
| :--- | :--- | :--- | :--- |
| **P1-4** | 澳門彩票球隊譯名全為 ASCII `???` 亂碼 | 1. `fetch_macau.py` 請求標頭加入 `Accept-Language: zh-HK,zh-TW,zh;q=0.9`。<br>2. 嚴格校驗中文譯名必須符合 CJK 字符集（`[\u4e00-\u9fff]`）且不含 `?`；若缺失或異常則無縫回退至 `team_names.py` 270+ 港澳標準粵語譯名庫。<br>3. 以 `ensure_ascii=False` 輸出 UTF-8 JSON。<br>實測 `data/data.js` 25 場賽事實時繁體中文卡片無任何 `?`。 | `test_team_name_normalization_and_matching`<br>`v4 Macau Fixtures: genuine Cantonese team names` |
| **P1-5** | 走勢快照折疊為單一 `None_None_None` 空鍵，Sparkline 走勢死鎖 | 修正 `snapshots_tracker.py` 中對 `processed_fixtures` 駝峰命名之存取錯誤（`matchKey`、`macau.odds_1x2`、`consensus.fair_1x2`）。最新快照精準輸出 25 個獨立賽事鍵值與完整數值賠率。 | `v4 Snapshots: compact snapshots have distinct match keys` |
| **P1-6** | Actions 工作流未提交 `odds_api_cache.json`，每日守護在 CI 失效 | 於 `.github/workflows/update-data.yml` 的 `git add` 清單中正式補上 `data/odds_api_cache.json`，確保後續定時任務能正確沿用當日快取，避免重複請求與配額浪費。 | 工作流配置審查與本機 Git 狀態驗證 |
| **P1-7** | 缺失數據架構驗證，`health.json` 從不發出 `error`，警報無法觸發 | 1. 於 `pipeline.py` 實作 `validate_macau_response` 與 `validate_odds_api_response` 完整結構校驗。<br>2. 遇到異常時將 `health.status` 標記為 `error`，並從 `data.js` 自動保留上一輪完好賽事，防止網站白屏。<br>3. Actions 透過 `gh issue` 對標籤 `data-alert` 進行單一 Issue 之去重更新。 | `test_schema_and_health_file` |
| **P1-8** | CLV 從不計算，且公式未在開賽時鎖定，結算時被未開賽 0 稀釋 | 1. 開賽前每輪抓取更新收盤價，開賽當刻永久鎖定收盤價（`closing_frozen: True`）。<br>2. CLV 公式標準化為 `initial_macau / closing_macau - 1.0`（同一方向價格比較）與 `initial / closing_consensus_fair - 1.0`。<br>3. 總結卡 `avg_clv` 嚴格僅統計已完場賽事。 | `test_p1_8_clv_freeze_and_calculation` |
| **P1-9** | 球隊去雜詞誤將 City / United / Madrid / Sociedad 剔除，造成同城球隊誤配 | 1. 停止在 `normalize_team_name` 中剔除 `city`, `united`, `madrid`, `sociedad` 等核心實體識別詞。<br>2. 廢除任意子字串包含（`n1 in n2`），改為嚴格詞組精確比對或權威粵語譯名庫對齊。<br>3. 實測 `Man City != Man United`、`Real Madrid != Real Sociedad`，同時正確保留 Brighton、Athletic Bilbao、PSG 正常別名匹配。 | `test_p1_9_strict_team_matching_no_collisions` |

---

### P2 次要與體驗優化

- **P2-10 (Pinnacle 重複計權)**：在計算非 Pinnacle 莊家中位數時，明確以 `other_1x2_probs` 進行計算，杜絕 Pinnacle 自體被計入 0.4 的中位數池中。
- **P2-11 (Power 去水整合)**：在 `math_engine.py` 封裝統一入口 `remove_margin(odds_list, method="multiplicative"|"power")`，完全相容兩種算法。
- **P2-12 (莊家比較抽水率動態計算)**：`js/app.js` 之抽水率長條圖由原先硬編碼升級為即時遍歷當前全部實盤賽事，計算 Pinnacle、Bet365、歐洲平均及澳門彩票之動態平均抽水率。
- **P2-13 (歐洲三大盃賽聯賽 Chips)**：首頁篩選欄正式加入歐聯（UCL）、歐霸（UEL）與歐協聯（UECL）篩選按鈕。
- **P2-14 (流動端按鈕高度合規)**：將 `.secondary-btn` 最小高度由 42px 提升至 44px，滿足 Apple HIG 觸控規範。
- **P2-15 (大細球 Kelly 勝率真實化)**：修復大細盤 Kelly 注碼傳入 `0.50 + 0.5 * ev` 之虛擬概率問題，改為使用泊松積分計算出之實際勝率（含走盤權重）。
- **P2-16 (Odds API 異常狀態守護)**：當所有聯賽請求均失敗時，不更新 `last_run_utc`，將狀態置為 `error` 並保留舊快取，允許同日內安全重試。
- **P2-17 (注碼 ID 唯一化)**：由截取前四字母改為 `{date}_{ev_id}_{market}_{selection}_{line}` 組合，徹底杜絕碰撞。
- **P2-18 (P0/P1 全路徑測試覆蓋)**：單元測試擴展至 13 項 Python 測試與 25 項 Node.js 測試。
- **P2-19 (Dixon-Coles $\rho$ 文檔化)**：代碼與文檔中清晰註解 $\rho = -0.05$ 作為低比分（0-0, 1-0, 0-1, 1-1）相關校準常數之經驗原理。
- **P2-20 (football-data Sharp AH 利用)**：管線自動讀取 `fixtures.csv` 內 Pinnacle / Bet365 讓球盤口，當檔位匹配時直接進行銳利度去水納入共識。

---

## 三、驗證截圖一覽 (`screenshots/v4/`)

- `r2-01_macau_fixtures.png`：預設「澳彩值博」首頁，按日期分組呈現 25 場實盤，球隊名稱為地道繁體中文（水晶宮、紐卡素、利物浦、白禮頓），無任何 `?` 亂碼，值博標籤與預期進球（xG）正常顯示。
- `r2-02_only_value_filter.png`：「只睇值博」開關過濾後，精準篩選出真實正期望值賽事。
- `r2-03_match_detail_modal.png`：賽事深度對比抽屜，全莊家盤口對比表、最高賠率綠色高亮、抽水率柱狀圖及凱利注碼建議。
- `r2-04_compare_tab.png`：「莊家比較」標籤頁，實時動態抽水率柱狀圖與全市場重大賠率破綻清單。
- `r2-05_track_record_tab.png`：「戰績追蹤」儀表板，40 場推薦賽事實時追蹤，即將開賽賽事全數正確標記為 `pending`，杜絕跨季虛假結算。

---

## 四、結論與發佈準備

所有 P0、P1、P2 項目均已完美解決，測試全數綠燈，無頭流動端 0 錯誤，代碼已推送到 GitHub 遠端倉庫 `main` 分支。
專案已完全具備生產級別穩定性。
