import sys
import os
import math
import bpy

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import blender_utils
from build_models import make_faceted, create_box, create_cone, create_cylinder, create_oct_prism

def render_icon(builder_fn, out_path, ortho_scale=2.2, res=128):
    scene = blender_utils.reset_scene()
    blender_utils.setup_diorama_lights()
    # Front-facing camera with subtle 12 deg elevation for 3D bevel relief and maximum legibility at 22px
    cam = blender_utils.setup_isometric_camera(
        ortho_scale=ortho_scale,
        elevation_deg=12.0,
        rotation_z_deg=0.0,
        center=(0, 0, 0.5)
    )

    root = builder_fn()
    bpy.context.scene.render.resolution_x = res
    bpy.context.scene.render.resolution_y = res
    bpy.context.scene.render.filepath = out_path
    bpy.ops.render.render(write_still=True)
    print(f"Rendered UI icon: {out_path}")

def build_clay_coin():
    root = bpy.data.objects.new("Coin_Root", None)
    bpy.context.scene.collection.objects.link(root)

    mat_gold = blender_utils.get_material('gold', hex_color='#FBBF24', roughness=0.25, metallic=0.6)
    mat_rim = blender_utils.get_material('saffron', hex_color='#F59E0B', roughness=0.35, metallic=0.4)
    mat_core = blender_utils.get_material('bronze', hex_color='#D97706', roughness=0.35)

    # Thick chunky coin rim facing camera
    coin = create_cylinder("CoinBody", radius=0.86, depth=0.25, vertices=24, location=(0, 0, 0.5), rotation=(math.radians(90), 0, 0), material=mat_gold)
    coin.parent = root

    # Embossed rim ridge
    rim = create_cylinder("CoinRim", radius=0.92, depth=0.12, vertices=24, location=(0, -0.08, 0.5), rotation=(math.radians(90), 0, 0), material=mat_rim)
    rim.parent = root

    # Stamped 4-pointed frost star emblem on face (deep contrast, readable at 22px)
    star_v = create_box("StarV", size=(0.18, 0.12, 0.85), location=(0, -0.12, 0.5), material=mat_core)
    star_v.parent = root
    star_h = create_box("StarH", size=(0.85, 0.12, 0.18), location=(0, -0.12, 0.5), material=mat_core)
    star_h.parent = root
    star_d1 = create_box("StarD1", size=(0.14, 0.12, 0.55), location=(0, -0.12, 0.5), rotation=(0, math.radians(45), 0), material=mat_core)
    star_d1.parent = root
    star_d2 = create_box("StarD2", size=(0.14, 0.12, 0.55), location=(0, -0.12, 0.5), rotation=(0, math.radians(-45), 0), material=mat_core)
    star_d2.parent = root

    center_gem = create_oct_prism("CenterGem", radius=0.20, depth=0.16, location=(0, -0.14, 0.5), rotation=(math.radians(90), 0, math.radians(45)), material=mat_gold)
    center_gem.parent = root
    return root

def build_clay_shield():
    root = bpy.data.objects.new("Shield_Root", None)
    bpy.context.scene.collection.objects.link(root)

    mat_blue = blender_utils.get_material('royal_blue', hex_color='#2563EB', roughness=0.35)
    mat_gold = blender_utils.get_material('gold', hex_color='#FBBF24', roughness=0.25, metallic=0.6)
    mat_cross = blender_utils.get_material('silver', hex_color='#F1F5F9', roughness=0.25, metallic=0.4)

    # Classic royal heater shield silhouette facing camera
    # Upper wide body
    body_u = create_box("ShieldBodyU", size=(1.10, 0.22, 0.65), location=(0, 0, 0.65), material=mat_blue)
    body_u.parent = root

    # Mid tapering body
    body_m = create_box("ShieldBodyM", size=(0.85, 0.22, 0.45), location=(0, 0, 0.25), material=mat_blue)
    body_m.parent = root

    # Bottom pointed tip
    point = create_cone("ShieldPoint", radius=0.44, depth=0.55, vertices=4, location=(0, 0, -0.05), rotation=(math.radians(180), 0, math.radians(45)), material=mat_blue)
    point.parent = root

    # Gold rim border
    rim_top = create_box("RimTop", size=(1.22, 0.26, 0.14), location=(0, -0.02, 0.95), material=mat_gold)
    rim_top.parent = root
    rim_l = create_box("RimL", size=(0.14, 0.26, 0.85), location=(-0.55, -0.02, 0.55), material=mat_gold)
    rim_l.parent = root
    rim_r = create_box("RimR", size=(0.14, 0.26, 0.85), location=(0.55, -0.02, 0.55), material=mat_gold)
    rim_r.parent = root

    # Frost cross emblem in bright silver
    cross_v = create_box("CrossV", size=(0.24, 0.28, 0.85), location=(0, -0.04, 0.50), material=mat_cross)
    cross_v.parent = root
    cross_h = create_box("CrossH", size=(0.70, 0.28, 0.24), location=(0, -0.04, 0.60), material=mat_cross)
    cross_h.parent = root
    return root

