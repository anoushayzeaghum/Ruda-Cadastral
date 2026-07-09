from rest_framework.decorators import action
from ..common_imports import *
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator

@method_decorator(cache_page(60 * 10), name="list")
class ListTrijunctionView(viewsets.ViewSet):
    queryset = Trijunction.objects.all()
    serializer_class = TrijunctionSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):
        try:
            gid = request.query_params.get("gid")
            m1 = request.query_params.get("m1")
            m2 = request.query_params.get("m2")
            m3 = request.query_params.get("m3")
            junction_type = request.query_params.get("type")
            mauza_id = request.query_params.get("mauza_id")

            if gid:
                obj = Trijunction.objects.filter(gid=gid).first()

                if not obj:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="Trijunction not found.",
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                serializer = TrijunctionSerializer(obj)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Trijunction found.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            queryset = Trijunction.objects.all()

            if m1:
                queryset = queryset.filter(m1__iexact=m1)

            if m2:
                queryset = queryset.filter(m2__iexact=m2)

            if m3:
                queryset = queryset.filter(m3__iexact=m3)

            if junction_type:
                queryset = queryset.filter(type__iexact=junction_type)

            if mauza_id:
                queryset = queryset.filter(mauza_id=mauza_id)

            serializer = TrijunctionSerializer(queryset, many=True)

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Trijunctions found.",
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

        cache_key = f"trijunction_geojson_{pk}"
        cached = cache.get(cache_key)

        if cached:
            print(
                "CACHE:",
                round((time.time() - start) * 1000, 2),
                "ms"
            )

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Trijunction GeoJSON found.",
                data=cached,
                http_status=status.HTTP_200_OK,
            ).create_response()

        try:

            db_start = time.time()

            with connection.cursor() as cursor:

                cursor.execute("""
                    SELECT
                        gid,
                        type,
                        m1,
                        m1_id,
                        m2,
                        m2_id,
                        m3,
                        m3_id,
                        mauza_id,
                        layer,
                        ST_AsGeoJSON(geom)::json
                    FROM trijunction
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
                    message="Trijunction not found.",
                    data=[],
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()

            feature = {
                "type": "Feature",
                "id": row[0],
                "geometry": row[10],
                "properties": {
                    "gid": row[0],
                    "type": row[1],
                    "m1": row[2],
                    "m1_id": float(row[3]) if row[3] is not None else None,
                    "m2": row[4],
                    "m2_id": float(row[5]) if row[5] is not None else None,
                    "m3": row[6],
                    "m3_id": float(row[7]) if row[7] is not None else None,
                    "mauza_id": float(row[8]) if row[8] is not None else None,
                    "layer": row[9],
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
                message="Trijunction GeoJSON found.",
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