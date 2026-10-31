# 據點號令 · Bannerline

明亮低面數玩具風即時戰略。單手直屏：兵營出兵、人數對撞、攻陷對方司令部。

- **Live:** https://penny323mo.github.io/bannerline/
- **Viewport:** 390×844 portrait, touch first
- **Plan:** [PLAN.md](./PLAN.md)

Original game. The genre feel is the only borrowed idea — no copied assets, names, or branding.

## Play

點自己嘅司令部或者兵營，再點目標（或者拖過去）。人數對撞會相減，打贏嘅一邊繼續行。佔領敵方司令部就贏，我方司令部失守就輸。右上角「有聲 / 靜音」會記住。

## Develop

```bash
npm install
npm test
npm run dev
npm run build
```

GitHub Pages serves the repository root. `npm run build` writes a relative `./static/app.js` bundle into the root `index.html`. The Vite source entry is `index.source.html` (restored automatically by `dev` and `build`).

`assets/ref/` is local art direction and is not published.
