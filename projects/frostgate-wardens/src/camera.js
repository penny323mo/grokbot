// Camera: Pan, Pinch-Zoom, Inertia, Clamping, Auto-Framing, Screen-to-World transforms

export class Camera {
    constructor(viewportWidth, viewportHeight, mapWidth, mapHeight, options = {}) {
        this.vw = viewportWidth;
        this.vh = viewportHeight;
        this.mw = mapWidth;
        this.mh = mapHeight;

        this.hudHeight = options.hudHeight ?? 64;
        this.dockHeight = options.dockHeight ?? 148;

        this.x = 0;
        this.y = 0;
        this.zoom = 1.0;
        this.minZoom = 0.35;
        this.maxZoom = 1.8;

        this.vx = 0;
        this.vy = 0;
        this.isDragging = false;
        this.dragDist = 0;
        this.isPinching = false;
        this.pinchStartDist = 0;
        this.pinchStartZoom = 1.0;
        this.pinchMidX = 0;
        this.pinchMidY = 0;
        this.wasPinching = false;

        this.lastTouchX = 0;
        this.lastTouchY = 0;
        this.lastTouchTime = 0;

        this.lastTapTime = 0;
        this.lastTapX = 0;
        this.lastTapY = 0;

        this.mapBounds = null;
        this.anim = null;

        this.recomputeBounds();
        this.resetView();
    }

    setViewport(w, h) {
        this.vw = w;
        this.vh = h;
        this.recomputeBounds();
        if (this.mapBounds) {
            this.frameBounds(this.mapBounds, 16, false);
        } else {
            this.clamp();
        }
    }

    setMapSize(mw, mh) {
        this.mw = mw;
        this.mh = mh;
        this.recomputeBounds();
        this.resetView();
    }

    getUsableRect(customMargin = null) {
        const top = customMargin?.top ?? this.hudHeight;
        const bottom = customMargin?.bottom ?? this.dockHeight;
        return {
            x: 0,
            y: top,
            width: this.vw,
            height: Math.max(80, this.vh - top - bottom)
        };
    }

    recomputeBounds() {
        this.minZoom = Math.max(this.vw / this.mw, this.vh / this.mh);
        this.maxZoom = 2.2;
    }

    // Extract numerical bounding box { minX, maxX, minY, maxY } from map data or array of points
    extractBounds(boundsOrMap) {
        if (!boundsOrMap) return null;
        if (typeof boundsOrMap.minX === 'number' && typeof boundsOrMap.maxX === 'number') {
            return {
                minX: boundsOrMap.minX,
                maxX: boundsOrMap.maxX,
                minY: boundsOrMap.minY,
                maxY: boundsOrMap.maxY
            };
        }

        const pts = [];
        if (Array.isArray(boundsOrMap)) {
            pts.push(...boundsOrMap);
        } else {
            if (boundsOrMap.paths) {
                boundsOrMap.paths.forEach(p => pts.push(...p));
            } else if (boundsOrMap.waypoints) {
                pts.push(...boundsOrMap.waypoints);
            }
            if (boundsOrMap.plots) pts.push(...boundsOrMap.plots);
            if (boundsOrMap.spawn_pos) pts.push(boundsOrMap.spawn_pos);
            if (boundsOrMap.castle_pos) pts.push(boundsOrMap.castle_pos);
        }

        if (pts.length === 0) return null;

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (const p of pts) {
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
        }

        // Expand bounds for grand keep spires (above castle_pos) and enemy spawn mouths (below spawn_pos)
        // so that castle turrets and spawn portals remain 100% visible inside the usable safe frame.
        if (boundsOrMap.castle_pos) {
            minY = Math.min(minY, boundsOrMap.castle_pos.y - 140);
        }
        if (boundsOrMap.spawn_pos) {
            maxY = Math.max(maxY, boundsOrMap.spawn_pos.y + 24);
        }
        if (boundsOrMap.paths) {
            for (const path of boundsOrMap.paths) {
                if (path.length > 0) {
                    maxY = Math.max(maxY, path[0].y + 24);
                }
            }
        }

        return { minX, maxX, minY, maxY, pts };
    }

