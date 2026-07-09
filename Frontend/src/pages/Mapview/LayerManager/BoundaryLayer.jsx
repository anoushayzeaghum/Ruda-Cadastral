import {
  ROAD_COLOR_EXPRESSION,
  ROAD_WIDTH_EXPRESSION,
  getBoundaryTheme,
  getBoundaryLabelExpression,
} from "./layerConfig";

export const getBoundaryIds = (level) => ({
  source: `${level}-boundary-source`,
  fill: `${level}-boundary-fill`,
  line: `${level}-boundary-line`,
  dashLine: `${level}-boundary-dash-line`,
  label: `${level}-boundary-label`,
});

export const removeBoundaryLevelLayers = (map, ids) => {
  if (map.getLayer(ids.label)) map.removeLayer(ids.label);
  if (map.getLayer(ids.dashLine)) map.removeLayer(ids.dashLine);
  if (map.getLayer(ids.line)) map.removeLayer(ids.line);
  if (map.getLayer(ids.fill)) map.removeLayer(ids.fill);
  if (map.getSource(ids.source)) map.removeSource(ids.source);
};

export const addBoundaryLevelLayers = ({ map, ids, level, sourceGeojson, layerOpacity }) => {
  const isRudaLayer = level.startsWith("ruda");
  const isProposedRoadLayer = level.startsWith("proposed-road");
  const theme = getBoundaryTheme(level);

  map.addSource(ids.source, {
    type: "geojson",
    data: sourceGeojson,
  });

  if (isProposedRoadLayer) {
    map.addLayer({
      id: ids.line,
      type: "line",
      source: ids.source,
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": ROAD_COLOR_EXPRESSION,
        "line-width": ROAD_WIDTH_EXPRESSION,
        "line-opacity": layerOpacity,
      },
    });
    return;
  }

  map.addLayer({
    id: ids.fill,
    type: "fill",
    source: ids.source,
    paint: {
      "fill-color": isRudaLayer
        ? ["coalesce", ["get", "_ruda_phase_color"], "#3d7cc4"]
        : theme.fill,
      "fill-opacity": isRudaLayer
        ? layerOpacity
        : (theme.fillOpacity ?? 0.04) * layerOpacity,
      "fill-outline-color": isRudaLayer ? "#1f2937" : theme.line,
    },
  });

  map.addLayer({
    id: ids.line,
    type: "line",
    source: ids.source,
    paint: {
      "line-color": isRudaLayer ? "#111827" : theme.line,
      "line-width": isRudaLayer ? 2 : theme.lineWidth,
      "line-opacity": isRudaLayer ? 0.95 : 0.95,
    },
  });

  if (isRudaLayer) {
    map.addLayer({
      id: ids.dashLine,
      type: "line",
      source: ids.source,
      paint: {
        "line-color": "#111827",
        "line-width": 1.2,
        "line-dasharray": [1.4, 1.2],
        "line-opacity": 0.9,
      },
    });

    map.addLayer({
      id: ids.label,
      type: "symbol",
      source: ids.source,
      layout: {
        "text-field": ["coalesce", ["get", "_ruda_phase_label"], "RUDA Phase"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 10, 10, 15, 13],
        "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
        "text-allow-overlap": false,
        "text-ignore-placement": false,
      },
      paint: {
        "text-color": "#111827",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.4,
      },
    });
    return;
  }

  const labelExpression = getBoundaryLabelExpression(level);

  if (labelExpression) {
    map.addLayer({
      id: ids.label,
      type: "symbol",
      source: ids.source,
      minzoom: theme.labelMinZoom ?? 14,
      layout: {
        "text-field": labelExpression,
        "text-size": ["interpolate", ["linear"], ["zoom"], 13, 10, 17, 12],
        "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
        "text-allow-overlap": false,
        "text-ignore-placement": false,
        "text-optional": true,
      },
      paint: {
        "text-color": theme.label,
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.25,
        "text-halo-blur": 0.15,
      },
    });
  }
};
