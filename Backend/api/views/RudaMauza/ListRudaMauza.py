from ..common_imports import *

from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator


@method_decorator(cache_page(60 * 10), name="list")
class ListRudaMauzaView(viewsets.ViewSet):
    queryset = RudaMauza.objects.all()
    serializer_class = RudaMauzaSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):

        try:
            RudaMauza_id = request.query_params.get("RudaMauza_id") or request.query_params.get("id")

            district_id = (
                request.query_params.get("district_id")
                or request.query_params.get("dist_id")
            )

            tehsil_id = request.query_params.get("tehsil_id")

            # Single RudaMauza
            if RudaMauza_id:

                obj = RudaMauza.objects.filter(
                    RudaMauza_id=RudaMauza_id
                ).first()

                if not obj:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="RudaMauza not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                serializer = RudaMauzaSerializer(obj)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="RudaMauza found.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            queryset = RudaMauza.objects.all()

            # Filter by district
            if district_id:
                queryset = queryset.filter(
                    district_id=district_id
                )

            # Filter by tehsil
            if tehsil_id:
                queryset = queryset.filter(
                    tehsil_id=tehsil_id
                )

            serializer = RudaMauzaSerializer(queryset, many=True)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="RudaMauzas found.",
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

        cache_key = f"RudaMauza_geojson_{pk}"
        cached = cache.get(cache_key)

        if cached:
            print(
                "CACHE:",
                round((time.time() - start) * 1000, 2),
                "ms"
            )

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="RudaMauza GeoJSON found.",
                data=cached,
                http_status=status.HTTP_200_OK,
            ).create_response()

        try:

            db_start = time.time()

            with connection.cursor() as cursor:

                cursor.execute("""
                    SELECT
                        gid,
                        dist_id,
                        tehsil_id,
                        kc,
                        kc_id,
                        pc,
                        RudaMauza,
                        RudaMauza_id,
                        ST_AsGeoJSON(geom)::json
                    FROM RudaMauza
                    WHERE RudaMauza_id = %s
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
                    message="RudaMauza not found.",
                    data=[],
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()

            feature = {
                "type": "Feature",
                "id": row[7],
                "geometry": row[8],
                "properties": {
                    "gid": row[0],
                    "district_id": row[1],
                    "tehsil_id": row[2],
                    "kc": row[3],
                    "kc_id": row[4],
                    "pc": row[5],
                    "RudaMauza": row[6],
                    "RudaMauza_id": row[7],
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
                message="RudaMauza GeoJSON found.",
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
                error_traceback=traceback.format_exc(),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()