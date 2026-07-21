const LABEL_FONT = ["Open Sans Semibold", "Arial Unicode MS Bold"];

const ensureSource = (map, sourceId, data) => {
  const source = map.getSource(sourceId);
  if (source) {
    source.setData(data);
    return;
  }

  map.addSource(sourceId, {
    type: "geojson",
    data,
  });
};

const addLayerSafely = (map, layer, beforeId) => {
  if (beforeId && map.getLayer(beforeId)) {
    map.addLayer(layer, beforeId);
    return;
  }

  map.addLayer(layer);
};

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

export function addCadastralBoundaryLayer({
  map,
  data,
  ids,
  color,
  opacity = 1,
  lineWidth,
  lineDasharray,
  fillOpacity = 0,
  labelExpression,
  labelMinZoom = 14,
  beforeId,
}) {
  if (!map || !data || !ids?.src || !ids?.fill || !ids?.line) return;

  ensureSource(map, ids.src, data);

  const fillPaint = {
    "fill-color": color,
    "fill-opacity": fillOpacity * opacity,
  };

  const linePaint = {
    "line-color": color,
    "line-width": lineWidth,
    "line-opacity": opacity,
  };

  if (lineDasharray) {
    linePaint["line-dasharray"] = lineDasharray;
  }

  if (!map.getLayer(ids.fill)) {
    addLayerSafely(
      map,
      {
        id: ids.fill,
        type: "fill",
        source: ids.src,
        paint: fillPaint,
        layout: { visibility: "visible" },
      },
      beforeId,
    );
  } else {
    setPaintProperties(map, ids.fill, fillPaint);
    map.setLayoutProperty(ids.fill, "visibility", "visible");
  }

  if (!map.getLayer(ids.line)) {
    addLayerSafely(
      map,
      {
        id: ids.line,
        type: "line",
        source: ids.src,
        paint: linePaint,
        layout: { visibility: "visible" },
      },
      beforeId,
    );
  } else {
    setPaintProperties(map, ids.line, linePaint);
    map.setLayoutProperty(ids.line, "visibility", "visible");
  }

  if (!ids.label || !labelExpression) return;

  const labelLayout = {
    visibility: "visible",
    "text-field": labelExpression,
    "text-size": ["interpolate", ["linear"], ["zoom"], 14, 9, 18, 12],
    "text-font": LABEL_FONT,
    "text-allow-overlap": false,
    "text-ignore-placement": false,
  };

  const labelPaint = {
    "text-color": color,
    "text-halo-color": "#ffffff",
    "text-halo-width": 1.2,
    "text-opacity": opacity,
  };

  if (!map.getLayer(ids.label)) {
    addLayerSafely(
      map,
      {
        id: ids.label,
        type: "symbol",
        source: ids.src,
        minzoom: labelMinZoom,
        layout: labelLayout,
        paint: labelPaint,
      },
      beforeId,
    );
  } else {
    setLayoutProperties(map, ids.label, labelLayout);
    setPaintProperties(map, ids.label, labelPaint);
  }
}
