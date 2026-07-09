from ..common_imports import *
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator


@method_decorator(cache_page(60 * 10), name="list")
class ListTehsilView(viewsets.ViewSet):

    queryset = Tehsil.objects.all()
    serializer_class = TehsilSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):

        try:

            district_i = request.query_params.get("district_i")
            tehsil_id = request.query_params.get("id")

            if tehsil_id:

                tehsil = Tehsil.objects.filter(id=tehsil_id).first()

                if not tehsil:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="Tehsil not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                serializer = TehsilSerializer(tehsil)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Tehsil found.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            elif district_i:

                queryset = (
                    Tehsil.objects
                    .only("gid", "id", "name")
                    .filter(district_id=district_i)
                    .order_by("name")
                )

                data = [
                    {
                        "gid": t.gid,
                        "id": t.id,
                        "name": t.name,
                    }
                    for t in queryset
                ]

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Tehsils found.",
                    data=data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            queryset = (
                Tehsil.objects
                .select_related("district")
                .defer("geom")
                .order_by("name")
            )

            serializer = TehsilSerializer(queryset, many=True)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="All tehsils found.",
                data=serializer.data,
                http_status=status.HTTP_200_OK,
            ).create_response()

        except Exception as e:
            import traceback
            print(traceback.format_exc())

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

        start = time.time()

        cache_key = f"tehsil_geojson_{pk}"
        cached = cache.get(cache_key)

        if cached:
            print(
                "CACHE:",
                round((time.time() - start) * 1000, 2),
                "ms"
            )

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Tehsil GeoJSON found.",
                data=cached,
                http_status=status.HTTP_200_OK,
            ).create_response()

        try:

            db_start = time.time()

            with connection.cursor() as cursor:

                cursor.execute("""
                    SELECT
                        gid,
                        id,
                        name,
                        objectid,
                        district_i,
                        extent,
                        shape_star,
                        shape_stle,
                        ST_AsGeoJSON(geom)::json
                    FROM tehsil
                    WHERE id = %s
                """, [pk])

                row = cursor.fetchone()

            print(
                "DB + ST_AsGeoJSON:",
                round((time.time() - db_start) * 1000, 2),
                "ms"
            )

            if not row:
                return ApiResponse(
                    status=status.HTTP_404_NOT_FOUND,
                    message="Tehsil not found.",
                    data=[],
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()

            feature = {
                "type": "Feature",
                "id": row[1],
                "geometry": row[8],
                "properties": {
                    "gid": row[0],
                    "id": row[1],
                    "name": row[2],
                    "objectid": row[3],
                    "district_i": row[4],
                    "extent": row[5],
                    "shape_star": row[6],
                    "shape_stle": row[7],
                },
            }

            cache.set(cache_key, feature, 60 * 60)

            print(
                "TOTAL:",
                round((time.time() - start) * 1000, 2),
                "ms"
            )

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Tehsil GeoJSON found.",
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