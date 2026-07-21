from ...common_imports import *

from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator
from django.core.cache import cache
from django.db import connection
import time


@method_decorator(cache_page(60 * 10), name="list")
class ListCityLevelServiceView(viewsets.ViewSet):

    queryset = CityLevelService.objects.all()
    serializer_class = CityLevelServiceSerializer
    permission_classes = [AllowAny]

    filter_fields = [
        "layer",
        "gm_type",
        "elevation",
        "name",
        "area_225ac",
        "type",
    ]


    def list(self, request, *args, **kwargs):

        try:

            gid = request.query_params.get("gid")

            # ----------------------------------------------------
            # Single Feature
            # ----------------------------------------------------

            if gid:

                cache_key = f"city_level_service_{gid}"

                cached = cache.get(cache_key)

                if cached:

                    return ApiResponse(
                        status=status.HTTP_200_OK,
                        message="CityLevelService found.",
                        data=cached,
                        http_status=status.HTTP_200_OK,
                    ).create_response()

                with connection.cursor() as cursor:

                    cursor.execute("""
                        SELECT
                            gid,
                            layer,
                            gm_type,
                            elevation,
                            name,
                            area_225ac,
                            type,
                            ST_AsGeoJSON(
                                ST_SimplifyPreserveTopology(geom, 0.00005)
                            )::json
                        FROM city_level_service
                        WHERE gid=%s
                    """, [gid])

                    row = cursor.fetchone()

                if not row:

                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="CityLevelService not found.",
                        data=[],
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                feature = {
                    "type": "Feature",
                    "id": row[0],
                    "geometry": row[7],
                    "properties": {
                        "gid": row[0],
                        "layer": row[1],
                        "gm_type": row[2],
                        "elevation": row[3],
                        "name": row[4],
                        "area_225ac": row[5],
                        "type": row[6],
                    },
                }

                cache.set(cache_key, feature, 60 * 60)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="CityLevelService found.",
                    data=feature,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            # ----------------------------------------------------
            # FeatureCollection
            # ----------------------------------------------------

            where = []
            params = []

            for field in self.filter_fields:

                value = request.query_params.get(field)

                if value not in [None, ""]:

                    where.append(f'"{field}"=%s')
                    params.append(value)

            sql = """
                SELECT
                    gid,
                    layer,
                    gm_type,
                    elevation,
                    name,
                    area_225ac,
                    type,
                    ST_AsGeoJSON(geom)::json
                FROM city_level_service
            """

            if where:
                sql += " WHERE " + " AND ".join(where)

            sql += " ORDER BY gid"

            cache_key = "city_level_service"

            if params:
                cache_key += "_" + "_".join(str(x) for x in params)

            cached = cache.get(cache_key)

            if cached:

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="CityLevelService records found.",
                    data=cached,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            start = time.time()

            with connection.cursor() as cursor:

                cursor.execute(sql, params)

                rows = cursor.fetchall()

            features = []

            for row in rows:

                features.append({
                    "type": "Feature",
                    "id": row[0],
                    "geometry": row[7],
                    "properties": {
                        "gid": row[0],
                        "layer": row[1],
                        "gm_type": row[2],
                        "elevation": row[3],
                        "name": row[4],
                        "area_225ac": row[5],
                        "type": row[6],
                    },
                })

            geojson = {
                "type": "FeatureCollection",
                "features": features,
            }

            cache.set(cache_key, geojson, 60 * 60)

            print(
                f"CityLevelService: {len(features)} features "
                f"in {(time.time() - start) * 1000:.2f} ms"
            )

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="CityLevelService records found.",
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

        return self.list(request)