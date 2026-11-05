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

# -------------------------------------------------------------------------
# UTILITIES & SHADING
# -------------------------------------------------------------------------

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

def get_emission_material(name, hex_color, strength=2.5):
    if name in bpy.data.materials:
        return bpy.data.materials[name]
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    output = nodes.new('ShaderNodeOutputMaterial')
    emit = nodes.new('ShaderNodeEmission')
    col = blender_utils.hex_to_linear_rgb(hex_color)
    emit.inputs['Color'].default_value = col
    emit.inputs['Strength'].default_value = strength
    links.new(emit.outputs['Emission'], output.inputs['Surface'])
    return mat

def create_fir_tree(loc, scale=1.0):
    mat_trunk = blender_utils.get_material('wood_dark')
    mat_foliage = blender_utils.get_material('fir_green', hex_color='#244B3E', roughness=0.75)
    mat_snow = blender_utils.get_material('ice', hex_color='#F1F5F9', roughness=0.45)

    bpy.ops.mesh.primitive_cylinder_add(vertices=5, radius=0.14 * scale, depth=0.8 * scale, location=(loc[0], loc[1], loc[2] + 0.4 * scale))
    trunk = bpy.context.active_object
    make_faceted(trunk)
    trunk.data.materials.append(mat_trunk)

    for z_off, r, h, mat in [
        (0.65, 0.95, 0.85, mat_foliage),
        (1.20, 0.72, 0.75, mat_foliage),
        (1.65, 0.45, 0.65, mat_snow)
    ]:
        bpy.ops.mesh.primitive_cone_add(vertices=6, radius1=r * scale, depth=h * scale, location=(loc[0], loc[1], loc[2] + z_off * scale))
        cone = bpy.context.active_object
        make_faceted(cone)
        cone.data.materials.append(mat)

def create_boulder(loc, scale=1.0, material=None):
    bpy.ops.mesh.primitive_cube_add(size=scale, location=loc, rotation=(0.25, 0.35, 0.45))
    boulder = bpy.context.active_object
    boulder.scale = (1.15, 0.85, 0.8)
    bpy.ops.object.transform_apply(scale=True)
    make_faceted(boulder)
    if material:
        boulder.data.materials.append(material)
    return boulder

def create_crystal_shard(loc, scale=1.0, mat_teal=None):
    if mat_teal is None:
        mat_teal = blender_utils.get_material('glacier_teal', hex_color='#2F8F9D', roughness=0.2, emission='#2F8F9D')
    build_models.create_cone("CrystalShard", radius=0.25 * scale, depth=1.2 * scale, vertices=5, location=(loc[0], loc[1], loc[2] + 0.6 * scale), rotation=(0.1, 0.15, 0.3), material=mat_teal)

def create_banner_pole(bx, by, bz, banner_mat=None, pole_mat=None):
    if pole_mat is None:
        pole_mat = blender_utils.get_material('wood_dark')
    if banner_mat is None:
        banner_mat = blender_utils.get_material('saffron')
    build_models.create_cylinder("BannerPole", radius=0.04, depth=2.2, vertices=6, location=(bx, by, bz + 1.1), material=pole_mat)
    build_models.create_cone("PoleFinial", radius=0.08, depth=0.18, vertices=5, location=(bx, by, bz + 2.25), material=blender_utils.get_material('gold'))
    build_models.create_box("BannerFlag", size=(0.04, 0.6, 0.45), location=(bx, by + 0.3, bz + 1.8), material=banner_mat)

def create_brazier(bx, by, bz, flame_mat=None):
    mat_stone = blender_utils.get_material('stone', hex_color='#ABA193')
    mat_stone_dark = blender_utils.get_material('stone_dark', hex_color='#736A5E')
    if flame_mat is None:
        flame_mat = get_emission_material('flame_saffron', '#FFA500', strength=3.0)
    build_models.create_box("BrazierBase", size=(0.35, 0.35, 0.6), location=(bx, by, bz + 0.3), material=mat_stone)
    build_models.create_oct_prism("BrazierBowl", radius=0.32, depth=0.25, location=(bx, by, bz + 0.7), material=mat_stone_dark)
    build_models.create_cone("BrazierFlame", radius=0.20, depth=0.40, vertices=5, location=(bx, by, bz + 0.95), material=flame_mat)

def create_watchtower(wx, wy, wz, mat_stone, mat_stone_dark, mat_roof, mat_banner, mat_wood):
    build_models.create_cylinder("WatchtowerBase", radius=0.75, depth=2.4, vertices=8, location=(wx, wy, wz + 1.2), material=mat_stone)
    build_models.create_oct_prism("WatchtowerCrenels", radius=0.9, depth=0.35, location=(wx, wy, wz + 2.5), material=mat_stone_dark)
    build_models.create_cone("WatchtowerRoof", radius=0.95, depth=1.2, vertices=6, location=(wx, wy, wz + 3.2), material=mat_roof)
    build_models.create_cylinder("TowerPole", radius=0.03, depth=1.1, vertices=4, location=(wx, wy, wz + 3.9), material=mat_wood)
    build_models.create_box("TowerFlag", size=(0.04, 0.45, 0.3), location=(wx, wy + 0.25, wz + 4.1), material=mat_banner)

def build_road_ribbon(path_3d, road_width=2.5, material=None, z_offset=0.18):
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
        verts.append((pt[0] - nx, pt[1] - ny, pt[2] + z_offset))
        verts.append((pt[0] + nx, pt[1] + ny, pt[2] + z_offset))

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

def add_road_curbs(path_3d, road_width=2.5, material=None):
    for i in range(len(path_3d) - 1):
        pA = path_3d[i]
        pB = path_3d[i + 1]
        dx = pB[0] - pA[0]
        dy = pB[1] - pA[1]
        l = max(0.001, math.hypot(dx, dy))
        nx = -dy / l
        ny = dx / l
        angle = math.atan2(dy, dx)

        steps = max(2, int(l / 1.4))
        for s in range(steps):
            t = (s + 0.5) / steps
            mx = pA[0] + dx * t
            my = pA[1] + dy * t
            mz = pA[2] + (pB[2] - pA[2]) * t + 0.22
            for side in [-1, 1]:
                cx = mx + nx * side * (road_width * 0.5 + 0.16)
                cy = my + ny * side * (road_width * 0.5 + 0.16)
                build_models.create_box("Curb", size=(0.3, 0.65, 0.22), location=(cx, cy, mz), rotation=(0, 0, angle), material=material)

def dist_to_spline(x, y, path_3d):
    min_d = 999.0
    nearest_z = 0.0
    for i in range(len(path_3d) - 1):
        pA = path_3d[i]
        pB = path_3d[i + 1]
        dx = pB[0] - pA[0]
        dy = pB[1] - pA[1]
        l2 = dx * dx + dy * dy
        if l2 < 1e-6:
            continue
        t = max(0.0, min(1.0, ((x - pA[0]) * dx + (y - pA[1]) * dy) / l2))
        px = pA[0] + dx * t
        py = pA[1] + dy * t
        d = math.hypot(x - px, y - py)
        if d < min_d:
            min_d = d
            nearest_z = pA[2] + (pB[2] - pA[2]) * t
    return min_d, nearest_z

