export const RUDA_SCHEME_COLORS = Object.freeze({
  "approved by other authorities": "#32E34B",
  "del-up": "#3D63D8",
  "fs granted": "#3E9BE8",
  "indigenous project": "#20C4C6",
  "jv-c": "#D9F45B",
  "ppp granted": "#F020C8",
  "reserved area": "#D95B05",
  "ta granted": "#F39A5B",
  "under process": "#E8430B",
  underprocess: "#B51E0B",
});

export const RUDA_STATUS_COLORS = RUDA_SCHEME_COLORS;

export const HOUSING_SCHEME_FALLBACK_COLOR = "#8B0A05";

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
