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

def make_faceted(obj):
    bpy.context.view_layer.objects.active = obj
    try:
        bpy.ops.object.shade_flat()
    except Exception:
        pass
    for f in obj.data.polygons:
        f.use_smooth = False
    if hasattr(obj.data, "use_auto_smooth"):
        obj.data.use_auto_smooth = False

def create_fir_tree(loc, scale=1.0):
    mat_trunk = blender_utils.get_material('wood')
    mat_foliage = blender_utils.get_material('fir_green')
    mat_snow = blender_utils.get_material('ice')

    bpy.ops.mesh.primitive_cylinder_add(vertices=5, radius=0.14*scale, depth=0.8*scale, location=(loc[0], loc[1], loc[2]+0.4*scale))
    trunk = bpy.context.active_object
    make_faceted(trunk)
    trunk.data.materials.append(mat_trunk)

    for z_off, r, h, mat in [
        (0.65, 0.95, 0.85, mat_foliage),
        (1.20, 0.72, 0.75, mat_foliage),
        (1.65, 0.45, 0.65, mat_snow)
    ]:
        bpy.ops.mesh.primitive_cone_add(vertices=6, radius1=r*scale, depth=h*scale, location=(loc[0], loc[1], loc[2]+z_off*scale))
        cone = bpy.context.active_object
        make_faceted(cone)
        cone.data.materials.append(mat)

def create_boulder(loc, scale=1.0, material=None):
    bpy.ops.mesh.primitive_cube_add(size=scale, location=loc, rotation=(0.25, 0.35, 0.45))
    boulder = bpy.context.active_object
    boulder.scale = (1.1, 0.85, 0.75)
    bpy.ops.object.transform_apply(scale=True)
    make_faceted(boulder)
    if material:
        boulder.data.materials.append(material)
    return boulder

def build_road_ribbon(path_3d, road_width=2.6, material=None):
    mesh = bpy.data.meshes.new("RoadMesh")
    road_obj = bpy.data.objects.new("Road", mesh)
    bpy.context.scene.collection.objects.link(road_obj)

    verts = []
    faces = []
    for i in range(len(path_3d)):
        pt = path_3d[i]
        if i < len(path_3d) - 1:
            dx = path_3d[i+1][0] - pt[0]
            dy = path_3d[i+1][1] - pt[1]
        else:
            dx = pt[0] - path_3d[i-1][0]
            dy = pt[1] - path_3d[i-1][1]
        l = max(0.001, math.hypot(dx, dy))
        nx = -dy / l * (road_width * 0.5)
        ny = dx / l * (road_width * 0.5)
        verts.append((pt[0] - nx, pt[1] - ny, pt[2] + 0.18))
        verts.append((pt[0] + nx, pt[1] + ny, pt[2] + 0.18))

    for i in range(len(path_3d) - 1):
        v1 = i * 2
        v2 = i * 2 + 1
        v3 = (i + 1) * 2 + 1
        v4 = (i + 1) * 2
        faces.append((v1, v2, v3, v4))
        faces.append((v1, v4, v3, v2))

    mesh.from_pydata(verts, [], faces)
    mesh.update()
    make_faceted(road_obj)
    if material:
        road_obj.data.materials.append(material)
    return road_obj

def add_road_curbs(path_3d, road_width=2.6, material=None):
    for i in range(len(path_3d) - 1):
        pA = path_3d[i]
        pB = path_3d[i + 1]
        dx = pB[0] - pA[0]
        dy = pB[1] - pA[1]
        l = max(0.001, math.hypot(dx, dy))
        nx = -dy / l
        ny = dx / l
        angle = math.atan2(dy, dx)

        steps = max(2, int(l / 1.3))
        for s in range(steps):
            t = (s + 0.5) / steps
            mx = pA[0] + dx * t
            my = pA[1] + dy * t
            mz = pA[2] + (pB[2] - pA[2]) * t + 0.22
            for side in [-1, 1]:
                cx = mx + nx * side * (road_width * 0.5 + 0.18)
                cy = my + ny * side * (road_width * 0.5 + 0.18)
                build_models.create_box("Curb", size=(0.28, 0.8, 0.24), location=(cx, cy, mz), rotation=(0, 0, angle), material=material)

