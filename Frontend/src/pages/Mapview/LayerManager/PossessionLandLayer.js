const POSSESSION_TYPE_PROPERTY = "l_type";

export const POSSESSION_LAND_TYPES = [
  {
    value: "mutated land",
    label: "Mutated Land",
    fillColor: "#AFCB4F",
    lineColor: "#5F7F00",
  },
  {
    value: "demarcated land",
    label: "Demarcated Land",
    fillColor: "#ca3c3c",
    lineColor: "#7A0C0C",
  },
  {
    value: "possession land",
    label: "Possession Land",
    fillColor: "#F48FB1",
    lineColor: "#D81B60",
  },
];

export const DEFAULT_POSSESSION_LAND_TYPES = POSSESSION_LAND_TYPES.map(
  (item) => item.value,
);

const possessionTypeExpression = [
  "downcase",
  [
    "to-string",
    ["coalesce", ["get", POSSESSION_TYPE_PROPERTY], ""],
  ],
];

export const POSSESSION_LAND_FILL_PAINT = [
  "match",
  possessionTypeExpression,
  ...POSSESSION_LAND_TYPES.flatMap((item) => [item.value, item.fillColor]),
  "#EAF3DE",
];

export const POSSESSION_LAND_LINE_PAINT = [
  "match",
  possessionTypeExpression,
  ...POSSESSION_LAND_TYPES.flatMap((item) => [item.value, item.lineColor]),
  "#27500A",
];

export const normalizePossessionLandTypes = (selectedTypes) => {
  if (!Array.isArray(selectedTypes)) {
    return [...DEFAULT_POSSESSION_LAND_TYPES];
  }

  const allowed = new Set(DEFAULT_POSSESSION_LAND_TYPES);
  return [...new Set(selectedTypes.map((value) => String(value).trim().toLowerCase()))]
    .filter((value) => allowed.has(value));
};

export const getPossessionLandTypeFilter = (selectedTypes) => {
  const normalized = normalizePossessionLandTypes(selectedTypes);

  // Keep the original unfiltered behaviour when every subtype is selected.
  if (normalized.length === DEFAULT_POSSESSION_LAND_TYPES.length) return null;

  return ["in", possessionTypeExpression, ["literal", normalized]];
};

export const applyPossessionLandTypeFilter = (
  map,
  layerIds,
  selectedTypes,
) => {
  if (!map || !layerIds) return;

  const filter = getPossessionLandTypeFilter(selectedTypes);

  [layerIds.fill, layerIds.line, layerIds.label].forEach((layerId) => {
    if (layerId && map.getLayer(layerId)) {
      map.setFilter(layerId, filter);
    }
  });
};

export const addPossessionLandLayerStyles = ({
  map,
  layerIds,
  geojson,
  opacity,
  selectedTypes,
  labelExpression,
}) => {
  if (!map || !layerIds) return;

  const filter = getPossessionLandTypeFilter(selectedTypes);
  const withFilter = filter ? { filter } : {};

  map.addSource(layerIds.source, {
    type: "geojson",
    data: geojson,
  });

  map.addLayer({
    id: layerIds.fill,
    type: "fill",
    source: layerIds.source,
    ...withFilter,
    paint: {
      "fill-color": POSSESSION_LAND_FILL_PAINT,
      "fill-opacity": 0.45 * opacity,
    },
  });

  map.addLayer({
    id: layerIds.line,
    type: "line",
    source: layerIds.source,
    ...withFilter,
    paint: {
      "line-color": POSSESSION_LAND_LINE_PAINT,
      "line-width": 1.3,
      "line-opacity": opacity,
    },
  });

  map.addLayer({
    id: layerIds.label,
    type: "symbol",
    source: layerIds.source,
    minzoom: 15,
    maxzoom: 24,
    ...withFilter,
    layout: {
      "text-field": labelExpression,
      "text-size": [
        "interpolate",
        ["linear"],
        ["zoom"],
        15,
        10,
        16,
        11,
        18,
        13,
      ],
      "text-allow-overlap": false,
      "text-ignore-placement": false,
    },
    paint: {
      "text-color": POSSESSION_LAND_LINE_PAINT,
      "text-opacity": opacity,
      "text-halo-color": "#ffffff",
      "text-halo-width": 1,
    },
  });
};
