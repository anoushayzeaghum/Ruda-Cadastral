from ...common_imports import *
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator


@method_decorator(cache_page(60 * 10), name="list")
class ListPossessionLandView(viewsets.ViewSet):
    queryset = PossessionLand.objects.all()
    serializer_class = PossessionLandSerializer
    permission_classes = [AllowAny]

    filter_fields = [
        "district",
        "tehsil",
        "mouza",
        "square",
        "khasra",
        "khasra_lab",
        "award_zone",
        "projects",
        "l_type",
        "land_owner",
        "lp_name",
        "date",
    ]

    def list(self, request, *args, **kwargs):
        try:
            gid = request.query_params.get("gid")

            queryset = PossessionLand.objects.only(
                "gid",
                "district",
                "tehsil",
                "mouza",
                "square",
                "khasra",
                "khasra_lab",
                "award_zone",
                "projects",
                "l_type",
                "land_owner",
                "lp_name",
                "remarks",
                "date",
                "geom",
            )

            if gid:
                obj = queryset.filter(gid=gid).first()

                if not obj:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="PossessionLand not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="PossessionLand found.",
                    data=PossessionLandSerializer(obj).data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            filters = {}

            for field in self.filter_fields:
                value = request.query_params.get(field)

                if value not in [None, ""]:
                    filters[field] = value

            if filters:
                queryset = queryset.filter(**filters)

            serializer = PossessionLandSerializer(queryset, many=True)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="PossessionLand records found.",
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

        cache_key = f"possessionland_geojson_{pk}"
        cached = cache.get(cache_key)

        if cached:
            return ApiResponse(
                status=status.HTTP_200_OK,
                message="PossessionLand GeoJSON found.",
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
                        khasra_lab,
                        award_zone,
                        projects,
                        l_type,
                        land_owner,
                        lp_name,
                        remarks,
                        date,
                        ST_AsGeoJSON(
                            ST_SimplifyPreserveTopology(geom, 0.00005)
                        )::json
                    FROM possessionland
                    WHERE gid = %s
                    """,
                    [pk],
                )

                row = cursor.fetchone()

            if not row:
                return ApiResponse(
                    status=status.HTTP_404_NOT_FOUND,
                    message="PossessionLand not found.",
                    data=[],
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()

            feature = {
                "type": "Feature",
                "id": row[0],
                "geometry": row[14],
                "properties": {
                    "gid": row[0],
                    "district": row[1],
                    "tehsil": row[2],
                    "mouza": row[3],
                    "square": row[4],
                    "khasra": row[5],
                    "khasra_lab": row[6],
                    "award_zone": row[7],
                    "projects": row[8],
                    "l_type": row[9],
                    "land_owner": row[10],
                    "lp_name": row[11],
                    "remarks": row[12],
                    "date": row[13],
                },
            }

            cache.set(cache_key, feature, 60 * 60)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="PossessionLand GeoJSON found.",
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