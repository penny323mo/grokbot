#!/usr/bin/env python3
"""
Blender 5.2.3 Script: Render Visual Targets for Midnight Touge (《夜峠》)
Generates:
1. assets/target/race_target.png (1170x2532) - In-race chase-cam view on Stage 1 Kirine Pass
2. assets/target/garage_target.png (1170x2532) - Hero showroom/garage view of RS-86
"""
import bpy
import bmesh
import math
import os
from mathutils import Vector, Euler, Matrix
from pathlib import Path

ROOT = Path("/workspace/nightly/2026-10-29-midnight-touge")
TARGET_DIR = ROOT / "assets/target"
TARGET_DIR.mkdir(parents=True, exist_ok=True)

def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = 20
    scene.cycles.max_bounces = 3
    scene.cycles.diffuse_bounces = 2
    scene.cycles.glossy_bounces = 2
    scene.cycles.transmission_bounces = 1
    scene.cycles.volume_bounces = 0
    scene.cycles.transparent_max_bounces = 3
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 1170
    scene.render.resolution_y = 2532
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.view_settings.view_transform = 'AgX'
    scene.view_settings.look = 'AgX - High Contrast'
    return scene

def create_principled_mat(name, color=(0.8,0.8,0.8,1.0), roughness=0.5, metallic=0.0,
                           emission=(0,0,0,1), emission_strength=0.0, clearcoat=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs['Base Color'].default_value = color
        bsdf.inputs['Roughness'].default_value = roughness
        bsdf.inputs['Metallic'].default_value = metallic
        if 'Coat Weight' in bsdf.inputs:
            bsdf.inputs['Coat Weight'].default_value = clearcoat
        elif 'Clearcoat' in bsdf.inputs:
            bsdf.inputs['Clearcoat'].default_value = clearcoat
        if 'Emission Color' in bsdf.inputs:
            bsdf.inputs['Emission Color'].default_value = emission
            bsdf.inputs['Emission Strength'].default_value = emission_strength
        elif 'Emission' in bsdf.inputs:
            bsdf.inputs['Emission'].default_value = emission
    return mat

def load_car():
    car_path = ROOT / "assets/models/car_h86.glb"
    bpy.ops.import_scene.gltf(filepath=str(car_path))
    # Find imported root
    imported = [o for o in bpy.data.objects if o.parent is None]
    car_root = imported[0] if imported else None
    return car_root

# ==============================================================================
# 1. RENDER IN-RACE CHASE-CAM TARGET
# ==============================================================================
def render_race_target():
    print("Building Stage 1 Kirine Pass chase-cam scene...")
    scene = reset_scene()
    
    # World lighting: deep midnight blue sky
    world = bpy.data.worlds.new("MidnightWorld")
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs['Color'].default_value = (0.015, 0.035, 0.055, 1.0)
        bg.inputs['Strength'].default_value = 0.45
    scene.world = world

    # Directional moonlight
    moon = bpy.data.lights.new("Moonlight", 'SUN')
    moon.color = (0.70, 0.85, 1.0)
    moon.energy = 1.2
    moon_obj = bpy.data.objects.new("Moonlight", moon)
    moon_obj.rotation_euler = (math.radians(55), math.radians(15), math.radians(-40))
    bpy.context.collection.objects.link(moon_obj)

    # 1. Road mesh (downhill curved spline)
    # Road runs from Y = -15 to Y = 120, descending in Z
    bm = bmesh.new()
    road_pts = []
    num_segments = 60
    road_width = 8.5
    for i in range(num_segments + 1):
        t = i / num_segments
        # Curve: starts straight then curves right into gentle sweeper
        y = -15.0 + t * 140.0
        # Gentle right bend after y = 30
        curve = 0.0 if y < 25.0 else (y - 25.0) ** 1.35 * 0.05
        x = curve
        # Downhill gradient: ~10% slope
        z = -y * 0.10
        road_pts.append((x, y, z))
    
    # Build road ribbon, white shoulder lines, and center dashed line
    mat_asphalt = create_principled_mat("WetAsphalt", color=(0.045, 0.048, 0.055, 1.0), roughness=0.22, metallic=0.08)
    mat_yellow_line = create_principled_mat("RoadYellowLine", color=(0.95, 0.75, 0.15, 1.0), roughness=0.35, metallic=0.0)
    mat_white_line = create_principled_mat("RoadWhiteLine", color=(0.88, 0.88, 0.90, 1.0), roughness=0.35, metallic=0.0)
    mat_guardrail = create_principled_mat("GalvanizedRail", color=(0.75, 0.78, 0.82, 1.0), roughness=0.28, metallic=0.85)
    mat_rock = create_principled_mat("MountainRock", color=(0.10, 0.11, 0.12, 1.0), roughness=0.92, metallic=0.0)

    # Build road surface
    road_mesh = bpy.data.meshes.new("RoadSurface")
    bm_road = bmesh.new()
    prev_vl, prev_vr = None, None
    for i in range(len(road_pts)):
        p = road_pts[i]
        # Tangent and normal
        if i < len(road_pts) - 1:
            p_next = road_pts[i+1]
            ty = p_next[1] - p[1]
            tx = p_next[0] - p[0]
            tang = math.atan2(tx, ty)
        else:
            tang = 0.0
        rx = math.cos(tang)
        ry = -math.sin(tang)
        
        vl = bm_road.verts.new((p[0] - rx * (road_width / 2.0), p[1] - ry * (road_width / 2.0), p[2]))
        vr = bm_road.verts.new((p[0] + rx * (road_width / 2.0), p[1] + ry * (road_width / 2.0), p[2]))
        if prev_vl and prev_vr:
            bm_road.faces.new((prev_vl, vl, vr, prev_vr))
        prev_vl, prev_vr = vl, vr
    bm_road.to_mesh(road_mesh)
    bm_road.free()
    road_obj = bpy.data.objects.new("RoadSurface", road_mesh)
    road_obj.data.materials.append(mat_asphalt)
    bpy.context.collection.objects.link(road_obj)

    # Centerline dashes
    dash_mesh = bpy.data.meshes.new("CenterLineDashes")
    bm_dash = bmesh.new()
    for i in range(0, len(road_pts)-1, 2):
        p1 = road_pts[i]
        p2 = road_pts[i+1]
        w = 0.12
        v1 = bm_dash.verts.new((p1[0] - w, p1[1], p1[2] + 0.005))
        v2 = bm_dash.verts.new((p1[0] + w, p1[1], p1[2] + 0.005))
        v3 = bm_dash.verts.new((p2[0] + w, p2[1], p2[2] + 0.005))
        v4 = bm_dash.verts.new((p2[0] - w, p2[1], p2[2] + 0.005))
        bm_dash.faces.new((v1, v2, v3, v4))
    bm_dash.to_mesh(dash_mesh)
    bm_dash.free()
    dash_obj = bpy.data.objects.new("CenterLineDashes", dash_mesh)
    dash_obj.data.materials.append(mat_yellow_line)
    bpy.context.collection.objects.link(dash_obj)

    # Outer white lines
    edge_mesh = bpy.data.meshes.new("EdgeLines")
    bm_edge = bmesh.new()
    for side in [-1, 1]:
        prev_v1, prev_v2 = None, None
        for i in range(len(road_pts)):
            p = road_pts[i]
            offset = side * (road_width / 2.0 - 0.25)
            v1 = bm_edge.verts.new((p[0] + offset - 0.08, p[1], p[2] + 0.005))
            v2 = bm_edge.verts.new((p[0] + offset + 0.08, p[1], p[2] + 0.005))
            if prev_v1 and prev_v2:
                bm_edge.faces.new((prev_v1, v1, v2, prev_v2))
            prev_v1, prev_v2 = v1, v2
    bm_edge.to_mesh(edge_mesh)
    bm_edge.free()
    edge_obj = bpy.data.objects.new("EdgeLines", edge_mesh)
    edge_obj.data.materials.append(mat_white_line)
    bpy.context.collection.objects.link(edge_obj)

    # Guardrails along right (valley) side
    gr_mesh = bpy.data.meshes.new("Guardrails")
    bm_gr = bmesh.new()
    prev_gb, prev_gt = None, None
    for i in range(len(road_pts)):
        p = road_pts[i]
        gx = p[0] + (road_width / 2.0 + 0.35)
        gy = p[1]
        gz = p[2]
        gb = bm_gr.verts.new((gx, gy, gz + 0.30))
        gt = bm_gr.verts.new((gx, gy, gz + 0.85))
        if prev_gb and prev_gt:
            bm_gr.faces.new((prev_gb, gb, gt, prev_gt))
        prev_gb, prev_gt = gb, gt
    bm_gr.to_mesh(gr_mesh)
    bm_gr.free()
    gr_obj = bpy.data.objects.new("Guardrails", gr_mesh)
    gr_obj.data.materials.append(mat_guardrail)
    bpy.context.collection.objects.link(gr_obj)

    # Mountain rock cliff along left side
    cliff_mesh = bpy.data.meshes.new("MountainCliff")
    bm_cf = bmesh.new()
    prev_cb, prev_ct = None, None
    for i in range(len(road_pts)):
        p = road_pts[i]
        cx = p[0] - (road_width / 2.0 + 0.5)
        cy = p[1]
        cz = p[2]
        cb = bm_cf.verts.new((cx, cy, cz))
        ct = bm_cf.verts.new((cx - 3.5, cy, cz + 10.0))
        if prev_cb and prev_ct:
            bm_cf.faces.new((prev_cb, cb, ct, prev_ct))
        prev_cb, prev_ct = cb, ct
    bm_cf.to_mesh(cliff_mesh)
    bm_cf.free()
    cf_obj = bpy.data.objects.new("MountainCliff", cliff_mesh)
    cf_obj.data.materials.append(mat_rock)
    bpy.context.collection.objects.link(cf_obj)

    # Overhead Sodium Streetlights (warm pools every ~35m)
    lamp_emissive_mat = create_principled_mat("SodiumLampBulb", color=(1.0, 0.72, 0.25, 1.0),
                                              emission=(1.0, 0.72, 0.25, 1.0), emission_strength=45.0)
    for lamp_y in [12.0, 48.0, 85.0]:
        # Interpolate road position at lamp_y
        rx = 0.0 if lamp_y < 25.0 else (lamp_y - 25.0) ** 1.35 * 0.05
        rz = -lamp_y * 0.10
        # Light post on right shoulder
        post_x = rx + (road_width / 2.0 + 0.6)
        
        # Spot light pointing at asphalt
        spot = bpy.data.lights.new(f"SodiumSpot_{lamp_y}", 'SPOT')
        spot.color = (1.0, 0.72, 0.28)
        spot.energy = 450.0
        spot.spot_size = math.radians(65)
        spot.spot_blend = 0.45
        spot.shadow_soft_size = 0.8
        spot_obj = bpy.data.objects.new(f"SodiumSpot_{lamp_y}", spot)
        spot_obj.location = (post_x - 1.8, lamp_y, rz + 6.8)
        spot_obj.rotation_euler = (math.radians(-12), math.radians(16), 0)
        bpy.context.collection.objects.link(spot_obj)

        # Visible glowing lamp fixture
        bpy.ops.mesh.primitive_cylinder_add(radius=0.25, depth=0.1, location=(post_x - 1.8, lamp_y, rz + 6.8))
        bulb_obj = bpy.context.active_object
        bulb_obj.name = f"Bulb_{lamp_y}"
        bulb_obj.data.materials.append(lamp_emissive_mat)

    # Flanking Cedar Pines
    tree_wood = create_principled_mat("PineTrunk", color=(0.12, 0.08, 0.06, 1.0), roughness=0.9)
    tree_needles = create_principled_mat("PineNeedles", color=(0.04, 0.09, 0.06, 1.0), roughness=0.85)
    for ty in [5.0, 20.0, 38.0, 60.0, 80.0, 105.0]:
        tx_base = 0.0 if ty < 25.0 else (ty - 25.0) ** 1.35 * 0.05
        tz = -ty * 0.10
        for side in [-1, 1]:
            tx = tx_base + side * (road_width / 2.0 + (3.5 if side < 0 else 2.2))
            # Pine cone shape
            bpy.ops.mesh.primitive_cone_add(radius1=2.8, depth=8.5, location=(tx, ty, tz + 4.2))
            tree = bpy.context.active_object
            tree.data.materials.append(tree_needles)

    # Distant valley floor twinkling city lights (below in the valley at z = -45)
    city_emissive = create_principled_mat("ValleyLights", color=(1.0, 0.88, 0.65, 1.0),
                                          emission=(1.0, 0.88, 0.65, 1.0), emission_strength=80.0)
    bm_city = bmesh.new()
    import random
    random.seed(42)
    for _ in range(80):
        cx = 40.0 + random.uniform(20, 180)
        cy = 80.0 + random.uniform(20, 220)
        cz = -45.0 + random.uniform(-10, 15)
        # Small glowing quad
        s = 0.6
        v1 = bm_city.verts.new((cx, cy, cz))
        v2 = bm_city.verts.new((cx + s, cy, cz))
        v3 = bm_city.verts.new((cx + s, cy, cz + s))
        v4 = bm_city.verts.new((cx, cy, cz + s))
        bm_city.faces.new((v1, v2, v3, v4))
    city_mesh = bpy.data.meshes.new("CityLightsMesh")
    bm_city.to_mesh(city_mesh)
    bm_city.free()
    city_obj = bpy.data.objects.new("CityLightsMesh", city_mesh)
    city_obj.data.materials.append(city_emissive)
    bpy.context.collection.objects.link(city_obj)

    # Load Car RS-86
    load_car()
    car_root = bpy.data.objects.get("1980s-sports-car")
    if car_root:
        car_root.rotation_mode = 'XYZ'
        for corner in ['FL', 'FR', 'RL', 'RR']:
            w = bpy.data.objects.get(f"Wheel_{corner}")
            if w:
                w.rotation_mode = 'XYZ'
                w.parent = car_root
        # Rotate 180 deg so front points forward down the pass (+Y), rear faces chase camera (-Y)
        car_root.rotation_euler = (0, 0, math.pi)
        car_root.location = (0.0, 0.0, 0.0)

    # Dual forward headlights casting illumination down the mountain pass
    headlight_mat = create_principled_mat("HeadlightBulb", color=(1.0, 0.98, 0.92, 1.0),
                                          emission=(1.0, 0.98, 0.92, 1.0), emission_strength=40.0)
    for side in [-1, 1]:
        hl_spot = bpy.data.lights.new(f"Headlight_{side}", 'SPOT')
        hl_spot.color = (1.0, 0.96, 0.90)
        hl_spot.energy = 380.0
        hl_spot.spot_size = math.radians(45)
        hl_spot.spot_blend = 0.35
        hl_spot.shadow_soft_size = 0.4
        hl_obj = bpy.data.objects.new(f"Headlight_{side}", hl_spot)
        hl_obj.location = (side * 0.62, 2.1, 0.45)
        hl_obj.rotation_euler = (math.radians(-84), 0, 0)
        bpy.context.collection.objects.link(hl_obj)
    car_body = bpy.data.objects.get("1980s-sports-car_body")
    if car_body:
        # High-gloss clearcoat paint for panda livery
        for m in car_body.data.materials:
            if m:
                bsdf = m.node_tree.nodes.get("Principled BSDF")
                if bsdf:
                    if 'Coat Weight' in bsdf.inputs:
                        bsdf.inputs['Coat Weight'].default_value = 1.0
                        bsdf.inputs['Coat Roughness'].default_value = 0.05
                    elif 'Clearcoat' in bsdf.inputs:
                        bsdf.inputs['Clearcoat'].default_value = 1.0
                        bsdf.inputs['Clearcoat Roughness'].default_value = 0.05
                    bsdf.inputs['Roughness'].default_value = 0.18

    # Windows: dark automotive tinted glass with reflections
    win_obj = bpy.data.objects.get("1980s-sports-car_windows")
    if win_obj:
        win_mat = create_principled_mat("TintedGlass", color=(0.02, 0.04, 0.06, 1.0), roughness=0.04, metallic=0.92, clearcoat=1.0)
        win_obj.data.materials.clear()
        win_obj.data.materials.append(win_mat)

    # Tail lights: glowing crimson lamps
    tail_mat = create_principled_mat("TailLightGlow", color=(0.95, 0.04, 0.02, 1.0),
                                      emission=(1.0, 0.05, 0.02, 1.0), emission_strength=25.0)
    # Add two glowing rear light quads on the rear panel of the RS-86
    for side in [-1, 1]:
        tl_x = side * 0.58
        tl_y = -2.12
        tl_z = 0.58
        bpy.ops.mesh.primitive_cube_add(size=0.1, location=(tl_x, tl_y, tl_z))
        tl = bpy.context.active_object
        tl.scale = (1.8, 0.2, 0.7)
        tl.data.materials.append(tail_mat)

        # Red taillight point light casting crimson glow onto wet asphalt and rear bumper
        red_light = bpy.data.lights.new(f"Taillight_{side}", 'POINT')
        red_light.color = (1.0, 0.06, 0.04)
        red_light.energy = 8.5
        red_obj = bpy.data.objects.new(f"Taillight_{side}", red_light)
        red_obj.location = (tl_x, tl_y - 0.2, tl_z)
        bpy.context.collection.objects.link(red_obj)

    # Car Contact Shadow on the wet asphalt
    shadow_mat = create_principled_mat("ContactShadow", color=(0.0, 0.0, 0.0, 1.0), roughness=0.95)
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0, -0.15, 0.01))
    c_shadow = bpy.context.active_object
    c_shadow.scale = (1.9, 3.8, 1.0)
    c_shadow.data.materials.append(shadow_mat)

    # Chase Camera: 390x844 portrait aspect (1170x2532)
    # Positioned ~7.2m behind car, 2.05m high, looking down the curved pass
    cam_data = bpy.data.cameras.new("ChaseCamera")
    cam_data.lens = 38.0 # mm
    cam_data.sensor_width = 36.0
    cam_data.clip_start = 0.2
    cam_data.clip_end = 400.0
    cam_obj = bpy.data.objects.new("ChaseCamera", cam_data)
    cam_obj.location = (0.0, -7.2, 2.05)
    cam_obj.rotation_euler = (math.radians(80.5), 0, 0)
    bpy.context.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    # Atmospheric Night Sky & Mist
    world.node_tree.nodes.clear()
    out = world.node_tree.nodes.new("ShaderNodeOutputWorld")
    bg = world.node_tree.nodes.new("ShaderNodeBackground")
    bg.inputs['Color'].default_value = (0.015, 0.035, 0.055, 1.0)
    bg.inputs['Strength'].default_value = 0.65
    world.node_tree.links.new(bg.outputs['Background'], out.inputs['Surface'])

    out_path = TARGET_DIR / "race_target.png"
    scene.render.filepath = str(out_path)
    print(f"Rendering Cycles race target to {out_path}...")
    bpy.ops.render.render(write_still=True)
    print(f"Successfully saved {out_path}")