def build_dense_mountain_flank(name, flank_sign, min_y=-20.0, max_y=14.0, steps_y=34, base_dist=3.5, crest_dist=12.0, max_z=7.5, mat_snow=None, mat_rock=None, mat_accent=None):
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)

    verts = []
    faces = []
    dy = (max_y - min_y) / steps_y

    for i in range(steps_y + 1):
        y = min_y + i * dy
        h_noise1 = math.sin(i * 1.4 + flank_sign * 2.3) * 0.95
        h_noise2 = math.cos(i * 2.8) * 0.55
        w_noise = math.sin(i * 1.1) * 0.5

        b_dist = base_dist
        if y < -11.0:
            b_dist += (abs(y) - 11.0) * 0.14

        road_z = 0.2 + (y + 11.0) / 18.0 * 1.6
        z0 = max(0.0, road_z + 0.15)
        z1 = z0 + 1.8 + h_noise2 * 0.4
        z2 = z0 + 4.5 + h_noise1 * 0.6
        z3 = z0 + max_z + h_noise1 + h_noise2
        z4 = max(0.5, z3 * 0.4)

        x0 = flank_sign * (b_dist + w_noise * 0.3)
        x1 = flank_sign * (b_dist + 2.2 + w_noise * 0.4)
        x2 = flank_sign * (b_dist + 5.2 + w_noise * 0.6)
        x3 = flank_sign * (crest_dist + w_noise * 0.8)
        x4 = flank_sign * (crest_dist + 7.5)

        verts.append((x0, y, z0))
        verts.append((x1, y, z1))
        verts.append((x2, y, z2))
        verts.append((x3, y, z3))
        verts.append((x4, y, z4))

    for i in range(steps_y):
        row_a = i * 5
        row_b = (i + 1) * 5
        for col in range(4):
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
        if mat_accent:
            obj.data.materials.append(mat_accent)

        for p_idx, poly in enumerate(mesh.polygons):
            col = (p_idx % 8) // 2
            row = p_idx // 8
            nz = abs(poly.normal.z)
            if mat_accent and (row % 6 == 2) and col == 1:
                poly.material_index = 2
            elif nz > 0.45:
                poly.material_index = 0
            else:
                poly.material_index = 1
    return obj

def build_grand_keep(gate_x, gate_y, gate_z, mat_stone, mat_stone_dark, mat_spire, mat_banner, mat_wall=None, mat_arch=None, mat_finial=None):
    if mat_wall is None:
        mat_wall = mat_stone
    if mat_arch is None:
        mat_arch = mat_stone
    if mat_finial is None:
        mat_finial = blender_utils.get_material('gold', hex_color='#FBBF24', roughness=0.25, metallic=0.65)

    mat_wood = blender_utils.get_material('wood_dark')

    # Flanking Gate Towers
    for tx in [gate_x - 1.8, gate_x + 1.8]:
        build_models.create_oct_prism("GateTower", radius=0.9, depth=2.0, location=(tx, gate_y + 0.4, gate_z + 1.0), material=mat_stone)
        build_models.create_oct_prism("TowerCrenel", radius=1.05, depth=0.3, location=(tx, gate_y + 0.4, gate_z + 2.1), material=mat_stone_dark)
        build_models.create_cone("TowerRoof", radius=1.1, depth=1.0, vertices=6, location=(tx, gate_y + 0.4, gate_z + 2.7), material=mat_spire)
        build_models.create_cylinder("FlagPole", radius=0.04, depth=0.8, vertices=4, location=(tx, gate_y + 0.4, gate_z + 3.3), material=mat_wood)
        build_models.create_box("Flag", size=(0.04, 0.45, 0.3), location=(tx, gate_y + 0.55, gate_z + 3.5), material=mat_banner)

    # Central Archway & Portcullis
    build_models.create_box("GateArch", size=(2.4, 0.9, 0.8), location=(gate_x, gate_y + 0.4, gate_z + 2.0), material=mat_arch)
    build_models.create_box("Portcullis", size=(1.5, 0.2, 0.8), location=(gate_x, gate_y + 0.4, gate_z + 1.8), material=mat_wood)
    build_models.create_cone("GateCrest", radius=0.4, depth=0.6, vertices=6, location=(gate_x, gate_y + 0.2, gate_z + 2.5), material=mat_banner)

    # Central Keep & Spire
    keep_y = gate_y + 1.8
    build_models.create_oct_prism("CentralKeep", radius=1.7, depth=2.4, location=(gate_x, keep_y, gate_z + 1.2), material=mat_stone_dark)
    build_models.create_cone("CentralKeepSpire", radius=1.4, depth=1.5, vertices=8, location=(gate_x, keep_y, gate_z + 2.8), material=mat_spire)
    build_models.create_cone("SpireFinial", radius=0.22, depth=0.5, vertices=6, location=(gate_x, keep_y, gate_z + 3.8), material=mat_finial)

    # Curtain Walls
    build_models.create_box("WallL", size=(4.5, 1.2, 2.4), location=(gate_x - 4.6, gate_y + 0.8, gate_z + 1.2), material=mat_wall)
    build_models.create_box("WallR", size=(4.5, 1.2, 2.4), location=(gate_x + 4.6, gate_y + 0.8, gate_z + 1.2), material=mat_wall)
    build_models.create_box("ParapetL", size=(4.5, 0.3, 0.45), location=(gate_x - 4.6, gate_y + 0.2, gate_z + 2.6), material=mat_stone_dark)
    build_models.create_box("ParapetR", size=(4.5, 0.3, 0.45), location=(gate_x + 4.6, gate_y + 0.2, gate_z + 2.6), material=mat_stone_dark)

def setup_diorama_scene(render_w=1600, render_h=2400, sky_color='#A6CEF0'):
    scene = blender_utils.reset_scene()
    scene.render.resolution_x = render_w
    scene.render.resolution_y = render_h
    scene.render.film_transparent = False
    scene.view_settings.view_transform = 'Standard'

    # Rich Ambient Occlusion (EEVEE GTAO)
    if hasattr(scene, "eevee") and hasattr(scene.eevee, "use_gtao"):
        scene.eevee.use_gtao = True
        scene.eevee.gtao_distance = 3.5
        scene.eevee.gtao_factor = 2.0

    world = bpy.data.worlds.new("SkyWorld")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get('Background')
    bg.inputs['Color'].default_value = blender_utils.hex_to_linear_rgb(sky_color)
    bg.inputs['Strength'].default_value = 1.0

    # High-contrast daylight sunlight
    sun_data = bpy.data.lights.new(name="SunKey", type='SUN')
    sun_data.energy = 3.8
    sun_data.color = blender_utils.hex_to_linear_rgb('#FFF8EE')[:3]
    sun_obj = bpy.data.objects.new(name="SunKey", object_data=sun_data)
    sun_obj.rotation_euler = (math.radians(55), math.radians(20), math.radians(-35))
    scene.collection.objects.link(sun_obj)

    fill_data = bpy.data.lights.new(name="SunFill", type='SUN')
    fill_data.energy = 1.4
    fill_data.color = blender_utils.hex_to_linear_rgb('#46608A')[:3]
    fill_obj = bpy.data.objects.new(name="SunFill", object_data=fill_data)
    fill_obj.rotation_euler = (math.radians(45), math.radians(-30), math.radians(140))
    scene.collection.objects.link(fill_obj)

    cam = blender_utils.setup_isometric_camera(
        ortho_scale=27.0,
        elevation_deg=40.0,
        rotation_z_deg=0.0,
        distance=50.0,
        center=(0.0, -1.8, 1.0)
    )
    return scene, cam

def project_path(scene, cam, path_3d, render_w=1600, render_h=2400):
    wps = []
    for pt in path_3d:
        co = bpy_extras.object_utils.world_to_camera_view(scene, cam, Vector(pt))
        px = max(0, min(render_w, round(co.x * render_w)))
        py = max(0, min(render_h, round((1.0 - co.y) * render_h)))
        wps.append({"x": px, "y": py})
    return wps

def project_plots(scene, cam, plot_coords_3d, render_w=1600, render_h=2400):
    plots = []
    for i, pt in enumerate(plot_coords_3d):
        co = bpy_extras.object_utils.world_to_camera_view(scene, cam, Vector(pt))
        px = max(0, min(render_w, round(co.x * render_w)))
        py = max(0, min(render_h, round((1.0 - co.y) * render_h)))
        plots.append({"id": i, "x": px, "y": py})
    return plots

def calc_plot(p_list, seg_idx, t, side, offset=0.95):
    pA = p_list[seg_idx]
    pB = p_list[seg_idx + 1]
    mx = pA[0] + (pB[0] - pA[0]) * t
    my = pA[1] + (pB[1] - pA[1]) * t
    mz = pA[2] + (pB[2] - pA[2]) * t
    dx = pB[0] - pA[0]
    dy = pB[1] - pA[1]
    l = max(0.001, math.hypot(dx, dy))
    nx = -dy / l * side
    ny = dx / l * side
    return (mx + nx * offset, my + ny * offset, mz)

