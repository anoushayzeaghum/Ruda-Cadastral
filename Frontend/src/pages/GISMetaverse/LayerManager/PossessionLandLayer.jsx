import { SOURCES, LAYERS } from "./MetaverseLayerConfig";
import { addImportedPolygonLayer } from "./_importedPolygonLayerFactory";

export function addPossessionLandLayer(map, data, color = "#ef4444", opacity = 1) {
  addImportedPolygonLayer({
    map,
    data,
    sourceId: SOURCES.possessionLand,
    fillLayerId: LAYERS.possessionLandFill,
    lineLayerId: LAYERS.possessionLandLine,
    labelLayerId: LAYERS.possessionLandLabel,
    color,
    opacity,
    labelFields: ["projects", "khasra_lab", "mouza"],
    lineWidth: 1.3,
  });
}
