from ..common_imports import *

from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator


@method_decorator(cache_page(60 * 10), name="list")
class ListAcreView(viewsets.ViewSet):
    queryset = Acre.objects.all()
    serializer_class = AcreSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):
        try:
            gid = request.query_params.get("gid")
            mauza_id = request.query_params.get("mauza_id")
            mauza = request.query_params.get("mauza")
            acre_val = request.query_params.get("acre")

            if gid:
                obj = Acre.objects.select_related(
                    "district",
                    "tehsil",
                    "mauza",
                ).filter(gid=gid).first()

                if not obj:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="Acre not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Acre found.",
                    data=AcreSerializer(obj).data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            queryset = Acre.objects.select_related(
                "district",
                "tehsil",
                "mauza",
            )

            if mauza_id:
                queryset = queryset.filter(mauza_id=mauza_id)

            if mauza:
                queryset = queryset.filter(
                    mauza__mauza__iexact=mauza
                )

            if acre_val:
                queryset = queryset.filter(acre=acre_val)

            serializer = AcreSerializer(queryset, many=True)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Acre list fetched successfully.",
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

        cache_key = f"acre_geojson_{pk}"
        cached = cache.get(cache_key)

        if cached:
            print(
                "CACHE:",
                round((time.time() - start) * 1000, 2),
                "ms"
            )

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Acre GeoJSON found.",
                data=cached,
                http_status=status.HTTP_200_OK,
            ).create_response()

        try:

            db_start = time.time()

            with connection.cursor() as cursor:

                cursor.execute("""
                    SELECT
                        gid,
                        dist_id,
                        tehsil_id,
                        mauza_id,
                        sq,
                        acre,
                        layer,
                        ST_AsGeoJSON(geom)::json
                    FROM acre
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
                    message="Acre not found.",
                    data=[],
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()

            feature = {
                "type": "Feature",
                "id": row[0],
                "geometry": row[7],
                "properties": {
                    "gid": row[0],
                    "district_id": row[1],
                    "tehsil_id": row[2],
                    "mauza_id": row[3],
                    "sq": row[4],
                    "acre": row[5],
                    "layer": row[6],
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
                message="Acre GeoJSON found.",
                data=feature,
                http_status=status.HTTP_200_OK,
            ).create_response()

        except Exception as e:

            print(traceback.format_exc())

            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Server error.",
                data=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()