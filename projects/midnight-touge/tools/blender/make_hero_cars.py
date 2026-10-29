#!/usr/bin/env python3
"""
Midnight Touge hero cars — Blender 5.2.3 headless.
Dense lofted cage → Bevel+Subsurf bake. Wheel_* empties preserved.
PBR clearcoat / glass / emissive. Never run gltf-transform optimize.
"""
from __future__ import annotations
import bpy
import bmesh
import math
import os
import shutil
from mathutils import Vector

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT_DIR = os.path.join(ROOT, "assets", "models")
RENDER_DIR = os.path.join(ROOT, "assets", "renders")
os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(RENDER_DIR, exist_ok=True)


def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def link(obj):
    if obj.name not in bpy.context.scene.collection.objects:
        bpy.context.scene.collection.objects.link(obj)
    return obj


def parent_keep(obj, parent):
    mw = obj.matrix_world.copy()
    obj.parent = parent
    obj.matrix_world = mw


def shade_smooth(obj):
    for p in obj.data.polygons:
        p.use_smooth = True
    try:
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.shade_smooth()
    except Exception:
        pass


def bake_mods(obj):
    if not obj.modifiers:
        return
    for mod in obj.modifiers:
        if mod.type == "SUBSURF" and hasattr(mod, "use_gpu_subdivision"):
            mod.use_gpu_subdivision = False
    dg = bpy.context.evaluated_depsgraph_get()
    ev = obj.evaluated_get(dg)
    mesh = bpy.data.meshes.new_from_object(ev, preserve_all_data_layers=True, depsgraph=dg)
    old = obj.data
    obj.modifiers.clear()
    obj.data = mesh
    if old.users == 0:
        bpy.data.meshes.remove(old)


def mat_pbr(name, base=(0.8, 0.8, 0.8, 1), metallic=0.0, roughness=0.4,
            emission=(0, 0, 0, 1), emission_strength=0.0, clearcoat=0.0,
            transmission=0.0, alpha=1.0, ior=1.45):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if not bsdf:
        return mat
    bsdf.inputs["Base Color"].default_value = base
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if "Coat Weight" in bsdf.inputs:
        bsdf.inputs["Coat Weight"].default_value = clearcoat
        if clearcoat > 0 and "Coat Roughness" in bsdf.inputs:
            bsdf.inputs["Coat Roughness"].default_value = 0.03
    if "Emission Color" in bsdf.inputs:
        bsdf.inputs["Emission Color"].default_value = emission
        bsdf.inputs["Emission Strength"].default_value = emission_strength
    if transmission > 0 and "Transmission Weight" in bsdf.inputs:
        bsdf.inputs["Transmission Weight"].default_value = transmission
    if "IOR" in bsdf.inputs:
        bsdf.inputs["IOR"].default_value = ior
    if alpha < 1.0 and "Alpha" in bsdf.inputs:
        bsdf.inputs["Alpha"].default_value = alpha
        mat.blend_method = "BLEND"
    return mat


def polish(obj, bevel=0.01, segments=3, levels=2):
    b = obj.modifiers.new("Bevel", "BEVEL")
    b.width = bevel
    b.segments = segments
    b.limit_method = "ANGLE"
    b.angle_limit = math.radians(28)
    b.miter_outer = "MITER_ARC"
    s = obj.modifiers.new("Subsurf", "SUBSURF")
    s.levels = levels
    s.render_levels = levels
    if hasattr(s, "use_gpu_subdivision"):
        s.use_gpu_subdivision = False
    bake_mods(obj)
    shade_smooth(obj)


def _ring16(y, half_w, z_bot, z_belt, z_roof, cabin_inset=0.78, nose_taper=1.0):
    """16-pt cross-section for denser loft."""
    hw = half_w * nose_taper
    hw_cab = hw * cabin_inset
    z_mid = (z_bot + z_belt) * 0.5
    pts = [
        (-hw * 0.40, y, z_bot),              # 0 under L
        (-hw * 0.78, y, z_bot + 0.05),       # 1 rocker in L
        (-hw * 0.98, y, z_bot + 0.12),       # 2 rocker out L
        (-hw,        y, z_mid),              # 3 lower mid L
        (-hw,        y, z_belt * 0.78),      # 4 door L
        (-hw,        y, z_belt),             # 5 belt L
        (-hw_cab,    y, z_belt + 0.05),      # 6 A-pillar base L
        (-hw_cab * 0.92, y, (z_belt + z_roof) * 0.55),  # 7 pillar L
        (-hw_cab * 0.75, y, z_roof * 0.95),  # 8 roof rail L
        (-hw_cab * 0.25, y, z_roof),         # 9 roof L
        ( hw_cab * 0.25, y, z_roof),         # 10 roof R
        ( hw_cab * 0.75, y, z_roof * 0.95),  # 11 roof rail R
        ( hw_cab * 0.92, y, (z_belt + z_roof) * 0.55),  # 12 pillar R
        ( hw_cab,    y, z_belt + 0.05),      # 13 A-pillar base R
        ( hw,        y, z_belt),             # 14 belt R
        ( hw,        y, z_belt * 0.78),      # 15 door R
        ( hw,        y, z_mid),              # 16 lower mid R
        ( hw * 0.98, y, z_bot + 0.12),       # 17 rocker out R
        ( hw * 0.78, y, z_bot + 0.05),       # 18 rocker in R
        ( hw * 0.40, y, z_bot),              # 19 under R
    ]
    return pts


