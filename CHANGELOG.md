# Changelog

All notable changes to the Prompt Studio project will be documented in this file.

## Round 0 build

### 🌟 新增功能 (New Features)
- **基礎架構與 PWA 支援**：
  - 建立純靜態無構建依賴的 Web 應用架構，純相對路徑引用，完全適配 GitHub Pages 子路徑 `/prompt-studio/` 託管。
  - 建立 `manifest.webmanifest` 與離線快取 `sw.js`，包含不同解析度之高清圖標（192px, 512px, Apple Touch Icon 180px, Favicon SVG），並優雅相容非 HTTPS 與 `file://` 環境。
- **行動優先極致體驗 (iPhone Safari 390×844)**：
  - 遵循 iOS 人體工學設計，全站所有點擊目標 $\ge 44\times 44\text{px}$，輸入框字體 $\ge 16\text{px}$ 避免 iOS 自動聚焦放大。
  - 墨黑低調奢華深色主題（Dark Charcoal/Glassmorphic），配以金色（#f59e0b）與紫羅蘭（#8b5cf6）漸層。
  - 嚴格適配頂部劉海與底部 Home Bar 安全區（`env(safe-area-inset-*)`），零水平溢出（0 horizontal overflow at 360–430px）。
- **結構化提示詞工作室 (Build Tab)**：
  - **圖片模式 vs 影片模式** 分段即時切換。
  - 11 大折疊手風琴區塊，具備當前選擇摘要單行顯示與 🎲 單區塊獨立隨機功能：
    1. **主體 (Subject)**：自由中英雙語輸入（支援一鍵清除）+ 10 款主體類型快捷晶片。
    2. **場景 (Scene)**：12 款經典場景晶片（包含澳門舊街、雨夜都市、晨霧森林等）+ 自訂場景描述。
    3. **藝術風格 (Style)**：**雙列視覺色塊卡片 (18 款大師級預設)**（電影寫實、吉卜力、皮克斯 3D、水彩、油畫、東方水墨、賽博朋克、浮世繪等）+ 9 款細節修飾詞。
    4. **光影氛圍 (Lighting)**：12 款好萊塢級光線（黃金時刻、藍調時刻、丁達爾聖光、倫勃朗光等）。
    5. **相機與鏡頭 (Camera)**：景別、拍攝角度、焦段鏡頭（24mm–200mm、變形寬銀幕、魚眼）、光圈（f/1.4–f/8.0）。
    6. **構圖美學 (Composition)**：三分法、中心對稱、引導線、留白、框中框、黃金螺旋、對角線。
    7. **情緒氛圍 (Mood)**：9 款情緒基調（夢幻、憂鬱、史詩、溫暖、神秘等）。
    8. **色調 (Palette)**：8 組色板色點展示（青橙、粉彩、黑白、大地、賽博等）。
    9. **畫面比例 (Aspect Ratio)**：6 組大按鈕（1:1、4:5、3:4、9:16、16:9、21:9）+ Midjourney 尾碼切換開關。
    10. **影片專屬 (Video Only)**：13 款鏡頭運動（推進、後拉、360° 環繞、搖臂、無人機航拍等）、片長、節奏、主體動態，以及**可上下重排、增刪、動態計算時間軸之 6 鏡頭分鏡故事板**。
    11. **負面提示詞 (Negative Prompt)**：內置防崩壞瑕疵晶片（模糊、粗糙、畸變手部/面部、浮水印等；影片時自動擴充頻閃、抖動、怪異形變）+ 自由補充。
- **即時提示詞懸浮預覽抽屜 (Live Sheet)**：
  - 底部可拖曳展開抽屜，高亮脈衝動畫即時反饋組裝結果。
  - 生成文法自然的專業英文 Prompt（非生硬堆砌）+ 完整字數統計。
  - **中文廣東話逐句解析**：同步生成地道廣東話解說。
  - 一鍵複製 Prompt（具備 iOS Safari 剪貼簿向下相容機制）、複製負面詞、儲存至庫與清空（具備復原 Undo 功能）。
  - 「隨機嚟一個 (Surprise Me)」：具備協調邏輯之整體隨機生成。
- **大師級靈感配方庫 (Recipes Tab)**：
  - 10 款高品質範例（6 款圖像 + 4 款影片，包含「澳門雨夜霓虹街頭」、「吉卜力風早晨Café」、「香水微距」、「水墨神龍」、「賽博朋克機械貓」、「維港日落航拍」、「慢鏡拿鐵拉花」等）。
  - 分類標籤篩選、配方詳情預覽彈窗、一鍵全套導入工作室。
