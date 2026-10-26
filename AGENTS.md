# grokbot — Grok Bot 夜間項目統一 repo

Live: https://penny323mo.github.io/grokbot/ (GitHub Pages, branch `main`, root `/`)

## 結構
```
index.html / launcher.js / style.css   # 首頁 launcher（讀 projects/manifest.json）
projects/manifest.json                 # 項目清單：id, title, subtitle, category, description, path, added, accent, cover
projects/<id>/                         # 每個項目獨立、純靜態，用相對路徑
projects/<id>/cover/thumb.webp         # 項目封面（cover = projects/<id>/cover/thumb.webp, 600x600 square crop (3x) from a real 390px iPhone screenshot of the live app; hand-pick a clean characteristic UI region (no header-only, no back button, no empty space)）
.github/workflows/                     # 所有 workflow 放 root（GitHub 只讀 root .github）
docs/  scripts/  tests/                # repo 級文件、工具、測試
progress.md                            # 進度紀錄
```

## 規則（未來 nightly 項目）
1. 新項目一律放 `projects/<kebab-id>/`，唔好再開新 repo。
2. 喺 `projects/manifest.json` 加一條，**必須填 `added`（加入日期，YYYY-MM-DD，澳門時間項目開始嗰日）**同 **`cover`（封面圖路徑，如 `projects/<id>/cover/thumb.webp`）**；launcher 會顯示並按日期排序。
3. 新項目必須提供封面圖（規格：cover = projects/<id>/cover/thumb.webp, 600x600 square crop (3x) from a real 390px iPhone screenshot of the live app; hand-pick a clean characteristic UI region (no header-only, no back button, no empty space)），且 tests 會檢查檔案是否存在與後綴（.svg 或 .webp）。
4. 項目內只用相對路徑（`./x.js`，唔好 `/x.js`），因為網站喺 `/grokbot/projects/<id>/` 下面。
5. 需要 workflow 嘅，放 `.github/workflows/<id>-*.yml`，用 `defaults.run.working-directory: projects/<id>`。
6. 提交前行 `node tests/check_manifest.mjs`。
7. 唔好刪或 archive 舊嘅獨立 repo。

## 首頁 Launcher 功能
- **Hero 區域**：品牌識別「Grokbot 工作室」、粵語標語（「每晚一個新作品，諗、寫、審一手包辦」）、單行極簡統計摘要（收錄項目總數、最新加入項目名稱與日期），皆由 `manifest.json` 動態計算。
- **分類篩選晶片（Filter Chips）**：「全部」及各項目類別單選按鈕，具備無障礙 `role="radiogroup"` / `role="radio"`、`aria-checked` 與方向鍵/Home/End roving tabindex 鍵盤導航，手機端自動折行換行、吸頂常駐（`position: sticky`）、切換篩選即時流暢且無版面跳動（no layout jump）。
- **緊湊橫向作品卡片（Compact Row Cards）**：
  - 語意化結構：`<ul class="cards-grid">` 內置 `<li>` 列表項目，卡片間隔 12px。
  - 左側圖標磚：88x88 圓角（20px）真實截圖縮圖，顯示項目的 `thumb.webp`，1px 內邊框（`object-fit: cover`），全卡預載解碼配合 `is-ready` 平滑淡入。
  - 右側資訊區：
    - Meta 列：分類圓點＋名稱 · 加入日期（`YYYY年M月D日`），最新作品享有「新」標籤。
    - 標題：17px semibold。
    - 簡介：最多 2 行限制（2 lines max clamp）。
    - 緊湊藥丸按鈕：「開始 →」靠右對齊置於文案下方。
  - 整張卡片為超連結（`<a>`），保持既有連結與可訪問性語意，支援清晰聚焦外框（`:focus-visible`）與按壓縮放反饋（`:active scale .985`）。
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

## 返回主頁掣（必須）
每個項目嘅 `index.html` 喺 `</body>` 前面必須加：
```html
<script src="../_shared/back.js" defer></script>
```
`projects/_shared/back.js` 會加一個「‹ grokbot」浮動掣（左下角，44px，避開 safe-area，自動企喺底部固定 tab bar / action bar 上面；向下捲動時收埋；全螢幕 canvas 遊戲進行中自動隱藏，項目亦可以設 `document.body.dataset.gbPlaying='1'` 主動隱藏）。
注意：用 `scripts/sync-subtree.sh` 由舊 repo 同步時，如果上游改咗 `index.html`，要確認呢行冇被衝走。
