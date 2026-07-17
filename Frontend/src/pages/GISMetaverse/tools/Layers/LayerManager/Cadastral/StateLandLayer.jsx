import { SOURCES, LAYERS } from "../MetaverseLayerConfig";
import { addImportedPolygonLayer } from "./_importedPolygonLayerFactory";

export const STATE_LAND_COLORS = {
  fill: "#F1EFE8",
  line: "#5F5E5A",
};

export function addStateLandLayer(
  map,
  data,
  color = STATE_LAND_COLORS.line,
  opacity = 1,
) {
  const useDefaultPalette =
    color.toLowerCase() === STATE_LAND_COLORS.line.toLowerCase();

  addImportedPolygonLayer({
    map,
    data,
    sourceId: SOURCES.stateLand,
    fillLayerId: LAYERS.stateLandFill,
    lineLayerId: LAYERS.stateLandLine,
    labelLayerId: LAYERS.stateLandLabel,
    fillColor: useDefaultPalette ? STATE_LAND_COLORS.fill : color,
    lineColor: color,
    labelColor: color,
    opacity,
    fillOpacity: 0.65,
    labelFields: ["state_land", "khasra_lab", "mouza"],
    lineWidth: 1.3,
  });
}