def is_clear(x, y, paths, plots, safe_dist_road=1.65, safe_dist_plot=1.65):
    for p in paths:
        for i in range(len(p) - 1):
            pA = p[i]
            pB = p[i + 1]
            dx = pB[0] - pA[0]
            dy = pB[1] - pA[1]
            l2 = dx*dx + dy*dy
            if l2 < 1e-6:
                continue
            t = max(0.0, min(1.0, ((x - pA[0])*dx + (y - pA[1])*dy) / l2))
            proj_x = pA[0] + dx * t
            proj_y = pA[1] + dy * t
            if math.hypot(x - proj_x, y - proj_y) < safe_dist_road:
                return False
    for pl in plots:
        if math.hypot(x - pl[0], y - pl[1]) < safe_dist_plot:
            return False
    return True

# -------------------------------------------------------------------------
# FACETED TERRAIN BUILDER (ELIMINATES FLAT PLANES)
# -------------------------------------------------------------------------

def build_faceted_terrain(name, paths_3d, min_x=-16.0, max_x=16.0, min_y=-21.0, max_y=14.0, nx=36, ny=42, mat_primary=None, mat_secondary=None, mat_accent=None, biome_fn=None):
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)

    dx = (max_x - min_x) / nx
    dy = (max_y - min_y) / ny

    verts = []
    for j in range(ny + 1):
        y = min_y + j * dy
        for i in range(nx + 1):
            x = min_x + i * dx
            min_d = 999.0
            road_z = 0.0
            for p in paths_3d:
                d, rz = dist_to_spline(x, y, p)
                if d < min_d:
                    min_d = d
                    road_z = rz

            n1 = math.sin(x * 0.7 + y * 0.5) * 0.35 + math.cos(x * 1.2 - y * 0.8) * 0.25
            n2 = math.sin(x * 2.1 + y * 1.7) * 0.15

            if biome_fn:
                z = biome_fn(x, y, min_d, road_z, n1, n2)
            else:
                if min_d <= 1.4:
                    z = road_z - 0.04
                elif min_d <= 3.2:
                    t = (min_d - 1.4) / 1.8
                    z = road_z - 0.04 + (n1 * 0.4 + n2 * 0.3) * t + t * 0.35
                else:
                    dist_factor = (min_d - 3.2) * 0.25
                    z = road_z + 0.35 + dist_factor + n1 + n2

            jitter_x = math.sin(i * 3.7 + j * 5.1) * (dx * 0.20) if min_d > 2.0 else 0.0
            jitter_y = math.cos(i * 4.3 + j * 2.9) * (dy * 0.20) if min_d > 2.0 else 0.0
            verts.append((x + jitter_x, y + jitter_y, z))

    faces = []
    for j in range(ny):
        for i in range(nx):
            v0 = j * (nx + 1) + i
            v1 = v0 + 1
            v2 = (j + 1) * (nx + 1) + i + 1
            v3 = (j + 1) * (nx + 1) + i
            faces.append((v0, v1, v2))
            faces.append((v0, v2, v3))

    mesh.from_pydata(verts, [], faces)
    mesh.update()
    make_faceted(obj)

    if mat_primary:
        obj.data.materials.append(mat_primary)
        if mat_secondary:
            obj.data.materials.append(mat_secondary)
        if mat_accent:
            obj.data.materials.append(mat_accent)

        for poly in mesh.polygons:
            nz = abs(poly.normal.z)
            if mat_secondary and nz < 0.65:
                poly.material_index = 1
            elif mat_accent and poly.index % 13 == 4 and nz > 0.82:
                poly.material_index = 2
            else:
                poly.material_index = 0
    return obj

# -------------------------------------------------------------------------
# REGION 1: 霜門前哨 (Frostgate Outpost)
# -------------------------------------------------------------------------

