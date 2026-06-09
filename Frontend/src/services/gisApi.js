/**
 * gisApi.js
 *
 * Frontend API service functions for the backend GIS analysis endpoints.
 * These replace the Turf.js frontend calculations and static GeoJSON files.
 *
 * All functions accept parcel_id (the `gid` integer from the activeParcel)
 * and parcel_type ("khasra" | "murabba").
 */

const BASE = "/api";

async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `API error ${res.status}`);
  }
  return res.json();
}

/**
 * Fetch all active amenities, optionally filtered by category.
 * Returns a GeoJSON FeatureCollection.
 *
 * GET /api/amenities/?category=hospital
 */
export async function fetchAmenities(category = null) {
  const params = category ? `?category=${category}` : "";
  return apiFetch(`${BASE}/amenities/${params}`);
}

/**
 * Fetch all amenity categories at once.
 * Returns { hospitals, schools, parks, mosques, transport } — each a FeatureCollection.
 */
export async function fetchAllAmenities() {
  const categories = ["hospital", "school", "park", "mosque", "transport"];
  const categoryKeyMap = {
    hospital: "hospitals",
    school: "schools",
    park: "parks",
    mosque: "mosques",
    transport: "transport",
  };

  const results = await Promise.all(
    categories.map((cat) => fetchAmenities(cat))
  );

  const amenitiesGeojson = {};
  categories.forEach((cat, i) => {
    amenitiesGeojson[categoryKeyMap[cat]] = results[i];
  });

  return amenitiesGeojson;
}

/**
 * Run nearest facility analysis for a parcel.
 *
 * GET /api/gis-analysis/nearest/?parcel_id=45&parcel_type=khasra
 *
 * Returns:
 * {
 *   parcel_id, parcel_type, centroid,
 *   nearest: {
 *     hospital: { id, name, distance_km, facility: Feature, line: Feature } | null,
 *     school: ..., park: ..., mosque: ..., transport: ...
 *   }
 * }
 */
export async function runNearestFacility(parcelId, parcelType = "khasra") {
  return apiFetch(
    `${BASE}/gis-analysis/nearest/?parcel_id=${parcelId}&parcel_type=${parcelType}`
  );
}

/**
 * Run buffer analysis for a parcel.
 *
 * GET /api/gis-analysis/buffer/?parcel_id=45&parcel_type=khasra&radius=2
 *
 * Returns:
 * {
 *   parcel_id, radius_km, centroid,
 *   buffer: Feature<Polygon>,
 *   counts: { hospital: N, school: N, park: N, mosque: N, transport: N },
 *   amenities: FeatureCollection
 * }
 */
export async function runBufferAnalysis(parcelId, radiusKm, parcelType = "khasra") {
  return apiFetch(
    `${BASE}/gis-analysis/buffer/?parcel_id=${parcelId}&parcel_type=${parcelType}&radius=${radiusKm}`
  );
}

/**
 * Run proximity analysis for a parcel.
 *
 * GET /api/gis-analysis/proximity/?parcel_id=45&parcel_type=khasra&limit=100
 *
 * Returns:
 * {
 *   parcel_id, limit, centroid,
 *   results: [{ id, name, category, distance_km, feature: Feature }, ...]
 * }
 */
export async function runProximityAnalysis(parcelId, parcelType = "khasra", limit = 100) {
  return apiFetch(
    `${BASE}/gis-analysis/proximity/?parcel_id=${parcelId}&parcel_type=${parcelType}&limit=${limit}`
  );
}

/**
 * Run suitability analysis for a parcel.
 *
 * POST /api/gis-analysis/suitability/
 * Body: { parcel_id, parcel_type, weights: { hospital, school, park, transport } }
 *
 * Returns:
 * {
 *   selected_parcel_id, mouza_id, weights,
 *   selected_result: { score, label, category_scores, distances_km },
 *   all_parcel_scores: [...]
 * }
 */
export async function runSuitabilityAnalysis(parcelId, weights, parcelType = "khasra") {
  return apiFetch(`${BASE}/gis-analysis/suitability/`, {
    method: "POST",
    body: JSON.stringify({
      parcel_id: parcelId,
      parcel_type: parcelType,
      weights,
    }),
  });
}
