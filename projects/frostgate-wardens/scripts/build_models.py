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
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
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

# ----------------- TOWER 1: CROSSBOW (Open Siege Turret, NO Hut Roof) -----------------
def build_crossbow(level='1'):
    root = bpy.data.objects.new(f"Crossbow_{level}_Root", None)
    bpy.context.scene.collection.objects.link(root)

    mat_stone = blender_utils.get_material('stone')
    mat_stone_dark = blender_utils.get_material('stone_dark')
    mat_wood = blender_utils.get_material('wood')
    mat_wood_dark = blender_utils.get_material('wood_dark')
    mat_iron = blender_utils.get_material('iron', metallic=0.7, roughness=0.4)
    mat_gold = blender_utils.get_material('gold', metallic=0.8, roughness=0.25)
    mat_saffron = blender_utils.get_material('saffron')
    mat_teal = blender_utils.get_material('glacier_teal', roughness=0.3, emission='#2F8F9D')
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

    # Timber deck platform
    timber = create_oct_prism("Deck", radius=0.95, depth=0.14, location=(0,0,0.52), material=mat_wood)
    timber.parent = root

    if level == '1':
        # Open stone battlement parapet (4 stone crenels around perimeter, NO gazebo roof!)
        for ang in [0.785, 2.356, 3.927, 5.498]:
            cx = 0.85 * math.cos(ang)
            cy = 0.85 * math.sin(ang)
            crenel = create_box(f"Crenel_{ang:.2f}", size=(0.28, 0.28, 0.32), location=(cx, cy, 0.70), material=mat_stone)
            crenel.parent = root

        # Heavy wood turntable carriage on the platform
        turntable = create_cylinder("Carriage", radius=0.55, depth=0.22, vertices=8, location=(0, 0, 0.65), material=mat_wood_dark)
        turntable.parent = root
        pivot_pin = create_cylinder("PivotPin", radius=0.18, depth=0.35, vertices=6, location=(0, 0, 0.85), material=mat_iron)
        pivot_pin.parent = root

        # Massive Siege Ballista mounted on top
        rot_aim = (math.radians(14), math.radians(-14), math.radians(45))
        # Long heavy timber stock
        stock = create_box("Stock", size=(0.28, 1.6, 0.24), location=(0.05, 0.05, 1.05), rotation=rot_aim, material=mat_wood)
        stock.parent = root
        # Front bow mounting bracket
        bracket = create_box("BowBracket", size=(0.42, 0.22, 0.32), location=(0.45, 0.45, 1.25), rotation=rot_aim, material=mat_iron)
        bracket.parent = root
        # Massive wide curved steel bow arms (spanning 2.2 units wide!)
        bow = create_box("BowArms", size=(2.2, 0.16, 0.26), location=(0.50, 0.50, 1.28), rotation=(math.radians(14), math.radians(-14), math.radians(-45)), material=mat_iron)
        bow.parent = root
        # Bowstring tips
        for side, ox, oy in [(-1, -0.65, 0.65), (1, 0.65, -0.65)]:
            s_arm = create_cone(f"BowTip_{side}", radius=0.12, depth=0.3, vertices=4, location=(0.50 + ox, 0.50 + oy, 1.28), rotation=rot_aim, material=mat_gold)
            s_arm.parent = root
        # Heavy iron-tipped siege bolt loaded in track
        bolt = create_cylinder("SiegeBolt", radius=0.06, depth=1.3, vertices=6, location=(0.32, 0.32, 1.22), rotation=(math.radians(76), math.radians(14), math.radians(-45)), material=mat_iron)
        bolt.parent = root
        bolt_head = create_cone("BoltTip", radius=0.14, depth=0.35, vertices=4, location=(0.75, 0.75, 1.45), rotation=(math.radians(76), math.radians(14), math.radians(-45)), material=mat_gold)
        bolt_head.parent = root
        # Winch crank gear on side
        winch = create_cylinder("WinchGear", radius=0.22, depth=0.12, vertices=8, location=(-0.25, -0.25, 0.95), rotation=(math.radians(90), 0, math.radians(45)), material=mat_bronze)
        winch.parent = root
        # Small heraldic war pennant on rear stock
        pennant = create_box("Pennant", size=(0.04, 0.45, 0.25), location=(-0.55, -0.55, 1.0), rotation=(0, 0, math.radians(45)), material=mat_saffron)
        pennant.parent = root

    elif level == '2':
        # Reinforced Stone Bastion with elevated double-deck
        tower = create_oct_prism("TowerShaft", radius=0.95, depth=0.6, location=(0, 0, 0.75), material=mat_stone)
        tower.parent = root
        platform = create_oct_prism("Platform", radius=1.1, depth=0.15, location=(0, 0, 1.1), material=mat_stone_dark)
        platform.parent = root
        # Stone crenellations
        for ang in [0, 1.05, 2.09, 3.14, 4.19, 5.24]:
            cx = 1.0 * math.cos(ang)
            cy = 1.0 * math.sin(ang)
            crenel = create_box(f"Crenel_{ang:.2f}", size=(0.25, 0.25, 0.3), location=(cx, cy, 1.3), material=mat_stone)
            crenel.parent = root
        # Iron frontal mantlet / blast shield
        shield = create_box("Mantlet", size=(1.2, 0.12, 0.45), location=(0.4, 0.4, 1.4), rotation=(0, 0, math.radians(-45)), material=mat_iron)
        shield.parent = root
        # Twin heavy ballistas mounted on the deck
        rot_aim = (math.radians(14), math.radians(-14), math.radians(45))
        for offset in [-0.28, 0.28]:
            ox = offset * 0.707
            oy = -offset * 0.707
            stk = create_box(f"Stock_{offset}", size=(0.20, 1.5, 0.20), location=(ox, oy, 1.45), rotation=rot_aim, material=mat_wood)
            stk.parent = root
            bw = create_box(f"Bow_{offset}", size=(1.6, 0.14, 0.20), location=(ox + 0.4, oy + 0.4, 1.65), rotation=(math.radians(14), math.radians(-14), math.radians(-45)), material=mat_iron)
            bw.parent = root
            blt = create_cone(f"Tip_{offset}", radius=0.10, depth=0.28, vertices=4, location=(ox + 0.75, oy + 0.75, 1.8), rotation=(math.radians(76), math.radians(14), math.radians(-45)), material=mat_gold)
            blt.parent = root

    elif level == '3a': # Piercing (Great Arbalest Monolith)
        keep = create_oct_prism("Keep", radius=1.05, depth=0.9, location=(0,0,0.75), material=mat_stone)
        keep.parent = root
        rim = create_oct_prism("IronRampart", radius=1.2, depth=0.25, location=(0,0,1.25), material=mat_stone_dark)
        rim.parent = root
        turret = create_cylinder("HeavyTurret", radius=0.7, depth=0.45, vertices=8, location=(0,0,1.55), material=mat_iron)
        turret.parent = root
        rot_aim = (math.radians(15), math.radians(-15), math.radians(45))
        stock = create_box("ColossalStock", size=(0.38, 2.0, 0.38), location=(0.15, 0.15, 1.85), rotation=rot_aim, material=mat_iron)
        stock.parent = root
        bow = create_box("ColossalBow", size=(2.6, 0.22, 0.30), location=(0.7, 0.7, 2.1), rotation=(math.radians(15), math.radians(-15), math.radians(-45)), material=mat_iron)
        bow.parent = root
        crystal = create_cone("PermafrostBolt", radius=0.22, depth=1.0, vertices=6, location=(1.15, 1.15, 2.35), rotation=(math.radians(75), math.radians(15), math.radians(-45)), material=mat_teal)
        crystal.parent = root
        banner = create_box("Banner", size=(0.06, 0.6, 1.1), location=(-0.65, -0.65, 1.95), rotation=(0, 0, math.radians(45)), material=mat_saffron)
        banner.parent = root

    elif level == '3b': # Volley (Repeating Ballista with Revolving Magazine)
        keep = create_oct_prism("Keep", radius=1.05, depth=0.9, location=(0,0,0.75), material=mat_stone)
        keep.parent = root
        top_deck = create_oct_prism("Deck", radius=1.15, depth=0.22, location=(0,0,1.25), material=mat_stone_dark)
        top_deck.parent = root
        mag = create_box("Magazine", size=(0.75, 0.75, 0.65), location=(-0.1, -0.1, 1.6), rotation=(0, 0, math.radians(45)), material=mat_wood_dark)
        mag.parent = root
        gear = create_cylinder("BrassGear", radius=0.45, depth=0.15, vertices=12, location=(-0.35, -0.35, 1.6), rotation=(math.radians(90), 0, math.radians(45)), material=mat_gold)
        gear.parent = root
        rot_aim = (math.radians(12), math.radians(-12), math.radians(45))
        for dz in [-0.2, 0.05, 0.3]:
            stk = create_box(f"Stock_{dz}", size=(0.18, 1.5, 0.16), location=(0.15, 0.15, 1.65 + dz), rotation=rot_aim, material=mat_iron)
            stk.parent = root
            bw = create_box(f"Bow_{dz}", size=(1.5, 0.12, 0.16), location=(0.55, 0.55, 1.8 + dz), rotation=(math.radians(12), math.radians(-12), math.radians(-45)), material=mat_gold)
            bw.parent = root
    return root

