import { addCadastralBoundaryLayer } from "./_cadastralBoundaryLayerFactory";

export const MAUZA_BOUNDARY_COLOR = "#2C2C2A";

export const MAUZA_BOUNDARY_IDS = {
  src: "gism-lrr-moza-src",
  fill: "gism-lrr-moza-fill",
  line: "gism-lrr-moza-line",
  label: "gism-lrr-moza-label",
};

const MAUZA_LABEL = [
  "coalesce",
  ["to-string", ["get", "mauza"]],
  ["to-string", ["get", "Mauza"]],
  ["to-string", ["get", "moza"]],
  ["to-string", ["get", "Moza"]],
  ["to-string", ["get", "name"]],
  ["to-string", ["get", "Name"]],
  "",
];

export function addMauzaBoundaryLayer(
  map,
  data,
  color = MAUZA_BOUNDARY_COLOR,
  opacity = 1,
  beforeId,
) {
  addCadastralBoundaryLayer({
    map,
    data,
    ids: MAUZA_BOUNDARY_IDS,
    color,
    opacity,
    // 2.5 px at low zoom, smoothly increasing to 3 px.
    lineWidth: ["interpolate", ["linear"], ["zoom"], 8, 2.5, 16, 3],
    fillOpacity: 0,
    labelExpression: MAUZA_LABEL,
    labelMinZoom: 14,
    beforeId,
  });
}
