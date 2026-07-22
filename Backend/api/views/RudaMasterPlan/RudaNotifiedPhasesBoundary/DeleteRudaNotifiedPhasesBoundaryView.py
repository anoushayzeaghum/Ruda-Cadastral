from ...common_imports import *
from api.models import RudaNotifiedPhasesBoundary
from api.serializers import RudaNotifiedPhasesBoundarySerializer


class DeleteRudaNotifiedPhasesBoundaryView(viewsets.ViewSet):
    queryset = RudaNotifiedPhasesBoundary.objects.all()
    serializer_class = RudaNotifiedPhasesBoundarySerializer
    permission_classes = [AllowAny]

    def destroy(self, request, *args, **kwargs):
        record_id = kwargs.get("pk")

        try:
            record = RudaNotifiedPhasesBoundary.objects.get(gid=record_id)
            record.delete()

            return ApiResponse(
                status=status.HTTP_200_OK,
                message="RUDA notified phases boundary deleted successfully.",
                http_status=status.HTTP_200_OK,
            ).create_response()

        except RudaNotifiedPhasesBoundary.DoesNotExist:
            return ApiResponse(
                status=status.HTTP_404_NOT_FOUND,
                message="RUDA notified phases boundary not found.",
                http_status=status.HTTP_404_NOT_FOUND,
            ).create_response()

        except Exception as e:
            return ApiResponse(
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                message="Exception error.",
                data=str(e),
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ).create_response()
