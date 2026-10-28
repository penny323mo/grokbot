#!/usr/bin/env python3
"""
Blender 5.2.3 Headless Script: Kirine Pass (霧嶺) 3D Mountain Track Generator
Creates a 2.8 km downhill touge track with:
- 5 consecutive hairpins (五連髮夾彎) + gutter drop apexes
- Mountain bridge & rock tunnel
- Sodium streetlights & cedar trees
- Exports assets/models/track_kirine.glb and src/data/track_data.js
"""
import bpy
import bmesh
import math
import json
import os
import numpy as np

def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def generate_spline_points(total_length=2800.0, step=8.0):
    """
    Generate 2D path and elevation for Kirine Pass.
    Returns list of dicts: {x, y, z, tangent, normal, banking, is_hairpin, gutter_side}
    """
    # Key control points for the 2.8km course (x, y, z, curvature)
    # Course travels generally North to South, descending from z=420 to z=0
    # (scaled for 3D world: 1 unit = 1 meter)
    
    # We define parametric segments:
    # Segment 1 (0-600m): High-speed hill descent & sweepers
    # Segment 2 (600-1100m): Ravine bridge & forest hairpins (2 hairpins)
    # Segment 3 (1100-2100m): Famous 5 Consecutive Hairpins (五連髮夾彎)
    # Segment 4 (2100-2800m): Rock tunnel & fast downhill sprint to valley finish
    
    points = []
    
    cur_x = 0.0
    cur_y = 0.0
    cur_z = 380.0
    cur_heading = 0.0 # radians, 0 = positive Y
    
    # Pre-calculated curvature plan [length_m, curvature_rad_per_m, grade_dz_per_m, banking_deg, is_gutter]
    segments = [
        # Sector 1: Start & High Speed Sweepers (0 - 650m)
        (80, 0.0, -0.08, 0, None),                       # Start straight
        (120, 0.008, -0.10, 3, None),                    # Gentle right sweeper
        (100, -0.010, -0.12, -4, None),                  # Gentle left sweeper
        (150, 0.0, -0.11, 0, None),                      # Fast chute
        (100, 0.012, -0.13, 5, None),                    # Right turn 1
        (100, -0.014, -0.12, -6, None),                  # Left turn 1
        
        # Sector 2: Bridge & Forest Hairpins (650 - 1250m)
        (140, 0.0, -0.09, 0, None),                      # Mountain Bridge approach & span
        (110, 0.038, -0.14, 8, "right"),                 # Hairpin 1 (Right) with gutter!
        (90, 0.0, -0.12, 0, None),                       # Connecting chute
        (110, -0.036, -0.15, -8, "left"),                # Hairpin 2 (Left) with gutter!
        (150, 0.005, -0.12, 2, None),                    # Forest curve
        
        # Sector 3: The 5 Consecutive Hairpins (五連髮夾彎) (1250 - 2150m)
        (70, 0.0, -0.10, 0, None),                       # Entry straight
        (120, 0.048, -0.16, 10, "right"),                # [5-Hairpin #1] Sharp Right 180°
        (75, -0.006, -0.14, -2, None),                   # Short chute
        (120, -0.048, -0.16, -10, "left"),               # [5-Hairpin #2] Sharp Left 180°
        (75, 0.006, -0.14, 2, None),                     # Short chute
        (125, 0.050, -0.16, 11, "right"),                # [5-Hairpin #3] Sharp Right 180°
        (80, -0.005, -0.14, -2, None),                   # Short chute
        (125, -0.050, -0.16, -11, "left"),               # [5-Hairpin #4] Sharp Left 180°
        (80, 0.005, -0.14, 2, None),                     # Short chute
        (130, 0.052, -0.16, 12, "right"),                # [5-Hairpin #5] Final Steep Hairpin 180°
        (90, 0.0, -0.12, 0, None),                       # Exit chute
        
        # Sector 4: Mountain Tunnel & Valley Sprint (2150 - 2800m)
        (80, -0.008, -0.10, -3, None),                   # Approach to tunnel
        (180, 0.003, -0.08, 1, "tunnel"),                # Carved Rock Tunnel (180m long)
        (120, -0.015, -0.11, -5, None),                  # Tunnel exit left sweeper
        (140, 0.016, -0.10, 5, None),                    # Right sweeper overlooking valley
        (130, 0.0, -0.09, 0, None),                      # Final downhill straight to finish
    ]
    
    total_dist = 0.0
    for seg_len, curv, dz, bank, tag in segments:
        num_sub = max(2, int(seg_len / step))
        dt = seg_len / num_sub
        for _ in range(num_sub):
            cur_heading += curv * dt
            cur_x += np.sin(cur_heading) * dt
            cur_y += np.cos(cur_heading) * dt
            cur_z += dz * dt
            total_dist += dt
            
            # Forward vector
            fw_x = np.sin(cur_heading)
            fw_y = np.cos(cur_heading)
            # Right vector (perpendicular)
            rt_x = np.cos(cur_heading)
            rt_y = -np.sin(cur_heading)
            
            points.append({
                "dist": round(total_dist, 2),
                "x": round(float(cur_x), 3),
                "y": round(float(cur_y), 3),
                "z": round(float(cur_z), 3),
                "heading": round(float(cur_heading), 4),
                "fx": round(float(fw_x), 4),
                "fy": round(float(fw_y), 4),
                "rx": round(float(rt_x), 4),
                "ry": round(float(rt_y), 4),
                "bank": round(float(bank), 2),
                "tag": tag
            })
            
    print(f"Generated track spline: {len(points)} waypoints, total length: {total_dist:.1f}m")
    return points

