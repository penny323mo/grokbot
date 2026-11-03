// Camera: Pan, Pinch-Zoom, Inertia, Clamping, Screen-to-World transforms

export class Camera {
    constructor(viewportWidth, viewportHeight, mapWidth, mapHeight) {
        this.vw = viewportWidth;
        this.vh = viewportHeight;
        this.mw = mapWidth;
        this.mh = mapHeight;

        this.x = 0;
        this.y = 0;
        this.zoom = 1.0;
        this.minZoom = 0.5;
        this.maxZoom = 1.4;

        this.vx = 0;
        this.vy = 0;
        this.isDragging = false;
        this.dragDist = 0;
        this.isPinching = false;
        this.pinchStartDist = 0;
        this.pinchStartZoom = 1.0;

        this.lastTouchX = 0;
        this.lastTouchY = 0;
        this.lastTouchTime = 0;

        this.lastTapTime = 0;
        this.lastTapX = 0;
        this.lastTapY = 0;

        this.recomputeBounds();
        this.resetView();
    }

    setViewport(w, h) {
        this.vw = w;
        this.vh = h;
        this.recomputeBounds();
        this.clamp();
    }

    setMapSize(mw, mh) {
        this.mw = mw;
        this.mh = mh;
        this.recomputeBounds();
        this.resetView();
    }

    recomputeBounds() {
        this.minZoom = Math.min(0.4, this.vw / this.mw);
        this.maxZoom = 1.8;
    }

    resetView() {
        // Opening zoom makes the map ~1.45x the viewport height so pan has ample room
        this.zoom = Math.max(this.minZoom, (this.vh * 1.45) / this.mh);
        // Center around the map's active road and plots
        const targetWorldX = this.mw * 0.48;
        const targetWorldY = this.mh * 0.52;
        this.x = (this.vw / 2) - targetWorldX * this.zoom;
        this.y = (this.vh / 2) - targetWorldY * this.zoom;
        this.clamp();
    }

    clamp() {
        const curW = this.mw * this.zoom;
        const curH = this.mh * this.zoom;

        if (curW <= this.vw) {
            this.x = (this.vw - curW) / 2;
        } else {
            const minX = this.vw - curW;
            const maxX = 0;
            this.x = Math.max(minX, Math.min(maxX, this.x));
        }

        if (curH <= this.vh) {
            this.y = (this.vh - curH) / 2;
        } else {
            const minY = this.vh - curH;
            const maxY = 0;
            this.y = Math.max(minY, Math.min(maxY, this.y));
        }
    }

    update(dt) {
        if (!this.isDragging && (Math.abs(this.vx) > 0.5 || Math.abs(this.vy) > 0.5)) {
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
            this.pinchStartDist = Math.hypot(
                touches[0].clientX - touches[1].clientX,
                touches[0].clientY - touches[1].clientY
            );
            this.pinchStartZoom = this.zoom;
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
            const factor = dist / Math.max(10, this.pinchStartDist);
            const targetZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.pinchStartZoom * factor));

            // Zoom centered on midpoint of touches
            const midX = (touches[0].clientX + touches[1].clientX) / 2;
            const midY = (touches[0].clientY + touches[1].clientY) / 2;
            const worldMid = this.screenToWorld(midX, midY);

            this.zoom = targetZoom;
            this.x = midX - worldMid.x * this.zoom;
            this.y = midY - worldMid.y * this.zoom;
            this.clamp();

            if (Math.abs(targetZoom - this.pinchStartZoom) >= 0.04 && this.onMove) {
                this.onMove();
            }
        }
    }

    onTouchEnd(e) {
        if (e.touches.length === 0) {
            const wasDrag = this.dragDist >= 8;
            this.isDragging = false;
            this.isPinching = false;
            return !wasDrag; // true if it was a clean tap (< 8px movement)
        } else if (e.touches.length === 1) {
            this.isPinching = false;
            this.isDragging = true;
            this.lastTouchX = e.touches[0].clientX;
            this.lastTouchY = e.touches[0].clientY;
            this.lastTouchTime = performance.now();
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
            this.resetView();
            return true;
        }
        return false;
    }
}
