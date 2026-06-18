import { SOURCES, LAYERS, ensureSource } from "./MetaverseLayerConfig";

export function addProjectBoundaryLayer(map, data) {
  ensureSource(map, SOURCES.boundary, data);

  if (!map.getLayer(LAYERS.boundaryFill)) {
    map.addLayer({
      id: LAYERS.boundaryFill,
      type: "fill",
      source: SOURCES.boundary,
      paint: {
        "fill-color": "#2474ff",
        "fill-opacity": 0.12,
      },
    });
  }

  if (!map.getLayer(LAYERS.boundaryLine)) {
    map.addLayer({
      id: LAYERS.boundaryLine,
      type: "line",
      source: SOURCES.boundary,
      paint: {
        "line-color": "#244cff",
        "line-width": 3,
      },
    });
  }
}

export function addNotifiedBoundaryLayer(map, data) {
  ensureSource(map, SOURCES.notifiedBoundary, data);

  if (!map.getLayer(LAYERS.notifiedBoundaryLine)) {
    map.addLayer({
      id: LAYERS.notifiedBoundaryLine,
      type: "line",
      source: SOURCES.notifiedBoundary,
      paint: {
        "line-color": "#ef4444",
        "line-width": 5,
        "line-opacity": 1,
      },
      layout: {
        visibility: "none",
      },
    });
  }
}
