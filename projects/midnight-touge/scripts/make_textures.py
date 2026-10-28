#!/usr/bin/env python3
"""
Generate high quality PBR textures for Midnight Touge:
- asphalt_diffuse, asphalt_normal, asphalt_roughness
- rock_diffuse
- guardrail_diffuse
- cedar_leaves
- tachometer_face
"""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

os.makedirs("assets/textures", exist_ok=True)

def generate_asphalt(size=512):
    # Base dark tarmac with gravel grain and wet patches
    base = np.random.normal(38, 8, (size, size)).astype(np.float32)
    # Add large scale wet patches (smooth Perlin-like low frequency noise)
    low_res = np.random.uniform(0.6, 1.0, (16, 16))
    low_im = Image.fromarray((low_res * 255).astype(np.uint8)).resize((size, size), Image.Resampling.BICUBIC)
    wet_mask = np.array(low_im).astype(np.float32) / 255.0
    
    diffuse = (base * (0.5 + 0.5 * wet_mask)).clip(15, 65).astype(np.uint8)
    diffuse_rgb = np.stack([diffuse, (diffuse * 1.02).astype(np.uint8), (diffuse * 1.06).astype(np.uint8)], axis=-1)
    # Give it cool night tint (slightly bluish-slate asphalt)
    diffuse_rgb[:, :, 0] = (diffuse_rgb[:, :, 0] * 0.9).clip(0, 255)
    diffuse_rgb[:, :, 2] = (diffuse_rgb[:, :, 2] * 1.15).clip(0, 255)
    
    Image.fromarray(diffuse_rgb.astype(np.uint8)).save("assets/textures/asphalt_diffuse.jpg", quality=92)
    
    # Roughness map: wet patches are very smooth (low roughness = high gloss)
    roughness = (240 - wet_mask * 170 + np.random.normal(0, 15, (size, size))).clip(30, 250).astype(np.uint8)
    Image.fromarray(roughness).save("assets/textures/asphalt_roughness.jpg", quality=90)
    
    # Normal map from height (sobel gradients)
    height = diffuse.astype(np.float32)
    gx = np.roll(height, -1, axis=1) - np.roll(height, 1, axis=1)
    gy = np.roll(height, -1, axis=0) - np.roll(height, 1, axis=0)
    nz = 12.0
    norm = np.sqrt(gx**2 + gy**2 + nz**2)
    nx = (-gx / norm * 0.5 + 0.5) * 255
    ny = (-gy / norm * 0.5 + 0.5) * 255
    nz_c = (nz / norm * 0.5 + 0.5) * 255
    normal_map = np.stack([nx, ny, nz_c], axis=-1).astype(np.uint8)
    Image.fromarray(normal_map).save("assets/textures/asphalt_normal.jpg", quality=92)
    print("Generated asphalt textures")

def generate_rock(size=512):
    # Mountain rock cliff with horizontal stratifications
    y_grad = np.linspace(0, 1, size)
    strata = np.sin(np.outer(np.linspace(0, 45, size), np.ones(size))) * 25
    noise = np.random.normal(70, 15, (size, size))
    rock = (noise + strata).clip(30, 130).astype(np.uint8)
    rock_rgb = np.stack([(rock * 0.95).astype(np.uint8), (rock * 0.92).astype(np.uint8), (rock * 0.88).astype(np.uint8)], axis=-1)
    Image.fromarray(rock_rgb.astype(np.uint8)).save("assets/textures/rock_diffuse.jpg", quality=90)
    print("Generated rock texture")

