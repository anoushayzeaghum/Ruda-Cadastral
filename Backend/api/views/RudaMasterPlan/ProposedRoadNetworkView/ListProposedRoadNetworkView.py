from ...common_imports import *

from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator


@method_decorator(cache_page(60 * 10), name="list")
class ListProposedRoadNetworkView(viewsets.ViewSet):
    queryset = ProposedRoadNetwork.objects.all()
    serializer_class = ProposedRoadNetworkSerializer
    permission_classes = [AllowAny]

    filter_fields = [
        "gm_layer",
        "gm_type",
        "elevation",
        "layer",
    ]

    def list(self, request, *args, **kwargs):

        try:
            gid = request.query_params.get("gid")

            # -----------------------------
            # Single Feature
            # -----------------------------
            if gid:

                cache_key = f"proposed_road_network_{gid}"

                cached = cache.get(cache_key)

                if cached:
                    return ApiResponse(
                        status=status.HTTP_200_OK,
                        message="ProposedRoadNetwork found.",
                        data=cached,
                        http_status=status.HTTP_200_OK,
                    ).create_response()

                with connection.cursor() as cursor:

                    cursor.execute("""
                        SELECT
                            gid,
                            gm_layer,
                            gm_type,
                            elevation,
                            layer,
                            ST_AsGeoJSON(geom)::json
                        FROM proposed_road_network
                        WHERE gid=%s
                    """, [gid])

                    row = cursor.fetchone()

                if not row:

                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="ProposedRoadNetwork not found.",
                        data=[],
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                feature = {
                    "type": "Feature",
                    "id": row[0],
                    "geometry": row[5],
                    "properties": {
                        "gid": row[0],
                        "gm_layer": row[1],
                        "gm_type": row[2],
                        "elevation": row[3],
                        "layer": row[4],
                    },
                }

                cache.set(cache_key, feature, 60 * 60)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="ProposedRoadNetwork found.",
                    data=feature,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            # -----------------------------
            # FeatureCollection
            # -----------------------------
            filters = {}

            for field in self.filter_fields:
                value = request.query_params.get(field)
                if value not in [None, ""]:
                    filters[field] = value

            cache_key = f"proposed_road_network_fc_{hash(frozenset(filters.items()))}"

            cached = cache.get(cache_key)

            if cached:

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="ProposedRoadNetwork records found.",
                    data=cached,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            sql = """
                SELECT
                    gid,
                    gm_layer,
                    gm_type,
                    elevation,
                    layer,
                    ST_AsGeoJSON(geom)::json
                FROM proposed_road_network
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
                "features": [
                    {
                        "type": "Feature",
                        "id": row[0],
                        "geometry": row[5],
                        "properties": {
                            "gid": row[0],
                            "gm_layer": row[1],
                            "gm_type": row[2],
                            "elevation": row[3],
                            "layer": row[4],
                        },
                    }
                    for row in rows
                ],
            }

            cache.set(cache_key, feature_collection, 60 * 60)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="ProposedRoadNetwork records found.",
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

        cache_key = f"proposed_road_network_geojson_{pk}"

        cached = cache.get(cache_key)

        if cached:

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="ProposedRoadNetwork GeoJSON found.",
                data=cached,
                http_status=status.HTTP_200_OK,
            ).create_response()

        try:

            with connection.cursor() as cursor:

                cursor.execute("""
                    SELECT
                        gid,
                        gm_layer,
                        gm_type,
                        elevation,
                        layer,
                        ST_AsGeoJSON(geom)::json
                    FROM proposed_road_network
                    WHERE gid=%s
                """, [pk])

                row = cursor.fetchone()

            if not row:

                return ApiResponse(
                    status=status.HTTP_404_NOT_FOUND,
                    message="ProposedRoadNetwork not found.",
                    data=[],
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()

            feature = {
                "type": "Feature",
                "id": row[0],
                "geometry": row[5],
                "properties": {
                    "gid": row[0],
                    "gm_layer": row[1],
                    "gm_type": row[2],
                    "elevation": row[3],
                    "layer": row[4],
                },
            }

            cache.set(cache_key, feature, 60 * 60)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="ProposedRoadNetwork GeoJSON found.",
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