def build_cage_body(name, material, length=4.2, width=1.66, wheelbase=2.48,
                    belt_z=0.56, roof_z=1.30, style="hatch"):
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)
    link(obj)
    bm = bmesh.new()

    half_l = length * 0.5
    half_w = width * 0.5
    y_f = wheelbase * 0.5
    y_r = -wheelbase * 0.5
    wr = 0.31

    if style == "coupe":
        stations = [
            ( half_l,           0.38, 0.50, 0.20, 0.40, 0.46),
            ( half_l * 0.92,    0.62, 0.55, 0.15, 0.48, 0.52),
            ( half_l * 0.80,    0.82, 0.62, 0.13, 0.52, 0.56),
            ( half_l * 0.68,    0.94, 0.70, 0.12, 0.54, 0.58),
            ( y_f + 0.22,       1.00, 0.78, 0.12, 0.55, 0.62),
            ( y_f + 0.08,       1.00, 0.80, 0.12 + wr * 0.35, 0.56, 0.66),
            ( y_f,              1.00, 0.82, 0.12 + wr * 0.90, 0.56, 0.72),
            ( y_f - 0.10,       1.00, 0.82, 0.12 + wr * 0.35, 0.56, 0.82),
            ( y_f - 0.28,       1.01, 0.80, 0.12, 0.56, 0.98),
            ( 0.40,             1.03, 0.76, 0.12, 0.55, roof_z),
            ( 0.05,             1.04, 0.74, 0.12, 0.55, roof_z),
            (-0.35,             1.03, 0.74, 0.12, 0.54, roof_z * 0.98),
            ( y_r + 0.28,       1.00, 0.76, 0.12, 0.54, roof_z * 0.88),
            ( y_r + 0.10,       0.99, 0.78, 0.12 + wr * 0.35, 0.54, 0.78),
            ( y_r,              0.97, 0.80, 0.12 + wr * 0.92, 0.53, 0.68),
            ( y_r - 0.12,       0.94, 0.76, 0.12 + wr * 0.35, 0.52, 0.60),
            ( y_r - 0.30,       0.86, 0.70, 0.12, 0.50, 0.56),
            (-half_l * 0.88,    0.68, 0.60, 0.14, 0.46, 0.52),
            (-half_l,           0.42, 0.50, 0.20, 0.40, 0.46),
        ]
    elif style == "hothatch":
        stations = [
            ( half_l,           0.42, 0.52, 0.20, 0.42, 0.48),
            ( half_l * 0.90,    0.68, 0.60, 0.15, 0.50, 0.55),
            ( half_l * 0.76,    0.88, 0.70, 0.13, 0.54, 0.58),
            ( half_l * 0.62,    0.96, 0.76, 0.12, 0.55, 0.62),
            ( y_f + 0.18,       1.00, 0.80, 0.12, 0.56, 0.68),
            ( y_f + 0.06,       1.00, 0.82, 0.12 + wr * 0.35, 0.56, 0.74),
            ( y_f,              1.00, 0.82, 0.12 + wr * 0.88, 0.56, 0.80),
            ( y_f - 0.10,       1.00, 0.82, 0.12 + wr * 0.35, 0.56, 0.90),
            ( y_f - 0.28,       1.01, 0.80, 0.12, 0.56, 1.05),
            ( 0.30,             1.03, 0.76, 0.12, 0.56, roof_z),
            (-0.05,             1.04, 0.74, 0.12, 0.56, roof_z),
            (-0.45,             1.02, 0.74, 0.12, 0.55, roof_z * 0.97),
            ( y_r + 0.22,       1.00, 0.76, 0.12, 0.54, 0.90),
            ( y_r + 0.08,       0.98, 0.78, 0.12 + wr * 0.35, 0.54, 0.80),
            ( y_r,              0.96, 0.80, 0.12 + wr * 0.90, 0.53, 0.70),
            ( y_r - 0.12,       0.92, 0.74, 0.12 + wr * 0.35, 0.52, 0.62),
            ( y_r - 0.28,       0.84, 0.68, 0.12, 0.50, 0.56),
            (-half_l * 0.86,    0.66, 0.58, 0.14, 0.46, 0.52),
            (-half_l,           0.44, 0.50, 0.20, 0.40, 0.48),
        ]
    else:  # hatch AE86-like
        stations = [
            ( half_l,           0.44, 0.52, 0.20, 0.42, 0.48),
            ( half_l * 0.92,    0.64, 0.58, 0.15, 0.50, 0.54),
            ( half_l * 0.82,    0.80, 0.66, 0.13, 0.53, 0.56),
            ( half_l * 0.70,    0.92, 0.72, 0.12, 0.55, 0.58),
            ( y_f + 0.24,       1.00, 0.78, 0.12, 0.56, 0.62),
            ( y_f + 0.10,       1.00, 0.80, 0.12 + wr * 0.35, 0.56, 0.68),
            ( y_f,              1.00, 0.82, 0.12 + wr * 0.90, 0.56, 0.74),
            ( y_f - 0.10,       1.00, 0.82, 0.12 + wr * 0.35, 0.56, 0.86),
            ( y_f - 0.28,       1.01, 0.80, 0.12, 0.56, 1.02),
            ( 0.35,             1.03, 0.76, 0.12, 0.56, roof_z),
            ( 0.00,             1.04, 0.74, 0.12, 0.56, roof_z),
            (-0.40,             1.03, 0.74, 0.12, 0.55, roof_z * 0.99),
            (-0.70,             1.01, 0.76, 0.12, 0.55, roof_z * 0.96),
            ( y_r + 0.24,       1.00, 0.78, 0.12, 0.54, 0.92),
            ( y_r + 0.08,       0.98, 0.80, 0.12 + wr * 0.35, 0.54, 0.80),
            ( y_r,              0.97, 0.80, 0.12 + wr * 0.92, 0.53, 0.70),
            ( y_r - 0.12,       0.93, 0.74, 0.12 + wr * 0.35, 0.52, 0.60),
            ( y_r - 0.28,       0.84, 0.68, 0.12, 0.50, 0.55),
            (-half_l * 0.88,    0.66, 0.58, 0.14, 0.46, 0.52),
            (-half_l,           0.46, 0.52, 0.20, 0.40, 0.48),
        ]

    rings = []
    for (y, taper, inset, zb, zbe, zr) in stations:
        pts = _ring16(y, half_w, zb, zbe, zr, cabin_inset=inset, nose_taper=taper)
        rings.append([bm.verts.new(p) for p in pts])

    bm.verts.ensure_lookup_table()
    n = len(rings[0])
    for i in range(len(rings) - 1):
        for j in range(n):
            j2 = (j + 1) % n
            try:
                bm.faces.new((rings[i][j], rings[i][j2], rings[i + 1][j2], rings[i + 1][j]))
            except ValueError:
                pass

    def cap(ring, flip):
        c = Vector((0, 0, 0))
        for v in ring:
            c += v.co
        c /= len(ring)
        cv = bm.verts.new(c)
        for j in range(n):
            j2 = (j + 1) % n
            verts = (cv, ring[j2], ring[j]) if flip else (cv, ring[j], ring[j2])
            try:
                bm.faces.new(verts)
            except ValueError:
                pass

    cap(rings[0], False)
    cap(rings[-1], True)

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bmesh.ops.smooth_vert(bm, verts=list(bm.verts), factor=0.35,
                          use_axis_x=True, use_axis_y=True, use_axis_z=True)

    bm.to_mesh(mesh)
    bm.free()
    mesh.materials.append(material)
    # body polish — levels=1 + strong bevel keeps curves without 80k tris
    polish(obj, bevel=0.018, segments=4, levels=1)
    return obj, y_f, y_r, half_w


