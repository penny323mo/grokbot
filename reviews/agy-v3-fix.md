# Odds Lab (盤口實驗室) — v3 Round B 修復總結報告

依據 `reviews/grok-v3.md` 審核意見與使用者指示，已完成所有 CRITICAL、MAJOR 及合理 MINOR 項目之修復與驗證。

---

## 1. 核心修復詳情

### CRITICAL 1: 回測 UI 重注與讓球盤結算失真修復
- **問題根源**：
  - `js/app.js` 在回測重播（replay）中使用了 `prob = (b.profit > 0 ? (b.payout / odds) : 0.35)`，以實際勝負結果反推注碼概率，產生嚴重的後見之明（lookahead bias）漏洞。
  - 重播時結算直接採用二元判斷 `payout = isWin ? stake * b.odds : 0`，將亞洲讓球盤半贏（如 odds 1.90 結算為 1.45 倍）放大為全贏（1.90 倍），將走盤（1.0 倍退本）判定為全輸（0 倍）。
  - 單一聯賽選擇時重播覆蓋了 `runBacktest` 本身的真實資金曲線，導致總體指標與分聯賽數據脫節。
- **修復方案**：
  - 在 [`js/model.js`](file:///workspace/nightly/2026-10-25-odds-lab/js/model.js) 的 `runBacktest` 中，下注紀錄（`betRecords`）完整持久化記錄賽前預測概率 `modelProb`、讓球盤勝和負拆解 `ahProbs`、盤口檔位 `ahLine`、市場標記 `isAHMarket` 以及真實每單位注碼結算倍數 `payoutMult`。
  - 在 [`js/app.js`](file:///workspace/nightly/2026-10-25-odds-lab/js/app.js) 中：
    - 當選擇單一聯賽時，直接以使用者指定的 `staking` 參數（flat 或 kelly）運行 `runBacktest`，圖表、總結指標與分項數據直接採用模型的真實輸出，完全同步。
    - 當選擇「全部五大聯賽」跨聯賽回測時，各聯賽以賽前概率採集注碼，再依比賽日期統一排序並在滾動本金上嚴格求解凱利注碼（無後見之明），並以 `b.payoutMult` 計算真實賠付（精確保留半贏、走盤、半輸），同步重新校準分聯賽表格數據。
  - 新增單元測試驗證讓球盤半贏回報倍數（1.45）、走盤（1.0）及跨聯賽回測注碼求解。

### CRITICAL 2: GitHub Actions 工作流安全同步
- **修復方案**：
  - 在 [`.github/workflows/update-data.yml`](file:///workspace/nightly/2026-10-25-odds-lab/.github/workflows/update-data.yml) 中，於推送前加入 `git pull --rebase origin ${{ github.ref_name }} || git pull --rebase || true`，並顯式指定 `git push origin HEAD:${{ github.ref_name }}`，保證推送與 Pages rebuild 調用安全順暢。

### MAJOR 3: 盤口走勢 CLV 標定模型預測方向
- **問題根源**：
  - 走勢卡原先只計算「所選球隊獨贏」從開盤至收市之 CLV，若模型賽前判斷該隊偏弱而看好和局或對手，該 CLV 無法反映模型真實視角的邊緣收市價值。
- **修復方案**：
  - 在 [`js/app.js`](file:///workspace/nightly/2026-10-25-odds-lab/js/app.js) 的 `renderTeamMovementList` 中，依據走勢前瞻擬合（walk-forward pre-match fit）模型輸出的 1X2 概率，尋找模型預測具最高正邊緣之選項（主勝/和局/客勝）。
  - 對該模型方向計算尖端收市去水後 CLV，並在走勢卡標題清楚標註 `模型方向 (主勝/和局/客勝) CLV: +X.X%`。

### MAJOR 4: 剔除 2425 後之升班馬先驗校正
- **問題根源**：
  - 剔除 2425 賽季後，因無 2025-08-01 之前的比賽，原判斷邏輯將 2526 賽季初所有球隊判定為「無歷史場次」而過度收縮至升班馬先驗（α=−0.22, β=−0.20）。
- **修復方案**：
  - 在 [`js/model.js`](file:///workspace/nightly/2026-10-25-odds-lab/js/model.js) 中精準識別「2526 賽季參賽球隊」（基準賽季球隊）。
  - 於 2526 賽季內，所有球隊初始均以聯賽平均水平（α=0.0, β=0.0）起步，首 ~6 輪比賽作為自然 burn-in 期。
  - 進入 2627 賽季時，僅有真正的新升班馬（在 2526 賽季無出賽紀錄之球隊，如高雲地利、馬拉加等）獲得負向先驗（α=−0.22, β=−0.20），且既有球隊 alpha 保持居中於 0。

### MAJOR 5: iPhone 390px 視口觸控打擊面積提升
- **修復方案**：
  - 於 [`css/style.css`](file:///workspace/nightly/2026-10-25-odds-lab/css/style.css) 中，將走勢標籤頁的球隊下拉選單 `.inline-select` min-height 提升至 44px（padding 8px 12px）。
  - 將讓球盤結果拆解標籤 `.split-pill` 調整為 `min-height: 44px; min-width: 44px;` 並支援響應式換行。
  - 確保 `.chip-sm` 及 `.close-sheet-btn` 均維持 $\ge 44$px 觸控面積。

### MINOR 項目全面落實
- **MINOR 6**：[`scripts/fetch_data.sh`](file:///workspace/nightly/2026-10-25-odds-lab/scripts/fetch_data.sh) 實現真實指數退避重試（1s, 2s, 4s, 8s）與 CSV 格式及非空嚴格校驗。
- **MINOR 7**：在 [`.gitignore`](file:///workspace/nightly/2026-10-25-odds-lab/.gitignore) 中加入 `raw/`，避免本機抓取產物污染 git 狀態。
- **MINOR 8 & 9**：對賽標籤頁頂部「本週賽事」橫條加入 72 小時滑動窗口過濾（隱藏已開賽賽程）；修復首頁跳轉對賽標籤頁時 `selectedFixtureIdx` 與卡片高亮樣式同步。
- **MINOR 10**：走勢卡勝率 Sparkline 調用 `removeMargin` 進行去水，繪製真實開盤去水隱含勝率至收盤去水隱含勝率。
- **MINOR 11**：移除 `loadSettings` / `saveSettings` 中控制台警告，消除受限環境下之日誌干擾。
- **MINOR 12**：新增 3 項針對性單元測試（讓球盤半贏/走盤結算乘數、賽前概率 Kelly 求解、2526 隊伍 burn-in / 2627 升班馬先驗）。

---

## 2. 測試與驗證結果

1. **數據抓取驗證**：
   - 運行 `./scripts/fetch_data.sh`，11 個 CSV 檔案全部下載並校驗通過（具備指數退避重試保護）。
2. **數據構建驗證**：
   - 運行 `python3 build_data.py`，成功輸出 302.7 KB `data/data.js`（五大聯賽 43 場賽程，2,098 場賽果）。
3. **單元測試套件 (`node --test tests/`)**：
   - **19 / 19 測試全數通過**（耗時約 220ms，0 失敗，0 跳過）。
4. **Headless 流動端驗證 (390×844，端口 8799)**：
   - 首頁 24 場未來實盤卡片渲染正確，頂部及徽章時間戳格式正確。
   - 深入盤口跳轉成功切換至對賽標籤頁，頂部本週賽事橫條已過濾已開賽賽程且高亮選中對應卡片。
   - 觸控目標尺寸驗證：`.chip-sm` (44x44), `.split-pill` (50x44), `.inline-select` (160x44) 均達標 $\ge 44$px。
   - 走勢卡正確顯示「模型方向 (主勝) CLV: -14.3%」及去水 Sparkline。
   - 單一聯賽回測（246 注，利潤 +15.2u，ROI +6.2%）與跨五大聯賽凱利回測（1174 注）均計算正常，圖表與表格數據完全吻合。
   - 球隊戰力卡 20 隊戰力數據顯示正常。
   - **全站 0 控制台錯誤（0 console errors）**。
   - 伺服器進程於測試結束後徹底釋放退出。未執行 git commit。
