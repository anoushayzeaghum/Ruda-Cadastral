import { addCadastralBoundaryLayer } from "./_cadastralBoundaryLayerFactory";

export const MAUZA_BOUNDARY_COLOR = "#d3962d";

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
  sizeOverrides = null,
) {
  addCadastralBoundaryLayer({
    map,
    data,
    ids: MAUZA_BOUNDARY_IDS,
    color,
    opacity,
    // Preserve the original 1–1.5 px zoom-based width until a custom size is applied.
    lineWidth: Number.isFinite(sizeOverrides?.lineWidth)
      ? sizeOverrides.lineWidth
      : ["interpolate", ["linear"], ["zoom"], 8, 1, 16, 1.5],
    fillOpacity: 0,
    labelExpression: MAUZA_LABEL,
    labelFields: ["mauza", "Mauza", "moza", "Moza", "mouza", "name", "Name"],
    labelMinZoom: 14,
    beforeId,
  });

  // The shared factory retains its existing zoom-dependent text size by default.
  // Apply the user's fixed pixel value only when a custom size is selected.
  if (Number.isFinite(sizeOverrides?.labelSize) && map?.getLayer(MAUZA_BOUNDARY_IDS.label)) {
    map.setLayoutProperty(MAUZA_BOUNDARY_IDS.label, "text-size", sizeOverrides.labelSize);
  }
}