def make_glass(name, verts, material, parent):
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)
    link(obj)
    bm = bmesh.new()
    vs = [bm.verts.new(v) for v in verts]
    bm.faces.new(vs)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    # subdivide glass once for slight curve after solidify
    bmesh.ops.subdivide_edges(bm, edges=list(bm.edges), cuts=2, use_grid_fill=True)
    bm.to_mesh(mesh)
    bm.free()
    mesh.materials.append(material)
    sol = obj.modifiers.new("Sol", "SOLIDIFY")
    sol.thickness = 0.014
    bake_mods(obj)
    shade_smooth(obj)
    parent_keep(obj, parent)
    return obj


def make_box(name, loc, scale, material, parent, bevel=0.012, levels=0, segments=2):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=loc)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(scale=True)
    obj.data.materials.append(material)
    if bevel > 0:
        b = obj.modifiers.new("Bevel", "BEVEL")
        b.width = bevel
        b.segments = segments
        b.limit_method = "ANGLE"
        b.angle_limit = math.radians(30)
        if levels > 0:
            s = obj.modifiers.new("Subsurf", "SUBSURF")
            s.levels = levels
            s.render_levels = levels
            if hasattr(s, "use_gpu_subdivision"):
                s.use_gpu_subdivision = False
        bake_mods(obj)
    shade_smooth(obj)
    parent_keep(obj, parent)
    return obj


