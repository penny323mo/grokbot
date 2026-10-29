#!/usr/bin/env python3
"""Adapt CC0 Grab3D / 3DAssets cars into game-ready Midnight Touge GLBs.
Creates Wheel_FL/FR/RL/RR empties, clearcoat paint, glass, emissive lights,
optional panda two-tone, decimate ≤60k tris, export GLB.
"""
import bpy
import bmesh
import math
import json
import os
from mathutils import Vector, Matrix
from pathlib import Path

ROOT = Path("/workspace/nightly/2026-10-29-midnight-touge")
SRC = ROOT / "assets/source/cars"
OUT = ROOT / "assets/models"
RND = ROOT / "assets/renders"
OUT.mkdir(parents=True, exist_ok=True)
RND.mkdir(parents=True, exist_ok=True)

# Mapping: game id -> source file + paint recipe
CARS = [
  {
    "id": "h86",
    "aliases": ["rs86"],
    # 1980s sports — era-correct FR coupe/hatch silhouette, separate wheels
    "src": "1980s-sports-car.glb",
    "paint": (0.96, 0.97, 0.99, 1.0),
    "panda": True,
    "secondary": (0.04, 0.045, 0.05, 1.0),
  },
  {
    "id": "gt20",
    "aliases": ["st20"],
    "src": "sports-car.glb",  # 34k muscular Grab3D coupe
    "paint": (0.06, 0.22, 0.24, 1.0),  # brighter emerald for garage
    "panda": False,
  },
  {
    "id": "re7",
    "aliases": ["rx7"],
    "src": "midengine-sports.glb",  # 48k 3DAssets mid-engine, named wheels
    "paint": (0.72, 0.08, 0.08, 1.0),
    "panda": False,
  },
]

WHEEL_PATTERNS = [
  # (FL, FR, RL, RR) name substrings (case-insensitive)
  ("wheel_fl", "wheel_fr", "wheel_rl", "wheel_rr"),
  ("wheel-front-left", "wheel-front-right", "wheel-rear-left", "wheel-rear-right"),
  ("wheel-fl", "wheel-fr", "wheel-rl", "wheel-rr"),
  ("wheel_front_left", "wheel_front_right", "wheel_rear_left", "wheel_rear_right"),
]


def reset():
  bpy.ops.wm.read_factory_settings(use_empty=True)


def import_glb(path: Path):
  bpy.ops.import_scene.gltf(filepath=str(path))


def find_wheels():
  objs = list(bpy.data.objects)
  # Prefer parent empties/groups named wheel-* that contain meshes
  candidates = {}
  for o in objs:
    n = o.name.lower()
    for pats in WHEEL_PATTERNS:
      for corner, pat in zip(("FL", "FR", "RL", "RR"), pats):
        if pat in n and corner not in candidates:
          # Prefer objects that are parents of meshes, or meshes themselves
          candidates[corner] = o
  # If we found mesh leaves like wheel_fl, climb to a common parent or use mesh
  return candidates


def make_wheel_empties(wheel_map):
  """Parent each wheel mesh under Wheel_XX empty at hub center."""
  created = {}
  for corner, obj in wheel_map.items():
    # Compute world-space bounds center
    bpy.context.view_layer.update()
    # Gather mesh objects under obj (or obj itself)
    meshes = []
    if obj.type == "MESH":
      meshes = [obj]
    else:
      meshes = [c for c in obj.children_recursive if c.type == "MESH"]
      if not meshes and obj.type != "MESH":
        # maybe children not recursive attribute in older; manual
        def walk(o, acc):
          for c in o.children:
            if c.type == "MESH":
              acc.append(c)
            walk(c, acc)
        walk(obj, meshes)
    if not meshes:
      meshes = [obj] if obj.type == "MESH" else []
    if not meshes:
      continue
    # bounding box center in world
    coords = []
    for m in meshes:
      for corner_co in m.bound_box:
        coords.append(m.matrix_world @ Vector(corner_co))
    if not coords:
      continue
    center = sum(coords, Vector()) / len(coords)
    empty = bpy.data.objects.new(f"Wheel_{corner}", None)
    empty.empty_display_type = "PLAIN_AXES"
    empty.empty_display_size = 0.15
    bpy.context.scene.collection.objects.link(empty)
    empty.matrix_world = Matrix.Translation(center)
    # Parent original wheel root under empty, keep transform
    root = obj
    # Unparent children from previous parent first
    mw = root.matrix_world.copy()
    root.parent = empty
    root.matrix_world = mw
    created[corner] = empty
  return created


