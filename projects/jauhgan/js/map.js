/**
 * map.js - MapLibre GL wrapper, custom bone & ink markers, and gesture handling
 * Nightly 2026-11-11 · 就近 (Just Around)
 */

import { getIconSvg } from './icons.js';

export class AppMap {
  constructor(options) {
    this.container = options.container;
    this.fallbackContainer = options.fallbackContainer;
    this.initialOrigin = options.initialOrigin;
    this.onSelectPlace = options.onSelectPlace || (() => {});
    this.onOriginChange = options.onOriginChange || (() => {});
    this.onMapError = options.onMapError || (() => {});

    this.map = null;
    this.originMarker = null;
    this.placeMarkers = new Map();
    this.selectedPlaceId = null;
    this.isLoaded = false;
    this.hasError = false;
    this.currentPlaces = [];
    this.tileErrorCount = 0;
    this.loadTimeout = null;

    this.init();
  }

  init() {
    // If a previous map instance exists, remove it cleanly to avoid stacking WebGL contexts (Item 2 fix)
    if (this.map) {
      try {
        this.map.remove();
      } catch (e) {
        // ignore
      }
      this.map = null;
    }
    this.originMarker = null;
    this.placeMarkers.clear();
    this.isLoaded = false;

    // Check if MapLibre GL JS is available
    if (typeof window.maplibregl === 'undefined') {
      this.showFallback('地圖庫未能載入，就近地點清單依然運作正常');
      return;
    }

    try {
      const isLocal = window.location.protocol === 'file:';
      // Positron style: use local bone-and-ink styled json or remote OpenFreeMap
      const styleUrl = isLocal ? 'https://tiles.openfreemap.org/styles/positron' : 'assets/style-positron.json';

      this.map = new window.maplibregl.Map({
        container: this.container,
        style: styleUrl,
        center: [this.initialOrigin.lon, this.initialOrigin.lat],
        zoom: 15.5,
        attributionControl: false, // Clean custom attribution in civic footer
        maxZoom: 19,
        minZoom: 11,
        touchPitch: false, // Mobile friendly, prevent accidental 3D tilt
        dragRotate: false
      });

      // Safety timeout: only as a last resort if style/tiles completely fail to respond
      this.loadTimeout = setTimeout(() => {
        if (!this.isLoaded && !this.hasError) {
          console.warn('Map load timed out, showing calm fallback');
          this.showFallback('地圖圖層暫時未能載入，但就近地點清單依然運作正常');
        }
      }, 8000);
      if (typeof this.loadTimeout?.unref === 'function') {
        this.loadTimeout.unref();
      }

      this.map.on('load', () => {
        if (this.loadTimeout) {
          clearTimeout(this.loadTimeout);
          this.loadTimeout = null;
        }
        this.isLoaded = true;
        this.hasError = false;
        this.tileErrorCount = 0;

        // Hide calm fallback card upon successful load (Item 2 fix)
        if (this.fallbackContainer) {
          this.fallbackContainer.style.display = 'none';
        }

        this.updateOriginMarker(this.initialOrigin);

        // Flush cached places immediately upon map load
        if (this.currentPlaces && this.currentPlaces.length > 0) {
          this.renderPlaceMarkers(this.currentPlaces);
        }
      });

      this.map.on('error', (e) => {
        const errMsg = e?.error?.message || '';

        // Fatal WebGL failure
        if (errMsg.includes('WebGL') || errMsg.includes('webgl') || errMsg.includes('Context Lost')) {
          this.showFallback('地圖圖層暫時未能載入，但就近地點清單依然運作正常');
          return;
        }

        // Fatal style load failure before map is loaded
        if (!this.isLoaded && (errMsg.includes('style') || errMsg.includes('fatal'))) {
          this.showFallback('地圖圖層暫時未能載入，但就近地點清單依然運作正常');
          return;
        }

        // Count tile/network errors before map is loaded. After isLoaded, ignore tile errors (Item 2 fix)
        if (!this.isLoaded) {
          this.tileErrorCount++;
          if (this.tileErrorCount >= 10 && !this.hasError) {
            this.showFallback('地圖圖層暫時未能載入，但就近地點清單依然運作正常');
          }
        }
      });

      // Tap on map to set a new origin pin
      this.map.on('click', (e) => {
        // If clicked on empty map space (not a marker)
        const lat = Number(e.lngLat.lat.toFixed(6));
        const lon = Number(e.lngLat.lng.toFixed(6));
        this.onOriginChange({
          lat,
          lon,
          name: '自訂起點',
          isDefault: false,
          description: '以地圖所選位置為起點'
        });
      });

    } catch (err) {
      console.warn('Map initialization failed:', err);
      this.showFallback('地圖暫時未能顯示，但就近地點清單依然運作正常');
    }
  }

