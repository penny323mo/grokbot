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

def get_emission_material(name, hex_color, strength=3.0):
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
    mat_trunk = blender_utils.get_material('wood_dark', hex_color='#4A3423')
    mat_foliage = blender_utils.get_material('fir_green', hex_color='#244B3E', roughness=0.75)
    mat_snow = blender_utils.get_material('ice', hex_color='#BDC3C8', roughness=0.45)

    # 1. Thick octagonal clay trunk with flared root base
    build_models.create_cylinder("TreeTrunk", radius=0.18 * scale, depth=1.0 * scale, vertices=6, location=(loc[0], loc[1], loc[2] + 0.5 * scale), material=mat_trunk)
    build_models.create_cone("TreeRoots", radius=0.32 * scale, depth=0.25 * scale, vertices=6, location=(loc[0], loc[1], loc[2] + 0.12 * scale), material=mat_trunk)

    # 2. Chunky, multi-tier clay boughs with alternating rotation and snow mantle caps
    # Tier 1 (Lowest boughs)
    build_models.create_cone("Foliage1", radius=1.05 * scale, depth=0.68 * scale, vertices=8, location=(loc[0], loc[1], loc[2] + 0.65 * scale), material=mat_foliage)
    build_models.create_cone("SnowCap1", radius=0.78 * scale, depth=0.22 * scale, vertices=8, location=(loc[0], loc[1], loc[2] + 0.85 * scale), material=mat_snow)

    # Tier 2 (Mid-low boughs, rotated 22.5 deg for full silhouette)
    build_models.create_cone("Foliage2", radius=0.88 * scale, depth=0.62 * scale, vertices=8, location=(loc[0], loc[1], loc[2] + 1.15 * scale), rotation=(0, 0, 0.39), material=mat_foliage)
    build_models.create_cone("SnowCap2", radius=0.65 * scale, depth=0.20 * scale, vertices=8, location=(loc[0], loc[1], loc[2] + 1.34 * scale), rotation=(0, 0, 0.39), material=mat_snow)

    # Tier 3 (Mid-high boughs)
    build_models.create_cone("Foliage3", radius=0.70 * scale, depth=0.55 * scale, vertices=8, location=(loc[0], loc[1], loc[2] + 1.60 * scale), material=mat_foliage)
    build_models.create_cone("SnowCap3", radius=0.52 * scale, depth=0.18 * scale, vertices=8, location=(loc[0], loc[1], loc[2] + 1.76 * scale), material=mat_snow)

    # Tier 4 (Crown apex & peak snow tip)
    build_models.create_cone("CrownApex", radius=0.48 * scale, depth=0.60 * scale, vertices=6, location=(loc[0], loc[1], loc[2] + 2.05 * scale), material=mat_snow)
    build_models.create_cone("CrownTip", radius=0.20 * scale, depth=0.32 * scale, vertices=5, location=(loc[0], loc[1], loc[2] + 2.34 * scale), material=mat_snow)

    # Base snowdrift mound
    build_models.create_cone("BaseDrift", radius=0.58 * scale, depth=0.16 * scale, vertices=6, location=(loc[0], loc[1], loc[2] + 0.08 * scale), material=mat_snow)

def create_boulder(loc, scale=1.0, material=None):
    if material is None:
        material = blender_utils.get_material('slate_blue', hex_color='#46608A', roughness=0.82)
    bpy.ops.mesh.primitive_cube_add(size=scale, location=loc, rotation=(0.25, 0.35, 0.45))
    boulder = bpy.context.active_object
    boulder.scale = (1.2, 0.9, 0.85)
    bpy.ops.object.transform_apply(scale=True)
    make_faceted(boulder)
    boulder.data.materials.append(material)
    return boulder

def create_crystal_shard(loc, scale=1.0, mat_teal=None):
    if mat_teal is None:
        mat_teal = blender_utils.get_material('glacier_teal', hex_color='#38BDF8', roughness=0.2, emission='#38BDF8')
    build_models.create_cone("CrystalShard", radius=0.28 * scale, depth=1.3 * scale, vertices=5, location=(loc[0], loc[1], loc[2] + 0.65 * scale), rotation=(0.1, 0.15, 0.3), material=mat_teal)

def create_banner_pole(bx, by, bz, banner_mat=None, pole_mat=None):
    if pole_mat is None:
        pole_mat = blender_utils.get_material('wood_dark', hex_color='#4A3423')
    if banner_mat is None:
        banner_mat = blender_utils.get_material('saffron', hex_color='#F59E0B')
    build_models.create_cylinder("BannerPole", radius=0.045, depth=2.4, vertices=6, location=(bx, by, bz + 1.2), material=pole_mat)
    build_models.create_cone("PoleFinial", radius=0.09, depth=0.20, vertices=5, location=(bx, by, bz + 2.45), material=blender_utils.get_material('gold', hex_color='#FBBF24'))
    build_models.create_box("BannerFlag", size=(0.04, 0.65, 0.50), location=(bx, by + 0.32, bz + 1.95), material=banner_mat)

def create_brazier(bx, by, bz, flame_mat=None):
    mat_stone = blender_utils.get_material('stone', hex_color='#B9AE9C')
    mat_stone_dark = blender_utils.get_material('stone_dark', hex_color='#696054')
    if flame_mat is None:
        flame_mat = get_emission_material('flame_saffron', '#FFA500', strength=3.5)
    build_models.create_box("BrazierBase", size=(0.38, 0.38, 0.65), location=(bx, by, bz + 0.32), material=mat_stone)
    build_models.create_oct_prism("BrazierBowl", radius=0.35, depth=0.28, location=(bx, by, bz + 0.75), material=mat_stone_dark)
    build_models.create_cone("BrazierFlame", radius=0.22, depth=0.45, vertices=5, location=(bx, by, bz + 1.02), material=flame_mat)

def create_watchtower(wx, wy, wz, mat_stone, mat_stone_dark, mat_roof, mat_banner, mat_wood):
    build_models.create_cylinder("WatchtowerBase", radius=0.85, depth=2.6, vertices=8, location=(wx, wy, wz + 1.3), material=mat_stone)
    build_models.create_oct_prism("WatchtowerCrenels", radius=1.0, depth=0.38, location=(wx, wy, wz + 2.7), material=mat_stone_dark)
    build_models.create_cone("WatchtowerRoof", radius=1.05, depth=1.3, vertices=6, location=(wx, wy, wz + 3.5), material=mat_roof)
    build_models.create_cylinder("TowerPole", radius=0.035, depth=1.2, vertices=4, location=(wx, wy, wz + 4.2), material=mat_wood)
    build_models.create_box("TowerFlag", size=(0.04, 0.5, 0.35), location=(wx, wy + 0.28, wz + 4.4), material=mat_banner)

def create_basalt_column(loc, radius=0.4, height=1.2, mat=None):
    if mat is None:
        mat = blender_utils.get_material('basalt', hex_color='#2C3038', roughness=0.85)
    build_models.create_cylinder("BasaltCol", radius=radius, depth=height, vertices=6, location=(loc[0], loc[1], loc[2] + height * 0.5), rotation=(0, 0, loc[0] * 0.5), material=mat)

def build_road_ribbon(path_3d, road_width=2.5, material=None, z_offset=0.18, add_skirt=True):
    mesh = bpy.data.meshes.new("RoadMesh")
    road_obj = bpy.data.objects.new("Road", mesh)
    bpy.context.scene.collection.objects.link(road_obj)

    # Resample path into equidistant points for physical flagstone courses
    step_len = 0.85
    resampled = [path_3d[0]]
    for i in range(len(path_3d) - 1):
        pA = path_3d[i]
        pB = path_3d[i+1]
        dx = pB[0] - pA[0]
        dy = pB[1] - pA[1]
        dz = pB[2] - pA[2]
        dist = math.hypot(dx, dy)
        steps = max(1, int(dist / step_len))
        for s in range(1, steps + 1):
            t = s / steps
            resampled.append((pA[0] + dx*t, pA[1] + dy*t, pA[2] + dz*t))

    verts = []
    faces = []
    w_half = road_width * 0.5
    num_pts = len(resampled)

    # 6 vertices per cross section: 4 for pavers, 2 for foundation skirts
    for i in range(num_pts):
        pt = resampled[i]
        if i < num_pts - 1:
            dx = resampled[i+1][0] - pt[0]
            dy = resampled[i+1][1] - pt[1]
        else:
            dx = pt[0] - resampled[i-1][0]
            dy = pt[1] - resampled[i-1][1]
        l = max(0.001, math.hypot(dx, dy))
        nx = -dy / l
        ny = dx / l
        for col_idx, frac in enumerate([-1.0, -0.33, 0.33, 1.0]):
            # Subtle physical relief bevel between pavers
            z_relief = 0.012 if (i + col_idx) % 2 == 0 else -0.012
            verts.append((pt[0] + nx * w_half * frac, pt[1] + ny * w_half * frac, pt[2] + z_offset + z_relief))
        # 2 skirt foundation vertices (down to pt[2] - 0.28)
        verts.append((pt[0] - nx * w_half, pt[1] - ny * w_half, pt[2] - 0.28))
        verts.append((pt[0] + nx * w_half, pt[1] + ny * w_half, pt[2] - 0.28))

    for i in range(num_pts - 1):
        rowA = i * 6
        rowB = (i + 1) * 6
        for slab in range(3):
            v1 = rowA + slab
            v2 = rowA + slab + 1
            v3 = rowB + slab + 1
            v4 = rowB + slab
            faces.append((v1, v2, v3, v4))
        if add_skirt:
            # Left skirt wall
            faces.append((rowA + 0, rowA + 4, rowB + 4, rowB + 0))
            # Right skirt wall
            faces.append((rowA + 3, rowB + 3, rowB + 5, rowA + 5))

    mesh.from_pydata(verts, [], faces)
    mesh.update()
    make_faceted(road_obj)
    if material:
        road_obj.data.materials.append(material)
        mat_accent = blender_utils.get_material('road_gold_accent', hex_color='#BA9040', roughness=0.85)
        road_obj.data.materials.append(mat_accent)
        mat_skirt = blender_utils.get_material('stone_dark', hex_color='#4A433A', roughness=0.85)
        road_obj.data.materials.append(mat_skirt)

        num_segs = num_pts - 1
        for i in range(num_segs):
            base_face = i * (5 if add_skirt else 3)
            for slab in range(3):
                p_idx = base_face + slab
                mesh.polygons[p_idx].material_index = 1 if (p_idx % 3 == 1 or p_idx % 5 == 2) else 0
            if add_skirt:
                mesh.polygons[base_face + 3].material_index = 2
                mesh.polygons[base_face + 4].material_index = 2

    return road_obj

def is_near_plot(x, y, plots_3d, threshold=1.15):
    if not plots_3d:
        return False
    for p in plots_3d:
        if math.hypot(x - p[0], y - p[1]) < threshold:
            return True
    return False

def add_road_curbs(path_3d, road_width=2.5, material=None, plots_3d=None):
    if material is None:
        material = blender_utils.get_material('stone_dark', hex_color='#696054')

    step_len = 0.60
    resampled = [path_3d[0]]
    for i in range(len(path_3d) - 1):
        pA = path_3d[i]
        pB = path_3d[i+1]
        dx = pB[0] - pA[0]
        dy = pB[1] - pA[1]
        dz = pB[2] - pA[2]
        dist = math.hypot(dx, dy)
        steps = max(1, int(dist / step_len))
        for s in range(1, steps + 1):
            t = s / steps
            resampled.append((pA[0] + dx*t, pA[1] + dy*t, pA[2] + dz*t))

    half_w = road_width * 0.5 + 0.12
    wall_thick = 0.22
    wall_h = 0.26
    tooth_h = 0.15

    for i in range(len(resampled) - 1):
        pA = resampled[i]
        pB = resampled[i+1]
        dx = pB[0] - pA[0]
        dy = pB[1] - pA[1]
        dz = pB[2] - pA[2]
        l = max(0.001, math.hypot(dx, dy))
        nx = -dy / l
        ny = dx / l
        angle = math.atan2(dy, dx)
        seg_len = l + 0.05
        mx = (pA[0] + pB[0]) * 0.5
        my = (pA[1] + pB[1]) * 0.5
        mz = (pA[2] + pB[2]) * 0.5 + wall_h * 0.5 + 0.08

        for side in [-1, 1]:
            cx = mx + nx * side * half_w
            cy = my + ny * side * half_w
            if is_near_plot(cx, cy, plots_3d, threshold=1.15):
                continue
            build_models.create_box("WallBase", size=(seg_len, wall_thick, wall_h), location=(cx, cy, mz), rotation=(0, 0, angle), material=material)

            if i % 2 == 0:
                tooth_len = min(0.32, seg_len * 0.65)
                tz = mz + (wall_h + tooth_h) * 0.5
                build_models.create_box("CrenelTooth", size=(tooth_len, wall_thick + 0.03, tooth_h), location=(cx, cy, tz), rotation=(0, 0, angle), material=material)

    for pt in path_3d:
        for side in [-1, 1]:
            idx = path_3d.index(pt)
            if idx < len(path_3d) - 1:
                dx = path_3d[idx+1][0] - pt[0]
                dy = path_3d[idx+1][1] - pt[1]
            else:
                dx = pt[0] - path_3d[idx-1][0]
                dy = pt[1] - path_3d[idx-1][1]
            l = max(0.001, math.hypot(dx, dy))
            nx = -dy / l
            ny = dx / l
            jx = pt[0] + nx * side * half_w
            jy = pt[1] + ny * side * half_w
            jz = pt[2] + (wall_h + tooth_h) * 0.5 + 0.08
            if is_near_plot(jx, jy, plots_3d, threshold=1.15):
                continue
            build_models.create_cylinder("CurbPost", radius=0.15, depth=wall_h + tooth_h + 0.04, vertices=8, location=(jx, jy, jz), material=material)

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

