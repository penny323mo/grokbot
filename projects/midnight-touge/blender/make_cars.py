#!/usr/bin/env python3
"""
Blender 5.2.3 Headless Script: High-Fidelity JDM 3D Car Generator for Midnight Touge
Creates 3 store-ready procedural 3D models with PBR materials, bevelled panels,
smooth normals, wheels, calipers, pop-up lights, and aero kits:
- car_rs86.glb (霧嶺 RS-86: 80s Panda FR Hatchback)
- car_st20.glb (黑曜 S-T20: 90s Turbo FR Coupe)
- car_rx7.glb  (赤焰 R-X7:  Twin-Rotor Widebody Sports Coupe)
"""
import bpy
import bmesh
import math
import os

def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def create_pbr_material(name, base_color=(0.8, 0.8, 0.8, 1.0), metallic=0.0, roughness=0.5, emission=(0,0,0,1), emission_strength=0.0, clearcoat=0.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs['Base Color'].default_value = base_color
        bsdf.inputs['Metallic'].default_value = metallic
        bsdf.inputs['Roughness'].default_value = roughness
        if 'Emission Color' in bsdf.inputs:
            bsdf.inputs['Emission Color'].default_value = emission
            bsdf.inputs['Emission Strength'].default_value = emission_strength
        elif 'Emission' in bsdf.inputs:
            bsdf.inputs['Emission'].default_value = emission
        if 'Coat Weight' in bsdf.inputs:
            bsdf.inputs['Coat Weight'].default_value = clearcoat
        elif 'Clearcoat' in bsdf.inputs:
            bsdf.inputs['Clearcoat'].default_value = clearcoat
    return mat

def apply_bevel_and_smooth(obj, width=0.025, segments=2):
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.shade_smooth()
    bev = obj.modifiers.new(name="Bevel", type='BEVEL')
    bev.width = width
    bev.segments = segments
    bev.limit_method = 'ANGLE'
    bev.angle_limit = math.radians(38)

def create_wheel(parent, x, y, z, radius=0.31, width=0.22, rim_color=(0.15, 0.15, 0.15, 1.0), name="Wheel"):
    # Tire rubber
    bpy.ops.mesh.primitive_cylinder_add(radius=radius, depth=width, vertices=24, location=(x, y, z))
    tire = bpy.context.active_object
    tire.name = f"{name}_Tire"
    tire.rotation_euler = (0, math.pi / 2, 0)
    tire.parent = parent
    
    mat_rubber = create_pbr_material(f"{name}_Rubber", base_color=(0.06, 0.06, 0.07, 1.0), roughness=0.85)
    tire.data.materials.append(mat_rubber)
    apply_bevel_and_smooth(tire, width=0.015, segments=2)

    # Wheel Rim
    rim_inset = 0.02 if x > 0 else -0.02
    bpy.ops.mesh.primitive_cylinder_add(radius=radius * 0.76, depth=width * 0.72, vertices=20, location=(x + rim_inset, y, z))
    rim = bpy.context.active_object
    rim.name = f"{name}_Rim"
    rim.rotation_euler = (0, math.pi / 2, 0)
    rim.parent = parent
    mat_rim = create_pbr_material(f"{name}_RimMat", base_color=rim_color, metallic=0.88, roughness=0.22)
    rim.data.materials.append(mat_rim)
    apply_bevel_and_smooth(rim, width=0.012, segments=2)

    # Brake disc (steel slotted)
    bpy.ops.mesh.primitive_cylinder_add(radius=radius * 0.62, depth=0.03, vertices=16, location=(x - rim_inset * 0.5, y, z))
    disc = bpy.context.active_object
    disc.name = f"{name}_BrakeDisc"
    disc.rotation_euler = (0, math.pi / 2, 0)
    disc.parent = parent
    mat_disc = create_pbr_material(f"{name}_DiscMat", base_color=(0.65, 0.66, 0.70, 1.0), metallic=0.96, roughness=0.18)
    disc.data.materials.append(mat_disc)
    
    # Brake caliper (Brembo racing red)
    bpy.ops.mesh.primitive_cube_add(size=0.1, location=(x - 0.015 if x > 0 else x + 0.015, y, z + radius * 0.38))
    caliper = bpy.context.active_object
    caliper.scale = (0.35, 0.85, 0.65)
    caliper.parent = parent
    mat_caliper = create_pbr_material(f"{name}_CaliperMat", base_color=(0.90, 0.08, 0.06, 1.0), metallic=0.5, roughness=0.25)
    caliper.data.materials.append(mat_caliper)

def create_sloped_body(name, parent, material, front_dims, rear_dims, length, z_center):
    """Creates a tapered, aerodynamic body section using bmesh"""
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)
    parent_scene = bpy.context.scene
    parent_scene.collection.objects.link(obj)
    obj.parent = parent
    
    bm = bmesh.new()
    fw_w, fw_h = front_dims
    rw_w, rw_h = rear_dims
    half_len = length / 2.0
    
    # 8 vertices for a frustum/tapered box
    # Front face
    v0 = bm.verts.new((-fw_w/2, half_len, z_center - fw_h/2))
    v1 = bm.verts.new((fw_w/2, half_len, z_center - fw_h/2))
    v2 = bm.verts.new((fw_w/2, half_len, z_center + fw_h/2))
    v3 = bm.verts.new((-fw_w/2, half_len, z_center + fw_h/2))
    # Rear face
    v4 = bm.verts.new((-rw_w/2, -half_len, z_center - rw_h/2))
    v5 = bm.verts.new((rw_w/2, -half_len, z_center - rw_h/2))
    v6 = bm.verts.new((rw_w/2, -half_len, z_center + rw_h/2))
    v7 = bm.verts.new((-rw_w/2, -half_len, z_center + rw_h/2))
    
    bm.faces.new((v3, v2, v1, v0)) # Front
    bm.faces.new((v4, v5, v6, v7)) # Rear
    bm.faces.new((v0, v1, v5, v4)) # Bottom
    bm.faces.new((v2, v3, v7, v6)) # Top
    bm.faces.new((v0, v4, v7, v3)) # Left
    bm.faces.new((v1, v2, v6, v5)) # Right
    
    bm.to_mesh(mesh)
    bm.free()
    
    obj.data.materials.append(material)
    apply_bevel_and_smooth(obj, width=0.03, segments=2)
    return obj

