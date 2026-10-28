from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
import numpy as np

def make_halftone():
    # Source scene
    src = Image.open("assets/scenes/case1_pawnshop.webp").convert('RGB')
    w, h = src.size
    
    # Crop central investigation area (pawnshop interior with counter and victim)
    # 640x260 aspect ratio
    crop_w = int(w * 0.95)
    crop_h = int(crop_w * 260 / 640)
    crop_y = int(h * 0.38)
    crop_x = int((w - crop_w) / 2)
    cropped = src.crop((crop_x, crop_y, crop_x + crop_w, crop_y + crop_h)).resize((640, 260), Image.Resampling.LANCZOS)
    
    # Convert to grayscale
    gray = cropped.convert('L')
    
    # Apply soft contrast curve for vintage newspaper print
    arr = np.array(gray, dtype=np.float32) / 255.0
    arr = np.clip((arr - 0.1) / 0.8, 0.0, 1.0)
    
    # Authentic newspaper newsprint halftone simulation:
    # 45-degree dot screen modulation
    y, x = np.ogrid[:260, :640]
    dot_freq = 0.85
    screen = 0.5 + 0.5 * np.cos(dot_freq * (x + y)) * np.cos(dot_freq * (x - y))
    
    # Blend newsprint ink: warm dark charcoal (#221C16) on newsprint paper (#EDE4D3)
    ht_mask = np.clip(arr * 0.75 + screen * 0.25, 0.0, 1.0)
    
    # Newsprint paper tone
    paper_r, paper_g, paper_b = 238, 230, 214
    ink_r, ink_g, ink_b = 28, 22, 17
    
    out_r = (ink_r + (paper_r - ink_r) * ht_mask).astype(np.uint8)
    out_g = (ink_g + (paper_g - ink_g) * ht_mask).astype(np.uint8)
    out_b = (ink_b + (paper_b - ink_b) * ht_mask).astype(np.uint8)
    
    out_arr = np.stack([out_r, out_g, out_b], axis=-1)
    ht_img = Image.fromarray(out_arr)
    
    # Outer thin newspaper border
    draw = ImageDraw.Draw(ht_img)
    draw.rectangle([0, 0, 639, 259], outline=(60, 48, 36), width=1)
    
    ht_img.save("assets/ui/epilogue_vignette.webp", "WEBP", quality=92)
    print("Created authentic 1962 newspaper halftone crime scene photo!")

if __name__ == '__main__':
    make_halftone()