def ensure_principled(mat):
  mat.use_nodes = True
  nt = mat.node_tree
  principled = None
  for n in nt.nodes:
    if n.type == "BSDF_PRINCIPLED":
      principled = n
      break
  if not principled:
    nt.nodes.clear()
    principled = nt.nodes.new("ShaderNodeBsdfPrincipled")
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(principled.outputs[0], out.inputs[0])
  return principled


def set_input(node, name, value, clear_links=True):
  if name in node.inputs:
    sock = node.inputs[name]
    if clear_links and sock.links:
      nt = node.id_data
      for link in list(sock.links):
        nt.links.remove(link)
    if hasattr(sock, "default_value"):
      try:
        sock.default_value = value
      except Exception:
        pass


def apply_paint_to_mat(mat, paint_rgba):
  p = ensure_principled(mat)
  mat.name = "Paint"
  set_input(p, "Base Color", paint_rgba)
  set_input(p, "Metallic", 0.35)
  set_input(p, "Roughness", 0.18)
  set_input(p, "Coat Weight", 1.0)
  set_input(p, "Coat Roughness", 0.05)
  set_input(p, "Clearcoat", 1.0)
  set_input(p, "Clearcoat Roughness", 0.05)
  set_input(p, "Specular IOR Level", 0.55)
  # Kill albedo image texture influence if still linked via Mix
  for n in list(mat.node_tree.nodes):
    if n.type == "TEX_IMAGE" and n.outputs[0].links:
      # leave connected to roughness/normal; only sever if feeding Base Color path — already cleared
      pass
  return mat

def upgrade_materials(panda=False, paint_rgba=(0.9, 0.9, 0.9, 1.0), secondary=(0.05, 0.05, 0.05, 1.0)):
  painted = False
  for mat in list(bpy.data.materials):
    n = (mat.name or "").lower()
    p = ensure_principled(mat)
    # Paint / body — also catch Grab3D sports-car_body_pbr and 3DAssets paint*
    if any(k in n for k in ("body", "paint", "paintc", "painta", "painte", "white", "colormap")) and "wheel" not in n and "tire" not in n and "rim" not in n and "hub" not in n and "glass" not in n and "window" not in n and "light" not in n:
      apply_paint_to_mat(mat, paint_rgba)
      painted = True
    elif "glass" in n or "window" in n:
      mat.name = "Glass"
      set_input(p, "Base Color", (0.02, 0.04, 0.06, 1.0))
      set_input(p, "Metallic", 0.0)
      set_input(p, "Roughness", 0.05)
      set_input(p, "Transmission Weight", 0.85)
      set_input(p, "Transmission", 0.85)
      set_input(p, "Alpha", 0.45)
      mat.blend_method = "BLEND"
      try:
        mat.use_transparency = True
      except Exception:
        pass
    elif any(k in n for k in ("lightwhite", "lightamber", "hl", "head")):
      mat.name = "HeadLight"
      set_input(p, "Base Color", (1.0, 0.95, 0.8, 1.0))
      set_input(p, "Emission Color", (1.0, 0.95, 0.75, 1.0))
      set_input(p, "Emission Strength", 12.0)
      # older
      if "Emission" in p.inputs:
        try:
          p.inputs["Emission"].default_value = (1.0, 0.95, 0.75, 1.0)
        except Exception:
          pass
    elif any(k in n for k in ("lightred", "tail", "tl")):
      mat.name = "TailLight"
      set_input(p, "Base Color", (0.6, 0.02, 0.02, 1.0))
      set_input(p, "Emission Color", (1.0, 0.05, 0.02, 1.0))
      set_input(p, "Emission Strength", 8.0)
    elif "tire" in n or "rubber" in n:
      mat.name = "Tire"
      set_input(p, "Base Color", (0.03, 0.03, 0.03, 1.0))
      set_input(p, "Roughness", 0.85)
      set_input(p, "Metallic", 0.0)
    elif "rim" in n or "alloy" in n or "hubcap" in n or "steel" in n:
      mat.name = "ChromeRim" if "alloy" in n or "steel" in n else "Rim"
      set_input(p, "Base Color", (0.55, 0.55, 0.58, 1.0))
      set_input(p, "Metallic", 0.95)
      set_input(p, "Roughness", 0.22)
    elif "trim" in n or "dark" in n or "interior" in n:
      set_input(p, "Roughness", 0.55)

  if not painted:
    # Fallback: paint the material on the largest non-wheel mesh
    best = None
    best_area = 0
    for o in bpy.data.objects:
      if o.type != "MESH" or "wheel" in o.name.lower():
        continue
      o.data.calc_loop_triangles()
      a = len(o.data.loop_triangles)
      if a > best_area and o.material_slots:
        best_area = a
        best = o
    if best and best.material_slots[0].material:
      apply_paint_to_mat(best.material_slots[0].material, paint_rgba)
      painted = True
      print(f"  fallback painted {best.name} mat")

  # Panda two-tone: darken lower body faces by Z height on body mesh
  if panda:
    apply_panda_two_tone(paint_rgba, secondary)


