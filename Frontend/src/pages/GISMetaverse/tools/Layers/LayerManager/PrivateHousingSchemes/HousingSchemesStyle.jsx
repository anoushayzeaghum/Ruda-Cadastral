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

// Extra colors are used only when the backend returns a new ruda_st
// category that is not already defined above.
export const HOUSING_SCHEME_DYNAMIC_PALETTE = Object.freeze([
  "#22c55e",
  "#3b82f6",
  "#a855f7",
  "#f97316",
  "#06b6d4",
  "#eab308",
  "#ec4899",
  "#14b8a6",
  "#8b5cf6",
  "#84cc16",
  "#ef4444",
  "#0ea5e9",
]);

export const RUDA_STATUS_COLORS = RUDA_SCHEME_COLORS;

export const HOUSING_SCHEME_FALLBACK_COLOR = "#b34f4c";

export const normalizeHousingSchemeStatus = (value) => {
  const normalized = String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

  // Treat legacy spelling as the same logical RUDA status.
  if (normalized === "underprocess") return "under process";

  return normalized;
};

export const createHousingSchemeCategoryConfig = (geojson) => {
  const rawStatuses = (geojson?.features || [])
    .map((feature) =>
      normalizeHousingSchemeStatus(
        feature?.properties?.ruda_st ?? feature?.properties?.ruda_scheme,
      ),
    )
    .filter(Boolean);

  const uniqueStatuses = Array.from(new Set(rawStatuses)).sort((a, b) =>
    a.localeCompare(b),
  );

  let dynamicIndex = 0;

  return uniqueStatuses.map((status) => {
    const knownColor = RUDA_SCHEME_COLORS[status];
    const color =
      knownColor ||
      HOUSING_SCHEME_DYNAMIC_PALETTE[
        dynamicIndex++ % HOUSING_SCHEME_DYNAMIC_PALETTE.length
      ];

    return {
      key: status,
      label: status.replace(/\b\w/g, (char) => char.toUpperCase()),
      color,
      isKnown: Boolean(knownColor),
    };
  });
};

export const createHousingSchemeColorExpression = (categoryConfig = []) => {
  const normalizedRudaScheme = [
    "to-string",
    [
      "coalesce",
      ["get", "_ruda_status_key"],
      ["get", "ruda_st"],
      ["get", "ruda_scheme"],
      "",
    ],
  ];

  const matchPairs = categoryConfig.flatMap(({ key, color }) => [key, color]);

  return [
    "match",
    normalizedRudaScheme,
    ...matchPairs,
    HOUSING_SCHEME_FALLBACK_COLOR,
  ];
};

// Backward-compatible expression used before the current backend data is loaded.
const defaultCategoryConfig = Object.entries(RUDA_SCHEME_COLORS).map(
  ([key, color]) => ({
    key,
    label: key.replace(/\b\w/g, (char) => char.toUpperCase()),
    color,
  }),
);

export const HousingSchemesColorExpression =
  createHousingSchemeColorExpression(defaultCategoryConfig);

const HousingSchemesStyle = Object.freeze({
  color: "#32E34B",
  dataDrivenColor: HousingSchemesColorExpression,
  fillOpacity: 0.42,
  lineOpacity: 1,
  lineWidth: ["interpolate", ["linear"], ["zoom"], 7, 1.2, 14, 2.8],
  pointRadius: ["interpolate", ["linear"], ["zoom"], 7, 3, 15, 6],
  pointStrokeColor: "#ffffff",
  pointStrokeWidth: 1,
});

export default HousingSchemesStyle;
