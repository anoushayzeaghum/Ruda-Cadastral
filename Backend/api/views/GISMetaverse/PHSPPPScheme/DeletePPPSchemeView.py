from ...common_imports import *


class DeletePHSPPPSchemeView(viewsets.ViewSet):
    queryset = PHSPPPScheme.objects.all()
    serializer_class = PHSPPPSchemeSerializer
    permission_classes = [AllowAny]

    def destroy(self, request, *args, **kwargs):
        try:
            obj = PHSPPPScheme.objects.get(
                gid=kwargs.get("pk")
            )

        except PHSPPPScheme.DoesNotExist:
            return ApiResponse(
                status=status.HTTP_404_NOT_FOUND,
                message="PPP Scheme not found.",
                http_status=status.HTTP_404_NOT_FOUND,
            ).create_response()

        try:
            obj.delete()

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="PPP Scheme deleted successfully.",
                http_status=status.HTTP_200_OK,
            ).create_response()

        except Exception as e:
            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()