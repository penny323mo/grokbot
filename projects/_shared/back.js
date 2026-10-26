/* grokbot shared back button — include via <script src="../_shared/back.js" defer></script> */
(function () {
  if (window.__grokbotBack) return; window.__grokbotBack = 1;
  var css = '.gb-back{position:fixed;z-index:2147483000;left:calc(env(safe-area-inset-left) + 8px);bottom:calc(env(safe-area-inset-bottom) + 12px);' +
    'min-width:44px;height:44px;padding:0 14px 0 12px;display:inline-flex;align-items:center;gap:6px;border-radius:22px;' +
    'font:600 13px/1 -apple-system,BlinkMacSystemFont,"PingFang HK","Noto Sans TC",system-ui,sans-serif;letter-spacing:.01em;' +
    'color:#f4f2ec;background:rgba(20,20,22,.78);border:1px solid rgba(255,255,255,.14);box-shadow:0 2px 10px rgba(0,0,0,.25);' +
    'text-decoration:none;-webkit-tap-highlight-color:transparent;transition:opacity .25s,transform .25s}' +
    '.gb-back:active{transform:scale(.96)}.gb-back svg{width:14px;height:14px;flex:none}' +
    '.gb-back.gb-hide{opacity:0;pointer-events:none;transform:translateY(8px)}' +
    '@media (prefers-reduced-motion:reduce){.gb-back{transition:none}}';
  var s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
  var a = document.createElement('a');
  a.className = 'gb-back'; a.href = '../../'; a.setAttribute('aria-label', '返回 grokbot 主頁');
  a.innerHTML = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3L5 8l5 5"/></svg><span>grokbot</span>';
  function mount() { document.body.appendChild(a); tick(); }
  // Hide while scrolling down, and while a full-screen canvas game is active
  var lastY = scrollY;
  addEventListener('scroll', function () { var y = scrollY; a.classList.toggle('gb-hide', y > lastY + 4 && y > 80); if (y < lastY - 4 || y < 80) a.classList.remove('gb-hide'); lastY = y; }, { passive: true });
  function playing() {
    if (document.body.dataset.gbPlaying === '1') return true; // projects may opt in
    var cs = document.querySelectorAll('canvas');
    for (var i = 0; i < cs.length; i++) { var r = cs[i].getBoundingClientRect(); var st = getComputedStyle(cs[i]);
      if (st.visibility !== 'hidden' && st.display !== 'none' && r.width * r.height > innerWidth * innerHeight * 0.7) {
        var ov = document.elementFromPoint(innerWidth / 2, innerHeight / 2); if (ov === cs[i]) return true; } }
    return false;
  }
  function fixedAncestor(el) {
    for (; el && el !== document.body; el = el.parentElement) { var p = getComputedStyle(el).position; if (p === 'fixed' || p === 'sticky') return true; }
    return false;
  }
  function dock() {
    // walk up from the bottom-left corner; sit above any fixed/sticky bar found there
    a.style.visibility = 'hidden'; var y = innerHeight - 4, top = innerHeight;
    while (y > innerHeight * 0.5) { var el = document.elementFromPoint(40, y); if (!el || !fixedAncestor(el)) break; top = y; y -= 8; }
    a.style.visibility = '';
    var off = innerHeight - top; a.style.bottom = off > 4 ? (off + 10) + 'px' : '';
  }
  function tick() { a.style.display = playing() ? 'none' : ''; dock(); setTimeout(tick, 700); }
  if (document.body) mount(); else addEventListener('DOMContentLoaded', mount);
})();
