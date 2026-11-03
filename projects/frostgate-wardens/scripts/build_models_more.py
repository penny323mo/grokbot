import math
import bpy
import blender_utils
from build_models import make_faceted, create_box, create_cone, create_cylinder, create_oct_prism

def build_enemy_flyer(pose=0): # 烈焰飛龍 Flyer
    root = bpy.data.objects.new("Enemy_Flyer_Root", None)
    bpy.context.scene.collection.objects.link(root)

    mat_body = blender_utils.get_material('ember_coral')
    mat_wing = blender_utils.get_material('ember_dark')
    mat_glow = blender_utils.get_material('ember_glow', emission='#FF7A45')

    wing_ang = math.sin(pose * math.pi / 2.0) * 0.35

    # Elevated body
    body = create_box("Body", size=(0.4, 0.9, 0.35), location=(0, 0, 1.2), rotation=(0.2, 0, 0), material=mat_body)
    body.parent = root
    head = create_cone("Head", radius=0.2, depth=0.5, vertices=5, location=(0, 0.65, 1.35), rotation=(1.57, 0, 0), material=mat_body)
    head.parent = root
    eyes = create_box("Eyes", size=(0.25, 0.08, 0.08), location=(0, 0.8, 1.4), material=mat_glow)
    eyes.parent = root
    tail = create_box("Tail", size=(0.12, 0.7, 0.12), location=(0, -0.7, 1.1), rotation=(-0.3, 0, 0), material=mat_wing)
    tail.parent = root

    # Outstretched wings
    wing_l = create_box("WingL", size=(1.1, 0.6, 0.06), location=(-0.65, 0.1, 1.25), rotation=(0, wing_ang, 0.2), material=mat_wing)
    wing_l.parent = root
    wing_r = create_box("WingR", size=(1.1, 0.6, 0.06), location=(0.65, 0.1, 1.25), rotation=(0, -wing_ang, -0.2), material=mat_wing)
    wing_r.parent = root
    return root

def build_enemy_healer(pose=0): # 薩滿 Healer
    root = bpy.data.objects.new("Enemy_Healer_Root", None)
    bpy.context.scene.collection.objects.link(root)

    mat_robe = blender_utils.get_material('ember_dark')
    mat_coral = blender_utils.get_material('ember_coral')
    mat_glow = blender_utils.get_material('ember_glow', emission='#FF7A45')
    mat_wood = blender_utils.get_material('wood_dark')

    sway = math.sin(pose * math.pi / 2.0) * 0.15

    # Robed cone body
    robe = create_cone("Robe", radius=0.45, depth=0.9, vertices=7, location=(0, 0, 0.45), rotation=(0, sway, 0), material=mat_robe)
    robe.parent = root
    cowl = create_box("Cowl", size=(0.35, 0.35, 0.35), location=(0, 0.05, 0.95), rotation=(0, sway, 0), material=mat_robe)
    cowl.parent = root
    mask = create_cone("Mask", radius=0.15, depth=0.25, vertices=4, location=(0, 0.22, 0.95), rotation=(1.57, 0, 0), material=mat_coral)
    mask.parent = root

    # Flame Staff swinging with walk
    staff = create_cylinder("Staff", radius=0.04, depth=1.4, vertices=5, location=(0.35, 0.15 + sway * 0.3, 0.7), rotation=(0.1 + sway * 0.4, 0, 0), material=mat_wood)
    staff.parent = root
    orb = create_oct_prism("FlameOrb", radius=0.18, depth=0.25, location=(0.35, 0.15 + sway * 0.3, 1.45), material=mat_glow)
    orb.parent = root
    return root

def build_enemy_swarm(pose=0): # 爆燃蟲 Swarm
    root = bpy.data.objects.new("Enemy_Swarm_Root", None)
    bpy.context.scene.collection.objects.link(root)

    mat_dark = blender_utils.get_material('ember_dark')
    mat_glow = blender_utils.get_material('ember_glow', emission='#FF7A45')

    leg_ang = math.sin(pose * math.pi / 2.0) * 0.4

    # Segmented carapace
    abdomen = create_box("Abdomen", size=(0.35, 0.45, 0.25), location=(0, -0.15, 0.2), material=mat_glow)
    abdomen.parent = root
    thorax = create_box("Thorax", size=(0.3, 0.3, 0.22), location=(0, 0.15, 0.22), material=mat_dark)
    thorax.parent = root
    head = create_cone("Head", radius=0.12, depth=0.2, vertices=4, location=(0, 0.35, 0.22), rotation=(1.57, 0, 0), material=mat_dark)
    head.parent = root

    # Spidery legs
    for lx in [-0.22, 0.22]:
        for ly in [-0.15, 0.05, 0.2]:
            leg = create_box("Leg", size=(0.18, 0.05, 0.12), location=(lx * 1.3, ly, 0.12), rotation=(0, 0.3 if lx > 0 else -0.3, leg_ang), material=mat_dark)
            leg.parent = root
    return root

