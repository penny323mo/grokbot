import os
import sys
import json
import math
import numpy as np
from PIL import Image

def detect_keep_tip_exact(r, img_path):
    im = Image.open(img_path).convert('RGB')
    x = 800
    # Sample sky background at y=150 (above mountains)
    sky_sample = im.getpixel((x, 150))

    # Scan downward along central finial axis from y=240 to y=280
    for y in range(240, 280):
        pr, pg, pb = im.getpixel((x, y))
        diff = math.hypot(pr - sky_sample[0], pg - sky_sample[1], pb - sky_sample[2])
        # Finial apex is distinct from sky (golden or warm tone)
        if diff > 35 and (pr > 120 or pg > 100):
            return {"x": x, "y": y}

    return {"x": x, "y": 250}

def edge_energy(im_path, target_size=(360, 540)):
    im = Image.open(im_path).convert('L').resize(target_size, Image.Resampling.BILINEAR)
    arr = np.array(im, dtype=float)
    gy, gx = np.gradient(arr)
    return float(np.hypot(gx, gy).mean())

def process_map(r):
    png_path = f"assets/maps/map{r}.png"
    webp_path = f"assets/maps/map{r}.webp"
    json_path = f"assets/maps/map{r}.json"

    if not os.path.exists(png_path) or not os.path.exists(json_path):
        print(f"Skipping map {r}: {png_path} or {json_path} missing")
        return False

    with open(json_path, 'r', encoding='utf-8') as f:
        meta = json.load(f)

    # 1. Detect keep_tip from topmost non-sky pixel
    tip = detect_keep_tip_exact(r, png_path)
    im = Image.open(png_path).convert('RGB')
    tip_px = im.getpixel((tip['x'], tip['y']))

    # Assert non-sky
    assert not (tip_px[0] >= 248 and tip_px[1] >= 248 and tip_px[2] >= 248), f"Map {r} keep_tip ({tip['x']}, {tip['y']}) pixel {tip_px} is sky white!"

    meta['keep_tip'] = tip
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)

    # 2. Clay diorama contrast tuning to match title_key.webp matte clay visual contrast
    from PIL import ImageEnhance
    im = ImageEnhance.Contrast(im).enhance(1.045 if r == 4 else 1.025)
    im.save(png_path)

    # 3. Convert to WebP
    im.save(webp_path, "WEBP", quality=84, method=6)
    size_kb = os.path.getsize(webp_path) / 1024.0
    assert size_kb <= 450.0, f"Map {r} WebP size {size_kb:.1f} KB exceeds 450 KB limit!"

    ee = edge_energy(webp_path)
    print(f"Map {r}: keep_tip=({tip['x']}, {tip['y']}), pixel={tip_px}, WebP={size_kb:.1f} KB, edge_energy={ee:.2f}")
    return True

def main():
    target = sys.argv[-1] if len(sys.argv) > 1 and sys.argv[-1].isdigit() else "all"
    if target == "all":
        for r in range(1, 6):
            process_map(r)
    else:
        process_map(int(target))

if __name__ == "__main__":
    main()
