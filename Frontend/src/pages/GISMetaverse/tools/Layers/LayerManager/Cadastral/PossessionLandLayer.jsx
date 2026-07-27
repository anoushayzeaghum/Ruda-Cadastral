import { SOURCES, LAYERS } from "../MetaverseLayerConfig";
import { addImportedPolygonLayer } from "./_importedPolygonLayerFactory";

export const POSSESSION_LAND_COLORS = {
  fill: "#EAF3DE",
  line: "#27500A",
};

export const POSSESSION_LAND_TYPES = [
  {
    key: "mutatedLand",
    value: "Mutated Land",
    lineColor: "#2E7D32",
    fillColor: "#C8E6C9",
  },
  {
    key: "demarcatedLand",
    value: "Demarcated Land",
    lineColor: "#9C27B0",
    fillColor: "#E8D5F0",
  },
  {
    key: "possessionLand",
    value: "Possession Land",
    lineColor: "#00BCD4",
    fillColor: "#C7F3F7",
  },
];

const LAND_LABEL_MIN_ZOOM = 15;
const LAND_LABEL_MAX_ZOOM = 24;

const NORMALIZED_L_TYPE_EXPRESSION = [
  "downcase",
  ["to-string", ["coalesce", ["get", "l_type"], ""]],
];

const KHASRA_LABEL_EXPRESSION = [
  "case",
  [
    "all",
    ["has", "khasra"],
    ["!=", ["get", "khasra"], null],
    ["!=", ["to-string", ["get", "khasra"]], ""],
  ],
  ["to-string", ["get", "khasra"]],
  "",
];

function buildTypeColorExpression(colorField, fallbackColor) {
  return [
    "match",
    NORMALIZED_L_TYPE_EXPRESSION,
    ...POSSESSION_LAND_TYPES.flatMap((type) => [
      type.value.toLowerCase(),
      type[colorField],
    ]),
    fallbackColor,
  ];
}

function applyPossessionLandSymbology(map, fallbackColor) {
  if (!map) return;

  if (map.getLayer(LAYERS.possessionLandFill)) {
    map.setPaintProperty(
      LAYERS.possessionLandFill,
      "fill-color",
      buildTypeColorExpression("fillColor", POSSESSION_LAND_COLORS.fill),
    );
  }

  if (map.getLayer(LAYERS.possessionLandLine)) {
    map.setPaintProperty(
      LAYERS.possessionLandLine,
      "line-color",
      buildTypeColorExpression("lineColor", fallbackColor),
    );
  }

  if (map.getLayer(LAYERS.possessionLandLabel)) {
    map.setPaintProperty(
      LAYERS.possessionLandLabel,
      "text-color",
      buildTypeColorExpression("lineColor", fallbackColor),
    );
  }
}

function applyKhasraOnlyLabel(map, labelLayerId) {
  if (!map || !labelLayerId || !map.getLayer(labelLayerId)) return;

  map.setLayoutProperty(labelLayerId, "text-field", KHASRA_LABEL_EXPRESSION);
  map.setLayoutProperty(labelLayerId, "text-size", [
    "interpolate",
    ["linear"],
    ["zoom"],
    LAND_LABEL_MIN_ZOOM,
    10,
    16,
    11,
    18,
    13,
  ]);
  map.setLayoutProperty(labelLayerId, "text-allow-overlap", false);
  map.setLayoutProperty(labelLayerId, "text-ignore-placement", false);
  map.setLayerZoomRange(labelLayerId, LAND_LABEL_MIN_ZOOM, LAND_LABEL_MAX_ZOOM);
}

export function addPossessionLandLayer(
  map,
  data,
  color = POSSESSION_LAND_COLORS.line,
  opacity = 1,
) {
  const fallbackColor = String(color || POSSESSION_LAND_COLORS.line);

  addImportedPolygonLayer({
    map,
    data,
    sourceId: SOURCES.possessionLand,
    fillLayerId: LAYERS.possessionLandFill,
    lineLayerId: LAYERS.possessionLandLine,
    labelLayerId: LAYERS.possessionLandLabel,
    fillColor: POSSESSION_LAND_COLORS.fill,
    lineColor: fallbackColor,
    labelColor: fallbackColor,
    opacity,
    fillOpacity: 0.65,
    labelFields: ["khasra"],
    labelMinZoom: LAND_LABEL_MIN_ZOOM,
    lineWidth: 1.3,
  });

  const source = map?.getSource?.(SOURCES.possessionLand);
  if (source?.setData) {
    source.setData(data);
  }

  applyPossessionLandSymbology(map, fallbackColor);
  applyKhasraOnlyLabel(map, LAYERS.possessionLandLabel);
}
