#!/usr/bin/env python3
import os
import glob
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

BRAIN_DIR = "/home/box/.gemini/antigravity-cli/brain/15a88f9d-c0f2-4096-a214-7492077565e0"
ASSETS_DIR = "/workspace/nightly/2026-11-03-porcelain-mender/assets"

os.makedirs(f"{ASSETS_DIR}/art", exist_ok=True)
os.makedirs(f"{ASSETS_DIR}/plates", exist_ok=True)
os.makedirs(f"{ASSETS_DIR}/people", exist_ok=True)
os.makedirs(f"{ASSETS_DIR}/scenes", exist_ok=True)

def process_portrait(src_path, dest_path):
    im = Image.open(src_path).convert('RGB')
    w, h = im.size
    target_ratio = 3.0 / 4.0
    if w / h > target_ratio:
        new_w = int(h * target_ratio)
        left = (w - new_w) // 2
        im = im.crop((left, 0, left + new_w, h))
    elif w / h < target_ratio:
        new_h = int(w / target_ratio)
        top = (h - new_h) // 2
        im = im.crop((0, top, w, top + new_h))
    im = im.resize((864, 1152), Image.Resampling.LANCZOS)
    im.save(dest_path, 'WEBP', quality=85)
    print(f"[PORTRAIT] Processed {src_path} -> {dest_path} ({os.path.getsize(dest_path)} bytes)")

def process_vignette(src_path, dest_path):
    im = Image.open(src_path).convert('RGB')
    w, h = im.size
    target_ratio = 4.0 / 3.0
    if w / h > target_ratio:
        new_w = int(h * target_ratio)
        left = (w - new_w) // 2
        im = im.crop((left, 0, left + new_w, h))
    elif w / h < target_ratio:
        new_h = int(w / target_ratio)
        top = (h - new_h) // 2
        im = im.crop((0, top, w, top + new_h))
    im = im.resize((960, 720), Image.Resampling.LANCZOS)
    im.save(dest_path, 'WEBP', quality=85)
    print(f"[VIGNETTE] Processed {src_path} -> {dest_path} ({os.path.getsize(dest_path)} bytes)")

def process_plate_circle(src_path, dest_path):
    im = Image.open(src_path).convert('RGB')
    arr = np.array(im)
    w, h = im.size
    
    # Estimate background from corners
    corners = np.concatenate([arr[:30, :30], arr[:30, -30:], arr[-30:, :30], arr[-30:, -30:]], axis=0)
    bg = np.median(corners, axis=(0, 1))
    
    # Distance from background color
    diff = np.linalg.norm(arr[:, :, :3] - bg, axis=2)
    mask = diff > 20
    
    # Find bounding box of object
    ys, xs = np.where(mask)
    if len(xs) > 0 and len(ys) > 0:
        xmin, xmax = xs.min(), xs.max()
        ymin, ymax = ys.min(), ys.max()
        cx = (xmin + xmax) / 2.0
        cy = (ymin + ymax) / 2.0
        r = max((xmax - xmin) / 2.0, (ymax - ymin) / 2.0)
    else:
        cx, cy, r = w / 2.0, h / 2.0, min(w, h) * 0.44

    # We want a clean square cutout centered on (cx, cy)
    side = int(r * 2.08)
    crop_x1 = int(cx - side / 2.0)
    crop_y1 = int(cy - side / 2.0)
    crop_x2 = crop_x1 + side
    crop_y2 = crop_y1 + side
    
    # Pad image if crop extends outside
    pad_left = max(0, -crop_x1)
    pad_top = max(0, -crop_y1)
    pad_right = max(0, crop_x2 - w)
    pad_bottom = max(0, crop_y2 - h)
    
    if pad_left or pad_top or pad_right or pad_bottom:
        im_padded = Image.new('RGB', (w + pad_left + pad_right, h + pad_top + pad_bottom), tuple(bg.astype(int)))
        im_padded.paste(im, (pad_left, pad_top))
        im = im_padded
        crop_x1 += pad_left
        crop_y1 += pad_top
        crop_x2 += pad_left
        crop_y2 += pad_top
        
    square = im.crop((crop_x1, crop_y1, crop_x2, crop_y2))
    square = square.resize((900, 900), Image.Resampling.LANCZOS)
    
    # Build antialiased circular / alpha mask
    mask_img = Image.new('L', (900, 900), 0)
    draw = ImageDraw.Draw(mask_img)
    # Circle with smooth edge
    draw.ellipse((10, 10, 890, 890), fill=255)
    mask_img = mask_img.filter(ImageFilter.GaussianBlur(1.5))
    
    rgba = square.convert('RGBA')
    rgba.putalpha(mask_img)
    rgba.save(dest_path, 'WEBP', quality=90)
    print(f"[PLATE] Processed {src_path} -> {dest_path} ({os.path.getsize(dest_path)} bytes)")

def process_all():
    # Map generated images in brain dir
    mappings = {
        "chan_tai": ("people/chan_tai.webp", process_portrait),
        "ho_boss": ("people/ho_boss.webp", process_portrait),
        "lam_father": ("people/lam_father.webp", process_portrait),
        "kid_ming": ("people/kid_ming.webp", process_portrait),
        "wong_teahouse": ("people/wong_teahouse.webp", process_portrait),
        "landlord": ("people/landlord.webp", process_portrait),
        "yip_self": ("people/yip_self.webp", process_portrait),
        "macau_courier": ("people/macau_courier.webp", process_portrait),

        "plate_02_famille_rose": ("plates/plate_02_famille_rose.webp", process_plate_circle),
        "bowl_rice_double_happiness": ("plates/bowl_rice_double_happiness.webp", process_plate_circle),
        "teapot_chaozhou_top": ("plates/teapot_chaozhou_top.webp", process_plate_circle),
        "dish_celadon_longquan": ("plates/dish_celadon_longquan.webp", process_plate_circle),
        "bowl_ming_fake": ("plates/bowl_ming_fake.webp", process_plate_circle),
        "spoon_porcelain_shou": ("plates/spoon_porcelain_shou.webp", process_plate_circle),
        "cup_teahouse_gaiwan": ("plates/cup_teahouse_gaiwan.webp", process_plate_circle),
        "cup_enamel_green": ("plates/cup_enamel_green.webp", process_plate_circle),

        "temple_street": ("scenes/temple_street.webp", process_vignette),
        "stall_rain": ("scenes/stall_rain.webp", process_vignette),
        "pawnshop_interior": ("scenes/pawnshop_interior.webp", process_vignette),
        "teahouse_morning": ("scenes/teahouse_morning.webp", process_vignette),
        "tenement_stair": ("scenes/tenement_stair.webp", process_vignette),
        "jordan_pier": ("scenes/jordan_pier.webp", process_vignette),
        "ending_reunion": ("scenes/ending_reunion.webp", process_vignette),
        "ending_apprentice": ("scenes/ending_apprentice.webp", process_vignette),
        "ending_peaceful": ("scenes/ending_peaceful.webp", process_vignette),
    }

    for key, (rel_dest, proc_func) in mappings.items():
        dest = os.path.join(ASSETS_DIR, rel_dest)
        # Find matching in brain dir
        matches = glob.glob(f"{BRAIN_DIR}/{key}*.jpg")
        if matches:
            latest = sorted(matches)[-1]
            try:
                proc_func(latest, dest)
            except Exception as e:
                print(f"Error processing {key}: {e}")

if __name__ == '__main__':
    process_all()
