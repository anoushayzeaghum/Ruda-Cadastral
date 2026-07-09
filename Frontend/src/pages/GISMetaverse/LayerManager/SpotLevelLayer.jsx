import { SOURCES, LAYERS, ensureSource } from "./MetaverseLayerConfig";

export function addSpotLevelLayer(map, data, color = "#65c96b") {
  ensureSource(map, SOURCES.spotLevel, data);

  if (!map.getLayer(LAYERS.spotLevelCircle)) {
    map.addLayer({
      id: LAYERS.spotLevelCircle,
      type: "circle",
      source: SOURCES.spotLevel,
      paint: {
        "circle-radius": 4,
        "circle-color": color,
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 1,
      },
    });
  } else {
    map.setPaintProperty(LAYERS.spotLevelCircle, "circle-color", color);
  }
}
