// Track Collision & Sector Progression Tracker for Midnight Touge (《夜峠》)
import { KIRINE_PASS_TRACK } from '../data/track_data.js';

export class TrackCollision {
  constructor(trackData = KIRINE_PASS_TRACK) {
    this.track = trackData;
    this.waypoints = trackData.waypoints;
    this.roadHalfWidth = 4.25; // 8.5m wide
    this.reset();
  }

  reset() {
    this.currentWaypointIndex = 0;
    this.distanceAlongTrack = 0;
    this.lateralOffset = 0;
    this.currentSector = 1;
    this.sectorTimes = {};
    this.completed = false;
    this.finishTime = 0;
    this.isInGutter = false;
    this.wallCollision = null;
    this.checkpointsPassed = new Set();
    this.startDist = 0;
    this.targetDist = (this.track && this.track.totalLength) || 2990;
    this.direction = "downhill";
  }

  setSector(startDist = 0, targetDist = 2990, direction = "downhill") {
    this.startDist = startDist;
    this.targetDist = targetDist;
    this.direction = direction;
    this.completed = false;
    this.checkpointsPassed = new Set();

    // Find nearest waypoint to startDist
    let nearestIdx = 0;
    let minDistDiff = Infinity;
    for (let i = 0; i < this.waypoints.length; i++) {
      const diff = Math.abs(this.waypoints[i].dist - startDist);
      if (diff < minDistDiff) {
        minDistDiff = diff;
        nearestIdx = i;
      }
    }
    this.currentWaypointIndex = nearestIdx;
    this.distanceAlongTrack = this.waypoints[nearestIdx].dist;
    return this.waypoints[nearestIdx];
  }

  update(carX, carY, carZ, elapsedTime = 0) {
    const isUphill = this.direction === "uphill";
    let curIdx = this.currentWaypointIndex;
    const curWp = this.waypoints[curIdx];
    const step = isUphill ? -1 : 1;

    // Check if car was teleported far away (> 25m from current waypoint)
    const curDx = carX - curWp.x;
    const curDy = carY - curWp.y;
    const curDistSq = curDx * curDx + curDy * curDy;

    if (curDistSq > 625) {
      // Teleport detected: find nearest waypoint globally
      let nearestIdx = curIdx;
      let minDistSq = Infinity;
      for (let i = 0; i < this.waypoints.length; i++) {
        const wp = this.waypoints[i];
        const dx = carX - wp.x;
        const dy = carY - wp.y;
        const dSq = dx * dx + dy * dy;
        if (dSq < minDistSq) {
          minDistSq = dSq;
          nearestIdx = i;
        }
      }
      curIdx = nearestIdx;
    } else {
      // Continuous driving: strictly step along travel direction by 1 segment
      for (let s = 0; s < 3; s++) {
        const activeWp = this.waypoints[curIdx];
        const nextIdx = Math.max(0, Math.min(this.waypoints.length - 1, curIdx + step));
        const prevIdx = Math.max(0, Math.min(this.waypoints.length - 1, curIdx - step));

        if (curIdx === nextIdx) break;

        const nextWp = this.waypoints[nextIdx];
        const segX = nextWp.x - activeWp.x;
        const segY = nextWp.y - activeWp.y;
        const segLenSq = segX * segX + segY * segY;

        let t = 0.0;
        if (segLenSq > 0.01) {
          t = ((carX - activeWp.x) * segX + (carY - activeWp.y) * segY) / segLenSq;
        }

        if (t >= 0.5 && curIdx !== nextIdx) {
          curIdx = nextIdx;
        } else if (t < -0.5 && curIdx !== prevIdx) {
          curIdx = prevIdx;
        } else {
          break;
        }
      }
    }

    this.currentWaypointIndex = curIdx;
    const activeWp = this.waypoints[curIdx];
    const nextIdx = Math.max(0, Math.min(this.waypoints.length - 1, curIdx + step));
    const nextWp = this.waypoints[nextIdx];

    const segX = nextWp.x - activeWp.x;
    const segY = nextWp.y - activeWp.y;
    const segLenSq = segX * segX + segY * segY;
    let t = 0.0;
    if (segLenSq > 0.01) {
      t = ((carX - activeWp.x) * segX + (carY - activeWp.y) * segY) / segLenSq;
    }
    const segT = Math.max(0.0, Math.min(1.0, t));

    // Smooth interpolated distance along track
    this.distanceAlongTrack = activeWp.dist + (nextWp.dist - activeWp.dist) * segT;

    // Lateral Offset from Centerline
    const projX = activeWp.x + segX * segT;
    const projY = activeWp.y + segY * segT;
    const toCarX = carX - projX;
    const toCarY = carY - projY;
    this.lateralOffset = toCarX * activeWp.rx + toCarY * activeWp.ry;
    const wp = activeWp;

    // 3. Current Sector Tracking
    for (const sec of this.track.sectors) {
      if (this.distanceAlongTrack >= sec.startDist && this.distanceAlongTrack < sec.endDist) {
        if (this.currentSector !== sec.id) {
          this.sectorTimes[this.currentSector] = elapsedTime;
          this.currentSector = sec.id;
        }
        break;
      }
    }

    // 4. Gutter Drop Detection (溝落とし)
    // If waypoint is inside a curve with gutter and car is hugging the inner edge
    let inGutter = false;
    if (wp.tag === "left" && this.lateralOffset < -3.4 && this.lateralOffset > -4.5) {
      inGutter = true;
    } else if (wp.tag === "right" && this.lateralOffset > 3.4 && this.lateralOffset < 4.5) {
      inGutter = true;
    }
    this.isInGutter = inGutter;

    // 5. Wall Collision Detection
    let wallHit = null;
    const carHalfWidth = 0.9;
    const outerBoundary = this.roadHalfWidth + 0.2;

    if (this.lateralOffset + carHalfWidth > outerBoundary) {
      // Hit right guardrail
      const pen = (this.lateralOffset + carHalfWidth) - outerBoundary;
      wallHit = {
        side: "right",
        normalX: -wp.rx,
        normalY: -wp.ry,
        penetration: pen,
        isGuardrail: true
      };
    } else if (this.lateralOffset - carHalfWidth < -outerBoundary) {
      // Hit left cliff / wall
      const pen = -outerBoundary - (this.lateralOffset - carHalfWidth);
      wallHit = {
        side: "left",
        normalX: wp.rx,
        normalY: wp.ry,
        penetration: pen,
        isGuardrail: false
      };
    }
    this.wallCollision = wallHit;

    // 6. Checkpoints Tracking (Every 150m along track)
    const ckptId = Math.floor(this.distanceAlongTrack / 150.0);
    this.checkpointsPassed.add(ckptId);

    // 7. Finish Line Check (Respects startDist, targetDist and direction)
    if (elapsedTime > 0.5 && !this.completed) {
      if (this.direction === "uphill") {
        if (this.distanceAlongTrack <= this.targetDist + 15.0) {
          this.completed = true;
          this.finishTime = elapsedTime;
        }
      } else {
        if (this.distanceAlongTrack >= this.targetDist - 15.0) {
          this.completed = true;
          this.finishTime = elapsedTime;
        }
      }
    }

    return {
      dist: this.distanceAlongTrack,
      offset: this.lateralOffset,
      elevation: wp.z,
      heading: wp.heading,
      bank: wp.bank,
      sector: this.currentSector,
      inGutter,
      wallHit,
      isFinished: this.completed
    };
  }
}
