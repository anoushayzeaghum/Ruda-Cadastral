from ...common_imports import *


class DeleteLahoreRingRoadView(viewsets.ViewSet):
    queryset = LahoreRingRoad.objects.all()
    serializer_class = LahoreRingRoadSerializer
    permission_classes = [AllowAny]

    def destroy(self, request, *args, **kwargs):
        record_id = kwargs.get("pk")

        try:
            record = LahoreRingRoad.objects.get(gid=record_id)
            record.delete()

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="Lahore Ring Road deleted successfully.",
                http_status=status.HTTP_200_OK,
            ).create_response()

        except LahoreRingRoad.DoesNotExist:
            return ApiResponse(
                status=status.HTTP_404_NOT_FOUND,
                message="Lahore Ring Road not found.",
                http_status=status.HTTP_404_NOT_FOUND,
            ).create_response()

        except Exception as e:
            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Exception error.",
                data=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()