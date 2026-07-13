import {
  SOURCES,
  LAYERS,
  ensureSource,
  normalizeGeometryCollections,
} from "../MetaverseLayerConfig";

const DEFAULT_UTILITY_STYLES = {
  waterSupplyPoints: { color: "#42a5f5", opacity: 100 },
  waterSupplyLines: { color: "#00386a", opacity: 100 },
  sewagePoints: { color: "#8e44ad", opacity: 100 },
  cameraLocations: { color: "#f97316", opacity: 100 },
};

const getRuntimeStyle = (key) => {
  if (typeof window === "undefined") return DEFAULT_UTILITY_STYLES[key];

  return {
    ...DEFAULT_UTILITY_STYLES[key],
    ...(window.__metaverseLayerRuntimeStyles?.[key] || {}),
  };
};

const getOpacityRatio = (opacity = 100) => {
  const numeric = Number(opacity);
  if (!Number.isFinite(numeric)) return 1;
  return Math.min(Math.max(numeric, 0), 100) / 100;
};

const setPaint = (map, layerId, property, value) => {
  if (map?.getLayer?.(layerId)) {
    map.setPaintProperty(layerId, property, value);
  }
};

export function addWaterSupplyPointsLayer(map, data) {
  ensureSource(
    map,
    SOURCES.waterSupplyPoints,
    normalizeGeometryCollections(data),
  );

  const style = getRuntimeStyle("waterSupplyPoints");
  const opacityRatio = getOpacityRatio(style.opacity);

  if (!map.getLayer(LAYERS.waterSupplyPointsCircle)) {
    map.addLayer({
      id: LAYERS.waterSupplyPointsCircle,
      type: "circle",
      source: SOURCES.waterSupplyPoints,
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 12, 4, 18, 7],
        "circle-color": style.color,
        "circle-opacity": opacityRatio,
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 1.5,
        "circle-stroke-opacity": opacityRatio,
      },
    });
  } else {
    setPaint(map, LAYERS.waterSupplyPointsCircle, "circle-color", style.color);
    setPaint(
      map,
      LAYERS.waterSupplyPointsCircle,
      "circle-opacity",
      opacityRatio,
    );
    setPaint(
      map,
      LAYERS.waterSupplyPointsCircle,
      "circle-stroke-opacity",
      opacityRatio,
    );
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
        "text-color": style.color,
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.2,
        "text-opacity": opacityRatio,
      },
    });
  } else {
    setPaint(map, LAYERS.waterSupplyPointsLabel, "text-color", style.color);
    setPaint(map, LAYERS.waterSupplyPointsLabel, "text-opacity", opacityRatio);
  }
}

export function addWaterSupplyLinesLayer(map, data) {
  ensureSource(
    map,
    SOURCES.waterSupplyLines,
    normalizeGeometryCollections(data),
  );

  const style = getRuntimeStyle("waterSupplyLines");
  const opacityRatio = getOpacityRatio(style.opacity);

  if (!map.getLayer(LAYERS.waterSupplyLinesLine)) {
    map.addLayer({
      id: LAYERS.waterSupplyLinesLine,
      type: "line",
      source: SOURCES.waterSupplyLines,
      paint: {
        "line-color": style.color,
        "line-width": ["interpolate", ["linear"], ["zoom"], 10, 2, 18, 4],
        "line-opacity": opacityRatio,
      },
    });
  } else {
    setPaint(map, LAYERS.waterSupplyLinesLine, "line-color", style.color);
    setPaint(map, LAYERS.waterSupplyLinesLine, "line-opacity", opacityRatio);
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
        "text-color": style.color,
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.2,
        "text-opacity": opacityRatio,
      },
    });
  } else {
    setPaint(map, LAYERS.waterSupplyLinesLabel, "text-color", style.color);
    setPaint(map, LAYERS.waterSupplyLinesLabel, "text-opacity", opacityRatio);
  }
}

export function addSewagePointsLayer(map, data) {
  ensureSource(map, SOURCES.sewagePoints, normalizeGeometryCollections(data));

  const style = getRuntimeStyle("sewagePoints");
  const opacityRatio = getOpacityRatio(style.opacity);

  if (!map.getLayer(LAYERS.sewagePointsCircle)) {
    map.addLayer({
      id: LAYERS.sewagePointsCircle,
      type: "circle",
      source: SOURCES.sewagePoints,
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 12, 4, 18, 7],
        "circle-color": style.color,
        "circle-opacity": opacityRatio,
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 1.5,
        "circle-stroke-opacity": opacityRatio,
      },
    });
  } else {
    setPaint(map, LAYERS.sewagePointsCircle, "circle-color", style.color);
    setPaint(map, LAYERS.sewagePointsCircle, "circle-opacity", opacityRatio);
    setPaint(
      map,
      LAYERS.sewagePointsCircle,
      "circle-stroke-opacity",
      opacityRatio,
    );
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
        "text-color": style.color,
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.2,
        "text-opacity": opacityRatio,
      },
    });
  } else {
    setPaint(map, LAYERS.sewagePointsLabel, "text-color", style.color);
    setPaint(map, LAYERS.sewagePointsLabel, "text-opacity", opacityRatio);
  }
}

export function addCameraLocationsLayer(map, data) {
  ensureSource(
    map,
    SOURCES.cameraLocations,
    normalizeGeometryCollections(data),
  );

  const style = getRuntimeStyle("cameraLocations");
  const opacityRatio = getOpacityRatio(style.opacity);

  if (!map.getLayer(LAYERS.cameraLocationsCircle)) {
    map.addLayer({
      id: LAYERS.cameraLocationsCircle,
      type: "circle",
      source: SOURCES.cameraLocations,
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 12, 5, 18, 8],
        "circle-color": style.color,
        "circle-opacity": opacityRatio,
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 1.5,
        "circle-stroke-opacity": opacityRatio,
      },
    });
  } else {
    setPaint(map, LAYERS.cameraLocationsCircle, "circle-color", style.color);
    setPaint(map, LAYERS.cameraLocationsCircle, "circle-opacity", opacityRatio);
    setPaint(
      map,
      LAYERS.cameraLocationsCircle,
      "circle-stroke-opacity",
      opacityRatio,
    );
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
        "text-color": style.color,
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.2,
        "text-opacity": opacityRatio,
      },
    });
  } else {
    setPaint(map, LAYERS.cameraLocationsLabel, "text-color", style.color);
    setPaint(map, LAYERS.cameraLocationsLabel, "text-opacity", opacityRatio);
  }
}
