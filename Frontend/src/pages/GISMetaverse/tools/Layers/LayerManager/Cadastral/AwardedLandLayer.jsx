import { SOURCES, LAYERS } from "../MetaverseLayerConfig";
import { addImportedPolygonLayer } from "./_importedPolygonLayerFactory";

export const AWARDED_LAND_COLORS = {
  fill: "#FAEEDA",
  line: "#854F0B",
};

const LAND_LABEL_MIN_ZOOM = 15;
const LAND_LABEL_MAX_ZOOM = 24;

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

function applyKhasraOnlyLabel(map, labelLayerId) {
  if (!map || !labelLayerId || !map.getLayer(labelLayerId)) return;

  map.setLayoutProperty(
    labelLayerId,
    "text-field",
    KHASRA_LABEL_EXPRESSION,
  );
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
  map.setLayerZoomRange(
    labelLayerId,
    LAND_LABEL_MIN_ZOOM,
    LAND_LABEL_MAX_ZOOM,
  );
}

export function addAwardedLandLayer(
  map,
  data,
  color = AWARDED_LAND_COLORS.line,
  opacity = 1,
) {
  const useDefaultPalette =
    color.toLowerCase() === AWARDED_LAND_COLORS.line.toLowerCase();

  addImportedPolygonLayer({
    map,
    data,
    sourceId: SOURCES.awardedLand,
    fillLayerId: LAYERS.awardedLandFill,
    lineLayerId: LAYERS.awardedLandLine,
    labelLayerId: LAYERS.awardedLandLabel,
    fillColor: useDefaultPalette ? AWARDED_LAND_COLORS.fill : color,
    lineColor: color,
    labelColor: color,
    opacity,
    fillOpacity: 0.65,
    labelFields: ["khasra"],
    labelMinZoom: LAND_LABEL_MIN_ZOOM,
    lineWidth: 1.3,
  });

  applyKhasraOnlyLabel(map, LAYERS.awardedLandLabel);
}
