import { SOURCES, LAYERS } from "../MetaverseLayerConfig";
import { addImportedPolygonLayer } from "./_importedPolygonLayerFactory";

export function addRtwAlignmentLayer(
  map,
  data,
  color = "#38bdf8",
  opacity = 1,
) {
  addImportedPolygonLayer({
    map,
    data,
    sourceId: SOURCES.rtwAlignment,
    fillLayerId: LAYERS.rtwAlignmentFill,
    lineLayerId: LAYERS.rtwAlignmentLine,
    labelLayerId: LAYERS.rtwAlignmentLabel,
    color,
    opacity,
    labelFields: ["package", "length"],
    lineWidth: 1.6,
  });
}
