from ...common_imports import *
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator


@method_decorator(cache_page(60 * 10), name="list")
class ListAwardedLandView(viewsets.ViewSet):
    queryset = AwardedLand.objects.all()
    serializer_class = AwardedLandSerializer
    permission_classes = [AllowAny]

    filter_fields = [
        "district",
        "tehsil",
        "mouza",
        "square",
        "khasra",
        "sub_khasra",
        "khasra_lab",
        "agri_river",
        "land_type",
        "date",
    ]

    def list(self, request, *args, **kwargs):
        try:
            gid = request.query_params.get("gid")

            queryset = AwardedLand.objects.only(
                "gid",
                "district",
                "tehsil",
                "mouza",
                "square",
                "khasra",
                "sub_khasra",
                "khasra_lab",
                "agri_river",
                "land_type",
                "remarks",
                "area_sqft",
                "date",
                "geom",
            )

            if gid:
                obj = queryset.filter(gid=gid).first()

                if not obj:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="AwardedLand not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="AwardedLand found.",
                    data=AwardedLandSerializer(obj).data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            filters = {}

            for field in self.filter_fields:
                value = request.query_params.get(field)
                if value not in [None, ""]:
                    filters[field] = value

            if filters:
                queryset = queryset.filter(**filters)

            serializer = AwardedLandSerializer(queryset, many=True)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="AwardedLand records found.",
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

        cache_key = f"awardedland_geojson_{pk}"
        cached = cache.get(cache_key)

        if cached:
            return ApiResponse(
                status=status.HTTP_200_OK,
                message="AwardedLand GeoJSON found.",
                data=cached,
                http_status=status.HTTP_200_OK,
            ).create_response()

        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT
                        gid,
                        district,
                        tehsil,
                        mouza,
                        square,
                        khasra,
                        sub_khasra,
                        khasra_lab,
                        agri_river,
                        land_type,
                        remarks,
                        area_sqft,
                        date,
                        ST_AsGeoJSON(
                            ST_SimplifyPreserveTopology(geom,0.00005)
                        )::json
                    FROM awardedland
                    WHERE gid=%s
                    """,
                    [pk],
                )

                row = cursor.fetchone()

            if not row:
                return ApiResponse(
                    status=status.HTTP_404_NOT_FOUND,
                    message="AwardedLand not found.",
                    data=[],
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()

            feature = {
                "type": "Feature",
                "id": row[0],
                "geometry": row[13],
                "properties": {
                    "gid": row[0],
                    "district": row[1],
                    "tehsil": row[2],
                    "mouza": row[3],
                    "square": row[4],
                    "khasra": row[5],
                    "sub_khasra": row[6],
                    "khasra_lab": row[7],
                    "agri_river": row[8],
                    "land_type": row[9],
                    "remarks": row[10],
                    "area_sqft": row[11],
                    "date": row[12],
                },
            }

            cache.set(cache_key, feature, 60 * 60)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="AwardedLand GeoJSON found.",
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