import sys
import os
import math
import bpy
import bmesh

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import blender_utils

def make_faceted(obj):
    for f in obj.data.polygons:
        f.use_smooth = False
    if hasattr(obj.data, "use_auto_smooth"):
        obj.data.use_auto_smooth = False

def create_hex_prism(name, radius=1.0, depth=0.4, location=(0,0,0), rotation=(0,0,0), material=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=radius, depth=depth, location=location, rotation=rotation)
    obj = bpy.context.active_object
    obj.name = name
    make_faceted(obj)
    if material:
        obj.data.materials.append(material)
    return obj

def create_oct_prism(name, radius=1.0, depth=0.4, location=(0,0,0), rotation=(0,0,0), material=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=radius, depth=depth, location=location, rotation=rotation)
    obj = bpy.context.active_object
    obj.name = name
    make_faceted(obj)
    if material:
        obj.data.materials.append(material)
    return obj

def create_box(name, size=(1,1,1), location=(0,0,0), rotation=(0,0,0), material=None):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=location, rotation=rotation)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = size
    bpy.ops.object.transform_apply(scale=True)
    make_faceted(obj)
    if material:
        obj.data.materials.append(material)
    return obj

def create_cone(name, radius=1.0, depth=1.0, vertices=6, location=(0,0,0), rotation=(0,0,0), material=None):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=radius, depth=depth, location=location, rotation=rotation)
    obj = bpy.context.active_object
    obj.name = name
    make_faceted(obj)
    if material:
        obj.data.materials.append(material)
    return obj

def create_cylinder(name, radius=1.0, depth=1.0, vertices=8, location=(0,0,0), rotation=(0,0,0), material=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location, rotation=rotation)
    obj = bpy.context.active_object
    obj.name = name
    make_faceted(obj)
    if material:
        obj.data.materials.append(material)
    return obj

# ----------------- BUILD PLOT (Crafted Clay Stone Plinth) -----------------
def build_plot():
    root = bpy.data.objects.new("Plot_Root", None)
    bpy.context.scene.collection.objects.link(root)

    mat_stone = blender_utils.get_material('stone')
    mat_stone_dark = blender_utils.get_material('stone_dark')
    mat_saffron = blender_utils.get_material('saffron')
    mat_teal = blender_utils.get_material('glacier_teal', roughness=0.35, emission='#2F8F9D')

    # 1. Stepped low-poly slate foundation base
    b1 = create_oct_prism("P_Foundation", radius=1.35, depth=0.22, location=(0, 0, 0.11), material=mat_stone_dark)
    b1.parent = root

    # 2. Four corner beveled stone buttress lugs
    for angle_deg in [45, 135, 225, 315]:
        rad = math.radians(angle_deg)
        lx = math.cos(rad) * 1.2
        ly = math.sin(rad) * 1.2
        lug = create_box(f"P_Lug_{angle_deg}", size=(0.35, 0.35, 0.26), location=(lx, ly, 0.13), material=mat_stone_dark)
        lug.parent = root

    # 3. Main faceted clay stone drum
    b2 = create_oct_prism("P_Drum", radius=1.15, depth=0.22, location=(0, 0, 0.28), material=mat_stone)
    b2.parent = root

    # 4. Beveled top rim socket
    b3 = create_oct_prism("P_Rim", radius=0.98, depth=0.08, location=(0, 0, 0.40), material=mat_stone_dark)
    b3.parent = root

    # 5. Carved warm saffron rune socket
    b4 = create_cylinder("P_RuneRing", radius=0.75, depth=0.04, vertices=8, location=(0, 0, 0.43), material=mat_saffron)
    b4.parent = root

    # 6. Central glacier-teal focal runestone
    b5 = create_cylinder("P_Core", radius=0.35, depth=0.06, vertices=6, location=(0, 0, 0.46), material=mat_teal)
    b5.parent = root

    return root

