export const RUDA_SCHEME_COLORS = Object.freeze({
  "approved by other authorities": "#18d231",
  "del-up": "#2049c3",
  "fs granted": "#239afc",
  "indigenous project": "#00585a",
  "jv-c": "#d8ff28",
  "ppp granted": "#650051",
  "reserved area": "#ff7213",
  "ta granted": "#9a4c14",
  "under process": "#c53100",
  underprocess: "#ac1400",
});

export const RUDA_STATUS_COLORS = RUDA_SCHEME_COLORS;

export const HOUSING_SCHEME_FALLBACK_COLOR = "#b34f4c";

const normalizedRudaScheme = [
  "downcase",
  ["to-string", ["coalesce", ["get", "ruda_scheme"], ["get", "ruda_st"], ""]],
];

const schemeMatchPairs = Object.entries(RUDA_SCHEME_COLORS).flatMap(
  ([scheme, color]) => [scheme, color],
);

export const HousingSchemesColorExpression = [
  "match",
  normalizedRudaScheme,
  ...schemeMatchPairs,
  HOUSING_SCHEME_FALLBACK_COLOR,
];

const HousingSchemesStyle = Object.freeze({
  // Default color used by the Layer Manager preview.
  color: "#32E34B",

  // MapLibre/Mapbox feature-level color expression.
  dataDrivenColor: HousingSchemesColorExpression,

  fillOpacity: 0.42,
  lineOpacity: 1,
  lineWidth: ["interpolate", ["linear"], ["zoom"], 7, 1.2, 14, 2.8],
  pointRadius: ["interpolate", ["linear"], ["zoom"], 7, 3, 15, 6],
  pointStrokeColor: "#ffffff",
  pointStrokeWidth: 1,
});

export default HousingSchemesStyle;
