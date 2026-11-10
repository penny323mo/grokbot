import sys
import os
import math

# Test script to render map 1 with enhanced castle and continuous parapet wall
import bpy
import bpy_extras
from mathutils import Vector

sys.path.append('scripts')
import blender_utils
import build_models
import render_all_maps

render_all_maps.render_map1()
print("Map 1 test render finished.")