# ----------------- TOWER 1: CROSSBOW -----------------
def build_crossbow(level='1'):
    root = bpy.data.objects.new(f"Crossbow_{level}_Root", None)
    bpy.context.scene.collection.objects.link(root)

    mat_stone = blender_utils.get_material('stone')
    mat_stone_dark = blender_utils.get_material('stone_dark')
    mat_wood = blender_utils.get_material('wood')
    mat_iron = blender_utils.get_material('iron', metallic=0.7, roughness=0.4)
    mat_gold = blender_utils.get_material('gold', metallic=0.8, roughness=0.25)
    mat_saffron = blender_utils.get_material('saffron')
    mat_teal = blender_utils.get_material('glacier_teal', roughness=0.4)
    mat_bronze = blender_utils.get_material('bronze', metallic=0.6, roughness=0.3)

    # Stepped circular stone plinth matching style_board.webp
    b1 = create_oct_prism("Base1", radius=1.2, depth=0.25, location=(0,0,0.125), material=mat_stone_dark)
    b1.parent = root
    b2 = create_oct_prism("Base2", radius=1.0, depth=0.25, location=(0,0,0.35), material=mat_stone)
    b2.parent = root

    # Level medallion badge on base
    med_mat = mat_bronze if level == '1' else (mat_iron if level == '2' else mat_gold)
    med = create_cylinder("LvlMedallion", radius=0.22, depth=0.1, vertices=8, location=(0, -0.95, 0.35), rotation=(math.radians(90), 0, 0), material=med_mat)
    med.parent = root

    timber = create_box("Deck", size=(1.3, 1.3, 0.15), location=(0,0,0.55), material=mat_wood)
    timber.parent = root

    if level == '1':
        # Pavilion canopy matching style_board.webp
        for px, py in [(-0.45, -0.45), (-0.45, 0.45), (0.45, -0.45), (0.45, 0.45)]:
            pil = create_cylinder("Pil", radius=0.08, depth=0.9, vertices=6, location=(px, py, 1.05), material=mat_stone)
            pil.parent = root
        roof = create_cone("PavilionRoof", radius=0.95, depth=0.6, vertices=6, location=(0, 0, 1.7), material=mat_teal)
        roof.parent = root
        fin = create_cone("Finial", radius=0.15, depth=0.35, vertices=5, location=(0, 0, 2.1), material=mat_gold)
        fin.parent = root
        # Bold Ballista stock & extended iron arms
        stock = create_box("Stock", size=(0.25, 1.2, 0.22), location=(0, 0, 0.9), rotation=(0.1, 0, 0.785), material=mat_wood)
        stock.parent = root
        bow = create_box("BowArms", size=(1.8, 0.14, 0.22), location=(0.35, 0.35, 0.95), rotation=(0, 0, -0.785), material=mat_iron)
        bow.parent = root
    elif level == '2':
        # Parapet + twin ballistas
        wall1 = create_box("Wall1", size=(1.5, 0.15, 0.5), location=(0, 0.7, 0.7), material=mat_stone)
        wall1.parent = root
        wall2 = create_box("Wall2", size=(0.15, 1.5, 0.5), location=(0.7, 0, 0.7), material=mat_stone)
        wall2.parent = root
        post = create_cylinder("Post", radius=0.25, depth=0.8, vertices=8, location=(0,0,0.95), material=mat_stone)
        post.parent = root
        roof = create_cone("Roof", radius=0.85, depth=0.55, vertices=6, location=(-0.3, -0.3, 1.8), material=mat_teal)
        roof.parent = root
        # Dual crossbows
        for offset in [-0.25, 0.25]:
            stock = create_box("Stock", size=(0.2, 1.3, 0.2), location=(offset*0.7, -offset*0.7, 1.25), rotation=(0.1, 0, 0.785), material=mat_wood)
            stock.parent = root
            bow = create_box("Bow", size=(1.4, 0.12, 0.18), location=(offset*0.7+0.35, -offset*0.7+0.35, 1.3), rotation=(0, 0, -0.785), material=mat_iron)
            bow.parent = root
    elif level == '3a': # Piercing (Heavy Arbalest)
        keep = create_oct_prism("Keep", radius=1.0, depth=0.8, location=(0,0,0.7), material=mat_stone)
        keep.parent = root
        turret = create_cylinder("Turret", radius=0.6, depth=0.4, vertices=8, location=(0,0,1.25), material=mat_iron)
        turret.parent = root
        stock = create_box("Stock", size=(0.35, 1.7, 0.35), location=(0.1, 0.1, 1.5), rotation=(0.12, 0, 0.785), material=mat_iron)
        stock.parent = root
        bow = create_box("HeavyBow", size=(2.2, 0.2, 0.25), location=(0.6, 0.6, 1.55), rotation=(0, 0, -0.785), material=mat_iron)
        bow.parent = root
        crystal = create_cone("PermafrostTip", radius=0.22, depth=0.85, vertices=6, location=(0.9, 0.9, 1.65), rotation=(0, 1.57, 0.785), material=mat_teal)
        crystal.parent = root
        banner = create_box("Banner", size=(0.08, 0.5, 0.9), location=(-0.5, -0.5, 1.7), rotation=(0, 0, 0.785), material=mat_saffron)
        banner.parent = root
    elif level == '3b': # Volley (Repeating Ballista)
        keep = create_oct_prism("Keep", radius=1.0, depth=0.8, location=(0,0,0.7), material=mat_stone)
        keep.parent = root
        turret = create_box("Magazine", size=(0.7, 0.7, 0.5), location=(0,0,1.3), rotation=(0, 0, 0.785), material=mat_wood)
        turret.parent = root
        for dy, dz in [(-0.25, 0.15), (0.0, 0.3), (0.25, 0.15)]:
            barrel = create_box("Stock", size=(0.18, 1.4, 0.18), location=(-dy*0.7, dy*0.7, 1.35 + dz), rotation=(0.1, 0, 0.785), material=mat_iron)
            barrel.parent = root
            bow = create_box("Bow", size=(1.2, 0.1, 0.14), location=(-dy*0.7+0.35, dy*0.7+0.35, 1.4 + dz), rotation=(0, 0, -0.785), material=mat_gold)
            bow.parent = root
        gear = create_cylinder("Gear", radius=0.4, depth=0.15, vertices=12, location=(-0.3, -0.3, 1.5), rotation=(1.57, 0, 0.785), material=mat_gold)
        gear.parent = root
    return root