# ==============================================================================
# 1. 霧嶺 RS-86 (80s Lightweight FR Panda Hatchback)
# ==============================================================================
def make_rs86():
    clear_scene()
    root = bpy.data.objects.new("Car_RS86", None)
    bpy.context.scene.collection.objects.link(root)

    # Materials
    mat_white = create_pbr_material("RS86_WhitePaint", base_color=(0.95, 0.95, 0.96, 1.0), metallic=0.15, roughness=0.15, clearcoat=0.95)
    mat_black = create_pbr_material("RS86_BlackTrim", base_color=(0.04, 0.04, 0.05, 1.0), roughness=0.65)
    mat_glass = create_pbr_material("RS86_Glass", base_color=(0.03, 0.05, 0.08, 1.0), roughness=0.08, metallic=0.1)
    mat_light_front = create_pbr_material("RS86_Headlight", base_color=(1, 1, 0.9, 1), emission=(1, 0.96, 0.82, 1), emission_strength=10.0)
    mat_light_rear = create_pbr_material("RS86_Taillight", base_color=(0.9, 0.05, 0.05, 1), emission=(1, 0.05, 0.05, 1), emission_strength=5.5)

    # 1. Lower Chassis (Black Panda Rocker Strip with tapered nose)
    create_sloped_body("RS86_Chassis", root, mat_black,
                       front_dims=(1.62, 0.26), rear_dims=(1.66, 0.28), length=4.15, z_center=0.28)

    # 2. Main Hood & Shoulder (White Body with wedge slope)
    create_sloped_body("RS86_HoodShoulder", root, mat_white,
                       front_dims=(1.58, 0.24), rear_dims=(1.64, 0.30), length=4.10, z_center=0.52)

    # 3. Slanted Cabin Greenhouse (Raked windshield & fastback hatch)
    create_sloped_body("RS86_CabinGlass", root, mat_glass,
                       front_dims=(1.38, 0.38), rear_dims=(1.44, 0.44), length=2.15, z_center=0.86)

    # Roof skin panel (White)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.26, 1.10))
    roof = bpy.context.active_object
    roof.scale = (1.36, 1.75, 0.05)
    roof.parent = root
    roof.data.materials.append(mat_white)
    apply_bevel_and_smooth(roof, width=0.02, segments=2)

    # 4. Pop-up Headlights (popped up at front with warm halogen lens)
    for side in [-0.54, 0.54]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(side, 1.88, 0.70))
        pod = bpy.context.active_object
        pod.scale = (0.34, 0.30, 0.15)
        pod.parent = root
        pod.data.materials.append(mat_white)
        apply_bevel_and_smooth(pod, width=0.015, segments=2)
        
        # Glowing halogen lens
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(side, 2.03, 0.70))
        lens = bpy.context.active_object
        lens.scale = (0.30, 0.03, 0.11)
        lens.parent = root
        lens.data.materials.append(mat_light_front)

    # 5. Tail lights (dual horizontal amber-red cluster)
    for side in [-0.52, 0.52]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(side, -2.06, 0.55))
        tail = bpy.context.active_object
        tail.scale = (0.48, 0.05, 0.14)
        tail.parent = root
        tail.data.materials.append(mat_light_rear)
        apply_bevel_and_smooth(tail, width=0.01, segments=1)

    # 6. Ducktail Rear Lip Spoiler
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -1.98, 0.68))
    spoiler = bpy.context.active_object
    spoiler.scale = (1.46, 0.12, 0.06)
    spoiler.rotation_euler = (math.radians(-25), 0, 0)
    spoiler.parent = root
    spoiler.data.materials.append(mat_black)
    apply_bevel_and_smooth(spoiler, width=0.015, segments=2)

    # 7. Side Mirrors
    for side in [-0.82, 0.82]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(side, 0.62, 0.72))
        mirror = bpy.context.active_object
        mirror.scale = (0.16, 0.20, 0.10)
        mirror.parent = root
        mirror.data.materials.append(mat_black)
        apply_bevel_and_smooth(mirror, width=0.015, segments=2)

    # 8. Dual Polished Chrome Exhaust Pipes
    for side in [0.46, 0.56]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.045, depth=0.28, location=(side, -2.12, 0.18))
        pipe = bpy.context.active_object
        pipe.rotation_euler = (math.pi / 2, 0, 0)
        pipe.parent = root
        mat_chrome = create_pbr_material("Chrome", base_color=(0.92, 0.92, 0.94, 1), metallic=0.98, roughness=0.1)
        pipe.data.materials.append(mat_chrome)

    # 9. Wheels (Watanabe 8-spoke Gunmetal)
    wheel_y_f = 1.25
    wheel_y_r = -1.25
    wheel_x = 0.82
    create_wheel(root, -wheel_x, wheel_y_f, 0.31, radius=0.31, width=0.21, rim_color=(0.20, 0.20, 0.22, 1.0), name="FL")
    create_wheel(root, wheel_x, wheel_y_f, 0.31, radius=0.31, width=0.21, rim_color=(0.20, 0.20, 0.22, 1.0), name="FR")
    create_wheel(root, -wheel_x, wheel_y_r, 0.31, radius=0.31, width=0.23, rim_color=(0.20, 0.20, 0.22, 1.0), name="RL")
    create_wheel(root, wheel_x, wheel_y_r, 0.31, radius=0.31, width=0.23, rim_color=(0.20, 0.20, 0.22, 1.0), name="RR")

    out_path = "assets/models/car_rs86.glb"
    bpy.ops.export_scene.gltf(filepath=out_path, export_format="GLB", use_selection=False)
    print(f"Exported RS-86 GLB: {out_path}")

