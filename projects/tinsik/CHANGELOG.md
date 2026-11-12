# Changelog

## Round 1 fixes

- **Major 1 (Offline fallback & failure isolation)**: Restricted offline snapshot loading strictly to 澳門半島, displaying explicit notice 「未能連線，顯示澳門半島離線快照（2026-11-13）」. For 氹仔、路環及香港天文台，連線失敗時顯示誠實粵語錯誤提示，並完全隱藏舊時段、七日及降雨模組，絕不借用澳門半島數字替代。
- **Major 2 (7-day forecast accordion hours)**: 點按七日預報任一日展開時，根據該民用日期篩選 `weatherData.hourly`，以相同排印語言渲染該日各小時時間、粵語天色狀況、氣溫及降雨機率，並將日出日落及最高風速/紫外線摘要保留於小時列表下方。
- **Minor 3 (Contrast ratio compliance)**: 將現在時段（「而家」）文字改為墨色，降雨數據改為石色（`#6F675C`，對比度 4.96:1），確保象牙底色上所有文字皆超越 4.5:1 對比度標準。
- **Minor 4 (UTC / Asia/Macau datetime parsing)**: 修復 `parseMacauDate` 在時間字串未帶時區時正確判定並附加 `+08:00`，確保在 UTC 環境下預報時間格式化仍精確對齊澳門時間。
- **Minor 5 (Dry ribbon icon)**: 當未來兩小時無雨（`hasRain` 為 false）時，省略細雨圖標，避免在「未來兩小時都唔會落雨」旁出現落雨標記。
- **Minor 6 (All-null minutely_15 series)**: 當 15 分鐘降雨序列全部為 null 時，視為資料不可用並隱藏雨勢條，不虛構無雨或 0 mm 讀數。
- **Minor 7 (Geolocation deny sentence & place reset)**: 定位被拒或不支援時，重設地點為預設澳門半島並載入預報，同時顯示指定字句「而家用澳門半島做起點（未開定位）」。
- **Minor 8 (Authentic Cantonese 16-point wind bearings)**: 採用香港天文台及澳門地球物理氣象局標準粵語 16 方位風向（如「東北偏東風」），並更新測試驗證。
- **Minor 9 (Viewport zoom)**: 移除 `index.html` 中的 `maximum-scale=1`，恢復雙指縮放功能。

## Round 2 fixes

- **Minor 1 (Full page-flow accordion hours & non-breaking units)**: 移除展開日小時列表的內部捲動限制，使其自然融入頁面佈局，避免 06:00 時段被截斷；下方摘要改為逐行清晰排版，數值與單位（如 `20 km/h`、`4.1 mm`）以不換行空格綁定，防止單位單獨斷行。
- **Minor 2 (Pinned hour readout contrast)**: 將鎖定時段（`.pinned-time`）文字改為墨色（`var(--color-ink)`），確保在麥稈色底色（`#E8DCC6`）上達到 15.6:1 高對比度，保留赭黃色左側邊框標記。
- **Minor 3 (Online recovery notice reset)**: 修復在離線快照狀態後成功重新整理或連線時，頂部提示文案即時重設回即時連線提示（「而家用澳門半島做起點（未開定位）」或「已選擇〔地點〕」），避免殘留離線快照提示。

## Round 3 fixes

- **Minor 1 (Touch target sizing for pinned-hour close button)**: 將時段鎖定讀數的關閉按鈕（`.pinned-close`）最小觸控尺寸由 32×32px 提升至 44×44px（`min-width: 44px; min-height: 44px;`），與定位、重新整理、地點切換及展開日按鈕保持一致的高標準無障礙觸控尺寸。
