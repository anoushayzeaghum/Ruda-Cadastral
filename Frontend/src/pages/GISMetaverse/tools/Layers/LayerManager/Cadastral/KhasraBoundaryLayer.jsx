import { addCadastralBoundaryLayer } from "./_cadastralBoundaryLayerFactory";

export const KHASRA_BOUNDARY_COLOR = "#712B13";

export const KHASRA_BOUNDARY_IDS = {
  src: "gism-lrr-khasra-src",
  fill: "gism-lrr-khasra-fill",
  line: "gism-lrr-khasra-line",
  label: "gism-lrr-khasra-label",
};

// Khasra model provides join_shp, kh, sq and khasra_id on vector tiles.
const KHASRA_LABEL = [
  "to-string",
  ["coalesce", ["get", "join_shp"], ["get", "kh"], ["get", "KH"], ["get", "khasra_id"], ""],
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
    labelMinZoom: 11,
    beforeId,
  });
}
