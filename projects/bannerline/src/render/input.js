import * as THREE from 'three';
import { clientToNdc, pickBuilding } from './pointer-math.js';

/**
 * Tap a friendly building, then tap a target — or drag between them.
 * Ground picks use the y=0 plane. Count pills, roofs, and flags also hit
 * when the pointer is within 44 CSS pixels of those screen points.
 */
export function attachInput(canvas, camera, getBuildings, handlers) {
  const raycaster = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const ndc = new THREE.Vector2();
  const hit = new THREE.Vector3();
  let down = null;

  function worldAt(ev) {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return null;
    const p = clientToNdc(ev.clientX, ev.clientY, rect);
    ndc.set(p.x, p.y);
    raycaster.setFromCamera(ndc, camera);
    const ok = raycaster.ray.intersectPlane(plane, hit);
    if (!ok) return null;
    return { x: hit.x, z: hit.z };
  }

  function pick(ev) {
    const rect = canvas.getBoundingClientRect();
    const world = worldAt(ev);
    if (rect.width < 1 || rect.height < 1) return { building: null, world };
    const building = pickBuilding(
      getBuildings(),
      camera,
      rect.width,
      rect.height,
      ev.clientX - rect.left,
      ev.clientY - rect.top,
      world,
    );
    return { building, world };
  }

  canvas.addEventListener('contextmenu', (ev) => ev.preventDefault());

  canvas.addEventListener('pointerdown', (ev) => {
    if (ev.button !== 0 && ev.pointerType === 'mouse') return;
    canvas.setPointerCapture(ev.pointerId);
    handlers.unlock();
    const { building } = pick(ev);
    down = {
      x: ev.clientX,
      y: ev.clientY,
      id: building ? building.id : null,
      owner: building ? building.owner : null,
      dragging: false,
    };
  });

  canvas.addEventListener('pointermove', (ev) => {
    if (!down) return;
    const dist = Math.hypot(ev.clientX - down.x, ev.clientY - down.y);
    if (!down.dragging && dist > 14 && down.id && down.owner === 'player') {
      down.dragging = true;
      handlers.onDragStart(down.id);
    }
    if (!down.dragging) return;
    const { world, building } = pick(ev);
    if (world) handlers.onDragMove(world, building ? building.id : null);
  });

  function finish(ev) {
    if (!down) return;
    const start = down;
    down = null;
    const { building } = pick(ev);
    const targetId = building ? building.id : null;
    if (start.dragging) {
      handlers.onDragEnd(start.id, targetId);
      return;
    }
    handlers.onTap(targetId);
  }

  canvas.addEventListener('pointerup', finish);
  canvas.addEventListener('pointercancel', () => {
    if (!down) return;
    down = null;
    handlers.onDragEnd(null, null);
  });
}
