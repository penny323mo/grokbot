# 資源與授權清單 (Assets & Licences)

本專案《12碼讀心戰》(Penalty Mind Game v2) 秉持 **「100% 離線即玩、零外部 CDN 依賴、輕量高畫質」** 的設計原則。除核心引擎 Three.js 存放於本地 `vendor/` 外，所有 3D 人物模型、足球球皮、球場光影氛圍及所有音效皆為 **純程式程序化生成 (100% Procedural Generation)**，無任何外部下載失敗或版權爭議。

---

## 1. 核心第三方引擎庫

| 資源名稱 | 存放路徑 | 版本 | 授權條款 (License) | 來源 / 備註 |
|---|---|---|---|---|
| **Three.js** | `vendor/three.module.js` | r160 | [MIT License](https://github.com/mrdoob/three.js/blob/master/LICENSE) | 輕量化 ES 模組，完全離線內建，負責 WebGL 3D 渲染與幾何運算 |

---

## 2. 程序化 3D 角色模型 (Procedural Humanoids)

為了避免加載大型外部 glTF 模型的網絡延遲與高內存開銷，本遊戲全角色均採用高效率的程序化分段多邊形與自適應材質：

### 守門員 (`src/keeper.js` - `Goalkeeper3D`)
- **解剖分段**：頭部 (Sphere)、頭髮 (Half-Sphere Cap)、軀幹 (Box)、四肢 (Cylinders)、手套 (Reach-Box)、球靴 (Box)。
- **動態球衣換裝**：支援 16 國世界盃國家隊主客場球衣配色 (`setKitColors`)，實時著色球衣、球褲、手套與號碼背印。
- **撲救骨骼動態**：6 方向撲救 (TL, TM, TR, BL, BM, BR) 與身體伸展插值、慶祝、丟球抱頭沮喪。
- **眼神與微動作**：支援 Hard/Hell 難度下的微動作假動作（Shuffle, Lean, Gaze direction）。

### 射手 (`src/taker.js` - `Taker3D`)
- **解剖分段**：包含獨立擺臂、支撐腿 (Plant Leg)、擊球起腳腿 (Striking Leg)、背號「10」號印字。
- **助跑與射門動力學**：支援流暢助跑進逼、擺腿擊球起腳 (`strike`)、入球狂歡慶祝、射失仰天抱頭。
- **動態隊服**：根據所屬國家隊配色實時切換球衣與長襪配色。

---

## 3. 程序化足球球皮與貼圖 (`src/ball.js`)

所有足球外觀均透過 HTML5 離線 `<canvas>` 實時繪製 2:1 等距柱狀投影貼圖，動態綁定至 `THREE.CanvasTexture`：

1. **經典黑白格 (Classic Ball)**：
   - 經典五邊形六邊形嵌塊繪製，搭配微細接縫陰影。
2. **烈焰烈火 (Fire Blast Ball)**：
   - 金橙赤紅火炎漸變，附帶橙黃燃燒殘影粒子。
3. **數碼生化 (Cyber Neon Ball)**：
   - 賽博龐克霓虹青藍電路紋理，附帶青色發光軌跡拖尾。
4. **尊貴純金 (Gold Champions Ball)**：
   - 24K 金色金屬度反射與雙層鑽石光澤，專屬世界盃冠軍球飾。

---

## 4. 程序化球場光影氛圍 (`src/scene.js`)

球場光影由純 WebGL 光源及動態霧效混合計算，支援三種賽事時段氛圍：

1. **夜場泛光燈 (Night Floodlights - 預設)**：
   - 4 座高聳泛光燈塔、冷白照耀球門區，深藍夜空與聚焦草皮。
2. **黃昏日落 (Sunset Dusk)**：
   - 暖橙緋紅日落天際線、斜陽側光、金黃晚霞陰影。
3. **明媚白晝 (Daylight Pitch)**：
   - 蔚藍晴空、明亮自然日光直射、清晰綠茵場草紋。

---

## 5. 程序化合成音效 (`src/audio.js`)

利用原生 **Web Audio API** 振盪器 (`OscillatorNode`)、粉紅噪音緩衝器 (`AudioBuffer`)、雙二階濾波器 (`BiquadFilterNode`) 與動態增益壓縮生成，檔案體積為 0 KB：

- **射門擊球聲 (Kick)**：正弦波低頻下衝 (130 Hz → 30 Hz) + 爆破感噪聲點擊。
- **撲救碰球聲 (Save - Parry / Catch)**：中頻厚實撞擊聲與手套悶響。
- **撞柱中楣聲 (Post / Crossbar)**：金屬管諧波振盪 (780 Hz + 1560 Hz)，帶有自然衰減殘響。
- **網窩顫動聲 (Net Ripple)**：低通粉紅噪聲摩擦沙沙聲。
- **球證哨子聲 (Whistle)**：雙頻率調諧 (2800 Hz + 2950 Hz) 顫音。
- **全場打氣歡呼與嘆息聲 (Crowd Swell)**：多層帶通濾波噪聲，營造澎湃臨場感。

---

## 6. 世界盃參賽國家隊標識與版權

- **真實中文隊名**：香港、日本、巴西、阿根廷、英格蘭、法國、德國、西班牙、意大利、葡萄牙、荷蘭、克羅地亞、南韓、烏拉圭、摩洛哥、墨西哥。
- **無商標侵權**：所有球隊均採用標準國旗 Emoji（如 🇭🇰, 🇯🇵, 🇧🇷）及經典國家隊代表色搭配，無使用任何足協或註冊商標 Logo。