# ==============================================================================
# 2. RENDER GARAGE SHOWROOM TARGET
# ==============================================================================
def render_garage_target():
    print("Building Garage Showroom scene...")
    scene = reset_scene()

    world = bpy.data.worlds.new("GarageWorld")
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs['Color'].default_value = (0.01, 0.015, 0.02, 1.0)
        bg.inputs['Strength'].default_value = 0.25
    scene.world = world

    # Polished concrete floor with crisp mirror-like reflections
    mat_floor = create_principled_mat("PolishedConcrete", color=(0.06, 0.07, 0.08, 1.0),
                                      roughness=0.12, metallic=0.45, clearcoat=1.0)
    bpy.ops.mesh.primitive_plane_add(size=30.0, location=(0, 0, 0))
    floor = bpy.context.active_object
    floor.data.materials.append(mat_floor)

    # Rear industrial corrugated metal wall / roller shutter door
    mat_wall = create_principled_mat("IndustrialWall", color=(0.08, 0.09, 0.10, 1.0),
                                     roughness=0.65, metallic=0.7)
    bpy.ops.mesh.primitive_plane_add(size=20.0, location=(0, 6.5, 4.0))
    wall = bpy.context.active_object
    wall.rotation_euler = (math.radians(90), 0, 0)
    wall.data.materials.append(mat_wall)

    # Overhead longitudinal fluorescent strip lights casting clean highlights along car body
    mat_fl_tube = create_principled_mat("FluorescentTube", color=(1.0, 0.98, 0.95, 1.0),
                                        emission=(1.0, 0.98, 0.95, 1.0), emission_strength=35.0)
    for x_off in [-1.8, 0.0, 1.8]:
        # Light geometry
        bpy.ops.mesh.primitive_cylinder_add(radius=0.06, depth=7.5, location=(x_off, 0.0, 4.2))
        tube = bpy.context.active_object
        tube.rotation_euler = (math.radians(90), 0, 0)
        tube.data.materials.append(mat_fl_tube)

        # Area light for soft shadows and smooth car paint sheen
        area = bpy.data.lights.new(f"AreaLight_{x_off}", 'AREA')
        area.color = (0.95, 0.97, 1.0)
        area.energy = 220.0
        area.size = 0.4
        area.size_y = 6.0
        area_obj = bpy.data.objects.new(f"AreaLight_{x_off}", area)
        area_obj.location = (x_off, 0.0, 4.1)
        bpy.context.collection.objects.link(area_obj)

    # Warm amber rim accent light from rear side
    amber_rim = bpy.data.lights.new("AmberRimLight", 'SPOT')
    amber_rim.color = (1.0, 0.70, 0.30)
    amber_rim.energy = 160.0
    amber_rim.spot_size = math.radians(50)
    rim_obj = bpy.data.objects.new("AmberRimLight", amber_rim)
    rim_obj.location = (-4.0, 4.5, 2.5)
    rim_obj.rotation_euler = (math.radians(-30), math.radians(-45), 0)
    bpy.context.collection.objects.link(rim_obj)

    # Load RS-86 Car
    load_car()
    car_root = [o for o in bpy.data.objects if o.parent is None and 'Camera' not in o.name and 'Light' not in o.name and 'Plane' not in o.name][0]
    # Rotate car to heroic 3/4 front view
    car_root.rotation_euler = (0, 0, math.radians(28))
    car_root.location = (0.15, 0.2, 0.0)

    # Car paint: high-gloss panda white with deep clearcoat
    car_body = bpy.data.objects.get("1980s-sports-car_body")
    if car_body:
        for m in car_body.data.materials:
            if m:
                bsdf = m.node_tree.nodes.get("Principled BSDF")
                if bsdf:
                    if 'Coat Weight' in bsdf.inputs:
                        bsdf.inputs['Coat Weight'].default_value = 1.0
                        bsdf.inputs['Coat Roughness'].default_value = 0.04
                    elif 'Clearcoat' in bsdf.inputs:
                        bsdf.inputs['Clearcoat'].default_value = 1.0
                        bsdf.inputs['Clearcoat Roughness'].default_value = 0.04
                    bsdf.inputs['Roughness'].default_value = 0.14

    # Windows: dark automotive tinted glass
    win_obj = bpy.data.objects.get("1980s-sports-car_windows")
    if win_obj:
        win_mat = create_principled_mat("GarageTintedGlass", color=(0.02, 0.03, 0.05, 1.0),
                                        roughness=0.03, metallic=0.94, clearcoat=1.0)
        win_obj.data.materials.clear()
        win_obj.data.materials.append(win_mat)

    # Wheels: seated inside arches, alloy rims with chrome lip and dark gunmetal spokes
    mat_chrome = create_principled_mat("ChromeLip", color=(0.95, 0.96, 0.98, 1.0), roughness=0.08, metallic=0.98)
    mat_gunmetal = create_principled_mat("GunmetalSpokes", color=(0.16, 0.18, 0.20, 1.0), roughness=0.22, metallic=0.88)
    mat_tire = create_principled_mat("TireRubber", color=(0.06, 0.06, 0.07, 1.0), roughness=0.85, metallic=0.05)
    for o in bpy.data.objects:
        if 'wheel' in o.name.lower():
            if o.type == 'MESH':
                o.data.materials.clear()
                o.data.materials.append(mat_gunmetal)

    # Contact shadow underneath chassis
    shadow_mat = create_principled_mat("GarageContactShadow", color=(0.01, 0.01, 0.02, 1.0), roughness=0.9)
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0.15, 0.2, 0.01))
    c_shadow = bpy.context.active_object
    c_shadow.rotation_euler = (0, 0, math.radians(28))
    c_shadow.scale = (2.1, 4.2, 1.0)
    c_shadow.data.materials.append(shadow_mat)

    # Garage Camera: framed in 3/4 heroic view, lower third framing per GT7/Forza
    cam_data = bpy.data.cameras.new("GarageCamera")
    cam_data.lens = 40.0 # mm
    cam_data.sensor_width = 36.0
    cam_obj = bpy.data.objects.new("GarageCamera", cam_data)
    cam_obj.location = (-3.8, -5.6, 1.45)
    cam_obj.rotation_euler = (math.radians(78), 0, math.radians(-32))
    bpy.context.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    out_path = TARGET_DIR / "garage_target.png"
    scene.render.filepath = str(out_path)
    print(f"Rendering Cycles garage target to {out_path}...")
    bpy.ops.render.render(write_still=True)
    print(f"Successfully saved {out_path}")

if __name__ == "__main__":
    render_race_target()
    print("Race target visual rendered successfully!")
