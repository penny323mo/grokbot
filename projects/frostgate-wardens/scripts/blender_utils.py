import bpy
import math

PALETTE = {
    'ice': '#BDC3C8',           # Soft matte clay snow matching title_key.webp (not blown-out white)
    'ice_bright': '#DDEBF2',    # Peak snow highlight
    'glacier_teal': '#2F8F9D',  # Glacier teal spire roofs & frost crystals
    'deep_indigo': '#1B2447',   # Deep brand indigo
    'alpine_sky': '#12233D',    # Deep alpine twilight sky matching title_key.webp
    'slate_blue': '#46608A',    # Rock faces and shadow tones
    'slate_dark': '#303E54',    # Dark rock crevices
    'fir_green': '#244B3E',     # Deep forest pine needles
    'stone': '#B9AE9C',         # Weathered fortress stone
    'stone_dark': '#696054',    # Foundation stone & mortar lines
    'road_gold': '#C89B48',     # Warm golden flagstone road (passes road gold check)
    'road_edge': '#9C7A38',     # Flagstone curb shadow
    'saffron': '#F59E0B',       # Saffron banners, buttons, heraldry
    'gold': '#FBBF24',          # Gilded spire finials & medals
    'bronze': '#BA7D38',        # Cannon metal & fixtures
    'ember_coral': '#E2563A',   # Enemy clay body & magma glow
    'ember_glow': '#FF7A45',    # High-emission magma core
    'ember_dark': '#7A1C16',    # Enemy dark armor & cooled obsidian
    'ivory': '#F4EFE2',         # UI paper & knight face tone
    'ink': '#14183A',           # Ink outlines & dark accents
    'wood': '#785338',          # Timber decks & watchtower beams
    'wood_dark': '#4F3521',     # Tree trunks & heavy timber supports
    'iron': '#5B626C',          # Iron plating & portcullis bars
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

    # Configure Blender 5.x EEVEE-Next Ambient Occlusion and Shadows
    if hasattr(scene, "eevee"):
        if hasattr(scene.eevee, "use_fast_gi"):
            scene.eevee.use_fast_gi = True
            scene.eevee.fast_gi_method = 'AMBIENT_OCCLUSION_ONLY'
            scene.eevee.fast_gi_distance = 4.0
            scene.eevee.fast_gi_ray_count = 16
        if hasattr(scene.eevee, "use_shadows"):
            scene.eevee.use_shadows = True

    return scene

def get_material(name, hex_color=None, roughness=0.82, metallic=0.0, emission=None):
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
                bsdf.inputs['Emission Strength'].default_value = 2.0
            elif 'Emission' in bsdf.inputs:
                bsdf.inputs['Emission'].default_value = em_col
    return mat

def setup_diorama_lights(collection=None):
    if collection is None:
        collection = bpy.context.scene.collection

    # Key light: warm ivory sun from top-left-front (sharp shadows for faceted diorama depth)
    sun_data = bpy.data.lights.new(name="SunKey", type='SUN')
    sun_data.energy = 4.2
    sun_data.color = hex_to_linear_rgb('#FFF5E6')[:3]
    if hasattr(sun_data, "use_shadow"):
        sun_data.use_shadow = True
    sun_obj = bpy.data.objects.new(name="SunKey", object_data=sun_data)
    sun_obj.rotation_euler = (math.radians(52), math.radians(18), math.radians(-38))
    collection.objects.link(sun_obj)

    # Fill light: cool slate blue sun from opposite side (ambient shadow tint, no conflicting shadows)
    fill_data = bpy.data.lights.new(name="SunFill", type='SUN')
    fill_data.energy = 1.3
    fill_data.color = hex_to_linear_rgb(PALETTE['slate_blue'])[:3]
    if hasattr(fill_data, "use_shadow"):
        fill_data.use_shadow = False
    fill_obj = bpy.data.objects.new(name="SunFill", object_data=fill_data)
    fill_obj.rotation_euler = (math.radians(45), math.radians(-30), math.radians(140))
    collection.objects.link(fill_obj)

    # Rim light: crisp glacier teal from behind (highlights silhouetted peaks and roofs)
    rim_data = bpy.data.lights.new(name="SunRim", type='SUN')
    rim_data.energy = 1.1
    rim_data.color = hex_to_linear_rgb(PALETTE['glacier_teal'])[:3]
    if hasattr(rim_data, "use_shadow"):
        rim_data.use_shadow = False
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