def make_wheel(parent, name, x, y, z, tire_r=0.31, tire_w=0.21,
               rim_color=(0.85, 0.85, 0.88, 1), spokes=5):
    empty = bpy.data.objects.new(name, None)
    link(empty)
    empty.parent = parent
    empty.location = (x, y, z)
    out = 1.0 if x >= 0 else -1.0

    mat_rub = mat_pbr(f"{name}_Rubber", base=(0.02, 0.02, 0.025, 1), roughness=0.92)
    mat_rim = mat_pbr(f"{name}_Rim", base=rim_color, metallic=0.98, roughness=0.12, clearcoat=0.7)
    mat_disc = mat_pbr(f"{name}_Disc", base=(0.40, 0.40, 0.42, 1), metallic=0.95, roughness=0.25)
    mat_cal = mat_pbr(f"{name}_Cal", base=(0.72, 0.04, 0.04, 1), metallic=0.35, roughness=0.32)

    # Tire — torus with more segs
    bpy.ops.mesh.primitive_torus_add(
        major_radius=tire_r * 0.78, minor_radius=tire_r * 0.24,
        major_segments=36, minor_segments=12,
    )
    tire = bpy.context.active_object
    tire.name = f"{name}_Tire"
    tire.rotation_euler = (0, math.pi / 2, 0)
    tire.scale = ((tire_w * 0.52) / (tire_r * 0.24), 1.0, 1.0)
    bpy.ops.object.transform_apply(scale=True)
    tire.parent = empty
    tire.data.materials.append(mat_rub)
    shade_smooth(tire)

    # Outer lip (chrome ring)
    bpy.ops.mesh.primitive_torus_add(
        major_radius=tire_r * 0.62, minor_radius=0.012,
        major_segments=32, minor_segments=8,
    )
    lip = bpy.context.active_object
    lip.name = f"{name}_Lip"
    lip.rotation_euler = (0, math.pi / 2, 0)
    lip.parent = empty
    lip.location = (out * tire_w * 0.22, 0, 0)
    lip.data.materials.append(mat_rim)
    shade_smooth(lip)

    # Rim barrel (deep dish)
    bpy.ops.mesh.primitive_cylinder_add(radius=tire_r * 0.55, depth=tire_w * 0.38, vertices=36)
    barrel = bpy.context.active_object
    barrel.name = f"{name}_Barrel"
    barrel.rotation_euler = (0, math.pi / 2, 0)
    barrel.parent = empty
    barrel.location = (out * 0.01, 0, 0)
    barrel.data.materials.append(mat_rim)
    shade_smooth(barrel)

    # Hub center
    bpy.ops.mesh.primitive_cylinder_add(radius=tire_r * 0.14, depth=0.05, vertices=24)
    hub = bpy.context.active_object
    hub.name = f"{name}_Hub"
    hub.rotation_euler = (0, math.pi / 2, 0)
    hub.parent = empty
    hub.location = (out * tire_w * 0.28, 0, 0)
    hub.data.materials.append(mat_rim)
    polish(hub, bevel=0.004, segments=2, levels=1)

    # Y / multi spokes — thin elongated boxes with polish so they read clearly
    for i in range(spokes):
        ang = 2 * math.pi * i / spokes
        length = tire_r * 0.48
        bpy.ops.mesh.primitive_cube_add(size=1)
        sp = bpy.context.active_object
        sp.name = f"{name}_Spoke{i}"
        # wider face toward camera (X after rotation)
        sp.scale = (0.022, 0.055, length * 0.52)
        bpy.ops.object.transform_apply(scale=True)
        shade_smooth(sp)
        sp.parent = empty
        # place spoke mid-radius, facing outward
        sp.location = (
            out * tire_w * 0.26,
            math.sin(ang) * length * 0.48,
            math.cos(ang) * length * 0.48,
        )
        sp.rotation_euler = (ang, 0, 0)
        sp.data.materials.clear()
        sp.data.materials.append(mat_rim)

    # Brake disc + caliper
    bpy.ops.mesh.primitive_cylinder_add(radius=tire_r * 0.38, depth=0.012, vertices=32)
    disc = bpy.context.active_object
    disc.name = f"{name}_Disc"
    disc.rotation_euler = (0, math.pi / 2, 0)
    disc.parent = empty
    disc.location = (-out * 0.05, 0, 0)
    disc.data.materials.append(mat_disc)
    shade_smooth(disc)

    bpy.ops.mesh.primitive_cube_add(size=1)
    cal = bpy.context.active_object
    cal.name = f"{name}_Cal"
    cal.scale = (0.035, 0.055, 0.095)
    bpy.ops.object.transform_apply(scale=True)
    polish(cal, bevel=0.004, segments=2, levels=1)
    cal.parent = empty
    cal.location = (-out * 0.04, 0, tire_r * 0.24)
    cal.data.materials.append(mat_cal)
    return empty


