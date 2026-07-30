import * as turf from "@turf/turf";

const ACRES_PER_SQUARE_METRE = 1 / 4046.8564224;
const MIN_INTERSECTION_SQUARE_METRES = 2;
const MIN_FEATURE_OVERLAP_RATIO = 0.001;

const firstValue = (...values) =>
  values.find(
    (value) =>
      value !== undefined && value !== null && String(value).trim() !== "",
  );

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
    feature.id ??
      props.gid ??
      props.id ??
      props.khasra_id ??
      `${getMauzaName(props)}:${getKhasraNumber(props)}:${index}`,
  );
};

const safeArea = (feature) => {
  try {
    return feature?.geometry ? turf.area(feature) : 0;
  } catch {
    return 0;
  }
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

const getMeaningfulIntersection = (feature, aoi) => {
  if (!feature?.geometry || !aoi?.geometry) return null;

  try {
    if (!turf.booleanIntersects(feature, aoi)) return null;

    const clipped = safeIntersection(feature, aoi);
    if (!clipped?.geometry) return null;

    const intersectionAreaSquareMetres = safeArea(clipped);
    const featureAreaSquareMetres = safeArea(feature);
    const featureOverlapRatio =
      featureAreaSquareMetres > 0
        ? intersectionAreaSquareMetres / featureAreaSquareMetres
        : 0;

    // A parcel that only touches the AOI boundary can produce a very small
    // numerical sliver. Ignore that sliver, but keep genuine partial parcels.
    if (
      intersectionAreaSquareMetres < MIN_INTERSECTION_SQUARE_METRES ||
      (featureAreaSquareMetres > 0 &&
        featureOverlapRatio < MIN_FEATURE_OVERLAP_RATIO)
    ) {
      return null;
    }

    return {
      clipped,
      intersectionAreaSquareMetres,
      featureAreaSquareMetres,
      featureOverlapRatio,
    };
  } catch {
    return null;
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
  )
    .trim()
    .toLowerCase();

  if (raw.includes("mutat")) return "Mutated Land";
  if (raw.includes("demarcat")) return "Demarcated Land";
  if (raw.includes("state")) return "State Land";
  if (raw.includes("award")) return "Awarded Land";
  if (raw.includes("possession")) return "Possession Land";
  return raw
    ? raw.replace(/\b\w/g, (letter) => letter.toUpperCase())
    : "Other Land";
};

const unique = (values) =>
  Array.from(new Set(values.filter((value) => value && value !== "N/A"))).sort(
    (a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }),
  );

export const analyseAOI = ({ aoi, khasras, thematicLayers = {} }) => {
  if (!aoi?.geometry) return null;

  const totalAreaSquareMetres = safeArea(aoi);
  const totalAreaAcres = totalAreaSquareMetres * ACRES_PER_SQUARE_METRE;
  const intersectingKhasras = [];

  (khasras?.features || []).forEach((feature, index) => {
    const intersection = getMeaningfulIntersection(feature, aoi);
    if (!intersection) return;

    const properties = feature.properties || {};
    intersectingKhasras.push({
      key: featureKey(feature, index),
      feature,
      khasraNumber: String(getKhasraNumber(properties)),
      mauza: String(getMauzaName(properties)),
      tehsil: String(getTehsilName(properties)),
      district: String(getDistrictName(properties)),
      areaSquareMetres: intersection.intersectionAreaSquareMetres,
      areaAcres:
        intersection.intersectionAreaSquareMetres * ACRES_PER_SQUARE_METRE,
      overlapPercentage: intersection.featureOverlapRatio * 100,
    });
  });

  const categoryMap = new Map();
  const possessionDetails = [];

  Object.entries(thematicLayers).forEach(([sourceKey, collection]) => {
    (collection?.features || []).forEach((feature, index) => {
      const intersection = getMeaningfulIntersection(feature, aoi);
      if (!intersection) return;

      const properties = feature.properties || {};
      const category = normalizeCategory(sourceKey, properties);
      const khasraNumber = String(getKhasraNumber(properties));
      const detail = {
        key: `${sourceKey}:${featureKey(feature, index)}`,
        sourceKey,
        category,
        khasraNumber,
        mauza: String(getMauzaName(properties)),
        tehsil: String(getTehsilName(properties)),
        district: String(getDistrictName(properties)),
        areaSquareMetres: intersection.intersectionAreaSquareMetres,
        areaAcres:
          intersection.intersectionAreaSquareMetres * ACRES_PER_SQUARE_METRE,
        percentage:
          totalAreaSquareMetres > 0
            ? (intersection.intersectionAreaSquareMetres /
                totalAreaSquareMetres) *
              100
            : 0,
        properties,
      };

      possessionDetails.push(detail);

      const current = categoryMap.get(category) || {
        category,
        khasraKeys: new Set(),
        featureCount: 0,
        areaSquareMetres: 0,
      };
      current.featureCount += 1;
      current.areaSquareMetres += intersection.intersectionAreaSquareMetres;
      if (khasraNumber && khasraNumber !== "N/A") {
        current.khasraKeys.add(khasraNumber);
      }
      categoryMap.set(category, current);
    });
  });

  const categories = Array.from(categoryMap.values())
    .map((item) => ({
      category: item.category,
      khasraCount: item.khasraKeys.size || item.featureCount,
      areaSquareMetres: item.areaSquareMetres,
      areaAcres: item.areaSquareMetres * ACRES_PER_SQUARE_METRE,
      percentage:
        totalAreaSquareMetres > 0
          ? (item.areaSquareMetres / totalAreaSquareMetres) * 100
          : 0,
    }))
    .sort((a, b) => b.areaSquareMetres - a.areaSquareMetres);

  possessionDetails.sort((a, b) => {
    const categoryCompare = a.category.localeCompare(b.category);
    if (categoryCompare !== 0) return categoryCompare;
    return String(a.khasraNumber).localeCompare(
      String(b.khasraNumber),
      undefined,
      {
        numeric: true,
      },
    );
  });

  const khasraNumbers = unique(
    intersectingKhasras.map((item) => item.khasraNumber),
  );

  return {
    totalAreaSquareMetres,
    totalAreaAcres,
    totalAreaHectares: totalAreaSquareMetres / 10000,
    khasraCount: khasraNumbers.length,
    khasraNumbers,
    mauzaCount: unique(intersectingKhasras.map((item) => item.mauza)).length,
    mauzaNames: unique(intersectingKhasras.map((item) => item.mauza)),
    tehsilNames: unique(intersectingKhasras.map((item) => item.tehsil)),
    districtNames: unique(intersectingKhasras.map((item) => item.district)),
    categories,
    possessionDetails,
    details: intersectingKhasras,
  };
};
