# Cesium 3D Model Upload Page

Place this folder at:

```text
src/pages/Cesium3DModelUpload/
```

This is a separate page. It does not modify the existing `3DMapview` directory.

## What this updated page contains

- Cesium globe/map.
- RUDA header and project selector.
- Satellite, Streets, Light, and None basemaps.
- Project boundary overlay.
- Optional flat master-plan overlay.
- Zoom in, zoom out, fly to project, fullscreen, and clear-selection controls.
- Local `.glb` or self-contained `.gltf` upload.
- Longitude, latitude, elevation, scale, heading, pitch, and roll controls.
- Place model at current map center.
- Fly to uploaded model.
- Show, hide, replace, or remove uploaded model.

## Removed functionality

This version intentionally does **not** generate a 3D model from land-use polygons.

The following have been removed from this page:

- Land-use classification.
- Land-use-based colors.
- Automatic residential/commercial polygon extrusion.
- Generated fallback polygon heights.
- `plots3d` and `buildings3d` generated layers.
- Plot extrusion manager.
- Animated land-use polygon extrusion.

The uploaded GLB/glTF model is now the only 3D model rendered by this page.

## Install Cesium

```bash
npm install cesium
npm install -D vite-plugin-cesium
```

Update `vite.config.js`:

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import cesium from "vite-plugin-cesium";

export default defineConfig({
  plugins: [react(), cesium()],
});
```

## Add route

```jsx
import Society3DMapPage from "./pages/Cesium3DModelUpload/Society3DMapPage";

<Route path="/society-3d-upload" element={<Society3DMapPage />} />
```

Open:

```text
http://localhost:5173/society-3d-upload
```

## Environment

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_CESIUM_TOKEN=your_optional_cesium_ion_token
```

## Model format

Use `.glb` whenever possible. A normal `.gltf` file may reference external `.bin` and texture files that cannot be loaded from a single browser file selection. A GLB normally packages these resources into one file.

## Model positioning

A local GLB usually does not contain a usable real-world position. Set:

- Longitude
- Latitude
- Height in metres
- Scale
- Heading
- Pitch
- Roll

You can navigate to the intended location and press **Use Map Center** to copy the Cesium map center into the model position.

## Cesium ion BIM asset placement

This corrected version also loads a Cesium ion BIM asset as 3D Tiles:

```env
VITE_CESIUM_TOKEN=replace_with_a_new_restricted_token
VITE_CHAHAR_BAGH_BIM_ION_ASSET_ID=5041035
VITE_CHAHAR_BAGH_BIM_PLACEMENT_MODE=translate-to-target
VITE_CHAHAR_BAGH_BIM_LON=74.4311166314
VITE_CHAHAR_BAGH_BIM_LAT=31.6083708480
VITE_CHAHAR_BAGH_BIM_HEIGHT=0
VITE_CHAHAR_BAGH_BIM_HEADING=-35
VITE_CHAHAR_BAGH_BIM_PITCH=0
VITE_CHAHAR_BAGH_BIM_ROLL=0
VITE_CHAHAR_BAGH_BIM_SCALE=1
```

`translate-to-target` now moves the tileset by its actual bounding-sphere center, not by the Revit/internal model origin. Rotation and scale are applied around that center in a local east-north-up frame, preventing the large horizontal shift that occurs when a BIM origin is far from the visible building.

Use `VITE_CHAHAR_BAGH_BIM_PLACEMENT_MODE=ion-georeferenced` when the ion asset is already correctly georeferenced and must retain its original ion position.

Restart the Vite development server after changing `.env` values.
