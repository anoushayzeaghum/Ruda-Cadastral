from ..common_imports import *
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator

@method_decorator(cache_page(60 * 10), name="list")
class ListRudaBoundaryView(viewsets.ViewSet):
    queryset = RudaBoundary.objects.all()
    serializer_class = RudaBoundarySerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):
        try:
            gid = request.query_params.get("gid")
            name = request.query_params.get("name")
            oid = request.query_params.get("oid")

            # Single RudaBoundary by gid
            if gid:
                ruda_boundary = RudaBoundary.objects.filter(gid=gid).first()

                if not ruda_boundary:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="RudaBoundary not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                serializer = RudaBoundarySerializer(ruda_boundary)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="RudaBoundary found.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            # Filter by name
            elif name:
                queryset = RudaBoundary.objects.filter(name=name)
                serializer = RudaBoundarySerializer(queryset, many=True)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="RudaBoundary records found for name.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            # Filter by oid
            elif oid:
                queryset = RudaBoundary.objects.filter(oid=oid)
                serializer = RudaBoundarySerializer(queryset, many=True)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="RudaBoundary records found for oid.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            # All RudaBoundary records
            else:
                queryset = RudaBoundary.objects.all()
                serializer = RudaBoundarySerializer(queryset, many=True)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="All RudaBoundary records found.",
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

        start = time.time()

        cache_key = f"ruda_boundary_geojson_{pk}"
        cached = cache.get(cache_key)

        if cached:
            print(
                "CACHE:",
                round((time.time() - start) * 1000, 2),
                "ms"
            )

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="RudaBoundary GeoJSON found.",
                data=cached,
                http_status=status.HTTP_200_OK,
            ).create_response()

        try:

            db_start = time.time()

            with connection.cursor() as cursor:

                cursor.execute("""
                    SELECT
                        gid,
                        oid,
                        name,
                        folderpath,
                        symbolid,
                        altmode,
                        base,
                        clamped,
                        extruded,
                        snippet,
                        popupinfo,
                        shape_leng,
                        shape_area,
                        ST_AsGeoJSON(
                            ST_SimplifyPreserveTopology(
                                geom,
                                0.00002
                            )
                        )::json
                    FROM ruda_boundary
                    WHERE gid = %s
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
                    message="RudaBoundary not found.",
                    data=[],
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()

            feature = {
                "type": "Feature",
                "id": row[0],
                "geometry": row[13],
                "properties": {
                    "gid": row[0],
                    "oid": float(row[1]) if row[1] is not None else None,
                    "name": row[2],
                    "folderpath": row[3],
                    "symbolid": float(row[4]) if row[4] is not None else None,
                    "altmode": row[5],
                    "base": float(row[6]) if row[6] is not None else None,
                    "clamped": row[7],
                    "extruded": row[8],
                    "snippet": row[9],
                    "popupinfo": row[10],
                    "shape_leng": float(row[11]) if row[11] is not None else None,
                    "shape_area": float(row[12]) if row[12] is not None else None,
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
                message="RudaBoundary GeoJSON found.",
                data=feature,
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