# ==============================================================================
# 2. 黑曜 S-T20 (90s Turbo FR Coupe)
# ==============================================================================
def make_st20():
    clear_scene()
    root = bpy.data.objects.new("Car_ST20", None)
    bpy.context.scene.collection.objects.link(root)

    mat_paint = create_pbr_material("ST20_TealPaint", base_color=(0.06, 0.16, 0.20, 1.0), metallic=0.82, roughness=0.20, clearcoat=0.95)
    mat_black = create_pbr_material("ST20_CarbonTrim", base_color=(0.03, 0.03, 0.04, 1.0), metallic=0.2, roughness=0.5)
    mat_glass = create_pbr_material("ST20_Glass", base_color=(0.02, 0.04, 0.06, 1.0), roughness=0.08, metallic=0.1)
    mat_light_front = create_pbr_material("ST20_ProjectorHeadlight", base_color=(0.95, 0.98, 1, 1), emission=(0.90, 0.95, 1, 1), emission_strength=12.0)
    mat_light_rear = create_pbr_material("ST20_Taillight", base_color=(0.9, 0.05, 0.05, 1), emission=(1, 0.06, 0.06, 1), emission_strength=5.5)

    # 1. Lower Aerodynamic Rockers with carbon ground effects
    create_sloped_body("ST20_Lower", root, mat_black,
                       front_dims=(1.72, 0.24), rear_dims=(1.76, 0.26), length=4.35, z_center=0.27)

    # 2. Curvaceous 90s Coupe Body (Tapered Coke-bottle waist)
    create_sloped_body("ST20_Body", root, mat_paint,
                       front_dims=(1.68, 0.26), rear_dims=(1.74, 0.32), length=4.30, z_center=0.52)

    # 3. Fastback Greenhouse
    create_sloped_body("ST20_GlassCabin", root, mat_glass,
                       front_dims=(1.40, 0.36), rear_dims=(1.46, 0.42), length=2.25, z_center=0.85)

    # Roof Skin
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.22, 1.08))
    roof = bpy.context.active_object
    roof.scale = (1.38, 1.85, 0.05)
    roof.parent = root
    roof.data.materials.append(mat_paint)
    apply_bevel_and_smooth(roof, width=0.02, segments=2)

    # 4. Projector Aero Headlights
    for side in [-0.56, 0.56]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(side, 2.08, 0.56))
        lamp = bpy.context.active_object
        lamp.scale = (0.34, 0.08, 0.12)
        lamp.parent = root
        lamp.data.materials.append(mat_light_front)
        apply_bevel_and_smooth(lamp, width=0.015, segments=1)

    # 5. Integrated Full-Width LED Taillight Bar
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -2.16, 0.57))
    tail = bpy.context.active_object
    tail.scale = (1.52, 0.05, 0.11)
    tail.parent = root
    tail.data.materials.append(mat_light_rear)

    # 6. Low-Profile Arched Rear Wing
    for side in [-0.62, 0.62]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(side, -2.05, 0.72))
        pylon = bpy.context.active_object
        pylon.scale = (0.05, 0.16, 0.22)
        pylon.parent = root
        pylon.data.materials.append(mat_black)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -2.08, 0.84))
    wing = bpy.context.active_object
    wing.scale = (1.56, 0.22, 0.04)
    wing.parent = root
    wing.data.materials.append(mat_paint)
    apply_bevel_and_smooth(wing, width=0.015, segments=2)

    # 7. Side Mirrors
    for side in [-0.85, 0.85]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(side, 0.65, 0.72))
        mirror = bpy.context.active_object
        mirror.scale = (0.16, 0.22, 0.10)
        mirror.parent = root
        mirror.data.materials.append(mat_paint)
        apply_bevel_and_smooth(mirror, width=0.015, segments=2)

    # 8. Single Large Cannon Exhaust Tip (Right side)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.07, depth=0.32, location=(0.58, -2.20, 0.18))
    pipe = bpy.context.active_object
    pipe.rotation_euler = (math.pi / 2, 0, 0)
    pipe.parent = root
    mat_ti = create_pbr_material("Titanium", base_color=(0.85, 0.85, 0.90, 1), metallic=0.95, roughness=0.15)
    pipe.data.materials.append(mat_ti)

    # 9. Wheels (Bronze 5-spoke)
    wheel_y_f = 1.30
    wheel_y_r = -1.30
    wheel_x = 0.86
    create_wheel(root, -wheel_x, wheel_y_f, 0.31, radius=0.32, width=0.23, rim_color=(0.48, 0.34, 0.18, 1.0), name="FL")
    create_wheel(root, wheel_x, wheel_y_f, 0.31, radius=0.32, width=0.23, rim_color=(0.48, 0.34, 0.18, 1.0), name="FR")
    create_wheel(root, -wheel_x, wheel_y_r, 0.31, radius=0.32, width=0.25, rim_color=(0.48, 0.34, 0.18, 1.0), name="RL")
    create_wheel(root, wheel_x, wheel_y_r, 0.31, radius=0.32, width=0.25, rim_color=(0.48, 0.34, 0.18, 1.0), name="RR")

    out_path = "assets/models/car_st20.glb"
    bpy.ops.export_scene.gltf(filepath=out_path, export_format="GLB", use_selection=False)
    print(f"Exported S-T20 GLB: {out_path}")

