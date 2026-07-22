from ...common_imports import *

from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator
from django.core.cache import cache


@method_decorator(cache_page(60 * 10), name="list")
class ListRtwPackageView(viewsets.ViewSet):
    queryset = RtwPackage.objects.all()
    serializer_class = RtwPackageSerializer
    permission_classes = [AllowAny]

    filter_fields = [
        "gid",
        "layer",
        "map_name",
        "name",
        "package",
        "closed",
        "ruda_phase",
    ]

    def list(self, request, *args, **kwargs):
        try:

            filters = []
            params = []

            for field in self.filter_fields:
                value = request.query_params.get(field)
                if value not in [None, ""]:
                    filters.append(f"{field}=%s")
                    params.append(value)

            where_clause = ""
            if filters:
                where_clause = "WHERE " + " AND ".join(filters)

            cache_key = (
                "rtwpackage_fc_" +
                "_".join([str(x) for x in params])
                if params else
                "rtwpackage_fc_all"
            )

            cached = cache.get(cache_key)

            if cached:
                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="RtwPackage records found.",
                    data=cached,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            with connection.cursor() as cursor:

                cursor.execute(
                    f"""
                    SELECT
                        gid,
                        layer,
                        map_name,
                        name,
                        package,
                        area_acres,
                        closed,
                        label_pos,
                        ruda_phase,
                        area_sqkm,
                        aaa,
                        ST_AsGeoJSON(geom)::json
                    FROM rtwpackage
                    {where_clause}
                    """,
                    params,
                )

                rows = cursor.fetchall()

            features = []

            for row in rows:
                features.append(
                    {
                        "type": "Feature",
                        "id": row[0],
                        "geometry": row[11],
                        "properties": {
                            "gid": row[0],
                            "layer": row[1],
                            "map_name": row[2],
                            "name": row[3],
                            "package": row[4],
                            "area_acres": row[5],
                            "closed": row[6],
                            "label_pos": row[7],
                            "ruda_phase": row[8],
                            "area_sqkm": row[9],
                            "aaa": row[10],
                        },
                    }
                )

            geojson = {
                "type": "FeatureCollection",
                "features": features,
            }

            cache.set(cache_key, geojson, 60 * 60)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="RtwPackage records found.",
                data=geojson,
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

        cache_key = f"rtwpackage_{pk}"

        cached = cache.get(cache_key)

        if cached:
            return ApiResponse(
                status=status.HTTP_200_OK,
                message="RtwPackage GeoJSON found.",
                data=cached,
                http_status=status.HTTP_200_OK,
            ).create_response()

        try:

            with connection.cursor() as cursor:

                cursor.execute(
                    """
                    SELECT
                        gid,
                        layer,
                        map_name,
                        name,
                        package,
                        area_acres,
                        closed,
                        label_pos,
                        ruda_phase,
                        area_sqkm,
                        aaa,
                        ST_AsGeoJSON(geom)::json
                    FROM rtwpackage
                    WHERE gid=%s
                    """,
                    [pk],
                )

                row = cursor.fetchone()

            if not row:
                return ApiResponse(
                    status=status.HTTP_404_NOT_FOUND,
                    message="RtwPackage not found.",
                    data=[],
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()

            feature = {
                "type": "Feature",
                "id": row[0],
                "geometry": row[11],
                "properties": {
                    "gid": row[0],
                    "layer": row[1],
                    "map_name": row[2],
                    "name": row[3],
                    "package": row[4],
                    "area_acres": row[5],
                    "closed": row[6],
                    "label_pos": row[7],
                    "ruda_phase": row[8],
                    "area_sqkm": row[9],
                    "aaa": row[10],
                },
            }

            cache.set(cache_key, feature, 60 * 60)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="RtwPackage GeoJSON found.",
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