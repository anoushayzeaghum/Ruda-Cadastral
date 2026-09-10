from ...common_imports import *


class UpdateSWLineView(viewsets.ViewSet):

    queryset = SWLine.objects.all()
    serializer_class = SWLineSerializer
    permission_classes = [AllowAny]

    def update(self, request, *args, **kwargs):

        data = request.data
        sw_line_id = kwargs.get("pk")

        try:

            sw_line = SWLine.objects.get(
                gid=sw_line_id
            )

        except SWLine.DoesNotExist:

            return ApiResponse(
                status=status.HTTP_404_NOT_FOUND,
                message="SW Line not found.",
                http_status=status.HTTP_404_NOT_FOUND,
            ).create_response()

        try:

            serializer = SWLineSerializer(
                sw_line,
                data=data,
                partial=True,
            )

            if serializer.is_valid():

                serializer.save()

                # Clear caches
                cache.delete(
                    f"sw_line_{sw_line_id}"
                )

                cache.delete(
                    f"sw_line_geojson_{sw_line_id}"
                )

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="SW Line updated successfully.",
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