def build_faceted_mountain_flank(name, flank_sign, min_y=-14.0, max_y=12.0, steps_y=16, base_dist=2.8, crest_dist=9.0, max_z=7.5, mat_snow=None, mat_rock=None, mat_ice=None):
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)

    verts = []
    faces = []
    dy = (max_y - min_y) / steps_y

    for i in range(steps_y + 1):
        y = min_y + i * dy
        h_noise1 = math.sin(i * 1.3 + flank_sign * 2.1) * 0.9
        h_noise2 = math.cos(i * 2.7) * 0.5
        w_noise = math.sin(i * 0.9) * 0.6

        road_z = 0.2 + (y + 11.0) / 18.0 * 1.6
        z0 = max(0.0, road_z + 0.1)
        z1 = z0 + 1.8 + h_noise2 * 0.4
        z2 = z0 + max_z + h_noise1 + h_noise2
        z3 = max(0.5, z2 * 0.4)

        x0 = flank_sign * (base_dist + w_noise * 0.3)
        x1 = flank_sign * (base_dist + 2.4 + w_noise * 0.5)
        x2 = flank_sign * (crest_dist + w_noise * 0.8)
        x3 = flank_sign * (crest_dist + 7.5)

        verts.append((x0, y, z0))
        verts.append((x1, y, z1))
        verts.append((x2, y, z2))
        verts.append((x3, y, z3))

    for i in range(steps_y):
        row_a = i * 4
        row_b = (i + 1) * 4
        for col in range(3):
            v1 = row_a + col
            v2 = row_a + col + 1
            v3 = row_b + col + 1
            v4 = row_b + col
            if flank_sign > 0:
                faces.append((v1, v2, v3))
                faces.append((v1, v3, v4))
            else:
                faces.append((v1, v3, v2))
                faces.append((v1, v4, v3))

    mesh.from_pydata(verts, [], faces)
    mesh.update()
    make_faceted(obj)

    if mat_snow and mat_rock:
        obj.data.materials.append(mat_snow)
        obj.data.materials.append(mat_rock)
        if mat_ice:
            obj.data.materials.append(mat_ice)

        for poly in mesh.polygons:
            nz = abs(poly.normal.z)
            if nz > 0.40:
                poly.material_index = 0
            elif nz > 0.20 and mat_ice:
                poly.material_index = 2
            else:
                poly.material_index = 1
    return obj

def is_clear_of_road_and_plots(tx, ty, path_3d, plots_3d):
    for px, py, pz in path_3d:
        if math.hypot(tx - px, ty - py) < 2.0:
            return False
    for px, py, pz in plots_3d:
        if math.hypot(tx - px, ty - py) < 1.7:
            return False
    return True

