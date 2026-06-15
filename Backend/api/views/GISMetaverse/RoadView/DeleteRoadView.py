from ...common_imports import *


class DeleteRoadView(viewsets.ViewSet):
    queryset = Road.objects.all()
    serializer_class = RoadSerializer
    permission_classes = [AllowAny]

    def destroy(self, request, *args, **kwargs):
        try:
            obj = Road.objects.get(gid=kwargs.get("pk"))

        except Road.DoesNotExist:
            return ApiResponse(
                status=status.HTTP_404_NOT_FOUND,
                message="Road not found.",
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