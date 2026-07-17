from ...common_imports import *

from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator


@method_decorator(cache_page(60 * 10), name="list")
class ListWWTPSitesView(viewsets.ViewSet):

    queryset = WWTPSites.objects.all()
    serializer_class = WWTPSitesSerializer
    permission_classes = [AllowAny]

    filter_fields = [
        "name",
        "site_type",
        "created_us",
        "created_da",
        "last_edite",
        "last_edi_1",
        "area",
    ]

    def list(self, request, *args, **kwargs):

        try:

            gid = request.query_params.get("gid")

            # ------------------------------------------------
            # Single Feature
            # ------------------------------------------------

            if gid:

                cache_key = f"wwtp_sites_{gid}"

                cached = cache.get(cache_key)

                if cached:

                    return ApiResponse(
                        status=status.HTTP_200_OK,
                        message="WWTPSites found.",
                        data=cached,
                        http_status=status.HTTP_200_OK,
                    ).create_response()

                with connection.cursor() as cursor:

                    cursor.execute("""
                        SELECT
                            gid,
                            objectid,
                            name,
                            type,
                            shape_leng,
                            shape_area,
                            created_us,
                            created_da,
                            last_edite,
                            last_edi_1,
                            area,
                            ST_AsGeoJSON(geom)::json
                        FROM wwtp_sites
                        WHERE gid=%s
                    """, [gid])

                    row = cursor.fetchone()

                if not row:

                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="WWTPSites not found.",
                        data=[],
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                feature = {
                    "type": "Feature",
                    "id": row[0],
                    "geometry": row[11],
                    "properties": {
                        "gid": row[0],
                        "objectid": row[1],
                        "name": row[2],
                        "site_type": row[3],
                        "shape_leng": row[4],
                        "shape_area": row[5],
                        "created_us": row[6],
                        "created_da": row[7],
                        "last_edite": row[8],
                        "last_edi_1": row[9],
                        "area": row[10],
                    },
                }

                cache.set(cache_key, feature, 60 * 60)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="WWTPSites found.",
                    data=feature,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            # ------------------------------------------------
            # Feature Collection
            # ------------------------------------------------

            filters = {}

            for field in self.filter_fields:

                value = request.query_params.get(field)

                if value not in [None, ""]:
                    filters[field] = value

            cache_key = f"wwtp_sites_fc_{hash(frozenset(filters.items()))}"

            cached = cache.get(cache_key)

            if cached:

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="WWTPSites records found.",
                    data=cached,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            sql = """
                SELECT
                    gid,
                    objectid,
                    name,
                    type,
                    shape_leng,
                    shape_area,
                    created_us,
                    created_da,
                    last_edite,
                    last_edi_1,
                    area,
                    ST_AsGeoJSON(geom)::json
                FROM wwtp_sites
            """

            params = []

            if filters:

                sql += " WHERE "

                conditions = []

                column_map = {
                    "site_type": "type",
                    "name": "name",
                    "created_us": "created_us",
                    "created_da": "created_da",
                    "last_edite": "last_edite",
                    "last_edi_1": "last_edi_1",
                    "area": "area",
                }

                for key, value in filters.items():

                    conditions.append(f"{column_map[key]}=%s")
                    params.append(value)

                sql += " AND ".join(conditions)

            with connection.cursor() as cursor:

                cursor.execute(sql, params)

                rows = cursor.fetchall()

            feature_collection = {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "id": row[0],
                        "geometry": row[11],
                        "properties": {
                            "gid": row[0],
                            "objectid": row[1],
                            "name": row[2],
                            "site_type": row[3],
                            "shape_leng": row[4],
                            "shape_area": row[5],
                            "created_us": row[6],
                            "created_da": row[7],
                            "last_edite": row[8],
                            "last_edi_1": row[9],
                            "area": row[10],
                        },
                    }
                    for row in rows
                ],
            }

            cache.set(cache_key, feature_collection, 60 * 60)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="WWTPSites records found.",
                data=feature_collection,
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

        cache_key = f"wwtp_sites_geojson_{pk}"

        cached = cache.get(cache_key)

        if cached:

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="WWTPSites GeoJSON found.",
                data=cached,
                http_status=status.HTTP_200_OK,
            ).create_response()

        try:

            with connection.cursor() as cursor:

                cursor.execute("""
                    SELECT
                        gid,
                        objectid,
                        name,
                        type,
                        shape_leng,
                        shape_area,
                        created_us,
                        created_da,
                        last_edite,
                        last_edi_1,
                        area,
                        ST_AsGeoJSON(geom)::json
                    FROM wwtp_sites
                    WHERE gid=%s
                """, [pk])

                row = cursor.fetchone()

            if not row:

                return ApiResponse(
                    status=status.HTTP_404_NOT_FOUND,
                    message="WWTPSites not found.",
                    data=[],
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()

            feature = {
                "type": "Feature",
                "id": row[0],
                "geometry": row[11],
                "properties": {
                    "gid": row[0],
                    "objectid": row[1],
                    "name": row[2],
                    "site_type": row[3],
                    "shape_leng": row[4],
                    "shape_area": row[5],
                    "created_us": row[6],
                    "created_da": row[7],
                    "last_edite": row[8],
                    "last_edi_1": row[9],
                    "area": row[10],
                },
            }

            cache.set(cache_key, feature, 60 * 60)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="WWTPSites GeoJSON found.",
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