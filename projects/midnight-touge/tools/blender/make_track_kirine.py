#!/usr/bin/env python3
"""Kirine mountain pass track — asphalt ribbon, guardrails, gutters, rocks, pines, streetlights."""
from __future__ import annotations
import bpy
import bmesh
import math
import os
from mathutils import Vector, Matrix

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "assets", "models", "track_kirine.glb")
os.makedirs(os.path.dirname(OUT), exist_ok=True)


def clear():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def link(o):
    if o.name not in bpy.context.scene.collection.objects:
        bpy.context.scene.collection.objects.link(o)
    return o


def mat(name, base, metallic=0.0, roughness=0.7, emission=(0,0,0,1), es=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = base
    b.inputs["Metallic"].default_value = metallic
    b.inputs["Roughness"].default_value = roughness
    if "Emission Color" in b.inputs:
        b.inputs["Emission Color"].default_value = emission
        b.inputs["Emission Strength"].default_value = es
    return m


def bake(obj):
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
    for p in obj.data.polygons:
        p.use_smooth = True


# Approximate touge centerline (game Z-up; Blender Z-up here too — export Y-up flips)
# Keep similar length ~1242m stage; sample a sinuous mountain curve in local units (~meters).
def centerline(n=180):
    pts = []
    for i in range(n):
        t = i / (n - 1)
        # 1.25km along a curling ridge
        s = t * 1250.0
        # winding: several hairpins
        ang = math.sin(t * math.pi * 3.2) * 0.9 + math.sin(t * math.pi * 7.1) * 0.35
        x = math.sin(ang) * (80 + 40 * math.sin(t * math.pi * 2))
        y = s * 0.15 + math.cos(ang) * (60 + 20 * math.cos(t * math.pi * 1.5))
        z = 8 + t * 55 + math.sin(t * math.pi * 4) * 4  # climb
        # forward tangent for orientation
        pts.append(Vector((x, y, z)))
    return pts


def build_road(pts, width=7.5):
    asphalt = mat("Asphalt", (0.04, 0.045, 0.05, 1), metallic=0.05, roughness=0.55)
    line = mat("LaneLine", (0.85, 0.82, 0.55, 1), roughness=0.4)
    curb = mat("Curb", (0.25, 0.25, 0.28, 1), roughness=0.65)

    mesh = bpy.data.meshes.new("Road")
    obj = bpy.data.objects.new("Road", mesh)
    link(obj)
    bm = bmesh.new()

    half = width * 0.5
    lefts, rights = [], []
    for i, p in enumerate(pts):
        if i < len(pts) - 1:
            fwd = (pts[i + 1] - p).normalized()
        else:
            fwd = (p - pts[i - 1]).normalized()
        up = Vector((0, 0, 1))
        right = fwd.cross(up)
        if right.length < 1e-4:
            right = Vector((1, 0, 0))
        else:
            right.normalize()
        lefts.append(bm.verts.new(p - right * half))
        rights.append(bm.verts.new(p + right * half))

    bm.verts.ensure_lookup_table()
    for i in range(len(pts) - 1):
        bm.faces.new((lefts[i], rights[i], rights[i + 1], lefts[i + 1]))

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    mesh.materials.append(asphalt)

    # Center dashed line as thin ribbon
    mesh2 = bpy.data.meshes.new("CenterLine")
    obj2 = bpy.data.objects.new("CenterLine", mesh2)
    link(obj2)
    bm = bmesh.new()
    lw = 0.12
    lv, rv = [], []
    for i, p in enumerate(pts):
        if i % 4 in (2, 3):  # dash gaps
            continue
        if i < len(pts) - 1:
            fwd = (pts[i + 1] - p).normalized()
        else:
            fwd = (p - pts[i - 1]).normalized()
        up = Vector((0, 0, 1))
        right = fwd.cross(up).normalized()
        elev = p + Vector((0, 0, 0.02))
        lv.append(bm.verts.new(elev - right * lw))
        rv.append(bm.verts.new(elev + right * lw))
    # reconnect sequential pairs that exist — simpler: rebuild continuous then skip
    bm.free()
    # rebuild properly with segments
    bm = bmesh.new()
    segs = []
    for i in range(0, len(pts) - 2, 4):
        a, b = pts[i], pts[min(i + 2, len(pts) - 1)]
        fwd = (b - a)
        if fwd.length < 1e-3:
            continue
        fwd.normalize()
        right = fwd.cross(Vector((0, 0, 1)))
        if right.length < 1e-4:
            continue
        right.normalize()
        elev_a = a + Vector((0, 0, 0.025))
        elev_b = b + Vector((0, 0, 0.025))
        v0 = bm.verts.new(elev_a - right * lw)
        v1 = bm.verts.new(elev_a + right * lw)
        v2 = bm.verts.new(elev_b + right * lw)
        v3 = bm.verts.new(elev_b - right * lw)
        bm.faces.new((v0, v1, v2, v3))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh2)
    bm.free()
    mesh2.materials.append(line)

    # Gutters / worn edge strips
    for side, sign in (("GutterL", -1), ("GutterR", 1)):
        mesh3 = bpy.data.meshes.new(side)
        obj3 = bpy.data.objects.new(side, mesh3)
        link(obj3)
        bm = bmesh.new()
        for i in range(len(pts) - 1):
            p0, p1 = pts[i], pts[i + 1]
            fwd = (p1 - p0).normalized()
            right = fwd.cross(Vector((0, 0, 1)))
            if right.length < 1e-4:
                continue
            right.normalize()
            r0 = half * sign
            r1 = (half + 0.45) * sign
            zdrop = Vector((0, 0, -0.08))
            v0 = bm.verts.new(p0 + right * r0)
            v1 = bm.verts.new(p0 + right * r1 + zdrop)
            v2 = bm.verts.new(p1 + right * r1 + zdrop)
            v3 = bm.verts.new(p1 + right * r0)
            try:
                bm.faces.new((v0, v1, v2, v3))
            except ValueError:
                pass
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        bm.to_mesh(mesh3)
        bm.free()
        mesh3.materials.append(curb)

    return obj


