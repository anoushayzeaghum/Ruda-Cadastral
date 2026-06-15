from ...common_imports import *


class DeleteWSLView(viewsets.ViewSet):
    queryset = WSL.objects.all()
    serializer_class = WSLSerializer
    permission_classes = [AllowAny]

    def destroy(self, request, *args, **kwargs):
        try:
            obj = WSL.objects.get(gid=kwargs.get("pk"))

        except WSL.DoesNotExist:
            return ApiResponse(
                status=status.HTTP_404_NOT_FOUND,
                message="WSL not found.",
                http_status=status.HTTP_404_NOT_FOUND,
            ).create_response()

        try:
            obj.delete()

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Deleted successfully.",
                http_status=status.HTTP_200_OK,
            ).create_response()

        except Exception as e:
            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()