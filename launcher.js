(async function () {
  const list = document.getElementById('list');
  const meta = document.getElementById('meta');
  const fmt = (d) => { const [y, m, day] = d.split('-').map(Number); return `${y}年${m}月${day}日`; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  try {
    const res = await fetch('projects/manifest.json', { cache: 'no-cache' });
    const { projects } = await res.json();
    projects.sort((a, b) => b.added.localeCompare(a.added));
    meta.textContent = `${projects.length} 個項目 · 最近更新 ${fmt(projects[0].added)}`;
    list.innerHTML = projects.map((p, i) => `
      <li><a class="item" href="${esc(p.path)}" style="--accent:${esc(p.accent || '#888')}">
        <span class="num">${String(projects.length - i).padStart(2, '0')}</span>
        <span class="body">
          <span class="row"><span class="cat">${esc(p.category)}</span><time datetime="${esc(p.added)}">加入日期 ${fmt(p.added)}</time></span>
          <span class="title">${esc(p.title)}</span>
          <span class="sub">${esc(p.subtitle)}</span>
          <span class="desc">${esc(p.description)}</span>
        </span>
        <span class="go" aria-hidden="true">→</span>
      </a></li>`).join('');
  } catch (e) {
    list.innerHTML = '<li class="err">載入唔到項目列表，請重新整理。</li>';
  }
})();
