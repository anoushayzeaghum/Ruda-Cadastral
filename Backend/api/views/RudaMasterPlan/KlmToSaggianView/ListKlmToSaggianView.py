
import json
import logging

from django.db import connection
from rest_framework import status, viewsets
from rest_framework.permissions import AllowAny

from ...common_imports import ApiResponse


logger = logging.getLogger(__name__)


class ListKlmToSaggianView(viewsets.ViewSet):
    """
    Read KLM to Saggian road features from PostGIS.

    Returns a standard 2D GeoJSON FeatureCollection.
    Preserves original 4D geometries in PostgreSQL.
    """

    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):
        try:
            gid = request.query_params.get("gid")
            road_type = request.query_params.get("descriptio")

            conditions = []
            params = []

            # Filter by feature ID
            if gid is not None:
                if not gid.isdecimal() or int(gid) < 1:
                    return ApiResponse(
                        status=status.HTTP_400_BAD_REQUEST,
                        message="gid must be a positive integer.",
                        data={},
                        http_status=status.HTTP_400_BAD_REQUEST,
                    ).create_response()

                conditions.append("gid = %s")
                params.append(int(gid))

            # Filter by road classification
            if road_type:
                conditions.append("descriptio = %s")
                params.append(road_type)

            where_clause = (
                "WHERE " + " AND ".join(conditions)
                if conditions else ""
            )

            # PostGIS converts 4D geometry to 2D GeoJSON
            query = f"""
                SELECT
                    gid,
                    id,
                    name,
                    descriptio,
                    timestamp,
                    "begin",
                    "end",
                    altitudemo,
                    tessellate,
                    extrude,
                    visibility,
                    draworder,
                    icon,
                    ST_AsGeoJSON(
                        ST_Force2D(geom)
                    ) AS geometry_json
                FROM public."klm to saggian"
                {where_clause}
                ORDER BY gid
            """

            with connection.cursor() as cursor:
                cursor.execute(query, params)

                column_names = [
                    col[0] for col in cursor.description
                ]

                records = [
                    dict(zip(column_names, row))
                    for row in cursor.fetchall()
                ]

            features = []

            for record in records:
                geometry_json = record.pop("geometry_json")
                feature_id = record.pop("gid")

                geometry = (
                    json.loads(geometry_json)
                    if geometry_json is not None
                    else None
                )

                features.append({
                    "type": "Feature",
                    "id": feature_id,
                    "geometry": geometry,
                    "properties": {
                        "gid": feature_id,
                        **record,
                    },
                })

            geojson = {
                "type": "FeatureCollection",
                "features": features,
            }

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="KLM to Saggian features retrieved.",
                data=geojson,
                http_status=status.HTTP_200_OK,
            ).create_response()

        except Exception:
            logger.exception(
                "Error retrieving KLM to Saggian features"
            )

            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Error retrieving KLM to Saggian features.",
                data={},
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()