def apply_panda_two_tone(paint_rgba, secondary):
  """Split body mesh by height: lower portion gets black secondary material."""
  body_objs = [o for o in bpy.data.objects if o.type == "MESH" and ("body" in o.name.lower() or any((s.name or "").lower() in ("paint",) for s in o.material_slots if s.material))]
  if not body_objs:
    body_objs = [o for o in bpy.data.objects if o.type == "MESH" and "body" in o.name.lower()]
  # Create secondary material
  sec = bpy.data.materials.new("PaintSecondary")
  p = ensure_principled(sec)
  set_input(p, "Base Color", secondary)
  set_input(p, "Metallic", 0.25)
  set_input(p, "Roughness", 0.28)
  set_input(p, "Coat Weight", 0.9)
  set_input(p, "Clearcoat", 0.9)
  set_input(p, "Coat Roughness", 0.08)
  set_input(p, "Clearcoat Roughness", 0.08)

  for obj in body_objs:
    if "wheel" in obj.name.lower():
      continue
    # Ensure Paint material slot 0
    if not obj.data.materials:
      continue
    # Add secondary slot
    if sec.name not in [m.name for m in obj.data.materials if m]:
      obj.data.materials.append(sec)
    sec_idx = list(obj.data.materials).index(sec)
    # World Z threshold: bottom 38% of height → secondary
    bpy.context.view_layer.update()
    zs = [(obj.matrix_world @ Vector(c)).z for c in obj.bound_box]
    zmin, zmax = min(zs), max(zs)
    cut = zmin + (zmax - zmin) * 0.38
    mesh = obj.data
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bm.faces.ensure_lookup_table()
    for f in bm.faces:
      # face center world z
      cen = obj.matrix_world @ f.calc_center_median()
      if cen.z < cut:
        f.material_index = sec_idx
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()


def count_tris():
  tris = 0
  for o in bpy.data.objects:
    if o.type != "MESH":
      continue
    me = o.data
    me.calc_loop_triangles()
    tris += len(me.loop_triangles)
  return tris


def decimate_if_needed(max_tris=60000):
  tris = count_tris()
  if tris <= max_tris:
    print(f"  tris={tris} OK")
    return tris
  ratio = max_tris / max(tris, 1)
  print(f"  tris={tris} -> decimate ratio={ratio:.3f}")
  for o in list(bpy.data.objects):
    if o.type != "MESH":
      continue
    if "wheel" in o.name.lower():
      continue  # keep wheel detail
    mod = o.modifiers.new("Decimate", "DECIMATE")
    mod.ratio = max(0.25, min(1.0, ratio * 1.05))
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.modifier_apply(modifier=mod.name)
  return count_tris()


