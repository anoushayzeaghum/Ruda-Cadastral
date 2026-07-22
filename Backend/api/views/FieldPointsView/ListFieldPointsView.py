from ..common_imports import *

from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator

@method_decorator(cache_page(60 * 10), name="list")
class ListFieldPointsView(viewsets.ViewSet):
    queryset = FieldPoints.objects.all()
    serializer_class = FieldPointsSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):
        try:
            gid = request.query_params.get("gid")
            mauza_id = request.query_params.get("mauza_id")

            if gid:
                obj = (
                    FieldPoints.objects
                    .select_related("mauza")
                    .filter(gid=gid)
                    .first()
                )

                if not obj:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="FieldPoints not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="FieldPoints found.",
                    data=FieldPointsSerializer(obj).data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            queryset = FieldPoints.objects.select_related("mauza")

            if mauza_id:
                queryset = queryset.filter(mauza_id=mauza_id)

            serializer = FieldPointsSerializer(
                queryset,
                many=True,
            )

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="FieldPoints fetched successfully.",
                data=serializer.data,
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

    @action(
        detail=True,
        methods=["get"],
        url_path="geojson",
        url_name="geojson",
    )
    def geojson(self, request, pk=None):

        start = time.time()

        cache_key = f"fieldpoints_geojson_{pk}"
        cached = cache.get(cache_key)

        if cached:
            print(
                "CACHE:",
                round((time.time() - start) * 1000, 2),
                "ms"
            )

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="FieldPoints GeoJSON found.",
                data=cached,
                http_status=status.HTTP_200_OK,
            ).create_response()

        try:

            db_start = time.time()

            with connection.cursor() as cursor:

                cursor.execute("""
                    SELECT
                        gid,
                        name,
                        easting,
                        northing,
                        elevation,
                        mauza_id,
                        layer,
                        ST_AsGeoJSON(geom)::json
                    FROM fieldpoints
                    WHERE gid = %s
                """, [pk])

                row = cursor.fetchone()

            print(
                "DB + ST_AsGeoJSON:",
                round((time.time() - db_start) * 1000, 2),
                "ms"
            )

            if not row:
                return ApiResponse(
                    status=status.HTTP_404_NOT_FOUND,
                    message="FieldPoints not found.",
                    data=[],
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()

            feature = {
                "type": "Feature",
                "id": row[0],
                "geometry": row[7],
                "properties": {
                    "gid": row[0],
                    "name": row[1],
                    "easting": float(row[2]) if row[2] is not None else None,
                    "northing": float(row[3]) if row[3] is not None else None,
                    "elevation": row[4],
                    "mauza_id": row[5],
                    "layer": row[6],
                },
            }

            cache.set(cache_key, feature, 60 * 60)

            print(
                "TOTAL:",
                round((time.time() - start) * 1000, 2),
                "ms"
            )

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="FieldPoints GeoJSON found.",
                data=feature,
                http_status=status.HTTP_200_OK,
            ).create_response()

        except Exception as e:
            import traceback

            print(traceback.format_exc())

            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Server error.",
                data=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()