import json

from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Amenity


def amenity_to_feature(amenity):
    return {
        "type": "Feature",
        "geometry": json.loads(amenity.geom.geojson),
        "properties": {
            "id": amenity.id,
            "name": amenity.name,
            "category": amenity.category,
            "source": amenity.source,
            "source_id": amenity.source_id,
            "is_verified": amenity.is_verified,
        },
    }


class AmenityListView(APIView):
    """
    GET /api/amenities/
    GET /api/amenities/?category=hospital
    Returns a GeoJSON FeatureCollection of active amenities.
    """

    def get(self, request):
        category = request.query_params.get("category")
        qs = Amenity.objects.filter(is_active=True)
        if category:
            qs = qs.filter(category=category)
        features = [amenity_to_feature(a) for a in qs]
        return Response({"type": "FeatureCollection", "features": features})
