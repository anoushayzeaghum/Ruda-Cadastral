from ..common_imports import *


class UpdatePHSPPPSchemeView(viewsets.ViewSet):
    queryset = PHSPPPScheme.objects.all()
    serializer_class = PHSPPPSchemeSerializer
    permission_classes = [AllowAny]

    def update(self, request, *args, **kwargs):
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
            serializer = PHSPPPSchemeSerializer(
                obj,
                data=request.data,
                partial=True
            )

            if serializer.is_valid():
                obj = serializer.save()

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="PPP Scheme updated successfully.",
                    data=PHSPPPSchemeSerializer(obj).data,
                    http_status=status.HTTP_200_OK,
                ).create_response()

            return ApiResponse(
                status=status.HTTP_400_BAD_REQUEST,
                message="Validation error.",
                data=serializer.errors,
                http_status=status.HTTP_400_BAD_REQUEST,
            ).create_response()

        except Exception as e:
            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Exception error.",
                data=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()