def count_tris():
    n = 0
    for o in bpy.data.objects:
        if o.type == "MESH" and o.data:
            o.data.calc_loop_triangles()
            n += len(o.data.loop_triangles)
    return n



def decimate_to_budget(max_tris=45000):
    """If over budget, proportionally decimate largest meshes."""
    meshes = [o for o in bpy.data.objects if o.type == "MESH" and o.data]
    total = count_tris()
    if total <= max_tris:
        print(f"tris ok {total}")
        return
    print(f"tris {total} over budget, decimating...")
    # sort by tri count desc
    scored = []
    for o in meshes:
        o.data.calc_loop_triangles()
        scored.append((len(o.data.loop_triangles), o))
    scored.sort(key=lambda x: x[0], reverse=True)
    for tris, o in scored:
        if count_tris() <= max_tris:
            break
        if tris < 500:
            continue
        ratio = min(0.85, max_tris / max(count_tris(), 1))
        # only decimate body-like large meshes hard
        name = o.name.lower()
        if "body" in name:
            ratio = max(0.78, min(0.92, ratio))  # never destroy body curves
        elif "tire" in name:
            ratio = min(0.65, ratio)
        else:
            ratio = min(0.80, ratio)
        d = o.modifiers.new("Dec", "DECIMATE")
        d.ratio = ratio
        bake_mods(o)
        print(f"  decimated {o.name} ratio={ratio:.2f} now={count_tris()}")
    print(f"tris after decimate={count_tris()}")


def export_glb(path):
    bpy.ops.export_scene.gltf(
        filepath=path, export_format="GLB", use_selection=False,
        export_apply=True, export_yup=True,
    )
    print(f"Exported {path} tris={count_tris()} bytes={os.path.getsize(path)}")


def setup_studio():
    bpy.ops.mesh.primitive_plane_add(size=50, location=(0, 0, 0))
    fl = bpy.context.active_object
    fl.data.materials.append(
        mat_pbr("WetAsphalt", base=(0.012, 0.014, 0.018, 1), metallic=0.45, roughness=0.06)
    )

    world = bpy.data.worlds.new("W")
    bpy.context.scene.world = world
    world.use_nodes = True
    nt = world.node_tree
    nt.nodes.clear()
    bg = nt.nodes.new("ShaderNodeBackground")
    bg.inputs[0].default_value = (0.003, 0.006, 0.012, 1)
    bg.inputs[1].default_value = 0.35
    out = nt.nodes.new("ShaderNodeOutputWorld")
    nt.links.new(bg.outputs[0], out.inputs[0])

    def area(loc, E, col, size, rot):
        bpy.ops.object.light_add(type="AREA", location=loc)
        L = bpy.context.active_object
        L.data.energy = E
        L.data.color = col
        L.data.size = size
        L.rotation_euler = rot

    # Key warm streetlight, cool rim, fill, bounce
    area((5.0, 4.5, 3.8), 680, (1.0, 0.70, 0.35), 2.8, (math.radians(50), 0, math.radians(35)))
    area((-4.0, -3.0, 2.8), 220, (0.25, 0.45, 1.0), 5.0, (math.radians(55), 0, math.radians(-50)))
    area((0.5, -5.5, 2.0), 260, (0.85, 0.92, 1.0), 3.5, (math.radians(65), 0, math.radians(180)))
    area((1.5, 2.0, 0.4), 110, (1.0, 0.95, 0.85), 2.0, (math.radians(90), 0, 0))

    bpy.ops.object.camera_add(location=(4.8, 3.6, 1.25))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(82), 0, math.radians(128))
    cam.data.lens = 50
    bpy.context.scene.camera = cam

    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.cycles.samples = 96
    sc.cycles.use_denoising = True
    sc.render.resolution_x = 780
    sc.render.resolution_y = 980
    sc.render.image_settings.file_format = "PNG"
    sc.view_settings.view_transform = "Filmic"
    sc.view_settings.look = "Medium High Contrast"


