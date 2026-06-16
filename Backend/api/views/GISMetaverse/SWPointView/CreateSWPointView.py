from ...common_imports import *


class CreateSWPointView(viewsets.ViewSet):
    queryset = SWPoint.objects.all()
    serializer_class = SWPointSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        try:
            serializer = SWPointSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            obj = serializer.save()

            return ApiResponse(
                status=status.HTTP_201_CREATED,
                message="SW Point created successfully.",
                data=SWPointSerializer(obj).data,
                http_status=status.HTTP_201_CREATED,
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
                status=status.HTTP_400_BAD_REQUEST,
                message="Exception error.",
                data=str(e),
                http_status=status.HTTP_400_BAD_REQUEST,
            ).create_response()