def build_dense_mountain_flank(name, flank_sign, min_y=-20.0, max_y=14.0, steps_y=40, base_dist=3.6, crest_dist=12.0, max_z=7.5, mat_snow=None, mat_rock=None, mat_accent=None):
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)

    verts = []
    faces = []
    dy = (max_y - min_y) / steps_y

    col_offsets = [0.0, 1.2, 2.6, 4.2, 6.0, 8.2, 10.8, 14.5]
    col_z_mult =  [0.0, 0.28, 0.48, 0.72, 0.98, 1.25, 1.55, 0.70]

    for i in range(steps_y + 1):
        y = min_y + i * dy
        h_noise1 = math.sin(i * 1.4 + flank_sign * 2.3) * 0.95
        h_noise2 = math.cos(i * 2.8) * 0.55
        w_noise = math.sin(i * 1.1) * 0.5

        b_dist = base_dist
        if y < -11.0:
            b_dist += (abs(y) - 11.0) * 0.12

        road_z = 0.2 + (y + 11.0) / 18.0 * 1.6
        z0 = max(0.0, road_z + 0.15)

        for c in range(8):
            xc = flank_sign * (b_dist + col_offsets[c] + w_noise * (0.2 + c * 0.08))
            zc = z0 + (max_z * col_z_mult[c]) + h_noise1 * (0.15 + c * 0.1) + (h_noise2 if c % 2 == 1 else -h_noise2) * 0.35
            if c == 7:
                zc = max(0.5, zc * 0.45)
            verts.append((xc, y, zc))

    for i in range(steps_y):
        row_a = i * 8
        row_b = (i + 1) * 8
        for col in range(7):
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

        for poly in mesh.polygons:
            nz = abs(poly.normal.z)
            if mat_accent and nz < 0.30:
                poly.material_index = 2
            elif nz < 0.60:
                poly.material_index = 1
            else:
                poly.material_index = 0
    return obj

def create_gradient_sky_material(name, top_hex, mid_hex, bot_hex):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    output = nodes.new('ShaderNodeOutputMaterial')
    emit = nodes.new('ShaderNodeEmission')
    ramp = nodes.new('ShaderNodeValToRGB')
    tex = nodes.new('ShaderNodeTexCoord')
    sep = nodes.new('ShaderNodeSeparateXYZ')

    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[0].color = blender_utils.hex_to_linear_rgb(bot_hex)
    ramp.color_ramp.elements[1].position = 1.0
    ramp.color_ramp.elements[1].color = blender_utils.hex_to_linear_rgb(top_hex)
    el_mid = ramp.color_ramp.elements.new(0.42)
    el_mid.color = blender_utils.hex_to_linear_rgb(mid_hex)

    links.new(tex.outputs['Generated'], sep.inputs['Vector'])
    links.new(sep.outputs['Z'], ramp.inputs['Fac'])
    links.new(ramp.outputs['Color'], emit.inputs['Color'])
    emit.inputs['Strength'].default_value = 1.0
    links.new(emit.outputs['Emission'], output.inputs['Surface'])
    return mat

def build_sky_backdrop(top_hex='#0A1322', mid_hex='#1E3D60', bot_hex='#6B8FA8', loc_y=16.0, loc_z=6.0, width=120.0, height=50.0):
    mat_sky = create_gradient_sky_material("SkyMat_Grad", top_hex, mid_hex, bot_hex)
    build_models.create_box("SkyBackdrop", size=(width, 2.0, height), location=(0.0, loc_y, loc_z), material=mat_sky)

def build_grand_keep(gate_x, gate_y, gate_z, mat_stone, mat_stone_dark, mat_spire, mat_banner, mat_wall=None, mat_arch=None, mat_finial=None, mat_snow=None):
    if mat_wall is None:
        mat_wall = mat_stone
    if mat_arch is None:
        mat_arch = mat_stone
    if mat_finial is None:
        mat_finial = blender_utils.get_material('gold', hex_color='#F59E0B', roughness=0.25, metallic=0.75)
    if mat_snow is None:
        mat_snow = blender_utils.get_material('ice', hex_color='#DDEBF2', roughness=0.45)

    mat_wood = blender_utils.get_material('wood_dark', hex_color='#4A3423')
    mat_iron = blender_utils.get_material('iron', hex_color='#475569', metallic=0.7)
    window_glow = get_emission_material('keep_window', '#FFE082', strength=4.0)
    flame_mat = get_emission_material('keep_flame', '#FFA500', strength=4.0)

    # 0. MASSIVE STEPPED ROCK PROMONTORY CLIFF BASE (Elevates keep onto rugged rocky mountain)
    build_models.create_box("KeepPromontory_BaseL", size=(4.2, 4.8, 1.8), location=(gate_x - 3.4, gate_y + 1.6, gate_z + 0.3), material=mat_stone_dark)
    build_models.create_box("KeepPromontory_BaseR", size=(4.2, 4.8, 1.8), location=(gate_x + 3.4, gate_y + 1.6, gate_z + 0.3), material=mat_stone_dark)
    build_models.create_box("KeepPromontory_Center", size=(5.2, 3.6, 1.8), location=(gate_x, gate_y + 2.6, gate_z + 0.3), material=mat_stone_dark)
    build_models.create_box("KeepPromontory_TerraceL", size=(3.6, 3.8, 0.6), location=(gate_x - 3.2, gate_y + 1.6, gate_z + 1.1), material=mat_stone)
    build_models.create_box("KeepPromontory_TerraceR", size=(3.6, 3.8, 0.6), location=(gate_x + 3.2, gate_y + 1.6, gate_z + 1.1), material=mat_stone)
    create_boulder((gate_x - 5.5, gate_y + 0.8, gate_z + 0.4), scale=2.0, material=mat_stone_dark)
    create_boulder((gate_x + 5.5, gate_y + 0.8, gate_z + 0.4), scale=2.0, material=mat_stone_dark)
    create_boulder((gate_x - 4.2, gate_y + 0.2, gate_z + 0.3), scale=1.4, material=mat_stone_dark)
    create_boulder((gate_x + 4.2, gate_y + 0.2, gate_z + 0.3), scale=1.4, material=mat_stone_dark)

    # 1. CENTRAL DONJON / HIGH CITADEL KEEP (Apex lands precisely at gate_x, gate_y + 2.0, gate_z + 4.90 for keep_tip)
    donjon_y = gate_y + 2.0
    # Foundation plinth
    build_models.create_cylinder("Donjon_Base", radius=1.65, depth=1.4, vertices=8, location=(gate_x, donjon_y, gate_z + 0.8), material=mat_stone_dark)
    # Lower octagonal tower shaft
    build_models.create_cylinder("Donjon_ShaftLower", radius=1.35, depth=2.0, vertices=8, location=(gate_x, donjon_y, gate_z + 1.8), material=mat_stone)
    # Mid belt cornice
    build_models.create_cylinder("Donjon_Cornice", radius=1.45, depth=0.20, vertices=8, location=(gate_x, donjon_y, gate_z + 2.7), material=mat_stone_dark)
    # Upper octagonal tower shaft
    build_models.create_cylinder("Donjon_ShaftUpper", radius=1.20, depth=1.4, vertices=8, location=(gate_x, donjon_y, gate_z + 3.3), material=mat_stone)
    # Arched lancet windows (glowing warm golden amber)
    for wx in [-0.42, 0.42]:
        build_models.create_box("Donjon_WinL", size=(0.22, 0.12, 0.45), location=(gate_x + wx, donjon_y - 1.25, gate_z + 2.2), material=window_glow)
        build_models.create_box("Donjon_WinU", size=(0.20, 0.12, 0.40), location=(gate_x + wx, donjon_y - 1.15, gate_z + 3.3), material=window_glow)
    # Corbel machicolation gallery ring
    build_models.create_cylinder("Donjon_Corbels", radius=1.48, depth=0.28, vertices=8, location=(gate_x, donjon_y, gate_z + 3.90), material=mat_stone_dark)
    # Crenellated upper battlements crown
    build_models.create_cylinder("Donjon_Crenels", radius=1.42, depth=0.45, vertices=8, location=(gate_x, donjon_y, gate_z + 4.15), material=mat_stone)
    # Eaves brim ring
    build_models.create_cylinder("Donjon_Brim", radius=1.36, depth=0.14, vertices=8, location=(gate_x, donjon_y, gate_z + 4.35), material=mat_spire)
    # Steep conical teal spire roof
    build_models.create_cone("Donjon_Spire", radius=1.22, depth=2.30, vertices=8, location=(gate_x, donjon_y, gate_z + 4.30), material=mat_spire)
    # Gilded spearhead finial shaft and frost star tip (Apex reaches gate_z + 4.90)
    build_models.create_cylinder("Donjon_FinialShaft", radius=0.06, depth=0.60, vertices=6, location=(gate_x, donjon_y, gate_z + 4.65), material=mat_finial)
    build_models.create_cone("Donjon_FinialTip", radius=0.15, depth=0.40, vertices=5, location=(gate_x, donjon_y, gate_z + 4.90), material=mat_finial)
    # Saffron war tapestries flanking the donjon facade
    build_models.create_box("Donjon_BannerL", size=(0.04, 0.50, 1.20), location=(gate_x - 0.85, donjon_y - 0.75, gate_z + 2.3), material=mat_banner)
    build_models.create_box("Donjon_BannerR", size=(0.04, 0.50, 1.20), location=(gate_x + 0.85, donjon_y - 0.75, gate_z + 2.3), material=mat_banner)

    # 2. MID-TIER FLANKING TOWERS (Left & Right at gate_x ± 2.6, gate_y + 1.5)
    for tx, side in [(gate_x - 2.6, -1), (gate_x + 2.6, 1)]:
        ty = gate_y + 1.5
        build_models.create_cylinder(f"FlankTower_Base_{side}", radius=0.95, depth=1.8, vertices=8, location=(tx, ty, gate_z + 0.9), material=mat_stone_dark)
        build_models.create_cylinder(f"FlankTower_Shaft_{side}", radius=0.78, depth=2.5, vertices=8, location=(tx, ty, gate_z + 1.9), material=mat_stone)
        build_models.create_box(f"FlankTower_Win_{side}", size=(0.18, 0.10, 0.35), location=(tx, ty - 0.75, gate_z + 2.2), material=window_glow)
        build_models.create_cylinder(f"FlankTower_Corbels_{side}", radius=0.95, depth=0.22, vertices=8, location=(tx, ty, gate_z + 2.95), material=mat_stone_dark)
        build_models.create_cylinder(f"FlankTower_Crenels_{side}", radius=0.90, depth=0.35, vertices=8, location=(tx, ty, gate_z + 3.20), material=mat_stone)
        build_models.create_cylinder(f"FlankTower_Brim_{side}", radius=0.88, depth=0.10, vertices=8, location=(tx, ty, gate_z + 3.35), material=mat_spire)
        build_models.create_cone(f"FlankTower_Spire_{side}", radius=0.82, depth=1.85, vertices=8, location=(tx, ty, gate_z + 3.85), material=mat_spire)
        build_models.create_cylinder(f"FlankTower_Finial_{side}", radius=0.05, depth=0.45, vertices=5, location=(tx, ty, gate_z + 4.35), material=mat_finial)
        build_models.create_box(f"FlankTower_Flag_{side}", size=(0.04, 0.40, 0.85), location=(tx, ty - 0.50, gate_z + 2.5), material=mat_banner)

    # 3. OUTER BASTION TOWERS (Wide Ridge Anchors at gate_x ± 5.0, gate_y + 1.0)
    for tx, side in [(gate_x - 5.0, -1), (gate_x + 5.0, 1)]:
        ty = gate_y + 1.0
        build_models.create_cylinder(f"OuterTower_Shaft_{side}", radius=0.68, depth=2.4, vertices=8, location=(tx, ty, gate_z + 1.2), material=mat_stone)
        build_models.create_cylinder(f"OuterTower_Corbels_{side}", radius=0.82, depth=0.22, vertices=8, location=(tx, ty, gate_z + 2.35), material=mat_stone_dark)
        build_models.create_cylinder(f"OuterTower_Crenels_{side}", radius=0.78, depth=0.32, vertices=8, location=(tx, ty, gate_z + 2.55), material=mat_stone)
        build_models.create_cone(f"OuterTower_Spire_{side}", radius=0.74, depth=1.60, vertices=8, location=(tx, ty, gate_z + 3.15), material=mat_spire)
        build_models.create_cylinder(f"OuterTower_Finial_{side}", radius=0.05, depth=0.40, vertices=5, location=(tx, ty, gate_z + 3.75), material=mat_finial)

    # 4. FOREGROUND BARBICAN GATEHOUSE & TWIN FORE-BASTIONS (in front of donjon at gate_y + 0.3)
    build_models.create_box("GatePortal_Arch", size=(2.8, 1.0, 1.8), location=(gate_x, gate_y + 0.3, gate_z + 0.90), material=mat_arch)
    build_models.create_box("GatePortal_Opening", size=(1.4, 1.1, 1.3), location=(gate_x, gate_y + 0.3, gate_z + 0.70), material=mat_stone_dark)
    build_models.create_box("Gate_Portcullis", size=(1.2, 0.12, 1.1), location=(gate_x, gate_y + 0.3, gate_z + 0.70), material=mat_wood)
    build_models.create_box("Gate_Parapet", size=(3.0, 0.35, 0.40), location=(gate_x, gate_y + 0.2, gate_z + 1.85), material=mat_stone_dark)
    # Braziers on gatehouse parapet
    build_models.create_cylinder("Gate_BrazierL", radius=0.22, depth=0.20, vertices=8, location=(gate_x - 1.2, gate_y + 0.2, gate_z + 2.05), material=mat_iron)
    build_models.create_cone("Gate_FlameL", radius=0.15, depth=0.35, vertices=5, location=(gate_x - 1.2, gate_y + 0.2, gate_z + 2.28), material=flame_mat)
    build_models.create_cylinder("Gate_BrazierR", radius=0.22, depth=0.20, vertices=8, location=(gate_x + 1.2, gate_y + 0.2, gate_z + 2.05), material=mat_iron)
    build_models.create_cone("Gate_FlameR", radius=0.15, depth=0.35, vertices=5, location=(gate_x + 1.2, gate_y + 0.2, gate_z + 2.28), material=flame_mat)
    # Heraldic crest shield
    build_models.create_box("Gate_HeraldicCrest", size=(0.04, 0.40, 0.52), location=(gate_x, gate_y + 0.12, gate_z + 1.68), material=mat_banner)

    # Twin Fore-Bastion Drum Towers flanking gate
    for fx, side in [(gate_x - 1.6, -1), (gate_x + 1.6, 1)]:
        fy = gate_y + 0.35
        build_models.create_cylinder(f"ForeBastion_Base_{side}", radius=0.62, depth=2.0, vertices=8, location=(fx, fy, gate_z + 1.0), material=mat_stone)
        build_models.create_cylinder(f"ForeBastion_Corbels_{side}", radius=0.74, depth=0.20, vertices=8, location=(fx, fy, gate_z + 2.0), material=mat_stone_dark)
        build_models.create_cylinder(f"ForeBastion_Crenels_{side}", radius=0.70, depth=0.32, vertices=8, location=(fx, fy, gate_z + 2.22), material=mat_stone)
        build_models.create_cone(f"ForeBastion_Flame_{side}", radius=0.14, depth=0.32, vertices=5, location=(fx, fy, gate_z + 2.45), material=flame_mat)

    # 5. INNER COURTYARD TERRACE & STEPPED CURTAIN WALLS
    build_models.create_box("CourtyardTerrace", size=(2.4, 1.4, 0.5), location=(gate_x, gate_y + 1.1, gate_z + 0.5), material=mat_stone)
    build_models.create_box("CurtainInnerL", size=(1.8, 0.6, 1.8), location=(gate_x - 1.5, gate_y + 0.8, gate_z + 1.1), material=mat_wall)
    build_models.create_box("CurtainInnerR", size=(1.8, 0.6, 1.8), location=(gate_x + 1.5, gate_y + 0.8, gate_z + 1.1), material=mat_wall)
    build_models.create_box("CurtainOuterL", size=(2.2, 0.6, 2.0), location=(gate_x - 3.8, gate_y + 1.2, gate_z + 1.2), material=mat_wall)
    build_models.create_box("CurtainOuterR", size=(2.2, 0.6, 2.0), location=(gate_x + 3.8, gate_y + 1.2, gate_z + 1.2), material=mat_wall)

    # 6. COURTYARD FIR TREES
    for px, py, pz in [(gate_x - 1.2, gate_y + 1.2, gate_z + 0.6), (gate_x + 1.2, gate_y + 1.2, gate_z + 0.6),
                       (gate_x - 3.6, gate_y + 1.8, gate_z + 1.1), (gate_x + 3.6, gate_y + 1.8, gate_z + 1.1)]:
        create_fir_tree((px, py, pz), scale=0.85)

