const EARTH_RADIUS_M = 6378137;
const SQM_TO_SQFT = 10.76391041671;
const SQFT_PER_ACRE = 43560;

const toRad = (degree) => (Number(degree) * Math.PI) / 180;

const ringAreaSqm = (ring = []) => {
  if (!Array.isArray(ring) || ring.length < 3) return 0;

  let area = 0;
  for (let i = 0; i < ring.length; i += 1) {
    const current = ring[i];
    const next = ring[(i + 1) % ring.length];
    if (!Array.isArray(current) || !Array.isArray(next)) continue;

    const lon1 = toRad(current[0]);
    const lon2 = toRad(next[0]);
    const lat1 = toRad(current[1]);
    const lat2 = toRad(next[1]);

    area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  return Math.abs((area * EARTH_RADIUS_M * EARTH_RADIUS_M) / 2);
};

const polygonAreaSqm = (rings = []) => {
  if (!Array.isArray(rings) || !rings.length) return 0;
  const outer = ringAreaSqm(rings[0]);
  const holes = rings.slice(1).reduce((sum, ring) => sum + ringAreaSqm(ring), 0);
  return Math.max(outer - holes, 0);
};

export const geometryAreaSqft = (geometry) => {
  if (!geometry?.coordinates) return 0;

  if (geometry.type === "Polygon") {
    return polygonAreaSqm(geometry.coordinates) * SQM_TO_SQFT;
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.reduce(
      (sum, polygon) => sum + polygonAreaSqm(polygon),
      0,
    ) * SQM_TO_SQFT;
  }

  return 0;
};

export const readAreaSqft = (feature = {}) => {
  const props = feature.properties || feature || {};
  const candidates = [
    props.area_sqft,
    props.area_sq_ft,
    props.area_sft,
    props.sqft,
    props.shape_area_sqft,
    props.Shape_Area_SqFt,
  ];

  for (const value of candidates) {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) return numeric;
  }

  const acreCandidates = [props.area_acre, props.acres, props.acre];
  for (const value of acreCandidates) {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) return numeric * SQFT_PER_ACRE;
  }

  return geometryAreaSqft(feature.geometry || props.geometry);
};

export const sqftToAcres = (sqft = 0) => Number(sqft || 0) / SQFT_PER_ACRE;