def normalize_scale_to_length(target_len=4.2):
  """Scale whole scene so longest car axis ≈ target_len meters."""
  meshes = [o for o in bpy.data.objects if o.type == "MESH"]
  if not meshes:
    return
  bpy.context.view_layer.update()
  coords = []
  for m in meshes:
    for c in m.bound_box:
      coords.append(m.matrix_world @ Vector(c))
  xs = [c.x for c in coords]; ys = [c.y for c in coords]; zs = [c.z for c in coords]
  size = Vector((max(xs) - min(xs), max(ys) - min(ys), max(zs) - min(zs)))
  longest = max(size.x, size.y, size.z)
  if longest < 1e-3:
    return
  s = target_len / longest
  # Scale via root empties / objects without parents
  roots = [o for o in bpy.data.objects if o.parent is None]
  for r in roots:
    r.scale *= s
  bpy.context.view_layer.update()
  # Drop so wheels sit near z=0
  coords = []
  for m in [o for o in bpy.data.objects if o.type == "MESH"]:
    for c in m.bound_box:
      coords.append(m.matrix_world @ Vector(c))
  zmin = min(c.z for c in coords)
  for r in roots:
    r.location.z -= zmin


def export_glb(path: Path):
  path.parent.mkdir(parents=True, exist_ok=True)
  bpy.ops.export_scene.gltf(
    filepath=str(path),
    export_format="GLB",
    export_apply=True,
    export_yup=True,
  )


def beauty_render(path: Path, label: str):
  scene = bpy.context.scene
  scene.render.engine = "CYCLES"
  scene.cycles.device = "CPU"
  scene.cycles.samples = 24
  scene.render.resolution_x = 960
  scene.render.resolution_y = 540
  scene.render.film_transparent = True
  # Camera
  cam_data = bpy.data.cameras.new("BeautyCam")
  cam = bpy.data.objects.new("BeautyCam", cam_data)
  bpy.context.scene.collection.objects.link(cam)
  scene.camera = cam
  cam.location = (4.2, -5.5, 1.8)
  # Point at origin
  direction = Vector((0, 0, 0.6)) - cam.location
  cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
  # Light
  light_data = bpy.data.lights.new("Key", "AREA")
  light_data.energy = 400
  light_data.size = 4
  light = bpy.data.objects.new("Key", light_data)
  bpy.context.scene.collection.objects.link(light)
  light.location = (3, -2, 4)
  fill = bpy.data.lights.new("Fill", "AREA")
  fill.energy = 120
  fill.size = 6
  fill_o = bpy.data.objects.new("Fill", fill)
  bpy.context.scene.collection.objects.link(fill_o)
  fill_o.location = (-3, 2, 2.5)
  scene.render.filepath = str(path)
  bpy.ops.render.render(write_still=True)
  print("  rendered", path)


def process_car(spec):
  print(f"\n==== {spec['id']} from {spec['src']} ====")
  reset()
  src = SRC / spec["src"]
  if not src.exists():
    print("MISSING", src)
    return False
  import_glb(src)
  wheels = find_wheels()
  print("  wheels found:", {k: v.name for k, v in wheels.items()})
  if len(wheels) < 4:
    print("  WARN: incomplete wheels", wheels.keys())
  make_wheel_empties(wheels)
  upgrade_materials(panda=spec.get("panda", False), paint_rgba=spec["paint"], secondary=spec.get("secondary", (0.05, 0.05, 0.05, 1)))
  normalize_scale_to_length(4.2)
  tris = decimate_if_needed(60000)
  out = OUT / f"car_{spec['id']}.glb"
  export_glb(out)
  print(f"  wrote {out} tris≈{tris} size={out.stat().st_size}")
  for alias in spec.get("aliases", []):
    alias_path = OUT / f"car_{alias}.glb"
    alias_path.write_bytes(out.read_bytes())
    print(f"  alias {alias_path.name}")
  try:
    beauty_render(RND / f"beauty_{spec['id']}_cc0.png", spec["id"])
  except Exception as e:
    print("  beauty render failed:", e)
  return True


def main():
  results = {}
  for spec in CARS:
    ok = process_car(spec)
    results[spec["id"]] = ok
  (ROOT / "assets/source/cars_adapt_report.json").write_text(json.dumps(results, indent=2))
  print("DONE", results)


if __name__ == "__main__":
  main()
