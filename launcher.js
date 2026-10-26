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
  const filterStatus = document.getElementById('filterStatus');

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
          <p class="error-title">未有作品</p>
          <p class="error-desc">清單而家係空嘅，遲啲再嚟。</p>
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

    // 1. 動態計算並渲染 Hero 統計摘要（單行極簡、無邊框）
    if (heroStats) {
      heroStats.innerHTML = `
        <p class="hero-meta">${projects.length} 個作品 · 最新係 ${esc(latest.title)} · <time datetime="${esc(latest.added)}">${fmtDate(latest.added)}</time></p>
      `;
    }

    // 2. 渲染分類篩選 Chip（radiogroup 語意）
    const filterItems = [
      { id: 'all', label: '全部', count: projects.length },
      ...categories.map(c => ({ id: c, label: c, count: categoryMap.get(c) }))
    ];

    filterScroll.innerHTML = filterItems.map((item, idx) => `
      <button
        type="button"
        class="chip ${idx === 0 ? 'is-active' : ''}"
        role="radio"
        data-filter="${esc(item.id)}"
        aria-checked="${idx === 0 ? 'true' : 'false'}"
      >
        <span class="chip-label">${esc(item.label)}</span>
        <span class="chip-count">${item.count}</span>
      </button>
    `).join('');

    // 3. 渲染作品卡片（整張卡片為 <a> 連結，全幅封面無白屏/假聽筒）
    cardsGrid.innerHTML = projects.map((p, index) => {
      const isLatest = index === 0;
      const accent = /^#[0-9a-fA-F]{6}$/.test(p.accent) ? p.accent : '#8d7b68';
      return `
        <a
          class="card ${isLatest ? 'card-featured' : ''} animate-in"
          href="${esc(p.path)}"
          style="--accent: ${accent}; --i: ${index};"
          data-category="${esc(p.category || '')}"
        >
          <div class="card-stage">
            <div class="card-device">
              <img
                class="card-thumb"
                src="${esc(p.cover)}"
                alt="${esc(p.title)} 介面截圖"
                ${index === 0 ? 'fetchpriority="high"' : 'loading="eager"'}
                decoding="async"
                width="780"
                height="1040"
                onerror="this.classList.add('is-broken')"
              />
            </div>
          </div>
          <div class="card-body">
            <div class="card-meta">
              <span class="card-cat">${esc(p.category)}</span>
              <span class="meta-dot" aria-hidden="true">·</span>
              <time class="card-date" datetime="${esc(p.added)}">${fmtDate(p.added)}</time>
              ${isLatest ? '<span class="badge-new" aria-label="最新作品">新</span>' : ''}
            </div>
            <div class="card-headings">
              <h2 class="card-title">${esc(p.title)}</h2>
              <p class="card-sub">${esc(p.subtitle)}</p>
            </div>
            <p class="card-desc">${esc(p.description)}</p>
          </div>
        </a>
      `;
    }).join('');

    // 動畫結束時清除 animate-in class，確保 :active scale 縮放反饋正常
    cardsGrid.addEventListener('animationend', (e) => {
      if (e.target.classList.contains('card')) e.target.classList.remove('animate-in');
    });

    // 4. 篩選交互處理（純切換 class，無版面重排跳動）
    const chips = filterScroll.querySelectorAll('.chip');
    const cards = cardsGrid.querySelectorAll('.card');

    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const target = chip.dataset.filter;

        chips.forEach(c => {
          const match = c === chip;
          c.classList.toggle('is-active', match);
          c.setAttribute('aria-checked', match ? 'true' : 'false');
        });

        let visibleCount = 0;
        cards.forEach(card => {
          const isMatch = target === 'all' || card.dataset.category === target;
          card.classList.toggle('is-hidden', !isMatch);
          if (isMatch) visibleCount++;
        });

        if (filterStatus) {
          filterStatus.textContent = `顯示 ${visibleCount} 個作品`;
        }

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
        <p class="error-desc">讀取作品嗰陣出咗問題。檢查網絡，或者重新載入。</p>
        <button type="button" class="btn-retry" onclick="location.reload()">重新載入</button>
      </div>
    `;
  }
})();
