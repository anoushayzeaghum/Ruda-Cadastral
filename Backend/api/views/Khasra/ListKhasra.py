from ..common_imports import *

from django.core.cache import cache
from django.db import connection
from rest_framework.decorators import action

import traceback
import time



class ListKhasraView(viewsets.ViewSet):

    permission_classes = [AllowAny]


    # =====================================================
    # LIST KHASRA
    # =====================================================

    def list(self, request, *args, **kwargs):

        try:

            start = time.time()


            gid = (
                request.query_params.get("gid")
                or request.query_params.get("id")
            )

            bbox = request.query_params.get("bbox")

            mauza_id = request.query_params.get("mauza_id")
            tehsil_id = request.query_params.get("tehsil_id")
            dist_id = request.query_params.get("dist_id")



            # =================================================
            # SINGLE KHASRA
            # =================================================

            if gid:

                cache_key = f"khasra_detail_{gid}"

                cached = cache.get(cache_key)


                if cached:

                    return ApiResponse(
                        status=status.HTTP_200_OK,
                        message="Khasra found.",
                        data=cached,
                        http_status=status.HTTP_200_OK,
                    ).create_response()



                with connection.cursor() as cursor:

                    cursor.execute(
                        """

                        SELECT

                        gid,
                        join_shp,
                        dist_id,
                        tehsil_id,
                        mauza_id,

                        ST_AsGeoJSON(
                            geom
                        )::json


                        FROM khasra

                        WHERE gid=%s

                        LIMIT 1

                        """,
                        [gid]
                    )

                    row = cursor.fetchone()



                if not row:

                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="Khasra not found.",
                        data=[],
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()



                feature = {

                    "type": "Feature",

                    "id": row[0],

                    "geometry": row[5],

                    "properties": {

                        "gid": row[0],
                        "join_shp": row[1],
                        "dist_id": row[2],
                        "tehsil_id": row[3],
                        "mauza_id": row[4],

                    }

                }


                cache.set(
                    cache_key,
                    feature,
                    86400
                )


                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Khasra found.",
                    data=feature,
                    http_status=status.HTTP_200_OK,
                ).create_response()



            # =================================================
            # MAP VIEW QUERY
            # =================================================


            sql = """

            SELECT

                gid,
                join_shp,
                dist_id,
                tehsil_id,
                mauza_id,

                ST_AsGeoJSON(

                    ST_SimplifyPreserveTopology(
                        geom,
                        0.00002
                    ),

                    6

                )::json


            FROM khasra

            WHERE 1=1

            """


            params = []



            # -----------------------------
            # BBOX FILTER
            # -----------------------------

            if bbox:

                minx, miny, maxx, maxy = map(
                    float,
                    bbox.split(",")
                )


                sql += """

                AND geom && ST_MakeEnvelope(
                    %s,
                    %s,
                    %s,
                    %s,
                    4326
                )

                """


                params.extend(
                    [
                        minx,
                        miny,
                        maxx,
                        maxy
                    ]
                )



            # -----------------------------
            # OLD FILTER SUPPORT
            # -----------------------------


            if dist_id:

                sql += """
                AND dist_id=%s
                """

                params.append(dist_id)



            if tehsil_id:

                sql += """
                AND tehsil_id=%s
                """

                params.append(tehsil_id)



            if mauza_id:

                sql += """
                AND mauza_id=%s
                """

                params.append(mauza_id)



            sql += """

            ORDER BY gid

            """



            cache_key = (
                "khasra_map_"
                + str(
                    sorted(
                        request.query_params.items()
                    )
                )
            )



            cached = cache.get(cache_key)


            if cached:

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Cached Khasra.",
                    data=cached,
                    http_status=status.HTTP_200_OK,
                ).create_response()



            with connection.cursor() as cursor:

                cursor.execute(
                    sql,
                    params
                )

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

                            "join_shp": row[1],

                            "dist_id": row[2],

                            "tehsil_id": row[3],

                            "mauza_id": row[4],

                        }

                    }

                )



            result = {

                "type": "FeatureCollection",

                "features": features

            }



            cache.set(
                cache_key,
                result,
                3600
            )



            print(
                "KHASRA:",
                len(features),
                "features",
                round(
                    (time.time()-start)*1000,
                    2
                ),
                "ms"
            )



            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Khasra loaded.",
                data=result,
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



    # =====================================================
    # GEOJSON ENDPOINT
    # =====================================================


    @action(
        detail=True,
        methods=["get"],
        url_path="geojson",
        url_name="geojson",
    )
    def geojson(self, request, pk=None):

        request.query_params._mutable = True

        request.query_params["gid"] = pk

        return self.list(request)