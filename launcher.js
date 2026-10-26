/**
 * Grokbot 工作室 Launcher
 * 純原生、無依賴、iPhone 優先
 */
(async function () {
  'use strict';

  const heroStats = document.getElementById('heroStats');
  const filterScroll = document.getElementById('filterScroll');
  const cardsGrid = document.getElementById('cardsGrid');
  const emptyState = document.getElementById('emptyState');

  // 安全跳脫字串，防範 XSS
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));

  // 格式化加入日期：2026-10-26 -> 2026年10月26日
  const fmtDate = (d) => {
    if (!d) return '';
    const [y, m, day] = d.split('-').map(Number);
    return `${y}年${m}月${day}日`;
  };

  try {
    const res = await fetch('projects/manifest.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const projects = Array.isArray(data.projects) ? data.projects : [];

    if (projects.length === 0) {
      cardsGrid.innerHTML = `
        <div class="error-panel">
          <p class="error-title">暫無作品記錄</p>
          <p class="error-desc">作品清單目前為空，請稍後再試。</p>
        </div>`;
      return;
    }

    // 按加入日期降序排序（最新優先）
    projects.sort((a, b) => (b.added || '').localeCompare(a.added || ''));

    const latest = projects[0];
    const categoryMap = new Map();
    for (const p of projects) {
      const cat = p.category || '未分類';
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
    }
    const categories = Array.from(categoryMap.keys());

    // 1. 動態計算並渲染 Hero 統計欄
    heroStats.innerHTML = `
      <div class="stats-row">
        <div class="stat-cell">
          <span class="stat-label">項目數量</span>
          <span class="stat-value">
            <span class="stat-num">${projects.length}</span>
            <span class="stat-unit">個作品</span>
          </span>
        </div>
        <div class="stat-divider" aria-hidden="true"></div>
        <div class="stat-cell">
          <span class="stat-label">類別數量</span>
          <span class="stat-value">
            <span class="stat-num">${categories.length}</span>
            <span class="stat-unit">個類別</span>
          </span>
        </div>
        <div class="stat-divider" aria-hidden="true"></div>
        <div class="stat-cell stat-cell-latest">
          <span class="stat-label">最新加入</span>
          <span class="stat-value stat-value-latest">
            <span class="stat-latest-title">${esc(latest.title)}</span>
            <time class="stat-latest-date" datetime="${esc(latest.added)}">${fmtDate(latest.added)}</time>
          </span>
        </div>
      </div>
    `;

    // 2. 渲染分類篩選 Chip
    const filterItems = [
      { id: 'all', label: '全部', count: projects.length },
      ...categories.map(c => ({ id: c, label: c, count: categoryMap.get(c) }))
    ];

    filterScroll.innerHTML = filterItems.map((item, idx) => `
      <button
        type="button"
        class="chip ${idx === 0 ? 'is-active' : ''}"
        data-filter="${esc(item.id)}"
        aria-pressed="${idx === 0 ? 'true' : 'false'}"
      >
        <span class="chip-label">${esc(item.label)}</span>
        <span class="chip-count">${item.count}</span>
      </button>
    `).join('');

    // 3. 渲染作品卡片（整張卡片為 <a> 連結）
    cardsGrid.innerHTML = projects.map((p, index) => {
      const isLatest = index === 0;
      const accent = p.accent || '#8d8b86';
      return `
        <a
          class="card ${isLatest ? 'card-featured' : ''} animate-in"
          href="${esc(p.path)}"
          style="--accent: ${esc(accent)}; --i: ${index};"
          data-category="${esc(p.category || '')}"
          aria-label="${esc(p.title)} · ${esc(p.subtitle)}"
        >
          <div class="card-stage">
            <div class="card-device">
              <img
                class="card-thumb"
                src="${esc(p.cover)}"
                alt="${esc(p.title)} 介面截圖"
                loading="lazy"
                decoding="async"
                width="780"
                height="1040"
              />
            </div>
          </div>
          <div class="card-body">
            <div class="card-meta">
              <span class="card-cat">${esc(p.category)}</span>
              <span class="meta-dot" aria-hidden="true">·</span>
              <time class="card-date" datetime="${esc(p.added)}">${fmtDate(p.added)}</time>
              ${isLatest ? '<span class="badge-new" aria-label="最新作品">NEW</span>' : ''}
            </div>
            <div class="card-headings">
              <h2 class="card-title">${esc(p.title)}</h2>
              <p class="card-sub">${esc(p.subtitle)}</p>
            </div>
            <p class="card-desc">${esc(p.description)}</p>
            <div class="card-action">
              <span class="card-action-text">開啓作品</span>
              <svg class="card-arrow" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8H13M13 8L8.5 3.5M13 8L8.5 12.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        </a>
      `;
    }).join('');

    // 4. 篩選交互處理（純切換 class，無版面重排跳動）
    const chips = filterScroll.querySelectorAll('.chip');
    const cards = cardsGrid.querySelectorAll('.card');

    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const target = chip.dataset.filter;

        chips.forEach(c => {
          const match = c === chip;
          c.classList.toggle('is-active', match);
          c.setAttribute('aria-pressed', match ? 'true' : 'false');
        });

        let visibleCount = 0;
        cards.forEach(card => {
          const isMatch = target === 'all' || card.dataset.category === target;
          card.classList.toggle('is-hidden', !isMatch);
          if (isMatch) visibleCount++;
        });

        if (emptyState) {
          emptyState.hidden = visibleCount > 0;
        }
      });
    });

  } catch (err) {
    console.error('Failed to load projects manifest:', err);
    cardsGrid.innerHTML = `
      <div class="error-panel" role="alert">
        <p class="error-title">暫時未能載入作品清單</p>
        <p class="error-desc">讀取作品數據時發生問題，請檢查網絡連線或重新整理頁面。</p>
        <button type="button" class="btn-retry" onclick="location.reload()">重新整理</button>
      </div>
    `;
  }
})();
