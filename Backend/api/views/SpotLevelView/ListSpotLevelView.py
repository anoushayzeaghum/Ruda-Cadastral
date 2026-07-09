from ..common_imports import *
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator

@method_decorator(cache_page(60 * 10), name="list")
class ListSpotLevelView(viewsets.ViewSet):
    queryset = SpotLevel.objects.all()
    serializer_class = SpotLevelSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):
        try:
            gid = request.query_params.get("gid") or request.query_params.get("id")
            project_id = request.query_params.get("project_id")
            mauza_id = request.query_params.get("mauza_id")
            dist_id = request.query_params.get("dist_id")
            tehsil_id = request.query_params.get("tehsil_id")

            if gid:
                obj = SpotLevel.objects.filter(gid=gid).first()

                if not obj:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="Spot Level not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                serializer = SpotLevelSerializer(obj)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Spot Level found.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            queryset = SpotLevel.objects.all()

            if project_id:
                queryset = queryset.filter(project_id=project_id)

            if mauza_id:
                queryset = queryset.filter(mauza_id=mauza_id)

            if dist_id:
                queryset = queryset.filter(district_id=dist_id)

            if tehsil_id:
                queryset = queryset.filter(tehsil_id=tehsil_id)

            serializer = SpotLevelSerializer(queryset, many=True)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Spot Level data fetched successfully.",
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

        cache_key = f"spotlevel_geojson_{pk}"
        cached = cache.get(cache_key)

        if cached:
            print(
                "CACHE:",
                round((time.time() - start) * 1000, 2),
                "ms"
            )

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Spot Level GeoJSON found.",
                data=cached,
                http_status=status.HTTP_200_OK,
            ).create_response()

        try:

            db_start = time.time()

            with connection.cursor() as cursor:

                cursor.execute("""
                    SELECT
                        gid,
                        project_id,
                        dist_id,
                        tehsil_id,
                        mauza_id,
                        ST_AsGeoJSON(geom)::json
                    FROM spot_level
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
                    message="Spot Level not found.",
                    data=[],
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()

            feature = {
                "type": "Feature",
                "id": row[0],
                "geometry": row[5],
                "properties": {
                    "gid": row[0],
                    "project": row[1],
                    "district": row[2],
                    "tehsil": row[3],
                    "mauza": row[4],
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
                message="Spot Level GeoJSON found.",
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