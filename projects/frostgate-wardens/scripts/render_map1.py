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

def create_boulder(loc, scale=1.0, material=None):
    bpy.ops.mesh.primitive_cube_add(size=scale, location=loc, rotation=(0.2, 0.3, 0.4))
    boulder = bpy.context.active_object
    boulder.scale = (1.2, 0.9, 0.8)
    bpy.ops.object.transform_apply(scale=True)
    make_faceted(boulder)
    if material:
        boulder.data.materials.append(material)

def build_road_ribbon(path_3d, road_width=2.5, material=None):
    mesh = bpy.data.meshes.new("RoadMesh")
    road_obj = bpy.data.objects.new("Road", mesh)
    bpy.context.scene.collection.objects.link(road_obj)

    verts = []
    faces = []
    # Build a solid 3D road prism (top and bottom) so normals are solid and elevated
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
        # Vertices at z = pt[2] + 0.2
        verts.append((pt[0] - nx, pt[1] - ny, pt[2] + 0.2))
        verts.append((pt[0] + nx, pt[1] + ny, pt[2] + 0.2))

    for i in range(len(path_3d) - 1):
        v1 = i * 2
        v2 = i * 2 + 1
        v3 = (i + 1) * 2 + 1
        v4 = (i + 1) * 2
        # Double-sided faces to guarantee visibility from any angle
        faces.append((v1, v2, v3, v4))
        faces.append((v1, v4, v3, v2))

    mesh.from_pydata(verts, [], faces)
    mesh.update()
    make_faceted(road_obj)
    if material:
        road_obj.data.materials.append(material)
    return road_obj