# ----------------- TOWER 2: STONE MORTAR -----------------
def build_mortar(level='1'):
    root = bpy.data.objects.new(f"Mortar_{level}_Root", None)
    bpy.context.scene.collection.objects.link(root)

    mat_stone_dark = blender_utils.get_material('stone_dark')
    mat_stone = blender_utils.get_material('stone')
    mat_iron = blender_utils.get_material('iron', metallic=0.7, roughness=0.4)
    mat_wood = blender_utils.get_material('wood')
    mat_bronze = blender_utils.get_material('bronze', metallic=0.6, roughness=0.3)
    mat_ember = blender_utils.get_material('ember_glow', roughness=0.3, emission='#FF7A45')

    base = create_oct_prism("Base", radius=1.2, depth=0.4, location=(0,0,0.2), material=mat_stone_dark)
    base.parent = root

    if level == '1':
        # Stone mortar bowl
        ped = create_cylinder("Mount", radius=0.7, depth=0.4, vertices=8, location=(0,0,0.55), material=mat_stone)
        ped.parent = root
        barrel = create_cylinder("Barrel", radius=0.42, depth=0.9, vertices=8, location=(0.15, 0.15, 0.95), rotation=(math.radians(35), math.radians(-35), 0), material=mat_iron)
        barrel.parent = root
        # Ammo pile
        for p in [(0.5, -0.4, 0.45), (0.7, -0.2, 0.45), (0.6, -0.3, 0.65)]:
            rock = create_cone("Ammo", radius=0.18, depth=0.25, vertices=5, location=p, material=mat_stone)
            rock.parent = root
    elif level == '2':
        ped = create_oct_prism("Mount", radius=0.85, depth=0.55, location=(0,0,0.6), material=mat_stone)
        ped.parent = root
        iron_rim = create_cylinder("Rim", radius=0.9, depth=0.15, vertices=8, location=(0,0,0.85), material=mat_iron)
        iron_rim.parent = root
        barrel = create_cylinder("Barrel", radius=0.5, depth=1.1, vertices=10, location=(0.2, 0.2, 1.15), rotation=(math.radians(38), math.radians(-38), 0), material=mat_bronze)
        barrel.parent = root
        muzzle = create_cylinder("Muzzle", radius=0.58, depth=0.2, vertices=10, location=(0.48, 0.48, 1.55), rotation=(math.radians(38), math.radians(-38), 0), material=mat_iron)
        muzzle.parent = root
    elif level == '3a': # Colossus blast
        ped = create_oct_prism("Mount", radius=1.0, depth=0.7, location=(0,0,0.65), material=mat_stone_dark)
        ped.parent = root
        # Massive reinforced cannon
        barrel = create_cylinder("ColossusBarrel", radius=0.68, depth=1.4, vertices=10, location=(0.25, 0.25, 1.3), rotation=(math.radians(40), math.radians(-40), 0), material=mat_iron)
        barrel.parent = root
        muzzle = create_cylinder("Muzzle", radius=0.78, depth=0.25, vertices=10, location=(0.65, 0.65, 1.8), rotation=(math.radians(40), math.radians(-40), 0), material=mat_stone_dark)
        muzzle.parent = root
        core = create_cylinder("Core", radius=0.45, depth=0.08, vertices=8, location=(0.7, 0.7, 1.85), rotation=(math.radians(40), math.radians(-40), 0), material=mat_ember)
        core.parent = root
    elif level == '3b': # Cluster mortar
        ped = create_oct_prism("Mount", radius=0.9, depth=0.6, location=(0,0,0.6), material=mat_stone)
        ped.parent = root
        # Triple barrel cluster
        for ox, oy, oz in [(-0.15, 0.25, 1.2), (0.25, -0.15, 1.2), (0.2, 0.2, 1.45)]:
            b = create_cylinder("Bar", radius=0.28, depth=1.1, vertices=8, location=(ox, oy, oz), rotation=(math.radians(35), math.radians(-35), 0), material=mat_bronze)
            b.parent = root
            m = create_cylinder("Muz", radius=0.33, depth=0.15, vertices=8, location=(ox+0.25, oy+0.25, oz+0.38), rotation=(math.radians(35), math.radians(-35), 0), material=mat_iron)
            m.parent = root
    return root

# ----------------- TOWER 3: FROST SPIRE -----------------
def build_frost_spire(level='1'):
    root = bpy.data.objects.new(f"Frost_{level}_Root", None)
    bpy.context.scene.collection.objects.link(root)

    mat_stone = blender_utils.get_material('stone')
    mat_ice = blender_utils.get_material('ice', roughness=0.2)
    mat_teal = blender_utils.get_material('glacier_teal', roughness=0.2, emission='#2F8F9D')
    mat_slate = blender_utils.get_material('slate_blue')

    base = create_oct_prism("Base", radius=1.15, depth=0.3, location=(0,0,0.15), material=mat_slate)
    base.parent = root
    p1 = create_hex_prism("Plinth", radius=0.85, depth=0.4, location=(0,0,0.45), material=mat_stone)
    p1.parent = root

    if level == '1':
        # Single central floating frost obelisk
        crystal = create_cone("SpireTop", radius=0.45, depth=1.3, vertices=6, location=(0,0,1.4), material=mat_teal)
        crystal.parent = root
        crystal_b = create_cone("SpireBot", radius=0.45, depth=0.6, vertices=6, location=(0,0,0.75), rotation=(3.1415,0,0), material=mat_ice)
        crystal_b.parent = root
    elif level == '2':
        crystal = create_cone("SpireTop", radius=0.55, depth=1.5, vertices=6, location=(0,0,1.55), material=mat_teal)
        crystal.parent = root
        crystal_b = create_cone("SpireBot", radius=0.55, depth=0.7, vertices=6, location=(0,0,0.8), rotation=(3.1415,0,0), material=mat_ice)
        crystal_b.parent = root
        # 3 orbiting shard crystals
        for ang in [0, 2.09, 4.18]:
            ox = 0.75 * math.cos(ang)
            oy = 0.75 * math.sin(ang)
            shard = create_cone("Shard", radius=0.18, depth=0.7, vertices=5, location=(ox, oy, 1.1), rotation=(0.2*math.cos(ang), 0.2*math.sin(ang), 0), material=mat_ice)
            shard.parent = root
    elif level == '3a': # Absolute freeze (Jagged Permafrost Monolith)
        crystal = create_cone("SpireTop", radius=0.7, depth=1.8, vertices=8, location=(0,0,1.7), material=mat_teal)
        crystal.parent = root
        crystal_b = create_cone("SpireBot", radius=0.7, depth=0.8, vertices=8, location=(0,0,0.8), rotation=(3.1415,0,0), material=mat_ice)
        crystal_b.parent = root
        # 5 jagged spires around base
        for ang in [0.5, 1.7, 2.9, 4.1, 5.3]:
            ox = 0.7 * math.cos(ang)
            oy = 0.7 * math.sin(ang)
            spk = create_cone("Spike", radius=0.22, depth=1.0, vertices=4, location=(ox, oy, 0.8), rotation=(0.35*math.sin(ang), -0.35*math.cos(ang), ang), material=mat_ice)
            spk.parent = root
    elif level == '3b': # Permafrost Aura (Radiant Crystal Lotus)
        crystal = create_cone("SpireTop", radius=0.6, depth=1.5, vertices=6, location=(0,0,1.6), material=mat_teal)
        crystal.parent = root
        # 6 flared lotus petals
        for ang in [i * 1.047 for i in range(6)]:
            ox = 0.65 * math.cos(ang)
            oy = 0.65 * math.sin(ang)
            petal = create_cone("Petal", radius=0.3, depth=1.1, vertices=4, location=(ox, oy, 0.9), rotation=(0.4*math.sin(ang), -0.4*math.cos(ang), ang), material=mat_teal)
            petal.parent = root
    return root