def render_beauty(fn):
    setup_studio()
    path = os.path.join(RENDER_DIR, fn)
    bpy.context.scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    print(f"Rendered {path}")


def width_safe(half_w):
    return half_w * 2


def _add_common_details(root, tag, half_w, half_l, y_f, y_r, roof_z, belt_z,
                        paint, black, glass, chrome, trim, hl, tl, amber, style):
    make_glass(f"{tag}_WS", [
        (-0.50, 0.92, belt_z + 0.08), (0.50, 0.92, belt_z + 0.08),
        (0.42, 0.22, roof_z - 0.04), (-0.42, 0.22, roof_z - 0.04),
    ], glass, root)
    make_glass(f"{tag}_RG", [
        (-0.46, -0.65, roof_z - 0.05), (0.46, -0.65, roof_z - 0.05),
        (0.50, -1.40, belt_z + 0.10), (-0.50, -1.40, belt_z + 0.10),
    ], glass, root)
    for sx in (-1, 1):
        make_glass(f"{tag}_SG{sx}", [
            (sx * half_w * 0.97, 0.50, belt_z + 0.06),
            (sx * half_w * 0.97, -0.60, belt_z + 0.06),
            (sx * half_w * 0.70, -0.70, roof_z - 0.06),
            (sx * half_w * 0.70, 0.35, roof_z - 0.06),
        ], glass, root)

    for sx in (-1, 1):
        if style == "coupe":
            make_box(f"{tag}_Pop{sx}", (sx * 0.44, half_l - 0.26, belt_z + 0.05),
                     (0.26, 0.24, 0.09), paint, root, bevel=0.01, levels=2)
            make_box(f"{tag}_HL{sx}", (sx * 0.44, half_l - 0.12, belt_z + 0.05),
                     (0.22, 0.04, 0.07), hl, root, bevel=0.005, levels=1)
        else:
            make_box(f"{tag}_HL{sx}", (sx * 0.48, half_l - 0.06, 0.52),
                     (0.30, 0.06, 0.12), hl, root, bevel=0.008, levels=2)
            make_box(f"{tag}_Bez{sx}", (sx * 0.48, half_l - 0.11, 0.52),
                     (0.34, 0.035, 0.15), chrome, root, bevel=0.005, levels=1)
            # glass lens cover
            make_box(f"{tag}_Lens{sx}", (sx * 0.48, half_l - 0.03, 0.52),
                     (0.28, 0.02, 0.10), glass, root, bevel=0.004, levels=1)
        make_box(f"{tag}_Ind{sx}", (sx * 0.76, half_l - 0.08, 0.38),
                 (0.09, 0.04, 0.06), amber, root, bevel=0.004, levels=1)
        if style == "coupe":
            bpy.ops.mesh.primitive_cylinder_add(radius=0.085, depth=0.045,
                                                location=(sx * 0.55, -half_l + 0.04, 0.55))
            t = bpy.context.active_object
            t.name = f"{tag}_TL{sx}"
            t.rotation_euler = (math.pi / 2, 0, 0)
            t.data.materials.append(tl)
            polish(t, bevel=0.004, segments=2, levels=1)
            parent_keep(t, root)
        else:
            make_box(f"{tag}_TL{sx}", (sx * 0.50, -half_l + 0.04, 0.55),
                     (0.32, 0.05, 0.11), tl, root, bevel=0.006, levels=1)
        make_box(f"{tag}_Mir{sx}", (sx * (half_w + 0.03), 0.52, belt_z + 0.28),
                 (0.10, 0.12, 0.07), black, root, bevel=0.01, levels=2)

    make_box(f"{tag}_BumperF", (0, half_l - 0.02, 0.24),
             (width_safe(half_w) * 0.94, 0.10, 0.22), black, root, bevel=0.02, levels=1)
    make_box(f"{tag}_BumperR", (0, -half_l + 0.02, 0.24),
             (width_safe(half_w) * 0.94, 0.10, 0.20), black, root, bevel=0.02, levels=1)
    make_box(f"{tag}_Grille", (0, half_l - 0.01, 0.36),
             (0.65, 0.04, 0.12), trim, root, bevel=0.004, levels=1)
    make_box(f"{tag}_Belt", (0, 0.0, belt_z),
             (half_w * 2.01, 2.5, 0.014), trim, root, bevel=0.002, levels=1)

    if style == "hatch":
        make_box(f"{tag}_Spoiler", (0, -0.92, roof_z - 0.01),
                 (1.10, 0.12, 0.025), black, root, bevel=0.006, levels=2)
    elif style == "coupe":
        make_box(f"{tag}_Wing", (0, -half_l + 0.16, roof_z - 0.04),
                 (1.45, 0.26, 0.03), black, root, bevel=0.008, levels=2)
        for sx in (-1, 1):
            make_box(f"{tag}_Stay{sx}", (sx * 0.46, -half_l + 0.20, roof_z - 0.18),
                     (0.035, 0.07, 0.25), black, root, bevel=0.004, levels=1)
    else:
        make_box(f"{tag}_RoofWing", (0, -0.88, roof_z),
                 (1.15, 0.14, 0.03), black, root, bevel=0.006, levels=2)

    if tag == "H86":
        make_box(f"{tag}_Rocker", (0, 0.0, 0.20),
                 (half_w * 1.94, 3.4, 0.12), black, root, bevel=0.016, levels=1)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.032, depth=0.09,
                                        location=(0.40, -half_l + 0.01, 0.16))
    ex = bpy.context.active_object
    ex.name = f"{tag}_Exhaust"
    ex.rotation_euler = (math.pi / 2, 0, 0)
    ex.data.materials.append(chrome)
    polish(ex, bevel=0.003, segments=2, levels=1)
    parent_keep(ex, root)


