/**
 * 濠江疑案 · Harbour Casebook
 * 現場畫布與縮放引擎 (Scene Viewport & Hotspots Renderer)
 * 針對 iPhone 390×844 一指滑動平移與捏合縮放優化
 * 載入 1962 澳門現場 WebP 藝術圖景，支援高精度百分比物證標記
 */

export class SceneRenderer {
  constructor(containerEl, options = {}) {
    this.container = containerEl;
    this.onHotspotClick = options.onHotspotClick || (() => {});
    this.hotspots = [];
    this.discoveredIds = new Set();
    this.fullyHarvestedIds = new Set();

    // Base scene coordinates (Aspect ratio 2:3 matching 832×1248 scenes: 390 × 585)
    this.baseWidth = 390;
    this.baseHeight = 585;

    // Viewport transforms
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
      <div class="scene-viewport" style="touch-action: none; position: relative; width: 100%; height: 100%; overflow: hidden; background: #171410;">
        <div class="scene-transform-layer" style="position: absolute; top: 0; left: 0; width: ${this.baseWidth}px; height: ${this.baseHeight}px; transform-origin: 0 0;">
          <div class="scene-image-host" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
            <img class="scene-img" src="" alt="現場圖景" style="width: 100%; height: 100%; object-fit: cover; display: block; pointer-events: none; -webkit-user-select: none; user-select: none;" />
          </div>
          <div class="scene-hotspots-layer" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 5;"></div>
        </div>
        <!-- Atmospheric Overlays: Lamp Vignette & Film Grain matching Desk Hub -->
        <div class="scene-atmosphere-layer" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 6;">
          <div class="scene-vignette" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: url('assets/ui/lamp_vignette.webp') center / cover no-repeat; mix-blend-mode: multiply; opacity: 0.55;"></div>
          <div class="scene-grain" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: url('assets/ui/film_grain.webp') repeat; mix-blend-mode: overlay; opacity: 0.10;"></div>
        </div>
      </div>
    `;

    this.viewportEl = this.container.querySelector('.scene-viewport');
    this.layerEl = this.container.querySelector('.scene-transform-layer');
    this.imageHost = this.container.querySelector('.scene-image-host');
    this.sceneImg = this.container.querySelector('.scene-img');
    this.hotspotsLayer = this.container.querySelector('.scene-hotspots-layer');
    this.resetBtn = this.container.querySelector('.btn-reset-zoom');

    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.resetView();
      });
    }
  }

  loadScene(imageUrl, hotspots, discoveredIds = [], fullyHarvestedIds = []) {
    this.hotspots = hotspots || [];
    this.discoveredIds = new Set(discoveredIds);
    this.fullyHarvestedIds = new Set(fullyHarvestedIds);

    const onImageLoaded = () => {
      this.renderHotspots();
      this.resetView();
    };

    if (this.sceneImg) {
      if (this.sceneImg.src && this.sceneImg.src.endsWith(imageUrl)) {
        this.renderHotspots();
        this.resetView();
      } else {
        this.sceneImg.onload = onImageLoaded;
        this.sceneImg.onerror = (err) => {
          console.error('Failed to load scene WebP:', err);
          this.imageHost.innerHTML = `<div class="error-msg" style="padding: 20px; color: #9A3B2C;">無法載入現場圖景</div>`;
        };
        this.sceneImg.src = imageUrl;
        if (this.sceneImg.complete && this.sceneImg.naturalWidth > 0) {
          onImageLoaded();
        }
      }
    } else {
      this.renderHotspots();
      this.resetView();
    }
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
    const vpW = this.viewportEl.clientWidth || this.baseWidth;
    const vpH = this.viewportEl.clientHeight || this.baseHeight;

    // Cover scale fills the entire viewport without empty letterboxes
    this.scale = Math.max(vpW / this.baseWidth, vpH / this.baseHeight);
    this.minScale = this.scale;
    this.maxScale = this.minScale * 2.8;

    this.panX = (vpW - this.baseWidth * this.scale) / 2;
    this.panY = (vpH - this.baseHeight * this.scale) / 2;

    this.applyTransform();
  }

  applyTransform() {
    this.clampPan();
    this.layerEl.style.transform = `translate3d(${this.panX}px, ${this.panY}px, 0) scale(${this.scale})`;
  }

  clampPan() {
    const vpW = this.viewportEl.clientWidth || this.baseWidth;
    const vpH = this.viewportEl.clientHeight || 600;
    const curW = this.baseWidth * this.scale;
    const curH = this.baseHeight * this.scale;

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
