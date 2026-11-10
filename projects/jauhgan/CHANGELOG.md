# CHANGELOG

## Round 1 fixes

- **CRITICAL 1: 即時與快照地圖標記加載 (Map markers load on snapshot path)**
  - 在 `AppMap` 加入 `this.currentPlaces` 快取，當地圖底層完成 `load` 事件時立即將設施標記渲染至地圖，修復快照路徑上無法顯示公廁/停車場/藥房等設施標記的問題。
- **CRITICAL 2: 起點移動與 2 公里搜尋上限 (Origin change & 2 km radius cap)**
  - `filterAndSortPlaces` 加入預設 2 公里（2000 米）距離限制，避免在香港起點時列出數十公里外的澳門設施。
  - 當用戶拖動起點或透過 GPS 定位時，重新查詢天氣、Overpass 即時數據與香港停車場數據。香港停車場列表替換而非重複疊加。若不在覆蓋範圍內顯示明確空狀態提示。
- **CRITICAL 3: 香港停車場 -1 標記處理 (HK Carpark -1 vacancy sentinel)**
  - 修復 data.gov.hk 將未發布車位的 `-1` 顯示為實際剩餘車位的問題，將 `< 0` 的數值視為無車位數據（`null`），僅保留真實的非負數值。
- **MAJOR 4: 移除英文副標題與產品名稱淨化 (Cantonese product chrome)**
  - 移除頂欄中的 `Just Around` 英文副標題，將文件標題與 Web App Manifest 名稱統一為純粵語「就近」。
- **MAJOR 5: 天氣與空氣條換行與來源標示 (Weather strip layout & source)**
  - 解除 `.weather-strip` 單行截斷限制，改為兩行排版，並於第二行明確顯示更新時間與來源（例如 `02:15 更新 · Open-Meteo`）。
- **MAJOR 6: 澳門時區格式與版權署名 (Asia/Macau timezone & attributions)**
  - 建立 `formatMacauDateTime` 工具函式，將 UTC 時間精確轉換為 Asia/Macau（UTC+8）時區並標示「澳門時間」（例如 `2026-11-10 17:08 澳門時間`）。
  - 頁腳及詳情頁完整加入 `© OpenStreetMap contributors · OpenFreeMap` 署名。
- **MAJOR 7: 加入 geo: 備用導航連結 (Navigation geo: fallback)**
  - 詳情頁在「開始導航」（Apple Maps）按鈕旁新增「其他地圖」（`geo:` 協定連結），觸控高度均達 48px。
- **MAJOR 8: 觸控標靶達到 44px 規範 (44px touch targets)**
  - 底部抽屜手柄高度提升至 44px，地圖起點標記與設施標記外層包裝均擴展為 44×44px 觸控點擊區。
- **MAJOR 9: 「返返我嘅位置」按鈕避讓底部抽屜 (Recenter button positioning)**
  - 重設定位按鈕改為動態貼合底部抽屜高度（peek 時位於抽屜上方，half / full 時向上提升，`z-index: 45`），避免開啟詳情頁時被抽屜遮擋。
- **MAJOR 10: 地圖圖層載入異常平靜降級 (Map fallback on style/tile failure)**
  - 加入樣式載入逾時（5 秒）與連續瓦片錯誤計數，若底圖載入失敗即觸發平靜降級卡片，提供重試按鈕並確保設施清單可正常使用。
- **MAJOR 11: 嚴禁猜測部分天氣數據 (Truthful partial weather parsing)**
  - 當 WMO 代碼未收錄或遺漏時不預設多雲；降雨小時資料遺漏時不預設無雨，絕不展示未經證實的氣象語句。
- **MAJOR 12: 「用我嘅位置」按鈕保留圖標與停用狀態 (Preserve locate button icon)**
  - 修改 `textContent` 目標為按鈕內的文字標籤，避免點擊後清除定位 crosshair SVG 圖標，並加入 disabled 樣式。
- **MAJOR 13: 香港停車場營運者與營業時間真確化 (Honest HK carpark details)**
  - 不再將 nature 商業代碼誤植為運輸署營運者；解析真實 `openingHours` 陣列，營業狀態（如「而家開放中」）獨立為狀態標籤而非營業時間。
- **MAJOR 14: 停車場排序優先度與清單容量 (Parking ranking & list limit)**
  - 在近距離範圍內（80 米內）優先展示實際停車場主體（`amenity=parking`）而非入口（`parking_entrance`）。
  - 清單上限提升至 80 項，若有超出則顯示「仲有 N 個設施」提示。
- **MAJOR 15: 步行縮放層級底圖墨色骨紙化 (Bone & ink map styling at zoom 15.5)**
  - 全面調整 `assets/style-positron.json`，將道路填色調整為 `#F7F4EE`、路緣輪廓調整為 `#8A8378`、步道調整為 `#EDE8DE`、所有文字標籤（包含街道與水體）統一為墨色 `#1C1915` 與紙色光暈 `#F3EFE6`。
- **MINOR 16: 詳情頁大型數字排版 (Large minutes typography)**
  - 詳情頁步行時間以 42px 橄欖綠等寬數字呈現「約 N 分鐘」。