def build_enemy_fast(pose=0): # 隱匿者 Fast
    root = bpy.data.objects.new("Enemy_Fast_Root", None)
    bpy.context.scene.collection.objects.link(root)

    mat_dark = blender_utils.get_material('ember_dark')
    mat_trim = blender_utils.get_material('ember_coral')
    mat_iron = blender_utils.get_material('iron')

    leg_ang = math.sin(pose * math.pi / 2.0) * 0.5

    torso = create_box("Torso", size=(0.32, 0.35, 0.5), location=(0, 0, 0.5), rotation=(0.35, 0, 0), material=mat_dark)
    torso.parent = root
    head = create_box("Head", size=(0.28, 0.28, 0.28), location=(0, 0.2, 0.8), material=mat_dark)
    head.parent = root

    # Dual daggers
    dag1 = create_box("Dag1", size=(0.04, 0.4, 0.08), location=(-0.25, 0.3, 0.5), rotation=(0.4, 0, 0), material=mat_iron)
    dag1.parent = root
    dag2 = create_box("Dag2", size=(0.04, 0.4, 0.08), location=(0.25, 0.3, 0.5), rotation=(0.4, 0, 0), material=mat_iron)
    dag2.parent = root

    # Fast legs
    leg_l = create_box("LegL", size=(0.12, 0.14, 0.4), location=(-0.14, leg_ang*0.3, 0.2), rotation=(leg_ang, 0, 0), material=mat_trim)
    leg_l.parent = root
    leg_r = create_box("LegR", size=(0.12, 0.14, 0.4), location=(0.14, -leg_ang*0.3, 0.2), rotation=(-leg_ang, 0, 0), material=mat_trim)
    leg_r.parent = root
    return root

# ----------------- REGION BOSSES -----------------
def build_boss_1(pose=0): # 熔核督軍 Molten Overseer (Region 1 Boss)
    root = bpy.data.objects.new("Boss_1_Root", None)
    bpy.context.scene.collection.objects.link(root)

    mat_stone = blender_utils.get_material('stone_dark')
    mat_glow = blender_utils.get_material('ember_glow', emission='#FF7A45')
    mat_iron = blender_utils.get_material('iron')

    leg_ang = math.sin(pose * math.pi / 2.0) * 0.35

    # Massive armored boss torso
    torso = create_box("Torso", size=(1.2, 0.85, 1.1), location=(0, 0, 1.05), material=mat_stone)
    torso.parent = root
    core = create_box("MoltenCore", size=(0.6, 0.15, 0.6), location=(0, 0.44, 1.05), material=mat_glow)
    core.parent = root

    # Great Horned Helm
    head = create_box("Helm", size=(0.6, 0.55, 0.55), location=(0, 0.1, 1.7), material=mat_iron)
    head.parent = root
    horn_l = create_cone("HornL", radius=0.18, depth=0.8, vertices=4, location=(-0.4, 0.1, 2.1), rotation=(0, -0.6, 0), material=mat_glow)
    horn_l.parent = root
    horn_r = create_cone("HornR", radius=0.18, depth=0.8, vertices=4, location=(0.4, 0.1, 2.1), rotation=(0, 0.6, 0), material=mat_glow)
    horn_r.parent = root

    # Dual Massive Cleavers
    cleaver = create_box("Cleaver", size=(0.12, 1.2, 0.45), location=(0.85, 0.3 + leg_ang*0.2, 1.0), rotation=(0.3 + leg_ang*0.2, 0, 0), material=mat_iron)
    cleaver.parent = root

    # Heavy Legs
    leg_l = create_box("LegL", size=(0.4, 0.45, 0.65), location=(-0.35, leg_ang*0.25, 0.32), rotation=(leg_ang, 0, 0), material=mat_stone)
    leg_l.parent = root
    leg_r = create_box("LegR", size=(0.4, 0.45, 0.65), location=(0.35, -leg_ang*0.25, 0.32), rotation=(-leg_ang, 0, 0), material=mat_stone)
    leg_r.parent = root
    return root

