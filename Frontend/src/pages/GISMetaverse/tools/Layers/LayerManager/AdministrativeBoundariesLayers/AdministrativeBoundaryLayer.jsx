import {
  SOURCES,
  LAYERS,
  ROAD_COLOR_EXPRESSION,
  ROAD_WIDTH_EXPRESSION,
  ensureSource,
  normalizeGeometryCollections,
  prepareRudaGeoJSONForDisplay,
  prepareProposedRoadsGeoJSONForDisplay,
} from "../MetaverseLayerConfig";

export function addRudaBoundaryLayer(map, data) {
  ensureSource(map, SOURCES.rudaBoundary, prepareRudaGeoJSONForDisplay(data));

  if (!map.getLayer(LAYERS.rudaBoundaryFill)) {
    map.addLayer({
      id: LAYERS.rudaBoundaryFill,
      type: "fill",
      source: SOURCES.rudaBoundary,
      paint: {
        "fill-color": ["coalesce", ["get", "_ruda_phase_color"], "#3d7cc4"],
        "fill-opacity": 0.5,
        "fill-outline-color": "#1f2937",
      },
    });
  }

  if (!map.getLayer(LAYERS.rudaBoundaryLine)) {
    map.addLayer({
      id: LAYERS.rudaBoundaryLine,
      type: "line",
      source: SOURCES.rudaBoundary,
      paint: {
        "line-color": "#06291f",
        "line-width": 2,
        "line-opacity": 0.95,
      },
    });
  }

  if (!map.getLayer(LAYERS.rudaBoundaryDashLine)) {
    map.addLayer({
      id: LAYERS.rudaBoundaryDashLine,
      type: "line",
      source: SOURCES.rudaBoundary,
      paint: {
        "line-color": "#06291f",
        "line-width": 1.2,
        "line-dasharray": [1.4, 1.2],
        "line-opacity": 0.9,
      },
    });
  }

  if (!map.getLayer(LAYERS.rudaBoundaryLabel)) {
    map.addLayer({
      id: LAYERS.rudaBoundaryLabel,
      type: "symbol",
      source: SOURCES.rudaBoundary,
      layout: {
        "text-field": ["coalesce", ["get", "_ruda_phase_label"], "RUDA Phase"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 10, 10, 15, 13],
        "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
        "text-allow-overlap": false,
        "text-ignore-placement": false,
      },
      paint: {
        "text-color": "#06291f",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.4,
      },
    });
  }
}

const RUDA_MAUZA_FILL_COLOR = "#eef6ff";
const RUDA_MAUZA_LINE_COLOR = "#0f3d2e";
const RUDA_MAUZA_LABEL_COLOR = "#0f3d2e";
const RUDA_MAUZA_BASE_FILL_OPACITY = 0.035;
const RUDA_MAUZA_BASE_LINE_OPACITY = 0.75;

const getOpacityRatio = (opacity = 100) => {
  const value = Number(opacity);
  if (!Number.isFinite(value)) return 1;
  return Math.min(Math.max(value, 0), 100) / 100;
};

const setPaintProperties = (map, layerId, paint = {}) => {
  if (!map?.getLayer?.(layerId)) return;

  Object.entries(paint).forEach(([property, value]) => {
    map.setPaintProperty(layerId, property, value);
  });
};

const setLayoutProperties = (map, layerId, layout = {}) => {
  if (!map?.getLayer?.(layerId)) return;

  Object.entries(layout).forEach(([property, value]) => {
    map.setLayoutProperty(layerId, property, value);
  });
};

export function applyRudaMauzaBoundaryStyle(
  map,
  opacity = 100,
  color = RUDA_MAUZA_LINE_COLOR,
) {
  const opacityRatio = getOpacityRatio(opacity);

  setPaintProperties(map, LAYERS.rudaMauzaBoundaryFill, {
    "fill-color": color,
    "fill-opacity": RUDA_MAUZA_BASE_FILL_OPACITY * opacityRatio,
    "fill-outline-color": color,
  });

  setPaintProperties(map, LAYERS.rudaMauzaBoundaryLine, {
    "line-color": color,
    "line-width": [
      "interpolate",
      ["linear"],
      ["zoom"],
      8,
      1.2,
      13,
      1.8,
      16,
      2.4,
    ],
    "line-opacity": RUDA_MAUZA_BASE_LINE_OPACITY * opacityRatio,
  });

  setPaintProperties(map, LAYERS.rudaMauzaBoundaryLabel, {
    "text-color": color,
    "text-halo-color": "#ffffff",
    "text-halo-width": 1.3,
  });
}

export function addRudaMauzaBoundaryLayer(
  map,
  data,
  opacity = 100,
  color = RUDA_MAUZA_LINE_COLOR,
) {
  ensureSource(
    map,
    SOURCES.rudaMauzaBoundary,
    normalizeGeometryCollections(data),
  );

  if (!map.getLayer(LAYERS.rudaMauzaBoundaryFill)) {
    map.addLayer({
      id: LAYERS.rudaMauzaBoundaryFill,
      type: "fill",
      source: SOURCES.rudaMauzaBoundary,
      paint: {
        "fill-color": color,
        "fill-opacity": RUDA_MAUZA_BASE_FILL_OPACITY,
        "fill-outline-color": color,
      },
    });
  }

  if (!map.getLayer(LAYERS.rudaMauzaBoundaryLine)) {
    map.addLayer({
      id: LAYERS.rudaMauzaBoundaryLine,
      type: "line",
      source: SOURCES.rudaMauzaBoundary,
      paint: {
        "line-color": color,
        "line-width": [
          "interpolate",
          ["linear"],
          ["zoom"],
          8,
          1.2,
          13,
          1.8,
          16,
          2.4,
        ],
        "line-opacity": RUDA_MAUZA_BASE_LINE_OPACITY,
      },
    });
  }

  const labelLayout = {
    "text-field": [
      "coalesce",
      ["to-string", ["get", "Mouza"]],
      ["to-string", ["get", "mouza"]],
      ["to-string", ["get", "name"]],
      ["to-string", ["get", "Name"]],
      "",
    ],
    "text-size": ["interpolate", ["linear"], ["zoom"], 11, 9, 15, 12],
    "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
    "text-allow-overlap": false,
    "text-ignore-placement": false,
  };

  if (!map.getLayer(LAYERS.rudaMauzaBoundaryLabel)) {
    map.addLayer({
      id: LAYERS.rudaMauzaBoundaryLabel,
      type: "symbol",
      source: SOURCES.rudaMauzaBoundary,
      minzoom: 11,
      layout: labelLayout,
      paint: {
        "text-color": RUDA_MAUZA_LABEL_COLOR,
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.3,
      },
    });
  } else {
    setLayoutProperties(map, LAYERS.rudaMauzaBoundaryLabel, labelLayout);
  }

  applyRudaMauzaBoundaryStyle(map, opacity, color);
}

export function addProposedRoadsLayer(map, data) {
  ensureSource(
    map,
    SOURCES.proposedRoads,
    prepareProposedRoadsGeoJSONForDisplay(data),
  );

  if (!map.getLayer(LAYERS.proposedRoadsLine)) {
    map.addLayer({
      id: LAYERS.proposedRoadsLine,
      type: "line",
      source: SOURCES.proposedRoads,
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": ROAD_COLOR_EXPRESSION,
        "line-width": ROAD_WIDTH_EXPRESSION,
        "line-opacity": 1,
      },
    });
  }
}
