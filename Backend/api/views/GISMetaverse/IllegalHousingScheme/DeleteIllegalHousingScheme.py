from ...common_imports import *


class DeleteIllegalHousingSchemeView(viewsets.ViewSet):
    queryset = IllegalHousingScheme.objects.all()
    serializer_class = IllegalHousingSchemeSerializer
    permission_classes = [AllowAny]

    def destroy(self, request, *args, **kwargs):
        try:
            obj = IllegalHousingScheme.objects.get(
                gid=kwargs.get("pk")
            )

        except IllegalHousingScheme.DoesNotExist:
            return ApiResponse(
                status=status.HTTP_404_NOT_FOUND,
                message="Illegal Housing Scheme not found.",
                http_status=status.HTTP_404_NOT_FOUND,
            ).create_response()

        try:
            obj.delete()

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Illegal Housing Scheme deleted successfully.",
                http_status=status.HTTP_200_OK,
            ).create_response()

        except Exception as e:
            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()
