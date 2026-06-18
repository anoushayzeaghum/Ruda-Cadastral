import {
  SOURCES,
  LAYERS,
  ensureSource,
  normalizeGeometryCollections,
} from "./MetaverseLayerConfig";

export function addWaterSupplyPointsLayer(map, data) {
  ensureSource(
    map,
    SOURCES.waterSupplyPoints,
    normalizeGeometryCollections(data),
  );

  if (!map.getLayer(LAYERS.waterSupplyPointsCircle)) {
    map.addLayer({
      id: LAYERS.waterSupplyPointsCircle,
      type: "circle",
      source: SOURCES.waterSupplyPoints,
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 12, 4, 18, 7],
        "circle-color": "#42a5f5",
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 1.5,
      },
    });
  }

  if (!map.getLayer(LAYERS.waterSupplyPointsLabel)) {
    map.addLayer({
      id: LAYERS.waterSupplyPointsLabel,
      type: "symbol",
      source: SOURCES.waterSupplyPoints,
      minzoom: 16,
      layout: {
        "text-field": [
          "coalesce",
          ["to-string", ["get", "name"]],
          ["to-string", ["get", "Name"]],
          "",
        ],
        "text-size": 10,
        "text-offset": [0, 1.2],
        "text-anchor": "top",
        "text-allow-overlap": false,
      },
      paint: {
        "text-color": "#0f172a",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.2,
      },
    });
  }
}

export function addWaterSupplyLinesLayer(map, data) {
  ensureSource(
    map,
    SOURCES.waterSupplyLines,
    normalizeGeometryCollections(data),
  );

  if (!map.getLayer(LAYERS.waterSupplyLinesLine)) {
    map.addLayer({
      id: LAYERS.waterSupplyLinesLine,
      type: "line",
      source: SOURCES.waterSupplyLines,
      paint: {
        "line-color": "#00386a",
        "line-width": ["interpolate", ["linear"], ["zoom"], 10, 2, 18, 4],
      },
    });
  }

  if (!map.getLayer(LAYERS.waterSupplyLinesLabel)) {
    map.addLayer({
      id: LAYERS.waterSupplyLinesLabel,
      type: "symbol",
      source: SOURCES.waterSupplyLines,
      minzoom: 16,
      layout: {
        "symbol-placement": "line",
        "text-field": [
          "coalesce",
          ["to-string", ["get", "dia"]],
          ["to-string", ["get", "DIA"]],
          ["to-string", ["get", "Dia"]],
          "",
        ],
        "text-size": 10,
        "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
        "text-allow-overlap": false,
        "text-ignore-placement": false,
      },
      paint: {
        "text-color": "#0f172a",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.2,
      },
    });
  }
}

export function addSewagePointsLayer(map, data) {
  ensureSource(map, SOURCES.sewagePoints, normalizeGeometryCollections(data));

  if (!map.getLayer(LAYERS.sewagePointsCircle)) {
    map.addLayer({
      id: LAYERS.sewagePointsCircle,
      type: "circle",
      source: SOURCES.sewagePoints,
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 12, 4, 18, 7],
        "circle-color": "#8e44ad",
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 1.5,
      },
    });
  }

  if (!map.getLayer(LAYERS.sewagePointsLabel)) {
    map.addLayer({
      id: LAYERS.sewagePointsLabel,
      type: "symbol",
      source: SOURCES.sewagePoints,
      minzoom: 16,
      layout: {
        "text-field": [
          "coalesce",
          ["to-string", ["get", "type"]],
          ["to-string", ["get", "TYPE"]],
          ["to-string", ["get", "Type"]],
          "",
        ],
        "text-size": 10,
        "text-offset": [0, 1.2],
        "text-anchor": "top",
        "text-allow-overlap": false,
      },
      paint: {
        "text-color": "#0f172a",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.2,
      },
    });
  }
}

export function addCameraLocationsLayer(map, data) {
  ensureSource(
    map,
    SOURCES.cameraLocations,
    normalizeGeometryCollections(data),
  );

  if (!map.getLayer(LAYERS.cameraLocationsCircle)) {
    map.addLayer({
      id: LAYERS.cameraLocationsCircle,
      type: "circle",
      source: SOURCES.cameraLocations,
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 12, 5, 18, 8],
        "circle-color": "#f97316",
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 1.5,
      },
    });
  }

  if (!map.getLayer(LAYERS.cameraLocationsLabel)) {
    map.addLayer({
      id: LAYERS.cameraLocationsLabel,
      type: "symbol",
      source: SOURCES.cameraLocations,
      minzoom: 15,
      layout: {
        "text-field": [
          "coalesce",
          ["to-string", ["get", "camera"]],
          ["to-string", ["get", "name"]],
          "",
        ],
        "text-size": 10,
        "text-offset": [0, 1.2],
        "text-anchor": "top",
        "text-allow-overlap": false,
      },
      paint: {
        "text-color": "#0f172a",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.2,
      },
    });
  }
}
