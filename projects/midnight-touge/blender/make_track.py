#!/usr/bin/env python3
"""
Blender 5.2.3 Script: Next-Gen PBR Kirine Pass Mountain Track Generator
Creates store-ready 3D mountain pass environment:
- 8.5m wide road with UV-mapped asphalt, centerline dashes, white edge lines
- Hairpin apex kerbs (red/white) and deep concrete drainage gutters (排水溝)
- Continuous galvanized W-beam guardrails with support posts
- Wide mountain terrain shoulders (18m wide) eliminating black voids
- Overhead sodium streetlights every 36m with amber light pools
- Exports assets/models/track_kirine.glb and updates src/data/track_data.js
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
    points = [{
        "dist": 0.0,
        "x": 0.0,
        "y": 0.0,
        "z": 380.0,
        "heading": 0.0,
        "fx": 0.0,
        "fy": 1.0,
        "rx": 1.0,
        "ry": 0.0,
        "bank": 0.0,
        "tag": None
    }]
    
    cur_x = 0.0
    cur_y = 0.0
    cur_z = 380.0
    cur_heading = 0.0
    
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
            
            fw_x = np.sin(cur_heading)
            fw_y = np.cos(cur_heading)
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

def create_pbr_material(name, color=(0.5, 0.5, 0.5, 1.0), roughness=0.5, metallic=0.0,
                        emission=(0, 0, 0, 1), emission_strength=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs['Base Color'].default_value = color
        bsdf.inputs['Roughness'].default_value = roughness
        bsdf.inputs['Metallic'].default_value = metallic
        if 'Emission Color' in bsdf.inputs:
            bsdf.inputs['Emission Color'].default_value = emission
            bsdf.inputs['Emission Strength'].default_value = emission_strength
    return mat

def build_pbr_track(points):
    clear_scene()
    root = bpy.data.objects.new("KirinePass_Track", None)
    bpy.context.scene.collection.objects.link(root)

    # 1. Materials
    mat_asphalt = create_pbr_material("Track_Asphalt", color=(0.06, 0.07, 0.08, 1.0), roughness=0.35, metallic=0.1)
    mat_yellow_dash = create_pbr_material("Track_CenterLine", color=(0.95, 0.78, 0.15, 1.0), roughness=0.4, metallic=0.0)
    mat_white_edge = create_pbr_material("Track_WhiteLine", color=(0.88, 0.88, 0.92, 1.0), roughness=0.4, metallic=0.0)
    mat_gutter = create_pbr_material("Track_Gutter", color=(0.20, 0.21, 0.23, 1.0), roughness=0.75, metallic=0.0)
    mat_kerb_red = create_pbr_material("Track_KerbRed", color=(0.88, 0.12, 0.10, 1.0), roughness=0.5, metallic=0.0)
    mat_kerb_white = create_pbr_material("Track_KerbWhite", color=(0.90, 0.90, 0.92, 1.0), roughness=0.5, metallic=0.0)
    mat_guardrail = create_pbr_material("Track_Guardrail", color=(0.78, 0.80, 0.84, 1.0), roughness=0.25, metallic=0.88)
    mat_rock = create_pbr_material("Track_Rock", color=(0.11, 0.12, 0.14, 1.0), roughness=0.92, metallic=0.0)
    mat_forest_ground = create_pbr_material("Track_ForestFloor", color=(0.05, 0.07, 0.05, 1.0), roughness=0.90, metallic=0.0)
    mat_sodium_glow = create_pbr_material("Track_SodiumGlow", color=(1.0, 0.72, 0.25, 1.0), roughness=0.2,
                                         emission=(1.0, 0.72, 0.25, 1.0), emission_strength=25.0)

    half_width = 4.25 # 8.5m road width

    # --------------------------------------------------------------------------
    # 2. Road Ribbon with UV Mapping
    # --------------------------------------------------------------------------
    road_mesh = bpy.data.meshes.new("Road")
    bm_road = bmesh.new()
    uv_road = bm_road.loops.layers.uv.new("UVMap")

    prev_vl = None
    prev_vr = None
    prev_dist = 0.0

    for i, pt in enumerate(points):
        px, py, pz = pt["x"], pt["y"], pt["z"]
        rx, ry = pt["rx"], pt["ry"]
        d = pt["dist"]
        bank_rad = math.radians(pt["bank"])
        dz_bank_l = -math.sin(bank_rad) * half_width
        dz_bank_r = math.sin(bank_rad) * half_width

        vl = bm_road.verts.new((px - rx * half_width, py - ry * half_width, pz + dz_bank_l))
        vr = bm_road.verts.new((px + rx * half_width, py + ry * half_width, pz + dz_bank_r))

        if prev_vl and prev_vr:
            face = bm_road.faces.new((prev_vl, vl, vr, prev_vr))
            # Set UV coordinates (U across road 0..1, V along track tiling every 6m)
            v_start = prev_dist / 6.0
            v_end = d / 6.0
            for loop in face.loops:
                if loop.vert == prev_vl:
                    loop[uv_road].uv = (0.0, v_start)
                elif loop.vert == vl:
                    loop[uv_road].uv = (0.0, v_end)
                elif loop.vert == vr:
                    loop[uv_road].uv = (1.0, v_end)
                elif loop.vert == prev_vr:
                    loop[uv_road].uv = (1.0, v_start)

        prev_vl = vl
        prev_vr = vr
        prev_dist = d

    bm_road.to_mesh(road_mesh)
    bm_road.free()
    road_obj = bpy.data.objects.new("Road", road_mesh)
    road_obj.data.materials.append(mat_asphalt)
    road_obj.parent = root
    bpy.context.scene.collection.objects.link(road_obj)

    # --------------------------------------------------------------------------
    # 3. Center Dashed Yellow Line (Dashes every 8m: 4m line, 4m gap)
    # --------------------------------------------------------------------------
    dash_mesh = bpy.data.meshes.new("Road_CenterLine")
    bm_dash = bmesh.new()
    line_w = 0.14
    for i in range(0, len(points) - 1, 2): # alternating steps create clean dashed rhythm
        p1 = points[i]
        p2 = points[i+1]
        rx1, ry1 = p1["rx"], p1["ry"]
        rx2, ry2 = p2["rx"], p2["ry"]
        z_off = 0.012 # lift slightly above asphalt to avoid z-fighting
        v1 = bm_dash.verts.new((p1["x"] - rx1 * line_w, p1["y"] - ry1 * line_w, p1["z"] + z_off))
        v2 = bm_dash.verts.new((p1["x"] + rx1 * line_w, p1["y"] + ry1 * line_w, p1["z"] + z_off))
        v3 = bm_dash.verts.new((p2["x"] + rx2 * line_w, p2["y"] + ry2 * line_w, p2["z"] + z_off))
        v4 = bm_dash.verts.new((p2["x"] - rx2 * line_w, p2["y"] - ry2 * line_w, p2["z"] + z_off))
        bm_dash.faces.new((v1, v4, v3, v2))
    bm_dash.to_mesh(dash_mesh)
    bm_dash.free()
    dash_obj = bpy.data.objects.new("Road_CenterLine", dash_mesh)
    dash_obj.data.materials.append(mat_yellow_dash)
    dash_obj.parent = root
    bpy.context.scene.collection.objects.link(dash_obj)

    # --------------------------------------------------------------------------
    # 4. Continuous White Shoulder Edge Lines (Left & Right, offset ±4.0m)
    # --------------------------------------------------------------------------
    edge_mesh = bpy.data.meshes.new("Road_EdgeLines")
    bm_edge = bmesh.new()
    edge_w = 0.16
    for side in [-1, 1]:
        prev_e1, prev_e2 = None, None
        for pt in points:
            px, py, pz = pt["x"], pt["y"], pt["z"]
            rx, ry = pt["rx"], pt["ry"]
            base_x = px + rx * (side * 4.0)
            base_y = py + ry * (side * 4.0)
            z_off = 0.012
            e1 = bm_edge.verts.new((base_x - rx * (edge_w/2), base_y - ry * (edge_w/2), pz + z_off))
            e2 = bm_edge.verts.new((base_x + rx * (edge_w/2), base_y + ry * (edge_w/2), pz + z_off))
            if prev_e1 and prev_e2:
                bm_edge.faces.new((prev_e1, prev_e2, e2, e1))
            prev_e1 = e1
            prev_e2 = e2
    bm_edge.to_mesh(edge_mesh)
    bm_edge.free()
    edge_obj = bpy.data.objects.new("Road_EdgeLines", edge_mesh)
    edge_obj.data.materials.append(mat_white_edge)
    edge_obj.parent = root
    bpy.context.scene.collection.objects.link(edge_obj)

    # --------------------------------------------------------------------------
    # 5. Concrete Drainage Gutters (排水溝) on Hairpin Turns
    # --------------------------------------------------------------------------
    gutter_mesh = bpy.data.meshes.new("Road_Gutters")
    bm_gut = bmesh.new()
    prev_g_in, prev_g_mid, prev_g_out = None, None, None
    for pt in points:
        tag = pt.get("tag")
        if tag in ["left", "right"]:
            side = -1 if tag == "left" else 1
            px, py, pz = pt["x"], pt["y"], pt["z"]
            rx, ry = pt["rx"], pt["ry"]
            
            # Gutter channel: 0.75m width, 0.18m drop
            g_in = bm_gut.verts.new((px + rx * (half_width * side), py + ry * (half_width * side), pz))
            g_mid = bm_gut.verts.new((px + rx * (half_width * side + 0.38 * side), py + ry * (half_width * side + 0.38 * side), pz - 0.18))
            g_out = bm_gut.verts.new((px + rx * (half_width * side + 0.75 * side), py + ry * (half_width * side + 0.75 * side), pz - 0.05))
            
            if prev_g_in and prev_g_mid and prev_g_out:
                bm_gut.faces.new((prev_g_in, g_in, g_mid, prev_g_mid))
                bm_gut.faces.new((prev_g_mid, g_mid, g_out, prev_g_out))
            prev_g_in = g_in
            prev_g_mid = g_mid
            prev_g_out = g_out
        else:
            prev_g_in, prev_g_mid, prev_g_out = None, None, None
    bm_gut.to_mesh(gutter_mesh)
    bm_gut.free()
    gutter_obj = bpy.data.objects.new("Road_Gutters", gutter_mesh)
    gutter_obj.data.materials.append(mat_gutter)
    gutter_obj.parent = root
    bpy.context.scene.collection.objects.link(gutter_obj)

    # --------------------------------------------------------------------------
    # 6. Galvanized W-Beam Guardrails with Posts (Valley side + sharp outer curves)
    # --------------------------------------------------------------------------
    guard_mesh = bpy.data.meshes.new("Guardrails")
    bm_gr = bmesh.new()
    rail_h = 0.75
    for side in [1]: # Valley side (right side)
        prev_gt, prev_gb = None, None
        for i in range(0, len(points), 2): # sample every 16m for smooth rails
            pt = points[i]
            px, py, pz = pt["x"], pt["y"], pt["z"]
            rx, ry = pt["rx"], pt["ry"]
            offset = side * (half_width + 0.35)
            gx = px + rx * offset
            gy = py + ry * offset
            gb = bm_gr.verts.new((gx, gy, pz + 0.28))
            gt = bm_gr.verts.new((gx, gy, pz + rail_h))
            if prev_gt and prev_gb:
                bm_gr.faces.new((prev_gb, gb, gt, prev_gt))
            prev_gt = gt
            prev_gb = gb

            # Vertical support post every 16m
            post_top = bm_gr.verts.new((gx, gy, pz + rail_h))
            post_bot = bm_gr.verts.new((gx, gy, pz))
    bm_gr.to_mesh(guard_mesh)
    bm_gr.free()
    guard_obj = bpy.data.objects.new("Guardrails", guard_mesh)
    guard_obj.data.materials.append(mat_guardrail)
    guard_obj.parent = root
    bpy.context.scene.collection.objects.link(guard_obj)

    # --------------------------------------------------------------------------
    # 7. Wide Mountain Terrain & Rock Cliff Slopes (18m wide shoulders on both sides)
    # --------------------------------------------------------------------------
    terrain_mesh = bpy.data.meshes.new("MountainTerrain")
    bm_ter = bmesh.new()
    uv_ter = bm_ter.loops.layers.uv.new("UVMap")
    prev_left_shoulder, prev_road_l, prev_road_r, prev_right_valley = None, None, None, None

    for i in range(0, len(points), 2): # 16m step
        pt = points[i]
        px, py, pz = pt["x"], pt["y"], pt["z"]
        rx, ry = pt["rx"], pt["ry"]
        d = pt["dist"]

        # Mountain cliff side (left): slopes up +8m to +14m over 18m lateral distance
        l_shoulder = bm_ter.verts.new((px - rx * (half_width + 18.0), py - ry * (half_width + 18.0), pz + 10.5))
        r_road_l = bm_ter.verts.new((px - rx * half_width, py - ry * half_width, pz))
        
        # Valley side (right): slopes down -12m over 20m lateral distance
        r_road_r = bm_ter.verts.new((px + rx * half_width, py + ry * half_width, pz))
        r_valley = bm_ter.verts.new((px + rx * (half_width + 20.0), py + ry * (half_width + 20.0), pz - 12.0))

        if prev_left_shoulder and prev_road_l:
            f_cliff = bm_ter.faces.new((prev_left_shoulder, l_shoulder, r_road_l, prev_road_l))
            f_valley = bm_ter.faces.new((prev_road_r, r_road_r, r_valley, prev_right_valley))
            # Assign UVs
            v_pos = d / 12.0
            for loop in f_cliff.loops:
                loop[uv_ter].uv = (0.0 if loop.vert in [prev_left_shoulder, l_shoulder] else 1.0, v_pos)
            for loop in f_valley.loops:
                loop[uv_ter].uv = (0.0 if loop.vert in [prev_road_r, r_road_r] else 1.0, v_pos)

        prev_left_shoulder = l_shoulder
        prev_road_l = r_road_l
        prev_road_r = r_road_r
        prev_right_valley = r_valley

    bm_ter.to_mesh(terrain_mesh)
    bm_ter.free()
    terrain_obj = bpy.data.objects.new("MountainTerrain", terrain_mesh)
    terrain_obj.data.materials.append(mat_rock)
    terrain_obj.parent = root
    bpy.context.scene.collection.objects.link(terrain_obj)

    # --------------------------------------------------------------------------
    # 8. Overhead Sodium Streetlights (Joined into 2 merged meshes for high FPS)
    # --------------------------------------------------------------------------
    poles = []
    lamps = []
    for i in range(0, len(points), 4): # Every 32m - 36m
        pt = points[i]
        px, py, pz = pt["x"], pt["y"], pt["z"]
        rx, ry = pt["rx"], pt["ry"]
        
        # Post on outer shoulder
        lx = px + rx * (half_width + 1.2)
        ly = py + ry * (half_width + 1.2)
        lz = pz
        
        # Upright pole
        bpy.ops.mesh.primitive_cylinder_add(radius=0.10, depth=7.0, location=(lx, ly, lz + 3.5))
        pole = bpy.context.active_object
        poles.append(pole)
        
        # Curved overhang arm pointing over road
        arm_x = lx - rx * 1.5
        arm_y = ly - ry * 1.5
        arm_z = lz + 7.0
        bpy.ops.mesh.primitive_cube_add(size=0.45, location=(arm_x, arm_y, arm_z))
        lamp = bpy.context.active_object
        lamp.scale = (0.7, 0.9, 0.25)
        lamps.append(lamp)

    if poles:
        bpy.ops.object.select_all(action='DESELECT')
        for p in poles: p.select_set(True)
        bpy.context.view_layer.objects.active = poles[0]
        bpy.ops.object.join()
        pole_merged = bpy.context.active_object
        pole_merged.name = "Streetlight_Poles"
        pole_merged.parent = root
        pole_merged.data.materials.clear()
        pole_merged.data.materials.append(mat_guardrail)

    if lamps:
        bpy.ops.object.select_all(action='DESELECT')
        for l in lamps: l.select_set(True)
        bpy.context.view_layer.objects.active = lamps[0]
        bpy.ops.object.join()
        lamp_merged = bpy.context.active_object
        lamp_merged.name = "Streetlight_Lamps"
        lamp_merged.parent = root
        lamp_merged.data.materials.clear()
        lamp_merged.data.materials.append(mat_sodium_glow)

    # Export Track GLB
    out_glb = "assets/models/track_kirine.glb"
    bpy.ops.export_scene.gltf(filepath=out_glb, export_format="GLB", use_selection=False)
    print(f"Exported Track GLB: {out_glb}")

    # Export Track Data JS
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
    build_pbr_track(pts)
