#!/usr/bin/env python3
"""Curated Kenney + Grab3D roadside props → assets/models/props/*.glb"""
import bpy, shutil, json
from pathlib import Path

ROOT = Path("/workspace/nightly/2026-10-29-midnight-touge")
OUT = ROOT / "assets/models/props"
OUT.mkdir(parents=True, exist_ok=True)
K = ROOT / "assets/source/kenney/extracted"
P = ROOT / "assets/source/props"

# (out_name, path) — prefer already-GLB for fast copy
COPIES = [
  ("tea_house", P / "tea-house.glb"),
  ("covered_bridge", P / "covered-bridge.glb"),
  ("stone_house", P / "stone-house.glb"),
  ("torii", P / "torii.glb"),
  ("feudal_tea_house", P / "feudal-japan-castle-town-tea-house-a168f962.glb"),
  ("vending_machine", P / "japanese-school-and-city-street-vending-machine-e6d81bc5.glb"),
  ("tea_terrace", P / "tea-garden-and-processing-house-tea-garden-and-process-9becfa65.glb"),
  # Kenney nature rocks / cliffs
  ("rock_large_a", K / "nature-kit/Models/GLTF format/rock_largeA.glb"),
  ("rock_large_b", K / "nature-kit/Models/GLTF format/rock_largeB.glb"),
  ("rock_tall_a", K / "nature-kit/Models/GLTF format/rock_tallA.glb"),
  ("rock_tall_b", K / "nature-kit/Models/GLTF format/rock_tallB.glb"),
  ("cliff_rock", K / "nature-kit/Models/GLTF format/cliff_rock.glb"),
  ("cliff_large_rock", K / "nature-kit/Models/GLTF format/cliff_large_rock.glb"),
  ("cliff_top_rock", K / "nature-kit/Models/GLTF format/cliff_top_rock.glb"),
  ("plant_bush_large", K / "nature-kit/Models/GLTF format/plant_bushLarge.glb"),
  ("plant_bush", K / "nature-kit/Models/GLTF format/plant_bush.glb"),
  # Suburban trees (stand-in pines)
  ("tree_large", K / "city-suburban/Models/GLB format/tree-large.glb"),
  ("tree_small", K / "city-suburban/Models/GLB format/tree-small.glb"),
  # Roads: poles, signs, lights, barriers
  ("power_pole", K / "city-roads/Models/GLB format/electricity-pole.glb"),
  ("power_pole_wide", K / "city-roads/Models/GLB format/electricity-pole-wide.glb"),
  ("sign_stop", K / "city-roads/Models/GLB format/road-sign-stop.glb"),
  ("sign_warning", K / "city-roads/Models/GLB format/road-sign-warning.glb"),
  ("sign_street", K / "city-roads/Models/GLB format/road-sign-street.glb"),
  ("street_light", K / "city-roads/Models/GLB format/light-curved.glb"),
  ("street_light_double", K / "city-roads/Models/GLB format/light-curved-double.glb"),
  ("barrier_cone", K / "city-roads/Models/GLB format/construction-cone.glb"),
  ("barrier_construction", K / "city-roads/Models/GLB format/construction-barrier.glb"),
  # Suburban mountain houses
  ("house_a", K / "city-suburban/Models/GLB format/building-type-a.glb"),
  ("house_b", K / "city-suburban/Models/GLB format/building-type-c.glb"),
  ("house_c", K / "city-suburban/Models/GLB format/building-type-e.glb"),
  ("fence", K / "city-suburban/Models/GLB format/fence.glb"),
  # Commercial booth-like (toll / kiosk stand-in)
  ("booth_a", K / "city-commercial/Models/GLB format/low-detail-building-a.glb"),
  ("booth_b", K / "city-commercial/Models/GLB format/low-detail-building-c.glb"),
  ("awning", K / "city-commercial/Models/GLB format/detail-awning.glb"),
]

# glTF (not GLB) from racing kit — need Blender convert
CONVERTS = [
  ("barrier_red", K / "racing-kit/Models/glTF format/barrierRed.gltf"),
  ("barrier_wall", K / "racing-kit/Models/glTF format/barrierWall.gltf"),
  ("overhead_lights", K / "racing-kit/Models/glTF format/overheadLights.gltf"),
  ("tent", K / "racing-kit/Models/glTF format/tent.gltf"),
  ("road_start", K / "racing-kit/Models/glTF format/roadStart.gltf"),
  ("light_red_double", K / "racing-kit/Models/glTF format/lightRedDouble.gltf"),
]

report = []

def reset():
  bpy.ops.wm.read_factory_settings(use_empty=True)

for name, src in COPIES:
  if not src.exists():
    report.append({"name": name, "ok": False, "err": f"missing {src}"})
    print("MISSING", name, src)
    continue
  dst = OUT / f"{name}.glb"
  shutil.copy2(src, dst)
  report.append({"name": name, "ok": True, "bytes": dst.stat().st_size, "via": "copy"})
  print("COPY", name, dst.stat().st_size)

for name, src in CONVERTS:
  if not src.exists():
    report.append({"name": name, "ok": False, "err": f"missing {src}"})
    print("MISSING", name, src)
    continue
  try:
    reset()
    bpy.ops.import_scene.gltf(filepath=str(src))
    dst = OUT / f"{name}.glb"
    bpy.ops.export_scene.gltf(filepath=str(dst), export_format="GLB", export_apply=True, export_yup=True)
    report.append({"name": name, "ok": True, "bytes": dst.stat().st_size, "via": "convert"})
    print("CONV", name, dst.stat().st_size)
  except Exception as e:
    report.append({"name": name, "ok": False, "err": str(e)})
    print("FAIL", name, e)

(ROOT / "assets/source/props_pack_report.json").write_text(json.dumps(report, indent=2))
print("DONE", sum(1 for r in report if r["ok"]), "/", len(report))
