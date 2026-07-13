from ...common_imports import *


class UpdateHardoSohalMuslimRoadView(viewsets.ViewSet):
    queryset = HardoSohalMuslimRoad.objects.all()
    serializer_class = HardoSohalMuslimRoadSerializer
    permission_classes = [AllowAny]

    def update(self, request, *args, **kwargs):
        record_id = kwargs.get("pk")

        try:
            record = HardoSohalMuslimRoad.objects.get(gid=record_id)
        except HardoSohalMuslimRoad.DoesNotExist:
            return ApiResponse(
                status=status.HTTP_404_NOT_FOUND,
                message="HardoSohalMuslimRoad not found.",
                http_status=status.HTTP_404_NOT_FOUND,
            ).create_response()

        try:
            serializer = HardoSohalMuslimRoadSerializer(
                record,
                data=request.data,
                partial=True,
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="HardoSohalMuslimRoad updated successfully.",
                data=serializer.data,
                http_status=status.HTTP_200_OK,
            ).create_response()

        except serializers.ValidationError as e:
            return ApiResponse(
                status=status.HTTP_400_BAD_REQUEST,
                message="Validation error.",
                data=e.detail,
                http_status=status.HTTP_400_BAD_REQUEST,
            ).create_response()

        except Exception as e:
            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Exception error.",
                data=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()
