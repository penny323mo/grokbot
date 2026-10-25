# Odds Lab v4 — Round 3 Review (agy-v4-r3)

**Date:** 2026-10-25  
**Reviewer:** Antigravity (agy)  
**Status:** ALL FIXES COMPLETED & VERIFIED  

---

## 1. 值博率合理性對比 (Value Sanity: Before vs After)

在 R2 評審中，Grok 指出「澳彩獨贏抽水高達 11.31%，但 UI 卻顯示 12 場賽事值博，底層共有 16 個值博賠率，其中最顯著的侯城 (Hull City) 獨贏 4.70 在尖端莊家 Pinnacle 實開 5.07，實際對比尖端為 −10.4% 的反向陷阱」。

### 數量與市場分佈對比

| 指標 | R2 狀態 | R3 修正後 | 經濟邏輯與改善原因 |
| :--- | :--- | :--- | :--- |
| **總賽事數** | 25 場 | 18 場 (部分賽事已開打) | 嚴格按當前時間過濾未來 3 日內即將開賽賽事 |
| **值博賽事數** | 12 場 (48%) | 5 場 (27.7%) | 排除所有假破綻與過度擬合盤口 |
| **值博賠率總數** | **16 個** (3 個 1X2, 7 個 AH, 6 個 OU) | **5 個** (0 個 1X2, 5 個 AH, 0 個 OU) | 獨贏 11% 抽水下幾無可能真實值博；值博賠率全數集中於抽水僅 4.2%–4.8% 之讓球盤 |
| **1X2 值博數** | 3 個 (含侯城 @ 4.70) | **0 個** | **尖端錨點防線 (Pinnacle Anchor)**：澳彩獨贏賠率 $\le$ Pinnacle 賠率或對比 Pinnacle 之 EV $\le 0$ 時一律標記為「一般」 |
| **極端破綻與截斷** | 3 檔賠率撞牆 $\pm 15\%$ 截斷仍發放值博徽章 | **0 個** | **杜絕截斷漏洞**：原始 EV $> 15\%$ 或 $< -25\%$ 一律歸類為「數據不足」（不予推薦、不入戰績） |

### 核心經濟學原理解釋
1. **獨贏盤口 (1X2)**：澳門彩票抽水平均為 **11.3%**，而 Pinnacle 抽水僅約 **2.5%–3.0%**。在如此巨大的抽水差距下，澳門盤要真正超越尖端共識產生正期望值（EV > +3%），意味著澳門彩票必須開出遠高於國際尖端市場的離譜價格。實務上，澳彩開出的侯城 4.70 遠低於 Pinnacle 的 5.07，先前誤判為值博係因 2627 賽季剛升班之侯城在頂級聯賽僅有 8 場樣本，Dixon-Coles 泊松矩陣過度給予其 1.17 xG，0.3 的模型權重將共識勝率往上拉升。R3 加入升班馬小樣本衰減（少於 20 場頂級聯賽時 $w_{\text{dc}} \to 0$）並強制執行 Pinnacle 賠率硬上限，徹底消除了此類倒掛。
2. **亞洲讓球盤 (AH)**：澳門彩票在讓球盤之抽水僅約 **4.0%–4.5%**，盤口競爭力遠高於獨贏盤。當澳彩對特定盤口水位調整滯後（如切爾達、新特蘭、賀芬咸），其水位真實高於尖端市場（Pinnacle / Bet365 去水公平價），此時出現 5%–10% 的適度值博率具備高度經濟合理性。

---

## 2. Grok R2 核心問題清單修復報告

### P0: 尖端錨點防線 (Pinnacle Anchor) 與侯城賠率倒掛
- **問題**：侯城 1X2 主勝澳彩 4.70，Pinnacle 5.07，UI 卻標記為 +18.9% 值博。
- **修復措施**：
  1. `pipeline.py` 引入 **Pinnacle Anchor Rule**：凡澳門賠率小於等於 Pinnacle 同方向賠率，或對比 Pinnacle 去水勝率之 EV $\le 0$，嚴格判定為 `一般`（`badge-val-neutral`），嚴禁標記為 `值博`。
  2. 升班馬小樣本保護：於 `fit_dc_model` 統計各隊歷史頂級聯賽場次，少於 20 場時動態衰減 Dixon-Coles 權重：`w_dc = 0.30 * max(0.0, (min_n - 5)/15.0)`。
  3. 單元測試驗證：`tests/test_v4.py` 之 `test_r3_pinnacle_anchor_rule` 與 `tests/v4.test.js` 驗證侯城 1X2 賠率標記為「一般」，且全局無任何澳彩低於 Pinnacle 賠率之盤口獲評「值博」。

### P1: 移除 $\pm 15\%$ 截斷徽章漏洞 (Clamp Loophole Fix)
- **問題**：模型原先將超過 $\pm 15\%$ 的極端 EV 截斷至 $\pm 15\%$，導致過度偏離的異常值依然大於 $+3\%$ 並獲發「值博」徽章。
- **修復措施**：
  1. `math_engine.py` 之 `classify_ev(ev, is_clamped)`：凡 `is_clamped=True` 或原始 `ev > 0.15` 或 `ev < -0.25`，直接判定標籤為 **「數據不足」**（tier: `insufficient`, class: `badge-val-neutral`）。
  2. 戰績追蹤器只收錄評級為「值博」之正期望值投注，異常模型值自動排除。

