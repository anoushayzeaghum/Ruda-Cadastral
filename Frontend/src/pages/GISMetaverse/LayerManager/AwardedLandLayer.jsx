import { SOURCES, LAYERS } from "./MetaverseLayerConfig";
import { addImportedPolygonLayer } from "./_importedPolygonLayerFactory";

export function addAwardedLandLayer(map, data, color = "#a855f7", opacity = 1) {
  addImportedPolygonLayer({
    map,
    data,
    sourceId: SOURCES.awardedLand,
    fillLayerId: LAYERS.awardedLandFill,
    lineLayerId: LAYERS.awardedLandLine,
    labelLayerId: LAYERS.awardedLandLabel,
    color,
    opacity,
    labelFields: ["land_type", "khasra_lab", "mouza"],
    lineWidth: 1.3,
  });
}
