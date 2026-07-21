from ..common_imports import *
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator


@method_decorator(cache_page(60 * 10), name="list")
class ListGeodeticNetworkView(viewsets.ViewSet):
    queryset = GeodeticNetwork.objects.all()
    serializer_class = GeodeticNetworkSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):

        try:
            gid = request.query_params.get("gid")
            code = request.query_params.get("code")
            name = request.query_params.get("name")

            # -----------------------------
            # Single Record (Raw SQL)
            # -----------------------------
            if gid:

                with connection.cursor() as cursor:

                    cursor.execute("""
                        SELECT
                            gid,
                            name,
                            easting_m,
                            northing_m,
                            code,
                            elevation,
                            ST_AsGeoJSON(geom)::json
                        FROM geodeticnetwork
                        WHERE gid=%s
                    """, [gid])

                    row = cursor.fetchone()

                if not row:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="GeodeticNetwork not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                feature = {
                    "type": "Feature",
                    "id": row[0],
                    "geometry": row[6],
                    "properties": {
                        "gid": row[0],
                        "name": row[1],
                        "easting_m": row[2],
                        "northing_m": row[3],
                        "code": row[4],
                        "elevation": row[5],
                    },
                }

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="GeodeticNetwork found.",
                    data=feature,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            queryset = GeodeticNetwork.objects.only(
                "gid",
                "name",
                "easting_m",
                "northing_m",
                "code",
                "elevation",
                "geom",
            )

            if code:
                queryset = queryset.filter(code__iexact=code)

            if name:
                queryset = queryset.filter(name__iexact=name)

            serializer = GeodeticNetworkSerializer(
                queryset.iterator(),
                many=True,
            )

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="GeodeticNetwork list fetched successfully.",
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

        start = time.time()

        cache_key = f"geodeticnetwork_geojson_{pk}"
        cached = cache.get(cache_key)

        if cached:

            print(
                "CACHE:",
                round((time.time() - start) * 1000, 2),
                "ms",
            )

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="GeoJSON fetched.",
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
                        easting_m,
                        northing_m,
                        code,
                        elevation,
                        ST_AsGeoJSON(geom)::json
                    FROM geodeticnetwork
                    WHERE gid=%s
                """, [pk])

                row = cursor.fetchone()

            print(
                "DB + ST_AsGeoJSON:",
                round((time.time() - db_start) * 1000, 2),
                "ms",
            )

            if not row:

                return ApiResponse(
                    status=status.HTTP_404_NOT_FOUND,
                    message="GeodeticNetwork not found.",
                    data=[],
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()

            feature = {
                "type": "Feature",
                "id": row[0],
                "geometry": row[6],
                "properties": {
                    "gid": row[0],
                    "name": row[1],
                    "easting_m": row[2],
                    "northing_m": row[3],
                    "code": row[4],
                    "elevation": row[5],
                },
            }

            cache.set(cache_key, feature, 60 * 60)

            print(
                "TOTAL:",
                round((time.time() - start) * 1000, 2),
                "ms",
            )

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="GeoJSON fetched.",
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