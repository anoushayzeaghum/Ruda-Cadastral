from ...common_imports import *


class CreateKalaKhataiInterchangeView(viewsets.ViewSet):
    queryset = KalaKhataiInterchange.objects.all()
    serializer_class = KalaKhataiInterchangeSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        try:
            serializer = KalaKhataiInterchangeSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            record = serializer.save()

            return ApiResponse(
                status=status.HTTP_201_CREATED,
                message="KalaKhataiInterchange created successfully.",
                data=KalaKhataiInterchangeSerializer(record).data,
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
