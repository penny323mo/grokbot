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
    for f in obj.data.polygons:
        f.use_smooth = False

def create_fir_tree(loc, scale=1.0):
    mat_trunk = blender_utils.get_material('wood')
    mat_foliage = blender_utils.get_material('fir_green')
    mat_snow = blender_utils.get_material('ice')

    bpy.ops.mesh.primitive_cylinder_add(vertices=5, radius=0.15*scale, depth=0.8*scale, location=(loc[0], loc[1], loc[2]+0.4*scale))
    trunk = bpy.context.active_object
    make_faceted(trunk)
    trunk.data.materials.append(mat_trunk)

    for z_off, r, h, mat in [
        (0.7, 0.9, 0.8, mat_foliage),
        (1.2, 0.7, 0.7, mat_foliage),
        (1.65, 0.45, 0.6, mat_snow)
    ]:
        bpy.ops.mesh.primitive_cone_add(vertices=6, radius1=r*scale, depth=h*scale, location=(loc[0], loc[1], loc[2]+z_off*scale))
        cone = bpy.context.active_object
        make_faceted(cone)
        cone.data.materials.append(mat)

def build_road_ribbon(path_3d, road_width=2.5, material=None):
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
        l = max(0.001, math.sqrt(dx*dx + dy*dy))
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

def add_road_curbs(path_3d, road_width=2.8, material=None):
    for i in range(len(path_3d) - 1):
        pA = path_3d[i]
        pB = path_3d[i + 1]
        for t in [0.25, 0.75]:
            mx = pA[0] + (pB[0] - pA[0]) * t
            my = pA[1] + (pB[1] - pA[1]) * t
            mz = pA[2] + (pB[2] - pA[2]) * t
            dx = pB[0] - pA[0]
            dy = pB[1] - pA[1]
            l = max(0.001, math.sqrt(dx*dx + dy*dy))
            nx = -dy / l * (road_width * 0.5 + 0.12)
            ny = dx / l * (road_width * 0.5 + 0.12)
            build_models.create_box(f"CurbL_{i}_{t}", size=(0.22, 0.22, 0.16), location=(mx - nx, my - ny, mz + 0.1), material=material)
            build_models.create_box(f"CurbR_{i}_{t}", size=(0.22, 0.22, 0.16), location=(mx + nx, my + ny, mz + 0.1), material=material)

def build_grand_keep(gate_x, gate_y, gate_z, mat_stone, mat_stone_dark, mat_spire, mat_banner, mat_wall=None):
    if mat_wall is None:
        mat_wall = mat_stone
    build_models.create_oct_prism("CentralKeep", radius=2.6, depth=5.5, location=(gate_x, gate_y + 2.0, gate_z + 2.8), material=mat_stone_dark)
    build_models.create_cone("CentralKeepSpire", radius=2.0, depth=2.4, vertices=6, location=(gate_x, gate_y + 2.0, gate_z + 6.3), material=mat_spire)
    build_models.create_cylinder("CentralBannerPole", radius=0.06, depth=2.0, vertices=4, location=(gate_x, gate_y + 2.0, gate_z + 7.8), material=blender_utils.get_material('wood_dark'))
    build_models.create_box("CentralFlag", size=(0.05, 0.9, 0.6), location=(gate_x, gate_y + 2.4, gate_z + 8.2), material=mat_banner)

    build_models.create_box("WallL", size=(4.5, 1.4, 3.2), location=(gate_x - 4.5, gate_y + 1.2, gate_z + 1.6), material=mat_wall)
    build_models.create_box("WallR", size=(4.5, 1.4, 3.2), location=(gate_x + 4.5, gate_y + 1.2, gate_z + 1.6), material=mat_wall)
    build_models.create_box("WallParapetL", size=(4.5, 0.3, 0.5), location=(gate_x - 4.5, gate_y + 0.5, gate_z + 3.4), material=mat_stone_dark)
    build_models.create_box("WallParapetR", size=(4.5, 0.3, 0.5), location=(gate_x + 4.5, gate_y + 0.5, gate_z + 3.4), material=mat_stone_dark)

    build_models.create_oct_prism("BastionL", radius=1.2, depth=4.2, location=(gate_x - 5.5, gate_y + 1.0, gate_z + 2.1), material=mat_stone_dark)
    build_models.create_cone("BastionRoofL", radius=1.3, depth=1.4, vertices=6, location=(gate_x - 5.5, gate_y + 1.0, gate_z + 4.8), material=mat_spire)
    build_models.create_oct_prism("BastionR", radius=1.2, depth=4.2, location=(gate_x + 5.5, gate_y + 1.0, gate_z + 2.1), material=mat_stone_dark)
    build_models.create_cone("BastionRoofR", radius=1.3, depth=1.4, vertices=6, location=(gate_x + 5.5, gate_y + 1.0, gate_z + 4.8), material=mat_spire)

