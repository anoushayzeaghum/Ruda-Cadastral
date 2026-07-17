import { SOURCES, LAYERS } from "../MetaverseLayerConfig";
import { addImportedPolygonLayer } from "./_importedPolygonLayerFactory";

export const AWARDED_LAND_COLORS = {
  fill: "#FAEEDA",
  line: "#854F0B",
};

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
    labelFields: ["land_type", "khasra_lab", "mouza"],
    lineWidth: 1.3,
  });
}