# ==============================================================================
# 3. 赤焰 R-X7 (Twin-Rotor Widebody Sports Coupe)
# ==============================================================================
def make_rx7():
    clear_scene()
    root = bpy.data.objects.new("Car_RX7", None)
    bpy.context.scene.collection.objects.link(root)

    mat_paint = create_pbr_material("RX7_RedPaint", base_color=(0.85, 0.08, 0.08, 1.0), metallic=0.35, roughness=0.14, clearcoat=0.98)
    mat_carbon = create_pbr_material("RX7_Carbon", base_color=(0.02, 0.02, 0.02, 1.0), roughness=0.45, metallic=0.1)
    mat_glass = create_pbr_material("RX7_Glass", base_color=(0.02, 0.03, 0.05, 1.0), roughness=0.08, metallic=0.1)
    mat_light_front = create_pbr_material("RX7_Headlight", base_color=(1, 1, 0.95, 1), emission=(1, 0.98, 0.88, 1), emission_strength=12.0)
    mat_light_rear = create_pbr_material("RX7_Taillight", base_color=(0.95, 0.04, 0.04, 1), emission=(1, 0.05, 0.05, 1), emission_strength=6.0)

    # 1. Widebody Lower Chassis (Aggressive front splitter & side skirts)
    create_sloped_body("RX7_Chassis", root, mat_carbon,
                       front_dims=(1.78, 0.22), rear_dims=(1.84, 0.24), length=4.30, z_center=0.25)

    # 2. Ultra-Low Flared Widebody Shell
    create_sloped_body("RX7_Body", root, mat_paint,
                       front_dims=(1.74, 0.25), rear_dims=(1.82, 0.30), length=4.25, z_center=0.48)

    # 3. Teardrop Aerodynamic Canopy
    create_sloped_body("RX7_Canopy", root, mat_glass,
                       front_dims=(1.36, 0.35), rear_dims=(1.42, 0.40), length=2.10, z_center=0.81)

    # Double-Bubble Roof Panel
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.18, 1.03))
    roof = bpy.context.active_object
    roof.scale = (1.32, 1.70, 0.05)
    roof.parent = root
    roof.data.materials.append(mat_paint)
    apply_bevel_and_smooth(roof, width=0.02, segments=2)

    # 4. Sleek Pop-up Headlights (Slightly popped up / sleep-eye mode)
    for side in [-0.58, 0.58]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(side, 1.94, 0.62))
        pod = bpy.context.active_object
        pod.scale = (0.34, 0.26, 0.12)
        pod.parent = root
        pod.data.materials.append(mat_paint)
        apply_bevel_and_smooth(pod, width=0.015, segments=2)
        
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(side, 2.06, 0.62))
        lens = bpy.context.active_object
        lens.scale = (0.30, 0.03, 0.09)
        lens.parent = root
        lens.data.materials.append(mat_light_front)

    # 5. Dual Tail Lights with iconic circular brake lenses
    for side in [-0.55, 0.55]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.10, depth=0.04, location=(side, -2.14, 0.54))
        tail = bpy.context.active_object
        tail.rotation_euler = (math.pi / 2, 0, 0)
        tail.parent = root
        tail.data.materials.append(mat_light_rear)

    # 6. High-Downforce GT Wing on Aluminum Uprights
    for side in [-0.55, 0.55]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(side, -1.98, 0.78))
        stay = bpy.context.active_object
        stay.scale = (0.04, 0.14, 0.34)
        stay.parent = root
        stay.data.materials.append(mat_carbon)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -2.02, 0.95))
    gtwing = bpy.context.active_object
    gtwing.scale = (1.68, 0.26, 0.035)
    gtwing.rotation_euler = (math.radians(-14), 0, 0)
    gtwing.parent = root
    gtwing.data.materials.append(mat_carbon)
    apply_bevel_and_smooth(gtwing, width=0.012, segments=2)

    # 7. Side Aero Mirrors
    for side in [-0.86, 0.86]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(side, 0.58, 0.68))
        mirror = bpy.context.active_object
        mirror.scale = (0.15, 0.18, 0.08)
        mirror.parent = root
        mirror.data.materials.append(mat_carbon)
        apply_bevel_and_smooth(mirror, width=0.015, segments=2)

    # 8. Dual Center-Exit Titanium Exhaust Tips
    for side in [-0.08, 0.08]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.055, depth=0.30, location=(side, -2.16, 0.20))
        pipe = bpy.context.active_object
        pipe.rotation_euler = (math.pi / 2, 0, 0)
        pipe.parent = root
        mat_burn = create_pbr_material("BurntTitanium", base_color=(0.4, 0.6, 0.85, 1), metallic=0.96, roughness=0.12)
        pipe.data.materials.append(mat_burn)

    # 9. Wheels (Forged Gold Multi-Spoke)
    wheel_y_f = 1.28
    wheel_y_r = -1.28
    wheel_x = 0.90
    create_wheel(root, -wheel_x, wheel_y_f, 0.31, radius=0.32, width=0.24, rim_color=(0.72, 0.58, 0.18, 1.0), name="FL")
    create_wheel(root, wheel_x, wheel_y_f, 0.31, radius=0.32, width=0.24, rim_color=(0.72, 0.58, 0.18, 1.0), name="FR")
    create_wheel(root, -wheel_x, wheel_y_r, 0.31, radius=0.31, width=0.26, rim_color=(0.72, 0.58, 0.18, 1.0), name="RL")
    create_wheel(root, wheel_x, wheel_y_r, 0.31, radius=0.31, width=0.26, rim_color=(0.72, 0.58, 0.18, 1.0), name="RR")

    out_path = "assets/models/car_rx7.glb"
    bpy.ops.export_scene.gltf(filepath=out_path, export_format="GLB", use_selection=False)
    print(f"Exported R-X7 GLB: {out_path}")

if __name__ == "__main__":
    make_rs86()
    make_st20()
    make_rx7()
    print("All JDM 3D car models generated and exported successfully!")
