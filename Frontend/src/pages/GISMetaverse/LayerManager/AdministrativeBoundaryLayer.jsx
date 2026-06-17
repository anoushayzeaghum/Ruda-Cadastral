import {
  SOURCES,
  LAYERS,
  ROAD_COLOR_EXPRESSION,
  ROAD_WIDTH_EXPRESSION,
  ensureSource,
  normalizeGeometryCollections,
  prepareRudaGeoJSONForDisplay,
  prepareProposedRoadsGeoJSONForDisplay,
} from "./MetaverseLayerConfig";

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
        "line-color": "#111827",
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
        "line-color": "#111827",
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
        "text-color": "#111827",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.4,
      },
    });
  }
}

export function addRudaMauzaBoundaryLayer(map, data) {
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
        "fill-color": "#22c55e",
        "fill-opacity": 0.12,
      },
    });
  }

  if (!map.getLayer(LAYERS.rudaMauzaBoundaryLine)) {
    map.addLayer({
      id: LAYERS.rudaMauzaBoundaryLine,
      type: "line",
      source: SOURCES.rudaMauzaBoundary,
      paint: {
        "line-color": "#22c55e",
        "line-width": 1.5,
        "line-opacity": 1,
      },
    });
  }

  if (!map.getLayer(LAYERS.rudaMauzaBoundaryLabel)) {
    map.addLayer({
      id: LAYERS.rudaMauzaBoundaryLabel,
      type: "symbol",
      source: SOURCES.rudaMauzaBoundary,
      minzoom: 11,
      layout: {
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
      },
      paint: {
        "text-color": "#064e3b",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.2,
      },
    });
  }
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
