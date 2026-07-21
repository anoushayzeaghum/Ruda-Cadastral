from ..common_imports import *

from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator


@method_decorator(cache_page(60 * 10), name="list")
class ListMauzaView(viewsets.ViewSet):

    queryset = Mauza.objects.all()
    serializer_class = MauzaSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):

        try:

            mauza_id = request.query_params.get("mauza_id") or request.query_params.get("id")

            district_id = (
                request.query_params.get("district_id")
                or request.query_params.get("dist_id")
            )

            tehsil_id = request.query_params.get("tehsil_id")

            # -----------------------------
            # Single Mauza
            # -----------------------------
            if mauza_id:

                cache_key = f"mauza_{mauza_id}"

                cached = cache.get(cache_key)

                if cached:

                    return ApiResponse(
                        status=status.HTTP_200_OK,
                        message="Mauza found.",
                        data=cached,
                        http_status=status.HTTP_200_OK,
                    ).create_response()

                with connection.cursor() as cursor:

                    cursor.execute("""
                        SELECT
                            gid,
                            district,
                            dist_id,
                            tehsil,
                            tehsil_id,
                            kc,
                            kc_id,
                            mauza,
                            mauza_id,
                            pc,
                            pc_id,
                            ST_AsGeoJSON(geom)::json
                        FROM mauza
                        WHERE mauza_id=%s
                    """, [mauza_id])

                    row = cursor.fetchone()

                if not row:

                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="Mauza not found.",
                        data=[],
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                feature = {
                    "type": "Feature",
                    "id": row[8],
                    "geometry": row[11],
                    "properties": {
                        "gid": row[0],
                        "district": row[1],
                        "dist_id": row[2],
                        "tehsil": row[3],
                        "tehsil_id": row[4],
                        "kc": row[5],
                        "kc_id": row[6],
                        "mauza": row[7],
                        "mauza_id": row[8],
                        "pc": row[9],
                        "pc_id": row[10],
                    },
                }

                cache.set(cache_key, feature, 60 * 60)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Mauza found.",
                    data=feature,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            # -----------------------------
            # List
            # -----------------------------

            queryset = Mauza.objects.only(
                "gid",
                "district",
                "dist_id",
                "tehsil",
                "tehsil_id",
                "kc",
                "kc_id",
                "mauza",
                "mauza_id",
                "pc",
                "pc_id",
                "geom",
            )

            if district_id:
                queryset = queryset.filter(dist_id=district_id)

            if tehsil_id:
                queryset = queryset.filter(tehsil_id=tehsil_id)

            serializer = MauzaSerializer(
                queryset,
                many=True,
            )

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Mauzas found.",
                data=serializer.data,
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

        cache_key = f"mauza_geojson_{pk}"

        cached = cache.get(cache_key)

        if cached:

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Mauza GeoJSON found.",
                data=cached,
                http_status=status.HTTP_200_OK,
            ).create_response()

        try:

            with connection.cursor() as cursor:

                cursor.execute("""
                    SELECT
                        gid,
                        district,
                        dist_id,
                        tehsil,
                        tehsil_id,
                        kc,
                        kc_id,
                        mauza,
                        mauza_id,
                        pc,
                        pc_id,
                        ST_AsGeoJSON(geom)::json
                    FROM mauza
                    WHERE mauza_id=%s
                """, [pk])

                row = cursor.fetchone()

            if not row:

                return ApiResponse(
                    status=status.HTTP_404_NOT_FOUND,
                    message="Mauza not found.",
                    data=[],
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()

            feature = {
                "type": "Feature",
                "id": row[8],
                "geometry": row[11],
                "properties": {
                    "gid": row[0],
                    "district": row[1],
                    "dist_id": row[2],
                    "tehsil": row[3],
                    "tehsil_id": row[4],
                    "kc": row[5],
                    "kc_id": row[6],
                    "mauza": row[7],
                    "mauza_id": row[8],
                    "pc": row[9],
                    "pc_id": row[10],
                },
            }

            cache.set(cache_key, feature, 60 * 60)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Mauza GeoJSON found.",
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