- **個人提示詞庫 (Library Tab)**：
  - 本地儲存 `localStorage` 持久化，防異常崩潰與配額超限處理。
  - 標籤分類、星號最愛、即時搜尋、卡片相對時間（廣東話「剛剛」「3 分鐘前」「尋日」）。
  - 載入編輯、複製、副本建立、刪除（附帶復原 Undo 提示）。
  - JSON 格式匯出（下載檔案 + iOS 複製 JSON 剪貼簿）與匯入（自動去重、版本結構校驗）。
  - 草稿自動暫存（Draft Autosave），刷新頁面無縫恢復。

### 🧪 驗證與測試 (Verification & Testing)
- **Node.js 單元測試 (`node --test tests/`)**：
  - 9 大測試套件，涵蓋預設數據完整性、Prompt 組合順序、影片分鏡時間計算、廣東話解說生成、負面詞處理、偽隨機 PRNG 確定性、儲存庫 CRUD、JSON 匯入匯出與去重驗證，全數通過（9/9 pass）。
- **Headless Chrome 390×844 端到端驗證**：
  - 0 控制台報錯（0 console errors, 0 warnings）。
  - 0 水平橫向滾動（scrollWidth == 390px）。
  - 驗證點擊風格、光線、複製、儲存、重新整理持久化、影片模式分鏡建立與靈感載入等全部關鍵路徑。
  - 產生 5 張高清測試截圖於 `screenshots/`。

### 📌 已知差距與後續規劃 (Known Gaps & Future Roadmap)
- 目前預設配方為 10 套，未來可根據使用者需求持續擴增至 30+ 款細分領域配方。
- 目前圖片預設風格縮圖採用純 CSS 漸層與幾何微結構渲染，未來可加入真實離線 WebP 樣張增強視覺直觀度。
- 目前分鏡故事板上限為 6 個鏡頭，對於超長篇多場景短片可於後續版本開放至 12+ 鏡頭並支援鏡頭轉場（Transition）語意。

## Round 1 fixes

