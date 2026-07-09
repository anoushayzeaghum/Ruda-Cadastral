from ..common_imports import *
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator
@method_decorator(cache_page(60 * 10), name="list")
class ListContourView(viewsets.ViewSet):
    queryset = Contour.objects.all()
    serializer_class = ContourSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):
        try:
            gid = request.query_params.get("gid") or request.query_params.get("id")
            project_id = request.query_params.get("project_id")
            mauza_id = request.query_params.get("mauza_id")
            dist_id = request.query_params.get("dist_id")
            tehsil_id = request.query_params.get("tehsil_id")

            # ---------------------------------------
            # Single Contour
            # ---------------------------------------
            if gid:
                obj = (
                    Contour.objects
                    .select_related(
                        "project",
                        "district",
                        "tehsil",
                        "mauza",
                    )
                    .only(
                        "gid",
                        "geom",
                        "elevation",
                        "project__gid",
                        "district__gid",
                        "tehsil__gid",
                        "mauza__gid",
                    )
                    .filter(gid=gid)
                    .first()
                )

                if not obj:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="Contour not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                serializer = ContourSerializer(obj)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Contour found.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            # ---------------------------------------
            # List Query
            # ---------------------------------------
            queryset = (
                Contour.objects
                .select_related(
                    "project",
                    "district",
                    "tehsil",
                    "mauza",
                )
                .only(
                    "gid",
                    "geom",
                    "elevation",
                    "project__gid",
                    "district__gid",
                    "tehsil__gid",
                    "mauza__gid",
                )
            )

            if project_id:
                queryset = queryset.filter(project_id=project_id)

            if mauza_id:
                queryset = queryset.filter(mauza_id=mauza_id)

            if dist_id:
                queryset = queryset.filter(dist_id=dist_id)

            if tehsil_id:
                queryset = queryset.filter(tehsil_id=tehsil_id)

            serializer = ContourSerializer(queryset, many=True)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Contour data fetched successfully.",
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

        cache_key = f"contour_geojson_{pk}"
        cached = cache.get(cache_key)

        if cached:
            print(
                "CACHE:",
                round((time.time() - start) * 1000, 2),
                "ms"
            )

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Contour GeoJSON found.",
                data=cached,
                http_status=status.HTTP_200_OK,
            ).create_response()

        try:

            db_start = time.time()

            with connection.cursor() as cursor:

                cursor.execute("""
                    SELECT
                        gid,
                        mauza_id,
                        dist_id,
                        tehsil_id,
                        project_id,
                        elevation,
                        ST_AsGeoJSON(geom)::json
                    FROM contour
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
                    message="Contour not found.",
                    data=[],
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()

            feature = {
                "type": "Feature",
                "id": row[0],
                "geometry": row[6],
                "properties": {
                    "gid": row[0],
                    "mauza_id": row[1],
                    "district_id": row[2],
                    "tehsil_id": row[3],
                    "project_id": row[4],
                    "elevation": row[5],
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
                message="Contour GeoJSON found.",
                data=feature,
                http_status=status.HTTP_200_OK,
            ).create_response()

        except Exception as e:

            print(traceback.format_exc())

            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Server error.",
                data=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()