# ----------------- TOWER 2: STONE MORTAR (Chunky Bombard Cannon) -----------------
def build_mortar(level='1'):
    root = bpy.data.objects.new(f"Mortar_{level}_Root", None)
    bpy.context.scene.collection.objects.link(root)

    mat_stone_dark = blender_utils.get_material('stone_dark')
    mat_stone = blender_utils.get_material('stone')
    mat_iron = blender_utils.get_material('iron', metallic=0.7, roughness=0.4)
    mat_wood = blender_utils.get_material('wood')
    mat_wood_dark = blender_utils.get_material('wood_dark')
    mat_bronze = blender_utils.get_material('bronze', metallic=0.6, roughness=0.3)
    mat_ember = blender_utils.get_material('ember_glow', roughness=0.3, emission='#FF7A45')
    mat_gold = blender_utils.get_material('gold', metallic=0.8, roughness=0.25)

    base = create_oct_prism("Base", radius=1.2, depth=0.35, location=(0,0,0.175), material=mat_stone_dark)
    base.parent = root
    plinth = create_oct_prism("Plinth", radius=1.0, depth=0.25, location=(0,0,0.45), material=mat_stone)
    plinth.parent = root

    if level == '1':
        # Stone parapet ring with embrasures
        for ang in [0, 1.57, 3.14, 4.71]:
            cx = 0.9 * math.cos(ang)
            cy = 0.9 * math.sin(ang)
            crenel = create_box(f"Crenel_{ang:.2f}", size=(0.3, 0.3, 0.3), location=(cx, cy, 0.65), material=mat_stone)
            crenel.parent = root

        # Heavy wooden gun carriage / bed
        bed = create_box("GunCarriage", size=(0.85, 0.85, 0.3), location=(-0.05, -0.05, 0.65), rotation=(0, 0, math.radians(45)), material=mat_wood_dark)
        bed.parent = root
        iron_brackets = create_box("IronBrackets", size=(0.92, 0.45, 0.25), location=(-0.05, -0.05, 0.85), rotation=(0, 0, math.radians(45)), material=mat_iron)
        iron_brackets.parent = root

        # Chunky Bronze/Iron Bombard Cannon Barrel angled up at ~42 deg
        rot_barrel = (math.radians(28), math.radians(-28), math.radians(45))
        barrel = create_cylinder("BombardBarrel", radius=0.46, depth=1.1, vertices=10, location=(0.15, 0.15, 1.05), rotation=rot_barrel, material=mat_bronze)
        barrel.parent = root
        muzzle_ring = create_cylinder("MuzzleRing", radius=0.54, depth=0.22, vertices=10, location=(0.42, 0.42, 1.45), rotation=rot_barrel, material=mat_iron)
        muzzle_ring.parent = root
        bore = create_cylinder("Bore", radius=0.34, depth=0.10, vertices=8, location=(0.46, 0.46, 1.52), rotation=rot_barrel, material=mat_iron)
        bore.parent = root

        # Ammo: Pyramid of heavy black iron cannonballs on deck
        ball_mat = mat_iron
        for p in [(-0.45, 0.15, 0.68), (-0.25, 0.35, 0.68), (-0.45, 0.45, 0.68), (-0.35, 0.3, 0.88)]:
            ball = create_cylinder(f"Cannonball_{p[0]:.2f}", radius=0.14, depth=0.18, vertices=6, location=p, material=ball_mat)
            ball.parent = root

        # Powder cask
        cask = create_cylinder("PowderCask", radius=0.20, depth=0.35, vertices=8, location=(0.35, -0.45, 0.72), material=mat_wood)
        cask.parent = root
        cask_hoop = create_cylinder("CaskHoop", radius=0.22, depth=0.08, vertices=8, location=(0.35, -0.45, 0.72), material=mat_iron)
        cask_hoop.parent = root

    elif level == '2':
        ped = create_oct_prism("Mount", radius=0.9, depth=0.6, location=(0,0,0.7), material=mat_stone)
        ped.parent = root
        iron_rim = create_cylinder("Rim", radius=0.95, depth=0.15, vertices=8, location=(0,0,1.0), material=mat_iron)
        iron_rim.parent = root
        rot_barrel = (math.radians(30), math.radians(-30), math.radians(45))
        barrel = create_cylinder("Barrel", radius=0.55, depth=1.3, vertices=10, location=(0.2, 0.2, 1.25), rotation=rot_barrel, material=mat_bronze)
        barrel.parent = root
        muzzle = create_cylinder("Muzzle", radius=0.65, depth=0.25, vertices=10, location=(0.55, 0.55, 1.70), rotation=rot_barrel, material=mat_iron)
        muzzle.parent = root
        gold_ring = create_cylinder("GoldRelief", radius=0.58, depth=0.12, vertices=10, location=(0.32, 0.32, 1.40), rotation=rot_barrel, material=mat_gold)
        gold_ring.parent = root
        crate = create_box("AmmoCrate", size=(0.5, 0.4, 0.35), location=(-0.4, 0.2, 0.75), material=mat_wood)
        crate.parent = root

    elif level == '3a': # Colossus blast
        ped = create_oct_prism("Mount", radius=1.05, depth=0.75, location=(0,0,0.75), material=mat_stone_dark)
        ped.parent = root
        rot_barrel = (math.radians(32), math.radians(-32), math.radians(45))
        barrel = create_cylinder("ColossusBarrel", radius=0.72, depth=1.5, vertices=12, location=(0.25, 0.25, 1.4), rotation=rot_barrel, material=mat_iron)
        barrel.parent = root
        muzzle = create_cylinder("Muzzle", radius=0.84, depth=0.30, vertices=12, location=(0.70, 0.70, 1.95), rotation=rot_barrel, material=mat_stone_dark)
        muzzle.parent = root
        core = create_cylinder("Core", radius=0.50, depth=0.12, vertices=10, location=(0.75, 0.75, 2.02), rotation=rot_barrel, material=mat_ember)
        core.parent = root

    elif level == '3b': # Cluster mortar
        ped = create_oct_prism("Mount", radius=0.95, depth=0.65, location=(0,0,0.7), material=mat_stone)
        ped.parent = root
        rot_barrel = (math.radians(30), math.radians(-30), math.radians(45))
        for ox, oy, oz in [(-0.18, 0.28, 1.25), (0.28, -0.18, 1.25), (0.22, 0.22, 1.55)]:
            b = create_cylinder(f"Bar_{ox:.2f}", radius=0.30, depth=1.2, vertices=8, location=(ox, oy, oz), rotation=rot_barrel, material=mat_bronze)
            b.parent = root
            m = create_cylinder(f"Muz_{ox:.2f}", radius=0.36, depth=0.18, vertices=8, location=(ox+0.32, oy+0.32, oz+0.42), rotation=rot_barrel, material=mat_iron)
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
def build_enemy_runner(pose=0): # 焰兵 Raider Miniature
    root = bpy.data.objects.new("Enemy_Runner_Root", None)
    bpy.context.scene.collection.objects.link(root)

    mat_skin = blender_utils.get_material('ember_coral', hex_color='#D95338', roughness=0.55)
    mat_dark = blender_utils.get_material('ember_dark', hex_color='#401814', roughness=0.7)
    mat_glow = blender_utils.get_material('ember_glow', roughness=0.25, emission='#FF6A00')
    mat_wood = blender_utils.get_material('wood_dark', hex_color='#4A3423')
    mat_iron = blender_utils.get_material('iron', hex_color='#5A6068', metallic=0.6, roughness=0.4)

    stride = math.sin(pose * math.pi / 2.0)
    leg_l = stride * 0.4
    leg_r = -stride * 0.4

    # 1. Torso & Pelvis
    pelvis = create_cylinder("Pelvis", radius=0.20, depth=0.20, vertices=8, location=(0, 0, 0.40), material=mat_dark)
    pelvis.parent = root
    chest = create_cylinder("Chest", radius=0.26, depth=0.32, vertices=8, location=(0, 0, 0.62), material=mat_skin)
    chest.parent = root
    core = create_cone("Core", radius=0.08, depth=0.06, vertices=6, location=(0, -0.21, 0.64), rotation=(math.radians(90), 0, 0), material=mat_glow)
    core.parent = root

    # 2. Fearsome Head with curved ram horns firmly attached to sides
    head = create_cylinder("Head", radius=0.20, depth=0.26, vertices=8, location=(0, -0.04, 0.90), material=mat_skin)
    head.parent = root
    eyes = create_box("Eyes", size=(0.20, 0.05, 0.05), location=(0, -0.18, 0.92), material=mat_glow)
    eyes.parent = root
    maw = create_box("Maw", size=(0.14, 0.05, 0.05), location=(0, -0.17, 0.83), material=mat_dark)
    maw.parent = root
    teeth = create_box("Teeth", size=(0.10, 0.04, 0.02), location=(0, -0.18, 0.83), material=mat_glow)
    teeth.parent = root

    # Ram Horns connected firmly to sides of head curving backward and upward (NO detached triangles!)
    for side, sx in [(-1, -0.16), (1, 0.16)]:
        h_base = create_cylinder(f"HornBase_{side}", radius=0.075, depth=0.18, vertices=6, location=(sx, -0.04, 0.95), rotation=(math.radians(-30), side * math.radians(-35), side * math.radians(15)), material=mat_dark)
        h_base.parent = root
        h_tip = create_cone(f"HornTip_{side}", radius=0.065, depth=0.24, vertices=5, location=(sx + side*0.07, 0.06, 1.05), rotation=(math.radians(-65), side * math.radians(-25), 0), material=mat_dark)
        h_tip.parent = root

    # 3. Articulated Legs & Sabatons
    for side, sx, lang in [(-1, -0.13, leg_l), (1, 0.13, leg_r)]:
        thigh = create_cylinder(f"Thigh_{side}", radius=0.09, depth=0.22, vertices=6, location=(sx, lang * 0.10, 0.28), rotation=(lang, 0, 0), material=mat_dark)
        thigh.parent = root
        shin = create_cylinder(f"Shin_{side}", radius=0.08, depth=0.20, vertices=6, location=(sx, lang * 0.20, 0.13), rotation=(lang * 0.8, 0, 0), material=mat_skin)
        shin.parent = root
        foot = create_box(f"Foot_{side}", size=(0.11, 0.18, 0.07), location=(sx, -0.03 + lang * 0.24, 0.04), material=mat_dark)
        foot.parent = root

    # 4. Left Arm & Round Buckler
    arm_l = create_cylinder("ArmL", radius=0.07, depth=0.26, vertices=6, location=(-0.26, 0, 0.58), rotation=(math.radians(15), math.radians(20), 0), material=mat_skin)
    arm_l.parent = root
    buckler = create_cylinder("Buckler", radius=0.20, depth=0.06, vertices=8, location=(-0.33, -0.12, 0.56), rotation=(math.radians(15), math.radians(-30), 0), material=mat_dark)
    buckler.parent = root
    bcore = create_cylinder("BCore", radius=0.08, depth=0.08, vertices=6, location=(-0.34, -0.14, 0.56), rotation=(math.radians(15), math.radians(-30), 0), material=mat_glow)
    bcore.parent = root

    # 5. Right Arm & Spiked War Club
    arm_r = create_cylinder("ArmR", radius=0.07, depth=0.26, vertices=6, location=(0.26, 0, 0.58), rotation=(math.radians(-20), math.radians(-15), 0), material=mat_skin)
    arm_r.parent = root
    shaft = create_cylinder("Shaft", radius=0.035, depth=0.50, vertices=6, location=(0.32, -0.10, 0.65), rotation=(math.radians(45), 0, 0), material=mat_wood)
    shaft.parent = root
    chead = create_cylinder("ClubHead", radius=0.10, depth=0.24, vertices=8, location=(0.32, -0.24, 0.80), rotation=(math.radians(45), 0, 0), material=mat_iron)
    chead.parent = root

    return root
    for cang in [0, 1.57, 3.14, 4.71]:
        cspk = create_cone(f"CSpike_{cang:.2f}", radius=0.05, depth=0.14, vertices=4, location=(0.36 + 0.14*math.cos(cang), 0.42, 1.02 + 0.14*math.sin(cang)), material=mat_glow)
        cspk.parent = club_head

    return root

