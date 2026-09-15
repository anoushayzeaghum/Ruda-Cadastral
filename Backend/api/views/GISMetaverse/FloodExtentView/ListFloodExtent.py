from ...common_imports import *

from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator


@method_decorator(cache_page(60 * 10), name="list")
class ListFloodExtentView(viewsets.ViewSet):

    queryset = FloodExtent.objects.all()
    serializer_class = FloodExtentSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):

        try:

            flood_extent_id = (
                request.query_params.get("flood_extent_id")
                or request.query_params.get("id")
                or request.query_params.get("gid")
            )

            # -----------------------------
            # Single Flood Extent
            # -----------------------------
            if flood_extent_id:

                cache_key = f"flood_extent_{flood_extent_id}"

                cached = cache.get(cache_key)

                if cached:

                    return ApiResponse(
                        status=status.HTTP_200_OK,
                        message="Flood extent found.",
                        data=cached,
                        http_status=status.HTTP_200_OK,
                    ).create_response()

                flood_extent = FloodExtent.objects.filter(
                    gid=flood_extent_id
                ).first()

                if not flood_extent:

                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="Flood extent not found.",
                        data=[],
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                serializer = FloodExtentSerializer(flood_extent)

                cache.set(
                    cache_key,
                    serializer.data,
                    60 * 60,
                )

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Flood extent found.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            # -----------------------------
            # List
            # -----------------------------

            queryset = FloodExtent.objects.only(
                "gid",
                "name",
                "area",
                "year",
                "geom",
            ).order_by("gid")

            serializer = FloodExtentSerializer(
                queryset,
                many=True,
            )

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Flood extents found.",
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

    # -----------------------------
    # GeoJSON
    # -----------------------------

    @action(
        detail=True,
        methods=["get"],
        url_path="geojson",
        url_name="geojson",
    )
    def geojson(self, request, pk=None):

        cache_key = f"flood_extent_geojson_{pk}"

        cached = cache.get(cache_key)

        if cached:

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Flood extent GeoJSON found.",
                data=cached,
                http_status=status.HTTP_200_OK,
            ).create_response()

        try:

            flood_extent = FloodExtent.objects.filter(
                gid=pk
            ).first()

            if not flood_extent:

                return ApiResponse(
                    status=status.HTTP_404_NOT_FOUND,
                    message="Flood extent not found.",
                    data=[],
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()

            serializer = FloodExtentSerializer(
                flood_extent
            )

            feature = serializer.data

            cache.set(
                cache_key,
                feature,
                60 * 60,
            )

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Flood extent GeoJSON found.",
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