# ----------------- TOWER 4: GUARD POST -----------------
def build_guard_post(level='1'):
    root = bpy.data.objects.new(f"Guard_{level}_Root", None)
    bpy.context.scene.collection.objects.link(root)

    mat_stone = blender_utils.get_material('stone')
    mat_wood = blender_utils.get_material('wood')
    mat_iron = blender_utils.get_material('iron')
    mat_saffron = blender_utils.get_material('saffron')
    mat_slate = blender_utils.get_material('slate_blue')

    base = create_oct_prism("Base", radius=1.2, depth=0.3, location=(0,0,0.15), material=mat_stone)
    base.parent = root

    if level == '1':
        # Guard hut + 1 guard miniature
        hut = create_box("Hut", size=(1.1, 1.1, 0.8), location=(-0.1, -0.1, 0.65), material=mat_stone)
        hut.parent = root
        roof = create_cone("Roof", radius=0.9, depth=0.5, vertices=4, location=(-0.1, -0.1, 1.25), rotation=(0,0,0.785), material=mat_wood)
        roof.parent = root
        # Guard figurine
        guard_body = create_cylinder("Guard", radius=0.18, depth=0.45, vertices=6, location=(0.5, 0.4, 0.5), material=mat_slate)
        guard_body.parent = root
        guard_head = create_cylinder("GHead", radius=0.12, depth=0.2, vertices=6, location=(0.5, 0.4, 0.8), material=mat_iron)
        guard_head.parent = root
        spear = create_cylinder("Spear", radius=0.03, depth=0.9, vertices=4, location=(0.6, 0.5, 0.65), material=mat_wood)
        spear.parent = root
        pennant = create_cone("Pen", radius=0.1, depth=0.3, vertices=4, location=(-0.6, 0.4, 1.1), rotation=(3.14, 0, 0), material=mat_saffron)
        pennant.parent = root
    elif level == '2':
        # Fortified keep with 2 guards
        hut = create_box("Keep", size=(1.3, 1.3, 0.9), location=(0, 0, 0.7), material=mat_stone)
        hut.parent = root
        battlement = create_box("Crenel", size=(1.45, 1.45, 0.25), location=(0, 0, 1.2), material=mat_stone)
        battlement.parent = root
        roof = create_cone("Roof", radius=0.8, depth=0.6, vertices=4, location=(0, 0, 1.5), rotation=(0,0,0.785), material=mat_slate)
        roof.parent = root
        # 2 guards
        for gx, gy in [(0.5, -0.3), (-0.3, 0.5)]:
            g = create_cylinder("Guard", radius=0.18, depth=0.45, vertices=6, location=(gx, gy, 0.5), material=mat_slate)
            g.parent = root
            gh = create_cylinder("GHead", radius=0.12, depth=0.2, vertices=6, location=(gx, gy, 0.8), material=mat_iron)
            gh.parent = root
            sh = create_box("Shield", size=(0.08, 0.22, 0.35), location=(gx+0.12, gy, 0.6), material=mat_saffron)
            sh.parent = root
    elif level == '3a': # Tanky Shieldbastion
        hut = create_oct_prism("Keep", radius=1.0, depth=1.1, location=(0, 0, 0.8), material=mat_stone)
        hut.parent = root
        top = create_oct_prism("Top", radius=1.15, depth=0.3, location=(0, 0, 1.45), material=mat_iron)
        top.parent = root
        # Great tower-shields on rampart
        for ang in [0.78, 2.35, 3.92, 5.5]:
            sx = 0.9 * math.cos(ang)
            sy = 0.9 * math.sin(ang)
            sh = create_box("TowerShield", size=(0.1, 0.4, 0.6), location=(sx, sy, 1.4), rotation=(0, 0, ang), material=mat_slate)
            sh.parent = root
        banner = create_box("Banner", size=(0.1, 0.5, 1.0), location=(0, 0, 1.9), material=mat_saffron)
        banner.parent = root
    elif level == '3b': # Halberd Vanguard
        hut = create_box("Keep", size=(1.2, 1.2, 1.0), location=(0, 0, 0.75), material=mat_stone)
        hut.parent = root
        roof = create_cone("Roof", radius=1.0, depth=0.8, vertices=6, location=(0, 0, 1.6), material=mat_slate)
        roof.parent = root
        # Crossed halberds and banners
        for ang in [-0.5, 0.5]:
            p = create_cylinder("Pole", radius=0.04, depth=1.8, vertices=4, location=(0.3, 0.3, 1.3), rotation=(ang, -ang, 0), material=mat_wood)
            p.parent = root
        banner = create_box("WarFlag", size=(0.08, 0.7, 0.6), location=(0.35, 0.35, 1.9), material=mat_saffron)
        banner.parent = root
    return root

