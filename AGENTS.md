# grokbot — Grok Bot 夜間項目統一 repo

Live: https://penny323mo.github.io/grokbot/ (GitHub Pages, branch `main`, root `/`)

## 結構
```
index.html / launcher.js / style.css   # 首頁 launcher（讀 projects/manifest.json）
projects/manifest.json                 # 項目清單：id, title, subtitle, category, description, path, added, accent
projects/<id>/                         # 每個項目獨立、純靜態，用相對路徑
.github/workflows/                     # 所有 workflow 放 root（GitHub 只讀 root .github）
docs/  scripts/  tests/                # repo 級文件、工具、測試
progress.md                            # 進度紀錄
```

## 規則（未來 nightly 項目）
1. 新項目一律放 `projects/<kebab-id>/`，唔好再開新 repo。
2. 喺 `projects/manifest.json` 加一條，**必須填 `added`（加入日期，YYYY-MM-DD，澳門時間項目開始嗰日）**；launcher 會顯示並按日期排序。
3. 項目內只用相對路徑（`./x.js`，唔好 `/x.js`），因為網站喺 `/grokbot/projects/<id>/` 下面。
4. 需要 workflow 嘅，放 `.github/workflows/<id>-*.yml`，用 `defaults.run.working-directory: projects/<id>`。
5. 提交前行 `node tests/check_manifest.mjs`。
6. 唔好刪或 archive 舊嘅獨立 repo。

## 已有項目
| id | 加入日期 | 來源 repo |
|---|---|---|
| beat-the-bookie | 2026-10-23 | penny323mo/beat-the-bookie（原 Vercel） |
| penalty-mind-game | 2026-10-24 | penny323mo/penalty-mind-game |
| odds-lab | 2026-10-25 | penny323mo/odds-lab — workflow `odds-lab-update-data.yml`，secret `ODDS_API_KEY` |
| prompt-studio | 2026-10-26 | penny323mo/prompt-studio — 重新設計仲喺舊 repo 進行，要用 `scripts/sync-subtree.sh prompt-studio` 同步 |

歷史用 `git subtree add` 保留。
