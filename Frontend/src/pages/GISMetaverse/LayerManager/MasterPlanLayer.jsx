import { SOURCES, LAYERS, ensureSource } from "./MetaverseLayerConfig";

export function addMasterPlanLayer(map, data, color = null) {
  ensureSource(map, SOURCES.masterPlan, data);

  if (!map.getLayer(LAYERS.masterPlanFill)) {
    map.addLayer({
      id: LAYERS.masterPlanFill,
      type: "fill",
      source: SOURCES.masterPlan,
      paint: {
        "fill-color": [
          "match",
          ["get", "type"],
          "Residential",
          "#0f3d2e",
          "Commercial",
          "#facc15",
          "Park",
          "#15803d",
          "Road",
          "#ef4444",
          "#9ca3af",
        ],
        "fill-opacity": 0.45,
      },
    });
  }

  if (!map.getLayer(LAYERS.masterPlanLine)) {
    map.addLayer({
      id: LAYERS.masterPlanLine,
      type: "line",
      source: SOURCES.masterPlan,
      paint: {
        "line-color": color || "#111827",
        "line-width": 1,
      },
    });
  } else if (color) {
    map.setPaintProperty(LAYERS.masterPlanLine, "line-color", color);
  }

  if (!map.getLayer(LAYERS.masterPlanLabel)) {
    map.addLayer({
      id: LAYERS.masterPlanLabel,
      type: "symbol",
      source: SOURCES.masterPlan,
      minzoom: 16,
      layout: {
        "text-field": [
          "coalesce",
          ["to-string", ["get", "plot_no"]],
          ["to-string", ["get", "name"]],
          "",
        ],
        "text-size": ["interpolate", ["linear"], ["zoom"], 16, 10, 18, 13],
        "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
        "text-allow-overlap": false,
        "text-ignore-placement": false,
      },
      paint: {
        "text-color": color || "#111827",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.5,
      },
    });
  } else if (color) {
    map.setPaintProperty(LAYERS.masterPlanLabel, "text-color", color);
  }

  // Highlight layer — rendered on top of fill/line so the selection outline
  // is always visible. The filter uses ["to-string", ["get", "gid"]] so it
  // exactly matches the expression that PlotPopup sets at runtime.
  // Starts hidden (line-opacity: 0) and matching nothing (__none__).
  if (!map.getLayer(LAYERS.masterPlanHover)) {
    map.addLayer({
      id: LAYERS.masterPlanHover,
      type: "line",
      source: SOURCES.masterPlan,
      paint: {
        "line-color": "#ffffff",
        "line-width": 4,
        "line-opacity": 0,
      },
      // Use the same expression type that PlotPopup will set dynamically.
      // A plain string comparison ["==", ["get", "gid"], ""] would type-mismatch
      // when gid is a number, so we cast both sides to string.
      filter: ["==", ["to-string", ["get", "gid"]], "__none__"],
    });
  }
}
