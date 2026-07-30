import * as turf from "@turf/turf";

const ACRES_PER_SQUARE_METRE = 1 / 4046.8564224;

const firstValue = (...values) =>
  values.find((value) => value !== undefined && value !== null && String(value).trim() !== "");

const getKhasraNumber = (properties = {}) =>
  firstValue(
    properties.kh,
    properties.KH,
    properties.k,
    properties.K,
    properties.khasra,
    properties.khasra_no,
    properties.khasra_id,
    properties.join_shp,
  ) ?? "N/A";

const getMauzaName = (properties = {}) =>
  firstValue(
    properties.mauza_name,
    properties.mauza,
    properties.Mauza,
    properties.moza,
    properties.mouza,
    properties.mauza_text,
  ) ?? "N/A";

const getTehsilName = (properties = {}) =>
  firstValue(
    properties.tehsil_name,
    properties.tehsil,
    properties.Tehsil,
    properties.tehsil_text,
  ) ?? "N/A";

const getDistrictName = (properties = {}) =>
  firstValue(
    properties.district_name,
    properties.district,
    properties.District,
    properties.district_text,
  ) ?? "N/A";

const featureKey = (feature = {}, index = 0) => {
  const props = feature.properties || {};
  return String(
    feature.id ?? props.gid ?? props.id ?? props.khasra_id ?? `${getMauzaName(props)}:${getKhasraNumber(props)}:${index}`,
  );
};

const safeIntersection = (a, b) => {
  try {
    return turf.intersect(turf.featureCollection([a, b]));
  } catch {
    try {
      return turf.intersect(a, b);
    } catch {
      return null;
    }
  }
};

const clippedAreaSquareMetres = (feature, aoi) => {
  if (!feature?.geometry) return 0;
  try {
    if (!turf.booleanIntersects(feature, aoi)) return 0;
    const clipped = safeIntersection(feature, aoi);
    return clipped ? turf.area(clipped) : 0;
  } catch {
    return 0;
  }
};

const normalizeCategory = (sourceKey, properties = {}) => {
  if (sourceKey === "awardedLand") return "Awarded Land";
  if (sourceKey === "stateLand") return "State Land";

  const raw = String(
    firstValue(
      properties.possession_type,
      properties.land_status,
      properties.status,
      properties.category,
      properties.type,
      properties.land_type,
    ) ?? "Possession Land",
  ).trim().toLowerCase();

  if (raw.includes("mutat")) return "Mutated Land";
  if (raw.includes("demarcat")) return "Demarcated Land";
  if (raw.includes("state")) return "State Land";
  if (raw.includes("award")) return "Awarded Land";
  if (raw.includes("possession")) return "Possession Land";
  return raw ? raw.replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Other Land";
};

export const analyseAOI = ({ aoi, khasras, thematicLayers = {} }) => {
  if (!aoi?.geometry) return null;

  const totalAreaSquareMetres = turf.area(aoi);
  const totalAreaAcres = totalAreaSquareMetres * ACRES_PER_SQUARE_METRE;
  const intersectingKhasras = [];

  (khasras?.features || []).forEach((feature, index) => {
    const areaSquareMetres = clippedAreaSquareMetres(feature, aoi);
    if (areaSquareMetres <= 0) return;
    const properties = feature.properties || {};
    intersectingKhasras.push({
      key: featureKey(feature, index),
      feature,
      khasraNumber: String(getKhasraNumber(properties)),
      mauza: String(getMauzaName(properties)),
      tehsil: String(getTehsilName(properties)),
      district: String(getDistrictName(properties)),
      areaSquareMetres,
      areaAcres: areaSquareMetres * ACRES_PER_SQUARE_METRE,
    });
  });

  const categoryMap = new Map();
  Object.entries(thematicLayers).forEach(([sourceKey, collection]) => {
    (collection?.features || []).forEach((feature) => {
      const areaSquareMetres = clippedAreaSquareMetres(feature, aoi);
      if (areaSquareMetres <= 0) return;
      const category = normalizeCategory(sourceKey, feature.properties || {});
      const current = categoryMap.get(category) || {
        category,
        khasraKeys: new Set(),
        featureCount: 0,
        areaSquareMetres: 0,
      };
      current.featureCount += 1;
      current.areaSquareMetres += areaSquareMetres;
      current.khasraKeys.add(String(getKhasraNumber(feature.properties || {})));
      categoryMap.set(category, current);
    });
  });

  const categories = Array.from(categoryMap.values())
    .map((item) => ({
      category: item.category,
      khasraCount: Array.from(item.khasraKeys).filter((value) => value && value !== "N/A").length || item.featureCount,
      areaSquareMetres: item.areaSquareMetres,
      areaAcres: item.areaSquareMetres * ACRES_PER_SQUARE_METRE,
      percentage: totalAreaSquareMetres > 0 ? (item.areaSquareMetres / totalAreaSquareMetres) * 100 : 0,
    }))
    .sort((a, b) => b.areaSquareMetres - a.areaSquareMetres);

  const unique = (values) => Array.from(new Set(values.filter((value) => value && value !== "N/A"))).sort();

  return {
    totalAreaSquareMetres,
    totalAreaAcres,
    totalAreaHectares: totalAreaSquareMetres / 10000,
    khasraCount: intersectingKhasras.length,
    khasraNumbers: unique(intersectingKhasras.map((item) => item.khasraNumber)),
    mauzaCount: unique(intersectingKhasras.map((item) => item.mauza)).length,
    mauzaNames: unique(intersectingKhasras.map((item) => item.mauza)),
    tehsilNames: unique(intersectingKhasras.map((item) => item.tehsil)),
    districtNames: unique(intersectingKhasras.map((item) => item.district)),
    categories,
    details: intersectingKhasras,
  };
};