    /**
     * Fit camera zoom and position so that all points within bounds fit inside usableRect
     * @param {Object|Array} boundsOrMap - Bounding box { minX, maxX, minY, maxY } or mapData
     * @param {number|Object} padding - Padding in CSS px (default 16)
     * @param {boolean} animate - Whether to animate smoothly (~400ms)
     * @param {Object} usableRect - Optional override for usable screen rect
     */
    frameBounds(boundsOrMap, padding = 16, animate = false, usableRect = null) {
        const bounds = this.extractBounds(boundsOrMap);
        if (!bounds) return;
        this.mapBounds = bounds;

        const usable = usableRect || this.getUsableRect();
        const padX = typeof padding === 'number' ? padding : (padding.left ?? 16);
        const padY = typeof padding === 'number' ? padding : (padding.top ?? 16);

        const availW = Math.max(10, usable.width - padX * 2);
        const availH = Math.max(10, usable.height - padY * 2);

        const bw = Math.max(1, bounds.maxX - bounds.minX);
        const bh = Math.max(1, bounds.maxY - bounds.minY);

        const fitZoom = Math.min(availW / bw, availH / bh);
        const coverZoom = Math.max(this.vw / this.mw, this.vh / this.mh);
        this.minZoom = coverZoom;
        this.maxZoom = Math.max(coverZoom * 2.5, 2.2);
        const targetZoom = Math.max(this.minZoom, fitZoom);

        const bcx = (bounds.minX + bounds.maxX) / 2;
        const bcy = (bounds.minY + bounds.maxY) / 2;

        const targetScreenX = usable.x + usable.width / 2;
        const targetScreenY = usable.y + usable.height / 2;

        const targetX = targetScreenX - bcx * targetZoom;
        const targetY = targetScreenY - bcy * targetZoom;

        if (animate) {
            this.anim = {
                startX: this.x,
                startY: this.y,
                startZoom: this.zoom,
                targetX,
                targetY,
                targetZoom,
                startTime: performance.now(),
                duration: 400
            };
        } else {
            this.anim = null;
            this.zoom = targetZoom;
            this.x = targetX;
            this.y = targetY;
            this.clamp();
        }
    }

    autoFrame(duration = 400) {
        if (this.isDragging || this.isPinching) return;
        if (this.mapBounds) {
            this.frameBounds(this.mapBounds, 16, true);
        }
    }

    resetView() {
        if (this.mapBounds) {
            this.frameBounds(this.mapBounds, 16, false);
        } else {
            this.zoom = Math.max(this.minZoom, this.vw / this.mw);
            this.x = (this.vw - this.mw * this.zoom) / 2;
            this.y = (this.vh - this.mh * this.zoom) / 2;
            this.clamp();
        }
    }

    clamp() {
        const curW = this.mw * this.zoom;
        const curH = this.mh * this.zoom;

        const minX = Math.min(0, this.vw - curW);
        const maxX = Math.max(0, this.vw - curW);
        this.x = Math.max(minX, Math.min(maxX, this.x));

        const minY = Math.min(0, this.vh - curH);
        const maxY = Math.max(0, this.vh - curH);
        this.y = Math.max(minY, Math.min(maxY, this.y));
    }

    update(dt) {
        if (this.anim) {
            const now = performance.now();
            const p = Math.min(1.0, (now - this.anim.startTime) / this.anim.duration);
            // Cubic ease in-out
            const ease = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;

            this.x = this.anim.startX + (this.anim.targetX - this.anim.startX) * ease;
            this.y = this.anim.startY + (this.anim.targetY - this.anim.startY) * ease;
            this.zoom = this.anim.startZoom + (this.anim.targetZoom - this.anim.startZoom) * ease;
            this.clamp();

            if (p >= 1.0) {
                this.anim = null;
            }
        } else if (!this.isDragging && (Math.abs(this.vx) > 0.5 || Math.abs(this.vy) > 0.5)) {
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            this.vx *= Math.pow(0.88, dt * 60);
            this.vy *= Math.pow(0.88, dt * 60);
            this.clamp();
        }
    }