# ----------------- TOWER 5: BELL TOWER -----------------
def build_bell_tower(level='1'):
    root = bpy.data.objects.new(f"Bell_{level}_Root", None)
    bpy.context.scene.collection.objects.link(root)

    mat_stone = blender_utils.get_material('stone')
    mat_gold = blender_utils.get_material('gold', metallic=0.8, roughness=0.25)
    mat_slate = blender_utils.get_material('slate_blue')
    mat_saffron = blender_utils.get_material('saffron')
    mat_teal = blender_utils.get_material('glacier_teal')

    base = create_oct_prism("Base", radius=1.2, depth=0.35, location=(0,0,0.175), material=mat_stone)
    base.parent = root

    if level == '1':
        # Belfry with single golden bell
        for px, py in [(-0.5, -0.5), (-0.5, 0.5), (0.5, -0.5), (0.5, 0.5)]:
            pillar = create_cylinder("Pillar", radius=0.12, depth=1.1, vertices=6, location=(px, py, 0.85), material=mat_stone)
            pillar.parent = root
        roof = create_cone("Roof", radius=0.9, depth=0.6, vertices=4, location=(0,0,1.65), rotation=(0,0,0.785), material=mat_slate)
        roof.parent = root
        bell = create_cone("Bell", radius=0.32, depth=0.5, vertices=8, location=(0,0,1.0), material=mat_gold)
        bell.parent = root
    elif level == '2':
        # Two-tier belfry
        for px, py in [(-0.6, -0.6), (-0.6, 0.6), (0.6, -0.6), (0.6, 0.6)]:
            pillar = create_cylinder("Pillar", radius=0.14, depth=1.3, vertices=6, location=(px, py, 0.95), material=mat_stone)
            pillar.parent = root
        tier_deck = create_oct_prism("Deck", radius=1.0, depth=0.2, location=(0,0,1.65), material=mat_stone)
        tier_deck.parent = root
        roof = create_cone("Roof", radius=0.9, depth=0.7, vertices=6, location=(0,0,2.15), material=mat_slate)
        roof.parent = root
        bell = create_cone("Bell", radius=0.42, depth=0.65, vertices=10, location=(0,0,1.1), material=mat_gold)
        bell.parent = root
        c1 = create_cone("Finial", radius=0.15, depth=0.4, vertices=5, location=(0,0,2.65), material=mat_gold)
        c1.parent = root
    elif level == '3a': # Imperial War Clarion
        for px, py in [(-0.65, -0.65), (-0.65, 0.65), (0.65, -0.65), (0.65, 0.65)]:
            pillar = create_oct_prism("Pillar", radius=0.2, depth=1.4, location=(px, py, 1.0), material=mat_stone)
            pillar.parent = root
        roof = create_cone("Roof", radius=1.1, depth=0.9, vertices=8, location=(0,0,2.1), material=mat_slate)
        roof.parent = root
        bell = create_cone("GreatBell", radius=0.55, depth=0.8, vertices=12, location=(0,0,1.15), material=mat_gold)
        bell.parent = root
        # 4 War pennants
        for px, py in [(-0.7, -0.7), (-0.7, 0.7), (0.7, -0.7), (0.7, 0.7)]:
            flag = create_box("Flag", size=(0.05, 0.25, 0.5), location=(px, py, 1.7), material=mat_saffron)
            flag.parent = root
    elif level == '3b': # Seismic Resonator
        for px, py in [(-0.6, -0.6), (-0.6, 0.6), (0.6, -0.6), (0.6, 0.6)]:
            pillar = create_cylinder("Pillar", radius=0.16, depth=1.3, vertices=6, location=(px, py, 0.95), material=mat_slate)
            pillar.parent = root
        roof = create_cone("Roof", radius=1.0, depth=0.7, vertices=4, location=(0,0,1.9), rotation=(0,0,0.785), material=mat_slate)
        roof.parent = root
        bell = create_cone("ResonatorBell", radius=0.48, depth=0.7, vertices=10, location=(0,0,1.1), material=mat_gold)
        bell.parent = root
        # Dual resonance crystal horns
        h1 = create_cone("Horn1", radius=0.25, depth=0.7, vertices=6, location=(0.7, 0.7, 1.7), rotation=(math.radians(45), math.radians(-45), 0), material=mat_teal)
        h1.parent = root
        h2 = create_cone("Horn2", radius=0.25, depth=0.7, vertices=6, location=(-0.7, -0.7, 1.7), rotation=(math.radians(-45), math.radians(45), 0), material=mat_teal)
        h2.parent = root
    return root

# ----------------- ENEMIES -----------------
def build_enemy_runner(pose=0): # 焰兵 Runner
    root = bpy.data.objects.new("Enemy_Runner_Root", None)
    bpy.context.scene.collection.objects.link(root)

    mat_skin = blender_utils.get_material('ember_coral')
    mat_dark = blender_utils.get_material('ember_dark')
    mat_glow = blender_utils.get_material('ember_glow', emission='#FF7A45')
    mat_wood = blender_utils.get_material('wood_dark')

    leg_l_angle = math.sin(pose * math.pi / 2.0) * 0.4
    leg_r_angle = -math.sin(pose * math.pi / 2.0) * 0.4

    # Body (hunchbacked low-poly)
    torso = create_box("Torso", size=(0.4, 0.4, 0.5), location=(0, 0, 0.55), rotation=(0.25, 0, 0), material=mat_skin)
    torso.parent = root
    head = create_box("Head", size=(0.35, 0.35, 0.35), location=(0, 0.2, 0.9), rotation=(0.1, 0, 0), material=mat_skin)
    head.parent = root
    horn_l = create_cone("HornL", radius=0.08, depth=0.3, vertices=4, location=(-0.12, 0.25, 1.15), rotation=(-0.4, -0.2, 0), material=mat_dark)
    horn_l.parent = root
    horn_r = create_cone("HornR", radius=0.08, depth=0.3, vertices=4, location=(0.12, 0.25, 1.15), rotation=(-0.4, 0.2, 0), material=mat_dark)
    horn_r.parent = root

    # Legs
    leg_l = create_box("LegL", size=(0.14, 0.16, 0.4), location=(-0.15, leg_l_angle*0.3, 0.2), rotation=(leg_l_angle, 0, 0), material=mat_dark)
    leg_l.parent = root
    leg_r = create_box("LegR", size=(0.14, 0.16, 0.4), location=(0.15, leg_r_angle*0.3, 0.2), rotation=(leg_r_angle, 0, 0), material=mat_dark)
    leg_r.parent = root

    # Spiked club weapon
    club = create_cylinder("Club", radius=0.05, depth=0.7, vertices=5, location=(0.3, 0.2, 0.6), rotation=(0.4, 0, 0), material=mat_wood)
    club.parent = root
    club_head = create_cone("ClubHead", radius=0.14, depth=0.3, vertices=5, location=(0.3, 0.4, 0.8), rotation=(1.57, 0, 0), material=mat_dark)
    club_head.parent = root
    return root

