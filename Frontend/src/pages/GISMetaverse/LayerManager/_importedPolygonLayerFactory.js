import { ensureSource } from "./MetaverseLayerConfig";

const LABEL_FONT = ["Open Sans Semibold", "Arial Unicode MS Bold"];

const getTextField = (fields = []) => [
  "to-string",
  ["coalesce", ...fields.flatMap((field) => [["get", field]]), ""],
];

const setPaintProperties = (map, layerId, paint = {}) => {
  if (!map.getLayer(layerId)) return;

  Object.entries(paint).forEach(([property, value]) => {
    map.setPaintProperty(layerId, property, value);
  });
};

const setLayoutProperties = (map, layerId, layout = {}) => {
  if (!map.getLayer(layerId)) return;

  Object.entries(layout).forEach(([property, value]) => {
    map.setLayoutProperty(layerId, property, value);
  });
};

export function addImportedPolygonLayer({
  map,
  data,
  sourceId,
  fillLayerId,
  lineLayerId,
  labelLayerId,
  color,
  opacity = 1,
  labelFields = ["name", "package", "khasra_lab", "mouza"],
  lineWidth = 1.4,
}) {
  if (!map) return;

  ensureSource(map, sourceId, data);

  const fillPaint = {
    "fill-color": color,
    "fill-opacity": 0.35 * opacity,
  };

  const linePaint = {
    "line-color": color,
    "line-width": lineWidth,
    "line-opacity": opacity,
  };

  const labelLayout = {
    "text-field": getTextField(labelFields),
    "text-size": ["interpolate", ["linear"], ["zoom"], 11, 9, 14, 11, 17, 13],
    "text-anchor": "center",
    "text-font": LABEL_FONT,
    "text-allow-overlap": false,
    "text-ignore-placement": false,
    "text-optional": true,
  };

  const labelPaint = {
    "text-color": color,
    "text-halo-color": "#ffffff",
    "text-halo-width": 1.3,
    "text-halo-blur": 0.2,
    "text-opacity": opacity,
  };

  if (!map.getLayer(fillLayerId)) {
    map.addLayer({
      id: fillLayerId,
      type: "fill",
      source: sourceId,
      paint: fillPaint,
    });
  } else {
    setPaintProperties(map, fillLayerId, fillPaint);
  }

  if (!map.getLayer(lineLayerId)) {
    map.addLayer({
      id: lineLayerId,
      type: "line",
      source: sourceId,
      paint: linePaint,
    });
  } else {
    setPaintProperties(map, lineLayerId, linePaint);
  }

  if (!map.getLayer(labelLayerId)) {
    map.addLayer({
      id: labelLayerId,
      type: "symbol",
      source: sourceId,
      minzoom: 12,
      layout: labelLayout,
      paint: labelPaint,
    });
  } else {
    setLayoutProperties(map, labelLayerId, labelLayout);
    setPaintProperties(map, labelLayerId, labelPaint);
  }
}
