"""
PostGIS-backed GIS analysis services.

All four analysis types:
  - run_nearest_facility_analysis(parcel_id, parcel_type)
  - run_buffer_analysis(parcel_id, parcel_type, radius_km)
  - run_proximity_analysis(parcel_id, parcel_type, limit)
  - run_suitability_analysis(parcel_id, parcel_type, weights)

parcel_type: "khasra" | "murabba"
"""

from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.geos import LineString
from django.contrib.gis.measure import D

from amenities.models import Amenity
from api.models import Khasra, Murabba
from .utils import geom_to_geojson, make_feature

FACILITY_CATEGORIES = ["hospital", "school", "park", "mosque", "transport"]
SUITABILITY_CATEGORIES = ["hospital", "school", "park", "transport"]


def _get_parcel(parcel_id, parcel_type):
    """Return the parcel model instance and its centroid Point."""
    if parcel_type == "murabba":
        parcel = Murabba.objects.get(gid=parcel_id)
    else:
        parcel = Khasra.objects.get(gid=parcel_id)
    centroid = parcel.geom.centroid
    return parcel, centroid


def _nearest_distance_for_category(point, category):
    """Return distance in km to nearest active amenity in the given category."""
    nearest = (
        Amenity.objects
        .filter(category=category, is_active=True)
        .annotate(distance=Distance("geom", point))
        .order_by("distance")
        .first()
    )
    if not nearest:
        return None
    return nearest.distance.m / 1000


# ---------------------------------------------------------------------------
# NEAREST FACILITY
# ---------------------------------------------------------------------------

def run_nearest_facility_analysis(parcel_id, parcel_type="khasra"):
    """
    For each facility category, find the single closest amenity to the
    parcel centroid. Returns GeoJSON points, connecting lines, and distances.
    """
    parcel, centroid = _get_parcel(parcel_id, parcel_type)

    results = {}
    for category in FACILITY_CATEGORIES:
        nearest = (
            Amenity.objects
            .filter(category=category, is_active=True)
            .annotate(distance=Distance("geom", centroid))
            .order_by("distance")
            .first()
        )

        if not nearest:
            results[category] = None
            continue

        distance_km = round(nearest.distance.m / 1000, 3)

        line = LineString(centroid.coords, nearest.geom.coords, srid=4326)

        results[category] = {
            "id": nearest.id,
            "name": nearest.name,
            "category": nearest.category,
            "distance_km": distance_km,
            "facility": make_feature(
                geom_to_geojson(nearest.geom),
                {
                    "id": nearest.id,
                    "name": nearest.name,
                    "category": nearest.category,
                    "distance_km": distance_km,
                },
            ),
            "line": make_feature(
                geom_to_geojson(line),
                {"category": category, "distance_km": distance_km},
            ),
        }

    return {
        "parcel_id": parcel_id,
        "parcel_type": parcel_type,
        "centroid": make_feature(
            geom_to_geojson(centroid),
            {"parcel_id": parcel_id},
        ),
        "nearest": results,
    }


# ---------------------------------------------------------------------------
# BUFFER ANALYSIS
# ---------------------------------------------------------------------------

def run_buffer_analysis(parcel_id, parcel_type="khasra", radius_km=1.0):
    """
    Find all active amenities within radius_km of the parcel centroid.
    Returns counts per category, GeoJSON amenity points, and a buffer polygon.
    The buffer polygon is computed in Web Mercator (SRID 3857) for metric
    accuracy, then re-projected back to WGS84 (SRID 4326) for the response.
    """
    parcel, centroid = _get_parcel(parcel_id, parcel_type)

    amenities = (
        Amenity.objects
        .filter(is_active=True, geom__distance_lte=(centroid, D(km=radius_km)))
        .annotate(distance=Distance("geom", centroid))
        .order_by("distance")
    )

    counts = {cat: 0 for cat in FACILITY_CATEGORIES}
    features = []

    for amenity in amenities:
        if amenity.category in counts:
            counts[amenity.category] += 1
        distance_km = round(amenity.distance.m / 1000, 3)
        features.append(
            make_feature(
                geom_to_geojson(amenity.geom),
                {
                    "id": amenity.id,
                    "name": amenity.name,
                    "category": amenity.category,
                    "distance_km": distance_km,
                    "source": amenity.source,
                },
            )
        )

    # Build buffer polygon: project to 3857 for metre-accurate circle,
    # buffer by radius in metres, then reproject to 4326 for GeoJSON output.
    centroid_3857 = centroid.clone()
    centroid_3857.transform(3857)
    buffer_3857 = centroid_3857.buffer(radius_km * 1000)
    buffer_3857.transform(4326)

    return {
        "parcel_id": parcel_id,
        "parcel_type": parcel_type,
        "radius_km": radius_km,
        "centroid": make_feature(geom_to_geojson(centroid), {"parcel_id": parcel_id}),
        "buffer": make_feature(
            geom_to_geojson(buffer_3857),
            {"radius_km": radius_km},
        ),
        "counts": counts,
        "amenities": {"type": "FeatureCollection", "features": features},
    }