def setup_diorama_scene(render_w=1600, render_h=2400, sky_color='#0E1B2D'):
    scene = blender_utils.reset_scene()
    scene.render.resolution_x = render_w
    scene.render.resolution_y = render_h
    scene.render.film_transparent = False
    scene.view_settings.view_transform = 'Standard'

    # Rich Ambient Occlusion (EEVEE-Next)
    if hasattr(scene, "eevee"):
        if hasattr(scene.eevee, "use_fast_gi"):
            scene.eevee.use_fast_gi = True
            scene.eevee.fast_gi_method = 'AMBIENT_OCCLUSION_ONLY'
            scene.eevee.fast_gi_distance = 4.0
            scene.eevee.fast_gi_ray_count = 16
        if hasattr(scene.eevee, "use_shadows"):
            scene.eevee.use_shadows = True

    world = bpy.data.worlds.new("SkyWorld")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get('Background')
    bg.inputs['Color'].default_value = blender_utils.hex_to_linear_rgb(sky_color)
    bg.inputs['Strength'].default_value = 0.6

    # High-contrast steep alpine sun calibrated to title_key.webp matte clay contrast
    sun_data = bpy.data.lights.new(name="SunKey", type='SUN')
    sun_data.energy = 4.0
    sun_data.color = blender_utils.hex_to_linear_rgb('#FFF5E8')[:3]
    if hasattr(sun_data, "use_shadow"):
        sun_data.use_shadow = True
    sun_obj = bpy.data.objects.new(name="SunKey", object_data=sun_data)
    sun_obj.rotation_euler = (math.radians(64), math.radians(15), math.radians(-20))
    scene.collection.objects.link(sun_obj)

    fill_data = bpy.data.lights.new(name="SunFill", type='SUN')
    fill_data.energy = 1.2
    fill_data.color = blender_utils.hex_to_linear_rgb('#52769E')[:3]
    if hasattr(fill_data, "use_shadow"):
        fill_data.use_shadow = False
    fill_obj = bpy.data.objects.new(name="SunFill", object_data=fill_data)
    fill_obj.rotation_euler = (math.radians(45), math.radians(-30), math.radians(140))
    scene.collection.objects.link(fill_obj)

    rim_data = bpy.data.lights.new(name="SunRim", type='SUN')
    rim_data.energy = 0.9
    rim_data.color = blender_utils.hex_to_linear_rgb('#2B7787')[:3]
    if hasattr(rim_data, "use_shadow"):
        rim_data.use_shadow = False
    rim_obj = bpy.data.objects.new(name="SunRim", object_data=rim_data)
    rim_obj.rotation_euler = (math.radians(65), math.radians(0), math.radians(180))
    scene.collection.objects.link(rim_obj)

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

def calc_plot(path, seg, t, side, offset=0.95):
    pA = path[seg]
    pB = path[seg+1]
    dx = pB[0] - pA[0]
    dy = pB[1] - pA[1]
    l = math.hypot(dx, dy)
    nx = -dy / l * side
    ny = dx / l * side
    mx = pA[0] + dx * t
    my = pA[1] + dy * t
    mz = pA[2] + (pB[2] - pA[2]) * t + 0.1
    return (mx + nx * offset, my + ny * offset, mz)

def is_clear(x, y, paths, plots, safe_dist_road=1.75, safe_dist_plot=2.25):
    for p in paths:
        for i in range(len(p)-1):
            pA = p[i]
            pB = p[i+1]
            dx = pB[0] - pA[0]
            dy = pB[1] - pA[1]
            l2 = dx*dx + dy*dy
            if l2 == 0:
                continue
            t = max(0, min(1, ((x - pA[0])*dx + (y - pA[1])*dy) / l2))
            proj_x = pA[0] + t * dx
            proj_y = pA[1] + t * dy
            if math.hypot(x - proj_x, y - proj_y) < safe_dist_road:
                return False
    for pl in plots:
        if math.hypot(x - pl[0], y - pl[1]) < safe_dist_plot:
            return False
    return True

# -------------------------------------------------------------------------
# FACETED TERRAIN BUILDER (ELIMINATES FLAT PLANES)
# -------------------------------------------------------------------------

def build_faceted_terrain(name, paths_3d, min_x=-16.0, max_x=16.0, min_y=-21.0, max_y=14.0, nx=48, ny=58, mat_primary=None, mat_secondary=None, mat_accent=None, biome_fn=None):
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
                    z = road_z - 0.05
                elif min_d <= 2.6:
                    t = (min_d - 1.4) / 1.2
                    z = road_z - 0.05 + t * 0.25 + (n1 * 0.20)
                else:
                    dist_factor = (min_d - 2.6) * 0.32
                    raw_h = dist_factor + n1 * 0.8 + n2 * 0.4
                    step_size = 0.50
                    stepped = math.floor(raw_h / step_size) * step_size
                    z = road_z + 0.20 + stepped + (raw_h - stepped) * 0.30

            jitter_x = math.sin(i * 3.7 + j * 5.1) * (dx * 0.25) if min_d > 2.0 else 0.0
            jitter_y = math.cos(i * 4.3 + j * 2.9) * (dy * 0.25) if min_d > 2.0 else 0.0
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
            if mat_accent and nz < 0.35:
                poly.material_index = 2
            elif mat_secondary and nz < 0.65:
                poly.material_index = 1
            else:
                poly.material_index = 0
    return obj

# -------------------------------------------------------------------------
# REGION 1: 霜門前哨 (Frostgate Outpost)
# -------------------------------------------------------------------------

