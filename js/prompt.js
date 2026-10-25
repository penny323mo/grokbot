/**
 * prompt.js - Pure functions for prompt assembly, Cantonese explanation, negative prompts,
 * and deterministic randomization.
 * Supports both Browser and Node.js.
 */

(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) {
    const data = require("./data.js");
    module.exports = factory(data);
  } else {
    root.PromptEngine = factory(root.PROMPT_DATA);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (DATA) {
  "use strict";

  if (!DATA) {
    throw new Error("PROMPT_DATA is required by prompt.js");
  }

  /**
   * Helper to find item by id in array
   */
  function findById(list, id) {
    if (!list || !id) return null;
    return list.find((item) => item.id === id) || null;
  }

  /**
   * Returns a fresh, complete default builder state
   */
  function getDefaultState(mode = "image") {
    return {
      mode: mode === "video" ? "video" : "image",
      subject: "",
      subjectCategory: null,
      scene: null,
      sceneCustom: "",
      style: "cinematic",
      styleModifiers: ["highly_detailed", "sharp_focus"],
      lighting: "golden_hour",
      cameraShotSize: "medium_shot",
      cameraAngle: "eye_level",
      cameraLens: "lens_35mm",
      cameraAperture: "ap_f1_8",
      composition: "rule_of_thirds",
      mood: "dreamy",
      palette: "teal_orange",
      aspectRatio: "16_9",
      arSuffix: false,
      negativeChips: ["blurry", "low_res", "bad_hands", "watermark_text"],
      negativeCustom: "",
      // Video-only
      cameraMovement: "push_in",
      duration: 5,
      pacing: "smooth_steady",
      subjectMotion: "",
      shots: []
    };
  }

  /**
   * Assemble the main English prompt string in natural, structured order:
   * Subject -> Scene -> Style -> Lighting -> Camera/Lens -> Composition -> Mood -> Palette ->
   * (Video: Movement -> Pacing -> Duration -> Motion -> Shot List) -> Modifiers -> Suffix
   */
  function buildPrompt(state) {
    if (!state) return "";
    const parts = [];

    // 1. Subject
    let subjectText = (state.subject || "").trim();
    if (!subjectText && state.subjectCategory) {
      const cat = findById(DATA.subjectCategories, state.subjectCategory);
      if (cat && cat.sampleEn) {
        subjectText = cat.sampleEn;
      }
    }
    if (subjectText) {
      parts.push(subjectText);
    }

    // 2. Scene / Setting
    const sceneParts = [];
    if (state.scene) {
      const sc = findById(DATA.scenes, state.scene);
      if (sc && sc.en) sceneParts.push(sc.en);
    }
    if (state.sceneCustom && state.sceneCustom.trim()) {
      sceneParts.push(state.sceneCustom.trim());
    }
    if (sceneParts.length > 0) {
      parts.push(`set in ${sceneParts.join(", ")}`);
    }

    // 3. Style
    if (state.style) {
      const sty = findById(DATA.styles, state.style);
      if (sty && sty.en) parts.push(sty.en);
    }

    // 4. Lighting
    if (state.lighting) {
      const lt = findById(DATA.lightings, state.lighting);
      if (lt && lt.en) parts.push(lt.en);
    }

    // 5. Camera & Lens
    const camParts = [];
    if (state.cameraShotSize) {
      const ss = findById(DATA.cameras.shotSizes, state.cameraShotSize);
      if (ss && ss.en) camParts.push(ss.en);
    }
    if (state.cameraAngle) {
      const ca = findById(DATA.cameras.angles, state.cameraAngle);
      if (ca && ca.en) camParts.push(ca.en);
    }
    if (state.cameraLens) {
      const cl = findById(DATA.cameras.lenses, state.cameraLens);
      if (cl && cl.en) camParts.push(cl.en);
    }
    if (state.cameraAperture) {
      const ap = findById(DATA.cameras.apertures, state.cameraAperture);
      if (ap && ap.en) camParts.push(ap.en);
    }
    if (camParts.length > 0) {
      parts.push(camParts.join(", "));
    }

    // 6. Composition
    if (state.composition) {
      const comp = findById(DATA.compositions, state.composition);
      if (comp && comp.en) parts.push(comp.en);
    }

    // 7. Mood
    if (state.mood) {
      const md = findById(DATA.moods, state.mood);
      if (md && md.en) parts.push(md.en);
    }

    // 8. Palette
    if (state.palette) {
      const pal = findById(DATA.palettes, state.palette);
      if (pal && pal.en) parts.push(pal.en);
    }

    // 9. Video specific additions
    if (state.mode === "video") {
      const vidParts = [];
      if (state.cameraMovement) {
        const mv = findById(DATA.videoOptions.movements, state.cameraMovement);
        if (mv && mv.en) vidParts.push(mv.en);
      }
      if (state.pacing) {
        const pc = findById(DATA.videoOptions.pacings, state.pacing);
        if (pc && pc.en) vidParts.push(pc.en);
      }
      if (state.duration) {
        vidParts.push(`${state.duration} seconds video clip`);
      }
      if (state.subjectMotion && state.subjectMotion.trim()) {
        vidParts.push(`motion: ${state.subjectMotion.trim()}`);
      }
      if (vidParts.length > 0) {
        parts.push(vidParts.join(", "));
      }

      // Shot List Storyboard
      if (Array.isArray(state.shots) && state.shots.length > 0) {
        let runningSec = 0;
        const renderedShots = state.shots.map((shot, idx) => {
          const shotSec = Number(shot.seconds) || 3;
          const startSec = runningSec;
          const endSec = startSec + shotSec;
          runningSec = endSec;

          const moveObj = findById(DATA.videoOptions.movements, shot.move);
          const moveEn = moveObj ? moveObj.en.split(",")[0].trim() : "";
          const desc = shot.descEn || shot.descZh || "";

          let shotText = `Shot ${idx + 1} (${startSec}–${endSec}s): `;
          if (moveEn && desc) {
            shotText += `${moveEn}, ${desc}`;
          } else if (moveEn) {
            shotText += moveEn;
          } else {
            shotText += desc;
          }
          return shotText.trim();
        });

        parts.push(`Storyboard [${renderedShots.join(". ")}]`);
      }
    }

    // 10. Modifiers
    if (Array.isArray(state.styleModifiers) && state.styleModifiers.length > 0) {
      const modEnList = state.styleModifiers
        .map((mId) => {
          const mod = findById(DATA.styleModifiers, mId);
          return mod ? mod.en : null;
        })
        .filter(Boolean);
      if (modEnList.length > 0) {
        parts.push(modEnList.join(", "));
      }
    }

    // Clean up commas and joins
    let result = parts
      .map((p) => p.trim().replace(/^[,.\s]+|[,.\s]+$/g, ""))
      .filter((p) => p.length > 0)
      .join(", ");

    // 11. Midjourney parameter suffix (optional)
    if (state.arSuffix && state.aspectRatio) {
      const arObj = findById(DATA.aspectRatios, state.aspectRatio);
      if (arObj && arObj.param) {
        result += ` ${arObj.param}`;
      }
    }

    return result;
  }

  /**
   * Build readable Cantonese explanation sentence-by-sentence
   */
  function buildExplanation(state) {
    if (!state) return "";
    const sentences = [];

    // Mode
    const isVideo = state.mode === "video";

    // 1. Subject
    if (state.subject && state.subject.trim()) {
      sentences.push(`【主體】畫面主角係「${state.subject.trim()}」。`);
    } else if (state.subjectCategory) {
      const cat = findById(DATA.subjectCategories, state.subjectCategory);
      if (cat) {
        sentences.push(`【主體】以「${cat.zh}」為核心題材（如：${cat.sampleZh}）。`);
      }
    } else {
      sentences.push(`【主體】尚未輸入特定主體，將由模型自由發揮。`);
    }

    // 2. Scene
    let sceneDesc = "";
    if (state.scene) {
      const sc = findById(DATA.scenes, state.scene);
      if (sc) sceneDesc += sc.snippetZh || sc.zh;
    }
    if (state.sceneCustom && state.sceneCustom.trim()) {
      sceneDesc += (sceneDesc ? "，配合 " : "") + state.sceneCustom.trim();
    }
    if (sceneDesc) {
      sentences.push(`【場景】設定身處喺「${sceneDesc}」。`);
    }

    // 3. Style & Lighting
    const styleObj = findById(DATA.styles, state.style);
    const lightObj = findById(DATA.lightings, state.lighting);
    let styleLightText = "【風格與光影】";
    if (styleObj) {
      styleLightText += `採用「${styleObj.zh}」美術風格（${styleObj.descZh || ""}）`;
    }
    if (lightObj) {
      styleLightText += `${styleObj ? "，並以" : "採用"}「${lightObj.snippetZh || lightObj.zh}」營造光影`;
    }
    styleLightText += "。";
    if (styleObj || lightObj) {
      sentences.push(styleLightText);
    }

    // 4. Camera, Lens, Composition
    const camItems = [];
    if (state.cameraShotSize) {
      const ss = findById(DATA.cameras.shotSizes, state.cameraShotSize);
      if (ss) camItems.push(ss.snippetZh || ss.zh);
    }
    if (state.cameraAngle) {
      const ca = findById(DATA.cameras.angles, state.cameraAngle);
      if (ca) camItems.push(ca.snippetZh || ca.zh);
    }
    if (state.cameraLens) {
      const cl = findById(DATA.cameras.lenses, state.cameraLens);
      if (cl) camItems.push(cl.snippetZh || cl.zh);
    }
    if (state.cameraAperture) {
      const ap = findById(DATA.cameras.apertures, state.cameraAperture);
      if (ap) camItems.push(ap.snippetZh || ap.zh);
    }
    if (state.composition) {
      const comp = findById(DATA.compositions, state.composition);
      if (comp) camItems.push(comp.snippetZh || comp.zh);
    }
    if (camItems.length > 0) {
      sentences.push(`【鏡頭與構圖】選用 ${camItems.join("、")}。`);
    }

    // 5. Mood & Palette
    const moodObj = findById(DATA.moods, state.mood);
    const palObj = findById(DATA.palettes, state.palette);
    if (moodObj || palObj) {
      let mpText = "【氛圍色調】";
      if (moodObj) mpText += `整體呈現「${moodObj.snippetZh || moodObj.zh}」情緒`;
      if (palObj) mpText += `${moodObj ? "，色彩基調為" : "色彩基調為"}「${palObj.snippetZh || palObj.zh}」`;
      mpText += "。";
      sentences.push(mpText);
    }

    // 6. Video details
    if (isVideo) {
      const vidDetails = [];
      if (state.cameraMovement) {
        const mv = findById(DATA.videoOptions.movements, state.cameraMovement);
        if (mv) vidDetails.push(`鏡頭「${mv.snippetZh || mv.zh}」`);
      }
      if (state.pacing) {
        const pc = findById(DATA.videoOptions.pacings, state.pacing);
        if (pc) vidDetails.push(`節奏「${pc.snippetZh || pc.zh}」`);
      }
      if (state.duration) {
        vidDetails.push(`片長約 ${state.duration} 秒`);
      }
      if (state.subjectMotion && state.subjectMotion.trim()) {
        vidDetails.push(`動作「${state.subjectMotion.trim()}」`);
      }
      if (vidDetails.length > 0) {
        sentences.push(`【影片運鏡】${vidDetails.join("，")}。`);
      }

      if (Array.isArray(state.shots) && state.shots.length > 0) {
        let shotSeq = "【分鏡故事板】包含 " + state.shots.length + " 個鏡頭：\n";
        let rSec = 0;
        state.shots.forEach((s, i) => {
          const sSec = Number(s.seconds) || 3;
          const start = rSec;
          const end = start + sSec;
          rSec = end;
          const mv = findById(DATA.videoOptions.movements, s.move);
          const mvName = mv ? mv.zh : "";
          const desc = s.descZh || s.descEn || "";
          shotSeq += `  • Shot ${i + 1} (${start}–${end}秒)：${mvName ? `[${mvName}] ` : ""}${desc}\n`;
        });
        sentences.push(shotSeq.trimEnd());
      }
    }

    // 7. Modifiers & Aspect Ratio
    const arObj = findById(DATA.aspectRatios, state.aspectRatio);
    const arText = arObj ? `${arObj.label}（${arObj.descZh}）` : "";
    if (arText) {
      sentences.push(`【畫面規格】畫面比例為 ${arText}。`);
    }

    return sentences.join("\n");
  }

  /**
   * Build negative prompt string
   */
  function buildNegative(state) {
    if (!state) return "";
    const items = [];

    // Chip mappings
    if (Array.isArray(state.negativeChips) && state.negativeChips.length > 0) {
      const allNegDefaults = [
        ...DATA.negativeDefaults.image,
        ...DATA.negativeDefaults.videoExtra
      ];
      state.negativeChips.forEach((id) => {
        const neg = findById(allNegDefaults, id);
        if (neg && neg.en) {
          items.push(neg.en);
        }
      });
    }

    // Custom text
    if (state.negativeCustom && state.negativeCustom.trim()) {
      items.push(state.negativeCustom.trim());
    }

    return items
      .map((item) => item.trim().replace(/^[,.\s]+|[,.\s]+$/g, ""))
      .filter((item) => item.length > 0)
      .join(", ");
  }

  /**
   * Deterministic random helper using provided PRNG
   */
  function sampleArray(arr, rng) {
    if (!arr || arr.length === 0) return null;
    const idx = Math.floor(rng() * arr.length);
    return arr[idx];
  }

  function sampleSubset(arr, count, rng) {
    if (!arr || arr.length === 0) return [];
    const shuffled = [...arr].sort(() => rng() - 0.5);
    return shuffled.slice(0, Math.min(count, arr.length));
  }

  /**
   * Surprise Me - Randomizes a coherent prompt state.
   * If subject is already filled by user, preserves it.
   */
  function randomize(currentState = {}, rng = Math.random) {
    const isVideo = currentState.mode === "video";
    const newState = { ...currentState };

    // Subject: if empty, pick a sample subject from a random category
    if (!newState.subject || !newState.subject.trim()) {
      const cat = sampleArray(DATA.subjectCategories, rng);
      if (cat) {
        newState.subjectCategory = cat.id;
        newState.subject = cat.sampleZh;
      }
    }

    // Scene
    const scene = sampleArray(DATA.scenes, rng);
    newState.scene = scene ? scene.id : null;
    newState.sceneCustom = "";

    // Style
    const style = sampleArray(DATA.styles, rng);
    newState.style = style ? style.id : "cinematic";

    // Modifiers (1 to 3)
    const modCount = 1 + Math.floor(rng() * 3);
    const sampledMods = sampleSubset(DATA.styleModifiers, modCount, rng);
    newState.styleModifiers = sampledMods.map((m) => m.id);

    // Lighting
    const lighting = sampleArray(DATA.lightings, rng);
    newState.lighting = lighting ? lighting.id : null;

    // Camera
    const shotSize = sampleArray(DATA.cameras.shotSizes, rng);
    newState.cameraShotSize = shotSize ? shotSize.id : null;

    const angle = sampleArray(DATA.cameras.angles, rng);
    newState.cameraAngle = angle ? angle.id : null;

    const lens = sampleArray(DATA.cameras.lenses, rng);
    newState.cameraLens = lens ? lens.id : null;

    const aperture = sampleArray(DATA.cameras.apertures, rng);
    newState.cameraAperture = aperture ? aperture.id : null;

    // Composition
    const composition = sampleArray(DATA.compositions, rng);
    newState.composition = composition ? composition.id : null;

    // Mood
    const mood = sampleArray(DATA.moods, rng);
    newState.mood = mood ? mood.id : null;

    // Palette
    const palette = sampleArray(DATA.palettes, rng);
    newState.palette = palette ? palette.id : null;

    // Aspect Ratio
    const ar = sampleArray(DATA.aspectRatios, rng);
    newState.aspectRatio = ar ? ar.id : "16_9";

    // Video specific
    if (isVideo) {
      const move = sampleArray(DATA.videoOptions.movements, rng);
      newState.cameraMovement = move ? move.id : "push_in";

      const pacing = sampleArray(DATA.videoOptions.pacings, rng);
      newState.pacing = pacing ? pacing.id : "smooth_steady";

      const duration = sampleArray(DATA.videoOptions.durations, rng);
      newState.duration = duration ? duration.seconds : 5;

      newState.subjectMotion = "natural fluid cinematic movement";

      // 2 coherent shots
      const shotTemplates = DATA.videoOptions.shotTemplates;
      newState.shots = shotTemplates.slice(0, 2).map((st) => ({
        descZh: st.descZh,
        descEn: st.descEn,
        move: st.move,
        seconds: st.duration
      }));
    }

    return newState;
  }

  /**
   * Randomize single section
   */
  function randomizeSection(state, sectionKey, rng = Math.random) {
    const updated = { ...state };
    switch (sectionKey) {
      case "subject": {
        const cat = sampleArray(DATA.subjectCategories, rng);
        if (cat) {
          updated.subjectCategory = cat.id;
          updated.subject = cat.sampleZh;
        }
        break;
      }
      case "scene": {
        const sc = sampleArray(DATA.scenes, rng);
        updated.scene = sc ? sc.id : null;
        break;
      }
      case "style": {
        const sty = sampleArray(DATA.styles, rng);
        updated.style = sty ? sty.id : "cinematic";
        break;
      }
      case "lighting": {
        const lt = sampleArray(DATA.lightings, rng);
        updated.lighting = lt ? lt.id : null;
        break;
      }
      case "camera": {
        const ss = sampleArray(DATA.cameras.shotSizes, rng);
        const ca = sampleArray(DATA.cameras.angles, rng);
        const cl = sampleArray(DATA.cameras.lenses, rng);
        const ap = sampleArray(DATA.cameras.apertures, rng);
        updated.cameraShotSize = ss ? ss.id : null;
        updated.cameraAngle = ca ? ca.id : null;
        updated.cameraLens = cl ? cl.id : null;
        updated.cameraAperture = ap ? ap.id : null;
        break;
      }
      case "composition": {
        const cp = sampleArray(DATA.compositions, rng);
        updated.composition = cp ? cp.id : null;
        break;
      }
      case "mood": {
        const md = sampleArray(DATA.moods, rng);
        updated.mood = md ? md.id : null;
        break;
      }
      case "palette": {
        const pl = sampleArray(DATA.palettes, rng);
        updated.palette = pl ? pl.id : null;
        break;
      }
      case "aspectRatio": {
        const ar = sampleArray(DATA.aspectRatios, rng);
        updated.aspectRatio = ar ? ar.id : "16_9";
        break;
      }
      case "videoMovement": {
        const vm = sampleArray(DATA.videoOptions.movements, rng);
        updated.cameraMovement = vm ? vm.id : "push_in";
        break;
      }
      default:
        break;
    }
    return updated;
  }

  return {
    getDefaultState,
    buildPrompt,
    buildExplanation,
    buildNegative,
    randomize,
    randomizeSection
  };
});
