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

def build_faceted_mountain_flank(name, flank_sign, min_y=-14.0, max_y=12.0, steps_y=18, base_dist=3.2, crest_dist=14.0, max_z=7.5, mat_snow=None, mat_rock=None, mat_ice=None):
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

def is_clear_of_road_and_plots(tx, ty, paths_3d, plots_3d):
    for path in paths_3d:
        for px, py, pz in path:
            if math.hypot(tx - px, ty - py) < 2.0:
                return False
    for px, py, pz in plots_3d:
        if math.hypot(tx - px, ty - py) < 1.7:
            return False
    return True

def build_grand_keep(gate_x, gate_y, gate_z, mat_stone, mat_stone_dark, mat_spire, mat_banner, mat_wall=None, mat_arch=None):
    if mat_wall is None:
        mat_wall = mat_stone
    if mat_arch is None:
        mat_arch = mat_stone

    mat_wood = blender_utils.get_material('wood_dark')
    mat_gold = blender_utils.get_material('gold')

    for tx in [gate_x - 1.8, gate_x + 1.8]:
        build_models.create_oct_prism("GateTower", radius=1.0, depth=2.4, location=(tx, gate_y + 0.4, gate_z + 1.2), material=mat_stone)
        build_models.create_oct_prism("TowerCrenel", radius=1.12, depth=0.35, location=(tx, gate_y + 0.4, gate_z + 2.5), material=mat_stone_dark)
        build_models.create_cone("TowerRoof", radius=1.18, depth=1.2, vertices=6, location=(tx, gate_y + 0.4, gate_z + 3.2), material=mat_spire)
        build_models.create_cylinder("FlagPole", radius=0.04, depth=1.4, vertices=4, location=(tx, gate_y + 0.4, gate_z + 4.1), material=mat_wood)
        build_models.create_box("Flag", size=(0.04, 0.6, 0.38), location=(tx, gate_y + 0.7, gate_z + 4.4), material=mat_banner)

    build_models.create_box("GateArch", size=(2.6, 1.0, 0.9), location=(gate_x, gate_y + 0.4, gate_z + 2.1), material=mat_arch)
    build_models.create_box("Portcullis", size=(1.6, 0.2, 1.8), location=(gate_x, gate_y + 0.4, gate_z + 0.9), material=mat_wood)
    build_models.create_cone("GateCrest", radius=0.45, depth=0.75, vertices=6, location=(gate_x, gate_y + 0.2, gate_z + 2.7), material=mat_banner)

    build_models.create_oct_prism("CentralKeep", radius=2.3, depth=3.4, location=(gate_x, gate_y + 1.5, gate_z + 1.7), material=mat_stone_dark)
    build_models.create_cone("CentralKeepSpire", radius=1.7, depth=2.0, vertices=8, location=(gate_x, gate_y + 1.5, gate_z + 4.2), material=mat_spire)
    build_models.create_cone("SpireFinial", radius=0.25, depth=0.5, vertices=6, location=(gate_x, gate_y + 1.5, gate_z + 5.3), material=mat_gold)
    build_models.create_cylinder("RoyalBannerPole", radius=0.05, depth=1.6, vertices=4, location=(gate_x, gate_y + 1.5, gate_z + 5.6), material=mat_wood)
    build_models.create_box("RoyalFlag", size=(0.04, 0.85, 0.5), location=(gate_x, gate_y + 1.9, gate_z + 6.0), material=mat_banner)

    build_models.create_box("WallL", size=(4.5, 1.2, 2.4), location=(gate_x - 4.6, gate_y + 0.8, gate_z + 1.2), material=mat_wall)
    build_models.create_box("WallR", size=(4.5, 1.2, 2.4), location=(gate_x + 4.6, gate_y + 0.8, gate_z + 1.2), material=mat_wall)
    build_models.create_box("ParapetL", size=(4.5, 0.3, 0.45), location=(gate_x - 4.6, gate_y + 0.2, gate_z + 2.6), material=mat_stone_dark)
    build_models.create_box("ParapetR", size=(4.5, 0.3, 0.45), location=(gate_x + 4.6, gate_y + 0.2, gate_z + 2.6), material=mat_stone_dark)

