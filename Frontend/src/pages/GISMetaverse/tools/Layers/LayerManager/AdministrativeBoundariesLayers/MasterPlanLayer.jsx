import { SOURCES, LAYERS, ensureSource } from "../MetaverseLayerConfig";

const LAND_USE_VALUE = [
  "downcase",
  [
    "to-string",
    [
      "coalesce",
      ["get", "land_use"],
      ["get", "landuse"],
      ["get", "land_use_type"],
      ["get", "category"],
      ["get", "name"],
      ["get", "type"],
      "",
    ],
  ],
];

// Keep all expressions limited to operators supported by Mapbox GL JS.
const containsAny = (...values) => [
  "any",
  ...values.map((value) => [
    ">=",
    ["index-of", value.toLowerCase(), LAND_USE_VALUE],
    0,
  ]),
];

const equalsAny = (...values) => [
  "any",
  ...values.map((value) => [
    "==",
    LAND_USE_VALUE,
    value.toLowerCase(),
  ]),
];

const IS_CB_1_BOUNDARY = containsAny(
  "cb - 1 boundary",
  "cb-1 boundary",
  "cb 1 boundary",
  "cb1 boundary",
);

/*
 * Colors matched to the supplied CB-1 legend.
 *
 * Legend classes:
 * Green/Open Area/Parks
 * Condominiums
 * Mix Use
 * Commercial
 * Public Building
 * Residential (10 Marla Plots)
 * Residential (1 Kanal Plots)
 * Petrol Pump
 * Grand Mosque
 * RUDA Office
 * Convenience Shops
 * CB-1 Boundary
 */
export const MASTER_PLAN_LAND_USE_COLORS = {
  greenOpenAreaParks: "#009A44",
  condominiums: "#D29AC5",
  mixUse: "#8B8D32",
  commercial: "#9ED5EC",
  publicBuilding: "#E8A2A8",
  residential10Marla: "#E98A00",
  residential1Kanal: "#C87500",
  petrolPump: "#D63F49",
  grandMosque: "#F4F174",
  rudaOffice: "#67D6A4",
  convenienceShops: "#B04C9C",
  cb1Boundary: "#00FF00",

  // Categories present in the data but not separately shown in the supplied legend.
  canal: "#9ED5EC",
  passage: "#F3F4F6",
  utility: "#E8A2A8",

  fallback: "#9CA3AF",
};

const MASTER_PLAN_FILL_COLOR = [
  "case",

  // Boundary only: no polygon fill.
  IS_CB_1_BOUNDARY,
  "rgba(0, 0, 0, 0)",

  // Green / Open Area / Park
  equalsAny(
    "green area",
    "green areas",
    "green",
    "open area",
    "open areas",
    "open space",
    "open spaces",
    "park",
    "parks",
  ),
  MASTER_PLAN_LAND_USE_COLORS.greenOpenAreaParks,

  // Condominiums
  equalsAny("condominium", "condominiums", "condo", "condos"),
  MASTER_PLAN_LAND_USE_COLORS.condominiums,

  // Mix Use
  equalsAny(
    "mix use",
    "mixed use",
    "mix-use",
    "mixed-use",
    "mixed use development",
  ),
  MASTER_PLAN_LAND_USE_COLORS.mixUse,

  // Commercial
  equalsAny("commercial", "commercial area", "commercial plot"),
  MASTER_PLAN_LAND_USE_COLORS.commercial,

  // Public Building
  equalsAny(
    "public building",
    "public buildings",
    "public use",
    "public facility",
  ),
  MASTER_PLAN_LAND_USE_COLORS.publicBuilding,

  // Residential 1 Kanal
  [
    "all",
    containsAny("residential"),
    containsAny("1 kanal", "1-kanal", "1kanal"),
  ],
  MASTER_PLAN_LAND_USE_COLORS.residential1Kanal,

  // Residential 10 Marla
  [
    "all",
    containsAny("residential"),
    containsAny("10 marla", "10-marla", "10marla"),
  ],
  MASTER_PLAN_LAND_USE_COLORS.residential10Marla,

  // Generic Residential defaults to the 10-Marla legend color.
  equalsAny(
    "residential",
    "residential area",
    "residential plot",
    "residential plots",
  ),
  MASTER_PLAN_LAND_USE_COLORS.residential10Marla,

  // Petrol Pump
  equalsAny(
    "petrol pump",
    "petrol pumps",
    "fuel station",
    "filling station",
  ),
  MASTER_PLAN_LAND_USE_COLORS.petrolPump,

  // Grand Mosque / Masjid
  equalsAny(
    "grand mosque",
    "mosque",
    "masjid",
    "jamia mosque",
    "jama masjid",
  ),
  MASTER_PLAN_LAND_USE_COLORS.grandMosque,

  // RUDA Office
  equalsAny("ruda office", "ruda offices", "ruda office building"),
  MASTER_PLAN_LAND_USE_COLORS.rudaOffice,

  // Convenience Shops
  equalsAny(
    "convenience shop",
    "convenience shops",
    "convenience store",
    "convenience stores",
  ),
  MASTER_PLAN_LAND_USE_COLORS.convenienceShops,

  /*
   * Data categories not separately represented in the supplied legend.
   * These are mapped to the closest matching legend style.
   */
  equalsAny("canal", "water channel"),
  MASTER_PLAN_LAND_USE_COLORS.canal,

  equalsAny("passage", "passages", "walkway", "corridor"),
  MASTER_PLAN_LAND_USE_COLORS.passage,

  equalsAny("utility", "utilities", "utility area", "utility building"),
  MASTER_PLAN_LAND_USE_COLORS.utility,

  // Broad fallbacks for inconsistent source values.
  containsAny("green", "open area", "open space", "park"),
  MASTER_PLAN_LAND_USE_COLORS.greenOpenAreaParks,

  containsAny("condominium", "condo"),
  MASTER_PLAN_LAND_USE_COLORS.condominiums,

  containsAny("mixed use", "mix use"),
  MASTER_PLAN_LAND_USE_COLORS.mixUse,

  containsAny("commercial"),
  MASTER_PLAN_LAND_USE_COLORS.commercial,

  containsAny("public building", "public use"),
  MASTER_PLAN_LAND_USE_COLORS.publicBuilding,

  containsAny("residential"),
  MASTER_PLAN_LAND_USE_COLORS.residential10Marla,

  containsAny("petrol pump", "fuel station"),
  MASTER_PLAN_LAND_USE_COLORS.petrolPump,

  containsAny("mosque", "masjid"),
  MASTER_PLAN_LAND_USE_COLORS.grandMosque,

  containsAny("ruda office"),
  MASTER_PLAN_LAND_USE_COLORS.rudaOffice,

  containsAny("convenience shop", "convenience store"),
  MASTER_PLAN_LAND_USE_COLORS.convenienceShops,

  containsAny("canal"),
  MASTER_PLAN_LAND_USE_COLORS.canal,

  containsAny("passage"),
  MASTER_PLAN_LAND_USE_COLORS.passage,

  containsAny("utility"),
  MASTER_PLAN_LAND_USE_COLORS.utility,

  MASTER_PLAN_LAND_USE_COLORS.fallback,
];