# ---------------------------------------------------------------------------
# PROXIMITY ANALYSIS
# ---------------------------------------------------------------------------

def run_proximity_analysis(parcel_id, parcel_type="khasra", limit=100):
    """
    Return all active amenities sorted by straight-line distance from the
    parcel centroid, nearest first, up to `limit` results.
    """
    parcel, centroid = _get_parcel(parcel_id, parcel_type)

    amenities = (
        Amenity.objects
        .filter(is_active=True)
        .annotate(distance=Distance("geom", centroid))
        .order_by("distance")[:limit]
    )

    results = []
    for amenity in amenities:
        distance_km = round(amenity.distance.m / 1000, 3)
        results.append({
            "id": amenity.id,
            "name": amenity.name,
            "category": amenity.category,
            "source": amenity.source,
            "source_id": amenity.source_id,
            "distance_km": distance_km,
            "feature": make_feature(
                geom_to_geojson(amenity.geom),
                {
                    "id": amenity.id,
                    "name": amenity.name,
                    "category": amenity.category,
                    "distance_km": distance_km,
                },
            ),
        })

    return {
        "parcel_id": parcel_id,
        "parcel_type": parcel_type,
        "limit": limit,
        "centroid": make_feature(geom_to_geojson(centroid), {"parcel_id": parcel_id}),
        "results": results,
    }


# ---------------------------------------------------------------------------
# SUITABILITY ANALYSIS
# ---------------------------------------------------------------------------

def validate_weights(weights):
    required = set(SUITABILITY_CATEGORIES)
    provided = set(str(k) for k in weights.keys())
    if provided != required:
        raise ValueError(
            f"Weights must include exactly: {', '.join(sorted(required))}. "
            f"Received: {', '.join(sorted(provided))}."
        )
    weight_sum = sum(float(v) for v in weights.values())
    if abs(weight_sum - 1.0) > 0.001:
        raise ValueError(
            f"Weights must sum to 1.0. Current sum is {weight_sum:.3f}."
        )


def run_suitability_analysis(parcel_id, parcel_type="khasra", weights=None):
    """
    Score the selected parcel's suitability relative to all other parcels
    in the same Mouza.

    Normalization formula (per category, across mouza):
        score = 100 * (max_dist - this_dist) / (max_dist - min_dist)

    A parcel closest to a facility gets 100; furthest gets 0.
    Final score = weighted sum of category scores.
    Labels: >= 75 = Excellent, >= 50 = Good, < 50 = Poor.
    """
    if weights is None:
        weights = {cat: 0.25 for cat in SUITABILITY_CATEGORIES}

    validate_weights(weights)

    parcel, _ = _get_parcel(parcel_id, parcel_type)

    # Get all parcels in the same mouza for normalization
    mouza_id = parcel.mouza_id
    if parcel_type == "murabba":
        sibling_parcels = list(Murabba.objects.filter(mouza_id=mouza_id))
    else:
        sibling_parcels = list(Khasra.objects.filter(mouza_id=mouza_id))

    # Compute nearest distance per category for every sibling parcel
    parcel_distance_data = []
    for p in sibling_parcels:
        centroid = p.geom.centroid
        distances = {}
        for category in SUITABILITY_CATEGORIES:
            distances[category] = _nearest_distance_for_category(centroid, category)
        parcel_distance_data.append({
            "parcel_id": p.gid,
            "distances": distances,
        })

    # Compute min/max per category across the mouza
    min_max = {}
    for category in SUITABILITY_CATEGORIES:
        valid_values = [
            item["distances"][category]
            for item in parcel_distance_data
            if item["distances"][category] is not None
        ]
        if not valid_values:
            min_max[category] = {"min": None, "max": None}
        else:
            min_max[category] = {"min": min(valid_values), "max": max(valid_values)}

    # Score every parcel
    scored_parcels = []
    for item in parcel_distance_data:
        final_score = 0.0
        category_scores = {}

        for category in SUITABILITY_CATEGORIES:
            distance = item["distances"][category]
            min_d = min_max[category]["min"]
            max_d = min_max[category]["max"]

            if distance is None or min_d is None or max_d is None:
                category_score = 0.0
            elif max_d == min_d:
                category_score = 100.0
            else:
                category_score = 100.0 * (max_d - distance) / (max_d - min_d)

            category_scores[category] = round(category_score, 2)
            final_score += category_score * float(weights[category])

        final_score = round(final_score, 2)
        label = "Excellent" if final_score >= 75 else ("Good" if final_score >= 50 else "Poor")

        scored_parcels.append({
            "parcel_id": item["parcel_id"],
            "score": final_score,
            "label": label,
            "category_scores": category_scores,
            "distances_km": {
                k: round(v, 3) if v is not None else None
                for k, v in item["distances"].items()
            },
        })

    selected_result = next(
        (r for r in scored_parcels if r["parcel_id"] == int(parcel_id)),
        None,
    )

    return {
        "selected_parcel_id": int(parcel_id),
        "parcel_type": parcel_type,
        "mouza_id": mouza_id,
        "weights": weights,
        "selected_result": selected_result,
        "all_parcel_scores": scored_parcels,
    }
