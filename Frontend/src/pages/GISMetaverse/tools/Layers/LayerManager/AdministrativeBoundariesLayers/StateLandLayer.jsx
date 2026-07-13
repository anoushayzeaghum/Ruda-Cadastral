import { SOURCES, LAYERS } from "../MetaverseLayerConfig";
import { addImportedPolygonLayer } from "./_importedPolygonLayerFactory";

export function addStateLandLayer(map, data, color = "#22c55e", opacity = 1) {
  addImportedPolygonLayer({
    map,
    data,
    sourceId: SOURCES.stateLand,
    fillLayerId: LAYERS.stateLandFill,
    lineLayerId: LAYERS.stateLandLine,
    labelLayerId: LAYERS.stateLandLabel,
    color,
    opacity,
    labelFields: ["state_land", "khasra_lab", "mouza"],
    lineWidth: 1.3,
  });
}
