import {
  HANDU_GUJRAN_ORTHO_SOURCE,
  HANDU_GUJRAN_ORTHO_LAYER,
} from "./layerConfig";

export const HANDU_GUJRAN_BOUNDS = [
  [74.42562653088396, 31.60509230706726],
  [74.43545280361002, 31.6112165411359],
];

export const restoreHanduGujranOrthoLayer = ({ map, visible, opacity }) => {
  if (visible) {
    if (!map.getSource(HANDU_GUJRAN_ORTHO_SOURCE)) {
      map.addSource(HANDU_GUJRAN_ORTHO_SOURCE, {
        type: "raster",
        tiles: ["https://rudametaverse.nespakprogresscenter.com/tiles/data/Handu_Gujran_Ortho/{z}/{x}/{y}.png"],
        tileSize: 256,
      });
    }

    if (!map.getLayer(HANDU_GUJRAN_ORTHO_LAYER)) {
      map.addLayer({
        id: HANDU_GUJRAN_ORTHO_LAYER,
        type: "raster",
        source: HANDU_GUJRAN_ORTHO_SOURCE,
        paint: {
          "raster-opacity": opacity,
        },
        layout: {
          visibility: "visible",
        },
      });
    } else {
      map.setLayoutProperty(HANDU_GUJRAN_ORTHO_LAYER, "visibility", "visible");
      map.setPaintProperty(HANDU_GUJRAN_ORTHO_LAYER, "raster-opacity", opacity);
    }
    return;
  }

  if (map.getLayer(HANDU_GUJRAN_ORTHO_LAYER)) {
    map.setLayoutProperty(HANDU_GUJRAN_ORTHO_LAYER, "visibility", "none");
  }
};
