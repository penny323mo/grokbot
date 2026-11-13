# CHANGELOG

## Round 1 fixes

- **Building Inspection Interaction**: Added interactive click support for extruded 3D buildings (`building-3d` layer), displaying building name, measured height (`render_height` / `height`), or level count from OpenStreetMap, while strictly labelling unmeasured buildings as unmeasured (never presenting fallback extrusion as a measured figure).
- **Typography & Font Fallbacks**: Aligned CSS system font stack fallback strictly to `"PingFang TC", "Noto Sans TC", -apple-system, "Helvetica Neue", sans-serif`.
- **Cartographic Precision**: Confirmed Terrarium DEM decoding, 1.3× / 1.0× exaggeration toggle, 3D / 2D perspective ease, and authentic OSM heights across the entire Macau SAR.
- **Node Test Suite**: Verified 13/13 passing automated node tests covering schema, bounds, Terrarium decoder, geolocation policy, and asset integrity.