def build_map1_scene(render_w=1600, render_h=2400):
    scene = blender_utils.reset_scene()
    scene.render.resolution_x = render_w
    scene.render.resolution_y = render_h
    scene.render.film_transparent = False

    if hasattr(scene, "eevee") and hasattr(scene.eevee, "use_gtao"):
        scene.eevee.use_gtao = True
        scene.eevee.gtao_distance = 2.5
        scene.eevee.gtao_factor = 1.3

    # Daylight lighting: warm sun + bright sky fill so shadows are soft alpine blue, NEVER black!
    world = bpy.data.worlds.new("SkyWorld")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get('Background')
    bg.inputs['Color'].default_value = blender_utils.hex_to_linear_rgb('#A6CEF0')
    bg.inputs['Strength'].default_value = 1.0

    blender_utils.setup_diorama_lights()

    mat_snow = blender_utils.get_material('ice', roughness=0.55)
    mat_rock = blender_utils.get_material('slate_blue', roughness=0.75)
    mat_teal = blender_utils.get_material('glacier_teal', roughness=0.40)
    mat_sky = blender_utils.get_material('sky', hex_color='#A2C8EC', emission='#A2C8EC')
    mat_road = blender_utils.get_material('road_gold', roughness=0.85)
    mat_stone = blender_utils.get_material('stone')
    mat_stone_dark = blender_utils.get_material('stone_dark')
    mat_wood = blender_utils.get_material('wood_dark')
    mat_saffron = blender_utils.get_material('saffron')
    mat_gold = blender_utils.get_material('gold')

    # 1. Daylight Alpine Sky Backdrop (Luminous daylight plane, zero voids)
    build_models.create_box("SkyBackdrop", size=(100.0, 2.0, 50.0), location=(0.0, 16.0, 6.0), material=mat_sky)

    # 2. Expansive Valley Floor (Pure snow diorama base)
    build_models.create_box("ValleyFloor", size=(90.0, 90.0, 4.0), location=(0.0, 0.0, -2.0), material=mat_snow)

    # 3. Continuous Low-Poly Mountain Ridges (West & East Flanks)
    build_faceted_mountain_flank("WestFlank", -1, min_y=-14.0, max_y=12.0, steps_y=20, base_dist=5.2, crest_dist=14.0, max_z=7.5, mat_snow=mat_snow, mat_rock=mat_rock, mat_ice=mat_teal)
    build_faceted_mountain_flank("EastFlank", 1, min_y=-14.0, max_y=12.0, steps_y=20, base_dist=5.2, crest_dist=14.0, max_z=7.5, mat_snow=mat_snow, mat_rock=mat_rock, mat_ice=mat_teal)

    # 4. Path Spline
    path_3d = [
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

    build_road_ribbon(path_3d, road_width=2.6, material=mat_road)
    add_road_curbs(path_3d, road_width=2.6, material=mat_stone_dark)

    # 5. Strategic Build Plots
    def calc_plot(seg_idx, t, side, offset=1.35):
        pA = path_3d[seg_idx]
        pB = path_3d[seg_idx + 1]
        mx = pA[0] + (pB[0] - pA[0]) * t
        my = pA[1] + (pB[1] - pA[1]) * t
        mz = pA[2] + (pB[2] - pA[2]) * t
        dx = pB[0] - pA[0]
        dy = pB[1] - pA[1]
        l = max(0.001, math.hypot(dx, dy))
        nx = -dy / l * side
        ny = dx / l * side
        return (mx + nx * offset, my + ny * offset, mz)

    plot_configs = [
        (0, 0.35, -1),
        (0, 0.70, -1),
        (1, 0.45, -1),
        (2, 0.50, -1),
        (3, 0.45, -1),
        (3, 0.55, 1),
        (4, 0.50, 1),
        (5, 0.50, -1),
        (6, 0.45, 1),
        (7, 0.50, -1),
        (7, 0.50, 1)
    ]
    plot_coords_3d = [calc_plot(cfg[0], cfg[1], cfg[2], 1.25) for cfg in plot_configs]

    for i, p_loc in enumerate(plot_coords_3d):
        build_models.create_oct_prism(f"Plot_{i}", radius=0.85, depth=0.18, location=p_loc, material=mat_stone)

    # 6. Roadside Braziers & Watchtowers with Teal Roofs & Saffron Banners
    brazier_locs = [
        (-1.6, -10.5, 0.3), (1.6, -10.5, 0.3),
        (-3.2, -4.8, 0.9), (3.2, -0.5, 1.3),
        (-1.2, 6.0, 1.9), (1.2, 6.0, 1.9)
    ]
    for bx, by, bz in brazier_locs:
        build_models.create_box("BrazierBase", size=(0.35, 0.35, 0.6), location=(bx, by, bz + 0.3), material=mat_stone)
        build_models.create_oct_prism("BrazierBowl", radius=0.3, depth=0.25, location=(bx, by, bz + 0.7), material=mat_stone_dark)
        build_models.create_cone("BrazierFlame", radius=0.18, depth=0.35, vertices=5, location=(bx, by, bz + 0.9), material=mat_saffron)

    watchtowers = [(-4.2, -8.0, 0.5), (4.2, 1.5, 1.2)]
    for wx, wy, wz in watchtowers:
        build_models.create_cylinder("WatchtowerBase", radius=0.75, depth=2.4, vertices=8, location=(wx, wy, wz + 1.2), material=mat_stone)
        build_models.create_oct_prism("WatchtowerCrenels", radius=0.9, depth=0.35, location=(wx, wy, wz + 2.5), material=mat_stone_dark)
        build_models.create_cone("WatchtowerRoof", radius=0.95, depth=1.2, vertices=6, location=(wx, wy, wz + 3.2), material=mat_teal)
        build_models.create_cylinder("TowerPole", radius=0.03, depth=1.4, vertices=4, location=(wx, wy, wz + 4.1), material=mat_wood)
        build_models.create_box("TowerFlag", size=(0.04, 0.5, 0.35), location=(wx, wy + 0.3, wz + 4.4), material=mat_saffron)

    # 7. Grand Castle Keep at Mountain Apex
    gate_x, gate_y, gate_z = path_3d[-1]
    for tx in [gate_x - 1.8, gate_x + 1.8]:
        build_models.create_oct_prism("GateTower", radius=1.0, depth=2.4, location=(tx, gate_y + 0.4, gate_z + 1.2), material=mat_stone)
        build_models.create_oct_prism("TowerCrenel", radius=1.12, depth=0.35, location=(tx, gate_y + 0.4, gate_z + 2.5), material=mat_stone_dark)
        build_models.create_cone("TowerRoof", radius=1.18, depth=1.2, vertices=6, location=(tx, gate_y + 0.4, gate_z + 3.2), material=mat_teal)
        build_models.create_cylinder("FlagPole", radius=0.04, depth=1.4, vertices=4, location=(tx, gate_y + 0.4, gate_z + 4.1), material=mat_wood)
        build_models.create_box("Flag", size=(0.04, 0.6, 0.38), location=(tx, gate_y + 0.7, gate_z + 4.4), material=mat_saffron)

    build_models.create_box("GateArch", size=(2.6, 1.0, 0.9), location=(gate_x, gate_y + 0.4, gate_z + 2.1), material=mat_stone)
    build_models.create_box("Portcullis", size=(1.6, 0.2, 1.8), location=(gate_x, gate_y + 0.4, gate_z + 0.9), material=mat_wood)
    build_models.create_cone("GateCrest", radius=0.45, depth=0.75, vertices=6, location=(gate_x, gate_y + 0.2, gate_z + 2.7), material=mat_saffron)

    build_models.create_oct_prism("CentralKeep", radius=2.3, depth=3.4, location=(gate_x, gate_y + 1.5, gate_z + 1.7), material=mat_stone_dark)
    build_models.create_cone("CentralKeepSpire", radius=1.7, depth=2.0, vertices=8, location=(gate_x, gate_y + 1.5, gate_z + 4.2), material=mat_teal)
    build_models.create_cone("SpireFinial", radius=0.25, depth=0.5, vertices=6, location=(gate_x, gate_y + 1.5, gate_z + 5.3), material=mat_gold)
    build_models.create_cylinder("RoyalBannerPole", radius=0.05, depth=1.6, vertices=4, location=(gate_x, gate_y + 1.5, gate_z + 5.6), material=mat_wood)
    build_models.create_box("RoyalFlag", size=(0.04, 0.85, 0.5), location=(gate_x, gate_y + 1.9, gate_z + 6.0), material=mat_saffron)

    build_models.create_box("WallL", size=(4.5, 1.2, 2.4), location=(gate_x - 4.6, gate_y + 0.8, gate_z + 1.2), material=mat_stone)
    build_models.create_box("WallR", size=(4.5, 1.2, 2.4), location=(gate_x + 4.6, gate_y + 0.8, gate_z + 1.2), material=mat_stone)
    build_models.create_box("ParapetL", size=(4.5, 0.3, 0.45), location=(gate_x - 4.6, gate_y + 0.2, gate_z + 2.6), material=mat_stone_dark)
    build_models.create_box("ParapetR", size=(4.5, 0.3, 0.45), location=(gate_x + 4.6, gate_y + 0.2, gate_z + 2.6), material=mat_stone_dark)

    # 8. Low-Poly Boulders & Clutter
    boulders = [
        ((-3.2, -10.5, 0.2), 0.7), ((3.0, -10.2, 0.2), 0.8),
        ((-4.5, -7.5, 0.5), 1.1), ((-2.0, -7.5, 0.5), 0.6),
        ((-4.8, -4.5, 0.7), 0.9), ((0.2, -5.2, 0.7), 0.8),
        ((0.5, -3.2, 0.9), 1.0), ((3.8, -2.5, 1.0), 0.7),
        ((4.5, 2.2, 1.3), 1.2), ((-2.5, 2.2, 1.2), 0.8),
        ((-1.5, 4.2, 1.5), 0.9), ((2.8, 5.0, 1.5), 1.0),
        ((-3.5, 6.2, 1.7), 1.1), ((3.5, 6.2, 1.7), 1.1),
    ]
    for b_pos, b_scale in boulders:
        create_boulder(b_pos, scale=b_scale, material=mat_rock)

    # 9. Over 65 Snowy Fir Trees in natural groves
    fir_candidates = [
        # Lower Pass (South)
        (-3.8, -11.5, 0.2, 1.2), (-4.8, -11.0, 0.3, 0.85), (-2.5, -12.0, 0.1, 1.0),
        (3.8, -11.5, 0.2, 1.1), (4.8, -11.0, 0.3, 0.8), (2.5, -12.0, 0.1, 0.95),
        (-5.2, -9.5, 0.4, 1.3), (-4.2, -9.8, 0.3, 0.9), (-3.2, -10.2, 0.2, 0.75),
        (5.2, -9.5, 0.4, 1.25), (4.2, -9.8, 0.3, 0.85), (3.2, -10.2, 0.2, 0.7),
        # Mid-Lower Pass
        (-5.5, -7.0, 0.6, 1.2), (-4.5, -6.0, 0.6, 0.9), (-5.0, -5.2, 0.7, 1.1),
        (-2.2, -5.5, 0.6, 0.8), (-1.2, -5.8, 0.6, 0.7), (-0.5, -7.0, 0.5, 0.9),
        (2.8, -7.5, 0.5, 1.1), (3.8, -7.0, 0.5, 0.85), (4.8, -7.5, 0.5, 1.2),
        (5.5, -5.5, 0.7, 1.3), (4.2, -5.0, 0.7, 0.85), (5.0, -4.0, 0.8, 1.0),
        # Mid Valley Choke Point
        (-3.5, -3.0, 0.8, 1.1), (-4.5, -2.5, 0.9, 0.8), (-4.0, -1.5, 0.9, 1.2),
        (-0.5, -2.5, 0.9, 0.75), (0.2, -1.0, 1.0, 0.85), (-0.8, 0.5, 1.1, 0.9),
        (3.5, -3.5, 0.8, 1.2), (4.5, -3.0, 0.8, 0.85), (5.0, -1.8, 1.0, 1.1),
        (4.8, 0.0, 1.1, 1.3), (4.0, 0.8, 1.1, 0.85), (5.5, 1.5, 1.2, 1.0),
        # Upper Switchback
        (-3.8, 0.5, 1.1, 1.2), (-4.5, 1.5, 1.2, 0.9), (-5.0, 2.5, 1.3, 1.15),
        (-2.2, 1.2, 1.1, 0.8), (-1.5, 2.5, 1.3, 0.75), (-3.0, 3.5, 1.4, 1.0),
        (3.5, 2.5, 1.3, 1.2), (4.2, 3.2, 1.4, 0.85), (5.0, 3.8, 1.4, 1.1),
        (2.8, 4.2, 1.4, 0.75), (3.5, 5.0, 1.5, 0.9), (4.5, 5.5, 1.5, 1.2),
        # Citadel Approaches (North)
        (-3.8, 4.8, 1.5, 1.2), (-4.5, 5.5, 1.6, 0.85), (-5.2, 6.5, 1.7, 1.1),
        (-2.5, 6.0, 1.7, 0.8), (-1.8, 6.8, 1.8, 0.7), (-3.2, 7.5, 1.8, 1.05),
        (-4.0, 8.5, 1.9, 1.2), (-5.5, 8.5, 1.9, 0.9), (-2.5, 8.5, 1.9, 0.8),
        (3.8, 6.5, 1.7, 1.2), (4.8, 6.8, 1.7, 0.85), (2.5, 7.5, 1.8, 0.8),
        (3.5, 8.2, 1.9, 1.15), (4.5, 8.5, 1.9, 0.9), (2.0, 8.8, 1.9, 0.75)
    ]
    for fx, fy, fz, fscale in fir_candidates:
        if is_clear_of_road_and_plots(fx, fy, path_3d, plot_coords_3d):
            create_fir_tree((fx, fy, fz), scale=fscale)

    # 10. Camera Setup (ortho_scale=25.0, center=(0.0, -1.8, 1.0) for universal framing & zero letterboxing)
    cam = blender_utils.setup_isometric_camera(
        ortho_scale=25.0,
        elevation_deg=40.0,
        rotation_z_deg=0.0,
        distance=50.0,
        center=(0.0, -1.8, 1.0)
    )
    bpy.context.view_layer.update()

    # Meta export: 1024x1536 canonical coordinate space
    waypoints_2d = []
    for pt in path_3d:
        co = bpy_extras.object_utils.world_to_camera_view(scene, cam, Vector(pt))
        px = max(0, min(1024, round(co.x * 1024)))
        py = max(0, min(1536, round((1.0 - co.y) * 1536)))
        waypoints_2d.append({"x": px, "y": py})

    plots_2d = []
    for i, pt in enumerate(plot_coords_3d):
        co = bpy_extras.object_utils.world_to_camera_view(scene, cam, Vector(pt))
        px = max(0, min(1024, round(co.x * 1024)))
        py = max(0, min(1536, round((1.0 - co.y) * 1536)))
        plots_2d.append({"id": i, "x": px, "y": py})

    meta = {
        "id": "map1",
        "name": "霜門山道",
        "region": 1,
        "width": 1024,
        "height": 1536,
        "waypoints": waypoints_2d,
        "plots": plots_2d,
        "castle_pos": waypoints_2d[-1],
        "spawn_pos": waypoints_2d[0],
        "description": "冰川山道嘅咽喉險地，覆蓋厚雪，兩側崖石陡峭。"
    }
    return meta

def main():
    os.makedirs("assets/maps", exist_ok=True)
    meta = build_map1_scene(1600, 2400)
    raw_png = "assets/maps/map1.png"
    out_json = "assets/maps/map1.json"
    bpy.context.scene.render.filepath = raw_png
    bpy.ops.render.render(write_still=True)
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
    print("Map 1 rendered at 1600x2400 successfully!")

if __name__ == "__main__":
    main()
