import sys
import os
import math
import bpy

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import blender_utils
import build_models
import build_models_more

def delete_hierarchy(obj):
    for child in list(obj.children):
        delete_hierarchy(child)
    bpy.data.objects.remove(obj, do_unlink=True)

def render_sprite(builder_fn, args, out_path, ortho_scale=3.0, res=160, center=(0, 0, 0.8), rot_z=0.0):
    root = builder_fn(*args)
    if rot_z != 0.0:
        root.rotation_euler = (0, 0, rot_z)
    cam = bpy.context.scene.camera
    cam.data.ortho_scale = ortho_scale
    
    # Reposition camera to frame center
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

    # Ambient daylight environment illumination for readable, vibrant miniatures
    world = bpy.data.worlds.new("SpriteWorld")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get('Background')
    bg.inputs['Color'].default_value = blender_utils.hex_to_linear_rgb('#DDEBF2')
    bg.inputs['Strength'].default_value = 1.0

    cam = blender_utils.setup_isometric_camera(ortho_scale=3.0, center=(0, 0, 0.8))

    os.makedirs("assets/towers", exist_ok=True)
    os.makedirs("assets/enemies", exist_ok=True)
    os.makedirs("assets/bosses", exist_ok=True)
    os.makedirs("assets/hero", exist_ok=True)

    # 1. Plot Base (Chunky crafted tactile plinth)
    render_sprite(build_models.build_plot, (), "assets/towers/plot.png", ortho_scale=2.7, res=160, center=(0, 0, 0.35))

    # 2. Towers: 5 types x 4 variations (1, 2, 3a, 3b)
    towers = [
        ("crossbow", build_models.build_crossbow, 2.9, (0, 0, 1.0)),
        ("mortar", build_models.build_mortar, 2.8, (0, 0, 0.85)),
        ("frost", build_models.build_frost_spire, 3.2, (0, 0, 1.1)),
        ("guard", build_models.build_guard_post, 2.9, (0, 0, 0.9)),
        ("bell", build_models.build_bell_tower, 3.3, (0, 0, 1.2)),
    ]

    for name, fn, scale, center in towers:
        for lvl in ["1", "2", "3a", "3b"]:
            out = f"assets/towers/{name}_{lvl}.png"
            lvl_scale = scale + (0.25 if '3' in lvl else 0.0)
            render_sprite(fn, (lvl,), out, ortho_scale=lvl_scale, res=160, center=center)

    # 3. Enemies: 7 types x 4 walk frames (0, 1, 2, 3)
    # Properly angled toward the isometric camera with glowing eyes, horns, and weapons
    enemies = [
        ("runner", build_models.build_enemy_runner, 2.2, (0, 0, 0.55), math.radians(35)),
        ("armoured", build_models.build_enemy_armoured, 2.4, (0, 0, 0.75), math.radians(35)),
        ("tank", build_models.build_enemy_tank, 2.9, (0, 0, 0.95), math.radians(-135)),
        ("flyer", build_models_more.build_enemy_flyer, 2.7, (0, 0, 1.25), math.radians(-135)),
        ("healer", build_models_more.build_enemy_healer, 2.4, (0, 0, 0.85), math.radians(-135)),
        ("swarm", build_models_more.build_enemy_swarm, 1.8, (0, 0, 0.3), math.radians(-135)),
        ("fast", build_models_more.build_enemy_fast, 2.3, (0, 0, 0.65), math.radians(-135)),
    ]

    for name, fn, scale, center, rot_z in enemies:
        for frame in [0, 1, 2, 3]:
            out = f"assets/enemies/{name}_{frame}.png"
            render_sprite(fn, (frame,), out, ortho_scale=scale, res=160, center=center, rot_z=rot_z)

    # 4. Bosses: 5 region bosses x 4 walk frames + static
    bosses = [
        ("boss_1", build_models_more.build_boss_1, 3.8, (0, 0, 1.2), math.radians(-135)),
        ("boss_2", build_models_more.build_boss_2, 3.6, (0, 0, 1.1), math.radians(-135)),
        ("boss_3", build_models_more.build_boss_3, 4.0, (0, 0, 0.9), math.radians(-135)),
        ("boss_4", build_models_more.build_boss_4, 3.8, (0, 0, 1.3), math.radians(-135)),
        ("boss_5", build_models_more.build_boss_5, 4.4, (0, 0, 1.5), math.radians(-135)),
    ]

    for name, fn, scale, center, rot_z in bosses:
        out_base = f"assets/bosses/{name}.png"
        render_sprite(fn, (0,), out_base, ortho_scale=scale, res=256, center=center, rot_z=rot_z)
        for frame in [0, 1, 2, 3]:
            out_f = f"assets/bosses/{name}_{frame}.png"
            render_sprite(fn, (frame,), out_f, ortho_scale=scale, res=256, center=center, rot_z=rot_z)

    # 5. Hero: Warden Commander (4 walk/idle frames, matches title_key.webp)
    # Angled 35 deg to showcase royal blue heater shield with frost star, silver armor, golden wings, and halberd
    for frame in [0, 1, 2, 3]:
        out = f"assets/hero/hero_{frame}.png"
        render_sprite(build_models.build_hero, (frame,), out, ortho_scale=2.5, res=256, center=(0, 0, 1.05), rot_z=math.radians(35))

    # 6. Guards: Warden Guards (4 walk/idle frames)
    for frame in [0, 1, 2, 3]:
        out = f"assets/hero/guard_{frame}.png"
        render_sprite(build_models.build_guard, (frame,), out, ortho_scale=2.5, res=256, center=(0, 0, 0.95), rot_z=math.radians(35))

    print("ALL PLAYABLE SPRITES RENDERED WITH UPGRADED CLAY DIORAMA LOOK!")

if __name__ == "__main__":
    main()