def build_clay_pause():
    root = bpy.data.objects.new("Pause_Root", None)
    bpy.context.scene.collection.objects.link(root)

    mat_stone = blender_utils.get_material('stone_dark', hex_color='#1E293B', roughness=0.4)
    mat_gold = blender_utils.get_material('gold', hex_color='#FBBF24', roughness=0.25, metallic=0.6)
    mat_bars = blender_utils.get_material('saffron', hex_color='#F59E0B', roughness=0.3)

    # Round disc button base facing camera
    disc = create_cylinder("BtnDisc", radius=0.92, depth=0.22, vertices=24, location=(0, 0, 0.5), rotation=(math.radians(90), 0, 0), material=mat_stone)
    disc.parent = root

    rim = create_cylinder("BtnRim", radius=0.98, depth=0.10, vertices=24, location=(0, -0.07, 0.5), rotation=(math.radians(90), 0, 0), material=mat_gold)
    rim.parent = root

    # TWO unmistakably distinct, bold vertical pause bars (high contrast, instantly readable at 22px)
    bar_l = create_box("Bar_L", size=(0.24, 0.18, 0.75), location=(-0.30, -0.12, 0.5), material=mat_bars)
    bar_l.parent = root
    bar_r = create_box("Bar_R", size=(0.24, 0.18, 0.75), location=(0.30, -0.12, 0.5), material=mat_bars)
    bar_r.parent = root
    return root

def build_clay_lock():
    root = bpy.data.objects.new("Lock_Root", None)
    bpy.context.scene.collection.objects.link(root)

    mat_body = blender_utils.get_material('gold', hex_color='#FBBF24', roughness=0.25, metallic=0.6)
    mat_shackle = blender_utils.get_material('iron', hex_color='#94A3B8', roughness=0.3, metallic=0.7)
    mat_keyhole = blender_utils.get_material('deep_indigo', hex_color='#0F172A', roughness=0.8)

    # Chunky lock body facing camera
    body = create_box("LockBody", size=(0.95, 0.35, 0.70), location=(0, 0, 0.35), material=mat_body)
    body.parent = root

    # Silver shackle
    shackle_l = create_cylinder("ShackleL", radius=0.10, depth=0.65, vertices=12, location=(-0.30, 0, 0.85), material=mat_shackle)
    shackle_l.parent = root
    shackle_r = create_cylinder("ShackleR", radius=0.10, depth=0.65, vertices=12, location=(0.30, 0, 0.85), material=mat_shackle)
    shackle_r.parent = root
    shackle_top = create_box("ShackleTop", size=(0.70, 0.20, 0.18), location=(0, 0, 1.15), material=mat_shackle)
    shackle_top.parent = root

    # Keyhole
    hole = create_cylinder("HoleCircle", radius=0.12, depth=0.40, vertices=12, location=(0, -0.18, 0.45), rotation=(math.radians(90), 0, 0), material=mat_keyhole)
    hole.parent = root
    slot = create_box("HoleSlot", size=(0.09, 0.40, 0.20), location=(0, -0.18, 0.32), material=mat_keyhole)
    slot.parent = root
    return root

def main():
    os.makedirs("assets/ui", exist_ok=True)
    render_icon(build_clay_coin, "assets/ui/icon_coin.png", ortho_scale=2.2, res=128)
    render_icon(build_clay_shield, "assets/ui/icon_shield.png", ortho_scale=2.3, res=128)
    render_icon(build_clay_pause, "assets/ui/icon_pause.png", ortho_scale=2.2, res=128)
    render_icon(build_clay_lock, "assets/ui/icon_lock.png", ortho_scale=2.3, res=128)
    print("ALL CLAY UI ICONS RENDERED!")

if __name__ == "__main__":
    main()
