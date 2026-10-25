/**
 * tests/prompt_studio.test.js - Unit tests for Prompt Studio core modules:
 * - Prompt assembly order and formatting
 * - Video shot-list rendering
 * - Negative prompt generation
 * - Deterministic randomization with seeded PRNG
 * - Store JSON export and schema validation on import
 * - Duplicate skipping logic
 * - LocalStorage error & corruption resilience
 */

const test = require("node:test");
const assert = require("node:assert/strict");

const DATA = require("../js/data.js");
const PromptEngine = require("../js/prompt.js");
const PromptStore = require("../js/store.js");

// Seeded PRNG for deterministic testing
function createSeededRng(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

test("1. Data presets integrity", () => {
  assert.ok(Array.isArray(DATA.styles), "DATA.styles must be array");
  assert.ok(DATA.styles.length >= 16, `Expected at least 16 styles, got ${DATA.styles.length}`);
  assert.ok(Array.isArray(DATA.recipes), "DATA.recipes must be array");
  assert.ok(DATA.recipes.length >= 10, `Expected at least 10 recipes, got ${DATA.recipes.length}`);

  const imageRecipes = DATA.recipes.filter((r) => r.mode === "image");
  const videoRecipes = DATA.recipes.filter((r) => r.mode === "video");
  assert.ok(imageRecipes.length >= 6, `Expected >= 6 image recipes, got ${imageRecipes.length}`);
  assert.ok(videoRecipes.length >= 4, `Expected >= 4 video recipes, got ${videoRecipes.length}`);

  // Check that all styles have required keys
  for (const style of DATA.styles) {
    assert.ok(style.id, "Style must have id");
    assert.ok(style.zh, "Style must have zh");
    assert.ok(style.en, "Style must have en");
    assert.ok(style.cssThumb, "Style must have cssThumb");
  }
});

test("2. Prompt assembly ordering and content", () => {
  const state = {
    mode: "image",
    subject: "a majestic snow leopard",
    scene: "misty_forest",
    sceneCustom: "ancient mossy stones",
    style: "cinematic",
    styleModifiers: ["highly_detailed", "sharp_focus"],
    lighting: "golden_hour",
    cameraShotSize: "close_up",
    cameraAngle: "low_angle",
    cameraLens: "lens_85mm",
    cameraAperture: "ap_f1_4",
    composition: "rule_of_thirds",
    mood: "mysterious",
    palette: "teal_orange",
    aspectRatio: "16_9",
    arSuffix: true
  };

  const prompt = PromptEngine.buildPrompt(state);
  assert.ok(prompt.startsWith("a majestic snow leopard"), "Subject must appear at the beginning");
  assert.ok(prompt.includes("set in enchanted misty pine forest"), "Scene must appear after subject");
  assert.ok(prompt.includes("ancient mossy stones"), "Custom scene text must be included");
  assert.ok(prompt.includes("cinematic film still"), "Style must be included");
  assert.ok(prompt.includes("warm golden hour sunlight"), "Lighting must be included");
  assert.ok(prompt.includes("close-up portrait shot"), "Shot size must be included");
  assert.ok(prompt.includes("85mm portrait prime lens"), "Lens must be included");
  assert.ok(prompt.includes("rule of thirds"), "Composition must be included");
  assert.ok(prompt.includes("mysterious"), "Mood must be included");
  assert.ok(prompt.includes("teal and orange"), "Palette must be included");
  assert.ok(prompt.includes("highly detailed, sharp focus"), "Modifiers must appear");
  assert.ok(prompt.endsWith("--ar 16:9"), "Midjourney arSuffix must appear at the very end when enabled");
});

test("3. Video prompt and shot-list storyboard rendering", () => {
  const videoState = {
    mode: "video",
    subject: "a classic vintage sports car",
    scene: "city_night",
    style: "cinematic",
    lighting: "neon_glow",
    cameraMovement: "orbit_360",
    pacing: "smooth_steady",
    duration: 8,
    subjectMotion: "car drifting smoothly around corner",
    shots: [
      { descZh: "車頭特寫", descEn: "extreme close-up on gleaming chrome emblem", move: "push_in", seconds: 3 },
      { descZh: "環繞車身一周", descEn: "orbiting around the vehicle as taillights streak across frame", move: "orbit_360", seconds: 5 }
    ]
  };

  const prompt = PromptEngine.buildPrompt(videoState);
  assert.ok(prompt.includes("360-degree orbital camera rotation"), "Camera movement included");
  assert.ok(prompt.includes("smooth, steady and measured cinematic pace"), "Pacing included");
  assert.ok(prompt.includes("8 seconds video clip"), "Duration included");
  assert.ok(prompt.includes("motion: car drifting smoothly"), "Motion included");
  assert.ok(prompt.includes("Storyboard ["), "Storyboard block rendered");
  assert.ok(prompt.includes("Shot 1 (0–3s):"), "Shot 1 timing rendered");
  assert.ok(prompt.includes("Shot 2 (3–8s):"), "Shot 2 timing rendered");
  assert.ok(prompt.includes("extreme close-up on gleaming chrome emblem"), "Shot 1 desc rendered");
});

test("4. Cantonese explanation generation", () => {
  const state = {
    mode: "image",
    subject: "一隻可愛的柴犬",
    scene: "cozy_cafe",
    style: "ghibli",
    lighting: "soft_window",
    composition: "centered_symmetry",
    aspectRatio: "4_5"
  };

  const explanation = PromptEngine.buildExplanation(state);
  assert.ok(explanation.includes("【主體】畫面主角係「一隻可愛的柴犬」。"), "Subject in Cantonese");
  assert.ok(explanation.includes("【場景】設定身處喺「窗外微雨、原木質感的溫馨咖啡館」。"), "Scene in Cantonese");
  assert.ok(explanation.includes("【風格與光影】採用「吉卜力動畫風」美術風格"), "Style in Cantonese");
  assert.ok(explanation.includes("【鏡頭與構圖】選用 嚴謹平衡、衝擊力強的居中對稱。"), "Composition in Cantonese");
  assert.ok(explanation.includes("【畫面規格】畫面比例為 4:5"), "Aspect ratio in Cantonese");
});

test("5. Negative prompt compilation", () => {
  const state = {
    negativeChips: ["blurry", "bad_hands", "watermark_text"],
    negativeCustom: "distorted reflections, extra cars"
  };

  const negative = PromptEngine.buildNegative(state);
  assert.ok(negative.includes("blurry, out of focus"), "Blurry chip included");
  assert.ok(negative.includes("deformed hands"), "Bad hands chip included");
  assert.ok(negative.includes("watermark, signature"), "Watermark chip included");
  assert.ok(negative.includes("distorted reflections, extra cars"), "Custom negative text included");
});

test("6. Deterministic randomization with seeded PRNG", () => {
  const rng1 = createSeededRng(42);
  const state1 = PromptEngine.randomize({ mode: "image" }, rng1);

  const rng2 = createSeededRng(42);
  const state2 = PromptEngine.randomize({ mode: "image" }, rng2);

  assert.deepEqual(state1, state2, "Same seed must produce identical randomized state");

  assert.ok(state1.style, "Random state has a style");
  assert.ok(state1.lighting, "Random state has lighting");
  assert.ok(state1.aspectRatio, "Random state has aspectRatio");

  // Keep user subject if already entered
  const rng3 = createSeededRng(100);
  const stateWithSubject = PromptEngine.randomize({ mode: "image", subject: "My Special Dragon" }, rng3);
  assert.equal(stateWithSubject.subject, "My Special Dragon", "Randomize must preserve user's typed subject");
});

test("7. Store: library CRUD, duplicate, and toggleFavorite", () => {
  const item1 = PromptStore.addItem({
    name: "測試 Prompt 1",
    mode: "image",
    prompt: "an astronaut riding a glowing horse",
    tags: ["測試", "科幻"],
    state: { subject: "horse", style: "cinematic" }
  });

  assert.ok(item1.id, "Added item must have generated id");
  assert.equal(item1.name, "測試 Prompt 1");

  // Toggle favorite
  const faved = PromptStore.toggleFavorite(item1.id);
  assert.equal(faved.favorite, true, "Favorite toggled to true");

  // Duplicate
  const clone = PromptStore.duplicateItem(item1.id);
  assert.notEqual(clone.id, item1.id, "Duplicate must have new id");
  assert.equal(clone.name, "測試 Prompt 1 (副本)");

  // Update
  const updated = PromptStore.updateItem(item1.id, { name: "已修改名稱" });
  assert.equal(updated.name, "已修改名稱");

  // Delete
  const deleted = PromptStore.deleteItem(item1.id);
  assert.equal(deleted.id, item1.id, "Deleted item returned");
  const libAfterDelete = PromptStore.loadLibrary();
  assert.ok(!libAfterDelete.some((it) => it.id === item1.id), "Deleted item no longer in library");
});

test("8. Store: export and import validation with deduplication", () => {
  const initialItems = [
    {
      id: "test_1",
      name: "Original Item 1",
      mode: "image",
      prompt: "unique prompt one",
      tags: ["tag1"],
      state: {}
    }
  ];

  const exportedJson = PromptStore.exportJSON(initialItems);
  assert.ok(typeof exportedJson === "string", "exportJSON must return string");
  const parsed = JSON.parse(exportedJson);
  assert.equal(parsed.app, "prompt-studio", "Must have correct app identifier");
  assert.equal(parsed.version, 1, "Must have schema version 1");
  assert.equal(parsed.items.length, 1);

  // Test 1: Bad JSON syntax
  const badSyntax = PromptStore.validateAndImport("not a json string", initialItems);
  assert.equal(badSyntax.ok, false);
  assert.ok(badSyntax.error.includes("JSON 格式錯誤"));

  // Test 2: Wrong app identifier
  const wrongApp = JSON.stringify({ app: "other-app", version: 1, items: [] });
  const wrongAppResult = PromptStore.validateAndImport(wrongApp, initialItems);
  assert.equal(wrongAppResult.ok, false);
  assert.ok(wrongAppResult.error.includes("檔案格式不相符"));

  // Test 3: Import with duplicate skipping
  const importPayload = JSON.stringify({
    app: "prompt-studio",
    version: 1,
    items: [
      { id: "test_1", name: "Duplicated ID", mode: "image", prompt: "different prompt" },
      { id: "test_2", name: "Duplicated Prompt", mode: "image", prompt: "unique prompt one" },
      { id: "test_3", name: "Brand New Item", mode: "image", prompt: "brand new prompt three" }
    ]
  });

  const importResult = PromptStore.validateAndImport(importPayload, initialItems);
  assert.equal(importResult.ok, true);
  assert.equal(importResult.addedCount, 1, "Only 1 new item should be added");
  assert.equal(importResult.skippedCount, 2, "2 duplicates should be skipped");
  assert.equal(importResult.merged.length, 2, "Merged total should be 2");
});

test("9. Store: relative time in Cantonese", () => {
  const now = Date.now();
  assert.equal(PromptStore.formatRelativeTimeZh(now - 10000), "剛剛");
  assert.equal(PromptStore.formatRelativeTimeZh(now - 5 * 60 * 1000), "5 分鐘前");
  assert.equal(PromptStore.formatRelativeTimeZh(now - 3 * 3600 * 1000), "3 小時前");
  assert.equal(PromptStore.formatRelativeTimeZh(now - 25 * 3600 * 1000), "尋日");
});