def build_enemy_armoured(pose=0): # 盾兵 Armoured Phalanx
    root = bpy.data.objects.new("Enemy_Armoured_Root", None)
    bpy.context.scene.collection.objects.link(root)

    mat_skin = blender_utils.get_material('ember_coral', hex_color='#E2563A')
    mat_plate = blender_utils.get_material('ember_dark', hex_color='#38100C', roughness=0.65)
    mat_glow = blender_utils.get_material('ember_glow', emission='#FF7A45')
    mat_iron = blender_utils.get_material('iron', metallic=0.7, roughness=0.35)

    stride = math.sin(pose * math.pi / 2.0)
    leg_l_angle = stride * 0.35
    leg_r_angle = -stride * 0.35

    # Heavy faceted torso with thick basalt plates
    pelvis = create_oct_prism("Pelvis", radius=0.28, depth=0.24, location=(0, 0, 0.48), material=mat_plate)
    pelvis.parent = root
    torso = create_oct_prism("Torso", radius=0.38, depth=0.48, location=(0, 0, 0.76), material=mat_plate)
    torso.parent = root
    chest_ridge = create_box("ChestRidge", size=(0.14, 0.42, 0.44), location=(0, -0.16, 0.78), material=mat_iron)
    chest_ridge.parent = root
    seam = create_box("Seam", size=(0.04, 0.44, 0.40), location=(0, -0.17, 0.78), material=mat_glow)
    seam.parent = root

    # Heavy horned helm with glowing horizontal visor
    helm = create_oct_prism("Helm", radius=0.26, depth=0.34, location=(0, 0.04, 1.15), material=mat_plate)
    helm.parent = root
    visor = create_box("Visor", size=(0.32, 0.08, 0.08), location=(0, -0.18, 1.15), material=mat_glow)
    visor.parent = root
    for side, sx in [(-1, -0.22), (1, 0.22)]:
        horn = create_cone(f"Horn_{side}", radius=0.08, depth=0.38, vertices=5, location=(sx, 0.04, 1.35), rotation=(math.radians(-25), side * math.radians(35), 0), material=mat_iron)
        horn.parent = root

    # Massive Pavise Kite Shield on left arm
    shield = create_box("PaviseBody", size=(0.10, 0.68, 1.15), location=(-0.44, -0.10, 0.72), rotation=(math.radians(10), math.radians(-10), math.radians(15)), material=mat_iron)
    shield.parent = root
    crest = create_cone("ShieldCrest", radius=0.20, depth=0.12, vertices=4, location=(-0.52, -0.10, 0.75), rotation=(0, math.radians(90), 0), material=mat_glow)
    crest.parent = root

    # Spiked heavy mace on right arm
    arm_r = create_cylinder("ArmR", radius=0.10, depth=0.35, vertices=6, location=(0.38, 0, 0.75), rotation=(math.radians(20), 0, 0), material=mat_plate)
    arm_r.parent = root
    mace_shaft = create_cylinder("MaceShaft", radius=0.04, depth=0.9, vertices=6, location=(0.44, -0.10, 0.70), rotation=(math.radians(45), 0, 0), material=mat_iron)
    mace_shaft.parent = root
    mace_head = create_oct_prism("MaceHead", radius=0.16, depth=0.30, location=(0.44, -0.28, 0.95), rotation=(math.radians(45), 0, 0), material=mat_plate)
    mace_head.parent = root

    # Heavy plate legs
    for side, sx, l_ang in [(-1, -0.20, leg_l_angle), (1, 0.20, leg_r_angle)]:
        leg = create_cylinder(f"Leg_{side}", radius=0.14, depth=0.48, vertices=8, location=(sx, l_ang * 0.22, 0.26), rotation=(l_ang, 0, 0), material=mat_plate)
        leg.parent = root
        knee = create_cone(f"Knee_{side}", radius=0.10, depth=0.14, vertices=4, location=(sx, -0.12 + l_ang * 0.22, 0.30), rotation=(math.radians(90), 0, 0), material=mat_iron)
        knee.parent = root

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

