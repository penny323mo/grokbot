# Prompt 工作室 (Prompt Studio)

> 專為 iPhone Safari (390×844) 深度優化的頂級 AI 圖像與影片提示詞工作室。  
> 廣東話優雅介面，即時生成好萊塢大師級英文 Prompt。

🌐 **線上演示**：`https://penny323mo.github.io/prompt-studio/`

---

## 🌟 核心特色 (Core Features)

1. **📱 極致原生手感（iPhone 390×844 首選）**
   - 嚴格遵守觸控標竿（所有按鈕及晶片點擊區域 $\ge 44 \times 44\text{px}$）。
   - 純深色墨黑玻璃感質感（Dark Glassmorphic UI），適配金色與紫羅蘭漸變光澤。
   - 完美適配 iOS 頂部劉海與底部安全區域（`safe-area-inset-*`），輸入框字體 $\ge 16\text{px}$ 杜絕 iOS 放大縮放。
   - 支援離線 PWA（`manifest.webmanifest` + Service Worker 靜態快取）。

2. **🎨 結構化雙模提示詞生成（圖片 / 影片）**
   - **圖片模式**：主體（支援中英雙語）、場景環境、18 款視覺美學風格（卡片式雙列預覽）、光影氛圍、相機鏡頭（景別、視角、焦段、光圈）、構圖、情緒、色板點選、畫面比例。
   - **影片模式**：專屬鏡頭運動（推進、後拉、360° 環繞、搖臂、無人機航拍等）、片段時長、動作節奏、主體動態，以及**多鏡頭分鏡故事板（Shot List Storyboard，自動計算時間軸）**。

3. **💬 即時提示詞預覽與廣東話解說**
   - 底部懸浮可折疊抽屜，即時組合出符合好萊塢語法的自然英文提示詞。
   - **廣東話中文解析**：逐句拆解畫面元素，清晰呈現所選構圖與光影意圖。
   - 支援負面排除詞（Negative Prompt）獨立預覽與複製。
   - 一鍵複製至剪貼簿（內置 iOS 剪貼簿兼容 Fallback）並跳出通知。

4. **💡 10 款大師級靈感配方 (Curated Recipes)**
   - 涵蓋「澳門雨夜霓虹街頭」、「吉卜力風早晨Café」、「香水微距商業廣告」、「水墨山水神龍」、「賽博朋克機械貓」、「維港日落無人機航拍」、「慢動作拿鐵拉花」等。
   - 點擊「🔥 用呢個配方」即刻全套載入工作室隨意調整。

5. **📚 我的庫 (Library) 與 JSON 匯出匯入**
   - 本地儲存（`localStorage`）持久化保存，支援標籤分類、星號最愛、即時搜尋。
   - 具備項目複製副本、載入編輯、刪除（支援復原 Undo）。
   - 支援匯出為結構化 JSON，並提供具備排重（Deduplication）機制的 JSON 匯入功能。
   - 自動即時暫存（Draft Autosave），重新整理網頁絕不丟失進度。

---

## 🛠️ 技術架構 (Architecture)

- **純靜態原生 Web 技術**：無須任何打包構建工具（No build step, zero CDN），使用系統字型族（PingFang TC / Noto Sans TC）。
- **模組化分層架構**：
  - `js/data.js`：預設資料庫（18 款風格、12 款光影、相機參數、色板與精選配方）。
  - `js/prompt.js`：純函數提示詞組裝、廣東話解析、負面提示詞與 PRNG 隨機引擎（支援 Node.js 與瀏覽器雙向導入）。
  - `js/store.js`：儲存管理器、草稿暫存、JSON 匯入匯出校驗與防崩潰保護。
  - `js/app.js`：DOM 事件驅動、手勢抽屜、動畫反饋與 PWA 控制器。
- **單元測試**：採用 Node.js 原生測試框架（`node --test tests/`）。
- **無頭 Chrome 驗證**：透過 Puppeteer 在 390×844 視口下進行 0 控制台報錯與 0 水平橫向滾動全自動驗證。

---

## 🧪 執行測試與驗證

```bash
# 執行 Node.js 單元測試
node --test tests/

# 執行 390x844 無頭瀏覽器驗證與截圖生成
node tests/verify_headless.js
```

---

## 📄 授權條款

MIT License. Designed with care for Penny.