  showFallback(message) {
    this.hasError = true;
    if (this.loadTimeout) {
      clearTimeout(this.loadTimeout);
      this.loadTimeout = null;
    }
    if (this.fallbackContainer) {
      this.fallbackContainer.style.display = 'flex';
      this.fallbackContainer.innerHTML = `
        <div class="map-fallback-card">
          <p class="map-fallback-text">${message}</p>
          <button type="button" class="btn-quiet" id="btn-map-retry">重試載入地圖</button>
        </div>
      `;
      const btn = this.fallbackContainer.querySelector('#btn-map-retry');
      if (btn) {
        btn.addEventListener('click', () => {
          this.fallbackContainer.style.display = 'none';
          this.hasError = false;
          this.tileErrorCount = 0;
          if (this.map) {
            try {
              this.map.remove();
            } catch (e) {
              // ignore
            }
            this.map = null;
          }
          this.init();
        });
      }
    }
    this.onMapError(message);
  }

  updateOriginMarker(origin) {
    if (!this.map) return;

    if (!this.originMarker) {
      // 44x44px touch target (Item 8 fix)
      const el = document.createElement('div');
      el.className = 'origin-marker';
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', '目前起點標記');
      el.innerHTML = `
        <div class="origin-marker-hitbox">
          <div class="origin-marker-halo"></div>
          <div class="origin-marker-dot"></div>
          <div class="origin-marker-label">起點</div>
        </div>
      `;

      this.originMarker = new window.maplibregl.Marker({
        element: el,
        draggable: true
      })
        .setLngLat([origin.lon, origin.lat])
        .addTo(this.map);

      this.originMarker.on('dragend', () => {
        const lngLat = this.originMarker.getLngLat();
        this.onOriginChange({
          lat: Number(lngLat.lat.toFixed(6)),
          lon: Number(lngLat.lng.toFixed(6)),
          name: '自訂起點',
          isDefault: false,
          description: '以拖動標記為起點'
        });
      });
    } else {
      this.originMarker.setLngLat([origin.lon, origin.lat]);
    }
  }

  centerOn(lat, lon, zoom = 16) {
    if (!this.map) return;
    this.map.easeTo({
      center: [lon, lat],
      zoom: zoom,
      duration: 500
    });
  }

  renderPlaceMarkers(places) {
    // Keep cached copy of latest places (Item 1 fix)
    this.currentPlaces = places || [];
    if (!this.map || !this.isLoaded) return;

    // Render up to 100 closest places
    const targetPlaces = this.currentPlaces.slice(0, 100);
    const targetIds = new Set(targetPlaces.map(p => p.id));

    // Remove markers no longer in active list
    for (const [id, marker] of this.placeMarkers.entries()) {
      if (!targetIds.has(id)) {
        marker.remove();
        this.placeMarkers.delete(id);
      }
    }

    // Add or update markers with ≥44px hit box (Item 8 fix)
    for (const place of targetPlaces) {
      if (this.placeMarkers.has(place.id)) {
        const marker = this.placeMarkers.get(place.id);
        const el = marker.getElement();
        if (place.id === this.selectedPlaceId) {
          el.classList.add('is-selected');
        } else {
          el.classList.remove('is-selected');
        }
        continue;
      }

      const el = document.createElement('div');
      el.className = `place-marker-wrapper place-marker-${place.category}`;
      if (place.id === this.selectedPlaceId) {
        el.classList.add('is-selected');
      }
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', `${place.name}（${place.categoryLabel}）`);
      el.innerHTML = `
        <div class="place-marker-badge">
          <div class="place-marker-icon">
            ${getIconSvg(place.category)}
          </div>
        </div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation(); // Avoid triggering map click
        this.selectPlace(place.id);
        this.onSelectPlace(place);
      });

      const marker = new window.maplibregl.Marker({ element: el })
        .setLngLat([place.lon, place.lat])
        .addTo(this.map);

      this.placeMarkers.set(place.id, marker);
    }
  }

  selectPlace(placeId) {
    this.selectedPlaceId = placeId;
    for (const [id, marker] of this.placeMarkers.entries()) {
      const el = marker.getElement();
      if (id === placeId) {
        el.classList.add('is-selected');
      } else {
        el.classList.remove('is-selected');
      }
    }
  }
}
