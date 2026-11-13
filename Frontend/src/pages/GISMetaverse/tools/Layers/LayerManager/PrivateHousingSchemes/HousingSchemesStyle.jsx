// Five requested RUDA statuses only. Four colors were sampled from the supplied legend.
// Brown for Reserved Area is an additional requested design choice.
export const RUDA_SCHEME_COLORS = Object.freeze({
  "fs granted": "#AAFF80",
  "ta granted": "#00E6A8",
  "ppp granted": "#FFD57F",
  "under process": "#E380FF",
  "reserved area": "#8B4513",
});

export const RUDA_STATUS_COLORS = RUDA_SCHEME_COLORS;

// Unrecognized statuses must not be assigned an invented sixth status color.
export const HOUSING_SCHEME_FALLBACK_COLOR = "rgba(0,0,0,0)";

const normalizedRudaScheme = [
  "downcase",
  ["to-string", ["coalesce", ["get", "ruda_scheme"], ["get", "ruda_st"], ""]],
];

const schemeMatchPairs = [
  ...Object.entries(RUDA_SCHEME_COLORS).flatMap(([scheme, color]) => [scheme, color]),
  // Preserve old data spelling without adding another legend category.
  "underprocess", RUDA_SCHEME_COLORS["under process"],
];

export const HousingSchemesColorExpression = [
  "match",
  normalizedRudaScheme,
  ...schemeMatchPairs,
  HOUSING_SCHEME_FALLBACK_COLOR,
];

const HousingSchemesStyle = Object.freeze({
  // Default color used by the Layer Manager preview.
  color: RUDA_SCHEME_COLORS["fs granted"],

  // MapLibre/Mapbox feature-level color expression.
  dataDrivenColor: HousingSchemesColorExpression,

  // Follow the existing scheme-status palette for text labels.
  // RUDA vector labels begin at zoom 10 and remain available above it.
  labelColor: HousingSchemesColorExpression,
  labelMinZoom: 10,
  labelMaxZoom: 24,
  labelHaloColor: "#ffffff",
  labelHaloWidth: 1.8,

  fillOpacity: 0.42,
  lineOpacity: 1,
  lineWidth: ["interpolate", ["linear"], ["zoom"], 7, 1.2, 14, 2.8],
  pointRadius: ["interpolate", ["linear"], ["zoom"], 7, 3, 15, 6],
  pointStrokeColor: "#ffffff",
  pointStrokeWidth: 1,
});

export default HousingSchemesStyle;
