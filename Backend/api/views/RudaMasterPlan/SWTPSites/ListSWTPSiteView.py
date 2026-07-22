from ...common_imports import *
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator


@method_decorator(cache_page(60 * 10), name="list")
class ListSWTPSiteView(viewsets.ViewSet):

    queryset = SWTPSite.objects.all()
    serializer_class = SWTPSiteSerializer
    permission_classes = [AllowAny]

    filter_fields = [
        "name",
        "area_225ac",
        "remarks",
        "shape_leng",
        "shape_area",
    ]

    def list(self, request, *args, **kwargs):
        try:
            gid = request.query_params.get("gid")

            # -----------------------------
            # Single Feature
            # -----------------------------
            if gid:
                cache_key = f"swtp_sites_{gid}"
                cached = cache.get(cache_key)

                if cached:
                    return ApiResponse(
                        status=status.HTTP_200_OK,
                        message="SWTPSite found.",
                        data=cached,
                        http_status=status.HTTP_200_OK,
                    ).create_response()

                with connection.cursor() as cursor:
                    cursor.execute(
                        """
                        SELECT
                            gid,
                            name,
                            area_225ac,
                            remarks,
                            shape_leng,
                            shape_area,
                            ST_AsGeoJSON(geom)::json
                        FROM swtp_sites
                        WHERE gid=%s
                        """,
                        [gid],
                    )
                    row = cursor.fetchone()

                if not row:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="SWTPSite not found.",
                        data=[],
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                feature = {
                    "type": "Feature",
                    "id": row[0],
                    "geometry": row[6],
                    "properties": {
                        "gid": row[0],
                        "name": row[1],
                        "area_225ac": row[2],
                        "remarks": row[3],
                        "shape_leng": row[4],
                        "shape_area": row[5],
                    },
                }

                cache.set(cache_key, feature, 60 * 60)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="SWTPSite found.",
                    data=feature,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            # -----------------------------
            # List
            # -----------------------------
            filters = {}

            for field in self.filter_fields:
                value = request.query_params.get(field)
                if value not in [None, ""]:
                    filters[field] = value

            queryset = SWTPSite.objects.only(
                "gid",
                "name",
                "area_225ac",
                "remarks",
                "shape_leng",
                "shape_area",
                "geom",
            )

            if filters:
                queryset = queryset.filter(**filters)

            serializer = SWTPSiteSerializer(queryset, many=True)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="SWTPSite records found.",
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
        cache_key = f"swtp_sites_geojson_{pk}"
        cached = cache.get(cache_key)

        if cached:
            return ApiResponse(
                status=status.HTTP_200_OK,
                message="SWTPSite GeoJSON found.",
                data=cached,
                http_status=status.HTTP_200_OK,
            ).create_response()

        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT
                        gid,
                        name,
                        area_225ac,
                        remarks,
                        shape_leng,
                        shape_area,
                        ST_AsGeoJSON(geom)::json
                    FROM swtp_sites
                    WHERE gid=%s
                    """,
                    [pk],
                )
                row = cursor.fetchone()

            if not row:
                return ApiResponse(
                    status=status.HTTP_404_NOT_FOUND,
                    message="SWTPSite not found.",
                    data=[],
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()

            feature = {
                "type": "Feature",
                "id": row[0],
                "geometry": row[6],
                "properties": {
                    "gid": row[0],
                    "name": row[1],
                    "area_225ac": row[2],
                    "remarks": row[3],
                    "shape_leng": row[4],
                    "shape_area": row[5],
                },
            }

            cache.set(cache_key, feature, 60 * 60)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="SWTPSite GeoJSON found.",
                data=feature,
                http_status=status.HTTP_200_OK,
            ).create_response()

        except Exception as e:
            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Server error.",
                data=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()
