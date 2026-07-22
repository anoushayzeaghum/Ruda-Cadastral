from ...common_imports import *
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator


@method_decorator(cache_page(60 * 10), name="list")
class ListStateLandView(viewsets.ViewSet):
    queryset = StateLand.objects.all()
    serializer_class = StateLandSerializer
    permission_classes = [AllowAny]

    filter_fields = [
        "district",
        "tehsil",
        "mouza",
        "square",
        "khasra",
        "sub_khasra",
        "khasra_lab",
        "state_land",
        "date",
    ]

    def list(self, request, *args, **kwargs):

        try:

            gid = request.query_params.get("gid")

            filters = []
            values = []

            if gid:
                filters.append("gid=%s")
                values.append(gid)

            for field in self.filter_fields:
                value = request.query_params.get(field)
                if value not in [None, ""]:
                    filters.append(f"{field}=%s")
                    values.append(value)

            where_clause = ""
            if filters:
                where_clause = "WHERE " + " AND ".join(filters)

            with connection.cursor() as cursor:

                cursor.execute(
                    f"""
                    SELECT
                        gid,
                        district,
                        tehsil,
                        mouza,
                        square,
                        khasra,
                        sub_khasra,
                        khasra_lab,
                        remarks,
                        state_land,
                        area_sqft,
                        date,
                        ST_AsGeoJSON(
                            ST_SimplifyPreserveTopology(geom,0.00005)
                        )::json
                    FROM stateland
                    {where_clause}
                    """,
                    values,
                )

                rows = cursor.fetchall()

            if gid:

                if not rows:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="StateLand not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                row = rows[0]

                feature = {
                    "type": "Feature",
                    "id": row[0],
                    "geometry": row[12],
                    "properties": {
                        "gid": row[0],
                        "district": row[1],
                        "tehsil": row[2],
                        "mouza": row[3],
                        "square": row[4],
                        "khasra": row[5],
                        "sub_khasra": row[6],
                        "khasra_lab": row[7],
                        "remarks": row[8],
                        "state_land": row[9],
                        "area_sqft": row[10],
                        "date": row[11],
                    },
                }

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="StateLand found.",
                    data=feature,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            features = []

            for row in rows:

                features.append({
                    "type": "Feature",
                    "id": row[0],
                    "geometry": row[12],
                    "properties": {
                        "gid": row[0],
                        "district": row[1],
                        "tehsil": row[2],
                        "mouza": row[3],
                        "square": row[4],
                        "khasra": row[5],
                        "sub_khasra": row[6],
                        "khasra_lab": row[7],
                        "remarks": row[8],
                        "state_land": row[9],
                        "area_sqft": row[10],
                        "date": row[11],
                    },
                })

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="StateLand records found.",
                data=features,
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

        cache_key = f"stateland_geojson_{pk}"
        cached = cache.get(cache_key)

        if cached:
            return ApiResponse(
                status=status.HTTP_200_OK,
                message="StateLand GeoJSON found.",
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
                        remarks,
                        state_land,
                        area_sqft,
                        date,
                        ST_AsGeoJSON(geom)::json
                    FROM stateland
                    WHERE gid=%s
                    """,
                    [pk],
                )

                row = cursor.fetchone()

            if not row:
                return ApiResponse(
                    status=status.HTTP_404_NOT_FOUND,
                    message="StateLand not found.",
                    data=[],
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()

            feature = {
                "type": "Feature",
                "id": row[0],
                "geometry": row[12],
                "properties": {
                    "gid": row[0],
                    "district": row[1],
                    "tehsil": row[2],
                    "mouza": row[3],
                    "square": row[4],
                    "khasra": row[5],
                    "sub_khasra": row[6],
                    "khasra_lab": row[7],
                    "remarks": row[8],
                    "state_land": row[9],
                    "area_sqft": row[10],
                    "date": row[11],
                },
            }

            cache.set(cache_key, feature, 60 * 60)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="StateLand GeoJSON found.",
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