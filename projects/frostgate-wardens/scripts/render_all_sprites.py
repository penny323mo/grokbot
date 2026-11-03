import sys
import os
import bpy

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import blender_utils
import build_models
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
    cam = blender_utils.setup_isometric_camera(ortho_scale=3.6, center=(0, 0, 0.8))

    os.makedirs("assets/enemies", exist_ok=True)
    os.makedirs("assets/bosses", exist_ok=True)
    os.makedirs("assets/hero", exist_ok=True)

    # 1. 8 Enemy Types with 4 walk frames each
    enemies = [
        ("runner", build_models.build_enemy_runner, 2.5),
        ("armoured", build_models.build_enemy_armoured, 2.8),
        ("tank", build_models.build_enemy_tank, 3.5),
        ("flyer", build_models_more.build_enemy_flyer, 3.2),
        ("healer", build_models_more.build_enemy_healer, 2.8),
        ("swarm", build_models_more.build_enemy_swarm, 2.0),
        ("fast", build_models_more.build_enemy_fast, 2.6),
    ]

    for name, fn, scale in enemies:
        for frame in range(4):
            out = f"assets/enemies/{name}_{frame}.png"
            render_sprite(fn, (frame,), out, ortho_scale=scale, res=256)

    # 2. 5 Region Bosses with 4 walk frames each + base still
    bosses = [
        ("boss_1", build_models_more.build_boss_1, 4.4),
        ("boss_2", build_models_more.build_boss_2, 4.2),
        ("boss_3", build_models_more.build_boss_3, 4.8),
        ("boss_4", build_models_more.build_boss_4, 4.5),
        ("boss_5", build_models_more.build_boss_5, 5.2),
    ]

    for name, fn, scale in bosses:
        # Main boss still for icons / cards
        out_base = f"assets/bosses/{name}.png"
        render_sprite(fn, (0,), out_base, ortho_scale=scale, res=320)
        # 4 animation frames
        for frame in range(4):
            out_f = f"assets/bosses/{name}_{frame}.png"
            render_sprite(fn, (frame,), out_f, ortho_scale=scale, res=320)

    # 3. Hero with 4 walk/idle frames
    for frame in range(4):
        out_hero = f"assets/hero/hero_{frame}.png"
        render_sprite(build_models.build_hero, (frame,), out_hero, ortho_scale=3.8, res=256)

    print("ALL 4-FRAME WALK SPRITES RENDERED SUCCESSFULLY!")

if __name__ == "__main__":
    main()
