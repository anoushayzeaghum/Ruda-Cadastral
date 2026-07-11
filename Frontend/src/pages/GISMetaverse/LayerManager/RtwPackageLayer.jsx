import { SOURCES, LAYERS } from "./MetaverseLayerConfig";
import { addImportedPolygonLayer } from "./_importedPolygonLayerFactory";

const RTW_PACKAGE_COLORS = [
  "#f59e0b",
  "#ef4444",
  "#22c55e",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
  "#14b8a6",
  "#eab308",
  "#f97316",
  "#84cc16",
  "#06b6d4",
  "#8b5cf6",
];

const normalizeText = (value) =>
  value === null || value === undefined ? "" : String(value).trim();

const getPackageCategory = (properties = {}) =>
  normalizeText(
    properties.package ??
    properties.name ??
    properties.ruda_phase ??
    properties.phase ??
    properties.package_name,
  ) || "Other";

const buildCategorizedGeoJSON = (data) => {
  const featureCollection =
    data?.type === "FeatureCollection"
      ? data
      : {
        type: "FeatureCollection",
        features: Array.isArray(data?.features)
          ? data.features
          : Array.isArray(data)
            ? data
            : [],
      };

  const categories = [
    ...new Set(
      featureCollection.features.map((feature) =>
        getPackageCategory(feature?.properties),
      ),
    ),
  ].sort((a, b) => a.localeCompare(b));

  const categoryColors = categories.reduce((result, category, index) => {
    result[category] = RTW_PACKAGE_COLORS[index % RTW_PACKAGE_COLORS.length];
    return result;
  }, {});

  return {
    type: "FeatureCollection",
    features: featureCollection.features.map((feature) => {
      const category = getPackageCategory(feature?.properties);

      return {
        ...feature,
        properties: {
          ...(feature?.properties || {}),
          __rtwPackageCategory: category,
          __rtwPackageColor: categoryColors[category] || "#f59e0b",
        },
      };
    }),
  };
};

export function addRtwPackageLayer(
  map,
  data,
  color = "#f59e0b",
  opacity = 1,
) {
  const categorizedData = buildCategorizedGeoJSON(data);

  addImportedPolygonLayer({
    map,
    data: categorizedData,
    sourceId: SOURCES.rtwPackage,
    fillLayerId: LAYERS.rtwPackageFill,
    lineLayerId: LAYERS.rtwPackageLine,
    labelLayerId: LAYERS.rtwPackageLabel,

    // Every RTW package gets a different color on the map.
    // The original color remains the fallback.
    color: ["coalesce", ["get", "__rtwPackageColor"], color],

    opacity,
    labelFields: [
      "__rtwPackageCategory",
      "package",
      "name",
      "ruda_phase",
    ],
    lineWidth: 1.8,
  });
}