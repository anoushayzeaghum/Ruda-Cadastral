import { SOURCES, LAYERS, ensureSource } from "./MetaverseLayerConfig";

export function addBlockLayer(map, data) {
  ensureSource(map, SOURCES.block, data);

  if (!map.getLayer(LAYERS.blockFill)) {
    map.addLayer({
      id: LAYERS.blockFill,
      type: "fill",
      source: SOURCES.block,
      paint: {
        "fill-color": "#7c3aed",
        "fill-opacity": 0.18,
      },
    });
  }

  if (!map.getLayer(LAYERS.blockLine)) {
    map.addLayer({
      id: LAYERS.blockLine,
      type: "line",
      source: SOURCES.block,
      paint: {
        "line-color": "#7c3aed",
        "line-width": 2.5,
      },
    });
  }
}
