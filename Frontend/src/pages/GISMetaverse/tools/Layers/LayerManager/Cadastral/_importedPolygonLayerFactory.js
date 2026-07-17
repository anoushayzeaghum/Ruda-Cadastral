import { ensureSource } from "../MetaverseLayerConfig";

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
  fillColor = color,
  lineColor = color,
  labelColor = lineColor,
  opacity = 1,
  fillOpacity = 0.65,
  labelFields = ["name", "package", "khasra_lab", "mouza"],
  lineWidth = 1.4,
  lineDasharray,
  labelMinZoom = 12,
}) {
  if (!map) return;

  ensureSource(map, sourceId, data);

  const fillPaint = {
    "fill-color": fillColor,
    "fill-opacity": fillOpacity * opacity,
  };

  const linePaint = {
    "line-color": lineColor,
    "line-width": lineWidth,
    "line-opacity": opacity,
  };

  if (lineDasharray) {
    linePaint["line-dasharray"] = lineDasharray;
  }

  const labelLayout = {
    visibility: "visible",
    "text-field": getTextField(labelFields),
    "text-size": ["interpolate", ["linear"], ["zoom"], 11, 9, 14, 11, 17, 13],
    "text-anchor": "center",
    "text-font": LABEL_FONT,
    "text-allow-overlap": false,
    "text-ignore-placement": false,
    "text-optional": true,
  };

  const labelPaint = {
    "text-color": labelColor,
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
      layout: { visibility: "visible" },
    });
  } else {
    setPaintProperties(map, fillLayerId, fillPaint);
    map.setLayoutProperty(fillLayerId, "visibility", "visible");
  }

  if (!map.getLayer(lineLayerId)) {
    map.addLayer({
      id: lineLayerId,
      type: "line",
      source: sourceId,
      paint: linePaint,
      layout: { visibility: "visible" },
    });
  } else {
    setPaintProperties(map, lineLayerId, linePaint);
    map.setLayoutProperty(lineLayerId, "visibility", "visible");
  }

  if (!labelLayerId) return;

  if (!map.getLayer(labelLayerId)) {
    map.addLayer({
      id: labelLayerId,
      type: "symbol",
      source: sourceId,
      minzoom: labelMinZoom,
      layout: labelLayout,
      paint: labelPaint,
    });
  } else {
    setLayoutProperties(map, labelLayerId, labelLayout);
    setPaintProperties(map, labelLayerId, labelPaint);
  }
}
