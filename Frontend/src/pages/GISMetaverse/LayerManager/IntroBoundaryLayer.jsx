import {
  SOURCES,
  LAYERS,
  emptyFC,
  ensureSource,
  makeLabelGeoJSON,
  setLayerVisibility,
} from "./MetaverseLayerConfig";

export function addIntroBoundaryLayer(map, data, label) {
  ensureSource(map, SOURCES.introBoundary, data);
  ensureSource(map, SOURCES.introLabel, makeLabelGeoJSON(label, data));

  if (!map.getLayer(LAYERS.introBoundaryFill)) {
    map.addLayer({
      id: LAYERS.introBoundaryFill,
      type: "fill",
      source: SOURCES.introBoundary,
      paint: {
        "fill-color": "#16a34a",
        "fill-opacity": 0.12,
      },
    });
  }

  if (!map.getLayer(LAYERS.introBoundaryLine)) {
    map.addLayer({
      id: LAYERS.introBoundaryLine,
      type: "line",
      source: SOURCES.introBoundary,
      paint: {
        "line-color": "#16a34a",
        "line-width": 3,
      },
    });
  }

  if (!map.getLayer(LAYERS.introLabel)) {
    map.addLayer({
      id: LAYERS.introLabel,
      type: "symbol",
      source: SOURCES.introLabel,
      layout: {
        "text-field": ["get", "label"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 4, 18, 10, 30],
        "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
        "text-allow-overlap": true,
        "text-ignore-placement": true,
      },
      paint: {
        "text-color": "#06291f",
        "text-halo-color": "#ffffff",
        "text-halo-width": 2,
      },
    });
  }

  setLayerVisibility(
    map,
    [LAYERS.introBoundaryFill, LAYERS.introBoundaryLine, LAYERS.introLabel],
    true,
  );
}

export function clearIntroBoundaryLayer(map) {
  if (map.getSource(SOURCES.introBoundary)) {
    map.getSource(SOURCES.introBoundary).setData(emptyFC);
  }
  if (map.getSource(SOURCES.introLabel)) {
    map.getSource(SOURCES.introLabel).setData(emptyFC);
  }

  setLayerVisibility(
    map,
    [LAYERS.introBoundaryFill, LAYERS.introBoundaryLine, LAYERS.introLabel],
    false,
  );
}
