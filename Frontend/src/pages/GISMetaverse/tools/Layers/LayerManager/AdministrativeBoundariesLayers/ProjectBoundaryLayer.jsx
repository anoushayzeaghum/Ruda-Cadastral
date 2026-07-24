import { SOURCES, LAYERS, ensureSource } from "../MetaverseLayerConfig";

const PROJECT_BOUNDARY_FILL_COLOR = "#FF1493";
const PROJECT_BOUNDARY_LINE_COLOR = "#FF1493";

export function addProjectBoundaryLayer(map, data, color = null) {
  ensureSource(map, SOURCES.boundary, data);

  const fillColor = color || PROJECT_BOUNDARY_FILL_COLOR;
  const lineColor = color || PROJECT_BOUNDARY_LINE_COLOR;

  if (!map.getLayer(LAYERS.boundaryFill)) {
    map.addLayer({
      id: LAYERS.boundaryFill,
      type: "fill",
      source: SOURCES.boundary,
      paint: {
        "fill-color": fillColor,
        "fill-opacity": 0.12,
      },
    });
  } else {
    map.setPaintProperty(LAYERS.boundaryFill, "fill-color", fillColor);
  }

  if (!map.getLayer(LAYERS.boundaryLine)) {
    map.addLayer({
      id: LAYERS.boundaryLine,
      type: "line",
      source: SOURCES.boundary,
      paint: {
        "line-color": lineColor,
        "line-width": 3,
      },
    });
  } else {
    map.setPaintProperty(LAYERS.boundaryLine, "line-color", lineColor);
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