def project_path(scene, cam, path_3d, render_w, render_h):
    wps = []
    for pt in path_3d:
        co = bpy_extras.object_utils.world_to_camera_view(scene, cam, Vector(pt))
        px = max(0, min(render_w, round(co.x * render_w)))
        py = max(0, min(render_h, round((1.0 - co.y) * render_h)))
        wps.append({"x": px, "y": py})
    return wps

# ----------------- MAP 2: 凍湖冰橋 (Frozen Lake: Two Roads Merging) -----------------
def render_map2():
    scene = blender_utils.reset_scene()
    scene.render.resolution_x = 1024
    scene.render.resolution_y = 1536
    scene.render.film_transparent = False
    blender_utils.setup_diorama_lights()

    mat_ice = blender_utils.get_material('ice', roughness=0.3)
    mat_teal = blender_utils.get_material('glacier_teal', roughness=0.45)
    mat_stone = blender_utils.get_material('stone')
    mat_stone_dark = blender_utils.get_material('stone_dark')
    mat_road = blender_utils.get_material('road_gold', roughness=0.85)
    mat_saffron = blender_utils.get_material('saffron')

    # Base Terrain & Frozen Lake Plate
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.5, -1.0))
    lake = bpy.context.active_object
    lake.scale = (32.0, 44.0, 2.0)
    bpy.ops.object.transform_apply(scale=True)
    make_faceted(lake)
    lake.data.materials.append(mat_teal)

    # Lateral Snow Banks, Ice Shelves & Stepped Foreground Terraces
    snow_banks = [
        ((-7.5, -4.0, 0.6), (4.5, 6.0, 1.4), mat_ice),
        ((-8.0, 1.0, 0.8), (4.5, 6.0, 1.8), mat_ice),
        ((-7.5, 5.0, 1.2), (4.5, 5.5, 2.6), mat_ice),
        ((7.5, -4.0, 0.6), (4.5, 6.0, 1.4), mat_ice),
        ((8.0, 1.0, 0.8), (4.5, 6.0, 1.8), mat_ice),
        ((7.5, 5.0, 1.2), (4.5, 5.5, 2.6), mat_ice),
        # Central Island Hub
        ((0.0, 0.8, 0.15), (4.2, 3.6, 0.4), mat_stone_dark),
        # Foreground Stepped Ice Shelves
        ((-5.8, -6.2, 0.4), (4.2, 3.8, 0.8), mat_stone_dark),
        ((-5.8, -6.2, 0.85), (3.9, 3.5, 0.3), mat_ice),
        ((-3.8, -6.8, 0.25), (3.2, 2.6, 0.5), mat_stone_dark),
        ((-3.8, -6.8, 0.55), (2.9, 2.3, 0.2), mat_ice),
        ((5.8, -6.2, 0.4), (4.2, 3.8, 0.8), mat_stone_dark),
        ((5.8, -6.2, 0.85), (3.9, 3.5, 0.3), mat_ice),
        ((3.8, -6.8, 0.25), (3.2, 2.6, 0.5), mat_stone_dark),
        ((3.8, -6.8, 0.55), (2.9, 2.3, 0.2), mat_ice),
    ]
    for loc, sc, mat in snow_banks:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=loc)
        obj = bpy.context.active_object
        obj.scale = sc
        bpy.ops.object.transform_apply(scale=True)
        make_faceted(obj)
        obj.data.materials.append(mat)

    # TWO ROUTES MERGING AT CENTRAL HUB:
    path_A_3d = [
        (-1.8, -6.0, 0.25),
        (-2.4, -4.2, 0.25),
        (-1.8, -2.2, 0.25),
        (-0.8, -0.6, 0.25),
        (0.0, 0.8, 0.25),   # Merged Hub
        (1.0, 2.2, 0.25),
        (0.6, 3.6, 0.25),
        (0.0, 5.0, 0.25)    # Citadel Gate
    ]
    path_B_3d = [
        (1.8, -6.0, 0.25),
        (2.4, -4.2, 0.25),
        (1.8, -2.2, 0.25),
        (0.8, -0.6, 0.25),
        (0.0, 0.8, 0.25),   # Merged Hub
        (1.0, 2.2, 0.25),
        (0.6, 3.6, 0.25),
        (0.0, 5.0, 0.25)    # Citadel Gate
    ]

    build_road_ribbon(path_A_3d, road_width=2.8, material=mat_road)
    build_road_ribbon(path_B_3d, road_width=2.8, material=mat_road)
    add_road_curbs(path_A_3d, road_width=2.8, material=mat_stone_dark)
    add_road_curbs(path_B_3d, road_width=2.8, material=mat_stone_dark)

    # Watchtower at Central Hub
    build_models.create_oct_prism("HubTower", radius=0.9, depth=2.4, location=(-1.8, 1.6, 1.2), material=mat_stone)

    # Goal Gatehouse & Grand Keep Complex (fills background leak point)
    build_models.create_oct_prism("GateL", radius=1.0, depth=3.0, location=(-1.8, 5.4, 1.5), material=mat_stone)
    build_models.create_oct_prism("GateR", radius=1.0, depth=3.0, location=(1.8, 5.4, 1.5), material=mat_stone)
    build_models.create_box("GateArch", size=(2.8, 1.0, 0.9), location=(0.0, 5.4, 2.5), material=mat_stone)
    build_grand_keep(0.0, 5.2, 0.25, mat_stone, mat_stone_dark, mat_teal, mat_saffron)

    # Dense fir trees along the frozen shore and terraces (Bad North density: 50+ trees)
    tree_locs = [
        (-5.2, -5.0), (-5.8, -4.2), (-4.8, -3.5), (-6.0, -2.8), (-5.2, -2.0), (-5.6, -1.2),
        (-5.0, 0.0), (-5.8, 0.8), (-5.2, 1.8), (-5.6, 2.8), (-4.8, 3.8), (-5.5, 4.8), (-4.2, 5.5),
        (5.2, -5.0), (5.8, -4.2), (4.8, -3.5), (6.0, -2.8), (5.2, -2.0), (5.6, -1.2),
        (5.0, 0.0), (5.8, 0.8), (5.2, 1.8), (5.6, 2.8), (4.8, 3.8), (5.5, 4.8), (4.2, 5.5),
        (-7.2, -3.0), (-7.5, 0.0), (-7.2, 3.0), (7.2, -3.0), (7.5, 0.0), (7.2, 3.0),
        (-3.2, -6.2), (-4.2, -6.5), (3.2, -6.2), (4.2, -6.5),
        (-2.8, 1.6), (2.8, 1.6), (-2.4, 3.2), (2.4, 3.2),
        (-6.5, -5.0), (6.5, -5.0), (-6.5, 2.0), (6.5, 2.0)
    ]
    for i, (tx, ty) in enumerate(tree_locs):
        create_fir_tree((tx, ty, 0.4), scale=0.65 + ((i * 7) % 5) * 0.1)

    # Strategic Plots along Path A, Path B, and merged causeway
    plot_coords_3d = [
        (-2.8, -4.8, 0.25), (-0.8, -4.8, 0.25),
        (0.8, -4.8, 0.25),  (2.8, -4.8, 0.25),
        (-2.6, -2.2, 0.25), (2.6, -2.2, 0.25),
        (-1.2, 0.8, 0.25),  (1.2, 0.8, 0.25),
        (-0.5, 3.2, 0.25),  (1.8, 3.2, 0.25)
    ]
    for i, p in enumerate(plot_coords_3d):
        build_models.create_oct_prism(f"Plot_{i}", radius=0.85, depth=0.18, location=p, material=mat_stone)

    cam = blender_utils.setup_isometric_camera(ortho_scale=22.0, elevation_deg=40.0, rotation_z_deg=45.0, distance=50.0, center=(0, -0.5, 0))
    scene.render.filepath = "assets/maps/map2.png"
    bpy.ops.render.render(write_still=True)

    wps_A = project_path(scene, cam, path_A_3d, 1024, 1536)
    wps_B = project_path(scene, cam, path_B_3d, 1024, 1536)

    plots_2d = []
    for i, pt in enumerate(plot_coords_3d):
        co = bpy_extras.object_utils.world_to_camera_view(scene, cam, Vector(pt))
        plots_2d.append({
            "id": i,
            "x": max(0, min(1024, round(co.x * 1024))),
            "y": max(0, min(1536, round((1.0 - co.y) * 1536)))
        })

    meta = {
        "id": "map2",
        "name": "凍湖冰橋",
        "region": 2,
        "width": 1024,
        "height": 1536,
        "paths": [wps_A, wps_B],
        "waypoints": wps_A,
        "plots": plots_2d,
        "castle_pos": wps_A[-1],
        "spawn_pos": wps_A[0],
        "description": "寬闊冰湖之上，寒風刺骨，兩路交匯於冰橋樞紐。"
    }
    with open("assets/maps/map2.json", "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)

# ----------------- MAP 3: 冷杉林道 (Fir Forest Switchback) -----------------
def render_map3():
    scene = blender_utils.reset_scene()
    scene.render.resolution_x = 1024
    scene.render.resolution_y = 1536
    scene.render.film_transparent = False
    blender_utils.setup_diorama_lights()

    mat_snow = blender_utils.get_material('ice', roughness=0.7)
    mat_stone = blender_utils.get_material('slate_blue', roughness=0.85)
    mat_stone_dark = blender_utils.get_material('stone_dark')
    mat_road = blender_utils.get_material('road_gold', roughness=0.85)
    mat_saffron = blender_utils.get_material('saffron')

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.5, -1.0))
    base = bpy.context.active_object
    base.scale = (32.0, 44.0, 2.0)
    bpy.ops.object.transform_apply(scale=True)
    make_faceted(base)
    base.data.materials.append(mat_snow)

    # Multi-tiered mountain ridges and foreground stepped terraces
    for loc, sc in [
        ((-7.5, -4.0, 1.0), (4.5, 6.0, 2.0)),
        ((-8.0, 1.0, 1.4), (4.5, 6.0, 2.8)),
        ((-7.5, 5.0, 1.8), (4.5, 5.5, 3.6)),
        ((7.5, -4.0, 1.0), (4.5, 6.0, 2.0)),
        ((8.0, 1.0, 1.4), (4.5, 6.0, 2.8)),
        ((7.5, 5.0, 1.8), (4.5, 5.5, 3.6)),
        # Foreground terraces
        ((-5.8, -6.2, 0.4), (4.2, 3.8, 0.8)),
        ((-3.8, -6.8, 0.25), (3.2, 2.6, 0.5)),
        ((5.8, -6.2, 0.4), (4.2, 3.8, 0.8)),
        ((3.8, -6.8, 0.25), (3.2, 2.6, 0.5)),
    ]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=loc)
        obj = bpy.context.active_object
        obj.scale = sc
        bpy.ops.object.transform_apply(scale=True)
        make_faceted(obj)
        obj.data.materials.append(mat_stone)

    path_3d = [
        (0.0, -5.8, 0.25),
        (-1.5, -4.2, 0.25),
        (-2.2, -2.8, 0.25),
        (-1.2, -1.4, 0.25),
        (1.2, -0.2, 0.25),
        (2.2, 1.2, 0.25),
        (1.4, 2.6, 0.25),
        (-0.8, 3.8, 0.25),
        (0.0, 5.0, 0.25)
    ]
    build_road_ribbon(path_3d, road_width=2.8, material=mat_road)
    add_road_curbs(path_3d, road_width=2.8, material=mat_stone_dark)

    # Goal Gatehouse & Grand Keep (fills background leak point)
    build_models.create_oct_prism("GateL", radius=1.0, depth=3.0, location=(-1.8, 5.4, 1.5), material=mat_stone)
    build_models.create_oct_prism("GateR", radius=1.0, depth=3.0, location=(1.8, 5.4, 1.5), material=mat_stone)
    build_models.create_box("GateArch", size=(2.8, 1.0, 0.9), location=(0.0, 5.4, 2.5), material=mat_stone)
    build_grand_keep(0.0, 5.2, 0.25, mat_stone, mat_stone_dark, mat_saffron, mat_saffron)

    # Dense fir trees (Bad North density: 60+ trees across the pass)
    tree_coords = [
        (-4.5, -4.5), (-3.8, -4.0), (-4.8, -2.5), (-4.2, -1.5), (-5.2, -1.0),
        (-3.5, 0.0), (-4.6, 1.5), (-4.0, 2.8), (-3.6, 4.5), (-5.0, 3.5), (-5.4, 4.8),
        (0.0, -2.5), (0.2, 1.2), (-0.2, 2.2), (-0.4, 0.4),
        (4.5, -4.2), (3.8, -3.2), (4.6, -1.8), (4.2, -0.2), (5.2, -0.8),
        (4.8, 1.8), (4.0, 3.0), (3.6, 4.5), (5.2, 3.5), (5.5, 4.8),
        (-6.5, -3.5), (-7.0, -1.0), (-6.8, 2.0), (-7.2, 4.0),
        (6.5, -3.5), (7.0, -1.0), (6.8, 2.0), (7.2, 4.0),
        (-2.8, -5.5), (-3.6, -6.2), (2.8, -5.5), (3.6, -6.2),
        (-1.8, 1.5), (1.8, -1.5), (-2.0, -0.5), (2.0, 2.5)
    ]
    for i, (tx, ty) in enumerate(tree_coords):
        create_fir_tree((tx, ty, 0.25), scale=0.65 + ((i * 7) % 5) * 0.1)

    # Strategic Plots: Plot 1 and Plot 3 adjusted to remain tightly within 28px of road gold band
    plot_coords = [
        (-2.6, -4.6, 0.25), (0.4, -4.2, 0.25),
        (-1.2, -2.8, 0.25), (1.3, -1.6, 0.25),
        (-0.2, -0.8, 0.25), (3.0, 0.2, 0.25),
        (3.0, 2.2, 0.25),   (-0.2, 2.8, 0.25),
        (-1.5, 3.6, 0.25),  (0.8, 4.4, 0.25)
    ]
    for i, p in enumerate(plot_coords):
        build_models.create_oct_prism(f"Plot_{i}", radius=0.85, depth=0.18, location=p, material=mat_stone)

    cam = blender_utils.setup_isometric_camera(ortho_scale=22.0, elevation_deg=40.0, rotation_z_deg=45.0, distance=50.0, center=(0, -0.5, 0))
    scene.render.filepath = "assets/maps/map3.png"
    bpy.ops.render.render(write_still=True)

    wps = project_path(scene, cam, path_3d, 1024, 1536)
    plots_2d = []
    for i, pt in enumerate(plot_coords):
        co = bpy_extras.object_utils.world_to_camera_view(scene, cam, Vector(pt))
        plots_2d.append({
            "id": i,
            "x": max(0, min(1024, round(co.x * 1024))),
            "y": max(0, min(1536, round((1.0 - co.y) * 1536)))
        })

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
        "description": "雪杉參天，長折迴旋山道，最適合重炮伏擊。"
    }
    with open("assets/maps/map3.json", "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)

# ----------------- MAP 4: 焰口邊境 (Volcanic Border) -----------------
def render_map4():
    scene = blender_utils.reset_scene()
    scene.render.resolution_x = 1024
    scene.render.resolution_y = 1536
    scene.render.film_transparent = False
    blender_utils.setup_diorama_lights()

    mat_stone = blender_utils.get_material('stone_dark')
    mat_lava = blender_utils.get_material('ember_glow', emission='#FF7A45')
    mat_coral = blender_utils.get_material('ember_coral')
    mat_road = blender_utils.get_material('road_gold', roughness=0.85)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.5, -1.0))
    base = bpy.context.active_object
    base.scale = (32.0, 44.0, 2.0)
    bpy.ops.object.transform_apply(scale=True)
    make_faceted(base)
    base.data.materials.append(mat_stone)

    # Basalt Crags & Stepped Foreground Terraces
    for loc, sc in [
        ((-7.5, -4.0, 1.0), (4.5, 6.0, 2.0)),
        ((-8.0, 1.0, 1.4), (4.5, 6.0, 2.8)),
        ((-7.5, 5.0, 1.8), (4.5, 5.5, 3.6)),
        ((7.5, -4.0, 1.0), (4.5, 6.0, 2.0)),
        ((8.0, 1.0, 1.4), (4.5, 6.0, 2.8)),
        ((7.5, 5.0, 1.8), (4.5, 5.5, 3.6)),
        # Stepped foreground crags
        ((-5.8, -6.2, 0.4), (4.2, 3.8, 0.8)),
        ((-3.8, -6.8, 0.25), (3.2, 2.6, 0.5)),
        ((5.8, -6.2, 0.4), (4.2, 3.8, 0.8)),
        ((3.8, -6.8, 0.25), (3.2, 2.6, 0.5)),
    ]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=loc)
        obj = bpy.context.active_object
        obj.scale = sc
        bpy.ops.object.transform_apply(scale=True)
        make_faceted(obj)
        obj.data.materials.append(mat_coral)

    # Lava pools & Glowing Fissures
    for lx, ly in [(-3.5, -3.0), (3.0, -1.0), (-2.5, 1.5), (3.5, 3.0), (-0.8, -1.5), (-5.0, 0.5), (5.0, 0.5)]:
        bpy.ops.mesh.primitive_cylinder_add(vertices=7, radius=1.3, depth=0.15, location=(lx, ly, 0.12))
        lava = bpy.context.active_object
        make_faceted(lava)
        lava.data.materials.append(mat_lava)

    path_3d = [
        (-1.2, -5.8, 0.25),
        (-1.8, -4.0, 0.25),
        (-0.5, -2.5, 0.25),
        (1.5, -1.2, 0.25),
        (2.0, 0.5, 0.25),
        (0.8, 2.0, 0.25),
        (-1.2, 3.2, 0.25),
        (-0.8, 4.4, 0.25),
        (0.0, 5.0, 0.25)
    ]
    build_road_ribbon(path_3d, road_width=2.8, material=mat_road)
    add_road_curbs(path_3d, road_width=2.8, material=mat_stone)

    # Goal Gatehouse & Grand Obsidian Keep (fills background leak point)
    build_models.create_oct_prism("GateL", radius=1.0, depth=3.0, location=(-1.8, 5.4, 1.5), material=mat_stone)
    build_models.create_oct_prism("GateR", radius=1.0, depth=3.0, location=(1.8, 5.4, 1.5), material=mat_stone)
    build_models.create_box("GateArch", size=(2.8, 1.0, 0.9), location=(0.0, 5.4, 2.5), material=mat_stone)
    build_grand_keep(0.0, 5.2, 0.25, mat_stone, blender_utils.get_material('slate_blue'), mat_coral, mat_coral)

    plot_coords = [
        (-2.6, -4.6, 0.25), (-0.6, -4.6, 0.25),
        (-1.4, -2.2, 0.25), (0.8, -2.0, 0.25),
        (2.8, 0.6, 0.25),   (0.6, 0.8, 0.25),
        (-1.4, 2.6, 0.25),  (0.6, 2.8, 0.25),
        (-1.6, 4.4, 0.25),  (0.4, 4.4, 0.25)
    ]
    for i, p in enumerate(plot_coords):
        build_models.create_oct_prism(f"Plot_{i}", radius=0.85, depth=0.18, location=p, material=mat_stone)

    cam = blender_utils.setup_isometric_camera(ortho_scale=22.0, elevation_deg=40.0, rotation_z_deg=45.0, distance=50.0, center=(0, -0.5, 0))
    scene.render.filepath = "assets/maps/map4.png"
    bpy.ops.render.render(write_still=True)

    wps = project_path(scene, cam, path_3d, 1024, 1536)
    plots_2d = []
    for i, pt in enumerate(plot_coords):
        co = bpy_extras.object_utils.world_to_camera_view(scene, cam, Vector(pt))
        plots_2d.append({
            "id": i,
            "x": max(0, min(1024, round(co.x * 1024))),
            "y": max(0, min(1536, round((1.0 - co.y) * 1536)))
        })

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
        "description": "赤巖熔漿遍佈，南侵前哨戰，地底烈火蠢蠢欲動。"
    }
    with open("assets/maps/map4.json", "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)

# ----------------- MAP 5: 北辰堡 (Citadel: Two Routes Assault) -----------------
def render_map5():
    scene = blender_utils.reset_scene()
    scene.render.resolution_x = 1024
    scene.render.resolution_y = 1536
    scene.render.film_transparent = False
    blender_utils.setup_diorama_lights()

    mat_stone = blender_utils.get_material('slate_blue', roughness=0.85)
    mat_trim = blender_utils.get_material('stone')
    mat_saffron = blender_utils.get_material('saffron')
    mat_road = blender_utils.get_material('road_gold', roughness=0.85)
    mat_ice = blender_utils.get_material('ice', roughness=0.65)
    mat_dark = blender_utils.get_material('stone_dark')

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.5, -1.0))
    base = bpy.context.active_object
    base.scale = (32.0, 44.0, 2.0)
    bpy.ops.object.transform_apply(scale=True)
    make_faceted(base)
    base.data.materials.append(mat_stone)

    # Massive Fortress Bastion Terraces
    bastions = [
        ((-4.8, -3.5, 0.4), (3.0, 4.0, 0.8)),
        ((4.8, -3.5, 0.4), (3.0, 4.0, 0.8)),
        ((-4.5, 0.5, 0.8), (3.5, 5.0, 1.6)),
        ((4.5, 0.5, 0.8), (3.5, 5.0, 1.6)),
        ((0.0, 4.2, 1.4), (8.0, 4.5, 2.8)),
        # Stepped foreground bastions
        ((-5.8, -6.2, 0.4), (4.2, 3.8, 0.8)),
        ((-3.8, -6.8, 0.25), (3.2, 2.6, 0.5)),
        ((5.8, -6.2, 0.4), (4.2, 3.8, 0.8)),
        ((3.8, -6.8, 0.25), (3.2, 2.6, 0.5)),
    ]
    for loc, sc in bastions:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=loc)
        obj = bpy.context.active_object
        obj.scale = sc
        bpy.ops.object.transform_apply(scale=True)
        make_faceted(obj)
        obj.data.materials.append(mat_trim)

    # TWO ROUTES INTO CITADEL (both leading straight into the Citadel Keep):
    path_A_3d = [
        (-1.8, -5.8, 0.25),
        (-2.4, -4.0, 0.35),
        (-2.0, -2.0, 0.55),
        (-1.2, 0.0, 0.75),
        (-0.8, 1.8, 1.05),
        (-0.4, 3.4, 1.35),
        (0.0, 4.6, 1.65),
        (0.0, 5.2, 1.85)   # Inside Citadel Keep
    ]
    path_B_3d = [
        (1.8, -5.8, 0.25),
        (2.4, -4.0, 0.35),
        (2.0, -2.0, 0.55),
        (1.2, 0.0, 0.75),
        (0.8, 1.8, 1.05),
        (0.4, 3.4, 1.35),
        (0.0, 4.6, 1.65),
        (0.0, 5.2, 1.85)   # Inside Citadel Keep
    ]

    build_road_ribbon(path_A_3d, road_width=2.8, material=mat_road)
    build_road_ribbon(path_B_3d, road_width=2.8, material=mat_road)
    add_road_curbs(path_A_3d, road_width=2.8, material=mat_dark)
    add_road_curbs(path_B_3d, road_width=2.8, material=mat_dark)

    # Fortress High Keep & Central Spire (anchoring citadel skyline)
    build_models.create_oct_prism("KeepCentral", radius=2.8, depth=5.8, location=(0.0, 6.0, 3.4), material=mat_stone)
    build_models.create_cone("KeepSpire", radius=2.0, depth=2.4, vertices=6, location=(0.0, 6.0, 6.8), material=mat_saffron)
    build_models.create_cylinder("CitadelBannerPole", radius=0.06, depth=2.0, vertices=4, location=(0.0, 6.0, 8.2), material=blender_utils.get_material('wood_dark'))
    build_models.create_box("CitadelFlag", size=(0.05, 1.0, 0.7), location=(0.0, 6.4, 8.6), material=mat_saffron)

    # Grand Citadel Walls spanning across top
    build_models.create_box("CitadelWallL", size=(5.0, 1.6, 3.8), location=(-5.0, 5.5, 2.2), material=mat_trim)
    build_models.create_box("CitadelWallR", size=(5.0, 1.6, 3.8), location=(5.0, 5.5, 2.2), material=mat_trim)

    # Grand Keep Entrance Gate (twin towers flanking road & overhead lintel arch)
    for tx in [-1.8, 1.8]:
        build_models.create_oct_prism("KeepGateTower", radius=0.9, depth=3.6, location=(tx, 4.8, 2.8), material=mat_trim)
        build_models.create_cone("KeepGateRoof", radius=1.0, depth=1.2, vertices=6, location=(tx, 4.8, 4.8), material=mat_ice)
    build_models.create_box("KeepGateArch", size=(3.6, 1.0, 0.8), location=(0.0, 4.8, 4.2), material=mat_trim)

    # Twin Bastion Towers
    for tx in [-3.2, 3.2]:
        build_models.create_oct_prism("BastionTower", radius=1.1, depth=3.4, location=(tx, 0.5, 1.7), material=mat_trim)
        build_models.create_cone("TowerRoof", radius=1.2, depth=1.0, vertices=6, location=(tx, 0.5, 3.8), material=mat_ice)

    # Fir trees on lower slopes
    for tx, ty in [(-4.8, -5.2), (-5.4, -4.2), (-4.2, -3.2), (4.8, -5.2), (5.4, -4.2), (4.2, -3.2), (-6.0, -1.0), (6.0, -1.0)]:
        create_fir_tree((tx, ty, 0.35), scale=0.75)

    # Plots along West, East, and Central Keep Court
    plot_coords_3d = [
        (-2.8, -4.8, 0.25), (-0.8, -4.8, 0.25),
        (0.8, -4.8, 0.25),  (2.8, -4.8, 0.25),
        (-2.6, -2.0, 0.55), (2.6, -2.0, 0.55),
        (-1.8, 0.8, 0.75),  (1.8, 0.8, 0.75),
        (-1.0, 2.8, 1.15),  (1.0, 2.8, 1.15)
    ]
    for i, p in enumerate(plot_coords_3d):
        build_models.create_oct_prism(f"Plot_{i}", radius=0.85, depth=0.18, location=p, material=mat_stone)

    cam = blender_utils.setup_isometric_camera(ortho_scale=22.0, elevation_deg=40.0, rotation_z_deg=45.0, distance=50.0, center=(0, -0.5, 0))
    scene.render.filepath = "assets/maps/map5.png"
    bpy.ops.render.render(write_still=True)

    wps_A = project_path(scene, cam, path_A_3d, 1024, 1536)
    wps_B = project_path(scene, cam, path_B_3d, 1024, 1536)

    plots_2d = []
    for i, pt in enumerate(plot_coords_3d):
        co = bpy_extras.object_utils.world_to_camera_view(scene, cam, Vector(pt))
        plots_2d.append({
            "id": i,
            "x": max(0, min(1024, round(co.x * 1024))),
            "y": max(0, min(1536, round((1.0 - co.y) * 1536)))
        })

    meta = {
        "id": "map5",
        "name": "北辰堡",
        "region": 5,
        "width": 1024,
        "height": 1536,
        "paths": [wps_A, wps_B],
        "waypoints": wps_A,
        "plots": plots_2d,
        "castle_pos": wps_A[-1],
        "spawn_pos": wps_A[0],
        "description": "冰川王國最後一道要塞，霜門之巔，決戰終焉炎魔！"
    }
    with open("assets/maps/map5.json", "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)

def main():
    print("Rendering Map 2: 凍湖冰橋 (Two Roads Merging)...")
    render_map2()
    print("Rendering Map 3: 冷杉林道...")
    render_map3()
    print("Rendering Map 4: 焰口邊境...")
    render_map4()
    print("Rendering Map 5: 北辰堡 (Citadel: Two Routes)...")
    render_map5()
    print("ALL 4 MAPS RENDERED AND EXPORTED SUCCESSFULLY!")

if __name__ == "__main__":
    main()