def build_enemy_armoured(pose=0): # 盾兵 Armoured
    root = bpy.data.objects.new("Enemy_Armoured_Root", None)
    bpy.context.scene.collection.objects.link(root)

    mat_skin = blender_utils.get_material('ember_coral')
    mat_plate = blender_utils.get_material('ember_dark')
    mat_glow = blender_utils.get_material('ember_glow', emission='#FF7A45')
    mat_iron = blender_utils.get_material('iron')

    leg_l_angle = math.sin(pose * math.pi / 2.0) * 0.3
    leg_r_angle = -math.sin(pose * math.pi / 2.0) * 0.3

    torso = create_box("Torso", size=(0.6, 0.5, 0.65), location=(0, 0, 0.65), material=mat_plate)
    torso.parent = root
    head = create_box("Head", size=(0.4, 0.4, 0.4), location=(0, 0.05, 1.1), material=mat_plate)
    head.parent = root
    visor = create_box("Visor", size=(0.32, 0.1, 0.1), location=(0, 0.24, 1.1), material=mat_glow)
    visor.parent = root

    # Heavy shield on left arm
    shield = create_box("Shield", size=(0.12, 0.65, 0.95), location=(-0.38, 0.15, 0.65), rotation=(0.1, 0.15, 0), material=mat_iron)
    shield.parent = root
    shield_crest = create_cone("Boss", radius=0.15, depth=0.15, vertices=6, location=(-0.45, 0.15, 0.65), rotation=(0, 1.57, 0), material=mat_glow)
    shield_crest.parent = root

    # Cleaver on right arm
    mace = create_cylinder("Mace", radius=0.06, depth=0.8, vertices=6, location=(0.38, 0.05, 0.6), rotation=(0.3, 0, 0), material=mat_iron)
    mace.parent = root

    # Legs
    leg_l = create_box("LegL", size=(0.2, 0.22, 0.45), location=(-0.18, leg_l_angle*0.3, 0.22), rotation=(leg_l_angle, 0, 0), material=mat_plate)
    leg_l.parent = root
    leg_r = create_box("LegR", size=(0.2, 0.22, 0.45), location=(0.18, leg_r_angle*0.3, 0.22), rotation=(leg_r_angle, 0, 0), material=mat_plate)
    leg_r.parent = root
    return root

def build_enemy_tank(pose=0): # 岩巨人 Rock Golem
    root = bpy.data.objects.new("Enemy_Tank_Root", None)
    bpy.context.scene.collection.objects.link(root)

    mat_stone = blender_utils.get_material('stone_dark')
    mat_glow = blender_utils.get_material('ember_glow', emission='#FF7A45')

    leg_l_angle = math.sin(pose * math.pi / 2.0) * 0.25
    leg_r_angle = -math.sin(pose * math.pi / 2.0) * 0.25

    # Massive torso
    torso = create_box("Torso", size=(1.1, 0.8, 0.9), location=(0, 0, 0.95), rotation=(0.15, 0, 0), material=mat_stone)
    torso.parent = root
    # Glowing magma core inside chest crack
    core = create_box("Core", size=(0.5, 0.1, 0.4), location=(0, 0.41, 0.95), material=mat_glow)
    core.parent = root

    # Head embedded in shoulders
    head = create_box("Head", size=(0.5, 0.45, 0.45), location=(0, 0.2, 1.5), material=mat_stone)
    head.parent = root
    eyes = create_box("Eyes", size=(0.35, 0.1, 0.1), location=(0, 0.43, 1.5), material=mat_glow)
    eyes.parent = root

    # Massive boulder arms
    arm_l = create_cone("ArmL", radius=0.35, depth=0.9, vertices=6, location=(-0.75, 0.0, 0.8), rotation=(0.3, 0, 0), material=mat_stone)
    arm_l.parent = root
    fist_l = create_box("FistL", size=(0.4, 0.4, 0.4), location=(-0.75, 0.2, 0.35), material=mat_stone)
    fist_l.parent = root

    arm_r = create_cone("ArmR", radius=0.35, depth=0.9, vertices=6, location=(0.75, 0.0, 0.8), rotation=(-0.3, 0, 0), material=mat_stone)
    arm_r.parent = root
    fist_r = create_box("FistR", size=(0.4, 0.4, 0.4), location=(0.75, -0.2, 0.35), material=mat_stone)
    fist_r.parent = root

    # Heavy stone legs
    leg_l = create_box("LegL", size=(0.35, 0.4, 0.55), location=(-0.35, leg_l_angle*0.3, 0.27), rotation=(leg_l_angle, 0, 0), material=mat_stone)
    leg_l.parent = root
    leg_r = create_box("LegR", size=(0.35, 0.4, 0.55), location=(0.35, leg_r_angle*0.3, 0.27), rotation=(leg_r_angle, 0, 0), material=mat_stone)
    leg_r.parent = root
    return root

