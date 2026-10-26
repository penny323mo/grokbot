# grokbot — Grok Bot 夜間項目統一 repo

Live: https://penny323mo.github.io/grokbot/ (GitHub Pages, branch `main`, root `/`)

## 結構
```
index.html / launcher.js / style.css   # 首頁 launcher（讀 projects/manifest.json）
projects/manifest.json                 # 項目清單：id, title, subtitle, category, description, path, added, accent, cover
projects/<id>/                         # 每個項目獨立、純靜態，用相對路徑
projects/<id>/cover/cover.webp         # 項目封面截圖（780x1040 webp，390px 手機 2x 頂部截圖）
.github/workflows/                     # 所有 workflow 放 root（GitHub 只讀 root .github）
docs/  scripts/  tests/                # repo 級文件、工具、測試
progress.md                            # 進度紀錄
```

## 規則（未來 nightly 項目）
1. 新項目一律放 `projects/<kebab-id>/`，唔好再開新 repo。
2. 喺 `projects/manifest.json` 加一條，**必須填 `added`（加入日期，YYYY-MM-DD，澳門時間項目開始嗰日）**同 **`cover`（封面圖路徑，如 `projects/<id>/cover/cover.webp`）**；launcher 會顯示並按日期排序。
3. 新項目必須提供封面圖 `projects/<id>/cover/cover.webp`（規格：780x1040 webp，即 390px 寬手機在 2x Retina 下之頂部截圖），且 tests 會檢查檔案是否存在。
4. 項目內只用相對路徑（`./x.js`，唔好 `/x.js`），因為網站喺 `/grokbot/projects/<id>/` 下面。
5. 需要 workflow 嘅，放 `.github/workflows/<id>-*.yml`，用 `defaults.run.working-directory: projects/<id>`。
6. 提交前行 `node tests/check_manifest.mjs`。
7. 唔好刪或 archive 舊嘅獨立 repo。

## 首頁 Launcher 功能
- **Hero 區域**：品牌識別「Grokbot 工作室」、粵語標語（「每晚一個新作品，諗、寫、審一手包辦」）、動態統計欄（收錄項目總數、最新加入項目名稱與日期、涵蓋類別總數），皆由 `manifest.json` 動態計算。
- **分類篩選晶片（Filter Chips）**：「全部」及各項目類別按鈕，具備無障礙 `aria-pressed` 屬性，手機端橫向平滑滾動，切換篩選即時流暢、無版面跳動（no layout jump）。
- **精品作品卡片（Project Cards）**：
  - 實體封面縮圖：使用 `<img loading="lazy" decoding="async" width="780" height="1040">`，採用 `object-fit: cover` 與頂部對齊裁切（`object-position: top`）。
  - 精緻擬裝置圓角外框與 Inset 底盤，以各項目之 `accent` 主色呈現微透明質感襯底（低不透明度，非霓虹光效）。
  - 分類標籤、格式化加入日期（`YYYY年M月D日`）、項目標題與副標題、單行限制簡介（1-line clamp）。
  - 僅最新加入之項目享有小巧的「NEW」標籤，且最新/旗艦作品於桌面端呈現更大版面（featured card）。
  - 整張卡片為超連結（`<a>`），提供優雅按壓縮放反饋（`:active scale .98`）。
- **設計與字型規範**：
  - iPhone 優先（390px 基準），320px–430px 無橫向溢出；桌面端（>= 760px）呈現雙欄網格。
  - CJK 繁體字體 Stack（`PingFang HK`、`PingFang TC`、`Noto Sans TC`、`Noto Sans HK`、`Microsoft JhengHei`、`system-ui`）；數字啟用等寬對齊（tabular numerals）；嚴謹 8px 網格間距。
  - 支援深色與淺色模式（`prefers-color-scheme`），採溫潤中性色調（warm neutrals），各項目 accent 點綴克制。
  - 微進場漸變動畫（staggered entrance），全面相容 `prefers-reduced-motion` 無障礙減弱動態設定。
  - 支援 Safe-area insets，所有互動元素皆滿足最低 44px 觸控點擊目標。
  - 嚴格禁用：紫藍漸層、毛玻璃/backdrop blur、霓虹發光、emoji、模板化 AI startup 風格。
  - 頁尾提供 GitHub repo 連結；manifest 字串全面安全跳脫（XSS safe），並提供優雅錯誤狀態與重新載入機制。

## 已有項目
| id | 加入日期 | 來源 repo |
|---|---|---|
| beat-the-bookie | 2026-10-23 | penny323mo/beat-the-bookie（原 Vercel） |
| penalty-mind-game | 2026-10-24 | penny323mo/penalty-mind-game |
| odds-lab | 2026-10-25 | penny323mo/odds-lab — workflow `odds-lab-update-data.yml`，secret `ODDS_API_KEY` |
| prompt-studio | 2026-10-26 | penny323mo/prompt-studio — 重新設計仲喺舊 repo 進行，要用 `scripts/sync-subtree.sh prompt-studio` 同步 |

歷史用 `git subtree add` 保留。
