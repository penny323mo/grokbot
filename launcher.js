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
        <div class="error-panel" role="alert">
          <p class="error-title">未有作品</p>
          <p class="error-desc">清單而家係空嘅，遲啲再嚟。</p>
        </div>`;
      return;
    }

    // 按加入日期降序排序（最新優先）
    projects.sort((a, b) => (b.added || '').localeCompare(a.added || ''));

    const latest = projects[0];
    const categorySet = new Set();
    for (const p of projects) {
      if (p.category) categorySet.add(p.category);
    }
    const categories = Array.from(categorySet);

    // 1. 動態渲染 Hero 統計摘要（單行極簡、無邊框、無 stat box）
    if (heroStats) {
      heroStats.innerHTML = `
        <p class="hero-meta">${projects.length} 個作品 · 最新係 ${esc(latest.title)} · <time datetime="${esc(latest.added)}">${fmtDate(latest.added)}</time></p>
      `;
    }

    // 2. 渲染分類篩選 Chip（單行橫向捲動、無數字 count、radiogroup 語意）
    const filterItems = [
      { id: 'all', label: '全部' },
      ...categories.map(c => ({ id: c, label: c }))
    ];

    filterScroll.innerHTML = filterItems.map((item, idx) => `
      <button
        type="button"
        class="chip ${idx === 0 ? 'is-active' : ''}"
        role="radio"
        data-filter="${esc(item.id)}"
        aria-checked="${idx === 0 ? 'true' : 'false'}"
        tabindex="${idx === 0 ? '0' : '-1'}"
      >${esc(item.label)}</button>
    `).join('');

    // 預先解碼封面，避免切換時白屏
    await Promise.all(projects.map((p) => {
      const img = new Image();
      img.src = p.cover;
      return img.decode().catch(() => {});
    }));

    // 3. 渲染作品卡片（統一架構：cover -> meta row -> title -> desc -> 開始 →）
    cardsGrid.innerHTML = projects.map((p, index) => {
      const isLatest = index === 0;
      const accent = /^#[0-9a-fA-F]{6}$/.test(p.accent) ? p.accent : '#5E7186';
      return `
        <li>
          <a
            class="card animate-in"
            href="${esc(p.path)}"
            style="--accent: ${accent}; --i: ${index};"
            data-category="${esc(p.category || '')}"
          >
            <div class="card-cover-frame">
              <img
                class="card-cover"
                src="${esc(p.cover)}"
                alt=""
                width="1600"
                height="900"
                loading="${index < 2 ? 'eager' : 'lazy'}"
                decoding="async"
              />
            </div>
            <div class="card-body">
              <div class="card-meta">
                <span class="card-cat">${esc(p.category)}</span>
                <span class="meta-dot" aria-hidden="true">·</span>
                <time class="card-date" datetime="${esc(p.added)}">加入日期 ${fmtDate(p.added)}</time>
                ${isLatest ? '<span class="badge-new" aria-label="最新作品">新</span>' : ''}
              </div>
              <h2 class="card-title">${esc(p.title)}</h2>
              <p class="card-desc">${esc(p.description)}</p>
              <div class="card-action">
                <span class="card-btn">開始 →</span>
              </div>
            </div>
          </a>
        </li>
      `;
    }).join('');

    // 圖片載入完成標記 is-ready
    cardsGrid.querySelectorAll('.card-cover').forEach((img) => {
      const ready = () => img.closest('.card-cover-frame')?.classList.add('is-ready');
      if (img.complete) ready();
      else {
        img.addEventListener('load', ready, { once: true });
        img.addEventListener('error', ready, { once: true });
      }
    });

    // 動畫結束時清除 animate-in class，確保 :active scale 正常
    cardsGrid.addEventListener('animationend', (e) => {
      if (e.target.classList.contains('card')) e.target.classList.remove('animate-in');
    });

    // 4. 篩選交互處理（純切換 class，無版面重排跳動，支援方向鍵導航）
    const chips = [...filterScroll.querySelectorAll('.chip')];
    const cards = [...cardsGrid.querySelectorAll('.card')];

    function selectChip(chip) {
      chips.forEach((c) => {
        const on = c === chip;
        c.classList.toggle('is-active', on);
        c.setAttribute('aria-checked', on ? 'true' : 'false');
        c.tabIndex = on ? 0 : -1;
      });
      const target = chip.dataset.filter;
      let visibleCount = 0;
      cards.forEach((card) => {
        const isMatch = target === 'all' || card.dataset.category === target;
        card.classList.toggle('is-hidden', !isMatch);
        if (card.parentElement && card.parentElement.tagName === 'LI') {
          card.parentElement.hidden = !isMatch;
        }
        if (isMatch) visibleCount++;
      });
      const name = chip.textContent.trim();
      if (filterStatus) filterStatus.textContent = `${name}，顯示 ${visibleCount} 個作品`;
      if (emptyState) emptyState.hidden = visibleCount > 0;
    }

    chips.forEach((chip) => {
      chip.addEventListener('click', () => selectChip(chip));
      chip.addEventListener('keydown', (e) => {
        const i = chips.indexOf(chip);
        const key = e.key;
        let next = null;
        if (key === 'ArrowRight' || key === 'ArrowDown') next = chips[(i + 1) % chips.length];
        else if (key === 'ArrowLeft' || key === 'ArrowUp') next = chips[(i - 1 + chips.length) % chips.length];
        else if (key === 'Home') next = chips[0];
        else if (key === 'End') next = chips[chips.length - 1];
        if (!next) return;
        e.preventDefault();
        selectChip(next);
        next.focus();
        next.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      });
    });

  } catch (err) {
    console.error('Failed to load projects manifest:', err);
    cardsGrid.innerHTML = `
      <div class="error-panel" role="alert">
        <p class="error-title">作品清單載入唔到</p>
        <p class="error-desc">讀取作品嗰陣出咗問題。檢查網絡，或者重新載入。</p>
        <button type="button" class="btn-retry">重新載入</button>
      </div>
    `;
    cardsGrid.querySelector('.btn-retry')?.addEventListener('click', () => location.reload());
  }
})();
