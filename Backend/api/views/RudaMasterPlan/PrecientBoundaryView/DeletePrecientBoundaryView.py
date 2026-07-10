from ...common_imports import *


class DeletePrecientBoundaryView(viewsets.ViewSet):
    queryset = PrecientBoundary.objects.all()
    serializer_class = PrecientBoundarySerializer
    permission_classes = [AllowAny]

    def destroy(self, request, *args, **kwargs):
        record_id = kwargs.get("pk")

        try:
            record = PrecientBoundary.objects.get(gid=record_id)
        except PrecientBoundary.DoesNotExist:
            return ApiResponse(
                status=status.HTTP_404_NOT_FOUND,
                message="PrecientBoundary not found.",
                http_status=status.HTTP_404_NOT_FOUND,
            ).create_response()

        try:
            record.delete()

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="PrecientBoundary deleted successfully.",
                http_status=status.HTTP_200_OK,
            ).create_response()

        except ProtectedError:
            return ApiResponse(
                status=status.HTTP_400_BAD_REQUEST,
                message="Cannot delete this PrecientBoundary because it is linked to other records.",
                http_status=status.HTTP_400_BAD_REQUEST,
            ).create_response()

        except Exception as e:
            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()
