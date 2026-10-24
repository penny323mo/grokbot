# 12碼讀心戰 v2 升級報告

Live: https://penny323mo.github.io/penalty-mind-game/
Repo: https://github.com/penny323mo/penalty-mind-game
流程：agy 寫 code → grok review → agy 改；每輪 commit + push。

## Round 1 — 3D 射 12 碼
- agy 完成：Three.js r160（vendor，無 CDN）、3D 球場、撥手指射門（力度/弧度/物理）、會撲嘅門將（觸及範圍判定，唔係擲骰）、WebAudio 音效、慢鏡/震畫面/彩帶、可預測度修正（<8 球顯示「數據不足」）。
- Node tests：model 14/14、shot 5/5、keeperAI 5/5。
- Headless Chrome 390px 截圖：screenshots/v2/r1-*.png（swiftshader 軟件渲染 ~23fps，唔代表 iPhone）。
- 我觀察到：門將撲完之後一直瞓喺地冇復位；個波喺畫面底被切；球場上空一片黑，睇唔到看台；模擬 touch 事件冇觸發射門（mouse 得），要 grok 核實 iOS。
- grok round 1 verdict：**NOT READY**（2 CRITICAL：門將唔復位、鏡頭切波+看台黑；3 MAJOR：iOS touch、震畫面被覆蓋、撥動起點範圍）。見 reviews/grok-v2-r1.md。
- agy 修正後我再驗：門將每球復位 ✅、個波完整見到 ✅、模擬 touch 射門成功 ✅、console 0 error ✅、tests 3+6+14+6 全過。
- 仲未靚：觀眾只係一格格浮喺半空嘅色塊，冇看台結構；個波喺遠處顯得好細。

## Round 2 — 攻守兩邊 + 讀心
- agy 完成：龍門模式（射手助跑、撥手指撲）、takerAI 學你撲邊、門將假動作同 20+ 句廣東話寸人、3D 場內讀心熱圖、慢鏡重播、易/中/難/地獄、看台同廣告板。
- Node tests 全過：difficulty 3、input 3、keeperAI 6、model 14、shot 6、takerAI 4、taunts 22。
- 截圖 screenshots/v2/r2-*.png。自動比賽期間有一個 JS error（reading 'x'），交咗畀 grok 追。
- grok round 2 verdict：**NOT READY**（龍門模式一射就 crash、撲邊永遠係中下、難度冇實際影響、重播唔係真重播等）。見 reviews/grok-v2-r2.md。
- agy 修正後我再驗：自動比賽 0 個 JS error，攻守輪流一路去到 2-0；新增 match_integration test；8 套 tests 全過（65 項）。截圖已更新 r2-*.png。
## Round 3 — 世界盃 + 解鎖 + 分享
- agy 完成：src/tournament.js（16 隊淘汰賽）、unlocks.js（星星/解鎖）、share.js（分享卡）、坐低嘅觀眾。10 套 tests 全過。
- 我驗到嘅問題（交咗 grok）：單場模式撥極都射唔出（回歸 bug）；撳「世界盃淘汰賽」冇反應；headless fps 跌咗。
