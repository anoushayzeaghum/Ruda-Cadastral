import { SOURCES, LAYERS } from "./MetaverseLayerConfig";
import { addImportedPolygonLayer } from "./_importedPolygonLayerFactory";

export function addRtwPackageLayer(map, data, color = "#f59e0b", opacity = 1) {
  addImportedPolygonLayer({
    map,
    data,
    sourceId: SOURCES.rtwPackage,
    fillLayerId: LAYERS.rtwPackageFill,
    lineLayerId: LAYERS.rtwPackageLine,
    labelLayerId: LAYERS.rtwPackageLabel,
    color,
    opacity,
    labelFields: ["package", "name", "ruda_phase"],
    lineWidth: 1.8,
  });
}
