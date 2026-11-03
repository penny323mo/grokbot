import os
from PIL import Image

def convert(png_path, webp_path, quality=82):
    if not os.path.exists(png_path):
        print(f"File {png_path} not found.")
        return False
    im = Image.open(png_path)
    im.save(webp_path, "WEBP", quality=quality, method=6)
    size_kb = os.path.getsize(webp_path) / 1024.0
    print(f"Converted {png_path} -> {webp_path}: {size_kb:.1f} KB (SPEC limit: 450 KB)")
    return size_kb <= 450.0

if __name__ == "__main__":
    for i in range(1, 6):
        convert(f"assets/maps/map{i}.png", f"assets/maps/map{i}.webp")