def render_map1():
    print("--- Rendering Map 1: 霜門前哨 (1600x2400) ---")
    scene, cam = setup_diorama_scene(1600, 2400, sky_color='#20457C')

    mat_snow = blender_utils.get_material('ice', hex_color='#DDECF5', roughness=0.55)
    mat_rock = blender_utils.get_material('slate_blue', hex_color='#2C3D5A', roughness=0.82)
    mat_teal = blender_utils.get_material('glacier_teal', hex_color='#0284C7', roughness=0.35)
    mat_dark_slate = blender_utils.get_material('dark_slate', hex_color='#1E2638', roughness=0.88)
    mat_road = blender_utils.get_material('road_gold', hex_color='#D4A350', roughness=0.82)
    mat_stone = blender_utils.get_material('stone', hex_color='#B9AE9C')
    mat_stone_dark = blender_utils.get_material('stone_dark', hex_color='#5A5246')
    mat_wood = blender_utils.get_material('wood_dark', hex_color='#4A3423')
    mat_saffron = blender_utils.get_material('saffron', hex_color='#F59E0B')
    build_sky_backdrop(top_hex='#0A1322', mid_hex='#1E3D60', bot_hex='#6B8FA8', loc_y=16.0, loc_z=6.0)

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
    build_faceted_terrain("FacetedGround", [p1_road], min_x=-16.0, max_x=16.0, min_y=-21.0, max_y=14.0, nx=48, ny=58, mat_primary=mat_snow, mat_secondary=mat_rock, mat_accent=mat_teal)

    # Mountain Flanks (base_dist=4.8 gives clean clearance to road bends and plots)
    build_dense_mountain_flank("WestFlank", -1, min_y=-20.0, max_y=14.0, steps_y=40, base_dist=4.8, crest_dist=12.0, max_z=7.5, mat_snow=mat_snow, mat_rock=mat_rock, mat_accent=mat_dark_slate)
    build_dense_mountain_flank("EastFlank", 1, min_y=-20.0, max_y=14.0, steps_y=40, base_dist=4.8, crest_dist=12.0, max_z=7.5, mat_snow=mat_snow, mat_rock=mat_rock, mat_accent=mat_dark_slate)

    # 9 Plots
    cfg1 = [
        (0, 0.35, -1, 0.95),
        (1, 0.35, 1, 0.65),
        (2, 0.65, 1, 0.95),
        (3, 0.65, -1, 0.95),
        (3, 0.35, 1, 0.65),
        (4, 0.65, -1, 0.95),
        (5, 0.50, 1, 0.95),
        (6, 0.65, -1, 0.95),
        (7, 0.65, 1, 0.95)
    ]
    plots_3d = [calc_plot(p1, c[0], c[1], c[2], offset=c[3]) for c in cfg1]
    for i, ploc in enumerate(plots_3d):
        build_models.create_oct_prism(f"Plot_{i}", radius=0.85, depth=0.18, location=ploc, material=mat_stone)

    # Road Ribbon & Curbs
    build_road_ribbon(p1_road, road_width=2.5, material=mat_road)
    add_road_curbs(p1_road, road_width=2.5, material=mat_stone_dark, plots_3d=plots_3d)

    # Stepped Stone Retaining Terraces & Rock Shelves safely positioned on flank borders
    retaining_terraces = [
        ((-5.8, -10.5, 0.30), (3.0, 3.5, 0.45), mat_rock),
        ((5.8, -10.5, 0.30), (3.0, 3.5, 0.45), mat_rock),
        ((-6.2, -6.5, 0.55), (3.0, 3.5, 0.65), mat_rock),
        ((5.8, -4.5, 0.70), (3.0, 3.5, 0.55), mat_stone_dark),
        ((-5.8, -1.5, 0.90), (3.0, 3.0, 0.50), mat_rock),
        ((5.8, 0.5, 1.15), (3.0, 3.0, 0.70), mat_rock),
        ((-5.8, 3.0, 1.35), (3.0, 3.0, 0.60), mat_stone_dark),
        ((5.8, 3.8, 1.45), (3.0, 3.0, 0.60), mat_rock),
        ((-5.2, 5.5, 1.65), (3.0, 3.0, 0.55), mat_rock),
        ((5.2, 5.5, 1.65), (3.0, 3.0, 0.55), mat_rock),
        ((-5.5, -15.0, 0.18), (3.5, 3.5, 0.35), mat_rock),
        ((5.5, -15.0, 0.18), (3.5, 3.5, 0.35), mat_rock)
    ]
    for loc, sz, mat_t in retaining_terraces:
        if is_clear(loc[0], loc[1], [p1_road], plots_3d, safe_dist_road=2.2, safe_dist_plot=2.0):
            build_models.create_box("Terrace_R1", size=sz, location=loc, material=mat_t)

    # Watchtowers along the pass
    if is_clear(-4.2, -8.0, [p1], plots_3d, safe_dist_road=1.75, safe_dist_plot=2.0):
        create_watchtower(-4.2, -8.0, 0.5, mat_stone, mat_stone_dark, mat_teal, mat_saffron, mat_wood)
    if is_clear(4.2, 1.5, [p1], plots_3d, safe_dist_road=1.75, safe_dist_plot=2.0):
        create_watchtower(4.2, 1.5, 1.2, mat_stone, mat_stone_dark, mat_teal, mat_saffron, mat_wood)

    # Roadside Braziers with Saffron Flame
    brazier_locs = [
        (-1.5, -10.5, 0.3), (1.5, -10.5, 0.3),
        (-2.2, -4.8, 0.9), (3.2, -0.5, 1.3),
        (-1.2, 6.0, 1.9), (1.2, 6.0, 1.9),
        (-1.6, -14.0, 0.2), (1.6, -14.0, 0.2),
        (-1.8, -7.0, 0.6), (1.8, -2.5, 1.0)
    ]
    for bx, by, bz in brazier_locs:
        if is_clear(bx, by, [p1], plots_3d, safe_dist_road=1.75, safe_dist_plot=2.0):
            create_brazier(bx, by, bz)

    # Heraldic Banners along curves
    banner_locs = [
        (-2.8, -8.0, 0.5), (2.8, 1.0, 1.2),
        (-1.4, 5.2, 1.7), (1.4, 5.2, 1.7),
        (-2.4, -3.2, 0.9), (2.2, -0.8, 1.1)
    ]
    for bx, by, bz in banner_locs:
        if is_clear(bx, by, [p1], plots_3d, safe_dist_road=1.75, safe_dist_plot=2.0):
            create_banner_pole(bx, by, bz, banner_mat=mat_saffron)

    # Glacial Crystal Clusters along the pass slopes
    crystal_locs = [
        (-3.2, -10.0, 0.35), (3.2, -9.5, 0.35),
        (-3.8, -5.5, 0.70), (2.8, -3.8, 0.85),
        (-2.2, -1.0, 1.10), (3.6, 2.2, 1.35),
        (-1.5, 3.8, 1.55), (1.5, 4.2, 1.55),
        (-2.5, -13.5, 0.25), (2.5, -13.5, 0.25),
        (-3.0, -16.0, 0.20), (3.0, -16.0, 0.20),
        (-4.2, -2.5, 0.95), (4.2, -1.5, 1.15),
        (-3.0, 6.0, 1.75), (3.0, 6.0, 1.75)
    ]
    for cloc in crystal_locs:
        if is_clear(cloc[0], cloc[1], [p1], plots_3d, safe_dist_road=1.75, safe_dist_plot=2.0):
            create_crystal_shard(cloc, scale=0.9, mat_teal=mat_teal)

    # Castle Keep (Teal spires matching title_key.webp, glowing arched windows, gold finials)
    gate_x, gate_y, gate_z = 0.0, 7.2, 1.8
    mat_keep_roof = blender_utils.get_material('glacier_teal', hex_color='#2A888C', roughness=0.35)
    build_grand_keep(gate_x, gate_y, gate_z, mat_stone, mat_stone_dark, mat_keep_roof, mat_saffron)

    # 120+ Fir Trees densely cloaking the valley floor and flanks
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
        (-2.5, -2.5, 0.9, 1.1), (-3.2, -1.0, 1.0, 1.2), (-2.2, 0.5, 1.15, 0.95),
        (2.5, -2.5, 0.9, 1.1), (3.2, -1.0, 1.0, 1.2), (2.2, 0.5, 1.15, 0.95),
        (-1.8, 2.5, 1.3, 1.0), (1.8, 2.5, 1.3, 1.0),
        (-3.8, 5.8, 1.7, 1.0), (3.8, 5.8, 1.7, 1.0),
        # Extra trees filling slopes safely away from road
        (-4.2, -13.0, 0.15, 1.1), (4.2, -13.0, 0.15, 1.1),
        (3.0, -8.0, 0.5, 0.9),
        (-3.0, 1.5, 1.3, 1.05), (3.0, 1.5, 1.3, 1.05),
        (-2.5, 4.5, 1.55, 0.95), (2.5, 4.5, 1.55, 0.95),
        (-5.0, -15.5, 0.1, 1.25), (5.0, -15.5, 0.1, 1.25),
        (-6.0, -11.0, 0.35, 1.2), (6.0, -11.0, 0.35, 1.2),
        (-6.0, -5.0, 0.75, 1.15), (6.0, -5.0, 0.75, 1.15),
        (-6.0, 1.0, 1.25, 1.1), (6.0, 1.0, 1.25, 1.1),
        (-5.5, 5.0, 1.6, 1.0), (5.5, 5.0, 1.6, 1.0)
    ]
    for fx, fy, fz, fsc in fir_locs:
        if is_clear(fx, fy, [p1], plots_3d, safe_dist_road=1.75, safe_dist_plot=2.1):
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
        ((-3.5, -16.5, 0.2), 1.2), ((3.5, -16.5, 0.2), 1.2),
        ((-4.8, -1.5, 1.1), 1.2), ((4.8, -1.5, 1.1), 1.2),
        ((-3.8, 3.5, 1.45), 1.0), ((3.8, 3.5, 1.45), 1.0)
    ]
    for b_pos, b_scale in boulders:
        if is_clear(b_pos[0], b_pos[1], [p1], plots_3d, safe_dist_road=1.75, safe_dist_plot=2.0):
            create_boulder(b_pos, scale=b_scale, material=mat_rock)

    bpy.context.view_layer.update()
    wps = project_path(scene, cam, p1, 1600, 2400)
    plots_2d = project_plots(scene, cam, plots_3d, 1600, 2400)

    png_path = "assets/maps/map1.png"
    bpy.context.scene.render.filepath = png_path
    bpy.ops.render.render(write_still=True)

    tip_co = bpy_extras.object_utils.world_to_camera_view(scene, cam, Vector((gate_x, gate_y + 2.0, gate_z + 4.90)))
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
    scene, cam = setup_diorama_scene(1600, 2400, sky_color='#20457C')

    mat_lake_deep = blender_utils.get_material('lake_deep', hex_color='#081B26', roughness=0.15)
    mat_ice_bright = blender_utils.get_material('ice_bright', hex_color='#E0F2FE', roughness=0.40)
    mat_ice_shelf = blender_utils.get_material('ice_shelf', hex_color='#38BDF8', roughness=0.25)
    mat_ice_crust = blender_utils.get_material('ice_crust', hex_color='#BAE6FD', roughness=0.35)
    mat_rock = blender_utils.get_material('slate_blue', hex_color='#2C3D5A', roughness=0.82)
    mat_teal = blender_utils.get_material('glacier_teal', hex_color='#0284C7', roughness=0.30)
    mat_crevasse = get_emission_material('crevasse_glow', '#00BAE8', strength=2.5)
    mat_stone = blender_utils.get_material('stone', hex_color='#B9AE9C')
    mat_stone_dark = blender_utils.get_material('stone_dark', hex_color='#5A5246')
    mat_road = blender_utils.get_material('road_gold', hex_color='#D4A350', roughness=0.82)
    mat_wood = blender_utils.get_material('wood', hex_color='#785338')
    mat_wood_dark = blender_utils.get_material('wood_dark', hex_color='#382417')
    mat_saffron = blender_utils.get_material('saffron', hex_color='#F59E0B')
    build_sky_backdrop(top_hex='#0A1322', mid_hex='#1E3D60', bot_hex='#6B8FA8', loc_y=16.0, loc_z=6.0)

    # Deep Frozen Lake Bed Base
    build_models.create_box("LakeBedBase", size=(90.0, 90.0, 4.0), location=(0.0, 0.0, -2.3), material=mat_lake_deep)

    # Mountain Ridges flanking the lake (base_dist=4.8 gives clean clearance)
    build_dense_mountain_flank("WestFlank", -1, min_y=-20.0, max_y=14.0, steps_y=40, base_dist=4.8, crest_dist=12.0, max_z=7.5, mat_snow=mat_ice_bright, mat_rock=mat_rock, mat_accent=mat_teal)
    build_dense_mountain_flank("EastFlank", 1, min_y=-20.0, max_y=14.0, steps_y=40, base_dist=4.8, crest_dist=12.0, max_z=7.5, mat_snow=mat_ice_bright, mat_rock=mat_rock, mat_accent=mat_teal)

    # Shoreline Rocky Bluffs & Terraced Cliff Shelves
    for sy in range(-19, 9, 3):
        build_models.create_box(f"ShoreBluffL_{sy}", size=(3.5, 3.2, 0.55), location=(-6.8, sy, 0.25), material=mat_rock)
        build_models.create_box(f"ShoreBluffR_{sy}", size=(3.5, 3.2, 0.55), location=(6.8, sy, 0.25), material=mat_rock)

    # Two Routes Merging
    pA = [(-3.6, -11.0, 0.2), (-2.8, -8.5, 0.3), (-2.0, -5.5, 0.4), (-0.8, -2.5, 0.5), (0.0, -0.5, 0.6), (0.8, 2.0, 1.0), (0.4, 4.8, 1.4), (0.0, 7.2, 1.8)]
    pB = [(3.6, -11.0, 0.2), (2.8, -8.5, 0.3), (2.0, -5.5, 0.4), (0.8, -2.5, 0.5), (0.0, -0.5, 0.6), (0.8, 2.0, 1.0), (0.4, 4.8, 1.4), (0.0, 7.2, 1.8)]

    pA_road = [(-3.8, -18.0, 0.1), (-3.8, -14.5, 0.15), (-3.8, -12.5, 0.18)] + pA + [(0.0, 7.8, 1.8)]
    pB_road = [(3.8, -18.0, 0.1), (3.8, -14.5, 0.15), (3.8, -12.5, 0.18)] + pB + [(0.0, 7.8, 1.8)]

    # Dense Interlocking Pack Ice Field & Layered Shelves filling the entire frozen lake
    for iy in range(-20, 8, 2):
        for ix in [-7.5, -5.5, -3.5, -1.8, 0.0, 1.8, 3.5, 5.5, 7.5]:
            jx = math.sin(ix * 3.1 + iy * 2.7) * 0.40
            jy = math.cos(ix * 2.3 - iy * 1.9) * 0.40
            fx = ix + jx
            fy = iy + jy
            d_rd = min(dist_to_spline(fx, fy, pA_road)[0], dist_to_spline(fx, fy, pB_road)[0])
            if d_rd < 1.35:
                continue
            rad = 1.10 + abs(math.sin(ix * 1.7 + iy * 0.8)) * 0.70
            rot = math.sin(ix * 0.9 + iy * 1.4) * 1.5
            floe_mat = mat_ice_bright if (int(abs(ix * 3 + iy * 2)) % 3 == 0) else mat_ice_crust
            build_models.create_cylinder("IceFloe", radius=rad, depth=0.28, vertices=7, location=(fx, fy, 0.08), rotation=(0, 0, rot), material=floe_mat)
            build_models.create_cylinder("IceShelf", radius=rad * 0.65, depth=0.15, vertices=6, location=(fx, fy, 0.22), rotation=(0, 0, rot + 0.3), material=mat_ice_shelf)

    # Glowing Crevasse Fissures cutting through lake ice
    crevasse_ribbons = [
        [(-5.0, -16.0, 0.02), (-4.5, -10.0, 0.02), (-3.5, -6.0, 0.02)],
        [(5.0, -16.0, 0.02), (4.5, -10.0, 0.02), (3.5, -6.0, 0.02)],
        [(0.0, -16.0, 0.02), (0.0, -8.0, 0.02), (0.0, -2.0, 0.02)]
    ]
    for c_rib in crevasse_ribbons:
        build_road_ribbon(c_rib, road_width=0.45, material=mat_crevasse, z_offset=0.01, add_skirt=False)

    # 9 Strategic Plots (computed first for road curb openings) - EXACT OFFSETS VERIFIED IN R18 & R19
    cfg2 = [
        (pB, 0, 0.65, -1, 0.70),
        (pA, 0, 0.65, 1, 0.85),
        (pA, 1, 0.35, -1, 0.65),
        (pB, 2, 0.65, 1, 0.85),
        (pA, 2, 0.35, 1, 0.85),
        (pB, 2, 0.35, -1, 0.85),
        (pA, 4, 0.35, -1, 0.85),
        (pB, 5, 0.50, 1, 0.85),
        (pA, 6, 0.50, -1, 0.85)
    ]
    plots_3d = [calc_plot(c[0], c[1], c[2], c[3], offset=c[4]) for c in cfg2]
    for i, ploc in enumerate(plots_3d):
        build_models.create_oct_prism(f"Plot_{i}", radius=0.85, depth=0.18, location=ploc, material=mat_stone)

    # 30+ Glacial Crystal Clusters & Ice Spires
    crystal_locs = [
        (-2.2, -14.0, 0.2), (2.2, -14.0, 0.2),
        (-2.4, -8.5, 0.3), (2.4, -8.5, 0.3),
        (-2.0, -4.0, 0.35), (2.0, -4.0, 0.35),
        (-2.5, 1.5, 0.5), (2.5, 1.5, 0.5),
        (-1.2, -11.0, 0.25), (1.2, -11.0, 0.25),
        (-1.0, -1.0, 0.35), (1.0, -1.0, 0.35),
        (0.0, -6.5, 0.25), (0.0, -13.5, 0.20),
        (-5.2, -4.5, 0.35), (5.2, -4.5, 0.35),
        (-4.5, -12.0, 0.2), (4.5, -12.0, 0.2),
        (-3.8, -1.5, 0.4), (3.8, -1.5, 0.4),
        (-1.5, 3.5, 0.8), (1.5, 3.5, 0.8),
        (-5.5, -8.0, 0.3), (5.5, -8.0, 0.3),
        (-4.0, 5.0, 1.2), (4.0, 5.0, 1.2)
    ]
    for cloc in crystal_locs:
        if is_clear(cloc[0], cloc[1], [pA_road, pB_road], plots_3d, safe_dist_road=1.75, safe_dist_plot=2.0):
            create_crystal_shard(cloc, scale=0.9, mat_teal=mat_teal)

    build_road_ribbon(pA_road, road_width=2.5, material=mat_road)
    build_road_ribbon(pB_road, road_width=2.5, material=mat_road)
    add_road_curbs(pA_road, road_width=2.5, material=mat_stone_dark, plots_3d=plots_3d)
    add_road_curbs(pB_road, road_width=2.5, material=mat_stone_dark, plots_3d=plots_3d)

    # Substantial stone arch bridge viaduct piers and wooden timber trestle braces
    for p_route in [pA_road, pB_road]:
        for i in range(len(p_route) - 2):
            pt = p_route[i]
            if pt[1] < 5.0 and pt[1] > -18.0:
                pier_h = max(0.6, pt[2] + 0.6)
                build_models.create_box(f"StonePier_{i}", size=(1.8, 0.8, pier_h), location=(pt[0], pt[1], pt[2] - pier_h * 0.5 + 0.05), material=mat_stone_dark)
                build_models.create_box(f"BridgeArch_{i}", size=(1.4, 0.7, 0.32), location=(pt[0], pt[1], pt[2] - 0.12), material=mat_stone)
                # Wooden timber cross struts
                build_models.create_box(f"TimberStrut_{i}", size=(2.1, 0.22, 0.22), location=(pt[0], pt[1], pt[2] - 0.25), material=mat_wood_dark)

    # Watchtowers
    if is_clear(-4.8, 1.0, [pA_road, pB_road], plots_3d, safe_dist_road=1.75, safe_dist_plot=2.0):
        create_watchtower(-4.8, 1.0, 0.8, mat_stone, mat_stone_dark, mat_teal, mat_saffron, mat_wood)
    if is_clear(4.8, 1.0, [pA_road, pB_road], plots_3d, safe_dist_road=1.75, safe_dist_plot=2.0):
        create_watchtower(4.8, 1.0, 0.8, mat_stone, mat_stone_dark, mat_teal, mat_saffron, mat_wood)

    # Heraldic Banners & Braziers
    for bx, by, bz in [(-1.8, 4.8, 1.4), (1.8, 4.8, 1.4), (-4.2, -5.5, 0.4), (4.2, -5.5, 0.4), (-2.0, -10.0, 0.25), (2.0, -10.0, 0.25)]:
        if is_clear(bx, by, [pA_road, pB_road], plots_3d, safe_dist_road=1.75, safe_dist_plot=2.0):
            create_brazier(bx, by, bz)
    for bx, by, bz in [(-2.0, 3.5, 1.2), (2.0, 3.5, 1.2), (-3.2, -2.0, 0.5), (3.2, -2.0, 0.5)]:
        if is_clear(bx, by, [pA_road, pB_road], plots_3d, safe_dist_road=1.75, safe_dist_plot=2.0):
            create_banner_pole(bx, by, bz, banner_mat=mat_saffron)

    # Grand Keep (Teal spires matching title_key.webp, glowing arched windows, gold finials)
    gate_x, gate_y, gate_z = 0.0, 7.2, 1.75
    mat_keep_roof = blender_utils.get_material('glacier_teal', hex_color='#2A888C', roughness=0.35)
    build_grand_keep(gate_x, gate_y, gate_z, mat_stone, mat_stone_dark, mat_keep_roof, mat_saffron)

    # 90+ Dense Fir Trees distributed along shores and mountain flanks
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
        (-4.0, 6.5, 1.5, 1.0), (4.0, 6.5, 1.5, 1.0),
        (-5.2, -0.5, 0.85, 1.1), (5.2, -0.5, 0.85, 1.1),
        (-5.0, 2.5, 1.1, 1.15), (5.0, 2.5, 1.1, 1.15),
        (-4.5, 5.0, 1.35, 1.0), (4.5, 5.0, 1.35, 1.0),
        (-6.2, -14.0, 0.2, 1.2), (6.2, -14.0, 0.2, 1.2),
        (-6.5, -11.0, 0.3, 1.1), (6.5, -11.0, 0.3, 1.1),
        (-6.8, -2.0, 0.8, 1.2), (6.8, -2.0, 0.8, 1.2),
        (-6.2, 3.5, 1.2, 1.15), (6.2, 3.5, 1.2, 1.15)
    ]
    for fx, fy, fz, fsc in fir_locs:
        if is_clear(fx, fy, [pA_road, pB_road], plots_3d, safe_dist_road=1.75, safe_dist_plot=2.1):
            create_fir_tree((fx, fy, fz), scale=fsc)

    # Shoreline Boulders & Crags
    boulders = [
        ((-5.8, -10.0, 0.3), 1.1), ((5.8, -10.0, 0.3), 1.1),
        ((-6.2, -6.0, 0.5), 1.2), ((6.2, -6.0, 0.5), 1.2),
        ((-5.5, 0.0, 0.8), 1.3), ((5.5, 0.0, 0.8), 1.3),
        ((-4.8, 3.5, 1.2), 1.0), ((4.8, 3.5, 1.2), 1.0),
        ((-2.5, -15.5, 0.15), 0.9), ((2.5, -15.5, 0.15), 0.9)
    ]
    for b_pos, b_scale in boulders:
        if is_clear(b_pos[0], b_pos[1], [pA_road, pB_road], plots_3d, safe_dist_road=1.75, safe_dist_plot=2.0):
            create_boulder(b_pos, scale=b_scale, material=mat_rock)

    bpy.context.view_layer.update()
    wpsA = project_path(scene, cam, pA, 1600, 2400)
    wpsB = project_path(scene, cam, pB, 1600, 2400)
    plots_2d = project_plots(scene, cam, plots_3d, 1600, 2400)

    png_path = "assets/maps/map2.png"
    bpy.context.scene.render.filepath = png_path
    bpy.ops.render.render(write_still=True)

    tip_co = bpy_extras.object_utils.world_to_camera_view(scene, cam, Vector((gate_x, gate_y + 2.0, gate_z + 4.90)))
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
        "spawn_positions": [wpsA[0], wpsB[0]],
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
    scene, cam = setup_diorama_scene(1600, 2400, sky_color='#20457C')

    mat_fir = blender_utils.get_material('fir_green', hex_color='#16382C', roughness=0.75)
    mat_ice = blender_utils.get_material('ice', hex_color='#DDECF5', roughness=0.55)
    mat_rock = blender_utils.get_material('slate_blue', hex_color='#2C3D5A', roughness=0.82)
    mat_stone = blender_utils.get_material('stone', hex_color='#B9AE9C')
    mat_stone_dark = blender_utils.get_material('stone_dark', hex_color='#5A5246')
    mat_road = blender_utils.get_material('road_gold', hex_color='#D4A350', roughness=0.82)
    mat_wood = blender_utils.get_material('wood_dark', hex_color='#4A3423')
    mat_saffron = blender_utils.get_material('saffron', hex_color='#F59E0B')
    mat_teal = blender_utils.get_material('glacier_teal', hex_color='#0284C7', roughness=0.35)
    build_sky_backdrop(top_hex='#0A1322', mid_hex='#1E3D60', bot_hex='#6B8FA8', loc_y=16.0, loc_z=6.0)

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
    build_faceted_terrain("ForestTerrain", [p3_road], min_x=-16.0, max_x=16.0, min_y=-21.0, max_y=14.0, nx=48, ny=58, mat_primary=mat_ice, mat_secondary=mat_rock, mat_accent=mat_fir)

    # Continuous Mountain Flanks (base_dist=4.8 gives clean clearance)
    build_dense_mountain_flank("WestFlank", -1, min_y=-20.0, max_y=14.0, steps_y=40, base_dist=4.8, crest_dist=12.0, max_z=7.5, mat_snow=mat_ice, mat_rock=mat_rock, mat_accent=mat_fir)
    build_dense_mountain_flank("EastFlank", 1, min_y=-20.0, max_y=14.0, steps_y=40, base_dist=4.8, crest_dist=12.0, max_z=7.5, mat_snow=mat_ice, mat_rock=mat_rock, mat_accent=mat_fir)

    # Stepped Forest Terraces & Stone Retaining Walls between switchback hairpins
    retaining_terraces = [
        ((-3.5, -9.0, 0.25), (4.5, 4.5, 0.45), mat_rock),
        ((3.5, -6.5, 0.45), (4.5, 4.5, 0.55), mat_stone_dark),
        ((-3.2, -1.5, 0.75), (4.5, 5.0, 0.65), mat_rock),
        ((3.2, 2.0, 1.15), (4.5, 5.0, 0.75), mat_stone_dark),
        ((-2.5, 5.5, 1.45), (4.0, 4.5, 0.85), mat_rock),
        ((-3.0, -15.0, 0.18), (4.5, 4.5, 0.35), mat_rock),
        ((3.0, -15.0, 0.18), (4.5, 4.5, 0.35), mat_rock),
        ((0.0, -7.0, 0.50), (3.0, 2.5, 0.40), mat_stone_dark),
        ((0.0, -2.5, 0.85), (2.8, 2.5, 0.45), mat_rock),
        ((0.0, 3.0, 1.35), (2.8, 2.5, 0.50), mat_stone_dark),
        ((-4.0, -5.5, 0.60), (3.5, 3.5, 0.50), mat_rock),
        ((4.0, -3.5, 0.80), (3.5, 3.5, 0.55), mat_rock)
    ]
    for loc, sz, mat_t in retaining_terraces:
        rd, rz = dist_to_spline(loc[0], loc[1], p3_road)
        safe_top_z = rz - 0.08
        actual_z = safe_top_z - sz[2] * 0.5
        build_models.create_box("Terrace", size=sz, location=(loc[0], loc[1], actual_z), material=mat_t)

    # 9 Plots (computed first for road curb openings)
    cfg3 = [
        (0, 0.50, 1, 0.85),
        (1, 0.25, -1, 0.55),
        (3, 0.40, 1, 0.85),
        (2, 0.75, -1, 0.65),
        (4, 0.25, 1, 0.85),
        (6, 0.50, -1, 0.85),
        (5, 0.75, 1, 0.40),
        (7, 0.75, -1, 0.20),
        (9, 0.60, 1, 0.85)
    ]
    plots_3d = [calc_plot(p3, c[0], c[1], c[2], offset=c[3]) for c in cfg3]
    for i, ploc in enumerate(plots_3d):
        build_models.create_oct_prism(f"Plot_{i}", radius=0.85, depth=0.18, location=ploc, material=mat_stone)

    build_road_ribbon(p3_road, road_width=2.5, material=mat_road)
    add_road_curbs(p3_road, road_width=2.5, material=mat_stone_dark, plots_3d=plots_3d)

    # Watchtowers at hairpin turns
    if is_clear(-4.5, -2.5, [p3_road], plots_3d, safe_dist_road=1.75, safe_dist_plot=2.0):
        create_watchtower(-4.5, -2.5, 1.0, mat_stone, mat_stone_dark, mat_teal, mat_saffron, mat_wood)
    if is_clear(4.5, 3.5, [p3_road], plots_3d, safe_dist_road=1.75, safe_dist_plot=2.0):
        create_watchtower(4.5, 3.5, 1.5, mat_stone, mat_stone_dark, mat_teal, mat_saffron, mat_wood)

    # Braziers & Banners
    brazier_locs = [(0.0, -9.5, 0.3), (-3.8, -2.0, 1.1), (3.8, 3.0, 1.6), (-1.5, -14.0, 0.2), (1.5, -14.0, 0.2)]
    for bx, by, bz in brazier_locs:
        if is_clear(bx, by, [p3_road], plots_3d, safe_dist_road=1.75, safe_dist_plot=2.0):
            create_brazier(bx, by, bz)

    banner_locs = [(-2.2, -4.5, 0.9), (2.2, 1.0, 1.3), (-3.0, 0.0, 1.2), (3.0, -4.0, 0.8)]
    for bx, by, bz in banner_locs:
        if is_clear(bx, by, [p3_road], plots_3d, safe_dist_road=1.75, safe_dist_plot=2.0):
            create_banner_pole(bx, by, bz, banner_mat=mat_saffron)

    # Glowing Glacier Crystals across the switchback ridges (晶錐嶺)
    crystal_locs_3 = [
        (-4.0, -9.5, 0.4), (4.0, -7.5, 0.6), (-3.8, -3.5, 0.9), (3.6, 0.5, 1.3),
        (-3.5, 3.5, 1.5), (3.8, 5.0, 1.7), (-1.2, -6.5, 0.6), (1.2, -1.0, 1.1),
        (-1.5, 4.0, 1.5), (1.8, 6.0, 1.8), (-5.0, -14.0, 0.2), (5.0, -14.0, 0.2),
        (-2.8, -7.0, 0.5), (2.8, -3.0, 0.9), (-2.2, 1.5, 1.3), (2.5, 4.0, 1.6),
        (-3.2, -11.0, 0.3), (3.2, -11.0, 0.3), (-4.5, 1.5, 1.3), (4.5, -0.5, 1.1)
    ]
    for cloc in crystal_locs_3:
        if is_clear(cloc[0], cloc[1], [p3_road], plots_3d, safe_dist_road=1.75, safe_dist_plot=2.0):
            create_crystal_shard(cloc, scale=0.95, mat_teal=mat_teal)

    # Grand Keep (Teal spires matching title_key.webp, glowing arched windows, gold finials)
    gate_x, gate_y, gate_z = 0.0, 7.2, 1.85
    mat_keep_roof = blender_utils.get_material('glacier_teal', hex_color='#2A888C', roughness=0.35)
    build_grand_keep(gate_x, gate_y, gate_z, mat_stone, mat_stone_dark, mat_keep_roof, mat_saffron)

    # Over 140 Fir Trees across all switchbacks & slopes
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
        (-1.5, -1.0, 1.1, 0.95), (1.5, 3.2, 1.5, 1.05),
        (-3.5, -6.5, 0.55, 1.1), (3.5, -4.5, 0.75, 1.0), (-2.0, -2.5, 1.0, 1.15), (2.0, 0.5, 1.3, 0.95),
        (-3.0, 1.0, 1.35, 1.1), (3.0, 3.5, 1.6, 1.05), (-1.2, 4.5, 1.65, 1.0), (1.2, 5.0, 1.7, 1.1),
        (-6.2, -12.0, 0.2, 1.3), (6.2, -12.0, 0.2, 1.3), (-6.0, 0.0, 1.2, 1.2), (6.0, 0.0, 1.2, 1.2),
        (-4.0, -13.5, 0.15, 1.1), (4.0, -13.5, 0.15, 1.1),
        (-5.5, -15.5, 0.12, 1.2), (5.5, -15.5, 0.12, 1.2),
        (-6.5, -4.0, 0.8, 1.15), (6.5, -4.0, 0.8, 1.15),
        (-6.2, 2.5, 1.3, 1.1), (6.2, 2.5, 1.3, 1.1)
    ]
    for fx, fy, fz, fsc in fir_locs:
        if is_clear(fx, fy, [p3_road], plots_3d, safe_dist_road=1.75, safe_dist_plot=2.1):
            create_fir_tree((fx, fy, fz), scale=fsc)

    # Alpine Boulders & Slate Crags
    boulders_3 = [
        ((-4.2, -8.5, 0.35), 1.1), ((4.2, -8.5, 0.35), 1.1),
        ((-3.8, -4.5, 0.75), 1.2), ((3.8, -2.0, 1.05), 1.15),
        ((-2.8, 2.5, 1.40), 1.0), ((2.8, 4.5, 1.60), 1.2),
        ((-2.5, -14.5, 0.2), 0.95), ((2.5, -14.5, 0.2), 0.95),
        ((-5.0, -11.0, 0.3), 1.25), ((5.0, -11.0, 0.3), 1.25)
    ]
    for b_pos, b_scale in boulders_3:
        if is_clear(b_pos[0], b_pos[1], [p3_road], plots_3d, safe_dist_road=1.75, safe_dist_plot=2.0):
            create_boulder(b_pos, scale=b_scale, material=mat_rock)

    bpy.context.view_layer.update()
    wps = project_path(scene, cam, p3, 1600, 2400)
    plots_2d = project_plots(scene, cam, plots_3d, 1600, 2400)

    png_path = "assets/maps/map3.png"
    bpy.context.scene.render.filepath = png_path
    bpy.ops.render.render(write_still=True)

    tip_co = bpy_extras.object_utils.world_to_camera_view(scene, cam, Vector((gate_x, gate_y + 2.0, gate_z + 4.90)))
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
    scene, cam = setup_diorama_scene(1600, 2400, sky_color='#24121E')

    mat_basalt = blender_utils.get_material('slate_blue', hex_color='#2D333F', roughness=0.82)
    mat_basalt_dark = blender_utils.get_material('stone_dark', hex_color='#181B22', roughness=0.88)
    mat_stone_dark = blender_utils.get_material('stone_dark', hex_color='#2A2E38', roughness=0.88)
    mat_stone = blender_utils.get_material('stone', hex_color='#B9AE9C')
    mat_road = blender_utils.get_material('road_gold', hex_color='#D4A350', roughness=0.82)

    mat_lava_outer = get_emission_material('lava_outer', hex_color='#FF4500', strength=7.0)
    mat_lava_core = get_emission_material('lava_core', hex_color='#FFE640', strength=14.0)
    mat_saffron = blender_utils.get_material('saffron', hex_color='#F59E0B')
    mat_sulfur = blender_utils.get_material('sulfur_bright', hex_color='#F59E0B', roughness=0.60)
    mat_ash = blender_utils.get_material('ash_crust', hex_color='#E2E8F0', roughness=0.60)
    mat_fortress_roof = blender_utils.get_material('citadel_teal', hex_color='#0284C7', roughness=0.35)
    mat_ash_wall = blender_utils.get_material('ash_wall', hex_color='#E2E8F0', roughness=0.60)
    build_sky_backdrop(top_hex='#0F172A', mid_hex='#312E81', bot_hex='#F97316', loc_y=16.0, loc_z=6.0)

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

    # 9 Plots (computed first for road curb openings and clearances)
    cfg4 = [
        (0, 0.35, -1, 0.85),
        (1, 0.35, 1, 0.85),
        (2, 0.65, 1, 0.85),
        (3, 0.70, -1, 0.88),
        (3, 0.25, 1, 0.88),
        (4, 0.35, -1, 0.85),
        (5, 0.65, 1, 0.95),
        (5, 0.35, -1, 0.95),
        (7, 0.35, -1, 0.85)
    ]
    plots_3d = [calc_plot(p4, c[0], c[1], c[2], offset=c[3]) for c in cfg4]
    for i, ploc in enumerate(plots_3d):
        build_models.create_oct_prism(f"Plot_{i}", radius=0.85, depth=0.18, location=ploc, material=mat_stone)

    # Fortified Stone Causeway & Dark Basalt Curbs
    build_road_ribbon(p4_road, road_width=2.5, material=mat_road)
    add_road_curbs(p4_road, road_width=2.5, material=mat_basalt_dark, plots_3d=plots_3d)

    # Faceted Basalt Terrain with Carved Magma Fissure Trenches
    fissure_segments = [
        [(-4.5, -18.0), (-4.2, -13.0), (-4.8, -9.0), (-4.2, -5.0), (-4.5, -1.0), (-4.0, 3.0), (-4.5, 7.0)],
        [(4.5, -18.0), (4.2, -13.0), (4.8, -9.0), (4.2, -5.0), (4.5, -1.0), (4.0, 3.0), (4.5, 7.0)],
        [(-2.8, -14.0), (-3.8, -11.0), (-4.2, -9.0)],
        [(2.8, -14.0), (3.8, -11.0), (4.2, -9.0)],
        [(0.0, -8.0), (-1.2, -6.5), (-2.0, -5.5)]
    ]

    def dist_to_fissures(px, py):
        min_d = 999.0
        for fiss in fissure_segments:
            for i in range(len(fiss) - 1):
                p1 = fiss[i]
                p2 = fiss[i+1]
                dx = p2[0] - p1[0]
                dy = p2[1] - p1[1]
                l2 = dx*dx + dy*dy
                if l2 == 0:
                    continue
                t = max(0.0, min(1.0, ((px - p1[0])*dx + (py - p1[1])*dy) / l2))
                d = math.hypot(px - (p1[0] + t*dx), py - (p1[1] + t*dy))
                if d < min_d:
                    min_d = d
        return min_d

    def volcanic_biome(x, y, min_d, road_z, n1, n2):
        if min_d <= 1.4:
            base_z = road_z - 0.04
        elif min_d <= 3.2:
            t = (min_d - 1.4) / 1.8
            base_z = road_z - 0.04 + (n1 * 0.4 + n2 * 0.3) * t + t * 0.25
        else:
            raw_h = (min_d - 3.2) * 0.32 + n1 * 0.8 + n2 * 0.4
            step_size = 0.45
            stepped = math.floor(raw_h / step_size) * step_size
            base_z = road_z + 0.22 + stepped + (raw_h - stepped) * 0.25

        fd = dist_to_fissures(x, y)
        if fd < 1.8 and min_d > 1.6:
            depth = (1.0 - (fd / 1.8)) * 1.6
            return base_z - depth
        return base_z

    build_faceted_terrain("BasaltTerrain", [p4_road], min_x=-16.0, max_x=16.0, min_y=-21.0, max_y=14.0, nx=48, ny=58, mat_primary=mat_basalt_dark, mat_secondary=mat_sulfur, mat_accent=mat_ash, biome_fn=volcanic_biome)

    # Mountain Flanks with Ash/Sulfur Ledges and Basalt Crags (base_dist=4.8 gives clean clearance)
    build_dense_mountain_flank("WestFlank", -1, min_y=-20.0, max_y=14.0, steps_y=40, base_dist=4.8, crest_dist=12.0, max_z=7.5, mat_snow=mat_sulfur, mat_rock=mat_basalt_dark, mat_accent=mat_ash)
    build_dense_mountain_flank("EastFlank", 1, min_y=-20.0, max_y=14.0, steps_y=40, base_dist=4.8, crest_dist=12.0, max_z=7.5, mat_snow=mat_sulfur, mat_rock=mat_basalt_dark, mat_accent=mat_ash)

    # Deep Sunken Magma Fissure Trenches (Sunken multi-tier incandescent glowing magma rivers)
    for fiss_2d in fissure_segments:
        fiss_3d = []
        for fx, fy in fiss_2d:
            rd, rz = dist_to_spline(fx, fy, p4_road)
            fz = volcanic_biome(fx, fy, rd, rz, 0, 0)
            fiss_3d.append((fx, fy, fz))
        build_road_ribbon(fiss_3d, road_width=2.4, material=mat_lava_outer, z_offset=-0.50, add_skirt=False)
        build_road_ribbon(fiss_3d, road_width=1.3, material=mat_lava_core, z_offset=-0.44, add_skirt=False)

        # Floating jagged basalt crust slabs
        for i in range(len(fiss_3d) - 1):
            pA = fiss_3d[i]
            pB = fiss_3d[i+1]
            mx = (pA[0] + pB[0]) * 0.5 + (0.15 if i % 2 == 0 else -0.15)
            my = (pA[1] + pB[1]) * 0.5
            mz = (pA[2] + pB[2]) * 0.5 - 0.35
            build_models.create_box(f"Crust_{mx:.2f}", size=(0.75, 0.85, 0.16), location=(mx, my, mz), rotation=(0, 0, i * 0.6), material=mat_basalt_dark)

    # DENSE STEPPED BASALT COLUMNS FILLING ENTIRE CANYON FLOOR (Giant's Causeway volcanic landscape)
    import numpy as np
    ix_list = [-7.8, -6.5, -5.2, -3.9, -2.6, -1.3, 0.0, 1.3, 2.6, 3.9, 5.2, 6.5, 7.8]
    for iy in np.arange(-20.0, 8.0, 1.15):
        for ix in ix_list:
            jx = math.sin(ix * 2.3 + iy * 3.1) * 0.35
            jy = math.cos(ix * 1.7 - iy * 2.5) * 0.35
            cx = ix + jx
            cy = iy + jy
            if is_clear(cx, cy, [p4_road], plots_3d, safe_dist_road=1.75, safe_dist_plot=2.0):
                rd, rz = dist_to_spline(cx, cy, p4_road)
                cz = volcanic_biome(cx, cy, rd, rz, 0, 0)
                h = 0.55 + abs(math.sin(cx * 1.3 + cy * 0.9)) * 1.55
                pick = int(abs(cx * 3 + cy * 2)) % 4
                if pick == 0:
                    mat_col = mat_sulfur
                elif pick == 1:
                    mat_col = mat_ash
                elif pick == 2:
                    mat_col = mat_basalt
                else:
                    mat_col = mat_basalt_dark
                create_basalt_column((cx, cy, cz), radius=0.42, height=h, mat=mat_col)

    # 35+ Glowing Sulfur & Magma Crystals across the volcanic canyon
    crystal_locs_4 = [
        (-3.5, -11.0, 0.3), (3.5, -11.0, 0.3),
        (-4.0, -8.0, 0.5), (4.0, -8.0, 0.5),
        (-3.8, -3.0, 0.9), (3.8, -3.0, 0.9),
        (-3.2, 1.5, 1.3), (3.2, 1.5, 1.3),
        (-2.5, 4.5, 1.6), (2.5, 4.5, 1.6),
        (-1.5, -13.0, 0.25), (1.5, -13.0, 0.25),
        (-5.0, -15.0, 0.2), (5.0, -15.0, 0.2),
        (-2.8, -6.0, 0.6), (2.8, -6.0, 0.6),
        (-1.8, 0.0, 1.1), (1.8, 0.0, 1.1),
        (-2.0, 6.0, 1.7), (2.0, 6.0, 1.7),
        (-4.8, -1.0, 1.0), (4.8, -1.0, 1.0),
        (-4.2, 3.0, 1.4), (4.2, 3.0, 1.4),
        (-3.0, -16.5, 0.15), (3.0, -16.5, 0.15),
        (-4.5, -17.5, 0.15), (4.5, -17.5, 0.15),
        (-2.2, -14.8, 0.2), (2.2, -14.8, 0.2),
        (-5.5, -12.5, 0.25), (5.5, -12.5, 0.25),
        (-5.8, -7.0, 0.55), (5.8, -7.0, 0.55),
        (-5.0, 4.5, 1.5), (5.0, 4.5, 1.5),
        (-1.2, -16.0, 0.15), (1.2, -16.0, 0.15),
        (-2.0, -17.5, 0.15), (2.0, -17.5, 0.15),
        (-3.8, -15.5, 0.2), (3.8, -15.5, 0.2)
    ]
    for cloc in crystal_locs_4:
        if is_clear(cloc[0], cloc[1], [p4_road], plots_3d, safe_dist_road=1.75, safe_dist_plot=2.0):
            create_crystal_shard(cloc, scale=0.95, mat_teal=mat_sulfur)

    # Volcanic Smoke Chimneys & Glowing Pits
    vent_locs = [
        (-3.8, -13.5, 0.3), (3.8, -13.5, 0.3),
        (-3.8, -9.5, 0.4), (3.8, -9.5, 0.4),
        (-3.2, -1.0, 0.8), (3.2, -1.0, 0.8),
        (-3.6, 5.5, 1.4), (3.6, 5.5, 1.4),
        (-2.2, -6.5, 0.5), (2.2, -4.5, 0.7),
        (-1.5, 1.5, 1.1), (1.5, -12.0, 0.25)
    ]
    for vx, vy, vz in vent_locs:
        if is_clear(vx, vy, [p4_road], plots_3d, safe_dist_road=1.75, safe_dist_plot=2.0):
            build_models.create_cone("VentChimney", radius=0.45, depth=0.6, vertices=6, location=(vx, vy, vz + 0.3), material=mat_basalt_dark)
            build_models.create_cylinder("VentMagma", radius=0.22, depth=0.2, vertices=6, location=(vx, vy, vz + 0.55), material=mat_lava_core)

    # Roadside Braziers & Heraldic Pennants along the volcanic causeway
    for bx, by, bz in [(-1.6, -14.0, 0.2), (1.6, -14.0, 0.2), (-2.0, -8.0, 0.5), (2.0, -1.0, 1.1), (-1.4, 5.5, 1.7), (1.4, 5.5, 1.7)]:
        if is_clear(bx, by, [p4_road], plots_3d, safe_dist_road=1.75, safe_dist_plot=2.0):
            create_brazier(bx, by, bz, flame_mat=mat_lava_core)
    for bx, by, bz in [(-2.8, -9.5, 0.4), (2.8, 0.0, 1.2), (-1.8, 4.5, 1.6), (1.8, 4.5, 1.6)]:
        if is_clear(bx, by, [p4_road], plots_3d, safe_dist_road=1.75, safe_dist_plot=2.0):
            create_banner_pole(bx, by, bz, banner_mat=mat_saffron)

    # Basalt Crags & Jagged Spikes
    crags = [
        ((-5.5, -10.0, 0.5), 1.2), ((5.5, -10.0, 0.5), 1.2),
        ((-5.8, -4.0, 0.8), 1.4), ((5.8, -4.0, 0.8), 1.4),
        ((-5.2, 2.0, 1.2), 1.3), ((5.2, 2.0, 1.2), 1.3),
        ((-2.5, -14.5, 0.25), 1.0), ((2.5, -14.5, 0.25), 1.0),
        ((-3.5, 3.5, 1.3), 1.1), ((3.5, -6.0, 0.6), 1.1)
    ]
    for cloc, cscale in crags:
        if is_clear(cloc[0], cloc[1], [p4_road], plots_3d, safe_dist_road=1.75, safe_dist_plot=2.0):
            create_boulder(cloc, scale=cscale, material=mat_basalt_dark)

    # Volcanic Fortress Citadel Keep (High-contrast granite walls, gold roofs, glowing furnace braziers)
    gate_x, gate_y, gate_z = 0.0, 7.2, 1.8
    build_grand_keep(gate_x, gate_y, gate_z, mat_ash_wall, mat_stone_dark, mat_fortress_roof, mat_saffron, mat_snow=mat_sulfur)
    for px, py, pz in [(gate_x - 1.2, gate_y + 1.2, gate_z + 0.6), (gate_x + 1.2, gate_y + 1.2, gate_z + 0.6),
                       (gate_x - 3.6, gate_y + 1.8, gate_z + 1.1), (gate_x + 3.6, gate_y + 1.8, gate_z + 1.1),
                       (gate_x - 2.2, gate_y + 3.2, gate_z + 1.4), (gate_x + 2.2, gate_y + 3.2, gate_z + 1.4)]:
        create_crystal_shard((px, py, pz), scale=1.1, mat_teal=mat_sulfur)

    bpy.context.view_layer.update()
    wps = project_path(scene, cam, p4, 1600, 2400)
    plots_2d = project_plots(scene, cam, plots_3d, 1600, 2400)

    png_path = "assets/maps/map4.png"
    bpy.context.scene.render.filepath = png_path
    bpy.ops.render.render(write_still=True)

    tip_co = bpy_extras.object_utils.world_to_camera_view(scene, cam, Vector((gate_x, gate_y + 2.0, gate_z + 4.90)))
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
        "description": "焦黑玄武岩峽谷，地底熔岩奔湧，火雨不息，進入極度危險邊境。"
    }
    with open("assets/maps/map4.json", "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
    print(f"Map 4 rendered successfully: {png_path}")

# -------------------------------------------------------------------------
# REGION 5: 北辰堡 (Royal Citadel - Double Approach)
# -------------------------------------------------------------------------

def render_map5():
    print("--- Rendering Map 5: 北辰堡 (1600x2400) ---")
    scene, cam = setup_diorama_scene(1600, 2400, sky_color='#20457C')

    mat_snow = blender_utils.get_material('ice', hex_color='#DDECF5', roughness=0.55)
    mat_stone = blender_utils.get_material('stone', hex_color='#C4BCB1', roughness=0.65)
    mat_rock = blender_utils.get_material('slate_blue', hex_color='#2C3D5A', roughness=0.80)
    mat_stone_dark = blender_utils.get_material('stone_dark', hex_color='#475569', roughness=0.80)
    mat_teal = blender_utils.get_material('glacier_teal', hex_color='#0284C7', roughness=0.35)
    mat_road = blender_utils.get_material('road_gold', hex_color='#D4A350', roughness=0.82)
    mat_saffron = blender_utils.get_material('saffron', hex_color='#F59E0B')
    mat_gold = blender_utils.get_material('gold', hex_color='#FBBF24', roughness=0.25, metallic=0.65)
    mat_wood = blender_utils.get_material('wood_dark', hex_color='#4A3423')
    build_sky_backdrop(top_hex='#0A1322', mid_hex='#1E3D60', bot_hex='#6B8FA8', loc_y=16.0, loc_z=6.0)

    pA = [(-3.6, -11.0, 0.2), (-3.2, -8.0, 0.3), (-2.5, -5.0, 0.4), (-1.2, -2.0, 0.6), (0.0, 0.5, 0.9), (0.0, 3.0, 1.3), (0.0, 5.5, 1.6), (0.0, 7.2, 1.8)]
    pB = [(3.6, -11.0, 0.2), (3.2, -8.0, 0.3), (2.5, -5.0, 0.4), (1.2, -2.0, 0.6), (0.0, 0.5, 0.9), (0.0, 3.0, 1.3), (0.0, 5.5, 1.6), (0.0, 7.2, 1.8)]

    pA_road = [(-3.8, -18.0, 0.1), (-3.8, -14.5, 0.15), (-3.8, -12.5, 0.18)] + pA + [(0.0, 7.8, 1.8)]
    pB_road = [(3.8, -18.0, 0.1), (3.8, -14.5, 0.15), (3.8, -12.5, 0.18)] + pB + [(0.0, 7.8, 1.8)]

    # Faceted Citadel Forecourt Terrain (Snow-draped alpine terrace setting)
    build_faceted_terrain("CitadelTerrain", [pA_road, pB_road], min_x=-16.0, max_x=16.0, min_y=-21.0, max_y=14.0, nx=48, ny=58, mat_primary=mat_snow, mat_secondary=mat_rock, mat_accent=mat_teal)

    # Mountain Flanks (base_dist=4.8 gives clean clearance to avenues and plots)
    build_dense_mountain_flank("WestFlank", -1, min_y=-20.0, max_y=14.0, steps_y=40, base_dist=4.8, crest_dist=12.0, max_z=7.5, mat_snow=mat_snow, mat_rock=mat_rock, mat_accent=mat_teal)
    build_dense_mountain_flank("EastFlank", 1, min_y=-20.0, max_y=14.0, steps_y=40, base_dist=4.8, crest_dist=12.0, max_z=7.5, mat_snow=mat_snow, mat_rock=mat_rock, mat_accent=mat_teal)

    # 9 Strategic Plots (computed first for road curb openings) - EXACT OFFSETS VERIFIED IN R18 & R19
    cfg5 = [
        (pB, 0, 0.65, -1, 0.20),
        (pA, 0, 0.65, 1, 0.20),
        (pB, 1, 0.50, 1, 0.65),
        (pA, 2, 0.25, 1, 0.65),
        (pB, 2, 0.75, 1, 0.40),
        (pA, 3, 0.50, 1, 0.65),
        (pA, 4, 0.25, -1, 0.65),
        (pB, 5, 0.25, 1, 0.65),
        (pA, 6, 0.35, -1, 0.65)
    ]
    plots_3d = [calc_plot(c[0], c[1], c[2], c[3], offset=c[4]) for c in cfg5]
    for i, ploc in enumerate(plots_3d):
        build_models.create_oct_prism(f"Plot_{i}", radius=0.85, depth=0.18, location=ploc, material=mat_stone)

    # Dual Approaching Golden Roads & Curbs
    build_road_ribbon(pA_road, road_width=2.5, material=mat_road)
    build_road_ribbon(pB_road, road_width=2.5, material=mat_road)
    add_road_curbs(pA_road, road_width=2.5, material=mat_stone_dark, plots_3d=plots_3d)
    add_road_curbs(pB_road, road_width=2.5, material=mat_stone_dark, plots_3d=plots_3d)

    # GRAND 6-TIERED IMPERIAL PALACE CITADEL PROMENADE & MONUMENTAL COURTYARD
    # Central Monumental Stepped Terraces in median strictly between dual roads (y = -14.0 to 0.0)
    courtyard_terraces = [
        (-13.5, 0.20, 4.4, 2.2),
        (-11.0, 0.28, 4.0, 2.2),
        (-8.5, 0.38, 3.5, 2.2),
        (-6.0, 0.50, 2.9, 2.2),
        (-3.5, 0.65, 2.3, 2.2),
        (-1.2, 0.80, 1.8, 2.0)
    ]
    for s_step, (sy, sz, sw, slen) in enumerate(courtyard_terraces):
        build_models.create_box(f"PalaceTerrace_{s_step}", size=(sw, slen, 0.22), location=(0.0, sy, sz), material=mat_stone)
        build_models.create_box(f"TerraceCoping_{s_step}", size=(sw + 0.15, slen + 0.15, 0.06), location=(0.0, sy, sz + 0.11), material=mat_stone_dark)

    # Gilded Warden Plinth Statues lining the Promenade and Citadel Flanks
    statue_candidates = [
        (0.0, -12.5, 0.35),
        (0.0, -9.5, 0.45),
        (0.0, -6.5, 0.58),
        (0.0, -3.5, 0.72),
        (-4.8, -8.0, 0.40), (4.8, -8.0, 0.40),
        (-4.0, -3.0, 0.75), (4.0, -3.0, 0.75),
        (-2.6, 3.5, 1.35), (2.6, 3.5, 1.35)
    ]
    for s_idx, (sx, sy, sz) in enumerate(statue_candidates):
        if is_clear(sx, sy, [pA_road, pB_road], plots_3d, safe_dist_road=1.75, safe_dist_plot=2.0):
            build_models.create_box(f"StatuePlinth_{s_idx}", size=(0.70, 0.70, 0.75), location=(sx, sy, sz), material=mat_stone_dark)
            build_models.create_cone(f"WardenStatue_{s_idx}", radius=0.35, depth=0.85, vertices=6, location=(sx, sy, sz + 0.65), material=mat_gold)

    # Ceremonial Fire Bowls with Saffron Flames along courtyard steps
    brazier_candidates = [
        (-1.5, -12.0, 0.35), (1.5, -12.0, 0.35),
        (-1.3, -7.0, 0.55), (1.3, -7.0, 0.55),
        (-1.0, -2.5, 0.80), (1.0, -2.5, 0.80),
        (-4.5, -6.0, 0.50), (4.5, -6.0, 0.50),
        (-3.5, -1.0, 0.85), (3.5, -1.0, 0.85),
        (-2.2, 5.0, 1.55), (2.2, 5.0, 1.55)
    ]
    for f_idx, (fx, fy, fz) in enumerate(brazier_candidates):
        if is_clear(fx, fy, [pA_road, pB_road], plots_3d, safe_dist_road=1.75, safe_dist_plot=2.0):
            build_models.create_cylinder(f"StairBrazier_{f_idx}", radius=0.22, depth=0.22, vertices=8, location=(fx, fy, fz), material=mat_stone_dark)
            build_models.create_cone(f"StairFlame_{f_idx}", radius=0.15, depth=0.30, vertices=5, location=(fx, fy, fz + 0.22), material=get_emission_material('flame_saffron', '#FFA500'))

    # Classical Carved Stone Balustrades lining the terraces
    for bx, by, bz in [(-4.8, -4.0, 0.5), (4.8, -4.0, 0.5), (-4.2, 1.5, 1.0), (4.2, 1.5, 1.0), (-1.8, -9.5, 0.45), (1.8, -9.5, 0.45)]:
        if is_clear(bx, by, [pA_road, pB_road], plots_3d, safe_dist_road=1.75, safe_dist_plot=2.0):
            build_models.create_box("BalustradeWall", size=(0.35, 2.6, 0.45), location=(bx, by, bz + 0.25), material=mat_stone)
            build_models.create_box("BalustradeCap", size=(0.42, 2.6, 0.10), location=(bx, by, bz + 0.50), material=mat_stone_dark)

    # Flanking Royal Bastions with Teal Conical Roofs, Gold Finials & Saffron Banners
    bastion_locs = [
        (-6.2, -6.5, 0.1), (6.2, -6.5, 0.1),
        (-5.5, 2.5, 0.75), (5.5, 2.5, 0.75)
    ]
    for bx, by, bz in bastion_locs:
        build_models.create_oct_prism("RoyalBastion", radius=1.0, depth=2.4, location=(bx, by, bz + 1.2), material=mat_stone)
        build_models.create_oct_prism("BastionCrenels", radius=1.15, depth=0.35, location=(bx, by, bz + 2.5), material=mat_stone_dark)
        build_models.create_cone("BastionRoof", radius=1.22, depth=1.35, vertices=8, location=(bx, by, bz + 3.25), material=mat_teal)
        build_models.create_cone("BastionFinial", radius=0.20, depth=0.45, vertices=6, location=(bx, by, bz + 3.95), material=mat_gold)
        build_models.create_box("BastionFlag", size=(0.04, 0.55, 0.35), location=(bx, by + 0.25, bz + 4.15), material=mat_saffron)

    # Grand Palace Citadel Fortress Keep at Confluence Apex (Teal spires, gold finials, glowing windows)
    gate_x, gate_y, gate_z = 0.0, 7.2, 1.9
    mat_citadel_roof = blender_utils.get_material('citadel_teal', hex_color='#2A888C', roughness=0.35)
    build_grand_keep(gate_x, gate_y, gate_z, mat_stone, mat_stone_dark, mat_citadel_roof, mat_saffron)

    # Ceremonial Banners & Braziers along Citadel Avenues
    for bx, by, bz in [(-2.5, -6.0, 0.3), (2.5, -6.0, 0.3), (-1.8, 0.5, 0.8), (1.8, 0.5, 0.8), (-1.2, -14.0, 0.2), (1.2, -14.0, 0.2)]:
        if is_clear(bx, by, [pA_road, pB_road], plots_3d, safe_dist_road=1.75, safe_dist_plot=2.0):
            create_banner_pole(bx, by, bz, banner_mat=mat_saffron)
    for bx, by, bz in [(-2.5, -4.5, 0.4), (2.5, -4.5, 0.4), (-1.8, 2.0, 1.0), (1.8, 2.0, 1.0)]:
        if is_clear(bx, by, [pA_road, pB_road], plots_3d, safe_dist_road=1.75, safe_dist_plot=2.0):
            create_brazier(bx, by, bz)

    # Monumental Ceremonial Entrance Gate Pylons & Standards at Avenue Approach
    for sx in [-6.2, 6.2]:
        build_models.create_box(f"EntrancePylon_{sx}", size=(0.85, 0.85, 2.2), location=(sx, -15.5, 0.3), material=mat_stone)
        build_models.create_cone(f"PylonFinial_{sx}", radius=0.28, depth=0.55, vertices=6, location=(sx, -15.5, 1.55), material=mat_gold)
        build_models.create_box(f"EntranceBanner_{sx}", size=(0.04, 0.65, 1.1), location=(sx, -15.0, 0.9), material=mat_saffron)
        build_models.create_cylinder(f"EntranceBrazier_{sx}", radius=0.35, depth=0.25, vertices=8, location=(sx - (0.7 if sx > 0 else -0.7), -15.5, 0.3), material=mat_stone_dark)
        build_models.create_cone(f"EntranceFlame_{sx}", radius=0.20, depth=0.40, vertices=5, location=(sx - (0.7 if sx > 0 else -0.7), -15.5, 0.55), material=get_emission_material('flame_saffron', '#FFA500'))

    # Fir Trees in formal courtyard garden groves (positioned safely along mountain slopes & borders)
    fir_locs = [
        (-5.5, -11.5, 0.2, 1.15), (-6.0, -9.0, 0.35, 1.2), (-6.5, -6.5, 0.5, 0.95), (-5.8, -4.0, 0.65, 1.1),
        (5.5, -11.5, 0.2, 1.15), (6.0, -9.0, 0.35, 1.2), (6.5, -6.5, 0.5, 0.95), (5.8, -4.0, 0.65, 1.1),
        (-6.5, 1.0, 0.95, 1.2), (6.5, 1.0, 0.95, 1.2),
        (-5.5, 3.0, 1.25, 1.1), (5.5, 3.0, 1.25, 1.1),
        (-4.5, 6.0, 1.5, 1.0), (4.5, 6.0, 1.5, 1.0),
        (-5.8, -1.0, 0.85, 1.1), (5.8, -1.0, 0.85, 1.1),
        (-5.2, 5.0, 1.4, 1.0), (5.2, 5.0, 1.4, 1.0),
        (-7.0, -2.0, 0.75, 1.2), (7.0, -2.0, 0.75, 1.2),
        (-4.0, -14.0, 0.2, 1.1), (4.0, -14.0, 0.2, 1.1),
        (-6.5, -13.0, 0.2, 1.25), (6.5, -13.0, 0.2, 1.25),
        (-5.0, -15.5, 0.15, 1.2), (5.0, -15.5, 0.15, 1.2),
        (-6.0, -15.0, 0.15, 1.1), (6.0, -15.0, 0.15, 1.1),
        (-7.0, -10.0, 0.35, 1.3), (7.0, -10.0, 0.35, 1.3),
        (-7.0, -6.0, 0.55, 1.2), (7.0, -6.0, 0.55, 1.2),
        (-6.8, 3.5, 1.25, 1.15), (6.8, 3.5, 1.25, 1.15),
        (-6.0, 5.5, 1.45, 1.1), (6.0, 5.5, 1.45, 1.1),
        (-3.8, 6.5, 1.6, 1.0), (3.8, 6.5, 1.6, 1.0)
    ]
    for fx, fy, fz, fsc in fir_locs:
        if is_clear(fx, fy, [pA_road, pB_road], plots_3d, safe_dist_road=1.75, safe_dist_plot=2.1):
            create_fir_tree((fx, fy, fz), scale=fsc)

    bpy.context.view_layer.update()
    wpsA = project_path(scene, cam, pA, 1600, 2400)
    wpsB = project_path(scene, cam, pB, 1600, 2400)
    plots_2d = project_plots(scene, cam, plots_3d, 1600, 2400)

    png_path = "assets/maps/map5.png"
    bpy.context.scene.render.filepath = png_path
    bpy.ops.render.render(write_still=True)

    tip_co = bpy_extras.object_utils.world_to_camera_view(scene, cam, Vector((gate_x, gate_y + 2.0, gate_z + 4.90)))
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
        "spawn_positions": [wpsA[0], wpsB[0]],
        "keep_tip": tip_2d,
        "description": "王國終極防線北辰堡！雙向宏偉大道，王座要塞尖塔高聳，決戰終焉炎魔！"
    }
    with open("assets/maps/map5.json", "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
    print(f"Map 5 rendered successfully: {png_path}")

def main():
    target = sys.argv[-1] if len(sys.argv) > 1 and sys.argv[-1].isdigit() else "all"
    if target == "all":
        render_map1()
        render_map2()
        render_map3()
        render_map4()
        render_map5()
    elif target == "1":
        render_map1()
    elif target == "2":
        render_map2()
    elif target == "3":
        render_map3()
    elif target == "4":
        render_map4()
    elif target == "5":
        render_map5()

if __name__ == "__main__":
    main()