def setup_common_scene(render_w=1600, render_h=2400, sky_color='#A6CEF0'):
    scene = blender_utils.reset_scene()
    scene.render.resolution_x = render_w
    scene.render.resolution_y = render_h
    scene.render.film_transparent = False

    if hasattr(scene, "eevee") and hasattr(scene.eevee, "use_gtao"):
        scene.eevee.use_gtao = True
        scene.eevee.gtao_distance = 2.5
        scene.eevee.gtao_factor = 1.3

    world = bpy.data.worlds.new("SkyWorld")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get('Background')
    bg.inputs['Color'].default_value = blender_utils.hex_to_linear_rgb(sky_color)
    bg.inputs['Strength'].default_value = 1.0

    blender_utils.setup_diorama_lights()
    cam = blender_utils.setup_isometric_camera(
        ortho_scale=25.0,
        elevation_deg=40.0,
        rotation_z_deg=0.0,
        distance=50.0,
        center=(0.0, -1.8, 1.0)
    )
    return scene, cam

def project_path(scene, cam, path_3d, render_w=1024, render_h=1536):
    wps = []
    for pt in path_3d:
        co = bpy_extras.object_utils.world_to_camera_view(scene, cam, Vector(pt))
        px = max(0, min(render_w, round(co.x * render_w)))
        py = max(0, min(render_h, round((1.0 - co.y) * render_h)))
        wps.append({"x": px, "y": py})
    return wps

def project_plots(scene, cam, plot_coords_3d, render_w=1024, render_h=1536):
    plots = []
    for i, pt in enumerate(plot_coords_3d):
        co = bpy_extras.object_utils.world_to_camera_view(scene, cam, Vector(pt))
        px = max(0, min(render_w, round(co.x * render_w)))
        py = max(0, min(render_h, round((1.0 - co.y) * render_h)))
        plots.append({"id": i, "x": px, "y": py})
    return plots

