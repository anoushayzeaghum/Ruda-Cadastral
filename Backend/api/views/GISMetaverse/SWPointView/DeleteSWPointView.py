from ...common_imports import *


class DeleteSWPointView(viewsets.ViewSet):
    queryset = SWPoint.objects.all()
    serializer_class = SWPointSerializer
    permission_classes = [AllowAny]

    def destroy(self, request, *args, **kwargs):
        try:
            obj = SWPoint.objects.get(gid=kwargs.get("pk"))

        except SWPoint.DoesNotExist:
            return ApiResponse(
                status=status.HTTP_404_NOT_FOUND,
                message="SW Point not found.",
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