# ----------------- HERO: 霜衛長 -----------------
def build_hero(pose=0):
    root = bpy.data.objects.new("Hero_Root", None)
    bpy.context.scene.collection.objects.link(root)

    mat_plate = blender_utils.get_material('silver', hex_color='#F1F5F9', roughness=0.18, metallic=0.35)
    mat_gold = blender_utils.get_material('gold', hex_color='#FBBF24', roughness=0.25, metallic=0.65)
    mat_saffron = blender_utils.get_material('saffron', hex_color='#F59E0B')
    mat_cape_out = blender_utils.get_material('royal_blue', hex_color='#2563EB', roughness=0.55)
    mat_cape_in = blender_utils.get_material('saffron_cape', hex_color='#FBBF24', roughness=0.65)
    mat_teal = blender_utils.get_material('glacier_teal', hex_color='#38BDF8', roughness=0.2, emission='#38BDF8')
    mat_skin = blender_utils.get_material('ivory', roughness=0.8)
    mat_wood = blender_utils.get_material('wood_dark')

    leg_l_angle = math.sin(pose * math.pi / 2.0) * 0.35
    leg_r_angle = -math.sin(pose * math.pi / 2.0) * 0.35

    # 1. Legs & Greaves (Armored sabatons)
    leg_l = create_box("LegL", size=(0.20, 0.22, 0.52), location=(-0.16, leg_l_angle*0.25, 0.26), rotation=(leg_l_angle, 0, 0), material=mat_plate)
    leg_l.parent = root
    knee_l = create_cone("KneeL", radius=0.12, depth=0.18, vertices=4, location=(-0.16, -0.12 + leg_l_angle*0.25, 0.35), rotation=(math.radians(90), 0, 0), material=mat_gold)
    knee_l.parent = leg_l

    leg_r = create_box("LegR", size=(0.20, 0.22, 0.52), location=(0.16, leg_r_angle*0.25, 0.26), rotation=(leg_r_angle, 0, 0), material=mat_plate)
    leg_r.parent = root
    knee_r = create_cone("KneeR", radius=0.12, depth=0.18, vertices=4, location=(0.16, -0.12 + leg_r_angle*0.25, 0.35), rotation=(math.radians(90), 0, 0), material=mat_gold)
    knee_r.parent = leg_r

    # 2. Torso (Silver Breastplate with Golden Frost Star & Sash)
    waist = create_box("Waist", size=(0.48, 0.36, 0.16), location=(0, 0, 0.54), material=mat_saffron)
    waist.parent = root
    buckle = create_box("Buckle", size=(0.14, 0.10, 0.14), location=(0, -0.19, 0.54), material=mat_gold)
    buckle.parent = root

    torso = create_box("Torso", size=(0.52, 0.40, 0.55), location=(0, -0.02, 0.82), material=mat_plate)
    torso.parent = root
    emblem = create_cone("ChestEmblem", radius=0.16, depth=0.08, vertices=4, location=(0, -0.23, 0.88), rotation=(math.radians(90), 0, 0), material=mat_gold)
    emblem.parent = root

    # 3. Pauldrons (Flared Knight Shoulder Guards)
    pauldron_l = create_oct_prism("PauldronL", radius=0.18, depth=0.25, location=(-0.34, -0.02, 1.02), rotation=(0, math.radians(25), 0), material=mat_gold)
    pauldron_l.parent = root
    pauldron_r = create_oct_prism("PauldronR", radius=0.18, depth=0.25, location=(0.34, -0.02, 1.02), rotation=(0, math.radians(-25), 0), material=mat_gold)
    pauldron_r.parent = root

    # 4. Noble Knight Helm & Face
    face = create_box("Face", size=(0.28, 0.24, 0.24), location=(0, -0.08, 1.20), material=mat_skin)
    face.parent = root

    helm = create_box("Helm", size=(0.36, 0.36, 0.40), location=(0, 0, 1.25), material=mat_plate)
    helm.parent = root
    visor = create_box("Visor", size=(0.38, 0.10, 0.08), location=(0, -0.17, 1.22), material=mat_gold)
    visor.parent = root

    horn_l = create_cone("WingL", radius=0.08, depth=0.45, vertices=4, location=(-0.24, 0.02, 1.45), rotation=(math.radians(-20), math.radians(-35), 0), material=mat_gold)
    horn_l.parent = root
    horn_r = create_cone("WingR", radius=0.08, depth=0.45, vertices=4, location=(0.24, 0.02, 1.45), rotation=(math.radians(-20), math.radians(35), 0), material=mat_gold)
    horn_r.parent = root
    plume = create_cone("Plume", radius=0.12, depth=0.55, vertices=5, location=(0, 0.08, 1.58), rotation=(math.radians(-30), 0, 0), material=mat_saffron)
    plume.parent = root

    # 5. Flowing Cape (Strictly BEHIND shoulders in +Y direction)
    cape_back = create_box("CapeOuter", size=(0.68, 0.08, 0.95), location=(0, 0.24, 0.72), rotation=(math.radians(18), 0, 0), material=mat_cape_out)
    cape_back.parent = root
    cape_inner = create_box("CapeLining", size=(0.64, 0.04, 0.90), location=(0, 0.20, 0.72), rotation=(math.radians(18), 0, 0), material=mat_cape_in)
    cape_inner.parent = root

    # 6. Left Arm & Kite Heraldic Shield
    arm_l = create_box("ArmL", size=(0.14, 0.16, 0.45), location=(-0.32, -0.02, 0.76), material=mat_plate)
    arm_l.parent = root
    shield_body = create_box("ShieldBody", size=(0.08, 0.38, 0.65), location=(-0.44, -0.06, 0.75), rotation=(0, math.radians(-12), math.radians(15)), material=mat_cape_out)
    shield_body.parent = root
    shield_rim = create_box("ShieldRim", size=(0.09, 0.40, 0.08), location=(-0.44, -0.06, 1.02), rotation=(0, math.radians(-12), math.radians(15)), material=mat_gold)
    shield_rim.parent = root
    shield_cross = create_cone("ShieldCross", radius=0.12, depth=0.08, vertices=4, location=(-0.47, -0.07, 0.76), rotation=(math.radians(90), 0, 0), material=mat_teal)
    shield_cross.parent = root

    # 7. Right Arm & Frost-Glaive / Halberd
    arm_r = create_box("ArmR", size=(0.14, 0.16, 0.45), location=(0.32, -0.02, 0.76), material=mat_plate)
    arm_r.parent = root

    spear_x, spear_y = 0.42, -0.08
    shaft = create_cylinder("SpearShaft", radius=0.035, depth=2.5, vertices=6, location=(spear_x, spear_y, 1.15), rotation=(math.radians(5), math.radians(-5), 0), material=mat_wood)
    shaft.parent = root

    axe_blade = create_box("AxeBlade", size=(0.05, 0.32, 0.30), location=(spear_x - 0.08, spear_y - 0.08, 2.15), rotation=(math.radians(5), math.radians(-5), math.radians(-15)), material=mat_gold)
    axe_blade.parent = root

    spear_head = create_cone("SpearPoint", radius=0.12, depth=0.65, vertices=4, location=(spear_x, spear_y, 2.50), rotation=(math.radians(5), math.radians(-5), 0), material=mat_plate)
    spear_head.parent = root
    crystal = create_cone("FrostCrystal", radius=0.07, depth=0.35, vertices=6, location=(spear_x, spear_y, 2.25), rotation=(math.radians(5), math.radians(-5), 0), material=mat_teal)
    crystal.parent = root

    pennant = create_box("Pennant", size=(0.03, 0.45, 0.25), location=(spear_x + 0.16, spear_y + 0.05, 2.02), rotation=(math.radians(5), math.radians(-5), math.radians(20)), material=mat_saffron)
    pennant.parent = root

    return root

