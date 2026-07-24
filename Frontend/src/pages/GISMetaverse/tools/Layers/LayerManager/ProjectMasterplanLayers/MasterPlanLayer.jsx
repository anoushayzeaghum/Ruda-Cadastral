import { SOURCES, LAYERS, ensureSource } from "../MetaverseLayerConfig";

export const MASTER_PLAN_LAND_USE_COLORS = {
  greenOpenAreaParks: "#159E49",
  condominiums: "#D5ACD2",
  mixUse: "#9D9E31",
  commercial: "#9FD3EB",
  publicBuilding: "#EFA4AA",
  residential10Marla: "#F89A1C",
  residential1Kanal: "#C97800",
  petrolPump: "#E34E52",
  grandMosque: "#F8F07E",
  rudaOffice: "#62D9AA",
  convenienceShops: "#A84FA2",
  cb1Boundary: "#00F51A",

  // Types present in your data but not separately shown in the client legend.
  canal: "#9FD3EB",
  passage: "#F4F4F4",
  utility: "#EFA4AA",
  fallback: "#BFC3C9",
};

const normalizeText = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const firstProperty = (properties = {}, keys = []) => {
  for (const key of keys) {
    const value = properties?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value);
    }
  }
  return "";
};

const classifyMasterPlanFeature = (feature) => {
  const properties = feature?.properties || {};

  const landUse = normalizeText(
    firstProperty(properties, [
      "land_use",
      "landuse",
      "land_use_type",
      "category",
      "type",
      "name",
    ]),
  );

  const residentialDetail = normalizeText(
    [
      properties.plot_area,
      properties.plot_size,
      properties.dimension,
      properties.name,
      properties.category,
      properties.type,
      properties.land_use,
    ]
      .filter(Boolean)
      .join(" "),
  );

  if (
    landUse.includes("cb - 1 boundary") ||
    landUse.includes("cb-1 boundary") ||
    landUse.includes("cb 1 boundary") ||
    landUse.includes("cb1 boundary")
  ) {
    return "cb1Boundary";
  }

  if (
    landUse === "green area" ||
    landUse === "green areas" ||
    landUse === "green" ||
    landUse === "open area" ||
    landUse === "open areas" ||
    landUse === "open space" ||
    landUse === "open spaces" ||
    landUse === "park" ||
    landUse === "parks"
  ) {
    return "greenOpenAreaParks";
  }

  if (
    landUse.includes("condominium") ||
    landUse.includes("condo")
  ) {
    return "condominiums";
  }

  if (
    landUse.includes("mix use") ||
    landUse.includes("mixed use") ||
    landUse.includes("mix-use") ||
    landUse.includes("mixed-use")
  ) {
    return "mixUse";
  }

  if (landUse.includes("commercial")) {
    return "commercial";
  }

  if (
    landUse.includes("public building") ||
    landUse.includes("public use") ||
    landUse.includes("public facility")
  ) {
    return "publicBuilding";
  }

  if (landUse.includes("residential")) {
    if (
      residentialDetail.includes("1 kanal") ||
      residentialDetail.includes("1-kanal") ||
      residentialDetail.includes("1kanal")
    ) {
      return "residential1Kanal";
    }

    return "residential10Marla";
  }

  if (
    landUse.includes("petrol pump") ||
    landUse.includes("fuel station") ||
    landUse.includes("filling station")
  ) {
    return "petrolPump";
  }

  if (
    landUse.includes("grand mosque") ||
    landUse.includes("mosque") ||
    landUse.includes("masjid")
  ) {
    return "grandMosque";
  }

  if (landUse.includes("ruda office")) {
    return "rudaOffice";
  }

  if (
    landUse.includes("convenience shop") ||
    landUse.includes("convenience store")
  ) {
    return "convenienceShops";
  }

  if (landUse.includes("canal") || landUse.includes("water channel")) {
    return "canal";
  }

  if (
    landUse.includes("passage") ||
    landUse.includes("walkway") ||
    landUse.includes("corridor")
  ) {
    return "passage";
  }

  if (landUse.includes("utility")) {
    return "utility";
  }

  return "fallback";
};

const prepareMasterPlanGeoJSON = (data) => ({
  ...(data || { type: "FeatureCollection", features: [] }),
  features: (data?.features || []).map((feature) => {
    const masterPlanClass = classifyMasterPlanFeature(feature);

    return {
      ...feature,
      properties: {
        ...(feature.properties || {}),
        _masterplan_class: masterPlanClass,
        _masterplan_color:
          MASTER_PLAN_LAND_USE_COLORS[masterPlanClass] ||
          MASTER_PLAN_LAND_USE_COLORS.fallback,
      },
    };
  }),
});

const MASTER_PLAN_FILL_COLOR = [
  "match",
  ["get", "_masterplan_class"],
  "greenOpenAreaParks",
  MASTER_PLAN_LAND_USE_COLORS.greenOpenAreaParks,
  "condominiums",
  MASTER_PLAN_LAND_USE_COLORS.condominiums,
  "mixUse",
  MASTER_PLAN_LAND_USE_COLORS.mixUse,
  "commercial",
  MASTER_PLAN_LAND_USE_COLORS.commercial,
  "publicBuilding",
  MASTER_PLAN_LAND_USE_COLORS.publicBuilding,
  "residential10Marla",
  MASTER_PLAN_LAND_USE_COLORS.residential10Marla,
  "residential1Kanal",
  MASTER_PLAN_LAND_USE_COLORS.residential1Kanal,
  "petrolPump",
  MASTER_PLAN_LAND_USE_COLORS.petrolPump,
  "grandMosque",
  MASTER_PLAN_LAND_USE_COLORS.grandMosque,
  "rudaOffice",
  MASTER_PLAN_LAND_USE_COLORS.rudaOffice,
  "convenienceShops",
  MASTER_PLAN_LAND_USE_COLORS.convenienceShops,
  "canal",
  MASTER_PLAN_LAND_USE_COLORS.canal,
  "passage",
  MASTER_PLAN_LAND_USE_COLORS.passage,
  "utility",
  MASTER_PLAN_LAND_USE_COLORS.utility,
  "cb1Boundary",
  "rgba(0,0,0,0)",
  MASTER_PLAN_LAND_USE_COLORS.fallback,
];

const MASTER_PLAN_LINE_COLOR = [
  "case",
  ["==", ["get", "_masterplan_class"], "cb1Boundary"],
  MASTER_PLAN_LAND_USE_COLORS.cb1Boundary,
  "#111111",
];

const MASTER_PLAN_LINE_WIDTH = [
  "case",
  ["==", ["get", "_masterplan_class"], "cb1Boundary"],
  2.5,
  1.1,
];

export function addMasterPlanLayer(map, data, color = null) {
  const preparedData = prepareMasterPlanGeoJSON(data);
  ensureSource(map, SOURCES.masterPlan, preparedData);

  const source = map.getSource(SOURCES.masterPlan);
  source?.setData?.(preparedData);

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
        "line-opacity": 1,
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
    map.setPaintProperty(LAYERS.masterPlanLine, "line-opacity", 1);
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
