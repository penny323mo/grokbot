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
from render_all_maps import (
    make_faceted, get_emission_material, create_fir_tree, create_boulder,
    create_watchtower, build_road_ribbon, add_road_curbs,
    build_dense_mountain_flank, build_grand_keep, setup_diorama_scene,
    project_path, project_plots, calc_plot, is_clear
)

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

def build_faceted_snow_ground(name, paths_3d, min_x=-16.0, max_x=16.0, min_y=-21.0, max_y=14.0, nx=32, ny=35, mat_snow=None, mat_rock=None, mat_teal=None):
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

            # Faceted noise
            n1 = math.sin(x * 0.7 + y * 0.5) * 0.35 + math.cos(x * 1.2 - y * 0.8) * 0.25
            n2 = math.sin(x * 2.1 + y * 1.7) * 0.15

            # Ground height: matches road near road, then rises into terraced snow/rock
            if min_d <= 1.4:
                z = road_z - 0.04
            elif min_d <= 3.2:
                t = (min_d - 1.4) / 1.8
                z = road_z - 0.04 + (n1 * 0.4 + n2 * 0.3) * t + t * 0.35
            else:
                dist_factor = (min_d - 3.2) * 0.25
                z = road_z + 0.35 + dist_factor + n1 + n2

            # Jitter vertex slightly for organic faceted look (except near road)
            jitter_x = math.sin(i * 3.7 + j * 5.1) * (dx * 0.22) if min_d > 2.0 else 0.0
            jitter_y = math.cos(i * 4.3 + j * 2.9) * (dy * 0.22) if min_d > 2.0 else 0.0
            verts.append((x + jitter_x, y + jitter_y, z))

    faces = []
    for j in range(ny):
        for i in range(nx):
            v0 = j * (nx + 1) + i
            v1 = v0 + 1
            v2 = (j + 1) * (nx + 1) + i + 1
            v3 = (j + 1) * (nx + 1) + i
            # Triangulate each quad for crisp faceted shading
            faces.append((v0, v1, v2))
            faces.append((v0, v2, v3))

    mesh.from_pydata(verts, [], faces)
    mesh.update()
    make_faceted(obj)

    if mat_snow and mat_rock:
        obj.data.materials.append(mat_snow)
        obj.data.materials.append(mat_rock)
        if mat_teal:
            obj.data.materials.append(mat_teal)

        for poly in mesh.polygons:
            nz = abs(poly.normal.z)
            # Slope based material
            if nz < 0.65:
                poly.material_index = 1 # Rock on slopes
            elif mat_teal and poly.index % 11 == 3 and nz > 0.85:
                poly.material_index = 2 # Glacier teal ice accent
            else:
                poly.material_index = 0 # Snow on flats

    return obj

print("Test module loaded successfully")
