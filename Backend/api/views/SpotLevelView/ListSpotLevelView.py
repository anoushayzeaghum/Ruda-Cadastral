"""Spot Level list/detail API aligned with public.spot_level schema."""

import json
import logging

from django.db import connection
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny

from api.models import SpotLevel
from api.serializers import SpotLevelSerializer
from api.utils import ApiResponse

logger = logging.getLogger(__name__)


class ListSpotLevelView(viewsets.ViewSet):
    queryset = SpotLevel.objects.all()
    serializer_class = SpotLevelSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):
        # This dataset has project_id, not mauza_id, district_id or tehsil_id.
        unsupported = [
            key for key in ("mauza_id", "dist_id", "tehsil_id")
            if request.query_params.get(key)
        ]
        if unsupported:
            return ApiResponse(
                status=status.HTTP_400_BAD_REQUEST,
                message="Unsupported Spot Level filters: " + ", ".join(unsupported),
                http_status=status.HTTP_400_BAD_REQUEST,
            ).create_response()

        gid = request.query_params.get("gid") or request.query_params.get("id")
        project_id = request.query_params.get("project_id")
        for key, value in (("gid", gid), ("project_id", project_id)):
            if value is not None and (not value.isdecimal() or int(value) <= 0):
                return ApiResponse(
                    status=status.HTTP_400_BAD_REQUEST,
                    message=f"{key} must be a positive integer.",
                    http_status=status.HTTP_400_BAD_REQUEST,
                ).create_response()

        try:
            queryset = SpotLevel.objects.select_related("project")
            if project_id:
                queryset = queryset.filter(project_id=int(project_id))
            if gid:
                obj = queryset.filter(gid=int(gid)).first()
                if obj is None:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="Spot Level not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()
                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Spot Level found.",
                    data=SpotLevelSerializer(obj).data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            # No cache_page here: recently re-imported features must not be stale.
            serializer = SpotLevelSerializer(queryset.order_by("gid"), many=True)
            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Spot Level data fetched successfully.",
                data=serializer.data,
                http_status=status.HTTP_200_OK,
            ).create_response()
        except Exception:
            logger.exception("Spot Level list failed (project_id=%s)", project_id)
            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Spot Level server error. Check Django server traceback.",
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()

    @action(detail=False, methods=["get"], url_path="map-geojson", url_name="map-geojson")
    def map_geojson(self, request):
        """Return valid Mapbox GeoJSON without modifying original shapefile X/Y/ZZ.

        The imported Spot Level geometry is sometimes incorrectly tagged 4326
        while retaining UTM Zone 43N *foot* coordinates. Correct that geometry
        at response time only; preserve the attributes and database rows.

        This separate action leaves the existing /api/spot-level/ list contract
        unchanged for other consumers.
        """
        project_id_text = request.query_params.get("project_id")
        if not project_id_text or not project_id_text.isdecimal() or int(project_id_text) <= 0:
            return ApiResponse(
                status=status.HTTP_400_BAD_REQUEST,
                message="A positive project_id is required.",
                http_status=status.HTTP_400_BAD_REQUEST,
            ).create_response()

        # Taken from the supplied Spot_Levels.prj, not inferred from ST_SRID.
        source_utm_feet = "+proj=utm +zone=43 +datum=WGS84 +units=ft +no_defs"
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT
                        gid, project_id, objectid, id, x, y, zz,
                        ST_AsGeoJSON(
                            CASE
                                WHEN geom IS NULL THEN NULL
                                WHEN ST_SRID(geom) = 4326 AND
                                     (ABS(ST_X(geom)) > 180 OR ABS(ST_Y(geom)) > 90)
                                THEN ST_Transform(geom, %s, 4326)
                                WHEN ST_SRID(geom) = 4326 THEN geom
                                WHEN ST_SRID(geom) > 0 THEN ST_Transform(geom, 4326)
                                ELSE NULL
                            END
                        ) AS map_geometry
                    FROM public.spot_level
                    WHERE project_id = %s
                    ORDER BY gid
                    """,
                    [source_utm_feet, int(project_id_text)],
                )
                rows = cursor.fetchall()

            features = []
            invalid_count = 0
            for gid, project_id, objectid, record_id, x, y, zz, geom_json in rows:
                if not geom_json:
                    invalid_count += 1
                    continue
                geometry = json.loads(geom_json)
                coords = geometry.get("coordinates")
                if (
                    geometry.get("type") != "Point"
                    or not isinstance(coords, list)
                    or len(coords) < 2
                    or not all(isinstance(value, (int, float)) for value in coords[:2])
                    or abs(coords[0]) > 180
                    or abs(coords[1]) > 90
                ):
                    invalid_count += 1
                    continue
                features.append({
                    "type": "Feature",
                    "id": gid,
                    "geometry": geometry,
                    "properties": {
                        "gid": gid,
                        "project_id": project_id,
                        "OBJECTID": objectid,
                        "Id": record_id,
                        "X": x,  # Original shapefile X; intentionally unchanged
                        "Y": y,  # Original shapefile Y; intentionally unchanged
                        "ZZ": str(zz) if zz is not None else None,
                    },
                })

            logger.info(
                "Spot Level map GeoJSON: project=%s rows=%s valid=%s invalid=%s",
                project_id_text, len(rows), len(features), invalid_count,
            )
            if rows and not features:
                return ApiResponse(
                    status=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    message="Spot Level records exist but none has valid map geometry.",
                    http_status=status.HTTP_422_UNPROCESSABLE_ENTITY,
                ).create_response()

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Spot Level map GeoJSON fetched successfully.",
                data={"type": "FeatureCollection", "features": features},
                http_status=status.HTTP_200_OK,
            ).create_response()
        except Exception:
            logger.exception("Spot Level map-geojson failed (project_id=%s)", project_id_text)
            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Spot Level map geometry error. Check Django traceback.",
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()

    @action(detail=True, methods=["get"], url_path="geojson", url_name="geojson")
    def geojson(self, request, pk=None):
        try:
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT gid, project_id, objectid, id, x, y, zz,
                           ST_AsGeoJSON(geom)
                    FROM public.spot_level WHERE gid = %s
                """, [pk])
                row = cursor.fetchone()
            if row is None:
                return ApiResponse(
                    status=status.HTTP_404_NOT_FOUND,
                    message="Spot Level not found.",
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()
            geometry = json.loads(row[7]) if row[7] is not None else None
            feature = {
                "type": "Feature",
                "id": row[0],
                "geometry": geometry,
                "properties": {
                    "gid": row[0],
                    "project": row[1],
                    "OBJECTID": row[2],
                    "Id": row[3],
                    "X": row[4],
                    "Y": row[5],
                    "ZZ": float(row[6]) if row[6] is not None else None,
                },
            }
            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Spot Level GeoJSON found.",
                data=feature,
                http_status=status.HTTP_200_OK,
            ).create_response()
        except Exception:
            logger.exception("Spot Level GeoJSON failed (gid=%s)", pk)
            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Spot Level GeoJSON server error. Check Django server traceback.",
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()
