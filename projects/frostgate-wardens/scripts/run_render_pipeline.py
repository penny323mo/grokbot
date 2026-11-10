import subprocess
import sys

maps_to_render = ["1", "2", "3", "4", "5"]
if len(sys.argv) > 1 and sys.argv[1] != "all":
    maps_to_render = sys.argv[1:]

for m in maps_to_render:
    print(f"\n==========================================")
    print(f"  RENDERING MAP {m} IN BLENDER")
    print(f"==========================================")
    cmd = ["blender", "-b", "-P", "scripts/render_all_maps.py", "--", m]
    res = subprocess.run(cmd)
    if res.returncode != 0:
        print(f"Error rendering map {m}!")
        sys.exit(res.returncode)

    print(f"Postprocessing map {m}...")
    cmd_post = [sys.executable, "scripts/postprocess_maps.py", m]
    res_post = subprocess.run(cmd_post)
    if res_post.returncode != 0:
        print(f"Error postprocessing map {m}!")
        sys.exit(res_post.returncode)

print("\nALL MAPS RENDERED AND POSTPROCESSED SUCCESSFULLY!")
