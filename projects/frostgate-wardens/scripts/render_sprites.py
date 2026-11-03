import sys
import os
import bpy

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import blender_utils
import build_models

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
    # Isometric camera at 35.264 elevation, 45 degree rotation
    cam = blender_utils.setup_isometric_camera(ortho_scale=3.6, center=(0, 0, 0.8))

    # Output directories
    os.makedirs("assets/towers", exist_ok=True)
    os.makedirs("assets/enemies", exist_ok=True)
    os.makedirs("assets/hero", exist_ok=True)

    # 1. Plot
    render_sprite(build_models.build_plot, (), "assets/towers/plot.png", ortho_scale=3.2, res=160)

    # 2. Towers: 5 types x 4 variations (1, 2, 3a, 3b)
    towers = [
        ("crossbow", build_models.build_crossbow),
        ("mortar", build_models.build_mortar),
        ("frost", build_models.build_frost_spire),
        ("guard", build_models.build_guard_post),
        ("bell", build_models.build_bell_tower),
    ]

    for name, fn in towers:
        for lvl in ["1", "2", "3a", "3b"]:
            out = f"assets/towers/{name}_{lvl}.png"
            # Adjust camera scale slightly for taller towers
            scale = 4.2 if name in ["bell", "frost"] else 3.8
            render_sprite(fn, (lvl,), out, ortho_scale=scale, res=160)

    # 3. Enemies: 3 types x 2 walk frames
    enemies = [
        ("runner", build_models.build_enemy_runner, 2.5),
        ("armoured", build_models.build_enemy_armoured, 2.8),
        ("tank", build_models.build_enemy_tank, 3.5),
    ]

    for name, fn, scale in enemies:
        for frame in [0, 1]:
            out = f"assets/enemies/{name}_{frame}.png"
            render_sprite(fn, (frame,), out, ortho_scale=scale, res=128)

    # 4. Hero: 2 walk/idle frames
    for frame in [0, 1]:
        out = f"assets/hero/hero_{frame}.png"
        render_sprite(build_models.build_hero, (frame,), out, ortho_scale=3.8, res=160)

    print("ALL SPRITES RENDERED SUCCESSFULLY!")

if __name__ == "__main__":
    main()
