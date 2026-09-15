from ...common_imports import *


class ListSWLineView(viewsets.ViewSet):
    queryset = SWLine.objects.all()
    serializer_class = SWLineSerializer
    permission_classes = [AllowAny]

    # -----------------------------
    # List / Single SW Line
    # -----------------------------
    def list(self, request, *args, **kwargs):

        try:
            sw_line_id = (
                request.query_params.get("sw_line_id")
                or request.query_params.get("id")
                or request.query_params.get("gid")
            )

            # -----------------------------
            # Single SW Line
            # -----------------------------
            if sw_line_id:

                cache_key = f"sw_line_{sw_line_id}"

                cached = cache.get(cache_key)

                if cached is not None:
                    return ApiResponse(
                        status=status.HTTP_200_OK,
                        message="SW Line found.",
                        data=cached,
                        http_status=status.HTTP_200_OK,
                    ).create_response()

                sw_line = SWLine.objects.filter(
                    gid=sw_line_id
                ).first()

                if not sw_line:
                    return ApiResponse(
                        status=status.HTTP_404_NOT_FOUND,
                        message="SW Line not found.",
                        data=[],
                        http_status=status.HTTP_404_NOT_FOUND,
                    ).create_response()

                serializer = SWLineSerializer(sw_line)

                cache.set(
                    cache_key,
                    serializer.data,
                    60 * 60,
                )

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="SW Line found.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            # -----------------------------
            # List All SW Lines
            # -----------------------------
            queryset = SWLine.objects.all().order_by("gid")

            serializer = SWLineSerializer(
                queryset,
                many=True,
            )

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="SW Lines found.",
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

        cache_key = f"sw_line_geojson_{pk}"

        try:

            # -----------------------------
            # Check Cache
            # -----------------------------
            cached = cache.get(cache_key)

            if cached is not None:
                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="SW Line GeoJSON found.",
                    data=cached,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            # -----------------------------
            # Get SW Line
            # -----------------------------
            sw_line = SWLine.objects.filter(
                gid=pk
            ).first()

            if not sw_line:
                return ApiResponse(
                    status=status.HTTP_404_NOT_FOUND,
                    message="SW Line not found.",
                    data=[],
                    http_status=status.HTTP_404_NOT_FOUND,
                ).create_response()

            # -----------------------------
            # Serialize
            # -----------------------------
            serializer = SWLineSerializer(sw_line)

            feature = serializer.data

            # -----------------------------
            # Cache
            # -----------------------------
            cache.set(
                cache_key,
                feature,
                60 * 60,
            )

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="SW Line GeoJSON found.",
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