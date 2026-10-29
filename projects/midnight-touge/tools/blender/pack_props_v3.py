#!/usr/bin/env python3
"""Pack additional Kenney racing / suburban / commercial roadside props as self-contained GLBs."""
import bpy
import shutil
from pathlib import Path

ROOT = Path("/workspace/nightly/2026-10-29-midnight-touge")
OUT = ROOT / "assets/models/props"
OUT.mkdir(parents=True, exist_ok=True)
KENNEY = ROOT / "assets/source/kenney/extracted"

# (out_name, source_glb_or_gltf)
PACK = [
  # Racing kit — pit / gantry / billboard / flags (glTF separate)
  ("pit_garage", KENNEY / "racing-kit/Models/glTF format/pitsGarage.gltf"),
  ("pit_office", KENNEY / "racing-kit/Models/glTF format/pitsOffice.gltf"),
  ("billboard", KENNEY / "racing-kit/Models/glTF format/billboard.gltf"),
  ("billboard_low", KENNEY / "racing-kit/Models/glTF format/billboardLow.gltf"),
  ("grandstand", KENNEY / "racing-kit/Models/glTF format/grandStand.gltf"),
  ("flag_checkers", KENNEY / "racing-kit/Models/glTF format/flagCheckers.gltf"),
  ("flag_red", KENNEY / "racing-kit/Models/glTF format/flagRed.gltf"),
  ("overhead_gantry", KENNEY / "racing-kit/Models/glTF format/overhead.gltf"),
  ("overhead_round", KENNEY / "racing-kit/Models/glTF format/overheadRound.gltf"),
  ("rail_barrier", KENNEY / "racing-kit/Models/glTF format/rail.gltf"),
  ("pylon", KENNEY / "racing-kit/Models/glTF format/pylon.gltf"),
  ("ramp", KENNEY / "racing-kit/Models/glTF format/ramp.gltf"),
  # Suburban mountain houses
  ("house_d", KENNEY / "city-suburban/Models/GLB format/building-type-d.glb"),
  ("house_e", KENNEY / "city-suburban/Models/GLB format/building-type-e.glb"),
  ("house_f", KENNEY / "city-suburban/Models/GLB format/building-type-f.glb"),
  ("house_g", KENNEY / "city-suburban/Models/GLB format/building-type-g.glb"),
  ("house_h", KENNEY / "city-suburban/Models/GLB format/building-type-h.glb"),
  ("house_i", KENNEY / "city-suburban/Models/GLB format/building-type-i.glb"),
  ("fence_low", KENNEY / "city-suburban/Models/GLB format/fence-low.glb"),
  # Commercial — rest stop / toll / kiosk vibes
  ("shop_a", KENNEY / "city-commercial/Models/GLB format/building-a.glb"),
  ("shop_b", KENNEY / "city-commercial/Models/GLB format/building-b.glb"),
  ("shop_c", KENNEY / "city-commercial/Models/GLB format/building-c.glb"),
  ("shop_wide", KENNEY / "city-commercial/Models/GLB format/low-detail-building-wide-a.glb"),
  ("awning", KENNEY / "city-commercial/Models/GLB format/detail-awning.glb"),
  ("parasol", KENNEY / "city-commercial/Models/GLB format/detail-parasol-a.glb"),
  # Roads — tunnel mouth / toll framing
  ("road_crossing", KENNEY / "city-roads/Models/GLB format/road-crossing.glb"),
  ("traffic_light", KENNEY / "city-roads/Models/GLB format/traffic-light-object-hanging.glb"),
  ("road_barrier_end", KENNEY / "city-roads/Models/GLB format/road-end-round-barrier.glb"),
  # Nature extras
  ("tree_pine", KENNEY / "nature-kit/Models/GLTF format/tree_pineTallD.glb"),
  ("stone_large", KENNEY / "nature-kit/Models/GLTF format/stone_largeA.glb"),
  ("cliff_block", KENNEY / "nature-kit/Models/GLTF format/cliff_block_rock.glb"),
]


# Extra tunnel / toll / roadside (appended)
EXTRA = [
  ("tunnel_mouth_l", KENNEY / "nature-kit/Models/GLTF format/cliff_cave_rock.glb"),
  ("tunnel_mouth_r", KENNEY / "nature-kit/Models/GLTF format/cliff_blockCave_rock.glb"),
  ("bridge_pillar", KENNEY / "city-roads/Models/GLB format/bridge-pillar.glb"),
  ("road_bridge", KENNEY / "city-roads/Models/GLB format/road-bridge.glb"),
  ("sign_highway", KENNEY / "city-roads/Models/GLB format/sign-highway.glb"),
  ("sign_highway_wide", KENNEY / "city-roads/Models/GLB format/sign-highway-wide.glb"),
  ("construction_barrier", KENNEY / "city-roads/Models/GLB format/construction-barrier.glb"),
  ("stone_bridge", KENNEY / "nature-kit/Models/GLTF format/bridge_stone.glb"),
]
PACK = PACK + EXTRA

# Filter Nones and missing
PACK = [(n, p) for n, p in PACK if p is not None and Path(p).exists()]

# Ensure colormap textures available next to outputs
for tex_src in [
  KENNEY / "city-suburban/Models/GLB format/Textures/colormap.png",
  KENNEY / "city-commercial/Models/GLB format/Textures/colormap.png",
  KENNEY / "city-roads/Models/GLB format/Textures/colormap.png",
  KENNEY / "racing-kit/Models/glTF format/Textures",
]:
  if tex_src.is_file():
    dest = OUT / "Textures"
    dest.mkdir(exist_ok=True)
    shutil.copy2(tex_src, dest / "colormap.png")
  elif tex_src.is_dir():
    dest = OUT / "Textures"
    dest.mkdir(exist_ok=True)
    for f in tex_src.iterdir():
      if f.suffix.lower() in (".png", ".jpg"):
        shutil.copy2(f, dest / f.name)

def reset():
  bpy.ops.wm.read_factory_settings(use_empty=True)

def pack_one(name, src: Path):
  reset()
  src = Path(src)
  # Copy sidecar textures next to temp import if needed
  if src.suffix.lower() == ".gltf":
    # ensure textures folder nearby
    pass
  bpy.ops.import_scene.gltf(filepath=str(src))
  # Parent all under root empty
  root = bpy.data.objects.new(name, None)
  bpy.context.scene.collection.objects.link(root)
  for o in list(bpy.data.objects):
    if o == root:
      continue
    if o.parent is None:
      mw = o.matrix_world.copy()
      o.parent = root
      o.matrix_world = mw
  out = OUT / f"{name}.glb"
  bpy.ops.export_scene.gltf(
    filepath=str(out),
    export_format="GLB",
    export_apply=True,
    export_yup=True,
  )
  print(f"  packed {out.name} ({out.stat().st_size} bytes)")

def main():
  print(f"packing {len(PACK)} props")
  for name, src in PACK:
    try:
      pack_one(name, src)
    except Exception as e:
      print(f"  FAIL {name}: {e}")
  print("DONE")

if __name__ == "__main__":
  main()