const MASTER_PLAN_LINE_COLOR = [
  "case",
  IS_CB_1_BOUNDARY,
  MASTER_PLAN_LAND_USE_COLORS.cb1Boundary,
  "#111111",
];

const MASTER_PLAN_LINE_WIDTH = [
  "case",
  IS_CB_1_BOUNDARY,
  2.4,
  1,
];

export function addMasterPlanLayer(map, data, color = null) {
  ensureSource(map, SOURCES.masterPlan, data);

  if (!map.getLayer(LAYERS.masterPlanFill)) {
    map.addLayer({
      id: LAYERS.masterPlanFill,
      type: "fill",
      source: SOURCES.masterPlan,
      paint: {
        "fill-color": MASTER_PLAN_FILL_COLOR,
        "fill-opacity": 1,
      },
    });
  } else {
    map.setPaintProperty(
      LAYERS.masterPlanFill,
      "fill-color",
      MASTER_PLAN_FILL_COLOR,
    );
    map.setPaintProperty(
      LAYERS.masterPlanFill,
      "fill-opacity",
      1,
    );
  }

  if (!map.getLayer(LAYERS.masterPlanLine)) {
    map.addLayer({
      id: LAYERS.masterPlanLine,
      type: "line",
      source: SOURCES.masterPlan,
      paint: {
        "line-color": MASTER_PLAN_LINE_COLOR,
        "line-width": MASTER_PLAN_LINE_WIDTH,
      },
    });
  } else {
    map.setPaintProperty(
      LAYERS.masterPlanLine,
      "line-color",
      MASTER_PLAN_LINE_COLOR,
    );
    map.setPaintProperty(
      LAYERS.masterPlanLine,
      "line-width",
      MASTER_PLAN_LINE_WIDTH,
    );
  }

  if (!map.getLayer(LAYERS.masterPlanLabel)) {
    map.addLayer({
      id: LAYERS.masterPlanLabel,
      type: "symbol",
      source: SOURCES.masterPlan,
      minzoom: 16,
      layout: {
        "text-field": [
          "coalesce",
          ["to-string", ["get", "plot_no"]],
          ["to-string", ["get", "name"]],
          "",
        ],
        "text-size": [
          "interpolate",
          ["linear"],
          ["zoom"],
          16,
          10,
          18,
          13,
        ],
        "text-font": [
          "Open Sans Semibold",
          "Arial Unicode MS Bold",
        ],
        "text-allow-overlap": false,
        "text-ignore-placement": false,
      },
      paint: {
        "text-color": color || "#111111",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1.5,
      },
    });
  } else {
    map.setPaintProperty(
      LAYERS.masterPlanLabel,
      "text-color",
      color || "#111111",
    );
  }

  if (!map.getLayer(LAYERS.masterPlanHover)) {
    map.addLayer({
      id: LAYERS.masterPlanHover,
      type: "line",
      source: SOURCES.masterPlan,
      paint: {
        "line-color": "#ffffff",
        "line-width": 4,
        "line-opacity": 0,
      },
      filter: [
        "==",
        ["to-string", ["get", "gid"]],
        "__none__",
      ],
    });
  }
}