import { SOURCES, LAYERS } from "../MetaverseLayerConfig";
import { addImportedPolygonLayer } from "./_importedPolygonLayerFactory";

export const POSSESSION_LAND_COLORS = {
  fill: "#EAF3DE",
  line: "#27500A",
};

export function addPossessionLandLayer(
  map,
  data,
  color = POSSESSION_LAND_COLORS.line,
  opacity = 1,
) {
  const useDefaultPalette =
    color.toLowerCase() === POSSESSION_LAND_COLORS.line.toLowerCase();

  addImportedPolygonLayer({
    map,
    data,
    sourceId: SOURCES.possessionLand,
    fillLayerId: LAYERS.possessionLandFill,
    lineLayerId: LAYERS.possessionLandLine,
    labelLayerId: LAYERS.possessionLandLabel,
    fillColor: useDefaultPalette ? POSSESSION_LAND_COLORS.fill : color,
    lineColor: color,
    labelColor: color,
    opacity,
    fillOpacity: 0.65,
    labelFields: ["projects", "khasra_lab", "mouza"],
    lineWidth: 1.3,
  });
}
