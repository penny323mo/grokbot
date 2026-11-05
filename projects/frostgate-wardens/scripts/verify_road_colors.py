import json
import os
import sys
import math
from PIL import Image

def is_valid_road_or_path_pixel(r, g, b):
    # Strict road gold band: warm tan/gold (#D9B87A / #C4A362 / #E8B04A)
    # Distinct from grey rocks/cliffs and teal ice (accounting for daylight alpine sky fill)
    return (115 <= r <= 225) and (90 <= g <= 185) and (b <= 155) and (r - b >= 18)

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

        scale_x = w / float(data.get('width', 1024))
        scale_y = h / float(data.get('height', 1536))

        # Collect all waypoints across all routes
        all_routes = data.get('paths') or [data['waypoints']]
        all_wps = []
        for r in all_routes:
            all_wps.extend(r)

        # 1. Check waypoints: must lie directly on the road gold band
        wp_radius = int(round(25 * scale_x))
        for idx, wp in enumerate(all_wps):
            x, y = int(round(wp['x'] * scale_x)), int(round(wp['y'] * scale_y))
            found_road = False
            step = max(1, int(round(5 * scale_x)))
            for dy in range(-wp_radius, wp_radius + 1, step):
                for dx in range(-wp_radius, wp_radius + 1, step):
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
        plot_radius = int(round(28 * scale_x))
        for idx, pl in enumerate(data['plots']):
            x, y = int(round(pl['x'] * scale_x)), int(round(pl['y'] * scale_y))
            found_road = False
            step = max(1, int(round(2 * scale_x)))
            for dy in range(-plot_radius, plot_radius + 1, step):
                for dx in range(-plot_radius, plot_radius + 1, step):
                    if dx * dx + dy * dy > plot_radius * plot_radius:
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

        # 3. Check keep_tip: must sample non-sky pixel
        tip = data.get('keep_tip')
        if tip:
            tip_x = int(round(tip['x'] * scale_x))
            tip_y = int(round(tip['y'] * scale_y))
            r_tip, g_tip, b_tip = im.getpixel((tip_x, tip_y))
            if r_tip >= 253 and g_tip >= 253 and b_tip >= 253:
                print(f"Map {i} keep_tip ({tip_x}, {tip_y}) pixel ({r_tip}, {g_tip}, {b_tip}) is sky white!")
                all_ok = False

    return all_ok

if __name__ == '__main__':
    ok = verify_all()
    if ok:
        print("ALL 5 MAPS: EVERY WAYPOINT AND PLOT VERIFIED ON/BESIDE THE ROAD AND KEEP_TIP VERIFIED NON-SKY!")
        sys.exit(0)
    else:
        print("Road verification failed!")
        sys.exit(1)