def build_boss_2(pose=0): # 霜翼叛將 Frostwing Renegade (Region 2 Boss)
    root = bpy.data.objects.new("Boss_2_Root", None)
    bpy.context.scene.collection.objects.link(root)

    mat_slate = blender_utils.get_material('slate_blue')
    mat_ice = blender_utils.get_material('ice')
    mat_glow = blender_utils.get_material('glacier_teal', emission='#2F8F9D')
    mat_iron = blender_utils.get_material('iron')

    leg_ang = math.sin(pose * math.pi / 2.0) * 0.35
    wing_flap = math.sin(pose * math.pi / 2.0) * 0.25

    torso = create_box("Torso", size=(0.8, 0.6, 0.9), location=(0, 0, 0.9), material=mat_slate)
    torso.parent = root
    head = create_box("Head", size=(0.5, 0.45, 0.45), location=(0, 0, 1.45), material=mat_iron)
    head.parent = root

    # Jagged Frost Wings
    wing_l = create_box("WingL", size=(1.2, 0.5, 0.08), location=(-0.8, -0.2, 1.2), rotation=(0, 0.35 + wing_flap, 0.2), material=mat_ice)
    wing_l.parent = root
    wing_r = create_box("WingR", size=(1.2, 0.5, 0.08), location=(0.8, -0.2, 1.2), rotation=(0, -0.35 - wing_flap, -0.2), material=mat_ice)
    wing_r.parent = root

    # Greatsword
    sword = create_box("Sword", size=(0.1, 0.25, 1.8), location=(0.6, 0.2 + leg_ang*0.2, 1.1), rotation=(0.2 + leg_ang*0.2, 0, 0), material=mat_glow)
    sword.parent = root

    leg_l = create_box("LegL", size=(0.28, 0.3, 0.55), location=(-0.25, leg_ang*0.2, 0.28), rotation=(leg_ang, 0, 0), material=mat_slate)
    leg_l.parent = root
    leg_r = create_box("LegR", size=(0.28, 0.3, 0.55), location=(0.25, -leg_ang*0.2, 0.28), rotation=(-leg_ang, 0, 0), material=mat_slate)
    leg_r.parent = root
    return root

def build_boss_3(pose=0): # 烈石狂獸 Behemoth (Region 3 Boss)
    root = bpy.data.objects.new("Boss_3_Root", None)
    bpy.context.scene.collection.objects.link(root)

    mat_stone = blender_utils.get_material('stone_dark')
    mat_glow = blender_utils.get_material('ember_glow', emission='#FF7A45')

    leg_ang = math.sin(pose * math.pi / 2.0) * 0.35

    # Quadruped massive body
    body = create_box("Body", size=(1.4, 1.8, 0.9), location=(0, 0, 0.8), material=mat_stone)
    body.parent = root
    head = create_cone("Head", radius=0.55, depth=0.8, vertices=5, location=(0, 1.1, 0.9), rotation=(1.57, 0, 0), material=mat_stone)
    head.parent = root
    horns = create_box("Horns", size=(1.6, 0.2, 0.25), location=(0, 1.2, 1.3), material=mat_glow)
    horns.parent = root

    # Spikes along back
    for by in [-0.5, 0, 0.5]:
        spk = create_cone("Spk", radius=0.25, depth=0.7, vertices=4, location=(0, by, 1.45), material=mat_glow)
        spk.parent = root

    # 4 massive stone pillars for legs with alternating gait
    leg_fl = create_cylinder("LegFL", radius=0.28, depth=0.6, vertices=6, location=(-0.6, 0.6 + leg_ang*0.15, 0.3), rotation=(leg_ang, 0, 0), material=mat_stone)
    leg_fl.parent = root
    leg_fr = create_cylinder("LegFR", radius=0.28, depth=0.6, vertices=6, location=(0.6, 0.6 - leg_ang*0.15, 0.3), rotation=(-leg_ang, 0, 0), material=mat_stone)
    leg_fr.parent = root
    leg_bl = create_cylinder("LegBL", radius=0.28, depth=0.6, vertices=6, location=(-0.6, -0.6 - leg_ang*0.15, 0.3), rotation=(-leg_ang, 0, 0), material=mat_stone)
    leg_bl.parent = root
    leg_br = create_cylinder("LegBR", radius=0.28, depth=0.6, vertices=6, location=(0.6, -0.6 + leg_ang*0.15, 0.3), rotation=(leg_ang, 0, 0), material=mat_stone)
    leg_br.parent = root
    return root