def build_guardrails(pts, width=7.5):
    metal = mat("Rail", (0.55, 0.55, 0.58, 1), metallic=0.9, roughness=0.25)
    post_m = mat("Post", (0.35, 0.35, 0.38, 1), metallic=0.7, roughness=0.4)
    half = width * 0.5 + 0.55
    for side, sign in (("RailL", -1), ("RailR", 1)):
        # posts every ~8 samples
        for i in range(0, len(pts), 6):
            p = pts[i]
            if i < len(pts) - 1:
                fwd = (pts[i + 1] - p).normalized()
            else:
                fwd = (p - pts[i - 1]).normalized()
            right = fwd.cross(Vector((0, 0, 1)))
            if right.length < 1e-4:
                continue
            right.normalize()
            loc = p + right * (half * sign) + Vector((0, 0, 0.35))
            bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
            post = bpy.context.active_object
            post.name = f"{side}_Post{i}"
            post.scale = (0.06, 0.06, 0.55)
            bpy.ops.object.transform_apply(scale=True)
            post.data.materials.append(post_m)
        # continuous rail beam as ribbon
        mesh = bpy.data.meshes.new(side)
        obj = bpy.data.objects.new(side, mesh)
        link(obj)
        bm = bmesh.new()
        h = 0.55
        for i in range(len(pts) - 1):
            p0, p1 = pts[i], pts[i + 1]
            fwd = (p1 - p0).normalized()
            right = fwd.cross(Vector((0, 0, 1)))
            if right.length < 1e-4:
                continue
            right.normalize()
            a = p0 + right * (half * sign) + Vector((0, 0, h))
            b = p1 + right * (half * sign) + Vector((0, 0, h))
            off = right * (0.04 * sign)
            v0 = bm.verts.new(a - off + Vector((0, 0, -0.06)))
            v1 = bm.verts.new(a + off + Vector((0, 0, -0.06)))
            v2 = bm.verts.new(b + off + Vector((0, 0, -0.06)))
            v3 = bm.verts.new(b - off + Vector((0, 0, -0.06)))
            v4 = bm.verts.new(a - off + Vector((0, 0, 0.06)))
            v5 = bm.verts.new(a + off + Vector((0, 0, 0.06)))
            v6 = bm.verts.new(b + off + Vector((0, 0, 0.06)))
            v7 = bm.verts.new(b - off + Vector((0, 0, 0.06)))
            for f in ((v0, v1, v2, v3), (v4, v7, v6, v5), (v0, v4, v5, v1), (v3, v2, v6, v7)):
                try:
                    bm.faces.new(f)
                except ValueError:
                    pass
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        bm.to_mesh(mesh)
        bm.free()
        mesh.materials.append(metal)


