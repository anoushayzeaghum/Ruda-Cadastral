from ...common_imports import *
from api.models import RudaNotifiedPhasesBoundary
from api.serializers import RudaNotifiedPhasesBoundarySerializer


class CreateRudaNotifiedPhasesBoundaryView(viewsets.ViewSet):
    queryset = RudaNotifiedPhasesBoundary.objects.all()
    serializer_class = RudaNotifiedPhasesBoundarySerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        try:
            serializer = RudaNotifiedPhasesBoundarySerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            record = serializer.save()

            return ApiResponse(
                status=status.HTTP_201_CREATED,
                message="RUDA notified phases boundary created successfully.",
                data=RudaNotifiedPhasesBoundarySerializer(record).data,
                http_status=status.HTTP_201_CREATED,
            ).create_response()

        except serializers.ValidationError as e:
            return ApiResponse(
                status=status.HTTP_400_BAD_REQUEST,
                message="Serializer error.",
                data=e.detail,
                http_status=status.HTTP_400_BAD_REQUEST,
            ).create_response()

        except Exception as e:
            return ApiResponse(
                status=status.HTTP_400_BAD_REQUEST,
                message="Exception error.",
                data=str(e),
                http_status=status.HTTP_400_BAD_REQUEST,
            ).create_response()
