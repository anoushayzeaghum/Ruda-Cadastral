from ...common_imports import *


class ListSWLineView(viewsets.ViewSet):

    @method_decorator(cache_page(60 * 10), name="list")
    def list(self, request):

        sw_line_id = (
            request.query_params.get("sw_line_id")
            or request.query_params.get("id")
            or request.query_params.get("gid")
        )

        # -----------------------------------------
        # Get single SW Line
        # -----------------------------------------
        if sw_line_id:
            try:
                sw_line = SWLine.objects.filter(
                    gid=sw_line_id
                ).first()

                if not sw_line:
                    return ApiResponse(
                        message="SW Line not found",
                        status_code=status.HTTP_404_NOT_FOUND
                    ).create_response()

                cache_key = f"sw_line_{sw_line_id}"

                cached_data = cache.get(cache_key)

                if cached_data:
                    return ApiResponse(
                        data=cached_data,
                        message="SW Line fetched successfully",
                        status_code=status.HTTP_200_OK
                    ).create_response()

                serializer = SWLineSerializer(sw_line)

                data = serializer.data

                cache.set(
                    cache_key,
                    data,
                    timeout=60 * 10
                )

                return ApiResponse(
                    data=data,
                    message="SW Line fetched successfully",
                    status_code=status.HTTP_200_OK
                ).create_response()

            except Exception as e:

                return ApiResponse(
                    message=str(e),
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
                ).create_response()

        # -----------------------------------------
        # Get all SW Lines
        # -----------------------------------------
        try:
            sw_lines = (
                SWLine.objects
                .only(
                    "gid",
                    "objectid",
                    "name",
                    "dia",
                    "shape_leng",
                    "project_id",
                    "geom",
                )
                .order_by("gid")
            )

            serializer = SWLineSerializer(
                sw_lines,
                many=True
            )

            return ApiResponse(
                data=serializer.data,
                message="SW Lines fetched successfully",
                status_code=status.HTTP_200_OK
            ).create_response()

        except Exception as e:

            return ApiResponse(
                message=str(e),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            ).create_response()

    # -----------------------------------------
    # GeoJSON
    # -----------------------------------------
    @action(
        detail=True,
        methods=["get"],
        url_path="geojson",
        url_name="geojson"
    )
    def geojson(self, request, pk=None):

        cache_key = f"sw_line_geojson_{pk}"

        cached_data = cache.get(cache_key)

        if cached_data:
            return ApiResponse(
                data=cached_data,
                message="SW Line GeoJSON fetched successfully",
                status_code=status.HTTP_200_OK
            ).create_response()

        sw_line = SWLine.objects.filter(
            gid=pk
        ).first()

        if not sw_line:
            return ApiResponse(
                message="SW Line not found",
                status_code=status.HTTP_404_NOT_FOUND
            ).create_response()

        serializer = SWLineSerializer(sw_line)

        data = serializer.data

        cache.set(
            cache_key,
            data,
            timeout=60 * 10
        )

        return ApiResponse(
            data=data,
            message="SW Line GeoJSON fetched successfully",
            status_code=status.HTTP_200_OK
        ).create_response()