def build_guard(pose=0):
    root = bpy.data.objects.new("Guard_Root", None)
    bpy.context.scene.collection.objects.link(root)

    mat_armor = blender_utils.get_material('slate_blue', hex_color='#46608A', roughness=0.35, metallic=0.4)
    mat_plate = blender_utils.get_material('iron', hex_color='#94A3B8', roughness=0.3, metallic=0.6)
    mat_gold = blender_utils.get_material('gold', hex_color='#FBBF24', roughness=0.25, metallic=0.65)
    mat_saffron = blender_utils.get_material('saffron', hex_color='#F59E0B')
    mat_wood = blender_utils.get_material('wood_dark')
    mat_skin = blender_utils.get_material('ivory', roughness=0.8)

    leg_l_angle = math.sin(pose * math.pi / 2.0) * 0.3
    leg_r_angle = -math.sin(pose * math.pi / 2.0) * 0.3

    # Legs & Boots
    leg_l = create_box("GLegL", size=(0.18, 0.20, 0.44), location=(-0.14, leg_l_angle * 0.2, 0.22), rotation=(leg_l_angle, 0, 0), material=mat_armor)
    leg_l.parent = root
    leg_r = create_box("GLegR", size=(0.18, 0.20, 0.44), location=(0.14, leg_r_angle * 0.2, 0.22), rotation=(leg_r_angle, 0, 0), material=mat_armor)
    leg_r.parent = root

    # Torso (Armored Warden Tabard)
    waist = create_box("GWaist", size=(0.42, 0.32, 0.14), location=(0, 0, 0.48), material=mat_wood)
    waist.parent = root
    torso = create_box("GTorso", size=(0.46, 0.36, 0.48), location=(0, -0.02, 0.72), material=mat_armor)
    torso.parent = root
    sash = create_box("GSash", size=(0.20, 0.38, 0.44), location=(0, -0.01, 0.70), material=mat_saffron)
    sash.parent = root

    # Pauldrons
    p_l = create_cone("GPauldronL", radius=0.15, depth=0.18, vertices=5, location=(-0.28, -0.02, 0.90), rotation=(0, math.radians(30), 0), material=mat_plate)
    p_l.parent = root
    p_r = create_cone("GPauldronR", radius=0.15, depth=0.18, vertices=5, location=(0.28, -0.02, 0.90), rotation=(0, math.radians(-30), 0), material=mat_plate)
    p_r.parent = root

    # Head & Iron Warden Kettle Helm with Nasal Guard & Saffron Crest
    face = create_box("GFace", size=(0.24, 0.22, 0.22), location=(0, -0.06, 1.05), material=mat_skin)
    face.parent = root
    helm_crown = create_oct_prism("GHelmCrown", radius=0.22, depth=0.28, location=(0, 0, 1.15), material=mat_plate)
    helm_crown.parent = root
    helm_brim = create_cone("GHelmBrim", radius=0.34, depth=0.12, vertices=8, location=(0, 0, 1.10), material=mat_plate)
    helm_brim.parent = root
    crest = create_box("GCrest", size=(0.06, 0.30, 0.18), location=(0, 0, 1.30), material=mat_saffron)
    crest.parent = root

    # Left Hand: Round Warden Shield with Gold Boss
    shield = create_oct_prism("GShield", radius=0.32, depth=0.08, location=(-0.35, -0.10, 0.68), rotation=(math.radians(15), math.radians(20), math.radians(10)), material=mat_armor)
    shield.parent = root
    boss = create_cone("GShieldBoss", radius=0.10, depth=0.08, vertices=6, location=(-0.35, -0.15, 0.68), rotation=(math.radians(90), 0, 0), material=mat_gold)
    boss.parent = root

    # Right Hand: Warden Spear / Halberd
    spear_shaft = create_cylinder("GSpearShaft", radius=0.03, depth=1.5, vertices=6, location=(0.35, -0.05, 0.85), rotation=(math.radians(10), 0, math.radians(-10)), material=mat_wood)
    spear_shaft.parent = root
    spear_tip = create_cone("GSpearTip", radius=0.09, depth=0.35, vertices=4, location=(0.35, -0.12, 1.62), rotation=(math.radians(10), 0, math.radians(-10)), material=mat_plate)
    spear_tip.parent = root
    spear_pennant = create_box("GPennant", size=(0.02, 0.22, 0.15), location=(0.35, 0.05, 1.48), material=mat_saffron)
    spear_pennant.parent = root

    return root