def build_boss_4(pose=0): # 炎煞巫祖 Pyre Arch-Shaman (Region 4 Boss)
    root = bpy.data.objects.new("Boss_4_Root", None)
    bpy.context.scene.collection.objects.link(root)

    mat_robe = blender_utils.get_material('ember_dark')
    mat_coral = blender_utils.get_material('ember_coral')
    mat_glow = blender_utils.get_material('ember_glow', emission='#FF7A45')
    mat_gold = blender_utils.get_material('gold')

    sway = math.sin(pose * math.pi / 2.0) * 0.2

    # Flowing robes
    robe = create_cone("Robe", radius=0.7, depth=1.3, vertices=8, location=(0, 0, 0.65), rotation=(0, sway*0.5, 0), material=mat_robe)
    robe.parent = root
    mantle = create_box("Mantle", size=(0.9, 0.6, 0.3), location=(0, 0, 1.3), rotation=(0, sway*0.5, 0), material=mat_coral)
    mantle.parent = root
    mask = create_cone("SkullMask", radius=0.3, depth=0.45, vertices=5, location=(0, 0.2, 1.55), rotation=(1.57, 0, 0), material=mat_gold)
    mask.parent = root

    # Floating skull totems bobbing in motion
    for i, ang in enumerate([0.5, 2.6, 4.7]):
        tx = 0.9 * math.cos(ang)
        ty = 0.9 * math.sin(ang)
        tz = 1.2 + math.sin(pose * math.pi / 2.0 + i) * 0.15
        totem = create_cone("Totem", radius=0.18, depth=0.35, vertices=4, location=(tx, ty, tz), material=mat_glow)
        totem.parent = root
    return root

def build_boss_5(pose=0): # 終焉炎魔 Cataclysm Emberlord (Final Citadel Boss)
    root = bpy.data.objects.new("Boss_5_Root", None)
    bpy.context.scene.collection.objects.link(root)

    mat_obsidian = blender_utils.get_material('ink')
    mat_glow = blender_utils.get_material('ember_glow', emission='#FF7A45')
    mat_stone = blender_utils.get_material('stone_dark')

    leg_ang = math.sin(pose * math.pi / 2.0) * 0.3

    # Towering titan torso
    torso = create_box("Torso", size=(1.5, 1.0, 1.4), location=(0, 0, 1.3), material=mat_obsidian)
    torso.parent = root
    core = create_box("HeartOfFire", size=(0.8, 0.2, 0.8), location=(0, 0.52, 1.3), material=mat_glow)
    core.parent = root

    # Giant Demonic Horns
    head = create_box("Head", size=(0.7, 0.6, 0.6), location=(0, 0.2, 2.1), material=mat_obsidian)
    head.parent = root
    horn_l = create_cone("HornL", radius=0.25, depth=1.2, vertices=5, location=(-0.6, 0.2, 2.7), rotation=(0, -0.7, 0), material=mat_glow)
    horn_l.parent = root
    horn_r = create_cone("HornR", radius=0.25, depth=1.2, vertices=5, location=(0.6, 0.2, 2.7), rotation=(0, 0.7, 0), material=mat_glow)
    horn_r.parent = root

    # Colossal War Hammer swinging
    hammer_shaft = create_cylinder("Shaft", radius=0.08, depth=2.4, vertices=6, location=(1.1, 0.3 + leg_ang*0.2, 1.4), rotation=(0.2 + leg_ang*0.25, 0, 0), material=mat_stone)
    hammer_shaft.parent = root
    hammer_head = create_box("Head", size=(0.6, 0.9, 0.6), location=(1.1, 0.5 + leg_ang*0.2, 2.4), material=mat_glow)
    hammer_head.parent = root

    # Massive Legs
    leg_l = create_box("LegL", size=(0.5, 0.55, 0.8), location=(-0.45, leg_ang*0.25, 0.4), rotation=(leg_ang, 0, 0), material=mat_obsidian)
    leg_l.parent = root
    leg_r = create_box("LegR", size=(0.5, 0.55, 0.8), location=(0.45, -leg_ang*0.25, 0.4), rotation=(-leg_ang, 0, 0), material=mat_obsidian)
    leg_r.parent = root
    return root
