import { SOURCES, LAYERS, ensureSource } from "./FlyToLayerConfig";

export function addSpotLevelLayer(map, data) {
  ensureSource(map, SOURCES.spotLevel, data);

  if (!map.getLayer(LAYERS.spotLevelCircle)) {
    map.addLayer({
      id: LAYERS.spotLevelCircle,
      type: "circle",
      source: SOURCES.spotLevel,
      paint: {
        "circle-radius": 4,
        "circle-color": "#65c96b",
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 1,
      },
    });
  }
}