### 🛠️ Grok Review 修復清單 (Items 1–20)
1. **CRITICAL #1 (English Model Prompt Purity)**：修復所有配方、隨機生成與主體晶片混入中文字元的問題。`buildPrompt` 優先使用純英文 `state.subjectEn` / `state.subject` / `cat.sampleEn`；10 套靈感配方全數分離為英文 `subject`/`subjectEn` 與廣東話 `subjectZh`；`randomize()` 統一填入英文主體。單元測試驗證 10 款配方與 40 次隨機生成均為 100% 純英文（0 漢字）。
2. **MAJOR #2 (State Array Guard & Crash Resilience)**：新增 `PromptEngine.sanitizeState(rawState)`，強制防禦缺失欄位，保證 `styleModifiers`、`negativeChips`、`shots` 恆為陣列；於草稿還原、庫載入編輯、配方載入、JSON 匯入處全面調用，杜絕 `includes` 崩潰。
3. **MAJOR #3 (Recipe Loading Unsaved Confirmation)**：新增 `isBuilderDirty()` 偵測工作室當前工作狀態，若有未儲存之創作，載入配方時跳出確認提示（「而家嘅創作尚未儲存，確定用呢個配方覆蓋？」），取消則保留原內容。
4. **MAJOR #4 (Library Edit: Save As New Item)**：於儲存彈窗新增「另存為新項目」按鈕（`#btnSaveAsNew`）；編輯庫項目時展示「更新現有項目」與「另存為新項目」雙按鈕，支援分別覆蓋與新增。
5. **MAJOR #5 (Library Delete Confirmation)**：刪除庫項目時新增確認對話框（`確定要刪除「${item.name}」？`），確認後再執行刪除並附帶 5 秒復原 Undo Toast。
6. **MAJOR #6 (Storage Quota Failure Handling)**：`PromptStore.saveLibrary`、`addItem`、`updateItem`、`validateAndImport` 全面傳遞儲存成功/失敗狀態；儲存空間超限時於 UI 彈出明確廣東話錯誤警告（「儲存失敗，空間可能已滿，請試下刪除舊項目或匯出備份」）。
7. **MAJOR #7 (Shot List Input & Control Sizes)**：分鏡輸入框與下拉選單高度設為 44px、字體設為 16px（防止 iOS Safari 自動縮放）；上移、下移、刪除及「＋ 新增鏡頭」按鈕觸控點擊範圍皆升級至 $\ge 44\times 44\text{px}$。
8. **MAJOR #8 (Touch Targets Enlargement)**：將圖片/影片切換鍵（`#btnModeImage`、`#btnModeVideo`）、頂部隨機與清空（`#btnHeaderRandom`、`#btnHeaderClear`）、各區塊骰子（`.btn-section-dice`）、清除主體（`#btnClearSubject`）、配方卡片按鈕（`.btn-use-recipe`）、庫卡片按鈕（`.btn-lib-action-sm`）、最愛按鈕（`.btn-lib-fav`）等全部控制項之點擊觸控區域擴充至 $\ge 44\times 44\text{px}$。
9. **MAJOR #9 (ARIA Pressed & Keyboard Accessibility)**：`syncChipActive`、風格色塊卡片、色板卡片、比例晶片、修飾詞晶片及負面詞晶片全面補充 `aria-pressed="true/false"`、`role="button"`、`tabindex="0"` 與鍵盤 Enter/Space 觸發支援。
10. **MAJOR #10 (Living Artist Name Removed)**：移除吉卜力預設中在世藝術家姓名「Hayao Miyazaki」，改用風格美學描寫「Studio Ghibli-like hand-drawn anime background, lush painted scenery, nostalgic pastoral aesthetic」。
11. **MAJOR #11 (Recipe & Preset Data Defects)**：補全遺漏光圈 `ap_f1_8`（f/1.8 柔和淺景深）；新增專屬場景 `harbour_waterfront`（維港水岸）與 `alien_desert`（外星荒漠）；修正 `volumetric_light` 避免與 `god_rays` 重複；負面詞 `"deformed"` 修正為有效預設 `"bad_hands"`；清理 `descEn` 冗餘的 `Shot 1 (0-3s):` 前綴。
12. **MAJOR #12 (Shot-List & Library Card XSS / DOM Sanitization)**：新增分鏡預設描述為空字串並設置 Placeholder；分鏡描述輸入框改採安全 DOM 屬性指派；庫卡片使用 `escapeHtml` 轉義項目名稱、提示詞與標籤。
13. **MAJOR #13 (iOS Clipboard Fallback)**：改善無 Clipboard API 時的降級方案，將臨時 textarea 置於視口左上方（`fixed; top:0; left:0; width:1px; height:1px; opacity:0.01`），確保 iOS Safari `document.execCommand('copy')` 成功執行。
14. **MAJOR #14 (Service Worker Resilient Caching)**：快取版本升級至 `prompt-studio-v2`；移除脆弱的 `"./"` 預快取路徑，改採明確檔案清單；`fetch` 攔截限定同源請求；離線快取寫入增加容錯處理。
15. **MAJOR #15 (iOS Visual Viewport Accommodation)**：新增 `setupVisualViewport()` 監聽器，偵測虛擬鍵盤彈起時為 `body` 添加 `.keyboard-open` 樣式並位移底部懸浮抽屜，防止遮蔽輸入焦點。
16. **MINOR #16 (Storage Corruption Test)**：於單元測試新增非 JSON 與結構破壞測試案例，驗證 `loadLibrary` 遇到髒資料時靜默返回 `[]` 不崩潰。
17. **MINOR #17 (Deterministic Fisher-Yates Shuffle)**：將 `sampleSubset` 中的不穩定排序演算法改為使用 `rng()` 驅動的標準 Fisher-Yates 洗牌演算法。
18. **MINOR #18 (Prompt Sheet Footer Clear Action)**：於懸浮預覽抽屜底部工具列新增「🧹 清空」按鈕（`#btnSheetClear`），具備 44px 觸控目標並支援 5 秒復原 Undo。
19. **MINOR #19 (Library Dynamic Tag Filter Chips)**：在庫頁面動態收集所有已儲存項目的標籤聯集，動態生成 `#標籤` 篩選晶片列，支援按標籤即時篩選。
20. **MINOR #20 (Typo & Details & Spoken Cantonese)**：修正比例標籤錯字「直倒」為「直向」；中文解說手風琴預設保持開啟（`open`）；彈窗關閉與開啟同步切換 `aria-hidden`；解說預設文字改為口語廣東話「未填主體，模型會自由發揮。」；移除 viewport `user-scalable=no` 保持可縮放人機無障礙規範。

