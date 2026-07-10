from ..common_imports import *
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator

@method_decorator(cache_page(60 * 10), name="list")
class ListMasterPlanView(viewsets.ViewSet):
    queryset = MasterPlan.objects.all()
    serializer_class = MasterPlanSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):
        try:
            gid = request.query_params.get("gid") or request.query_params.get("id")
            society_id = request.query_params.get("society_id")
            mauza_id = request.query_params.get("mauza_id")
            dist_id = request.query_params.get("dist_id")
            tehsil_id = request.query_params.get("tehsil_id")

            if gid:
                obj = MasterPlan.objects.filter(gid=gid).first()

                if not obj:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="MasterPlan not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                serializer = MasterPlanSerializer(obj)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="MasterPlan found.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            queryset = MasterPlan.objects.all()

            if society_id:
                queryset = queryset.filter(society_id=society_id)

            if mauza_id:
                queryset = queryset.filter(mauza_id=mauza_id)

            if dist_id:
                queryset = queryset.filter(dist_id=dist_id)

            if tehsil_id:
                queryset = queryset.filter(tehsil_id=tehsil_id)

            serializer = MasterPlanSerializer(queryset, many=True)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="MasterPlan data fetched successfully.",
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

        cache_key = f"masterplan_geojson_{pk}"
        cached = cache.get(cache_key)

        if cached:
            print(
                "CACHE:",
                round((time.time() - start) * 1000, 2),
                "ms",
            )

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="MasterPlan GeoJSON found.",
                data=cached,
                http_status=status.HTTP_200_OK,
            ).create_response()

        try:

            db_start = time.time()

            with connection.cursor() as cursor:

                cursor.execute(
                    """
                    SELECT
                        gid,
                        society_id,
                        mauza_id,
                        dist_id,
                        tehsil_id,
                        land_use,
                        height,
                        ST_AsGeoJSON(geom)::json
                    FROM masterplan
                    WHERE gid = %s
                    """,
                    [pk],
                )

                row = cursor.fetchone()

            print(
                "DB + ST_AsGeoJSON:",
                round((time.time() - db_start) * 1000, 2),
                "ms",
            )

            if not row:
                return ApiResponse(
                    status=status.HTTP_404_NOT_FOUND,
                    message="MasterPlan not found.",
                    data=[],
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()

            feature = {
                "type": "Feature",
                "id": row[0],
                "geometry": row[7],
                "properties": {
                    "gid": row[0],
                    "society_id": row[1],
                    "mauza_id": row[2],
                    "dist_id": row[3],
                    "tehsil_id": row[4],
                    "land_use": row[5],
                    "height": row[6],
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
                message="MasterPlan GeoJSON found.",
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