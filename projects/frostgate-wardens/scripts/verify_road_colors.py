import json
import os
import sys
import math
from PIL import Image

def is_valid_road_or_path_pixel(r, g, b):
    # Strict road gold band: warm tan/gold (#D9B87A / #C4A362 / #E8B04A)
    # Distinct from grey rocks/cliffs and teal ice
    return (115 <= r <= 220) and (90 <= g <= 180) and (b <= 145) and (r - b >= 18)

def verify_all():
    all_ok = True
    for i in range(1, 6):
        png_path = f"assets/maps/map{i}.png"
        json_path = f"assets/maps/map{i}.json"
        if not os.path.exists(png_path) or not os.path.exists(json_path):
            print(f"Map {i} files missing!")
            all_ok = False
            continue

        im = Image.open(png_path).convert('RGB')
        w, h = im.size
        with open(json_path) as f:
            data = json.load(f)

        # Collect all waypoints across all routes
        all_routes = data.get('paths') or [data['waypoints']]
        all_wps = []
        for r in all_routes:
            all_wps.extend(r)

        # 1. Check waypoints: must lie directly on the road gold band
        for idx, wp in enumerate(all_wps):
            x, y = wp['x'], wp['y']
            found_road = False
            for dy in range(-25, 26, 5):
                for dx in range(-25, 26, 5):
                    px = min(w - 1, max(0, x + dx))
                    py = min(h - 1, max(0, y + dy))
                    r, g, b = im.getpixel((px, py))
                    if is_valid_road_or_path_pixel(r, g, b):
                        found_road = True
                        break
                if found_road:
                    break

            if not found_road:
                print(f"Map {i} waypoint {idx} ({x}, {y}) color ({im.getpixel((x, y))}) not recognized as road gold!")
                all_ok = False

        # 2. Check plots: plot center must be within about 28px of the road gold band
        for idx, pl in enumerate(data['plots']):
            x, y = pl['x'], pl['y']
            found_road = False
            for dy in range(-28, 29, 2):
                for dx in range(-28, 29, 2):
                    if dx * dx + dy * dy > 28 * 28:
                        continue
                    px = min(w - 1, max(0, x + dx))
                    py = min(h - 1, max(0, y + dy))
                    r, g, b = im.getpixel((px, py))
                    if is_valid_road_or_path_pixel(r, g, b):
                        found_road = True
                        break
                if found_road:
                    break

            if not found_road:
                print(f"Map {i} plot {idx} ({x}, {y}) center is not within 28px of road gold band!")
                all_ok = False

    return all_ok

if __name__ == '__main__':
    ok = verify_all()
    if ok:
        print("ALL 5 MAPS: EVERY WAYPOINT AND PLOT VERIFIED ON/BESIDE THE ROAD!")
        sys.exit(0)
    else:
        print("Road verification failed!")
        sys.exit(1)