def build_h86():
    clear_scene()
    root = bpy.data.objects.new("Car_H86", None)
    link(root)
    paint = mat_pbr("H86_WhitePaint", base=(0.94, 0.95, 0.97, 1), metallic=0.12, roughness=0.10, clearcoat=1.0)
    black = mat_pbr("H86_BlackPaint", base=(0.015, 0.015, 0.02, 1), metallic=0.25, roughness=0.22, clearcoat=0.8)
    glass = mat_pbr("H86_Glass", base=(0.02, 0.03, 0.04, 1), roughness=0.015, transmission=0.85, alpha=0.35, ior=1.52)
    chrome = mat_pbr("H86_Chrome", base=(0.92, 0.92, 0.94, 1), metallic=1.0, roughness=0.05)
    trim = mat_pbr("H86_Trim", base=(0.025, 0.025, 0.025, 1), roughness=0.5)
    hl = mat_pbr("H86_HL", base=(1, 1, 0.95, 1), emission=(1, 0.97, 0.88, 1), emission_strength=40)
    tl = mat_pbr("H86_TL", base=(0.7, 0.02, 0.02, 1), emission=(1, 0.05, 0.02, 1), emission_strength=18)
    amber = mat_pbr("H86_Am", base=(1, 0.5, 0.05, 1), emission=(1, 0.45, 0.05, 1), emission_strength=9)

    body, y_f, y_r, half_w = build_cage_body(
        "H86_Body", paint, length=4.18, width=1.66, wheelbase=2.48,
        belt_z=0.56, roof_z=1.28, style="hatch",
    )
    parent_keep(body, root)
    half_l = 4.18 * 0.5
    _add_common_details(root, "H86", half_w, half_l, y_f, y_r, 1.28, 0.56,
                        paint, black, glass, chrome, trim, hl, tl, amber, "hatch")
    rc = (0.90, 0.90, 0.92, 1)
    wr = 0.305
    make_wheel(root, "Wheel_FL", -half_w * 1.02, y_f, wr, wr, 0.20, rc, 5)
    make_wheel(root, "Wheel_FR",  half_w * 1.02, y_f, wr, wr, 0.20, rc, 5)
    make_wheel(root, "Wheel_RL", -half_w * 1.02, y_r, wr, wr, 0.21, rc, 5)
    make_wheel(root, "Wheel_RR",  half_w * 1.02, y_r, wr, wr, 0.21, rc, 5)
    return root


