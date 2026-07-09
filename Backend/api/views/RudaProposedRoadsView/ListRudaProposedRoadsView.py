from ..common_imports import *
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator

@method_decorator(cache_page(60 * 10), name="list")
class ListRudaProposedRoadsView(viewsets.ViewSet):
    permission_classes = [AllowAny]

    def list(self, request):
        try:
            queryset = RudaProposedRoads.objects.all()

            gid = request.query_params.get("gid")
            name = request.query_params.get("name")

            if gid:
                queryset = queryset.filter(gid=gid)

            if name:
                queryset = queryset.filter(name__icontains=name)

            serializer = RudaProposedRoadsSerializer(queryset, many=True)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Roads fetched successfully",
                data=serializer.data,
                http_status=status.HTTP_200_OK,
            ).create_response()

        except Exception as e:
            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message=str(e),
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

        cache_key = f"ruda_proposed_roads_geojson_{pk}"
        cached = cache.get(cache_key)

        if cached:
            print(
                "CACHE:",
                round((time.time() - start) * 1000, 2),
                "ms"
            )

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Road GeoJSON found.",
                data=cached,
                http_status=status.HTTP_200_OK,
            ).create_response()

        try:

            db_start = time.time()

            with connection.cursor() as cursor:

                cursor.execute("""
                    SELECT
                        gid,
                        kml_id,
                        name,
                        kml_desc,
                        fid,
                        entity,
                        layer,
                        color,
                        linetype,
                        elevation,
                        linewt,
                        refname,
                        ST_AsGeoJSON(geom)::json
                    FROM ruda_proposed_roads
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
                    message="Road not found.",
                    data=[],
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()

            feature = {
                "type": "Feature",
                "id": row[0],
                "geometry": row[12],
                "properties": {
                    "gid": row[0],
                    "kml_id": row[1],
                    "name": row[2],
                    "kml_desc": row[3],
                    "fid": row[4],
                    "entity": row[5],
                    "layer": row[6],
                    "color": row[7],
                    "linetype": row[8],
                    "elevation": float(row[9]) if row[9] is not None else None,
                    "linewt": float(row[10]) if row[10] is not None else None,
                    "refname": row[11],
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
                message="Road GeoJSON found.",
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