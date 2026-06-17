import { SOURCES, LAYERS, ensureSource } from "./MetaverseLayerConfig";

export function addContourLayer(map, data) {
  ensureSource(map, SOURCES.contours, data);

  if (!map.getLayer(LAYERS.contoursLine)) {
    map.addLayer({
      id: LAYERS.contoursLine,
      type: "line",
      source: SOURCES.contours,
      paint: {
        "line-color": "#615514",
        "line-width": 1.5,
      },
    });
  }

  if (!map.getLayer(LAYERS.contoursLabel)) {
    map.addLayer({
      id: LAYERS.contoursLabel,
      type: "symbol",
      source: SOURCES.contours,
      minzoom: 15,
      layout: {
        "symbol-placement": "line",
        "text-field": [
          "coalesce",
          ["to-string", ["get", "elevation"]],
          ["to-string", ["get", "ELEVATION"]],
          ["to-string", ["get", "Elevation"]],
          "",
        ],
        "text-size": ["interpolate", ["linear"], ["zoom"], 15, 10, 18, 12],
        "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
        "text-allow-overlap": false,
        "text-ignore-placement": false,
      },
      paint: {
        "text-color": "#3f370f",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.2,
      },
    });
  }
}
