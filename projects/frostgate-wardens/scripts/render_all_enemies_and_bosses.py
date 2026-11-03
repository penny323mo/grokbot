import sys
import os
import bpy

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import blender_utils
import build_models_more

def delete_hierarchy(obj):
    for child in list(obj.children):
        delete_hierarchy(child)
    bpy.data.objects.remove(obj, do_unlink=True)

def render_sprite(builder_fn, args, out_path, ortho_scale=3.5, res=160):
    root = builder_fn(*args)
    bpy.context.scene.camera.data.ortho_scale = ortho_scale
    bpy.context.scene.render.resolution_x = res
    bpy.context.scene.render.resolution_y = res
    bpy.context.scene.render.filepath = out_path
    bpy.ops.render.render(write_still=True)
    delete_hierarchy(root)
    print(f"Rendered: {out_path}")

def main():
    scene = blender_utils.reset_scene()
    blender_utils.setup_diorama_lights()
    cam = blender_utils.setup_isometric_camera(ortho_scale=3.6, center=(0, 0, 0.9))

    os.makedirs("assets/enemies", exist_ok=True)
    os.makedirs("assets/bosses", exist_ok=True)

    # 4 Regular Enemies
    enemies = [
        ("flyer", build_models_more.build_enemy_flyer, 3.2),
        ("healer", build_models_more.build_enemy_healer, 2.8),
        ("swarm", build_models_more.build_enemy_swarm, 2.0),
        ("fast", build_models_more.build_enemy_fast, 2.6),
    ]

    for name, fn, scale in enemies:
        for frame in [0, 1]:
            out = f"assets/enemies/{name}_{frame}.png"
            render_sprite(fn, (frame,), out, ortho_scale=scale, res=128)

    # 5 Region Bosses
    bosses = [
        ("boss_1", build_models_more.build_boss_1, 4.4),
        ("boss_2", build_models_more.build_boss_2, 4.2),
        ("boss_3", build_models_more.build_boss_3, 4.8),
        ("boss_4", build_models_more.build_boss_4, 4.5),
        ("boss_5", build_models_more.build_boss_5, 5.2),
    ]

    for name, fn, scale in bosses:
        out = f"assets/bosses/{name}.png"
        render_sprite(fn, (0,), out, ortho_scale=scale, res=192)

    print("ALL REMAINING ENEMIES AND BOSSES RENDERED!")

if __name__ == "__main__":
    main()