# ----------------- HERO: 霜衛長 (Frostgate Warden Commander) -----------------
def build_hero(pose=0):
    root = bpy.data.objects.new("Hero_Root", None)
    bpy.context.scene.collection.objects.link(root)

    mat_plate = blender_utils.get_material('silver', hex_color='#E8EEF5', roughness=0.2, metallic=0.55)
    mat_gold = blender_utils.get_material('gold', hex_color='#F59E0B', roughness=0.25, metallic=0.7)
    mat_blue = blender_utils.get_material('royal_blue', hex_color='#1E40AF', roughness=0.45)
    mat_white = blender_utils.get_material('white', hex_color='#FFFFFF', roughness=0.3)
    mat_wood = blender_utils.get_material('wood_dark', hex_color='#4A3423')
    mat_iron = blender_utils.get_material('iron', hex_color='#475569', metallic=0.7)
    mat_dark = blender_utils.get_material('dark_leather', hex_color='#1E293B')

    stride = math.sin(pose * math.pi / 2.0)
    leg_l = stride * 0.35
    leg_r = -stride * 0.35

    # 1. Legs: Sabatons, Greaves, Poleyns
    for side, sx, lang in [(-1, -0.15, leg_l), (1, 0.15, leg_r)]:
        thigh = create_cylinder(f"Thigh_{side}", radius=0.10, depth=0.26, vertices=8, location=(sx, lang * 0.12, 0.34), rotation=(lang, 0, 0), material=mat_plate)
        thigh.parent = root
        knee = create_cylinder(f"Knee_{side}", radius=0.11, depth=0.10, vertices=8, location=(sx, -0.06 + lang * 0.18, 0.28), rotation=(math.radians(90), 0, 0), material=mat_gold)
        knee.parent = root
        shin = create_cylinder(f"Shin_{side}", radius=0.09, depth=0.26, vertices=8, location=(sx, lang * 0.22, 0.16), rotation=(lang * 0.8, 0, 0), material=mat_plate)
        shin.parent = root
        foot = create_box(f"Foot_{side}", size=(0.13, 0.24, 0.08), location=(sx, -0.04 + lang * 0.26, 0.04), material=mat_plate)
        foot.parent = root

    # 2. Torso: Armored Cuirass with Royal Blue Tabard & Gold Belt
    waist = create_cylinder("Waist", radius=0.24, depth=0.16, vertices=8, location=(0, 0, 0.50), material=mat_dark)
    waist.parent = root
    belt = create_box("Belt", size=(0.14, 0.06, 0.12), location=(0, -0.22, 0.50), material=mat_gold)
    belt.parent = root
    chest = create_cylinder("Chest", radius=0.28, depth=0.40, vertices=8, location=(0, 0, 0.72), material=mat_plate)
    chest.parent = root
    tabard = create_box("Tabard", size=(0.26, 0.04, 0.36), location=(0, -0.22, 0.72), material=mat_blue)
    tabard.parent = root
    frost_star = create_cylinder("FrostStar", radius=0.08, depth=0.06, vertices=4, location=(0, -0.25, 0.76), rotation=(math.radians(90), 0, math.radians(45)), material=mat_white)
    frost_star.parent = root

    # 3. Pauldrons: Curved multi-plate shoulder armor
    for side, sx in [(-1, -0.34), (1, 0.34)]:
        p1 = create_cylinder(f"Pauldron_{side}", radius=0.16, depth=0.22, vertices=8, location=(sx, 0, 0.94), rotation=(0, side * math.radians(-25), 0), material=mat_plate)
        p1.parent = root
        p2 = create_cylinder(f"PauldronRim_{side}", radius=0.18, depth=0.06, vertices=8, location=(sx, 0, 1.02), rotation=(0, side * math.radians(-25), 0), material=mat_gold)
        p2.parent = root

    # 4. Helmet: Sleek Greathelm with Golden Wings (NO TALL CONE, NO BOX RIDGE!)
    helm = create_cylinder("Helm", radius=0.20, depth=0.30, vertices=8, location=(0, 0, 1.15), material=mat_plate)
    helm.parent = root
    dome = create_cylinder("HelmDome", radius=0.18, depth=0.10, vertices=8, location=(0, 0, 1.28), material=mat_plate)
    dome.parent = root
    visor = create_box("Visor", size=(0.28, 0.06, 0.07), location=(0, -0.18, 1.14), material=mat_gold)
    visor.parent = root
    eyeslit = create_box("EyeSlit", size=(0.22, 0.07, 0.025), location=(0, -0.185, 1.14), material=mat_dark)
    eyeslit.parent = root
    # Pair of majestic curved golden wings attached to sides of helmet (like title_key knight)
    for side, sx in [(-1, -0.21), (1, 0.21)]:
        w1 = create_box(f"WingLower_{side}", size=(0.035, 0.22, 0.14), location=(sx, 0.04, 1.20), rotation=(math.radians(-20), side * math.radians(-18), 0), material=mat_gold)
        w1.parent = root
        w2 = create_box(f"WingUpper_{side}", size=(0.030, 0.26, 0.18), location=(sx + side*0.04, 0.08, 1.32), rotation=(math.radians(-35), side * math.radians(-25), 0), material=mat_gold)
        w2.parent = root

    # 5. Flowing Royal Blue Cape
    cape = create_box("Cape", size=(0.65, 0.06, 0.85), location=(0, 0.22, 0.65), rotation=(math.radians(18), 0, 0), material=mat_blue)
    cape.parent = root

    # 6. Left Arm & Royal Blue Heater Shield
    arm_l = create_cylinder("ArmL", radius=0.08, depth=0.34, vertices=6, location=(-0.28, 0, 0.72), rotation=(math.radians(10), math.radians(20), 0), material=mat_plate)
    arm_l.parent = root
    shield = create_box("Shield", size=(0.08, 0.36, 0.62), location=(-0.40, -0.10, 0.70), rotation=(math.radians(10), math.radians(-15), math.radians(10)), material=mat_blue)
    shield.parent = root
    shield_rim = create_box("ShieldRim", size=(0.09, 0.38, 0.08), location=(-0.40, -0.10, 0.96), rotation=(math.radians(10), math.radians(-15), math.radians(10)), material=mat_gold)
    shield_rim.parent = root
    cross_h = create_box("CrossH", size=(0.09, 0.28, 0.06), location=(-0.41, -0.10, 0.72), rotation=(math.radians(10), math.radians(-15), math.radians(10)), material=mat_white)
    cross_h.parent = root
    cross_v = create_box("CrossV", size=(0.09, 0.06, 0.42), location=(-0.41, -0.10, 0.72), rotation=(math.radians(10), math.radians(-15), math.radians(10)), material=mat_white)
    cross_v.parent = root

    # 7. Right Arm & Halberd Lance with Saffron Pennant
    arm_r = create_cylinder("ArmR", radius=0.08, depth=0.34, vertices=6, location=(0.28, 0, 0.72), rotation=(math.radians(-15), math.radians(-15), 0), material=mat_plate)
    arm_r.parent = root
    shaft = create_cylinder("Shaft", radius=0.035, depth=2.0, vertices=6, location=(0.38, -0.08, 1.05), rotation=(math.radians(5), math.radians(-5), 0), material=mat_wood)
    shaft.parent = root
    blade = create_box("HalberdBlade", size=(0.04, 0.24, 0.38), location=(0.38, -0.10, 1.85), material=mat_iron)
    blade.parent = root
    pennant = create_box("Pennant", size=(0.03, 0.45, 0.20), location=(0.38, 0.15, 1.70), material=mat_gold)
    pennant.parent = root

    return root

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
