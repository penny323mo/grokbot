You are working in /workspace/grokbot (static GitHub Pages site, served at https://penny323mo.github.io/grokbot/). Rewrite ONLY the root launcher: index.html, launcher.js, style.css. Do not touch projects/<id>/ code. Data source: projects/manifest.json (fields: id,title,subtitle,category,description,path,added YYYY-MM-DD,accent,cover). Covers already exist at projects/<id>/cover/cover.webp (780x1040 portrait phone screenshots of each app's top).

Owner feedback on the current launcher: "too lazy/plain". Build a genuinely premium, crafted, iPhone-first (390px) launcher, all copy in Cantonese Traditional Chinese:
- Hero: identity "Grokbot 工作室", short Cantonese tagline (e.g. 每晚一個新作品，諗、寫、審一手包辦), stats row: 項目數量, 最新加入 (title + date), 類別數量. Computed from manifest.
- Category filter chips (全部 + each category), accessible buttons with aria-pressed, horizontally scrollable on phone, no layout jump.
- Rich project cards: real cover thumbnail (<img loading=lazy decoding=async width/height set, alt text, object-fit cover, top-aligned crop) framed tastefully (e.g. device-like rounded frame or inset panel tinted by the project's accent at low opacity), category tag, 加入日期 formatted 2026年10月26日, title + subtitle, ONE-line description (clamp), a small 'NEW' badge on the most recent project only. Whole card is a link. Featured/latest card may be larger.
- Typography: CJK stack ("PingFang HK","PingFang TC","Noto Sans TC","Noto Sans HK","Microsoft JhengHei",system-ui) ; tabular numerals; careful hierarchy, generous but refined spacing, 8px grid.
- Light AND dark via prefers-color-scheme with warm neutral palette; per-project accent used sparingly.
- Subtle staggered entrance animation and press (:active scale .98) feedback; respect prefers-reduced-motion.
- Safe-area insets, min 44px tap targets, no horizontal overflow at 320-430px; looks good on desktop too (2-col grid >= 760px).
- FORBIDDEN: purple/blue gradients, glassmorphism/backdrop blur, neon glow, emoji, generic "AI startup" look. Think editorial/Apple/Linear quality.
- Footer: link to GitHub repo https://github.com/penny323mo/grokbot, small text.
- Escape manifest strings; graceful error state; no external dependencies or webfonts.
- Keep tests/check_manifest.mjs passing; extend it to require `cover` and check the file exists.
Also update AGENTS.md: document the `cover` field (780x1040 webp, 390px-wide phone screenshot at 2x, stored projects/<id>/cover/cover.webp, required for new projects) and the launcher features.
When done, run `node tests/check_manifest.mjs`, then `git add -A && git commit -m "launcher: premium redesign (agy r1)"`. Do not push.
