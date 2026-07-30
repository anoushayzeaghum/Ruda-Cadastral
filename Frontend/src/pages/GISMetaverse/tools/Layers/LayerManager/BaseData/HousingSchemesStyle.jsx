/*
 * Housing Schemes symbology.
 *
 * Colors are assigned from the `ruda_st` property. Add or rename status
 * values in RUDA_STATUS_COLORS when the database contains additional values.
 */

export const RUDA_STATUS_COLORS = Object.freeze({
  approved: "#16a34a",
  "ruda approved": "#16a34a",
  "final approved": "#15803d",
  "technically approved": "#22c55e",

  "under process": "#f59e0b",
  "under-process": "#f59e0b",
  pending: "#f59e0b",
  applied: "#eab308",

  illegal: "#dc2626",
  unapproved: "#dc2626",
  "not approved": "#ef4444",
  rejected: "#991b1b",

  "private housing scheme": "#7c3aed",
  private: "#7c3aed",
  ppp: "#0891b2",
  "public private partnership": "#0891b2",
});

export const HOUSING_SCHEME_FALLBACK_COLOR = "#64748b";

const normalizedRudaStatus = [
  "downcase",
  ["to-string", ["coalesce", ["get", "ruda_st"], ""]],
];

const statusMatchPairs = Object.entries(RUDA_STATUS_COLORS).flatMap(
  ([status, color]) => [status, color],
);

export const HousingSchemesColorExpression = [
  "match",
  normalizedRudaStatus,
  ...statusMatchPairs,
  HOUSING_SCHEME_FALLBACK_COLOR,
];

const HousingSchemesStyle = Object.freeze({
  // Used by the Layer Manager preview/color control.
  color: "#d97706",

  // Used by MapLibre/Mapbox for feature-level status symbology.
  dataDrivenColor: HousingSchemesColorExpression,

  fillOpacity: 0.42,
  lineOpacity: 1,
  lineWidth: ["interpolate", ["linear"], ["zoom"], 7, 1.2, 14, 2.8],
  pointRadius: ["interpolate", ["linear"], ["zoom"], 7, 3, 15, 6],
  pointStrokeColor: "#ffffff",
  pointStrokeWidth: 1,
});

export default HousingSchemesStyle;
