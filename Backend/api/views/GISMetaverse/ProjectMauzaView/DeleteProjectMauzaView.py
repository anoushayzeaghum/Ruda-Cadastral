from ...common_imports import *


class DeleteProjectMauzaView(viewsets.ViewSet):
    queryset = ProjectMauza.objects.all()
    serializer_class = ProjectMauzaSerializer
    permission_classes = [AllowAny]

    def destroy(self, request, pk=None):
        try:
            obj = ProjectMauza.objects.get(id=pk)
            obj.delete()

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Deleted successfully."
            ).create_response()

        except ProjectMauza.DoesNotExist:
            return ApiResponse(
                status=status.HTTP_404_NOT_FOUND,
                message="Not found."
            ).create_response()