### 🎯 Orchestrator Findings 修復對照 (Items 1–7)
1. **Orchestrator #1**：修正光線晶片點擊狀態同步與 `aria-pressed="true/false"` 賦值，修復光線描述在摘要與 Prompt 中的展示。
2. **Orchestrator #2**：預覽抽屜中廣東話解說區塊（`#detailsExplanation`）設為預設展開（`open`），進入應用即可見地道中文解說。
3. **Orchestrator #3**：新增鏡頭描述值預設改為空字串，提供清晰 Placeholder，避免「新鏡頭描述」字眼洩漏至英文 Prompt。
4. **Orchestrator #4**：分鏡故事板提示詞格式由生硬的 `Storyboard [...]` 整理為連貫自然英語句子（`Shot 1 (0–3s): [move], [desc]. Shot 2 (3–6s): ...`）。
5. **Orchestrator #5**：全數靈感配方載入時注入純英文 `subject`/`subjectEn`，避免中文主體進入英文 Prompt。
6. **Orchestrator #6**：所有模式切換、頂部按鈕、分鏡調整、清除鍵觸控面積全面符合 $\ge 44\times 44\text{px}$ 規範。
7. **Orchestrator #7**：精簡預設初始狀態，始終由主體引導組裝，產出語句結構最優雅自然的提示詞。

## V2 Round 1 redesign

### 🎨 Apple/Linear 視覺風格全面重構 (Visual Redesign)
- **預設淺色模式 (Light Mode Default)**：
  - 徹底摒棄過時的暗黑毛玻璃漸層與紫色霓虹視覺，全面重構為蘋果風格 iOS Grouped UI。
  - 採用 iOS 系統群組背景（#F2F2F7）、純白群組卡片（#FFFFFF）與細緻髮絲紋分隔線（hairline separators）。
  - 單一克制色彩系統：以 Apple System Blue（#007AFF）作為核心強調色，配合細膩的淺藍半透明背景（#007AFF1A）。
- **原生深色模式 (Proper Dark Mode via `prefers-color-scheme: dark`)**：
  - 支援真正的深邃近黑與純黑（#000000 背景、#1C1C1E 卡片、#2C2C2E 內嵌槽），告別低對比度與混濁毛玻璃。
  - 暗色強調色自動適配 Apple Dark System Blue（#0A84FF），對比清晰高雅。
- **排版與字體階級 (Typography & Scale)**：
  - 採用原生系統字體棧（-apple-system, SF Pro, PingFang TC），字體渲染清晰。
  - 建立嚴謹層級：大標題（17px/700）、分區標題（12-13px/600 帶間距大寫）、內文與提示詞（14-16px）、說明標籤（10-12px）。
  - 嚴格保證所有輸入框、下拉選單、文字區域字體 $\ge 16\text{px}$，避免 iOS Safari 點擊聚焦時自動放大畫面。
- **iOS 質感控制項 (iOS Controls & Micro-interactions)**：
  - **分段控制項 (Segmented Control)**：比照原生 `UISegmentedControl`，淺灰色膠囊槽底配以具細微陰影的白色滑動膠囊，具備 44px 觸控點擊區。
  - **微填充膠囊晶片 (Chips as Subtle Filled Pills)**：未選取時為柔和微填底色，選取時轉為沉穩明亮的 Apple Blue 實心填色與白色文字，點擊狀態鮮明。
  - **毛玻璃頂部導航 (Sticky Frosted Header)**：半透明磨砂玻璃頂欄，隨滾動保持輕盈背景模糊（backdrop-filter: blur(20px)）。
  - **底部分頁導航欄 (iOS Bottom Tab Bar)**：原生風格半透明磨砂底欄，安全區邊距（safe-area-inset-bottom）精準適配，藍色活躍狀態。
  - **提示詞輸出卡片 (Prompt Output Card)**：清晰等寬字型（ui-monospace, SF Mono）與柔和卡片背景，搭配高對比度的顯眼主要「複製 Prompt」藍色大按鈕。
  - **流暢微動效**：180-250ms 蘋果物理緩動曲線，並嚴格遵循 `@media (prefers-reduced-motion: reduce)`。
  - **無障礙與尺寸**：全站所有按鈕與觸控標的皆嚴格 $\ge 44\times 44\text{px}$，在 390px 視口下 0 水平溢出（0 horizontal overflow）。
- **截圖驗證**：
  - 於 `screenshots/v2/` 產出淺色與深色模式之 Builder、Video Mode、Recipes、Library 390px 寬度截圖。
