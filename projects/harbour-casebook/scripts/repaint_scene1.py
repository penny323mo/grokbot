import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import math

def repaint_pawnshop():
    # 1. Load raw plate
    raw_pil = Image.open('.art-source/scenes-raw/case1_pawnshop.webp').convert('RGB')
    w, h = raw_pil.size
    img_np = np.array(raw_pil)
    bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)

    # 2. Painterly edge softening (eliminate harsh comic black lines)
    # Using bilateral filter
    smooth = cv2.bilateralFilter(bgr, d=7, sigmaColor=50, sigmaSpace=50)

    # 3. Noir Chiaroscuro & Warm Lamp Lighting
    # Convert to float [0, 1]
    norm = smooth.astype(np.float32) / 255.0

    # Directional warm overhead lamp lighting map:
    # Center lamp hanging from ceiling at (x: 0.42*w, y: 0.18*h)
    lx, ly = 0.42 * w, 0.18 * h
    y_coords, x_coords = np.ogrid[:h, :w]
    # Elliptical distance (wider horizontally, stretches downward)
    dist = np.sqrt(((x_coords - lx) / (w * 0.55))**2 + ((y_coords - ly) / (h * 0.70))**2)
    # Lamp vignette intensity: 1.0 at center, falling to 0.45 at edges/corners
    lamp_falloff = np.clip(1.0 - 0.55 * (dist ** 1.3), 0.35, 1.0)
    
    # Shadows: Deep rich chiaroscuro S-curve
    # Power curve to crush muddy midtone comic flat look into rich deep shadows
    graded = np.power(norm, 1.35)
    
    # Warm amber color grade: boost Red and Green slightly in lit areas, deep cool espresso in shadows
    # BGR order
    graded[:, :, 0] *= (0.75 * lamp_falloff + 0.15) # Blue: cool in shadows
    graded[:, :, 1] *= (0.95 * lamp_falloff + 0.05) # Green: warm
    graded[:, :, 2] *= (1.15 * lamp_falloff + 0.05) # Red: warm amber
    
    # Scale to match desk_hub target luminance (mean LAB L ~ 48-52)
    graded = np.clip(graded * 0.72, 0, 1.0)
    res_bgr = (graded * 255.0).astype(np.uint8)

    # Convert back to PIL
    res_rgb = cv2.cvtColor(res_bgr, cv2.COLOR_BGR2RGB)
    canvas = Image.fromarray(res_rgb)
    draw = ImageDraw.Draw(canvas, 'RGBA')

    # 4. Paint In-World Physical Clues
    
    # A. Natural Pearl Earring at (w*0.39, h*0.47)
    # Pearl center: x = 0.39*w = 324.5, y = 0.47*h = 586.6
    ex, ey = int(w * 0.39), int(h * 0.47)
    # Ambient shadow under pearl
    draw.ellipse([ex - 12, ey + 4, ex + 14, ey + 12], fill=(15, 12, 10, 180))
    # Gold filigree setting / cap
    draw.polygon([(ex - 5, ey - 10), (ex + 7, ey - 10), (ex + 9, ey - 4), (ex - 7, ey - 4)], fill=(185, 145, 65, 255))
    draw.ellipse([ex - 4, ey - 14, ex + 6, ey - 8], outline=(150, 115, 45, 255), width=2)
    # Luminous pearl body (radius ~8px)
    for r in range(9, 0, -1):
        alpha = int(255 * (r / 9.0))
        # Warm ivory pearl gradient
        val = int(245 - (9 - r) * 6)
        draw.ellipse([ex - r + 1, ey - r + 1, ex + r + 1, ey + r + 1], fill=(val, val - 8, val - 18, 255))
    # Delicate nacre highlight on top-left
    draw.ellipse([ex - 4, ey - 4, ex, ey], fill=(255, 255, 250, 240))

    # B. Celadon Teacup & Brass Ruler on Desk at (w*0.23, h*0.74)
    tx, ty = int(w * 0.23), int(h * 0.74)
    # Teacup shadow
    draw.ellipse([tx - 18, ty + 10, tx + 22, ty + 20], fill=(18, 14, 10, 170))
    # Celadon porcelain body (soft jade green)
    draw.ellipse([tx - 16, ty - 12, tx + 18, ty + 14], fill=(125, 155, 142, 255), outline=(75, 100, 90, 255), width=2)
    # Inner cup depression (dark tea inside)
    draw.ellipse([tx - 12, ty - 8, tx + 14, ty + 8], fill=(65, 45, 25, 255), outline=(105, 135, 122, 255), width=1)
    # Pale tea surface
    draw.ellipse([tx - 10, ty - 6, tx + 12, ty + 6], fill=(55, 38, 22, 255))
    # Rose lipstick mark on upper rim
    draw.arc([tx + 4, ty - 13, tx + 15, ty - 5], start=220, end=330, fill=(180, 50, 60, 230), width=3)
    # Brass ruler beside cup
    rx, ry = tx + 24, ty - 18
    draw.polygon([(rx, ry), (rx + 10, ry - 3), (rx + 22, ry + 42), (rx + 12, ry + 45)], fill=(195, 155, 65, 255), outline=(135, 100, 35, 255))
    # Brass tick marks
    for k in range(6):
        draw.line([(rx + 2 + k*2, ry + 5 + k*6), (rx + 7 + k*2, ry + 4 + k*6)], fill=(95, 70, 25, 200), width=1)

    # C. Bloodstained Rosewood Abacus at (w*0.35, h*0.58)
    ax, ay = int(w * 0.35), int(h * 0.58)
    # Drop shadow
    draw.rectangle([ax - 28, ay - 14, ax + 32, ay + 20], fill=(15, 12, 10, 160))
    # Rosewood dark frame
    draw.rectangle([ax - 26, ay - 16, ax + 28, ay + 18], fill=(55, 25, 18, 255), outline=(25, 10, 6, 255), width=2)
    # Inner divider beam
    draw.line([(ax - 24, ay - 4), (ax + 26, ay - 4)], fill=(35, 15, 10, 255), width=2)
    # Counting rods and beads
    for col in range(7):
        cx = ax - 20 + col * 7
        draw.line([(cx, ay - 14), (cx, ay + 16)], fill=(120, 95, 60, 220), width=1)
        # Upper bead (1 bead)
        draw.ellipse([cx - 2, ay - 12, cx + 2, ay - 7], fill=(85, 45, 30, 255))
        # Lower beads (2-3 beads)
        draw.ellipse([cx - 2, ay, cx + 2, ay + 5], fill=(85, 45, 30, 255))
        draw.ellipse([cx - 2, ay + 7, cx + 2, ay + 12], fill=(85, 45, 30, 255))
    # Dark congealed blood spatter on abacus corner
    draw.ellipse([ax + 12, ay - 18, ax + 26, ay - 2], fill=(95, 18, 14, 210))
    draw.ellipse([ax + 18, ay - 8, ax + 28, ay + 4], fill=(75, 14, 10, 220))

    # D. Muddy Boot Impressions at (w*0.50, h*0.54)
    fx, fy = int(w * 0.50), int(h * 0.54)
    # Print 1 (heel + sole)
    draw.ellipse([fx - 6, fy - 12, fx + 6, fy], fill=(30, 24, 18, 170))
    draw.ellipse([fx - 5, fy + 4, fx + 5, fy + 12], fill=(30, 24, 18, 170))
    # Print 2 (offset)
    draw.ellipse([fx + 12, fy - 4, fx + 24, fy + 8], fill=(28, 22, 16, 160))
    draw.ellipse([fx + 13, fy + 12, fx + 23, fy + 20], fill=(28, 22, 16, 160))

    # E. Sulfur Matchstick at (w*0.63, h*0.49)
    mx, my = int(w * 0.63), int(h * 0.49)
    # Wooden stick
    draw.line([(mx - 10, my - 6), (mx + 8, my + 5)], fill=(160, 135, 95, 230), width=2)
    # Red sulfur head
    draw.ellipse([mx - 14, my - 9, mx - 8, my - 3], fill=(165, 35, 25, 255))
    # Charred tip
    draw.point((mx - 11, my - 6), fill=(40, 20, 15, 255))

    # F. Open Accounting Ledger on the Floor at (w*0.76, h*0.68)
    # Well away from the corpse head at (0.64, 0.78)
    bx, by = int(w * 0.76), int(h * 0.68)
    # Ambient shadow under open book
    draw.polygon([(bx - 46, by - 24), (bx + 48, by - 24), (bx + 52, by + 30), (bx - 42, by + 30)], fill=(15, 12, 10, 180))
    # Left page (cream aged Xuan paper)
    draw.polygon([(bx - 42, by - 22), (bx - 2, by - 20), (bx - 2, by + 26), (bx - 40, by + 24)], fill=(228, 216, 188, 255), outline=(130, 105, 75, 255))
    # Right page
    draw.polygon([(bx + 2, by - 20), (bx + 44, by - 22), (bx + 42, by + 24), (bx + 2, by + 26)], fill=(225, 212, 184, 255), outline=(130, 105, 75, 255))
    # Center binding spine / stitching
    draw.line([(bx, by - 21), (bx, by + 27)], fill=(75, 55, 35, 255), width=2)
    for s in [-12, -4, 4, 12, 20]:
        draw.line([(bx - 3, by + s), (bx + 3, by + s)], fill=(45, 30, 18, 255), width=1)
    # Vertical vermilion accounting rule columns (紅格帳線)
    for col in range(4):
        # Left page red columns
        draw.line([(bx - 36 + col * 8, by - 18), (bx - 36 + col * 8, by + 22)], fill=(195, 95, 80, 140), width=1)
        # Right page red columns
        draw.line([(bx + 10 + col * 8, by - 18), (bx + 10 + col * 8, by + 22)], fill=(195, 95, 80, 140), width=1)
    # Black ink calligraphy entries (tiny brush ticks)
    for row in range(3):
        draw.line([(bx - 34, by - 12 + row * 10), (bx - 30, by - 12 + row * 10)], fill=(35, 28, 22, 200), width=1)
        draw.line([(bx - 26, by - 10 + row * 10), (bx - 22, by - 10 + row * 10)], fill=(35, 28, 22, 200), width=1)
        draw.line([(bx + 12, by - 12 + row * 10), (bx + 16, by - 12 + row * 10)], fill=(35, 28, 22, 200), width=1)
        draw.line([(bx + 20, by - 10 + row * 10), (bx + 24, by - 10 + row * 10)], fill=(35, 28, 22, 200), width=1)
    # Cinnabar seal mark on right page
    draw.rectangle([bx + 26, by + 8, bx + 36, by + 18], outline=(175, 45, 30, 220), width=1)
    draw.rectangle([bx + 28, by + 10, bx + 34, by + 16], fill=(175, 45, 30, 180))

    # 5. Clean any artifact on the corpse head at (0.64*w, 0.78*h)
    # Ensure raw corpse hair / blood pool looks natural with NO sticker on it
    # We blend with raw at corpse head to guarantee zero sticker:
    ch_x, ch_y = int(w * 0.64), int(h * 0.78)
    corpse_patch = smooth[ch_y-40:ch_y+40, ch_x-40:ch_x+40]
    corpse_pil = Image.fromarray(cv2.cvtColor(corpse_patch, cv2.COLOR_BGR2RGB))
    # Apply matching tone
    corpse_graded = Image.fromarray((np.power(corpse_patch.astype(np.float32)/255.0, 1.35) * 255.0 * 0.85).astype(np.uint8))
    canvas.paste(corpse_graded, (ch_x - 40, ch_y - 40))

    # 6. Apply fine film grain matching desk_hub
    grain_img = Image.open('assets/ui/film_grain.webp').convert('RGB')
    grain_resized = grain_img.resize((w, h), Image.Resampling.BILINEAR)
    # Blend grain subtly (opacity ~12%)
    final_canvas = Image.blend(canvas, grain_resized, 0.08)

    # 7. Save outputs
    final_canvas.save('assets/scenes/case1_pawnshop.webp', 'WEBP', quality=90)
    final_canvas.save('assets/scenes/case1_pawnshop.jpg', 'JPEG', quality=90)
    
    # Also update epilogue_vignette.webp (crop around victim on floor)
    crop_epilogue = final_canvas.crop((int(w * 0.20), int(h * 0.45), int(w * 0.85), int(h * 0.90)))
    crop_epilogue.resize((600, 420), Image.Resampling.LANCZOS).save('assets/ui/epilogue_vignette.webp', 'WEBP', quality=90)
    print("Repainted case1_pawnshop and epilogue_vignette successfully!")

