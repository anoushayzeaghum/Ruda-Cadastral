import { SOURCES, LAYERS, ensureSource } from "../MetaverseLayerConfig";

const LAND_USE_VALUE = [
  "downcase",
  [
    "to-string",
    [
      "coalesce",
      ["get", "type"],
      ["get", "land_use"],
      ["get", "landuse"],
      ["get", "land_use_type"],
      ["get", "category"],
      ["get", "name"],
      "",
    ],
  ],
];

const containsAny = (...values) => [
  "any",
  ...values.map((value) => [
    ">=",
    ["index-of", value.toLowerCase(), LAND_USE_VALUE],
    0,
  ]),
];

const IS_CB_1_BOUNDARY = containsAny(
  "cb - 1 boundary",
  "cb-1 boundary",
  "cb 1 boundary",
  "cb1 boundary",
);

// Colors sampled directly from the supplied legend image.
export const MASTER_PLAN_LAND_USE_COLORS = {
  greenOpenAreaParks: "#139B48",
  condominiums: "#DDB3D4",
  mixUse: "#999B37",
  commercial: "#ADDDF7",
  publicBuilding: "#F7ABAE",
  residential10Marla: "#F8991E",
  residential1Kanal: "#C17006",
  petrolPump: "#E05254",
  grandMosque: "#F7F281",
  rudaOffice: "#6AE7B1",
  convenienceShops: "#A953A0",
  cb1Boundary: "#00FF00",
  fallback: "#9CA3AF",
};

const MASTER_PLAN_FILL_COLOR = [
  "case",

  // CB-1 is a boundary only, so no polygon fill is applied.
  IS_CB_1_BOUNDARY,
  "rgba(0, 0, 0, 0)",

  // Green / Open Area / Parks
  containsAny("green", "open area", "open space", "park"),
  MASTER_PLAN_LAND_USE_COLORS.greenOpenAreaParks,

  // Condominiums
  containsAny("condominium", "condominiums", "condo"),
  MASTER_PLAN_LAND_USE_COLORS.condominiums,

  // Mix Use / Mixed Use
  containsAny("mix use", "mixed use", "mix-use", "mixed-use"),
  MASTER_PLAN_LAND_USE_COLORS.mixUse,

  // Commercial
  containsAny("commercial"),
  MASTER_PLAN_LAND_USE_COLORS.commercial,

  // Public Building
  containsAny("public building", "public buildings"),
  MASTER_PLAN_LAND_USE_COLORS.publicBuilding,

  // Residential (10 Marla Plots)
  [
    "all",
    containsAny("residential"),
    containsAny("10 marla", "10-marla", "10marla"),
  ],
  MASTER_PLAN_LAND_USE_COLORS.residential10Marla,

  // Residential (1 Kanal Plots)
  [
    "all",
    containsAny("residential"),
    containsAny("1 kanal", "1-kanal", "1kanal"),
  ],
  MASTER_PLAN_LAND_USE_COLORS.residential1Kanal,

  // Petrol Pump
  containsAny("petrol pump", "fuel station", "filling station"),
  MASTER_PLAN_LAND_USE_COLORS.petrolPump,

  // Grand Mosque
  containsAny("grand mosque", "jamia mosque", "mosque", "masjid"),
  MASTER_PLAN_LAND_USE_COLORS.grandMosque,

  // RUDA Office
  containsAny("ruda office", "ruda offices"),
  MASTER_PLAN_LAND_USE_COLORS.rudaOffice,

  // Convenience Shops
  containsAny(
    "convenience shop",
    "convenience shops",
    "convenience store",
    "convenience stores",
  ),
  MASTER_PLAN_LAND_USE_COLORS.convenienceShops,

  // Generic residential fallback when plot size is not present.
  containsAny("residential"),
  MASTER_PLAN_LAND_USE_COLORS.residential10Marla,

  // Unknown or uncategorized land use.
  MASTER_PLAN_LAND_USE_COLORS.fallback,
];

const MASTER_PLAN_LINE_COLOR = [
  "case",
  IS_CB_1_BOUNDARY,
  MASTER_PLAN_LAND_USE_COLORS.cb1Boundary,
  "#111111",
];

const MASTER_PLAN_LINE_WIDTH = ["case", IS_CB_1_BOUNDARY, 2, 1.15];

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
    map.setPaintProperty(LAYERS.masterPlanFill, "fill-opacity", 1);
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
        "text-size": ["interpolate", ["linear"], ["zoom"], 16, 10, 18, 13],
        "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
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
      filter: ["==", ["to-string", ["get", "gid"]], "__none__"],
    });
  }
}
