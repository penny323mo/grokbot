import sys
import os
import bpy

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import blender_utils
import build_models
import render_sprites

scene = blender_utils.reset_scene()
blender_utils.setup_diorama_lights()
os.makedirs("assets/hero", exist_ok=True)
for frame in range(4):
    out = f"assets/hero/guard_{frame}.png"
    render_sprites.render_sprite(build_models.build_guard, (frame,), out, ortho_scale=2.7, res=256, center=(0, 0, 0.95))
print("GUARDS RENDERED SUCCESSFULLY!")