### P1: 尖端讓球盤檔位插值 (Sharp AH Quarter-line Calibration)
- **問題**：原先僅在尖端盤口檔位完全一致（`abs(diff) < 1e-4`）時才採納 `PCAHH`，使得大量四分之一盤口無法享受尖端去水共識。
- **修復措施**：
  1. 於 `math_engine.py` 實作 `calibrate_lambdas_to_sharp_ah(mu, sharp_line, p_sharp_h)`：以總入球期望值 $\mu$ 為約束，透過二分搜尋精確擬合目標泊松參數對 $(\lambda_h, \lambda_a)$。
  2. 當尖端盤口與澳彩盤口在 $\pm 0.5$ 球以內時，藉由雙變量 Dixon-Coles 入球矩陣，精確插值計算澳彩實開之四分之一檔位公平價，再與共識盤口進行平滑融合。

### P1: 澳彩異常時防範假數據覆寫良好歷史 (Last-Good Data Preservation)
- **問題**：澳彩接口抓取失敗時，原代碼會讀取 `raw_samples/macau_sample.json`，而該樣本賽事僅有隊名無盤口，導致舊有良好 `data/data.js` 被覆寫為空盤口。
- **修復措施**：
  1. 強化 `validate_macau_response`：必須驗證賽事列表中至少包含實質開盤數據（`odds_1x2` 或 `main_ah`）。
  2. 遇接口錯誤或結構無效，堅決不載入無盤口樣本，直接透過 `load_previous_fixtures_from_data_js` 還原上一輪之完好實盤。
  3. The Odds API 異常時，將 `health_status["status"]` 設為 `warning` 並於前端狀態欄警示。

### P2 細項修正
1. **戰績統計字串對齊**：`record_tracker.py` 同時計入 `half_win` 與 `half_won`，以及 `half_loss` 與 `half_lost`，確保四分之一盤半贏半輸時 KPI 正確更新。
2. **莊家清單優先保留 Pinnacle**：於 `booksList` 中優先將 Pinnacle 置於首位（index 0），解決比較彈窗與柱狀圖丟失尖端數據問題。
3. **Power De-vig (指數去水)**：讓球盤與大細盤去水全面調用指數冪次法（`remove_margin(..., method="power")`）。

---

## 3. UI 新增「點樣計」廣東話教學區塊

於首頁實盤列表下方加入折疊式結構化教學卡片：
- **卡片標題**：💡 點樣計？值博率與定價模型剖析
- **四大核心解析步驟**：
  1. **尖端國際共識（Pinnacle 錨點）**：解釋以 Pinnacle 2%–3% 抽水作為真實勝率定價標竿，去除莊家抽水，杜絕散戶極端盤口誤導。
  2. **Dixon-Coles 預期入球泊松矩陣**：說明雙參數泊松期望值與低入球相關修正（$\rho = -0.05$），以及升班馬樣本衰減保護機制。
  3. **嚴謹值博率門檻（EV > +3%）**：詳細陳述 $EV = (真實勝率 \times 澳彩賠率) - 1$，澳彩必須嚴格高於尖端且 EV 介於 +3% 至 +15% 方為值博，異常值標記為「數據不足」。
  4. **1/4 凱利注碼控管**：說明四分之一凱利公式於控制最大回撤與實現正期望值收益間的最佳平衡。

---

## 4. 自動化測試與驗證

1. **Python 單元測試 (`python3 tests/test_v4.py`)**：
   - 18 項測試全部通過 (18/18 OK, 0 errors, 0 fails)。
   - 包含 Pinnacle 錨點規則、截斷漏洞防護、讓球盤跨檔位校準、空盤結構校驗與戰績字串對齊等所有新增測試。
2. **Node.js 單元測試 (`node --test tests/`)**：
   - 27 項測試全部通過 (27/27 pass, 0 fail)。
   - 包含值博賠率對比 Pinnacle 上限檢驗、侯城非值博斷言、時間轉換與歷史回測無看未來偏差等測試。
3. **流動端 Headless Chrome (390×844) 驗證**：
   - 0 console errors, 0 console warnings.
   - 完整擷取 5 張高清截圖於 `screenshots/v4/`：
     - `r3-01_macau_fixtures.png` (首頁實盤及點樣計教學區)
     - `r3-02_only_value_filter.png` (只睇值博過濾後 5 場高品質讓球盤)
     - `r3-03_match_detail_modal.png` (詳細對賽與以 Pinnacle 為首之莊家矩陣)
     - `r3-04_compare_tab.png` (動態抽水率對比柱狀圖與全市場破綻分析)
     - `r3-05_track_record_tab.png` (真實開賽鎖定與戰績追蹤看板)
