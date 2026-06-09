import * as turf from "@turf/turf";

/**
 * Computes a buffer polygon around the given centroid and filters amenities
 * that fall within the buffer.
 *
 * @param {GeoJSON.Point} centroid - { type: "Point", coordinates: [lng, lat] }
 * @param {number} radiusKm - Buffer radius in kilometres
 * @param {AmenitiesByCategory} amenitiesGeojson - Amenity FeatureCollections keyed by category
 * @returns {BufferResults} - { polygon, counts, amenitiesInBuffer }
 */
export function computeBuffer(centroid, radiusKm, amenitiesGeojson) {
  const centroidFeature = { type: "Feature", geometry: centroid, properties: {} };
  const polygon = turf.buffer(centroidFeature, radiusKm, { units: "kilometers" });

  const amenitiesInBuffer = {};
  const counts = {};

  for (const [category, fc] of Object.entries(amenitiesGeojson)) {
    const inside = (fc.features || []).filter((f) =>
      turf.booleanPointInPolygon(f, polygon)
    );
    amenitiesInBuffer[category] = { type: "FeatureCollection", features: inside };
    counts[category] = inside.length;
  }

  return { polygon, counts, amenitiesInBuffer };
}

/**
 * Computes straight-line distances from centroid to all amenities, grouped
 * and sorted ascending by distance within each category.
 *
 * @param {GeoJSON.Point} centroid - { type: "Point", coordinates: [lng, lat] }
 * @param {AmenitiesByCategory} amenitiesGeojson - Amenity FeatureCollections keyed by category
 * @returns {ProximityResult[]} - Sorted ascending by distance within each category
 */
export function computeProximity(centroid, amenitiesGeojson) {
  const centroidFeature = { type: "Feature", geometry: centroid, properties: {} };
  const results = [];

  for (const [category, fc] of Object.entries(amenitiesGeojson)) {
    const categoryResults = (fc.features || []).map((f) => ({
      category,
      name: f.properties?.name ?? f.properties?.amenity ?? "Unnamed",
      distance:
        Math.round(
          turf.distance(centroidFeature, f, { units: "kilometers" }) * 1000
        ) / 1000,
      feature: f,
    }));

    categoryResults.sort((a, b) => a.distance - b.distance);
    results.push(...categoryResults);
  }

  return results;
}

/**
 * Finds the single nearest amenity feature per category and builds a
 * LineString from the centroid to that feature.
 *
 * @param {GeoJSON.Point} centroid - { type: "Point", coordinates: [lng, lat] }
 * @param {AmenitiesByCategory} amenitiesGeojson - Amenity FeatureCollections keyed by category
 * @returns {NearestResults} - Keyed by category; each entry has name, distance, feature, lineString
 */
export function findNearest(centroid, amenitiesGeojson) {
  const centroidFeature = { type: "Feature", geometry: centroid, properties: {} };
  const results = {};

  for (const [category, fc] of Object.entries(amenitiesGeojson)) {
    const features = fc.features || [];
    if (!features.length) continue;

    let minDist = Infinity;
    let nearest = null;

    for (const f of features) {
      const d = turf.distance(centroidFeature, f, { units: "kilometers" });
      if (d < minDist) {
        minDist = d;
        nearest = f;
      }
    }

    if (nearest) {
      results[category] = {
        name: nearest.properties?.name ?? "Unnamed",
        distance: Math.round(minDist * 1000) / 1000,
        feature: nearest,
        lineString: {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [
              centroid.coordinates,
              nearest.geometry.coordinates,
            ],
          },
          properties: { category },
        },
      };
    }
  }

  return results;
}

/**
 * Computes a weighted suitability score (0–100) based on proximity to amenities.
 *
 * Normalisation formula: normalizedScore(distance) = 100 / (1 + distance)
 * Final score: Σ(normalizedScore(nearest[category].distance) × weight[category])
 *
 * Labels: score ≥ 75 → "Excellent", score ≥ 50 → "Good", otherwise → "Poor"
 *
 * @param {GeoJSON.Point} centroid - { type: "Point", coordinates: [lng, lat] }
 * @param {AmenitiesByCategory} amenitiesGeojson - Amenity FeatureCollections keyed by category
 * @param {SuitabilityWeights} weights - Must sum to 1.0
 * @returns {{ score: number, label: string, categoryScores: object } | { error: string }}
 */
export function computeSuitability(centroid, amenitiesGeojson, weights) {
  // Validate that weights sum to 1.0 (within floating-point tolerance)
  const weightSum = Object.values(weights).reduce((a, b) => a + b, 0);
  if (Math.abs(weightSum - 1.0) > 0.001) {
    return {
      error: `Weights must sum to 1.0 (currently ${weightSum.toFixed(3)})`,
    };
  }

  const nearest = findNearest(centroid, amenitiesGeojson);
  const categoryScores = {};

  let score = 0;
  for (const [category, weight] of Object.entries(weights)) {
    const distance = nearest[category]?.distance ?? Infinity;
    const categoryScore = 100 / (1 + distance);
    categoryScores[category] = Math.round(categoryScore * 10) / 10;
    score += categoryScore * weight;
  }

  score = Math.round(score * 10) / 10;

  const label =
    score >= 75 ? "Excellent" :
    score >= 50 ? "Good" :
    "Poor";

  return { score, label, categoryScores };
}