def build_map1_scene(render_w=1024, render_h=1536):
    scene = blender_utils.reset_scene()
    scene.render.resolution_x = render_w
    scene.render.resolution_y = render_h
    scene.render.film_transparent = False
    blender_utils.setup_diorama_lights()

    mat_snow = blender_utils.get_material('ice', roughness=0.65)
    mat_rock = blender_utils.get_material('slate_blue', roughness=0.85)
    mat_crevasse = blender_utils.get_material('glacier_teal', roughness=0.5)
    mat_road = blender_utils.get_material('road_gold', roughness=0.85)
    mat_stone = blender_utils.get_material('stone')
    mat_stone_dark = blender_utils.get_material('stone_dark')
    mat_wood = blender_utils.get_material('wood_dark')
    mat_saffron = blender_utils.get_material('saffron')

    # 1. Main Base Terrain Plate - large enough to span entire camera view
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.5, -1.0))
    base_plate = bpy.context.active_object
    base_plate.scale = (32.0, 44.0, 2.0)
    bpy.ops.object.transform_apply(scale=True)
    make_faceted(base_plate)
    base_plate.data.materials.append(mat_snow)

    # 2. Multi-tier Mountain Cliffs & Snow Terraces framing the pass
    ridges = [
        # Western Cliff Wall (Left)
        ((-7.5, -4.5, 0.8), (4.5, 5.5, 1.8), (0.05, -0.08, 0.05), mat_rock),
        ((-7.5, -4.5, 1.7), (4.2, 5.2, 0.5), (0.05, -0.08, 0.05), mat_snow),
        ((-8.0, 0.5, 1.4), (4.8, 6.0, 2.8), (0.05, -0.08, 0.05), mat_rock),
        ((-8.0, 0.5, 2.8), (4.5, 5.6, 0.6), (0.05, -0.08, 0.05), mat_snow),
        ((-7.5, 4.8, 2.0), (4.5, 5.5, 3.8), (0.05, -0.08, 0.05), mat_rock),
        ((-7.5, 4.8, 3.9), (4.2, 5.2, 0.7), (0.05, -0.08, 0.05), mat_snow),

        # Eastern Cliff Wall (Right)
        ((7.5, -3.8, 0.8), (4.5, 5.5, 1.8), (-0.05, 0.08, -0.05), mat_rock),
        ((7.5, -3.8, 1.7), (4.2, 5.2, 0.5), (-0.05, 0.08, -0.05), mat_snow),
        ((8.0, 1.2, 1.4), (4.8, 6.0, 2.8), (-0.05, 0.08, -0.05), mat_rock),
        ((8.0, 1.2, 2.8), (4.5, 5.6, 0.6), (-0.05, 0.08, -0.05), mat_snow),
        ((7.5, 5.2, 2.0), (4.5, 5.5, 3.8), (-0.05, 0.08, -0.05), mat_snow),
        ((7.5, 5.2, 3.9), (4.2, 5.2, 0.7), (-0.05, 0.08, -0.05), mat_snow),

        # Foreground Stepped Terraces (framing lower viewport)
        ((-5.8, -6.2, 0.4), (4.2, 3.8, 0.8), (0.02, 0.05, 0.0), mat_rock),
        ((-5.8, -6.2, 0.85), (3.9, 3.5, 0.3), (0.02, 0.05, 0.0), mat_snow),
        ((-3.8, -6.8, 0.25), (3.2, 2.6, 0.5), (0.0, 0.0, 0.0), mat_rock),
        ((-3.8, -6.8, 0.55), (2.9, 2.3, 0.2), (0.0, 0.0, 0.0), mat_snow),
        ((5.8, -6.2, 0.4), (4.2, 3.8, 0.8), (-0.02, -0.05, 0.0), mat_rock),
        ((5.8, -6.2, 0.85), (3.9, 3.5, 0.3), (-0.02, -0.05, 0.0), mat_snow),
        ((3.8, -6.8, 0.25), (3.2, 2.6, 0.5), (0.0, 0.0, 0.0), mat_rock),
        ((3.8, -6.8, 0.55), (2.9, 2.3, 0.2), (0.0, 0.0, 0.0), mat_snow),
    ]
    for loc, scale, rot, mat in ridges:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=loc, rotation=rot)
        obj = bpy.context.active_object
        obj.scale = scale
        bpy.ops.object.transform_apply(scale=True)
        make_faceted(obj)
        obj.data.materials.append(mat)

    # 3. Path spline definition: Waypoints from southern entrance up to Frostgate
    path_3d = [
        (-1.2, -5.6, 0.25),
        (-1.2, -5.2, 0.25),
        (-1.5, -4.0, 0.25),
        (-2.2, -2.6, 0.25),
        (-1.2, -1.0, 0.25),
        (1.2, 0.2, 0.25),
        (2.4, 1.6, 0.25),
        (1.8, 3.0, 0.25),
        (0.5, 4.2, 0.25),
        (0.0, 5.0, 0.25),
    ]

    build_road_ribbon(path_3d, road_width=2.5, material=mat_road)

    # Road curb boundary stones along edges of path (faceted markers)
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
            nx = -dy / l * 1.35
            ny = dx / l * 1.35
            build_models.create_box(f"CurbL_{i}_{t}", size=(0.22, 0.22, 0.16), location=(mx - nx, my - ny, mz + 0.1), material=mat_stone_dark)
            build_models.create_box(f"CurbR_{i}_{t}", size=(0.22, 0.22, 0.16), location=(mx + nx, my + ny, mz + 0.1), material=mat_stone_dark)

    # 4. Detailed Castle Gatehouse & Grand Keep (fills background leak point)
    gate_x, gate_y, gate_z = path_3d[-1]
    for tx in [gate_x - 1.9, gate_x + 1.9]:
        build_models.create_oct_prism("GateTower", radius=1.0, depth=3.2, location=(tx, gate_y + 0.5, gate_z + 1.6), material=mat_stone)
        build_models.create_oct_prism("TowerTop", radius=1.15, depth=0.4, location=(tx, gate_y + 0.5, gate_z + 3.3), material=mat_stone_dark)
        build_models.create_cylinder("FlagPole", radius=0.04, depth=1.6, vertices=4, location=(tx, gate_y + 0.5, gate_z + 4.1), material=mat_wood)
        build_models.create_box("Flag", size=(0.04, 0.6, 0.4), location=(tx, gate_y + 0.8, gate_z + 4.5), material=mat_saffron)

    build_models.create_box("GateArch", size=(3.0, 1.2, 1.0), location=(gate_x, gate_y + 0.5, gate_z + 2.7), material=mat_stone)
    build_models.create_box("Portcullis", size=(2.0, 0.2, 2.2), location=(gate_x, gate_y + 0.5, gate_z + 1.1), material=mat_wood)
    build_models.create_cone("GateCrest", radius=0.5, depth=0.9, vertices=6, location=(gate_x, gate_y + 0.3, gate_z + 3.4), material=mat_crevasse)

    # Massive Central Keep behind gatehouse
    build_models.create_oct_prism("CentralKeep", radius=2.6, depth=5.5, location=(gate_x, gate_y + 2.0, gate_z + 2.8), material=mat_stone_dark)
    build_models.create_cone("CentralKeepSpire", radius=2.0, depth=2.4, vertices=6, location=(gate_x, gate_y + 2.0, gate_z + 6.3), material=mat_saffron)
    build_models.create_cylinder("CentralBannerPole", radius=0.06, depth=2.0, vertices=4, location=(gate_x, gate_y + 2.0, gate_z + 7.8), material=mat_wood)
    build_models.create_box("CentralFlag", size=(0.05, 0.9, 0.6), location=(gate_x, gate_y + 2.4, gate_z + 8.2), material=mat_saffron)

    # Flanking Curtain Walls connecting to the mountain cliffs
    build_models.create_box("WallL", size=(4.5, 1.4, 3.2), location=(gate_x - 4.5, gate_y + 1.2, gate_z + 1.6), material=mat_stone)
    build_models.create_box("WallR", size=(4.5, 1.4, 3.2), location=(gate_x + 4.5, gate_y + 1.2, gate_z + 1.6), material=mat_stone)
    build_models.create_box("WallParapetL", size=(4.5, 0.3, 0.5), location=(gate_x - 4.5, gate_y + 0.5, gate_z + 3.4), material=mat_stone_dark)
    build_models.create_box("WallParapetR", size=(4.5, 0.3, 0.5), location=(gate_x + 4.5, gate_y + 0.5, gate_z + 3.4), material=mat_stone_dark)

    # Flanking Bastion Towers on curtain wall flanks
    build_models.create_oct_prism("BastionL", radius=1.2, depth=4.2, location=(gate_x - 5.5, gate_y + 1.0, gate_z + 2.1), material=mat_stone_dark)
    build_models.create_cone("BastionRoofL", radius=1.3, depth=1.4, vertices=6, location=(gate_x - 5.5, gate_y + 1.0, gate_z + 4.8), material=mat_crevasse)
    build_models.create_oct_prism("BastionR", radius=1.2, depth=4.2, location=(gate_x + 5.5, gate_y + 1.0, gate_z + 2.1), material=mat_stone_dark)
    build_models.create_cone("BastionRoofR", radius=1.3, depth=1.4, vertices=6, location=(gate_x + 5.5, gate_y + 1.0, gate_z + 4.8), material=mat_crevasse)

    # 5. Fir Trees - Clustered realistically across snow slopes (Bad North density: 60+ trees)
    tree_locs = [
        # West lower slopes & terraces
        (-4.2, -5.2, 0.35), (-4.8, -4.5, 0.45), (-5.4, -4.0, 0.7), (-3.8, -3.8, 0.3),
        (-5.0, -3.2, 0.55), (-4.2, -2.6, 0.35), (-5.6, -2.2, 0.75), (-3.6, -2.0, 0.3),
        # West mid slopes
        (-4.5, -1.2, 0.35), (-5.2, -0.6, 0.55), (-4.8, 0.2, 0.45), (-5.6, 0.8, 0.8),
        (-4.2, 1.2, 0.35), (-5.0, 1.8, 0.65), (-3.8, 2.2, 0.35),
        # West upper ridges
        (-4.6, 3.2, 0.65), (-5.4, 3.8, 0.85), (-4.0, 4.2, 0.55), (-5.0, 4.8, 0.75),
        (-4.2, 5.4, 0.6), (-5.5, 5.8, 0.85),
        # East lower slopes & terraces
        (4.2, -5.0, 0.35), (4.8, -4.4, 0.45), (5.5, -4.0, 0.7), (3.8, -3.6, 0.3),
        (5.0, -3.0, 0.55), (4.4, -2.4, 0.35), (5.6, -2.0, 0.75), (3.6, -1.8, 0.3),
        # East mid slopes
        (4.4, -1.0, 0.35), (5.2, -0.4, 0.55), (4.6, 0.4, 0.45), (5.5, 1.0, 0.8),
        (4.2, 1.6, 0.35), (5.2, 2.0, 0.65), (4.0, 2.5, 0.35),
        # East upper ridges
        (4.8, 3.4, 0.65), (5.4, 4.0, 0.85), (4.2, 4.4, 0.55), (5.2, 5.0, 0.75),
        (3.8, 5.4, 0.6), (5.5, 5.8, 0.85),
        # High mountain crags
        (-7.0, -3.0, 1.6), (-7.5, -1.0, 1.9), (-7.2, 1.5, 2.1), (-7.8, 3.5, 2.4),
        (7.0, -3.0, 1.6), (7.5, -1.0, 1.9), (7.2, 1.5, 2.1), (7.8, 3.5, 2.4),
        # Foreground stepped grove corners
        (-3.2, -6.2, 0.45), (-4.0, -6.6, 0.35), (-4.8, -6.0, 0.45),
        (3.2, -6.2, 0.45), (4.0, -6.6, 0.35), (4.8, -6.0, 0.45)
    ]
    for i, (tx, ty, tz) in enumerate(tree_locs):
        sc = 0.65 + ((i * 7) % 5) * 0.1
        create_fir_tree((tx, ty, tz), scale=sc)

    # 6. Faceted Boulders & Rock Outcrops along road bends
    boulders = [
        ((-3.2, -4.2, 0.3), 0.7, mat_rock),
        ((-3.4, -1.8, 0.3), 0.8, mat_rock),
        ((0.2, -1.5, 0.3), 0.6, mat_snow),
        ((3.0, 0.2, 0.3), 0.8, mat_rock),
        ((3.4, 2.2, 0.3), 0.7, mat_rock),
        ((-0.8, 3.6, 0.3), 0.7, mat_rock),
        ((-2.8, -5.8, 0.3), 0.65, mat_rock),
        ((2.8, -5.8, 0.3), 0.65, mat_rock),
        ((-5.0, -5.5, 0.45), 0.75, mat_rock),
        ((5.0, -5.5, 0.45), 0.75, mat_rock),
    ]
    for b_loc, b_sc, b_mat in boulders:
        create_boulder(b_loc, scale=b_sc, material=b_mat)

    # 7. Strategic Plots - positioned beside road (all within 50-95px of waypoints)
    plot_coords_3d = [
        (-1.8, -4.8, 0.25), (0.0, -4.6, 0.25),
        (-3.4, -2.5, 0.25), (-0.8, -2.2, 0.25),
        (0.2, 0.2, 0.25),   (3.4, 0.8, 0.25),
        (3.2, 2.4, 0.25),   (0.8, 2.8, 0.25),
        (-0.8, 4.2, 0.25),  (1.4, 4.2, 0.25)
    ]
    for i, p_loc in enumerate(plot_coords_3d):
        build_models.create_oct_prism(f"Plot_{i}", radius=0.85, depth=0.18, location=p_loc, material=mat_stone)

    cam = blender_utils.setup_isometric_camera(ortho_scale=22.0, elevation_deg=40.0, rotation_z_deg=45.0, distance=50.0, center=(0, -0.5, 0))
    bpy.context.view_layer.update()

    waypoints_2d = []
    for pt in path_3d:
        co = bpy_extras.object_utils.world_to_camera_view(scene, cam, Vector(pt))
        px = max(0, min(render_w, round(co.x * render_w)))
        py = max(0, min(render_h, round((1.0 - co.y) * render_h)))
        waypoints_2d.append({"x": px, "y": py})

    plots_2d = []
    for i, pt in enumerate(plot_coords_3d):
        co = bpy_extras.object_utils.world_to_camera_view(scene, cam, Vector(pt))
        px = max(0, min(render_w, round(co.x * render_w)))
        py = max(0, min(render_h, round((1.0 - co.y) * render_h)))
        plots_2d.append({"id": i, "x": px, "y": py})

    meta = {
        "id": "map1",
        "name": "霜門山道",
        "region": 1,
        "width": render_w,
        "height": render_h,
        "waypoints": waypoints_2d,
        "plots": plots_2d,
        "castle_pos": waypoints_2d[-1],
        "spawn_pos": waypoints_2d[0],
        "description": "冰川山道嘅咽喉險地，覆蓋厚雪，兩側崖石陡峭。"
    }
    return meta

def main():
    os.makedirs("assets/maps", exist_ok=True)
    meta = build_map1_scene(1024, 1536)
    raw_png = "assets/maps/map1.png"
    out_json = "assets/maps/map1.json"
    bpy.context.scene.render.filepath = raw_png
    bpy.ops.render.render(write_still=True)
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
    print("Map 1 rendered successfully!")

if __name__ == "__main__":
    main()