def build_gt20():
    clear_scene()
    root = bpy.data.objects.new("Car_GT20", None)
    link(root)
    paint = mat_pbr("GT20_TealPaint", base=(0.025, 0.11, 0.13, 1), metallic=0.30, roughness=0.12, clearcoat=1.0)
    black = mat_pbr("GT20_Black", base=(0.015, 0.015, 0.015, 1), metallic=0.25, roughness=0.28, clearcoat=0.6)
    glass = mat_pbr("GT20_Glass", base=(0.02, 0.03, 0.04, 1), roughness=0.015, transmission=0.85, alpha=0.35, ior=1.52)
    chrome = mat_pbr("GT20_Chrome", base=(0.85, 0.85, 0.88, 1), metallic=1.0, roughness=0.07)
    trim = mat_pbr("GT20_Trim", base=(0.025, 0.025, 0.025, 1), roughness=0.5)
    hl = mat_pbr("GT20_HL", base=(1, 1, 0.95, 1), emission=(1, 0.96, 0.85, 1), emission_strength=40)
    tl = mat_pbr("GT20_TL", base=(0.65, 0.02, 0.02, 1), emission=(1, 0.04, 0.02, 1), emission_strength=18)
    amber = mat_pbr("GT20_Am", base=(1, 0.5, 0.05, 1), emission=(1, 0.45, 0.05, 1), emission_strength=9)

    body, y_f, y_r, half_w = build_cage_body(
        "GT20_Body", paint, length=4.08, width=1.70, wheelbase=2.42,
        belt_z=0.55, roof_z=1.32, style="hothatch",
    )
    parent_keep(body, root)
    half_l = 4.08 * 0.5
    _add_common_details(root, "GT20", half_w, half_l, y_f, y_r, 1.32, 0.55,
                        paint, black, glass, chrome, trim, hl, tl, amber, "hothatch")
    rc = (0.55, 0.56, 0.58, 1)
    wr = 0.315
    make_wheel(root, "Wheel_FL", -half_w * 1.00, y_f, wr, wr, 0.215, rc, 5)
    make_wheel(root, "Wheel_FR",  half_w * 1.00, y_f, wr, wr, 0.215, rc, 5)
    make_wheel(root, "Wheel_RL", -half_w * 1.00, y_r, wr, wr, 0.225, rc, 5)
    make_wheel(root, "Wheel_RR",  half_w * 1.00, y_r, wr, wr, 0.225, rc, 5)
    return root


def build_re7():
    clear_scene()
    root = bpy.data.objects.new("Car_RE7", None)
    link(root)
    paint = mat_pbr("RE7_RedPaint", base=(0.50, 0.025, 0.025, 1), metallic=0.25, roughness=0.11, clearcoat=1.0)
    black = mat_pbr("RE7_Carbon", base=(0.015, 0.015, 0.02, 1), metallic=0.50, roughness=0.28, clearcoat=0.75)
    glass = mat_pbr("RE7_Glass", base=(0.02, 0.03, 0.04, 1), roughness=0.015, transmission=0.85, alpha=0.32, ior=1.52)
    chrome = mat_pbr("RE7_Chrome", base=(0.92, 0.92, 0.94, 1), metallic=1.0, roughness=0.05)
    trim = mat_pbr("RE7_Trim", base=(0.025, 0.025, 0.025, 1), roughness=0.5)
    hl = mat_pbr("RE7_HL", base=(1, 1, 0.95, 1), emission=(1, 0.97, 0.88, 1), emission_strength=42)
    tl = mat_pbr("RE7_TL", base=(0.55, 0.02, 0.02, 1), emission=(1, 0.03, 0.02, 1), emission_strength=20)
    amber = mat_pbr("RE7_Am", base=(1, 0.5, 0.05, 1), emission=(1, 0.45, 0.05, 1), emission_strength=9)

    body, y_f, y_r, half_w = build_cage_body(
        "RE7_Body", paint, length=4.35, width=1.78, wheelbase=2.55,
        belt_z=0.54, roof_z=1.14, style="coupe",
    )
    parent_keep(body, root)
    half_l = 4.35 * 0.5
    _add_common_details(root, "RE7", half_w, half_l, y_f, y_r, 1.14, 0.54,
                        paint, black, glass, chrome, trim, hl, tl, amber, "coupe")
    rc = (0.75, 0.58, 0.12, 1)
    wr = 0.325
    make_wheel(root, "Wheel_FL", -half_w * 0.98, y_f, wr, wr, 0.23, rc, 6)
    make_wheel(root, "Wheel_FR",  half_w * 0.98, y_f, wr, wr, 0.23, rc, 6)
    make_wheel(root, "Wheel_RL", -half_w * 1.00, y_r, wr, wr, 0.26, rc, 6)
    make_wheel(root, "Wheel_RR",  half_w * 1.00, y_r, wr, wr, 0.26, rc, 6)
    return root


def main():
    jobs = [
        ("h86", build_h86, "car_h86.glb", "beauty_h86.png", ["car_rs86.glb"]),
        ("gt20", build_gt20, "car_gt20.glb", "beauty_gt20.png", ["car_st20.glb"]),
        ("re7", build_re7, "car_re7.glb", "beauty_re7.png", ["car_rx7.glb"]),
    ]
    for key, builder, glb, beauty, aliases in jobs:
        print(f"\n=== {key} ===")
        builder()
        out = os.path.join(OUT_DIR, glb)
        decimate_to_budget(45000)
        export_glb(out)
        for a in aliases:
            shutil.copy2(out, os.path.join(OUT_DIR, a))
        render_beauty(beauty)
        print(f"{key} final size={os.path.getsize(out)} tris={count_tris()}")
    print("\nDONE")


if __name__ == "__main__":
    main()
