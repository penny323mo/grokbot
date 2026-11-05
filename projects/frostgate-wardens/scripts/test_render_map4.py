import sys
import os
import math
import bpy
import bpy_extras
from mathutils import Vector

sys.path.append('scripts')
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

def get_emission_material(name, hex_color, strength=8.0):
    if name in bpy.data.materials:
        return bpy.data.materials[name]
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    col = blender_utils.hex_to_linear_rgb(hex_color)
    if bsdf:
        bsdf.inputs['Base Color'].default_value = col
        bsdf.inputs['Roughness'].default_value = 0.2
        if 'Emission Color' in bsdf.inputs:
            bsdf.inputs['Emission Color'].default_value = col
            bsdf.inputs['Emission Strength'].default_value = strength
        elif 'Emission' in bsdf.inputs:
            bsdf.inputs['Emission'].default_value = col
    return mat

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
        steps = max(2, int(l / 1.4))
        for s in range(steps):
            t = (s + 0.5) / steps
            mx = pA[0] + dx * t
            my = pA[1] + dy * t
            mz = pA[2] + (pB[2] - pA[2]) * t + 0.22
            for side in [-1, 1]:
                cx = mx + nx * (road_width * 0.5 + 0.16) * side
                cy = my + ny * (road_width * 0.5 + 0.16) * side
                build_models.create_box("CurbStone", size=(0.35, 0.45, 0.24), location=(cx, cy, mz), rotation=(0, 0, math.atan2(dy, dx)), material=material)

def build_dense_mountain_flank(name, flank_sign, min_y=-20.0, max_y=14.0, steps_y=34, base_dist=3.8, crest_dist=12.0, max_z=7.5, mat_snow=None, mat_rock=None, mat_accent=None):
    mesh = bpy.data.meshes.new(name + "Mesh")
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

        # Taper base slightly in the deep foreground
        b_dist = base_dist
        if y < -11.0:
            b_dist += (abs(y) - 11.0) * 0.15

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

        for poly in mesh.polygons:
            nz = abs(poly.normal.z)
            if nz > 0.45:
                poly.material_index = 0
            elif nz > 0.20 and mat_accent:
                poly.material_index = 2
            else:
                poly.material_index = 1
    return obj

