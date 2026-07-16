from ...common_imports import *

from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator


@method_decorator(cache_page(60 * 10), name="list")
class ListLahoreTransportationRoadView(viewsets.ViewSet):
    queryset = LahoreTransportationRoad.objects.all()
    serializer_class = LahoreTransportationRoadSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):

        try:

            gid = request.query_params.get("gid")
            road_type = request.query_params.get("type")

            if gid:

                obj = LahoreTransportationRoad.objects.filter(
                    gid=gid
                ).first()

                if not obj:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="Road not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                serializer = LahoreTransportationRoadSerializer(obj)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Road found.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            queryset = LahoreTransportationRoad.objects.all()

            if road_type:
                queryset = queryset.filter(type=road_type)

            serializer = LahoreTransportationRoadSerializer(
                queryset,
                many=True,
            )

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Roads found.",
                data=serializer.data,
                http_status=status.HTTP_200_OK,
            ).create_response()

        except Exception as e:

            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Server error.",
                data=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()

    @action(
        detail=True,
        methods=["get"],
        url_path="geojson",
        url_name="geojson",
    )
    def geojson(self, request, pk=None):

        cache_key = f"lahore_transportation_road_{pk}"

        cached = cache.get(cache_key)

        if cached:

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Road GeoJSON found.",
                data=cached,
                http_status=status.HTTP_200_OK,
            ).create_response()

        try:

            with connection.cursor() as cursor:

                cursor.execute("""
                    SELECT
                        gid,
                        "__oid",
                        name,
                        shape_leng,
                        type,
                        popupinfo,
                        ST_AsGeoJSON(geom)::json
                    FROM lahore_transportation_roads
                    WHERE gid=%s
                """, [pk])

                row = cursor.fetchone()

            if not row:

                return ApiResponse(
                    status=status.HTTP_404_NOT_FOUND,
                    message="Road not found.",
                    data=[],
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()

            feature = {
                "type": "Feature",
                "id": row[0],
                "geometry": row[6],
                "properties": {
                    "gid": row[0],
                    "oid": row[1],
                    "name": row[2],
                    "shape_leng": row[3],
                    "type": row[4],
                    "popupinfo": row[5],
                },
            }

            cache.set(cache_key, feature, 60 * 60)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Road GeoJSON found.",
                data=feature,
                http_status=status.HTTP_200_OK,
            ).create_response()

        except Exception as e:

            import traceback

            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Server error.",
                data=str(e),
                error_traceback=traceback.format_exc(),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()