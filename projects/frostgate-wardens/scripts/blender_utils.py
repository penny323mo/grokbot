import bpy
import math

PALETTE = {
    'ice': '#DDEBF2',
    'glacier_teal': '#2F8F9D',
    'deep_indigo': '#1B2447',
    'slate_blue': '#46608A',
    'fir_green': '#2D5A4A',
    'stone': '#B9AE9C',
    'stone_dark': '#8E8575',
    'road_gold': '#D9B87A',
    'road_edge': '#C4A362',
    'saffron': '#E8B04A',
    'ember_coral': '#E2563A',
    'ember_glow': '#FF7A45',
    'ember_dark': '#7A1C16',
    'ivory': '#F4EFE2',
    'ink': '#14183A',
    'wood': '#785338',
    'wood_dark': '#4F3521',
    'iron': '#5B626C',
    'gold': '#E5B138',
    'bronze': '#BA7D38',
}

def hex_to_linear_rgb(hex_str):
    hex_str = hex_str.lstrip('#')
    srgb = [int(hex_str[i:i+2], 16) / 255.0 for i in (0, 2, 4)]
    linear = []
    for c in srgb:
        if c <= 0.04045:
            linear.append(c / 12.92)
        else:
            linear.append(((c + 0.055) / 1.055) ** 2.4)
    return (linear[0], linear[1], linear[2], 1.0)

def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.film_transparent = True
    return scene

def get_material(name, hex_color=None, roughness=0.85, metallic=0.0, emission=None):
    if name in bpy.data.materials:
        return bpy.data.materials[name]
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get('Principled BSDF')
    if hex_color is None:
        hex_color = PALETTE.get(name, '#FFFFFF')
    col = hex_to_linear_rgb(hex_color)
    if bsdf:
        bsdf.inputs['Base Color'].default_value = col
        bsdf.inputs['Roughness'].default_value = roughness
        bsdf.inputs['Metallic'].default_value = metallic
        if emission:
            em_col = hex_to_linear_rgb(emission)
            if 'Emission Color' in bsdf.inputs:
                bsdf.inputs['Emission Color'].default_value = em_col
                bsdf.inputs['Emission Strength'].default_value = 1.5
            elif 'Emission' in bsdf.inputs:
                bsdf.inputs['Emission'].default_value = em_col
    return mat

def setup_diorama_lights(collection=None):
    if collection is None:
        collection = bpy.context.scene.collection

    # Key light: warm ivory sun from top-left-front
    sun_data = bpy.data.lights.new(name="SunKey", type='SUN')
    sun_data.energy = 3.5
    sun_data.color = hex_to_linear_rgb(PALETTE['ivory'])[:3]
    sun_obj = bpy.data.objects.new(name="SunKey", object_data=sun_data)
    sun_obj.rotation_euler = (math.radians(52), math.radians(18), math.radians(-38))
    collection.objects.link(sun_obj)

    # Fill light: cool slate blue sun from opposite side
    fill_data = bpy.data.lights.new(name="SunFill", type='SUN')
    fill_data.energy = 1.4
    fill_data.color = hex_to_linear_rgb(PALETTE['slate_blue'])[:3]
    fill_obj = bpy.data.objects.new(name="SunFill", object_data=fill_data)
    fill_obj.rotation_euler = (math.radians(45), math.radians(-30), math.radians(140))
    collection.objects.link(fill_obj)

    # Rim light: subtle glacier teal from behind
    rim_data = bpy.data.lights.new(name="SunRim", type='SUN')
    rim_data.energy = 1.0
    rim_data.color = hex_to_linear_rgb(PALETTE['glacier_teal'])[:3]
    rim_obj = bpy.data.objects.new(name="SunRim", object_data=rim_data)
    rim_obj.rotation_euler = (math.radians(65), math.radians(0), math.radians(180))
    collection.objects.link(rim_obj)

def setup_isometric_camera(ortho_scale=10.0, elevation_deg=35.264, rotation_z_deg=45.0, distance=30.0, center=(0,0,0)):
    cam_data = bpy.data.cameras.new(name="IsoCamera")
    cam_data.type = 'ORTHO'
    cam_data.ortho_scale = ortho_scale
    cam_obj = bpy.data.objects.new(name="IsoCamera", object_data=cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj

    # Position camera
    el = math.radians(elevation_deg)
    rz = math.radians(rotation_z_deg)
    cx, cy, cz = center
    cam_obj.location = (
        cx + distance * math.cos(el) * math.sin(rz),
        cy - distance * math.cos(el) * math.cos(rz),
        cz + distance * math.sin(el)
    )
    cam_obj.rotation_euler = (
        math.radians(90 - elevation_deg),
        0,
        rz
    )
    return cam_obj
