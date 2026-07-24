from ...common_imports import *
from api.models import RudaNotifiedPhasesBoundary
from api.serializers import RudaNotifiedPhasesBoundarySerializer
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator


@method_decorator(cache_page(60 * 10), name="list")
class ListRudaNotifiedPhasesBoundaryView(viewsets.ViewSet):

    queryset = RudaNotifiedPhasesBoundary.objects.all()
    serializer_class = RudaNotifiedPhasesBoundarySerializer
    permission_classes = [AllowAny]

    filter_fields = [
        "area_acre",
        "phases",
        "phases_new",
        "shape_leng",
        "shape_le_1",
        "shape_area",
    ]

    def list(self, request, *args, **kwargs):
        try:
            gid = request.query_params.get("gid")

            # ------------------------------------------------
            # Single Feature
            # ------------------------------------------------
            if gid:
                cache_key = f"ruda_notified_phases_boundary_{gid}"
                cached = cache.get(cache_key)

                if cached:
                    return ApiResponse(
                        status=status.HTTP_200_OK,
                        message="RUDA notified phases boundary found.",
                        data=cached,
                        http_status=status.HTTP_200_OK,
                    ).create_response()

                row = self._fetch_one(gid)

                if not row:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="RUDA notified phases boundary not found.",
                        data=[],
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                feature = self._row_to_feature(row)
                cache.set(cache_key, feature, 60 * 60)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="RUDA notified phases boundary found.",
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

            cache_key = (
                "ruda_notified_phases_boundary_fc_"
                f"{hash(frozenset(filters.items()))}"
            )
            cached = cache.get(cache_key)

            if cached:
                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="RUDA notified phases boundary records found.",
                    data=cached,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            sql = """
                SELECT
                    gid,
                    area_acre,
                    phases,
                    phases_new,
                    shape_leng,
                    shape_le_1,
                    shape_area,
                    ST_AsGeoJSON(geom)::json
                FROM ruda_notified_phases_boundary
            """
            params = []

            if filters:
                sql += " WHERE "
                conditions = []

                for key, value in filters.items():
                    conditions.append(f"{key}=%s")
                    params.append(value)

                sql += " AND ".join(conditions)

            with connection.cursor() as cursor:
                cursor.execute(sql, params)
                rows = cursor.fetchall()

            feature_collection = {
                "type": "FeatureCollection",
                "features": [self._row_to_feature(row) for row in rows],
            }

            cache.set(cache_key, feature_collection, 60 * 60)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="RUDA notified phases boundary records found.",
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
        cache_key = f"ruda_notified_phases_boundary_geojson_{pk}"
        cached = cache.get(cache_key)

        if cached:
            return ApiResponse(
                status=status.HTTP_200_OK,
                message="RUDA notified phases boundary GeoJSON found.",
                data=cached,
                http_status=status.HTTP_200_OK,
            ).create_response()

        try:
            row = self._fetch_one(pk)

            if not row:
                return ApiResponse(
                    status=status.HTTP_404_NOT_FOUND,
                    message="RUDA notified phases boundary not found.",
                    data=[],
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()

            feature = self._row_to_feature(row)
            cache.set(cache_key, feature, 60 * 60)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="RUDA notified phases boundary GeoJSON found.",
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

    @staticmethod
    def _fetch_one(gid):
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    gid,
                    area_acre,
                    phases,
                    phases_new,
                    shape_leng,
                    shape_le_1,
                    shape_area,
                    ST_AsGeoJSON(geom)::json
                FROM ruda_notified_phases_boundary
                WHERE gid=%s
                """,
                [gid],
            )
            return cursor.fetchone()

    @staticmethod
    def _row_to_feature(row):
        return {
            "type": "Feature",
            "id": row[0],
            "geometry": row[7],
            "properties": {
                "gid": row[0],
                "area_acre": row[1],
                "phases": row[2],
                "phases_new": row[3],
                "shape_leng": row[4],
                "shape_le_1": row[5],
                "shape_area": row[6],
            },
        }