def update_desk_and_title_portraits():
    # Update desk_hub.webp and title_key.webp with painted portraits on corkboard
    portraits = {
        'chan_tak_sang': Image.open('assets/portraits/chan_tak_sang.webp').convert('RGB'),
        'ho_bing': Image.open('assets/portraits/ho_bing.webp').convert('RGB'),
        'leung_ah_sei': Image.open('assets/portraits/leung_ah_sei.webp').convert('RGB'),
        'pak_lan': Image.open('assets/portraits/pak_lan.webp').convert('RGB')
    }
    
    for asset_path in ['assets/art/desk_hub.webp', 'assets/art/title_key.webp']:
        im = Image.open(asset_path).convert('RGB')
        # Corkboard photo locations on 780x1387:
        # Pinned polaroids are around:
        # Top-left photo: (115, 260), size ~ 52x52
        # Top-right photo: (170, 245), size ~ 50x50
        # Bottom-center large polaroid: (140, 345), size ~ 65x65
        # Bottom-right polaroid: (195, 355), size ~ 48x48
        slots = [
            ('chan_tak_sang', (115, 258), 50, 50, -4),
            ('ho_bing', (172, 245), 48, 48, 5),
            ('pak_lan', (136, 340), 62, 62, -2),
            ('leung_ah_sei', (198, 352), 48, 48, 6)
        ]
        for char_id, (pos_x, pos_y), sw, sh, angle in slots:
            p = portraits[char_id].resize((sw, sh), Image.Resampling.LANCZOS)
            # Tint portrait with warm lamp light & slight sepia/grain
            p_arr = np.array(p).astype(np.float32) / 255.0
            p_arr[:, :, 0] *= 0.95 # slightly reduce blue for warm vintage photo look
            p_arr[:, :, 2] *= 0.85
            p_arr = np.clip(p_arr * 0.92, 0, 1.0)
            p_tinted = Image.fromarray((p_arr * 255.0).astype(np.uint8)).rotate(angle, expand=True, resample=Image.Resampling.BICUBIC)
            im.paste(p_tinted, (pos_x, pos_y), p_tinted if p_tinted.mode == 'RGBA' else None)
        
        im.save(asset_path, 'WEBP', quality=92)
        print(f"Updated painted character faces on {asset_path}")

if __name__ == '__main__':
    repaint_pawnshop()
    update_desk_and_title_portraits()
