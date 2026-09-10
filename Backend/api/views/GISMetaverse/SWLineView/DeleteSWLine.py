from ...common_imports import *


class DeleteSWLineView(viewsets.ViewSet):

    queryset = SWLine.objects.all()
    serializer_class = SWLineSerializer
    permission_classes = [AllowAny]

    def destroy(self, request, *args, **kwargs):

        sw_line_id = kwargs.get("pk")

        try:

            flood_extent = SWLine.objects.get(
                gid=sw_line_id
            )

        except SWLine.DoesNotExist:

            return ApiResponse(
                status=status.HTTP_404_NOT_FOUND,
                message="SWLine not found.",
                http_status=status.HTTP_404_NOT_FOUND,
            ).create_response()

        try:

            sw_line.delete()

            # Clear caches
            cache.delete(
                f"sw_line_{sw_line_id}"
            )

            cache.delete(
                f"sw_line_geojson_{sw_line_id}"
            )

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="SWLine deleted successfully.",
                http_status=status.HTTP_200_OK,
            ).create_response()

        except ProtectedError:

            return ApiResponse(
                status=status.HTTP_400_BAD_REQUEST,
                message="Cannot delete this SWLine because it is linked to other records.",
                http_status=status.HTTP_400_BAD_REQUEST,
            ).create_response()

        except Exception as e:

            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()