- **MINOR 17: 非公開設施與營業時間語意化 (Access & opening hours formatting)**
  - 標註 `access=private` / `no` 為「非公開設施（私人專用）」，並將常用 OSM 星期時間格式轉為粵語。
- **MINOR 18: 移除 Viewport 縮放限制與修正寬度 (Viewport & container width)**
  - 移除 `maximum-scale=1, user-scalable=no`，`.app-container` 改為 `width: 100%`。
- **MINOR 19: 粵語提示與鍵盤可用性 (Cantonese strings & keyboard a11y)**
  - 移除 `alert()` 提示改為行內文字，手柄支援 Enter / Space 鍵盤展開/摺疊。

## Round 2 fixes

- **MAJOR 1: 香港起點 Overpass 合併保留停車場與非同步防競態 (HK carpark preservation & async race condition prevention)**
  - 修復 `tryLiveOverpass()` 在合併即時 OSM 地點時意外濾除 `hk-carpark/*` 設施的錯誤，確保 data.gov.hk 即時車位資訊不被 Overpass 回應清除。
  - 在 `setOrigin()`、`tryLiveOverpass()`、`fetchHkCarparks()` 與 `loadWeather()` 記錄觸發時的 `{lat, lon}` 座標，非同步請求返回時若起點已移動則自動忽略過期回應，杜絕舊起點資料覆蓋新起點的競態條件。
  - 當起點位於香港境內且即時 Overpass 查詢未成功時，空狀態提示精確顯示粵語說明：「澳門離線快照覆蓋唔到呢度，即時查詢未成功」。

- **MAJOR 2: 地圖生命週期管理與平靜降級邏輯優化 (Map lifecycle & fallback refinement)**
  - 當地圖觸發 `load` 事件時，自動隱藏平靜降級卡片（`display = 'none'`）並重設 `hasError = false`，解決慢速連線下地圖成功載入後仍被降級卡片遮擋的問題。
  - 在 `init()` 與重試按鈕回呼中主動呼叫 `this.map.remove()` 清理舊地圖實例，避免 WebGL 上下文重複疊加。
  - 調整錯誤處理邏輯，單一瓦片連線失敗（例如 `Failed to fetch` 404）不再視為致命錯誤；僅在 WebGL 崩潰、樣式致命失敗或連續瓦片錯誤達標時才展示降級卡片。

- **MAJOR 3: 步行街道輪廓對比增強 (Minor roads & paths contrast on paper background)**
  - 調整 `assets/style-positron.json` 中的 `highway_minor`（次要街道、服務道路、小巷）與 `highway_path`（步行徑）的線條顏色為暖石色 `#C4BBAE`，修復在 `#F3EFE6` 紙質背景下步行巷弄（如議事亭前地周邊網格）難以辨識的問題。

- **MINOR 4: 香港停車場即時狀態獨立展示與星期時間解析 (HK opening status row & weekday range)**
  - 詳情頁新增以「而家」標籤獨立展示的營業狀態列（例如「開放中」／「暫停開放」）。
  - `formatHkOpeningHours` 支援解析 `weekdays` 陣列（如星期一至五、星期六日等）與多時段組合，避免平日限定停車場被誤示為全週開放。
  - 確保已格式化之粵語營業時間字串不被重複包裹引號。

- **MINOR 5: Open-Meteo 無時區時間戳記標準化 (Zone-less ISO string normalization)**
  - 在 `js/geo.js` 新增 `normalizeMacauIsoString()`，為 Open-Meteo 返回之無時區時間戳記（如 `2026-11-11T01:45`）主動補上 `+08:00`，杜絕海外時區瀏覽器解析時產生時差偏移。

- **MINOR 6: orch.json 產品副標題粵語化 (Cantonese subtitle in orch.json)**
  - 將 `orch.json` 中的副標題由英文 `Just Around` 更新為粵語「生活設施導航」，維持整體產品界面與元資料的一致性。

## Round 3 fixes

- **MAJOR 1: 未發布車位之香港停車場資料來源修正 (HK carpark data source label for unpublished vacancy)**
  - 修復未發布即時車位（`vacancy: -1`）的香港停車場在詳情頁誤標為 OpenStreetMap 的問題。
  - 當設施 ID 為 `hk-carpark/*` 時，資料來源統一標示為「香港政府 data.gov.hk／運輸署」；若存在 `lastUpdate` 則附帶更新時間（例如 `（15:00 更新）`）。
  - 在 `formatPlaceDetails` 將 `lastUpdate` 傳遞至詳情渲染層，避免詳情視圖需額外讀取原始設施物件。

- **MINOR 2: 地圖載入後忽略瓦片錯誤 (Ignore tile errors after map is loaded)**
  - 修復地圖成功完成 `load` 事件後若遇到連續邊緣瓦片或字型錯誤仍誤觸平靜降級卡片的問題；地圖載入後不再因瓦片錯誤遮蔽已繪製之地圖。

- **MINOR 3: 香港即時查詢進行中空狀態提示 (Hong Kong pending live Overpass empty state)**
  - 於 `App` 類別加入 `isLiveOsmPending` 狀態旗標。當起點設定為香港且即時 Overpass 查詢仍在進行中時，空狀態副標題顯示「搵緊附近設施…」，避免在查詢完成前過早顯示「即時查詢未成功」。
