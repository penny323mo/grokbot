import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
import os

def grade_scene_noir(in_path, out_path):
    img = Image.open(in_path).convert('RGB')
    arr = np.array(img, dtype=np.float32) / 255.0
    
    # Noir color grading:
    # Warm amber lamp illumination (boost red and warm yellow in highlights/midtones)
    # Deepen shadows towards charcoal noir #0E0A06
    # Tone curve (S-curve for dramatic noir contrast)
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    
    # Shadow deepening
    shadow_mask = np.clip(1.0 - (r * 0.3 + g * 0.59 + b * 0.11), 0.0, 1.0)
    
    # Color grade: tint midtones warm amber (R * 1.04, G * 0.98, B * 0.88)
    r_graded = np.clip(r ** 1.15 * 1.05 + 0.02, 0.0, 1.0)
    g_graded = np.clip(g ** 1.18 * 0.99 + 0.015, 0.0, 1.0)
    b_graded = np.clip(b ** 1.25 * 0.88 + 0.005, 0.0, 1.0)
    
    # Add subtle film grain texture
    np.random.seed(42)
    grain = np.random.normal(0.0, 0.018, r.shape)
    r_graded = np.clip(r_graded + grain, 0.0, 1.0)
    g_graded = np.clip(g_graded + grain, 0.0, 1.0)
    b_graded = np.clip(b_graded + grain, 0.0, 1.0)
    
    # Lamp vignette from top/side
    h, w = r.shape
    y, x = np.ogrid[:h, :w]
    cx, cy = w * 0.45, h * 0.45
    dist_sq = ((x - cx) / w) ** 2 + ((y - cy) / h) ** 2
    vignette = np.clip(1.0 - dist_sq * 0.45, 0.65, 1.0)
    
    r_out = np.clip(r_graded * vignette, 0.0, 1.0)
    g_out = np.clip(g_graded * vignette, 0.0, 1.0)
    b_out = np.clip(b_graded * vignette, 0.0, 1.0)
    
    out_arr = (np.stack([r_out, g_out, b_out], axis=-1) * 255.0).astype(np.uint8)
    graded_img = Image.fromarray(out_arr)
    
    # Gentle sharpen to preserve fine line work of clues
    enhancer = ImageEnhance.Sharpness(graded_img)
    graded_img = enhancer.enhance(1.15)
    
    graded_img.save(out_path, "WEBP", quality=92)
    jpg_path = out_path.replace(".webp", ".jpg")
    graded_img.save(jpg_path, "JPEG", quality=92)
    print(f"Regraded noir scene: {out_path}")

def main():
    scenes = [
        "assets/scenes/case1_pawnshop.webp",
        "assets/scenes/case2_pier.webp",
        "assets/scenes/case3_theatre.webp",
        "assets/scenes/case4_penha.webp",
    ]
    for s in scenes:
        if os.path.exists(s):
            grade_scene_noir(s, s)

if __name__ == '__main__':
    main()
