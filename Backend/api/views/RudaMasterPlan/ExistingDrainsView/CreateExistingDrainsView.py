from ...common_imports import *


class CreateExistingDrainsView(viewsets.ViewSet):
    queryset = ExistingDrains.objects.all()
    serializer_class = ExistingDrainsSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        data = request.data

        try:
            serializer = ExistingDrainsSerializer(data=data)
            serializer.is_valid(raise_exception=True)

            record = serializer.save()

            return ApiResponse(
                status=status.HTTP_201_CREATED,
                message="Existing Drain created successfully.",
                data=ExistingDrainsSerializer(record).data,
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