from ...common_imports import *
from django.db import connection
from rest_framework.views import APIView
from rest_framework.response import Response

class PlotIntersectingKhasrasAPIView(APIView):
    def get(self, request, plot_gid):
        sql = """
            WITH selected_plot AS (
                SELECT gid, plot_no, plot_area, geom
                FROM plot
                WHERE gid = %s
            ),
            plot_area AS (
                SELECT
                    gid,
                    plot_no,
                    plot_area,
                    ST_Area(ST_Transform(geom, 3857)) * 10.7639104167 AS plot_area_sqft,
                    geom
                FROM selected_plot
            )
            SELECT
                k.gid,
                k.kh,
                k.join_shp,
                k.mauza,
                k.mauza_id,
                ST_Area(
                    ST_Transform(
                        ST_Intersection(p.geom, k.geom),
                        3857
                    )
                ) * 10.7639104167 AS intersection_area_sqft,
                p.plot_no,
                p.plot_area,
                p.plot_area_sqft
            FROM plot_area p
            JOIN khasra k
              ON ST_Intersects(p.geom, k.geom)
            WHERE NOT ST_IsEmpty(ST_Intersection(p.geom, k.geom))
            ORDER BY intersection_area_sqft DESC;
        """

        with connection.cursor() as cursor:
            cursor.execute(sql, [plot_gid])
            rows = cursor.fetchall()

        if not rows:
            return Response({
                "plot_no": None,
                "plot_area": None,
                "plot_area_sqft": 0,
                "intersected_count": 0,
                "features": [],
            })

        plot_area_sqft = float(rows[0][8] or 0)

        features = []
        for row in rows:
            area_sqft = float(row[5] or 0)
            percentage = round((area_sqft / plot_area_sqft) * 100, 2) if plot_area_sqft else 0

            features.append({
                "khasra_gid": row[0],
                "khasra_no": row[1] or row[2],
                "join_shp": row[2],
                "mauza": row[3],
                "mauza_id": row[4],
                "area_sqft": round(area_sqft, 2),
                "percentage": percentage,
            })

        return Response({
            "plot_no": rows[0][6],
            "plot_area": rows[0][7],
            "plot_area_sqft": round(plot_area_sqft, 2),
            "intersected_count": len(features),
            "features": features,
        }, status=status.HTTP_200_OK)