def render_test_map4():
    print("--- Test Rendering Map 4 at 1600x2400 ---")
    scene = blender_utils.reset_scene()
    scene.render.resolution_x = 1600
    scene.render.resolution_y = 2400
    scene.render.film_transparent = False

    if hasattr(scene, "eevee") and hasattr(scene.eevee, "use_gtao"):
        scene.eevee.use_gtao = True
        scene.eevee.gtao_distance = 3.5
        scene.eevee.gtao_factor = 2.0

    # Warm volcanic dusk sky (rich terracotta/crimson atmosphere, NOT pitch black!)
    world = bpy.data.worlds.new("SkyWorld")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get('Background')
    bg.inputs['Color'].default_value = blender_utils.hex_to_linear_rgb('#522C32')
    bg.inputs['Strength'].default_value = 1.0

    # Key light: warm golden-amber sunlight
    sun_data = bpy.data.lights.new(name="SunKey", type='SUN')
    sun_data.energy = 5.5
    sun_data.color = blender_utils.hex_to_linear_rgb('#FFE2B5')[:3]
    sun_obj = bpy.data.objects.new(name="SunKey", object_data=sun_data)
    sun_obj.rotation_euler = (math.radians(52), math.radians(18), math.radians(-32))
    scene.collection.objects.link(sun_obj)

    # Fill light: deep volcanic crimson/indigo shadow fill
    fill_data = bpy.data.lights.new(name="SunFill", type='SUN')
    fill_data.energy = 2.4
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

    # Rich volcanic materials (warm charcoal, slate, basalt)
    mat_basalt = blender_utils.get_material('slate_blue', hex_color='#383D48', roughness=0.78)
    mat_basalt_dark = blender_utils.get_material('stone_dark', hex_color='#242832', roughness=0.85)
    mat_stone_dark = blender_utils.get_material('stone_dark', hex_color='#2A2E38', roughness=0.88)
    mat_road = blender_utils.get_material('road_gold', hex_color='#D4A855', roughness=0.85)

    # VIVID GLOWING MAGMA MATERIALS
    mat_lava_outer = get_emission_material('lava_outer', hex_color='#FF3A00', strength=8.0)
    mat_lava_core = get_emission_material('lava_core', hex_color='#FFDD33', strength=14.0)
    mat_sky = blender_utils.get_material('volcano_sky', hex_color='#522C32', emission='#522C32')

    build_models.create_box("SkyBackdrop", size=(100.0, 2.0, 50.0), location=(0.0, 16.0, 6.0), material=mat_sky)
    build_models.create_box("BasaltFloor", size=(90.0, 90.0, 4.0), location=(0.0, 0.0, -2.0), material=mat_basalt)

    # Flanks extending all the way down to Y = -20.0 (completely filling the frame!)
    build_dense_mountain_flank("WestFlank", -1, min_y=-20.0, max_y=14.0, steps_y=34, base_dist=3.8, crest_dist=12.0, max_z=7.5, mat_snow=mat_basalt_dark, mat_rock=mat_basalt, mat_accent=mat_lava_outer)
    build_dense_mountain_flank("EastFlank", 1, min_y=-20.0, max_y=14.0, steps_y=34, base_dist=3.8, crest_dist=12.0, max_z=7.5, mat_snow=mat_basalt_dark, mat_rock=mat_basalt, mat_accent=mat_lava_outer)

    # ORGANIC GLOWING LAVA RIVERS (ELEVATED SO THEY ARE 100% VISIBLE!)
    lava_west = [
        (-4.6, -18.0, 0.25),
        (-4.5, -14.0, 0.30),
        (-4.6, -10.0, 0.40),
        (-4.2, -6.0, 0.55),
        (-3.8, -2.0, 0.75),
        (-4.2, 2.0, 0.95),
        (-4.6, 6.0, 1.25),
        (-4.8, 10.0, 1.55)
    ]
    lava_east = [
        (4.6, -18.0, 0.25),
        (4.5, -14.0, 0.30),
        (4.6, -10.0, 0.40),
        (4.2, -6.0, 0.55),
        (3.8, -2.0, 0.75),
        (4.2, 2.0, 0.95),
        (4.6, 6.0, 1.25),
        (4.8, 10.0, 1.55)
    ]
    for l_path in [lava_west, lava_east]:
        build_road_ribbon(l_path, road_width=1.6, material=mat_lava_outer, z_offset=0.20)
        build_road_ribbon(l_path, road_width=0.8, material=mat_lava_core, z_offset=0.26)
        add_road_curbs(l_path, road_width=1.6, material=mat_basalt_dark)

    # Road Spline (with bottom lead-in extending all the way down to Y = -18.0!)
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
    p4_road = [(0.0, -18.0, 0.1), (0.0, -14.5, 0.15), (0.0, -12.5, 0.18)] + p4
    build_road_ribbon(p4_road, road_width=2.5, material=mat_road)
    add_road_curbs(p4_road, road_width=2.5, material=mat_basalt_dark)

    # Stepped Basalt Terraces OUTSIDE the lava rivers (at |X| >= 6.2)
    outer_terraces = [
        ((-6.5, -14.5, 0.3), (3.5, 4.5, 0.6)),
        ((6.5, -14.5, 0.3), (3.5, 4.5, 0.6)),
        ((-6.8, -7.5, 0.5), (3.5, 5.0, 0.8)),
        ((6.8, -7.5, 0.5), (3.5, 5.0, 0.8)),
        ((-6.5, 1.0, 0.8), (3.5, 5.5, 1.0)),
        ((6.5, 1.0, 0.8), (3.5, 5.5, 1.0)),
        ((-6.2, 7.5, 1.2), (3.5, 5.0, 1.2)),
        ((6.2, 7.5, 1.2), (3.5, 5.0, 1.2))
    ]
    for loc, sz in outer_terraces:
        build_models.create_box("BasaltTerrace", size=sz, location=loc, material=mat_basalt_dark)

    # Volcanic Smoke Vents with Glowing Magma Pits
    vent_locs = [
        (-3.8, -13.5, 0.3), (3.8, -13.5, 0.3),
        (-3.8, -9.5, 0.4), (3.8, -9.5, 0.4),
        (-3.2, -1.0, 0.8), (3.2, -1.0, 0.8),
        (-3.6, 5.5, 1.4), (3.6, 5.5, 1.4)
    ]
    for vx, vy, vz in vent_locs:
        build_models.create_cone("VentChimney", radius=0.45, depth=0.6, vertices=6, location=(vx, vy, vz + 0.3), material=mat_basalt_dark)
        build_models.create_cylinder("VentMagma", radius=0.22, depth=0.2, vertices=6, location=(vx, vy, vz + 0.55), material=mat_lava_core)

    # Volcanic Fortress Keep
    gate_x, gate_y, gate_z = 0.0, 7.2, 1.8
    # Flanking Gate Towers with glowing magma spires
    for tx in [gate_x - 1.8, gate_x + 1.8]:
        build_models.create_oct_prism("GateTower", radius=0.9, depth=2.0, location=(tx, gate_y + 0.4, gate_z + 1.0), material=mat_stone_dark)
        build_models.create_oct_prism("TowerCrenel", radius=1.05, depth=0.3, location=(tx, gate_y + 0.4, gate_z + 2.1), material=mat_basalt_dark)
        build_models.create_cone("TowerRoof", radius=1.1, depth=1.0, vertices=6, location=(tx, gate_y + 0.4, gate_z + 2.7), material=mat_basalt_dark)
        build_models.create_cone("RoofFinial", radius=0.18, depth=0.35, vertices=6, location=(tx, gate_y + 0.4, gate_z + 3.35), material=mat_lava_core)

    # Central Archway & Portcullis
    build_models.create_box("GateArch", size=(2.4, 0.9, 0.8), location=(gate_x, gate_y + 0.4, gate_z + 1.8), material=mat_stone_dark)
    build_models.create_box("Portcullis", size=(1.5, 0.2, 1.5), location=(gate_x, gate_y + 0.4, gate_z + 0.8), material=mat_lava_outer)

    # Central Keep & Spire
    build_models.create_oct_prism("CentralKeep", radius=2.2, depth=2.4, location=(gate_x, gate_y + 1.4, gate_z + 1.2), material=mat_stone_dark)
    build_models.create_cone("CentralKeepSpire", radius=1.6, depth=1.5, vertices=8, location=(gate_x, gate_y + 1.4, gate_z + 2.8), material=mat_basalt_dark)
    build_models.create_cone("SpireFinial", radius=0.25, depth=0.55, vertices=6, location=(gate_x, gate_y + 1.4, gate_z + 3.8), material=mat_lava_core)

    # Curtain Walls
    build_models.create_box("WallL", size=(4.5, 1.2, 2.4), location=(gate_x - 4.6, gate_y + 0.8, gate_z + 1.2), material=mat_basalt_dark)
    build_models.create_box("WallR", size=(4.5, 1.2, 2.4), location=(gate_x + 4.6, gate_y + 0.8, gate_z + 1.2), material=mat_basalt_dark)

    # Foreground Dressing (Filling the bottom third!)
    fg_boulders = [
        ((-2.5, -13.5, 0.2), 1.1), ((2.5, -13.5, 0.2), 1.1),
        ((-3.2, -16.0, 0.2), 1.3), ((3.2, -16.0, 0.2), 1.3),
        ((-2.0, -17.5, 0.2), 0.9), ((2.0, -17.5, 0.2), 0.9),
        ((-4.5, -15.0, 0.3), 1.4), ((4.5, -15.0, 0.3), 1.4)
    ]
    for b_pos, b_scale in fg_boulders:
        bpy.ops.mesh.primitive_cube_add(size=b_scale, location=b_pos, rotation=(0.25, 0.35, 0.45))
        b = bpy.context.active_object
        b.scale = (1.2, 0.85, 0.9)
        bpy.ops.object.transform_apply(scale=True)
        make_faceted(b)
        b.data.materials.append(mat_basalt)

    bpy.context.view_layer.update()
    bpy.context.scene.render.filepath = "assets/maps/map4.png"
    bpy.ops.render.render(write_still=True)
    print("Test Map 4 rendered successfully at 1600x2400!")

if __name__ == "__main__":
    render_test_map4()
