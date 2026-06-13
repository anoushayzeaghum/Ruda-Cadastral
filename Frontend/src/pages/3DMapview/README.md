# 3DMapview Folder

Put this complete folder here:

```txt
src/pages/3DMapview/
```
 
## Install packages

```bash
npm install cesium
npm install -D vite-plugin-cesium
```

Your existing project already appears to use `lucide-react`, `react-router-dom`, and Tailwind CSS. If any of these are missing, install them:

```bash
npm install lucide-react react-router-dom
```

## Update vite.config.js

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import cesium from "vite-plugin-cesium";

export default defineConfig({
  plugins: [react(), cesium()],
});
```

If your vite config already has plugins, just add `cesium()` inside the same plugins array.

## Optional .env values

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_CESIUM_TOKEN=your_cesium_ion_token_if_you_use_ion_assets
```

The included default basemaps do not require a Cesium ion token, but keep the token if you later use Cesium ion terrain, imagery, or 3D Tiles.

## Add route

In your router file:

```jsx
import Society3DMapPage from "./pages/3DMapview/Society3DMapPage";

<Route path="/society-3d" element={<Society3DMapPage />} />
```

## Backend API notes

All 3D society layers are fetched by `society_id`.

The only file you should need to adjust for endpoint names is:

```txt
src/pages/3DMapview/api.js
```

Expected endpoints are attempted with fallbacks:

```txt
/api/district/
/api/tehsil/?district_id=ID
/api/mauza/?tehsil_id=ID
/api/society/?mauza_id=ID&mauza=NAME
/api/society-boundary/?society_id=ID
/api/masterplan/?society_id=ID
/api/plots/?society_id=ID
/api/buildings/?society_id=ID
/api/roads/?society_id=ID
/api/green-spaces/?society_id=ID
/api/spot-level/?society_id=ID
/api/contours/?society_id=ID
```

## Data requirements for real 3D

For real extrusion, your plot/building GeoJSON should have one of these fields:

```txt
height_m
height_meter
height
building_height
height_ft
height_feet
floor_count
floors
no_of_floors
storeys
```

If none exist, the dashboard uses the height from the left Extrusion panel.
