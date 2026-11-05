import sys
import os
import json
import math
import bpy
import bpy_extras
from mathutils import Vector
from PIL import Image

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
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

def get_emission_material(name, hex_color, strength=2.0):
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

def find_keep_tip_from_image(img_path, default_x=800, search_y_start=180, search_y_end=350):
    im = Image.open(img_path).convert('RGB')
    best_y = 9999
    best_x = default_x
    for x in range(default_x - 15, default_x + 16):
        for y in range(search_y_start, search_y_end):
            r, g, b = im.getpixel((x, y))
            is_white_sky = (r >= 244 and g >= 244 and b >= 244)
            is_blue_sky = (abs(r - 166) <= 22 and abs(g - 206) <= 22 and abs(b - 240) <= 22)
            is_dark_sky = (abs(r - 82) <= 15 and abs(g - 44) <= 15 and abs(b - 50) <= 15)
            if not (is_white_sky or is_blue_sky or is_dark_sky):
                if y < best_y:
                    best_y = y
                    best_x = x
                break
    return {"x": best_x, "y": best_y}

def convert_to_webp(png_path, webp_path, quality=82):
    im = Image.open(png_path)
    im.save(webp_path, "WEBP", quality=quality, method=6)
    size_kb = os.path.getsize(webp_path) / 1024.0
    print(f"Converted {png_path} -> {webp_path}: {size_kb:.1f} KB (limit: 450 KB)")
    return size_kb <= 450.0

print("Diorama library loaded successfully.")
