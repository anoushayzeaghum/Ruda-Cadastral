from ..common_imports import *

class DeleteRudaBoundaryView(viewsets.ViewSet):
    queryset = RudaBoundary.objects.all()
    serializer_class = RudaBoundarySerializer
    permission_classes = [AllowAny]

    def destroy(self, request, *args, **kwargs):
        ruda_boundary_id = kwargs.get("pk")

        try:
            ruda_boundary = RudaBoundary.objects.get(gid=ruda_boundary_id)
        except RudaBoundary.DoesNotExist:
            return ApiResponse(
                status=status.HTTP_404_NOT_FOUND,
                message="RudaBoundary not found.",
                http_status=status.HTTP_404_NOT_FOUND,
            ).create_response()

        try:
            ruda_boundary.delete()

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="RudaBoundary deleted successfully.",
                http_status=status.HTTP_200_OK,
            ).create_response()

        except ProtectedError:
            return ApiResponse(
                status=status.HTTP_400_BAD_REQUEST,
                message="Cannot delete this RudaBoundary because it is linked to other records.",
                http_status=status.HTTP_400_BAD_REQUEST,
            ).create_response()

        except Exception as e:
            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()