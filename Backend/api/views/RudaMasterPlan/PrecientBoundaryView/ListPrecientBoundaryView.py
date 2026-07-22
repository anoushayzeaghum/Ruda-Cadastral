from ...common_imports import *

from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator
from django.core.cache import cache
from django.db import connection
import json
import time


@method_decorator(cache_page(60 * 10), name="list")
class ListPrecientBoundaryView(viewsets.ViewSet):

    queryset = PrecientBoundary.objects.all()
    serializer_class = PrecientBoundarySerializer
    permission_classes = [AllowAny]

    filter_fields = [
        "area_acre",
        "phases",
        "phases_new",
        "shape_leng",
        "shape_area",
        "area_sqft",
        "area_225ac",
        "name",
    ]


    def list(self, request, *args, **kwargs):

        try:

            gid = request.query_params.get("gid")

            # --------------------------
            # Single Feature
            # --------------------------
            if gid:

                cache_key = f"precient_boundary_{gid}"
                cached = cache.get(cache_key)

                if cached:
                    return ApiResponse(
                        status=status.HTTP_200_OK,
                        message="PrecientBoundary found.",
                        data=cached,
                        http_status=status.HTTP_200_OK,
                    ).create_response()

                with connection.cursor() as cursor:

                    cursor.execute("""
                        SELECT
                            gid,
                            area_acre,
                            phases,
                            phases_new,
                            shape_leng,
                            shape_area,
                            area_sqft,
                            area_225ac,
                            name,
                            ST_AsGeoJSON(geom)::json
                        FROM precient_boundary
                        WHERE gid=%s
                    """, [gid])

                    row = cursor.fetchone()

                if not row:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="PrecientBoundary not found.",
                        data=[],
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                feature = {
                    "type": "Feature",
                    "id": row[0],
                    "geometry": row[9],
                    "properties": {
                        "gid": row[0],
                        "area_acre": row[1],
                        "phases": row[2],
                        "phases_new": row[3],
                        "shape_leng": row[4],
                        "shape_area": row[5],
                        "area_sqft": row[6],
                        "area_225ac": row[7],
                        "name": row[8],
                    },
                }

                cache.set(cache_key, feature, 60 * 60)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="PrecientBoundary found.",
                    data=feature,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            # --------------------------
            # Filters
            # --------------------------

            filters = {}
            where = []
            params = []

            for field in self.filter_fields:
                value = request.query_params.get(field)

                if value not in [None, ""]:
                    where.append(f"{field}=%s")
                    params.append(value)

            sql = """
                SELECT
                    gid,
                    area_acre,
                    phases,
                    phases_new,
                    shape_leng,
                    shape_area,
                    area_sqft,
                    area_225ac,
                    name,
                    ST_AsGeoJSON(
                        ST_SimplifyPreserveTopology(geom, 0.00005)
                    )::json
                FROM precient_boundary
            """

            if where:
                sql += " WHERE " + " AND ".join(where)

            sql += " ORDER BY gid"

            cache_key = "precient_boundary_fc_" + "_".join(
                str(x) for x in params
            )

            cached = cache.get(cache_key)

            if cached:
                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="PrecientBoundary records found.",
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
                    "geometry": row[9],
                    "properties": {
                        "gid": row[0],
                        "area_acre": row[1],
                        "phases": row[2],
                        "phases_new": row[3],
                        "shape_leng": row[4],
                        "shape_area": row[5],
                        "area_sqft": row[6],
                        "area_225ac": row[7],
                        "name": row[8],
                    },
                })

            geojson = {
                "type": "FeatureCollection",
                "features": features,
            }

            cache.set(cache_key, geojson, 60 * 60)

            print(
                "PrecientBoundary:",
                len(features),
                "features",
                round((time.time() - start) * 1000, 2),
                "ms",
            )

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="PrecientBoundary records found.",
                data=geojson,
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

        return self.list(request)