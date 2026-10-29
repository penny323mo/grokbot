#!/usr/bin/env python3
"""Pack Kenney + Grab3D roadside props into assets/models/props/*.glb"""
import bpy
from pathlib import Path
from mathutils import Vector, Matrix
import json

ROOT = Path("/workspace/nightly/2026-10-29-midnight-touge")
OUT = ROOT / "assets/models/props"
OUT.mkdir(parents=True, exist_ok=True)
KENNEY = ROOT / "assets/source/kenney"
PROPS = ROOT / "assets/source/props"

JOBS = []

# Grab3D / Quaternius props (already GLB)
for name, src in [
  ("tea_house", PROPS / "tea-house.glb"),
  ("tea_terrace", PROPS / "tea-terrace.glb"),
  ("feudal_tea_house", PROPS / "feudal-tea-house.glb"),
  ("covered_bridge", PROPS / "covered-bridge.glb"),
  ("stone_house", PROPS / "stone-house.glb"),
  ("torii", PROPS / "torii.glb"),
  ("vending_machine", PROPS / "vending-machine.glb"),
]:
  if src.exists():
    JOBS.append((name, src, "gltf"))

# Kenney GLTFs — nature trees/rocks, signs, poles from city kits
kenney_globs = [
  ("tree_pine", KENNEY / "nature", ["tree_pineDefault.glb", "tree_pineSmall.glb", "Tree_1.glb", "tree.glb"]),
  ("rock", KENNEY / "nature", ["rock_largeA.glb", "rock.glb", "Rock_1.glb"]),
  ("sign_stop", KENNEY / "city-roads", ["sign.glb", "road-sign.glb"]),
]
# Scan kenney folders for useful files
def scan(folder, keywords, out_prefix):
  if not folder.exists():
    return
  for p in folder.rglob("*"):
    if p.suffix.lower() not in (".glb", ".gltf", ".fbx", ".obj"):
      continue
    low = p.stem.lower()
    if any(k in low for k in keywords):
      JOBS.append((f"{out_prefix}_{p.stem}"[:48], p, "auto"))

scan(KENNEY / "nature", ["tree", "pine", "rock", "cliff", "detail"], "nat")
scan(KENNEY / "city-roads", ["sign", "light", "pole", "barrier", "cone"], "road")
scan(KENNEY / "city-suburban", ["house", "garage", "fence", "mailbox", "power"], "sub")
scan(KENNEY / "city-commercial", ["shop", "store", "booth", "gas", "building", "kiosk"], "com")
scan(KENNEY / "racing", ["barrier", "cone", "start", "finish", "grandstand", "tent"], "race")
scan(KENNEY / "car-kit", ["barrier", "cone", "ramp"], "carkit")

# Deduplicate by out name
seen = set()
uniq = []
for name, src, kind in JOBS:
  key = name.lower()
  if key in seen:
    continue
  seen.add(key)
  uniq.append((name, src, kind))
JOBS = uniq[:80]  # cap

print(f"Packing {len(JOBS)} props...")

def reset():
  bpy.ops.wm.read_factory_settings(use_empty=True)

def import_any(path: Path):
  s = path.suffix.lower()
  if s in (".glb", ".gltf"):
    bpy.ops.import_scene.gltf(filepath=str(path))
  elif s == ".fbx":
    bpy.ops.import_scene.fbx(filepath=str(path))
  elif s == ".obj":
    bpy.ops.wm.obj_import(filepath=str(path))
  else:
    raise RuntimeError(f"unsupported {s}")

def export_glb(path: Path):
  bpy.ops.export_scene.gltf(filepath=str(path), export_format="GLB", export_apply=True, export_yup=True)

report = []
for name, src, kind in JOBS:
  try:
    reset()
    import_any(src)
    out = OUT / f"{name}.glb"
    export_glb(out)
    sz = out.stat().st_size
    report.append({"name": name, "src": str(src.relative_to(ROOT)), "bytes": sz, "ok": True})
    print(f"  OK {name} ({sz} B) <- {src.name}")
  except Exception as e:
    report.append({"name": name, "src": str(src), "ok": False, "err": str(e)})
    print(f"  FAIL {name}: {e}")

(ROOT / "assets/source/props_pack_report.json").write_text(json.dumps(report, indent=2))
ok = sum(1 for r in report if r.get("ok"))
print(f"DONE {ok}/{len(report)}")