# ==================== MAP 2: 凍湖冰橋 (Mirror Lake - Two Routes Merging) ====================
def render_map2():
    scene, cam = setup_common_scene(1600, 2400, sky_color='#A6CEF0')
    mat_teal = blender_utils.get_material('glacier_teal', roughness=0.35)
    mat_ice = blender_utils.get_material('ice', roughness=0.55)
    mat_rock = blender_utils.get_material('slate_blue', roughness=0.85)
    mat_stone = blender_utils.get_material('stone')
    mat_stone_dark = blender_utils.get_material('stone_dark')
    mat_road = blender_utils.get_material('road_gold', roughness=0.85)
    mat_wood = blender_utils.get_material('wood')
    mat_wood_dark = blender_utils.get_material('wood_dark')
    mat_saffron = blender_utils.get_material('saffron')
    mat_sky = blender_utils.get_material('sky', hex_color='#A6CEF0', emission='#A6CEF0')

    # 1. Daylight Sky Backdrop
    build_models.create_box("SkyBackdrop", size=(100.0, 2.0, 50.0), location=(0.0, 16.0, 6.0), material=mat_sky)

    # 2. Frozen Lake Bed (Turquoise glacial lake, zero black voids)
    build_models.create_box("LakeBed", size=(90.0, 90.0, 4.0), location=(0.0, 0.0, -2.0), material=mat_teal)

    # 3. Continuous Mountain Flanks
    build_faceted_mountain_flank("WestFlank", -1, min_y=-14.0, max_y=12.0, steps_y=20, base_dist=5.2, crest_dist=14.0, max_z=7.5, mat_snow=mat_ice, mat_rock=mat_rock, mat_ice=mat_teal)
    build_faceted_mountain_flank("EastFlank", 1, min_y=-14.0, max_y=12.0, steps_y=20, base_dist=5.2, crest_dist=14.0, max_z=7.5, mat_snow=mat_ice, mat_rock=mat_rock, mat_ice=mat_teal)

    # Cracked ice plates on lake surface
    ice_plates = [
        ((-4.5, -7.5, 0.05), (5.5, 6.5, 0.15), mat_ice),
        ((4.5, -7.5, 0.05), (5.5, 6.5, 0.15), mat_ice),
        ((0.0, -3.5, 0.08), (4.5, 5.5, 0.18), mat_ice),
        ((-5.5, 0.5, 0.06), (4.5, 5.0, 0.15), mat_teal),
        ((5.5, 0.5, 0.06), (4.5, 5.0, 0.15), mat_teal),
        ((0.0, 4.0, 0.10), (5.5, 6.0, 0.20), mat_ice),
    ]
    for loc, sz, m in ice_plates:
        build_models.create_box("IcePlate", size=sz, location=loc, material=m)

    # 4. Two Routes Merging
    pA = [(-3.6, -11.0, 0.2), (-2.8, -8.5, 0.3), (-2.0, -5.5, 0.4), (-0.8, -2.5, 0.5), (0.0, -0.5, 0.6), (0.8, 2.0, 1.0), (0.4, 4.8, 1.4), (0.0, 7.2, 1.8)]
    pB = [(3.6, -11.0, 0.2), (2.8, -8.5, 0.3), (2.0, -5.5, 0.4), (0.8, -2.5, 0.5), (0.0, -0.5, 0.6), (0.8, 2.0, 1.0), (0.4, 4.8, 1.4), (0.0, 7.2, 1.8)]

    build_road_ribbon(pA, road_width=2.5, material=mat_road)
    build_road_ribbon(pB, road_width=2.5, material=mat_road)
    add_road_curbs(pA, road_width=2.5, material=mat_stone_dark)
    add_road_curbs(pB, road_width=2.5, material=mat_stone_dark)

    # Wooden trestle bridge piers & railings along bridge spans
    for p_route in [pA, pB]:
        for pt in p_route[:5]:
            build_models.create_cylinder("BridgePierL", radius=0.10, depth=1.2, vertices=6, location=(pt[0] - 1.4, pt[1], pt[2] - 0.4), material=mat_wood_dark)
            build_models.create_cylinder("BridgePierR", radius=0.10, depth=1.2, vertices=6, location=(pt[0] + 1.4, pt[1], pt[2] - 0.4), material=mat_wood_dark)
            build_models.create_box("RailingL", size=(0.10, 0.9, 0.4), location=(pt[0] - 1.45, pt[1], pt[2] + 0.35), material=mat_wood)
            build_models.create_box("RailingR", size=(0.10, 0.9, 0.4), location=(pt[0] + 1.45, pt[1], pt[2] + 0.35), material=mat_wood)

    # 5. Grand Keep
    build_grand_keep(0.0, 7.2, 1.8, mat_stone, mat_stone_dark, mat_teal, mat_saffron)

    # 6. Strategic Plots
    def calc_plot(p_list, seg_idx, t, side):
        pA_pt = p_list[seg_idx]
        pB_pt = p_list[seg_idx + 1]
        mx = pA_pt[0] + (pB_pt[0] - pA_pt[0]) * t
        my = pA_pt[1] + (pB_pt[1] - pA_pt[1]) * t
        mz = pA_pt[2] + (pB_pt[2] - pA_pt[2]) * t
        dx = pB_pt[0] - pA_pt[0]
        dy = pB_pt[1] - pA_pt[1]
        l = max(0.001, math.hypot(dx, dy))
        nx = -dy / l * side
        ny = dx / l * side
        return (mx + nx * 1.25, my + ny * 1.25, mz)

    plots_3d = [
        calc_plot(pA, 0, 0.5, -1),
        calc_plot(pA, 1, 0.5, 1),
        calc_plot(pB, 0, 0.5, 1),
        calc_plot(pB, 1, 0.5, -1),
        calc_plot(pA, 2, 0.5, -1),
        calc_plot(pB, 2, 0.5, 1),
        (0.0, -1.8, 0.55),
        (0.0, 0.2, 0.75),
        (-0.6, 3.2, 1.2),
        (1.4, 3.2, 1.2),
        (-1.4, 5.8, 1.6),
        (1.4, 5.8, 1.6),
    ]

    for i, p_loc in enumerate(plots_3d):
        build_models.create_oct_prism(f"Plot_{i}", radius=0.85, depth=0.18, location=p_loc, material=mat_stone)

    # 7. Fir Trees on outer shores
    fir_candidates = [
        (-5.5, -9.0, 0.4, 1.2), (-6.2, -7.0, 0.5, 0.9), (-5.8, -4.5, 0.6, 1.1),
        (-5.2, 1.0, 0.8, 1.3), (-6.0, 4.0, 1.1, 1.0), (-5.5, 7.0, 1.4, 0.9),
        (5.5, -9.0, 0.4, 1.2), (6.2, -7.0, 0.5, 0.9), (5.8, -4.5, 0.6, 1.1),
        (5.2, 1.0, 0.8, 1.3), (6.0, 4.0, 1.1, 1.0), (5.5, 7.0, 1.4, 0.9),
        (0.0, -12.5, 0.1, 0.9), (-2.0, -12.5, 0.1, 0.8), (2.0, -12.5, 0.1, 0.8)
    ]
    for fx, fy, fz, fsc in fir_candidates:
        if is_clear_of_road_and_plots(fx, fy, [pA, pB], plots_3d):
            create_fir_tree((fx, fy, fz), scale=fsc)

    bpy.context.view_layer.update()
    wpsA = project_path(scene, cam, pA, 1024, 1536)
    wpsB = project_path(scene, cam, pB, 1024, 1536)
    plots_2d = project_plots(scene, cam, plots_3d, 1024, 1536)

    meta = {
        "id": "map2",
        "name": "凍湖冰橋",
        "region": 2,
        "width": 1024,
        "height": 1536,
        "waypoints": wpsA,
        "paths": [wpsA, wpsB],
        "plots": plots_2d,
        "castle_pos": wpsA[-1],
        "spawn_pos": wpsA[0],
        "spawns": [wpsA[0], wpsB[0]],
        "description": "冰封湖面裂痕遍佈，木造棧橋橫跨兩側，焰裔分兵夾擊！"
    }
    bpy.context.scene.render.filepath = "assets/maps/map2.png"
    bpy.ops.render.render(write_still=True)
    with open("assets/maps/map2.json", "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
    print("Map 2 rendered at 1600x2400 successfully!")

# ==================== MAP 3: 冷杉林道 (Fir Forest Switchback) ====================
def render_map3():
    scene, cam = setup_common_scene(1600, 2400, sky_color='#A6CEF0')
    mat_fir = blender_utils.get_material('fir_green', roughness=0.7)
    mat_ice = blender_utils.get_material('ice', roughness=0.6)
    mat_rock = blender_utils.get_material('slate_blue', roughness=0.85)
    mat_stone = blender_utils.get_material('stone')
    mat_stone_dark = blender_utils.get_material('stone_dark')
    mat_road = blender_utils.get_material('road_gold', roughness=0.85)
    mat_wood = blender_utils.get_material('wood_dark')
    mat_saffron = blender_utils.get_material('saffron')
    mat_sky = blender_utils.get_material('sky', hex_color='#A6CEF0', emission='#A6CEF0')

    # 1. Daylight Sky Backdrop
    build_models.create_box("SkyBackdrop", size=(100.0, 2.0, 50.0), location=(0.0, 16.0, 6.0), material=mat_sky)

    # 2. Dense Forest Valley & Continuous Alpine Mountain Flanks
    build_models.create_box("ForestValley", size=(90.0, 90.0, 4.0), location=(0.0, 0.0, -2.0), material=mat_ice)

    build_faceted_mountain_flank("WestFlank", -1, min_y=-14.0, max_y=12.0, steps_y=20, base_dist=3.2, crest_dist=14.0, max_z=7.5, mat_snow=mat_ice, mat_rock=mat_rock, mat_ice=mat_fir)
    build_faceted_mountain_flank("EastFlank", 1, min_y=-14.0, max_y=12.0, steps_y=20, base_dist=3.2, crest_dist=14.0, max_z=7.5, mat_snow=mat_ice, mat_rock=mat_rock, mat_ice=mat_fir)

    # 3. Long Switchback Path
    p3 = [
        (0.0, -11.0, 0.2),
        (2.8, -9.0, 0.4),
        (3.6, -6.8, 0.6),
        (1.5, -5.0, 0.8),
        (-2.4, -3.2, 1.0),
        (-3.0, -1.2, 1.2),
        (-0.8, 0.8, 1.4),
        (2.6, 2.4, 1.6),
        (3.2, 4.2, 1.7),
        (1.5, 5.6, 1.8),
        (0.0, 7.2, 1.8)
    ]
    build_road_ribbon(p3, road_width=2.5, material=mat_road)
    add_road_curbs(p3, road_width=2.5, material=mat_wood)

    # Timber retaining walls supporting each switchback terrace
    for p_idx in [2, 5, 8]:
        pt = p3[p_idx]
        build_models.create_box("CribWall", size=(0.4, 3.2, 0.6), location=(pt[0] - 0.2, pt[1], pt[2] - 0.2), material=mat_wood)

    # 4. Forest Gate Keep
    build_grand_keep(0.0, 7.2, 1.8, mat_stone, mat_stone_dark, mat_fir, mat_saffron)

    # 5. Strategic Plots
    def calc_plot(seg_idx, t, side):
        pA_pt = p3[seg_idx]
        pB_pt = p3[seg_idx + 1]
        mx = pA_pt[0] + (pB_pt[0] - pA_pt[0]) * t
        my = pA_pt[1] + (pB_pt[1] - pA_pt[1]) * t
        mz = pA_pt[2] + (pB_pt[2] - pA_pt[2]) * t
        dx = pB_pt[0] - pA_pt[0]
        dy = pB_pt[1] - pA_pt[1]
        l = max(0.001, math.hypot(dx, dy))
        nx = -dy / l * side
        ny = dx / l * side
        return (mx + nx * 1.25, my + ny * 1.25, mz)

    plot_configs = [
        (0, 0.4, -1),
        (1, 0.5, 1),
        (2, 0.5, -1),
        (3, 0.5, 1),
        (4, 0.5, -1),
        (5, 0.5, 1),
        (6, 0.5, -1),
        (7, 0.5, 1),
        (8, 0.5, -1),
        (9, 0.5, 1)
    ]
    plots_3d = [calc_plot(cfg[0], cfg[1], cfg[2]) for cfg in plot_configs]
    for i, p_loc in enumerate(plots_3d):
        build_models.create_oct_prism(f"Plot_{i}", radius=0.85, depth=0.18, location=p_loc, material=mat_stone)

    # 6. Over 85 Fir Trees in dense groves
    fir_candidates = []
    # Left slopes
    for fy in [-12.0, -10.0, -8.0, -6.0, -4.0, -2.0, 0.0, 2.0, 4.0, 6.0, 8.0, 10.0]:
        for fx, fsc in [(-4.8, 1.2), (-5.6, 0.9), (-6.5, 1.15), (-4.2, 0.8)]:
            fir_candidates.append((fx, fy + (fx * 0.3), 0.5 + (fy + 12) * 0.1, fsc))
    # Right slopes
    for fy in [-12.0, -10.0, -8.0, -6.0, -4.0, -2.0, 0.0, 2.0, 4.0, 6.0, 8.0, 10.0]:
        for fx, fsc in [(4.8, 1.2), (5.6, 0.9), (6.5, 1.15), (4.2, 0.8)]:
            fir_candidates.append((fx, fy + (fx * 0.3), 0.5 + (fy + 12) * 0.1, fsc))

    for fx, fy, fz, fsc in fir_candidates:
        if is_clear_of_road_and_plots(fx, fy, [p3], plots_3d):
            create_fir_tree((fx, fy, fz), scale=fsc)

    bpy.context.view_layer.update()
    wps = project_path(scene, cam, p3, 1024, 1536)
    plots_2d = project_plots(scene, cam, plots_3d, 1024, 1536)

    meta = {
        "id": "map3",
        "name": "冷杉林道",
        "region": 3,
        "width": 1024,
        "height": 1536,
        "waypoints": wps,
        "plots": plots_2d,
        "castle_pos": wps[-1],
        "spawn_pos": wps[0],
        "description": "古老冷杉密林覆蓋嘅山嶺，多重盤旋彎道，易守難攻。"
    }
    bpy.context.scene.render.filepath = "assets/maps/map3.png"
    bpy.ops.render.render(write_still=True)
    with open("assets/maps/map3.json", "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
    print("Map 3 rendered at 1600x2400 successfully!")

# ==================== MAP 4: 焰口邊境 (Volcanic Border) ====================
def render_map4():
    scene, cam = setup_common_scene(1600, 2400, sky_color='#3D2426')
    mat_basalt = blender_utils.get_material('slate_blue', hex_color='#363B48', roughness=0.85)
    mat_basalt_dark = blender_utils.get_material('stone_dark', hex_color='#252830', roughness=0.9)
    mat_stone_dark = blender_utils.get_material('stone_dark')
    mat_road = blender_utils.get_material('road_gold', roughness=0.85)
    mat_magma = blender_utils.get_material('ember_coral', hex_color='#FF4500', emission='#FF4500')
    mat_glow = blender_utils.get_material('ember_glow', hex_color='#FF8800', emission='#FF8800')
    mat_sky = blender_utils.get_material('volcano_sky', hex_color='#3D2426', emission='#3D2426')

    # 1. Volcanic Ash Horizon Backdrop
    build_models.create_box("SkyBackdrop", size=(100.0, 2.0, 50.0), location=(0.0, 16.0, 6.0), material=mat_sky)

    # 2. Basalt & Obsidian Canyon Floor (Zero black voids)
    build_models.create_box("BasaltFloor", size=(90.0, 90.0, 4.0), location=(0.0, 0.0, -2.0), material=mat_basalt)

    # 3. Continuous Basalt & Obsidian Mountain Ridges
    build_faceted_mountain_flank("WestFlank", -1, min_y=-14.0, max_y=12.0, steps_y=20, base_dist=5.2, crest_dist=14.0, max_z=7.5, mat_snow=mat_basalt_dark, mat_rock=mat_basalt, mat_ice=mat_magma)
    build_faceted_mountain_flank("EastFlank", 1, min_y=-14.0, max_y=12.0, steps_y=20, base_dist=5.2, crest_dist=14.0, max_z=7.5, mat_snow=mat_basalt_dark, mat_rock=mat_basalt, mat_ice=mat_magma)

    # 4. Molten Magma Fissures cutting across canyon (Glowing emission strength 6.0)
    magma_veins = [
        ((-4.5, -8.0, 0.12), (3.0, 5.5, 0.22)),
        ((4.5, -8.0, 0.12), (3.0, 5.5, 0.22)),
        ((-3.8, -1.0, 0.14), (2.6, 6.5, 0.24)),
        ((3.8, -1.0, 0.14), (2.6, 6.5, 0.24)),
        ((-3.5, 4.0, 0.16), (2.4, 5.5, 0.26)),
        ((3.5, 4.0, 0.16), (2.4, 5.5, 0.26)),
        ((0.0, -9.0, 0.10), (1.6, 4.0, 0.20)),
        ((0.0, 1.0, 0.12), (1.8, 4.5, 0.22)),
    ]
    for loc, sz in magma_veins:
        build_models.create_box("MagmaFissure", size=sz, location=loc, material=mat_magma)
        # Ember crust along edge
        build_models.create_box("EmberEdge", size=(sz[0] + 0.4, sz[1] + 0.4, 0.08), location=(loc[0], loc[1], loc[2] - 0.04), material=mat_glow)

    # 5. Path
    p4 = [
        (0.0, -11.0, 0.2),
        (-2.4, -9.0, 0.4),
        (-3.5, -6.5, 0.6),
        (-1.8, -4.2, 0.8),
        (1.8, -2.0, 1.0),
        (3.4, 0.5, 1.2),
        (2.2, 3.0, 1.4),
        (0.6, 4.8, 1.6),
        (0.0, 6.2, 1.8),
        (0.0, 7.2, 1.8)
    ]
    build_road_ribbon(p4, road_width=2.5, material=mat_road)
    add_road_curbs(p4, road_width=2.5, material=mat_stone_dark)

    # 6. Volcanic Fortress Gatehouse
    build_grand_keep(0.0, 7.2, 1.8, mat_stone_dark, mat_basalt_dark, mat_magma, mat_glow)

    # 7. Strategic Plots
    def calc_plot(p_list, seg_idx, t, side):
        pA_pt = p_list[seg_idx]
        pB_pt = p_list[seg_idx + 1]
        mx = pA_pt[0] + (pB_pt[0] - pA_pt[0]) * t
        my = pA_pt[1] + (pB_pt[1] - pA_pt[1]) * t
        mz = pA_pt[2] + (pB_pt[2] - pA_pt[2]) * t
        dx = pB_pt[0] - pA_pt[0]
        dy = pB_pt[1] - pA_pt[1]
        l = max(0.001, math.hypot(dx, dy))
        nx = -dy / l * side
        ny = dx / l * side
        return (mx + nx * 1.25, my + ny * 1.25, mz)

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
    plots_3d = [calc_plot(p4, cfg[0], cfg[1], cfg[2]) for cfg in plot_configs]
    for i, p_loc in enumerate(plots_3d):
        build_models.create_oct_prism(f"Plot_{i}", radius=0.85, depth=0.18, location=p_loc, material=mat_stone_dark)

    bpy.context.view_layer.update()
    wps = project_path(scene, cam, p4, 1024, 1536)
    plots_2d = project_plots(scene, cam, plots_3d, 1024, 1536)

    meta = {
        "id": "map4",
        "name": "焰口邊境",
        "region": 4,
        "width": 1024,
        "height": 1536,
        "waypoints": wps,
        "plots": plots_2d,
        "castle_pos": wps[-1],
        "spawn_pos": wps[0],
        "description": "熾熱火山熔岩邊界，岩漿裂隙噴發，焰裔精銳傾巢而出。"
    }
    bpy.context.scene.render.filepath = "assets/maps/map4.png"
    bpy.ops.render.render(write_still=True)
    with open("assets/maps/map4.json", "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
    print("Map 4 rendered at 1600x2400 successfully!")

# ==================== MAP 5: 北辰堡 (Royal Citadel - Double Approach) ====================
def render_map5():
    scene, cam = setup_common_scene(1600, 2400, sky_color='#A6CEF0')
    mat_teal = blender_utils.get_material('glacier_teal', roughness=0.35)
    mat_ice = blender_utils.get_material('ice', roughness=0.6)
    mat_stone = blender_utils.get_material('stone')
    mat_stone_dark = blender_utils.get_material('stone_dark')
    mat_road = blender_utils.get_material('road_gold', roughness=0.85)
    mat_saffron = blender_utils.get_material('saffron')
    mat_sky = blender_utils.get_material('sky', hex_color='#A6CEF0', emission='#A6CEF0')

    # 1. Daylight Royal Sky Backdrop
    build_models.create_box("SkyBackdrop", size=(100.0, 2.0, 50.0), location=(0.0, 16.0, 6.0), material=mat_sky)

    # 2. Grand Royal Citadel Terraces (Zero black voids)
    build_models.create_box("CitadelBase", size=(90.0, 90.0, 4.0), location=(0.0, 0.0, -2.0), material=mat_stone)

    # 3. Continuous Citadel Mountain Bastion Ridges
    build_faceted_mountain_flank("WestFlank", -1, min_y=-14.0, max_y=12.0, steps_y=20, base_dist=4.8, crest_dist=14.0, max_z=7.5, mat_snow=mat_ice, mat_rock=mat_stone, mat_ice=mat_teal)
    build_faceted_mountain_flank("EastFlank", 1, min_y=-14.0, max_y=12.0, steps_y=20, base_dist=4.8, crest_dist=14.0, max_z=7.5, mat_snow=mat_ice, mat_rock=mat_stone, mat_ice=mat_teal)

    # Flanking Bastion Watchtowers
    for bx in [-5.8, 5.8]:
        build_models.create_cylinder("RoyalBastion", radius=1.1, depth=3.2, vertices=8, location=(bx, 2.5, 2.2), material=mat_stone)
        build_models.create_cone("BastionRoof", radius=1.3, depth=1.6, vertices=8, location=(bx, 2.5, 4.3), material=mat_teal)
        build_models.create_box("BastionFlag", size=(0.04, 0.6, 0.4), location=(bx, 2.8, 5.2), material=mat_saffron)

    # 4. Dual Converging Approaches
    pA = [(-3.6, -11.0, 0.2), (-3.2, -8.0, 0.3), (-2.5, -5.0, 0.4), (-1.2, -2.0, 0.6), (0.0, 0.5, 0.9), (0.0, 3.0, 1.3), (0.0, 5.5, 1.6), (0.0, 7.2, 1.8)]
    pB = [(3.6, -11.0, 0.2), (3.2, -8.0, 0.3), (2.5, -5.0, 0.4), (1.2, -2.0, 0.6), (0.0, 0.5, 0.9), (0.0, 3.0, 1.3), (0.0, 5.5, 1.6), (0.0, 7.2, 1.8)]

    build_road_ribbon(pA, road_width=2.5, material=mat_road)
    build_road_ribbon(pB, road_width=2.5, material=mat_road)
    add_road_curbs(pA, road_width=2.5, material=mat_stone_dark)
    add_road_curbs(pB, road_width=2.5, material=mat_stone_dark)

    # 5. Grand North Star Royal Palace
    build_grand_keep(0.0, 7.2, 1.8, mat_stone, mat_stone_dark, mat_teal, mat_saffron)

    # 6. Strategic Plots
    def calc_plot(p_list, seg_idx, t, side):
        pA_pt = p_list[seg_idx]
        pB_pt = p_list[seg_idx + 1]
        mx = pA_pt[0] + (pB_pt[0] - pA_pt[0]) * t
        my = pA_pt[1] + (pB_pt[1] - pA_pt[1]) * t
        mz = pA_pt[2] + (pB_pt[2] - pA_pt[2]) * t
        dx = pB_pt[0] - pA_pt[0]
        dy = pB_pt[1] - pA_pt[1]
        l = max(0.001, math.hypot(dx, dy))
        nx = -dy / l * side
        ny = dx / l * side
        return (mx + nx * 1.25, my + ny * 1.25, mz)

    plots_3d = [
        calc_plot(pA, 0, 0.5, -1),
        calc_plot(pA, 1, 0.5, -1),
        calc_plot(pB, 0, 0.5, 1),
        calc_plot(pB, 1, 0.5, 1),
        calc_plot(pA, 2, 0.5, -1),
        calc_plot(pB, 2, 0.5, 1),
        (0.0, -1.2, 0.65),
        (-1.4, 2.0, 1.2),
        (1.4, 2.0, 1.2),
        (-1.4, 4.5, 1.5),
        (1.4, 4.5, 1.5),
        (0.0, 5.8, 1.7)
    ]
    for i, p_loc in enumerate(plots_3d):
        build_models.create_oct_prism(f"Plot_{i}", radius=0.85, depth=0.18, location=p_loc, material=mat_stone)

    # 7. Fir Trees on outer terraces
    fir_candidates = [
        (-4.8, -10.0, 0.3, 1.1), (-5.5, -8.0, 0.4, 0.9), (-5.0, -4.0, 0.6, 1.2),
        (4.8, -10.0, 0.3, 1.1), (5.5, -8.0, 0.4, 0.9), (5.0, -4.0, 0.6, 1.2),
        (-4.2, 4.5, 1.4, 1.0), (4.2, 4.5, 1.4, 1.0),
        (0.0, -12.5, 0.1, 0.95), (-2.0, -12.5, 0.1, 0.85), (2.0, -12.5, 0.1, 0.85),
        (0.0, -3.5, 0.4, 1.0), (0.0, -5.5, 0.3, 0.85)
    ]
    for fx, fy, fz, fsc in fir_candidates:
        if is_clear_of_road_and_plots(fx, fy, [pA, pB], plots_3d):
            create_fir_tree((fx, fy, fz), scale=fsc)

    bpy.context.view_layer.update()
    wpsA = project_path(scene, cam, pA, 1024, 1536)
    wpsB = project_path(scene, cam, pB, 1024, 1536)
    plots_2d = project_plots(scene, cam, plots_3d, 1024, 1536)

    meta = {
        "id": "map5",
        "name": "北辰堡",
        "region": 5,
        "width": 1024,
        "height": 1536,
        "waypoints": wpsA,
        "paths": [wpsA, wpsB],
        "plots": plots_2d,
        "castle_pos": wpsA[-1],
        "spawn_pos": wpsA[0],
        "spawns": [wpsA[0], wpsB[0]],
        "description": "霜門最終王城要塞，雙路防線直達大殿，焰裔總帥最後決戰！"
    }
    bpy.context.scene.render.filepath = "assets/maps/map5.png"
    bpy.ops.render.render(write_still=True)
    with open("assets/maps/map5.json", "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
    print("Map 5 rendered at 1600x2400 successfully!")

def main():
    os.makedirs("assets/maps", exist_ok=True)
    maps_to_render = [arg for arg in sys.argv if arg in ('2', '3', '4', '5')]
    if not maps_to_render:
        maps_to_render = ['2', '3', '4', '5']
    if '2' in maps_to_render:
        render_map2()
    if '3' in maps_to_render:
        render_map3()
    if '4' in maps_to_render:
        render_map4()
    if '5' in maps_to_render:
        render_map5()

if __name__ == "__main__":
    main()
