import { addCadastralBoundaryLayer } from "./_cadastralBoundaryLayerFactory";

export const KHASRA_BOUNDARY_COLOR = "#712B13";

export const KHASRA_BOUNDARY_IDS = {
  src: "gism-lrr-khasra-src",
  fill: "gism-lrr-khasra-fill",
  line: "gism-lrr-khasra-line",
  label: "gism-lrr-khasra-label",
};

const KHASRA_LABEL = [
  "coalesce",
  ["to-string", ["get", "kh"]],
  ["to-string", ["get", "KH"]],
  ["to-string", ["get", "Kh"]],
  ["to-string", ["get", "khasra_id"]],
  "",
];

export function addKhasraBoundaryLayer(
  map,
  data,
  color = KHASRA_BOUNDARY_COLOR,
  opacity = 1,
  beforeId,
) {
  addCadastralBoundaryLayer({
    map,
    data,
    ids: KHASRA_BOUNDARY_IDS,
    color,
    opacity,
    // 0.5 px to 0.75 px keeps dense parcel boundaries crisp.
    lineWidth: ["interpolate", ["linear"], ["zoom"], 8, 0.5, 16, 0.75],
    fillOpacity: 0,
    labelExpression: KHASRA_LABEL,
    labelMinZoom: 14.6,
    beforeId,
  });
}
