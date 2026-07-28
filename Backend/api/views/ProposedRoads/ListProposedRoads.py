import time

from ..common_imports import *
from django.core.cache import cache
from django.db import connection
from rest_framework.decorators import action


class ListProposedRoadsView(viewsets.ViewSet):
    permission_classes = [AllowAny]

    def list(self, request):
        try:
            queryset = ProposedRoads.objects.all().order_by("gid")

            gid = request.query_params.get("gid")
            road_id = request.query_params.get("id")
            road_type = request.query_params.get("road_type")

            if gid:
                queryset = queryset.filter(gid=gid)

            if road_id:
                queryset = queryset.filter(id=road_id)

            if road_type:
                queryset = queryset.filter(road_type__icontains=road_type)

            serializer = ProposedRoadsSerializer(queryset, many=True)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Proposed roads fetched successfully",
                data=serializer.data,
                http_status=status.HTTP_200_OK,
            ).create_response()

        except Exception as e:
            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()

    @action(
        detail=True,
        methods=["get"],
        url_path="geojson",
        url_name="geojson",
    )
    def geojson(self, request, pk=None):
        start = time.time()
        cache_key = f"proposed_roads_geojson_{pk}"
        cached = cache.get(cache_key)

        if cached is not None:
            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Proposed road GeoJSON found.",
                data=cached,
                http_status=status.HTTP_200_OK,
            ).create_response()

        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    '''
                    SELECT
                        gid,
                        id,
                        road_type,
                        "row",
                        ST_AsGeoJSON(geom)::json
                    FROM ruda_proposed_road
                    WHERE gid = %s
                    ''',
                    [pk],
                )
                row = cursor.fetchone()

            if not row:
                return ApiResponse(
                    status=status.HTTP_404_NOT_FOUND,
                    message="Proposed road not found.",
                    data=[],
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()

            feature = {
                "type": "Feature",
                "id": row[0],
                "geometry": row[4],
                "properties": {
                    "gid": row[0],
                    "id": row[1],
                    "road_type": row[2],
                    "row": float(row[3]) if row[3] is not None else None,
                },
            }

            cache.set(cache_key, feature, 60 * 60)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Proposed road GeoJSON found.",
                data=feature,
                http_status=status.HTTP_200_OK,
            ).create_response()

        except Exception as e:
            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Server error.",
                data=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()
