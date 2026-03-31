from ..common_imports import *


class CreateRudaBoundaryView(viewsets.ViewSet):
    queryset = RudaBoundary.objects.all()
    serializer_class = RudaBoundarySerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        data = request.data

        try:
            serializer = RudaBoundarySerializer(data=data)
            serializer.is_valid(raise_exception=True)

            ruda_boundary = serializer.save()

            return ApiResponse(
                status=status.HTTP_201_CREATED,
                message="RudaBoundary created successfully.",
                data=RudaBoundarySerializer(ruda_boundary).data,
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