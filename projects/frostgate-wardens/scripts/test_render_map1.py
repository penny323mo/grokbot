import sys
import os
import json
import math
import bpy
import bpy_extras
from mathutils import Vector

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import blender_utils
import build_models
from render_all_maps import (
    make_faceted, get_emission_material, create_fir_tree, create_boulder,
    create_watchtower, build_road_ribbon, add_road_curbs,
    build_dense_mountain_flank, build_grand_keep, setup_diorama_scene,
    project_path, project_plots, calc_plot, is_clear
)
from test_terrain import build_faceted_snow_ground

def test_render_map1():
    print("--- Test Rendering Map 1 with Faceted Ground ---")
    scene, cam = setup_diorama_scene(1600, 2400, sky_color='#A6CEF0')

    mat_snow = blender_utils.get_material('ice', hex_color='#F1F5F9', roughness=0.35)
    mat_rock = blender_utils.get_material('slate_blue', hex_color='#506175', roughness=0.82)
    mat_teal = blender_utils.get_material('glacier_teal', hex_color='#2F8F9D', roughness=0.35)
    mat_road = blender_utils.get_material('road_gold', hex_color='#C89B48', roughness=0.85)
    mat_stone = blender_utils.get_material('stone', hex_color='#ABA193')
    mat_stone_dark = blender_utils.get_material('stone_dark', hex_color='#736A5E')
    mat_wood = blender_utils.get_material('wood_dark')
    mat_saffron = blender_utils.get_material('saffron')
    mat_sky = blender_utils.get_material('sky', hex_color='#A2C8EC', emission='#A2C8EC')

    # Sky Backdrop
    build_models.create_box("SkyBackdrop", size=(100.0, 2.0, 50.0), location=(0.0, 16.0, 6.0), material=mat_sky)

    # Road Spline
    p1 = [
        (0.0, -11.0, 0.2),
        (-2.2, -9.0, 0.4),
        (-3.4, -6.5, 0.6),
        (-1.8, -4.0, 0.8),
        (1.8, -1.8, 1.0),
        (3.2, 0.5, 1.2),
        (2.0, 3.0, 1.4),
        (0.5, 4.8, 1.6),
        (0.0, 6.2, 1.8),
        (0.0, 7.2, 1.8)
    ]
    p1_road = [(0.0, -18.0, 0.1), (0.0, -14.5, 0.15), (0.0, -12.5, 0.18)] + p1 + [(0.0, 7.8, 1.8)]

    # Faceted Ground (Replaces flat ValleyFloor!)
    build_faceted_snow_ground("FacetedGround", [p1_road], min_x=-16.0, max_x=16.0, min_y=-21.0, max_y=14.0, nx=36, ny=42, mat_snow=mat_snow, mat_rock=mat_rock, mat_teal=mat_teal)

    # Mountain Flanks
    build_dense_mountain_flank("WestFlank", -1, min_y=-20.0, max_y=14.0, steps_y=34, base_dist=3.5, crest_dist=12.0, max_z=7.5, mat_snow=mat_snow, mat_rock=mat_rock, mat_accent=mat_teal)
    build_dense_mountain_flank("EastFlank", 1, min_y=-20.0, max_y=14.0, steps_y=34, base_dist=3.5, crest_dist=12.0, max_z=7.5, mat_snow=mat_snow, mat_rock=mat_rock, mat_accent=mat_teal)

    # Road Ribbon & Curbs
    build_road_ribbon(p1_road, road_width=2.5, material=mat_road)
    add_road_curbs(p1_road, road_width=2.5, material=mat_stone_dark)

    # Watchtowers along the pass
    create_watchtower(-4.2, -8.0, 0.5, mat_stone, mat_stone_dark, mat_teal, mat_saffron, mat_wood)
    create_watchtower(4.2, 1.5, 1.2, mat_stone, mat_stone_dark, mat_teal, mat_saffron, mat_wood)

    # Roadside Braziers with Saffron Flame
    for bx, by, bz in [(-1.5, -10.5, 0.3), (1.5, -10.5, 0.3), (-3.2, -4.8, 0.9), (3.2, -0.5, 1.3), (-1.2, 6.0, 1.9), (1.2, 6.0, 1.9), (-1.6, -14.0, 0.2), (1.6, -14.0, 0.2)]:
        build_models.create_box("BrazierBase", size=(0.35, 0.35, 0.6), location=(bx, by, bz + 0.3), material=mat_stone)
        build_models.create_oct_prism("BrazierBowl", radius=0.3, depth=0.25, location=(bx, by, bz + 0.7), material=mat_stone_dark)
        build_models.create_cone("BrazierFlame", radius=0.18, depth=0.35, vertices=5, location=(bx, by, bz + 0.9), material=mat_saffron)

    # Castle Keep
    gate_x, gate_y, gate_z = 0.0, 7.2, 1.8
    build_grand_keep(gate_x, gate_y, gate_z, mat_stone, mat_stone_dark, mat_teal, mat_saffron)

    # 9 Plots
    cfg1 = [
        (0, 0.35, -1),
        (1, 0.35, 1),
        (2, 0.65, 1),
        (3, 0.65, -1),
        (3, 0.35, 1),
        (4, 0.65, -1),
        (5, 0.50, 1),
        (6, 0.65, -1),
        (7, 0.65, 1)
    ]
    plots_3d = [calc_plot(p1, c[0], c[1], c[2], offset=0.95) for c in cfg1]
    for i, ploc in enumerate(plots_3d):
        build_models.create_oct_prism(f"Plot_{i}", radius=0.85, depth=0.18, location=ploc, material=mat_stone)

    # Fir Trees filling foreground, mid-pass, and upper slopes
    fir_locs = [
        # Southern Gateway Framing
        (-3.5, -11.5, 0.25, 1.2), (-4.5, -11.0, 0.3, 0.9), (-2.2, -12.2, 0.1, 1.05),
        (3.5, -11.5, 0.25, 1.2), (4.5, -11.0, 0.3, 0.9), (2.2, -12.2, 0.1, 1.05),
        (-5.0, -12.5, 0.2, 1.1), (5.0, -12.5, 0.2, 1.1), (-1.2, -13.0, 0.1, 0.85), (1.2, -13.0, 0.1, 0.85),
        (-3.8, -14.5, 0.15, 1.2), (3.8, -14.5, 0.15, 1.2), (-2.0, -15.5, 0.1, 1.0), (2.0, -15.5, 0.1, 1.0),
        (-4.5, -17.0, 0.1, 1.3), (4.5, -17.0, 0.1, 1.3), (-1.5, -17.5, 0.1, 0.9), (1.5, -17.5, 0.1, 0.9),
        # Lower Slopes
        (-5.2, -9.5, 0.45, 1.3), (-4.0, -9.8, 0.35, 0.95), (-5.8, -8.0, 0.55, 1.1),
        (5.2, -9.5, 0.45, 1.3), (4.0, -9.8, 0.35, 0.95), (5.8, -8.0, 0.55, 1.1),
        # Mid Pass
        (-5.5, -6.5, 0.65, 1.2), (-4.8, -5.0, 0.75, 1.0), (-5.2, -3.5, 0.9, 1.15),
        (5.5, -6.5, 0.65, 1.2), (4.8, -5.0, 0.75, 1.0), (5.2, -3.5, 0.9, 1.15),
        # Upper Pass
        (-4.8, 0.0, 1.2, 1.1), (-5.5, 2.0, 1.35, 1.2), (-4.5, 4.0, 1.5, 0.95),
        (4.8, 0.0, 1.2, 1.1), (5.5, 2.0, 1.35, 1.2), (4.5, 4.0, 1.5, 0.95),
        (-3.8, 5.8, 1.7, 1.0), (3.8, 5.8, 1.7, 1.0)
    ]
    for fx, fy, fz, fsc in fir_locs:
        if is_clear(fx, fy, [p1], plots_3d):
            create_fir_tree((fx, fy, fz), scale=fsc)

    # 40+ Boulders & Crags
    boulders = [
        ((-2.8, -10.5, 0.2), 0.75), ((2.8, -10.2, 0.2), 0.8),
        ((-4.2, -7.5, 0.5), 1.1), ((-1.8, -7.5, 0.5), 0.65),
        ((-4.5, -4.5, 0.7), 0.9), ((0.4, -5.2, 0.7), 0.8),
        ((0.5, -3.2, 0.9), 1.0), ((3.8, -2.5, 1.0), 0.75),
        ((4.5, 2.2, 1.3), 1.15), ((-2.5, 2.2, 1.2), 0.8),
        ((-1.5, 4.2, 1.5), 0.9), ((2.8, 5.0, 1.5), 1.0),
        ((-3.2, 6.2, 1.7), 1.1), ((3.2, 6.2, 1.7), 1.1),
        ((-2.5, -14.0, 0.2), 1.0), ((2.5, -14.0, 0.2), 1.0),
        ((-3.5, -16.5, 0.2), 1.2), ((3.5, -16.5, 0.2), 1.2)
    ]
    for b_pos, b_scale in boulders:
        if is_clear(b_pos[0], b_pos[1], [p1], plots_3d):
            create_boulder(b_pos, scale=b_scale, material=mat_rock)

    bpy.context.view_layer.update()
    bpy.context.scene.render.filepath = "assets/maps/map1_test.png"
    bpy.ops.render.render(write_still=True)
    print("Rendered map1_test.png successfully!")

if __name__ == "__main__":
    test_render_map1()