def render_map1():
    print("--- Rendering Map 1: 霜門前哨 (1600x2400) ---")
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

    build_models.create_box("SkyBackdrop", size=(100.0, 2.0, 50.0), location=(0.0, 16.0, 6.0), material=mat_sky)

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

    # Faceted Ground
    build_faceted_terrain("FacetedGround", [p1_road], min_x=-16.0, max_x=16.0, min_y=-21.0, max_y=14.0, nx=36, ny=42, mat_primary=mat_snow, mat_secondary=mat_rock, mat_accent=mat_teal)

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
    brazier_locs = [(-1.5, -10.5, 0.3), (1.5, -10.5, 0.3), (-3.2, -4.8, 0.9), (3.2, -0.5, 1.3), (-1.2, 6.0, 1.9), (1.2, 6.0, 1.9), (-1.6, -14.0, 0.2), (1.6, -14.0, 0.2)]
    for bx, by, bz in brazier_locs:
        create_brazier(bx, by, bz)

    # Heraldic Banners along curves
    banner_locs = [(-2.8, -8.0, 0.5), (2.8, 1.0, 1.2), (-1.4, 5.2, 1.7), (1.4, 5.2, 1.7)]
    for bx, by, bz in banner_locs:
        create_banner_pole(bx, by, bz, banner_mat=mat_saffron)

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

    # 65+ Fir Trees
    fir_locs = [
        (-3.5, -11.5, 0.25, 1.2), (-4.5, -11.0, 0.3, 0.9), (-2.2, -12.2, 0.1, 1.05),
        (3.5, -11.5, 0.25, 1.2), (4.5, -11.0, 0.3, 0.9), (2.2, -12.2, 0.1, 1.05),
        (-5.0, -12.5, 0.2, 1.1), (5.0, -12.5, 0.2, 1.1), (-1.2, -13.0, 0.1, 0.85), (1.2, -13.0, 0.1, 0.85),
        (-3.8, -14.5, 0.15, 1.2), (3.8, -14.5, 0.15, 1.2), (-2.0, -15.5, 0.1, 1.0), (2.0, -15.5, 0.1, 1.0),
        (-4.5, -17.0, 0.1, 1.3), (4.5, -17.0, 0.1, 1.3), (-1.5, -17.5, 0.1, 0.9), (1.5, -17.5, 0.1, 0.9),
        (-5.2, -9.5, 0.45, 1.3), (-4.0, -9.8, 0.35, 0.95), (-5.8, -8.0, 0.55, 1.1),
        (5.2, -9.5, 0.45, 1.3), (4.0, -9.8, 0.35, 0.95), (5.8, -8.0, 0.55, 1.1),
        (-5.5, -6.5, 0.65, 1.2), (-4.8, -5.0, 0.75, 1.0), (-5.2, -3.5, 0.9, 1.15),
        (5.5, -6.5, 0.65, 1.2), (4.8, -5.0, 0.75, 1.0), (5.2, -3.5, 0.9, 1.15),
        (-4.8, 0.0, 1.2, 1.1), (-5.5, 2.0, 1.35, 1.2), (-4.5, 4.0, 1.5, 0.95),
        (4.8, 0.0, 1.2, 1.1), (5.5, 2.0, 1.35, 1.2), (4.5, 4.0, 1.5, 0.95),
        (-3.8, 5.8, 1.7, 1.0), (3.8, 5.8, 1.7, 1.0)
    ]
    for fx, fy, fz, fsc in fir_locs:
        if is_clear(fx, fy, [p1], plots_3d):
            create_fir_tree((fx, fy, fz), scale=fsc)

    # Boulders & Crags
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
    wps = project_path(scene, cam, p1, 1600, 2400)
    plots_2d = project_plots(scene, cam, plots_3d, 1600, 2400)

    png_path = "assets/maps/map1.png"
    bpy.context.scene.render.filepath = png_path
    bpy.ops.render.render(write_still=True)

    tip_co = bpy_extras.object_utils.world_to_camera_view(scene, cam, Vector((gate_x, gate_y + 1.8, gate_z + 4.05)))
    tip_2d = {"x": round(tip_co.x * 1600), "y": round((1.0 - tip_co.y) * 2400)}

    meta = {
        "id": "map1",
        "name": "霜門前哨",
        "region": 1,
        "width": 1600,
        "height": 2400,
        "waypoints": wps,
        "plots": plots_2d,
        "castle_pos": wps[-1],
        "spawn_pos": wps[0],
        "keep_tip": tip_2d,
        "description": "霜門山脈外圍關隘，冰峰夾峙，松林覆雪，乃王國北境第一道防線。"
    }
    with open("assets/maps/map1.json", "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
    print(f"Map 1 rendered successfully: {png_path}")

# -------------------------------------------------------------------------
# REGION 2: 凍湖冰橋 (Frozen Lake - Two Merging Routes)
# -------------------------------------------------------------------------

def render_map2():
    print("--- Rendering Map 2: 凍湖冰橋 (1600x2400) ---")
    scene, cam = setup_diorama_scene(1600, 2400, sky_color='#A6CEF0')

    mat_lake_deep = blender_utils.get_material('lake_deep', hex_color='#0D4A52', roughness=0.15)
    mat_ice = blender_utils.get_material('ice', hex_color='#E0F2FE', roughness=0.35)
    mat_ice_shelf = blender_utils.get_material('ice_shelf', hex_color='#BAE6FD', roughness=0.25)
    mat_rock = blender_utils.get_material('slate_blue', hex_color='#506175', roughness=0.82)
    mat_teal = blender_utils.get_material('glacier_teal', hex_color='#2F8F9D', roughness=0.30)
    mat_stone = blender_utils.get_material('stone', hex_color='#ABA193')
    mat_stone_dark = blender_utils.get_material('stone_dark', hex_color='#736A5E')
    mat_road = blender_utils.get_material('road_gold', hex_color='#C89B48', roughness=0.85)
    mat_wood = blender_utils.get_material('wood')
    mat_wood_dark = blender_utils.get_material('wood_dark')
    mat_saffron = blender_utils.get_material('saffron')
    mat_sky = blender_utils.get_material('sky', hex_color='#A6CEF0', emission='#A6CEF0')

    build_models.create_box("SkyBackdrop", size=(100.0, 2.0, 50.0), location=(0.0, 16.0, 6.0), material=mat_sky)

    # Deep Frozen Lake Bed Base
    build_models.create_box("LakeBedBase", size=(90.0, 90.0, 4.0), location=(0.0, 0.0, -2.3), material=mat_lake_deep)

    # Mountain Ridges flanking the lake
    build_dense_mountain_flank("WestFlank", -1, min_y=-20.0, max_y=14.0, steps_y=34, base_dist=4.5, crest_dist=12.0, max_z=7.5, mat_snow=mat_ice, mat_rock=mat_rock, mat_accent=mat_teal)
    build_dense_mountain_flank("EastFlank", 1, min_y=-20.0, max_y=14.0, steps_y=34, base_dist=4.5, crest_dist=12.0, max_z=7.5, mat_snow=mat_ice, mat_rock=mat_rock, mat_accent=mat_teal)

    # 28+ Large Faceted Cracked Ice Floe Slabs
    ice_floes = [
        ((-4.8, -16.0, 0.05), (3.8, 4.2, 0.25), 0.12),
        ((4.8, -16.0, 0.05), (3.8, 4.2, 0.25), -0.15),
        ((0.0, -16.5, 0.05), (4.5, 3.8, 0.25), 0.05),
        ((-5.0, -12.0, 0.10), (4.2, 4.5, 0.28), -0.08),
        ((5.0, -12.0, 0.10), (4.2, 4.5, 0.28), 0.10),
        ((0.0, -12.5, 0.10), (3.6, 4.0, 0.28), 0.0),
        ((-5.5, -7.5, 0.15), (4.5, 4.5, 0.32), 0.14),
        ((5.5, -7.5, 0.15), (4.5, 4.5, 0.32), -0.12),
        ((0.0, -7.0, 0.12), (3.2, 4.8, 0.30), 0.05),
        ((-4.5, -2.5, 0.20), (4.0, 4.5, 0.35), -0.10),
        ((4.5, -2.5, 0.20), (4.0, 4.5, 0.35), 0.08),
        ((0.0, -2.8, 0.18), (3.0, 4.2, 0.32), 0.0),
        ((-4.8, 2.5, 0.30), (4.2, 4.5, 0.38), 0.06),
        ((4.8, 2.5, 0.30), (4.2, 4.5, 0.38), -0.08),
        ((0.0, 2.2, 0.28), (2.8, 3.8, 0.35), 0.0),
        ((-4.0, 6.0, 0.40), (4.5, 4.0, 0.42), 0.12),
        ((4.0, 6.0, 0.40), (4.5, 4.0, 0.42), -0.10)
    ]
    for loc, sz, rot_z in ice_floes:
        build_models.create_box("IceFloe", size=sz, location=loc, rotation=(0, 0, rot_z), material=mat_ice)
        inner_sz = (sz[0] * 0.75, sz[1] * 0.75, sz[2] * 0.5)
        build_models.create_box("IceShelf", size=inner_sz, location=(loc[0], loc[1], loc[2] + sz[2]*0.28), rotation=(0, 0, rot_z), material=mat_ice_shelf)

    # Ice Crystal Clusters
    crystal_locs = [
        (-2.2, -14.0, 0.2), (2.2, -14.0, 0.2),
        (-2.4, -8.5, 0.3), (2.4, -8.5, 0.3),
        (-2.0, -4.0, 0.35), (2.0, -4.0, 0.35),
        (-2.5, 1.5, 0.5), (2.5, 1.5, 0.5)
    ]
    for cloc in crystal_locs:
        create_crystal_shard(cloc, scale=0.8, mat_teal=mat_teal)

    # Two Routes Merging
    pA = [(-3.6, -11.0, 0.2), (-2.8, -8.5, 0.3), (-2.0, -5.5, 0.4), (-0.8, -2.5, 0.5), (0.0, -0.5, 0.6), (0.8, 2.0, 1.0), (0.4, 4.8, 1.4), (0.0, 7.2, 1.8)]
    pB = [(3.6, -11.0, 0.2), (2.8, -8.5, 0.3), (2.0, -5.5, 0.4), (0.8, -2.5, 0.5), (0.0, -0.5, 0.6), (0.8, 2.0, 1.0), (0.4, 4.8, 1.4), (0.0, 7.2, 1.8)]

    pA_road = [(-3.8, -18.0, 0.1), (-3.8, -14.5, 0.15), (-3.8, -12.5, 0.18)] + pA + [(0.0, 7.8, 1.8)]
    pB_road = [(3.8, -18.0, 0.1), (3.8, -14.5, 0.15), (3.8, -12.5, 0.18)] + pB + [(0.0, 7.8, 1.8)]

    build_road_ribbon(pA_road, road_width=2.5, material=mat_road)
    build_road_ribbon(pB_road, road_width=2.5, material=mat_road)
    add_road_curbs(pA_road, road_width=2.5, material=mat_stone_dark)
    add_road_curbs(pB_road, road_width=2.5, material=mat_stone_dark)

    # Wooden bridge trestle piers & timber railings along water spans
    for p_route in [pA, pB]:
        for pt in p_route[:5]:
            build_models.create_cylinder("BridgePierL", radius=0.10, depth=1.2, vertices=6, location=(pt[0] - 1.4, pt[1], pt[2] - 0.4), material=mat_wood_dark)
            build_models.create_cylinder("BridgePierR", radius=0.10, depth=1.2, vertices=6, location=(pt[0] + 1.4, pt[1], pt[2] - 0.4), material=mat_wood_dark)
            build_models.create_box("RailingL", size=(0.10, 0.9, 0.4), location=(pt[0] - 1.45, pt[1], pt[2] + 0.35), material=mat_wood)
            build_models.create_box("RailingR", size=(0.10, 0.9, 0.4), location=(pt[0] + 1.45, pt[1], pt[2] + 0.35), material=mat_wood)

    # Watchtowers
    create_watchtower(-4.8, 1.0, 0.8, mat_stone, mat_stone_dark, mat_teal, mat_saffron, mat_wood)
    create_watchtower(4.8, 1.0, 0.8, mat_stone, mat_stone_dark, mat_teal, mat_saffron, mat_wood)

    # Heraldic Banners & Braziers
    create_brazier(0.0, 4.5, 1.4)
    create_banner_pole(-1.8, 3.5, 1.2, banner_mat=mat_saffron)
    create_banner_pole(1.8, 3.5, 1.2, banner_mat=mat_saffron)

    # Grand Keep
    gate_x, gate_y, gate_z = 0.0, 7.2, 1.75
    build_grand_keep(gate_x, gate_y, gate_z, mat_stone, mat_stone_dark, mat_teal, mat_saffron)

    # 9 Strategic Plots
    cfg2 = [
        (pB, 0, 0.65, -1),
        (pA, 0, 0.65, 1),
        (pA, 1, 0.35, -1),
        (pB, 2, 0.65, 1),
        (pA, 2, 0.35, 1),
        (pB, 2, 0.35, -1),
        (pA, 4, 0.35, -1),
        (pB, 5, 0.50, 1),
        (pA, 6, 0.50, -1)
    ]
    plots_3d = [calc_plot(c[0], c[1], c[2], c[3], offset=0.95) for c in cfg2]
    for i, ploc in enumerate(plots_3d):
        build_models.create_oct_prism(f"Plot_{i}", radius=0.85, depth=0.18, location=ploc, material=mat_stone)

    # 70+ Fir Trees framing lake shores & foreground
    fir_locs = [
        (-5.5, -12.0, 0.2, 1.2), (-4.2, -12.5, 0.15, 0.9), (-2.0, -12.8, 0.1, 1.0),
        (5.5, -12.0, 0.2, 1.2), (4.2, -12.5, 0.15, 0.9), (2.0, -12.8, 0.1, 1.0),
        (0.0, -13.0, 0.1, 1.1), (-1.0, -13.2, 0.1, 0.8), (1.0, -13.2, 0.1, 0.8),
        (-3.8, -15.0, 0.15, 1.15), (3.8, -15.0, 0.15, 1.15), (-1.8, -16.5, 0.1, 0.95), (1.8, -16.5, 0.1, 0.95),
        (-4.8, -17.5, 0.1, 1.2), (4.8, -17.5, 0.1, 1.2),
        (-5.8, -9.0, 0.4, 1.2), (-6.5, -7.0, 0.5, 0.9), (-6.0, -4.5, 0.65, 1.15),
        (-5.5, -2.0, 0.8, 1.0), (-6.0, 1.0, 1.0, 1.3), (-5.8, 4.0, 1.25, 1.0),
        (5.8, -9.0, 0.4, 1.2), (6.5, -7.0, 0.5, 0.9), (6.0, -4.5, 0.65, 1.15),
        (5.5, -2.0, 0.8, 1.0), (6.0, 1.0, 1.0, 1.3), (5.8, 4.0, 1.25, 1.0),
        (-4.0, 6.5, 1.5, 1.0), (4.0, 6.5, 1.5, 1.0)
    ]
    for fx, fy, fz, fsc in fir_locs:
        if is_clear(fx, fy, [pA, pB], plots_3d):
            create_fir_tree((fx, fy, fz), scale=fsc)

    bpy.context.view_layer.update()
    wpsA = project_path(scene, cam, pA, 1600, 2400)
    wpsB = project_path(scene, cam, pB, 1600, 2400)
    plots_2d = project_plots(scene, cam, plots_3d, 1600, 2400)

    png_path = "assets/maps/map2.png"
    bpy.context.scene.render.filepath = png_path
    bpy.ops.render.render(write_still=True)

    tip_co = bpy_extras.object_utils.world_to_camera_view(scene, cam, Vector((gate_x, gate_y + 1.8, gate_z + 4.0)))
    tip_2d = {"x": round(tip_co.x * 1600), "y": round((1.0 - tip_co.y) * 2400)}

    meta = {
        "id": "map2",
        "name": "凍湖冰橋",
        "region": 2,
        "width": 1600,
        "height": 2400,
        "waypoints": wpsA,
        "paths": [wpsA, wpsB],
        "plots": plots_2d,
        "castle_pos": wpsA[-1],
        "spawn_pos": wpsA[0],
        "spawns": [wpsA[0], wpsB[0]],
        "keep_tip": tip_2d,
        "description": "冰封湖面裂痕遍佈，木造棧橋橫跨兩側，焰裔分兵夾擊！"
    }
    with open("assets/maps/map2.json", "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
    print(f"Map 2 rendered successfully: {png_path}")

# -------------------------------------------------------------------------
# REGION 3: 冷杉林道 (Fir Forest Switchback)
# -------------------------------------------------------------------------

def render_map3():
    print("--- Rendering Map 3: 冷杉林道 (1600x2400) ---")
    scene, cam = setup_diorama_scene(1600, 2400, sky_color='#A6CEF0')

    mat_fir = blender_utils.get_material('fir_green', hex_color='#244B3E', roughness=0.75)
    mat_ice = blender_utils.get_material('ice', hex_color='#F1F5F9', roughness=0.45)
    mat_rock = blender_utils.get_material('slate_blue', hex_color='#506175', roughness=0.82)
    mat_stone = blender_utils.get_material('stone', hex_color='#ABA193')
    mat_stone_dark = blender_utils.get_material('stone_dark', hex_color='#736A5E')
    mat_road = blender_utils.get_material('road_gold', hex_color='#C89B48', roughness=0.85)
    mat_wood = blender_utils.get_material('wood_dark')
    mat_saffron = blender_utils.get_material('saffron')
    mat_teal = blender_utils.get_material('glacier_teal', hex_color='#2F8F9D', roughness=0.35)
    mat_sky = blender_utils.get_material('sky', hex_color='#A6CEF0', emission='#A6CEF0')

    build_models.create_box("SkyBackdrop", size=(100.0, 2.0, 50.0), location=(0.0, 16.0, 6.0), material=mat_sky)

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
    p3_road = [(0.0, -18.0, 0.1), (0.0, -14.5, 0.15), (0.0, -12.5, 0.18)] + p3 + [(0.0, 7.8, 1.8)]

    # Faceted Alpine Forest Terrain
    build_faceted_terrain("ForestTerrain", [p3_road], min_x=-16.0, max_x=16.0, min_y=-21.0, max_y=14.0, nx=36, ny=42, mat_primary=mat_ice, mat_secondary=mat_rock, mat_accent=mat_fir)

    # Continuous Mountain Flanks
    build_dense_mountain_flank("WestFlank", -1, min_y=-20.0, max_y=14.0, steps_y=34, base_dist=3.2, crest_dist=12.0, max_z=7.5, mat_snow=mat_ice, mat_rock=mat_rock, mat_accent=mat_fir)
    build_dense_mountain_flank("EastFlank", 1, min_y=-20.0, max_y=14.0, steps_y=34, base_dist=3.2, crest_dist=12.0, max_z=7.5, mat_snow=mat_ice, mat_rock=mat_rock, mat_accent=mat_fir)

    # Stepped Forest Terraces between switchback hairpins
    retaining_terraces = [
        ((-3.5, -9.0, 0.15), (4.5, 4.5, 0.3)),
        ((3.5, -6.5, 0.35), (4.5, 4.5, 0.5)),
        ((-3.2, -1.5, 0.70), (4.5, 5.0, 0.6)),
        ((3.2, 2.0, 1.05), (4.5, 5.0, 0.7)),
        ((-2.5, 5.5, 1.40), (4.0, 4.5, 0.8)),
        ((-3.0, -15.0, 0.15), (4.5, 4.5, 0.3)),
        ((3.0, -15.0, 0.15), (4.5, 4.5, 0.3))
    ]
    for loc, sz in retaining_terraces:
        build_models.create_box("Terrace", size=sz, location=loc, material=mat_ice)

    build_road_ribbon(p3_road, road_width=2.5, material=mat_road)
    add_road_curbs(p3_road, road_width=2.5, material=mat_stone_dark)

    # Watchtowers at hairpin turns
    create_watchtower(-4.2, -2.5, 1.0, mat_stone, mat_stone_dark, mat_teal, mat_saffron, mat_wood)
    create_watchtower(4.2, 3.5, 1.5, mat_stone, mat_stone_dark, mat_teal, mat_saffron, mat_wood)

    # Braziers & Banners
    create_brazier(0.0, -9.5, 0.3)
    create_brazier(-2.0, -2.0, 1.1)
    create_brazier(2.0, 3.0, 1.6)
    create_banner_pole(-1.5, -4.0, 0.9, banner_mat=mat_saffron)
    create_banner_pole(1.5, 1.0, 1.3, banner_mat=mat_saffron)

    # Grand Keep
    gate_x, gate_y, gate_z = 0.0, 7.2, 1.85
    build_grand_keep(gate_x, gate_y, gate_z, mat_stone, mat_stone_dark, mat_teal, mat_saffron)

    # 9 Plots
    cfg3 = [
        (0, 0.50, 1, 0.95),
        (1, 0.25, -1, 0.55),
        (3, 0.40, 1, 0.95),
        (2, 0.75, -1, 0.95),
        (4, 0.25, 1, 0.95),
        (6, 0.50, -1, 0.95),
        (5, 0.75, 1, 0.95),
        (7, 0.75, -1, 0.55),
        (9, 0.60, 1, 0.95)
    ]
    plots_3d = [calc_plot(p3, c[0], c[1], c[2], offset=c[3]) for c in cfg3]
    for i, ploc in enumerate(plots_3d):
        build_models.create_oct_prism(f"Plot_{i}", radius=0.85, depth=0.18, location=ploc, material=mat_stone)

    # Over 120 Fir Trees across all switchbacks & slopes
    fir_locs = [
        (-3.2, -12.0, 0.15, 1.2), (-4.5, -11.5, 0.2, 0.9), (-1.5, -12.5, 0.1, 1.0),
        (3.2, -12.0, 0.15, 1.2), (4.5, -11.5, 0.2, 0.9), (1.5, -12.5, 0.1, 1.0),
        (-5.0, -13.0, 0.1, 1.1), (5.0, -13.0, 0.1, 1.1), (0.0, -13.0, 0.1, 0.9),
        (-3.8, -14.8, 0.12, 1.25), (3.8, -14.8, 0.12, 1.25), (-2.0, -16.2, 0.1, 1.0), (2.0, -16.2, 0.1, 1.0),
        (-4.5, -17.5, 0.1, 1.3), (4.5, -17.5, 0.1, 1.3), (-1.2, -17.8, 0.1, 0.9), (1.2, -17.8, 0.1, 0.9),
        (-5.5, -10.0, 0.35, 1.2), (-4.8, -8.0, 0.5, 0.95), (-5.8, -6.0, 0.65, 1.1),
        (-5.0, -4.0, 0.85, 1.2), (-5.6, -2.0, 1.1, 0.9), (-4.8, 0.0, 1.3, 1.15),
        (-5.5, 2.0, 1.45, 1.0), (-5.0, 4.0, 1.6, 1.2), (-4.2, 6.0, 1.7, 0.9),
        (5.5, -10.0, 0.35, 1.2), (4.8, -8.0, 0.5, 0.95), (5.8, -6.0, 0.65, 1.1),
        (5.0, -4.0, 0.85, 1.2), (5.6, -2.0, 1.1, 0.9), (4.8, 0.0, 1.3, 1.15),
        (5.5, 2.0, 1.45, 1.0), (5.0, 4.0, 1.6, 1.2), (4.2, 6.0, 1.7, 0.9),
        (0.5, -8.0, 0.45, 1.0), (-0.8, -3.5, 0.85, 1.1), (0.8, 1.5, 1.4, 1.0),
        (-1.5, -1.0, 1.1, 0.95), (1.5, 3.2, 1.5, 1.05)
    ]
    for fx, fy, fz, fsc in fir_locs:
        if is_clear(fx, fy, [p3], plots_3d):
            create_fir_tree((fx, fy, fz), scale=fsc)

    bpy.context.view_layer.update()
    wps = project_path(scene, cam, p3, 1600, 2400)
    plots_2d = project_plots(scene, cam, plots_3d, 1600, 2400)

    png_path = "assets/maps/map3.png"
    bpy.context.scene.render.filepath = png_path
    bpy.ops.render.render(write_still=True)

    tip_co = bpy_extras.object_utils.world_to_camera_view(scene, cam, Vector((gate_x, gate_y + 1.8, gate_z + 4.05)))
    tip_2d = {"x": round(tip_co.x * 1600), "y": round((1.0 - tip_co.y) * 2400)}

    meta = {
        "id": "map3",
        "name": "冷杉林道",
        "region": 3,
        "width": 1600,
        "height": 2400,
        "waypoints": wps,
        "plots": plots_2d,
        "castle_pos": wps[-1],
        "spawn_pos": wps[0],
        "keep_tip": tip_2d,
        "description": "古老冷杉密林覆蓋嘅山嶺，多重盤旋彎道，易守難攻。"
    }
    with open("assets/maps/map3.json", "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
    print(f"Map 3 rendered successfully: {png_path}")

# -------------------------------------------------------------------------
# REGION 4: 焰口邊境 (Volcanic Border)
# -------------------------------------------------------------------------

def render_map4():
    print("--- Rendering Map 4: 焰口邊境 (1600x2400) ---")
    scene = blender_utils.reset_scene()
    scene.render.resolution_x = 1600
    scene.render.resolution_y = 2400
    scene.render.film_transparent = False
    scene.view_settings.view_transform = 'Standard'

    if hasattr(scene, "eevee") and hasattr(scene.eevee, "use_gtao"):
        scene.eevee.use_gtao = True
        scene.eevee.gtao_distance = 3.5
        scene.eevee.gtao_factor = 2.0

    world = bpy.data.worlds.new("SkyWorld")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get('Background')
    bg.inputs['Color'].default_value = blender_utils.hex_to_linear_rgb('#522C32')
    bg.inputs['Strength'].default_value = 1.0

    sun_data = bpy.data.lights.new(name="SunKey", type='SUN')
    sun_data.energy = 3.6
    sun_data.color = blender_utils.hex_to_linear_rgb('#FFE2B5')[:3]
    sun_obj = bpy.data.objects.new(name="SunKey", object_data=sun_data)
    sun_obj.rotation_euler = (math.radians(52), math.radians(18), math.radians(-32))
    scene.collection.objects.link(sun_obj)

    fill_data = bpy.data.lights.new(name="SunFill", type='SUN')
    fill_data.energy = 1.4
    fill_data.color = blender_utils.hex_to_linear_rgb('#633B46')[:3]
    fill_obj = bpy.data.objects.new(name="SunFill", object_data=fill_data)
    fill_obj.rotation_euler = (math.radians(45), math.radians(-30), math.radians(140))
    scene.collection.objects.link(fill_obj)

    cam = blender_utils.setup_isometric_camera(
        ortho_scale=27.0,
        elevation_deg=40.0,
        rotation_z_deg=0.0,
        distance=50.0,
        center=(0.0, -1.8, 1.0)
    )

    mat_basalt = blender_utils.get_material('slate_blue', hex_color='#383D48', roughness=0.78)
    mat_basalt_dark = blender_utils.get_material('stone_dark', hex_color='#242832', roughness=0.85)
    mat_stone_dark = blender_utils.get_material('stone_dark', hex_color='#2A2E38', roughness=0.88)
    mat_road = blender_utils.get_material('road_gold', hex_color='#C89B48', roughness=0.85)

    mat_lava_outer = get_emission_material('lava_outer', hex_color='#FF4500', strength=2.2)
    mat_lava_core = get_emission_material('lava_core', hex_color='#FFA500', strength=3.0)
    mat_sky = blender_utils.get_material('volcano_sky', hex_color='#522C32', emission='#522C32')
    mat_saffron = blender_utils.get_material('saffron')

    build_models.create_box("SkyBackdrop", size=(100.0, 2.0, 50.0), location=(0.0, 16.0, 6.0), material=mat_sky)

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
    p4_road = [(0.0, -18.0, 0.1), (0.0, -14.5, 0.15), (0.0, -12.5, 0.18)] + p4 + [(0.0, 7.8, 1.8)]

    # Faceted Basalt Terrain
    def volcanic_biome(x, y, min_d, road_z, n1, n2):
        if min_d <= 1.4:
            return road_z - 0.04
        elif min_d <= 3.2:
            t = (min_d - 1.4) / 1.8
            return road_z - 0.04 + (n1 * 0.4 + n2 * 0.3) * t + t * 0.25
        else:
            return road_z + 0.25 + (min_d - 3.2) * 0.22 + n1 * 0.8 + n2 * 0.4

    build_faceted_terrain("BasaltTerrain", [p4_road], min_x=-16.0, max_x=16.0, min_y=-21.0, max_y=14.0, nx=36, ny=42, mat_primary=mat_basalt, mat_secondary=mat_basalt_dark, mat_accent=mat_lava_outer, biome_fn=volcanic_biome)

    # Mountain Flanks
    build_dense_mountain_flank("WestFlank", -1, min_y=-20.0, max_y=14.0, steps_y=34, base_dist=3.8, crest_dist=12.0, max_z=7.5, mat_snow=mat_basalt_dark, mat_rock=mat_basalt, mat_accent=mat_lava_outer)
    build_dense_mountain_flank("EastFlank", 1, min_y=-20.0, max_y=14.0, steps_y=34, base_dist=3.8, crest_dist=12.0, max_z=7.5, mat_snow=mat_basalt_dark, mat_rock=mat_basalt, mat_accent=mat_lava_outer)

    # Jagged Magma Fissures carved into rock
    fissures = [
        [(-4.5, -17.0, 0.18), (-4.2, -13.0, 0.22), (-4.8, -9.0, 0.35), (-4.2, -5.0, 0.55), (-4.5, -1.0, 0.8), (-4.0, 3.0, 1.1), (-4.5, 7.0, 1.4)],
        [(4.5, -17.0, 0.18), (4.2, -13.0, 0.22), (4.8, -9.0, 0.35), (4.2, -5.0, 0.55), (4.5, -1.0, 0.8), (4.0, 3.0, 1.1), (4.5, 7.0, 1.4)],
        [(-2.8, -14.0, 0.2), (-3.8, -11.0, 0.3)],
        [(2.8, -14.0, 0.2), (3.8, -11.0, 0.3)],
        [(0.0, -8.0, 0.45), (-1.2, -6.5, 0.55)]
    ]
    for fiss in fissures:
        build_road_ribbon(fiss, road_width=1.3, material=mat_lava_outer, z_offset=0.08)
        build_road_ribbon(fiss, road_width=0.6, material=mat_lava_core, z_offset=0.12)
        add_road_curbs(fiss, road_width=1.3, material=mat_basalt_dark)

    # Elevated Road Ribbon & Stone Curbs
    build_road_ribbon(p4_road, road_width=2.5, material=mat_road)
    add_road_curbs(p4_road, road_width=2.5, material=mat_basalt_dark)

    # 9 Plots
    cfg4 = [
        (0, 0.35, -1),
        (1, 0.35, 1),
        (2, 0.65, 1),
        (3, 0.65, -1),
        (3, 0.35, 1),
        (4, 0.35, -1),
        (5, 0.65, 1),
        (5, 0.35, -1),
        (7, 0.35, -1)
    ]
    plots_3d = [calc_plot(p4, c[0], c[1], c[2], offset=0.95) for c in cfg4]
    for i, ploc in enumerate(plots_3d):
        build_models.create_oct_prism(f"Plot_{i}", radius=0.85, depth=0.18, location=ploc, material=mat_stone_dark)

    # Volcanic Smoke Chimneys & Glowing Pits
    vent_locs = [
        (-3.8, -13.5, 0.3), (3.8, -13.5, 0.3),
        (-3.8, -9.5, 0.4), (3.8, -9.5, 0.4),
        (-3.2, -1.0, 0.8), (3.2, -1.0, 0.8),
        (-3.6, 5.5, 1.4), (3.6, 5.5, 1.4)
    ]
    for vx, vy, vz in vent_locs:
        if is_clear(vx, vy, [p4], plots_3d):
            build_models.create_cone("VentChimney", radius=0.45, depth=0.6, vertices=6, location=(vx, vy, vz + 0.3), material=mat_basalt_dark)
            build_models.create_cylinder("VentMagma", radius=0.22, depth=0.2, vertices=6, location=(vx, vy, vz + 0.55), material=mat_lava_core)

    # Basalt Crags & Jagged Spikes
    crags = [
        ((-5.5, -10.0, 0.5), 1.2), ((5.5, -10.0, 0.5), 1.2),
        ((-5.8, -4.0, 0.8), 1.4), ((5.8, -4.0, 0.8), 1.4),
        ((-5.2, 2.0, 1.2), 1.3), ((5.2, 2.0, 1.2), 1.3),
        ((-2.5, -14.5, 0.25), 1.0), ((2.5, -14.5, 0.25), 1.0)
    ]
    for cloc, cscale in crags:
        if is_clear(cloc[0], cloc[1], [p4], plots_3d):
            create_boulder(cloc, scale=cscale, material=mat_basalt_dark)

    # Volcanic Fortress Keep
    gate_x, gate_y, gate_z = 0.0, 7.2, 1.8
    build_grand_keep(gate_x, gate_y, gate_z, mat_basalt_dark, mat_stone_dark, mat_lava_outer, mat_saffron)

    bpy.context.view_layer.update()
    wps = project_path(scene, cam, p4, 1600, 2400)
    plots_2d = project_plots(scene, cam, plots_3d, 1600, 2400)

    png_path = "assets/maps/map4.png"
    bpy.context.scene.render.filepath = png_path
    bpy.ops.render.render(write_still=True)

    tip_co = bpy_extras.object_utils.world_to_camera_view(scene, cam, Vector((gate_x, gate_y + 1.8, gate_z + 4.05)))
    tip_2d = {"x": round(tip_co.x * 1600), "y": round((1.0 - tip_co.y) * 2400)}

    meta = {
        "id": "map4",
        "name": "焰口邊境",
        "region": 4,
        "width": 1600,
        "height": 2400,
        "waypoints": wps,
        "plots": plots_2d,
        "castle_pos": wps[-1],
        "spawn_pos": wps[0],
        "keep_tip": tip_2d,
        "description": "火山熔岩裂谷邊陲，熾熱岩漿奔流，黑曜石險峽地勢兇險。"
    }
    with open("assets/maps/map4.json", "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
    print(f"Map 4 rendered successfully: {png_path}")

# -------------------------------------------------------------------------
# REGION 5: 北辰堡 (Royal Citadel - Double Approach)
# -------------------------------------------------------------------------

def render_map5():
    print("--- Rendering Map 5: 北辰堡 (1600x2400) ---")
    scene, cam = setup_diorama_scene(1600, 2400, sky_color='#A6CEF0')

    mat_snow = blender_utils.get_material('ice', hex_color='#F1F5F9', roughness=0.35)
    mat_stone = blender_utils.get_material('stone', hex_color='#C4BCB1', roughness=0.65)
    mat_stone_dark = blender_utils.get_material('stone_dark', hex_color='#736A5E', roughness=0.80)
    mat_teal = blender_utils.get_material('glacier_teal', hex_color='#2F8F9D', roughness=0.35)
    mat_road = blender_utils.get_material('road_gold', hex_color='#C89B48', roughness=0.85)
    mat_saffron = blender_utils.get_material('saffron')
    mat_gold = blender_utils.get_material('gold', hex_color='#FBBF24', roughness=0.25, metallic=0.65)
    mat_wood = blender_utils.get_material('wood_dark')
    mat_sky = blender_utils.get_material('sky', hex_color='#A6CEF0', emission='#A6CEF0')

    build_models.create_box("SkyBackdrop", size=(100.0, 2.0, 50.0), location=(0.0, 16.0, 6.0), material=mat_sky)

    pA = [(-3.6, -11.0, 0.2), (-3.2, -8.0, 0.3), (-2.5, -5.0, 0.4), (-1.2, -2.0, 0.6), (0.0, 0.5, 0.9), (0.0, 3.0, 1.3), (0.0, 5.5, 1.6), (0.0, 7.2, 1.8)]
    pB = [(3.6, -11.0, 0.2), (3.2, -8.0, 0.3), (2.5, -5.0, 0.4), (1.2, -2.0, 0.6), (0.0, 0.5, 0.9), (0.0, 3.0, 1.3), (0.0, 5.5, 1.6), (0.0, 7.2, 1.8)]

    pA_road = [(-3.8, -18.0, 0.1), (-3.8, -14.5, 0.15), (-3.8, -12.5, 0.18)] + pA + [(0.0, 7.8, 1.8)]
    pB_road = [(3.8, -18.0, 0.1), (3.8, -14.5, 0.15), (3.8, -12.5, 0.18)] + pB + [(0.0, 7.8, 1.8)]

    # Faceted Citadel Forecourt Terrain
    build_faceted_terrain("CitadelTerrain", [pA_road, pB_road], min_x=-16.0, max_x=16.0, min_y=-21.0, max_y=14.0, nx=36, ny=42, mat_primary=mat_stone, mat_secondary=mat_stone_dark, mat_accent=mat_snow)

    # Mountain Flanks
    build_dense_mountain_flank("WestFlank", -1, min_y=-20.0, max_y=14.0, steps_y=34, base_dist=4.2, crest_dist=12.0, max_z=7.5, mat_snow=mat_snow, mat_rock=mat_stone, mat_accent=mat_teal)
    build_dense_mountain_flank("EastFlank", 1, min_y=-20.0, max_y=14.0, steps_y=34, base_dist=4.2, crest_dist=12.0, max_z=7.5, mat_snow=mat_snow, mat_rock=mat_stone, mat_accent=mat_teal)

    # Multi-Tiered Stepped Citadel Plazas with Balustrades
    # Tier 1: Lower Avenue Court
    build_models.create_box("PlazaTier1", size=(16.0, 7.5, 0.35), location=(0.0, -6.5, -0.05), material=mat_stone)
    build_models.create_box("BalustradeL1", size=(0.6, 7.5, 0.45), location=(-8.0, -6.5, 0.3), material=mat_stone_dark)
    build_models.create_box("BalustradeR1", size=(0.6, 7.5, 0.45), location=(8.0, -6.5, 0.3), material=mat_stone_dark)

    # Tier 2: Mid Grand Confluence Plaza
    build_models.create_box("PlazaTier2", size=(14.0, 6.5, 0.35), location=(0.0, -0.5, 0.40), material=mat_stone)
    build_models.create_box("BalustradeL2", size=(0.6, 6.5, 0.45), location=(-7.0, -0.5, 0.75), material=mat_stone_dark)
    build_models.create_box("BalustradeR2", size=(0.6, 6.5, 0.45), location=(7.0, -0.5, 0.75), material=mat_stone_dark)

    # Tier 3: Upper Royal Palace Court
    build_models.create_box("PlazaTier3", size=(12.0, 6.0, 0.35), location=(0.0, 5.0, 0.95), material=mat_stone)
    build_models.create_box("BalustradeL3", size=(0.6, 6.0, 0.45), location=(-6.0, 5.0, 1.30), material=mat_stone_dark)
    build_models.create_box("BalustradeR3", size=(0.6, 6.0, 0.45), location=(6.0, 5.0, 1.30), material=mat_stone_dark)

    # Flanking Royal Bastions with Teal Conical Roofs & Saffron Banners
    bastion_locs = [
        (-6.2, -6.5, 0.1), (6.2, -6.5, 0.1),
        (-5.5, 2.5, 0.75), (5.5, 2.5, 0.75)
    ]
    for bx, by, bz in bastion_locs:
        build_models.create_oct_prism("RoyalBastion", radius=1.0, depth=2.4, location=(bx, by, bz + 1.2), material=mat_stone)
        build_models.create_oct_prism("BastionCrenels", radius=1.12, depth=0.35, location=(bx, by, bz + 2.5), material=mat_stone_dark)
        build_models.create_cone("BastionRoof", radius=1.2, depth=1.3, vertices=8, location=(bx, by, bz + 3.2), material=mat_teal)
        build_models.create_cylinder("BastionPole", radius=0.04, depth=1.0, vertices=4, location=(bx, by, bz + 3.9), material=mat_wood)
        build_models.create_box("BastionFlag", size=(0.04, 0.5, 0.3), location=(bx, by + 0.25, bz + 4.1), material=mat_saffron)

    # Dual Approaching Golden Roads & Curbs
    build_road_ribbon(pA_road, road_width=2.5, material=mat_road)
    build_road_ribbon(pB_road, road_width=2.5, material=mat_road)
    add_road_curbs(pA_road, road_width=2.5, material=mat_stone_dark)
    add_road_curbs(pB_road, road_width=2.5, material=mat_stone_dark)

    # Grand Palace Keep at Confluence Apex
    gate_x, gate_y, gate_z = 0.0, 7.2, 1.9
    build_grand_keep(gate_x, gate_y, gate_z, mat_stone, mat_stone_dark, mat_teal, mat_saffron)

    # 9 Plots
    cfg5 = [
        (pB, 0, 0.65, -1),
        (pA, 0, 0.65, 1),
        (pB, 1, 0.50, 1),
        (pA, 2, 0.25, 1),
        (pB, 2, 0.75, 1),
        (pA, 3, 0.50, 1),
        (pA, 4, 0.25, -1),
        (pB, 5, 0.25, 1),
        (pA, 6, 0.35, -1)
    ]
    plots_3d = [calc_plot(c[0], c[1], c[2], c[3], offset=0.95) for c in cfg5]
    for i, ploc in enumerate(plots_3d):
        build_models.create_oct_prism(f"Plot_{i}", radius=0.85, depth=0.18, location=ploc, material=mat_stone)

    # Ceremonial Banners & Braziers along Citadel Avenues
    for bx, by, bz in [(-2.2, -6.0, 0.3), (2.2, -6.0, 0.3), (-1.5, 0.5, 0.8), (1.5, 0.5, 0.8)]:
        create_banner_pole(bx, by, bz, banner_mat=mat_saffron)
        create_brazier(bx * 0.7, by + 1.2, bz)

    # Over 75 Fir Trees in courtyard planters & slopes
    fir_locs = [
        (-5.5, -11.5, 0.2, 1.15), (-4.2, -12.0, 0.15, 0.9), (-2.0, -12.5, 0.1, 1.0),
        (5.5, -11.5, 0.2, 1.15), (4.2, -12.0, 0.15, 0.9), (2.0, -12.5, 0.1, 1.0),
        (-3.8, -14.8, 0.12, 1.2), (3.8, -14.8, 0.12, 1.2), (-1.8, -16.5, 0.1, 0.95), (1.8, -16.5, 0.1, 0.95),
        (-4.5, -17.5, 0.1, 1.25), (4.5, -17.5, 0.1, 1.25),
        (-6.0, -9.0, 0.35, 1.2), (-6.5, -6.5, 0.5, 0.95), (-5.8, -4.0, 0.65, 1.1),
        (6.0, -9.0, 0.35, 1.2), (6.5, -6.5, 0.5, 0.95), (5.8, -4.0, 0.65, 1.1),
        (-6.5, 1.0, 0.95, 1.2), (6.5, 1.0, 0.95, 1.2),
        (-5.2, 5.0, 1.4, 1.0), (5.2, 5.0, 1.4, 1.0),
        (0.0, -12.8, 0.1, 1.0), (-1.0, -13.0, 0.1, 0.85), (1.0, -13.0, 0.1, 0.85)
    ]
    for fx, fy, fz, fsc in fir_locs:
        if is_clear(fx, fy, [pA, pB], plots_3d):
            create_fir_tree((fx, fy, fz), scale=fsc)

    bpy.context.view_layer.update()
    wpsA = project_path(scene, cam, pA, 1600, 2400)
    wpsB = project_path(scene, cam, pB, 1600, 2400)
    plots_2d = project_plots(scene, cam, plots_3d, 1600, 2400)

    png_path = "assets/maps/map5.png"
    bpy.context.scene.render.filepath = png_path
    bpy.ops.render.render(write_still=True)

    tip_co = bpy_extras.object_utils.world_to_camera_view(scene, cam, Vector((gate_x, gate_y + 1.8, gate_z + 4.15)))
    tip_2d = {"x": round(tip_co.x * 1600), "y": round((1.0 - tip_co.y) * 2400)}

    meta = {
        "id": "map5",
        "name": "北辰堡",
        "region": 5,
        "width": 1600,
        "height": 2400,
        "waypoints": wpsA,
        "paths": [wpsA, wpsB],
        "plots": plots_2d,
        "castle_pos": wpsA[-1],
        "spawn_pos": wpsA[0],
        "spawns": [wpsA[0], wpsB[0]],
        "keep_tip": tip_2d,
        "description": "霜門最終王城要塞，雙路防線直達大殿，焰裔總帥最後決戰！"
    }
    with open("assets/maps/map5.json", "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
    print(f"Map 5 rendered successfully: {png_path}")

# -------------------------------------------------------------------------
# MAIN DISPATCHER
# -------------------------------------------------------------------------

def main():
    target = sys.argv[-1] if len(sys.argv) > 1 and not sys.argv[-1].endswith(".py") else "all"
    if target in ["1", "all"]:
        render_map1()
    if target in ["2", "all"]:
        render_map2()
    if target in ["3", "all"]:
        render_map3()
    if target in ["4", "all"]:
        render_map4()
    if target in ["5", "all"]:
        render_map5()

if __name__ == "__main__":
    main()
