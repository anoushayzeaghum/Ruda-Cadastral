from ..common_imports import *

from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator

@method_decorator(cache_page(60 * 10), name="list")
class ListDistrictView(viewsets.ViewSet):

    queryset = District.objects.all()
    serializer_class = DistrictSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):

        try:
            district_id = request.query_params.get("id")

            # Single district with geometry
            if district_id:

                district = District.objects.get(id=district_id)

                serializer = DistrictSerializer(district)

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="District found.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()


            # Dropdown list (without geometry)
            queryset = (
                District.objects
                .only("gid", "id", "name")
                .order_by("name")
            )

            data = [
                {
                    "gid": district.gid,
                    "id": district.id,
                    "name": district.name,
                }
                for district in queryset
            ]


            return ApiResponse(
                status=status.HTTP_200_OK,
                message="All districts found.",
                data=data,
                http_status=status.HTTP_200_OK,
            ).create_response()


        except District.DoesNotExist:

            return ApiResponse(
                status=status.HTTP_404_NOT_FOUND,
                message="District not found.",
                data=[],
                http_status=status.HTTP_404_NOT_FOUND,
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

        cache_key = f"district_geojson_{pk}"
        cached = cache.get(cache_key)

        if cached:
            print("CACHE:", round((time.time() - start) * 1000, 2), "ms")

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="District GeoJSON found.",
                data=cached,
                http_status=status.HTTP_200_OK,
            ).create_response()

        with connection.cursor() as cursor:

            db_start = time.time()

            cursor.execute("""
                SELECT
                    gid,
                    id,
                    name,
                    objectid,
                    extent,
                    shape_star,
                    shape_stle,
                    ST_AsGeoJSON(geom)::json
                FROM district
                WHERE id=%s
            """, [pk])

            row = cursor.fetchone()

            print(
                "DB + ST_AsGeoJSON:",
                round((time.time()-db_start)*1000,2),
                "ms"
            )

        if not row:

            return ApiResponse(
                status=status.HTTP_404_NOT_FOUND,
                message="District not found.",
                data=[],
                http_status=status.HTTP_404_NOT_FOUND,
            ).create_response()

        feature = {
            "type": "Feature",
            "id": row[1],
            "geometry": row[7],
            "properties": {
                "gid": row[0],
                "id": row[1],
                "name": row[2],
                "objectid": row[3],
                "extent": row[4],
                "shape_star": row[5],
                "shape_stle": row[6],
            },
        }

        cache.set(cache_key, feature, 60 * 60)

        print(
            "TOTAL:",
            round((time.time()-start)*1000,2),
            "ms"
        )

        return ApiResponse(
            status=status.HTTP_200_OK,
            message="District GeoJSON found.",
            data=feature,
            http_status=status.HTTP_200_OK,
        ).create_response()