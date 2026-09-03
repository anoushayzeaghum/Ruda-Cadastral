from ...common_imports import *
from django.core.cache import cache
from django.db import connection
from django.db.models import Q
import traceback


class ListPlotView(viewsets.ViewSet):

    permission_classes = [AllowAny]

    def list(self, request):

        try:

            gid = request.query_params.get("gid")
            project_id = request.query_params.get("project_id")
            block_id = request.query_params.get("block_id")
            plot_no = request.query_params.get("plot_no")
            block = request.query_params.get("block")
            plot_area = request.query_params.get("plot_area")
            plot_type = request.query_params.get("type")
            search = request.query_params.get("search")

            cache_key = (
                f"plot_geojson_v2_{gid}_{project_id}_{block_id}_"
                f"{plot_no}_{block}_{plot_area}_{plot_type}_{search}"
            )

            cached = cache.get(cache_key)

            if cached:
                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Cached plot data.",
                    data=cached,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            sql = """
                SELECT
                    p.gid,
                    p.name,
                    p.type,
                    p.plot_no,
                    p.plot_area,
                    p.shape_leng,
                    p.shape_area,
                    p.remarks,
                    p.dimension,
                    p.parkfront,
                    p.rd_ft,
                    p.storey,
                    p.rd_facing,
                    p.possession,
                    p.poss_st,
                    p.canceled,
                    p.site_plan,
                    p.unique_id,
                    p.tr_srno,
                    p.tr_own,
                    p.tr_p_no,
                    p.tr_cate,

                    pr.gid,
                    pr.name,

                    b.gid,
                    b.name,
                    b.block,

                    ST_AsGeoJSON(
                        ST_SimplifyPreserveTopology(
                            p.geom,
                            0.00001
                        ),
                        6
                    )::json

                FROM plot p

                LEFT JOIN project pr
                    ON p.project_id = pr.gid

                LEFT JOIN block b
                    ON p.block_id = b.gid

                WHERE 1=1
            """

            params = []

            if gid:
                sql += " AND p.gid=%s"
                params.append(gid)

            if project_id:
                sql += " AND p.project_id=%s"
                params.append(project_id)

            if block_id:
                sql += " AND p.block_id=%s"
                params.append(block_id)

            if block:
                sql += " AND LOWER(b.block)=LOWER(%s)"
                params.append(block)

            if plot_no:
                sql += " AND LOWER(p.plot_no)=LOWER(%s)"
                params.append(plot_no)

            if plot_area:
                sql += " AND LOWER(p.plot_area)=LOWER(%s)"
                params.append(plot_area)

            if plot_type:
                sql += " AND LOWER(p.type)=LOWER(%s)"
                params.append(plot_type)

            if search:
                sql += """
                AND (
                    p.plot_no ILIKE %s OR
                    p.name ILIKE %s OR
                    p.type ILIKE %s OR
                    p.plot_area ILIKE %s OR
                    pr.name ILIKE %s OR
                    b.name ILIKE %s OR
                    b.block ILIKE %s
                )
                """

                value = f"%{search}%"

                params.extend([
                    value,
                    value,
                    value,
                    value,
                    value,
                    value,
                    value,
                ])

            sql += " ORDER BY p.gid"

            with connection.cursor() as cursor:

                cursor.execute(sql, params)

                rows = cursor.fetchall()

            features = []

            for row in rows:

                features.append({

                    "type": "Feature",

                    "id": row[0],

                    "geometry": row[27],

                    "properties": {

                        "gid": row[0],
                        "name": row[1],
                        "type": row[2],
                        "plot_no": row[3],
                        "plot_area": row[4],
                        "shape_leng": row[5],
                            "shape_area": row[6],
                            "remarks": row[7],
                            "dimension": row[8],
                            "parkfront": row[9],
                            "rd_ft": row[10],
                            "storey": row[11],
                            "rd_facing": row[12],
                            "possession": row[13],
                            "poss_st": row[14],
                            "canceled": row[15],
                            "site_plan": row[16],
                            "unique_id": row[17],
                            "tr_srno": row[18],
                            "tr_own": row[19],
                            "tr_p_no": row[20],
                            "tr_cate": row[21],

                            "project": row[22],
                            "project_name": row[23],

                            "block": row[24],
                            "block_name": row[25],
                            "block_code": row[26],
                    }
                })

            geojson = {
                "type": "FeatureCollection",
                "features": features,
            }

            cache.set(cache_key, geojson, 3600)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Plot list fetched successfully.",
                data=geojson,
                http_status=status.HTTP_200_OK,
            ).create_response()

        except Exception as e:

            print(traceback.format_exc())

            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Server error.",
                data=str(e),
                error_traceback=traceback.format_exc(),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()