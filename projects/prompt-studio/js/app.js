/**
 * app.js - Main interactive controller for Prompt Studio.
 * Mobile-first for iPhone Safari at 390x844.
 * Integrates data.js, prompt.js, store.js, and manages UI, PWA, and animations.
 */

(function () {
  "use strict";

  // Global app state
  let state = null;
  let undoStack = [];
  let currentEditingItemId = null; // ID if loaded from library

  // Dynamic filter state for Library
  let currentLibFilter = "all";
  let currentLibTagFilter = null;
  let currentLibSearch = "";
  let currentRecipeFilter = "all";
  let selectedRecipeForModal = null;

  // DOM Elements cache
  const el = {};

  function initElements() {
    el.app = document.getElementById("app");
    el.modeIndicator = document.getElementById("modeIndicator");
    el.btnModeImage = document.getElementById("btnModeImage");
    el.btnModeVideo = document.getElementById("btnModeVideo");
    el.btnHeaderRandom = document.getElementById("btnHeaderRandom");
    el.btnHeaderClear = document.getElementById("btnHeaderClear");

    // Tabs
    el.tabNavBtns = document.querySelectorAll(".tab-nav-btn");
    el.tabPanes = document.querySelectorAll(".tab-pane");

    // Builder Accordion & Inputs
    el.cardVideo = document.getElementById("card-video");
    el.inputSubject = document.getElementById("inputSubject");
    el.btnClearSubject = document.getElementById("btnClearSubject");
    el.containerSubjectChips = document.getElementById("containerSubjectChips");
    el.containerSceneChips = document.getElementById("containerSceneChips");
    el.inputSceneCustom = document.getElementById("inputSceneCustom");
    el.containerStyleGrid = document.getElementById("containerStyleGrid");
    el.containerStyleModifiers = document.getElementById("containerStyleModifiers");
    el.containerLightingChips = document.getElementById("containerLightingChips");
    el.containerShotSizes = document.getElementById("containerShotSizes");
    el.containerAngles = document.getElementById("containerAngles");
    el.containerLenses = document.getElementById("containerLenses");
    el.containerApertures = document.getElementById("containerApertures");
    el.containerCompositionChips = document.getElementById("containerCompositionChips");
    el.containerMoodChips = document.getElementById("containerMoodChips");
    el.containerPaletteGrid = document.getElementById("containerPaletteGrid");
    el.containerAspectGrid = document.getElementById("containerAspectGrid");
    el.checkArSuffix = document.getElementById("checkArSuffix");

    // Video only inputs
    el.containerVideoMovements = document.getElementById("containerVideoMovements");
    el.containerVideoDurations = document.getElementById("containerVideoDurations");
    el.containerVideoPacings = document.getElementById("containerVideoPacings");
    el.inputSubjectMotion = document.getElementById("inputSubjectMotion");
    el.containerShotList = document.getElementById("containerShotList");
    el.btnAddShot = document.getElementById("btnAddShot");

    // Negative prompt
    el.containerNegativeChips = document.getElementById("containerNegativeChips");
    el.inputNegativeCustom = document.getElementById("inputNegativeCustom");

    // Summaries
    el.summarySubject = document.getElementById("summary-subject");
    el.summaryScene = document.getElementById("summary-scene");
    el.summaryStyle = document.getElementById("summary-style");
    el.summaryLighting = document.getElementById("summary-lighting");
    el.summaryCamera = document.getElementById("summary-camera");
    el.summaryComposition = document.getElementById("summary-composition");
    el.summaryMood = document.getElementById("summary-mood");
    el.summaryPalette = document.getElementById("summary-palette");
    el.summaryAspect = document.getElementById("summary-aspect");
    el.summaryVideo = document.getElementById("summary-video");
    el.summaryNegative = document.getElementById("summary-negative");

    // Sticky sheet
    el.promptSheet = document.getElementById("promptSheet");
    el.sheetDragHandle = document.getElementById("sheetDragHandle");
    el.btnToggleSheet = document.getElementById("btnToggleSheet");
    el.promptCharCount = document.getElementById("promptCharCount");
    el.promptDisplay = document.getElementById("promptDisplay");
    el.explanationDisplay = document.getElementById("explanationDisplay");
    el.negativeDisplay = document.getElementById("negativeDisplay");
    el.detailsNegative = document.getElementById("detailsNegative");
    el.btnCopyPrompt = document.getElementById("btnCopyPrompt");
    el.btnCopyNegative = document.getElementById("btnCopyNegative");
    el.btnSheetCopyMain = document.getElementById("btnSheetCopyMain");
    el.btnSheetSave = document.getElementById("btnSheetSave");
    el.btnSheetSurprise = document.getElementById("btnSheetSurprise");
    el.btnSheetClear = document.getElementById("btnSheetClear");

    // Tab 2: Recipes
    el.containerRecipeFilterChips = document.getElementById("containerRecipeFilterChips");
    el.containerRecipesGrid = document.getElementById("containerRecipesGrid");

    // Tab 3: Library
    el.inputLibrarySearch = document.getElementById("inputLibrarySearch");
    el.btnClearLibrarySearch = document.getElementById("btnClearLibrarySearch");
    el.containerLibFilterChips = document.getElementById("containerLibFilterChips");
    el.containerLibTagFilters = document.getElementById("containerLibTagFilters");
    el.containerLibTagChips = document.getElementById("containerLibTagChips");
    el.containerLibraryList = document.getElementById("containerLibraryList");
    el.libEmptyState = document.getElementById("libEmptyState");
    el.btnEmptyGoBuild = document.getElementById("btnEmptyGoBuild");
    el.btnExportJSON = document.getElementById("btnExportJSON");
    el.btnImportJSON = document.getElementById("btnImportJSON");
    el.countLibAll = document.getElementById("countLibAll");
    el.countLibFav = document.getElementById("countLibFav");
    el.countLibImg = document.getElementById("countLibImg");
    el.countLibVid = document.getElementById("countLibVid");

    // Modals
    el.modalSave = document.getElementById("modalSave");
    el.inputSaveName = document.getElementById("inputSaveName");
    el.inputSaveTags = document.getElementById("inputSaveTags");
    el.btnCloseSaveModal = document.getElementById("btnCloseSaveModal");
    el.btnCancelSave = document.getElementById("btnCancelSave");
    el.btnSaveAsNew = document.getElementById("btnSaveAsNew");
    el.btnConfirmSave = document.getElementById("btnConfirmSave");

    el.modalRecipe = document.getElementById("modalRecipe");
    el.modalRecipeTitle = document.getElementById("modalRecipeTitle");
    el.modalRecipeBadge = document.getElementById("modalRecipeBadge");
    el.modalRecipeThumb = document.getElementById("modalRecipeThumb");
    el.modalRecipeDesc = document.getElementById("modalRecipeDesc");
    el.modalRecipePromptText = document.getElementById("modalRecipePromptText");
    el.btnCloseRecipeModal = document.getElementById("btnCloseRecipeModal");
    el.btnCancelRecipe = document.getElementById("btnCancelRecipe");
    el.btnApplyRecipe = document.getElementById("btnApplyRecipe");

    el.modalImport = document.getElementById("modalImport");
    el.fileImportInput = document.getElementById("fileImportInput");
    el.textareaImportJSON = document.getElementById("textareaImportJSON");
    el.importErrorMsg = document.getElementById("importErrorMsg");
    el.btnCloseImportModal = document.getElementById("btnCloseImportModal");
    el.btnCancelImport = document.getElementById("btnCancelImport");
    el.btnConfirmImport = document.getElementById("btnConfirmImport");

    el.toastContainer = document.getElementById("toastContainer");
  }

  // ================= UTILITIES =================

  function escapeHtml(str) {
    if (typeof str !== "string") return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function showModal(modalEl) {
    if (!modalEl) return;
    modalEl.setAttribute("aria-hidden", "false");
    modalEl.style.display = "flex";
  }

  function hideModal(modalEl) {
    if (!modalEl) return;
    modalEl.setAttribute("aria-hidden", "true");
    modalEl.style.display = "none";
  }

  function makeAccessibleButton(element, onClick) {
    element.setAttribute("role", "button");
    element.setAttribute("tabindex", "0");
    element.addEventListener("click", onClick);
    element.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick(e);
      }
    });
  }

  function isBuilderDirty() {
    if (currentEditingItemId) return true;
    const def = window.PromptEngine.getDefaultState(state.mode);
    if (state.subject && state.subject !== def.subject) return true;
    if (state.scene !== def.scene) return true;
    if (state.sceneCustom && state.sceneCustom.trim()) return true;
    if (state.style !== def.style) return true;
    if (state.lighting !== def.lighting) return true;
    if (state.cameraShotSize !== def.cameraShotSize) return true;
    if (state.composition !== def.composition) return true;
    if (state.mood !== def.mood) return true;
    if (state.palette !== def.palette) return true;
    if (Array.isArray(state.styleModifiers) && state.styleModifiers.length > (def.styleModifiers || []).length) return true;
    if (Array.isArray(state.negativeChips) && state.negativeChips.length !== (def.negativeChips || []).length) return true;
    if (state.mode === "video" && Array.isArray(state.shots) && state.shots.length > 0) return true;
    return false;
  }

  // ================= PUSH STATE TO UNDO =================
  function pushUndo() {
    undoStack.push(JSON.parse(JSON.stringify(state)));
    if (undoStack.length > 20) undoStack.shift();
  }

  function popUndo() {
    if (undoStack.length === 0) return null;
    return undoStack.pop();
  }

  // ================= TOAST NOTIFICATION SYSTEM =================
  function showToast(message, actionText, actionCallback) {
    if (!el.toastContainer) return;
    const toast = document.createElement("div");
    toast.className = "toast" + (actionText ? " toast-undo" : "");

    const textSpan = document.createElement("span");
    textSpan.textContent = message;
    toast.appendChild(textSpan);

    if (actionText && typeof actionCallback === "function") {
      const actionBtn = document.createElement("button");
      actionBtn.type = "button";
      actionBtn.className = "btn-toast-undo";
      actionBtn.textContent = actionText;
      actionBtn.addEventListener("click", () => {
        actionCallback();
        toast.remove();
      });
      toast.appendChild(actionBtn);
    }

    el.toastContainer.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(-10px)";
        toast.style.transition = "all 0.2s ease";
        setTimeout(() => toast.remove(), 200);
      }
    }, actionText ? 5000 : 2500);
  }

  // ================= CLIPBOARD COPY WITH FALLBACK =================
  function copyToClipboard(text, successMessage = "已複製 ✓") {
    if (!text) {
      showToast("內容為空，未能複製");
      return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        () => showToast(successMessage),
        () => fallbackCopy(text, successMessage)
      );
    } else {
      fallbackCopy(text, successMessage);
    }
  }

  function fallbackCopy(text, successMessage) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "0";
    ta.style.left = "0";
    ta.style.width = "1px";
    ta.style.height = "1px";
    ta.style.padding = "0";
    ta.style.border = "none";
    ta.style.outline = "none";
    ta.style.boxShadow = "none";
    ta.style.background = "transparent";
    ta.style.opacity = "0.01";
    document.body.appendChild(ta);
    ta.focus();
    ta.setSelectionRange(0, text.length);
    try {
      const successful = document.execCommand("copy");
      if (successful) {
        showToast(successMessage);
      } else {
        showToast("複製失敗，請手動選取複製");
      }
    } catch (err) {
      showToast("複製失敗，請手動選取複製");
    }
    document.body.removeChild(ta);
  }

  // ================= RENDER BUILDER PRESETS =================

  function renderPresets() {
    const DATA = window.PROMPT_DATA;

    // 1. Subject category chips
    el.containerSubjectChips.innerHTML = "";
    DATA.subjectCategories.forEach((cat) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip";
      chip.dataset.subCat = cat.id;
      chip.setAttribute("aria-pressed", "false");
      chip.innerHTML = `${cat.zh} <span class="chip-sub">(${cat.en})</span>`;
      chip.addEventListener("click", () => {
        pushUndo();
        state.subjectCategory = state.subjectCategory === cat.id ? null : cat.id;
        if (state.subjectCategory) {
          // Put clean English sample in subject & subjectEn, Cantonese in subjectZh
          state.subject = cat.sampleEn;
          state.subjectEn = cat.sampleEn;
          state.subjectZh = cat.sampleZh;
          el.inputSubject.value = cat.sampleEn;
          el.btnClearSubject.style.display = "flex";
        }
        updateUI();
      });
      el.containerSubjectChips.appendChild(chip);
    });

    // 2. Scene chips
    el.containerSceneChips.innerHTML = "";
    DATA.scenes.forEach((sc) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip";
      chip.dataset.sceneId = sc.id;
      chip.setAttribute("aria-pressed", "false");
      chip.innerHTML = `${sc.zh}`;
      chip.addEventListener("click", () => {
        pushUndo();
        state.scene = state.scene === sc.id ? null : sc.id;
        updateUI();
      });
      el.containerSceneChips.appendChild(chip);
    });

    // 3. Style visual swatch cards (16+ visual cards)
    el.containerStyleGrid.innerHTML = "";
    DATA.styles.forEach((st) => {
      const card = document.createElement("div");
      card.className = "style-card";
      card.dataset.styleId = st.id;
      card.innerHTML = `
        <div class="style-card-thumb" style="background: ${st.cssThumb};"></div>
        <div class="style-card-info">
          <span class="style-card-title">${st.zh}</span>
          <span class="style-card-hint">${st.hintEn}</span>
        </div>
      `;
      makeAccessibleButton(card, () => {
        pushUndo();
        state.style = st.id;
        updateUI();
      });
      el.containerStyleGrid.appendChild(card);
    });

    // Style modifiers chips
    el.containerStyleModifiers.innerHTML = "";
    DATA.styleModifiers.forEach((m) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip";
      chip.dataset.modId = m.id;
      chip.setAttribute("aria-pressed", "false");
      chip.textContent = m.zh;
      chip.addEventListener("click", () => {
        pushUndo();
        if (!Array.isArray(state.styleModifiers)) state.styleModifiers = [];
        const idx = state.styleModifiers.indexOf(m.id);
        if (idx >= 0) {
          state.styleModifiers.splice(idx, 1);
        } else {
          state.styleModifiers.push(m.id);
        }
        updateUI();
      });
      el.containerStyleModifiers.appendChild(chip);
    });

    // 4. Lighting chips
    el.containerLightingChips.innerHTML = "";
    DATA.lightings.forEach((lt) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip";
      chip.dataset.lightId = lt.id;
      chip.setAttribute("aria-pressed", "false");
      chip.textContent = lt.zh;
      chip.addEventListener("click", () => {
        pushUndo();
        state.lighting = state.lighting === lt.id ? null : lt.id;
        updateUI();
      });
      el.containerLightingChips.appendChild(chip);
    });

    // 5. Camera sub-groups
    renderCameraGroup(el.containerShotSizes, DATA.cameras.shotSizes, "cameraShotSize");
    renderCameraGroup(el.containerAngles, DATA.cameras.angles, "cameraAngle");
    renderCameraGroup(el.containerLenses, DATA.cameras.lenses, "cameraLens");
    renderCameraGroup(el.containerApertures, DATA.cameras.apertures, "cameraAperture");

    // 6. Composition chips
    el.containerCompositionChips.innerHTML = "";
    DATA.compositions.forEach((comp) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip";
      chip.dataset.compId = comp.id;
      chip.setAttribute("aria-pressed", "false");
      chip.textContent = comp.zh;
      chip.addEventListener("click", () => {
        pushUndo();
        state.composition = state.composition === comp.id ? null : comp.id;
        updateUI();
      });
      el.containerCompositionChips.appendChild(chip);
    });

    // 7. Mood chips
    el.containerMoodChips.innerHTML = "";
    DATA.moods.forEach((m) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip";
      chip.dataset.moodId = m.id;
      chip.setAttribute("aria-pressed", "false");
      chip.textContent = m.zh;
      chip.addEventListener("click", () => {
        pushUndo();
        state.mood = state.mood === m.id ? null : m.id;
        updateUI();
      });
      el.containerMoodChips.appendChild(chip);
    });

    // 8. Palette grid
    el.containerPaletteGrid.innerHTML = "";
    DATA.palettes.forEach((pal) => {
      const card = document.createElement("div");
      card.className = "palette-card";
      card.dataset.paletteId = pal.id;

      const dotsHtml = pal.colors
        .map((c) => `<span class="palette-dot" style="background:${c};"></span>`)
        .join("");

      card.innerHTML = `
        <div class="palette-dots">${dotsHtml}</div>
        <span class="palette-name">${pal.zh}</span>
      `;
      makeAccessibleButton(card, () => {
        pushUndo();
        state.palette = state.palette === pal.id ? null : pal.id;
        updateUI();
      });
      el.containerPaletteGrid.appendChild(card);
    });

    // 9. Aspect Ratio grid
    el.containerAspectGrid.innerHTML = "";
    DATA.aspectRatios.forEach((ar) => {
      const chip = document.createElement("div");
      chip.className = "ar-chip";
      chip.dataset.arId = ar.id;
      chip.innerHTML = `
        <span class="ar-label">${ar.label}</span>
        <span class="ar-desc">${ar.descZh}</span>
      `;
      makeAccessibleButton(chip, () => {
        pushUndo();
        state.aspectRatio = ar.id;
        updateUI();
      });
      el.containerAspectGrid.appendChild(chip);
    });

    // 10. Video options
    el.containerVideoMovements.innerHTML = "";
    DATA.videoOptions.movements.forEach((mv) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip";
      chip.dataset.vidMove = mv.id;
      chip.setAttribute("aria-pressed", "false");
      chip.textContent = mv.zh;
      chip.addEventListener("click", () => {
        pushUndo();
        state.cameraMovement = mv.id;
        updateUI();
      });
      el.containerVideoMovements.appendChild(chip);
    });

    el.containerVideoDurations.innerHTML = "";
    DATA.videoOptions.durations.forEach((d) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip";
      chip.dataset.vidDuration = String(d.seconds);
      chip.setAttribute("aria-pressed", "false");
      chip.textContent = d.label;
      chip.addEventListener("click", () => {
        pushUndo();
        state.duration = d.seconds;
        updateUI();
      });
      el.containerVideoDurations.appendChild(chip);
    });

    el.containerVideoPacings.innerHTML = "";
    DATA.videoOptions.pacings.forEach((pc) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip";
      chip.dataset.vidPacing = pc.id;
      chip.setAttribute("aria-pressed", "false");
      chip.textContent = pc.zh;
      chip.addEventListener("click", () => {
        pushUndo();
        state.pacing = pc.id;
        updateUI();
      });
      el.containerVideoPacings.appendChild(chip);
    });

    // 11. Negative prompt chips
    renderNegativeChips();
  }

  function renderCameraGroup(container, items, stateKey) {
    container.innerHTML = "";
    items.forEach((item) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip";
      chip.dataset.id = item.id;
      chip.setAttribute("aria-pressed", "false");
      chip.textContent = item.zh;
      chip.addEventListener("click", () => {
        pushUndo();
        state[stateKey] = state[stateKey] === item.id ? null : item.id;
        updateUI();
      });
      container.appendChild(chip);
    });
  }

  function renderNegativeChips() {
    const DATA = window.PROMPT_DATA;
    el.containerNegativeChips.innerHTML = "";
    const list = state.mode === "video"
      ? [...DATA.negativeDefaults.image, ...DATA.negativeDefaults.videoExtra]
      : DATA.negativeDefaults.image;

    list.forEach((neg) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip";
      chip.dataset.negId = neg.id;
      chip.setAttribute("aria-pressed", "false");
      chip.textContent = neg.zh;
      chip.addEventListener("click", () => {
        pushUndo();
        if (!Array.isArray(state.negativeChips)) state.negativeChips = [];
        const idx = state.negativeChips.indexOf(neg.id);
        if (idx >= 0) {
          state.negativeChips.splice(idx, 1);
        } else {
          state.negativeChips.push(neg.id);
        }
        updateUI();
      });
      el.containerNegativeChips.appendChild(chip);
    });
  }

  // ================= STORYBOARD SHOT LIST =================

  function renderShotList() {
    const DATA = window.PROMPT_DATA;
    el.containerShotList.innerHTML = "";

    if (!Array.isArray(state.shots) || state.shots.length === 0) {
      el.containerShotList.innerHTML = `<div class="text-muted" style="font-size:14px;padding:12px;text-align:center;">暫無分鏡，撳下方「＋ 新增鏡頭」規劃故事板</div>`;
      return;
    }

    let runningSec = 0;
    state.shots.forEach((shot, index) => {
      const sSec = Number(shot.seconds) || 3;
      const start = runningSec;
      const end = start + sSec;
      runningSec = end;

      const card = document.createElement("div");
      card.className = "shot-card";

      // Options for movements
      let moveOptions = DATA.videoOptions.movements
        .map((m) => `<option value="${m.id}" ${m.id === shot.move ? "selected" : ""}>${m.zh}</option>`)
        .join("");

      // Seconds options
      let secOptions = [2, 3, 4, 5, 8]
        .map((s) => `<option value="${s}" ${s === sSec ? "selected" : ""}>${s} 秒</option>`)
        .join("");

      card.innerHTML = `
        <div class="shot-card-header">
          <span class="shot-timing-badge">Shot ${index + 1} (${start}–${end}秒)</span>
          <div class="shot-card-actions">
            <button type="button" class="btn-shot-action btn-move-up" data-idx="${index}" title="上移" aria-label="上移鏡頭" ${index === 0 ? "disabled style='opacity:0.3'" : ""}>▲</button>
            <button type="button" class="btn-shot-action btn-move-down" data-idx="${index}" title="下移" aria-label="下移鏡頭" ${index === state.shots.length - 1 ? "disabled style='opacity:0.3'" : ""}>▼</button>
            <button type="button" class="btn-shot-action btn-shot-del" data-idx="${index}" title="刪除鏡頭" aria-label="刪除鏡頭">✕</button>
          </div>
        </div>
        <div class="shot-card-inputs">
          <select class="shot-move-select" data-idx="${index}">${moveOptions}</select>
          <select class="shot-sec-select" data-idx="${index}">${secOptions}</select>
        </div>
      `;

      // Create input element safely to avoid HTML injection
      const descInput = document.createElement("input");
      descInput.type = "text";
      descInput.className = "shot-desc-input";
      descInput.dataset.idx = String(index);
      descInput.value = shot.descZh || shot.descEn || "";
      descInput.placeholder = "描述此鏡頭畫面（如：主角推開咖啡店門、特寫手部動作）...";
      card.appendChild(descInput);

      el.containerShotList.appendChild(card);
    });

    // Wire events
    el.containerShotList.querySelectorAll(".btn-move-up").forEach((b) => {
      b.addEventListener("click", () => {
        const idx = Number(b.dataset.idx);
        if (idx > 0) {
          pushUndo();
          const temp = state.shots[idx];
          state.shots[idx] = state.shots[idx - 1];
          state.shots[idx - 1] = temp;
          updateUI();
        }
      });
    });

    el.containerShotList.querySelectorAll(".btn-move-down").forEach((b) => {
      b.addEventListener("click", () => {
        const idx = Number(b.dataset.idx);
        if (idx < state.shots.length - 1) {
          pushUndo();
          const temp = state.shots[idx];
          state.shots[idx] = state.shots[idx + 1];
          state.shots[idx + 1] = temp;
          updateUI();
        }
      });
    });

    el.containerShotList.querySelectorAll(".btn-shot-del").forEach((b) => {
      b.addEventListener("click", () => {
        const idx = Number(b.dataset.idx);
        pushUndo();
        state.shots.splice(idx, 1);
        updateUI();
      });
    });

    el.containerShotList.querySelectorAll(".shot-move-select").forEach((s) => {
      s.addEventListener("change", () => {
        const idx = Number(s.dataset.idx);
        state.shots[idx].move = s.value;
        updateUI();
      });
    });

    el.containerShotList.querySelectorAll(".shot-sec-select").forEach((s) => {
      s.addEventListener("change", () => {
        const idx = Number(s.dataset.idx);
        state.shots[idx].seconds = Number(s.value);
        updateUI();
      });
    });

    el.containerShotList.querySelectorAll(".shot-desc-input").forEach((inp) => {
      inp.addEventListener("input", () => {
        const idx = Number(inp.dataset.idx);
        state.shots[idx].descZh = inp.value;
        state.shots[idx].descEn = inp.value;
        syncLivePromptOnly();
      });
    });
  }

  // ================= UPDATE UI SYNC =================

  function updateUI() {
    state = window.PromptEngine.sanitizeState(state);
    const DATA = window.PROMPT_DATA;
    const isVideo = state.mode === "video";

    // Mode Toggle Sync
    el.modeIndicator.textContent = isVideo ? "影片模式" : "圖片模式";
    el.btnModeImage.classList.toggle("active", !isVideo);
    el.btnModeImage.setAttribute("aria-pressed", !isVideo ? "true" : "false");
    el.btnModeVideo.classList.toggle("active", isVideo);
    el.btnModeVideo.setAttribute("aria-pressed", isVideo ? "true" : "false");

    el.cardVideo.style.display = isVideo ? "block" : "none";

    // Input values
    el.inputSubject.value = state.subject || "";
    el.btnClearSubject.style.display = state.subject ? "flex" : "none";
    el.inputSceneCustom.value = state.sceneCustom || "";
    el.checkArSuffix.checked = Boolean(state.arSuffix);
    if (isVideo) {
      el.inputSubjectMotion.value = state.subjectMotion || "";
    }
    el.inputNegativeCustom.value = state.negativeCustom || "";

    // Sync active classes and aria-pressed
    syncChipActive(el.containerSubjectChips, "subCat", state.subjectCategory);
    syncChipActive(el.containerSceneChips, "sceneId", state.scene);

    // Style active
    document.querySelectorAll(".style-card").forEach((card) => {
      const isAct = card.dataset.styleId === state.style;
      card.classList.toggle("active", isAct);
      card.setAttribute("aria-pressed", isAct ? "true" : "false");
    });

    // Style modifiers
    document.querySelectorAll("#containerStyleModifiers .chip").forEach((chip) => {
      const isAct = (state.styleModifiers || []).includes(chip.dataset.modId);
      chip.classList.toggle("active", isAct);
      chip.setAttribute("aria-pressed", isAct ? "true" : "false");
    });

    // Lighting
    syncChipActive(el.containerLightingChips, "lightId", state.lighting);

    // Camera
    syncChipActive(el.containerShotSizes, "id", state.cameraShotSize);
    syncChipActive(el.containerAngles, "id", state.cameraAngle);
    syncChipActive(el.containerLenses, "id", state.cameraLens);
    syncChipActive(el.containerApertures, "id", state.cameraAperture);

    // Composition & Mood
    syncChipActive(el.containerCompositionChips, "compId", state.composition);
    syncChipActive(el.containerMoodChips, "moodId", state.mood);

    // Palette
    document.querySelectorAll(".palette-card").forEach((c) => {
      const isAct = c.dataset.paletteId === state.palette;
      c.classList.toggle("active", isAct);
      c.setAttribute("aria-pressed", isAct ? "true" : "false");
    });

    // Aspect
    document.querySelectorAll(".ar-chip").forEach((c) => {
      const isAct = c.dataset.arId === state.aspectRatio;
      c.classList.toggle("active", isAct);
      c.setAttribute("aria-pressed", isAct ? "true" : "false");
    });

    // Video options
    if (isVideo) {
      syncChipActive(el.containerVideoMovements, "vidMove", state.cameraMovement);
      syncChipActive(el.containerVideoDurations, "vidDuration", String(state.duration));
      syncChipActive(el.containerVideoPacings, "vidPacing", state.pacing);
      renderShotList();
    }

    // Negative chips
    document.querySelectorAll("#containerNegativeChips .chip").forEach((chip) => {
      const isAct = (state.negativeChips || []).includes(chip.dataset.negId);
      chip.classList.toggle("active", isAct);
      chip.setAttribute("aria-pressed", isAct ? "true" : "false");
    });

    // Summaries on accordion headers
    updateSummaries();

    // Live Prompt & Explanation Sync
    syncLivePromptOnly();

    // Autosave draft
    window.PromptStore.saveDraft(state);
  }

  function syncChipActive(container, dataAttr, targetValue) {
    if (!container) return;
    container.querySelectorAll(".chip").forEach((chip) => {
      const val = chip.dataset[dataAttr];
      const isActive = val === String(targetValue);
      chip.classList.toggle("active", isActive);
      chip.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  function updateSummaries() {
    const DATA = window.PROMPT_DATA;

    // Subject
    if (state.subject && state.subject.trim()) {
      el.summarySubject.textContent = state.subject.trim();
    } else if (state.subjectCategory) {
      const cat = DATA.subjectCategories.find((c) => c.id === state.subjectCategory);
      el.summarySubject.textContent = cat ? cat.zh : "未設定主體";
    } else {
      el.summarySubject.textContent = "未設定主體";
    }

    // Scene
    const sc = DATA.scenes.find((s) => s.id === state.scene);
    el.summaryScene.textContent = sc ? sc.zh : (state.sceneCustom || "未揀場景");

    // Style
    const sty = DATA.styles.find((s) => s.id === state.style);
    el.summaryStyle.textContent = sty ? sty.zh : "預設風格";

    // Lighting
    const lt = DATA.lightings.find((l) => l.id === state.lighting);
    el.summaryLighting.textContent = lt ? lt.zh : "自然光";

    // Camera
    const ss = DATA.cameras.shotSizes.find((s) => s.id === state.cameraShotSize);
    const ca = DATA.cameras.angles.find((a) => a.id === state.cameraAngle);
    const cl = DATA.cameras.lenses.find((l) => l.id === state.cameraLens);
    const camSummary = [ss?.zh, ca?.zh, cl?.zh].filter(Boolean).join(" · ");
    el.summaryCamera.textContent = camSummary || "標準視角";

    // Composition
    const comp = DATA.compositions.find((c) => c.id === state.composition);
    el.summaryComposition.textContent = comp ? comp.zh : "自然構圖";

    // Mood
    const md = DATA.moods.find((m) => m.id === state.mood);
    el.summaryMood.textContent = md ? md.zh : "自然氛圍";

    // Palette
    const pal = DATA.palettes.find((p) => p.id === state.palette);
    el.summaryPalette.textContent = pal ? pal.zh : "自然色系";

    // Aspect
    const ar = DATA.aspectRatios.find((a) => a.id === state.aspectRatio);
    el.summaryAspect.textContent = ar ? `${ar.label}（${ar.descZh}）` : "16:9";

    // Video
    if (state.mode === "video") {
      const vm = DATA.videoOptions.movements.find((m) => m.id === state.cameraMovement);
      const vp = DATA.videoOptions.pacings.find((p) => p.id === state.pacing);
      el.summaryVideo.textContent = `${vm ? vm.zh : "固定"} · ${state.duration}秒 · ${vp ? vp.zh : "流暢"}`;
    }

    // Negative
    el.summaryNegative.textContent = `已啟用 ${(state.negativeChips || []).length} 項過濾`;
  }

  function syncLivePromptOnly() {
    const promptText = window.PromptEngine.buildPrompt(state);
    const explanationText = window.PromptEngine.buildExplanation(state);
    const negativeText = window.PromptEngine.buildNegative(state);

    el.promptDisplay.textContent = promptText || "（請於上方選擇主體、風格或場景以生成 Prompt...）";
    el.promptCharCount.textContent = `${promptText.length} 字`;

    el.explanationDisplay.textContent = explanationText;

    if (negativeText) {
      el.detailsNegative.hidden = false;
      el.negativeDisplay.textContent = negativeText;
    } else {
      el.detailsNegative.hidden = true;
    }

    // Subtle highlight pulse
    el.promptDisplay.classList.remove("pulse");
    void el.promptDisplay.offsetWidth; // Trigger reflow
    el.promptDisplay.classList.add("pulse");
  }

  // ================= TAB NAVIGATION =================

  function setupTabs() {
    el.tabNavBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const tabId = btn.dataset.tab;
        switchTab(tabId);
      });
    });

    el.btnEmptyGoBuild.addEventListener("click", () => {
      switchTab("tab-build");
    });
  }

  function switchTab(tabId) {
    if (el.app) {
      el.app.dataset.activeTab = tabId;
    }

    el.tabNavBtns.forEach((b) => {
      const active = b.dataset.tab === tabId;
      b.classList.toggle("active", active);
      b.setAttribute("aria-selected", active ? "true" : "false");
    });

    el.tabPanes.forEach((p) => {
      p.classList.toggle("active", p.id === tabId);
    });

    // P0 #1: Only show the live prompt composer sheet on the Builder tab
    if (el.promptSheet) {
      el.promptSheet.style.display = tabId === "tab-build" ? "flex" : "none";
    }

    if (tabId === "tab-recipes") {
      renderRecipesTab();
    } else if (tabId === "tab-library") {
      renderLibraryTab();
    }
  }

  // ================= TAB 2: RECIPES =================

  function setupRecipesTab() {
    el.containerRecipeFilterChips.querySelectorAll(".chip").forEach((btn) => {
      btn.addEventListener("click", () => {
        el.containerRecipeFilterChips.querySelectorAll(".chip").forEach((c) => {
          c.classList.remove("active");
          c.setAttribute("aria-pressed", "false");
        });
        btn.classList.add("active");
        btn.setAttribute("aria-pressed", "true");
        currentRecipeFilter = btn.dataset.recipeFilter;
        renderRecipesTab();
      });
    });
  }

  function renderRecipesTab() {
    const DATA = window.PROMPT_DATA;
    el.containerRecipesGrid.innerHTML = "";

    const filtered = DATA.recipes.filter((rec) => {
      if (currentRecipeFilter === "all") return true;
      if (currentRecipeFilter === "image") return rec.mode === "image";
      if (currentRecipeFilter === "video") return rec.mode === "video";
      if (currentRecipeFilter === "cinematic") return (rec.tags || []).includes("電影感") || (rec.tags || []).includes("航拍");
      if (currentRecipeFilter === "anime") return (rec.tags || []).includes("吉卜力") || (rec.tags || []).includes("東方美學");
      return true;
    });

    filtered.forEach((rec) => {
      const card = document.createElement("div");
      card.className = "recipe-card";

      const tagsHtml = (rec.tags || [])
        .map((t) => `<span class="recipe-tag-pill">#${escapeHtml(t)}</span>`)
        .join("");

      card.innerHTML = `
        <div class="recipe-thumb-banner" style="background: ${rec.thumbGradient};">
          <span class="recipe-mode-tag">${rec.mode === "video" ? "🎬 影片運鏡" : "🖼️ 圖片"}</span>
        </div>
        <div class="recipe-card-body">
          <h3 class="recipe-card-title">${escapeHtml(rec.titleZh)}</h3>
          <p class="recipe-card-desc">${escapeHtml(rec.descZh)}</p>
          <div class="recipe-tags-row">${tagsHtml}</div>
          <button type="button" class="btn-use-recipe">🔥 用呢個配方</button>
        </div>
      `;

      card.querySelector(".btn-use-recipe").addEventListener("click", (e) => {
        e.stopPropagation();
        openRecipeDetailModal(rec);
      });

      card.addEventListener("click", () => {
        openRecipeDetailModal(rec);
      });

      el.containerRecipesGrid.appendChild(card);
    });
  }

  function openRecipeDetailModal(recipe) {
    selectedRecipeForModal = recipe;
    el.modalRecipeTitle.textContent = recipe.titleZh;
    el.modalRecipeBadge.textContent = recipe.mode === "video" ? "🎬 影片配方" : "🖼️ 圖片配方";
    el.modalRecipeThumb.style.background = recipe.thumbGradient;
    el.modalRecipeDesc.textContent = recipe.descZh;

    const samplePrompt = window.PromptEngine.buildPrompt(recipe.state);
    el.modalRecipePromptText.textContent = samplePrompt;

    showModal(el.modalRecipe);
  }

  function applySelectedRecipe() {
    if (!selectedRecipeForModal) return;

    if (isBuilderDirty()) {
      const confirmed = window.confirm("而家嘅創作尚未儲存，確定用呢個配方覆蓋？");
      if (!confirmed) return;
    }

    pushUndo();

    // Deep clone & sanitize recipe state
    state = window.PromptEngine.sanitizeState(selectedRecipeForModal.state);
    currentEditingItemId = null;

    updateUI();
    hideModal(el.modalRecipe);
    switchTab("tab-build");
    showToast(`已載入靈感配方：${selectedRecipeForModal.titleZh}`);
  }

  // ================= TAB 3: LIBRARY =================

  function setupLibraryTab() {
    el.inputLibrarySearch.addEventListener("input", () => {
      currentLibSearch = el.inputLibrarySearch.value.trim().toLowerCase();
      el.btnClearLibrarySearch.style.display = currentLibSearch ? "block" : "none";
      renderLibraryTab();
    });

    el.btnClearLibrarySearch.addEventListener("click", () => {
      el.inputLibrarySearch.value = "";
      currentLibSearch = "";
      el.btnClearLibrarySearch.style.display = "none";
      renderLibraryTab();
    });

    el.containerLibFilterChips.querySelectorAll(".chip").forEach((btn) => {
      btn.addEventListener("click", () => {
        el.containerLibFilterChips.querySelectorAll(".chip").forEach((c) => {
          c.classList.remove("active");
          c.setAttribute("aria-pressed", "false");
        });
        btn.classList.add("active");
        btn.setAttribute("aria-pressed", "true");
        currentLibFilter = btn.dataset.libFilter;
        renderLibraryTab();
      });
    });

    el.btnExportJSON.addEventListener("click", handleExportJSON);
    el.btnImportJSON.addEventListener("click", () => {
      el.importErrorMsg.style.display = "none";
      el.textareaImportJSON.value = "";
      el.fileImportInput.value = "";
      showModal(el.modalImport);
    });
  }

  function renderLibraryTab() {
    const library = window.PromptStore.loadLibrary();

    // Update counts
    el.countLibAll.textContent = library.length;
    el.countLibFav.textContent = library.filter((it) => it.favorite).length;
    el.countLibImg.textContent = library.filter((it) => it.mode === "image").length;
    el.countLibVid.textContent = library.filter((it) => it.mode === "video").length;

    // Filter by type
    let filtered = library.filter((it) => {
      if (currentLibFilter === "favorite") return it.favorite;
      if (currentLibFilter === "image") return it.mode === "image";
      if (currentLibFilter === "video") return it.mode === "video";
      return true;
    });

    // Filter by tag if selected
    if (currentLibTagFilter) {
      filtered = filtered.filter((it) => Array.isArray(it.tags) && it.tags.includes(currentLibTagFilter));
    }

    // Search
    if (currentLibSearch) {
      filtered = filtered.filter((it) => {
        const text = `${it.name} ${it.prompt} ${(it.tags || []).join(" ")}`.toLowerCase();
        return text.includes(currentLibSearch);
      });
    }

    // Dynamic tag filter chips
    const allTags = Array.from(new Set(library.flatMap((it) => it.tags || []))).filter(Boolean);
    if (el.containerLibTagFilters && el.containerLibTagChips) {
      if (allTags.length > 0) {
        el.containerLibTagFilters.style.display = "block";
        el.containerLibTagChips.innerHTML = "";

        // All tags chip
        const allChip = document.createElement("button");
        allChip.type = "button";
        allChip.className = "chip" + (!currentLibTagFilter ? " active" : "");
        allChip.setAttribute("aria-pressed", !currentLibTagFilter ? "true" : "false");
        allChip.textContent = "所有標籤";
        allChip.addEventListener("click", () => {
          currentLibTagFilter = null;
          renderLibraryTab();
        });
        el.containerLibTagChips.appendChild(allChip);

        allTags.forEach((t) => {
          const tagChip = document.createElement("button");
          tagChip.type = "button";
          const isActive = currentLibTagFilter === t;
          tagChip.className = "chip" + (isActive ? " active" : "");
          tagChip.setAttribute("aria-pressed", isActive ? "true" : "false");
          tagChip.textContent = `#${t}`;
          tagChip.addEventListener("click", () => {
            currentLibTagFilter = currentLibTagFilter === t ? null : t;
            renderLibraryTab();
          });
          el.containerLibTagChips.appendChild(tagChip);
        });
      } else {
        el.containerLibTagFilters.style.display = "none";
      }
    }

    el.containerLibraryList.innerHTML = "";

    if (filtered.length === 0) {
      el.libEmptyState.style.display = "flex";
      return;
    } else {
      el.libEmptyState.style.display = "none";
    }

    filtered.forEach((item) => {
      const card = document.createElement("div");
      card.className = "lib-card";

      const tagsHtml = (item.tags || [])
        .map((t) => `<span class="lib-tag-pill">#${escapeHtml(t)}</span>`)
        .join("");

      const relTime = window.PromptStore.formatRelativeTimeZh(item.updatedAt || item.createdAt);

      card.innerHTML = `
        <div class="lib-card-header">
          <div class="lib-card-title-group">
            <span class="lib-mode-badge">${item.mode === "video" ? "🎬 影片" : "🖼️ 圖片"}</span>
            <span class="lib-card-name">${escapeHtml(item.name)}</span>
          </div>
          <div class="lib-card-header-actions">
            <span class="lib-card-time">${escapeHtml(relTime)}</span>
            <button type="button" class="btn-lib-fav ${item.favorite ? "active" : ""}" data-id="${item.id}" title="最愛">★</button>
          </div>
        </div>
        <div class="lib-card-prompt-snippet">${escapeHtml(item.prompt || "（無提示詞內容）")}</div>
        ${tagsHtml ? `<div class="lib-card-tags">${tagsHtml}</div>` : ""}
        <div class="lib-card-actions">
          <button type="button" class="btn-lib-action-sm primary btn-lib-load" data-id="${item.id}">載入編輯</button>
          <button type="button" class="btn-lib-action-sm btn-lib-copy" data-id="${item.id}">複製</button>
          <button type="button" class="btn-lib-action-sm btn-lib-dup" data-id="${item.id}">副本</button>
          <button type="button" class="btn-lib-action-sm danger btn-lib-del" data-id="${item.id}">刪除</button>
        </div>
      `;

      // Wire item events
      card.querySelector(".btn-lib-fav").addEventListener("click", () => {
        window.PromptStore.toggleFavorite(item.id);
        renderLibraryTab();
      });

      card.querySelector(".btn-lib-load").addEventListener("click", () => {
        pushUndo();
        state = window.PromptEngine.sanitizeState(item.state);
        currentEditingItemId = item.id;
        updateUI();
        switchTab("tab-build");
        showToast(`已載入「${item.name}」進行編輯`);
      });

      card.querySelector(".btn-lib-copy").addEventListener("click", () => {
        copyToClipboard(item.prompt, `已複製「${item.name}」Prompt ✓`);
      });

      card.querySelector(".btn-lib-dup").addEventListener("click", () => {
        const dup = window.PromptStore.duplicateItem(item.id);
        if (!dup) {
          showToast("複製副本失敗，儲存空間可能已滿");
          return;
        }
        renderLibraryTab();
        showToast(`已複製副本：${item.name} (副本)`);
      });

      card.querySelector(".btn-lib-del").addEventListener("click", () => {
        const confirmed = window.confirm(`確定要刪除「${item.name}」？`);
        if (!confirmed) return;
        const deleted = window.PromptStore.deleteItem(item.id);
        renderLibraryTab();
        showToast(`已刪除「${item.name}」`, "復原", () => {
          if (deleted) {
            window.PromptStore.addItem(deleted);
            renderLibraryTab();
          }
        });
      });

      el.containerLibraryList.appendChild(card);
    });
  }

  function handleExportJSON() {
    const library = window.PromptStore.loadLibrary();
    if (library.length === 0) {
      showToast("提示詞庫暫無項目可匯出");
      return;
    }

    const jsonStr = window.PromptStore.exportJSON(library);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prompt-studio-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Also copy to clipboard for iOS convenience
    copyToClipboard(jsonStr, "已下載並複製 JSON 到剪貼簿 ✓");
  }

  function handleConfirmImport() {
    let jsonText = el.textareaImportJSON.value.trim();

    const doImport = (content) => {
      const res = window.PromptStore.validateAndImport(content);
      if (!res.ok) {
        el.importErrorMsg.textContent = res.error || "匯入失敗";
        el.importErrorMsg.style.display = "block";
        return;
      }

      hideModal(el.modalImport);
      renderLibraryTab();
      showToast(`匯入成功：新增 ${res.addedCount} 個，略過 ${res.skippedCount} 個重複項目`);
    };

    if (el.fileImportInput.files && el.fileImportInput.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => doImport(e.target.result);
      reader.onerror = () => {
        el.importErrorMsg.textContent = "讀取檔案失敗";
        el.importErrorMsg.style.display = "block";
      };
      reader.readAsText(el.fileImportInput.files[0]);
    } else if (jsonText) {
      doImport(jsonText);
    } else {
      el.importErrorMsg.textContent = "請選擇檔案或貼上 JSON 內容";
      el.importErrorMsg.style.display = "block";
    }
  }

  // ================= SAVE TO LIBRARY MODAL =================

  function openSaveModal() {
    let defaultName = state.subject ? state.subject.slice(0, 16) : "";
    if (!defaultName) {
      const sty = window.PROMPT_DATA.styles.find((s) => s.id === state.style);
      defaultName = sty ? `${sty.zh}作品` : "我的創作";
    }

    el.inputSaveName.value = defaultName;
    el.inputSaveTags.value = state.mode === "video" ? "影片" : "圖片";

    if (currentEditingItemId) {
      if (el.btnSaveAsNew) el.btnSaveAsNew.style.display = "inline-flex";
      el.btnConfirmSave.textContent = "更新現有項目";
    } else {
      if (el.btnSaveAsNew) el.btnSaveAsNew.style.display = "none";
      el.btnConfirmSave.textContent = "確認儲存";
    }

    showModal(el.modalSave);
  }

  function handleConfirmSave(options = {}) {
    const asNew = options.asNew === true;
    const name = el.inputSaveName.value.trim() || "未命名 Prompt";
    const tags = el.inputSaveTags.value
      .split(/[,，\s]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    const promptText = window.PromptEngine.buildPrompt(state);
    const explanationText = window.PromptEngine.buildExplanation(state);
    const negativeText = window.PromptEngine.buildNegative(state);

    if (currentEditingItemId && !asNew) {
      const updated = window.PromptStore.updateItem(currentEditingItemId, {
        name,
        tags,
        mode: state.mode,
        prompt: promptText,
        explanation: explanationText,
        negative: negativeText,
        state: JSON.parse(JSON.stringify(state))
      });
      if (!updated) {
        showToast("儲存失敗，空間可能已滿，請試下刪除舊項目或匯出備份");
        return;
      }
      showToast(`已更新「${name}」至庫 ✓`);
    } else {
      const newItem = window.PromptStore.addItem({
        name,
        tags,
        mode: state.mode,
        prompt: promptText,
        explanation: explanationText,
        negative: negativeText,
        state: JSON.parse(JSON.stringify(state))
      });
      if (!newItem) {
        showToast("儲存失敗，空間可能已滿，請試下刪除舊項目或匯出備份");
        return;
      }
      currentEditingItemId = newItem.id;
      showToast(asNew ? `已另存為新項目「${name}」至庫 ✓` : `已儲存「${name}」至庫 ✓`);
    }

    hideModal(el.modalSave);
    if (document.getElementById("tab-library").classList.contains("active")) {
      renderLibraryTab();
    }
  }

  // ================= VISUAL VIEWPORT (IOS KEYBOARD TRACKING) =================
  function setupVisualViewport() {
    if (typeof window === "undefined" || !window.visualViewport) return;

    const onViewportChange = () => {
      const vv = window.visualViewport;
      const keyboardHeight = window.innerHeight - vv.height - vv.offsetTop;
      const isKeyboardOpen = keyboardHeight > 100;
      document.body.classList.toggle("keyboard-open", isKeyboardOpen);
    };

    window.visualViewport.addEventListener("resize", onViewportChange);
    window.visualViewport.addEventListener("scroll", onViewportChange);
  }

  // ================= EVENT BINDINGS =================

  function setupEvents() {
    // Mode toggles
    el.btnModeImage.addEventListener("click", () => {
      if (state.mode !== "image") {
        pushUndo();
        state.mode = "image";
        renderNegativeChips();
        updateUI();
      }
    });

    el.btnModeVideo.addEventListener("click", () => {
      if (state.mode !== "video") {
        pushUndo();
        state.mode = "video";
        renderNegativeChips();
        updateUI();
      }
    });

    // Header actions
    el.btnHeaderRandom.addEventListener("click", () => {
      pushUndo();
      state = window.PromptEngine.randomize(state);
      updateUI();
      showToast("已隨機生成靈感 🎲", "復原", () => {
        const prev = popUndo();
        if (prev) {
          state = prev;
          updateUI();
        }
      });
    });

    el.btnHeaderClear.addEventListener("click", () => {
      pushUndo();
      state = window.PromptEngine.getDefaultState(state.mode);
      currentEditingItemId = null;
      updateUI();
      showToast("已清空所有選項", "復原", () => {
        const prev = popUndo();
        if (prev) {
          state = prev;
          updateUI();
        }
      });
    });

    // Accordion headers
    document.querySelectorAll(".accordion-header").forEach((header) => {
      header.addEventListener("click", (e) => {
        if (e.target.closest(".btn-section-dice")) return;
        const card = header.closest(".accordion-card");
        const isCollapsed = card.classList.toggle("collapsed");
        header.setAttribute("aria-expanded", !isCollapsed);
      });
    });

    // Accordion section dice random buttons
    document.querySelectorAll(".btn-section-dice").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const diceKey = btn.dataset.dice;
        pushUndo();
        state = window.PromptEngine.randomizeSection(state, diceKey);
        updateUI();
        showToast("已隨機此區塊 🎲");
      });
    });

    // Subject inputs
    el.inputSubject.addEventListener("input", () => {
      state.subject = el.inputSubject.value;
      state.subjectEn = el.inputSubject.value;
      el.btnClearSubject.style.display = state.subject ? "flex" : "none";
      syncLivePromptOnly();
      updateSummaries();
      window.PromptStore.saveDraft(state);
    });

    el.btnClearSubject.addEventListener("click", () => {
      pushUndo();
      state.subject = "";
      state.subjectEn = "";
      state.subjectZh = "";
      el.inputSubject.value = "";
      el.btnClearSubject.style.display = "none";
      updateUI();
    });

    // Custom Scene
    el.inputSceneCustom.addEventListener("input", () => {
      state.sceneCustom = el.inputSceneCustom.value;
      syncLivePromptOnly();
      updateSummaries();
      window.PromptStore.saveDraft(state);
    });

    // Aspect ratio suffix checkbox
    el.checkArSuffix.addEventListener("change", () => {
      state.arSuffix = el.checkArSuffix.checked;
      syncLivePromptOnly();
      window.PromptStore.saveDraft(state);
    });

    // Subject motion
    el.inputSubjectMotion.addEventListener("input", () => {
      state.subjectMotion = el.inputSubjectMotion.value;
      syncLivePromptOnly();
      window.PromptStore.saveDraft(state);
    });

    // Negative custom
    el.inputNegativeCustom.addEventListener("input", () => {
      state.negativeCustom = el.inputNegativeCustom.value;
      syncLivePromptOnly();
      window.PromptStore.saveDraft(state);
    });

    // Add Shot Button
    el.btnAddShot.addEventListener("click", () => {
      if (!Array.isArray(state.shots)) state.shots = [];
      if (state.shots.length >= 6) {
        showToast("分鏡故事板最多支援 6 個鏡頭");
        return;
      }
      pushUndo();
      state.shots.push({
        descZh: "",
        descEn: "",
        move: "push_in",
        seconds: 3
      });
      updateUI();
    });

    // Sticky sheet controls
    function setSheetExpanded(open) {
      el.promptSheet.classList.toggle("expanded", open);
      document.body.classList.toggle("sheet-expanded", open);
      el.sheetDragHandle.setAttribute("aria-expanded", String(open));
      el.btnToggleSheet.setAttribute("aria-expanded", String(open));
      if (!open) el.sheetBody.scrollTop = 0;
    }
    function toggleSheet() {
      setSheetExpanded(!el.promptSheet.classList.contains("expanded"));
    }
    el.sheetBody = el.sheetBody || document.getElementById("sheetBody");
    el.sheetDragHandle.addEventListener("click", toggleSheet);
    el.btnToggleSheet.addEventListener("click", toggleSheet);
    // Tapping the collapsed prompt preview expands it
    el.promptDisplay.addEventListener("click", () => {
      if (!el.promptSheet.classList.contains("expanded")) setSheetExpanded(true);
    });
    // Swipe up / down on the handle (or the collapsed sheet) to expand / collapse
    let swipeStartY = null, swipeFromBodyTop = false;
    el.promptSheet.addEventListener("touchstart", (e) => {
      if (e.touches.length !== 1) return;
      const onHandle = el.sheetDragHandle.contains(e.target);
      const expanded = el.promptSheet.classList.contains("expanded");
      // In expanded mode only the handle/header starts a swipe, so the body can scroll
      if (expanded && !onHandle && !e.target.closest(".sheet-header")) { swipeStartY = null; return; }
      swipeStartY = e.touches[0].clientY;
    }, { passive: true });
    el.promptSheet.addEventListener("touchend", (e) => {
      if (swipeStartY === null) return;
      const dy = e.changedTouches[0].clientY - swipeStartY;
      swipeStartY = null;
      if (dy < -30) setSheetExpanded(true);
      else if (dy > 30) setSheetExpanded(false);
    }, { passive: true });

    // Sheet copy buttons
    el.btnCopyPrompt.addEventListener("click", () => {
      const p = window.PromptEngine.buildPrompt(state);
      const neg = window.PromptEngine.buildNegative(state);
      const fullCopy = neg ? `${p}\n\nNegative prompt: ${neg}` : p;
      copyToClipboard(fullCopy, "已複製 Prompt ✓");
    });

    el.btnSheetCopyMain.addEventListener("click", () => {
      const p = window.PromptEngine.buildPrompt(state);
      const neg = window.PromptEngine.buildNegative(state);
      const fullCopy = neg ? `${p}\n\nNegative prompt: ${neg}` : p;
      copyToClipboard(fullCopy, "已複製 Prompt ✓");
    });

    el.btnCopyNegative.addEventListener("click", () => {
      const neg = window.PromptEngine.buildNegative(state);
      copyToClipboard(neg, "已複製負面提示詞 ✓");
    });

    el.btnSheetSave.addEventListener("click", openSaveModal);
    el.btnSheetSurprise.addEventListener("click", () => el.btnHeaderRandom.click());
    if (el.btnSheetClear) {
      el.btnSheetClear.addEventListener("click", () => el.btnHeaderClear.click());
    }

    // Save Modal
    el.btnCloseSaveModal.addEventListener("click", () => hideModal(el.modalSave));
    el.btnCancelSave.addEventListener("click", () => hideModal(el.modalSave));
    if (el.btnSaveAsNew) {
      el.btnSaveAsNew.addEventListener("click", () => handleConfirmSave({ asNew: true }));
    }
    el.btnConfirmSave.addEventListener("click", () => handleConfirmSave({ asNew: false }));

    document.querySelectorAll(".btn-quick-tag").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tag = btn.dataset.tag;
        const cur = el.inputSaveTags.value.trim();
        if (!cur.includes(tag)) {
          el.inputSaveTags.value = cur ? `${cur}, ${tag}` : tag;
        }
      });
    });

    // Recipe Modal
    el.btnCloseRecipeModal.addEventListener("click", () => hideModal(el.modalRecipe));
    el.btnCancelRecipe.addEventListener("click", () => hideModal(el.modalRecipe));
    el.btnApplyRecipe.addEventListener("click", applySelectedRecipe);

    // Import Modal
    el.btnCloseImportModal.addEventListener("click", () => hideModal(el.modalImport));
    el.btnCancelImport.addEventListener("click", () => hideModal(el.modalImport));
    el.btnConfirmImport.addEventListener("click", handleConfirmImport);

    // Close modal on backdrop click
    document.querySelectorAll(".modal-backdrop").forEach((backdrop) => {
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) hideModal(backdrop);
      });
    });
  }

  // ================= SERVICE WORKER REGISTRATION =================
  function registerServiceWorker() {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    // Skip registration if running from file:// protocol
    if (window.location.protocol === "file:") {
      console.log("[PWA] Service Worker skipped on file:// protocol.");
      return;
    }

    navigator.serviceWorker
      .register("./sw.js")
      .then((reg) => {
        console.log("[PWA] Service Worker registered successfully:", reg.scope);
      })
      .catch((err) => {
        console.warn("[PWA] Service Worker registration failed (normal under non-HTTPS):", err);
      });
  }

  // ================= APP INITIALIZATION =================
  function initApp() {
    initElements();

    // Load draft or default, always sanitized
    const savedDraft = window.PromptStore.loadDraft();
    if (savedDraft && typeof savedDraft === "object") {
      state = window.PromptEngine.sanitizeState(savedDraft);
    } else {
      state = window.PromptEngine.getDefaultState("image");
    }

    renderPresets();
    setupTabs();
    setupRecipesTab();
    setupLibraryTab();
    setupEvents();
    setupVisualViewport();
    updateUI();

    registerServiceWorker();
    console.log("[Prompt Studio] App initialized successfully.");
  }

  // Start on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
  } else {
    initApp();
  }
})();
