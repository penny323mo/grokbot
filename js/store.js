/**
 * store.js - LocalStorage management, draft persistence, import/export schema validator,
 * and duplicate deduplication.
 * Supports both Browser and Node.js environments.
 */

(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = factory();
  } else {
    root.PromptStore = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const STORAGE_KEY_LIB = "prompt_studio_library";
  const STORAGE_KEY_DRAFT = "prompt_studio_draft";
  const APP_IDENTIFIER = "prompt-studio";
  const CURRENT_SCHEMA_VERSION = 1;

  // In-memory fallback if localStorage is missing or throws (e.g. Node or private browsing)
  const memoryStorage = {};

  function getStorage() {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        // Test accessibility
        const testKey = "__ps_test__";
        window.localStorage.setItem(testKey, "1");
        window.localStorage.removeItem(testKey);
        return window.localStorage;
      }
    } catch (e) {
      // Fallback to memoryStorage
    }
    return {
      getItem(key) {
        return Object.prototype.hasOwnProperty.call(memoryStorage, key)
          ? memoryStorage[key]
          : null;
      },
      setItem(key, value) {
        memoryStorage[key] = String(value);
      },
      removeItem(key) {
        delete memoryStorage[key];
      },
      clear() {
        for (const k in memoryStorage) delete memoryStorage[k];
      }
    };
  }

  function generateId() {
    return "ps_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 8);
  }

  /**
   * Load entire library from storage
   * Robust against corrupted JSON or quota errors
   */
  function loadLibrary() {
    const storage = getStorage();
    try {
      const raw = storage.getItem(STORAGE_KEY_LIB);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn("[PromptStore] Corrupted library in localStorage, returning empty:", err);
      return [];
    }
  }

  /**
   * Save entire library
   */
  function saveLibrary(items) {
    if (!Array.isArray(items)) return false;
    const storage = getStorage();
    try {
      storage.setItem(STORAGE_KEY_LIB, JSON.stringify(items));
      return true;
    } catch (err) {
      console.error("[PromptStore] Failed to save library to storage (quota exceeded?):", err);
      return false;
    }
  }

  /**
   * Add a new item to library
   */
  function addItem(itemData) {
    const library = loadLibrary();
    const now = Date.now();
    const newItem = {
      id: itemData.id || generateId(),
      name: (itemData.name || "").trim() || "未命名 Prompt",
      mode: itemData.mode === "video" ? "video" : "image",
      tags: Array.isArray(itemData.tags) ? itemData.tags : [],
      favorite: Boolean(itemData.favorite),
      prompt: itemData.prompt || "",
      negative: itemData.negative || "",
      explanation: itemData.explanation || "",
      state: itemData.state ? JSON.parse(JSON.stringify(itemData.state)) : {},
      createdAt: itemData.createdAt || now,
      updatedAt: now
    };

    library.unshift(newItem);
    saveLibrary(library);
    return newItem;
  }

  /**
   * Update an existing item by ID
   */
  function updateItem(id, updates) {
    const library = loadLibrary();
    const index = library.findIndex((item) => item.id === id);
    if (index === -1) return null;

    const existing = library[index];
    const updated = {
      ...existing,
      ...updates,
      updatedAt: Date.now()
    };
    if (updates.state) {
      updated.state = JSON.parse(JSON.stringify(updates.state));
    }

    library[index] = updated;
    saveLibrary(library);
    return updated;
  }

  /**
   * Delete an item by ID (returns deleted item for undo support)
   */
  function deleteItem(id) {
    const library = loadLibrary();
    const index = library.findIndex((item) => item.id === id);
    if (index === -1) return null;

    const [deleted] = library.splice(index, 1);
    saveLibrary(library);
    return deleted;
  }

  /**
   * Toggle favorite
   */
  function toggleFavorite(id) {
    const library = loadLibrary();
    const item = library.find((it) => it.id === id);
    if (!item) return null;
    item.favorite = !item.favorite;
    item.updatedAt = Date.now();
    saveLibrary(library);
    return item;
  }

  /**
   * Duplicate an item
   */
  function duplicateItem(id) {
    const library = loadLibrary();
    const original = library.find((it) => it.id === id);
    if (!original) return null;

    const clone = {
      ...JSON.parse(JSON.stringify(original)),
      id: generateId(),
      name: `${original.name} (副本)`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    library.unshift(clone);
    saveLibrary(library);
    return clone;
  }

  /**
   * Load autosaved draft
   */
  function loadDraft() {
    const storage = getStorage();
    try {
      const raw = storage.getItem(STORAGE_KEY_DRAFT);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn("[PromptStore] Failed to parse draft, returning null:", e);
      return null;
    }
  }

  /**
   * Save draft
   */
  function saveDraft(state) {
    if (!state) return false;
    const storage = getStorage();
    try {
      storage.setItem(STORAGE_KEY_DRAFT, JSON.stringify(state));
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Export library to schema-versioned JSON string
   */
  function exportJSON(items = null) {
    const list = items !== null ? items : loadLibrary();
    const payload = {
      app: APP_IDENTIFIER,
      version: CURRENT_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      items: list
    };
    return JSON.stringify(payload, null, 2);
  }

  /**
   * Validate and import JSON into existing library with deduplication
   * Returns: { ok: boolean, addedCount: number, skippedCount: number, merged: Array, error?: string }
   */
  function validateAndImport(jsonString, currentLibrary = null) {
    if (!jsonString || typeof jsonString !== "string") {
      return { ok: false, error: "匯入內容不可為空" };
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (e) {
      return { ok: false, error: "JSON 格式錯誤，無法解析" };
    }

    if (!parsed || typeof parsed !== "object") {
      return { ok: false, error: "匯入檔案結構不正確" };
    }

    if (parsed.app !== APP_IDENTIFIER) {
      return {
        ok: false,
        error: `檔案格式不相符（預期 app: "${APP_IDENTIFIER}"，收到 "${parsed.app || "未知"}"）`
      };
    }

    if (!Array.isArray(parsed.items)) {
      return { ok: false, error: "匯入檔案缺少 items 提示詞列表" };
    }

    const existing = currentLibrary !== null ? currentLibrary : loadLibrary();
    const existingIds = new Set(existing.map((it) => it.id));
    const existingPrompts = new Set(existing.map((it) => (it.prompt || "").trim()));

    let addedCount = 0;
    let skippedCount = 0;
    const toAdd = [];

    for (const rawItem of parsed.items) {
      if (!rawItem || typeof rawItem !== "object") {
        skippedCount++;
        continue;
      }

      // Check required fields
      const promptText = (rawItem.prompt || "").trim();
      const itemId = rawItem.id || generateId();

      // Duplicate check: duplicate ID or identical prompt content
      if (existingIds.has(itemId) || (promptText && existingPrompts.has(promptText))) {
        skippedCount++;
        continue;
      }

      const validItem = {
        id: itemId,
        name: (rawItem.name || "").trim() || "匯入之 Prompt",
        mode: rawItem.mode === "video" ? "video" : "image",
        tags: Array.isArray(rawItem.tags) ? rawItem.tags : [],
        favorite: Boolean(rawItem.favorite),
        prompt: promptText,
        negative: rawItem.negative || "",
        explanation: rawItem.explanation || "",
        state: rawItem.state && typeof rawItem.state === "object" ? rawItem.state : {},
        createdAt: rawItem.createdAt || Date.now(),
        updatedAt: rawItem.updatedAt || Date.now()
      };

      existingIds.add(validItem.id);
      if (promptText) existingPrompts.add(promptText);
      toAdd.push(validItem);
      addedCount++;
    }

    const merged = [...toAdd, ...existing];
    saveLibrary(merged);

    return {
      ok: true,
      addedCount,
      skippedCount,
      merged
    };
  }

  /**
   * Relative time formatting in natural Cantonese
   */
  function formatRelativeTimeZh(timestamp) {
    if (!timestamp) return "未知時間";
    const now = Date.now();
    const diff = Math.max(0, now - timestamp);
    const sec = Math.floor(diff / 1000);

    if (sec < 60) return "剛剛";
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} 分鐘前`;
    const hour = Math.floor(min / 60);
    if (hour < 24) return `${hour} 小時前`;
    const day = Math.floor(hour / 24);
    if (day === 1) return "尋日";
    if (day < 7) return `${day} 日前`;

    const d = new Date(timestamp);
    const month = d.getMonth() + 1;
    const date = d.getDate();
    return `${month}月${date}日`;
  }

  return {
    generateId,
    loadLibrary,
    saveLibrary,
    addItem,
    updateItem,
    deleteItem,
    toggleFavorite,
    duplicateItem,
    loadDraft,
    saveDraft,
    exportJSON,
    validateAndImport,
    formatRelativeTimeZh,
    STORAGE_KEY_LIB,
    STORAGE_KEY_DRAFT,
    APP_IDENTIFIER
  };
});
