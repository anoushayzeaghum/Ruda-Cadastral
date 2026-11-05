import { addCadastralBoundaryLayer } from "./_cadastralBoundaryLayerFactory";

export const SQUARE_BOUNDARY_COLOR = "#185FA5";

export const SQUARE_BOUNDARY_IDS = {
  src: "gism-lrr-square-src",
  fill: "gism-lrr-square-fill",
  line: "gism-lrr-square-line",
  label: "gism-lrr-square-label",
};

export function addSquareBoundaryLayer(
  map,
  data,
  color = SQUARE_BOUNDARY_COLOR,
  opacity = 1,
  beforeId,
) {
  addCadastralBoundaryLayer({
    map,
    data,
    ids: SQUARE_BOUNDARY_IDS,
    color,
    opacity,
    // 1.25 px to 1.5 px with the requested 6,3 dash pattern.
    lineWidth: ["interpolate", ["linear"], ["zoom"], 8, 1.25, 16, 1.5],
    lineDasharray: [6, 3],
    fillOpacity: 0,
    // The RUDA Square model and serializer expose `square`, not `sq`.
    labelExpression: ["to-string", ["coalesce", ["get", "square"], ["get", "Square"], ""]],
    labelFields: ["square", "Square"],
    labelMinZoom: 11,
    beforeId,
  });
}
