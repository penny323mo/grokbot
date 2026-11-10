import sys
import os
import math
import bpy

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import blender_utils
import build_models

def delete_hierarchy(obj):
    for child in list(obj.children):
        delete_hierarchy(child)
    bpy.data.objects.remove(obj, do_unlink=True)

def render_sprite(builder_fn, args, out_path, ortho_scale=2.5, res=256, center=(0, 0, 1.05), rot_z=0.0):
    root = builder_fn(*args)
    if rot_z != 0.0:
        root.rotation_euler = (0, 0, rot_z)
    cam = bpy.context.scene.camera
    cam.data.ortho_scale = ortho_scale
    
    # 3/4 isometric perspective matching title_key.webp clay diorama
    el = math.radians(35.264)
    rz = math.radians(45.0)
    distance = 30.0
    cx, cy, cz = center
    cam.location = (
        cx + distance * math.cos(el) * math.sin(rz),
        cy - distance * math.cos(el) * math.cos(rz),
        cz + distance * math.sin(el)
    )
    cam.rotation_euler = (
        math.radians(90 - 35.264),
        0,
        rz
    )
    
    bpy.context.scene.render.resolution_x = res
    bpy.context.scene.render.resolution_y = res
    bpy.context.scene.render.filepath = out_path
    bpy.ops.render.render(write_still=True)
    delete_hierarchy(root)
    print(f"Rendered: {out_path} ({res}x{res}, ortho={ortho_scale})")

def main():
    scene = blender_utils.reset_scene()
    blender_utils.setup_diorama_lights()

    world = bpy.data.worlds.new("SpriteWorld")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get('Background')
    bg.inputs['Color'].default_value = blender_utils.hex_to_linear_rgb('#DDEBF2')
    bg.inputs['Strength'].default_value = 1.0

    cam = blender_utils.setup_isometric_camera(ortho_scale=2.5, center=(0, 0, 1.05))

    os.makedirs("assets/hero", exist_ok=True)

    # Hero: Warden Commander in 3/4 isometric view
    for frame in [0, 1, 2, 3]:
        out = f"assets/hero/hero_{frame}.png"
        render_sprite(build_models.build_hero, (frame,), out, ortho_scale=2.5, res=256, center=(0, 0, 1.05), rot_z=math.radians(35))

    # Guards: Warden Guards in 3/4 isometric view
    for frame in [0, 1, 2, 3]:
        out = f"assets/hero/guard_{frame}.png"
        render_sprite(build_models.build_guard, (frame,), out, ortho_scale=2.5, res=256, center=(0, 0, 0.95), rot_z=math.radians(35))

    print("HERO AND GUARDS RENDERED IN 3/4 ISOMETRIC PERSPECTIVE!")

if __name__ == "__main__":
    main()
