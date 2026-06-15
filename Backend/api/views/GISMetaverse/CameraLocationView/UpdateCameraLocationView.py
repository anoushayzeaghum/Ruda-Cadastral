from ...common_imports import *


class UpdateCameraLocationView(viewsets.ViewSet):
    queryset = CameraLocation.objects.all()
    serializer_class = CameraLocationSerializer
    permission_classes = [AllowAny]

    def update(self, request, *args, **kwargs):
        try:
            obj = CameraLocation.objects.get(gid=kwargs.get("pk"))

        except CameraLocation.DoesNotExist:
            return ApiResponse(
                status=status.HTTP_404_NOT_FOUND,
                message="CameraLocation not found.",
                http_status=status.HTTP_404_NOT_FOUND,
            ).create_response()

        try:
            serializer = CameraLocationSerializer(
                obj,
                data=request.data,
                partial=True
            )

            if serializer.is_valid():
                obj = serializer.save()

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="Updated successfully.",
                    data=CameraLocationSerializer(obj).data,
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