def build_rocks_and_pines(pts, width=7.5):
    rock_m = mat("Rock", (0.18, 0.16, 0.14, 1), roughness=0.9)
    bark = mat("Bark", (0.12, 0.08, 0.05, 1), roughness=0.85)
    needle = mat("Needle", (0.05, 0.12, 0.04, 1), roughness=0.75)
    half = width * 0.5
    for i in range(4, len(pts) - 4, 9):
        p = pts[i]
        if i < len(pts) - 1:
            fwd = (pts[i + 1] - p).normalized()
        else:
            fwd = (p - pts[i - 1]).normalized()
        right = fwd.cross(Vector((0, 0, 1)))
        if right.length < 1e-4:
            continue
        right.normalize()
        for sign, dist in ((-1, half + 3.5 + (i % 5)), (1, half + 4.0 + ((i * 3) % 7))):
            loc = p + right * (dist * sign) + Vector((0, 0, 0.8))
            # rock
            bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=1.2 + (i % 3) * 0.4, location=loc)
            rock = bpy.context.active_object
            rock.name = f"Rock_{i}_{sign}"
            rock.scale = (1.4, 1.1, 0.9)
            bpy.ops.object.transform_apply(scale=True)
            rock.data.materials.append(rock_m)
            # pine further out
            ploc = loc + right * (2.5 * sign) + Vector((0, 0, 1.5))
            bpy.ops.mesh.primitive_cylinder_add(radius=0.18, depth=3.2, location=ploc)
            trunk = bpy.context.active_object
            trunk.name = f"PineTrunk_{i}_{sign}"
            trunk.data.materials.append(bark)
            bpy.ops.mesh.primitive_cone_add(radius1=1.6, depth=4.5, location=ploc + Vector((0, 0, 3.2)))
            crown = bpy.context.active_object
            crown.name = f"PineCrown_{i}_{sign}"
            crown.data.materials.append(needle)
            bpy.ops.mesh.primitive_cone_add(radius1=1.2, depth=3.2, location=ploc + Vector((0, 0, 5.0)))
            crown2 = bpy.context.active_object
            crown2.name = f"PineCrown2_{i}_{sign}"
            crown2.data.materials.append(needle)


def build_lights(pts, width=7.5):
    pole_m = mat("Pole", (0.15, 0.15, 0.16, 1), metallic=0.6, roughness=0.4)
    lamp_m = mat("Lamp", (1, 0.85, 0.55, 1), emission=(1, 0.8, 0.45, 1), es=12)
    half = width * 0.5 + 1.2
    for i in range(8, len(pts) - 8, 14):
        p = pts[i]
        if i < len(pts) - 1:
            fwd = (pts[i + 1] - p).normalized()
        else:
            fwd = (p - pts[i - 1]).normalized()
        right = fwd.cross(Vector((0, 0, 1)))
        if right.length < 1e-4:
            continue
        right.normalize()
        sign = 1 if (i // 14) % 2 == 0 else -1
        base = p + right * (half * sign)
        bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=5.5, location=base + Vector((0, 0, 2.75)))
        pole = bpy.context.active_object
        pole.name = f"LightPole_{i}"
        pole.data.materials.append(pole_m)
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.22, location=base + Vector((0, 0, 5.4)) - right * (0.35 * sign))
        lamp = bpy.context.active_object
        lamp.name = f"Lamp_{i}"
        lamp.data.materials.append(lamp_m)


def main():
    clear()
    pts = centerline(160)
    build_road(pts)
    build_guardrails(pts)
    build_rocks_and_pines(pts)
    build_lights(pts)
    bpy.ops.export_scene.gltf(
        filepath=OUT, export_format="GLB", use_selection=False,
        export_apply=True, export_yup=True,
    )
    n = 0
    for o in bpy.data.objects:
        if o.type == "MESH" and o.data:
            o.data.calc_loop_triangles()
            n += len(o.data.loop_triangles)
    print(f"Exported {OUT} tris={n} bytes={os.path.getsize(OUT)}")


if __name__ == "__main__":
    main()