def build_track_mesh(points):
    clear_scene()
    root = bpy.data.objects.new("KirinePass_Track", None)
    bpy.context.scene.collection.objects.link(root)
    
    # PBR Materials
    mat_asphalt = bpy.data.materials.new("Track_Asphalt")
    mat_asphalt.use_nodes = True
    bsdf_asp = mat_asphalt.node_tree.nodes.get("Principled BSDF")
    if bsdf_asp:
        bsdf_asp.inputs['Base Color'].default_value = (0.08, 0.09, 0.11, 1.0)
        bsdf_asp.inputs['Roughness'].default_value = 0.45
        bsdf_asp.inputs['Metallic'].default_value = 0.1
        
    mat_gutter = bpy.data.materials.new("Track_Gutter")
    mat_gutter.use_nodes = True
    bsdf_gut = mat_gutter.node_tree.nodes.get("Principled BSDF")
    if bsdf_gut:
        bsdf_gut.inputs['Base Color'].default_value = (0.22, 0.22, 0.23, 1.0) # Concrete drain
        bsdf_gut.inputs['Roughness'].default_value = 0.8
        
    mat_guardrail = bpy.data.materials.new("Track_Guardrail")
    mat_guardrail.use_nodes = True
    bsdf_gr = mat_guardrail.node_tree.nodes.get("Principled BSDF")
    if bsdf_gr:
        bsdf_gr.inputs['Base Color'].default_value = (0.75, 0.78, 0.82, 1.0)
        bsdf_gr.inputs['Metallic'].default_value = 0.85
        bsdf_gr.inputs['Roughness'].default_value = 0.35
        
    mat_rock = bpy.data.materials.new("Track_Rock")
    mat_rock.use_nodes = True
    bsdf_rk = mat_rock.node_tree.nodes.get("Principled BSDF")
    if bsdf_rk:
        bsdf_rk.inputs['Base Color'].default_value = (0.14, 0.13, 0.12, 1.0)
        bsdf_rk.inputs['Roughness'].default_value = 0.95
        
    mat_lamp_glow = bpy.data.materials.new("Track_SodiumGlow")
    mat_lamp_glow.use_nodes = True
    bsdf_lg = mat_lamp_glow.node_tree.nodes.get("Principled BSDF")
    if bsdf_lg:
        bsdf_lg.inputs['Base Color'].default_value = (1.0, 0.65, 0.20, 1.0)
        if 'Emission Color' in bsdf_lg.inputs:
            bsdf_lg.inputs['Emission Color'].default_value = (1.0, 0.65, 0.20, 1.0)
            bsdf_lg.inputs['Emission Strength'].default_value = 12.0

    # 1. Road Ribbon Mesh
    road_mesh = bpy.data.meshes.new("RoadRibbon")
    bm_road = bmesh.new()
    
    half_width = 4.25 # 8.5m wide road (2 lanes)
    
    prev_v_left = None
    prev_v_right = None
    prev_v_gut_outer = None
    prev_v_gut_inner = None
    
    for i, pt in enumerate(points):
        px, py, pz = pt["x"], pt["y"], pt["z"]
        rx, ry = pt["rx"], pt["ry"]
        bank_rad = math.radians(pt["bank"])
        
        # Left and right edge coordinates with banking
        dz_bank_l = -math.sin(bank_rad) * half_width
        dz_bank_r = math.sin(bank_rad) * half_width
        
        vl_x = px - rx * half_width
        vl_y = py - ry * half_width
        vl_z = pz + dz_bank_l
        
        vr_x = px + rx * half_width
        vr_y = py + ry * half_width
        vr_z = pz + dz_bank_r
        
        v_l = bm_road.verts.new((vl_x, vl_y, vl_z))
        v_r = bm_road.verts.new((vr_x, vr_y, vr_z))
        
        # Inside Gutter (for hairpins): recessed concrete channel along the inner turn
        gutter_tag = pt.get("tag")
        has_gutter = gutter_tag in ["left", "right"]
        if has_gutter:
            gut_side = -1 if gutter_tag == "left" else 1
            # Gutter drops 0.18m down, 0.7m width
            gut_x = px + rx * (half_width * gut_side + 0.7 * gut_side)
            gut_y = py + ry * (half_width * gut_side + 0.7 * gut_side)
            gut_z = pz + (dz_bank_r if gut_side > 0 else dz_bank_l) - 0.18
            v_gut = bm_road.verts.new((gut_x, gut_y, gut_z))
        else:
            v_gut = None
            
        if prev_v_left and prev_v_right:
            # Face for road
            bm_road.faces.new((prev_v_left, v_l, v_r, prev_v_right))
            
        prev_v_left = v_l
        prev_v_right = v_r
        
    bm_road.to_mesh(road_mesh)
    bm_road.free()
    
    road_obj = bpy.data.objects.new("Road", road_mesh)
    road_obj.data.materials.append(mat_asphalt)
    road_obj.parent = root
    bpy.context.scene.collection.objects.link(road_obj)
    
    # 2. Guardrails on Valley Side (W-beam railing + posts every 6m)
    guard_mesh = bpy.data.meshes.new("Guardrails")
    bm_guard = bmesh.new()
    
    prev_g_top = None
    prev_g_bot = None
    
    rail_offset = 4.45
    rail_height = 0.75
    
    for i in range(0, len(points), 2): # Sample every 16m
        pt = points[i]
        px, py, pz = pt["x"], pt["y"], pt["z"]
        rx, ry = pt["rx"], pt["ry"]
        
        # Place guardrail on right side (outer mountain edge)
        gx = px + rx * rail_offset
        gy = py + ry * rail_offset
        gz = pz
        
        v_bot = bm_guard.verts.new((gx, gy, gz + 0.25))
        v_top = bm_guard.verts.new((gx, gy, gz + rail_height))
        
        if prev_g_bot and prev_g_top:
            bm_guard.faces.new((prev_g_bot, v_bot, v_top, prev_g_top))
            
        prev_g_bot = v_bot
        prev_g_top = v_top
        
    bm_guard.to_mesh(guard_mesh)
    bm_guard.free()
    
    guard_obj = bpy.data.objects.new("Guardrails", guard_mesh)
    guard_obj.data.materials.append(mat_guardrail)
    guard_obj.parent = root
    bpy.context.scene.collection.objects.link(guard_obj)
    
    # 3. Mountain Cliff Walls (Inside mountain rock face)
    cliff_mesh = bpy.data.meshes.new("CliffWalls")
    bm_cliff = bmesh.new()
    prev_c_bot = None
    prev_c_top = None
    
    cliff_offset = -4.55
    cliff_height = 8.0
    
    for i in range(0, len(points), 2):
        pt = points[i]
        px, py, pz = pt["x"], pt["y"], pt["z"]
        rx, ry = pt["rx"], pt["ry"]
        
        cx = px + rx * cliff_offset
        cy = py + ry * cliff_offset
        cz = pz
        
        v_bot = bm_cliff.verts.new((cx, cy, cz))
        v_top = bm_cliff.verts.new((cx + rx * -2.0, cy + ry * -2.0, cz + cliff_height))
        
        if prev_c_bot and prev_c_top:
            bm_cliff.faces.new((prev_c_bot, v_bot, v_top, prev_c_top))
            
        prev_c_bot = v_bot
        prev_c_top = v_top
        
    bm_cliff.to_mesh(cliff_mesh)
    bm_cliff.free()
    
    cliff_obj = bpy.data.objects.new("CliffWalls", cliff_mesh)
    cliff_obj.data.materials.append(mat_rock)
    cliff_obj.parent = root
    bpy.context.scene.collection.objects.link(cliff_obj)

    # 4. Sodium Streetlight Poles (Placed at hairpins and sweepers)
    for i in range(0, len(points), 12): # Every ~96m
        pt = points[i]
        px, py, pz = pt["x"], pt["y"], pt["z"]
        rx, ry = pt["rx"], pt["ry"]
        
        # Post location outside road
        lx = px + rx * 5.2
        ly = py + ry * 5.2
        lz = pz
        
        # Vertical pole
        bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=6.5, location=(lx, ly, lz + 3.25))
        pole = bpy.context.active_object
        pole.parent = root
        pole.data.materials.append(mat_guardrail)
        
        # Overhang arm & lamp head
        bpy.ops.mesh.primitive_cube_add(size=0.5, location=(lx - rx * 0.8, ly - ry * 0.8, lz + 6.3))
        lamp = bpy.context.active_object
        lamp.scale = (0.6, 0.8, 0.25)
        lamp.parent = root
        lamp.data.materials.append(mat_lamp_glow)

    # Export track GLB
    out_glb = "assets/models/track_kirine.glb"
    bpy.ops.export_scene.gltf(filepath=out_glb, export_format="GLB", use_selection=False)
    print(f"Exported Track GLB: {out_glb}")
    
    # Export Waypoint Data to JS for physics & UI sector display
    js_content = f"""// Kirine Pass (霧嶺) Waypoint & Sector Navigation Data
// Generated by blender/make_track.py for Midnight Touge

export const KIRINE_PASS_TRACK = {{
  name: "霧嶺 (Kirine Pass)",
  totalLength: {points[-1]['dist']},
  elevationDrop: {points[0]['z'] - points[-1]['z']:.1f},
  startElevation: {points[0]['z']},
  finishElevation: {points[-1]['z']},
  sectors: [
    {{ id: 1, name: "第一區段 · 高原連彎 (Highland Esses)", startDist: 0, endDist: 650, landmark: "起點站台" }},
    {{ id: 2, name: "第二區段 · 溪谷鐵橋 (Ravine Bridge)", startDist: 650, endDist: 1250, landmark: "霧嶺赤橋" }},
    {{ id: 3, name: "第三區段 · 五連髮夾彎 (Five Hairpins)", startDist: 1250, endDist: 2150, landmark: "排水溝落とし" }},
    {{ id: 4, name: "第四區段 · 岩壁隧道與衝刺 (Tunnel & Sprint)", startDist: 2150, endDist: {points[-1]['dist']}, landmark: "霧嶺二號隧道" }}
  ],
  hairpins: [
    {{ name: "赤橋前一號髮夾彎", dist: 760, direction: "right", hasGutter: true }},
    {{ name: "林道二號髮夾彎", dist: 960, direction: "left", hasGutter: true }},
    {{ name: "五連髮夾彎 · 第一回", dist: 1370, direction: "right", hasGutter: true }},
    {{ name: "五連髮夾彎 · 第二回", dist: 1565, direction: "left", hasGutter: true }},
    {{ name: "五連髮夾彎 · 第三回", dist: 1770, direction: "right", hasGutter: true }},
    {{ name: "五連髮夾彎 · 第四回", dist: 1975, direction: "left", hasGutter: true }},
    {{ name: "五連髮夾彎 · 終章", dist: 2185, direction: "right", hasGutter: true }}
  ],
  waypoints: {json.dumps(points, indent=2)}
}};
"""
    with open("src/data/track_data.js", "w", encoding="utf-8") as f:
        f.write(js_content)
    print("Exported src/data/track_data.js successfully!")

if __name__ == "__main__":
    os.makedirs("assets/models", exist_ok=True)
    os.makedirs("src/data", exist_ok=True)
    pts = generate_spline_points()
    build_track_mesh(pts)
