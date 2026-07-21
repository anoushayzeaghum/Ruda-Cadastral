from ..common_imports import *

from django.core.cache import cache
from django.db import connection
from rest_framework.decorators import action

import traceback
import time


class ListRudaSquareView(viewsets.ViewSet):

    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):

        try:

            start = time.time()

            gid = request.query_params.get("gid")

            bbox = request.query_params.get("bbox")

            district = request.query_params.get("district")
            tehsil = request.query_params.get("tehsil")
            mouza = request.query_params.get("mouza")
            square = request.query_params.get("square")

            if gid:

                with connection.cursor() as cursor:

                    cursor.execute(
                        """
                        SELECT
                            gid,
                            district,
                            tehsil,
                            mouza,
                            square,
                            ST_AsGeoJSON(geom)::json
                        FROM ruda_square
                        WHERE gid=%s
                        """,
                        [gid],
                    )

                    row = cursor.fetchone()

                if not row:

                    return ApiResponse(
                        status=404,
                        message="Not found",
                        data=[],
                        http_status=404,
                    ).create_response()

                feature = {
                    "type": "Feature",
                    "id": row[0],
                    "geometry": row[5],
                    "properties": {
                        "gid": row[0],
                        "district": row[1],
                        "tehsil": row[2],
                        "mouza": row[3],
                        "square": row[4],
                    },
                }

                return ApiResponse(
                    status=200,
                    message="Success",
                    data=feature,
                    http_status=200,
                ).create_response()

            sql = """
                SELECT
                    gid,
                    district,
                    tehsil,
                    mouza,
                    square,
                    ST_AsGeoJSON(
                        ST_SimplifyPreserveTopology(
                            geom,
                            0.00002
                        ),
                        6
                    )::json
                FROM ruda_square
                WHERE 1=1
            """

            params = []

            if bbox:

                minx, miny, maxx, maxy = map(float, bbox.split(","))

                sql += """
                AND geom && ST_MakeEnvelope(
                    %s,%s,%s,%s,4326
                )
                """

                params.extend([minx, miny, maxx, maxy])

            if district:
                sql += " AND district=%s"
                params.append(district)

            if tehsil:
                sql += " AND tehsil=%s"
                params.append(tehsil)

            if mouza:
                sql += " AND mouza=%s"
                params.append(mouza)

            if square:
                sql += " AND square=%s"
                params.append(square)

            sql += " ORDER BY gid"

            cache_key = "ruda_square_" + str(sorted(request.query_params.items()))

            cached = cache.get(cache_key)

            if cached:

                return ApiResponse(
                    status=200,
                    message="Cached",
                    data=cached,
                    http_status=200,
                ).create_response()

            with connection.cursor() as cursor:

                cursor.execute(sql, params)

                rows = cursor.fetchall()

            features = []

            for row in rows:

                features.append(
                    {
                        "type": "Feature",
                        "id": row[0],
                        "geometry": row[5],
                        "properties": {
                            "gid": row[0],
                            "district": row[1],
                            "tehsil": row[2],
                            "mouza": row[3],
                            "square": row[4],
                        },
                    }
                )

            result = {
                "type": "FeatureCollection",
                "features": features,
            }

            cache.set(cache_key, result, 3600)

            print(
                "RUDA SQUARE:",
                len(features),
                "features",
                round((time.time() - start) * 1000, 2),
                "ms",
            )

            return ApiResponse(
                status=200,
                message="Ruda Square loaded.",
                data=result,
                http_status=200,
            ).create_response()

        except Exception as e:

            print(traceback.format_exc())

            return ApiResponse(
                status=500,
                message="Server error.",
                data=str(e),
                http_status=500,
            ).create_response()

    @action(
        detail=True,
        methods=["get"],
        url_path="geojson",
    )
    def geojson(self, request, pk=None):

        request.query_params._mutable = True
        request.query_params["gid"] = pk

        return self.list(request)