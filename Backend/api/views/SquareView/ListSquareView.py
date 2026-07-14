from ..common_imports import *
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator


@method_decorator(cache_page(60 * 10), name="list")
class ListSquareView(viewsets.ViewSet):
    queryset = Square.objects.all()
    serializer_class = SquareSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):
        try:
            gid = request.query_params.get("gid")
            mauza = (
                request.query_params.get("mauza")
                or request.query_params.get("mauza_id")
            )
            sq = request.query_params.get("sq")

            queryset = Square.objects.select_related(
                "district",
                "tehsil",
                "mauza",
            )

            if gid:
                obj = queryset.filter(gid=gid).first()

                if not obj:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="Square not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Square found.",
                    data=SquareSerializer(obj).data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            if mauza:
                try:
                    queryset = queryset.filter(
                        mauza__mauza_id=float(mauza)
                    )
                except ValueError:
                    queryset = queryset.filter(
                        mauza__mauza__iexact=mauza
                    )

            if sq:
                queryset = queryset.filter(sq=sq)

            serializer = SquareSerializer(queryset, many=True)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Squares fetched successfully.",
                data=serializer.data,
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

        start = time.time()

        cache_key = f"square_geojson_{pk}"
        cached = cache.get(cache_key)

        if cached:
            print(
                "CACHE:",
                round((time.time() - start) * 1000, 2),
                "ms"
            )

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Square GeoJSON found.",
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
                        kc,
                        kc_id,
                        pc,
                        pc_id,
                        sq,
                        layer,
                        ST_AsGeoJSON(geom)::json
                    FROM square
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
                    message="Square not found.",
                    data=[],
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()

            feature = {
                "type": "Feature",
                "id": row[0],
                "geometry": row[11],
                "properties": {
                    "gid": row[0],
                    "district_id": row[1],
                    "tehsil_id": row[2],
                    "mauza_id": row[3],
                    "kc": row[4],
                    "kc_id": row[5],
                    "pc": row[6],
                    "pc_id": row[7],
                    "sq": row[8],
                    "layer": row[10],
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
                message="Square GeoJSON found.",
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