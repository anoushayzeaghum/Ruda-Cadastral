from ..common_imports import *

class UpdateRudaBoundaryView(viewsets.ViewSet):
    queryset = RudaBoundary.objects.all()
    serializer_class = RudaBoundarySerializer
    permission_classes = [AllowAny]

    def update(self, request, *args, **kwargs):
        data = request.data
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
            serializer = RudaBoundarySerializer(ruda_boundary, data=data, partial=True)

            if serializer.is_valid():
                serializer.save()

                return ApiResponse(
                    status=status.HTTP_200_OK,
                    message="RudaBoundary updated successfully.",
                    data=serializer.data,
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