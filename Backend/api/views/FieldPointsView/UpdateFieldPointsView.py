from ..common_imports import *


class UpdateFieldPointsView(viewsets.ViewSet):
    queryset = FieldPoints.objects.all()
    serializer_class = FieldPointsSerializer
    permission_classes = [AllowAny]

    def update(self, request, *args, **kwargs):
        try:
            obj = FieldPoints.objects.get(gid=kwargs.get("pk"))

        except FieldPoints.DoesNotExist:
            return ApiResponse(
                status=status.HTTP_404_NOT_FOUND,
                message="FieldPoints not found.",
                http_status=status.HTTP_404_NOT_FOUND,
            ).create_response()

        try:
            serializer = FieldPointsSerializer(obj, data=request.data, partial=True)

            if serializer.is_valid():
                obj = serializer.save()

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="FieldPoints updated successfully.",
                    data=FieldPointsSerializer(obj).data,
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