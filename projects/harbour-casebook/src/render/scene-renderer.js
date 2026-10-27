/**
 * 濠江疑案 · Harbour Casebook
 * 現場畫布與縮放引擎 (Scene Viewport & Hotspots Renderer)
 * 針對 iPhone 390×844 一指滑動平移與捏合縮放優化
 */

export class SceneRenderer {
  constructor(containerEl, options = {}) {
    this.container = containerEl;
    this.onHotspotClick = options.onHotspotClick || (() => {});
    this.hotspots = [];
    this.discoveredIds = new Set();
    this.fullyHarvestedIds = new Set();

    // Viewport transforms (Scene base: 390x700)
    this.scale = 1.0;
    this.minScale = 1.0;
    this.maxScale = 2.8;
    this.panX = 0;
    this.panY = 0;

    // Gesture tracking
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.initialPanX = 0;
    this.initialPanY = 0;
    this.initialPinchDistance = 0;
    this.initialPinchScale = 1.0;

    this.initDOM();
    this.bindEvents();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="scene-viewport" style="touch-action: none; position: relative; width: 100%; height: 100%; overflow: hidden; background: #EFE6D8;">
        <div class="scene-transform-layer" style="position: absolute; top: 0; left: 0; width: 390px; height: 700px; transform-origin: 0 0;">
          <div class="scene-svg-host" style="width: 100%; height: 100%;"></div>
          <div class="scene-hotspots-layer" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;"></div>
        </div>
        <!-- On-screen Zoom / Reset Controls -->
        <div class="scene-controls" style="position: absolute; right: 12px; bottom: 16px; display: flex; flex-direction: column; gap: 8px; z-index: 10;">
          <button class="scene-control-btn btn-reset-zoom" title="重設視角" aria-label="重設視角">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="9"/>
              <path d="M12 8v8M8 12h8"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    this.viewportEl = this.container.querySelector('.scene-viewport');
    this.layerEl = this.container.querySelector('.scene-transform-layer');
    this.svgHost = this.container.querySelector('.scene-svg-host');
    this.hotspotsLayer = this.container.querySelector('.scene-hotspots-layer');
    this.resetBtn = this.container.querySelector('.btn-reset-zoom');

    this.resetBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.resetView();
    });
  }

  loadScene(svgUrl, hotspots, discoveredIds = [], fullyHarvestedIds = []) {
    this.hotspots = hotspots || [];
    this.discoveredIds = new Set(discoveredIds);
    this.fullyHarvestedIds = new Set(fullyHarvestedIds);

    // Fetch and embed SVG inline so styling and rendering is seamless
    fetch(svgUrl)
      .then(res => res.text())
      .then(svgText => {
        this.svgHost.innerHTML = svgText;
        this.renderHotspots();
        this.resetView();
      })
      .catch(err => {
        console.error('Failed to load scene SVG:', err);
        this.svgHost.innerHTML = `<div class="error-msg" style="padding: 20px; color: #9A3B2C;">無法載入現場圖景</div>`;
      });
  }

  updateHotspotState(discoveredIds = [], fullyHarvestedIds = []) {
    this.discoveredIds = new Set(discoveredIds);
    this.fullyHarvestedIds = new Set(fullyHarvestedIds);
    this.renderHotspots();
  }

  renderHotspots() {
    this.hotspotsLayer.innerHTML = '';
    this.hotspots.forEach(h => {
      const isDiscovered = this.discoveredIds.has(h.id);
      const isFullyHarvested = this.fullyHarvestedIds.has(h.id);

      const marker = document.createElement('button');
      marker.className = `hotspot-marker ${isDiscovered ? 'is-discovered' : 'is-unvisited'} ${isFullyHarvested ? 'is-harvested' : ''}`;
      marker.setAttribute('data-hotspot-id', h.id);
      marker.setAttribute('aria-label', h.name);
      marker.title = h.name;
      marker.style.position = 'absolute';
      marker.style.left = `${h.x}%`;
      marker.style.top = `${h.y}%`;
      marker.style.transform = 'translate(-50%, -50%)';
      marker.style.pointerEvents = 'auto';

      marker.innerHTML = `
        <span class="hotspot-hit-area"></span>
        <span class="hotspot-ring"></span>
        <span class="hotspot-core">
          ${isFullyHarvested ? '✓' : ''}
        </span>
      `;

      marker.addEventListener('click', (e) => {
        e.stopPropagation();
        this.onHotspotClick(h);
      });

      this.hotspotsLayer.appendChild(marker);
    });
  }

  resetView() {
    // Fit to viewport width
    const vpW = this.viewportEl.clientWidth || 390;
    const vpH = this.viewportEl.clientHeight || 600;

    this.scale = vpW / 390;
    this.minScale = this.scale;
    this.maxScale = this.minScale * 2.5;

    // Center horizontally
    this.panX = 0;
    // Align near top with slight breathing room
    this.panY = Math.max(0, (vpH - 700 * this.scale) / 2);

    this.applyTransform();
  }

  applyTransform() {
    this.clampPan();
    this.layerEl.style.transform = `translate3d(${this.panX}px, ${this.panY}px, 0) scale(${this.scale})`;
  }

  clampPan() {
    const vpW = this.viewportEl.clientWidth || 390;
    const vpH = this.viewportEl.clientHeight || 600;
    const curW = 390 * this.scale;
    const curH = 700 * this.scale;

    if (curW <= vpW) {
      this.panX = (vpW - curW) / 2;
    } else {
      const minX = vpW - curW;
      this.panX = Math.min(0, Math.max(minX, this.panX));
    }

    if (curH <= vpH) {
      this.panY = (vpH - curH) / 2;
    } else {
      const minY = vpH - curH;
      this.panY = Math.min(0, Math.max(minY, this.panY));
    }
  }

  bindEvents() {
    const el = this.viewportEl;

    // Touch events for mobile 1-finger pan and 2-finger pinch
    el.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.startX = e.touches[0].clientX;
        this.startY = e.touches[0].clientY;
        this.initialPanX = this.panX;
        this.initialPanY = this.panY;
      } else if (e.touches.length === 2) {
        this.isDragging = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        this.initialPinchDistance = Math.hypot(dx, dy);
        this.initialPinchScale = this.scale;
      }
    }, { passive: false });

    el.addEventListener('touchmove', (e) => {
      e.preventDefault(); // Prevent whole-page bounce
      if (e.touches.length === 1 && this.isDragging) {
        const dx = e.touches[0].clientX - this.startX;
        const dy = e.touches[0].clientY - this.startY;
        this.panX = this.initialPanX + dx;
        this.panY = this.initialPanY + dy;
        this.applyTransform();
      } else if (e.touches.length === 2 && this.initialPinchDistance > 0) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const factor = dist / this.initialPinchDistance;
        this.scale = Math.min(this.maxScale, Math.max(this.minScale, this.initialPinchScale * factor));
        this.applyTransform();
      }
    }, { passive: false });

    el.addEventListener('touchend', (e) => {
      if (e.touches.length === 0) {
        this.isDragging = false;
        this.initialPinchDistance = 0;
      } else if (e.touches.length === 1) {
        this.isDragging = true;
        this.startX = e.touches[0].clientX;
        this.startY = e.touches[0].clientY;
        this.initialPanX = this.panX;
        this.initialPanY = this.panY;
      }
    });

    // Mouse events for desktop/preview inspection
    el.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      this.isDragging = true;
      this.startX = e.clientX;
      this.startY = e.clientY;
      this.initialPanX = this.panX;
      this.initialPanY = this.panY;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.startX;
      const dy = e.clientY - this.startY;
      this.panX = this.initialPanX + dx;
      this.panY = this.initialPanY + dy;
      this.applyTransform();
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
      this.scale = Math.min(this.maxScale, Math.max(this.minScale, this.scale * zoomFactor));
      this.applyTransform();
    }, { passive: false });
  }
}
