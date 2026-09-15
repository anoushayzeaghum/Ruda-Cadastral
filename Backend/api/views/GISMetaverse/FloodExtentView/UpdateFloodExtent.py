from ...common_imports import *


class UpdateFloodExtentView(viewsets.ViewSet):

    queryset = FloodExtent.objects.all()
    serializer_class = FloodExtentSerializer
    permission_classes = [AllowAny]

    def update(self, request, *args, **kwargs):

        data = request.data
        flood_extent_id = kwargs.get("pk")

        try:

            flood_extent = FloodExtent.objects.get(
                gid=flood_extent_id
            )

        except FloodExtent.DoesNotExist:

            return ApiResponse(
                status=status.HTTP_404_NOT_FOUND,
                message="Flood extent not found.",
                http_status=status.HTTP_404_NOT_FOUND,
            ).create_response()

        try:

            serializer = FloodExtentSerializer(
                flood_extent,
                data=data,
                partial=True,
            )

            if serializer.is_valid():

                serializer.save()

                # Clear caches
                cache.delete(
                    f"flood_extent_{flood_extent_id}"
                )

                cache.delete(
                    f"flood_extent_geojson_{flood_extent_id}"
                )

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Flood extent updated successfully.",
                    data=serializer.data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            return ApiResponse(
                status=status.HTTP_400_BAD_REQUEST,
                message="Validation error.",
                data=serializer.errors,
                http_status=status.HTTP_400_BAD_REQUEST,
            ).create_response()

        except Exception as e:

            import traceback

            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Exception error.",
                data=str(e),
                error_traceback=traceback.format_exc(),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()