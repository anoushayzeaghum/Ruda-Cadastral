import {
  ORTHO_SOURCE,
  ORTHO_LAYER,
} from "./layerConfig";

export const HANDU_GUJRAN_BOUNDS = [
  [74.42562653088396, 31.60509230706726],
  [74.43545280361002, 31.6112165411359],
];

export const restoreOrthoLayer = ({ map, visible, opacity, tileUrl }) => {
  if (visible && tileUrl) {
    if (!map.getSource(ORTHO_SOURCE)) {
      map.addSource(ORTHO_SOURCE, {
        type: "raster",
        tiles: [tileUrl],
        tileSize: 256,
      });
    } else {
      const source = map.getSource(ORTHO_SOURCE);
      if (source && typeof source.setTiles === "function") {
        source.setTiles([tileUrl]);
      }
    }

    if (!map.getLayer(ORTHO_LAYER)) {
      map.addLayer({
        id: ORTHO_LAYER,
        type: "raster",
        source: ORTHO_SOURCE,
        paint: {
          "raster-opacity": opacity,
        },
        layout: {
          visibility: "visible",
        },
      });
    } else {
      map.setLayoutProperty(ORTHO_LAYER, "visibility", "visible");
      map.setPaintProperty(ORTHO_LAYER, "raster-opacity", opacity);
    }
    return;
  }

  if (map.getLayer(ORTHO_LAYER)) {
    map.setLayoutProperty(ORTHO_LAYER, "visibility", "none");
  }
};

export const restoreHanduGujranOrthoLayer = restoreOrthoLayer;