    screenToWorld(sx, sy) {
        return {
            x: (sx - this.x) / this.zoom,
            y: (sy - this.y) / this.zoom
        };
    }

    worldToScreen(wx, wy) {
        return {
            x: wx * this.zoom + this.x,
            y: wy * this.zoom + this.y
        };
    }

    // --- Touch / Mouse event handlers ---

    onTouchStart(e) {
        this.anim = null; // Cancel any active auto-frame animation on touch
        const touches = e.touches;
        if (touches.length === 1) {
            this.isDragging = true;
            this.isPinching = false;
            this.dragDist = 0;
            this.lastTouchX = touches[0].clientX;
            this.lastTouchY = touches[0].clientY;
            this.lastTouchTime = performance.now();
            this.vx = 0;
            this.vy = 0;
        } else if (touches.length === 2) {
            this.isDragging = false;
            this.isPinching = true;
            this.wasPinching = true;
            this.pinchStartDist = Math.hypot(
                touches[0].clientX - touches[1].clientX,
                touches[0].clientY - touches[1].clientY
            );
            this.pinchStartZoom = this.zoom;
            this.pinchMidX = (touches[0].clientX + touches[1].clientX) / 2;
            this.pinchMidY = (touches[0].clientY + touches[1].clientY) / 2;
        }
    }

    onTouchMove(e) {
        const touches = e.touches;
        if (this.isDragging && touches.length === 1) {
            const cx = touches[0].clientX;
            const cy = touches[0].clientY;
            const dx = cx - this.lastTouchX;
            const dy = cy - this.lastTouchY;
            this.dragDist += Math.hypot(dx, dy);

            this.x += dx;
            this.y += dy;
            this.clamp();

            const now = performance.now();
            const dt = (now - this.lastTouchTime) / 1000;
            if (dt > 0.005) {
                this.vx = dx / dt;
                this.vy = dy / dt;
            }

            if (this.dragDist >= 12 && this.onMove) {
                this.onMove();
            }

            this.lastTouchX = cx;
            this.lastTouchY = cy;
            this.lastTouchTime = now;
        } else if (this.isPinching && touches.length === 2) {
            const dist = Math.hypot(
                touches[0].clientX - touches[1].clientX,
                touches[0].clientY - touches[1].clientY
            );
            const midX = (touches[0].clientX + touches[1].clientX) / 2;
            const midY = (touches[0].clientY + touches[1].clientY) / 2;

            // Zoom around midpoint of fingers
            const worldMid = this.screenToWorld(this.pinchMidX, this.pinchMidY);
            const factor = dist / Math.max(10, this.pinchStartDist);
            const targetZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.pinchStartZoom * factor));

            this.zoom = targetZoom;
            this.x = midX - worldMid.x * this.zoom;
            this.y = midY - worldMid.y * this.zoom;
            this.clamp();

            this.pinchMidX = midX;
            this.pinchMidY = midY;

            if (Math.abs(targetZoom - this.pinchStartZoom) >= 0.04 && this.onMove) {
                this.onMove();
            }
        }
    }

    onTouchEnd(e) {
        if (e.touches.length === 0) {
            const wasGesture = this.dragDist >= 8 || this.wasPinching;
            this.isDragging = false;
            this.isPinching = false;
            this.wasPinching = false;
            return !wasGesture; // Clean tap only
        } else if (e.touches.length === 1) {
            this.isPinching = false;
            this.isDragging = true;
            this.lastTouchX = e.touches[0].clientX;
            this.lastTouchY = e.touches[0].clientY;
            this.lastTouchTime = performance.now();
            this.vx = 0;
            this.vy = 0;
        }
        return false;
    }

    checkDoubleTap(sx, sy) {
        const now = performance.now();
        const dt = now - this.lastTapTime;
        const dist = Math.hypot(sx - this.lastTapX, sy - this.lastTapY);
        this.lastTapTime = now;
        this.lastTapX = sx;
        this.lastTapY = sy;

        if (dt < 320 && dist < 24) {
            if (this.mapBounds) {
                this.frameBounds(this.mapBounds, 16, true);
            } else {
                this.resetView();
            }
            return true;
        }
        return false;
    }
}