def generate_guardrail(size=(512, 128)):
    # Corrugated metal beam with horizontal w-beam shadow
    w, h = size
    im = Image.new("RGBA", (w, h), (180, 185, 190, 255))
    draw = ImageDraw.Draw(im)
    
    # Draw corrugation ridges
    for y in range(h):
        # W-beam profile (sine double hump)
        profile = np.sin((y / h) * 2 * np.pi) * 45
        c = int(np.clip(160 + profile, 60, 240))
        draw.line([(0, y), (w, y)], fill=(c, c, int(c * 1.05), 255))
    
    # Add reflective amber and red reflectors every 64 pixels
    for x in range(32, w, 64):
        reflector_color = (255, 180, 20, 255) if (x // 64) % 2 == 0 else (240, 40, 30, 255)
        draw.rectangle([x - 5, h // 2 - 12, x + 5, h // 2 + 12], fill=reflector_color, outline=(40, 40, 40, 255))
        draw.rectangle([x - 3, h // 2 - 10, x + 3, h // 2 + 10], fill=(255, 255, 255, 180))

    im.save("assets/textures/guardrail_diffuse.png")
    print("Generated guardrail texture")

def generate_cedar_leaves(size=256):
    # Mountain pine/cedar needle branch with alpha transparency
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(im)
    
    # Draw dark branches
    np.random.seed(42)
    center_x = size // 2
    draw.line([(center_x, size), (center_x, 40)], fill=(45, 30, 20, 255), width=8)
    
    # Draw needles fan
    for i in range(120):
        y = np.random.uniform(30, size - 20)
        side = -1 if np.random.rand() < 0.5 else 1
        angle = np.random.uniform(0.3, 1.2) * side
        length = np.random.uniform(40, 85) * (1.0 - (size - y) / size * 0.3)
        end_x = center_x + np.sin(angle) * length
        end_y = y - np.cos(angle) * length * 0.5
        
        green = int(np.random.uniform(50, 95))
        draw.line([(center_x, y), (end_x, end_y)], fill=(int(green*0.4), green, int(green*0.6), 240), width=3)

    im.save("assets/textures/cedar_leaves.png")
    print("Generated cedar leaves texture")

def generate_tachometer(size=512):
    # Professional JDM Racing Tachometer face
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(im)
    cx, cy = size // 2, size // 2
    r = size // 2 - 16
    
    # Outer bezel & dark carbon face
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(18, 20, 24, 255), outline=(120, 125, 130, 255), width=6)
    draw.ellipse([cx - r + 8, cy - r + 8, cx + r - 8, cy + r - 8], fill=(12, 14, 16, 255), outline=(45, 48, 52, 255), width=2)
    
    # Angle range: from 135 deg (0 RPM) to 405 deg (10,000 RPM) -> 270 deg span
    # Redline: 7,500 to 10,000 RPM (202.5 to 270 deg)
    for deg in range(135, 406):
        rad = np.radians(deg)
        rpm_ratio = (deg - 135) / 270.0
        is_redline = rpm_ratio >= 0.75
        col = (235, 50, 40, 255) if is_redline else (240, 242, 245, 255)
        
        # Major tick every 1,000 RPM (every 27 deg)
        if (deg - 135) % 27 == 0:
            x1 = cx + (r - 28) * np.cos(rad)
            y1 = cy + (r - 28) * np.sin(rad)
            x2 = cx + (r - 12) * np.cos(rad)
            y2 = cy + (r - 12) * np.sin(rad)
            draw.line([(x1, y1), (x2, y2)], fill=col, width=4)
            
            # Number label (0 to 10)
            num = int(round(rpm_ratio * 10))
            nx = cx + (r - 48) * np.cos(rad)
            ny = cy + (r - 48) * np.sin(rad)
            draw.text((nx - 6, ny - 8), str(num), fill=col)
        # Minor tick every 500 RPM
        elif (deg - 135) % 13.5 < 1:
            x1 = cx + (r - 20) * np.cos(rad)
            y1 = cy + (r - 20) * np.sin(rad)
            x2 = cx + (r - 12) * np.cos(rad)
            y2 = cy + (r - 12) * np.sin(rad)
            draw.line([(x1, y1), (x2, y2)], fill=col, width=2)

    # Center branding
    draw.text((cx - 36, cy - 40), "KIRINE PASS", fill=(140, 150, 160, 255))
    draw.text((cx - 28, cy + 30), "x1000r/min", fill=(180, 185, 190, 255))
    
    im.save("assets/textures/tachometer_face.png")
    print("Generated tachometer face texture")

if __name__ == "__main__":
    generate_asphalt()
    generate_rock()
    generate_guardrail()
    generate_cedar_leaves()
    generate_tachometer()
    print("All PBR textures created!")
