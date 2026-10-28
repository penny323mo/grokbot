import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
import os

def regrade_pawnshop():
    p = "assets/scenes/case1_pawnshop.webp"
    img = Image.open(p).convert('RGB')
    arr = np.array(img, dtype=np.float32) / 255.0
    
    # 1. Noir S-curve tone curve for dramatic lamp-lit contrast
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    
    # Tone mapping matching desk_hub.webp (amber warmth in mid-tones, deep charcoal in shadows)
    r_graded = np.clip(1.10 * (r ** 1.18) + 0.02, 0.0, 1.0)
    g_graded = np.clip(1.02 * (g ** 1.22) + 0.015, 0.0, 1.0)
    b_graded = np.clip(0.88 * (b ** 1.30) + 0.005, 0.0, 1.0)
    
    # 2. Add fine photographic film grain matching desk_hub
    np.random.seed(1962)
    grain = np.random.normal(0.0, 0.022, r.shape)
    r_graded = np.clip(r_graded + grain, 0.0, 1.0)
    g_graded = np.clip(g_graded + grain, 0.0, 1.0)
    b_graded = np.clip(b_graded + grain, 0.0, 1.0)
    
    # 3. Noir overhead lamp vignette
    h, w = r.shape
    y, x = np.ogrid[:h, :w]
    cx, cy = w * 0.48, h * 0.45
    dist = np.sqrt(((x - cx) / w) ** 2 + ((y - cy) / h) ** 2)
    # Smooth cosine falloff
    vignette = np.clip(1.0 - 0.42 * (dist ** 1.6), 0.58, 1.0)
    
    r_out = np.clip(r_graded * vignette, 0.0, 1.0)
    g_out = np.clip(g_graded * vignette, 0.0, 1.0)
    b_out = np.clip(b_graded * vignette, 0.0, 1.0)
    
    out_arr = (np.stack([r_out, g_out, b_out], axis=-1) * 255.0).astype(np.uint8)
    graded = Image.fromarray(out_arr)
    
    # 4. Painterly sharpness boost for line work
    enhancer = ImageEnhance.Sharpness(graded)
    graded = enhancer.enhance(1.22)
    
    graded.save("assets/scenes/case1_pawnshop.webp", "WEBP", quality=94)
    graded.save("assets/scenes/case1_pawnshop.jpg", "JPEG", quality=94)
    print("Regraded case1_pawnshop to oil-painting noir tone matching desk_hub.webp!")

if __name__ == '__main__':
    regrade_pawnshop()
