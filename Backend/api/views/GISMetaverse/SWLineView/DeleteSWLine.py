from ...common_imports import *


class DeleteSWLineView(viewsets.ViewSet):

    def destroy(self, request, pk=None):

        try:

            sw_line = SWLine.objects.filter(
                gid=pk
            ).first()

            if not sw_line:

                return ApiResponse(
                    message="SW Line not found",
                    status_code=status.HTTP_404_NOT_FOUND
                ).create_response()

            sw_line.delete()

            # Clear caches
            cache.delete(
                f"sw_line_{pk}"
            )

            cache.delete(
                f"sw_line_geojson_{pk}"
            )

            return ApiResponse(
                message="SW Line deleted successfully",
                status_code=status.HTTP_200_OK
            ).create_response()

        except ProtectedError:

            return ApiResponse(
                message="SW Line cannot be deleted because it is being used by another record.",
                status_code=status.HTTP_400_BAD_REQUEST
            ).create_response()

        except Exception as e:

            return ApiResponse(
                message=str(e),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            ).create_response()